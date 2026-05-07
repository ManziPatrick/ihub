import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedKidsCourses = async () => {
  try {
    console.log('📡 Connecting to Database...');
    await connectDB();
    console.log('✅ Connected.');

    // Ensure we have an instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin'] } });
    if (!instructor) {
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

    const kidsCourses = [
      {
        title: "English Foundation",
        description: "Teach children reading, phonics, vocabulary, grammar, and listening through interactive games and animations.",
        thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Languages",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online"],
        modules: [
          {
            title: "MODULE 1: Alphabet & Phonics",
            description: "Letter recognition and basic sounds.",
            lessons: [
              {
                title: "Lesson 1: Alphabet A–Z",
                type: "video",
                content: "Learn the alphabet from A to Z with our fun song!",
                videoUrl: "https://www.youtube.com/watch?v=75p-N9YKqNo",
                videoTitle: "The Alphabet Song",
                videoThumbnail: "https://img.youtube.com/vi/75p-N9YKqNo/0.jpg",
                duration: 3,
                animationType: "2D Animation",
                ageCategory: "Children under 10"
              },
              {
                title: "Lesson 2: Letter Sounds",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=ffeZXPtTGC4",
                videoTitle: "Phonics Sounds for Kids",
                duration: 4,
                animationType: "Cartoon",
                ageCategory: "Children under 10"
              },
              {
                title: "Lesson 3: Vowels and Consonants",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=arQxkdRYY_U",
                videoTitle: "The Vowel Song",
                duration: 3,
                animationType: "Motion Graphics"
              },
              {
                title: "MODULE QUIZ: Phonics Check",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "Which letter comes after 'B'?",
                    type: "mcq",
                    options: ["A", "C", "D", "E"],
                    correctOptionIndex: 1,
                    points: 10
                  },
                  {
                    questionText: "Match the sound 'Ah' to the letter.",
                    type: "mcq",
                    options: ["A", "B", "Z", "M"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "MODULE 2: Grammar Basics",
            lessons: [
              {
                title: "Nouns: Naming Things",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=8mS5Ssh536w",
                videoTitle: "Nouns for Kids",
                duration: 3
              },
              {
                title: "Verbs: Action Words",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=ineCCpqpJrM",
                videoTitle: "Action Verbs",
                duration: 4
              }
            ]
          },
          {
            title: "FINAL EXAM: English Foundation",
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentConfig: { mode: "exam", timeLimit: 45 },
            assignmentQuestions: Array(30).fill(null).map((_, i) => ({
              questionText: `English Proficiency Question ${i + 1}: Select the correct word.`,
              type: "mcq",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctOptionIndex: 0,
              points: 3.33
            }))
          }
        ]
      },
      {
        title: "Mathematics Foundation",
        description: "Teach children basic mathematics using games, animations, and simple patterns.",
        thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd48a542f?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Mathematics",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "MODULE 1: Numbers & Counting",
            lessons: [
              {
                title: "Counting 1–10",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=D0Ajq682yrA",
                videoTitle: "Counting 1 to 10",
                duration: 2,
                animationType: "2D Animation"
              }
            ]
          },
          {
            title: "MODULE 2: Addition & Subtraction",
            lessons: [
              {
                title: "Simple Addition",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=uK7YmBOC92A",
                videoTitle: "Addition for Kids",
                duration: 4
              }
            ]
          }
        ]
      },
      {
        title: "Science Explorers",
        description: "Explore animals, space, and materials through fun cartoon science lessons.",
        thumbnail: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Science",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "MODULE 1: Living Things",
            lessons: [
              {
                title: "All About Animals",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=wCfWmlnJl-A",
                videoTitle: "Animal Kingdom for Kids",
                duration: 4
              }
            ]
          }
        ]
      },
      {
        title: "Digital & Creative Skills",
        description: "Beginner computer skills, internet safety, and creative coding logic.",
        thumbnail: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Technology",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "MODULE 1: Computer Basics",
            lessons: [
              {
                title: "Parts of a Computer",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=Akfi90lS60k",
                videoTitle: "Computer Basics for Kids",
                duration: 3
              }
            ]
          }
        ]
      },
      {
        title: "Emotional Wellness & Stress Management",
        description: "Teach children emotional awareness, confidence, and kindness in a safe, simple way.",
        thumbnail: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Health & Wellness",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "MODULE 1: Understanding Feelings",
            lessons: [
              {
                title: "Happy, Sad, Angry, Excited",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=ZxfJicfyCdg",
                videoTitle: "The Feelings Song",
                duration: 3
              }
            ]
          }
        ]
      },
      {
        title: "Young Business & Money Literacy",
        description: "Simple business, saving, and money concepts for young entrepreneurs.",
        thumbnail: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Business",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "MODULE 1: Understanding Money",
            lessons: [
              {
                title: "What Is Money?",
                type: "video",
                videoUrl: "https://www.youtube.com/watch?v=0M8vWf2mSrs",
                videoTitle: "Money Basics for Kids",
                duration: 4
              }
            ]
          }
        ]
      }
    ];

    console.log('🚀 Seeding 6 new kids courses...');
    for (const courseData of kidsCourses) {
      const existing = await Course.findOne({ title: courseData.title });
      if (existing) {
        console.log(`⏩ Skipping existing: ${courseData.title}`);
        continue;
      }
      await new Course(courseData).save();
      console.log(`✅ Seeded: ${courseData.title}`);
    }

    console.log('\n✨ Kids courses seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedKidsCourses();
