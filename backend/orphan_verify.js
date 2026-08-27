const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  // Sync denormalized studentsEnrolledCount to match the cleaned arrays
  const courses = await db.collection('courses').find({ studentsEnrolled: { $exists: true } }, { _id: 1, studentsEnrolled: 1, studentsEnrolledCount: 1 }).toArray();
  let synced = 0;
  for (const c of courses) {
    const n = (c.studentsEnrolled || []).length;
    if ((c.studentsEnrolledCount || 0) !== n) {
      await db.collection('courses').updateOne({ _id: c._id }, { $set: { studentsEnrolledCount: n } });
      synced++;
    }
  }
  console.log('studentsEnrolledCount synced on:', synced, 'courses');

  // Re-verify: any orphans left?
  const users = await db.collection('users').find({ enrolledCourses: { $exists: true, $not: { $size: 0 } } }, { _id: 1, enrolledCourses: 1 }).toArray();
  const validC = new Set((await db.collection('courses').find({}, { _id: 1 }).toArray()).map(c => c._id.toString()));
  let uOrphan = 0;
  for (const u of users) for (const x of (u.enrolledCourses || [])) if (!validC.has((x && x._id ? x._id : x).toString())) uOrphan++;
  console.log('remaining enrolledCourses orphans:', uOrphan);

  const crs = await db.collection('courses').find({ studentsEnrolled: { $exists: true, $not: { $size: 0 } } }, { _id: 1, studentsEnrolled: 1 }).toArray();
  const validU = new Set((await db.collection('users').find({}, { _id: 1 }).toArray()).map(u => u._id.toString()));
  let cOrphan = 0;
  for (const c of crs) for (const x of (c.studentsEnrolled || [])) if (!validU.has((x && x._id ? x._id : x).toString())) cOrphan++;
  console.log('remaining studentsEnrolled orphans:', cOrphan);

  const cl = await db.collection('users').find({ completedLessons: { $exists: true, $not: { $size: 0 } } }, { completedLessons: 1 }).toArray();
  let clBad = 0;
  for (const u of cl) for (const e of (u.completedLessons || [])) if (!e || !e.courseId || !ObjectId.isValid(e.courseId) || !validC.has(e.courseId.toString())) clBad++;
  console.log('remaining completedLessons orphans:', clBad);

  const cp = await db.collection('users').find({ courseProgress: { $exists: true, $not: { $size: 0 } } }, { courseProgress: 1 }).toArray();
  let cpBad = 0;
  for (const u of cp) for (const e of (u.courseProgress || [])) if (!e || !e.courseId || !ObjectId.isValid(e.courseId) || !validC.has(e.courseId.toString())) cpBad++;
  console.log('remaining courseProgress orphans:', cpBad);

  // Show cleaned users
  const sample = await db.collection('users').find({ username: { $in: ['jonakarisa', 'alain_student', 'grace_student'] } }, { username: 1, enrolledCourses: 1 }).toArray();
  sample.forEach(u => console.log(' -', u.username, 'enrolled refs now:', (u.enrolledCourses || []).length));

  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
