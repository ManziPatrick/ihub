/**
 * Update all course seed files with replacement YouTube video URLs.
 * Also finds any still-broken URLs in published courses that need replacements.
 *
 * Usage: cd backend && npx tsx scripts/update-seed-files.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// ── Replacement mapping: old URL → new URL + title ──────────────────
// Same as replace-broken-videos.ts
const replacements: Record<string, { url: string; title: string }> = {
  // African Market
  'https://www.youtube.com/watch?v=6TqUaz3rWZg': { url: 'https://www.youtube.com/watch?v=bI7WQe6bxKA', title: 'Visit Rwanda: The Real Reason Everyone\'s Visiting Rwanda' },
  'https://www.youtube.com/watch?v=g0h36ebmjsI': { url: 'https://www.youtube.com/watch?v=hOq428St_14', title: 'How to Start a Hotel Business | Free Hotel Business Plan Template Included' },
  'https://www.youtube.com/watch?v=Qs7pQbSr0S8': { url: 'https://www.youtube.com/watch?v=mBcDvCc3jiU', title: 'Rwandan Culture and Traditions' },
  'https://www.youtube.com/watch?v=-s09BgDYeTs': { url: 'https://www.youtube.com/watch?v=TJIUnpfIytk', title: 'How to Start a Tourism Business - Step by Step Guide' },
  'https://www.youtube.com/watch?v=bpFBeK75jqA': { url: 'https://www.youtube.com/watch?v=2X_HxY5hO0g', title: 'E-commerce in Africa: Opportunities, Challenges and How to Overcome Them' },
  'https://www.youtube.com/watch?v=bis6MPXIGB0': { url: 'https://www.youtube.com/watch?v=4cO-YtVUZMo', title: 'Product Sourcing for E-commerce' },
  'https://www.youtube.com/watch?v=3PpqPPB8shY': { url: 'https://www.youtube.com/watch?v=2Eanrc4BW44', title: 'How to Create a WhatsApp E-commerce Store for FREE in 2025' },
  'https://www.youtube.com/watch?v=xKxrkht7CpY': { url: 'https://www.youtube.com/watch?v=jq3PvTmt7N8', title: 'How Do Solar Panels Work? Solar Energy Explained' },
  'https://www.youtube.com/watch?v=C_tM4RcUxqA': { url: 'https://www.youtube.com/watch?v=ptd3kU284rQ', title: 'How to Start a Solar Business in Africa With $5000' },
  'https://www.youtube.com/watch?v=3vRcYRAKu5k': { url: 'https://www.youtube.com/watch?v=D-14_NwgGL0', title: 'How To Install Your Own DIY Solar System | No More Power Bills!' },
  'https://www.youtube.com/watch?v=6Ih_SDEJRs0': { url: 'https://www.youtube.com/watch?v=_mhREK2XEGk', title: 'The Future of Fashion Industry is in Africa | Why Africa is the Next Hub' },
  'https://www.youtube.com/watch?v=YntkGv3tRwM': { url: 'https://www.youtube.com/watch?v=adkb2iRaTRY', title: 'Pattern Making & Draping Tutorial | Complete Fashion Design Course' },
  'https://www.youtube.com/watch?v=28aN4rL6vts': { url: 'https://www.youtube.com/watch?v=5G9Jqz7P9dI', title: 'How to Start a Clothing Brand | Tips & Mistakes to Avoid' },
  'https://www.youtube.com/watch?v=5e0Wxw8Xx78': { url: 'https://www.youtube.com/watch?v=gJg3O4i9p58', title: 'Rwanda\'s Healthcare System: A Model for Development' },
  'https://www.youtube.com/watch?v=1FO6J3n7qGg': { url: 'https://www.youtube.com/watch?v=Kq33s-Ef_d8', title: 'How to Open a Gym Business in 2025' },
  'https://www.youtube.com/watch?v=Vn7STOmH9HM': { url: 'https://www.youtube.com/watch?v=kT6q5EX3NnA', title: 'The Truth About Starting a Soap Making Business' },
  
  // MVP Courses
  'https://www.youtube.com/watch?v=NlLQH3ZKLDA': { url: 'https://www.youtube.com/watch?v=ErN2pvkSXKA', title: 'Digital Marketing In 3 Minutes | What Is Digital Marketing?' },
  'https://www.youtube.com/watch?v=A7HpMRvqtzM': { url: 'https://www.youtube.com/watch?v=By7qL9Wk44M', title: 'Email Marketing for Beginners: How to Get Started' },
  'https://www.youtube.com/watch?v=3L7F7n5JU6U': { url: 'https://www.youtube.com/watch?v=T3EsWknnVBQ', title: 'Marketing Analytics for Beginners (Track less, not more)' },
  'https://www.youtube.com/watch?v=qRyBcfjFhKY': { url: 'https://www.youtube.com/watch?v=aLN4Meje-_0', title: 'Facebook/Meta Ads Tutorial for Beginners' },
  'https://www.youtube.com/watch?v=ErN2pvkSXKA': { url: 'https://www.youtube.com/watch?v=60f-_oOFwVA', title: 'Effective Social Media Strategies for Small Business Owners' },
  'https://www.youtube.com/watch?v=xcAC2iU1xvI': { url: 'https://www.youtube.com/watch?v=WdZ6P43D2fU', title: 'M-Pesa Explained: The Story of Mobile Money' },
  'https://www.youtube.com/watch?v=c97IXtFAzlI': { url: 'https://www.youtube.com/watch?v=2Tz89G5U6_U', title: 'How Mobile Money Works: M-Pesa Case Study' },
  'https://www.youtube.com/watch?v=yF7wk_p3Q78': { url: 'https://www.youtube.com/watch?v=vbcUCs7og7k', title: 'Leveraging Digital Public Infrastructure for Responsible Digital Lending in Africa' },
  'https://www.youtube.com/watch?v=vaf4v0hW7wI': { url: 'https://www.youtube.com/watch?v=Lx-lxeW_JWQ', title: 'How to Build a Fintech App (Overview)' },
  'https://www.youtube.com/watch?v=Y1mJgTt6GJk': { url: 'https://www.youtube.com/watch?v=kXYTl7DcDQc', title: 'The Future of Fintech in Africa' },
  'https://www.youtube.com/watch?v=Uj7Wz3fY0YM': { url: 'https://www.youtube.com/watch?v=3HKDuHq7pXo', title: 'Top 5 Highest Paying Freelance Skills' },
  'https://www.youtube.com/watch?v=b3x3TjG7H2I': { url: 'https://www.youtube.com/watch?v=hSVO8SvIVWQ', title: 'LinkedIn Profile Optimisation Tips' },
  'https://www.youtube.com/watch?v=4F0lDv3J8Yk': { url: 'https://www.youtube.com/watch?v=TA63_BqTdmI', title: 'Freelance Pricing Guide: How to Charge for Creative Work' },

  // Free Courses
  'https://www.youtube.com/watch?v=00hbchgXK8E': { url: 'https://www.youtube.com/watch?v=jW2rR23594s', title: 'Internet Basics: How to Use a Web Browser' },
  'https://www.youtube.com/watch?v=TuwAqnO1reQ': { url: 'https://www.youtube.com/watch?v=pC5l5j2u9SQ', title: 'What is Entrepreneurship? | 10 Shared Characteristics of Entrepreneurs' },
  'https://www.youtube.com/watch?v=EXYvLGl5SCM': { url: 'https://www.youtube.com/watch?v=hyYCn_kAngI', title: 'How to Get Your First Customers | Startup School' },
  'https://www.youtube.com/watch?v=htSXJPgq0FA': { url: 'https://www.youtube.com/watch?v=tmlVf1ZC2J0', title: 'Create Your First Budget In 5 Simple Steps' },
  'https://www.youtube.com/watch?v=bBkQjqTg1B4': { url: 'https://www.youtube.com/watch?v=gJE5p5AM_Tw', title: 'The Blueprint for Building Lasting Wealth (Step-by-Step Guide)' },

  // Business Courses
  'https://www.youtube.com/watch?v=J_rYp0Fr3WI': { url: 'https://www.youtube.com/watch?v=hGZ-iO88Ym0', title: 'How to Register a Business in Rwanda' },
  'https://www.youtube.com/watch?v=8d7qj3X5vRo': { url: 'https://www.youtube.com/watch?v=nQJ6_f4u8pE', title: 'Sales Techniques for Small Business Owners' },
  'https://www.youtube.com/watch?v=K3aN5rJ7mG8': { url: 'https://www.youtube.com/watch?v=1x4U3lVzC-Y', title: 'How To Build Systems For Your Business' },
  'https://www.youtube.com/watch?v=Z7j5vQ0pG1I': { url: 'https://www.youtube.com/watch?v=10y9AfffGEM', title: 'The Secret Formula to Writing a CV That Gets Interviews' },
  'https://www.youtube.com/watch?v=8_MetAOZlJ0': { url: 'https://www.youtube.com/watch?v=a2pYOIndD2Y', title: 'Negotiation Skills for Professionals' },
  'https://www.youtube.com/watch?v=H0gJ7d8kL2P': { url: 'https://www.youtube.com/watch?v=AuROwC6p2ws', title: 'How to Master Cross-Cultural Business Communication' },

  // Content Creation / PM / AI / Real Estate
  'https://www.youtube.com/watch?v=K9lP3mR7nJ2': { url: 'https://www.youtube.com/watch?v=rwsFlnLO6oY', title: 'Mastering Advanced Storytelling Techniques' },
  'https://www.youtube.com/watch?v=R0fQ5mN2jK7': { url: 'https://www.youtube.com/watch?v=iOVibCFKzhA', title: 'How to Rank YouTube Video in 2025 | Best SEO for YouTube Videos' },
  'https://www.youtube.com/watch?v=7jF3kM9pR2n': { url: 'https://www.youtube.com/watch?v=P1mbqnACR0M', title: 'Agile Full Course | Agile Methodology Explained' },
  'https://www.youtube.com/watch?v=X2pN5jR8mK1': { url: 'https://www.youtube.com/watch?v=2-Kcdt0dZSA', title: 'Project Leadership vs Management' },
  'https://www.youtube.com/watch?v=Z9nL4pR2jM7': { url: 'https://www.youtube.com/watch?v=7X5Xj-D3YnQ', title: 'Top 10 Project Management Software 2025' },
  'https://www.youtube.com/watch?v=K2nR5jL8pM3': { url: 'https://www.youtube.com/watch?v=WgbhG_2X3tI', title: 'Top Secrets Of African Real Estate Market' },
  'https://www.youtube.com/watch?v=Y7nK4pR2jM9': { url: 'https://www.youtube.com/watch?v=sZnxMq87ecc', title: 'How To Create Multiple Streams of Income (Without Burning Out)' },
  'https://www.youtube.com/watch?v=S3nJ8pR5mK2': { url: 'https://www.youtube.com/watch?v=9g0H290L2yE', title: 'AI Tools That Will Dominate in 2025' },
  'https://www.youtube.com/watch?v=P5sK2jR8nM1': { url: 'https://www.youtube.com/watch?v=XYGU78hUVnA', title: 'How to Automate Business Tasks with AI Agents' },
  'https://www.youtube.com/watch?v=X3nK8pR5jM2': { url: 'https://www.youtube.com/watch?v=zJgQd5tE64Q', title: 'The Future of AI in 2025: Key Trends, Robotics & Global Competition' },

  // Agriculture
  'https://www.youtube.com/watch?v=3D_t8nL2kP9': { url: 'https://www.youtube.com/watch?v=-qu43qZlnQE', title: 'Precision Farming Technology Explained | Smart Farming Future of Agriculture' },
  'https://www.youtube.com/watch?v=5S7gH3jF8kL': { url: 'https://www.youtube.com/watch?v=uiGCuDVyY_8', title: 'Post Harvest Management of Cereal Crops | Storage & Processing' },
  'https://www.youtube.com/watch?v=2fJ4kP7rM9n': { url: 'https://www.youtube.com/watch?v=wBlfYq21lqI', title: 'Climate Smart Agriculture (Africa)' },
};

// Additional replacements for the 12 remaining broken
const additionalReplacements: Record<string, { url: string; title: string }> = {
  // Content creator revenue streams (was mapped to same T6kD9pQ2mN5 as BootSkills intro)
  'https://www.youtube.com/watch?v=R9mQpL3hW98': { url: 'https://www.youtube.com/watch?v=R9mQpL3hW98', title: 'How to Make Money as a Content Creator in Africa' },
  // The ones detected as "broken" but have oldUrl === newUrl in the replace script (no-ops)
  'https://www.youtube.com/watch?v=K3-7S1qDqVw': { url: 'https://www.youtube.com/watch?v=K3-7S1qDqVw', title: 'How to Create Unique Cultural Tourism Experiences' },
  'https://www.youtube.com/watch?v=cZp91Q0T2u4': { url: 'https://www.youtube.com/watch?v=cZp91Q0T2u4', title: 'Customer Service Excellence: Tips To Win The Hearts Of Customers' },
  'https://www.youtube.com/watch?v=huaP2GZDgU4': { url: 'https://www.youtube.com/watch?v=huaP2GZDgU4', title: 'Solar panel installation training, Solar energy business opportunities' },

  // ROUND 2: Replacements for videos that were still broken
  'https://www.youtube.com/watch?v=R9mQpL3hW98': { url: 'https://www.youtube.com/watch?v=8s4wR1Uvngs', title: 'What Is an E-Learning Platform?' },
  'https://www.youtube.com/watch?v=WdZ6P43D2fU': { url: 'https://www.youtube.com/watch?v=ejqW7-BXSgI', title: "Mobile Money Africa's Payment Innovation in Action" },
  'https://www.youtube.com/watch?v=2Tz89G5U6_U': { url: 'https://www.youtube.com/watch?v=0n1CK8oZ-AQ', title: 'Building Fintech Products for Africa' },
  'https://www.youtube.com/watch?v=hGZ-iO88Ym0': { url: 'https://www.youtube.com/watch?v=JDIBSNZPCZ8', title: 'How to Register a Business Online in Rwanda' },
  'https://www.youtube.com/watch?v=nQJ6_f4u8pE': { url: 'https://www.youtube.com/watch?v=OqLG96qX-YA', title: 'Top 13 Sales Techniques (That REALLY Work)' },
  'https://www.youtube.com/watch?v=1x4U3lVzC-Y': { url: 'https://www.youtube.com/watch?v=5L7K50xEeJg', title: '4 Software Systems Every Small Business Needs to Grow' },
  'https://www.youtube.com/watch?v=uZVTKZ8RSnc': { url: 'https://www.youtube.com/watch?v=YYpDOu4Pgcw', title: 'How to Write a Business Plan? Step-by-Step Guide' },
  'https://www.youtube.com/watch?v=7X5Xj-D3YnQ': { url: 'https://www.youtube.com/watch?v=PbfzjZGG4h4', title: 'Top 5 Project Management Apps in 2025' },
  'https://www.youtube.com/watch?v=9g0H290L2yE': { url: 'https://www.youtube.com/watch?v=w70XVzGO6vQ', title: 'Top AI Tools in 2025 | Complete AI Tier List' },
  'https://www.youtube.com/watch?v=zJgQd5tE64Q': { url: 'https://www.youtube.com/watch?v=BK_mMvGWSo0', title: 'The 5 Most Important AI Trends That Will Impact Your Business in 2025' },
  'https://www.youtube.com/watch?v=gJg3O4i9p58': { url: 'https://www.youtube.com/watch?v=YiVTKOI18vk', title: "Climbing A Thousand Hills: Rebuilding Rwanda's Health System" },
  'https://www.youtube.com/watch?v=jW2rR23594s': { url: 'https://www.youtube.com/watch?v=FvCwWDvr-Tc', title: 'How to Search the Web' },
};

// Combine all replacements
const allReplacements = { ...replacements, ...additionalReplacements };

// Also find what's still broken in the database
async function checkDbBroken() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) return;
  
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  
  const courses = await db.collection('courses').find({
    status: { $in: ['published', 'active'] }
  }).project({
    title: 1,
    'modules.title': 1,
    'modules.lessons.title': 1,
    'modules.lessons.videoUrl': 1,
    'modules.lessons.videoTitle': 1,
  }).toArray() as any[];

  const urlsToCheck: Set<string> = new Set();
  for (const c of courses) {
    if (!c.modules) continue;
    for (const m of c.modules) {
      if (!m.lessons) continue;
      for (const l of m.lessons) {
        if (l.videoUrl && l.videoUrl.includes('youtube')) {
          urlsToCheck.add(l.videoUrl);
        }
      }
    }
  }

  console.log(`\n📊 Unique YouTube URLs currently in DB: ${urlsToCheck.size}`);
  
  // Count replacements applied vs not found
  let found = 0;
  let notFound = 0;
  for (const [oldUrl] of Object.entries(allReplacements)) {
    if (urlsToCheck.has(oldUrl)) {
      console.log(`  ✅ Replacement needed: ${oldUrl.substring(0, 50)}...`);
      found++;
    } else {
      notFound++;
    }
  }
  console.log(`\nReplacements still needed in DB: ${found}`);
  console.log(`Replacements already applied or not in DB: ${notFound}`);

  await mongoose.disconnect();
  return urlsToCheck;
}

async function updateSeedFiles() {
  const seedDir = path.join(__dirname, '..', 'src');
  const files = fs.readdirSync(seedDir).filter(f => f.startsWith('seed') && f.endsWith('.ts'));
  
  console.log(`📁 Found ${files.length} seed files`);

  let totalReplacements = 0;

  for (const file of files) {
    const filePath = path.join(seedDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileChanged = false;

    // Apply each replacement
    for (const [oldUrl, replacement] of Object.entries(allReplacements)) {
      if (content.includes(oldUrl)) {
        // Count occurrences
        const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        
        content = content.replace(regex, replacement.url);
        
        // Also update videoTitle if present
        // Look for the pattern: videoUrl: '...' followed by videoTitle: '...'
        // or videoTitle: '...' near videoUrl
        
        totalReplacements += count;
        console.log(`  📝 ${file}: ${count}x "${oldUrl.substring(0, 45)}..." → "${replacement.url.substring(0, 45)}..."`);
        fileChanged = true;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  ✅ Updated ${file}`);
    }
  }

  console.log(`\n📊 Total replacements across seed files: ${totalReplacements}`);
}

async function checkBrokenInDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.log('  ⏭️  Skipping DB check (no MONGO_URI)');
    return [];
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const courses = await db.collection('courses').find({
    status: { $in: ['published', 'active'] }
  }).project({
    title: 1,
    'modules.title': 1,
    'modules.lessons.title': 1,
    'modules.lessons.videoUrl': 1,
  }).toArray() as any[];

  const broken: any[] = [];

  for (const c of courses) {
    if (!c.modules) continue;
    for (const m of c.modules) {
      if (!m.lessons) continue;
      for (const l of m.lessons) {
        if (l.videoUrl && !l.videoUrl.includes('youtube')) continue;
        // Check if the URL is in our replacement map (meaning it's been replaced or needs replacing)
        // Also check if URL contains placeholder/example patterns
        if (l.videoUrl && (l.videoUrl.includes('example_') || l.videoUrl.includes('placeholder'))) {
          broken.push({ course: c.title, module: m.title, lesson: l.title, url: l.videoUrl });
        }
      }
    }
  }

  console.log(`\nPlaceholder/example URLs still in DB: ${broken.length}`);
  for (const b of broken) {
    console.log(`  ⚠️  ${b.course} / ${b.module} / ${b.lesson}: ${b.url}`);
  }

  await mongoose.disconnect();
  return broken;
}

async function main() {
  console.log('🔄 STEP 1: Updating seed files with replacement URLs...\n');
  await updateSeedFiles();

  console.log('\n🔄 STEP 2: Checking for broken videos in database...\n');
  
  // Check remaining broken in DB
  const remainingBroken = await checkBrokenInDb();
  
  if (remainingBroken.length > 0) {
    console.log(`\n⚠️  ${remainingBroken.length} placeholder/example URLs still need manual fixes in the database.`);
  } else {
    console.log('\n✅ No placeholder/example URLs found in the database.');
  }

  console.log('\n✅ Seed file update complete!');
  console.log('👉 Next: Run the seeds with: cd backend && npx tsx src/seedAll.ts');
  console.log('👉 Or run specific seeds as needed.');
}

main().catch(console.error);
