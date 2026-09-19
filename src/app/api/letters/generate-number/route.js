import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB } from '@/lib/db';
import { generateLetterNumber } from '@/lib/letters';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org') || 'IPNU';
    const category = searchParams.get('category') || 'A';
    const dept = searchParams.get('dept') || 'Sek';

    const db = await readDB();
    const suggestedNumber = generateLetterNumber(org, category, dept, db);
    return NextResponse.json({ success: true, number: suggestedNumber });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
