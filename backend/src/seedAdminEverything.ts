import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Course } from './models/Course';
import { Payment } from './models/Payment';
import { AdminCommission } from './models/AdminCommission';
import { Project } from './models/Project';
import { CourseProgress } from './models/CourseProgress';
import { Booking } from './models/Booking';
import connectDB from './config/db';

dotenv.config();

const ADMIN_EMAILS = ['admin@bootskills.com', 'superadmin@bootskills.com'];

const createLessons = (baseTitle: string, count: number) => {
  const types = ['video', 'article', 'quiz', 'pdf', 'project'];
  const videoIds = [
    'bMknfKXIFA8',
    '8hly31CYzvc',
    'PkZNo7MFNFg',
    'm7fN6X2C8w8',
    'Z6Id6nQ8eE8',
    '9He4U764o1s',
    'S6L78-Fm0pA'
  ];
  const pdfUrls = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://pdfobject.com/pdf/sample.pdf',
    'https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf'
  ];

  const lessons = [];
  for (let i = 1; i <= count; i++) {
    const isActuallyAssignment = i % 5 === 0;
    const isQuiz = i % 4 === 0 && !isActuallyAssignment;
    const type = isActuallyAssignment ? 'assignment' : isQuiz ? 'quiz' : types[i % types.length];
    const unitTitle = `${baseTitle} - Unit ${i}: ${isActuallyAssignment ? 'Practical Lab' : isQuiz ? 'Knowledge Check' : 'Concepts'}`;
    lessons.push({
      title: unitTitle,
      content: `## ${unitTitle}\n\nThis lesson covers advanced concepts in **${baseTitle}**. \n\n### Learning Objectives:\n1. Understand the core principles of ${baseTitle}.\n2. Apply practical techniques in real-world scenarios.\n3. Master industry-standard workflows.`,
      duration: 15 + (i * 5),
      type: type,
      videoUrl: type === 'video' ? `https://www.youtube.com/watch?v=${videoIds[i % videoIds.length]}` : null,
      fileUrl: type === 'pdf' ? pdfUrls[i % pdfUrls.length] : null,
      isAssignment: isActuallyAssignment,
      requiredAssignment: isActuallyAssignment,
      assignmentDescription: isActuallyAssignment ? `### Assignment for ${unitTitle}\n\nPlease implement the solution for the following challenge:\n\n1. Design a comprehensive system for ${baseTitle}.\n2. Ensure scalability and security.\n3. Document your decision-making process.` : null,
      assignmentDeliverables: isActuallyAssignment ? ['Project Repository Link', 'Design Documentation (PDF)', 'Live URL'] : []
    });
  }
  return lessons;
};

