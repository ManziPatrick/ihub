/**
 * Payment Controller
 * Handles payment initiation, status checks, and webhook processing
 */

import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { createPesapalService } from '../services/pesapal.service';
import { createIntouchService } from '../services/intouch.service';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Internship } from '../models/Internship';
import { Payment } from '../models/Payment';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { CourseProgress } from '../models/CourseProgress';
import { sendPaymentConfirmation, sendCourseEnrollmentConfirmation } from '../services/email.service';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      rawBody?: Buffer | string;
    }
  }
}

interface PaymentInitiateBody {
  amount: number;
  phoneNumber: string;
  description?: string;
  courseId?: string;
  courseIds?: string[];
  subscriptionId?: string;
  internshipProgramId?: string;
  internshipIds?: string[];
  firstName?: string;
  lastName?: string;
  email?: string;
}

class PaymentControllerFixed {
  private pesapalService = createPesapalService();
  private intouchService = createIntouchService();

  /**
   * Initiate a payment (CASHIN) from user
   * POST /api/payments/initiate
   */
  async initiatePayment(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        amount,
        phoneNumber,
        description,
        courseId,
        courseIds,
        subscriptionId,
        internshipProgramId,
        internshipIds,
        paymentMethod,
      } = req.body as PaymentInitiateBody & { paymentMethod?: string };

      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const allCourseIds = [...(courseIds || []), ...(courseId ? [courseId] : [])];
      const allInternshipIds = [...(internshipIds || []), ...(internshipProgramId ? [internshipProgramId] : [])];

      // Build a smart itemTitle
      let smartTitle = description || 'Payment';
      if (allCourseIds.length > 0) {
        const coursesList = (await Course.find({ _id: { $in: allCourseIds } }).select('title').lean()) as any[];
        if (coursesList.length > 0) {
          smartTitle = coursesList.map((c: any) => c.title).join(', ');
        }
      } else if (allInternshipIds.length > 0) {
        const progsList = (await InternshipProgram.find({ _id: { $in: allInternshipIds } }).select('title').lean()) as any[];
        if (progsList.length > 0) {
          smartTitle = progsList.map((p: any) => p.title).join(', ');
        }
      }

