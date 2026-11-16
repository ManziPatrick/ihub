import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { LABS_COURSE, LABS_COURSE_TITLE } from './seed/data/desklist-marquee-course';

dotenv.config();

export async function ensureDesklistMarqueeCourse() {
  const instructor =
    (await User.findOne({ role: 'super_admin', isDeleted: { $ne: true } })) ||
    (await User.findOne({ role: 'admin', isDeleted: { $ne: true } }));
  if (!instructor) {
    console.warn('[LabsCourse] No admin/super_admin user found; skipping.');
    return;
  }

  const modules = LABS_COURSE.modules.map((mod, modIndex) => ({
    title: mod.title,
    description: mod.description,
    order: modIndex + 1,
    hoursAllocated: mod.hoursAllocated,
    learningOutcome: mod.learningOutcome,
    lessons: mod.lessons.map((lesson, lessonIndex) => ({
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration,
      type: lesson.type,
      order: lessonIndex + 1,
      videoUrl: lesson.videoUrl,
      videoTitle: lesson.videoTitle,
      githubClassroomLink: lesson.githubClassroomLink,
      quizQuestions: lesson.quizQuestions || [],
      quizConfig: lesson.quizQuestions?.length
        ? { quizType: 'exercise', questionsPerPage: 1, timeLimit: 0, disableRightClick: false }
        : undefined,
      resources: [
        ...(lesson.githubClassroomLink
          ? [{ title: 'Lab repository', url: lesson.githubClassroomLink, type: 'link' as const }]
          : []),
        ...(lesson.videoUrl
          ? [{ title: lesson.videoTitle || 'Video', url: lesson.videoUrl, type: 'video' as const }]
          : []),
      ],
    })),
  }));

  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);

  const payload = {
    title: LABS_COURSE.title,
    description: LABS_COURSE.description,
    thumbnail: LABS_COURSE.thumbnail,
    instructor: instructor._id,
    createdBy: instructor._id,
    price: 0,
    level: 'Beginner' as const,
    category: LABS_COURSE.category,
    status: 'published' as const,
    isDeleted: false,
    isFeatured: false,
    enrollmentMode: 'direct' as const,
    allowedDeliveryModes: ['online'],
    school: 'Bootskills',
    sequentialLock: true,
    passingScore: 70,
    modules,
    modulesCount: modules.length,
    totalLessonsCount: totalLessons,
  };

  const existing = await Course.findOne({ title: LABS_COURSE_TITLE });
  let courseId = existing?._id;
  if (existing) {
    await Course.updateOne({ _id: existing._id }, { $set: payload as any });
    console.log(`updated: ${LABS_COURSE_TITLE} id=${existing._id}`);
  } else {
    const created = await Course.create(payload as any);
    courseId = created._id;
    console.log(`created: ${LABS_COURSE_TITLE} id=${created._id}`);
  }
  const saved = await Course.findById(courseId).lean();
  const lessons = (saved?.modules || []).flatMap((mod: any) => mod.lessons || []);
  const videos = lessons.filter((l: any) => l.videoUrl).length;
  const shots = lessons.reduce(
    (n: number, l: any) => n + ((String(l.content || '').match(/<img /gi) || []).length),
    0
  );
  console.log(
    `[LabsCourse] db=${mongoose.connection.name} lessons=${totalLessons} modules=${modules.length} videos=${videos} screenshots=${shots}`
  );
}

async function run() {
  await connectDB();
  await ensureDesklistMarqueeCourse();
  console.log('Desklist and Marquee course ready.');
  process.exit(0);
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
