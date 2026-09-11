import express from 'express';
import { readDB, writeDBChecked, generateId } from '../db.js';

const router = express.Router();
const wrap = fn => (req, res) => fn(req, res).catch(err => res.status(500).json({ success: false, message: err.message }));

// GET all inventory
router.get('/', wrap(async (req, res) => {
  const db = await readDB();
  let list = db.inventory || [];
  const { category, condition, search } = req.query;

  if (category) {
    list = list.filter(i => i.category === category);
  }
  if (condition) {
    list = list.filter(i => i.condition === condition);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(i => 
      (i.name && i.name.toLowerCase().includes(q)) || 
      (i.code && i.code.toLowerCase().includes(q)) ||
      (i.location && i.location.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list });
}));

// CREATE inventory item
router.post('/', wrap(async (req, res) => {
  const db = await readDB();
  const inventory = db.inventory || [];

  const newId = generateId('INV-', inventory);
  const num = parseInt(newId.slice(4), 10);
  const code = req.body.code || `BRG-${String(num).padStart(2, '0')}`;

  const newItem = {
    id: newId,
    code: code,
    name: req.body.name,
    category: req.body.category || 'Perlengkapan',
    quantity: Number(req.body.quantity) || 1,
    unit: req.body.unit || 'Buah',
    condition: req.body.condition || 'Baik',
    location: req.body.location || 'Sekretariat',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };

  inventory.push(newItem);
  db.inventory = inventory;
  await writeDBChecked(db);

  res.status(201).json({ success: true, data: newItem, message: 'Barang inventaris berhasil dicatat' });
}));

// UPDATE inventory item
router.put('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const inventory = db.inventory || [];
  const index = inventory.findIndex(i => i.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
  }

  const updated = {
    ...inventory[index],
    ...req.body,
    id: inventory[index].id,
    quantity: Number(req.body.quantity) || inventory[index].quantity,
    updatedAt: new Date().toISOString()
  };

  inventory[index] = updated;
  db.inventory = inventory;
  await writeDBChecked(db);

  res.json({ success: true, data: updated, message: 'Data inventaris berhasil diperbarui' });
}));

// DELETE inventory item
router.delete('/:id', wrap(async (req, res) => {
  const db = await readDB();
  const inventory = db.inventory || [];
  const index = inventory.findIndex(i => i.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
  }

  inventory.splice(index, 1);
  db.inventory = inventory;
  await writeDBChecked(db);

  res.json({ success: true, message: 'Barang berhasil dihapus' });
}));

export default router;
