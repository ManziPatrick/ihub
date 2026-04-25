import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import connectDB from './config/db';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log("Connected to database for seeding course applications...");
    
    // Find all published courses
    const courses = await Course.find({ status: 'published' }).limit(5);
    
    if (courses.length === 0) {
      console.log("No courses found to update.");
      process.exit(0);
    }

    for (const course of courses) {
      course.enrollmentMode = 'application';
      course.allowedDeliveryModes = ['physical', 'online', 'hybrid'];
      course.applicationQuestions = [
        {
          label: 'Why do you want to join this course?',
          type: 'textarea',
          required: true
        },
        {
          label: 'What is your background in this field?',
          type: 'textarea',
          required: true
        },
        {
          label: 'Do you have a computer for the course?',
          type: 'select',
          options: ['Yes', 'No'],
          required: true
        },
        {
          label: 'Portfolio or GitHub Link',
          type: 'link',
          required: false
        }
      ] as any;
      await course.save();
      console.log(`Updated course: ${course.title} to application mode.`);
    }
    
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
