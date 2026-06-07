import mongoose, { Schema, Document } from 'mongoose';

export interface IUndoMetric extends Document {
  actionType: 'delete' | 'restore';
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  entityTitle: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UndoMetricSchema: Schema = new Schema(
  {
    actionType: { type: String, enum: ['delete', 'restore'], required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityTitle: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

UndoMetricSchema.index({ entityType: 1, actionType: 1 });
UndoMetricSchema.index({ timestamp: -1 });

export const UndoMetric = mongoose.model<IUndoMetric>('UndoMetric', UndoMetricSchema);
