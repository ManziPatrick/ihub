import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  courseIds?: mongoose.Types.ObjectId[];
  internshipId?: mongoose.Types.ObjectId;
  internshipIds?: mongoose.Types.ObjectId[];
  amount: number;
  currency: string;
  status: string; // 'pending', 'completed', 'failed', 'refunded'
  paymentMethod: string; // 'MTN MoMo', 'Airtel Money', 'Card', 'Bank Transfer'
  transactionId: string;
  type: string; // 'Course Enrollment', 'Internship Fee'
  itemTitle: string;
  selectedDeliveryMode?: string;
  proofOfPaymentUrl?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    courseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    internshipId: { type: Schema.Types.ObjectId, ref: 'Internship' },
    internshipIds: [{ type: Schema.Types.ObjectId, ref: 'Internship' }],
    amount: { type: Number, required: true },
    currency: { type: String, default: 'RWF' },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentMethod: { type: String },
    transactionId: { type: String, unique: true },
    type: { type: String, required: true }, // 'Course Enrollment', 'Internship Fee'
    itemTitle: { type: String, required: true },
    selectedDeliveryMode: { type: String, enum: ['online', 'physical', 'hybrid'] },
    proofOfPaymentUrl: { type: String },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
