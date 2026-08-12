/**
 * Live test for the Program Command Center workflow flow:
 *   createInternship (payment now optional) → updateInternshipStage → gradeSprintMilestone → deleteInternship
 * Creates a temporary internship for a real student and removes it afterwards.
 *
 * Run:  npx ts-node test_workflow_board.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env'), override: true });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolvers } = require('./src/graphql/resolvers');

let passed = 0;
let failed = 0;
const assert = (cond: boolean, msg: string) => {
  if (cond) { console.log(`  ✅ ${msg}`); passed++; }
  else { console.log(`  ❌ ${msg}`); failed++; }
};

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://bootskills:bootskills@169.58.74.138:27017/?authSource=admin&directConnection=true';
  await mongoose.connect(uri);
  console.log('Connected.\n');

  const adminCtx = { user: { id: '000000000000000000000000', role: 'super_admin' } };

  // 1. Pick a real student
  const { User } = require('./src/models/User');
  const student = await User.findOne({ role: 'student', isDeleted: { $ne: true } }).select('_id username').lean();
  if (!student) { console.log('❌ No student found to test with'); process.exit(1); }
  console.log(`Student: ${(student as any).username}\n`);

  let internshipId: string | null = null;
  try {
    // 2. Create internship WITHOUT payment (new optional path)
    console.log('─── createInternship (no payment passed) ───');
    const created: any = await resolvers.Mutation.createInternship(null, {
      userId: (student as any)._id.toString(),
      title: `${(student as any).username} — Internship Program`,
      organization: 'Ihub Academy',
      duration: '6 Months',
      type: 'Online',
      stage: 'Stage 1: Orientation & Onboarding',
    }, adminCtx);
    internshipId = created._id?.toString() || created.id;
    assert(!!internshipId, 'Internship created');
    assert(created.payment && created.payment.amount === 0, `Payment defaulted to zero-amount (amount=${created.payment?.amount})`);
    assert(created.currentStage === 1, 'Defaults to Stage 1');
    console.log(`     id=${internshipId}`);

    // 3. Move to stage 3
    console.log('\n─── updateInternshipStage (1 → 3) ───');
    const moved: any = await resolvers.Mutation.updateInternshipStage(null, {
      id: internshipId,
      stage: 'Stage 3: Guided Practical Projects',
      currentStage: 3,
    }, adminCtx);
    assert(moved.currentStage === 3, `currentStage = ${moved.currentStage}`);
    assert(moved.stage === 'Stage 3: Guided Practical Projects', 'stage title updated');
    assert(moved.progress === 33 || moved.progress === 34, `progress = ${moved.progress} (base from stage)`);
    assert(moved.completedStages?.includes('Stage 1: Orientation & Onboarding'), 'Previous stage recorded in completedStages');

    // 4. Grade the intern
    console.log('\n─── gradeSprintMilestone (week 1, 85/100) ───');
    const graded: any = await resolvers.Mutation.gradeSprintMilestone(null, {
      internshipId,
      week: 1,
      grade: 85,
      feedback: 'Great progress in guided projects.',
    }, adminCtx);
    assert(graded.sprintReviews?.length === 1, 'Sprint review recorded');
    assert(graded.sprintReviews[0].grade === 85, `Grade = ${graded.sprintReviews[0].grade}`);
    assert(graded.sprintReviews[0].week === 1, 'Week recorded');

    // 5. Move to stage 6 → graduated
    console.log('\n─── updateInternshipStage (3 → 6, should graduate) ───');
    const graduated: any = await resolvers.Mutation.updateInternshipStage(null, {
      id: internshipId,
      stage: 'Stage 6: Career Transition & Placement Support',
      currentStage: 6,
    }, adminCtx);
    assert(graduated.status === 'graduated', `status = ${graduated.status}`);
    assert(graduated.progress === 100, `progress = ${graduated.progress}`);

    // 6. Unauthorized checks
    console.log('\n─── Authorization ───');
    let deniedStage = false;
    try {
      await resolvers.Mutation.updateInternshipStage(null, { id: internshipId, stage: 'x', currentStage: 2 }, { user: { id: 's', role: 'student' } });
    } catch { deniedStage = true; }
    assert(deniedStage, 'Student cannot move stages');

    let deniedDelete = false;
    try {
      await resolvers.Mutation.deleteInternship(null, { id: internshipId }, { user: { id: 't', role: 'trainer' } });
    } catch { deniedDelete = true; }
    assert(deniedDelete, 'Trainer cannot delete internships (admin only)');
  } catch (error: any) {
    assert(false, `Flow failed: ${error.message}`);
    console.error(error);
  } finally {
    // 7. Cleanup
    if (internshipId) {
      await resolvers.Mutation.deleteInternship(null, { id: internshipId }, adminCtx);
      const { Internship } = require('./src/models/Internship');
      const gone = await Internship.findById(internshipId).lean();
      assert(!gone, 'Cleanup: test internship deleted');
    }
  }

  console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
