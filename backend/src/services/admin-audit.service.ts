import AdminAuditLog from '../models/AdminAuditLog';

export const logAdminCrossAccess = async (
  adminId: string,
  adminUsername: string,
  queryName: string,
  accessedEntityType: string,
  details: string,
  resultCount: number = 0,
  isCrossAdmin: boolean = true,
  ipAddress?: string
) => {
  try {
    const log = new AdminAuditLog({
      accessingAdminId: adminId,
      accessingAdminUsername: adminUsername,
      queryName,
      accessedEntityType,
      isCrossAdmin,
      details,
      resultCount,
      ipAddress,
    });
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log admin cross-access audit:', error);
    return null;
  }
};

export const getAdminAuditLogs = async (
  filter: {
    adminId?: string;
    isCrossAdmin?: boolean;
    queryName?: string;
    page?: number;
    limit?: number;
  } = {}
) => {
  const { adminId, isCrossAdmin, queryName, page = 1, limit = 50 } = filter;
  const query: any = {};

  if (adminId) query.accessingAdminId = adminId;
  if (isCrossAdmin !== undefined) query.isCrossAdmin = isCrossAdmin;
  if (queryName) query.queryName = queryName;

  const skip = (page - 1) * limit;
  const [items, totalCount] = await Promise.all([
    AdminAuditLog.find(query)
      .populate('accessingAdminId', 'username fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AdminAuditLog.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
      hasNextPage: page * limit < totalCount,
      hasPreviousPage: page > 1,
    },
  };
};
