const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
let supabaseData = null;
try {
  supabaseData = require('../db/supabaseData');
} catch {}

function isSupabase() {
  return process.env.DATA_BACKEND === 'supabase';
}

// ---------------------------------------------------------------------------
// 1. User Interests
// ---------------------------------------------------------------------------

async function getUserInterests(userId) {
  if (!userId) return [];
  if (isSupabase()) {
    try {
      const db = supabaseData.getDataClient();
      const rows = supabaseData.unwrap(
        await db.from('user_interests').select('category').eq('user_id', userId)
      ) || [];
      return rows.map((r) => r.category);
    } catch (err) {
      console.error('Supabase getUserInterests error:', err.message);
      return [];
    }
  }

  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT category FROM user_interests 
      WHERE user_id = ? OR user_id = (SELECT id FROM users WHERE supabase_user_id = ?)
      ORDER BY created_at ASC
    `).all(userId, userId);
    return rows.map((r) => r.category);
  } catch (err) {
    console.error('SQLite getUserInterests error:', err.message);
    return [];
  }
}

async function setUserInterests(userId, categories = []) {
  if (!userId) throw new Error('userId is required');
  const validCategories = Array.from(new Set(categories.map((c) => String(c).trim()).filter(Boolean)));

  if (isSupabase()) {
    try {
      const db = supabaseData.getDataClient();
      const del = await db.from('user_interests').delete().eq('user_id', userId);
      if (del.error) console.warn('Supabase delete user_interests notice:', del.error.message);
      if (validCategories.length > 0) {
        const rows = validCategories.map((cat) => ({
          id: uuidv4(),
          user_id: userId,
          category: cat,
        }));
        supabaseData.unwrap(await db.from('user_interests').insert(rows));
      }
      return validCategories;
    } catch (err) {
      console.error('Supabase setUserInterests error:', err.message);
      return validCategories;
    }
  }

  const db = getDb();

  // Ensure user exists in SQLite users table to satisfy foreign key constraint
  try {
    let resolvedUserId = userId;
    const userRow = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userRow) {
      const userBySupabase = db.prepare('SELECT id FROM users WHERE supabase_user_id = ?').get(userId);
      if (userBySupabase) {
        resolvedUserId = userBySupabase.id;
      } else {
        // Insert stub user record so FOREIGN KEY constraint passes smoothly
        db.prepare('INSERT OR IGNORE INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
          resolvedUserId,
          `user-${String(resolvedUserId).slice(0, 8)}@thriftlink.user`,
          'Thrift Shopper',
          'stub_hash',
          'user'
        );
      }
    }

    const insertStmt = db.prepare('INSERT OR IGNORE INTO user_interests (id, user_id, category) VALUES (?, ?, ?)');
    const deleteStmt = db.prepare('DELETE FROM user_interests WHERE user_id = ?');

    const txn = db.transaction(() => {
      deleteStmt.run(resolvedUserId);
      for (const cat of validCategories) {
        insertStmt.run(uuidv4(), resolvedUserId, cat);
      }
    });
    txn();

    return validCategories;
  } catch (err) {
    console.error('SQLite setUserInterests error:', err.message);
    return validCategories;
  }
}

// ---------------------------------------------------------------------------
// 2. Vendor Follows
// ---------------------------------------------------------------------------

async function followVendor(userId, vendorId) {
  if (!userId || !vendorId) throw new Error('userId and vendorId are required');

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    await db.from('vendor_follows').upsert(
      { id: uuidv4(), user_id: userId, vendor_id: vendorId },
      { onConflict: 'user_id,vendor_id' }
    );
    // Notify vendor in-app
    try {
      const vp = supabaseData.unwrap(await db.from('vendor_profiles').select('user_id').eq('id', vendorId).maybeSingle());
      if (vp?.user_id) {
        await db.from('notifications').insert({
          id: uuidv4(),
          user_id: vp.user_id,
          type: 'new_follower',
          title: 'New Store Follower',
          message: 'A customer started following your store profile. Keep your catalog updated!',
          link: '/vendor/analytics',
        });
      }
    } catch (_) {}
    return { following: true };
  }

  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO vendor_follows (id, user_id, vendor_id) VALUES (?, ?, ?)')
    .run(uuidv4(), userId, vendorId);

  try {
    const vp = db.prepare('SELECT user_id FROM vendor_profiles WHERE id = ?').get(vendorId);
    if (vp?.user_id) {
      db.prepare(`
        INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        vp.user_id,
        'new_follower',
        'New Store Follower',
        'A customer started following your store profile. Keep your catalog updated!',
        '/vendor/analytics'
      );
    }
  } catch (_) {}

  return { following: true };
}

