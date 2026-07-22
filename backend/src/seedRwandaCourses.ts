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
    price: 1500,
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
    price: 2000,
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
    price: 2000,
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
    price: 2000,
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
  // COURSE 5: Kinyarwanda for Beginners (Internationals) — Speak from Day One
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
    price: 2000,
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
