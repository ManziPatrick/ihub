import mongoose, { Schema, Document } from 'mongoose';

export interface IPayoutRecord extends Document {
  adminId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  periodStart: Date;
  periodEnd: Date;
  commissionEntries: {
    paymentId: mongoose.Types.ObjectId;
    amount: number;
    commissionPercentage: number;
    commissionAmount: number;
  }[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutRecordSchema: Schema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'RWF',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    commissionEntries: [
      {
        paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
        amount: Number,
        commissionPercentage: Number,
        commissionAmount: Number,
      },
    ],
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    paidAt: Date,
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

PayoutRecordSchema.index({ adminId: 1, status: 1 });
PayoutRecordSchema.index({ status: 1, createdAt: -1 });

export const PayoutRecord = mongoose.model<IPayoutRecord>(
  'PayoutRecord',
  PayoutRecordSchema
);
