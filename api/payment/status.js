// api/payment/status.js
import { validateApiKey } from '../../lib/middleware.js';
import { connectDB } from '../../lib/database.js';
import { getTransactionDetail } from '../../lib/tripay.js';

export default async function handler(req, res) {
  const { apikey, reference } = req.query;

  // Validate API Key
  const auth = await validateApiKey(apikey);
  
  if (!auth.valid) {
    return res.status(auth.code).json({
      status: false,
      message: auth.message
    });
  }

  if (!reference) {
    return res.status(400).json({
      status: false,
      message: 'Parameter "reference" is required'
    });
  }

  try {
    const { db } = await connectDB();
    const transactions = db.collection('transactions');

    // Get transaction from database
    const transaction = await transactions.findOne({
      $or: [
        { tripayReference: reference },
        { merchantRef: reference }
      ],
      apikey: apikey
    });

    if (!transaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    // Get latest status from Tripay
    let tripayStatus = null;
    try {
      tripayStatus = await getTransactionDetail(transaction.tripayReference);
    } catch (error) {
      console.error('Error getting Tripay status:', error);
    }

    // Update status if different
    if (tripayStatus && tripayStatus.status !== transaction.status) {
      await transactions.updateOne(
        { _id: transaction._id },
        {
          $set: {
            status: tripayStatus.status,
            updatedAt: new Date()
          }
        }
      );
      transaction.status = tripayStatus.status;
    }

    res.status(200).json({
      status: true,
      data: {
        merchantRef: transaction.merchantRef,
        reference: transaction.tripayReference,
        plan: transaction.plan,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        checkoutUrl: transaction.checkoutUrl,
        qrUrl: transaction.qrUrl,
        payCode: transaction.payCode,
        expiredAt: transaction.expiredAt,
        paidAt: transaction.paidAt || null,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to get payment status'
    });
  }
}