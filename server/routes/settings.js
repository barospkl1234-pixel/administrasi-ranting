import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();
const wrap = fn => (req, res) => fn(req, res).catch(err => res.status(500).json({ success: false, message: err.message }));

// GET organization profile & settings
router.get('/', wrap(async (req, res) => {
  const db = await readDB();
  res.json({ success: true, data: db.settings || {} });
}));

// UPDATE settings
router.put('/', wrap(async (req, res) => {
  const db = await readDB();
  db.settings = {
    ...db.settings,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  await writeDB(db);
  res.json({ success: true, data: db.settings, message: 'Profil dan pengaturan ranting berhasil disimpan' });
}));

// EXPORT full backup
router.get('/export-backup', wrap(async (req, res) => {
  const db = await readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-ipnu-ippnu-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(db, null, 2));
}));

// IMPORT restore backup
router.post('/import-backup', wrap(async (req, res) => {
  const backupData = req.body;
  if (!backupData || !backupData.members || !backupData.settings) {
    return res.status(400).json({ success: false, message: 'Format data backup tidak valid' });
  }
  await writeDB(backupData);
  res.json({ success: true, message: 'Data cadangan (backup) berhasil dipulihkan' });
}));

export default router;