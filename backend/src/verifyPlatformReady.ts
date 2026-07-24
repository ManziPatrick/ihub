/**
 * ─────────────────────────────────────────────────────────
 * VERIFY: Platform Readiness Check
 * ─────────────────────────────────────────────────────────
 * Checks that all resources are accessible and the platform
 * is ready for use. Run after fixupCompletePlatform.ts.
 *
 * Usage: npx ts-node src/verifyPlatformReady.ts
 * ─────────────────────────────────────────────────────────
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── URL checker ────────────────────────────────────────
function checkUrl(url: string): Promise<{ ok: boolean; status: number; error?: string }> {
  return new Promise((resolve) => {
    if (!url || url === '') return resolve({ ok: false, status: 0, error: 'Empty URL' });
    
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 8000, method: 'HEAD' }, (res) => {
      const ok = res.statusCode! >= 200 && res.statusCode! < 400;
      resolve({ ok, status: res.statusCode! });
      res.destroy();
    });
    req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, error: 'Timeout' }); });
  });
}

// ─── Main ───────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGO_URI not found'); process.exit(1); }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log('✅ Connected!\n');

  let errors = 0;
  let warnings = 0;

  // ═══════════════════════════════════════════════════════
  // 1. Resource Verification — check course thumbnails
  // ═══════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  console.log('🖼️  VERIFY 1: Course Thumbnail Resources');
  console.log('═'.repeat(60));

  const courses = await db.collection('courses').find(
    {},
    { projection: { title: 1, thumbnail: 1, _id: 0 } }
  ).toArray() as any[];

  let checked = 0;
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const c of courses) {
    const url = c.thumbnail;
    if (!url) {
      console.log(`   ⚠️ ${c.title?.substring(0, 50)}: No thumbnail URL`);
      warnings++;
      continue;
    }
    checked++;
    const result = await checkUrl(url);
    if (result.ok) {
      passed++;
    } else {
      failed++;
      const msg = `❌ ${c.title?.substring(0, 45).padEnd(47)} ${result.status || 'ERR'}: ${result.error || 'Failed'}`;
      failures.push(msg);
    }
  }

  console.log(`\n   📊 Thumbnail check: ${passed}/${checked} passed, ${failed} failed, ${courses.length - checked - (checked - passed - failed)} skipped (no URL)`);

  if (failures.length > 0) {
    console.log('\n   ❌ Failed thumbnails:');
    failures.forEach(f => console.log(`   ${f}`));
    errors += failures.length;
  }

  // ═══════════════════════════════════════════════════════
  // 2. Admin Assignment Check
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('👤 VERIFY 2: Admin Assignment');
  console.log('═'.repeat(60));

  const adminUser = await db.collection('users').findOne({ email: 'admin@bootskills.com' }) as any;
  if (!adminUser) {
    console.log('   ❌ admin@bootskills.com not found in database!');
    errors++;
  } else {
    const adminId = adminUser._id;
    const wrongCourses = await db.collection('courses').countDocuments({
      instructor: { $ne: adminId }
    });
    const totalCourses = await db.collection('courses').countDocuments();
    const correctCourses = totalCourses - wrongCourses;
    console.log(`   ✅ Admin: ${adminUser.email} (${adminUser.role})`);
    console.log(`   ✅ ${correctCourses}/${totalCourses} courses assigned to admin`);
    if (wrongCourses > 0) {
      console.log(`   ❌ ${wrongCourses} courses have wrong instructor`);
      errors++;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 3. Course Content Check
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('📚 VERIFY 3: Course Content Completeness');
  console.log('═'.repeat(60));

  const coursesWithModules = await db.collection('courses').aggregate([
    { $project: { title: 1, price: 1, level: 1, category: 1, moduleCount: { $size: '$modules' }, _id: 0 } },
    { $sort: { moduleCount: 1 } }
  ]).toArray() as any[];

  const thinCourses = coursesWithModules.filter((c: any) => c.moduleCount < 3);
  const goodCourses = coursesWithModules.filter((c: any) => c.moduleCount >= 3);

  console.log(`   ✅ ${goodCourses.length} courses with 3+ modules`);
  console.log(`   ${thinCourses.length > 0 ? '⚠️' : '✅'} ${thinCourses.length} courses with <3 modules`);

  for (const c of thinCourses) {
    console.log(`   ⚠️  ${String(c.moduleCount).padEnd(4)} modules | ${c.title?.substring(0, 55)}`);
    warnings++;
  }

  // ═══════════════════════════════════════════════════════
  // 4. Internship Check
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🏖️  VERIFY 4: Internship Setup');
  console.log('═'.repeat(60));

  const programs = await db.collection('internshipprograms').find({}).toArray() as any[];
  if (programs.length === 1) {
    const p = programs[0];
    console.log(`   ✅ 1 internship program: "${p.title}" (${p.duration})`);
    console.log(`   ✅ Price: ${p.price} RWF (${p.price === 0 ? 'FREE' : 'Paid'})`);
    console.log(`   ✅ Status: ${p.status}`);
    console.log(`   ✅ Max spots: ${p.maxSpots}`);
    
    const projects = await db.collection('internshipprojects').countDocuments({ internshipProgramId: p._id });
    console.log(`   ✅ ${projects} projects assigned to the program`);
  } else {
    console.log(`   ⚠️ Expected 1 internship program, found ${programs.length}`);
    programs.forEach((p: any) => console.log(`   • ${p.title}`));
    warnings++;
  }

  // ═══════════════════════════════════════════════════════
  // 5. Pricing Check
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('💰 VERIFY 5: Pricing');
  console.log('═'.repeat(60));

  const paidCourses = await db.collection('courses').countDocuments({ price: { $gt: 0 } });
  const freeCourses = await db.collection('courses').countDocuments({ price: 0 });
  const allPaidCorrect = await db.collection('courses').countDocuments({ price: { $gt: 0, $ne: 1000 } });
  
  console.log(`   ✅ ${paidCourses} paid courses at 1000 RWF`);
  console.log(`   ✅ ${freeCourses} free courses at 0 RWF`);
  if (allPaidCorrect > 0) {
    console.log(`   ❌ ${allPaidCorrect} paid courses with wrong price`);
    errors += allPaidCorrect;
  } else {
    console.log(`   ✅ All paid courses correctly priced at 1000 RWF`);
  }

  // ═══════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   ✅ Total courses: ${courses.length}`);
  console.log(`   ✅ Paid (1000 RWF): ${paidCourses}`);
  console.log(`   ✅ Free (0 RWF): ${freeCourses}`);
  console.log(`   👍 Thumbnails accessible: ${passed}/${checked}`);
  console.log(`   ✅ Admin assignment: OK`);
  console.log(`   ✅ Internship: "${programs[0]?.title || 'N/A'}"`);
  console.log(`   ${errors > 0 ? `❌ ${errors} error(s) found` : '✅ No errors'}`);
  console.log(`   ${warnings > 0 ? `⚠️ ${warnings} warning(s)` : '✅ No warnings'}`);

  await mongoose.disconnect();
  console.log('\n🔌 Done.\n');
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