async function unfollowVendor(userId, vendorId) {
  if (!userId || !vendorId) throw new Error('userId and vendorId are required');

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    supabaseData.unwrap(
      await db.from('vendor_follows').delete().eq('user_id', userId).eq('vendor_id', vendorId)
    );
    return { following: false };
  }

  const db = getDb();
  db.prepare('DELETE FROM vendor_follows WHERE user_id = ? AND vendor_id = ?').run(userId, vendorId);
  return { following: false };
}

async function isFollowing(userId, vendorId) {
  if (!userId || !vendorId) return false;

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const row = supabaseData.unwrap(
      await db.from('vendor_follows').select('id').eq('user_id', userId).eq('vendor_id', vendorId).maybeSingle()
    );
    return Boolean(row);
  }

  const db = getDb();
  const row = db.prepare('SELECT id FROM vendor_follows WHERE user_id = ? AND vendor_id = ?').get(userId, vendorId);
  return Boolean(row);
}

async function getUserFollowedVendorIds(userId) {
  if (!userId) return [];

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const rows = supabaseData.unwrap(
      await db.from('vendor_follows').select('vendor_id').eq('user_id', userId)
    ) || [];
    return rows.map((r) => r.vendor_id);
  }

  const db = getDb();
  const rows = db.prepare('SELECT vendor_id FROM vendor_follows WHERE user_id = ?').all(userId);
  return rows.map((r) => r.vendor_id);
}

async function getVendorFollowerCount(vendorId) {
  if (!vendorId) return 0;

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const { count, error } = await db.from('vendor_follows').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId);
    if (error) return 0;
    return count || 0;
  }

  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM vendor_follows WHERE vendor_id = ?').get(vendorId);
  return row ? row.count : 0;
}

/**
 * Step 5 of Algorithm Blueprint: Collaborative Filtering
 * Finds vendors followed by other shoppers who have similar/overlapping preferences
 */
