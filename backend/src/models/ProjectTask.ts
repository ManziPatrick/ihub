import mongoose, { Schema, Document } from 'mongoose';

export type ProjectTaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'blocked';

export type ProjectTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IProjectTask extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assigneeId?: mongoose.Types.ObjectId;
  labels?: string[];
  storyPoints?: number;
  dueDate?: Date;
  order: number;
  dependencies?: mongoose.Types.ObjectId[];
  approved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  feedback?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTaskSchema: Schema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked'],
      default: 'backlog',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    labels: [{ type: String }],
    storyPoints: { type: Number },
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'ProjectTask' }],
    approved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    feedback: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProjectTaskSchema.index({ projectId: 1, status: 1, order: 1 });
ProjectTaskSchema.index({ assigneeId: 1, status: 1 });

export const ProjectTask = mongoose.model<IProjectTask>('ProjectTask', ProjectTaskSchema);
