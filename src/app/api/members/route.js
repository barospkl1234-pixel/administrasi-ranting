import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');
    const search = searchParams.get('search');
    const dusun = searchParams.get('dusun');
    const cadre = searchParams.get('cadre');

    const db = await readDB();
    let list = db.members || [];

    if (org && org !== 'ALL') {
      list = list.filter(m => m.organization === org);
    }
    if (dusun) {
      list = list.filter(m => m.dusun === dusun);
    }
    if (cadre) {
      list = list.filter(m => m.cadreLevel === cadre);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) || 
        (m.studentStatus && m.studentStatus.toLowerCase().includes(q)) || 
        (m.position && m.position.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: list });
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
    const members = db.members || [];

    const newId = generateId('KDR-', members);
    const gender = body.gender || (body.organization === 'IPNU' ? 'L' : 'P');

    const newMember = {
      id: newId,
      studentStatus: body.studentStatus || 'SMA',
      name: body.name,
      organization: body.organization || 'IPNU',
      gender: gender,
      pob: body.pob || 'Pekalongan',
      dob: body.dob || '2005-01-01',
      phone: body.phone || '',
      dusun: body.dusun || 'Dusun I Krajan',
      rt: body.rt || '01',
      rw: body.rw || '01',
      education: body.education || 'Pelajar',
      position: body.position || 'Anggota',
      cadreLevel: body.cadreLevel || 'Calon Anggota',
      status: body.status || 'Aktif',
      joinedYear: parseInt(body.joinedYear, 10) || new Date().getFullYear(),
      photo: body.photo || (gender === 'L' ? 
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' : 
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'),
      createdAt: new Date().toISOString()
    };

    members.push(newMember);
    db.members = members;
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: newMember, message: 'Data kader berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
