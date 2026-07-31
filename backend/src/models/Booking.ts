import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  topic: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  deliveryMode: { type: String, enum: ['online', 'physical'], default: 'online' },
  meetingLink: { type: String }, // For online
  location: { type: String }, // For physical
  isDeleted: { type: Boolean, default: false },
  contextType: { type: String, enum: ['general', 'course', 'internship', 'event'], default: 'general' },
  contextTitle: { type: String },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
