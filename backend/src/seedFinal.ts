import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedFinal = async () => {
  try {
    console.log('📡 Connecting to Deployed Database...');
    await connectDB();
    console.log('✅ Connected.');

    // Ensure we have an instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin'] } });
    if (!instructor) {
      console.log('👤 No trainer/admin found. Creating a master admin...');
      instructor = await new User({
        fullName: 'Master Admin',
        username: 'admin',
        email: 'admin@ihub.com',
        password: 'Password123',
        role: 'admin',
        status: 'active',
        academicStatus: 'active'
      }).save();
    }

    // console.log('🗑️  Clearing existing courses for a fresh start...');
    // await Course.deleteMany({});

    const schoolCourses = [
      {
        title: "Software Engineering Bootcamp",
        description: "Intensive 12-week software engineering program focusing on full-stack development with React and Node.js.",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 500000,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "Kingdavid",
        allowedDeliveryModes: ["online", "hybrid"]
      },
      {
        title: "Advanced Data Science",
        description: "Master machine learning, deep learning, and big data technologies.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 750000,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "Comprehensive guide to SEO, social media marketing, and content strategy.",
        thumbnail: "https://images.unsplash.com/photo-1432888117286-315d5abac34a?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 250000,
        level: "Beginner",
        category: "Marketing",
        status: "published",
        school: "Kigali Business School"
      },
      {
        title: "Cybersecurity Professional",
        description: "Learn to protect systems, networks, and programs from digital attacks.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 600000,
        level: "Intermediate",
        category: "IT & Software",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Master the art of creating beautiful and functional user interfaces.",
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 350000,
        level: "Intermediate",
        category: "Design",
        status: "published",
        school: "Greenhill Academy"
      }
    ];

    const complexFreeCourses = [
      {
        title: "Full-Stack Web Development Mastery (Free)",
        description: "A comprehensive journey from HTML basics to advanced React and Node.js backend systems.",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct",
        modules: [
          {
            title: "Module 1: Web Foundation",
            description: "HTML & CSS Basics",
            lessons: [
              { title: "HTML Essentials", duration: 15, type: "video" },
              {
                title: "Quiz: HTML Basics",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "Which tag is used for links?",
                    type: "mcq",
                    options: ["<link>", "<a>", "<href>", "<url>"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Final Exam",
            lessons: [
              {
                title: "Certification Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam", timeLimit: 30 },
                assignmentQuestions: [
                  { questionText: "What is the purpose of React?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Mobile App Development with Flutter (Free)",
        description: "Build beautiful, natively compiled applications for mobile from a single codebase.",
        thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Introduction to Dart",
            lessons: [
              { title: "Dart Basics", duration: 20, type: "video" },
              {
                title: "Quiz: Dart Syntax",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "How do you define a variable in Dart?",
                    type: "mcq",
                    options: ["var", "let", "dim", "def"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Flutter Widgets",
            lessons: [
              { title: "Stateless vs Stateful", duration: 25, type: "video" },
              {
                title: "Final Exam: Flutter Basics",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Explain the Flutter build process.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Data Analytics with Python (Free)",
        description: "Learn to analyze data and gain insights using Python, Pandas, and Matplotlib.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Data Science",
        status: "published",
        school: "Kigali Business School",
        modules: [
          {
            title: "Module 1: Python for Data",
            lessons: [
              { title: "NumPy Fundamentals", duration: 20, type: "video" },
              {
                title: "Quiz: NumPy",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What does NumPy stand for?",
                    type: "mcq",
                    options: ["Number Python", "Numerical Python", "New Python", "Node Python"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Final Assessment",
            lessons: [
              {
                title: "Data Analytics Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "How do you handle missing data in Pandas?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Cloud Computing Essentials (Free)",
        description: "Understanding Cloud architecture, deployment models, and service providers.",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "IT & Software",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Cloud Concepts",
            lessons: [
              { title: "IaaS, PaaS, and SaaS", duration: 15, type: "video" },
              {
                title: "Quiz: Cloud Models",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What does SaaS stand for?",
                    type: "mcq",
                    options: ["Software as a Service", "System as a Service", "Servers as a Service", "Storage as a Service"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Cloud Exam",
            lessons: [
              {
                title: "Cloud Certification Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Compare AWS, Azure, and Google Cloud.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      }
    ];

    console.log('🚀 Seeding school courses...');
    for (const courseData of schoolCourses) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (existingCourse) {
        console.log(`⏩ Skipping existing: ${courseData.title}`);
        continue;
      }
      await new Course(courseData).save();
      console.log(`✅ Seeded: ${courseData.title} (${courseData.school})`);
    }

    console.log('🚀 Seeding complex free courses...');
    for (const courseData of complexFreeCourses) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (existingCourse) {
        console.log(`⏩ Skipping existing: ${courseData.title}`);
        continue;
      }
      const freeCourse = await new Course(courseData).save();
      console.log(`✅ Seeded: ${freeCourse.title} with ${freeCourse.modules.length} modules.`);
    }

    console.log('\n✨ Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFinal();
