import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationPhaseSubmission extends Document {
  applicationId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;
  submissionData: Array<{
    deliverableType: string;
    deliverableName: string;
    value: string; // Can be file URL, text content, etc.
    fileUrl?: string;
    fileName?: string;
  }>;
  submittedAt: Date;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  revisionRequestNotes?: string;
  isLatestSubmission: boolean;
  submissionNumber: number; // Track resubmissions
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationPhaseSubmissionSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'InternshipApplication', required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'ApplicationPhase', required: true, index: true },
    submissionData: [
      {
        deliverableType: { type: String, required: true },
        deliverableName: { type: String, required: true },
        value: { type: String },
        fileUrl: { type: String },
        fileName: { type: String },
      }
    ],
    submittedAt: { type: Date, default: Date.now },
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_requested'],
      default: 'pending',
      index: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    rejectionReason: { type: String },
    revisionRequestNotes: { type: String },
    isLatestSubmission: { type: Boolean, default: true },
    submissionNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Composite index for efficient querying
ApplicationPhaseSubmissionSchema.index({ applicationId: 1, phaseId: 1, isLatestSubmission: 1 });

export const ApplicationPhaseSubmission = mongoose.model<IApplicationPhaseSubmission>(
  'ApplicationPhaseSubmission',
  ApplicationPhaseSubmissionSchema
);
