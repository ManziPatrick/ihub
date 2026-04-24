import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Course } from './models/Course';
import { Project } from './models/Project';
import { Payment } from './models/Payment';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

// Define interfaces for type safety
interface CourseData {
    title: string;
    description: string;
    instructor: mongoose.Types.ObjectId;
    createdBy?: mongoose.Types.ObjectId;
    price: number;
    discountPrice?: number;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    thumbnail: string;
    status: 'published' | 'draft' | 'archived';
    githubClassroom?: string;
    maxStudents?: number;
    modules: ModuleData[];
}

interface ModuleData {
    title: string;
    description: string;
    lessons: LessonData[];
    learningOutcome?: string;
    hoursAllocated?: number;
}

interface LessonData {
    title: string;
    duration?: number;
    type: 'video' | 'book' | 'ppt' | 'pdf' | 'image' | 'article' | 'quiz' | 'challenge' | 'project' | 'assignment';
    content?: string;
    videoUrl?: string;
    fileUrl?: string;
    resources?: { title: string; url: string; type: 'pdf' | 'ppt' | 'book' | 'image' | 'video' | 'link' | 'zip' }[];
    performanceCriteria?: string[];
    competenceElement?: string;
    assessmentCriteria?: string[];
    githubClassroomLink?: string;
    isAssignment?: boolean;
    assignmentDescription?: string;
    assignmentDeliverables?: string[];
}

interface ProjectData {
    title: string;
    description: string;
    course: mongoose.Types.ObjectId;
    type: 'Individual' | 'Team Project';
    status: 'in_progress' | 'pending_review' | 'completed';
    userId: mongoose.Types.ObjectId;
    mentors: mongoose.Types.ObjectId[];
    githubUrl?: string;
    documentation?: {
        links: { title: string; url: string }[];
    };
    startDate?: Date;
    endDate?: Date;
    skills?: string[];
    parentProject?: mongoose.Types.ObjectId;
    assessmentRubric?: {
        criteria: { title: string; marks: number; achieved: boolean }[];
    };
}

/**
 * CONTENT RENDERER - Clean, modern, accessible for all learners
 */
const renderLessonContent = (
    title: string,
    description: string,
    objectives: string[] = [],
    tasks: string = '',
    resources: { title: string; url: string; type: string }[] = [],
    githubLink?: string
): string => {
    const githubSection = githubLink ? `
    <div class="assignment-box">
        <h4>GitHub Assignment</h4>
        <p>Accept the assignment to get started</p>
        <a href="${githubLink}" target="_blank">Accept Assignment</a>
    </div>
    ` : '';

    return `
<div class="lesson-content">
    <h2>${title}</h2>
    <p>${description}</p>

    <div class="objectives">
        <h3>Learning Objectives</h3>
        <ul>
            ${objectives.map(obj => `<li>${obj}</li>`).join('')}
        </ul>
    </div>
    
    <div class="practice-task">
        <h3>Practice Task</h3>
        <p>${tasks}</p>
    </div>

    ${githubSection}

    <div class="lesson-resources">
        <h3>Lesson Resources</h3>
        <ul>
            ${resources.map(r => `
                <li>
                    <a href="${r.url}" target="_blank">${r.title}</a>
                </li>
            `).join('')}
        </ul>
    </div>
</div>
    `;
};

const CLOUDINARY_SEED_CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'codemande-academy';
const CLOUDINARY_SEED_FOLDER = 'codemande-academy/slides';

const toSeedSlug = (courseTitle: string, moduleTitle: string, lessonTitle: string): string => (
    `${courseTitle}-${moduleTitle}-${lessonTitle}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
);

const toSlideDeckUrl = (courseTitle: string, moduleTitle: string, lessonTitle: string): string => {
    const slug = toSeedSlug(courseTitle, moduleTitle, lessonTitle);
    return `https://res.cloudinary.com/${CLOUDINARY_SEED_CLOUD}/raw/upload/v1/${CLOUDINARY_SEED_FOLDER}/${slug}.pptx`;
};

const toFirstSlidePreviewUrl = (courseTitle: string, moduleTitle: string, lessonTitle: string): string => {
    const slug = toSeedSlug(courseTitle, moduleTitle, lessonTitle);
    return `https://res.cloudinary.com/${CLOUDINARY_SEED_CLOUD}/image/upload/f_auto,q_auto,w_1400/v1/${CLOUDINARY_SEED_FOLDER}/${slug}-slide-1.png`;
};

const addSlideUsageGuidance = (lesson: LessonData, slideUrl: string, firstSlidePreviewUrl: string): string => {
    const baseContent = lesson.content || `<p>Study the slide deck and complete the practical checkpoints for <strong>${lesson.title}</strong>.</p>`;

    return `${baseContent}
<div class="practice-task" style="margin-top:16px;">
  <h3>How to study this slide deck</h3>
  <ul>
    <li>Open the deck and begin from slide 1 for the full learning flow.</li>
    <li>Take notes for each section and implement the mini-practice in your own project.</li>
    <li>Use the first-slide preview to confirm you opened the correct deck version.</li>
  </ul>
  <p><a href="${slideUrl}" target="_blank">Open full PPT deck</a></p>
  <p><a href="${firstSlidePreviewUrl}" target="_blank">Open first-slide preview</a></p>
</div>`;
};

const normalizeLessonForSlides = (
    lesson: LessonData,
    courseTitle: string,
    moduleTitle: string
): LessonData => {
    const isSeededMediaLesson = lesson.type === 'video' || lesson.type === 'pdf';
    if (!isSeededMediaLesson) return lesson;

    const slideUrl = lesson.type === 'video' && lesson.fileUrl
        ? lesson.fileUrl
        : toSlideDeckUrl(courseTitle, moduleTitle, lesson.title);
    const firstSlidePreviewUrl = toFirstSlidePreviewUrl(courseTitle, moduleTitle, lesson.title);

    return {
        ...lesson,
        type: 'ppt',
        fileUrl: slideUrl,
        videoUrl: undefined,
        content: addSlideUsageGuidance(lesson, slideUrl, firstSlidePreviewUrl),
        resources: [
            {
                title: `${lesson.title} — Slide Deck (PPTX)`,
                url: slideUrl,
                type: 'ppt'
            },
            {
                title: `${lesson.title} — First Slide Preview`,
                url: firstSlidePreviewUrl,
                type: 'image'
            },
            ...(lesson.resources || []),
            ...(lesson.videoUrl ? [{ title: `${lesson.title} (Reference Video)`, url: lesson.videoUrl, type: 'video' as const }] : []),
            ...(lesson.type === 'pdf' && lesson.fileUrl ? [{ title: `${lesson.title} (Original PDF)`, url: lesson.fileUrl, type: 'pdf' as const }] : [])
        ]
    };
};

const ensureModuleAssignment = (
    moduleData: ModuleData,
    courseTitle: string,
    moduleIndex: number
): ModuleData => {
    const hasAssignment = moduleData.lessons.some((lesson) => lesson.isAssignment || lesson.type === 'assignment');
    if (hasAssignment) return moduleData;

    const lessonTitle = `${moduleData.title}: Practical Assignment`;
    const assignmentSlideUrl = toSlideDeckUrl(courseTitle, moduleData.title, `${lessonTitle}-brief`);
    const assignmentSlidePreviewUrl = toFirstSlidePreviewUrl(courseTitle, moduleData.title, `${lessonTitle}-brief`);

    return {
        ...moduleData,
        lessons: [
            ...moduleData.lessons,
            {
                title: lessonTitle,
                duration: 90,
                type: 'assignment',
                isAssignment: true,
                fileUrl: assignmentSlideUrl,
                content: `${renderLessonContent(
                    lessonTitle,
                    `Complete a real-world deliverable based on the skills from ${moduleData.title}.`,
                    [
                        'Apply the concepts covered in this module to a real scenario',
                        'Document your implementation decisions clearly',
                        'Submit your code and evidence for review by your trainer/admin'
                    ],
                    'Build the requested feature and submit a working repository + demo evidence.'
                )}
<div class="assignment-box">
    <h4>Submission & Approval Flow</h4>
    <p>After submission, the assignment must be approved by a trainer or admin before the next required unit is unlocked.</p>
    <a href="${assignmentSlidePreviewUrl}" target="_blank">View assignment first slide</a>
</div>`,
                assignmentDescription: `Create a production-ready solution for ${moduleData.title}. Approval is required from a trainer or admin before progressing.`,
                assignmentDeliverables: [
                    'GitHub repository URL',
                    'Demo/deployment URL or screenshots',
                    'Short implementation notes (README)'
                ],
                assessmentCriteria: [
                    'Meets functional requirements (30 marks)',
                    'Code quality and structure (25 marks)',
                    'UI/UX or API usability (20 marks)',
                    'Documentation and setup clarity (15 marks)',
                    'Submission completeness (10 marks)'
                ],
                resources: [
                    { title: 'Assignment Brief Slides (PPTX)', url: assignmentSlideUrl, type: 'ppt' },
                    { title: 'Assignment First Slide Preview', url: assignmentSlidePreviewUrl, type: 'image' }
                ],
                githubClassroomLink: `https://classroom.github.com/a/${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-module-${moduleIndex + 1}`
            }
        ]
    };
};

