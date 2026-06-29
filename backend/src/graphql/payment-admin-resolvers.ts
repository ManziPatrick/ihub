import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { PayoutRecord } from '../models/PayoutRecord';
import { AdminCommission } from '../models/AdminCommission';
import { Config } from '../models/Config';
import { User } from '../models/User';

// ─── Helper: Calculate commission for a single payment ─────────────────

interface CommissionCalc {
  totalCommission: number;
  entries: {
    adminId: string;
    adminName: string;
    percentage: number;
    amount: number;
    scope: string;
    scopeTitle: string | null;
  }[];
}

async function calculatePaymentCommission(payment: any): Promise<CommissionCalc> {
  const allCourseIds = [
    ...(payment.courseIds || []).map((id: any) => id.toString()),
    ...(payment.courseId ? [payment.courseId.toString()] : []),
  ];
  const allInternshipIds = (payment.internshipIds || []).map((id: any) => id.toString());
  const totalItems = allCourseIds.length + allInternshipIds.length;

  // Find all active commission configs
  const activeConfigs = await AdminCommission.find({ active: true }).populate(
    'adminId',
    'username fullName email'
  );

  const result: CommissionCalc = { totalCommission: 0, entries: [] };

  if (totalItems === 0) {
    // Apply global commissions
    for (const config of activeConfigs) {
      if (config.scope === 'global') {
        const amount = payment.amount * (config.percentage / 100);
        result.totalCommission += amount;
        result.entries.push({
          adminId: (config.adminId as any)._id.toString(),
          adminName: (config.adminId as any).fullName || (config.adminId as any).username,
          percentage: config.percentage,
          amount: Math.round(amount),
          scope: 'global',
          scopeTitle: null,
        });
      }
    }
    return result;
  }

  const amountPerItem = payment.amount / totalItems;

  for (const cId of allCourseIds) {
    // Check course-specific, then fall back to global
    const matchingConfigs = activeConfigs.filter(
      (c: any) =>
        c.scope === 'course' && c.scopeId?.toString() === cId
    );
    if (matchingConfigs.length > 0) {
      for (const config of matchingConfigs) {
        const commissionAmount = amountPerItem * (config.percentage / 100);
        result.totalCommission += commissionAmount;
        result.entries.push({
          adminId: (config.adminId as any)._id.toString(),
          adminName: (config.adminId as any).fullName || (config.adminId as any).username,
          percentage: config.percentage,
          amount: Math.round(commissionAmount),
          scope: 'course',
          scopeTitle: config.scopeTitle || null,
        });
      }
    }
  }

  for (const iId of allInternshipIds) {
    const matchingConfigs = activeConfigs.filter(
      (c: any) =>
        c.scope === 'internship' && c.scopeId?.toString() === iId
    );
    if (matchingConfigs.length > 0) {
      for (const config of matchingConfigs) {
        const commissionAmount = amountPerItem * (config.percentage / 100);
        result.totalCommission += commissionAmount;
        result.entries.push({
          adminId: (config.adminId as any)._id.toString(),
          adminName: (config.adminId as any).fullName || (config.adminId as any).username,
          percentage: config.percentage,
          amount: Math.round(commissionAmount),
          scope: 'internship',
          scopeTitle: config.scopeTitle || null,
        });
      }
    }
  }

  // Apply global commission for items not matched to specific scopes
  for (const config of activeConfigs) {
    if (config.scope === 'global') {
      // Only apply global to items not already covered
      const uncoveredItems = [...allCourseIds, ...allInternshipIds].filter((id) => {
        return !activeConfigs.some(
          (c: any) =>
            c.scope !== 'global' &&
            c.scopeId?.toString() === id
        );
      });
      if (uncoveredItems.length > 0) {
        const uncoveredAmount =
          (uncoveredItems.length / totalItems) * payment.amount;
        const commissionAmount = uncoveredAmount * (config.percentage / 100);
        result.totalCommission += commissionAmount;
        result.entries.push({
          adminId: (config.adminId as any)._id.toString(),
          adminName: (config.adminId as any).fullName || (config.adminId as any).username,
          percentage: config.percentage,
          amount: Math.round(commissionAmount),
          scope: 'global',
          scopeTitle: null,
        });
      }
    }
  }

  result.totalCommission = Math.round(result.totalCommission);
  return result;
}

// ─── Resolvers ──────────────────────────────────────────────────────────

