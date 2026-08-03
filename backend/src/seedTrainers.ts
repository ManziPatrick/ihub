import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const trainers = [
  {
    username: 'alice.mutesi',
    email: 'alice.mutesi@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Alice Mutesi',
    title: 'Senior Full-Stack Developer & Cloud Architect',
    bio: 'With over 8 years of experience building scalable web applications, Alice specializes in React, Node.js, and cloud infrastructure on AWS. She has trained 500+ developers across East Africa and is passionate about bridging the tech skills gap.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Web Development', 'React', 'Node.js', 'AWS Cloud', 'Full-Stack'],
      experienceYears: 8,
      teachingPhilosophy: 'Learning by building real-world projects. I believe the best way to master code is to ship production-ready applications.',
      qualifications: ['MSc Computer Science', 'AWS Solutions Architect Certified', 'Google Cloud Certified'],
      rateHourly: 50,
      linkedinProfile: 'https://linkedin.com/in/alice-mutesi',
      githubProfile: 'https://github.com/alice-mutesi',
      websiteUrl: 'https://alicecodes.dev',
      status: 'approved'
    }
  },
  {
    username: 'jean.pierre',
    email: 'jean.pierre@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Jean Pierre Habimana',
    title: 'Data Science & Machine Learning Engineer',
    bio: 'Jean Pierre is a data scientist with 6 years of experience in machine learning, statistical modeling, and data engineering. He has worked with fintech startups and NGOs across Africa to build data-driven solutions.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Data Science', 'Machine Learning', 'Python', 'SQL', 'Data Engineering', 'AI'],
      experienceYears: 6,
      teachingPhilosophy: 'Data tells a story. My goal is to help students uncover insights and build models that make a real impact.',
      qualifications: ['PhD Data Science (candidate)', 'MSc Statistics', 'TensorFlow Developer Certificate'],
      rateHourly: 60,
      linkedinProfile: 'https://linkedin.com/in/jean-pierre',
      githubProfile: 'https://github.com/jean-pierre',
      status: 'approved'
    }
  },
  {
    username: 'grace.umutoni',
    email: 'grace.umutoni@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Grace Umutoni',
    title: 'UX/UI Designer & Frontend Developer',
    bio: 'Grace is a creative designer and frontend developer with 5 years of experience crafting beautiful, user-centered digital products. She has designed interfaces for e-commerce, edtech, and healthcare platforms.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['UI/UX Design', 'Figma', 'Frontend Development', 'Design Systems', 'User Research'],
      experienceYears: 5,
      teachingPhilosophy: 'Great design is invisible. I teach students to focus on the user journey and create interfaces that feel intuitive.',
      qualifications: ['BSc Human-Computer Interaction', 'Google UX Design Certificate', 'Certified Figma Expert'],
      rateHourly: 45,
      linkedinProfile: 'https://linkedin.com/in/grace-umutoni',
      websiteUrl: 'https://grace.design',
      status: 'approved'
    }
  },
  {
    username: 'patrick.niyo',
    email: 'patrick.niyo@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Patrick Niyonzima',
    title: 'Mobile App Developer (Flutter & React Native)',
    bio: 'Patrick is a mobile development expert who has built and published 15+ apps on both iOS and Android stores. He specializes in cross-platform development with Flutter and React Native.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Mobile Development', 'Flutter', 'React Native', 'iOS', 'Android', 'Dart'],
      experienceYears: 7,
      teachingPhilosophy: 'Mobile development is about creating delightful experiences. I focus on teaching clean architecture and smooth animations.',
      qualifications: ['BSc Software Engineering', 'Google Associate Android Developer', 'Flutter Certified'],
      rateHourly: 55,
      linkedinProfile: 'https://linkedin.com/in/patrick-niyo',
      githubProfile: 'https://github.com/patrick-niyo',
      status: 'approved'
    }
  },
  {
    username: 'diane.ishimwe',
    email: 'diane.ishimwe@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Diane Ishimwe',
    title: 'Cybersecurity Analyst & Ethical Hacker',
    bio: 'Diane is a cybersecurity professional with 5 years of experience in penetration testing, security auditing, and incident response. She has helped organizations across East Africa strengthen their security posture.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Penetration Testing', 'Security Audit'],
      experienceYears: 5,
      teachingPhilosophy: 'Security is a mindset. I teach students to think like attackers to defend like champions.',
      qualifications: ['CISSP', 'CEH Certified', 'CompTIA Security+', 'BSc Information Security'],
      rateHourly: 65,
      linkedinProfile: 'https://linkedin.com/in/diane-ishimwe',
      status: 'approved'
    }
  },
  {
    username: 'samuel.kagame',
    email: 'samuel.kagame@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Samuel Kagame',
    title: 'DevOps Engineer & Cloud Infrastructure Specialist',
    bio: 'Samuel has 7 years of experience in DevOps, CI/CD pipelines, containerization with Docker and Kubernetes, and cloud infrastructure management on AWS and Azure.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure', 'Infrastructure as Code'],
      experienceYears: 7,
      teachingPhilosophy: 'Automation is the key to scalability. I teach practical DevOps skills that students can apply from day one.',
      qualifications: ['AWS DevOps Engineer Certified', 'CKA (Certified Kubernetes Administrator)', 'Terraform Certified'],
      rateHourly: 70,
      linkedinProfile: 'https://linkedin.com/in/samuel-kagame',
      githubProfile: 'https://github.com/samuel-kagame',
      status: 'approved'
    }
  },
  {
    username: 'faith.niyigena',
    email: 'faith.niyigena@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Faith Niyigena',
    title: 'AI & Deep Learning Researcher',
    bio: 'Faith is an AI researcher with a focus on natural language processing and computer vision. She has published 3 papers in top AI conferences and built AI solutions for agriculture and healthcare in Africa.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Artificial Intelligence', 'Deep Learning', 'NLP', 'Computer Vision', 'Python', 'TensorFlow'],
      experienceYears: 4,
      teachingPhilosophy: 'AI is the future. I break down complex concepts into digestible lessons with hands-on coding projects.',
      qualifications: ['MSc Artificial Intelligence', 'Deep Learning Specialization (DeepLearning.AI)', 'Published Researcher'],
      rateHourly: 55,
      linkedinProfile: 'https://linkedin.com/in/faith-niyigena',
      githubProfile: 'https://github.com/faith-niyigena',
      status: 'approved'
    }
  },
  {
    username: 'emmanuel.bizimana',
    email: 'emmanuel.bizimana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Emmanuel Bizimana',
    title: 'Backend Developer & API Architect',
    bio: 'Emmanuel specializes in building robust backend systems, RESTful APIs, and microservices architecture. With 6 years of experience, he has architected systems serving millions of users across fintech and logistics.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Backend Development', 'API Design', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Microservices'],
      experienceYears: 6,
      teachingPhilosophy: 'Great backend engineering is about reliability and performance. I teach best practices for building systems that scale.',
      qualifications: ['BSc Computer Science', 'MongoDB Certified Developer', 'AWS Certified Developer'],
      rateHourly: 50,
      linkedinProfile: 'https://linkedin.com/in/emmanuel-bizimana',
      githubProfile: 'https://github.com/emmanuel-bizimana',
      status: 'approved'
    }
  },
  {
    username: 'clarisse.mukamana',
    email: 'clarisse.mukamana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Clarisse Mukamana',
    title: 'Product Manager & Agile Coach',
    bio: 'Clarisse is a certified product manager with 8 years of experience leading cross-functional teams. She has launched 10+ digital products from concept to market in fintech, edtech, and e-commerce.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Product Management', 'Agile', 'Scrum', 'Product Strategy', 'User Stories', 'Roadmapping'],
      experienceYears: 8,
      teachingPhilosophy: 'Product management is about solving real problems. I teach a framework-driven approach to building products people love.',
      qualifications: ['CSPO (Certified Scrum Product Owner)', 'PMP Certified', 'MBA'],
      rateHourly: 45,
      linkedinProfile: 'https://linkedin.com/in/clarisse-mukamana',
      status: 'approved'
    }
  },
  {
    username: 'david.hakizimana',
    email: 'david.hakizimana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'David Hakizimana',
    title: 'Blockchain Developer & Web3 Engineer',
    bio: 'David is a blockchain developer with 4 years of experience building smart contracts, dApps, and DeFi protocols on Ethereum and Solana. He is passionate about decentralized technology for financial inclusion.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: ['Blockchain', 'Web3', 'Solidity', 'Smart Contracts', 'Ethereum', 'dApps'],
      experienceYears: 4,
      teachingPhilosophy: 'Blockchain is transforming finance and beyond. I focus on hands-on smart contract development and real dApp deployment.',
      qualifications: ['Ethereum Developer Certificate', 'ConsenSys Academy Graduate', 'BSc Computer Engineering'],
      rateHourly: 65,
      linkedinProfile: 'https://linkedin.com/in/david-hakizimana',
      githubProfile: 'https://github.com/david-hakizimana',
      status: 'approved'
    }
  }
];

