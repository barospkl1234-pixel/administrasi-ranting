import fs from 'fs';
import os from 'os';
import path from 'path';
import pg from 'pg';
import { Redis } from '@upstash/redis';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SERVER_DATA_FILE = path.join(ROOT_DIR, 'server', 'data', 'store.json');

// ----- Storage backend selection -----
// Priority: Vercel KV / Upstash Redis > PostgreSQL > Local JSON file
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useVercelKV = !!(KV_URL && KV_TOKEN);
const usePostgres = !useVercelKV && !!process.env.DATABASE_URL;

const STORE_KEYS = ['settings', 'members', 'letters', 'finances', 'events', 'inventory'];

// ----- Vercel KV / Upstash Redis -----
let _kv = null;
function getKV() {
  if (!useVercelKV) return null;
  if (!_kv) {
    _kv = new Redis({ url: KV_URL, token: KV_TOKEN });
  }
  return _kv;
}

// ----- PostgreSQL storage -----
let _pool = null;
function getPool() {
  if (!usePostgres) return null;
  if (!_pool) {
    const config = { connectionString: process.env.DATABASE_URL };
    if (String(process.env.DATABASE_SSL).toLowerCase() === 'false') {
      config.ssl = false;
    } else {
      config.ssl = { rejectUnauthorized: false };
    }
    _pool = new pg.Pool(config);
  }
  return _pool;
}

async function ensurePgSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS siad_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS siad_uploads (
      name TEXT PRIMARY KEY,
      data BYTEA NOT NULL,
      mime TEXT NOT NULL DEFAULT 'image/jpeg',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Writable target for the database file
function getWritableFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return DATA_FILE;
  } catch {
    const tmp = process.env.TMPDIR || os.tmpdir();
    return path.join(tmp, 'siad-store.json');
  }
}

// Initial seed data fallback
const DEFAULT_STORE = {
  settings: {
    villageName: "Kalibaros",
    subDistrict: "Pekalongan Timur",
    district: "Kota Pekalongan",
    province: "Jawa Tengah",
    postCode: "51128",
    secretariatAddress: "Sekretariat Bersama PR IPNU IPPNU, Kel. Kalibaros, Kec. Pekalongan Timur, Kota Pekalongan",
    period: "2025 - 2027",
    codeIpnu: "7354",
    codeIppnu: "7455",
    leaderIpnu: "Rekan Ahmad Fauzi",
    leaderIppnu: "Rekanita Siti Nur Halizah",
    viceLeaderIpnu: "",
    viceLeaderIppnu: "",
    secretaryIpnu: "Rekan Muhammad Rifqi",
    secretaryIppnu: "Rekanita Dewi Lestari",
    treasurerIpnu: "Rekan Bagus Setiawan",
    treasurerIppnu: "Rekanita Anisa Rahmawati",
    cbpCommander: "Komandan Ilham Prasetyo",
    kppCommander: "Komandan Putri Ayu",
    phoneContact: "0812-3456-7890",
    emailContact: "ipnuippnubaros@gmail.com"
  },
  members: [],
  letters: [],
  finances: [],
  events: [],
  inventory: []
};

function getSeedStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    if (fs.existsSync(SERVER_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(SERVER_DATA_FILE, 'utf-8'));
    }
    return DEFAULT_STORE;
  } catch {
    return DEFAULT_STORE;
  }
}

// ---------- Initialize ----------
export async function initDB() {
  if (useVercelKV) {
    const kv = getKV();
    const existing = await kv.get('siad:settings');
    if (!existing) {
      const seed = getSeedStore();
      for (const key of STORE_KEYS) {
        await kv.set(`siad:${key}`, seed[key] || DEFAULT_STORE[key]);
      }
      console.log('Vercel KV: seeded initial data');
    }
    return;
  }

  if (usePostgres) {
    await ensurePgSchema(getPool());
    return;
  }

  // Local file fallback
  const target = getWritableFile();
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(target)) {
    const seed = getSeedStore();
    fs.writeFileSync(target, JSON.stringify(seed, null, 2), 'utf-8');
  }
}

