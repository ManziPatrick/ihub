import mongoose from 'mongoose';
import connectDB from './config/db';

async function cleanup() {
  await connectDB();
  console.log('');

  const db = mongoose.connection.db!;
  const coursesCollection = db.collection('courses');

  // ─── Step 1: Find & remove duplicate courses ───────────────────────────
  console.log('═'.repeat(60));
  console.log('STEP 1: Removing duplicate courses (same title)\n');

  const pipeline = [
    { $match: { isDeleted: { $ne: true } } },
    { $group: { _id: { $toLower: '$title' }, ids: { $push: '$_id' }, count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
    { $match: { count: { $gt: 1 } } }
  ];
  const duplicateGroups = await coursesCollection.aggregate(pipeline).toArray();

  let totalCoursesRemoved = 0;
  let totalModulesRemoved = 0;
  let totalLessonsRemoved = 0;
  let totalQuizRemoved = 0;
  let totalAssignmentQsRemoved = 0;

  for (const group of duplicateGroups) {
    const title = group._id;
    const docs = group.docs;

    // Sort: keep the one with the most modules, then most students, then most recently updated
    docs.sort((a: any, b: any) => {
      const aModules = a.modules?.length || 0;
      const bModules = b.modules?.length || 0;
      if (aModules !== bModules) return bModules - aModules;
      const aStudents = a.studentsEnrolled?.length || 0;
      const bStudents = b.studentsEnrolled?.length || 0;
      if (aStudents !== bStudents) return bStudents - aStudents;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });

    const keep = docs[0];
    const duplicates = docs.slice(1);

    // Merge students from duplicates into the kept course
    const mergedStudentIds = new Set<string>();
    if (keep.studentsEnrolled) {
      keep.studentsEnrolled.forEach((s: any) => mergedStudentIds.add(s.toString()));
    }
    for (const dup of duplicates) {
      if (dup.studentsEnrolled) {
        dup.studentsEnrolled.forEach((s: any) => mergedStudentIds.add(s.toString()));
      }
    }

    await coursesCollection.updateOne(
      { _id: keep._id },
      { $set: { studentsEnrolled: Array.from(mergedStudentIds).map(id => new mongoose.Types.ObjectId(id)) } }
    );

    // Delete duplicate courses
    const dupIds = duplicates.map((d: any) => d._id);
    await coursesCollection.deleteMany({ _id: { $in: dupIds } });

    console.log(`  "${title}": kept 1, removed ${duplicates.length} duplicate(s)`);
    totalCoursesRemoved += duplicates.length;

    // Update User enrolledCourses references
    for (const dup of duplicates) {
      const dupIdStr = dup._id.toString();
      await db.collection('users').updateMany(
        { enrolledCourses: dup._id },
        { $addToSet: { enrolledCourses: keep._id } as any }
      );
      await db.collection('users').updateMany(
        { enrolledCourses: dup._id },
        { $pull: { enrolledCourses: dup._id } as any }
      );
    }
  }

  if (totalCoursesRemoved === 0) {
    console.log('  ✅ No duplicate courses found\n');
  } else {
    console.log(`\n  ✅ Removed ${totalCoursesRemoved} duplicate course(s)\n`);
  }

  // ─── Step 2: Remove duplicate modules within courses ───────────────────
  console.log('═'.repeat(60));
  console.log('STEP 2: Removing duplicate modules (same title within a course)\n');

  const allCourses = await coursesCollection.find({ isDeleted: { $ne: true } }).toArray();

  for (const course of allCourses) {
    if (!course.modules || course.modules.length === 0) continue;

    const seenTitles = new Map<string, number>();
    const modulesToKeep: any[] = [];
    let dupCount = 0;

    for (const mod of course.modules) {
      const key = mod.title?.toLowerCase().trim() || '';
      if (seenTitles.has(key)) {
        // Merge lessons from duplicate module into the kept one
        const keptIdx = seenTitles.get(key)!;
        const keptMod = modulesToKeep[keptIdx];
        if (mod.lessons) {
          const existingLessonTitles = new Set((keptMod.lessons || []).map((l: any) => l.title?.toLowerCase().trim()));
          for (const lesson of mod.lessons) {
            if (!existingLessonTitles.has(lesson.title?.toLowerCase().trim())) {
              keptMod.lessons.push(lesson);
            }
          }
        }
        dupCount++;
      } else {
        seenTitles.set(key, modulesToKeep.length);
        modulesToKeep.push(mod);
      }
    }

    if (dupCount > 0) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { modules: modulesToKeep } }
      );
      console.log(`  "${course.title}": kept ${modulesToKeep.length}, removed ${dupCount} duplicate module(s)`);
      totalModulesRemoved += dupCount;
    }
  }

  if (totalModulesRemoved === 0) {
    console.log('  ✅ No duplicate modules found\n');
  } else {
    console.log(`\n  ✅ Removed ${totalModulesRemoved} duplicate module(s) across all courses\n`);
  }

  // ─── Step 3: Remove duplicate lessons within modules ───────────────────
  console.log('═'.repeat(60));
  console.log('STEP 3: Removing duplicate lessons (same title within a module)\n');

  const coursesAfterModules = await coursesCollection.find({ isDeleted: { $ne: true } }).toArray();
  totalLessonsRemoved = 0;

  for (const course of coursesAfterModules) {
    if (!course.modules || course.modules.length === 0) continue;
    let courseDupCount = 0;

    const updatedModules = course.modules.map((mod: any) => {
      if (!mod.lessons || mod.lessons.length === 0) return mod;

      const seenLessons = new Map<string, number>();
      const lessonsToKeep: any[] = [];
      let modDupCount = 0;

      for (const lesson of mod.lessons) {
        const key = lesson.title?.toLowerCase().trim() || '';
        if (seenLessons.has(key)) {
          modDupCount++;
        } else {
          seenLessons.set(key, lessonsToKeep.length);
          lessonsToKeep.push(lesson);
        }
      }

      if (modDupCount > 0) {
        courseDupCount += modDupCount;
        return { ...mod, lessons: lessonsToKeep };
      }
      return mod;
    });

    if (courseDupCount > 0) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { modules: updatedModules } }
      );
      console.log(`  "${course.title}": removed ${courseDupCount} duplicate lesson(s)`);
      totalLessonsRemoved += courseDupCount;
    }
  }

  if (totalLessonsRemoved === 0) {
    console.log('  ✅ No duplicate lessons found\n');
  } else {
    console.log(`\n  ✅ Removed ${totalLessonsRemoved} duplicate lesson(s) across all courses\n`);
  }

  // ─── Step 4: Remove duplicate quiz questions within lessons ────────────
  console.log('═'.repeat(60));
  console.log('STEP 4: Removing duplicate quiz questions (same questionText within a lesson)\n');

  const coursesAfterLessons = await coursesCollection.find({ isDeleted: { $ne: true } }).toArray();
  totalQuizRemoved = 0;

  for (const course of coursesAfterLessons) {
    if (!course.modules || course.modules.length === 0) continue;
    let courseDupCount = 0;

    const updatedModules = course.modules.map((mod: any) => {
      if (!mod.lessons || mod.lessons.length === 0) return mod;

      const updatedLessons = mod.lessons.map((lesson: any) => {
        if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) return lesson;

        const seen = new Set<string>();
        const unique: any[] = [];
        let lessonDupCount = 0;

        for (const q of lesson.quizQuestions) {
          const key = q.questionText?.toLowerCase().trim() || '';
          if (seen.has(key)) {
            lessonDupCount++;
          } else {
            seen.add(key);
            unique.push(q);
          }
        }

        if (lessonDupCount > 0) {
          courseDupCount += lessonDupCount;
          return { ...lesson, quizQuestions: unique };
        }
        return lesson;
      });

      return { ...mod, lessons: updatedLessons };
    });

    if (courseDupCount > 0) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { modules: updatedModules } }
      );
      console.log(`  "${course.title}": removed ${courseDupCount} duplicate quiz question(s)`);
      totalQuizRemoved += courseDupCount;
    }
  }

  if (totalQuizRemoved === 0) {
    console.log('  ✅ No duplicate quiz questions found\n');
  } else {
    console.log(`\n  ✅ Removed ${totalQuizRemoved} duplicate quiz question(s) across all courses\n`);
  }

  // ─── Step 5: Remove duplicate assignment questions within lessons ──────
  console.log('═'.repeat(60));
  console.log('STEP 5: Removing duplicate assignment questions (same questionText within a lesson)\n');

  const coursesAfterQuiz = await coursesCollection.find({ isDeleted: { $ne: true } }).toArray();
  totalAssignmentQsRemoved = 0;

  for (const course of coursesAfterQuiz) {
    if (!course.modules || course.modules.length === 0) continue;
    let courseDupCount = 0;

    const updatedModules = course.modules.map((mod: any) => {
      if (!mod.lessons || mod.lessons.length === 0) return mod;

      const updatedLessons = mod.lessons.map((lesson: any) => {
        if (!lesson.assignmentQuestions || lesson.assignmentQuestions.length === 0) return lesson;

        const seen = new Set<string>();
        const unique: any[] = [];
        let lessonDupCount = 0;

        for (const q of lesson.assignmentQuestions) {
          const key = q.questionText?.toLowerCase().trim() || '';
          if (seen.has(key)) {
            lessonDupCount++;
          } else {
            seen.add(key);
            unique.push(q);
          }
        }

        if (lessonDupCount > 0) {
          courseDupCount += lessonDupCount;
          return { ...lesson, assignmentQuestions: unique };
        }
        return lesson;
      });

      return { ...mod, lessons: updatedLessons };
    });

    if (courseDupCount > 0) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { modules: updatedModules } }
      );
      console.log(`  "${course.title}": removed ${courseDupCount} duplicate assignment question(s)`);
      totalAssignmentQsRemoved += courseDupCount;
    }
  }

  if (totalAssignmentQsRemoved === 0) {
    console.log('  ✅ No duplicate assignment questions found\n');
  } else {
    console.log(`\n  ✅ Removed ${totalAssignmentQsRemoved} duplicate assignment question(s) across all courses\n`);
  }

  // ─── Summary ───────────────────────────────────────────────────────────
  console.log('═'.repeat(60));
  console.log('📊 CLEANUP SUMMARY\n');
  console.log(`  Duplicate courses removed:     ${totalCoursesRemoved}`);
  console.log(`  Duplicate modules removed:     ${totalModulesRemoved}`);
  console.log(`  Duplicate lessons removed:     ${totalLessonsRemoved}`);
  console.log(`  Duplicate quiz questions removed: ${totalQuizRemoved}`);
  console.log(`  Duplicate assignment Qs removed:  ${totalAssignmentQsRemoved}`);

  const total = totalCoursesRemoved + totalModulesRemoved + totalLessonsRemoved + totalQuizRemoved + totalAssignmentQsRemoved;
  if (total === 0) {
    console.log('\n  🎉 Database is already clean! No duplicates found.');
  } else {
    console.log(`\n  🧹 Total ${total} duplicate items removed.`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Cleanup complete!');
}

cleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
