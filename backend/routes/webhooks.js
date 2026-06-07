const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const db = getDb();

// Paystack Webhook Handler
router.post('/paystack', (req, res) => {
  // Validate Paystack signature
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];
  
  if (!signature) {
    return res.status(401).send('No signature');
  }

  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Webhook is valid
  const event = req.body;
  
  if (event.event === 'charge.success') {
    const data = event.data;
    const orderId = data.metadata?.order_id;
    const transactionRef = data.reference;

    // Use a transaction to update order and create transaction record
    const transaction = db.transaction(() => {
      // Check if transaction already processed
      const existing = db.prepare('SELECT id FROM transactions WHERE transaction_ref = ?').get(transactionRef);
      if (existing) return;

      // Update Order
      if (orderId) {
        db.prepare(`
          UPDATE orders SET 
            payment_status = 'paid', 
            status = 'confirmed',
            updated_at = datetime('now') 
          WHERE id = ?
        `).run(orderId);

        // Record Transaction
        db.prepare(`
          INSERT INTO transactions (id, order_id, transaction_ref, amount, status, raw_response)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), orderId, transactionRef, data.amount / 100, data.status, JSON.stringify(data));
        
        // Notify user
        const order = db.prepare('SELECT user_id FROM orders WHERE id = ?').get(orderId);
        if (order) {
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message)
            VALUES (?, ?, 'payment_update', 'Payment Successful', ?)
          `).run(uuidv4(), order.user_id, `Payment for order #${orderId.slice(0, 8)} was successful.`);
        }
      }
    });

    try {
      transaction();
    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).send('Processing failed');
    }
  }

  res.status(200).send('OK');
});

module.exports = router;
