import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_DIR = path.join(__dirname, '..');
const STORE_KEYS = ['settings', 'members', 'letters', 'finances', 'events', 'inventory'];

function loadEnv() {
  const candidates = [
    path.join(SERVER_DIR, '.env'),
    path.join(SERVER_DIR, '..', '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      if (!(m[1] in process.env) && val) process.env[m[1]] = val;
    }
    break;
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL belum diset.');
  console.error('   Buat database PostgreSQL (Vercel Postgres / Neon / Supabase), lalu isi DATABASE_URL.');
  console.error('   Contoh: set DATABASE_URL=postgresql://user:pass@host:5432/db  lalu jalankan script ini.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: String(process.env.DATABASE_SSL).toLowerCase() === 'false' ? false : { rejectUnauthorized: false },
});

async function ensureSchema() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS siad_store (key TEXT PRIMARY KEY, value JSONB NOT NULL);`
  );
  await pool.query(
    `CREATE TABLE IF NOT EXISTS siad_uploads (
      name TEXT PRIMARY KEY,
      data BYTEA NOT NULL,
      mime TEXT NOT NULL DEFAULT 'image/jpeg',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`
  );
}

async function migrateStore() {
  const storeFile = path.join(SERVER_DIR, 'data', 'store.json');
  if (!fs.existsSync(storeFile)) {
    console.log('⚠️  server/data/store.json tidak ditemukan. Lewati migrasi data.');
    return;
  }
  const data = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
  for (const key of STORE_KEYS) {
    const value = data[key] === undefined ? (key === 'settings' ? {} : []) : data[key];
    await pool.query(
      `INSERT INTO siad_store (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, JSON.stringify(value)]
    );
  }
  console.log(`✅ siad_store: key ${STORE_KEYS.join(', ')} berhasil dimigrasikan.`);
}

async function migrateUploads() {
  const uploadsDir = path.join(SERVER_DIR, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('⚠️  server/uploads tidak ditemukan. Lewati migrasi foto.');
    return;
  }
  const files = fs.readdirSync(uploadsDir).filter((f) => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('⚠️  Tidak ada file di server/uploads.');
    return;
  }
  const mimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  for (const f of files) {
    const buffer = fs.readFileSync(path.join(uploadsDir, f));
    const mime = mimeMap[path.extname(f).toLowerCase()] || 'image/jpeg';
    await pool.query(
      `INSERT INTO siad_uploads (name, data, mime) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime, created_at = now()`,
      [f, buffer, mime]
    );
  }
  console.log(`✅ siad_uploads: ${files.length} foto berhasil dimigrasikan.`);
}

async function main() {
  console.log('🔄 Memulai migrasi data lokal ke PostgreSQL...');
  await ensureSchema();
  await migrateStore();
  await migrateUploads();
  console.log('🎉 Migrasi selesai. Data kini tersimpan permanen di PostgreSQL dan tidak akan hilang saat redeploy Vercel.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Migrasi gagal:', err.message);
  process.exit(1);
});