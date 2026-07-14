import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  getBackupClusterStatus,
} from '../services/backup.service';

export const backupResolvers = {
  Query: {
    /** List all backup snapshots (super_admin only) */
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
