import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://mongo:Jonathan%402026.@109.123.252.110:27018/bootskills?authSource=admin&directConnection=true';
    console.log('📡 Connecting to MongoDB...');
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
