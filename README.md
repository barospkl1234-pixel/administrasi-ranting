# 🟢 Sistem Informasi & Administrasi Terpadu (SIAD) PR IPNU IPPNU Kalibaros

Aplikasi web modern yang dirancang khusus untuk tata kelola administrasi organisasi dwitunggal **Pimpinan Ranting (PR) Ikatan Pelajar Nahdlatul Ulama (IPNU)** dan **Ikatan Pelajar Putri Nahdlatul Ulama (IPPNU)** di tingkat desa/kelurahan.

Sistem ini dibangun dengan kesesuaian terhadap **Pedoman Administrasi (PA) resmi IPNU & IPPNU**, mengakomodasi kebutuhan persuratan resmi, pendataan kader (database E-Kader), penerbitan Kartu Tanda Anggota (KTA) Digital ber-QR Code, pembukuan kas organisasi (E-Kas), presensi kegiatan rutinan, serta inventaris aset ranting.

---

## 🌟 Fitur Utama Sistem

### 1. 👥 Database Kader & KTA Digital (E-Kader)
- **Pencatatan Biodata Lengkap**: NIK, Tempat/Tanggal Lahir, Jenis Kelamin, No. WhatsApp, Dusun, RT/RW, dan Pendidikan.
- **Tingkat Kaderisasi Formal**: Pencatatan jenjang kader (Calon Anggota, MAKESTA, LAKMUD, LAKUT, serta DIKLATAMA untuk Korp CBP/KPP).
- **Kartu Tanda Anggota (KTA Digital)**:
  - Desain dua sisi (Depan: Pasfoto, data kader, logo resmi, dan QR Code verifikasi; Belakang: Tri Komitmen Pelajar NU, janji setia, dan tanda tangan pimpinan ranting).
  - Tampilan khusus: Nuansa hijau khas IPNU & hijau-kuning emas khas IPPNU.
  - Siap cetak langsung (*Print Ready*) sesuai standar rasio ID Card.
- **Pencarian & Filter Cepat**: Filter instan per Dusun, Jenjang Kader, Jabatan, dan Ekspor seluruh data ke file Excel/CSV.

### 2. ✉️ Administrasi Persuratan Resmi (E-Surat)
- **Generator Nomor Surat Otomatis**:
  - Penomoran sesuai format baku Pedoman Administrasi (PA) IPNU & IPPNU.
  - Kode jenis surat internal (**A**) dan eksternal (**B**).
  - Kode departemen/kepanitiaan: `Sek` (Kesekretariatan), `Pan` (Kepanitiaan), `Kdr` (Kaderisasi), `Org` (Organisasi).
  - Penomoran surat khusus IPNU (`7354`), IPPNU (`7455`), dan Surat Bersama (`7354-7455`).
  - Penulisan bulan Romawi dan tahun otomatis.
- **Template Surat Resmi Bawaan**:
  - Surat Undangan Pertemuan Rutin Selapanan / Diba'iyah
  - Surat Permohonan Izin Tempat & Peminjaman Fasilitas
  - Surat Mandat / Tugas Delegasi Konferensi PAC
  - Surat Keterangan Aktif Berorganisasi
- **Layout Cetak Kop Surat Resmi A4**:
  - Kop resmi berlogo ganda (IPNU di kiri, IPPNU di kanan untuk surat bersama).
  - Kaligrafi Basmalah, penanggalan Hijriyah & Masehi, kalimat penutup resmi (*Wallahul Muwaffiq Ila Aqwamith Thorieq* / *Wallahu Waliyyut Taufiq Wal Hidayah*), serta kolom tanda tangan dan stempel digital.

### 3. 💰 Pengelolaan Buku Kas & Keuangan (E-Kas)
- **Pembukuan Terpisah & Gabungan**:
  - Buku Kas Khusus PR IPNU
  - Buku Kas Khusus PR IPPNU
  - Buku Kas Bersama / Kepanitiaan (Makesta, Harlah, PHBI, dll.)
- **Kategori Transaksi Lengkap**: Iuran Rutin Anggota, Koin Pelajar NU, Stimulan Dana Desa, Bantuan Ranting NU, Sumbangan Donatur/Alumni, Konsumsi, ATK, Bisyaroh Narasumber, dan Operasional.
- **Rekap & Laporan Otomatis**: Menghitung arus kas masuk, kas keluar, saldo real-time, serta format cetak Laporan Pertanggungjawaban (LPJ) Keuangan siap cetak A4.

### 4. 📅 Agenda Kegiatan & Presensi Digital (E-Absensi)
- **Jadwal Kegiatan Ranting**: Rutinan Selapanan, Diba'iyah malam Ahad, Makesta, Porseni Pelajar, dan Rapat Kerja.
- **Presensi Hadir Digital**:
  - Mode Centang Cepat (Checklist kehadiran dari database anggota dengan pencarian nama).
  - QR Code Presensi: Tampilkan QR Code di proyektor/meja registrasi untuk dipindai oleh peserta acara.
  - Rekap persentase kehadiran kader untuk evaluasi keaktifan ranting.

