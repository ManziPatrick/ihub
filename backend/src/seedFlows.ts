import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';
import { User } from './models/User';
import { ProjectApplication } from './models/ProjectApplication';
import { ProjectNDA } from './models/ProjectNDA';
import { ProjectOnboarding } from './models/ProjectOnboarding';
import { Project } from './models/Project';
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
import { InternshipInvoice } from './models/internship/Invoice';
import { InternshipTimeLog } from './models/internship/TimeLog';
import { InternshipMentorFeedback } from './models/internship/MentorFeedback';
import { Booking } from './models/Booking';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const ADMIN_ID = '69ec7f859567cd270a48cf49';

const DEFAULT_WORKFLOW = [
  { id: 'todo', label: 'To Do', color: 'slate', order: 0, type: 'todo' as const },
  { id: 'in_progress', label: 'In Progress', color: 'blue', order: 1, type: 'progress' as const },
  { id: 'in_testing', label: 'In Testing', color: 'orange', order: 2, type: 'testing' as const },
  { id: 'in_review', label: 'In Review', color: 'purple', order: 3, type: 'review' as const },
  { id: 'done', label: 'Done', color: 'yellow', order: 4, type: 'done' as const },
  { id: 'staged', label: 'Staged', color: 'cyan', order: 5, type: 'staged' as const },
  { id: 'completed', label: 'Completed', color: 'green', order: 6, type: 'completed' as const },
];

const PROJECT_DOCS = {
  ecommerce: `# Eco-Friendly E-commerce Mobile App\n\n**Executive Summary:** A sustainable shopping platform bridging conscious consumers with eco-friendly vendors.\n\n**Tech Stack:** React Native, Apollo GraphQL, MongoDB, Firebase Auth, Stripe, Pusher\n\n**Key Features:**\n- Verified Eco-Badges for vendors\n- Carbon footprint calculation engine\n- Gamified Leaf Points rewards\n- Circular Economy peer-to-peer resale hub\n\n**Roadmap:**\n1. Foundation & Auth (Weeks 1-2)\n2. Core Marketplace (Weeks 3-5)\n3. Social & Rewards (Weeks 6-8)\n4. Circular Economy (Weeks 9-11)\n5. Launch (Week 12)`,
  lms: `# AI-Powered Learning Management System\n\n**Executive Summary:** An intelligent LMS that adapts to each learner's pace using AI.\n\n**Tech Stack:** React, TypeScript, Node.js, GraphQL, MongoDB, Python (AI), Cloudinary\n\n**Key Features:**\n- AI-powered personalized learning paths\n- Automated quiz generation and grading\n- Real-time collaboration tools\n- Progress analytics dashboard\n- Certificate generation on completion`,
  health: `# Community Health Record System\n\n**Executive Summary:** A decentralized health records system for community clinics.\n\n**Tech Stack:** React, Node.js, GraphQL, MongoDB, Redis, WebRTC\n\n**Key Features:**\n- Patient registration and medical history\n- Appointment scheduling\n- Lab results integration\n- Epidemic outbreak dashboard\n- Role-based access control`,
};

