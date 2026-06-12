import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import connectDB from './config/db';

dotenv.config();

const seedFeaturedCourses = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Reset any existing featured flags first
    await Course.updateMany({}, { $set: { isFeatured: false } });
    console.log('🔄 Reset all isFeatured flags');

    // Fetch all published courses, sort in-memory by enrollment count (highest first)
    // MongoDB's .sort() doesn't sort by array length, so we do it in-memory
    const courses = await Course.find({
      isDeleted: { $ne: true },
      status: { $in: ['published'] }
    }).lean();

    // Sort by enrollment count desc, then by recency desc
    courses.sort((a: any, b: any) => {
      const countDiff = (b.studentsEnrolled?.length || 0) - (a.studentsEnrolled?.length || 0);
      if (countDiff !== 0) return countDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const featured = courses.slice(0, Math.min(8, courses.length));
    const featuredIds = featured.map((c: any) => c._id);

    console.log(`📚 Found ${courses.length} published courses — marking top ${featuredIds.length} as featured.`);

    await Course.updateMany(
      { _id: { $in: featuredIds } },
      { $set: { isFeatured: true } }
    );

    console.log(`\n⭐ Featured courses:`);
    for (const c of featured) {
      const enrollCount = (c as any).studentsEnrolled?.length || 0;
      console.log(`  • ${(c as any).title} — ${enrollCount} enrolled, ${(c as any).school || 'No school'}`);
    }

    console.log('\n🏁 Done! FeaturedCourses section will now show content.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedFeaturedCourses();
