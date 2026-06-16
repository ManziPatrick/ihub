import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }, // Optional, can be course-wide
  moduleNumber: { type: String }, // For tracking questions by module position
  lessonNumber: { type: String }, // For tracking questions by lesson position
  questionText: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'open_ended', 'true_false', 'matching'], default: 'multiple_choice' },
  imageUrl: { type: String }, // Optional image for the question
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  matchingPairs: [{
    id: { type: String },
    left: { type: String },
    right: { type: String }
  }],
  explanation: { type: String },
}, { timestamps: true });

export const Question = mongoose.model('Question', questionSchema);