async function getCollaborativePeerVendorIds(userId, userInterests = []) {
  if (!userId || !Array.isArray(userInterests) || userInterests.length === 0) return new Set();

  try {
    if (isSupabase()) {
      const db = supabaseData.getDataClient();
      const peers = supabaseData.unwrap(
        await db.from('user_interests')
          .select('user_id')
          .in('category', userInterests)
          .neq('user_id', userId)
          .limit(30)
      ) || [];
      const peerUserIds = Array.from(new Set(peers.map((p) => p.user_id)));
      if (peerUserIds.length > 0) {
        const follows = supabaseData.unwrap(
          await db.from('vendor_follows')
            .select('vendor_id')
            .in('user_id', peerUserIds)
            .limit(30)
        ) || [];
        return new Set(follows.map((f) => f.vendor_id));
      }
      return new Set();
    }

    const db = getDb();
    const placeholders = userInterests.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT DISTINCT vf.vendor_id
      FROM vendor_follows vf
      WHERE vf.user_id IN (
        SELECT DISTINCT ui.user_id
        FROM user_interests ui
        WHERE ui.category IN (${placeholders}) AND ui.user_id != ?
        LIMIT 30
      )
      AND vf.vendor_id NOT IN (
        SELECT vendor_id FROM vendor_follows WHERE user_id = ?
      )
      LIMIT 30
    `).all(...userInterests, userId, userId);
    return new Set(rows.map((r) => r.vendor_id));
  } catch (err) {
    console.error('getCollaborativePeerVendorIds error:', err);
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// 3. Interactions & Anti-Abuse Deduplication
// ---------------------------------------------------------------------------

async function logInteraction({ userId = null, vendorId, eventType, metadata = {} }) {
  if (!vendorId || !eventType) throw new Error('vendorId and eventType are required');

  // Map extended event types ('share', 'post_view') to DB CHECK-compatible event types while preserving metadata
  let dbEventType = eventType;
  let enrichedMeta = typeof metadata === 'object' && metadata !== null ? { ...metadata } : {};
  if (eventType === 'share') {
    dbEventType = 'save';
    enrichedMeta.originalEvent = 'share';
  } else if (eventType === 'post_view') {
    dbEventType = 'catalog_view';
    enrichedMeta.originalEvent = 'post_view';
  }

  const metaString = JSON.stringify(enrichedMeta);

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    // 15-minute deduplication check for user/vendor/event
    if (userId) {
      const windowAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const existing = supabaseData.unwrap(
        await db.from('vendor_interactions')
          .select('id')
          .eq('user_id', userId)
          .eq('vendor_id', vendorId)
          .eq('event_type', dbEventType)
          .gte('created_at', windowAgo)
          .maybeSingle()
      );
      if (existing) {
        return { recorded: false, deduplicated: true };
      }
    }

    await db.from('vendor_interactions').insert({
      id: uuidv4(),
      user_id: userId,
      vendor_id: vendorId,
      event_type: dbEventType,
      metadata: enrichedMeta,
    });
    return { recorded: true };
  }

  const db = getDb();
  if (userId) {
    const existing = db.prepare(`
      SELECT id FROM vendor_interactions
      WHERE user_id = ? AND vendor_id = ? AND event_type = ?
        AND created_at >= datetime('now', '-15 minutes')
      LIMIT 1
    `).get(userId, vendorId, dbEventType);
    if (existing) {
      return { recorded: false, deduplicated: true };
    }
  }

  db.prepare(`
    INSERT INTO vendor_interactions (id, user_id, vendor_id, event_type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, vendorId, dbEventType, metaString);

  return { recorded: true };
}

async function getDismissedVendorIds(userId, days = 30) {
  if (!userId) return [];

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const windowAgo = new Date(Date.now() - days * 86400000).toISOString();
    const rows = supabaseData.unwrap(
      await db.from('vendor_interactions')
        .select('vendor_id')
        .eq('user_id', userId)
        .in('event_type', ['dismiss', 'report'])
        .gte('created_at', windowAgo)
    ) || [];
    return Array.from(new Set(rows.map((r) => r.vendor_id)));
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT vendor_id FROM vendor_interactions
    WHERE user_id = ? AND event_type IN ('dismiss', 'report')
      AND created_at >= datetime('now', '-' || ? || ' days')
  `).all(userId, days);
  return rows.map((r) => r.vendor_id);
}

async function getUserInteractionSignals(userId, days = 30) {
  if (!userId) return { categoryWeights: {}, vendorWeights: {}, totalInteractions: 0 };

  const weights = {
    profile_view: 1,
    catalog_view: 2,
    follow: 4,
    save: 5,
    contact_click: 7,
  };

  const categoryWeights = {};
  const vendorWeights = {};
  let totalInteractions = 0;

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const windowAgo = new Date(Date.now() - days * 86400000).toISOString();
    const rows = supabaseData.unwrap(
      await db.from('vendor_interactions')
        .select('vendor_id, event_type, vendor_profiles(category)')
        .eq('user_id', userId)
        .gte('created_at', windowAgo)
    ) || [];

    for (const r of rows) {
      const w = weights[r.event_type] || 1;
      vendorWeights[r.vendor_id] = (vendorWeights[r.vendor_id] || 0) + w;
      const cat = r.vendor_profiles?.category;
      if (cat) {
        categoryWeights[cat] = (categoryWeights[cat] || 0) + w;
      }
      totalInteractions++;
    }
  } else {
    const db = getDb();
    const rows = db.prepare(`
      SELECT vi.vendor_id, vi.event_type, vp.category
      FROM vendor_interactions vi
      LEFT JOIN vendor_profiles vp ON vp.id = vi.vendor_id
      WHERE vi.user_id = ? AND vi.created_at >= datetime('now', '-' || ? || ' days')
    `).all(userId, days);

    for (const r of rows) {
      const w = weights[r.event_type] || 1;
      vendorWeights[r.vendor_id] = (vendorWeights[r.vendor_id] || 0) + w;
      if (r.category) {
        categoryWeights[r.category] = (categoryWeights[r.category] || 0) + w;
      }
      totalInteractions++;
    }
  }

  return { categoryWeights, vendorWeights, totalInteractions };
}

// ---------------------------------------------------------------------------
// 4. Recommendation Impressions Tracking
// ---------------------------------------------------------------------------

async function logImpressions(impressions = []) {
  if (!Array.isArray(impressions) || impressions.length === 0) return { count: 0 };

  const valid = impressions.filter((im) => im.vendorId && im.surface);
  if (valid.length === 0) return { count: 0 };

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const rows = valid.map((im) => ({
      id: uuidv4(),
      user_id: im.userId || null,
      session_id: im.sessionId || null,
      vendor_id: im.vendorId,
      surface: im.surface,
      position: Number(im.position || 0),
      score: Number(im.score || 0),
      ranking_version: String(im.rankingVersion || 'v1'),
    }));
    await db.from('recommendation_impressions').insert(rows);
    return { count: rows.length };
  }

  const db = getDb();
  const insertStmt = db.prepare(`
    INSERT INTO recommendation_impressions
    (id, user_id, session_id, vendor_id, surface, position, score, ranking_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    for (const im of valid) {
      insertStmt.run(
        uuidv4(),
        im.userId || null,
        im.sessionId || null,
        im.vendorId,
        im.surface,
        Number(im.position || 0),
        Number(im.score || 0),
        String(im.rankingVersion || 'v1')
      );
    }
  });
  txn();

  return { count: valid.length };
}

