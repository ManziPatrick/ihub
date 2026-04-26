import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedAdditionalCourses = async () => {
  try {
    await connectDB();

    console.log('📚 Seeding additional courses...');

    // Find an instructor (Admin)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    const coursesToSeed = [
      {
        title: "Advanced Data Science & Machine Learning 🚀",
        description: "Master the algorithms and tools used by top data scientists. Learn Python, Pandas, Scikit-Learn, and Neural Networks.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        modules: [
          {
            title: "Module 1: Data Preprocessing",
            description: "Learn how to clean and prepare your data for machine learning models.",
            lessons: [
              {
                title: "Handling Missing Data",
                content: "<h1>Data Cleaning</h1><p>Real world data is messy. Learn how to impute missing values using mean, median, and advanced techniques.</p>",
                duration: 25,
                type: "article"
              },
              {
                title: "Quiz: Data Prep Challenge 🧠",
                content: "Test your data preprocessing skills.",
                duration: 15,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Mastering UI/UX Design with Figma 🎨",
        description: "Learn how to design beautiful, user-centric interfaces. Go from wireframes to high-fidelity interactive prototypes.",
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Beginner",
        category: "Design",
        status: "published",
        modules: [
          {
            title: "Module 1: Design Fundamentals",
            description: "Understand color theory, typography, and spacing.",
            lessons: [
              {
                title: "Color Psychology",
                content: "<h1>Choosing the Right Colors</h1><p>Colors evoke emotions. Learn how to pick palettes that align with your brand identity.</p>",
                duration: 20,
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=12345"
              },
              {
                title: "Quiz: Design Basics 🎯",
                content: "Test your eye for design.",
                duration: 10,
                type: "quiz"
              }
            ]
          }
        ]
      },
      {
        title: "Digital Marketing & SEO Strategy 📈",
        description: "Grow your business online. Master Search Engine Optimization, content marketing, and paid advertising.",
        thumbnail: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Intermediate",
        category: "Marketing",
        status: "published",
        modules: [
          {
            title: "Module 1: SEO Foundations",
            description: "How to rank on the first page of Google.",
            lessons: [
              {
                title: "Keyword Research",
                content: "<h1>Finding What Users Search For</h1><p>Learn how to use tools like Ahrefs and SEMrush to find high-volume, low-competition keywords.</p>",
                duration: 30,
                type: "article"
              },
              {
                title: "Quiz: SEO Mastery 🔍",
                content: "Prove your SEO knowledge.",
                duration: 15,
                type: "quiz"
              }
            ]
          }
        ]
      }
    ];

    for (const courseData of coursesToSeed) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      let course;
      if (existingCourse) {
        Object.assign(existingCourse, courseData);
        course = await existingCourse.save();
      } else {
        course = await new Course(courseData).save();
      }
      console.log(`✅ Seeded course: ${course.title}`);

      // Add Questions for the single quiz in Module 1
      const quizLesson = course.modules[0].lessons.find((l: any) => l.type === 'quiz');
      if (quizLesson) {
        const quizId = (quizLesson as any)._id;
        let questions: any[] = [];

        if (course.category === 'Data Science') {
          questions = [
            {
              courseId: course._id,
              lessonId: quizId.toString(),
              questionText: "What is the best way to handle a small amount of missing data in a large dataset?",
              options: ["Drop the rows", "Replace with 0", "Duplicate the data", "Delete the column"],
              correctOptionIndex: 0,
              explanation: "If the dataset is large and missing values are very few, dropping the rows is usually the safest approach."
            }
          ];
        } else if (course.category === 'Design') {
          questions = [
            {
              courseId: course._id,
              lessonId: quizId.toString(),
              questionText: "Which color is traditionally associated with trust and security?",
              options: ["Red", "Yellow", "Blue", "Green"],
              correctOptionIndex: 2,
              explanation: "**Blue** is widely used by banks and tech companies because it evokes a sense of trust and reliability."
            }
          ];
        } else if (course.category === 'Marketing') {
          questions = [
            {
              courseId: course._id,
              lessonId: quizId.toString(),
              questionText: "What does SEO stand for?",
              options: ["Search Engine Optimization", "Social Engagement Operations", "Site Enhancement Order", "Strategic Email Outreach"],
              correctOptionIndex: 0,
              explanation: "**Search Engine Optimization** is the practice of increasing organic traffic from search engines."
            }
          ];
        }

        if (questions.length > 0) {
          await Question.deleteMany({ lessonId: quizId.toString() });
          await Question.insertMany(questions);
          console.log(`   Added questions for ${course.title}`);
        }
      }
    }

    console.log('🏁 Additional courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAdditionalCourses();
