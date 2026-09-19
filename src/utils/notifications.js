const NOTIFIED_KEY = 'siad-notified';

// Ambil waktu mulai kegiatan dari free-text event.time (format "HH:MM").
// Contoh: "19:30 - 22:00 WIB", "08:00 - Selesai (2 Hari)", "19:30 WIB - Selesai"
export function getEventStart(event) {
  const dateStr = event.date ? String(event.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const d = new Date(`${dateStr}T00:00:00`);
  const m = /(\d{1,2}):(\d{2})/.exec(event.time || '');
  if (m && !m[1].startsWith('0')) {
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  } else if (m) {
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
  }
  if (isNaN(d.getTime())) return new Date(`${dateStr}T08:00:00`);
  return d;
}

export function getNotifiedMap() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
  } catch {
    return {};
  }
}

export function isNotified(key) {
  return !!getNotifiedMap()[key];
}

export function markNotified(key) {
  const map = getNotifiedMap();
  map[key] = true;
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {}
}

export function clearOldNotified(maxAgeDays = 14) {
  const map = getNotifiedMap();
  const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
  Object.keys(map).forEach((k) => {
    const ts = Number(String(k).split(':')[1] || 0);
    if (ts && ts < cutoff) delete map[k];
  });
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map));
  } catch {}
}

export function requestPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('unsupported');
  }
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

export function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 740;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.start(ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1260, ctx.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.55);
  } catch {}
}

export function showNotification(title, body) {
  playBeep();
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo-ipnu.png',
        badge: '/logo-ipnu.png',
      });
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('siad-toast', { detail: { title, body } }));
}

export function isUpcoming(event) {
  return event.status !== 'Selesai' && getEventStart(event).getTime() >= Date.now();
}

export function isToday(event) {
  const d = getEventStart(event);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}