// ---------- Read ----------
export async function readDB() {
  if (useVercelKV) {
    const kv = getKV();
    const store = {};
    for (const key of STORE_KEYS) {
      store[key] = await kv.get(`siad:${key}`);
      if (store[key] === null) {
        const seed = getSeedStore();
        store[key] = seed[key] || DEFAULT_STORE[key];
        await kv.set(`siad:${key}`, store[key]);
      }
    }
    return store;
  }

  if (usePostgres) {
    const { rows } = await getPool().query('SELECT key, value FROM siad_store');
    if (rows.length === 0) {
      const seed = getSeedStore();
      await writeDB(seed);
      return seed;
    }
    const store = {};
    rows.forEach(r => { store[r.key] = r.value; });
    return store;
  }

  // Local file
  try {
    await initDB();
    const target = getWritableFile();
    if (fs.existsSync(target)) {
      const raw = fs.readFileSync(target, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB from writable file:', err);
  }

  // Fallback to seed
  try {
    return getSeedStore();
  } catch (err2) {
    console.error('Error reading seeded DB:', err2);
    throw new Error('Database tidak dapat dibaca.');
  }
}

// ---------- Write ----------
let _writeLock = Promise.resolve();

export async function writeDB(data) {
  if (useVercelKV) {
    const kv = getKV();
    for (const key of STORE_KEYS) {
      const value = data[key] === undefined ? (key === 'settings' ? {} : []) : data[key];
      await kv.set(`siad:${key}`, value);
    }
    return true;
  }

  if (usePostgres) {
    const pool = getPool();
    for (const key of STORE_KEYS) {
      const value = data[key] === undefined ? (key === 'settings' ? {} : []) : data[key];
      await pool.query(
        `INSERT INTO siad_store (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)]
      );
    }
    return true;
  }

  // Local file — serialized with a lock to avoid lost updates on concurrent writes
  _writeLock = _writeLock.then(async () => {
    try {
      await initDB();
      const target = getWritableFile();
      const tempFile = `${target}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, target);
      return true;
    } catch (err) {
      console.error('Error writing DB:', err);
      return false;
    }
  });
  return _writeLock;
}

// Write + throw on failure
export async function writeDBChecked(data) {
  const ok = await writeDB(data);
  if (!ok) throw new Error('Gagal menyimpan data ke database');
  return true;
}

// ---------- Upload (file/photo persistence) ----------
export async function saveUpload(name, buffer, mime) {
  if (useVercelKV) {
    const kv = getKV();
    const b64 = Buffer.from(buffer).toString('base64');
    await kv.set(`siad:upload:${name}`, { b64, mime });
    return true;
  }

  if (usePostgres) {
    await getPool().query(
      `INSERT INTO siad_uploads (name, data, mime) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime, created_at = now()`,
      [name, buffer, mime]
    );
    return true;
  }

  // Local uploads folder
  try {
    const uploadsDir = path.join(ROOT_DIR, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, name), buffer);
    return true;
  } catch (err) {
    console.error('Error saving upload locally:', err);
    return false;
  }
}

export async function readUpload(name) {
  if (useVercelKV) {
    const kv = getKV();
    const entry = await kv.get(`siad:upload:${name}`);
    if (!entry) return null;
    return {
      buffer: Buffer.from(entry.b64, 'base64'),
      mime: entry.mime
    };
  }

  if (usePostgres) {
    const { rows } = await getPool().query('SELECT data, mime FROM siad_uploads WHERE name = $1', [name]);
    if (rows.length === 0) return null;
    return { buffer: rows[0].data, mime: rows[0].mime };
  }

  // Local filesystem
  try {
    const uploadsDir = path.join(ROOT_DIR, 'public', 'uploads');
    const filePath = path.join(uploadsDir, name);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(name).toLowerCase();
      const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
      };
      return { buffer, mime: mimeMap[ext] || 'application/octet-stream' };
    }
    return null;
  } catch {
    return null;
  }
}

export { usePostgres, useVercelKV };

// ---- Helpers shared by API routes ----
let _ready = null;
export function getDbReady() {
  if (!_ready) _ready = initDB();
  return _ready;
}

export function generateId(prefix = 'ID') {
  return `${prefix}${Date.now()}${Math.round(Math.random() * 1e6)}`;
}

export function todayWIB() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}
