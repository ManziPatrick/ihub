import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Config } from './models/Config';
import connectDB from './config/db';

dotenv.config();

const checkBranding = async () => {
    try {
        await connectDB();
        const branding = await Config.findOne({ key: 'branding' });
        console.log('Current Branding in DB:', JSON.stringify(branding, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkBranding();
