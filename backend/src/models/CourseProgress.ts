import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
    lessonId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // seconds
    lastAccessed: { type: Date, default: Date.now },
    visits: { type: Number, default: 1 }
});

const courseProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    lessons: [lessonProgressSchema],

    totalTimeSpent: { type: Number, default: 0 }, // seconds
    overallProgress: { type: Number, default: 0 }, // 0-100 percentage
    lastAccessed: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'in_progress', 'completed', 'dropped'], default: 'active' },
    selectedDeliveryMode: { type: String },
    completionDate: { type: Date }
}, { timestamps: true });

// Compound index to ensure unique progress record per user per course
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
