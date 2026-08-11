import mongoose from 'mongoose';
import RefundRequest from '../models/RefundRequest';
import { CommissionDisbursement } from '../models/CommissionDisbursement';
import { Payment } from '../models/Payment';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { CourseProgress } from '../models/CourseProgress';
import { Internship } from '../models/Internship';
import { Certificate } from '../models/Certificate';
import { sendNotification } from '../services/notification.service';
import { disbursementService } from '../services/disbursement.service';
import { createPaypackService, PawaPayService } from '../services/paypack.service';

/**
 * Lazy-init PawaPay service for refund operations
 */
let _pawapayService: PawaPayService | null = null;
function getPawaPay(): PawaPayService | null {
  if (_pawapayService) return _pawapayService;
  try {
    _pawapayService = createPaypackService();
    return _pawapayService;
  } catch {
    return null;
  }
}

export const refundResolvers = {
  Query: {
    getAllRefundRequests: async (
      _: any,
      { page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized - admin or super_admin only');
      }

      const filter: any = {};
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        RefundRequest.find(filter)
          .populate('userId', 'username fullName email')
          .populate('requestedBy', 'username fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        RefundRequest.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items: items.map((r) => ({
          id: (r._id as any)?.toString() || '',
          paymentId: (r.paymentId as any)?.toString() || '',
          userId: (r.userId as any)?.toString() || '',
          user: r.userId as any,
          itemIds: (r.itemIds || []).map((id: any) => id?.toString() || ''),
          itemTypes: r.itemTypes || [],
          amount: r.amount || 0,
          currency: r.currency || 'RWF',
          reason: r.reason || '',
          status: r.status || 'pending',
          adminNote: r.adminNote || null,
          verifiedBy: (r.verifiedBy as any)?.toString() || null,
          verifiedAt: r.verifiedAt?.toISOString() || null,
          approvedBy: (r.approvedBy as any)?.toString() || null,
          approvedAt: r.approvedAt?.toISOString() || null,
          forceApproved: !!r.forceApproved,
          cancelledDisbursements: (r.cancelledDisbursements || []).map((id: any) => id?.toString() || ''),
          refundedAmount: r.refundedAmount || 0,
          refundFee: r.refundFee || 0,
          refundableAmountAfterFee: r.refundableAmountAfterFee || 0,
          payoutMethod: r.payoutMethod || null,
          payoutReferenceId: r.payoutReferenceId || null,
          customerPhone: r.customerPhone || null,
          requestedBy: (r.requestedBy as any)?.toString() || '',
          createdAt: r.createdAt?.toISOString?.() || r.createdAt?.toString() || '',
          updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt?.toString() || '',
        })),
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    },

    getRefundRequest: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const refund = await RefundRequest.findById(id)
        .populate('userId', 'username fullName email')
        .populate('requestedBy', 'username fullName email');

      if (!refund) throw new Error('Refund request not found');

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        user: refund.userId as any,
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: refund.adminNote || null,
        verifiedBy: refund.verifiedBy?.toString() || null,
        verifiedAt: refund.verifiedAt?.toISOString() || null,
        approvedBy: refund.approvedBy?.toString() || null,
        approvedAt: refund.approvedAt?.toISOString() || null,
        forceApproved: refund.forceApproved,
        cancelledDisbursements: refund.cancelledDisbursements.map((id) => id.toString()),
        refundedAmount: refund.refundedAmount,
        refundFee: refund.refundFee || 0,
        refundableAmountAfterFee: refund.refundableAmountAfterFee || 0,
        payoutMethod: refund.payoutMethod || null,
        payoutReferenceId: refund.payoutReferenceId || null,
        customerPhone: refund.customerPhone || null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },

    getMyRefundRequests: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const refunds = await RefundRequest.find({ userId: new mongoose.Types.ObjectId(context.user.id) })
        .populate('userId', 'username fullName email')
        .sort({ createdAt: -1 });

      return refunds.map((r) => ({
        id: (r._id as any)?.toString() || '',
        paymentId: (r.paymentId as any)?.toString() || '',
        userId: (r.userId as any)?.toString() || '',
        user: r.userId as any,
        amount: r.amount || 0,
        currency: r.currency || 'RWF',
        reason: r.reason || '',
        status: r.status || 'pending',
        adminNote: r.adminNote || null,
        refundedAmount: r.refundedAmount || 0,
        refundFee: r.refundFee || 0,
        refundableAmountAfterFee: r.refundableAmountAfterFee || 0,
        createdAt: r.createdAt?.toISOString?.() || r.createdAt?.toString() || '',
        updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt?.toString() || '',
      }));
    },

    getRefundRequestStats: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const [
        totalRequests,
        pendingCount,
        verifiedCount,
        approvedCount,
        rejectedCount,
        approvedRefunds,
      ] = await Promise.all([
        RefundRequest.countDocuments(),
        RefundRequest.countDocuments({ status: 'pending' }),
        RefundRequest.countDocuments({ status: 'admin_verified' }),
        RefundRequest.countDocuments({ status: 'approved' }),
        RefundRequest.countDocuments({ status: 'rejected' }),
        RefundRequest.find({ status: 'approved' }).lean(),
      ]);

      const totalRefunded = approvedRefunds.reduce(
        (sum, r) => sum + (r.refundedAmount || 0),
        0
      );
      const totalRefundFee = approvedRefunds.reduce(
        (sum, r) => sum + (r.refundFee || 0),
        0
      );

      return {
        totalRequests,
        pendingCount,
        verifiedCount,
        approvedCount,
        rejectedCount,
        totalRefunded: Math.round(totalRefunded),
        totalRefundFee: Math.round(totalRefundFee),
      };
    },
  },

  Mutation: {
    /**
     * Initiate a refund request (student or admin)
     * Only allowed within 3 days of payment
     */
    requestRefund: async (
      _: any,
      { paymentId, reason }: { paymentId: string; reason: string },
      context: any
    ) => {
      if (!context.user) throw new Error('Not authenticated');

      // Find the payment
      const payment = await Payment.findById(paymentId);
      if (!payment) throw new Error('Payment not found');

      // Verify the payment belongs to the user, or user is admin
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      if (payment.userId.toString() !== context.user.id && !isAdmin) {
        throw new Error('Not authorized - this payment does not belong to you');
      }

      // Check 3-day refund window
      const hoursSincePayment = (Date.now() - new Date(payment.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSincePayment > 72) {
        throw new Error('Refund window has expired. Refunds can only be requested within 3 days of payment.');
      }

      if (payment.status !== 'completed') {
        throw new Error('Only completed payments can be refunded');
      }

      // Check for existing refund request
      const existing = await RefundRequest.findOne({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        status: { $in: ['pending', 'admin_verified', 'approved'] },
      });
      if (existing) {
        throw new Error(`A refund request already exists for this payment (Status: ${existing.status})`);
      }

      // Collect item IDs from the payment
      const itemIds: mongoose.Types.ObjectId[] = [];
      const itemTypes: string[] = [];

      if (payment.courseIds && payment.courseIds.length > 0) {
        for (const id of payment.courseIds) {
          itemIds.push(id);
          itemTypes.push('course');
        }
      }
      if (payment.courseId) {
        itemIds.push(payment.courseId);
        itemTypes.push('course');
      }
      if (payment.internshipIds && payment.internshipIds.length > 0) {
        for (const id of payment.internshipIds) {
          itemIds.push(id);
          itemTypes.push('internship');
        }
      }
      if (payment.internshipId) {
        itemIds.push(payment.internshipId);
        itemTypes.push('internship');
      }

      const refund = new RefundRequest({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        userId: payment.userId,
        itemIds,
        itemTypes,
        amount: payment.amount,
        currency: payment.currency || 'RWF',
        reason,
        status: 'pending',
        requestedBy: new mongoose.Types.ObjectId(context.user.id),
      refundedAmount: 0,
      refundFee: 0,
      refundableAmountAfterFee: 0,
      forceApproved: false,
        cancelledDisbursements: [],
      });

      await refund.save();

      // Notify admins about new refund request
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
      for (const admin of admins) {
        await sendNotification(admin._id.toString(), {
          type: 'refund_request',
          title: 'New Refund Request',
          message: `A refund of ${payment.amount} RWF has been requested for payment ${paymentId.slice(-8)}`,
          link: '/portal/super-admin/refunds',
        });
      }

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: null,
        verifiedBy: null,
        verifiedAt: null,
        approvedBy: null,
        approvedAt: null,
        forceApproved: false,
        cancelledDisbursements: [],
        refundedAmount: 0,
        refundFee: 0,
        refundableAmountAfterFee: 0,
        payoutMethod: null,
        payoutReferenceId: null,
        customerPhone: null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },

    /**
     * Admin verifies a refund request
     */
    verifyRefundRequest: async (
      _: any,
      { id, note }: { id: string; note?: string },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized - admin or super_admin only');
      }

      const refund = await RefundRequest.findById(id);
      if (!refund) throw new Error('Refund request not found');
      if (refund.status !== 'pending') {
        throw new Error(`Cannot verify - current status is ${refund.status}`);
      }

      refund.status = 'admin_verified';
      refund.verifiedBy = new mongoose.Types.ObjectId(context.user.id);
      refund.verifiedAt = new Date();
      if (note) refund.adminNote = note;

      await refund.save();

      // Notify super admins
      const superAdmins = await User.find({ role: 'super_admin' });
      for (const sa of superAdmins) {
        if (sa._id.toString() !== context.user.id) {
          await sendNotification(sa._id.toString(), {
            type: 'refund_verified',
            title: 'Refund Verified - Awaiting Approval',
            message: `Refund of ${refund.amount} RWF has been verified and needs your approval`,
            link: '/portal/super-admin/refunds',
          });
        }
      }

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: refund.adminNote || null,
        verifiedBy: refund.verifiedBy?.toString() || null,
        verifiedAt: refund.verifiedAt?.toISOString() || null,
        approvedBy: null,
        approvedAt: null,
        forceApproved: refund.forceApproved,
        cancelledDisbursements: refund.cancelledDisbursements.map((id) => id.toString()),
        refundedAmount: refund.refundedAmount,
        refundFee: refund.refundFee || 0,
        refundableAmountAfterFee: refund.refundableAmountAfterFee || 0,
        payoutMethod: refund.payoutMethod || null,
        payoutReferenceId: refund.payoutReferenceId || null,
        customerPhone: refund.customerPhone || null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },

    /**
     * Super admin approves a verified refund request
     * This processes the actual refund, cancelling all related items
     */
    approveRefund: async (
      _: any,
      { id, note }: { id: string; note?: string },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized - admin or super_admin only');
      }

      const refund = await RefundRequest.findById(id);
      if (!refund) throw new Error('Refund request not found');

      // Super admin can approve from 'pending' OR 'admin_verified' status.
      // The 'pending' → 'approved' path skips separate admin verification.
      if (refund.status !== 'admin_verified' && refund.status !== 'pending') {
        throw new Error(`Cannot approve - current status is ${refund.status}. Must be 'pending' or 'admin_verified'.`);
      }

      // Process the refund: cancel all related items
      await processRefundActions(refund, context.user.id, false);

      // Calculate 5% refund fee (platform fee, deducted from customer refund)
      const refundFee = Math.round(refund.amount * 0.05);
      const refundableAmountAfterFee = refund.amount - refundFee;

      refund.status = 'approved';
      refund.approvedBy = new mongoose.Types.ObjectId(context.user.id);
      refund.approvedAt = new Date();
      refund.refundedAmount = refund.amount;
      refund.refundFee = refundFee;
      refund.refundableAmountAfterFee = refundableAmountAfterFee;
      if (note) refund.adminNote = note;

      await refund.save();

      // Mark the payment as refunded
      await Payment.findByIdAndUpdate(refund.paymentId, { status: 'refunded' });

      // Notify the user
      await sendNotification(refund.userId.toString(), {
        type: 'refund_approved',
        title: 'Refund Approved',
        message: `Your refund of ${refund.amount} RWF has been approved. All course/program access has been cancelled.`,
        link: '/portal/my-payments',
      });

      // Notify admins
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
      for (const admin of admins) {
        if (admin._id.toString() !== context.user.id) {
          await sendNotification(admin._id.toString(), {
            type: 'refund_completed',
            title: 'Refund Processed',
            message: `Refund of ${refund.amount} RWF has been approved and processed by ${context.user.fullName || context.user.username}`,
            link: '/portal/super-admin/refunds',
          });
        }
      }

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: refund.adminNote || null,
        verifiedBy: refund.verifiedBy?.toString() || null,
        verifiedAt: refund.verifiedAt?.toISOString() || null,
        approvedBy: refund.approvedBy?.toString() || null,
        approvedAt: refund.approvedAt?.toISOString() || null,
        forceApproved: false,
        cancelledDisbursements: refund.cancelledDisbursements.map((id) => id.toString()),
        refundedAmount: refund.refundedAmount,
        refundFee: refund.refundFee || 0,
        refundableAmountAfterFee: refund.refundableAmountAfterFee || 0,
        payoutMethod: refund.payoutMethod || null,
        payoutReferenceId: refund.payoutReferenceId || null,
        customerPhone: refund.customerPhone || null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },

    /**
     * Super admin force-approves a refund (bypasses admin verification)
     */
    forceApproveRefund: async (
      _: any,
      { id, note }: { id: string; note?: string },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized - admin or super_admin only');
      }

      const refund = await RefundRequest.findById(id);
      if (!refund) throw new Error('Refund request not found');

      if (refund.status === 'approved') {
        throw new Error('Refund is already approved');
      }

      // Process the refund
      await processRefundActions(refund, context.user.id, true);

      // Calculate 5% refund fee (platform fee, deducted from customer refund)
      const refundFee = Math.round(refund.amount * 0.05);
      const refundableAmountAfterFee = refund.amount - refundFee;

      refund.status = 'approved';
      refund.approvedBy = new mongoose.Types.ObjectId(context.user.id);
      refund.approvedAt = new Date();
      refund.refundedAmount = refund.amount;
      refund.refundFee = refundFee;
      refund.refundableAmountAfterFee = refundableAmountAfterFee;
      refund.forceApproved = true;
      if (note) refund.adminNote = note;

      await refund.save();

      await Payment.findByIdAndUpdate(refund.paymentId, { status: 'refunded' });

      // Notify the user
      await sendNotification(refund.userId.toString(), {
        type: 'refund_approved',
        title: 'Refund Approved (Force)',
        message: `Your refund of ${refund.amount} RWF has been force-approved by super admin. All access has been cancelled.`,
        link: '/portal/my-payments',
      });

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: refund.adminNote || null,
        verifiedBy: refund.verifiedBy?.toString() || null,
        verifiedAt: refund.verifiedAt?.toISOString() || null,
        approvedBy: refund.approvedBy?.toString() || null,
        approvedAt: refund.approvedAt?.toISOString() || null,
        forceApproved: true,
        cancelledDisbursements: refund.cancelledDisbursements.map((id) => id.toString()),
        refundedAmount: refund.refundedAmount,
        refundFee: refund.refundFee || 0,
        refundableAmountAfterFee: refund.refundableAmountAfterFee || 0,
        payoutMethod: refund.payoutMethod || null,
        payoutReferenceId: refund.payoutReferenceId || null,
        customerPhone: refund.customerPhone || null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },

    /**
     * Reject a refund request
     */
    rejectRefund: async (
      _: any,
      { id, reason }: { id: string; reason: string },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const refund = await RefundRequest.findById(id);
      if (!refund) throw new Error('Refund request not found');
      if (refund.status === 'approved') {
        throw new Error('Cannot reject an already approved refund');
      }

      refund.status = 'rejected';
      refund.adminNote = reason;
      await refund.save();

      // Notify the user
      await sendNotification(refund.userId.toString(), {
        type: 'refund_rejected',
        title: 'Refund Request Rejected',
        message: `Your refund request for ${refund.amount} RWF has been rejected. Reason: ${reason}`,
        link: '/portal/my-payments',
      });

      return {
        id: refund._id.toString(),
        paymentId: refund.paymentId.toString(),
        userId: refund.userId.toString(),
        itemIds: refund.itemIds.map((id) => id.toString()),
        itemTypes: refund.itemTypes,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        adminNote: refund.adminNote || null,
        verifiedBy: refund.verifiedBy?.toString() || null,
        verifiedAt: refund.verifiedAt?.toISOString() || null,
        approvedBy: refund.approvedBy?.toString() || null,
        approvedAt: refund.approvedAt?.toISOString() || null,
        forceApproved: refund.forceApproved,
        cancelledDisbursements: refund.cancelledDisbursements.map((id) => id.toString()),
        refundedAmount: refund.refundedAmount,
        refundFee: refund.refundFee || 0,
        refundableAmountAfterFee: refund.refundableAmountAfterFee || 0,
        payoutMethod: refund.payoutMethod || null,
        payoutReferenceId: refund.payoutReferenceId || null,
        customerPhone: refund.customerPhone || null,
        requestedBy: refund.requestedBy.toString(),
        createdAt: refund.createdAt?.toISOString() || '',
        updatedAt: refund.updatedAt?.toISOString() || '',
      };
    },
  },
};

