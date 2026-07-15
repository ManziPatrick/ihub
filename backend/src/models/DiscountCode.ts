import mongoose from 'mongoose';

const discountCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // percentage (0-100) or fixed amount in RWF
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
}, { timestamps: true });

// Compound unique index — code is unique per course
discountCodeSchema.index({ code: 1, courseId: 1 }, { unique: true });
discountCodeSchema.index({ courseId: 1 });

export const DiscountCode = mongoose.model('DiscountCode', discountCodeSchema);