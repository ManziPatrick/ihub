import mongoose, { Schema, Document } from 'mongoose';

export type MeetingFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface IInternshipMeeting extends Document {
  title: string;
  description?: string;
  type: MeetingFrequency;
  deliveryMode: 'online' | 'physical';
  meetLink?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  recurrenceDays?: number[]; // 0=Sun,1=Mon...6=Sat
  recurrenceEndDate?: Date;
  teamIds: mongoose.Types.ObjectId[];
  userIds: mongoose.Types.ObjectId[]; // Selective users
  mentorIds: mongoose.Types.ObjectId[]; // Selective trainers/mentors
  hostId: mongoose.Types.ObjectId; // Trainer/Admin who created it
  status: 'pending' | 'confirmed' | 'cancelled';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipMeetingSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'ONCE',
    },
    deliveryMode: { type: String, enum: ['online', 'physical'], default: 'online' },
    meetLink: { type: String }, // For online
    location: { type: String }, // For physical
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    recurrenceDays: [{ type: Number, min: 0, max: 6 }], // 0=Sun,1=Mon...6=Sat
    recurrenceEndDate: { type: Date },
    teamIds: [{ type: Schema.Types.ObjectId, ref: 'InternshipTeam', index: true }],
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    mentorIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const InternshipMeeting = mongoose.model<IInternshipMeeting>('InternshipMeeting', InternshipMeetingSchema);