/**
 * Process refund actions — cancel all related items
 */
async function processRefundActions(
  refund: any,
  approvedById: string,
  forceApproved: boolean
): Promise<void> {
  // 1. Cancel any OnHold disbursements related to this payment
  const onHoldDisbursements = await CommissionDisbursement.find({
    paymentId: refund.paymentId,
    status: 'OnHold',
  });

  const cancelledDisbursementIds: mongoose.Types.ObjectId[] = [];

  for (const disbursement of onHoldDisbursements) {
    disbursement.status = 'Failed' as any;
    disbursement.failureReason = `Cancelled due to refund of payment ${refund.paymentId.toString().slice(-8)}`;
    disbursement.statusHistory.push({
      status: 'Failed',
      timestamp: new Date(),
      note: `Disbursement cancelled: Payment refunded (${forceApproved ? 'force-approved' : 'approved'} by super admin)`,
    });
    await disbursement.save();
    cancelledDisbursementIds.push(disbursement._id);
  }

  refund.cancelledDisbursements = cancelledDisbursementIds;

  // 2. Remove student from course enrollments
  for (let i = 0; i < refund.itemIds.length; i++) {
    const itemId = refund.itemIds[i].toString();
    const itemType = refund.itemTypes[i];

    if (itemType === 'course') {
      // Remove student enrollment from course
      await Course.findByIdAndUpdate(itemId, {
        $pull: { studentsEnrolled: refund.userId },
      });

      // Delete course progress
      await CourseProgress.deleteOne({
        userId: refund.userId,
        courseId: itemId,
      });

      // Remove from user's enrolled courses
      await User.findByIdAndUpdate(refund.userId, {
        $pull: { enrolledCourses: itemId },
      });

      // Revoke certificates for this course
      await Certificate.updateMany(
        { userId: refund.userId, courseId: itemId },
        { status: 'revoked' }
      );
    }

    if (itemType === 'internship') {
      // Update internship status
      await Internship.findByIdAndUpdate(itemId, {
        status: 'cancelled',
      });
    }
  }

  // 3. Actually send the refund to the customer via PawaPay Refund API
  //    and track which payout method was used
  let savedPayoutMethod: 'pawapay_refund' | 'manual_disbursement' | 'none' = 'none';
  let savedPayoutRefId = '';
  let savedCustomerPhone = '';

  try {
    const refundAmount = refund.refundableAmountAfterFee > 0
      ? refund.refundableAmountAfterFee
      : Math.round(refund.amount * 0.95); // Default: 5% platform fee

    // Find the original Payment record to get the PawaPay deposit ID
    // The Payment model stores the PawaPay deposit ID in its transactionId field
    const originalPayment = await Payment.findById(refund.paymentId)
      .select('transactionId paymentMethod')
      .lean();

    if (!originalPayment) {
      console.error(`⚠️ Cannot find original payment ${refund.paymentId} for refund`);
      // Save payout tracking and notify super admins
      refund.payoutMethod = 'none';
      refund.payoutReferenceId = null;
      refund.customerPhone = null;
      await notifyRefundPayoutFailed(refund, `Original payment record ${refund.paymentId} not found`);
      return;
    }

    // Try PawaPay Refund API first (properly reverses the original deposit)
    const pawapay = getPawaPay();
    let pawaRefundSucceeded = false;

    // The Payment.transactionId stores the PawaPay deposit ID for PawaPay payments
    const depositId = originalPayment.paymentMethod?.toLowerCase().includes('pawapay')
      ? originalPayment.transactionId || ''
      : '';

    if (pawapay && depositId) {
      try {
        const refundResult = await pawapay.initiateRefund({
          depositId,
          amount: refundAmount,
          currency: refund.currency || 'RWF',
        });

        if (refundResult.success) {
          pawaRefundSucceeded = true;
          savedPayoutMethod = 'pawapay_refund';
          savedPayoutRefId = refundResult.refundId || '';
          console.log(`✅ PawaPay refund initiated: ${refundResult.refundId}, ${refundAmount} RWF`);
        } else {
          console.warn(`⚠️ PawaPay refund rejected: ${refundResult.reason}, will disburse as refund instead`);
        }
      } catch (pawaErr) {
        console.warn(`⚠️ PawaPay refund failed, will disburse as refund instead:`, (pawaErr as Error).message);
      }
    } else {
      console.log(`ℹ️ Payment ${refund.paymentId} was not a PawaPay payment (method: ${originalPayment.paymentMethod}), disbursing as refund`);
    }

    // Fallback: disburse refund to customer's phone via manual disbursement
    // This always runs when PawaPay refund API is not available or fails
    // Manual disbursement tries PawaPay payout first, then InTouch fallback
    if (!pawaRefundSucceeded) {
      const customer = await User.findById(refund.userId).select('phone').lean();
      if (customer?.phone) {
        savedCustomerPhone = customer.phone;
        const payoutResult = await disbursementService.manualDisburse(
          refund.paymentId.toString(),
          refundAmount,
          customer.phone,
          `Refund for payment ${refund.paymentId.toString().slice(-8)} — ${refund.itemTypes.join(', ')}`
        );
        if (payoutResult.success) {
          savedPayoutMethod = 'manual_disbursement';
          savedPayoutRefId = payoutResult.intouchReferenceId || '';
          console.log(`✅ Refund disbursed to customer ${customer.phone}: ${refundAmount} RWF`);
        } else {
          console.warn(`⚠️ Refund disbursement failed for ${customer.phone}: ${payoutResult.message}`);
        }
      } else {
        console.warn(`⚠️ Cannot disburse refund: customer ${refund.userId} has no phone number`);
      }
    }
  } catch (err) {
    console.error('❌ Refund payout error:', err);
  }

  // Save payout tracking info on the refund record
  refund.payoutMethod = savedPayoutMethod;
  refund.payoutReferenceId = savedPayoutRefId || null;
  refund.customerPhone = savedCustomerPhone || null;

  // 4. Alert super admins if BOTH payout methods failed — manual intervention needed
  if (savedPayoutMethod === 'none') {
    await notifyRefundPayoutFailed(refund,
      'Both PawaPay refund API and manual disbursement fallback failed');
  }

  // 5. Log activity for the user
  await User.findByIdAndUpdate(refund.userId, {
    $push: {
      activityLog: {
        action: 'REFUND_PROCESSED',
        details: `Payment of ${refund.amount} RWF refunded. ${refund.itemTypes.length} item(s) cancelled. Payout: ${savedPayoutMethod}${savedPayoutRefId ? ` (ref: ${savedPayoutRefId})` : ''}`,
        timestamp: new Date(),
      },
    },
  });
}