/**
 * SEED USERS - Trainers and Students (using correct enum values)
 */
const seedUsers = async (): Promise<{ trainer: any, students: any[] }> => {
    // Find or create the main trainer (using 'trainer' role, not 'instructor')
    let trainer = await User.findOne({
        $or: [
            { fullName: 'Manzi Alain Patrick' },
            { email: 'manzi.alain@codemande.com' },
            { role: 'trainer' }
        ]
    });

    if (!trainer) {
        console.log('Creating new trainer...');
        const trainerPassword = await bcrypt.hash('Trainer@2024', 10);
        trainer = new User({
            fullName: 'Manzi Alain Patrick',
            username: 'manzi.alain',
            email: 'manzi.alain@codemande.com',
            password: trainerPassword,
            role: 'trainer', // Changed from 'instructor' to 'trainer'
            title: 'Senior Software Engineer',
            bio: 'Senior software engineer with 10+ years of experience in building scalable web applications and teaching.',
            avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
            status: 'active',
            academicStatus: 'active'
        });
        await trainer.save();
        console.log('✓ Trainer created:', trainer.email);
    } else {
        console.log('✓ Using existing trainer:', trainer.fullName || trainer.email);
    }

    // Create students
    const students: any[] = [];
    const studentNames = [
        'Alex Johnson', 'Sarah Chen', 'Michael Okafor', 'Emma Williams',
        'David Kimani', 'Lisa Mutesi', 'James Otieno', 'Fatima Ahmed',
        'Kevin Uwimana', 'Grace Mbabazi', 'Samuel Nkosi', 'Olivia Wanjiku'
    ];



    for (let i = 0; i < 12; i++) {
        const studentPassword = await bcrypt.hash('Student@2024', 10);
        const name = studentNames[i];
        const username = name.toLowerCase().replace(' ', '.');
        const email = `${username}@example.com`;

        let student = await User.findOne({ email });

        if (!student) {
            student = new User({
                fullName: name,
                username: username,
                email: email,
                password: studentPassword,
                role: 'student',
                level: 1,
                academicStatus: 'active',
                status: 'active',
                title: 'Software Development Student',
                bio: `Passionate about learning web development and building great software.`,
                location: 'Remote'
            });
            await student.save();
            console.log(`   ✓ Student created: ${student.fullName} (${student.email})`);
        } else {
            console.log(`   ✓ Using existing student: ${student.fullName} (${student.email})`);
        }
        students.push(student);
    }

    return { trainer, students };
};

/**
 * MAIN SEEDING FUNCTION
 */
