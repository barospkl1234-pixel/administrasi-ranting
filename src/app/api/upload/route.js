import path from 'path';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { saveUpload } from '@/lib/db';

export async function POST(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('photo') || formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada file yang diunggah' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file maksimal 10 MB' },
        { status: 400 }
      );
    }

    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const originalName = file.name || 'upload.jpg';
    const ext = path.extname(originalName).toLowerCase() || '.jpg';

    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { success: false, message: 'Format file harus JPG, PNG, WEBP, atau PDF' },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg');

    await saveUpload(filename, buffer, mime);

    const url = `/uploads/${filename}`;
    const isPdf = ext === '.pdf' || mime === 'application/pdf';

    return NextResponse.json(
      { success: true, url, type: isPdf ? 'pdf' : 'image', message: 'File berhasil diunggah' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan file: ' + err.message },
      { status: 500 }
    );
  }
}
