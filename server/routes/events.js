import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();
const wrap = fn => (req, res) => fn(req, res).catch(err => res.status(500).json({ success: false, message: err.message }));

// GET all events
router.get('/', wrap(async (req, res) => {
  const db = await readDB();
  let list = db.events || [];
  const { org, search } = req.query;

  if (org && org !== 'ALL') {
    list = list.filter(e => e.organization === org || e.organization === 'BERSAMA');
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.location.toLowerCase().includes(q)
    );
  }

  // Populate attendee names for convenience
  const memberMap = new Map((db.members || []).map(m => [m.id, m]));
  const populated = list.map(evt => ({
    ...evt,
    attendeeList: (evt.attendees || []).map(id => memberMap.get(id)).filter(Boolean)
  }));

  res.json({ success: true, data: populated });
}));

// CREATE event
router.post('/', wrap(async (req, res) => {
  const db = await readDB();
  const events = db.events || [];

  const nextNum = events.length + 1;
  const newId = `EVT-${String(nextNum).padStart(3, '0')}`;

  const newEvent = {
    id: newId,
    title: req.body.title,
    organization: req.body.organization || 'BERSAMA',
    date: req.body.date || new Date().toISOString().split('T')[0],
    time: req.body.time || '19:30 WIB - Selesai',
    location: req.body.location || 'Gedung TPQ Ranting',
    pic: req.body.pic || 'Ketua IPNU / IPPNU',
    description: req.body.description || '',
    status: req.body.status || 'Akan Datang',
    attendees: req.body.attendees || [],
    createdAt: new Date().toISOString()
  };

  events.unshift(newEvent);
  db.events = events;
  await writeDB(db);

  res.status(201).json({ success: true, data: newEvent, message: 'Agenda kegiatan berhasil ditambahkan' });
}));

// UPDATE event (status selesai / data lainnya)
router.patch('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const events = db.events || [];
  const event = events.find(e => e.id === req.params.id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
  }

  const allowed = ['title', 'organization', 'date', 'time', 'location', 'pic', 'description', 'status'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  await writeDB(db);

  res.json({ success: true, data: event, message: 'Status kegiatan berhasil diperbarui' });
}));

// TOGGLE member attendance in event
router.post('/:id/attendance', wrap(async (req, res) => {
  const db = await readDB();
  const events = db.events || [];
  const event = events.find(e => e.id === req.params.id);

  if (!event) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
  }

  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ success: false, message: 'Member ID wajib diisi' });
  }

  event.attendees = event.attendees || [];
  const idx = event.attendees.indexOf(memberId);
  let isAttending = false;

  if (idx > -1) {
    // Remove
    event.attendees.splice(idx, 1);
    isAttending = false;
  } else {
    // Add
    event.attendees.push(memberId);
    isAttending = true;
  }

  await writeDB(db);

  res.json({ 
    success: true, 
    isAttending, 
    attendeeCount: event.attendees.length,
    message: isAttending ? 'Presensi berhasil dicatat (Hadir)' : 'Status presensi dibatalkan' 
  });
}));

// DELETE event
router.delete('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const events = db.events || [];
  const index = events.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
  }

  events.splice(index, 1);
  db.events = events;
  await writeDB(db);

  res.json({ success: true, message: 'Kegiatan berhasil dihapus' });
}));

export default router;