import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { Message } from './models/Message';
import { Conversation } from './models/Conversation';
import { Course } from './models/Course';
import { Project } from './models/Project';
import { Certificate } from './models/Certificate';
import { Internship } from './models/Internship';
import { Booking } from './models/Booking';
import { Question } from './models/Question';
import { Badge } from './models/Badge';
import { Payment } from './models/Payment';
import { StudentProfile } from './models/StudentProfile';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { InternshipPayment } from './models/internship/Payment';
import { InternshipApplication } from './models/internship/InternshipApplication';
import { InternshipProject } from './models/internship/InternshipProject';
import { InternshipTeam } from './models/internship/Team';
import { InternshipTeamMember } from './models/internship/TeamMember';
import { InternshipMilestone } from './models/internship/Milestone';
import { InternshipSubmission } from './models/internship/Submission';
import { InternshipMentorFeedback } from './models/internship/MentorFeedback';
import { InternshipActivityLog } from './models/internship/ActivityLog';
import { InternshipCertificate } from './models/internship/Certificate';
import { InternshipInvoice } from './models/internship/Invoice';
import connectDB from './config/db';

dotenv.config();

const createLessons = (baseTitle: string, count: number) => {
  const types = ['video', 'article', 'quiz', 'pdf', 'project'];
  const videoIds = [
    'bMknfKXIFA8', // React
    '8hly31CYzvc', // Node.js
    'PkZNo7MFNFg', // JS
    'm7fN6X2C8w8', // Hospitality
    'Z6Id6nQ8eE8', // Agriculture
    '9He4U764o1s', // Economics
    'S6L78-Fm0pA'  // Childcare
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

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing data...');
    const models = [
      User, Message, Conversation, Course, Project, Certificate, Internship, Booking, Question, Badge, Payment,
      StudentProfile, InternshipProgram, InternshipPayment, InternshipApplication, InternshipProject,
      InternshipTeam, InternshipTeamMember, InternshipMilestone, InternshipSubmission,
      InternshipMentorFeedback, InternshipActivityLog, InternshipCertificate, InternshipInvoice
    ];

    for (const model of models) {
      await (model as any).deleteMany({});
    }

    console.log('👤 Creating Users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const superAdmin = await new User({
      username: 'super_admin',
      email: 'superadmin@ihub.com',
      password: hashedPassword,
      role: 'super_admin',
      fullName: 'System Super Admin',
      title: 'Chief Operations',
      avatar: 'https://i.pravatar.cc/150?u=superadmin'
    }).save();

    const admin = await new User({
      username: 'admin',
      email: 'admin@ihub.com',
      password: hashedPassword,
      role: 'admin',
      fullName: 'System Administrator',
      title: 'Head of Academy',
      avatar: 'https://i.pravatar.cc/150?u=admin'
    }).save();

    const trainer1 = await new User({
      username: 'innovator_john',
      email: 'john@ihub.com',
      password: hashedPassword,
      role: 'trainer',
      fullName: 'John Innovator',
      title: 'Senior Full Stack Engineer',
      bio: 'Ex-Google engineer with 10 years of experience in React and Node.js. Passionate about teaching the next generation of African tech leaders.',
      skills: ['React', 'Node.js', 'System Design', 'Cloud Architecture'],
      avatar: 'https://i.pravatar.cc/150?u=john'
    }).save();

    const trainer2 = await new User({
      username: 'sarah_ai',
      email: 'sarah@ihub.com',
      password: hashedPassword,
      role: 'trainer',
      fullName: 'Sarah Data',
      title: 'Lead Data Scientist',
      bio: 'PhD in Machine Learning. Expert in Python, TensorFlow, and extracting insights from complex datasets.',
      skills: ['Python', 'Machine Learning', 'Data Visualization', 'SQL'],
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    }).save();

    // Students
    const student1 = await new User({
      username: 'student_alice',
      email: 'alice@student.com',
      password: hashedPassword,
      role: 'student',
      fullName: 'Alice Keza',
      title: 'Aspiring Frontend Developer',
      avatar: 'https://i.pravatar.cc/150?u=alice'
    }).save();

    const student2 = await new User({
      username: 'student_bob',
      email: 'bob@student.com',
      password: hashedPassword,
      role: 'student',
      fullName: 'Bob Manzi',
      title: 'Backend Enthusiast',
      avatar: 'https://i.pravatar.cc/150?u=bob'
    }).save();

    console.log('📚 Creating Courses...');
    const hotelCourse = await new Course({
      title: 'Luxury Hotel Management & Operations',
      description: 'Master the art of hospitality. Learn front desk operations, guest relations, and luxury service standards.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 15000,
      discountPrice: 12000,
      category: 'Hospitality',
      level: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Guest Experience & Front Office',
          description: 'Managing the first impression and check-in workflows.',
          lessons: createLessons('Front Desk Ops', 4)
        },
        {
          title: 'Housekeeping & Maintenance',
          description: 'Maintaining 5-star luxury standards across the property.',
          lessons: createLessons('Luxury Maintenance', 4)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: [student1._id]
    } as any).save();
 
    const techCourse = await new Course({
      title: 'Advanced Cloud Computing with AWS',
      description: 'Deploy, manage, and scale secure applications on Amazon Web Services. Prepare for the Solutions Architect exam.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 25000,
      category: 'Technology',
      level: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
      modules: [
        {
          title: 'Compute & Serverless',
          description: 'Mastering EC2, Lambda, and ECS.',
          lessons: createLessons('AWS Compute', 5)
        },
        {
          title: 'Networking & Security',
          description: 'VPCs, IAM, and secure cloud perimeters.',
          lessons: createLessons('Cloud Security', 5)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: [student2._id]
    } as any).save();
 
    const agricultureCourse = await new Course({
      title: 'Modern Agri-Tech & Sustainable Farming',
      description: 'Leverage IoT sensors, drone imaging, and sustainable practices to maximize crop yield while protecting the environment.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 0,
      discountPrice: 0,
      category: 'Agriculture',
      level: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Precision Farming',
          description: 'Using data to optimize irrigation and fertilization.',
          lessons: createLessons('Agri-Data', 3)
        },
        {
          title: 'Sustainable Soil Management',
          description: 'Organic techniques and crop rotation.',
          lessons: createLessons('Soil Health', 4)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: []
    } as any).save();
 
    const economicsCourse = await new Course({
      title: 'Global Macroeconomics & Market Trends',
      description: 'Understand inflation, monetary policy, and how global events shape financial markets.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 150,
      category: 'Economics',
      level: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Monetary Policy & Central Banks',
          description: 'How interest rates dictate market liquidity.',
          lessons: createLessons('Central Banking', 4)
        },
        {
          title: 'International Trade & Tariffs',
          description: 'Analyzing supply chains and geopolitical economics.',
          lessons: createLessons('Global Trade', 4)
        }
      ],
      status: 'published',
      enrollmentMode: 'application',
      studentsEnrolled: []
    } as any).save();

    const childcareCourse = await new Course({
      title: 'Early Childhood Education & Development',
      description: 'Learn child psychology, cognitive development stages, and how to create engaging learning environments for toddlers.',
      instructor: admin._id,
      createdBy: admin._id,
      price: 0, // Free community course
      category: 'Childcare',
      level: 'Beginner',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=2073&auto=format&fit=crop',
      modules: [
        {
          title: 'Cognitive & Motor Skills',
          description: 'Understanding developmental milestones.',
          lessons: createLessons('Child Psychology', 5)
        },
        {
          title: 'Play-Based Learning',
          description: 'Designing activities that educate and entertain.',
          lessons: createLessons('Interactive Play', 3)
        }
      ],
      status: 'published',
      studentsEnrolled: [student1._id, student2._id]
    } as any).save();

    const nextjsCourse = await new Course({
      title: 'Full-Stack Web Development with Next.js & GraphQL',
      description: 'Build enterprise-grade applications with modern React, Server Components, and a performant GraphQL API tier.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 35000,
      discountPrice: 28000,
      category: 'Technology',
      level: 'Advanced',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Next.js App Router Architecture',
          description: 'Mastering Server Components, Client Components, Suspense, and Streaming.',
          lessons: createLessons('App Router', 4)
        },
        {
          title: 'GraphQL API Design',
          description: 'Designing modular schemas and performant resolvers with Apollo Server.',
          lessons: createLessons('GraphQL Schema', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    const aiCourse = await new Course({
      title: 'Artificial Intelligence & Machine Learning Basics',
      description: 'Understand the mathematical foundations and code implementations of popular AI/ML algorithms using Python.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 0, // Free
      category: 'AI',
      level: 'Beginner',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Linear Algebra & Numerical Python',
          description: 'Essential mathematics and operations in NumPy.',
          lessons: createLessons('Math & NumPy', 3)
        },
        {
          title: 'Supervised Learning',
          description: 'Implementing regressions and classifications using Scikit-Learn.',
          lessons: createLessons('Supervised ML', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    const uiuxCourse = await new Course({
      title: 'UI/UX Design Masterclass: Figma to Production',
      description: 'Master high-fidelity user interface layouts, interactive prototypes, and UX user journeys using Figma.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 18000,
      discountPrice: 15000,
      category: 'Design',
      level: 'Intermediate',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=2064&auto=format&fit=crop',
      modules: [
        {
          title: 'Design Systems & Tokens',
          description: 'Configuring typography, color models, grids, and components in Figma.',
          lessons: createLessons('Design Systems', 4)
        },
        {
          title: 'Advanced Interactive Prototyping',
          description: 'Setting up smart-animates, variable binds, and complex user flows.',
          lessons: createLessons('Prototyping', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    const financeCourse = await new Course({
      title: 'Financial Modeling & Valuation Techniques',
      description: 'Master discounted cash flows, leveraged buyouts, and comparative analytics models to analyze global corporations.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 20000,
      category: 'Finance',
      level: 'Advanced',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Discounted Cash Flow Model',
          description: 'Calculating WACC, terminal values, and net present value.',
          lessons: createLessons('DCF Valuation', 5)
        },
        {
          title: 'LBO Modeling & Ratios',
          description: 'Leveraged buyouts, debt scheduling, and internal rate of return.',
          lessons: createLessons('LBO Modeling', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    const marketingCourse = await new Course({
      title: 'Digital Marketing Strategy & Growth Hacking',
      description: 'Accelerate user acquisition via SEO, SEM, advanced analytics, and automated custom funnels.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 0, // Free
      category: 'Marketing',
      level: 'Beginner',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop',
      modules: [
        {
          title: 'SEO & Search Engine Algorithms',
          description: 'On-page optimizations, crawl audits, and domain authority.',
          lessons: createLessons('SEO Mastery', 3)
        },
        {
          title: 'Custom Conversion Funnels',
          description: 'Configuring analytics tools and optimizing user conversion rate.',
          lessons: createLessons('Growth Funnels', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    const microEconomicsCourse = await new Course({
      title: 'Micro-Economics & Competitive Business Strategy',
      description: 'Understand competitive dynamics, monopoly power, pricing strategies, and game theory models.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 120, // 120 RWF
      category: 'Economics',
      level: 'Intermediate',
      enrollmentMode: 'direct',
      thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Pricing Power & Monopoly Strategy',
          description: 'Price discrimination models and market share maximization.',
          lessons: createLessons('Pricing Models', 4)
        },
        {
          title: 'Game Theory & Nash Equilibrium',
          description: 'Analyzing strategic interactions in oligopolies.',
          lessons: createLessons('Game Theory', 4)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    // ── Seed Quiz Questions for all courses ──
    const allCourses = [
      hotelCourse, 
      techCourse, 
      agricultureCourse, 
      economicsCourse, 
      childcareCourse,
      nextjsCourse,
      aiCourse,
      uiuxCourse,
      financeCourse,
      marketingCourse,
      microEconomicsCourse
    ];
    console.log('❓ Seeding Quiz Questions...');
    for (const course of allCourses) {
      for (const mod of (course as any).modules) {
        for (const lesson of mod.lessons) {
          if (lesson.type === 'quiz') {
            await new Question({
              courseId: (course as any)._id,
              lessonId: lesson._id,
              questionText: `What is a primary goal of "${(course as any).title}"?`,
              options: ['Efficiency', 'Scalability', 'Reliability', 'All of the above'],
              correctOptionIndex: 3,
              explanation: 'In modern software engineering, we strive for all these qualities simultaneously.'
            }).save();
            await new Question({
              courseId: (course as any)._id,
              lessonId: lesson._id,
              questionText: `Which concept is covered in: "${lesson.title}"?`,
              options: ['Advanced Architecture', 'Basic Syntax', 'Deployment Pipelines', 'Testing Strategies'],
              correctOptionIndex: 0,
              explanation: 'This lesson focuses on high-level architectural patterns.'
            }).save();
          }
        }
      }
    }


    console.log('🎓 Creating Student Profiles...');
    // Create rich profiles for students
    await new StudentProfile({
      userId: student1._id,
      school: 'University of Rwanda',
      educationLevel: 'undergraduate',
      fieldOfStudy: 'Computer Engineering',
      skills: ['HTML', 'CSS', 'JavaScript', 'React'],
      availability: 'full_time',
      bio: 'Third year student looking for industrial attachment. Passionate about UI/UX.',
      githubUrl: 'https://github.com/alice',
      linkedinUrl: 'https://linkedin.com/in/alice',
      portfolioUrl: 'https://alice.dev',
      phoneNumber: '+250780000001'
    }).save();

    await new StudentProfile({
      userId: student2._id,
      school: 'Carnegie Mellon University Africa',
      educationLevel: 'graduate',
      fieldOfStudy: 'Electrical and Computer Engineering',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
      availability: 'part_time',
      bio: 'Graduate student specializing in backend systems and distributed computing.',
      githubUrl: 'https://github.com/bob',
      linkedinUrl: 'https://linkedin.com/in/bob',
      phoneNumber: '+250780000002'
    }).save();

    console.log('🚀 Creating Internship Programs...');
    const program1 = await new InternshipProgram({
      title: 'Advanced Full Stack Internship',
      description: `Join our elite engineering team and work on production-grade applications. 
      Prerequisites: Completion of '${techCourse.title}' is highly recommended.`, // Reference to course
      createdBy: admin._id,
      duration: '3 months',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 1 week
      endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      eligibility: ['React', 'Node.js', 'Git'],
      maxParticipants: 10,
      price: 0, // 100k RWF
      currency: 'RWF',
      status: 'active',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2000&auto=format&fit=crop',
      batches: [{ name: 'Batch 1', startDate: new Date(), endDate: new Date() }]
    } as any).save();

    const program2 = await new InternshipProgram({
      title: 'Data Analytics For Business',
      description: 'Learn to drive business decisions with data.',
      createdBy: admin._id,
      duration: '2 months',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      eligibility: ['Excel', 'Basic Python'],
      maxParticipants: 20,
      price: 0, // Free
      currency: 'RWF',
      status: 'active',
      isActive: true,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2000&auto=format&fit=crop'
    } as any).save();

    console.log('🏗️ Creating Internship Projects...');
    // Link Project to Trainer and refer to Course in description
    const project1 = await new InternshipProject({
      internshipProgramId: program1._id,
      title: 'E-Commerce Microservices Migration',
      description: `
        <p>In this project, you will break down a monolithic e-commerce app into microservices.</p>
        <p><strong>Reference Material:</strong> Please review Unit 5 of the <a href="/courses/${techCourse._id}/learn">${techCourse.title}</a> course before starting.</p>
        <p>Your mentor for this project will be <strong>${(trainer1 as any).fullName}</strong>, the author of the course.</p>
      `,
      trainerId: trainer1._id,
      requiredSkills: ['Node.js', 'Docker', 'Kubernetes'],
      objectives: ['Analyze monolith', 'Design service boundaries', 'Implement auth service', 'Deploy to cluster'],
      status: 'published',
      teamSizeRange: { min: 2, max: 4 }
    } as any).save();

    // Create milestones for project
    const m1 = await new InternshipMilestone({
      internshipProjectId: project1._id,
      title: 'System Analysis & Design',
      description: 'Document the existing system and propose microservice architecture.',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      order: 1
    }).save();

    const m2 = await new InternshipMilestone({
      internshipProjectId: project1._id,
      title: 'Service Implementation',
      description: 'Implement the User and Product services using Node.js.',
      deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      order: 2
    }).save();

    console.log('📝 Creating Applications...');
    // Alice applies to Program 1
    const app1 = await new InternshipApplication({
      userId: student1._id,
      internshipProgramId: program1._id,
      status: 'approved',
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      cvUrl: 'https://example.com/cv.pdf'
    }).save();

    // Bob applies to Program 1
    const app2 = await new InternshipApplication({
      userId: student2._id,
      internshipProgramId: program1._id,
      status: 'approved',
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      cvUrl: 'https://example.com/cv-bob.pdf'
    }).save();

    console.log('💳 Creating Payments...');
    // Alice pays
    await new InternshipPayment({
      userId: student1._id,
      internshipProgramId: program1._id,
      amount: 100000,
      currency: 'RWF',
      status: 'paid',
      paymentMethod: 'card',
      transactionId: 'pi_test_12345ABCDE',
      paidAt: new Date()
    }).save();

    // Bob is waived
    await new InternshipPayment({
      userId: student2._id,
      internshipProgramId: program1._id,
      amount: 100000,
      currency: 'RWF',
      status: 'waived',
      waivedReason: 'Merit Scholarship',
      waivedBy: admin._id
    }).save();

    console.log('👥 Creating Teams...');
    // Create Team for Project 1
    const team1 = await new InternshipTeam({
      internshipProgramId: program1._id,
      internshipProjectId: project1._id,
      name: 'Team Alpha',
      status: 'active',
      mentorId: trainer1._id
    }).save();

    // Add members
    await new InternshipTeamMember({
      teamId: team1._id,
      userId: student1._id,
      role: 'lead',
      joinedAt: new Date()
    }).save();

    await new InternshipTeamMember({
      teamId: team1._id,
      userId: student2._id,
      role: 'member',
      joinedAt: new Date()
    }).save();

    console.log('🏗️ Creating Active Projects...');
    await new Project({
      userId: student1._id,
      title: 'E-Commerce Frontend Refactor',
      course: techCourse.title,
      type: 'Individual',
      status: 'in_progress',
      progress: 35,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: 'Implementing modern state management and responsive design for the e-commerce client.',
      mentors: [trainer1._id],
      tasks: [
        { title: 'Setup Project Boilerplate', completed: true },
        { title: 'Redux Integration', completed: true },
        { title: 'Product Dashboard UI', completed: false },
        { title: 'Payment Gateway Integration', completed: false }
      ]
    }).save();

    await new Project({
      userId: student2._id,
      title: 'AI Movie Recommender System',
      course: economicsCourse.title,
      type: 'Individual',
      status: 'pending_review',
      progress: 90,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      description: 'Building a collaborative filtering model using TensorFlow to suggest movies based on user history.',
      mentors: [trainer2._id],
      tasks: [
        { title: 'Data Cleaning', completed: true },
        { title: 'Model Training', completed: true },
        { title: 'API Integration', completed: true },
        { title: 'Final Documentation', completed: false }
      ]
    }).save();

    console.log('📤 Creating Submissions...');
    // Alice submits Milestone 1
    await new InternshipSubmission({
      milestoneId: m1._id,
      teamId: team1._id,
      userId: student1._id,
      contentUrl: 'https://figma.com/design-doc',
      description: 'Here is our architecture diagram and design doc.',
      status: 'approved',
      feedback: 'Excellent detailed analysis.',
      gradedBy: trainer1._id,
      gradedAt: new Date()
    }).save();

    console.log('✅ Seeding Completed Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
