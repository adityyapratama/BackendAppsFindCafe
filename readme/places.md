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
| `search` | `string` | No | `""` | Pencarian berdasarkan nama/alamat |
| `page` | `number` | No | `1` | Halaman data |
| `limit` | `number` | No | `10` | Jumlah data per halaman |
| `sort` | `string` | No | `rating`| Opsi: `rating` atau `latest` |
| `order` | `string` | No | `desc` | Opsi: `asc` atau `desc` |
| `category` | `number` | No | - | Filter by ID kategori |
| `district` | `string` | No | - | Filter by Kecamatan (teks) |

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
      "category": { "name": "string" },
      "photos": [
        {
          "id": "number",
          "url": "string (URL)"
        }
      ]
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
    "submitterId": "number",
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
        "url": "string"
      }
    ],
    "reviews": [
      {
        "id": "number",
        "rating": "number (1-5)",
        "content": "string",
        "createdAt": "string (ISO Date)",
        "user": {
          "name": "string",
          "avatarUrl": "string | null"
        }
      }
    ]
  }
}
```

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
| `tags` | `[number]` | No | Array of Tag IDs | Fasilitas (opsional) |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Place created successfully",
  "data": {
    "id": "number",
    "name": "string",
    "status": "pending"
  }
}
```
