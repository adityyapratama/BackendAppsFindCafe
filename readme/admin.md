# Admin API

Panduan *endpoint* level administrator. Operasi pada modul ini mengubah data sistem atau menyetujui masukan pengguna secara langsung.

> **AUTENTIKASI WAJIB**: Semua *endpoint* di bawah ini memerlukan header `Authorization: Bearer <admin_access_token>`. Role user harus `admin` atau `super_admin`.

---

## 1. Manage User
### 1.1 Register Admin Baru
Mendaftarkan akun *admin* baru (Bypass *user role* reguler).

- **URL**: `/api/v1/admin/users`
- **Method**: `POST`

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | Yes | Min 2, Max 100 chars | Nama admin |
| `email` | `string` | Yes | Valid email | Email (Harus Unik) |
| `password` | `string` | Yes | Min 6 chars | Kata sandi |
| `phone` | `string` | No | - | No. telp |

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Admin user created",
  "data": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string ('admin')",
    "phone": "string | null",
    "createdAt": "string"
  }
}
```

---

## 2. App Settings
Mengatur mode persetujuan (`manual` / `auto`) untuk submission tempat, review, dan foto, serta apakah user reguler diizinkan mengirim tempat/review baru. Tersimpan di tabel singleton `AppSettings` dan di-*cache* (TTL 30 menit).

### 2.1 Get Settings
- **URL**: `/api/v1/admin/settings`
- **Method**: `GET`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Settings retrieved",
  "data": {
    "id": "number",
    "placeApprovalMode": "string ('manual' | 'auto')",
    "reviewApprovalMode": "string ('manual' | 'auto')",
    "photoApprovalMode": "string ('manual' | 'auto')",
    "allowUserPlaceSubmission": "boolean",
    "allowUserReviews": "boolean",
    "updatedAt": "string (ISO Date)"
  }
}
```

### 2.2 Update Settings
- **URL**: `/api/v1/admin/settings`
- **Method**: `PUT`

#### Request Body (Minimal 1 field)
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `placeApprovalMode` | `string` | `manual` / `auto` | Mode persetujuan tempat baru |
| `reviewApprovalMode` | `string` | `manual` / `auto` | Mode persetujuan review baru |
| `photoApprovalMode` | `string` | `manual` / `auto` | Mode persetujuan foto baru |
| `allowUserPlaceSubmission` | `boolean` | - | Izinkan user submit tempat |
| `allowUserReviews` | `boolean` | - | Izinkan user menulis review |

#### Response (200 OK)
Mengembalikan objek settings terbaru. Setiap update otomatis tercatat di `ModerationLog` (`targetType: 'setting'`) dan menghapus cache settings.

---

## 3. Manage Master Data (Categories & Tags)

### 3.1 Create Category
Membuat data kategori utama baru.

