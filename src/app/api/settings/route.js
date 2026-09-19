import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

const ALLOWED_SETTINGS = [
  'villageName', 'subDistrict', 'district', 'province', 'postCode', 'secretariatAddress',
  'period', 'codeIpnu', 'codeIppnu',
  'leaderIpnu', 'leaderIppnu', 'leaderPhoneIpnu', 'leaderPhoneIppnu', 'viceLeaderIpnu', 'viceLeaderIppnu',
  'secretaryIpnu', 'secretaryIppnu', 'treasurerIpnu', 'treasurerIppnu',
  'cbpCommander', 'kppCommander', 'phoneContact', 'emailContact'
];

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const db = await readDB();
    return NextResponse.json({ success: true, data: db.settings || {} });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const db = await readDB();

    const filtered = {};
    ALLOWED_SETTINGS.forEach(key => {
      if (body[key] !== undefined) filtered[key] = body[key];
    });

    db.settings = {
      ...db.settings,
      ...filtered,
      updatedAt: new Date().toISOString()
    };

    await writeDBChecked(db);
    return NextResponse.json({
      success: true,
      data: db.settings,
      message: 'Profil dan pengaturan ranting berhasil disimpan'
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
