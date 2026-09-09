import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { initDB, readDB, saveUpload, readUpload, usePostgres } from './db.js';

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

const storage = usePostgres
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, genFilename(file.originalname))
    });
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format foto harus JPG, PNG, atau WEBP'));
    }
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDB().catch(err => console.error('DB init warning:', err.message));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded photos: dari PostgreSQL (persisten) atau folder statis (lokal)
if (usePostgres) {
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

// Photo upload endpoint
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah' });
    }
    const filename = usePostgres ? genFilename(req.file.originalname) : req.file.filename;
    if (usePostgres) {
      await saveUpload(filename, req.file.buffer, req.file.mimetype);
    }
    const url = `/uploads/${filename}`;
    res.status(201).json({ success: true, url, message: 'Foto berhasil diunggah' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan foto: ' + err.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    name: 'SIAD IPNU IPPNU Desa API',
    timestamp: new Date().toISOString() 
  });
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

  // Member stats
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

  // Finances stats
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

  // Letter stats
  const totalLetters = letters.length;
  const outgoingLetters = letters.filter(l => l.type === 'Keluar').length;
  const incomingLetters = letters.filter(l => l.type === 'Masuk').length;

  // Upcoming events
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.date >= today || e.status !== 'Selesai')
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
      recentLetters: letters.slice(0, 5),
      recentTransactions: finances.slice(0, 5),
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

// Multer / upload error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Ukuran foto maksimal 5 MB' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
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

