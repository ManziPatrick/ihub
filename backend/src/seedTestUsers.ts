import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const users = [
  {
    username: 'LeadTrainer',
    email: 'trainer@ihub.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Lead Instructor',
    bio: 'Expert in software architecture and AI.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  },
  {
    username: 'StudentOne',
    email: 'student@ihub.com',
    password: 'Password@123',
    role: 'student',
    fullName: 'Alex Student',
    bio: 'Passionate learner exploring AI and Web3.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    username: 'WorkshopAsst',
    email: 'assistant@ihub.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Sarah Assistant',
    bio: 'Specialist in frontend development and UX.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
];

const seedUsers = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ User ${userData.email} already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
        isVerified: true
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('🏁 User seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
