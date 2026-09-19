'use client';
import { useCallback, useEffect, useState } from 'react';
import { Cake, Gift, MessageCircle, Users, CalendarDays, X, PartyPopper } from 'lucide-react';
import Modal from './Modal';
import { api } from '../utils/api';
import { formatDate } from '../utils/formatters';
import {
  getBirthdaysLocal,
  isBirthdaySeenToday,
  markBirthdaySeen,
  buildWaGreeting,
  waLink,
} from '../utils/birthday';

// Event global untuk membuka ulang modal secara manual:
// window.dispatchEvent(new CustomEvent('siad-open-birthday'))
export default function BirthdayModal({ villageName = '', autoShow = true }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ today: [], upcoming: [], todayCount: 0, todayStr: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBirthdays(7);
      if (res?.data) {
        setData({
          today: res.data.today || [],
          upcoming: res.data.upcoming || [],
          todayCount: res.data.todayCount ?? (res.data.today || []).length,
          todayStr: res.data.todayStr || '',
        });
        return res.data;
      }
    } catch {
      // Fallback: hitung lokal dari daftar kader (misal endpoint belum tersedia)
      try {
        const res = await api.getMembers({ org: 'ALL', search: '' });
        const local = getBirthdaysLocal(res.data || [], 7);
        setData(local);
        return local;
      } catch {}
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await load();
      if (cancelled || !autoShow) return;
      const list = result?.today || [];
      if (list.length > 0 && !isBirthdaySeenToday()) {
        setOpen(true);
      }
    })();
    const reopen = () => {
      load().finally(() => setOpen(true));
    };
    window.addEventListener('siad-open-birthday', reopen);
    return () => {
      cancelled = true;
      window.removeEventListener('siad-open-birthday', reopen);
    };
  }, [autoShow, load]);

  const handleClose = () => {
    markBirthdaySeen();
    setOpen(false);
  };

  const { today, upcoming } = data;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title=""
      maxWidth="max-w-lg"
    >
      {/* Header perayaan */}
      <div className="-m-4 sm:-m-6 mb-4 overflow-hidden rounded-t-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white">
        <div className="relative px-5 sm:px-6 pt-6 pb-5">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:14px_14px] pointer-events-none" />
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 bg-white/15 hover:bg-white/25 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 animate-bounce">
              <Cake className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/85">
                <PartyPopper className="w-3.5 h-3.5" /> Barakallah Fii Umrik
              </p>
              <h3 className="text-lg sm:text-xl font-black leading-tight truncate">
                {today.length > 0
                  ? `${today.length} Kader Berulang Tahun Hari Ini! 🎉`
                  : 'Ulang Tahun Kader 🎂'}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Mari doakan & beri ucapan terbaik untuk kader kita
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Memuat data ulang tahun...</div>
      ) : today.length === 0 ? (
        <div className="py-6 text-center">
          <Gift className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Tidak ada yang berulang tahun hari ini</p>
          {upcoming.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {upcoming.length} kader akan berulang tahun dalam 7 hari ke depan. Lihat daftar di bawah.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-0.5">
          {today.map((m) => {
            const greeting = buildWaGreeting(m, villageName);
            const link = waLink(m.phone, greeting);
            const isIpnu = m.organization === 'IPNU';
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
              >
                <img
                  src={m.photo}
                  alt={m.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm shrink-0"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 truncate">{m.name}</p>
                    <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                      isIpnu ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {m.organization}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {m.position || 'Anggota'} • {formatDate(m.dob)}
                    {m.ageTurning ? ` • genap ${m.ageTurning} tahun 🎈` : ''}
                  </p>
                </div>
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors"
                    title="Kirim ucapan via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Ucapan
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      try { navigator.clipboard.writeText(greeting); alert('Ucapan disalin! Tinggal tempel ke WA.'); } catch {}
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors"
                  >
                    Salin Ucapan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ultah segera */}
      {upcoming.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            <CalendarDays className="w-3.5 h-3.5" /> Segera berulang tahun (7 hari ke depan)
          </p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {upcoming.slice(0, 7).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-700 truncate">{m.name}</span>
                <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                  {m.daysUntil === 1 ? 'Besok' : `${m.daysUntil} hari lagi`} • {formatDate(m.upcomingDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Users className="w-3.5 h-3.5" /> Otomatis muncul 1x sehari saat ada yang ultah
        </p>
        <button
          onClick={handleClose}
          className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}

