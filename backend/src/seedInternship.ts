import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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
import connectDB from './config/db';

dotenv.config();

const DEFAULT_WORKFLOW: any = [
  { id: 'todo', label: 'To Do', color: 'slate', order: 0, type: 'todo' },
  { id: 'in_progress', label: 'In Progress', color: 'blue', order: 1, type: 'progress' },
  { id: 'in_testing', label: 'In Testing', color: 'orange', order: 2, type: 'testing' },
  { id: 'in_review', label: 'In Review', color: 'purple', order: 3, type: 'review' },
  { id: 'done', label: 'Done', color: 'yellow', order: 4, type: 'done' },
  { id: 'staged', label: 'Staged', color: 'cyan', order: 5, type: 'staged' },
  { id: 'completed', label: 'Completed', color: 'green', order: 6, type: 'completed' },
];

const RICH_PROJECT_DOC = `
# Eco-Friendly E-commerce Mobile App
## Unified Vision & Implementation Specification

### 1. Executive Summary & Core Mission
In an era where consumer choices significantly impact global climate trends, the **Eco-Friendly E-commerce Mobile App** serves as a bridge between sustainable production and conscious consumption. Our mission is to democratize access to green products while providing transparent, data-driven insights into the environmental footprint of every purchase.

Traditional e-commerce platforms often mask the destructive logistics and packaging wastes associated with rapid fulfillment. This project flips the script by making sustainability a first-class citizen in the user experience, rewarding patience (slower, consolidated shipping) and localized sourcing.

### 2. Market Landscape & Opportunity
The sustainable goods market has seen a 71% increase in popularity globally over the past five years. However, "greenwashing" remains a major barrier to trust. Our platform addresses this through:
- **Verified Eco-Badges**: Rigorous onboarding for vendors based on ISO 14001 and Fair Trade standards.
- **Transparency-as-a-Service**: Every product listing includes a breakdown of its carbon cost from factory to front door.
- **Community-Driven Curation**: A peer-review system that focuses on the longevity and recyclability of items.

### 3. Detailed Feature Ecosystem

#### 3.1 Advanced Carbon Footprint Engine
Built on a Python-powered microservice, our engine calculates emissions based on:
- **Manufacturing energy source** (Renewable vs. Fossil).
- **Material lifecycle** (Biodegradable, Recycled, or Virgin).
- **Logistics distance** using real-time geospatial data from MapBox/Leaflet.

#### 3.2 Gamified Sustainability Rewards
To keep users engaged, we implement a "Leaf Points" system:
- Users earn points by choosing "Climate Neutral" shipping.
- Points can be redeemed for carbon-offset certificates or discounts at premium eco-vendors.
- Social leaderboards for teams and friends to foster healthy competition in reducing collective footprints.

#### 3.3 Circular Economy - The "Re-Life" Hub
Integrated into the mobile app is a peer-to-peer resale market. When a user buys a product on our platform, it is automatically added to their digital closet. Once they no longer need it, they can list it for resale with a single tap, preserving the item's lifecycle and reducing landfill waste.

### 4. Technical Architecture Overview

#### 4.1 Frontend - The Native Experience
We utilize **React Native** with **NativeWind (Tailwind CSS)** to ensure a high-performance, fluid UI across both iOS and Android. The design language focuses on "Soft Professionalism," utilizing earthy tones (Sage, Stone, Ochre) and elegant typography.

#### 4.2 Backend - GraphQL & Microservices
Centralized through an **Apollo GraphQL** gateway, our backend consists of:
- **Auth Service**: Firebase-backed secure authentication with role-based access.
- **Product Engine**: MongoDB-powered search with elastic indexing.
- **Estimation Service**: A high-performance Python API for real-time carbon math.

#### 4.3 Scalability & Performance
- **Global CDN**: Assets served via Edge locations for minimal latency.
- **Real-time Sync**: Pusher integration for live order tracking and team collaboration updates.
- **Infrastructure as Code**: Terraform-managed AWS instances for reliable development and production parity.

### 5. Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-2)
- Environment setup, database modeling, and basic authentication.
- Repository initialization and CI/CD pipeline configuration.

#### Phase 2: Core Marketplace (Weeks 3-5)
- Vendor catalog implementation.
- Search and filtering by sustainability badges.
- Initial Carbon Footprint calculation logic.

#### Phase 3: Social & Rewards (Weeks 6-8)
- Reward point logic and dashboard UI.
- Social sharing and team leaderboards.
- Beta testing of the checkout flow.

#### Phase 4: Circular Economy & Polish (Weeks 9-11)
- Deployment of the "Re-Life" peer-to-peer hub.
- Performance optimization and accessibility (WCAG 2.1) audit.
- Final security hardening.

#### Phase 5: Launch (Week 12)
- App Store / Play Store submission.
- Marketing campaign rollout and community onboarding.

---
*Authored by the IHUB Visionary Team - April 2026*
`;

