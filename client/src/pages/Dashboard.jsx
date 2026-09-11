import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  Mail, 
  Calendar, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  FileText, 
  Award,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { api } from '../utils/api';
import { formatRupiah, formatDate, formatDateWithDay } from '../utils/formatters';

export default function Dashboard({ activeOrg, setActivePage, settings = {} }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Memuat dashboard administrasi...</p>
        </div>
      </div>
    );
  }

  const { stats, upcomingEvents, recentLetters, recentTransactions } = data;

  // Filter stats based on activeOrg
  const memberDisplayCount = activeOrg === 'IPNU' ? stats.ipnuCount : activeOrg === 'IPPNU' ? stats.ippnuCount : stats.totalMembers;
  const memberSubtext = activeOrg === 'ALL' 
    ? `${stats.ipnuCount} IPNU • ${stats.ippnuCount} IPPNU` 
    : `Kader aktif ${activeOrg} Ranting`;

  const cashDisplay = activeOrg === 'IPNU' ? stats.ipnuBalance : activeOrg === 'IPPNU' ? stats.ippnuBalance : stats.totalBalance;
  const cashSubtext = activeOrg === 'ALL'
    ? `IPNU: ${formatRupiah(stats.ipnuBalance)} | IPPNU: ${formatRupiah(stats.ippnuBalance)}`
    : `Saldo Kas ${activeOrg}`;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-8 shadow-xl shadow-emerald-950/10">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-[10px] sm:text-xs font-bold mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Sistem Informasi & Administrasi Resmi Ranting NU</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Selamat Datang di SIAD PR IPNU IPPNU {settings.villageName || 'Kalibaros'}
          </h2>
          <p className="text-xs sm:text-base text-emerald-100/90 mt-2 leading-relaxed">
            Kelola data kaderisasi, penerbitan surat resmi bersurat QR Code, pembukuan kas organisasi, presensi rutinan selapanan, dan inventaris ranting dalam satu sistem terpadu.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => setActivePage('members')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Tambah Kader Baru
            </button>
            <button
              onClick={() => setActivePage('letters')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/60 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              Buat Surat Resmi
            </button>
            <button
              onClick={() => setActivePage('finances')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/60 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              <Wallet className="w-4 h-4 text-emerald-300" />
              Catat Kas
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Kader"
          value={memberDisplayCount}
          subtext={memberSubtext}
          icon={Users}
          color="emerald"
          onClick={() => setActivePage('members')}
        />
        <StatCard
          title="Saldo Kas Bersih"
          value={formatRupiah(cashDisplay)}
          subtext={cashSubtext}
          icon={Wallet}
          color="teal"
          onClick={() => setActivePage('finances')}
        />
        <StatCard
          title="Persuratan Resmi"
          value={stats.totalLetters}
          subtext={`${stats.outgoingLetters} Surat Keluar • ${stats.incomingLetters} Masuk`}
          icon={Mail}
          color="blue"
          onClick={() => setActivePage('letters')}
        />
        <StatCard
          title="Aset Inventaris"
          value={stats.inventoryCount}
          subtext="Barang perlengkapan ranting"
          icon={Package}
          color="indigo"
          onClick={() => setActivePage('inventory')}
        />
      </div>

      {/* 2-Column Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Events & Finances */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Events Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Agenda & Rutinan Terdekat</h3>
                  <p className="text-xs text-slate-500">Jadwal kegiatan organisasi dan presensi kader</p>
                </div>
              </div>
              <button
                onClick={() => setActivePage('events')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Belum ada agenda terdekat</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          evt.organization === 'IPNU' ? 'bg-emerald-100 text-emerald-800' :
                          evt.organization === 'IPPNU' ? 'bg-amber-100 text-amber-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {evt.organization}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800">{evt.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateWithDay(evt.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {evt.time}
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => setActivePage('events')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shrink-0"
                    >
                      Buka Presensi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Financial Transactions */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Arus Kas Organisasi Terakhir</h3>
                  <p className="text-xs text-slate-500">Pencatatan iuran, donasi, dan pengeluaran kegiatan</p>
                </div>
              </div>
              <button
                onClick={() => setActivePage('finances')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Buka Buku Kas <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTransactions.map((trx) => {
                const isIncome = trx.type === 'income';
                return (
                  <div key={trx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{trx.description}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {formatDate(trx.date)} • <span className="font-medium">{trx.organization}</span> • {trx.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold font-mono ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncome ? '+' : '-'}{formatRupiah(trx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (1 span): Cadre Level Breakdown & Recent Letters */}
        <div className="space-y-6">
          
          {/* Cadre Level Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Jenjang Kaderisasi</h3>
                <p className="text-xs text-slate-500">Distribusi kader formal ranting</p>
              </div>
            </div>

            <div className="space-y-3.5 mt-4">
              {Object.entries(stats.cadreDistribution || {}).map(([level, count]) => {
                const percentage = stats.totalMembers > 0 
                  ? Math.round((count / stats.totalMembers) * 100) 
                  : 0;

                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{level}</span>
                      <span className="text-slate-500 font-mono">{count} Kader ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          level === 'MAKESTA' ? 'bg-emerald-500' :
                          level === 'LAKMUD' ? 'bg-amber-500' :
                          level === 'LAKUT' ? 'bg-indigo-500' :
                          level === 'DIKLATAMA' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Letters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Surat Terakhir</h3>
                  <p className="text-xs text-slate-500">Buku agenda keluar & masuk</p>
                </div>
              </div>
              <button
                onClick={() => setActivePage('letters')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Buka
              </button>
            </div>

            <div className="space-y-3">
              {recentLetters.slice(0, 4).map((letter) => (
                <div key={letter.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {letter.letterNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(letter.date)}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">{letter.subject}</p>
                  <p className="text-[10px] text-slate-500">Tujuan: {letter.recipientOrSender}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

