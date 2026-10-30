/**
 * ThriftLink Recommendation Engine
 *
 * Rules-based, transparent, and explainable recommendation scoring.
 * Implements candidate generation, hard eligibility filtering, normalized multi-signal
 * scoring, freshness decay, diversity re-ranking, and cold-start fallback.
 */

const recommendationsRepo = require('../repos/recommendationsRepo');

const RANKING_VERSION = 'v1.0';

// Default starting weights from specification
const DEFAULT_WEIGHTS = {
  interest_match: 0.25,
  catalog_relevance: 0.15,
  activity_freshness: 0.15,
  trust_quality: 0.15,
  relationship_relevance: 0.10,
  exploration_opportunity: 0.10,
  delivery_or_location_relevance: 0.10,
};

/**
 * Calculate the freshness decay score (0.0 to 1.0)
 * Uses exponential half-life decay (~14 days half-life)
 */
function calculateFreshness(timestamp) {
  if (!timestamp) return 0.1;
  const time = new Date(timestamp).getTime();
  if (isNaN(time)) return 0.1;

  const now = Date.now();
  const diffDays = Math.max(0, (now - time) / (1000 * 60 * 60 * 24));
  // Half-life of 14 days: lambda = ln(2) / 14 ≈ 0.0495
  const decay = Math.exp(-0.0495 * diffDays);
  return Math.min(1.0, Math.max(0.05, decay));
}

/**
 * Calculate exploration opportunity boost (0.0 to 1.0)
 * Gives underexposed or newly approved vendors a controlled boost
 */
function calculateExploration(impressionCount, createdAt) {
  const impressions = Number(impressionCount || 0);
  let boost = 0.0;

  if (impressions < 20) {
    boost = 1.0;
  } else if (impressions < 100) {
    boost = 1.0 - ((impressions - 20) / 80);
  } else {
    boost = 0.0;
  }

  // If vendor account was created in the last 14 days, guarantee minimum 0.5 boost
  if (createdAt) {
    const createdTime = new Date(createdAt).getTime();
    if (!isNaN(createdTime)) {
      const daysSinceCreation = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 14) {
        boost = Math.max(boost, 0.6);
      }
    }
  }

  return Math.min(1.0, Math.max(0.0, boost));
}

/**
 * Score a single vendor candidate against a user context
 */
