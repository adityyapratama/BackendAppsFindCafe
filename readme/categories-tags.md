# Categories & Tags API

Panduan endpoint untuk mengambil data referensi / master data yang dikonfigurasi oleh Admin. Semua *response* pada modul ini di-*cache* (TTL 1 Jam) menggunakan NodeCache.

## 1. Get All Categories
Mengambil seluruh kategori yang berstatus `isActive: true` dengan pengurutan berdasarkan kolom `sortOrder` (ASC).

- **URL**: `/api/v1/categories`
- **Method**: `GET`
- **Auth Required**: No

### Response (200 OK)
```json
{
  "success": true,
  "message": "Categories retrieved",
  "data": [
    {
      "id": "number",
      "name": "string (Contoh: Cafe)",
      "slug": "string (Contoh: cafe)",
      "icon": "string | null (Contoh: fas fa-coffee)",
      "sortOrder": "number",
      "isActive": "boolean"
    }
  ]
}
```

---

## 2. Get All Tags
Mengambil seluruh fasilitas/tag yang berstatus `isActive: true`.

- **URL**: `/api/v1/tags`
- **Method**: `GET`
- **Auth Required**: No
- **Query Params**:
  - `type` (string, opsional): Memfilter berdasarkan kolom `type`.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Tags retrieved",
  "data": [
    {
      "id": "number",
      "name": "string (Contoh: WiFi Cepat)",
      "slug": "string (Contoh: wifi-cepat)",
      "icon": "string | null (Contoh: fas fa-wifi)",
      "type": "string | null",
      "isActive": "boolean"
    }
  ]
}
```
