const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendEmail, templates } = require('../services/emailService');
const realtime = require('../realtime');
const ordersRepo = require('../repos/ordersRepo');
const useSupabase = () => process.env.DATA_BACKEND === 'supabase';

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

  const transaction = db.transaction(() => {
    const orderId = uuidv4();
    let totalAmount = 0;

    // We assume all items in one checkout might belong to different vendors
    // But for simplicity in this schema, an order belongs to ONE vendor.
    // If cart has items from multiple vendors, we should split the order.
    // For now, let's group by vendor and create multiple orders.

    const itemsByVendor = cartItems.reduce((acc, item) => {
      if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
      acc[item.vendor_id].push(item);
      return acc;
    }, {});

    const createdOrders = [];

    for (const vendorId in itemsByVendor) {
      const vendorItems = itemsByVendor[vendorId];
      const vendorOrderId = uuidv4();
      let vendorTotal = 0;

      vendorItems.forEach(item => {
        vendorTotal += item.price * item.quantity;
      });

      // Create Order
      db.prepare(`
        INSERT INTO orders (id, user_id, vendor_id, total_amount, shipping_address, phone, notes, payment_method, status, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
      `).run(vendorOrderId, req.user.id, vendorId, vendorTotal, shippingAddress, phone, notes, paymentMethod);

      // Create Order Items and Update Stock
      vendorItems.forEach(item => {
        db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
          VALUES (?, ?, ?, ?, ?)
        `).run(uuidv4(), vendorOrderId, item.product_id, item.quantity, item.price);

        // Update stock
        db.prepare(`
          UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
        `).run(item.quantity, item.product_id);
      });

      // Create initial notification for vendor
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
    
    // Send order confirmation email (non-blocking)
    const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    sendEmail({
      to: user.email,
      ...templates.orderConfirmation(orderIds[0], totalAmount)
    }).catch(err => console.error('Failed to send order confirmation email:', err));

    // Realtime: clear buyer cart + notify each vendor of new order.
    realtime.emit(`user:${req.user.id}`, 'cart:updated', []);
    orderIds.forEach((oid) => {
      const ord = db.prepare(`
        SELECT o.*, vp.user_id as vendor_user_id, vp.shop_name as vendor_name
        FROM orders o JOIN vendor_profiles vp ON vp.id = o.vendor_id
        WHERE o.id = ?
      `).get(oid);
      if (!ord) return;
      realtime.emit(`user:${ord.vendor_user_id}`, 'order:new', ord);
      realtime.emit(`user:${ord.vendor_user_id}`, 'notification:new', {
        type: 'order_update',
        title: 'New Order',
        message: `New order #${oid.slice(0, 8)} for ₦${ord.total_amount.toLocaleString()}`,
        link: '/vendor/orders',
        created_at: new Date().toISOString(),
      });
      realtime.emit(`user:${req.user.id}`, 'order:new', ord);
      realtime.emit('role:admin', 'order:new', ord);
    });

    res.json({ message: 'Orders created successfully', orderIds });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to process checkout: ' + error.message });
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

    // Fetch items for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, p.name as product_name, p.images
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);
      
      return {
        ...order,
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

// Update order status (Vendor/Admin only)
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (useSupabase()) {
    try {
      const order = await ordersRepo.getBasic(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const vendor = await require('../repos/vendorsRepo').getByUserId(req.user.id);
      const isVendor = vendor && vendor.id === order.vendor_id;
      if (!isVendor && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized to update this order' });
      }
      await ordersRepo.setStatus(id, status);
      const notifId = uuidv4();
      const notifMsg = `Your order #${id.slice(0, 8)} status is now: ${status}`;
      await require('../repos/notificationsRepo').create({
        id: notifId, userId: order.user_id, type: 'order_update', title: 'Order Status Updated', message: notifMsg,
      });
      realtime.emit(`user:${order.user_id}`, 'order:updated', { id, status });
      realtime.emit(`user:${order.user_id}`, 'notification:new', {
        id: notifId, type: 'order_update', title: 'Order Status Updated', message: notifMsg,
        link: '/user/orders', created_at: new Date().toISOString(),
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
    if (!isVendor && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to update this order' });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);

    // Notify user
    const notifId = uuidv4();
    const notifMsg = `Your order #${id.slice(0, 8)} status is now: ${status}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message)
      VALUES (?, ?, 'order_update', 'Order Status Updated', ?)
    `).run(notifId, order.user_id, notifMsg);

    realtime.emit(`user:${order.user_id}`, 'order:updated', { id, status });
    realtime.emit(`user:${order.user_id}`, 'notification:new', {
      id: notifId,
      type: 'order_update',
      title: 'Order Status Updated',
      message: notifMsg,
      link: '/user/orders',
      created_at: new Date().toISOString(),
    });

    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
