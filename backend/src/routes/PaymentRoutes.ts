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

export default router;
