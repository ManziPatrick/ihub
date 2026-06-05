import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';
import { Question } from './models/Question';
import connectDB from './config/db';

dotenv.config();

// ─── Helper: Generate a quiz lesson (5th lesson of each module) ─────────────
function makeQuizLesson(moduleIndex: number, isLastModule: boolean, courseCategory: string): any {
  const commonQuizPool = [
    {
      title: 'Module Quiz: Check Your Understanding',
      content: '<p>Test your understanding of the key concepts covered in this module.</p>',
      type: 'quiz',
      duration: 10,
      resources: [],
      quizQuestions: [
        {
          questionText: 'What is the main purpose of this module?',
          type: 'multiple_choice',
          options: ['To introduce basic concepts', 'To practice advanced skills', 'To understand theoretical foundations', 'To apply practical techniques'],
          correctOptionIndex: 0,
          explanation: 'Each module builds foundational understanding before moving to more complex topics.'
        },
        {
          questionText: 'What is the best approach to learning new concepts?',
          type: 'multiple_choice',
          options: ['Read once and move on', 'Practice consistently and apply what you learn', 'Only watch videos without reading', 'Skip the basics'],
          correctOptionIndex: 1,
          explanation: 'Consistent practice and application are key to mastering any subject.'
        },
        {
          questionText: 'How should you approach the assignments in this module?',
          type: 'multiple_choice',
          options: ['Skip them if you understand the concepts', 'Complete them thoroughly to reinforce learning', 'Do them as fast as possible', 'Only do the first one'],
          correctOptionIndex: 1,
          explanation: 'Assignments are designed to help you apply and reinforce what you have learned.'
        },
        {
          questionText: 'What should you do if you struggle with a concept?',
          type: 'multiple_choice',
          options: ['Give up and move on', 'Review the lesson materials and practice more', 'Skip to the next module', 'Ignore it completely'],
          correctOptionIndex: 1,
          explanation: 'Revisiting lesson materials and practicing more is the best way to overcome learning challenges.'
        },
        {
          questionText: 'What is the benefit of taking quizzes?',
          type: 'multiple_choice',
          options: ['They are just for grades', 'They help reinforce and assess your understanding', 'They waste time', 'They are optional'],
          correctOptionIndex: 1,
          explanation: 'Quizzes help reinforce learning and provide feedback on areas that need improvement.'
        }
      ],
      quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 }
    }
  ];

  if (isLastModule) {
    return {
      title: 'Final Exam — Comprehensive Assessment',
      content: '<p>This is the final exam covering all modules. Complete all questions to demonstrate your mastery of the course material.</p>',
      type: 'assignment',
      duration: 45,
      isAssignment: true,
      requiredAssignment: true,
      assignmentDescription: 'Complete all questions. You must score at least 70% to pass.',
      assignmentConfig: { timeLimit: 45, allowRetakes: true, disableRightClick: true, mode: 'exam' },
      resources: [],
      assignmentQuestions: [
        {
          questionText: 'Describe in your own words what you learned in this course.',
          type: 'open',
          points: 20,
          explanation: 'Reflect on the key takeaways from the entire course.'
        },
        {
          questionText: 'How will you apply what you learned to real-world situations?',
          type: 'open',
          points: 20,
          explanation: 'Application of knowledge is the ultimate measure of learning.'
        },
        {
          questionText: 'What topic did you find most valuable and why?',
          type: 'open',
          points: 20,
          explanation: 'Identifying valuable content helps reinforce learning.'
        },
        {
          questionText: 'What additional topics would you like to explore further?',
          type: 'open',
          points: 20,
          explanation: 'Learning is a continuous journey beyond this course.'
        },
        {
          questionText: 'Rate your confidence in applying the skills from this course (1-10) and explain your rating.',
          type: 'open',
          points: 20,
          explanation: 'Self-assessment is an important part of the learning process.'
        }
      ]
    };
  }

  return commonQuizPool[0];
}

