import mongoose, { Schema, Document } from 'mongoose';

export type MeetingFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type ContextType = 'course' | 'project' | 'client' | 'internship' | 'general';

interface Attendee {
  userId: mongoose.Types.ObjectId;
  role: 'host' | 'participant';
  attended: boolean;
  attendedAt?: Date;
}

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
  /** Context type for admin filtering and scope display */
  contextType: ContextType;
  /** Context title/name displayed on the schedule (e.g. course title, project name) */
  contextTitle?: string;
  courseIds: mongoose.Types.ObjectId[]; // Courses to target enrolled students
  teamIds: mongoose.Types.ObjectId[]; // Internship project teams
  clientIds: mongoose.Types.ObjectId[]; // Client accounts
  internshipProgramIds: mongoose.Types.ObjectId[]; // Internship programs
  userIds: mongoose.Types.ObjectId[]; // Selective individual users
  mentorIds: mongoose.Types.ObjectId[]; // Selective trainers/mentors
  hostId: mongoose.Types.ObjectId; // Trainer/Admin who created it
  /** Track who attended the session */
  attendees: Attendee[];
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
    contextType: {
      type: String,
      enum: ['course', 'project', 'client', 'internship', 'general'],
      default: 'general',
      index: true,
    },
    contextTitle: { type: String },
    courseIds: [{ type: Schema.Types.ObjectId, ref: 'Course', index: true }],
    teamIds: [{ type: Schema.Types.ObjectId, ref: 'InternshipTeam', index: true }],
    clientIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    internshipProgramIds: [{ type: Schema.Types.ObjectId, ref: 'InternshipProgram', index: true }],
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    mentorIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attendees: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['host', 'participant'], default: 'participant' },
        attended: { type: Boolean, default: false },
        attendedAt: { type: Date },
      },
    ],
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const InternshipMeeting = mongoose.model<IInternshipMeeting>('InternshipMeeting', InternshipMeetingSchema);
