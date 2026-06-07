import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationPhase extends Document {
  programId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  requiredDeliverables: Array<{
    type: 'cv' | 'essay' | 'portfolio' | 'test' | 'other';
    name: string;
    required: boolean;
    description?: string;
    maxFileSize?: number; // in MB
  }>;
  estimatedDurationDays?: number;
  enableApproval: boolean;
  approvalType?: 'single' | 'multiple'; // single: one admin approves, multiple: requires consensus
  notificationOnCompletion?: boolean;
  isInterviewPhase?: boolean;
  allowMeetingScheduling?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationPhaseSchema: Schema = new Schema(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'InternshipProgram', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    requiredDeliverables: [
      {
        type: { type: String, enum: ['cv', 'essay', 'portfolio', 'test', 'other'], required: true },
        name: { type: String, required: true },
        required: { type: Boolean, default: true },
        description: { type: String },
        maxFileSize: { type: Number }, // MB
      }
    ],
    estimatedDurationDays: { type: Number },
    enableApproval: { type: Boolean, default: true },
    approvalType: { type: String, enum: ['single', 'multiple'], default: 'single' },
    notificationOnCompletion: { type: Boolean, default: true },
    isInterviewPhase: { type: Boolean, default: false },
    allowMeetingScheduling: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient querying
ApplicationPhaseSchema.index({ programId: 1, order: 1 });

export const ApplicationPhase = mongoose.model<IApplicationPhase>('ApplicationPhase', ApplicationPhaseSchema);
