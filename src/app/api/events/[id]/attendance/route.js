import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

export async function POST(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, message: 'Member ID wajib diisi' }, { status: 400 });
    }

    const db = await readDB();
    const events = db.events || [];
    const event = events.find(e => e.id === id);

    if (!event) {
      return NextResponse.json({ success: false, message: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    event.attendees = event.attendees || [];
    const idx = event.attendees.indexOf(memberId);
    let isAttending = false;

    if (idx > -1) {
      event.attendees.splice(idx, 1);
      isAttending = false;
    } else {
      event.attendees.push(memberId);
      isAttending = true;
    }

    await writeDBChecked(db);

    return NextResponse.json({ 
      success: true, 
      isAttending, 
      attendeeCount: event.attendees.length,
      message: isAttending ? 'Presensi berhasil dicatat (Hadir)' : 'Status presensi dibatalkan' 
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
