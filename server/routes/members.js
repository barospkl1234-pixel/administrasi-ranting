import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();

// GET all members with optional filtering
router.get('/', (req, res) => {
  const db = readDB();
  let list = db.members || [];
  const { org, search, dusun, cadre } = req.query;

  if (org && org !== 'ALL') {
    list = list.filter(m => m.organization === org);
  }
  if (dusun) {
    list = list.filter(m => m.dusun === dusun);
  }
  if (cadre) {
    list = list.filter(m => m.cadreLevel === cadre);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.nik && m.nik.includes(q)) || 
      (m.position && m.position.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list });
});

// GET single member
router.get('/:id', (req, res) => {
  const db = readDB();
  const member = (db.members || []).find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }
  res.json({ success: true, data: member });
});

// CREATE new member
router.post('/', (req, res) => {
  const db = readDB();
  const members = db.members || [];
  
  // Generate ID
  const nextNum = members.length + 1;
  const newId = `KDR-${String(nextNum).padStart(3, '0')}`;

  const newMember = {
    id: newId,
    nik: req.body.nik || '',
    name: req.body.name,
    organization: req.body.organization || 'IPNU',
    gender: req.body.gender || (req.body.organization === 'IPNU' ? 'L' : 'P'),
    pob: req.body.pob || 'Pekalongan',
    dob: req.body.dob || '2005-01-01',
    phone: req.body.phone || '',
    dusun: req.body.dusun || 'Dusun I Krajan',
    rt: req.body.rt || '01',
    rw: req.body.rw || '01',
    education: req.body.education || 'Pelajar',
    position: req.body.position || 'Anggota',
    cadreLevel: req.body.cadreLevel || 'Calon Anggota',
    status: req.body.status || 'Aktif',
    joinedYear: parseInt(req.body.joinedYear, 10) || new Date().getFullYear(),
    photo: req.body.photo || (req.body.gender === 'L' ? 
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' : 
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
    createdAt: new Date().toISOString()
  };

  members.push(newMember);
  db.members = members;
  writeDB(db);

  res.status(201).json({ success: true, data: newMember, message: 'Data kader berhasil ditambahkan' });
});

// UPDATE member
router.put('/:id', (req, res) => {
  const db = readDB();
  const members = db.members || [];
  const index = members.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }

  const updated = {
    ...members[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  members[index] = updated;
  db.members = members;
  writeDB(db);

  res.json({ success: true, data: updated, message: 'Data kader berhasil diperbarui' });
});

// DELETE member
router.delete('/:id', (req, res) => {
  const db = readDB();
  const members = db.members || [];
  const index = members.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }

  members.splice(index, 1);
  db.members = members;
  writeDB(db);

  res.json({ success: true, message: 'Data kader berhasil dihapus' });
});

export default router;

