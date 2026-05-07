import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

const examCourses = [
  {
    title: "National Qualification: Software Level 5 (Exam)",
    description: "A comprehensive certification exam for Level 5 Software Engineering. Requires high-stakes proctoring.",
    price: 1000,
    category: "Certification",
    level: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1496065187959-7f07b8353c55",
    modules: [
      {
        title: "Final Assessment",
        description: "This module contains the final certification exam.",
        lessons: [
          {
            title: "Phase 1: Theoretical Exam",
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: "Answer 10 advanced technical questions within the time limit. No external resources allowed.",
            assignmentConfig: {
              timeLimit: 30,
              allowRetakes: false,
              disableRightClick: true,
              mode: "exam"
            },
            assignmentQuestions: [
              {
                questionText: "What is the primary difference between a process and a thread?",
                type: "mcq",
                options: [
                  "Threads share the same memory space, processes do not",
                  "Processes share the same memory space, threads do not",
                  "Threads are faster than processes",
                  "Processes are managed by the kernel, threads are not"
                ],
                correctOptionIndex: 0,
                explanation: "Processes have independent memory spaces, while threads of the same process share memory.",
                points: 20
              },
              {
                questionText: "Explain the concept of 'Eventual Consistency' in distributed systems.",
                type: "open",
                explanation: "Eventual consistency is a consistency model used in distributed computing to achieve high availability.",
                points: 30
              }
            ]
          }
        ]
      }
    ]
  },
  {
    title: "Basic Mathematics Certification",
    description: "Introductory math exam for vocational students.",
    price: 500,
    category: "Academics",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904",
    modules: [
      {
        title: "Module 1: Algebra",
        lessons: [
          {
            title: "Algebra Quiz",
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: "A timed quiz on basic algebraic expressions.",
            assignmentConfig: {
              timeLimit: 15,
              allowRetakes: true,
              disableRightClick: false,
              mode: "exercise"
            },
            assignmentQuestions: [
              {
                questionText: "Solve for x: 2x + 5 = 15",
                type: "mcq",
                options: ["x = 5", "x = 10", "x = 7.5", "x = 2"],
                correctOptionIndex: 0,
                explanation: "2x = 10 => x = 5",
                points: 10
              }
            ]
          }
        ]
      }
    ]
  }
];

const seedExams = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    const admin = await User.findOne({ role: 'super_admin' });
    const instructorId = admin ? admin._id : new mongoose.Types.ObjectId();

    for (const courseData of examCourses) {
      await Course.findOneAndUpdate(
        { title: courseData.title },
        {
          ...courseData,
          instructor: instructorId,
          school: 'Kigali Institute of Tech',
          status: 'published'
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded Exam Course: ${courseData.title}`);
    }

    console.log('🚀 Exam courses seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedExams();
