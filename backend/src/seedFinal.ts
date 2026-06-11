import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const seedFinal = async () => {
  try {
    console.log('📡 Connecting to Deployed Database...');
    await connectDB();
    console.log('✅ Connected.');

    // Ensure we have an instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin'] } });
    if (!instructor) {
      console.log('👤 No trainer/admin found. Creating a master admin...');
      instructor = await new User({
        fullName: 'Master Admin',
        username: 'admin',
        email: 'admin@bootskills.com',
        password: 'Password123',
        role: 'admin',
        status: 'active',
        academicStatus: 'active'
      }).save();
    }

    // console.log('🗑️  Clearing existing courses for a fresh start...');
    // await Course.deleteMany({});

    const schoolCourses = [
      {
        title: "Software Engineering Bootcamp",
        description: "Intensive 12-week software engineering program focusing on full-stack development with React and Node.js.",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 500000,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "Kingdavid",
        allowedDeliveryModes: ["online", "hybrid"]
      },
      {
        title: "Advanced Data Science",
        description: "Master machine learning, deep learning, and big data technologies.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 750000,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "Comprehensive guide to SEO, social media marketing, and content strategy.",
        thumbnail: "https://images.unsplash.com/photo-1432888117286-315d5abac34a?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 250000,
        level: "Beginner",
        category: "Marketing",
        status: "published",
        school: "Kigali Business School"
      },
      {
        title: "Cybersecurity Professional",
        description: "Learn to protect systems, networks, and programs from digital attacks.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 600000,
        level: "Intermediate",
        category: "IT & Software",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Master the art of creating beautiful and functional user interfaces.",
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 350000,
        level: "Intermediate",
        category: "Design",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "Machine Learning Specialization",
        description: "Deep dive into algorithms, neural networks, and AI model deployment.",
        thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 850000,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "Project Management Professional",
        description: "Learn the methodology and tools to manage complex projects effectively.",
        thumbnail: "https://images.unsplash.com/photo-1542626991-cbc4e32524cc?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 450000,
        level: "Intermediate",
        category: "Business",
        status: "published",
        school: "Kigali Business School"
      }
    ];

    const complexFreeCourses = [
      {
        title: "Full-Stack Web Development Mastery (Free)",
        description: "A comprehensive journey from HTML basics to advanced React and Node.js backend systems.",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "IHUB Academy",
        allowedDeliveryModes: ["online"],
        enrollmentMode: "direct",
        modules: [
          {
            title: "Module 1: Web Foundation",
            description: "HTML & CSS Basics",
            lessons: [
              { title: "HTML Essentials", duration: 15, type: "video" },
              {
                title: "Quiz: HTML Basics",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "Which tag is used for links?",
                    type: "mcq",
                    options: ["<link>", "<a>", "<href>", "<url>"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Final Exam",
            lessons: [
              {
                title: "Certification Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam", timeLimit: 30 },
                assignmentQuestions: [
                  { questionText: "What is the purpose of React?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Mobile App Development with Flutter (Free)",
        description: "Build beautiful, natively compiled applications for mobile from a single codebase.",
        thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Introduction to Dart",
            lessons: [
              { title: "Dart Basics", duration: 20, type: "video" },
              {
                title: "Quiz: Dart Syntax",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "How do you define a variable in Dart?",
                    type: "mcq",
                    options: ["var", "let", "dim", "def"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Flutter Widgets",
            lessons: [
              { title: "Stateless vs Stateful", duration: 25, type: "video" },
              {
                title: "Final Exam: Flutter Basics",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Explain the Flutter build process.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Ethical Hacking Workshop (Free)",
        description: "Learn the basics of penetration testing and network security.",
        thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Intermediate",
        category: "IT & Software",
        status: "published",
        school: "Kingdavid",
        modules: [
          {
            title: "Module 1: Reconnaissance",
            lessons: [
              { title: "Information Gathering", duration: 30, type: "video" },
              {
                title: "Quiz: Recon Techniques",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is 'dorking'?",
                    type: "mcq",
                    options: ["Advanced search queries", "System failure", "Password cracking", "Social engineering"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Penetration Testing Exam",
            lessons: [
              {
                title: "Hacking Fundamentals Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Describe the 5 phases of ethical hacking.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "DevOps for Beginners (Free)",
        description: "Introduction to CI/CD, Docker, and automation workflows.",
        thumbnail: "https://images.unsplash.com/photo-1618401471353-b98aadebc248?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "IT & Software",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Containerization",
            lessons: [
              { title: "Docker Basics", duration: 25, type: "video" },
              {
                title: "Quiz: Docker Commands",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "Which command lists running containers?",
                    type: "mcq",
                    options: ["docker run", "docker ps", "docker images", "docker build"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: DevOps Final Exam",
            lessons: [
              {
                title: "DevOps Foundations Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Explain the concept of Continuous Integration.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Blockchain & Cryptography (Free)",
        description: "Explore the technology behind Bitcoin, Ethereum, and secure communications.",
        thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Intermediate",
        category: "AI & Technology",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Decentralization",
            lessons: [
              { title: "What is a Blockchain?", duration: 20, type: "video" },
              {
                title: "Quiz: Mining and Consensous",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is 'Proof of Work'?",
                    type: "mcq",
                    options: ["Consensus algorithm", "Hashing function", "Wallet type", "Transaction fee"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Crypto Final Exam",
            lessons: [
              {
                title: "Blockchain Mastery Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "How do Smart Contracts work?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Graphic Design with Canva (Free)",
        description: "Create professional graphics, social media posts, and presentations with ease.",
        thumbnail: "https://images.unsplash.com/photo-1541462608141-ad4d0594ba67?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Design",
        status: "published",
        school: "Greenhill Academy",
        modules: [
          {
            title: "Module 1: Design Principles",
            lessons: [
              { title: "Color Theory Basics", duration: 15, type: "video" },
              {
                title: "Quiz: Typography",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is a 'Serif' font?",
                    type: "mcq",
                    options: ["Font with small strokes at the ends", "Sans-stroke font", "Monospaced font", "Script font"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Creative Exam",
            lessons: [
              {
                title: "Visual Communication Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Define the Rule of Thirds in design.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Financial Literacy for Entrepreneurs (Free)",
        description: "Manage your business finances, understand taxes, and plan for growth.",
        thumbnail: "https://images.unsplash.com/photo-1454165833762-0204b2816718?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Business",
        status: "published",
        school: "Kigali Business School",
        modules: [
          {
            title: "Module 1: Cashflow Management",
            lessons: [
              { title: "Budgeting Basics", duration: 25, type: "video" },
              {
                title: "Quiz: Balance Sheets",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is an Asset?",
                    type: "mcq",
                    options: ["Something you owe", "Something you own", "Your total income", "A business expense"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Entrepreneurial Finance Exam",
            lessons: [
              {
                title: "Business Finance Mastery Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "What is ROI and how is it calculated?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },

      {
        title: "Data Analytics with Python (Free)",
        description: "Learn to analyze data and gain insights using Python, Pandas, and Matplotlib.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Data Science",
        status: "published",
        school: "Kigali Business School",
        modules: [
          {
            title: "Module 1: Python for Data",
            lessons: [
              { title: "NumPy Fundamentals", duration: 20, type: "video" },
              {
                title: "Quiz: NumPy",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What does NumPy stand for?",
                    type: "mcq",
                    options: ["Number Python", "Numerical Python", "New Python", "Node Python"],
                    correctOptionIndex: 1,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Final Assessment",
            lessons: [
              {
                title: "Data Analytics Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "How do you handle missing data in Pandas?", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Cloud Computing Essentials (Free)",
        description: "Understanding Cloud architecture, deployment models, and service providers.",
        thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "IT & Software",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Cloud Concepts",
            lessons: [
              { title: "IaaS, PaaS, and SaaS", duration: 15, type: "video" },
              {
                title: "Quiz: Cloud Models",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What does SaaS stand for?",
                    type: "mcq",
                    options: ["Software as a Service", "System as a Service", "Servers as a Service", "Storage as a Service"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          },
          {
            title: "Module 2: Cloud Exam",
            lessons: [
              {
                title: "Cloud Certification Exam",
                type: "assignment",
                isAssignment: true,
                requiredAssignment: true,
                assignmentConfig: { mode: "exam" },
                assignmentQuestions: [
                  { questionText: "Compare AWS, Azure, and Google Cloud.", type: "open", points: 50 }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Social Media Strategy (Free)",
        description: "Build an audience and grow your brand on Instagram, TikTok, and LinkedIn.",
        thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Marketing",
        status: "published",
        school: "Kigali Business School",
        modules: [
          {
            title: "Module 1: Content Planning",
            lessons: [
              { title: "Engagement Metrics", duration: 20, type: "video" },
              {
                title: "Quiz: Algorithms",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is the most important factor for video reach?",
                    type: "mcq",
                    options: ["Watch time", "Likes", "Comments", "Shares"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Professional Soft Skills (Free)",
        description: "Communication, emotional intelligence, and leadership for the modern workplace.",
        thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800",
        instructor: instructor._id,
        price: 0,
        level: "Beginner",
        category: "Business",
        status: "published",
        school: "IHUB Academy",
        modules: [
          {
            title: "Module 1: Emotional Intelligence",
            lessons: [
              { title: "Self-Awareness", duration: 15, type: "video" },
              {
                title: "Quiz: EQ Basics",
                type: "quiz",
                isAssignment: true,
                assignmentQuestions: [
                  {
                    questionText: "What is Empathy?",
                    type: "mcq",
                    options: ["Understanding others' feelings", "Ignoring others", "Talking loudly", "Working alone"],
                    correctOptionIndex: 0,
                    points: 10
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    console.log('🚀 Seeding school courses...');
    for (const courseData of schoolCourses) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (existingCourse) {
        console.log(`⏩ Skipping existing: ${courseData.title}`);
        continue;
      }
      await new Course(courseData).save();
      console.log(`✅ Seeded: ${courseData.title} (${courseData.school})`);
    }

    console.log('🚀 Seeding complex free courses...');
    for (const courseData of complexFreeCourses) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      if (existingCourse) {
        console.log(`⏩ Skipping existing: ${courseData.title}`);
        continue;
      }
      const freeCourse = await new Course(courseData).save();
      console.log(`✅ Seeded: ${freeCourse.title} with ${freeCourse.modules.length} modules.`);
    }

    console.log('\n✨ Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFinal();
