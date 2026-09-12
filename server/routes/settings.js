import express from 'express';
import { readDB, writeDBChecked } from '../db.js';

const router = express.Router();
const wrap = fn => (req, res) => fn(req, res).catch(err => res.status(500).json({ success: false, message: err.message }));

const REQUIRED_KEYS = ['settings', 'members', 'letters', 'finances', 'events', 'inventory'];

// GET organization profile & settings
router.get('/', wrap(async (req, res) => {
  const db = await readDB();
  res.json({ success: true, data: db.settings || {} });
}));

// UPDATE settings (whitelist allowed keys to prevent injection)
const ALLOWED_SETTINGS = [
  'villageName', 'subDistrict', 'district', 'province', 'postCode', 'secretariatAddress',
  'period', 'codeIpnu', 'codeIppnu',
  'leaderIpnu', 'leaderIppnu', 'leaderPhoneIpnu', 'leaderPhoneIppnu', 'viceLeaderIpnu', 'viceLeaderIppnu',
  'secretaryIpnu', 'secretaryIppnu', 'treasurerIpnu', 'treasurerIppnu',
  'cbpCommander', 'kppCommander', 'phoneContact', 'emailContact'
];

router.put('/', wrap(async (req, res) => {
  const db = await readDB();
  const filtered = {};
  ALLOWED_SETTINGS.forEach(key => {
    if (req.body[key] !== undefined) filtered[key] = req.body[key];
  });
  db.settings = {
    ...db.settings,
    ...filtered,
    updatedAt: new Date().toISOString()
  };
  await writeDBChecked(db);
  res.json({ success: true, data: db.settings, message: 'Profil dan pengaturan ranting berhasil disimpan' });
}));

// EXPORT full backup
router.get('/export-backup', wrap(async (req, res) => {
  const db = await readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-ipnu-ippnu-${new Date().toISOString().split('T')[0]}.json"`);
  res.send(JSON.stringify(db, null, 2));
}));

// IMPORT restore backup (merge with existing to prevent data loss)
router.post('/import-backup', wrap(async (req, res) => {
  const backupData = req.body;
  if (!backupData || !backupData.settings || !backupData.members) {
    return res.status(400).json({ success: false, message: 'Format data backup tidak valid' });
  }

  // Validate all required keys exist
  const missingKeys = REQUIRED_KEYS.filter(k => backupData[k] === undefined);
  if (missingKeys.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Backup tidak memiliki data berikut: ${missingKeys.join(', ')}`
    });
  }

  // Write with guaranteed-complete data
  const db = {};
  REQUIRED_KEYS.forEach(key => {
    db[key] = backupData[key];
  });
  await writeDBChecked(db);
  res.json({ success: true, message: 'Data cadangan (backup) berhasil dipulihkan' });
}));

export default router;
