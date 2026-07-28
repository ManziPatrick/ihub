import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  shortDescription: string;
  type: 'bootcamp' | 'workshop' | 'conference' | 'seminar' | 'meetup' | 'hackathon' | 'webinar' | 'other';
  eventType: 'event'; // discriminator for unified listing with internships
  startDate: Date;
  endDate: Date;
  timezone: string;
  location: string;
  isOnline: boolean;
  meetingLink: string;
  image: string;
  price: number;
  currency: string;
  maxAttendees: number;
  organizerName: string;
  organizerBio: string;
  organizerPhoto: string;
  tags: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  featured: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 300 },
    type: {
      type: String,
      enum: ['bootcamp', 'workshop', 'conference', 'seminar', 'meetup', 'hackathon', 'webinar', 'other'],
      default: 'workshop',
      index: true,
    },
    eventType: { type: String, default: 'event' }, // discriminator
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: 'Africa/Kigali' },
    location: { type: String },
    isOnline: { type: Boolean, default: false },
    meetingLink: { type: String },
    image: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    maxAttendees: { type: Number, default: 0 }, // 0 = unlimited
    organizerName: { type: String },
    organizerBio: { type: String },
    organizerPhoto: { type: String },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

EventSchema.index({ status: 1, startDate: -1 });
EventSchema.index({ tags: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
