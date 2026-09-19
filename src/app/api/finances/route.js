import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId, todayWIB } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const month = searchParams.get('month');

    const db = await readDB();
    let list = db.finances || [];

    if (org && org !== 'ALL') {
      list = list.filter(f => f.organization === org);
    }
    if (type) {
      list = list.filter(f => f.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => 
        (f.description && f.description.toLowerCase().includes(q)) || 
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.receiptNo && f.receiptNo.toLowerCase().includes(q))
      );
    }
    if (month) {
      list = list.filter(f => f.date && f.date.startsWith(month));
    }

    // Calculate balances (filtered by same params)
    let summaryList = db.finances || [];
    if (org && org !== 'ALL') {
      summaryList = summaryList.filter(f => f.organization === org);
    }
    if (month) {
      summaryList = summaryList.filter(f => f.date && f.date.startsWith(month));
    }

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

    summaryList.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.organization === 'IPNU') {
        if (item.type === 'income') summary.ipnuIncome += amt;
        else summary.ipnuExpense += amt;
      } else if (item.organization === 'IPPNU') {
        if (item.type === 'income') summary.ippnuIncome += amt;
        else summary.ippnuExpense += amt;
      } else {
        if (item.type === 'income') summary.jointIncome += amt;
        else summary.jointExpense += amt;
      }
    });

    summary.ipnuBalance = summary.ipnuIncome - summary.ipnuExpense;
    summary.ippnuBalance = summary.ippnuIncome - summary.ippnuExpense;
    summary.jointBalance = summary.jointIncome - summary.jointExpense;
    summary.totalBalance = summary.ipnuBalance + summary.ippnuBalance + summary.jointBalance;

    list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    return NextResponse.json({ success: true, data: list, summary });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const db = await readDB();
    const finances = db.finances || [];

    const newId = generateId('TRX-', finances);
    const prefix = body.type === 'income' ? 'KAS-IN' : 'KAS-OUT';
    const receiptNo = body.receiptNo || `${prefix}-${newId.slice(4)}`;

    const newTransaction = {
      id: newId,
      date: body.date || todayWIB(),
      organization: body.organization || 'IPNU',
      type: body.type || 'income',
      category: body.category || 'Iuran Anggota',
      amount: Number(body.amount) || 0,
      description: body.description || '',
      receiptNo: receiptNo,
      receiptUrl: body.receiptUrl || '',
      createdAt: new Date().toISOString()
    };

    finances.unshift(newTransaction);
    db.finances = finances;
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: newTransaction, message: 'Transaksi kas berhasil dicatat' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
