import express from 'express';
import { readDB, writeDBChecked, generateId, todayWIB } from '../db.js';

const router = express.Router();
const wrap = fn => (req, res) => fn(req, res).catch(err => res.status(500).json({ success: false, message: err.message }));

// GET all members with optional filtering
router.get('/', wrap(async (req, res) => {
  const db = await readDB();
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
      (m.name && m.name.toLowerCase().includes(q)) || 
      (m.studentStatus && m.studentStatus.toLowerCase().includes(q)) || 
      (m.position && m.position.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list });
}));

// GET single member
router.get('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const member = (db.members || []).find(m => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }
  res.json({ success: true, data: member });
}));

// CREATE new member
router.post('/', wrap(async (req, res) => {
  const db = await readDB();
  const members = db.members || [];
  
  const newId = generateId('KDR-', members);
  const gender = req.body.gender || (req.body.organization === 'IPNU' ? 'L' : 'P');

  const newMember = {
    id: newId,
    studentStatus: req.body.studentStatus || 'SMA',
    name: req.body.name,
    organization: req.body.organization || 'IPNU',
    gender: gender,
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
    photo: req.body.photo || (gender === 'L' ? 
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' : 
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
    createdAt: new Date().toISOString()
  };

  members.push(newMember);
  db.members = members;
  await writeDBChecked(db);

  res.status(201).json({ success: true, data: newMember, message: 'Data kader berhasil ditambahkan' });
}));

// UPDATE member
router.put('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const members = db.members || [];
  const index = members.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }

  const updated = {
    ...members[index],
    ...req.body,
    id: members[index].id,
    updatedAt: new Date().toISOString()
  };

  members[index] = updated;
  db.members = members;
  await writeDBChecked(db);

  res.json({ success: true, data: updated, message: 'Data kader berhasil diperbarui' });
}));

// DELETE member
router.delete('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const members = db.members || [];
  const index = members.findIndex(m => m.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kader tidak ditemukan' });
  }

  members.splice(index, 1);
  db.members = members;
  await writeDBChecked(db);

  res.json({ success: true, message: 'Data kader berhasil dihapus' });
}));

export default router;