### 5. 📦 Inventaris Aset & Perlengkapan Ranting
- **Pendataan Aset Organisasi**: Bendera Pataka resmi, tiang pataka, stempel ranting, sound system portable, 1 set rebana/hadrah, jas pengurus, rompi CBP/KPP, dan banner backdrop.
- **Status Kondisi & Lokasi**: Pemantauan kondisi (Baik, Rusak Ringan, Rusak Berat) dan catatan lokasi penyimpanan barang.

### 6. ⚙️ Pengaturan Profil & Struktur Ranting
- Profil dinamis: Nama Desa, Kecamatan, Kabupaten, Alamat Sekretariat, Masa Khidmat (contoh 2025-2027).
- Struktur Pimpinan Harian: Nama Ketua, Sekretaris, Bendahara (IPNU & IPPNU), serta Komandan CBP & KPP.
- **Cadangan & Pemulihan (Backup & Restore)**: Unduh seluruh database dalam format file `.json` dengan 1 klik, serta fitur pemulihan (*restore*) data kapan saja.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi telah terinstal dan siap dijalankan dengan Node.js.

### 1. Masuk ke Folder Proyek
```powershell
cd C:\Users\Irfanudin\.gemini\antigravity\scratch\administrasi-ipnu-ippnu
```

### 2. Jalankan Server Aplikasi
```powershell
node server/index.js
```
Akses aplikasi melalui browser di alamat:
👉 **`http://localhost:5000`**

### 3. Mode Pengembangan Frontend (Opsional - Hot Reload)
Jika ingin melakukan pengeditan tampilan secara live dengan Vite:
```powershell
npm run dev
```
Akses di `http://localhost:5173`.

---

## 📁 Struktur File & Direktori

```text
administrasi-ipnu-ippnu/
├── package.json              # Script npm root
├── dev.js                    # Runner concurrent development
├── server/
│   ├── index.js              # Entry point Express API & static serving
│   ├── db.js                 # Engine database file-based & default seed
│   ├── data/
│   │   └── store.json        # File database penyimpanan (auto-backup)
│   └── routes/
│       ├── members.js        # API Kader & KTA
│       ├── letters.js        # API Persuratan & Generator PA
│       ├── finances.js       # API Buku Kas & Keuangan
│       ├── events.js         # API Agenda & Presensi
│       ├── inventory.js      # API Inventaris Aset
│       └── settings.js       # API Profil & Backup/Restore
└── client/
    ├── index.html            # Google Fonts & meta tags
    ├── vite.config.js        # Vite + React config
    ├── tailwind.config.js    # Warna resmi IPNU (Green) & IPPNU (Green-Gold)
    └── src/
        ├── App.jsx           # Navigasi utama & state dwitunggal
        ├── components/
        │   ├── Sidebar.jsx   # Menu navigasi sidebar
        │   ├── Navbar.jsx    # Switcher organisasi (Semua, IPNU, IPPNU) & Tanggal Hijriyah
        │   ├── Modal.jsx     # Dialog popup aksesibel
        │   ├── StatCard.jsx  # Widget metrik dashboard
        │   └── KtaCard.jsx   # Render KTA Digital 2 sisi + QR Code
        ├── pages/
        │   ├── Dashboard.jsx # Ringkasan statistik, arus kas, dan agenda
        │   ├── Members.jsx   # Manajemen anggota & cetak KTA
        │   ├── Letters.jsx   # Persuratan resmi, generator PA & cetak A4
        │   ├── Finances.jsx  # Buku kas terpisah & cetak LPJ
        │   ├── Events.jsx    # Jadwal kegiatan & presensi QR
        │   ├── Inventory.jsx # Inventaris aset ranting
        │   └── Settings.jsx  # Profil desa, pengurus & backup/restore
        └── utils/
            ├── api.js        # Fetch client ke backend
            └── formatters.js # Format Rupiah, Tanggal Masehi & Hijriyah
```

---

## 💡 Tips & Rekomendasi
1. **Pemisahan Mode Tampilan**: Gunakan tombol pill **PR IPNU** atau **PR IPPNU** di bagian atas navbar untuk memfilter data kader, buku kas, persuratan, dan kegiatan sesuai kebutuhan organisasi terkait, atau pilih **Semua** untuk melihat gabungan kegiatan dwitunggal.
2. **Pencetakan Dokumen**: Saat mencetak KTA Digital atau Surat Resmi A4, gunakan browser modern (Chrome, Edge) dengan opsi centang **"Background graphics"** pada jendela cetak agar warna latar dan garis kop surat tercetak jelas.

