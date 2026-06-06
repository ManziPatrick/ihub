import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectApplication extends Document {
  clientId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'deleted';
  requiredDocuments: {
    overviewUrl?: string;
    featuresUrl?: string;
    technicalUrl?: string;
  };
  ndaSigned: boolean;
  signerName?: string;
  signedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectApplicationSchema: Schema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'deleted'],
      default: 'submitted',
      index: true,
    },
    requiredDocuments: {
      overviewUrl: { type: String },
      featuresUrl: { type: String },
      technicalUrl: { type: String },
    },
    ndaSigned: { type: Boolean, default: false },
    signerName: { type: String },
    signedAt: { type: Date },
    reviewNotes: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const ProjectApplication = mongoose.model<IProjectApplication>('ProjectApplication', ProjectApplicationSchema);
