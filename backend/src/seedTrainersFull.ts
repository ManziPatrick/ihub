/**
 * 🌱 FULL TRAINER SEED — Seeds 10 trainers with courses, programs, scholarships, bookings
 *
 * Run: npx ts-node src/seedTrainersFull.ts
 *
 * Creates:
 * - 10 trainers with rich profiles and trainerApplication
 * - 20+ courses (2-3 per trainer) with modules and lessons
 * - 10 coaching/mentorship programs (1 per trainer)
 * - 3 student accounts
 * - Enrollments linking students to courses
 * - Scholarships granted by trainers to students
 * - Booking/session records with trainers
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';

dotenv.config();

// ─── Model Imports ──────────────────────────────────────────────────────────
import { User } from './models/User';
import { Course } from './models/Course';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { Scholarship } from './models/Scholarship';
import { Booking } from './models/Booking';
import { CourseProgress } from './models/CourseProgress';

// ─── Helpers ────────────────────────────────────────────────────────────────

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const lessonContentTemplates = [
  (title: string) => `## ${title}\n\nIn this lesson, we explore the fundamentals of **${title}**. You will learn through hands-on examples and practical exercises designed to build real-world skills. By the end of this session, you'll have a solid understanding of the core concepts.`,
  (title: string) => `## ${title}\n\nWelcome to **${title}**! This session covers essential concepts, best practices, and step-by-step guidance to help you master this topic. We'll work through practical examples together.`,
  (title: string) => `## ${title}\n\n**${title}** is a key topic in this course. This lesson breaks down complex ideas into simple, actionable steps with clear examples and practical applications you can use immediately.`,
  (title: string) => `## ${title}\n\nLet's dive into **${title}**. This lesson combines theory with practice, giving you the knowledge and skills to apply what you've learned in real projects. Get ready to code!`,
  (title: string) => `## ${title}\n\nThis lesson on **${title}** provides a comprehensive overview including key definitions, practical demonstrations, and self-assessment questions to reinforce your learning. Complete the exercises to check your understanding.`,
];

let _lessonCallCount = 0;

function makeLesson(title: string, type: string = 'video', order: number = 1) {
  const idx = _lessonCallCount++ % lessonContentTemplates.length;
  return {
    title,
    content: lessonContentTemplates[idx](title),
    duration: randomInt(10, 45),
    type,
    videoUrl: type === 'video' ? `https://www.youtube.com/watch?v=example${order}` : undefined,
    order,
  };
}

function makeModule(title: string, description: string, lessonTitles: { title: string; type: string }[], order: number = 1) {
  return {
    title,
    description,
    lessons: lessonTitles.map((lt, i) => makeLesson(lt.title, lt.type, i + 1)),
    order,
  };
}

// ─── Trainer Data ──────────────────────────────────────────────────────────

const trainersData = [
  {
    username: 'alice.mutesi',
    email: 'alice.mutesi@bootskills.com',
    fullName: 'Alice Mutesi',
    title: 'Senior Full-Stack Developer & Cloud Architect',
    bio: 'With over 8 years of experience building scalable web applications, Alice specializes in React, Node.js, and cloud infrastructure on AWS. She has trained 500+ developers across East Africa and is passionate about bridging the tech skills gap. Her teaching approach combines real-world projects with structured theory.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice&backgroundColor=b6e3f4',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=400&fit=crop',
    avatarFallback: 'AM',
    trainerApplication: {
      specialties: ['Web Development', 'React', 'Node.js', 'AWS Cloud', 'Full-Stack'],
      experienceYears: 8,
      teachingPhilosophy: 'Learning by building real-world projects. I believe the best way to master code is to ship production-ready applications.',
      qualifications: ['MSc Computer Science - Carnegie Mellon', 'AWS Solutions Architect Certified', 'Google Cloud Certified', 'Meta Frontend Developer'],
      rateHourly: 50,
      linkedinProfile: 'https://linkedin.com/in/alice-mutesi',
      githubProfile: 'https://github.com/alice-mutesi',
      websiteUrl: 'https://alicecodes.dev',
      status: 'approved',
    },
    courses: [
      {
        title: 'React & TypeScript Masterclass',
        description: 'Build production-ready React applications with TypeScript. Master hooks, state management, testing, and deployment. This comprehensive course takes you from fundamentals to advanced patterns used by top tech companies.',
        price: 75000,
        category: 'Web Development',
        level: 'Intermediate',
        modules: [
          {
            title: 'React Foundations & TypeScript Setup',
            description: 'Set up your development environment and learn core React concepts with TypeScript.',
            lessons: [
              { title: 'Introduction to React with TypeScript', type: 'video' },
              { title: 'Setting Up Your Dev Environment', type: 'article' },
              { title: 'TypeScript Fundamentals for React', type: 'video' },
              { title: 'Your First React Component', type: 'assignment' },
            ],
          },
          {
            title: 'Advanced Hooks & State Management',
            description: 'Deep dive into React hooks and modern state management patterns.',
            lessons: [
              { title: 'useState & useReducer Deep Dive', type: 'video' },
              { title: 'useEffect & Side Effects', type: 'video' },
              { title: 'Custom Hooks - Build Your Own', type: 'assignment' },
              { title: 'Context API vs Redux Toolkit', type: 'article' },
              { title: 'State Management Quiz', type: 'quiz' },
            ],
          },
          {
            title: 'Testing & Deployment',
            description: 'Learn to test and deploy React applications like a pro.',
            lessons: [
              { title: 'Unit Testing with Vitest', type: 'video' },
              { title: 'Integration Testing Best Practices', type: 'article' },
              { title: 'CI/CD Pipeline Setup', type: 'video' },
              { title: 'Final Project: Build an E-Commerce Dashboard', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Node.js Backend Architecture',
        description: 'Learn to build scalable backend systems with Node.js, Express, and MongoDB. Cover REST APIs, authentication, microservices, and deployment on AWS.',
        price: 85000,
        category: 'Backend',
        level: 'Advanced',
        modules: [
          {
            title: 'Node.js Fundamentals',
            description: 'Core Node.js concepts and asynchronous programming.',
            lessons: [
              { title: 'Node.js Runtime & Event Loop', type: 'video' },
              { title: 'Async/Await & Promises', type: 'video' },
              { title: 'File System & Streams', type: 'article' },
              { title: 'Building a REST API with Express', type: 'assignment' },
            ],
          },
          {
            title: 'Database & Authentication',
            description: 'MongoDB integration and secure authentication.',
            lessons: [
              { title: 'MongoDB with Mongoose', type: 'video' },
              { title: 'User Authentication with JWT', type: 'video' },
              { title: 'Role-Based Access Control', type: 'assignment' },
              { title: 'Data Validation & Sanitization', type: 'article' },
            ],
          },
        ],
      },
      {
        title: 'Introduction to Web Development',
        description: 'A beginner-friendly course covering HTML, CSS, and JavaScript fundamentals. Perfect for starting your web development journey.',
        price: 0,
        category: 'Web Development',
        level: 'Beginner',
        modules: [
          {
            title: 'HTML & CSS Basics',
            description: 'Learn the building blocks of the web.',
            lessons: [
              { title: 'HTML Structure & Semantics', type: 'video' },
              { title: 'CSS Styling & Layouts', type: 'video' },
              { title: 'Responsive Design with Flexbox & Grid', type: 'assignment' },
            ],
          },
          {
            title: 'JavaScript Fundamentals',
            description: 'Core JavaScript concepts for beginners.',
            lessons: [
              { title: 'Variables, Data Types & Functions', type: 'video' },
              { title: 'DOM Manipulation', type: 'video' },
              { title: 'Build a Todo App', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'jean.pierre',
    email: 'jean.pierre@bootskills.com',
    fullName: 'Jean Pierre Habimana',
    title: 'Data Science & Machine Learning Engineer',
    bio: 'Jean Pierre is a data scientist with 6 years of experience in machine learning, statistical modeling, and data engineering. He has worked with fintech startups and NGOs across Africa to build data-driven solutions.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean&backgroundColor=d1d4f9',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop',
    avatarFallback: 'JH',
    trainerApplication: {
      specialties: ['Data Science', 'Machine Learning', 'Python', 'SQL', 'Data Engineering', 'AI'],
      experienceYears: 6,
      teachingPhilosophy: 'Data tells a story. My goal is to help students uncover insights and build models that make a real impact.',
      qualifications: ['PhD Data Science (candidate) - MIT', 'MSc Statistics - University of Oxford', 'TensorFlow Developer Certificate', 'AWS ML Specialty'],
      rateHourly: 60,
      linkedinProfile: 'https://linkedin.com/in/jean-pierre',
      githubProfile: 'https://github.com/jean-pierre',
      websiteUrl: 'https://jpdatascience.com',
      status: 'approved',
    },
    courses: [
      {
        title: 'Python for Data Science & Machine Learning',
        description: 'Master Python for data analysis, visualization, and machine learning. Work with pandas, numpy, matplotlib, scikit-learn, and TensorFlow.',
        price: 90000,
        category: 'Data Science',
        level: 'Intermediate',
        modules: [
          {
            title: 'Python for Data Analysis',
            description: 'Learn pandas and numpy for data manipulation.',
            lessons: [
              { title: 'NumPy Arrays & Operations', type: 'video' },
              { title: 'Pandas DataFrames & Series', type: 'video' },
              { title: 'Data Cleaning & Preparation', type: 'assignment' },
              { title: 'Data Visualization with Matplotlib & Seaborn', type: 'video' },
            ],
          },
          {
            title: 'Machine Learning Fundamentals',
            description: 'Core ML algorithms and scikit-learn.',
            lessons: [
              { title: 'Supervised Learning: Regression', type: 'video' },
              { title: 'Supervised Learning: Classification', type: 'video' },
              { title: 'Model Evaluation & Validation', type: 'article' },
              { title: 'Feature Engineering & Selection', type: 'assignment' },
            ],
          },
          {
            title: 'Deep Learning with TensorFlow',
            description: 'Neural networks and deep learning.',
            lessons: [
              { title: 'Neural Networks Fundamentals', type: 'video' },
              { title: 'Convolutional Neural Networks', type: 'video' },
              { title: 'Build an Image Classifier', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'SQL for Data Analytics',
        description: 'Master SQL for data querying, analysis, and reporting. Covering everything from basic queries to advanced window functions.',
        price: 45000,
        category: 'Data Science',
        level: 'Beginner',
        modules: [
          {
            title: 'SQL Basics',
            description: 'SELECT, WHERE, JOIN and more.',
            lessons: [
              { title: 'SELECT & WHERE Clauses', type: 'video' },
              { title: 'JOIN Operations', type: 'video' },
              { title: 'GROUP BY & Aggregate Functions', type: 'assignment' },
            ],
          },
          {
            title: 'Advanced SQL',
            description: 'Window functions, CTEs, and optimization.',
            lessons: [
              { title: 'Window Functions', type: 'video' },
              { title: 'Common Table Expressions (CTEs)', type: 'video' },
              { title: 'Query Performance Optimization', type: 'article' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'grace.umutoni',
    email: 'grace.umutoni@bootskills.com',
    fullName: 'Grace Umutoni',
    title: 'UX/UI Designer & Frontend Developer',
    bio: 'Grace is a creative designer and frontend developer with 5 years of experience crafting beautiful, user-centered digital products. She has designed interfaces for e-commerce, edtech, and healthcare platforms.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=c0aede',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=400&fit=crop',
    avatarFallback: 'GU',
    trainerApplication: {
      specialties: ['UI/UX Design', 'Figma', 'Frontend Development', 'Design Systems', 'User Research'],
      experienceYears: 5,
      teachingPhilosophy: 'Great design is invisible. I teach students to focus on the user journey and create interfaces that feel intuitive.',
      qualifications: ['BSc Human-Computer Interaction - Stanford', 'Google UX Design Certificate', 'Certified Figma Expert', 'Interaction Design Foundation'],
      rateHourly: 45,
      linkedinProfile: 'https://linkedin.com/in/grace-umutoni',
      websiteUrl: 'https://grace.design',
      status: 'approved',
    },
    courses: [
      {
        title: 'UI/UX Design Masterclass',
        description: 'Learn the complete UI/UX design process from user research to high-fidelity prototypes. Master Figma and design thinking.',
        price: 65000,
        category: 'Design',
        level: 'Intermediate',
        modules: [
          {
            title: 'Design Thinking & User Research',
            description: 'Understand user needs and design thinking methodology.',
            lessons: [
              { title: 'Introduction to Design Thinking', type: 'video' },
              { title: 'User Research Methods', type: 'video' },
              { title: 'Creating User Personas', type: 'assignment' },
              { title: 'User Journey Mapping', type: 'article' },
            ],
          },
          {
            title: 'Figma Mastery',
            description: 'Master Figma for UI design and prototyping.',
            lessons: [
              { title: 'Figma Fundamentals', type: 'video' },
              { title: 'Components & Design Systems', type: 'video' },
              { title: 'Auto Layout & Constraints', type: 'video' },
              { title: 'Interactive Prototypes', type: 'assignment' },
            ],
          },
          {
            title: 'Visual Design & Handoff',
            description: 'Typography, color theory, and developer handoff.',
            lessons: [
              { title: 'Typography & Color Theory', type: 'video' },
              { title: 'Design Systems & Style Guides', type: 'article' },
              { title: 'Developer Handoff with Figma', type: 'video' },
              { title: 'Final Project: Design a Mobile App', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Frontend Development with Tailwind CSS',
        description: 'Build beautiful responsive websites quickly with Tailwind CSS. From utility-first basics to advanced component design.',
        price: 35000,
        category: 'Web Development',
        level: 'Beginner',
        modules: [
          {
            title: 'Tailwind CSS Fundamentals',
            description: 'Learn the utility-first approach.',
            lessons: [
              { title: 'Utility-First CSS Philosophy', type: 'video' },
              { title: 'Typography & Spacing', type: 'video' },
              { title: 'Flexbox & Grid with Tailwind', type: 'assignment' },
            ],
          },
          {
            title: 'Building Components',
            description: 'Reusable component patterns.',
            lessons: [
              { title: 'Card & Navigation Components', type: 'video' },
              { title: 'Forms & Modals', type: 'video' },
              { title: 'Responsive Design Patterns', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'patrick.niyo',
    email: 'patrick.niyo@bootskills.com',
    fullName: 'Patrick Niyonzima',
    title: 'Mobile App Developer (Flutter & React Native)',
    bio: 'Patrick is a mobile development expert who has built and published 15+ apps on both iOS and Android stores. He specializes in cross-platform development with Flutter and React Native.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick&backgroundColor=ffd5dc',
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=400&fit=crop',
    avatarFallback: 'PN',
    trainerApplication: {
      specialties: ['Mobile Development', 'Flutter', 'React Native', 'iOS', 'Android', 'Dart'],
      experienceYears: 7,
      teachingPhilosophy: 'Mobile development is about creating delightful experiences. I focus on teaching clean architecture and smooth animations.',
      qualifications: ['BSc Software Engineering - Carnegie Mellon', 'Google Associate Android Developer', 'Flutter Certified', 'React Native Advanced'],
      rateHourly: 55,
      linkedinProfile: 'https://linkedin.com/in/patrick-niyo',
      githubProfile: 'https://github.com/patrick-niyo',
      status: 'approved',
    },
    courses: [
      {
        title: 'Flutter & Dart - Build Beautiful Mobile Apps',
        description: 'Learn Flutter from scratch and build stunning cross-platform mobile applications. Cover widgets, state management, Firebase, and app store deployment.',
        price: 80000,
        category: 'Mobile Development',
        level: 'Intermediate',
        modules: [
          {
            title: 'Dart & Flutter Basics',
            description: 'Set up Flutter and learn Dart fundamentals.',
            lessons: [
              { title: 'Introduction to Dart Programming', type: 'video' },
              { title: 'Flutter Widgets Deep Dive', type: 'video' },
              { title: 'Layouts & Styling', type: 'assignment' },
            ],
          },
          {
            title: 'State Management & Navigation',
            description: 'Manage app state and navigation.',
            lessons: [
              { title: 'Stateful Widgets & setState', type: 'video' },
              { title: 'Provider & Riverpod', type: 'video' },
              { title: 'Navigation & Routing', type: 'article' },
              { title: 'Build a Shopping App', type: 'assignment' },
            ],
          },
          {
            title: 'Firebase & Deployment',
            description: 'Backend integration and publishing.',
            lessons: [
              { title: 'Firebase Authentication', type: 'video' },
              { title: 'Cloud Firestore Integration', type: 'video' },
              { title: 'Push Notifications', type: 'article' },
              { title: 'Play Store & App Store Deployment', type: 'video' },
            ],
          },
        ],
      },
      {
        title: 'React Native - Cross-Platform Development',
        description: 'Build mobile apps with React Native. Learn navigation, state management, native modules, and app publishing.',
        price: 70000,
        category: 'Mobile Development',
        level: 'Intermediate',
        modules: [
          {
            title: 'React Native Basics',
            description: 'Core React Native concepts and setup.',
            lessons: [
              { title: 'React Native vs Flutter', type: 'video' },
              { title: 'Core Components & APIs', type: 'video' },
              { title: 'Styling with React Native', type: 'assignment' },
            ],
          },
          {
            title: 'Navigation & State',
            description: 'App navigation and state management.',
            lessons: [
              { title: 'React Navigation', type: 'video' },
              { title: 'State Management with Redux Toolkit', type: 'video' },
              { title: 'AsyncStorage & SecureStore', type: 'article' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'diane.ishimwe',
    email: 'diane.ishimwe@bootskills.com',
    fullName: 'Diane Ishimwe',
    title: 'Cybersecurity Analyst & Ethical Hacker',
    bio: 'Diane is a cybersecurity professional with 5 years of experience in penetration testing, security auditing, and incident response. She has helped organizations across East Africa strengthen their security posture.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diane&backgroundColor=c0aede',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=400&fit=crop',
    avatarFallback: 'DI',
    trainerApplication: {
      specialties: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Penetration Testing', 'Security Audit'],
      experienceYears: 5,
      teachingPhilosophy: 'Security is a mindset. I teach students to think like attackers to defend like champions.',
      qualifications: ['CISSP Certified', 'CEH Certified', 'CompTIA Security+', 'BSc Information Security - MIT'],
      rateHourly: 65,
      linkedinProfile: 'https://linkedin.com/in/diane-ishimwe',
      status: 'approved',
    },
    courses: [
      {
        title: 'Ethical Hacking & Penetration Testing',
        description: 'Learn ethical hacking from scratch. Cover reconnaissance, scanning, exploitation, and reporting. Hands-on labs with real-world scenarios.',
        price: 95000,
        category: 'Cybersecurity',
        level: 'Advanced',
        modules: [
          {
            title: 'Foundations of Ethical Hacking',
            description: 'Legal frameworks and basic techniques.',
            lessons: [
              { title: 'Introduction to Ethical Hacking', type: 'video' },
              { title: 'Legal & Compliance Frameworks', type: 'article' },
              { title: 'Setting Up Your Lab Environment', type: 'video' },
              { title: 'Reconnaissance & OSINT', type: 'assignment' },
            ],
          },
          {
            title: 'Scanning & Exploitation',
            description: 'Network scanning and vulnerability exploitation.',
            lessons: [
              { title: 'Network Scanning with Nmap', type: 'video' },
              { title: 'Vulnerability Assessment', type: 'video' },
              { title: 'Exploitation with Metasploit', type: 'assignment' },
              { title: 'Web Application Security Testing', type: 'video' },
            ],
          },
        ],
      },
      {
        title: 'Network Security Fundamentals',
        description: 'Learn network security concepts, firewall configuration, IDS/IPS, and secure network architecture design.',
        price: 55000,
        category: 'Cybersecurity',
        level: 'Intermediate',
        modules: [
          {
            title: 'Network Security Basics',
            description: 'Core network security concepts.',
            lessons: [
              { title: 'Network Protocols & Security', type: 'video' },
              { title: 'Firewalls & VPNs', type: 'video' },
              { title: 'IDS/IPS Systems', type: 'article' },
            ],
          },
          {
            title: 'Secure Network Architecture',
            description: 'Designing secure networks.',
            lessons: [
              { title: 'Network Segmentation', type: 'video' },
              { title: 'Zero Trust Architecture', type: 'video' },
              { title: 'Security Monitoring & SIEM', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'samuel.kagame',
    email: 'samuel.kagame@bootskills.com',
    fullName: 'Samuel Kagame',
    title: 'DevOps Engineer & Cloud Infrastructure Specialist',
    bio: 'Samuel has 7 years of experience in DevOps, CI/CD pipelines, containerization with Docker and Kubernetes, and cloud infrastructure management on AWS and Azure.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel&backgroundColor=b6e3f4',
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=400&fit=crop',
    avatarFallback: 'SK',
    trainerApplication: {
      specialties: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure', 'Infrastructure as Code'],
      experienceYears: 7,
      teachingPhilosophy: 'Automation is the key to scalability. I teach practical DevOps skills that students can apply from day one.',
      qualifications: ['AWS DevOps Engineer Certified', 'CKA (Certified Kubernetes Administrator)', 'Terraform Certified', 'Azure Solutions Architect'],
      rateHourly: 70,
      linkedinProfile: 'https://linkedin.com/in/samuel-kagame',
      githubProfile: 'https://github.com/samuel-kagame',
      status: 'approved',
    },
    courses: [
      {
        title: 'DevOps with Docker & Kubernetes',
        description: 'Master containerization and orchestration. Learn Docker, Kubernetes, CI/CD pipelines, and infrastructure as code with Terraform.',
        price: 100000,
        category: 'DevOps',
        level: 'Advanced',
        modules: [
          {
            title: 'Docker Fundamentals',
            description: 'Containerization basics.',
            lessons: [
              { title: 'What is Docker? Architecture & Concepts', type: 'video' },
              { title: 'Dockerfiles & Image Building', type: 'video' },
              { title: 'Docker Compose for Multi-Container Apps', type: 'assignment' },
            ],
          },
          {
            title: 'Kubernetes Orchestration',
            description: 'K8s for production deployments.',
            lessons: [
              { title: 'Kubernetes Architecture', type: 'video' },
              { title: 'Pods, Services & Deployments', type: 'video' },
              { title: 'ConfigMaps, Secrets & Ingress', type: 'video' },
              { title: 'Helm Charts & Package Management', type: 'assignment' },
            ],
          },
          {
            title: 'CI/CD & Infrastructure as Code',
            description: 'Automated pipelines and Terraform.',
            lessons: [
              { title: 'CI/CD with GitHub Actions', type: 'video' },
              { title: 'Terraform for Cloud Infrastructure', type: 'video' },
              { title: 'Monitoring with Prometheus & Grafana', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'AWS Cloud Architecture',
        description: 'Design and deploy scalable cloud solutions on AWS. Cover EC2, S3, Lambda, RDS, and more.',
        price: 75000,
        category: 'Cloud Computing',
        level: 'Intermediate',
        modules: [
          {
            title: 'AWS Core Services',
            description: 'Compute, storage, and databases.',
            lessons: [
              { title: 'AWS Overview & IAM', type: 'video' },
              { title: 'EC2 & Auto Scaling', type: 'video' },
              { title: 'S3 Storage Solutions', type: 'video' },
            ],
          },
          {
            title: 'Serverless & Architecture',
            description: 'Lambda, API Gateway, and architecture patterns.',
            lessons: [
              { title: 'AWS Lambda & Serverless Computing', type: 'video' },
              { title: 'API Gateway & Step Functions', type: 'video' },
              { title: 'High Availability Architecture Design', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'faith.niyigena',
    email: 'faith.niyigena@bootskills.com',
    fullName: 'Faith Niyigena',
    title: 'AI & Deep Learning Researcher',
    bio: 'Faith is an AI researcher with a focus on natural language processing and computer vision. She has published 3 papers in top AI conferences and built AI solutions for agriculture and healthcare in Africa.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Faith&backgroundColor=d1d4f9',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=400&fit=crop',
    avatarFallback: 'FN',
    trainerApplication: {
      specialties: ['Artificial Intelligence', 'Deep Learning', 'NLP', 'Computer Vision', 'Python', 'TensorFlow'],
      experienceYears: 4,
      teachingPhilosophy: 'AI is the future. I break down complex concepts into digestible lessons with hands-on coding projects.',
      qualifications: ['MSc Artificial Intelligence - Stanford', 'Deep Learning Specialization (DeepLearning.AI)', 'Published Researcher - NeurIPS, ICML', 'Google AI'],
      rateHourly: 55,
      linkedinProfile: 'https://linkedin.com/in/faith-niyigena',
      githubProfile: 'https://github.com/faith-niyigena',
      websiteUrl: 'https://faithai.dev',
      status: 'approved',
    },
    courses: [
      {
        title: 'Artificial Intelligence & Deep Learning',
        description: 'Comprehensive AI course covering neural networks, computer vision, NLP, and reinforcement learning. Build real AI applications.',
        price: 95000,
        category: 'AI',
        level: 'Advanced',
        modules: [
          {
            title: 'Neural Networks Foundations',
            description: 'Deep learning fundamentals.',
            lessons: [
              { title: 'Neurons, Layers & Activation Functions', type: 'video' },
              { title: 'Backpropagation & Gradient Descent', type: 'video' },
              { title: 'Building a Neural Network from Scratch', type: 'assignment' },
            ],
          },
          {
            title: 'Computer Vision',
            description: 'CNN architectures and image processing.',
            lessons: [
              { title: 'Convolutional Neural Networks', type: 'video' },
              { title: 'Object Detection with YOLO', type: 'video' },
              { title: 'Image Segmentation', type: 'article' },
              { title: 'Build an Image Classification App', type: 'assignment' },
            ],
          },
          {
            title: 'Natural Language Processing',
            description: 'Transformers, BERT, and GPT.',
            lessons: [
              { title: 'RNNs, LSTMs & Attention', type: 'video' },
              { title: 'Transformer Architecture', type: 'video' },
              { title: 'Fine-tuning BERT for Text Classification', type: 'assignment' },
              { title: 'Building a Chatbot with LLMs', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Python for AI & Machine Learning',
        description: 'Python fundamentals focused on AI/ML applications. Perfect for beginners wanting to start their AI journey.',
        price: 0,
        category: 'AI',
        level: 'Beginner',
        modules: [
          {
            title: 'Python Basics for AI',
            description: 'Python fundamentals with AI applications.',
            lessons: [
              { title: 'Python Data Types & Structures', type: 'video' },
              { title: 'NumPy for Numerical Computing', type: 'video' },
              { title: 'Pandas for Data Manipulation', type: 'assignment' },
            ],
          },
          {
            title: 'Introduction to ML with Python',
            description: 'Your first ML models.',
            lessons: [
              { title: 'Scikit-learn Fundamentals', type: 'video' },
              { title: 'Building Your First ML Model', type: 'video' },
              { title: 'Model Evaluation & Improvement', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'emmanuel.bizimana',
    email: 'emmanuel.bizimana@bootskills.com',
    fullName: 'Emmanuel Bizimana',
    title: 'Backend Developer & API Architect',
    bio: 'Emmanuel specializes in building robust backend systems, RESTful APIs, and microservices architecture. With 6 years of experience, he has architected systems serving millions of users across fintech and logistics.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emmanuel&backgroundColor=ffd5dc',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop',
    avatarFallback: 'EB',
    trainerApplication: {
      specialties: ['Backend Development', 'API Design', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Microservices'],
      experienceYears: 6,
      teachingPhilosophy: 'Great backend engineering is about reliability and performance. I teach best practices for building systems that scale.',
      qualifications: ['BSc Computer Science - University of Cape Town', 'MongoDB Certified Developer', 'AWS Certified Developer', 'GraphQL Advanced'],
      rateHourly: 50,
      linkedinProfile: 'https://linkedin.com/in/emmanuel-bizimana',
      githubProfile: 'https://github.com/emmanuel-bizimana',
      status: 'approved',
    },
    courses: [
      {
        title: 'RESTful API Design & Development',
        description: 'Learn to design and build robust REST APIs. Cover best practices, authentication, rate limiting, documentation, and testing.',
        price: 60000,
        category: 'Backend',
        level: 'Intermediate',
        modules: [
          {
            title: 'API Design Principles',
            description: 'REST architecture and design patterns.',
            lessons: [
              { title: 'REST Architecture & HTTP Methods', type: 'video' },
              { title: 'API Design Best Practices', type: 'article' },
              { title: 'Versioning & Documentation', type: 'video' },
            ],
          },
          {
            title: 'Building & Securing APIs',
            description: 'Implement and secure your APIs.',
            lessons: [
              { title: 'Building APIs with Express.js', type: 'video' },
              { title: 'Authentication & Authorization', type: 'video' },
              { title: 'Rate Limiting & Caching', type: 'video' },
              { title: 'Testing APIs with Supertest', type: 'assignment' },
            ],
          },
          {
            title: 'Microservices Architecture',
            description: 'From monolith to microservices.',
            lessons: [
              { title: 'Microservices Design Patterns', type: 'video' },
              { title: 'Message Queues & Event-Driven Architecture', type: 'video' },
              { title: 'API Gateway Implementation', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'PostgreSQL & Database Design',
        description: 'Master relational database design, advanced queries, indexing, and performance optimization with PostgreSQL.',
        price: 50000,
        category: 'Backend',
        level: 'Intermediate',
        modules: [
          {
            title: 'Database Design Fundamentals',
            description: 'Normalization, relationships, and schemas.',
            lessons: [
              { title: 'Database Design & Normalization', type: 'video' },
              { title: 'Entity-Relationship Modeling', type: 'article' },
              { title: 'Creating Tables & Relationships', type: 'assignment' },
            ],
          },
          {
            title: 'Advanced PostgreSQL',
            description: 'Indexing, performance, and advanced features.',
            lessons: [
              { title: 'Advanced Queries & CTEs', type: 'video' },
              { title: 'Indexing Strategies', type: 'video' },
              { title: 'Query Performance Optimization', type: 'assignment' },
              { title: 'Full-Text Search', type: 'video' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'clarisse.mukamana',
    email: 'clarisse.mukamana@bootskills.com',
    fullName: 'Clarisse Mukamana',
    title: 'Product Manager & Agile Coach',
    bio: 'Clarisse is a certified product manager with 8 years of experience leading cross-functional teams. She has launched 10+ digital products from concept to market in fintech, edtech, and e-commerce.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Clarisse&backgroundColor=b6e3f4',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop',
    avatarFallback: 'CM',
    trainerApplication: {
      specialties: ['Product Management', 'Agile', 'Scrum', 'Product Strategy', 'User Stories', 'Roadmapping'],
      experienceYears: 8,
      teachingPhilosophy: 'Product management is about solving real problems. I teach a framework-driven approach to building products people love.',
      qualifications: ['CSPO (Certified Scrum Product Owner)', 'PMP Certified', 'MBA - Harvard Business School', 'Product School Certified'],
      rateHourly: 45,
      linkedinProfile: 'https://linkedin.com/in/clarisse-mukamana',
      status: 'approved',
    },
    courses: [
      {
        title: 'Product Management from Zero to Launch',
        description: 'Complete product management course covering ideation, user research, roadmapping, agile development, and product launch strategies.',
        price: 55000,
        category: 'Product Management',
        level: 'Beginner',
        modules: [
          {
            title: 'Product Discovery & Strategy',
            description: 'Finding problems worth solving.',
            lessons: [
              { title: 'What is Product Management?', type: 'video' },
              { title: 'Customer Discovery & Problem Validation', type: 'video' },
              { title: 'Product Strategy & Vision', type: 'article' },
              { title: 'Writing Effective PRDs', type: 'assignment' },
            ],
          },
          {
            title: 'Agile Development & Execution',
            description: 'Scrum, sprints, and stakeholder management.',
            lessons: [
              { title: 'Scrum Framework & Ceremonies', type: 'video' },
              { title: 'User Stories & Backlog Grooming', type: 'video' },
              { title: 'Sprint Planning & Execution', type: 'video' },
              { title: 'Stakeholder Communication', type: 'assignment' },
            ],
          },
          {
            title: 'Product Launch & Growth',
            description: 'Go-to-market strategy and metrics.',
            lessons: [
              { title: 'Go-to-Market Strategy', type: 'video' },
              { title: 'Product Metrics & KPIs', type: 'article' },
              { title: 'A/B Testing & Experimentation', type: 'video' },
              { title: 'Build a Product Roadmap', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Agile & Scrum Masterclass',
        description: 'Master Agile methodologies and Scrum practices. Prepare for CSPO/CSM certification.',
        price: 40000,
        category: 'Product Management',
        level: 'Intermediate',
        modules: [
          {
            title: 'Agile Fundamentals',
            description: 'Agile principles and mindset.',
            lessons: [
              { title: 'Agile Manifesto & Principles', type: 'video' },
              { title: 'Choosing the Right Framework', type: 'article' },
              { title: 'Agile Estimation Techniques', type: 'video' },
            ],
          },
          {
            title: 'Scrum Mastery',
            description: 'Advanced Scrum practices.',
            lessons: [
              { title: 'Facilitating Scrum Ceremonies', type: 'video' },
              { title: 'Removing Impediments', type: 'video' },
              { title: 'Coaching Agile Teams', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
  {
    username: 'david.hakizimana',
    email: 'david.hakizimana@bootskills.com',
    fullName: 'David Hakizimana',
    title: 'Blockchain Developer & Web3 Engineer',
    bio: 'David is a blockchain developer with 4 years of experience building smart contracts, dApps, and DeFi protocols on Ethereum and Solana. He is passionate about decentralized technology for financial inclusion.',
    location: 'Kigali, Rwanda',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=d1d4f9',
    coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop',
    avatarFallback: 'DH',
    trainerApplication: {
      specialties: ['Blockchain', 'Web3', 'Solidity', 'Smart Contracts', 'Ethereum', 'dApps'],
      experienceYears: 4,
      teachingPhilosophy: 'Blockchain is transforming finance and beyond. I focus on hands-on smart contract development and real dApp deployment.',
      qualifications: ['Ethereum Developer Certificate', 'ConsenSys Academy Graduate', 'BSc Computer Engineering', 'Solana Developer'],
      rateHourly: 65,
      linkedinProfile: 'https://linkedin.com/in/david-hakizimana',
      githubProfile: 'https://github.com/david-hakizimana',
      websiteUrl: 'https://davidweb3.dev',
      status: 'approved',
    },
    courses: [
      {
        title: 'Blockchain & Smart Contract Development',
        description: 'Build smart contracts with Solidity, deploy to Ethereum, and create full-stack dApps with Web3.js and React.',
        price: 85000,
        category: 'Blockchain',
        level: 'Advanced',
        modules: [
          {
            title: 'Blockchain Fundamentals',
            description: 'Core blockchain concepts and Ethereum.',
            lessons: [
              { title: 'How Blockchain Works', type: 'video' },
              { title: 'Ethereum & EVM Architecture', type: 'video' },
              { title: 'Setting Up a Web3 Development Environment', type: 'assignment' },
            ],
          },
          {
            title: 'Solidity Programming',
            description: 'Smart contract development with Solidity.',
            lessons: [
              { title: 'Solidity Syntax & Data Types', type: 'video' },
              { title: 'Functions, Modifiers & Events', type: 'video' },
              { title: 'ERC-20 Token Standard', type: 'video' },
              { title: 'Build a Token Contract', type: 'assignment' },
            ],
          },
          {
            title: 'dApp Development & Deployment',
            description: 'Full-stack decentralized applications.',
            lessons: [
              { title: 'Web3.js & Ethers.js', type: 'video' },
              { title: 'Building a dApp Frontend with React', type: 'video' },
              { title: 'Smart Contract Testing with Hardhat', type: 'video' },
              { title: 'Deploy to Testnet & Mainnet', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Web3 & DeFi Fundamentals',
        description: 'Explore decentralized finance, NFTs, and the Web3 ecosystem. Understand protocols, liquidity pools, and yield farming.',
        price: 60000,
        category: 'Blockchain',
        level: 'Beginner',
        modules: [
          {
            title: 'Web3 Ecosystem',
            description: 'Understanding the decentralized web.',
            lessons: [
              { title: 'Introduction to Web3', type: 'video' },
              { title: 'Wallets & Transactions', type: 'video' },
              { title: 'Gas, Fees & Consensus Mechanisms', type: 'article' },
            ],
          },
          {
            title: 'DeFi & NFTs',
            description: 'DeFi protocols and NFT standards.',
            lessons: [
              { title: 'Understanding DeFi Protocols', type: 'video' },
              { title: 'Liquidity Pools & Yield Farming', type: 'video' },
              { title: 'NFT Standards & Marketplaces', type: 'assignment' },
            ],
          },
        ],
      },
    ],
  },
];

// ─── Coaching Programs per Trainer ─────────────────────────────────────────

const coachingPrograms: { title: string; description: string; duration: string; price: number; specialties: string[] }[] = [
  { title: 'Full-Stack Web Development Cohort', description: 'Intensive 4-month coaching program covering React, Node.js, databases, and cloud deployment. Weekly mentorship sessions and real project experience.', duration: '4 Months', price: 200000, specialties: ['Web Development', 'React', 'Node.js'] },
  { title: 'Data Science Mentorship Program', description: 'Guided 3-month program mastering Python, SQL, ML, and data visualization. Weekly 1:1 sessions and portfolio projects.', duration: '3 Months', price: 250000, specialties: ['Data Science', 'Machine Learning', 'Python'] },
  { title: 'UX/UI Design Intensive', description: '12-week design program covering Figma, user research, prototyping, and design systems. Portfolio review included.', duration: '3 Months', price: 150000, specialties: ['UI/UX Design', 'Figma'] },
  { title: 'Mobile App Development Bootcamp', description: 'Build and publish 3 apps in 4 months. Flutter or React Native, Firebase, and app store deployment.', duration: '4 Months', price: 220000, specialties: ['Mobile Development', 'Flutter', 'React Native'] },
  { title: 'Cybersecurity Professional Track', description: '6-month intensive program covering ethical hacking, network security, and compliance. CTF challenges included.', duration: '6 Months', price: 350000, specialties: ['Cybersecurity', 'Ethical Hacking'] },
  { title: 'DevOps & Cloud Engineering Program', description: 'Master Docker, Kubernetes, CI/CD, and cloud platforms in 4 months. Hands-on with real infrastructure.', duration: '4 Months', price: 300000, specialties: ['DevOps', 'Docker', 'AWS'] },
  { title: 'AI & Deep Learning Research Track', description: 'Advanced AI research program. Build transformer models, GANs, and deploy to production. Includes paper reviews.', duration: '5 Months', price: 350000, specialties: ['Artificial Intelligence', 'Deep Learning'] },
  { title: 'Backend Systems Architecture Program', description: 'Design and build scalable backend systems. API design, microservices, databases, and system design interviews.', duration: '3 Months', price: 180000, specialties: ['Backend Development', 'API Design'] },
  { title: 'Product Leadership Coaching', description: 'Accelerate your product management career. Roadmapping, stakeholder management, and product strategy.', duration: '3 Months', price: 200000, specialties: ['Product Management', 'Agile'] },
  { title: 'Blockchain & Web3 Accelerator', description: 'Build and deploy dApps on Ethereum. Smart contracts, security auditing, and DeFi integration.', duration: '4 Months', price: 280000, specialties: ['Blockchain', 'Web3'] },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────

async function seedTrainersFull() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const hashedPw = await bcrypt.hash('Password@123', 10);

    // ── 1. Create Students ────────────────────────────────────────────────
    console.log('━━━ STEP 1: Students ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const studentData = [
      { username: 'kevin.mugisha', email: 'kevin.mugisha@student.com', fullName: 'Kevin Mugisha', location: 'Kigali, Rwanda', bio: 'Aspiring software engineer passionate about web development.' },
      { username: 'aline.uwimana', email: 'aline.uwimana@student.com', fullName: 'Aline Uwimana', location: 'Butare, Rwanda', bio: 'Data science enthusiast looking to break into AI.' },
      { username: 'eric.ntawu', email: 'eric.ntawu@student.com', fullName: 'Eric Ntawuyirushintege', location: 'Kigali, Rwanda', bio: 'Mobile app developer focused on Flutter and React Native.' },
    ];

    const students: any[] = [];
    for (const sd of studentData) {
      let student = await User.findOne({ email: sd.email });
      if (student) {
        console.log(`   ⏭️  Student exists: ${sd.fullName}`);
        students.push(student);
        continue;
      }
      student = await new User({
        ...sd,
        password: hashedPw,
        role: 'student',
        isVerified: true,
        isFirst: true,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sd.fullName.split(' ')[0]}&backgroundColor=b6e3f4`,
      }).save();
      console.log(`   ✅ Created student: ${sd.fullName}`);
      students.push(student);
    }

    // ── 2. Create Trainers with Full Profiles ─────────────────────────────
    console.log('\n━━━ STEP 2: Trainers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const trainers: any[] = [];
    for (const td of trainersData) {
      let trainer = await User.findOne({ email: td.email });
      if (trainer) {
        console.log(`   ⏭️  Trainer exists: ${td.fullName}`);
        trainers.push(trainer);
        continue;
      }
      trainer = await new User({
        username: td.username,
        email: td.email,
        password: hashedPw,
        role: 'trainer',
        fullName: td.fullName,
        title: td.title,
        bio: td.bio,
        location: td.location,
        avatar: td.avatar,
        coverImage: td.coverImage,
        isTrainerApproved: true,
        isVerified: true,
        trainerApplication: {
          ...td.trainerApplication,
          appliedAt: daysAgo(randomInt(30, 90)),
          reviewedBy: new mongoose.Types.ObjectId(),
          reviewNote: 'Approved during platform seed.',
        },
      }).save();
      console.log(`   ✅ Created trainer: ${td.fullName} (@${td.username})`);
      trainers.push(trainer);
    }

    // ── 3. Create Courses with Modules & Lessons for Each Trainer ────────
    console.log('\n━━━ STEP 3: Courses ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allCourses: any[] = [];
    for (let tIdx = 0; tIdx < trainers.length; tIdx++) {
      const trainer = trainers[tIdx];
      const trainerData = trainersData[tIdx];

      for (const cd of trainerData.courses) {
        const existing = await Course.findOne({ title: cd.title, instructor: trainer._id });
        if (existing) {
          console.log(`   ⏭️  Course exists: ${cd.title} (${trainerData.fullName})`);
          allCourses.push(existing);
          continue;
        }

        const createdModules = cd.modules.map((m, i) => makeModule(m.title, m.description, m.lessons, i + 1));

        const course = await new Course({
          title: cd.title,
          description: cd.description,
          price: cd.price,
          category: cd.category,
          level: cd.level,
          instructor: trainer._id,
          createdBy: trainer._id,
          status: 'published',
          enrollmentMode: cd.price === 0 ? 'direct' : randomElement(['direct', 'application']),
          school: 'Bootskills Academy',
          isFeatured: cd.price > 70000 || cd.level === 'Advanced',
          modules: createdModules,
          studentsEnrolled: [],
          allowedDeliveryModes: ['online', 'hybrid'],
          modulesCount: createdModules.length,
          totalLessonsCount: createdModules.reduce((sum, m) => sum + m.lessons.length, 0),
        }).save();

        console.log(`   ✅ Course: "${cd.title}" — ${trainerData.fullName} (${course.modules.length} modules, ${course.totalLessonsCount} lessons)`);
        allCourses.push(course);
      }
    }
    console.log(`   📊 Total courses created: ${allCourses.length}`);

    // ── 4. Enroll Students in Courses ─────────────────────────────────────
    console.log('\n━━━ STEP 4: Enrollments ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    let enrollmentCount = 0;
    for (const student of students) {
      // Each student enrolls in 4-6 random courses
      const numCourses = randomInt(4, 6);
      const shuffled = [...allCourses].sort(() => Math.random() - 0.5).slice(0, numCourses);

      for (const course of shuffled) {
        const alreadyEnrolled = course.studentsEnrolled.some(
          (s: any) => s.toString() === student._id.toString()
        );
        if (!alreadyEnrolled) {
          course.studentsEnrolled.push(student._id);
          enrollmentCount++;
        }
        await course.save();

        // Create CourseProgress
        await CourseProgress.findOneAndUpdate(
          { userId: student._id, courseId: course._id },
          {
            $setOnInsert: {
              userId: student._id,
              courseId: course._id,
              totalTimeSpent: randomInt(100, 5000),
              overallProgress: randomInt(5, 85),
              status: randomElement(['active', 'active', 'active', 'completed']),
              lessons: [],
            },
          },
          { upsert: true }
        );
      }

      // Update student enrolledCourses
      student.enrolledCourses = [...new Set([
        ...(student.enrolledCourses || []).map((c: any) => c.toString()),
        ...shuffled.map((c: any) => c._id.toString()),
      ])];
      await student.save();
    }
    console.log(`   📊 ${enrollmentCount} enrollments created`);

    // ── 5. Create Coaching Programs ───────────────────────────────────────
    console.log('\n━━━ STEP 5: Coaching Programs ━━━━━━━━━━━━━━━━━━━━━━━━');
    let programCount = 0;
    for (let i = 0; i < trainers.length; i++) {
      const trainer = trainers[i];
      const trainerData = trainersData[i];
      const programTemplate = coachingPrograms[i];

      const existingProgram = await InternshipProgram.findOne({ title: programTemplate.title, createdBy: trainer._id });
      if (existingProgram) {
        console.log(`   ⏭️  Program exists: ${programTemplate.title}`);
        continue;
      }

      await new InternshipProgram({
        title: programTemplate.title,
        description: `${programTemplate.description}\n\nLed by ${trainerData.fullName}, ${trainerData.title}. This program includes weekly 1:1 mentoring sessions, group workshops, and hands-on projects.`,
        duration: programTemplate.duration,
        startDate: daysFromNow(14),
        endDate: daysFromNow(14 + (programTemplate.duration === '3 Months' ? 90 : programTemplate.duration === '4 Months' ? 120 : programTemplate.duration === '5 Months' ? 150 : 180)),
        applicationDeadline: daysFromNow(10),
        price: programTemplate.price,
        currency: 'RWF',
        discount: randomInt(0, 20),
        maxSpots: randomInt(10, 25),
        image: `https://images.unsplash.com/photo-15${randomInt(100000000, 999999999)}?w=800&h=450&fit=crop`,
        status: 'active',
        eligibility: `This program is designed for ${programTemplate.specialties.slice(0, 2).join(' and ')} learners. Basic knowledge recommended.`,
        rules: 'Attendance at weekly meetings is required. Projects must be submitted by deadlines.',
        createdBy: trainer._id,
        allowedDeliveryModes: ['online', 'hybrid'],
        isActive: true,
      }).save();

      console.log(`   ✅ Program: "${programTemplate.title}" — ${trainerData.fullName}`);
      programCount++;
    }
    console.log(`   📊 Total programs created: ${programCount}`);

    // ── 6. Create Scholarships ────────────────────────────────────────────
    console.log('\n━━━ STEP 6: Scholarships ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const scholarshipReasons = [
      'Merit-based scholarship for exceptional performance',
      'Financial aid for high-potential students',
      'Women in Tech scholarship program',
      'Community leadership scholarship',
      'Academic excellence award',
    ];

    let scholarshipCount = 0;
    for (let i = 0; i < trainers.length; i++) {
      const trainer = trainers[i];
      // Each trainer grants 1-2 scholarships
      const numScholarships = randomInt(1, 2);
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5).slice(0, numScholarships);

      for (const student of shuffledStudents) {
        // Find a course this trainer teaches
        const trainerCourses = allCourses.filter((c: any) => c.instructor.toString() === trainer._id.toString());
        if (trainerCourses.length === 0) continue;

        const course = randomElement(trainerCourses);
        const existing = await Scholarship.findOne({
          userId: student._id,
          grantedBy: trainer._id,
          type: 'course',
          itemId: course._id,
        });
        if (existing) continue;

        const statuses: ('active' | 'pending' | 'revoked')[] = ['active', 'active', 'active', 'pending'];
        const status = statuses[i % statuses.length];

        await new Scholarship({
          userId: student._id,
          grantedBy: trainer._id,
          type: 'course',
          itemId: course._id,
          itemTitle: course.title,
          status,
          reason: scholarshipReasons[i % scholarshipReasons.length],
          grantedLatitude: -1.9441,
          grantedLongitude: 30.0619,
          grantedCity: 'Kigali',
          grantedCountry: 'Rwanda',
          ...(status === 'active'
            ? { approvedAt: daysAgo(randomInt(3, 20)), approvedBy: trainer._id }
            : {}),
        }).save();
        scholarshipCount++;

        await new Scholarship({
          userId: student._id,
          grantedBy: trainer._id,
          type: 'internship',
          itemId: new mongoose.Types.ObjectId(),
          itemTitle: coachingPrograms[i].title,
          status: 'active',
          reason: 'Full program scholarship based on demonstrated potential',
          grantedCity: 'Kigali',
          grantedCountry: 'Rwanda',
          approvedAt: daysAgo(randomInt(3, 20)),
          approvedBy: trainer._id,
        }).save();
        scholarshipCount++;
      }
    }
    console.log(`   📊 Total scholarships created: ${scholarshipCount}`);

    // ── 7. Create Bookings (Sessions) ─────────────────────────────────────
    console.log('\n━━━ STEP 7: Bookings / Sessions ━━━━━━━━━━━━━━━━━━━━━');
    const sessionTopics = [
      'Project Code Review',
      'Career Guidance Session',
      'Technical Interview Prep',
      'Resume & Portfolio Review',
      '1:1 Mentorship Session',
      'Group Workshop: Best Practices',
      'Q&A Session',
      'Progress Check-in',
    ];

    let bookingCount = 0;
    for (const trainer of trainers) {
      // Each trainer has 3-6 bookings with different students
      const numBookings = randomInt(3, 6);
      for (let i = 0; i < numBookings; i++) {
        const student = randomElement(students);
        const daysOffset = i < 3 ? randomInt(-20, -1) : randomInt(1, 30); // Past and future bookings
        const status = daysOffset < 0
          ? randomElement(['completed', 'completed', 'cancelled'])
          : randomElement(['confirmed', 'pending', 'confirmed']);

        const existing = await Booking.findOne({
          userId: student._id,
          mentorId: trainer._id,
          type: 'mentorship',
          date: daysFromNow(daysOffset).toISOString().split('T')[0],
        });
        if (existing) continue;

        await new Booking({
          userId: student._id,
          mentorId: trainer._id,
          type: 'mentorship',
          date: daysFromNow(daysOffset).toISOString().split('T')[0],
          time: `${randomInt(8, 17)}:00`,
          topic: randomElement(sessionTopics),
          notes: `Session with ${student.fullName} focused on ${randomElement(['project progress', 'learning goals', 'career development', 'skill assessment'])}.`,
          status,
          deliveryMode: randomElement(['online', 'online', 'online', 'physical']),
          meetingLink: status !== 'cancelled' ? `https://meet.bootskills.com/${trainer.username}-${i}` : undefined,
          location: status === 'physical' ? 'Kigali Innovation City, Room 204' : undefined,
        }).save();
        bookingCount++;
      }
    }
    console.log(`   📊 Total bookings created: ${bookingCount}`);

    // ── Summary ────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`   👤 Trainers:          ${trainers.length}`);
    console.log(`   🎓 Students:          ${students.length}`);
    console.log(`   📚 Courses:           ${allCourses.length} (with modules & lessons)`);
    console.log(`   📝 Enrollments:       ${enrollmentCount}`);
    console.log(`   🏗️  Programs:         ${programCount} coaching/mentorship programs`);
    console.log(`   🎓 Scholarships:      ${scholarshipCount}`);
    console.log(`   📅 Bookings:          ${bookingCount} mentorship sessions`);
    console.log('\n📋 Login Credentials:');
    console.log(`   Password: Password@123`);
    console.log(`   Trainers: alice.mutesi@bootskills.com, jean.pierre@bootskills.com, etc.`);
    console.log(`   Students: kevin.mugisha@student.com, aline.uwimana@student.com, eric.ntawu@student.com`);
    console.log('═'.repeat(60));
    console.log('✅ SEED COMPLETE — trainers fully populated!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding trainers:', error);
    process.exit(1);
  }
}

seedTrainersFull();
