/**
 * Backfill pre-computed counts for existing courses.
 * Run once: npx ts-node backend/src/scripts/backfill-course-counts.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/bootskills';

async function backfill() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Use raw collection to avoid type issues with dynamic model
  const db = mongoose.connection.db!;
  const courses = await db.collection('courses').find({ isDeleted: { $ne: true } }).toArray();
  console.log(`Found ${courses.length} courses to backfill`);

  let updated = 0;
  for (const course of courses) {
    const modules = course.modules || [];
    const modulesCount = modules.length;
    const totalLessonsCount = modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
    const studentsEnrolledCount = (course.studentsEnrolled || []).length;

    // Only update if counts are missing or different
    if (
      course.modulesCount !== modulesCount ||
      course.totalLessonsCount !== totalLessonsCount ||
      course.studentsEnrolledCount !== studentsEnrolledCount
    ) {
      await db.collection('courses').updateOne(
        { _id: course._id },
        { $set: { modulesCount, totalLessonsCount, studentsEnrolledCount } }
      );
      updated++;
    }
  }

  console.log(`Updated ${updated} courses`);
  await mongoose.disconnect();
  console.log('Done');
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
