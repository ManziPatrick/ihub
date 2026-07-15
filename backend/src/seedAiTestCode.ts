/**
 * Seed script: Auto-generate AI test code for all coding exercises.
 * 
 * Usage:
 *   npx ts-node src/seedAiTestCode.ts          # Incremental: skip exercises with testCode
 *   npx ts-node src/seedAiTestCode.ts --force   # Force: regenerate ALL exercises
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Course } from './models/Course';
import { User } from './models/User';
import { generateCodeTestsService } from './services/ai.service';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ihub';

async function seedAiTestCode() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB: ${MONGODB_URI}`);

    // ── 1. Find ALL courses with at least one code exercise ─────────────
    const courses = await Course.find({
      'modules.lessons.codeExercises.0': { $exists: true },
    }).lean();

    console.log(`\n📚 Found ${courses.length} course(s) with code exercises`);

    let totalExercises = 0;
    let totalGenerated = 0;

    for (const course of courses) {
      console.log(`\n━━━ Course: "${course.title}" (${course._id}) ━━━`);
      let courseGenerated = 0;

      for (const mod of (course as any).modules || []) {
        for (const lesson of mod.lessons || []) {
          for (const exercise of lesson.codeExercises || []) {
            totalExercises++;

            // Skip exercises that already have test code (unless --force flag)
            const forceRegenerate = process.argv.includes('--force');
            if (exercise.testCode && exercise.testCode.trim()) {
              if (!forceRegenerate) {
                console.log(`  ⏭️  Skipping "${exercise.title}" — already has testCode`);
                continue;
              }
              console.log(`  🔄 Force-regenerating "${exercise.title}"`);
            }

            // Generate AI test code
            const language = exercise.language || 'javascript';
            console.log(`  🤖 Generating test for: "${exercise.title}" (${language})...`);

            try {
              let aiTestCode = await generateCodeTestsService(
                exercise.title || 'Untitled Exercise',
                exercise.description || '',
                language,
                exercise.initialCode || '',
                exercise.expectedOutput
              );

              if (aiTestCode && aiTestCode.trim()) {
                aiTestCode = aiTestCode
                  .replace(/```[a-zA-Z]*\n?/g, '')
                  .replace(/```\n?/g, '')
                  .trim();

                // Save to DB using updateOne with nested array filters
                const updateKey = 'modules.$[m].lessons.$[l].codeExercises.$[ex].testCode';
                const exerciseId = (exercise as any)._id || exercise.id;

                if (exerciseId) {
                  await Course.updateOne(
                    { _id: course._id },
                    { $set: { [updateKey]: aiTestCode } },
                    {
                      arrayFilters: [
                        { 'm._id': mod._id },
                        { 'l._id': lesson._id },
                        { 'ex._id': exerciseId },
                      ],
                    }
                  );
                  totalGenerated++;
                  courseGenerated++;
                  console.log(`    ✅ Saved ${aiTestCode.split('\n').length} lines of test code`);
                } else {
                  console.warn(`    ⚠️  Exercise "${exercise.title}" has no _id — skipping save`);
                }
              } else {
                console.warn(`    ⚠️  AI returned empty test code for "${exercise.title}"`);
              }
            } catch (err: any) {
              console.warn(`    ❌ Error generating test for "${exercise.title}": ${err?.message}`);
            }

            // Small delay between AI calls to avoid rate limiting
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      console.log(`  📊 Generated ${courseGenerated} test(s) for this course`);
    }

    console.log(`\n═══════════════════════════════════════════`);
    console.log(`📊 Total exercises found: ${totalExercises}`);
    console.log(`✅ Total test code generated: ${totalGenerated}`);
    console.log(`═══════════════════════════════════════════\n`);

    // ── 2. Create/verify a test user and enroll in the target course ─────
    const targetCourseId = '6a56866414b79b3ebaa23c11';
    console.log(`\n🔍 Looking up target course: ${targetCourseId}`);

    const targetCourse = await Course.findById(targetCourseId);
    if (!targetCourse) {
      console.warn(`⚠️  Target course ${targetCourseId} not found in database`);
    } else {
      console.log(`✅ Found course: "${targetCourse.title}"`);

      // Create test user
      const testEmail = 'testcoder@ihub.com';
      let testUser = await User.findOne({ email: testEmail });

      if (!testUser) {
        testUser = new User({
          username: 'testcoder',
          email: testEmail,
          password: 'testcoder123',  // plaintext — pre-save hook hashes it
          role: 'student',
          fullName: 'Test Coder',
        });
        await testUser.save();
        console.log(`✅ Created test user: ${testEmail}`);
      } else {
        console.log(`✅ Test user already exists: ${testEmail} (${testUser._id})`);
      }

      // Enroll user in course
      const isEnrolled = (targetCourse as any).studentsEnrolled?.some(
        (id: any) => id.toString() === testUser!._id.toString()
      );

      if (!isEnrolled) {
        (targetCourse as any).studentsEnrolled?.push(testUser._id);
        await (targetCourse as any).save();
        console.log(`✅ Enrolled ${testEmail} in "${targetCourse.title}"`);
      } else {
        console.log(`✅ ${testEmail} is already enrolled`);
      }

      // Count exercises with/without testCode in target course
      let withTests = 0;
      let withoutTests = 0;
      let totalEx = 0;
      for (const mod of (targetCourse as any).modules || []) {
        for (const lesson of mod.lessons || []) {
          for (const ex of lesson.codeExercises || []) {
            totalEx++;
            if (ex.testCode && ex.testCode.trim()) {
              withTests++;
            } else {
              withoutTests++;
            }
          }
        }
      }
      console.log(`\n📊 Target course exercise stats:`);
      console.log(`   Total exercises: ${totalEx}`);
      console.log(`   With testCode: ${withTests}`);
      console.log(`   Without testCode: ${withoutTests}`);
    }

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seed failed:', error?.message || error);
    process.exit(1);
  }
}

seedAiTestCode();
