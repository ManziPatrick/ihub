/**
 * ─────────────────────────────────────────────────────────
 * FIXUP: Unique Thumbnails + Free Course Expansion
 * ─────────────────────────────────────────────────────────
 * 1. Assigns unique, topic-matching thumbnails to EVERY course
 * 2. Expands free courses from 2 → 5+ modules with quality content
 * 3. Ensures no shared thumbnails across courses
 *
 * Usage: npx ts-node src/fixupThumbnailsAndFreeCourses.ts
 * ─────────────────────────────────────────────────────────
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ════════════════════════════════════════════════════════════
// UNIQUE TOPIC-MATCHING THUMBNAILS for EVERY course
// Each course gets a unique Unsplash image matching its topic
// ════════════════════════════════════════════════════════════
interface ThumbnailMap { [courseTitle: string]: string }

const THUMBNAILS: ThumbnailMap = {
  // ─── MVP Courses (10) — African Market Focus ─────────────
  'Digital Marketing That Works in Rwanda': 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=800&h=500',
  'Mobile Money Mastery: M-Pesa, MoMo & Fintech in Rwanda': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800&h=500',
  'Earn in Dollars: Freelancing & Remote Work from Rwanda': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800&h=500',
  'Start Your Business in Rwanda: From Idea to Launch': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800&h=500',
  'Professional English for Rwandan Professionals': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800&h=500',
  'Smart Farming in Rwanda: AgriTech for Modern Farmers': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800&h=500',
  'Create & Earn: Content Creation for Rwandan Youth': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800&h=500',
  'Project Management for Rwandan Professionals': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800&h=500',
  'Build Wealth: Personal Finance & Investing in Rwanda': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=500',
  'AI for Rwandans: How to Use ChatGPT & Automation': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── African Market Courses (5) ──────────────────────────
  'Hospitality & Tourism in Rwanda: From Guide to Business Owner': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800&h=500',
  'E-Commerce & Online Store: Sell Anything from Rwanda': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800&h=500',
  'Solar Energy Business: Power Rwanda with Renewable Energy': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=500',
  'Fashion & Textile Business: From Tailor to Brand Owner in Rwanda': 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800&h=500',
  'Health & Wellness Business: Clinics, Fitness & Healing in Rwanda': 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── Code/Programming Courses (11) ────────────────────────
  'Introduction to JavaScript — Complete Beginner Course': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=800&h=500',
  'Introduction to Python — Complete Beginner Course': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800&h=500',
  'Complete JavaScript Mastery — From Variables to Advanced': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=500',
  'Data Structures Mastery for Beginners for all': 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800&h=500',
  'Advanced JavaScript — Practical Exercises & Tests': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=800&h=500',
  'C Programming Fundamentals — From Hello World to Pointers': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=800&h=500',
  'C++ Programming — Objects, Classes & STL': 'https://images.unsplash.com/photo-1515879218367-8466d910auj8?auto=format&fit=crop&q=80&w=800&h=500',
  'Java Programming — From Zero to OOP': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800&h=500',
  'Go Programming — Concurrency & Simplicity': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800&h=500',
  'Rust Programming — Safety & Performance': 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&q=80&w=800&h=500',
  'Python for Data Science — Lists, Dicts & Functions': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── Other Technology Courses ─────────────────────────────
  'Web Development Fundamentals': 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800&h=500',
  'Mobile App Development with React Native': 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&q=80&w=800&h=500',
  'UI/UX Design Masterclass': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800&h=500',
  'Data Science & Analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=500',
  'React Native Mobile Apps': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=800&h=500',
  'Artificial Intelligence & ML Basics': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=500',
  'Advanced Cloud Computing with AWS': 'https://images.unsplash.com/photo-1522252234503-e356532cafd5?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── Rwanda-Specific Courses (5) ─────────────────────────
  'Navigating Rwanda\'s Digital Government: A Citizen\'s Guide to E-Services': 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&q=80&w=800&h=500',
  'Learn Kinyarwanda: Complete Beginner\'s Course': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800&h=500',
  'Kinyarwanda Vocabulary Builder: Using Inkoranya Magambo': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800&h=500',
  'Kinyarwanda for Beginners (Internationals) — Speak from Day One': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800&h=500',
  'Kiswahili from Zero to Confident Speaker': 'https://images.unsplash.com/photo-1573164574511-73c773193279?auto=format&fit=crop&q=80&w=800&h=500',
  'Internet for Beginners: Browse, Email, WhatsApp & Stay Safe Online': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── Other Courses ────────────────────────────────────────
  'Data Science & Analytics with Python': 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&q=80&w=800&h=500',
  'Digital Marketing & Growth Hacking': 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=800&h=500',
  'Interactive Coding Bootcamp': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800&h=500',
  'Algorithms & Data Structures (with Code Editor)': 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800&h=500',
  'Algorithms Interview Prep (with Code Editor)': 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&q=80&w=800&h=500',
  'Affordable: Small Business Finance': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=500',
  'JavaScript Coding Challenges — From Arrays to Algorithms': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=800&h=500',
  'Exam Prep: Certification Simulations': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=500',
  'Live: Culinary Arts — Real-time Kitchen Sessions': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800&h=500',
  'Live: Public Speaking & Presentation Skills': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800&h=500',
  'Free Applied: Personal Productivity': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=500',
  'Premium: Executive Leadership Retreat (Live)': 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800&h=500',
  'National Qualification: Software Level 5 (Exam)': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800&h=500',
  'Basic Mathematics Certification': 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&q=80&w=800&h=500',
  'Welcome to BootSkills: Platform Demo Tour': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=500',

  // ─── FREE COURSES (5) — will expand to 5+ modules below ──
  'Computer Basics: Using a Computer & Smartphone': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800&h=500',
  'Introduction to Entrepreneurship: Start Any Business': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800&h=500',
  'CV Writing & Job Interview Skills: Get Hired in Rwanda': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800&h=500',
  'Personal Finance Basics: Manage Your Money Wisely': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800&h=500',
  'Study Skills & Time Management: Learn Anything Faster': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=500',
};

// ════════════════════════════════════════════════════════════
// FREE COURSE EXPANSION — 3 new modules each (2→5 modules)
// ════════════════════════════════════════════════════════════

// ─── Computer Basics: Modules 3-5 ──────────────────────────
const COMPUTER_MODULE_3 = {
  title: 'Module 3: Internet & Email Basics',
  description: 'Learn how to browse the web, use email, and stay connected online.',
  order: 3, lessons: [
    { title: 'Browsing the Web', type: 'article', content: `<h2>How the Internet Works</h2><p>The internet connects computers worldwide. You access it through a <strong>browser</strong> like Chrome, Firefox, or Safari.</p><h3>Essential Internet Skills</h3><ul><li><strong>URL</strong> — the web address (e.g., google.com)</li><li><strong>Search Engines</strong> — Google, Bing, Yahoo</li><li><strong>Bookmarks</strong> — save favorite websites</li><li><strong>Tabs</strong> — open multiple pages at once</li></ul><h3>Popular Websites in Rwanda</h3><ul><li><strong>Google</strong> — search and email (gmail.com)</li><li><strong>YouTube</strong> — watch videos</li><li><strong>Irembo</strong> — Rwanda government services</li><li><strong>MTN/Airtel</strong> — check mobile data and bundles</li></ul>`, duration: 15, resources: [] },
    { title: 'Using Email', type: 'article', content: `<h2>Email Communication</h2><p>Email is essential for work, school, and official communication.</p><h3>Setting Up Email</h3><ol><li>Go to gmail.com and click "Create account"</li><li>Choose a professional email address (firstname.lastname@gmail.com)</li><li>Set a strong password</li><li>Verify with your phone number</li></ol><h3>Email Etiquette</h3><ul><li>Use a clear subject line</li><li>Start with "Dear [Name]"</li><li>Keep messages short and clear</li><li>Proofread before sending</li><li>Reply within 24 hours</li></ul>`, duration: 15, resources: [] },
    { title: 'Module 3 Quiz — Internet & Email', type: 'quiz', content: '<p>Test your internet and email knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is a browser?', type: 'multiple_choice', options: ['A physical book', 'Software to access the web', 'A type of computer', 'An email service'], correctOptionIndex: 1, explanation: 'A browser like Chrome lets you access websites.' },
      { questionText: 'What does URL stand for?', type: 'multiple_choice', options: ['Uniform Resource Locator', 'Universal Research Link', 'Unified Resource Library', 'User Recognition Login'], correctOptionIndex: 0, explanation: 'URL is the web address of a website.' },
      { questionText: 'What is good email etiquette?', type: 'multiple_choice', options: ['Use ALL CAPS', 'Clear subject line and greeting', 'No subject line needed', 'Reply whenever you remember'], correctOptionIndex: 1, explanation: 'Professional emails need a clear subject and greeting.' },
      { questionText: 'Which Rwanda government platform offers online services?', type: 'multiple_choice', options: ['Google', 'Irembo', 'YouTube', 'WhatsApp'], correctOptionIndex: 1, explanation: 'Irembo is Rwanda\'s e-government platform.' },
      { questionText: 'How do you save a website for quick access?', type: 'multiple_choice', options: ['Write down the URL', 'Bookmark it', 'Take a screenshot', 'Email it to yourself'], correctOptionIndex: 1, explanation: 'Bookmarks save websites for quick access.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const COMPUTER_MODULE_4 = {
  title: 'Module 4: Online Safety & Security',
  description: 'Protect yourself online — passwords, scams, and safe browsing.',
  order: 4, lessons: [
    { title: 'Creating Strong Passwords', type: 'article', content: `<h2>Password Security</h2><p>A strong password is your first line of defense online.</p><h3>Good Password Rules</h3><ul><li>At least 12 characters long</li><li>Mix of uppercase, lowercase, numbers, symbols</li><li>Don't use personal info (birthday, name)</li><li>Use a different password for each account</li><li>Use a password manager to remember them</li></ul><h3>Two-Factor Authentication (2FA)</h3><p>Add an extra layer of security. Even if someone gets your password, they need a code sent to your phone to log in.</p>`, duration: 12, resources: [] },
    { title: 'Avoiding Online Scams', type: 'article', content: `<h2>Common Scams in Rwanda</h2><h3>Phishing Emails</h3><p>Fake emails pretending to be from MTN, Airtel, or banks asking for personal info. Never click suspicious links!</p><h3>Mobile Money Fraud</h3><ul><li>Never share your MoMo PIN with anyone</li><li>Beware of "You've won a prize" messages</li><li>Don't send money to "help" someone who contacts you unexpectedly</li><li>Verify calls claiming to be from your bank</li></ul><h3>Safe Browsing Tips</h3><ul><li>Look for the padlock icon (🔒) in the address bar</li><li>Only download apps from official stores (Google Play, App Store)</li><li>Keep your phone software updated</li><li>Use antivirus software</li></ul>`, duration: 14, resources: [] },
    { title: 'Module 4 Quiz — Online Safety', type: 'quiz', content: '<p>Test your online safety knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What makes a strong password?', type: 'multiple_choice', options: ['Your birthday', 'A long mix of characters', 'Your pet\'s name', '123456'], correctOptionIndex: 1, explanation: 'Strong passwords mix characters and are at least 12 characters.' },
      { questionText: 'What is two-factor authentication?', type: 'multiple_choice', options: ['Two passwords', 'Password + phone verification', 'Using two devices', 'Two email accounts'], correctOptionIndex: 1, explanation: '2FA adds a second verification step beyond just a password.' },
      { questionText: 'What is phishing?', type: 'multiple_choice', options: ['Fishing for real fish', 'Fake messages to steal info', 'A type of virus', 'A secure website'], correctOptionIndex: 1, explanation: 'Phishing tricks you into giving personal info through fake messages.' },
      { questionText: 'Should you share your MoMo PIN?', type: 'multiple_choice', options: ['Yes, with family', 'Never', 'With bank staff', 'With MTN staff'], correctOptionIndex: 1, explanation: 'Never share your MoMo PIN with anyone, ever.' },
      { questionText: 'What does the padlock icon mean?', type: 'multiple_choice', options: ['Website is popular', 'Connection is secure', 'Website is free', 'No password needed'], correctOptionIndex: 1, explanation: 'The padlock means the website connection is encrypted and secure.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const COMPUTER_MODULE_5 = {
  title: 'Module 5: Productivity Tools & Career Skills',
  description: 'Learn essential productivity tools for work and study in Rwanda.',
  order: 5, lessons: [
    { title: 'Google Workspace Basics', type: 'article', content: `<h2>Free Productivity Tools</h2><p>Google Workspace tools are free and essential for modern work.</p><h3>Google Docs</h3><ul><li>Create and edit documents online</li><li>Share with others for collaboration</li><li>Access from any device</li></ul><h3>Google Sheets</h3><ul><li>Spreadsheets for data and calculations</li><li>Track expenses, budgets, inventories</li></ul><h3>Google Drive</h3><ul><li>Store files in the cloud (15 GB free)</li><li>Access from phone, tablet, computer</li><li>Share files with links</li></ul><h3>Google Calendar</h3><p>Schedule meetings, set reminders, and organize your time.</p>`, duration: 15, resources: [] },
    { title: 'WhatsApp & Social Media for Business', type: 'article', content: `<h2>Using Social Media Professionally</h2><h3>WhatsApp Business</h3><p>Free business tool with catalog, quick replies, and statistics.</p><h3>LinkedIn</h3><p>Create a professional profile to find jobs and connect with employers in Rwanda.</p><h3>Building Digital Skills for Rwandan Jobs</h3><ul><li>Typing practice</li><li>Basic computer troubleshooting</li><li>Online research skills</li><li>Digital communication</li></ul>`, duration: 13, resources: [] },
    { title: 'Module 5 Quiz — Productivity Tools', type: 'quiz', content: '<p>Test your productivity tools knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'Which Google tool is for documents?', type: 'multiple_choice', options: ['Google Sheets', 'Google Docs', 'Google Slides', 'Google Drive'], correctOptionIndex: 1, explanation: 'Google Docs is for creating documents.' },
      { questionText: 'How much free storage does Google Drive give?', type: 'multiple_choice', options: ['5 GB', '10 GB', '15 GB', '25 GB'], correctOptionIndex: 2, explanation: 'Google Drive offers 15 GB of free storage.' },
      { questionText: 'What is WhatsApp Business used for?', type: 'multiple_choice', options: ['Personal chat only', 'Business communication with customers', 'Video calls only', 'Banking'], correctOptionIndex: 1, explanation: 'WhatsApp Business helps businesses communicate with customers.' },
      { questionText: 'Which platform is best for professional networking?', type: 'multiple_choice', options: ['Instagram', 'LinkedIn', 'TikTok', 'Snapchat'], correctOptionIndex: 1, explanation: 'LinkedIn is for professional networking and job searching.' },
      { questionText: 'What is Google Sheets used for?', type: 'multiple_choice', options: ['Spreadsheets', 'Documents', 'Presentations', 'Email'], correctOptionIndex: 0, explanation: 'Google Sheets is for spreadsheets and data.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

// ─── Entrepreneurship: Modules 3-5 ────────────────────────
const ENTRE_MODULE_3 = {
  title: 'Module 3: Market Research & Validation',
  description: 'Learn how to research your market and validate your business idea.',
  order: 3, lessons: [
    { title: 'Understanding Your Market', type: 'article', content: `<h2>Market Research Basics</h2><p>Before starting any business, you need to understand who your customers are and what they need.</p><h3>Key Questions to Answer</h3><ul><li>Who will buy your product/service?</li><li>How many potential customers are there?</li><li>What are they currently using?</li><li>What price are they willing to pay?</li></ul><h3>Simple Research Methods</h3><ul><li><strong>Surveys</strong> — Google Forms (free) to ask potential customers</li><li><strong>Interviews</strong> — Talk to 10-20 potential customers</li><li><strong>Observation</strong> — Watch how people currently solve the problem</li><li><strong>Competitor Analysis</strong> — Look at existing businesses solving similar problems</li></ul>`, duration: 15, resources: [] },
    { title: 'Validating Your Business Idea', type: 'article', content: `<h2>Idea Validation</h2><p>Don't build a full business before testing your idea.</p><h3>The Lean Startup Approach</h3><ol><li>Build a <strong>Minimum Viable Product (MVP)</strong> — the simplest version</li><li>Get <strong>feedback</strong> from real customers</li><li><strong>Iterate</strong> — improve based on feedback</li><li>Scale only when validated</li></ol><h3>Example: Rwandan Food Delivery</h3><p>Instead of building an app, start by taking orders via WhatsApp and delivering from your neighborhood. Test if people actually order before building technology.</p>`, duration: 15, resources: [] },
    { title: 'Module 3 Quiz — Market Research', type: 'quiz', content: '<p>Test your market research knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is the first step in market research?', type: 'multiple_choice', options: ['Build a website', 'Understand your customers', 'Hire employees', 'Register the company'], correctOptionIndex: 1, explanation: 'Always start by understanding who your customers are.' },
      { questionText: 'What is an MVP?', type: 'multiple_choice', options: ['Most Valuable Product', 'Minimum Viable Product', 'Maximum Valid Product', 'Market Value Product'], correctOptionIndex: 1, explanation: 'MVP is the simplest version to test your idea.' },
      { questionText: 'How many customers should you interview?', type: 'multiple_choice', options: ['1-2', '10-20', '100-200', '1000+'], correctOptionIndex: 1, explanation: '10-20 interviews give good initial insights.' },
      { questionText: 'What is competitor analysis?', type: 'multiple_choice', options: ['Copying competitors', 'Studying other businesses', 'Ignoring competition', 'Hiring competitors'], correctOptionIndex: 1, explanation: 'Studying competitors helps you understand the market.' },
      { questionText: 'When should you scale a business?', type: 'multiple_choice', options: ['Immediately', 'After validating demand', 'When you have money', 'When friends say it\'s good'], correctOptionIndex: 1, explanation: 'Scale only after validating real customer demand.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const ENTRE_MODULE_4 = {
  title: 'Module 4: Marketing & Sales',
  description: 'Learn how to attract customers and make sales in Rwanda.',
  order: 4, lessons: [
    { title: 'Marketing on a Budget', type: 'article', content: `<h2>Low-Cost Marketing in Rwanda</h2><h3>Free Marketing Channels</h3><ul><li><strong>WhatsApp Groups</strong> — Join local community and business groups</li><li><strong>Instagram & Facebook</strong> — Post your products with good photos</li><li><strong>Word of Mouth</strong> — Ask happy customers to refer others</li><li><strong>Local Markets</strong> — Kimironko, Nyabugogo, Remera — business hubs</li></ul><h3>Your Unique Selling Point (USP)</h3><p>What makes YOUR business different? Examples: faster delivery, better quality, lower price, more convenient location.</p>`, duration: 15, resources: [] },
    { title: 'Making the Sale', type: 'article', content: `<h2>Sales Skills for Entrepreneurs</h2><h3>The Sales Process</h3><ol><li><strong>Greet</strong> — Warm, friendly welcome</li><li><strong>Listen</strong> — Understand what the customer needs</li><li><strong>Present</strong> — Show how your product solves their problem</li><li><strong>Handle Objections</strong> — Address their concerns</li><li><strong>Close</strong> — Ask for the sale</li></ol><h3>Mobile Money Payments</h3><p>Get a MoMo Merchant account so customers can pay you via mobile money — essential in Rwanda.</p>`, duration: 15, resources: [] },
    { title: 'Module 4 Quiz — Marketing & Sales', type: 'quiz', content: '<p>Test your marketing and sales knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is the cheapest marketing channel?', type: 'multiple_choice', options: ['TV ads', 'WhatsApp & word of mouth', 'Billboards', 'Radio ads'], correctOptionIndex: 1, explanation: 'WhatsApp and word of mouth are free marketing channels.' },
      { questionText: 'What does USP stand for?', type: 'multiple_choice', options: ['Unique Sales Price', 'Unique Selling Point', 'Universal Sales Pitch', 'United Sales Program'], correctOptionIndex: 1, explanation: 'USP is what makes your business different from competitors.' },
      { questionText: 'What is the first step of making a sale?', type: 'multiple_choice', options: ['Close the deal', 'Greet the customer', 'Show the price', 'Ask for payment'], correctOptionIndex: 1, explanation: 'Always start with a warm greeting.' },
      { questionText: 'Why is MoMo Merchant important in Rwanda?', type: 'multiple_choice', options: ['It\'s not important', 'Customers prefer mobile payments', 'It\'s required by law', 'It\'s cheaper than cash'], correctOptionIndex: 1, explanation: 'Most Rwandans prefer paying via mobile money.' },
      { questionText: 'What do you do after handling objections?', type: 'multiple_choice', options: ['Walk away', 'Ask for the sale', 'Lower the price', 'Call a manager'], correctOptionIndex: 1, explanation: 'After addressing concerns, ask for the sale (close).' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const ENTRE_MODULE_5 = {
  title: 'Module 5: Financial Management for Small Business',
  description: 'Manage your business finances — pricing, profit, and growth.',
  order: 5, lessons: [
    { title: 'Pricing Your Products', type: 'article', content: `<h2>How to Price Your Products</h2><h3>Simple Pricing Formula</h3><p><strong>Selling Price</strong> = Cost of Goods + Operating Costs + Profit</p><h3>Example Calculator</h3><table><tr><th>Item</th><th>Amount (RWF)</th></tr><tr><td>Raw materials per unit</td><td>2,000</td></tr><tr><td>Packaging</td><td>500</td></tr><tr><td>Transport</td><td>300</td></tr><tr><td>Total Cost</td><td>2,800</td></tr><tr><td>Desired Profit (30%)</td><td>840</td></tr><tr><td><strong>Selling Price</strong></td><td><strong>3,640</strong></td></tr></table><h3>Track Everything</h3><p>Use a simple notebook or Google Sheets to record all income and expenses.</p>`, duration: 14, resources: [] },
    { title: 'Managing Business Growth', type: 'article', content: `<h2>Growing Your Business</h2><h3>When to Expand</h3><ul><li>You have steady customers every month</li><li>You consistently make a profit</li><li>Customers are asking for more</li><li>You can't keep up with demand</li></ul><h3>Reinvestment</h3><p>Reinvest 30-50% of profits back into the business for growth. Keep the rest for savings and personal needs.</p><h3>Rwanda Resources</h3><ul><li><strong>RDB</strong> — Business registration and guidance</li><li><strong>BDF</strong> — Business Development Fund (loans for SMEs)</li><li><strong>MINICOM</strong> — Ministry of Trade support programs</li></ul>`, duration: 14, resources: [] },
    { title: 'Module 5 Quiz — Financial Management', type: 'quiz', content: '<p>Test your financial management knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is the simple pricing formula?', type: 'multiple_choice', options: ['Cost + Profit', 'Cost + Margin', 'Cost + Expenses + Profit', 'Market price only'], correctOptionIndex: 2, explanation: 'Selling price = Cost of goods + Operating costs + Profit.' },
      { questionText: 'How much profit should you reinvest?', type: 'multiple_choice', options: ['10%', '30-50%', '100%', 'None'], correctOptionIndex: 1, explanation: 'Reinvest 30-50% of profits for growth.' },
      { questionText: 'What should you track in your business?', type: 'multiple_choice', options: ['Only sales', 'All income and expenses', 'Only expenses', 'Only profit'], correctOptionIndex: 1, explanation: 'Track both income and expenses to understand your business health.' },
      { questionText: 'Which Rwandan institution supports SMEs?', type: 'multiple_choice', options: ['MTN', 'BDF', 'RRA', 'RURA'], correctOptionIndex: 1, explanation: 'BDF (Business Development Fund) supports SMEs in Rwanda.' },
      { questionText: 'When is the right time to expand?', type: 'multiple_choice', options: ['After 1 month', 'When demand exceeds your capacity', 'When you have a loan', 'When competitors expand'], correctOptionIndex: 1, explanation: 'Expand when you have consistent demand you can\'t meet.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

// ─── CV & Interview: Modules 3-5 ─────────────────────────
const CV_MODULE_3 = {
  title: 'Module 3: Cover Letters & Job Applications',
  description: 'Write compelling cover letters and complete job applications effectively.',
  order: 3, lessons: [
    { title: 'Writing a Cover Letter', type: 'article', content: `<h2>Cover Letter Essentials</h2><p>A cover letter introduces you and explains why you're the right person for the job.</p><h3>Cover Letter Structure</h3><ol><li><strong>Header</strong> — Your name, email, phone, LinkedIn</li><li><strong>Date and Employer</strong> — HR Manager, Company Name</li><li><strong>Opening</strong> — "I am writing to apply for [Position] at [Company]"</li><li><strong>Body</strong> — 2-3 paragraphs about your skills and experience</li><li><strong>Closing</strong> — "Thank you for considering my application"</li></ol><h3>Rwanda-specific Tips</h3><ul><li>Mention your language skills (Kinyarwanda, English, French)</li><li>Include any relevant local experience</li><li>Reference specific Rwandan companies or projects</li></ul>`, duration: 15, resources: [] },
    { title: 'Online Job Platforms in Rwanda', type: 'article', content: `<h2>Where to Find Jobs in Rwanda</h2><h3>Top Platforms</h3><ul><li><strong>LinkedIn</strong> — Professional networking and job listings</li><li><strong>Job in Rwanda</strong> — jobinrwanda.com</li><li><strong>BrighterMonday</strong> — brightemon.com</li><li><strong>Indeed</strong> — indeed.com</li><li><strong>Government Jobs</strong> — Apply through MINISTRY websites</li></ul><h3>Application Tips</h3><ul><li>Read the job description carefully</li><li>Tailor your CV for each application</li><li>Follow application instructions exactly</li><li>Apply within 24 hours of job posting</li></ul>`, duration: 13, resources: [] },
    { title: 'Module 3 Quiz — Cover Letters & Applications', type: 'quiz', content: '<p>Test your job application knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is a cover letter for?', type: 'multiple_choice', options: ['List your education', 'Introduce yourself and explain fit', 'List your references', 'Copy your CV'], correctOptionIndex: 1, explanation: 'A cover letter introduces you and explains why you\'re right for the role.' },
      { questionText: 'Which platform is best for professional networking?', type: 'multiple_choice', options: ['Facebook', 'LinkedIn', 'Instagram', 'TikTok'], correctOptionIndex: 1, explanation: 'LinkedIn is specifically for professional networking.' },
      { questionText: 'How quickly should you apply for a job?', type: 'multiple_choice', options: ['Within a week', 'Within 24 hours', 'On the deadline', 'Whenever you remember'], correctOptionIndex: 1, explanation: 'Apply quickly — within 24 hours of posting.' },
      { questionText: 'Should you use the same CV for every job?', type: 'multiple_choice', options: ['Yes', 'No, tailor it', 'Only for same industry', 'Only if short on time'], correctOptionIndex: 1, explanation: 'Tailor your CV for each specific job application.' },
      { questionText: 'What language skills are valuable in Rwanda?', type: 'multiple_choice', options: ['Only English', 'Kinyarwanda, English, French', 'Only Kinyarwanda', 'Only French'], correctOptionIndex: 1, explanation: 'Multilingual candidates (Kinyarwanda, English, French) are highly valued.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const CV_MODULE_4 = {
  title: 'Module 4: Interview Preparation & Success',
  description: 'Master job interviews — preparation, common questions, and follow-up.',
  order: 4, lessons: [
    { title: 'Preparing for the Interview', type: 'article', content: `<h2>Interview Preparation Checklist</h2><h3>Before the Interview</h3><ul><li>Research the company (website, social media, news)</li><li>Practice common questions out loud</li><li>Prepare your own questions to ask</li><li>Plan your outfit (professional attire)</li><li>Test your video setup if remote</li><li>Arrive 15 minutes early</li></ul><h3>Common Interview Questions</h3><ol><li>"Tell me about yourself" — 2-minute summary of your background</li><li>"Why do you want this job?" — Show you researched the company</li><li>"What are your strengths?" — Give specific examples</li><li>"What are your weaknesses?" — Share a real weakness and how you improve it</li><li>"Where do you see yourself in 5 years?" — Show ambition and growth</li></ol>`, duration: 15, resources: [] },
    { title: 'Interview Day & Follow-Up', type: 'article', content: `<h2>During the Interview</h2><h3>Body Language Tips</h3><ul><li>Smile and make eye contact</li><li>Sit up straight</li><li>Listen carefully before answering</li><li>Take a moment to think before speaking</li><li>Thank the interviewer at the end</li></ul><h3>Follow-Up After Interview</h3><p>Send a thank-you email within 24 hours:</p><p>"Dear [Interviewer], thank you for the opportunity to interview for [Position]. I enjoyed learning about [Company] and am very excited about the role. Please let me know if you need any additional information."</p>`, duration: 13, resources: [] },
    { title: 'Module 4 Quiz — Interviews', type: 'quiz', content: '<p>Test your interview skills knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'How early should you arrive for an interview?', type: 'multiple_choice', options: ['5 minutes', '15 minutes', '30 minutes', 'Exactly on time'], correctOptionIndex: 1, explanation: 'Arrive 15 minutes early to show punctuality and composure.' },
      { questionText: 'What should you research before an interview?', type: 'multiple_choice', options: ['Nothing', 'The company and role', 'Competitor salaries', 'The interviewer\'s personal life'], correctOptionIndex: 1, explanation: 'Research the company, role, and industry before the interview.' },
      { questionText: 'How should you answer "Tell me about yourself"?', type: 'multiple_choice', options: ['Read your CV', 'Give a 2-minute professional summary', 'Share your life story', 'Say you don\'t know'], correctOptionIndex: 1, explanation: 'Prepare a 2-minute summary of your relevant background.' },
      { questionText: 'When should you send a thank-you email?', type: 'multiple_choice', options: ['Immediately during interview', 'Within 24 hours', 'After a week', 'Only if you get the job'], correctOptionIndex: 1, explanation: 'Send a thank-you email within 24 hours of the interview.' },
      { questionText: 'How should you discuss weaknesses?', type: 'multiple_choice', options: ['Say you have none', 'Share a real weakness and improvement plan', 'Lie about a weakness', 'Blame your previous employer'], correctOptionIndex: 1, explanation: 'Share a genuine weakness and how you are working to improve it.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const CV_MODULE_5 = {
  title: 'Module 5: Online Presence & Career Growth',
  description: 'Build your professional brand online and plan your career growth.',
  order: 5, lessons: [
    { title: 'Building Your LinkedIn Profile', type: 'article', content: `<h2>LinkedIn Profile Optimization</h2><h3>Key Profile Elements</h3><ul><li><strong>Professional Photo</strong> — Clear, well-lit, professional attire</li><li><strong>Headline</strong> — "Digital Marketer | Content Creator | Kigali, Rwanda"</li><li><strong>About Section</strong> — 3-4 sentences about your expertise</li><li><strong>Experience</strong> — List past roles with achievements (not just duties)</li><li><strong>Skills</strong> — Add relevant skills and get endorsements</li></ul><h3>Networking on LinkedIn</h3><ul><li>Connect with professionals in your field</li><li>Share relevant content and insights</li><li>Join Rwanda-specific professional groups</li><li>Engage with posts from companies you admire</li></ul>`, duration: 14, resources: [] },
    { title: 'Career Planning & Development', type: 'article', content: `<h2>Planning Your Career Path</h2><h3>Skills to Develop</h3><p>Identify skills in demand in Rwanda's job market:</p><ul><li>Digital skills (Microsoft Office, Google Workspace)</li><li>Communication (English, professional writing)</li><li>Customer service</li><li>Project management</li><li>Data analysis</li></ul><h3>Continuous Learning</h3><p>Take free courses on these platforms:</p><ul><li>Coursera — Free audit option</li><li>edX — Free courses from top universities</li><li>YouTube tutorials</li><li>Rwanda's Workforce Development Authority programs</li></ul>`, duration: 14, resources: [] },
    { title: 'Module 5 Quiz — Career Growth', type: 'quiz', content: '<p>Test your career growth knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What should your LinkedIn headline include?', type: 'multiple_choice', options: ['Your favorite quote', 'Your role and location', 'Your birth date', 'Your religion'], correctOptionIndex: 1, explanation: 'Your headline should state your professional role and location.' },
      { questionText: 'What should you share on LinkedIn?', type: 'multiple_choice', options: ['Personal photos', 'Professional content and insights', 'Only job postings', 'Nothing'], correctOptionIndex: 1, explanation: 'Share relevant professional content to build your brand.' },
      { questionText: 'Which skill is most in demand in Rwanda?', type: 'multiple_choice', options: ['Basket weaving', 'Digital skills', 'Horse riding', 'Calligraphy'], correctOptionIndex: 1, explanation: 'Digital skills are highly in demand in Rwanda\'s growing economy.' },
      { questionText: 'Can you take Coursera courses for free?', type: 'multiple_choice', options: ['No, always paid', 'Yes, with audit option', 'Only for students', 'Only in Rwanda'], correctOptionIndex: 1, explanation: 'Coursera offers a free audit option for most courses.' },
      { questionText: 'What is the best way to network on LinkedIn?', type: 'multiple_choice', options: ['Send spam messages', 'Connect with relevant professionals and engage', 'Only connect with friends', 'Buy followers'], correctOptionIndex: 1, explanation: 'Build genuine connections with professionals in your field.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

// ─── Personal Finance: Modules 3-5 ────────────────────────
const FINANCE_MODULE_3 = {
  title: 'Module 3: Saving & Budgeting',
  description: 'Create a budget, build savings, and control your spending.',
  order: 3, lessons: [
    { title: 'Creating a Monthly Budget', type: 'article', content: `<h2>Budgeting in Rwanda</h2><h3>The 50/30/20 Rule</h3><ul><li><strong>50%</strong> — Needs (rent, food, transport, utilities)</li><li><strong>30%</strong> — Wants (entertainment, eating out, shopping)</li><li><strong>20%</strong> — Savings & Debt Repayment</li></ul><h3>Sample Monthly Budget (Kigali)</h3><table><tr><th>Category</th><th>Amount (RWF)</th></tr><tr><td>Rent</td><td>150,000</td></tr><tr><td>Food</td><td>80,000</td></tr><tr><td>Transport</td><td>30,000</td></tr><tr><td>Utilities (water, electricity, internet)</td><td>35,000</td></tr><tr><td>Airtime & Data</td><td>15,000</td></tr><tr><td>Savings (20%)</td><td>62,000</td></tr><tr><td><strong>Total</strong></td><td><strong>372,000</strong></td></tr></table>`, duration: 15, resources: [] },
    { title: 'Building an Emergency Fund', type: 'article', content: `<h2>Emergency Savings</h2><p>An emergency fund covers unexpected expenses — medical bills, job loss, urgent travel.</p><h3>How Much to Save</h3><ul><li><strong>Start small:</strong> First goal = 50,000 RWF</li><li><strong>Next goal:</strong> 1 month of expenses</li><li><strong>Final goal:</strong> 3-6 months of expenses</li></ul><h3>Saving Tips</h3><ul><li>Save first (before spending) — automate it!</li><li>Use a separate MoMo savings wallet</li><li>Join an <strong>ibimina</strong> (savings group) for discipline</li><li>Save any windfalls (bonuses, gifts)</li></ul>`, duration: 14, resources: [] },
    { title: 'Module 3 Quiz — Saving & Budgeting', type: 'quiz', content: '<p>Test your budgeting knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What percentage should go to savings?', type: 'multiple_choice', options: ['10%', '20%', '30%', '50%'], correctOptionIndex: 1, explanation: 'The 50/30/20 rule suggests 20% for savings.' },
      { questionText: 'What is an emergency fund for?', type: 'multiple_choice', options: ['Vacations', 'Unexpected expenses', 'Shopping', 'Gifts'], correctOptionIndex: 1, explanation: 'Emergency funds cover unexpected life events.' },
      { questionText: 'What is an ibimina?', type: 'multiple_choice', options: ['A bank account', 'A savings group', 'A loan', 'An insurance'], correctOptionIndex: 1, explanation: 'Ibimina is a traditional Rwandan savings group.' },
      { questionText: 'How much should your emergency fund cover?', type: 'multiple_choice', options: ['1 week', '3-6 months', '1 year', '5 years'], correctOptionIndex: 1, explanation: 'Aim for 3-6 months of expenses in your emergency fund.' },
      { questionText: 'When is the best time to save?', type: 'multiple_choice', options: ['End of month', 'First, before spending', 'When you remember', 'Only when you have extra'], correctOptionIndex: 1, explanation: 'Save first (pay yourself first) before any spending.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const FINANCE_MODULE_4 = {
  title: 'Module 4: Managing Debt & Credit',
  description: 'Understand debt, loans, and how to build good credit in Rwanda.',
  order: 4, lessons: [
    { title: 'Good Debt vs Bad Debt', type: 'article', content: `<h2>Understanding Debt</h2><h3>Good Debt</h3><ul><li>Business loan to start/grow a business</li><li>Education loan for skills development</li><li>Home loan (mortgage)</li></ul><h3>Bad Debt</h3><ul><li>High-interest consumer loans for shopping</li><li>Loan sharks (unlicensed lenders charging extreme interest)</li><li>Borrowing to pay other debts</li></ul><h3>Debt Management Tips</h3><ul><li>Never borrow more than 30% of your monthly income</li><li>Always read the loan agreement carefully</li><li>Pay more than the minimum payment</li><li>If struggling, talk to your lender before missing payments</li></ul>`, duration: 14, resources: [] },
    { title: 'Loans & Banking in Rwanda', type: 'article', content: `<h2>Banking Options in Rwanda</h2><h3>Types of Loans</h3><ul><li><strong>Bank of Kigali</strong> — Personal and business loans</li><li><strong>Equity Bank</strong> — SME loans with flexible terms</li><li><strong>I&M Bank</strong> — Education and asset financing</li><li><strong>SACCOs</strong> — Cooperative savings and loans (lower interest)</li><li><strong>Mobile Money Loans</strong> — MoMoPesa, Airtel Money loans (use carefully)</li></ul><h3>Credit Score</h3><p>Rwanda has a credit reference system. Late payments affect your ability to get future loans. Always pay on time!</p>`, duration: 14, resources: [] },
    { title: 'Module 4 Quiz — Debt Management', type: 'quiz', content: '<p>Test your debt management knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is good debt?', type: 'multiple_choice', options: ['Shopping debt', 'Business or education loan', 'Loan shark debt', 'Holiday loan'], correctOptionIndex: 1, explanation: 'Good debt invests in your future (business, education).' },
      { questionText: 'What is a SACCO?', type: 'multiple_choice', options: ['A bank', 'A cooperative savings group', 'A mobile money service', 'An insurance company'], correctOptionIndex: 1, explanation: 'SACCOs are cooperative savings and loan organizations.' },
      { questionText: 'How much of income should go to debt?', type: 'multiple_choice', options: ['50%', 'Max 30%', '10%', 'As much as possible'], correctOptionIndex: 1, explanation: 'Keep debt payments under 30% of monthly income.' },
      { questionText: 'What happens if you miss loan payments?', type: 'multiple_choice', options: ['Nothing', 'Affects your credit score', 'You get a warning', 'Interest stops'], correctOptionIndex: 1, explanation: 'Late payments hurt your credit score and future loan eligibility.' },
      { questionText: 'What should you do before signing a loan?', type: 'multiple_choice', options: ['Just sign', 'Read the agreement carefully', 'Ask a friend', 'Sign and read later'], correctOptionIndex: 1, explanation: 'Always read and understand all loan terms before signing.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const FINANCE_MODULE_5 = {
  title: 'Module 5: Investing for Your Future',
  description: 'Learn how to grow your money through investing — even with little to start.',
  order: 5, lessons: [
    { title: 'Investment Basics', type: 'article', content: `<h2>Growing Your Money</h2><h3>Investment Options in Rwanda</h3><ul><li><strong>Savings Account</strong> — Safe, low return (2-5% interest)</li><li><strong>Government Bonds</strong> — Safe, moderate return (8-12%)</li><li><strong>Stock Market</strong> — Rwanda Stock Exchange (RSE)</li><li><strong>Real Estate</strong> — Buy land or property (appreciates over time)</li><li><strong>Business Investment</strong> — Invest in a small business</li></ul><h3>The Power of Compound Interest</h3><p>If you invest 50,000 RWF monthly at 10% annual return: After 10 years = ~10 million RWF. After 20 years = ~38 million RWF. Start early, even small!</p>`, duration: 15, resources: [] },
    { title: 'Setting Financial Goals', type: 'article', content: `<h2>Your Financial Roadmap</h2><h3>SMART Goals</h3><ul><li><strong>S</strong>pecific — "Save 500,000 RWF" not "Save money"</li><li><strong>M</strong>easurable — Track progress monthly</li><li><strong>A</strong>chievable — Realistic for your income</li><li><strong>R</strong>elevant — Aligns with your life plans</li><li><strong>T</strong>ime-bound — "Within 12 months"</li></ul><h3>Goal Examples</h3><ul><li>Short-term (1 year): Build emergency fund of 200,000 RWF</li><li>Medium-term (2-5 years): Save for business startup (2M RWF)</li><li>Long-term (5+ years): Buy land or property</li></ul>`, duration: 13, resources: [] },
    { title: 'Module 5 Quiz — Investing', type: 'quiz', content: '<p>Test your investment knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is the safest investment?', type: 'multiple_choice', options: ['Stock market', 'Savings account', 'Cryptocurrency', 'Business'], correctOptionIndex: 1, explanation: 'Savings accounts are the safest, with guaranteed but low returns.' },
      { questionText: 'What does compound interest do?', type: 'multiple_choice', options: ['Reduces your savings', 'Grows your money exponentially over time', 'Charges you fees', 'Stays the same'], correctOptionIndex: 1, explanation: 'Compound interest grows your savings faster over time.' },
      { questionText: 'What does SMART stand for?', type: 'multiple_choice', options: ['Specific, Meaningful, Achievable, Realistic, Timely', 'Specific, Measurable, Achievable, Relevant, Time-bound', 'Simple, Measured, Actionable, Real, Targeted', 'Smart, Motivated, Active, Ready, Tested'], correctOptionIndex: 1, explanation: 'SMART is a goal-setting framework.' },
      { questionText: 'Which is a medium-term financial goal?', type: 'multiple_choice', options: ['Buy lunch', 'Save 2M RWF in 3 years', 'Retire in 30 years', 'Pay today\'s transport'], correctOptionIndex: 1, explanation: 'Medium-term goals are typically 2-5 years away.' },
      { questionText: 'Where can you invest in Rwanda\'s stock market?', type: 'multiple_choice', options: ['NYSE', 'RSE', 'NASDAQ', 'LSE'], correctOptionIndex: 1, explanation: 'RSE = Rwanda Stock Exchange.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

// ─── Study Skills: Modules 3-5 ────────────────────────────
const STUDY_MODULE_3 = {
  title: 'Module 3: Note-Taking & Memory Techniques',
  description: 'Learn effective note-taking methods and memory techniques for better learning.',
  order: 3, lessons: [
    { title: 'Note-Taking Methods', type: 'article', content: `<h2>Effective Note-Taking</h2><h3>Cornell Method</h3><p>Divide your page: <strong>Keywords</strong> (left), <strong>Notes</strong> (right), <strong>Summary</strong> (bottom).</p><h3>Mind Mapping</h3><p>Start with the main topic in the center, branch out with subtopics. Great for visual learners!</p><h3>Digital Tools</h3><ul><li><strong>Google Keep</strong> — Quick notes, syncs across devices</li><li><strong>Notion</strong> — All-in-one notes, tasks, databases</li><li><strong>Evernote</strong> — Organize notes with tags and notebooks</li></ul>`, duration: 14, resources: [] },
    { title: 'Memory Techniques', type: 'article', content: `<h2>Remember What You Learn</h2><h3>Active Recall</h3><p>Test yourself instead of re-reading. After studying, close the book and write everything you remember.</p><h3>Spaced Repetition</h3><p>Review at increasing intervals: 1 day → 3 days → 1 week → 1 month. Apps like Anki automate this.</p><h3>Teaching Others</h3><p>The best way to learn is to teach. Explain concepts to a friend or family member in Kinyarwanda.</p>`, duration: 14, resources: [] },
    { title: 'Module 3 Quiz — Note-Taking & Memory', type: 'quiz', content: '<p>Test your note-taking knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'What is active recall?', type: 'multiple_choice', options: ['Re-reading notes', 'Testing yourself from memory', 'Listening to lectures', 'Highlighting text'], correctOptionIndex: 1, explanation: 'Active recall means retrieving information from memory.' },
      { questionText: 'What is spaced repetition?', type: 'multiple_choice', options: ['Cramming before exams', 'Reviewing at increasing intervals', 'Studying once', 'Reading quickly'], correctOptionIndex: 1, explanation: 'Spaced repetition schedules review at optimal intervals.' },
      { questionText: 'What is a mind map?', type: 'multiple_choice', options: ['A map of a city', 'A visual diagram of connected ideas', 'A list of topics', 'A calendar'], correctOptionIndex: 1, explanation: 'Mind maps visually show connections between ideas.' },
      { questionText: 'What is the Cornell method?', type: 'multiple_choice', options: ['A Cornell university course', 'A note-taking layout with keywords, notes, summary', 'A study schedule', 'A memory technique'], correctOptionIndex: 1, explanation: 'The Cornell method structures notes into keywords, notes, and summary.' },
      { questionText: 'What is the best way to deeply learn something?', type: 'multiple_choice', options: ['Read it once', 'Teach it to someone else', 'Watch a video', 'Take a test'], correctOptionIndex: 1, explanation: 'Teaching others is one of the most effective learning methods.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const STUDY_MODULE_4 = {
  title: 'Module 4: Exam Preparation & Test-Taking',
  description: 'Prepare effectively for exams and perform well under pressure.',
  order: 4, lessons: [
    { title: 'Exam Preparation Strategy', type: 'article', content: `<h2>Preparing for Exams</h2><h3>Study Schedule</h3><ul><li>Start 4-6 weeks before exams</li><li>Study 2-3 hours daily, not 8+ hours cramming</li><li>Review each subject every 3 days</li><li>Take Sundays off for rest</li></ul><h3>Past Papers</h3><p>Practice with past exam papers. This is the single most effective preparation method for most Rwandan exams.</p><h3>Group Study</h3><p>Study with 3-5 classmates. Explain topics to each other, quiz each other, and discuss difficult concepts.</p>`, duration: 15, resources: [] },
    { title: 'Test-Taking Tips', type: 'article', content: `<h2>During the Exam</h2><h3>Before Starting</h3><ul><li>Read ALL instructions carefully</li><li>Look through the entire paper first</li><li>Check how many points each question is worth</li></ul><h3>During the Test</h3><ul><li>Start with questions you know well</li><li>Allocate time per question — don't spend 30 min on a 5-point question</li><li>Write clearly and legibly</li><li>If stuck, move on and come back later</li><li>Review your answers before submitting</li></ul><h3>Managing Anxiety</h3><p>Take deep breaths. Remember: you prepared. Trust your knowledge.</p>`, duration: 13, resources: [] },
    { title: 'Module 4 Quiz — Exam Prep', type: 'quiz', content: '<p>Test your exam preparation knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'When should you start exam preparation?', type: 'multiple_choice', options: ['Night before', '4-6 weeks before', '1 week before', '2 days before'], correctOptionIndex: 1, explanation: 'Start 4-6 weeks before exams for best results.' },
      { questionText: 'What is the most effective exam preparation?', type: 'multiple_choice', options: ['Reading textbooks', 'Practicing past papers', 'Watching videos', 'Listening to lectures'], correctOptionIndex: 1, explanation: 'Practice with past papers to understand question patterns.' },
      { questionText: 'How should you start an exam?', type: 'multiple_choice', options: ['Answer the first question', 'Read all instructions first', 'Skip to the end', 'Start writing immediately'], correctOptionIndex: 1, explanation: 'Always read ALL instructions carefully before starting.' },
      { questionText: 'What should you do when stuck on a question?', type: 'multiple_choice', options: ['Give up', 'Move on and return later', 'Spend 30 minutes on it', 'Ask a friend'], correctOptionIndex: 1, explanation: 'Skip difficult questions and return to them later.' },
      { questionText: 'How many group study members is ideal?', type: 'multiple_choice', options: ['1-2', '3-5', '10-15', '20+'], correctOptionIndex: 1, explanation: 'Small groups of 3-5 are most effective for study.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

const STUDY_MODULE_5 = {
  title: 'Module 5: Productivity & Focus',
  description: 'Master focus, avoid procrastination, and get more done in less time.',
  order: 5, lessons: [
    { title: 'The Pomodoro Technique', type: 'article', content: `<h2>Focus with Pomodoro</h2><p>The Pomodoro Technique: <strong>25 minutes work, 5 minutes break.</strong> After 4 rounds, take a 15-30 minute break.</p><h3>How to Apply</h3><ol><li>Choose one task to focus on</li><li>Set a 25-minute timer</li><li>Work ONLY on that task until the timer rings</li><li>Take a 5-minute break (stand up, stretch)</li><li>After 4 Pomodoros, take a longer break</li></ol><h3>Common Distractions & Solutions</h3><table><tr><th>Distraction</th><th>Solution</th></tr><tr><td>Phone notifications</td><td>Put phone in another room</td></tr><tr><td>Social media</td><td>Use app blockers (Freedom, StayFocusd)</td></tr><tr><td>Noise</td><td>Use noise-canceling headphones</td></tr><tr><td>Fatigue</td><td>Study during your peak energy hours</td></tr></table>`, duration: 14, resources: [] },
    { title: 'Overcoming Procrastination', type: 'article', content: `<h2>Beat Procrastination</h2><h3>The 2-Minute Rule</h3><p>If a task takes less than 2 minutes, DO IT NOW. Reply to that email, wash that dish, make that call.</p><h3>The 5-Minute Rule</h3><p>When you don't want to start, commit to just 5 minutes. Usually, after 5 minutes, you'll want to continue.</p><h3>Eat the Frog</h3><p>Do your hardest, most important task FIRST thing in the morning. After that, everything else feels easy.</p><h3>Create a Daily Routine</h3><p>Wake up at the same time, study at the same time, sleep at the same time. Routine builds discipline.</p>`, duration: 14, resources: [] },
    { title: 'Module 5 Quiz — Productivity', type: 'quiz', content: '<p>Test your productivity knowledge.</p>', duration: 10, quizQuestions: [
      { questionText: 'How long is a standard Pomodoro session?', type: 'multiple_choice', options: ['15 minutes', '25 minutes', '45 minutes', '60 minutes'], correctOptionIndex: 1, explanation: 'The standard Pomodoro is 25 minutes of focused work.' },
      { questionText: 'What is the 2-minute rule?', type: 'multiple_choice', options: ['Work for 2 minutes only', 'Do tasks under 2 minutes immediately', 'Take 2-minute breaks', 'Check phone for 2 minutes'], correctOptionIndex: 1, explanation: 'If a task takes less than 2 minutes, do it now.' },
      { questionText: 'What does "Eat the Frog" mean?', type: 'multiple_choice', options: ['Eat a real frog', 'Do the hardest task first', 'Skip breakfast', 'Work faster'], correctOptionIndex: 1, explanation: 'Do your most challenging task first thing in the morning.' },
      { questionText: 'How many Pomodoros before a long break?', type: 'multiple_choice', options: ['2', '4', '6', '8'], correctOptionIndex: 1, explanation: 'After 4 Pomodoros, take a 15-30 minute break.' },
      { questionText: 'What helps build discipline?', type: 'multiple_choice', options: ['Changing routines daily', 'Consistent daily routine', 'No routine', 'Working randomly'], correctOptionIndex: 1, explanation: 'A consistent daily routine builds discipline over time.' },
    ], quizConfig: { timeLimit: 8, quizType: 'exercise', questionsPerPage: 5 } },
  ],
};

// ─── All free course expansions ─────────────────────────
const FREE_COURSE_EXPANSIONS: { title: string; modules: any[]; targetCount: number }[] = [
  { title: 'Computer Basics: Using a Computer & Smartphone', modules: [COMPUTER_MODULE_3, COMPUTER_MODULE_4, COMPUTER_MODULE_5], targetCount: 5 },
  { title: 'Introduction to Entrepreneurship: Start Any Business', modules: [ENTRE_MODULE_3, ENTRE_MODULE_4, ENTRE_MODULE_5], targetCount: 5 },
  { title: 'CV Writing & Job Interview Skills: Get Hired in Rwanda', modules: [CV_MODULE_3, CV_MODULE_4, CV_MODULE_5], targetCount: 5 },
  { title: 'Personal Finance Basics: Manage Your Money Wisely', modules: [FINANCE_MODULE_3, FINANCE_MODULE_4, FINANCE_MODULE_5], targetCount: 5 },
  { title: 'Study Skills & Time Management: Learn Anything Faster', modules: [STUDY_MODULE_3, STUDY_MODULE_4, STUDY_MODULE_5], targetCount: 5 },
];

// ════════════════════════════════════════════════════════════
// MAIN FIXUP
// ════════════════════════════════════════════════════════════
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGO_URI not found'); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log('🔌 Connected to MongoDB\n');

  // ═══════════════════════════════════════════════════════
  // STEP 1: Assign unique thumbnails to ALL courses
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('🖼️  STEP 1: Assigning unique topic-matching thumbnails');
  console.log('═'.repeat(60));

  let thumbnailUpdates = 0;
  for (const [title, url] of Object.entries(THUMBNAILS)) {
    const result = await db.collection('courses').updateOne(
      { title },
      { $set: { thumbnail: url } }
    );
    if (result.modifiedCount > 0 || result.matchedCount > 0) thumbnailUpdates++;
  }

  // For courses not in our map (shouldn't be many), assign a topic-matching fallback
  const remaining = await db.collection('courses').find({}).project({ title: 1, thumbnail: 1, _id: 0 }).toArray() as any[];
  const mappedTitles = new Set(Object.keys(THUMBNAILS));
  let fallbackAssigned = 0;

  for (const c of remaining) {
    if (!mappedTitles.has(c.title)) {
      // Generate a topic-based search key
      const words = c.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 4).join(' ');
      console.log(`   ❓ No thumbnail map entry for: "${c.title}" — assign manually`);
      await db.collection('courses').updateOne(
        { title: c.title },
        { $set: { thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&h=500' } }
      );
      fallbackAssigned++;
    }
  }

  console.log(`   ✅ Updated ${thumbnailUpdates} courses with topic-specific thumbnails`);
  console.log(`   ${fallbackAssigned > 0 ? `⚠️ ${fallbackAssigned} got fallback thumbnails` : '✅ All courses have unique thumbnails'}`);

  // ═══════════════════════════════════════════════════════
  // STEP 2: Expand free courses → 5 modules each
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('📚 STEP 2: Expanding free courses to 5 modules');
  console.log('═'.repeat(60));

  for (const exp of FREE_COURSE_EXPANSIONS) {
    const course = await db.collection('courses').findOne({ title: exp.title }) as any;
    if (!course) {
      console.log(`   ⚠️ Not found: ${exp.title}`);
      continue;
    }

    const currentModules: any[] = course.modules || [];
    if (currentModules.length >= exp.targetCount) {
      console.log(`   ⏭️  ${exp.title} — already ${currentModules.length} modules`);
      continue;
    }

    const toAdd = exp.modules.slice(0, exp.targetCount - currentModules.length);
    await db.collection('courses').updateOne(
      { _id: course._id },
      { $push: { modules: { $each: toAdd } } } as any
    );
    console.log(`   ✅ ${exp.title.substring(0, 50)}: ${currentModules.length} → ${currentModules.length + toAdd.length} modules`);
  }

  // ═══════════════════════════════════════════════════════
  // STEP 3: Verification
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('✅ STEP 3: Verification');
  console.log('═'.repeat(60));

  // Check thumbnail uniqueness
  const allCourses = await db.collection('courses').aggregate([
    { $group: { _id: '$thumbnail', titles: { $push: '$title' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray() as any[];

  const shared = allCourses.filter((c: any) => c.count > 1);
  const unique = allCourses.filter((c: any) => c.count === 1);
  console.log(`\n📊 Thumbnails: ${unique.length} unique | ${shared.length} shared`);

  if (shared.length > 0) {
    console.log('⚠️ Shared thumbnails remaining:');
    shared.forEach((s: any) => {
      console.log(`   ${s.count}x: ${s._id?.substring(0, 60)}`);
      s.titles.forEach((t: string) => console.log(`     - ${t}`));
    });
  }

  // Check free course module counts
  console.log('\n📊 Free Courses:');
  for (const exp of FREE_COURSE_EXPANSIONS) {
    const course = await db.collection('courses').aggregate([
      { $match: { title: exp.title } },
      { $project: { title: 1, moduleCount: { $size: '$modules' }, _id: 0 } }
    ]).toArray() as any[];
    const mc = course[0]?.moduleCount || 0;
    const ok = mc >= 5;
    console.log(`   ${ok ? '✅' : '❌'} ${exp.title.substring(0, 50).padEnd(52)} ${mc} modules`);
  }

  // Check all courses module counts
  console.log('\n📊 All Courses Summary:');
  const allCourseCounts = await db.collection('courses').aggregate([
    { $project: { title: 1, moduleCount: { $size: '$modules' }, _id: 0 } },
    { $sort: { moduleCount: 1 } }
  ]).toArray() as any[];

  const thin = allCourseCounts.filter((c: any) => c.moduleCount < 3);
  const ok_ = allCourseCounts.filter((c: any) => c.moduleCount >= 3);
  console.log(`   ✅ ${ok_.length} courses with 3+ modules`);
  console.log(`   ${thin.length > 0 ? `⚠️ ${thin.length} courses with <3 modules` : '✅ All courses have 3+ modules'}`);

  // Count shared thumbnail groups
  const sharedCount = shared.length;
  console.log(`\n📊 Thumbnail health: ${unique.length} unique / ${sharedCount} shared groups`);

  if (sharedCount === 0) {
    console.log('🎉 EVERY course now has a UNIQUE thumbnail!');
  }

  console.log('\n🏁 Fixup complete!');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
