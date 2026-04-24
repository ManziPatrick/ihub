import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { Badge } from './models/Badge';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedReactCourse = async () => {
  try {
    await connectDB();

    console.log('⚛️ Seeding Professional React Course...');

    // Find an instructor (Admin)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    // 1. Course Definition
    const reactCourse = {
      title: "Mastering React: From Zero to Hero ⚛️",
      description: "A comprehensive journey through modern React development. Build real-world applications with Hooks, Context API, and state management.",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800",
      instructor: admin._id,
      price: 49.99,
      level: "Intermediate",
      category: "Software Development",
      status: "published",
      modules: [
        {
          title: "Module 1: React Foundations",
          description: "Learn the core concepts of React, JSX, and components.",
          lessons: [
            {
              title: "What is React?",
              content: "<h1>The Modern UI Library</h1><p>React is a declarative, efficient, and flexible JavaScript library for building user interfaces. Developed by Facebook, it has become the standard for modern web development.</p>",
              duration: 15,
              type: "article"
            },
            {
              title: "JSX and Rendering",
              content: "<h1>JSX Explained</h1><p>JSX stands for JavaScript XML. It allows us to write HTML-like code inside our JavaScript files, which React then converts into real DOM elements.</p>",
              duration: 20,
              type: "video",
              videoUrl: "https://www.youtube.com/watch?v=7fPXI_MnBOY"
            },
            {
              title: "Quiz: Foundations Mastery 🧠",
              content: "Test your understanding of React basics.",
              duration: 10,
              type: "quiz"
            }
          ]
        },
        {
          title: "Module 2: State and Props",
          description: "Master data flow in React applications.",
          lessons: [
            {
              title: "Props: Passing Data",
              content: "<h1>Component Communication</h1><p>Props are like arguments passed to a function. They allow components to receive data from their parents.</p>",
              duration: 20,
              type: "article"
            },
            {
              title: "State: Local Memory",
              content: "<h1>Managing Change</h1><p>State is how React components remember things. When state changes, React automatically updates the UI.</p>",
              duration: 25,
              type: "video",
              videoUrl: "https://www.youtube.com/watch?v=4ORZ1GmbfJ4"
            },
            {
              title: "Quiz: Data Flow Challenge 🎯",
              content: "Prove your mastery of state and props.",
              duration: 10,
              type: "quiz"
            }
          ]
        }
      ]
    };

    const existingCourse = await Course.findOne({ title: reactCourse.title });
    let course;
    if (existingCourse) {
      Object.assign(existingCourse, reactCourse);
      course = await existingCourse.save();
    } else {
      course = await new Course(reactCourse).save();
    }
    console.log(`✅ Seeded course: ${course.title}`);

    // 2. Add Questions for Module 1 Quiz
    const quiz1 = course.modules[0].lessons.find((l: any) => l.title.includes("Foundations Mastery"));
    if (quiz1) {
      const q1Id = (quiz1 as any)._id;
      const questions1 = [
        {
          courseId: course._id,
          lessonId: q1Id.toString(),
          questionText: "What is the primary purpose of React?",
          options: ["Database Management", "Building User Interfaces", "Styling Websites", "Sending Emails"],
          correctOptionIndex: 1,
          explanation: "React is specifically designed as a library for building fast and interactive **User Interfaces**."
        },
        {
          courseId: course._id,
          lessonId: q1Id.toString(),
          questionText: "What does JSX stand for?",
          options: ["Java Syntax Extension", "JavaScript XML", "JSON XML", "Just Simple Xylophone"],
          correctOptionIndex: 1,
          explanation: "**JSX** is a syntax extension for JavaScript that looks like HTML but works inside JS files."
        }
      ];
      await Question.deleteMany({ lessonId: q1Id.toString() });
      await Question.insertMany(questions1);
    }

    // 3. Add Questions for Module 2 Quiz
    const quiz2 = course.modules[1].lessons.find((l: any) => l.title.includes("Data Flow Challenge"));
    if (quiz2) {
      const q2Id = (quiz2 as any)._id;
      const questions2 = [
        {
          courseId: course._id,
          lessonId: q2Id.toString(),
          questionText: "How do you pass data from a parent component to a child?",
          options: ["Using State", "Using Props", "Using LocalStorage", "Using CSS"],
          correctOptionIndex: 1,
          explanation: "**Props** (short for properties) are used to pass data down the component tree."
        },
        {
          courseId: course._id,
          lessonId: q2Id.toString(),
          questionText: "What hook is used to manage state in a functional component?",
          options: ["useEffect", "useMemo", "useState", "useRef"],
          correctOptionIndex: 2,
          explanation: "The **useState** hook is the primary way to add local memory to functional components."
        }
      ];
      await Question.deleteMany({ lessonId: q2Id.toString() });
      await Question.insertMany(questions2);
    }

    console.log('🏁 React Course seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedReactCourse();