async function getVendorImpressionCounts(days = 30) {
  const counts = {};

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const windowAgo = new Date(Date.now() - days * 86400000).toISOString();
    const rows = supabaseData.unwrap(
      await db.from('recommendation_impressions')
        .select('vendor_id')
        .gte('created_at', windowAgo)
    ) || [];
    for (const r of rows) {
      counts[r.vendor_id] = (counts[r.vendor_id] || 0) + 1;
    }
    return counts;
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT vendor_id, COUNT(*) as count
    FROM recommendation_impressions
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY vendor_id
  `).all(days);

  for (const r of rows) {
    counts[r.vendor_id] = r.count;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// 5. Eligible Vendors Retrieval for Scoring
// ---------------------------------------------------------------------------

async function getEligibleVendorsForScoring() {
  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const vendors = supabaseData.unwrap(
      await db.from('vendor_profiles')
        .select(`
          id, user_id, shop_name, description, category, state, city, logo, banner,
          is_verified, verification_status, rating, total_reviews, is_featured,
          featured_rank, referral_code, catalog_updated_at, created_at,
          products (id, category, price, is_available, updated_at, created_at)
        `)
        .eq('is_verified', true)
        .eq('verification_status', 'approved')
    ) || [];

    return vendors.map((v) => {
      const activeProducts = (v.products || []).filter((p) => p.is_available);
      let latestProductUpdate = v.catalog_updated_at || v.created_at;
      const categoriesSet = new Set();
      if (v.category) categoriesSet.add(v.category);

      for (const p of activeProducts) {
        if (p.category) categoriesSet.add(p.category);
        const pTime = p.updated_at || p.created_at;
        if (pTime && (!latestProductUpdate || pTime > latestProductUpdate)) {
          latestProductUpdate = pTime;
        }
      }

      return {
        id: v.id,
        user_id: v.user_id,
        shop_name: v.shop_name,
        description: v.description,
        category: v.category,
        categories: Array.from(categoriesSet),
        state: v.state,
        city: v.city,
        logo: v.logo,
        banner: v.banner,
        rating: Number(v.rating || 0),
        total_reviews: Number(v.total_reviews || 0),
        is_featured: Boolean(v.is_featured),
        featured_rank: v.featured_rank,
        referral_code: v.referral_code,
        created_at: v.created_at,
        available_product_count: activeProducts.length,
        latest_catalog_update: latestProductUpdate,
      };
    });
  }

  const db = getDb();
  const vendors = db.prepare(`
    SELECT
      vp.id, vp.user_id, vp.shop_name, vp.description, vp.category,
      vp.state, vp.city, vp.logo, vp.banner, vp.rating, vp.total_reviews,
      vp.is_featured, vp.featured_rank, vp.referral_code, vp.catalog_updated_at,
      vp.created_at,
      COUNT(p.id) as available_product_count,
      MAX(COALESCE(p.updated_at, p.created_at, vp.created_at)) as latest_product_time,
      GROUP_CONCAT(DISTINCT p.category) as product_categories
    FROM vendor_profiles vp
    LEFT JOIN products p ON p.vendor_id = vp.id AND p.is_available = 1
    WHERE vp.is_verified = 1 AND vp.verification_status = 'approved'
    GROUP BY vp.id
  `).all();

  return vendors.map((v) => {
    const cats = new Set();
    if (v.category) cats.add(v.category);
    if (v.product_categories) {
      v.product_categories.split(',').forEach((c) => c && cats.add(c.trim()));
    }
    return {
      id: v.id,
      user_id: v.user_id,
      shop_name: v.shop_name,
      description: v.description,
      category: v.category,
      categories: Array.from(cats),
      state: v.state,
      city: v.city,
      logo: v.logo,
      banner: v.banner,
      rating: Number(v.rating || 0),
      total_reviews: Number(v.total_reviews || 0),
      is_featured: Boolean(v.is_featured),
      featured_rank: v.featured_rank,
      referral_code: v.referral_code,
      created_at: v.created_at,
      available_product_count: Number(v.available_product_count || 0),
      latest_catalog_update: v.catalog_updated_at || v.latest_product_time || v.created_at,
    };
  });
}

// ---------------------------------------------------------------------------
// 6. Referrals & Growth
// ---------------------------------------------------------------------------

function generateReferralCode(shopName = '') {
  const clean = shopName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'SHOP';
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TL-${clean}-${rand}`;
}

