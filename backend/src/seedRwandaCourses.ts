/**
 * 🌱 SEED: 3 Rwanda-Specific Courses
 *
 * Adds courses tailored for the Rwandan market:
 *   1. Internet for Beginners — browsing, email, WhatsApp, safety
 *   2. Learn Kinyarwanda — Complete Beginner's Course
 *   3. Kinyarwanda Vocabulary Builder (Inkoranya Magambo) — dictionary skills
 *
 * Usage:
 *    cd backend
 *    npx tsx src/seedRwandaCourses.ts
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
  const imgUrl = extras.imageUrl;
  const imgMd = imgUrl ? `\n\n![${title}](${imgUrl})` : '';
  const phoneTips = type === 'article' || type === 'video' ? `\n\n> 📱 **On a budget smartphone?** Most tools mentioned have free mobile apps. Use Chrome or your phone browser to follow along.\n> 💻 **On a laptop/PC?** Open two browser tabs — one for this lesson, one to practice. Download templates from the resources section.\n> 📶 **Limited data?** Connect at a WiFi hotspot to download lesson materials for offline study.` : '';
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

function makeFinalAssignmentLesson(
  title: string,
  description: string,
  content: string,
  questions: any[],
  order: number,
  timeLimit: number = 60,
) {
  return makeLesson(title, content, 'assignment', order, {
    isAssignment: true,
    requiredAssignment: true,
    isFinalProject: true,
    assignmentDescription: description,
    assignmentConfig: {
      timeLimit,
      allowRetakes: true,
      disableRightClick: false,
      mode: 'exam',
    },
    assignmentQuestions: questions.map((q, i) => ({
      questionText: q.question,
      type: q.type || 'open',
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
  searchImage: string;
  modules: ReturnType<typeof makeModule>[];
  isFeatured?: boolean;
  school?: string;
}

const COURSES: CourseDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 1: Internet for Beginners
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Internet for Beginners: Browse, Email, WhatsApp & Stay Safe',
    description:
      '🌐 Never used the internet before? No problem. This course teaches you everything you need — ' +
      'how to browse websites, search Google, send emails, use WhatsApp, watch YouTube, and stay safe online. ' +
      'All lessons work on both smartphones and computers. Designed for complete beginners in Rwanda.',
    category: 'Technology',
    level: 'Beginner',
    price: 1000,
    searchImage: 'internet basics smartphone beginners africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Getting Online',
        'Learn what the internet is, how to connect, and how to navigate websites.',
        [
          makeLesson(
            'What is the Internet?',
            'The internet is a global network connecting millions of computers and smartphones worldwide. ' +
            'Think of it like a giant library where you can find information, watch videos, send messages, and talk to people anywhere. ' +
            'In Rwanda, you can access the internet using mobile data (MTN, Airtel, Tigo) or WiFi at home, work, or public hotspots.\\n\\n' +
            '### How to Connect:\\n' +
            '- **Mobile data** — Buy data bundles from MTN or Airtel via USSD or app\\n' +
            '- **WiFi** — Connect at home, office, cafes (Kigali has many free WiFi spots)\\n' +
            '- **Public hotspots** — Some bus stations, markets, and libraries offer free WiFi\\n\\n' +
            '### What You Can Do Online:\\n' +
            '- **Browse** — Read news, learn new things, find information\\n' +
            '- **Email** — Send and receive letters instantly\\n' +
            '- **WhatsApp** — Chat and call friends and family for free\\n' +
            '- **YouTube** — Watch videos on any topic\\n' +
            '- **Google** — Search for anything you want to know',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Cu3R5it4cQs', videoTitle: 'Computer Basics - What is the Internet? - 4 Min' },
          ),
          makeLesson(
            'Using a Web Browser and Google Search',
            'A web browser is the app you use to visit websites. Common browsers include Chrome (most popular), Safari (on iPhones), and Firefox. ' +
            'Google is a search engine that helps you find anything on the internet.\\n\\n' +
            '### How to Use Google Search:\\n' +
            '1. Open your browser (Chrome icon looks like a red, green, yellow, blue circle)\\n' +
            '2. Tap on the search bar at the top of the screen\\n' +
            '3. Type what you want to find (e.g., "Rwanda news today" or "how to cook beans")\\n' +
            '4. Tap the blue "Google Search" button\\n' +
            '5. Tap on any result (blue link) to visit that page\\n\\n' +
            '### Popular Websites in Rwanda:\\n' +
            '- **igihe.com** — Local news in Kinyarwanda and English\\n' +
            '- **rba.co.rw** — Rwanda Broadcasting Agency news\\n' +
            '- **youtube.com** — Watch videos on any topic\\n' +
            '- **Online Courses** — Kinyarwanda and other subjects\\n' +
            '- **irs.gov.rw** — Rwanda Revenue Authority services',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of internet basics.',
            [
              {
                question: 'What is a web browser?',
                options: [
                  'A physical store that sells computers',
                  'An app used to visit websites on the internet',
                  'A type of internet cable',
                  'A social media platform',
                ],
                correctIndex: 1,
                explanation: 'A web browser (like Chrome or Safari) is the app you use to visit and view websites.',
              },
              {
                question: 'How can you access the internet on your phone in Rwanda?',
                options: ['Only through WiFi at home', 'Using mobile data from MTN or Airtel', 'Only at internet cafes', 'You cannot access the internet on a phone'],
                correctIndex: 1,
                explanation: 'You can buy mobile data bundles from MTN or Airtel to access the internet on your phone anywhere with network coverage.',
              },
              {
                question: 'Which search engine is most commonly used to find information online?',
                options: ['YouTube', 'Google', 'WhatsApp', 'Instagram'],
                correctIndex: 1,
                explanation: 'Google is the most popular search engine for finding information on the internet.',
              },
            ],
            3,
          ),
        ],
        'Connect to the internet, open a browser, and find information using Google search.',
      ),
      makeModule(
        'Module 2: Email, WhatsApp & Staying Safe',
        'Learn to communicate online with email and WhatsApp, and how to stay safe from scams.',
        [
          makeLesson(
            'Sending and Receiving Emails',
            'Email (electronic mail) lets you send messages to anyone in the world instantly. ' +
            'It is free and works like a digital letter. You need an email address to sign up for most online services.\\n\\n' +
            '### Popular Free Email Services:\\n' +
            '- **Gmail** (Google) — Most popular, easy to use\\n' +
            '- **Yahoo Mail** — Older but still widely used\\n' +
            '- **Outlook** (Microsoft) — Good for professional use\\n\\n' +
            '### How to Send an Email:\\n' +
            '1. Open Gmail app or go to gmail.com\\n' +
            '2. Tap the "Compose" button (usually a + or pencil icon)\\n' +
            '3. Enter the recipients email address in the "To" field\\n' +
            '4. Write a subject (what the email is about)\\n' +
            '5. Type your message in the large box\\n' +
            '6. Tap "Send" (paper plane icon)\\n\\n' +
            '### Creating a Strong Password:\\n' +
            '- Use at least 8 characters\\n' +
            '- Mix uppercase letters, lowercase letters, numbers, and symbols\\n' +
            '- Do NOT use your name, phone number, or "password123"\\n' +
            '- Never share your password with anyone',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Using WhatsApp and Video Calling',
            'WhatsApp is the most popular messaging app in Rwanda. It uses the internet to send messages, make calls, and share photos and videos for free.\\n\\n' +
            '### Getting Started with WhatsApp:\\n' +
            '1. Download WhatsApp from Google Play Store (Android) or App Store (iPhone)\\n' +
            '2. Open the app and verify your phone number\\n' +
            '3. Add a profile photo and your name\\n' +
            '4. Start chatting! Tap the green chat icon to start a new conversation\\n\\n' +
            '### WhatsApp Features:\\n' +
            '- **Text messages** — Send instant messages to anyone\\n' +
            '- **Voice calls** — Call anyone for free using the internet\\n' +
            '- **Video calls** — See the person you are talking to (great for family far away)\\n' +
            '- **Photos and videos** — Share moments instantly\\n' +
            '- **Groups** — Chat with multiple people at once (family group, work group)\\n' +
            '- **Voice notes** — Record and send a voice message instead of typing\\n\\n' +
            '### Pro Tips:\\n' +
            '- Use WiFi for video calls to save mobile data\\n' +
            '- Download photos and videos only on WiFi to avoid using too much data\\n' +
            '- You can backup your chats to Google Drive so you never lose them',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=I3UQktX_KQU', videoTitle: 'WhatsApp for Beginners - Quick Guide' },
          ),
          makeLesson(
            'Internet Safety: Avoiding Scams and Staying Secure',
            'The internet is wonderful but there are bad people who try to trick you. Learn how to spot and avoid common online scams.\\n\\n' +
            '### Common Scams to Watch Out For:\\n' +
            '- **Fake prizes** — "You won a phone! Click here to claim!" (do not click)\\n' +
            '- **Phishing emails** — Emails pretending to be from your bank asking for your password\\n' +
            '- **Fake investment schemes** — "Send 10,000 RWF and get 100,000 RWF back tomorrow!" (this is a scam)\\n' +
            '- **Fake support calls** — Someone calling pretending to be from MTN/Airtel asking for your PIN\\n\\n' +
            '### Safety Rules:\\n' +
            '1. **Never share your password** — Not with anyone, not even "customer service"\\n' +
            '2. **Never share your mobile money PIN** — No legitimate company will ask for this\\n' +
            '3. **If it sounds too good to be true, it is a scam** — Free phones, easy money, lottery wins\\n' +
            '4. **Do not click suspicious links** — Even if sent by a friend (their account may be hacked)\\n' +
            '5. **Log out on shared computers** — At internet cafes, always log out of your accounts\\n' +
            '6. **Use two-factor authentication** — Add an extra layer of security to your accounts',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your knowledge of email, WhatsApp, and internet safety.',
            [
              {
                question: 'What should you do if you receive an email saying you won a prize but need to click a link to claim it?',
                options: [
                  'Click the link immediately',
                  'Forward it to all your friends',
                  'Ignore it — it is likely a scam',
                  'Reply with your personal details',
                ],
                correctIndex: 2,
                explanation: 'Emails promising prizes are almost always scams. Never click suspicious links.',
              },
              {
                question: 'Which app is most commonly used for free messaging and calling in Rwanda?',
                options: ['Telegram', 'WhatsApp', 'Signal', 'WeChat'],
                correctIndex: 1,
                explanation: 'WhatsApp is the most popular messaging app in Rwanda, used for text, voice, and video calls.',
              },
              {
                question: 'What is a strong password made of?',
                options: ['Your date of birth', 'The word "password"', 'A mix of uppercase, lowercase, numbers, and symbols', 'Your phone number'],
                correctIndex: 2,
                explanation: 'A strong password uses a combination of uppercase letters, lowercase letters, numbers, and special characters.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Practical Internet Skills',
            'Show that you can use email and stay safe online.',
            'Complete the following tasks to demonstrate your internet skills.',
            [
              {
                question: 'Write step-by-step instructions for someone who wants to send their first email with Gmail. List each step clearly.',
                type: 'open',
                explanation: 'Include: open Gmail, tap Compose, enter recipients email, write subject, type message, tap Send.',
                points: 15,
              },
              {
                question: 'List three online safety rules you will follow from now on. Explain why each one is important.',
                type: 'open',
                explanation: 'Examples: never share passwords, dont click suspicious links, use strong passwords, log out on shared computers.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Send an email, use WhatsApp, and identify common online scams to stay safe.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 2: Learn Kinyarwanda — Complete Beginner's Course
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Learn Kinyarwanda: Complete Beginner\'s Course',
    description:
      '📚 Learn Kinyarwanda — the language of Rwanda. This course guides you ' +
      'through the complete beginner\'s journey in reading, writing, and speaking Kinyarwanda. ' +
      'You will practice using textbooks, workbooks, and online resources. ' +
      'Developed with reference to the standard Kinyarwanda language curriculum.',
    category: 'Languages',
    level: 'Beginner',
    price: 1000,
    searchImage: 'kinyarwanda language learning education books',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Foundations of Kinyarwanda',
        'Begin your Kinyarwanda learning journey using textbooks and the standard curriculum structure.',
        [
          makeLesson(
            'Getting Started with Kinyarwanda Learning Materials',
            'Kinyarwanda learning materials are available from official publishers and online resources. ' +
            'These materials follow the standard language curriculum and are designed for both classroom and self-study.\\n\\n' +
            '### Resources You Will Use:\\n' +
            '- **Kinyarwanda Student Book** — The official textbook for Primary and Secondary levels\\n' +
            '- **Kinyarwanda Teacher Guide** — Detailed lesson plans and exercises\\n' +
            '- **Workbooks** — Practice exercises with answer keys\\n' +
            '- **Online platforms** — Online platform with interactive lessons\\n' +
            '- **YouTube channels** — Video lessons following the curriculum\\n\\n' +
            '### How to Access Learning Materials:\\n' +
            '1. Find official Kinyarwanda textbooks on your phone or computer\\n' +
            '2. Create a free account (or log in if you already have one)\\n' +
            '3. Search for "Kinyarwanda" in the course catalogue\\n' +
            '4. Select your level (Primary or Secondary)\\n' +
            '5. Download the PDF textbooks and workbooks for offline study',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=xOU7nfCc_y4', videoTitle: 'Kinyarwanda Alphabet and Pronunciation Guide' },
          ),
          makeLesson(
            'Alphabet and Pronunciation Basics',
            'This lesson follows standard Kinyarwanda curriculum guidelines for teaching the alphabet and pronunciation. ' +
            'The Kinyarwanda alphabet consists of letters from the Latin alphabet, with specific pronunciation rules.\\n\\n' +
            '### Key Points about the Kinyarwanda Alphabet:\\n' +
            '- Kinyarwanda uses the Latin alphabet (same as English)\\n' +
            '- Each letter has one consistent sound (unlike English)\\n' +
            '- Vowels are pronounced clearly: a (ah), e (eh), i (ee), o (oh), u (oo)\\n' +
            '- Consonant combinations exist: ny, ry, sh, ts, etc.\\n\\n' +
            '### Practice with Your Learning Materials:\\n' +
            '- Open your Kinyarwanda Student Book to the alphabet section\\n' +
            '- Read each letter aloud following the pronunciation guide\\n' +
            '- Complete the handwriting exercises in the workbook\\n' +
            '- Practice writing each letter 10 times\\n' +
            '- Watch the video lesson on pronunciation',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Review what you learned about Kinyarwanda basics.',
            [
              {
                question: 'Where can you find Kinyarwanda learning materials?',
                options: ['google.com', 'online resources', 'youtube.com', 'facebook.com'],
                correctIndex: 1,
                explanation: 'Kinyarwanda learning materials are available at bookstores, libraries, and online.',
              },
              {
                question: 'How many consistent vowel sounds does Kinyarwanda have?',
                options: ['3', '5', '7', '10'],
                correctIndex: 1,
                explanation: 'Kinyarwanda has 5 vowel sounds: a (ah), e (eh), i (ee), o (oh), u (oo).',
              },
              {
                question: 'Which alphabet does Kinyarwanda use?',
                options: ['Arabic script', 'Latin alphabet', 'Ge\'ez script', 'Devanagari'],
                correctIndex: 1,
                explanation: 'Kinyarwanda uses the Latin alphabet, the same alphabet used by English.',
              },
            ],
            3,
          ),
        ],
        'Access and use Kinyarwanda learning materials, and understand the alphabet and pronunciation basics.',
      ),
      makeModule(
        'Module 2: Vocabulary and Sentence Structure',
        'Build your vocabulary and learn basic sentence structures using standard learning materials.',
        [
          makeLesson(
            'Building Basic Vocabulary',
            'This lesson guides you through essential Kinyarwanda vocabulary and ' +
            'and provides strategies for learning and remembering new words effectively.\\n\\n' +
            '### How to Build Your Vocabulary:\\n' +
            '1. Open your Kinyarwanda textbook to the vocabulary section for your level\\n' +
            '2. Each lesson introduces 10-15 new words with pictures and context\\n' +
            '3. Say each word aloud using the pronunciation guide\\n' +
            '4. Write each word 5 times in your notebook\\n' +
            '5. Use the word in a simple sentence\\n' +
            '6. Review yesterday words before learning new ones\\n\\n' +
            '### Key Vocabulary Topics:\\n' +
            '- Family members and relationships\\n' +
            '- Daily routines and activities\\n' +
            '- Food and drinks\\n' +
            '- School and classroom objects\\n' +
            '- Numbers, days, and months\\n' +
            '- Colours and descriptions',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Basic Greetings and Introductions',
            'Communication practice is essential for learning Kinyarwanda. ' +
            'This lesson covers greetings and introductions from the textbook, ' +
            'following the official communicative approach to language learning.\\n\\n' +
            '### Practice Activity:\\n' +
            '1. Open your Kinyarwanda textbook to the greetings chapter\\n' +
            '2. Read the dialogue examples\\n' +
            '3. Practice with a partner (or read aloud to yourself)\\n' +
            '4. Complete the workbook exercises\\n' +
            '5. Record yourself and compare with native speaker audio\\n\\n' +
            '### Common Greeting Phrases:\\n' +
            '- Morning greeting and appropriate response\\n' +
            '- Afternoon greeting and appropriate response\\n' +
            '- Evening greeting and appropriate response\\n' +
            '- Asking "How are you?" and responding\\n' +
            '- Introducing yourself (name, where you are from)\\n' +
            '- Saying goodbye and farewell expressions',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=BZCuHpFhuaQ', videoTitle: 'Kinyarwanda Greetings for Beginners' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your understanding of vocabulary and greetings.',
            [
              {
                question: 'How many new words should you aim to learn per lesson?',
                options: ['3-5 words', '10-15 words', '30-40 words', '100+ words'],
                correctIndex: 1,
                explanation: 'Language learners typically aim for 10-15 new words per lesson with pictures and context.',
              },
              {
                question: 'What is the best way to learn new vocabulary according to this course?',
                options: [
                  'Just read the word list once',
                  'Say it aloud, write it, use it in a sentence, and review regularly',
                  'Only practice speaking, never write',
                  'Skip difficult words',
                ],
                correctIndex: 1,
                explanation: 'Effective vocabulary learning involves saying, writing, using in context, and regular review.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Practice Assignment',
            'Apply what you have learned.',
            'Complete these exercises based on your textbook. Refer to your learning materials for guidance.',
            [
              {
                question: 'List 10 Kinyarwanda vocabulary words you have learned. For each word, write what topic it relates to (e.g., family, food, school) and use it in a simple sentence.',
                type: 'open',
                explanation: 'Example: A word related to "family" used in a simple sentence.',
                points: 20,
              },
              {
                question: 'Write a short dialogue between two people meeting for the first time. Include a greeting, introduction, and farewell.',
                type: 'open',
                explanation: 'Include at least 4 exchanges: greeting, asking how they are, introduction, and farewell.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Greet someone, introduce yourself, and use basic vocabulary in simple sentences.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 3: Kinyarwanda Vocabulary Builder (Inkoranya Magambo)
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Kinyarwanda Vocabulary Builder: Using Inkoranya Magambo',
    description:
      '📖 Master Kinyarwanda vocabulary using Inkoranya Magambo — the authoritative Kinyarwanda dictionary. ' +
      'Learn how to look up words, understand definitions, find related terms, and build your vocabulary systematically. ' +
      'This course teaches dictionary skills and vocabulary-building strategies using official reference materials. ' +
      'Perfect for students, teachers, and anyone who wants to expand their Kinyarwanda vocabulary.',
    category: 'Languages',
    level: 'Beginner',
    price: 1000,
    searchImage: 'dictionary vocabulary book learning language',
    modules: [
      makeModule(
        'Module 1: How to Use Inkoranya Magambo',
        'Learn how to use the Inkoranya Magambo dictionary effectively to find and understand Kinyarwanda words.',
        [
          makeLesson(
            'Introduction to Inkoranya Magambo',
            'Inkoranya Magambo is the authoritative Kinyarwanda dictionary developed by language experts. ' +
            'It contains thousands of Kinyarwanda words with their meanings, usage examples, and grammatical information. ' +
            'The dictionary is available in print and online formats.\\n\\n' +
            '### What You Will Find in Inkoranya Magambo:\\n' +
            '- **Headword** — The word you are looking up (listed alphabetically)\\n' +
            '- **Pronunciation guide** — How to say the word correctly\\n' +
            '- **Part of speech** — Whether it is a noun, verb, adjective, etc.\\n' +
            '- **Definition** — What the word means in Kinyarwanda\\n' +
            '- **Example sentence** — The word used in context\\n' +
            '- **Related words** — Synonyms, antonyms, and derived forms\\n\\n' +
            '### How to Access Inkoranya Magambo:\\n' +
            '- **Print edition** — Available at bookstores and libraries in Rwanda\\n' +
            '- **Online version** — Search for "Inkoranya Magambo" on the internet\\n' +
            '- **Mobile app** — Some versions are available for smartphones\\n' +
            '- **School libraries** — Most secondary schools and universities have copies',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=xOU7nfCc_y4', videoTitle: 'Kinyarwanda Alphabet Review for Dictionary Use' },
          ),
          makeLesson(
            'How to Look Up Words in Inkoranya Magambo',
            'Finding words in a dictionary is a skill. This lesson teaches you the step-by-step process for looking up ' +
            'Kinyarwanda words in Inkoranya Magambo, whether you are using the print or online version.\\n\\n' +
            '### Steps for Using the Print Dictionary:\\n' +
            '1. Open Inkoranya Magambo to the section that matches the first letter of your word\\n' +
            '2. Look at the guide words at the top of each page (first and last word on that page)\\n' +
            '3. Scan down the column alphabetically until you find your word\\n' +
            '4. Read the full entry — definition, example, related words\\n' +
            '5. Write down the word and its meaning in your vocabulary notebook\\n\\n' +
            '### Steps for Using the Online Dictionary:\\n' +
            '1. Open your web browser\\n' +
            '2. Search for "Inkoranya Magambo" using Google\\n' +
            '3. Type the word you want to look up in the search box\\n' +
            '4. Press Enter or tap the search icon\\n' +
            '5. Read the definition and example sentences\\n' +
            '6. Click on related words to expand your vocabulary\\n\\n' +
            '### Practice Activity:\\n' +
            'Look up the following words in Inkoranya Magambo and write down their meanings:\\n' +
            '- A word related to "school" (start with letter I)\\n' +
            '- A word related to "food" (start with letter K)\\n' +
            '- A word related to "work" (start with letter G)',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of how to use Inkoranya Magambo.',
            [
              {
                question: 'What information can you find in a typical Inkoranya Magambo entry?',
                options: [
                  'Only the word and its definition',
                  'The headword, definition, example sentence, and related words',
                  'Only the pronunciation',
                  'Only the part of speech',
                ],
                correctIndex: 1,
                explanation: 'A typical entry includes the headword, pronunciation, part of speech, definition, example sentence, and related words.',
              },
              {
                question: 'What should you use to quickly find the right page in a print dictionary?',
                options: ['The index at the back', 'The guide words at the top of each page', 'Random browsing', 'The table of contents'],
                correctIndex: 1,
                explanation: 'Guide words at the top of each page show the first and last word on that page, helping you find your word quickly.',
              },
              {
                question: 'What is a good strategy after looking up a new word?',
                options: [
                  'Forget it immediately',
                  'Write it down in a vocabulary notebook with its meaning',
                  'Only remember it if you see it again',
                  'Never look it up again',
                ],
                correctIndex: 1,
                explanation: 'Writing down new words with their meanings in a vocabulary notebook helps you remember and review them later.',
              },
            ],
            3,
          ),
        ],
        'Use Inkoranya Magambo to look up any Kinyarwanda word and understand its full entry.',
      ),
      makeModule(
        'Module 2: Building Your Vocabulary Using Inkoranya Magambo',
        'Develop systematic vocabulary-building skills using Inkoranya Magambo as your primary reference.',
        [
          makeLesson(
            'Learning Words by Topic Using Inkoranya Magambo',
            'Instead of learning random words, use Inkoranya Magambo to learn words by topic. ' +
            'This method helps you remember words better because they are connected by theme.\\n\\n' +
            '### Topic-Based Learning Method:\\n' +
            '1. Choose a topic (e.g., "market shopping" or "at the hospital")\\n' +
            '2. Think of 5-10 words related to that topic in English\\n' +
            '3. Look up each word in Inkoranya Magambo to find the Kinyarwanda equivalent\\n' +
            '4. Write each word with its definition and an example sentence from the dictionary\\n' +
            '5. Practice using all the words together in a short paragraph about your topic\\n' +
            '6. Review your topic list after 1 day, 3 days, and 1 week\\n\\n' +
            '### Suggested Topics from Inkoranya Magambo:\\n' +
            '- Family and relationships\\n' +
            '- Food and cooking\\n' +
            '- School and education\\n' +
            '- Health and the body\\n' +
            '- Work and professions\\n' +
            '- Nature and the environment',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Proven Vocabulary Building Techniques',
            'Building a strong vocabulary takes strategy, not just memorisation. This lesson teaches you proven techniques ' +
            'for learning new words effectively and retaining them long-term. You can apply these techniques when using ' +
            'Inkoranya Magambo to build your Kinyarwanda vocabulary.\\n\\n' +
            '### Step-by-Step Vocabulary Building Method:\\n' +
            '1. **Choose your words** — Select 5 new words from Inkoranya Magambo each day\\n' +
            '2. **Understand deeply** — Read the full dictionary entry (definition, examples, related words)\\n' +
            '3. **Write it down** — Write each word and its meaning in a vocabulary notebook\\n' +
            '4. **Use it actively** — Create your own sentence using the new word\\n' +
            '5. **Review regularly** — Review yesterday words today, and last weeks words next week\\n' +
            '6. **Teach someone** — Explaining a word to someone else helps you remember it\\n\\n' +
            '### The Power of Cross-References in Inkoranya Magambo:\\n' +
            'When you look up any word in Inkoranya Magambo, check the "related words" or "see also" section. ' +
            'Following these cross-references lets you learn an entire word family at once. ' +
            'For example, looking up a verb might lead you to its noun form, related adjectives, and common phrases.\\n\\n' +
            '### Weekly Vocabulary Challenge:\\n' +
            '- **Day 1-2:** Choose one root word from Inkoranya Magambo and learn 5 related words from its cross-references\\n' +
            '- **Day 3-4:** Use each word in an original sentence\\n' +
            '- **Day 5:** Write a short paragraph using all 6 words\\n' +
            '- **Day 6-7:** Review and test yourself (cover the meanings and recall them)',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=y8aT8gkcG9c', videoTitle: 'How to Expand Your Vocabulary - 6 Proven Steps' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your vocabulary-building strategies.',
            [
              {
                question: 'What is the advantage of learning words by topic rather than randomly?',
                options: [
                  'It is faster but less effective',
                  'Connected words are easier to remember and recall',
                  'There is no advantage',
                  'You learn fewer words',
                ],
                correctIndex: 1,
                explanation: 'Learning words by topic creates mental connections that make words easier to remember and recall in context.',
              },
              {
                question: 'What should you do after looking up a word in Inkoranya Magambo to expand your vocabulary?',
                options: [
                  'Close the dictionary and move on',
                  'Check the related words and look those up too',
                  'Only learn the main word',
                  'Ignore cross-references',
                ],
                correctIndex: 1,
                explanation: 'Following cross-references to related words helps you learn word families and expand your vocabulary faster.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Vocabulary Building Project',
            'Demonstrate your dictionary skills and vocabulary-building knowledge.',
            'Complete the following exercises using Inkoranya Magambo as your primary reference.',
            [
              {
                question: 'Choose one topic from the course (e.g., food, school, health). Using Inkoranya Magambo, find 10 Kinyarwanda words related to that topic. For each word, write the dictionary definition and use it in a sentence.',
                type: 'open',
                explanation: 'Follow the topic-based approach. Write each word with its definition from Inkoranya Magambo and create an original sentence.',
                points: 25,
              },
              {
                question: 'Choose one root word from Inkoranya Magambo. Find at least 5 related words using the cross-references. Explain how each word is related to the root word.',
                type: 'open',
                explanation: 'Example: Start with a verb and find its noun forms, related verbs, and other derived words from the cross-references in the dictionary.',
                points: 25,
              },
            ],
            4,
          ),
        ],
        'Use Inkoranya Magambo to build vocabulary systematically by topic and through word families.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 4: Kiswahili from Zero to Confident Speaker
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Kiswahili from Zero to Confident Speaker',
    description:
      '🗣️ Kiswahili is spoken by over 200 million people across East Africa — and this course takes you ' +
      'from complete beginner to confident speaker. Following authoritative resources from BAKITA (Baraza la ' +
      'Kiswahili la Taifa), TIE (Tanzania Institute of Education), and the East African Kiswahili Commission, ' +
      'you will learn proper Kiswahili Sanifu (Standard Swahili) — not AI-generated or informal versions. ' +
      'Perfect for Rwandans who want to connect with neighbours in Tanzania, Kenya, Uganda, and across the EAC.',
    category: 'Languages',
    level: 'Beginner',
    price: 1000,
    searchImage: 'swahili language learning africa education books',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Foundations of Kiswahili (BAKITA & TIE Standards)',
        'Begin your Kiswahili journey using resources approved by Baraza la Kiswahili la Taifa (BAKITA) and the Tanzania Institute of Education (TIE).',
        [
          makeLesson(
            'Introduction to Kiswahili and Its Importance in East Africa',
            'Kiswahili is the most widely spoken language in East Africa, with over 200 million speakers. ' +
            'It is an official language of the East African Community (EAC), Tanzania, Kenya, Uganda, and Rwanda. ' +
            'The language is regulated by BAKITA (Baraza la Kiswahili la Taifa) in Tanzania and CHAKITA in Kenya, ' +
            'ensuring that the Kiswahili you learn is standardised, correct, and respected across the region.\n\n' +
            '### Why Learn Kiswahili in Rwanda?\n' +
            '- Rwanda is part of the East African Community — Kiswahili is an EAC official language\n' +
            '- Trade and business with Tanzania, Kenya, and Uganda often require Kiswahili\n' +
            '- Many Rwandans already understand basic Kiswahili from regional interactions\n' +
            '- Opens job opportunities in regional organisations, NGOs, and tourism\n\n' +
            '### Authoritative Resources You Will Use:\n' +
            '- **BAKITA (Baraza la Kiswahili la Taifa)** — The supreme regulatory body for Kiswahili in Tanzania\n' +
            '- **TIE (Tanzania Institute of Education)** — Official textbooks at ol.tie.go.tz\n' +
            '- **KICD (Kenya Institute of Curriculum Development)** — KICD-approved Kiswahili materials\n' +
            '- **Kamusi Kuu ya Kiswahili (KKK)** — The official BAKITA-published dictionary\n' +
            '- **East African Kiswahili Commission** — Regional harmonisation at kiswahili.eac.int\n' +
            '- **TBC Taifa & Radio Citizen** — News broadcasts for listening to natural, standard Kiswahili',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=JF_QuwF38sg', videoTitle: 'Learn ALL Swahili Alphabet in 2 Minutes' },
          ),
          makeLesson(
            'Alphabet, Pronunciation, and Basic Greetings (BAKITA Standards)',
            'Kiswahili uses the Latin alphabet, and each letter has a consistent pronunciation — making it easier to read than English. ' +
            'This lesson follows the BAKITA standard for pronunciation and the TIE curriculum for greetings.\n\n' +
            '### Key Points from BAKITA Standards:\n' +
            '- Kiswahili has 5 vowels: a, e, i, o, u — each pronounced clearly\n' +
            '- Consonants are generally the same as English, with a few exceptions\n' +
            '- Stress is almost always on the second-to-last syllable\n' +
            '- Words are pronounced exactly as they are written\n\n' +
            '### Practice with Official Materials:\n' +
            '- Open the TIE Kiswahili textbook for Primary 1 (available free at ol.tie.go.tz)\n' +
            '- Practice the alphabet section with the pronunciation guide\n' +
            '- Complete the handwriting and reading exercises\n' +
            '- Listen to TBC Taifa news to hear correct pronunciation\n' +
            '- Use Kamusi Kuu ya Kiswahili (KKK) to check word pronunciations',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of Kiswahili basics and the resources you will use.',
            [
              {
                question: 'Which organisation is the supreme regulatory body for Kiswahili in Tanzania?',
                options: ['UNESCO', 'BAKITA', 'RDB', 'African Union'],
                correctIndex: 1,
                explanation: 'BAKITA (Baraza la Kiswahili la Taifa) is the National Swahili Council of Tanzania, regulating standard Kiswahili.',
              },
              {
                question: 'What is the official BAKITA-published dictionary called?',
                options: ['Oxford Swahili Dictionary', 'Kamusi Kuu ya Kiswahili (KKK)', 'Google Translate', 'Merriam-Webster Swahili'],
                correctIndex: 1,
                explanation: 'Kamusi Kuu ya Kiswahili (KKK) is the authoritative dictionary published with BAKITA approval.',
              },
              {
                question: 'Where can you find free official TIE Kiswahili textbooks?',
                options: ['Google.com', 'ol.tie.go.tz', 'YouTube.com', 'Facebook.com'],
                correctIndex: 1,
                explanation: 'The Tanzania Institute of Education provides free textbooks at ol.tie.go.tz.',
              },
            ],
            3,
          ),
        ],
        'Understand the importance of Kiswahili in East Africa, pronounce the alphabet correctly, and greet someone using standard Kiswahili.',
      ),
      makeModule(
        'Module 2: Building Vocabulary and Sentences',
        'Expand your vocabulary and learn to form correct sentences using TIE curriculum and BAKITA-approved word lists.',
        [
          makeLesson(
            'Basic Greetings and Introductions (TIE Curriculum)',
            'The TIE Kiswahili curriculum for beginners starts with greetings and introductions. ' +
            'This lesson follows the official TIE textbook structure for communicative competence.\n\n' +
            '### Practice Activities from TIE Textbook:\n' +
            '1. Open your TIE Kiswahili Student Book\n' +
            '2. Read the dialogue examples for greetings\n' +
            '3. Practice with a partner (greet, ask how they are, say goodbye)\n' +
            '4. Complete the workbook exercises\n' +
            '5. Record yourself and check pronunciation against TBC news broadcasters\n\n' +
            '### Greetings Covered in TIE Curriculum:\n' +
            '- Morning greetings and appropriate responses\n' +
            '- Afternoon and evening greetings\n' +
            '- Asking "How are you?" and different ways to respond\n' +
            '- Introducing yourself (name, where you are from, what you do)\n' +
            '- Saying goodbye and farewell expressions',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=MIGY_wNlXg8', videoTitle: '5 Basic Swahili Greetings - Quick Guide' },
          ),
          makeLesson(
            'Numbers, Days, and Months (TIE Curriculum)',
            'Numbers, days of the week, and months are essential for everyday communication. ' +
            'This lesson follows the TIE Kiswahili Primary curriculum vocabulary lists.\n\n' +
            '### How to Practice with TIE Materials:\n' +
            '1. Open your TIE textbook to the numbers chapter\n' +
            '2. Count aloud 1-20 following the pronunciation guide\n' +
            '3. Learn the days of the week and months from the vocabulary list\n' +
            '4. Practice by saying: "Today is...", "Tomorrow will be...", "I was born in..."\n' +
            '5. Write the date in Kiswahili every day in your notebook\n\n' +
            '### Key Vocabulary from TIE Word Lists:\n' +
            '- Numbers 1-10, then 11-20, then tens (20, 30, 40... 100)\n' +
            '- Days of the week (Jumatatu, Jumanne, ... Jumapili)\n' +
            '- Months of the year (Januari, Februari, ... Desemba)\n' +
            '- Telling time and asking "What time is it?"',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=OfygsIwnbK4', videoTitle: 'Swahili Numbers 1-20 - Quick Pronunciation Guide' },
          ),
          makeLesson(
            'Basic Sentence Structure (Noun Classes & Verb Conjugation)',
            'Kiswahili sentence structure is different from English. The language uses noun classes (ngeli) and verb prefixes ' +
            'to indicate who is doing what. This lesson introduces the basic patterns following the TIE curriculum.\n\n' +
            '### Basic Sentence Pattern:\n' +
            'In Kiswahili, verbs change their beginning to show the subject. For example:\n' +
            '- "I" use "ni-" prefix\n' +
            '- "You" use "u-" prefix\n' +
            '- "He/She" use "a-" prefix\n' +
            '- "We" use "tu-" prefix\n\n' +
            '### Practice with TIE Textbook:\n' +
            '1. Open the sentence construction chapter in your TIE textbook\n' +
            '2. Learn the subject prefixes (ni-, u-, a-, tu-, m-, wa-)\n' +
            '3. Practice forming simple sentences: "Mimi ni..." (I am...), "Wewe ni..." (You are...)\n' +
            '4. Complete the grammar exercises in the workbook\n' +
            '5. Write 5 simple sentences about yourself',
            'video',
            3,
            { videoUrl: 'https://www.youtube.com/watch?v=F2OBDB7IPzY', videoTitle: 'Swahili Sentence Construction for Beginners' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your vocabulary and sentence structure knowledge.',
            [
              {
                question: 'What is the subject prefix for "I" in Kiswahili?',
                options: ['a-', 'u-', 'ni-', 'tu-'],
                correctIndex: 2,
                explanation: 'The subject prefix for "I" (mimi) is ni- in Kiswahili.',
              },
              {
                question: 'Which of these is NOT a day of the week in Kiswahili?',
                options: ['Jumatatu', 'Jumanne', 'Januari', 'Jumamosi'],
                correctIndex: 2,
                explanation: 'Januari is a month (January), not a day of the week.',
              },
              {
                question: 'Where should you look for official Kiswahili vocabulary word lists for beginners?',
                options: ['Google Translate', 'TIE Kiswahili textbooks at ol.tie.go.tz', 'Wikipedia', 'Social media'],
                correctIndex: 1,
                explanation: 'TIE textbooks provide official, curriculum-approved vocabulary lists for learners at each level.',
              },
            ],
            4,
          ),
        ],
        'Greet someone, count 1-100, say the days and months, and form basic sentences in Kiswahili.',
      ),
      makeModule(
        'Module 3: Practical Communication & Cultural Fluency',
        'Develop practical speaking and listening skills using authentic Kiswahili media and resources.',
        [
          makeLesson(
            'Everyday Conversations and Listening Practice',
            'The best way to improve your Kiswahili is to listen to native speakers. ' +
            'This lesson guides you through using authentic Kiswahili media for listening practice.\n\n' +
            '### Listening Practice Resources:\n' +
            '- **TBC Taifa News** — The gold standard for standard Kiswahili pronunciation\n' +
            '- **Radio Citizen (Kenya)** — Kenyan Kiswahili broadcasts\n' +
            '- **TIE audio resources** — Official textbook audio at ol.tie.go.tz\n' +
            '- **East African Kiswahili Commission** — Regional language resources at kiswahili.eac.int\n\n' +
            '### How to Practice Listening:\n' +
            '1. Listen to 5 minutes of TBC Taifa news daily\n' +
            '2. Write down 3-5 words you recognise\n' +
            '3. Look up new words in Kamusi Kuu ya Kiswahili (KKK)\n' +
            '4. Repeat sentences aloud to practice pronunciation\n' +
            '5. Gradually increase your listening time to 15 minutes per day',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=5ya2ip1-mfc', videoTitle: 'How to Introduce Yourself in Swahili - 3 Min' },
          ),
          makeLesson(
            'Culture, Etiquette, and Regional Variations',
            'Understanding East African culture is essential for using Kiswahili correctly. ' +
            'Learn about cultural etiquette, respectful forms of address, and the differences between ' +
            'Kiswahili Sanifu (Standard), Tanzanian Kiswahili, and Kenyan Kiswahili.\n\n' +
            '### Cultural Tips:\n' +
            '- Always greet before starting a conversation — skipping greetings is considered rude\n' +
            '- Use "Shikamoo" for elders (a sign of respect)\n' +
            '- Use "Mwalimu" (teacher), "Daktari" (doctor), "Bwana" (Mr.), "Mama" (Mrs.)\n' +
            '- The right hand is used for giving and receiving items\n' +
            '- Politeness is highly valued — use "tafadhali" (please) and "asante" (thank you) often\n\n' +
            '### Regional Variations:\n' +
            '- **Tanzanian Kiswahili** — Considered the most "standard" form (based on Kiunguja dialect)\n' +
            '- **Kenyan Kiswahili** — More influence from English and local languages\n' +
            '- **Congolese Kiswahili** — Different pronunciation and some unique vocabulary\n' +
            '- **BAKITA** works to harmonise these variations into Kiswahili Sanifu',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test your understanding of practical Kiswahili and cultural etiquette.',
            [
              {
                question: 'What is the respectful greeting used for elders in Kiswahili culture?',
                options: ['Jambo', 'Shikamoo', 'Habari', 'Mambo'],
                correctIndex: 1,
                explanation: 'Shikamoo is a respectful greeting used when addressing elders in East African Swahili culture.',
              },
              {
                question: 'In which country is the most standard form of Kiswahili spoken?',
                options: ['Kenya', 'Uganda', 'Tanzania', 'DRC'],
                correctIndex: 2,
                explanation: 'Tanzanian Kiswahili, based on the Kiunguja dialect of Zanzibar, is considered the most standard form.',
              },
              {
                question: 'What should you always do before starting a conversation in Kiswahili culture?',
                options: ['Sit down', 'Greet first', 'Take off your shoes', 'Clap your hands'],
                correctIndex: 1,
                explanation: 'In East African culture, it is considered rude to start a conversation without greeting first.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 3: Final Kiswahili Project',
            'Demonstrate your Kiswahili skills and knowledge of authoritative resources.',
            'Complete the following exercises to show your proficiency in using Kiswahili resources and basic communication.',
            [
              {
                question: 'Create a 5-day Kiswahili study plan using the authoritative resources mentioned in this course (TIE textbooks, BAKITA, Kamusi Kuu ya Kiswahili, TBC Taifa, EAKC). For each day, list what resource you will use and what you will practice.',
                type: 'open',
                explanation: 'Example: Day 1 - Open TIE textbook, practice alphabet and greetings. Day 2 - Use Kamusi Kuu to learn 10 new words, etc.',
                points: 20,
              },
              {
                question: 'Write a short self-introduction in Kiswahili (5-8 sentences). Include: your name, where you are from, what you do, your family, and what you like.',
                type: 'open',
                explanation: 'Use the sentence patterns from Module 2. Start with greetings, introduce yourself, and end with a farewell.',
                points: 25,
              },
            ],
            4,
          ),
        ],
        'Hold a basic conversation in Kiswahili, understand cultural etiquette, and continue learning independently using authoritative resources.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 5: African Fashion Business in Rwanda
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'African Fashion Business in Rwanda',
    description:
      '🌍 African fashion is having a global moment — and Rwanda is at the center of it. ' +
      'From traditional Kitenge fabrics to modern couture, the fashion industry in Rwanda offers huge opportunities for creative entrepreneurs. ' +
      'This course teaches you how to start and grow a fashion business in Rwanda — whether you are a tailor, designer, fabric trader, ' +
      'or someone who wants to launch a clothing brand. Learn to design, produce, market, and sell fashion products locally and internationally.\n\n' +
      '### What You Will Learn\n\n' +
      '- **Fashion Design Basics** — Sketching, pattern making, sewing techniques\n' +
      '- **Sourcing Fabrics** — Kitenge, cotton, linen — where to buy in Rwanda and import\n' +
      '- **Production** — Tailoring, quality control, scaling production\n' +
      '- **Brand Building** — Creating your fashion brand identity\n' +
      '- **Marketing** — Selling on Instagram, at markets, to boutiques\n' +
      '- **Business Management** — Pricing, customers, finances, growth\n\n' +
      '### Your Fashion Business Toolbox\n\n' +
      '| Tool | Purpose | Cost | Sign Up |\n' +
      '|------|---------|------|---------|\n' +
      '| **Canva** | Design logos, lookbooks, social media graphics | Free tier | [www.canva.com](https://www.canva.com) |\n' +
      '| **Instagram** | Showcase your designs, attract customers | Free | [www.instagram.com](https://www.instagram.com) |\n' +
      '| **WhatsApp Business** | Customer orders, inquiries | Free | [www.whatsapp.com/business](https://www.whatsapp.com/business) |\n' +
      '| **Etsy** | Sell to international customers | $0.20/listing | [www.etsy.com](https://www.etsy.com) |\n' +
      '| **Jumia Fashion** | Sell clothes online in Rwanda | Commission | [www.jumia.co.rw](https://www.jumia.co.rw) |\n' +
      '| **Sewing Machine** | Basic production equipment | 200,000-800,000 RWF | Local suppliers |\n' +
      '| **Kimironko Market** | Fabric shopping in Kigali | Cash | Visit in person |\n' +
      '| **PayPal** | Receive international payments | 2.9% + $0.30 | [www.paypal.com](https://www.paypal.com) |',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'african fashion design rwanda kitenge clothing business',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Introduction to the Rwandan Fashion Industry',
        'Understand the fashion landscape in Rwanda — from traditional textiles to modern markets.',
        [
          makeLesson(
            'The Rwandan Fashion Opportunity',
            'Rwanda\'s fashion industry is growing rapidly. With Kigali positioning itself as a regional hub for ' +
            'creativity and innovation, fashion entrepreneurs have unprecedented opportunities. This module ' +
            'introduces you to the ecosystem, key players, and how to find your niche.\n\n' +
            '### Why Fashion in Rwanda?\n' +
            '- Kigali is becoming known as a creative capital in East Africa\n' +
            '- Growing middle class with interest in both traditional and modern fashion\n' +
            '- Government support for Made in Rwanda products\n' +
            '- International interest in African fashion and textiles\n' +
            '- Events like Kwita Izina and Kigali Fashion Week showcase local talent\n\n' +
            '### Key Fashion Hubs in Kigali:\n' +
            '- **Kimironko Market** — Largest fabric market, hundreds of vendors\n' +
            '- **Kacyiru** — Boutiques and tailors\n' +
            '- **Downtown Kigali** — Fabric shops, tailors, and accessories\n' +
            '- **Kicukiro** — Emerging fashion and design spaces\n' +
            '- **Nyarutarama** — High-end boutiques and designers\n\n' +
            '### Types of Fashion Businesses in Rwanda:\n' +
            '- Custom tailoring and made-to-measure clothing\n' +
            '- Ready-to-wear clothing brands\n' +
            '- Fabric trading (Kitenge, cotton, linen, wax prints)\n' +
            '- Fashion accessories (jewellery, bags, shoes)\n' +
            '- Fashion education and workshops\n' +
            '- Online clothing retail',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=7TNO6EF5iU4', videoTitle: 'Rwanda Fashion Industry Overview' },
          ),
          makeLesson(
            'Understanding Your Customer: The Rwandan Market',
            'To succeed in fashion, you must understand who your customers are, what they want to wear, ' +
            'and how much they are willing to spend. This lesson covers market research tailored to Rwanda.\n\n' +
            '### Customer Segments in Rwanda:\n' +
            '- **Young professionals (25-35)** — Office wear, smart casual, want quality at fair prices\n' +
            '- **Students (18-25)** — Affordable trendy clothing, secondhand (carge) market\n' +
            '- **Working professionals (35-50)** — Formal wear, suits, traditional wear for events\n' +
            '- **International visitors/expats** — African-inspired fashion, souvenirs, custom pieces\n' +
            '- **Events market** — Wedding wear, gala outfits, traditional ceremony attire\n\n' +
            '### How to Research Your Market:\n' +
            '1. Visit boutiques in different areas and note what sells\n' +
            '2. Ask tailors what styles customers request most\n' +
            '3. Browse Instagram and see what fashion content Rwandans engage with\n' +
            '4. Attend fashion events and talk to designers\n' +
            '5. Survey your own network about what they would buy\n\n' +
            '### Price Sensitivity:\n' +
            '- Most Rwandan customers are price-sensitive but value quality\n' +
            '- 5,000-15,000 RWF for simple tops/dresses\n' +
            '- 15,000-40,000 RWF for quality outfits\n' +
            '- 50,000+ RWF for premium/custom pieces\n' +
            '- Fabric prices at Kimironko: 3,000-15,000 RWF per metre depending on quality',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Fashion Business Models: Choose Your Path',
            'There are many ways to build a fashion business in Rwanda. This lesson helps you choose the right model for your skills, capital, and goals.\n\n' +
            '### Business Models:\n\n' +
            '**1. Custom Tailoring Shop**\n' +
            '- Make clothes for individual customers\n' +
            '- Low startup cost (machine + space + fabrics)\n' +
            '- Steady income from repeat customers\n' +
            '- Best for: Experienced tailors\n\n' +
            '**2. Ready-to-Wear Brand**\n' +
            '- Design and produce clothing in bulk\n' +
            '- Sell through Instagram, Jumia, boutiques\n' +
            '- Higher risk but higher reward\n' +
            '- Best for: Designers with some capital\n\n' +
            '**3. Fabric Trading**\n' +
            '- Buy fabrics wholesale and sell retail\n' +
            '- Can be done from market stall or online\n' +
            '- Good margins on imported fabrics\n' +
            '- Best for: Those with market connections\n\n' +
            '**4. Fashion Accessories**\n' +
            '- Jewellery, bags, shoes, belts\n' +
            '- Lower production cost\n' +
            '- Easy to sell online\n' +
            '- Best for: Creative entrepreneurs with small budgets\n\n' +
            '**5. Online Fashion Retail**\n' +
            '- Curate and resell clothing from local designers\n' +
            '- Sell on Jumia Fashion or your own Instagram shop\n' +
            '- No production costs\n' +
            '- Best for: Digital-savvy entrepreneurs',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of the Rwandan fashion industry.',
            [
              {
                question: 'Which market is the largest fabric market in Kigali?',
                options: [
                  'Kacyiru Market',
                  'Kimironko Market',
                  'Nyarutarama Market',
                  'Gikondo Market',
                ],
                correctIndex: 1,
                explanation: 'Kimironko Market is the largest fabric market in Kigali, with hundreds of vendors selling Kitenge, cotton, linen, and other fabrics.',
              },
              {
                question: 'In what price range do most quality outfits sell for in Rwanda?',
                options: [
                  '1,000-3,000 RWF',
                  '5,000-10,000 RWF',
                  '15,000-40,000 RWF',
                  '100,000+ RWF',
                ],
                correctIndex: 2,
                explanation: 'Most quality outfits in Rwanda are priced between 15,000-40,000 RWF, though prices vary based on fabric and complexity.',
              },
              {
                question: 'Which business model is best for someone with limited capital but strong sewing skills?',
                options: [
                  'Online fashion retail',
                  'Custom tailoring shop',
                  'Ready-to-wear brand',
                  'Fabric trading',
                ],
                correctIndex: 1,
                explanation: 'Custom tailoring has the lowest startup cost - a sewing machine, small space, and fabrics are all you need to start.',
              },
            ],
            4,
          ),
        ],
        'Understand the Rwandan fashion industry and choose the right business model for your fashion venture.',
      ),
      makeModule(
        'Module 2: Fashion Design Basics — Sketching, Patterns & Sewing',
        'Learn the fundamental skills every fashion entrepreneur needs — from sketching ideas to creating finished garments.',
        [
          makeLesson(
            'Fashion Sketching for Beginners',
            'You don\'t need to be a professional artist to sketch fashion designs. This lesson teaches you simple techniques ' +
            'to get your ideas on paper so you can communicate with tailors and manufacturers.\n\n' +
            '### Tools You Need:\n' +
            '- Notebook or sketchpad (available at stationery shops in Kigali)\n' +
            '- Pencil and eraser\n' +
            '- Coloured pencils or markers\n' +
            '- Ruler for straight lines\n' +
            '- **Or use Canva** — Digital templates at www.canva.com\n\n' +
            '### Basic Fashion Figure (Croquis):\n' +
            'A fashion croquis is a simple drawing of a model\'s body used to sketch designs on. ' +
            'The figure is 9 "heads" tall (fashion proportions are elongated).\n\n' +
            '1. Draw a vertical line (the centre of the body)\n' +
            '2. Mark 9 equal sections (each = height of the head)\n' +
            '3. Draw an oval for the head at the top\n' +
            '4. Mark shoulders, waist, hips, knees, and feet\n' +
            '5. Connect with simple lines for the body\n' +
            '6. Draw your garment design over the figure\n\n' +
            '### Practice Activity:\n' +
            'Sketch 3 different design ideas for a simple dress. Focus on getting the proportions right. ' +
            'Don\'t worry about details — just practice the basic shapes.',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=I2qA4ceTSCw', videoTitle: 'Fashion Sketching for Beginners - Step by Step' },
          ),
          makeLesson(
            'Pattern Making: From Design to Fabric',
            'Patterns are the templates you cut fabric from. Without accurate patterns, your clothes won\'t fit properly. ' +
            'This lesson covers the basics of pattern making so you can create garments that fit well.\n\n' +
            '### What is a Pattern?\n' +
            'A pattern is a paper template that shows the shapes of each piece of fabric needed to sew a garment. ' +
            'Patterns include markings for seams, darts, pleats, and buttonholes.\n\n' +
            '### Basic Pattern Making Steps:\n' +
            '1. **Take measurements** — Bust, waist, hips, shoulder width, arm length, back length\n' +
            '2. **Draw the basic block** — Start with a simple bodice or skirt block based on measurements\n' +
            '3. **Add design details** — Modify the block for your specific design (neckline, sleeves, length)\n' +
            '4. **Add seam allowance** — Usually 1-1.5cm extra around each piece\n' +
            '5. **Cut and test** — Make a toile (test garment) from cheap fabric to check the fit\n' +
            '6. **Adjust and finalise** — Modify the pattern based on the toile fit\n\n' +
            '### Where to Learn More in Kigali:\n' +
            '- **UTEXRWA** — Rwanda\'s textile school offers short courses\n' +
            '- **Local tailors** — Many experienced tailors offer apprenticeship\n' +
            '- **Kigali Fashion Cluster** — Network of fashion professionals\n' +
            '- **YouTube** — Free pattern-making tutorials (search "basic pattern making")',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=N6PSsg79yeg', videoTitle: 'Pattern Making for Beginners - Basic Bodice' },
          ),
          makeLesson(
            'Essential Sewing Techniques for Fashion Entrepreneurs',
            'Whether you sew yourself or manage tailors, you need to understand sewing basics. ' +
            'This lesson covers the techniques every fashion entrepreneur should know.\n\n' +
            '### Essential Stitches:\n' +
            '- **Straight stitch** — Basic seam, used for joining fabric pieces\n' +
            '- **Zigzag stitch** — Finishes raw edges to prevent fraying\n' +
            '- **Backstitch** — Reinforces the start and end of seams\n' +
            '- **Basting stitch** — Temporary long stitch for fitting\n' +
            '- **Hem stitch** — Finishes the bottom edges of garments\n' +
            '- **Buttonhole stitch** — For creating buttonholes\n\n' +
            '### Sewing Machine Basics:\n' +
            'If you own a machine (or plan to buy one), learn these operations:\n' +
            '- Threading the machine correctly\n' +
            '- Winding and inserting the bobbin\n' +
            '- Adjusting stitch length and tension\n' +
            '- Changing needles (different fabrics need different needles)\n' +
            '- Cleaning and maintaining the machine\n\n' +
            '### Sewing Machine Prices in Rwanda (2024):\n' +
            '- **Basic manual machine** — 80,000-150,000 RWF (secondhand)\n' +
            '- **New domestic machine** — 200,000-400,000 RWF\n' +
            '- **Industrial machine** — 500,000-1,500,000 RWF\n' +
            '- **Overlock/serger** — 400,000-800,000 RWF\n\n' +
            '### Where to Buy Sewing Machines in Kigali:\n' +
            '- **Rwanda Sewing Machine Centre** — Near Kimironko\n' +
            '- **Spare parts shops** — Downtown Kigali\n' +
            '- **Online** — Jumia, classified ads\n' +
            '- **Local markets** — Secondhand machines available',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your understanding of fashion design basics.',
            [
              {
                question: 'What is a pattern in fashion design?',
                options: [
                  'A sketch of the finished garment',
                  'A paper template showing fabric piece shapes for sewing',
                  'A type of fabric',
                  'A sewing machine attachment',
                ],
                correctIndex: 1,
                explanation: 'A pattern is a paper template that shows the shapes of each fabric piece needed, with markings for seams, darts, and other details.',
              },
              {
                question: 'What is a toile (muslin) used for?',
                options: [
                  'The final fabric for the garment',
                  'A test garment made from cheap fabric to check fit',
                  'A type of decorative stitching',
                  'A pattern storage method',
                ],
                correctIndex: 1,
                explanation: 'A toile is a test garment made from inexpensive fabric that lets you check fit and make adjustments before cutting the final fabric.',
              },
              {
                question: 'Where in Kigali can you buy a sewing machine?',
                options: [
                  'Only at supermarkets',
                  'Rwanda Sewing Machine Centre and downtown spare parts shops',
                  'Only online from China',
                  'Kimironko vegetable section',
                ],
                correctIndex: 1,
                explanation: 'Sewing machines are available at dedicated sewing machine centres, spare parts shops downtown, on Jumia, and through classified ads.',
              },
            ],
            4,
          ),
        ],
        'Sketch design ideas, understand pattern making, and know the essential sewing techniques for your fashion business.',
      ),
      makeModule(
        'Module 3: Sourcing Fabrics — Kitenge, Cotton, Linen & More',
        'Learn where to buy fabrics in Rwanda and how to import quality materials for your fashion business.',
        [
          makeLesson(
            'Fabric Shopping at Kimironko Market',
            'Kimironko Market is the fabric capital of Kigali. This lesson teaches you how to shop there like a pro — ' +
            'finding quality fabrics, negotiating prices, and building relationships with vendors.\n\n' +
            '### What You\'ll Find at Kimironko:\n' +
            '- **Kitenge (Ankara)** — Colourful African wax prints, 3,000-8,000 RWF/metre\n' +
            '- **Cotton** — Plain and printed, 3,000-6,000 RWF/metre\n' +
            '- **Linen** — Quality fabric for professional wear, 5,000-10,000 RWF/metre\n' +
            '- **Silk** — For special occasion wear, 8,000-15,000 RWF/metre\n' +
            '- **Lace** — For elegant and bridal wear, 5,000-20,000 RWF/metre\n' +
            '- **Kikoy** — Traditional East African woven fabric, 3,000-6,000 RWF\n\n' +
            '### Tips for Buying Fabric at Kimironko:\n' +
            '1. **Go early** — Best selection arrives in the morning (7-9 AM)\n' +
            '2. **Bring cash** — Most vendors don\'t accept mobile money or cards\n' +
            '3. **Check quality** — Hold the fabric up to light, feel it, stretch it\n' +
            '4. **Negotiate** — Start at 50-60% of the quoted price\n' +
            '5. **Buy wholesale** — Buying 5+ metres of the same fabric gets you better prices\n' +
            '6. **Build relationships** — Return to the same vendors for better deals over time\n' +
            '7. **Know your widths** — Fabric width varies (90cm, 112cm, 150cm are common)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=g-kNFv10Cts', videoTitle: 'Shopping for African Fabrics in Kigali - Kimironko Market Tour' },
          ),
          makeLesson(
            'Importing Fabrics from Outside Rwanda',
            'Sometimes the fabric you need isn\'t available locally. This lesson teaches you how to import fabrics ' +
            'from Kenya, Tanzania, China, India, and Dubai — safely and cost-effectively.\n\n' +
            '### Best Sources for Imported Fabrics:\n' +
            '- **Kenya** — High-quality Kitenge and Kikoy, especially from Nairobi\n' +
            '- **Tanzania** — Famous for printed cotton and Kitenge (lower prices than Rwanda)\n' +
            '- **China** — Bulk fabrics at low prices (minimum orders usually 100+ metres)\n' +
            '- **India** — Silk, cotton, linen — good quality at competitive prices\n' +
            '- **Dubai** — Premium fabrics, lace, and embellishments\n' +
            '- **Turkey** — High-quality cotton and jersey fabrics\n\n' +
            '### Import Process:\n' +
            '1. **Find suppliers** — Use Alibaba.com, TradeKey.com, or attend trade fairs\n' +
            '2. **Request samples** — Always order samples first (3-5 metres) to check quality\n' +
            '3. **Get quotes** — Ask for CIF (Cost, Insurance, Freight) prices to Kigali\n' +
            '4. **Calculate duties** — Check RRA customs duties for fabric imports\n' +
            '5. **Arrange shipping** — Air freight for small orders, sea freight for bulk\n' +
            '6. **Clear customs** — Use a clearing agent at Mombasa/Kigali border\n\n' +
            '### Estimated Import Costs (per kg):\n' +
            '- Air freight from China: $3-5/kg\n' +
            '- Sea freight from China: $0.5-1.5/kg\n' +
            '- Customs duty: 25% on fabric (check current RRA rates)\n' +
            '- Clearing agent fee: 50,000-100,000 RWF per shipment',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1551163944-3f1bb1b3b7d0?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Working with Local Weavers and Artisans',
            'Rwanda has talented weavers and artisans creating unique textiles. Incorporating their work into your fashion brand ' +
            'adds authenticity and supports local craftsmanship.\n\n' +
            '### Local Textiles in Rwanda:\n' +
            '- **Agaseke** — Traditional woven baskets (can inspire handbag designs)\n' +
            '- **Imigongo** — Traditional cow dung art (patterns used in fabric design)\n' +
            '- **Kitenge** — Wax prints produced locally and regionally\n' +
            '- **Kikoy** — Woven cotton fabric (also called Kikoi in Swahili)\n' +
            '- **Handwoven cotton** — Small-scale artisan weaving\n\n' +
            '### How to Find and Partner with Artisans:\n' +
            '1. **Visit cooperatives** — Many weaving groups in rural areas (contact Rwanda Cooperative Agency)\n' +
            '2. **Attend craft fairs** — Rwanda Expo, HAGARIMANA, and local markets\n' +
            '3. **Use social media** — Search for "Rwanda artisans" or "handmade Rwanda"\n' +
            '4. **Contact RDB** — Rwanda Development Board can connect you with artisan groups\n' +
            '5. **Fair pricing** — Agree on prices upfront, pay deposits, build long-term relationships\n\n' +
            '### Benefits of Working with Artisans:\n' +
            '- Unique fabrics and designs you won\'t find anywhere else\n' +
            '- Storytelling for your brand ("handwoven by Rwandan artisans")\n' +
            '- Supporting local communities\n' +
            '- Potential for premium pricing (customers pay more for authentic products)',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test your fabric sourcing knowledge.',
            [
              {
                question: 'What is a good negotiation strategy when buying fabric at Kimironko Market?',
                options: [
                  'Accept the first price quoted',
                  'Start negotiating at 50-60% of the quoted price',
                  'Only buy at fixed-price shops',
                  'Never negotiate fabric prices',
                ],
                correctIndex: 1,
                explanation: 'Starting at 50-60% of the quoted price is a standard negotiation practice at Kimironko Market.',
              },
              {
                question: 'What is the typical customs duty rate for fabric imports into Rwanda?',
                options: [
                  '5%',
                  '25%',
                  '50%',
                  'No duty on fabric',
                ],
                correctIndex: 1,
                explanation: 'Fabric imports into Rwanda typically incur around 25% customs duty, but always check current RRA rates as they may change.',
              },
              {
                question: 'Why should you order fabric samples before placing a bulk import order?',
                options: [
                  'Samples are free',
                  'To check the quality before committing to a large order',
                  'Samples arrive faster',
                  'It is required by law',
                ],
                correctIndex: 1,
                explanation: 'Always order samples first to verify fabric quality, colour, and feel matches what you need before placing a large order.',
              },
            ],
            4,
          ),
        ],
        'Source fabrics from local markets and international suppliers for your fashion business.',
      ),
      makeModule(
        'Module 4: Production, Quality Control & Scaling',
        'Learn to manage production efficiently, maintain quality standards, and scale your fashion business.',
        [
          makeLesson(
            'Setting Up Your Production Space',
            'Whether you work from home or rent a workspace, your production area affects quality and efficiency. ' +
            'Learn how to set up a functional sewing and production space.\n\n' +
            '### Home-Based Production (Starting Out):\n' +
            '- Minimum space: 3m x 4m for one machine, cutting table, and storage\n' +
            '- Ensure good lighting (natural light is best for colour matching)\n' +
            '- Keep a clean, dry space (fabric absorbs moisture and odours)\n' +
            '- Invest in proper storage (shelves, plastic bins protect fabric from dust)\n\n' +
            '### Renting a Workshop (Scaling Up):\n' +
            '- Commercial spaces in Kigali: 100,000-300,000 RWF/month (small workshop)\n' +
            '- Areas: Kacyiru, Kimironko, Gikondo, Kicukiro\n' +
            '- Look for: Good lighting, power (consider solar backup), ventilation, security\n\n' +
            '### Essential Equipment Checklist:\n' +
            '☐ Sewing machine (domestic or industrial)\n' +
            '☐ Overlock/serger machine (for professional finishes)\n' +
            '☐ Cutting table (large, flat, waist-height)\n' +
            '☐ Fabric scissors (sharp, fabric-only)\n' +
            '☐ Measuring tape and rulers\n' +
            '☐ Iron and ironing board\n' +
            '☐ Mannequin/dress form (for fitting)\n' +
            '☐ Storage shelves and bins\n' +
            '☐ Good lighting\n' +
            '☐ First aid kit (sewing injuries happen!)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=5nPE3ZWHnZY', videoTitle: 'How to Set Up a Small Sewing Workshop' },
          ),
          makeLesson(
            'Quality Control: Ensuring Every Garment is Perfect',
            'Quality is what makes customers come back and recommend you to others. This lesson teaches you ' +
            'how to check quality at every stage of production.\n\n' +
            '### Quality Checks at Each Stage:\n\n' +
            '**Before Cutting:**\n' +
            '- Check fabric for defects (holes, stains, uneven dye)\n' +
            '- Pre-wash fabric if needed (cotton shrinks)\n' +
            '- Iron fabric flat\n' +
            '- Check pattern pieces are correct\n\n' +
            '**During Cutting:**\n' +
            '- Cut precisely along pattern lines\n' +
            '- Check pattern direction (especially for patterned fabrics like Kitenge)\n' +
            '- Mark darts, pleats, and notches clearly\n' +
            '- Check that all pieces are present for each garment\n\n' +
            '**During Sewing:**\n' +
            '- Seams should be straight and even width\n' +
            '- Stitch tension should be correct (not too tight, not too loose)\n' +
            '- Raw edges should be finished (zigzag or overlock)\n' +
            '- Corners and curves should be smooth\n\n' +
            '**Final Inspection (Before Delivering):**\n' +
            '- Check all seams are secure\n' +
            '- Remove all loose threads\n' +
            '- Check buttons and zippers work\n' +
            '- Iron/press the garment\n' +
            '- Try on mannequin to check fit\n' +
            '- Ask a colleague to do a second check',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Scaling Production: From 1 to 100 Pieces',
            'When orders increase, you need systems to scale production without sacrificing quality. ' +
            'This lesson covers how to grow from making one piece at a time to batch production.\n\n' +
            '### Production Planning:\n' +
            '- **Track your time** — How long does each garment type take? (e.g., simple dress = 3 hours)\n' +
            '- **Batch tasks** — Cut all pieces first, then sew all seams, then finish all hems\n' +
            '- **Create a production schedule** — Week by week plan for orders\n' +
            '- **Build in buffer time** — Things go wrong, add 20% extra time\n\n' +
            '### Hiring and Training Staff:\n' +
            'When you hire tailors, invest time in training:\n' +
            '- Create standard operating procedures (SOPs) for each garment\n' +
            '- Provide sample garments as quality references\n' +
            '- Do daily quality checks on first 2-3 pieces each tailor makes\n' +
            '- Pay by piece (e.g., 5,000 RWF per dress) to incentivize productivity\n\n' +
            '### Line Production (6+ Staff):\n' +
            'For larger orders, use assembly line system:\n' +
            '- Person 1: Cutting\n' +
            '- Person 2: Sewing main seams\n' +
            '- Person 3: Sewing details (collars, cuffs, zippers)\n' +
            '- Person 4: Finishing (hems, buttons, ironing)\n' +
            '- Person 5: Quality control and packaging\n\n' +
            '### Pricing for Wholesale Orders:\n' +
            'When scaling, you can offer wholesale prices:\n' +
            '- 1-10 pieces: Retail price\n' +
            '- 11-50 pieces: 10-15% discount\n' +
            '- 51-100 pieces: 15-25% discount\n' +
            '- 100+ pieces: 25-35% discount',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1560343776-97e42e3b5f48?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Test your production and quality control knowledge.',
            [
              {
                question: 'What is the first quality check you should do before cutting fabric?',
                options: [
                  'Check the colour is fashionable',
                  'Check fabric for defects like holes, stains, or uneven dye',
                  'Check the price tag',
                  'Check if the fabric is in style',
                ],
                correctIndex: 1,
                explanation: 'Always inspect fabric for defects before cutting. Catching a flaw early saves wasted time and materials.',
              },
              {
                question: 'What is the benefit of batching tasks in production?',
                options: [
                  'It is more boring for workers',
                  'It is more efficient than making one garment completely before starting the next',
                  'It uses less fabric',
                  'It requires fewer staff',
                ],
                correctIndex: 1,
                explanation: 'Batching tasks (cutting all pieces first, then sewing all of one type of seam) is much more efficient than making each garment one at a time.',
              },
              {
                question: 'What discount is typical for wholesale orders of 50+ pieces?',
                options: [
                  '5%',
                  '15-25%',
                  '50%',
                  'No discount for bulk',
                ],
                correctIndex: 1,
                explanation: 'For orders of 51-100 pieces, a standard wholesale discount is 15-25% off the retail price.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Production Plan Assignment',
            'Create a production plan for a small fashion collection.',
            'Apply what you have learned to plan your production process.',
            [
              {
                question: 'You receive an order for 20 identical dresses. Create a step-by-step production plan showing how you will batch tasks, manage quality checks, and schedule the work. Include estimated time for each step.',
                type: 'open',
                explanation: 'Consider: cutting all 20 at once, batching seam types, adding quality checks at each stage, building in buffer time for corrections.',
                points: 20,
              },
              {
                question: 'List 5 quality control checkpoints you will implement in your fashion business, explaining what you check at each point and why it matters.',
                type: 'open',
                explanation: 'Example: Check 1 - Before cutting (fabric defects). Check 2 - After cutting (pieces match pattern). Check 3 - During sewing (seam quality). Check 4 - Before finishing (fit check). Check 5 - Final (overall quality).',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Set up production, implement quality control, and scale your fashion business efficiently.',
      ),
      makeModule(
        'Module 5: Brand Building & Marketing Your Fashion Brand',
        'Create a strong fashion brand identity and market your products to customers in Rwanda and internationally.',
        [
          makeLesson(
            'Creating Your Fashion Brand Identity',
            'Your brand is more than your logo — it\'s the feeling customers get when they see your clothes. ' +
            'This lesson helps you define and build a fashion brand that stands out.\n\n' +
            '### Elements of a Strong Fashion Brand:\n' +
            '- **Brand name** — Memorable, easy to pronounce, available as a social media handle\n' +
            '- **Logo** — Simple, works in black and white, recognisable at small sizes (use Canva)\n' +
            '- **Brand colours** — 2-3 colours that represent your brand\n' +
            '- **Brand voice** — How you speak to customers (e.g., elegant, playful, professional)\n' +
            '- **Brand story** — Why you started, what makes your brand special\n\n' +
            '### Your Brand Story Template:\n' +
            '"I started [Brand Name] because I wanted to [problem you solve]. ' +
            'Growing up in Rwanda, I noticed that [insight about fashion gap]. ' +
            'My designs combine [traditional element] with [modern element] to create clothing ' +
            'that makes women/men feel [emotion]. Every piece is [quality promise]. ' +
            'When you wear [Brand Name], you are wearing [value proposition]."\n\n' +
            '### Creating a Brand Kit (Free Tools):\n' +
            '- **Canva** — design logo, business cards, lookbooks (www.canva.com)\n' +
            '- **Coolors.co** — create colour palettes\n' +
            '- **Google Fonts** — choose brand fonts\n' +
            '- **Remove.bg** — remove image backgrounds for product photos\n' +
            '- **Looka** — AI logo generation (paid, but affordable)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=gVvi_L8gIAI', videoTitle: 'How to Build a Fashion Brand from Scratch' },
          ),
          makeLesson(
            'Selling on Instagram: Your Fashion Storefront',
            'Instagram is the most powerful platform for fashion brands in Rwanda. This lesson teaches you how to ' +
            'set up and grow a fashion Instagram account that attracts customers.\n\n' +
            '### Setting Up Your Fashion Instagram:\n' +
            '1. Create a **business account** (not personal)\n' +
            '2. Write a clear bio: what you sell + location + contact\n' +
            '3. Link to your WhatsApp Business for orders\n' +
            '4. Use a consistent visual style for your feed\n' +
            '5. Post at least once daily (best times: 7-9 AM and 5-8 PM Kigali time)\n\n' +
            '### Content Ideas for Fashion Brands:\n' +
            '- **Product photos** — Flat lays, on mannequin, on models\n' +
            '- **Behind the scenes** — Show fabric selection, sewing process\n' +
            '- **Customer try-ons** — Share photos of happy customers (with permission)\n' +
            '- **Style tips** — How to wear your pieces, accessorize\n' +
            '- **Fabric stories** — Explain where your fabrics come from\n' +
            '- **Flash sales** — Limited-time discounts to create urgency\n' +
            '- **New arrivals** — Announce new collections\n\n' +
            '### Growing Your Following in Rwanda:\n' +
            '- Use hashtags: #RwandanFashion #KigaliStyle #MadeInRwanda #AfricanFashion\n' +
            '- Tag relevant accounts: @VisitRwanda, @KigaliFashionWeek, local influencers\n' +
            '- Collaborate with Rwandan models and photographers\n' +
            '- Run giveaways ("Tag a friend who loves fashion")\n' +
            '- Respond to every comment and DM within 24 hours\n' +
            '- Use Instagram Shopping if available in Rwanda',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=WeNY3NVcjY0', videoTitle: 'Instagram Marketing for Fashion Brands - Complete Guide' },
          ),
          makeLesson(
            'Selling on Etsy, Jumia & Exporting Internationally',
            'Reach customers beyond Rwanda by selling on international and regional platforms. ' +
            'This lesson covers how to sell on Etsy (global) and Jumia Fashion (Africa-wide).\n\n' +
            '### Selling on Etsy:\n' +
            '- **Listing fee**: $0.20 per item\n' +
            '- **Commission**: 5% of sale price\n' +
            '- **Payment processing**: 3% + $0.25 (via PayPal)\n' +
            '- **Best for**: Unique, handmade, African-inspired fashion\n' +
            '- **Tips**: High-quality photos, detailed descriptions, use tags like "African dress" "Kitenge"\n\n' +
            '### Selling on Jumia Fashion:\n' +
            '- **Commission**: 10-15% depending on category\n' +
            '- **Fulfillment**: You ship or use Jumia\'s warehouse\n' +
            '- **Payment**: Jumia handles collection, pays you\n' +
            '- **Best for**: Ready-to-wear clothing, accessories\n' +
            '- **Tips**: Competitive pricing, fast shipping, good product descriptions\n\n' +
            '### International Shipping:\n' +
            'To sell globally, you need reliable shipping:\n' +
            '- **RwandaPost** — Cheapest for small packages (but slow)\n' +
            '- **DHL/FedEx** — Fast but expensive (good for premium items)\n' +
            '- **Cargo services** — Options to Kenya, Uganda, Tanzania\n' +
            '- **Shipping costs** — A dress to the US/Europe: 15,000-30,000 RWF via air\n\n' +
            '### Receiving International Payments:\n' +
            '- **PayPal** — Most widely accepted (www.paypal.com)\n' +
            '- **Bank transfer** — For regular wholesale customers\n' +
            '- **WorldRemit/Wise** — Lower fees than bank transfers\n' +
            '- **Fees**: PayPal charges 2.9% + $0.30 per transaction',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Selling at Local Markets and Events in Rwanda',
            'Local markets and events are excellent for building brand awareness and making direct sales. ' +
            'Rwanda has many opportunities to showcase your fashion brand in person.\n\n' +
            '### Best Markets and Events in Rwanda:\n' +
            '- **Kigali Fashion Week** — The biggest fashion event in Rwanda (annual)\n' +
            '- **Rwanda Expo** — Annual trade fair showing Made in Rwanda products\n' +
            '- **HAGARIMANA** — Arts and crafts exhibition in Kigali\n' +
            '- **Kimironko Market** — Daily market, great for fabric and ready-to-wear\n' +
            '- **City Market** — Downtown Kigali, good for accessories\n' +
            '- **Milima Street Market** — Weekend market in Kimihurura\n' +
            '- **Boutique collaborations** — Partner with existing boutiques to stock your brand\n' +
            '- **Pop-up shops** — Rent temporary space at malls (Kigali Heights, UTC)\n\n' +
            '### How to Prepare for a Market:\n' +
            '1. **Apply early** — Popular events fill up months in advance\n' +
            '2. **Bring inventory** — Estimate 2x what you think you will sell\n' +
            '3. **Display well** — Good lighting, mannequins, clear pricing\n' +
            '4. **Accept payments** — Mobile money, cash, and card (use a POS machine)\n' +
            '5. **Collect contacts** — Have a signup sheet or QR code for Instagram\n' +
            '6. **Bring change** — Many customers pay in cash\n' +
            '7. **Brand your booth** — Banner, business cards, packaging with your logo\n\n' +
            '### Pricing at Markets:\n' +
            '- Stall fee: 5,000-50,000 RWF per day depending on the event\n' +
            '- Offer "market special" prices — slightly lower than your boutique/online prices\n' +
            '- Bundle deals: "Buy 2 pieces, get 10% off"',
            'article',
            4,
            { imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Test your brand building and marketing knowledge.',
            [
              {
                question: 'What is the most important platform for selling fashion in Rwanda?',
                options: ['Facebook', 'Instagram', 'Twitter', 'TikTok'],
                correctIndex: 1,
                explanation: 'Instagram is the most powerful platform for fashion brands in Rwanda, where visual content drives sales.',
              },
              {
                question: 'How much does Etsy charge per listing?',
                options: ['Free', '$0.20 per item', '$5 per item', '10% of sale price'],
                correctIndex: 1,
                explanation: 'Etsy charges $0.20 per item listing fee, plus a 5% commission on the sale price.',
              },
              {
                question: 'Which payment platform is most widely used for receiving international payments?',
                options: ['Mobile Money', 'PayPal', 'Cash', 'Bank cheque'],
                correctIndex: 1,
                explanation: 'PayPal is the most widely accepted international payment platform for small businesses selling globally.',
              },
            ],
            5,
          ),
        ],
        'Build a fashion brand identity, market on Instagram, sell on global platforms, and participate in local fashion events.',
      ),
      makeModule(
        'Module 6: Business Management — Pricing, Customers & Finances',
        'Learn to price your products, manage customers, handle finances, and grow a profitable fashion business.',
        [
          makeLesson(
            'Pricing Your Fashion Products',
            'Pricing is one of the hardest but most important decisions in your fashion business. This lesson teaches you ' +
            'how to calculate costs and set prices that are profitable and competitive.\n\n' +
            '### Cost Calculation Formula:\n' +
            '**Total Cost = Materials + Labour + Overheads + Marketing**\n\n' +
            '**Materials:** Fabric, thread, buttons, zippers, tags\n' +
            '**Labour:** Your time or your tailors\' wages\n' +
            '**Overheads:** Rent, electricity, machine maintenance\n' +
            '**Marketing:** Instagram ads, photoshoots, packaging\n\n' +
            '### Pricing Strategies:\n\n' +
            '**Markup Pricing (Simplest):**\n' +
            '- Calculate total cost per piece\n' +
            '- Add 50-100% markup for retail price\n' +
            '- Example: Cost = 8,000 RWF, Retail = 15,000-20,000 RWF\n\n' +
            '**Value-Based Pricing (Best for Brands):**\n' +
            '- Price based on perceived value and brand positioning\n' +
            '- Premium brands charge 3-5x cost\n' +
            '- Works well if you have a strong brand story\n\n' +
            '### Sample Pricing for a Simple Dress:\n' +
            '- Fabric (2 metres at 5,000 RWF/metre): 10,000 RWF\n' +
            '- Thread, zipper, buttons: 2,000 RWF\n' +
            '- Labour (3 hours at 2,000 RWF/hour): 6,000 RWF\n' +
            '- Overheads (20% of labour): 1,200 RWF\n' +
            '- = Total Cost: 19,200 RWF\n' +
            '- **Retail Price (60% markup): 30,000 RWF**',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=eW4EaHV2aJE', videoTitle: 'How to Price Your Fashion Products - Small Business Guide' },
          ),
          makeLesson(
            'Managing Customers and Building Loyalty',
            'Happy customers are the best marketing. This lesson teaches you how to manage customer relationships ' +
            'for repeat business and referrals.\n\n' +
            '### Customer Journey:\n' +
            '1. **Discovery** — Customer finds you on Instagram, market, or referral\n' +
            '2. **Interest** — They browse your products, ask questions\n' +
            '3. **Purchase** — They place an order or buy at a market\n' +
            '4. **Delivery** — They receive the product\n' +
            '5. **Post-purchase** — Follow up to ensure satisfaction\n' +
            '6. **Loyalty** — They come back and refer others\n\n' +
            '### Using WhatsApp Business:\n' +
            '- Create a WhatsApp Business account (www.whatsapp.com/business)\n' +
            '- Set up automated greeting messages\n' +
            '- Use labels: New Order, Payment Received, Completed, Delivered\n' +
            '- Create catalogues (show your products)\n' +
            '- Use broadcast lists for promotions (be careful not to spam)\n' +
            '- Set business hours so customers know when to expect replies\n\n' +
            '### Customer Service Tips:\n' +
            '- Respond to messages within 2 hours (or set expectations)\n' +
            '- Send order confirmation and tracking updates\n' +
            '- Always deliver on or before the promised date\n' +
            '- Handle complaints politely — offer a remake or refund if needed\n' +
            '- Ask for reviews and testimonials (share on Instagram)\n' +
            '- Offer referral discounts ("Refer a friend, both get 10% off")',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Managing Your Fashion Business Finances',
            'Good financial management keeps your fashion business alive. This lesson covers simple but effective ' +
            'financial practices for fashion entrepreneurs in Rwanda.\n\n' +
            '### Essential Financial Records:\n' +
            '- **Sales log** — Date, customer, items sold, price, payment method\n' +
            '- **Expense log** — Date, item, cost, category (materials, rent, marketing)\n' +
            '- **Inventory log** — What you have in stock, what you need to buy\n' +
            '- **Customer list** — Name, phone, preferences, order history\n\n' +
            '### Simple Bookkeeping (Free with Google Sheets):\n' +
            'Create a spreadsheet with these columns:\n' +
            '- **Income**: Date, Customer, Items, Amount, Payment Method, Notes\n' +
            '- **Expenses**: Date, Item, Category, Amount, Receipt?\n' +
            '- **Monthly Summary**: Total Income - Total Expenses = Profit\n\n' +
            '### Understanding Your Margins:\n' +
            '- **Gross Profit Margin** = (Selling Price - Cost of Goods) / Selling Price × 100\n' +
            '- **Target**: At least 50% gross margin for fashion\n' +
            '- **Example**: Selling price 30,000 RWF, cost 12,000 RWF\n' +
            '  = (30,000 - 12,000) / 30,000 × 100 = **60% margin** (Excellent!)\n\n' +
            '### Tax Obligations in Rwanda:\n' +
            '- Register with **RRA** (Rwanda Revenue Authority)\n' +
            '- Small businesses may qualify for **lump sum tax** (simplified)\n' +
            '- Keep receipts for all business expenses\n' +
            '- File taxes monthly or quarterly depending on your turnover\n' +
            '- Consult an accountant or visit RRA for guidance',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 6: Knowledge Check',
            'Test your business management knowledge.',
            [
              {
                question: 'What is a good gross profit margin target for a fashion business?',
                options: ['10%', '25%', '50% or more', '5%'],
                correctIndex: 2,
                explanation: 'A target of 50% or higher gross profit margin is recommended for fashion businesses to cover overheads and remain profitable.',
              },
              {
                question: 'Which tool is best for managing customer orders and inquiries in Rwanda?',
                options: ['Email only', 'WhatsApp Business', 'Phone calls only', 'Facebook Messenger'],
                correctIndex: 1,
                explanation: 'WhatsApp Business is the most popular and effective tool in Rwanda for managing customer orders, inquiries, and communication.',
              },
              {
                question: 'What is the first step for tax compliance as a fashion business in Rwanda?',
                options: [
                  'Hire an accountant',
                  'Register with the Rwanda Revenue Authority (RRA)',
                  'Open a business bank account',
                  'Print receipts',
                ],
                correctIndex: 1,
                explanation: 'All businesses in Rwanda must register with the RRA for tax purposes. You can then determine which tax regime applies to your business.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 6: Business Plan Assignment',
            'Create a mini business plan for your fashion venture.',
            'Demonstrate your understanding of pricing, customers, and financial management.',
            [
              {
                question: 'Calculate the cost and retail price for one product you want to sell. List materials needed, their costs, labour time, and overhead. Then show your markup percentage and final retail price.',
                type: 'open',
                explanation: 'Follow the cost calculation formula: Materials + Labour + Overheads = Total Cost. Then apply a 50-100% markup for retail price.',
                points: 25,
              },
              {
                question: 'Write a one-page summary of your fashion business plan including: your business name, what you will sell, who your target customers are, how you will price your products, how you will market (online and offline), and what your first 3-month goals are.',
                type: 'open',
                explanation: 'Be specific about your niche, target market in Rwanda, pricing approach, marketing channels (Instagram, WhatsApp, markets), and realistic goals.',
                points: 25,
              },
            ],
            5,
          ),
        ],
        'Price products profitably, manage customer relationships, and maintain healthy business finances.',
      ),
      makeModule(
        'Module 7: Final Project — Launch Your Fashion Brand',
        'Apply everything you have learned to plan and launch your own fashion brand.',
        [
          makeLesson(
            'Bringing It All Together: Your Fashion Brand Launch Plan',
            'This final module guides you through creating a complete launch plan for your fashion brand. ' +
            'You will use all the knowledge from previous modules to create a roadmap for your fashion business.\n\n' +
            '### Your Brand Launch Checklist:\n' +
            '**Week 1-2: Planning**\n' +
            '☐ Define your brand identity (name, logo, colours, story)\n' +
            '☐ Choose your business model (custom, ready-to-wear, etc.)\n' +
            '☐ Research your target customers\n' +
            '☐ Calculate startup costs and secure funding\n\n' +
            '**Week 3-4: Setup**\n' +
            '☐ Set up production space\n' +
            '☐ Source initial fabric inventory\n' +
            '☐ Buy/rent equipment (sewing machine, etc.)\n' +
            '☐ Create your Instagram and WhatsApp Business accounts\n' +
            '☐ Design your first collection (3-10 pieces)\n' +
            '☐ Create samples and test fit\n\n' +
            '**Week 5-6: Pre-Launch**\n' +
            '☐ Photograph your collection\n' +
            '☐ Create your Canva lookbook\n' +
            '☐ Set up pricing\n' +
            '☐ Prepare packaging with your brand\n' +
            '☐ Build pre-launch buzz on Instagram (teaser posts)\n' +
            '☐ Send samples to 1-2 local influencers\n\n' +
            '**Week 7-8: Launch**\n' +
            '☐ Launch on Instagram with a photoshoot\n' +
            '☐ List on Jumia Fashion or Etsy\n' +
            '☐ Host a small launch event or pop-up\n' +
            '☐ Start taking orders\n' +
            '☐ Collect customer feedback\n\n' +
            '### Key Resources:\n' +
            '- **Canva**: Brand design (www.canva.com)\n' +
            '- **Instagram**: Marketing (www.instagram.com)\n' +
            '- **WhatsApp Business**: Customer management (www.whatsapp.com/business)\n' +
            '- **Etsy**: International selling (www.etsy.com)\n' +
            '- **Jumia Fashion**: Regional selling (www.jumia.co.rw)\n' +
            '- **PayPal**: International payments (www.paypal.com)\n' +
            '- **Kimironko Market**: Fabric sourcing (visit in person)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=FTumBs8s3aw', videoTitle: 'How to Launch a Fashion Brand - Complete Step-by-Step Guide' },
          ),
          makeAssignmentLesson(
            'Final Project: Your Fashion Brand Launch Plan',
            'Complete this final assignment to earn your certificate.',
            'Create a comprehensive launch plan for your fashion brand.',
            [
              {
                question: 'Create a complete 8-week brand launch plan following the checklist above. For each week, list 3-5 specific actions you will take. Include estimated costs for each major expense.',
                type: 'open',
                explanation: 'Your plan should cover all phases: planning, setup, pre-launch, and launch. Include specific actions, timelines, and budget estimates.',
                points: 30,
              },
              {
                question: 'Design your brand identity package: Write your brand story (3-4 sentences), describe your brand colours, include a sketch or description of your logo concept, and describe your target customer in detail (age, income, location, style preferences).',
                type: 'open',
                explanation: 'Draw from Module 5 on brand building. Your brand identity should be cohesive and reflect what makes your fashion brand unique.',
                points: 30,
              },
              {
                question: 'Calculate your projected costs and revenue for the first 3 months. List: startup costs, monthly operating costs, projected monthly sales (units × price), and when you expect to break even.',
                type: 'open',
                explanation: 'Use the financial management skills from Module 6. Be realistic about costs and conservative about sales projections.',
                points: 30,
              },
            ],
            6,
            60,
          ),
        ],
        'Create a complete brand launch plan with budget, timeline, and marketing strategy.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 6: Kinyarwanda for Beginners (Internationals) — Speak from Day One
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Kinyarwanda for Beginners (Internationals) — Speak from Day One',
    description:
      '🗣️ Want to speak Kinyarwanda from your very first lesson? This course is designed for ' +
      'internationals, expats, and foreigners who know zero Kinyarwanda. You will learn by ' +
      'listening to native Kinyarwanda speakers, repeating key phrases, and practising real-life ' +
      'conversations — greetings, introductions, ordering food, asking directions, and more. ' +
      'No textbook required. Just listen, repeat, and speak! Perfect for volunteers, students, ' +
      'researchers, and anyone new to Rwanda who wants to connect with locals in their language.',
    category: 'Languages',
    level: 'Beginner',
    price: 1000,
    searchImage: 'kinyarwanda language learning beginners africa international',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Your First Words in Kinyarwanda (Immersion Method)',
        'Learn by hearing and repeating. These lessons use Kinyarwanda speech with clear explanations — just like being in Rwanda!',
        [
          makeLesson(
            'Hear & Repeat: The Kinyarwanda Alphabet and Pronunciation',
            'Kinyarwanda is a phonetic language — once you learn the sounds, you can read any word. ' +
            'In this lesson, a native speaker guides you through each letter with examples. ' +
            'Your only task: listen carefully and repeat out loud.\\n\\n' +
            '### How to Use This Lesson:\\n' +
            '1. Watch the video and listen to each letter sound\\n' +
            '2. Pause after each letter and repeat it 3 times\\n' +
            '3. Pay attention to the 5 vowels: a (ah), e (eh), i (ee), o (oh), u (oo)\\n' +
            '4. Practice the special consonant combinations: ny, ry, sh, ts, mw\\n' +
            '5. Try to say the example words before the speaker does\\n\\n' +
            '### Why Immersion Works:\\n' +
            'When you hear a language and repeat it immediately, your brain builds stronger connections. ' +
            'You are not just learning rules — you are training your ear and your mouth to work together. ' +
            'This is how children learn their first language, and it works for adults too!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=xOU7nfCc_y4', videoTitle: 'Kinyarwanda Alphabet and Pronunciation - Lesson 2' },
          ),
          makeLesson(
            'First Greetings: Muraho! Amakuru?',
            'Greetings are the most important part of Kinyarwanda culture. Rwandans greet each other ' +
            'many times a day, and skipping a greeting is considered impolite. Learn these phrases ' +
            'and practise them every time you meet someone.\\n\\n' +
            '### Greetings You Will Use Every Day:\\n' +
            '- **Muraho!** — Hello! (general greeting, polite form)\\n' +
            '- **Amakuru?** — How are you? / What is the news?\\n' +
            '- **Ni meza** — I am fine (response)\\n' +
            '- **Mwaramutse** — Good morning\\n' +
            '- **Mwiriwe** — Good afternoon / Good evening\\n' +
            '- **Urakoze** — Thank you\\n' +
            '- **Murabeho** — Goodbye (to someone staying)\\n' +
            '- **Mugende neza** — Goodbye (to someone leaving)\\n\\n' +
            '### Daily Practice:\\n' +
            '- Greet everyone you meet with Muraho\\n' +
            '- When someone asks Amakuru, reply Ni meza and ask back: Amakuru?\\n' +
            '- Practise with the video — repeat each phrase 5 times\\n' +
            '- By the end of this lesson, you should be able to greet someone without thinking!',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=BZCuHpFhuaQ', videoTitle: 'Kinyarwanda Greetings - Lesson 1 for Beginners' },
          ),
          makeLesson(
            'Introduce Yourself: Nitwa..., Ndi...',
            'Now that you can greet people, learn to tell them who you are! In Kinyarwanda, ' +
            'introducing yourself is simple and follows a clear pattern. Watch the video, then practise ' +
            'creating your own introduction.\\n\\n' +
            '### Introduction Pattern:\\n' +
            '- **Nitwa [your name]** — My name is [your name]\\n' +
            '- **Ndi mu [country/city]** — I am from [country/city]\\n' +
            '- **Ndi [job/role]** — I am a [job/role]\\n' +
            '- **Nkunda...** — I like...\\n' +
            '- **Ndi umunyeshuri / umukozi** — I am a student / worker\\n\\n' +
            '### Your First Self-Introduction (Practise Aloud):\\n' +
            '"Muraho! Nitwa [your name]. Ndi mu [your country]. Ndi [your job]. Ndi hano mu Rwanda nkunda igihugu cyanyu. Murakoze!"\\n' +
            '\\nTranslation: Hello! My name is [name]. I am from [country]. I am a [job]. I am here in Rwanda and I like your country. Thank you!\\n\\n' +
            'Write your own introduction and practise saying it until it feels natural.',
            'video',
            3,
            { videoUrl: 'https://www.youtube.com/watch?v=tV0metUxKFo', videoTitle: 'How to Introduce Yourself in Kinyarwanda - Lesson 3' },
          ),
          makeQuizLesson(
            'Module 1: Listening & Speaking Check',
            'Test your understanding of the first Kinyarwanda words and phrases you learned.',
            [
              {
                question: 'What does "Muraho" mean in Kinyarwanda?',
                options: ['Goodbye', 'Thank you', 'Hello', 'Good morning'],
                correctIndex: 2,
                explanation: 'Muraho is the general greeting meaning "Hello" in Kinyarwanda. It is polite and can be used any time of day.',
              },
              {
                question: 'When someone asks you "Amakuru?" what should you reply?',
                options: ['Murabeho', 'Ni meza', 'Urakoze', 'Mwaramutse'],
                correctIndex: 1,
                explanation: 'Ni meza means "I am fine" and is the standard response to "Amakuru?" (How are you?).',
              },
              {
                question: 'How do you say "My name is..." in Kinyarwanda?',
                options: ['Ndi...', 'Nitwa...', 'Nkunda...', 'Ni...'],
                correctIndex: 1,
                explanation: 'Nitwa means "My name is" in Kinyarwanda. For example: "Nitwa John" means "My name is John".',
              },
              {
                question: 'Which greeting do you use in the morning in Kinyarwanda?',
                options: ['Mwiriwe', 'Mwaramutse', 'Muraho', 'Urakoze'],
                correctIndex: 1,
                explanation: 'Mwaramutse is the morning greeting, meaning "Good morning" in Kinyarwanda.',
              },
            ],
            4,
          ),
        ],
        'Greet someone in Kinyarwanda, introduce yourself, and understand basic pronunciation.',
      ),
      makeModule(
        'Module 2: Building Your Kinyarwanda Vocabulary',
        'Expand what you can say with numbers, days, family words, and colours — all through native Kinyarwanda speech.',
        [
          makeLesson(
            'Counting in Kinyarwanda: Numbers 1-100',
            'Numbers are essential for shopping, telling time, and everyday life. In Kinyarwanda, numbers follow a logical pattern. ' +
            'Listen to the video and count along with the speaker.\\n\\n' +
            '### Numbers 1-10:\\n' +
            '1 = Rimwe, 2 = Kabiri, 3 = Gatatu, 4 = Kane, 5 = Gatanu\\n' +
            '6 = Gatandatu, 7 = Karindwi, 8 = Umunani, 9 = Icyenda, 10 = Icumi\\n\\n' +
            '### Numbers 11-20 (Pattern: Icumi na...):\\n' +
            '11 = Icumi na rimwe, 12 = Icumi na kabiri, ..., 20 = Makumyabiri\\n\\n' +
            '### Tens (20-100):\\n' +
            '20 = Makumyabiri, 30 = Mirongo itatu, 40 = Mirongo ine, 50 = Mirongo itanu\\n' +
            '60 = Mirongo itandatu, 70 = Mirongo irindwi, 80 = Mirongo inani, 90 = Mirongo icyenda, 100 = Ijana\\n\\n' +
            '### Practice Drill:\\n' +
            '- Count 1-10 aloud 3 times\\n' +
            '- Say your age in Kinyarwanda: "Mfite [age]"\\n' +
            '- Say how much something costs: "[Number] amafaranga" (francs / money)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=pnSJPFRJ99g', videoTitle: 'Kinyarwanda Numbers - Lesson 4 for Beginners' },
          ),
          makeLesson(
            'Days, Weeks & Months in Kinyarwanda',
            'Knowing the days and months helps you make plans, talk about your schedule, and understand when things happen. ' +
            'The Kinyarwanda week starts on Monday.\\n\\n' +
            '### Days of the Week:\\n' +
            '- Kuwa mbere — Monday (lit. "first day")\\n' +
            '- Kuwa kabiri — Tuesday\\n' +
            '- Kuwa gatatu — Wednesday\\n' +
            '- Kuwa kane — Thursday\\n' +
            '- Kuwa gatanu — Friday\\n' +
            '- Kuwa gatandatu — Saturday\\n' +
            '- Ku cyumweru — Sunday\\n\\n' +
            '### Months (Amezi):\\n' +
            'Mutarama, Gashyantare, Werurwe, Mata, Gicurasi, Kamena\\n' +
            'Nyakanga, Kanama, Nzeli, Ukwakira, Ugushyingo, Ukuboza\\n\\n' +
            '### Daily Practice:\\n' +
            '- Each morning, say today\'s day in Kinyarwanda\\n' +
            '- When making plans, say the day in Kinyarwanda\\n' +
            '- "Uyu munsi ni..." — Today is...\\n' +
            '- "Ejo ni..." — Tomorrow is...',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=xTkw_dSy6zU', videoTitle: 'Kinyarwanda Days, Weeks & Months - Lesson 6' },
          ),
          makeLesson(
            'Family Members: Abagize Umuryango',
            'Family is central to Rwandan culture. Knowing how to talk about your family helps you connect with people ' +
            'on a personal level.\\n\\n' +
            '### Key Family Words:\\n' +
            '- Umuryango — Family\\n' +
            '- Mama / Mawe — Mother\\n' +
            '- Papa / Dawe — Father\\n' +
            '- Umwana — Child\\n' +
            '- Abana — Children\\n' +
            '- Mushiki wange — My sister (male speaker)\\n' +
            '- Murumuna wange — My younger sibling\\n' +
            '- Data — My father\\n' +
            '- Nyina — His/her mother\\n' +
            '- Sekuru — Grandfather / Uncle\\n' +
            '- Nyogokuru — Grandmother\\n' +
            '- Umugabo — Husband / Man\\n' +
            '- Umugore — Wife / Woman\\n\\n' +
            '### Practise Talking About Your Family:\\n' +
            '"Mama wange yitwa [name]. Data wange yitwa [name]. Mfite [number] bana / barumuna na bashiki."\\n' +
            '(My mother is called [name]. My father is called [name]. I have [number] children / siblings.)',
            'video',
            3,
            { videoUrl: 'https://www.youtube.com/watch?v=q7Vl2eQIvIo', videoTitle: 'Kinyarwanda Family Members - Lesson 12' },
          ),
          makeLesson(
            'Colours: Amabara',
            'Colours help you describe things — what you are wearing, what you want to buy, or what you see around you.\\n\\n' +
            '### Colours in Kinyarwanda:\\n' +
            '- Umukara — Black\\n' +
            '- Umweru — White\\n' +
            '- Utukura — Red\\n' +
            '- Ubururu — Blue\\n' +
            '- Ubusatsi / icyatsi — Green\\n' +
            '- Umuhondo — Yellow\\n' +
            '- Ikigina — Orange\\n' +
            '- Umukara n\'umweru — Grey (black and white)\\n' +
            '- Icyatsi kibisi — Light green\\n\\n' +
            '### Practice Activity:\\n' +
            '- Look around the room and name 5 things with their colours\\n' +
            '- Example: "Igitabo cy\'ubururu" = The blue book\\n' +
            '- "Umuze ubutuku" = The red dress\\n' +
            '- Describe what you are wearing today: "Nambaye [colour]..."',
            'video',
            4,
            { videoUrl: 'https://www.youtube.com/watch?v=RJAndvI_0FE', videoTitle: 'Kinyarwanda Colors / Amabara - Lesson 14' },
          ),
          makeQuizLesson(
            'Module 2: Vocabulary Check',
            'Test your vocabulary knowledge — numbers, days, family, and colours.',
            [
              {
                question: 'How do you say "five" in Kinyarwanda?',
                options: ['Kane', 'Gatanu', 'Gatandatu', 'Icumi'],
                correctIndex: 1,
                explanation: 'Gatanu means five in Kinyarwanda. Kane = four, Gatandatu = six, Icumi = ten.',
              },
              {
                question: 'What is "Kuwa mbere" in Kinyarwanda?',
                options: ['Sunday', 'Tuesday', 'Monday', 'Friday'],
                correctIndex: 2,
                explanation: 'Kuwa mbere means Monday (literally "first day"). The Kinyarwanda week starts on Monday.',
              },
              {
                question: 'How do you say "mother" in Kinyarwanda?',
                options: ['Data', 'Mama', 'Sekuru', 'Umwana'],
                correctIndex: 1,
                explanation: 'Mama or Mawe means mother in Kinyarwanda. Data = my father, Sekuru = grandfather/uncle, Umwana = child.',
              },
              {
                question: 'What is the Kinyarwanda word for the colour blue?',
                options: ['Ubururu', 'Utukura', 'Umuhondo', 'Icyatsi'],
                correctIndex: 0,
                explanation: 'Ubururu means blue. Utukura = red, Umuhondo = yellow, Icyatsi = green.',
              },
            ],
            5,
          ),
        ],
        'Count from 1-100, say the days and months, name family members, and describe things by colour in Kinyarwanda.',
      ),
      makeModule(
        'Module 3: Everyday Life in Kinyarwanda',
        'Learn the words you need for daily activities — food, health, actions, and the weather.',
        [
          makeLesson(
            'Food, Drinks & Eating Out',
            'Rwanda has delicious food! Learn how to talk about what you eat and drink, order at a restaurant, ' +
            'and shop at the market.\\n\\n' +
            '### Common Foods:\\n' +
            '- Ibijumba — Sweet potatoes\\n' +
            '- Ibirayi — Potatoes\\n' +
            '- Umuceri — Rice\\n' +
            '- Ibishyimbo — Beans\\n' +
            '- Isombe — Cassava leaves (traditional dish)\\n' +
            '- Inyama — Meat\\n' +
            '- Amagi — Eggs\\n' +
            '- Ubunyobwa — Peanuts / Groundnuts\\n' +
            '- Imbuto — Fruits\\n\\n' +
            '### Drinks:\\n' +
            '- Amazi — Water\\n' +
            '- Ikawa — Coffee\\n' +
            '- Icyayi — Tea\\n' +
            '- Ikivuguto — Fermented milk (traditional drink)\\n' +
            '- Urwagwa — Banana beer (traditional)\\n\\n' +
            '### Useful Phrases:\\n' +
            '- "Ndashaka..." — I want...\\n' +
            '- "Nkeneye..." — I need...\\n' +
            '- "Bingahe?" — How much is it?\\n' +
            '- "Mpa..." — Give me...\\n' +
            '- "Biraryoshe!" — It is delicious!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=fFgzEt0LQ3Y', videoTitle: 'Food, Snacks and Drinks in Kinyarwanda' },
          ),
          makeLesson(
            'Body Parts and Health',
            'Knowing body parts helps you describe pain, visit a clinic, or talk about health. ' +
            'This is especially important for volunteers and aid workers in Rwanda.\\n\\n' +
            '### Key Body Parts:\\n' +
            '- Umutwe — Head\\n' +
            '- Amaso — Eyes\\n' +
            '- Umunwa — Mouth\\n' +
            '- Amatwi — Ears\\n' +
            '- Intoki — Fingers / Hands\\n' +
            '- Amaguru — Legs / Feet\\n' +
            '- Umugongo — Back\\n' +
            '- Umutima — Heart\\n' +
            '- Amara — Stomach / Intestines\\n' +
            '- Amenyo — Teeth\\n\\n' +
            '### At the Clinic:\\n' +
            '- "Ndarwaye" — I am sick\\n' +
            '- "Ntumenye neza" — I do not feel well\\n' +
            '- "Biribabaza hano" — It hurts here\\n' +
            '- "Mfite umuriro" — I have a fever\\n' +
            '- "Mfite umutwe" — I have a headache\\n' +
            '- "Nkenera abaganga / ibitaro" — I need a doctor / hospital',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=uEIu7tYYMF0', videoTitle: 'Kinyarwanda Body Parts - Lesson 11' },
          ),
          makeLesson(
            'Common Verbs: Actions You Use Every Day',
            'Verbs are the engine of any language. Learn the most common Kinyarwanda verbs and start ' +
            'using them immediately in simple sentences.\\n\\n' +
            '### Everyday Verbs:\\n' +
            '- Gukora — To do / to work\\n' +
            '- Kurya — To eat\\n' +
            '- Kunywa — To drink\\n' +
            '- Kujya — To go\\n' +
            '- Kuza — To come\\n' +
            '- Kuvuga — To speak\\n' +
            '- Kumva — To hear / to understand\\n' +
            '- Gukina — To play\\n' +
            '- Kugura — To buy\\n' +
            '- Guteka — To cook\\n' +
            '- Kugenda — To walk / to leave\\n' +
            '- Gukunda — To love / to like\\n' +
            '- Kuryama — To sleep\\n' +
            '- Kwiga — To learn / to study\\n\\n' +
            '### Using Verbs in Sentences:\\n' +
            '- "Nkora i Kigali" — I work in Kigali\\n' +
            '- "Ndarya ibijumba" — I am eating sweet potatoes\\n' +
            '- "Ndashaka kujya mu isoko" — I want to go to the market\\n' +
            '- "Mvuga Kinyarwanda bike" — I speak a little Kinyarwanda\\n' +
            '- "Ndiga Kinyarwanda" — I am learning Kinyarwanda',
            'video',
            3,
            { videoUrl: 'https://www.youtube.com/watch?v=T8gOknlUkjg', videoTitle: '100 Kinyarwanda Verbs Part 5 - Common Actions' },
          ),
          makeLesson(
            'Seasons and Weather: Ibihe by\'Umwaka',
            'Rwanda has two rainy seasons and two dry seasons. Talking about the weather is a common conversation starter.\\n\\n' +
            '### Seasons (Ibihe by\'Umwaka):\\n' +
            '- Icyitondo — Morning\\n' +
            '- Amanywa — Midday / Afternoon\\n' +
            '- Nimugoroba — Evening\\n' +
            '- Ijoro — Night\\n' +
            '- Impeshyi — Long rainy season (March - May)\\n' +
            '- Icyi — Dry season (June - August)\\n' +
            '- Umuhindo — Short rainy season (September - November)\\n' +
            '- Icye — Short dry season (December - February)\\n\\n' +
            '### Weather Words:\\n' +
            '- Imvura — Rain\\n' +
            '- Izuba — Sun\\n' +
            '- Umuyaga — Wind\\n' +
            '- Ubukonje — Cold\\n' +
            '- Ubushyuhe — Heat\\n' +
            '- "Irakonje" — It is cold\\n' +
            '- "Irashyuha" — It is hot\\n' +
            '- "Iragwa" / "Irava" — It is raining\\n' +
            '- "Izuba riravu" — The sun is shining',
            'video',
            4,
            { videoUrl: 'https://www.youtube.com/watch?v=j7CTMgCcRf0', videoTitle: 'Ibihe by\'Umwaka - Seasons in Kinyarwanda' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test your everyday vocabulary — food, health, verbs, and weather.',
            [
              {
                question: 'How do you say "I want" in Kinyarwanda?',
                options: ['Ndi...', 'Ndashaka...', 'Njye...', 'Ndakora...'],
                correctIndex: 1,
                explanation: 'Ndashaka means "I want" in Kinyarwanda. Example: "Ndashaka amazi" = I want water.',
              },
              {
                question: 'What does "Ndarwaye" mean?',
                options: ['I am tired', 'I am happy', 'I am sick', 'I am going'],
                correctIndex: 2,
                explanation: 'Ndarwaye means "I am sick" — a very useful phrase when visiting a clinic in Rwanda.',
              },
              {
                question: 'Which verb means "to learn" in Kinyarwanda?',
                options: ['Kurya', 'Kwiga', 'Kugenda', 'Kuvuga'],
                correctIndex: 1,
                explanation: 'Kwiga means to learn or to study. "Ndiga Kinyarwanda" = I am learning Kinyarwanda.',
              },
              {
                question: 'What does "Imvura" mean in Kinyarwanda?',
                options: ['Sun', 'Wind', 'Rain', 'Cold'],
                correctIndex: 2,
                explanation: 'Imvura means rain. "Iragwa" or "Irava" means it is raining.',
              },
            ],
            5,
          ),
        ],
        'Order food, describe how you feel, use common verbs, and talk about the weather in Kinyarwanda.',
      ),
      makeModule(
        'Module 4: Speaking with Confidence in Real Life',
        'Put it all together! Learn essential phrases, practise real conversations, and gain confidence speaking Kinyarwanda.',
        [
          makeLesson(
            'Top 10 Kinyarwanda Phrases for Daily Life',
            'These are the phrases you will use every single day as a foreigner in Rwanda. ' +
            'Learn them, practise them, and use them everywhere — at the market, at work, with friends, and with neighbours.\\n\\n' +
            '### Top 10 Phrases:\\n' +
            '1. **"Muraho!"** — Hello! (use with everyone)\\n' +
            '2. **"Amakuru?" / "Ni meza"** — How are you? / I am fine\\n' +
            '3. **"Urakoze cyane"** — Thank you very much\\n' +
            '4. **"Mbabarira"** — Excuse me / I am sorry\\n' +
            '5. **"Mvuga Kinyarwanda gake gake"** — I speak a little Kinyarwanda\\n' +
            '6. **"Bingahe?"** — How much is it?\\n' +
            '7. **"Mpa [thing]"** — Give me [thing]\\n' +
            '8. **"Ndasoma... / Ndashaka..."** — I am buying... / I want...\\n' +
            '9. **"Hano" / "Hariya"** — Here / There\\n' +
            '10. **"Murabeho" / "Mugende neza"** — Goodbye\\n\\n' +
            '### Pro Tip for Foreigners:\\n' +
            'Rwandans LOVE it when foreigners try to speak Kinyarwanda. Even if you make mistakes, ' +
            'people will appreciate your effort and help you improve. Smile, make eye contact, and just speak!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=zhLQmy0w0Fc', videoTitle: 'Top 10 Common Kinyarwanda-English Phrases' },
          ),
          makeLesson(
            'Full Conversation Practice: Listen and Repeat',
            'This lesson is a complete conversation in Kinyarwanda. Listen to the dialogue, understand the context, ' +
            'and practise each line until you can say it naturally.\\n\\n' +
            '### How to Practise:\\n' +
            '1. Listen to the full conversation once without pausing\\n' +
            '2. Listen again and read the translation (below)\\n' +
            '3. Pause after each line and repeat it aloud 3 times\\n' +
            '4. Practise both roles in the conversation\\n' +
            '5. Record yourself and compare with the native speakers\\n' +
            '6. Find a language partner and practise together\\n\\n' +
            '### Conversation: At the Market (Ku Isoko)\\n' +
            '**You:** Muraho!\\n' +
            '**Seller:** Muraho! Amakuru?\\n' +
            '**You:** Ni meza. Amakuru?\\n' +
            '**Seller:** Ni meza. Ushaka iki? (What do you want?)\\n' +
            '**You:** Ndashaka ibirayi. Bingahe? (I want potatoes. How much?)\\n' +
            '**Seller:** Amafaranga igihumbi. (1000 francs.)\\n' +
            '**You:** Mpa ibiro bibiri. (Give me two kilos.)\\n' +
            '**Seller:** Aha ni byo. (Here you are.)\\n' +
            '**You:** Urakoze cyane! Murabeho. (Thank you very much! Goodbye.)\\n' +
            '**Seller:** Murabeho!\\n\\n' +
            'Practise this dialogue until you can say it without looking at the text!',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=pNcSZaJ2u7M', videoTitle: 'Kinyarwanda Conversation Practice for Beginners' },
          ),
          makeQuizLesson(
            'Module 4: Real-Life Communication Check',
            'Test your ability to handle real situations in Kinyarwanda.',
            [
              {
                question: 'What should you say when you want to ask "How much is it?" at the market?',
                options: ['Bingahe?', 'Mpa...', 'Ndashaka...', 'Hano'],
                correctIndex: 0,
                explanation: '"Bingahe?" means "How much is it?" — essential for shopping at the market.',
              },
              {
                question: 'If a Rwandan says "Amakuru?" to you, the correct response is:',
                options: ['Murabeho', 'Ni meza', 'Urakoze', 'Hariya'],
                correctIndex: 1,
                explanation: '"Ni meza" means "I am fine" and is the standard polite response to "Amakuru?" (How are you?).',
              },
              {
                question: 'What does "Mpa ibiro bibiri" mean?',
                options: ['I want two', 'Give me two kilos', 'How much is it', 'Thank you very much'],
                correctIndex: 1,
                explanation: '"Mpa" = give me, "ibiro bibiri" = two kilos. A very useful phrase at the market!',
              },
              {
                question: 'If you make a mistake while speaking Kinyarwanda, what should you do?',
                options: ['Stop speaking completely', 'Apologise and keep trying', 'Switch to English', 'Get frustrated'],
                correctIndex: 1,
                explanation: 'Rwandans appreciate any effort to speak their language. Just say "Mbabarira" (sorry) and keep trying!',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 4: Your First Kinyarwanda Conversation',
            'Demonstrate your ability to have a real conversation in Kinyarwanda.',
            'Complete these exercises to show you can speak Kinyarwanda in real situations.',
            [
              {
                question: 'Write a full self-introduction in Kinyarwanda (at least 6 sentences). Include: a greeting, your name, where you are from, what you do, something you like, and a farewell. Read it aloud 5 times until it feels natural.',
                type: 'open',
                explanation: 'Use the pattern from Module 1: Muraho! Nitwa [name]. Ndi mu [country]. Ndi [job]. Nkunda [something]. Murabeho!',
                points: 20,
              },
              {
                question: 'Imagine you are at the Kigali market. Write a dialogue (at least 8 exchanges) between you and a seller. Include: greeting, asking how they are, saying what you want to buy, asking the price, negotiating or accepting, thanking, and saying goodbye.',
                type: 'open',
                explanation: 'Use the dialogue from Module 4 as a model. Include Kinyarwanda phrases for greeting, asking, buying, thanking, and farewell.',
                points: 25,
              },
            ],
            4,
          ),
        ],
        'Handle common real-life situations in Kinyarwanda — shopping, introductions, and daily conversations with confidence.',
      ),
    ],
  },
]

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seedRwandaCourses() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Check if courses already exist
    const existing = await Course.countDocuments({});
    console.log(`📊 Existing courses in database: ${existing}`);

    // Find an instructor (admin/trainer) to assign to courses
    let instructor = await User.findOne({ role: { $in: ['admin', 'trainer', 'super_admin'] } });
    if (!instructor) {
      console.log('No admin/trainer found. Creating a default instructor...');
      instructor = await new User({
        username: 'default_instructor',
        email: 'instructor@bootskills.com',
        password: 'Password@123',
        role: 'admin',
        fullName: 'Bootskills Instructor',
        isVerified: true,
      }).save();
      console.log('✅ Created default instructor:', instructor.fullName);
    } else {
      console.log('✅ Using instructor:', instructor.fullName || instructor.email);
    }

    let createdCount = 0;
    let skippedCount = 0;
    const warnings: string[] = [];

    for (const courseData of COURSES) {
      try {
        // Check if course already exists by title
        const exists = await Course.findOne({ title: courseData.title });
        if (exists) {
          console.log(`⏭️  Skipping (already exists): ${courseData.title}`);
          skippedCount++;
          continue;
        }

        // Fetch a high-quality image from Pexels if we have an API key
        let thumbnailUrl = '';
        if (HAS_PEXELS_KEY) {
          try {
            thumbnailUrl = await getCourseIllustrationUrl(courseData.searchImage);
          } catch (imgErr) {
            console.warn(`⚠️  Image fetch failed for "${courseData.title}": ${imgErr}`);
          }
        }

        // Verify the image URL if we got one
        if (thumbnailUrl) {
          try {
            const isValid = await verifyImageUrl(thumbnailUrl);
            if (!isValid) {
              warnings.push(`Image URL may not work: ${courseData.title}`);
            }
          } catch {
            warnings.push(`Image verification error: ${courseData.title}`);
          }
        }

        // Create the course
        const course = new Course({
          ...courseData,
          instructor: instructor._id,
          createdBy: instructor._id,
          thumbnail: thumbnailUrl || undefined,
          isPublished: true,
          language: 'English',
        });

        await course.save();
        console.log(`✅ Created: ${courseData.title} (RWF ${courseData.price.toLocaleString()})`);
        createdCount++;
      } catch (err) {
        console.error(`❌ Failed to create course "${courseData.title}":`, err);
        warnings.push(`Failed to create: ${courseData.title}`);
      }
    }

    // ─── Summary ──────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════');
    console.log('📋  SEEDING SUMMARY');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Created: ${createdCount} course(s)`);
    console.log(`⏭️  Skipped: ${skippedCount} course(s) (already exist)`);
    console.log(`📚 Total courses in seed: ${COURSES.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    warnings.forEach((w) => console.log(`   ⚠️  ${w}`));

    // ─── Pricing Summary ──────────────────────────────────────────────────
    console.log('\n💰  PRICING SUMMARY');
    console.log('─────────────────────────────────────────────────');
    COURSES.forEach((c) => {
      const price = c.discountPrice
        ? `RWF ${c.discountPrice.toLocaleString()} (was RWF ${c.price.toLocaleString()})`
        : `RWF ${c.price.toLocaleString()}`;
      console.log(`   • ${c.title}: ${price}`);
    });

    // ─── Image Verification ────────────────────────────────────────────────
    console.log('\n🖼️  COURSE THUMBNAILS');
    console.log('─────────────────────────────────────────────────');
    const seededCourses = await Course.find({ title: { $in: COURSES.map((c) => c.title) } });
    for (const sc of seededCourses) {
      const status = sc.thumbnail ? '✅' : '❌';
      const thumb = sc.thumbnail ? sc.thumbnail.slice(0, 60) + '...' : 'No thumbnail';
      console.log(`   ${status} ${sc.title}`);
      console.log(`      ${thumb}`);
    }

    console.log('\n🎉 Rwanda courses seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedRwandaCourses();
