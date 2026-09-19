import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId, todayWIB } from '@/lib/db';

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file surat yang dipilih untuk diimport' },
        { status: 400 }
      );
    }

    const db = await readDB();
    const letters = db.letters || [];

    const created = [];
    items.forEach((item) => {
      const id = generateId('LTR-', [...letters, ...created]);
      const letter = {
        id,
        letterNumber: (item.letterNumber && item.letterNumber.trim()) || `SM-${id.slice(4)}`,
        organization: item.organization || 'BERSAMA',
        type: 'Masuk',
        category: item.category || 'A',
        subject: (item.subject && item.subject.trim()) || (item.attachment && item.attachment.name) || 'Surat Masuk',
        recipientOrSender: item.recipientOrSender ? item.recipientOrSender.trim() : '',
        date: item.date || todayWIB(),
        content: item.content || '',
        status: 'Diarsipkan',
        signatory: 'Ketua & Sekretaris',
        notes: item.notes || '',
        attachment: item.attachment && item.attachment.dataUrl
          ? { name: item.attachment.name || 'lampiran', type: item.attachment.type, dataUrl: item.attachment.dataUrl, size: item.attachment.size }
          : undefined,
        createdAt: new Date().toISOString(),
      };
      created.push(letter);
    });

    db.letters = [...created, ...letters];
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: created, message: `${created.length} surat masuk berhasil diimport` },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