- **URL**: `/api/v1/admin/categories`
- **Method**: `POST`

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | Yes | Min 2, Max 50 | Nama kategori (mis: "Restoran") |
| `slug` | `string` | Yes | Min 2, Max 50 | ID string (mis: "restoran") |
| `icon` | `string` | No | - | Ikon / Class Icon CSS |
| `sortOrder`| `number` | No | Integer, Default: 0 | Urutan tampilan |
| `isActive` | `boolean`| No | Default: true | Status kemunculan |

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Category created",
  "data": { "id": "number", "name": "string", "slug": "string" }
}
```

### 3.2 Update Category
- **URL**: `/api/v1/admin/categories/:id`
- **Method**: `PUT`
- *(Payload identik dengan Create Category, semua field optional)*

### 3.3 Delete Category
- **URL**: `/api/v1/admin/categories/:id`
- **Method**: `DELETE`
- *(Hanya menghapus kategori, tidak memerlukan Payload)*

*(CATATAN: Pola yang identik digunakan untuk Tags, dengan base URL `/api/v1/admin/tags`. Request Body Tags tidak punya `sortOrder`, tapi punya field tambahan wajib `type` (string, mis: `"facility"`) untuk pengelompokan/filter — lihat `GET /tags?type=...` di `readme/categories-tags.md`).*

---

## 4. Manage Places (Bypass Approval)

Operasi ini memotong (*bypass*) alur *edit-request* pada user reguler. Semua aksi pada section ini tercatat di `ModerationLog`.

### 4.1 Get Place Detail (Admin)
Detail lengkap sebuah tempat termasuk relasi yang tidak ditampilkan ke publik (`editRequests`, `reports`, semua status `reviews`/`photos`, bukan hanya yang `approved`).

- **URL**: `/api/v1/admin/places/:id`
- **Method**: `GET`

#### Response (200 OK)
Mengembalikan objek Place lengkap dengan relasi `category`, `placeTags.tag`, `openingHours`, `photos`, `reviews`, `editRequests`, `reports`.

### 4.2 Force Update Place
- **URL**: `/api/v1/admin/places/:id` *(Ganti `:id` dengan ID Place)*
- **Method**: `PUT`

#### Request Body (Semua Optional)
| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Nama tempat |
| `description`| `string` | Deskripsi tempat |
| `address` | `string` | Alamat fisik |
| `district` | `string` | Kecamatan |
| `latitude` | `number` | Koordinat Latitude |
| `longitude`| `number` | Koordinat Longitude |
| `categoryId` | `number` | ID Kategori (Relasi) |
| `priceMin` | `number` | Harga Minimum |
| `priceMax` | `number` | Harga Maksimum |
| `phone` | `string` | Nomor Telepon |
| `websiteUrl` | `string` | Website URL |
| `instagramUrl`| `string` | Instagram URL |
| `googleMapsUrl`|`string` | URL Google Maps |
| `status` | `string` | `pending`, `approved`, `rejected`, `archived` |
| `isPermanentlyClosed` | `boolean`| Tandai tempat sudah tutup permanen |

#### Response (200 OK)
Mengembalikan objek lengkap kafe sesuai skema *database*.

### 4.3 Force Delete Place
Menghapus permanen *Place* dari *database* (hard delete, bukan soft delete).
- **URL**: `/api/v1/admin/places/:id`
- **Method**: `DELETE`

---

## 5. Moderation & Workflow — Places

### 5.1 Get Pending Places
Mengambil daftar tempat dengan parameter *query* (`status`, `search`, `page`, `limit`). Biasa digunakan dengan `?status=pending` untuk melihat antrian antarmuka.
- **URL**: `/api/v1/admin/places?status=pending`
- **Method**: `GET`
- **Response**: Array Place Objects dengan relasi ke *Category* dan *Submitter*, plus `meta` (`total`, `page`, `limit`, `totalPages`).

### 5.2 Approve Place
Menyetujui tempat yang `pending` sehingga tampil ke publik.
- **URL**: `/api/v1/admin/places/:id/approve`
- **Method**: `PATCH`
- **Body**: `{}` (Kosong)

### 5.3 Reject Place
Menolak tempat yang dikirim.
- **URL**: `/api/v1/admin/places/:id/reject`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "rejectionReason": "string (Alasan kenapa ditolak, wajib, min 3 karakter)"
  }
  ```

### 5.4 Archive Place
Menyembunyikan tempat dari publik tanpa menghapusnya (status menjadi `archived`).
- **URL**: `/api/v1/admin/places/:id/archive`
- **Method**: `PATCH`
- **Body**: `{}` (Kosong)

### 5.5 Restore Place
Mengembalikan tempat yang di-*archive* (atau ditolak) kembali ke status `pending` untuk ditinjau ulang.
- **URL**: `/api/v1/admin/places/:id/restore`
- **Method**: `PATCH`
- **Body**: `{}` (Kosong)

---

## 6. Moderation & Workflow — Reports
Laporan yang dikirim user lewat `POST /places/:id/reports` (lihat `readme/places.md`).

### 6.1 Get Reports
- **URL**: `/api/v1/admin/reports`
- **Method**: `GET`
- **Query Params**: `status` (`open` / `resolved` / `dismissed`), `page`, `limit`
- **Response**: Array Report Objects dengan relasi `place` (`id`, `name`) dan `reporter` (`id`, `name`), plus `meta` (`total`, `page`, `limit`).

