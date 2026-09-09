import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  MapPin,
  Tag
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from '../components/Modal';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conditionFilter, setConditionFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const initialForm = {
    code: '',
    name: '',
    category: 'Perlengkapan',
    quantity: 1,
    unit: 'Unit',
    condition: 'Baik',
    location: 'Lemari Sekretariat',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory({
        condition: conditionFilter,
        search
      });
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [conditionFilter, search]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createInventory(formData);
      setIsAddModalOpen(false);
      loadInventory();
    } catch (err) {
      alert('Gagal menambah barang: ' + err.message);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateInventory(selectedItem.id, formData);
      setIsEditModalOpen(false);
      loadInventory();
    } catch (err) {
      alert('Gagal memperbarui barang: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Hapus data barang inventaris ${name}?`)) {
      try {
        await api.deleteInventory(id);
        loadInventory();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Inventaris & Perlengkapan Ranting
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan aset barang, perlengkapan hadroh, bendera pataka, dan lokasi penyimpanan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang Inventaris
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode barang, nama inventaris, atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Condition Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConditionFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              conditionFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kondisi
          </button>
          <button
            onClick={() => setConditionFilter('Baik')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              conditionFilter === 'Baik' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Baik
          </button>
          <button
            onClick={() => setConditionFilter('Rusak Ringan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              conditionFilter === 'Rusak Ringan' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Rusak Ringan
          </button>
        </div>

      </div>

      {/* Inventory Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat data inventaris...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Data Inventaris</h3>
          <p className="text-xs text-slate-500 mt-1">Tambahkan inventaris barang milik ranting untuk pengawasan aset.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isGood = item.condition === 'Baik';
            const isMinor = item.condition === 'Rusak Ringan';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isGood ? 'bg-emerald-100 text-emerald-800' :
                      isMinor ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {isGood ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {item.condition}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-sm mt-3">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.notes || 'Tidak ada catatan tambahan.'}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Jumlah</span>
                      <p className="font-extrabold text-slate-800 font-mono text-sm">{item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Kategori</span>
                      <p className="font-semibold text-slate-700 truncate">{item.category}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Data"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: TAMBAH INVENTARIS */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Barang Inventaris Baru"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang / Aset *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Bendera Pataka IPNU & Tiang"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Perlengkapan Upacara">Perlengkapan Upacara / Pataka</option>
                <option value="Kesekretariatan">Kesekretariatan & Stempel</option>
                <option value="Elektronik">Elektronik & Sound System</option>
                <option value="Seni Budaya">Seni Budaya & Hadroh/Rebana</option>
                <option value="Seragam">Jas & Seragam Pengurus</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Baik">Baik / Siap Pakai</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Unit / Set / Pcs"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penyimpanan *</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Contoh: Lemari Sekretariat / Rumah Ketua"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Spesifikasi</label>
            <textarea
              rows={2}
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
              Simpan Barang
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT INVENTARIS */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Inventaris: ${selectedItem?.name}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Baik">Baik / Siap Pakai</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Penyimpanan</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
            />
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

    </div>
  );
}