const seedInternshipData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing internship data...');
    await InternshipProgram.deleteMany({});
    await InternshipApplication.deleteMany({});
    await InternshipProject.deleteMany({});
    await InternshipTeam.deleteMany({});
    await InternshipTeamMember.deleteMany({});
    await InternshipMilestone.deleteMany({});
    await InternshipSprint.deleteMany({});
    await InternshipTask.deleteMany({});
    await InternshipActivityLog.deleteMany({});
    await InternshipComment.deleteMany({});

    console.log('👤 Ensuring specialized scenario users...');
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const mentor = await User.findOneAndUpdate(
      { username: 'innovator_john' },
      { username: 'innovator_john', email: 'john@innovator.tech', password, role: 'trainer', fullName: 'John Innovation' },
      { upsert: true, new: true }
    );

    const lead = await User.findOneAndUpdate(
      { username: 'student_alice' },
      { username: 'student_alice', email: 'alice@ihub.com', password, role: 'student', fullName: 'Alice Peterson' },
      { upsert: true, new: true }
    );

    const dev1 = await User.findOneAndUpdate(
      { username: 'student_bob' },
      { username: 'student_bob', email: 'bob@ihub.com', password, role: 'student', fullName: 'Bob Builder' },
      { upsert: true, new: true }
    );

    const dev2 = await User.findOneAndUpdate(
      { username: 'alex.johnson' },
      { username: 'alex.johnson', email: 'alex@ihub.com', password, role: 'student', fullName: 'Alex Johnson' },
      { upsert: true, new: true }
    );

    console.log('🚀 Seeding High-Impact Program...');
    const program = new InternshipProgram({
      title: 'Sustainable Tech Internship 2026',
      description: 'A 3-month intensive hands-on internship focusing on Eco-conscious Full-Stack Development.',
      duration: '3 Months',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      applicationDeadline: new Date('2026-05-15'),
      eligibility: ['Passionate about sustainability', 'React/Node familiarity'],
      rules: 'Code with impact. Respect the environment.',
      price: 0,
      currency: 'RWF',
      status: 'active'
    });
    await program.save();

    console.log('🏗️ Seeding Alpha Project with Massive Documentation...');
    const project = new InternshipProject({
      internshipProgramId: program._id,
      title: 'Eco-Friendly E-commerce Mobile App',
      description: 'Design and build a next-gen sustainable shopping platform.',
      document: RICH_PROJECT_DOC,
      requiredSkills: ['React Native', 'GraphQL', 'Tailwind CSS', 'Mongoose'],
      teamSizeRange: { min: 3, max: 5 },
      status: 'published',
      workflow: DEFAULT_WORKFLOW,
      objectives: [
        "Develop carbon footprint tracking algorithm",
        "Implement vendor sustainability verification",
        "Create gamified user rewards system",
        "Enable localized sourcing API"
      ]
    });
    await project.save();

    console.log('🏆 Seeding Strategic Milestones...');
    const milestones = [
      { title: "Conceptual Design & Research", desc: "Foundational phase for market fit.", days: 14 },
      { title: "UI/UX Prototyping", desc: "Visual language and user flow mapping.", days: 28 },
      { title: "MVP Development (Sprint 1-2)", desc: "Core e-commerce engine build.", days: 56 },
      { title: "Integration & Beta Testing", desc: "Full feature sync and QA.", days: 70 },
      { title: "Production Launch", desc: "Automated deployment and store submission.", days: 90 }
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

    console.log('👥 Seeding Alpha Architects Team...');
    const team = new InternshipTeam({
      name: 'Alpha Architects (Tech)',
      internshipProjectId: project._id,
      internshipProgramId: program._id,
      mentorId: mentor._id,
      status: 'active',
      type: 'team'
    });
    await team.save();

    const members = [
        { user: lead, role: 'Team Lead' },
        { user: dev1, role: 'Developer' },
        { user: dev2, role: 'Developer' }
    ];

    for (const m of members) {
        await new InternshipTeamMember({
            teamId: team._id,
            userId: m.user._id,
            role: m.role
        }).save();
    }

    const sprint = new InternshipSprint({
        projectId: project._id,
        teamId: team._id,
        title: 'Sprint 1: Technical Foundations',
        goal: 'Project setup and initial eco-estimation API.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        order: 1
    });
    await sprint.save();

    console.log('📝 Generating 30 Specialized Tasks for Alice...');
    const taskThemes = [
        "Configure project boilerplate with Expo and TypeScript",
        "Audit existing carbon assessment libraries",
        "Design user schema for sustainability tracking",
        "Build Eco-Badge verification middleware",
        "Implement GraphQL endpoint for product search",
        "Create responsive product card component",
        "Develop carbon-neutral delivery estimation logic",
        "Integrate Stripe for climate-positive payments",
        "Refine navigation flow for marketplace",
        "Optimise image loading for low-bandwidth regions",
        "Fix authentication redirect loop",
        "Add unit tests for sustainability calculations",
        "Set up Docker environments for dev team",
        "Create documentation for microservice API",
        "Research local sourcing partnerships in Kigali",
        "Implement dark mode with eco-green accents",
        "Develop rewards dashboard for user profiles",
        "Audit mobile performance on low-end devices",
        "Integrate Google Maps for localized vendor search",
        "Build prototype for circular economy resale hub",
        "Refactor database queries for faster lookups",
        "Implement real-time push notifications for eco-sales",
        "Create tutorial screens for first-time users",
        "Setup CI/CD pipeline on GitHub Actions",
        "Develop administrative dashboard for mentors",
        "Audit accessibility (a11y) across the app",
        "Incorporate user feedback from wireframe sessions",
        "Deploy beta version to TestFlight",
        "Coordinate production launch strategy",
        "Write project summary for graduation showcase"
    ];

    for (let i = 0; i < taskThemes.length; i++) {
        const status = i < 10 ? 'done' : (i < 20 ? 'in_progress' : 'todo');
        const priority = ['high', 'medium', 'low'][i % 3];

        const task = new InternshipTask({
            projectId: project._id,
            teamId: team._id,
            sprintId: i < 15 ? sprint._id : undefined,
            title: taskThemes[i],
            description: `Professional deliverable for the ${project.title}: Developing ${taskThemes[i].toLowerCase()}.`,
            priority,
            status,
            taskType: i % 4 === 0 ? 'feature' : 'task',
            order: i,
            assigneeId: lead._id,
            labels: ['eco', 'sprint-1', 'lead']
        });
        await task.save();

        if (status === 'done') {
            await new InternshipActivityLog({
                userId: lead._id,
                action: 'COMPLETED',
                module: 'InternshipTask',
                targetType: 'InternshipTask',
                targetId: task._id,
                details: `Finished working on "${task.title}".`
            }).save();
        }
    }

    console.log('✅ Rich scenario seeded for Alpha Architects!');
    console.log('🔑 Alice Login: student_alice / password123');
    console.log('🔑 Mentor Login: innovator_john / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding internship data:', error);
    process.exit(1);
  }
};

seedInternshipData();
