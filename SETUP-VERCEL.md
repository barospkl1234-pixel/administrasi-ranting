# Panduan Deploy ke Vercel + Neon PostgreSQL (Data Tidak Reset)

## Masalah

Di Vercel, filesystem bersifat **ephemeral** — data JSON akan **reset setiap cold start**.
Solusinya: gunakan **PostgreSQL gratis** dari [Neon.tech](https://neon.tech).

---

## Langkah 1: Buat Akun & Database di Neon.tech

1. Buka https://neon.tech dan daftar (gratis, bisa pakai GitHub/Google)
2. Setelah login, klik **"Create Project"**
3. Isi:
   - **Project name**: `ipnu-ippnu-admin`
   - **Database name**: `siad` (atau apa saja)
   - **Region**: pilih yang terdekat (misal: **AWS Asia Pacific - Singapore**)
4. Klik **"Create Project"**
5. **Catat connection string** yang muncul, formatnya seperti:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxx.us-east-2.aws.neon.tech/siad?sslmode=require
   ```

> ⚠️ **Simpan connection string ini!** Akan dipakai di Vercel.

---

## Langkah 2: Set Environment Variable di Vercel

1. Buka dashboard Vercel → pilih proyek **administrasi-ipnu-ippnu**
2. Klik tab **"Settings"** → **"Environment Variables"**
3. Tambahkan variable baru:
   - **Name**: `DATABASE_URL`
   - **Value**: _(paste connection string dari Neon di atas)_
   - **Environments**: centang **Production**, **Preview**, dan **Development**
4. Klik **"Save"**
5. (Opsional) Tambahkan lagi:
   - **Name**: `DATABASE_SSL`
   - **Value**: `true`
   - **Environments**: centang semua

---

## Langkah 3: Deploy / Redeploy

### Jika sudah connect GitHub:
- Push kode ke branch `main`
- Vercel akan otomatis deploy ulang

### Jika belum:
- Buka tab **"Deployments"** → klik tombol **"..."** di deployment terakhir → **"Redeploy"**

---

## Langkah 4: Verifikasi

1. Buka URL deployment (misal: `https://ipnu-ippnu.vercel.app`)
2. Buka `/api/health` — harusnya muncul `{"status":"online",...}`
3. Input data baru (anggota, surat, dll)
4. **Refresh halaman** — data harusnya tetap ada ✅

---

## Cara Kerja

Ketika `DATABASE_URL` di-set:
- Semua data (anggota, surat, keuangan, inventaris, event, pengaturan) tersimpan di **PostgreSQL Neon**
- Foto/foto profil juga tersimpan di database (tabel `siad_uploads`)
- Data **tidak akan reset** meskipun Vercel cold start

Ketika `DATABASE_URL` **tidak** di-set:
- Aplikasi fallback ke file JSON (hanya untuk development lokal)

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Data masih reset | Pastikan `DATABASE_URL` ter-set di Vercel Settings → Environment Variables |
| Error 500 di API | Cek Vercel Function Logs → pastikan connection string benar |
| Koneksi timeout | Neon free tier auto-pauses setelah inaktif — kunjungi neon.tech dashboard untuk wake up |
| SSL error | Set `DATABASE_SSL=true` di Vercel env vars |

---

## Biaya

- **Neon.tech Free Tier**: 512 MB RAM, 0.5 GB storage, cukup untuk aplikasi ini
- **Vercel Free Hobby**: unlimited deployments untuk personal use
- **Total: GRATIS** ✅
