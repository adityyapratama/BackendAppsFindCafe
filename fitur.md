# Cafe Surabaya

Cafe Surabaya adalah aplikasi rekomendasi dan direktori cafe berbasis komunitas untuk area Surabaya. Aplikasi ini membantu user menemukan cafe melalui daftar tempat, filter, peta, GPS, jarak dari lokasi user, detail cafe, dan tombol rute ke aplikasi maps.

Project ini dibuat untuk memenuhi brief **Cloud Computing Project: Android Map Directory**, dengan fokus pada integrasi:

```text
Flutter App -> REST API -> Express Backend -> PostgreSQL Database -> GPS & Map Routing
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| Mobile App | Flutter |
| Backend API | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Deployment | Railway |
| Maps | flutter_map / Google Maps intent |
| Location | geolocator |
| Routing | url_launcher ke Google Maps |

## Fitur User

| Fitur | Deskripsi |
|---|---|
| Register dan login | User dapat membuat akun dan masuk ke aplikasi |
| Lihat daftar cafe | Menampilkan cafe yang sudah approved |
| Cari cafe | Search berdasarkan nama, alamat, atau keyword |
| Filter cafe | Filter berdasarkan kategori, fasilitas, area, rating, atau harga |
| Lihat peta | Menampilkan marker cafe berdasarkan latitude dan longitude |
| Lokasi user | Mengambil lokasi user dengan permission GPS |
| Hitung jarak | Menghitung jarak user ke cafe menggunakan koordinat |
| Detail cafe | Menampilkan alamat, deskripsi, harga, rating, fasilitas, foto, dan jam buka |
| Buka rute | Membuka rute ke cafe melalui Google Maps |
| Tambah rekomendasi cafe | User dapat submit cafe baru dari aplikasi |
| Pilih lokasi cafe | User memilih titik lokasi cafe di peta saat submit |
| Favorit | User dapat menyimpan cafe favorit |
| Rekomendasikan cafe | User dapat memberi sinyal rekomendasi atau like publik |
| Review cafe | User dapat memberi rating dan komentar |
| Report cafe | User dapat melaporkan data cafe yang salah |
| Ajukan edit data | User dapat mengusulkan perubahan data cafe |

## Fitur Admin

| Fitur | Deskripsi |
|---|---|
| Login admin | Admin masuk menggunakan akun dengan role admin |
| Dashboard admin mobile | Admin mengelola data langsung dari aplikasi mobile |
| Approval mode | Admin dapat memilih mode auto, manual, atau hybrid approval |
| Auto approve | Cafe baru langsung tampil jika mode approval auto |
| Manual approve | Cafe baru masuk pending dan perlu dicek admin |
| Hybrid approve | Backend dapat auto approve jika data lolos validasi tertentu |
| Kelola pending cafe | Admin melihat daftar cafe yang menunggu approval |
| Approve cafe | Admin menyetujui cafe agar tampil ke publik |
| Reject cafe | Admin menolak cafe dan memberi alasan |
| Arsip cafe | Admin dapat menyembunyikan cafe bermasalah |
| Kelola report | Admin memproses laporan dari user |
| Kelola review dan foto | Admin dapat approve/reject review atau foto |
| Moderation logs | Sistem mencatat riwayat aksi admin |

## Database

Desain database tersedia pada file:

| File | Fungsi |
|---|---|
| `cafe_surabaya_dbdiagram.dbml` | Desain DBML untuk dbdiagram.io |
| `cafe_surabaya_schema.sql` | DDL PostgreSQL lengkap dengan enum, table, index, dan trigger |
| `cafe_surabaya_create_tables_only.sql` | Query CREATE TABLE saja tanpa enum, index, dan trigger |

## Format Response API

Response sukses:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {},
  "meta": {}
}
```

Response error:

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "name": ["Nama cafe wajib diisi"]
  }
}
```

## Auth API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user baru |
| POST | `/api/auth/login` | Public | Login user/admin |
| GET | `/api/auth/me` | User | Ambil profil user login |
| POST | `/api/auth/logout` | User | Logout user |

## Master Data API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/categories` | Public | Ambil daftar kategori |
| GET | `/api/tags` | Public | Ambil daftar tag fasilitas, vibe, purpose, dan payment |

## Places API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/places` | Public | Ambil daftar cafe approved |
| GET | `/api/places/:id` | Public | Ambil detail cafe |
| POST | `/api/places` | User | Submit rekomendasi cafe baru |
| POST | `/api/places/:id/photos` | User | Upload atau submit foto cafe |
| POST | `/api/places/:id/edit-requests` | User | Ajukan perubahan data cafe |
| POST | `/api/places/:id/reports` | User | Laporkan data cafe yang salah |

Query parameter untuk `GET /api/places`:

