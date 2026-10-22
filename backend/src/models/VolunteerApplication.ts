import mongoose, { Schema, Document } from 'mongoose';

export type VolunteerWantedRole = 'volunteer' | 'trainer' | 'admin';
export type VolunteerStatus = 'pending' | 'approved' | 'rejected';

export interface IVolunteerApplication extends Document {
  name: string;
  email: string;
  phone: string;
  city: string;
  wantedRole: VolunteerWantedRole;
  skills: string;
  about: string;
  linkedin: string;
  status: VolunteerStatus;
  isProfilePublic: boolean;
  createdUserId?: mongoose.Types.ObjectId;
  assignedRole?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerApplicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    wantedRole: {
      type: String,
      enum: ['volunteer', 'trainer', 'admin'],
      default: 'volunteer',
    },
    skills: { type: String, default: '' },
    about: { type: String, required: true },
    linkedin: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isProfilePublic: { type: Boolean, default: false },
    createdUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedRole: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

VolunteerApplicationSchema.index({ status: 1, createdAt: -1 });
VolunteerApplicationSchema.index({ email: 1, status: 1 });

export const VolunteerApplication = mongoose.model<IVolunteerApplication>(
  'VolunteerApplication',
  VolunteerApplicationSchema
);
