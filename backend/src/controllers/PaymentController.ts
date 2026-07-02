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
import { disbursementService } from '../services/disbursement.service';

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

class PaymentController {
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

      const { amount, phoneNumber, description, courseId, courseIds, subscriptionId, internshipProgramId, internshipIds, paymentMethod } =
        req.body as PaymentInitiateBody & { paymentMethod?: string };

      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const allCourseIds = [...(courseIds || []), ...(courseId ? [courseId] : [])];
      const allInternshipIds = [...(internshipIds || []), ...(internshipProgramId ? [internshipProgramId] : [])];
      
      // Build a smart itemTitle
      let smartTitle = description || 'Payment';
      if (allCourseIds.length > 0) {
        const coursesList = await Course.find({ _id: { $in: allCourseIds } }).select('title').lean() as any[];
        if (coursesList.length > 0) {
          smartTitle = coursesList.map((c: any) => c.title).join(", ");
        }
      } else if (allInternshipIds.length > 0) {
        const progsList = await InternshipProgram.find({ _id: { $in: allInternshipIds } }).select('title').lean() as any[];
        if (progsList.length > 0) {
          smartTitle = progsList.map((p: any) => p.title).join(", ");
        }
      }

      // ─── INTOUCH INTEGRATION (FOR MTN, AIRTEL MONEY) ───
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

