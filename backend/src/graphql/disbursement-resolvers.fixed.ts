import mongoose from 'mongoose';
import { CommissionDisbursement } from '../models/CommissionDisbursement';
import { PaymentTransaction } from '../models/PaymentTransaction';
import { Config } from '../models/Config';
import { disbursementService } from '../services/disbursement.service';
import { createIntouchService } from '../services/intouch.service';
import { createPaypackService } from '../services/paypack.service';
import { Course } from '../models/Course';
import { InternshipProgram } from '../models/internship/InternshipProgram';

/**
 * Get item IDs owned/administered by the given admin user.
 * Used to scope disbursement queries to the admin's courses/internships.
 */
async function getAdminItemIds(adminId: string): Promise<mongoose.Types.ObjectId[]> {
  const courses = await Course.find({
    $or: [{ instructor: adminId }, { createdBy: adminId }],
  }).select('_id').lean();

  const programs = await InternshipProgram.find({
    createdBy: adminId,
  }).select('_id').lean();

  const ids = [
    ...courses.map((c) => c._id),
    ...programs.map((p) => p._id),
  ];

  return ids;
}

/**
 * This file mirrors backend/src/graphql/disbursement-resolvers.ts
 * with one key fix: GraphQL schema marks CommissionDisbursement.customerId as non-nullable,
 * but some documents can have missing/unpopulated customerId.
 * We ensure we never return null for customerId (or any other non-nullable scalar).
 */
