import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedEnglishSpecial = async () => {
  try {
    await connectDB();

    console.log('📚 Seeding English for Special Purposes courses...');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    const itEnglishModules = [
      {
        title: "Module 1: IT Vocabulary and Concepts",
        description: "Learn essential terminology used in the tech industry.",
        lessons: [
          { title: "Hardware Basics", content: "<h1>Hardware</h1><p>Learn about motherboards, CPUs, and peripherals.</p>", duration: 20, type: "article" },
          { title: "Software & Development", content: "<h1>Software</h1><p>Agile, Scrum, and programming languages.</p>", duration: 25, type: "video", videoUrl: "https://www.youtube.com/watch?v=F_S1J1V4I4I" },
          { title: "Quiz: Tech Terms", content: "Test your IT vocabulary.", duration: 15, type: "quiz" }
        ]
      },
      {
        title: "Module 2: Technical Support and Troubleshooting",
        description: "How to communicate technical issues clearly.",
        lessons: [
          { title: "Help Desk Communication", content: "<h1>Help Desk</h1><p>Phrases for diagnosing and solving problems.</p>", duration: 30, type: "article" },
          { title: "Quiz: Troubleshooting Scenarios", content: "Solve technical issues through communication.", duration: 15, type: "quiz" }
        ]
      },
      {
        title: "Module 3: Final Certification",
        description: "Comprehensive exam covering all IT English concepts.",
        lessons: [
          {
            title: "Final IT English Exam",
            content: "You have 60 minutes to complete this final exam.",
            duration: 60,
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: "Please answer all questions. This exam requires a minimum of 70% to pass.",
            assignmentConfig: { timeLimit: 60, allowRetakes: false, disableRightClick: true, mode: "exam" },
            assignmentQuestions: [
              { questionText: "What does CPU stand for?", type: "mcq", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Processor Unit"], correctOptionIndex: 1, points: 20 },
              { questionText: "What does 'Agile' mean in software development?", type: "open", points: 40 },
              { questionText: "Describe how you would ask a user to restart their computer.", type: "open", points: 40 }
            ]
          }
        ]
      }
    ];

    const businessEnglishModules = [
      {
        title: "Module 1: Business Communication",
        description: "Master emails, memos, and formal letters.",
        lessons: [
          { title: "Writing Professional Emails", content: "<h1>Business Emails</h1><p>Tone, structure, and clarity.</p>", duration: 25, type: "article" },
          { title: "Quiz: Email Etiquette", content: "Test your email writing knowledge.", duration: 15, type: "quiz" },
          { 
            title: "Assignment: Draft a Client Email", 
            content: "Draft an email to a client.", 
            duration: 45, 
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: "Draft a formal email apologizing for a delayed shipment.",
            assignmentDeliverables: ["PDF or Text Document with the email draft"]
          }
        ]
      },
      {
        title: "Module 2: Meetings and Negotiations",
        description: "Language for participating in meetings.",
        lessons: [
          { title: "Meeting Vocabulary", content: "<h1>Meetings</h1><p>Agendas, minutes, and chairing.</p>", duration: 20, type: "video" },
          { title: "Quiz: Meeting Phrases", content: "Test your meeting vocabulary.", duration: 10, type: "quiz" }
        ]
      },
      {
        title: "Module 3: Final Assessment",
        description: "Final exam on Business English.",
        lessons: [
          {
            title: "Final Business English Exam",
            content: "You have 45 minutes to complete this exam.",
            duration: 45,
            type: "assignment",
            isAssignment: true,
            requiredAssignment: true,
            assignmentDescription: "Final comprehensive exam.",
            assignmentConfig: { timeLimit: 45, allowRetakes: true, disableRightClick: true, mode: "exam" },
            assignmentQuestions: [
              { questionText: "What does 'B2B' mean?", type: "mcq", options: ["Business to Bank", "Business to Business", "Back to Business", "Board to Board"], correctOptionIndex: 1, points: 30 },
              { questionText: "Provide three phrases to politely interrupt someone in a meeting.", type: "open", points: 35 },
              { questionText: "Write a short paragraph summarizing a meeting.", type: "open", points: 35 }
            ]
          }
        ]
      }
    ];

    const coursesToSeed = [
      {
        title: "English for IT Professionals",
        description: "Specialized course for IT workers needing to communicate technical concepts in English.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Advanced",
        category: "Languages",
        status: "published",
        modules: itEnglishModules
      },
      {
        title: "Business English Masterclass",
        description: "Learn to communicate effectively in a corporate environment.",
        thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Intermediate",
        category: "Languages",
        status: "published",
        modules: businessEnglishModules
      }
    ];

    const itQuestions = [
      // Mod 1
      [
        { questionText: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Run All Memory", "Read All Memory"], correctOptionIndex: 0, explanation: "RAM is Random Access Memory." },
        { questionText: "Which is an operating system?", options: ["Microsoft Word", "Linux", "Python", "Google Chrome"], correctOptionIndex: 1, explanation: "Linux is an OS." }
      ],
      // Mod 2
      [
        { questionText: "If a user forgets their password, you should:", options: ["Tell them to buy a new PC", "Reset it for them", "Ignore them", "Laugh at them"], correctOptionIndex: 1, explanation: "Standard procedure is to reset the password." },
        { questionText: "A 'bug' refers to:", options: ["An insect on the screen", "A feature", "An error in the software", "A virus"], correctOptionIndex: 2, explanation: "A bug is a software error." }
      ],
      // Mod 3 (Exam, handled in assignmentQuestions, so no quiz questions needed here, but we pass empty array)
      []
    ];

    const businessQuestions = [
      // Mod 1
      [
        { questionText: "What does 'CC' stand for in an email?", options: ["Carbon Copy", "Correct Copy", "Computer Copy", "Catch Copy"], correctOptionIndex: 0, explanation: "Carbon Copy." },
        { questionText: "Which is a formal sign-off?", options: ["See ya", "Best regards", "Cheers", "Later"], correctOptionIndex: 1, explanation: "Best regards is formal." }
      ],
      // Mod 2
      [
        { questionText: "What is an 'Agenda'?", options: ["A calendar", "A list of topics to be discussed in a meeting", "A type of coffee", "A desk"], correctOptionIndex: 1, explanation: "Agenda is the meeting plan." },
        { questionText: "What are meeting 'Minutes'?", options: ["Time spent", "Written record of what was discussed", "Small items", "A type of clock"], correctOptionIndex: 1, explanation: "Minutes are the written record." }
      ],
      // Mod 3 (Exam)
      []
    ];

    const questionsMap = [itQuestions, businessQuestions];

    for (let cIdx = 0; cIdx < coursesToSeed.length; cIdx++) {
      const courseData = coursesToSeed[cIdx];
      const existingCourse = await Course.findOne({ title: courseData.title });
      let course;
      if (existingCourse) {
        Object.assign(existingCourse, courseData);
        course = await existingCourse.save();
      } else {
        course = await new Course(courseData).save();
      }
      console.log(`✅ Seeded course: ${course.title}`);

      // Add Questions for the quizzes in each module
      const moduleQuestions = questionsMap[cIdx];
      
      for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const module = course.modules[mIdx];
        const quizLesson = module.lessons.find((l: any) => l.type === 'quiz');
        
        if (quizLesson && moduleQuestions[mIdx] && moduleQuestions[mIdx].length > 0) {
          const quizId = (quizLesson as any)._id;
          
          const questions = moduleQuestions[mIdx].map(q => ({
            ...q,
            courseId: course._id,
            lessonId: quizId.toString()
          }));

          await Question.deleteMany({ lessonId: quizId.toString() });
          await Question.insertMany(questions);
          console.log(`   Added ${questions.length} questions for Module ${mIdx + 1} Quiz`);
        }
      }
    }

    console.log('🏁 English for Special Purposes seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedEnglishSpecial();
