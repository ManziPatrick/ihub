import mongoose, { Schema, Document } from 'mongoose';

export interface IUserErrorReport extends Document {
  userId?: mongoose.Types.ObjectId;
  username?: string;
  errorType: 'graphql' | 'network' | 'runtime' | 'payment' | 'auth' | 'upload' | 'meeting' | 'render' | 'timeout' | 'unknown';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  stack?: string;
  componentName?: string;
  operationName?: string;
  statusCode?: number;
  url: string;
  userAgent?: string;
  browserInfo?: {
    name?: string;
    version?: string;
    os?: string;
    mobile?: boolean;
  };
  context?: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolution?: string;
  occurrenceCount: number;
  fingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserErrorReportSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    username: { type: String, index: true },
    errorType: {
      type: String,
      enum: ['graphql', 'network', 'runtime', 'payment', 'auth', 'upload', 'meeting', 'render', 'timeout', 'unknown'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    message: { type: String, required: true },
    stack: { type: String },
    componentName: { type: String, index: true },
    operationName: { type: String, index: true },
    statusCode: { type: Number },
    url: { type: String, required: true },
    userAgent: { type: String },
    browserInfo: {
      name: { type: String },
      version: { type: String },
      os: { type: String },
      mobile: { type: Boolean },
    },
    context: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolution: { type: String },
    occurrenceCount: { type: Number, default: 1, index: true },
    fingerprint: { type: String, index: true },
  },
  { timestamps: true }
);

// Indexes for efficient querying
UserErrorReportSchema.index({ createdAt: -1 });
UserErrorReportSchema.index({ status: 1, createdAt: -1 });
UserErrorReportSchema.index({ errorType: 1, status: 1 });
UserErrorReportSchema.index({ severity: 1, status: 1 });
UserErrorReportSchema.index({ fingerprint: 1, createdAt: -1 });

export default mongoose.model<IUserErrorReport>('UserErrorReport', UserErrorReportSchema);
