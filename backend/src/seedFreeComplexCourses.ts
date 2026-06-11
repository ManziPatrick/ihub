import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedFreeComplexCourses = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to database - Starting free courses with quizzes seeding...');

    // Find a trainer or admin to be the instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin'] } });
    
    if (!instructor) {
      console.log('No trainer/admin found. Creating a default trainer...');
      instructor = await new User({
        fullName: 'Dr. Sarah Wilson',
        username: 'sarah.wilson',
        email: 'sarah.wilson@bootskills.com',
        password: 'Password@123',
        role: 'trainer',
        status: 'active',
        academicStatus: 'active'
      }).save();
    }

    const freeCourses = [
      {
        title: "Introduction to Artificial Intelligence (Free)",
        description: "A foundational course covering the history, core concepts, and future of AI. Perfect for anyone looking to understand the AI revolution.",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "AI & Technology",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct",
        modules: [
          {
            title: "Module 1: What is AI?",
            description: "Understanding the basics and history of AI.",
            lessons: [
              {
                title: "Welcome to AI Fundamentals",
                duration: 5,
                type: "video",
                content: "Introduction to the course and roadmap."
              },
              {
                title: "Quiz: AI History & Concepts",
                duration: 15,
                type: "quiz",
                isAssignment: true,
                requiredAssignment: true,
                assignmentDescription: "Test your knowledge on the history and core definitions of Artificial Intelligence.",
                assignmentConfig: {
                  timeLimit: 10,
                  allowRetakes: true,
                  mode: "exercise"
                },
                assignmentQuestions: [
                  {
                    questionText: "Who is often called the 'Father of Artificial Intelligence'?",
                    type: "mcq",
                    options: ["Alan Turing", "John McCarthy", "Elon Musk", "Steve Jobs"],
                    correctOptionIndex: 1,
                    explanation: "John McCarthy coined the term 'Artificial Intelligence' in 1955 and organized the famous Dartmouth Conference.",
                    points: 10
                  },
                  {
                    questionText: "Which of the following is an example of Narrow AI?",
                    type: "mcq",
                    options: ["Human-like consciousness", "Spam filters", "A robot that can do anything", "Self-aware software"],
                    correctOptionIndex: 1,
                    explanation: "Narrow AI (or Weak AI) is designed to perform a specific task, like filtering spam emails or playing chess.",
                    points: 10
                  },
                  {
                    questionText: "What does 'Machine Learning' primarily rely on?",
                    type: "mcq",
                    options: ["Fixed rules", "Large amounts of data", "Manual programming", "Magic"],
                    correctOptionIndex: 1,
                    explanation: "Machine Learning is a subset of AI that focuses on building systems that learn from and make decisions based on data.",
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Practical AI Tools",
            description: "Exploring modern AI applications.",
            lessons: [
              {
                title: "Generative AI Explained",
                duration: 20,
                type: "video",
                content: "How LLMs like ChatGPT and Claude work."
              },
              {
                title: "Final Exam: AI Readiness",
                duration: 45,
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentDescription: "Comprehensive exam covering the entire course material. You must score at least 70% to pass.",
                assignmentConfig: {
                  timeLimit: 30,
                  allowRetakes: false,
                  disableRightClick: true,
                  mode: "exam"
                },
                assignmentQuestions: [
                  {
                    questionText: "Define 'Deep Learning' in your own words.",
                    type: "open",
                    explanation: "Deep Learning is a subset of machine learning based on artificial neural networks with multiple layers (hence 'deep').",
                    points: 20
                  },
                  {
                    questionText: "Which neural network architecture is the foundation for modern LLMs?",
                    type: "mcq",
                    options: ["CNN", "RNN", "Transformer", "GAN"],
                    correctOptionIndex: 2,
                    explanation: "The Transformer architecture, introduced in the 'Attention Is All You Need' paper, is the core of modern Large Language Models.",
                    points: 10
                  },
                  {
                    questionText: "Name three ethical concerns in AI development.",
                    type: "open",
                    explanation: "Common concerns include bias in data, job displacement, privacy, and the lack of transparency (black box problem).",
                    points: 20
                  },
                  {
                    questionText: "Is AI currently capable of true human-level general intelligence (AGI)?",
                    type: "mcq",
                    options: ["Yes", "No", "Only in the labs", "Since 1995"],
                    correctOptionIndex: 1,
                    explanation: "Current AI is still classified as Narrow AI. Artificial General Intelligence (AGI) remains a future goal and a topic of intense research.",
                    points: 10
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Digital Citizenship & Online Safety",
        description: "Learn how to protect your privacy, recognize scams, and behave responsibly in the digital world.",
        thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Digital Literacy",
        status: "published",
        school: "Greenhill Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct",
        modules: [
          {
            title: "Module 1: Privacy and Security",
            lessons: [
              {
                title: "Creating Strong Passwords",
                duration: 10,
                type: "article",
                content: "Best practices for password management."
              },
              {
                title: "Checkpoint: Password Security",
                duration: 10,
                type: "quiz",
                isAssignment: true,
                assignmentDescription: "Quick quiz on security basics.",
                assignmentQuestions: [
                  {
                    questionText: "Which of these is a strong password?",
                    type: "mcq",
                    options: ["password123", "123456", "Tr0ub4dor&3", "myname"],
                    correctOptionIndex: 2,
                    explanation: "A strong password should be long, use a mix of characters, and not be easily guessable (like common words or sequences).",
                    points: 10
                  },
                  {
                    questionText: "What does 2FA stand for?",
                    type: "mcq",
                    options: ["Two File Access", "Two Factor Authentication", "To Fast Action", "Total File Archiving"],
                    correctOptionIndex: 1,
                    explanation: "Two-Factor Authentication adds an extra layer of security by requiring two different forms of identification.",
                    points: 10
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    for (const courseData of freeCourses) {
      const course = await new Course(courseData).save();
      console.log(`✅ Seeded Free Course: ${course.title} with ${course.modules.length} modules`);
    }

    console.log('\n🏁 Free courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFreeComplexCourses();
