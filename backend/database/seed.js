const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

async function seed() {
  const db = getDb();
  console.log('Seeding database with real thrift vendors...');

  // Clear existing data
  db.exec(`
    DELETE FROM recommendation_impressions;
    DELETE FROM vendor_interactions;
    DELETE FROM user_interests;
    DELETE FROM vendor_follows;
    DELETE FROM vendor_referrals;
    DELETE FROM analytics_events;
    DELETE FROM saved_items;
    DELETE FROM messages;
    DELETE FROM reviews;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM vendor_profiles;
    DELETE FROM users;
  `);

  const hash = (p) => bcrypt.hashSync(p, 10);

  // --- Users ---
  const adminId = uuidv4();
  const julesUserId = uuidv4();
  const vintageUserId = uuidv4();
  const soleUserId = uuidv4();
  const graceUserId = uuidv4();
  const vendor1Id = uuidv4(); // Zara (kept for test compatibility)
  const vendor2Id = uuidv4(); // Kemi (kept for test compatibility)
  const vendor3Id = uuidv4(); // Tunde (kept for test compatibility)
  const user1Id = uuidv4();
  const user2Id = uuidv4();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(adminId, 'admin@thriftlink.com', hash('admin123'), 'Admin User', 'admin', '08000000000', 'Lagos', 'Lagos Island');
  insertUser.run(julesUserId, 'jules@thriftlink.com', hash('vendor123'), 'Jules Bags', 'vendor', '08034567890', 'Lagos', 'Ikeja');
  insertUser.run(vintageUserId, 'vintagevault@thriftlink.com', hash('vendor123'), 'Vintage Vault NG', 'vendor', '08012345678', 'Lagos', 'Yaba');
  insertUser.run(soleUserId, 'soleplug@thriftlink.com', hash('vendor123'), 'SolePlug Thrift', 'vendor', '08098765432', 'Abuja', 'Wuse');
  insertUser.run(graceUserId, 'grace@thriftlink.com', hash('vendor123'), 'Grace Thrift Hub', 'vendor', '07011223344', 'Lagos', 'Surulere');
  insertUser.run(vendor1Id, 'zara@thriftlink.com', hash('vendor123'), 'Zara Fashions', 'vendor', '08012345679', 'Lagos', 'Yaba');
  insertUser.run(vendor2Id, 'kemi@thriftlink.com', hash('vendor123'), 'Kemi Collections', 'vendor', '08098765433', 'Abuja', 'Wuse');
  insertUser.run(vendor3Id, 'tunde@thriftlink.com', hash('vendor123'), 'Tunde Electronics', 'vendor', '07011223345', 'Lagos', 'Ikeja');
  insertUser.run(user1Id, 'chioma@gmail.com', hash('user123'), 'Chioma Okeke', 'user', '08055667788', 'Lagos', 'Lekki');
  insertUser.run(user2Id, 'emeka@gmail.com', hash('user123'), 'Emeka Nwachukwu', 'user', '08033445566', 'Abuja', 'Garki');

  // --- Vendor Profiles ---
  const julesVpId = uuidv4();
  const vintageVpId = uuidv4();
  const soleVpId = uuidv4();
  const graceVpId = uuidv4();
  const vp1Id = uuidv4();
  const vp2Id = uuidv4();
  const vp3Id = uuidv4();

  const insertVendor = db.prepare(`
    INSERT INTO vendor_profiles (id, user_id, shop_name, description, whatsapp_number, instagram_handle,
      category, state, city, logo, banner, is_verified, is_featured, featured_rank, verification_status, subscription_plan,
      profile_views, whatsapp_clicks, rating, total_reviews, referral_code, catalog_updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  // Jules Bag Store — premier verified real handbag vendor
  insertVendor.run(
    julesVpId, julesUserId, 'Jules Bag Store',
    'Curated luxury vintage & pre-loved designer handbags, structured shoulder bags, and authentic thrift leather totes sourced from Europe. All bags conditioned and 100% genuine thrift finds.',
    '+2348034567890', '@julesbagstore', 'Bags & Accessories', 'Lagos', 'Ikeja',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    1, 1, 1, 'approved', 'pro',
    3480, 920, 4.9, 58, 'TL-JULES-BAGS'
  );

  // Vintage Vault NG — verified streetwear & clothing vendor
  insertVendor.run(
    vintageVpId, vintageUserId, 'Vintage Vault NG',
    'Hand-picked UK and US thrift fashion. Authentic vintage streetwear, graphic tees, denim jackets, and aesthetic 90s pieces for everyday styling.',
    '+2348012345678', '@vintagevaultng', 'Fashion & Clothing', 'Lagos', 'Yaba',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=1200&auto=format&fit=crop&q=80',
    1, 1, 2, 'approved', 'pro',
    2150, 540, 4.8, 42, 'TL-VINTAGE-VAULT'
  );

  // SolePlug Thrift — verified thrift footwear vendor
  insertVendor.run(
    soleVpId, soleUserId, 'SolePlug Thrift',
    'Authentic pre-loved sneakers, chunky sole oxfords, retro running shoes, and vintage leather footwear. Cleaned, disinfected, and ready to wear.',
    '+2348098765432', '@soleplugthrift', 'Shoes & Footwear', 'Abuja', 'Wuse',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&auto=format&fit=crop&q=80',
    1, 0, null, 'approved', 'basic',
    1780, 430, 4.7, 35, 'TL-SOLE-PLUG'
  );

  // Grace Thrift Hub — unverified vendor (pending KYC verification, capped at 3 listings)
  insertVendor.run(
    graceVpId, graceUserId, 'Grace Thrift Hub',
    'Affordable student friendly thrift clothes and casual everyday wears in Lagos mainland.',
    '+2347011223344', '@gracethrifthub', 'Fashion & Clothing', 'Lagos', 'Surulere',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    null,
    0, 0, null, 'pending', 'free',
    320, 65, 4.2, 8, 'TL-GRACE-HUB'
  );

  // Legacy vendors (kept for backward compatibility with tests)
  insertVendor.run(vp1Id, vendor1Id, 'Zara Thrift Store',
    'Your go-to for premium UK and US thrift wears at affordable prices. Women fashion, shoes, and accessories.',
    '+2348012345679', '@zarathrift', 'Fashion & Clothing', 'Lagos', 'Yaba',
    null, null, 1, 0, null, 'approved', 'pro', 1240, 387, 4.8, 42, 'TL-ZARA-STORE');

  insertVendor.run(vp2Id, vendor2Id, "Kemi's Collections",
    'Quality thrift items for the whole family. Clothes, household items, and more. Based in Abuja, nationwide delivery available.',
    '+2348098765433', '@kemicollections', 'Fashion & Clothing', 'Abuja', 'Wuse',
    null, null, 1, 0, null, 'approved', 'basic', 760, 203, 4.5, 28, 'TL-KEMI-SHOP');

  insertVendor.run(vp3Id, vendor3Id, 'Tunde Electronics Hub',
    'Fairly-used laptops, phones, and electronics from trusted UK/US sources. All items tested and certified working.',
    '+2347011223345', '@tundetech', 'Electronics', 'Lagos', 'Ikeja',
    null, null, 1, 0, null, 'approved', 'pro', 2100, 540, 4.7, 61, 'TL-TUNDE-TECH');

  // --- Products ---
  const insertProduct = db.prepare(`
    INSERT INTO products (id, vendor_id, name, description, price, original_price, category, condition, images, is_available, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const now = Date.now();
  const timeAgo = (mins) => new Date(now - mins * 60 * 1000).toISOString();

  // Jules Bag Store's Handbags (Newest items, top of feed!)
  const pJules1 = uuidv4();
  const pJules2 = uuidv4();
  const pJules3 = uuidv4();
  const pJules4 = uuidv4();

  insertProduct.run(
    pJules1, julesVpId, 'Vintage Italian Leather Handbag',
    'Authentic Italian caramel-brown calfskin leather handbag with structured top handle and gold-tone turnlock clasp. Fully lined with zippered interior partition. Pristine thrift condition.',
    14500, 48000, 'Bags & Accessories', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80']),
    timeAgo(5), timeAgo(5)
  );

  insertProduct.run(
    pJules2, julesVpId, 'Classic Structured Shoulder Handbag',
    'Timeless jet-black structured shoulder handbag with brass accents and adjustable strap. Perfect evening and corporate wear luxury thrift piece.',
    12000, 38000, 'Bags & Accessories', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&auto=format&fit=crop&q=80']),
    timeAgo(20), timeAgo(20)
  );

  insertProduct.run(
    pJules3, julesVpId, 'Crossbody Pebble Leather Handbag',
    'Rich burgundy pebbled grain leather crossbody bag with dual slip pockets and heavy-duty brass zippers. Compact yet holds phone, purse, and daily makeup.',
    9500, 29000, 'Bags & Accessories', 'good',
    JSON.stringify(['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80']),
    timeAgo(45), timeAgo(45)
  );

  insertProduct.run(
    pJules4, julesVpId, 'Designer Monogram Canvas Tote Handbag',
    'Spacious vintage monogram tote handbag with reinforced leather straps. Generous interior fits a 13" laptop, notebooks, and day-to-day essentials.',
    18000, 65000, 'Bags & Accessories', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=700&auto=format&fit=crop&q=80']),
    timeAgo(90), timeAgo(90)
  );

  // Vintage Vault NG Products
  const pVv1 = uuidv4();
  const pVv2 = uuidv4();
  const pVv3 = uuidv4();

  insertProduct.run(
    pVv1, vintageVpId, '90s Oversized Retro Denim Jacket',
    'Washed blue denim trucker jacket with authentic fading. Sourced from vintage UK stock, heavy cotton build. Fits Medium to Large.',
    11500, 35000, 'Fashion & Clothing', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=700&auto=format&fit=crop&q=80']),
    timeAgo(120), timeAgo(120)
  );

  insertProduct.run(
    pVv2, vintageVpId, 'Vintage Heavyweight Graphic Band Tee',
    'Authentic faded black rock tour tee on a vintage heavyweight cotton blank. No rips, soft distressed collar.',
    6500, 22000, 'Fashion & Clothing', 'good',
    JSON.stringify(['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=700&auto=format&fit=crop&q=80']),
    timeAgo(180), timeAgo(180)
  );

  insertProduct.run(
    pVv3, vintageVpId, 'High-Waisted Vintage Corduroy Trousers',
    'Rich olive-green ribbed corduroy pants with straight leg cut. Clean hem, functioning zip fly, fits waist 30-32.',
    8000, 26000, 'Fashion & Clothing', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1475178626620-a4d074967452?w=700&auto=format&fit=crop&q=80']),
    timeAgo(240), timeAgo(240)
  );

  // SolePlug Thrift Products
  const pSp1 = uuidv4();
  const pSp2 = uuidv4();

  insertProduct.run(
    pSp1, soleVpId, 'Nike Air Max 90 Vintage White/Grey',
    'Classic Air Max 90 in crisp clean condition. Air bubble intact, minimal outsole wear. Size EU 42 (UK 8).',
    24000, 85000, 'Shoes & Footwear', 'like-new',
    JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80']),
    timeAgo(300), timeAgo(300)
  );

  insertProduct.run(
    pSp2, soleVpId, 'Chunky Sole Oxford Leather Loafers',
    'Polished dark brown leather lug-sole oxford shoes. Durable Vibram-style rubber sole, very comfortable.',
    16000, 52000, 'Shoes & Footwear', 'good',
    JSON.stringify(['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&auto=format&fit=crop&q=80']),
    timeAgo(360), timeAgo(360)
  );

  // Grace Thrift Hub Products (Unverified vendor, restricted preview)
  const pGh1 = uuidv4();
  const pGh2 = uuidv4();

  insertProduct.run(
    pGh1, graceVpId, 'Floral Smocked Summer Sundress',
    'Lightweight chiffon summer dress with ruffled sleeves and elastic smocked waist. Fits size 10-12.',
    4500, 14000, 'Fashion & Clothing', 'good',
    JSON.stringify(['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop&q=80']),
    timeAgo(420), timeAgo(420)
  );

  insertProduct.run(
    pGh2, graceVpId, 'Casual Knitted Pastel Cardigan',
    'Cozy pastel button-down knit cardigan. Soft acrylic blend, no pilling.',
    5000, 16000, 'Fashion & Clothing', 'good',
    JSON.stringify(['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=700&auto=format&fit=crop&q=80']),
    timeAgo(480), timeAgo(480)
  );

  // Legacy products (for test backwards-compat)
  const p1 = uuidv4(); const p2 = uuidv4(); const p3 = uuidv4();
  const p4 = uuidv4(); const p5 = uuidv4();
  const p6 = uuidv4(); const p7 = uuidv4(); const p8 = uuidv4();

  insertProduct.run(p1, vp1Id, 'Designer Summer Dress', 'Beautiful floral summer dress, UK brand, barely worn. Size 12.', 8500, 35000, 'Fashion & Clothing', 'like-new', JSON.stringify(['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&auto=format&fit=crop&q=80']), timeAgo(600), timeAgo(600));
  insertProduct.run(p2, vp1Id, 'Leather Crossbody Bag', 'Genuine leather crossbody bag, dark brown. Excellent condition.', 12000, 55000, 'Fashion & Clothing', 'like-new', JSON.stringify(['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80']), timeAgo(620), timeAgo(620));
  insertProduct.run(p3, vp1Id, 'Nike Sneakers Size 40', 'Authentic Nike Air Max, size 40. Used twice.', 18000, 75000, 'Shoes & Footwear', 'good', JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80']), timeAgo(640), timeAgo(640));

  insertProduct.run(p4, vp2Id, 'Kids Winter Jacket', 'Warm padded jacket for kids age 5-7. Zara brand.', 5500, 22000, 'Fashion & Clothing', 'good', JSON.stringify(['https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=700&auto=format&fit=crop&q=80']), timeAgo(700), timeAgo(700));
  insertProduct.run(p5, vp2Id, 'Men\'s Polo Shirts (3 pack)', 'Three polo shirts in great condition. Sizes M and L.', 7000, 30000, 'Fashion & Clothing', 'good', JSON.stringify(['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=700&auto=format&fit=crop&q=80']), timeAgo(720), timeAgo(720));

  insertProduct.run(p6, vp3Id, 'MacBook Air M1 2020', '8GB RAM, 256GB SSD. Battery health 91%. Comes with charger.', 380000, 750000, 'Electronics', 'good', JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=700&auto=format&fit=crop&q=80']), timeAgo(800), timeAgo(800));
  insertProduct.run(p7, vp3Id, 'iPhone 12 Pro Max 256GB', 'Pacific Blue, 256GB. Battery 87%. Face ID working.', 220000, 500000, 'Electronics', 'good', JSON.stringify(['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=700&auto=format&fit=crop&q=80']), timeAgo(820), timeAgo(820));
  insertProduct.run(p8, vp3Id, 'Samsung 4K Smart TV 43"', '43-inch Samsung Crystal UHD TV. Remote and stand included.', 145000, 300000, 'Electronics', 'good', JSON.stringify(['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=700&auto=format&fit=crop&q=80']), timeAgo(840), timeAgo(840));

  // --- Reviews ---
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, vendor_id, user_id, rating, comment, is_approved)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(uuidv4(), julesVpId, user1Id, 5, 'Jules is phenomenal! The Italian leather handbag arrived in flawless condition. The leather smelled fresh and looked brand new. 10/10 recommend!', 1);
  insertReview.run(uuidv4(), julesVpId, user2Id, 5, 'Got the shoulder bag for my sister. Jules responded promptly on WhatsApp and shipping to Abuja was fast. Authentic thrift gems!', 1);
  insertReview.run(uuidv4(), vintageVpId, user1Id, 5, 'The oversized denim jacket is easily my best thrift purchase this year. Heavyweight and authentic!', 1);
  insertReview.run(uuidv4(), soleVpId, user2Id, 5, 'SolePlug sneakers are 100% genuine. Clean sole and original laces.', 1);
  insertReview.run(uuidv4(), vp1Id, user1Id, 5, 'Great quality items and fast delivery.', 1);
  insertReview.run(uuidv4(), vp2Id, user1Id, 4, 'Kemi was very responsive on WhatsApp. Good items.', 1);
  insertReview.run(uuidv4(), vp3Id, user1Id, 5, 'Honest tech seller!', 1);

  // --- Orders ---
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, vendor_id, status, total_amount, shipping_address, phone, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
    VALUES (?, ?, ?, ?, ?)
  `);

  const oJulesId = uuidv4();
  insertOrder.run(oJulesId, user1Id, julesVpId, 'delivered', 14500, 'Lekki Phase 1, Lagos', '08055667788', 'Bank Transfer');
  insertOrderItem.run(uuidv4(), oJulesId, pJules1, 1, 14500);

  const o1Id = uuidv4();
  insertOrder.run(o1Id, user1Id, vp1Id, 'delivered', 8500, 'Lekki Phase 1, Lagos', '08055667788', 'Bank Transfer');
  insertOrderItem.run(uuidv4(), o1Id, p1, 1, 8500);

  // --- Follows ---
  const insertFollow = db.prepare(`
    INSERT INTO vendor_follows (id, user_id, vendor_id) VALUES (?, ?, ?)
  `);
  insertFollow.run(uuidv4(), user1Id, julesVpId);
  insertFollow.run(uuidv4(), user1Id, vintageVpId);

  // --- User Interests ---
  const insertInterest = db.prepare(`
    INSERT INTO user_interests (id, user_id, category) VALUES (?, ?, ?)
  `);
  insertInterest.run(uuidv4(), user1Id, 'Bags & Accessories');
  insertInterest.run(uuidv4(), user1Id, 'Fashion & Clothing');

  // --- Saved items ---
  const insertSaved = db.prepare(`
    INSERT INTO saved_items (id, user_id, vendor_id, product_id) VALUES (?, ?, ?, ?)
  `);

  insertSaved.run(uuidv4(), user1Id, julesVpId, pJules1);
  insertSaved.run(uuidv4(), user1Id, vintageVpId, pVv1);

  // --- Messages ---
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)
  `);

  insertMsg.run(uuidv4(), user1Id, julesUserId, 'Hi Jules! Is the Vintage Italian Leather Handbag still available?');
  insertMsg.run(uuidv4(), julesUserId, user1Id, 'Hello Chioma! Yes it is available and ready for immediate dispatch.');
  insertMsg.run(uuidv4(), user1Id, julesUserId, 'Awesome! Making payment right away.');

  console.log('Database seeded successfully with real thrift vendors!');
  console.log('');
  console.log('Premier Real Vendor:');
  console.log('  Jules Bag Store: jules@thriftlink.com / vendor123');
  console.log('  Vintage Vault:   vintagevault@thriftlink.com / vendor123');
  console.log('  SolePlug:        soleplug@thriftlink.com / vendor123');
  console.log('  Grace (Unverified): grace@thriftlink.com / vendor123');
  console.log('  Shopper:         chioma@gmail.com / user123');
}

seed().catch(console.error);
