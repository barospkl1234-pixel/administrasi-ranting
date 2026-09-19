import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId, todayWIB } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');
    const search = searchParams.get('search');

    const db = await readDB();
    let list = db.events || [];

    if (org && org !== 'ALL') {
      list = list.filter(e => e.organization === org || e.organization === 'BERSAMA');
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.location && e.location.toLowerCase().includes(q))
      );
    }

    const memberMap = new Map((db.members || []).map(m => [m.id, m]));
    const populated = list.map(evt => ({
      ...evt,
      attendeeList: (evt.attendees || []).map(id => memberMap.get(id)).filter(Boolean)
    }));

    return NextResponse.json({ success: true, data: populated });
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
    const events = db.events || [];

    const newId = generateId('EVT-', events);

    const newEvent = {
      id: newId,
      title: body.title,
      organization: body.organization || 'BERSAMA',
      date: body.date || todayWIB(),
      time: body.time || '19:30 WIB - Selesai',
      location: body.location || 'Gedung TPQ Ranting',
      pic: body.pic || 'Ketua IPNU / IPPNU',
      description: body.description || '',
      status: body.status || 'Akan Datang',
      attendees: body.attendees || [],
      createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    db.events = events;
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: newEvent, message: 'Agenda kegiatan berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
