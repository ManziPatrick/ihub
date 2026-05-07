import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedDiverseCourses = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to database - Starting diverse courses seeding...');

    // Find a trainer or admin to be the instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin'] } });
    
    if (!instructor) {
      console.log('No trainer/admin found. Creating a default trainer...');
      instructor = await new User({
        fullName: 'Dr. Sarah Wilson',
        username: 'sarah.wilson',
        email: 'sarah.wilson@ihub.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active'
      }).save();
    }

    // Clear existing courses to avoid duplicates
    await Course.deleteMany({});
    console.log('🗑️ Cleared existing courses.');

    const diverseCourses = [
      // --- TECHNOLOGY ---
      {
        title: "Artificial Intelligence for Business Leaders",
        description: "A comprehensive guide for executives to understand AI capabilities, implementation strategies, and ethical considerations in the modern workplace.",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 150000,
        level: "Intermediate",
        category: "AI & Machine Learning",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online", "hybrid"],
        enrollmentMode: "direct"
      },
      {
        title: "Ethical Hacking & Penetration Testing",
        description: "Master the tools and techniques used by professional ethical hackers to secure networks and identify vulnerabilities before malicious actors do.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 450000,
        level: "Advanced",
        category: "Cybersecurity",
        status: "published",
        school: "Kingdavid",
        allowedDeliveryModes: ["online", "physical"],
        enrollmentMode: "application"
      },
      
      // --- BUSINESS & FINANCE ---
      {
        title: "Entrepreneurship: From Idea to Scale",
        description: "Learn how to validate your business idea, build a minimum viable product, and secure funding for your startup in the African ecosystem.",
        thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0, // Free
        level: "Beginner",
        category: "Entrepreneurship",
        status: "published",
        school: "Kigali Business School",
        allowedDeliveryModes: ["hybrid"],
        enrollmentMode: "application"
      },
      {
        title: "Personal Finance & Investment Mastery",
        description: "Take control of your financial future. Learn about budgeting, saving, and investing in stocks, real estate, and digital assets.",
        thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 85000,
        level: "Beginner",
        category: "Financial Literacy",
        status: "published",
        school: "Finance Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct"
      },

      // --- CREATIVE ARTS & DESIGN ---
      {
        title: "Digital Illustration with Procreate",
        description: "Unlock your creative potential. Master digital painting techniques on the iPad to create stunning illustrations and concept art.",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 120000,
        level: "Intermediate",
        category: "Graphic Design",
        status: "published",
        school: "Creative Arts Institute",
        allowedDeliveryModes: ["online", "physical"],
        enrollmentMode: "direct"
      },
      {
        title: "Professional Video Editing with Premiere Pro",
        description: "Learn the industry-standard software for video editing. From basic cuts to advanced color grading and motion graphics.",
        thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 280000,
        level: "Intermediate",
        category: "Video Production",
        status: "published",
        school: "Creative Arts Institute",
        allowedDeliveryModes: ["physical"],
        enrollmentMode: "direct"
      },

      // --- PERSONAL DEVELOPMENT ---
      {
        title: "Public Speaking & Confident Communication",
        description: "Overcome stage fright and learn how to deliver impactful presentations that inspire and persuade your audience.",
        thumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 95000,
        level: "Beginner",
        category: "Soft Skills",
        status: "published",
        school: "Greenhill Academy",
        allowedDeliveryModes: ["hybrid", "physical"],
        enrollmentMode: "direct"
      },
      {
        title: "Time Management & Peak Productivity",
        description: "Discover the systems and habits used by high achievers to manage their time, eliminate distractions, and get more done.",
        thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 45000,
        level: "Beginner",
        category: "Personal Development",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct"
      },

      // --- HEALTH & WELLNESS ---
      {
        title: "Mindfulness & Stress Reduction",
        description: "Learn scientifically proven techniques to reduce anxiety, improve focus, and find inner peace in a fast-paced world.",
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0, // Free
        level: "Beginner",
        category: "Wellness",
        status: "published",
        school: "Wellness Hub",
        allowedDeliveryModes: ["online", "hybrid"],
        enrollmentMode: "direct"
      },
      {
        title: "Advanced Vinyasa Yoga Flow",
        description: "A physically challenging course for experienced practitioners looking to deepen their practice and master advanced asanas.",
        thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 180000,
        level: "Advanced",
        category: "Health & Fitness",
        status: "published",
        school: "Wellness Hub",
        allowedDeliveryModes: ["physical"],
        enrollmentMode: "direct"
      },

      // --- LANGUAGES ---
      {
        title: "Professional French for Business",
        description: "Master the French language specifically for professional environments, meetings, and business negotiations in the Francophone world.",
        thumbnail: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 220000,
        level: "Intermediate",
        category: "Languages",
        status: "published",
        school: "Kigali Business School",
        allowedDeliveryModes: ["online", "hybrid"],
        enrollmentMode: "application"
      },
      // --- TRADES & TECHNICAL ---
      {
        title: "Modern Electrical Installation",
        description: "Comprehensive training in domestic and industrial electrical installations, following international safety standards.",
        thumbnail: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 350000,
        level: "Beginner",
        category: "Electrical Engineering",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["physical"],
        enrollmentMode: "direct"
      },
      {
        title: "Advanced Plumbing Systems",
        description: "Master the design, installation, and maintenance of complex plumbing systems for residential and commercial buildings.",
        thumbnail: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 320000,
        level: "Intermediate",
        category: "Construction & Trades",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["physical"],
        enrollmentMode: "direct"
      },
      {
        title: "Culinary Arts & Hospitality Management",
        description: "From knife skills to kitchen management. Learn the secrets of international cuisine and professional restaurant service.",
        thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 550000,
        level: "Beginner",
        category: "Hospitality",
        status: "published",
        school: "Greenhill Academy",
        allowedDeliveryModes: ["physical"],
        enrollmentMode: "application"
      }
    ];

    for (const courseData of diverseCourses) {
      // Add some basic modules and lessons so the course isn't empty
      const courseWithContent = {
        ...courseData,
        modules: [
          {
            title: "Introduction & Fundamentals",
            description: "Getting started with the core concepts.",
            lessons: [
              {
                title: "Welcome to the Course",
                duration: 10,
                type: "video",
                content: "### Welcome!\nWe're excited to have you here. In this lesson, we'll cover the course roadmap and what you can expect to learn."
              },
              {
                title: "Core Principles",
                duration: 25,
                type: "article",
                content: "### Understanding the Core\nThis lesson dives deep into the foundational principles that govern this field."
              }
            ]
          },
          {
            title: "Practical Application",
            description: "Applying what you've learned to real-world scenarios.",
            lessons: [
              {
                title: "Case Study Analysis",
                duration: 45,
                type: "video",
                content: "We'll analyze real-world examples to see these principles in action."
              },
              {
                title: "Module Assessment",
                duration: 60,
                type: "assignment",
                isAssignment: true,
                assignmentDescription: "Complete the practical task described in the lesson content and submit your work for review."
              }
            ]
          }
        ]
      };

      const course = await new Course(courseWithContent).save();
      console.log(`✅ Seeded: ${course.title} | Category: ${course.category} | School: ${course.school}`);
    }

    console.log('\n🏁 Diverse courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDiverseCourses();