      // ─── INTOUCH ───
      if (paymentMethod === 'intouch' || paymentMethod === 'intouch_mtn' || paymentMethod === 'intouch_airtel') {
        const trxRef = this.intouchService.generateRequestTransactionId();
        if (!phoneNumber) {
          return res.status(400).json({ error: 'Phone number is required for mobile money payment' });
        }

        const callbackUrl = `${process.env.BACKEND_URL || 'https://api.codemande.com'}/api/payments/intouch/callback`;

        const response = await this.intouchService.requestPayment({
          amount,
          phoneNumber,
          requestTransactionId: trxRef,
          callbackUrl,
        });

        if (!response.success) {
          return res.status(502).json({
            error: 'Payment provider request failed',
            message: response.message,
          });
        }

        const transaction = new PaymentTransaction({
          userId,
          type: 'CASHIN',
          amount,
          status: 'pending',
          intouchRef: trxRef,
          intouchTransactionId: response.transactionId,
          paymentMethod: 'intouch',
          phoneNumber,
          description: smartTitle,
          courseId: courseId || null,
          courseIds: courseIds || [],
          internshipProgramId: internshipProgramId || null,
          internshipIds: internshipIds || [],
        });
        await transaction.save();

        const pendingPayment = new Payment({
          userId,
          amount,
          currency: 'RWF',
          status: 'pending',
          paymentMethod: 'Intouch',
          transactionId: trxRef,
          type: allCourseIds.length > 0 ? 'Course Enrollment' : 'Internship/Subscription',
          itemTitle: smartTitle,
          courseIds: allCourseIds,
          internshipIds: allInternshipIds,
        });
        await pendingPayment.save();

        return res.status(202).json({
          message: 'Mobile Money payment initiated via Intouch',
          data: response.raw,
          status: 'processing',
          transactionId: transaction._id,
        });
      }
      // ─── Pesapal ───
      if (paymentMethod === 'pesapal' || paymentMethod === 'card') {
        const { firstName, lastName, email } = req.body;
        const userEmail = email || req.user?.email;
        if (!userEmail) return res.status(400).json({ error: 'Email is required for payment' });

        const ipnCallbackUrl = `${process.env.BACKEND_URL || 'https://api.codemande.com'}/api/payments/pesapal/ipn`;
        const ipnId = await this.pesapalService.registerIPN(ipnCallbackUrl);

        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment/pesapal/callback`;

        // Default country code Rwanda
        let countryCode = 'RW';
        if (phoneNumber?.startsWith('+254')) countryCode = 'KE';
        else if (phoneNumber?.startsWith('+256')) countryCode = 'UG';
        else if (phoneNumber?.startsWith('+255')) countryCode = 'TZ';
        else if (phoneNumber?.startsWith('+257')) countryCode = 'BI';
        else if (phoneNumber?.startsWith('+243')) countryCode = 'CD';

        const orderResponse = await this.pesapalService.submitOrder({
          id: `ORD-${Date.now()}`,
          currency: 'RWF',
          amount,
          description: smartTitle,
          callback_url: redirectUrl,
          notification_id: ipnId,
          billing_address: {
            email_address: userEmail,
            phone_number: phoneNumber || undefined,
            country_code: countryCode,
            first_name: firstName || req.user?.fullName?.split(' ')[0] || 'Customer',
            last_name: lastName || req.user?.fullName?.split(' ')[1] || 'User',
          },
        });

        const transaction = new PaymentTransaction({
          userId,
          type: 'CASHIN',
          amount,
          status: 'pending',
          pesapalTrackingId: orderResponse.order_tracking_id,
          paymentMethod: paymentMethod === 'card' ? 'card' : 'momo',
          phoneNumber: phoneNumber || undefined,
          description: smartTitle,
          courseId: courseId || null,
          courseIds: courseIds || [],
          internshipProgramId: internshipProgramId || null,
          internshipIds: internshipIds || [],
        });
        await transaction.save();

        const pendingPayment = new Payment({
          userId,
          amount,
          currency: 'RWF',
          status: 'pending',
          paymentMethod: paymentMethod === 'card' ? 'Pesapal (Card)' : 'Pesapal (Mobile Money)',
          transactionId: orderResponse.order_tracking_id,
          type: allCourseIds.length > 0 ? 'Course Enrollment' : 'Internship/Subscription',
          itemTitle: smartTitle,
          courseIds: allCourseIds,
          internshipIds: allInternshipIds,
        });
        await pendingPayment.save();

        return res.status(201).json({
          message: 'Payment initiated via Pesapal',
          redirectUrl: orderResponse.redirect_url,
          orderTrackingId: orderResponse.order_tracking_id,
        });
      }

      // ─── Manual ───
      if (paymentMethod === 'manual_transfer') {
        const transactionId = `MANUAL-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const pendingPayment = new Payment({
          userId,
          amount: Math.floor(amount),
          currency: 'RWF',
          status: 'pending',
          paymentMethod: 'Manual Bank Transfer',
          transactionId,
          type:
            (courseIds && courseIds.length > 0) || (internshipIds && internshipIds.length > 0)
              ? 'Bulk Enrollment'
              : courseId
                ? 'Course Enrollment'
                : internshipProgramId
                  ? 'Internship Fee'
                  : 'Subscription Fee',
          itemTitle: smartTitle,
          courseId: courseId || undefined,
          courseIds: courseIds && courseIds.length > 0 ? courseIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
          internshipId: subscriptionId || undefined,
          internshipIds: internshipIds && internshipIds.length > 0 ? internshipIds.map((id: string) => new mongoose.Types.ObjectId(id)) : [],
        });
        await pendingPayment.save();

        return res.status(201).json({
          message: 'Manual payment initiated',
          transactionId: pendingPayment._id,
          status: 'pending',
          instructions: 'Please transfer the amount to our bank account and upload the proof of payment.',
        });
      }

