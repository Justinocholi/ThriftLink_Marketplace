const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendEmail, templates } = require('../services/emailService');
const realtime = require('../realtime');
const ordersRepo = require('../repos/ordersRepo');
const messagesRepo = require('../repos/messagesRepo');
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

// Build the formatted in-app DM body that gets sent to a vendor when a buyer
// completes checkout. Keeps the same shape as the WhatsApp message so the
// vendor sees a familiar layout in their inbox.
function buildVendorOrderDm({ buyerName, items, total, shippingAddress, phone, notes, orderId }) {
  const lines = [];
  lines.push(`🛍️ New order from ${buyerName || 'a buyer'}`);
  lines.push('');
  items.forEach((it, i) => {
    const qty = it.quantity || 1;
    const subtotal = (Number(it.price) || 0) * qty;
    const title = it.name || it.product_name || 'Item';
    lines.push(`${i + 1}. ${title} × ${qty} — ₦${subtotal.toLocaleString()}`);
  });
  lines.push('');
  lines.push(`Total: ₦${Number(total).toLocaleString()}`);
  if (shippingAddress) lines.push(`\nDelivery: ${shippingAddress}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push('');
  lines.push(`Order ID: ${String(orderId).slice(0, 8)}`);
  return lines.join('\n');
}

// Inserts a DM from buyer → vendor with the formatted order list, then emits
// realtime events to both ends. Never throws — order creation must not fail
// because the auto-DM did.
async function sendOrderDm({ buyerId, buyerName, vendorUserId, content, supabase }) {
  if (!vendorUserId || vendorUserId === buyerId) return;
  try {
    const id = uuidv4();
    let newMessage;
    if (supabase) {
      newMessage = await messagesRepo.send({
        id, senderId: buyerId, receiverId: vendorUserId, content, imageUrl: null,
      });
    } else {
      const db = getDb();
      db.prepare(
        'INSERT INTO messages (id, sender_id, receiver_id, content, image_url) VALUES (?, ?, ?, ?, ?)'
      ).run(id, buyerId, vendorUserId, content, null);
      newMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    }
    realtime.emit(
      [`user:${vendorUserId}`, `user:${buyerId}`],
      'message:new',
      { ...newMessage, sender_name: buyerName }
    );
  } catch (err) {
    console.error('Auto-DM order to vendor failed:', err);
  }
}

// SQLite handle is created on demand inside each handler so the sqlite db
// file is never opened in supabase mode.
const sqliteDb = () => getDb();
const db = new Proxy({}, {
  get(_t, prop) {
    return sqliteDb()[prop];
  },
});

// Create new order (Checkout) - Users only
router.post('/', authenticate, requireRole('user'), async (req, res) => {
  const { cartItems, shippingAddress, phone, notes, paymentMethod } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Supabase: delegate the whole atomic checkout to the place_order RPC.
  if (useSupabase()) {
    try {
      const orderIds = await ordersRepo.placeOrder(req.user.id, {
        shippingAddress, phone, notes, paymentMethod,
        items: cartItems.map((i) => ({
          product_id: i.product_id, vendor_id: i.vendor_id, price: i.price, quantity: i.quantity,
        })),
      });
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const user = await require('../repos/usersRepo').getById(req.user.id);
      if (user?.email) {
        sendEmail({ to: user.email, ...templates.orderConfirmation(orderIds[0], totalAmount) }).catch(() => {});
      }
      realtime.emit(`user:${req.user.id}`, 'cart:updated', []);
      for (const oid of orderIds) {
        const ord = await ordersRepo.getById(oid, req.user.id);
        if (!ord) continue;
        const vendorUserId = ord.vendor_user_id;
        if (vendorUserId) {
          realtime.emit(`user:${vendorUserId}`, 'order:new', ord);
          realtime.emit(`user:${vendorUserId}`, 'notification:new', {
            type: 'order_update', title: 'New Order',
            message: `New order #${oid.slice(0, 8)} for ₦${Number(ord.total_amount).toLocaleString()}`,
            link: '/vendor/orders', created_at: new Date().toISOString(),
          });
          // Auto-DM the formatted order list to the vendor inbox.
          const dmContent = buildVendorOrderDm({
            buyerName: user?.name || req.user.name,
            items: (ord.items || []).map((it) => ({
              name: it.product_name || it.name, quantity: it.quantity, price: it.price_at_purchase || it.price,
            })),
            total: ord.total_amount,
            shippingAddress, phone, notes,
            orderId: oid,
          });
          await sendOrderDm({
            buyerId: req.user.id,
            buyerName: user?.name || req.user.name,
            vendorUserId,
            content: dmContent,
            supabase: true,
          });
        }
        realtime.emit(`user:${req.user.id}`, 'order:new', ord);
        realtime.emit('role:admin', 'order:new', ord);
      }
      return res.json({ message: 'Orders created successfully', orderIds });
    } catch (error) {
      console.error('Checkout (supabase) error:', error);
      const msg = String(error?.message || '');
      const stockMatch = msg.match(/INSUFFICIENT_STOCK:([0-9a-f-]+)/i);
      if (stockMatch) {
        return res.status(409).json({ error: 'A product in your cart sold out before checkout completed.', productId: stockMatch[1] });
      }
      const missingMatch = msg.match(/PRODUCT_NOT_FOUND:([0-9a-f-]+)/i);
      if (missingMatch) {
        return res.status(404).json({ error: 'A product in your cart no longer exists.', productId: missingMatch[1] });
      }
      return res.status(500).json({ error: 'Failed to process checkout: ' + msg });
    }
  }

  // Trust nothing from the client cart payload other than product_id +
  // quantity. Price and vendor_id come from the DB. This block runs OUTSIDE
  // the better-sqlite3 transaction because it can return validation errors
  // (4xx) to the caller; the actual writes happen atomically below.
  const resolvedItems = [];
  for (const item of cartItems) {
    const productId = item && item.product_id;
    const qty = Math.max(1, parseInt(item && item.quantity, 10) || 0);
    if (!productId || qty < 1) {
      return res.status(400).json({ error: 'Invalid cart item' });
    }
    const product = db.prepare(
      'SELECT id, price, vendor_id, stock_quantity, is_available, name FROM products WHERE id = ?'
    ).get(productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found`, productId });
    }
    if (!product.is_available) {
      return res.status(400).json({ error: `Product unavailable: ${product.name}`, productId });
    }
    if (product.stock_quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}`, productId });
    }
    resolvedItems.push({
      product_id: product.id,
      vendor_id: product.vendor_id,
      price: product.price,
      quantity: qty,
    });
  }

  const transaction = db.transaction(() => {
    // Group by the DB-resolved vendor (not the client's claimed vendor_id).
    const itemsByVendor = resolvedItems.reduce((acc, item) => {
      if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
      acc[item.vendor_id].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    for (const vendorId in itemsByVendor) {
      const vendorItems = itemsByVendor[vendorId];
      const vendorOrderId = uuidv4();
      const vendorTotal = vendorItems.reduce((s, it) => s + it.price * it.quantity, 0);

      db.prepare(`
        INSERT INTO orders (id, user_id, vendor_id, total_amount, shipping_address, phone, notes, payment_method, status, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
      `).run(vendorOrderId, req.user.id, vendorId, vendorTotal, shippingAddress, phone, notes, paymentMethod);

      vendorItems.forEach((item) => {
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), vendorOrderId, item.product_id, item.quantity, item.price);

        // Conditional stock decrement guards against a race that would push
        // stock negative (the pre-check above is best-effort, not a lock).
        const upd = db.prepare(`
          UPDATE products SET stock_quantity = stock_quantity - ?
          WHERE id = ? AND stock_quantity >= ?
        `).run(item.quantity, item.product_id, item.quantity);
        if (upd.changes === 0) {
          // Abort the whole transaction.
          throw new Error(`INSUFFICIENT_STOCK:${item.product_id}`);
        }
      });

      // Initial status history entry.
      try {
        db.prepare(`
          INSERT INTO order_status_history (id, order_id, status, note, changed_by_user_id)
          VALUES (?, ?, 'pending', 'Order placed', ?)
        `).run(uuidv4(), vendorOrderId, req.user.id);
      } catch (e) { /* table may not exist on old DBs */ }

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message)
        SELECT ?, user_id, 'order_update', 'New Order Received', ?
        FROM vendor_profiles WHERE id = ?
      `).run(uuidv4(), `You have a new order (#${vendorOrderId.slice(0, 8)}) for ₦${vendorTotal.toLocaleString()}`, vendorId);

      createdOrders.push(vendorOrderId);
    }

    // Clear user's cart after successful order
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return createdOrders;
  });

  try {
    const orderIds = transaction();
    
    // Send order confirmation email (non-blocking). Use DB-side prices.
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);
    const totalAmount = resolvedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    sendEmail({
      to: user.email,
      ...templates.orderConfirmation(orderIds[0], totalAmount)
    }).catch(err => console.error('Failed to send order confirmation email:', err));

    // Realtime: clear buyer cart + notify each vendor of new order.
    realtime.emit(`user:${req.user.id}`, 'cart:updated', []);
    for (const oid of orderIds) {
      const ord = db.prepare(`
        SELECT o.*, vp.user_id as vendor_user_id, vp.shop_name as vendor_name
        FROM orders o JOIN vendor_profiles vp ON vp.id = o.vendor_id
        WHERE o.id = ?
      `).get(oid);
      if (!ord) continue;
      realtime.emit(`user:${ord.vendor_user_id}`, 'order:new', ord);
      realtime.emit(`user:${ord.vendor_user_id}`, 'notification:new', {
        type: 'order_update',
        title: 'New Order',
        message: `New order #${oid.slice(0, 8)} for ₦${ord.total_amount.toLocaleString()}`,
        link: '/vendor/orders',
        created_at: new Date().toISOString(),
      });
      // Auto-DM the formatted order list to the vendor inbox.
      if (ord.vendor_user_id) {
        const items = db.prepare(`
          SELECT oi.quantity, oi.price_at_purchase as price, p.name
          FROM order_items oi JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = ?
        `).all(oid);
        const dmContent = buildVendorOrderDm({
          buyerName: user?.name || req.user.name,
          items,
          total: ord.total_amount,
          shippingAddress, phone, notes,
          orderId: oid,
        });
        await sendOrderDm({
          buyerId: req.user.id,
          buyerName: user?.name || req.user.name,
          vendorUserId: ord.vendor_user_id,
          content: dmContent,
          supabase: false,
        });
      }
      realtime.emit(`user:${req.user.id}`, 'order:new', ord);
      realtime.emit('role:admin', 'order:new', ord);
    }

    res.json({ message: 'Orders created successfully', orderIds });
  } catch (error) {
    console.error('Checkout error:', error);
    const msg = String(error?.message || '');
    const stockMatch = msg.match(/INSUFFICIENT_STOCK:([0-9a-f-]+)/i);
    if (stockMatch) {
      return res.status(409).json({
        error: 'A product in your cart sold out before checkout completed.',
        productId: stockMatch[1],
      });
    }
    res.status(500).json({ error: 'Failed to process checkout: ' + msg });
  }
});

