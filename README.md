# FindCafe Backend API ☕

Selamat datang di repositori Backend untuk aplikasi **FindCafe**!

Sistem backend ini dibangun menggunakan **Node.js, Express, TypeScript, dan Prisma ORM**, dengan database **PostgreSQL**. Tujuan utama sistem ini adalah menyediakan fondasi API yang tangguh, aman, dan berkinerja tinggi untuk aplikasi pencarian dan ulasan kafe, tempat kerja, serta *coworking space*.

## 🌟 Fitur Utama
Sistem ini dilengkapi dengan berbagai fungsionalitas kompleks yang dirancang untuk skala produksi:
- **Authentication & Authorization**: Registrasi JWT, Login, sistem Access dan Refresh Token, serta *Role-Based Access Control* (User biasa dan Admin).
- **Place Directory**: Pencarian kafe dengan filter lanjutan (kata kunci, rating, *pagination*), relasi kategori dan fasilitas (Tags).
- **User Engagement**: Sistem tambah favorit, pemberian rating (kalkulasi nilai rata-rata otomatis), dan tulis ulasan (Review).
- **Master Data Management**: Manajemen penuh (CRUD) kategori tempat (mis. Cafe, Restaurant) dan tag fasilitas (mis. WiFi, AC) yang dikelola oleh admin.
- **Moderation Workflow (Admin Panel)**: User mendaftarkan tempat, admin memverifikasi (*Approve/Reject*). Termasuk sistem pelaporan (*Reporting*) dan permintaan pengubahan data (*Edit Requests*).
- **Security & Performance**: Validasi input (Joi), Rate Limiting (mencegah *brute-force*), proteksi keamanan Header (Helmet, CORS), Cache Service untuk respons cepat, serta Logging.

## 📚 Panduan API & Postman
Kami telah memisahkan dokumentasi setiap kelompok API ke dalam folder `readme` untuk mempermudah anggota tim (Frontend Developer / QA) dalam melakukan testing menggunakan Postman atau alat lainnya. 

Pilih modul API yang ingin Anda pelajari:
1. 🔐 **[Authentication API](./readme/auth.md)**: Registrasi, Login, mendapatkan *current user*, dan Logout.
2. 🏪 **[Places / Cafe API](./readme/places.md)**: Daftar kafe, detail kafe, dan submisi kafe baru.
3. 🏷️ **[Categories & Tags API](./readme/categories-tags.md)**: Mengambil data master (Kategori dan Fasilitas).
4. ⭐ **[Reviews & Favorites API](./readme/reviews-favorites.md)**: Meninggalkan *rating*, ulasan, dan mengelola koleksi favorit.
5. 🛡️ **[Admin Panel API](./readme/admin.md)**: Endpoint super-admin untuk manajemen kategori, modifikasi kafe secara langsung, manajemen user, serta *approval workflow*.

## 🚀 Instalasi & Menjalankan Project

### Persyaratan Sistem
- Node.js versi terbaru (minimal v16+)
- PostgreSQL Database berjalan di sistem lokal/cloud Anda.

### Cara Menjalankan
1. *Clone* repository ini:
   ```bash
   git clone <url-repo-anda>
   cd BackendAppsFindCafe
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Salin file `.env.example` ke `.env` (pastikan variabel koneksi database `DATABASE_URL` diisi dengan kredensial PostgreSQL Anda):
   ```bash
   cp .env.example .env
   ```
4. Push Prisma schema untuk sinkronisasi Database:
   ```bash
   npx prisma db push
   ```
5. Jalankan mode Development:
   ```bash
   npm run dev
   ```
   *Server akan berjalan secara default di `http://localhost:3000`*.

---
Dibuat dengan ❤️ untuk kemudahan mencari tempat nugas.
