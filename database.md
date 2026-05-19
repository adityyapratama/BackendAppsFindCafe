BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'user',
  avatar_url text,
  phone varchar(30),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_approval_mode varchar(20) NOT NULL DEFAULT 'manual',
  review_approval_mode varchar(20) NOT NULL DEFAULT 'auto',
  photo_approval_mode varchar(20) NOT NULL DEFAULT 'manual',
  allow_user_place_submission boolean NOT NULL DEFAULT true,
  allow_user_reviews boolean NOT NULL DEFAULT true,
  updated_by bigint REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_place_approval_mode_check CHECK (place_approval_mode IN ('auto', 'manual', 'hybrid')),
  CONSTRAINT app_settings_review_approval_mode_check CHECK (review_approval_mode IN ('auto', 'manual', 'hybrid')),
  CONSTRAINT app_settings_photo_approval_mode_check CHECK (photo_approval_mode IN ('auto', 'manual', 'hybrid'))
);

CREATE TABLE IF NOT EXISTS categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(80) NOT NULL UNIQUE,
  slug varchar(100) NOT NULL UNIQUE,
  icon varchar(100),
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name varchar(80) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  type varchar(20) NOT NULL,
  icon varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tags_type_check CHECK (type IN ('facility', 'vibe', 'purpose', 'payment'))
);

CREATE TABLE IF NOT EXISTS places (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id bigint NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  submitted_by bigint REFERENCES users(id) ON DELETE SET NULL,
  approved_by bigint REFERENCES users(id) ON DELETE SET NULL,
  duplicate_of_place_id bigint REFERENCES places(id) ON DELETE SET NULL,
  name varchar(150) NOT NULL,
  slug varchar(180) NOT NULL UNIQUE,
  description text,
  address text NOT NULL,
  district varchar(100),
  subdistrict varchar(100),
  city varchar(100) NOT NULL DEFAULT 'Surabaya',
  postal_code varchar(20),
  latitude decimal(10,7) NOT NULL,
  longitude decimal(10,7) NOT NULL,
  map_pin_verified boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz,
  price_min int,
  price_max int,
  phone varchar(30),
  website_url text,
  instagram_url text,
  google_maps_url text,
  cover_photo_url text,
  avg_rating decimal(3,2) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  favorite_count int NOT NULL DEFAULT 0,
  recommendation_count int NOT NULL DEFAULT 0,
  report_count int NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'pending',
  approved_via varchar(20),
  rejection_reason text,
  is_permanently_closed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT places_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  CONSTRAINT places_approved_via_check CHECK (approved_via IN ('auto', 'manual')),
  CONSTRAINT places_latitude_valid CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT places_longitude_valid CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT places_price_min_valid CHECK (price_min IS NULL OR price_min >= 0),
  CONSTRAINT places_price_max_valid CHECK (price_max IS NULL OR price_max >= 0),
  CONSTRAINT places_price_range_valid CHECK (price_min IS NULL OR price_max IS NULL OR price_max >= price_min),
  CONSTRAINT places_avg_rating_valid CHECK (avg_rating BETWEEN 0 AND 5),
  CONSTRAINT places_rating_count_valid CHECK (rating_count >= 0),
  CONSTRAINT places_favorite_count_valid CHECK (favorite_count >= 0),
  CONSTRAINT places_recommendation_count_valid CHECK (recommendation_count >= 0),
  CONSTRAINT places_report_count_valid CHECK (report_count >= 0)
);

CREATE TABLE IF NOT EXISTS place_tags (
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  tag_id bigint NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (place_id, tag_id)
);

CREATE TABLE IF NOT EXISTS opening_hours (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  day_of_week int NOT NULL,
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  is_24_hours boolean NOT NULL DEFAULT false,
  spans_next_day boolean NOT NULL DEFAULT false,
  note varchar(150),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opening_hours_day_valid CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT opening_hours_not_closed_and_24h CHECK (NOT (is_closed AND is_24_hours)),
  CONSTRAINT opening_hours_time_required CHECK (
    is_closed OR is_24_hours OR (open_time IS NOT NULL AND close_time IS NOT NULL)
  ),
  UNIQUE (place_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS place_photos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  uploaded_by bigint REFERENCES users(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  storage_path text,
  caption varchar(150),
  is_cover boolean NOT NULL DEFAULT false,
  status varchar(20) NOT NULL DEFAULT 'pending',
  approved_by bigint REFERENCES users(id) ON DELETE SET NULL,
  approved_via varchar(20),
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT place_photos_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  CONSTRAINT place_photos_approved_via_check CHECK (approved_via IN ('auto', 'manual'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating int NOT NULL,
  comment text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  approved_by bigint REFERENCES users(id) ON DELETE SET NULL,
  approved_via varchar(20),
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_valid CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  CONSTRAINT reviews_approved_via_check CHECK (approved_via IN ('auto', 'manual')),
  UNIQUE (place_id, user_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS place_recommendations (
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, place_id)
);

CREATE TABLE IF NOT EXISTS place_edit_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  submitted_by bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_data jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  reviewed_by bigint REFERENCES users(id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT place_edit_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'archived'))
);

CREATE TABLE IF NOT EXISTS reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  place_id bigint NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  reported_by bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_type varchar(30) NOT NULL,
  description text,
  status varchar(20) NOT NULL DEFAULT 'open',
  resolved_by bigint REFERENCES users(id) ON DELETE SET NULL,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT reports_reason_type_check CHECK (
    reason_type IN ('wrong_location', 'closed', 'duplicate', 'inappropriate', 'wrong_information', 'other')
  ),
  CONSTRAINT reports_status_check CHECK (status IN ('open', 'reviewed', 'resolved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  admin_id bigint REFERENCES users(id) ON DELETE SET NULL,
  target_type varchar(30) NOT NULL,
  target_id bigint NOT NULL,
  action varchar(30) NOT NULL,
  note text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT moderation_logs_target_type_check CHECK (
    target_type IN ('place', 'photo', 'review', 'edit_request', 'report', 'setting', 'user')
  ),
  CONSTRAINT moderation_logs_action_check CHECK (
    action IN ('approve', 'reject', 'archive', 'restore', 'update', 'update_setting', 'resolve_report')
  )
);

COMMIT;