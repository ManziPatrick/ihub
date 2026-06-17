import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';
import { Payment } from './models/Payment';
import { CourseProgress } from './models/CourseProgress';

dotenv.config();

const ADMIN_EMAIL = 'admin@bootskills.com';
const TARGET_COURSE_TITLES = [
  'Advanced JavaScript — Practical Exercises & Tests',
  'Data Structures Mastery for Beginners — Complete 20-Module Course',
];

async function main() {
  await connectDB();

  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    throw new Error(`Admin user not found for email: ${ADMIN_EMAIL}`);
  }

  const courses = await Course.find({ title: { $in: TARGET_COURSE_TITLES } });
  if (courses.length !== TARGET_COURSE_TITLES.length) {
    const foundTitles = courses.map(c => c.title);
    const missing = TARGET_COURSE_TITLES.filter(t => !foundTitles.includes(t));
    throw new Error(`Not all target courses were found. Missing: ${missing.join(', ')}`);
  }

  for (const course of courses) {
    // enroll in User.enrolledCourses
    if (!admin.enrolledCourses.some((id: any) => id.toString() === course._id.toString())) {
      admin.enrolledCourses.push(course._id as any);
      await admin.save();
    }

    // enroll in Course.studentsEnrolled
    if (!course.studentsEnrolled.some((id: any) => id.toString() === admin._id.toString())) {
      course.studentsEnrolled.push(admin._id as any);
      await course.save();
    }

    // initialize progress
    await CourseProgress.findOneAndUpdate(
      { userId: admin._id, courseId: course._id },
      {
        $setOnInsert: {
          userId: admin._id,
          courseId: course._id,
          totalTimeSpent: 0,
          overallProgress: 0,
          status: 'active',
          lessons: []
        }
      },
      { upsert: true, new: true }
    );

    // if priced, add a payment record (mirrors resolver enroll() behavior)
    const shouldPay = (course as any).price > 0;
    if (shouldPay) {
      const alreadyPaid = await Payment.exists({
        userId: admin._id,
        courseId: course._id,
        type: 'Course Enrollment'
      });

      if (!alreadyPaid) {
        await new Payment({
          userId: admin._id,
          courseId: course._id,
          amount: (course as any).price,
          currency: 'RWF',
          status: 'completed',
          paymentMethod: 'Admin Enrolled (Seed)',
          transactionId: `TXN-ADMIN-${Date.now()}-${Math.random().toString(16).slice(2).toUpperCase()}`,
          type: 'Course Enrollment',
          itemTitle: course.title
        }).save();
      }
    }

    console.log(`✅ Enrolled admin into: ${course.title}`);
  }

  console.log('🏁 Admin enrollment seed completed.');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ seedAdminEnrollCourses failed:', e);
  process.exit(1);
});

