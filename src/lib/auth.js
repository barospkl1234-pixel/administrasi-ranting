import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const AUTH_USERNAME = process.env.AUTH_USERNAME || 'PIMPINAN RANTING BAROS';
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'pelajarnukotasantri';
export const AUTH_SECRET = process.env.AUTH_SECRET || 'siad-ipnu-ippnu-ranting-secret-key-2025';

// Sesi login: 12 jam (sinkron dengan client/src/utils/session.js)
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export function signToken(username) {
  const payload = `${username}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) return { valid: false, reason: 'invalid' };
    const sig = parts.pop();
    const payload = parts.join(':');
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return { valid: false, reason: 'invalid' };
    }
    const username = parts[0];
    if (username !== AUTH_USERNAME) return { valid: false, reason: 'invalid' };

    const issuedAt = Number(parts[1]);
    if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_DURATION_MS) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

export function requireAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, message: 'Akses ditolak. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const check = verifyToken(token);
  if (!check.valid) {
    if (check.reason === 'expired') {
      return NextResponse.json(
        { success: false, expired: true, message: 'Sesi login 12 jam telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Sesi tidak valid. Silakan login kembali.' },
      { status: 401 }
    );
  }

  return null; // Auth passed!
}

// Rate-limiting login attempts
const loginAttempts = new Map();

export function checkLoginRateLimit(ip) {
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now > entry.windowStart + 15 * 60 * 1000) {
    entry = { windowStart: now, count: 0, blockedUntil: 0 };
    loginAttempts.set(ip, entry);
  }
  if (entry.blockedUntil > now) {
    const mins = Math.ceil((entry.blockedUntil - now) / 60000);
    return `Terlalu banyak percobaan login. Coba lagi ${mins} menit lagi.`;
  }
  return null;
}

export function recordLoginFail(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return;
  entry.count += 1;
  if (entry.count >= 5) {
    entry.blockedUntil = Date.now() + 15 * 60 * 1000;
  }
}

export function clearLoginFail(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return;
  entry.count = 0;
  entry.blockedUntil = 0;
}
