import mongoose, { Schema, Document } from 'mongoose';

export interface IScholarship extends Document {
  userId: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
  type: 'course' | 'internship';
  itemId: mongoose.Types.ObjectId;
  itemTitle: string;
  status: 'active' | 'revoked';
  reason?: string;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revokedReason?: string;
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
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    reason: { type: String },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    revokedReason: { type: String },
  },
  { timestamps: true }
);

ScholarshipSchema.index({ userId: 1, type: 1, status: 1 });
ScholarshipSchema.index({ itemId: 1, type: 1 });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);
