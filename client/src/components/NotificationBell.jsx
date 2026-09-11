import { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, X, Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '../utils/api';
import {
  getEventStart,
  isUpcoming,
  isToday,
  requestPermission,
  showNotification,
  isNotified,
  markNotified,
  clearOldNotified,
} from '../utils/notifications';
import { formatDate } from '../utils/formatters';

function eventKey(ev) {
  return `${ev.id}-${ev.status}`;
}

export default function NotificationBell({ setActivePage }) {
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState('unsupported');
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef({});
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  const sortByStart = (list) =>
    [...list].sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());

  const load = () => {
    api.getEvents({ org: 'ALL', search: '' }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      setEvents(list);
      const upcomingList = sortByStart(list.filter(isUpcoming)).slice(0, 8);
      setUpcoming(upcomingList);
      setTodayCount(list.filter(isToday).length);
      checkSchedule(list);
    }).catch(() => {});
  };

  const checkSchedule = (list) => {
    const now = Date.now();
    list.forEach((ev) => {
      if (ev.status === 'Selesai') return;
      const start = getEventStart(ev).getTime();
      if (Math.abs(start - now) > 6 * 3600 * 1000) return;
      const started = now >= start && now <= start + 60 * 60 * 1000;
      if (!started) return;
      const key = `${ev.id}-${String(ev.date || '').slice(0, 10)}`;
      if (notifiedRef.current[key] || isNotified(key)) return;
      notifiedRef.current[key] = true;
      markNotified(key);
      showNotification(
        `Waktunya Kegiatan: ${ev.title}`,
        `${formatDate(ev.date)} • ${ev.time || 'Lihat jadwal'}\n${ev.location || ''}`
      );
    });
  };

  useEffect(() => {
    clearOldNotified();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    load();
    timerRef.current = setInterval(load, 30000);
    const onToast = (e) => {
      const toast = { id: Date.now() + Math.random(), ...e.detail };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 8000);
    };
    window.addEventListener('siad-toast', onToast);
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('siad-toast', onToast);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const enableNotification = () => {
    requestPermission().then((p) => setPermission(p));
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notifikasi Jadwal"
        >
          {todayCount > 0 ? (
            <BellRing className="w-5 h-5 text-orange-500 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {todayCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {todayCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <h3 className="text-sm font-bold text-emerald-900">Jadwal Agenda</h3>
              <span className="text-[11px] text-slate-500">Otomatis diperbarui</span>
            </div>

            {permission !== 'granted' && (
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-[12px] text-amber-800 mb-2">
                  Aktifkan notifikasi browser agar muncul pemberitahuan saat waktu kegiatan tiba.
                </p>
                <button
                  onClick={enableNotification}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold transition-colors"
                >
                  Aktifkan Notifikasi
                </button>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {upcoming.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-slate-400">
                  Belum ada jadwal agenda yang akan datang.
                </p>
              ) : (
                upcoming.map((ev) => {
                  const start = getEventStart(ev);
                  const diff = start.getTime() - Date.now();
                  const h = Math.floor(diff / 3600000);
                  const m = Math.floor((diff % 3600000) / 60000);
                  const label =
                    diff <= 0
                      ? 'Sedang berlangsung'
                      : h <= 0
                      ? `${m} menit lagi`
                      : `${h} jam ${m} menit lagi`;
                  return (
                    <button
                      key={eventKey(ev)}
                      onClick={() => {
                        setOpen(false);
                        if (setActivePage) setActivePage('events');
                      }}
                      className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-emerald-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{ev.title}</p>
                        {diff <= 6 * 3600 * 1000 && (
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              diff <= 3600 * 1000
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(ev.date)}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ev.time || '-'}
                        </p>
                        {ev.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                if (setActivePage) setActivePage('events');
              }}
              className="w-full px-4 py-2.5 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Lihat Semua Agenda
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] space-y-2 no-print sm:w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="w-full bg-white rounded-xl shadow-2xl border-l-4 border-orange-500 overflow-hidden"
            style={{ animation: 'siadSlideInUp 0.25s ease-out' }}
          >
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-slate-800 leading-snug">{t.title}</p>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-[12px] text-slate-500 whitespace-pre-line">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}