      // ─── PESAPAL INTEGRATION (FOR CARD OR EXPLICIT PESAPAL) ───
      if (paymentMethod === 'pesapal' || paymentMethod === 'card') {
        const { firstName, lastName, email } = req.body;
        
        // Use provided email or fallback to logged-in user's email
        const userEmail = email || req.user?.email;
        if (!userEmail) return res.status(400).json({ error: 'Email is required for payment' });

        // 1. Register IPN
        const ipnCallbackUrl = `${process.env.BACKEND_URL || 'https://api.codemande.com'}/api/payments/pesapal/ipn`;
        const ipnId = await this.pesapalService.registerIPN(ipnCallbackUrl);

        // 2. Submit Order
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:8080'}/payment/pesapal/callback`;
        
        // Map phone prefix to ISO country code for Pesapal
        let countryCode = 'RW'; // Default to Rwanda
        if (phoneNumber?.startsWith('+254')) countryCode = 'KE';
        else if (phoneNumber?.startsWith('+256')) countryCode = 'UG';
        else if (phoneNumber?.startsWith('+255')) countryCode = 'TZ';
        else if (phoneNumber?.startsWith('+257')) countryCode = 'BI';
        else if (phoneNumber?.startsWith('+243')) countryCode = 'CD';

        const orderResponse = await this.pesapalService.submitOrder({
          id: `ORD-${Date.now()}`,
          currency: 'RWF', 
          amount: amount,
          description: smartTitle,
          callback_url: redirectUrl,
          notification_id: ipnId,
          billing_address: {
            email_address: userEmail,
            phone_number: phoneNumber || undefined,
            country_code: countryCode,
            first_name: firstName || req.user?.fullName?.split(' ')[0] || 'Customer',
            last_name: lastName || req.user?.fullName?.split(' ')[1] || 'User',
          }
        });

        // 3. Save Transaction
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

        // 4. Create Pending Payment
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
          internshipIds: allInternshipIds
        });
        await pendingPayment.save();

        return res.status(201).json({
          message: 'Payment initiated via Pesapal',
          redirectUrl: orderResponse.redirect_url,
          orderTrackingId: orderResponse.order_tracking_id
        });
      }

      if (paymentMethod === 'manual_transfer') {
        const transactionId = `MANUAL-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Create a PENDING Payment record
        const pendingPayment = new Payment({
          userId,
          amount: Math.floor(amount),
          currency: 'RWF',
          status: 'pending',
          paymentMethod: 'Manual Bank Transfer',
          transactionId,
          type: (courseIds && courseIds.length > 0) || (internshipIds && internshipIds.length > 0) ? 'Bulk Enrollment' : (courseId ? 'Course Enrollment' : (internshipProgramId ? 'Internship Fee' : 'Subscription Fee')),
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

      // If status is already terminal, return it
      const terminalStatuses = ['successful', 'failed', 'cancelled', 'expired'];
      if (terminalStatuses.includes(transaction.status)) {
        // Double check if post-processing was done for successful payments
        if (transaction.status === 'successful' && !transaction.processedAt) {
          console.log(`Retrying post-payment processing for transaction ${transactionId}`);
          await this.handleSuccessfulPayment(transaction);
        }
        return res.json(this.formatTransactionResponse(transaction));
      }

      // ─── Provider-specific real-time status checks ───
      // PaymentTransaction.status only supports: pending | successful | failed.
      // We branch based on how the transaction was initiated.

      const updateIfChanged = async (nextStatus: 'pending' | 'successful' | 'failed') => {
        if (nextStatus !== transaction.status) {
          const prevStatus = transaction.status;
          transaction.status = nextStatus as any;

          if (nextStatus === 'successful' && prevStatus !== 'successful') {
            await this.handleSuccessfulPayment(transaction);
          }

          if (terminalStatuses.includes(nextStatus)) {
            transaction.processedAt = new Date();
          }

          await transaction.save();
        }
      };

      // 1) Intouch
      if (transaction.paymentMethod === 'intouch' || transaction.provider === 'intouch') {
        try {
          console.log(`Checking status for Intouch Ref: ${transaction.intouchRef}`);
          const intouchStatus = await this.intouchService.getTransactionStatus(
            transaction.intouchRef || '',
            transaction.intouchTransactionId
          );

          if (intouchStatus && intouchStatus.success && intouchStatus.status) {
            await updateIfChanged(intouchStatus.status as any);
          }

          return res.json(this.formatTransactionResponse(transaction));
        } catch (error: any) {
          console.error('Error fetching status from Intouch:', error.message);
          return res.json({
            ...this.formatTransactionResponse(transaction),
            note: 'Real-time check currently unavailable (local cache used)',
          });
        }
      }

      // 3) Pesapal (card or momo)
      if (transaction.paymentMethod === 'card' || transaction.paymentMethod === 'momo' || transaction.pesapalTrackingId) {
        try {
          console.log(`Checking status for Pesapal TrackingId: ${transaction.pesapalTrackingId}`);

          if (!transaction.pesapalTrackingId) {
            return res.json(this.formatTransactionResponse(transaction));
          }

          const pesapalStatus = await this.pesapalService.getTransactionStatus(transaction.pesapalTrackingId);

          if (!pesapalStatus || !pesapalStatus.payment_status_code) {
            console.error('Incomplete status response from Pesapal');
            return res.json(this.formatTransactionResponse(transaction));
          }

          const normalizedStatus = this.pesapalService.normalizeStatus(pesapalStatus.payment_status_code as any);
          await updateIfChanged(normalizedStatus as any);

          return res.json(this.formatTransactionResponse(transaction));
        } catch (error: any) {
          console.error('Error fetching status from Pesapal:', error.message);
          return res.json({
            ...this.formatTransactionResponse(transaction),
            note: 'Real-time check currently unavailable (local cache used)',
          });
        }
      }

      // 5) Fallback: return DB status
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

      // Save the transaction regardless of success/failure
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
      const { userId, courseId, courseIds, subscriptionId, internshipProgramId, internshipIds, amount, description } = transaction;

      console.log(`Handling successful payment for transaction:`, {
        transactionId: transaction._id,
        userId,
        courseId,
        courseIds,
        subscriptionId,
        internshipProgramId,
        internshipIds
      });

      // Track payment record ID for disbursement (declare before try block)
      let paymentRecordId: string = transaction._id.toString();

      // 1. Update the Payment record (for accounting/history)
      try {
        // Find existing pending payment first (created during initiation)
        const ref = transaction.pesapalTrackingId || transaction.intouchRef || transaction._id;
        let paymentRecord = await Payment.findOne({ transactionId: ref });
        
        if (paymentRecord) {
          paymentRecord.status = 'completed';
          await paymentRecord.save();
          paymentRecordId = paymentRecord._id.toString();
          console.log(`Payment record ${paymentRecord._id} updated to completed`);
        } else {
          // Fallback: create if it doesn't exist for some reason
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
            type: courseIds?.length || internshipIds?.length ? 'Bulk Enrollment' : (courseId ? 'Course Enrollment' : (internshipProgramId ? 'Internship Fee' : 'Subscription Fee')),
            itemTitle: description || (courseIds?.length || internshipIds?.length ? 'Multiple Items' : (courseId ? 'Course' : (internshipProgramId ? 'Internship' : 'Subscription'))),
            courseId: courseId || undefined,
            courseIds: courseIds || [],
            internshipId: subscriptionId || undefined,
            internshipIds: internshipIds || [], 
          });
          await paymentRecord.save();
          paymentRecordId = paymentRecord._id.toString();
          console.log(`New payment record created for transaction ${transaction._id}`);
        }
      } catch (err) {
        console.error('Failed to update/create Payment record:', err);
      }

      // 2. Handle Course Enrollment
      if (courseId) {
        const courseIdObj = new mongoose.Types.ObjectId(courseId);
        const userIdObj = new mongoose.Types.ObjectId(userId);

        // Atomic updates to prevent race conditions
        await Promise.all([
          User.findByIdAndUpdate(userId, { 
            $addToSet: { enrolledCourses: courseIdObj } 
          }),
          Course.findByIdAndUpdate(courseId, { 
            $addToSet: { studentsEnrolled: userIdObj } 
          }),
          // Initialize Course Progress (Idempotent)
          CourseProgress.findOneAndUpdate(
            { userId: userIdObj, courseId: courseIdObj },
            { $setOnInsert: { status: 'active', lessons: [] } },
            { upsert: true, new: true }
          )
        ]);

        console.log(`User ${userId} successfully enrolled in course ${courseId} (Atomic)`);
      }

      // 2.5 Handle Bulk Course Enrollment
      if (courseIds && courseIds.length > 0) {
        const courseIdObjs = courseIds.map((id: string) => new mongoose.Types.ObjectId(id));
        const userIdObj = new mongoose.Types.ObjectId(userId);

        // Atomic update for User
        await User.findByIdAndUpdate(userId, {
          $addToSet: { enrolledCourses: { $each: courseIdObjs } }
        });

        // Atomic updates for each Course
        await Promise.all(courseIdObjs.flatMap((cId: mongoose.Types.ObjectId) => [
          Course.findByIdAndUpdate(cId, {
            $addToSet: { studentsEnrolled: userIdObj }
          }),
          CourseProgress.findOneAndUpdate(
            { userId: userIdObj, courseId: cId },
            { $setOnInsert: { status: 'active', lessons: [] } },
            { upsert: true, new: true }
          )
        ]));

        console.log(`User ${userId} successfully enrolled in ${courseIds.length} bulk courses (Atomic)`);
      }

      // 3. Handle Single Internship / Program
      if (subscriptionId) {
        const internship = await Internship.findById(subscriptionId);
        if (internship) {
          internship.payment = {
            ...internship.payment,
            status: 'paid',
            paidAt: new Date(),
            amount: amount,
          };
          internship.status = 'enrolled'; 
          await internship.save();
          console.log(`Internship ${subscriptionId} marked as paid and enrolled`);
        }
      }

      // 4. Handle Bulk Internship Enrollment
      if (internshipIds && internshipIds.length > 0) {
        for (const iId of internshipIds) {
          const internship = await Internship.findById(iId);
          if (internship) {
            internship.payment = {
              ...internship.payment,
              status: 'paid',
              paidAt: new Date(),
              amount: amount / internshipIds.length, // Distribute if needed, or rely on correct itemized prices
            };
            internship.status = 'enrolled'; 
            await internship.save();
            console.log(`Bulk Internship ${iId} marked as paid and enrolled`);
          }
        }
      }
      
      // If payment was for a program fee (during application)
      if (internshipProgramId) {
        const program = await InternshipProgram.findById(internshipProgramId);
        if (program) {
          const existingInternship = await Internship.findOne({
            userId,
            title: program.title,
            isDeleted: false
          });

          if (!existingInternship) {
            const newInternship = new Internship({
              userId,
              title: program.title || 'Internship Program',
              duration: program.duration || '3 Months',
              type: 'Online',
              status: 'enrolled',
              progress: 0,
              payment: {
                amount: amount,
                currency: 'RWF',
                status: 'paid'
              }
            });
            await newInternship.save();
            console.log(`Internship enrollment created for program ${internshipProgramId}`);
          }
        }

        await User.findByIdAndUpdate(userId, {
          $push: {
            activityLog: {
              action: 'PAID_PROGRAM_FEE',
              details: `Paid ${amount} RWF for program ${internshipProgramId}`,
              timestamp: new Date()
            }
          }
        });
      }

      // 5. Auto-disbursement to owner (fire-and-forget)
      setImmediate(async () => {
        try {
          const allItemIds = [
            ...(courseIds || []),
            ...(courseId ? [courseId] : []),
            ...(internshipIds || []),
            ...(internshipProgramId ? [internshipProgramId] : []),
          ];

          if (allItemIds.length > 0) {
            for (const itemId of allItemIds) {
              const itemType = internshipIds?.includes(itemId) || internshipProgramId === itemId
                ? 'internship'
                : 'course';

              const result = await disbursementService.processDisbursement(
                paymentRecordId,
                userId.toString(),
                itemId,
                itemType,
                amount
              );

              if (result.success) {
                console.log(`✅ Auto-disbursement completed for ${itemType} ${itemId}: ${result.netAmount} RWF to owner`);
              } else {
                console.warn(`⚠️ Auto-disbursement note for ${itemType} ${itemId}: ${result.message}`);
              }
            }
          }
        } catch (disburseErr) {
          console.error('Auto-disbursement error:', disburseErr);
        }
      });

      // 6. Send email confirmations (fire-and-forget — never block payment response)
      setImmediate(async () => {
        try {
          const user = await User.findById(userId).select('email username fullName');
          if (!user?.email) return;

          const studentName = user.fullName || user.username || 'Student';
          const userEmail = user.email;

          // Send payment receipt
          const invoiceNumber = `INV-${Date.now()}`;
          await sendPaymentConfirmation(
            userEmail,
            studentName,
            description || 'Course Enrollment',
            amount || 0,
            'RWF',
            invoiceNumber
          );

          // Send course enrollment confirmation for each course
          const allCourseIds = [...(courseIds || []), ...(courseId ? [courseId] : [])];
          if (allCourseIds.length > 0) {
            const courses = await Course.find({ _id: { $in: allCourseIds } }).select('title').lean();
            for (const course of courses) {
              await sendCourseEnrollmentConfirmation(
                userEmail,
                studentName,
                (course as any).title
              );
            }
          }
        } catch (emailErr) {
          console.error('Failed to send payment confirmation email:', emailErr);
        }
      });

      transaction.processedAt = new Date();
      await transaction.save();
    } catch (error) {
      console.error('Error handling successful payment:', error);
    }
  }

  /**
   * Get user's payment history
   * GET /api/payments/
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const status = req.query.status as string | undefined;

      const query: Record<string, any> = { userId };
      if (status) {
        query.status = status;
      }

      const transactions = await PaymentTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

      const total = await PaymentTransaction.countDocuments(query);

      return res.json({
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      return res.status(500).json({
        error: 'Failed to fetch payment history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle Pesapal IPN
   */
  async handlePesapalIPN(req: Request, res: Response) {
    try {
      const { OrderTrackingId, OrderMerchantReference } = req.body;
      console.log(`Pesapal IPN Received: TrackingId=${OrderTrackingId}, Ref=${OrderMerchantReference}`);

      const transaction = await PaymentTransaction.findOne({ pesapalTrackingId: OrderTrackingId });
      if (!transaction) return res.status(200).json({ status: 200 }); // Still 200

      const status = await this.pesapalService.getTransactionStatus(OrderTrackingId);
      if (!status || !status.payment_status_code) {
        console.warn(`Could not get status for Pesapal TrackingId: ${OrderTrackingId}`);
        return res.status(200).json({ status: 200 });
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

      return res.status(200).json({ status: 200 });
    } catch (error) {
      console.error('Pesapal IPN Error:', error);
      return res.status(200).json({ status: 200 });
    }
  }

  /**
   * Handle Pesapal Callback (User Redirect)
   */
  async handlePesapalCallback(req: Request, res: Response) {
    try {
      const { OrderTrackingId, OrderMerchantReference } = req.query;
      console.log(`Pesapal Callback Received: ${OrderTrackingId}`);

      const transaction = await PaymentTransaction.findOne({ pesapalTrackingId: OrderTrackingId as string });
      if (!transaction) return res.redirect(`${process.env.CLIENT_URL}/payment/status?error=not_found`);

      const status = await this.pesapalService.getTransactionStatus(OrderTrackingId as string);
      if (!status || !status.payment_status_code) {
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
  /**
   * Handle Intouch Callback
   * Receives webhooks for payment status updates from IntouchPay
   */
  async handleIntouchCallback(req: Request, res: Response) {
    const payload = req.body;
    try {
      console.log('🔔 Intouch Callback Received:', JSON.stringify(payload).substring(0, 600));

      // Parse the Intouch webhook payload
      const parsed = this.intouchService.parseCallbackPayload(payload);

      // Find the transaction by Intouch reference
      const transaction = await PaymentTransaction.findOne({
        $or: [
          { intouchRef: parsed.requestTransactionId },
          { intouchTransactionId: parsed.transactionId },
        ]
      });

      if (!transaction) {
        console.warn(`❌ Intouch Callback: Transaction not found for ref ${parsed.requestTransactionId}`);
        return res.status(200).json({
          message: 'success',
          success: true,
          request_id: parsed.requestTransactionId || payload?.jsonpayload?.requesttransactionid || null,
        });
      }

      // Update status if changed
      const normalizedStatus = parsed.status;
      if (normalizedStatus !== transaction.status) {
        const prevStatus = transaction.status;
        transaction.status = normalizedStatus as any;

        if (normalizedStatus === 'successful' && prevStatus !== 'successful') {
          await this.handleSuccessfulPayment(transaction);
        }

        transaction.intouchTransactionId = parsed.transactionId;
        await transaction.save();
        console.log(`✅ Intouch transaction ${parsed.requestTransactionId} updated: ${prevStatus} → ${normalizedStatus}`);
      }

      // Acknowledge with Intouch's expected response format
      return res.status(200).json({
        message: 'success',
        success: true,
        request_id: parsed.requestTransactionId,
      });
    } catch (error) {
      console.error('❌ Intouch Callback Error:', error);
      // Try to extract request_id from the incoming payload to send a valid ack
      const reqId =
        payload?.jsonpayload?.requesttransactionid ||
        payload?.requesttransactionid ||
        null;
      return res.status(200).json({
        message: 'success',
        success: true,
        request_id: reqId,
      });
    }
  }

}

export const paymentController = new PaymentController();
