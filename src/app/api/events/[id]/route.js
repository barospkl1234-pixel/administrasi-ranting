import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

export async function PATCH(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const db = await readDB();
    const events = db.events || [];
    const event = events.find(e => e.id === id);

    if (!event) {
      return NextResponse.json({ success: false, message: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const allowed = ['title', 'organization', 'date', 'time', 'location', 'pic', 'description', 'status'];
    allowed.forEach(field => {
      if (body[field] !== undefined) event[field] = body[field];
    });

    await writeDBChecked(db);
    return NextResponse.json({ success: true, data: event, message: 'Status kegiatan berhasil diperbarui' });
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
    const events = db.events || [];
    const index = events.findIndex(e => e.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    events.splice(index, 1);
    db.events = events;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
