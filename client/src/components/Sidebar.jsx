import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  Wallet, 
  CalendarDays, 
  Package, 
  Settings, 
  Sparkles,
  BookOpen,
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen, settings = {}, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Data Kader & KTA', icon: Users },
    { id: 'letters', label: 'Persuratan (E-Surat)', icon: Mail },
    { id: 'finances', label: 'Buku Kas & Keuangan', icon: Wallet },
    { id: 'events', label: 'Agenda & Presensi', icon: CalendarDays },
    { id: 'inventory', label: 'Inventaris Aset', icon: Package },
    { id: 'settings', label: 'Pengaturan Ranting', icon: Settings },
  ];

  const handleNav = (id) => {
    setActivePage(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } no-print`}>
        
        {/* Header / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-1">
              <img src="/logo-ipnu.png" alt="Logo IPNU" className="w-9 h-9 object-contain drop-shadow-lg" />
              <img src="/logo-ippnu.png" alt="Logo IPPNU" className="w-9 h-9 object-contain drop-shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase">SIAD</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded border border-amber-400/30 uppercase">Ranting</span>
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                IPNU & IPPNU
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                Kelurahan {settings.villageName || 'Kalibaros'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overscroll-contain">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Motto Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="rounded-xl p-3 bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Motto Pelajar NU</span>
            </div>
            <p className="text-[11px] font-medium text-slate-300 italic">
              "Belajar, Berjuang, Bertaqwa"
            </p>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Masa Khidmat:</span>
              <span className="font-semibold text-emerald-300">{settings.period || '2025 - 2027'}</span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all border border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          )}
        </div>

      </aside>
    </>
  );
}

