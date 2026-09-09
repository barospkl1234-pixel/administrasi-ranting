import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();

// GET organization profile & settings
router.get('/', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.settings || {} });
});

// UPDATE settings
router.put('/', (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeDB(db);
  res.json({ success: true, data: db.settings, message: 'Profil dan pengaturan ranting berhasil disimpan' });
});

// EXPORT full backup
router.get('/export-backup', (req, res) => {
  const db = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-ipnu-ippnu-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// IMPORT restore backup
router.post('/import-backup', (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData || !backupData.members || !backupData.settings) {
      return res.status(400).json({ success: false, message: 'Format data backup tidak valid' });
    }
    writeDB(backupData);
    res.json({ success: true, message: 'Data cadangan (backup) berhasil dipulihkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memulihkan backup: ' + err.message });
  }
});

export default router;

