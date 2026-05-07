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
      }
    ];

    const complexFreeCourse = {
      title: "Full-Stack Web Development Mastery (Free)",
      description: "A comprehensive journey from HTML basics to advanced React and Node.js backend systems. This course includes multiple quizzes, hands-on modules, and a final certification exam.",
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
          title: "Module 1: The Foundation (HTML & CSS)",
          description: "Learn the building blocks of the web.",
          lessons: [
            {
              title: "HTML5 Semantic Structure",
              duration: 15,
              type: "video",
              content: "Understanding how to structure web pages correctly."
            },
            {
              title: "CSS3 Flexbox and Grid",
              duration: 20,
              type: "article",
              content: "Mastering modern layouts."
            },
            {
              title: "Quiz: Web Foundations",
              duration: 10,
              type: "quiz",
              isAssignment: true,
              assignmentDescription: "Test your knowledge on HTML and CSS basics.",
              assignmentQuestions: [
                {
                  questionText: "Which HTML tag is used for the largest heading?",
                  type: "mcq",
                  options: ["<h6>", "<head>", "<h1>", "<header>"],
                  correctOptionIndex: 2,
                  explanation: "<h1> is the standard tag for the most important heading on a page.",
                  points: 10
                },
                {
                  questionText: "What does CSS stand for?",
                  type: "mcq",
                  options: ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
                  correctOptionIndex: 1,
                  explanation: "CSS stands for Cascading Style Sheets.",
                  points: 10
                }
              ]
            }
          ]
        },
        {
          title: "Module 2: JavaScript Essentials",
          description: "Bringing logic to your web pages.",
          lessons: [
            {
              title: "ES6+ Features",
              duration: 25,
              type: "video",
              content: "Arrow functions, destructuring, and more."
            },
            {
              title: "Asynchronous JavaScript",
              duration: 30,
              type: "article",
              content: "Promises and Async/Await explained."
            },
            {
              title: "Quiz: JavaScript Logic",
              duration: 15,
              type: "quiz",
              isAssignment: true,
              assignmentDescription: "Challenge yourself with JS logic questions.",
              assignmentQuestions: [
                {
                  questionText: "What will 'typeof []' return in JavaScript?",
                  type: "mcq",
                  options: ["array", "object", "null", "undefined"],
                  correctOptionIndex: 1,
                  explanation: "In JavaScript, arrays are a specialized type of object.",
                  points: 10
                }
              ]
            }
          ]
        },
        {
          title: "Module 3: React Fundamentals",
          description: "Building modern UIs with React.",
          lessons: [
            {
              title: "Hooks: useState & useEffect",
              duration: 30,
              type: "video",
              content: "Managing state and side effects."
            },
            {
              title: "Component Architecture",
              duration: 20,
              type: "article",
              content: "Props, components, and reusability."
            }
          ]
        },
        {
          title: "Module 4: Backend with Node.js",
          description: "Creating servers and APIs.",
          lessons: [
            {
              title: "Express.js Routing",
              duration: 25,
              type: "video",
              content: "How to handle requests and responses."
            },
            {
              title: "MongoDB & Mongoose",
              duration: 30,
              type: "article",
              content: "Interacting with databases."
            }
          ]
        },
        {
          title: "Module 5: Final Certification",
          description: "The ultimate test of your skills.",
          lessons: [
            {
              title: "Final Exam: Full-Stack Proficiency",
              duration: 60,
              type: "assignment",
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: "A comprehensive exam covering HTML, CSS, JS, React, and Node.js. Passing score is 80%.",
              assignmentConfig: {
                timeLimit: 45,
                allowRetakes: false,
                disableRightClick: true,
                mode: "exam"
              },
              assignmentQuestions: [
                {
                  questionText: "Explain the Virtual DOM in React.",
                  type: "open",
                  explanation: "The Virtual DOM is a lightweight copy of the real DOM that React uses to optimize updates.",
                  points: 20
                },
                {
                  questionText: "Which HTTP method is typically used to create a new resource?",
                  type: "mcq",
                  options: ["GET", "POST", "PUT", "DELETE"],
                  correctOptionIndex: 1,
                  explanation: "POST is the standard method for creating new resources in REST APIs.",
                  points: 10
                },
                {
                  questionText: "Describe the purpose of Middleware in Express.",
                  type: "open",
                  explanation: "Middleware functions have access to the request and response objects and can execute code, modify them, or end the request-response cycle.",
                  points: 20
                }
              ]
            }
          ]
        }
      ]
    };

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

    console.log('🚀 Seeding complex free course...');
    const existingFreeCourse = await Course.findOne({ title: complexFreeCourse.title });
    if (existingFreeCourse) {
      console.log(`⏩ Skipping existing: ${complexFreeCourse.title}`);
    } else {
      const freeCourse = await new Course(complexFreeCourse).save();
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
