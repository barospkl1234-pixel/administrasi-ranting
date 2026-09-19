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
    const inventory = db.inventory || [];
    const index = inventory.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Barang tidak ditemukan' }, { status: 404 });
    }

    const updated = {
      ...inventory[index],
      ...body,
      id: inventory[index].id,
      quantity: Number(body.quantity) || inventory[index].quantity,
      updatedAt: new Date().toISOString()
    };

    inventory[index] = updated;
    db.inventory = inventory;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, data: updated, message: 'Data inventaris berhasil diperbarui' });
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
    const inventory = db.inventory || [];
    const index = inventory.findIndex(i => i.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Barang tidak ditemukan' }, { status: 404 });
    }

    inventory.splice(index, 1);
    db.inventory = inventory;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
