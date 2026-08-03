import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';
import bcrypt from 'bcryptjs';

dotenv.config();

const teachers = [
  {
    username: 'nigena.umuhire',
    email: 'nigena.umuhire@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Nigena Umuhire Pacifique',
    title: 'Teacher of History & Geography — Primary & Secondary Education Coach',
    bio: 'Nigena Umuhire Pacifique is a dedicated educator who holds a Bachelor of Education in History and Geography and is currently pursuing a Master\u2019s degree in Environment and Sustainable Development. With a strong foundation in pedagogy, she teaches all primary subjects (P1\u2013P6) and specializes in coaching learners through the national examination pathway from P6 to S6, including TVET and vocational training programs. She is passionate about environmental education, integrating sustainability themes into everyday lessons, and mentoring students to build confidence, critical thinking, and a lifelong love of learning. Nigena teaches in Kinyarwanda, English, and French, making her accessible to students and families across Rwanda.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Primary Education (P1\u2013P6)',
        'History & Geography (S1\u2013S6)',
        'National Exam Coaching (P6 & S6)',
        'Environment & Sustainable Development',
        'TVET & Vocational Training',
        'Student Mentorship & Remedial Support',
      ],
      experienceYears: 5,
      teachingPhilosophy: 'Every learner can succeed with the right support. I blend structured national-curriculum coaching with interactive, real-life examples so students truly understand concepts, not just memorise them.',
      qualifications: [
        'Bachelor of Education (History & Geography)',
        'Master\u2019s in Environment & Sustainable Development (in progress)',
        'Certified National Exam Coach (P6 & S6)',
      ],
      rateHourly: 30,
      linkedinProfile: 'https://www.linkedin.com/in/nigena-umuhire-pacifique',
      status: 'approved',
    },
  },
  {
    username: 'chantal.mukeshimana',
    email: 'chantal.mukeshimana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Chantal Mukeshimana',
    title: 'Primary School Teacher & Early Literacy Specialist',
    bio: 'Chantal Mukeshimana is a passionate primary school teacher with a Bachelor of Education in Primary Education from the University of Rwanda. With 7 years of classroom experience teaching P1 to P6, she specializes in early literacy, numeracy, and foundational sciences. She has trained over 400 young learners in Kinyarwanda and English literacy programs and works closely with parents to support children with learning difficulties. Chantal believes that strong foundations in primary school determine a child\u2019s future success and brings energy, patience, and creativity to every lesson.',
    location: 'Huye, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Primary Education (P1\u2013P6)',
        'Early Literacy (Kinyarwanda & English)',
        'Numeracy & Foundational Mathematics',
        'Remedial & Special Needs Support',
        'Parent Engagement Workshops',
      ],
      experienceYears: 7,
      teachingPhilosophy: 'Children learn best when they feel safe, seen, and encouraged. I use play-based and story-based methods to make learning joyful and lasting.',
      qualifications: [
        'Bachelor of Education (Primary Education)',
        'Certificate in Early Childhood Development',
        'Rwandan National Teacher Licensure (valid)',
      ],
      rateHourly: 25,
      linkedinProfile: 'https://www.linkedin.com/in/chantal-mukeshimana',
      status: 'approved',
    },
  },
  {
    username: 'eric.nsengiyumva',
    email: 'eric.nsengiyumva@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Eric Nsengiyumva',
    title: 'Mathematics & Physics Teacher — O-Level & A-Level (S1\u2013S6)',
    bio: 'Eric Nsengiyumva is a mathematics and physics educator with a Bachelor of Science in Mathematics and Physics and 6 years of teaching experience at both O-Level and A-Level (S1\u2013S6). He has consistently helped his students achieve top marks in national examinations, with several of his coaching students ranked among the best in their districts. Eric uses step-by-step problem-solving approaches, past-paper practice, and interactive demonstrations to make abstract concepts accessible. He is also a trained STEM mentor who encourages young people, especially girls, to pursue science careers.',
    location: 'Musanze, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Mathematics (S1\u2013S6)',
        'Physics (S1\u2013S6)',
        'National Exam Coaching (S3, S6)',
        'STEM Mentorship',
        'TVET Mathematics & Technical Science',
      ],
      experienceYears: 6,
      teachingPhilosophy: 'Mathematics is not about memorising formulas \u2014 it is about patterns and logic. I train students to think like problem-solvers and to perform calmly under exam pressure.',
      qualifications: [
        'Bachelor of Science (Mathematics & Physics)',
        'Postgraduate Diploma in Education',
        'National Exam Marking Panel Experience (Mathematics)',
      ],
      rateHourly: 35,
      linkedinProfile: 'https://www.linkedin.com/in/eric-nsengiyumva',
      status: 'approved',
    },
  },
  {
    username: 'josiane.uwera',
    email: 'josiane.uwera@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Josiane Uwera',
    title: 'Languages Teacher — English, French & Kinyarwanda',
    bio: 'Josiane Uwera is a multilingual language educator holding a Bachelor of Arts in English and French Linguistics. Over 8 years she has taught language and communication skills from primary through secondary level and to adult learners in professional training programs. Josiane is an experienced IELTS and TOEFL preparation coach and has designed communication modules for hospitality, ICT, and business trainees across Rwanda. Her dynamic, conversation-first teaching style helps learners speak with confidence from the very first lesson.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'English (ESL) & Communication',
        'French & Kinyarwanda',
        'IELTS / TOEFL Preparation',
        'Primary & Secondary Language Curriculum',
        'TVET & Professional Communication Training',
      ],
      experienceYears: 8,
      teachingPhilosophy: 'Language is a skill you build by using it. I create safe, engaging spaces where learners speak, write, and think in the target language from day one.',
      qualifications: [
        'Bachelor of Arts (English & French Linguistics)',
        'TESOL / TEFL Certified',
        'IELTS Trainer Certification',
      ],
      rateHourly: 28,
      linkedinProfile: 'https://www.linkedin.com/in/josiane-uwera',
      status: 'approved',
    },
  },
  {
    username: 'thierry.mugisha',
    email: 'thierry.mugisha@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Thierry Mugisha',
    title: 'TVET & Vocational Skills Trainer — ICT & Entrepreneurship',
    bio: 'Thierry Mugisha is a TVET and vocational training specialist with a Bachelor of Science in Computer Science and a National TVET Trainer Certificate. For 6 years he has designed and delivered hands-on training programs in computer literacy, digital skills, and entrepreneurship for secondary students and young adults entering the workforce. Thierry has partnered with TVET schools to build practical curricula aligned to the Rwandan National TVET qualification levels (N1 and above), helping hundreds of graduates secure internships and start small businesses. He is a firm believer that practical, skills-based training transforms lives.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'TVET & Vocational Training (N-levels)',
        'Computer Literacy & Digital Skills',
        'Entrepreneurship & Business Basics',
        'Career Coaching & Internship Readiness',
        'Youth Skills Development Programs',
      ],
      experienceYears: 6,
      teachingPhilosophy: 'Skills are the key to opportunity. I teach by doing \u2014 every session ends with the learner having produced something real they can use or show.',
      qualifications: [
        'Bachelor of Science (Computer Science)',
        'National TVET Trainer Certificate',
        'Certified Digital Skills Facilitator',
      ],
      rateHourly: 32,
      linkedinProfile: 'https://www.linkedin.com/in/thierry-mugisha',
      status: 'approved',
    },
  },
  {
    username: 'sandrine.ingabire',
    email: 'sandrine.ingabire@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Sandrine Ingabire',
    title: 'Chemistry & Biology Teacher — O-Level & A-Level (S1\u2013S6)',
    bio: 'Sandrine Ingabire is a science educator with a Bachelor of Science in Chemistry and Biology and 5 years of teaching experience across O-Level and A-Level (S1\u2013S6). She specializes in national examination preparation in the natural sciences and has led science clubs that produced regional and national science fair winners. Sandrine is passionate about girls\u2019 education in STEM and about connecting classroom science to environmental and health issues facing Rwandan communities. Her laboratory-based, inquiry-driven lessons make biology and chemistry come alive for students.',
    location: 'Rubavu, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Chemistry (S1\u2013S6)',
        'Biology (S1\u2013S6)',
        'National Exam Coaching (S3, S6)',
        'Science Club & STEM Mentorship',
        'Environmental & Health Education',
      ],
      experienceYears: 5,
      teachingPhilosophy: 'Science is best learned through curiosity and experiment. I guide students to ask questions, test ideas, and see the science in the world around them.',
      qualifications: [
        'Bachelor of Science (Chemistry & Biology)',
        'Postgraduate Diploma in Education',
        'Lab Safety & Science Teaching Certification',
      ],
      rateHourly: 33,
      linkedinProfile: 'https://www.linkedin.com/in/sandrine-ingabire',
      status: 'approved',
    },
  },
  {
    username: 'aline.uwimana',
    email: 'aline.uwimana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Aline Uwimana',
    title: 'Primary School Teacher — Early Childhood & Special Needs Education',
    bio: 'Aline Uwimana is a primary education specialist with a Bachelor of Education in Early Childhood and Primary Education and a certificate in Inclusive Education and Special Needs. With 6 years of experience teaching P1 to P4, she works with young learners and children with learning difficulties, adapting lessons so every child can progress at their own pace. Aline is trained in play-based and Montessori-inspired methods and regularly runs parent workshops on early learning. She teaches in Kinyarwanda, English, and French and is deeply committed to making the early years joyful, safe, and full of curiosity.',
    location: 'Kigali, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Early Childhood & Primary (P1–P4)',
        'Inclusive & Special Needs Education',
        'Play-Based & Montessori Learning',
        'Early Literacy & Numeracy',
        'Parent Workshops & Family Engagement',
      ],
      experienceYears: 6,
      teachingPhilosophy: 'Every child learns differently, and that is a gift. I design lessons that meet each learner where they are and celebrate small victories every single day.',
      qualifications: [
        'Bachelor of Education (Early Childhood & Primary Education)',
        'Certificate in Inclusive Education & Special Needs',
        'Montessori Early Learning Certification',
      ],
      rateHourly: 24,
      linkedinProfile: 'https://www.linkedin.com/in/aline-uwimana',
      status: 'approved',
    },
  },
  {
    username: 'marieclaudine.mukandayisenga',
    email: 'marieclaudine.mukandayisenga@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Marie Claudine Mukandayisenga',
    title: 'Early Grade Reading & Mathematics Coach (EGRA / EGMA)',
    bio: 'Marie Claudine Mukandayisenga is an early-grade learning specialist with a Bachelor of Education in Primary Education and advanced training in Early Grade Reading Assessment (EGRA) and Early Grade Mathematics Assessment (EGMA) methodologies. Over 5 years she has coached teachers and supported hundreds of P1–P6 pupils to master foundational reading and mathematics, working closely with the national curriculum. Her lively, story-based literacy sessions and hands-on numeracy activities have helped struggling learners catch up and confident learners excel. She is also a trained school mentor for continuous professional development.',
    location: 'Huye, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'Early Grade Literacy (EGRA)',
        'Early Grade Mathematics (EGMA)',
        'Foundational Reading (Kinyarwanda & English)',
        'P1–P6 Remedial Coaching',
        'Teacher Mentorship & CPD',
      ],
      experienceYears: 5,
      teachingPhilosophy: 'Strong foundations unlock everything else. I make reading and numbers feel like games so children fall in love with learning early.',
      qualifications: [
        'Bachelor of Education (Primary Education)',
        'EGRA / EGMA Certified Coach',
        'Certificate in Teacher Professional Development',
      ],
      rateHourly: 26,
      linkedinProfile: 'https://www.linkedin.com/in/marie-claudine-mukandayisenga',
      status: 'approved',
    },
  },
  {
    username: 'patrick.nzabonimpa',
    email: 'patrick.nzabonimpa@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Patrick Nzabonimpa',
    title: 'TVET Trainer — Electrical Installation & Renewable Energy',
    bio: 'Patrick Nzabonimpa is a TVET and vocational trainer specializing in electrical installation, solar energy systems, and renewable energy technologies. He holds a Higher Diploma in Electrical Engineering and a National TVET Trainer Certificate, with 7 years of experience teaching in TVET schools and training young technicians across Rwanda. Patrick has led solar installation projects for schools and health centres, giving his students real, job-ready skills. He prepares learners for national TVET certification levels (N1 and above) and links his best graduates to internships and work placement opportunities in the energy sector.',
    location: 'Musanze, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'TVET & Vocational Training (N-levels)',
        'Electrical Installation & Wiring',
        'Solar Energy & Renewable Systems',
        'Workplace Safety & Practical Skills',
        'Internship & Job Placement Support',
      ],
      experienceYears: 7,
      teachingPhilosophy: 'Practical skills change lives. Every lesson ends with students wiring, measuring, or building something real they can use to earn a living.',
      qualifications: [
        'Higher Diploma in Electrical Engineering',
        'National TVET Trainer Certificate',
        'Certified Solar PV Installer',
      ],
      rateHourly: 34,
      linkedinProfile: 'https://www.linkedin.com/in/patrick-nzabonimpa',
      status: 'approved',
    },
  },
  {
    username: 'olivier.twagirimana',
    email: 'olivier.twagirimana@bootskills.com',
    password: 'Password@123',
    role: 'trainer',
    fullName: 'Olivier Twagirimana',
    title: 'TVET Trainer — Agribusiness & Modern Agriculture',
    bio: 'Olivier Twagirimana is a TVET trainer and agribusiness coach with a Bachelor of Science in Agriculture and a National TVET Trainer Certificate. With 6 years of experience, he has trained farmers, cooperatives, and young agripreneurs in modern farming techniques, crop and animal husbandry, and small-business management. Olivier has designed practical TVET curricula aligned to national qualification levels (N1 and above) and helped hundreds of graduates start or grow their own agribusinesses. He combines classroom theory with real farm work, teaching soil care, irrigation, agri-marketing, and financial planning that learners can apply immediately.',
    location: 'Rubavu, Rwanda',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    isTrainerApproved: true,
    trainerApplication: {
      specialties: [
        'TVET & Vocational Training (N-levels)',
        'Modern Agriculture & Crop Science',
        'Animal Husbandry & Farm Management',
        'Agribusiness & Entrepreneurship',
        'Cooperatives & Youth Employment Programs',
      ],
      experienceYears: 6,
      teachingPhilosophy: 'The farm is the best classroom. I teach learners to grow, manage, and sell — building skills that feed families and create real incomes.',
      qualifications: [
        'Bachelor of Science (Agriculture)',
        'National TVET Trainer Certificate',
        'Certified Agribusiness Coach',
      ],
      rateHourly: 31,
      linkedinProfile: 'https://www.linkedin.com/in/olivier-twagirimana',
      status: 'approved',
    },
  },
];

