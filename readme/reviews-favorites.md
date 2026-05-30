# Reviews & Favorites API

Panduan interaksi berbasis User terkait rating, ulasan, dan koleksi tempat favorit.

## 1. Reviews (Ulasan & Rating)

Sistem akan otomatis menghitung ulang nilai kolom `avgRating` dan `recommendationCount` pada tabel `places` di latar belakang setiap kali terdapat *Insert/Update/Delete* review.

### 1.1 Tambah Review Baru
- **URL**: `/api/v1/places/:id/reviews` *(Ganti `:id` dengan Place ID)*
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `rating` | `number` | Yes | 1 to 5 | Nilai rating bintang (Integer) |
| `content` | `string` | No | - | Teks ulasan atau komentar user |

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "id": "number (Review ID)",
    "placeId": "number",
    "userId": "number",
    "rating": "number",
    "content": "string",
    "status": "string ('approved' atau 'pending')",
    "createdAt": "string (ISO Date)"
  }
}
```

### 1.2 Update Review
- **URL**: `/api/v1/reviews/:id` *(Ganti `:id` dengan Review ID)*
- **Method**: `PUT`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `rating` | `number` | No | 1 to 5 | Nilai rating baru |
| `content` | `string` | No | - | Teks ulasan baru |
*(Minimal salah satu field harus diisi)*

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Review updated successfully",
  "data": {
    "id": "number",
    "rating": "number",
    "content": "string"
  }
}
```

### 1.3 Delete Review
Hanya dapat dilakukan oleh User yang bersangkutan.
- **URL**: `/api/v1/reviews/:id` *(Ganti `:id` dengan Review ID)*
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Review deleted successfully",
  "data": null
}
```

---

## 2. Favorites (Koleksi Favorit)

### 2.1 Toggle Favorite (Add/Remove)
Jika tempat belum difavoritkan, API ini akan menambahkannya. Jika sudah, API ini akan menghapusnya (Toggle System).
- **URL**: `/api/v1/favorites/places/:id/favorite` *(Ganti `:id` dengan Place ID)*
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
Kosong (`{}` atau *Empty Body*).

#### Response (201 Created / 200 OK)
```json
{
  "success": true,
  "message": "string ('Added to favorites' OR 'Removed from favorites')",
  "data": null
}
```

### 2.2 Get User Favorites
Mendapatkan semua kafe yang pernah difavoritkan oleh user (berdasarkan token otentikasi).
- **URL**: `/api/v1/favorites`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Favorites retrieved",
  "data": [
    {
      "id": "number (Favorite ID)",
      "userId": "number",
      "placeId": "number",
      "createdAt": "string (ISO Date)",
      "place": {
        "id": "number",
        "name": "string",
        "address": "string",
        "avgRating": "number",
        "status": "string ('approved')"
      }
    }
  ]
}
```
