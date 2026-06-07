import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
  accessingAdminId: mongoose.Types.ObjectId;
  accessingAdminUsername: string;
  queryName: string;
  accessedEntityType: string;
  isCrossAdmin: boolean;
  details: string;
  resultCount: number;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema: Schema = new Schema(
  {
    accessingAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accessingAdminUsername: { type: String, required: true },
    queryName: { type: String, required: true, index: true },
    accessedEntityType: { type: String, required: true, index: true },
    isCrossAdmin: { type: Boolean, default: false, index: true },
    details: { type: String, required: true },
    resultCount: { type: Number, default: 0 },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ accessingAdminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ isCrossAdmin: 1, createdAt: -1 });

export default mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
