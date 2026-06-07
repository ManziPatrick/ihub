import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAssignedTask extends Document {
  userId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  relatedApplication?: mongoose.Types.ObjectId; // For tasks related to an application
  relatedPhase?: mongoose.Types.ObjectId; // For tasks related to a phase
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
  }>;
  checklist?: Array<{
    item: string;
    completed: boolean;
  }>;
  assignedDate: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserAssignedTaskSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    dueDate: { type: Date },
    relatedApplication: { type: Schema.Types.ObjectId, ref: 'InternshipApplication' },
    relatedPhase: { type: Schema.Types.ObjectId, ref: 'ApplicationPhase' },
    attachments: [
      {
        fileName: { type: String },
        fileUrl: { type: String },
      }
    ],
    checklist: [
      {
        item: { type: String },
        completed: { type: Boolean, default: false },
      }
    ],
    assignedDate: { type: Date, default: Date.now },
    completedDate: { type: Date },
  },
  { timestamps: true }
);

// Composite index for efficient querying
UserAssignedTaskSchema.index({ userId: 1, status: 1 });
UserAssignedTaskSchema.index({ assignedBy: 1, status: 1 });
UserAssignedTaskSchema.index({ dueDate: 1 });

export const UserAssignedTask = mongoose.model<IUserAssignedTask>('UserAssignedTask', UserAssignedTaskSchema);
