import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupClusterStatus,
  getBackupAnalytics,
  getBackupScheduleConfig,
  updateBackupScheduleConfig,
  getLiveDatabaseStats,
} from '../services/backup.service';

export const backupResolvers = {
  Query: {
    /** List all backup snapshots (super_admin only) */
    /** Get live primary database stats (super_admin only) */
    liveDatabaseStats: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }
      return getLiveDatabaseStats();
    },

    backups: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }
      return listBackups();
    },

    /** Get backup cluster connection status (super_admin only) */
    backupClusterStatus: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }
      return getBackupClusterStatus();
    },

    /** Get backup analytics and historical performance metrics (super_admin only) */
    backupAnalytics: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }
      return getBackupAnalytics();
    },

    /** Get backup schedule configuration (super_admin only) */
    backupScheduleConfig: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }
      return getBackupScheduleConfig();
    },
  },

  Mutation: {
    /** Trigger a manual backup (super_admin only) */
    triggerBackup: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }

      console.log(`🔐 Manual backup triggered by super admin: ${context.user.id}`);
      const record = await createBackup(context.user.id);
      return record;
    },

    /** Restore from a backup snapshot (super_admin only) */
    restoreBackup: async (
      _: any,
      { backupId, collections }: { backupId: string; collections?: string[] },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }

      console.log(`⚠️ RESTORE initiated by super admin ${context.user.id} from backup ${backupId}`);
      if (collections && collections.length > 0) {
        console.log(`  Selective restore: ${collections.join(', ')}`);
      } else {
        console.log(`  Full database restore`);
      }

      const result = await restoreBackup(backupId, collections);

      return {
        success: true,
        message: `Restored ${result.restoredCollections.length} collections with ${result.totalDocs} total documents.`,
        restoredCollections: result.restoredCollections,
        totalDocs: result.totalDocs,
      };
    },

    /** Delete a backup snapshot (super_admin only) */
    deleteBackup: async (_: any, { backupId }: { backupId: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }

      await deleteBackup(backupId);
      return true;
    },

    /** Update backup schedule configuration (super_admin only) */
    updateBackupScheduleConfig: async (
      _: any,
      { interval, retention, enabled }: { interval?: string; retention?: number; enabled?: boolean },
      context: any,
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized. Only super admins can manage backups.');
      }

      return updateBackupScheduleConfig({ interval, retention, enabled });
    },
  },

  BackupRecord: {
    id: (parent: any) => parent._id?.toString() || parent.id,
    triggeredBy: (parent: any) => parent.triggeredBy || null,
    createdAt: (parent: any) => parent.createdAt?.toISOString?.() || parent.createdAt,
    completedAt: (parent: any) => parent.completedAt?.toISOString?.() || parent.completedAt,
  },

  RestoreResult: {
    // No custom resolvers needed, just identity
  },
};
