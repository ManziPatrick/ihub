import mongoose, { Schema, Document } from 'mongoose';

export interface IEventApplication extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  applicationAnswers: {
    questionLabel: string;
    answer: string;
  }[];
  selectedDeliveryMode?: string;
  notes?: string;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventApplicationSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'waitlisted'],
      default: 'pending',
      index: true,
    },
    applicationAnswers: [
      {
        questionLabel: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    selectedDeliveryMode: { type: String, enum: ['online', 'physical', 'hybrid'] },
    notes: { type: String },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Prevent duplicate applications
EventApplicationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventApplication = mongoose.model<IEventApplication>('EventApplication', EventApplicationSchema);
