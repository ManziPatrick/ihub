import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Course } from './models/Course';
import { User } from './models/User';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { InternshipApplication } from './models/internship/InternshipApplication';
import { InternshipProject } from './models/internship/InternshipProject';
import { InternshipTeam } from './models/internship/Team';
import { InternshipTeamMember } from './models/internship/TeamMember';
import { InternshipMilestone } from './models/internship/Milestone';
import { InternshipSprint } from './models/internship/Sprint';
import { InternshipTask } from './models/internship/Task';
import { InternshipActivityLog } from './models/internship/ActivityLog';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:Jonathan%402026.@109.123.252.110:27018/bootskillsdb?authSource=admin&directConnection=true';

const DEFAULT_WORKFLOW: any = [
  { id: 'todo', label: 'To Do', color: 'slate', order: 0, type: 'todo' },
  { id: 'in_progress', label: 'In Progress', color: 'blue', order: 1, type: 'progress' },
  { id: 'in_testing', label: 'In Testing', color: 'orange', order: 2, type: 'testing' },
  { id: 'in_review', label: 'In Review', color: 'purple', order: 3, type: 'review' },
  { id: 'done', label: 'Done', color: 'yellow', order: 4, type: 'done' },
  { id: 'staged', label: 'Staged', color: 'cyan', order: 5, type: 'staged' },
  { id: 'completed', label: 'Completed', color: 'green', order: 6, type: 'completed' },
];

