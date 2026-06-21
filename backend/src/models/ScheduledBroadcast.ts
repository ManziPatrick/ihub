import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledBroadcast extends Document {
  title: string;
  message: string;
  link?: string;
  targetRole?: string;
  userIds?: string[];
  teamIds?: string[];
  sendEmail: boolean;
  sendNotification: boolean;
  scheduledAt: Date;
  status: 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';
  sentAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  result?: {
    totalRecipients: number;
    notificationsSent: number;
    emailsSent: number;
    errors: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledBroadcastSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    targetRole: { type: String },
    userIds: [{ type: String }],
    teamIds: [{ type: String }],
    sendEmail: { type: Boolean, default: false },
    sendNotification: { type: Boolean, default: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    result: {
      totalRecipients: { type: Number, default: 0 },
      notificationsSent: { type: Number, default: 0 },
      emailsSent: { type: Number, default: 0 },
      errors: [{ type: String }],
    },
  },
  { timestamps: true }
);

ScheduledBroadcastSchema.index({ status: 1, scheduledAt: 1 });
ScheduledBroadcastSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model<IScheduledBroadcast>('ScheduledBroadcast', ScheduledBroadcastSchema);