const DEFAULT_TICKETS = [
  { title: 'Set up project repository and CI/CD pipeline', description: 'Initialize git repo, configure GitHub Actions, set up staging.', priority: 'high' as const, taskType: 'task' as const, labels: ['devops', 'setup'], suggestedRole: 'Backend', order: 0 },
  { title: 'Design and implement database schema', description: 'Create MongoDB models, define indexes, set up relationships.', priority: 'high' as const, taskType: 'feature' as const, labels: ['backend', 'database'], suggestedRole: 'Backend', order: 1 },
  { title: 'Build authentication and authorization system', description: 'Implement login, registration, role-based access, JWT.', priority: 'high' as const, taskType: 'feature' as const, labels: ['backend', 'security'], suggestedRole: 'Backend', order: 2 },
  { title: 'Create responsive UI component library', description: 'Build reusable components: buttons, cards, modals, forms, tables.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['frontend', 'ui'], suggestedRole: 'Frontend', order: 3 },
  { title: 'Implement main dashboard views', description: 'Build primary dashboard pages with data visualization.', priority: 'high' as const, taskType: 'feature' as const, labels: ['frontend'], suggestedRole: 'Frontend', order: 4 },
  { title: 'Write API integration tests', description: 'Create comprehensive test suite for all API endpoints.', priority: 'medium' as const, taskType: 'task' as const, labels: ['testing', 'backend'], suggestedRole: 'Backend', order: 5 },
  { title: 'Set up deployment pipeline', description: 'Configure Docker, deploy to staging, set up monitoring.', priority: 'high' as const, taskType: 'task' as const, labels: ['devops'], suggestedRole: 'Backend', order: 6 },
  { title: 'Implement real-time notifications', description: 'Add WebSocket/Pusher integration for real-time updates.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['backend', 'realtime'], suggestedRole: 'Backend', order: 7 },
  { title: 'Create onboarding tour and documentation', description: 'Build interactive tutorial for first-time users and write API docs.', priority: 'low' as const, taskType: 'task' as const, labels: ['frontend', 'docs'], suggestedRole: 'Frontend', order: 8 },
  { title: 'Performance optimization and accessibility audit', description: 'Run Lighthouse audit, fix a11y issues, optimize bundle size.', priority: 'medium' as const, taskType: 'improvement' as const, labels: ['frontend', 'performance'], suggestedRole: 'Frontend', order: 9 },
];

const SPRINT_TASK_THEMES = [
  "Configure project boilerplate and development environment",
  "Design system architecture and data flow diagrams",
  "Implement core data models and schemas",
  "Build GraphQL API endpoints",
  "Create reusable UI components",
  "Integrate third-party APIs and services",
  "Write unit and integration tests",
  "Optimize database queries and performance",
  "Implement search and filtering functionality",
  "Add pagination and sorting to list views",
  "Build file upload and media management",
  "Implement caching layer for better performance",
  "Create email notification templates",
  "Build export functionality (PDF, CSV)",
  "Set up error tracking and logging",
  "Implement dark mode and theming",
  "Add keyboard shortcuts and accessibility",
  "Build reporting and analytics dashboard",
  "Create admin panel for content management",
  "Implement rate limiting and security measures",
];

// ──────────────────────────────────────────────
// Hash helpers
// ──────────────────────────────────────────────
function fakeSignatureHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// ──────────────────────────────────────────────
// Main seeder
// ──────────────────────────────────────────────
async function seedFlows() {
  try {
    await connectDB();
    console.log('🌱 Starting Unified Flow Seeder...\n');

    // ====== STEP 0: Load admin user ======
    console.log('👤 Loading admin user...');
    const admin = await User.findById(ADMIN_ID);
    if (!admin) {
      console.error(`❌ Admin user with ID ${ADMIN_ID} not found!`);
      console.error('   Please ensure this admin exists in the database first.');
      process.exit(1);
    }
    console.log(`   ✅ Found admin: ${admin.fullName || admin.username} (${admin._id})`);

    // ====== STEP 1: Create / ensure trainer users ======
    console.log('\n👨‍🏫 Creating / ensuring trainer users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const trainerData = [
      { username: 'innovator_john', email: 'john@innovator.tech', fullName: 'John Innovation' },
      { username: 'sarah_ai', email: 'sarah@ai-mentor.rw', fullName: 'Sarah Uwimana' },
      { username: 'paul_mentor', email: 'paul@mentorhub.rw', fullName: 'Paul Mugabo' },
    ];

    const trainers: any[] = [];
    for (const td of trainerData) {
      const trainer = await User.findOneAndUpdate(
        { username: td.username },
        {
          username: td.username,
          email: td.email,
          password: hashedPassword,
          role: 'trainer',
          fullName: td.fullName,
          status: 'active',
          isEmailVerified: true,
        },
        { upsert: true, new: true }
      );
      trainers.push(trainer);
      console.log(`   ✅ Trainer: ${td.fullName} (@${td.username})`);
    }
    const [trainer1, trainer2, trainer3] = trainers;

    // ====== STEP 2: Ensure student users ======
    console.log('\n🎓 Ensuring student users...');
    const studentData = [
      { username: 'student_alice', email: 'alice@bootskills.com', fullName: 'Alice Peterson' },
      { username: 'student_bob', email: 'bob@bootskills.com', fullName: 'Bob Builder' },
      { username: 'alex.johnson', email: 'alex@bootskills.com', fullName: 'Alex Johnson' },
      { username: 'sarah.connor', email: 'sarah.c@bootskills.com', fullName: 'Sarah Connor' },
      { username: 'kevin.hart', email: 'kevin@bootskills.com', fullName: 'Kevin Hart' },
      { username: 'lisa.ray', email: 'lisa@bootskills.com', fullName: 'Lisa Ray' },
      { username: 'mike.dean', email: 'mike@bootskills.com', fullName: 'Mike Dean' },
      { username: 'nancy.smith', email: 'nancy@bootskills.com', fullName: 'Nancy Smith' },
      { username: 'oscar.park', email: 'oscar@bootskills.com', fullName: 'Oscar Park' },
      { username: 'pamela.jones', email: 'pam@bootskills.com', fullName: 'Pamela Jones' },
    ];

    const students: any[] = [];
    for (const sd of studentData) {
      const student = await User.findOneAndUpdate(
        { username: sd.username },
        {
          username: sd.username,
          email: sd.email,
          password: hashedPassword,
          role: 'student',
          fullName: sd.fullName,
          status: 'active',
          isEmailVerified: true,
        },
        { upsert: true, new: true }
      );
      students.push(student);
    }
    console.log(`   ✅ ${students.length} students ensured`);
    const [studentAlice, studentBob, ...remainingStudents] = students;

    // ====== STEP 3: Create client users ======
    console.log('\n👤 Creating client users...');
    const clientData = [
      { username: 'client_rwanda', fullName: 'Emmanuel Habimana', email: 'emmanuel@greentech.rw', company: 'GreenTech Rwanda Ltd' },
      { username: 'client_shine', fullName: 'Jeanne Uwimana', email: 'jeanne@shine.rw', company: 'Shine Academy' },
      { username: 'client_afriq', fullName: 'Patrick Mugisha', email: 'patrick@afriqinnovate.rw', company: 'AfriqInnovate' },
    ];

    // Remove old clients first to avoid conflicts
    await User.deleteMany({ role: 'client' });

    const clients: any[] = [];
    for (const cd of clientData) {
      const client = await User.create({
        ...cd,
        password: hashedPassword,
        role: 'client',
        phone: '+25078' + Math.floor(1000000 + Math.random() * 9000000),
        location: 'Kigali, Rwanda',
        bio: `Founder at ${cd.company}`,
        status: 'active',
        isEmailVerified: true,
      });
      clients.push(client);
      console.log(`   ✅ Client: ${cd.fullName} (@${cd.username}) — ${cd.company}`);
    }

    // ====== STEP 4: Seed Project Lifecycle Flow ======
    console.log('\n' + '='.repeat(60));
    console.log('📋 PROJECT LIFECYCLE FLOW');
    console.log('='.repeat(60));

    // Clear existing project lifecycle data
    console.log('\n🧹 Clearing existing project lifecycle data...');
    await ProjectApplication.deleteMany({});
    await ProjectNDA.deleteMany({});
    await ProjectOnboarding.deleteMany({});
    await Project.deleteMany({});
    console.log('   ✅ Cleared');

    // 4a. Submit Project Applications
    console.log('\n📝 Submitting project applications...');
    const projectProposals = [
      {
        clientIdx: 0,
        title: 'E-Learning Platform for Rural Schools',
        description: 'A mobile-first e-learning platform designed for rural schools with limited internet connectivity. Features offline content sync, interactive quizzes, and teacher dashboards.',
        documents: { overviewUrl: 'https://docs.google.com/rural-edu-overview', featuresUrl: 'https://docs.google.com/rural-edu-features', technicalUrl: 'https://docs.google.com/rural-edu-tech' },
      },
      {
        clientIdx: 1,
        title: 'Student Performance Analytics Dashboard',
        description: 'A comprehensive analytics dashboard for tracking student performance across multiple schools. Includes real-time charts, predictive insights, and automated report generation.',
        documents: { overviewUrl: 'https://docs.google.com/analytics-overview', featuresUrl: 'https://docs.google.com/analytics-features', technicalUrl: 'https://docs.google.com/analytics-tech' },
      },
      {
        clientIdx: 2,
        title: 'Community-Based Project Management System',
        description: 'A project management tool tailored for community development organizations. Supports milestone tracking, volunteer management, budget tracking, and impact reporting.',
        documents: { overviewUrl: 'https://docs.google.com/community-pms-overview', featuresUrl: 'https://docs.google.com/community-pms-features', technicalUrl: 'https://docs.google.com/community-pms-tech' },
      },
      {
        clientIdx: 0,
        title: 'Digital Marketplace for Local Artisans',
        description: 'An e-commerce platform connecting local artisans with global buyers. Features product catalogs, secure payments via mobile money, shipping logistics, and vendor analytics.',
        documents: { overviewUrl: 'https://docs.google.com/marketplace-overview', featuresUrl: 'https://docs.google.com/marketplace-features', technicalUrl: 'https://docs.google.com/marketplace-tech' },
      },
      {
        clientIdx: 1,
        title: 'Smart Campus IoT Management System',
        description: 'An IoT-enabled campus management system for monitoring energy usage, room occupancy, and security. Includes a web dashboard and mobile alerts for facility managers.',
        documents: { overviewUrl: 'https://docs.google.com/smart-campus-overview', featuresUrl: 'https://docs.google.com/smart-campus-features', technicalUrl: 'https://docs.google.com/smart-campus-tech' },
      },
    ];

    const applications: any[] = [];
    for (const pp of projectProposals) {
      const app = await ProjectApplication.create({
        clientId: clients[pp.clientIdx]._id,
        title: pp.title,
        description: pp.description,
        status: 'submitted',
        requiredDocuments: pp.documents,
        ndaSigned: false,
      });
      applications.push(app);
      console.log(`   📋 Submitted: "${pp.title}" by ${clients[pp.clientIdx].fullName}`);
    }

    // 4b. Review and Approve Applications
    console.log('\n🔍 Reviewing and approving applications...');
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];

      // Mark as under_review
      app.status = 'under_review';
      app.reviewNotes = `Reviewed by ${admin.fullName || admin.username}. Project scope looks well-defined.`;
      await app.save();

      // Then approve and create NDA
      app.status = 'approved';
      app.reviewNotes = `✅ Approved by ${admin.fullName || admin.username}. Ready for NDA signing.`;
      await app.save();

      // Create NDA record
      const client = clients.find(c => c._id.toString() === app.clientId.toString());
      await ProjectNDA.create({
        projectApplicationId: app._id,
        clientId: app.clientId,
        signerName: client?.fullName || 'Client',
        signerEmail: client?.email || '',
        status: 'pending',
      });

      console.log(`   ✅ Approved: "${app.title}"`);
    }

    // 4c. Sign NDAs
    console.log('\n✍️  Signing NDAs...');
    const ndas = await ProjectNDA.find({});
    for (const nda of ndas) {
      const app = await ProjectApplication.findById(nda.projectApplicationId);
      const client = clients.find(c => c._id.toString() === nda.clientId.toString());

      nda.status = 'signed';
      nda.signerName = client?.fullName || 'Client';
      nda.signedAt = new Date();
      nda.signerIp = '127.0.0.1';
      nda.signatureHash = fakeSignatureHash(`${nda.projectApplicationId}-${nda.clientId}-${Date.now()}`);
      await nda.save();

      if (app) {
        app.ndaSigned = true;
        await app.save();
      }
      console.log(`   ✅ NDA signed for: "${app?.title || 'Unknown'}"`);
    }

    // 4d. Initialize Projects from Applications
    console.log('\n🚀 Initializing projects...');
    const courseNames = ['Full Stack Web Development', 'Mobile App Development', 'Software Engineering Bootcamp', 'Advanced Data Science', 'Cloud & DevOps Engineering'];

    const studentPool = [...students];
    const projectRecords: any[] = [];

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const teamSize = 2 + (i % 2); // alternates between 2 and 3
      const teamStudents = studentPool.splice(0, teamSize);
      if (teamStudents.length === 0) break;

      const project = await Project.create({
        userId: app.clientId,
        projectApplicationId: app._id,
        title: app.title,
        description: app.description,
        course: courseNames[i % courseNames.length],
        type: 'Team Project',
        status: 'in_progress',
        progress: 15 + (i * 10),
        isTemplate: false,
        visibility: 'private',
        category: 'Training',
        mentors: [trainer1._id, trainer2._id],
        team: teamStudents.map((s: any) => ({
          userId: s._id,
          name: s.fullName || s.username,
          role: i % 2 === 0 ? 'Frontend Developer' : 'Backend Developer',
        })),
        tasks: [
          { id: new mongoose.Types.ObjectId().toString(), title: 'Set up project repository and CI/CD', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Design database schema', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Build authentication system', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Create UI component library', completed: true, approved: true, category: 'Frontend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Implement dashboard views', completed: false, category: 'Frontend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Write API integration tests', completed: false, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Deploy staging environment', completed: false, category: 'Backend' },
        ],
        milestones: [
          {
            title: 'Project Kickoff & Requirements',
            description: 'Define scope, tech stack, and system architecture',
            completed: true,
            deliverables: ['System Features Document', 'Architecture Diagram', 'Tech Stack Decision Doc'],
            submissions: teamStudents.length > 0 ? [{
              url: 'https://drive.google.com/requirements-v1.pdf',
              submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
              message: 'Initial requirements document with all features outlined.',
              status: 'approved' as const,
              version: 2,
              fileName: 'SRS_Document_v2.pdf',
              submittedBy: teamStudents[0]._id,
            }] : [],
            feedback: 'Great foundation. Clarify the data flow between components.',
          },
          {
            title: 'MVP Development',
            description: 'Core functionality implementation',
            completed: i < 3,
            deliverables: ['Repository URL', 'Demo Video', 'Running Prototype'],
            submissions: i < 3 && teamStudents.length > 1 ? [{
              url: 'https://github.com/ihub/' + app.title.toLowerCase().replace(/\s+/g, '-'),
              submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              message: 'MVP ready for review. Core features implemented as specified.',
              status: 'pending' as const,
              version: 1,
              fileName: 'demo.mp4',
              submittedBy: teamStudents[1]._id,
            }] : [],
          },
          {
            title: 'Final QA & Handover',
            description: 'Testing, documentation, and deployment',
            completed: false,
            deliverables: ['Testing Report', 'Production Deployment', 'User Documentation'],
          },
        ],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Git'],
      });

      projectRecords.push(project);
      console.log(`   📦 Created project: "${project.title}" with ${teamStudents.map((s: any) => s.fullName || s.username).join(', ')}`);

      // Onboard developers
      for (let ti = 0; ti < teamStudents.length; ti++) {
        const student = teamStudents[ti];
        await ProjectOnboarding.create({
          projectId: project._id,
          developerId: student._id,
          role: ti === 0 ? 'Team Lead' : (ti === 1 ? 'Developer' : 'Support Developer'),
          status: ti === 0 ? 'active' : 'onboarding',
          checklist: [
            { task: 'Read project requirements document', completed: true, completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
            { task: 'Set up development environment', completed: true, completedAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000) },
            { task: 'Clone repository and run project locally', completed: true, completedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000) },
            { task: 'Complete first assigned task', completed: ti === 0, completedAt: ti === 0 ? new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Attend team standup meetings', completed: ti === 0, completedAt: ti === 0 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Submit onboarding feedback', completed: false },
          ],
        });
      }

      // Add evaluations for some projects
      if (i < 3) {
        project.evaluation = {
          clientFeedback: {
            rating: 4 + (i % 2),
            comment: ['The team is doing an excellent job. Communication is clear.', 'Good progress. Looking forward to the MVP.', 'Very impressed with the quality of work.'][i],
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          developerEvaluations: teamStudents.slice(0, 2).map((s: any, si: number) => ({
            developerId: s._id,
            rating: 5 - si,
            notes: si === 0 ? 'Strong leadership and technical skills.' : 'Good team player, delivers on time.',
          })),
          reviewerNotes: `Project is on track. Mentor ${trainer1.fullName || trainer1.username} reports good progress.`,
        };
        await project.save();
      }
    }
    console.log(`   ✅ ${projectRecords.length} projects with onboarding created`);

    // ====== STEP 5: Seed Internship Module Flow ======
    console.log('\n' + '='.repeat(60));
    console.log('🏫 INTERNSHIP MODULE FLOW');
    console.log('='.repeat(60));

    // Clear existing internship module data
    console.log('\n🧹 Clearing existing internship module data...');
    await InternshipCertificate.deleteMany({});
    await InternshipInvoice.deleteMany({});
    await InternshipPayment.deleteMany({});
    await InternshipMentorFeedback.deleteMany({});
    await InternshipTimeLog.deleteMany({});
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
    console.log('   ✅ Cleared');

    // 5a. Create Internship Programs
    console.log('\n🚀 Creating Internship Programs...');
    const programsData = [
      {
        title: 'Sustainable Tech Internship 2026',
        description: 'A 3-month intensive hands-on internship focusing on Eco-conscious Full-Stack Development. Students build real-world projects while learning modern tech stacks.',
        duration: '3 Months',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        applicationDeadline: new Date('2026-05-15'),
        eligibility: ['Enrolled in university', 'Basic programming knowledge', 'Passionate about sustainability'],
        rules: 'Code with impact. Respect the environment. Collaborate and share knowledge.',
        price: 75000,
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
        description: 'A 4-month program where students design and build digital health solutions for community clinics. Focus on full-stack development with security best practices.',
        duration: '4 Months',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-10-31'),
        applicationDeadline: new Date('2026-06-15'),
        eligibility: ['Completed at least one full-stack project', 'Interest in health-tech', 'Team player'],
        rules: 'Patient data privacy is paramount. Follow HIPAA guidelines. Document everything.',
        price: 100000,
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
        eligibility: ['Python proficiency', 'Basic statistics knowledge', 'Enrolled student or fresh graduate'],
        rules: 'All code must be reproducible. Share datasets responsibly.',
        price: 50000,
        currency: 'RWF',
        discount: 15,
        maxParticipants: 25,
        maxSpots: 20,
        status: 'active' as const,
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
        createdBy: admin._id,
        enablePhaseBasedApproval: false,
        batches: [{ name: 'Cohort A', startDate: pd.startDate, endDate: pd.endDate }],
      });
      programs.push(program);
      console.log(`   ✅ Program: "${pd.title}" (${pd.status})`);
    }

    // 5b. Create Internship Projects
    console.log('\n🏗️ Creating Internship Projects...');
    const projectsData = [
      { programIdx: 0, title: 'Eco-Friendly E-commerce Mobile App', description: 'Design and build a next-gen sustainable shopping platform with carbon footprint tracking, eco-badges, and a circular economy resale hub.', docKey: 'ecommerce' as keyof typeof PROJECT_DOCS, skills: ['React Native', 'GraphQL', 'Tailwind CSS', 'Mongoose', 'Stripe'], teamMin: 3, teamMax: 5 },
      { programIdx: 0, title: 'Smart Campus Energy Monitor', description: 'An IoT-integrated dashboard that tracks energy consumption across campus buildings, provides optimization suggestions, and visualizes sustainability metrics.', docKey: 'ecommerce' as keyof typeof PROJECT_DOCS, skills: ['React', 'Node.js', 'MongoDB', 'Chart.js', 'WebSocket'], teamMin: 2, teamMax: 4 },
      { programIdx: 1, title: 'Community Health Record System', description: 'A secure, decentralized health records system for community clinics with patient management, appointment scheduling, and epidemic tracking.', docKey: 'health' as keyof typeof PROJECT_DOCS, skills: ['React', 'Node.js', 'GraphQL', 'MongoDB', 'Security'], teamMin: 3, teamMax: 5 },
      { programIdx: 1, title: 'Telemedicine Consultation Platform', description: 'A video-enabled telemedicine platform connecting patients with doctors, featuring appointment booking, prescription management, and health tips.', docKey: 'health' as keyof typeof PROJECT_DOCS, skills: ['React', 'WebRTC', 'Node.js', 'PostgreSQL', 'Redis'], teamMin: 2, teamMax: 4 },
      { programIdx: 2, title: 'AI-Powered Learning Management System', description: 'An intelligent LMS that adapts to each learner using AI for personalized learning paths, automated quiz generation, and progress analytics.', docKey: 'lms' as keyof typeof PROJECT_DOCS, skills: ['React', 'Python', 'TensorFlow', 'GraphQL', 'MongoDB'], teamMin: 3, teamMax: 4 },
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
        objectives: [`Develop core ${pd.title.toLowerCase()} functionality`, 'Implement user authentication and authorization', 'Create responsive and accessible UI', 'Set up CI/CD and deployment', 'Write comprehensive documentation'],
        defaultTickets: DEFAULT_TICKETS.map((t, i) => ({ ...t, order: i })),
      });
      projects.push(project);
      console.log(`   ✅ Project: "${pd.title}" (in ${program.title})`);
    }

    // 5c. Create Milestones
    console.log('\n🏆 Creating milestones...');
    for (let pi = 0; pi < projects.length; pi++) {
      const project = projects[pi];
      const milestonesData = [
        { title: 'Conceptual Design & Research', desc: 'Foundational phase for market fit and requirements gathering.', days: 14 },
        { title: 'UI/UX Prototyping', desc: 'Visual language, wireframes, and user flow mapping.', days: 28 },
        { title: 'Core Feature Implementation', desc: 'Core engine and primary features build.', days: 56 },
        { title: 'Integration & Beta Testing', desc: 'Full feature sync, QA testing, and user feedback.', days: 70 },
        { title: 'Production Launch & Handover', desc: 'Automated deployment, documentation, and final presentation.', days: 90 },
      ];

      for (let mi = 0; mi < milestonesData.length; mi++) {
        const m = milestonesData[mi];
        const program = programs.find(p => p._id.toString() === project.internshipProgramId.toString());
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
      console.log(`   ✅ 5 milestones for "${project.title}"`);
    }

    // 5d. Create Teams and assign members
    console.log('\n👥 Creating teams and assigning members...');
    const teamConfigs = [
      { projectIdx: 0, name: 'Eco-Architects', members: [
        { student: studentAlice, role: 'Team Lead' },
        { student: studentBob, role: 'Frontend Developer' },
        { student: remainingStudents[0], role: 'Backend Developer' },
        { student: remainingStudents[1], role: 'DevOps Engineer' },
      ]},
      { projectIdx: 1, name: 'Energy Optimizers', members: [
        { student: remainingStudents[2], role: 'Team Lead' },
        { student: remainingStudents[3], role: 'Developer' },
        { student: remainingStudents[4], role: 'Developer' },
      ]},
      { projectIdx: 2, name: 'Health Pioneers', members: [
        { student: studentAlice, role: 'Team Lead' },
        { student: remainingStudents[5], role: 'Backend Developer' },
        { student: remainingStudents[6], role: 'Frontend Developer' },
        { student: studentBob, role: 'Security Specialist' },
      ]},
      { projectIdx: 3, name: 'TeleMed Squad', members: [
        { student: studentBob, role: 'Team Lead' },
        { student: remainingStudents[7], role: 'Developer' },
        { student: remainingStudents[0], role: 'Developer' },
      ]},
      { projectIdx: 4, name: 'AI Learners', members: [
        { student: studentAlice, role: 'Team Lead' },
        { student: remainingStudents[1], role: 'ML Engineer' },
        { student: remainingStudents[2], role: 'Backend Developer' },
      ]},
    ];

    const teams: any[] = [];
    for (const tc of teamConfigs) {
      const project = projects[tc.projectIdx];
      const program = await InternshipProgram.findById(project.internshipProgramId);
      const teamMentor = tc.projectIdx % 2 === 0 ? trainer1 : trainer2;

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
      console.log(`   ✅ Team "${tc.name}" → ${tc.members.map(m => m.student.fullName || m.student.username).join(', ')}`);
    }

    // 5e. Create Sprints and Tasks
    console.log('\n📝 Creating sprints and tasks...');
    for (let ti = 0; ti < teams.length; ti++) {
      const project = projects[ti];
      const team = teams[ti];
      const teamConfig = teamConfigs[ti];
      const leadStudent = teamConfig.members[0].student;

      // Create 2 sprints
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

        // Add comments on some tasks
        if (i % 3 === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: assignee._id,
            content: `I've started working on this. Initial research looks promising. Will update by EOD.`,
          });
        }
        if (i === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: trainer1._id,
            content: `Great work on this! The implementation looks solid. Just a few minor suggestions on code comments.`,
          });
          task.approvedBy = trainer1._id;
          task.approvedAt = new Date();
          await task.save();
        }
        if (i === 3) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: trainer2._id,
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
      console.log(`   ✅ ${teamConfig.name}: 2 sprints, 23 tasks`);
    }

    // 5f. Create Internship Applications
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
          answer: q.type === 'select' ? (q.options?.[1] || 'Intermediate') : `Excited to join the ${program.title} program!`,
        })),
      });

      // Create payment for approved applications
      if (ac.status === 'approved') {
        const payment = await InternshipPayment.create({
          userId: ac.student._id,
          internshipProgramId: program._id,
          amount: program.price - (program.price * (program.discount || 0) / 100),
          currency: program.currency,
          status: 'paid',
          paymentMethod: 'Mobile Money',
          paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        });

        // Generate invoice
        await InternshipInvoice.create({
          paymentId: payment._id,
          userId: ac.student._id,
          internshipProgramId: program._id,
          amount: payment.amount,
          currency: program.currency,
          issuedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          status: 'paid' as const,
          items: [{ description: `${program.title} - Internship Fee`, quantity: 1, unitPrice: payment.amount, total: payment.amount }],
        });
      }
    }
    console.log(`   ✅ ${applicationConfigs.length} applications with payments & invoices`);

    // 5g. Create Submissions
    console.log('\n📤 Creating milestone submissions...');
    const allMilestones = await InternshipMilestone.find({ completed: true });
    for (let i = 0; i < Math.min(allMilestones.length, 4); i++) {
      const milestone = allMilestones[i];
      const project = projects.find(p => p._id.toString() === milestone.internshipProjectId.toString());
      const team = teams.find(t => t.internshipProjectId.toString() === milestone.internshipProjectId.toString());

      if (project && team) {
        const teamMembers = await InternshipTeamMember.find({ teamId: team._id });
        const submission = await InternshipSubmission.create({
          milestoneId: milestone._id,
          teamId: team._id,
          userId: teamMembers[0]?.userId || studentAlice._id,
          contentUrl: `https://drive.google.com/${project.title.toLowerCase().replace(/\s+/g, '-')}-milestone-${milestone.order}`,
          description: `Completed ${milestone.title} deliverable for ${project.title}. Includes documentation and code artifacts.`,
          status: 'approved',
          feedback: 'Excellent work! The deliverables exceed our expectations. Keep it up!',
        });

        await InternshipActivityLog.create({
          userId: teamMembers[0]?.userId || studentAlice._id,
          action: 'SUBMITTED',
          module: 'InternshipMilestone',
          targetType: 'InternshipSubmission',
          targetId: milestone._id,
          details: `Submitted deliverable for "${milestone.title}"`,
        });

        // Add mentor feedback
        await InternshipMentorFeedback.create({
          mentorId: trainer1._id,
          userId: teamMembers[0]?.userId || studentAlice._id,
          teamId: team._id,
          score: 8,
          comments: `Strong work on ${milestone.title}. Code quality and documentation are excellent.`,
        });
      }
    }
    console.log(`   ✅ Submissions & feedback created`);

    // 5h. Create Time Logs
    console.log('\n⏱️  Creating time logs...');
    for (const team of teams.slice(0, 3)) {
      const teamMembers = await InternshipTeamMember.find({ teamId: team._id });
      for (const member of teamMembers) {
        for (let d = 0; d < 5; d++) {
          await InternshipTimeLog.create({
            userId: member.userId,
            teamId: team._id,
            description: `Working on sprint tasks and project deliverables`,
            minutes: 60 + Math.floor(Math.random() * 120),
            date: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
          });
        }
      }
    }
    console.log(`   ✅ Time logs created for 3 teams`);

    // 5i. Create Certificates
    console.log('\n🎓 Creating certificates...');
    for (let ti = 0; ti < Math.min(teams.length, 2); ti++) {
      const team = teams[ti];
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
          trainerId: trainer1._id,
          trainerName: trainer1.fullName || trainer1.username,
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
    console.log(`   ✅ Certificates issued for ${Math.min(teams.length, 2)} teams`);

    // 5j. Create Internship Meetings
    console.log('\n📅 Creating internship meetings...');
    const meetingsData = [
      { title: 'Weekly Standup', type: 'WEEKLY' as const, startHour: 10, endHour: 11 },
      { title: 'Sprint Planning', type: 'WEEKLY' as const, startHour: 14, endHour: 15 },
      { title: 'Mentor Q&A Session', type: 'WEEKLY' as const, startHour: 9, endHour: 10 },
      { title: 'Code Review Session', type: 'WEEKLY' as const, startHour: 15, endHour: 16 },
    ];

    for (const md of meetingsData) {
      await InternshipMeeting.create({
        title: md.title,
        description: `Regular ${md.title.toLowerCase()} for all internship teams`,
        type: md.type,
        deliveryMode: 'online',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        startTime: new Date(new Date().setHours(md.startHour, 0, 0, 0)),
        endTime: new Date(new Date().setHours(md.endHour, 0, 0, 0)),
        teamIds: teams.slice(0, 3).map(t => t._id),
        userIds: [],
        mentorIds: [trainer1._id, trainer2._id],
        hostId: trainer1._id,
        status: 'confirmed',
        recurrenceDays: [1, 2, 4], // Mon, Tue, Thu
      });
    }
    console.log(`   ✅ ${meetingsData.length} recurring meetings`);

    // ====== STEP 6: Seed Bookings (Client-Meeting flow) ======
    console.log('\n' + '='.repeat(60));
    console.log('📅 CLIENT BOOKINGS FLOW');
    console.log('='.repeat(60));

    console.log('\n🧹 Clearing existing bookings...');
    await Booking.deleteMany({});
    console.log('   ✅ Cleared');

    console.log('\n📅 Creating client bookings...');
    const bookingTypes = ['Consultation', 'Project Review', 'Mentorship Call', 'Sprint Review', 'Requirements Workshop'];
    const daysFromNow = [1, 3, 5, 7, 10];

    for (let bi = 0; bi < clients.length * 2; bi++) {
      const client = clients[bi % clients.length];
      const dayOffset = daysFromNow[bi % daysFromNow.length];
      const bookingDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const hour = 9 + (bi % 8);

      await Booking.create({
        userId: client._id,
        mentorId: trainers[bi % trainers.length]._id,
        type: bookingTypes[bi % bookingTypes.length],
        date: bookingDate.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:00`,
        topic: `${bookingTypes[bi % bookingTypes.length]} - ${client.company || client.fullName}`,
        notes: `Discussing project milestones and next steps for the ${['e-learning platform', 'analytics dashboard', 'community PMS', 'marketplace', 'IoT system'][bi % 5]}.`,
        status: bi < 3 ? 'confirmed' : 'pending',
        deliveryMode: 'online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      });
    }
    console.log(`   ✅ ${clients.length * 2} bookings created`);

    // ====== STEP 7: Summary ======
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY — All Flows');
    console.log('='.repeat(60));
    console.log(`   👤 Admin:               ${admin.fullName || admin.username} (${admin._id})`);
    console.log(`   👨‍🏫 Trainers:            ${trainers.length}`);
    console.log(`   🎓 Students:            ${students.length}`);
    console.log(`   👤 Clients:             ${clients.length}`);
    console.log('');
    console.log('   📋 Project Applications:');
    console.log(`      - Submissions:       ${applications.length}`);
    console.log(`      - NDAs Signed:       ${await ProjectNDA.countDocuments({ status: 'signed' })}`);
    console.log(`      - Projects Created:  ${projectRecords.length}`);
    console.log(`      - Onboardings:       ${await ProjectOnboarding.countDocuments()}`);
    console.log(`      - With Evaluations:  ${projectRecords.filter(p => p.evaluation?.clientFeedback).length}`);
    console.log('');
    console.log('   🏫 Internship Module:');
    console.log(`      - Programs:          ${programs.length}`);
    console.log(`      - Projects:          ${projects.length}`);
    console.log(`      - Teams:             ${teams.length}`);
    console.log(`      - Team Members:      ${await InternshipTeamMember.countDocuments()}`);
    console.log(`      - Milestones:        ${await InternshipMilestone.countDocuments()}`);
    console.log(`      - Sprints:           ${await InternshipSprint.countDocuments()}`);
    console.log(`      - Tasks:             ${await InternshipTask.countDocuments()}`);
    console.log(`      - Comments:          ${await InternshipComment.countDocuments()}`);
    console.log(`      - Applications:      ${await InternshipApplication.countDocuments()}`);
    console.log(`      - Payments:          ${await InternshipPayment.countDocuments()}`);
    console.log(`      - Invoices:          ${await InternshipInvoice.countDocuments()}`);
    console.log(`      - Submissions:       ${await InternshipSubmission.countDocuments()}`);
    console.log(`      - Time Logs:         ${await InternshipTimeLog.countDocuments()}`);
    console.log(`      - Mentor Feedback:   ${await InternshipMentorFeedback.countDocuments()}`);
    console.log(`      - Certificates:      ${await InternshipCertificate.countDocuments()}`);
    console.log(`      - Meetings:          ${await InternshipMeeting.countDocuments()}`);
    console.log(`      - Activity Logs:     ${await InternshipActivityLog.countDocuments()}`);
    console.log('');
    console.log('   📅 Bookings:');
    console.log(`      - Total:             ${await Booking.countDocuments()}`);
    console.log(`      - Confirmed:         ${await Booking.countDocuments({ status: 'confirmed' })}`);
    console.log(`      - Pending:           ${await Booking.countDocuments({ status: 'pending' })}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('\n🔑 Default login: password123 for all users\n');
    console.log('✅ All flows seeded successfully!');
    console.log('🌱 Happy testing! 🚀\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedFlows();
