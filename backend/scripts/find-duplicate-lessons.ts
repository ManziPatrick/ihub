/**
 * Find duplicate lesson descriptions in published courses.
 * Compares lesson titles and content to find potential duplicates
 * within the same course and across different courses.
 *
 * Usage: cd backend && npx tsx scripts/find-duplicate-lessons.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface Lesson {
  title?: string;
  content?: string;
  type?: string;
  duration?: number;
}

interface Module {
  title?: string;
  lessons?: Lesson[];
  order?: number;
}

interface Course {
  _id?: any;
  title?: string;
  status?: string;
  category?: string;
  modules?: Module[];
}

/**
 * Normalize a string for comparison: lowercase, trim, remove extra whitespace.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/[^a-z0-9\s]/g, ' ')     // remove punctuation
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

/**
 * Compute a simple similarity score (0-1) between two strings using
 * word overlap (Jaccard similarity on word sets).
 */
function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 3));
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Compute title similarity (used when content is empty).
 */
function titleSimilarity(a: string, b: string): number {
  return wordOverlap(normalize(a), normalize(b));
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📡 Connected to MongoDB\n');

  const db = mongoose.connection.db!;
  const coursesCollection = db.collection('courses');

  // Get all published courses with their modules and lessons
  const courses = await coursesCollection.find({
    status: { $in: ['published', 'active'] },
  }).project({
    title: 1,
    status: 1,
    category: 1,
    'modules.title': 1,
    'modules.order': 1,
    'modules.lessons.title': 1,
    'modules.lessons.content': 1,
    'modules.lessons.type': 1,
    'modules.lessons.duration': 1,
  }).toArray() as unknown as Course[];

  console.log(`📚 Found ${courses.length} published course(s)\n`);

  // Collect all lessons with course/module context
  interface Entry {
    courseTitle: string;
    courseId: string;
    moduleTitle: string;
    lessonTitle: string;
    content: string;
    contentNorm: string;
    titleNorm: string;
  }

  const allLessons: Entry[] = [];

  for (const course of courses) {
    if (!course.modules) continue;
    for (const mod of course.modules) {
      if (!mod.lessons) continue;
      for (const lesson of mod.lessons) {
        if (!lesson.title) continue;
        const content = lesson.content || '';
        allLessons.push({
          courseTitle: course.title || 'Untitled',
          courseId: String(course._id || ''),
          moduleTitle: mod.title || 'Untitled Module',
          lessonTitle: lesson.title,
          content,
          contentNorm: normalize(content),
          titleNorm: normalize(lesson.title),
        });
      }
    }
  }

  console.log(`📝 Found ${allLessons.length} total lessons\n`);

  // ── 1. Find exact duplicate content (same normalized content) ──
  interface DuplicateGroup {
    reason: string;
    entries: Entry[];
    contentExcerpt: string;
  }

  const contentDupes: DuplicateGroup[] = [];
  const titleDupes: DuplicateGroup[] = [];

  // Check content duplicates (exact match after normalization)
  const contentMap = new Map<string, Entry[]>();
  for (const lesson of allLessons) {
    if (!lesson.contentNorm) continue;
    const key = lesson.contentNorm.slice(0, 200); // first 200 chars of normalized content
    const existing = contentMap.get(key) || [];
    existing.push(lesson);
    contentMap.set(key, existing);
  }

  for (const [, entries] of contentMap) {
    if (entries.length > 1) {
      // Deduplicate by checking if they're from different lessons
      const unique = new Set(entries.map(e => `${e.courseId}::${e.lessonTitle}`));
      if (unique.size > 1) {
        contentDupes.push({
          reason: 'Duplicate content (exact match)',
          entries,
          contentExcerpt: entries[0].content.slice(0, 150),
        });
      }
    }
  }

  // ── 2. Find similar content (high word overlap but not exact) ──
  console.log('🔍 Checking for similar content...');
  const checked = new Set<string>();
  const similarPairs: { a: Entry; b: Entry; score: number }[] = [];

  for (let i = 0; i < allLessons.length; i++) {
    for (let j = i + 1; j < allLessons.length; j++) {
      const a = allLessons[i];
      const b = allLessons[j];
      const key = `${i}-${j}`;
      if (checked.has(key)) continue;
      checked.add(key);

      // Skip if both have no content
      if (!a.contentNorm && !b.contentNorm) continue;
      if (!a.contentNorm || !b.contentNorm) continue;

      const score = wordOverlap(a.contentNorm, b.contentNorm);
      if (score > 0.7 && score < 1.0) {
        similarPairs.push({ a, b, score });
      }
    }
  }

  // Sort by similarity score (highest first)
  similarPairs.sort((x, y) => y.score - x.score);

  // ── 3. Find duplicate titles (exact same title in different modules/courses) ──
  const titleMap = new Map<string, Entry[]>();
  for (const lesson of allLessons) {
    const key = lesson.titleNorm;
    const existing = titleMap.get(key) || [];
    existing.push(lesson);
    titleMap.set(key, existing);
  }

  for (const [, entries] of titleMap) {
    if (entries.length > 1) {
      // Only flag if different courses OR different modules
      const uniqueCourses = new Set(entries.map(e => e.courseTitle));
      if (uniqueCourses.size > 1 || new Set(entries.map(e => e.moduleTitle)).size > 1) {
        titleDupes.push({
          reason: 'Duplicate lesson title',
          entries,
          contentExcerpt: entries[0].content.slice(0, 100),
        });
      }
    }
  }

  // ── REPORT ──
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 DUPLICATE LESSON REPORT');
  console.log('='.repeat(70));

  // Section 1: Exact duplicate content
  console.log(`\n📋 EXACT DUPLICATE CONTENT (${contentDupes.length} group(s))`);
  console.log('-'.repeat(70));

  if (contentDupes.length === 0) {
    console.log('  ✅ No exact content duplicates found\n');
  } else {
    for (const group of contentDupes) {
      console.log(`  🔴 ${group.reason}`);
      console.log(`     Content preview: "${group.contentExcerpt}..."`);
      for (const entry of group.entries) {
        console.log(`     📍 "${entry.lessonTitle}"`);
        console.log(`        Course: ${entry.courseTitle} / ${entry.moduleTitle}`);
      }
      console.log('');
    }
  }

  // Section 2: Similar content (high overlap)
  console.log(`\n📋 SIMILAR CONTENT (${similarPairs.length} pair(s) with >70% word overlap)`);
  console.log('-'.repeat(70));

  if (similarPairs.length === 0) {
    console.log('  ✅ No similar content pairs found (above 70% threshold)\n');
  } else {
    for (const pair of similarPairs.slice(0, 20)) { // show top 20
      console.log(`  🟡 ${Math.round(pair.score * 100)}% similar`);
      console.log(`     A: "${pair.a.lessonTitle}" (${pair.a.courseTitle} / ${pair.a.moduleTitle})`);
      console.log(`     B: "${pair.b.lessonTitle}" (${pair.b.courseTitle} / ${pair.b.moduleTitle})`);
      console.log('');
    }
    if (similarPairs.length > 20) {
      console.log(`  ... and ${similarPairs.length - 20} more pair(s)\n`);
    }
  }

  // Section 3: Duplicate titles
  console.log(`\n📋 DUPLICATE LESSON TITLES (${titleDupes.length} group(s))`);
  console.log('-'.repeat(70));

  if (titleDupes.length === 0) {
    console.log('  ✅ No duplicate lesson titles found\n');
  } else {
    for (const group of titleDupes) {
      console.log(`  🟠 "${group.entries[0].lessonTitle}"`);
      for (const entry of group.entries) {
        console.log(`     📍 ${entry.courseTitle} / ${entry.moduleTitle}`);
      }
      console.log('');
    }
  }

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log(`  Total lessons checked: ${allLessons.length}`);
  console.log(`  Exact content dupes:   ${contentDupes.length} group(s)`);
  console.log(`  Similar content pairs: ${similarPairs.length} pair(s)`);
  console.log(`  Duplicate titles:      ${titleDupes.length} group(s)`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
