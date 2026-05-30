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

## 2. Manage Master Data (Categories & Tags)

### 2.1 Create Category
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

### 2.2 Update Category
- **URL**: `/api/v1/admin/categories/:id`
- **Method**: `PUT`
- *(Payload identik dengan Create Category, semua field optional)*

### 2.3 Delete Category
- **URL**: `/api/v1/admin/categories/:id`
- **Method**: `DELETE`
- *(Hanya menghapus kategori, tidak memerlukan Payload)*

*(CATATAN: Pola yang identik digunakan untuk Tags, dengan base URL `/api/v1/admin/tags` dan menghapus field `sortOrder` pada Request Body).*

---

## 3. Manage Places (Bypass Approval)

Operasi ini memotong (*bypass*) alur *edit-request* pada user reguler.

### 3.1 Force Update Place
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
| `isActive` | `boolean`| Status Aktif (Soft delete fallback) |

#### Response (200 OK)
Mengembalikan objek lengkap kafe sesuai skema *database*.

### 3.2 Force Delete Place
Menghapus permanen *Place* dari *database*.
- **URL**: `/api/v1/admin/places/:id`
- **Method**: `DELETE`

---

## 4. Moderation & Workflow (Persetujuan Data)

### 4.1 Get Pending Places
Mengambil daftar tempat dengan parameter *query*. Biasa digunakan dengan `?status=pending` untuk melihat antrian antarmuka.
- **URL**: `/api/v1/admin/places?status=pending`
- **Method**: `GET`
- **Response**: Array Place Objects dengan relasi ke *Category* dan *Submitter*.

### 4.2 Approve Place
Menyetujui tempat yang `pending` sehingga tampil ke publik.
- **URL**: `/api/v1/admin/places/:id/approve`
- **Method**: `PATCH`
- **Body**: `{}` (Kosong)

### 4.3 Reject Place
Menolak tempat yang dikirim.
- **URL**: `/api/v1/admin/places/:id/reject`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "rejectionReason": "string (Alasan kenapa ditolak, wajib)"
  }
  ```

### 4.4 Archive Place
Menyembunyikan tempat.
- **URL**: `/api/v1/admin/places/:id/archive`
- **Method**: `PATCH`
- **Body**: `{}` (Kosong)
