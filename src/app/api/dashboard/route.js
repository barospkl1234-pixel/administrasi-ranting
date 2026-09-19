import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readDB, todayWIB } from '@/lib/db';

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const db = await readDB();
    const members = db.members || [];
    const letters = db.letters || [];
    const finances = db.finances || [];
    const events = db.events || [];
    const inventory = db.inventory || [];

    const totalMembers = members.length;
    const ipnuCount = members.filter(m => m.organization === 'IPNU').length;
    const ippnuCount = members.filter(m => m.organization === 'IPPNU').length;

    const cadreDistribution = {
      'Calon Anggota': 0,
      'MAKESTA': 0,
      'LAKMUD': 0,
      'LAKUT': 0,
      'DIKLATAMA': 0
    };

    members.forEach(m => {
      const lvl = m.cadreLevel || 'Calon Anggota';
      if (cadreDistribution[lvl] !== undefined) {
        cadreDistribution[lvl]++;
      } else {
        cadreDistribution[lvl] = 1;
      }
    });

    let ipnuBalance = 0;
    let ippnuBalance = 0;
    let jointBalance = 0;

    finances.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.organization === 'IPNU') {
        ipnuBalance += (f.type === 'income' ? amt : -amt);
      } else if (f.organization === 'IPPNU') {
        ippnuBalance += (f.type === 'income' ? amt : -amt);
      } else {
        jointBalance += (f.type === 'income' ? amt : -amt);
      }
    });

    const totalLetters = letters.length;
    const outgoingLetters = letters.filter(l => l.type === 'Keluar').length;
    const incomingLetters = letters.filter(l => l.type === 'Masuk').length;

    const today = todayWIB();
    const upcomingEvents = events
      .filter(e => e.date >= today && e.status !== 'Selesai')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    // Kader yang berulang tahun hari ini + 7 hari ke depan (berbasis WIB)
    const birthdays = (() => {
      const pad = (n) => String(n).padStart(2, '0');
      const base = new Date(`${today}T00:00:00`);
      const baseYear = base.getFullYear();
      const todayMD = today.slice(5, 10);
      const upcomingMap = {};
      for (let i = 1; i <= 7; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        if (!upcomingMap[md]) upcomingMap[md] = i;
      }
      const todayList = [];
      const upcomingList = [];
      members.forEach((m) => {
        if (!m.dob) return;
        const dobStr = String(m.dob).slice(0, 10);
        if (dobStr.length < 10) return;
        const md = dobStr.slice(5, 10);
        const birthYear = parseInt(dobStr.slice(0, 4), 10);
        if (md === todayMD) {
          todayList.push({ ...m, ageTurning: Number.isNaN(birthYear) ? null : baseYear - birthYear });
        } else if (upcomingMap[md]) {
          const daysUntil = upcomingMap[md];
          const d = new Date(base);
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
      upcomingList.sort((a, b) => a.daysUntil - b.daysUntil);
      return { today: todayList, upcoming: upcomingList, todayCount: todayList.length, todayStr: today };
    })();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalMembers,
          ipnuCount,
          ippnuCount,
          cadreDistribution,
          ipnuBalance,
          ippnuBalance,
          jointBalance,
          totalBalance: ipnuBalance + ippnuBalance + jointBalance,
          totalLetters,
          outgoingLetters,
          incomingLetters,
          inventoryCount: inventory.length
        },
        upcomingEvents,
        birthdays,
        recentLetters: [...letters].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5),
        recentTransactions: [...finances].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 5),
        settings: db.settings
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
