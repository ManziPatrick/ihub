import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import connectDB from './config/db';

dotenv.config();

async function verifyQuestionVariety() {
  try {
    await connectDB();
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 QUIZ QUESTION VARIETY VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    const coursesToCheck = [
      'Software Engineering Bootcamp',  // tech category
      'Digital Marketing Fundamentals', // marketing
      'Complete Public Speaking Mastery', // communication
    ];

    for (const title of coursesToCheck) {
      const course = await Course.findOne({ title });
      if (!course) {
        console.log(`❌ Course not found: "${title}"`);
        continue;
      }

      const modules = (course as any).modules || [];
      const allQuestions: string[] = [];
      let dupCount = 0;
      let totalQuizCount = 0;

      for (let m = 0; m < Math.min(20, modules.length); m++) {
        const mod = modules[m];
        const modLessons = mod.lessons || [];
        const quizLesson = modLessons.find((l: any) => l.type === 'quiz');
        
        if (quizLesson) {
          const questions = quizLesson.quizQuestions || [];
          totalQuizCount += questions.length;
          
          for (const q of questions) {
            if (allQuestions.includes(q.questionText)) {
              dupCount++;
            }
            allQuestions.push(q.questionText);
          }
        }
      }

      const uniqueCount = allQuestions.length;
      console.log(`${title}:`);
      console.log(`   Total quiz questions across 20 modules: ${totalQuizCount}`);
      console.log(`   Unique questions: ${uniqueCount}`);
      console.log(`   Duplicates: ${dupCount}`);
      console.log(`   Duplicate rate: ${((dupCount / totalQuizCount) * 100).toFixed(1)}%`);
      
      // Check if any repeats happen
      if (dupCount === 0) {
        console.log(`   ✅ NO DUPLICATES - All questions are unique across all modules!`);
      } else if (dupCount < totalQuizCount * 0.1) {
        console.log(`   ✅ LOW DUPLICATE RATE (< 10%)`);
      } else {
        console.log(`   ⚠️  High duplicate rate`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification error:', error);
    process.exit(1);
  }
}

verifyQuestionVariety();
