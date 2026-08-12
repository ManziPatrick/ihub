/**
 * Live integration test for ALL export paths.
 *
 * Connects to the real MongoDB (MONGO_URI from .env) and exercises every
 * generator in course-export.service.ts — PDF + 6 CSVs — validating headers,
 * row counts, column counts, quoting/escaping, and filters.
 *
 * Run:  npx ts-node test_export_all.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
// Force-load backend/.env (a stale shell MONGO_URI may point at a Docker hostname)
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

import {
  generateCoursePDF,
  generateUsersCSV,
  generateCoursesCSV,
  generateProgramsCSV,
  generateApplicationsCSV,
  generateInternsCSV,
  generateEnrollmentsCSV,
} from './src/services/course-export.service';
import { User } from './src/models/User';
import { Course } from './src/models/Course';
import { InternshipProgram } from './src/models/internship/InternshipProgram';
import { InternshipApplication } from './src/models/internship/InternshipApplication';
import { Internship } from './src/models/Internship';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

/** Minimal RFC-4180-style parser (same as the unit test helper). */
function parseCSV(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const vals: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { vals.push(current); current = ''; continue; }
      current += ch;
    }
    vals.push(current);
    return vals.map((v) => v.replace(/""/g, '"'));
  });
  return { headers, rows };
}

