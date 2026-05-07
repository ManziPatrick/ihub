import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Course } from './models/Course';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const extendedUsers = [
  { username: 'student_kevin', fullName: 'Kevin M.', email: 'kevin@example.com', role: 'student' },
  { username: 'student_bella', fullName: 'Bella R.', email: 'bella@example.com', role: 'student' },
  { username: 'student_dave', fullName: 'David O.', email: 'dave@example.com', role: 'student' },
  { username: 'trainer_mike', fullName: 'Mike Johnson', email: 'mike@ihub.com', role: 'trainer', title: 'Python Expert' },
  { username: 'trainer_lisa', fullName: 'Lisa Wong', email: 'lisa@ihub.com', role: 'trainer', title: 'Security Consultant' }
];

const seedExtended = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const u of extendedUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { ...u, password: hashedPassword, isVerified: true },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded/Updated User: ${u.username}`);
    }

    // Add some random engagement data (mocking courses)
    const trainerMike = await User.findOne({ email: 'mike@ihub.com' });
    
    if (trainerMike) {
      const course = new Course({
        title: 'Mastering Python for Data Science',
        description: 'Comprehensive guide to Python data analysis, visualization and ML.',
        instructor: trainerMike._id,
        category: 'Data Science',
        level: 'Intermediate',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
        modules: [
          {
            title: 'Python Essentials',
            lessons: [
              { title: 'Numpy Arrays', content: 'Detailed guide on numpy...', type: 'video' },
              { title: 'Pandas Dataframes', content: 'Cleaning data with pandas...', type: 'video' }
            ]
          }
        ],
        status: 'published'
      });
      await course.save();
      console.log('✅ Seeded Course: Python for Data Science');
    }

    console.log('🏁 Extended seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during extended seeding:', error);
    process.exit(1);
  }
};

seedExtended();
