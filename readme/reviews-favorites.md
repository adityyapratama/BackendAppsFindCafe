# Reviews & Favorites API

Panduan interaksi berbasis User terkait rating, ulasan, dan koleksi tempat favorit.

## 1. Reviews (Ulasan & Rating)

Sistem akan otomatis menghitung ulang nilai kolom `avgRating` dan `ratingCount` pada tabel `places` di latar belakang setiap kali terdapat *Insert/Update/Delete* review yang berstatus `approved`. Satu user hanya bisa membuat satu review per tempat (`@@unique([placeId, userId])`).

### 1.1 Tambah Review Baru
- **URL**: `/api/v1/places/:id/reviews` *(Ganti `:id` dengan Place ID)*
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `rating` | `number` | Yes | 1 to 5 | Nilai rating bintang (Integer) |
| `comment` | `string` | No | - | Teks ulasan atau komentar user |

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Review created",
  "data": {
    "id": "number (Review ID)",
    "placeId": "number",
    "userId": "number",
    "rating": "number",
    "comment": "string | null",
    "status": "string ('approved' atau 'pending', tergantung reviewApprovalMode — default 'auto')",
    "createdAt": "string (ISO Date)"
  }
}
```

### 1.2 Update Review
Memakai schema validasi yang sama dengan create, sehingga `rating` tetap wajib diisi saat update.

- **URL**: `/api/v1/reviews/:id` *(Ganti `:id` dengan Review ID)*
- **Method**: `PUT`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`, hanya pemilik review)

#### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `rating` | `number` | Yes | 1 to 5 | Nilai rating baru |
| `comment` | `string` | No | - | Teks ulasan baru |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Review updated",
  "data": {
    "id": "number",
    "rating": "number",
    "comment": "string | null"
  }
}
```

#### Response (403 Forbidden)
Dikembalikan jika `id` review bukan milik user yang sedang login.

### 1.3 Delete Review
Hanya dapat dilakukan oleh User yang bersangkutan.
- **URL**: `/api/v1/reviews/:id` *(Ganti `:id` dengan Review ID)*
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Review deleted",
  "data": null
}
```

---

## 2. Favorites (Koleksi Favorit)

### 2.1 Add Favorite
Menambahkan tempat ke koleksi favorit. **Bukan** *toggle* — ini adalah endpoint terpisah dari hapus favorit (lihat 2.2). Mengembalikan error `409 Conflict` jika tempat sudah ada di favorit.

- **URL**: `/api/v1/favorites/places/:id/favorite` *(Ganti `:id` dengan Place ID)*
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
Kosong (`{}` atau *Empty Body*).

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Added to favorites",
  "data": null
}
```

### 2.2 Remove Favorite
Menghapus tempat dari koleksi favorit.

- **URL**: `/api/v1/favorites/places/:id/favorite` *(Ganti `:id` dengan Place ID)*
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Removed from favorites",
  "data": null
}
```

### 2.3 Get User Favorites
Mendapatkan semua kafe yang pernah difavoritkan oleh user (berdasarkan token otentikasi), dengan *pagination*. `Favorite` tidak punya `id` sendiri — kunci uniknya adalah kombinasi `userId` + `placeId`.

- **URL**: `/api/v1/favorites`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | `number` | No | `1` | Halaman data |
| `limit` | `number` | No | `10` | Jumlah data per halaman |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Favorites retrieved",
  "data": [
    {
      "userId": "number",
      "placeId": "number",
      "createdAt": "string (ISO Date)",
      "place": {
        "id": "number",
        "name": "string",
        "address": "string",
        "avgRating": "number",
        "status": "string",
        "category": { "name": "string", "slug": "string" }
      }
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

## 3. Recommendations (Rekomendasi)

Sistem rekomendasi terpisah dari favorit — user dapat merekomendasikan tempat (mis. "saya rekomendasikan tempat ini ke orang lain") tanpa harus memfavoritkannya. Jumlah rekomendasi tersimpan di `Place.recommendationCount` dan bisa dipakai untuk `sort=recommended` pada `GET /places` (lihat `readme/places.md`).

### 3.1 Recommend Place
Menambahkan rekomendasi untuk sebuah tempat. Mengembalikan error `409 Conflict` jika user sudah pernah merekomendasikan tempat tersebut sebelumnya.

- **URL**: `/api/v1/recommendations/places/:id/recommend` *(Ganti `:id` dengan Place ID)*
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Request Body
Kosong (`{}` atau *Empty Body*).

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Place recommended",
  "data": null
}
```

### 3.2 Unrecommend Place
Membatalkan rekomendasi yang pernah dibuat user untuk tempat tersebut.

- **URL**: `/api/v1/recommendations/places/:id/recommend` *(Ganti `:id` dengan Place ID)*
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Recommendation removed",
  "data": null
}
```
