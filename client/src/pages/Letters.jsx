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
  Download,
  Eye,
  Megaphone,
  Upload,
  Paperclip
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { formatDate, getHijriDateString } from '../utils/formatters';

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/* KOP SURAT RESMI — dipakai SERAGAM oleh semua template (mengikuti PAN-UNDANGAN RA.docx) */
function KopSurat({ heading1, heading2, area, address, phone, email }) {
  return (
    <div className="relative border-b-4 border-double border-slate-800 pb-3 mb-7">
      {/* Kiri: Logo IPNU & IPPNU berdampingan */}
      <div className="absolute left-0 top-0 flex items-center gap-1">
        <img src="/logo-ipnu.png" alt="Logo IPNU" className="w-[3cm] h-[3cm] object-contain" />
        <img src="/logo-ippnu.png" alt="Logo IPPNU" className="w-[3cm] h-[3cm] object-contain" />
      </div>

      {/* Kanan: Teks Kop rata kanan */}
      <div className="text-right pl-[6.2cm]">
        <p className="font-bold uppercase leading-snug" style={{ color: '#00B050', fontSize: '13.5px' }}>
          {heading1}
        </p>
        <p className="font-bold uppercase leading-snug" style={{ color: '#00B050', fontSize: '13.5px' }}>
          {heading2}
        </p>
        <p className="font-bold uppercase leading-snug" style={{ fontSize: '11.5px', color: '#000000' }}>
          {area}
        </p>
        <p className="font-bold text-[9.5px] leading-snug" style={{ color: '#000000' }}>
          {address}
        </p>
        <p className="font-bold text-[9.5px] leading-snug" style={{ color: '#000000' }}>
          {phone}{' '}
          <img src="/icon-telp.png" alt="Telp" className="inline-block w-[11px] h-[11px] align-middle" />
        </p>
        <p className="font-bold text-[9.5px] leading-snug">
          <span className="text-[#0000FF] underline">{email}</span>{' '}
          <img src="/icon-email.png" alt="Email" className="inline-block w-[11px] h-[11px] align-middle" />
        </p>
      </div>
    </div>
  );
}

