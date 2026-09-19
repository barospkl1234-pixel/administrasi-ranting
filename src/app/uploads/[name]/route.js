import { NextResponse } from 'next/server';
import { readUpload } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { name } = params;
    const file = await readUpload(name);

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Foto / Berkas tidak ditemukan' },
        { status: 404 }
      );
    }

    return new NextResponse(file.buffer, {
      headers: {
        'Content-Type': file.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
