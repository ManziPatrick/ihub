import mongoose, { Schema, Document } from 'mongoose';

export interface IInternshipCertificate extends Document {
  userId: mongoose.Types.ObjectId;
  internshipProgramId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  certificateNumber: string;
  issuedAt: Date;
  trainerId: mongoose.Types.ObjectId;
  trainerName: string;
  trainerSignature?: string;
  internTitle: string;
  programTitle: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  completionDate: Date;
  pdfUrl?: string;
  verificationUrl?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  revocationReason?: string;
  metadata?: {
    milestonesCompleted: number;
    totalMilestones: number;
    finalGrade?: string;
    skills: string[];
  };
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InternshipCertificateSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    internshipProgramId: {
      type: Schema.Types.ObjectId,
      ref: 'InternshipProgram',
      required: true,
      index: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'InternshipTeam',
      required: true
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    issuedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    trainerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trainerName: {
      type: String,
      required: true
    },
    trainerSignature: {
      type: String,
      trim: true
    },
    internTitle: {
      type: String,
      required: true
    },
    programTitle: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    completionDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    pdfUrl: {
      type: String,
      trim: true
    },
    verificationUrl: {
      type: String,
      trim: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    revocationReason: {
      type: String,
      trim: true
    },
    metadata: {
      milestonesCompleted: {
        type: Number,
        min: 0
      },
      totalMilestones: {
        type: Number,
        min: 0
      },
      finalGrade: {
        type: String
      },
      skills: {
        type: [String]
      }
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Generate certificate number before saving if not exists
InternshipCertificateSchema.pre('validate', async function() {
  const certificate = this as any;
  
  if (!certificate.certificateNumber) {
    const year = new Date().getFullYear();
    
    // Find the last certificate for this year
    try {
      const lastCertificate = await mongoose.model('InternshipCertificate')
        .findOne({ certificateNumber: new RegExp(`^CERT-${year}`) })
        .sort({ certificateNumber: -1 });
      
      let sequence = 1;
      if (lastCertificate) {
        const lastSequence = parseInt((lastCertificate as any).certificateNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      certificate.certificateNumber = `CERT-${year}-${String(sequence).padStart(5, '0')}`;
      certificate.verificationUrl = `https://ihub.com/verify/${certificate.certificateNumber}`;
    } catch (error) {
       // Only log error if strictly necessary, otherwise proceed
       console.error("Error generating certificate number", error);
    }
  }
});

// Compound index to ensure one certificate per user per program
InternshipCertificateSchema.index({ userId: 1, internshipProgramId: 1 }, { unique: true });

export const InternshipCertificate = mongoose.model<IInternshipCertificate>('InternshipCertificate', InternshipCertificateSchema);
