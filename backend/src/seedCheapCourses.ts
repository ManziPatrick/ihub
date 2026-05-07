import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

const cheapCourses = [
  {
    title: "Test Course: Basic Logic (100 RWF)",
    description: "A simple course for testing low-value payments. Learn the basics of logic gates.",
    price: 100,
    category: "Testing",
    level: "Beginner",
    duration: "1 Hour",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    isPublished: true,
    curriculum: [
      {
        title: "Introduction",
        lessons: [
          { title: "What is Logic?", content: "Logic is the study of reasoning.", duration: "10 mins" }
        ]
      }
    ]
  },
  {
    title: "Test Course: CSS Mastery (150 RWF)",
    description: "Master CSS layouts for the price of a snack. Perfect for testing Pesapal/Paypack.",
    price: 150,
    category: "Web Development",
    level: "Intermediate",
    duration: "2 Hours",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2",
    isPublished: true,
    curriculum: [
      {
        title: "Advanced Layouts",
        lessons: [
          { title: "Flexbox vs Grid", content: "Learn when to use which.", duration: "30 mins" }
        ]
      }
    ]
  },
  {
    title: "Quick Start: React Props (100 RWF)",
    description: "Understand React props in 15 minutes. Micro-learning for micro-payments.",
    price: 100,
    category: "Web Development",
    level: "Beginner",
    duration: "15 Mins",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee",
    isPublished: true,
    curriculum: [
      {
        title: "Props 101",
        lessons: [
          { title: "Passing Data", content: "Props are read-only.", duration: "15 mins" }
        ]
      }
    ]
  },
  {
    title: "Coffee Break: Python Lists (150 RWF)",
    description: "Learn Python lists while you sip your coffee. Fast and cheap.",
    price: 150,
    category: "Data Science",
    level: "Beginner",
    duration: "20 Mins",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
    isPublished: true,
    curriculum: [
      {
        title: "List Basics",
        lessons: [
          { title: "Indexing", content: "Lists are zero-indexed.", duration: "20 mins" }
        ]
      }
    ]
  }
];

const seedCheapCourses = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Find a trainer to assign as instructor
    const trainer = await User.findOne({ role: 'trainer' });
    const instructorId = trainer ? trainer._id : new mongoose.Types.ObjectId();

    for (const courseData of cheapCourses) {
      await Course.findOneAndUpdate(
        { title: courseData.title },
        {
          ...courseData,
          instructor: instructorId,
          school: 'IHUB Academy',
          status: 'published'
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded: ${courseData.title}`);
    }

    console.log('🚀 Cheap test courses seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedCheapCourses();
