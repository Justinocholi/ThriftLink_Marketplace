const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;
let supabaseAdminClient = null;

function hasSupabasePublicConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function hasSupabaseAdminConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function createSupabaseClient(key) {
  return createClient(process.env.SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabaseClient() {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(process.env.SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

function getSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig()) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return supabaseAdminClient;
}

function isSupabaseEnabled() {
  return hasSupabasePublicConfig() || hasSupabaseAdminConfig();
}

async function registerSupabaseUser({ email, password, name, role, phone, state, city }) {
  // Two paths:
  //  A. SUPABASE_REQUIRE_EMAIL_CONFIRMATION=true → public signUp. Supabase
  //     creates an unconfirmed user and sends a confirmation email via their
  //     own verified domain (no Resend domain required). The dashboard's
  //     Authentication → Providers → Email → "Confirm email" toggle must be ON.
  //  B. Default → admin.createUser with email_confirm:true. User is created
  //     pre-confirmed, no email sent, can log in immediately.
  const requireConfirmation = process.env.SUPABASE_REQUIRE_EMAIL_CONFIRMATION === 'true';
  const userMetadata = { name, role, phone, state, city };

  if (!requireConfirmation) {
    const adminClient = getSupabaseAdminClient();
    if (adminClient) {
      const { data, error } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: userMetadata,
      });
      if (error) throw error;
      return data;
    }
  }

  // Confirmation flow (or fallback when no admin key is available).
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, session: null, skipped: true };
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { data, error } = await client.auth.signUp({
    email, password,
    options: { data: userMetadata, emailRedirectTo: `${frontendUrl}/login?confirmed=1` },
  });
  if (error) throw error;
  return data;
}

async function signInSupabaseUser(email, password) {
  const client = getSupabaseClient();
  if (!client) {
    return { user: null, session: null, skipped: true };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Verify a Supabase access token (e.g. from an OAuth redirect flow) and
// return the Supabase user it belongs to. Returns null if Supabase isn't
// configured or the token is invalid/expired.
async function getUserFromToken(accessToken) {
  const client = getSupabaseAdminClient() || getSupabaseClient();
  if (!client || !accessToken) return null;

  const { data, error } = await client.auth.getUser(accessToken);
  if (error) return null;
  return data?.user || null;
}

async function updateSupabaseUserPassword(userId, password) {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient || !userId) {
    return { skipped: true };
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) throw error;
  return data;
}

module.exports = {
  getSupabaseClient,
  getSupabaseAdminClient,
  hasSupabasePublicConfig,
  hasSupabaseAdminConfig,
  isSupabaseEnabled,
  registerSupabaseUser,
  signInSupabaseUser,
  getUserFromToken,
  updateSupabaseUserPassword,
};
