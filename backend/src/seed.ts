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
  const lessons = [];
  for (let i = 1; i <= count; i++) {
    const isActuallyAssignment = i % 5 === 0;
    const isQuiz = i % 4 === 0 && !isActuallyAssignment;
    const type = isActuallyAssignment ? 'assignment' : isQuiz ? 'quiz' : types[i % types.length];
    const unitTitle = `${baseTitle} - Unit ${i}: ${isActuallyAssignment ? 'Practical Lab' : isQuiz ? 'Knowledge Check' : 'Concepts'}`;

    lessons.push({
      title: unitTitle,
      content: `## ${unitTitle}\n\nDeep dive into ${baseTitle}.`,
      duration: 15 + (i * 5),
      type: type,
      videoUrl: type === 'video' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
      fileUrl: type === 'pdf' ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : null,
      isAssignment: isActuallyAssignment,
      requiredAssignment: isActuallyAssignment,
      assignmentDescription: isActuallyAssignment ? `Submit your project implementation for ${unitTitle}.` : null,
      assignmentDeliverables: isActuallyAssignment ? ['GitHub Repository URL', 'Live Demo Link'] : []
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
      email: 'superadmin@codemande.com',
      password: hashedPassword,
      role: 'super_admin',
      fullName: 'System Super Admin',
      title: 'Chief Operations',
      avatar: 'https://i.pravatar.cc/150?u=superadmin'
    }).save();

    const admin = await new User({
      username: 'admin',
      email: 'admin@codemande.com',
      password: hashedPassword,
      role: 'admin',
      fullName: 'System Administrator',
      title: 'Head of Academy',
      avatar: 'https://i.pravatar.cc/150?u=admin'
    }).save();

    const trainer1 = await new User({
      username: 'innovator_john',
      email: 'john@codemande.com',
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
      email: 'sarah@codemande.com',
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
    // Trainer 1 references this course in his internship project
    const fullStackCourse = await new Course({
      title: 'Full Stack Masterclass: React & Node.js',
      description: 'The ultimate guide to building scalable web applications. From zero to hero with modern stack.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 0, // Free course
      category: 'Development',
      level: 'Advanced',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Core Fundamentals',
          description: 'Getting started with the MERN stack',
          lessons: createLessons('Full Stack', 10)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: [student1._id, student2._id]
    } as any).save();

    const dataScienceCourse = await new Course({
      title: 'Data Science Bootcamp',
      description: 'Master Python and Machine Learning. Real world projects and datasets.',
      instructor: trainer2._id,
      createdBy: admin._id,
      price: 49.99,
      category: 'Data Science',
      level: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?q=80&w=2070&auto=format&fit=crop',
      modules: [
        {
          title: 'Python Basics',
          description: 'Introduction to Python for Data Analysis',
          lessons: createLessons('Data Science', 8)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: [student2._id]
    } as any).save();

    const generativeAICourse = await new Course({
      title: 'Generative AI for Creative Professionals',
      description: 'Learn to use ChatGPT, Midjourney, and DALL-E to revolutionize your creative workflow. Scale your output with AI.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 150000,
      discountPrice: 85000,
      category: 'Specialization',
      level: 'Beginner',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2000&auto=format&fit=crop',
      modules: [
        {
          title: 'AI Tools Overview',
          description: 'Exploring the generative AI landscape',
          lessons: createLessons('Generative AI', 6)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: []
    } as any).save();

    const promptEngCourse = await new Course({
      title: 'Prompt Engineering for Software Developers',
      description: 'Master the art of prompt engineering to build smarter AI-integrated applications and leverage LLMs in your code.',
      instructor: trainer1._id,
      createdBy: admin._id,
      price: 0,
      category: 'Development',
      level: 'Intermediate',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop',
      modules: [
        {
          title: 'LLM Foundations',
          description: 'Understanding how models process prompts',
          lessons: createLessons('Prompt Engineering', 8)
        }
      ],
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: []
    } as any).save();

    const aiLeadershipCourse = await new Course({
      title: 'AI Strategic Leadership',
      description: 'Lead your organization through the AI revolution. Understand the strategic, ethical, and operational shifts required for AI success.',
      instructor: admin._id,
      createdBy: admin._id,
      price: 250000,
      discountPrice: 195000,
      category: 'Business',
      level: 'Advanced',
      enrollmentMode: 'application',
      thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2000&auto=format&fit=crop',
      modules: [
        {
          title: 'AI Transformation',
          description: 'Building an AI-first organization',
          lessons: createLessons('AI Leadership', 5)
        }
      ],
      status: 'published',
      studentsEnrolled: []
    } as any).save();

    // ── Seed Quiz Questions for all courses ──
    const allCourses = [fullStackCourse, dataScienceCourse, generativeAICourse, promptEngCourse, aiLeadershipCourse];
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
      Prerequisites: Completion of '${fullStackCourse.title}' is highly recommended.`, // Reference to course
      createdBy: admin._id,
      duration: '3 months',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 1 week
      endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000),
      applicationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      eligibility: ['React', 'Node.js', 'Git'],
      maxParticipants: 10,
      price: 100000, // 100k RWF
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
        <p><strong>Reference Material:</strong> Please review Unit 5 of the <a href="/courses/${fullStackCourse._id}/learn">${fullStackCourse.title}</a> course before starting.</p>
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
      course: 'Full Stack Masterclass',
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
      course: 'Data Science Bootcamp',
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
