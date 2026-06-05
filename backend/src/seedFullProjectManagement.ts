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
import { ApplicationPhase } from './models/ApplicationPhase';
import { ApplicationPhaseSubmission } from './models/ApplicationPhaseSubmission';
import { Booking } from './models/Booking';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const ADMIN_ID = '69ec7f859567cd270a48cf49';
const ADMIN_EMAIL = 'admin@codemande.com';

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
// Helper
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
async function seedFullProjectManagement() {
  try {
    await connectDB();
    console.log('🌱 Starting Full Project Management Seeder...\n');

    // ====== STEP 0: Load admin user ======
    console.log('👤 Loading admin user...');
    const admin = await User.findById(ADMIN_ID);
    if (!admin) {
      console.error(`❌ Admin user with ID ${ADMIN_ID} (${ADMIN_EMAIL}) not found!`);
      console.error('   Please ensure this admin exists in the database first.');
      process.exit(1);
    }
    console.log(`   ✅ Found admin: ${admin.fullName || admin.username} (${admin._id})`);

    // ====== STEP 1: Create / ensure trainer + student users ======
    console.log('\n👨‍🏫 Creating / ensuring trainer users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const trainerData = [
      { username: 'trainer_jane', email: 'jane@mentor.tech', fullName: 'Jane Mwangi' },
      { username: 'trainer_david', email: 'david@codecoach.rw', fullName: 'David Niyonzima' },
      { username: 'trainer_grace', email: 'grace@devlab.rw', fullName: 'Grace Uwase' },
    ];

    const trainers: any[] = [];
    for (const td of trainerData) {
      const existing = await User.findOne({ username: td.username });
      if (existing) {
        trainers.push(existing);
        console.log(`   ✅ Existing trainer: ${td.fullName} (@${td.username})`);
      } else {
        const trainer = await User.create({
          ...td,
          password: hashedPassword,
          role: 'trainer',
          status: 'active',
          isEmailVerified: true,
        });
        trainers.push(trainer);
        console.log(`   ✅ Created trainer: ${td.fullName} (@${td.username})`);
      }
    }
    const [trainer1, trainer2, trainer3] = trainers;

    // ====== STEP 2: Ensure student users ======
    console.log('\n🎓 Ensuring student users...');
    const studentData = [
      { username: 'student_amina', email: 'amina@ihub.com', fullName: 'Amina Diallo' },
      { username: 'student_brian', email: 'brian@ihub.com', fullName: 'Brian Kagame' },
      { username: 'celine_niyo', email: 'celine@ihub.com', fullName: 'Celine Niyonzima' },
      { username: 'david_mugisha', email: 'david.m@ihub.com', fullName: 'David Mugisha' },
      { username: 'esther_umutoni', email: 'esther@ihub.com', fullName: 'Esther Umutoni' },
      { username: 'felix_habimana', email: 'felix@ihub.com', fullName: 'Felix Habimana' },
      { username: 'gloria_ishimwe', email: 'gloria@ihub.com', fullName: 'Gloria Ishimwe' },
      { username: 'henry_kamanzi', email: 'henry@ihub.com', fullName: 'Henry Kamanzi' },
      { username: 'iris_mbabazi', email: 'iris@ihub.com', fullName: 'Iris Mbabazi' },
      { username: 'james_muhire', email: 'james@ihub.com', fullName: 'James Muhire' },
      { username: 'keziah_uwimana', email: 'keziah@ihub.com', fullName: 'Keziah Uwimana' },
      { username: 'leon_gasana', email: 'leon@ihub.com', fullName: 'Leon Gasana' },
    ];

    const students: any[] = [];
    for (const sd of studentData) {
      const student = await User.findOneAndUpdate(
        { username: sd.username },
        {
          ...sd,
          password: hashedPassword,
          role: 'student',
          status: 'active',
          isEmailVerified: true,
        },
        { upsert: true, new: true }
      );
      students.push(student);
    }
    console.log(`   ✅ ${students.length} students ensured`);

    // ====== STEP 3: Create client users ======
    console.log('\n👤 Creating client users...');
    const clientData = [
      { username: 'client_greenfield', fullName: 'Alice Mukamana', email: 'alice@greenfield.rw', company: 'GreenField Solutions' },
      { username: 'client_nexus', fullName: 'Samuel Niyonteze', email: 'samuel@nexus.rw', company: 'Nexus Innovations' },
      { username: 'client_bridge', fullName: 'Diane Uwimana', email: 'diane@bridge.rw', company: 'Bridge Labs Rwanda' },
      { username: 'client_skyline', fullName: 'Jean-Pierre Habimana', email: 'jp@skyline.rw', company: 'Skyline Technologies' },
    ];

    await User.deleteMany({ role: 'client' });
    const clients: any[] = [];
    for (const cd of clientData) {
      const client = await User.create({
        ...cd,
        password: hashedPassword,
        role: 'client',
        phone: '+25078' + Math.floor(1000000 + Math.random() * 9000000),
        location: 'Kigali, Rwanda',
        bio: `CEO / Founder at ${cd.company}`,
        status: 'active',
        isEmailVerified: true,
      });
      clients.push(client);
      console.log(`   ✅ Client: ${cd.fullName} (@${cd.username}) — ${cd.company}`);
    }

    // ====================================================================
    // PHASE A — PROJECT LIFECYCLE (Application → NDA → Project → Work)
    // ====================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📋 PHASE A: PROJECT LIFECYCLE — ALL STAGES');
    console.log('='.repeat(60));

    // Clear existing project lifecycle data
    console.log('\n🧹 Clearing existing project lifecycle data...');
    await ProjectApplication.deleteMany({});
    await ProjectNDA.deleteMany({});
    await ProjectOnboarding.deleteMany({});
    await Project.deleteMany({});
    console.log('   ✅ Cleared');

    // ── Stage 1: Submit Applications (different data from existing seeds) ──
    console.log('\n📝 STAGE 1: Submitting project applications...');
    const projectProposals = [
      {
        clientIdx: 0,
        title: 'Smart Agriculture Monitoring Platform',
        description: 'An IoT-powered platform for monitoring soil moisture, weather patterns, and crop health in real time. Farmers receive alerts via SMS and a mobile dashboard, enabling data-driven irrigation and fertilizer decisions.',
        documents: { overviewUrl: 'https://docs.google.com/agri-platform-overview', featuresUrl: 'https://docs.google.com/agri-platform-features', technicalUrl: 'https://docs.google.com/agri-platform-tech' },
      },
      {
        clientIdx: 1,
        title: 'Freelancer Marketplace & Collaboration Hub',
        description: 'A digital marketplace connecting freelance developers, designers, and writers with businesses. Features include project bidding, milestone-based escrow payments, real-time collaboration workspaces, and a reputation system.',
        documents: { overviewUrl: 'https://docs.google.com/freelance-overview', featuresUrl: 'https://docs.google.com/freelance-features', technicalUrl: 'https://docs.google.com/freelance-tech' },
      },
      {
        clientIdx: 2,
        title: 'Waste Management & Recycling Tracker',
        description: 'A community-driven platform for tracking waste collection, recycling drop-offs, and environmental impact. Citizens can report overflowing bins, schedule pickups, and earn green points redeemable for rewards.',
        documents: { overviewUrl: 'https://docs.google.com/waste-tracker-overview', featuresUrl: 'https://docs.google.com/waste-tracker-features', technicalUrl: 'https://docs.google.com/waste-tracker-tech' },
      },
      {
        clientIdx: 3,
        title: 'Virtual Internship & Job Shadow Platform',
        description: 'An end-to-end platform for hosting virtual internships, job shadowing experiences, and mentorship programs. Companies can post positions, track intern progress, and generate performance reports.',
        documents: { overviewUrl: 'https://docs.google.com/virtual-internship-overview', featuresUrl: 'https://docs.google.com/virtual-internship-features', technicalUrl: 'https://docs.google.com/virtual-internship-tech' },
      },
      {
        clientIdx: 0,
        title: 'Microfinance Loan Management System',
        description: 'A secure digital platform for microfinance institutions to manage loan applications, disbursements, repayments, and client profiles. Features include credit scoring, automated reminders, and regulatory compliance reporting.',
        documents: { overviewUrl: 'https://docs.google.com/microfinance-overview', featuresUrl: 'https://docs.google.com/microfinance-features', technicalUrl: 'https://docs.google.com/microfinance-tech' },
      },
      {
        clientIdx: 2,
        title: 'Remote Proctoring & Exam Portal',
        description: 'A secure online examination platform with AI-powered remote proctoring, plagiarism detection, automated grading, and certificate issuance. Supports live monitoring, screen recording, and browser lockdown.',
        documents: { overviewUrl: 'https://docs.google.com/proctoring-overview', featuresUrl: 'https://docs.google.com/proctoring-features', technicalUrl: 'https://docs.google.com/proctoring-tech' },
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

    // ── Stages 2-3: Under Review → Approved ──
    console.log('\n🔍 STAGE 2: Reviewing applications...');
    const reviewNotes = [
      'Project aligns well with our sustainability goals. Scope is clear and deliverables are well-defined.',
      'Strong market need identified. The platform has good potential. Approved with recommendations for enhanced security.',
      'Community impact is significant. Approved. Recommend adding multi-language support for broader reach.',
      'Excellent proposal addressing the skills gap. Approval granted with priority mentorship allocation.',
      'Solid financial inclusion project. Approved. Ensure regulatory compliance features are prioritized.',
      'Robust technical proposal. Approved. Request additional focus on accessibility standards.',
    ];

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      // Stage 2: Under review
      app.status = 'under_review';
      app.reviewNotes = `🔍 Under review by ${admin.fullName || admin.username}. ${reviewNotes[i % reviewNotes.length].slice(0, 50)}...`;
      await app.save();

      // Stage 3: Approved (with review notes)
      app.status = 'approved';
      app.reviewNotes = `✅ Approved by ${admin.fullName || admin.username}. ${reviewNotes[i % reviewNotes.length]}`;
      await app.save();

      // Create NDA record
      const client = clients.find((c: any) => c._id.toString() === app.clientId.toString());
      await ProjectNDA.create({
        projectApplicationId: app._id,
        clientId: app.clientId,
        signerName: client?.fullName || 'Client',
        signerEmail: client?.email || '',
        status: 'pending',
      });
      console.log(`   ✅ Stage 2→3: "${app.title}" → under_review → approved`);
    }

    // ── Stage 4: Sign NDA ──
    console.log('\n✍️  STAGE 4: Signing NDAs...');
    const ndas = await ProjectNDA.find({});
    for (const nda of ndas) {
      const app = await ProjectApplication.findById(nda.projectApplicationId);
      const client = clients.find((c: any) => c._id.toString() === nda.clientId.toString());

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

    // ── Stage 5: Create Projects & Assign Admin + Team ──
    console.log('\n🚀 STAGE 5: Creating projects & assigning teams...');
    const courseNames = [
      'Full Stack Web Development',
      'Software Engineering',
      'Mobile App Development',
      'DevOps & Cloud Engineering',
      'Data Engineering',
      'Cybersecurity & Systems',
    ];

    const studentPool = [...students];
    const projectRecords: any[] = [];

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const teamSize = 2 + (i % 3 === 0 ? 0 : (i % 2)); // 2-3 members
      const teamStudents = studentPool.splice(0, teamSize);
      if (teamStudents.length === 0) break;

      // The admin is assigned as a mentor AND also as a member of the project
      const projectMentors = [admin._id, trainers[i % trainers.length]._id];
      const teamRoles = ['Frontend Developer', 'Backend Developer', 'UI/UX Designer'];

      const project = await Project.create({
        userId: app.clientId,
        projectApplicationId: app._id,
        title: app.title,
        description: app.description,
        course: courseNames[i % courseNames.length],
        type: 'Team Project',
        status: 'in_progress',
        progress: 10 + (i * 5),
        isTemplate: false,
        visibility: 'private',
        category: i < 3 ? 'Training' : 'Internship',
        mentors: projectMentors,
        team: teamStudents.map((s: any, idx: number) => ({
          userId: s._id,
          name: s.fullName || s.username,
          role: teamRoles[idx % teamRoles.length],
        })),
        tasks: [
          { id: new mongoose.Types.ObjectId().toString(), title: 'Set up monorepo and CI/CD pipeline', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Design and implement database schemas', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Build authentication & authorization', completed: false, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Create component library with Storybook', completed: true, approved: true, category: 'Frontend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Implement core dashboard views', completed: false, category: 'Frontend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Write integration & E2E tests', completed: false, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Set up Docker & staging deployment', completed: false, category: 'Backend' },
        ],
        milestones: [
          {
            title: 'Kickoff & Architecture Design',
            description: 'Finalize scope, tech stack selection, and system architecture diagrams',
            completed: true,
            deliverables: ['System Architecture Document', 'ER Diagram', 'API Contract Spec'],
            submissions: teamStudents.length > 0 ? [{
              url: 'https://drive.google.com/architecture-v1.pdf',
              submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              message: 'Architecture document with all components defined per requirements.',
              status: 'approved' as const,
              version: 2,
              fileName: 'architecture_v2.pdf',
              submittedBy: teamStudents[0]._id,
            }] : [],
            feedback: 'Excellent architecture. Consider adding a caching layer for better performance.',
          },
          {
            title: 'MVP — Core Feature Development',
            description: 'Implement core functionality, API endpoints, and primary UI screens',
            completed: i < 3,
            deliverables: ['Running API Server', 'UI Prototype', 'API Documentation'],
            submissions: i < 3 && teamStudents.length > 1 ? [{
              url: 'https://github.com/ihub/' + app.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              message: 'MVP is ready. All core features implemented. API docs auto-generated.',
              status: 'pending' as const,
              version: 1,
              fileName: 'demo-screenshots.pdf',
              submittedBy: teamStudents[1]._id,
            }] : [],
          },
          {
            title: 'QA, Documentation & Deployment',
            description: 'Full testing coverage, user documentation, and production deployment',
            completed: i < 2,
            deliverables: ['Test Coverage Report', 'User Manual', 'Deployment Scripts'],
            submissions: i < 2 && teamStudents.length > 0 ? [{
              url: 'https://drive.google.com/deployment-report.pdf',
              submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              message: 'Deployment pipeline is operational. Test coverage at 85%.',
              status: i < 1 ? 'approved' as const : 'pending' as const,
              version: 1,
              fileName: 'qa-report.pdf',
              submittedBy: teamStudents[0]._id,
            }] : [],
            feedback: i < 2 ? 'Well tested and ready for production. Great work!' : undefined,
          },
        ],
        startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker', 'GraphQL'],
      });

      projectRecords.push(project);
      const memberStr = teamStudents.map((s: any) => s.fullName || s.username).join(', ');
      console.log(`   📦 Project #${i + 1}: "${project.title}"`);
      console.log(`      Team: ${memberStr}`);
      console.log(`      Mentors: Admin (${admin.fullName}) + ${trainers[i % trainers.length].fullName}`);

      // ── Stage 6: Onboard developers ──
      for (let ti = 0; ti < teamStudents.length; ti++) {
        const student = teamStudents[ti];
        const roles = ['Team Lead', 'Developer', 'Junior Developer'];
        await ProjectOnboarding.create({
          projectId: project._id,
          developerId: student._id,
          role: roles[ti % roles.length],
          status: ti === 0 ? 'active' : 'onboarding',
          checklist: [
            { task: 'Read project requirements and scope document', completed: true, completedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000) },
            { task: 'Set up development environment and tools', completed: true, completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
            { task: 'Clone repository and run project locally', completed: true, completedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000) },
            { task: 'Complete introductory training modules', completed: ti === 0, completedAt: ti === 0 ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Attend team onboarding standup with admin', completed: ti === 0, completedAt: ti === 0 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Submit onboarding feedback & development plan', completed: false },
          ],
        });
      }

      // ── Stage 7: Add evaluations for completed milestones ──
      if (i < 3) {
        const clientUser = clients.find((c: any) => c._id.toString() === app.clientId.toString());
        project.evaluation = {
          clientFeedback: {
            rating: 4 + (i % 2 === 0 ? 1 : 0),
            comment: [
              'The admin and team have done an outstanding job. Communication is proactive and deliverables are high quality.',
              'Good progress. The admin-mentor coordination is excellent. Minor UX refinements needed for the dashboard.',
              'Exceptional quality. The team exceeded our expectations. Would definitely work with this team again.',
            ][i],
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          developerEvaluations: teamStudents.slice(0, 2).map((s: any, si: number) => ({
            developerId: s._id,
            rating: 5 - si,
            notes: si === 0 ? 'Strong collaboration and technical leadership.' : 'Consistent contributor with good code quality.',
          })),
          reviewerNotes: `Admin ${admin.fullName || admin.username} is actively mentoring this team. Progress is on track.`,
        };
        await project.save();
        console.log(`      ⭐ Evaluation added`);
      }
    }

    // ====================================================================
    // PHASE B — INTERNSHIP APPLICATIONS WITH PHASES
    // ====================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🏫 PHASE B: INTERNSHIP MODULE — ALL APPLICATIONS & PHASES');
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
    await ApplicationPhase.deleteMany({});
    await ApplicationPhaseSubmission.deleteMany({});
    console.log('   ✅ Cleared');

    // ── Create Internship Program ──
    console.log('\n🚀 Creating Internship Program with phases...');
    const program = await InternshipProgram.create({
      title: 'Digital Skills Accelerator 2026',
      description: 'A 12-week intensive program combining technical training with real-world project experience. Students progress through structured phases from application to graduation.',
      duration: '3 Months',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      applicationDeadline: new Date('2026-06-20'),
      eligibility: ['Basic programming knowledge', 'Enrolled student or recent graduate', 'Available 20+ hours/week'],
      rules: 'Complete each phase before progressing. Attend all mentor sessions. Submit deliverables on time.',
      price: 60000,
      currency: 'RWF',
      discount: 5,
      maxParticipants: 25,
      maxSpots: 20,
      status: 'active' as const,
      allowedDeliveryModes: ['online' as const, 'hybrid' as const],
      enablePhaseBasedApproval: true,
      phaseApprovalRules: {
        requireApprovalAtEachPhase: true,
        autoProgressOnApproval: false,
      },
      applicationQuestions: [
        { label: 'What motivates you to join this program?', type: 'textarea' as const, required: true },
        { label: 'Current skill level', type: 'select' as const, required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
        { label: 'Areas of interest', type: 'checkbox' as const, required: false, options: ['Frontend', 'Backend', 'DevOps', 'Data Science', 'Mobile'] },
      ],
      batches: [{ name: 'Cohort 2026-A', startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30') }],
      createdBy: admin._id,
    });
    console.log(`   ✅ Program: "${program.title}"`);

    // ── Create Application Phases ──
    console.log('\n📋 Creating application phases...');
    const phaseData = [
      {
        name: 'Application & Document Review',
        description: 'Submit your application documents including CV, motivation letter, and portfolio for initial screening.',
        order: 1,
        estimatedDurationDays: 7,
        deliverables: [
          { type: 'cv' as const, name: 'Curriculum Vitae', required: true, description: 'Updated CV highlighting relevant experience' },
          { type: 'essay' as const, name: 'Motivation Letter', required: true, description: 'Explain why you want to join and what you hope to achieve' },
          { type: 'portfolio' as const, name: 'Portfolio Link', required: false, description: 'Link to GitHub or portfolio website' },
        ],
      },
      {
        name: 'Technical Skills Assessment',
        description: 'Complete a technical assessment to evaluate your programming fundamentals and problem-solving abilities.',
        order: 2,
        estimatedDurationDays: 5,
        deliverables: [
          { type: 'test' as const, name: 'Technical Test', required: true, description: 'Complete the online technical assessment' },
          { type: 'other' as const, name: 'Sample Code Repository', required: true, description: 'Submit a link to a sample project or code repository' },
        ],
      },
      {
        name: 'Interview & Soft Skills',
        description: 'A structured interview with the admin and mentors to assess communication, teamwork, and cultural fit.',
        order: 3,
        estimatedDurationDays: 7,
        isInterviewPhase: true,
        allowMeetingScheduling: true,
        enableApproval: true,
        approvalType: 'multiple' as const,
        deliverables: [
          { type: 'other' as const, name: 'Interview Confirmation', required: true, description: 'Schedule and attend the interview session' },
          { type: 'other' as const, name: 'Communication Assessment', required: false, description: 'Brief written communication exercise' },
        ],
      },
      {
        name: 'Final Onboarding & Contract',
        description: 'Review and sign the program agreement, set up your development environment, and complete onboarding tasks.',
        order: 4,
        estimatedDurationDays: 3,
        deliverables: [
          { type: 'other' as const, name: 'Signed Agreement', required: true, description: 'Review and digitally sign the program agreement' },
          { type: 'other' as const, name: 'Environment Setup', required: true, description: 'Set up development tools and verify access' },
          { type: 'other' as const, name: 'Onboarding Survey', required: true, description: 'Complete the onboarding preferences survey' },
        ],
      },
    ];

    const phases: any[] = [];
    for (const pd of phaseData) {
      const phase = await ApplicationPhase.create({
        programId: program._id,
        name: pd.name,
        description: pd.description,
        order: pd.order,
        requiredDeliverables: pd.deliverables,
        estimatedDurationDays: pd.estimatedDurationDays,
        enableApproval: true,
        approvalType: pd.approvalType || 'single',
        notificationOnCompletion: true,
        isInterviewPhase: pd.isInterviewPhase || false,
        allowMeetingScheduling: pd.allowMeetingScheduling || false,
      });
      phases.push(phase);
      console.log(`   ✅ Phase ${pd.order}: "${pd.name}"`);
    }

    // Link phases to program
    program.phases = phases.map((p: any) => p._id);
    program.enablePhaseBasedApproval = true;
    await program.save();

    // ── Create Internship Applications through all phases ──
    console.log('\n📋 Creating internship applications through all phases...');

    // Use remaining students who aren't already assigned to projects
    const applicationStudents = studentPool.length > 0 ? studentPool : students.slice(0, 8);
    const statuses: Array<'pending' | 'approved' | 'rejected' | 'waitlisted'> = ['approved', 'approved', 'pending', 'approved', 'waitlisted', 'approved', 'pending', 'approved'];

const appStatuses: Array<{
  studentIdx: number;
  status: 'pending' | 'approved';
  phasedStatus?: 'in_phase' | 'awaiting_review' | 'approved_to_next';
  currentPhaseOrder: number;
}> = [
      { studentIdx: 0, status: 'approved', phasedStatus: 'approved_to_next', currentPhaseOrder: 4 }, // Completed all phases
      { studentIdx: 1, status: 'approved', phasedStatus: 'in_phase', currentPhaseOrder: 3 },        // In interview phase
      { studentIdx: 2, status: 'approved', phasedStatus: 'awaiting_review', currentPhaseOrder: 2 }, // Awaiting tech assessment review
      { studentIdx: 3, status: 'approved', phasedStatus: 'in_phase', currentPhaseOrder: 2 },         // In tech assessment
      { studentIdx: 4, status: 'approved', phasedStatus: 'awaiting_review', currentPhaseOrder: 1 },  // Awaiting doc review
      { studentIdx: 5, status: 'approved', phasedStatus: 'in_phase', currentPhaseOrder: 1 },         // In application phase
      { studentIdx: 6, status: 'pending', phasedStatus: undefined, currentPhaseOrder: 0 },           // Pending
      { studentIdx: 7, status: 'approved', phasedStatus: 'approved_to_next', currentPhaseOrder: 3 }, // Through interview, into final onboarding
    ];

    const internshipApplications: any[] = [];
    for (let i = 0; i < Math.min(appStatuses.length, applicationStudents.length); i++) {
      const cfg = appStatuses[i];
      const student = applicationStudents[cfg.studentIdx];
      const currentPhase = cfg.currentPhaseOrder > 0 ? phases[cfg.currentPhaseOrder - 1] : null;

      const completionHistory: Array<{
        phaseId: mongoose.Types.ObjectId;
        completedAt: Date;
        approvedBy: mongoose.Types.ObjectId;
        notes?: string;
      }> = [];

      // Create phase completion history for phases the student has passed
      for (let p = 0; p < cfg.currentPhaseOrder - 1; p++) {
        const phase = phases[p];
        completionHistory.push({
          phaseId: phase._id,
          completedAt: new Date(Date.now() - (30 - p * 7) * 24 * 60 * 60 * 1000),
          approvedBy: admin._id,
          notes: `Phase "${phase.name}" completed successfully. Reviewed by ${admin.fullName}.`,
        });
      }

      const internApp = await InternshipApplication.create({
        internshipProgramId: program._id,
        userId: student._id,
        status: cfg.status,
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'MongoDB'].slice(0, 3 + (i % 3)),
        portfolioUrl: `https://github.com/${student.username}`,
        availability: i % 2 === 0 ? 'Full-time' : 'Part-time',
        selectedDeliveryMode: 'online',
        applicationAnswers: [
          { questionLabel: 'What motivates you to join this program?', answer: `I am passionate about building real-world software and gaining hands-on experience in ${['full-stack development', 'cloud engineering', 'mobile development', 'data science', 'DevOps', 'backend systems', 'frontend engineering', 'UI/UX development'][i]}.` },
          { questionLabel: 'Current skill level', answer: i < 3 ? 'Intermediate' : 'Beginner' },
        ],
        currentPhaseId: currentPhase?._id,
        phasedStatus: cfg.phasedStatus,
        phaseSubmissions: [],
        phaseCompletionHistory: completionHistory,
      });

      internshipApplications.push(internApp);

      const phaseName = currentPhase?.name || 'Waiting for review';
      const statusLabel = cfg.phasedStatus === 'in_phase' ? `📝 in "${phaseName}"` :
                          cfg.phasedStatus === 'awaiting_review' ? `⏳ awaiting review after phase ${cfg.currentPhaseOrder}` :
                          cfg.phasedStatus === 'approved_to_next' ? `✅ completed through phase ${cfg.currentPhaseOrder}` :
                          '⏸️ pending';
      console.log(`   ${student.fullName || student.username}: ${statusLabel}`);
    }

    // ── Create Phase Submissions for applications in progress ──
    console.log('\n📤 Creating phase submissions with reviews...');
    for (const internApp of internshipApplications) {
      if (!internApp.currentPhaseId || internApp.phasedStatus === 'approved_to_next') continue;

      const phase = await ApplicationPhase.findById(internApp.currentPhaseId);
      if (!phase) continue;

      const submissionData = phase.requiredDeliverables.map((d: any) => ({
        deliverableType: d.type,
        deliverableName: d.name,
        value: d.required ? `Submitted content for "${d.name}"` : '',
        fileUrl: d.required ? `https://drive.google.com/${internApp.userId}/${d.name.toLowerCase().replace(/\s+/g, '-')}.pdf` : undefined,
        fileName: d.required ? `${d.name.replace(/\s+/g, '_')}_${Date.now()}.pdf` : undefined,
      }));

      const isReviewed = internApp.phasedStatus === 'awaiting_review';
      const submission = await ApplicationPhaseSubmission.create({
        applicationId: internApp._id,
        phaseId: phase._id,
        submissionData,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reviewStatus: isReviewed ? 'approved' : 'pending',
        reviewedBy: isReviewed ? admin._id : undefined,
        reviewedAt: isReviewed ? new Date() : undefined,
        reviewNotes: isReviewed ? `Deliverables reviewed by ${admin.fullName}. All requirements met. Proceeding to next phase.` : undefined,
        isLatestSubmission: true,
        submissionNumber: 1,
      });

      // Link submission to application
      if (!internApp.phaseSubmissions) internApp.phaseSubmissions = [];
      internApp.phaseSubmissions.push(submission._id);
      await internApp.save();

      console.log(`   ✅ Submission for phase "${phase.name}" — ${isReviewed ? 'reviewed & approved' : 'pending review'}`);
    }

    // ── Create Internship Projects ──
    console.log('\n🏗️ Creating Internship Projects...');
    const projectsData = [
      { title: 'Digital Health Appointment System', description: 'A web-based appointment booking and management system for community health centers with SMS reminders and analytics.', skills: ['React', 'Node.js', 'MongoDB', 'Twilio'], teamMin: 2, teamMax: 4 },
      { title: 'E-Waste Recycling Marketplace', description: 'A platform connecting e-waste collectors with recycling centers. Features include pickup scheduling, weight-based pricing, and impact tracking.', skills: ['React Native', 'GraphQL', 'Firebase', 'Stripe'], teamMin: 2, teamMax: 3 },
      { title: 'Student Collaboration & Study Groups', description: 'A real-time collaboration platform for students to form study groups, share resources, schedule sessions, and track learning progress.', skills: ['React', 'Socket.io', 'Node.js', 'PostgreSQL'], teamMin: 3, teamMax: 5 },
    ];

    const internshipProjects: any[] = [];
    for (const pd of projectsData) {
      const project = await InternshipProject.create({
        internshipProgramId: program._id,
        title: pd.title,
        description: pd.description,
        document: `# ${pd.title}\n\n**Tech Stack:** ${pd.skills.join(', ')}\n\n**Project Overview:** ${pd.description}`,
        requiredSkills: pd.skills,
        teamSizeRange: { min: pd.teamMin, max: pd.teamMax },
        status: 'published',
        workflow: DEFAULT_WORKFLOW,
        objectives: [
          `Build a fully functional ${pd.title.toLowerCase()} application`,
          'Implement user authentication and role-based access',
          'Create responsive UI with accessibility standards',
          'Set up automated testing and CI/CD pipeline',
          'Deploy to production and write documentation',
        ],
        defaultTickets: [
          { title: 'Initialize repository and project structure', description: 'Set up monorepo with both frontend and backend.', priority: 'high' as const, taskType: 'task' as const, labels: ['setup'], suggestedRole: 'Backend', order: 0 },
          { title: 'Design database schema and models', description: 'Define all MongoDB schemas, indexes, and relationships.', priority: 'high' as const, taskType: 'feature' as const, labels: ['database'], suggestedRole: 'Backend', order: 1 },
          { title: 'Implement REST/GraphQL API', description: 'Build all API endpoints with proper validation and error handling.', priority: 'high' as const, taskType: 'feature' as const, labels: ['api'], suggestedRole: 'Backend', order: 2 },
          { title: 'Build authentication and authorization', description: 'JWT-based auth with role-based access control.', priority: 'high' as const, taskType: 'feature' as const, labels: ['security'], suggestedRole: 'Backend', order: 3 },
          { title: 'Create UI component library', description: 'Reusable components with consistent styling.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['frontend'], suggestedRole: 'Frontend', order: 4 },
          { title: 'Implement main application views', description: 'Build all primary pages and navigation.', priority: 'high' as const, taskType: 'feature' as const, labels: ['frontend'], suggestedRole: 'Frontend', order: 5 },
          { title: 'Add real-time features', description: 'WebSocket integration for live updates.', priority: 'medium' as const, taskType: 'feature' as const, labels: ['realtime'], suggestedRole: 'Backend', order: 6 },
          { title: 'Write tests and documentation', description: 'Unit tests, integration tests, and API docs.', priority: 'medium' as const, taskType: 'task' as const, labels: ['testing'], suggestedRole: 'Backend', order: 7 },
          { title: 'Set up CI/CD and deployment', description: 'Docker, staging, and production deployment.', priority: 'high' as const, taskType: 'task' as const, labels: ['devops'], suggestedRole: 'Backend', order: 8 },
          { title: 'Final QA and performance optimization', description: 'Lighthouse audit, bundle optimization, accessibility fixes.', priority: 'medium' as const, taskType: 'improvement' as const, labels: ['performance'], suggestedRole: 'Frontend', order: 9 },
        ],
      });
      internshipProjects.push(project);
      console.log(`   ✅ Project: "${pd.title}"`);
    }

    // ── Create Teams with Admin as Mentor ──
    console.log('\n👥 Creating teams with admin as mentor...');
    const approvedApps = internshipApplications.filter((a: any) => a.status === 'approved' && a.phasedStatus === 'approved_to_next');
    const teamConfigs = [
      { projectIdx: 0, name: 'HealthTech Innovators', members: approvedApps.slice(0, 3).map((a: any) => a.userId) },
      { projectIdx: 1, name: 'Green Coders', members: approvedApps.slice(3, 6).map((a: any) => a.userId) },
      { projectIdx: 2, name: 'StudySync Squad', members: approvedApps.length > 6 ? approvedApps.slice(6, 9).map((a: any) => a.userId) : students.slice(4, 7).map((s: any) => s._id) },
    ];

    const teams: any[] = [];
    for (const tc of teamConfigs) {
      if (tc.members.length < 2) continue;
      const project = internshipProjects[tc.projectIdx];

      const team = await InternshipTeam.create({
        name: tc.name,
        internshipProjectId: project._id,
        internshipProgramId: program._id,
        mentorId: admin._id, // Admin is the mentor!
        status: 'active',
        type: 'team',
      });

      const roles = ['Team Lead', 'Developer', 'Junior Developer'];
      for (let mi = 0; mi < tc.members.length; mi++) {
        const user = await User.findById(tc.members[mi]);
        if (user) {
          await InternshipTeamMember.create({
            teamId: team._id,
            userId: user._id,
            role: roles[mi % roles.length],
          });
        }
      }
      teams.push(team);
      console.log(`   ✅ Team "${tc.name}" → mentored by admin (${admin.fullName || admin.username})`);
    }

    // ── Create Sprints, Tasks, Comments & Activity ──
    console.log('\n📝 Creating sprints, tasks, and activity...');
    const taskThemes = [
      'Implement user registration and login flow',
      'Design and build the main dashboard layout',
      'Create data models and API endpoints',
      'Build search and filtering functionality',
      'Implement file upload and media handling',
      'Add pagination and sorting to list views',
      'Create email notification templates',
      'Build reporting and analytics widgets',
      'Implement role-based access control',
      'Add dark mode and theme customization',
      'Create onboarding tutorial flow',
      'Build admin panel for content management',
      'Implement rate limiting and security headers',
      'Add export functionality (PDF/CSV)',
      'Configure error tracking and monitoring',
    ];

    for (let ti = 0; ti < teams.length; ti++) {
      const project = internshipProjects[ti];
      const team = teams[ti];
      const teamMembers = await InternshipTeamMember.find({ teamId: team._id });

      if (teamMembers.length === 0) continue;

      // Sprint 1
      const sprint1 = await InternshipSprint.create({
        projectId: project._id,
        teamId: team._id,
        title: 'Sprint 1: Foundation & Core Setup',
        goal: 'Project scaffolding, authentication, and core data layer.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        order: 1,
      });

      // Sprint 2
      const sprint2 = await InternshipSprint.create({
        projectId: project._id,
        teamId: team._id,
        title: 'Sprint 2: Feature Development',
        goal: 'Implement core features, UI, and integrations.',
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: 'planning',
        order: 2,
      });

      // Create tasks for Sprint 1
      for (let i = 0; i < 12; i++) {
        const status: 'done' | 'in_progress' | 'todo' = i < 5 ? 'done' : (i < 9 ? 'in_progress' : 'todo');
        const priority = (['high', 'medium', 'low'] as const)[i % 3];
        const assignee = teamMembers[i % teamMembers.length];

        const task = await InternshipTask.create({
          projectId: project._id,
          teamId: team._id,
          sprintId: sprint1._id,
          title: taskThemes[i % taskThemes.length],
          description: `Sprint 1 task for ${project.title}: ${taskThemes[i % taskThemes.length].toLowerCase()}. Estimated effort: ${2 + (i % 3)} days.`,
          priority,
          status,
          taskType: i % 4 === 0 ? 'feature' as const : 'task' as const,
          order: i,
          assigneeId: assignee.userId,
          labels: ['sprint-1', project.title.toLowerCase().replace(/\s+/g, '-')],
        });

        if (status === 'done') {
          task.approvedBy = admin._id; // Admin approves tasks
          task.approvedAt = new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000);
          await task.save();

          await InternshipActivityLog.create({
            userId: assignee.userId,
            action: 'COMPLETED',
            module: 'InternshipTask',
            targetType: 'InternshipTask',
            targetId: task._id,
            details: `Task "${taskThemes[i % taskThemes.length]}" completed and approved by ${admin.fullName}.`,
          });
        }

        // Add admin comments on some tasks
        if (i % 4 === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: assignee.userId,
            content: `Starting work on this task. Initial research and setup in progress.`,
          });
        }
        if (i === 0) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: admin._id, // Admin comments on first task
            content: `Great work on this! The implementation is clean. I've left a few suggestions in the PR review. Keep it up!`,
          });
        }
        if (i === 2) {
          await InternshipComment.create({
            taskId: task._id,
            authorId: admin._id,
            content: `Please ensure proper error handling and input validation. Let me know if you need clarification on the requirements.`,
          });
        }
      }

      // Create tasks for Sprint 2
      for (let i = 0; i < 6; i++) {
        const assignee = teamMembers[i % teamMembers.length];
        await InternshipTask.create({
          projectId: project._id,
          teamId: team._id,
          sprintId: sprint2._id,
          title: taskThemes[(i + 12) % taskThemes.length],
          description: `Sprint 2 task for ${project.title}: ${taskThemes[(i + 12) % taskThemes.length].toLowerCase()}.`,
          priority: 'medium' as const,
          status: 'todo',
          taskType: i % 3 === 0 ? 'feature' as const : 'task' as const,
          order: i,
          assigneeId: assignee.userId,
          labels: ['sprint-2'],
        });
      }

      const teamCfg = teamConfigs[ti];
      console.log(`   ✅ "${teamCfg.name}": 2 sprints, 18 tasks, admin-approved`);
    }

    // ── Create Milestone Submissions ──
    console.log('\n📤 Creating milestone submissions...');
    const allMilestones = await InternshipMilestone.find({ completed: true });
    for (let i = 0; i < Math.min(allMilestones.length, 3); i++) {
      const milestone = allMilestones[i];
      const project = internshipProjects.find((p: any) => p._id.toString() === milestone.internshipProjectId.toString());
      const team = teams.find((t: any) => t.internshipProjectId.toString() === milestone.internshipProjectId.toString());

      if (project && team) {
        const teamMembers = await InternshipTeamMember.find({ teamId: team._id });
        const submission = await InternshipSubmission.create({
          milestoneId: milestone._id,
          teamId: team._id,
          userId: teamMembers[0]?.userId,
          contentUrl: `https://drive.google.com/${project.title.toLowerCase().replace(/\s+/g, '-')}-ms-${milestone.order}`,
          description: `Completed "${milestone.title}" - includes code, documentation, and demo video.`,
          status: 'approved',
          feedback: `Approved by ${admin.fullName}. Excellent work on this milestone!`,
        });

        await InternshipActivityLog.create({
          userId: teamMembers[0]?.userId,
          action: 'SUBMITTED',
          module: 'InternshipMilestone',
          targetType: 'InternshipSubmission',
          targetId: milestone._id,
          details: `Submitted deliverable for "${milestone.title}"`,
        });

        await InternshipMentorFeedback.create({
          mentorId: admin._id,
          userId: teamMembers[0]?.userId,
          teamId: team._id,
          score: 8 + (i % 3),
          comments: `Strong performance on ${milestone.title}. Code quality, documentation, and teamwork are commendable.`,
        });
      }
    }
    console.log(`   ✅ Submissions & mentor feedback by admin`);

    // ── Time Logs ──
    console.log('\n⏱️  Creating time logs...');
    for (const team of teams.slice(0, 2)) {
      const teamMembers = await InternshipTeamMember.find({ teamId: team._id });
      for (const member of teamMembers) {
        for (let d = 0; d < 4; d++) {
          await InternshipTimeLog.create({
            userId: member.userId,
            teamId: team._id,
            description: `Working on sprint tasks and project deliverables for team project`,
            minutes: 90 + Math.floor(Math.random() * 90),
            date: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
          });
        }
      }
    }
    console.log(`   ✅ Time logs created`);

    // ── Certificates ──
    console.log('\n🎓 Creating certificates...');
    if (teams.length > 0) {
      const team = teams[0];
      const project = internshipProjects.find((p: any) => p._id.toString() === team.internshipProjectId.toString());
      if (project) {
        const teamMembers = await InternshipTeamMember.find({ teamId: team._id });
        for (const member of teamMembers) {
          const student = await User.findById(member.userId);
          if (!student) continue;

          await InternshipCertificate.create({
            userId: member.userId,
            internshipProgramId: program._id,
            teamId: team._id,
            issuedAt: new Date(),
            trainerId: admin._id,
            trainerName: admin.fullName || admin.username,
            trainerSignature: 'Electronically signed by admin',
            internTitle: member.role,
            programTitle: program.title,
            duration: program.duration,
            startDate: program.startDate,
            endDate: program.endDate,
            completionDate: new Date(),
            isRevoked: false,
            metadata: {
              milestonesCompleted: 2,
              totalMilestones: 5,
              finalGrade: 'A',
              skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Teamwork'],
            },
          });
        }
        console.log(`   ✅ ${teamMembers.length} certificates issued by admin`);
      }
    }

    // ── Payments & Invoices for approved apps ──
    console.log('\n💰 Creating payments and invoices...');
    const approvedForPayment = internshipApplications.filter((a: any) => a.status === 'approved');
    for (const app of approvedForPayment) {
      const payment = await InternshipPayment.create({
        userId: app.userId,
        internshipProgramId: program._id,
        amount: program.price - (program.price * (program.discount || 0) / 100),
        currency: program.currency,
        status: 'paid',
        paymentMethod: 'Mobile Money',
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const invIdx = approvedForPayment.indexOf(app);
      await InternshipInvoice.create({
        paymentId: payment._id,
        invoiceNumber: `INV-${year}${month}-${String(invIdx + 1).padStart(4, '0')}`,
        userId: app.userId,
        internshipProgramId: program._id,
        amount: payment.amount,
        currency: program.currency,
        issuedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'paid' as const,
        items: [{ description: `${program.title} - Program Fee`, quantity: 1, unitPrice: payment.amount, total: payment.amount }],
      });
    }
    console.log(`   ✅ ${approvedForPayment.length} payments & invoices created`);

    // ── Internship Meetings ──
    console.log('\n📅 Creating internship meetings...');
    const meetingsData = [
      { title: 'Weekly Standup with Admin', type: 'WEEKLY' as const, startHour: 10, endHour: 11 },
      { title: 'Sprint Planning & Review', type: 'WEEKLY' as const, startHour: 14, endHour: 15 },
      { title: 'Admin Q&A Session', type: 'WEEKLY' as const, startHour: 9, endHour: 10 },
    ];

    for (const md of meetingsData) {
      await InternshipMeeting.create({
        title: md.title,
        description: `Regular ${md.title.toLowerCase()} for all teams, hosted by ${admin.fullName}`,
        type: md.type,
        deliveryMode: 'online',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        startTime: new Date(new Date().setHours(md.startHour, 0, 0, 0)),
        endTime: new Date(new Date().setHours(md.endHour, 0, 0, 0)),
        teamIds: teams.map((t: any) => t._id),
        userIds: [],
        mentorIds: [admin._id, ...trainers.map((t: any) => t._id)],
        hostId: admin._id,
        status: 'confirmed'
      });
    }
    console.log(`   ✅ ${meetingsData.length} recurring meetings hosted by admin`);

    // ====================================================================
    // PHASE C — CLIENT BOOKINGS
    // ====================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📅 PHASE C: CLIENT BOOKINGS');
    console.log('='.repeat(60));

    console.log('\n🧹 Clearing existing bookings...');
    await Booking.deleteMany({});
    console.log('   ✅ Cleared');

    console.log('\n📅 Creating client bookings...');
    const bookingTypes = ['Project Review', 'Sprint Demo', 'Requirements Workshop', 'Stakeholder Meeting', 'Handover Planning'];
    for (let bi = 0; bi < clients.length * 2; bi++) {
      const client = clients[bi % clients.length];
      const dayOffset = [2, 4, 7, 10, 14, 21][bi % 6];
      const bookingDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const hour = 9 + (bi % 8);

      await Booking.create({
        userId: client._id,
        mentorId: trainers[bi % trainers.length]._id,
        type: bookingTypes[bi % bookingTypes.length],
        date: bookingDate.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:00`,
        topic: `${bookingTypes[bi % bookingTypes.length]} — ${client.company || client.fullName}`,
        notes: `Discussing project progress and next milestones for ${projectProposals[bi % projectProposals.length].title}.`,
        status: bi < 4 ? 'confirmed' : 'pending',
        deliveryMode: 'online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      });
    }
    console.log(`   ✅ ${clients.length * 2} bookings created`);

    // ====================================================================
    // SUMMARY
    // ====================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY — Full Project Management');
    console.log('='.repeat(60));
    console.log(`   👤 Admin:               ${admin.fullName || admin.username} (${admin._id})`);
    console.log(`   👨‍🏫 Trainers:            ${trainers.length}`);
    console.log(`   🎓 Students:            ${students.length}`);
    console.log(`   👤 Clients:             ${clients.length}`);
    console.log('');
    console.log('   📋 PROJECT LIFECYCLE:');
    console.log(`      Stage 1: App Submitted:    ${applications.length}`);
    console.log(`      Stage 2: Under Review:     ✅`);
    console.log(`      Stage 3: Approved:         ✅`);
    console.log(`      Stage 4: NDAs Signed:      ${await ProjectNDA.countDocuments({ status: 'signed' })}`);
    console.log(`      Stage 5: Projects Created: ${projectRecords.length}`);
    console.log(`      Stage 6: Onboardings:      ${await ProjectOnboarding.countDocuments()}`);
    console.log(`      Stage 7: Evaluations:      ${projectRecords.filter(p => p.evaluation?.clientFeedback).length}`);
    console.log('');
    console.log('   🏫 INTERNSHIP MODULE:');
    console.log(`      Program:                  1 (with ${phases.length} phases)`);
    console.log(`      Applications:             ${internshipApplications.length}`);
    console.log(`       - Phase Submissions:     ${await ApplicationPhaseSubmission.countDocuments()}`);
    console.log(`      Projects:                 ${internshipProjects.length}`);
    console.log(`      Teams:                    ${teams.length}`);
    console.log(`      Team Members:             ${await InternshipTeamMember.countDocuments()}`);
    console.log(`      Milestones:               ${await InternshipMilestone.countDocuments()}`);
    console.log(`      Sprints:                  ${await InternshipSprint.countDocuments()}`);
    console.log(`      Tasks:                    ${await InternshipTask.countDocuments()}`);
    console.log(`      Comments:                 ${await InternshipComment.countDocuments()}`);
    console.log(`      Payments:                 ${await InternshipPayment.countDocuments()}`);
    console.log(`      Invoices:                 ${await InternshipInvoice.countDocuments()}`);
    console.log(`      Submissions:              ${await InternshipSubmission.countDocuments()}`);
    console.log(`      Time Logs:                ${await InternshipTimeLog.countDocuments()}`);
    console.log(`      Mentor Feedback:          ${await InternshipMentorFeedback.countDocuments()}`);
    console.log(`      Certificates:             ${await InternshipCertificate.countDocuments()}`);
    console.log(`      Meetings:                 ${await InternshipMeeting.countDocuments()}`);
    console.log(`      Activity Logs:            ${await InternshipActivityLog.countDocuments()}`);
    console.log('');
    console.log('   📅 BOOKINGS:');
    console.log(`      Total:                    ${await Booking.countDocuments()}`);
    console.log('');
    console.log('   🔗 ADMIN ASSIGNMENTS:');
    console.log(`      - Mentor on ${projectRecords.length} projects`);
    console.log(`      - Mentor on ${teams.length} internship teams`);
    console.log(`      - Reviewer for all applications & submissions`);
    console.log(`      - Certificate issuer & meeting host`);
    console.log('');
    console.log('='.repeat(60));
    console.log('🔑 Default login: password123 for all users\n');
    console.log('✅ Full Project Management seed completed successfully!');
    console.log('🌱 Happy testing! 🚀\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedFullProjectManagement();