/**
 * Send an emergency notification to all super admins when a refund payout fails
 * so they can manually intervene.
 */
async function notifyRefundPayoutFailed(refund: any, reason: string): Promise<void> {
  console.error(`🚨 CRITICAL: Refund ${refund._id} approved but payout FAILED!`);
  console.error(`   Reason: ${reason}`);
  console.error(`   Payment: ${refund.paymentId}, Amount: ${refund.amount} RWF, Customer: ${refund.userId}`);
  try {
    const superAdmins = await User.find({ role: 'super_admin' });
    for (const sa of superAdmins) {
      await sendNotification(sa._id.toString(), {
        type: 'refund_payout_failed',
        title: '🚨 REFUND PAYOUT FAILED — Manual Intervention Needed',
        message: `Refund of ${refund.amount} RWF for payment ${refund.paymentId.toString().slice(-8)} was approved but payout failed: ${reason}. Customer ${refund.userId.toString().slice(-8)} has NOT received their money. Please intervene manually.`,
        link: `/portal/super-admin/refunds`,
        amount: refund.amount,
        paymentId: refund.paymentId.toString(),
      });
    }
    console.log(`   📧 Emergency notification sent to ${superAdmins.length} super admin(s)`);
  } catch (notifyErr) {
    console.error('❌ Failed to send emergency notification:', notifyErr);
  }
}
