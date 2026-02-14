// lib/tripay.js
import axios from 'axios';
import crypto from 'crypto';

const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY;
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE;
const TRIPAY_MODE = process.env.TRIPAY_MODE || 'sandbox'; // 'sandbox' or 'production'

const BASE_URL = TRIPAY_MODE === 'production' 
  ? 'https://tripay.co.id/api'
  : 'https://tripay.co.id/api-sandbox';

// Get available payment channels
export async function getPaymentChannels() {
  try {
    const response = await axios.get(`${BASE_URL}/merchant/payment-channel`, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('Tripay get channels error:', error.response?.data);
    throw new Error('Failed to get payment channels');
  }
}

// Create payment transaction
export async function createTransaction(params) {
  const {
    method,        // Payment channel code (e.g., 'QRIS', 'BRIVA', 'MANDIRIVA')
    merchantRef,   // Unique order ID dari kamu
    amount,        // Amount in IDR
    customerName,
    customerEmail,
    customerPhone,
    orderItems,    // Array of items
    returnUrl,     // Redirect URL after payment
    expiredTime    // In seconds (default 24 jam)
  } = params;

  try {
    const signature = generateSignature(merchantRef, amount);

    const data = {
      method,
      merchant_ref: merchantRef,
      amount,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      order_items: orderItems,
      return_url: returnUrl,
      expired_time: expiredTime || 86400, // 24 hours
      signature
    };

    const response = await axios.post(`${BASE_URL}/transaction/create`, data, {
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('Tripay create transaction error:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to create transaction');
  }
}

// Get transaction detail
export async function getTransactionDetail(reference) {
  try {
    const response = await axios.get(`${BASE_URL}/transaction/detail`, {
      params: { reference },
      headers: {
        'Authorization': `Bearer ${TRIPAY_API_KEY}`
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('Tripay get detail error:', error.response?.data);
    throw new Error('Failed to get transaction detail');
  }
}

// Generate signature for transaction
function generateSignature(merchantRef, amount) {
  const data = TRIPAY_MERCHANT_CODE + merchantRef + amount;
  return crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(data)
    .digest('hex');
}

// Validate callback signature
export function validateCallbackSignature(callbackSignature, json) {
  const signature = crypto
    .createHmac('sha256', TRIPAY_PRIVATE_KEY)
    .update(json)
    .digest('hex');

  return signature === callbackSignature;
}

// Helper: Get payment instructions
export function getPaymentInstructions(channel, data) {
  const instructions = {
    'QRIS': {
      title: 'Scan QRIS Code',
      steps: [
        'Buka aplikasi e-wallet/mobile banking kamu',
        'Pilih menu Scan QR / QRIS',
        'Scan QR code di bawah',
        'Konfirmasi pembayaran',
        'Screenshot bukti pembayaran'
      ],
      qrUrl: data.qr_url
    },
    'BRIVA': {
      title: 'Transfer ke Virtual Account BRI',
      steps: [
        `Transfer ke VA: ${data.pay_code}`,
        `Jumlah: Rp ${data.amount.toLocaleString('id-ID')}`,
        'Melalui ATM/Mobile Banking/Teller BRI',
        'Simpan bukti transfer',
        'Pembayaran otomatis terverifikasi'
      ]
    },
    'MANDIRIVA': {
      title: 'Transfer ke Virtual Account Mandiri',
      steps: [
        `Transfer ke VA: ${data.pay_code}`,
        `Jumlah: Rp ${data.amount.toLocaleString('id-ID')}`,
        'Melalui ATM/Mobile Banking/Teller Mandiri',
        'Simpan bukti transfer'
      ]
    }
  };

  return instructions[channel] || {
    title: 'Instruksi Pembayaran',
    steps: [
      'Ikuti instruksi pembayaran yang diberikan',
      'Selesaikan pembayaran sebelum expired',
      'Pembayaran akan diverifikasi otomatis'
    ]
  };
}