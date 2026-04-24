import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseApplication extends Document {
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  applicationAnswers: {
    questionLabel: string;
    answer: string;
  }[];
  selectedDeliveryMode?: string;
  rejectionReason?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseApplicationSchema: Schema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'waitlisted'], 
      default: 'pending', 
      index: true 
    },
    applicationAnswers: [
      {
        questionLabel: { type: String, required: true },
        answer: { type: String, required: true }
      }
    ],
    selectedDeliveryMode: { type: String },
    rejectionReason: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Prevent duplicate applications
CourseApplicationSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const CourseApplication = mongoose.model<ICourseApplication>('CourseApplication', CourseApplicationSchema);
