const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail, templates } = require('../services/emailService');
const {
  isSupabaseEnabled,
  hasSupabasePublicConfig,
  registerSupabaseUser,
  signInSupabaseUser,
  updateSupabaseUserPassword,
} = require('../services/supabaseService');
const { sendWelcomeSms } = require('../services/termiiService');

const router = express.Router();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

function safeUser(user) {
  const { password_hash, ...safe } = user;
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

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let supabaseUserId = null;
    if (isSupabaseEnabled()) {
      try {
        const { user: supabaseUser } = await registerSupabaseUser({
          email: normalizedEmail,
          password,
          name,
          role,
          phone,
          state,
          city,
        });
        supabaseUserId = supabaseUser?.id || null;
      } catch (error) {
        if (isSupabaseDuplicateUserError(error)) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        return res.status(502).json({ error: `Supabase signup failed: ${error.message}` });
      }
    }

    const user = createLocalUser(db, {
      email: normalizedEmail,
      password,
      name,
      role,
      phone,
      state,
      city,
      supabaseUserId,
    });
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

    const db = getDb();
    let user = null;

    if (hasSupabasePublicConfig()) {
      try {
        const { user: supabaseUser } = await signInSupabaseUser(normalizedEmail, password);
        if (supabaseUser) {
          user = syncLocalUserFromSupabase(db, supabaseUser, password);
        }
      } catch (error) {
        console.warn('Supabase login failed, falling back to local auth:', error.message);
      }
    }

    if (!user) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
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

// GET /api/auth/me — returns current user info
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let vendorProfile = null;
  if (user.role === 'vendor') {
    vendorProfile = db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(user.id);
  }

  res.json({ user: safeUser(user), vendorProfile });
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

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
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
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(password_hash, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