function scoreVendor(vendor, context, weights = DEFAULT_WEIGHTS) {
  const {
    userInterests = [],
    interactionSignals = { categoryWeights: {}, vendorWeights: {} },
    userFollowedIds = new Set(),
    impressionCounts = {},
    userLocation = null, // { state, city }
  } = context;

  // 1. Interest Match (0.0 - 1.0)
  let interestMatch = 0.0;
  const vendorCategories = vendor.categories || (vendor.category ? [vendor.category] : []);
  const vendorBio = `${vendor.shop_name || ''} ${vendor.description || ''} ${vendor.category || ''}`.toLowerCase();
  let matchedStyleName = null;

  if (userInterests.length > 0) {
    let matchPoints = 0;
    let maxPoints = 0;

    for (const interest of userInterests) {
      maxPoints += 1;
      const lower = interest.toLowerCase();
      // Category match
      if (vendorCategories.some((c) => c && (c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase())))) {
        matchPoints += 1.0;
      }
      // Style / keyword match in vendor bio / shop name
      else if (
        (lower.includes('vintage') && (vendorBio.includes('vintage') || vendorBio.includes('retro'))) ||
        (lower.includes('y2k') && (vendorBio.includes('y2k') || vendorBio.includes('90s') || vendorBio.includes('2000s'))) ||
        (lower.includes('streetwear') && (vendorBio.includes('streetwear') || vendorBio.includes('casual') || vendorBio.includes('hoodie'))) ||
        (lower.includes('luxury') && (vendorBio.includes('luxury') || vendorBio.includes('designer') || vendorBio.includes('brand'))) ||
        (lower.includes('chic') && (vendorBio.includes('chic') || vendorBio.includes('corporate') || vendorBio.includes('formal'))) ||
        (vendorBio.includes(lower))
      ) {
        matchPoints += 0.85;
        matchedStyleName = interest;
      }
      // Location match
      else if (
        (vendor.state && lower.includes(vendor.state.toLowerCase())) ||
        (vendor.city && lower.includes(vendor.city.toLowerCase()))
      ) {
        matchPoints += 0.75;
      }
    }

    if (maxPoints > 0 && matchPoints > 0) {
      interestMatch = Math.min(1.0, 0.35 + (matchPoints / maxPoints) * 0.65);
    } else {
      interestMatch = 0.2;
    }
  } else {
    // Infer interest from past interaction categories
    const catWeight = interactionSignals.categoryWeights[vendor.category] || 0;
    if (catWeight > 0) {
      interestMatch = Math.min(1.0, 0.3 + (catWeight / 10) * 0.7);
    } else {
      // Cold-start neutral value
      interestMatch = 0.5;
    }
  }

  // 2. Catalog Relevance (0.0 - 1.0)
  // Combines user category interaction history + availability of catalog items
  const catInteractions = interactionSignals.categoryWeights[vendor.category] || 0;
  const historyPart = Math.min(1.0, catInteractions / 15) * 0.5;
  const catalogSizePart = Math.min(1.0, Math.max(0, vendor.available_product_count || 0) / 10) * 0.5;
  const catalogRelevance = historyPart + catalogSizePart;

  // 3. Activity Freshness (0.0 - 1.0)
  const activityFreshness = calculateFreshness(vendor.latest_catalog_update);

  // 4. Trust & Quality (0.0 - 1.0)
  // Verification is hard prerequisite (already filtered); rating + review volume scale
  const ratingPart = Math.min(1.0, Math.max(0, (vendor.rating || 0) / 5)) * 0.6;
  const reviewsPart = Math.min(1.0, Math.max(0, (vendor.total_reviews || 0) / 15)) * 0.4;
  const trustQuality = ratingPart + reviewsPart;

  // 5. Relationship Relevance (0.0 - 1.0)
  let relationshipRelevance = 0.1;
  const isPeerFollowed = Boolean(context.peerFollowedVendorIds && context.peerFollowedVendorIds.has(vendor.id));
  if (userFollowedIds.has(vendor.id)) {
    relationshipRelevance = 1.0;
  } else if (isPeerFollowed) {
    // Collaborative filtering boost
    relationshipRelevance = 0.85;
  } else if ((interactionSignals.vendorWeights[vendor.id] || 0) > 0) {
    relationshipRelevance = Math.min(0.9, 0.3 + (interactionSignals.vendorWeights[vendor.id] / 15));
  }

  // 6. Exploration Opportunity (0.0 - 1.0)
  const vendorImpressions = impressionCounts[vendor.id] || 0;
  const explorationOpportunity = calculateExploration(vendorImpressions, vendor.created_at);

  // 7. Delivery / Location Relevance (0.0 - 1.0)
  let deliveryOrLocationRelevance = 0.5; // neutral when no user location set
  if (userLocation && userLocation.state) {
    if (vendor.state && vendor.state.toLowerCase() === userLocation.state.toLowerCase()) {
      if (userLocation.city && vendor.city && vendor.city.toLowerCase() === userLocation.city.toLowerCase()) {
        deliveryOrLocationRelevance = 1.0;
      } else {
        deliveryOrLocationRelevance = 0.85;
      }
    } else {
      deliveryOrLocationRelevance = 0.35;
    }
  }

  // Total weighted score
  const totalScore =
    (weights.interest_match * interestMatch) +
    (weights.catalog_relevance * catalogRelevance) +
    (weights.activity_freshness * activityFreshness) +
    (weights.trust_quality * trustQuality) +
    (weights.relationship_relevance * relationshipRelevance) +
    (weights.exploration_opportunity * explorationOpportunity) +
    (weights.delivery_or_location_relevance * deliveryOrLocationRelevance);

  const normalizedScore = Math.min(100, Math.max(0, Math.round(totalScore * 100)));

  // Generate transparent explanation reasons for UI
  const reasons = [];
  if (userInterests.includes(vendor.category)) {
    reasons.push(`Matches your interest in ${vendor.category}`);
  } else if (matchedStyleName) {
    reasons.push(`Matches your ${matchedStyleName} style`);
  }
  if (isPeerFollowed) {
    reasons.push('Popular with shoppers sharing your style');
  }
  if (activityFreshness > 0.6) {
    reasons.push('Recently active catalog');
  }
  if (vendor.rating >= 4.5 && vendor.total_reviews >= 3) {
    reasons.push(`Highly rated (${vendor.rating.toFixed(1)}/5)`);
  }
  if (explorationOpportunity > 0.5) {
    reasons.push('Emerging vendor spotlight');
  }
  if (deliveryOrLocationRelevance >= 0.85 && vendor.state) {
    reasons.push(`Based in ${vendor.state}`);
  }
  if (reasons.length === 0) {
    reasons.push('Verified ThriftLink Seller');
  }

  return {
    ...vendor,
    score: normalizedScore,
    rawScore: totalScore,
    features: {
      interestMatch,
      catalogRelevance,
      activityFreshness,
      trustQuality,
      relationshipRelevance,
      explorationOpportunity,
      deliveryOrLocationRelevance,
    },
    reasons,
    rankingVersion: RANKING_VERSION,
  };
}

