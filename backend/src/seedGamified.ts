import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { Badge } from './models/Badge';
import connectDB from './config/db';

dotenv.config();

const seedGamifiedData = async () => {
  try {
    await connectDB();

    console.log('🚀 Seeding Gamified Courses...');

    // Find an instructor (Admin)
    const { User } = require('./models/User');
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    // 1. Create Badges
    const badges = [
      {
        title: 'Star Starter',
        description: 'Completed your first gamified unit!',
        icon: '⭐',
        category: 'milestone'
      },
      {
        title: 'Quiz Whiz',
        description: 'Got 100% on a quiz!',
        icon: '🧠',
        category: 'Performance'
      },
      {
        title: 'Speed Demon',
        description: 'Finished a quiz in under 60 seconds!',
        icon: '⚡',
        category: 'Speed'
      },
      {
        title: 'Code Cadet',
        description: 'Completed the Intro to Robotics module.',
        icon: '🤖',
        category: 'Achievement'
      }
    ];

    await Badge.deleteMany({ title: { $in: badges.map(b => b.title) } });
    const savedBadges = await Badge.insertMany(badges);
    console.log(`✅ Seeded ${savedBadges.length} badges.`);

    // 2. Create a Kid-Friendly Course
    const kidsCourse = {
      title: "Robo-Code Adventure! 🤖",
      description: "Join Sparky the Robot on a mission to save Byte City! Learn coding basics through fun challenges and stories.",
      thumbnail: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&q=80&w=800",
      instructor: admin._id,
      price: 0,
      level: "Beginner",
      category: "Kids Coding",
      status: "published",
      modules: [
        {
          title: "Chapter 1: The Glitch in Byte City 🏙️",
          description: "Help Sparky find the source of the mysterious glitch!",
          lessons: [
            {
              title: "Sparky's First Step",
              content: "<h1>Welcome Hero!</h1><p>Sparky needs to move forward. In coding, we call this a <b>Command</b>! Commands tell computers (and robots) exactly what to do.</p>",
              duration: 10,
              type: "article"
            },
            {
              title: "The Logic Bridge 🌉",
              content: "<h1>Bridge Challenge!</h1><p>To cross the logic bridge, Sparky needs to make a decision. This is called an <b>If-Statement</b>. If the light is green, Sparky goes!</p>",
              duration: 15,
              type: "video",
              videoUrl: "https://www.youtube.com/watch?v=cKhVupvyhKk"
            },
            {
              title: "Mission Check: The Basics 🎯",
              content: "Check your knowledge to help Sparky move to the next area!",
              duration: 5,
              type: "quiz"
            }
          ]
        }
      ]
    };

    const existingCourse = await Course.findOne({ title: kidsCourse.title });
    let course;
    if (existingCourse) {
      Object.assign(existingCourse, kidsCourse);
      course = await existingCourse.save();
    } else {
      course = await new Course(kidsCourse).save();
    }
    console.log(`✅ Seeded course: ${course.title}`);

    // 3. Add Quiz Questions for the "Mission Check" lesson
    const missionCheckLesson = course.modules[0].lessons.find((l: any) => l.title === "Mission Check: The Basics 🎯");
    if (missionCheckLesson) {
      const lessonId = (missionCheckLesson as any)._id;
      const questions = [
        {
          courseId: course._id,
          lessonId: lessonId.toString(),
          questionText: "Sparky wants to follow instructions. What do we call a set of instructions for a robot?",
          options: ["A Secret Message", "A Code / Program", "A Shopping List", "A Magic Spell"],
          correctOptionIndex: 1,
          explanation: "In Byte City, we use **Code** to tell Sparky exactly what to do! It's like a recipe for a robot."
        },
        {
          courseId: course._id,
          lessonId: lessonId.toString(),
          questionText: "If the traffic light is RED, what should Sparky's code say?",
          options: ["Go fast!", "Spin around", "Wait / Stop", "Dance"],
          correctOptionIndex: 2,
          explanation: "Good safety thinking! Sparky uses **Logic** to know that RED means STOP."
        },
        {
          courseId: course._id,
          lessonId: lessonId.toString(),
          questionText: "Sparky needs to repeat a dance move 5 times. What coding block should he use?",
          options: ["A Loop", "A Mirror", "A Heavy Box", "A Telephone"],
          correctOptionIndex: 0,
          explanation: "A **Loop** is like a music remix—it plays the same part over and over again!"
        }
      ];

      await Question.deleteMany({ lessonId: lessonId.toString() });
      await Question.insertMany(questions);
      console.log(`✅ Seeded ${questions.length} questions for the quiz.`);
    }

    console.log('🏁 Gamified seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedGamifiedData();
