import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';

dotenv.config();

const setAllPricesTo1000 = async () => {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Update all courses that have a different price
    const result = await Course.updateMany(
      {},
      { $set: { price: 1000, currency: 'RWF', discountPrice: 0 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} courses to price: 1000 RWF`);
    
    // Show the count of all courses now
    const totalCourses = await Course.countDocuments();
    const pricedCourses = await Course.countDocuments({ price: 1000 });
    console.log(`📊 Total courses in DB: ${totalCourses}`);
    console.log(`📊 Courses with price 1000 RWF: ${pricedCourses}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating course prices:', error);
    process.exit(1);
  }
};

setAllPricesTo1000();
