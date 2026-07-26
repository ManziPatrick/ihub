/**
 * 🌱 SEED COMPREHENSIVE DEMO
 * 
 * Seeds the entire platform with rich demo data so every feature is visible.
 * Safe to re-run — uses upsert/deleteMany patterns to avoid duplicates.
 *
    level: 'Intermediate',
 *
 * Creates:
 *   👤 Users: super_admin (alainmanzi71), 2 admins, 2 trainers, 1 client, 8 students
 *   📚 Courses: 6 courses with modules, lessons, assignments, quizzes
 *   📝 Enrollments: all students in all courses with progress
 *   📋 Projects: 3 projects with Kanban tasks
 *   🏗️ Internships: 2 programs with teams, sprints, board tasks
 *   📎 Assignments: submissions with grades and feedback
 *   🏆 Badges, Notifications, Certificates, Bookings, etc.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';

dotenv.config();

// ─── Model Imports ──────────────────────────────────────────────────────────
import { User } from './models/User';
import { Course } from './models/Course';
import { CourseProgress } from './models/CourseProgress';
import { AssignmentSubmission } from './models/AssignmentSubmission';
import { Project } from './models/Project';
import { ProjectTask } from './models/ProjectTask';
import { Certificate } from './models/Certificate';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { InternshipApplication } from './models/internship/InternshipApplication';
import { InternshipProject } from './models/internship/InternshipProject';
import { InternshipTeam } from './models/internship/Team';
import { InternshipTeamMember } from './models/internship/TeamMember';
import { InternshipMilestone } from './models/internship/Milestone';
import { InternshipSprint } from './models/internship/Sprint';
import { InternshipTask } from './models/internship/Task';
import { InternshipActivityLog } from './models/internship/ActivityLog';
import { InternshipMeeting } from './models/internship/InternshipMeeting';
import { InternshipCertificate } from './models/internship/Certificate';
import { Booking } from './models/Booking';
import { Badge } from './models/Badge';
import { Scholarship } from './models/Scholarship';
import Notification from './models/Notification';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import AdminAuditLog from './models/AdminAuditLog';
import { Payment } from './models/Payment';
import { ApplicationPhase } from './models/ApplicationPhase';
import { StudentProfile } from './models/StudentProfile';
import { Config } from './models/Config';
import { UserAssignedTask } from './models/UserAssignedTask';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const contentTemplates = [
  (title: string) => `## ${title}\n\nIn this lesson, we explore the fundamentals of **${title}**. You will learn through hands-on examples and practical exercises designed to build real-world skills.`,
  (title: string) => `## ${title}\n\nWelcome to **${title}**! This session covers essential concepts, best practices, and step-by-step guidance to help you master this topic.`,
  (title: string) => `## ${title}\n\n**${title}** is a key topic in this course. This lesson breaks down complex ideas into simple, actionable steps with clear examples and practical applications.`,
  (title: string) => `## ${title}\n\nLet's dive into **${title}**. This lesson combines theory with practice, giving you the knowledge and skills to apply what you've learned in real projects.`,
  (title: string) => `## ${title}\n\nThis lesson on **${title}** provides a comprehensive overview including key definitions, practical demonstrations, and self-assessment questions to reinforce learning.`,
];

function makeLesson(
  title: string,
  type: 'video' | 'article' | 'assignment' | 'quiz' | 'code' = 'video',
  duration: number = randomInt(10, 45),
  opts: { isAssignment?: boolean; assignmentDescription?: string } = {},
) {
  const templateIndex = title.length % contentTemplates.length;
  const lesson: any = {
    title,
    content: contentTemplates[templateIndex](title),
    duration,
    // Use a schema-compatible lesson type; code exercises are stored in `codeExercises`
    type: type === 'code' ? 'challenge' : type,
    videoUrl: type === 'video' ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : undefined,
    order: 1,
  };
  if (type === 'code') {
    lesson.codeExercises = [
      {
        id: `code-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        title: `${title} — Interactive Exercise`,
        description: `Complete the interactive coding task for ${title}.`,
        language: 'javascript',
        initialCode: '// Starter code\nfunction solution() {\n  // TODO\n}\n',
        testCode: '// tests placeholder',
        solutionCode: '// solution placeholder',
        type: 'write',
        setupCode: '',
        expectedOutput: '',
      }
    ];
  }
  if (opts.isAssignment) {
    lesson.isAssignment = true;
    lesson.requiredAssignment = true;
    lesson.assignmentDescription = opts.assignmentDescription || `### Assignment for ${title}\n\nComplete the following tasks and submit your work.`;
    lesson.assignmentDeliverables = ['Source code / project link', 'Documentation'];
  }
  if (type === 'quiz') {
    lesson.quizQuestions = [
      { questionText: `What is the main concept covered in "${title}"?`, type: 'multiple_choice', options: ['Theory A', 'Theory B', 'Theory C', 'All of the above'], correctOptionIndex: 3, explanation: 'The correct answer is all of the above.' },
      { questionText: 'Which skill is most important here?', type: 'multiple_choice', options: ['Problem Solving', 'Memory', 'Speed', 'Typing'], correctOptionIndex: 0, explanation: 'Problem solving is foundational.' },
    ];
  }
  return lesson;
}

// ─── User Definitions ────────────────────────────────────────────────────────

interface UserDef {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'trainer' | 'student' | 'client';
  title?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  phone?: string;
  level?: number;
  xp?: number;
  streak?: number;
  academicStatus?: string;
}

const USER_DEFS: UserDef[] = [
  // ── Super Admins ──
  { username: 'alain_student', fullName: 'Alain Manzi', email: 'alainmanzi71@gmail.com', password: 'password123', role: 'student', title: 'Bootskills Student', bio: 'Platform learner with full student access for testing and demo purposes.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000000', level: 10, xp: 500, streak: 5, academicStatus: 'active' },
  { username: 'superadmin', fullName: 'System Super Admin', email: 'superadmin@bootskills.com', password: 'Password@123', role: 'super_admin', title: 'System Administrator', bio: 'Primary system administrator.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000001', level: 45, xp: 12000, streak: 30 },
  // ── Admins ──
  { username: 'admin_jane', fullName: 'Jane Uwimana', email: 'jane@bootskills.com', password: 'Password@123', role: 'admin', title: 'Operations Manager', bio: 'Platform administrator managing day-to-day operations.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000002', level: 30, xp: 6000, streak: 20 },
  { username: 'admin_peter', fullName: 'Peter Habimana', email: 'peter@bootskills.com', password: 'Password@123', role: 'admin', title: 'Admissions Officer', bio: 'Handles student admissions and scholarship programs.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000003', level: 25, xp: 4500, streak: 15 },
  // ── Trainers ──
  { username: 'trainer_sarah', fullName: 'Sarah Uwase', email: 'sarah@bootskills.com', password: 'password123', role: 'trainer', title: 'Lead Instructor', bio: 'Full-stack developer and lead instructor for web development courses.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000004', level: 35, xp: 9000, streak: 25 },
  { username: 'trainer_david', fullName: 'David Mutabazi', email: 'david@bootskills.com', password: 'password123', role: 'trainer', title: 'Data Science Instructor', bio: 'Data scientist and ML engineer with 5+ years experience.', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000005', level: 32, xp: 7500, streak: 18 },
  // ── Client ──
  { username: 'client_jean', fullName: 'Jean Pierre Kagame', email: 'client@bootskills.com', password: 'password123', role: 'client', title: 'Client Representative', bio: 'Corporate client representative for training partnerships.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', phone: '+250780000006', level: 10, xp: 500 },
  // ── Students ──
  { username: 'alice_student', fullName: 'Alice Mutoni', email: 'alice@example.com', password: 'password123', role: 'student', bio: 'Passionate about web development and design.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', level: 12, xp: 2800, streak: 14, academicStatus: 'intern' },
  { username: 'bob_student', fullName: 'Bob Kagabo', email: 'bob@example.com', password: 'password123', role: 'student', bio: 'Aspiring data scientist and Python enthusiast.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250', location: 'Musanze, Rwanda', level: 9, xp: 1900, streak: 8, academicStatus: 'active' },
  { username: 'carol_student', fullName: 'Carol Uwase', email: 'carol@example.com', password: 'password123', role: 'student', bio: 'UX/UI designer learning frontend development.', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250', location: 'Butare, Rwanda', level: 7, xp: 1200, streak: 6, academicStatus: 'active' },
  { username: 'dan_student', fullName: 'Daniel Habimana', email: 'daniel@example.com', password: 'password123', role: 'student', bio: 'Mobile app developer focused on React Native.', avatar: 'https://images.unsplash.com/photo-1545996124-1b7a3f8a1d0b?auto=format&fit=crop&q=80&w=250', location: 'Rwamagana, Rwanda', level: 8, xp: 1500, streak: 5, academicStatus: 'active' },
  { username: 'ella_student', fullName: 'Ella Iradukunda', email: 'ella@example.com', password: 'password123', role: 'student', bio: 'Interested in AI, machine learning, and data science.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', level: 6, xp: 900, streak: 4, academicStatus: 'active' },
  { username: 'fiona_student', fullName: 'Fiona Ingabire', email: 'fiona@example.com', password: 'password123', role: 'student', bio: 'Full-stack development enthusiast.', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=250', location: 'Kigali, Rwanda', level: 5, xp: 750, streak: 3, academicStatus: 'active' },
  { username: 'grace_student', fullName: 'Grace Niyonzima', email: 'grace@example.com', password: 'password123', role: 'student', bio: 'Digital marketing and content creation learner.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250', location: 'Huye, Rwanda', level: 4, xp: 500, streak: 2, academicStatus: 'active' },
  { username: 'henry_student', fullName: 'Henry Mugisha', email: 'henry@example.com', password: 'password123', role: 'student', bio: 'Backend developer learning Node.js and databases.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250', location: 'Rubavu, Rwanda', level: 6, xp: 1100, streak: 7, academicStatus: 'active' },
];

// ─── Course Definitions ───────────────────────────────────────────────────────

const COURSE_DEFS = [
  {
    title: 'Web Development Fundamentals',
    description: 'Learn HTML, CSS, and JavaScript from scratch. Build modern responsive websites with hands-on projects and real-world assignments.',
    price: 1000,
    discountPrice: 60000,
    category: 'Web Development',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Data Science & Analytics with Python',
    description: 'Introduction to data analysis, visualization, and machine learning using Python, Pandas, NumPy, and Scikit-Learn.',
    price: 1000,
    discountPrice: 95000,
    category: 'Data Science',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform iOS and Android apps using React Native, Expo, and Firebase.',
    price: 1000,
    discountPrice: 75000,
    category: 'Mobile Development',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Master user interface and user experience design using Figma. Learn design systems, prototyping, and user research.',
    price: 1000,
    discountPrice: 65000,
    category: 'Design',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Digital Marketing & Growth Hacking',
    description: 'Learn SEO, SEM, social media marketing, content strategy, and data-driven growth techniques.',
    price: 1000,
    discountPrice: 45000,
    category: 'Marketing',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Advanced Cloud Computing with AWS',
    description: 'Deploy, manage, and scale applications on AWS. Prepare for the Solutions Architect Associate exam.',
    price: 1000,
    discountPrice: 120000,
    category: 'Technology',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'application',
  },
  {
    title: 'Interactive Coding Bootcamp',
    description: 'Hands-on coding bootcamp with an integrated code editor and live exercises.',
    price: 1000,
    discountPrice: 70000,
    category: 'Web Development',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Algorithms & Data Structures (with Code Editor)',
    description: 'Master algorithms and data structures with interactive code challenges and automated tests.',
    price: 1000,
    discountPrice: 85000,
    category: 'Computer Science',
    level: 'Intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1526378726510-4b7b3b6f5f3e?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  {
    title: 'Exam Prep: Certification Simulations',
    description: 'Simulated exams, timed assessments, and practice tests to prepare for certification.',
    price: 1000,
    discountPrice: 35000,
    category: 'Test Prep',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
  },
  // Additional diverse courses (free, cheap, expensive, live/non-tech)
  {
    title: 'Free Applied: Personal Productivity',
    description: 'Practical productivity techniques for professionals — free short course.',
    price: 0,
    discountPrice: 0,
    category: 'Personal Development',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Community',
    enrollmentMode: 'direct',
    deliveryMode: 'self-paced',
  },
  {
    title: 'Affordable: Small Business Finance',
    description: 'Budgeting, bookkeeping, and basic finance for small business owners.',
    price: 1000,
    discountPrice: 20000,
    category: 'Business',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
    deliveryMode: 'self-paced',
  },
  {
    title: 'Premium: Executive Leadership Retreat (Live)',
    description: 'An intensive live leadership retreat with real-time workshops and coaching.',
    price: 1000,
    discountPrice: 450000,
    category: 'Leadership',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Executive',
    enrollmentMode: 'application',
    deliveryMode: 'live',
  },
  {
    title: 'Live: Culinary Arts — Real-time Kitchen Sessions',
    description: 'Hands-on culinary classes delivered live with real-time Q&A and instructor feedback.',
    price: 1000,
    discountPrice: 60000,
    category: 'Culinary',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Creative',
    enrollmentMode: 'direct',
    deliveryMode: 'live',
  },
  {
    title: 'Live: Public Speaking & Presentation Skills',
    description: 'Real-time workshops to build public speaking confidence and stage presence.',
    price: 1000,
    discountPrice: 35000,
    category: 'Personal Development',
    level: 'Beginner',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Studio',
    enrollmentMode: 'direct',
    deliveryMode: 'live',
  },
  {
    title: 'Algorithms Interview Prep (with Code Editor)',
    description: 'Intensive interview prep with interactive code editor challenges and timed quizzes.',
    price: 1000,
    discountPrice: 99999,
    category: 'Computer Science',
    level: 'Advanced',
    thumbnail: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&q=80&w=800',
    school: 'Bootskills Academy',
    enrollmentMode: 'direct',
    hasCodeExercises: true,
  },
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────

async function seedComprehensiveDemo() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: USERS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 1: Creating Users ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const hashedPw = await bcrypt.hash('password123', 10);
    const hashedPwStrong = await bcrypt.hash('Password@123', 10);

    const createdUsers: Record<string, any> = {};

    for (const u of USER_DEFS) {
      // Delete any conflicting user (same email or username, different other field)
      await User.deleteMany({
        $or: [
          { email: u.email, username: { $ne: u.username } },
          { username: u.username, email: { $ne: u.email } },
        ]
      });

      const pw = u.password === 'Password@123' ? hashedPwStrong : hashedPw;
      const user = await User.findOneAndUpdate(
        { email: u.email },
        {
          $set: {
            ...u,
            password: pw,
            isEmailVerified: true,
            status: 'active',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      createdUsers[u.username] = user;
      console.log(`   ✅ ${u.role.padEnd(12)} ${u.fullName.padEnd(22)} ${u.email}`);
    }

    const superAdmin = createdUsers['patrick_m'] || createdUsers['superadmin'];
    const admins = [createdUsers['admin_jane'], createdUsers['admin_peter'], superAdmin];
    const trainers = [createdUsers['trainer_sarah'], createdUsers['trainer_david']];
    const allStudents = ['alain_student','alice_student', 'bob_student', 'carol_student', 'dan_student', 'ella_student', 'fiona_student', 'grace_student', 'henry_student']
      .map(k => createdUsers[k])
      .filter(Boolean);
    // Also ensure the platform owner can act as a learner for testing: include superAdmin in enrollments
    const studentsToEnroll = allStudents.slice();
    if (superAdmin && !studentsToEnroll.some(s => s._id.toString() === superAdmin._id.toString())) {
      studentsToEnroll.push(superAdmin);
    }
    const clientUser = createdUsers['client_jean'];

    console.log(`   ✅ Total: ${USER_DEFS.length} users (${allStudents.length} students, ${studentsToEnroll.length} enrolled users including super admin)\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: COURSES
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 2: Creating Courses ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const createdCourses: any[] = [];

    for (const cd of COURSE_DEFS) {
      const existing = await Course.findOne({ title: cd.title });
      if (existing) {
        console.log(`   ⏭️  Exists: ${cd.title}`);
        createdCourses.push(existing);
        continue;
      }

      const instructor = randomElement(trainers);

      const modules = [
        {
          title: `${cd.title} — Module 1: Foundations`,
          description: 'Core concepts and fundamentals you need to get started.',
          lessons: [
            makeLesson('Introduction & Setup', 'video', 15),
            makeLesson('Core Concepts Explained', 'article', 10),
            makeLesson('Hands-On Practice', 'assignment', 20, { isAssignment: true, assignmentDescription: `Complete the practical exercises for ${cd.title} Module 1. Submit your work.` }),
            makeLesson('Module 1 Knowledge Check', 'quiz', 5),
          ],
        },
        {
          title: `${cd.title} — Module 2: Intermediate Topics`,
          description: 'Dive deeper into advanced techniques and best practices.',
          lessons: [
            makeLesson('Advanced Theory & Patterns', 'video', 20),
            makeLesson('Real-World Examples', 'article', 12),
            makeLesson('Practical Assignment', 'assignment', 25, { isAssignment: true, assignmentDescription: `Build a project applying the concepts from Module 2 of ${cd.title}.` }),
            makeLesson('Module 2 Quiz', 'quiz', 5),
          ],
        },
        {
          title: `${cd.title} — Module 3: Mastery & Project`,
          description: 'Apply everything you have learned in a final capstone project.',
          lessons: [
            makeLesson('Final Project Overview', 'video', 10),
            makeLesson('Capstone Project Work', 'assignment', 45, { isAssignment: true, assignmentDescription: `Complete the final capstone project for ${cd.title}. This demonstrates your mastery of the subject.` }),
            makeLesson('Course Summary & Review', 'article', 8),
            makeLesson('Final Exam', 'quiz', 10),
          ],
        },
      ];

      // If the course declares code exercises, inject a code lesson into Module 2
      if ((cd as any).hasCodeExercises) {
        modules[1].lessons.splice(2, 0, makeLesson('Interactive Coding Exercise', 'code', 30));
      }

      const course = await new Course({
        ...cd,
        instructor: instructor._id,
        createdBy: superAdmin._id,
        status: 'published',
        modules,
        modulesCount: modules.length,
        totalLessonsCount: modules.reduce((s, m) => s + (m.lessons?.length || 0), 0),
        studentsEnrolled: [],
      }).save();

      console.log(`   ✅ Created: ${cd.title}`);
      createdCourses.push(course);
    }

    console.log(`   ✅ Total courses: ${createdCourses.length}\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: ENROLLMENTS & PROGRESS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 3: Enrolling Students ─━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const course of createdCourses) {
      for (const student of studentsToEnroll) {
        // Add to course.studentsEnrolled
        if (!course.studentsEnrolled.some((s: any) => s.toString() === student._id.toString())) {
          course.studentsEnrolled.push(student._id);
        }
        // Add to student.enrolledCourses
        if (!student.enrolledCourses) student.enrolledCourses = [];
        if (!student.enrolledCourses.some((c: any) => c.toString() === course._id.toString())) {
          student.enrolledCourses.push(course._id);
        }
        // Create progress
        await CourseProgress.findOneAndUpdate(
          { userId: student._id, courseId: course._id },
          {
            $setOnInsert: {
              userId: student._id,
              courseId: course._id,
              totalTimeSpent: randomInt(200, 4000),
              overallProgress: randomInt(15, 95),
              status: 'active',
              lessons: [],
            },
          },
          { upsert: true },
        );
      }
      await course.save();
    }
    // Save all enrolled students
    for (const student of studentsToEnroll) {
      await student.save();
    }
    console.log(`   ✅ ${studentsToEnroll.length} students enrolled in ${createdCourses.length} courses each (${studentsToEnroll.length * createdCourses.length} total enrollments)\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: PAYMENTS (for enrolled courses)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 4: Creating Payments ─━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const course of createdCourses) {
      for (const student of studentsToEnroll) {
        const existing = await Payment.findOne({ userId: student._id, courseId: course._id });
        if (!existing) {
          await new Payment({
            userId: student._id,
            courseId: course._id,
            amount: course.discountPrice || course.price,
            currency: 'RWF',
            status: 'completed',
            paymentMethod: 'Mobile Money',
            transactionId: `TXN-DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            type: 'Course Enrollment',
            itemTitle: course.title,
            courseIds: [course._id],
          }).save();
        }
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length * createdCourses.length} payment records created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: PROJECTS WITH TASKS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 5: Creating Projects & Tasks ─━━━━━━━━━━━━━━━━━');

    const PROJECT_DEFS = [
      {
        title: 'E-Commerce Web Platform',
        course: 'Web Development Fundamentals',
        type: 'Team Project' as const,
        description: 'Build a full e-commerce platform with product listings, shopping cart, checkout flow, and admin dashboard.',
        skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
      },
      {
        title: 'Sales Analytics Dashboard',
        course: 'Data Science & Analytics with Python',
        type: 'Individual' as const,
        description: 'Create an interactive sales performance dashboard with data visualizations, filtering, and export capabilities.',
        skills: ['Python', 'Pandas', 'Matplotlib', 'Dash'],
      },
      {
        title: 'Fitness Tracker Mobile App',
        course: 'Mobile App Development with React Native',
        type: 'Individual' as const,
        description: 'Develop a cross-platform fitness tracking app with workout logging, progress charts, and social features.',
        skills: ['React Native', 'Expo', 'Firebase', 'JavaScript'],
      },
    ];

    const createdProjects: any[] = [];

    for (const pd of PROJECT_DEFS) {
      const existing = await Project.findOne({ title: pd.title });
      if (existing) {
        console.log(`   ⏭️  Project exists: ${pd.title}`);
        createdProjects.push(existing);
        continue;
      }

      const studentOwner = randomElement(studentsToEnroll);
      const projectStatuses = ['in_progress', 'pending_review', 'completed'] as const;
      const project = await new Project({
        userId: studentOwner._id,
        title: pd.title,
        course: pd.course,
        type: pd.type,
        description: pd.description,
        status: projectStatuses[randomInt(0, 2)],
        progress: randomInt(20, 95),
        mentors: [randomElement(trainers)._id],
        skills: pd.skills,
        team: [
          { userId: studentOwner._id, name: studentOwner.fullName, role: 'Developer' },
          ...(pd.type === 'Team Project'
            ? [{ userId: randomElement(studentsToEnroll.filter(s => s._id.toString() !== studentOwner._id.toString()))._id, name: 'Team Member', role: 'Developer' }]
            : []),
        ],
        milestones: [
          { title: 'MVP Delivery', dueDate: daysAgo(randomInt(15, 30)), completed: true },
          { title: 'Feature Complete', dueDate: daysAgo(randomInt(5, 14)), completed: Math.random() > 0.3 },
          { title: 'Final Submission', dueDate: daysFromNow(randomInt(5, 20)), completed: false },
        ],
      }).save();

      // Create Kanban tasks (ProjectTask model)
      const KANBAN_TASKS = [
        { title: 'Design database schema', description: 'Design the initial database schema and relationships.', status: 'done' as const, priority: 'high' as const, order: 1 },
        { title: 'Implement authentication', description: 'Build user registration and login with JWT.', status: 'done' as const, priority: 'high' as const, order: 2 },
        { title: 'Build REST API endpoints', description: 'Create CRUD endpoints for the main entities.', status: 'in_progress' as const, priority: 'high' as const, order: 3 },
        { title: 'Create frontend components', description: 'Build reusable React components for the UI.', status: 'in_progress' as const, priority: 'medium' as const, order: 4 },
        { title: 'Implement state management', description: 'Add Redux or Context API for global state.', status: 'todo' as const, priority: 'medium' as const, order: 5 },
        { title: 'Write unit tests', description: 'Add Jest tests for critical paths.', status: 'todo' as const, priority: 'medium' as const, order: 6 },
        { title: 'Integration testing', description: 'End-to-end tests for main user flows.', status: 'todo' as const, priority: 'low' as const, order: 7 },
        { title: 'Performance optimization', description: 'Optimize bundle size and API response times.', status: 'backlog' as const, priority: 'low' as const, order: 8 },
      ];

      for (const t of KANBAN_TASKS) {
        await new ProjectTask({
          projectId: project._id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          order: t.order,
          assigneeId: studentOwner._id,
          labels: [pd.course.includes('Web') || pd.course.includes('Mobile') ? 'frontend' : 'backend'],
        }).save();
      }

      console.log(`   ✅ Created: ${pd.title} (with 8 Kanban tasks)`);
      createdProjects.push(project);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6: ASSIGNMENT SUBMISSIONS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━ STEP 6: Assignment Submissions ─━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const course = createdCourses[0];
      const lessonId = course.modules?.[0]?.lessons?.[0]?.title || 'lesson-1';
      const existing = await AssignmentSubmission.findOne({ userId: student._id, courseId: course._id });
      if (!existing) {
        await new AssignmentSubmission({
          userId: student._id,
          courseId: course._id,
          lessonId,
          content: 'https://github.com/student/project-submission',
          status: randomElement(['pending', 'approved', 'reviewed']),
          grade: randomInt(65, 100),
          feedback: 'Great work! Consider improving the documentation for better clarity.',
          answers: [{ questionId: 'q1', answerText: 'Implementation complete with tests', score: 85, aiFeedback: 'Well-structured solution.' }],
          totalScore: randomInt(70, 100),
        }).save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length} assignment submissions created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7: CERTIFICATES
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 7: Certificates ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const course = createdCourses[0];
      const existing = await Certificate.findOne({ userId: student._id, courseId: course._id });
      if (!existing) {
        await new Certificate({
          userId: student._id,
          courseId: course._id,
          courseTitle: course.title,
          status: 'issued',
          issueDate: daysAgo(randomInt(5, 30)),
          credentialId: `CERT-DEMO-${Date.now()}-${student._id.toString().slice(-6)}`,
          grade: randomInt(70, 100),
          progress: 100,
          recipientName: student.fullName,
          signerName: 'Patrick Manzi',
          signerSignature: 'PM',
        }).save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length} certificates issued\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 8: INTERNSHIP PROGRAMS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 8: Internship Programs ─━━━━━━━━━━━━━━━━━━━━━━━');

    const INTERNSHIP_DEFS = [
      {
        title: 'Full Stack Engineering Internship',
        description: 'A 3-month intensive program where you build production-grade full-stack applications using React, Node.js, and MongoDB.',
        duration: '3 Months',
        price: 1000,
        currency: 'RWF',
        eligibility: 'JavaScript basics, HTML/CSS familiarity, Teamwork skills',
      },
      {
        title: 'Data Analytics Internship',
        description: 'A 2-month program focused on data analysis, visualization, and business intelligence using Python and BI tools.',
        duration: '2 Months',
        price: 0,
        currency: 'RWF',
        eligibility: 'Basic Python, Excel proficiency, Analytical mindset',
      },
    ];

    const createdPrograms: any[] = [];

    for (const id of INTERNSHIP_DEFS) {
      const existing = await InternshipProgram.findOne({ title: id.title });
      if (existing) {
        console.log(`   ⏭️  Program exists: ${id.title}`);
        createdPrograms.push(existing);
        continue;
      }

      const program = await new InternshipProgram({
        ...id,
        createdBy: superAdmin._id,
        startDate: daysAgo(30),
        endDate: daysFromNow(60),
        applicationDeadline: daysAgo(15),
        maxSpots: 20,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
        rules: 'Professional conduct, timely submissions, active participation.',
      }).save();

      // Application phases
      await new ApplicationPhase({
        programId: program._id,
        name: 'Application Review',
        description: 'Review and assess applicant qualifications.',
        order: 1,
        requiredDeliverables: [
          { type: 'cv', name: 'CV / Resume', required: true },
          { type: 'essay', name: 'Cover Letter', required: true },
        ],
        enableApproval: true,
        notificationOnCompletion: true,
      }).save();

      await new ApplicationPhase({
        programId: program._id,
        name: 'Technical Interview',
        description: 'Assess technical skills through a coding interview.',
        order: 2,
        requiredDeliverables: [
          { type: 'portfolio', name: 'Portfolio / GitHub', required: true },
        ],
        enableApproval: true,
        isInterviewPhase: true,
      }).save();

      console.log(`   ✅ Created: ${id.title} (with application phases)`);
      createdPrograms.push(program);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 9: INTERNSHIP APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━ STEP 9: Internship Applications ─━━━━━━━━━━━━━━━━━━');

    if (createdPrograms.length > 0) {
      for (let i = 0; i < Math.min(allStudents.length, 4); i++) {
        const student = allStudents[i];
        const program = createdPrograms[i % createdPrograms.length];
        const existing = await InternshipApplication.findOne({ userId: student._id, internshipProgramId: program._id });
        if (!existing) {
          await new InternshipApplication({
            userId: student._id,
            internshipProgramId: program._id,
            status: randomElement(['pending', 'approved', 'rejected']),
            skills: ['JavaScript', 'React', 'Python'],
            availability: 'full_time',
            coverLetter: `I am excited to apply for the ${program.title} program. I have the skills and motivation to succeed.`,
          }).save();
        }
      }
      console.log(`   ✅ Internship applications created`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 10: INTERNSHIP PROJECTS, TEAMS, SPRINTS, TASKS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━ STEP 10: Internship Teams & Tasks ─━━━━━━━━━━━━━━');

    if (createdPrograms.length > 0) {
      const program = createdPrograms[0];
      let ip = await InternshipProject.findOne({ internshipProgramId: program._id });

      if (!ip) {
        ip = await new InternshipProject({
          internshipProgramId: program._id,
          title: 'Microservices Migration Project',
          description: 'Break a monolithic application into microservices architecture.',
          requiredSkills: ['Node.js', 'Docker', 'PostgreSQL', 'Redis'],
          status: 'published',
          teamSizeRange: { min: 2, max: 4 },
          objectives: [
            'Design microservice boundaries',
            'Implement API gateway pattern',
            'Set up Docker containers',
            'Write integration tests',
          ],
        }).save();

        // Milestones
        const milestoneData = [
          { title: 'System Analysis & Design', description: 'Document current system and design microservice architecture.', days: 14 },
          { title: 'Core Service Implementation', description: 'Implement the main microservices with APIs.', days: 30 },
          { title: 'Integration & Testing', description: 'Integrate services and write comprehensive tests.', days: 45 },
          { title: 'Deployment & Documentation', description: 'Deploy to production and write documentation.', days: 60 },
        ];

        for (let i = 0; i < milestoneData.length; i++) {
          const m = milestoneData[i];
          await new InternshipMilestone({
            internshipProjectId: ip._id,
            title: m.title,
            description: m.description,
            deadline: daysFromNow(m.days),
            order: i,
            completed: i === 0,
            completedAt: i === 0 ? new Date() : undefined,
          }).save();
        }
        console.log(`   ✅ Created internship project with milestones`);
      }

      // Create team
      let team = await InternshipTeam.findOne({ internshipProjectId: ip._id });
      if (!team) {
        team = await new InternshipTeam({
          name: 'Team Alpha — Microservices',
          internshipProjectId: ip._id,
          internshipProgramId: program._id,
          mentorId: randomElement(trainers)._id,
          status: 'active',
          type: 'team',
        }).save();

        for (let i = 0; i < Math.min(studentsToEnroll.length, 4); i++) {
          await InternshipTeamMember.findOneAndUpdate(
            { teamId: team._id, userId: studentsToEnroll[i]._id },
            { $set: { role: i === 0 ? 'lead' : 'member', joinedAt: daysAgo(14) } },
            { upsert: true },
          );
        }
        console.log(`   ✅ Created team with ${Math.min(studentsToEnroll.length, 4)} members`);
      }

      // Create sprint with tasks
      if (team) {
        let sprint = await InternshipSprint.findOne({ teamId: team._id, order: 1 });
        if (!sprint) {
          sprint = await new InternshipSprint({
            projectId: ip._id,
            teamId: team._id,
            title: 'Sprint 1: Foundation & Core Services',
            goal: 'Set up project infrastructure, Docker environment, and implement core services.',
            startDate: daysAgo(7),
            endDate: daysFromNow(7),
            status: 'active',
            order: 1,
          }).save();

          const sprintTasks = [
            { title: 'Set up Docker Compose environment', description: 'Configure Docker for local development.', status: 'done' as const },
            { title: 'Design API contracts', description: 'Define OpenAPI specs for all services.', status: 'done' as const },
            { title: 'Implement User Service', description: 'Build the user authentication microservice.', status: 'in_progress' as const },
            { title: 'Implement Product Service', description: 'Build the product catalog microservice.', status: 'in_progress' as const },
            { title: 'Set up API Gateway', description: 'Configure Kong or Express Gateway.', status: 'todo' as const },
            { title: 'Write integration tests', description: 'Test inter-service communication.', status: 'todo' as const },
          ];

          for (let i = 0; i < sprintTasks.length; i++) {
            const t = sprintTasks[i];
            await new InternshipTask({
              projectId: ip._id,
              teamId: team._id,
              sprintId: sprint._id,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: i < 3 ? 'high' : 'medium',
              taskType: 'feature',
              order: i + 1,
              assigneeId: studentsToEnroll[i % studentsToEnroll.length]._id,
              labels: ['microservices', 'sprint-1'],
            }).save();
          }

          // Activity log for completed tasks
          await new InternshipActivityLog({
            userId: studentsToEnroll[0]._id,
            action: 'SPRINT_STARTED',
            module: 'internship',
            targetType: 'Sprint',
            targetId: sprint._id,
            details: 'Sprint 1: Foundation & Core Services started.',
          }).save();

          console.log(`   ✅ Created sprint with ${sprintTasks.length} board tasks`);
        }

        // Create a meeting
        const existingMeeting = await InternshipMeeting.findOne({ teamIds: team._id });
        if (!existingMeeting) {
          await new InternshipMeeting({
            title: 'Weekly Standup',
            description: 'Team standup to discuss progress and blockers.',
            type: 'WEEKLY',
            startTime: daysFromNow(1),
            endTime: daysFromNow(1),
            teamIds: [team._id],
            mentorIds: [randomElement(trainers)._id],
            hostId: randomElement(trainers)._id,
            status: 'pending',
            recurrenceDays: [1, 3, 5], // Mon, Wed, Fri
          }).save();
          console.log(`   ✅ Created weekly standup meeting`);
        }

        // Internship certificates
        for (const student of studentsToEnroll) {
          const existingCert = await InternshipCertificate.findOne({ userId: student._id, internshipProgramId: program._id });
          if (!existingCert) {
            await new InternshipCertificate({
              userId: student._id,
              internshipProgramId: program._id,
              teamId: team._id,
              certificateNumber: `INT-CERT-DEMO-${Date.now()}-${student._id.toString().slice(-6)}`,
              issuedAt: new Date(),
              trainerId: randomElement(trainers)._id,
              trainerName: randomElement(trainers).fullName,
              internTitle: 'Software Engineering Intern',
              programTitle: program.title,
              duration: '3 months',
              startDate: daysAgo(30),
              endDate: new Date(),
              completionDate: new Date(),
            }).save();
          }
        }
        console.log(`   ✅ Internship certificates created`);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 11: BADGES
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━ STEP 11: Badges ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const BADGE_DEFS = [
      { title: 'Quick Starter', description: 'Completed your first course on the platform.', icon: '🚀', category: 'achievement' },
      { title: 'Code Master', description: 'Submitted 10+ assignments with high grades.', icon: '💻', category: 'skill' },
      { title: 'Team Player', description: 'Successfully collaborated on a team project.', icon: '🤝', category: 'participation' },
      { title: 'Early Adopter', description: 'One of the first students on the platform.', icon: '🌟', category: 'milestone' },
      { title: 'Perfect Attendance', description: 'Completed all course modules without missing any.', icon: '🏆', category: 'academic' },
      { title: 'Innovation Award', description: 'Created an outstanding capstone project.', icon: '💡', category: 'skill' },
    ];

    for (const bd of BADGE_DEFS) {
      await Badge.findOneAndUpdate(
        { title: bd.title },
        { $set: { ...bd, createdBy: superAdmin._id } },
        { upsert: true },
      );
    }
    console.log(`   ✅ ${BADGE_DEFS.length} badges created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 12: NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 12: Notifications ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const existing = await Notification.findOne({ userId: student._id });
      if (!existing) {
        await new Notification({
          userId: student._id,
          type: 'WELCOME',
          title: 'Welcome to Bootskills! 🎉',
          message: 'Your learning journey starts now. Explore courses, join internships, and build your future.',
          link: '/explore',
          read: true,
        }).save();
        await new Notification({
          userId: student._id,
          type: 'COURSE_UPDATE',
          title: 'New Course Available',
          message: 'Check out "Advanced Cloud Computing with AWS" — a new course just released!',
          link: '/courses',
          read: false,
        }).save();
        await new Notification({
          userId: student._id,
          type: 'ASSIGNMENT_GRADED',
          title: 'Assignment Graded',
          message: 'Your recent assignment has been reviewed. Check your feedback!',
          link: '/portal/student/courses',
          read: Math.random() > 0.5,
        }).save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length * 3} notifications created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 13: CONVERSATIONS & MESSAGES
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 13: Conversations ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const existing = await Conversation.findOne({ participants: { $all: [superAdmin._id, student._id] } });
      if (!existing) {
        const conv = await new Conversation({
          participants: [superAdmin._id, student._id],
          updatedAt: new Date(),
        }).save();

        await new Message({
          conversationId: conv._id,
          sender: superAdmin._id,
          content: `Welcome ${student.fullName}! 🎉 I'm Patrick, your platform admin. Feel free to reach out if you have any questions about courses, internships, or the platform.`,
          createdAt: daysAgo(randomInt(1, 10)),
        }).save();

        await new Message({
          conversationId: conv._id,
          sender: student._id,
          content: `Thank you! I'm excited to start learning. The courses look amazing!`,
          createdAt: daysAgo(randomInt(0, 5)),
        }).save();

        conv.lastMessage = conv._id;
        await conv.save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length} conversations with messages\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 14: BOOKINGS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 14: Bookings ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const existing = await Booking.findOne({ userId: student._id });
      if (!existing) {
        await new Booking({
          userId: student._id,
          mentorId: randomElement(trainers)._id,
          type: 'mentorship',
          date: daysFromNow(randomInt(1, 14)).toISOString().split('T')[0],
          time: `${10 + randomInt(0, 7)}:00`,
          topic: randomElement(['Career Guidance', 'Project Review', 'Code Review', 'Technical Mentorship']),
          status: randomElement(['confirmed', 'pending']),
          deliveryMode: 'online',
        }).save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length} mentorship bookings\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 15: SCHOLARSHIPS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 15: Scholarships ─━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (createdCourses.length > 0) {
      const scholarshipStatuses: ('pending' | 'active' | 'revoked')[] = ['active', 'pending', 'revoked'];
      const reasons = ['Merit-based scholarship', 'Financial aid program', 'Women in Tech initiative'];

      for (let i = 0; i < Math.min(studentsToEnroll.length, 3); i++) {
        const student = studentsToEnroll[i];
        const course = createdCourses[i % createdCourses.length];
        const existing = await Scholarship.findOne({ userId: student._id, itemId: course._id });
        if (!existing) {
          await new Scholarship({
            userId: student._id,
            grantedBy: randomElement(admins)._id,
            type: 'course',
            itemId: course._id,
            itemTitle: course.title,
            status: scholarshipStatuses[i],
            reason: reasons[i],
            grantedLatitude: -1.9441,
            grantedLongitude: 30.0619,
            grantedCity: 'Kigali',
            grantedCountry: 'Rwanda',
            ...(scholarshipStatuses[i] === 'revoked' ? {
              revokedAt: daysAgo(10),
              revokedBy: superAdmin._id,
              revokedReason: 'Student did not meet ongoing eligibility criteria.',
            } : {}),
            ...(scholarshipStatuses[i] === 'active' && i === 0 ? {
              approvedAt: daysAgo(5),
              approvedBy: superAdmin._id,
            } : {}),
          }).save();
        }
      }
      console.log(`   ✅ 3 scholarships created (active, pending, revoked)`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 16: STUDENT PROFILES
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n━━━ STEP 16: Student Profiles ─━━━━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      await StudentProfile.findOneAndUpdate(
        { userId: student._id },
        {
          $set: {
            school: 'University of Rwanda',
            educationLevel: 'undergraduate',
            fieldOfStudy: ['Computer Science', 'Data Science', 'Software Engineering', 'Information Technology'][randomInt(0, 3)],
            skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'].slice(0, randomInt(2, 5)),
            availability: 'full_time',
            bio: student.bio || 'A motivated learner passionate about technology and building real-world solutions.',
            city: student.location?.split(',')[0] || 'Kigali',
            sector: 'Nyarugenge',
          },
        },
        { upsert: true },
      );
    }
    console.log(`   ✅ ${studentsToEnroll.length} student profiles created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 17: ASSIGNED TASKS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 17: User Assigned Tasks ─━━━━━━━━━━━━━━━━━━━━');

    for (const student of studentsToEnroll) {
      const existing = await UserAssignedTask.findOne({ userId: student._id });
      if (!existing) {
        await new UserAssignedTask({
          userId: student._id,
          assignedBy: randomElement(admins)._id,
          title: 'Complete Platform Onboarding',
          description: 'Finish setting up your profile and explore the platform features.',
          status: randomElement(['pending', 'completed']),
          priority: 'high',
          dueDate: daysFromNow(7),
          checklist: [
            { item: 'Upload profile avatar', completed: Math.random() > 0.3 },
            { item: 'Fill in your bio', completed: Math.random() > 0.5 },
            { item: 'Enroll in your first course', completed: true },
            { item: 'Complete the first lesson', completed: Math.random() > 0.4 },
          ],
        }).save();
      }
    }
    console.log(`   ✅ ${studentsToEnroll.length} assigned tasks created\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 18: CONFIGS
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 18: System Configs ─━━━━━━━━━━━━━━━━━━━━━━━━━');

    const CONFIG_DEFS = [
      { key: 'siteName', value: 'Bootskills', description: 'Platform display name' },
      { key: 'primaryColor', value: '#D4AF37', description: 'Primary brand color (gold)' },
      { key: 'maintenanceMode', value: 'false', description: 'Enable maintenance mode' },
      { key: 'platformCommission', value: '10', description: 'Platform commission percentage' },
      { key: 'holdDays', value: '14', description: 'Disbursement hold period in days' },
      { key: 'defaultCurrency', value: 'RWF', description: 'Default platform currency' },
      { key: 'maxStudentsPerCourse', value: '100', description: 'Maximum students per course' },
    ];

    for (const cd of CONFIG_DEFS) {
      await Config.findOneAndUpdate(
        { key: cd.key },
        { $set: cd },
        { upsert: true },
      );
    }
    console.log(`   ✅ ${CONFIG_DEFS.length} system configs\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 19: ADMIN AUDIT LOG
    // ═══════════════════════════════════════════════════════════════════════
    console.log('━━━ STEP 19: Audit Log ─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const existingLog = await AdminAuditLog.findOne({ queryName: 'SEED_DEMO_DATA' });
    if (!existingLog) {
      await new AdminAuditLog({
        accessingAdminId: superAdmin._id,
        accessingAdminUsername: superAdmin.username || superAdmin.email || 'system',
        queryName: 'SEED_DEMO_DATA',
        accessedEntityType: 'System',
        isCrossAdmin: false,
        details: 'Seeded comprehensive demo data for platform demonstration.',
        resultCount: 1,
        ipAddress: '127.0.0.1',
      }).save();
      console.log('   ✅ Audit log entry created\n');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(65));
    console.log('📊  DEMO SEED COMPLETE');
    console.log('═'.repeat(65));
    console.log(`   👤 Users:                ${USER_DEFS.length} (1 super_admin @ alainmanzi71, 1 super_admin, 2 admin, 2 trainer, 1 client, 8 students)`);
    console.log(`   📚 Courses:              ${createdCourses.length} courses with 3 modules & 12 lessons each`);
    console.log(`   📝 Enrollments:          ${studentsToEnroll.length} students × ${createdCourses.length} courses`);
    console.log(`   💰 Payments:             ${studentsToEnroll.length * createdCourses.length} payment records`);
    console.log(`   📋 Projects:             ${createdProjects.length} projects with Kanban tasks`);
    console.log(`   📎 Assignments:          ${studentsToEnroll.length} submissions with grades`);
    console.log(`   📜 Certificates:         ${studentsToEnroll.length} course certificates`);
    console.log(`   🏗️  Internships:         ${createdPrograms.length} programs with phases`);
    console.log(`   🎯 Sprint Tasks:         6 board tasks in active sprint`);
    console.log(`   📅 Meetings:             1 weekly standup meeting`);
    console.log(`   🏆 Badges:               ${BADGE_DEFS.length} badges`);
    console.log(`   🔔 Notifications:        ${studentsToEnroll.length * 3} notifications`);
    console.log(`   💬 Messages:             ${studentsToEnroll.length} conversations`);
    console.log(`   📅 Bookings:             ${studentsToEnroll.length} mentorship bookings`);
    console.log(`   🎓 Scholarships:         3 (active, pending, revoked)`);
    console.log(`   👤 Student Profiles:     ${studentsToEnroll.length} profiles`);
    console.log(`   📌 Assigned Tasks:       ${studentsToEnroll.length} user tasks`);
    console.log(`   ⚙️  Configs:              ${CONFIG_DEFS.length} system configs`);
    console.log('═'.repeat(65));
    console.log('🚀  You can now log in with:');
    console.log(`     📧 alainmanzi71@gmail.com  🔑 password123  (student)`);
    console.log(`     📧 jane@bootskills.com     🔑 Password@123  (admin)`);
    console.log(`     📧 alice@example.com       🔑 password123    (student)`);
    console.log('═'.repeat(65));
    console.log('✨  Everything is populated and ready for demo!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

seedComprehensiveDemo();
