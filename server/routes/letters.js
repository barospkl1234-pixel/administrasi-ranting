import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Helper to generate official letter number based on Pedoman Administrasi (PA) IPNU / IPPNU
function generateLetterNumber(org, typeCategory, codeDept, db) {
  const settings = db.settings || {};
  const codeIpnu = settings.codeIpnu || '7354';
  const codeIppnu = settings.codeIppnu || '7455';
  
  const now = new Date();
  const romanMonth = ROMAN_MONTHS[now.getMonth()];
  const yearShort = String(now.getFullYear()).slice(-2);

  // Count outgoing letters this year for this org
  const outgoing = (db.letters || []).filter(l => l.type === 'Keluar' && (org === 'BERSAMA' ? l.organization === 'BERSAMA' : l.organization === org));
  const seq = String(outgoing.length + 1).padStart(3, '0');

  let orgPrefix = 'PR';
  let wilCode = codeIpnu;

  if (org === 'IPPNU') {
    orgPrefix = 'PR';
    wilCode = codeIppnu;
  } else if (org === 'BERSAMA') {
    orgPrefix = 'PR-PR';
    wilCode = `${codeIpnu}-${codeIppnu}`;
  }

  // Example: 016/PR/A/Sek/7354/IX/26
  return `${seq}/${orgPrefix}/${typeCategory}/${codeDept}/${wilCode}/${romanMonth}/${yearShort}`;
}

// GET all letters
router.get('/', (req, res) => {
  const db = readDB();
  let list = db.letters || [];
  const { org, type, search } = req.query;

  if (org && org !== 'ALL') {
    list = list.filter(l => l.organization === org);
  }
  if (type) {
    list = list.filter(l => l.type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(l => 
      l.letterNumber.toLowerCase().includes(q) || 
      l.subject.toLowerCase().includes(q) ||
      (l.recipientOrSender && l.recipientOrSender.toLowerCase().includes(q))
    );
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, data: list });
});

// GET generated letter number suggestion
router.get('/generate-number', (req, res) => {
  const db = readDB();
  const { org = 'IPNU', category = 'A', dept = 'Sek' } = req.query;
  const suggestedNumber = generateLetterNumber(org, category, dept, db);
  res.json({ success: true, number: suggestedNumber });
});

// CREATE letter
router.post('/', (req, res) => {
  const db = readDB();
  const letters = db.letters || [];
  
  const nextNum = letters.length + 1;
  const newId = `LTR-${String(nextNum).padStart(3, '0')}`;

  const newLetter = {
    id: newId,
    letterNumber: req.body.letterNumber || generateLetterNumber(req.body.organization || 'IPNU', req.body.category || 'A', req.body.dept || 'Sek', db),
    organization: req.body.organization || 'IPNU',
    type: req.body.type || 'Keluar', // Keluar or Masuk
    category: req.body.category || 'A', // A = Internal, B = Eksternal
    subject: req.body.subject,
    recipientOrSender: req.body.recipientOrSender || '',
    date: req.body.date || new Date().toISOString().split('T')[0],
    content: req.body.content || '',
    status: req.body.status || (req.body.type === 'Masuk' ? 'Diarsipkan' : 'Terkirim'),
    signatory: req.body.signatory || 'Ketua & Sekretaris',
    createdAt: new Date().toISOString()
  };

  letters.unshift(newLetter);
  db.letters = letters;
  writeDB(db);

  res.status(201).json({ success: true, data: newLetter, message: 'Surat berhasil dicatat/diterbitkan' });
});

// DELETE letter
router.delete('/:id', (req, res) => {
  const db = readDB();
  const letters = db.letters || [];
  const index = letters.findIndex(l => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Surat tidak ditemukan' });
  }

  letters.splice(index, 1);
  db.letters = letters;
  writeDB(db);

  res.json({ success: true, message: 'Surat berhasil dihapus' });
});

export default router;

