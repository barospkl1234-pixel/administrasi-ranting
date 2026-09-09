import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  CreditCard, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle2,
  Phone,
  MapPin,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import KtaCard from '../components/KtaCard';
import { formatDate } from '../utils/formatters';

export default function Members({ activeOrg, settings = {} }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dusunFilter, setDusunFilter] = useState('');
  const [cadreFilter, setCadreFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKtaModalOpen, setIsKtaModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
    gender: activeOrg === 'IPPNU' ? 'P' : 'L',
    nik: '',
    pob: 'Banyumas',
    dob: '2005-01-01',
    phone: '',
    dusun: 'Dusun I Krajan',
    rt: '01',
    rw: '01',
    education: 'Pelajar',
    position: 'Anggota',
    cadreLevel: 'MAKESTA',
    status: 'Aktif',
    joinedYear: 2024,
    photo: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.getMembers({
        org: activeOrg,
        search,
        dusun: dusunFilter,
        cadre: cadreFilter
      });
      setMembers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeOrg, search, dusunFilter, cadreFilter]);

  const handleOpenAdd = () => {
    setFormData({
      ...initialForm,
      organization: activeOrg === 'ALL' ? 'IPNU' : activeOrg,
      gender: activeOrg === 'IPPNU' ? 'P' : 'L'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setSelectedMember(m);
    setFormData(m);
    setIsEditModalOpen(true);
  };

  const handleOpenKta = (m) => {
    setSelectedMember(m);
    setIsKtaModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createMember(formData);
      setIsAddModalOpen(false);
      loadMembers();
    } catch (err) {
      alert('Gagal menambah kader: ' + err.message);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateMember(selectedMember.id, formData);
      setIsEditModalOpen(false);
      loadMembers();
    } catch (err) {
      alert('Gagal memperbarui kader: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data kader ${name}?`)) {
      try {
        await api.deleteMember(id);
        loadMembers();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (members.length === 0) return alert('Tidak ada data untuk diekspor');

    const headers = ['ID,NIK,Nama,Organisasi,Jenis Kelamin,Dusun,RT,RW,No HP,Jabatan,Jenjang Kaderisasi,Status'];
    const rows = members.map(m => 
      `"${m.id}","'${m.nik}'","${m.name}","${m.organization}","${m.gender}","${m.dusun}","${m.rt}","${m.rw}","'${m.phone}'","${m.position}","${m.cadreLevel}","${m.status}"`
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data-kader-ipnu-ippnu-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Database Kader & Anggota
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan data kader formal, pencarian NIK/NIA, dan pencetakan KTA Digital
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Ekspor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Kader
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
            placeholder="Cari nama, NIK, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={dusunFilter}
            onChange={(e) => setDusunFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Dusun</option>
            <option value="Dusun I Krajan">Dusun I Krajan</option>
            <option value="Dusun II Karanganyar">Dusun II Karanganyar</option>
            <option value="Dusun III Gunungwetan">Dusun III Gunungwetan</option>
          </select>

          <select
            value={cadreFilter}
            onChange={(e) => setCadreFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Jenjang</option>
            <option value="Calon Anggota">Calon Anggota</option>
            <option value="MAKESTA">MAKESTA</option>
            <option value="LAKMUD">LAKMUD</option>
            <option value="LAKUT">LAKUT</option>
            <option value="DIKLATAMA">DIKLATAMA (CBP/KPP)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Member Data View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat data kader...</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Data Kader Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter wilayah Anda.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Kader</th>
                  <th className="px-5 py-3.5">Organisasi</th>
                  <th className="px-5 py-3.5">Jabatan</th>
                  <th className="px-5 py-3.5">Jenjang</th>
                  <th className="px-5 py-3.5">Wilayah</th>
                  <th className="px-5 py-3.5">Kontak</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const isIpnu = m.organization === 'IPNU';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.photo || (m.gender === 'L' ? 
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' : 
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80')}
                            alt={m.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                            <p className="text-[11px] font-mono text-slate-400">{m.id} • NIK: {m.nik || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          isIpnu 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {m.organization}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-700">{m.position}</p>
                        <p className="text-[10px] text-slate-400">{m.education || 'Pelajar'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.cadreLevel === 'MAKESTA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          m.cadreLevel === 'LAKMUD' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          m.cadreLevel === 'LAKUT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {m.cadreLevel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-700 font-medium">{m.dusun}</p>
                        <p className="text-[10px] text-slate-400">RT {m.rt} / RW {m.rw}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-slate-600">{m.phone || '-'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenKta(m)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Cetak KTA Digital"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            title="Edit Data"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
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
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) => {
            const isIpnu = m.organization === 'IPNU';
            return (
              <div 
                key={m.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                      isIpnu ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {m.organization}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {m.cadreLevel}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mt-4">
                    <img 
                      src={m.photo} 
                      alt={m.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{m.name}</h4>
                      <p className="text-xs font-semibold text-emerald-700 truncate">{m.position}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">NIA: {m.id}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{m.dusun}, RT {m.rt}/RW {m.rw}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{m.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenKta(m)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    KTA Digital
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH KADER */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Data Kader Baru"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Organisasi *</label>
              <select
                value={formData.organization}
                onChange={(e) => {
                  const org = e.target.value;
                  setFormData({
                    ...formData,
                    organization: org,
                    gender: org === 'IPNU' ? 'L' : 'P'
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
              >
                <option value="IPNU">IPNU (Ikatan Pelajar Nahdlatul Ulama)</option>
                <option value="IPPNU">IPPNU (Ikatan Pelajar Putri NU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Ahmad Fauzi"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                placeholder="330215..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={formData.pob}
                onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dusun / Wilayah</label>
              <input
                type="text"
                value={formData.dusun}
                onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                placeholder="Contoh: Dusun I Krajan"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RT</label>
                <input
                  type="text"
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  placeholder="01"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RW</label>
                <input
                  type="text"
                  value={formData.rw}
                  onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                  placeholder="01"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan di Ranting</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Contoh: Sekretaris, Waka Kaderisasi, Anggota"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Kaderisasi Formal</label>
              <select
                value={formData.cadreLevel}
                onChange={(e) => setFormData({ ...formData, cadreLevel: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="Calon Anggota">Calon Anggota</option>
                <option value="MAKESTA">MAKESTA (Masa Kesetiaan Anggota)</option>
                <option value="LAKMUD">LAKMUD (Latihan Kader Muda)</option>
                <option value="LAKUT">LAKUT (Latihan Kader Utama)</option>
                <option value="DIKLATAMA">DIKLATAMA (CBP / KPP)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Foto (Opsional)</label>
              <input
                type="url"
                value={formData.photo}
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika ingin memakai avatar default.</p>
            </div>
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
              Simpan Data Kader
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT KADER */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Data Kader: ${selectedMember?.name}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">NIK (16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan di Ranting</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang Kaderisasi Formal</label>
              <select
                value={formData.cadreLevel}
                onChange={(e) => setFormData({ ...formData, cadreLevel: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="Calon Anggota">Calon Anggota</option>
                <option value="MAKESTA">MAKESTA</option>
                <option value="LAKMUD">LAKMUD</option>
                <option value="LAKUT">LAKUT</option>
                <option value="DIKLATAMA">DIKLATAMA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dusun / Wilayah</label>
              <input
                type="text"
                value={formData.dusun}
                onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: KTA DIGITAL PREVIEW */}
      <Modal
        isOpen={isKtaModalOpen}
        onClose={() => setIsKtaModalOpen(false)}
        title={`KTA Digital: ${selectedMember?.name}`}
        maxWidth="max-w-lg"
      >
        <KtaCard member={selectedMember} settings={settings} />
      </Modal>

    </div>
  );
}

