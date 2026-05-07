import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'ppt', 'book', 'image', 'video', 'link', 'zip'], required: true },
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String }, // Markdown content or description
  videoUrl: { type: String }, // URL to video resource
  fileUrl: { type: String }, // URL to primary file resource (PDF, PPT, etc)
  duration: { type: Number }, // in minutes
  type: { type: String, enum: ['video', 'book', 'ppt', 'pdf', 'image', 'article', 'quiz', 'challenge', 'project', 'assignment'], default: 'video' },
  resources: [resourceSchema],

  // TVET specific fields
  performanceCriteria: [{ type: String }],
  competenceElement: { type: String },
  assessmentCriteria: [{ type: String }],
  githubClassroomLink: { type: String },

  // Assignment specific fields
  isAssignment: { type: Boolean, default: false },
  requiredAssignment: { type: Boolean, default: false },
  assignmentDescription: { type: String },
  assignmentDeliverables: [{ type: String }],
  assignmentQuestions: [{
    questionText: { type: String },
    type: { type: String, enum: ['mcq', 'open'], default: 'open' },
    options: [{ type: String }],
    correctOptionIndex: { type: Number },
    explanation: { type: String },
    points: { type: Number, default: 10 }
  }],
  assignmentConfig: {
    timeLimit: { type: Number }, // in minutes
    allowRetakes: { type: Boolean, default: false },
    disableRightClick: { type: Boolean, default: false },
    mode: { type: String, enum: ['exam', 'exercise'], default: 'exam' }
  },
  order: { type: Number }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  lessons: [lessonSchema],
  learningOutcome: { type: String },
  hoursAllocated: { type: Number },
  order: { type: Number }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, default: 0 },
  discountPrice: { type: Number },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  category: { type: String, required: true },
  modules: [moduleSchema],
  studentsEnrolled: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Configuration & limits
  maxStudents: { type: Number }, // If null, unlimited
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  isDeleted: { type: Boolean, default: false },
  allowedDeliveryModes: [{ type: String, enum: ['online', 'physical', 'hybrid'] }],
  enrollmentMode: { type: String, enum: ['direct', 'application'], default: 'direct' },
  applicationQuestions: [{
    label: { type: String, required: true },
    required: { type: Boolean, default: true },
    type: { type: String, enum: ['text', 'textarea', 'link', 'select'], default: 'text' },
    options: [{ type: String }]
  }],

  // TVET / Rwanda Special fields
  githubClassroom: { type: String },
  curriculumMetadata: {
    sector: { type: String },
    trade: { type: String },
    moduleType: { type: String },
    curriculum: { type: String },
    credits: { type: Number },
    learningHours: { type: Number },
    issueDate: { type: String },
    version: { type: String },
    rqfLevel: { type: String },
    competencyBased: { type: Boolean, default: true },
    tvetCode: { type: String }
  },
  submissionRequired: { type: Boolean, default: true },
  signerName: { type: String },
  signerSignature: { type: String },
  school: { type: String, trim: true },
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
