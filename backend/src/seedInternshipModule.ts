import mongoose from 'mongoose';
import connectDB from './config/db';
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
import { InternshipComment } from './models/internship/Comment';
import { InternshipMeeting } from './models/internship/InternshipMeeting';
import { InternshipSubmission } from './models/internship/Submission';
import { InternshipPayment } from './models/internship/Payment';
import { InternshipCertificate } from './models/internship/Certificate';

// ──────────────────────────────────────────────
// Default Kanban-style workflow for projects
// ──────────────────────────────────────────────
const DEFAULT_WORKFLOW = [
  { id: 'todo', label: 'To Do', color: 'slate', order: 0, type: 'todo' as const },
  { id: 'in_progress', label: 'In Progress', color: 'blue', order: 1, type: 'progress' as const },
  { id: 'in_testing', label: 'In Testing', color: 'orange', order: 2, type: 'testing' as const },
  { id: 'in_review', label: 'In Review', color: 'purple', order: 3, type: 'review' as const },
  { id: 'done', label: 'Done', color: 'yellow', order: 4, type: 'done' as const },
  { id: 'staged', label: 'Staged', color: 'cyan', order: 5, type: 'staged' as const },
  { id: 'completed', label: 'Completed', color: 'green', order: 6, type: 'completed' as const },
];

// ──────────────────────────────────────────────
// Rich project documentation templates
// ──────────────────────────────────────────────
const PROJECT_DOCS = {
  ecommerce: `# Eco-Friendly E-commerce Mobile App
## Unified Vision & Implementation Specification

### 1. Executive Summary
In an era where consumer choices significantly impact global climate trends, the **Eco-Friendly E-commerce Mobile App** serves as a bridge between sustainable production and conscious consumption. Our mission is to democratize access to green products while providing transparent, data-driven insights into the environmental footprint of every purchase.

### 2. Technical Architecture
- **Frontend**: React Native with NativeWind (Tailwind CSS)
- **Backend**: Apollo GraphQL gateway with microservices
- **Auth**: Firebase-backed secure authentication with role-based access
- **Database**: MongoDB with elastic indexing
- **Real-time**: Pusher integration for live order tracking

### 3. Key Features
- Verified Eco-Badges for vendors
- Carbon footprint calculation engine
- Gamified sustainability rewards (Leaf Points)
- Circular Economy "Re-Life" peer-to-peer resale hub

### 4. Implementation Roadmap
- **Phase 1**: Foundation & auth (Weeks 1-2)
- **Phase 2**: Core marketplace (Weeks 3-5)
- **Phase 3**: Social & rewards (Weeks 6-8)
- **Phase 4**: Circular economy & polish (Weeks 9-11)
- **Phase 5**: Launch (Week 12)
`,
  lms: `# AI-Powered Learning Management System
## Platform Vision

### 1. Executive Summary
An intelligent LMS that adapts to each learner's pace and style using AI. The platform provides personalized learning paths, real-time progress tracking, and automated assessment grading.

### 2. Technical Architecture
- **Frontend**: React + TypeScript with Tailwind CSS
- **Backend**: Node.js + GraphQL (Apollo)
- **AI Engine**: Python microservice with HuggingFace models
- **Database**: MongoDB for content, PostgreSQL for analytics
- **Storage**: Cloudinary for media assets

### 3. Key Features
- AI-powered personalized learning paths
- Automated quiz generation and grading
- Real-time collaboration tools
- Progress analytics dashboard
- Certificate generation on completion
`,
  health: `# Community Health Record System
## Platform Vision

### 1. Executive Summary
A decentralized health record management system for community clinics. Enables secure patient data sharing, appointment scheduling, and epidemic tracking across facilities.

### 2. Technical Architecture
- **Frontend**: React with Tailwind CSS (responsive web)
- **Backend**: Node.js + GraphQL
- **Security**: End-to-end encryption, HIPAA compliance
- **Database**: MongoDB (patient records), Redis (caching)

### 3. Key Features
- Patient registration and medical history
- Appointment scheduling and reminders
- Laboratory results integration
- Epidemic outbreak dashboard
- Role-based access (doctors, nurses, admins)

### 4. Implementation Roadmap
- **Sprint 1**: Patient management module
- **Sprint 2**: Appointment & scheduling system
- **Sprint 3**: Lab results & reporting
- **Sprint 4**: Analytics & deployment
`,
};

