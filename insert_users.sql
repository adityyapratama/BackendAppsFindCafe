-- Catatan: Pada desain database yang ada, `role` bukan berupa tabel terpisah.
-- Role disimpan sebagai kolom tipe VARCHAR di dalam tabel `users` dengan constraint CHECK:
-- role IN ('user', 'admin', 'super_admin')

-- Berikut adalah query INSERT untuk menambahkan beberapa user dengan berbagai role.
-- Semua password sudah di-hash menggunakan bcrypt dengan salt rounds = 10.

INSERT INTO users (
    name, 
    email, 
    password_hash, 
    role, 
    phone, 
    is_active, 
    created_at, 
    updated_at
) VALUES 
(
    'Super Admin', 
    'superadmin@cafesurabaya.com', 
    '$2b$10$D9kI6dZ9M2Md6zn/fhdjYuQO698gHhQ2NAV4ApBUyhGZlQlTi3JyO', -- Password: superadmin123
    'super_admin', 
    '081111111111', 
    true, 
    NOW(), 
    NOW()
),
(
    'Admin Aplikasi', 
    'admin2@cafesurabaya.com', 
    '$2b$10$ZCab79V956kSFSX9zk7FmuIXDzf.A.zdQ5x34cCMRNnar5uPeyPzy', -- Password: admin123
    'admin', 
    '082222222222', 
    true, 
    NOW(), 
    NOW()
),
(
    'Budi Santoso (User)', 
    'budi@example.com', 
    '$2b$10$3ZWs5rXBmZha/7SqIHkbJuwjivjq3HTW2W7TisGPSY/XPOfwejC.G', -- Password: user123
    'user', 
    '083333333333', 
    true, 
    NOW(), 
    NOW()
);
