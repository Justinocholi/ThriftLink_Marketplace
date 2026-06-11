const express = require('express');
const router = express.Router();

// GET /api/payment/account — public, returns destination bank account for manual transfers
router.get('/account', (_req, res) => {
  res.json({
    bankName: process.env.PAYMENT_BANK_NAME || '',
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || '',
    accountName: process.env.PAYMENT_ACCOUNT_NAME || '',
    instructions:
      'Transfer the exact total to the account above. After paying, open your order in your dashboard and submit the transfer reference so we can confirm payment and notify the vendor.',
  });
});

module.exports = router;