export const paymentAdminResolvers = {
  Query: {
    /**
     * Get all payment transactions with commission breakdown
     */
    getAllAdminPaymentTransactions: async (
      _: any,
      {
        page = 1,
        limit = 50,
        status,
        paymentMethod,
      }: {
        page?: number;
        limit?: number;
        status?: string;
        paymentMethod?: string;
      },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const filter: any = {};
      if (status) filter.status = status;
      if (paymentMethod) filter.paymentMethod = paymentMethod;

      const skip = (page - 1) * limit;

      const [payments, totalCount] = await Promise.all([
        Payment.find(filter)
          .populate('userId', 'username fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Payment.countDocuments(filter),
      ]);

      // Calculate commissions for each payment
      const items = await Promise.all(
        payments.map(async (payment) => {
          const commission = await calculatePaymentCommission(payment);
          return {
            id: payment._id.toString(),
            studentName: (payment.userId as any)?.fullName || (payment.userId as any)?.username || 'Unknown',
            studentEmail: (payment.userId as any)?.email || '',
            type: payment.type || 'Course Enrollment',
            itemTitle: payment.itemTitle,
            amount: payment.amount,
            currency: payment.currency || 'RWF',
            status: payment.status,
            paymentMethod: payment.paymentMethod || 'Mobile Money',
            grossAmount: payment.amount,
            totalCommission: commission.totalCommission,
            netAmount: payment.amount - commission.totalCommission,
            commissionEntries: commission.entries,
            createdAt: payment.createdAt?.toISOString?.() || payment.createdAt?.toString(),
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items,
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

    /**
     * Get payment analytics — gross revenue, total commissions, net revenue
     */
    getPaymentAnalytics: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const [completedPayments, pendingPayments, totalPayments] =
        await Promise.all([
          Payment.find({ status: 'completed' }),
          Payment.find({ status: 'pending' }),
          Payment.countDocuments(),
        ]);

      const grossRevenue = completedPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );
      const pendingRevenue = pendingPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      // Calculate total commissions for completed payments
      let totalCommissions = 0;
      for (const payment of completedPayments) {
        const calc = await calculatePaymentCommission(payment);
        totalCommissions += calc.totalCommission;
      }

      const activeConfigsCount = await AdminCommission.countDocuments({
        active: true,
      });
      const distinctAdminsWithCommissions =
        await AdminCommission.distinct('adminId', { active: true });

      return {
        totalPayments,
        completedPayments: completedPayments.length,
        pendingPayments: pendingPayments.length,
        grossRevenue: Math.round(grossRevenue),
        pendingRevenue: Math.round(pendingRevenue),
        totalCommissions: Math.round(totalCommissions),
        netRevenue: Math.round(grossRevenue - totalCommissions),
        activeCommissionConfigs: activeConfigsCount,
        adminsWithCommission: distinctAdminsWithCommissions.length,
      };
    },

    /**
     * Get pending payouts (commission amounts waiting for approval)
     */
    getPendingPayouts: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      // Get payout records
      const payoutRecords = await PayoutRecord.find({ status: 'pending' })
        .populate('adminId', 'username fullName email')
        .populate('approvedBy', 'username fullName email')
        .sort({ createdAt: -1 })
        .limit(50);

      // Also get commission report data for pending calculation
      const allAdmins = await User.find({ role: 'admin' }).select(
        'username fullName email'
      );

      // If no payout records exist, generate preview from commission report
      if (payoutRecords.length === 0) {
        const completedPayments = await Payment.find({ status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(200);

        const adminPayouts: Record<
          string,
          {
            adminId: string;
            adminName: string;
            adminEmail: string;
            amount: number;
            paymentsCount: number;
            entries: any[];
          }
        > = {};

        for (const admin of allAdmins) {
          const adminId = admin._id.toString();
          adminPayouts[adminId] = {
            adminId,
            adminName: admin.fullName || admin.username,
            adminEmail: admin.email,
            amount: 0,
            paymentsCount: 0,
            entries: [],
          };
        }

        for (const payment of completedPayments) {
          const calc = await calculatePaymentCommission(payment);
          for (const entry of calc.entries) {
            if (adminPayouts[entry.adminId]) {
              adminPayouts[entry.adminId].amount += entry.amount;
              adminPayouts[entry.adminId].paymentsCount += 1;
              adminPayouts[entry.adminId].entries.push({
                paymentId: payment._id.toString(),
                itemTitle: payment.itemTitle,
                amount: payment.amount,
                commissionPercentage: entry.percentage,
                commissionAmount: entry.amount,
              });
            }
          }
        }

        return Object.values(adminPayouts)
          .filter((p) => p.amount > 0)
          .sort((a, b) => b.amount - a.amount);
      }

      // Map from existing payout records
      return payoutRecords.map((record) => ({
        adminId: (record.adminId as any)._id.toString(),
        adminName:
          (record.adminId as any).fullName || (record.adminId as any).username,
        adminEmail: (record.adminId as any).email,
        amount: record.amount,
        paymentsCount: record.commissionEntries.length,
        entries: record.commissionEntries.map((e) => ({
          paymentId: e.paymentId.toString(),
          amount: e.amount,
          commissionPercentage: e.commissionPercentage,
          commissionAmount: e.commissionAmount,
        })),
      }));
    },

    /**
     * Get all payout records
     */
    getAllPayoutRecords: async (
      _: any,
      { page = 1, limit = 20 }: { page?: number; limit?: number },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const skip = (page - 1) * limit;
      const [records, totalCount] = await Promise.all([
        PayoutRecord.find()
          .populate('adminId', 'username fullName email')
          .populate('approvedBy', 'username fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PayoutRecord.countDocuments(),
      ]);

      const items = records.map((r) => ({
        id: r._id.toString(),
        adminId: (r.adminId as any)?._id?.toString() || r.adminId.toString(),
        adminName:
          (r.adminId as any)?.fullName ||
          (r.adminId as any)?.username ||
          'Unknown',
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        periodStart: r.periodStart?.toISOString?.() || '',
        periodEnd: r.periodEnd?.toISOString?.() || '',
        entriesCount: r.commissionEntries.length,
        approvedBy: r.approvedBy
          ? {
              id: (r.approvedBy as any)._id?.toString(),
              name:
                (r.approvedBy as any)?.fullName ||
                (r.approvedBy as any)?.username,
            }
          : null,
        approvedAt: r.approvedAt?.toISOString?.() || null,
        paidAt: r.paidAt?.toISOString?.() || null,
        notes: r.notes || null,
        createdAt: r.createdAt?.toISOString?.() || '',
      }));

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items,
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

    /**
     * Get the default payment method from config
     */
    getDefaultPaymentMethod: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const config = await Config.findOne({ key: 'defaultPaymentMethod' });
      return config?.value || 'mtn';
    },
  },

  Mutation: {
    /**
     * Generate payout records for all admins with pending commissions
     */
    generatePayouts: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const allAdmins = await User.find({ role: 'admin' }).select('_id');
      const completedPayments = await Payment.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(200);

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = now;

      let created = 0;

      for (const admin of allAdmins) {
        const adminId = admin._id.toString();
        let totalAmount = 0;
        const entries: any[] = [];

        for (const payment of completedPayments) {
          const calc = await calculatePaymentCommission(payment);
          for (const entry of calc.entries) {
            if (entry.adminId === adminId) {
              totalAmount += entry.amount;
              entries.push({
                paymentId: payment._id,
                amount: payment.amount,
                commissionPercentage: entry.percentage,
                commissionAmount: entry.amount,
              });
            }
          }
        }

        if (totalAmount > 0 && entries.length > 0) {
          await PayoutRecord.create({
            adminId: admin._id,
            amount: Math.round(totalAmount),
            currency: 'RWF',
            status: 'pending',
            periodStart,
            periodEnd,
            commissionEntries: entries,
          });
          created++;
        }
      }

      return {
        success: true,
        recordsCreated: created,
        message: `Generated ${created} payout record(s)`,
      };
    },

    /**
     * Approve a pending payout
     */
    approvePayout: async (
      _: any,
      { payoutId, notes }: { payoutId: string; notes?: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const record = await PayoutRecord.findById(payoutId);
      if (!record) throw new Error('Payout record not found');
      if (record.status !== 'pending')
        throw new Error('Payout is not in pending status');

      record.status = 'approved';
      record.approvedBy = new mongoose.Types.ObjectId(context.user.id);
      record.approvedAt = new Date();
      if (notes) record.notes = notes;
      await record.save();

      await record.populate('adminId', 'username fullName email');
      await record.populate('approvedBy', 'username fullName email');

      return record;
    },

    /**
     * Mark a payout as paid
     */
    markPayoutPaid: async (
      _: any,
      { payoutId, notes }: { payoutId: string; notes?: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const record = await PayoutRecord.findById(payoutId);
      if (!record) throw new Error('Payout record not found');
      if (record.status !== 'approved')
        throw new Error('Payout must be approved first');

      record.status = 'paid';
      record.paidAt = new Date();
      if (notes) record.notes = notes;
      await record.save();

      await record.populate('adminId', 'username fullName email');

      return record;
    },

    /**
     * Cancel a payout
     */
    cancelPayout: async (
      _: any,
      { payoutId, reason }: { payoutId: string; reason?: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const record = await PayoutRecord.findById(payoutId);
      if (!record) throw new Error('Payout record not found');
      if (record.status === 'paid')
        throw new Error('Cannot cancel a paid payout');

      record.status = 'cancelled';
      if (reason) record.notes = reason;
      await record.save();

      return record;
    },

    /**
     * Set the default payment method
     */
    setDefaultPaymentMethod: async (
      _: any,
      { method }: { method: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const validMethods = [
        'pawapay',
        'mtn',
        'airtel',
        'card',
        'manual',
        'intouch',
      ];
      if (!validMethods.includes(method)) {
        throw new Error(
          `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
        );
      }

      await Config.findOneAndUpdate(
        { key: 'defaultPaymentMethod' },
        { $set: { value: method, description: 'Default payment method for checkout' } },
        { upsert: true }
      );

      return method;
    },
  },
};
