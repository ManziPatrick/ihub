import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        await connectDB();
        console.log('📦 Connected to MongoDB');

        const email = 'superadmin@bootskills.com';
        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log('⚠️ Super Admin already exists.');
            existingAdmin.role = 'super_admin';
            existingAdmin.username = 'SuperAdmin';
            await existingAdmin.save();
            console.log('✅ Updated existing user to super_admin role.');
        } else {
            const password = 'Password@123';
            const hashedPassword = await bcrypt.hash(password, 10);

            const superAdmin = new User({
                username: 'SuperAdmin',
                email,
                password: hashedPassword,
                role: 'super_admin',
                isVerified: true
            });

            await superAdmin.save();
            console.log('🚀 Super Admin created successfully.');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding super admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
