import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    title: string;
    type: 'video' | 'pdf' | 'drive' | 'link' | 'image' | 'docx' | 'pptx';
    source: 'cloudinary' | 'google_drive' | 'external';
    url: string;
    linkedTo?: mongoose.Types.ObjectId;
    onModel?: 'Course' | 'Lesson' | 'InternshipMilestone' | 'Project' | 'ProjectTask' | 'DailyTracker' | 'Internship';
    visibility: 'public' | 'private' | 'interns_only';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ResourceSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ['video', 'pdf', 'drive', 'link', 'image', 'docx', 'pptx'],
            required: true
        },
        source: {
            type: String,
            enum: ['cloudinary', 'google_drive', 'external'],
            required: true
        },
        url: { type: String, required: true },
        linkedTo: { type: Schema.Types.ObjectId, refPath: 'onModel' },
        onModel: {
            type: String,
            enum: ['Course', 'Lesson', 'InternshipMilestone', 'Project', 'ProjectTask', 'DailyTracker', 'Internship']
        },
        visibility: {
            type: String,
            enum: ['public', 'private', 'interns_only'],
            default: 'public'
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