// Get user's orders - Users only
router.get('/my-orders', authenticate, requireRole('user'), async (req, res) => {
  if (useSupabase()) {
    try {
      const orders = await ordersRepo.listForUser(req.user.id);
      return res.json(orders.map((o) => ({ ...o, items: (o.items || []).map((it) => ({ ...it, images: JSON.parse(it.images || '[]') })) })));
    } catch (error) {
      console.error('Fetch orders (supabase) error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }
  try {
    const orders = db.prepare(`
      SELECT o.*, vp.shop_name as vendor_name 
      FROM orders o
      JOIN vendor_profiles vp ON o.vendor_id = vp.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    // Fetch items + status history for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, p.name as product_name, p.images
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);

      let status_history = [];
      try {
        status_history = db.prepare(`
          SELECT id, status, note, created_at
          FROM order_status_history
          WHERE order_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `).all(order.id);
      } catch (e) { /* ignore */ }

      return {
        ...order,
        status_history,
        items: items.map(item => ({
          ...item,
          images: JSON.parse(item.images || '[]')
        }))
      };
    });

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/:id', authenticate, async (req, res) => {
  if (useSupabase()) {
    try {
      const order = await ordersRepo.getById(req.params.id, req.user.id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      // Permission: buyer, the vendor's user, or admin.
      const isOwner = order.user_id === req.user.id || order.vendor_user_id === req.user.id || req.user.role === 'admin';
      if (!isOwner) return res.status(404).json({ error: 'Order not found' });
      return res.json({ ...order, items: (order.items || []).map((it) => ({ ...it, images: JSON.parse(it.images || '[]') })) });
    } catch (error) {
      console.error('Fetch order detail (supabase) error:', error);
      return res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }
  try {
    const order = db.prepare(`
      SELECT o.*, vp.shop_name as vendor_name, vp.whatsapp_number as vendor_whatsapp
      FROM orders o
      JOIN vendor_profiles vp ON o.vendor_id = vp.id
      WHERE o.id = ? AND (o.user_id = ? OR o.vendor_id = (SELECT id FROM vendor_profiles WHERE user_id = ?))
    `).get(req.params.id, req.user.id, req.user.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, p.images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({
      ...order,
      items: items.map(item => ({
        ...item,
        images: JSON.parse(item.images || '[]')
      }))
    });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Allowed status transitions. `pending → confirmed → shipped → delivered`.
// Cancellation only allowed from pending/confirmed (admin can cancel after shipped).
const FORWARD = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
function isValidTransition(from, to, isAdmin) {
  if (from === to) return false;
  if (to === 'cancelled') {
    if (from === 'pending' || from === 'confirmed') return true;
    if (from === 'shipped' && isAdmin) return true;
    return false;
  }
  return FORWARD[from] === to;
}

// Update order status (Vendor/Admin only)
router.put('/:id/status', authenticate, async (req, res) => {
  const { status, note } = req.body;
  const { id } = req.params;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (useSupabase()) {
    try {
      const order = await ordersRepo.getBasic(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const vendor = await require('../repos/vendorsRepo').getByUserId(req.user.id);
      const isVendor = vendor && vendor.id === order.vendor_id;
      const isAdmin = req.user.role === 'admin';
      if (!isVendor && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to update this order' });
      }
      if (!isValidTransition(order.status, status, isAdmin)) {
        return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
      }
      await ordersRepo.setStatus(id, status);
      const notifId = uuidv4();
      const notifMsg = `Your order #${id.slice(0, 8)} status is now: ${status}`;
      await require('../repos/notificationsRepo').create({
        id: notifId, userId: order.user_id, type: 'order_update', title: 'Order Status Updated', message: notifMsg,
      });
      const updatedAt = new Date().toISOString();
      realtime.emit(`user:${order.user_id}`, 'order:updated', { id, status });
      realtime.emit(`user:${order.user_id}`, 'order:status', { order_id: id, status, updated_at: updatedAt, note: note || null });
      realtime.emit(`user:${order.user_id}`, 'notification:new', {
        id: notifId, type: 'order_update', title: 'Order Status Updated', message: notifMsg,
        link: '/user/orders', created_at: updatedAt,
      });
      return res.json({ message: 'Order status updated' });
    } catch (error) {
      console.error('Update order status (supabase) error:', error);
      return res.status(500).json({ error: 'Failed to update order status' });
    }
  }

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check permission (must be the vendor of this order or admin)
    const isVendor = db.prepare('SELECT id FROM vendor_profiles WHERE user_id = ? AND id = ?').get(req.user.id, order.vendor_id);
    const isAdmin = req.user.role === 'admin';
    if (!isVendor && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to update this order' });
    }

    if (!isValidTransition(order.status, status, isAdmin)) {
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);

    // Record status history (table may not exist on very old DBs).
    try {
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note, changed_by_user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, status, note || null, req.user.id);
    } catch (e) { /* ignore */ }

    // Notify user
    const notifId = uuidv4();
    const notifMsg = `Your order #${id.slice(0, 8)} status is now: ${status}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message)
      VALUES (?, ?, 'order_update', 'Order Status Updated', ?)
    `).run(notifId, order.user_id, notifMsg);

    const updatedAt = new Date().toISOString();
    realtime.emit(`user:${order.user_id}`, 'order:updated', { id, status });
    realtime.emit(`user:${order.user_id}`, 'order:status', { order_id: id, status, updated_at: updatedAt, note: note || null });
    realtime.emit(`user:${order.user_id}`, 'notification:new', {
      id: notifId,
      type: 'order_update',
      title: 'Order Status Updated',
      message: notifMsg,
      link: '/user/orders',
      created_at: updatedAt,
    });

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
