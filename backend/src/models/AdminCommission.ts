import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminCommission extends Document {
  adminId: mongoose.Types.ObjectId;
  /** 'global' | 'course' | 'internship' */
  scope: 'global' | 'course' | 'internship';
  /** Reference ID when scope is 'course' or 'internship' */
  scopeId?: mongoose.Types.ObjectId;
  /** Scope title for display (e.g., course title) */
  scopeTitle?: string;
  /** Commission type: 'percentage' or 'fixed' */
  type: 'percentage' | 'fixed';
  /** Commission percentage (0-100) — used when type is 'percentage' */
  percentage: number;
  /** Fixed amount — used when type is 'fixed' */
  fixedAmount: number;
  /** Optional description */
  description?: string;
  /** Whether this commission is active */
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminCommissionSchema: Schema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ['global', 'course', 'internship'],
      required: true,
      default: 'global',
    },
    scopeId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    scopeTitle: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    fixedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate commission configs for same admin+scope+scopeId
AdminCommissionSchema.index({ adminId: 1, scope: 1, scopeId: 1 }, { unique: true, sparse: true });

export const AdminCommission = mongoose.model<IAdminCommission>('AdminCommission', AdminCommissionSchema);
