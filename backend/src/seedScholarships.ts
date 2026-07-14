import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Scholarship } from './models/Scholarship';
import { User } from './models/User';
import { Course } from './models/Course';
import { InternshipProgram } from './models/internship/InternshipProgram';
import connectDB from './config/db';
import { scholarshipResolvers } from './graphql/scholarship-resolvers';

dotenv.config();

/**
 * Seed script for creating sample scholarship records.
 * Run: npx ts-node src/seedScholarships.ts
 *
 * This script:
 * 1. Finds existing users, courses, and internship programs
 * 2. Creates a variety of active and revoked scholarships
 * 3. Outputs a summary of what was created
 */
async function seedScholarships() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // -- Find reference data -------------------------------------------------
    const superAdmin = await User.findOne({ role: 'super_admin' }).sort({ createdAt: 1 });
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    const students = await User.find({ role: 'student', isDeleted: { $ne: true } }).limit(8);
    const courses = await Course.find({ isDeleted: { $ne: true } }).limit(6);
    const programs = await InternshipProgram.find({ isDeleted: { $ne: true } }).limit(4);

    if (!superAdmin) {
      console.error('❌ No super_admin user found. Run seed.ts first.');
      process.exit(1);
    }
    if (!admin) {
      console.error('❌ No admin user found. Run seed.ts first.');
      process.exit(1);
    }
    if (students.length < 3) {
      console.error('❌ Need at least 3 students. Run seed.ts first.');
      process.exit(1);
    }
    if (courses.length < 2) {
      console.error('❌ Need at least 2 courses. Run seed.ts first.');
      process.exit(1);
    }

    const grantor = admin;
    const secondAdmin = await User.findOne({ role: 'admin', _id: { $ne: admin._id } }).sort({ createdAt: 1 }) || admin;

    console.log(`📊 Found reference data:`);
    console.log(`   • Grantors: ${grantor.username}, ${secondAdmin.username}`);
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Courses: ${courses.length}`);
    console.log(`   • Internship Programs: ${programs.length}\n`);

    // -- Delete existing scholarships -----------------------------------------
    const existingCount = await Scholarship.countDocuments();
    if (existingCount > 0) {
      console.log(`🧹 Deleting ${existingCount} existing scholarship(s)...`);
      await Scholarship.deleteMany({});
    }

    // -- Create scholarships --------------------------------------------------
    const scholarships: Array<{
      userId: mongoose.Types.ObjectId;
      grantedBy: mongoose.Types.ObjectId;
      type: 'course' | 'internship';
      itemId: mongoose.Types.ObjectId;
      itemTitle: string;
      status: 'active' | 'revoked';
      reason?: string;
      revokedAt?: Date;
      revokedBy?: mongoose.Types.ObjectId;
      revokedReason?: string;
    }> = [];

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    // 1. Active course scholarship — merit-based
    scholarships.push({
      userId: students[0]._id,
      grantedBy: grantor._id,
      type: 'course',
      itemId: courses[0]._id,
      itemTitle: courses[0].title,
      status: 'active',
      reason: 'Merit-based academic excellence — top performer in previous courses',
    });

    // 2. Active course scholarship — financial aid
    scholarships.push({
      userId: students[1]._id,
      grantedBy: grantor._id,
      type: 'course',
      itemId: courses[1]._id,
      itemTitle: courses[1].title,
      status: 'active',
      reason: 'Financial aid — full scholarship for underrepresented students',
    });

    // 3. Active course scholarship — needs-based
    if (courses.length > 2) {
      scholarships.push({
        userId: students[2]._id,
        grantedBy: secondAdmin._id,
        type: 'course',
        itemId: courses[2]._id,
        itemTitle: courses[2].title,
        status: 'active',
        reason: 'Needs-based assistance — demonstrated financial need',
      });
    }

    // 4. Revoked course scholarship — policy violation
    if (courses.length > 3) {
      scholarships.push({
        userId: students[3]?._id || students[0]._id,
        grantedBy: grantor._id,
        type: 'course',
        itemId: courses[3]._id,
        itemTitle: courses[3].title,
        status: 'revoked',
        reason: 'Community partnership program',
        revokedAt: daysAgo(15),
        revokedBy: superAdmin._id,
        revokedReason: 'Student failed to maintain minimum academic progress (GPA < 2.0)',
      });
    }

    // 5. Revoked course scholarship — no longer eligible
    if (courses.length > 4) {
      scholarships.push({
        userId: students[4]?._id || students[1]._id,
        grantedBy: secondAdmin._id,
        type: 'course',
        itemId: courses[4]._id,
        itemTitle: courses[4].title,
        status: 'revoked',
        reason: 'Women in Tech scholarship program',
        revokedAt: daysAgo(30),
        revokedBy: superAdmin._id,
        revokedReason: 'Student requested cancellation — personal reasons',
      });
    }

    // 6. Active internship scholarship
    if (programs.length > 0) {
      scholarships.push({
        userId: students[5]?._id || students[1]._id,
        grantedBy: grantor._id,
        type: 'internship',
        itemId: programs[0]._id,
        itemTitle: programs[0].title,
        status: 'active',
        reason: 'Internship grant for outstanding software engineering talent',
      });
    }

    // 7. Active internship scholarship — second program
    if (programs.length > 1) {
      scholarships.push({
        userId: students[6]?._id || students[2]._id,
        grantedBy: secondAdmin._id,
        type: 'internship',
        itemId: programs[1]._id,
        itemTitle: programs[1].title,
        status: 'active',
        reason: 'Data analytics talent development program',
      });
    }

    // 8. Revoked internship scholarship
    if (programs.length > 2) {
      scholarships.push({
        userId: students[7]?._id || students[0]._id,
        grantedBy: grantor._id,
        type: 'internship',
        itemId: programs[2]._id,
        itemTitle: programs[2].title,
        status: 'revoked',
        reason: 'Government-sponsored skills development',
        revokedAt: daysAgo(7),
        revokedBy: superAdmin._id,
        revokedReason: 'Student did not complete mandatory prerequisite training',
      });
    }

    // 9. Course scholarship — granted by super_admin directly
    if (courses.length > 5) {
      scholarships.push({
        userId: students[0]._id,
        grantedBy: superAdmin._id,
        type: 'course',
        itemId: courses[5]._id,
        itemTitle: courses[5].title,
        status: 'active',
        reason: 'Super admin grant — special recognition award',
      });
    }

    // 10. Another active course with a different reason
    scholarships.push({
      userId: students[2]._id,
      grantedBy: grantor._id,
      type: 'course',
      itemId: courses[0]._id,
      itemTitle: courses[0].title,
      status: 'active',
      reason: 'Peer recommendation — referred by faculty',
    });

    // -- Insert all scholarships at once ---------------------------------------
    const inserted = await Scholarship.insertMany(scholarships);
    console.log(`✅ Created ${inserted.length} scholarship records:\n`);

    // -- Summary --------------------------------------------------------------
    const activeCount = inserted.filter((s: any) => s.status === 'active').length;
    const revokedCount = inserted.filter((s: any) => s.status === 'revoked').length;
    const courseCount = inserted.filter((s: any) => s.type === 'course').length;
    const internshipCount = inserted.filter((s: any) => s.type === 'internship').length;

    console.log('📊 Scholarship Summary:');
    console.log(`   • Total: ${inserted.length}`);
    console.log(`   • Active: ${activeCount}`);
    console.log(`   • Revoked: ${revokedCount}`);
    console.log(`   • Course: ${courseCount}`);
    console.log(`   • Internship: ${internshipCount}`);
    console.log('');

    // Print details
    for (const s of inserted) {
      const student = await User.findById(s.userId).select('username fullName email');
      const grantorUser = await User.findById(s.grantedBy).select('username');
      const statusIcon = s.status === 'active' ? '🟢' : '🔴';
      console.log(
        `   ${statusIcon} [${s.type}] ${s.itemTitle.substring(0, 50).padEnd(52)} ` +
        `→ ${(student as any)?.username?.padEnd(20)} ` +
        `(by ${(grantorUser as any)?.username}) ${s.status === 'revoked' ? '— revoked' : ''}`
      );
    }

    console.log('\n✅ Scholarship seeding complete!\n');

    // ── Demo: Trigger admin notification emails via resolvers ──────────────
    // This simulates real approval and revocation to verify that email
    // notifications are sent to the granting admin.
    console.log('📧 Demo: Triggering admin email notifications...\n');

    // Create a pending scholarship (admin-granted, needs super_admin approval)
    const pendingCourse = await Course.findOne({ isDeleted: { $ne: true }, _id: { $nin: scholarships.map(s => s.itemId) } });

    if (pendingCourse) {
      const pendingScholarship = new Scholarship({
        userId: students[0]._id,
        grantedBy: grantor._id,
        type: 'course',
        itemId: pendingCourse._id,
        itemTitle: pendingCourse.title,
        reason: 'Demo — pending scholarship for email verification',
        status: 'pending',
      });
      const savedPending = await pendingScholarship.save();
      console.log(`   📋 Created pending scholarship (${savedPending._id}) → will trigger approval email`);

      // Construct a mock context for the resolver calls
      const superAdminContext = {
        user: {
          id: superAdmin._id.toString(),
          username: superAdmin.username,
          role: 'super_admin',
        },
      };

      // 1) Approve — triggers sendScholarshipApprovedToAdmin
      try {
        const approved = await scholarshipResolvers.Mutation.approveScholarship(
          null as any,
          { id: savedPending._id.toString() },
          superAdminContext
        );
        console.log(`   ✅ Approved: ${approved.itemTitle} — (email sent to granting admin)`);
      } catch (err: any) {
        console.warn(`   ⚠️ Approval failed: ${err.message}`);
      }

      // 2) Create another pending and revoke it — triggers sendScholarshipRevokedToAdmin
      const revokedScholarship = new Scholarship({
        userId: students[1]._id,
        grantedBy: secondAdmin._id,
        type: 'course',
        itemId: pendingCourse._id,
        itemTitle: pendingCourse.title,
        reason: 'Demo — pending scholarship for revocation email',
        status: 'pending',
      });
      const savedRevoked = await revokedScholarship.save();
      console.log(`   📋 Created pending scholarship (${savedRevoked._id}) → will trigger revocation email`);

      try {
        const revoked = await scholarshipResolvers.Mutation.revokeScholarship(
          null as any,
          { id: savedRevoked._id.toString(), reason: 'Demo: This scholarship was revoked to test the admin notification email. Student did not meet the eligibility criteria for this course.' },
          superAdminContext
        );
        console.log(`   🔴 Revoked: ${revoked.itemTitle} — (email sent to granting admin)`);
      } catch (err: any) {
        console.warn(`   ⚠️ Revocation failed: ${err.message}`);
      }

      console.log('\n📧 Demo complete! Check the console logs above for email send confirmations.');
      console.log('   If SMTP is configured, the granting admins will have received emails.');
    } else {
      console.log('   ⏭️  Skipping email demo — no unused course found for pending scholarships');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding scholarships:', error);
    process.exit(1);
  }
}

seedScholarships();