/**
 * Apply diversity-aware re-ranking to prevent monotonic category clustering
 * Limits consecutive vendors of the same primary category to at most 2
 */
function applyDiversity(rankedVendors, maxConsecutiveSameCategory = 2) {
  if (rankedVendors.length <= 2) return rankedVendors;

  const result = [];
  const remaining = [...rankedVendors];

  while (remaining.length > 0) {
    let nextIndex = 0;

    // Check last N items in result
    if (result.length >= maxConsecutiveSameCategory) {
      const lastCat = result[result.length - 1].category;
      let allMatch = true;
      for (let i = 1; i <= maxConsecutiveSameCategory; i++) {
        if (result[result.length - i].category !== lastCat) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        // Find next item in remaining with a DIFFERENT category
        const diffIndex = remaining.findIndex((v) => v.category !== lastCat);
        if (diffIndex !== -1) {
          nextIndex = diffIndex;
        }
      }
    }

    const [chosen] = remaining.splice(nextIndex, 1);
    result.push(chosen);
  }

  return result;
}

/**
 * Main Recommendation Generation Function
 */
async function getRecommendations({
  userId = null,
  surface = 'recommended_for_you',
  vendorId = null, // for 'similar' surface
  userLocation = null,
  limit = 10,
  page = 1,
  excludeFollowed = true,
}) {
  // 1. Retrieve all verified eligible vendors (hard filter)
  const eligibleVendors = await recommendationsRepo.getEligibleVendorsForScoring();

  // 2. Retrieve user context & negative feedback
  const [
    userInterests,
    followedVendorIds,
    dismissedVendorIds,
    interactionSignals,
    impressionCounts,
  ] = await Promise.all([
    userId ? recommendationsRepo.getUserInterests(userId) : [],
    userId ? recommendationsRepo.getUserFollowedVendorIds(userId) : [],
    userId ? recommendationsRepo.getDismissedVendorIds(userId, 30) : [],
    userId ? recommendationsRepo.getUserInteractionSignals(userId, 30) : { categoryWeights: {}, vendorWeights: {} },
    recommendationsRepo.getVendorImpressionCounts(30),
  ]);

  const followedSet = new Set(followedVendorIds);
  const dismissedSet = new Set(dismissedVendorIds);

  // Collaborative peer lookup (Step 5 of algorithm spec)
  const peerFollowedVendorIds = userId && userInterests.length > 0
    ? await recommendationsRepo.getCollaborativePeerVendorIds(userId, userInterests)
    : new Set();

  // 3. Filter candidates by safety & eligibility
  const candidatePool = eligibleVendors.filter((v) => {
    // Exclude current user's own vendor profile
    if (userId && v.user_id === userId) return false;

    // Exclude explicitly dismissed or reported vendors
    if (dismissedSet.has(v.id)) return false;

    // Exclude target vendor when generating similar vendors
    if (surface === 'similar' && vendorId && v.id === vendorId) return false;

    // For "recommended_for_you" or discovery follow suggestions, optionally exclude already followed
    if (excludeFollowed && (surface === 'recommended_for_you' || surface === 'discover') && followedSet.has(v.id)) {
      return false;
    }

    return true;
  });

  const scoringContext = {
    userInterests,
    interactionSignals,
    userFollowedIds: followedSet,
    peerFollowedVendorIds,
    impressionCounts,
    userLocation,
  };

  // 4. Surface-specific ranking logic
  let ranked = [];

  if (surface === 'similar' && vendorId) {
    // Similar vendors: match category overlap, catalog size, and rating
    const targetVendor = eligibleVendors.find((v) => v.id === vendorId);
    if (!targetVendor) return { vendors: [], total: 0, rankingVersion: RANKING_VERSION };

    ranked = candidatePool.map((v) => {
      let simScore = 0.0;
      // Category match
      if (v.category && targetVendor.category && v.category === targetVendor.category) {
        simScore += 0.5;
      }
      // Overlapping catalog categories
      const targetCats = new Set(targetVendor.categories || []);
      const sharedCats = (v.categories || []).filter((c) => targetCats.has(c));
      if (sharedCats.length > 0) simScore += 0.25;

      // Rating/quality proxy
      simScore += Math.min(0.25, (v.rating / 5) * 0.25);

      const scoreNum = Math.round(simScore * 100);
      return {
        ...v,
        score: scoreNum,
        reasons: [`Similar category: ${v.category || targetVendor.category}`, 'Verified seller'],
        rankingVersion: RANKING_VERSION,
      };
    }).sort((a, b) => b.score - a.score);

  } else if (surface === 'new_arrivals') {
    // New Arrivals surface: primarily sorted by activity freshness, weighted with user interest
    const weights = {
      ...DEFAULT_WEIGHTS,
      activity_freshness: 0.40,
      interest_match: 0.25,
      trust_quality: 0.15,
      exploration_opportunity: 0.10,
      catalog_relevance: 0.10,
    };

    ranked = candidatePool
      .filter((v) => v.available_product_count > 0) // Must have available products
      .map((v) => scoreVendor(v, scoringContext, weights))
      .sort((a, b) => {
        // Primary sort: recency of catalog update
        const timeA = new Date(a.latest_catalog_update || 0).getTime();
        const timeB = new Date(b.latest_catalog_update || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return b.score - a.score;
      });

  } else if (surface === 'discover') {
    // Discover Vendors: Mix 70% established relevant, 20% underexposed, 10% exploratory
    const scored = candidatePool.map((v) => scoreVendor(v, scoringContext, DEFAULT_WEIGHTS));

    // Segregate into buckets
    const established = scored
      .filter((v) => v.features.explorationOpportunity < 0.5)
      .sort((a, b) => b.score - a.score);

    const underexposed = scored
      .filter((v) => v.features.explorationOpportunity >= 0.5)
      .sort((a, b) => b.features.explorationOpportunity - a.features.explorationOpportunity || b.score - a.score);

    const exploratory = scored
      .filter((v) => v.features.interestMatch <= 0.5)
      .sort((a, b) => b.features.trustQuality - a.features.trustQuality);

    // Controlled composition
    const targetEstablished = Math.max(1, Math.round(limit * 0.7));
    const targetUnderexposed = Math.max(1, Math.round(limit * 0.2));
    const targetExploratory = Math.max(0, limit - targetEstablished - targetUnderexposed);

    const picked = new Set();
    const mixed = [];

    const addFromBucket = (bucket, count) => {
      let added = 0;
      for (const item of bucket) {
        if (!picked.has(item.id)) {
          picked.add(item.id);
          mixed.push(item);
          added++;
          if (added >= count) break;
        }
      }
    };

    addFromBucket(established, targetEstablished);
    addFromBucket(underexposed, targetUnderexposed);
    addFromBucket(exploratory, targetExploratory);

    // Fill remaining if buckets were smaller than quotas
    for (const item of scored) {
      if (!picked.has(item.id)) {
        picked.add(item.id);
        mixed.push(item);
      }
    }

    // Apply diversity re-ranking to prevent clustering
    ranked = applyDiversity(mixed, 2);

  } else {
    // 'recommended_for_you' (Personalized list)
    ranked = candidatePool
      .map((v) => scoreVendor(v, scoringContext, DEFAULT_WEIGHTS))
      .sort((a, b) => b.score - a.score);

    // Apply diversity re-ranking
    ranked = applyDiversity(ranked, 2);
  }

  // 5. Pagination
  const total = ranked.length;
  const offset = (page - 1) * limit;
  const paginatedVendors = ranked.slice(offset, offset + limit);

  return {
    vendors: paginatedVendors,
    total,
    page,
    limit,
    surface,
    rankingVersion: RANKING_VERSION,
  };
}

module.exports = {
  getRecommendations,
  scoreVendor,
  calculateFreshness,
  calculateExploration,
  applyDiversity,
  RANKING_VERSION,
  DEFAULT_WEIGHTS,
};
