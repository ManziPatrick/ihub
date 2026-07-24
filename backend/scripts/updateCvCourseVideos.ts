/**
 * One-time script to update YouTube video URLs in the CV Writing course
 * with reliably embeddable videos from GCFLearnFree and TED.
 *
 * Usage: cd backend && npx tsx scripts/updateCvCourseVideos.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const COURSE_ID = '6a632bef2d5cee7b57ab6931';

type Lesson = {
  _id?: any;
  id?: string;
  title?: string;
  videoUrl?: string;
  videoTitle?: string;
  content?: string;
  type?: string;
  duration?: number;
  order?: number;
};

type Module = {
  _id?: any;
  id?: string;
  title?: string;
  lessons?: Lesson[];
};

const replacements: Record<string, { url: string; title: string }> = {
  'https://www.youtube.com/watch?v=Y9Pyv-GWbmg': {
    url: 'https://www.youtube.com/watch?v=_qWi6vp_0t4',
    title: 'Choosing the Right Resume Format',
  },
  'https://www.youtube.com/watch?v=sQweshdUWdI': {
    url: 'https://www.youtube.com/watch?v=d1yfb93beSI',
    title: 'How to Introduce Yourself — and Get Hired | Rebecca Okamoto | TED',
  },
};

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📡 Connected to MongoDB');

  const db = mongoose.connection.db!;
  const courses = db.collection('courses');

  const course = await courses.findOne({ _id: new mongoose.Types.ObjectId(COURSE_ID) });
  if (!course) {
    console.error('❌ Course not found');
    process.exit(1);
  }

  const modules: Module[] = (course as any).modules || [];
  let updateCount = 0;

  for (const mod of modules) {
    if (!mod.lessons) continue;
    for (const lesson of mod.lessons) {
      if (lesson.videoUrl && replacements[lesson.videoUrl]) {
        const replacement = replacements[lesson.videoUrl];
        console.log(`   🔄 Updating: "${lesson.title}"`);
        console.log(`      Old: ${lesson.videoUrl}`);
        console.log(`      New: ${replacement.url}`);
        lesson.videoUrl = replacement.url;
        lesson.videoTitle = replacement.title;
        updateCount++;
      }
    }
  }

  if (updateCount === 0) {
    console.log('✅ No videos needed updating');
    await mongoose.disconnect();
    process.exit(0);
  }

  await courses.updateOne(
    { _id: new mongoose.Types.ObjectId(COURSE_ID) },
    { $set: { modules } }
  );

  console.log(`\n✅ Updated ${updateCount} video URL(s) successfully!`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
