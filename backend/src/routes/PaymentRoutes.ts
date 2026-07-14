/**
 * Payment Routes
 * Handle all payment-related endpoints
 * Supports: Intouch (Rwanda), Pesapal (Cards), PawaPay (Multi-country mobile money)
 */

import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';

import { requireAuth, requireAdmin } from '../middleware/auth';

// Extend Express Request to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer | string;
    }
  }
}

const router = Router();

/**
 * POST /api/payments/initiate
 * Initiate a payment from user (requires authentication)
 * Supports paymentMethod: 'pawapay', 'intouch', 'pesapal', 'card', 'manual_transfer'
 */
router.post(
  '/initiate',
  requireAuth,
  paymentController.initiatePayment.bind(paymentController)
);

/**
 * GET /api/payments/countries
 * Get supported countries, payment providers, and exchange rates (public)
 * Returns all PawaPay-supported countries + Intouch Rwanda
 */
router.get(
  '/countries',
  paymentController.getSupportedCountries.bind(paymentController)
);

/**
 * GET /api/payments/detect-country
 * Auto-detect user's country from IP address (public)
 * Falls back to Rwanda if detection fails
 */
router.get(
  '/detect-country',
  paymentController.detectCountry.bind(paymentController)
);

/**
 * GET /api/payments/convert
 * Convert RWF amount to another currency (public)
 * Query: ?amount=10000&to=KES
 */
router.get(
  '/convert',
  paymentController.convertCurrency.bind(paymentController)
);

/**
 * GET /api/payments/intouch/balance
 * Get IntouchPay account balance (requires admin)
 * ⚠️ Must be defined BEFORE the /:transactionId catch-all to avoid route collision
 */
router.get(
  '/intouch/balance',
  requireAuth,
  requireAdmin,
  paymentController.getIntouchBalance.bind(paymentController)
);

/**
 * POST /api/payments/disburse
 * Disburse (CASHOUT) — send money to a mobile money subscriber via Intouch (requires admin)
 */
router.post(
  '/disburse',
  requireAuth,
  requireAdmin,
  paymentController.disbursePayment.bind(paymentController)
);

/**
 * GET /api/payments/pawapay/status
 * Get PawaPay merchant status / active configurations (requires admin)
 */
router.get(
  '/pawapay/status',
  requireAuth,
  requireAdmin,
  paymentController.getPawaPayStatus.bind(paymentController)
);

/**
 * GET /api/payments/pawapay/balance
 * Get PawaPay wallet balance (requires admin)
 */
router.get(
  '/pawapay/balance',
  requireAuth,
  requireAdmin,
  paymentController.getPawaPayBalance.bind(paymentController)
);

/**
 * POST /api/payments/pawapay/send
 * Send money via PawaPay (CASHOUT/disbursement) (requires admin)
 */
router.post(
  '/pawapay/send',
  requireAuth,
  requireAdmin,
  paymentController.sendPawaPayMoney.bind(paymentController)
);

/**
 * POST /api/payments/pawapay/bulk-send
 * Send bulk payouts via PawaPay (requires admin)
 */
router.post(
  '/pawapay/bulk-send',
  requireAuth,
  requireAdmin,
  paymentController.sendPawaPayBulkMoney.bind(paymentController)
);

/**
 * GET /api/payments/:transactionId
 * Get payment transaction status (requires authentication)
 */
router.get(
  '/:transactionId',
  requireAuth,
  paymentController.getPaymentStatus.bind(paymentController)
);

/**
 * GET /api/payments
 * Get user's payment history (requires authentication)
 */
router.get(
  '/',
  requireAuth,
  paymentController.getPaymentHistory.bind(paymentController)
);

/**
 * PawaPay Webhook / Callback (no auth — PawaPay signs requests)
 * Receives deposit status updates from PawaPay
 */
router.post(
  '/pawapay/callback',
  paymentController.handlePawaPayCallback.bind(paymentController)
);

/**
 * PawaPay Refund Webhook / Callback (no auth)
 * Receives refund status updates from PawaPay
 */
router.post(
  '/pawapay/refund/callback',
  paymentController.handlePawaPayRefundCallback.bind(paymentController)
);

/**
 * Pesapal Webhooks & Callbacks
 */
router.post(
  '/pesapal/ipn',
  paymentController.handlePesapalIPN.bind(paymentController)
);

router.get(
  '/pesapal/callback',
  paymentController.handlePesapalCallback.bind(paymentController)
);

/**
 * POST /api/payments/send-receipt
 * Manually resend payment receipt email (requires authentication)
 */
router.post(
  '/send-receipt',
  requireAuth,
  paymentController.sendReceipt.bind(paymentController)
);

/**
 * Intouch Webhook
 */
router.post(
  '/intouch/callback',
  paymentController.handleIntouchCallback.bind(paymentController)
);

export default router;
