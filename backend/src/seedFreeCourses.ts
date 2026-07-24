/**
 * 🌱 SEED: 5 Free Foundation Courses
 *
 * Creates 5 completely free (0 RWF) courses covering essential skills
 * for users who cannot pay. These courses provide real value and serve
 * as an entry point to the platform.
 *
 * Each course includes 2 modules with lessons, quizzes, and assignments.
 *
 * Usage: cd backend && npx tsx src/seedFreeCourses.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

// ─── Helper Functions ───────────────────────────────────────────────────────

function makeLesson(title: string, content: string, type: string = 'article', order: number = 1, extras: Record<string, any> = {}) {
  const imgUrl = extras.imageUrl;
  const imgMd = imgUrl ? `\n\n![${title}](${imgUrl})` : '';
  return {
    title,
    content: `## ${title}\n\n${content}${imgMd}`,
    type,
    duration: type === 'video' ? 8 : type === 'quiz' ? 5 : type === 'assignment' ? 10 : 10,
    order,
    ...extras,
  };
}

function makeQuizLesson(title: string, content: string, questions: any[], order: number, timeLimit: number = 5) {
  return makeLesson(title, content, 'quiz', order, {
    quizConfig: { disableRightClick: false, timeLimit, quizType: 'exercise', questionsPerPage: 5 },
    quizQuestions: questions.map((q) => ({
      questionText: q.question,
      type: q.type || 'multiple_choice',
      options: q.options || [],
      correctOptionIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
    })),
  });
}

function makeAssignmentLesson(title: string, content: string, description: string, questions: any[], order: number, timeLimit: number = 10) {
  return makeLesson(title, content, 'assignment', order, {
    isAssignment: true,
    requiredAssignment: true,
    assignmentDescription: description,
    assignmentConfig: { timeLimit, allowRetakes: true, disableRightClick: false, mode: 'exam' },
    assignmentQuestions: questions.map((q) => ({
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
    actionPlan: outcome ? `Complete this module to achieve: ${outcome}` : '',
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
  modules: ReturnType<typeof makeModule>[];
  isFeatured?: boolean;
  school?: string;
}

const COURSES: CourseDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // FREE COURSE 1: Computer Basics
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Computer Basics: Using a Computer & Smartphone',
    description:
      '💻 Never used a computer before? No problem. This free course teaches you how to use a computer and smartphone ' +
      'for everyday tasks — typing, using email, browsing the internet, and staying safe online. ' +
      'Perfect for absolute beginners in Rwanda who want to gain basic digital skills for free.',
    category: 'Technology',
    level: 'Beginner',
    price: 0,
    isFeatured: false,
    modules: [
      makeModule(
        'Module 1: Getting Started with Computers',
        'Learn the basics of using a computer — turning it on, using a mouse, and opening programs.',
        [
          makeLesson(
            'What is a Computer? Parts of a Computer',
            'A computer is an electronic device that processes information. The main parts include:\\n\\n' +
            '### Hardware (Physical Parts):\\n' +
            '- **Monitor/Screen** — Shows you what you are doing\\n' +
            '- **Keyboard** — For typing letters, numbers, and commands\\n' +
            '- **Mouse** — For clicking and selecting items on screen\\n' +
            '- **CPU (Central Processing Unit)** — The brain of the computer\\n' +
            '- **Speakers** — For hearing sound and music\\n' +
            '- **Printer** — For printing documents and photos\\n\\n' +
            '### Software (Programs):\\n' +
            '- **Operating System** — Windows (most common) or macOS (Apple)\\n' +
            '- **Web Browser** — Chrome, Firefox, Safari — for browsing the internet\\n' +
            '- **Word Processor** — Microsoft Word or Google Docs — for writing documents\\n' +
            '- **Email** — Gmail, Outlook — for sending and receiving messages\\n\\n' +
            '### Smartphone vs Computer:\\n' +
            '- A smartphone is a small, portable computer\\n' +
            '- Instead of a mouse, you touch the screen\\n' +
            '- Instead of a keyboard, you type on the screen\\n' +
            '- Smartphones use Android (Samsung, Tecno, Infinix) or iOS (Apple iPhone)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=y2kg3MOk1sY', videoTitle: 'Computer Basics - Getting Started' },
          ),
          makeLesson(
            'Using a Mouse, Keyboard & Touchscreen',
            '### Using a Mouse:\\n' +
            '- **Left click** — Select or open something (tap once)\\n' +
            '- **Right click** — Show options menu (tap once)\\n' +
            '- **Double click** — Open a program or file (tap twice quickly)\\n' +
            '- **Drag** — Hold left button and move mouse to move items\\n\\n' +
            '### Using a Keyboard:\\n' +
            '- **Letters** — A to Z, same as typing on paper\\n' +
            '- **Space bar** — Long key at bottom, makes space between words\\n' +
            '- **Enter** — Moves to next line or confirms a command\\n' +
            '- **Shift** — Hold and press a letter to make it CAPITAL\\n' +
            '- **Backspace** — Deletes the letter before the cursor\\n' +
            '- **Numbers** — Top row, or use number pad on right side\\n\\n' +
            '### Using a Touchscreen (Smartphone/Tablet):\\n' +
            '- **Tap** — Touch screen once to open or select\\n' +
            '- **Swipe** — Move finger across screen to scroll\\n' +
            '- **Pinch** — Two fingers together to zoom out\\n' +
            '- **Spread** — Two fingers apart to zoom in\\n' +
            '- **Long press** — Hold finger down for more options',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of computer basics.',
            [
              { question: 'What is the main function of a mouse?', options: ['Type letters', 'Click and select items on screen', 'Print documents', 'Play sound'], correctIndex: 1, explanation: 'A mouse is used to click, select, and interact with items on the computer screen.' },
              { question: 'Which key deletes the letter before the cursor?', options: ['Delete', 'Backspace', 'Space', 'Enter'], correctIndex: 1, explanation: 'Backspace deletes the character to the left of the cursor.' },
              { question: 'What does double-clicking do?', options: ['Nothing', 'Opens a program or file', 'Closes the program', 'Types a letter'], correctIndex: 1, explanation: 'Double-clicking quickly opens a program, file, or folder.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Basic Skills Practice',
            'Practice your computer skills.',
            'Complete these exercises to demonstrate your basic computer skills.',
            [
              { question: 'Describe step-by-step how you would open a web browser (like Chrome) on a computer. List each click and action.', type: 'open', explanation: 'Start from turning on the computer to having the browser open.', points: 10 },
              { question: 'Practice typing your name, your village/town, and one sentence about yourself. Write what you typed.', type: 'open', explanation: 'Use a keyboard to practice typing.', points: 10 },
            ],
            4,
          ),
        ],
        'Turn on a computer, use a mouse and keyboard, and open programs.',
      ),
      makeModule(
        'Module 2: Using the Internet & Staying Safe',
        'Learn to browse the internet, use email, and stay safe online.',
        [
          makeLesson(
            'Browsing the Internet & Using Google',
            'The internet is a global network connecting computers worldwide. You can find information, watch videos, send messages, and shop online.\\n\\n' +
            '### How to Browse the Internet:\\n' +
            '1. Open a web browser (Chrome, Firefox, Safari)\\n' +
            '2. In the address bar at the top, type a website address (e.g., google.com)\\n' +
            '3. Press Enter on your keyboard\\n' +
            '4. The website will load on your screen\\n\\n' +
            '### Using Google Search:\\n' +
            '1. Go to google.com\\n' +
            '2. Type what you want to find (e.g., "Rwanda news" or "how to cook rice")\\n' +
            '3. Press Enter or click "Google Search"\\n' +
            '4. Click on any blue link to visit that page\\n\\n' +
            '### Popular Websites:\\n' +
            '- **Google** — Search for anything\\n' +
            '- **YouTube** — Watch videos\\n' +
            '- **Facebook** — Connect with friends\\n' +
            '- **igihe.com** — Rwanda news in Kinyarwanda\\n' +
            '- **rba.co.rw** — Rwanda Broadcasting Agency',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=00hbchgXK8E', videoTitle: 'How to Use the Internet - Beginners Guide' },
          ),
          makeLesson(
            'Staying Safe Online',
            'The internet is wonderful, but there are people who may try to trick you. Follow these safety rules.\\n\\n' +
            '### Internet Safety Rules:\\n' +
            '1. **Never share your passwords** — Not with friends, not with anyone claiming to be from MTN/Airtel\\n' +
            '2. **Never share your MoMo PIN** — No legitimate company will ask for this\\n' +
            '3. **If it sounds too good to be true, it is a scam** — "You won a phone!" "Send 10,000 get 100,000!"\\n' +
            '4. **Do not click suspicious links** — Even if sent by a friend (their account may be hacked)\\n' +
            '5. **Log out on shared computers** — At internet cafes, always log out\\n' +
            '6. **Use strong passwords** — Mix uppercase, lowercase, numbers, symbols — at least 8 characters\\n\\n' +
            '### Examples of Scams:\\n' +
            '- "Congratulations! You won 5,000,000 RWF! Click here to claim." — This is a SCAM\\n' +
            '- Someone calls pretending to be from your bank asking for your PIN — Hang up!\\n' +
            '- "Send 50,000 RWF to get 500,000 RWF back tomorrow" — This is a SCAM\\n\\n' +
            'If something seems suspicious, ask a trusted friend or family member before taking any action.',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your internet safety knowledge.',
            [
              { question: 'What should you do if someone calls asking for your MoMo PIN?', options: ['Give them the PIN', 'Hang up — it is a scam', 'Ask them to call back later', 'Send them money'], correctIndex: 1, explanation: 'No legitimate company will ever ask for your MoMo PIN. Hang up immediately.' },
              { question: 'What makes a strong password?', options: ['Your phone number', 'Your name', 'Mix of uppercase, lowercase, numbers, and symbols', 'The word "password"'], correctIndex: 2, explanation: 'A strong password uses a combination of different character types and is at least 8 characters long.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Internet Skills Practice',
            'Practice using the internet safely.',
            'Complete these exercises to show you can browse the internet safely.',
            [
              { question: 'Use Google to find one news article about Rwanda from this week. Write the title of the article and the website where you found it.', type: 'open', explanation: 'Practice searching on Google and finding reliable information.', points: 10 },
              { question: 'List three internet safety rules you will follow from now on. Explain why each one is important.', type: 'open', explanation: 'Show that you understand how to stay safe online.', points: 10 },
            ],
            5,
          ),
        ],
        'Browse the internet safely and know how to avoid common online scams.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FREE COURSE 2: Entrepreneurship Mindset
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Introduction to Entrepreneurship: Start Any Business',
    description:
      '🚀 Ever wanted to start your own business but did not know where to start? This free course ' +
      'teaches you the entrepreneurship mindset — how to identify business opportunities, create a ' +
      'simple business plan, find customers, and start selling. No capital required to begin! ' +
      'Perfect for Rwandan youth who want to become entrepreneurs.',
    category: 'Business',
    level: 'Beginner',
    price: 0,
    isFeatured: false,
    modules: [
      makeModule(
        'Module 1: The Entrepreneur Mindset',
        'Learn what it takes to think like an entrepreneur and identify business opportunities.',
        [
          makeLesson(
            'What is an Entrepreneur?',
            'An entrepreneur is someone who sees a problem and creates a solution that people will pay for. ' +
            'You do not need a lot of money to be an entrepreneur. Many successful businesses started with zero capital.\\n\\n' +
            '### Characteristics of Successful Entrepreneurs:\\n' +
            '- **Problem solver** — They see problems as opportunities\\n' +
            '- **Action taker** — They start before they feel ready\\n' +
            '- **Resilient** — They keep trying when things go wrong\\n' +
            '- **Customer focused** — They listen to what people need\\n' +
            '- **Resourceful** — They make the most of what they have\\n\\n' +
            '### Famous Entrepreneurs Who Started with Nothing:\\n' +
            '- **Mama C** — Started a small food stall in Kigali, now owns multiple restaurants\\n' +
            '- **Local phone charger vendor** — Started charging phones for 100 RWF, now has an electronics shop\\n' +
            '- **Hairdresser** — Started with one pair of scissors, now owns a salon with 5 employees\\n\\n' +
            '> 💡 You already have what it takes to start. The only thing missing is action!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=TuwAqnO1reQ', videoTitle: 'What is Entrepreneurship - 3 Min Guide' },
          ),
          makeLesson(
            'Finding Business Ideas with No Money',
            'You do not need capital to start a business. Many successful businesses started with zero money.\\n\\n' +
            '### Low-Cost Business Ideas in Rwanda:\\n' +
            '1. **Mobile Money Agent** — Help people deposit/withdraw MoMo, earn commission\\n' +
            '2. **Phone Charging Service** — Charge phones for 200-500 RWF each\\n' +
            '3. **Cleaning Service** — Clean homes and offices for 10,000-20,000 RWF\\n' +
            '4. **Reselling** — Buy products from Kimironko, sell in your neighborhood for profit\\n' +
            '5. **Tutoring** — Teach English, math, or computer skills to children\\n' +
            '6. **Farming** — Grow vegetables in your backyard, sell at the market\\n' +
            '7. **Handicrafts** — Make baskets, jewelry, or art using local materials\\n\\n' +
            '### How to Choose Your Business Idea:\\n' +
            'Ask yourself:\\n' +
            '- What skills do I already have?\\n' +
            '- What do people in my community need?\\n' +
            '- What can I start doing TODAY with what I have?\\n' +
            '- Is there someone willing to pay for this?',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your entrepreneurship knowledge.',
            [
              { question: 'What is an entrepreneur?', options: ['Someone with a lot of money', 'Someone who solves problems and creates solutions people pay for', 'Someone who works for the government', 'Someone who inherited a business'], correctIndex: 1, explanation: 'An entrepreneur identifies problems and creates solutions that people are willing to pay for.' },
              { question: 'Do you need a lot of money to start a business?', options: ['Yes, millions of RWF', 'No, many businesses start with zero capital', 'Only if you want a shop', 'Yes, at least 1 million RWF'], correctIndex: 1, explanation: 'Many successful businesses started with zero capital using skills and resourcefulness.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Find Your Business Idea',
            'Identify a business opportunity in your community.',
            'Think about problems in your community that you could solve.',
            [
              { question: 'List 3 problems you see in your community (e.g., no place to charge phones, hard to find fresh vegetables, no tutoring for children). For each problem, suggest a possible business solution.', type: 'open', explanation: 'Think about what people complain about or what is difficult to find.', points: 15 },
              { question: 'Choose ONE business idea from above. Write down: what you will sell, who will buy it, what you need to start, and how much money you could make in the first month.', type: 'open', explanation: 'Be specific about your idea and how you will start with little or no money.', points: 15 },
            ],
            4,
          ),
        ],
        'Identify business opportunities in your community that you can start with little or no money.',
      ),
      makeModule(
        'Module 2: Starting & Growing Your Business',
        'Learn the practical steps to start and grow your small business.',
        [
          makeLesson(
            'Simple Business Plan in One Page',
            'You do not need a complicated business plan. A one-page plan is enough to get started.\\n\\n' +
            '### Your One-Page Business Plan:\\n' +
            '1. **What are you selling?** — Product or service description\\n' +
            '2. **Who will buy it?** — Your target customers\\n' +
            '3. **How much will you charge?** — Your price\\n' +
            '4. **How will you find customers?** — Marketing plan\\n' +
            '5. **How much will it cost?** — Your expenses\\n' +
            '6. **How much will you earn?** — Your revenue projection\\n\\n' +
            '### Example: Phone Charging Business\\n' +
            '- **Product**: Phone charging service\\n' +
            '- **Customers**: People in my neighborhood without electricity\\n' +
            '- **Price**: 300 RWF per phone\\n' +
            '- **Marketing**: Tell neighbors, put a sign outside my home\\n' +
            '- **Costs**: Extension cable (5,000 RWF), multiplug (3,000 RWF)\\n' +
            '- **Earnings**: 10 phones/day × 300 RWF × 30 days = 90,000 RWF/month',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Finding Your First Customers',
            'Your first customers are the most important. They will tell others about your business.\\n\\n' +
            '### How to Find Customers for Free:\\n' +
            '1. **Tell your family and friends** — Word of mouth is the best marketing\\n' +
            '2. **Use WhatsApp** — Share your business on your status and in groups\\n' +
            '3. **Put up a sign** — A simple handwritten sign outside your home or at the market\\n' +
            '4. **Visit customers** — Go to where your customers are (market, bus stop, school)\\n' +
            '5. **Offer a sample** — Let people try your product or service for free first\\n' +
            '6. **Ask for referrals** — "If you like my service, tell your friends!"\\n\\n' +
            '### Customer Service Tips:\\n' +
            '- Always smile and greet customers\\n' +
            '- Deliver what you promise, on time\\n' +
            '- Thank customers and ask them to come back\\n' +
            '- Handle complaints politely — offer a solution',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=EXYvLGl5SCM', videoTitle: 'How to Find Your First Customers - Free Marketing' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your knowledge of starting and growing a business.',
            [
              { question: 'What is the most affordable way to find your first customers?', options: ['TV advertising', 'Word of mouth and WhatsApp', 'Billboards', 'Radio ads'], correctIndex: 1, explanation: 'Word of mouth and WhatsApp are free and effective ways to find customers.' },
              { question: 'What is the most important thing in customer service?', options: ['Being the cheapest', 'Delivering what you promise on time', 'Having an expensive shop', 'Yelling to attract customers'], correctIndex: 1, explanation: 'Reliability and delivering what you promise builds trust and repeat business.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Start Your Business',
            'Take action and start a small business.',
            'Use what you have learned to start a real micro-business.',
            [
              { question: 'Write your one-page business plan using the template from Lesson 1. Be specific about what you are selling, who will buy it, your price, and how much you can earn.', type: 'open', explanation: 'Use the 6-part template from the lesson.', points: 15 },
              { question: 'Take one real action toward starting your business. Examples: tell 5 people about your business idea, buy your initial supplies, or make your first sale. Describe what you did and what happened.', type: 'open', explanation: 'Take action! Describe what you actually did and the result.', points: 20 },
            ],
            4,
          ),
        ],
        'Create a simple business plan and find your first customers.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FREE COURSE 3: CV Writing & Job Interview Skills
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'CV Writing & Job Interview Skills: Get Hired in Rwanda',
    description:
      '📄 Looking for a job in Rwanda? This free course teaches you how to write a professional CV ' +
      'that employers will notice, write cover letters that get interviews, and ace your job interview. ' +
      'Whether you are a fresh graduate or looking to change careers, these skills will help you ' +
      'stand out in the Rwandan job market.',
    category: 'Personal Development',
    level: 'Beginner',
    price: 0,
    isFeatured: false,
    modules: [
      makeModule(
        'Module 1: Writing a Professional CV',
        'Learn to write a CV that gets noticed by employers in Rwanda.',
        [
          makeLesson(
            'What is a CV and Why Does It Matter?',
            'A CV (Curriculum Vitae) is a document that summarizes your education, work experience, and skills. ' +
            'It is the first thing an employer sees, so it must make a good impression.\\n\\n' +
            '### What Employers Look For:\\n' +
            '1. **Relevant experience** — Have you done this type of work before?\\n' +
            '2. **Education** — Do you have the required qualifications?\\n' +
            '3. **Skills** — Do you have the skills needed for the job?\\n' +
            '4. **Professionalism** — Is the CV well-organized and error-free?\\n' +
            '5. **Achievements** — What have you accomplished?\\n\\n' +
            '### CV Sections:\\n' +
            '1. **Personal Information** — Name, phone number, email, location\\n' +
            '2. **Professional Summary** — 2-3 sentences about who you are\\n' +
            '3. **Work Experience** — Jobs you have had, with bullet points of achievements\\n' +
            '4. **Education** — Schools attended, certificates earned\\n' +
            '5. **Skills** — Languages, computer skills, other relevant abilities\\n' +
            '6. **References** — People who can vouch for you (optional for entry-level)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Sna8qnGUcVA', videoTitle: 'How to Write a CV - Beginners Guide' },
          ),
          makeLesson(
            'CV Template & Tips for Rwanda',
            '### CV Template:\\n\\n' +
            '[YOUR FULL NAME]\\n' +
            'Phone: 078X XXX XXX | Email: yourname@gmail.com | Kigali, Rwanda\\n\\n' +
            '**PROFESSIONAL SUMMARY**\\n' +
            'Motivated and hardworking [your field] graduate with skills in [key skills]. ' +
            'Looking to contribute to [company name] and grow as a professional.\\n\\n' +
            '**WORK EXPERIENCE**\\n' +
            '[Job Title] | [Company Name] | [Start Date] - [End Date]\\n' +
            '- Achieved [specific result] by doing [specific action]\\n' +
            '- Developed [skill] through [project/task]\\n' +
            '- Collaborated with team to [accomplishment]\\n\\n' +
            '**EDUCATION**\\n' +
            '[Degree/Diploma] in [Field] | [School Name] | [Year]\\n' +
            'Relevant coursework: [list 2-3 relevant subjects]\\n\\n' +
            '**SKILLS**\\n' +
            '- Languages: English (fluent), Kinyarwanda (native), French (basic)\\n' +
            '- Computer: Microsoft Word, Excel, Google Drive, internet research\\n' +
            '- Other: Communication, teamwork, problem-solving\\n\\n' +
            '### Tips for Rwandan Job Seekers:\\n' +
            '- Keep your CV to ONE page if you have less than 5 years experience\\n' +
            '- Use a professional email address (not "partygirl123@gmail.com")\\n' +
            '- List your phone number with the correct code (+250)\\n' +
            '- Save your CV as PDF so formatting does not change\\n' +
            '- Customize your CV for each job application',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1586282391129-76a6df230234?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your CV writing knowledge.',
            [
              { question: 'How many pages should a CV be for someone with less than 5 years experience?', options: ['3 pages', '1 page', 'As long as possible', 'Half a page'], correctIndex: 1, explanation: 'A CV should be one page for early-career professionals.' },
              { question: 'Which email address is professional?', options: ['john.doe@gmail.com', 'coolguy123@yahoo.com', 'partygirl@hotmail.com', 'bigboss@gmail.com'], correctIndex: 0, explanation: 'Use your real name in your email address for a professional impression.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Create Your CV',
            'Write your own professional CV.',
            'Create a CV using the template and tips from this module.',
            [
              { question: 'Write your complete CV using the template provided. Include: personal info, professional summary, work experience (if any), education, skills, and references.', type: 'open', explanation: 'Follow the template structure from Lesson 2.', points: 20 },
              { question: 'List 3 things you can do to customize this CV for a specific job you are interested in.', type: 'open', explanation: 'Show that you understand how to tailor a CV for different jobs.', points: 10 },
            ],
            4,
          ),
        ],
        'Write a professional CV that gets noticed by employers.',
      ),
      makeModule(
        'Module 2: Job Interviews & Getting Hired',
        'Learn how to prepare for and ace job interviews in Rwanda.',
        [
          makeLesson(
            'How to Prepare for a Job Interview',
            'Preparation is the key to interview success. Follow these steps before every interview.\\n\\n' +
            '### Before the Interview:\\n' +
            '1. **Research the company** — What do they do? Who are their customers?\\n' +
            '2. **Review your CV** — Be ready to talk about everything on your CV\\n' +
            '3. **Prepare answers** — Practice common interview questions\\n' +
            '4. **Plan your outfit** — Dress professionally (smart casual or formal)\\n' +
            '5. **Plan your route** — Arrive 15 minutes early\\n' +
            '6. **Bring documents** — Extra copies of your CV, certificates, ID\\n\\n' +
            '### Common Interview Questions in Rwanda:\\n' +
            '1. "Tell us about yourself." — Give a brief summary of your education and experience\\n' +
            '2. "Why do you want this job?" — Show you researched the company\\n' +
            '3. "What are your strengths?" — Mention skills relevant to the job\\n' +
            '4. "What are your weaknesses?" — Be honest but show improvement\\n' +
            '5. "Where do you see yourself in 5 years?" — Show ambition and growth\\n' +
            '6. "Do you have any questions?" — Always ask at least one question!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=HG68Ymzo18A', videoTitle: 'Job Interview Tips - How to Prepare' },
          ),
          makeLesson(
            'Interview Day Tips & Follow-Up',
            '### On Interview Day:\\n' +
            '- Arrive 15 minutes early\\n' +
            '- Greet everyone politely — receptionist, security guard, interviewer\\n' +
            '- Shake hands firmly and smile\\n' +
            '- Sit up straight, make eye contact, listen carefully\\n' +
            '- Take a moment to think before answering questions\\n' +
            '- Thank the interviewer at the end\\n\\n' +
            '### After the Interview:\\n' +
            '- Send a thank-you email or message within 24 hours\\n' +
            '- If you do not hear back in one week, follow up politely\\n' +
            '- If you are not selected, ask for feedback — it will help you improve\\n' +
            '- Keep applying — the right job will come!\\n\\n' +
            '### Where to Find Jobs in Rwanda:\\n' +
            '- **LinkedIn** — Create a profile, connect with recruiters\\n' +
            '- **Indeed Rwanda** — indeed.rw\\n' +
            '- **Kazi Jobs** — kazi.co.rw\\n' +
            '- **Government jobs** — irembo.gov.rw\\n' +
            '- **Newspapers** — The New Times, Izuba Rirashe\\n' +
            '- **Word of mouth** — Tell everyone you are looking!',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your interview preparation knowledge.',
            [
              { question: 'How early should you arrive for a job interview?', options: ['Exactly on time', '15 minutes early', '30 minutes late', 'Whenever you want'], correctIndex: 1, explanation: 'Arriving 15 minutes early shows you are punctual and prepared.' },
              { question: 'What should you do after a job interview?', options: ['Wait and do nothing', 'Send a thank-you message within 24 hours', 'Call the interviewer every day', 'Post about it on social media'], correctIndex: 1, explanation: 'A thank-you message shows professionalism and gratitude.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Interview Preparation',
            'Prepare for a real job interview.',
            'Practice your interview skills and apply for a job.',
            [
              { question: 'Write answers to 3 common interview questions: "Tell us about yourself," "What are your strengths?" and "Why should we hire you?"', type: 'open', explanation: 'Write complete answers as if you are speaking in an interview.', points: 15 },
              { question: 'Find one real job opening in Rwanda (on LinkedIn, Indeed, Kazi, or newspaper). Write down the job title, company, requirements, and why you are a good fit.', type: 'open', explanation: 'Practice researching and targeting your applications.', points: 15 },
            ],
            4,
          ),
        ],
        'Prepare for and succeed in job interviews.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FREE COURSE 4: Personal Finance Basics
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Personal Finance Basics: Manage Your Money Wisely',
    description:
      '💰 Take control of your money with this free personal finance course. Learn how to create a ' +
      'budget, save money even with a small income, avoid debt traps, and plan for your future. ' +
      'Perfect for Rwandans who want to make the most of their money and build financial security.',
    category: 'Business',
    level: 'Beginner',
    price: 0,
    isFeatured: false,
    modules: [
      makeModule(
        'Module 1: Budgeting & Saving',
        'Learn to track your money, create a budget, and save for your goals.',
        [
          makeLesson(
            'Creating Your First Budget',
            'A budget is a plan for your money. It helps you control spending and save for what matters.\\n\\n' +
            '### How to Create a Budget:\\n' +
            '1. **Write down your income** — How much money do you receive each month? (salary, business, help from family)\\n' +
            '2. **List all expenses** — What do you spend money on? (food, transport, rent, airtime)\\n' +
            '3. **Subtract expenses from income** — If positive, you can save! If negative, you need to cut spending\\n' +
            '4. **Set savings goals** — Decide what you are saving for (school fees, business, emergency)\\n\\n' +
            '### Simple Budget Template:\\n' +
            '| Category | Planned Amount | Actual Spent | Difference |\\n' +
            '|---|---|---|---|\\n' +
            '| Income | 100,000 RWF | 100,000 RWF | 0 |\\n' +
            '| Food | 30,000 RWF | 32,000 RWF | -2,000 |\\n' +
            '| Transport | 15,000 RWF | 15,000 RWF | 0 |\\n' +
            '| Airtime/Data | 10,000 RWF | 8,000 RWF | +2,000 |\\n' +
            '| Rent | 20,000 RWF | 20,000 RWF | 0 |\\n' +
            '| Savings | 25,000 RWF | 25,000 RWF | 0 |\\n' +
            '| **Total** | **100,000 RWF** | **100,000 RWF** | **0** |\\n\\n' +
            '### 50/30/20 Rule:\\n' +
            '- **50%** for needs (food, rent, transport, bills)\\n' +
            '- **30%** for wants (entertainment, eating out, new clothes)\\n' +
            '- **20%** for savings and debt repayment',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=htSXJPgq0FA', videoTitle: 'How to Budget Your Money - Simple Guide' },
          ),
          makeLesson(
            'How to Save Money on a Small Income',
            'Even with a small income, you can save. It is not about how much you earn — it is about how much you keep.\\n\\n' +
            '### Practical Saving Tips:\\n' +
            '1. **Pay yourself first** — Save before you spend. Put money aside as soon as you receive income\\n' +
            '2. **Save 500 RWF per day** — 500 RWF/day = 15,000 RWF/month = 180,000 RWF/year!\\n' +
            '3. **Use a SACCO** — Join a local savings cooperative to build discipline\\n' +
            '4. **Cook at home** — Eating out costs 2-3x more than cooking\\n' +
            '5. **Buy in bulk** — Rice, beans, soap — buy larger quantities for lower per-unit cost\\n' +
            '6. **Walk instead of motorbike** — Save 2,000-5,000 RWF per day\\n' +
            '7. **Use MoMo savings** — MTN MoMo has a savings feature with interest!\\n\\n' +
            '### Saving Challenge:\\n' +
            'Try this 30-day challenge:\\n' +
            '- Week 1: Save 200 RWF every day = 1,400 RWF\\n' +
            '- Week 2: Save 300 RWF every day = 2,100 RWF\\n' +
            '- Week 3: Save 400 RWF every day = 2,800 RWF\\n' +
            '- Week 4: Save 500 RWF every day = 3,500 RWF\\n' +
            'Total saved in 30 days: 9,800 RWF!',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your budgeting and saving knowledge.',
            [
              { question: 'What is the 50/30/20 budget rule?', options: ['50% needs, 30% wants, 20% savings', '50% food, 30% transport, 20% rent', '50% savings, 30% needs, 20% wants', '50% wants, 30% needs, 20% savings'], correctIndex: 0, explanation: 'The 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings.' },
              { question: 'What does "pay yourself first" mean?', options: ['Give yourself a salary', 'Save money before spending on anything else', 'Pay yourself before paying others', 'Never spend money on others'], correctIndex: 1, explanation: 'Pay yourself first means setting aside savings as soon as you receive income.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Create Your Budget',
            'Create a personal budget for this month.',
            'Track your income and expenses and create a budget.',
            [
              { question: 'Create a monthly budget using the template from Lesson 1. List your income and all expenses. Show how much you can save each month.', type: 'open', explanation: 'Be honest and include all expenses. Aim to save at least 10% of your income.', points: 15 },
              { question: 'List 3 specific ways you will reduce your expenses this month. Estimate how much money each change will save.', type: 'open', explanation: 'Example: "Cook at home 5 days/week instead of eating out — save 15,000 RWF/month"', points: 10 },
            ],
            4,
          ),
        ],
        'Create a personal budget and start saving money every month.',
      ),
      makeModule(
        'Module 2: Avoiding Debt & Building Wealth',
        'Learn to avoid dangerous debt and build long-term wealth.',
        [
          makeLesson(
            'Good Debt vs Bad Debt',
            'Not all debt is bad. Some debt helps you build wealth, while other debt keeps you poor.\\n\\n' +
            '### Good Debt (Helps You):\\n' +
            '- **Education loan** — Investing in skills that increase your income\\n' +
            '- **Business loan** — Borrowing to start or grow a profitable business\\n' +
            '- **Land/property loan** — Buying assets that increase in value\\n\\n' +
            '### Bad Debt (Hurts You):\\n' +
            '- **Consumer loans for luxury** — Borrowing for clothes, phones, parties\\n' +
            '- **Loan sharks** — Borrowing from people who charge 20-50% interest per month\\n' +
            '- **Betting/gambling** — Never borrow money to gamble\\n' +
            '- **Payday loans** — Borrowing against your salary at high interest\\n\\n' +
            '### How to Avoid Debt Traps in Rwanda:\\n' +
            '- Avoid informal lenders who charge very high interest\\n' +
            '- Before taking a loan, ask: "Will this loan help me earn more money?"\\n' +
            '- If you must borrow, use a SACCO or bank with reasonable interest rates\\n' +
            '- Never borrow more than 30% of your monthly income\\n' +
            '- Always read and understand the loan terms before signing',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Building Wealth Step by Step',
            'Building wealth is a journey, not a destination. Follow these steps in order.\\n\\n' +
            '### Step 1: Emergency Fund\\n' +
            'Save 3-6 months of expenses in case of emergency (job loss, medical emergency).\\n' +
            'Keep this money in a savings account, easily accessible.\\n\\n' +
            '### Step 2: Pay Off Bad Debt\\n' +
            'Focus on paying off high-interest debt first.\\n' +
            'Stop taking new loans for things that lose value.\\n\\n' +
            '### Step 3: Invest in Yourself\\n' +
            'Learn new skills that increase your income.\\n' +
            'Take courses, attend training, read books.\\n' +
            'Your skills are your most valuable asset.\\n\\n' +
            '### Step 4: Start Investing\\n' +
            '- **SACCOs** — Join a SACCO for safe savings with dividends\\n' +
            '- **Land** — Buy and hold land, it appreciates over time\\n' +
            '- **Small business** — Invest in a side business\\n' +
            '- **Livestock** — Goats, cows, chickens can grow your wealth\\n' +
            '- **Stock market** — Rwanda Stock Exchange (RSE) for long-term growth',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=bBkQjqTg1B4', videoTitle: 'How to Build Wealth - Step by Step for Beginners' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your knowledge about debt and wealth building.',
            [
              { question: 'Which is an example of good debt?', options: ['Loan for buying new clothes', 'Education loan that increases your income', 'Loan for a party', 'Borrowing from a loan shark'], correctIndex: 1, explanation: 'Education loans are good debt because they help you earn more in the future.' },
              { question: 'What is the first step in building wealth?', options: ['Buy a car', 'Build an emergency fund', 'Invest in stocks', 'Take a loan'], correctIndex: 1, explanation: 'Building an emergency fund of 3-6 months expenses is the first step toward financial security.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Financial Action Plan',
            'Create a personal financial action plan.',
            'Plan your path to financial security.',
            [
              { question: 'Set three financial goals: one for this month, one for this year, and one for 5 years from now. For each goal, write how much money you need and your plan to achieve it.', type: 'open', explanation: 'Example: "This month: Save 20,000 RWF by cooking at home. This year: Save 500,000 RWF by..."', points: 15 },
              { question: 'If you have any debt, write a plan to pay it off. If you have no debt, write how you will invest your first 100,000 RWF of savings.', type: 'open', explanation: 'Be specific about timelines and amounts.', points: 15 },
            ],
            4,
          ),
        ],
        'Avoid dangerous debt and build long-term wealth step by step.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FREE COURSE 5: Study Skills & Time Management
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Study Skills & Time Management: Learn Anything Faster',
    description:
      '📚 Want to learn faster, remember more, and manage your time better? This free course teaches ' +
      'you proven study techniques, memory skills, and time management strategies used by successful ' +
      'students and professionals. Perfect for Rwandan students preparing for exams or anyone who ' +
      'wants to learn new skills more effectively.',
    category: 'Personal Development',
    level: 'Beginner',
    price: 0,
    isFeatured: false,
    modules: [
      makeModule(
        'Module 1: How to Learn Effectively',
        'Discover how your brain learns and techniques to study smarter, not harder.',
        [
          makeLesson(
            'How Your Brain Learns Best',
            'Understanding how learning works helps you study more effectively.\\n\\n' +
            '### How Memory Works:\\n' +
            '1. **Attention** — You must focus on new information to learn it\\n' +
            '2. **Encoding** — Your brain connects new information to what you already know\\n' +
            '3. **Storage** — Information moves from short-term to long-term memory\\n' +
            '4. **Retrieval** — You recall information when you need it (like during an exam)\\n\\n' +
            '### Study Techniques That Work:\\n' +
            '1. **Active recall** — Test yourself instead of re-reading notes\\n' +
            '2. **Spaced repetition** — Review material at increasing intervals\\n' +
            '3. **Teach someone else** — Explaining helps you understand deeply\\n' +
            '4. **Take breaks** — Study for 25 minutes, break for 5 (Pomodoro Technique)\\n' +
            '5. **Use multiple senses** — Read, write, speak, and listen to learn better\\n\\n' +
            '### The Forgetting Curve:\\n' +
            'You forget 50% of what you learn within 1 hour, and 70% within 24 hours.\\n' +
            'Review within 24 hours to move information to long-term memory!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=5MgBikgcWnY', videoTitle: 'How to Study Effectively - 5 Proven Techniques' },
          ),
          makeLesson(
            'Creating a Study Schedule',
            'A study schedule helps you stay consistent and make progress every day.\\n\\n' +
            '### How to Create a Study Schedule:\\n' +
            '1. **Set specific goals** — "Study 1 hour every evening" not "Study more"\\n' +
            '2. **Choose your best time** — Morning, afternoon, or evening — when are you most focused?\\n' +
            '3. **Start small** — Begin with 20-30 minutes per day, increase gradually\\n' +
            '4. **Remove distractions** — Put phone away, find a quiet place\\n' +
            '5. **Track progress** — Check off days you complete\\n\\n' +
            '### Sample Study Schedule:\\n' +
            '| Time | Activity |\\n' +
            '|---|---|\\n' +
            '| 6:00 AM | Wake up, pray, prepare for the day |\\n' +
            '| 7:00 AM | Study Session 1 (25 min study, 5 min break) |\\n' +
            '| 8:00 AM | Breakfast, get ready |\\n' +
            '| 5:00 PM | Study Session 2 (25 min study, 5 min break) |\\n' +
            '| 7:00 PM | Review what you learned today (10 min) |\\n' +
            '| 9:00 PM | Rest, prepare for tomorrow |\\n\\n' +
            '### Tips for Staying Motivated:\\n' +
            '- Reward yourself after completing study sessions\\n' +
            '- Study with a friend for accountability\\n' +
            '- Remember WHY you are studying (exam, job, skill)\\n' +
            '- Do not skip two days in a row — consistency is key',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your study skills knowledge.',
            [
              { question: 'What is the Pomodoro Technique?', options: ['Study for 25 minutes, break for 5', 'Study for 1 hour, break for 1 hour', 'Study all day without breaks', 'Only study at night'], correctIndex: 0, explanation: 'The Pomodoro Technique involves 25-minute focused study sessions followed by 5-minute breaks.' },
              { question: 'How much do you forget within 24 hours of learning something new?', options: ['10%', '30%', '70%', '100%'], correctIndex: 2, explanation: 'Research shows we forget approximately 70% of new information within 24 hours without review.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Create Your Study Plan',
            'Create a personalized study schedule.',
            'Design a study plan that works for your daily routine.',
            [
              { question: 'Create a weekly study schedule showing what you will study each day and for how long. Include specific times and subjects/topics.', type: 'open', explanation: 'Use the template from Lesson 2, customized for your schedule.', points: 15 },
              { question: 'What is one subject or skill you want to learn? Write down 3 specific techniques from this module that you will use to learn it better.', type: 'open', explanation: 'Example: "I will use active recall by testing myself with flashcards."', points: 10 },
            ],
            4,
          ),
        ],
        'Study more effectively using proven techniques and a personalized schedule.',
      ),
      makeModule(
        'Module 2: Time Management & Productivity',
        'Master your time, beat procrastination, and get more done every day.',
        [
          makeLesson(
            'The Secret to Managing Your Time',
            'Time management is not about doing more — it is about doing what matters most.\\n\\n' +
            '### Time Management Principles:\\n' +
            '1. **Plan your day the night before** — Write down 3 most important tasks\\n' +
            '2. **Do the hardest thing first** — Your energy is highest in the morning\\n' +
            '3. **Single-task** — Focus on ONE thing at a time, not multitasking\\n' +
            '4. **Set deadlines** — Give yourself specific time limits for tasks\\n' +
            '5. **Say no** — Do not take on more than you can handle\\n' +
            '6. **Review your day** — What did you accomplish? What can improve?\\n\\n' +
            '### The Eisenhower Matrix (Priority System):\\n' +
            '| | Urgent | Not Urgent |\\n' +
            '|---|---|---|\\n' +
            '| **Important** | Do immediately (e.g., assignment due tomorrow) | Schedule for later (e.g., study for exam next week) |\\n' +
            '| **Not Important** | Delegate (e.g., run an errand) | Eliminate (e.g., scrolling social media) |\\n\\n' +
            'Use this matrix to decide what to work on each day.',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=iONDebHX9qk', videoTitle: 'Time Management for Students - 5 Tips' },
          ),
          makeLesson(
            'Beating Procrastination',
            'Procrastination is not laziness — it is emotional avoidance. Here is how to beat it.\\n\\n' +
            '### Why We Procrastinate:\\n' +
            '- The task feels overwhelming or difficult\\n' +
            '- We fear failure or imperfection\\n' +
            '- We prefer short-term pleasure over long-term gain\\n\\n' +
            '### How to Beat Procrastination:\\n' +
            '1. **The 2-Minute Rule** — If a task takes less than 2 minutes, do it NOW\\n' +
            '2. **Break it down** — Big tasks feel overwhelming. Break into small steps\\n' +
            '3. **Start with 5 minutes** — Tell yourself "I will just do 5 minutes" — you will likely continue\\n' +
            '4. **Remove distractions** — Put phone in another room, block social media\\n' +
            '5. **Create a deadline** — Tell someone you will finish by a specific time\\n' +
            '6. **Reward yourself** — After completing a task, do something you enjoy\\n\\n' +
            '### Phone Distraction Solutions:\\n' +
            '- Use "Do Not Disturb" mode while studying\\n' +
            '- Delete social media apps during exam periods\\n' +
            '- Keep your phone in another room or bag\\n' +
            '- Use apps like Forest to stay focused',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your time management knowledge.',
            [
              { question: 'What is the 2-Minute Rule?', options: ['Study for 2 minutes only', 'If a task takes less than 2 minutes, do it now', 'Take a 2-minute break every hour', 'Only do 2 tasks per day'], correctIndex: 1, explanation: 'The 2-Minute Rule: if a task takes less than 2 minutes, do it immediately instead of postponing.' },
              { question: 'According to the Eisenhower Matrix, what should you do with important but not urgent tasks?', options: ['Ignore them', 'Schedule them for later', 'Do them immediately', 'Delegate them'], correctIndex: 1, explanation: 'Important but not urgent tasks should be scheduled for later — they are your long-term priorities.' },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Time Management Challenge',
            'Apply time management techniques to your daily life.',
            'Track your time and beat procrastination for one week.',
            [
              { question: 'For the next 3 days, track how you spend your time from morning to night. Write down what you did each hour. Then identify: how much time was productive, how much was wasted, and what you can improve.', type: 'open', explanation: 'Be honest about time spent on social media, TV, or other distractions.', points: 15 },
              { question: 'Choose ONE task you have been procrastinating on. Apply the "start with 5 minutes" technique and do it. Describe the task, how you felt before starting, and what happened after you started.', type: 'open', explanation: 'You will likely find that starting is the hardest part — once you begin, it gets easier!', points: 15 },
            ],
            4,
          ),
        ],
        'Manage your time effectively and overcome procrastination.',
      ),
    ],
  },
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────

async function seedFreeCourses() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB\n');

    const admin = await User.findOne({ role: 'super_admin' }).lean() as any;
    const instructorId = admin?._id || new mongoose.Types.ObjectId();

    let createdCount = 0;
    let skippedCount = 0;

    for (const cd of COURSES) {
      const existing = await Course.findOne({ title: cd.title }).lean() as any;
      if (existing) {
        console.log(`   ⏭️  Skipped (exists): ${cd.title}`);
        skippedCount++;
        continue;
      }

      const courseDoc: Record<string, any> = {
        title: cd.title,
        description: cd.description,
        category: cd.category,
        level: cd.level,
        price: cd.price,
        currency: 'RWF',
        modules: cd.modules,
        modulesCount: cd.modules.length,
        totalLessonsCount: cd.modules.reduce((sum, m) => sum + m.lessons.length, 0),
        instructor: instructorId,
        createdBy: instructorId,
        status: 'published',
        enrollmentMode: 'direct',
        school: 'IHUB ACADEMY',
        isFeatured: cd.isFeatured || false,
        thumbnail: `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&h=500`,
        studentsEnrolled: [],
      };

      await new Course(courseDoc).save();
      console.log(`   ✅ Created (FREE): ${cd.title}`);
      createdCount++;
    }

    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ ${createdCount} FREE courses created`);
    console.log(`   ⏭️  ${skippedCount} courses skipped (already exist)`);
    console.log(`   💰 All priced at: 0 RWF (FREE!)`);
    console.log(`═`.repeat(55));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding free courses:', error);
    process.exit(1);
  }
}

seedFreeCourses();
