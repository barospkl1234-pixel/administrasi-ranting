import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { initDB, readDB, saveUpload, readUpload, usePostgres, useVercelKV, getDbReady, generateId, todayWIB } from './db.js';

import membersRouter from './routes/members.js';
import lettersRouter from './routes/letters.js';
import financesRouter from './routes/finances.js';
import eventsRouter from './routes/events.js';
import inventoryRouter from './routes/inventory.js';
import settingsRouter from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory for member photos (fallback to tmp on read-only filesystems like Vercel)
const defaultUploadDir = path.join(__dirname, 'uploads');
let uploadDir = defaultUploadDir;
try {
  fs.accessSync(__dirname, fs.constants.W_OK);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch {
  uploadDir = process.env.TMPDIR || os.tmpdir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

// Multer config for photo uploads
function genFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

const useRemoteStorage = usePostgres || useVercelKV;

const storage = useRemoteStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, genFilename(file.originalname))
    });
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file harus JPG, PNG, WEBP, atau PDF'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure DB schema is ready before accepting requests
const dbReady = getDbReady().catch(err => console.error('DB init warning:', err.message));

// ----- Auth helpers (HMAC-based, no external dependencies) -----
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'PIMPINAN RANTING BAROS';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'pelajarnukotasantri';
const AUTH_SECRET = process.env.AUTH_SECRET || 'siad-ipnu-ippnu-ranting-secret-key-2025';

function signToken(username) {
  const payload = `${username}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) return false;
    const sig = parts.pop();
    const payload = parts.join(':');
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const username = parts[0];
    return username === AUTH_USERNAME;
  } catch {
    return false;
  }
}

// Auth middleware — hanya jalur /api yang sampai di sini; login, health, /uploads, dan file statis sudah
// didaftarkan lebih dulu, jadi tidak perlu pengecualian path (yang lama malah meloloskan semua request).
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login terlebih dahulu.' });
  }

  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid. Silakan login kembali.' });
  }

  next();
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded photos: dari Vercel KV/PostgreSQL (persisten) atau folder statis (lokal)
if (useRemoteStorage) {
  app.get('/uploads/:name', async (req, res) => {
    try {
      const file = await readUpload(req.params.name);
      if (!file) {
        return res.status(404).json({ success: false, message: 'Foto tidak ditemukan' });
      }
      res.setHeader('Content-Type', file.mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(file.buffer);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
} else {
  app.use('/uploads', express.static(uploadDir));
}

// Photo/file upload endpoint (dibawah auth — lihat pemanggilannya setelah requireAuth)

// ----- Auth routes -----
app.post('/api/auth/login', async (req, res) => {
  await dbReady;
  const { username, password } = req.body || {};
  if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
  const token = signToken(username);
  res.json({ success: true, token, message: 'Login berhasil' });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    name: 'SIAD IPNU IPPNU Desa API',
    timestamp: new Date().toISOString() 
  });
});

// Apply auth middleware to API routes (after login & health)
app.use('/api', requireAuth);

// Photo/file upload endpoint (dilindungi auth)
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }
    const filename = useRemoteStorage ? genFilename(req.file.originalname) : req.file.filename;
    if (useRemoteStorage) {
      await saveUpload(filename, req.file.buffer, req.file.mimetype);
    }
    const url = `/uploads/${filename}`;
    const isPdf = req.file.mimetype === 'application/pdf' || path.extname(req.file.originalname).toLowerCase() === '.pdf';
    res.status(201).json({ success: true, url, type: isPdf ? 'pdf' : 'image', message: 'File berhasil diunggah' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan file: ' + err.message });
  }
});

// Dashboard Overview Aggregated Route
app.get('/api/dashboard', async (req, res) => {
  try {
    const db = await readDB();
    const members = db.members || [];
    const letters = db.letters || [];
    const finances = db.finances || [];
    const events = db.events || [];
    const inventory = db.inventory || [];

  const totalMembers = members.length;
  const ipnuCount = members.filter(m => m.organization === 'IPNU').length;
  const ippnuCount = members.filter(m => m.organization === 'IPPNU').length;

  const cadreDistribution = {
    'Calon Anggota': 0,
    'MAKESTA': 0,
    'LAKMUD': 0,
    'LAKUT': 0,
    'DIKLATAMA': 0
  };

  members.forEach(m => {
    const lvl = m.cadreLevel || 'Calon Anggota';
    if (cadreDistribution[lvl] !== undefined) {
      cadreDistribution[lvl]++;
    } else {
      cadreDistribution[lvl] = 1;
    }
  });

  let ipnuBalance = 0;
  let ippnuBalance = 0;
  let jointBalance = 0;

  finances.forEach(f => {
    const amt = Number(f.amount) || 0;
    if (f.organization === 'IPNU') {
      ipnuBalance += (f.type === 'income' ? amt : -amt);
    } else if (f.organization === 'IPPNU') {
      ippnuBalance += (f.type === 'income' ? amt : -amt);
    } else {
      jointBalance += (f.type === 'income' ? amt : -amt);
    }
  });

  const totalLetters = letters.length;
  const outgoingLetters = letters.filter(l => l.type === 'Keluar').length;
  const incomingLetters = letters.filter(l => l.type === 'Masuk').length;

  // Fixed: use && instead of || for upcoming events filter
  const today = todayWIB();
  const upcomingEvents = events
    .filter(e => e.date >= today && e.status !== 'Selesai')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      stats: {
        totalMembers,
        ipnuCount,
        ippnuCount,
        cadreDistribution,
        ipnuBalance,
        ippnuBalance,
        jointBalance,
        totalBalance: ipnuBalance + ippnuBalance + jointBalance,
        totalLetters,
        outgoingLetters,
        incomingLetters,
        inventoryCount: inventory.length
      },
      upcomingEvents,
      recentLetters: letters.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5),
      recentTransactions: finances.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5),
      settings: db.settings
    }
  });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mount Routes
app.use('/api/members', membersRouter);
app.use('/api/letters', lettersRouter);
app.use('/api/finances', financesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/settings', settingsRouter);

// Serve client in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('API Server is running. Client not yet built.');
  });
});

// Error handler — differentiate client vs server errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Ukuran file maksimal 10 MB' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message || 'Terjadi kesalahan server' });
  }
  next();
});

export const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`🚀 SIAD IPNU IPPNU Server running on http://localhost:${PORT}`);
  });
}

export default app;
