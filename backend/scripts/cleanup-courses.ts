/**
 * 🧹 CLEANUP COURSES
 *
 * 1. Fix the duplicate seoBasics video URL in Digital Marketing course
 * 2. Delete all courses EXCEPT: JavaScript, Data Structure, Figma, and all 10 MVP courses
 *
 * Usage: cd backend && npx tsx scripts/cleanup-courses.ts
 */

import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import { Course } from '../src/models/Course';

dotenv.config();

const COURSES_TO_KEEP = [
  // === JavaScript Courses ===
  'Introduction to JavaScript — Complete Beginner Course',
  'Interactive Coding Bootcamp',
  'Advanced JavaScript — Practical Exercises & Tests',
  'JavaScript Coding Challenges — From Arrays to Algorithms',
  'Complete JavaScript Mastery — From Variables to Advanced',

  // === Data Structure Courses ===
  'Algorithms & Data Structures (with Code Editor)',
  'Data Structures Mastery for Beginners for all',

  // === Figma / UI/UX ===
  'UI/UX Design Masterclass',

  // === All 10 MVP Courses (from seedMVPCourses.ts) ===
  'Digital Marketing That Works in Rwanda',
  'Mobile Money Mastery: M-Pesa, MoMo & Fintech in Rwanda',
  'Earn in Dollars: Freelancing & Remote Work from Rwanda',
  'Start Your Business in Rwanda: From Idea to Launch',
  'Professional English for Rwandan Professionals',
  'Smart Farming in Rwanda: AgriTech for Modern Farmers',
  'Create & Earn: Content Creation for Rwandan Youth',
  'Project Management for Rwandan Professionals',
  'Build Wealth: Personal Finance & Investing in Rwanda',
  'AI for Rwandans: How to Use ChatGPT & Automation',
];

async function cleanup() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // ─── Part 1: Fix duplicate video URL ───
    console.log('🔧 Fixing duplicate video URL in Digital Marketing...');
    const dmCourse = await Course.findOne({ title: 'Digital Marketing That Works in Rwanda' });
    if (dmCourse) {
      const module6 = dmCourse.modules[5];
      if (module6) {
        const lesson0 = module6.lessons[0];
        if (lesson0 && lesson0.title === 'Setting Up WhatsApp Business') {
          const oldUrl = lesson0.videoUrl;
          lesson0.videoUrl = 'https://www.youtube.com/watch?v=7f1oFkIVbJw';
          await dmCourse.save();
          console.log(`   ✅ Fixed: ${oldUrl} → ${lesson0.videoUrl}`);
        }
      }
    } else {
      console.log('   ⚠️ Digital Marketing course not found');
    }

    // ─── Part 2: Delete courses not in keep list ───
    console.log('\n🗑️  Deleting courses not in keep list...');
    
    const allCourses = await Course.find({});
    let deleted = 0;
    let kept = 0;

    for (const course of allCourses) {
      if (COURSES_TO_KEEP.includes(course.title)) {
        console.log(`   ✅ KEPT: "${course.title}" (${course.modules?.length || 0} modules)`);
        kept++;
      } else {
        await Course.findByIdAndDelete(course._id);
        console.log(`   ❌ DELETED: "${course.title}"`);
        deleted++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Kept: ${kept} courses`);
    console.log(`   Deleted: ${deleted} courses`);
    console.log(`   Remaining: ${kept} courses`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

cleanup();
