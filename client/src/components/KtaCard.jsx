import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

export default function KtaCard({ member, settings = {} }) {
  const [side, setSide] = useState('front'); // 'front' or 'back'

  if (!member) return null;

  const isIpnu = member.organization === 'IPNU';
  const orgTitle = isIpnu ? 'IKATAN PELAJAR NAHDLATUL ULAMA' : 'IKATAN PELAJAR PUTRI NAHDLATUL ULAMA';
  const subOrg = isIpnu ? 'PIMPINAN RANTING IPNU' : 'PIMPINAN RANTING IPPNU';
  const village = settings.villageName || 'Sukamaju';
  const subDistrict = settings.subDistrict || 'Cilongok';
  const district = settings.district || 'Banyumas';

  // Card verification payload for QR
  const qrData = JSON.stringify({
    id: member.id,
    nik: member.nik,
    name: member.name,
    org: member.organization,
    level: member.cadreLevel,
    village: village,
    verified: true
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Bar */}
      <div className="no-print flex items-center gap-3 mb-6">
        <button
          onClick={() => setSide(side === 'front' ? 'back' : 'front')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          Putar Kartu (Lihat {side === 'front' ? 'Belakang' : 'Depan'})
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Cetak KTA (Print)
        </button>
      </div>

      {/* KTA Printable Container - Standard Credit Card Ratio (85.6mm x 53.98mm ~ 3.37in x 2.125in) */}
      <div className="w-[360px] sm:w-[400px] h-[240px] sm:h-[250px] relative rounded-2xl overflow-hidden shadow-2xl transition-all select-none border border-slate-200">
        
        {/* ================= FRONT SIDE ================= */}
        {side === 'front' && (
          <div className={`w-full h-full p-4 flex flex-col justify-between relative text-white ${
            isIpnu 
              ? 'bg-gradient-to-br from-[#00542c] via-[#00703c] to-[#013b1f]' 
              : 'bg-gradient-to-br from-[#006837] via-[#008a49] to-[#d97706]'
          }`}>
            
            {/* Background Nuance Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />

            {/* KTA Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-2">
              <div className="flex items-center gap-2.5">
                {/* Logo Badge */}
                <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  {isIpnu ? (
                    <div className="text-center font-black text-[#006837] text-[10px] leading-tight">
                      ★ IPNU ★
                    </div>
                  ) : (
                    <div className="text-center font-black text-[#f59e0b] text-[9px] leading-tight">
                      ★ IPPNU ★
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="text-[10px] font-bold tracking-widest text-emerald-200 uppercase leading-none">
                    KARTU TANDA ANGGOTA
                  </h5>
                  <h4 className="text-xs font-black tracking-tight text-white uppercase mt-0.5">
                    {subOrg} {village}
                  </h4>
                  <p className="text-[8px] text-white/80 font-medium">
                    Kec. {subDistrict} Kab. {district}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isIpnu ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30' : 'bg-amber-400/20 text-amber-100 border border-amber-300/30'
                }`}>
                  {member.cadreLevel || 'MAKESTA'}
                </span>
              </div>
            </div>

            {/* KTA Content: Photo & Details */}
            <div className="relative z-10 flex items-center gap-3.5 my-auto">
              {/* Photo */}
              <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-white/90 shadow-md bg-slate-100 shrink-0 relative">
                <img 
                  src={member.photo} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = isIpnu ? 
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' : 
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              {/* Identity Fields */}
              <div className="flex-1 text-[11px] leading-tight space-y-1">
                <div>
                  <p className="text-[8px] text-white/70 uppercase tracking-wider">Nama Lengkap</p>
                  <p className="font-extrabold text-sm tracking-tight text-white drop-shadow-sm">{member.name}</p>
                </div>
                <div>
                  <p className="text-[8px] text-white/70 uppercase tracking-wider">NIA / ID Kader</p>
                  <p className="font-mono font-bold text-amber-200">{member.id} / {member.nik || '3302...'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className="text-[8px] text-white/70 uppercase">Jabatan</p>
                    <p className="font-semibold text-white truncate">{member.position}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-white/70 uppercase">Wilayah</p>
                    <p className="font-semibold text-white truncate">{member.dusun}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Validation */}
              <div className="p-1.5 bg-white rounded-lg shadow-md shrink-0 flex flex-col items-center">
                <QRCodeSVG value={qrData} size={48} level="M" />
                <span className="text-[6px] font-bold text-slate-700 mt-0.5">VALID</span>
              </div>
            </div>

            {/* KTA Footer */}
            <div className="relative z-10 flex items-center justify-between pt-1.5 border-t border-white/20 text-[8px] text-white/80">
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                Kader Resmi Nahdlatul Ulama
              </span>
              <span className="font-mono text-emerald-200">
                Masa Berlaku: {settings.period || '2025-2027'}
              </span>
            </div>
          </div>
        )}

        {/* ================= BACK SIDE ================= */}
        {side === 'back' && (
          <div className="w-full h-full p-4 flex flex-col justify-between relative bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 opacity-90" />
            
            {/* Header Back */}
            <div className="relative z-10 text-center border-b border-white/10 pb-1.5">
              <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                TRI KOMITMEN PELAJAR NU
              </h4>
              <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">
                BELAJAR • BERJUANG • BERTAQWA
              </p>
            </div>

            {/* Commitments & Rules */}
            <div className="relative z-10 text-[9px] leading-relaxed text-slate-300 space-y-1 my-auto px-2">
              <p className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>Setia mempertahankan Pancasila dan UUD 1945 serta menjaga keutuhan NKRI.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>Menjunjung tinggi ajaran Islam Ahlussunnah Wal Jama'ah An-Nahdliyyah.</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>Menaati Anggaran Dasar & Anggaran Rumah Tangga serta Pedoman Administrasi {member.organization}.</span>
              </p>
            </div>

            {/* Signature Area */}
            <div className="relative z-10 flex justify-between items-end pt-2 border-t border-white/10 text-[8px] text-slate-400">
              <div className="text-left">
                <p>Diterbitkan di: {village}</p>
                <p>Sekretariat: {settings.secretariatAddress ? settings.secretariatAddress.slice(0, 30) + '...' : 'Gedung MWCNU'}</p>
              </div>

              <div className="text-center">
                <p className="text-[7px] text-slate-400 uppercase">Pimpinan Ranting {member.organization}</p>
                <div className="h-6 flex items-center justify-center">
                  <span className="text-[9px] font-serif italic text-amber-200">Tanda Tangan Resmi</span>
                </div>
                <p className="font-bold text-white text-[8px] underline">
                  {isIpnu ? (settings.leaderIpnu || 'Ahmad Fauzi') : (settings.leaderIppnu || 'Siti Nur Halizah')}
                </p>
                <p className="text-[7px] text-slate-400">Ketua Mandataris</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="no-print text-xs text-slate-400 mt-3 text-center">
        Kartu digital ini berstandar KTA resmi dan dilengkapi barcode validasi data kader.
      </p>
    </div>
  );
}

