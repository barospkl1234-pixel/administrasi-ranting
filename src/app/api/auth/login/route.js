import { NextResponse } from 'next/server';
import { getDbReady } from '@/lib/db';
import { 
  AUTH_USERNAME, 
  AUTH_PASSWORD, 
  signToken, 
  checkLoginRateLimit, 
  recordLoginFail, 
  clearLoginFail 
} from '@/lib/auth';

export async function POST(request) {
  try {
    await getDbReady();
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    
    const rateLimitError = checkLoginRateLimit(ip);
    if (rateLimitError) {
      return NextResponse.json({ success: false, message: rateLimitError }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      recordLoginFail(ip);
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    clearLoginFail(ip);
    const token = signToken(username);
    return NextResponse.json({
      success: true,
      token,
      expiresInHours: 12,
      message: 'Login berhasil. Sesi berlaku 12 jam.'
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server: ' + err.message },
      { status: 500 }
    );
  }
}
