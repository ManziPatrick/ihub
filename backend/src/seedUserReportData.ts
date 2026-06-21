/**
 * Seed script for the Comprehensive User Report System.
 *
 * Creates test data for the getUserFullReport query:
 * - A super_admin user + admin user
 * - A test student with full report data
 * - Actual Course documents with progress
 * - Grades (quiz/exam scores)
 * - Assignment submissions
 * - Projects with tasks
 * - Internships with sprint reviews/milestones/tasks
 * - Certificates (issued + in-progress)
 *
 * Usage: npx ts-node src/seedUserReportData.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';
import { User } from './models/User';
import { Course } from './models/Course';
import { CourseProgress } from './models/CourseProgress';
import { AssignmentSubmission } from './models/AssignmentSubmission';
import { Project } from './models/Project';
import { Internship } from './models/Internship';
import { Certificate } from './models/Certificate';

async function seedUserReportData() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // ── 1. Ensure super admin exists ──
    let superAdmin = await User.findOne({ email: 'admin@ihub.com' });
    if (!superAdmin) {
      const hashedPw = await bcrypt.hash('Admin@123', 10);
      superAdmin = await User.create({
        username: 'SuperAdmin',
        email: 'admin@ihub.com',
        password: hashedPw,
        role: 'super_admin',
        fullName: 'System Administrator',
        title: 'Platform Owner',
        level: 50,
        xp: 25000,
        streak: 120,
        isFirst: false,
      });
      console.log('✅ Created super_admin: admin@ihub.com');
    } else {
      console.log('⚠️ Super admin already exists');
    }

    // ── 2. Ensure admin exists ──
    let admin = await User.findOne({ email: 'admin2@ihub.com' });
    if (!admin) {
      const hashedPw = await bcrypt.hash('Admin@123', 10);
      admin = await User.create({
        username: 'AdminUser',
        email: 'admin2@ihub.com',
        password: hashedPw,
        role: 'admin',
        fullName: 'Platform Admin',
        title: 'Operations Manager',
        level: 30,
        xp: 12000,
        streak: 45,
        isFirst: false,
      });
      console.log('✅ Created admin: admin2@ihub.com');
    } else {
      console.log('⚠️ Admin already exists');
    }

    // ── 3. Create test student ──
    let student = await User.findOne({ email: 'student@test.com' });
    if (!student) {
      const hashedPw = await bcrypt.hash('Student@123', 10);
      student = await User.create({
        username: 'TestStudent',
        email: 'student@test.com',
        password: hashedPw,
        role: 'student',
        fullName: 'Alex Mugenzi',
        title: 'Software Engineering Intern',
        phone: '+250788123456',
        location: 'Kigali, Rwanda',
        bio: 'A passionate software engineering student focused on full-stack development.',
        school: 'University of Rwanda',
        level: 7,
        xp: 3450,
        streak: 15,
        isFirst: false,
        createdAt: new Date('2025-01-15'),
      });
      console.log('✅ Created test student: student@test.com');
    } else {
      console.log('⚠️ Test student already exists');
    }

    const studentId = student._id;
    const instructorId = superAdmin._id;

    // ── 4. Create actual Course documents ──
    const courseDefs = [
      { title: 'Full-Stack Web Development', level: 'Intermediate' as const, description: 'Build complete web applications with React, Node.js, and MongoDB.', totalLessons: 24 },
      { title: 'Data Structures & Algorithms', level: 'Advanced' as const, description: 'Master fundamental computer science concepts for efficient problem solving.', totalLessons: 18 },
      { title: 'Advanced React & TypeScript', level: 'Intermediate' as const, description: 'Deep dive into modern React patterns with TypeScript for production apps.', totalLessons: 15 },
    ];

    const courseIds: string[] = [];
    const courseLevelMap: Record<string, string> = {};
    const totalLessonsMap: Record<string, number> = {};
    const completedLessonCounts: number[] = [20, 10, 15];

    for (let i = 0; i < courseDefs.length; i++) {
      const cd = courseDefs[i];
      let course = await Course.findOne({ title: cd.title });
      if (!course) {
        course = await Course.create({
          title: cd.title,
          description: cd.description,
          level: cd.level,
          category: 'Technology',
          instructor: instructorId,
          status: 'published',
          modules: [],
        });
        console.log(`✅ Created course: ${cd.title}`);
      } else {
        console.log(`⚠️ Course already exists: ${cd.title}`);
      }
      const cIdStr = course._id.toString();
      courseIds.push(cIdStr);
      courseLevelMap[cIdStr] = cd.level;
      totalLessonsMap[cIdStr] = cd.totalLessons;
    }

    // ── 5. Enroll student in courses ──
    const existingEnrollments = (await User.findById(studentId))?.enrolledCourses?.length || 0;
    if (existingEnrollments === 0) {
      await User.findByIdAndUpdate(studentId, {
        $set: {
          enrolledCourses: courseIds.map(id => new mongoose.Types.ObjectId(id)),
          completedCourses: [new mongoose.Types.ObjectId(courseIds[2])], // Only course 3 completed
          completedLessons: [],
        },
      });

      // Generate completed lessons for each course
      const completedLessonsData: Array<{ courseId: mongoose.Types.ObjectId; lessonId: string }> = [];
      for (let i = 0; i < courseIds.length; i++) {
        const cId = courseIds[i];
        const total = totalLessonsMap[cId];
        const completed = completedLessonCounts[i];
        const shortId = cId.slice(-4);
        for (let j = 1; j <= completed; j++) {
          completedLessonsData.push({
            courseId: new mongoose.Types.ObjectId(cId),
            lessonId: `lesson-${shortId}-${j}`,
          });
        }
      }

      await User.findByIdAndUpdate(studentId, {
        $set: { completedLessons: completedLessonsData },
      });
      console.log('✅ Student enrolled in 3 courses with lesson progress');
    } else {
      console.log('⚠️ Student already enrolled — skipping enrollment');
    }

    // ── 6. Create CourseProgress records ──
    const existingProgress = await CourseProgress.countDocuments({ userId: studentId });
    if (existingProgress === 0) {
      for (let i = 0; i < courseIds.length; i++) {
        const cId = courseIds[i];
        const total = totalLessonsMap[cId];
        const completed = completedLessonCounts[i];
        const progress = Math.round((completed / total) * 100);
        const shortId = cId.slice(-4);
        const lessons = [];
        for (let j = 1; j <= total; j++) {
          lessons.push({
            lessonId: `lesson-${shortId}-${j}`,
            completed: j <= completed,
            timeSpent: Math.floor(Math.random() * 3600) + 600,
            lastAccessed: new Date(Date.now() - (total - j) * 86400000),
            visits: Math.floor(Math.random() * 5) + 1,
          });
        }

        await CourseProgress.create({
          userId: studentId,
          courseId: new mongoose.Types.ObjectId(cId),
          lessons,
          totalTimeSpent: lessons.reduce((s: number, l: any) => s + l.timeSpent, 0),
          overallProgress: progress,
          lastAccessed: new Date(),
          status: progress === 100 ? 'completed' : 'in_progress',
        });
      }
      console.log('✅ Created course progress for 3 courses');
    } else {
      console.log('⚠️ Course progress already exists — skipping');
    }

    // ── 7. Create grades (quiz/exam scores) ──
    const existingGrades = (await User.findById(studentId).select('grades'))?.grades?.length || 0;
    if (existingGrades === 0) {
      const gradeEntries: Array<{
        courseId: mongoose.Types.ObjectId;
        lessonId: string;
        score: number;
        feedback: string;
        gradedBy: mongoose.Types.ObjectId;
        gradedAt: Date;
      }> = [];

      for (let i = 0; i < courseIds.length; i++) {
        const cId = courseIds[i];
        const shortId = cId.slice(-4);
        const numGrades = Math.min(5, completedLessonCounts[i]);
        for (let j = 1; j <= numGrades; j++) {
          const score = Math.floor(Math.random() * 40) + 50;
          gradeEntries.push({
            courseId: new mongoose.Types.ObjectId(cId),
            lessonId: `lesson-${shortId}-${j}`,
            score,
            feedback: score >= 70 ? 'Good work!' : 'Keep practicing.',
            gradedBy: instructorId,
            gradedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
          });
        }
      }

      await User.findByIdAndUpdate(studentId, {
        $push: { grades: { $each: gradeEntries } },
      });
      console.log(`✅ Created ${gradeEntries.length} grade records`);
    } else {
      console.log('⚠️ Grades already exist — skipping');
    }

    // ── 8. Create assignment submissions ──
    const existingSubmissions = await AssignmentSubmission.countDocuments({ userId: studentId });
    if (existingSubmissions === 0) {
      const statuses = ['approved', 'reviewed', 'pending'] as const;
      const submissionData: any[] = [];

      for (let i = 0; i < courseIds.length; i++) {
        const cId = courseIds[i];
        const shortId = cId.slice(-4);
        for (let j = 1; j <= 3; j++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const grade = status === 'approved'
            ? Math.floor(Math.random() * 30) + 70
            : status === 'reviewed'
              ? Math.floor(Math.random() * 30) + 50
              : undefined;

          submissionData.push({
            userId: studentId,
            courseId: new mongoose.Types.ObjectId(cId),
            lessonId: `lesson-${shortId}-${j}`,
            content: `Submission content for lesson ${j}`,
            status,
            grade,
            totalScore: grade,
            feedback: grade && grade >= 70
              ? 'Excellent submission!'
              : grade
                ? 'Good effort, some improvements needed.'
                : undefined,
            timeTaken: Math.floor(Math.random() * 1800) + 300,
          });
        }
      }

      await AssignmentSubmission.insertMany(submissionData);
      console.log(`✅ Created ${submissionData.length} assignment submissions`);
    } else {
      console.log('⚠️ Submissions already exist — skipping');
    }

    // ── 9. Create projects ──
    const existingProjects = await Project.countDocuments({ userId: studentId });
    if (existingProjects === 0) {
      await Project.create([
        {
          userId: studentId,
          title: 'E-Commerce Platform',
          course: 'Full-Stack Web Development',
          type: 'Team Project',
          status: 'completed',
          progress: 100,
          grade: 'A',
          feedback: 'Excellent project with clean architecture and good UI.',
          description: 'A full-stack e-commerce platform built with React, Node.js, and MongoDB.',
          tasks: [
            { id: new mongoose.Types.ObjectId().toString(), title: 'User Authentication', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Product Catalog API', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Shopping Cart', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Payment Integration', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Admin Dashboard', completed: true, approved: true },
          ],
          deadline: new Date('2025-06-01'),
          submittedAt: new Date('2025-05-28'),
          createdAt: new Date('2025-04-01'),
        },
        {
          userId: studentId,
          title: 'Task Management API',
          course: 'Data Structures & Algorithms',
          type: 'Individual',
          status: 'in_progress',
          progress: 60,
          description: 'A RESTful API implementing various data structures for task management.',
          tasks: [
            { id: new mongoose.Types.ObjectId().toString(), title: 'Design Data Models', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Implement Binary Search Tree', completed: true, approved: true },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Graph Traversal for Dependencies', completed: true, approved: false },
            { id: new mongoose.Types.ObjectId().toString(), title: 'Hash Table Cache Layer', completed: false, approved: false },
            { id: new mongoose.Types.ObjectId().toString(), title: 'API Documentation', completed: false, approved: false },
          ],
          deadline: new Date('2025-08-15'),
          createdAt: new Date('2025-06-01'),
        },
      ]);
      console.log('✅ Created 2 projects with tasks');
    } else {
      console.log('⚠️ Projects already exist — skipping');
    }

    // ── 10. Create internship ──
    const existingInternships = await Internship.countDocuments({ userId: studentId });
    if (existingInternships === 0) {
      await Internship.create({
        userId: studentId,
        title: 'Software Development Internship',
        organization: 'Ihub Academy',
        cohort: '2025-A',
        type: 'Online',
        status: 'in_progress',
        stage: 'Stage 3: Full-Stack Development',
        currentStage: 3,
        progress: 65,
        duration: '6 months',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-09-01'),
        payment: {
          amount: 350000,
          currency: 'RWF',
          status: 'paid',
          paidAt: new Date('2025-02-28'),
          isPaidProgram: true,
        },
        mentorId: instructorId,
        mentors: [instructorId],
        milestones: [
          { title: 'Orientation & Setup', completed: true, date: new Date('2025-03-07') },
          { title: 'Frontend Fundamentals', completed: true, date: new Date('2025-04-01') },
          { title: 'Backend Development', completed: true, date: new Date('2025-05-15') },
          { title: 'Full-Stack Integration', completed: false, date: new Date('2025-06-30') },
          { title: 'Deployment & Testing', completed: false, date: new Date('2025-08-01') },
          { title: 'Final Presentation', completed: false, date: new Date('2025-09-01') },
        ],
        tasks: [
          { title: 'Set up development environment', status: 'completed', priority: 'high' },
          { title: 'Complete React training module', status: 'completed', priority: 'high' },
          { title: 'Build portfolio project', status: 'completed', priority: 'high' },
          { title: 'Database design challenge', status: 'in_progress', priority: 'medium' },
          { title: 'API integration task', status: 'pending', priority: 'medium' },
        ],
        meetings: [
          { title: 'Weekly Standup', time: 'Monday 10:00 AM', type: 'recurring' },
          { title: 'Sprint Planning', time: 'Friday 2:00 PM', type: 'recurring' },
          { title: 'Code Review Session', time: '2025-06-15 3:00 PM', type: 'upcoming' },
        ],
        sprintReviews: [
          { week: 1, grade: 85, feedback: 'Strong start, good initiative.', reviewedBy: instructorId, date: new Date('2025-03-10') },
          { week: 2, grade: 78, feedback: 'Good progress on frontend tasks.', reviewedBy: instructorId, date: new Date('2025-03-17') },
          { week: 3, grade: 92, feedback: 'Excellent work on the React components.', reviewedBy: instructorId, date: new Date('2025-03-24') },
          { week: 4, grade: 88, feedback: 'Consistent performance.', reviewedBy: instructorId, date: new Date('2025-03-31') },
          { week: 5, grade: 82, feedback: 'Good, but need to improve testing coverage.', reviewedBy: instructorId, date: new Date('2025-04-07') },
          { week: 6, grade: 90, feedback: 'Backend API implementation is solid.', reviewedBy: instructorId, date: new Date('2025-04-14') },
        ],
      });
      console.log('✅ Created internship with sprint reviews, milestones, and tasks');
    } else {
      console.log('⚠️ Internship already exists — skipping');
    }

    // ── 11. Create certificates ──
    const existingCertificates = await Certificate.countDocuments({ userId: studentId });
    if (existingCertificates === 0) {
      // Issued certificate
      await Certificate.create({
        userId: studentId,
        courseId: new mongoose.Types.ObjectId(courseIds[2]),
        courseTitle: 'Advanced React & TypeScript',
        issueDate: new Date('2025-05-01'),
        credentialId: 'CERT-IHUB-2025-0042',
        recipientName: 'Alex Mugenzi',
        signerName: 'System Administrator',
        signerSignature: 'https://api.dicebear.com/7.x/avataaars/svg?seed=signature',
        status: 'issued',
        grade: 88,
        progress: 100,
        requirements: [
          { title: 'Complete all lessons', completed: true, current: 15, total: 15 },
          { title: 'Pass final exam (score >= 70%)', completed: true, current: 88, total: 100 },
          { title: 'Submit capstone project', completed: true, current: 1, total: 1 },
        ],
      });

      // In-progress certificate
      await Certificate.create({
        userId: studentId,
        courseId: new mongoose.Types.ObjectId(courseIds[0]),
        courseTitle: 'Full-Stack Web Development',
        status: 'in_progress',
        progress: 75,
        requirements: [
          { title: 'Complete all lessons', completed: true, current: 20, total: 24 },
          { title: 'Pass all quizzes (avg >= 70%)', completed: true, current: 76, total: 100 },
          { title: 'Submit final project', completed: false, current: 0, total: 1 },
          { title: 'Peer review participation', completed: true, current: 3, total: 3 },
        ],
      });

      console.log('✅ Created 2 certificates (1 issued, 1 in-progress)');
    } else {
      console.log('⚠️ Certificates already exist — skipping');
    }

    // ── 12. Add activity log entries ──
    const activityCount = (await User.findById(studentId).select('activityLog'))?.activityLog?.length || 0;
    if (activityCount === 0) {
      const activities = [
        { action: 'LOGIN', details: 'User logged in', timestamp: new Date(Date.now() - 3600000) },
        { action: 'COMPLETE_LESSON', details: 'Completed lesson: React Hooks Deep Dive', timestamp: new Date(Date.now() - 7200000) },
        { action: 'SUBMIT_ASSIGNMENT', details: 'Submitted assignment: API Integration', timestamp: new Date(Date.now() - 86400000) },
        { action: 'VIEW_GRADE', details: 'Viewed quiz results: 85%', timestamp: new Date(Date.now() - 172800000) },
        { action: 'START_PROJECT', details: 'Started project: Task Management API', timestamp: new Date(Date.now() - 259200000) },
        { action: 'JOIN_INTERNSHIP', details: 'Joined Software Development Internship', timestamp: new Date('2025-03-01') },
        { action: 'COMPLETE_COURSE', details: 'Completed course: Advanced React & TypeScript', timestamp: new Date('2025-05-01') },
      ];

      await User.findByIdAndUpdate(studentId, {
        $push: { activityLog: { $each: activities } },
      });
      console.log('✅ Added activity log entries');
    } else {
      console.log('⚠️ Activity log already exists — skipping');
    }

    console.log('\n🎉 User Report seed complete!');
    console.log('\n📋 Test credentials:');
    console.log('   Super Admin: admin@ihub.com / Admin@123');
    console.log('   Admin:        admin2@ihub.com / Admin@123');
    console.log('   Test Student: student@test.com / Student@123');
    console.log('\n📊 Report data created:');
    console.log('   - 1 student user with full profile');
    console.log('   - 3 actual Course documents');
    console.log('   - 3 enrolled courses with lesson progress');
    console.log('   - Multiple quiz/exam grades');
    console.log('   - Assignment submissions with statuses');
    console.log('   - 2 projects with tasks and grades');
    console.log('   - 1 internship with sprint reviews & milestones');
    console.log('   - 2 certificates (1 issued + 1 in-progress)');
    console.log('   - Activity log entries');
    console.log(`\n🔗 URL to test:`);
    console.log(`   /portal/super-admin/user-report/${studentId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  }
}

seedUserReportData();
