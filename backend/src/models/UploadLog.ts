import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminUsername: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  publicId?: string;
  type: 'image' | 'file' | 'document';
  action: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UploadLogSchema: Schema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminUsername: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    type: { type: String, enum: ['image', 'file', 'document'], required: true },
    action: { type: String, default: 'upload' },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

UploadLogSchema.index({ createdAt: -1 });
UploadLogSchema.index({ adminId: 1, createdAt: -1 });
UploadLogSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<IUploadLog>('UploadLog', UploadLogSchema);
