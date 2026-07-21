/**
 * 🌱 SEED: Intro Demo Course — Platform Walkthrough
 *
 * Creates a FREE introductory course that demonstrates how the platform works.
 * Great for new users who want to explore the system.
 *
 * Structure:
 *   Module 1: "Welcome to BootSkills Platform"
 *     Lesson 1: What is BootSkills? (video)
 *     Lesson 2: Getting Started (article)
 *     Quiz: Module 1 Knowledge Check
 *     Exam: Module 1 Assessment
 *
 *   Module 2: "Features & Learning Tools"
 *     Lesson 1: Courses, Internships & Projects (video)
 *     Lesson 2: Tracking Progress & Certificates (article)
 *     Quiz: Module 2 Knowledge Check
 *     Exam: Module 2 Final Assessment
 *
 * Assigns to: admin@bootskills.com
 *
 * Usage: npx tsx src/seedIntroDemoCourse.ts   (run from the backend/ directory)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { CourseProgress } from './models/CourseProgress';

dotenv.config();

async function seedIntroDemoCourse() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // ─── Find the admin user ──────────────────────────────────────────────
    const admin = await User.findOne({ email: 'admin@bootskills.com' });
    if (!admin) {
      console.error('❌ Admin user not found (admin@bootskills.com). Seed users first.');
      process.exit(1);
    }
    console.log(`✅ Found admin: ${admin.fullName} (${admin.email}, role: ${admin.role})\n`);

    // ─── Build the course content ─────────────────────────────────────────

    const courseData = {
      title: 'Welcome to BootSkills: Platform Demo Tour',
      description:
        'A quick guided tour of the BootSkills learning platform. ' +
        'Explore courses, take quizzes, try an exam, and discover internships, ' +
        'projects, and certificates — all at zero cost.',
      price: 0,                // FREE
      discountPrice: 0,
      category: 'Orientation',
      level: 'Beginner',
      thumbnail:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      school: 'BootSkills Academy',
      enrollmentMode: 'direct',
      status: 'published',
      passingScore: 70,
      instructor: admin._id,
      createdBy: admin._id,
      modules: [
        // ── Module 1 ──────────────────────────────────────────────────────
        {
          title: 'Module 1: Welcome to BootSkills Platform',
          description:
            'Get familiar with the BootSkills platform — what it offers and how to get started.',
          order: 1,
          lessons: [
            // Lesson 1 — Video
            {
              title: 'What is BootSkills?',
              content:
                '## What is BootSkills?\n\n' +
                'BootSkills is an all-in-one learning and career-development platform. ' +
                'Whether you want to **learn to code**, **build projects**, **join internships**, ' +
                'or **earn certificates**, BootSkills provides the tools and community to help you succeed.\n\n' +
                '### Key Features:\n' +
                '- **Interactive Courses** — video lessons, articles, quizzes & exams\n' +
                '- **Code Editor** — write and test code right in your browser\n' +
                '- **Internship Programs** — real-world team projects with mentorship\n' +
                '- **Certificates** — earn verifiable credentials\n' +
                '- **Progress Tracking** — see your learning journey at a glance',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              videoTitle: 'BootSkills Platform Overview',
              duration: 8,
              order: 1,
            },
            // Lesson 2 — Article
            {
              title: 'Getting Started: Your First Steps',
              content:
                '## Getting Started\n\n' +
                'Here is how to make the most of BootSkills:\n\n' +
                '### 1️⃣ Explore Courses\n' +
                'Go to the **Explore** page to browse all available courses. ' +
                'Filter by category, level, or price. Click any course to see its modules and lessons.\n\n' +
                '### 2️⃣ Enroll & Learn\n' +
                'Click **Enroll** to start a course. Work through each module and lesson at your own pace. ' +
                'Quizzes help reinforce what you have learned, and exams test your mastery.\n\n' +
                '### 3️⃣ Code Challenges\n' +
                'Some lessons include interactive code exercises. ' +
                'Write code in the built-in editor, run tests, and get instant feedback.\n\n' +
                '### 4️⃣ Track Progress\n' +
                'Your **Student Dashboard** shows your enrolled courses, progress bars, ' +
                'upcoming deadlines, and recent activity.\n\n' +
                '### 5️⃣ Join an Internship\n' +
                'Apply for internship programs, join a team, and work on real projects with mentors.',
              type: 'article',
              duration: 10,
              order: 2,
            },
            // Quiz 1
            {
              title: 'Module 1: Knowledge Check',
              content:
                '## Knowledge Check\n\nAnswer the following questions to review what you learned in Module 1.',
              type: 'quiz',
              duration: 5,
              order: 3,
              quizConfig: {
                disableRightClick: false,
                timeLimit: 5,
                quizType: 'exercise',
                questionsPerPage: 5,
              },
              quizQuestions: [
                {
                  questionText: 'What type of content can you find in BootSkills courses?',
                  type: 'multiple_choice',
                  options: ['Video lessons', 'Articles', 'Quizzes & Exams', 'All of the above'],
                  correctOptionIndex: 3,
                  explanation:
                    'BootSkills courses include video lessons, articles, quizzes, exams, and even interactive code challenges.',
                },
                {
                  questionText: 'How can you test your knowledge within a course?',
                  type: 'multiple_choice',
                  options: [
                    'By skipping to the last lesson',
                    'By taking quizzes and exams',
                    'By watching videos only',
                    'There is no way to test knowledge',
                  ],
                  correctOptionIndex: 1,
                  explanation:
                    'Quizzes and exams are built into each module to help reinforce and assess your understanding.',
                },
                {
                  questionText: 'What is one benefit of joining an internship program on BootSkills?',
                  type: 'multiple_choice',
                  options: [
                    'Free internet access',
                    'Real-world team projects with mentorship',
                    'Guaranteed job placement',
                    'Free laptop',
                  ],
                  correctOptionIndex: 1,
                  explanation:
                    'Internship programs offer real-world team projects guided by experienced mentors.',
                },
              ],
            },
            // Exam 1 — Assignment in exam mode
            {
              title: 'Module 1: Assessment',
              content:
                '## Module 1 Assessment\n\nComplete this short exam to demonstrate your understanding of the platform basics.',
              type: 'assignment',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription:
                'Answer the following questions to complete Module 1. This is a demo exam to show how the exam system works on BootSkills.',
              assignmentConfig: {
                timeLimit: 10,
                allowRetakes: true,
                disableRightClick: false,
                mode: 'exam',
              },
              assignmentQuestions: [
                {
                  questionText: 'Which BootSkills feature lets you write and test code in your browser?',
                  type: 'mcq',
                  options: [
                    'Video player',
                    'Code editor',
                    'Chat system',
                    'Calendar',
                  ],
                  correctOptionIndex: 1,
                  explanation:
                    'The built-in code editor lets you write, run, and test code without leaving the platform.',
                  points: 10,
                },
                {
                  questionText:
                    'Describe one thing you would like to learn on BootSkills and how you would approach it.',
                  type: 'open',
                  explanation:
                    'Any thoughtful answer is valid. Use the course catalogue, enroll, and follow the modules step by step.',
                  points: 20,
                },
              ],
              order: 4,
            },
          ],
        },

        // ── Module 2 ──────────────────────────────────────────────────────
        {
          title: 'Module 2: Features & Learning Tools',
          description:
            'Explore the full set of learning tools — courses, internships, projects, certificates, and progress tracking.',
          order: 2,
          lessons: [
            // Lesson 1 — Video
            {
              title: 'Courses, Internships & Projects',
              content:
                '## Courses, Internships & Projects\n\n' +
                '### 📚 Courses\n' +
                'Courses are organised into **modules**, each containing **lessons**. ' +
                'Lessons can include videos, articles, quizzes, assignments, and code exercises. ' +
                'Complete all modules and pass the exams to earn your certificate.\n\n' +
                '### 💼 Internships\n' +
                'Internship programs simulate real workplace environments. ' +
                'You join a **team**, work in **sprints**, attend **standup meetings**, ' +
                'and build a project under a **mentor**.\n\n' +
                '### 🏗️ Projects\n' +
                'Projects use a **Kanban board** with tasks in backlog, todo, in-progress, and done columns. ' +
                'Track your progress, assign tasks, and collaborate with team members.',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              videoTitle: 'BootSkills Learning Tools',
              duration: 10,
              order: 1,
            },
            // Lesson 2 — Article
            {
              title: 'Tracking Progress & Earning Certificates',
              content:
                '## Tracking Progress & Earning Certificates\n\n' +
                '### 📊 Progress Dashboard\n' +
                'Your **Student Portal** shows:\n' +
                '- **Course Progress** — percentage complete per course\n' +
                '- **Recent Activity** — lessons completed, quizzes taken\n' +
                '- **Upcoming Deadlines** — assignment due dates\n' +
                '- **XP & Level** — experience points and your current level\n\n' +
                '### 🏆 Certificates\n' +
                'When you complete a course and pass all exams, you earn a **certificate**. ' +
                'Certificates include:\n' +
                '- Your full name\n' +
                '- Course title\n' +
                '- Completion date & grade\n' +
                '- A unique credential ID for verification\n\n' +
                '### 🔥 Streaks & Badges\n' +
                'Stay consistent! Daily learning builds your **streak**. ' +
                'Earn **badges** for achievements like first course completed, ' +
                'high assignment scores, and team collaboration.',
              type: 'article',
              duration: 8,
              order: 2,
            },
            // Quiz 2
            {
              title: 'Module 2: Knowledge Check',
              content:
                '## Knowledge Check\n\nReview what you learned in Module 2 with these questions.',
              type: 'quiz',
              duration: 5,
              order: 3,
              quizConfig: {
                disableRightClick: false,
                timeLimit: 5,
                quizType: 'exercise',
                questionsPerPage: 5,
              },
              quizQuestions: [
                {
                  questionText: 'What is the correct order to earn a course certificate on BootSkills?',
                  type: 'multiple_choice',
                  options: [
                    'Watch videos → skip exams → get certificate',
                    'Complete modules → pass exams → earn certificate',
                    'Pay fee → get certificate',
                    'Enroll → wait → auto-certificate',
                  ],
                  correctOptionIndex: 1,
                  explanation:
                    'You must complete all course modules and pass the exams to earn a certificate.',
                },
                {
                  questionText: 'What tool do internship teams use to track their tasks?',
                  type: 'multiple_choice',
                  options: [
                    'Trello',
                    'Excel spreadsheet',
                    'A built-in Kanban board',
                    'Email',
                  ],
                  correctOptionIndex: 2,
                  explanation:
                    'BootSkills includes a built-in Kanban board for internship teams to manage tasks.',
                },
                {
                  questionText: 'How can you see your overall learning progress?',
                  type: 'multiple_choice',
                  options: [
                    'Through the Student Portal dashboard',
                    'By email only',
                    'By contacting support',
                    'You cannot track progress',
                  ],
                  correctOptionIndex: 0,
                  explanation:
                    'The Student Portal dashboard shows your course progress, XP, streaks, and recent activity.',
                },
              ],
            },
            // Exam 2 — Assignment in exam mode
            {
              title: 'Module 2: Final Assessment',
              content:
                '## Module 2 Final Assessment\n\nComplete this final exam to demonstrate what you have learned about the platform features.',
              type: 'assignment',
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription:
                'Answer the following questions to complete the demo course. This shows how the full exam and grading system works on BootSkills.',
              assignmentConfig: {
                timeLimit: 10,
                allowRetakes: true,
                disableRightClick: false,
                mode: 'exam',
              },
              assignmentQuestions: [
                {
                  questionText: 'Which of the following is included in a BootSkills certificate?',
                  type: 'mcq',
                  options: [
                    'Your home address',
                    'A unique credential ID for verification',
                    'Your social media accounts',
                    'Your phone number',
                  ],
                  correctOptionIndex: 1,
                  explanation:
                    'Each certificate includes a unique credential ID that can be used for verification.',
                  points: 10,
                },
                {
                  questionText:
                    'What feature of BootSkills are you most excited to use, and why?',
                  type: 'open',
                  explanation:
                    'Any thoughtful answer is valid. The platform is designed to support a wide range of learning goals.',
                  points: 20,
                },
              ],
              order: 4,
            },
          ],
        },
      ],
    };

    // ─── Upsert the course ────────────────────────────────────────────────

    const course = await Course.findOneAndUpdate(
      { title: courseData.title },
      { $set: courseData },
      { upsert: true, new: true },
    );

    console.log(`✅ Course created: "${course.title}"`);
    console.log(`   Price:        FREE`);
    console.log(`   Category:     ${course.category}`);
    console.log(`   Level:        ${course.level}`);
    console.log(`   Status:       ${course.status}`);
    console.log(`   Modules:      ${course.modules.length}`);
    course.modules.forEach((m: any, mi: number) => {
      console.log(`     Module ${mi + 1}: "${m.title}" (${m.lessons.length} lessons)`);
      m.lessons.forEach((l: any, li: number) => {
        const typeIcon: Record<string, string> = {
          video: '🎬',
          article: '📄',
          quiz: '❓',
          assignment: '📝',
        };
        console.log(`       ${typeIcon[l.type] || '📌'} Lesson ${li + 1}: "${l.title}" (${l.type})`);
      });
    });

    // ─── Enroll the admin ─────────────────────────────────────────────────

    // Add course to admin's enrolledCourses
    if (!admin.enrolledCourses) admin.enrolledCourses = [];
    const alreadyEnrolled = admin.enrolledCourses.some(
      (c: any) => c.toString() === course._id.toString(),
    );
    if (!alreadyEnrolled) {
      admin.enrolledCourses.push(course._id);
      await admin.save();
      console.log(`\n✅ Admin enrolled in course: ${admin.fullName}`);
    } else {
      console.log(`\n⏭️  Admin already enrolled in this course`);
    }

    // Add admin to course's studentsEnrolled
    const alreadyStudent = course.studentsEnrolled.some(
      (s: any) => s.toString() === admin._id.toString(),
    );
    if (!alreadyStudent) {
      course.studentsEnrolled.push(admin._id);
      await course.save();
    }

    // Create CourseProgress record
    await CourseProgress.findOneAndUpdate(
      { userId: admin._id, courseId: course._id },
      {
        $setOnInsert: {
          userId: admin._id,
          courseId: course._id,
          status: 'active',
          overallProgress: 0,
          totalTimeSpent: 0,
          lessons: [],
        },
      },
      { upsert: true },
    );
    console.log(`✅ CourseProgress record created for admin\n`);

    // ─── Summary ──────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  SEED COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Course:    "${course.title}"`);
    console.log(`  Price:     FREE (0 RWF)`);
    console.log(`  Assigned:  ${admin.fullName} (${admin.email})`);
    console.log(`  Modules:   ${course.modules.length}`);
    const totalLessons = course.modules.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length || 0),
      0,
    );
    console.log(`  Lessons:   ${totalLessons} (incl. ${course.modules.length} quizzes + ${course.modules.length} exams)`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedIntroDemoCourse();
