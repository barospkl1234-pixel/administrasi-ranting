import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked } from '@/lib/db';

export async function DELETE(request, { params }) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = params;
    const db = await readDB();
    const letters = db.letters || [];
    const index = letters.findIndex(l => l.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Surat tidak ditemukan' }, { status: 404 });
    }

    letters.splice(index, 1);
    db.letters = letters;
    await writeDBChecked(db);

    return NextResponse.json({ success: true, message: 'Surat berhasil dihapus' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
