import { recommendations as recApi, products as productsApi } from '../services/api';

function parseImagesList(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.startsWith('http') || raw.startsWith('/') || raw.startsWith('data:') ? [raw] : [];
    }
  }
  return [];
}

/**
 * Normalizes a raw product row from `/api/products` into the exact News Feed post shape
 * so every real item uploaded on a vendor's profile/dashboard populates the News Feed.
 */
export function normalizeProductToFeedPost(prod) {
  if (!prod || !prod.id) return null;
  const isVerified = Boolean(prod.is_verified);
  const vendorId = prod.vendor_profile_id || prod.vendor_id;

  return {
    id: prod.id,
    post_type: 'catalog_drop',
    name: prod.name,
    description: prod.description || '',
    price: Number(prod.price || 0),
    original_price: prod.original_price ? Number(prod.original_price) : null,
    category: prod.category || 'Fashion & Clothing',
    condition: prod.condition || 'good',
    images: parseImagesList(prod.images),
    views: Number(prod.views || 0),
    created_at: prod.created_at,
    vendor_id: vendorId,
    vendor_name: prod.vendor_name || 'Thrift Vendor',
    vendor_logo: prod.vendor_logo || null,
    vendor_category: prod.vendor_category || prod.category || 'Fashion & Clothing',
    vendor_state: prod.vendor_state || prod.state || '',
    vendor_city: prod.vendor_city || prod.city || '',
    vendor_rating: Number(prod.vendor_rating || 0),
    vendor_reviews: Number(prod.vendor_reviews || 0),
    whatsapp_number: isVerified ? prod.whatsapp_number : null,
    is_verified: isVerified,
    is_restricted: !isVerified,
    isFollowed: Boolean(prod.isFollowed),
    score: prod.score || (isVerified ? 78 : 45),
    reasons: Array.isArray(prod.reasons) && prod.reasons.length > 0
      ? prod.reasons
      : isVerified
      ? ['Posted by a verified vendor']
      : ['Unverified Vendor — Restricted Preview'],
  };
}

/**
 * Siphons real vendor posts from both the personalized feed engine and the live
 * vendor products catalog (`/api/products`), stripping any synthetic status placeholders
 * and guaranteeing every uploaded vendor item appears regardless of post age.
 */
export async function fetchVendorSiphonedFeed({ surface = 'recommended_for_you', page = 1, limit = 20 } = {}) {
  const requests = [
    recApi.getFeed({ surface, limit, page }).catch(() => ({ posts: [] })),
  ];

  // On page 1 (and non-following surfaces), also pull directly from `/api/products`
  // so every vendor's uploaded catalog items are guaranteed to appear even if optional
  // recommendation tables are still syncing.
  if (surface !== 'following') {
    requests.push(
      productsApi.list({ sort: 'newest', limit: Math.max(50, limit * 2), page }).catch(() => ({ products: [] }))
    );
  }

  const [feedRes, directProductsRes] = await Promise.all(requests);

  const rawFeedPosts = (Array.isArray(feedRes?.posts) ? feedRes.posts : []).filter(
    (p) => p && p.id && p.post_type !== 'vendor_status' && !String(p.id).startsWith('status-')
  );

  const directPosts = (Array.isArray(directProductsRes?.products) ? directProductsRes.products : [])
    .map(normalizeProductToFeedPost)
    .filter(Boolean);

  // Merge by product ID: preserve enriched recommendation score/reasons when present,
  // and append any vendor catalog products that weren't yet in rawFeedPosts.
  const seenIds = new Set();
  const merged = [];

  for (const post of rawFeedPosts) {
    seenIds.add(post.id);
    merged.push({
      ...post,
      images: parseImagesList(post.images),
      is_verified: Boolean(post.is_verified),
      is_restricted: !Boolean(post.is_verified),
    });
  }

  const missingDirect = directPosts.filter((p) => !seenIds.has(p.id));
  if (missingDirect.length > 0) {
    // Rank verified vendor items first while still showing unverified items in restricted mode
    if (surface === 'new_arrivals') {
      merged.push(...missingDirect);
      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
      const ver = missingDirect.filter((p) => p.is_verified);
      const unver = missingDirect.filter((p) => !p.is_verified);
      merged.push(...ver, ...unver);
    }
  }

  return merged;
}
