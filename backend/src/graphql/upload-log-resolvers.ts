import UploadLog from '../models/UploadLog';

export const uploadLogResolvers = {
  Query: {
    uploadLogs: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized - super_admin only');
      }

      const { page = 1, limit = 50, type } = args;
      const query: any = {};
      if (type) query.type = type;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        UploadLog.find(query)
          .populate('adminId', 'username email fullName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        UploadLog.countDocuments(query),
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
    },
  },

  Mutation: {
    deleteUploadLog: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized - super_admin only');
      }

      await UploadLog.findByIdAndDelete(id);
      return true;
    },

    clearAllUploadLogs: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized - super_admin only');
      }

      await UploadLog.deleteMany({});
      return true;
    },
  },


};
