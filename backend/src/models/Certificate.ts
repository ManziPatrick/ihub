import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    courseTitle: string;
    issueDate?: Date;
    credentialId?: string;
    recipientName?: string;
    signerName?: string;
    signerSignature?: string;
    status: string; // 'issued', 'in_progress'
    progress?: number;
    requirements?: Array<{
        title: string;
        completed: boolean;
        current?: number;
        total?: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const CertificateSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        courseTitle: { type: String, required: true },
        issueDate: { type: Date },
        credentialId: { type: String },
        recipientName: { type: String },
        signerName: { type: String },
        signerSignature: { type: String },
        status: { type: String, required: true, enum: ['issued', 'in_progress'], default: 'in_progress' },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        requirements: [
            {
                title: { type: String },
                completed: { type: Boolean, default: false },
                current: { type: Number },
                total: { type: Number },
            },
        ],
    },
    { timestamps: true }
);

export const Certificate = mongoose.model<ICertificate>('Certificate', CertificateSchema);
