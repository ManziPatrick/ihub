import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { Question } from './models/Question';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedFrenchCourses = async () => {
  try {
    await connectDB();

    console.log('📚 Seeding French courses...');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please run npm run seed first.');
      process.exit(1);
    }

    const frenchLevel1Modules = [
      {
        title: "Module 1: Salutations et Présentations",
        description: "Apprenez à dire bonjour, au revoir et à vous présenter.",
        lessons: [
          {
            title: "Salutations de base",
            content: "<h1>Salutations</h1><p>Apprenez les différentes manières de saluer en français.</p>",
            duration: 15,
            type: "article"
          },
          {
            title: "Quiz: Maîtrise des salutations",
            content: "Testez vos connaissances sur les salutations.",
            duration: 10,
            type: "quiz"
          }
        ]
      },
      {
        title: "Module 2: Vocabulaire quotidien",
        description: "Noms communs pour la nourriture, les couleurs et les membres de la famille.",
        lessons: [
          {
            title: "Vocabulaire de base",
            content: "<h1>Mots de tous les jours</h1><p>Vocabulaire essentiel pour la vie quotidienne.</p>",
            duration: 20,
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=Pb9p1Y7o0X8"
          },
          {
            title: "Quiz: Défi vocabulaire",
            content: "Testez votre vocabulaire.",
            duration: 15,
            type: "quiz"
          }
        ]
      }
    ];

    const coursesToSeed = [
      {
        title: "French Level 1 (Beginner)",
        description: "Cours pour débutants complets apprenant le vocabulaire de base, les salutations et la grammaire.",
        thumbnail: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 0,
        level: "Beginner",
        category: "Languages",
        status: "published",
        modules: frenchLevel1Modules
      }
    ];

    const french1Questions = [
      // Mod 1
      [
        { questionText: "Comment dit-on 'Hello' en français?", options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"], correctOptionIndex: 0, explanation: "'Bonjour' est la salutation standard." },
        { questionText: "Comment dit-on 'Good night'?", options: ["Bonjour", "Bonne nuit", "Bonne journée", "Salut"], correctOptionIndex: 1, explanation: "'Bonne nuit' se dit avant de dormir." }
      ],
      // Mod 2
      [
        { questionText: "Quelle est la couleur du ciel?", options: ["Vert", "Rouge", "Bleu", "Jaune"], correctOptionIndex: 2, explanation: "Le ciel est bleu." },
        { questionText: "Comment dit-on 'Apple'?", options: ["Orange", "Pomme", "Banane", "Poire"], correctOptionIndex: 1, explanation: "'Pomme' est la traduction de 'Apple'." }
      ]
    ];

    const questionsMap = [french1Questions];

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

      const moduleQuestions = questionsMap[cIdx];
      
      for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const module = course.modules[mIdx];
        const quizLesson = module.lessons.find((l: any) => l.type === 'quiz');
        
        if (quizLesson && moduleQuestions[mIdx]) {
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

    console.log('🏁 French courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFrenchCourses();
