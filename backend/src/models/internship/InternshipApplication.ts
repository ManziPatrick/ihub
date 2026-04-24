import mongoose, { Schema, Document } from 'mongoose';

export interface IInternshipApplication extends Document {
  internshipProgramId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  skills: string[];
  portfolioUrl?: string;
  resumeUrl?: string;
  availability: string;
  selectedDeliveryMode?: string;
  applicationAnswers: {
    questionLabel: string;
    answer: string;
  }[];
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipApplicationSchema: Schema = new Schema(
  {
    internshipProgramId: { type: Schema.Types.ObjectId, ref: 'InternshipProgram', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'waitlisted'], 
      default: 'pending', 
      index: true 
    },
    skills: [{ type: String }],
    portfolioUrl: { type: String },
    resumeUrl: { type: String },
    availability: { type: String }, // e.g., "Full-time", "Part-time"
    selectedDeliveryMode: { type: String, enum: ['online', 'physical', 'hybrid'] },
    applicationAnswers: [
      {
        questionLabel: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Prevent duplicate applications
InternshipApplicationSchema.index({ internshipProgramId: 1, userId: 1 }, { unique: true });

export const InternshipApplication = mongoose.model<IInternshipApplication>('InternshipApplication', InternshipApplicationSchema);
