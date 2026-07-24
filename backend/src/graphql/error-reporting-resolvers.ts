import UserErrorReport from '../models/UserErrorReport';
import { logActivity } from '../services/audit.service';

/**
 * Resolvers for automatic error detection and reporting.
 * Frontends call `reportClientError` mutation when errors occur,
 * and super admins can query `getErrorReports` etc.
 */

function createFingerprint(input: { errorType: string; message: string; componentName?: string; operationName?: string }): string {
  const parts = [input.errorType, input.message?.substring(0, 100), input.componentName || '', input.operationName || ''];
  return parts.join('::').toLowerCase().replace(/\s+/g, ' ');
}

function inferSeverity(errorType: string, statusCode?: number): 'critical' | 'high' | 'medium' | 'low' {
  if (errorType === 'payment' || errorType === 'auth') return 'critical';
  if (statusCode && statusCode >= 500) return 'critical';
  if (errorType === 'network' || errorType === 'timeout') return 'high';
  if (statusCode && statusCode >= 400) return 'medium';
  if (errorType === 'runtime') return 'high';
  if (errorType === 'graphql') return 'medium';
  return 'low';
}

function parseBrowserInfo(userAgent?: string): { name?: string; version?: string; os?: string; mobile?: boolean } | undefined {
  if (!userAgent) return undefined;
  const info: any = {};

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    info.name = 'Chrome';
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    if (match) info.version = match[1];
  } else if (userAgent.includes('Firefox')) {
    info.name = 'Firefox';
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    if (match) info.version = match[1];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    info.name = 'Safari';
    const match = userAgent.match(/Version\/([\d.]+)/);
    if (match) info.version = match[1];
  } else if (userAgent.includes('Edg')) {
    info.name = 'Edge';
    const match = userAgent.match(/Edg\/([\d.]+)/);
    if (match) info.version = match[1];
  }

  // Android must be checked before Linux (Android UAs contain "Linux")
  if (userAgent.includes('Android')) info.os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) info.os = 'iOS';
  else if (userAgent.includes('Windows')) info.os = 'Windows';
  else if (userAgent.includes('Mac OS')) info.os = 'macOS';
  else if (userAgent.includes('Linux')) info.os = 'Linux';

  info.mobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  return info;
}

