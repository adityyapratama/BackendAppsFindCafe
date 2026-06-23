# Places API

Panduan endpoint untuk membaca dan membuat data tempat / kafe.

## 1. Get All Places
Mendapatkan daftar kafe dengan *pagination*, filter, dan fitur pencarian. Hanya mengembalikan tempat dengan status `approved`.

- **URL**: `/api/v1/places`
- **Method**: `GET`
- **Auth Required**: No

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `search` | `string` | No | - | Pencarian pada nama, alamat, dan deskripsi (case-insensitive) |
| `page` | `number` | No | `1` | Halaman data |
| `limit` | `number` | No | `10` | Jumlah data per halaman |
| `sort` | `string` | No | terbaru (`createdAt desc`) | Opsi: `rating` (avgRating desc) atau `recommended` (recommendationCount desc) |
| `category_id` | `number` | No | - | Filter by ID kategori |
| `district` | `string` | No | - | Filter by Kecamatan (teks, exact match) |
| `min_rating` | `number` | No | - | Filter `avgRating >=` nilai ini |
| `price_min` | `number` | No | - | Filter `priceMin >=` nilai ini |
| `price_max` | `number` | No | - | Filter `priceMax <=` nilai ini |
| `tag_ids` | `string` | No | - | Daftar ID tag dipisah koma (mis. `1,2,3`), tempat harus punya minimal salah satu |
| `lat`, `lng`, `radius_km` | `number` | No | - | Jika ketiganya diisi, mengaktifkan pencarian radius (formula Haversine) dan diurutkan berdasarkan jarak terdekat secara default; mengabaikan `sort` kecuali `rating`/`recommended` |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Places retrieved",
  "data": [
    {
      "id": "number",
      "name": "string",
      "address": "string",
      "district": "string | null",
      "latitude": "number",
      "longitude": "number",
      "avgRating": "number (0.0 to 5.0)",
      "recommendationCount": "number",
      "status": "string ('approved')",
      "category": { "name": "string", "slug": "string", "icon": "string | null" },
      "placeTags": [
        { "tag": { "name": "string", "slug": "string", "type": "string" } }
      ],
      "distance": "number (km, hanya muncul jika query lat/lng/radius_km dipakai)"
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

---

## 2. Get Place by ID
Mendapatkan detail komprehensif dari sebuah kafe.

- **URL**: `/api/v1/places/:id`
- **Method**: `GET`
- **Auth Required**: No
- **URL Parameter**: `id` (number) - ID dari Place

### Response (200 OK)
```json
{
  "success": true,
  "message": "Place retrieved",
  "data": {
    "id": "number",
    "categoryId": "number",
    "submittedBy": "number | null",
    "name": "string",
    "description": "string | null",
    "address": "string",
    "district": "string | null",
    "subdistrict": "string | null",
    "postalCode": "string | null",
    "latitude": "number (-90 to 90)",
    "longitude": "number (-180 to 180)",
    "priceMin": "number | null",
    "priceMax": "number | null",
    "phone": "string | null",
    "websiteUrl": "string | null",
    "instagramUrl": "string | null",
    "googleMapsUrl": "string | null",
    "avgRating": "number",
    "recommendationCount": "number",
    "status": "string",
    "category": {
      "id": "number",
      "name": "string",
      "slug": "string"
    },
    "placeTags": [
      {
        "tag": {
          "id": "number",
          "name": "string",
          "slug": "string",
          "icon": "string | null"
        }
      }
    ],
    "openingHours": [
      {
        "dayOfWeek": "number (0-6)",
        "openTime": "string (HH:mm:ss)",
        "closeTime": "string (HH:mm:ss)"
      }
    ],
    "photos": [
      {
        "id": "number",
        "photoUrl": "string",
        "caption": "string | null",
        "isCover": "boolean"
      }
    ]
  }
}
```

Catatan: `photos` hanya menyertakan foto dengan `status: 'approved'` (maks. 10). Review **tidak** disertakan di sini — gunakan endpoint terpisah `GET /places/:id/reviews` (lihat bagian 7). Response detail ini di-*cache* selama 5 menit (`PLACE_DETAIL` TTL).

---

## 3. Create / Submit Place
Mengajukan tempat baru. Secara default akan masuk ke sistem dengan status `pending` dan menunggu persetujuan admin.

- **URL**: `/api/v1/places`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `categoryId` | `number` | Yes | Valid Category ID | Kategori tempat |
| `name` | `string` | Yes | Max 150 chars | Nama tempat |
| `address` | `string` | Yes | - | Alamat jalan |
| `district` | `string` | No | - | Kecamatan |
| `latitude` | `number` | Yes | -90 to 90 | Koordinat Latitude |
| `longitude` | `number` | Yes | -180 to 180 | Koordinat Longitude |
| `description`| `string` | No | - | Deskripsi tempat |
| `priceMin` | `number` | No | >= 0 | Harga terendah |
| `priceMax` | `number` | No | >= 0 | Harga tertinggi |
| `phone` | `string` | No | - | Nomor telp |
| `websiteUrl` | `string` | No | Valid URI format | URL Web |
| `instagramUrl`| `string` | No | Valid URI format | URL IG |
| `googleMapsUrl`| `string` | No | Valid URI format | URL Gmaps |

Catatan: endpoint ini **belum** mendukung pengisian tag/fasilitas (`tags`) saat submit — field tersebut akan diabaikan jika dikirim. Tag baru bisa dikaitkan ke tempat lewat sisi admin/database secara langsung untuk saat ini.

### Response (201 Created)
```json
{
  "success": true,
  "message": "Place submitted successfully",
  "data": {
    "id": "number",
    "name": "string",
    "status": "pending"
  }
}
```

Catatan: jika `AppSettings.placeApprovalMode` diset ke `auto`, tempat langsung berstatus `approved` (tidak menunggu admin).

---

## 4. Upload Foto Tempat
Mengunggah foto untuk sebuah tempat. File diunggah ke Cloudinary di server (bukan upload langsung dari client ke Cloudinary).

- **URL**: `/api/v1/places/:id/photos`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)
- **Content-Type**: `multipart/form-data`

### Form Fields
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `photo` | `file` | Yes | JPEG/PNG/WebP, max 5MB | File gambar |
| `caption` | `string` | No | Max 150 chars | Keterangan foto |
| `isCover` | `string` | No | `"true"` / `"false"` | Jadikan foto sampul |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": "number",
    "placeId": "number",
    "photoUrl": "string (Cloudinary secure URL)",
    "storagePath": "string (Cloudinary public_id)",
    "caption": "string | null",
    "isCover": "boolean",
    "status": "string ('pending' atau 'approved', tergantung photoApprovalMode)"
  }
}
```

### Response (400 Bad Request)
Dikembalikan jika tipe file bukan JPEG/PNG/WebP (`"Only JPEG, PNG, and WebP images are allowed"`) atau ukuran file melebihi 5MB (`"File too large. Maximum size is 5MB."`).

---

## 5. Ajukan Perubahan Data (Edit Request)
Mengajukan usulan perubahan data tempat yang sudah ada. Tidak langsung mengubah data — menunggu persetujuan admin (lihat `readme/admin.md`).

- **URL**: `/api/v1/places/:id/edit-requests`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `proposedData` | `object` | Yes | Minimal 1 field. Field yang didukung: `name`, `description`, `address`, `district`, `latitude`, `longitude`, `categoryId`, `priceMin`, `priceMax`, `phone`, `websiteUrl`, `instagramUrl`, `googleMapsUrl` |

**Contoh Payload**:
```json
{
  "proposedData": {
    "phone": "081234567890",
    "priceMin": 15000
  }
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Edit request submitted",
  "data": {
    "id": "number",
    "placeId": "number",
    "submittedBy": "number",
    "proposedData": "object",
    "status": "pending"
  }
}
```

---

## 6. Laporkan Tempat (Report)
Melaporkan tempat karena alasan tertentu (lokasi salah, sudah tutup, duplikat, dll). Menambah `reportCount` pada tempat tersebut.

- **URL**: `/api/v1/places/:id/reports`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `reasonType` | `string` | Yes | Salah satu dari: `wrong_location`, `closed`, `duplicate`, `inappropriate`, `wrong_information`, `other` | Jenis alasan laporan |
| `description` | `string` | No | - | Keterangan tambahan |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Report submitted",
  "data": {
    "id": "number",
    "placeId": "number",
    "reportedBy": "number",
    "reasonType": "string",
    "description": "string | null",
    "status": "open"
  }
}
```

---

## 7. Get Reviews untuk Tempat
Mendapatkan daftar review (yang sudah `approved`) untuk sebuah tempat, dengan *pagination*. Lihat `readme/reviews-favorites.md` untuk endpoint create/update/delete review.

- **URL**: `/api/v1/places/:id/reviews`
- **Method**: `GET`
- **Auth Required**: No

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | `number` | No | `1` | Halaman data |
| `limit` | `number` | No | `10` | Jumlah data per halaman |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Reviews retrieved",
  "data": [
    {
      "id": "number",
      "rating": "number (1-5)",
      "comment": "string | null",
      "createdAt": "string (ISO Date)",
      "user": { "id": "number", "name": "string", "avatarUrl": "string | null" }
    }
  ],
  "meta": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```
