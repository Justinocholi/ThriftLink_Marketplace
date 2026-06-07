const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail, templates } = require('../services/emailService');

const router = express.Router();

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

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name, role = 'user', phone, state, city } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!['user', 'vendor'].includes(role)) {
    return res.status(400).json({ error: 'Role must be user or vendor' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const id = uuidv4();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, state, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), password_hash, name, role, phone || null, state || null, city || null);

  // If registering as vendor, create a blank vendor profile
  if (role === 'vendor') {
    const vpId = uuidv4();
    db.prepare(`
      INSERT INTO vendor_profiles (id, user_id, shop_name, whatsapp_number, category, state, city)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(vpId, id, name + ' Shop', phone || '', 'General', state || '', city || '');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const token = signToken(user);

  // Send welcome email (non-blocking)
  sendEmail({
    to: user.email,
    ...templates.registration(user.name)
  }).catch(err => console.error('Failed to send registration email:', err));

  res.status(201).json({ token, user: safeUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Account suspended. Contact support.' });
  }

  const token = signToken(user);
  res.json({ token, user: safeUser(user) });
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
router.put('/change-password', authenticate, (req, res) => {
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

  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(password_hash, req.user.id);

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
