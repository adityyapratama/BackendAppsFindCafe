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
| `password` | `string` | Yes | Min 6 chars | Kata sandi |

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

## 3. Get Current User Profile (Me)
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

## 4. Logout
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
