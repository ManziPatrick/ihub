import mongoose, { Schema, Document } from 'mongoose';

export interface IInternship extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  organization: string;
  company?: string;
  startDate?: Date;
  endDate?: Date;
  duration: string;
  type: string; // 'Online', 'Hybrid', 'On-site'
  status: string; // 'not_eligible', 'eligible', 'enrolled', 'in_progress', 'completed', 'graduated'
  stage: string;
  currentStage: number; // 1 to 6
  completedStages: string[];
  projects: mongoose.Types.ObjectId[];
  mentorId?: mongoose.Types.ObjectId;
  mentors: mongoose.Types.ObjectId[];
  academicSchool?: string;
  academicLevel?: string;
  previousLanguages?: string;
  skills?: string;
  phoneNumber?: string;
  portfolioUrl?: string;
  payment: {
    amount: number;
    currency: string;
    status: string; // 'pending', 'paid', 'waived', 'installment'
    paidAt?: Date;
    discount?: number; // Discount percentage (0-100)
    isPaidProgram?: boolean;
    installmentsAllowed?: boolean;
  };
  applicationDetails?: {
    background?: string;
    currentLevel?: string;
    goal?: string;
    locationPreference?: string;
  };
  progress: number;
  milestones?: Array<{
    title: string;
    completed: boolean;
    date: Date;
  }>;
  tasks?: Array<{
    title: string;
    status: string; // 'completed', 'in_progress', 'pending'
    priority: string; // 'high', 'medium', 'low'
  }>;
  meetings?: Array<{
    title: string;
    time: string;
    type: string; // 'recurring', 'upcoming', 'past'
    url?: string;
    attendees?: string[]; // user IDs or 'all'
  }>;
  sprintReviews?: Array<{
    week: number;
    grade: number; // out of 100
    feedback: string;
    reviewedBy: mongoose.Types.ObjectId;
    date: Date;
  }>;
  cohort?: string; // Grouping interns into cohorts
  groupId?: string; // specific isolated group for pacing
  signerName?: string;
  signerSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    organization: { type: String, default: 'Codemande Academy' },
    company: { type: String }, // Optional for external partners
    cohort: { type: String }, // For grouping interns
    startDate: { type: Date },
    endDate: { type: Date },
    duration: { type: String, required: true },
    type: { type: String, required: true, enum: ['Online', 'Hybrid', 'On-site', 'Remote'], default: 'Online' },
    status: {
      type: String,
      required: true,
      enum: ['not_eligible', 'eligible', 'enrolled', 'in_progress', 'completed', 'graduated'],
      default: 'not_eligible'
    },
    stage: { type: String, default: 'Stage 1: Orientation & Onboarding' },
    currentStage: { type: Number, default: 1 },
    completedStages: [{ type: String }],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    mentorId: { type: Schema.Types.ObjectId, ref: 'User' },
    mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    academicSchool: { type: String },
    academicLevel: { type: String },
    previousLanguages: { type: String },
    skills: { type: String },
    phoneNumber: { type: String },
    portfolioUrl: { type: String },
    payment: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'RWF' },
      status: { type: String, enum: ['pending', 'paid', 'waived', 'installment'], default: 'pending' },
      paidAt: { type: Date },
      discount: { type: Number, default: 0, min: 0, max: 100 },
      isPaidProgram: { type: Boolean, default: true }, // Admin control: paid or free
      installmentsAllowed: { type: Boolean, default: false },
    },
    applicationDetails: {
      background: { type: String }, // e.g. "University Student", "Self-Taught"
      currentLevel: { type: String }, // "Beginner", "Junior", "Senior"
      goal: { type: String },
      locationPreference: { type: String },
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [
      {
        title: { type: String },
        completed: { type: Boolean, default: false },
        date: { type: Date },
      },
    ],
    tasks: [
      {
        title: { type: String },
        status: { type: String, enum: ['completed', 'in_progress', 'pending'], default: 'pending' },
        priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
      },
    ],
    meetings: [
      {
        title: { type: String },
        time: { type: String },
        type: { type: String, enum: ['recurring', 'upcoming', 'past'] },
        url: { type: String },
        attendees: [{ type: String }],
      },
    ],
    sprintReviews: [
      {
        week: { type: Number },
        grade: { type: Number, min: 0, max: 100 },
        feedback: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now },
      }
    ],
    groupId: { type: String },
    signerName: { type: String },
    signerSignature: { type: String },
  },
  { timestamps: true }
);

export const Internship = mongoose.model<IInternship>('Internship', InternshipSchema);
