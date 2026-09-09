import React from 'react';
import { Menu, Calendar, Shield, Sparkles } from 'lucide-react';
import { formatDateWithDay, getHijriDateString } from '../utils/formatters';

export default function Navbar({ activePage, activeOrg, setActiveOrg, settings = {}, onMenuClick }) {
  const pageTitles = {
    dashboard: 'Dashboard Administrasi',
    members: 'Database Kader & KTA Digital',
    letters: 'Administrasi Persuratan (E-Surat)',
    finances: 'Pengelolaan Buku Kas & Keuangan',
    events: 'Agenda Kegiatan & Presensi Digital',
    inventory: 'Inventaris & Perlengkapan Ranting',
    settings: 'Pengaturan Profil & Pimpinan Ranting'
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const masehiDate = formatDateWithDay(todayIso);
  const hijriDate = getHijriDateString(todayIso);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Side: Mobile Menu Button & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              {pageTitles[activePage] || 'Administrasi Ranting'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <span>PR IPNU - IPPNU Desa {settings.villageName || 'Sukamaju'}</span>
              <span className="text-slate-300">•</span>
              <span>Kec. {settings.subDistrict || 'Cilongok'}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Org Filter Tabs & Islamic Date Banner */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Organization Switcher Pills */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setActiveOrg('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeOrg === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveOrg('IPNU')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeOrg === 'IPNU'
                  ? 'bg-[#006837] text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              PR IPNU
            </button>
            <button
              onClick={() => setActiveOrg('IPPNU')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeOrg === 'IPPNU'
                  ? 'bg-[#d97706] text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              PR IPPNU
            </button>
          </div>

          {/* Date Badge */}
          <div className="hidden md:flex flex-col text-right pl-2 border-l border-slate-200">
            <span className="text-xs font-semibold text-slate-700">{masehiDate}</span>
            <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-tight">{hijriDate}</span>
          </div>

        </div>

      </div>
    </header>
  );
}

