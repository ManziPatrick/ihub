import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User';
import { Event } from './models/Event';
import { EventApplication } from './models/EventApplication';
import { InternshipProgram } from './models/internship/InternshipProgram';
import { InternshipApplication } from './models/internship/InternshipApplication';
import connectDB from './config/db';

dotenv.config();

async function seedEventsAndInternships() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // ── 1. Find admin users ──────────────────────────────────────────
    const adminUser = await User.findOne({ email: 'admin@bootskills.com' });
    const superAdmin = await User.findOne({ email: 'superadmin@bootskills.com' });
    const creator = adminUser || superAdmin;

    if (!creator) {
      console.error('❌ No admin user found. Run seedAdminEverything first.');
      process.exit(1);
    }

    console.log(`👤 Using creator: ${creator.email}`);

    // ── 2. Seed Events ───────────────────────────────────────────────
    const eventsData = [
      {
        title: 'Full-Stack Web Development Bootcamp',
        description: 'An intensive 2-week bootcamp covering React, Node.js, TypeScript, and GraphQL. Build a complete real-world application from scratch with mentorship from industry experts. Suitable for intermediate developers looking to level up their skills.',
        shortDescription: 'Intensive 2-week bootcamp covering React, Node.js, TypeScript, and GraphQL',
        type: 'bootcamp',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Kigali, Rwanda',
        isOnline: false,
        meetingLink: '',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 150000,
        currency: 'RWF',
        maxAttendees: 30,
        organizerName: 'Bootskills Academy',
        organizerBio: 'Rwanda\'s leading practical training platform offering courses, internships, and real-world project experience.',
        tags: ['web-development', 'react', 'nodejs', 'typescript', 'full-stack'],
        status: 'published',
        featured: true,
      },
      {
        title: 'AI & Machine Learning Workshop',
        description: 'Hands-on workshop exploring machine learning fundamentals, neural networks, and practical AI applications. Learn to build and deploy ML models using Python, TensorFlow, and scikit-learn.',
        shortDescription: 'Hands-on ML workshop with Python, TensorFlow, and scikit-learn',
        type: 'workshop',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // Same day, 8 hours
        timezone: 'Africa/Kigali',
        location: 'Kigali, Rwanda',
        isOnline: true,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 50000,
        currency: 'RWF',
        maxAttendees: 50,
        organizerName: 'Bootskills AI Lab',
        organizerBio: 'Specialized AI training division of Bootskills Academy.',
        tags: ['ai', 'machine-learning', 'python', 'tensorflow', 'workshop'],
        status: 'published',
        featured: true,
      },
      {
        title: 'Cybersecurity Hackathon 2026',
        description: 'Compete in a 48-hour cybersecurity hackathon! Challenge yourself with real-world security scenarios, CTF challenges, and network penetration testing. Top teams win prizes and internship opportunities.',
        shortDescription: '48-hour cybersecurity competition with prizes and internships',
        type: 'hackathon',
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Kigali Convention Centre, Rwanda',
        isOnline: false,
        meetingLink: '',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 0,
        currency: 'RWF',
        maxAttendees: 100,
        organizerName: 'Bootskills Cybersecurity Division',
        organizerBio: 'Cybersecurity training and research division focused on building Africa\'s next generation of security professionals.',
        tags: ['cybersecurity', 'hackathon', 'ctf', 'networking', 'competition'],
        status: 'published',
        featured: true,
      },
      {
        title: 'Digital Skills for Entrepreneurs Webinar',
        description: 'Free webinar covering essential digital skills every entrepreneur needs: social media marketing, SEO, email marketing, and analytics. Perfect for small business owners in Rwanda and East Africa.',
        shortDescription: 'Free webinar on digital skills for entrepreneurs in East Africa',
        type: 'webinar',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: '',
        isOnline: true,
        meetingLink: 'https://zoom.us/j/1234567890',
        image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 0,
        currency: 'RWF',
        maxAttendees: 0, // unlimited
        organizerName: 'Bootskills Business Unit',
        organizerBio: 'Empowering entrepreneurs with practical business and digital skills.',
        tags: ['entrepreneurship', 'digital-skills', 'marketing', 'seo', 'free'],
        status: 'published',
        featured: false,
      },
      {
        title: 'Annual Tech Conference: Africa Digital Future',
        description: 'Join industry leaders, innovators, and policymakers for a two-day conference exploring Africa\'s digital transformation. Topics include AI governance, fintech innovation, EdTech, and the future of remote work in Africa.',
        shortDescription: 'Two-day conference on Africa\'s digital transformation and tech innovation',
        type: 'conference',
        startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 91 * 24 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Kigali Convention Centre, Rwanda',
        isOnline: true,
        meetingLink: '',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 75000,
        currency: 'RWF',
        maxAttendees: 500,
        organizerName: 'Bootskills Academy & Partners',
        organizerBio: 'Organizing Africa\'s premier tech events connecting innovators and investors.',
        tags: ['conference', 'tech', 'africa', 'innovation', 'digital-transformation'],
        status: 'published',
        featured: true,
      },
      {
        title: 'Flutter Mobile Development Meetup',
        description: 'Monthly meetup for Flutter developers in Kigali. Share knowledge, showcase projects, and network with fellow mobile developers. Light refreshments provided.',
        shortDescription: 'Monthly Flutter developer meetup in Kigali',
        type: 'meetup',
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Bootskills Campus, KG 123 St, Kigali',
        isOnline: false,
        meetingLink: '',
        image: '',
        price: 0,
        currency: 'RWF',
        maxAttendees: 40,
        organizerName: 'Bootskills Mobile Dev Community',
        organizerBio: 'Community of Flutter and mobile developers in Rwanda.',
        tags: ['flutter', 'mobile', 'dart', 'meetup', 'community'],
        status: 'published',
        featured: false,
      },
      {
        title: 'Data Science & Analytics Seminar',
        description: 'Deep dive into data science methodologies, tools, and career paths. Learn about data pipelines, visualization, statistical analysis, and how to land your first data science role.',
        shortDescription: 'Learn data science tools, techniques, and career paths',
        type: 'seminar',
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Kigali, Rwanda',
        isOnline: true,
        meetingLink: 'https://teams.microsoft.com/l/meetup/abc123',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&h=630',
        price: 25000,
        currency: 'RWF',
        maxAttendees: 60,
        organizerName: 'Bootskills Data Academy',
        organizerBio: 'Specialized data science training division.',
        tags: ['data-science', 'analytics', 'python', 'statistics', 'career'],
        status: 'published',
        featured: false,
      },
      {
        title: 'Past: UI/UX Design Workshop',
        description: 'Past workshop on UI/UX design fundamentals using Figma.',
        shortDescription: 'Past workshop on UI/UX design',
        type: 'workshop',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        timezone: 'Africa/Kigali',
        location: 'Kigali, Rwanda',
        isOnline: false,
        meetingLink: '',
        image: '',
        price: 0,
        currency: 'RWF',
        maxAttendees: 30,
        organizerName: 'Bootskills Design Team',
        organizerBio: 'Design training division.',
        tags: ['ui-ux', 'design', 'figma', 'workshop'],
        status: 'completed',
        featured: false,
      },
    ];

    let eventsCreated = 0;
    for (const eventData of eventsData) {
      const existing = await Event.findOne({ title: eventData.title });
      if (!existing) {
        await new Event({
          ...eventData,
          eventType: 'event',
          createdBy: creator._id,
          isDeleted: false,
        }).save();
        eventsCreated++;
        console.log(`✅ Created event: ${eventData.title}`);
      } else {
        console.log(`⏭️  Event exists: ${eventData.title}`);
      }
    }

    // ── 3. Seed Internship Programs ──────────────────────────────────
    const internshipData = [
      {
        title: 'Software Engineering Internship',
        description: 'Gain real-world software engineering experience working on live client projects. You\'ll work with a team using Agile methodologies, participate in code reviews, and ship production code.\n\nTechnologies: React, Node.js, TypeScript, PostgreSQL, Docker\nDuration: 3 months\nLocation: Kigali (hybrid)',
        image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=1200&h=630',
        duration: '3 Months',
        price: 0,
        currency: 'RWF',
        maxSpots: 15,
        status: 'active',
        category: 'Software Engineering',
        eligibility: '• Currently enrolled in or recent graduate of a software development program\n• Proficiency in at least one programming language\n• Understanding of web development fundamentals\n• Strong problem-solving skills',
        allowedDeliveryModes: ['physical', 'hybrid'],
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        applicationQuestions: [
          { label: 'Why do you want to join this internship?', type: 'textarea', required: true },
          { label: 'What programming languages are you proficient in?', type: 'text', required: true },
          { label: 'Link to your GitHub/portfolio', type: 'text', required: true },
          { label: 'Your current level of education', type: 'text', required: false },
        ],
        rules: '1. Interns must commit to the full 3-month program.\n2. Minimum 30 hours per week.\n3. Active participation in daily stand-ups and sprint planning.\n4. Code of conduct must be signed.',
        signerName: 'Manzi Alain Patrick Munyeshuri',
        signerSignature: '',
        featured: true,
      },
      {
        title: 'Data Science & AI Internship',
        description: 'Work on real data science projects involving machine learning, data pipelines, and AI model deployment. Gain hands-on experience with Python, TensorFlow, and cloud ML services.',
        image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=1200&h=630',
        duration: '4 Months',
        price: 0,
        currency: 'RWF',
        maxSpots: 10,
        status: 'active',
        category: 'Data Science & AI',
        eligibility: '• Background in statistics, mathematics, or computer science\n• Familiarity with Python and data libraries\n• Understanding of ML concepts\n• Strong analytical skills',
        allowedDeliveryModes: ['physical', 'online'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
        applicationQuestions: [
          { label: 'Describe your experience with data analysis', type: 'textarea', required: true },
          { label: 'What ML frameworks have you used?', type: 'text', required: true },
          { label: 'Link to a data science project', type: 'text', required: false },
        ],
        rules: '1. Full 4-month commitment required.\n2. Weekly progress presentations.\n3. All code must be documented.\n4. Final project presentation at end of program.',
        signerName: 'KALISA Jonathan',
        signerSignature: '',
        featured: true,
      },
      {
        title: 'Cybersecurity Analyst Internship',
        description: 'Join our security operations team and gain hands-on experience in threat detection, vulnerability assessment, and incident response. Work with industry-standard security tools and platforms.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200&h=630',
        duration: '3 Months',
        price: 50000,
        currency: 'RWF',
        maxSpots: 8,
        status: 'active',
        category: 'Cybersecurity',
        eligibility: '• Basic understanding of networking concepts\n• Familiarity with Linux/Unix systems\n• Interest in security\n• Problem-solving mindset',
        allowedDeliveryModes: ['physical'],
        applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000),
        applicationQuestions: [
          { label: 'Why cybersecurity?', type: 'textarea', required: true },
          { label: 'Any certifications or courses completed?', type: 'text', required: false },
          { label: 'Available start date', type: 'text', required: true },
        ],
        rules: '1. NDA must be signed.\n2. All activities logged.\n3. Ethical guidelines strictly enforced.\n4. 3-month minimum commitment.',
        signerName: 'Manzi Alain Patrick Munyeshuri',
        featured: false,
      },
      {
        title: 'Digital Marketing Internship',
        description: 'Learn digital marketing by running real campaigns. Work on SEO, social media marketing, email campaigns, and analytics. Measure and optimize real marketing ROI.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=630',
        duration: '3 Months',
        price: 0,
        currency: 'RWF',
        maxSpots: 12,
        status: 'active',
        category: 'Marketing',
        eligibility: '• Interest in digital marketing\n• Good writing skills\n• Familiarity with social media platforms\n• Creative mindset',
        allowedDeliveryModes: ['physical', 'hybrid', 'online'],
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
        applicationQuestions: [
          { label: 'Describe your social media experience', type: 'textarea', required: true },
          { label: 'Portfolio or examples of your work', type: 'text', required: false },
          { label: 'Why marketing?', type: 'textarea', required: true },
        ],
        rules: '1. 3-month commitment.\n2. Weekly reporting on campaign metrics.\n3. Participate in team brainstorming sessions.',
        featured: false,
      },
    ];

    let internshipsCreated = 0;
    for (const programData of internshipData) {
      const existing = await InternshipProgram.findOne({ title: programData.title });
      if (!existing) {
        await new InternshipProgram({
          ...programData,
          createdBy: creator._id,
          isDeleted: false,
        }).save();
        internshipsCreated++;
        console.log(`✅ Created internship: ${programData.title}`);
      } else {
        console.log(`⏭️  Internship exists: ${programData.title}`);
      }
    }

    // ── 4. Seed Event Applications (for test data) ────────────────────
    const publishedEvents = await Event.find({ status: 'published' }).lean();
    const studentUsers = await User.find({ role: 'student', isDeleted: { $ne: true } }).limit(10).lean();

    let eventAppCount = 0;
    for (const event of publishedEvents.slice(0, 4)) {
      for (const student of studentUsers.slice(0, 3)) {
        const existing = await EventApplication.findOne({ eventId: event._id, userId: student._id });
        if (!existing) {
          const statuses = ['pending', 'pending', 'pending', 'approved', 'rejected'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          await new EventApplication({
            eventId: event._id,
            userId: student._id,
            status,
            applicationAnswers: [
              { questionLabel: 'Why do you want to attend?', answer: `I'm very interested in ${event.title} to enhance my skills.` },
              { questionLabel: 'Any prior experience?', answer: student.skills || 'Some relevant background' },
            ],
            selectedDeliveryMode: event.isOnline ? 'online' : 'physical',
            isDeleted: false,
          }).save();
          eventAppCount++;
        }
      }
    }

    // ── 5. Seed Internship Applications ───────────────────────────────
    const programs = await InternshipProgram.find({ status: 'active' }).limit(3).lean();
    let internAppCount = 0;
    for (const program of programs) {
      for (const student of studentUsers.slice(0, 4)) {
        const existing = await InternshipApplication.findOne({ internshipProgramId: program._id, userId: student._id });
        if (!existing) {
          const statuses = ['pending', 'pending', 'approved', 'rejected', 'waitlisted'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          await new InternshipApplication({
            internshipProgramId: program._id,
            userId: student._id,
            status,
            skills: ['JavaScript', 'React', 'Node.js', 'Python'].slice(0, Math.floor(Math.random() * 3) + 1),
            availability: ['Full-time', 'Part-time', 'Flexible'][Math.floor(Math.random() * 3)],
            applicationAnswers: [
              { questionLabel: 'Why do you want to join?', answer: `I'm passionate about ${program.title} and eager to learn.` },
            ],
            isDeleted: false,
          }).save();
          internAppCount++;
        }
      }
    }

    // ── Summary ──────────────────────────────────────────────────────
    console.log('\n🎉 Seeding complete!');
    console.log(`   📅 Events: ${eventsCreated} created`);
    console.log(`   📋 Event Applications: ${eventAppCount} created`);
    console.log(`   💼 Internships: ${internshipsCreated} created`);
    console.log(`   📋 Internship Applications: ${internAppCount} created`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events and internships:', error);
    process.exit(1);
  }
}

seedEventsAndInternships();
