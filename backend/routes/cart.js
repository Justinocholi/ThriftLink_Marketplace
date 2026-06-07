const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const realtime = require('../realtime');

const db = getDb();

function emitCart(userId) {
  try {
    const items = db.prepare(`
      SELECT c.*, p.name, p.price, p.images, p.stock_quantity, v.shop_name
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      JOIN vendor_profiles v ON p.vendor_id = v.id
      WHERE c.user_id = ?
    `).all(userId);
    const formatted = items.map((i) => ({ ...i, images: JSON.parse(i.images || '[]') }));
    realtime.emit(`user:${userId}`, 'cart:updated', formatted);
  } catch {}
}

// Apply role restriction to all cart routes
router.use(authenticate, requireRole('user'));

// Get user's cart
router.get('/', (req, res) => {
  try {
    const cartItems = db.prepare(`
      SELECT c.*, p.name, p.price, p.images, p.stock_quantity, v.shop_name 
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      JOIN vendor_profiles v ON p.vendor_id = v.id
      WHERE c.user_id = ?
    `).all(req.user.id);
    
    // Parse images JSON
    const formattedItems = cartItems.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));
    
    res.json(formattedItems);
  } catch (error) {
    console.error('Fetch cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Check if product exists and has enough stock
    const product = db.prepare('SELECT id, stock_quantity FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
      .get(req.user.id, productId);

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(newQuantity, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), req.user.id, productId, quantity);
    }

    emitCart(req.user.id);
    res.json({ message: 'Item added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item quantity
router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  const { id } = req.params;

  if (quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  try {
    // Check stock
    const item = db.prepare('SELECT product_id FROM cart_items WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const product = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.product_id);
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(quantity, id);

    emitCart(req.user.id);
    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    emitCart(req.user.id);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Clear cart
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    realtime.emit(`user:${req.user.id}`, 'cart:updated', []);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
