import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  Building2, 
  Users, 
  Database,
  FileCheck
} from 'lucide-react';
import { api } from '../utils/api';

export default function Settings({ settings, onSettingsUpdated }) {
  const [formData, setFormData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const res = await api.updateSettings(formData);
      setMessage('Pengaturan ranting berhasil disimpan!');
      if (onSettingsUpdated) onSettingsUpdated(res.data);
      setTimeout(() => setMessage(''), 3500);
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Download Backup JSON
  const handleExportBackup = () => {
    window.open('/api/settings/export-backup', '_blank');
  };

  // Handle Import Backup
  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (confirm('Apakah Anda yakin ingin memulihkan cadangan data ini? Data saat ini akan digantikan.')) {
          await api.importBackup(json);
          alert('Data cadangan berhasil dipulihkan! Halaman akan dimuat ulang.');
          window.location.reload();
        }
      } catch (err) {
        alert('Gagal membaca file backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">
          Pengaturan Organisasi Ranting
        </h2>
        <p className="text-xs text-slate-500">
          Konfigurasi identitas desa, masa khidmat, kode persuratan, dan nama pengurus harian
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Profil Wilayah & Alamat */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Profil Wilayah Ranting</h3>
              <p className="text-[11px] text-slate-500">Nama desa dan data sekretariat organisasi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Desa / Kelurahan *</label>
              <input
                type="text"
                value={formData.villageName || ''}
                onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kecamatan *</label>
              <input
                type="text"
                value={formData.subDistrict || ''}
                onChange={(e) => setFormData({ ...formData, subDistrict: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kabupaten / Kota *</label>
              <input
                type="text"
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Masa Khidmat Kepengurusan</label>
              <input
                type="text"
                value={formData.period || ''}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="Contoh: 2025 - 2027"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kontak WhatsApp / Telp</label>
              <input
                type="text"
                value={formData.phoneContact || ''}
                onChange={(e) => setFormData({ ...formData, phoneContact: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Sekretariat</label>
            <input
              type="text"
              value={formData.secretariatAddress || ''}
              onChange={(e) => setFormData({ ...formData, secretariatAddress: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Wilayah Surat IPNU (PA)</label>
              <input
                type="text"
                value={formData.codeIpnu || ''}
                onChange={(e) => setFormData({ ...formData, codeIpnu: e.target.value })}
                placeholder="7354"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Wilayah Surat IPPNU (PA)</label>
              <input
                type="text"
                value={formData.codeIppnu || ''}
                onChange={(e) => setFormData({ ...formData, codeIppnu: e.target.value })}
                placeholder="7455"
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 text-amber-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Struktur Pimpinan Harian (Dwitunggal) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pimpinan Harian Ranting (Dwitunggal)</h3>
              <p className="text-[11px] text-slate-500">Nama penandatangan resmi surat dan kartu anggota (KTA)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* IPNU Leaders */}
            <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Pimpinan Ranting IPNU (Rekan)
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ketua Mandataris IPNU</label>
                <input
                  type="text"
                  value={formData.leaderIpnu || ''}
                  onChange={(e) => setFormData({ ...formData, leaderIpnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sekretaris IPNU</label>
                <input
                  type="text"
                  value={formData.secretaryIpnu || ''}
                  onChange={(e) => setFormData({ ...formData, secretaryIpnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bendahara IPNU</label>
                <input
                  type="text"
                  value={formData.treasurerIpnu || ''}
                  onChange={(e) => setFormData({ ...formData, treasurerIpnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Komandan Korp CBP</label>
                <input
                  type="text"
                  value={formData.cbpCommander || ''}
                  onChange={(e) => setFormData({ ...formData, cbpCommander: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            {/* IPPNU Leaders */}
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
              <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Pimpinan Ranting IPPNU (Rekanita)
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ketua Mandataris IPPNU</label>
                <input
                  type="text"
                  value={formData.leaderIppnu || ''}
                  onChange={(e) => setFormData({ ...formData, leaderIppnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Sekretaris IPPNU</label>
                <input
                  type="text"
                  value={formData.secretaryIppnu || ''}
                  onChange={(e) => setFormData({ ...formData, secretaryIppnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Bendahara IPPNU</label>
                <input
                  type="text"
                  value={formData.treasurerIppnu || ''}
                  onChange={(e) => setFormData({ ...formData, treasurerIppnu: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Komandan Korp KPP</label>
                <input
                  type="text"
                  value={formData.kppCommander || ''}
                  onChange={(e) => setFormData({ ...formData, kppCommander: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}
          </button>
        </div>

      </form>

      {/* Section 3: Cadangan & Pemulihan Data (Backup & Restore) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Cadangan & Pemulihan Data (Backup & Restore)</h3>
            <p className="text-[11px] text-slate-500">Amankan seluruh database anggota, surat, kas, dan inventaris</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Unduh Cadangan (Backup Data)</h4>
            <p className="text-[11px] text-slate-500">
              Simpan salinan database lengkap dalam format file JSON ke komputer Anda.
            </p>
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Backup JSON
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Pulihkan Data (Restore)</h4>
            <p className="text-[11px] text-slate-500">
              Pilih file cadangan `.json` untuk mengembalikan seluruh arsip sistem.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Pilih File Backup JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

    </div>
  );
}

