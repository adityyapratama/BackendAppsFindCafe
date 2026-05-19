# Cafe Surabaya Backend API

Backend API untuk aplikasi Cafe Surabaya - direktori dan rekomendasi cafe berbasis komunitas untuk area Surabaya.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend API | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |

## Struktur Folder

```
BackendAppsFindCafe/
├── prisma/
│   ├── schema.prisma       # Prisma schema
│   ├── seed.js             # Database seeder
│   └── migrations/         # Database migrations
├── src/
│   ├── config/
│   │   ├── prisma.js       # Prisma client configuration
│   │   └── database.js     # Database connection
│   ├── controllers/        # Request handlers
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── category.controller.js
│   │   ├── favorite.controller.js
│   │   ├── place.controller.js
│   │   ├── recommendation.controller.js
│   │   ├── review.controller.js
│   │   └── tag.controller.js
│   ├── middleware/         # Express middleware
│   │   ├── auth.js         # JWT authentication
│   │   ├── errorHandler.js # Error handling
│   │   ├── logger.js       # Request logging
│   │   └── validate.js     # Request validation
│   ├── routes/             # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── category.routes.js
│   │   ├── favorite.routes.js
│   │   ├── index.js        # Route index
│   │   ├── place.routes.js
│   │   ├── recommendation.routes.js
│   │   ├── review.routes.js
│   │   └── tag.routes.js
│   ├── utils/              # Utility functions
│   │   ├── bigIntToJson.js
│   │   └── response.js     # Response helpers
│   └── app.js              # Express app setup
├── .env                    # Environment variables
├── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
# Edit .env file dengan konfigurasi database Anda

# Generate Prisma client
npm run prisma:generate

# Push schema ke database
npm run prisma:push

# Seed database dengan data awal
npm run seed
```

### Development

```bash
# Run development server
npm run dev

# Run production server
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Environment Variables

```env
DATABASE_URL="postgres://user:password@host:port/database"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## API Endpoints

### Auth

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user baru |
| POST | `/api/auth/login` | Public | Login user/admin |
| GET | `/api/auth/me` | User | Ambil profil user login |
| POST | `/api/auth/logout` | User | Logout user |

### Master Data

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/categories` | Public | Ambil daftar kategori |
| GET | `/api/tags` | Public | Ambil daftar tag |

### Places

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/places` | Public | Ambil daftar cafe approved |
| GET | `/api/places/:id` | Public | Ambil detail cafe |
| POST | `/api/places` | User | Submit rekomendasi cafe baru |
| POST | `/api/places/:id/photos` | User | Upload foto cafe |
| POST | `/api/places/:id/edit-requests` | User | Ajukan perubahan data cafe |
| POST | `/api/places/:id/reports` | User | Laporkan data cafe yang salah |

### Favorites

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/favorites` | User | Ambil daftar cafe favorit |
| POST | `/api/places/:id/favorite` | User | Tambah cafe ke favorit |
| DELETE | `/api/places/:id/favorite` | User | Hapus cafe dari favorit |

### Recommendations

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/places/:id/recommend` | User | Rekomendasikan cafe |
| DELETE | `/api/places/:id/recommend` | User | Batalkan rekomendasi |

### Reviews

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/places/:id/reviews` | Public | Ambil review cafe |
| POST | `/api/places/:id/reviews` | User | Tambah review cafe |
| PUT | `/api/reviews/:id` | User | Update review |
| DELETE | `/api/reviews/:id` | User | Hapus review |

### Admin

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/admin/settings` | Admin | Ambil pengaturan aplikasi |
| PUT | `/api/admin/settings` | Admin | Update pengaturan |
| GET | `/api/admin/places` | Admin | Ambil semua cafe |
| GET | `/api/admin/places/:id` | Admin | Detail cafe |
| PATCH | `/api/admin/places/:id/approve` | Admin | Approve cafe |
| PATCH | `/api/admin/places/:id/reject` | Admin | Reject cafe |
| PATCH | `/api/admin/places/:id/archive` | Admin | Arsip cafe |
| PATCH | `/api/admin/places/:id/restore` | Admin | Restore cafe |
| GET | `/api/admin/reports` | Admin | Ambil laporan |
| PATCH | `/api/admin/reports/:id/resolve` | Admin | Selesaikan laporan |
| GET | `/api/admin/edit-requests` | Admin | Ambil pengajuan edit |
| PATCH | `/api/admin/edit-requests/:id/approve` | Admin | Approve edit |
| PATCH | `/api/admin/edit-requests/:id/reject` | Admin | Reject edit |
| GET | `/api/admin/reviews` | Admin | Ambil review |
| PATCH | `/api/admin/reviews/:id/approve` | Admin | Approve review |
| PATCH | `/api/admin/reviews/:id/reject` | Admin | Reject review |
| GET | `/api/admin/photos` | Admin | Ambil foto |
| PATCH | `/api/admin/photos/:id/approve` | Admin | Approve foto |
| PATCH | `/api/admin/photos/:id/reject` | Admin | Reject foto |
| GET | `/api/admin/moderation-logs` | Admin | Riwayat moderation |

## Response Format

### Success

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {},
  "meta": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "field": ["Error message"]
  }
}
```

## Default Admin Account

Setelah menjalankan seed, gunakan akun berikut untuk login sebagai admin:

- Email: `admin@cafesurabaya.com`
- Password: `admin123`

## Scripts

| Command | Deskripsi |
|---|---|
| `npm start` | Run production server |
| `npm run dev` | Run development server with nodemon |
| `npm run seed` | Seed database |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio |
