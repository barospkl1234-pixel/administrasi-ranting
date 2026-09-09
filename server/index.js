import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, readDB } from './db.js';

import membersRouter from './routes/members.js';
import lettersRouter from './routes/letters.js';
import financesRouter from './routes/finances.js';
import eventsRouter from './routes/events.js';
import inventoryRouter from './routes/inventory.js';
import settingsRouter from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    name: 'SIAD IPNU IPPNU Desa API',
    timestamp: new Date().toISOString() 
  });
});

// Dashboard Overview Aggregated Route
app.get('/api/dashboard', (req, res) => {
  const db = readDB();
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

app.listen(PORT, () => {
  console.log(`🚀 SIAD IPNU IPPNU Server running on http://localhost:${PORT}`);
});

