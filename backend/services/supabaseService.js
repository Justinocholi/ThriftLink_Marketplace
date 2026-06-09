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
  const adminClient = getSupabaseAdminClient();

  if (adminClient) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        phone,
        state,
        city,
      },
    });

    if (error) throw error;
    return data;
  }

  const client = getSupabaseClient();
  if (!client) {
    return { user: null, session: null, skipped: true };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        phone,
        state,
        city,
      },
    },
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
  updateSupabaseUserPassword,
};
