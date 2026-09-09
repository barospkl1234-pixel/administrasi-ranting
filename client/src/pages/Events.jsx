import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  Trash2,
  Users,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { formatDate, formatDateWithDay } from '../utils/formatters';

export default function Events({ activeOrg, settings = {} }) {
  const [events, setEvents] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Form State
  const initialForm = {
    title: 'Rutinan Selapanan & Pembacaan Diba\'iyah',
    organization: activeOrg === 'ALL' ? 'BERSAMA' : activeOrg,
    date: new Date().toISOString().split('T')[0],
    time: '19:30 WIB - Selesai',
    location: 'Gedung TPQ Baiturrohim Krajan',
    pic: 'Rekan Ahmad Fauzi & Rekanita Siti',
    description: 'Pembacaan maulid Simtudduror, dilanjutkan kajian fiqih dan koordinasi program kerja pengurus.',
    status: 'Akan Datang'
  };
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, membersRes] = await Promise.all([
        api.getEvents({ org: activeOrg, search }),
        api.getMembers({ org: 'ALL' })
      ]);
      setEvents(eventsRes.data || []);
      setAllMembers(membersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeOrg, search]);

  const handleOpenAttendance = (evt) => {
    setSelectedEvent(evt);
    setMemberSearch('');
    setIsAttendanceModalOpen(true);
  };

  const handleOpenQr = (evt) => {
    setSelectedEvent(evt);
    setIsQrModalOpen(true);
  };

  const handleToggleAttendance = async (memberId) => {
    if (!selectedEvent) return;
    try {
      const res = await api.toggleAttendance(selectedEvent.id, memberId);
      
      // Update local state
      const updatedEvents = events.map(e => {
        if (e.id === selectedEvent.id) {
          const attendees = e.attendees || [];
          const newAttendees = res.isAttending 
            ? [...attendees, memberId]
            : attendees.filter(id => id !== memberId);
          return { ...e, attendees: newAttendees };
        }
        return e;
      });

      setEvents(updatedEvents);
      const currentSelected = updatedEvents.find(e => e.id === selectedEvent.id);
      setSelectedEvent(currentSelected);
    } catch (err) {
      alert('Gagal memperbarui presensi: ' + err.message);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      await api.createEvent(formData);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      alert('Gagal membuat agenda: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (confirm(`Hapus kegiatan: ${title}?`)) {
      try {
        await api.deleteEvent(id);
        loadData();
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
            Agenda Kegiatan & Presensi Digital
          </h2>
          <p className="text-xs text-slate-500">
            Manajemen jadwal selapanan, konferensi, pelatihan, serta rekap kehadiran kader
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialForm);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all shadow-emerald-900/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Agenda Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama agenda atau lokasi kegiatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Memuat agenda kegiatan...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Agenda Terjadwal</h3>
          <p className="text-xs text-slate-500 mt-1">Gunakan tombol "Tambah Agenda Baru" untuk menjadwalkan rutinan atau event ranting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {events.map((evt) => {
            const attendeeCount = (evt.attendees || []).length;
            const isCompleted = evt.status === 'Selesai';
            return (
              <div 
                key={evt.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                      evt.organization === 'IPNU' ? 'bg-emerald-100 text-emerald-800' :
                      evt.organization === 'IPPNU' ? 'bg-amber-100 text-amber-800' :
                      'bg-teal-100 text-teal-800'
                    }`}>
                      {evt.organization}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {evt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{evt.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{evt.description}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{formatDateWithDay(evt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{evt.location}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {attendeeCount} Hadir
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenQr(evt)}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
                      title="Tampilkan QR Code Presensi"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenAttendance(evt)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Daftar Hadir
                    </button>
                    <button
                      onClick={() => handleDelete(evt.id, evt.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Hapus Agenda"
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

      {/* MODAL: DAFTAR HADIR & CHECKLIST PRESENSI */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title={`Presensi Kader: ${selectedEvent?.title}`}
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="space-y-4">
            
            {/* Event Summary Banner */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900">{formatDateWithDay(selectedEvent.date)}</p>
                <p className="text-[11px] text-emerald-700">{selectedEvent.location}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-800 font-mono">
                  {(selectedEvent.attendees || []).length} / {allMembers.length}
                </span>
                <p className="text-[10px] text-emerald-700 font-semibold uppercase">Kader Hadir</p>
              </div>
            </div>

            {/* Quick Filter Search inside Modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama kader untuk presensi cepat..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Member Checklist List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {allMembers
                .filter(m => !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.position.toLowerCase().includes(memberSearch.toLowerCase()))
                .map((member) => {
                  const isAttending = (selectedEvent.attendees || []).includes(member.id);
                  const isIpnu = member.organization === 'IPNU';

                  return (
                    <div 
                      key={member.id}
                      onClick={() => handleToggleAttendance(member.id)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isAttending ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={member.photo} 
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{member.name}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span className={isIpnu ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                              {member.organization}
                            </span>
                            <span>•</span>
                            <span>{member.position}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                          isAttending 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                        }`}>
                          <Check className="w-3 h-3" />
                          {isAttending ? 'Hadir' : 'Absen'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
              >
                Selesai
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* MODAL: QR CODE PRESENSI MANDIRI */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="QR Code Presensi Acara"
        maxWidth="max-w-md"
      >
        {selectedEvent && (
          <div className="flex flex-col items-center text-center p-4">
            <h4 className="font-extrabold text-slate-800 text-base mb-1">{selectedEvent.title}</h4>
            <p className="text-xs text-slate-500 mb-6">{formatDateWithDay(selectedEvent.date)} • {selectedEvent.location}</p>

            <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-600 mb-4">
              <QRCodeSVG 
                value={JSON.stringify({ eventId: selectedEvent.id, title: selectedEvent.title, date: selectedEvent.date })}
                size={220}
                level="H"
              />
            </div>

            <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full mb-3">
              Scan dengan Kamera HP untuk Presensi Digital
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Tampilkan layar ini di proyektor atau cetak lembar QR di meja penerima tamu saat acara berlangsung.
            </p>
          </div>
        )}
      </Modal>

      {/* MODAL: TAMBAH AGENDA BARU */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Agenda Kegiatan Baru"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan / Agenda *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Penyelenggara *</label>
              <select
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="BERSAMA">Bersama (IPNU & IPPNU)</option>
                <option value="IPNU">PR IPNU</option>
                <option value="IPPNU">PR IPPNU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Waktu Pelaksanaan</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="19:30 WIB s.d Selesai"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kegiatan</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Gedung TPQ Krajan"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PIC)</label>
            <input
              type="text"
              value={formData.pic}
              onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kegiatan</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              Jadwalkan Kegiatan
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

