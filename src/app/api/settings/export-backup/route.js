import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const db = await readDB();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `backup-ipnu-ippnu-${dateStr}.json`;
    const jsonString = JSON.stringify(db, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
