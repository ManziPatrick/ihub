import mongoose, { Schema, Document } from 'mongoose';

export interface IRefundRequest extends Document {
  paymentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  itemIds: mongoose.Types.ObjectId[];
  itemTypes: string[];
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'admin_verified' | 'approved' | 'rejected' | 'cancelled';
  adminNote?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  forceApproved: boolean;
  cancelledDisbursements: mongoose.Types.ObjectId[];
  requestedBy: mongoose.Types.ObjectId; // who initiated the refund
  refundedAmount: number;
  refundFee: number;
  refundableAmountAfterFee: number;
  /** Method used to send money back to the customer: 'pawapay_refund', 'manual_disbursement', or 'none' */
  payoutMethod?: 'pawapay_refund' | 'manual_disbursement' | 'none';
  /** Reference ID from the payout provider (PawaPay refund ID, Intouch ref, etc.) */
  payoutReferenceId?: string;
  /** Customer's phone number that received the payout */
  customerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema: Schema = new Schema(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    itemIds: [{
      type: Schema.Types.ObjectId,
      required: true,
    }],
    itemTypes: [{
      type: String,
      required: true,
    }],
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'RWF',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'admin_verified', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    adminNote: {
      type: String,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    forceApproved: {
      type: Boolean,
      default: false,
    },
    cancelledDisbursements: [{
      type: Schema.Types.ObjectId,
      ref: 'CommissionDisbursement',
    }],
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundFee: {
      type: Number,
      default: 0,
    },
    refundableAmountAfterFee: {
      type: Number,
      default: 0,
    },
    payoutMethod: {
      type: String,
      enum: ['pawapay_refund', 'manual_disbursement', 'none'],
      default: null,
    },
    payoutReferenceId: {
      type: String,
      default: null,
    },
    customerPhone: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

RefundRequestSchema.index({ status: 1, createdAt: -1 });
RefundRequestSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);