export const errorReportResolvers = {
  Query: {
    getErrorReports: async (_: any, args: {
      page?: number;
      limit?: number;
      status?: string;
      errorType?: string;
      severity?: string;
      componentName?: string;
      search?: string;
    }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized: Only admins can view error reports');
      }

      const page = args.page || 1;
      const limit = Math.min(args.limit || 50, 100);
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (args.status) filter.status = args.status;
      if (args.errorType) filter.errorType = args.errorType;
      if (args.severity) filter.severity = args.severity;
      if (args.componentName) filter.componentName = args.componentName;
      if (args.search) {
        filter.$or = [
          { message: { $regex: args.search, $options: 'i' } },
          { componentName: { $regex: args.search, $options: 'i' } },
          { operationName: { $regex: args.search, $options: 'i' } },
          { username: { $regex: args.search, $options: 'i' } },
        ];
      }

      const [rawItems, totalCount] = await Promise.all([
        UserErrorReport.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('resolvedBy', 'id username fullName')
          .lean(),
        UserErrorReport.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      // .lean() returns plain objects without Mongoose virtuals (like `id`).
      // Destructure _id and map it → id so GraphQL's non-nullable ID field resolves correctly.
      const items = (rawItems as any[]).map((item: any) => {
        const { _id, ...rest } = item;
        return { ...rest, id: (_id?.toString?.() || _id) };
      });

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

    getErrorReport: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized');
      }
      const raw = await UserErrorReport.findById(id)
        .populate('resolvedBy', 'id username fullName')
        .lean();
      if (!raw) return null;
      const { _id, ...rest } = raw;
      return { ...rest, id: (_id?.toString?.() || _id) };
    },

    getErrorReportStats: async (_: any, __: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized');
      }

      const [
        total, open, investigating, resolved, dismissed,
        critical, high, medium, low,
        byTypeRaw, byComponentRaw,
      ] = await Promise.all([
        UserErrorReport.countDocuments(),
        UserErrorReport.countDocuments({ status: 'open' }),
        UserErrorReport.countDocuments({ status: 'investigating' }),
        UserErrorReport.countDocuments({ status: 'resolved' }),
        UserErrorReport.countDocuments({ status: 'dismissed' }),
        UserErrorReport.countDocuments({ severity: 'critical' }),
        UserErrorReport.countDocuments({ severity: 'high' }),
        UserErrorReport.countDocuments({ severity: 'medium' }),
        UserErrorReport.countDocuments({ severity: 'low' }),
        UserErrorReport.aggregate([
          { $group: { _id: '$errorType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
        UserErrorReport.aggregate([
          { $match: { componentName: { $nin: [null, ''] } } },
          { $group: { _id: '$componentName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 },
        ]),
      ]);

      return {
        total,
        open,
        investigating,
        resolved,
        dismissed,
        critical,
        high,
        medium,
        low,
        byType: byTypeRaw.map((r: any) => ({ errorType: r._id, count: r.count })),
        byComponent: byComponentRaw.map((r: any) => ({ componentName: r._id, count: r.count })),
      };
    },
  },

  Mutation: {
    reportClientError: async (_: any, args: { input: {
      errorType: string;
      message: string;
      stack?: string;
      componentName?: string;
      operationName?: string;
      statusCode?: number;
      context?: Record<string, any>;
    }}, context: any) => {
      // Build a fingerprint for deduplication
      const fingerprint = createFingerprint({
        errorType: args.input.errorType,
        message: args.input.message,
        componentName: args.input.componentName,
        operationName: args.input.operationName,
      });

      const severity = inferSeverity(args.input.errorType, args.input.statusCode);

      // Check if this error was already reported recently (within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await UserErrorReport.findOne({
        fingerprint,
        createdAt: { $gte: oneHourAgo },
      });

      if (existing) {
        // Increment occurrence count instead of creating duplicate
        existing.occurrenceCount += 1;
        // Update severity if the new one is higher
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        if (severityOrder[severity] > severityOrder[existing.severity as keyof typeof severityOrder]) {
          existing.severity = severity;
        }
        await existing.save();
        return true;
      }

      // Parse user info from context (sent by frontend)
      const userAgent = args.input.context?.userAgent || undefined;
      const browserInfo = parseBrowserInfo(userAgent);

      const report = new UserErrorReport({
        userId: context.user?.id || undefined,
        username: context.user?.username || undefined,
        errorType: args.input.errorType,
        severity,
        message: args.input.message.substring(0, 2000),
        stack: args.input.stack?.substring(0, 5000),
        componentName: args.input.componentName,
        operationName: args.input.operationName,
        statusCode: args.input.statusCode,
        url: args.input.context?.url || 'unknown',
        userAgent,
        browserInfo,
        context: args.input.context,
        fingerprint,
      });

      await report.save();
      return true;
    },

    resolveErrorReport: async (_: any, { id, resolution }: { id: string; resolution?: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized');
      }

      const report = await UserErrorReport.findById(id);
      if (!report) throw new Error('Error report not found');

      report.status = 'resolved';
      report.resolvedBy = context.user.id;
      report.resolvedAt = new Date();
      if (resolution) report.resolution = resolution;

      await report.save();

      await logActivity(context.user.id, 'RESOLVE', 'UserErrorReport', id, `Resolved error report: ${report.message.substring(0, 100)}`);

      return report.populate('resolvedBy', 'id username fullName');
    },

    deleteErrorReport: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized');
      }

      const result = await UserErrorReport.findByIdAndDelete(id);
      if (!result) throw new Error('Error report not found');

      await logActivity(context.user.id, 'DELETE', 'UserErrorReport', id, `Deleted error report`);
      return true;
    },
  },
};