async function getOrCreateVendorReferral(vendorId) {
  if (!vendorId) return null;

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const vendor = supabaseData.unwrap(
      await db.from('vendor_profiles').select('id, shop_name, referral_code').eq('id', vendorId).maybeSingle()
    );
    if (!vendor) return null;

    if (!vendor.referral_code) {
      const newCode = generateReferralCode(vendor.shop_name);
      await db.from('vendor_profiles').update({ referral_code: newCode }).eq('id', vendorId);
      vendor.referral_code = newCode;
    }
    return vendor.referral_code;
  }

  const db = getDb();
  const vendor = db.prepare('SELECT id, shop_name, referral_code FROM vendor_profiles WHERE id = ?').get(vendorId);
  if (!vendor) return null;

  if (!vendor.referral_code) {
    const newCode = generateReferralCode(vendor.shop_name);
    db.prepare('UPDATE vendor_profiles SET referral_code = ? WHERE id = ?').run(newCode, vendorId);
    return newCode;
  }
  return vendor.referral_code;
}

async function attributeReferral({ referralCode, referredUserId = null, metadata = {} }) {
  if (!referralCode) return null;
  const metaString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const vendor = supabaseData.unwrap(
      await db.from('vendor_profiles').select('id').eq('referral_code', referralCode).maybeSingle()
    );
    if (!vendor) return null;

    const record = {
      id: uuidv4(),
      referrer_vendor_id: vendor.id,
      referral_code: referralCode,
      referred_user_id: referredUserId,
      conversion_status: referredUserId ? 'registered' : 'pending',
      metadata,
    };
    supabaseData.unwrap(await db.from('vendor_referrals').insert(record));
    return record;
  }

  const db = getDb();
  const vendor = db.prepare('SELECT id FROM vendor_profiles WHERE referral_code = ?').get(referralCode);
  if (!vendor) return null;

  const id = uuidv4();
  const status = referredUserId ? 'registered' : 'pending';
  db.prepare(`
    INSERT INTO vendor_referrals
    (id, referrer_vendor_id, referral_code, referred_user_id, conversion_status, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, vendor.id, referralCode, referredUserId, status, metaString);

  return { id, referrer_vendor_id: vendor.id, referral_code: referralCode, conversion_status: status };
}

async function getVendorReferralStats(vendorId) {
  if (!vendorId) return { totalVisits: 0, registrations: 0, activations: 0 };

  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const rows = supabaseData.unwrap(
      await db.from('vendor_referrals').select('conversion_status').eq('referrer_vendor_id', vendorId)
    ) || [];
    let totalVisits = rows.length;
    let registrations = 0;
    let activations = 0;
    for (const r of rows) {
      if (r.conversion_status === 'registered' || r.conversion_status === 'activated') registrations++;
      if (r.conversion_status === 'activated') activations++;
    }
    return { totalVisits, registrations, activations };
  }

  const db = getDb();
  const rows = db.prepare(`
    SELECT conversion_status, COUNT(*) as count
    FROM vendor_referrals
    WHERE referrer_vendor_id = ?
    GROUP BY conversion_status
  `).all(vendorId);

  let totalVisits = 0;
  let registrations = 0;
  let activations = 0;

  for (const r of rows) {
    totalVisits += r.count;
    if (r.conversion_status === 'registered') registrations += r.count;
    if (r.conversion_status === 'activated') {
      registrations += r.count;
      activations += r.count;
    }
  }

  return { totalVisits, registrations, activations };
}

// ---------------------------------------------------------------------------
// 7. Evaluation & Metrics
// ---------------------------------------------------------------------------

async function getRecommendationMetrics(days = 30) {
  if (isSupabase()) {
    const db = supabaseData.getDataClient();
    const windowAgo = new Date(Date.now() - days * 86400000).toISOString();
    const impressions = supabaseData.unwrap(
      await db.from('recommendation_impressions').select('surface, vendor_id').gte('created_at', windowAgo)
    ) || [];

    const totalImpressions = impressions.length;
    const vendorCounts = new Map();
    for (const im of impressions) {
      vendorCounts.set(im.vendor_id, (vendorCounts.get(im.vendor_id) || 0) + 1);
    }

    return {
      totalImpressions,
      uniqueVendorsRecommended: vendorCounts.size,
      timeWindowDays: days,
    };
  }

  const db = getDb();
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_impressions,
      COUNT(DISTINCT vendor_id) as unique_vendors,
      COUNT(DISTINCT user_id) as unique_users
    FROM recommendation_impressions
    WHERE created_at >= datetime('now', '-' || ? || ' days')
  `).get(days);

  const bySurface = db.prepare(`
    SELECT surface, COUNT(*) as count
    FROM recommendation_impressions
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY surface
  `).all(days);

  return {
    totalImpressions: summary.total_impressions || 0,
    uniqueVendorsRecommended: summary.unique_vendors || 0,
    uniqueUsersReached: summary.unique_users || 0,
    bySurface,
    timeWindowDays: days,
  };
}

