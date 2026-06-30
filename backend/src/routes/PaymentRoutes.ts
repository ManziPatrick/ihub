/**
 * Payment Routes
 * Handle all payment-related endpoints
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
 */
router.post(
  '/initiate',
  requireAuth,
  paymentController.initiatePayment.bind(paymentController)
);

/**
 * GET /api/payments/countries
 * Get supported countries and payment providers (public)
 * Now simplified — returns IntouchPay-supported countries (Rwanda MTN/Airtel)
 */
router.get(
  '/countries',
  (_req, res) => {
    const countries = [
      {
        countryCode: 'RWA',
        currency: 'RWF',
        providers: [
          { providerId: 'intouch_mtn', name: 'MTN Mobile Money' },
          { providerId: 'intouch_airtel', name: 'Airtel Money' },
        ],
      },
    ];
    res.json({ countries });
  }
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
 * Intouch Webhook
 */
router.post(
  '/intouch/callback',
  paymentController.handleIntouchCallback.bind(paymentController)
);

// FDI callback removed — all mobile money via Intouch

export default router;