const seedCourses = async () => {
    try {
        await connectDB();
        console.log('\n📦 CONNECTED TO DATABASE - STARTING SEEDING\n');

        // Clean up selective data if needed, but not everything for permanent seeding
        // We'll skip deleteMany and instead use upsert logic for courses below
        console.log('🔄  Starting non-destructive update (upsert mode)');

        // Seed Users
        const { trainer, students } = await seedUsers();

        // Get an admin user for createdBy
        const admin = await User.findOne({ role: 'admin' });

        const coursesData: CourseData[] = [
            // ===================================================================
            // COURSE 1: COMPLETE REACT.JS MASTERY
            // ===================================================================
            {
                title: 'Complete React.js Mastery: From Zero to Expert',
                description: `Learn React.js from the ground up. Build modern, fast, and scalable web applications using hooks, context, and the latest React patterns. Perfect for beginners and experienced developers looking to level up.`,
                instructor: trainer._id,
                createdBy: admin ? admin._id : trainer._id,
                price: 49900,
                discountPrice: 29900,
                category: 'Frontend Development',
                level: 'Beginner',
                thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=2000',
                status: 'published',
                githubClassroom: 'https://classroom.github.com/a/react-mastery-2025',
                maxStudents: 100,
                modules: [
                    {
                        title: 'Module 1: React Fundamentals',
                        description: 'Master the core concepts of React: components, JSX, props, and state.',
                        learningOutcome: 'Build reusable React components and manage component state',
                        hoursAllocated: 12,
                        lessons: [
                            {
                                title: '1.1: Setting Up Your React Environment',
                                duration: 45,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                                content: renderLessonContent(
                                    'Setting Up Your React Development Environment',
                                    'Learn how to set up a professional React development environment from scratch.',
                                    [
                                        'Install and configure Node.js and npm',
                                        'Create a new React project with Vite',
                                        'Understand the project structure',
                                        'Install essential VS Code extensions',
                                        'Set up React Developer Tools'
                                    ],
                                    'Create your first React app with Vite. Customize the default template and add your own component.',
                                    [
                                        { title: 'React Installation Guide', url: 'https://react.dev/learn/installation', type: 'link' },
                                        { title: 'Vite Documentation', url: 'https://vitejs.dev/guide/', type: 'link' },
                                        { title: 'Node.js Download', url: 'https://nodejs.org/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-setup-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Create and configure a React project using Vite. Submit your GitHub repository.',
                                assignmentDeliverables: ['GitHub Repository URL', 'Screenshot of running app'],
                                performanceCriteria: ['Successfully create React project', 'Configure development tools'],
                                assessmentCriteria: ['Project created with Vite (2 marks)', 'Components added (3 marks)']
                            },
                            {
                                title: '1.2: Components and JSX Deep Dive',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=f55qeKGgB_M',
                                content: renderLessonContent(
                                    'Understanding React Components and JSX',
                                    'Learn the building blocks of React applications: components and JSX syntax.',
                                    [
                                        'Create functional components',
                                        'Master JSX syntax and expressions',
                                        'Compose multiple components',
                                        'Use fragments for cleaner markup',
                                        'Style components effectively'
                                    ],
                                    'Build a component library: Create reusable Button, Card, and Header components. Style them with inline styles or CSS modules.',
                                    [
                                        { title: 'Your First Component', url: 'https://react.dev/learn/your-first-component', type: 'link' },
                                        { title: 'JSX Deep Dive', url: 'https://react.dev/learn/writing-markup-with-jsx', type: 'link' },
                                        { title: 'React Fragments', url: 'https://react.dev/reference/react/Fragment', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-components-2025'
                                ),
                                performanceCriteria: ['Create functional components', 'Use JSX correctly'],
                                assessmentCriteria: ['Components created (3 marks)', 'JSX syntax correct (2 marks)']
                            },
                            {
                                title: '1.3: Props and Component Communication',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=O6P86uwfdNY',
                                content: renderLessonContent(
                                    'Props: Passing Data Between Components',
                                    'Learn how to pass data from parent to child components using props.',
                                    [
                                        'Understand props and immutability',
                                        'Pass different data types as props',
                                        'Set default prop values',
                                        'Use children prop for composition',
                                        'Prop drilling patterns'
                                    ],
                                    'Create a product card component that receives product data as props. Build a product listing page that renders multiple cards.',
                                    [
                                        { title: 'Passing Props', url: 'https://react.dev/learn/passing-props-to-a-component', type: 'link' },
                                        { title: 'Children Prop', url: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-props-2025'
                                ),
                                performanceCriteria: ['Pass props correctly', 'Handle different prop types'],
                                assessmentCriteria: ['Props passed correctly (3 marks)', 'Default props set (2 marks)']
                            },
                            {
                                title: '1.4: State and useState Hook',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=4ORZ1GmjaMc',
                                content: renderLessonContent(
                                    'Managing State with useState',
                                    'Make your components dynamic with state. Learn the useState hook and its best practices.',
                                    [
                                        'Understand state vs props',
                                        'Implement useState hook',
                                        'Update state correctly',
                                        'Handle forms with state',
                                        'State update batching'
                                    ],
                                    'Build an interactive counter app, a todo list, and a form with multiple inputs. Practice state updates and form handling.',
                                    [
                                        { title: 'State: A Component\'s Memory', url: 'https://react.dev/learn/state-a-components-memory', type: 'link' },
                                        { title: 'useState Reference', url: 'https://react.dev/reference/react/useState', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-state-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Build a task management app with add, delete, and toggle completion features.',
                                assignmentDeliverables: ['GitHub Repository', 'Live demo URL'],
                                performanceCriteria: ['Implement useState correctly', 'Handle user interactions'],
                                assessmentCriteria: ['State managed correctly (4 marks)', 'Form handling (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 2: React Hooks Mastery',
                        description: 'Deep dive into React hooks and custom hooks for reusable logic.',
                        learningOutcome: 'Master built-in hooks and create custom hooks',
                        hoursAllocated: 15,
                        lessons: [
                            {
                                title: '2.1: useEffect for Side Effects',
                                duration: 70,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=TNka5yDgL3E',
                                content: renderLessonContent(
                                    'Side Effects with useEffect',
                                    'Learn to synchronize your components with external systems using the useEffect hook.',
                                    [
                                        'Understand the effect lifecycle',
                                        'Control when effects run with dependencies',
                                        'Clean up effects to prevent memory leaks',
                                        'Common use cases: data fetching, subscriptions',
                                        'Avoid unnecessary effects'
                                    ],
                                    'Create a weather app that fetches data from an API, a document title updater, and a window resize detector.',
                                    [
                                        { title: 'Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', type: 'link' },
                                        { title: 'You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect', type: 'link' },
                                        { title: 'useEffect Reference', url: 'https://react.dev/reference/react/useEffect', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-effect-2025'
                                ),
                                performanceCriteria: ['Implement useEffect correctly', 'Handle cleanup'],
                                assessmentCriteria: ['Data fetching implemented (4 marks)', 'Cleanup function (2 marks)']
                            },
                            {
                                title: '2.2: useContext and Global State',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=XW2PhvOs54M',
                                content: renderLessonContent(
                                    'Global State Management with Context API',
                                    'Share data across components without prop drilling using Context API.',
                                    [
                                        'Create and provide context',
                                        'Consume context with useContext',
                                        'Combine context with reducers',
                                        'Performance optimization strategies',
                                        'When to use Context vs other solutions'
                                    ],
                                    'Implement theme switching (dark/light mode) and user authentication state using Context API.',
                                    [
                                        { title: 'Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', type: 'link' },
                                        { title: 'useContext Reference', url: 'https://react.dev/reference/react/useContext', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-context-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Build a multi-step checkout process with context for cart and user state.',
                                assignmentDeliverables: ['GitHub Repository', 'Deployed application'],
                                performanceCriteria: ['Implement Context correctly', 'Share global state'],
                                assessmentCriteria: ['Context created (3 marks)', 'State shared across components (3 marks)']
                            },
                            {
                                title: '2.3: useReducer for Complex State',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=f687hBjw0P8',
                                content: renderLessonContent(
                                    'Complex State Management with useReducer',
                                    'Handle complex state logic with reducers. Perfect for state that involves multiple sub-values or depends on previous state.',
                                    [
                                        'Understand reducer pattern',
                                        'Implement useReducer hook',
                                        'Define actions and dispatch',
                                        'Compare useState vs useReducer',
                                        'Combine useReducer with Context'
                                    ],
                                    'Build a shopping cart with add, remove, update quantity, and apply discount actions.',
                                    [
                                        { title: 'useReducer Reference', url: 'https://react.dev/reference/react/useReducer', type: 'link' },
                                        { title: 'Extracting State Logic into a Reducer', url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-reducer-2025'
                                ),
                                performanceCriteria: ['Implement reducer pattern', 'Handle complex state'],
                                assessmentCriteria: ['Reducer implemented (4 marks)', 'Actions defined (3 marks)']
                            },
                            {
                                title: '2.4: Custom Hooks',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=LlvBzyy-558',
                                content: renderLessonContent(
                                    'Building Custom Hooks',
                                    'Create reusable logic with custom hooks. Extract component logic into reusable functions.',
                                    [
                                        'Understand custom hook rules',
                                        'Create reusable data fetching hooks',
                                        'Build form handling hooks',
                                        'Create local storage hooks',
                                        'Compose multiple hooks together'
                                    ],
                                    'Create custom hooks: useLocalStorage, useFetch, useForm, and useClickOutside. Use them across multiple components.',
                                    [
                                        { title: 'Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', type: 'link' },
                                        { title: 'Custom Hook Examples', url: 'https://usehooks.com/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-custom-hooks-2025'
                                ),
                                performanceCriteria: ['Create custom hooks', 'Extract reusable logic'],
                                assessmentCriteria: ['Custom hook created (4 marks)', 'Logic reused (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 3: Routing and Navigation',
                        description: 'Implement client-side routing with React Router v6.',
                        learningOutcome: 'Build multi-page experiences with seamless navigation',
                        hoursAllocated: 10,
                        lessons: [
                            {
                                title: '3.1: React Router Setup and Basic Routing',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=Ul3y1LXxzdU',
                                content: renderLessonContent(
                                    'Setting Up React Router v6',
                                    'Add navigation to your React app with React Router.',
                                    [
                                        'Install and configure React Router',
                                        'Create routes with BrowserRouter',
                                        'Use Link and NavLink for navigation',
                                        'Handle 404 pages',
                                        'Programmatic navigation'
                                    ],
                                    'Create a multi-page website with Home, About, Products, and Contact pages. Add active link styling.',
                                    [
                                        { title: 'React Router Documentation', url: 'https://reactrouter.com/en/main', type: 'link' },
                                        { title: 'React Router Tutorial', url: 'https://reactrouter.com/en/main/start/tutorial', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-router-basics-2025'
                                ),
                                performanceCriteria: ['Configure routing', 'Implement navigation'],
                                assessmentCriteria: ['Routes configured (3 marks)', 'Navigation implemented (3 marks)']
                            },
                            {
                                title: '3.2: Dynamic Routes and URL Parameters',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=0W6i5LYKCSI',
                                content: renderLessonContent(
                                    'Dynamic Routing with URL Parameters',
                                    'Create dynamic routes that respond to URL parameters.',
                                    [
                                        'Define dynamic routes with :param',
                                        'Access parameters with useParams',
                                        'Handle query parameters',
                                        'Nested routes and layouts',
                                        'Index routes'
                                    ],
                                    'Build a blog with individual post pages using dynamic routes. Add category filtering with query parameters.',
                                    [
                                        { title: 'Dynamic Routes', url: 'https://reactrouter.com/en/main/route/route#dynamic-segments', type: 'link' },
                                        { title: 'useParams Hook', url: 'https://reactrouter.com/en/main/hooks/use-params', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-dynamic-routes-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Create a product catalog with category pages and individual product details using dynamic routes.',
                                assignmentDeliverables: ['GitHub Repository', 'Live demo'],
                                performanceCriteria: ['Implement dynamic routes', 'Handle URL parameters'],
                                assessmentCriteria: ['Dynamic routes implemented (4 marks)', 'Parameters handled (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 4: API Integration',
                        description: 'Connect React apps to REST APIs and handle async operations.',
                        learningOutcome: 'Fetch, cache, and manage server state',
                        hoursAllocated: 12,
                        lessons: [
                            {
                                title: '4.1: Data Fetching with Fetch API',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=qM4u1I9UPrY',
                                content: renderLessonContent(
                                    'Fetching Data with the Fetch API',
                                    'Learn to fetch data from REST APIs using the built-in Fetch API.',
                                    [
                                        'Make GET requests with fetch',
                                        'Handle loading states',
                                        'Implement error handling',
                                        'Parse JSON responses',
                                        'POST, PUT, DELETE requests'
                                    ],
                                    'Build a GitHub user search app that fetches and displays user profiles and repositories.',
                                    [
                                        { title: 'Using Fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', type: 'link' },
                                        { title: 'JavaScript Fetch API', url: 'https://javascript.info/fetch', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-fetch-2025'
                                ),
                                performanceCriteria: ['Implement data fetching', 'Handle async operations'],
                                assessmentCriteria: ['API calls implemented (4 marks)', 'Loading states (2 marks)', 'Error handling (2 marks)']
                            },
                            {
                                title: '4.2: Axios and API Service Layer',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=kRAtXRAfD-4',
                                content: renderLessonContent(
                                    'Professional API Integration with Axios',
                                    'Use Axios for more powerful HTTP requests and create organized API service layers.',
                                    [
                                        'Install and configure Axios',
                                        'Create Axios instances',
                                        'Set up request/response interceptors',
                                        'Organize API endpoints in services',
                                        'Handle authentication headers'
                                    ],
                                    'Create an API service layer for a blog platform. Implement interceptors for auth tokens and error handling.',
                                    [
                                        { title: 'Axios Documentation', url: 'https://axios-http.com/', type: 'link' },
                                        { title: 'Axios Interceptors', url: 'https://axios-http.com/docs/interceptors', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-axios-2025'
                                ),
                                performanceCriteria: ['Configure Axios', 'Organize API calls'],
                                assessmentCriteria: ['Axios configured (3 marks)', 'Service layer organized (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 5: Styling with Tailwind CSS',
                        description: 'Master modern CSS with Tailwind utility-first framework.',
                        learningOutcome: 'Build beautiful, responsive UIs efficiently',
                        hoursAllocated: 10,
                        lessons: [
                            {
                                title: '5.1: Tailwind CSS Fundamentals',
                                duration: 45,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=lCxcTsOHrjo',
                                content: renderLessonContent(
                                    'Introduction to Tailwind CSS',
                                    'Learn the utility-first approach to styling with Tailwind CSS.',
                                    [
                                        'Install and configure Tailwind',
                                        'Understand utility classes',
                                        'Apply colors, spacing, typography',
                                        'Use responsive prefixes',
                                        'Style states (hover, focus)'
                                    ],
                                    'Convert a standard CSS component library to Tailwind CSS. Compare the code and efficiency.',
                                    [
                                        { title: 'Tailwind CSS Documentation', url: 'https://tailwindcss.com/docs', type: 'link' },
                                        { title: 'Tailwind Play', url: 'https://play.tailwindcss.com/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/tailwind-basics-2025'
                                ),
                                performanceCriteria: ['Configure Tailwind', 'Apply utility classes'],
                                assessmentCriteria: ['Tailwind configured (2 marks)', 'Utility classes used (3 marks)']
                            },
                            {
                                title: '5.2: Responsive Layouts with Tailwind',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=MAkaS4fIDOk',
                                content: renderLessonContent(
                                    'Building Responsive Layouts',
                                    'Create layouts that work on all devices using Tailwind responsive utilities.',
                                    [
                                        'Master flexbox and grid in Tailwind',
                                        'Implement mobile-first design',
                                        'Use responsive breakpoints',
                                        'Create responsive navigation',
                                        'Build card grids'
                                    ],
                                    'Build a fully responsive portfolio website with navigation, hero section, skills grid, and contact form.',
                                    [
                                        { title: 'Tailwind Responsive Design', url: 'https://tailwindcss.com/docs/responsive-design', type: 'link' },
                                        { title: 'Tailwind Flexbox', url: 'https://tailwindcss.com/docs/flex', type: 'link' },
                                        { title: 'Tailwind Grid', url: 'https://tailwindcss.com/docs/grid-template-columns', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/tailwind-responsive-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Build a responsive e-commerce product page that works on mobile, tablet, and desktop.',
                                assignmentDeliverables: ['GitHub Repository', 'Live demo', 'Responsive screenshots'],
                                performanceCriteria: ['Implement responsive design', 'Use breakpoints correctly'],
                                assessmentCriteria: ['Mobile layout (3 marks)', 'Tablet layout (3 marks)', 'Desktop layout (3 marks)']
                            },
                            {
                                title: '5.3: Tailwind Customization',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=6O8s7J20N9Y',
                                content: renderLessonContent(
                                    'Customizing Tailwind for Your Brand',
                                    'Extend Tailwind to match your design system and brand guidelines.',
                                    [
                                        'Customize theme configuration',
                                        'Add custom colors and fonts',
                                        'Create custom utility classes',
                                        'Use @apply directive',
                                        'Write custom plugins'
                                    ],
                                    'Create a custom design system with brand colors, custom fonts, and reusable component classes.',
                                    [
                                        { title: 'Tailwind Configuration', url: 'https://tailwindcss.com/docs/configuration', type: 'link' },
                                        { title: 'Tailwind Customization', url: 'https://tailwindcss.com/docs/theme', type: 'link' },
                                        { title: 'Adding Custom Styles', url: 'https://tailwindcss.com/docs/adding-custom-styles', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/tailwind-customize-2025'
                                ),
                                performanceCriteria: ['Customize Tailwind config', 'Extend theme'],
                                assessmentCriteria: ['Custom colors added (2 marks)', 'Custom fonts (2 marks)', '@apply used (2 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 6: Performance Optimization',
                        description: 'Optimize React apps for speed and user experience.',
                        learningOutcome: 'Build high-performance React applications',
                        hoursAllocated: 8,
                        lessons: [
                            {
                                title: '6.1: Memoization and Preventing Re-renders',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=7Yrd8JatE-w',
                                content: renderLessonContent(
                                    'Optimizing with useMemo and useCallback',
                                    'Prevent unnecessary re-renders with memoization techniques.',
                                    [
                                        'Understand when to memoize',
                                        'Use React.memo for components',
                                        'Implement useMemo for values',
                                        'Use useCallback for functions',
                                        'Measure performance improvements'
                                    ],
                                    'Optimize a data-heavy dashboard with filtering and sorting. Measure before/after performance.',
                                    [
                                        { title: 'useMemo Reference', url: 'https://react.dev/reference/react/useMemo', type: 'link' },
                                        { title: 'useCallback Reference', url: 'https://react.dev/reference/react/useCallback', type: 'link' },
                                        { title: 'React.memo', url: 'https://react.dev/reference/react/memo', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-performance-2025'
                                ),
                                performanceCriteria: ['Implement memoization', 'Optimize re-renders'],
                                assessmentCriteria: ['useMemo used (3 marks)', 'useCallback used (3 marks)', 'Performance improved (2 marks)']
                            },
                            {
                                title: '6.2: Code Splitting and Lazy Loading',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=2f7pHoF5id0',
                                content: renderLessonContent(
                                    'Code Splitting with React.lazy',
                                    'Reduce initial bundle size by splitting your code into chunks.',
                                    [
                                        'Understand code splitting benefits',
                                        'Implement React.lazy()',
                                        'Use Suspense for fallback UI',
                                        'Route-based code splitting',
                                        'Analyze bundle size'
                                    ],
                                    'Implement route-based code splitting in a multi-page app. Use bundle analyzer to compare sizes.',
                                    [
                                        { title: 'Code Splitting', url: 'https://react.dev/reference/react/lazy', type: 'link' },
                                        { title: 'Suspense', url: 'https://react.dev/reference/react/Suspense', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-code-splitting-2025'
                                ),
                                performanceCriteria: ['Implement code splitting', 'Use lazy loading'],
                                assessmentCriteria: ['React.lazy used (3 marks)', 'Suspense implemented (2 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 7: Testing React Applications',
                        description: 'Write comprehensive tests for React components.',
                        learningOutcome: 'Build reliable, bug-free applications with testing',
                        hoursAllocated: 8,
                        lessons: [
                            {
                                title: '7.1: Unit Testing with Jest and React Testing Library',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=8Xgi_6L20_4',
                                content: renderLessonContent(
                                    'Testing React Components',
                                    'Learn to test React components with Jest and React Testing Library.',
                                    [
                                        'Set up testing environment',
                                        'Render components in tests',
                                        'Query elements correctly',
                                        'Simulate user events',
                                        'Test async operations'
                                    ],
                                    'Write tests for a todo app: component rendering, user interactions, and async data fetching.',
                                    [
                                        { title: 'React Testing Library', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'link' },
                                        { title: 'Jest Documentation', url: 'https://jestjs.io/docs/getting-started', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-testing-2025'
                                ),
                                performanceCriteria: ['Write unit tests', 'Test component behavior'],
                                assessmentCriteria: ['Component tests written (4 marks)', 'Event testing (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 8: Deployment',
                        description: 'Deploy React applications to the cloud.',
                        learningOutcome: 'Launch production-ready applications',
                        hoursAllocated: 6,
                        lessons: [
                            {
                                title: '8.1: Building for Production',
                                duration: 45,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=2eIf52S9_Ok',
                                content: renderLessonContent(
                                    'Production Builds and Environment Variables',
                                    'Prepare your React app for production deployment.',
                                    [
                                        'Create optimized production build',
                                        'Manage environment variables',
                                        'Configure build commands',
                                        'Analyze bundle composition',
                                        'Environment-specific config'
                                    ],
                                    'Configure environment variables for development, staging, and production. Optimize the production build.',
                                    [
                                        { title: 'Vite Environment Variables', url: 'https://vitejs.dev/guide/env-and-mode.html', type: 'link' },
                                        { title: 'Bundle Analyzer', url: 'https://github.com/btd/rollup-plugin-visualizer', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-build-2025'
                                ),
                                performanceCriteria: ['Create production build', 'Configure environment vars'],
                                assessmentCriteria: ['Build optimized (2 marks)', 'Env vars configured (2 marks)']
                            },
                            {
                                title: '8.2: Deploying to Vercel and Netlify',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=XovmC8S_8e8',
                                content: renderLessonContent(
                                    'Deploy to Modern Hosting Platforms',
                                    'Deploy your React applications to Vercel and Netlify with automatic CI/CD.',
                                    [
                                        'Deploy to Vercel via GitHub',
                                        'Configure Netlify deployment',
                                        'Set up custom domains',
                                        'SSL certificates automatically',
                                        'Preview deployments for PRs'
                                    ],
                                    'Deploy your portfolio project to both Vercel and Netlify. Connect a custom domain and verify HTTPS.',
                                    [
                                        { title: 'Vercel Documentation', url: 'https://vercel.com/docs', type: 'link' },
                                        { title: 'Netlify Documentation', url: 'https://docs.netlify.com/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/react-deploy-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Deploy your capstone project to Vercel with a custom domain. Submit both repository and live URLs.',
                                assignmentDeliverables: ['GitHub Repository', 'Live Deployment URL', 'Custom Domain URL'],
                                performanceCriteria: ['Deploy application', 'Configure custom domain'],
                                assessmentCriteria: ['Deployed to Vercel (3 marks)', 'Custom domain (3 marks)', 'HTTPS enabled (2 marks)']
                            }
                        ]
                    }
                ]
            },
            // ===================================================================
            // COURSE 2: NODE.JS & EXPRESS MASTERY
            // ===================================================================
            {
                title: 'Node.js & Express: Build Scalable Backend APIs',
                description: `Master backend development with Node.js and Express. Build RESTful APIs, integrate databases, implement authentication, and deploy to production.`,
                instructor: trainer._id,
                createdBy: admin ? admin._id : trainer._id,
                price: 59900,
                discountPrice: 34900,
                category: 'Backend Development',
                level: 'Intermediate',
                thumbnail: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?auto=format&fit=crop&q=80&w=2000',
                status: 'published',
                githubClassroom: 'https://classroom.github.com/a/node-mastery-2025',
                maxStudents: 80,
                modules: [
                    {
                        title: 'Module 1: Node.js Fundamentals',
                        description: 'Master the Node.js runtime and asynchronous programming.',
                        learningOutcome: 'Build command-line tools and understand Node.js architecture',
                        hoursAllocated: 12,
                        lessons: [
                            {
                                title: '1.1: Node.js Architecture and Event Loop',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
                                content: renderLessonContent(
                                    'Understanding Node.js Architecture',
                                    'Deep dive into how Node.js works under the hood: event loop, libuv, and non-blocking I/O.',
                                    [
                                        'Understand V8 JavaScript engine',
                                        'Learn libuv and the event loop',
                                        'Differentiate blocking vs non-blocking',
                                        'Master event loop phases',
                                        'Use process.nextTick and setImmediate'
                                    ],
                                    'Create a simple HTTP server and benchmark its performance. Write scripts to demonstrate blocking vs non-blocking code.',
                                    [
                                        { title: 'Node.js Event Loop', url: 'https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/', type: 'link' },
                                        { title: 'libuv Documentation', url: 'https://libuv.org/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-event-loop-2025'
                                ),
                                performanceCriteria: ['Explain Node.js architecture', 'Implement async patterns'],
                                assessmentCriteria: ['Event loop explained (3 marks)', 'Async code implemented (4 marks)']
                            },
                            {
                                title: '1.2: Modules and NPM',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=H6SNo7_6t0M',
                                content: renderLessonContent(
                                    'Node.js Module System and NPM',
                                    'Learn to organize code with modules and manage dependencies with NPM.',
                                    [
                                        'Create and export CommonJS modules',
                                        'Use ES modules in Node.js',
                                        'Initialize and configure package.json',
                                        'Manage dependencies with npm',
                                        'Understand semantic versioning'
                                    ],
                                    'Create a utility NPM package with math helpers and string utilities. Publish to npm registry.',
                                    [
                                        { title: 'Node.js Modules', url: 'https://nodejs.org/api/modules.html', type: 'link' },
                                        { title: 'NPM Documentation', url: 'https://docs.npmjs.com/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-modules-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Create and publish your own NPM package with utility functions.',
                                assignmentDeliverables: ['NPM package link', 'GitHub repository'],
                                performanceCriteria: ['Create modules', 'Publish NPM package'],
                                assessmentCriteria: ['Module created (3 marks)', 'NPM package published (3 marks)']
                            },
                            {
                                title: '1.3: File System and Streams',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=f2esA1S_i5g',
                                content: renderLessonContent(
                                    'Working with Files and Streams',
                                    'Read, write, and manipulate files. Process large files efficiently with streams.',
                                    [
                                        'Read and write files synchronously',
                                        'Use async file system methods',
                                        'Work with directories',
                                        'Understand readable/writable streams',
                                        'Pipe streams for efficiency'
                                    ],
                                    'Build a file processing tool that reads large CSV files, transforms data, and writes output using streams.',
                                    [
                                        { title: 'FS Module', url: 'https://nodejs.org/api/fs.html', type: 'link' },
                                        { title: 'Stream API', url: 'https://nodejs.org/api/stream.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-files-2025'
                                ),
                                performanceCriteria: ['Implement file operations', 'Use streams'],
                                assessmentCriteria: ['File operations (3 marks)', 'Streams implemented (4 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 2: Express.js Framework',
                        description: 'Build robust web applications and APIs with Express.',
                        learningOutcome: 'Create RESTful APIs with proper middleware and error handling',
                        hoursAllocated: 15,
                        lessons: [
                            {
                                title: '2.1: Express Fundamentals',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=SccSCuHhOw0',
                                content: renderLessonContent(
                                    'Getting Started with Express.js',
                                    'Learn the Express framework: routing, middleware, and request/response handling.',
                                    [
                                        'Set up Express server',
                                        'Handle different HTTP methods',
                                        'Work with route parameters',
                                        'Parse request bodies',
                                        'Send JSON responses'
                                    ],
                                    'Create a RESTful API for a notes application with CRUD operations.',
                                    [
                                        { title: 'Express.js Official', url: 'https://expressjs.com/', type: 'link' },
                                        { title: 'Express Routing Guide', url: 'https://expressjs.com/en/guide/routing.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/express-basics-2025'
                                ),
                                performanceCriteria: ['Set up Express server', 'Implement routing'],
                                assessmentCriteria: ['Server configured (3 marks)', 'Routes implemented (4 marks)']
                            },
                            {
                                title: '2.2: Express Middleware Deep Dive',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=7H_QH9nipPa',
                                content: renderLessonContent(
                                    'Mastering Express Middleware',
                                    'Understand middleware execution order and build custom middleware functions.',
                                    [
                                        'Understand middleware chain',
                                        'Create application-level middleware',
                                        'Build router-level middleware',
                                        'Implement error-handling middleware',
                                        'Use third-party middleware'
                                    ],
                                    'Create custom middleware for logging, authentication, rate limiting, and error handling.',
                                    [
                                        { title: 'Express Middleware', url: 'https://expressjs.com/en/guide/using-middleware.html', type: 'link' },
                                        { title: 'Writing Middleware', url: 'https://expressjs.com/en/guide/writing-middleware.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/express-middleware-2025'
                                ),
                                performanceCriteria: ['Create custom middleware', 'Handle errors'],
                                assessmentCriteria: ['Logger middleware (2 marks)', 'Auth middleware (3 marks)', 'Error handler (3 marks)']
                            },
                            {
                                title: '2.3: RESTful API Design',
                                duration: 70,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=pn_unpY_W8Q',
                                content: renderLessonContent(
                                    'Designing Professional REST APIs',
                                    'Learn REST principles and build well-structured, maintainable APIs.',
                                    [
                                        'Understand REST constraints',
                                        'Design resource-based endpoints',
                                        'Use proper HTTP status codes',
                                        'Implement filtering and pagination',
                                        'Version your API'
                                    ],
                                    'Design and implement a RESTful API for a library system with books, authors, and borrowers.',
                                    [
                                        { title: 'RESTful API Design', url: 'https://restfulapi.net/', type: 'link' },
                                        { title: 'HTTP Status Codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/express-rest-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Build a complete REST API for an e-commerce platform with products, categories, and orders.',
                                assignmentDeliverables: ['GitHub Repository', 'API Documentation', 'Postman collection'],
                                performanceCriteria: ['Design REST endpoints', 'Implement CRUD'],
                                assessmentCriteria: ['Endpoint design (4 marks)', 'Status codes (2 marks)', 'Pagination (2 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 3: MongoDB and Mongoose',
                        description: 'Integrate MongoDB database with Mongoose ODM.',
                        learningOutcome: 'Model data and perform database operations',
                        hoursAllocated: 14,
                        lessons: [
                            {
                                title: '3.1: MongoDB Atlas and Mongoose Connection',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=-MTSQ_nU_N0',
                                content: renderLessonContent(
                                    'Setting Up MongoDB with Mongoose',
                                    'Connect your Node.js app to MongoDB Atlas using Mongoose ODM.',
                                    [
                                        'Create MongoDB Atlas cluster',
                                        'Configure connection string',
                                        'Set up Mongoose connection',
                                        'Handle connection events',
                                        'Implement graceful shutdown'
                                    ],
                                    'Set up a MongoDB Atlas cluster and connect your Express app. Implement connection pooling and error handling.',
                                    [
                                        { title: 'MongoDB Atlas', url: 'https://www.mongodb.com/cloud/atlas', type: 'link' },
                                        { title: 'Mongoose Documentation', url: 'https://mongoosejs.com/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/mongoose-connect-2025'
                                ),
                                performanceCriteria: ['Configure MongoDB', 'Establish connection'],
                                assessmentCriteria: ['Atlas cluster created (2 marks)', 'Connection established (3 marks)']
                            },
                            {
                                title: '3.2: Mongoose Schemas and Models',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=W_62Vv8U3rM',
                                content: renderLessonContent(
                                    'Data Modeling with Mongoose',
                                    'Define schemas with validation, defaults, and data types.',
                                    [
                                        'Define schema with proper types',
                                        'Add field validation',
                                        'Create custom validators',
                                        'Define model relationships',
                                        'Use schema options'
                                    ],
                                    'Design database schema for an e-commerce platform: Users, Products, Orders, and Reviews.',
                                    [
                                        { title: 'Mongoose Schemas', url: 'https://mongoosejs.com/docs/guide.html', type: 'link' },
                                        { title: 'Schema Validation', url: 'https://mongoosejs.com/docs/validation.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/mongoose-schemas-2025'
                                ),
                                performanceCriteria: ['Define schemas', 'Implement validation'],
                                assessmentCriteria: ['Schemas defined (4 marks)', 'Validation rules (3 marks)']
                            },
                            {
                                title: '3.3: CRUD Operations',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=fG8eMMvJidw',
                                content: renderLessonContent(
                                    'CRUD Operations with Mongoose',
                                    'Perform Create, Read, Update, and Delete operations using Mongoose.',
                                    [
                                        'Create documents with save()',
                                        'Query with find(), findOne()',
                                        'Update documents',
                                        'Delete documents',
                                        'Use lean() for performance'
                                    ],
                                    'Implement full CRUD endpoints for all models in your e-commerce API.',
                                    [
                                        { title: 'Mongoose Queries', url: 'https://mongoosejs.com/docs/queries.html', type: 'link' },
                                        { title: 'Mongoose API', url: 'https://mongoosejs.com/docs/api/model.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/mongoose-crud-2025'
                                ),
                                performanceCriteria: ['Implement CRUD', 'Write queries'],
                                assessmentCriteria: ['Create operation (2 marks)', 'Read operations (3 marks)', 'Update (2 marks)', 'Delete (2 marks)']
                            },
                            {
                                title: '3.4: Advanced Queries and Aggregation',
                                duration: 70,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=Vxv6ScaB-lU',
                                content: renderLessonContent(
                                    'Advanced MongoDB Aggregation',
                                    'Master the aggregation pipeline for complex data transformations.',
                                    [
                                        'Understand aggregation stages',
                                        'Use $match, $group, $project',
                                        'Perform joins with $lookup',
                                        'Unwind arrays with $unwind',
                                        'Build analytics reports'
                                    ],
                                    'Build analytics endpoints: monthly sales, top products, user order history, and inventory reports.',
                                    [
                                        { title: 'MongoDB Aggregation', url: 'https://www.mongodb.com/docs/manual/aggregation/', type: 'link' },
                                        { title: 'Mongoose Aggregate', url: 'https://mongoosejs.com/docs/api/aggregate.html', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/mongoose-aggregation-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Create a comprehensive analytics dashboard for your e-commerce API with multiple aggregation pipelines.',
                                assignmentDeliverables: ['GitHub Repository', 'API Documentation', 'Sample queries'],
                                performanceCriteria: ['Use aggregation pipeline', 'Build complex queries'],
                                assessmentCriteria: ['Aggregation stages (4 marks)', '$lookup used (2 marks)', 'Analytics reports (3 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 4: Authentication and Authorization',
                        description: 'Secure your APIs with JWT authentication and role-based access.',
                        learningOutcome: 'Implement secure authentication and authorization',
                        hoursAllocated: 12,
                        lessons: [
                            {
                                title: '4.1: JWT Authentication',
                                duration: 65,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
                                content: renderLessonContent(
                                    'JWT Authentication Strategy',
                                    'Implement stateless authentication using JSON Web Tokens.',
                                    [
                                        'Understand JWT structure',
                                        'Generate tokens on login',
                                        'Create authentication middleware',
                                        'Protect routes with JWT',
                                        'Store tokens securely'
                                    ],
                                    'Implement complete JWT authentication system with register, login, and protected routes.',
                                    [
                                        { title: 'JWT.io', url: 'https://jwt.io/', type: 'link' },
                                        { title: 'jsonwebtoken', url: 'https://github.com/auth0/node-jsonwebtoken', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-jwt-2025'
                                ),
                                performanceCriteria: ['Implement JWT auth', 'Protect routes'],
                                assessmentCriteria: ['Token generation (3 marks)', 'Auth middleware (4 marks)']
                            },
                            {
                                title: '4.2: Role-Based Access Control',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=T_78S_u_4K4',
                                content: renderLessonContent(
                                    'Authorization with RBAC',
                                    'Control access to resources based on user roles and permissions.',
                                    [
                                        'Define user roles',
                                        'Create role-based middleware',
                                        'Implement permission checks',
                                        'Restrict resource access',
                                        'Handle ownership verification'
                                    ],
                                    'Implement RBAC for a blog platform: Admin (full access), Editor (create/edit posts), Viewer (read only).',
                                    [
                                        { title: 'RBAC Introduction', url: 'https://en.wikipedia.org/wiki/Role-based_access_control', type: 'link' },
                                        { title: 'Access Control in Node.js', url: 'https://www.freecodecamp.org/news/how-to-implement-access-control-in-node-js/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-rbac-2025'
                                ),
                                performanceCriteria: ['Define roles', 'Implement authorization'],
                                assessmentCriteria: ['Role middleware (3 marks)', 'Permission checks (3 marks)', 'Ownership (2 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 5: API Security',
                        description: 'Secure your Node.js applications against common vulnerabilities.',
                        learningOutcome: 'Build secure, production-ready APIs',
                        hoursAllocated: 10,
                        lessons: [
                            {
                                title: '5.1: Security Headers and Helmet',
                                duration: 45,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=llv9L2o6fU0',
                                content: renderLessonContent(
                                    'Securing Express with Helmet.js',
                                    'Protect your app from common web vulnerabilities with security headers.',
                                    [
                                        'Integrate Helmet.js',
                                        'Configure Content Security Policy',
                                        'Enable HSTS',
                                        'Prevent clickjacking',
                                        'Mitigate XSS attacks'
                                    ],
                                    'Configure Helmet.js with custom CSP policy. Test your headers with securityheaders.com.',
                                    [
                                        { title: 'Helmet.js', url: 'https://helmetjs.github.io/', type: 'link' },
                                        { title: 'OWASP Secure Headers', url: 'https://owasp.org/www-project-secure-headers/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-security-headers-2025'
                                ),
                                performanceCriteria: ['Configure Helmet', 'Set security headers'],
                                assessmentCriteria: ['Helmet integrated (2 marks)', 'CSP configured (2 marks)', 'HSTS enabled (2 marks)']
                            },
                            {
                                title: '5.2: Rate Limiting and DoS Protection',
                                duration: 50,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=mNfG6_7fOyo',
                                content: renderLessonContent(
                                    'Rate Limiting for API Protection',
                                    'Prevent brute force attacks and DoS with rate limiting.',
                                    [
                                        'Implement express-rate-limit',
                                        'Configure different limits per endpoint',
                                        'Use Redis for distributed limiting',
                                        'Skip limiting for trusted clients',
                                        'Custom error responses'
                                    ],
                                    'Implement rate limiting: 100 requests/hour for general API, 5 requests/minute for login endpoints.',
                                    [
                                        { title: 'express-rate-limit', url: 'https://github.com/express-rate-limit/express-rate-limit', type: 'link' },
                                        { title: 'rate-limit-redis', url: 'https://github.com/wyattjoh/rate-limit-redis', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-rate-limit-2025'
                                ),
                                performanceCriteria: ['Implement rate limiting', 'Use Redis store'],
                                assessmentCriteria: ['Rate limiter configured (3 marks)', 'Different limits (2 marks)', 'Redis store (2 marks)']
                            },
                            {
                                title: '5.3: Input Validation and Sanitization',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=V9XjSg88O2s',
                                content: renderLessonContent(
                                    'Input Validation and Sanitization',
                                    'Never trust user input. Validate and sanitize all incoming data.',
                                    [
                                        'Validate request body with Joi',
                                        'Sanitize input to prevent injection',
                                        'Validate query parameters',
                                        'Handle file upload validation',
                                        'Return user-friendly errors'
                                    ],
                                    'Implement comprehensive validation for user registration: email, password strength, phone, age.',
                                    [
                                        { title: 'Joi Documentation', url: 'https://joi.dev/', type: 'link' },
                                        { title: 'express-validator', url: 'https://express-validator.github.io/docs/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-validation-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Add complete validation layer to your e-commerce API. Implement Joi schemas for all endpoints.',
                                assignmentDeliverables: ['GitHub Repository', 'Validation schemas', 'Error handling examples'],
                                performanceCriteria: ['Implement validation', 'Sanitize input'],
                                assessmentCriteria: ['Joi schemas (4 marks)', 'Error handling (3 marks)', 'Sanitization (2 marks)']
                            }
                        ]
                    },
                    {
                        title: 'Module 6: Testing and Deployment',
                        description: 'Test and deploy your Node.js applications.',
                        learningOutcome: 'Write tests and deploy to production',
                        hoursAllocated: 10,
                        lessons: [
                            {
                                title: '6.1: Unit and Integration Testing',
                                duration: 70,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=8Xgi_6L20_4',
                                content: renderLessonContent(
                                    'Testing Node.js with Jest',
                                    'Write unit tests for functions and integration tests for APIs.',
                                    [
                                        'Configure Jest for Node.js',
                                        'Write unit tests for utilities',
                                        'Test Express APIs with Supertest',
                                        'Mock database calls',
                                        'Set up test database'
                                    ],
                                    'Write comprehensive tests for your API: unit tests for utilities, integration tests for endpoints.',
                                    [
                                        { title: 'Jest Documentation', url: 'https://jestjs.io/', type: 'link' },
                                        { title: 'Supertest', url: 'https://github.com/visionmedia/supertest', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-testing-2025'
                                ),
                                performanceCriteria: ['Write unit tests', 'Write integration tests'],
                                assessmentCriteria: ['Unit tests (3 marks)', 'Integration tests (4 marks)', 'Mocks used (2 marks)']
                            },
                            {
                                title: '6.2: Docker Containerization',
                                duration: 60,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=3S3pD8W2k-A',
                                content: renderLessonContent(
                                    'Dockerizing Node.js Applications',
                                    'Package your Node.js app into containers for consistent deployment.',
                                    [
                                        'Write optimized Dockerfile',
                                        'Use multi-stage builds',
                                        'Configure docker-compose',
                                        'Manage environment variables',
                                        'Reduce image size'
                                    ],
                                    'Dockerize your Node.js/Express/MongoDB application with docker-compose.',
                                    [
                                        { title: 'Docker for Node.js', url: 'https://nodejs.org/en/docs/guides/nodejs-docker-webapp/', type: 'link' },
                                        { title: 'Docker Compose', url: 'https://docs.docker.com/compose/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-docker-2025'
                                ),
                                performanceCriteria: ['Create Dockerfile', 'Use docker-compose'],
                                assessmentCriteria: ['Dockerfile optimized (3 marks)', 'docker-compose (2 marks)', 'Multi-stage (2 marks)']
                            },
                            {
                                title: '6.3: Production Deployment',
                                duration: 55,
                                type: 'video',
                                videoUrl: 'https://www.youtube.com/watch?v=mbsmsi7l3r4',
                                content: renderLessonContent(
                                    'Deploying to Production',
                                    'Deploy your Node.js API to cloud platforms with CI/CD.',
                                    [
                                        'Deploy to Render/Vercel',
                                        'Configure environment variables',
                                        'Set up PM2 process manager',
                                        'Implement CI/CD with GitHub Actions',
                                        'Monitor application performance'
                                    ],
                                    'Deploy your API to Render. Set up GitHub Actions for automated testing and deployment.',
                                    [
                                        { title: 'Render Deployment', url: 'https://render.com/docs/deploy-node-express-app', type: 'link' },
                                        { title: 'PM2 Documentation', url: 'https://pm2.keymetrics.io/', type: 'link' }
                                    ],
                                    'https://classroom.github.com/a/node-deploy-2025'
                                ),
                                isAssignment: true,
                                assignmentDescription: 'Deploy your complete e-commerce API to production with CI/CD pipeline.',
                                assignmentDeliverables: ['Live API URL', 'GitHub repository', 'CI/CD workflow file'],
                                performanceCriteria: ['Deploy application', 'Configure CI/CD'],
                                assessmentCriteria: ['API deployed (3 marks)', 'CI/CD configured (3 marks)', 'PM2 setup (2 marks)']
                            }
                        ]
                    }
                ]
            }
        ];
        const preparedCoursesData: CourseData[] = coursesData.map((courseData) => ({
            ...courseData,
            modules: courseData.modules.map((moduleData, moduleIndex) => {
                const withSlides = {
                    ...moduleData,
                    lessons: moduleData.lessons.map((lesson) => normalizeLessonForSlides(lesson, courseData.title, moduleData.title))
                };

                return ensureModuleAssignment(withSlides, courseData.title, moduleIndex);
            })
        }));

        console.log('\n🚀 STARTING COURSE CREATION...\n');

        // Store all created projects for later assignment
        const allProjects: mongoose.Document[] = [];

        // Create/Update courses and their associated projects
        for (const courseData of preparedCoursesData) {
            let course = await Course.findOne({ title: courseData.title });

            if (course) {
                console.log(`🔄 UPDATING EXISTING COURSE: ${courseData.title}`);
                // Update specific fields we want to refresh
                course.description = courseData.description;
                course.category = courseData.category;
                course.level = courseData.level;
                course.price = courseData.price;
                course.discountPrice = courseData.discountPrice;
                course.thumbnail = courseData.thumbnail;
                course.githubClassroom = courseData.githubClassroom;
                (course as any).modules = courseData.modules;
                await course.save();
            } else {
                course = new Course(courseData);
                await course.save();
                console.log(`✅ NEW COURSE CREATED: ${courseData.title}`);
            }

            console.log(`   ├─ Category: ${courseData.category} | Level: ${courseData.level}`);
            console.log(`   ├─ Price: RWF ${courseData.price}${courseData.discountPrice ? ` (Discounted: RWF ${courseData.discountPrice})` : ''}`);
            console.log(`   └─ Modules: ${courseData.modules.length}`);

            // Create a payment record for the paid course
            if (courseData.price > 0) {
                const payment = new Payment({
                    userId: trainer._id,
                    courseId: course._id,
                    amount: courseData.discountPrice || courseData.price,
                    currency: 'RWF',
                    status: 'completed',
                    paymentMethod: 'Admin Setup',
                    transactionId: `SEED-${Date.now()}-${course._id}`,
                    type: 'Course Enrollment',
                    itemTitle: courseData.title,
                    adminNotes: 'Seeded course setup'
                });
                await payment.save();
                console.log(`   └─ Payment record created for course enrollment`);
            }

            // Create projects for lessons marked as assignments
            for (const module of courseData.modules) {
                for (const lesson of module.lessons) {
                    if (lesson.isAssignment) {
                        const rubricCriteria = lesson.assessmentCriteria?.map(criteria => {
                            const match = criteria.match(/\((\d+)\s*marks?\)/);
                            const marks = match ? parseInt(match[1]) : 5;
                            return {
                                title: criteria,
                                marks,
                                achieved: false
                            };
                        }) || [];

                        const project = new Project({
                            title: `${courseData.title.substring(0, 30)}... - ${lesson.title}`,
                            description: lesson.assignmentDescription || lesson.content || '',
                            course: course._id,
                            type: 'Individual',
                            status: 'in_progress',
                            userId: trainer._id,
                            mentors: [trainer._id],
                            documentation: {
                                links: [
                                    { title: 'GitHub Classroom Assignment', url: lesson.githubClassroomLink || courseData.githubClassroom || '#' },
                                    { title: 'Assignment Instructions', url: '#' },
                                    { title: 'Submission Guidelines', url: '#' }
                                ].concat(
                                    lesson.resources?.map(r => ({ title: r.title, url: r.url })) || []
                                )
                            },
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks deadline
                            skills: lesson.performanceCriteria || [],
                            assessmentRubric: {
                                criteria: rubricCriteria
                            }
                        });

                        await project.save();
                        allProjects.push(project);
                        console.log(`   📌 Project created: ${lesson.title} (${rubricCriteria.reduce((sum, c) => sum + c.marks, 0)} marks)`);
                    }
                }
            }

            // Create capstone project for the React course
            if (courseData.category === 'Frontend Development' && courseData.title.includes('React')) {
                const capstoneProject = new Project({
                    title: 'CAPSTONE: Build a Full E-commerce Platform with React',
                    description: `**FINAL CAPSTONE PROJECT - COMPREHENSIVE ASSESSMENT**\n\n
Build a complete e-commerce web application with the following requirements:

**Core Features:**
1. User authentication (login/register)
2. Product catalog with categories and search
3. Shopping cart functionality
4. Checkout process
5. Order history
6. Admin dashboard for product management

**Technical Requirements:**
- React with functional components and hooks
- State management with Context API or Redux
- React Router for navigation
- Tailwind CSS for styling
- Responsive design (mobile-first)
- PWA capabilities (manifest, service worker)
- API integration with Node.js backend
- Deployment to Vercel/Netlify with custom domain

**Submission Requirements:**
- GitHub repository with complete source code
- Live deployment URL
- Project documentation (README)
- Demo video (5-10 minutes)

**Assessment Criteria (Total: 100 marks):**
- React Components & Architecture: 25 marks
- State Management: 20 marks
- UI/UX & Responsive Design: 20 marks
- API Integration: 15 marks
- PWA & Performance: 10 marks
- Deployment & Documentation: 10 marks

**Deadline:** 4 weeks from start date`,
                    course: course._id,
                    type: 'Individual',
                    status: 'pending_review',
                    userId: trainer._id,
                    mentors: [trainer._id],
                    documentation: {
                        links: [
                            { title: 'Project Requirements', url: '#' },
                            { title: 'Assessment Rubric', url: '#' },
                            { title: 'Sample E-commerce Apps', url: '#' },
                            { title: 'Deployment Guide', url: '#' }
                        ]
                    },
                    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Start in 30 days
                    endDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000), // Due in 58 days (4 weeks after start)
                    skills: [
                        'React', 'Hooks', 'Context API', 'React Router',
                        'Tailwind CSS', 'PWA', 'REST API', 'Authentication',
                        'Deployment', 'Responsive Design'
                    ],
                    assessmentRubric: {
                        criteria: [
                            { title: 'React Components Structure', marks: 10, achieved: false },
                            { title: 'Custom Hooks Implementation', marks: 8, achieved: false },
                            { title: 'Props and State Management', marks: 7, achieved: false },
                            { title: 'Context API/Redux Setup', marks: 10, achieved: false },
                            { title: 'State Updates and Side Effects', marks: 10, achieved: false },
                            { title: 'Responsive Layout (Mobile/Tablet/Desktop)', marks: 10, achieved: false },
                            { title: 'Tailwind CSS Styling', marks: 5, achieved: false },
                            { title: 'UI/UX Design Quality', marks: 5, achieved: false },
                            { title: 'API Integration with Axios', marks: 8, achieved: false },
                            { title: 'Loading and Error States', marks: 7, achieved: false },
                            { title: 'PWA Manifest Configuration', marks: 5, achieved: false },
                            { title: 'Service Worker for Offline Support', marks: 5, achieved: false },
                            { title: 'Production Build Optimization', marks: 3, achieved: false },
                            { title: 'Deployment to Vercel/Netlify', marks: 4, achieved: false },
                            { title: 'Custom Domain Configuration', marks: 3, achieved: false }
                        ]
                    }
                });

                await capstoneProject.save();
                allProjects.push(capstoneProject);
                console.log(`\n🎯 CAPSTONE PROJECT CREATED: Full E-commerce Platform`);
                console.log(`   ├─ Total Marks: 100`);
                console.log(`   ├─ Timeline: 4 weeks`);
                console.log(`   └─ Skills: React, State Management, PWA, Deployment\n`);
            }

            // Create capstone for Node.js course
            if (courseData.category === 'Backend Development' && courseData.title.includes('Node.js')) {
                const capstoneProject = new Project({
                    title: 'CAPSTONE: Complete E-commerce Backend API',
                    description: `**FINAL CAPSTONE PROJECT - COMPREHENSIVE ASSESSMENT**\n\n
Build a complete e-commerce backend API with the following requirements:

**Core Features:**
1. User authentication and authorization (JWT)
2. Product management (CRUD, categories, search)
3. Shopping cart management
4. Order processing
5. Payment integration (Stripe/PayPal)
6. Email notifications
7. Admin dashboard endpoints
8. Analytics and reporting

**Technical Requirements:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication with refresh tokens
- Role-based access control (admin, customer)
- Input validation with Joi
- API documentation with Swagger/OpenAPI
- Error handling and logging
- Rate limiting and security headers
- Unit and integration tests
- Docker containerization
- CI/CD pipeline
- Production deployment

**Submission Requirements:**
- GitHub repository with complete source code
- Live API endpoint URL
- Postman collection/OpenAPI specification
- Deployment documentation
- Performance test results

**Assessment Criteria (Total: 100 marks):**
- API Design & Architecture: 20 marks
- Authentication & Authorization: 15 marks
- Database Design & Operations: 15 marks
- Security Implementation: 15 marks
- Testing & Quality: 15 marks
- Deployment & DevOps: 10 marks
- Documentation: 10 marks

**Deadline:** 4 weeks from start date`,
                    course: course._id,
                    type: 'Individual',
                    status: 'pending_review',
                    userId: trainer._id,
                    mentors: [trainer._id],
                    documentation: {
                        links: [
                            { title: 'API Requirements Specification', url: '#' },
                            { title: 'Database Schema Design', url: '#' },
                            { title: 'Security Checklist', url: '#' },
                            { title: 'Deployment Guide', url: '#' }
                        ]
                    },
                    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000),
                    skills: [
                        'Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT',
                        'RBAC', 'Input Validation', 'API Security', 'Testing',
                        'Docker', 'CI/CD', 'Cloud Deployment'
                    ],
                    assessmentRubric: {
                        criteria: [
                            { title: 'RESTful Endpoint Design', marks: 10, achieved: false },
                            { title: 'Middleware Implementation', marks: 5, achieved: false },
                            { title: 'Error Handling Pattern', marks: 5, achieved: false },
                            { title: 'JWT Authentication Flow', marks: 8, achieved: false },
                            { title: 'Refresh Token Mechanism', marks: 4, achieved: false },
                            { title: 'Role-Based Authorization', marks: 3, achieved: false },
                            { title: 'Mongoose Schema Design', marks: 5, achieved: false },
                            { title: 'CRUD Operations', marks: 5, achieved: false },
                            { title: 'Aggregation Pipelines', marks: 5, achieved: false },
                            { title: 'Input Validation (Joi)', marks: 5, achieved: false },
                            { title: 'Security Headers (Helmet)', marks: 3, achieved: false },
                            { title: 'Rate Limiting', marks: 3, achieved: false },
                            { title: 'NoSQL Injection Prevention', marks: 4, achieved: false },
                            { title: 'Unit Tests (Jest)', marks: 5, achieved: false },
                            { title: 'Integration Tests', marks: 5, achieved: false },
                            { title: 'API Tests (Supertest)', marks: 5, achieved: false },
                            { title: 'Docker Configuration', marks: 4, achieved: false },
                            { title: 'CI/CD Pipeline', marks: 3, achieved: false },
                            { title: 'Production Deployment', marks: 3, achieved: false },
                            { title: 'API Documentation', marks: 5, achieved: false },
                            { title: 'Postman Collection', marks: 5, achieved: false }
                        ]
                    }
                });

                await capstoneProject.save();
                allProjects.push(capstoneProject);
                console.log(`\n🎯 CAPSTONE PROJECT CREATED: Complete E-commerce Backend API`);
                console.log(`   ├─ Total Marks: 100`);
                console.log(`   ├─ Timeline: 4 weeks`);
                console.log(`   └─ Skills: Node.js, Express, MongoDB, Security, DevOps\n`);
            }

            // Assign projects to students
            console.log(`   📋 Assigning projects to students...`);

            // Filter lesson projects (exclude capstone)
            const lessonProjects = allProjects.filter(p =>
                !p.get('title')?.toString().includes('CAPSTONE') &&
                p.get('course').toString() === course._id.toString()
            );

            for (const student of students) {
                // Enroll student in the course
                if (!student.enrolledCourses) student.enrolledCourses = [];
                if (!student.enrolledCourses.includes(course._id)) {
                    student.enrolledCourses.push(course._id);
                    await student.save();
                }

                // Assign 3 random lesson projects to each student
                const shuffled = [...lessonProjects].sort(() => 0.5 - Math.random());
                const assigned = shuffled.slice(0, Math.min(3, lessonProjects.length));

                for (const project of assigned) {
                    const studentProject = new Project({
                        title: `${project.get('title')} - ${student.fullName}`,
                        description: project.get('description'),
                        course: course._id,
                        type: 'Individual',
                        status: 'in_progress',
                        userId: student._id,
                        mentors: [trainer._id],
                        documentation: project.get('documentation'),
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        skills: project.get('skills'),
                        parentProject: project._id,
                        assessmentRubric: project.get('assessmentRubric')
                    });

                    await studentProject.save();
                }

                // Assign capstone project to each student
                const capstone = allProjects.find(p =>
                    p.get('title')?.toString().includes('CAPSTONE') &&
                    p.get('course').toString() === course._id.toString()
                );

                if (capstone) {
                    const studentCapstone = new Project({
                        title: `${capstone.get('title')} - ${student.fullName}`,
                        description: capstone.get('description'),
                        course: course._id,
                        type: 'Individual',
                        status: 'pending_review',
                        userId: student._id,
                        mentors: [trainer._id],
                        documentation: capstone.get('documentation'),
                        startDate: capstone.get('startDate'),
                        endDate: capstone.get('endDate'),
                        skills: capstone.get('skills'),
                        parentProject: capstone._id,
                        assessmentRubric: capstone.get('assessmentRubric')
                    });

                    await studentCapstone.save();
                }
            }

            console.log(`   └─ Projects assigned to ${students.length} students\n`);
        }

        // ===================================================================
        // SEEDING SUMMARY
        // ===================================================================
        console.log('\n' + '='.repeat(80));
        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY');
        console.log('='.repeat(80));
        console.log(`
📊 SEEDING SUMMARY:
────────────────────────────────────────────────
Courses Created        : ${preparedCoursesData.length}
Modules Created        : ${preparedCoursesData.reduce((acc, c) => acc + c.modules.length, 0)}
Lessons Created        : ${preparedCoursesData.reduce((acc, c) =>
            acc + c.modules.reduce((acc2, m) => acc2 + m.lessons.length, 0), 0)}
Assignments Created    : ${preparedCoursesData.reduce((acc, c) =>
                acc + c.modules.reduce((acc2, m) =>
                    acc2 + m.lessons.filter(l => l.isAssignment).length, 0), 0)}
Projects Created       : ${allProjects.length}
Trainers               : 1
Students Enrolled      : ${students.length}
Capstone Projects      : ${students.length * preparedCoursesData.length}

🔐 ACCESS CREDENTIALS:
────────────────────────────────────────────────
Trainer:
  Email: manzi.alain@codemande.com
  Password: Trainer@2024

Student (sample):
  Email: alex.johnson@example.com
  Password: Student@2024

🌐 DEPLOYMENT PLATFORMS:
────────────────────────────────────────────────
Frontend (Vercel):    https://vercel.com
Backend (Render):     https://render.com
Database (Atlas):     https://cloud.mongodb.com
Repository (GitHub):  https://github.com

📚 RECOMMENDED LEARNING RESOURCES:
────────────────────────────────────────────────
1. React Documentation - https://react.dev
2. Node.js Documentation - https://nodejs.org
3. Express.js Guide - https://expressjs.com
4. MongoDB University - https://university.mongodb.com
5. Tailwind CSS - https://tailwindcss.com
6. TypeScript Handbook - https://www.typescriptlang.org
7. Jest Testing - https://jestjs.io
8. Docker Documentation - https://docs.docker.com
9. GitHub Actions - https://docs.github.com/actions
10. OWASP Security - https://owasp.org

✅ Your learning platform is now ready!
`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ SEEDING ERROR:', error);
        process.exit(1);
    }
};

// Execute the seed function
seedCourses();
