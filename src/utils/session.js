// Durasi sesi login: 12 jam (sinkron dengan SESSION_DURATION_MS di server/index.js)
export const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const LOGIN_AT_KEY = 'siad_login_at';

export function saveSession(token) {
  localStorage.setItem('siad_token', token);
  localStorage.setItem('siad_logged_in', 'true');
  localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
}

export function clearSession() {
  localStorage.removeItem('siad_token');
  localStorage.removeItem('siad_logged_in');
  localStorage.removeItem(LOGIN_AT_KEY);
}

// true bila waktu login sudah lewat 12 jam (atau tidak tercatat)
export function isSessionExpired() {
  try {
    const at = Number(localStorage.getItem(LOGIN_AT_KEY) || 0);
    if (!at) {
      // Fallback untuk sesi lama sebelum pencatatan waktu: anggap masih valid
      // selama token ada, agar user lama tidak langsung ditendang saat update.
      // Kedaluwarsa selanjutnya ditegakkan server via 401 + event siad-session-expired.
      return false;
    }
    return Date.now() - at > SESSION_DURATION_MS;
  } catch {
    return false;
  }
}

export function getSessionRemainingMs() {
  try {
    const at = Number(localStorage.getItem(LOGIN_AT_KEY) || 0);
    if (!at) return SESSION_DURATION_MS;
    return Math.max(0, SESSION_DURATION_MS - (Date.now() - at));
  } catch {
    return 0;
  }
}
