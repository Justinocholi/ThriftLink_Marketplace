-- ThriftLink — Postgres schema (Supabase)
-- Ported from database/schema.sql (SQLite).
--
-- Design choices:
--   * Primary keys are `text` here, but the EXISTING Supabase project uses
--     `uuid` id/fk columns. The app generates UUID-v4 strings, which work as
--     both; PostgREST coerces, and the repos pass strings through.
--   * Flag columns are real `boolean` (is_active, is_verified, is_featured,
--     is_available, is_read, is_approved) — matching the live DB. The data
--     client (db/supabaseData.js) maps boolean<->0/1 so route/UI code that
--     expects 1/0 is unchanged.
--   * Money/ratings use `double precision` to mirror SQLite REAL.
--   * Timestamps use `timestamptz default now()`. NOTE: a couple of
--     frontend/date spots append 'Z' to SQLite's naive timestamps —
--     those must be adjusted when cutting over (see MIGRATION.md).
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists users (
  id text primary key,
  supabase_user_id text unique,
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('user','vendor','admin')),
  phone text,
  avatar text,
  state text,
  city text,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vendor_profiles (
  id text primary key,
  user_id text not null unique references users(id) on delete cascade,
  shop_name text not null,
  description text,
  whatsapp_number text not null,
  instagram_handle text,
  category text,
  state text,
  city text,
  logo text,
  banner text,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  featured_rank integer,
  verification_status text not null default 'pending' check (verification_status in ('pending','approved','rejected')),
  subscription_plan text not null default 'free' check (subscription_plan in ('free','basic','pro')),
  subscription_expires_at timestamptz,
  profile_views integer not null default 0,
  whatsapp_clicks integer not null default 0,
  rating double precision not null default 0,
  total_reviews integer not null default 0,
  -- KYC
  nin text,
  bvn text,
  business_name text,
  business_address text,
  business_registration_number text,
  id_document_type text,
  id_document_url text,
  kyc_submitted_at timestamptz,
  kyc_reviewed_at timestamptz,
  kyc_review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  vendor_id text not null references vendor_profiles(id) on delete cascade,
  name text not null,
  description text,
  price double precision not null,
  original_price double precision,
  category text not null,
  condition text not null default 'good' check (condition in ('new','like-new','good','fair')),
  images text not null default '[]',
  stock_quantity integer not null default 1,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  boost_expires_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists orders (
  id text primary key,
  user_id text not null references users(id),
  vendor_id text not null references vendor_profiles(id),
  status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_method text,
  payment_reference text,
  payment_confirmed_at timestamptz,
  payment_confirmed_by text,
  total_amount double precision not null,
  shipping_address text,
  phone text,
  tracking_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_status_history (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  status text not null check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  note text,
  changed_by_user_id text references users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_order_status_history_order on order_status_history(order_id, created_at);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  quantity integer not null default 1,
  price_at_purchase double precision not null,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  order_id text not null references orders(id),
  transaction_ref text unique not null,
  amount double precision not null,
  currency text default 'NGN',
  status text not null,
  payment_gateway text default 'paystack',
  raw_response text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  vendor_id text not null references vendor_profiles(id) on delete cascade,
  user_id text not null references users(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  sender_id text not null references users(id),
  receiver_id text not null references users(id),
  content text not null,
  image_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists saved_items (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  vendor_id text references vendor_profiles(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists analytics_events (
  id text primary key,
  vendor_id text not null references vendor_profiles(id) on delete cascade,
  event_type text not null check (event_type in ('profile_view','whatsapp_click','product_view')),
  product_id text references products(id),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  reporter_id text not null references users(id),
  target_type text not null check (target_type in ('product','vendor')),
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','investigating','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists verification_documents (
  id text primary key,
  vendor_id text not null references vendor_profiles(id) on delete cascade,
  document_type text not null,
  document_url text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists subscription_payments (
  id text primary key,
  vendor_id text not null references vendor_profiles(id) on delete cascade,
  plan text not null,
  amount double precision not null,
  reference text not null,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Idempotent column top-ups. The Supabase project may already contain an
-- OLDER version of these tables (created before KYC / featured / payment
-- fields existed). `create table if not exists` above will NOT alter an
-- existing table, so we add every post-original column explicitly here.
-- Safe to run repeatedly.
-- ---------------------------------------------------------------------------

-- users
alter table users add column if not exists reset_token_hash text;
alter table users add column if not exists reset_token_expires_at timestamptz;

-- vendor_profiles: featured + KYC
alter table vendor_profiles add column if not exists is_featured boolean not null default false;
alter table vendor_profiles add column if not exists featured_rank integer;
alter table vendor_profiles add column if not exists nin text;
alter table vendor_profiles add column if not exists bvn text;
alter table vendor_profiles add column if not exists business_name text;
alter table vendor_profiles add column if not exists business_address text;
alter table vendor_profiles add column if not exists business_registration_number text;
alter table vendor_profiles add column if not exists id_document_type text;
alter table vendor_profiles add column if not exists id_document_url text;
alter table vendor_profiles add column if not exists kyc_submitted_at timestamptz;
alter table vendor_profiles add column if not exists kyc_reviewed_at timestamptz;
alter table vendor_profiles add column if not exists kyc_review_notes text;

-- orders: manual payment fields
alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists payment_confirmed_at timestamptz;
alter table orders add column if not exists payment_confirmed_by text;

-- messages: image + read receipts
alter table messages add column if not exists image_url text;
alter table messages add column if not exists read_at timestamptz;

-- Indexes
create index if not exists idx_products_vendor on products(vendor_id);
create index if not exists idx_reviews_vendor on reviews(vendor_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_vendor on orders(vendor_id);
create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_saved_items_user on saved_items(user_id);
create index if not exists idx_analytics_vendor on analytics_events(vendor_id);
create index if not exists idx_subscription_payments_status on subscription_payments(status);
create index if not exists idx_subscription_payments_vendor on subscription_payments(vendor_id);

-- Hot-path composite / lookup indexes (audit follow-up).
create index if not exists idx_messages_thread on messages(sender_id, receiver_id, created_at);
create index if not exists idx_notifications_user_read on notifications(user_id, is_read);
create index if not exists idx_cart_items_user on cart_items(user_id);
create index if not exists idx_analytics_events_type_time on analytics_events(event_type, created_at);
create index if not exists idx_products_category_available on products(category, is_available);
create index if not exists idx_vendor_profiles_verification on vendor_profiles(verification_status);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_users_reset_token on users(reset_token_hash);

-- IMPORTANT: the backend talks to these tables with the service_role key,
-- which bypasses Row Level Security. We therefore do NOT enable RLS here.
-- The anon key is never used for table access from the server. If you ever
-- expose these tables to the browser directly, add RLS policies first.
