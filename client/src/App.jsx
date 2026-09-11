import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Letters from './pages/Letters';
import Finances from './pages/Finances';
import Events from './pages/Events';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import { api } from './utils/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeOrg, setActiveOrg] = useState('ALL'); // 'ALL' | 'IPNU' | 'IPPNU'
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [settings, setSettings] = useState({
    villageName: "Kalibaros",
    subDistrict: "Pekalongan Timur",
    district: "Kota Pekalongan",
    period: "2025 - 2027",
    codeIpnu: "7354",
    codeIppnu: "7455",
    leaderIpnu: "Ahmad Fauzi",
    leaderIppnu: "Siti Nur Halizah"
  });

  useEffect(() => {
    // Load initial organization settings
    api.getSettings()
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => console.error('Failed to load settings:', err));
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard activeOrg={activeOrg} setActivePage={setActivePage} settings={settings} />;
      case 'members':
        return <Members activeOrg={activeOrg} settings={settings} />;
      case 'letters':
        return <Letters activeOrg={activeOrg} settings={settings} />;
      case 'finances':
        return <Finances activeOrg={activeOrg} settings={settings} />;
      case 'events':
        return <Events activeOrg={activeOrg} settings={settings} />;
      case 'inventory':
        return <Inventory settings={settings} />;
      case 'settings':
        return <Settings settings={settings} onSettingsUpdated={setSettings} />;
      default:
        return <Dashboard activeOrg={activeOrg} setActivePage={setActivePage} settings={settings} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        settings={settings}
      />

      {/* Main Layout Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <Navbar 
          activePage={activePage}
          activeOrg={activeOrg}
          setActiveOrg={setActiveOrg}
          settings={settings}
          onMenuClick={() => setIsMobileOpen(true)}
          setActivePage={setActivePage}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-slate-200/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-400 bg-white">
          <p>© {new Date().getFullYear()} Sistem Informasi & Administrasi Pimpinan Ranting (PR) IPNU - IPPNU Kelurahan {settings.villageName || 'Kalibaros'}.</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Motto: Belajar, Berjuang, Bertaqwa</p>
        </footer>

      </div>
    </div>
  );
}

