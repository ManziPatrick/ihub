import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationMeeting extends Document {
  applicationId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;
  scheduledBy: mongoose.Types.ObjectId;
  scheduledFor: mongoose.Types.ObjectId; // Student user ID
  meetingType: 'interview' | 'call' | 'group_discussion' | 'presentation' | 'other';
  title: string;
  description?: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:mm format
  duration: number; // in minutes
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  confirmedAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  meetingNotes?: string;
  feedback?: {
    rating?: number; // 1-5
    comments?: string;
    performanceGrade?: {
      grade: string;
      color: 'red' | 'yellow' | 'green';
    };
  };
  attendees: {
    userId: mongoose.Types.ObjectId;
    role: 'interviewer' | 'candidate' | 'observer';
    attended?: boolean;
  }[];
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationMeetingSchema: Schema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'InternshipApplication', required: true, index: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'ApplicationPhase', required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledFor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    meetingType: {
      type: String,
      enum: ['interview', 'call', 'group_discussion', 'presentation', 'other'],
      default: 'interview'
    },
    title: { type: String, required: true },
    description: { type: String },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    duration: { type: Number, default: 30 },
    location: { type: String },
    meetingLink: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true
    },
    confirmedAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    meetingNotes: { type: String },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      performanceGrade: {
        grade: { type: String },
        color: { type: String, enum: ['red', 'yellow', 'green'] },
      }
    },
    attendees: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['interviewer', 'candidate', 'observer'], required: true },
        attended: { type: Boolean },
      }
    ],
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient querying
ApplicationMeetingSchema.index({ scheduledDate: 1, status: 1 });

export const ApplicationMeeting = mongoose.model<IApplicationMeeting>('ApplicationMeeting', ApplicationMeetingSchema);