async function seedAdminEverything() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ── 1. Find/Create Admin & Super Admin Users ───────────────────────
    const admins: any[] = [];
    for (const email of ADMIN_EMAILS) {
      const role = email === 'superadmin@bootskills.com' ? 'super_admin' : 'admin';
      let adminUser = await User.findOne({ email });
      if (!adminUser) {
        const username = email === 'superadmin@bootskills.com' ? 'super_admin' : 'admin';
        const fullName = email === 'superadmin@bootskills.com' ? 'System Super Admin' : 'Bootskills Admin';
        const adminPermissions = role === 'admin'
          ? ['users', 'courses', 'payments', 'internships', 'analytics', 'students']
          : [];
        adminUser = await new User({
          username,
          fullName,
          email,
          password: hashedPassword,
          role,
          permissions: adminPermissions,
          title: 'Head of Operations',
          bio: 'Platform administrator and operations lead for Bootskills.',
          location: 'Kigali, Rwanda',
          phone: '+250780000001',
          status: 'active',
          isEmailVerified: true,
          level: 40,
          xp: 8000,
        }).save();
        console.log(`✅ Created user: ${email} (${role})`);
      } else {
        // Update password to match
        adminUser.password = hashedPassword;
        // Ensure admin has all permissions
        if (role === 'admin') {
          adminUser.permissions = ['users', 'courses', 'payments', 'internships', 'analytics', 'students'];
        }
        await adminUser.save();
        console.log(`✅ Updated password for: ${email}`);
      }
      admins.push(adminUser);
    }

    // ── 2. Sample Students ────────────────────────────────────────────
    const primaryAdmin = admins[0];
    const studentEmails = ['alice@example.com', 'bob@example.com', 'carla@example.com'];
    const students: any[] = [];
    for (const email of studentEmails) {
      let student = await User.findOne({ email });
      if (!student) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const username = email.split('@')[0];
        student = await new User({
          username: `student_${username}`,
          fullName: username.charAt(0).toUpperCase() + username.slice(1),
          email,
          password: hashedPassword,
          role: 'student',
          createdBy: primaryAdmin._id,
          status: 'active',
          isEmailVerified: true,
          level: 5,
          xp: 500,
        }).save();
        // Seed activity logs for user management "Recent Activity" section
        student.activityLog.push({ action: 'account_created', details: 'Account created via admin seeding', timestamp: new Date(Date.now() - 86400000) });
        student.activityLog.push({ action: 'course_enrolled', details: 'Enrolled in all available courses', timestamp: new Date() });
        await student.save();
        console.log(`✅ Created student: ${email} (created by ${primaryAdmin.email})`);
      } else {
        // Update with createdBy if missing
        if (!student.createdBy) {
          student.createdBy = primaryAdmin._id;
        }
        if (!student.activityLog || student.activityLog.length === 0) {
          student.activityLog.push({ action: 'account_created', details: 'Account created via admin seeding', timestamp: new Date(Date.now() - 86400000) });
        }
        await student.save();
      }
      students.push(student);
    }

    // ── 3. Courses created by admins ───────────────────────────────────
    const adminCourseData = [
      {
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, and JavaScript from scratch. Build modern responsive websites with hands-on projects.',
        price: 1000,
        category: 'Web Development',
        level: 'Beginner',
        status: 'published',
        modules: [
          {
            title: 'HTML & CSS Basics',
            description: 'Introduction to web structure and styling',
            lessons: [
              { title: 'Introduction to HTML', duration: 15, type: 'video', content: 'Learn the basic structure of HTML documents.' },
              { title: 'CSS Styling', duration: 20, type: 'video', content: 'Master CSS selectors, properties, and layout techniques.' },
              { title: 'Building Your First Page', duration: 30, type: 'assignment', content: 'Build a simple portfolio page using HTML and CSS.' },
            ]
          },
          {
            title: 'JavaScript Essentials',
            description: 'Core programming concepts with JavaScript',
            lessons: [
              { title: 'Variables & Data Types', duration: 20, type: 'video', content: 'Understanding JavaScript variables and data types.' },
              { title: 'Functions & Control Flow', duration: 25, type: 'video', content: 'Learn about functions, conditionals, and loops.' },
              { title: 'DOM Manipulation', duration: 30, type: 'assignment', content: 'Interactive web pages with the Document Object Model.' },
            ]
          }
        ]
      },
      {
        title: 'Data Science & Analytics',
        description: 'Introduction to data analysis, visualization, and machine learning concepts using Python.',
        price: 1000,
        category: 'Data Science',
        level: 'Intermediate',
        status: 'published',
        modules: [
          {
            title: 'Python for Data Science',
            description: 'Python programming fundamentals for data analysis',
            lessons: [
              { title: 'Python Basics', duration: 20, type: 'video', content: 'Introduction to Python programming for data science.' },
              { title: 'NumPy & Pandas', duration: 30, type: 'video', content: 'Working with numerical data and dataframes.' },
              { title: 'Data Cleaning Exercise', duration: 25, type: 'assignment', content: 'Clean and prepare a real-world dataset.' },
            ]
          },
          {
            title: 'Data Visualization',
            description: 'Creating insightful visualizations',
            lessons: [
              { title: 'Matplotlib Basics', duration: 20, type: 'video', content: 'Creating basic charts and plots.' },
              { title: 'Statistical Analysis', duration: 25, type: 'video', content: 'Understanding descriptive and inferential statistics.' },
              { title: 'Visualization Project', duration: 35, type: 'assignment', content: 'Create a comprehensive data dashboard.' },
            ]
          }
        ]
      },
      {
        title: 'Mobile App Development with React Native',
        description: 'Build cross-platform mobile applications using React Native and Expo.',
        price: 1000,
        discountPrice: 75000,
        category: 'Mobile Development',
        level: 'Intermediate',
        status: 'published',
        modules: [
          {
            title: 'React Native Fundamentals',
            description: 'Getting started with mobile development',
            lessons: [
              { title: 'Environment Setup', duration: 15, type: 'video', content: 'Setting up React Native and Expo development environment.' },
              { title: 'Core Components', duration: 25, type: 'video', content: 'Understanding React Native core components.' },
              { title: 'First Mobile App', duration: 30, type: 'assignment', content: 'Build a simple mobile app from scratch.' },
            ]
          },
          {
            title: 'Navigation & State',
            description: 'Managing app navigation and state',
            lessons: [
              { title: 'React Navigation', duration: 20, type: 'video', content: 'Implementing navigation in React Native apps.' },
              { title: 'State Management', duration: 25, type: 'video', content: 'Managing application state with Context API.' },
              { title: 'Navigation Exercise', duration: 30, type: 'assignment', content: 'Implement multi-screen navigation.' },
            ]
          }
        ]
      },
      // ── Additional courses from seed.ts ────────────────────────────
      {
        title: 'Luxury Hotel Management & Operations',
        description: 'Master the art of hospitality. Learn front desk operations, guest relations, and luxury service standards.',
        price: 1000,
        discountPrice: 12000,
        category: 'Hospitality',
        level: 'Intermediate',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Guest Experience & Front Office', description: 'Managing the first impression and check-in workflows.', lessons: createLessons('Front Desk Ops', 4) },
          { title: 'Housekeeping & Maintenance', description: 'Maintaining 5-star luxury standards across the property.', lessons: createLessons('Luxury Maintenance', 4) },
        ],
      },
      {
        title: 'Advanced Cloud Computing with AWS',
        description: 'Deploy, manage, and scale secure applications on Amazon Web Services. Prepare for the Solutions Architect exam.',
        price: 1000,
        category: 'Technology',
        level: 'Advanced',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
        modules: [
          { title: 'Compute & Serverless', description: 'Mastering EC2, Lambda, and ECS.', lessons: createLessons('AWS Compute', 5) },
          { title: 'Networking & Security', description: 'VPCs, IAM, and secure cloud perimeters.', lessons: createLessons('Cloud Security', 5) },
        ],
      },
      {
        title: 'Modern Agri-Tech & Sustainable Farming',
        description: 'Leverage IoT sensors, drone imaging, and sustainable practices to maximize crop yield while protecting the environment.',
        price: 0,
        discountPrice: 0,
        category: 'Agriculture',
        level: 'Beginner',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Precision Farming', description: 'Using data to optimize irrigation and fertilization.', lessons: createLessons('Agri-Data', 3) },
          { title: 'Sustainable Soil Management', description: 'Organic techniques and crop rotation.', lessons: createLessons('Soil Health', 4) },
        ],
      },
      {
        title: 'Global Macroeconomics & Market Trends',
        description: 'Understand inflation, monetary policy, and how global events shape financial markets.',
        price: 150,
        category: 'Economics',
        level: 'Intermediate',
        status: 'published',
        enrollmentMode: 'application',
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Monetary Policy & Central Banks', description: 'How interest rates dictate market liquidity.', lessons: createLessons('Central Banking', 4) },
          { title: 'International Trade & Tariffs', description: 'Analyzing supply chains and geopolitical economics.', lessons: createLessons('Global Trade', 4) },
        ],
      },
      {
        title: 'Early Childhood Education & Development',
        description: 'Learn child psychology, cognitive development stages, and how to create engaging learning environments for toddlers.',
        price: 0,
        category: 'Childcare',
        level: 'Beginner',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=2073&auto=format&fit=crop',
        modules: [
          { title: 'Cognitive & Motor Skills', description: 'Understanding developmental milestones.', lessons: createLessons('Child Psychology', 5) },
          { title: 'Play-Based Learning', description: 'Designing activities that educate and entertain.', lessons: createLessons('Interactive Play', 3) },
        ],
      },
      {
        title: 'Full-Stack Web Development with Next.js & GraphQL',
        description: 'Build enterprise-grade applications with modern React, Server Components, and a performant GraphQL API tier.',
        price: 1000,
        discountPrice: 28000,
        category: 'Technology',
        level: 'Advanced',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Next.js App Router Architecture', description: 'Mastering Server Components, Client Components, Suspense, and Streaming.', lessons: createLessons('App Router', 4) },
          { title: 'GraphQL API Design', description: 'Designing modular schemas and performant resolvers with Apollo Server.', lessons: createLessons('GraphQL Schema', 4) },
        ],
      },
      {
        title: 'Artificial Intelligence & Machine Learning Basics',
        description: 'Understand the mathematical foundations and code implementations of popular AI/ML algorithms using Python.',
        price: 0,
        category: 'AI',
        level: 'Beginner',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Linear Algebra & Numerical Python', description: 'Essential mathematics and operations in NumPy.', lessons: createLessons('Math & NumPy', 3) },
          { title: 'Supervised Learning', description: 'Implementing regressions and classifications using Scikit-Learn.', lessons: createLessons('Supervised ML', 4) },
        ],
      },
      {
        title: 'UI/UX Design Masterclass: Figma to Production',
        description: 'Master high-fidelity user interface layouts, interactive prototypes, and UX user journeys using Figma.',
        price: 1000,
        discountPrice: 15000,
        category: 'Design',
        level: 'Intermediate',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=2064&auto=format&fit=crop',
        modules: [
          { title: 'Design Systems & Tokens', description: 'Configuring typography, color models, grids, and components in Figma.', lessons: createLessons('Design Systems', 4) },
          { title: 'Advanced Interactive Prototyping', description: 'Setting up smart-animates, variable binds, and complex user flows.', lessons: createLessons('Prototyping', 4) },
        ],
      },
      {
        title: 'Financial Modeling & Valuation Techniques',
        description: 'Master discounted cash flows, leveraged buyouts, and comparative analytics models to analyze global corporations.',
        price: 1000,
        category: 'Finance',
        level: 'Advanced',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Discounted Cash Flow Model', description: 'Calculating WACC, terminal values, and net present value.', lessons: createLessons('DCF Valuation', 5) },
          { title: 'LBO Modeling & Ratios', description: 'Leveraged buyouts, debt scheduling, and internal rate of return.', lessons: createLessons('LBO Modeling', 4) },
        ],
      },
      {
        title: 'Digital Marketing Strategy & Growth Hacking',
        description: 'Accelerate user acquisition via SEO, SEM, advanced analytics, and automated custom funnels.',
        price: 0,
        category: 'Marketing',
        level: 'Beginner',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
        modules: [
          { title: 'SEO & Search Engine Algorithms', description: 'On-page optimizations, crawl audits, and domain authority.', lessons: createLessons('SEO Mastery', 3) },
          { title: 'Custom Conversion Funnels', description: 'Configuring analytics tools and optimizing user conversion rate.', lessons: createLessons('Growth Funnels', 4) },
        ],
      },
      {
        title: 'Micro-Economics & Competitive Business Strategy',
        description: 'Understand competitive dynamics, monopoly power, pricing strategies, and game theory models.',
        price: 120,
        category: 'Economics',
        level: 'Intermediate',
        status: 'published',
        enrollmentMode: 'direct',
        thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070&auto=format&fit=crop',
        modules: [
          { title: 'Pricing Power & Monopoly Strategy', description: 'Price discrimination models and market share maximization.', lessons: createLessons('Pricing Models', 4) },
          { title: 'Game Theory & Nash Equilibrium', description: 'Analyzing strategic interactions in oligopolies.', lessons: createLessons('Game Theory', 4) },
        ],
      },
    ];

    const createdCourses: any[] = [];
    for (const admin of admins) {
      console.log(`\n📚 Seeding courses for ${admin.email}...`);
      for (const courseData of adminCourseData) {
        // Check if course already exists for this admin (check by title + instructor)
        const existing = await Course.findOne({ title: courseData.title, instructor: admin._id });
        if (existing) {
          console.log(`⏭️  Course already exists for ${admin.email}: ${courseData.title}`);
          createdCourses.push(existing);
          continue;
        }

        const course = await new Course({
          ...courseData,
          instructor: admin._id,
          createdBy: admin._id,
          school: 'Bootskills Academy',
          modulesCount: courseData.modules.length,
          totalLessonsCount: courseData.modules.reduce((sum, m) => sum + m.lessons.length, 0),
          studentsEnrolled: [],
        }).save();
        console.log(`✅ Created course for ${admin.email}: ${courseData.title}`);
        createdCourses.push(course);
      }
    }

    // ── 4. Enroll students and create payments ─────────────────────────
    for (const course of createdCourses) {
      for (const student of students) {
        // Enroll student in course
        if (!course.studentsEnrolled.some((id: any) => id.toString() === student._id.toString())) {
          course.studentsEnrolled.push(student._id);
        }
        if (!student.enrolledCourses) student.enrolledCourses = [];
        if (!student.enrolledCourses.some((id: any) => id.toString() === course._id.toString())) {
          student.enrolledCourses.push(course._id);
        }

        // Create payment record
        const existingPayment = await Payment.findOne({
          userId: student._id,
          courseId: course._id,
          status: 'completed',
        });
        if (!existingPayment) {
          await new Payment({
            userId: student._id,
            courseId: course._id,
            amount: course.discountPrice || course.price,
            currency: 'RWF',
            status: 'completed',
            paymentMethod: 'Mobile Money',
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
            type: 'Course Enrollment',
            itemTitle: course.title,
            courseIds: [course._id],
          }).save();
        }

        // Initialize course progress
        await CourseProgress.findOneAndUpdate(
          { userId: student._id, courseId: course._id },
          {
            $setOnInsert: {
              userId: student._id,
              courseId: course._id,
              totalTimeSpent: Math.floor(Math.random() * 3000),
              overallProgress: Math.floor(Math.random() * 60) + 20,
              status: 'active',
              lessons: [],
            }
          },
          { upsert: true }
        );

      }
      await course.save();
      console.log(`✅ Enrolled students in: ${course.title}`);
    }

    // Save all students once after enrollments
    for (const student of students) {
      await student.save();
    }

    // ── 5. Commission Configs for all admins ────────────────────────────
    for (const admin of admins) {
      console.log(`\n💼 Creating commission configs for ${admin.email}...`);

      const commissionConfigs: Array<{
        scope: string;
        percentage: number;
        description: string;
        scopeId?: any;
        scopeTitle?: string;
      }> = [
        { scope: 'global', percentage: 10, description: 'Standard 10% commission on all payments' },
      ];

      for (const course of createdCourses) {
        commissionConfigs.push({
          scope: 'course',
          scopeId: course._id,
          scopeTitle: course.title,
          percentage: 15,
          description: `15% commission for ${course.title}`,
        });
      }

      for (const config of commissionConfigs) {
        const filter: any = { adminId: admin._id, scope: config.scope };
        if ((config as any).scopeId) filter.scopeId = (config as any).scopeId;

        const existing = await AdminCommission.findOne(filter);
        if (!existing) {
          await new AdminCommission({
            adminId: admin._id,
            scope: config.scope,
            scopeId: (config as any).scopeId || null,
            scopeTitle: (config as any).scopeTitle || null,
            percentage: config.percentage,
            description: config.description,
            active: true,
          }).save();
          console.log(`  ✅ Created config: ${config.scope}${config.scopeTitle ? ' - ' + config.scopeTitle : ''}`);
        } else {
          console.log(`  ⏭️  Exists: ${config.scope}${config.scopeTitle ? ' - ' + config.scopeTitle : ''}`);
        }
      }
    }

    // ── 6. Sample Projects ─────────────────────────────────────────────
    const projectTemplates = [
      { title: 'E-commerce Website', course: 'Web Development Fundamentals', type: 'Team Project', description: 'Build a full e-commerce platform with product listings, cart, and checkout.' },
      { title: 'Sales Dashboard', course: 'Data Science & Analytics', type: 'Individual', description: 'Create an interactive sales performance dashboard with visualizations.' },
      { title: 'Fitness Tracker App', course: 'Mobile App Development with React Native', type: 'Individual', description: 'Develop a cross-platform fitness tracking mobile application.' },
    ];

    for (const pt of projectTemplates) {
      const existing = await Project.findOne({ title: pt.title });
      if (!existing) {
        const matchingCourse = createdCourses.find(c => c.title === pt.course);
        const assignedStudent = students[Math.floor(Math.random() * students.length)];
        await new Project({
          title: pt.title,
          course: pt.course,
          type: pt.type,
          description: pt.description,
          userId: assignedStudent._id,
          status: Math.random() > 0.5 ? 'in_progress' : 'pending_review',
          progress: Math.floor(Math.random() * 80) + 10,
          mentors: [primaryAdmin._id],
          team: [
            { userId: assignedStudent._id, name: assignedStudent.fullName, role: 'Developer' },
          ],
          tasks: [
            { title: 'Setup project structure', completed: true },
            { title: 'Implement core features', completed: Math.random() > 0.3 },
            { title: 'Testing & QA', completed: false },
            { title: 'Deployment', completed: false },
          ],
        }).save();
        console.log(`✅ Created project: ${pt.title}`);
      } else {
        console.log(`⏭️  Project exists: ${pt.title}`);
      }
    }

    // ── 7. Sample Bookings ─────────────────────────────────────────────
    for (const student of students) {
      const existing = await Booking.findOne({ userId: student._id, mentorId: primaryAdmin._id });
      if (!existing) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
        await new Booking({
          userId: student._id,
          mentorId: primaryAdmin._id,
          type: 'mentorship',
          date: futureDate.toISOString().split('T')[0],
          time: `${10 + Math.floor(Math.random() * 8)}:00`,
          topic: ['Project Review', 'Career Guidance', 'Technical Mentorship'][Math.floor(Math.random() * 3)],
          status: Math.random() > 0.3 ? 'confirmed' : 'pending',
          deliveryMode: 'online',
        }).save();
        console.log(`✅ Created booking for ${student.fullName}`);
      }
    }

    console.log('\n🎉 Seeding complete for all admin accounts!');
    for (const a of admins) {
      console.log(`   👤 ${a.email} (${a.role})`);
    }
    console.log('   📚 Courses: ' + createdCourses.length);
    console.log('   👥 Students enrolled: ' + students.length * createdCourses.length);
    console.log('   💰 Commission configs: ' + (1 + createdCourses.length) * admins.length + ' (1 global + ' + createdCourses.length + ' per-course x ' + admins.length + ' admins)');
    console.log('   📋 Projects: ' + projectTemplates.length);
    console.log('   📅 Bookings: ' + students.length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    process.exit(1);
  }
}

seedAdminEverything();