const seedTrainers = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const trainerData of trainers) {
      const existingUser = await User.findOne({ email: trainerData.email });
      if (existingUser) {
        console.log(`⚠️  Trainer ${trainerData.email} already exists. Skipping.`);
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(trainerData.password, 10);
      
      const trainer = new User({
        username: trainerData.username,
        email: trainerData.email,
        password: hashedPassword,
        role: 'trainer',
        fullName: trainerData.fullName,
        title: trainerData.title,
        bio: trainerData.bio,
        location: trainerData.location,
        avatar: trainerData.avatar,
        isTrainerApproved: true,
        isVerified: true,
        trainerApplication: trainerData.trainerApplication,
      });

      await trainer.save();
      console.log(`✅ Created trainer: ${trainerData.fullName} (@${trainerData.username}) — ${trainerData.trainerApplication.specialties.slice(0, 3).join(', ')}`);
      created++;
    }

    console.log(`\n🏁 Trainer seeding complete!`);
    console.log(`   Created: ${created} | Skipped: ${skipped} | Total: ${trainers.length}`);
    console.log(`\n📋 Login credentials for all trainers:`);
    console.log(`   Password: Password@123`);
    console.log(`   Example:  alice.mutesi@bootskills.com`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding trainers:', error);
    process.exit(1);
  }
};

seedTrainers();
