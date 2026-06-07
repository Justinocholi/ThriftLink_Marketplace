const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

async function seed() {
  const db = getDb();
  console.log('Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM analytics_events;
    DELETE FROM saved_items;
    DELETE FROM messages;
    DELETE FROM reviews;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM vendor_profiles;
    DELETE FROM users;
  `);

  const hash = (p) => bcrypt.hashSync(p, 10);

  // --- Users ---
  const adminId = uuidv4();
  const vendor1Id = uuidv4();
  const vendor2Id = uuidv4();
  const vendor3Id = uuidv4();
  const user1Id = uuidv4();
  const user2Id = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(adminId, 'admin@thriftlink.com', hash('admin123'), 'Admin User', 'admin', '08000000000', 'Lagos', 'Lagos Island');
  insertUser.run(vendor1Id, 'zara@thriftlink.com', hash('vendor123'), 'Zara Fashions', 'vendor', '08012345678', 'Lagos', 'Yaba');
  insertUser.run(vendor2Id, 'kemi@thriftlink.com', hash('vendor123'), 'Kemi Collections', 'vendor', '08098765432', 'Abuja', 'Wuse');
  insertUser.run(vendor3Id, 'tunde@thriftlink.com', hash('vendor123'), 'Tunde Electronics', 'vendor', '07011223344', 'Lagos', 'Ikeja');
  insertUser.run(user1Id, 'chioma@gmail.com', hash('user123'), 'Chioma Okeke', 'user', '08055667788', 'Lagos', 'Lekki');
  insertUser.run(user2Id, 'emeka@gmail.com', hash('user123'), 'Emeka Nwachukwu', 'user', '08033445566', 'Abuja', 'Garki');

  // --- Vendor Profiles ---
  const vp1Id = uuidv4();
  const vp2Id = uuidv4();
  const vp3Id = uuidv4();

  const insertVendor = db.prepare(`
    INSERT INTO vendor_profiles (id, user_id, shop_name, description, whatsapp_number, instagram_handle,
      category, state, city, is_verified, verification_status, subscription_plan,
      profile_views, whatsapp_clicks, rating, total_reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVendor.run(vp1Id, vendor1Id, 'Zara Thrift Store',
    'Your go-to for premium UK and US thrift wears at affordable prices. We specialise in women fashion, shoes, and accessories.',
    '+2348012345678', '@zarathrift', 'Fashion & Clothing', 'Lagos', 'Yaba', 1, 'approved', 'pro', 1240, 387, 4.8, 42);

  insertVendor.run(vp2Id, vendor2Id, "Kemi's Collections",
    'Quality thrift items for the whole family. Clothes, household items, and more. Based in Abuja, nationwide delivery available.',
    '+2348098765432', '@kemicollections', 'Fashion & Clothing', 'Abuja', 'Wuse', 1, 'approved', 'basic', 760, 203, 4.5, 28);

  insertVendor.run(vp3Id, vendor3Id, 'Tunde Electronics Hub',
    'Fairly-used laptops, phones, and electronics from trusted UK/US sources. All items tested and certified working.',
    '+2347011223344', '@tundetech', 'Electronics', 'Lagos', 'Ikeja', 1, 'approved', 'pro', 2100, 540, 4.7, 61);

  // --- Products ---
  const insertProduct = db.prepare(`
    INSERT INTO products (id, vendor_id, name, description, price, original_price, category, condition, images, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = uuidv4(); const p2 = uuidv4(); const p3 = uuidv4();
  const p4 = uuidv4(); const p5 = uuidv4(); const p6 = uuidv4();
  const p7 = uuidv4(); const p8 = uuidv4();

  insertProduct.run(p1, vp1Id, 'Designer Summer Dress', 'Beautiful floral summer dress, UK brand, barely worn. Size 12 (fits 10-12).', 8500, 35000, 'Fashion & Clothing', 'like-new', JSON.stringify(['https://via.placeholder.com/400x400?text=Summer+Dress']), 1);
  insertProduct.run(p2, vp1Id, 'Leather Handbag', 'Genuine leather crossbody bag, dark brown. Excellent condition, no scratches.', 12000, 55000, 'Fashion & Clothing', 'like-new', JSON.stringify(['https://via.placeholder.com/400x400?text=Leather+Bag']), 1);
  insertProduct.run(p3, vp1Id, 'Nike Sneakers Size 40', 'Authentic Nike Air Max, size 40. Used twice. Original box included.', 18000, 75000, 'Shoes & Footwear', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=Nike+Sneakers']), 1);

  insertProduct.run(p4, vp2Id, 'Kids Winter Jacket', 'Warm padded jacket for kids age 5-7. Zara brand, excellent condition.', 5500, 22000, 'Fashion & Clothing', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=Kids+Jacket']), 1);
  insertProduct.run(p5, vp2Id, 'Men\'s Polo Shirts (3 pack)', 'Three polo shirts in great condition. Sizes M and L available. Mixed colours.', 7000, 30000, 'Fashion & Clothing', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=Polo+Shirts']), 1);

  insertProduct.run(p6, vp3Id, 'MacBook Air M1 2020', '8GB RAM, 256GB SSD. Battery health 91%. Comes with charger. UK-cleared.', 380000, 750000, 'Electronics', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=MacBook+Air']), 1);
  insertProduct.run(p7, vp3Id, 'iPhone 12 Pro Max 256GB', 'Pacific Blue, 256GB. Battery 87%. Face ID working perfectly. Comes with cable.', 220000, 500000, 'Electronics', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=iPhone+12']), 1);
  insertProduct.run(p8, vp3Id, 'Samsung 4K Smart TV 43"', '43-inch Samsung Crystal UHD TV. Remote and stand included. Works perfectly.', 145000, 300000, 'Electronics', 'good', JSON.stringify(['https://via.placeholder.com/400x400?text=Samsung+TV']), 1);

  // --- Reviews ---
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, vendor_id, user_id, rating, comment, is_approved)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(uuidv4(), vp1Id, user1Id, 5, 'Absolutely love the quality! Got a dress and it was exactly as described. Fast delivery too.', 1);
  insertReview.run(uuidv4(), vp1Id, user2Id, 5, 'Zara is the real deal. Bought sneakers and they were authentic. Will definitely buy again!', 1);
  insertReview.run(uuidv4(), vp2Id, user1Id, 4, 'Good quality items. Kemi was very responsive on WhatsApp. Recommend!', 1);
  insertReview.run(uuidv4(), vp3Id, user1Id, 5, 'Got a MacBook from Tunde and it works perfectly. Honest seller!', 1);
  insertReview.run(uuidv4(), vp3Id, user2Id, 4, 'iPhone was great value. Small scratch on the back but price reflected that. Happy customer.', 1);

  // --- Orders ---
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, vendor_id, status, total_amount, shipping_address, phone, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
    VALUES (?, ?, ?, ?, ?)
  `);

  const o1Id = uuidv4();
  insertOrder.run(o1Id, user1Id, vp1Id, 'delivered', 8500, 'Lekki Phase 1, Lagos', '08055667788', 'Bank Transfer');
  insertOrderItem.run(uuidv4(), o1Id, p1, 1, 8500);

  const o2Id = uuidv4();
  insertOrder.run(o2Id, user1Id, vp3Id, 'shipped', 220000, 'Lekki Phase 1, Lagos', '08055667788', 'Card');
  insertOrderItem.run(uuidv4(), o2Id, p7, 1, 220000);

  const o3Id = uuidv4();
  insertOrder.run(o3Id, user2Id, vp2Id, 'confirmed', 5500, 'Garki Area 2, Abuja', '08033445566', 'Cash on Delivery');
  insertOrderItem.run(uuidv4(), o3Id, p4, 1, 5500);

  // --- Saved items ---
  const insertSaved = db.prepare(`
    INSERT INTO saved_items (id, user_id, vendor_id, product_id) VALUES (?, ?, ?, ?)
  `);

  insertSaved.run(uuidv4(), user1Id, vp3Id, p6);
  insertSaved.run(uuidv4(), user1Id, vp1Id, p2);

  // --- Messages ---
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)
  `);

  insertMsg.run(uuidv4(), user1Id, vendor1Id, 'Hi! Is the summer dress still available?');
  insertMsg.run(uuidv4(), vendor1Id, user1Id, 'Yes it is! Would you like more photos?');
  insertMsg.run(uuidv4(), user1Id, vendor1Id, 'Yes please, and what\'s the final price?');

  console.log('Database seeded successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:  admin@thriftlink.com / admin123');
  console.log('  Vendor: zara@thriftlink.com / vendor123');
  console.log('  User:   chioma@gmail.com / user123');
}

seed().catch(console.error);
