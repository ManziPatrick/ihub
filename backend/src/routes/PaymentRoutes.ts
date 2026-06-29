/**
 * Payment Routes
 * Handle all payment-related endpoints
 */

import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { requireAuth } from '../middleware/auth';

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
 */
router.get(
  '/countries',
  (_req, res) => {
    const countries = paymentController.paypackService.getSupportedCountries();
    res.json({ countries });
  }
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

/**
 * Paypack Webhook (PawaPay)
 */
router.post(
  '/paypack/callback',
  paymentController.handlePaypackCallback.bind(paymentController)
);

/**
 * FDI Webhooks
 */
router.post(
  '/fdi/callback',
  paymentController.handleFDICallback.bind(paymentController)
);

export default router;
