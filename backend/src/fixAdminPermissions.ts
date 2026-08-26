/**
 * Migration: Grant all permissions to admin@bootskills.com and fix any admin
 * users that were created without permissions.
 *
 * Run with: npx ts-node backend/src/fixAdminPermissions.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ALL_PERMISSIONS = ['users', 'courses', 'payments', 'internships', 'analytics', 'students'];

async function fixAdminPermissions() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI or MONGO_URI environment variable is not set.');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Grant all permissions to admin@bootskills.com specifically
    const primaryAdmin = await User.findOneAndUpdate(
      { email: 'admin@bootskills.com' },
      { $set: { permissions: ALL_PERMISSIONS } },
      { new: true }
    );

    if (primaryAdmin) {
      console.log(`✅ admin@bootskills.com — permissions set to: ${ALL_PERMISSIONS.join(', ')}`);
      console.log(`   Role: ${primaryAdmin.role}, Username: ${primaryAdmin.username}\n`);
    } else {
      console.warn('⚠️  admin@bootskills.com not found in database. Skipping.\n');
    }

    // 2. Fix any other admin users that have empty/missing permissions
    const adminsNeedingFix = await User.find({
      role: 'admin',
      $or: [
        { permissions: { $exists: false } },
        { permissions: { $size: 0 } },
        { permissions: null },
      ],
    });

    if (adminsNeedingFix.length > 0) {
      console.log(`📋 Found ${adminsNeedingFix.length} additional admin(s) without permissions:\n`);
      for (const admin of adminsNeedingFix) {
        await User.findByIdAndUpdate(admin._id, { $set: { permissions: ALL_PERMISSIONS } });
        console.log(`   ✅ ${admin.email} (${admin.username}) — all permissions granted`);
      }
      console.log('');
    } else {
      console.log('✅ All admin users already have permissions set.\n');
    }

    // 3. Summary
    const allAdmins = await User.find({ role: 'admin', isDeleted: { $ne: true } })
      .select('email username permissions')
      .sort('email');

    console.log('📊 Admin permissions summary:');
    console.log('─'.repeat(60));
    for (const admin of allAdmins) {
      const perms = admin.permissions?.length ? admin.permissions.join(', ') : '❌ NONE';
      console.log(`   ${admin.email.padEnd(30)} → [${perms}]`);
    }
    console.log('─'.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminPermissions();
