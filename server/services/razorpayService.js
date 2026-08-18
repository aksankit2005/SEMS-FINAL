import crypto from 'crypto';
import axios from 'axios';
import { envConfig } from '../config/env.js';

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1';

/**
 * Helper to obtain Razorpay credentials
 */
export const getRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || envConfig.razorpayKeySecret || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;
  return { keyId, keySecret, webhookSecret };
};

/**
 * HTTP Basic Authentication headers for Razorpay REST API
 */
const getAuthHeaders = () => {
  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) {
    return null;
  }
  const token = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * 1. Create Razorpay Order via Orders API with Auto-Capture enabled at order level
 */
export const createRazorpayOrder = async ({
  amount, // amount in paise (e.g. 50000 for ₹500)
  currency = 'INR',
  receipt,
  notes = {},
  payment_capture = 1,
}) => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const amountInPaise = Math.round(Number(amount));

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [Razorpay] Keys not configured in non-production. Generating mock order.');
      return {
        id: `order_mock_${Math.random().toString(36).substring(2, 12)}`,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: 'created',
        attempts: 0,
        notes,
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing on the server.');
  }

  const payload = {
    amount: amountInPaise,
    currency: currency.toUpperCase(),
    receipt: (receipt || `rcpt_${Date.now()}`).substring(0, 40),
    payment_capture: 1, // 1 forces automatic capture on authorization
    notes: {
      ...notes,
      platform: 'APEX Championship Portal',
      generated_at: new Date().toISOString(),
    },
  };

  const response = await axios.post(`${RAZORPAY_BASE_URL}/orders`, payload, {
    headers: getAuthHeaders(),
    timeout: 10000,
  });

  return response.data;
};

/**
 * 2. Fetch real-time payment status from Razorpay API
 */
export const fetchRazorpayPayment = async (paymentId) => {
  const { keyId, keySecret } = getRazorpayCredentials();

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        id: paymentId,
        entity: 'payment',
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        captured: true,
      };
    }
    throw new Error('Razorpay credentials missing on server.');
  }

  const response = await axios.get(`${RAZORPAY_BASE_URL}/payments/${paymentId}`, {
    headers: getAuthHeaders(),
    timeout: 10000,
  });

  return response.data;
};

/**
 * 3. Server-side Capture API: Moves an authorized payment to captured
 */
export const captureRazorpayPayment = async (paymentId, amount, currency = 'INR') => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const amountInPaise = Math.round(Number(amount));

  if (!keyId || !keySecret) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        id: paymentId,
        entity: 'payment',
        amount: amountInPaise,
        currency,
        status: 'captured',
        captured: true,
      };
    }
    throw new Error('Razorpay credentials missing on server.');
  }

  const payload = {
    amount: amountInPaise,
    currency: currency.toUpperCase(),
  };

  const response = await axios.post(
    `${RAZORPAY_BASE_URL}/payments/${paymentId}/capture`,
    payload,
    {
      headers: getAuthHeaders(),
      timeout: 10000,
    }
  );

  return response.data;
};

/**
 * 4. Cryptographic payment signature verification
 */
export const verifyPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const { keySecret } = getRazorpayCredentials();

  if (!keySecret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [Payment Warning] RAZORPAY_KEY_SECRET missing in non-production. Permitting signature check.');
      return true;
    }
    return false;
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(razorpaySignature, 'utf-8')
  );
};

/**
 * 5. Razorpay Webhook signature verification
 */
export const verifyWebhookSignature = (rawBody, signature, secretOverride) => {
  const { webhookSecret } = getRazorpayCredentials();
  const secret = secretOverride || webhookSecret;

  if (!secret || !signature) {
    return false;
  }

  const bodyBuffer = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyBuffer)
    .digest('hex');

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
};
