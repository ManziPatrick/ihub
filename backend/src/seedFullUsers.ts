import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const users = [
    {
        username: 'superadmin',
        fullName: 'Patrick Manzi',
        email: 'superadmin@ihub.com',
        password: 'password123',
        role: 'super_admin',
        title: 'Founder & CEO',
        bio: 'Senior Software Architect and Educator with 10+ years of experience in full-stack development and AI integration.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000000',
        status: 'active',
        isEmailVerified: true,
        level: 50,
        xp: 15000,
        streak: 45
    },
    {
        username: 'trainer_sarah',
        fullName: 'Sarah Uwase',
        email: 'trainer@ihub.com',
        password: 'password123',
        role: 'trainer',
        title: 'Lead Frontend Instructor',
        bio: 'Expert in React, Next.js and Modern UI Design. Passionate about teaching students how to build premium web experiences.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        phone: '+250780000001',
        status: 'active',
        isEmailVerified: true,
        level: 30,
        xp: 8000
    },
    {
        username: 'student_jean',
        fullName: 'Jean Claude',
        email: 'student@ihub.com',
        password: 'password123',
        role: 'student',
        bio: 'Aspiring Full Stack Developer. Currently learning MERN stack and AI engineering.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        location: 'Kigali, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 12,
        xp: 2500,
        streak: 7,
        academicStatus: 'active'
    },
    {
        username: 'student_alice',
        fullName: 'Alice Mutoni',
        email: 'alice@example.com',
        password: 'password123',
        role: 'student',
        bio: 'Passionate about Data Science and Machine Learning.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250',
        location: 'Musanze, Rwanda',
        status: 'active',
        isEmailVerified: true,
        level: 8,
        xp: 1200,
        streak: 12,
        academicStatus: 'intern'
    }
];

async function seedFullUsers() {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Delete existing users to avoid duplicates
        await User.deleteMany({ email: { $in: users.map(u => u.email) } });
        console.log('🗑️  Cleared existing users');

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const user = new User({
                ...userData,
                password: hashedPassword,
            });
            await user.save();
            console.log(`✅ Seeded ${userData.role}: ${userData.fullName} (@${userData.username})`);
        }

        console.log('\n🎉 All users seeded successfully with full profiles!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

seedFullUsers();