// ---------------------------------------------------------------------------
// 8. News Feed Candidate Posts (Products & Vendor Drops)
// ---------------------------------------------------------------------------

async function getRecentFeedPosts(limit = 60) {
  if (isSupabase()) {
    try {
      const db = supabaseData.getDataClient();
      const { data, error } = await db
        .from('products')
        .select('*, vendor_profiles!inner(id,shop_name,whatsapp_number,rating,total_reviews,state,city,is_verified,logo,description,category,created_at)')
        .eq('is_available', true)
        .eq('vendor_profiles.is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((row) => {
        const vp = row.vendor_profiles || {};
        const { vendor_profiles, ...prod } = row;
        return {
          ...prod,
          vendor_id: vp.id || prod.vendor_id,
          vendor_name: vp.shop_name,
          vendor_logo: vp.logo,
          vendor_category: vp.category || prod.category,
          vendor_state: vp.state,
          vendor_city: vp.city,
          vendor_rating: Number(vp.rating || 0),
          vendor_reviews: Number(vp.total_reviews || 0),
          whatsapp_number: vp.whatsapp_number,
          is_verified: vp.is_verified ? 1 : 0,
        };
      });
    } catch (err) {
      console.error('Supabase getRecentFeedPosts error:', err.message);
      return [];
    }
  }

  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT
        p.*,
        v.id AS vendor_profile_id,
        v.shop_name AS vendor_name,
        v.logo AS vendor_logo,
        v.category AS vendor_category,
        v.state AS vendor_state,
        v.city AS vendor_city,
        v.rating AS vendor_rating,
        v.total_reviews AS vendor_reviews,
        v.whatsapp_number,
        v.is_verified
      FROM products p
      JOIN vendor_profiles v ON p.vendor_id = v.id
      WHERE p.is_available = 1 AND v.is_verified = 1
      ORDER BY p.created_at DESC
      LIMIT ?
    `).all(limit);
    return rows.map((r) => ({
      ...r,
      vendor_id: r.vendor_profile_id || r.vendor_id,
    }));
  } catch (err) {
    console.error('SQLite getRecentFeedPosts error:', err.message);
    return [];
  }
}

module.exports = {
  getUserInterests,
  setUserInterests,
  followVendor,
  unfollowVendor,
  isFollowing,
  getUserFollowedVendorIds,
  getVendorFollowerCount,
  getCollaborativePeerVendorIds,
  logInteraction,
  getDismissedVendorIds,
  getUserInteractionSignals,
  logImpressions,
  getVendorImpressionCounts,
  getEligibleVendorsForScoring,
  getRecentFeedPosts,
  generateReferralCode,
  getOrCreateVendorReferral,
  attributeReferral,
  getVendorReferralStats,
  getRecommendationMetrics,
};
