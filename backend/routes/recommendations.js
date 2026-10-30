const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const recommendationEngine = require('../services/recommendationEngine');
const recommendationsRepo = require('../repos/recommendationsRepo');

const router = express.Router();

const ALLOWED_SURFACES = new Set([
  'recommended_for_you',
  'discover',
  'similar',
  'new_arrivals',
  'following',
]);

const ALLOWED_EVENT_TYPES = new Set([
  'post_view',
  'profile_view',
  'catalog_view',
  'save',
  'share',
  'follow',
  'contact_click',
  'dismiss',
  'report',
]);

// ---------------------------------------------------------------------------
// 1. Recommendations Feed
// GET /api/recommendations/vendors?surface=...&vendorId=...&page=1&limit=10
// ---------------------------------------------------------------------------
router.get('/vendors', optionalAuthenticate, async (req, res) => {
  try {
    const surface = ALLOWED_SURFACES.has(req.query.surface) ? req.query.surface : 'recommended_for_you';
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const vendorId = req.query.vendorId || null;
    const excludeFollowed = req.query.excludeFollowed !== 'false';

    const userId = req.user?.id || null;
    const userLocation = req.user ? { state: req.user.state, city: req.user.city } : null;

    const result = await recommendationEngine.getRecommendations({
      userId,
      surface,
      vendorId,
      userLocation,
      limit,
      page,
      excludeFollowed,
    });

    res.json(result);
  } catch (err) {
    console.error('recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ---------------------------------------------------------------------------
// 1b. Personalized News Feed of Vendor Posts & New Arrivals
// GET /api/recommendations/feed?surface=recommended_for_you|following|new_arrivals&page=1&limit=12
// ---------------------------------------------------------------------------
router.get('/feed', optionalAuthenticate, async (req, res) => {
  try {
    const surface = ALLOWED_SURFACES.has(req.query.surface) ? req.query.surface : 'recommended_for_you';
    const limit = Math.max(1, Math.min(48, parseInt(req.query.limit, 10) || 12));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const userId = req.user?.id || null;
    const userLocation = req.user ? { state: req.user.state, city: req.user.city } : null;

    const result = await recommendationEngine.getPersonalizedFeed({
      userId,
      surface,
      userLocation,
      limit,
      page,
    });

    res.json(result);
  } catch (err) {
    console.error('recommendations feed error:', err);
    res.status(500).json({ error: 'Failed to generate personalized news feed' });
  }
});

// ---------------------------------------------------------------------------
// 2. User Interests
// ---------------------------------------------------------------------------
router.get('/user-interests', authenticate, async (req, res) => {
  try {
    const interests = await recommendationsRepo.getUserInterests(req.user.id);
    res.json({ interests });
  } catch (err) {
    console.error('get user interests error:', err);
    res.status(500).json({ error: 'Failed to retrieve interests' });
  }
});

router.put('/user-interests', authenticate, async (req, res) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests)) {
      return res.status(400).json({ error: 'interests must be an array of category names' });
    }
    const updated = await recommendationsRepo.setUserInterests(req.user.id, interests);
    res.json({ interests: updated, message: 'Interests updated successfully' });
  } catch (err) {
    console.error('update user interests error:', err);
    res.status(500).json({ error: 'Failed to update interests' });
  }
});