// ──────────────────────────────────────────────
// Default tickets / tasks to auto-generate per project
// ──────────────────────────────────────────────
const DEFAULT_TICKETS = [
  { title: 'Set up project repository and CI/CD pipeline', description: 'Initialize git repo, configure GitHub Actions, set up staging environment.', priority: 'high' as const, taskType: 'task' as const, labels: ['devops', 'setup'], suggestedRole: 'Backend', order: 0 },
  { title: 'Design and implement database schema', description: 'Create MongoDB models, define indexes, set up relationships.', priority: 'high' as const, taskType: 'feature' as const, labels: ['backend', 'database'], suggestedRole: 'Backend', order: 1 },
  { title: 'Build authentication and authorization system', description: 'Implement login, registration, role-based access control, JWT handling.', priority: 'high' as const, taskType: 'feature' as const, labels: ['backend', 'security'], suggestedRole: 'Backend', order: 2 },
  { title: 'Create responsive UI component library', description: 'Build reusable components with Tailwind CSS: buttons, cards, modals, forms, tables.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['frontend', 'ui'], suggestedRole: 'Frontend', order: 3 },
  { title: 'Implement main dashboard views', description: 'Build the primary dashboard pages with data visualization and charts.', priority: 'high' as const, taskType: 'feature' as const, labels: ['frontend'], suggestedRole: 'Frontend', order: 4 },
  { title: 'Write API integration tests', description: 'Create comprehensive test suite for all API endpoints.', priority: 'medium' as const, taskType: 'task' as const, labels: ['testing', 'backend'], suggestedRole: 'Backend', order: 5 },
  { title: 'Set up deployment pipeline', description: 'Configure Docker, deploy to staging, set up monitoring.', priority: 'high' as const, taskType: 'task' as const, labels: ['devops'], suggestedRole: 'Backend', order: 6 },
  { title: 'Implement real-time notifications', description: 'Add WebSocket/Pusher integration for real-time updates.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['backend', 'realtime'], suggestedRole: 'Backend', order: 7 },
  { title: 'Create onboarding tour and documentation', description: 'Build interactive tutorial for first-time users and write API docs.', priority: 'low' as const, taskType: 'task' as const, labels: ['frontend', 'docs'], suggestedRole: 'Frontend', order: 8 },
  { title: 'Performance optimization and accessibility audit', description: 'Run Lighthouse audit, fix a11y issues, optimize bundle size and load times.', priority: 'medium' as const, taskType: 'improvement' as const, labels: ['frontend', 'performance'], suggestedRole: 'Frontend', order: 9 },
];

// ──────────────────────────────────────────────
// Rich task descriptions for sprints
// ──────────────────────────────────────────────
const SPRINT_TASK_THEMES = [
  "Configure project boilerplate and development environment",
  "Design system architecture and data flow diagrams",
  "Implement core data models and schemas",
  "Build RESTful/GraphQL API endpoints",
  "Create reusable UI components",
  "Integrate third-party APIs and services",
  "Write unit and integration tests",
  "Optimize database queries and performance",
  "Implement search and filtering functionality",
  "Add pagination and sorting to list views",
  "Build file upload and media management",
  "Implement caching layer for better performance",
  "Create email notification templates",
  "Build export functionality (PDF, CSV, Excel)",
  "Set up error tracking and logging",
  "Implement dark mode and theming",
  "Add keyboard shortcuts and accessibility",
  "Build reporting and analytics dashboard",
  "Create admin panel for content management",
  "Implement rate limiting and security measures",
  "Write API documentation and developer guide",
  "Set up automated backups and recovery",
  "Implement data validation and sanitization",
  "Build user profile and settings pages",
  "Add social sharing and collaboration features",
  "Implement soft delete and audit logging",
  "Create onboarding wizard for new users",
  "Build mobile-responsive layouts",
  "Set up A/B testing framework",
  "Prepare production deployment checklist",
];

// ──────────────────────────────────────────────
// Main seeder
// ──────────────────────────────────────────────
async function seedInternshipModule() {
  try {
    await connectDB();
    console.log('🌱 Starting Internship Module Seeder...\n');

    // ====== STEP 1: Clear existing data ======
    console.log('🧹 Clearing existing internship module data...');
    await InternshipCertificate.deleteMany({});
    await InternshipPayment.deleteMany({});
    await InternshipSubmission.deleteMany({});
    await InternshipMeeting.deleteMany({});
    await InternshipComment.deleteMany({});
    await InternshipActivityLog.deleteMany({});
    await InternshipTask.deleteMany({});
    await InternshipSprint.deleteMany({});
    await InternshipMilestone.deleteMany({});
    await InternshipTeamMember.deleteMany({});
    await InternshipTeam.deleteMany({});
    await InternshipApplication.deleteMany({});
    await InternshipProject.deleteMany({});
    await InternshipProgram.deleteMany({});
    console.log('✅ Cleared all internship module collections\n');

    // ====== STEP 2: Load existing users ======
    console.log('📦 Loading existing users from database...');

    const students = await User.find({ role: 'student' }).limit(14);
    const trainers = await User.find({ role: 'trainer' }).limit(3);
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).limit(4);

    if (students.length < 6) {
      console.warn('⚠️ Need at least 6 students for full internship module richness. Found:', students.length);
    }

    console.log(`   ✅ ${students.length} students loaded`);
    console.log(`   ✅ ${trainers.length} trainers loaded`);
    console.log(`   ✅ ${admins.length} admins loaded`);

    // Primary mentors
    const mentor1 = trainers.find(t => t.username === 'innovator_john') || trainers[0] || admins[0];
    const mentor2 = trainers.find(t => t.username === 'sarah_ai') || trainers[1] || admins[1] || mentor1;
    const adminUser = admins[0];

    if (!mentor1 || !mentor2) {
      throw new Error('Missing required mentors. Ensure trainer/admin users exist before running this seeder.');
    }
    if (!adminUser) {
      throw new Error('Missing required admin user. Ensure admin/super_admin users exist before running this seeder.');
    }

    // Named students for clarity (fallback to first two students if special ones are missing)
    const studentAlice = students.find(s => s.username === 'student_alice') || students[0];
    const studentBob = students.find(s => s.username === 'student_bob') || students[1];

    if (!studentAlice || !studentBob) {
      throw new Error(
        `Need at least 2 students to seed internship module. Found students=${students.length}`
      );
    }

    const remainingStudents = students.filter((s) => {
      return s._id.toString() !== studentAlice._id.toString() && s._id.toString() !== studentBob._id.toString();
    });

    // ====== STEP 3: Create Internship Programs ======
    console.log('\n🚀 Creating Internship Programs...');

    const programsData = [
      {
        title: 'Sustainable Tech Internship 2026',
        description: 'A 3-month intensive hands-on internship focusing on Eco-conscious Full-Stack Development. Students build real-world projects while learning modern tech stacks and sustainable development practices.',
        duration: '3 Months',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        applicationDeadline: new Date('2026-05-15'),
        eligibility: 'Enrolled in university\nBasic programming knowledge\nPassionate about sustainability',
        rules: 'Code with impact. Respect the environment. Collaborate and share knowledge.',
        price: 1000,
        currency: 'RWF',
        discount: 10,
        maxParticipants: 30,
        maxSpots: 20,
        status: 'active' as const,
        allowedDeliveryModes: ['online' as const, 'hybrid' as const],
        applicationQuestions: [
          { label: 'Why are you interested in sustainable tech?', type: 'textarea' as const, required: true },
          { label: 'Current programming experience level', type: 'select' as const, required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
          { label: 'Preferred tech stack', type: 'text' as const, required: false },
        ],
      },
      {
        title: 'Digital Health Innovation Program',
        description: 'A 4-month program where students design and build digital health solutions for community clinics. Focus on full-stack development with security and data privacy best practices.',
        duration: '4 Months',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-10-31'),
        applicationDeadline: new Date('2026-06-15'),
        eligibility: 'Completed at least one full-stack project\nInterest in health-tech\nTeam player',
        rules: 'Patient data privacy is paramount. Follow HIPAA guidelines. Document everything.',
        price: 1000,
        currency: 'RWF',
        discount: 0,
        maxParticipants: 20,
        maxSpots: 15,
        status: 'active' as const,
        allowedDeliveryModes: ['online' as const, 'physical' as const, 'hybrid' as const],
        applicationQuestions: [
          { label: 'Do you have experience with healthcare software?', type: 'radio' as const, required: true, options: ['Yes', 'No'] },
          { label: 'What security practices are you familiar with?', type: 'textarea' as const, required: true },
        ],
      },
      {
        title: 'AI & Machine Learning Bootcamp',
        description: 'An intensive 6-week program focused on AI/ML fundamentals, building and deploying models. Students work on real datasets and deploy production-ready ML APIs.',
        duration: '6 Weeks',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-09-15'),
        applicationDeadline: new Date('2026-07-15'),
        eligibility: 'Python proficiency\nBasic statistics knowledge\nEnrolled student or fresh graduate',
        rules: 'All code must be reproducible. Share datasets responsibly.',
        price: 1000,
        currency: 'RWF',
        discount: 15,
        maxParticipants: 25,
        maxSpots: 20,
        status: 'upcoming' as const,
        allowedDeliveryModes: ['online' as const],
        applicationQuestions: [
          { label: 'Rate your Python skills (1-10)', type: 'text' as const, required: true },
          { label: 'Do you have experience with ML frameworks?', type: 'checkbox' as const, required: true, options: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'None'] },
        ],
      },
    ];

    const programs: any[] = [];
    for (const pd of programsData) {
      const program = await InternshipProgram.create({
        ...pd,
        createdBy: adminUser._id,
        enablePhaseBasedApproval: false,
        batches: [
          { name: 'Cohort A', startDate: pd.startDate, endDate: pd.endDate },
        ],
      });
      programs.push(program);
      console.log(`   ✅ Created program: "${pd.title}" (${pd.status})`);
    }

    // ====== STEP 4: Create Internship Projects ======
    console.log('\n🏗️ Creating Internship Projects...');

    const projectsData = [
      {
        programIdx: 0,
        title: 'Eco-Friendly E-commerce Mobile App',
        description: 'Design and build a next-gen sustainable shopping platform with carbon footprint tracking, eco-badges, and a circular economy resale hub.',
        docKey: 'ecommerce' as keyof typeof PROJECT_DOCS,
        skills: ['React Native', 'GraphQL', 'Tailwind CSS', 'Mongoose', 'Stripe'],
        teamMin: 3,
        teamMax: 5,
      },
      {
        programIdx: 0,
        title: 'Smart Campus Energy Monitor',
        description: 'An IoT-integrated dashboard that tracks energy consumption across campus buildings, provides optimization suggestions, and visualizes sustainability metrics.',
        docKey: 'ecommerce' as keyof typeof PROJECT_DOCS,
        skills: ['React', 'Node.js', 'MongoDB', 'Chart.js', 'WebSocket'],
        teamMin: 2,
        teamMax: 4,
      },
      {
        programIdx: 1,
        title: 'Community Health Record System',
        description: 'A secure, decentralized health records system for community clinics with patient management, appointment scheduling, and epidemic tracking.',
        docKey: 'health' as keyof typeof PROJECT_DOCS,
        skills: ['React', 'Node.js', 'GraphQL', 'MongoDB', 'Security'],
        teamMin: 3,
        teamMax: 5,
      },
      {
        programIdx: 1,
        title: 'Telemedicine Consultation Platform',
        description: 'A video-enabled telemedicine platform connecting patients with doctors, featuring appointment booking, prescription management, and health tips.',
        docKey: 'health' as keyof typeof PROJECT_DOCS,
        skills: ['React', 'WebRTC', 'Node.js', 'PostgreSQL', 'Redis'],
        teamMin: 2,
        teamMax: 4,
      },
      {
        programIdx: 2,
        title: 'AI-Powered Learning Management System',
        description: 'An intelligent LMS that adapts to each learner using AI for personalized learning paths, automated quiz generation, and progress analytics.',
        docKey: 'lms' as keyof typeof PROJECT_DOCS,
        skills: ['React', 'Python', 'TensorFlow', 'GraphQL', 'MongoDB'],
        teamMin: 3,
        teamMax: 4,
      },
    ];

    const projects: any[] = [];
    for (const pd of projectsData) {
      const program = programs[pd.programIdx];
      const project = await InternshipProject.create({
        internshipProgramId: program._id,
        title: pd.title,
        description: pd.description,
        document: PROJECT_DOCS[pd.docKey],
        requiredSkills: pd.skills,
        teamSizeRange: { min: pd.teamMin, max: pd.teamMax },
        status: 'published',
        workflow: DEFAULT_WORKFLOW,
        objectives: [
          `Develop core ${pd.title.toLowerCase()} functionality`,
          'Implement user authentication and authorization',
          'Create responsive and accessible UI',
          'Set up CI/CD pipeline and deployment',
          'Write comprehensive documentation',
        ],
        defaultTickets: DEFAULT_TICKETS.map((t, i) => ({ ...t, order: i })),
      });
      projects.push(project);
      console.log(`   ✅ Project in "${program.title}": "${pd.title}"`);
    }

    // ====== STEP 5: Create Milestones for each project ======
    console.log('\n🏆 Creating milestones...');

    for (let pi = 0; pi < projects.length; pi++) {
      const project = projects[pi];
      const isEcommerce = pi === 0;
      const milestonesData = [
        { title: 'Conceptual Design & Research', desc: 'Foundational phase for market fit and requirements gathering.', days: 14 },
        { title: 'UI/UX Prototyping', desc: 'Visual language, wireframes, and user flow mapping.', days: 28 },
        { title: `${isEcommerce ? 'MVP Development' : 'Core Feature Implementation'} (Sprint 1-2)`, desc: 'Core engine and primary features build.', days: 56 },
        { title: 'Integration & Beta Testing', desc: 'Full feature sync, QA testing, and user feedback.', days: 70 },
        { title: 'Production Launch & Handover', desc: 'Automated deployment, documentation, and final presentation.', days: 90 },
      ];

      for (let mi = 0; mi < milestonesData.length; mi++) {
        const m = milestonesData[mi];
        // Program start date is the base
        const program = programs.find(p =>
          p._id.toString() === project.internshipProgramId.toString()
        );
        const baseDate = program?.startDate || new Date();
        const deadline = new Date(baseDate.getTime() + m.days * 24 * 60 * 60 * 1000);

        await InternshipMilestone.create({
          internshipProjectId: project._id,
          title: m.title,
          description: m.desc,
          deadline,
          order: mi,
          completed: mi <= 1,
          completedAt: mi <= 1 ? new Date() : undefined,
        });
      }
      console.log(`   ✅ ${milestonesData.length} milestones for "${project.title}"`);
    }

    // ====== STEP 6: Create Teams and assign members ======
    console.log('\n👥 Creating teams and assigning members...');

    const teamConfigs = [
      {
        projectIdx: 0,
        name: 'Eco-Architects',
        members: [
          { student: studentAlice, role: 'Team Lead' },
          { student: studentBob, role: 'Frontend Developer' },
          { student: remainingStudents[0], role: 'Backend Developer' },
          { student: remainingStudents[1], role: 'DevOps Engineer' },
        ],
      },
      {
        projectIdx: 1,
        name: 'Energy Optimizers',
        members: [
          { student: remainingStudents[2], role: 'Team Lead' },
          { student: remainingStudents[3], role: 'Developer' },
          { student: remainingStudents[4], role: 'Developer' },
        ],
      },
      {
        projectIdx: 2,
        name: 'Health Pioneers',
        members: [
          { student: remainingStudents[0], role: 'Team Lead' },
          { student: remainingStudents[5], role: 'Backend Developer' },
          { student: remainingStudents[6], role: 'Frontend Developer' },
          { student: remainingStudents[1], role: 'Security Specialist' },
        ],
      },
      {
        projectIdx: 3,
        name: 'TeleMed Squad',
        members: [
          { student: studentAlice, role: 'Team Lead' },
          { student: remainingStudents[7], role: 'Developer' },
          { student: remainingStudents[8], role: 'Developer' },
        ],
      },
      {
        projectIdx: 4,
        name: 'AI Learners',
        members: [
          { student: studentBob, role: 'Team Lead' },
          { student: remainingStudents[9], role: 'ML Engineer' },
          { student: remainingStudents[2], role: 'Backend Developer' },
        ],
      },
    ];

    const teams: any[] = [];
    for (const tc of teamConfigs) {
      const project = projects[tc.projectIdx];
      const program = await InternshipProgram.findById(project.internshipProgramId);

      // Alternate mentors between projects
      const teamMentor = tc.projectIdx % 2 === 0 ? mentor1 : mentor2;

      const team = await InternshipTeam.create({
        name: tc.name,
        internshipProjectId: project._id,
        internshipProgramId: program!._id,
        mentorId: teamMentor._id,
        status: 'active',
        type: 'team',
      });

      for (const member of tc.members) {
        await InternshipTeamMember.create({
          teamId: team._id,
          userId: member.student._id,
          role: member.role,
        });
      }

      teams.push(team);
      const memberNames = tc.members.map(m => m.student.fullName || m.student.username).join(', ');
      console.log(`   ✅ Team "${tc.name}" → ${memberNames} (mentor: ${teamMentor.fullName || teamMentor.username})`);
    }

    // ====== STEP 7: Create Sprints and Tasks ======
    console.log('\n📝 Creating sprints and tasks...');

    for (let ti = 0; ti < teams.length; ti++) {
      const project = projects[ti];
      const team = teams[ti];
      const teamConfig = teamConfigs[ti];
      const leadStudent = teamConfig.members[0].student;

      // Create 2 sprints per team
      const sprint1 = await InternshipSprint.create({
        projectId: project._id,
        teamId: team._id,
        title: 'Sprint 1: Foundation & Core Setup',
        goal: 'Project setup, database design, and core API implementation.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        order: 1,
      });

      const sprint2 = await InternshipSprint.create({
        projectId: project._id,
        teamId: team._id,
        title: 'Sprint 2: Feature Development',
        goal: 'Implement core features, UI components, and integrations.',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'planning',
        order: 2,
      });

      // Create 15 tasks for sprint 1 with varied statuses
      const startIdx = (ti * 5) % SPRINT_TASK_THEMES.length;
      for (let i = 0; i < 15; i++) {
        const themeIdx = (startIdx + i) % SPRINT_TASK_THEMES.length;
        const status: 'done' | 'in_progress' | 'todo' = i < 6 ? 'done' : (i < 11 ? 'in_progress' : 'todo');
        const priority = (['high', 'medium', 'low'] as const)[i % 3];

        // Assign to different team members
        const assignee = teamConfig.members[i % teamConfig.members.length].student;

        const task = await InternshipTask.create({
          projectId: project._id,
          teamId: team._id,
          sprintId: sprint1._id,
          title: SPRINT_TASK_THEMES[themeIdx],
          description: `Professional deliverable for ${project.title}: ${SPRINT_TASK_THEMES[themeIdx].toLowerCase()}.`,
          priority,
          status,
          taskType: i % 4 === 0 ? 'feature' : 'task',
          order: i,
          assigneeId: assignee._id,
          labels: ['sprint-1', project.title.toLowerCase().replace(/\s+/g, '-')],
        });

        // Log activity for completed tasks
        if (status === 'done') {
          await InternshipActivityLog.create({
            userId: assignee._id,
            action: 'COMPLETED',
            module: 'InternshipTask',
            targetType: 'InternshipTask',
            targetId: task._id,
            details: `Finished working on "${SPRINT_TASK_THEMES[themeIdx]}".`,
          });
        }

        // Add a comment on some tasks
        if (i % 3 === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: assignee._id,
            content: `I've started working on this. Initial research looks promising. Will update by EOD.`,
          });
        }

        // Approved task with feedback
        if (i === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: mentor1._id,
            content: `Great work on this! The implementation looks solid. Just a few minor suggestions on the code comments.`,
          });
          task.approvedBy = mentor1._id;
          task.approvedAt = new Date();
          await task.save();
        }

        // Some tasks have comments from mentor
        if (i === 3) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: mentor2._id,
            content: `Please review the error handling here. We need better edge case coverage.`,
          });
        }
      }

      // Create 8 tasks for sprint 2
      for (let i = 0; i < 8; i++) {
        const themeIdx = (startIdx + 15 + i) % SPRINT_TASK_THEMES.length;
        const assignee = teamConfig.members[i % teamConfig.members.length].student;

        await InternshipTask.create({
          projectId: project._id,
          teamId: team._id,
          sprintId: sprint2._id,
          title: SPRINT_TASK_THEMES[themeIdx],
          description: `Sprint 2 deliverable for ${project.title}: ${SPRINT_TASK_THEMES[themeIdx].toLowerCase()}.`,
          priority: 'medium' as const,
          status: 'todo',
          taskType: i % 3 === 0 ? 'feature' : 'task',
          order: i,
          assigneeId: assignee._id,
          labels: ['sprint-2'],
        });
      }

      console.log(`   ✅ ${teamConfig.name}: 2 sprints, 23 tasks created`);
    }

    // ====== STEP 8: Create Internship Applications ======
    console.log('\n📋 Creating internship applications...');

    const applicationConfigs = [
      { student: studentAlice, programIdx: 0, status: 'approved' as const, availability: 'Full-time' },
      { student: studentBob, programIdx: 0, status: 'approved' as const, availability: 'Full-time' },
      { student: remainingStudents[0], programIdx: 0, status: 'approved' as const, availability: 'Full-time' },
      { student: remainingStudents[1], programIdx: 0, status: 'approved' as const, availability: 'Part-time' },
      { student: remainingStudents[2], programIdx: 1, status: 'approved' as const, availability: 'Full-time' },
      { student: remainingStudents[3], programIdx: 1, status: 'pending' as const, availability: 'Full-time' },
      { student: remainingStudents[4], programIdx: 1, status: 'approved' as const, availability: 'Part-time' },
      { student: remainingStudents[5], programIdx: 2, status: 'approved' as const, availability: 'Full-time' },
      { student: remainingStudents[6], programIdx: 2, status: 'pending' as const, availability: 'Full-time' },
      { student: remainingStudents[7], programIdx: 2, status: 'approved' as const, availability: 'Part-time' },
    ];

    for (const ac of applicationConfigs) {
      const program = programs[ac.programIdx];
      const appQuestions = program.applicationQuestions || [];

      await InternshipApplication.create({
        internshipProgramId: program._id,
        userId: ac.student._id,
        status: ac.status,
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB'].slice(0, 2 + (ac.programIdx % 3)),
        portfolioUrl: `https://portfolio.${ac.student.username}.io`,
        availability: ac.availability,
        selectedDeliveryMode: program.allowedDeliveryModes[0],
        applicationAnswers: appQuestions.slice(0, 2).map((q: any) => ({
          questionLabel: q.label,
          answer: q.type === 'select'
            ? (q.options?.[1] || 'Intermediate')
            : `Excited to join the ${program.title} program! I have relevant experience.`,
        })),
      });

      // Create payment for approved applications
      if (ac.status === 'approved') {
        await InternshipPayment.create({
          userId: ac.student._id,
          internshipProgramId: program._id,
          amount: program.price - (program.price * (program.discount || 0) / 100),
          currency: program.currency,
          status: 'paid',
          paymentMethod: 'Mobile Money',
          paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        });
      }
    }

    console.log(`   ✅ ${applicationConfigs.length} applications created with matching payments`);

    // ====== STEP 9: Create Meetings ======
    console.log('\n📅 Creating meetings...');

    const meetingsData = [
      { title: 'Weekly Standup', type: 'WEEKLY' as const, day: 'Monday 10:00 AM', endDay: 'Monday 10:30 AM' },
      { title: 'Sprint Planning', type: 'WEEKLY' as const, day: 'Tuesday 11:00 AM', endDay: 'Tuesday 12:00 PM' },
      { title: 'Mentor Q&A Session', type: 'WEEKLY' as const, day: 'Thursday 2:00 PM', endDay: 'Thursday 3:00 PM' },
    ];

    for (const md of meetingsData) {
      const startHour = parseInt(md.day.split(' ')[1].split(':')[0]);
      const endHour = parseInt(md.endDay.split(' ')[1].split(':')[0]);

      await (InternshipMeeting as any).create({
        title: md.title,
        description: `Regular ${md.title.toLowerCase()} for all internship teams`,
        type: md.type,
        deliveryMode: 'online',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        startTime: new Date(new Date().setHours(startHour, 0, 0, 0)),
        endTime: new Date(new Date().setHours(endHour, 0, 0, 0)),
        teamIds: teams.map(t => t._id),
        userIds: [],
        mentorIds: [mentor1._id, mentor2._id],
        hostId: mentor1._id,
        status: 'confirmed',
        recurrenceDays: [1, 2, 4], // Mon, Tue, Thu
      });
    }

    console.log(`   ✅ ${meetingsData.length} recurring meetings created`);

    // ====== STEP 10: Create Submissions for completed milestones ======
    console.log('\n📤 Creating milestone submissions...');

    const milestones = await InternshipMilestone.find({ completed: true });
    for (let i = 0; i < Math.min(milestones.length, 3); i++) {
      const milestone = milestones[i];
      const project = projects.find(p => p._id.toString() === milestone.internshipProjectId.toString());
      const team = teams.find(t => t.internshipProjectId.toString() === milestone.internshipProjectId.toString());

      if (project && team) {
        const teamMembers = await InternshipTeamMember.find({ teamId: team._id });

        await InternshipSubmission.create({
          milestoneId: milestone._id,
          teamId: team._id,
          userId: teamMembers[0]?.userId || studentAlice._id,
          contentUrl: `https://drive.google.com/${project.title.toLowerCase().replace(/\s+/g, '-')}-milestone-${milestone.order}`,
          description: `Completed ${milestone.title} deliverable for ${project.title}. Includes documentation and code artifacts.`,
          status: 'approved',
          feedback: 'Excellent work! The deliverables exceed our expectations. Keep it up!',
        });

        // Log the submission
        await InternshipActivityLog.create({
          userId: teamMembers[0]?.userId || studentAlice._id,
          action: 'SUBMITTED',
          module: 'InternshipMilestone',
          targetType: 'InternshipSubmission',
          targetId: milestone._id,
          details: `Submitted deliverable for "${milestone.title}"`,
        });
      }
    }
    console.log(`   ✅ ${Math.min(milestones.length, 3)} milestone submissions approved`);

    // ====== STEP 11: Create Certificates for completed projects ======
    console.log('\n🎓 Creating certificates...');

    // Find teams that have made submissions (completed milestones)
    const completedTeams = teams.slice(0, 2);
    for (const team of completedTeams) {
      const project = projects.find(p => p._id.toString() === team.internshipProjectId.toString());
      const teamDoc = await InternshipTeam.findById(team._id);
      const program = programs.find(p => p._id.toString() === teamDoc?.internshipProgramId.toString());
      if (!project || !program) continue;

      const teamMembers = await InternshipTeamMember.find({ teamId: team._id });

      for (const member of teamMembers) {
        const student = await User.findById(member.userId);
        if (!student) continue;

        await InternshipCertificate.create({
          userId: member.userId,
          internshipProgramId: program._id,
          teamId: team._id,
          issuedAt: new Date(),
          trainerId: mentor1._id,
          trainerName: mentor1.fullName || mentor1.username,
          trainerSignature: 'Electronically signed',
          internTitle: member.role,
          programTitle: program.title,
          duration: program.duration,
          startDate: program.startDate,
          endDate: program.endDate,
          completionDate: new Date(),
          isRevoked: false,
          metadata: {
            milestonesCompleted: 3,
            totalMilestones: 5,
            finalGrade: 'A',
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Teamwork'],
          },
        });

        await InternshipActivityLog.create({
          userId: member.userId,
          action: 'CERTIFICATE_ISSUED',
          module: 'InternshipCertificate',
          targetType: 'InternshipCertificate',
          details: `Certificate issued for "${program.title}" to ${student.fullName || student.username}`,
        });
      }
    }
    console.log(`   ✅ Certificates issued for ${completedTeams.length} teams`);

    // ====== STEP 12: Summary ======
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY - Internship Module');
    console.log('='.repeat(60));
    console.log(`   🏫 Programs:              ${programs.length}`);
    console.log(`   📦 Projects:              ${projects.length}`);
    console.log(`   👥 Teams:                 ${teams.length}`);
    console.log(`   👤 Team Members:          ${await InternshipTeamMember.countDocuments()}`);
    console.log(`   🏆 Milestones:            ${await InternshipMilestone.countDocuments()}`);
    console.log(`   📝 Sprints:               ${await InternshipSprint.countDocuments()}`);
    console.log(`   📋 Tasks:                 ${await InternshipTask.countDocuments()}`);
    console.log(`   💬 Comments:              ${await InternshipComment.countDocuments()}`);
    console.log(`   📋 Applications:          ${await InternshipApplication.countDocuments()}`);
    console.log(`   💳 Payments:              ${await InternshipPayment.countDocuments()}`);
    console.log(`   📅 Meetings:              ${await InternshipMeeting.countDocuments()}`);
    console.log(`   📤 Submissions:           ${await InternshipSubmission.countDocuments()}`);
    console.log(`   🎓 Certificates:          ${await InternshipCertificate.countDocuments()}`);
    console.log(`   📜 Activity Logs:         ${await InternshipActivityLog.countDocuments()}`);
    console.log('='.repeat(60));
    console.log('\n🚀 Internship module seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedInternshipModule();