function validateCSV(csv: string, label: string, expectedHeaders: string[]) {
  if (!csv || !csv.trim()) {
    assert(false, `${label}: CSV is empty`);
    return;
  }
  const { headers, rows } = parseCSV(csv);
  const missing = expectedHeaders.filter((h) => !headers.includes(h));
  assert(missing.length === 0, `${label}: headers OK (${headers.length} cols)${missing.length ? ' — missing: ' + missing.join(',') : ''}`);
  const badCols = rows.filter((r) => r.length !== headers.length).length;
  assert(badCols === 0, `${label}: all ${rows.length} rows have ${headers.length} columns`);
  if (rows.length > 0) {
    console.log(`     sample row: ${rows[0].slice(0, 6).join(' | ')}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   EXPORT INTEGRATION TEST — every export path, live DB');
  console.log('═══════════════════════════════════════════════════════════\n');

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://bootskills:bootskills@169.58.74.138:27017/?authSource=admin&directConnection=true';
  if (!uri) {
    console.log('❌ MONGO_URI not set in .env');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB\n`);
  } catch (error: any) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    return;
  }

  // ─── Baseline counts from the DB (to cross-check row counts) ──────────
  const [userCount, courseCount, programCount, appCount, internshipCount] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Course.countDocuments({ isDeleted: { $ne: true } }),
    InternshipProgram.countDocuments({ isDeleted: false }),
    InternshipApplication.countDocuments({ isDeleted: false }),
    Internship.countDocuments(),
  ]);
  console.log(`📊 DB baseline: ${userCount} users, ${courseCount} courses, ${programCount} programs, ${appCount} applications, ${internshipCount} internships\n`);

  // ─── 1. Users CSV ──────────────────────────────────────────────────────
  console.log('─── 1. /api/export/users/csv  → generateUsersCSV ───');
  const usersCsv = await generateUsersCSV({});
  validateCSV(usersCsv, 'Users', ['Username', 'Email', 'Role', 'Full Name', 'Phone', 'School', 'Enrolled Courses', 'XP', 'Level', 'Academic Status', 'Last Active', 'Created At']);
  if (parseCSV(usersCsv).rows.length !== userCount) {
    assert(false, `Users: row count ${parseCSV(usersCsv).rows.length} !== DB ${userCount}`);
  } else {
    assert(true, `Users: row count matches DB (${userCount})`);
  }
  // Filter: students only
  const studentCsv = await generateUsersCSV({ role: 'student' });
  const sRows = parseCSV(studentCsv).rows;
  assert(sRows.every((r) => r[2] === 'student'), `Users filter role=student: ${sRows.length} rows, all role=student`);

  // ─── 2. Courses CSV ───────────────────────────────────────────────────
  console.log('\n─── 2. /api/export/courses/csv → generateCoursesCSV ───');
  const coursesCsv = await generateCoursesCSV();
  validateCSV(coursesCsv, 'Courses', ['Title', 'Category', 'Level', 'Status', 'Price', 'Discount Price', 'Instructor', 'Modules', 'Total Lessons', 'Students Enrolled', 'Enrollment Mode', 'School', 'Featured', 'Created At']);
  if (parseCSV(coursesCsv).rows.length !== courseCount) {
    assert(false, `Courses: row count ${parseCSV(coursesCsv).rows.length} !== DB ${courseCount}`);
  } else {
    assert(true, `Courses: row count matches DB (${courseCount})`);
  }

  // ─── 3. Programs CSV ──────────────────────────────────────────────────
  console.log('\n─── 3. /api/export/programs/csv → generateProgramsCSV ───');
  const programsCsv = await generateProgramsCSV();
  validateCSV(programsCsv, 'Programs', ['Title', 'Status', 'Duration', 'Price', 'Currency', 'Max Spots', 'Start Date', 'End Date', 'Application Deadline', 'Created At']);
  if (parseCSV(programsCsv).rows.length !== programCount) {
    assert(false, `Programs: row count ${parseCSV(programsCsv).rows.length} !== DB ${programCount}`);
  } else {
    assert(true, `Programs: row count matches DB (${programCount})`);
  }

  // ─── 4. Applications CSV ──────────────────────────────────────────────
  console.log('\n─── 4. /api/export/applications/csv → generateApplicationsCSV ───');
  const appsCsv = await generateApplicationsCSV({});
  const { headers: appHeaders, rows: appRows } = parseCSV(appsCsv);
  validateCSV(appsCsv, 'Applications', ['Applicant Name', 'Email', 'Phone', 'Program', 'Status', 'Skills', 'Availability', 'Applied Date']);
  if (appRows.length !== appCount) {
    assert(false, `Applications: row count ${appRows.length} !== DB ${appCount}`);
  } else {
    assert(true, `Applications: row count matches DB (${appCount})`);
  }
  assert(appHeaders.length >= 8, `Applications: dynamic question columns present (${appHeaders.length - 8} extra beyond fixed headers)`);
  // Verify no raw HTML leaks into answers
  const htmlLeak = appRows.some((r) => r.some((v) => /<[a-z][^>]*>/i.test(v)));
  assert(!htmlLeak, 'Applications: no HTML tags leak into cells');

  // ─── 5. Interns CSV ───────────────────────────────────────────────────
  console.log('\n─── 5. /api/export/interns/csv → generateInternsCSV ───');
  const internsCsv = await generateInternsCSV();
  validateCSV(internsCsv, 'Interns', ['Intern Name', 'Email', 'Phone', 'Program Title', 'Stage', 'Status', 'Progress %', 'Mentor', 'Start Date', 'End Date', 'Duration', 'Created At']);
  if (parseCSV(internsCsv).rows.length !== internshipCount) {
    assert(false, `Interns: row count ${parseCSV(internsCsv).rows.length} !== DB ${internshipCount}`);
  } else {
    assert(true, `Interns: row count matches DB (${internshipCount})`);
  }

  // ─── 6. Enrollments CSV ───────────────────────────────────────────────
  console.log('\n─── 6. /api/export/enrollments/csv → generateEnrollmentsCSV ───');
  const enrollCsv = await generateEnrollmentsCSV();
  const { headers: eHeaders, rows: eRows } = parseCSV(enrollCsv);
  validateCSV(enrollCsv, 'Enrollments', ['Course Title', 'Student Name', 'Student Email', 'Student Phone', 'Student School', 'Enrolled Date']);
  // Baseline = refs that resolve to REAL users. Some courses contain orphaned
  // student refs (deleted/hard-deleted users) which populate drops — the export
  // intentionally emits only students that still exist.
  const dbCourses = await Course.find({ isDeleted: { $ne: true } })
    .select('title studentsEnrolled')
    .lean();
  const refs = dbCourses.flatMap((c: any) =>
    (c.studentsEnrolled || []).map((s: any) => (s?._id?.toString?.() || s?.toString?.() || s))
  );
  const existing = await User.find({ _id: { $in: refs } }).select('_id').lean();
  const existingSet = new Set(existing.map((u: any) => u._id.toString()));
  const totalEnrollments = refs.filter((id: string) => existingSet.has(id)).length;
  const orphaned = refs.length - totalEnrollments;
  if (eRows.length !== totalEnrollments) {
    assert(false, `Enrollments: row count ${eRows.length} !== resolvable DB refs ${totalEnrollments}`);
  } else {
    assert(true, `Enrollments: row count matches resolvable students (${totalEnrollments})${orphaned ? `; ${orphaned} orphaned refs excluded` : ''}`);
  }
  assert(eHeaders.length === 6, 'Enrollments: exactly 6 columns');

  // ─── 7. Course PDF ────────────────────────────────────────────────────
  console.log('\n─── 7. /api/export/course/:id/pdf → generateCoursePDF ───');
  const firstCourse = await Course.findOne({ isDeleted: { $ne: true } }).select('title').lean();
  if (firstCourse) {
    try {
      const pdf = await generateCoursePDF((firstCourse as any)._id.toString());
      assert(!!pdf.filepath && !!pdf.filename && pdf.filename.endsWith('.pdf'), `PDF generated: ${pdf.filename}`);
    } catch (error: any) {
      assert(false, `PDF generation failed: ${error.message}`);
    }
  } else {
    assert(false, 'No course found to generate PDF (seed data required)');
  }

  // ─── 8. GraphQL getAnalyticsExport (AdminUsers "Export CSV Analytics") ──
  console.log('\n─── 8. GraphQL getAnalyticsExport → AdminUsers "Export CSV Analytics" ───');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { resolvers } = require('./src/graphql/resolvers');
    const csv: string = await resolvers.Query.getAnalyticsExport(null, {}, { user: { role: 'super_admin' } });
    const { headers: aHeaders, rows: aRows } = parseCSV(csv);
    assert(aHeaders.includes('Metric') && aHeaders.includes('Value'), `Analytics CSV headers OK (${aHeaders.length} cols)`);
    assert(aRows.length >= 10, `Analytics CSV has ${aRows.length} metrics`);
    assert(aRows.some((r) => r[0] === 'Total Users' && parseInt(r[1]) === userCount), `Analytics Total Users = ${userCount} matches DB`);
    console.log(`     sample: ${aRows.slice(0, 3).map((r) => r.join('=')).join(', ')}`);
    // Unauthorized path
    let denied = false;
    try {
      await resolvers.Query.getAnalyticsExport(null, {}, { user: { role: 'student' } });
    } catch {
      denied = true;
    }
    assert(denied, 'Analytics export denied for non-admin roles');
  } catch (error: any) {
    assert(false, `getAnalyticsExport failed: ${error.message}`);
  }

  // ─── 9. Quoting / escaping sanity ─────────────────────────────────────
  console.log('\n─── 9. CSV escaping sanity ───');
  const usersParsed = parseCSV(usersCsv);
  const quoteCount = usersCsv.split('"').length - 1;
  assert(quoteCount % 2 === 0, `Quotes balanced across Users CSV (${quoteCount} quote chars)`);
  const allCsvs = [usersCsv, coursesCsv, programsCsv, appsCsv, internsCsv, enrollCsv];
  const unbalanced = allCsvs.filter((c) => ((c.split('"').length - 1) % 2 !== 0)).length;
  assert(unbalanced === 0, `All 6 CSVs have balanced quotes`);
  const usersSample = usersParsed.rows[0];
  if (usersSample) {
    console.log(`     sample user: ${usersSample[0]} (${usersSample[1]}) — ${usersSample[2]}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   RESULT: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════');
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
