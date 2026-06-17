import mongoose from 'mongoose';
import connectDB from './src/config/db';
import { Course } from './src/models/Course';

async function check() {
  await connectDB();
  const courses = await Course.find({}, 'title level status category');
  console.log("Total courses in DB:", courses.length);
  for (const c of courses) {
    console.log(`- ${c.title} (${c.level}) [${c.category}] - Status: ${c.status}`);
  }
  process.exit(0);
}
check().catch(console.error);
