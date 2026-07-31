import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'trainer', 'admin', 'super_admin', 'client'],
    default: 'student',
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github', 'firebase'],
    default: 'local'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  completedLessons: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lessonId: { type: String }
  }],
  courseProgress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lessonId: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  activityLog: [{
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  badges: [{
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    awardedAt: { type: Date, default: Date.now }
  }],
  grades: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    lessonId: { type: String },
    score: { type: Number },
    feedback: { type: String },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date, default: Date.now }
  }],
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  academicStatus: { type: String, enum: ['active', 'intern', 'graduate', 'alumni'], default: 'active' },
  permissions: [{ type: String }],
  // Account Status & Soft Delete
  status: { type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active' },
  isDeleted: { type: Boolean, default: false },

  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Tracking & Presence
  lastActive: { type: Date },
  isOnline: { type: Boolean, default: false },
  totalTimeSpent: { type: Number, default: 0 }, // in seconds

  // Navigation Tracking (Last known path)
  lastPath: { type: String },

  // Profile Fields
  fullName: { type: String },
  bio: { type: String },
  avatar: { type: String },
  coverImage: { type: String },
  phone: { type: String },
  location: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  locationUpdatedAt: { type: Date },
  locationShared: { type: Boolean, default: false },
  locationDenied: { type: Boolean, default: false },
  title: { type: String },

  // Theme Preferences
  themePreference: {
    primaryColor: { type: String },
    mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    lightBg: { type: String },
    darkBg: { type: String }
  },

  // Two-Factor Authentication
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  twoFactorBackupCodes: [{ type: String }],
  loginOTP: { type: String },
  loginOTPExpires: { type: Date },
  certificateName: { type: String },
  school: { type: String, trim: true },
  isFirst: { type: Boolean, default: true },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Trainer-specific fields
  isTrainerApproved: { type: Boolean, default: false },
  isProfilePublic: { type: Boolean, default: true },
  trainerApplication: {
    specialties: [{ type: String }],
    experienceYears: { type: Number },
    teachingPhilosophy: { type: String },
    qualifications: [{ type: String }],
    rateHourly: { type: Number },
    linkedinProfile: { type: String },
    githubProfile: { type: String },
    websiteUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String },
  },
}, { timestamps: true });

// Indexes for efficient user queries
userSchema.index({ role: 1, status: 1 });
userSchema.index({ status: 1, isDeleted: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ assignedAdmin: 1 });
userSchema.index({ isOnline: 1, lastActive: -1 });

export const User = mongoose.model('User', userSchema);
