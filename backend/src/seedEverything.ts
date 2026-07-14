/**
 * 🌱 EVERYTHING SEED — seeds every feature of the platform
 *
 * Run: npx ts-node src/seedEverything.ts
 *
 * This script finds existing users in the database and creates at least one
 * record for every feature of the platform. It uses upsert patterns so it
 * can be safely re-run without creating duplicates.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';

dotenv.config();

// ─── Model Imports ────────────────────────────────────────────────────────────
import { User } from './models/User';
import { Course } from './models/Course';
import { CourseProgress } from './models/CourseProgress';
import { CourseApplication } from './models/CourseApplication';
import { AssignmentSubmission } from './models/AssignmentSubmission';
import { Question } from './models/Question';
import { Project } from './models/Project';
import { ProjectTask } from './models/ProjectTask';
import { ProjectApplication } from './models/ProjectApplication';
import { ProjectOnboarding } from './models/ProjectOnboarding';
import { Certificate } from './models/Certificate';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { InternshipApplication } from './models/internship/InternshipApplication';
import { InternshipProject } from './models/internship/InternshipProject';
import { InternshipTeam } from './models/internship/Team';
import { InternshipTeamMember } from './models/internship/TeamMember';
import { InternshipMilestone } from './models/internship/Milestone';
import { InternshipSubmission } from './models/internship/Submission';
import { InternshipSprint } from './models/internship/Sprint';
import { InternshipTask } from './models/internship/Task';
import { InternshipPayment } from './models/internship/Payment';
import { InternshipInvoice } from './models/internship/Invoice';
import { InternshipCertificate } from './models/internship/Certificate';
import { InternshipMeeting } from './models/internship/InternshipMeeting';
import { InternshipMentorFeedback } from './models/internship/MentorFeedback';
import { InternshipActivityLog } from './models/internship/ActivityLog';
import { Standup } from './models/Standup';
import { Payment } from './models/Payment';
import { Booking } from './models/Booking';
import { Badge } from './models/Badge';
import { Scholarship } from './models/Scholarship';
import Notification from './models/Notification';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { Config } from './models/Config';
import { Resource } from './models/Resource';
import { StudentProfile } from './models/StudentProfile';
import RefundRequest from './models/RefundRequest';
import { ApplicationPhase } from './models/ApplicationPhase';
import AdminAuditLog from './models/AdminAuditLog';
import UploadLog from './models/UploadLog';
import ScheduledBroadcast from './models/ScheduledBroadcast';
import { UserAssignedTask } from './models/UserAssignedTask';
import { ModuleAssignment } from './models/ModuleAssignment';
import { NewsletterSubscription } from './models/NewsletterSubscription';
import BlogCategory from './models/BlogCategory';
import Blog from './models/Blog';
import { CommissionDisbursement } from './models/CommissionDisbursement';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

function makeLesson(title: string, type: string = 'video', order: number = 1) {
  return {
    title,
    content: `## ${title}\n\nLesson content for **${title}**. This covers key concepts and practical examples.`,
    duration: randomInt(10, 45),
    type,
    videoUrl: type === 'video' ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : null,
    order,
  };
}

// ─── Main Seeder ──────────────────────────────────────────────────────────────

async function seedEverything() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // ── 0. Find or Create Reference Users ──────────────────────────────────
    console.log('━━━ STEP 0: Reference Users ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const hashedPw = await bcrypt.hash('password123', 10);

    const upsertUser = async (fields: any) => {
      // Remove any stale users from previous seed runs that share one unique key
      // but differ on the other (they'd cause E11000 on the unique index)
      await User.deleteMany({
        $or: [
          { email: fields.email, username: { $ne: fields.username } },
          { username: fields.username, email: { $ne: fields.email } },
        ]
      });
      // Now safe to upsert by email
      return await User.findOneAndUpdate(
        { email: fields.email },
        { $set: { ...fields, password: hashedPw } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    };

    const superAdmin = await upsertUser({
      username: 'super_admin', email: 'superadmin@bootskills.com', role: 'super_admin',
      fullName: 'System Super Admin', password: hashedPw,
    });
    const admin = await upsertUser({
      username: 'admin_user', email: 'admin@bootskills.com', role: 'admin',
      fullName: 'Platform Administrator', password: hashedPw,
    });
    const admin2 = await upsertUser({
      username: 'second_admin', email: 'admin2@bootskills.com', role: 'admin',
      fullName: 'Second Admin', password: hashedPw,
    });
    const trainer = await upsertUser({
      username: 'trainer_john', email: 'trainer@bootskills.com', role: 'trainer',
      fullName: 'John Trainer', password: hashedPw,
    });
    const trainer2 = await upsertUser({
      username: 'trainer_sarah', email: 'trainer2@bootskills.com', role: 'trainer',
      fullName: 'Sarah Trainer', password: hashedPw,
    });
    const student1 = await upsertUser({
      username: 'alice_student', email: 'alice@student.com', role: 'student',
      fullName: 'Alice Student', password: hashedPw,
    });
    const student2 = await upsertUser({
      username: 'bob_student', email: 'bob@student.com', role: 'student',
      fullName: 'Bob Student', password: hashedPw,
    });
    const student3 = await upsertUser({
      username: 'carol_student', email: 'carol@student.com', role: 'student',
      fullName: 'Carol Student', password: hashedPw,
    });
    const clientUser = await upsertUser({
      username: 'client_user', email: 'client@example.com', role: 'client',
      fullName: 'Client User', password: hashedPw,
    });
    const devUser = await upsertUser({
      username: 'dev_user', email: 'dev@example.com', role: 'trainer',
      fullName: 'Developer User', password: hashedPw,
    });

    const allStudents = [student1, student2, student3];
    const allTrainers = [trainer, trainer2];
    const allAdmins = [admin, admin2];
    console.log(`   ✅ ${9} reference users ready`);

    // ── 1. Courses (with modules & lessons) ────────────────────────────────
    console.log('\n━━━ STEP 1: Courses ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const courseData = [
      { title: 'Web Development Fundamentals', description: 'Learn HTML, CSS, and JavaScript.', price: 75000, category: 'Web Development', level: 'Beginner' },
      { title: 'Data Science & Analytics', description: 'Python-based data analysis.', price: 120000, category: 'Data Science', level: 'Intermediate' },
      { title: 'React Native Mobile Apps', description: 'Cross-platform mobile development.', price: 95000, discountPrice: 75000, category: 'Mobile Development', level: 'Intermediate' },
      { title: 'Advanced Cloud Computing with AWS', description: 'Deploy and scale on AWS.', price: 25000, category: 'Technology', level: 'Advanced' },
      { title: 'UI/UX Design Masterclass', description: 'Figma to production design.', price: 18000, discountPrice: 15000, category: 'Design', level: 'Intermediate' },
      { title: 'Artificial Intelligence & ML Basics', description: 'AI/ML algorithms in Python.', price: 0, category: 'AI', level: 'Beginner' },
    ];

    const createdCourses: any[] = [];
    for (const cd of courseData) {
      const existing = await Course.findOne({ title: cd.title });
      if (existing) {
        console.log(`   ⏭️  Course exists: ${cd.title}`);
        createdCourses.push(existing);
        continue;
      }
      const course = await new Course({
        ...cd,
        instructor: randomElement(allTrainers)._id,
        createdBy: randomElement(allAdmins)._id,
        status: 'published',
        enrollmentMode: 'direct',
        school: 'Bootskills Academy',
        modules: [
          {
            title: `${cd.title} - Module 1: Foundations`,
            description: 'Core concepts and fundamentals.',
            lessons: [makeLesson('Introduction & Setup', 'video', 1), makeLesson('Core Concepts', 'article', 2), makeLesson('First Project', 'assignment', 3)],
          },
          {
            title: `${cd.title} - Module 2: Advanced Topics`,
            description: 'Deep dive into advanced techniques.',
            lessons: [makeLesson('Advanced Theory', 'video', 1), makeLesson('Practical Exercise', 'quiz', 2), makeLesson('Final Assessment', 'assignment', 3)],
          },
        ],
        modulesCount: 2,
        totalLessonsCount: 6,
        studentsEnrolled: [],
      }).save();
      console.log(`   ✅ Created course: ${cd.title}`);
      createdCourses.push(course);
    }

    // ── 2. Enrollments & Progress ──────────────────────────────────────────
    console.log('\n━━━ STEP 2: Enrollments & Progress ─━━━━━━━━━━━━━━━━━━━━');
    for (const course of createdCourses) {
      for (const student of allStudents) {
        if (!course.studentsEnrolled.some((s: any) => s.toString() === student._id.toString())) {
          course.studentsEnrolled.push(student._id);
        }
        await CourseProgress.findOneAndUpdate(
          { userId: student._id, courseId: course._id },
          { $setOnInsert: { userId: student._id, courseId: course._id, totalTimeSpent: randomInt(100, 3000), overallProgress: randomInt(10, 90), status: 'active', lessons: [] } },
          { upsert: true }
        );
      }
      await course.save();
    }
    console.log(`   ✅ ${allStudents.length} students enrolled in ${createdCourses.length} courses`);

    // ── 3. Course Applications ─────────────────────────────────────────────
    console.log('\n━━━ STEP 3: Course Applications ─━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const appCourse = createdCourses[0];
      const existing = await CourseApplication.findOne({ userId: student._id, courseId: appCourse._id });
      if (!existing) {
        await new CourseApplication({
          userId: student._id, courseId: appCourse._id,
          status: 'pending', selectedDeliveryMode: 'online',
          applicationAnswers: [{ questionLabel: 'Why join?', answer: 'I want to learn web development.' }],
        }).save();
      }
    }
    console.log(`   ✅ ${allStudents.length} course applications created`);

    // ── 4. Quiz Questions ──────────────────────────────────────────────────
    console.log('\n━━━ STEP 4: Quiz Questions ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const course of createdCourses) {
      const existing = await Question.findOne({ courseId: course._id });
      if (!existing) {
        await new Question({
          courseId: course._id,
          questionText: `What is the primary focus of "${course.title}"?`,
          options: ['Theory', 'Practical Skills', 'History', 'All of the above'],
          correctOptionIndex: 3,
          explanation: 'This course covers both theoretical and practical aspects.',
        }).save();
        await new Question({
          courseId: course._id,
          questionText: `Which skill is most important for ${course.title}?`,
          options: ['Problem Solving', 'Memory', 'Speed Reading', 'Typing'],
          correctOptionIndex: 0,
          explanation: 'Problem solving is the foundation of all technical skills.',
        }).save();
      }
    }
    console.log(`   ✅ Quiz questions for ${createdCourses.length} courses`);

    // ── 5. Assignment Submissions ──────────────────────────────────────────
    console.log('\n━━━ STEP 5: Assignment Submissions ─━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const course = createdCourses[0];
      const lessonId = course.modules?.[0]?.lessons?.[2]?._id?.toString() || 'lesson-1';
      const existing = await AssignmentSubmission.findOne({ userId: student._id, courseId: course._id });
      if (!existing) {
        await new AssignmentSubmission({
          userId: student._id, courseId: course._id, lessonId,
          content: 'https://github.com/student/project',
          status: randomElement(['pending', 'approved', 'reviewed']),
          grade: randomInt(60, 100),
          feedback: 'Good work! Consider improving the documentation.',
          answers: [{ questionId: 'q1', answerText: 'My answer', score: 85, aiFeedback: 'Well reasoned.' }],
          totalScore: randomInt(70, 100),
        }).save();
      }
    }
    console.log(`   ✅ ${allStudents.length} assignment submissions`);

    // ── 6. Projects ────────────────────────────────────────────────────────
    console.log('\n━━━ STEP 6: Projects ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const projectData = [
      { title: 'E-Commerce Platform', course: createdCourses[0]?.title || 'Web Development', type: 'Team Project', description: 'Build a full e-commerce platform.' },
      { title: 'Sales Dashboard', course: createdCourses[1]?.title || 'Data Science', type: 'Individual', description: 'Create an interactive dashboard.' },
      { title: 'Fitness Tracker App', course: createdCourses[2]?.title || 'Mobile Dev', type: 'Individual', description: 'Cross-platform fitness app.' },
    ];
    for (const pd of projectData) {
      const existing = await Project.findOne({ title: pd.title });
      if (!existing) {
        const student = randomElement(allStudents);
        await new Project({
          title: pd.title, course: pd.course, type: pd.type, description: pd.description,
          userId: student._id, status: randomElement(['in_progress', 'pending_review']),
          progress: randomInt(20, 90), mentors: [randomElement(allTrainers)._id],
          team: [{ userId: student._id, name: student.fullName, role: 'Developer' }],
          tasks: [
            { id: 'task-1', title: 'Setup project', completed: true },
            { id: 'task-2', title: 'Implement features', completed: Math.random() > 0.5 },
            { id: 'task-3', title: 'Testing', completed: false },
          ],
          milestones: [{ title: 'MVP', dueDate: daysFromNow(14), completed: Math.random() > 0.5 }],
        }).save();
        console.log(`   ✅ Created project: ${pd.title}`);
      } else {
        console.log(`   ⏭️  Project exists: ${pd.title}`);
      }
    }

    // ── 7. Project Tasks (Kanban) ──────────────────────────────────────────
    console.log('\n━━━ STEP 7: Project Tasks ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const projects = await Project.find({});
    for (const project of projects) {
      const existing = await ProjectTask.findOne({ projectId: project._id });
      if (!existing) {
        await new ProjectTask({
          projectId: project._id, title: 'Design database schema', description: 'Design the initial DB schema.',
          status: randomElement(['todo', 'in_progress', 'done']), priority: randomElement(['high', 'medium', 'low']),
          assigneeId: randomElement(allStudents)._id, order: 1,
        }).save();
        await new ProjectTask({
          projectId: project._id, title: 'Implement API endpoints', description: 'Build RESTful API.',
          status: 'todo', priority: 'high', assigneeId: randomElement(allStudents)._id, order: 2,
        }).save();
        console.log(`   ✅ Project tasks for: ${project.title}`);
      }
    }

    // ── 8. Certificates ────────────────────────────────────────────────────
    console.log('\n━━━ STEP 8: Certificates ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const course = createdCourses[0];
      const existing = await Certificate.findOne({ userId: student._id, courseId: course._id });
      if (!existing) {
        await new Certificate({
          userId: student._id, courseId: course._id, courseTitle: course.title,
          status: 'issued', issueDate: daysAgo(randomInt(5, 30)),
          credentialId: `CERT-${Date.now()}-${student._id.toString().slice(-6)}`,
          grade: randomInt(70, 100), progress: 100,
          recipientName: student.fullName,
          signerName: 'Super Admin', signerSignature: 'SA',
        }).save();
      }
    }
    console.log(`   ✅ ${allStudents.length} certificates issued`);

    // ── 9. Internship Programs ─────────────────────────────────────────────
    console.log('\n━━━ STEP 9: Internship Programs ─━━━━━━━━━━━━━━━━━━━━━━');
    const programData = [
      { title: 'Full Stack Engineering Internship', description: 'Build production-grade applications.', price: 100000, duration: '3 months' },
      { title: 'Data Analytics Internship', description: 'Drive decisions with data.', price: 0, duration: '2 months' },
    ];
    const createdPrograms: any[] = [];
    for (const pd of programData) {
      const existing = await InternshipProgram.findOne({ title: pd.title });
      if (existing) {
        createdPrograms.push(existing);
        console.log(`   ⏭️  Program exists: ${pd.title}`);
        continue;
      }
      const program = await new InternshipProgram({
        ...pd,
        createdBy: randomElement(allAdmins)._id,
        startDate: daysFromNow(7), endDate: daysFromNow(97),
        applicationDeadline: daysFromNow(5),          eligibility: 'JavaScript, Teamwork', maxSpots: 20,
        currency: 'RWF', status: 'active',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
      }).save();
      console.log(`   ✅ Created program: ${pd.title}`);
      createdPrograms.push(program);
    }

    // ── 10. Internship Applications ─────────────────────────────────────────
    console.log('\n━━━ STEP 10: Internship Applications ─━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      if (createdPrograms.length === 0) break;
      const program = createdPrograms[0];
      const existing = await InternshipApplication.findOne({ userId: student._id, internshipProgramId: program._id });
      if (!existing) {
        await new InternshipApplication({
          userId: student._id, internshipProgramId: program._id,
          status: randomElement(['pending', 'approved']),
          skills: ['JavaScript', 'React'], availability: 'full_time',
        }).save();
      }
    }
    console.log(`   ✅ Internship applications created`);

    // ── 11. Internship Projects & Milestones ───────────────────────────────
    console.log('\n━━━ STEP 11: Internship Projects ─━━━━━━━━━━━━━━━━━━━━━');
    if (createdPrograms.length > 0) {
      const existingProject = await InternshipProject.findOne({ internshipProgramId: createdPrograms[0]._id });
      if (!existingProject) {
        const ip = await new InternshipProject({
          internshipProgramId: createdPrograms[0]._id,
          title: 'Microservices Migration', description: 'Break monolith into microservices.',
          requiredSkills: ['Node.js', 'Docker'], status: 'published',
          teamSizeRange: { min: 2, max: 4 },
        }).save();
        console.log(`   ✅ Created internship project`);

        // Milestones
        await InternshipMilestone.findOneAndUpdate(
          { internshipProjectId: ip._id, order: 1 },
          { $set: { title: 'System Analysis', description: 'Document the current system.', deadline: daysFromNow(14), order: 1 } },
          { upsert: true, new: true }
        );
        await InternshipMilestone.findOneAndUpdate(
          { internshipProjectId: ip._id, order: 2 },
          { $set: { title: 'Service Implementation', description: 'Implement services.', deadline: daysFromNow(28), order: 2 } },
          { upsert: true, new: true }
        );
        console.log(`   ✅ Created milestones`);
      }
    }

    // ── 12. Internship Teams ───────────────────────────────────────────────
    console.log('\n━━━ STEP 12: Internship Teams ─━━━━━━━━━━━━━━━━━━━━━━━');
    if (createdPrograms.length > 0) {
      const ip = await InternshipProject.findOne({ internshipProgramId: createdPrograms[0]._id });
      if (ip) {
        const existing = await InternshipTeam.findOne({ internshipProjectId: ip._id });
        if (!existing) {
          const team = await new InternshipTeam({
            internshipProgramId: createdPrograms[0]._id,
            internshipProjectId: ip._id, name: 'Team Alpha',
            status: 'active', mentorId: randomElement(allTrainers)._id,
          }).save();
          for (const student of allStudents) {
            await InternshipTeamMember.findOneAndUpdate(
              { teamId: team._id, userId: student._id },
              { $set: { role: student === student1 ? 'lead' : 'member', joinedAt: new Date() } },
              { upsert: true }
            );
          }
          console.log(`   ✅ Created team with ${allStudents.length} members`);
        }
      }
    }

    // ── 13. Internship Sprints & Tasks ─────────────────────────────────────
    console.log('\n━━━ STEP 13: Internship Sprints & Tasks ─━━━━━━━━━━━━━');
    const team = await InternshipTeam.findOne({});
    if (team) {
      const existingSprint = await InternshipSprint.findOne({ teamId: team._id });
      if (!existingSprint) {
        const sprint = await new InternshipSprint({
          projectId: team.internshipProjectId, teamId: team._id,
          title: 'Sprint 1: Foundation', goal: 'Set up project infrastructure.',
          startDate: daysAgo(7), endDate: daysFromNow(7), status: 'active', order: 1,
        }).save();
        for (let i = 0; i < 3; i++) {
          await InternshipTask.findOneAndUpdate(
            { sprintId: sprint._id, title: `Task ${i + 1}` },
            { $set: {
              projectId: team.internshipProjectId, teamId: team._id,
              title: `Task ${i + 1}: ${['Setup CI/CD', 'Create API', 'Write Tests'][i]}`,
              description: `Description for task ${i + 1}.`,
              status: i === 0 ? 'done' : randomElement(['todo', 'in_progress']),
              priority: randomElement(['high', 'medium']), assigneeId: randomElement(allStudents)._id,
              order: i + 1,
            }},
            { upsert: true }
          );
        }
        console.log(`   ✅ Created sprint with 3 tasks`);
      }
    }

    // ── 14. Internship Submissions ─────────────────────────────────────────
    console.log('\n━━━ STEP 14: Internship Submissions ─━━━━━━━━━━━━━━━━━');
    const milestone = await InternshipMilestone.findOne({});
    const foundTeam = await InternshipTeam.findOne({});
    if (milestone && foundTeam && student1) {
      const existing = await InternshipSubmission.findOne({ milestoneId: milestone._id, teamId: foundTeam._id });
      if (!existing) {
        await new InternshipSubmission({
          milestoneId: milestone._id, teamId: foundTeam._id, userId: student1._id,
          contentUrl: 'https://github.com/team/project', description: 'Submitted milestone work.',
          status: 'approved', feedback: 'Great work! Keep it up.',
        }).save();
        console.log(`   ✅ Created internship submission`);
      }
    }

    // ── 15. Internship Payments & Invoices ─────────────────────────────────
    console.log('\n━━━ STEP 15: Internship Payments ─━━━━━━━━━━━━━━━━━━━━');
    if (createdPrograms.length > 0) {
      for (const student of allStudents) {
        const existing = await InternshipPayment.findOne({ userId: student._id, internshipProgramId: createdPrograms[0]._id });
        if (!existing) {
          const payment = await new InternshipPayment({
            userId: student._id, internshipProgramId: createdPrograms[0]._id,
            amount: 100000, currency: 'RWF',
            status: randomElement(['paid', 'waived']),
            paymentMethod: 'Mobile Money', paidAt: daysAgo(randomInt(5, 20)),
          }).save();
          await InternshipInvoice.findOneAndUpdate(
            { paymentId: payment._id },
            { $set: {
              userId: student._id, internshipProgramId: createdPrograms[0]._id,
              amount: 100000, currency: 'RWF',
              invoiceNumber: `INV-${Date.now()}-${student._id.toString().slice(-4)}`,
              issuedAt: new Date(), dueDate: daysFromNow(30), status: 'sent',
              items: [{ description: 'Tuition Fee', quantity: 1, unitPrice: 100000, total: 100000 }],
            }},
            { upsert: true }
          );
        }
      }
      console.log(`   ✅ Internship payments & invoices created`);
    }

    // ── 16. Internship Certificates ────────────────────────────────────────
    console.log('\n━━━ STEP 16: Internship Certificates ─━━━━━━━━━━━━━━━━');
    const program = createdPrograms[0];
    if (program) {
      for (const student of allStudents) {
        const existing = await InternshipCertificate.findOne({ userId: student._id, internshipProgramId: program._id });
        if (!existing) {
          await new InternshipCertificate({
            userId: student._id, internshipProgramId: program._id,
            teamId: team?._id || new mongoose.Types.ObjectId(),
            certificateNumber: `INT-CERT-${Date.now()}-${student._id.toString().slice(-6)}`,
            issuedAt: new Date(), trainerId: randomElement(allTrainers)._id,
            trainerName: randomElement(allTrainers).fullName,
            internTitle: 'Software Engineering Intern', programTitle: program.title,
            duration: '3 months', startDate: daysAgo(90), endDate: new Date(),
            completionDate: new Date(),
          }).save();
        }
      }
      console.log(`   ✅ Internship certificates created`);
    }

    // ── 17. Student Profiles ───────────────────────────────────────────────
    console.log('\n━━━ STEP 17: Student Profiles ─━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      await StudentProfile.findOneAndUpdate(
        { userId: student._id },
        { $set: {
          school: 'University of Rwanda', educationLevel: 'undergraduate',
          fieldOfStudy: 'Computer Science', skills: ['JavaScript', 'Python', 'React'],
          availability: 'full_time', bio: 'Aspiring software engineer.',
          city: 'Kigali', sector: 'Nyarugenge',
        }},
        { upsert: true }
      );
    }
    console.log(`   ✅ ${allStudents.length} student profiles`);

    // ── 18. Bookings ───────────────────────────────────────────────────────
    console.log('\n━━━ STEP 18: Bookings ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const existing = await Booking.findOne({ userId: student._id });
      if (!existing) {
        await new Booking({
          userId: student._id, mentorId: randomElement(allTrainers)._id,
          type: 'mentorship', date: daysFromNow(randomInt(1, 14)).toISOString().split('T')[0],
          time: '14:00', topic: randomElement(['Project Review', 'Career Guidance', 'Code Review']),
          status: randomElement(['confirmed', 'pending']), deliveryMode: 'online',
        }).save();
      }
    }
    console.log(`   ✅ ${allStudents.length} bookings`);

    // ── 19. Badges ─────────────────────────────────────────────────────────
    console.log('\n━━━ STEP 19: Badges ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const badgeData = [
      { title: 'Quick Starter', description: 'Completed first course.', icon: '🚀', category: 'achievement' },
      { title: 'Code Master', description: 'Submitted 10 assignments.', icon: '💻', category: 'skill' },
    ];
    for (const bd of badgeData) {
      await Badge.findOneAndUpdate(
        { title: bd.title },
        { $set: { ...bd, createdBy: superAdmin._id } },
        { upsert: true }
      );
    }
    console.log(`   ✅ ${badgeData.length} badges`);

    // ── 20. Scholarships ───────────────────────────────────────────────────
    console.log('\n━━━ STEP 20: Scholarships ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const scholarshipStatuses: ('pending' | 'active' | 'revoked')[] = ['active', 'pending', 'revoked'];
    const reasonPool = ['Merit-based', 'Financial aid', 'Community program', 'Women in Tech'];

    if (createdCourses.length > 0) {
      for (let i = 0; i < Math.min(allStudents.length, 3); i++) {
        const student = allStudents[i];
        const course = createdCourses[i % createdCourses.length];
        const status = scholarshipStatuses[i];
        const existing = await Scholarship.findOne({ userId: student._id, type: 'course', itemId: course._id });
        if (!existing) {
          await new Scholarship({
            userId: student._id, grantedBy: randomElement(allAdmins)._id,
            type: 'course', itemId: course._id, itemTitle: course.title,
            status, reason: reasonPool[i],
            grantedLatitude: -1.9441, grantedLongitude: 30.0619,
            grantedCity: 'Kigali', grantedCountry: 'Rwanda',
            ...(status === 'revoked' ? {
              revokedAt: daysAgo(10), revokedBy: superAdmin._id,
              revokedReason: 'Did not meet eligibility criteria',
            } : {}),
            ...(status === 'active' && i === 0 ? {
              approvedAt: daysAgo(5), approvedBy: superAdmin._id,
            } : {}),
          }).save();
        }
      }
      console.log(`   ✅ Scholarships created`);
    }

    // ── 21. Notifications ──────────────────────────────────────────────────
    console.log('\n━━━ STEP 21: Notifications ─━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const existing = await Notification.findOne({ userId: student._id });
      if (!existing) {
        await new Notification({
          userId: student._id, type: 'WELCOME', title: 'Welcome to Bootskills!',
          message: 'Start your learning journey today.', link: '/explore',
          read: Math.random() > 0.5,
        }).save();
        await new Notification({
          userId: student._id, type: 'COURSE_UPDATE', title: 'New Course Available',
          message: 'Check out our latest courses.', link: '/explore',
          read: false,
        }).save();
      }
    }
    console.log(`   ✅ ${allStudents.length * 2} notifications`);

    // ── 22. Conversations & Messages ──────────────────────────────────────
    console.log('\n━━━ STEP 22: Messages ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const existing = await Conversation.findOne({ participants: { $all: [superAdmin._id, student._id] } });
      if (!existing) {
        const conv = await new Conversation({
          participants: [superAdmin._id, student._id],
          updatedAt: new Date(),
        }).save();
        const msg = await new Message({
          conversationId: conv._id, sender: superAdmin._id,
          content: `Welcome ${student.fullName}! How can I help you today?`,
        }).save();
        conv.lastMessage = msg._id;
        await conv.save();
      }
    }
    console.log(`   ✅ Conversations & messages created`);

    // ── 23. System Configs ─────────────────────────────────────────────────
    console.log('\n━━━ STEP 23: Configs ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const configs = [
      { key: 'siteName', value: 'Bootskills', description: 'Platform display name' },
      { key: 'primaryColor', value: '#D4AF37', description: 'Primary brand color' },
      { key: 'maintenanceMode', value: 'false', description: 'Enable maintenance mode' },
      { key: 'platformCommission', value: '10', description: 'Platform commission percentage' },
      { key: 'holdDays', value: '14', description: 'Disbursement hold period in days' },
    ];
    for (const c of configs) {
      await Config.findOneAndUpdate(
        { key: c.key },
        { $set: c },
        { upsert: true }
      );
    }
    console.log(`   ✅ ${configs.length} configs`);

    // ── 24. Resources ──────────────────────────────────────────────────────
    console.log('\n━━━ STEP 24: Resources ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const resourceData = [
      { title: 'Getting Started Guide', type: 'pdf', source: 'internal', url: 'https://docs.bootskills.com/guide', visibility: 'public' },
      { title: 'API Documentation', type: 'link', source: 'internal', url: 'https://api.bootskills.com/docs', visibility: 'interns_only' },
    ];
    for (const rd of resourceData) {
      await Resource.findOneAndUpdate(
        { title: rd.title },
        { $set: { ...rd, createdBy: superAdmin._id } },
        { upsert: true }
      );
    }
    console.log(`   ✅ ${resourceData.length} resources`);

    // ── 25. Blogs & Categories ─────────────────────────────────────────────
    console.log('\n━━━ STEP 25: Blogs ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const blogCat = await BlogCategory.findOneAndUpdate(
      { name: 'Technology' },
      { $set: { description: 'Tech-related articles and updates.' } },
      { upsert: true, new: true }
    );
    const existingBlog = await Blog.findOne({ title: 'Welcome to Bootskills' });
    if (!existingBlog) {
      await new Blog({
        title: 'Welcome to Bootskills',
        slug: 'welcome-to-bootskills',
        content: 'This is the first blog post on our platform.',
        category: blogCat._id, author: superAdmin._id,
        authorName: superAdmin.fullName,
        status: 'published', tags: ['education', 'technology'],
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
      }).save();
    }
    console.log(`   ✅ Blog category & post created`);

    // ── 26. Standups ───────────────────────────────────────────────────────
    console.log('\n━━━ STEP 26: Standups ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const foundInternshipTeam = await InternshipTeam.findOne({});
    if (foundInternshipTeam) {
      for (const member of allStudents) {
        const existing = await Standup.findOne({ userId: member._id, teamId: foundInternshipTeam._id });
        if (!existing) {
          await new Standup({
            userId: member._id, internshipId: foundInternshipTeam._id,
            date: daysAgo(1), yesterday: 'Worked on task 1.', today: 'Starting task 2.',
            blockers: 'None', attendanceStatus: 'present',
          }).save();
        }
      }
      console.log(`   ✅ Standups created`);
    }

    // ── 27. Refund Requests ────────────────────────────────────────────────
    console.log('\n━━━ STEP 27: Refund Requests ─━━━━━━━━━━━━━━━━━━━━━━━');
    const aPayment = await Payment.findOne({});
    if (aPayment) {
      const existing = await RefundRequest.findOne({ paymentId: aPayment._id });
      if (!existing) {
        await new RefundRequest({
          paymentId: aPayment._id, userId: student1._id,
          itemIds: [aPayment.courseId || new mongoose.Types.ObjectId()],
          itemTypes: ['course'], amount: aPayment.amount || 50000,
          currency: 'RWF', reason: 'Course not as described.',
          status: 'pending', requestedBy: student1._id,
        }).save();
        console.log(`   ✅ Refund request created`);
      }
    }

    // ── 28. Application Phases ─────────────────────────────────────────────
    console.log('\n━━━ STEP 28: Application Phases ─━━━━━━━━━━━━━━━━━━━━');
    if (createdPrograms.length > 0) {
      const existing = await ApplicationPhase.findOne({ programId: createdPrograms[0]._id });
      if (!existing) {
        await new ApplicationPhase({
          programId: createdPrograms[0]._id, name: 'Application Review',
          description: 'Review applicant qualifications.', order: 1,
          requiredDeliverables: [{ type: 'cv', name: 'CV', required: true }],
          enableApproval: true, notificationOnCompletion: true,
        }).save();
        await new ApplicationPhase({
          programId: createdPrograms[0]._id, name: 'Technical Interview',
          description: 'Assess technical skills.', order: 2,
          requiredDeliverables: [{ type: 'portfolio', name: 'Portfolio', required: true }],
          enableApproval: true, isInterviewPhase: true,
        }).save();
        console.log(`   ✅ Application phases created`);
      }
    }

    // ── 29. Admin Audit Log ────────────────────────────────────────────────
    console.log('\n━━━ STEP 29: Audit Log ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const existingLog = await AdminAuditLog.findOne({});
    if (!existingLog) {
      await new AdminAuditLog({
        adminId: superAdmin._id, action: 'SEED_DATA',
        target: 'System', targetId: 'seed', details: 'Seeded platform data.',
      }).save();
      console.log(`   ✅ Audit log entry created`);
    }

    // ── 30. Upload Log ─────────────────────────────────────────────────────
    console.log('\n━━━ STEP 30: Upload Log ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const existingUpload = await UploadLog.findOne({});
    if (!existingUpload) {
      await new UploadLog({
        adminId: superAdmin._id, adminUsername: superAdmin.username,
        fileName: 'sample-avatar.png', fileSize: 102400,
        mimeType: 'image/png', url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
        type: 'image', action: 'upload',
      }).save();
      console.log(`   ✅ Upload log created`);
    }

    // ── 31. Scheduled Broadcast ───────────────────────────────────────────
    console.log('\n━━━ STEP 31: Scheduled Broadcast ─━━━━━━━━━━━━━━━━━━━');
    const existingBroadcast = await ScheduledBroadcast.findOne({});
    if (!existingBroadcast) {
      await new ScheduledBroadcast({
        title: 'Platform Update Announcement',
        message: 'We have new features for you! Check them out.',
        targetRole: 'student', sendEmail: false, sendNotification: true,
        scheduledAt: daysFromNow(7),        status: 'pending',
        createdBy: superAdmin._id,
      }).save();
      console.log(`   ✅ Scheduled broadcast created`);
    }

    // ── 32. User Assigned Tasks ────────────────────────────────────────────
    console.log('\n━━━ STEP 32: User Assigned Tasks ─━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      const existing = await UserAssignedTask.findOne({ userId: student._id });
      if (!existing) {
        await new UserAssignedTask({
          userId: student._id, assignedBy: superAdmin._id,
          title: 'Complete onboarding', description: 'Finish your profile setup.',
          status: randomElement(['pending', 'completed']), priority: 'high',
          checklist: [{ item: 'Upload avatar', completed: true }, { item: 'Fill bio', completed: false }],
        }).save();
      }
    }
    console.log(`   ✅ User assigned tasks created`);

    // ── 33. Module Assignments ─────────────────────────────────────────────
    console.log('\n━━━ STEP 33: Module Assignments ─━━━━━━━━━━━━━━━━━━━━');
    for (const student of allStudents) {
      if (createdCourses.length > 0) {
        const course = createdCourses[0];
        const moduleId = course.modules?.[0]?._id || new mongoose.Types.ObjectId();
        const existing = await ModuleAssignment.findOne({ studentId: student._id, courseId: course._id, moduleId });
        if (!existing) {
          await new ModuleAssignment({
            studentId: student._id, courseId: course._id, moduleId,
            status: 'pending',
          }).save();
        }
      }
    }
    console.log(`   ✅ Module assignments created`);

    // ── 34. Commission Disbursements ────────────────────────────────────────────
    console.log('\n━━━ STEP 34: Commissions ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (aPayment) {
      const existing = await CommissionDisbursement.findOne({ paymentId: aPayment._id });
      if (!existing) {
        await new CommissionDisbursement({
          paymentId: aPayment._id, customerId: student1._id,
          ownerId: admin._id, ownerPhone: '+250780000001',
          itemId: aPayment.courseId || new mongoose.Types.ObjectId(),
          itemType: 'course', grossAmount: aPayment.amount || 50000,
          platformCommission: 10, commissionType: 'percentage',
          commissionValue: 10, netAmount: (aPayment.amount || 50000) * 0.9,
          status: 'Pending', autoDisbursement: true,
        }).save();
        console.log(`   ✅ Commission disbursement created`);
      }
    }

    // ── 35. Newsletter Subscriptions ─────────────────────────────────────
    console.log('\n━━━ STEP 35: Newsletter ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const email of ['alice@student.com', 'bob@student.com', 'external@example.com']) {
      await NewsletterSubscription.findOneAndUpdate(
        { email },
        { $set: { subscribedAt: new Date() } },
        { upsert: true }
      );
    }
    console.log(`   ✅ Newsletter subscriptions created`);

    // ── 36. Internship Activity Log ──────────────────────────────────────
    console.log('\n━━━ STEP 36: Internship Activity Log ─━━━━━━━━━━━━━━━');
    if (foundInternshipTeam) {
      const existingActivityLog = await InternshipActivityLog.findOne({ targetId: foundInternshipTeam._id });
      if (!existingActivityLog) {
        await new InternshipActivityLog({
          userId: superAdmin._id, action: 'TEAM_CREATED',
          module: 'internship', targetType: 'team',
          targetId: foundInternshipTeam._id,
          details: 'Team created during seed process.',
        }).save();
        console.log(`   ✅ Internship activity log created`);
      }
    }

    // ── 37. Internship Meetings ────────────────────────────────────────────
    console.log('\n━━━ STEP 37: Internship Meetings ─━━━━━━━━━━━━━━━━━━━');
    if (foundInternshipTeam) {
      const existingMeeting = await InternshipMeeting.findOne({ teamIds: foundInternshipTeam._id });
      if (!existingMeeting) {
        await new InternshipMeeting({
          title: 'Weekly Standup', type: 'WEEKLY',
          startTime: daysFromNow(1), endTime: daysFromNow(1),
          teamIds: [foundInternshipTeam._id], mentorIds: [randomElement(allTrainers)._id],
          hostId: randomElement(allTrainers)._id, status: 'pending',
        }).save();
        console.log(`   ✅ Internship meeting created`);
      }
    }

    // ── 38. Internship Mentor Feedback ─────────────────────────────────────
    console.log('\n━━━ STEP 38: Mentor Feedback ─━━━━━━━━━━━━━━━━━━━━━━━');
    if (foundInternshipTeam) {
      for (const student of allStudents) {
        const existing = await InternshipMentorFeedback.findOne({ userId: student._id, teamId: foundInternshipTeam._id });
        if (!existing) {
          await new InternshipMentorFeedback({
            mentorId: randomElement(allTrainers)._id,
            userId: student._id, teamId: foundInternshipTeam._id,
            score: randomInt(3, 5), comments: 'Great progress this week! Keep up the momentum.',
          }).save();
        }
      }
      console.log(`   ✅ Mentor feedback created`);
    }

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`   👤 Users:             9 (super_admin, 2 admin, 2 trainer, 3 student, 1 client)`);
    console.log(`   📚 Courses:           ${createdCourses.length} courses with modules & lessons`);
    console.log(`   📝 Enrollments:       ${allStudents.length * createdCourses.length} enrollments`);
    console.log(`   📊 Course Progress:   ${allStudents.length * createdCourses.length} progress records`);
    console.log(`   🔄 Course Apps:       ${allStudents.length} course applications`);
    console.log(`   ❓ Quiz Questions:    ${createdCourses.length * 2} questions`);
    console.log(`   📋 Assignments:       ${allStudents.length} assignment submissions`);
    console.log(`   📁 Projects:          3 projects with tasks & milestones`);
    console.log(`   🎫 Project Tasks:     6 Kanban tasks`);
    console.log(`   📜 Certificates:      ${allStudents.length} course certificates`);
    console.log(`   🏗️  Internship:        2 programs, applications, projects, teams`);
    console.log(`   🎯 Sprints:           1 sprint with 3 board tasks`);
    console.log(`   💰 Internship Pay:    ${allStudents.length} payments & invoices`);
    console.log(`   🏅 Internship Certs:  ${allStudents.length} certificates`);
    console.log(`   👤 Student Profiles:  ${allStudents.length} profiles`);
    console.log(`   📅 Bookings:          ${allStudents.length} mentorship bookings`);
    console.log(`   🏆 Badges:            ${badgeData.length} badges`);
    console.log(`   🎓 Scholarships:      3 course scholarships`);
    console.log(`   🔔 Notifications:     ${allStudents.length * 2} notifications`);
    console.log(`   💬 Conversations:     ${allStudents.length} conversations`);
    console.log(`   ⚙️  Configs:           ${configs.length} system configs`);
    console.log(`   📎 Resources:         ${resourceData.length} learning resources`);
    console.log(`   📰 Blogs:             1 blog post + 1 category`);
    console.log(`   📊 Standups:          ${allStudents.length} daily standups`);
    console.log(`   ↩️  Refunds:           1 refund request`);
    console.log(`   📋 App Phases:        2 application phases`);
    console.log(`   📋 Audit Log:         1 audit entry`);
    console.log(`   📤 Upload Log:        1 upload record`);
    console.log(`   📢 Broadcasts:        1 scheduled broadcast`);
    console.log(`   📌 User Tasks:        ${allStudents.length} assigned tasks`);
    console.log(`   📚 Module Assigns:    ${allStudents.length} module assignments`);
    console.log(`   💰 Commissions:       1 commission disbursement`);
    console.log(`   📧 Newsletter:        3 subscriptions`);
    console.log(`   📋 Activity Log:      1 internship activity log`);
    console.log(`   📅 Meetings:          1 internship meeting`);
    console.log(`   💬 Mentor Feedback:   ${allStudents.length} feedback entries`);
    console.log('═'.repeat(60));
    console.log('✅ SEED COMPLETE — all features populated!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedEverything();
