import mongoose, { Schema, Document } from 'mongoose';

export interface ICommissionDisbursement extends Document {
  /** Payment this disbursement is for */
  paymentId: mongoose.Types.ObjectId;
  /** The customer who paid */
  customerId: mongoose.Types.ObjectId;
  /** The admin/owner who receives the disbursement */
  ownerId: mongoose.Types.ObjectId;
  /** The sellable item (course, internship, etc.) */
  itemId: mongoose.Types.ObjectId;
  /** Type of item: course, internship, etc */
  itemType: string;
  /** Gross amount paid by customer */
  grossAmount: number;
  /** Platform commission deducted */
  platformCommission: number;
  /** Commission type used for calculation */
  commissionType: 'percentage' | 'fixed';
  /** Commission value used (percentage or fixed amount) */
  commissionValue: number;
  /** Net amount sent to owner (gross - commission) */
  netAmount: number;
  /** Owner's phone number for disbursement */
  ownerPhone: string;
  /** Disbursement status */
  status: 'Pending' | 'Processing' | 'Successful' | 'Failed' | 'OnHold';
  /** Date after which the disbursement can be released (15-day hold) */
  releaseDate?: Date;
  /** Who approved the release */
  approvedBy?: mongoose.Types.ObjectId;
  /** When it was approved */
  approvedAt?: Date;
  /** Note about the hold */
  holdNote?: string;
  /** InTouch transaction reference */
  intouchTransactionRef?: string;
  /** InTouch reference ID returned on success */
  intouchReferenceId?: string;
  /** Failure reason if failed */
  failureReason?: string;
  /** Whether auto-disbursement is enabled */
  autoDisbursement: boolean;
  /** Retry count */
  retryCount: number;
  /** Last retry timestamp */
  lastRetryAt?: Date;
  /** Audit log of status changes */
  statusHistory: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CommissionDisbursementSchema: Schema = new Schema(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      required: true,
      default: 'course',
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    platformCommission: {
      type: Number,
      required: true,
      default: 0,
    },
    commissionType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    commissionValue: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    ownerPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Successful', 'Failed', 'OnHold'],
      default: 'Pending',
      index: true,
    },
    releaseDate: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    holdNote: {
      type: String,
    },
    intouchTransactionRef: {
      type: String,
      sparse: true,
    },
    intouchReferenceId: {
      type: String,
      sparse: true,
    },
    failureReason: {
      type: String,
    },
    autoDisbursement: {
      type: Boolean,
      default: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate disbursements for the same payment
CommissionDisbursementSchema.index(
  { paymentId: 1, ownerId: 1 },
  { unique: true }
);
CommissionDisbursementSchema.index({ status: 1, createdAt: -1 });
CommissionDisbursementSchema.index({ ownerId: 1, status: 1 });

export const CommissionDisbursement = mongoose.model<ICommissionDisbursement>(
  'CommissionDisbursement',
  CommissionDisbursementSchema
);
