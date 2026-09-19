import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeDBChecked } from '@/lib/db';

const REQUIRED_KEYS = ['settings', 'members', 'letters', 'finances', 'events', 'inventory'];

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const backupData = await request.json().catch(() => null);

    if (!backupData || !backupData.settings || !backupData.members) {
      return NextResponse.json(
        { success: false, message: 'Format data backup tidak valid' },
        { status: 400 }
      );
    }

    // Validate all required keys exist
    const missingKeys = REQUIRED_KEYS.filter(k => backupData[k] === undefined);
    if (missingKeys.length > 0) {
      return NextResponse.json(
        { success: false, message: `Backup tidak memiliki data berikut: ${missingKeys.join(', ')}` },
        { status: 400 }
      );
    }

    const db = {};
    REQUIRED_KEYS.forEach(key => {
      db[key] = backupData[key];
    });

    await writeDBChecked(db);
    return NextResponse.json({ success: true, message: 'Data cadangan (backup) berhasil dipulihkan' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
