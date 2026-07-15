/**
 * Quick verification script to check all code courses in the database.
 * Usage: npx ts-node src/verifyCourses.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface Lesson {
  codeExercises?: any[];
}

interface Module {
  lessons?: Lesson[];
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db as any;

  const totalCourses = await db.collection('courses').countDocuments({});
  console.log('📚 TOTAL COURSES IN DATABASE:', totalCourses);
  console.log('');

  const codeCourses = await db.collection('courses').find({
    $or: [
      { title: /JavaScript/i },
      { title: /Python/i },
      { title: /Data Structures/i },
      { title: /C Programming/i },
      { title: /C\\+\\+/i },
      { title: /Java/i },
      { title: /Go /i },
      { title: /Rust/i },
      { title: /Coding Challenges/i },
      { title: /Advanced JS/i },
      { title: /Advanced JavaScript/i },
    ]
  }).project({
    title: 1, price: 1, thumbnail: 1, status: 1, modules: 1
  }).toArray();

  console.log('📋 CODE COURSES:');
  console.log('────────────────────────────────────────────────────');

  for (const c of codeCourses) {
    const mods = c.modules || [];
    let totalLessons = 0;
    let totalExercises = 0;

    for (const m of mods) {
      const lessons = m.lessons || [];
      totalLessons += lessons.length;
      for (const l of lessons) {
        if (l.codeExercises) totalExercises += l.codeExercises.length;
      }
    }

    console.log('');
    console.log(`  📘 ${(c.title || '').substring(0, 70)}`);
    console.log(`     Price: ${c.price} RWF | Modules: ${mods.length} | Lessons: ${totalLessons} | Exercises: ${totalExercises}`);
    console.log(`     Thumbnail: ${c.thumbnail ? '✅' : '❌ NONE'} | Status: ${c.status}`);
  }

  // Grand total
  const allCourses = await db.collection('courses').find({}).toArray();
  let grandTotal = 0;
  for (const c of allCourses) {
    const mods = c.modules || [];
    for (const m of mods) {
      const lessons = m.lessons || [];
      for (const l of lessons) {
        if (l.codeExercises) grandTotal += l.codeExercises.length;
      }
    }
  }

  console.log('');
  console.log('────────────────────────────────────────────────────');
  console.log(`📊 GRAND TOTAL: ${grandTotal} code exercises across ALL courses`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
