import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const users = [
  {
    username: 'LeadTrainer',
    email: 'trainer@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Lead Instructor',
    bio: 'Expert in software architecture and AI.',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80'
  },
  {
    username: 'StudentOne',
    email: 'student@bootskills.com',
    password: 'Password@123',
    role: 'student',
    fullName: 'Alex Student',
    bio: 'Passionate learner exploring AI and Web3.',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=400&q=80'
  },
  {
    username: 'WorkshopAsst',
    email: 'assistant@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Sarah Assistant',
    bio: 'Specialist in frontend development and UX.',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80'
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
