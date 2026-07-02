import mongoose from 'mongoose';
import { CommissionDisbursement } from '../models/CommissionDisbursement';
import { AdminCommission } from '../models/AdminCommission';
import { Config } from '../models/Config';
import { disbursementService } from '../services/disbursement.service';

export const disbursementResolvers = {
  Query: {
    /**
     * Get all disbursements (super_admin only)
     */
    getAllDisbursements: async (
      _: any,
      {
        page = 1,
        limit = 20,
        status,
        ownerId,
      }: {
        page?: number;
        limit?: number;
        status?: string;
        ownerId?: string;
      },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const filter: any = {};
      if (status) filter.status = status;
      if (ownerId) filter.ownerId = new mongoose.Types.ObjectId(ownerId);

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        CommissionDisbursement.find(filter)
          .populate('paymentId', 'itemTitle amount')
          .populate('customerId', 'username fullName email')
          .populate('ownerId', 'username fullName email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CommissionDisbursement.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items: items.map((d) => ({
          id: d._id.toString(),
          paymentId: d.paymentId?._id?.toString() || d.paymentId?.toString(),
          customerId: d.customerId?._id?.toString() || d.customerId?.toString(),
          ownerId: d.ownerId?._id?.toString() || d.ownerId?.toString(),
          ownerPhone: d.ownerPhone,
          itemId: d.itemId.toString(),
          itemType: d.itemType,
          grossAmount: d.grossAmount,
          platformCommission: d.platformCommission,
          commissionType: d.commissionType,
          commissionValue: d.commissionValue,
          netAmount: d.netAmount,
          status: d.status,
          intouchTransactionRef: d.intouchTransactionRef,
          intouchReferenceId: d.intouchReferenceId,
          failureReason: d.failureReason,
          retryCount: d.retryCount,
          autoDisbursement: d.autoDisbursement,
          statusHistory: d.statusHistory.map((h: any) => ({
            status: h.status,
            timestamp: h.timestamp?.toISOString?.() || h.timestamp,
            note: h.note,
          })),
          createdAt: d.createdAt?.toISOString?.() || '',
          updatedAt: d.updatedAt?.toISOString?.() || '',
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

    /**
     * Get disbursements for the currently logged-in admin/owner
     */
    getMyDisbursements: async (
      _: any,
      {
        page = 1,
        limit = 20,
        status,
      }: {
        page?: number;
        limit?: number;
        status?: string;
      },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const filter: any = {
        ownerId: new mongoose.Types.ObjectId(context.user.id),
      };
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        CommissionDisbursement.find(filter)
          .populate('paymentId', 'itemTitle amount')
          .populate('customerId', 'username fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CommissionDisbursement.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items: items.map((d) => ({
          id: d._id.toString(),
          paymentId: d.paymentId?._id?.toString() || d.paymentId?.toString(),
          customerId: d.customerId?._id?.toString() || d.customerId?.toString(),
          ownerId: d.ownerId?._id?.toString() || d.ownerId?.toString(),
          ownerPhone: d.ownerPhone,
          itemId: d.itemId.toString(),
          itemType: d.itemType,
          grossAmount: d.grossAmount,
          platformCommission: d.platformCommission,
          commissionType: d.commissionType,
          commissionValue: d.commissionValue,
          netAmount: d.netAmount,
          status: d.status,
          intouchTransactionRef: d.intouchTransactionRef,
          intouchReferenceId: d.intouchReferenceId,
          failureReason: d.failureReason,
          retryCount: d.retryCount,
          autoDisbursement: d.autoDisbursement,
          statusHistory: d.statusHistory.map((h: any) => ({
            status: h.status,
            timestamp: h.timestamp?.toISOString?.() || h.timestamp,
            note: h.note,
          })),
          createdAt: d.createdAt?.toISOString?.() || '',
          updatedAt: d.updatedAt?.toISOString?.() || '',
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

    /**
     * Get disbursement by ID
     */
    getDisbursement: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const disbursement = await CommissionDisbursement.findById(id)
        .populate('paymentId', 'itemTitle amount')
        .populate('customerId', 'username fullName email')
        .populate('ownerId', 'username fullName email phone');

      if (!disbursement) throw new Error('Disbursement not found');

      // Only super_admin or the owner can view
      if (
        context.user.role !== 'super_admin' &&
        disbursement.ownerId._id.toString() !== context.user.id
      ) {
        throw new Error('Not authorized');
      }

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString(),
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString(),
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString(),
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: disbursement.statusHistory.map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    /**
     * Get disbursement stats (super_admin only)
     */
    getDisbursementStats: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const [
        totalDisbursements,
        pendingCount,
        processingCount,
        successfulCount,
        failedCount,
        disbursements,
      ] = await Promise.all([
        CommissionDisbursement.countDocuments(),
        CommissionDisbursement.countDocuments({ status: 'Pending' }),
        CommissionDisbursement.countDocuments({ status: 'Processing' }),
        CommissionDisbursement.countDocuments({ status: 'Successful' }),
        CommissionDisbursement.countDocuments({ status: 'Failed' }),
        CommissionDisbursement.find({}).lean(),
      ]);

      let totalDisbursed = 0;
      let totalCommission = 0;
      let pendingToDisburse = 0;

      for (const d of disbursements) {
        if (d.status === 'Successful') {
          totalDisbursed += d.netAmount;
          totalCommission += d.platformCommission;
        }
        if (d.status === 'Pending' || d.status === 'Processing' || d.status === 'Failed') {
          pendingToDisburse += d.netAmount;
        }
      }

      return {
        totalDisbursements,
        pendingCount,
        processingCount,
        successfulCount,
        failedCount,
        totalDisbursed: Math.round(totalDisbursed),
        totalCommission: Math.round(totalCommission),
        pendingToDisburse: Math.round(pendingToDisburse),
      };
    },

    /**
     * Get platform commission config
     */
    getPlatformCommissionConfig: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const config = await disbursementService.getPlatformCommissionConfig();
      const autoDisbursementConfig = await Config.findOne({ key: 'auto_disbursement_enabled' });

      return {
        type: config.type,
        value: config.value,
        autoDisbursement: autoDisbursementConfig?.value !== 'false',
      };
    },
  },

  Mutation: {
    /**
     * Update platform commission config (super_admin only)
     */
    updatePlatformCommissionConfig: async (
      _: any,
      { type, value }: { type: string; value: number },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      if (!['percentage', 'fixed'].includes(type)) {
        throw new Error('Type must be "percentage" or "fixed"');
      }

      if (value < 0) {
        throw new Error('Value must be >= 0');
      }

      if (type === 'percentage' && value > 100) {
        throw new Error('Percentage must be <= 100');
      }

      await Promise.all([
        Config.findOneAndUpdate(
          { key: 'platform_commission_type' },
          { $set: { value: type, description: 'Platform commission type: percentage or fixed' } },
          { upsert: true }
        ),
        Config.findOneAndUpdate(
          { key: 'platform_commission_value' },
          { $set: { value: value.toString(), description: 'Platform commission value' } },
          { upsert: true }
        ),
      ]);

      const autoDisbursementConfig = await Config.findOne({ key: 'auto_disbursement_enabled' });

      return {
        type,
        value,
        autoDisbursement: autoDisbursementConfig?.value !== 'false',
      };
    },

    /**
     * Toggle auto-disbursement (super_admin only)
     */
    toggleAutoDisbursement: async (
      _: any,
      { enabled }: { enabled: boolean },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      await Config.findOneAndUpdate(
        { key: 'auto_disbursement_enabled' },
        {
          $set: {
            value: enabled ? 'true' : 'false',
            description: 'Enable/disable automatic disbursement after payment',
          },
        },
        { upsert: true }
      );

      const config = await disbursementService.getPlatformCommissionConfig();

      return {
        type: config.type,
        value: config.value,
        autoDisbursement: enabled,
      };
    },

    /**
     * Retry a failed disbursement (super_admin only)
     */
    retryDisbursement: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.retryDisbursement(id);

      const disbursement = await CommissionDisbursement.findById(id)
        .populate('paymentId', 'itemTitle amount')
        .populate('customerId', 'username fullName email')
        .populate('ownerId', 'username fullName email phone');

      if (!disbursement) throw new Error('Disbursement not found after retry');

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || disbursement.paymentId.toString(),
        customerId: (disbursement.customerId as any)?._id?.toString() || disbursement.customerId.toString(),
        ownerId: (disbursement.ownerId as any)?._id?.toString() || disbursement.ownerId.toString(),
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: disbursement.statusHistory.map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    /**
     * Manually trigger a disbursement (super_admin only)
     */
    manualDisburse: async (
      _: any,
      {
        paymentId,
        amount,
        phoneNumber,
        reason,
      }: {
        paymentId: string;
        amount: number;
        phoneNumber: string;
        reason?: string;
      },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.manualDisburse(
        paymentId,
        amount,
        phoneNumber,
        reason
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      // Return a minimal disbursement object
      return {
        id: 'manual-' + Date.now(),
        paymentId,
        customerId: '',
        ownerId: '',
        ownerPhone: phoneNumber,
        itemId: '',
        itemType: 'manual',
        grossAmount: amount,
        platformCommission: 0,
        commissionType: 'percentage',
        commissionValue: 0,
        netAmount: amount,
        status: result.success ? 'Successful' : 'Failed',
        intouchTransactionRef: '',
        intouchReferenceId: result.intouchReferenceId,
        failureReason: result.success ? null : result.message,
        retryCount: 0,
        autoDisbursement: false,
        statusHistory: [
          {
            status: result.success ? 'Successful' : 'Failed',
            timestamp: new Date().toISOString(),
            note: reason || 'Manual disbursement',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  },
};