// ---------------------------------------------------------------------------
// 3. Interactions & Telemetry
// ---------------------------------------------------------------------------
router.post('/events', optionalAuthenticate, async (req, res) => {
  try {
    const { vendorId, eventType, metadata } = req.body;
    if (!vendorId || !eventType) {
      return res.status(400).json({ error: 'vendorId and eventType are required' });
    }
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ error: `Invalid eventType. Allowed: ${Array.from(ALLOWED_EVENT_TYPES).join(', ')}` });
    }

    const result = await recommendationsRepo.logInteraction({
      userId: req.user?.id || null,
      vendorId,
      eventType,
      metadata: metadata || {},
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('log event error:', err);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

router.post('/impressions', optionalAuthenticate, async (req, res) => {
  try {
    const { impressions, sessionId } = req.body;
    if (!Array.isArray(impressions) || impressions.length === 0) {
      return res.status(400).json({ error: 'impressions must be a non-empty array' });
    }

    const payload = impressions.map((im) => ({
      userId: req.user?.id || null,
      sessionId: sessionId || req.body.session_id || null,
      vendorId: im.vendorId || im.vendor_id,
      surface: im.surface || 'recommended_for_you',
      position: im.position || 0,
      score: im.score || 0,
      rankingVersion: im.rankingVersion || im.ranking_version || recommendationEngine.RANKING_VERSION,
    }));

    const result = await recommendationsRepo.logImpressions(payload);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('log impressions error:', err);
    res.status(500).json({ error: 'Failed to record impressions' });
  }
});

router.post('/feedback', optionalAuthenticate, async (req, res) => {
  try {
    const { vendorId, reason } = req.body;
    if (!vendorId) return res.status(400).json({ error: 'vendorId is required' });

    await recommendationsRepo.logInteraction({
      userId: req.user?.id || null,
      vendorId,
      eventType: 'dismiss',
      metadata: { reason: reason || 'not_interested' },
    });

    res.json({ ok: true, message: 'Recommendation dismissed' });
  } catch (err) {
    console.error('feedback error:', err);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// ---------------------------------------------------------------------------
// 4. Follows Management
// ---------------------------------------------------------------------------
router.post('/follows/:vendorId', authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;
    await recommendationsRepo.followVendor(req.user.id, vendorId);
    // Log interaction
    recommendationsRepo.logInteraction({
      userId: req.user.id,
      vendorId,
      eventType: 'follow',
    }).catch(() => {});

    const followerCount = await recommendationsRepo.getVendorFollowerCount(vendorId);
    res.json({ following: true, followerCount });
  } catch (err) {
    console.error('follow vendor error:', err);
    res.status(500).json({ error: 'Failed to follow vendor' });
  }
});

router.delete('/follows/:vendorId', authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;
    await recommendationsRepo.unfollowVendor(req.user.id, vendorId);
    const followerCount = await recommendationsRepo.getVendorFollowerCount(vendorId);
    res.json({ following: false, followerCount });
  } catch (err) {
    console.error('unfollow vendor error:', err);
    res.status(500).json({ error: 'Failed to unfollow vendor' });
  }
});

router.get('/follows/status/:vendorId', optionalAuthenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const isFollowing = req.user ? await recommendationsRepo.isFollowing(req.user.id, vendorId) : false;
    const followerCount = await recommendationsRepo.getVendorFollowerCount(vendorId);
    res.json({ isFollowing, followerCount });
  } catch (err) {
    console.error('follow status error:', err);
    res.status(500).json({ error: 'Failed to retrieve follow status' });
  }
});

router.get('/follows/my-follows', authenticate, async (req, res) => {
  try {
    const followedIds = await recommendationsRepo.getUserFollowedVendorIds(req.user.id);
    res.json({ followedIds });
  } catch (err) {
    console.error('my follows error:', err);
    res.status(500).json({ error: 'Failed to retrieve followed vendors' });
  }
});

// ---------------------------------------------------------------------------
// 5. Growth & Referrals
// ---------------------------------------------------------------------------
router.get('/referrals/vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const referralCode = await recommendationsRepo.getOrCreateVendorReferral(vendorId);
    const stats = await recommendationsRepo.getVendorReferralStats(vendorId);
    res.json({ referralCode, ...stats });
  } catch (err) {
    console.error('vendor referral error:', err);
    res.status(500).json({ error: 'Failed to load referral data' });
  }
});

router.post('/referrals/track', async (req, res) => {
  try {
    const { referralCode, metadata } = req.body;
    if (!referralCode) return res.status(400).json({ error: 'referralCode required' });

    const result = await recommendationsRepo.attributeReferral({
      referralCode,
      referredUserId: null,
      metadata: metadata || {},
    });
    res.json({ ok: true, result });
  } catch (err) {
    console.error('referral track error:', err);
    res.status(500).json({ error: 'Failed to track referral' });
  }
});

router.post('/referrals/attribute', authenticate, async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ error: 'referralCode required' });

    const result = await recommendationsRepo.attributeReferral({
      referralCode,
      referredUserId: req.user.id,
      metadata: { registeredAt: new Date().toISOString() },
    });
    res.json({ ok: true, result });
  } catch (err) {
    console.error('referral attribute error:', err);
    res.status(500).json({ error: 'Failed to attribute referral' });
  }
});

// ---------------------------------------------------------------------------
// 6. Metrics & Performance
// ---------------------------------------------------------------------------
router.get('/metrics', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, parseInt(req.query.days, 10) || 30));
    const metrics = await recommendationsRepo.getRecommendationMetrics(days);
    res.json(metrics);
  } catch (err) {
    console.error('recommendations metrics error:', err);
    res.status(500).json({ error: 'Failed to compute recommendation metrics' });
  }
});

module.exports = router;
