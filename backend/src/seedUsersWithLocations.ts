import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import connectDB from './config/db';

dotenv.config();

const LOCATIONS = [
  { city: 'Kigali, Rwanda', lat: -1.9441, lng: 30.0619 },
  { city: 'Musanze, Rwanda', lat: -1.4996, lng: 29.6348 },
  { city: 'Butare, Rwanda', lat: -2.5967, lng: 29.7394 },
  { city: 'Huye, Rwanda', lat: -2.5870, lng: 29.7430 },
  { city: 'Rwamagana, Rwanda', lat: -1.9500, lng: 30.4333 },
  { city: 'Rubavu, Rwanda', lat: -1.6833, lng: 29.3500 },
  { city: 'Kayonza, Rwanda', lat: -1.7000, lng: 30.5167 },
  { city: 'Rusizi, Rwanda', lat: -2.4833, lng: 28.9000 },
  { city: 'Nyagatare, Rwanda', lat: -1.3000, lng: 30.3333 },
  { city: 'Gisenyi, Rwanda', lat: -1.6833, lng: 29.2500 },
  { city: 'Gitarama, Rwanda', lat: -2.0784, lng: 29.7567 },
  { city: 'Nyanza, Rwanda', lat: -2.3479, lng: 29.7430 },
  { city: 'Kibuye, Rwanda', lat: -2.0600, lng: 29.3500 },
  { city: 'Cyangugu, Rwanda', lat: -2.4833, lng: 28.9000 },
  { city: 'Kibungo, Rwanda', lat: -2.1500, lng: 30.5167 },
];

