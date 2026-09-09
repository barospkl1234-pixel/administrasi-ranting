import express from 'express';
import { readDB, writeDB } from '../db.js';

const router = express.Router();

// GET financial transactions and summary balances
router.get('/', (req, res) => {
  const db = readDB();
  let list = db.finances || [];
  const { org, type, search } = req.query;

  if (org && org !== 'ALL') {
    list = list.filter(f => f.organization === org);
  }
  if (type) {
    list = list.filter(f => f.type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(f => 
      f.description.toLowerCase().includes(q) || 
      f.category.toLowerCase().includes(q) ||
      (f.receiptNo && f.receiptNo.toLowerCase().includes(q))
    );
  }

  // Calculate balances
  const allFinances = db.finances || [];
  const summary = {
    ipnuIncome: 0,
    ipnuExpense: 0,
    ipnuBalance: 0,
    ippnuIncome: 0,
    ippnuExpense: 0,
    ippnuBalance: 0,
    jointIncome: 0,
    jointExpense: 0,
    jointBalance: 0,
    totalBalance: 0
  };

  allFinances.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.organization === 'IPNU') {
      if (item.type === 'income') summary.ipnuIncome += amt;
      else summary.ipnuExpense += amt;
    } else if (item.organization === 'IPPNU') {
      if (item.type === 'income') summary.ippnuIncome += amt;
      else summary.ippnuExpense += amt;
    } else {
      // BERSAMA
      if (item.type === 'income') summary.jointIncome += amt;
      else summary.jointExpense += amt;
    }
  });

  summary.ipnuBalance = summary.ipnuIncome - summary.ipnuExpense;
  summary.ippnuBalance = summary.ippnuIncome - summary.ippnuExpense;
  summary.jointBalance = summary.jointIncome - summary.jointExpense;
  summary.totalBalance = summary.ipnuBalance + summary.ippnuBalance + summary.jointBalance;

  // Sort descending by date
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, data: list, summary });
});

// CREATE financial transaction
router.post('/', (req, res) => {
  const db = readDB();
  const finances = db.finances || [];

  const nextNum = finances.length + 1;
  const newId = `TRX-${String(nextNum).padStart(3, '0')}`;
  const prefix = req.body.type === 'income' ? 'KAS-IN' : 'KAS-OUT';
  const receiptNo = req.body.receiptNo || `${prefix}-${String(nextNum).padStart(3, '0')}`;

  const newTransaction = {
    id: newId,
    date: req.body.date || new Date().toISOString().split('T')[0],
    organization: req.body.organization || 'IPNU',
    type: req.body.type || 'income', // income or expense
    category: req.body.category || 'Iuran Anggota',
    amount: Number(req.body.amount) || 0,
    description: req.body.description || '',
    receiptNo: receiptNo,
    createdAt: new Date().toISOString()
  };

  finances.unshift(newTransaction);
  db.finances = finances;
  writeDB(db);

  res.status(201).json({ success: true, data: newTransaction, message: 'Transaksi kas berhasil dicatat' });
});

// DELETE transaction
router.delete('/:id', (req, res) => {
  const db = readDB();
  const finances = db.finances || [];
  const index = finances.findIndex(f => f.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
  }

  finances.splice(index, 1);
  db.finances = finances;
  writeDB(db);

  res.json({ success: true, message: 'Transaksi kas berhasil dihapus' });
});

export default router;

