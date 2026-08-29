import mongoose from 'mongoose';
import { User } from '../models/User';
import { CourseProgress } from '../models/CourseProgress';
import { Course } from '../models/Course';

/**
 * Mark a lesson as completed in ALL three stores so that:
 * 1. User.completedLessons    → powers the "me" query / tick on frontend
 * 2. CourseProgress.lessons[] → powers myCourseProgress / progress bar
 * 3. ModuleProgress.completedLessons → powers myModuleProgress / module ticks
 *
 * This is the SINGLE source of truth for lesson completion. Every code path
 * that marks a lesson complete MUST go through this function.
 */
export const markLessonCompleteAllStores = async (
  userId: string,
  courseId: string,
  lessonId: string,
) => {
  const cid = String(courseId);
  const lid = String(lessonId);
  const now = new Date();

  // ── 1. User.completedLessons ──
  const user = await User.findById(userId);
  if (!user) return;

  const alreadyInUser = user.completedLessons?.some(
    (cl: any) => String(cl.courseId) === cid && String(cl.lessonId) === lid
  );

  if (!alreadyInUser) {
    if (!user.completedLessons) (user as any).completedLessons = [];
    user.completedLessons.push({
      courseId: new mongoose.Types.ObjectId(cid),
      lessonId: lid,
    });
    await user.save();
  }

  // ── 2. CourseProgress.lessons[] ──
  let courseProgress = await CourseProgress.findOne({ userId, courseId: cid });
  if (!courseProgress) {
    courseProgress = new CourseProgress({
      userId,
      courseId: cid,
      lessons: [],
    });
  }

  const lIdx = courseProgress.lessons.findIndex((l: any) => l.lessonId === lid);
  if (lIdx > -1) {
    courseProgress.lessons[lIdx].completed = true;
    courseProgress.lessons[lIdx].lastAccessed = now;
  } else {
    courseProgress.lessons.push({
      lessonId: lid,
      completed: true,
      timeSpent: 0,
      lastAccessed: now,
      visits: 1,
    });
  }

  // Recalculate overall progress
  const course = await Course.findById(cid);
  if (course) {
    const allLessonIds = course.modules
      .flatMap((m: any) => m.lessons)
      .map((l: any) => (l.id || l._id).toString());
    const completedCount = courseProgress.lessons.filter((l: any) => l.completed).length;
    courseProgress.overallProgress =
      allLessonIds.length > 0
        ? Math.round((completedCount / allLessonIds.length) * 100)
        : 0;
  }

  await courseProgress.save();

  // ── 3. ModuleProgress.completedLessons ──
  try {
    const { ModuleProgress } = await import('../models/ModuleProgress.js');
    let moduleProgress = await ModuleProgress.findOne({ studentId: userId, courseId: cid });

    if (!moduleProgress) {
      moduleProgress = await ModuleProgress.create({
        studentId: userId,
        courseId: cid,
        unlockedModules: [0],
        overrideUnlockedModules: [],
      });
    }

    if (!moduleProgress.completedLessons.includes(lid)) {
      moduleProgress.completedLessons.push(lid);
    }

    moduleProgress.lessonCompletionDates = {
      ...(moduleProgress.lessonCompletionDates || {}),
      [lid]: now,
    };

    // When sequentialLock is OFF, keep all modules unlocked
    if (course && !(course as any).sequentialLock) {
      const totalModules = course.modules?.length || 0;
      moduleProgress.unlockedModules = Array.from(
        { length: totalModules },
        (_, i) => i
      );
    }

    await moduleProgress.save();
  } catch (mpErr) {
    console.error(
      'Non-critical: failed to update ModuleProgress in markLessonCompleteAllStores:',
      mpErr
    );
  }
};

/**
 * Check if a lesson is completed for a user.
 * Checks all three stores and returns true if ANY store has it marked complete.
 */
export const isLessonCompleted = async (
  userId: string,
  courseId: string,
  lessonId: string
): Promise<boolean> => {
  const cid = String(courseId);
  const lid = String(lessonId);

  // Check User.completedLessons
  const user = await User.findById(userId).select('completedLessons').lean();
  const inUser = user?.completedLessons?.some(
    (cl: any) => String(cl.courseId) === cid && String(cl.lessonId) === lid
  );
  if (inUser) return true;

  // Check CourseProgress.lessons[]
  const courseProgress = await CourseProgress.findOne({ userId, courseId: cid })
    .select('lessons')
    .lean();
  const inCourseProgress = courseProgress?.lessons?.some(
    (l: any) => l.lessonId === lid && l.completed
  );
  if (inCourseProgress) return true;

  // Check ModuleProgress.completedLessons
  try {
    const { ModuleProgress } = await import('../models/ModuleProgress.js');
    const moduleProgress = await ModuleProgress.findOne({
      studentId: userId,
      courseId: cid,
    })
      .select('completedLessons')
      .lean();
    if (moduleProgress?.completedLessons?.includes(lid)) return true;
  } catch {
    // Non-critical
  }

  return false;
};
