# Authentication API

Panduan ini mendeskripsikan spesifikasi teknis untuk autentikasi dan manajemen sesi. Semua endpoint mengembalikan format standar (Joi Validation).

## 1. Register User Baru
Mendaftarkan pengguna reguler ke dalam sistem.

- **URL**: `/api/v1/auth/register`
- **Method**: `POST`
- **Auth Required**: No

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | Yes | Min 2, Max 100 chars | Nama lengkap pengguna |
| `email` | `string` | Yes | Valid email | Email unik pengguna |
| `password` | `string` | Yes | Min 8, max 128 chars, harus mengandung huruf besar, huruf kecil, dan angka | Kata sandi |
| `phone` | `string` | No | Max 30 chars, hanya digit/`+`/`-`/spasi/`()` | Nomor telepon |

**Contoh Payload**:
```json
{
  "name": "Budi Santoso",
  "email": "budi@test.com",
  "password": "Password123"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string ('user')",
    "token": "string (JWT Access Token)",
    "refreshToken": "string (JWT Refresh Token)"
  }
}
```

---

## 2. Login
Melakukan autentikasi dan mendapatkan pasangan *Access Token* dan *Refresh Token*.

- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Auth Required**: No

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | `string` | Yes | Valid email format | Email yang terdaftar |
| `password` | `string` | Yes | - | Kata sandi |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "string (JWT Access Token, berlaku 15 menit)",
    "refreshToken": "string (JWT Refresh Token, berlaku 7 hari)",
    "user": {
      "id": "number",
      "name": "string",
      "email": "string",
      "role": "string ('admin' | 'user')"
    }
  }
}
```

---

## 3. Refresh Token
Menukar `refreshToken` yang masih valid dengan pasangan *access token* + *refresh token* baru. *Refresh token* lama otomatis di-*revoke* (rotasi token).

- **URL**: `/api/v1/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `refreshToken` | `string` | Yes | - | Refresh token yang diterima saat login/register |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "token": "string (JWT Access Token baru)",
    "refreshToken": "string (JWT Refresh Token baru)"
  }
}
```

### Response (401 Unauthorized)
Dikembalikan jika token tidak ditemukan, sudah di-*revoke*, atau sudah *expired*.

---

## 4. Get Current User Profile (Me)
Mendapatkan data profil dari token yang sedang aktif.

- **URL**: `/api/v1/auth/me`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Response (200 OK)
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string",
    "phone": "string | null",
    "avatarUrl": "string | null",
    "isActive": "boolean",
    "createdAt": "string (ISO 8601 Date)"
  }
}
```

---

## 5. Update Profile
Mengubah data profil milik user yang sedang login (nama, telepon, dan/atau URL avatar). Email dan password tidak dapat diubah lewat endpoint ini.

- **URL**: `/api/v1/auth/profile`
- **Method**: `PUT`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Request Body
*(Minimal satu field harus diisi)*

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | `string` | No | Min 2, Max 100 chars | Nama lengkap baru |
| `phone` | `string` | No | Max 30 chars | Nomor telepon baru |
| `avatarUrl` | `string` | No | Valid URI | URL foto profil baru |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": "number",
    "name": "string",
    "email": "string",
    "role": "string",
    "phone": "string | null",
    "avatarUrl": "string | null",
    "updatedAt": "string (ISO 8601 Date)"
  }
}
```

---

## 6. Logout
Menghapus sesi dengan mencabut (revoke) `refreshToken`.

- **URL**: `/api/v1/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <access_token>`)

### Request Body
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `refreshToken` | `string` | Yes | - | Refresh token yang diterima saat login |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```
