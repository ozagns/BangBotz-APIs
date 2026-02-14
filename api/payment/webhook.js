// api/payment/webhook.js
import { validateCallbackSignature } from '../../lib/tripay.js';
import { connectDB } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get callback signature from header
    const callbackSignature = req.headers['x-callback-signature'];
    const json = JSON.stringify(req.body);

    // Validate signature
    if (!validateCallbackSignature(callbackSignature, json)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { reference, merchant_ref, status, amount } = req.body;

    console.log('Tripay webhook received:', { reference, merchant_ref, status });

    // Only process PAID status
    if (status !== 'PAID') {
      return res.status(200).json({ message: 'Status not PAID, ignored' });
    }

    const { db } = await connectDB();
    const transactions = db.collection('transactions');
    const users = db.collection('users');

    // Find transaction
    const transaction = await transactions.findOne({
      tripayReference: reference,
      merchantRef: merchant_ref
    });

    if (!transaction) {
      console.error('Transaction not found:', { reference, merchant_ref });
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if already processed
    if (transaction.status === 'PAID') {
      console.log('Transaction already processed:', reference);
      return res.status(200).json({ message: 'Already processed' });
    }

    // Update transaction status
    await transactions.updateOne(
      { tripayReference: reference },
      {
        $set: {
          status: 'PAID',
          paidAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Upgrade user plan
    const planConfig = {
      'premium': {
        limit: 50000,
        tier: 'premium'
      },
      'vip': {
        limit: 999999999,
        tier: 'vip'
      }
    };

    const config = planConfig[transaction.plan];

    await users.updateOne(
      { apikey: transaction.apikey },
      {
        $set: {
          tier: config.tier,
          limit: config.limit,
          requests: 0, // Reset counter
          resetMonth: new Date().toISOString().slice(0, 7),
          upgradedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('User upgraded successfully:', {
      apikey: transaction.apikey,
      plan: transaction.plan,
      tier: config.tier
    });

    // TODO: Send email/WA notification to user
    // sendUpgradeNotification(transaction.userId, config.tier);

    res.status(200).json({
      success: true,
      message: 'Payment processed and user upgraded'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}