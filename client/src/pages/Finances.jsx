import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  Trash2, 
  Printer, 
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  Paperclip,
  FileText,
  Image,
  Eye,
  X
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { formatRupiah, formatDate } from '../utils/formatters';
import { printToPdf } from '../utils/print';

export default function Finances({ activeOrg, settings = {} }) {
  const [finances, setFinances] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState(''); // 'income' or 'expense'
  const [monthFilter, setMonthFilter] = useState(''); // 'YYYY-MM'
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [receiptViewData, setReceiptViewData] = useState(null);

  // Form State
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
    type: 'income',
    category: 'Iuran Rutin Anggota',
    amount: '',
    description: '',
    receiptNo: '',
    receiptFile: null
  };
  const [formData, setFormData] = useState(initialForm);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadFinances = async () => {
    try {
      setLoading(true);
      const res = await api.getFinances({
        org: activeOrg,
        type: typeFilter,
        month: monthFilter,
        search
      });
      setFinances(res.data || []);
      setSummary(res.summary || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, [activeOrg, typeFilter, monthFilter, search]);

  const handleOpenAdd = (defaultType = 'income') => {
    setFormData({
      ...initialForm,
      type: defaultType,
      organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
      category: defaultType === 'income' ? 'Iuran Rutin Anggota' : 'Konsumsi Kegiatan',
      receiptFile: null
    });
    setReceiptPreview('');
    setIsAddModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Format file harus JPG, PNG, WEBP, atau PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10 MB');
      return;
    }
    setFormData({ ...formData, receiptFile: file });
    setReceiptPreview(file.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(file));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      let receiptUrl = '';
      if (formData.receiptFile) {
        setUploading(true);
        const uploadRes = await api.uploadPhoto(formData.receiptFile);
        receiptUrl = uploadRes.url || '';
        setUploading(false);
      }
      await api.createFinance({
        ...formData,
        amount: Number(formData.amount),
        receiptUrl
      });
      setIsAddModalOpen(false);
      setReceiptPreview('');
      loadFinances();
    } catch (err) {
      setUploading(false);
      alert('Gagal mencatat transaksi: ' + err.message);
    }
  };

  const handleViewReceipt = (transaction) => {
    if (!transaction.receiptUrl) return;
    setReceiptViewData({
      url: transaction.receiptUrl,
      type: transaction.receiptUrl.endsWith('.pdf') ? 'pdf' : 'image',
      description: transaction.description
    });
  };

  const handleDelete = async (id, desc) => {
    if (confirm(`Hapus transaksi kas: ${desc}?`)) {
      try {
        await api.deleteFinance(id);
        loadFinances();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Active org balance metrics
  let totalIncome = 0;
  let totalExpense = 0;
  let currentBalance = 0;

  if (summary) {
    if (activeOrg === 'IPNU') {
      totalIncome = summary.ipnuIncome;
      totalExpense = summary.ipnuExpense;
      currentBalance = summary.ipnuBalance;
    } else if (activeOrg === 'IPPNU') {
      totalIncome = summary.ippnuIncome;
      totalExpense = summary.ippnuExpense;
      currentBalance = summary.ippnuBalance;
    } else {
      totalIncome = summary.ipnuIncome + summary.ippnuIncome + summary.jointIncome;
      totalExpense = summary.ipnuExpense + summary.ippnuExpense + summary.jointExpense;
      currentBalance = summary.totalBalance;
    }
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Buku Kas & Keuangan Organisasi
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan transparan iuran selapanan, kas IPNU, kas IPPNU, dan dana kegiatan bersama
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 col-span-2 sm:col-auto text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Cetak Laporan Kas
          </button>
          <button
            onClick={() => handleOpenAdd('income')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Catat Pemasukan
          </button>
          <button
            onClick={() => handleOpenAdd('expense')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all shadow-rose-900/20"
          >
            <Plus className="w-4 h-4" />
            Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pemasukan</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1 break-all leading-tight">{formatRupiah(totalIncome)}</h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
            Iuran kader, donatur & dana usaha
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran</p>
          <h3 className="text-2xl font-black text-rose-600 mt-1 break-all leading-tight">{formatRupiah(totalExpense)}</h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            Konsumsi, ATK, & operasional
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Akhir Saat Ini</p>
          <h3 className="text-2xl font-black text-teal-700 mt-1 break-all leading-tight">{formatRupiah(currentBalance)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeOrg === 'ALL' ? 'Total Kas IPNU + IPPNU + Bersama' : `Saldo Kas Ranting ${activeOrg}`}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari keterangan transaksi, nomor kas, atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Type Pills & Month */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 rounded-xl border border-slate-200 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              typeFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Transaksi
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            Pemasukan
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Pengeluaran
          </button>
        </div>

      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat catatan buku kas...</div>
      ) : finances.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Catatan Transaksi</h3>
          <p className="text-xs text-slate-500 mt-1">Catat pemasukan atau pengeluaran kas pertama Anda sekarang.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tanggal & Bukti</th>
                  <th className="px-5 py-3.5">Buku Kas</th>
                  <th className="px-5 py-3.5">Kategori Transaksi</th>
                  <th className="px-5 py-3.5">Keterangan</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finances.map((f) => {
                  const isIncome = f.type === 'income';
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{formatDate(f.date)}</p>
                        <p className="text-[10px] font-mono text-slate-400">{f.receiptNo || f.id}</p>
                        {f.receiptUrl && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold">
                            <Paperclip className="w-2.5 h-2.5" />
                            {f.receiptUrl.endsWith('.pdf') ? 'PDF' : 'Gambar'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          f.organization === 'IPNU' ? 'bg-emerald-100 text-emerald-800' :
                          f.organization === 'IPPNU' ? 'bg-amber-100 text-amber-800' :
                          'bg-teal-100 text-teal-800'
                        }`}>
                          {f.organization}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-700">{f.category}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 font-medium">{f.description}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className={`font-mono font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+' : '-'}{formatRupiah(f.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {f.receiptUrl && (
                            <button
                              onClick={() => handleViewReceipt(f)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                              title="Lihat Bukti"
                            >
                              {f.receiptUrl.endsWith('.pdf') ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(f.id, f.description)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH TRANSAKSI KAS */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={formData.type === 'income' ? 'Catat Pemasukan Kas' : 'Catat Pengeluaran Kas'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Buku Kas Organisasi *</label>
              <select
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="IPNU">Kas PR IPNU</option>
                <option value="IPPNU">Kas PR IPPNU</option>
                <option value="BERSAMA">Kas Bersama (IPNU-IPPNU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Transaksi *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              {formData.type === 'income' ? (
                <>
                  <option value="Iuran Rutin Anggota">Iuran Rutin Anggota / Selapanan</option>
                  <option value="Koin Pelajar NU">Koin Pelajar NU (Iuran Sukarela)</option>
                  <option value="Bantuan Ranting NU / Kelurahan">Bantuan Pemerintah Kelurahan / Ranting NU</option>
                  <option value="Sumbangan Donatur / Alumni">Sumbangan Donatur / Alumni</option>
                  <option value="Usaha Mandiri / Merchandise">Usaha Mandiri (Stiker, Kaos, Kalender)</option>
                  <option value="Lainnya">Pemasukan Lainnya</option>
                </>
              ) : (
                <>
                  <option value="Konsumsi Kegiatan">Konsumsi Kegiatan / Rapat / Rutinan</option>
                  <option value="ATK & Cetak Surat">ATK, Kertas, Fotokopi & Kesekretariatan</option>
                  <option value="Bisyaroh Narasumber">Bisyaroh Penceramah / Kyai / Ustadz</option>
                  <option value="Sewa Tempat & Sound">Sewa Sound System / Tempat</option>
                  <option value="Transportasi & Logistik">Transportasi Delegasi & Logistik</option>
                  <option value="Lainnya">Pengeluaran Lainnya</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Contoh: 150000"
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Transaksi *</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Iuran rutinan malam Ahad Manis putaran ke-3"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {formData.type === 'expense' && (
            <div className={formData.receiptFile ? 'border border-rose-200 bg-rose-50/40 rounded-xl p-3' : ''}>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Paperclip className="w-3.5 h-3.5 text-rose-500" />
                Upload Bukti Nota / Kwitansi {formData.type === 'expense' && <span className="text-[10px] font-normal text-slate-400">(Opsional)</span>}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">
                    {formData.receiptFile ? formData.receiptFile.name : 'Klik untuk pilih gambar atau PDF...'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {receiptPreview && (
                  <div className="relative shrink-0">
                    {receiptPreview === 'pdf' ? (
                      <div className="w-16 h-16 bg-rose-100 rounded-lg flex flex-col items-center justify-center border border-rose-200">
                        <FileText className="w-6 h-6 text-rose-500" />
                        <span className="text-[8px] font-bold text-rose-600 mt-0.5">PDF</span>
                      </div>
                    ) : (
                      <img src={receiptPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, receiptFile: null }); setReceiptPreview(''); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Format: JPG, PNG, WEBP, atau PDF. Maks 10 MB.</p>
            </div>
          )}

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
              disabled={uploading}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm ${
                formData.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Mengunggah Bukti...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CETAK LAPORAN KAS LPJ */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Laporan Pertanggungjawaban (LPJ) Keuangan Kas"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="no-print flex justify-end">
            <button
              onClick={() => printToPdf('.print-container')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan (A4)
            </button>
          </div>

          <div className="print-container bg-white p-8 border border-slate-300 rounded-xl text-xs space-y-6">
            <div className="text-center border-b-2 border-slate-800 pb-3">
              <h3 className="font-extrabold text-base uppercase text-slate-900">
                LAPORAN KEUANGAN KAS ORGANISASI
              </h3>
<h4 className="font-bold text-xs uppercase text-emerald-800 mt-0.5">
                    PIMPINAN RANTING IPNU - IPPNU KELURAHAN {settings.villageName ? settings.villageName.toUpperCase() : 'KALIBAROS'}
                  </h4>
              <p className="text-[10px] text-slate-500">Masa Khidmat {settings.period || '2025 - 2027'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-800 font-bold uppercase">Total Pemasukan</p>
                <p className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 break-all">{formatRupiah(totalIncome)}</p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <p className="text-[10px] text-rose-800 font-bold uppercase">Total Pengeluaran</p>
                <p className="text-sm font-extrabold text-rose-700 font-mono mt-0.5 break-all">{formatRupiah(totalExpense)}</p>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                <p className="text-[10px] text-teal-800 font-bold uppercase">Saldo Kas Akhir</p>
                <p className="text-sm font-extrabold text-teal-700 font-mono mt-0.5 break-all">{formatRupiah(currentBalance)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border border-slate-200 min-w-[560px]">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border">No</th>
                  <th className="p-2 border">Tanggal</th>
                  <th className="p-2 border">Organisasi</th>
                  <th className="p-2 border">Keterangan</th>
                  <th className="p-2 border text-right">Pemasukan</th>
                  <th className="p-2 border text-right">Pengeluaran</th>
                </tr>
              </thead>
              <tbody>
                {finances.map((f, idx) => (
                  <tr key={f.id} className="border-t">
                    <td className="p-2 border text-center">{idx + 1}</td>
                    <td className="p-2 border whitespace-nowrap">{formatDate(f.date)}</td>
                    <td className="p-2 border font-bold">{f.organization}</td>
                    <td className="p-2 border">{f.description}</td>
                    <td className="p-2 border text-right font-mono text-emerald-700">
                      {f.type === 'income' ? formatRupiah(f.amount) : '-'}
                    </td>
                    <td className="p-2 border text-right font-mono text-rose-700">
                      {f.type === 'expense' ? formatRupiah(f.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 text-center pt-8 text-[11px]">
              <div>
                <p>Mengetahui,</p>
                <p className="font-semibold mt-1">Ketua Mandataris</p>
                <div className="h-16" />
                <p className="font-bold underline">{settings.leaderIpnu || 'Ahmad Fauzi'}</p>
              </div>
              <div>
                <p>{settings.villageName || 'Kalibaros'}, {formatDate(new Date().toISOString())}</p>
                <p className="font-semibold mt-1">Bendahara Mandataris</p>
                <div className="h-16" />
                <p className="font-bold underline">{settings.treasurerIpnu || 'Bagus Setiawan'}</p>
              </div>
            </div>

          </div>
        </div>
      </Modal>

      {/* MODAL: LIHAT BUKTI NOTA/KWITANSI */}
      <Modal
        isOpen={!!receiptViewData}
        onClose={() => setReceiptViewData(null)}
        title="Bukti Nota / Kwitansi"
        maxWidth="max-w-2xl"
      >
        {receiptViewData && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-medium">{receiptViewData.description}</p>
            {receiptViewData.type === 'pdf' ? (
              <iframe
                src={receiptViewData.url}
                className="w-full h-[500px] rounded-lg border border-slate-200"
                title="Bukti PDF"
              />
            ) : (
              <img
                src={receiptViewData.url}
                alt="Bukti Nota/Kwitansi"
                className="w-full max-h-[500px] object-contain rounded-lg border border-slate-200"
              />
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
