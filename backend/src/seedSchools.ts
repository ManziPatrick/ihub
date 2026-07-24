import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedSchools = async () => {
  try {
    await connectDB();
    console.log('📚 Seeding School courses...');

    // Need an instructor ID
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Creating temporary admin user...');
      admin = await new User({
        username: 'admin',
        email: 'admin@bootskills.com',
        password: 'password', // will be hashed in pre-save if standard
        role: 'admin',
        fullName: 'Admin User'
      }).save();
    }

    // Drop all courses first to have a clean slate as requested (to see the schools easily)
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing courses.');

    const coursesToSeed = [
      {
        title: "Software Engineering Bootcamp",
        description: "Intensive 12-week software engineering program focusing on full-stack development with React and Node.js.",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "Advanced Data Science",
        description: "Master machine learning, deep learning, and big data technologies.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Learn to design beautiful, user-friendly interfaces using Figma and modern design principles.",
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Intermediate",
        category: "Design",
        status: "published",
        school: "bootskills Academy"
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "Comprehensive guide to SEO, social media marketing, and content strategy.",
        thumbnail: "https://images.unsplash.com/photo-1432888117286-315d5abac34a?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Beginner",
        category: "Marketing",
        status: "published",
        school: "Kigali Business School"
      },
      {
        title: "Cybersecurity Essentials",
        description: "Learn how to protect networks, systems, and data from digital attacks.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Advanced",
        category: "IT & Software",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "Business Leadership & Management",
        description: "Develop critical leadership skills and learn how to manage modern organizations effectively.",
        thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 1000,
        level: "Intermediate",
        category: "Business",
        status: "published",
        school: "Greenhill Academy"
      }
    ];

    for (const courseData of coursesToSeed) {
      const course = await new Course(courseData).save();
      console.log(`✅ Seeded course: ${course.title} (${course.school})`);
    }

    console.log('🏁 School courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedSchools();
