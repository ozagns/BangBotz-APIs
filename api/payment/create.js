// api/payment/create.js
import { validateApiKey } from '../../lib/middleware.js';
import { createTransaction } from '../../lib/tripay.js';
import { connectDB } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: false,
      message: 'Method not allowed'
    });
  }

  const { apikey, plan, paymentMethod } = req.body;

  // Validate API Key
  const auth = await validateApiKey(apikey);
  
  if (!auth.valid) {
    return res.status(auth.code).json({
      status: false,
      message: auth.message
    });
  }

  // Validate plan
  const plans = {
    'premium': {
      price: 50000,
      name: 'Premium Plan',
      requests: 50000
    },
    'vip': {
      price: 150000,
      name: 'VIP Plan',
      requests: 999999999
    }
  };

  if (!plans[plan]) {
    return res.status(400).json({
      status: false,
      message: 'Invalid plan. Choose: premium or vip'
    });
  }

  // Validate payment method
  const validMethods = ['QRIS', 'BRIVA', 'MANDIRIVA', 'BNIIVA', 'BCAVA', 'ALFAMART', 'INDOMARET'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      status: false,
      message: `Invalid payment method. Choose: ${validMethods.join(', ')}`
    });
  }

  try {
    const { db } = await connectDB();
    const transactions = db.collection('transactions');
    const users = db.collection('users');

    // Get user data
    const user = await users.findOne({ apikey });

    // Generate unique merchant ref
    const merchantRef = `BBZ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create transaction in Tripay
    const tripayTransaction = await createTransaction({
      method: paymentMethod,
      merchantRef: merchantRef,
      amount: plans[plan].price,
      customerName: user.username,
      customerEmail: user.email || `${user.username}@bangbotz.api`,
      customerPhone: user.phone || '081234567890',
      orderItems: [
        {
          name: plans[plan].name,
          price: plans[plan].price,
          quantity: 1
        }
      ],
      returnUrl: `${process.env.BASE_URL || 'https://bangbotz-apis.vercel.app'}/payment/success`,
      expiredTime: 86400 // 24 hours
    });

    // Save transaction to database
    await transactions.insertOne({
      merchantRef: merchantRef,
      tripayReference: tripayTransaction.reference,
      apikey: apikey,
      userId: user._id,
      plan: plan,
      amount: plans[plan].price,
      paymentMethod: paymentMethod,
      status: 'UNPAID',
      checkoutUrl: tripayTransaction.checkout_url,
      qrUrl: tripayTransaction.qr_url || null,
      payCode: tripayTransaction.pay_code || null,
      expiredAt: new Date(tripayTransaction.expired_time * 1000),
      createdAt: new Date()
    });

    res.status(200).json({
      status: true,
      message: 'Invoice created successfully',
      data: {
        merchantRef: merchantRef,
        reference: tripayTransaction.reference,
        amount: plans[plan].price,
        fee: tripayTransaction.total_fee,
        totalAmount: tripayTransaction.amount_received,
        paymentMethod: paymentMethod,
        checkoutUrl: tripayTransaction.checkout_url,
        qrUrl: tripayTransaction.qr_url,
        payCode: tripayTransaction.pay_code,
        expiredAt: new Date(tripayTransaction.expired_time * 1000),
        instructions: tripayTransaction.instructions
      }
    });
  } catch (error) {
    console.error('Payment create error:', error);
    res.status(500).json({
      status: false,
      message: error.message || 'Failed to create payment'
    });
  }
}