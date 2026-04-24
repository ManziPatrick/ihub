import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'CASHIN' | 'CASHOUT'; // CASHIN = user pays us, CASHOUT = we pay user
  amount: number;
  fee: number;
  phoneNumber: string;
  provider?: string; // MTN, Airtel, etc
  status: 'pending' | 'successful' | 'failed';
  paypackRef: string; // Reference from Paypack API
  description?: string; // What the payment is for (course, subscription, etc)
  courseId?: mongoose.Types.ObjectId | null;
  courseIds?: mongoose.Types.ObjectId[];
  subscriptionId?: mongoose.Types.ObjectId | null;
  internshipProgramId?: mongoose.Types.ObjectId | null;
  internshipIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
  processedAt?: Date;
  metadata?: Record<string, any>;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CASHIN', 'CASHOUT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Rwandan phone format: 078xxxxxxx or +250788xxxxxx
          return /^(\+250|0)[1-9]\d{8}$/.test(v.replace(/\s+/g, ''));
        },
        message: 'Invalid phone number format',
      },
    },
    provider: {
      type: String,
      enum: ['mtn', 'airtel', 'unknown', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      default: 'pending',
      index: true,
    },
    paypackRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    courseIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Course',
    }],
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    internshipProgramId: {
      type: Schema.Types.ObjectId,
      ref: 'InternshipProgram',
      default: null,
    },
    internshipIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Internship',
    }],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding transactions by user and status
PaymentTransactionSchema.index({ userId: 1, status: 1 });

// Index for finding transactions by phone and status
PaymentTransactionSchema.index({ phoneNumber: 1, status: 1 });

export const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>(
    'PaymentTransaction',
    PaymentTransactionSchema
  );
