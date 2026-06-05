import mongoose, { Schema, Document } from 'mongoose';

export interface IClientApplication extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  adminFeedback?: string;
  assignedAdminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientApplicationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reason: { type: String, required: true },
    adminFeedback: { type: String },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ClientApplication = mongoose.model<IClientApplication>('ClientApplication', ClientApplicationSchema);