// ─── Helper: Generate content lesson ────────────────────────────────────────
function makeContentLesson(moduleIndex: number, lessonIndex: number, courseCategory: string, courseTitle: string): any {
  const topics = [
    { title: 'Introduction and Overview', duration: 15, type: 'article' as const },
    { title: 'Core Concepts and Principles', duration: 20, type: 'video' as const },
    { title: 'Practical Applications', duration: 25, type: 'article' as const },
    { title: 'Advanced Techniques and Best Practices', duration: 20, type: 'video' as const }
  ];

  const topic = topics[lessonIndex] || topics[0];

  return {
    title: `${moduleIndex + 1}.${lessonIndex + 1}: ${topic.title}`,
    content: `<h1>${topic.title}</h1><p>In this lesson, we explore ${topic.title.toLowerCase()} within the context of <strong>${courseTitle}</strong>. This foundational knowledge will help you build a strong understanding of the subject matter.</p><p>Take time to study the material carefully and take notes on key points. Practice exercises are recommended to reinforce your learning.</p>`,
    duration: topic.duration,
    type: topic.type,
    videoUrl: topic.type === 'video' ? `https://www.youtube.com/watch?v=example_${moduleIndex}_${lessonIndex}` : undefined,
    resources: [
      { title: 'Lesson Notes and Summary', url: `https://example.com/courses/${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/module-${moduleIndex + 1}/lesson-${lessonIndex + 1}`, type: 'link' as const }
    ]
  };
}

// ─── Helper: Generate a full module ─────────────────────────────────────────
function generateModule(moduleIndex: number, totalModules: number, courseCategory: string, courseTitle: string): any {
  const moduleTitles = [
    'Foundations and Core Concepts',
    'Practical Applications and Techniques',
    'Advanced Topics and Best Practices',
    'Mastery and Real-World Projects',
    'Expert-Level Implementation',
    'Professional Excellence'
  ];

  const isLastModule = moduleIndex === totalModules - 1;
  const lessons: any[] = [];

  // 4 content lessons
  for (let i = 0; i < 4; i++) {
    lessons.push(makeContentLesson(moduleIndex, i, courseCategory, courseTitle));
  }

  // 5th lesson: quiz (or exam if last module)
  lessons.push(makeQuizLesson(moduleIndex, isLastModule, courseCategory));

  return {
    title: `Module ${moduleIndex + 1}: ${moduleTitles[moduleIndex] || `Module ${moduleIndex + 1}`}`,
    description: `Explore ${moduleTitles[moduleIndex]?.toLowerCase() || `module ${moduleIndex + 1} topics`} in depth. This module covers essential knowledge and practical skills.`,
    lessons,
    learningOutcome: `Master the concepts and techniques covered in ${moduleTitles[moduleIndex]?.toLowerCase() || `module ${moduleIndex + 1}`}`,
    hoursAllocated: 8
  };
}

// ─── Generate standardized modules for a course ─────────────────────────────
function generateStandardModules(moduleCount: number, category: string, title: string): any[] {
  const modules: any[] = [];
  for (let i = 0; i < moduleCount; i++) {
    modules.push(generateModule(i, moduleCount, category, title));
  }
  return modules;
}

