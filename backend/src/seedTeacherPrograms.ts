/**
 * 🌱 TEACHER PROGRAMS SEED — Assigns courses & programs to the 10 real teachers
 *
 * Run: MONGO_URI=... npx ts-node src/seedTeacherPrograms.ts
 *
 * For each teacher from seedRealTeachers.ts:
 * - 2 courses (modules + lessons, instructor = teacher)
 * - 1 coaching/mentorship program (createdBy = teacher)
 * Skips anything that already exists (by title) — safe to re-run.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { User } from './models/User';
import { Course } from './models/Course';
import { InternshipProgram } from './models/internship/InternshipProgram';

dotenv.config();

// ─── Helpers (same pattern as seedTrainersFull.ts) ─────────────────────────

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

const lessonContentTemplates = [
  (title: string) => `## ${title}\n\nIn this lesson, we explore the fundamentals of **${title}**. You will learn through hands-on examples and practical exercises designed to build real-world skills. By the end of this session, you'll have a solid understanding of the core concepts.`,
  (title: string) => `## ${title}\n\nWelcome to **${title}**! This session covers essential concepts, best practices, and step-by-step guidance to help you master this topic. We'll work through practical examples together.`,
  (title: string) => `## ${title}\n\n**${title}** is a key topic in this course. This lesson breaks down complex ideas into simple, actionable steps with clear examples and practical applications you can use immediately.`,
  (title: string) => `## ${title}\n\nLet's dive into **${title}**. This lesson combines theory with practice, giving you the knowledge and skills to apply what you've learned in real projects. Get ready to practice!`,
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
    videoUrl: type === 'video' ? `https://www.youtube.com/watch?v=lesson${order}` : undefined,
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

// ─── Teacher data: courses + program per teacher ───────────────────────────

interface TeacherSeed {
  email: string;
  fullName: string;
  courses: {
    title: string;
    description: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    price: number;
    thumbnail: string;
    modules: { title: string; description: string; lessons: { title: string; type: string }[] }[];
  }[];
  program: {
    title: string;
    description: string;
    duration: string;
    price: number;
    image: string;
    eligibility: string;
    rules: string;
  };
}

const teachersData: TeacherSeed[] = [
  {
    email: 'nigena.umuhire@bootskills.com',
    fullName: 'Nigena Umuhire Pacifique',
    courses: [
      {
        title: 'History & Geography Mastery (S1–S6)',
        description: 'A complete journey through Rwandan, African and world history with physical and human geography. Includes national exam preparation (S3 and S6) with past papers, map skills, and essay techniques.',
        category: 'Education',
        level: 'Intermediate',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'History of Rwanda & East Africa',
            description: 'From pre-colonial kingdoms to independence and modern state-building.',
            lessons: [
              { title: 'Pre-Colonial Rwandan Kingdoms', type: 'video' },
              { title: 'Colonial Era & Independence Movements', type: 'video' },
              { title: 'Post-Independence Nation Building', type: 'article' },
              { title: 'Essay Writing for History Exams', type: 'assignment' },
            ],
          },
          {
            title: 'World & African Geography',
            description: 'Physical geography, climate, and human geography with map skills.',
            lessons: [
              { title: 'Physical Geography & Landforms', type: 'video' },
              { title: 'Climate & Weather Patterns', type: 'video' },
              { title: 'Population & Urbanisation in Africa', type: 'article' },
              { title: 'Map Reading & Interpretation', type: 'assignment' },
            ],
          },
          {
            title: 'National Exam Mastery (S3 & S6)',
            description: 'Exam strategies, past papers, and revision techniques.',
            lessons: [
              { title: 'Understanding Exam Grading', type: 'video' },
              { title: 'Past Paper Walkthrough: History', type: 'video' },
              { title: 'Past Paper Walkthrough: Geography', type: 'video' },
              { title: 'Full Mock Exam & Review', type: 'quiz' },
            ],
          },
        ],
      },
      {
        title: 'Primary Education Foundations (P1–P6)',
        description: 'A complete coaching course for primary learners covering all subjects — Kinyarwanda, English, Mathematics, Science and Social Studies — with national primary leaving exam (P6) preparation.',
        category: 'Education',
        level: 'Beginner',
        price: 25000,
        thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Literacy in Kinyarwanda & English',
            description: 'Reading, writing, and comprehension foundations.',
            lessons: [
              { title: 'Reading Foundations & Phonics', type: 'video' },
              { title: 'English Grammar for Primary', type: 'video' },
              { title: 'Kinyarwanda Reading & Composition', type: 'article' },
              { title: 'Comprehension Practice', type: 'assignment' },
            ],
          },
          {
            title: 'Numeracy & Science Basics',
            description: 'Mathematics and elementary science made fun.',
            lessons: [
              { title: 'Numbers, Fractions & Decimals', type: 'video' },
              { title: 'Shapes, Measurement & Data', type: 'video' },
              { title: 'Primary Science: Living Things', type: 'article' },
              { title: 'Problem Solving Practice', type: 'assignment' },
            ],
          },
          {
            title: 'P6 National Exam Coaching',
            description: 'Confidence-building exam practice for primary leaving exams.',
            lessons: [
              { title: 'P6 Exam Format & Tips', type: 'video' },
              { title: 'Practice Paper: Mathematics', type: 'quiz' },
              { title: 'Practice Paper: English & Science', type: 'quiz' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Primary to National Exam Coaching Program (P6–S6)',
      description: 'A guided coaching program for learners from primary (P6) through secondary (S6). Weekly one-on-one and group sessions covering History, Geography and all primary subjects, with national exam strategy, past-paper practice and personalised revision plans. Led by Nigena Umuhire Pacifique.',
      duration: '4 Months',
      price: 120000,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
      eligibility: 'Designed for primary and secondary learners (P6–S6) preparing for national examinations. No prior experience required.',
      rules: 'Weekly coaching sessions are required. Learners must submit revision tasks by deadlines.',
    },
  },
  {
    email: 'chantal.mukeshimana@bootskills.com',
    fullName: 'Chantal Mukeshimana',
    courses: [
      {
        title: 'Early Literacy & Reading Skills (P1–P6)',
        description: 'A joyful, story-based course that builds strong reading and writing foundations in Kinyarwanda and English. Perfect for young learners and children who need extra support.',
        category: 'Education',
        level: 'Beginner',
        price: 20000,
        thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Phonics & Early Reading',
            description: 'Sound-letter links and first words.',
            lessons: [
              { title: 'Alphabet & Sounds', type: 'video' },
              { title: 'Blending & First Words', type: 'video' },
              { title: 'Reading Short Stories', type: 'article' },
              { title: 'Reading Practice Journal', type: 'assignment' },
            ],
          },
          {
            title: 'Writing & Comprehension',
            description: 'Building confident young writers.',
            lessons: [
              { title: 'Letter Formation & Handwriting', type: 'video' },
              { title: 'Sentence Building', type: 'video' },
              { title: 'Comprehension Skills', type: 'article' },
              { title: 'Write Your Own Story', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Numeracy & Foundational Mathematics (P1–P6)',
        description: 'Hands-on, play-based math that makes numbers fun. Covers counting, addition, subtraction, multiplication, shapes, and everyday problem solving.',
        category: 'Education',
        level: 'Beginner',
        price: 20000,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Numbers & Operations',
            description: 'Core number skills through play.',
            lessons: [
              { title: 'Counting & Number Sense', type: 'video' },
              { title: 'Addition & Subtraction Games', type: 'video' },
              { title: 'Multiplication & Division Basics', type: 'article' },
              { title: 'Maths Practice Puzzles', type: 'assignment' },
            ],
          },
          {
            title: 'Shapes, Measurement & Money',
            description: 'Everyday maths that matters.',
            lessons: [
              { title: 'Shapes & Patterns', type: 'video' },
              { title: 'Measurement & Time', type: 'video' },
              { title: 'Money & Shopping Maths', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Early Literacy & Numeracy Program (P1–P6)',
      description: 'A 12-week foundation program for primary learners who want to build rock-solid reading, writing and mathematics skills. Includes weekly story sessions, maths games, parent workshops and personalised support for children with learning difficulties. Led by Chantal Mukeshimana.',
      duration: '3 Months',
      price: 80000,
      image: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=450&fit=crop',
      eligibility: 'For primary learners (P1–P6) and parents who want extra literacy and numeracy support.',
      rules: 'Weekly sessions and a short daily reading habit are encouraged. Parent workshops every month.',
    },
  },
  {
    email: 'eric.nsengiyumva@bootskills.com',
    fullName: 'Eric Nsengiyumva',
    courses: [
      {
        title: 'Mathematics from O-Level to A-Level (S1–S6)',
        description: 'Step-by-step mathematics coaching covering the full Rwandan secondary curriculum, from algebra and geometry to calculus and statistics. Includes national exam strategy and past-paper practice.',
        category: 'Education',
        level: 'Intermediate',
        price: 50000,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Algebra & Functions (S1–S4)',
            description: 'Core algebraic skills and reasoning.',
            lessons: [
              { title: 'Linear Equations & Inequalities', type: 'video' },
              { title: 'Quadratic Equations', type: 'video' },
              { title: 'Functions & Graphs', type: 'video' },
              { title: 'Algebra Problem Set', type: 'assignment' },
            ],
          },
          {
            title: 'Advanced Mathematics (S5–S6)',
            description: 'Calculus, trigonometry and statistics.',
            lessons: [
              { title: 'Differentiation & Integration', type: 'video' },
              { title: 'Trigonometry & Identities', type: 'video' },
              { title: 'Probability & Statistics', type: 'article' },
              { title: 'Advanced Problem Set', type: 'assignment' },
            ],
          },
          {
            title: 'National Exam Preparation',
            description: 'Exam techniques and mock papers.',
            lessons: [
              { title: 'S6 Exam Format & Marking', type: 'video' },
              { title: 'Past Paper Walkthrough', type: 'video' },
              { title: 'Full Mock Examination', type: 'quiz' },
            ],
          },
        ],
      },
      {
        title: 'Physics Essentials (S1–S6)',
        description: 'Clear, practical physics covering mechanics, electricity, waves and modern physics, with experiments you can do at home and exam-focused problem solving.',
        category: 'Education',
        level: 'Intermediate',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0a7?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Mechanics & Forces',
            description: 'Motion, forces and energy.',
            lessons: [
              { title: 'Motion & Speed', type: 'video' },
              { title: 'Newton\u2019s Laws of Motion', type: 'video' },
              { title: 'Work, Energy & Power', type: 'article' },
              { title: 'Mechanics Problems', type: 'assignment' },
            ],
          },
          {
            title: 'Electricity, Waves & Modern Physics',
            description: 'Circuits, waves, and the atom.',
            lessons: [
              { title: 'Electric Circuits & Ohm\u2019s Law', type: 'video' },
              { title: 'Waves & Sound', type: 'video' },
              { title: 'Modern Physics: The Atom & Radioactivity', type: 'article' },
              { title: 'Physics Exam Practice', type: 'quiz' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'National Exam Math & Physics Prep Program (S3–S6)',
      description: 'Intensive exam preparation in Mathematics and Physics for O-Level and A-Level learners. Weekly live problem-solving sessions, past-paper marathons and personalised study plans, led by Eric Nsengiyumva.',
      duration: '4 Months',
      price: 150000,
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop',
      eligibility: 'For secondary learners in S3–S6 preparing for national mathematics and physics examinations.',
      rules: 'Weekly live sessions required. Mock exams every month with detailed feedback.',
    },
  },
  {
    email: 'josiane.uwera@bootskills.com',
    fullName: 'Josiane Uwera',
    courses: [
      {
        title: 'English Language & Communication Mastery',
        description: 'Speak and write English with confidence. A conversation-first course covering grammar, vocabulary, pronunciation, and professional communication — from beginner to advanced.',
        category: 'Languages',
        level: 'Beginner',
        price: 35000,
        thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Speaking & Pronunciation',
            description: 'Build confidence in spoken English.',
            lessons: [
              { title: 'Pronunciation & Intonation', type: 'video' },
              { title: 'Everyday Conversation Practice', type: 'video' },
              { title: 'Presentation & Public Speaking', type: 'assignment' },
            ],
          },
          {
            title: 'Grammar & Writing',
            description: 'Accurate, clear written English.',
            lessons: [
              { title: 'Essential English Grammar', type: 'video' },
              { title: 'Business & Formal Writing', type: 'video' },
              { title: 'Essay & Email Writing', type: 'article' },
              { title: 'Writing Portfolio Project', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'French & Kinyarwanda for Everyday Success',
        description: 'Learn practical French and Kinyarwanda for school, work and daily life. Covers greetings, vocabulary, grammar and real-life dialogues with cultural context.',
        category: 'Languages',
        level: 'Beginner',
        price: 30000,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'French Foundations',
            description: 'Core French for beginners.',
            lessons: [
              { title: 'French Basics: Greetings & Numbers', type: 'video' },
              { title: 'French Grammar Essentials', type: 'video' },
              { title: 'Everyday French Dialogues', type: 'assignment' },
            ],
          },
          {
            title: 'Kinyarwanda Foundations',
            description: 'Speak Kinyarwanda with confidence.',
            lessons: [
              { title: 'Kinyarwanda Greetings & Etiquette', type: 'video' },
              { title: 'Kinyarwanda Grammar & Sentence Structure', type: 'video' },
              { title: 'Conversation Practice', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Languages & Communication Skills Program',
      description: 'A 3-month multilingual program in English, French and Kinyarwanda. Weekly conversation clubs, grammar clinics, IELTS/TOEFL preparation and professional communication coaching, led by Josiane Uwera.',
      duration: '3 Months',
      price: 90000,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
      eligibility: 'For learners and professionals who want to strengthen English, French or Kinyarwanda skills.',
      rules: 'Weekly conversation club attendance recommended. Assessment at start and end of program.',
    },
  },
  {
    email: 'thierry.mugisha@bootskills.com',
    fullName: 'Thierry Mugisha',
    courses: [
      {
        title: 'Computer Literacy & Digital Skills (TVET)',
        description: 'Hands-on computer training from the very basics to confident daily use: hardware, files, typing, Microsoft Word/Excel, email, internet safety and online collaboration. Aligned to TVET N-levels.',
        category: 'Vocational',
        level: 'Beginner',
        price: 30000,
        thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Computer Basics & Operating Systems',
            description: 'Hardware, files and the desktop.',
            lessons: [
              { title: 'Understanding Computer Hardware', type: 'video' },
              { title: 'Files, Folders & Organisation', type: 'video' },
              { title: 'Keyboard Skills & Typing', type: 'assignment' },
            ],
          },
          {
            title: 'Office Software & Internet',
            description: 'Word, Excel, email and the web.',
            lessons: [
              { title: 'Microsoft Word Essentials', type: 'video' },
              { title: 'Microsoft Excel Essentials', type: 'video' },
              { title: 'Email & Internet Safety', type: 'article' },
              { title: 'Build a CV in Word', type: 'assignment' },
            ],
          },
          {
            title: 'Digital Work Skills',
            description: 'Online collaboration and job-readiness.',
            lessons: [
              { title: 'Online Collaboration Tools', type: 'video' },
              { title: 'Job Searching & Online Applications', type: 'video' },
              { title: 'Final Digital Skills Project', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Entrepreneurship & Small Business Basics',
        description: 'Turn your idea into a small business. Learn business planning, simple accounting, marketing, customer care and how to access finance in Rwanda.',
        category: 'Business',
        level: 'Beginner',
        price: 28000,
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Business Ideas & Planning',
            description: 'Validate your idea and write a plan.',
            lessons: [
              { title: 'Finding a Business Opportunity', type: 'video' },
              { title: 'Writing a Simple Business Plan', type: 'video' },
              { title: 'Costing & Pricing Your Product', type: 'article' },
              { title: 'Draft Your Business Plan', type: 'assignment' },
            ],
          },
          {
            title: 'Money, Marketing & Customers',
            description: 'Run and grow your small business.',
            lessons: [
              { title: 'Simple Bookkeeping for Small Business', type: 'video' },
              { title: 'Marketing on a Small Budget', type: 'video' },
              { title: 'Customer Care & Sales', type: 'article' },
              { title: 'Launch Plan Presentation', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Digital Skills & Entrepreneurship Program (TVET)',
      description: 'A practical TVET program combining computer literacy, digital skills and small-business training. Learners build a real mini-business while gaining certified digital skills aligned to national TVET levels, led by Thierry Mugisha.',
      duration: '4 Months',
      price: 110000,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=450&fit=crop',
      eligibility: 'For young people and adults who want practical digital and entrepreneurship skills for employment or self-employment.',
      rules: 'Attendance at workshops required. Each learner completes a final business plan project.',
    },
  },
  {
    email: 'sandrine.ingabire@bootskills.com',
    fullName: 'Sandrine Ingabire',
    courses: [
      {
        title: 'Chemistry Foundations (S1–S6)',
        description: 'Master chemistry from atoms to reactions. Covers the periodic table, chemical bonding, acids and bases, and organic chemistry with safe home experiments and exam practice.',
        category: 'Science',
        level: 'Intermediate',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Atomic Structure & Bonding',
            description: 'The building blocks of matter.',
            lessons: [
              { title: 'Atoms, Elements & the Periodic Table', type: 'video' },
              { title: 'Chemical Bonding', type: 'video' },
              { title: 'Chemical Formulae & Equations', type: 'article' },
              { title: 'Bonding Practice Set', type: 'assignment' },
            ],
          },
          {
            title: 'Reactions & Organic Chemistry',
            description: 'How chemicals react.',
            lessons: [
              { title: 'Acids, Bases & Salts', type: 'video' },
              { title: 'Rates of Reaction', type: 'video' },
              { title: 'Introduction to Organic Chemistry', type: 'article' },
              { title: 'Chemistry Exam Practice', type: 'quiz' },
            ],
          },
        ],
      },
      {
        title: 'Biology & Environmental Science (S1–S6)',
        description: 'Discover living systems — cells, genetics, ecology and environmental science — with connections to Rwandan health and environment issues. Includes national exam preparation.',
        category: 'Science',
        level: 'Intermediate',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Cells, Genetics & Living Systems',
            description: 'Life at every scale.',
            lessons: [
              { title: 'Cell Structure & Function', type: 'video' },
              { title: 'Genetics & Heredity', type: 'video' },
              { title: 'Human Body Systems', type: 'article' },
              { title: 'Biology Lab Project', type: 'assignment' },
            ],
          },
          {
            title: 'Ecology & Environmental Science',
            description: 'Ecosystems and sustainability.',
            lessons: [
              { title: 'Ecosystems & Food Chains', type: 'video' },
              { title: 'Climate Change & Conservation', type: 'video' },
              { title: 'Environmental Health in Rwanda', type: 'article' },
              { title: 'Science Exam Practice', type: 'quiz' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Science Excellence Program (S1–S6)',
      description: 'A guided science coaching program in Chemistry and Biology with weekly lab-style sessions, science club projects and national exam preparation. Includes girls-in-STEM mentorship, led by Sandrine Ingabire.',
      duration: '4 Months',
      price: 140000,
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop',
      eligibility: 'For secondary learners (S1–S6) who want to excel in Chemistry and Biology.',
      rules: 'Weekly sessions and monthly lab projects required. Exam mocks every two months.',
    },
  },
  {
    email: 'aline.uwimana@bootskills.com',
    fullName: 'Aline Uwimana',
    courses: [
      {
        title: 'Early Childhood Education & Play-Based Learning',
        description: 'A teacher-training course on how young children learn: play-based and Montessori-inspired methods, lesson planning, classroom management and child development milestones (P1–P4).',
        category: 'Education',
        level: 'Beginner',
        price: 35000,
        thumbnail: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Child Development & Learning',
            description: 'How young children grow and learn.',
            lessons: [
              { title: 'Developmental Milestones (Ages 3–9)', type: 'video' },
              { title: 'How Children Learn: Play & Curiosity', type: 'video' },
              { title: 'Classroom Management for Young Learners', type: 'article' },
            ],
          },
          {
            title: 'Play-Based & Montessori Methods',
            description: 'Practical teaching approaches.',
            lessons: [
              { title: 'Designing Play-Based Activities', type: 'video' },
              { title: 'Montessori Materials in Practice', type: 'video' },
              { title: 'Lesson Planning for Early Grades', type: 'assignment' },
              { title: 'Design a Learning Station', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Inclusive & Special Needs Teaching Methods',
        description: 'Practical strategies for teaching children with learning difficulties and disabilities: differentiated instruction, assistive tools, behaviour support and working with parents.',
        category: 'Education',
        level: 'Intermediate',
        price: 38000,
        thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Understanding Learning Differences',
            description: 'Recognise and support diverse learners.',
            lessons: [
              { title: 'Types of Learning Difficulties', type: 'video' },
              { title: 'Creating Inclusive Classrooms', type: 'video' },
              { title: 'Differentiated Instruction', type: 'article' },
              { title: 'Case Study: Inclusive Lesson Plan', type: 'assignment' },
            ],
          },
          {
            title: 'Support & Family Engagement',
            description: 'Working with families and support systems.',
            lessons: [
              { title: 'Assistive Tools & Resources', type: 'video' },
              { title: 'Positive Behaviour Support', type: 'video' },
              { title: 'Parent Workshops & Communication', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Early Childhood & Inclusive Education Program',
      description: 'A professional development program for teachers and caregivers: play-based learning, Montessori methods and inclusive education for children with special needs. Includes classroom observation and certification, led by Aline Uwimana.',
      duration: '3 Months',
      price: 95000,
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=450&fit=crop',
      eligibility: 'For primary teachers, teaching assistants, and parents interested in early childhood and inclusive education.',
      rules: 'Monthly classroom projects and a final teaching portfolio are required.',
    },
  },
  {
    email: 'marieclaudine.mukandayisenga@bootskills.com',
    fullName: 'Marie Claudine Mukandayisenga',
    courses: [
      {
        title: 'Early Grade Reading (EGRA) Coach Training',
        description: 'Learn the EGRA methodology to assess and boost early-grade reading. Covers oral reading fluency, phonemic awareness, and remedial strategies for struggling readers (P1–P6).',
        category: 'Education',
        level: 'Intermediate',
        price: 32000,
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'EGRA Assessment & Data',
            description: 'Measure and understand reading levels.',
            lessons: [
              { title: 'Introduction to EGRA', type: 'video' },
              { title: 'Administering EGRA Assessments', type: 'video' },
              { title: 'Interpreting Assessment Data', type: 'article' },
            ],
          },
          {
            title: 'Remedial Reading Strategies',
            description: 'Help struggling readers catch up.',
            lessons: [
              { title: 'Phonemic Awareness Activities', type: 'video' },
              { title: 'Fluency & Comprehension Drills', type: 'video' },
              { title: 'Designing a Remedial Plan', type: 'assignment' },
              { title: 'Reading Clinic Practicum', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Early Grade Mathematics (EGMA) Coach Training',
        description: 'Master EGMA methods for foundational numeracy: number sense, operations, and word problems — with fun, hands-on activities that build confident young mathematicians.',
        category: 'Education',
        level: 'Intermediate',
        price: 32000,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'EGMA Foundations',
            description: 'Assessing foundational numeracy.',
            lessons: [
              { title: 'Introduction to EGMA', type: 'video' },
              { title: 'Assessing Number Sense & Operations', type: 'video' },
              { title: 'Using Data to Plan Teaching', type: 'article' },
            ],
          },
          {
            title: 'Fun Foundational Math',
            description: 'Games and activities that build number skills.',
            lessons: [
              { title: 'Number Sense Games', type: 'video' },
              { title: 'Word Problems Made Visual', type: 'video' },
              { title: 'Design a Math Activity Kit', type: 'assignment' },
              { title: 'Numeracy Practicum', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Early Grade Learning Coach Program (EGRA / EGMA)',
      description: 'Become a certified early-grade learning coach. Hands-on training in EGRA and EGMA assessment, remedial teaching and teacher mentorship, with a real school practicum, led by Marie Claudine Mukandayisenga.',
      duration: '3 Months',
      price: 90000,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
      eligibility: 'For teachers, coaches and education officers working with early-grade learners (P1–P6).',
      rules: 'Includes a supervised school practicum. Final assessment report required for certification.',
    },
  },
  {
    email: 'patrick.nzabonimpa@bootskills.com',
    fullName: 'Patrick Nzabonimpa',
    courses: [
      {
        title: 'Electrical Installation & Wiring (TVET)',
        description: 'Practical electrical training aligned to TVET N-levels: safety, tools, circuits, wiring techniques, testing and fault-finding. Build real, job-ready skills for the electrical trade.',
        category: 'Vocational',
        level: 'Intermediate',
        price: 55000,
        thumbnail: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Electrical Safety & Fundamentals',
            description: 'Safety first, always.',
            lessons: [
              { title: 'Electrical Safety & PPE', type: 'video' },
              { title: 'Voltage, Current & Resistance', type: 'video' },
              { title: 'Reading Electrical Diagrams', type: 'article' },
              { title: 'Safety Inspection Checklist', type: 'assignment' },
            ],
          },
          {
            title: 'Wiring & Practical Installation',
            description: 'Real wiring skills you can use.',
            lessons: [
              { title: 'Tools of the Trade', type: 'video' },
              { title: 'Wiring Sockets, Switches & Lighting', type: 'video' },
              { title: 'Testing & Fault Finding', type: 'video' },
              { title: 'Install a Light Circuit', type: 'assignment' },
            ],
          },
          {
            title: 'TVET Certification Prep',
            description: 'Prepare for national TVET assessments.',
            lessons: [
              { title: 'N-Level Assessment Format', type: 'video' },
              { title: 'Practical Assessment Practice', type: 'video' },
              { title: 'Mock Certification Test', type: 'quiz' },
            ],
          },
        ],
      },
      {
        title: 'Solar Energy Systems & Installation (TVET)',
        description: 'Design and install solar PV systems: panels, batteries, inverters and wiring. Includes sizing, safety, maintenance and business skills for starting a solar installation service.',
        category: 'Vocational',
        level: 'Intermediate',
        price: 65000,
        thumbnail: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Solar Energy Fundamentals',
            description: 'How solar power works.',
            lessons: [
              { title: 'Solar Radiation & PV Cells', type: 'video' },
              { title: 'System Components: Panels, Batteries, Inverters', type: 'video' },
              { title: 'Sizing a Solar System', type: 'article' },
            ],
          },
          {
            title: 'Installation & Maintenance',
            description: 'Install systems that last.',
            lessons: [
              { title: 'Mounting & Wiring Solar Panels', type: 'video' },
              { title: 'Battery & Inverter Connections', type: 'video' },
              { title: 'Testing, Maintenance & Troubleshooting', type: 'article' },
              { title: 'Install a Small Home System', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Solar & Electrical Technician Program (TVET)',
      description: 'A hands-on TVET program training electricians and solar technicians: electrical installation, solar PV systems and workplace safety, aligned to national TVET certification (N1+), with internship placement support. Led by Patrick Nzabonimpa.',
      duration: '5 Months',
      price: 180000,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=450&fit=crop',
      eligibility: 'For young people interested in electrical or renewable energy careers. No prior experience required.',
      rules: 'Practical workshops are mandatory. Graduates receive support for TVET certification and internship placement.',
    },
  },
  {
    email: 'olivier.twagirimana@bootskills.com',
    fullName: 'Olivier Twagirimana',
    courses: [
      {
        title: 'Modern Agriculture & Crop Management (TVET)',
        description: 'Learn modern farming: soil care, seeds, irrigation, pest control and post-harvest handling — with practical farm activities aligned to TVET N-levels and real Rwandan conditions.',
        category: 'Vocational',
        level: 'Intermediate',
        price: 50000,
        thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Soil, Seeds & Planting',
            description: 'Grow healthy crops from the ground up.',
            lessons: [
              { title: 'Understanding Soil & Fertility', type: 'video' },
              { title: 'Seed Selection & Nursery Management', type: 'video' },
              { title: 'Planting & Crop Calendar', type: 'article' },
              { title: 'Plan a Planting Season', type: 'assignment' },
            ],
          },
          {
            title: 'Irrigation, Pests & Harvest',
            description: 'Protect and harvest your crops.',
            lessons: [
              { title: 'Irrigation & Water Management', type: 'video' },
              { title: 'Pest & Disease Control', type: 'video' },
              { title: 'Post-Harvest Handling & Storage', type: 'article' },
              { title: 'Farm Management Project', type: 'assignment' },
            ],
          },
        ],
      },
      {
        title: 'Agribusiness & Farm Entrepreneurship',
        description: 'Turn farming into a business: agribusiness planning, simple farm accounting, marketing produce, cooperatives and accessing finance and markets in Rwanda.',
        category: 'Business',
        level: 'Beginner',
        price: 42000,
        thumbnail: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=450&fit=crop',
        modules: [
          {
            title: 'Agribusiness Basics',
            description: 'Farming as a real business.',
            lessons: [
              { title: 'From Farm to Business', type: 'video' },
              { title: 'Farm Costing & Simple Accounting', type: 'video' },
              { title: 'Marketing Your Produce', type: 'article' },
              { title: 'Agribusiness Plan Draft', type: 'assignment' },
            ],
          },
          {
            title: 'Markets, Cooperatives & Finance',
            description: 'Grow beyond the farm gate.',
            lessons: [
              { title: 'Cooperatives & Collective Selling', type: 'video' },
              { title: 'Accessing Loans & Grants', type: 'video' },
              { title: 'Agri-Tech & Modern Opportunities', type: 'article' },
              { title: 'Present Your Agribusiness Plan', type: 'assignment' },
            ],
          },
        ],
      },
    ],
    program: {
      title: 'Agribusiness & Youth Employment Program (TVET)',
      description: 'A practical TVET program for young agripreneurs: modern agriculture, farm management and agribusiness skills with mentorship, field visits and support to start or grow a farming enterprise. Led by Olivier Twagirimana.',
      duration: '4 Months',
      price: 130000,
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=450&fit=crop',
      eligibility: 'For youth, farmers and cooperatives who want modern, business-minded agriculture skills.',
      rules: 'Includes field visits and a final agribusiness project. Cooperative membership support available.',
    },
  },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────

async function seedTeacherPrograms() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB\n');

    let coursesCreated = 0;
    let coursesSkipped = 0;
    let programsCreated = 0;
    let programsSkipped = 0;
    let teachersMissing = 0;

    for (const td of teachersData) {
      const trainer = await User.findOne({ email: td.email });
      if (!trainer || trainer.role !== 'trainer') {
        console.log(`⚠️  Teacher not found or not a trainer: ${td.email} — skipping`);
        teachersMissing++;
        continue;
      }

      // ── Courses ──
      for (const cd of td.courses) {
        const existing = await Course.findOne({ title: cd.title, isDeleted: { $ne: true } });
        if (existing) {
          console.log(`   ⏭️  Course exists: "${cd.title}"`);
          coursesSkipped++;
          continue;
        }

        const modules = cd.modules.map((m, i) => makeModule(m.title, m.description, m.lessons, i + 1));
        const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

        const course = await new Course({
          title: cd.title,
          description: cd.description,
          thumbnail: cd.thumbnail,
          category: cd.category,
          level: cd.level,
          price: cd.price,
          discountPrice: 0,
          instructor: trainer._id,
          createdBy: trainer._id,
          status: 'published',
          enrollmentMode: 'direct',
          school: 'Bootskills Academy',
          allowedDeliveryModes: ['online', 'hybrid'],
          modules,
          studentsEnrolled: [],
          modulesCount: modules.length,
          totalLessonsCount: totalLessons,
          curriculumMetadata: {
            sector: 'Education & Training',
            competencyBased: true,
          },
          isFeatured: cd.price >= 50000,
        }).save();

        console.log(`   ✅ Course: "${cd.title}" — ${td.fullName} (${modules.length} modules, ${totalLessons} lessons)`);
        coursesCreated++;
      }

      // ── Program ──
      const existingProgram = await InternshipProgram.findOne({ title: td.program.title, isDeleted: { $ne: true } });
      if (existingProgram) {
        console.log(`   ⏭️  Program exists: "${td.program.title}"`);
        programsSkipped++;
      } else {
        const start = daysFromNow(14);
        const end = daysFromNow(14 + (td.program.duration.includes('3') ? 90 : td.program.duration.includes('4') ? 120 : td.program.duration.includes('5') ? 150 : 180));

        await new InternshipProgram({
          title: td.program.title,
          description: td.program.description,
          duration: td.program.duration,
          startDate: start,
          endDate: end,
          applicationDeadline: daysFromNow(10),
          eligibility: td.program.eligibility,
          rules: td.program.rules,
          price: td.program.price,
          currency: 'RWF',
          discount: 0,
          maxSpots: 20,
          image: td.program.image,
          status: 'active',
          isActive: true,
          allowedDeliveryModes: ['online', 'hybrid'],
          createdBy: trainer._id,
        }).save();

        console.log(`   ✅ Program: "${td.program.title}" — ${td.fullName}`);
        programsCreated++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 SEED SUMMARY — Teacher Programs');
    console.log('═'.repeat(60));
    console.log(`   👤 Teachers found:      ${teachersData.length - teachersMissing}/${teachersData.length}`);
    console.log(`   📚 Courses created:     ${coursesCreated} | skipped: ${coursesSkipped}`);
    console.log(`   🏗️  Programs created:   ${programsCreated} | skipped: ${programsSkipped}`);
    console.log('═'.repeat(60));
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding teacher programs:', error);
    process.exit(1);
  }
}

seedTeacherPrograms();
