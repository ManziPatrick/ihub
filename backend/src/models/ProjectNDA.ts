import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectNDA extends Document {
  projectApplicationId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  signerName: string;
  signerEmail: string;
  signedAt?: Date;
  signerIp?: string;
  signatureHash?: string;
  status: 'pending' | 'signed';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectNDASchema: Schema = new Schema(
  {
    projectApplicationId: { type: Schema.Types.ObjectId, ref: 'ProjectApplication', required: true, unique: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    signerName: { type: String, required: true },
    signerEmail: { type: String, required: true },
    signedAt: { type: Date },
    signerIp: { type: String },
    signatureHash: { type: String },
    status: {
      type: String,
      enum: ['pending', 'signed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const ProjectNDA = mongoose.model<IProjectNDA>('ProjectNDA', ProjectNDASchema);
