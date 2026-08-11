import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial extends Document {
  quote: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatar: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: mongoose.Types.ObjectId;
  reviewNote: string;
  reviewedBy: mongoose.Types.ObjectId;
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema = new Schema(
  {
    quote: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Snapshot of author info at submission time (in case the profile changes)
    authorName: { type: String, trim: true },
    authorRole: { type: String, trim: true },
    authorCompany: { type: String, trim: true },
    authorAvatar: { type: String },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    // Who created this entry (student themself, or an admin on their behalf)
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

TestimonialSchema.index({ status: 1, createdAt: -1 });

export const Testimonial = mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