export const disbursementResolvers = {
  Query: {
    getPawaPayStatus: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      try {
        const pawapay = createPaypackService();
        const status = await pawapay.getMerchantStatus();
        return {
          connected: status.connected,
          activeConfigs: status.activeConfigs,
          countries: status.countries,
          message: status.message || null,
        };
      } catch (error: any) {
        console.error('❌ getPawaPayStatus error:', error);
        return {
          connected: false,
          activeConfigs: 0,
          countries: [],
          message: error.message || 'Failed to fetch PawaPay status',
        };
      }
    },

    getPawaPayBalance: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      try {
        const pawapay = createPaypackService();
        const result = await pawapay.getWalletBalance();
        return {
          success: result.success,
          balances: (result.balances || []).map((b: any) => ({
            currency: b.currency,
            available: Number(b.balance ?? b.available ?? 0),
            pending: b.pending != null ? parseFloat(b.pending) : null,
            reserved: b.reserved != null ? parseFloat(b.reserved) : null,
          })),
          message: result.message || null,
        };
      } catch (error: any) {
        console.error('❌ getPawaPayBalance error:', error);
        return {
          success: false,
          balances: [],
          message: error.message || 'Failed to fetch PawaPay balance',
        };
      }
    },

    getIntouchBalance: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      try {
        const intouchService = createIntouchService();
        const result = await intouchService.getBalance();

        return {
          balance: result.balance || 0,
          currency: 'RWF',
          success: result.success,
          message: result.message || null,
          raw: result.raw ? JSON.stringify(result.raw) : null,
        };
      } catch (error: any) {
        console.error('❌ getIntouchBalance error:', error);
        return {
          balance: 0,
          currency: 'RWF',
          success: false,
          message: error.message || 'Failed to fetch balance',
          raw: null,
        };
      }
    },

    getAllDisbursements: async (_: any, args: any, context: any) => {
      const { page = 1, limit = 20, status, ownerId } = args;

      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const filter: any = {};
      if (status) filter.status = status;
      if (ownerId) filter.ownerId = new mongoose.Types.ObjectId(ownerId);

      // Scope to admin's own courses/internships if not super_admin
      if (context.user.role === 'admin') {
        const adminItemIds = await getAdminItemIds(context.user.id);
        filter.itemId = { $in: adminItemIds };
      }

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
          paymentId: d.paymentId?._id?.toString() || d.paymentId?.toString() || '',
          customerId: d.customerId?._id?.toString() || d.customerId?.toString() || '',
          ownerId: d.ownerId?._id?.toString() || d.ownerId?.toString() || '',
          ownerPhone: d.ownerPhone,
          itemId: d.itemId.toString(),
          itemType: d.itemType,
          grossAmount: d.grossAmount,
          platformCommission: d.platformCommission,
          commissionType: d.commissionType,
          commissionValue: d.commissionValue,
          netAmount: d.netAmount,
          status: d.status,
          releaseDate: d.releaseDate?.toISOString?.() || d.releaseDate || null,
          approvedBy: d.approvedBy?.toString() || null,
          approvedAt: d.approvedAt?.toISOString?.() || null,
          holdNote: d.holdNote || null,
          intouchTransactionRef: d.intouchTransactionRef,
          intouchReferenceId: d.intouchReferenceId,
          failureReason: d.failureReason,
          retryCount: d.retryCount,
          autoDisbursement: d.autoDisbursement,
          statusHistory: (d.statusHistory || []).map((h: any) => ({
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

    getMyDisbursements: async (_: any, args: any, context: any) => {
      const { page = 1, limit = 20, status } = args;

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
          paymentId: d.paymentId?._id?.toString() || d.paymentId?.toString() || '',
          customerId: d.customerId?._id?.toString() || d.customerId?.toString() || '',
          ownerId: d.ownerId?._id?.toString() || d.ownerId?.toString() || '',
          ownerPhone: d.ownerPhone,
          itemId: d.itemId.toString(),
          itemType: d.itemType,
          grossAmount: d.grossAmount,
          platformCommission: d.platformCommission,
          commissionType: d.commissionType,
          commissionValue: d.commissionValue,
          netAmount: d.netAmount,
          status: d.status,
          releaseDate: d.releaseDate?.toISOString?.() || d.releaseDate || null,
          approvedBy: d.approvedBy?.toString() || null,
          approvedAt: d.approvedAt?.toISOString?.() || null,
          holdNote: d.holdNote || null,
          intouchTransactionRef: d.intouchTransactionRef,
          intouchReferenceId: d.intouchReferenceId,
          failureReason: d.failureReason,
          retryCount: d.retryCount,
          autoDisbursement: d.autoDisbursement,
          statusHistory: (d.statusHistory || []).map((h: any) => ({
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
        disbursement.ownerId?._id?.toString?.() !== context.user.id
      ) {
        throw new Error('Not authorized');
      }

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString?.() || '',
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString?.() || '',
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString?.() || '',
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        releaseDate: disbursement.releaseDate?.toISOString?.() || null,
        approvedBy: disbursement.approvedBy?.toString() || null,
        approvedAt: disbursement.approvedAt?.toISOString?.() || null,
        holdNote: disbursement.holdNote || null,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: (disbursement.statusHistory || []).map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    getDisbursementStats: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      // Scope to admin's own items if not super_admin
      const itemFilter: any = {};
      if (context.user.role === 'admin') {
        const adminItemIds = await getAdminItemIds(context.user.id);
        if (adminItemIds.length === 0) {
          // Admin has no courses — return empty stats
          return {
            totalDisbursements: 0,
            onHoldCount: 0,
            pendingCount: 0,
            processingCount: 0,
            successfulCount: 0,
            failedCount: 0,
            totalDisbursed: 0,
            totalCommission: 0,
            pendingToDisburse: 0,
          };
        }
        itemFilter.itemId = { $in: adminItemIds };
      }

      const [
        totalDisbursements,
        onHoldCount,
        pendingCount,
        processingCount,
        successfulCount,
        failedCount,
        disbursements,
      ] = await Promise.all([
        CommissionDisbursement.countDocuments(itemFilter),
        CommissionDisbursement.countDocuments({ ...itemFilter, status: 'OnHold' }),
        CommissionDisbursement.countDocuments({ ...itemFilter, status: 'Pending' }),
        CommissionDisbursement.countDocuments({ ...itemFilter, status: 'Processing' }),
        CommissionDisbursement.countDocuments({ ...itemFilter, status: 'Successful' }),
        CommissionDisbursement.countDocuments({ ...itemFilter, status: 'Failed' }),
        CommissionDisbursement.find(itemFilter).lean(),
      ]);

      let totalDisbursed = 0;
      let totalCommission = 0;
      let pendingToDisburse = 0;

      for (const d of disbursements as any[]) {
        if (d.status === 'Successful') {
          totalDisbursed += d.netAmount;
          totalCommission += d.platformCommission;
        }
        if (d.status === 'Pending' || d.status === 'Processing' || d.status === 'Failed' || d.status === 'OnHold') {
          pendingToDisburse += d.netAmount;
        }
      }

      return {
        totalDisbursements,
        onHoldCount,
        pendingCount,
        processingCount,
        successfulCount,
        failedCount,
        totalDisbursed: Math.round(totalDisbursed),
        totalCommission: Math.round(totalCommission),
        pendingToDisburse: Math.round(pendingToDisburse),
      };
    },

    getPlatformCommissionConfig: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const [config, autoDisbursementConfig, primaryProvider] = await Promise.all([
        disbursementService.getPlatformCommissionConfig(),
        Config.findOne({ key: 'auto_disbursement_enabled' }),
        disbursementService.getDisbursementPrimaryProvider(),
      ]);

      return {
        type: config.type,
        value: config.value,
        autoDisbursement: autoDisbursementConfig?.value !== 'false',
        disbursementPrimaryProvider: primaryProvider,
      };
    },

    getHoldDaysConfig: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      return await disbursementService.getHoldDays();
    },
  },

  Mutation: {
    requestIntouchPayment: async (_: any, { amount, phoneNumber, reason }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!phoneNumber || phoneNumber.trim() === '') {
        throw new Error('Phone number is required');
      }

      try {
        const intouchService = createIntouchService();
        const trxRef = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Normalize phone: remove +, ensure 250 prefix
        const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
        let normalizedPhone = cleanedPhone;
        if (cleanedPhone.startsWith('0')) {
          normalizedPhone = '250' + cleanedPhone.slice(1);
        } else if (cleanedPhone.startsWith('7')) {
          normalizedPhone = '250' + cleanedPhone;
        }

        // CASHIN — requestPayment sends a USSD prompt to the user's phone
        const callbackUrl = `${process.env.BACKEND_URL || 'https://api.codemande.com'}/api/payments/intouch/callback`;

        const result = await intouchService.requestPayment({
          amount,
          phoneNumber: normalizedPhone,
          requestTransactionId: trxRef,
          callbackUrl,
        });

        // Persist to PaymentTransaction collection
        try {
          const txRecord = new PaymentTransaction({
            userId: context.user.id,
            type: 'CASHIN',
            amount,
            status: result.success ? 'pending' : 'failed',
            intouchRef: trxRef,
            intouchTransactionId: result.transactionId,
            paymentMethod: 'intouch',
            phoneNumber: normalizedPhone,
            description: reason || 'IntouchPay deposit/top-up',
          });
          await txRecord.save();
        } catch (dbErr) {
          console.warn('⚠️ Could not persist deposit transaction:', dbErr);
        }

        return {
          success: result.success,
          message: result.message || (result.success ? 'Deposit initiated — check your phone for USSD prompt' : 'Failed to initiate deposit'),
          transactionId: result.transactionId || trxRef,
          referenceId: (result as any).referenceId || null,
          amount,
          phoneNumber: normalizedPhone,
        };
      } catch (error: any) {
        console.error('❌ requestIntouchPayment error:', error);
        throw new Error(error.message || 'Failed to initiate deposit');
      }
    },

    sendDirectMoney: async (_: any, { amount, phoneNumber, reason }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!phoneNumber || phoneNumber.trim() === '') {
        throw new Error('Phone number is required');
      }

      try {
        const intouchService = createIntouchService();
        const trxRef = `DIR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Normalize phone: remove +, ensure 250 prefix
        const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
        let normalizedPhone = cleanedPhone;
        if (cleanedPhone.startsWith('0')) {
          normalizedPhone = '250' + cleanedPhone.slice(1);
        } else if (cleanedPhone.startsWith('7')) {
          normalizedPhone = '250' + cleanedPhone;
        }

        const result = await intouchService.requestDeposit({
          amount,
          phoneNumber: normalizedPhone,
          requestTransactionId: trxRef,
          reason: reason || 'Direct payment from iHub',
          withdrawCharge: 0,
          serviceId: 1,
        });

        // Persist to PaymentTransaction collection
        try {
          const txRecord = new PaymentTransaction({
            userId: context.user.id,
            type: 'CASHOUT',
            amount,
            status: result.success ? 'successful' : 'failed',
            intouchRef: trxRef,
            intouchTransactionId: result.transactionId,
            paymentMethod: 'intouch',
            phoneNumber: normalizedPhone,
            description: reason || 'Direct payment from iHub',
          });
          await txRecord.save();
        } catch (dbErr) {
          console.warn('⚠️ Could not persist send transaction:', dbErr);
        }

        return {
          success: result.success,
          message: result.message || (result.success ? 'Money sent successfully' : 'Failed to send money'),
          transactionId: result.transactionId || trxRef,
          referenceId: (result as any).referenceId || null,
          amount,
          phoneNumber: normalizedPhone,
        };
      } catch (error: any) {
        console.error('❌ sendDirectMoney error:', error);
        throw new Error(error.message || 'Failed to send money');
      }
    },

    setHoldDaysConfig: async (_: any, { days }: { days: number }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      if (typeof days !== 'number' || days < 0 || days > 365) {
        throw new Error('Hold days must be between 0 and 365');
      }

      const clamped = await disbursementService.setHoldDays(days);
      return clamped;
    },

    setDisbursementPrimaryProvider: async (_: any, { provider }: { provider: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      if (!['pawapay', 'intouch'].includes(provider)) {
        throw new Error('Provider must be "pawapay" or "intouch"');
      }

      await Config.findOneAndUpdate(
        { key: 'disbursement_primary_provider' },
        {
          $set: {
            value: provider,
            description: 'Primary provider for disbursements: pawapay or intouch',
          },
        },
        { upsert: true }
      );

      const config = await disbursementService.getPlatformCommissionConfig();
      const autoDisbursementConfig = await Config.findOne({ key: 'auto_disbursement_enabled' });

      return {
        type: config.type,
        value: config.value,
        autoDisbursement: autoDisbursementConfig?.value !== 'false',
        disbursementPrimaryProvider: provider,
      };
    },

    updatePlatformCommissionConfig: async (_: any, { type, value }: { type: string; value: number }, context: any) => {
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

    toggleAutoDisbursement: async (_: any, { enabled }: { enabled: boolean }, context: any) => {
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
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString?.() || '',
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString?.() || '',
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString?.() || '',
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
        statusHistory: (disbursement.statusHistory || []).map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    manualDisburse: async (_: any, { paymentId, amount, phoneNumber, reason }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.manualDisburse(paymentId, amount, phoneNumber, reason);

      if (!result.success) {
        throw new Error(result.message);
      }

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

    /**
     * Force-approve a held disbursement (super admin only, bypasses hold period)
     */
    forceApproveDisbursement: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.forceApproveDisbursement(id, context.user.id);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Fetch and return the updated disbursement
      const disbursement = await CommissionDisbursement.findById(id)
        .populate('paymentId', 'itemTitle amount')
        .populate('customerId', 'username fullName email')
        .populate('ownerId', 'username fullName email phone');

      if (!disbursement) throw new Error('Disbursement not found after force-approval');

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString?.() || '',
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString?.() || '',
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString?.() || '',
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        releaseDate: disbursement.releaseDate?.toISOString?.() || null,
        approvedBy: disbursement.approvedBy?.toString() || null,
        approvedAt: disbursement.approvedAt?.toISOString?.() || null,
        holdNote: disbursement.holdNote || null,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: (disbursement.statusHistory || []).map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    /**
     * Void a held OnHold disbursement (super admin only)
     * Cancels the disbursement without sending money — effectively refunds the customer
     */
    voidDisbursement: async (
      _: any,
      { id, reason }: { id: string; reason?: string },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.voidDisbursement(id, context.user.id, reason);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Fetch and return the updated disbursement
      const disbursement = await CommissionDisbursement.findById(id)
        .populate('paymentId', 'itemTitle amount')
        .populate('customerId', 'username fullName email')
        .populate('ownerId', 'username fullName email phone');

      if (!disbursement) throw new Error('Disbursement not found after void');

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString?.() || '',
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString?.() || '',
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString?.() || '',
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        releaseDate: disbursement.releaseDate?.toISOString?.() || null,
        approvedBy: disbursement.approvedBy?.toString() || null,
        approvedAt: disbursement.approvedAt?.toISOString?.() || null,
        holdNote: disbursement.holdNote || null,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: (disbursement.statusHistory || []).map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },

    approveDisbursement: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const result = await disbursementService.approveDisbursement(id, context.user.id);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Fetch and return the updated disbursement
      const disbursement = await CommissionDisbursement.findById(id)
        .populate('paymentId', 'itemTitle amount')
        .populate('customerId', 'username fullName email')
        .populate('ownerId', 'username fullName email phone');

      if (!disbursement) throw new Error('Disbursement not found after approval');

      return {
        id: disbursement._id.toString(),
        paymentId: (disbursement.paymentId as any)?._id?.toString() || (disbursement.paymentId as any)?.toString?.() || '',
        customerId: (disbursement.customerId as any)?._id?.toString() || (disbursement.customerId as any)?.toString?.() || '',
        ownerId: (disbursement.ownerId as any)?._id?.toString() || (disbursement.ownerId as any)?.toString?.() || '',
        ownerPhone: disbursement.ownerPhone,
        itemId: disbursement.itemId.toString(),
        itemType: disbursement.itemType,
        grossAmount: disbursement.grossAmount,
        platformCommission: disbursement.platformCommission,
        commissionType: disbursement.commissionType,
        commissionValue: disbursement.commissionValue,
        netAmount: disbursement.netAmount,
        status: disbursement.status,
        releaseDate: disbursement.releaseDate?.toISOString?.() || null,
        approvedBy: disbursement.approvedBy?.toString() || null,
        approvedAt: disbursement.approvedAt?.toISOString?.() || null,
        holdNote: disbursement.holdNote || null,
        intouchTransactionRef: disbursement.intouchTransactionRef,
        intouchReferenceId: disbursement.intouchReferenceId,
        failureReason: disbursement.failureReason,
        retryCount: disbursement.retryCount,
        autoDisbursement: disbursement.autoDisbursement,
        statusHistory: (disbursement.statusHistory || []).map((h: any) => ({
          status: h.status,
          timestamp: h.timestamp?.toISOString?.() || h.timestamp,
          note: h.note,
        })),
        createdAt: disbursement.createdAt?.toISOString?.() || '',
        updatedAt: disbursement.updatedAt?.toISOString?.() || '',
      };
    },
  },
};

