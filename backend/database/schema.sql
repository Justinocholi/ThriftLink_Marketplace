-- Thrift-Link Database Schema

-- Users table (buyers, vendors, admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  supabase_user_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'vendor', 'admin')),
  phone TEXT,
  avatar TEXT,
  state TEXT,
  city TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Vendor profiles (extends users with vendor-specific data)
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  description TEXT,
  whatsapp_number TEXT NOT NULL,
  instagram_handle TEXT,
  category TEXT,
  state TEXT,
  city TEXT,
  logo TEXT,
  banner TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'approved', 'rejected')),
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK(subscription_plan IN ('free', 'basic', 'pro')),
  subscription_expires_at TEXT,
  profile_views INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  original_price REAL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'good' CHECK(condition IN ('new', 'like-new', 'good', 'fair')),
  images TEXT NOT NULL DEFAULT '[]',
  stock_quantity INTEGER NOT NULL DEFAULT 1,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  boost_expires_at TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cart items table (for persisted cart)
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  total_amount REAL NOT NULL,
  shipping_address TEXT,
  phone TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Transactions table (for payment tracking/webhooks)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  transaction_ref TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL,
  payment_gateway TEXT DEFAULT 'paystack',
  raw_response TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'order_update', 'new_message', 'stock_alert', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  is_approved INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  image_url TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Saved items (user wishlist)
CREATE TABLE IF NOT EXISTS saved_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id TEXT REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- Vendor analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK(event_type IN ('profile_view', 'whatsapp_click', 'product_view')),
  product_id TEXT REFERENCES products(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_vendor ON analytics_events(vendor_id);

-- Reports table (for reporting scams/issues)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK(target_type IN ('product', 'vendor')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Vendor verification documents
CREATE TABLE IF NOT EXISTS verification_documents (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'national_id', 'passport', 'business_license'
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Manual subscription payment submissions (Moniepoint bank transfer)
CREATE TABLE IF NOT EXISTS subscription_payments (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount REAL NOT NULL,
  reference TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_vendor ON subscription_payments(vendor_id);
