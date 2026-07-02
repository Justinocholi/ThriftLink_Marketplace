const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail, templates } = require('../services/emailService');
const crypto = require('crypto');
const {
  isSupabaseEnabled,
  hasSupabasePublicConfig,
  registerSupabaseUser,
  signInSupabaseUser,
  updateSupabaseUserPassword,
  getSupabaseClient,
  getUserFromToken,
} = require('../services/supabaseService');
const { sendWelcomeSms } = require('../services/termiiService');
const { verifyEmailDeliverability } = require('../services/mailboxlayerService');
const usersRepo = require('../repos/usersRepo');
const vendorsRepo = require('../repos/vendorsRepo');

const router = express.Router();
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUser(user) {
  const { password_hash, reset_token_hash, reset_token_expires_at, ...safe } = user;
  return safe;
}

function isSupabaseDuplicateUserError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('already registered') || message.includes('already been registered');
}

function ensureVendorProfile(db, user, profile = {}) {
  const existing = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ?').get(user.id);
  if (existing) return;

  db.prepare(`
    INSERT INTO vendor_profiles (id, user_id, shop_name, whatsapp_number, category, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    user.id,
    `${user.name} Shop`,
    profile.phone || '',
    'General',
    profile.state || '',
    profile.city || ''
  );
}

function createLocalUser(db, { email, password, name, role, phone, state, city, supabaseUserId = null }) {
  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password || uuidv4(), 10);

  db.prepare(`
    INSERT INTO users (id, supabase_user_id, email, password_hash, name, role, phone, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    supabaseUserId,
    email,
    password_hash,
    name,
    role,
    phone || null,
    state || null,
    city || null
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (role === 'vendor') {
    ensureVendorProfile(db, user, { phone, state, city });
  }

  return user;
}

function syncLocalUserFromSupabase(db, supabaseUser, plainPassword) {
  const metadata = supabaseUser.user_metadata || {};
  const email = normalizeEmail(supabaseUser.email);
  const fallbackName = metadata.name || email.split('@')[0];
  const fallbackRole = metadata.role === 'vendor' ? 'vendor' : 'user';
  const fallbackPhone = metadata.phone || null;
  const fallbackState = metadata.state || null;
  const fallbackCity = metadata.city || null;
  const password_hash = bcrypt.hashSync(plainPassword, 10);

  const existing = db.prepare(`
    SELECT * FROM users
    WHERE supabase_user_id = ? OR email = ?
  `).get(supabaseUser.id, email);

  if (existing) {
    db.prepare(`
      UPDATE users SET
        supabase_user_id = COALESCE(?, supabase_user_id),
        password_hash = ?,
        name = COALESCE(name, ?),
        phone = COALESCE(phone, ?),
        state = COALESCE(state, ?),
        city = COALESCE(city, ?),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      supabaseUser.id,
      password_hash,
      fallbackName,
      fallbackPhone,
      fallbackState,
      fallbackCity,
      existing.id
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    if (user.role === 'vendor') {
      ensureVendorProfile(db, user, {
        phone: user.phone || fallbackPhone,
        state: user.state || fallbackState,
        city: user.city || fallbackCity,
      });
    }
    return user;
  }

  return createLocalUser(db, {
    email,
    password: plainPassword,
    name: fallbackName,
    role: fallbackRole,
    phone: fallbackPhone,
    state: fallbackState,
    city: fallbackCity,
    supabaseUserId: supabaseUser.id,
  });
}

// ---- Supabase (PostgREST) variants of the helpers above ----

async function ensureVendorProfileAsync(user, profile = {}) {
  const existing = await vendorsRepo.getByUserId(user.id);
  if (existing) return;
  await vendorsRepo.create({
    id: uuidv4(),
    user_id: user.id,
    shop_name: `${user.name} Shop`,
    whatsapp_number: profile.phone || '',
    category: 'General',
    state: profile.state || '',
    city: profile.city || '',
  });
}

async function createUserAsync({ email, password, name, role, phone, state, city, supabaseUserId = null }) {
  const user = await usersRepo.create({
    id: uuidv4(),
    supabase_user_id: supabaseUserId,
    email,
    password_hash: bcrypt.hashSync(password || uuidv4(), 10),
    name,
    role,
    phone: phone || null,
    state: state || null,
    city: city || null,
  });
  if (role === 'vendor') await ensureVendorProfileAsync(user, { phone, state, city });
  return user;
}

async function syncFromSupabaseAsync(supabaseUser, plainPassword) {
  const metadata = supabaseUser.user_metadata || {};
  const email = normalizeEmail(supabaseUser.email);
  const fallbackName = metadata.name || email.split('@')[0];
  const fallbackRole = metadata.role === 'vendor' ? 'vendor' : 'user';
  const password_hash = bcrypt.hashSync(plainPassword, 10);

  let existing = await usersRepo.getBySupabaseUserId(supabaseUser.id);
  if (!existing) existing = await usersRepo.getByEmail(email);

  if (existing) {
    const updated = await usersRepo.update(existing.id, {
      supabase_user_id: existing.supabase_user_id || supabaseUser.id,
      password_hash,
      name: existing.name || fallbackName,
      phone: existing.phone || metadata.phone || null,
      state: existing.state || metadata.state || null,
      city: existing.city || metadata.city || null,
    });
    if (updated.role === 'vendor') {
      await ensureVendorProfileAsync(updated, {
        phone: updated.phone, state: updated.state, city: updated.city,
      });
    }
    return updated;
  }

  return createUserAsync({
    email, password: plainPassword, name: fallbackName, role: fallbackRole,
    phone: metadata.phone || null, state: metadata.state || null, city: metadata.city || null,
    supabaseUserId: supabaseUser.id,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'user', phone, state, city } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!['user', 'vendor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or vendor' });
    }

    // Pre-flight email verification (Mailboxlayer). No-ops if MAILBOXLAYER_KEY
    // isn't set; fails open on any API error so outages can't block signup.
    const verdict = await verifyEmailDeliverability(normalizedEmail);
    if (!verdict.ok) {
      return res.status(400).json({ error: verdict.reason, suggestion: verdict.suggestion || undefined });
    }

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const existing = onSupabase
      ? await usersRepo.getByEmail(normalizedEmail)
      : db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let supabaseUserId = null;
    let requiresEmailConfirmation = false;
    if (isSupabaseEnabled()) {
      try {
        const result = await registerSupabaseUser({
          email: normalizedEmail,
          password,
          name,
          role,
          phone,
          state,
          city,
        });
        const supabaseUser = result?.user;
        supabaseUserId = supabaseUser?.id || null;
        // signUp returns {user, session: null} when "Confirm email" is on
        // in the Supabase dashboard. The user exists but can't sign in until
        // they click the link Supabase emailed them.
        requiresEmailConfirmation = Boolean(
          process.env.SUPABASE_REQUIRE_EMAIL_CONFIRMATION === 'true' &&
            supabaseUser &&
            !supabaseUser.email_confirmed_at &&
            !result.session
        );
      } catch (error) {
        if (isSupabaseDuplicateUserError(error)) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        return res.status(502).json({ error: `Supabase signup failed: ${error.message}` });
      }
    }

    const user = onSupabase
      ? await createUserAsync({ email: normalizedEmail, password, name, role, phone, state, city, supabaseUserId })
      : createLocalUser(db, { email: normalizedEmail, password, name, role, phone, state, city, supabaseUserId });

    // When confirmation is required we DON'T issue a JWT — the frontend
    // shows a "check your email" screen instead of logging the user in.
    if (requiresEmailConfirmation) {
      return res.status(202).json({
        requiresEmailConfirmation: true,
        message: 'Account created. Please check your email to confirm before signing in.',
        user: { email: user.email, name: user.name, role: user.role },
      });
    }

    const token = signToken(user);

    sendEmail({
      to: user.email,
      ...templates.registration(user.name)
    }).catch(err => console.error('Failed to send registration email:', err));

    sendWelcomeSms({
      to: phone,
      name: user.name,
      role: user.role,
    }).catch(err => console.error('Failed to send welcome SMS:', err));

    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    let user = null;

    if (hasSupabasePublicConfig()) {
      try {
        const { user: supabaseUser } = await signInSupabaseUser(normalizedEmail, password);
        if (supabaseUser) {
          user = onSupabase
            ? await syncFromSupabaseAsync(supabaseUser, password)
            : syncLocalUserFromSupabase(db, supabaseUser, password);
        }
      } catch (error) {
        console.warn('Supabase login failed, falling back to local auth:', error.message);
      }
    }

    if (!user) {
      user = onSupabase
        ? await usersRepo.getByEmail(normalizedEmail)
        : db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// POST /api/auth/oauth — exchange a Supabase OAuth access token for our JWT.
// The frontend completes the Google/Facebook redirect flow with supabase-js,
// then posts the Supabase access token here. We verify it with Supabase,
// sync/create the local users row, and return { token, user } exactly like
// /login does. No password is involved — OAuth users keep a random hash.
router.post('/oauth', async (req, res) => {
  try {
    const { access_token } = req.body || {};
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const supabaseUser = await getUserFromToken(access_token);
    if (!supabaseUser || !supabaseUser.email) {
      return res.status(401).json({ error: 'Invalid or expired sign-in session' });
    }

    const metadata = supabaseUser.user_metadata || {};
    const email = normalizeEmail(supabaseUser.email);
    const name = metadata.full_name || metadata.name || email.split('@')[0];
    const avatar = metadata.avatar_url || metadata.picture || null;

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();

    let user;
    if (onSupabase) {
      user = await usersRepo.getBySupabaseUserId(supabaseUser.id);
      if (!user) user = await usersRepo.getByEmail(email);
      if (user) {
        user = await usersRepo.update(user.id, {
          supabase_user_id: user.supabase_user_id || supabaseUser.id,
          name: user.name || name,
        });
      } else {
        user = await createUserAsync({
          email, name, role: 'user', supabaseUserId: supabaseUser.id,
        });
      }
    } else {
      user = db.prepare('SELECT * FROM users WHERE supabase_user_id = ? OR email = ?')
        .get(supabaseUser.id, email);
      if (user) {
        db.prepare(`
          UPDATE users SET
            supabase_user_id = COALESCE(supabase_user_id, ?),
            name = COALESCE(name, ?),
            updated_at = datetime('now')
          WHERE id = ?
        `).run(supabaseUser.id, name, user.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      } else {
        // createLocalUser hashes a random UUID when no password is given, so
        // password login stays impossible until the user sets one.
        user = createLocalUser(db, {
          email, name, role: 'user', supabaseUserId: supabaseUser.id,
        });
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended. Contact support.' });
    }

    const token = signToken(user);
    res.json({ token, user: { ...safeUser(user), avatar: user.avatar || avatar } });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({ error: 'Failed to sign in with social account' });
  }
});

// GET /api/auth/me — returns current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    if (useSupabase()) {
      const user = await usersRepo.getById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const vendorProfile = user.role === 'vendor' ? await vendorsRepo.getByUserId(user.id) : null;
      return res.json({ user: safeUser(user), vendorProfile });
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(user.id);
    }
    res.json({ user: safeUser(user), vendorProfile });
  } catch (err) {
    console.error('auth/me error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const user = onSupabase
      ? await usersRepo.getById(req.user.id)
      : db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (user.supabase_user_id) {
      try {
        await updateSupabaseUserPassword(user.supabase_user_id, newPassword);
      } catch (error) {
        return res.status(502).json({ error: `Supabase password update failed: ${error.message}` });
      }
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    if (onSupabase) {
      await usersRepo.update(req.user.id, { password_hash });
    } else {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(password_hash, req.user.id);
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Per-email forgot-password rate limit: max 3 requests / 15 min / email.
// In-memory only — fine for a single process; resets on restart.
const FORGOT_WINDOW_MS = 15 * 60 * 1000;
const FORGOT_MAX = 3;
const forgotAttempts = new Map(); // email -> { count, resetAt }
const GENERIC_FORGOT_RESPONSE = { message: 'If that email is registered, a reset link has been sent.' };

function forgotPasswordRateLimited(email) {
  const now = Date.now();
  const entry = forgotAttempts.get(email);
  if (!entry || entry.resetAt <= now) {
    forgotAttempts.set(email, { count: 1, resetAt: now + FORGOT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > FORGOT_MAX;
}

// POST /api/auth/forgot-password — sends reset email
// Strategy: prefer Supabase's resetPasswordForEmail (delivers via Supabase's mailer).
// Fall back to local token + SMTP if Supabase isn't configured.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Always return the same generic response, including when rate-limited,
    // so we don't leak which emails are registered or under attack.
    if (forgotPasswordRateLimited(email)) {
      return res.json(GENERIC_FORGOT_RESPONSE);
    }

    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const user = onSupabase
      ? await usersRepo.getByEmail(email)
      : db.prepare('SELECT id, email, name, supabase_user_id FROM users WHERE email = ?').get(email);

    // Always respond with success to avoid leaking which emails are registered.
    const okResponse = GENERIC_FORGOT_RESPONSE;
    if (!user) return res.json(okResponse);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let supabaseSent = false;

    if (user.supabase_user_id && hasSupabasePublicConfig()) {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${frontendUrl}/reset-password`,
      });
      if (!error) supabaseSent = true;
      else console.warn('Supabase reset email failed:', error.message);
    }

    if (!supabaseSent) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      if (onSupabase) {
        await usersRepo.setResetToken(user.id, tokenHash, expiresAt);
      } else {
        db.prepare('UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?')
          .run(tokenHash, expiresAt, user.id);
      }

      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&uid=${user.id}`;
      const tpl = templates.passwordReset(resetUrl);
      await sendEmail({ to: email, ...tpl });
    }

    res.json(okResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to start password reset' });
  }
});

// POST /api/auth/reset-password — completes a local-token reset
router.post('/reset-password', async (req, res) => {
  try {
    const { uid, token, newPassword } = req.body;
    if (!uid || !token || !newPassword) {
      return res.status(400).json({ error: 'uid, token, and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const onSupabase = useSupabase();
    const db = onSupabase ? null : getDb();
    const user = onSupabase
      ? await usersRepo.getById(uid)
      : db.prepare(
          'SELECT id, supabase_user_id, reset_token_hash, reset_token_expires_at FROM users WHERE id = ?'
        ).get(uid);

    if (!user || !user.reset_token_hash || user.reset_token_hash !== tokenHash) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    if (user.supabase_user_id) {
      try {
        await updateSupabaseUserPassword(user.supabase_user_id, newPassword);
      } catch (error) {
        return res.status(502).json({ error: `Supabase password update failed: ${error.message}` });
      }
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    if (onSupabase) {
      await usersRepo.clearResetToken(user.id, password_hash);
    } else {
      db.prepare(
        "UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL, updated_at = datetime('now') WHERE id = ?"
      ).run(password_hash, user.id);
    }

    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