// ─── Cyber Literacy Course Content ──────────────────────────────────────────
function generateCyberLiteracyModules(): any[] {
  const modules = [
    {
      title: 'Module 1: Understanding Cyber Threats',
      description: 'Learn about the different types of cyber threats and how to recognize them.',
      lessons: [
        {
          title: '1.1: What is Cybersecurity?',
          content: '<h1>Understanding Cybersecurity</h1><p>Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These attacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.</p><p>In today\'s connected world, everyone — from individuals to large organizations — needs to understand basic cybersecurity principles to stay safe online.</p><p><strong>Key concepts:</strong> Confidentiality, Integrity, and Availability (CIA Triad)</p>',
          duration: 15,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Cybersecurity Basics Guide', url: 'https://example.com/cyber-basics', type: 'link' }]
        },
        {
          title: '1.2: Common Types of Cyber Attacks',
          content: '<h1>Recognizing Cyber Attacks</h1><p>Cyber attacks come in many forms. Understanding them is the first step to protection.</p><ul><li><strong>Phishing:</strong> Fake emails or messages that trick you into revealing personal information</li><li><strong>Malware:</strong> Malicious software that damages or infiltrates your devices</li><li><strong>Ransomware:</strong> Malware that locks your files and demands payment</li><li><strong>Social Engineering:</strong> Manipulating people into giving up confidential information</li><li><strong>DDoS Attacks:</strong> Overwhelming a system with traffic to make it unavailable</li></ul><p>Each type of attack requires different prevention strategies.</p>',
          duration: 20,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=cyber-attacks',
          resources: [{ title: 'Cyber Attack Types Reference', url: 'https://example.com/attack-types', type: 'link' }]
        },
        {
          title: '1.3: Password Security and Authentication',
          content: '<h1>Strong Passwords Save Accounts</h1><p>Weak passwords are the #1 cause of account breaches. A strong password should:</p><ul><li>Be at least 12 characters long</li><li>Include uppercase, lowercase, numbers, and symbols</li><li>Not contain personal information (birthdays, names)</li><li>Be unique for every account</li></ul><p><strong>Use a password manager</strong> to generate and store complex passwords. Enable two-factor authentication (2FA) wherever possible.</p>',
          duration: 18,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Password Security Checklist', url: 'https://example.com/password-security', type: 'pdf' }]
        },
        {
          title: '1.4: Phishing — How to Spot Fake Messages',
          content: '<h1>Don\'t Take the Bait</h1><p>Phishing is the most common cyber attack. Scammers send fake messages that look like they\'re from trusted companies, banks, or even friends.</p><p><strong>Red flags to watch for:</strong></p><ul><li>Urgent language: "Your account will be closed!"</li><li>Suspicious sender email addresses</li><li>Generic greetings instead of your name</li><li>Links that don\'t match the real website</li><li>Requests for personal information</li></ul><p>When in doubt, go directly to the official website instead of clicking links in messages.</p>',
          duration: 22,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=phishing-spotting',
          resources: [{ title: 'Phishing Examples Gallery', url: 'https://example.com/phishing-examples', type: 'link' }]
        },
        {
          title: 'Module 1 Quiz: Cyber Threats',
          content: '<p>Test your understanding of cyber threats and how to recognize them.</p>',
          type: 'quiz',
          duration: 10,
          quizQuestions: [
            { questionText: 'What does the "C" in CIA Triad stand for?', type: 'multiple_choice', options: ['Complexity', 'Confidentiality', 'Compliance', 'Cryptography'], correctOptionIndex: 1 },
            { questionText: 'Which attack tricks users into revealing personal information via fake messages?', type: 'multiple_choice', options: ['DDoS', 'Ransomware', 'Phishing', 'Malware'], correctOptionIndex: 2 },
            { questionText: 'What is the minimum recommended password length?', type: 'multiple_choice', options: ['6 characters', '8 characters', '12 characters', '16 characters'], correctOptionIndex: 2 },
            { questionText: 'What should you do if you receive a suspicious email from your bank?', type: 'multiple_choice', options: ['Click the link to check', 'Reply asking for details', 'Go directly to the bank\'s official website', 'Forward it to friends'], correctOptionIndex: 2 },
            { questionText: 'What additional security layer should you enable beyond passwords?', type: 'multiple_choice', options: ['VPN', 'Two-Factor Authentication (2FA)', 'Antivirus only', 'Firewall only'], correctOptionIndex: 1 }
          ],
          quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 }
        }
      ]
    },
    {
      title: 'Module 2: Securing Your Devices and Networks',
      description: 'Learn how to protect your computers, phones, and home network from intrusions.',
      lessons: [
        {
          title: '2.1: Device Security Fundamentals',
          content: '<h1>Protecting Your Devices</h1><p>Every device connected to the internet is a potential target. Here\'s how to secure them:</p><ul><li>Keep operating systems and apps updated</li><li>Use device encryption (FileVault on Mac, BitLocker on Windows)</li><li>Set strong lock screen passwords</li><li>Enable remote wipe capabilities</li><li>Disable unnecessary services (Bluetooth, NFC when not in use)</li></ul><p>Regularly review which apps have permissions on your devices.</p>',
          duration: 18,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Device Security Checklist', url: 'https://example.com/device-security', type: 'pdf' }]
        },
        {
          title: '2.2: Network Security and Wi-Fi Safety',
          content: '<h1>Securing Your Home Network</h1><p>Your Wi-Fi network is the gateway to all your connected devices.</p><p><strong>Best practices:</strong></p><ul><li>Change default router passwords and SSID</li><li>Use WPA2 or WPA3 encryption</li><li>Disable WPS (Wi-Fi Protected Setup)</li><li>Enable guest networks for visitors</li><li>Keep router firmware updated</li><li>Use a firewall</li></ul><p>Public Wi-Fi networks are not secure. Always use a VPN when connecting to public hotspots.</p>',
          duration: 20,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=wifi-security',
          resources: [{ title: 'Router Security Guide', url: 'https://example.com/router-security', type: 'link' }]
        },
        {
          title: '2.3: Mobile Device Security',
          content: '<h1>Securing Your Smartphone</h1><p>Smartphones contain more personal data than most computers. Protect them:</p><ul><li>Only install apps from official app stores</li><li>Review app permissions regularly</li><li>Use biometric locks (fingerprint, face ID) plus a strong PIN</li><li>Enable find-my-device features</li><li>Keep your phone updated</li><li>Avoid sideloading apps from unknown sources</li></ul><p>Be especially careful with financial apps — never save banking passwords on your phone.</p>',
          duration: 15,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Mobile Security Tips', url: 'https://example.com/mobile-security', type: 'link' }]
        },
        {
          title: '2.4: Antivirus, Firewalls, and Security Tools',
          content: '<h1>Essential Security Tools</h1><p>No single tool provides complete protection. Use a layered approach:</p><ul><li><strong>Antivirus:</strong> Detects and removes malware (Windows Defender, Malwarebytes)</li><li><strong>Firewall:</strong> Monitors and controls network traffic</li><li><strong>VPN:</strong> Encrypts your internet connection</li><li><strong>Password Manager:</strong> Stores and generates strong passwords</li><li><strong>Ad Blockers:</strong> Prevents malicious ads from loading</li></ul><p>Keep all security tools updated for maximum protection.</p>',
          duration: 22,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=security-tools',
          resources: [{ title: 'Recommended Security Tools', url: 'https://example.com/security-tools', type: 'link' }]
        },
        {
          title: 'Module 2 Quiz: Device and Network Security',
          content: '<p>Test your knowledge of device and network security best practices.</p>',
          type: 'quiz',
          duration: 10,
          quizQuestions: [
            { questionText: 'What is the best Wi-Fi encryption to use?', type: 'multiple_choice', options: ['WEP', 'WPA', 'WPA2 or WPA3', 'Open network'], correctOptionIndex: 2 },
            { questionText: 'What should you use when connecting to public Wi-Fi?', type: 'multiple_choice', options: ['Nothing extra', 'VPN', 'Antivirus only', 'Incognito mode'], correctOptionIndex: 1 },
            { questionText: 'Where should you install apps from on mobile?', type: 'multiple_choice', options: ['Any website', 'Official app stores only', 'Email attachments', 'Social media links'], correctOptionIndex: 1 },
            { questionText: 'What is a firewall used for?', type: 'multiple_choice', options: ['Cleaning viruses', 'Monitoring and controlling network traffic', 'Speeding up internet', 'Storing passwords'], correctOptionIndex: 1 },
            { questionText: 'How often should you update your devices?', type: 'multiple_choice', options: ['Once a year', 'Whenever updates are available', 'Never', 'Only when something breaks'], correctOptionIndex: 1 }
          ],
          quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 }
        }
      ]
    },
    {
      title: 'Module 3: Online Privacy and Data Protection',
      description: 'Understand how your data is collected and how to protect your privacy online.',
      lessons: [
        {
          title: '3.1: Understanding Digital Privacy',
          content: '<h1>What is Digital Privacy?</h1><p>Digital privacy is about controlling who has access to your personal information and how it is used.</p><p><strong>What data is collected about you?</strong></p><ul><li>Browsing history and search queries</li><li>Location data</li><li>Social media activity</li><li>Purchase history</li><li>Device information</li><li>Biometric data</li></ul><p>Companies collect this data for advertising, but it can also be exposed in data breaches. Understanding what data you share is the first step to protecting it.</p>',
          duration: 18,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Digital Privacy Guide', url: 'https://example.com/digital-privacy', type: 'link' }]
        },
        {
          title: '3.2: Social Media Privacy Settings',
          content: '<h1>Taking Control of Social Media Privacy</h1><p>Social media platforms collect vast amounts of data. Here\'s how to protect yourself:</p><ul><li>Set profiles to private</li><li>Limit what you share publicly</li><li>Review tagged photos and posts</li><li>Disable location tagging</li><li>Be careful about quizzes and apps that request data</li><li>Regularly review connected apps and revoke access</li></ul><p>Remember: anything posted online can potentially be seen by anyone, even with privacy settings.</p>',
          duration: 20,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=social-privacy',
          resources: [{ title: 'Social Media Privacy Checklist', url: 'https://example.com/social-privacy', type: 'pdf' }]
        },
        {
          title: '3.3: Browser Privacy and Safe Browsing',
          content: '<h1>Browse Safely and Privately</h1><p>Your browser knows a lot about you. Take control:</p><ul><li>Use private/incognito mode for sensitive browsing</li><li>Install privacy extensions (uBlock Origin, Privacy Badger)</li><li>Clear cookies and cache regularly</li><li>Use a privacy-focused browser (Firefox, Brave, DuckDuckGo)</li><li>Disable third-party cookies</li><li>Use search engines that don\'t track you (DuckDuckGo)</li></ul><p>Your browsing habits reveal more about you than you might think — protect them.</p>',
          duration: 15,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Browser Privacy Settings Guide', url: 'https://example.com/browser-privacy', type: 'link' }]
        },
        {
          title: '3.4: Data Breaches — How to Respond',
          content: '<h1>What to Do When Your Data is Breached</h1><p>Data breaches are increasingly common. If you\'ve been affected:</p><ol><li>Change your password on the affected site immediately</li><li>If you reused that password elsewhere, change it there too</li><li>Enable two-factor authentication</li><li>Monitor your accounts for suspicious activity</li><li>Check haveibeenpwned.com to see what data was exposed</li><li>Consider freezing your credit if financial data was exposed</li></ol><p>Act quickly — time is critical when responding to a breach.</p>',
          duration: 22,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=data-breach',
          resources: [{ title: 'Data Breach Response Guide', url: 'https://example.com/breach-response', type: 'pdf' }]
        },
        {
          title: 'Module 3 Quiz: Privacy and Data Protection',
          content: '<p>Test your understanding of online privacy and data protection.</p>',
          type: 'quiz',
          duration: 10,
          quizQuestions: [
            { questionText: 'What should you do if your data is exposed in a breach?', type: 'multiple_choice', options: ['Ignore it', 'Change passwords immediately and enable 2FA', 'Close all accounts', 'Wait and see'], correctOptionIndex: 1 },
            { questionText: 'Which browser feature helps prevent tracking?', type: 'multiple_choice', options: ['Bookmarks', 'Private/Incognito mode', 'History', 'Downloads'], correctOptionIndex: 1 },
            { questionText: 'What website lets you check if your email was in a data breach?', type: 'multiple_choice', options: ['google.com', 'haveibeenpwned.com', 'facebook.com', 'amazon.com'], correctOptionIndex: 1 },
            { questionText: 'What should you limit on social media for better privacy?', type: 'multiple_choice', options: ['Everything you share publicly', 'Only photos', 'Nothing', 'Only your name'], correctOptionIndex: 0 },
            { questionText: 'What is digital privacy about?', type: 'multiple_choice', options: ['Hiding from the government', 'Controlling who accesses your personal information', 'Deleting all accounts or using fake names'], correctOptionIndex: 1 }
          ],
          quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 }
        }
      ]
    },
    {
      title: 'Module 4: Recovery, Incident Response, and Final Exam',
      description: 'Learn how to recover from security incidents and test your overall cybersecurity knowledge.',
      lessons: [
        {
          title: '4.1: Incident Response — What to Do When Hacked',
          content: '<h1>Staying Calm and Responding Correctly</h1><p>If you suspect you\'ve been hacked, follow these steps:</p><ol><li>Disconnect the affected device from the internet</li><li>Change passwords from a different, secure device</li><li>Run a full security scan</li><li>Check for unauthorized transactions or changes</li><li>Contact your bank if financial accounts are affected</li><li>Report the incident to relevant authorities</li></ol><p>Speed is critical. The faster you respond, the less damage can be done.</p>',
          duration: 20,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Incident Response Checklist', url: 'https://example.com/incident-response', type: 'pdf' }]
        },
        {
          title: '4.2: Backups and Data Recovery',
          content: '<h1>Never Lose Your Data</h1><p>Regular backups are your best defense against ransomware and data loss.</p><p><strong>The 3-2-1 Backup Rule:</strong></p><ul><li><strong>3</strong> copies of your data</li><li><strong>2</strong> different storage media (e.g., external drive + cloud)</li><li><strong>1</strong> copy stored offsite</li></ul><p>Automate backups whenever possible. Test your backups regularly to ensure they work.</p>',
          duration: 18,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=backups',
          resources: [{ title: 'Backup Strategy Guide', url: 'https://example.com/backup-guide', type: 'link' }]
        },
        {
          title: '4.3: Creating a Personal Security Plan',
          content: '<h1>Building Long-Term Security Habits</h1><p>Consistent habits are more effective than any single security tool.</p><p><strong>Your weekly security routine:</strong></p><ul><li>Check for software updates</li><li>Review recent account activity</li><li>Check for any unusual emails or messages</li><li>Back up important files</li></ul><p><strong>Monthly:</strong> Review app permissions, change critical passwords, check privacy settings</p><p><strong>Quarterly:</strong> Full security audit, review financial accounts, test backups</p>',
          duration: 22,
          type: 'article',
          videoUrl: undefined,
          resources: [{ title: 'Personal Security Plan Template', url: 'https://example.com/security-plan', type: 'pdf' }]
        },
        {
          title: '4.4: Security for Families — Protecting Loved Ones',
          content: '<h1>Keeping Your Family Safe Online</h1><p>Cybersecurity is a family matter. Help your loved ones stay safe:</p><ul><li>Talk openly about online risks</li><li>Set up parental controls on kids\' devices</li><li>Teach children not to share personal information online</li><li>Create family accounts with shared, secure passwords</li><li>Keep a list of emergency contacts for security issues</li><li>Lead by example — practice good security habits yourself</li></ul><p>The most vulnerable members of your family need your protection and guidance.</p>',
          duration: 20,
          type: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=family-security',
          resources: [{ title: 'Family Security Guide', url: 'https://example.com/family-security', type: 'link' }]
        },
        {
          title: 'Final Exam: Cybersecurity Literacy',
          content: '<p>This comprehensive exam covers all four modules of the Cyber Literacy course. You must score at least 70% to pass.</p>',
          type: 'assignment',
          duration: 45,
          isAssignment: true,
          requiredAssignment: true,
          assignmentDescription: 'Complete all questions. You have 45 minutes. Passing score: 70%.',
          assignmentConfig: { timeLimit: 45, allowRetakes: true, disableRightClick: true, mode: 'exam' },
          assignmentQuestions: [
            { questionText: 'What are the three components of the CIA Triad in cybersecurity? Explain each.', type: 'open', points: 20 },
            { questionText: 'Describe three red flags that indicate a phishing email.', type: 'open', points: 20 },
            { questionText: 'Explain the 3-2-1 backup rule and why it is important.', type: 'open', points: 20 },
            { questionText: 'What steps should you take immediately after discovering you\'ve been hacked?', type: 'open', points: 20 },
            { questionText: 'How can you help protect your family members who are less tech-savvy?', type: 'open', points: 20 }
          ]
        }
      ]
    }
  ];

  return modules;
}