const USERS = [
  // Super Admins
  { username: 'superadmin', fullName: 'Patrick Manzi', email: 'superadmin@bootskills.com', password: 'Password@123', role: 'super_admin', locIdx: 0, title: 'Platform Owner' },
  { username: 'superadmin_kigali', fullName: 'Diane Uwimana', email: 'diane@bootskills.com', password: 'Password@123', role: 'super_admin', locIdx: 1, title: 'Platform Director' },
  
  // Admins
  { username: 'admin_kigali', fullName: 'Jean Pierre Habimana', email: 'admin@bootskills.com', password: 'Password@123', role: 'admin', locIdx: 0, title: 'Head of Operations' },
  { username: 'admin_musanze', fullName: 'Alice Mukamana', email: 'alice.admin@bootskills.com', password: 'Password@123', role: 'admin', locIdx: 1, title: 'Operations Manager' },
  { username: 'admin_butare', fullName: 'Bosco Niyonzima', email: 'bosco.admin@bootskills.com', password: 'Password@123', role: 'admin', locIdx: 2, title: 'Regional Coordinator' },
  { username: 'admin_rubavu', fullName: 'Claire Uwase', email: 'claire.admin@bootskills.com', password: 'Password@123', role: 'admin', locIdx: 5, title: 'Program Manager' },
  { username: 'admin_nyagatare', fullName: 'David Mugisha', email: 'david.admin@bootskills.com', password: 'Password@123', role: 'admin', locIdx: 8, title: 'Campus Lead' },
  
  // Trainers
  { username: 'trainer_kigali_1', fullName: 'Emmanuel Kagabo', email: 'emmanuel.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 0, title: 'Senior Full Stack Instructor' },
  { username: 'trainer_kigali_2', fullName: 'Grace Uwimana', email: 'grace.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 0, title: 'Data Science Instructor' },
  { username: 'trainer_musanze', fullName: 'Hakizimana Jean', email: 'jean.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 1, title: 'Mobile Development Trainer' },
  { username: 'trainer_butare', fullName: 'Irene Isimbi', email: 'irene.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 2, title: 'UI/UX Design Instructor' },
  { username: 'trainer_huye', fullName: 'Jean Claude Nsabimana', email: 'jc.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 3, title: 'Cloud Computing Instructor' },
  { username: 'trainer_rwamagana', fullName: 'Kevin Niyigena', email: 'kevin.trainer@bootskills.com', password: 'Password@123', role: 'trainer', locIdx: 4, title: 'Cybersecurity Trainer' },
  
  // Students
  { username: 'student_kigali_1', fullName: 'Alice Uwimana', email: 'alice.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 0, title: 'Web Development Student' },
  { username: 'student_kigali_2', fullName: 'Bob Habimana', email: 'bob.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 0, title: 'Data Science Student' },
  { username: 'student_musanze', fullName: 'Carla Mugisha', email: 'carla.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 1, title: 'Mobile Dev Student' },
  { username: 'student_butare', fullName: 'Daniel Niyonzima', email: 'daniel.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 2, title: 'UI/UX Student' },
  { username: 'student_huye', fullName: 'Eva Uwase', email: 'eva.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 3, title: 'Data Analytics Student' },
  { username: 'student_rwamagana', fullName: 'Felix Mugabo', email: 'felix.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 4, title: 'Full Stack Student' },
  { username: 'student_rubavu', fullName: 'Gloria Iradukunda', email: 'gloria.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 5, title: 'DevOps Student' },
  { username: 'student_kayonza', fullName: 'Henry Nshimiyimana', email: 'henry.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 6, title: 'Machine Learning Student' },
  { username: 'student_rusizi', fullName: 'Ivy Mukasine', email: 'ivy.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 7, title: 'Frontend Student' },
  { username: 'student_nyagatare', fullName: 'John Kabera', email: 'john.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 8, title: 'Backend Student' },
  { username: 'student_gisenyi', fullName: 'Kate Uwamahoro', email: 'kate.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 9, title: 'Cybersecurity Student' },
  { username: 'student_gitarama', fullName: 'Leo Baguma', email: 'leo.s@bootskills.com', password: 'Password@123', role: 'student', locIdx: 10, title: 'AI Student' },
  
  // Clients
  { username: 'client_kigali', fullName: 'Marie Claire Uwimana', email: 'marie.client@bootskills.com', password: 'Password@123', role: 'client', locIdx: 0, title: 'GreenTech Rwanda' },
  { username: 'client_musanze', fullName: 'Patrick Niyonzima', email: 'patrick.client@bootskills.com', password: 'Password@123', role: 'client', locIdx: 1, title: 'Shine Academy' },
  { username: 'client_butare', fullName: 'Sarah Uwase', email: 'sarah.client@bootskills.com', password: 'Password@123', role: 'client', locIdx: 2, title: 'AfriqInnovate' },
];

async function seedUsersWithLocations() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('Password@123', 10);
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const userData of USERS) {
      const loc = LOCATIONS[userData.locIdx];
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });

      if (existingUser) {
        // Update location if missing
        if (!existingUser.location) {
          existingUser.location = loc.city;
          existingUser.latitude = loc.lat;
          existingUser.longitude = loc.lng;
          existingUser.locationShared = true;
          existingUser.locationUpdatedAt = new Date();
          await existingUser.save();
          updated++;
          console.log(`🔄 Updated location for: ${userData.email} → ${loc.city}`);
        } else {
          skipped++;
        }
      } else {
        // Create new user
        const newUser = new User({
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          title: userData.title,
          location: loc.city,
          latitude: loc.lat,
          longitude: loc.lng,
          locationShared: true,
          locationUpdatedAt: new Date(),
          status: 'active',
          isEmailVerified: true,
          level: 10,
          xp: 1000,
          bio: `${userData.role} based in ${loc.city}.`,
        });
        await newUser.save();
        created++;
        console.log(`✅ Created ${userData.role}: ${userData.fullName} @ ${loc.city}`);
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${created} new users`);
    console.log(`   🔄 Updated: ${updated} existing users (added location)`);
    console.log(`   ⏭️  Skipped: ${skipped} existing users (already have location)`);
    console.log(`   📍 Total locations used: ${new Set(USERS.map(u => LOCATIONS[u.locIdx].city)).size}`);
    console.log('\n🔑 Default password: Password@123 for all accounts');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users with locations:', error);
    process.exit(1);
  }
}

seedUsersWithLocations();