const seedEverything = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. Ensure Trainer/Admin User exists for ownership
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    let admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!admin) {
      console.log('Creating admin user...');
      admin = await User.findOneAndUpdate(
        { username: 'admin' },
        {
          username: 'admin',
          email: 'admin@bootskills.com',
          password,
          role: 'admin',
          fullName: 'System Administrator'
        },
        { upsert: true, new: true }
      );
    }

    if (!admin) {
      throw new Error('Failed to find or create an admin user.');
    }

    let mentor = await User.findOne({ role: 'trainer' });
    if (!mentor) {
      console.log('Creating mentor user...');
      mentor = await User.findOneAndUpdate(
        { username: 'mentor_js' },
        {
          username: 'mentor_js',
          email: 'mentorjs@bootskills.com',
          password,
          role: 'trainer',
          fullName: 'JS Master Mentor'
        },
        { upsert: true, new: true }
      );
    }

    if (!mentor) {
      throw new Error('Failed to find or create a trainer user.');
    }

    // 2. Seed "Complete Computer Literacy Mastery"
    console.log('📚 Seeding Complete Computer Literacy Mastery course...');
    const literacyCourseTitle = 'Complete Computer Literacy Mastery';
    let existingLiteracy = await Course.findOne({ title: literacyCourseTitle });

    if (existingLiteracy) {
      console.log('⚠️  Computer Literacy course already exists. Skipping creation.');
    } else {
      const literacyData = {
        title: literacyCourseTitle,
        description: '<p>Master computer skills from absolute beginner to confident user. Learn hardware basics, file management, typing, Microsoft Word and Excel, email, internet safety, keyboard shortcuts, and troubleshooting. No prior experience required.</p>',
        thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/computer_literacy_mastery.webp',
        instructor: admin._id,
        createdBy: admin._id,
        price: 0,
        discountPrice: 0,
        level: 'Beginner',
        category: 'Technology',
        status: 'published',
        studentsEnrolled: [],
        modules: [
          {
            title: 'Module 1: Computer Hardware and Basic Operations',
            description: 'Learn the physical parts of a computer and how to control them.',
            lessons: [
              {
                title: 'Parts of a Computer',
                content: '<p>A computer has five essential parts:</p><ul><li><strong>Monitor (Screen):</strong> Displays what you are doing</li><li><strong>Keyboard:</strong> Used for typing letters, numbers, and commands</li><li><strong>Mouse:</strong> Used for pointing, clicking, and selecting</li><li><strong>Computer case (Tower or laptop body):</strong> Contains the brain (CPU), memory, and storage</li><li><strong>Speakers or headphones:</strong> Output sound</li></ul><p>📸 <strong>Screenshot to include:</strong> A labeled diagram of a desktop computer showing monitor, keyboard, mouse, tower, and speakers with arrows and labels.</p><p>🎥 <strong>Watch this video:</strong> \'Computer basics for absolute beginners\' (15 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Cu3R5v4r3Yw',
                duration: 18,
                type: 'video',
                resources: [
                  {
                    title: 'Interactive Computer Parts Quiz',
                    url: 'https://example.com/computer-parts-game',
                    type: 'link'
                  }
                ],
                quizQuestions: [
                  {
                    questionText: 'What is the \'brain\' of the computer called?',
                    type: 'multiple_choice',
                    options: ['Monitor', 'Keyboard', 'CPU (inside the tower or laptop)', 'Mouse'],
                    correctOptionIndex: 2,
                    explanation: 'The CPU (Central Processing Unit) processes all instructions. It is the brain of the computer.'
                  },
                  {
                    questionText: 'Which part displays what you are doing?',
                    type: 'multiple_choice',
                    options: ['Keyboard', 'Mouse', 'Monitor/Screen', 'Speakers'],
                    correctOptionIndex: 2,
                    explanation: 'The monitor shows you images, text, and video — everything you see on the computer.'
                  }
                ]
              },
              {
                title: 'How to Use a Mouse',
                content: '<p>The mouse is how you point, click, and interact with items on your screen.</p><p><strong>Mouse actions:</strong></p><ul><li><strong>Left-click (single click):</strong> Selects an item (icon, file, button)</li><li><strong>Right-click:</strong> Opens a menu of options specific to what you clicked on</li><li><strong>Double-click (two fast clicks):</strong> Opens a file, folder, or program</li><li><strong>Drag and drop:</strong> Click and hold, move the mouse, release — moves items from one place to another</li><li><strong>Scroll wheel:</strong> Roll it up or down to move through long pages or documents</li></ul><p>📸 <strong>Screenshot to include:</strong> A mouse image with arrows pointing to: left button (green), right button (red), scroll wheel (blue), and an annotation: \'Left-click = select\', \'Right-click = menu\', \'Double-click = open\'.</p><p>🎥 <strong>Watch this video:</strong> \'Mouse tutorial for beginners\' (12 minutes)</p><p><strong>Practice Assignment:</strong> Practice each mouse action 10 times: left-click, right-click, double-click, drag and drop, scroll. Write down one thing you discovered about each action. Submit your reflection.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=9xVnbVqZO5w',
                duration: 14,
                type: 'video',
                resources: [
                  {
                    title: 'Online Mouse Practice Game',
                    url: 'https://mouseprogram.com/practice/',
                    type: 'link'
                  }
                ],
                isAssignment: true,
                assignmentDescription: 'Practice each mouse action (left-click, right-click, double-click, drag and drop, scroll) 10 times. Write a short reflection on what you learned.',
                assignmentDeliverables: ['Mouse practice reflection document'],
                quizQuestions: [
                  {
                    questionText: 'What does a right-click do?',
                    type: 'multiple_choice',
                    options: ['Opens a file', 'Opens a menu of options', 'Closes a window', 'Types a letter'],
                    correctOptionIndex: 1,
                    explanation: 'Right-clicking opens a context menu with options related to whatever you clicked on.'
                  },
                  {
                    questionText: 'What does double-clicking do?',
                    type: 'multiple_choice',
                    options: ['Opens a file or program', 'Deletes the file', 'Renames the file', 'Moves the file'],
                    correctOptionIndex: 0,
                    explanation: 'Double-clicking is the standard way to open files, folders, and programs.'
                  }
                ]
              },
              {
                title: 'Turning On, Off, and Restarting',
                content: '<p><strong>To turn on:</strong> Press the power button (usually on the tower or laptop). Wait for the computer to start up — this may take 30 seconds to 2 minutes.</p><p><strong>To turn off (shut down):</strong> Click the Start button (Windows logo) → Power icon → Shut down. Never turn off a computer by holding the power button unless it is frozen.</p><p><strong>To restart:</strong> Start → Power → Restart. Restarting fixes most common problems because it clears temporary memory and reloads all software.</p><p>📸 <strong>Screenshot to include:</strong> Windows Start menu with Power icon highlighted, showing Shut Down and Restart options.</p><p>🎥 <strong>Watch this video:</strong> \'How to turn on and shut down a computer properly\' (7 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=sFafvUuR8lE',
                duration: 9,
                type: 'video',
                resources: [],
                quizQuestions: [
                  {
                    questionText: 'What should you do if a program is frozen?',
                    type: 'multiple_choice',
                    options: ['Unplug the computer', 'Restart the computer properly via Start menu', 'Hit the monitor', 'Wait 1 hour'],
                    correctOptionIndex: 1,
                    explanation: 'Restarting clears temporary memory and usually fixes frozen programs.'
                  },
                  {
                    questionText: 'How should you turn off a computer normally?',
                    type: 'multiple_choice',
                    options: ['Hold the power button for 10 seconds', 'Click Start → Power → Shut Down', 'Unplug the power cord', 'Close the lid (on laptop)'],
                    correctOptionIndex: 1,
                    explanation: 'Using the Start menu shut down lets the computer close files properly. Holding power is for emergencies only.'
                  }
                ]
              },
              {
                title: 'Module 1 Quiz',
                content: '<p>Test your understanding of computer hardware and basic operations.</p>',
                type: 'quiz',
                quizQuestions: [
                  {
                    questionText: 'What does the CPU do?',
                    type: 'multiple_choice',
                    options: ['Displays images', 'Processes instructions (the brain)', 'Types letters', 'Makes sound'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What does a right-click do?',
                    type: 'multiple_choice',
                    options: ['Opens a file', 'Opens a menu of options', 'Closes a window', 'Saves a file'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'How do you properly shut down a computer?',
                    type: 'multiple_choice',
                    options: ['Hold power button', 'Click Start → Power → Shut Down', 'Unplug it', 'Close all windows and wait'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What does double-clicking do?',
                    type: 'multiple_choice',
                    options: ['Renames a file', 'Opens a file or program', 'Deletes a file', 'Copies a file'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What is the scroll wheel used for?',
                    type: 'multiple_choice',
                    options: ['Clicking', 'Moving up and down on a page', 'Opening menus', 'Turning off the computer'],
                    correctOptionIndex: 1
                  }
                ]
              }
            ]
          },
          {
            title: 'Module 2: Files, Folders, and Organization',
            description: 'Learn how to save, find, and organize your documents so you never lose work again.',
            lessons: [
              {
                title: 'Saving and Opening Files',
                content: '<p><strong>To save a new file:</strong> File → Save As → Choose a name → Choose a location (Desktop, Documents, or a folder) → Click Save.</p><p><strong>Keyboard shortcut to save:</strong> Ctrl+S (or Cmd+S on Mac). Use this often — every few minutes while working.</p><p><strong>To open an existing file:</strong> File → Open → Browse to the location where you saved it → Select the file → Click Open.</p><p><strong>Where files are saved by default:</strong> \'Documents\' folder (Windows) or \'Documents\' (Mac). But you can choose any location.</p><p>📸 <strong>Screenshot to include:</strong> \'Save As\' dialog box with arrows pointing to \'File name\' field, \'Save as type\' dropdown, and location folders (Desktop, Documents).</p><p>🎥 <strong>Watch this video:</strong> \'How to save and open files in Windows\' (12 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=oTgs-6wLZ1o',
                duration: 14,
                type: 'video',
                resources: [],
                quizQuestions: [
                  {
                    questionText: 'What is the keyboard shortcut to save a file?',
                    type: 'multiple_choice',
                    options: ['Ctrl+O', 'Ctrl+S', 'Ctrl+P', 'Ctrl+Z'],
                    correctOptionIndex: 1,
                    explanation: 'Ctrl+S saves your work. Use it frequently — every few minutes.'
                  },
                  {
                    questionText: 'Where does Windows typically save files by default?',
                    type: 'multiple_choice',
                    options: ['Desktop', 'Documents folder', 'Downloads folder', 'Pictures folder'],
                    correctOptionIndex: 1,
                    explanation: 'The Documents folder is the default save location for most document files.'
                  }
                ]
              },
              {
                title: 'Creating and Using Folders',
                content: '<p>Folders help you group related files together. Without folders, your computer becomes a mess of hundreds of files with no organization.</p><p><strong>To create a folder on the desktop:</strong> Right-click on empty desktop space → New → Folder → Type a name (e.g., \'Work Reports\', \'2024 Projects\') → Press Enter.</p><p><strong>To create a folder inside Documents:</strong> Open File Explorer → Documents → Right-click empty space → New → Folder → Name it.</p><p><strong>To move a file into a folder:</strong> Click and drag the file onto the folder icon. Or right-click the file → Cut → Right-click the folder → Paste.</p><p>📸 <strong>Screenshot to include:</strong> Right-click context menu showing \'New → Folder\' highlighted. Second screenshot showing a folder named \'Work Projects\' with files inside.</p><p>🎥 <strong>Watch this video:</strong> \'Organizing files and folders for beginners\' (11 minutes)</p><p><strong>Practice Assignment:</strong> Create a folder on your desktop called \'Computer Literacy Course\'. Inside that folder, create three subfolders: \'Assignments\', \'Resources\', \'Notes\'. Create a blank text document called \'Welcome.txt\' and move it into the \'Notes\' folder. Take a screenshot showing the folder structure and submit it.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=u2XzAl6Bqio',
                duration: 13,
                type: 'video',
                resources: [
                  {
                    title: 'Download: File Organization Template (Folder Structure)',
                    url: 'https://example.com/folder-structure-guide.pdf',
                    type: 'pdf'
                  }
                ],
                isAssignment: true,
                assignmentDescription: 'Create a folder structure: \'Computer Literacy Course\' with subfolders \'Assignments\', \'Resources\', \'Notes\'. Create a text file and move it into \'Notes\'. Submit a screenshot.',
                assignmentDeliverables: ['Screenshot of folder structure'],
                quizQuestions: [
                  {
                    questionText: 'How do you create a new folder on the desktop?',
                    type: 'multiple_choice',
                    options: ['Press Ctrl+N', 'Right-click → New → Folder', 'Double-click desktop', 'Press the Delete key'],
                    correctOptionIndex: 1,
                    explanation: 'Right-click on empty desktop space, then choose New → Folder.'
                  },
                  {
                    questionText: 'What is the purpose of folders?',
                    type: 'multiple_choice',
                    options: ['To delete files', 'To organize related files together', 'To install programs', 'To change settings'],
                    correctOptionIndex: 1,
                    explanation: 'Folders group related files so you can find them later without searching everywhere.'
                  }
                ]
              },
              {
                title: 'Finding Lost Files',
                content: '<p>Everyone loses files sometimes. Here is how to find them:</p><p><strong>Method 1: Search bar</strong> — In File Explorer (Windows) or Finder (Mac), type part of the file name into the search box. Windows searches all folders.</p><p><strong>Method 2: Look in common places</strong> — Check Desktop, Documents, Downloads. Most files end up in one of these three places.</p><p><strong>Method 3: Search by date</strong> — Sort files by \'Date modified\' to see the most recent files first.</p><p><strong>Method 4: Use the \'Recent files\' list</strong> — In Word, Excel, or your Start menu, there is usually a list of recently opened files.</p><p>📸 <strong>Screenshot to include:</strong> File Explorer search bar with \'report\' typed in, showing search results. Also show \'Date modified\' column with arrow pointing to sort options.</p><p>🎥 <strong>Watch this video:</strong> \'How to find lost files on your computer\' (9 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=8DoCy1AxfP4',
                duration: 11,
                type: 'video',
                resources: [],
                quizQuestions: [
                  {
                    questionText: 'What are the three most common places where files are saved?',
                    type: 'multiple_choice',
                    options: ['C: drive, D: drive, E: drive', 'Desktop, Documents, Downloads', 'Pictures, Music, Videos', 'Program Files, Windows, System32'],
                    correctOptionIndex: 1,
                    explanation: 'Most users save files to Desktop, Documents, or Downloads by default.'
                  },
                  {
                    questionText: 'How can you find recently modified files?',
                    type: 'multiple_choice',
                    options: ['Sort by \'Date modified\'', 'Delete old files', 'Restart the computer', 'Search by file size'],
                    correctOptionIndex: 0,
                    explanation: 'Sorting by \'Date modified\' puts the newest files at the top of the list.'
                  }
                ]
              },
              {
                title: 'Module 2 Quiz',
                content: '<p>Test your understanding of files and folders.</p>',
                type: 'quiz',
                quizQuestions: [
                  {
                    questionText: 'What is the shortcut to save a file?',
                    type: 'multiple_choice',
                    options: ['Ctrl+O', 'Ctrl+S', 'Ctrl+P', 'Ctrl+N'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'How do you create a new folder?',
                    type: 'multiple_choice',
                    options: ['Press Ctrl+F', 'Right-click → New → Folder', 'Double-click the desktop', 'Press Delete'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'Where are files most commonly saved?',
                    type: 'multiple_choice',
                    options: ['Desktop, Documents, Downloads', 'C: drive only', 'Recycle Bin', 'Program Files'],
                    correctOptionIndex: 0
                  },
                  {
                    questionText: 'What does \'sort by date modified\' do?',
                    type: 'multiple_choice',
                    options: ['Deletes old files', 'Shows newest files first', 'Copies all files', 'Renames files'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What is the purpose of a folder?',
                    type: 'multiple_choice',
                    options: ['To delete files', 'To organize files', 'To install software', 'To change settings'],
                    correctOptionIndex: 1
                  }
                ]
              }
            ]
          },
          {
            title: 'Module 3: Word Processing (Microsoft Word & Google Docs)',
            description: 'Learn to create professional documents: letters, reports, and notes.',
            lessons: [
              {
                title: 'Getting Started with Microsoft Word',
                content: '<p>Microsoft Word is the most common word processor at work. Here are the essentials:</p><p><strong>Basic formatting:</strong></p><ul><li><strong>Bold:</strong> Ctrl+B — use for emphasis, titles, or headings</li><li><strong>Italic:</strong> Ctrl+I — use for book titles, foreign words, or mild emphasis</li><li><strong>Underline:</strong> Ctrl+U — use sparingly (too much underline is hard to read)</li><li><strong>Font size:</strong> Select text → Choose a number from the font size dropdown (body text = 11 or 12 pt)</li><li><strong>Save:</strong> Ctrl+S — do this every few minutes</li></ul><p>📸 <strong>Screenshot to include:</strong> Microsoft Word toolbar with Home tab selected, showing Bold (B), Italic (I), Underline (U), and font size dropdown (12) highlighted.</p><p>🎥 <strong>Watch this video:</strong> \'Microsoft Word for beginners — complete tutorial\' (18 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=SvKzIqKcS_w',
                duration: 20,
                type: 'video',
                resources: [
                  {
                    title: 'Microsoft Word Free Training (Microsoft Support)',
                    url: 'https://support.microsoft.com/en-us/word',
                    type: 'link'
                  }
                ],
                quizQuestions: [
                  {
                    questionText: 'What does Ctrl+B do in Word?',
                    type: 'multiple_choice',
                    options: ['Save', 'Bold text', 'Copy text', 'Paste text'],
                    correctOptionIndex: 1,
                    explanation: 'Ctrl+B applies bold formatting to selected text.'
                  },
                  {
                    questionText: 'What is the recommended font size for body text?',
                    type: 'multiple_choice',
                    options: ['8 pt', '11-12 pt', '18 pt', '24 pt'],
                    correctOptionIndex: 1,
                    explanation: '11 or 12 point is standard for most business documents.'
                  }
                ]
              },
              {
                title: 'Creating a Professional Letter',
                content: '<p>A professional letter has a standard structure. Here is a template you can use:</p><p><strong>Letter template:</strong></p><p>[Your Name]<br>[Your Title]<br>[Company Name]<br>[Date]</p><p>[Recipient Name]<br>[Recipient Title]<br>[Company Name]</p><p>Dear [Recipient Name],</p><p>[Opening paragraph: state why you are writing]</p><p>[Body paragraph: provide details or explanation]</p><p>[Closing paragraph: say what you want to happen next]</p><p>Sincerely,<br>[Your Name]</p><p>📸 <strong>Screenshot to include:</strong> A completed professional letter in Word with formatting: bold name, proper spacing, aligned paragraphs.</p><p>🎥 <strong>Watch this video:</strong> \'How to write a professional letter in Word\' (12 minutes)</p><p><strong>Practice Assignment:</strong> Write a one-page professional letter in Microsoft Word or Google Docs. The topic: Requesting time off for a training course. Use proper letter format. Save as \'YourName_Letter.docx\'. Submit the file.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=W2zE0SHF3jI',
                duration: 14,
                type: 'video',
                resources: [
                  {
                    title: 'Download: Professional Letter Template (Word)',
                    url: 'https://example.com/letter-template.docx',
                    type: 'link'
                  }
                ],
                isAssignment: true,
                assignmentDescription: 'Write a professional letter requesting time off for training. Use proper letter format. Submit the Word or Google Docs file.',
                assignmentDeliverables: ['Letter document'],
                quizQuestions: [
                  {
                    questionText: 'What comes after the recipient\'s address in a professional letter?',
                    type: 'multiple_choice',
                    options: ['Your signature', 'The date', 'Dear [Name], (salutation)', 'Sincerely'],
                    correctOptionIndex: 2,
                    explanation: 'After the recipient\'s address, you write the salutation: \'Dear [Name],\''
                  },
                  {
                    questionText: 'What is the standard closing for a professional letter?',
                    type: 'multiple_choice',
                    options: ['LoveRect', 'Best', 'Sincerely,', 'Cheers'],
                    correctOptionIndex: 2,
                    explanation: '\'Sincerely\' is the most common professional closing. \'Best\' can be used for less formal emails.'
                  }
                ]
              },
              {
                title: 'Typing Skills — Home Row and Practice',
                content: '<p>Typing without looking at the keyboard saves you hours every week. The foundation is the <strong>home row</strong>.</p><p><strong>Home row position:</strong></p><ul><li>Left hand: A S D F (pinky on A, ring on S, middle on D, index on F)</li><li>Right hand: J K L ; (index on J, middle on K, ring on L, pinky on ;)</li><li>Thumbs rest on the space bar</li><li>Keep your wrists straight, not bent up or down</li></ul><p><strong>Practice websites (free):</strong> typing.com, typingclub.com, 10fastfingers.com</p><p>📸 <strong>Screenshot to include:</strong> Keyboard diagram with home row (A S D F J K L ;) highlighted in green. Arrows showing finger placement on each key.</p><p>🎥 <strong>Watch this video:</strong> \'Learn to type faster in 10 minutes — home row method\' (10 minutes)</p><p><strong>Practice Assignment:</strong> Go to typing.com. Create a free account. Complete the \'Home Row\' and \'Top Row\' lessons. Take a screenshot of your completed lesson screen. Submit the screenshot.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=wWxKQAa1qF8',
                duration: 12,
                type: 'video',
                resources: [
                  {
                    title: 'Free Typing Practice — TypingClub',
                    url: 'https://www.typingclub.com/',
                    type: 'link'
                  },
                  {
                    title: 'Free Typing Practice — 10FastFingers',
                    url: 'https://10fastfingers.com/',
                    type: 'link'
                  }
                ],
                isAssignment: true,
                assignmentDescription: 'Complete the \'Home Row\' and \'Top Row\' lessons on typing.com. Submit a screenshot of your completion screen.',
                assignmentDeliverables: ['Typing lessons screenshot'],
                quizQuestions: [
                  {
                    questionText: 'Which keys are on the home row?',
                    type: 'multiple_choice',
                    options: ['Q W E R T Y', 'A S D F J K L ;', 'Z X C V B N M', '1 2 3 4 5 6'],
                    correctOptionIndex: 1,
                    explanation: 'The home row is where your fingers rest: A S D F for left hand, J K L ; for right hand.'
                  },
                  {
                    questionText: 'Which finger types the \'F\' key?',
                    type: 'multiple_choice',
                    options: ['Pinky', 'Ring finger', 'Middle finger', 'Index finger'],
                    correctOptionIndex: 3,
                    explanation: 'Your left index finger rests on F and reaches to G, R, T, and V.'
                  }
                ]
              },
              {
                title: 'Module 3 Quiz',
                content: '<p>Test your understanding of word processing and typing.</p>',
                type: 'quiz',
                quizQuestions: [
                  {
                    questionText: 'What does Ctrl+B do?',
                    type: 'multiple_choice',
                    options: ['Save', 'Bold', 'Copy', 'Paste'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What is the home row?',
                    type: 'multiple_choice',
                    options: ['Top row of keys', 'Middle row (A S D F J K L ;)', 'Bottom row', 'Number row'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What is the standard font size for body text?',
                    type: 'multiple_choice',
                    options: ['8 pt', '11-12 pt', '16 pt', '24 pt'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'Which finger rests on the \'J\' key?',
                    type: 'multiple_choice',
                    options: ['Left index', 'Right index', 'Left pinky', 'Right thumb'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What is a standard professional closing?',
                    type: 'multiple_choice',
                    options: ['Love,', 'Talk soon,', 'Sincerely,', 'Bye for now,'],
                    correctOptionIndex: 2
                  }
                ]
              }
            ]
          },
          {
            title: 'Module 4: Email and Internet Basics',
            description: 'Learn to send emails, attach files, search the web, and stay safe online.',
            lessons: [
              {
                title: 'Email Essentials — Sending and Receiving',
                content: '<p>Email is how most business communication happens. Here is how to use it effectively:</p><p><strong>To send an email (Gmail example):</strong></p><ol><li>Click \'Compose\' or \'+\' button</li><li>In the \'To\' field, type the recipient\'s email address</li><li>In the \'Subject\' field, write a short summary of what the email is about</li><li>Write your message in the large box</li><li>Click \'Send\'</li></ol><p><strong>Subject line best practices:</strong> Be specific. \'Meeting rescheduled to Friday at 2pm\' is better than \'Meeting\'.</p><p>📸 <strong>Screenshot to include:</strong> Gmail compose window with arrows pointing to \'To\' field, \'Subject\' field, message body, and Send button.</p><p>🎥 <strong>Watch this video:</strong> \'Email basics for beginners\' (15 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=YjJrRUrhY78',
                duration: 17,
                type: 'video',
                resources: [
                  {
                    title: 'Gmail Beginner\'s Guide (Google)',
                    url: 'https://support.google.com/mail/answer/5620',
                    type: 'link'
                  },
                  {
                    title: 'Outlook Beginner\'s Guide (Microsoft)',
                    url: 'https://support.microsoft.com/en-us/outlook',
                    type: 'link'
                  }
                ],
                quizQuestions: [
                  {
                    questionText: 'What is the purpose of the Subject line?',
                    type: 'multiple_choice',
                    options: ['To write the full message', 'To summarize the email briefly', 'To attach files', 'To delete the email'],
                    correctOptionIndex: 1,
                    explanation: 'The subject line tells the recipient what the email is about before they open it.'
                  },
                  {
                    questionText: 'Which is a better subject line?',
                    type: 'multiple_choice',
                    options: ['Hello', 'Meeting rescheduled to Friday 2pm', 'Important', 'Read this'],
                    correctOptionIndex: 1,
                    explanation: 'Specific subject lines help recipients prioritize and find emails later.'
                  }
                ]
              },
              {
                title: 'Attaching Files to Emails',
                content: '<p>Sometimes you need to send a document, photo, or spreadsheet. That\'s called an <strong>attachment</strong>.</p><p><strong>To attach a file:</strong></p><ol><li>Click the paperclip icon (📎) in the email compose window</li><li>Browse your computer to find the file you want to attach</li><li>Select the file and click \'Open\' or \'Attach\'</li><li>You will see the file name appear below the subject line</li><li>Write your message and click Send</li></ol><p><strong>Before sending:</strong> Try to open the attachment yourself. If you can\'t open it, the recipient probably can\'t either.</p><p>📸 <strong>Screenshot to include:</strong> Email compose window with paperclip icon highlighted, and an attached file showing below the subject line.</p><p>🎥 <strong>Watch this video:</strong> \'How to attach files to emails\' (8 minutes)</p><p><strong>Practice Assignment:</strong> Send an email to yourself (your own email address). Attach any document (can be a blank text file). In the subject line write \'Test Attachment — Your Name\'. Take a screenshot of the sent email showing the attachment. Submit the screenshot.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=R0zyDv0D1aY',
                duration: 10,
                type: 'video',
                resources: [],
                isAssignment: true,
                assignmentDescription: 'Send an email to yourself with an attachment. Submit a screenshot showing the attachment in the sent email.',
                assignmentDeliverables: ['Screenshot of email with attachment'],
                quizQuestions: [
                  {
                    questionText: 'What icon is used to attach a file?',
                    type: 'multiple_choice',
                    options: ['A star', 'A paperclip', 'A trash can', 'A magnifying glass'],
                    correctOptionIndex: 1,
                    explanation: 'The paperclip icon (📎) universally represents attaching files.'
                  },
                  {
                    questionText: 'What should you do before sending an attachment?',
                    type: 'multiple_choice',
                    options: ['Delete the file', 'Try to open it yourself first', 'Rename it randomly', 'Compress it to zip'],
                    correctOptionIndex: 1,
                    explanation: 'If you can\'t open the attachment, the recipient likely can\'t either.'
                  }
                ]
              },
              {
                title: 'Searching the Web Safely',
                content: '<p>The internet is a powerful tool, but you need to use it safely.</p><p><strong>How to search effectively:</strong></p><ul><li>Use Google or Bing (type the address: google.com or bing.com)</li><li>Type specific words, not full questions: \'weather Nairobi today\' not \'What is the weather like in Nairobi today?\'</li><li>Use quotes for exact phrases: \'climate change report 2024\'</li></ul><p><strong>How to stay safe:</strong></p><ul><li>Do not click on ads — they say \'Ad\' or \'Sponsored\' next to the link</li><li>Stick to trusted websites (.gov, .edu, or well-known company sites)</li><li>Do not download files from unknown websites</li><li>Do not enter personal information on sites that don\'t have \'https://\' (the \'s\' means secure)</li></ul><p>📸 <strong>Screenshot to include:</strong> Google search results showing: (1) circled \'Ad\' label on sponsored results, (2) circled \'https://\' in the address bar of a secure website, (3) padlock icon for secure connection.</p><p>🎥 <strong>Watch this video:</strong> \'Internet safety for beginners\' (12 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=W2P_C6eB1JI',
                duration: 14,
                type: 'video',
                resources: [
                  {
                    title: 'Google Search Tips (Official)',
                    url: 'https://support.google.com/websearch/answer/134479',
                    type: 'link'
                  }
                ],
                quizQuestions: [
                  {
                    questionText: 'What does \'https://\' tell you about a website?',
                    type: 'multiple_choice',
                    options: ['It is slow', 'It is secure (encrypted)', 'It is from the government', 'It is a scam'],
                    correctOptionIndex: 1,
                    explanation: 'The \'s\' stands for \'secure\' — data sent to/from the site is encrypted.'
                  },
                  {
                    questionText: 'What do \'Ad\' or \'Sponsored\' labels mean in search results?',
                    type: 'multiple_choice',
                    options: ['These are the most relevant results', 'Someone paid for this link to appear', 'These are the safest results', 'These are from the government'],
                    correctOptionIndex: 1,
                    explanation: 'Advertisements are paid placements. They are not necessarily the best or most relevant results.'
                  }
                ]
              },
              {
                title: 'Module 4 Quiz',
                content: '<p>Test your understanding of email and internet.</p>',
                type: 'quiz',
                quizQuestions: [
                  {
                    questionText: 'What is the purpose of the Subject line?',
                    type: 'multiple_choice',
                    options: ['Full message', 'Short summary', 'Attachment list', 'Recipient address'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What icon attaches a file?',
                    type: 'multiple_choice',
                    options: ['Star', 'Paperclip', 'Trash can', 'Magnifying glass'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What does \'https://\' indicate?',
                    type: 'multiple_choice',
                    options: ['The site is slow', 'The site is secure', 'The site is from a company', 'The site is fake'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'What do \'Ad\' labels mean in search results?',
                    type: 'multiple_choice',
                    options: ['Most relevant', 'Paid advertisement', 'Most popular', 'Most secure'],
                    correctOptionIndex: 1
                  },
                  {
                    questionText: 'Which search is better?',
                    type: 'multiple_choice',
                    options: ['\'How do I fix a leaking faucet?\'', '\'fix leaky faucet\'', '\'faucet\'', '\'water coming out of pipe\''],
                    correctOptionIndex: 1
                  }
                ]
              }
            ]
          },
          {
            title: 'Module 5: Keyboard Shortcuts, Troubleshooting, and Final Exam',
            description: 'Master time-saving shortcuts and learn to fix common computer problems.',
            lessons: [
              {
                title: 'Essential Keyboard Shortcuts',
                content: '<p>Keyboard shortcuts save you hours over time. Memorize these:</p><p><strong>Universal shortcuts (work in almost every program):</strong></p><ul><li><strong>Ctrl+C</strong> — Copy selected text or item</li><li><strong>Ctrl+X</strong> — Cut (copy and remove)</li><li><strong>Ctrl+V</strong> — Paste what you copied or cut</li><li><strong>Ctrl+Z</strong> — Undo (reverse last action)</li><li><strong>Ctrl+Y</strong> — Redo (reverse an undo)</li><li><strong>Ctrl+S</strong> — Save</li><li><strong>Ctrl+P</strong> — Print</li><li><strong>Ctrl+F</strong> — Find (search within a document or webpage)</li><li><strong>Ctrl+A</strong> — Select all (everything in the current document or window)</li></ul><p><strong>Window and navigation shortcuts:</strong></p><ul><li><strong>Alt+Tab</strong> (Windows) or <strong>Cmd+Tab</strong> (Mac) — Switch between open programs</li><li><strong>Ctrl+Tab</strong> — Switch between tabs in a browser</li><li><strong>Windows key + D</strong> — Show desktop (minimize all windows)</li><li><strong>Alt+F4</strong> — Close the current window</li></ul><p>📸 <strong>Screenshot to include:</strong> A cheat sheet poster showing all essential keyboard shortcuts with icons (Ctrl+C, Ctrl+V, Ctrl+Z, Ctrl+S, Alt+Tab).</p><p>🎥 <strong>Watch this video:</strong> \'30 essential keyboard shortcuts you need to know\' (15 minutes)</p><p><strong>Practice Assignment:</strong> For one week, challenge yourself to use shortcuts instead of the mouse for Copy, Paste, Undo, Save, and Switch Window. At the end of the week, write a short reflection: Which shortcuts saved you the most time? Submit your reflection.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=7j_GJhAIvoU',
                duration: 17,
                type: 'video',
                resources: [
                  {
                    title: 'Download: Keyboard Shortcuts Cheat Sheet (PDF)',
                    url: 'https://example.com/shortcuts-cheatsheet.pdf',
                    type: 'pdf'
                  }
                ],
                isAssignment: true,
                assignmentDescription: 'Use keyboard shortcuts for Copy, Paste, Undo, Save, and Switch Window for one week. Write a reflection on which saved you the most time.',
                assignmentDeliverables: ['Shortcuts reflection document'],
                quizQuestions: [
                  {
                    questionText: 'What does Ctrl+Z do?',
                    type: 'multiple_choice',
                    options: ['Copy', 'Paste', 'Undo', 'Save'],
                    correctOptionIndex: 2,
                    explanation: 'Ctrl+Z undoes your last action — a lifesaver when you make a mistake.'
                  },
                  {
                    questionText: 'What does Alt+Tab (Windows) do?',
                    type: 'multiple_choice',
                    options: ['Close the window', 'Switch between open programs', 'Open the Start menu', 'Copy text'],
                    correctOptionIndex: 1,
                    explanation: 'Alt+Tab lets you jump between open programs without using your mouse.'
                  },
                  {
                    questionText: 'What does Ctrl+F do?',
                    type: 'multiple_choice',
                    options: ['Save', 'Print', 'Find/Search', 'Format'],
                    correctOptionIndex: 2,
                    explanation: 'Ctrl+F opens a search box to find words within a document or webpage.'
                  }
                ]
              },
              {
                title: 'Basic Troubleshooting — Fixing Common Problems',
                content: '<p>Computers sometimes misbehave. Here is how to fix the most common problems:</p><p><strong>Problem 1: Program is frozen (not responding)</strong><br>Solution: Wait 30 seconds. If still frozen, press Ctrl+Alt+Delete → Task Manager → Select the frozen program → End Task. Then restart the program.</p><p><strong>Problem 2: Computer is very slow</strong><br>Solutions: Restart the computer. Close programs you aren\'t using. Check if your hard drive is full (delete old files).</p><p><strong>Problem 3: Can\'t connect to Wi-Fi</strong><br>Solutions: Turn Wi-Fi off and on again. Restart the computer. Forget the network and reconnect.</p><p><strong>Problem 4: \'File not found\' when trying to open a document</strong><br>Solution: Search for the file name. Maybe it was moved or renamed. Check Recycle Bin.</p><p><strong>Problem 5: Printer not working</strong><br>Solutions: Check that printer is turned on and has paper. Check the USB cable or Wi-Fi connection. Restart the printer.</p><p>📸 <strong>Screenshot to include:</strong> Task Manager window showing a frozen program selected and \'End Task\' button highlighted.</p><p>🎥 <strong>Watch this video:</strong> \'Basic computer troubleshooting for beginners\' (12 minutes)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=0g6Y4wWhi9I',
                duration: 14,
                type: 'video',
                resources: [],
                quizQuestions: [
                  {
                    questionText: 'What should you do first when a program freezes?',
                    type: 'multiple_choice',
                    options: ['Unplug the computer', 'Wait 30 seconds, then use Task Manager to end the task', 'Hit the monitor', 'Restart immediately'],
                    correctOptionIndex: 1,
                    explanation: 'Wait briefly — sometimes the program recovers. Then use Task Manager to close it.'
                  },
                  {
                    questionText: 'What is a quick fix for a slow computer?',
                    type: 'multiple_choice',
                    options: ['Buy a new computer', 'Restart it', 'Delete all files', 'Turn off the monitor'],
                    correctOptionIndex: 1,
                    explanation: 'Restarting clears temporary memory and often speeds up a slow computer.'
                  }
                ]
              },
              {
                title: 'Final Exam — Computer Literacy Mastery',
                content: '<p>This exam tests everything you have learned across all 5 modules. You have 45 minutes to complete 25 questions (20 multiple choice, 5 open-ended). Passing score: 70%.</p>',
                type: 'assignment',
                assignmentQuestions: [
                  {
                    questionText: 'What does CPU stand for?',
                    type: 'mcq',
                    options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Computer Processing Utility'],
                    correctOptionIndex: 0,
                    points: 4
                  },
                  {
                    questionText: 'What does a right-click do?',
                    type: 'mcq',
                    options: ['Opens a file', 'Opens a menu of options', 'Closes a window', 'Saves a file'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is the keyboard shortcut to save a file?',
                    type: 'mcq',
                    options: ['Ctrl+O', 'Ctrl+S', 'Ctrl+P', 'Ctrl+N'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'How do you create a new folder?',
                    type: 'mcq',
                    options: ['Press Ctrl+N', 'Right-click → New → Folder', 'Double-click desktop', 'Press Delete'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What does Ctrl+Z do?',
                    type: 'mcq',
                    options: ['Copy', 'Paste', 'Undo', 'Redo'],
                    correctOptionIndex: 2,
                    points: 4
                  },
                  {
                    questionText: 'What does Ctrl+B do in Word?',
                    type: 'mcq',
                    options: ['Save', 'Bold', 'Copy', 'Paste'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is the home row?',
                    type: 'mcq',
                    options: ['A S D F J K L ;', 'Q W E R T Y', 'Z X C V B N M', '1 2 3 4 5 6'],
                    correctOptionIndex: 0,
                    points: 4
                  },
                  {
                    questionText: 'What is the purpose of the Subject line in email?',
                    type: 'mcq',
                    options: ['Full message', 'Short summary', 'Attachment list', 'Recipient address'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What icon attaches a file?',
                    type: 'mcq',
                    options: ['Star', 'Paperclip', 'Trash can', 'Magnifying glass'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What does \'https://\' indicate?',
                    type: 'mcq',
                    options: ['The site is slow', 'The site is secure', 'The site is from a company', 'The site is fake'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What does Ctrl+F do?',
                    type: 'mcq',
                    options: ['Save', 'Print', 'Find/Search', 'Format'],
                    correctOptionIndex: 2,
                    points: 4
                  },
                  {
                    questionText: 'What should you do first when a program freezes?',
                    type: 'mcq',
                    options: ['Unplug computer', 'Wait 30 seconds, then use Task Manager', 'Hit monitor', 'Restart immediately'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What does Alt+Tab (Windows) do?',
                    type: 'mcq',
                    options: ['Close window', 'Switch between open programs', 'Open Start menu', 'Copy text'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'Where are files most commonly saved?',
                    type: 'mcq',
                    options: ['C: drive only', 'Desktop, Documents, Downloads', 'Recycle Bin', 'Program Files'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is a quick fix for a slow computer?',
                    type: 'mcq',
                    options: ['Buy new computer', 'Restart it', 'Delete all files', 'Turn off monitor'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What does \'sort by date modified\' do?',
                    type: 'mcq',
                    options: ['Deletes old files', 'Shows newest files first', 'Copies all files', 'Renames files'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is the recommended font size for body text?',
                    type: 'mcq',
                    options: ['8 pt', '11-12 pt', '18 pt', '24 pt'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What do \'Ad\' labels mean in search results?',
                    type: 'mcq',
                    options: ['Most relevant', 'Paid advertisement', 'Most popular', 'Most secure'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is the standard professional closing in a letter?',
                    type: 'mcq',
                    options: ['Love,', 'Sincerely,', 'Cheers,', 'Talk soon,'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'What is the purpose of a folder?',
                    type: 'mcq',
                    options: ['To delete files', 'To organize files', 'To install software', 'To change settings'],
                    correctOptionIndex: 1,
                    points: 4
                  },
                  {
                    questionText: 'Describe three keyboard shortcuts you will use regularly and what they do.',
                    type: 'open',
                    points: 10
                  },
                  {
                    questionText: 'Explain how you would organize files on your computer to find them easily.',
                    type: 'open',
                    points: 10
                  },
                  {
                    questionText: 'What will you do differently on a computer after completing this course?',
                    type: 'open',
                    points: 10
                  },
                  {
                    questionText: 'Describe how to send an email with an attachment.',
                    type: 'open',
                    points: 10
                  },
                  {
                    questionText: 'What steps would you take if a program freezes on your computer?',
                    type: 'open',
                    points: 10
                  }
                ],
                assignmentConfig: {
                  timeLimit: 45,
                  allowRetakes: true,
                  disableRightClick: true,
                  mode: 'exam'
                }
              }
            ]
          }
        ]
      };

      const course = await new Course(literacyData as any).save();
      console.log(`✅ Successfully seeded literacy course: "${course.title}" with ID ${course._id}`);
    }

    // 3. Seed School Courses (Without deleting any existing courses)
    console.log('\n🏫 Seeding School courses (without deleting)...');
    const schoolCourses = [
      {
        title: "Software Engineering Bootcamp",
        description: "Intensive 12-week software engineering program focusing on full-stack development with React and Node.js.",
        thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 500000,
        level: "Beginner",
        category: "Development",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "Advanced Data Science",
        description: "Master machine learning, deep learning, and big data technologies.",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 750000,
        level: "Advanced",
        category: "Data Science",
        status: "published",
        school: "Greenhill Academy"
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Learn to design beautiful, user-friendly interfaces using Figma and modern design principles.",
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 300000,
        level: "Intermediate",
        category: "Design",
        status: "published",
        school: "IHUB Academy"
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "Comprehensive guide to SEO, social media marketing, and content strategy.",
        thumbnail: "https://images.unsplash.com/photo-1432888117286-315d5abac34a?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 250000,
        level: "Beginner",
        category: "Marketing",
        status: "published",
        school: "Kigali Business School"
      },
      {
        title: "Cybersecurity Essentials",
        description: "Learn how to protect networks, systems, and data from digital attacks.",
        thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 600000,
        level: "Advanced",
        category: "IT & Software",
        status: "published",
        school: "Kingdavid"
      },
      {
        title: "Business Leadership & Management",
        description: "Develop critical leadership skills and learn how to manage modern organizations effectively.",
        thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
        instructor: admin._id,
        price: 450000,
        level: "Intermediate",
        category: "Business",
        status: "published",
        school: "Greenhill Academy"
      }
    ];

    for (const sc of schoolCourses) {
      const existing = await Course.findOne({ title: sc.title, school: sc.school });
      if (existing) {
        console.log(`⚠️  School course already exists: "${sc.title}" (${sc.school}). Skipping.`);
      } else {
        const saved = await new Course(sc).save();
        console.log(`✅ Seeded school course: "${saved.title}" (${saved.school})`);
      }
    }

    // 4. Seed Summer Internship on JS Projects
    console.log('\n💼 Seeding Summer Internship on JS Projects...');
    const programTitle = 'Summer Internship on JS Projects 2026';
    let program = await InternshipProgram.findOne({ title: programTitle });

    if (!program) {
      program = new InternshipProgram({
        title: programTitle,
        description: 'An intensive 3-month hands-on summer internship program focused on developing production-grade JavaScript & TypeScript applications.',
        duration: '3 Months',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        applicationDeadline: new Date('2026-05-25'),
        eligibility: ['Basic JavaScript understanding', 'Familiarity with HTML/CSS', 'Passion for web development'],
        rules: 'Learn, build high-performance clean JS code, and collaborate effectively.',
        price: 0,
        currency: 'RWF',
        status: 'active'
      });
      await program.save();
      console.log(`✅ Seeded Internship Program: "${program.title}"`);
    } else {
      console.log(`⚠️  Internship Program already exists: "${program.title}". Skipping creation.`);
    }

    // Project under the program
    const projectTitle = 'Next-Gen JavaScript Full-Stack Suite';
    let project = await InternshipProject.findOne({ title: projectTitle });

    if (!project) {
      const richDoc = `
# Next-Gen JavaScript Full-Stack Suite
## Development & Implementation Guide

### 1. Executive Summary & Core Objective
The **Next-Gen JavaScript Full-Stack Suite** is designed to train developers to build enterprise-grade, performant, and secure single-page and server-side JS applications. You will create a real-time collaborative workspace containing advanced dashboards, visual charts, and complex async modules.

### 2. Feature Requirements
- **Real-Time Workspace Sync:** Implement high-speed bi-directional communications using Node.js, Express, and WebSockets/Socket.io.
- **Dynamic Client-Side State:** Leverage React Context and advanced state management pipelines.
- **Interactive UI Charts:** Integrate interactive dashboard metrics visualizing application health and activity log.
- **Authentication & Security:** JWT tokens, secure password hashing with bcrypt, and endpoint rate-limiting.

### 3. Weekly Development Plan
- **Week 1-2:** Node.js Boilerplate, Express routers, ESLint/Prettier, MongoDB connection.
- **Week 3-4:** RESTful API Design, JWT auth, and Mongoose schemas.
- **Week 5-7:** Frontend client setup with Vite, state configuration, Tailwind styling.
- **Week 8-9:** WebSocket integration, bi-directional events, real-time toast alerts.
- **Week 10-11:** Jest unit tests, Supertest endpoint validation, code coverage.
- **Week 12:** Deployment on Vercel/Render, custom domain setup, graduation showcase.
      `;

      project = new InternshipProject({
        internshipProgramId: program._id,
        title: projectTitle,
        description: 'Build an elegant and real-time JavaScript collaborative application suite from scratch using the MERN stack.',
        document: richDoc,
        requiredSkills: ['JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'MongoDB', 'Socket.io'],
        teamSizeRange: { min: 2, max: 4 },
        status: 'published',
        workflow: DEFAULT_WORKFLOW,
        objectives: [
          "Setup Express backend with ES6 modular syntax",
          "Build secure user authorization using JSON Web Tokens (JWT)",
          "Implement responsive dashboard visualization using React and TailwindCSS",
          "Integrate real-time workspace collaboration using Socket.io"
        ]
      });
      await project.save();
      console.log(`✅ Seeded Internship Project: "${project.title}"`);

      // Add Milestones
      const milestones = [
        { title: "Technical Architecture Plan", desc: "Design backend routes, DB schemas, and state workflow.", days: 10 },
        { title: "Core RESTful APIs", desc: "Database models, authentication, and endpoint setup.", days: 30 },
        { title: "Frontend Dashboard Integration", desc: "Design responsive React components and connect API.", days: 60 },
        { title: "WebSockets & Testing", desc: "Integrate live chat/sync modules and run Jest test suites.", days: 80 },
        { title: "Production Launch", desc: "Production compilation, deployment, and performance audits.", days: 90 }
      ];

      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        const deadline = new Date(program.startDate);
        deadline.setDate(deadline.getDate() + m.days);

        await new InternshipMilestone({
          internshipProjectId: project._id,
          title: m.title,
          description: m.desc,
          deadline: deadline,
          order: i,
          completed: i === 0,
          completedAt: i === 0 ? new Date() : undefined
        }).save();
      }
      console.log('✅ Seeded 5 Milestones for the JavaScript project.');

      // Setup team with Alice & Bob if they exist (or create them if not)
      console.log('👥 Setup Team and tasks...');
      const student1 = await User.findOneAndUpdate(
        { username: 'student_alice' },
        { username: 'student_alice', email: 'alice@bootskills.com', password, role: 'student', fullName: 'Alice Peterson' },
        { upsert: true, new: true }
      );

      const student2 = await User.findOneAndUpdate(
        { username: 'student_bob' },
        { username: 'student_bob', email: 'bob@bootskills.com', password, role: 'student', fullName: 'Bob Builder' },
        { upsert: true, new: true }
      );

      const team = new InternshipTeam({
        name: 'JS Visionaries Team',
        internshipProjectId: project._id,
        internshipProgramId: program._id,
        mentorId: mentor._id,
        status: 'active',
        type: 'team'
      });
      await team.save();

      await new InternshipTeamMember({ teamId: team._id, userId: student1._id, role: 'Team Lead' }).save();
      await new InternshipTeamMember({ teamId: team._id, userId: student2._id, role: 'Developer' }).save();

      const sprint = new InternshipSprint({
        projectId: project._id,
        teamId: team._id,
        title: 'JS Sprint 1: Architecture & API Init',
        goal: 'Initialize repository, Express servers, and database integration schema.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        order: 1
      });
      await sprint.save();

      const jsTaskThemes = [
        "Initialize Node.js project boilerplate with Express & Babel",
        "Set up mongoose connection models & schemas",
        "Create JWT registration and login validation middleware",
        "Design React components for main dashboard landing page",
        "Implement WebSockets bidirectional socket engine setup",
        "Write Jest assertions for user routing system",
        "Audit JS bundle size and optimize web app loading",
        "Incorporate custom toast notices on WebSocket state change",
        "Configure Docker local containers for Mongo DB service",
        "Draft comprehensive REST Swagger API documentation",
        "Perform accessibility debugging (a11y check) on layouts",
        "Setup complete automatic GitHub Actions pipeline deploy"
      ];

      for (let i = 0; i < jsTaskThemes.length; i++) {
        const status = i < 4 ? 'done' : (i < 8 ? 'in_progress' : 'todo');
        const priority = ['high', 'medium', 'low'][i % 3];

        const task = new InternshipTask({
          projectId: project._id,
          teamId: team._id,
          sprintId: i < 6 ? sprint._id : undefined,
          title: jsTaskThemes[i],
          description: `Deliverable task for ${project.title}: Implementing ${jsTaskThemes[i].toLowerCase()}.`,
          priority,
          status,
          taskType: i % 3 === 0 ? 'feature' : 'task',
          order: i,
          assigneeId: student1._id,
          labels: ['javascript', 'sprint-1', 'fullstack']
        });
        await task.save();

        if (status === 'done') {
          await new InternshipActivityLog({
            userId: student1._id,
            action: 'COMPLETED',
            module: 'InternshipTask',
            targetType: 'InternshipTask',
            targetId: task._id,
            details: `Completed task: "${task.title}"`
          }).save();
        }
      }
      console.log('✅ Generated and assigned 12 real-world tasks for JS program team.');
    } else {
      console.log(`⚠️  Internship Project already exists: "${project.title}". Skipping creation.`);
    }

    // 4. Seed "Smartphone Secrets" course
    console.log('📱 Seeding Smartphone Secrets course...');
    const smartphoneExists = await Course.findOne({ title: 'Smartphone Secrets — 100+ Hidden Tips & Tricks for iPhone & Android' });
    if (!smartphoneExists) {
      await new Course({
        title: 'Smartphone Secrets — 100+ Hidden Tips & Tricks for iPhone & Android',
        description: '<p>Master your phone with powerful hidden features you never knew existed. Short, actionable tips for both iPhone and Android. Save time, protect your privacy, and use your phone like a pro.</p>',
        thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/smartphone_secrets.webp',
        price: 0,
        discountPrice: 0,
        level: 'Beginner',
        category: 'Technology',
        status: 'published',
        studentsEnrolled: [],
        instructor: admin._id,
        modules: [
          {
            title: 'Module 1: Keyboard & Typing Secrets — Type Faster on Any Phone',
            description: 'Hidden keyboard tricks that double your typing speed on both iPhone and Android.',
            lessons: [
              {
                title: 'Tip 1: Swipe to Type (Glide Typing) — Android & iPhone',
                content: '<p><strong>What it does:</strong> Instead of tapping each letter, slide your finger from letter to letter without lifting it — the phone predicts the word.</p><p><strong>Android:</strong> Already built-in on Gboard. Go to <em>Settings → System → Languages & Input → On-screen keyboard → Gboard → Glide typing</em> and turn it on.</p><p><strong>iPhone:</strong> Available from iOS 13+ via the default keyboard. Just slide across letters — no setup required.</p><p><strong>Why it matters:</strong> Most people type 30–40 WPM tapping. Swiping bumps that to 50–60+ WPM with practice.</p>',
                duration: 3,
                resources: [],
              },
              {
                title: 'Tip 2: One-Handed Keyboard Mode',
                content: '<p><strong>Problem:</strong> Phones are huge. Typing with one hand is painful.</p><p><strong>Android (Gboard):</strong> Long-press the comma key → tap the one-handed keyboard icon. The keyboard shrinks to the left or right side.</p><p><strong>iPhone:</strong> Long-press the globe/emoji key → choose left or right one-handed layout.</p><p><strong>Pro tip:</strong> This also makes it easier to reach the number row — great for filling forms while standing.</p>',
                duration: 3,
                resources: [],
              },
              {
                title: 'Tip 3: Instant Number Row Access',
                content: '<p><strong>The trick:</strong> You don\'t need to switch to the numbers keyboard to type a number.</p><p><strong>Android (Gboard):</strong> Long-press any letter key that has a number above it → slide up → release. Done.</p><p><strong>iPhone:</strong> Tap and hold the "123" key → without lifting, slide to the number you want → release. The keyboard goes back to letters automatically.</p><p><strong>Time saved:</strong> About 2 taps per number. That\'s huge if you type phone numbers or PINs often.</p>',
                duration: 3,
                resources: [],
              },
              {
                title: 'Tip 4: Shake to Undo (iPhone) & Backspace Hold (Both)',
                content: '<p><strong>iPhone – Shake to Undo:</strong> Made a typo? Shake your phone gently. A popup says "Undo Typing." Tap it. Your last typing action is reversed. Shake again and tap "Redo Typing" to bring it back.</p><p><strong>Both phones – Hold Backspace:</strong> Instead of tapping backspace repeatedly, hold it down. On iPhone, after a moment it starts deleting whole words. On Android it just speeds up. Great for clearing a sentence fast.</p><p><strong>iPhone extra:</strong> Use three-finger swipe left to undo, three-finger swipe right to redo — no shaking needed.</p>',
                duration: 3,
                resources: [],
              },
              {
                title: 'Tip 5: Smart Punctuation & Shortcuts',
                content: '<p><strong>Period shortcut:</strong> Double-tap the spacebar on both iPhone and Android (Gboard) to insert a period + space automatically. This works in almost every app.</p><p><strong>Quotation/apostrophe:</strong> Long-press the comma or apostrophe key to see all quote options (single, double, curly).</p><p><strong>Symbols fast:</strong> On Gboard, swipe down on a letter to type the symbol shown above it without switching keyboards.</p><p><strong>Text replacement (iPhone):</strong> Go to <em>Settings → General → Keyboard → Text Replacement</em>. Add shortcuts like "omw" → "On my way!" or "addr" → your full address. Game-changer for long-text responders.</p>',
                duration: 4,
                resources: [],
              },
            ],
          },
          {
            title: 'Module 2: Camera Secrets — Take Pro Photos Without Trying',
            description: 'Hidden camera tricks most people never discover.',
            lessons: [
              {
                title: 'Tip 6: Volume Button as Shutter (Both Phones)',
                content: '<p><strong>The trick:</strong> Press the volume up or volume down button to take a photo — no need to reach the on-screen button.</p><p><strong>Why it matters:</strong> Holding a phone and tapping the screen causes camera shake. Using the volume button lets you hold the phone with two hands like a real camera — sharper photos.</p><p><strong>iPhone extra:</strong> You can also use the volume button on your wired EarPods as a remote shutter — great for selfies or group photos from a distance.</p><p><strong>Android:</strong> Same trick works. Also try setting the volume button to zoom in/out in camera settings.</p>',
                duration: 3,
                resources: [],
              },
              {
                title: 'Tip 7: Lock Focus & Exposure (iPhone & Android)',
                content: '<p><strong>Problem:</strong> You tap to focus, but the camera keeps readjusting when something moves.</p><p><strong>iPhone:</strong> Tap and hold on your subject until you see "AE/AF Lock" at the top. Now the focus and brightness are locked — even if someone walks in front of the camera.</p><p><strong>Android:</strong> Tap and hold the subject in the default Camera app. A yellow or white square locks focus. On Gboard Camera, look for the lock icon.</p><p><strong>Use case:</strong> Shooting a speaker on stage. Lock focus on them — crowd movement won\'t blur your shot.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 8: Burst Mode for Action Shots',
                content: '<p><strong>What it does:</strong> Captures 10+ photos per second so you can pick the perfect moment.</p><p><strong>iPhone (older models):</strong> Hold the shutter button down — burst fires automatically.</p><p><strong>iPhone 11+:</strong> Swipe the shutter button to the left (in photo mode) to trigger burst. Or enable "Use Volume Up for Burst" in <em>Settings → Camera</em>.</p><p><strong>Android:</strong> Hold the shutter button down in the native camera app. Most phones burst continuously.</p><p><strong>Best for:</strong> Kids playing, athletes, jumping photos, pets, waves crashing. Pick the best frame afterward.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 9: Hidden Timer & Grid Features',
                content: '<p><strong>Timer:</strong> In the camera app, tap the clock icon (usually 3s or 10s). Great for group selfies — set the phone on a surface and jump into the shot.</p><p><strong>Grid overlay:</strong> Turn on the grid in camera settings. It shows a 3×3 grid on screen. Use the "Rule of Thirds" — place your subject where the lines intersect for more professional-looking photos.</p><p><strong>iPhone:</strong> <em>Settings → Camera → Grid</em> → toggle on.</p><p><strong>Android:</strong> Open Camera → Settings gear → look for "Grid lines" or "Guide lines."</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 10: Use the Rear Camera for Selfies (Trick)',
                content: '<p><strong>Problem:</strong> Front cameras are lower quality than rear cameras.</p><p><strong>The trick:</strong> Ask someone to take your photo with the rear camera. Or use the timer (Tip 9) with the rear camera pointed at you. On iPhone, tap the flip icon to see yourself in the viewfinder — then use the timer.</p><p><strong>On Android:</strong> Set a 3-second timer, flip to rear camera, use the volume button (so you can hold the phone outward), and smile.</p><p><strong>Result:</strong> Dramatically sharper, more detailed photos — especially in low light.</p>',
                duration: 3,
                resources: [],
              },
            ],
          },
          {
            title: 'Module 3: Battery & Performance Secrets',
            description: 'Make your phone last longer and run faster with these hidden tweaks.',
            lessons: [
              {
                title: 'Tip 11: Dark Mode Saves Battery (OLED Screens)',
                content: '<p><strong>How it works:</strong> On OLED/AMOLED screens (most modern phones), black pixels are literally OFF — they use zero power. Dark mode turns most of the screen black, saving significant battery.</p><p><strong>iPhone:</strong> <em>Settings → Display & Brightness → Dark</em>. Or add it to Control Center for quick access.</p><p><strong>Android:</strong> <em>Settings → Display → Dark theme</em>. Schedule it to turn on at sunset automatically.</p><p><strong>Important:</strong> This only helps on OLED screens (iPhone X and later, most Samsung Galaxy phones, Pixel phones). LCD screens don\'t benefit as much.</p><p><strong>Extra tip:</strong> Use a pure black wallpaper to save even more battery.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 12: Find Battery-Draining Apps',
                content: '<p><strong>iPhone:</strong> Go to <em>Settings → Battery</em>. Scroll down to see which apps used the most battery in the last 24 hours or 10 days. Apps with "Background Activity" noted are draining power when you\'re not using them.</p><p><strong>Android:</strong> Go to <em>Settings → Battery → Battery Usage</em>. Tap any app to see details and restrict background activity.</p><p><strong>Action:</strong> For any app using too much battery in the background, disable background refresh. iPhone: <em>Settings → General → Background App Refresh</em>. Android: <em>Settings → Apps → [App] → Battery → Restricted</em>.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 13: Reduce Screen Brightness & Timeout',
                content: '<p><strong>Screen brightness</strong> is the #1 battery drain on any phone.</p><p><strong>Quick fix:</strong> Swipe down to Control Center (iPhone) or notification shade (Android) and lower brightness. Enable "Auto-Brightness" so the phone adjusts based on light conditions.</p><p><strong>Screen timeout:</strong> How long the screen stays on after you stop touching it. Set it to 30 seconds or 1 minute maximum.</p><p><strong>iPhone:</strong> <em>Settings → Display & Brightness → Auto-Lock → 30 Seconds</em>.</p><p><strong>Android:</strong> <em>Settings → Display → Screen timeout → 30 seconds</em>.</p><p><strong>Result:</strong> Can add 30–60 minutes of battery life per day with these two changes alone.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 14: Low Power Mode / Battery Saver',
                content: '<p><strong>What it does:</strong> Pauses background app refresh, lowers screen brightness, reduces performance slightly — all to stretch battery life.</p><p><strong>iPhone – Low Power Mode:</strong> <em>Settings → Battery → Low Power Mode</em>. Or ask Siri: "Turn on Low Power Mode." Add it to Control Center for one-tap access.</p><p><strong>Android – Battery Saver:</strong> <em>Settings → Battery → Battery Saver</em>. Or tap the battery icon in quick settings. You can set it to turn on automatically at 15% or 20%.</p><p><strong>Pro tip:</strong> Enable it at the start of a long day (travel, events) proactively — not just when you\'re dying at 5%.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 15: Clear Storage to Speed Up Your Phone',
                content: '<p><strong>Why it matters:</strong> When your phone storage is almost full (less than 10% free), performance slows dramatically. Photos, videos, and app caches are the biggest culprits.</p><p><strong>iPhone:</strong> <em>Settings → General → iPhone Storage</em>. It shows a breakdown by app. Tap any app to offload or delete it. Enable "Offload Unused Apps" to automatically free space.</p><p><strong>Android:</strong> <em>Settings → Storage</em>. Tap "Free Up Space" (on Pixel) or use <em>Files by Google</em> app — it finds duplicates, large files, and junk automatically.</p><p><strong>Quick wins:</strong> Delete screenshots you\'ve already shared. Clear WhatsApp media. Empty the Downloads folder.</p>',
                duration: 5,
                resources: [],
              },
            ],
          },
          {
            title: 'Module 4: Privacy & Security Secrets',
            description: 'Protect your data and control what apps know about you.',
            lessons: [
              {
                title: 'Tip 16: App Permission Audit',
                content: '<p><strong>What to check:</strong> Many apps silently access your microphone, camera, location, and contacts — even when you\'re not using them.</p><p><strong>iPhone:</strong> <em>Settings → Privacy & Security</em>. Tap each category (Microphone, Camera, Location, Contacts) to see which apps have access. Revoke anything that doesn\'t need it.</p><p><strong>Android:</strong> <em>Settings → Privacy → Permission Manager</em>. Same idea — review by permission type.</p><p><strong>Red flags:</strong> A flashlight app that wants your contacts. A game that wants your microphone. A calculator that wants your location. Deny or remove these apps.</p><p><strong>Bonus:</strong> On Android 12+, a green dot appears in the top corner whenever an app uses your camera or microphone — even in the background.</p>',
                duration: 5,
                resources: [],
              },
              {
                title: 'Tip 17: Hide Notifications on Lock Screen',
                content: '<p><strong>Problem:</strong> Personal messages and banking notifications visible to anyone who glances at your phone.</p><p><strong>iPhone:</strong> <em>Settings → Notifications → Show Previews → When Unlocked</em>. Now the notification shows "Message" but not the content until you unlock.</p><p><strong>Android:</strong> <em>Settings → Notifications → Lock screen notifications → Hide silent conversations and notifications</em> or choose "Don\'t show notifications at all."</p><p><strong>Per-app control (iPhone):</strong> <em>Settings → Notifications → [App] → Show Previews → Never</em>. Ideal for banking or health apps.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 18: Two-Factor Authentication Setup',
                content: '<p><strong>What it is:</strong> A second step to log in — even if someone steals your password, they can\'t access your account without the second factor.</p><p><strong>For Google accounts:</strong> Go to myaccount.google.com → Security → 2-Step Verification. Use Google Authenticator app rather than SMS (SMS can be intercepted).</p><p><strong>For Apple ID:</strong> <em>Settings → [Your Name] → Password & Security → Two-Factor Authentication</em>.</p><p><strong>For social media:</strong> Instagram, Facebook, Twitter/X, WhatsApp — all have 2FA in their security settings. Enable it with an authenticator app.</p><p><strong>Best authenticator apps:</strong> Google Authenticator, Microsoft Authenticator, or Authy (which backs up codes to the cloud).</p>',
                duration: 6,
                resources: [],
              },
              {
                title: 'Tip 19: Use a Strong Passcode (Not 4 Digits)',
                content: '<p><strong>4-digit PIN:</strong> 10,000 combinations. Can be brute-forced in minutes with the right tools.</p><p><strong>6-digit PIN:</strong> 1,000,000 combinations. Much better.</p><p><strong>Alphanumeric passcode:</strong> Essentially unbreakable if long enough.</p><p><strong>iPhone:</strong> <em>Settings → Face ID & Passcode → Change Passcode</em>. Tap "Passcode Options" → choose "Custom Alphanumeric Code" for maximum security.</p><p><strong>Android:</strong> <em>Settings → Security → Screen lock</em>. Choose "Password" instead of PIN for alphanumeric.</p><p><strong>Rule of thumb:</strong> Never use your birthday, 123456, or 000000. Use a random 6-digit PIN at minimum. Enable "Erase data after 10 failed attempts" for extra protection.</p>',
                duration: 5,
                resources: [],
              },
              {
                title: 'Tip 20: Check if Your Data Was Leaked',
                content: '<p><strong>The tool:</strong> haveibeenpwned.com — enter your email address. It searches billions of leaked records from major data breaches and tells you if your data was exposed.</p><p><strong>What to do if you\'re breached:</strong></p><ol><li>Change the password immediately on the affected site.</li><li>If you used the same password elsewhere, change it there too (this is why you never reuse passwords).</li><li>Enable 2FA on the account.</li></ol><p><strong>iPhone users:</strong> Go to <em>Settings → Passwords</em>. Apple automatically checks if your saved passwords appeared in known data breaches and shows warnings with a triangle icon.</p><p><strong>Android:</strong> Open Chrome → <em>Settings → Safety Check → Check Passwords</em>.</p>',
                duration: 5,
                resources: [],
              },
            ],
          },
          {
            title: 'Module 5: Productivity & Hidden Features',
            description: 'Power-user features hiding in plain sight on your phone.',
            lessons: [
              {
                title: 'Tip 21: Screen Recording (Built-In)',
                content: '<p><strong>Both phones have a built-in screen recorder — no app needed.</strong></p><p><strong>iPhone:</strong> Add Screen Recording to Control Center: <em>Settings → Control Center → Add Screen Recording</em>. Then swipe down from top-right corner, tap the record button. Tap it again (red status bar) to stop.</p><p><strong>Android:</strong> Swipe down twice to expand Quick Settings. Find "Screen Record" tile (may need to tap the pencil/edit icon to add it). Tap to start — a 3-second countdown begins.</p><p><strong>With audio:</strong> On both platforms you can record microphone audio along with screen. Great for tutorials, reporting bugs, or saving video calls.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 22: Scan Documents with Your Camera',
                content: '<p><strong>No scanner app needed.</strong></p><p><strong>iPhone:</strong> Open the Notes app → tap the camera icon inside a new note → "Scan Documents." It auto-detects the document edges, straightens, and enhances contrast. Save as PDF.</p><p><strong>Android:</strong> Open Google Drive → tap the "+" button → "Scan." Same thing — auto-detects, enhances, saves to Drive as a searchable PDF.</p><p><strong>Pro tip:</strong> Scan in good lighting on a dark background. The contrast helps the auto-detect work better.</p><p><strong>Use cases:</strong> Contracts, receipts, school notes, ID documents, menus, whiteboards.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 23: Back Tap (iPhone) & Quick Launch Gestures (Android)',
                content: '<p><strong>iPhone – Back Tap:</strong> <em>Settings → Accessibility → Touch → Back Tap</em>. Set Double Tap or Triple Tap to trigger an action: take screenshot, open Control Center, run a Shortcut, scroll up/down, etc. It\'s triggered by tapping the back of your phone.</p><p><strong>Android – Quick Launch:</strong> Most Android phones have gesture shortcuts. On Samsung: <em>Settings → Advanced Features → Side key</em> — double-press to open the camera instantly. On Pixel: double-press power to open camera. On OnePlus: triple-press to trigger a shortcut.</p><p><strong>Most useful Back Tap action:</strong> Screenshot. Much faster than pressing Volume Down + Power simultaneously.</p>',
                duration: 5,
                resources: [],
              },
              {
                title: 'Tip 24: Clipboard Manager (Android)',
                content: '<p><strong>Problem:</strong> You copy something, then copy something else — and the first thing is gone forever.</p><p><strong>Android (Gboard):</strong> When you long-press in a text field, you\'ll see "Clipboard" option. Gboard saves your last few copied items. Tap the clipboard icon in the Gboard toolbar to see and re-paste them.</p><p><strong>Enable clipboard history:</strong> In Gboard toolbar, tap the clipboard icon → turn it on → now it saves everything you copy for 1 hour.</p><p><strong>iPhone workaround:</strong> There\'s no native clipboard history on iPhone. Use the Shortcuts app to create a "Save to Clipboard Log" automation, or use an app like Copied.</p>',
                duration: 4,
                resources: [],
              },
              {
                title: 'Tip 25: Reading Mode & Focus/Do Not Disturb',
                content: '<p><strong>Reading Mode (Android – some phones):</strong> On Samsung and Pixel, you can enable a reading mode that converts the screen to grayscale or warm tones to reduce eye strain. Look in <em>Settings → Display → Reading Mode</em> or use the Digital Wellbeing grayscale option.</p><p><strong>Focus Modes (iPhone iOS 15+):</strong> <em>Settings → Focus</em>. Create custom modes like "Work," "Sleep," "Study." Each mode can allow only certain apps and contacts to send notifications. Schedule them to turn on automatically.</p><p><strong>Do Not Disturb (both):</strong> DND silences all notifications. On iPhone, you can allow "Favorites" to still call through. On Android, allow "Starred contacts." Emergency bypass is available on both — if someone calls twice in a row, it gets through DND.</p>',
                duration: 5,
                resources: [],
              },
            ],
          },
          {
            title: 'Module 6: Communication & Social Media Secrets',
            description: 'Hidden tricks for messaging, calls, and social media apps.',
            lessons: [
              {
                title: 'Tip 26: WhatsApp Hidden Features',
                content: '<p><strong>1. Read messages without the blue ticks showing:</strong> On Android, read the message from the notification shade without opening the app. On iPhone, turn on Airplane Mode, read the message, then close WhatsApp before turning off Airplane Mode. (Blue ticks only show when you\'re online.)</p><p><strong>2. Send messages to yourself:</strong> Your own number appears in contacts — message yourself to create a personal note/clipboard.</p><p><strong>3. Bold, italic, strikethrough:</strong> *text* = <strong>bold</strong>, _text_ = <em>italic</em>, ~text~ = ~~strikethrough~~, ```text``` = monospace.</p><p><strong>4. Pin important chats:</strong> Long-press any chat → pin. Stays at top always.</p><p><strong>5. Star messages:</strong> Long-press any message → star. Find all starred messages in <em>Settings → Starred Messages</em>.</p>',
                duration: 6,
                resources: [],
              },
              {
                title: 'Tip 27: Instagram Hidden Features',
                content: '<p><strong>1. Mute without unfollowing:</strong> Hold down on anyone\'s story or go to their profile → Following → Mute. They won\'t know. Great for noisy accounts you want to stay connected with but not see daily.</p><p><strong>2. Close Friends list:</strong> Create a "Close Friends" list — stories you post to this list are shown with a green ring. Only those people see it. Perfect for sharing personal stuff without showing everyone.</p><p><strong>3. Story hide:</strong> Go to <em>Settings → Privacy → Story → Hide Story From</em>. Select specific people who won\'t see your stories — even if they follow you.</p><p><strong>4. Restrict accounts:</strong> <em>Settings → Privacy → Restricted Accounts</em>. Restricted users can\'t see when you\'re active or if you\'ve read their messages. Their comments on your posts are hidden from others until you approve them.</p>',
                duration: 6,
                resources: [],
              },
              {
                title: 'Tip 28: Google Maps Offline & Hidden Features',
                content: '<p><strong>1. Download maps offline:</strong> Search any city → tap the name at the bottom → three dots → "Download offline map." Now you can navigate without internet — great for travel or poor signal areas.</p><p><strong>2. Share real-time location:</strong> In Google Maps, tap your profile icon → "Share location" → choose duration and contact. They see you moving in real-time.</p><p><strong>3. Measure distance:</strong> Long-press any point → tap "Measure distance" → add more points to measure walking distance or land area.</p><p><strong>4. Explore nearby before you go:</strong> Search a restaurant, hotel, or attraction → scroll to photos and reviews. Tap "See inside" for a Street View tour of restaurants and stores.</p><p><strong>5. Time your commute:</strong> Tap "Leave at" or "Arrive by" in directions to see how traffic affects your route at different times.</p>',
                duration: 5,
                resources: [],
              },
              {
                title: 'Tip 29: YouTube Hidden Features',
                content: '<p><strong>1. Speed up any video:</strong> Tap the three dots → Playback speed → choose 1.25x, 1.5x, or 2x. Watch tutorials and lectures in half the time. On mobile, hold and press the screen to temporarily speed up.</p><p><strong>2. Picture-in-Picture (PiP):</strong> While watching a video, press the home button. On Android 8+ and iPhone (with Premium or some free videos), the video floats in a small window. You can keep using other apps.</p><p><strong>3. Loop a video:</strong> Long-press on any video → tap "Loop video." It plays forever. Great for music or learning a specific move.</p><p><strong>4. Dark mode:</strong> Profile icon → Settings → General → Dark theme. Easier on eyes at night.</p><p><strong>5. Auto-generate captions:</strong> Tap the CC button during any video. YouTube auto-generates subtitles in many languages — even translates them.</p>',
                duration: 5,
                resources: [],
              },
              {
                title: 'Tip 30: Google Lens — The Secret Superpower',
                content: '<p><strong>What it is:</strong> Google Lens uses your camera to identify and interact with the real world.</p><p><strong>How to open:</strong> Android — tap the Lens icon in Google Search, Google Photos, or the Google app. iPhone — download Google app → tap Lens icon in search bar.</p><p><strong>What it can do:</strong></p><ul><li><strong>Translate text in real-time:</strong> Point camera at a sign in another language — it overlays the translation.</li><li><strong>Copy text from paper:</strong> Point at any printed text → tap "Copy text" → paste it anywhere. Works for handwritten notes too.</li><li><strong>Identify plants & animals:</strong> Point at a flower or bug — Lens identifies it.</li><li><strong>Scan QR codes and barcodes:</strong> No extra app needed.</li><li><strong>Find similar products to buy:</strong> Point at clothing, furniture, or decor — Lens finds where to buy it online.</li><li><strong>Solve math problems:</strong> Point at a math equation — Lens solves it and shows steps.</li></ul>',
                duration: 6,
                resources: [],
              },
            ],
          },
        ],
      }).save();
      console.log('✅ Smartphone Secrets course seeded successfully!');
    } else {
      console.log('⚠️  Smartphone Secrets course already exists. Skipping.');
    }

    // 5. Seed "Cyber Literacy" course
    console.log('🔐 Seeding Cyber Literacy course...');
    console.log('🗑️ Deleting existing Cyber Literacy course...');
    await Course.deleteOne({ title: 'Cyber Literacy — Protect Yourself & Recover from Hacks' });
    const cyberExists = await Course.findOne({ title: 'Cyber Literacy — Protect Yourself & Recover from Hacks' });
    if (!cyberExists) {
      await new Course({
        title: 'Cyber Literacy — Protect Yourself & Recover from Hacks',
        description: '<p>Learn how to avoid scams, protect your accounts, and recover if you get hacked. Simple lessons for Instagram, Facebook, WhatsApp, Email, Snapchat, and Telegram. No computer skills needed — just your phone. Includes real scam examples, screenshots, and step-by-step recovery videos.</p>',
        thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/cyber_literacy.webp',
        price: 0,
        discountPrice: 0,
        level: 'Beginner',
        category: 'Security',
        status: 'published',
        studentsEnrolled: [],
        instructor: admin._id,
        modules: [
          // ─── MODULE 1 ────────────────────────────────────────────────────────
          {
            title: 'Module 1: How Scammers Work — What to Avoid',
            description: 'Learn the most common tricks scammers use to steal your accounts and money.',
            lessons: [
              {
                title: 'What Is Phishing? (Fake Messages That Steal Your Password)',
                content: '<p><strong>Phishing (say \'fishing\')</strong> is when a scammer sends you a fake message that looks real. They want you to click a link and enter your password. Once you do, they steal your account.</p><p>📸 <strong>SCREENSHOT EXAMPLE 1:</strong> A fake email that looks like it\'s from \'Instagram Support\' but the email address is \'instagram-support@fake123.com\' (not real).</p><p>📸 <strong>SCREENSHOT EXAMPLE 2:</strong> A fake text message saying \'Your account will be deleted in 24 hours. Click here to verify.\'</p><p>🎥 <strong>Watch this video:</strong> \'What is phishing? Explained in 2 minutes\' (2 min)</p><p><strong>RED FLAGS to remember:</strong></p><ul><li>Urgent language (\'ACT NOW\', \'24 HOURS\', \'FINAL WARNING\')</li><li>Links that don\'t match the real website</li><li>Bad grammar or spelling mistakes</li><li>Asking for your password (real companies NEVER ask for your password)</li></ul><p><strong>Golden rule:</strong> Never click links in messages. Go to the app directly.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Yz4G8Uf0K1g',
                duration: 4,
                type: 'article',
                resources: [{ title: 'Phishing Red Flags Checklist (PDF)', url: 'https://example.com/phishing-checklist.pdf', type: 'pdf' }],
              },
              {
                title: 'The \'Friend in Need\' Scam (WhatsApp & Facebook)',
                content: '<p><strong>How this scam works:</strong> A scammer pretends to be your friend or family member. They say \'I lost my phone, this is my new number. Can you send me money? I\'ll pay you back tomorrow.\'</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> A WhatsApp message from an unknown number saying \'Mom it\'s me, I broke my phone. This is my new number. Can you send $200 for a new one? I\'ll pay you back.\'</p><p>🎥 <strong>Watch this video:</strong> \'Friend in need scam explained\' (2 min)</p><p><strong>How to check if it\'s real:</strong></p><ul><li>Call your friend on their OLD number (the one you know)</li><li>Ask a question only they would know (\'What did we eat last week?\')</li><li>Never send money to someone who just messaged you from a new number</li></ul><p><strong>REMEMBER:</strong> Scammers hack WhatsApp and Facebook accounts, then message everyone on the contact list asking for money.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=K1ZQ5qQY2lE',
                duration: 3,
                type: 'article',
                resources: [],
              },
              {
                title: 'The \'Verify Your Account\' Scam (Instagram & Facebook)',
                content: '<p><strong>How this scam works:</strong> You get a message saying \'Your account has been reported. Click here to verify or your account will be deleted.\' The link takes you to a fake login page. When you enter your password, the scammer steals it.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> A direct message on Instagram from an account named \'Instagram Support\' saying \'Your account violated our rules. Verify now or your account will be permanently deleted.\'</p><p>🎥 <strong>Watch this video:</strong> \'Instagram verification scam\' (2 min)</p><p><strong>What Instagram and Facebook will NEVER do:</strong></p><ul><li>Message you asking for your password</li><li>Ask you to click a link to verify your account</li><li>Threaten to delete your account in 24 hours</li></ul><p><strong>What to do:</strong> Ignore, block, and report the message as spam. Then go to your Security Checkup in Settings.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=3NnYtLqB2jM',
                duration: 2,
                type: 'article',
                resources: [],
              },
              {
                title: 'The \'Job Offer\' Scam (WhatsApp & Telegram)',
                content: '<p><strong>How this scam works:</strong> You get a message saying \'Easy work from home! Like videos on YouTube and earn $50 per day.\' They ask you to message someone on Telegram. Then they ask you to pay a \'registration fee\' or \'training fee\' — but there is no real job.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> A WhatsApp message from an unknown number: \'Hello, we saw your number. We have a remote job. Like 10 YouTube videos = $30 daily. Contact us on Telegram @fake_job_bot.\'</p><p>🎥 <strong>Watch this video:</strong> \'Job offer scam on WhatsApp\' (3 min)</p><p><strong>RED FLAGS:</strong></p><ul><li>You never applied for this job</li><li>They ask you to pay money first (real jobs pay YOU, you don\'t pay them)</li><li>They move the conversation to Telegram</li><li>The pay is too good to be true</li></ul><p><strong>What to do:</strong> Block and report the number. Never pay anyone for a job.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=5nMqYkRfN_c',
                duration: 3,
                type: 'article',
                resources: [],
              },
              {
                title: 'The \'Free Gift\' or \'You Won\' Scam (All Platforms)',
                content: '<p><strong>How this scam works:</strong> You get a message saying \'Congratulations! You won a free iPhone. Click here to claim.\' The link takes you to a website that asks for your address, phone number, and credit card details for \'shipping\'. They steal your card info.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> A Facebook message: \'You are our lucky winner! Get a FREE iPhone 15 Pro. Click here to claim within 2 hours.\'</p><p>🎥 <strong>Watch this video:</strong> \'Free gift scam explained\' (2 min)</p><p><strong>REMEMBER:</strong></p><ul><li>If you didn\'t enter a contest, you didn\'t win anything</li><li>Real giveaways don\'t ask for your credit card</li><li>No one gives away free iPhones to random people</li></ul><p><strong>What to do:</strong> Delete the message immediately. Do not click any link.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=7LkZqKpX2eE',
                duration: 2,
                type: 'article',
                resources: [],
              },
              {
                title: 'Module 1 Quiz',
                content: '<p>Test your knowledge of common scams.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is phishing?', type: 'multiple_choice', options: ['A type of virus', 'A fake message to steal your password', 'A security app', 'A password manager'], correctOptionIndex: 1, explanation: 'Phishing is when scammers send fake messages to trick you into giving them your password.' },
                  { questionText: 'Does a real company ever ask for your password in a message?', type: 'multiple_choice', options: ['Yes', 'No — never', 'Only banks', 'Only Facebook'], correctOptionIndex: 1, explanation: 'Real companies will NEVER ask for your password. If someone asks, it\'s a scam.' },
                  { questionText: 'Your \'friend\' messages from a new number asking for money. What should you do?', type: 'multiple_choice', options: ['Send money', 'Call their old number to verify', 'Ignore', 'Send half'], correctOptionIndex: 1, explanation: 'Always verify by calling the person\'s real phone number before sending any money.' },
                  { questionText: 'Does Instagram ever message you asking for your password?', type: 'multiple_choice', options: ['Yes, sometimes', 'No — never', 'Only for business accounts', 'Only if you did something wrong'], correctOptionIndex: 1, explanation: 'Instagram will NEVER ask for your password in a message. Anyone who does is a scammer.' },
                  { questionText: 'A \'job offer\' asks you to pay $50 for training. Is this real?', type: 'multiple_choice', options: ['Yes, many jobs do this', 'No — real jobs pay you, you don\'t pay them', 'Only for online jobs', 'Only for remote jobs'], correctOptionIndex: 1, explanation: 'Real jobs pay you for your work. If someone asks for money first, it\'s a scam.' },
                  { questionText: 'You get a message \'You won a free iPhone.\' What do you do?', type: 'multiple_choice', options: ['Click the link', 'Delete it — it\'s a scam', 'Send your address', 'Share with friends'], correctOptionIndex: 1, explanation: 'If you didn\'t enter a contest, you didn\'t win. Free iPhone messages are always scams.' },
                ],
              },
            ],
          },
          // ─── MODULE 2 ────────────────────────────────────────────────────────
          {
            title: 'Module 2: How to Protect Your Accounts (Before Getting Hacked)',
            description: 'Simple steps to make your accounts very hard to hack.',
            lessons: [
              {
                title: '2-Step Verification (2FA) — The Most Important Protection',
                content: '<p><strong>What is 2-Step Verification (also called 2FA or Two-Factor Authentication)?</strong></p><p>Normally, you only need your password to log in. With 2-Step Verification, you need your password AND a code from your phone. Even if a scammer gets your password, they cannot log in without the code from your phone.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Instagram Settings showing \'Two-Factor Authentication\' turned ON.</p><p>🎥 <strong>Watch this video:</strong> \'What is 2FA and how to turn it on\' (3 min)</p><p><strong>How to turn it on:</strong></p><p><strong>Instagram:</strong> Settings → Account Center → Password and Security → Two-Factor Authentication → Turn ON.</p><p><strong>Facebook:</strong> Settings &amp; Privacy → Settings → Security and Login → Two-Factor Authentication → Get Started.</p><p><strong>WhatsApp:</strong> Settings → Account → Two-Step Verification → Enable → Create 6-digit PIN.</p><p><strong>Gmail:</strong> Google Account → Security → 2-Step Verification → Get Started.</p><p><strong>REMEMBER:</strong> Save your backup codes somewhere safe (write them down on paper).</p><p><strong>Practice Assignment:</strong> Turn on 2-Step Verification for ONE account. Take a screenshot showing it\'s enabled. Submit.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=hT8jFp_5LkM',
                duration: 5,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Turn on 2-Step Verification for one account. Screenshot showing it\'s enabled.',
                assignmentDeliverables: ['Screenshot of 2FA settings'],
                resources: [],
                quizQuestions: [
                  { questionText: 'What does 2-Step Verification do?', type: 'multiple_choice', options: ['Sends you spam', 'Requires a code from your phone plus your password', 'Deletes your account', 'Changes your password'], correctOptionIndex: 1, explanation: '2FA adds a second layer of security. Even if someone has your password, they cannot log in without the code from your phone.' },
                ],
              },
              {
                title: 'Strong Passwords — And How to Remember Them',
                content: '<p><strong>What NOT to use as a password:</strong></p><ul><li>❌ \'123456\' or \'password\'</li><li>❌ Your name, birthday, or \'iloveyou\'</li><li>❌ The same password for every account</li></ul><p><strong>How to make a strong password you CAN remember:</strong></p><p>Use a sentence, then take the first letter of each word.</p><p>Example: \'I love eating pizza on Friday nights!\' → Password: <strong>Ilep0Fn!</strong></p><p><strong>Better yet — use a Password Manager:</strong> iPhone: Settings → Passwords. Android: Google Password Manager in Settings.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> iPhone Passwords screen showing saved accounts.</p><p>🎥 <strong>Watch this video:</strong> \'How to create strong passwords you can remember\' (3 min)</p><p><strong>Practice Assignment:</strong> Change ONE weak password to a strong password. Screenshot the password change confirmation. Submit.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=K_MF4QhSqdE',
                duration: 4,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Change one weak password to a strong password. Screenshot confirmation.',
                assignmentDeliverables: ['Password change screenshot'],
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Check If Your Password Has Been Stolen',
                content: '<p><strong>Website to check (free and safe):</strong> haveibeenpwned.com</p><p>This website tells you if your email or password has appeared in a data breach. It does NOT store your password — it just checks.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> haveibeenpwned.com showing \'Good news — no pwnage found!\'</p><p>🎥 <strong>Watch this video:</strong> \'How to check if your password was stolen\' (2 min)</p><p><strong>How to use:</strong></p><ol><li>Open your phone browser</li><li>Go to haveibeenpwned.com</li><li>Type your email address</li><li>Tap \'pwned?\'</li><li>If it says \'Oh no — pwned!\' change your password immediately</li></ol><p><strong>Practice Assignment:</strong> Check your email on haveibeenpwned.com. Screenshot the result. If your email was in a breach, change that password. Submit.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=hhq1i6u_hB8',
                duration: 3,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Check your email on haveibeenpwned.com. Screenshot result. If breached, change password.',
                assignmentDeliverables: ['haveibeenpwned screenshot'],
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Login Alerts — Get Notified If Someone Logs Into Your Account',
                content: '<p><strong>What it does:</strong> You get a notification or email whenever someone logs into your account from a new device or location.</p><p><strong>How to turn on:</strong></p><p><strong>Instagram:</strong> Settings → Account Center → Password and Security → Login Alerts → ON</p><p><strong>Facebook:</strong> Settings &amp; Privacy → Settings → Security and Login → Login Alerts → Get alerts on your phone or email</p><p><strong>Gmail:</strong> Google Account → Security → Manage devices → Review devices</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Instagram Login Alerts settings showing \'ON\' for push notifications and email.</p><p>🎥 <strong>Watch this video:</strong> \'How to turn on login alerts\' (2 min)</p><p><strong>What to do if you get an alert for a login that wasn\'t you:</strong> Tap \'This wasn\'t me\' and change your password immediately.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=3nNtLqB2jM',
                duration: 2,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Module 2 Quiz',
                content: '<p>Test your knowledge of protecting your accounts.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the most important security feature you can turn on?', type: 'multiple_choice', options: ['Dark mode', '2-Step Verification (2FA)', 'Auto-correct', 'Push notifications'], correctOptionIndex: 1, explanation: '2-Step Verification (2FA) makes it much harder for anyone to access your account, even if they know your password.' },
                  { questionText: 'Which is a strong password?', type: 'multiple_choice', options: ['123456', 'password', 'Mypizza!2024', 'yourname'], correctOptionIndex: 2, explanation: 'A strong password has uppercase, lowercase, numbers, and symbols.' },
                  { questionText: 'What does haveibeenpwned.com do?', type: 'multiple_choice', options: ['Sells your email', 'Checks if your email was in a data breach', 'Creates passwords', 'Hacks accounts'], correctOptionIndex: 1, explanation: 'haveibeenpwned.com checks if your email address has appeared in known data breaches.' },
                  { questionText: 'What do Login Alerts do?', type: 'multiple_choice', options: ['Change your password', 'Notify you of new logins', 'Block all logins', 'Delete your account'], correctOptionIndex: 1, explanation: 'Login alerts send you a notification when anyone logs into your account from a new device.' },
                  { questionText: 'If you use 2FA, what do you need to log in?', type: 'multiple_choice', options: ['Only password', 'Only phone', 'Password AND code from phone', 'Only email'], correctOptionIndex: 2, explanation: '2FA requires both your password AND a one-time code from your phone.' },
                ],
              },
            ],
          },
          // ─── MODULE 3 ────────────────────────────────────────────────────────
          {
            title: 'Module 3: How to Recover a Hacked Instagram Account',
            description: 'Step-by-step recovery if someone takes over your Instagram.',
            lessons: [
              {
                title: 'Sign 1: Your Instagram Has Been Hacked',
                content: '<p><strong>How to know if you\'ve been hacked:</strong></p><ul><li>You can\'t log in (password doesn\'t work)</li><li>Your email or phone number was changed</li><li>You see posts or messages you didn\'t send</li><li>Your profile picture or bio changed</li><li>You get an email saying your email was changed (but you didn\'t change it)</li></ul><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Instagram login screen showing \'Password incorrect\' message when you know your password was correct.</p><p>🎥 <strong>Watch this video:</strong> \'Signs your Instagram was hacked\' (2 min)</p><p><strong>ACT FAST:</strong> The longer you wait, the harder it is to recover.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=4nQnQnQnQnQ',
                duration: 2,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 1: Try \'Forgot Password\' on Instagram',
                content: '<p><strong>Step-by-step:</strong></p><ol><li>On the login screen, tap \'Forgot password\' or \'Get help logging in\'</li><li>Enter your username, email, or phone number</li><li>Tap \'Send login link\' — Instagram will send a recovery link to your email or phone</li><li>Check your email (also check Spam folder) or text messages</li><li>Tap the link and create a new strong password</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Instagram \'Forgot password\' screen with email field filled in.</p><p>🎥 <strong>Watch this video:</strong> \'How to recover Instagram using Forgot Password\' (3 min)</p><p><strong>If this works:</strong> Immediately turn on 2-Step Verification and log out of all devices (Settings → Security → Log out of all devices).</p><p><strong>If this does NOT work:</strong> Move to the next lesson (hacker changed your email).</p>',
                videoUrl: 'https://www.youtube.com/watch?v=JxkPn9JY5tE',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 2: Instagram \'Support\' Recovery (Hacker Changed Your Email)',
                content: '<p><strong>If \'Forgot password\' doesn\'t work because the hacker changed your email and phone number, use this method:</strong></p><ol><li>On login screen, tap \'Forgot password\'</li><li>Enter your username</li><li>When it asks for email or phone — tap \'Can\'t access this email or phone number?\' or \'Try another way\'</li><li>Follow prompts to verify your identity (may ask for a selfie video — this is legitimate!)</li><li>Instagram may ask: \'Do you have access to any of these?\' — if you see your old email, select it</li><li>Wait for Instagram to review your request (may take a few hours to a few days)</li></ol><p>🎥 <strong>Watch this video:</strong> \'Recover hacked Instagram when email changed\' (5 min)</p><p><strong>Important:</strong> Instagram\'s identity verification asks for a video selfie where you turn your head. This is NORMAL and SAFE.</p><p><strong>Practice Assignment:</strong> Go to Instagram\'s login screen and tap \'Forgot password\' just to see what options are available. Screenshot the \'Try another way\' screen. Submit.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=7LkZqKpX2eE',
                duration: 5,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Go to Instagram \'Forgot password\' and screenshot the \'Try another way\' options.',
                assignmentDeliverables: ['Instagram recovery options screenshot'],
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 3: After Recovery — Secure Your Instagram Immediately',
                content: '<p><strong>Once you get back into your Instagram account, do these steps right away:</strong></p><ol><li><strong>Change your password</strong> to a strong one</li><li><strong>Turn on 2-Step Verification</strong> (Settings → Account Center → Password and Security → Two-Factor Authentication)</li><li><strong>Check your email and phone number</strong> in Settings → Personal details</li><li><strong>Log out of all devices</strong> — Settings → Security → Where you\'re logged in → Log out of all devices</li><li><strong>Remove any unknown accounts linked</strong> — Settings → Account Center → Accounts</li><li><strong>Check for posts, messages, or stories</strong> the hacker sent — delete anything suspicious</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Instagram \'Where you\'re logged in\' screen showing the option to \'Log out of all devices\'.</p><p>🎥 <strong>Watch this video:</strong> \'Securing your Instagram after being hacked\' (4 min)</p><p><strong>REMEMBER:</strong> The hacker may still have access if you don\'t log out of all devices. Don\'t skip this step!</p>',
                videoUrl: 'https://www.youtube.com/watch?v=8nQnQnQnQn8',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'What to Do If Instagram Support Doesn\'t Help',
                content: '<p><strong>If you tried everything and still can\'t recover your account:</strong></p><ol><li><strong>Use the Instagram \'Hacked\' page</strong> — Go to help.instagram.com and search \'hacked account\'</li><li><strong>Ask friends to help</strong> — Have friends report the hacked account as \'Impersonating me\' or \'Fake account\'</li><li><strong>Create a new account</strong> — If recovery fails after weeks, create a new account with a new email and turn on 2FA immediately</li><li><strong>Warn your friends</strong> — Tell them your old account is hacked so they don\'t trust messages from it</li></ol><p>🎥 <strong>Watch this video:</strong> \'Last resort options for hacked Instagram\' (3 min)</p><p><strong>Important:</strong> Be careful of people who message you saying \'I can hack your account back for $50.\' These are scammers too. Only trust Instagram\'s official recovery.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=9oQoQoQoQ9o',
                duration: 3,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Module 3 Quiz',
                content: '<p>Test your knowledge of recovering a hacked Instagram account.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the first thing to try if you can\'t log into Instagram?', type: 'multiple_choice', options: ['Create new account', 'Tap \'Forgot password\'', 'Call Instagram', 'Delete the app'], correctOptionIndex: 1, explanation: 'Always try \'Forgot password\' first. Instagram will send a recovery link to your email or phone.' },
                  { questionText: 'If the hacker changed your email, what option do you use?', type: 'multiple_choice', options: ['Give up', 'Try another way / verify identity', 'Message the hacker', 'Create new email'], correctOptionIndex: 1, explanation: 'Instagram has a \'Try another way\' option for when the hacker changed your contact info.' },
                  { questionText: 'After recovering your account, what must you do?', type: 'multiple_choice', options: ['Only change password', 'Change password AND log out of all devices', 'Delete account', 'Do nothing'], correctOptionIndex: 1, explanation: 'The hacker may still be logged in on their device. Always log out of all devices.' },
                  { questionText: 'Should you pay someone who offers to recover your hacked account?', type: 'multiple_choice', options: ['Yes', 'No — it\'s another scam', 'Only if they seem legit', 'Only if they charge under $20'], correctOptionIndex: 1, explanation: 'People offering to recover hacked accounts for money are almost always scammers.' },
                  { questionText: 'What does Instagram ask for during identity verification?', type: 'multiple_choice', options: ['Your credit card', 'A video selfie', 'Your friends\' passwords', 'Your location'], correctOptionIndex: 1, explanation: 'Instagram\'s identity verification asks for a video selfie where you turn your head. This is normal and safe.' },
                ],
              },
            ],
          },
          // ─── MODULE 4 ────────────────────────────────────────────────────────
          {
            title: 'Module 4: How to Recover a Hacked Facebook Account',
            description: 'Step-by-step recovery if someone takes over your Facebook.',
            lessons: [
              {
                title: 'Signs Your Facebook Was Hacked',
                content: '<p><strong>How to know if you\'ve been hacked:</strong></p><ul><li>You can\'t log in (password doesn\'t work)</li><li>Your email or phone number was removed from the account</li><li>You see posts, messages, or friend requests you didn\'t send</li><li>Friends tell you they received spam from you</li><li>You get an email saying your email was changed (but you didn\'t change it)</li></ul><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Facebook login screen showing \'Incorrect password\' message.</p><p>🎥 <strong>Watch this video:</strong> \'Signs your Facebook was hacked\' (2 min)</p><p><strong>ACT FAST:</strong> Hacked Facebook accounts are often used to scam your friends.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=5pPpPpPp5pP',
                duration: 2,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 1: Facebook \'Forgot Password\' Recovery',
                content: '<p><strong>Step-by-step:</strong></p><ol><li>On the login screen, tap \'Forgot password?\' or \'Find your account\'</li><li>Enter your email, phone number, username, or full name</li><li>Facebook will show you accounts matching your info — select yours</li><li>Choose how to get a recovery code (email or text message)</li><li>Enter the code and create a new password</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Facebook \'Find Your Account\' screen with email field filled in.</p><p>🎥 <strong>Watch this video:</strong> \'How to recover Facebook using Forgot Password\' (3 min)</p><p><strong>If this works:</strong> Immediately turn on 2-Step Verification and log out of all devices.</p><p><strong>If this does NOT work:</strong> Move to the next lesson.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=6qQqQqQq6qQ',
                duration: 3,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 2: Facebook \'Trusted Contacts\' Recovery',
                content: '<p><strong>What are Trusted Contacts?</strong> Friends you chose ahead of time who can help you recover your account.</p><p><strong>If you set up Trusted Contacts before being hacked:</strong></p><ol><li>On login screen, tap \'Forgot password?\'</li><li>After entering your email/phone, tap \'Cannot access these?\'</li><li>Select \'Reveal my trusted contacts\'</li><li>Facebook shows you the names of your trusted contacts</li><li>Contact them and ask for the recovery codes Facebook sent them</li><li>Enter the codes and reset your password</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Facebook Trusted Contacts recovery screen showing friend names.</p><p>🎥 <strong>Watch this video:</strong> \'How to use Facebook Trusted Contacts\' (3 min)</p><p><strong>If you didn\'t set up Trusted Contacts:</strong> Move to the next lesson.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=7rRrRrRr7rR',
                duration: 3,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 3: Facebook \'Identity Verification\' (Last Resort)',
                content: '<p><strong>If the hacker changed your email, phone, and you have no Trusted Contacts:</strong></p><ol><li>Go to facebook.com/login/identify (open in your browser)</li><li>Enter the email or phone number you used when you created the account</li><li>Follow prompts to upload your ID (driver\'s license, passport, or national ID)</li><li>Facebook will review your request (may take a few days to 2 weeks)</li><li>Check your email for updates from Facebook</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Facebook identity verification screen asking for ID upload.</p><p>🎥 <strong>Watch this video:</strong> \'Facebook identity verification for hacked accounts\' (4 min)</p><p><strong>What IDs are accepted:</strong> Driver\'s license, Passport, National ID card, Birth certificate, Voter ID card.</p><p><strong>Important:</strong> Cover any numbers you don\'t want to share before uploading.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=8sSsSsSs8sS',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Step 4: After Recovery — Secure Your Facebook',
                content: '<p><strong>Once you get back into your Facebook account, do these steps right away:</strong></p><ol><li><strong>Change your password</strong> to a strong one</li><li><strong>Turn on 2-Step Verification</strong> — Settings &amp; Privacy → Settings → Security and Login → Two-Factor Authentication</li><li><strong>Check your email and phone number</strong> — remove any that aren\'t yours</li><li><strong>Log out of all devices</strong> — Security and Login → Where you\'re logged in → Log out of all sessions</li><li><strong>Remove unknown apps</strong> — Settings → Apps and Websites → Remove anything suspicious</li><li><strong>Review recent activity</strong> — Check posts, messages, and friend requests made while hacked</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Facebook \'Where you\'re logged in\' screen with \'Log out of all sessions\' button.</p><p>🎥 <strong>Watch this video:</strong> \'Securing your Facebook after being hacked\' (4 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=9tTtTtTt9tT',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Module 4 Quiz',
                content: '<p>Test your knowledge of recovering a hacked Facebook account.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the first thing to try if you can\'t log into Facebook?', type: 'multiple_choice', options: ['Create new account', 'Tap \'Forgot password?\'', 'Call Facebook', 'Delete the app'], correctOptionIndex: 1, explanation: 'Always start with \'Forgot password?\' — Facebook will send a recovery code to your email or phone.' },
                  { questionText: 'What are Facebook Trusted Contacts?', type: 'multiple_choice', options: ['Friends you chat with', 'Friends who can help recover your account', 'Facebook employees', 'Your family only'], correctOptionIndex: 1, explanation: 'Trusted Contacts are friends you select ahead of time who can provide recovery codes.' },
                  { questionText: 'If nothing else works, what can you send Facebook?', type: 'multiple_choice', options: ['Your photo', 'Your ID (driver\'s license/passport)', 'Your friend\'s name', 'Your phone number'], correctOptionIndex: 1, explanation: 'Facebook accepts government-issued ID to verify your identity.' },
                  { questionText: 'After recovering Facebook, what must you do?', type: 'multiple_choice', options: ['Only change password', 'Change password AND log out of all devices', 'Delete account', 'Do nothing'], correctOptionIndex: 1, explanation: 'The hacker may still be logged in. Always change password AND log out of all devices.' },
                  { questionText: 'What is the most important security feature to turn on?', type: 'multiple_choice', options: ['Dark mode', '2-Step Verification', 'Quiet mode', 'Auto-play videos'], correctOptionIndex: 1, explanation: '2-Step Verification (2FA) makes it much harder for hackers to access your account.' },
                ],
              },
            ],
          },
          // ─── MODULE 5 ────────────────────────────────────────────────────────
          {
            title: 'Module 5: How to Recover Hacked WhatsApp, Snapchat, Email',
            description: 'Recovery steps for WhatsApp, Snapchat, Gmail, and Outlook.',
            lessons: [
              {
                title: 'How to Know If Your WhatsApp Was Hacked',
                content: '<p><strong>Signs your WhatsApp was hacked:</strong></p><ul><li>You get logged out and can\'t log back in</li><li>Your contacts tell you they received strange messages from you</li><li>You see WhatsApp Web logins you don\'t recognize</li><li>Your 2-Step Verification code stops working</li><li>You receive a WhatsApp registration code you didn\'t request</li></ul><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> WhatsApp showing \'Your phone number is no longer registered on this device\' message.</p><p>🎥 <strong>Watch this video:</strong> \'Signs your WhatsApp was hacked\' (2 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=0uUuUuUu0uU',
                duration: 2,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'How to Recover Hacked WhatsApp',
                content: '<p><strong>Step-by-step recovery:</strong></p><ol><li><strong>Delete and reinstall WhatsApp</strong> from your phone\'s app store</li><li><strong>Open WhatsApp and verify your phone number</strong> (the same number you always use)</li><li><strong>Enter the 6-digit code</strong> sent to your phone via SMS</li><li><strong>If asked for 2-Step Verification PIN</strong> and you don\'t know it — tap \'Forgot PIN?\' → You\'ll need the email you used when setting up 2FA</li><li><strong>Check your email</strong> for a reset link</li><li><strong>Once logged in, go to Settings → Linked Devices</strong> — Log out of all devices you don\'t recognize</li><li><strong>Turn on 2-Step Verification again</strong></li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> WhatsApp \'Linked Devices\' screen showing unknown devices — tap to log them out.</p><p>🎥 <strong>Watch this video:</strong> \'How to recover hacked WhatsApp\' (4 min)</p><p><strong>⚠️ IMPORTANT:</strong> If the hacker changed your 2FA PIN and you didn\'t save a recovery email, you may lose your account forever. ALWAYS save your recovery email when setting up 2FA.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=1vVvVvVv1vV',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'WhatsApp Scams to Avoid',
                content: '<p><strong>Common WhatsApp scams:</strong></p><p><strong>1. \'I accidentally reported you\' scam</strong><br>A message saying \'Sorry, I accidentally reported your account. Click this link to cancel the report or your account will be banned.\' The link steals your WhatsApp login.</p><p><strong>2. \'Free internet/data\' scam</strong><br>A message with a link saying \'Click here for free 10GB data.\' The link either steals your info or makes you pay for fake data.</p><p><strong>3. \'Your WhatsApp is expiring\' scam</strong><br>A message saying \'WhatsApp will start charging. Pay $1 to keep your account.\' WhatsApp is FREE and will never ask you to pay.</p><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> WhatsApp scam message saying \'I accidentally reported you. Click here to fix it.\'</p><p>🎥 <strong>Watch this video:</strong> \'WhatsApp scams to avoid\' (3 min)</p><p><strong>REMEMBER:</strong> Never click links in WhatsApp messages from unknown numbers. Never share your 6-digit verification code with anyone.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=2wWwWwWw2wW',
                duration: 3,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'How to Recover Hacked Snapchat',
                content: '<p><strong>Signs your Snapchat was hacked:</strong> Can\'t log in, Snap score changed, sent snaps you didn\'t send, new friends added.</p><p><strong>Step-by-step recovery:</strong></p><ol><li>Open Snapchat → Tap \'Forgot your password?\' on login screen</li><li>Choose \'Via Email\' or \'Via Phone\' to get recovery code</li><li>Enter the code and create a new password</li><li>If that doesn\'t work, go to accounts.snapchat.com → Tap \'Unlock My Account\'</li><li>If still locked, contact Snapchat Support: help.snapchat.com → \'Contact Us\' → \'My account was hacked\'</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Snapchat \'Forgot password\' screen with recovery options.</p><p>🎥 <strong>Watch this video:</strong> \'How to recover hacked Snapchat\' (3 min)</p><p><strong>After recovery:</strong> Turn on \'Login Verification\' (2FA) in Snapchat Settings → Two-Factor Authentication.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=3xXxXxXx3xX',
                duration: 3,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'How to Recover Hacked Gmail (Google Account)',
                content: '<p><strong>Your Gmail is your most important account</strong> — because \'Forgot password\' for Instagram, Facebook, and other apps sends recovery links to your email. If a hacker has your Gmail, they can take over EVERYTHING.</p><p><strong>Step-by-step recovery:</strong></p><ol><li>Go to g.co/recover (open in browser)</li><li>Enter your email address (the one that was hacked)</li><li>If you remember your last password, enter it. If not, tap \'Try another way\'</li><li>Google may ask verification questions: last password you remember, recovery phone/email, security questions</li><li>If you have a recovery phone number, choose \'Send a code to [your number]\'</li><li>Enter the code and create a new password</li></ol><p>📸 <strong>SCREENSHOT EXAMPLE:</strong> Google Account Recovery page at g.co/recover showing email field.</p><p>🎥 <strong>Watch this video:</strong> \'How to recover hacked Gmail\' (4 min)</p><p><strong>Important — Set up a recovery email and phone NOW (before you get hacked):</strong></p><ol><li>Google Account → Security → Recovery phone and email</li><li>Add your phone number AND a backup email (like a family member\'s email)</li></ol><p><strong>After recovery:</strong> Enable 2-Step Verification on your Google Account immediately.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=4yYyYyYy4yY',
                duration: 5,
                type: 'article',
                resources: [],
                quizQuestions: [],
              },
              {
                title: 'Module 5 Quiz',
                content: '<p>Test your knowledge of recovering hacked WhatsApp, Snapchat, and email.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the first step to recover hacked WhatsApp?', type: 'multiple_choice', options: ['Call WhatsApp', 'Delete and reinstall the app', 'Create new number', 'Ignore it'], correctOptionIndex: 1, explanation: 'Reinstalling WhatsApp forces a fresh verification of your phone number.' },
                  { questionText: 'You get a WhatsApp message: \'I accidentally reported you. Click this link.\' What do you do?', type: 'multiple_choice', options: ['Click it', 'Ignore and delete — it\'s a scam', 'Reply', 'Forward to friends'], correctOptionIndex: 1, explanation: 'This is a common scam to steal your WhatsApp account. Never click the link.' },
                  { questionText: 'What is Snapchat\'s 2FA called?', type: 'multiple_choice', options: ['Safe Login', 'Login Verification', 'Snap Lock', 'Password Plus'], correctOptionIndex: 1, explanation: 'Snapchat calls 2FA \'Login Verification\' in Settings → Two-Factor Authentication.' },
                  { questionText: 'Why is Gmail the most important account to protect?', type: 'multiple_choice', options: ['It stores photos', 'Hackers can use it to reset all other passwords', 'It\'s the most popular', 'It has games'], correctOptionIndex: 1, explanation: 'If a hacker controls your Gmail, they can reset passwords for Instagram, Facebook, and every other app.' },
                  { questionText: 'Where do you go to recover a hacked Google account?', type: 'multiple_choice', options: ['google.com', 'g.co/recover', 'mail.google.com', 'support.google.com'], correctOptionIndex: 1, explanation: 'Go to g.co/recover in your browser to start Google account recovery.' },
                ],
              },
            ],
          },
        ],
      }).save();
      console.log('✅ Cyber Literacy course seeded successfully!');
    }

    console.log('\n🎉 ALL SEEDING TASKS COMPLETED SUCCESSFULLY!');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
};

seedEverything();
