import { Request, Response } from 'express';
import { Certificate } from '../models/Certificate';
import { Config } from '../models/Config';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Internship } from '../models/Internship';
import mongoose from 'mongoose';

export const getSignerSettings = async (req: Request, res: Response) => {
    try {
        const signerName = await Config.findOne({ key: 'certificate_signer_name' });
        const signerSignature = await Config.findOne({ key: 'certificate_signer_signature' });
        
        return res.json({
            signerName: signerName?.value || 'Patrick Manzi',
            signerSignature: signerSignature?.value || ''
        });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateSignerSettings = async (req: Request, res: Response) => {
    try {
        const { signerName, signerSignature } = req.body;
        
        if (signerName) {
            await Config.findOneAndUpdate(
                { key: 'certificate_signer_name' },
                { key: 'certificate_signer_name', value: signerName, description: 'Default signer name for certificates' },
                { upsert: true }
            );
        }
        
        if (signerSignature) {
            await Config.findOneAndUpdate(
                { key: 'certificate_signer_signature' },
                { key: 'certificate_signer_signature', value: signerSignature, description: 'Default signer signature URL for certificates' },
                { upsert: true }
            );
        }
        
        return res.json({ message: 'Signer settings updated successfully' });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const autoGenerateCertificate = async (userId: string, itemId: string, type: 'course' | 'internship') => {
    try {
        // Check if certificate already exists
        const existing = await Certificate.findOne({ userId, courseId: itemId });
        if (existing && existing.status === 'issued') return existing;

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        let title = '';
        let itemSignerName = '';
        let itemSignerSignature = '';

        if (type === 'course') {
            const course = await Course.findById(itemId);
            title = course?.title || 'Course Certificate';
            itemSignerName = (course as any)?.signerName || '';
            itemSignerSignature = (course as any)?.signerSignature || '';
        } else {
            // For internships, we might have specific signer info in the InternshipProgram or Internship record
            const internship = await Internship.findById(itemId);
            title = internship?.title || 'Internship Certificate';
            itemSignerName = (internship as any)?.signerName || '';
            itemSignerSignature = (internship as any)?.signerSignature || '';
        }

        const globalSignerName = await Config.findOne({ key: 'certificate_signer_name' });
        const globalSignerSignature = await Config.findOne({ key: 'certificate_signer_signature' });

        const certificateData = {
            userId,
            courseId: itemId,
            courseTitle: title,
            recipientName: user.certificateName || user.fullName || user.username,
            signerName: itemSignerName || globalSignerName?.value || 'Patrick Manzi',
            signerSignature: itemSignerSignature || globalSignerSignature?.value || '',
            issueDate: new Date(),
            credentialId: `CMD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'issued',
            progress: 100
        };

        if (existing) {
            Object.assign(existing, certificateData);
            return await existing.save();
        } else {
            return await Certificate.create(certificateData);
        }
    } catch (error) {
        console.error('Error auto-generating certificate:', error);
    }
};

export const updateRecipientName = async (req: Request, res: Response) => {
    try {
        const { certificateId, newName } = req.body;
        const userId = (req as any).user?.id;

        const certificate = await Certificate.findById(certificateId);
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

        // Only allow owner or admin to update
        if (certificate.userId.toString() !== userId && (req as any).user?.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        certificate.recipientName = newName;
        await certificate.save();

        return res.json({ message: 'Certificate name updated', certificate });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};
