import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/models/User';

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const email = 'alainmanzi71@gmail.com';
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error('User not found:', email);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('Current role for', email, ':', user.role);
  if (user.role === 'student') {
    console.log('No change needed');
    await mongoose.disconnect();
    process.exit(0);
  }
  const res = await User.updateOne({ email }, { $set: { role: 'student' } });
  console.log('Update result:', res);
  const updated = await User.findOne({ email }).lean();
  console.log('Updated role:', updated?.role);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
