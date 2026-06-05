import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectOnboarding extends Document {
  projectId: mongoose.Types.ObjectId;
  developerId: mongoose.Types.ObjectId;
  role: string;
  status: 'onboarding' | 'active' | 'completed';
  checklist: Array<{
    task: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectOnboardingSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    developerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['onboarding', 'active', 'completed'],
      default: 'onboarding',
      index: true,
    },
    checklist: [
      {
        task: { type: String, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// Ensure a developer is onboarded only once per project
ProjectOnboardingSchema.index({ projectId: 1, developerId: 1 }, { unique: true });

export const ProjectOnboarding = mongoose.model<IProjectOnboarding>('ProjectOnboarding', ProjectOnboardingSchema);
