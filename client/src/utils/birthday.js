import { todayWIBString } from './formatters';

// Kunci localStorage agar modal otomatis hanya muncul sekali per hari
export function birthdaySeenKey(dateStr) {
  return `siad-birthday-modal-${dateStr}`;
}

export function isBirthdaySeenToday() {
  try {
    const today = todayWIBString();
    return localStorage.getItem(birthdaySeenKey(today)) === 'seen';
  } catch {
    return true;
  }
}

export function markBirthdaySeen() {
  try {
    const today = todayWIBString();
    localStorage.setItem(birthdaySeenKey(today), 'seen');
    // Bersihkan kunci lama (hemat storage)
    Object.keys(localStorage)
      .filter((k) => k.startsWith('siad-birthday-modal-') && k !== birthdaySeenKey(today))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Fallback client-side bila backend belum menyediakan /birthdays
export function getBirthdaysLocal(members = [], upcomingDays = 7) {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = todayWIBString();
  const base = new Date(`${todayStr}T00:00:00`);
  const baseYear = base.getFullYear();
  const todayMD = todayStr.slice(5, 10);

  const upcomingMap = {};
  for (let i = 1; i <= upcomingDays; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!upcomingMap[md]) upcomingMap[md] = i;
  }

  const today = [];
  const upcoming = [];
  members.forEach((m) => {
    if (!m.dob) return;
    const dobStr = String(m.dob).slice(0, 10);
    if (dobStr.length < 10) return;
    const md = dobStr.slice(5, 10);
    const birthYear = parseInt(dobStr.slice(0, 4), 10);
    if (md === todayMD) {
      today.push({ ...m, ageTurning: Number.isNaN(birthYear) ? null : baseYear - birthYear });
    } else if (upcomingMap[md]) {
      const daysUntil = upcomingMap[md];
      const d = new Date(base);
      d.setDate(d.getDate() + daysUntil);
      upcoming.push({
        ...m,
        ageTurning: Number.isNaN(birthYear) ? null : d.getFullYear() - birthYear,
        daysUntil,
        upcomingDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      });
    }
  });

  today.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  return { today, upcoming, todayCount: today.length, todayStr };
}

export function buildWaGreeting(member, villageName = '') {
  const sapaan = member.organization === 'IPPNU' ? 'Rekanita' : 'Rekan';
  const usia = member.ageTurning ? ` ke-${member.ageTurning}` : '';
  const wilayah = villageName ? ` PR IPNU IPPNU ${villageName}` : '';
  const text =
    `Assalamu'alaikum ${sapaan} ${member.name} 🙏🎂\n\n` +
    `Barakallah fii umrik${usia}! Semoga panjang umur, sehat selalu, ` +
    `makin semangat Belajar, Berjuang, Bertaqwa, dan membawa keberkahan ` +
    `untuk keluarga serta organisasi${wilayah}. Aamiin 🤲✨`;
  return text;
}

export function waLink(phone, text) {
  let num = String(phone || '').replace(/[^0-9]/g, '');
  if (!num) return null;
  if (num.startsWith('0')) num = `62${num.slice(1)}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
