import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskTracking extends Document {
  taskId: mongoose.Types.ObjectId;
  statusHistory: Array<{
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    notes?: string;
  }>;
  timeSpent: {
    total: number; // in minutes
    sessions: Array<{
      startTime: Date;
      endTime?: Date;
      duration: number; // in minutes
      notes?: string;
    }>;
  };
  progressPercentage: number; // 0-100
  progressUpdates: Array<{
    date: Date;
    percentage: number;
    notes?: string;
    updatedBy: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskTrackingSchema: Schema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'UserAssignedTask', required: true, unique: true, index: true },
    statusHistory: [
      {
        status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], required: true },
        changedAt: { type: Date, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        notes: { type: String },
      }
    ],
    timeSpent: {
      total: { type: Number, default: 0 }, // minutes
      sessions: [
        {
          startTime: { type: Date, required: true },
          endTime: { type: Date },
          duration: { type: Number, required: true }, // minutes
          notes: { type: String },
        }
      ]
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    progressUpdates: [
      {
        date: { type: Date, default: Date.now },
        percentage: { type: Number, required: true },
        notes: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      }
    ],
  },
  { timestamps: true }
);

export const TaskTracking = mongoose.model<ITaskTracking>('TaskTracking', TaskTrackingSchema);
