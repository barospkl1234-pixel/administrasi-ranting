import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

export async function GET(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const db = await readDB();
    const member = (db.members || []).find(m => m.id === id);

    if (!member) {
      return NextResponse.json({ success: false, message: 'Kader tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: member });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const db = await readDB();
    const members = db.members || [];
    const index = members.findIndex(m => m.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Kader tidak ditemukan' }, { status: 404 });
    }

    const updated = {
      ...members[index],
      ...body,
      id: members[index].id,
      updatedAt: new Date().toISOString()
    };

    members[index] = updated;
    db.members = members;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, data: updated, message: 'Data kader berhasil diperbarui' });
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
    const members = db.members || [];
    const index = members.findIndex(m => m.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Kader tidak ditemukan' }, { status: 404 });
    }

    members.splice(index, 1);
    db.members = members;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, message: 'Data kader berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
