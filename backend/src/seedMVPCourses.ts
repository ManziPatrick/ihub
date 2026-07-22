/**
 *  SEED: 10 MVP Courses — African Market Gap Courses
 *
 * Creates 10 comprehensive, sellable courses targeting the biggest skill gaps
 * in Rwanda and across Africa. Each course includes:
 *   - High-quality Pexels image (via API)
 *   - 2-3 modules with lessons
 *   - Quizzes & assignments
 *   - Affordable pricing for the African market
 *
 * Usage:
 *    cd backend
 *    npx tsx src/seedMVPCourses.ts
 *
 * Environment variables required:
 *   PEXELS_API_KEY or VITE_PEXELS_API_KEY — for fetching high-quality images
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { getCourseIllustrationUrl, verifyImageUrl } from './services/image-api.service';

const HAS_PEXELS_KEY = !!(process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY);

dotenv.config();

// ─── Helper Functions ───────────────────────────────────────────────────────

function makeLesson(title: string, content: string, type: string = 'article', order: number = 1, extras: Record<string, any> = {}) {
  // Get imageUrl from extras if provided
  const imgUrl = extras.imageUrl;
  const imgMd = imgUrl ? `\n\n![${title}](${imgUrl})` : '';
  // Add phone-friendly practical tips for article/video lessons
  const phoneTips = type === 'article' || type === 'video' ? `\n\n>  **On a budget smartphone?** Most tools mentioned have free mobile apps. Use Chrome or your phone browser to follow along.\n>  **On a laptop/PC?** Open two browser tabs — one for this lesson, one to practice. Download templates from the resources section.\n>  **Limited data?** Connect at a WiFi hotspot to download lesson materials for offline study.` : '';
  return {
    title,
    content: `## ${title}\n\n${content}${imgMd}${phoneTips}`,
    type,
    duration: type === 'video' ? 10 : type === 'quiz' ? 8 : type === 'assignment' ? 15 : 12,
    order,
    ...extras,
  };
}

function makeQuizLesson(title: string, content: string, questions: any[], order: number, timeLimit: number = 8) {
  return makeLesson(title, content, 'quiz', order, {
    quizConfig: {
      disableRightClick: false,
      timeLimit,
      quizType: 'exercise',
      questionsPerPage: 5,
    },
    quizQuestions: questions.map((q, i) => ({
      questionText: q.question,
      type: q.type || 'multiple_choice',
      options: q.options || [],
      correctOptionIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
    })),
  });
}

function makeAssignmentLesson(
  title: string,
  content: string,
  description: string,
  questions: any[],
  order: number,
  timeLimit: number = 15,
) {
  return makeLesson(title, content, 'assignment', order, {
    isAssignment: true,
    requiredAssignment: true,
    assignmentDescription: description,
    assignmentConfig: {
      timeLimit,
      allowRetakes: true,
      disableRightClick: false,
      mode: 'exam',
    },
    assignmentQuestions: questions.map((q, i) => ({
      questionText: q.question,
      type: q.type || 'mcq',
      options: q.options || [],
      correctOptionIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
      points: q.points || 10,
    })),
  });
}

function makeModule(title: string, description: string, lessons: any[], outcome: string = '', order: number = 1) {
  return {
    title,
    description,
    lessons,
    learningOutcome: outcome || `Master the concepts covered in ${title}.`,
    actionPlan: outcome ? `Complete this module and its assignment to achieve: ${outcome}` : '',
    order: order ?? 1,
  };
}

// ─── Course Definitions ─────────────────────────────────────────────────────

interface CourseDef {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  discountPrice?: number;
  searchImage: string; // keyword to search on Pexels
  modules: ReturnType<typeof makeModule>[];
  isFeatured?: boolean;
  school?: string;
}

const COURSES: CourseDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 1: Digital Marketing for African SMEs
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Digital Marketing That Works in Rwanda',
    description:
      '🇷🇼 Made for Rwandan businesses — learn digital marketing with local examples you can actually use. ' +
      'From WhatsApp Business for Kigali shops to Instagram for tourism and Facebook Marketplace for farmers, ' +
      'this course shows you exactly how to attract customers without spending a fortune on ads. ' +
      'Real strategies that worked for Rwandan SMEs — not generic advice from abroad.',
    category: 'Business',
    level: 'Beginner',
    price: 2000,
    searchImage: 'digital marketing africa social media business',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Foundations of Digital Marketing',
        'Understand the digital landscape in Africa and why digital marketing is essential for SMEs.',
        [
          makeLesson(
            'The African Digital Landscape',
            'Africa has over 500 million internet users and growing. Mobile penetration is driving digital adoption. ' +
            'In this lesson, we explore why digital marketing is critical for African SMEs, the platforms that matter ' +
            '(WhatsApp, Facebook, Instagram, TikTok), and how consumer behaviour differs across the continent.\n\n' +
            '### Why Digital Marketing Matters in Africa\n' +
            '- **Mobile-first**: Most Africans access the internet via smartphones\n' +
            '- **Social media dominant**: WhatsApp has over 2 billion users globally, with huge African adoption\n' +
            '- **Cost-effective**: Digital marketing is much cheaper than traditional media in Africa\n' +
            '- **Targeted reach**: Reach exactly the customers who need your product',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=NlLQH3ZKLDA', videoTitle: 'Digital Marketing in 3 Minutes - Quick Guide' },
          ),
          makeLesson(
            'Building Your Digital Marketing Strategy',
            'A digital marketing strategy is your roadmap. This lesson covers how to define your goals, identify your target ' +
            'audience, choose the right platforms, and create a content plan that drives results.\n\n' +
            '### Key Steps:\n' +
            '1. **Define SMART goals** — Specific, Measurable, Achievable, Relevant, Time-bound\n' +
            '2. **Know your audience** — Create customer personas\n' +
            '3. **Choose platforms** — Where do your customers spend time?\n' +
            '4. **Create content** — What resonates with your audience?\n' +
            '5. **Measure & optimize** — Track what works and do more of it',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Low-Budget Marketing Tactics That Work',
            'You do not need a big budget to succeed at digital marketing in Africa. This lesson covers free and low-cost ' +
            'strategies including WhatsApp Business, organic social media, word-of-mouth marketing, and community building.\n\n' +
            '### Free Tools:\n' +
            '- **Canva** — Create professional graphics for free\n' +
            '- **Google My Business** — Get found on Google Maps\n' +
            '- **WhatsApp Business** — Catalogue, quick replies, and broadcast lists\n' +
            '- **Facebook Marketplace** — Sell directly to local buyers',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of digital marketing fundamentals.',
            [
              {
                question: 'Which platform is most widely used for business communication in Africa?',
                options: ['WhatsApp', 'Telegram', 'Signal', 'WeChat'],
                correctIndex: 0,
                explanation: 'WhatsApp has the highest penetration in Africa for business communication.',
              },
              {
                question: 'What does SMART stand for in goal setting?',
                options: [
                  'Simple, Measurable, Achievable, Relevant, Timely',
                  'Specific, Measurable, Achievable, Relevant, Time-bound',
                  'Strategic, Managed, Actionable, Realistic, Tested',
                  'None of the above',
                ],
                correctIndex: 1,
                explanation: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.',
              },
              {
                question: 'Which of these is a free digital marketing tool?',
                options: ['Canva', 'Adobe Photoshop', 'Mailchimp Premium', 'Hootsuite Enterprise'],
                correctIndex: 0,
                explanation: 'Canva offers a generous free tier for creating marketing graphics.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: Marketing Strategy Assignment',
            'Apply what you have learned by creating a mini digital marketing strategy.',
            'Create a one-page digital marketing strategy for a small business of your choice. Include goals, target audience, platforms, and content ideas.',
            [
              {
                question: 'What is the primary goal of your digital marketing strategy?',
                type: 'open',
                explanation: 'A good goal is specific and measurable, e.g., "Increase Instagram followers by 20% in 3 months".',
                points: 15,
              },
              {
                question: 'Which two social media platforms would you prioritise for an African SME and why?',
                type: 'open',
                explanation: 'Consider where the target audience spends time. WhatsApp and Instagram are often top choices.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Create a basic digital marketing strategy for an SME.',
      ),
      makeModule(
        'Module 2: Social Media & Content Marketing',
        'Master social media platforms and content creation for business growth.',
        [
          makeLesson(
            'Instagram & Facebook Marketing',
            'Learn how to optimise your Instagram and Facebook profiles for business, create engaging posts, ' +
            'use Stories and Reels, run contests, and build a community around your brand.\n\n' +
            '### Instagram Tips:\n' +
            '- Use **Reels** for maximum reach — short, engaging videos\n' +
            '- Post consistently — at least 3-4 times per week\n' +
            '- Use relevant **hashtags** — mix popular and niche tags\n' +
            '- Engage with your audience — reply to comments and DMs',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=ErN2pvkSXKA', videoTitle: 'Social Media Strategies for Small Business' },
          ),
          makeLesson(
            'Content Creation with Minimal Resources',
            'You do not need expensive equipment to create great content. This lesson covers smartphone photography, ' +
            'basic video recording, using natural light, and simple editing with free apps.\n\n' +
            '### Smartphone Content Tips:\n' +
            '- Clean your lens! A smudged lens ruins photos\n' +
            '- Use natural light — shoot near windows or outdoors\n' +
            '- Hold steady — use both hands or a cheap tripod\n' +
            '- Edit with free apps — CapCut for video, Snapseed for photos',
            'article',
            2,
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review social media and content marketing concepts.',
            [
              {
                question: 'Which Instagram format currently gets the highest organic reach?',
                options: ['Static posts', 'Stories', 'Reels', 'IGTV'],
                correctIndex: 2,
                explanation: 'Instagram Reels are prioritised by the algorithm for maximum reach.',
              },
              {
                question: 'What is the most important equipment for content creation?',
                options: ['Professional camera', 'Smartphone', 'Studio lights', 'Expensive microphone'],
                correctIndex: 1,
                explanation: 'A modern smartphone is sufficient for creating high-quality content.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final Assessment',
            'Demonstrate your digital marketing knowledge in this final assessment.',
            'Answer the following questions to complete the course.',
            [
              {
                question: 'Describe a complete social media campaign for launching a new product in Kigali, Rwanda. Include platform choice, content types, budget, and success metrics.',
                type: 'open',
                explanation: 'A strong answer includes specific platforms, content formats, a realistic budget, and measurable KPIs.',
                points: 25,
              },
              {
                question: 'How would you measure the ROI of a digital marketing campaign for an SME?',
                options: [
                  'Only by sales revenue',
                  'Using a combination of engagement, leads, conversions, and revenue',
                  'By counting likes only',
                  'ROI cannot be measured for digital marketing',
                ],
                correctIndex: 1,
                explanation: 'ROI should be measured holistically — engagement, leads, conversions, and revenue.',
              },
            ],
            4,
          ),
        ],
        'Execute a complete social media marketing campaign.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 2: Mobile Money & Fintech in Africa
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Mobile Money Mastery: M-Pesa, MoMo & Fintech in Rwanda',
    description:
      ' Rwanda is going cashless — and mobile money is leading the way. This course teaches you everything about ' +
      'M-Pesa, Airtel Money, and the fintech revolution happening right now in East Africa. ' +
      'Learn how mobile payments work, how to start a fintech business, and how digital lending, insurance, ' +
      'and savings products are creating opportunities for Rwandan entrepreneurs and professionals.',
    category: 'Business',
    level: 'Intermediate',
    price: 2000,
    searchImage: 'mobile money payment fintech africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Understanding Mobile Money',
        'Learn the fundamentals of mobile money systems and their impact on African economies.',
        [
          makeLesson(
            'The Mobile Money Revolution in Africa',
            'Mobile money started with M-Pesa in Kenya in 2007 and has since spread across Africa. Today, ' +
            'over 500 million mobile money accounts exist globally, with the majority in Sub-Saharan Africa. ' +
            'This lesson explores the history, growth, and impact of mobile money on financial inclusion.\n\n' +
            '### Key Statistics:\n' +
            '- Sub-Saharan Africa accounts for 70% of global mobile money transactions\n' +
            '- Mobile money has lifted 2% of Kenyan households out of poverty\n' +
            '- Over 200 million active mobile money accounts in Africa',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=xcAC2iU1xvI', videoTitle: 'M-Pesa Explained - Mobile Money in 2 Min', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'How Mobile Money Works',
            'Understand the technical and business model behind mobile money. From USSD codes to smartphone apps, ' +
            'agent networks to transaction switching — this lesson breaks down how money moves in mobile financial services.\n\n' +
            '### Core Components:\n' +
            '1. **Registered agents** — The human ATM network\n' +
            '2. **USSD/SIM toolkit** — Works on any phone\n' +
            '3. **Transaction switching** — The backend that moves money\n' +
            '4. **Regulatory compliance** — Central bank oversight',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of mobile money fundamentals.',
            [
              {
                question: 'Which country pioneered mobile money with M-Pesa?',
                options: ['Nigeria', 'Kenya', 'South Africa', 'Ghana'],
                correctIndex: 1,
                explanation: 'M-Pesa was launched in Kenya by Safaricom in 2007.',
              },
              {
                question: 'What technology do most basic mobile money services use?',
                options: ['4G internet', 'USSD codes', 'Bluetooth', 'NFC'],
                correctIndex: 1,
                explanation: 'USSD codes work on any mobile phone, even without internet access.',
              },
              {
                question: 'What percentage of global mobile money transactions occur in Sub-Saharan Africa?',
                options: ['30%', '50%', '70%', '90%'],
                correctIndex: 2,
                explanation: 'Sub-Saharan Africa accounts for approximately 70% of global mobile money transactions.',
              },
            ],
            3,
          ),
        ],
        'Explain how mobile money systems work in Africa.',
      ),
      makeModule(
        'Module 2: Fintech Innovation & Opportunities',
        'Explore the broader fintech landscape and identify opportunities for innovation.',
        [
          makeLesson(
            'Digital Lending & Credit Scoring',
            'How fintech companies are using alternative data (airtime top-ups, mobile money transactions, social data) ' +
            'to provide credit to the unbanked. Learn about digital lending platforms, risk assessment, and responsible lending.\n\n' +
            '### Alternative Credit Scoring:\n' +
            '- Airtime recharge history\n' +
            '- Mobile money transaction patterns\n' +
            '- Utility bill payment history\n' +
            '- Social network analysis',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Building a Fintech Startup in Africa',
            'What it takes to build a fintech company in Africa — regulatory challenges, partnership models, ' +
            'infrastructure requirements, and go-to-market strategies. Real case studies from successful African fintechs.\n\n' +
            '### Success Factors:\n' +
            '- Partner with mobile network operators (MNOs)\n' +
            '- Navigate central bank regulations early\n' +
            '- Build for the unbanked — simple UI, offline support\n' +
            '- Focus on trust and security',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=c97IXtFAzlI', videoTitle: 'How Mobile Money M-Pesa Works - 2 Min' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review fintech innovation concepts.',
            [
              {
                question: 'What is alternative credit scoring?',
                options: [
                  'Using traditional bank statements',
                  'Using non-traditional data like airtime top-ups to assess creditworthiness',
                  'Using only collateral',
                  'A manual credit assessment process',
                ],
                correctIndex: 1,
                explanation: 'Alternative credit scoring uses non-traditional data to assess creditworthiness for the unbanked.',
              },
              {
                question: 'Who is a critical partner for fintech startups in Africa?',
                options: ['International banks', 'Mobile network operators', 'Global tech companies', 'Real estate firms'],
                correctIndex: 1,
                explanation: 'Mobile network operators provide essential infrastructure and customer access.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Fintech Innovation Project',
            'Design a fintech solution for an African market.',
            'Design a simple fintech product that solves a real problem in your community. Describe the target users, the problem, your solution, and how you would make money.',
            [
              {
                question: 'Describe your fintech product idea. What problem does it solve and who are the target users?',
                type: 'open',
                explanation: 'Focus on a real need — savings groups, agricultural insurance, school fee payments, etc.',
                points: 20,
              },
              {
                question: 'What regulatory considerations would you need to address?',
                type: 'open',
                explanation: 'Consider central bank licensing, data protection, anti-money laundering requirements.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Identify and analyse fintech opportunities in African markets.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 3: Freelancing & Remote Work Mastery
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Earn in Dollars: Freelancing & Remote Work from Rwanda',
    description:
      ' Make money in RWF and earn in USD — no office required. This course shows you how to ' +
      'start freelancing on Upwork and Fiverr, even with zero experience. ' +
      'Learn to build a profile that gets hired, write winning proposals, impress international clients, ' +
      'and receive payments easily. Perfect for Rwandan graduates and professionals ' +
      'who want to earn globally while living in Rwanda.',
    category: 'Business',
    level: 'Beginner',
    price: 2000,
    searchImage: 'remote work freelancing laptop africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Getting Started as a Freelancer',
        'Learn how to set up your freelancing business and find your first clients.',
        [
          makeLesson(
            'Why Freelancing is the Future for African Professionals',
            'The global freelance economy is worth over $1.5 trillion. African freelancers have a competitive advantage — ' +
            'competitive rates, English proficiency in many countries, and a growing digital infrastructure. ' +
            'This lesson explores the opportunities and how to position yourself for success.\n\n' +
            '### Benefits:\n' +
            '- Earn in USD, EUR, or GBP while living in Africa\n' +
            '- Flexible working hours\n' +
            '- Build a global portfolio\n' +
            '- No commuting costs',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=k3A4XPtcON0', videoTitle: 'How to Start Freelancing - Complete Guide in 3 Min' },
          ),
          makeLesson(
            'Setting Up Your Freelancing Business',
            'From choosing your niche to registering on platforms — everything you need to get started. ' +
            'Learn about Upwork, Fiverr, Freelancer.com, Toptal, and niche platforms for specific skills.\n\n' +
            '### Getting Started Checklist:\n' +
            '- Identify your in-demand skill\n' +
            '- Create a professional profile with portfolio\n' +
            '- Set competitive pricing\n' +
            '- Write compelling proposals\n' +
            '- Understand platform fees and payment methods',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your freelancing fundamentals.',
            [
              {
                question: 'What is the largest global freelancing platform?',
                options: ['Fiverr', 'Upwork', 'Freelancer.com', 'Toptal'],
                correctIndex: 1,
                explanation: 'Upwork is the largest freelancing platform by transaction volume.',
              },
              {
                question: 'What is a key advantage of freelancing from Africa?',
                options: ['Lower taxes always', 'Competitive rates + global earning potential', 'Free internet', 'Guaranteed clients'],
                correctIndex: 1,
                explanation: 'African freelancers can earn in strong currencies while enjoying competitive cost advantages.',
              },
            ],
            3,
          ),
        ],
        'Launch a freelancing profile on a global platform.',
      ),
      makeModule(
        'Module 2: Winning Clients & Growing Your Business',
        'Master the skills needed to win clients and scale your freelancing business.',
        [
          makeLesson(
            'Writing Winning Proposals',
            'Your proposal is your first impression. Learn how to write proposals that get responses, ' +
            'stand out from hundreds of applicants, and convert to paying clients.\n\n' +
            '### Proposal Template:\n' +
            '1. **Greeting** — Personalise with their name\n' +
            '2. **Understanding** — Show you understand their project\n' +
            '3. **Your solution** — How you will solve their problem\n' +
            '4. **Experience** — Relevant samples\n' +
            '5. **Call to action** — Invite them to chat',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Client Communication & Relationship Management',
            'How to communicate professionally with clients across different time zones, manage expectations, ' +
            'handle revisions, and build long-term relationships that lead to repeat business and referrals.\n\n' +
            '### Communication Tips:\n' +
            '- Respond within 24 hours\n' +
            '- Over-communicate progress\n' +
            '- Set clear boundaries on revisions\n' +
            '- Always deliver on time',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=y-YxIZhA5IA', videoTitle: 'Freelancing Tips - How to Get Clients Fast' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review client-winning strategies.',
            [
              {
                question: 'What is the most important part of a winning proposal?',
                options: ['A low price', 'Understanding the clients problem', 'A long bio', 'Fancy formatting'],
                correctIndex: 1,
                explanation: 'Clients want to know you understand their specific problem and have a solution.',
              },
              {
                question: 'How quickly should you respond to client messages?',
                options: ['Within 24 hours', 'Within a week', 'Only on weekdays', 'Whenever you feel like it'],
                correctIndex: 0,
                explanation: 'Responding within 24 hours shows professionalism and reliability.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final Freelancing Project',
            'Apply everything you have learned.',
            'Create a complete freelancing profile and write a sample proposal for a real job posting.',
            [
              {
                question: 'Write a proposal for a freelance job posting of your choice. Include the greeting, understanding, solution, experience, and call to action.',
                type: 'open',
                explanation: 'Use the 5-part template from the lesson. Keep it concise and focused on the clients needs.',
                points: 25,
              },
              {
                question: 'What are three strategies to get your first freelance client?',
                type: 'open',
                explanation: 'Consider: bidding competitively, offering a small free sample, leveraging LinkedIn, or asking for referrals.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Win your first freelance client and build a sustainable business.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 4: Entrepreneurship & Business Planning
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Start Your Business in Rwanda: From Idea to Launch',
    description:
      ' You have an idea — now make it real. From registering at RDB to writing a business plan that gets funded. ' +
      'This course uses real examples from Rwandan startups (PesaChoice, Yego, HeHe) to show you ' +
      'exactly how to validate your idea, find customers, raise capital, and launch successfully. ' +
      'Includes templates designed for the Rwandan market — financial projections, pitch decks, and more.',
    category: 'Business',
    level: 'Beginner',
    price: 2000,
    searchImage: 'entrepreneurship business planning africa startup',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Finding Your Business Idea',
        'Learn how to identify business opportunities and validate your ideas.',
        [
          makeLesson(
            'Identifying Business Opportunities & Writing a Plan',
            'Africa is full of untapped business opportunities. From solving everyday problems to leveraging technology, ' +
            'this lesson helps you identify viable business ideas that address real market needs.\n\n' +
            '### Opportunity Sources:\n' +
            '- **Pain points** — What frustrates people daily?\n' +
            '- **Gaps in the market** — What is missing in your community?\n' +
            '- **Trends** — What is growing (mobile money, e-commerce, health tech)?\n' +
            '- **Skills** — What can you do better than others?',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=uZVTKZ8RSnc', videoTitle: 'Business Plan in 3 Minutes - Quick Start' },
          ),
          makeLesson(
            'Validating Your Business Idea',
            'Before you invest time and money, validate that people will actually pay for your solution. ' +
            'Learn customer discovery, surveys, minimum viable products (MVPs), and the lean startup methodology.\n\n' +
            '### Validation Steps:\n' +
            '1. Talk to 20+ potential customers\n' +
            '2. Identify their biggest pain point\n' +
            '3. Build a simple MVP\n' +
            '4. Get feedback and iterate\n' +
            '5. Only then — build and launch',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of business opportunity identification.',
            [
              {
                question: 'What is the first step in validating a business idea?',
                options: ['Register the company', 'Talk to potential customers', 'Build the full product', 'Hire employees'],
                correctIndex: 1,
                explanation: 'Always talk to potential customers first to understand their real needs.',
              },
              {
                question: 'What does MVP stand for in entrepreneurship?',
                options: ['Most Valuable Product', 'Minimum Viable Product', 'Maximum Viable Product', 'Minimum Value Product'],
                correctIndex: 1,
                explanation: 'A Minimum Viable Product is the simplest version that solves the core problem.',
              },
            ],
            3,
          ),
        ],
        'Identify and validate a viable business opportunity.',
      ),
      makeModule(
        'Module 2: Business Planning & Funding',
        'Write a solid business plan and learn how to raise capital.',
        [
          makeLesson(
            'Writing a Business Plan',
            'A business plan is your roadmap. Learn how to write each section: executive summary, company description, ' +
            'market analysis, organisation, product line, marketing, and financial projections.\n\n' +
            '### Business Plan Sections:\n' +
            '1. **Executive Summary** — One-page overview\n' +
            '2. **Company Description** — What you do and why\n' +
            '3. **Market Analysis** — Who are your customers and competitors?\n' +
            '4. **Marketing Strategy** — How will you reach customers?\n' +
            '5. **Financial Projections** — Revenue, costs, profitability',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Raising Capital in Africa',
            'From bootstrapping to venture capital — understand the fundraising landscape in Africa. ' +
            'Learn about angel investors, VC firms, government grants, bank loans, and alternative financing.\n\n' +
            '### Funding Sources in Africa:\n' +
            '- **Bootstrapping** — Self-fund from revenue\n' +
            '- **Angel investors** — High-net-worth individuals\n' +
            '- **Venture capital** — For high-growth startups\n' +
            '- **Government grants** — Youth and women in business programs\n' +
            '- **Microfinance** — Small business loans',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=ZEMbKzy7FD8', videoTitle: 'Entrepreneurship 101 - Business Plan Basics' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review business planning concepts.',
            [
              {
                question: 'Which section of a business plan comes first?',
                options: ['Financial Projections', 'Executive Summary', 'Market Analysis', 'Marketing Strategy'],
                correctIndex: 1,
                explanation: 'The executive summary is the first section and provides an overview of the entire plan.',
              },
              {
                question: 'What is bootstrapping?',
                options: ['Getting a bank loan', 'Self-funding your business from revenue', 'Raising VC money', 'Applying for grants'],
                correctIndex: 1,
                explanation: 'Bootstrapping means funding your business using your own resources and revenue.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Business Plan Project',
            'Create a complete business plan for your business idea.',
            'Write a mini business plan for your chosen business idea. Include the executive summary, market analysis, and financial projections.',
            [
              {
                question: 'Write the executive summary for your business idea (200-300 words).',
                type: 'open',
                explanation: 'Cover: the problem, your solution, target market, business model, and why you will succeed.',
                points: 20,
              },
              {
                question: 'Create simple financial projections for your first year of operation (estimated revenue and costs).',
                type: 'open',
                explanation: 'Include: startup costs, monthly operating costs, projected revenue, and break-even timeline.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Write a complete business plan and identify funding sources.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 5: Professional English Communication
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Professional English for Rwandan Professionals',
    description:
      ' English is the language of business in East Africa. This course helps Rwandan professionals ' +
      'write professional emails, give confident presentations, participate in meetings, ' +
      'and communicate with international partners. With examples from Rwandan workplaces — ' +
      'government, NGOs, tech companies, and tourism — you will speak and write with confidence.',
    category: 'Languages',
    level: 'Beginner',
    price: 2000,
    searchImage: 'english learning education books professional',
    modules: [
      makeModule(
        'Module 1: Business Writing Essentials',
        'Master professional writing for emails, reports, and proposals.',
        [
          makeLesson(
            'Writing Professional Emails',
            'Email is the most common form of business communication. Learn proper email structure, tone, ' +
            'salutations, and common phrases for different situations — requests, follow-ups, complaints, and proposals.\n\n' +
            '### Email Structure:\n' +
            '1. **Subject line** — Clear and specific\n' +
            '2. **Salutation** — Dear [Name],\n' +
            '3. **Body** — Purpose, context, action needed\n' +
            '4. **Closing** — Best regards, Sincerely,\n' +
            '5. **Signature** — Your name, title, contact',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=VjkCp0MkpS4', videoTitle: 'Effective Communication - Quick Tips' },
          ),
          makeLesson(
            'Common Business Vocabulary & Phrases',
            'Build your professional vocabulary with commonly used business terms, phrases for meetings, ' +
            'negotiations, and presentations. Learn the difference between formal and informal language.\n\n' +
            '### Useful Phrases:\n' +
            '- "Following up on our conversation..."\n' +
            '- "I would like to propose..."\n' +
            '- "Could you please clarify..."\n' +
            '- "I appreciate your prompt response"\n' +
            '- "Looking forward to hearing from you"',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your business writing skills.',
            [
              {
                question: 'What should a professional email subject line be?',
                options: ['Funny and creative', 'Clear and specific', 'As short as one word', 'In ALL CAPS'],
                correctIndex: 1,
                explanation: 'A clear, specific subject line helps the recipient understand the emails purpose immediately.',
              },
              {
                question: 'Which is the most appropriate salutation for a formal business email?',
                options: ['Hey!', 'Dear Mr. Musoni,', 'Yo!', 'Hi there,'],
                correctIndex: 1,
                explanation: '"Dear [Title] [Last Name]," is the standard formal business salutation.',
              },
            ],
            3,
          ),
        ],
        'Write clear, professional business emails.',
      ),
      makeModule(
        'Module 2: Speaking & Presentation Skills',
        'Build confidence in spoken English for professional settings.',
        [
          makeLesson(
            'Public Speaking & Presentations',
            'Learn how to structure and deliver confident presentations in English. Covers opening hooks, ' +
            'logical flow, visual aids, handling Q&A, and overcoming nervousness.\n\n' +
            '### Presentation Structure:\n' +
            '1. **Opening** — Hook + introduction\n' +
            '2. **Agenda** — What you will cover\n' +
            '3. **Body** — 3 main points with evidence\n' +
            '4. **Conclusion** — Summary + call to action\n' +
            '5. **Q&A** — Handle questions confidently',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=NYnn2JRiZtg', videoTitle: 'Business English - Never Run Out of Things' },
          ),
          makeLesson(
            'Meeting Etiquette & Participation',
            'Learn how to participate effectively in English-language meetings. How to interrupt politely, ' +
            'ask for clarification, express opinions, agree and disagree professionally, and summarize action items.\n\n' +
            '### Meeting Phrases:\n' +
            '- "If I may add something..."\n' +
            '- "Could you elaborate on that point?"\n' +
            '- "I see your point, however..."\n' +
            '- "Just to clarify, our next steps are..."',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review speaking and presentation skills.',
            [
              {
                question: 'What is the best way to open a professional presentation?',
                options: ['Apologise for being nervous', 'Start with a hook or interesting fact', 'Read directly from slides', 'Start with a joke'],
                correctIndex: 1,
                explanation: 'A strong hook — statistic, question, or story — grabs the audiences attention immediately.',
              },
              {
                question: 'How can you politely ask for clarification in a meeting?',
                options: ['Say "What?"', 'Say "Could you please elaborate on that?"', 'Stay silent', 'Interrupt loudly'],
                correctIndex: 1,
                explanation: '"Could you please elaborate?" is a polite and professional way to ask for clarification.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final English Assessment',
            'Demonstrate your professional English skills.',
            'Complete the following exercises to demonstrate your business English proficiency.',
            [
              {
                question: 'Write a professional email to a potential client introducing your services. Include a clear subject line, professional salutation, body, and closing.',
                type: 'open',
                explanation: 'Use the email structure from Module 1. Keep it concise and professional.',
                points: 20,
              },
              {
                question: 'Describe a business presentation you would give. What is your topic, your three main points, and how would you conclude?',
                type: 'open',
                explanation: 'Use the presentation structure: hook, agenda, 3 points, conclusion with call to action.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Deliver confident presentations and participate effectively in meetings.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 6: AgriTech & Smart Farming
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Smart Farming in Rwanda: AgriTech for Modern Farmers',
    description:
      ' Agriculture drives Rwanda economy — and technology is making it smarter. This course shows you ' +
      'how to use mobile apps, IoT sensors, drone monitoring, and digital marketplaces ' +
      'to increase yields, reduce waste, and access better markets. Real Rwandan cases: ' +
      'Twigire Muhinzi, Smart Nkunganire, and platforms linking farmers to buyers across Rwanda.',
    category: 'Technology',
    level: 'Beginner',
    price: 2000,
    searchImage: 'agriculture technology farming smart africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Technology in African Agriculture',
        'Understand the current state of agriculture in Africa and how technology is driving change.',
        [
          makeLesson(
            'The State of Agriculture in Africa',
            'Agriculture contributes 35% to Africas GDP and employs the majority of the workforce. Yet, productivity ' +
            'lags behind other regions due to climate change, lack of access to information, and inefficient supply chains. ' +
            'This lesson sets the context for why AgriTech is crucial for Africas future.\n\n' +
            '### Key Challenges:\n' +
            '- Climate change affecting growing seasons\n' +
            '- Limited access to market information\n' +
            '- Post-harvest losses of up to 40%\n' +
            '- Limited access to credit for smallholder farmers',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=4TXPHN9hh9A', videoTitle: 'Smart Farms - Future of Agriculture in 3 Min' },
          ),
          makeLesson(
            'Introduction to AgriTech Solutions',
            'Explore the range of technology solutions transforming agriculture: precision farming, IoT sensors, ' +
            'drone monitoring, blockchain for traceability, mobile marketplaces, and agricultural fintech.\n\n' +
            '### AgriTech Categories:\n' +
            '1. **Farm Management** — IoT sensors, weather data, crop monitoring\n' +
            '2. **Market Access** — Mobile platforms connecting farmers to buyers\n' +
            '3. **Financial Services** — Crop insurance, digital loans for inputs\n' +
            '4. **Supply Chain** — Traceability, cold chain monitoring, logistics',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of AgriTech fundamentals.',
            [
              {
                question: 'What percentage of post-harvest produce is lost in Africa due to supply chain issues?',
                options: ['10%', 'Up to 40%', '5%', '60%'],
                correctIndex: 1,
                explanation: 'Post-harvest losses in Africa can reach up to 40% due to inefficient supply chains.',
              },
              {
                question: 'Which technology is used for crop health monitoring from above?',
                options: ['Blockchain', 'Drones', 'USSD codes', 'Mobile apps only'],
                correctIndex: 1,
                explanation: 'Drones equipped with cameras and sensors can monitor crop health across large areas.',
              },
            ],
            3,
          ),
        ],
        'Explain the role of technology in modern African agriculture.',
      ),
      makeModule(
        'Module 2: Building AgriTech Solutions',
        'Learn how to design and implement AgriTech solutions for real-world problems.',
        [
          makeLesson(
            'Data-Driven Farming',
            'Learn how weather data, soil sensors, satellite imagery, and machine learning are helping farmers ' +
            'make better decisions about planting, irrigation, fertilisation, and harvesting.\n\n' +
            '### Data Sources:\n' +
            '- **Satellite imagery** — Crop health (NDVI), moisture levels\n' +
            '- **Weather stations** — Localised forecasts\n' +
            '- **Soil sensors** — pH, moisture, nutrients\n' +
            '- **Market data** — Real-time prices for better selling decisions',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'AgriFintech: Financial Services for Farmers',
            'Access to finance is the biggest barrier for smallholder farmers. Learn how mobile-based insurance, ' +
            'input financing, and savings groups are being digitised to serve agricultural communities.\n\n' +
            '### AgriFintech Products:\n' +
            '- **Crop insurance** — Weather-indexed insurance via mobile\n' +
            '- **Input financing** — Loans for seeds, fertiliser, equipment\n' +
            '- **Savings groups** — Digital village savings and loan groups\n' +
            '- **Payment platforms** — Mobile money for agricultural transactions',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=XUX3sMYcvoo', videoTitle: 'The Smart Farm of the Future - Quick Explainer' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review AgriTech concepts.',
            [
              {
                question: 'What is weather-indexed crop insurance?',
                options: [
                  'Insurance that pays based on actual crop yield',
                  'Insurance that automatically pays when weather conditions trigger a payout',
                  'Insurance for weather stations',
                  'A type of health insurance for farmers',
                ],
                correctIndex: 1,
                explanation: 'Weather-indexed insurance pays out automatically when specific weather conditions (e.g., drought) are met.',
              },
              {
                question: 'Which of these is NOT an AgriTech solution?',
                options: ['Drone crop monitoring', 'Mobile money for farm payments', 'Social media app', 'IoT soil sensors'],
                correctIndex: 2,
                explanation: 'General social media is not specifically an AgriTech solution, though it may be used for marketing.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: AgriTech Innovation Project',
            'Design a technology solution for an agricultural problem.',
            'Design an AgriTech solution that addresses a real challenge faced by farmers in your region.',
            [
              {
                question: 'Describe an agricultural problem in your community and a technology solution that could solve it.',
                type: 'open',
                explanation: 'Consider: market access, weather information, crop diseases, irrigation, or financing.',
                points: 25,
              },
              {
                question: 'How would your solution reach rural farmers who may not have smartphones?',
                type: 'open',
                explanation: 'Consider USSD, SMS, voice-based systems, or agent networks that work without internet.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Design a basic AgriTech solution for a real agricultural problem.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 7: Content Creation & Social Media Mastery
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Create & Earn: Content Creation for Rwandan Youth',
    description:
      ' Rwandan creators are gaining global audiences — and making money. This course shows you how ' +
      'to create engaging content for TikTok, Instagram, YouTube, and LinkedIn using just your phone. ' +
      'Learn video editing with free apps, storytelling, growing your audience, and making money ' +
      'through brand deals, digital products, and affiliate marketing. Start creating today!',
    category: 'Business',
    level: 'Beginner',
    price: 2000,
    searchImage: 'content creation social media video production',
    modules: [
      makeModule(
        'Module 1: Foundations of Content Creation',
        'Learn the basics of creating compelling content for social media platforms.',
        [
          makeLesson(
            'Finding Your Content Niche',
            'The most successful creators focus on a specific niche. This lesson helps you identify your ' +
            'passion, expertise, and audience — and how to position yourself as a go-to creator in your field.\n\n' +
            '### Finding Your Niche:\n' +
            '1. What are you passionate about?\n' +
            '2. What knowledge do you have that others need?\n' +
            '3. What content is already popular in your market?\n' +
            '4. Where is there a gap you can fill?',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=GtYhNtRNRls', videoTitle: '5 Easy Content Creation Tips - Short Guide' },
          ),
          makeLesson(
            'Smartphone Content Production',
            'You do not need expensive gear to create great content. Learn how to use your smartphone to ' +
            'shoot high-quality videos, record clear audio, and create professional-looking content on a budget.\n\n' +
            '### Smartphone Kit:\n' +
            '- **Smartphone** — Any modern phone works\n' +
            '- **Tripod** — Inexpensive phone tripod ($15-30)\n' +
            '- **Lavalier mic** — Clip-on microphone ($20)\n' +
            '- **Ring light** — Even lighting ($25)\n' +
            '- **Natural light** — Best and free!',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your content creation fundamentals.',
            [
              {
                question: 'What is the most important factor in choosing a content niche?',
                options: ['It makes the most money', 'It aligns with your passion and expertise', 'It has the most competition', 'It requires no effort'],
                correctIndex: 1,
                explanation: 'Choosing a niche you are passionate about ensures long-term consistency and authenticity.',
              },
              {
                question: 'What is the minimum equipment needed to start creating content?',
                options: ['Professional camera and studio', 'Just a smartphone', '$10,000 budget', 'A full production team'],
                correctIndex: 1,
                explanation: 'A modern smartphone is sufficient to start creating quality content today.',
              },
            ],
            3,
          ),
        ],
        'Identify your content niche and produce basic content with a smartphone.',
      ),
      makeModule(
        'Module 2: Growing & Monetising Your Audience',
        'Learn strategies to grow your audience and turn content into income.',
        [
          makeLesson(
            'Platform-Specific Growth Strategies',
            'Each social media platform has its own algorithm and best practices. Learn how to optimise ' +
            'for YouTube, TikTok, Instagram Reels, and LinkedIn to maximise your reach.\n\n' +
            '### Platform Tips:\n' +
            '- **YouTube** — SEO-friendly titles, thumbnails, and descriptions\n' +
            '- **TikTok** — Trending sounds, hooks in first 3 seconds\n' +
            '- **Instagram** — Reels for reach, Stories for engagement\n' +
            '- **LinkedIn** — Educational content, industry insights',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Monetisation Strategies for African Creators',
            'From YouTube ad revenue and brand sponsorships to digital products and affiliate marketing — ' +
            'learn how African creators can make money from content. Includes payment platforms and tax considerations.\n\n' +
            '### Monetisation Methods:\n' +
            '1. **Ad revenue** — YouTube Partner Programme\n' +
            '2. **Brand deals** — Sponsorships with companies\n' +
            '3. **Digital products** — E-books, templates, courses\n' +
            '4. **Affiliate marketing** — Commission from product sales\n' +
            '5. **Crowdfunding** — Patreon, Buy Me a Coffee',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=8ZsQIa-LBIQ', videoTitle: 'Make Short Form Content Go Viral - Quick Tips' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review audience growth and monetisation strategies.',
            [
              {
                question: 'Which platform is best for long-form educational content?',
                options: ['TikTok', 'YouTube', 'Instagram', 'Snapchat'],
                correctIndex: 1,
                explanation: 'YouTube is the best platform for long-form educational content with its search-friendly algorithm.',
              },
              {
                question: 'What is affiliate marketing?',
                options: ['Selling your own products', 'Earning commission by promoting other peoples products', 'Running ads', 'Getting sponsored by brands'],
                correctIndex: 1,
                explanation: 'Affiliate marketing means earning a commission when someone buys through your referral link.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Content Strategy Project',
            'Create a complete content strategy and sample content.',
            'Plan a content strategy for a niche of your choice and create a sample content piece.',
            [
              {
                question: 'Outline a one-month content calendar for your chosen niche. Include 8 content ideas with platform, format, and key message for each.',
                type: 'open',
                explanation: 'Mix content types: educational, entertaining, behind-the-scenes, and promotional.',
                points: 25,
              },
              {
                question: 'Which monetisation strategy would work best for your content and why?',
                type: 'open',
                explanation: 'Consider your audience size, niche, and platform. Multiple streams are ideal.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Grow an engaged audience and implement at least one monetisation strategy.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 8: Project Management Fundamentals
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Project Management for Rwandan Professionals',
    description:
      ' Every organisation in Rwanda needs skilled project managers — from govt to NGOs to startups. ' +
      'Learn to plan, execute, and deliver projects using international standards (PMP, PRINCE2) ' +
      'adapted for the Rwandan context. Master Agile, Scrum, risk management, budgeting, ' +
      'and stakeholder communication. Boost your career with these in-demand skills.',
    category: 'Business',
    level: 'Intermediate',
    price: 2000,
    searchImage: 'project management planning team collaboration',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Project Management Foundations',
        'Understand the core concepts, methodologies, and tools of project management.',
        [
          makeLesson(
            'What is Project Management?',
            'Projects are temporary endeavours to create a unique product, service, or result. Unlike ongoing operations, ' +
            'projects have a defined start and end. This lesson covers the definition of a project, the role of a project ' +
            'manager, and the triple constraint: scope, time, and cost.\n\n' +
            '### Key Concepts:\n' +
            '- **Project** — Temporary, unique, progressive elaboration\n' +
            '- **Operations** — Ongoing, repetitive, maintaining the business\n' +
            '- **Triple Constraint** — Scope, Time, Cost — change one, the others adjust\n' +
            '- **Stakeholders** — Anyone affected by the project',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=ojpTDcdm0vQ', videoTitle: 'Scrum 101 - Agile Fundamentals in 3 Min' },
          ),
          makeLesson(
            'Project Lifecycle & Methodologies',
            'Every project goes through phases: Initiation, Planning, Execution, Monitoring & Control, and Closure. ' +
            'Learn about different methodologies — Waterfall vs Agile — and when to use each.\n\n' +
            '### Methodologies:\n' +
            '- **Waterfall** — Sequential phases, good for well-defined projects\n' +
            '- **Agile** — Iterative cycles, good for evolving requirements\n' +
            '- **Scrum** — Sprints, daily standups, product owner, scrum master\n' +
            '- **Kanban** — Visual workflow, continuous delivery',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your project management fundamentals.',
            [
              {
                question: 'What are the three elements of the triple constraint?',
                options: ['People, Process, Technology', 'Scope, Time, Cost', 'Quality, Risk, Resources', 'Planning, Execution, Closure'],
                correctIndex: 1,
                explanation: 'The triple constraint consists of scope, time, and cost — change one and the others are affected.',
              },
              {
                question: 'Which methodology is best for projects with evolving requirements?',
                options: ['Waterfall', 'Agile', 'Both are equally good', 'Neither'],
                correctIndex: 1,
                explanation: 'Agile is designed for projects where requirements may change during development.',
              },
            ],
            3,
          ),
        ],
        'Define a project and select the appropriate methodology.',
      ),
      makeModule(
        'Module 2: Planning, Execution & Tools',
        'Master project planning, risk management, and popular project management tools.',
        [
          makeLesson(
            'Creating a Project Plan',
            'A project plan is your roadmap. Learn to define scope, create a work breakdown structure (WBS), ' +
            'estimate time and costs, develop a schedule (Gantt chart), and assign resources.\n\n' +
            '### Planning Steps:\n' +
            '1. **Scope statement** — What is included and excluded\n' +
            '2. **WBS** — Break work into manageable pieces\n' +
            '3. **Schedule** — Sequence activities, estimate durations\n' +
            '4. **Budget** — Estimate costs, plan contingencies\n' +
            '5. **Risk register** — Identify, assess, and plan responses',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Risk Management & Communication',
            'Every project has risks. Learn how to identify, assess, and mitigate risks. Also covers stakeholder ' +
            'communication — who needs what information, when, and how.\n\n' +
            '### Risk Management Process:\n' +
            '1. **Identify risks** — What could go wrong?\n' +
            '2. **Assess impact & probability** — How likely? How bad?\n' +
            '3. **Plan responses** — Avoid, mitigate, transfer, accept\n' +
            '4. **Monitor** — Track and update throughout the project',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=o8FCGYJtsMY', videoTitle: 'How to Use Agile and Scrum - Quick Summary' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review planning and risk management concepts.',
            [
              {
                question: 'What does WBS stand for in project management?',
                options: ['Work Breakdown Structure', 'Weekly Business Summary', 'Work Budget Schedule', 'Whole Business System'],
                correctIndex: 0,
                explanation: 'A Work Breakdown Structure breaks a project into smaller, manageable components.',
              },
              {
                question: 'What are the four risk response strategies?',
                options: ['Start, Stop, Continue, Change', 'Avoid, Mitigate, Transfer, Accept', 'Plan, Do, Check, Act', 'High, Medium, Low, None'],
                correctIndex: 1,
                explanation: 'The four risk response strategies are Avoid, Mitigate, Transfer, and Accept.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Project Plan Assignment',
            'Create a complete project plan for a real or hypothetical project.',
            'Develop a project plan including scope, WBS, schedule, budget, and risk register.',
            [
              {
                question: 'Choose a project and create a Work Breakdown Structure with at least 8 tasks across 3 levels.',
                type: 'open',
                explanation: 'Example: Organising a community event — Level 1: Event, Level 2: Venue, Marketing, Logistics, etc.',
                points: 20,
              },
              {
                question: 'Identify three potential risks for your project and describe your response strategy for each.',
                type: 'open',
                explanation: 'Use the four strategies: avoid, mitigate, transfer, or accept for each risk.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Create a complete project plan with scope, schedule, budget, and risk management.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 9: Personal Finance & Investment for Africans
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Build Wealth: Personal Finance & Investing in Rwanda',
    description:
      ' Make your money work for you — with Rwandan investment options. Learn to budget, save, ' +
      'and invest using SACCOs, the Rwanda Stock Exchange, treasury bills, mutual funds, ' +
      'and real estate. Designed for Rwandans who want to build wealth and achieve financial freedom. ' +
      'No finance background needed — practical examples from the Rwandan market.',
    category: 'Business',
    level: 'Beginner',
    price: 2000,
    searchImage: 'personal finance investment savings africa',
    modules: [
      makeModule(
        'Module 1: Financial Foundations',
        'Build a strong foundation for managing your personal finances.',
        [
          makeLesson(
            'Understanding Your Money Mindset',
            'Your relationship with money affects every financial decision you make. This lesson explores ' +
            'different money mindsets, how your upbringing and culture shape your financial habits, and how ' +
            'to develop a wealth-building mindset.\n\n' +
            '### Money Mindsets:\n' +
            '- **Scarcity mindset** — Money is limited, fear-based decisions\n' +
            '- **Abundance mindset** — Opportunities exist, strategic decisions\n' +
            '- **Wealth-building mindset** — Focus on assets, long-term thinking',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Iq72X8V64hQ', videoTitle: 'Investing Explained in Under 5 Minutes' },
          ),
          makeLesson(
            'Budgeting & Saving',
            'Learn practical budgeting methods — 50/30/20 rule, zero-based budgeting, envelope system — ' +
            'and saving strategies that work even on a modest income. Includes tools and apps available in Africa.\n\n' +
            '### Budgeting Methods:\n' +
            '- **50/30/20** — 50% needs, 30% wants, 20% savings\n' +
            '- **Zero-based** — Every dollar has a job\n' +
            '- **Envelope system** — Cash for each category\n\n' +
            '### Saving Tools:\n' +
            '- Mobile money savings pockets\n' +
            '- SACCOs (Savings and Credit Cooperatives)\n' +
            '- Automated transfers to savings account',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your financial foundations.',
            [
              {
                question: 'What percentage of income should go to savings according to the 50/30/20 rule?',
                options: ['10%', '20%', '30%', '50%'],
                correctIndex: 1,
                explanation: 'The 50/30/20 rule allocates 20% of income to savings and debt repayment.',
              },
              {
                question: 'What is a SACCO?',
                options: ['A type of bank account', 'A Savings and Credit Cooperative', 'A stock exchange', 'An insurance company'],
                correctIndex: 1,
                explanation: 'A SACCO is a member-owned financial cooperative that provides savings and credit services.',
              },
            ],
            3,
          ),
        ],
        'Create a personal budget and implement a saving strategy.',
      ),
      makeModule(
        'Module 2: Investing for Wealth Building',
        'Learn how to grow your wealth through different investment vehicles available in Africa.',
        [
          makeLesson(
            'Introduction to Investing',
            'Investing is putting your money to work so it grows over time. Learn the difference between ' +
            'saving and investing, understand risk and return, and explore the power of compound interest.\n\n' +
            '### Investment Basics:\n' +
            '- **Risk vs Return** — Higher potential returns come with higher risk\n' +
            '- **Compound interest** — The 8th wonder of the world\n' +
            '- **Diversification** — Do not put all eggs in one basket\n' +
            '- **Time horizon** — Longer time = more risk capacity',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Investment Options in Africa',
            'Explore the investment options available to African investors — from treasury bills and bonds ' +
            'to stocks, mutual funds, real estate, and alternative investments like farming or SACCOs.\n\n' +
            '### Investment Options:\n' +
            '1. **Treasury Bills** — Low risk, short term (91-364 days)\n' +
            '2. **Money Market Funds** — Low risk, liquid\n' +
            '3. **Stock Market** — Medium risk, long term (RSE, NSE, USE)\n' +
            '4. **Real Estate** — Medium-high risk, long term\n' +
            '5. **Mutual Funds** — Professionally managed, diversified',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=bfENsVP77VQ', videoTitle: 'Beginner Investing - The Only Guide You Need' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review investment concepts.',
            [
              {
                question: 'What is the relationship between risk and return in investing?',
                options: ['Higher risk = guaranteed losses', 'Higher potential return = higher risk', 'No relationship', 'Lower risk = higher return'],
                correctIndex: 1,
                explanation: 'Higher potential returns are associated with higher risk — there is no free lunch in investing.',
              },
              {
                question: 'Which investment is considered lowest risk?',
                options: ['Stock market', 'Treasury bills', 'Real estate', 'Cryptocurrency'],
                correctIndex: 1,
                explanation: 'Treasury bills are backed by the government and considered the safest investment.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Personal Financial Plan',
            'Create your personal financial plan.',
            'Develop a complete personal financial plan including budget, savings goal, and investment strategy.',
            [
              {
                question: 'Create a monthly budget using the 50/30/20 rule. List your income, needs (50%), wants (30%), and savings (20%).',
                type: 'open',
                explanation: 'Be realistic about your expenses. The goal is awareness, not perfection.',
                points: 20,
              },
              {
                question: 'Design an investment plan for the next 12 months. How much will you invest, in what vehicles, and what is your goal?',
                type: 'open',
                explanation: 'Consider: emergency fund first, then T-bills or money market for short term, stocks for long term.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Create a personalised investment plan and start building wealth.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 10: AI & Automation for Beginners
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'AI for Rwandans: How to Use ChatGPT & Automation',
    description:
      ' AI is changing how Rwandans work — and you can use it too, no coding needed. This course shows ' +
      'you how to use ChatGPT, AI writing tools, and automation platforms to save hours every week. ' +
      'Learn to write better emails, create content, analyse data, automate repetitive tasks, ' +
      'and boost your productivity. Real examples for Rwandan professionals and entrepreneurs.',
    category: 'Data & AI',
    level: 'Beginner',
    price: 2000,
    searchImage: 'artificial intelligence ai technology future',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Understanding Artificial Intelligence',
        'Learn what AI is, how it works, and why it matters for Africa.',
        [
          makeLesson(
            'What is AI and Why It Matters for Africa',
            'Artificial Intelligence is the ability of machines to perform tasks that normally require human ' +
            'intelligence. From chatbots to self-driving cars, AI is reshaping the world. This lesson explains ' +
            'AI concepts in plain language and explores why Africa must embrace AI for economic transformation.\n\n' +
            '### Why AI Matters for Africa:\n' +
            '- **Leapfrogging** — Skip traditional development stages\n' +
            '- **Productivity** — Automate routine tasks\n' +
            '- **Healthcare** — AI-powered diagnosis where doctors are scarce\n' +
            '- **Agriculture** — Crop disease detection, weather prediction\n' +
            '- **Financial inclusion** — AI credit scoring for the unbanked',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=UdE-W30oOXo', videoTitle: 'AI Explained in 2 Minutes - Simple Guide' },
          ),
          makeLesson(
            'Types of AI: From ChatGPT to Self-Driving Cars',
            'Explore the different types of AI — narrow AI vs general AI, machine learning, deep learning, ' +
            'natural language processing, computer vision, and generative AI. Real-world examples from African contexts.\n\n' +
            '### AI Categories:\n' +
            '1. **Narrow AI** — Designed for specific tasks (ChatGPT, facial recognition)\n' +
            '2. **Generative AI** — Creates new content (text, images, music)\n' +
            '3. **Machine Learning** — Learns from data without explicit programming\n' +
            '4. **Computer Vision** — Sees and interprets images\n' +
            '5. **Natural Language Processing** — Understands and generates human language',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of AI fundamentals.',
            [
              {
                question: 'What is Narrow AI?',
                options: [
                  'AI that is better than humans at everything',
                  'AI designed for specific tasks only',
                  'AI that runs on small devices',
                  'The first version of AI',
                ],
                correctIndex: 1,
                explanation: 'Narrow AI is designed and trained for specific tasks, like ChatGPT for conversation or facial recognition.',
              },
              {
                question: 'Which AI technology enables computers to understand and respond to human language?',
                options: ['Computer Vision', 'Natural Language Processing', 'Robotics', 'Expert Systems'],
                correctIndex: 1,
                explanation: 'Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language.',
              },
            ],
            3,
          ),
        ],
        'Explain what AI is and identify opportunities for AI in African contexts.',
      ),
      makeModule(
        'Module 2: Using AI Tools & Automation',
        'Get hands-on with popular AI tools and learn to automate everyday tasks.',
        [
          makeLesson(
            'Getting Started with ChatGPT & AI Assistants',
            'Learn how to use ChatGPT, Claude, and other AI assistants effectively. Master prompt engineering — ' +
            'the art of asking the right questions to get the best results from AI.\n\n' +
            '### Prompt Engineering Tips:\n' +
            '1. **Be specific** — "Write a professional email" vs "Write an email"\n' +
            '2. **Provide context** — Give background information\n' +
            '3. **Specify format** — "Bullet points", "Table", "3 paragraphs"\n' +
            '4. **Iterate** — Refine your prompts based on results\n' +
            '5. **Role-play** — "Act as a career coach..."',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=rM-Fk2UNfDA', videoTitle: 'What is AI in Simple Words - Quick Short' },
          ),
          makeLesson(
            'Automation: Working Smarter, Not Harder',
            'Learn how automation tools can save you hours every week. Covers email automation, social media ' +
            'scheduling, document generation, data entry automation, and no-code workflow tools.\n\n' +
            '### Automation Tools:\n' +
            '- **Zapier / Make** — Connect apps and automate workflows\n' +
            '- **IFTTT** — Simple if-this-then-that automations\n' +
            '- **Google Apps Script** — Automate Google Workspace\n' +
            '- **ChatGPT plugins** — AI-powered task automation',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review AI tools and automation concepts.',
            [
              {
                question: 'What is prompt engineering?',
                options: [
                  'Building physical AI hardware',
                  'The skill of writing effective prompts to get desired AI outputs',
                  'Engineering software for robots',
                  'Creating AI training data',
                ],
                correctIndex: 1,
                explanation: 'Prompt engineering is the practice of crafting inputs to get the best possible outputs from AI models.',
              },
              {
                question: 'Which tool connects different apps to automate workflows?',
                options: ['ChatGPT', 'Zapier', 'VS Code', 'Figma'],
                correctIndex: 1,
                explanation: 'Zapier (and Make) connect apps together to create automated workflows without coding.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: AI in Action Project',
            'Apply AI tools to solve a real problem.',
            'Use an AI tool (like ChatGPT) to complete a real task, then document your process and results.',
            [
              {
                question: 'Describe a task you automated using an AI tool. What was the task, which tool did you use, and what was the result?',
                type: 'open',
                explanation: 'Example: Drafting emails, creating social media posts, summarising articles, or generating ideas.',
                points: 20,
              },
              {
                question: 'What are three ethical considerations when using AI?',
                type: 'open',
                explanation: 'Consider: bias in AI, privacy concerns, job displacement, misinformation, and responsible use.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Use AI tools effectively and automate routine tasks to boost productivity.',
      ),
    ],
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seedMVPCourses() {
  try {
    await connectDB();
    console.log(' Connected to MongoDB\n');

    if (!HAS_PEXELS_KEY) {
      console.warn('  No Pexels API key found (PEXELS_API_KEY or VITE_PEXELS_API_KEY)');
      console.warn('   Will use curated Unsplash fallback images instead.');
      console.warn('   For best results, add your Pexels API key to the .env file.\n');
    }

    // ─── Find the admin user ──────────────────────────────────────────────
    const admin = await User.findOne({ email: 'admin@bootskills.com' });
    if (!admin) {
      console.error(' Admin user not found (admin@bootskills.com). Seed users first.');
      process.exit(1);
    }
    console.log(` Found admin: ${admin.fullName} (${admin.email})\n`);

    let created = 0;
    let skipped = 0;
    let imageFailures = 0;

    for (let i = 0; i < COURSES.length; i++) {
      const cd = COURSES[i];
      const num = i + 1;

      console.log(`\n─── Course ${num}/10: "${cd.title}" ───`);

      // Check if already exists
      const existing = await Course.findOne({ title: cd.title });
      if (existing) {
        console.log(`   ⏭  Skipping — already exists (ID: ${existing._id})`);
        skipped++;
        continue;
      }

      // Fetch illustration from API (Pexels illustration search)
      console.log(`    Searching for image: "${cd.searchImage}"...`);
      let thumbnailUrl = '';
      try {
        thumbnailUrl = await getCourseIllustrationUrl(cd.searchImage);
        if (thumbnailUrl) {
          // Verify the image URL
          const valid = await verifyImageUrl(thumbnailUrl);
          if (valid) {
            console.log(`    Image found: ${thumbnailUrl.slice(0, 80)}...`);
          } else {
            console.warn(`     Image URL not accessible, but will use it as fallback`);
            imageFailures++;
          }
        }
      } catch (err: any) {
        console.warn(`     Image fetch failed: ${err.message}`);
        // Use a relevant Unsplash fallback
        const fallbackQueries: Record<string, string> = {
          'digital marketing': 'photo-1557838923-2985c318be48',
          'mobile money': 'photo-1556742049-0cfed4f6a45d',
          'remote work': 'photo-1506126613408-eca07ce68773',
          'entrepreneurship': 'photo-1559136555-9303baea8ebd',
          'english learning': 'photo-1503676260728-1c00da094a0b',
          'agriculture technology': 'photo-1581092335879-cdbe1fc0af53',
          'content creation': 'photo-1492691527719-9d1e07e534b4',
          'project management': 'photo-1512758017271-d7b84c2113f1',
          'personal finance': 'photo-1565514020179-026b5b2be64a',
          'artificial intelligence': 'photo-1485827404703-89b55fcc595e',
        };
        let fallbackId = 'photo-1517248135467-4c7edcad34c4'; // generic education
        for (const [key, id] of Object.entries(fallbackQueries)) {
          if (cd.searchImage.toLowerCase().includes(key)) {
            fallbackId = id;
            break;
          }
        }
        thumbnailUrl = `https://images.unsplash.com/${fallbackId}?auto=format&fit=crop&q=80&w=800`;
        console.log(`    Using curated Unsplash fallback image`);
      }

      // Build the course document
      const courseDoc = {
        title: cd.title,
        description: cd.description,
        category: cd.category,
        level: cd.level,
        price: cd.price,
        discountPrice: cd.discountPrice || 0,
        thumbnail: thumbnailUrl,
        instructor: admin._id,
        createdBy: admin._id,
        status: 'published' as const,
        enrollmentMode: 'direct' as const,
        school: cd.school || 'BootSkills Academy',
        isFeatured: cd.isFeatured || false,
        passingScore: 70,
        modules: cd.modules.map((m) => ({
          ...m,
          // Ensure all nested lessons use proper schema types
          lessons: m.lessons.map((l: any) => ({
            ...l,
            type: l.type || 'article',
          })),
        })),
      };

      // Create the course
      const course = await new Course(courseDoc).save();
      console.log(`    Created course: "${course.title}"`);
      console.log(`      Price: ${course.price.toLocaleString()} RWF${(course.discountPrice ?? 0) > 0 ? ` (was ${(course.discountPrice ?? 0).toLocaleString()} RWF)` : ''}`);
      console.log(`      Category: ${course.category} | Level: ${course.level}`);
      console.log(`      Modules: ${course.modules.length}`);
      const totalLessons = course.modules.reduce(
        (sum: number, m: any) => sum + (m.lessons?.length || 0),
        0,
      );
      console.log(`      Lessons: ${totalLessons}`);
      created++;
    }

    // ─── Summary ──────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log(' MVP COURSES SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`    Created:  ${created} new course(s)`);
    console.log(`   ⏭  Skipped:  ${skipped} existing course(s)`);
    console.log(`     Images:   ${imageFailures} image verification warnings`);
    console.log(`   Total:     ${COURSES.length} courses configured`);
    console.log('═'.repeat(60));

    // Print pricing summary
    console.log('\n PRICING SUMMARY:');
    console.log('─'.repeat(50));
    for (const cd of COURSES) {
      const finalPrice = cd.discountPrice || cd.price;
      const originalPrice = cd.price;
      const hasDiscount = (cd.discountPrice ?? 0) > 0 && (cd.discountPrice ?? 0) < cd.price;
      console.log(
        `   ${cd.title.padEnd(45)} ${hasDiscount ? `${originalPrice.toLocaleString()} → ` : ''}${finalPrice.toLocaleString()} RWF`,
      );
    }
    console.log('─'.repeat(50));

    // Print image summary
    console.log('\n  IMAGE SUMMARY:');
    console.log('─'.repeat(50));
    const allCourses = await Course.find({ title: { $in: COURSES.map((c) => c.title) } });
    for (const course of allCourses) {
      const hasImage = !!course.thumbnail;
      console.log(`   ${hasImage ? '' : ''} ${course.title.padEnd(45)} ${course.thumbnail?.slice(0, 60) || 'No image'}`);
    }
    console.log('─'.repeat(50));

    console.log('\n SEED COMPLETE — MVP courses ready for sale!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n Error seeding courses:', error);
    process.exit(1);
  }
}

seedMVPCourses();
