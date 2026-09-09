import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Trash2, 
  ExternalLink,
  Sparkles,
  Send,
  Inbox,
  CheckCircle,
  Copy,
  Eye
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { formatDate, getHijriDateString } from '../utils/formatters';

export default function Letters({ activeOrg, settings = {} }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(''); // 'Keluar' or 'Masuk'
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Form State
  const initialForm = {
    organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
    type: 'Keluar',
    category: 'A', // A = Internal, B = Eksternal
    dept: 'Sek',
    letterNumber: '',
    subject: 'Undangan Pertemuan Rutin Selapanan',
    recipientOrSender: 'Seluruh Anggota & Kader Ranting',
    date: new Date().toISOString().split('T')[0],
    eventDayDate: 'Ahad Pon, 13 September 2026',
    eventTime: '19:30 WIB s.d Selesai',
    eventLocation: "Gedung TPQ Baiturrohim Krajan",
    content: "Sehubungan dengan pelaksanaan agenda rutin selapanan Pimpinan Ranting, kami mengharap dengan hormat kehadiran Rekan/Rekanita pada acara yang insyaAllah akan diselenggarakan pada:",
    notes: "Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih."
  };

  const [formData, setFormData] = useState(initialForm);

  const loadLetters = async () => {
    try {
      setLoading(true);
      const res = await api.getLetters({
        org: activeOrg,
        type: typeFilter,
        search
      });
      setLetters(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, [activeOrg, typeFilter, search]);

  // Fetch suggested official letter number when opening add modal or changing org/category
  const fetchSuggestedNumber = async (org, cat, dept) => {
    try {
      const res = await api.getSuggestedLetterNumber({ org, category: cat, dept });
      setFormData(prev => ({ ...prev, letterNumber: res.number }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    const org = activeOrg === 'ALL' ? 'IPNU' : activeOrg;
    setFormData({
      ...initialForm,
      organization: org
    });
    fetchSuggestedNumber(org, 'A', 'Sek');
    setIsAddModalOpen(true);
  };

  const handleTemplateChange = (templateKey) => {
    if (templateKey === 'undangan') {
      setFormData(prev => ({
        ...prev,
        subject: 'Undangan Pertemuan Rutin Selapanan',
        recipientOrSender: 'Seluruh Anggota & Kader Ranting',
        content: 'Sehubungan dengan pelaksanaan agenda rutin selapanan dan pembacaan Diba\'iyah Pimpinan Ranting, kami mengharap kehadiran Rekan/Rekanita pada:',
        notes: 'Mengingat pentingnya acara ini, mohon hadir tepat waktu dengan mengenakan pakaian sopan berpeci/berkerudung.'
      }));
    } else if (templateKey === 'izin') {
      setFormData(prev => ({
        ...prev,
        category: 'B',
        subject: 'Permohonan Izin Peminjaman Tempat & Fasilitas',
        recipientOrSender: "Ta'mir Masjid & Pengelola TPQ",
        content: 'Dalam rangka menyelenggarakan kegiatan Masa Kesetiaan Anggota (MAKESTA) Pimpinan Ranting, kami bermaksud memohon izin peminjaman tempat aula dan sound system pada:',
        notes: 'Kami berkomitmen menjaga ketertiban, kebersihan, dan keamanan fasilitas yang dipinjam selama kegiatan berlangsung.'
      }));
      fetchSuggestedNumber(formData.organization, 'B', formData.dept);
    } else if (templateKey === 'mandat') {
      setFormData(prev => ({
        ...prev,
        category: 'A',
        subject: 'Surat Tugas / Mandat Delegasi Konferensi PAC',
        recipientOrSender: 'Panitia Pelaksana Konferancab PAC',
        content: 'Pimpinan Ranting dengan ini memberikan mandat penuh kepada kader yang namanya tercantum untuk menjadi delegasi resmi ranting pada acara:',
        notes: 'Demikian surat mandat ini diberikan agar dapat dipergunakan sebagaimana mestinya dengan penuh tanggung jawab.'
      }));
      fetchSuggestedNumber(formData.organization, 'A', formData.dept);
    } else if (templateKey === 'rekomendasi') {
      setFormData(prev => ({
        ...prev,
        category: 'A',
        subject: 'Surat Keterangan Aktif Berorganisasi',
        recipientOrSender: 'Pihak yang Berkepentingan / Kampus / Sekolah',
        content: 'Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa nama kader yang bersangkutan adalah anggota aktif kepengurusan:',
        notes: 'Surat keterangan aktif ini diterbitkan untuk melengkapi persyaratan beasiswa / administrasi kampus.'
      }));
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createLetter(formData);
      setIsAddModalOpen(false);
      loadLetters();
    } catch (err) {
      alert('Gagal membuat surat: ' + err.message);
    }
  };

  const handleDelete = async (id, subject) => {
    if (confirm(`Hapus arsip surat: ${subject}?`)) {
      try {
        await api.deleteLetter(id);
        loadLetters();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Administrasi Persuratan (E-Surat)
          </h2>
          <p className="text-xs text-slate-500">
            Generator nomor surat otomatis sesuai Pedoman Administrasi (PA) IPNU & IPPNU serta arsip resmi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Surat Baru / Cetak
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor surat, perihal, atau tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Arsip
          </button>
          <button
            onClick={() => setTypeFilter('Keluar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'Keluar' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Surat Keluar
          </button>
          <button
            onClick={() => setTypeFilter('Masuk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'Masuk' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Surat Masuk
          </button>
        </div>

      </div>

      {/* Letters List Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat arsip persuratan...</div>
      ) : letters.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Arsip Surat</h3>
          <p className="text-xs text-slate-500 mt-1">Gunakan tombol "Buat Surat Baru" untuk mencetak atau mengarsipkan surat.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Nomor Surat</th>
                  <th className="px-5 py-3.5">Organisasi & Tipe</th>
                  <th className="px-5 py-3.5">Perihal</th>
                  <th className="px-5 py-3.5">Tujuan / Pengirim</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {letters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {l.letterNumber}
                      </div>
                      <span className="text-[10px] text-slate-400">ID: {l.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          l.organization === 'IPNU' ? 'bg-emerald-100 text-emerald-800' :
                          l.organization === 'IPPNU' ? 'bg-amber-100 text-amber-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {l.organization}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          l.type === 'Keluar' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {l.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 text-sm max-w-sm line-clamp-1">{l.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{l.content}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-700">{l.recipientOrSender || '-'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(l.date)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLetter(l);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                          title="Lihat & Cetak Format Resmi A4"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.subject)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: BUAT SURAT BARU & TEMPLATE GENERATOR */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Penerbitan Surat Resmi (Pedoman Administrasi)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          
          {/* Quick Template Selector */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Gunakan Template Surat Bawaan Resmi:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('undangan')}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Undangan Rutinan
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('izin')}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Permohonan Tempat
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('mandat')}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Surat Mandat Delegasi
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('rekomendasi')}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Surat Keterangan Aktif
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organisasi *</label>
              <select
                value={formData.organization}
                onChange={(e) => {
                  const org = e.target.value;
                  setFormData(prev => ({ ...prev, organization: org }));
                  fetchSuggestedNumber(org, formData.category, formData.dept);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="IPNU">PR IPNU</option>
                <option value="IPPNU">PR IPPNU</option>
                <option value="BERSAMA">BERSAMA (IPNU-IPPNU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Surat</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setFormData(prev => ({ ...prev, category: cat }));
                  fetchSuggestedNumber(formData.organization, cat, formData.dept);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="A">A - Internal (Pengurus/Anggota/Banom NU)</option>
                <option value="B">B - Eksternal (Pemerintah/Umum/Donatur)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Bidang / Dept</label>
              <select
                value={formData.dept}
                onChange={(e) => {
                  const dept = e.target.value;
                  setFormData(prev => ({ ...prev, dept }));
                  fetchSuggestedNumber(formData.organization, formData.category, dept);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Sek">Sek (Kesekretariatan)</option>
                <option value="Pan">Pan (Kepanitiaan Khusus)</option>
                <option value="Kdr">Kdr (Kaderisasi)</option>
                <option value="Org">Org (Organisasi)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Surat Otomatis (Standar PA) *
            </label>
            <input
              type="text"
              value={formData.letterNumber}
              onChange={(e) => setFormData({ ...formData, letterNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-100 text-emerald-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Perihal Surat *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan / Penerima *</label>
              <input
                type="text"
                value={formData.recipientOrSender}
                onChange={(e) => setFormData({ ...formData, recipientOrSender: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Isi Surat / Pengantar</label>
            <textarea
              rows={3}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Hari & Tanggal Acara</label>
              <input
                type="text"
                value={formData.eventDayDate}
                onChange={(e) => setFormData({ ...formData, eventDayDate: e.target.value })}
                placeholder="Ahad, 13 September 2026"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Pelaksanaan</label>
              <input
                type="text"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                placeholder="19:30 WIB s.d Selesai"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tempat / Lokasi</label>
              <input
                type="text"
                value={formData.eventLocation}
                onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                placeholder="Gedung TPQ Baiturrohim"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Penutup</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
            >
              Simpan & Terbitkan Surat
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PREVIEW & CETAK FORMAT RESMI A4 */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Format Surat Resmi Siap Cetak (A4)"
        maxWidth="max-w-4xl"
      >
        {selectedLetter && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="no-print flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-600 font-medium">
                Surat Resmi Standar Pedoman Administrasi IPNU & IPPNU
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Surat Sekarang (A4)
              </button>
            </div>

            {/* Print Container: Real Paper Emulation */}
            <div className="print-container bg-white border border-slate-300 shadow-xl rounded-xl p-8 sm:p-12 text-slate-900 font-sans text-xs leading-relaxed max-w-[800px] mx-auto">
              
              {/* KOP SURAT RESMI - Logo Resmi IPNU & IPPNU (Kongres 2018) */}
              <div className="border-b-4 border-double border-slate-800 pb-3 mb-6">
                <div className="flex items-start gap-5">
                  {/* Left: Logos IPNU & IPPNU */}
                  <div className="flex items-center gap-2 self-center shrink-0">
                    <div className="w-[3cm] h-[3cm] flex items-center justify-center bg-white">
                      <img
                        src="/logo-ipnu.png"
                        alt="Logo IPNU"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-[3cm] h-[3cm] flex items-center justify-center bg-white">
                      <img
                        src="/logo-ippnu.png"
                        alt="Logo IPPNU"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Right: Teks Kop Rata Kanan - Arial Narrow 11 */}
                  <div className="flex-1 text-right space-y-0.5" style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: '11px' }}>
                    <h5 className="font-bold tracking-widest text-slate-600 uppercase">
                      PIMPINAN RANTING
                    </h5>
                    <h3 className="font-black tracking-tight text-emerald-900 uppercase leading-snug">
                      {selectedLetter.organization === 'IPNU' 
                        ? 'IKATAN PELAJAR NAHDLATUL ULAMA' 
                        : selectedLetter.organization === 'IPPNU'
                        ? 'IKATAN PELAJAR PUTRI NAHDLATUL ULAMA'
                        : 'IKATAN PELAJAR & IKATAN PELAJAR PUTRI NAHDLATUL ULAMA'}
                    </h3>
                    <h4 className="font-extrabold uppercase text-slate-800">
                      DESA {settings.villageName ? settings.villageName.toUpperCase() : 'SUKAMAJU'} KECAMATAN {settings.subDistrict ? settings.subDistrict.toUpperCase() : 'CILONGOK'}
                    </h4>
                    <p className="text-slate-500">
                      {settings.secretariatAddress || "Sekretariat: Gedung MWCNU Sukamaju"} • Telp/WA: {settings.phoneContact || '0812-3456-7890'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tanggal & Tempat */}
              <div className="flex justify-between items-start mb-6 text-[11px]">
                <div>
                  <table className="text-[11px]">
                    <tbody>
                      <tr>
                        <td className="font-semibold pr-2 py-0.5">Nomor</td>
                        <td className="pr-1">:</td>
                        <td className="font-mono font-bold">{selectedLetter.letterNumber}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold pr-2 py-0.5">Lampiran</td>
                        <td className="pr-1">:</td>
                        <td>-</td>
                      </tr>
                      <tr>
                        <td className="font-semibold pr-2 py-0.5">Perihal</td>
                        <td className="pr-1">:</td>
                        <td className="font-bold underline">{selectedLetter.subject}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-right">
                  <p>{settings.villageName || 'Sukamaju'}, {formatDate(selectedLetter.date)}</p>
                  <p className="text-[10px] text-emerald-800 font-mono font-semibold">{getHijriDateString(selectedLetter.date)}</p>
                </div>
              </div>

              {/* Kepada Yth */}
              <div className="mb-6">
                <p className="text-[11px]">Kepada Yang Terhormat:</p>
                <p className="text-[12px] font-bold text-slate-900 mt-1">{selectedLetter.recipientOrSender}</p>
                <p className="text-[11px] text-slate-700">di -</p>
                <p className="text-[11px] font-medium text-slate-700 pl-4">Tempat</p>
              </div>

              {/* Basmalah */}
              <div className="text-center my-5 font-amiri text-lg font-bold text-slate-800">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              {/* Salam Pembuka */}
              <p className="font-semibold italic mb-3 text-[11px]">
                Assalamu'alaikum Warahmatullahi Wabarakatuh
              </p>

              {/* Isi Surat */}
              <div className="space-y-3 text-[11px] text-justify leading-relaxed">
                <p>
                  Salam silaturrahim kami sampaikan, semoga limpahan rahmat, taufiq serta hidayah Allah SWT senantiasa menyertai kita dalam menjalankan aktifitas sehari-hari. Aamiin.
                </p>

                <p>
                  {selectedLetter.content || "Sehubungan dengan agenda kerja organisasi Pimpinan Ranting, bersama ini kami mengharap kehadiran Rekan / Rekanita pada agenda yang akan dilaksanakan pada:"}
                </p>

                {/* Event specs if any */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-3 ml-6 mr-6 space-y-1 text-[11px]">
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Hari / Tanggal</span>
                    <span className="col-span-3">: {selectedLetter.date ? formatDate(selectedLetter.date) : 'Sesuai Jadwal'}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Waktu</span>
                    <span className="col-span-3">: 19:30 WIB s.d Selesai</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Tempat</span>
                    <span className="col-span-3">: Gedung TPQ Baiturrohim / Balai Desa Sukamaju</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Acara</span>
                    <span className="col-span-3 font-bold">: {selectedLetter.subject}</span>
                  </div>
                </div>

                <p>
                  Demikian surat ini kami sampaikan, atas perhatian, perkenan dan kerjasamanya kami ucapkan terima kasih yang sebesar-besarnya.
                </p>
              </div>

              {/* Kalimat Penutup Resmi NU */}
              <div className="mt-5 space-y-1">
                <p className="font-serif italic font-bold text-[11px] text-emerald-900">
                  {selectedLetter.organization === 'IPPNU' 
                    ? 'Wallahu Waliyyut Taufiq Wal Hidayah' 
                    : 'Wallahul Muwaffiq Ila Aqwamith Thorieq'}
                </p>
                <p className="font-semibold italic text-[11px]">
                  Wassalamu'alaikum Warahmatullahi Wabarakatuh
                </p>
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="mt-10 pt-4">
                <div className="text-center font-bold text-[11px] uppercase mb-6">
                  PIMPINAN RANTING {selectedLetter.organization === 'BERSAMA' ? 'IPNU - IPPNU' : selectedLetter.organization} DESA {settings.villageName || 'SUKAMAJU'}
                </div>

                <div className="grid grid-cols-2 gap-8 text-center text-[11px]">
                  {/* Left: Sekretaris */}
                  <div className="flex flex-col justify-between h-28">
                    <p className="font-semibold">Sekretaris Mandataris,</p>
                    <div>
                      <p className="font-bold underline text-slate-900">
                        {selectedLetter.organization === 'IPPNU' 
                          ? (settings.secretaryIppnu || 'Dewi Lestari') 
                          : (settings.secretaryIpnu || 'Muhammad Rifqi')}
                      </p>
                      <p className="text-[10px] text-slate-500">NIA: 3302.22.003</p>
                    </div>
                  </div>

                  {/* Right: Ketua */}
                  <div className="flex flex-col justify-between h-28 relative">
                    <p className="font-semibold">Ketua Mandataris,</p>
                    {/* Stempel Digital Mockup */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 pointer-events-none select-none">
                      <div className="w-20 h-20 rounded-full border-2 border-emerald-800 flex items-center justify-center text-center font-bold text-[8px] text-emerald-800 uppercase p-1">
                        PR {selectedLetter.organization} SUKAMAJU
                      </div>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900">
                        {selectedLetter.organization === 'IPPNU' 
                          ? (settings.leaderIppnu || 'Siti Nur Halizah') 
                          : (settings.leaderIpnu || 'Ahmad Fauzi')}
                      </p>
                      <p className="text-[10px] text-slate-500">NIA: 3302.20.001</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

