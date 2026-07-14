import mongoose, { Schema, Document } from 'mongoose';

export interface IScholarship extends Document {
  userId: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
  type: 'course' | 'internship';
  itemId: mongoose.Types.ObjectId;
  itemTitle: string;
  status: 'pending' | 'active' | 'revoked';
  reason?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
  grantedLatitude?: number;
  grantedLongitude?: number;
  grantedCity?: string;
  grantedCountry?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['course', 'internship'], required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, required: true, index: true },
    itemTitle: { type: String, required: true },
    status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending', index: true },
    reason: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokedReason: { type: String },
    grantedLatitude: { type: Number },
    grantedLongitude: { type: Number },
    grantedCity: { type: String },
    grantedCountry: { type: String },
  },
  { timestamps: true }
);

ScholarshipSchema.index({ userId: 1, type: 1, status: 1 });
ScholarshipSchema.index({ itemId: 1, type: 1 });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);
