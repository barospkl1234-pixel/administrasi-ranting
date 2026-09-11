import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// ----- PostgreSQL storage (digunakan bila DATABASE_URL di-set) -----
const usePostgres = !!process.env.DATABASE_URL;
const STORE_KEYS = ['settings', 'members', 'letters', 'finances', 'events', 'inventory'];

let _pool = null;
function getPool() {
  if (!usePostgres) return null;
  if (!_pool) {
    const config = { connectionString: process.env.DATABASE_URL };
    if (String(process.env.DATABASE_SSL).toLowerCase() === 'false') {
      config.ssl = false;
    } else {
      config.ssl = { rejectUnauthorized: false };
    }
    _pool = new pg.Pool(config);
  }
  return _pool;
}

async function ensurePgSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS siad_store (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS siad_uploads (
      name TEXT PRIMARY KEY,
      data BYTEA NOT NULL,
      mime TEXT NOT NULL DEFAULT 'image/jpeg',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// Writable target for the database file. On read-only filesystems
// (e.g. Vercel serverless functions) fall back to a writable temp dir.
function getWritableFile() {
  try {
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    return DATA_FILE;
  } catch {
    const tmp = process.env.TMPDIR || os.tmpdir();
    return path.join(tmp, 'siad-store.json');
  }
}

// Initial seed data with rich, realistic default content
const DEFAULT_STORE = {
  settings: {
    villageName: "Kalibaros",
    subDistrict: "Pekalongan Timur",
    district: "Kota Pekalongan",
    province: "Jawa Tengah",
    postCode: "51128",
    secretariatAddress: "Sekretariat Bersama PR IPNU IPPNU, Kel. Kalibaros, Kec. Pekalongan Timur, Kota Pekalongan",
    period: "2025 - 2027",
    codeIpnu: "7354",
    codeIppnu: "7455",
    leaderIpnu: "Rekan Ahmad Fauzi",
    leaderIppnu: "Rekanita Siti Nur Halizah",
    viceLeaderIpnu: "",
    viceLeaderIppnu: "",
    secretaryIpnu: "Rekan Muhammad Rifqi",
    secretaryIppnu: "Rekanita Dewi Lestari",
    treasurerIpnu: "Rekan Bagus Setiawan",
    treasurerIppnu: "Rekanita Anisa Rahmawati",
    cbpCommander: "Komandan Ilham Prasetyo",
    kppCommander: "Komandan Putri Ayu",
    phoneContact: "0812-3456-7890",
    emailContact: "ipnuippnubaros@gmail.com"
  },
  members: [
    {
      id: "KDR-001",
      nik: "3302151203020001",
      name: "Ahmad Fauzi",
      organization: "IPNU",
      gender: "L",
      pob: "Pekalongan",
      dob: "2004-03-12",
      phone: "081223344551",
      dusun: "Dusun I Krajan",
      rt: "02",
      rw: "01",
      education: "Mahasiswa S1 PAI",
      position: "Ketua Mandataris PR IPNU",
      cadreLevel: "LAKMUD",
      status: "Aktif",
      joinedYear: 2020,
      photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-002",
      nik: "3302154508030002",
      name: "Siti Nur Halizah",
      organization: "IPPNU",
      gender: "P",
      pob: "Pekalongan",
      dob: "2004-08-15",
      phone: "081223344552",
      dusun: "Dusun II Karanganyar",
      rt: "03",
      rw: "02",
      education: "Mahasiswa S1 Tadris Biologi",
      position: "Ketua Mandataris PR IPPNU",
      cadreLevel: "LAKMUD",
      status: "Aktif",
      joinedYear: 2020,
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-003",
      nik: "3302150911050003",
      name: "Muhammad Rifqi",
      organization: "IPNU",
      gender: "L",
      pob: "Pekalongan",
      dob: "2005-11-09",
      phone: "081223344553",
      dusun: "Dusun I Krajan",
      rt: "01",
      rw: "01",
      education: "SMK Ma'arif NU",
      position: "Sekretaris IPNU",
      cadreLevel: "MAKESTA",
      status: "Aktif",
      joinedYear: 2022,
      photo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-004",
      nik: "3302155404050004",
      name: "Dewi Lestari",
      organization: "IPPNU",
      gender: "P",
      pob: "Pekalongan",
      dob: "2005-04-14",
      phone: "081223344554",
      dusun: "Dusun III Gunungwetan",
      rt: "04",
      rw: "03",
      education: "SMA Negeri 1",
      position: "Sekretaris IPPNU",
      cadreLevel: "MAKESTA",
      status: "Aktif",
      joinedYear: 2022,
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-005",
      nik: "3302151707040005",
      name: "Bagus Setiawan",
      organization: "IPNU",
      gender: "L",
      pob: "Pekalongan",
      dob: "2004-07-17",
      phone: "081223344555",
      dusun: "Dusun II Karanganyar",
      rt: "02",
      rw: "02",
      education: "Mahasiswa Ekonomi Syariah",
      position: "Bendahara IPNU",
      cadreLevel: "LAKMUD",
      status: "Aktif",
      joinedYear: 2021,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-006",
      nik: "3302156109050006",
      name: "Anisa Rahmawati",
      organization: "IPPNU",
      gender: "P",
      pob: "Pekalongan",
      dob: "2005-09-21",
      phone: "081223344556",
      dusun: "Dusun I Krajan",
      rt: "03",
      rw: "01",
      education: "MA Ma'arif NU",
      position: "Bendahara IPPNU",
      cadreLevel: "MAKESTA",
      status: "Aktif",
      joinedYear: 2022,
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-007",
      nik: "3302152401030007",
      name: "Ilham Prasetyo",
      organization: "IPNU",
      gender: "L",
      pob: "Pekalongan",
      dob: "2003-01-24",
      phone: "081223344557",
      dusun: "Dusun III Gunungwetan",
      rt: "01",
      rw: "03",
      education: "Karyawan Swasta",
      position: "Komandan Korp CBP",
      cadreLevel: "DIKLATAMA",
      status: "Aktif",
      joinedYear: 2019,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "KDR-008",
      nik: "3302157002040008",
      name: "Putri Ayu",
      organization: "IPPNU",
      gender: "P",
      pob: "Pekalongan",
      dob: "2004-02-28",
      phone: "081223344558",
      dusun: "Dusun II Karanganyar",
      rt: "04",
      rw: "02",
      education: "Mahasiswa Kebidanan",
      position: "Komandan Korp KPP",
      cadreLevel: "DIKLATAMA",
      status: "Aktif",
      joinedYear: 2020,
      photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
    }
  ],
  letters: [
    {
      id: "LTR-001",
      letterNumber: "012/PR/A/Sek/7354/VIII/26",
      organization: "IPNU",
      type: "Keluar",
      category: "A", // Internal
      subject: "Permohonan Peminjaman Tempat & Sound System Gedung TPQ",
      recipientOrSender: "Pengurus Ta'mir Masjid & TPQ Baiturrohim",
      date: "2026-08-10",
      content: "Sehubungan dengan akan dilaksanakannya peringatan Harlah IPNU IPPNU Ranting Kalibaros, kami bermaksud meminjam tempat aula gedung TPQ.",
      status: "Terkirim",
      signatory: "Ketua & Sekretaris IPNU"
    },
    {
      id: "LTR-002",
      letterNumber: "009/PR/A/Sek/7455/VIII/26",
      organization: "IPPNU",
      type: "Keluar",
      category: "A", // Internal
      subject: "Undangan Pertemuan Rutin Selapanan Rekanita Diba'iyah",
      recipientOrSender: "Seluruh Kader Rekanita IPPNU Kalibaros",
      date: "2026-08-15",
      content: "Mengharap kehadiran rekanita dalam rutinan selapanan Ahad Kliwon bertempat di Kediaman Rekanita Siti Nur Halizah.",
      status: "Terkirim",
      signatory: "Ketua & Sekretaris IPPNU"
    },
    {
      id: "LTR-003",
      letterNumber: "015/PR-PR/B/Pan/7354-7455/VIII/26",
      organization: "BERSAMA",
      type: "Keluar",
      category: "B", // Eksternal
      subject: "Permohonan Bantuan Dana & Partisipasi Kegiatan Makesta 2026",
      recipientOrSender: "Lurah Kalibaros",
      date: "2026-08-20",
      content: "Dalam rangka kaderisasi formal Masa Kesetiaan Anggota (MAKESTA) Pimpinan Ranting IPNU IPPNU Kelurahan Kalibaros, kami mengajukan permohonan sponsor & dukungan.",
      status: "Terkirim",
      signatory: "Ketua Panitia & Pembina"
    },
    {
      id: "LTR-004",
      letterNumber: "04/PAC/A/Sek/7354/VIII/26",
      organization: "IPNU",
      type: "Masuk",
      category: "A",
      subject: "Instruksi Pelaksanaan Turba (Turun ke Bawah) PAC Pekalongan Timur",
      recipientOrSender: "PAC IPNU Pekalongan Timur",
      date: "2026-08-25",
      content: "Pemberitahuan jadwal kunjungan silaturahmi kerja dan supervisi administrasi ranting semester II.",
      status: "Diarsipkan",
      signatory: "Ketua PAC IPNU"
    }
  ],
  finances: [
    {
      id: "TRX-001",
      date: "2026-08-01",
      organization: "IPNU",
      type: "income",
      category: "Iuran Rutin Anggota",
      amount: 150000,
      description: "Iuran selapanan kader IPNU putaran 1 Dusun Krajan",
      receiptNo: "KAS-IN-001"
    },
    {
      id: "TRX-002",
      date: "2026-08-01",
      organization: "IPPNU",
      type: "income",
      category: "Iuran Rutin Anggota",
      amount: 175000,
      description: "Iuran koin pelajar NU & kas rutin Rekanita Dusun Karanganyar",
      receiptNo: "KAS-IN-002"
    },
    {
      id: "TRX-003",
      date: "2026-08-05",
      organization: "BERSAMA",
      type: "income",
      category: "Bantuan Ranting NU / Desa",
      amount: 1000000,
      description: "Stimulan dana kepemudaan dari Pemerintah Kelurahan Kalibaros",
      receiptNo: "KAS-IN-003"
    },
    {
      id: "TRX-004",
      date: "2026-08-12",
      organization: "BERSAMA",
      type: "expense",
      category: "Konsumsi Kegiatan",
      amount: 250000,
      description: "Snack & konsumsi rapat koordinasi persiapan Makesta",
      receiptNo: "KAS-OUT-001"
    },
    {
      id: "TRX-005",
      date: "2026-08-18",
      organization: "IPNU",
      type: "expense",
      category: "ATK & Cetak Surat",
      amount: 75000,
      description: "Pembelian kertas HVS F4 & fotokopi berkas persuratan ranting",
      receiptNo: "KAS-OUT-002"
    },
    {
      id: "TRX-006",
      date: "2026-08-22",
      organization: "BERSAMA",
      type: "expense",
      category: "Sewa / Operasional",
      amount: 150000,
      description: "Bisyaroh narasumber diskusi keaswajaan selapanan",
      receiptNo: "KAS-OUT-003"
    }
  ],
  events: [
    {
      id: "EVT-001",
      title: "Rutinan Selapanan & Kajian Fiqih Kepemudaan",
      organization: "BERSAMA",
      date: "2026-09-12",
      time: "19:30 - 22:00 WIB",
      location: "Gedung TPQ Baiturrohim Krajan",
      pic: "Rekan Ahmad Fauzi & Rekanita Siti",
      description: "Pembacaan Diba'iyah / Maulid Simtudduror, dilanjutkan kajian kitab Risalah Ahlussunnah Wal Jama'ah dan evaluasi program ranting.",
      status: "Akan Datang",
      attendees: ["KDR-001", "KDR-002", "KDR-003", "KDR-005", "KDR-006"]
    },
    {
      id: "EVT-002",
      title: "Masa Kesetiaan Anggota (MAKESTA) Ranting Kalibaros",
      organization: "BERSAMA",
      date: "2026-10-03",
      time: "08:00 - Selesai (2 Hari)",
      location: "Sekretariat PR IPNU IPPNU Kalibaros",
      pic: "Rekan Muhammad Rifqi",
      description: "Kaderisasi tingkat dasar untuk pelajar SMP/MTs, SMA/MA dan pemuda se-Kelurahan Kalibaros. Target 60 kader baru.",
      status: "Tahap Persiapan",
      attendees: []
    },
    {
      id: "EVT-003",
      title: "Bakti Sosial & Donor Darah Korp CBP - KPP Ranting",
      organization: "BERSAMA",
      date: "2026-08-17",
      time: "08:00 - 12:00 WIB",
      location: "Balai Kelurahan Kalibaros",
      pic: "Komandan Ilham Prasetyo",
      description: "Peringatan HUT RI dan aksi kemanusiaan bersama PMI Kota Pekalongan.",
      status: "Selesai",
      attendees: ["KDR-001", "KDR-002", "KDR-007", "KDR-008"]
    }
  ],
  inventory: [
    {
      id: "INV-001",
      code: "BRG-01",
      name: "Bendera Pataka Resmi IPNU",
      category: "Perlengkapan Upacara",
      quantity: 1,
      unit: "Buah",
      condition: "Baik",
      location: "Lemari Sekretariat",
      notes: "Kain satin berlogo bordir IPNU, lengkap dengan tiang & standing kayu"
    },
    {
      id: "INV-002",
      code: "BRG-02",
      name: "Bendera Pataka Resmi IPPNU",
      category: "Perlengkapan Upacara",
      quantity: 1,
      unit: "Buah",
      condition: "Baik",
      location: "Lemari Sekretariat",
      notes: "Kain satin berlogo bordir IPPNU, lengkap dengan tiang & standing kayu"
    },
    {
      id: "INV-003",
      code: "BRG-03",
      name: "Stempel Resmi PR IPNU & Bak Tinta",
      category: "Kesekretariatan",
      quantity: 1,
      unit: "Set",
      condition: "Baik",
      location: "Meja Sekretaris",
      notes: "Stempel kayu bulat tulisan PR IPNU Kalibaros"
    },
    {
      id: "INV-004",
      code: "BRG-04",
      name: "Stempel Resmi PR IPPNU & Bak Tinta",
      category: "Kesekretariatan",
      quantity: 1,
      unit: "Set",
      condition: "Baik",
      location: "Meja Sekretaris",
      notes: "Stempel kayu bulat tulisan PR IPPNU Kalibaros"
    },
    {
      id: "INV-005",
      code: "BRG-05",
      name: "Sound System Portable Wireless & 2 Mic",
      category: "Elektronik",
      quantity: 1,
      unit: "Unit",
      condition: "Baik",
      location: "Gudang Inventaris",
      notes: "Merk BareTone 12 inch, baterai tahan 5 jam untuk rutinan outdoor"
    },
    {
      id: "INV-006",
      code: "BRG-06",
      name: "Set Rebana / Hadroh Ranting (4 Terbang, 1 Bass, 1 Tam)",
      category: "Seni Budaya",
      quantity: 1,
      unit: "Set",
      condition: "Baik",
      location: "TPQ Baiturrohim",
      notes: "Alat shalawat grup Albanjari El-Fath IPNU IPPNU"
    },
    {
      id: "INV-007",
      code: "BRG-07",
      name: "Jas Pengurus IPNU & IPPNU",
      category: "Seragam",
      quantity: 12,
      unit: "Pcs",
      condition: "Rusak Ringan",
      location: "Lemari Sekretariat",
      notes: "2 jas kancing lepas, siap diperbaiki menjelang pelantikan"
    }
  ]
};

// Seed data dari file store.json bila ada, fallback ke DEFAULT_STORE
function getSeedStore() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STORE;
  }
}