export default function Letters({ activeOrg, settings = {} }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(''); // 'Keluar' or 'Masuk'
  const [search, setSearch] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);

  // Import Surat Masuk
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importItems, setImportItems] = useState([]);
  const [importing, setImporting] = useState(false);

  // Form State
  const initialForm = {
    organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
    type: 'Keluar',
    category: 'A', // A = Internal, B = Eksternal
    dept: 'Sek',
    template: '', // '' = standar, 'undangan-ra' = Panitia Rapat Anggota
    letterNumber: '',
    subject: 'Undangan Pertemuan Rutin Selapanan',
    recipientOrSender: 'Seluruh Anggota & Kader Ranting',
    date: new Date().toISOString().split('T')[0],
    eventName: 'Rapat Anggota IV Dan Konferensi IV',
    eventDayDate: 'Rabu, 29 Oktober 2025',
    eventTime: '18.30 WIB - selesai',
    eventLocation: "Gedung TPQ Baiturrohim Krajan",
    greetingCall: 'Rekan',
    committeeChairman: 'LAELATUL FIRDAUS',
    committeeSecretary: 'MUHAMMAD IRFANUDIN',
    chairmanIpnu: 'IDZNIRRAHMAN AL-HAZMI',
    chairmanIppnu: 'NAURAH SALMA',
    raEdition: 'IV',
    kopLine3: 'BAROS KELURAHAN KALIBAROS',
    letterPlace: 'Pekalongan',
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

  // Compose nomor surat khas Panitia Rapat Anggota (Pan. RA):
  // 001/PR/Pan. RA/A/7354-7455/IV/X/2025
  const composeRaNumber = (category = 'A', edition = formData.raEdition || 'IV', dateValue = formData.date) => {
    const raCount = letters.filter(l => l.type === 'Keluar' && l.dept === 'Pan. RA').length + 1;
    const seq = String(raCount).padStart(3, '0');
    const d = dateValue ? new Date(dateValue) : new Date();
    const dateObj = isNaN(d.getTime()) ? new Date() : d;
    return `${seq}/PR/Pan. RA/${category}/${settings.codeIpnu || '7354'}-${settings.codeIppnu || '7455'}/${edition || 'IV'}/${ROMAN_MONTHS[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
  };

  const handleOpenAdd = () => {
    const org = activeOrg === 'ALL' ? 'IPNU' : activeOrg;
    setFormData({
      ...initialForm,
      organization: org,
      committeeChairman: settings.treasurerIpnu || 'LAELATUL FIRDAUS',
      committeeSecretary: settings.secretaryIpnu || 'MUHAMMAD IRFANUDIN',
      chairmanIpnu: settings.leaderIpnu || 'IDZNIRRAHMAN AL-HAZMI',
      chairmanIppnu: settings.leaderIppnu || 'NAURAH SALMA',
      kopLine3: `${(settings.villageName || 'BAROS').toUpperCase()} KELURAHAN ${(settings.subDistrict || 'KALIBAROS').toUpperCase()}`
    });
    fetchSuggestedNumber(org, 'A', 'Sek');
    setIsAddModalOpen(true);
  };

  const handleTemplateChange = (templateKey) => {
    if (templateKey === 'undangan') {
      setFormData(prev => ({
        ...prev,
        template: '',
        dept: 'Sek',
        subject: 'Undangan Pertemuan Rutin Selapanan',
        recipientOrSender: 'Seluruh Anggota & Kader Ranting',
        content: 'Sehubungan dengan pelaksanaan agenda rutin selapanan dan pembacaan Diba\'iyah Pimpinan Ranting, kami mengharap kehadiran Rekan/Rekanita pada:',
        notes: 'Mengingat pentingnya acara ini, mohon hadir tepat waktu dengan mengenakan pakaian sopan berpeci/berkerudung.'
      }));
    } else if (templateKey === 'izin') {
      setFormData(prev => ({
        ...prev,
        template: '',
        dept: 'Sek',
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
        template: '',
        dept: 'Sek',
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
        template: '',
        dept: 'Sek',
        category: 'A',
        subject: 'Surat Keterangan Aktif Berorganisasi',
        recipientOrSender: 'Pihak yang Berkepentingan / Kampus / Sekolah',
        content: 'Yang bertanda tangan di bawah ini menerangkan dengan sesungguhnya bahwa nama kader yang bersangkutan adalah anggota aktif kepengurusan:',
        notes: 'Surat keterangan aktif ini diterbitkan untuk melengkapi persyaratan beasiswa / administrasi kampus.'
      }));
    } else if (templateKey === 'undangan-ra') {
      // Format persis PAN-UNDANGAN RA.docx (Panitia Rapat Anggota / Konferensi)
      setFormData(prev => {
        const next = {
          ...prev,
          template: 'undangan-ra',
          organization: 'BERSAMA',
          type: 'Keluar',
          category: 'A',
          dept: 'Pan. RA',
          subject: 'UNDANGAN',
          recipientOrSender: prev.recipientOrSender || 'Pimpinan Cabang IPNU Kota Pekalongan',
          eventName: 'Rapat Anggota IV Dan Konferensi IV',
          eventDayDate: 'Rabu, 29 Oktober 2025',
          eventTime: '18.30 WIB - selesai',
          eventLocation: prev.eventLocation || '',
          greetingCall: prev.greetingCall || 'Rekan',
          content: '"Rapat Anggota IV Dan Konferensi IV" Pimpinan Ranting IPNU & IPPNU',
          notes: "Demi kelancaran acara tersebut, kami mengundang " + (prev.greetingCall || 'Rekan') + " untuk menghadiri kegiatan tersebut."
        };
        return { ...next, letterNumber: composeRaNumber('A', next.raEdition, next.date) };
      });
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

  const openViewer = (l) => {
    setViewerFile({
      name: l.attachment.name || 'lampiran',
      type: l.attachment.type,
      dataUrl: l.attachment.dataUrl,
      size: l.attachment.size,
      letterNumber: l.letterNumber || '',
      subject: l.subject || '',
    });
  };

  const downloadDataUrl = async (dataUrl, filename) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImportFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter(f =>
      f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (files.length === 0) return;

    const resolved = await Promise.all(
      files.map(async (f) => {
        const dataUrl = await fileToDataUrl(f);
        return {
          key: `${f.name}-${f.lastModified}-${f.size}`,
          fileName: f.name,
          fileType: f.type || 'application/octet-stream',
          size: f.size,
          dataUrl,
          letterNumber: '',
          recipientOrSender: '',
          subject: f.name.replace(/\.[^.]+$/, ''),
          date: new Date().toISOString().split('T')[0],
        };
      })
    );

    setImportItems(prev => [...prev, ...resolved]);
    e.target.value = '';
  };

  const updateImportItem = (key, field, value) => {
    setImportItems(prev => prev.map(it => (it.key === key ? { ...it, [field]: value } : it)));
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (importItems.length === 0) return;
    setImporting(true);
    try {
      const payload = importItems.map(it => ({
        letterNumber: it.letterNumber,
        subject: it.subject,
        recipientOrSender: it.recipientOrSender,
        date: it.date,
        organization: activeOrg === 'ALL' ? 'BERSAMA' : (activeOrg || 'BERSAMA'),
        content: '',
        attachment: { name: it.fileName, type: it.fileType, size: it.size, dataUrl: it.dataUrl },
      }));
      const res = await api.importLetters(payload);
      setIsImportModalOpen(false);
      setImportItems([]);
      loadLetters();
      alert(res.message || 'Surat masuk berhasil diimport');
    } catch (err) {
      alert('Gagal import surat masuk: ' + err.message);
    } finally {
      setImporting(false);
    }
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all shadow-blue-900/20"
          >
            <Upload className="w-4 h-4" />
            Import Surat Masuk
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Buat Surat Baru / Cetak
          </button>
        </div>
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
                        {l.dept === 'Pan. RA' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                            Pan. RA
                          </span>
                        )}
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
                        {l.attachment && l.attachment.dataUrl && (
                          <button
                            onClick={() => openViewer(l)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                            title={`Lihat lampiran: ${l.attachment.name || 'surat'}`}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        )}
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
                onClick={() => handleTemplateChange('undangan-ra')}
                className="px-2.5 py-1 rounded-lg bg-amber-500 border border-amber-400 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
              >
                Undangan Panitia RA & Konferensi
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

          {formData.template === 'undangan-ra' && (
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>Detail Undangan Panitia Rapat Anggota (Pan. RA) - format PAN-UNDANGAN RA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Acara *</label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Panggilan Undangan</label>
                  <select
                    value={formData.greetingCall}
                    onChange={(e) => setFormData({ ...formData, greetingCall: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Rekan">Rekan</option>
                    <option value="Rekanita">Rekanita</option>
                    <option value="Bapak">Bapak</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Sahabat">Sahabat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hari & Tanggal Acara</label>
                  <input
                    type="text"
                    value={formData.eventDayDate}
                    onChange={(e) => setFormData({ ...formData, eventDayDate: e.target.value })}
                    placeholder="Rabu, 29 Oktober 2025"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    placeholder="18.30 WIB - selesai"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tempat / Lokasi</label>
                  <input
                    type="text"
                    value={formData.eventLocation}
                    onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                    placeholder="Aula / Masjid..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ketua Pelaksana (Panitia)</label>
                  <input
                    type="text"
                    value={formData.committeeChairman}
                    onChange={(e) => setFormData({ ...formData, committeeChairman: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sekretaris Pelaksana (Panitia)</label>
                  <input
                    type="text"
                    value={formData.committeeSecretary}
                    onChange={(e) => setFormData({ ...formData, committeeSecretary: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ketua IPNU (Mengetahui)</label>
                  <input
                    type="text"
                    value={formData.chairmanIpnu}
                    onChange={(e) => setFormData({ ...formData, chairmanIpnu: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ketua IPPNU (Mengetahui)</label>
                  <input
                    type="text"
                    value={formData.chairmanIppnu}
                    onChange={(e) => setFormData({ ...formData, chairmanIppnu: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Edisi RA (Romawi)</label>
                  <input
                    type="text"
                    value={formData.raEdition}
                    onChange={(e) => {
                      const edition = e.target.value;
                      setFormData(prev => ({ ...prev, raEdition: edition, letterNumber: composeRaNumber('A', edition, prev.date) }));
                    }}
                    placeholder="IV"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Baris Kop "Kelurahan"</label>
                  <input
                    type="text"
                    value={formData.kopLine3}
                    onChange={(e) => setFormData({ ...formData, kopLine3: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kota Terbit</label>
                  <input
                    type="text"
                    value={formData.letterPlace}
                    onChange={(e) => setFormData({ ...formData, letterPlace: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <p className="text-[10px] text-amber-700 mt-2 font-medium">
                Nomor surat otomatis dibentuk seperti contoh file: 001/PR/Pan. RA/A/7354-7455/IV/X/2025 (bisa diedit manual).
              </p>
            </div>
          )}

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
                  setFormData(prev => {
                    const updated = { ...prev, category: cat };
                    if (updated.template === 'undangan-ra') {
                      updated.letterNumber = composeRaNumber(cat, updated.raEdition, updated.date);
                    }
                    return updated;
                  });
                  if (formData.template !== 'undangan-ra') {
                    fetchSuggestedNumber(formData.organization, cat, formData.dept);
                  }
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
                  setFormData(prev => {
                    const updated = { ...prev, dept };
                    if (updated.template === 'undangan-ra') {
                      updated.letterNumber = composeRaNumber(updated.category, updated.raEdition, updated.date);
                    }
                    return updated;
                  });
                  if (formData.template !== 'undangan-ra') {
                    fetchSuggestedNumber(formData.organization, formData.category, dept);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              >
                <option value="Sek">Sek (Kesekretariatan)</option>
                <option value="Pan. RA">Pan. RA (Panitia Rapat Anggota)</option>
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

          {formData.template !== 'undangan-ra' && (
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
          )}

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

      {/* MODAL: IMPORT SURAT MASUK (GAMBAR / PDF) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Surat Masuk (Gambar / PDF)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/70">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Pilih File Surat Masuk</span>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-blue-300 rounded-xl bg-white p-8 text-center hover:bg-blue-50/60 transition-colors">
              <Paperclip className="w-8 h-8 text-blue-400" />
              <span className="text-xs font-semibold text-blue-700">
                Klik untuk memilih beberapa file sekaligus
              </span>
              <span className="text-[11px] text-slate-400">Format: JPG, PNG, WEBP, atau PDF</span>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                multiple
                onChange={handleImportFiles}
                className="hidden"
              />
            </label>
          </div>

          {importItems.length > 0 ? (
            <>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {importItems.map((it) => (
                  <div key={it.key} className="flex items-start gap-3 p-3 bg-white">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center group">
                      {it.fileType === 'application/pdf' ? (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded">PDF</span>
                      ) : (
                        <img src={it.dataUrl} alt={it.fileName} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => openViewer({
                          attachment: { name: it.fileName, type: it.fileType, dataUrl: it.dataUrl, size: it.size },
                          letterNumber: it.letterNumber || '',
                          subject: it.subject || it.fileName,
                        })}
                        className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        title="Pratinjau file sebelum import"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">No. Surat (dari pengirim)</label>
                        <input
                          type="text"
                          value={it.letterNumber}
                          onChange={(e) => updateImportItem(it.key, 'letterNumber', e.target.value)}
                          placeholder="mis. 016/PRPKC/IX/26"
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pengirim</label>
                        <input
                          type="text"
                          value={it.recipientOrSender}
                          onChange={(e) => updateImportItem(it.key, 'recipientOrSender', e.target.value)}
                          placeholder="Nama lembaga / instansi pengirim"
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Perihal</label>
                        <input
                          type="text"
                          value={it.subject}
                          onChange={(e) => updateImportItem(it.key, 'subject', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tanggal Surat</label>
                        <input
                          type="date"
                          value={it.date}
                          onChange={(e) => updateImportItem(it.key, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => setImportItems(prev => prev.filter(x => x.key !== it.key))}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          Batalkan file ini
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportItems([]); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {importing ? 'Mengimport...' : `Simpan ${importItems.length} Surat Masuk`}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-center text-slate-400 py-4">
              Belum ada file dipilih. Pilih gambar atau PDF surat masuk untuk mulai import.
            </p>
          )}
        </form>
      </Modal>

      {/* MODAL: LIHAT LAMPIRAN FILE (GAMBAR / PDF) */}
      <Modal
        isOpen={!!viewerFile}
        onClose={() => setViewerFile(null)}
        title="Lihat Lampiran Surat"
        maxWidth="max-w-5xl"
      >
        {viewerFile && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-xs space-y-0.5 min-w-0">
                <p className="font-bold text-slate-800 truncate">{viewerFile.name}</p>
                <p className="text-slate-500 truncate">
                  {viewerFile.letterNumber ? `No. ${viewerFile.letterNumber} · ` : ''}
                  {viewerFile.subject}
                </p>
                <p className="text-slate-400">
                  {viewerFile.type}
                  {viewerFile.size ? ` · ${(viewerFile.size / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={viewerFile.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => downloadDataUrl(viewerFile.dataUrl, viewerFile.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </button>
              </div>
            </div>
            <div className="bg-slate-100 rounded-xl overflow-auto max-h-[65vh]">
              {viewerFile.type === 'application/pdf' ? (
                <iframe
                  src={viewerFile.dataUrl}
                  title={viewerFile.name}
                  className="w-full h-[60vh]"
                />
              ) : (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={viewerFile.dataUrl}
                    alt={viewerFile.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
                  />
                </div>
              )}
            </div>
          </div>
        )}
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
                {selectedLetter.template === 'undangan-ra'
                  ? 'Undangan Panitia Rapat Anggota & Konferensi (mengikuti PAN-UNDANGAN RA)'
                  : 'Surat Resmi Standar Pedoman Administrasi IPNU & IPPNU'}
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Surat Sekarang (A4)
              </button>
            </div>

            {selectedLetter.template === 'undangan-ra' ? (
              /* ===================== LAYOUT PANITIA RA (PAN-UNDANGAN RA.docx) ===================== */
              <div
                className="print-container bg-white border border-slate-300 shadow-xl rounded-xl p-8 sm:p-12 text-slate-900 text-[11.5px] leading-relaxed max-w-[800px] mx-auto"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* KOP SURAT PANITIA RA (identik dengan template standar) */}
                <KopSurat
                  heading1={`Panitia ${selectedLetter.eventName ? selectedLetter.eventName.toUpperCase() : 'RAPAT ANGGOTA IV DAN KONFERENSI IV'}`}
                  heading2={selectedLetter.kopLine2 || 'PIMPINAN RANTING IPNU DAN IPPNU'}
                  area={selectedLetter.kopLine3 || 'BAROS KELURAHAN KALIBAROS'}
                  address={selectedLetter.kopAddress || settings.secretariatAddress || 'Jl. Otto Iskandardinata Baros Pekalongan Timur, 51129.'}
                  phone={selectedLetter.kopContact || settings.phoneContact || '0896-6943-8098 (Firdaus), 0882-2765-3594 (Irfan)'}
                  email={selectedLetter.kopEmail || settings.emailContact || 'ipnuppnubaros@gmail.com'}
                />

                {/* Nomor, Lampiran, Hal */}
                <div className="mb-5 text-[11.5px]">
                  <p><span className="font-semibold">Nomor</span>&emsp;: {selectedLetter.letterNumber}</p>
                  <p><span className="font-semibold">Lampiran</span>&nbsp;: -</p>
                  <p><span className="font-semibold">Hal</span>&emsp;&emsp;: <span className="font-bold underline">{selectedLetter.subject}</span></p>
                </div>

                {/* Alamat Tujuan */}
                <div className="mb-5">
                  <p>Yth.</p>
                  <p className="font-bold pl-5">{selectedLetter.recipientOrSender || ''}</p>
                  <p className="pl-5">Di-</p>
                  <p className="pl-9">Tempat</p>
                </div>

                {/* Salam Pembuka */}
                <p className="mb-3 text-justify">
                  Assalamu'alaikum Wr.Wb. Bismillahirrahmanirrahim
                </p>

                {/* Isi Surat */}
                <div className="text-justify space-y-3">
                  <p>
                    Salam silaturahim kami sampaikan dengan iringan do'a, semoga Rekan dan Rekanita dalam lindungan Allah Yang Maha Esa, serta diberi kekuatan dan kesehatan dalam menjalankan tugas sehari-hari. Aamien.
                  </p>
                  <p>
                    Dalam rangka "{selectedLetter.eventName || 'Rapat Anggota IV Dan Konferensi IV'}", yang akan dilaksanakan pada:
                  </p>
                  <div className="ml-6 mr-6 space-y-1">
                    <div className="grid grid-cols-4">
                      <span>Hari/Tanggal</span>
                      <span className="col-span-3">: {selectedLetter.eventDayDate || formatDate(selectedLetter.date)}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span>Waktu</span>
                      <span className="col-span-3">: {selectedLetter.eventTime || ''}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span>Tempat</span>
                      <span className="col-span-3">: {selectedLetter.eventLocation || ''}</span>
                    </div>
                  </div>
                  <p>
                    Demi kelancaran acara tersebut, kami mengundang {selectedLetter.greetingCall || 'Rekan'} untuk menghadiri kegiatan tersebut.
                  </p>
                  <p>
                    {selectedLetter.notes || 'Demikian pemberitahuan ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terimakasih.'}
                  </p>
                </div>

                {/* Penutup NU */}
                <div className="mt-5 space-y-1">
                  <p className="font-serif italic font-bold">Wallahulmuwafiq ilaa Aqwamith thorieq</p>
                  <p className="italic">Wassalamu'alaikum Wr.Wb</p>
                </div>

                {/* Tempat & Tanggal */}
                <div className="mt-5 text-right">
                  <p className="font-semibold">{selectedLetter.letterPlace || 'Pekalongan'}, {formatDate(selectedLetter.date)} M</p>
                  <p className="font-semibold">{getHijriDateString(selectedLetter.date)}</p>
                </div>

                {/* Kolom Panitia */}
                <div className="mt-8 text-center">
                  <p className="font-bold uppercase leading-snug">
                    PANITIA {selectedLetter.eventName ? selectedLetter.eventName.toUpperCase() : 'RAPAT ANGGOTA IV DAN KONFERENSI IV'}
                  </p>
                  <p className="font-bold uppercase">PIMPINAN RANTING IPNU &amp; IPPNU BAROS</p>
                  <p className="font-bold uppercase">{selectedLetter.kopLine3 || 'KELURAHAN KALIBAROS'}</p>
                </div>

                {/* TTD Panitia: Ketua & Sekretaris Pelaksana */}
                <div className="grid grid-cols-2 gap-8 mt-8 text-center">
                  <div>
                    <p className="font-semibold">Ketua Pelaksana,</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase underline">{selectedLetter.committeeChairman || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Sekretaris,</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase underline">{selectedLetter.committeeSecretary || '-'}</p>
                  </div>
                </div>

                {/* Mengetahui */}
                <div className="mt-10">
                  <p className="font-semibold pl-4">Mengetahui,</p>
                  <p className="font-bold uppercase text-center leading-snug mt-1">
                    PIMPINAN RANTING
                    <br />
                    IKATAN PELAJAR NAHDLATUL ULAMA
                    <br />
                    IKATAN PELAJAR PUTRI NAHDLATUL ULAMA
                    <br />
                    {selectedLetter.kopLine3 || 'BAROS KELURAHAN KALIBAROS'}
                  </p>
                </div>

                {/* TTD Pengurus: Ketua IPNU & Ketua IPPNU */}
                <div className="grid grid-cols-2 gap-8 mt-8 text-center">
                  <div>
                    <p className="font-semibold">Ketua IPNU,</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase underline">{selectedLetter.chairmanIpnu || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Ketua IPPNU,</p>
                    <div className="h-16" />
                    <p className="font-bold uppercase underline">{selectedLetter.chairmanIppnu || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* ===================== LAYOUT SURAT RESMI STANDAR (konsisten dgn format Pan. RA) ===================== */
              <div
                className="print-container bg-white border border-slate-300 shadow-xl rounded-xl p-8 sm:p-12 text-slate-900 text-[11.5px] leading-relaxed max-w-[800px] mx-auto"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* KOP SURAT RESMI (identik dengan template Pan. RA) */}
                <KopSurat
                  heading1={selectedLetter.organization === 'IPNU'
                    ? 'PIMPINAN RANTING IKATAN PELAJAR NAHDLATUL ULAMA'
                    : selectedLetter.organization === 'IPPNU'
                    ? 'PIMPINAN RANTING IKATAN PELAJAR PUTRI NAHDLATUL ULAMA'
                    : 'PIMPINAN RANTING IPNU DAN IPPNU'}
                  heading2={`${settings.villageName ? settings.villageName.toUpperCase() : 'KALIBAROS'} KELURAHAN KECAMATAN ${settings.subDistrict ? settings.subDistrict.toUpperCase() : 'PEKALONGAN TIMUR'}`}
                  area={(settings.district || 'Kota Pekalongan').trim().toUpperCase()}
                  address={settings.secretariatAddress || "Sekretariat: Gedung Bersama PR IPNU IPPNU Kalibaros"}
                  phone={settings.phoneContact || '0812-3456-7890'}
                  email={settings.emailContact || 'ipnuippnubaros@gmail.com'}
                />

                {/* Nomor, Lampiran, Hal */}
                <div className="mb-5">
                  <p><span className="font-semibold">Nomor</span>&emsp;: {selectedLetter.letterNumber}</p>
                  <p><span className="font-semibold">Lampiran</span>&nbsp;: -</p>
                  <p><span className="font-semibold">Hal</span>&emsp;&emsp;: <span className="font-bold underline">{selectedLetter.subject}</span></p>
                </div>

                {/* Alamat Tujuan */}
                <div className="mb-5">
                  <p>Yth.</p>
                  <p className="font-bold pl-5">{selectedLetter.recipientOrSender || ''}</p>
                  <p className="pl-5">Di-</p>
                  <p className="pl-9">Tempat</p>
                </div>

                {/* Salam Pembuka */}
                <p className="mb-3 text-justify">
                  Assalamu'alaikum Wr.Wb. Bismillahirrahmanirrahim
                </p>

                {/* Isi Surat */}
                <div className="text-justify space-y-3">
                  <p>
                    Salam silaturrahim kami sampaikan dengan iringan do'a, semoga Rekan dan Rekanita dalam lindungan Allah Yang Maha Esa, serta diberi kekuatan dan kesehatan dalam menjalankan tugas sehari-hari. Aamien.
                  </p>

                  <p>
                    {selectedLetter.content || "Sehubungan dengan agenda kerja organisasi Pimpinan Ranting, bersama ini kami mengharap kehadiran Rekan / Rekanita pada agenda yang akan dilaksanakan pada:"}
                  </p>

                  {/* Detail Acara */}
                  <div className="ml-6 mr-6 space-y-1">
                    <div className="grid grid-cols-4">
                      <span>Hari/Tanggal</span>
                      <span className="col-span-3">: {selectedLetter.eventDayDate || (selectedLetter.date ? formatDate(selectedLetter.date) : '-')}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span>Waktu</span>
                      <span className="col-span-3">: {selectedLetter.eventTime || '- - -'}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span>Tempat</span>
                      <span className="col-span-3">: {selectedLetter.eventLocation || '- - -'}</span>
                    </div>
                    <div className="grid grid-cols-4">
                      <span>Acara</span>
                      <span className="col-span-3 font-bold">: {selectedLetter.subject}</span>
                    </div>
                  </div>

                  <p>
                    Demikian surat ini kami sampaikan, atas perhatian, perkenan dan kerjasamanya kami ucapkan terima kasih yang sebesar-besarnya.
                  </p>
                </div>

                {/* Kalimat Penutup Resmi NU */}
                <div className="mt-5 space-y-1">
                  <p className="font-serif italic font-bold">
                    {selectedLetter.organization === 'IPPNU' 
                      ? 'Wallahu Waliyyut Taufiq Wal Hidayah' 
                      : 'Wallahul Muwaffiq Ila Aqwamith Thorieq'}
                  </p>
                  <p className="italic">
                    Wassalamu'alaikum Wr.Wb
                  </p>
                </div>

                {/* Tempat & Tanggal */}
                <div className="mt-5 text-right">
                  <p className="font-semibold">{(selectedLetter.letterPlace || 'Pekalongan')}, {formatDate(selectedLetter.date)} M</p>
                  <p className="font-semibold">{getHijriDateString(selectedLetter.date)}</p>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="mt-8">
                  <div className="text-center font-bold uppercase mb-8">
                    PIMPINAN RANTING {selectedLetter.organization === 'BERSAMA' ? 'IPNU - IPPNU' : selectedLetter.organization} DESA {settings.villageName || 'SUKAMAJU'}
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-center">
                    {/* Left: Sekretaris */}
                    <div>
                      <p className="font-semibold">Sekretaris Mandataris,</p>
                      <div className="h-16" />
                      <p className="font-bold uppercase underline text-slate-900">
                        {selectedLetter.organization === 'IPPNU' 
                          ? (settings.secretaryIppnu || 'Dewi Lestari') 
                          : (settings.secretaryIpnu || 'Muhammad Rifqi')}
                      </p>
                      <p className="text-[10px] text-slate-500">NIA: 3302.22.003</p>
                    </div>

                    {/* Right: Ketua */}
                    <div>
                      <p className="font-semibold">Ketua Mandataris,</p>
                      <div className="h-16" />
                      <p className="font-bold uppercase underline text-slate-900">
                        {selectedLetter.organization === 'IPPNU' 
                          ? (settings.leaderIppnu || 'Siti Nur Halizah') 
                          : (settings.leaderIpnu || 'Ahmad Fauzi')}
                      </p>
                      <p className="text-[10px] text-slate-500">NIA: 3302.20.001</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}