      return res.status(400).json({ error: 'Invalid payment method' });
    } catch (error) {
      console.error('Payment initiation error:', error);
      return res.status(500).json({
        error: 'Failed to initiate payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get payment transaction status
   * GET /api/payments/:transactionId
   */
  public getPaymentStatus = async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user?.id || (req as any).user?._id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const transaction = await PaymentTransaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Verify ownership
      if (transaction.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const terminalStatuses = ['successful', 'failed', 'cancelled', 'expired'];

      // If already terminal, return it (and ensure fulfillment happened)
      if (terminalStatuses.includes(transaction.status)) {
        if (transaction.status === 'successful' && !transaction.processedAt) {
          console.log(`Retrying post-payment processing for transaction ${transactionId}`);
          await this.handleSuccessfulPayment(transaction);
        }
        return res.json(this.formatTransactionResponse(transaction));
      }

      const updateIfChanged = async (nextStatus: 'pending' | 'successful' | 'failed') => {
        if (nextStatus === transaction.status) return;

        const prevStatus = transaction.status;
        transaction.status = nextStatus as any;

        if (nextStatus === 'successful' && prevStatus !== 'successful') {
          await this.handleSuccessfulPayment(transaction);
        }

        if (terminalStatuses.includes(nextStatus)) {
          transaction.processedAt = new Date();
        }

        await transaction.save();
      };

      if (transaction.paymentMethod === 'intouch' || transaction.provider === 'intouch') {
        // intouch service expects requestTransactionId + (optional) transactionId
        const intouchStatus = await this.intouchService.getTransactionStatus(
          transaction.intouchRef || '',
          transaction.intouchTransactionId
        );
        if (intouchStatus?.success && intouchStatus.status) {
          await updateIfChanged(intouchStatus.status as any);
        }
        return res.json(this.formatTransactionResponse(transaction));
      }

      if (transaction.paymentMethod === 'card' || transaction.paymentMethod === 'momo' || transaction.pesapalTrackingId) {
        if (!transaction.pesapalTrackingId) return res.json(this.formatTransactionResponse(transaction));

        const pesapalStatus = await this.pesapalService.getTransactionStatus(transaction.pesapalTrackingId);
        if (!pesapalStatus?.payment_status_code) return res.json(this.formatTransactionResponse(transaction));

        const normalizedStatus = this.pesapalService.normalizeStatus(pesapalStatus.payment_status_code as any);
        await updateIfChanged(normalizedStatus as any);
        return res.json(this.formatTransactionResponse(transaction));
      }

      // fallback
      return res.json(this.formatTransactionResponse(transaction));
    } catch (error) {
      console.error('Error in getPaymentStatus:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  private formatTransactionResponse(transaction: any) {
    return {
      transactionId: transaction._id,
      amount: transaction.amount,
      fee: transaction.fee,
      status: transaction.status,
      pesapalTrackingId: transaction.pesapalTrackingId,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      description: transaction.description,
    };
  }

  /**
   * Initiate a disbursement (CASHOUT) via Intouch
   * Sends money to a user's mobile money account
   * POST /api/payments/disburse
   */
  async disbursePayment(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { amount, phoneNumber, reason } = req.body as {
        amount: number;
        phoneNumber: string;
        reason?: string;
      };

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required for disbursement' });
      }

      const trxRef = this.intouchService.generateRequestTransactionId();

      const response = await this.intouchService.requestDeposit({
        amount,
        phoneNumber,
        requestTransactionId: trxRef,
        reason: reason || 'Payment disbursement from iHub',
        withdrawCharge: 0,
        serviceId: 1,
      });

      const transaction = new PaymentTransaction({
        userId,
        type: 'CASHOUT',
        amount,
        status: response.success ? 'successful' : 'failed',
        intouchRef: trxRef,
        intouchTransactionId: response.transactionId,
        paymentMethod: 'intouch',
        phoneNumber,
        description: reason || 'Disbursement',
      });
      await transaction.save();

      if (!response.success) {
        return res.status(502).json({
          error: 'Disbursement failed',
          message: response.message,
          transactionId: transaction._id,
        });
      }

      return res.status(200).json({
        message: 'Disbursement successful',
        transactionId: transaction._id,
        providerRef: response.referenceId,
        intouchTransactionId: response.transactionId,
      });
    } catch (error) {
      console.error('Disbursement error:', error);
      return res.status(500).json({
        error: 'Failed to process disbursement',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get IntouchPay account balance
   * GET /api/payments/intouch/balance
   */
  async getIntouchBalance(_req: Request, res: Response) {
    try {
      const result = await this.intouchService.getBalance();

      if (!result.success) {
        return res.status(502).json({
          error: 'Failed to fetch balance',
          message: result.message || 'Intouch balance check failed',
        });
      }

      return res.json({
        balance: result.balance,
        currency: 'RWF',
        provider: 'IntouchPay',
      });
    } catch (error) {
      console.error('Get Intouch balance error:', error);
      return res.status(500).json({
        error: 'Failed to get balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle successful payment (enroll user in course, activate subscription, etc)
   */
  private async handleSuccessfulPayment(transaction: any): Promise<void> {
    try {
      // Idempotency guard
      if (transaction.processedAt) {
        return;
      }

      const { userId, courseId, courseIds, subscriptionId, internshipProgramId, internshipIds, amount, description } = transaction;

      // 1) Update/create Payment record
      try {
        const ref = transaction.pesapalTrackingId || transaction.intouchRef || transaction._id;
        let paymentRecord = await Payment.findOne({ transactionId: ref });

        if (paymentRecord) {
          paymentRecord.status = 'completed';
          await paymentRecord.save();
        } else {
          let friendlyMethod = 'Pesapal';
          if (transaction.paymentMethod === 'manual') {
            friendlyMethod = 'Manual Transfer';
          } else if (transaction.paymentMethod === 'intouch') {
            friendlyMethod = 'Intouch';
          }

          paymentRecord = new Payment({
            userId,
            amount,
            currency: 'RWF',
            status: 'completed',
            paymentMethod: friendlyMethod,
            transactionId: ref,
            type:
              courseIds?.length || internshipIds?.length
                ? 'Bulk Enrollment'
                : courseId
                  ? 'Course Enrollment'
                  : internshipProgramId
                    ? 'Internship Fee'
                    : 'Subscription Fee',
            itemTitle:
              description ||
              courseIds?.length || internshipIds?.length
                ? 'Multiple Items'
                : courseId
                  ? 'Course'
                  : internshipProgramId
                    ? 'Internship'
                    : 'Subscription',
            courseId: courseId || undefined,
            courseIds: courseIds || [],
            internshipId: subscriptionId || undefined,
            internshipIds: internshipIds || [],
          });

          await paymentRecord.save();
        }
      } catch (err) {
        console.error('Failed to update/create Payment record:', err);
      }

      // 2) Enrollment
      if (courseId) {
        const courseIdObj = new mongoose.Types.ObjectId(courseId);
        const userIdObj = new mongoose.Types.ObjectId(userId);

        await Promise.all([
          User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseIdObj } }),
          Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: userIdObj } }),
          CourseProgress.findOneAndUpdate(
            { userId: userIdObj, courseId: courseIdObj },
            { $setOnInsert: { status: 'active', lessons: [] } },
            { upsert: true, new: true }
          ),
        ]);
      }

      if (courseIds?.length > 0) {
        const courseIdObjs = courseIds.map((id: string) => new mongoose.Types.ObjectId(id));
        const userIdObj = new mongoose.Types.ObjectId(userId);

        await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: { $each: courseIdObjs } } });

        await Promise.all(
          courseIdObjs.flatMap((cId: mongoose.Types.ObjectId) => [
            Course.findByIdAndUpdate(cId, { $addToSet: { studentsEnrolled: userIdObj } }),
            CourseProgress.findOneAndUpdate(
              { userId: userIdObj, courseId: cId },
              { $setOnInsert: { status: 'active', lessons: [] } },
              { upsert: true, new: true }
            ),
          ])
        );
      }

      if (subscriptionId) {
        const internship = await Internship.findById(subscriptionId);
        if (internship) {
          internship.payment = { ...internship.payment, status: 'paid', paidAt: new Date(), amount };
          internship.status = 'enrolled';
          await internship.save();
        }
      }

      if (internshipIds?.length > 0) {
        for (const iId of internshipIds) {
          const internship = await Internship.findById(iId);
          if (internship) {
            internship.payment = {
              ...internship.payment,
              status: 'paid',
              paidAt: new Date(),
              amount: amount / internshipIds.length,
            };
            internship.status = 'enrolled';
            await internship.save();
          }
        }
      }

      if (internshipProgramId) {
        const program = await InternshipProgram.findById(internshipProgramId);
        if (program) {
          const existingInternship = await Internship.findOne({ userId, title: program.title, isDeleted: false });
          if (!existingInternship) {
            const newInternship = new Internship({
              userId,
              title: program.title || 'Internship Program',
              duration: program.duration || '3 Months',
              type: 'Online',
              status: 'enrolled',
              progress: 0,
              payment: { amount, currency: 'RWF', status: 'paid' },
            });
            await newInternship.save();
          }
        }

        await User.findByIdAndUpdate(userId, {
          $push: {
            activityLog: {
              action: 'PAID_PROGRAM_FEE',
              details: `Paid ${amount} RWF for program ${internshipProgramId}`,
              timestamp: new Date(),
            },
          },
        });
      }

      // 5) Emails (best-effort)
      try {
        const user = await User.findById(userId).select('email username fullName');
        if (user?.email) {
          const studentName = user.fullName || user.username || 'Student';
          await sendPaymentConfirmation(
            user.email,
            studentName,
            description || 'Course Enrollment',
            amount || 0,
            'RWF',
            `INV-${Date.now()}`
          );

          const allCourseIds = [...(courseIds || []), ...(courseId ? [courseId] : [])];
          if (allCourseIds.length > 0) {
            const courses = await Course.find({ _id: { $in: allCourseIds } }).select('title').lean();
            for (const c of courses) {
              await sendCourseEnrollmentConfirmation(user.email, studentName, (c as any).title);
            }
          }
        }
      } catch (emailErr) {
        console.error('Failed to send payment confirmation email:', emailErr);
      }

      transaction.processedAt = new Date();
      await transaction.save();
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  // Webhooks/callbacks - keep the same implementation style as the original controller.
  async handlePesapalIPN(req: Request, res: Response) {
    try {
      const { OrderTrackingId } = req.body;
      const transaction = await PaymentTransaction.findOne({ pesapalTrackingId: OrderTrackingId });
      if (!transaction) return res.status(200).json({ status: 200 });

      const status = await this.pesapalService.getTransactionStatus(OrderTrackingId);
      if (!status?.payment_status_code) return res.status(200).json({ status: 200 });

      const normalizedStatus = this.pesapalService.normalizeStatus(status.payment_status_code as any);

      if (normalizedStatus !== transaction.status) {
        const prevStatus = transaction.status;
        transaction.status = normalizedStatus;
        if (normalizedStatus === 'successful' && prevStatus !== 'successful') {
          await this.handleSuccessfulPayment(transaction);
        }
        await transaction.save();
      }

      return res.status(200).json({ status: 200 });
    } catch (error) {
      console.error('Pesapal IPN Error:', error);
      return res.status(200).json({ status: 200 });
    }
  }

  async handlePesapalCallback(req: Request, res: Response) {
    try {
      const { OrderTrackingId } = req.query;

      const transaction = await PaymentTransaction.findOne({ pesapalTrackingId: OrderTrackingId as string });
      if (!transaction) return res.redirect(`${process.env.CLIENT_URL}/payment/status?error=not_found`);

      const status = await this.pesapalService.getTransactionStatus(OrderTrackingId as string);
      if (!status?.payment_status_code) {
        return res.redirect(`${process.env.CLIENT_URL}/payment/status?error=status_unavailable`);
      }

      const normalizedStatus = this.pesapalService.normalizeStatus(status.payment_status_code as any);

      if (normalizedStatus !== transaction.status) {
        const prevStatus = transaction.status;
        transaction.status = normalizedStatus;
        if (normalizedStatus === 'successful' && prevStatus !== 'successful') {
          await this.handleSuccessfulPayment(transaction);
        }
        await transaction.save();
      }

      return res.redirect(`${process.env.CLIENT_URL}/payment/status?transactionId=${transaction._id}&status=${normalizedStatus}`);
    } catch (error) {
      console.error('Pesapal Callback Error:', error);
      return res.redirect(`${process.env.CLIENT_URL}/payment/status?error=server_error`);
    }
  }

  async handleIntouchCallback(req: Request, res: Response) {
    try {
      const payload = req.body;
      const parsed = this.intouchService.parseCallbackPayload(payload);

      const transaction = await PaymentTransaction.findOne({
        $or: [
          { intouchRef: parsed.requestTransactionId },
          { intouchTransactionId: parsed.transactionId },
        ],
      });

      if (!transaction) return res.status(200).json({ message: 'success', success: true });

      const normalizedStatus = parsed.status;
      if (normalizedStatus !== transaction.status) {
        const prevStatus = transaction.status;
        transaction.status = normalizedStatus as any;

        if (normalizedStatus === 'successful' && prevStatus !== 'successful') {
          await this.handleSuccessfulPayment(transaction);
        }

        transaction.intouchTransactionId = parsed.transactionId;
        await transaction.save();
      }

      return res.status(200).json({ message: 'success', success: true, request_id: parsed.requestTransactionId });
    } catch (error) {
      console.error('Intouch Callback Error:', error);
      return res.status(200).json({ message: 'success', success: true });
    }
  }

}

export const paymentControllerFixed = new PaymentControllerFixed();