// Ensure data directory exists and initialize store
export async function initDB() {
  if (usePostgres) {
    await ensurePgSchema(getPool());
    return;
  }

  const target = getWritableFile();
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
  }
}

// Read database
export async function readDB() {
  if (usePostgres) {
    const { rows } = await getPool().query('SELECT key, value FROM siad_store');
    if (rows.length === 0) {
      const seed = getSeedStore();
      await writeDB(seed);
      return seed;
    }
    const store = {};
    rows.forEach(r => { store[r.key] = r.value; });
    return store;
  }

  try {
    await initDB();
    const raw = fs.readFileSync(getWritableFile(), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err2) {
    console.error('Error reading seeded DB:', err2);
    return DEFAULT_STORE;
  }
}

// Atomic write to database
export async function writeDB(data) {
  if (usePostgres) {
    const pool = getPool();
    for (const key of STORE_KEYS) {
      const value = data[key] === undefined ? (key === 'settings' ? {} : []) : data[key];
      await pool.query(
        `INSERT INTO siad_store (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)]
      );
    }
    return true;
  }

  try {
    await initDB();
    const tempFile = `${getWritableFile()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, getWritableFile());
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Simpan file upload (foto) ke PostgreSQL. Return false bila pakai file-sistem.
export async function saveUpload(name, buffer, mime) {
  if (!usePostgres) return false;
  await getPool().query(
    `INSERT INTO siad_uploads (name, data, mime) VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime, created_at = now()`,
    [name, buffer, mime]
  );
  return true;
}

// Baca file upload dari PostgreSQL. Return null bila pakai file-sistem atau tidak ada.
export async function readUpload(name) {
  if (!usePostgres) return null;
  const { rows } = await getPool().query('SELECT data, mime FROM siad_uploads WHERE name = $1', [name]);
  if (rows.length === 0) return null;
  return { buffer: rows[0].data, mime: rows[0].mime };
}

export { usePostgres };