| Parameter | Contoh | Fungsi |
|---|---|---|
| `search` | `?search=kopi` | Cari nama/alamat cafe |
| `category_id` | `?category_id=1` | Filter kategori |
| `tag_ids` | `?tag_ids=1,2,3` | Filter fasilitas/tag |
| `district` | `?district=Wonokromo` | Filter area |
| `min_rating` | `?min_rating=4` | Filter rating minimum |
| `price_min` | `?price_min=10000` | Filter harga minimum |
| `price_max` | `?price_max=50000` | Filter harga maksimum |
| `lat` | `?lat=-7.2756` | Latitude user untuk hitung jarak |
| `lng` | `?lng=112.6426` | Longitude user untuk hitung jarak |
| `radius_km` | `?radius_km=5` | Filter cafe dalam radius tertentu |
| `sort` | `?sort=distance` | Urutkan berdasarkan distance, rating, newest, atau recommended |
| `page` | `?page=1` | Pagination |
| `limit` | `?limit=10` | Jumlah data per halaman |

## Favorite API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/favorites` | User | Ambil daftar cafe favorit user |
| POST | `/api/places/:id/favorite` | User | Tambah cafe ke favorit |
| DELETE | `/api/places/:id/favorite` | User | Hapus cafe dari favorit |

## Recommendation API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/places/:id/recommend` | User | Rekomendasikan cafe |
| DELETE | `/api/places/:id/recommend` | User | Batalkan rekomendasi cafe |

## Review API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/places/:id/reviews` | Public | Ambil review cafe |
| POST | `/api/places/:id/reviews` | User | Tambah review cafe |
| PUT | `/api/reviews/:id` | User | Update review milik sendiri |
| DELETE | `/api/reviews/:id` | User | Hapus review milik sendiri |

## Admin Settings API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/settings` | Admin | Ambil pengaturan aplikasi |
| PUT | `/api/admin/settings` | Admin | Update approval mode dan setting aplikasi |

Contoh body `PUT /api/admin/settings`:

```json
{
  "place_approval_mode": "manual",
  "review_approval_mode": "auto",
  "photo_approval_mode": "manual",
  "allow_user_place_submission": true,
  "allow_user_reviews": true
}
```

## Admin Places API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/places` | Admin | Ambil semua cafe berdasarkan status |
| GET | `/api/admin/places/:id` | Admin | Ambil detail cafe untuk moderation |
| PATCH | `/api/admin/places/:id/approve` | Admin | Approve cafe |
| PATCH | `/api/admin/places/:id/reject` | Admin | Reject cafe |
| PATCH | `/api/admin/places/:id/archive` | Admin | Arsip cafe |
| PATCH | `/api/admin/places/:id/restore` | Admin | Restore cafe archived |

Query parameter untuk `GET /api/admin/places`:

| Parameter | Contoh | Fungsi |
|---|---|---|
| `status` | `?status=pending` | Filter pending, approved, rejected, atau archived |
| `search` | `?search=kopi` | Search data cafe |
| `page` | `?page=1` | Pagination |
| `limit` | `?limit=10` | Jumlah data per halaman |

## Admin Moderation API

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/reports` | Admin | Ambil laporan user |
| PATCH | `/api/admin/reports/:id/resolve` | Admin | Selesaikan laporan |
| GET | `/api/admin/edit-requests` | Admin | Ambil pengajuan edit data |
| PATCH | `/api/admin/edit-requests/:id/approve` | Admin | Approve pengajuan edit |
| PATCH | `/api/admin/edit-requests/:id/reject` | Admin | Reject pengajuan edit |
| GET | `/api/admin/reviews` | Admin | Ambil review berdasarkan status |
| PATCH | `/api/admin/reviews/:id/approve` | Admin | Approve review |
| PATCH | `/api/admin/reviews/:id/reject` | Admin | Reject review |
| GET | `/api/admin/photos` | Admin | Ambil foto berdasarkan status |
| PATCH | `/api/admin/photos/:id/approve` | Admin | Approve foto |
| PATCH | `/api/admin/photos/:id/reject` | Admin | Reject foto |
| GET | `/api/admin/moderation-logs` | Admin | Ambil riwayat moderation |

## Endpoint Prioritas MVP

Endpoint yang perlu dibuat lebih dulu:

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/categories
GET    /api/tags

GET    /api/places
GET    /api/places/:id
POST   /api/places

GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/places?status=pending
PATCH  /api/admin/places/:id/approve
PATCH  /api/admin/places/:id/reject
```

## Rencana Implementasi

1. Buat backend Express dan konfigurasi Prisma.
2. Hubungkan backend ke PostgreSQL Railway.
3. Buat migration berdasarkan desain database.
4. Implement auth register, login, dan role admin.
5. Implement API categories, tags, dan places.
6. Implement approval mode auto/manual/hybrid.
7. Hubungkan Flutter ke API backend.
8. Tambahkan GPS, map marker, distance, dan routing.
