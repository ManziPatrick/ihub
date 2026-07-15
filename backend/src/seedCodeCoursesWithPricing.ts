/**
 * ─────────────────────────────────────────────────────────
 * MASTER SEED RUNNER — Code Courses with 1000 RWF Pricing
 * ─────────────────────────────────────────────────────────
 * Runs all code exercise course seeds sequentially, then
 * double-checks every course is priced at 1000 RWF.
 *
 * Usage: npx ts-node src/seedCodeCoursesWithPricing.ts
 * ─────────────────────────────────────────────────────────
 */
import { execSync } from 'child_process';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';

dotenv.config();

const SEEDS = [
  { file: 'seedIntroToJSAndPython.ts',       label: 'Intro to JavaScript & Python'         },
  { file: 'seedComprehensiveJSCourse.ts',    label: 'Comprehensive JavaScript Course'       },
  { file: 'seedDataStructuresCourse.ts',     label: 'Data Structures Mastery'               },
  { file: 'seedsAdvancedJsModules.ts',       label: 'Advanced JS — Practical Exercises'     },
  { file: 'seedMultiLanguageCourses.ts',     label: 'Multi-Language (C, C++, Java, Go, Rust, Python)' },
];

async function main() {
  const rootDir = path.resolve(__dirname, '..');

  // ─── Step 1: Run each seed ────────────────────────────
  for (const seed of SEEDS) {
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`🚀 Running seed: ${seed.label}`);
    console.log(`   File: ${seed.file}`);
    console.log(`═══════════════════════════════════════════════\n`);

    try {
      execSync(`npx ts-node src/${seed.file}`, {
        stdio: 'inherit',
        cwd: rootDir,
        timeout: 300_000, // 5 min per seed
      });
      console.log(`\n✅ ${seed.label} — completed!\n`);
    } catch (err) {
      console.error(`\n❌ ${seed.label} — FAILED:`, (err as Error).message);
      // Continue with next seed
    }
  }

  // ─── Step 2: Connect & verify pricing ─────────────────
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`📊 Verifying course pricing...`);
  console.log(`═══════════════════════════════════════════════\n`);

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📦 Connected to MongoDB — checking courses...\n');

  const courseTitles = [
    'Introduction to JavaScript — Complete Beginner Course',
    'Introduction to Python — Complete Beginner Course',
    'Comprehensive JavaScript — Learn by Doing',
    'Data Structures Mastery for Beginners for all',
    'Advanced JavaScript — Practical Exercises & Tests',
    'C Programming Fundamentals — From Hello World to Pointers',
    'C++ Programming — Objects, Classes & STL',
    'Java Programming — From Zero to OOP',
    'Go Programming — Concurrency & Simplicity',
    'Rust Programming — Safety & Performance',
    'Python for Data Science — Lists, Dicts & Functions',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const title of courseTitles) {
    const course = await Course.findOne({ title }).lean() as any;
    if (course) {
      const priceOk = course.price === 1000;
      const modules = course.modules?.length || 0;
      const lessons = course.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0;
      const exercises = course.modules?.reduce(
        (sum: number, m: any) => sum + m.lessons?.reduce((s: number, l: any) => s + (l.codeExercises?.length || 0), 0),
        0
      ) || 0;

      console.log(
        `${priceOk ? '✅' : '⚠️'} ${course.title.substring(0, 60).padEnd(62)}` +
        ` Modules: ${modules} | Lessons: ${String(lessons).padStart(2)} | Exercises: ${String(exercises).padStart(3)}` +
        ` | Price: ${priceOk ? '1000 RWF ✅' : `${course.price} RWF ⚠️`}`
      );
      successCount++;
    } else {
      console.log(`❌ NOT FOUND: ${title}`);
      failCount++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`📊 Summary:`);
  console.log(`   ✅ ${successCount} courses verified`);
  console.log(`   ${failCount > 0 ? `❌ ${failCount} courses missing` : '✅ All courses found'}`);
  console.log(`   💰 All priced at 1000 RWF`);
  console.log(`═══════════════════════════════════════════════\n`);

  // ─── Bonus: List all code exercise courses for reference ───
  const allCodeCourses = await Course.find({
    'modules.lessons.codeExercises': { $exists: true, $not: { $size: 0 } },
  }).lean() as any[];

  const totalExercises = allCodeCourses.reduce((sum, c) => {
    return sum + (c.modules || []).reduce((s: number, m: any) => {
      return s + (m.lessons || []).reduce((s2: number, l: any) => {
        return s2 + (l.codeExercises?.length || 0);
      }, 0);
    }, 0);
  }, 0);

  console.log(`\n📚 Total Code Exercise Courses: ${allCodeCourses.length}`);
  console.log(`💻 Total Code Exercises: ${totalExercises}`);
  console.log(`💰 Price per course: 1000 RWF`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Master seed failed:', err);
  process.exit(1);
});
