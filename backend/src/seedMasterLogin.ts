import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const users = [
  {
    username: 'superadmin',
    fullName: 'Patrick Manzi',
    email: 'superadmin@codemande.com',
    password: 'password123',
    role: 'super_admin',
    isEmailVerified: true,
    status: 'active',
    level: 50,
    xp: 15000,
    streak: 45
  },
  {
    username: 'admin',
    fullName: 'System Admin',
    email: 'admin@codemande.com',
    password: 'password123',
    role: 'admin',
    isEmailVerified: true,
    status: 'active',
    level: 25,
    xp: 5000
  },
  {
    username: 'trainer_sarah',
    fullName: 'Sarah Uwase',
    email: 'trainer@bootskills.com',
    password: 'password123',
    role: 'trainer',
    isEmailVerified: true,
    status: 'active',
    level: 30,
    xp: 8000
  },
  {
    username: 'student_jean',
    fullName: 'Jean Claude',
    email: 'student@bootskills.com',
    password: 'password123',
    role: 'student',
    isEmailVerified: true,
    status: 'active',
    level: 12,
    xp: 2500,
    streak: 7
  }
];

const masterSeed = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Clean up existing users with these emails or usernames
    const emails = users.map(u => u.email);
    const usernames = users.map(u => u.username);
    await User.deleteMany({ 
      $or: [
        { email: { $in: emails } },
        { username: { $in: usernames } }
      ]
    });
    console.log('🗑️  Cleared existing test users');

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      console.log(`✅ Seeded ${userData.role}: ${userData.email}`);
    }

    console.log('\n🚀 Master login seed complete!');
    console.log('Use password: "password123" for all accounts.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during master seed:', error);
    process.exit(1);
  }
};

masterSeed();
