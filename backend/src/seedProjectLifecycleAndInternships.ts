import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from './config/db';
import { User } from './models/User';
import { ProjectApplication } from './models/ProjectApplication';
import { ProjectNDA } from './models/ProjectNDA';
import { ProjectOnboarding } from './models/ProjectOnboarding';
import { Project } from './models/Project';
import { Internship } from './models/Internship';
import { ProjectLifecycleService } from './services/project-lifecycle.service';

// ──────────────────────────────────────────────
// Helper to generate a crypto-like signature hash
// ──────────────────────────────────────────────
function fakeSignatureHash(seed: string): string {
  // Simple reproducible hash for dev seeds
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
async function seedProjectLifecycleAndInternships() {
  try {
    await connectDB();
    console.log('🌱 Starting comprehensive seed...\n');

    // ====== STEP 1: Clear existing data to avoid conflicts ======
    console.log('🧹 Clearing existing project lifecycle & internship data...');
    await ProjectApplication.deleteMany({});
    await ProjectNDA.deleteMany({});
    await ProjectOnboarding.deleteMany({});
    await Project.deleteMany({});
    await Internship.deleteMany({});
    // Remove previously seeded clients
    await User.deleteMany({ role: 'client' });
    console.log('✅ Cleared old data\n');

    // ====== STEP 2: Load existing users from DB ======
    console.log('📦 Loading existing users from database...');

    const students = await User.find({ role: 'student' }).limit(14);
    const trainers = await User.find({ role: { $in: ['trainer'] } }).limit(3);
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).limit(4);

    if (students.length < 5) {
      console.error('❌ Need at least 5 students in DB to run this seed. Found:', students.length);
      process.exit(1);
    }

    console.log(`   Found ${students.length} students, ${trainers.length} trainers, ${admins.length} admins`);

    const mentor = trainers[0] || admins[0];
    const mentor2 = trainers.length > 1 ? trainers[1] : (admins.length > 1 ? admins[1] : mentor);

    // ====== STEP 3: Create client users ======
    console.log('\n👤 Creating client users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const clientData = [
      { username: 'client_rwanda', fullName: 'Emmanuel Habimana', email: 'emmanuel@greentech.rw', company: 'GreenTech Rwanda Ltd' },
      { username: 'client_shine', fullName: 'Jeanne Uwimana', email: 'jeanne@shine.rw', company: 'Shine Academy' },
      { username: 'client_afriq', fullName: 'Patrick Mugisha', email: 'patrick@afriqinnovate.rw', company: 'AfriqInnovate' },
    ];

    const clients: any[] = [];
    for (const cd of clientData) {
      const client = await User.create({
        ...cd,
        role: 'client',
        password: hashedPassword,
        phone: '+25078' + Math.floor(1000000 + Math.random() * 9000000),
        location: 'Kigali, Rwanda',
        bio: `Founder at ${cd.company}`,
        status: 'active',
        isEmailVerified: true,
      });
      clients.push(client);
      console.log(`   ✅ Created client: ${cd.fullName} (@${cd.username})`);
    }

    // ====== STEP 4: Project Lifecycle — Submit Applications ======
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
        description: 'An e-commerce platform connecting local artisans with global buyers. Features include product catalogs, secure payments via mobile money, shipping logistics, and vendor analytics.',
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

    // ====== STEP 5: Review and Approve Applications ======
    console.log('\n🔍 Reviewing applications...');

    const adminUser = admins[0];
    const reviewStatuses = ['under_review', 'approved'];
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      // First mark as under_review
      app.status = 'under_review';
      app.reviewNotes = `Reviewed by ${adminUser.fullName || adminUser.username}. Looks promising.`;
      await app.save();

      // Then approve (and create NDA)
      app.status = 'approved';
      app.reviewNotes = `Approved by ${adminUser.fullName || adminUser.username}. Project scope is well-defined.`;
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

    // ====== STEP 6: Sign NDAs ======
    console.log('\n✍️  Signing NDAs...');

    const signedNDAs: any[] = [];
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

      // Mark application as NDA signed
      if (app) {
        app.ndaSigned = true;
        await app.save();
      }
      signedNDAs.push(nda);
      console.log(`   ✅ NDA signed for: "${app?.title || 'Unknown'}"`);
    }

    // ====== STEP 7: Initialize Projects from Applications ======
    console.log('\n🚀 Initializing projects...');

    const courseNames = [
      'Full Stack Web Development',
      'Mobile App Development',
      'Software Engineering Bootcamp',
      'Advanced Data Science',
      'Cloud & DevOps Engineering',
    ];

    // Assign students to projects (2-3 per project)
    const studentPool = [...students];

    const projectRecords: any[] = [];
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];

      // Pick 2-3 students for this project
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
        mentors: [mentor._id, mentor2._id],
        team: teamStudents.map(s => ({
          userId: s._id,
          name: s.fullName || s.username,
          role: i % 2 === 0 ? 'Frontend Developer' : 'Backend Developer',
        })),
        tasks: [
          { id: new mongoose.Types.ObjectId().toString(), title: 'Set up project repository and CI/CD', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Design database schema', completed: true, approved: true, category: 'Backend' },
          { id: new mongoose.Types.ObjectId().toString(), title: 'Build authentication system', completed: false, category: 'Backend' },
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
              status: 'approved',
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
              status: 'pending',
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
      console.log(`   📦 Created project: "${project.title}" with ${teamStudents.map(s => s.fullName || s.username).join(', ')}`);

      // ====== STEP 7b: Onboard developers ======
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
            { task: 'Complete first assigned task', completed: ti === 0 ? true : false, completedAt: ti === 0 ? new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Attend team standup meetings', completed: ti === 0, completedAt: ti === 0 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : undefined },
            { task: 'Submit onboarding feedback', completed: false },
          ],
        });
        console.log(`      👤 Onboarded ${student.fullName || student.username} as ${ti === 0 ? 'Team Lead' : 'Developer'}`);
      }

      // ====== STEP 7c: Add evaluations for some projects ======
      if (i < 3) {
        const clientUser = clients.find(c => c._id.toString() === app.clientId.toString());

        // Client evaluation
        project.evaluation = {
          clientFeedback: {
            rating: 4 + (i % 2),
            comment: [
              'The team is doing an excellent job. Communication is clear and deliverables are on time.',
              'Good progress so far. Looking forward to the MVP completion. Minor UX improvements needed.',
              'Very impressed with the quality of work. The team has exceeded expectations.',
            ][i],
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          developerEvaluations: teamStudents.slice(0, 2).map((s, si) => ({
            developerId: s._id,
            rating: 5 - si,
            notes: si === 0 ? 'Strong leadership and technical skills.' : 'Good team player, delivers on time.',
          })),
          reviewerNotes: `Project is on track. Mentor ${mentor.fullName || mentor.username} reports good progress.`,
        };
        await project.save();
        console.log(`      ⭐ Added evaluation data for "${project.title}"`);
      }
    }

    // ====== STEP 8: Seed Individual Internship Records ======
    console.log('\n🎓 Seeding internship records for existing students...');

    // Pick 10 students for internships
    const internStudents = students.slice(0, 10);

    const statuses: Array<'eligible' | 'enrolled' | 'in_progress' | 'completed' | 'graduated'>[] = [
      ['eligible', 'enrolled', 'in_progress', 'completed', 'graduated'],
      ['enrolled', 'in_progress', 'completed'],
      ['eligible', 'enrolled', 'in_progress'],
      ['in_progress', 'completed', 'graduated'],
    ];

    const internshipTitles = [
      'Full Stack Web Development Internship',
      'Mobile App Development Internship',
      'Data Science & AI Internship',
      'Cloud & DevOps Engineering Internship',
      'Frontend Development Internship',
      'Backend Development Internship',
      'UI/UX Design Internship',
      'Software Quality Assurance Internship',
      'Cybersecurity Internship',
      'Product Management Internship',
    ];

    const stageNames = [
      'Stage 1: Orientation & Onboarding',
      'Stage 2: Core Skills Development',
      'Stage 3: Project Implementation',
      'Stage 4: Advanced Topics',
      'Stage 5: Capstone Project',
      'Stage 6: Graduation & Career Prep',
    ];

    const createdInternships: any[] = [];

    for (let i = 0; i < internStudents.length; i++) {
      const student = internStudents[i];
      const titleIdx = i % internshipTitles.length;
      const statusSet = statuses[i % statuses.length];
      const status = statusSet[i % statusSet.length];

      // Determine stage based on status
      let currentStage = 1;
      let completedStages: string[] = [];
      let progress = 0;

      if (status === 'enrolled') {
        currentStage = 1;
        completedStages = [];
        progress = 5;
      } else if (status === 'in_progress') {
        currentStage = 2 + (i % 3);
        completedStages = stageNames.slice(0, currentStage - 1);
        progress = 20 + (i * 8);
      } else if (status === 'completed' || status === 'graduated') {
        currentStage = 6;
        completedStages = [...stageNames];
        progress = 100;
      }

      // Milestones based on progress
      const milestones = [
        { title: 'Orientation & Setup', completed: currentStage > 1, date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) },
        { title: 'Core Skills Assessment', completed: currentStage > 2, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        { title: 'Project Sprint 1', completed: currentStage > 3, date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { title: 'Project Sprint 2', completed: currentStage > 4, date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { title: 'Final Project Submission', completed: currentStage > 5, date: new Date() },
      ].filter(m => m.completed || status !== 'eligible');

      // Tasks based on progress
      const allTasks = [
        { title: 'Complete onboarding forms', status: 'completed' as const, priority: 'high' as const },
        { title: 'Set up development environment', status: 'completed' as const, priority: 'high' as const },
        { title: 'Complete Git & GitHub training', status: completedStages.length >= 1 ? 'completed' as const : 'in_progress' as const, priority: 'medium' as const },
        { title: 'Build REST API endpoint', status: completedStages.length >= 2 ? 'completed' as const : (currentStage >= 2 ? 'in_progress' as const : 'pending' as const), priority: 'high' as const },
        { title: 'Implement frontend components', status: completedStages.length >= 3 ? 'completed' as const : (currentStage >= 3 ? 'in_progress' as const : 'pending' as const), priority: 'high' as const },
        { title: 'Write unit tests', status: completedStages.length >= 3 ? 'completed' as const : (currentStage >= 3 ? 'in_progress' as const : 'pending' as const), priority: 'medium' as const },
        { title: 'Database optimization', status: completedStages.length >= 4 ? 'completed' as const : (currentStage >= 4 ? 'in_progress' as const : 'pending' as const), priority: 'medium' as const },
        { title: 'Deploy to production', status: completedStages.length >= 5 ? 'completed' as const : (currentStage >= 4 ? 'in_progress' as const : 'pending' as const), priority: 'high' as const },
        { title: 'Prepare final presentation', status: completedStages.length >= 5 ? 'completed' as const : (currentStage >= 5 ? 'in_progress' as const : 'pending' as const), priority: 'medium' as const },
        { title: 'Submit graduation portfolio', status: status === 'graduated' ? 'completed' as const : 'pending' as const, priority: 'high' as const },
      ];

      const activeTasks = allTasks.filter(t =>
        status === 'eligible' ? t.title === 'Complete onboarding forms' || t.title === 'Set up development environment' : true
      );

      // Meetings
      const meetings: Array<{ title: string; time: string; type: 'recurring' | 'upcoming' | 'past' }> = [
        { title: 'Weekly Team Standup', time: 'Monday 10:00 AM', type: 'recurring' },
        { title: 'One-on-One with Mentor', time: 'Wednesday 2:00 PM', type: 'recurring' },
      ];

      if (status === 'in_progress' || status === 'completed' || status === 'graduated') {
        meetings.push({ title: 'Sprint Review', time: 'Friday 11:00 AM', type: 'recurring' });
      }

      if (status === 'completed' || status === 'graduated') {
        meetings.push({ title: 'Graduation Ceremony', time: 'June 15, 2026 10:00 AM', type: 'past' });
      }

      // Sprint reviews
      const sprintReviews: any[] = [];
      if (completedStages.length >= 2) {
        sprintReviews.push({
          week: 1,
          grade: 75 + (i * 2),
          feedback: 'Good start. Focus on code quality and documentation.',
          reviewedBy: mentor._id,
          date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        });
      }
      if (completedStages.length >= 3) {
        sprintReviews.push({
          week: 2,
          grade: 80 + (i * 1),
          feedback: 'Improving well. Keep up the good work on the project features.',
          reviewedBy: mentor._id,
          date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        });
      }
      if (completedStages.length >= 4) {
        sprintReviews.push({
          week: 3,
          grade: 85 + (i % 3),
          feedback: 'Excellent progress. Ready for advanced topics.',
          reviewedBy: mentor._id,
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        });
      }

      const internship = await Internship.create({
        userId: student._id,
        title: internshipTitles[titleIdx],
        organization: 'Ihub Academy',
        company: 'Ihub',
        cohort: 'Cohort 2026-A',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: status === 'completed' || status === 'graduated'
          ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        duration: '3 Months',
        type: status === 'eligible' ? 'Online' : (i % 2 === 0 ? 'Hybrid' : 'Remote'),
        status,
        stage: stageNames[currentStage - 1],
        currentStage,
        completedStages,
        projects: [],
        mentorId: mentor._id,
        mentors: [mentor._id, mentor2._id],
        payment: {
          amount: status === 'eligible' || status === 'enrolled' ? 0 : 50000,
          currency: 'RWF',
          status: status === 'completed' || status === 'graduated' ? 'paid' : (status === 'in_progress' ? 'installment' : 'pending'),
          paidAt: status === 'completed' || status === 'graduated' ? new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) : undefined,
          isPaidProgram: status !== 'eligible',
          installmentsAllowed: true,
        },
        applicationDetails: {
          background: 'University Student',
          currentLevel: i < 3 ? 'Beginner' : (i < 7 ? 'Junior' : 'Senior'),
          goal: 'To gain practical experience in ' + internshipTitles[titleIdx].toLowerCase().replace(' internship', ''),
          locationPreference: 'Kigali',
        },
        progress,
        milestones,
        tasks: activeTasks,
        meetings,
        sprintReviews: sprintReviews.length > 0 ? sprintReviews : undefined,
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB'].slice(0, 3 + (i % 3)).join(', '),
        phoneNumber: '+25078' + Math.floor(100000 + Math.random() * 900000),
        portfolioUrl: `https://portfolio.${student.username}.io`,
        academicSchool: 'University of Rwanda',
        academicLevel: i < 5 ? 'Year 3' : 'Graduate',
      });

      createdInternships.push(internship);
      console.log(`   🎓 ${status.toUpperCase()}: ${student.fullName || student.username} → ${internshipTitles[titleIdx]} (Stage ${currentStage}/6 - ${progress}%)`);
    }

    // ====== STEP 9: Summary ======
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(60));
    console.log(`   👤 Clients created:         ${clients.length}`);
    console.log(`   📋 Project applications:    ${applications.length}`);
    console.log(`   ✍️  NDAs signed:             ${signedNDAs.length}`);
    console.log(`   📦 Projects initialized:    ${projectRecords.length}`);
    console.log(`   👨‍💻 Developers onboarded:    ${await ProjectOnboarding.countDocuments()}`);
    console.log(`   ⭐ Projects with eval:      ${projectRecords.filter(p => p.evaluation?.clientFeedback).length}`);
    console.log(`   🎓 Internship records:      ${createdInternships.length}`);
    console.log('='.repeat(60));
    console.log('\n🔑 Default login: password123 for all users\n');
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedProjectLifecycleAndInternships();
