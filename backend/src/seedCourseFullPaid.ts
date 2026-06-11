import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { Payment } from './models/Payment';
import { CourseProgress } from './models/CourseProgress';
import mongoose from 'mongoose';

/**
 * Seeds “full courses with payment” scenarios.
 *
 * Creates:
 * - Course enrollments (updates Course.studentsEnrolled + User.enrolledCourses)
 * - CourseProgress (active; and for realism, marks 1 student per course as completed)
 * - Payment docs with status=completed and type='Course Enrollment'
 *
 * Receipts/proof:
 * - This repo appears to use Payment.proofOfPaymentUrl as the proof/receipt reference.
 */
async function seedCourseFullPaid() {
  await connectDB();

  const courses = await Course.find({ status: 'published', price: { $gt: 0 } }).limit(20);
  const students = await User.find({ role: 'student', isDeleted: { $ne: true } }).limit(50);

  if (!courses.length || !students.length) {
    console.log('No paid courses or students found; skipping course paid seeding.');
    process.exit(0);
  }

  console.log(`Seeding course full enrollments + payments for ${courses.length} courses...`);

  let paymentsCreated = 0;
  let enrollmentsCreated = 0;

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    const courseId = course._id as mongoose.Types.ObjectId;

    const buyerCount = Math.min(3, students.length);

    for (let j = 0; j < buyerCount; j++) {
      const student = students[(i + j) % students.length];
      const studentId = student._id as mongoose.Types.ObjectId;

      // Enroll (idempotent)
      const alreadyEnrolled = (course.studentsEnrolled || []).some((s: any) => s.toString() === studentId.toString());
      if (!alreadyEnrolled) {
        await Promise.all([
          Course.findByIdAndUpdate(courseId, { $addToSet: { studentsEnrolled: studentId } }),
          User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseId } }),
        ]);
        enrollmentsCreated++;
      }

      // CourseProgress (active)
      await CourseProgress.findOneAndUpdate(
        { userId: studentId, courseId },
        {
          $setOnInsert: {
            userId: studentId,
            courseId,
            status: 'active',
            lessons: [],
            overallProgress: 0,
            totalTimeSpent: 0,
            selectedDeliveryMode: (course as any).allowedDeliveryModes?.[0] || 'online',
          },
        },
        { upsert: true, new: true }
      );

      // Payment (completed)
      const transactionId = `TXN-SEED-${courseId.toString().slice(-6)}-${studentId.toString().slice(-6)}`;
      const existingPayment = await Payment.findOne({ transactionId });
      if (!existingPayment) {
        const deliveryMode = (course as any).allowedDeliveryModes?.[0] || 'online';
        const amount = (course as any).discountPrice && (course as any).discountPrice > 0 ? (course as any).discountPrice : (course as any).price;

        await Payment.create({
          userId: studentId,
          courseId,
          amount,
          currency: 'RWF',
          status: 'completed',
          paymentMethod: 'Pre-enrolled',
          transactionId,
          type: 'Course Enrollment',
          itemTitle: course.title,
          selectedDeliveryMode: deliveryMode,
          proofOfPaymentUrl: 'https://example.com/seed-proof-of-payment.pdf',
        });

        paymentsCreated++;
      }
    }

    // Realism: mark the first student for this course as completed (if lessons exist)
    const completionStudent = students[(i + 0) % students.length];
    const completionStudentId = completionStudent._id as mongoose.Types.ObjectId;

    const allLessons = (course.modules || []).flatMap((m: any) => m.lessons || []);
    if (allLessons.length) {
      const progress = await CourseProgress.findOne({ userId: completionStudentId, courseId });
      if (progress) {
        (progress as any).overallProgress = 100;
        (progress as any).status = 'completed';
        (progress as any).completionDate = new Date();
        (progress as any).lessons = allLessons.map((l: any) => ({
          lessonId: (l.id || l._id)?.toString?.() || String(l._id),
          completed: true,
          timeSpent: 300,
          lastAccessed: new Date(),
          visits: 1,
        }));
        await progress.save();
      }
    }
  }

  console.log('✅ Course full + payment seeding completed');
  console.log({ paymentsCreated, enrollmentsCreated });
  process.exit(0);
}

seedCourseFullPaid().catch((e) => {
  console.error('❌ seedCourseFullPaid failed', e);
  process.exit(1);
});

