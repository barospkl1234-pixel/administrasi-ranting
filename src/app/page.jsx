'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Login from '@/pages-view/Login';
import Dashboard from '@/pages-view/Dashboard';
import Members from '@/pages-view/Members';
import Letters from '@/pages-view/Letters';
import Finances from '@/pages-view/Finances';
import Events from '@/pages-view/Events';
import Inventory from '@/pages-view/Inventory';
import Settings from '@/pages-view/Settings';
import BirthdayModal from '@/components/BirthdayModal';
import { api } from '@/utils/api';
import { clearSession, isSessionExpired } from '@/utils/session';

const SESSION_EXPIRED_MSG = 'Sesi login 12 jam telah berakhir. Silakan login kembali.';

export default function Home() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeOrg, setActiveOrg] = useState('ALL');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sessionNotice, setSessionNotice] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [settings, setSettings] = useState({
    villageName: "Kalibaros",
    subDistrict: "Pekalongan Timur",
    district: "Kota Pekalongan",
    period: "2025 - 2027",
    codeIpnu: "7354",
    codeIppnu: "7455",
    leaderIpnu: "Ahmad Fauzi",
    leaderIppnu: "Siti Nur Halizah",
    leaderPhoneIpnu: "",
    leaderPhoneIppnu: "",
    viceLeaderIpnu: "",
    viceLeaderIppnu: ""
  });

  // Client hydration check & session validation
  useEffect(() => {
    setMounted(true);
    if (isSessionExpired()) {
      clearSession();
      setIsLoggedIn(false);
    } else {
      const logged = localStorage.getItem('siad_logged_in') === 'true' && !!localStorage.getItem('siad_token');
      setIsLoggedIn(logged);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.getSettings()
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => {
        if (err.message && err.message.includes('401')) {
          handleLogout(err.expired === true ? SESSION_EXPIRED_MSG : 'Sesi tidak valid. Silakan login kembali.');
        } else {
          console.error('Failed to load settings:', err);
        }
      });
  }, [isLoggedIn]);

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

  const handleLogin = () => {
    setSessionNotice('');
    setIsLoggedIn(true);
  };

  const handleLogout = (notice = '') => {
    clearSession();
    setIsLoggedIn(false);
    setActivePage('dashboard');
    if (notice) setSessionNotice(notice);
  };

  // Logout otomatis saat sesi 12 jam kedaluwarsa
  useEffect(() => {
    if (!isLoggedIn) return;
    const timer = setInterval(() => {
      if (isSessionExpired()) handleLogout(SESSION_EXPIRED_MSG);
    }, 60 * 1000);
    const onExpired = () => handleLogout(SESSION_EXPIRED_MSG);
    window.addEventListener('siad-session-expired', onExpired);
    return () => {
      clearInterval(timer);
      window.removeEventListener('siad-session-expired', onExpired);
    };
  }, [isLoggedIn]);

  // Prevent flash during initial hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} notice={sessionNotice} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        settings={settings}
        onLogout={handleLogout}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar 
          activePage={activePage}
          activeOrg={activeOrg}
          setActiveOrg={setActiveOrg}
          settings={settings}
          onMenuClick={() => setIsMobileOpen(true)}
          setActivePage={setActivePage}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>

        <footer className="no-print border-t border-slate-200/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-400 bg-white">
          <p>&copy; {new Date().getFullYear()} Sistem Informasi & Administrasi Pimpinan Ranting (PR) IPNU - IPPNU Kelurahan {settings.villageName || 'Kalibaros'}.</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Motto: Belajar, Berjuang, Bertaqwa</p>
        </footer>
      </div>

      {/* Notifikasi modal ulang tahun kader (otomatis 1x sehari) */}
      <BirthdayModal villageName={settings.villageName} />
    </div>
  );
}
