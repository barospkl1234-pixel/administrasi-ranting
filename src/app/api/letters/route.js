import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, writeDBChecked, generateId, todayWIB } from '@/lib/db';
import { generateLetterNumber } from '@/lib/letters';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const db = await readDB();
    let list = db.letters || [];

    if (org && org !== 'ALL') {
      list = list.filter(l => l.organization === org);
    }
    if (type) {
      list = list.filter(l => l.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l => 
        (l.letterNumber && l.letterNumber.toLowerCase().includes(q)) || 
        (l.subject && l.subject.toLowerCase().includes(q)) ||
        (l.recipientOrSender && l.recipientOrSender.toLowerCase().includes(q))
      );
    }

    list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
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
    const letters = db.letters || [];
    
    const newId = generateId('LTR-', letters);

    const extraFields = [
      'template', 'dept', 'eventName', 'eventDayDate', 'eventTime', 'eventLocation',
      'greetingCall', 'committeeChairman', 'committeeSecretary', 'chairmanIpnu', 'chairmanIppnu',
      'raEdition', 'kopPanitia', 'kopLine1', 'kopLine2', 'kopLine3', 'kopAddress', 'kopContact', 'kopEmail',
      'notes', 'letterPlace', 'attachment'
    ];
    const extras = {};
    extraFields.forEach(key => {
      if (body[key] !== undefined) extras[key] = body[key];
    });

    const newLetter = {
      id: newId,
      letterNumber: body.letterNumber || generateLetterNumber(body.organization || 'IPNU', body.category || 'A', body.dept || 'Sek', db),
      organization: body.organization || 'IPNU',
      type: body.type || 'Keluar',
      category: body.category || 'A',
      subject: body.subject,
      recipientOrSender: body.recipientOrSender || '',
      date: body.date || todayWIB(),
      content: body.content || '',
      status: body.status || (body.type === 'Masuk' ? 'Diarsipkan' : 'Terkirim'),
      signatory: body.signatory || 'Ketua & Sekretaris',
      createdAt: new Date().toISOString(),
      ...extras
    };

    letters.unshift(newLetter);
    db.letters = letters;
    await writeDBChecked(db);

    return NextResponse.json(
      { success: true, data: newLetter, message: 'Surat berhasil dicatat/diterbitkan' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
