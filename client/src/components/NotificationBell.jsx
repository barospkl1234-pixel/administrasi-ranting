import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, X, Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
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

  // Kunci scroll body saat bottom-sheet terbuka di mobile
  useEffect(() => {
    if (!open) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  const enableNotification = () => {
    requestPermission().then((p) => setPermission(p));
  };

  const goToEvents = () => {
    setOpen(false);
    if (setActivePage) setActivePage('events');
  };

  const permissionBanner = permission !== 'granted' && (
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
  );

  const eventList = upcoming.length === 0 ? (
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
          onClick={goToEvents}
          className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-emerald-50/50 active:bg-emerald-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 min-w-0">
            <p className="flex-1 min-w-0 text-[13px] font-semibold text-slate-800 leading-snug break-words">{ev.title}</p>
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
              <Calendar className="w-3 h-3 shrink-0" /> {formatDate(ev.date)}
            </p>
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" /> {ev.time || '-'}
            </p>
            {ev.location && (
              <p className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{ev.location}</span>
              </p>
            )}
          </div>
        </button>
      );
    })
  );

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

        {/* Desktop Dropdown */}
        {open && (
          <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <h3 className="text-sm font-bold text-emerald-900">Jadwal Agenda</h3>
              <span className="text-[11px] text-slate-500">Otomatis diperbarui</span>
            </div>
            {permissionBanner}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {eventList}
            </div>
            <button
              onClick={goToEvents}
              className="w-full px-4 py-2.5 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              Lihat Semua Agenda
            </button>
          </div>
        )}

        {/* Mobile Bottom-Sheet */}
        {open && typeof document !== 'undefined' && createPortal(
          <div className="sm:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl border-t border-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-2.5 pb-1 flex justify-center shrink-0">
                <span className="w-10 h-1.5 rounded-full bg-slate-200" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-emerald-50/60 shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-emerald-900">Jadwal Agenda</h3>
                  <p className="text-[10px] text-slate-500">Otomatis diperbarui</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain flex-1">
                {permissionBanner}
                {eventList}
              </div>
              <button
                onClick={goToEvents}
                className="shrink-0 w-full px-4 py-3 text-center text-[13px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border-t border-slate-100 flex items-center justify-center gap-1 transition-colors"
              >
                Lihat Semua Agenda
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] space-y-2 no-print sm:w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="w-full bg-white rounded-xl shadow-2xl border-l-4 border-orange-500 overflow-hidden"
            style={{ animation: 'siadSlideInUp 0.25s ease-out' }}
          >
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <p className="flex-1 min-w-0 flex items-start gap-2 text-[13px] font-bold text-slate-800 leading-snug break-words">
                  <BellRing className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{t.title}</span>
                </p>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 pl-6 text-[12px] text-slate-500 whitespace-pre-line break-words">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}