// ─── Main Normalization Function ────────────────────────────────────────────
async function normalizeAllCourses() {
  await connectDB();
  console.log('📦 Connected to database.');

  // Find admin user
  let admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
  if (!admin) {
    admin = await User.findOne({ role: 'trainer' });
  }
  if (!admin) {
    console.error('❌ No admin/trainer user found. Please seed users first.');
    process.exit(1);
  }
  console.log(`👤 Using instructor: ${admin.fullName || admin.username} (${admin._id})`);

  // ─── Step 1: Create/Update Cyber Literacy Course ──────────────────────────
  const cyberTitle = 'Cyber Literacy — Protect Yourself Online';
  console.log(`\n🔐 Processing Cyber Literacy course: "${cyberTitle}"...`);

  const cyberModules = generateCyberLiteracyModules();
  const existingCyber = await Course.findOne({ title: cyberTitle });

  if (existingCyber) {
    console.log('  ♻️  Updating existing Cyber Literacy course...');
    (existingCyber as any).modules = cyberModules;
    (existingCyber as any).description = '<p>Learn how to protect yourself from cyber threats, secure your devices, safeguard your privacy, and respond to security incidents. This comprehensive course covers everything from recognizing phishing attacks to creating a family security plan.</p>';
    (existingCyber as any).thumbnail = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';
    (existingCyber as any).category = 'Security';
    (existingCyber as any).level = 'Beginner';
    (existingCyber as any).status = 'published';
    await existingCyber.save();
    console.log(`  ✅ Updated. Modules: ${existingCyber.modules.length}`);
  } else {
    const cyberCourse = new Course({
      title: cyberTitle,
      description: '<p>Learn how to protect yourself from cyber threats, secure your devices, safeguard your privacy, and respond to security incidents. This comprehensive course covers everything from recognizing phishing attacks to creating a family security plan.</p>',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
      instructor: admin._id,
      createdBy: admin._id,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Security',
      status: 'published',
      modules: cyberModules
    });
    await cyberCourse.save();
    console.log(`  ✅ Created. Modules: ${cyberCourse.modules.length}`);
  }

  // Verify module structure
  const verCyber = await Course.findOne({ title: cyberTitle });
  if (verCyber) {
    for (let i = 0; i < (verCyber as any).modules.length; i++) {
      const m = (verCyber as any).modules[i];
      const lessonCount = (m.lessons || []).length;
      const lastType = (m.lessons || [])[lessonCount - 1]?.type || 'none';
      console.log(`     Module ${i + 1}: "${m.title}" — ${lessonCount} lessons, last: ${lastType}`);
    }
  }

  // ─── Step 2: Normalize All Existing Courses ──────────────────────────────
  console.log('\n🔄 Normalizing all existing courses to 4+1 pattern...');

  const allCourses = await Course.find({}).lean();
  let normalizedCount = 0;

  for (const courseRaw of allCourses) {
    const course = courseRaw as any;
    const courseId = course._id;
    const title = course.title || 'Untitled';
    const category = course.category || 'General';

    // Clean up orphaned Question records for this course before restructuring
    const oldQuestionCount = await Question.countDocuments({ courseId });
    if (oldQuestionCount > 0) {
      await Question.deleteMany({ courseId });
      console.log(`     🗑️  Deleted ${oldQuestionCount} orphaned question records`);
    }

    // Skip the Cyber Literacy course we just updated
    if (title === cyberTitle) continue;

    const oldModules = course.modules || [];
    const newModules: any[] = [];

    // Free courses with 0-2 modules: reorganize to 4 modules with 4+1 pattern
    if (oldModules.length === 0) {
      console.log(`  📚 "${title}" — No modules. Creating standard 4-module structure...`);
      await Question.deleteMany({ courseId });
      const freshModules = generateStandardModules(4, category, title);
      await Course.findByIdAndUpdate(courseId, { modules: freshModules } as any);
      console.log(`     ✅ Created 4 modules with 5 lessons each (4 content + 1 quiz/exam)`);
      normalizedCount++;
      continue;
    }

    // For courses with 1-2 modules, expand to 4
    if (oldModules.length === 1 || oldModules.length === 2) {
      console.log(`  📚 "${title}" — Only ${oldModules.length} modules. Expanding to 4...`);
      await Question.deleteMany({ courseId });
      const freshModules = generateStandardModules(4, category, title);
      await Course.findByIdAndUpdate(courseId, { modules: freshModules } as any);
      console.log(`     ✅ Expanded to 4 modules with 5 lessons each`);
      normalizedCount++;
      continue;
    }

    // For courses with >=3 modules: restructure each module to 4+1 pattern
    console.log(`  📚 "${title}" — ${oldModules.length} modules. Normalizing...`);

    for (let mi = 0; mi < oldModules.length; mi++) {
      const oldMod = oldModules[mi] || {};
      const oldLessons = oldMod.lesson || oldMod.lessons || [];
      const isLastMod = mi === oldModules.length - 1;

      // Filter out existing quizzes if they're not the last lesson
      const contentLessons = oldLessons.filter((l: any) => l.type !== 'quiz' && l.type !== 'assignment');

      // Keep first 4 content lessons
      const keptLessons = contentLessons.slice(0, 4).map((l: any) => ({
        ...l,
        lesson: undefined,
        lessons: undefined
      }));

      // If we have fewer than 4 content lessons, pad with generated ones
      while (keptLessons.length < 4) {
        const idx = keptLessons.length;
        keptLessons.push(makeContentLesson(mi, idx, category, title));
      }

      // Add quiz as 5th lesson (exam for last module)
      keptLessons.push(makeQuizLesson(mi, isLastMod, category));

      newModules.push({
        title: oldMod.title || `Module ${mi + 1}: ${['Foundations', 'Applications', 'Advanced Topics', 'Mastery', 'Expert Level', 'Professional Excellence'][mi] || `Module ${mi + 1}`}`,
        description: oldMod.description || `Explore module ${mi + 1} topics in depth.`,
        lessons: keptLessons,
        learningOutcome: oldMod.learningOutcome || `Master module ${mi + 1} concepts`,
        hoursAllocated: oldMod.hoursAllocated || 8
      });
    }

    await Course.findByIdAndUpdate(courseId, { modules: newModules } as any);

    // Print verification
    const lessonSummary = newModules.map((m: any, i: number) => {
      const ls = m.lessons || [];
      const lastType = ls[ls.length - 1]?.type || 'none';
      const quizCount = ls.filter((l: any) => l.type === 'quiz' || l.type === 'assignment').length;
      return `M${i + 1}:${ls.length}L(quiz:${quizCount},last:${lastType})`;
    }).join(', ');
    console.log(`     ✅ ${lessonSummary}`);
    normalizedCount++;
  }

  // ─── Step 3: Final Verification ───────────────────────────────────────────
  console.log('\n📊 Final verification...');
  const finalCourses = await Course.find({}).lean();
  console.log(`\n📈 Summary: ${finalCourses.length} courses processed`);
  let perfectCount = 0;
  
  for (const c of finalCourses) {
    const cc = c as any;
    const mods = cc.modules || [];
    let allGood = true;
    
    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      const lessons = m.lesson || m.lessons || [];
      const isLastMod = i === mods.length - 1;
      
      if (lessons.length !== 5) {
        allGood = false;
        break;
      }
      
      const lastType = lessons[lessons.length - 1]?.type;
      if (isLastMod && lastType !== 'assignment' && lastType !== 'quiz') {
        allGood = false;
        break;
      }
      if (!isLastMod && lastType !== 'quiz') {
        allGood = false;
        break;
      }
    }
    
    if (allGood) perfectCount++;
  }
  
  console.log(`   ✅ Perfect structure (5 lessons/module, last=quiz/exam): ${perfectCount}/${finalCourses.length} courses`);
  console.log('\n🎉 Course normalization complete!');
  await mongoose.disconnect();
}

normalizeAllCourses().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