const seedTeachers = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const teacherData of teachers) {
      const existingUser = await User.findOne({ email: teacherData.email });
      if (existingUser) {
        console.log(`⚠️  Teacher ${teacherData.email} already exists. Skipping.`);
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(teacherData.password, 10);

      const teacher = new User({
        username: teacherData.username,
        email: teacherData.email,
        password: hashedPassword,
        role: 'trainer',
        fullName: teacherData.fullName,
        title: teacherData.title,
        bio: teacherData.bio,
        location: teacherData.location,
        avatar: teacherData.avatar,
        isTrainerApproved: true,
        isProfilePublic: true,
        isEmailVerified: true,
        trainerApplication: teacherData.trainerApplication,
      });

      await teacher.save();
      console.log(`✅ Created teacher: ${teacherData.fullName} (@${teacherData.username}) — ${teacherData.trainerApplication.specialties.slice(0, 3).join(', ')}`);
      created++;
    }

    console.log(`\n🏁 Teacher seeding complete!`);
    console.log(`   Created: ${created} | Skipped: ${skipped} | Total: ${teachers.length}`);
    console.log(`\n📋 Login credentials for all teachers:`);
    console.log(`   Password: Password@123`);
    console.log(`   Example:  nigena.umuhire@bootskills.com`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding teachers:', error);
    process.exit(1);
  }
};

seedTeachers();
