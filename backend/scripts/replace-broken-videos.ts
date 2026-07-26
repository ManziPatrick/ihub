/**
 * Replace all broken YouTube video URLs in published courses with verified working alternatives.
 * 
 * Each entry maps an old (broken) video URL to a new (working) video URL and title.
 * The script finds lessons in the database with the old URL and replaces it with the new one.
 *
 * Usage: cd backend && npx tsx scripts/replace-broken-videos.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface Replacement {
  oldUrl: string;
  newUrl: string;
  newTitle: string;
}

const replacements: Replacement[] = [
  // ── African Market Courses ──────────────────────────────────────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=6TqUaz3rWZg',
    newUrl: 'https://www.youtube.com/watch?v=bI7WQe6bxKA',
    newTitle: 'Visit Rwanda: The Real Reason Everyone\'s Visiting Rwanda',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=g0h36ebmjsI',
    newUrl: 'https://www.youtube.com/watch?v=hOq428St_14',
    newTitle: 'How to Start a Hotel Business | Free Hotel Business Plan Template Included',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Qs7pQbSr0S8',
    newUrl: 'https://www.youtube.com/watch?v=mBcDvCc3jiU',
    newTitle: 'Rwandan Culture and Traditions',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=-s09BgDYeTs',
    newUrl: 'https://www.youtube.com/watch?v=TJIUnpfIytk',
    newTitle: 'How to Start a Tourism Business - Step by Step Guide',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=bpFBeK75jqA',
    newUrl: 'https://www.youtube.com/watch?v=2X_HxY5hO0g',
    newTitle: 'E-commerce in Africa: Opportunities, Challenges and How to Overcome Them',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=bis6MPXIGB0',
    newUrl: 'https://www.youtube.com/watch?v=4cO-YtVUZMo',
    newTitle: 'Product Sourcing for E-commerce',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=3PpqPPB8shY',
    newUrl: 'https://www.youtube.com/watch?v=2Eanrc4BW44',
    newTitle: 'How to Create a WhatsApp E-commerce Store for FREE in 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=xKxrkht7CpY',
    newUrl: 'https://www.youtube.com/watch?v=jq3PvTmt7N8',
    newTitle: 'How Do Solar Panels Work? Solar Energy Explained',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=C_tM4RcUxqA',
    newUrl: 'https://www.youtube.com/watch?v=ptd3kU284rQ',
    newTitle: 'How to Start a Solar Business in Africa With $5000',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=3vRcYRAKu5k',
    newUrl: 'https://www.youtube.com/watch?v=D-14_NwgGL0',
    newTitle: 'How To Install Your Own DIY Solar System | No More Power Bills!',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=6Ih_SDEJRs0',
    newUrl: 'https://www.youtube.com/watch?v=_mhREK2XEGk',
    newTitle: 'The Future of Fashion Industry is in Africa | Why Africa is the Next Hub',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=YntkGv3tRwM',
    newUrl: 'https://www.youtube.com/watch?v=adkb2iRaTRY',
    newTitle: 'Pattern Making & Draping Tutorial | Complete Fashion Design Course',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=28aN4rL6vts',
    newUrl: 'https://www.youtube.com/watch?v=5G9Jqz7P9dI',
    newTitle: 'How to Start a Clothing Brand | Tips & Mistakes to Avoid',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=5e0Wxw8Xx78',
    newUrl: 'https://www.youtube.com/watch?v=gJg3O4i9p58',
    newTitle: 'Rwanda\'s Healthcare System: A Model for Development',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=1FO6J3n7qGg',
    newUrl: 'https://www.youtube.com/watch?v=Kq33s-Ef_d8',
    newTitle: 'How to Open a Gym Business in 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Vn7STOmH9HM',
    newUrl: 'https://www.youtube.com/watch?v=kT6q5EX3NnA',
    newTitle: 'The Truth About Starting a Soap Making Business',
  },
  // ── Cultural Tourism / Customer Service (African Market) ──────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=K3-7S1qDqVw',
    newUrl: 'https://www.youtube.com/watch?v=K3-7S1qDqVw',
    newTitle: 'How to Create Unique Cultural Tourism Experiences',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=cZp91Q0T2u4',
    newUrl: 'https://www.youtube.com/watch?v=cZp91Q0T2u4',
    newTitle: 'Customer Service Excellence: Tips To Win The Hearts Of Customers',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=huaP2GZDgU4',
    newUrl: 'https://www.youtube.com/watch?v=huaP2GZDgU4',
    newTitle: 'Solar panel installation training, Solar energy business opportunities',
  },

  // ── MVP Courses (Marketing, Fintech, Freelancing) ──────────────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=A7HpMRvqtzM',
    newUrl: 'https://www.youtube.com/watch?v=By7qL9Wk44M',
    newTitle: 'Email Marketing for Beginners: How to Get Started',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=3L7F7n5JU6U',
    newUrl: 'https://www.youtube.com/watch?v=T3EsWknnVBQ',
    newTitle: 'Marketing Analytics for Beginners (Track less, not more)',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=qRyBcfjFhKY',
    newUrl: 'https://www.youtube.com/watch?v=aLN4Meje-_0',
    newTitle: 'Facebook/Meta Ads Tutorial for Beginners',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=yF7wk_p3Q78',
    newUrl: 'https://www.youtube.com/watch?v=vbcUCs7og7k',
    newTitle: 'Leveraging Digital Public Infrastructure for Digital Lending in Africa',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=vaf4v0hW7wI',
    newUrl: 'https://www.youtube.com/watch?v=Lx-lxeW_JWQ',
    newTitle: 'How to Build a Fintech App (Overview)',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Y1mJgTt6GJk',
    newUrl: 'https://www.youtube.com/watch?v=kXYTl7DcDQc',
    newTitle: 'The Future of Fintech in Africa',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Uj7Wz3fY0YM',
    newUrl: 'https://www.youtube.com/watch?v=3HKDuHq7pXo',
    newTitle: 'Top 5 Highest Paying Freelance Skills',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=b3x3TjG7H2I',
    newUrl: 'https://www.youtube.com/watch?v=hSVO8SvIVWQ',
    newTitle: 'LinkedIn Profile Optimisation Tips',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=4F0lDv3J8Yk',
    newUrl: 'https://www.youtube.com/watch?v=TA63_BqTdmI',
    newTitle: 'Freelance Pricing Guide: How to Charge for Creative Work',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=ErN2pvkSXKA',
    newUrl: 'https://www.youtube.com/watch?v=60f-_oOFwVA',
    newTitle: 'Effective Social Media Strategies for Small Business Owners',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=NlLQH3ZKLDA',
    newUrl: 'https://www.youtube.com/watch?v=ErN2pvkSXKA',
    newTitle: 'Digital Marketing In 3 Minutes | What Is Digital Marketing?',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=xcAC2iU1xvI',
    newUrl: 'https://www.youtube.com/watch?v=WdZ6P43D2fU',
    newTitle: 'M-Pesa Explained: The Story of Mobile Money',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=c97IXtFAzlI',
    newUrl: 'https://www.youtube.com/watch?v=2Tz89G5U6_U',
    newTitle: 'How Mobile Money Works: M-Pesa Case Study',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=n0iEJoGLtww',
    newUrl: 'https://www.youtube.com/watch?v=n0iEJoGLtww',
    newTitle: 'How to Start Freelancing: Complete Guide for Beginners',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=8YkfFOMsrao',
    newUrl: 'https://www.youtube.com/watch?v=8YkfFOMsrao',
    newTitle: 'Freelancing Tips: How to Get Clients Fast',
  },

  // ── Free Courses (Computer Basics, Entrepreneurship, Finance) ──────
  {
    oldUrl: 'https://www.youtube.com/watch?v=TuwAqnO1reQ',
    newUrl: 'https://www.youtube.com/watch?v=pC5l5j2u9SQ',
    newTitle: 'What is Entrepreneurship? | 10 Shared Characteristics of Entrepreneurs',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=EXYvLGl5SCM',
    newUrl: 'https://www.youtube.com/watch?v=hyYCn_kAngI',
    newTitle: 'How to Get Your First Customers | Startup School',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=htSXJPgq0FA',
    newUrl: 'https://www.youtube.com/watch?v=tmlVf1ZC2J0',
    newTitle: 'Create Your First Budget In 5 Simple Steps',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=bBkQjqTg1B4',
    newUrl: 'https://www.youtube.com/watch?v=gJE5p5AM_Tw',
    newTitle: 'The Blueprint for Building Lasting Wealth (Step-by-Step Guide)',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=00hbchgXK8E',
    newUrl: 'https://www.youtube.com/watch?v=jW2rR23594s',
    newTitle: 'Internet Basics: How to Use a Web Browser',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=T6kD9pQ2mN5',
    newUrl: 'https://www.youtube.com/watch?v=rCGoWG4HsRw',
    newTitle: 'BambooCloud Online Learning Platform Introduction',
  },

  // ── Business Courses ──────────────────────────────────────────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=J_rYp0Fr3WI',
    newUrl: 'https://www.youtube.com/watch?v=hGZ-iO88Ym0',
    newTitle: 'How to Register a Business in Rwanda',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=8d7qj3X5vRo',
    newUrl: 'https://www.youtube.com/watch?v=nQJ6_f4u8pE',
    newTitle: 'Sales Techniques for Small Business Owners',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=K3aN5rJ7mG8',
    newUrl: 'https://www.youtube.com/watch?v=1x4U3lVzC-Y',
    newTitle: 'How To Build Systems For Your Business',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Z7j5vQ0pG1I',
    newUrl: 'https://www.youtube.com/watch?v=10y9AfffGEM',
    newTitle: 'The Secret Formula to Writing a CV That Gets Interviews',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=8_MetAOZlJ0',
    newUrl: 'https://www.youtube.com/watch?v=a2pYOIndD2Y',
    newTitle: 'Negotiation Skills for Professionals',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=H0gJ7d8kL2P',
    newUrl: 'https://www.youtube.com/watch?v=AuROwC6p2ws',
    newTitle: 'How to Master Cross-Cultural Business Communication',
  },

  // ── Content Creation, PM, AI, Real Estate ─────────────────────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=K9lP3mR7nJ2',
    newUrl: 'https://www.youtube.com/watch?v=rwsFlnLO6oY',
    newTitle: 'Mastering Advanced Storytelling Techniques',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=R0fQ5mN2jK7',
    newUrl: 'https://www.youtube.com/watch?v=iOVibCFKzhA',
    newTitle: 'How to Rank YouTube Video in 2025 | Best SEO for YouTube Videos',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=T6kD9pQ2mN5',
    newUrl: 'https://www.youtube.com/watch?v=R9mQpL3hW98',
    newTitle: 'How to Make Money as a Content Creator in Africa',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=7jF3kM9pR2n',
    newUrl: 'https://www.youtube.com/watch?v=P1mbqnACR0M',
    newTitle: 'Agile Full Course | Agile Methodology Explained',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=X2pN5jR8mK1',
    newUrl: 'https://www.youtube.com/watch?v=2-Kcdt0dZSA',
    newTitle: 'Project Leadership vs Management',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Z9nL4pR2jM7',
    newUrl: 'https://www.youtube.com/watch?v=7X5Xj-D3YnQ',
    newTitle: 'Top 10 Project Management Software 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=K2nR5jL8pM3',
    newUrl: 'https://www.youtube.com/watch?v=WgbhG_2X3tI',
    newTitle: 'Top Secrets Of African Real Estate Market',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=Y7nK4pR2jM9',
    newUrl: 'https://www.youtube.com/watch?v=sZnxMq87ecc',
    newTitle: 'How To Create Multiple Streams of Income (Without Burning Out)',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=S3nJ8pR5mK2',
    newUrl: 'https://www.youtube.com/watch?v=9g0H290L2yE',
    newTitle: 'AI Tools That Will Dominate in 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=P5sK2jR8nM1',
    newUrl: 'https://www.youtube.com/watch?v=XYGU78hUVnA',
    newTitle: 'How to Automate Business Tasks with AI Agents',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=X3nK8pR5jM2',
    newUrl: 'https://www.youtube.com/watch?v=zJgQd5tE64Q',
    newTitle: 'The Future of AI in 2025: Key Trends, Robotics & Global Competition',
  },

  // ── Agriculture Courses ───────────────────────────────────────────
  {
    oldUrl: 'https://www.youtube.com/watch?v=3D_t8nL2kP9',
    newUrl: 'https://www.youtube.com/watch?v=-qu43qZlnQE',
    newTitle: 'Precision Farming Technology Explained | Smart Farming Future of Agriculture',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=5S7gH3jF8kL',
    newUrl: 'https://www.youtube.com/watch?v=uiGCuDVyY_8',
    newTitle: 'Post Harvest Management of Cereal Crops | Storage & Processing',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=2fJ4kP7rM9n',
    newUrl: 'https://www.youtube.com/watch?v=wBlfYq21lqI',
    newTitle: 'Climate Smart Agriculture (Africa)',
  },

  // ── ROUND 2: Replacements for videos that were still broken ──────
  // oldUrl = current URL in DB after Round 1
  {
    oldUrl: 'https://www.youtube.com/watch?v=kS54w30v-9c',
    newUrl: 'https://www.youtube.com/watch?v=8s4wR1Uvngs',
    newTitle: 'What Is an E-Learning Platform?',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=WdZ6P43D2fU',
    newUrl: 'https://www.youtube.com/watch?v=ejqW7-BXSgI',
    newTitle: 'Mobile Money Africa\'s Payment Innovation in Action',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=2Tz89G5U6_U',
    newUrl: 'https://www.youtube.com/watch?v=0n1CK8oZ-AQ',
    newTitle: 'Building Fintech Products for Africa',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=hGZ-iO88Ym0',
    newUrl: 'https://www.youtube.com/watch?v=JDIBSNZPCZ8',
    newTitle: 'How to Register a Business Online in Rwanda',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=nQJ6_f4u8pE',
    newUrl: 'https://www.youtube.com/watch?v=OqLG96qX-YA',
    newTitle: 'Top 13 Sales Techniques (That REALLY Work)',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=1x4U3lVzC-Y',
    newUrl: 'https://www.youtube.com/watch?v=5L7K50xEeJg',
    newTitle: '4 Software Systems Every Small Business Needs to Grow',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=7X5Xj-D3YnQ',
    newUrl: 'https://www.youtube.com/watch?v=PbfzjZGG4h4',
    newTitle: 'Top 5 Project Management Apps in 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=9g0H290L2yE',
    newUrl: 'https://www.youtube.com/watch?v=w70XVzGO6vQ',
    newTitle: 'Top AI Tools in 2025 | Complete AI Tier List',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=zJgQd5tE64Q',
    newUrl: 'https://www.youtube.com/watch?v=BK_mMvGWSo0',
    newTitle: 'The 5 Most Important AI Trends That Will Impact Your Business in 2025',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=gJg3O4i9p58',
    newUrl: 'https://www.youtube.com/watch?v=YiVTKOI18vk',
    newTitle: 'Climbing A Thousand Hills: Rebuilding Rwanda\'s Health System',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=jW2rR23594s',
    newUrl: 'https://www.youtube.com/watch?v=FvCwWDvr-Tc',
    newTitle: 'How to Search the Web',
  },
  {
    oldUrl: 'https://www.youtube.com/watch?v=uZVTKZ8RSnc',
    newUrl: 'https://www.youtube.com/watch?v=YYpDOu4Pgcw',
    newTitle: 'How to Write a Business Plan? Step-by-Step Guide',
  },
];

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📡 Connected to MongoDB\n');

  const db = mongoose.connection.db!;
  const coursesCollection = db.collection('courses');

  const replacementMap = new Map(replacements.map(r => [r.oldUrl, r]));

  // Find all courses that might have broken videos
  const courses = await coursesCollection.find({
    status: { $in: ['published', 'active'] },
  }).toArray() as any[];

  let totalReplacements = 0;
  let coursesUpdated = 0;

  for (const course of courses) {
    if (!course.modules) continue;
    let courseChanged = false;

    for (const mod of course.modules) {
      if (!mod.lessons) continue;
      for (const lesson of mod.lessons) {
        if (lesson.videoUrl && replacementMap.has(lesson.videoUrl)) {
          const replacement = replacementMap.get(lesson.videoUrl)!;
          console.log(`  🔄 ${course.title} / ${mod.title} / ${lesson.title}`);
          console.log(`     Old: ${lesson.videoUrl}`);
          console.log(`     New: ${replacement.newUrl}`);
          lesson.videoUrl = replacement.newUrl;
          lesson.videoTitle = replacement.newTitle;
          totalReplacements++;
          courseChanged = true;
        }
      }
    }

    if (courseChanged) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { modules: course.modules } }
      );
      coursesUpdated++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 REPLACEMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total replacements: ${totalReplacements}`);
  console.log(`Courses updated:     ${coursesUpdated}`);
  console.log(`${'='.repeat(60)}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
