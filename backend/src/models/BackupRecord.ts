import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupRecord extends Document {
  backupDbName: string; // e.g. "backup_20240115_120000"
  size: number; // approximate size in bytes
  collections: string[]; // list of collections backed up
  status: 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;
  triggeredBy?: mongoose.Types.ObjectId; // null = auto/cron
  metadata?: Record<string, any>;
  completedAt?: Date;
  createdAt: Date;
}

const BackupRecordSchema = new Schema<IBackupRecord>(
  {
    backupDbName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    collections: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'failed'],
      default: 'in_progress',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

BackupRecordSchema.index({ createdAt: -1 });

export const BackupRecord =
  mongoose.models.BackupRecord ||
  mongoose.model<IBackupRecord>('BackupRecord', BackupRecordSchema);
