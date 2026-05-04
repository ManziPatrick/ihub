import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  school: string;
  educationLevel: 'nursery' | 'primary' | 'secondary' | 'university' | 'cambridge' | 'high_school' | 'undergraduate' | 'graduate' | 'postgraduate' | 'other';
  academicYear?: string;
  fieldOfStudy: string;
  city?: string;
  sector?: string;
  cell?: string;
  village?: string;
  skills: string[];
  availability: 'full_time' | 'part_time' | 'weekends' | 'flexible';
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  completionPercentage: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    school: {
      type: String,
      required: true,
      trim: true
    },
    educationLevel: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    sector: {
      type: String,
      trim: true
    },
    cell: {
      type: String,
      trim: true
    },
    village: {
      type: String,
      trim: true
    },
    skills: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one skill is required'
      }
    },
    availability: {
      type: String,
      enum: ['full_time', 'part_time', 'weekends', 'flexible'],
      required: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    linkedinUrl: {
      type: String,
      trim: true
    },
    githubUrl: {
      type: String,
      trim: true
    },
    portfolioUrl: {
      type: String,
      trim: true
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isComplete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Calculate completion percentage before saving
StudentProfileSchema.pre('save', async function () {
  const profile = this as unknown as IStudentProfile;

  const baseRequired = ['school', 'educationLevel', 'skills', 'availability', 'city'];
  const isHigherEd = !['nursery', 'primary'].includes(profile.educationLevel);
  const requiredFields = isHigherEd ? [...baseRequired, 'fieldOfStudy'] : baseRequired;
  
  const optionalFields = ['bio', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'sector', 'cell', 'village'];
  if (!isHigherEd) optionalFields.push('fieldOfStudy');

  let filledRequired = 0;
  let filledOptional = 0;

  // Check required fields
  requiredFields.forEach(field => {
    if (profile[field as keyof IStudentProfile]) {
      if (field === 'skills' && Array.isArray(profile.skills) && profile.skills.length > 0) {
        filledRequired++;
      } else if (field !== 'skills') {
        filledRequired++;
      }
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (profile[field as keyof IStudentProfile]) {
      filledOptional++;
    }
  });

  // Required fields are 70% weight, optional are 30%
  const requiredPercentage = (filledRequired / requiredFields.length) * 70;
  const optionalPercentage = (filledOptional / optionalFields.length) * 30;

  profile.completionPercentage = Math.round(requiredPercentage + optionalPercentage);
  profile.isComplete = filledRequired === requiredFields.length;
});

// Index for faster queries
StudentProfileSchema.index({ isComplete: 1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
