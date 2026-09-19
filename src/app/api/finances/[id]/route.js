import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

export async function PUT(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const db = await readDB();
    const finances = db.finances || [];
    const index = finances.findIndex(f => f.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const updatable = ['date', 'organization', 'type', 'category', 'amount', 'description', 'receiptNo', 'receiptUrl'];
    updatable.forEach(key => {
      if (body[key] !== undefined) finances[index][key] = body[key];
    });

    await writeDBChecked(db);
    return NextResponse.json({ success: true, data: finances[index], message: 'Transaksi kas berhasil diperbarui' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const db = await readDB();
    const finances = db.finances || [];
    const index = finances.findIndex(f => f.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    finances.splice(index, 1);
    db.finances = finances;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, message: 'Transaksi kas berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