### 6.2 Resolve / Dismiss Report
- **URL**: `/api/v1/admin/reports/:id/resolve`
- **Method**: `PATCH`

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `status` | `string` | No | `resolved` (default) / `dismissed` | Hasil tinjauan |
| `resolutionNote` | `string` | No | - | Catatan penyelesaian |

---

## 7. Moderation & Workflow — Edit Requests
Usulan perubahan data yang dikirim user lewat `POST /places/:id/edit-requests` (lihat `readme/places.md`). Saat di-*approve*, hanya field yang ada di whitelist (`name`, `description`, `address`, `district`, `subdistrict`, `postalCode`, `latitude`, `longitude`, `priceMin`, `priceMax`, `phone`, `websiteUrl`, `instagramUrl`, `googleMapsUrl`) yang akan benar-benar diterapkan ke data Place.

### 7.1 Get Edit Requests
- **URL**: `/api/v1/admin/edit-requests`
- **Method**: `GET`
- **Query Params**: `status` (`pending` / `approved` / `rejected`), `page`, `limit`
- **Response**: Array EditRequest Objects dengan relasi `place` (`id`, `name`) dan `submitter` (`id`, `name`).

### 7.2 Approve Edit Request
Menerapkan `proposedData` (setelah disaring whitelist) ke Place terkait.
- **URL**: `/api/v1/admin/edit-requests/:id/approve`
- **Method**: `PATCH`
- **Body**: `{ "reviewNote": "string (opsional)" }`

### 7.3 Reject Edit Request
- **URL**: `/api/v1/admin/edit-requests/:id/reject`
- **Method**: `PATCH`
- **Body**: `{ "reviewNote": "string (opsional)" }`

---

## 8. Moderation & Workflow — Reviews & Photos
Berguna saat `reviewApprovalMode`/`photoApprovalMode` diset ke `manual` (lihat section 2), sehingga review/foto baru masuk dengan status `pending` dan perlu ditinjau di sini.

### 8.1 Get Reviews (Admin)
- **URL**: `/api/v1/admin/reviews`
- **Method**: `GET`
- **Query Params**: `status` (`pending` / `approved` / `rejected`), `page`, `limit`

### 8.2 Approve / Reject Review
- **URL**: `/api/v1/admin/reviews/:id/approve` — **Method**: `PATCH` — **Body**: `{}`
- **URL**: `/api/v1/admin/reviews/:id/reject` — **Method**: `PATCH` — **Body**: `{ "rejectionReason": "string (wajib, min 3 karakter)" }`
- Keduanya otomatis memicu perhitungan ulang `avgRating`/`ratingCount` pada Place terkait.

### 8.3 Get Photos (Admin)
- **URL**: `/api/v1/admin/photos`
- **Method**: `GET`
- **Query Params**: `status` (`pending` / `approved` / `rejected`), `page`, `limit`

### 8.4 Approve / Reject Photo
- **URL**: `/api/v1/admin/photos/:id/approve` — **Method**: `PATCH` — **Body**: `{}`
- **URL**: `/api/v1/admin/photos/:id/reject` — **Method**: `PATCH` — **Body**: `{ "rejectionReason": "string (wajib, min 3 karakter)" }`

---

## 9. Moderation Logs
Riwayat *audit trail* dari seluruh aksi admin (`approve`, `reject`, `archive`, `restore`, `update`, `delete`, `update_setting`, `create_admin`, dll), tercatat otomatis oleh setiap endpoint di atas.

- **URL**: `/api/v1/admin/moderation-logs`
- **Method**: `GET`
- **Query Params**: `page`, `limit`

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Moderation logs retrieved",
  "data": [
    {
      "id": "number",
      "adminId": "number | null",
      "targetType": "string ('place' | 'review' | 'photo' | 'report' | 'edit_request' | 'setting' | 'user')",
      "targetId": "number",
      "action": "string",
      "note": "string | null",
      "beforeData": "object | null",
      "afterData": "object | null",
      "createdAt": "string (ISO Date)",
      "admin": { "id": "number", "name": "string" }
    }
  ],
  "meta": { "total": "number", "page": "number", "limit": "number" }
}
```
