import mongoose, { Schema, Document } from 'mongoose';

export interface IInternshipProgram extends Document {
  title: string;
  organization?: string; // Company or school that owns this opportunity, e.g. "Google", "University of Rwanda"
  description: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  applicationDeadline: Date;
  eligibility: string;
  rules: string;
  price: number;
  currency: string;
  discount: number;
  maxParticipants: number;
  maxSpots: number;
  image: string;
  isActive: boolean;
  batches: { name: string; startDate: Date; endDate: Date }[];
  status: 'active' | 'inactive' | 'closed' | 'upcoming';
  allowedDeliveryModes: ('online' | 'physical' | 'hybrid')[];
  applicationQuestions: {
    label: string;
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'number';
    required: boolean;
    options?: string[];
    maxFileSize?: number;
    acceptedFileTypes?: string[];
  }[];
  // Phase-based application management
  enablePhaseBasedApproval: boolean;
  phases?: mongoose.Types.ObjectId[]; // References to ApplicationPhase documents
  phaseApprovalRules?: {
    requireApprovalAtEachPhase: boolean;
    autoProgressOnApproval: boolean;
  };
  isDeleted: boolean;
  createdBy?: mongoose.Types.ObjectId;
  signerName?: string;
  signerSignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipProgramSchema: Schema = new Schema(
  {
    title: { type: String, required: true, index: true },
    organization: { type: String, index: true, trim: true },
    description: { type: String, required: true },
    duration: { type: String, required: true }, // e.g., "3 Months"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true },
    eligibility: { type: String },
    rules: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    discount: { type: Number, default: 0 }, // percentage discount, e.g. 20 = 20%
    maxParticipants: { type: Number },
    maxSpots: { type: Number, default: 0 }, // 0 = unlimited
    image: { type: String },
    isActive: { type: Boolean, default: true },
    batches: [{
      name: { type: String },
      startDate: { type: Date },
      endDate: { type: Date }
    }],
    applicationQuestions: [
      {
        label: { type: String, required: true },
        type: { type: String, enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file', 'number'], default: 'text' },
        required: { type: Boolean, default: false },
        options: [{ type: String }],
        maxFileSize: { type: Number },
        acceptedFileTypes: [{ type: String }]
      }
    ],
    status: { type: String, enum: ['active', 'inactive', 'closed', 'upcoming'], default: 'active', index: true },
    allowedDeliveryModes: [{ type: String, enum: ['online', 'physical', 'hybrid'] }],
    enablePhaseBasedApproval: { type: Boolean, default: false },
    phases: [{ type: Schema.Types.ObjectId, ref: 'ApplicationPhase' }],
    phaseApprovalRules: {
      requireApprovalAtEachPhase: { type: Boolean, default: true },
      autoProgressOnApproval: { type: Boolean, default: false },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    signerName: { type: String },
    signerSignature: { type: String },
  },
  { timestamps: true }
);

export const InternshipProgram = mongoose.model<IInternshipProgram>('InternshipProgram', InternshipProgramSchema);
