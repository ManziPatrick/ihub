import mongoose from 'mongoose';
import { AdminCommission } from '../models/AdminCommission';
import { Payment } from '../models/Payment';
import { User } from '../models/User';

export const commissionResolvers = {
  Query: {
    /** Get all commission configs (super_admin only) */
    commissionConfigs: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      return AdminCommission.find().populate('adminId', 'username fullName email').sort({ createdAt: -1 });
    },

    /** Get commission configs for a specific admin */
    getAdminCommissionConfigs: async (_: any, { adminId }: { adminId: string }, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      return AdminCommission.find({ adminId }).sort({ createdAt: -1 });
    },

    /** Get commission earnings report for an admin */
    getAdminCommissionReport: async (_: any, { adminId }: { adminId: string }, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      // Admins can only see their own report (unless super_admin)
      if (context.user.role === 'admin' && context.user.id !== adminId) {
        throw new Error('You can only view your own commission report');
      }

      // Get all commission configs for this admin
      const configs = await AdminCommission.find({ adminId, active: true });
      const globalConfig = configs.find(c => c.scope === 'global');

      // Get completed payments
      const payments = await Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(100);

      // Calculate commission for each payment
      const commissionEntries: any[] = [];
      let totalCommission = 0;

      const entryDedupKey = (entry: any) => {
        // Dedup by the fields that define a unique commission line
        return `${entry.paymentId}|${entry.scope}|${entry.scopeId ?? ''}|${entry.itemTitle ?? ''}|${entry.commissionPercentage}|${entry.commissionAmount}`;
      };
      const seen = new Set<string>();

      // Courses owned by this admin come from commission configs
      const ownedCourseIds = new Set(
        configs
          .filter((c: any) => c.scope === 'course' && c.scopeId)
          .map((c: any) => c.scopeId.toString())
      );


      for (const payment of payments) {


        if (!payment.courseIds?.length && !payment.internshipIds?.length && !payment.courseId) {
          // Apply global commission if no specific scope matches
          if (globalConfig) {
            const amount = payment.amount * (globalConfig.percentage / 100);
            totalCommission += amount;
            commissionEntries.push({
              paymentId: payment._id.toString(),
              itemTitle: payment.itemTitle,
              type: payment.type,
              amount: payment.amount,
              commissionPercentage: globalConfig.percentage,
              commissionAmount: Math.round(amount),
              scope: 'global',
              createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
            });
          }
          continue;
        }

        const allCourseIds = [...(payment.courseIds || []), ...(payment.courseId ? [payment.courseId] : [])];
        const allInternshipIds = payment.internshipIds || [];

        // Check course-specific commission
        for (const cId of allCourseIds) {
          const courseConfig = configs.find(c => c.scope === 'course' && c.scopeId?.toString() === cId.toString());
          const effectivePercentage = courseConfig?.percentage || globalConfig?.percentage || 0;
          if (effectivePercentage > 0) {
            const amountPerCourse = payment.amount / (allCourseIds.length + allInternshipIds.length);
            const commissionAmount = amountPerCourse * (effectivePercentage / 100);
            totalCommission += commissionAmount;
            commissionEntries.push({
              paymentId: payment._id.toString(),
              itemTitle: payment.itemTitle,
              type: payment.type,
              // split price per course within the same cart
              amount: amountPerCourse,
              commissionPercentage: effectivePercentage,
              commissionAmount: Math.round(commissionAmount),
              scope: courseConfig ? 'course' : 'global',
              scopeTitle: courseConfig?.scopeTitle || null,
              scopeId: cId?.toString?.() || null,
              createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
            });
          }
        }

        // Check internship-specific commission
        for (const iId of allInternshipIds) {
          const internshipConfig = configs.find(c => c.scope === 'internship' && c.scopeId?.toString() === iId.toString());
          const effectivePercentage = internshipConfig?.percentage || globalConfig?.percentage || 0;
          if (effectivePercentage > 0) {
            const amountPerItem = payment.amount / (allCourseIds.length + allInternshipIds.length);
            const commissionAmount = amountPerItem * (effectivePercentage / 100);
            totalCommission += commissionAmount;
            commissionEntries.push({
              paymentId: payment._id.toString(),
              itemTitle: payment.itemTitle,
              type: payment.type,
              amount: payment.amount,
              commissionPercentage: effectivePercentage,
              commissionAmount: Math.round(commissionAmount),
              scope: internshipConfig ? 'internship' : 'global',
              scopeTitle: internshipConfig?.scopeTitle || null,
              createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
            });
          }
        }
      }

      // Only return entries that belong to courses this admin owns
      // (if the frontend expects “by owner course”, scopeId-less entries will look wrong)
      const filteredEntries = commissionEntries.filter((e: any) => {
        if (e.scope === 'course' && e.scopeTitle) return true;
        // if entry is course-scoped but scopeTitle is null/empty, still allow if we can match ownership
        if (e.scope === 'course' && e.scopeId) return ownedCourseIds.has(e.scopeId.toString());
        return e.scope === 'global' && (!ownedCourseIds.size ? true : true);
      });

      // NOTE: totalCommission should match returned entries
      const filteredTotal = filteredEntries.reduce((sum: number, e: any) => sum + (e.commissionAmount || 0), 0);

      return {
        adminId,
        configs,
        totalCommission: Math.round(filteredTotal || totalCommission),
        totalPayments: payments.length,
        commissionEntries: filteredEntries,
      };
    },

    /** Get full aggregated commission report across ALL admins (super_admin only) */
    getAllCommissionReports: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const allAdmins = await User.find({ role: 'admin' }).select('_id username fullName email').sort({ fullName: 1 });

      // Fetch payments once, reuse across all admins
      const payments = await Payment.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(100);

      const adminReports: any[] = [];
      let grandTotalCommission = 0;
      let grandTotalPayments = 0;

      for (const admin of allAdmins) {
        const adminId = admin._id.toString();
        const configs = await AdminCommission.find({ adminId, active: true });
        const globalConfig = configs.find(c => c.scope === 'global');

        let adminTotal = 0;
        const entries: any[] = [];

        for (const payment of payments) {
          const allCourseIds = [...(payment.courseIds || []), ...(payment.courseId ? [payment.courseId] : [])];
          const allInternshipIds = payment.internshipIds || [];
          const totalItems = allCourseIds.length + allInternshipIds.length;

          if (totalItems === 0) {
            if (globalConfig) {
              const amount = payment.amount * (globalConfig.percentage / 100);
              adminTotal += amount;
              entries.push({
                paymentId: payment._id.toString(),
                itemTitle: payment.itemTitle,
                type: payment.type,
                amount: payment.amount,
                commissionPercentage: globalConfig.percentage,
                commissionAmount: Math.round(amount),
                scope: 'global',
                createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
              });
            }
            continue;
          }

          for (const cId of allCourseIds) {
            const courseConfig = configs.find(c => c.scope === 'course' && c.scopeId?.toString() === cId.toString());
            const effectivePercentage = courseConfig?.percentage || globalConfig?.percentage || 0;
            if (effectivePercentage > 0) {
              const amountPerItem = payment.amount / totalItems;
              const commissionAmount = amountPerItem * (effectivePercentage / 100);
              adminTotal += commissionAmount;
              entries.push({
                paymentId: payment._id.toString(),
                itemTitle: payment.itemTitle,
                type: payment.type,
                amount: payment.amount,
                commissionPercentage: effectivePercentage,
                commissionAmount: Math.round(commissionAmount),
                scope: courseConfig ? 'course' : 'global',
                scopeTitle: courseConfig?.scopeTitle || null,
                createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
              });
            }
          }

          for (const iId of allInternshipIds) {
            const internshipConfig = configs.find(c => c.scope === 'internship' && c.scopeId?.toString() === iId.toString());
            const effectivePercentage = internshipConfig?.percentage || globalConfig?.percentage || 0;
            if (effectivePercentage > 0) {
              const amountPerItem = payment.amount / totalItems;
              const commissionAmount = amountPerItem * (effectivePercentage / 100);
              adminTotal += commissionAmount;
              entries.push({
                paymentId: payment._id.toString(),
                itemTitle: payment.itemTitle,
                type: payment.type,
                amount: payment.amount,
                commissionPercentage: effectivePercentage,
                commissionAmount: Math.round(commissionAmount),
                scope: internshipConfig ? 'internship' : 'global',
                scopeTitle: internshipConfig?.scopeTitle || null,
                createdAt: payment.createdAt?.toISOString?.() || payment.createdAt,
              });
            }
          }
        }

        const roundedTotal = Math.round(adminTotal);
        grandTotalCommission += roundedTotal;
        grandTotalPayments += payments.length;

        adminReports.push({
          adminId,
          adminName: admin.fullName || admin.username,
          adminEmail: admin.email,
          totalCommission: roundedTotal,
          totalPayments: payments.length,
          activeConfigsCount: configs.length,
          recentEntries: entries.slice(0, 10),
        });
      }

      return {
        totalAdmins: allAdmins.length,
        grandTotalCommission: Math.round(grandTotalCommission),
        grandTotalPayments,
        adminReports,
      };
    },

    /** Get all completed payments for super_admin (for commission management) */
    getAllCompletedPayments: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      return Payment.find({ status: 'completed' })
        .populate('userId', 'username fullName email')
        .sort({ createdAt: -1 })
        .limit(200);
    },

    /** Get all admins for commission assignment */
    getCommissionAdmins: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      return User.find({ role: 'admin' }).select('username fullName email').sort({ fullName: 1 });
    },
  },

  Mutation: {
    /** Create or update a commission config */
    setCommission: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      const { adminId, scope, scopeId, scopeTitle, type, percentage, fixedAmount, description } = args;

      if (!adminId || !scope) {
        throw new Error('adminId and scope are required');
      }

      const commissionType = type || 'percentage';

      if (commissionType === 'percentage') {
        if (percentage == null) {
          throw new Error('percentage is required when type is "percentage"');
        }
        if (percentage < 0 || percentage > 100) {
          throw new Error('Percentage must be between 0 and 100');
        }
      } else if (commissionType === 'fixed') {
        if (fixedAmount == null || fixedAmount < 0) {
          throw new Error('fixedAmount is required and must be >= 0 when type is "fixed"');
        }
      }

      // Upsert: update existing or create new
      const filter: any = { adminId, scope };
      if (scope !== 'global') {
        if (!scopeId) throw new Error('scopeId is required for course/internship commissions');
        filter.scopeId = scopeId;
      }

      const update: any = {
        description: description || '',
        scopeTitle: scopeTitle || '',
        active: true,
        type: commissionType,
      };

      if (commissionType === 'percentage') {
        update.percentage = percentage;
        update.fixedAmount = 0;
      } else {
        update.fixedAmount = fixedAmount;
        update.percentage = 0;
      }

      const config = await AdminCommission.findOneAndUpdate(
        filter,
        { $set: update },
        { upsert: true, new: true }
      ).populate('adminId', 'username fullName email');

      return config;
    },

    /** Toggle commission active status */
    toggleCommission: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      const config = await AdminCommission.findById(id);
      if (!config) throw new Error('Commission config not found');
      config.active = !config.active;
      await config.save();
      return config.populate('adminId', 'username fullName email');
    },

    /** Delete a commission config */
    deleteCommission: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      await AdminCommission.findByIdAndDelete(id);
      return true;
    },
  },
};
