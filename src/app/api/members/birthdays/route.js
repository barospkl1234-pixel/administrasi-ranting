import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, todayWIB } from '@/lib/db';

function getBirthdays(list, upcomingDays = 7) {
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = todayWIB();
  const today = new Date(`${todayStr}T00:00:00`);
  const todayYear = today.getFullYear();
  const todayMD = todayStr.slice(5, 10);

  const upcomingMap = {};
  for (let i = 1; i <= upcomingDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!upcomingMap[md]) upcomingMap[md] = i;
  }

  const todayList = [];
  const upcomingList = [];

  list.forEach((m) => {
    if (!m.dob) return;
    const dobStr = String(m.dob).slice(0, 10);
    if (dobStr.length < 10) return;
    const md = dobStr.slice(5, 10);
    const birthYear = parseInt(dobStr.slice(0, 4), 10);
    const ageTurning = Number.isNaN(birthYear) ? null : todayYear - birthYear;
    if (md === todayMD) {
      todayList.push({ ...m, ageTurning });
    } else if (upcomingMap[md]) {
      const daysUntil = upcomingMap[md];
      const d = new Date(today);
      d.setDate(d.getDate() + daysUntil);
      upcomingList.push({
        ...m,
        ageTurning: Number.isNaN(birthYear) ? null : d.getFullYear() - birthYear,
        daysUntil,
        upcomingDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      });
    }
  });

  todayList.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  upcomingList.sort((a, b) => a.daysUntil - b.daysUntil || String(a.name).localeCompare(String(b.name)));

  return { today: todayList, upcoming: upcomingList, todayCount: todayList.length, todayStr };
}

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const upcoming = Math.min(Math.max(parseInt(searchParams.get('upcoming'), 10) || 7, 1), 30);
    const db = await readDB();
    const result = getBirthdays(db.members || [], upcoming);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
