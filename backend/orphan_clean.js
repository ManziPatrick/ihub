const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  // Valid course ids (any course still in the collection, deleted or not — 0 soft-deleted refs exist anyway)
  const allCourses = await db.collection('courses').find({}, { _id: 1 }).toArray();
  const validCourseIds = new Set(allCourses.map(c => c._id.toString()));
  console.log('valid courses:', validCourseIds.size);

  const allUsers = await db.collection('users').find({}, { _id: 1 }).toArray();
  const validUserIds = new Set(allUsers.map(u => u._id.toString()));
  console.log('valid users:', validUserIds.size);

  const toStr = (x) => (x && typeof x === 'object' && x._id ? x._id.toString() : (x ? x.toString() : ''));

  // 1. users.enrolledCourses
  let enrolledUsers = 0, enrolledPulled = 0;
  const u1 = await db.collection('users').find({ enrolledCourses: { $exists: true, $not: { $size: 0 } } }, { _id: 1, username: 1, enrolledCourses: 1 }).toArray();
  for (const u of u1) {
    const clean = (u.enrolledCourses || []).filter(x => validCourseIds.has(toStr(x)));
    if (clean.length !== u.enrolledCourses.length) {
      await db.collection('users').updateOne({ _id: u._id }, { $set: { enrolledCourses: clean } });
      enrolledUsers++; enrolledPulled += u.enrolledCourses.length - clean.length;
    }
  }
  console.log('enrolledCourses cleaned users:', enrolledUsers, '| refs removed:', enrolledPulled);

  // 2. courses.studentsEnrolled
  let courseUsers = 0, studentPulled = 0;
  const c1 = await db.collection('courses').find({ studentsEnrolled: { $exists: true, $not: { $size: 0 } } }, { _id: 1, title: 1, studentsEnrolled: 1 }).toArray();
  for (const c of c1) {
    const clean = (c.studentsEnrolled || []).filter(x => validUserIds.has(toStr(x)));
    if (clean.length !== c.studentsEnrolled.length) {
      await db.collection('courses').updateOne({ _id: c._id }, { $set: { studentsEnrolled: clean } });
      courseUsers++; studentPulled += c.studentsEnrolled.length - clean.length;
    }
  }
  console.log('studentsEnrolled cleaned courses:', courseUsers, '| refs removed:', studentPulled);

  // 3. users.completedLessons — drop entries whose courseId is missing/invalid
  let clUsers = 0, clPulled = 0;
  const u2 = await db.collection('users').find({ completedLessons: { $exists: true, $not: { $size: 0 } } }, { _id: 1, completedLessons: 1 }).toArray();
  for (const u of u2) {
    const clean = (u.completedLessons || []).filter(e => e && e.courseId && ObjectId.isValid(e.courseId) && validCourseIds.has(e.courseId.toString()));
    if (clean.length !== u.completedLessons.length) {
      await db.collection('users').updateOne({ _id: u._id }, { $set: { completedLessons: clean } });
      clUsers++; clPulled += u.completedLessons.length - clean.length;
    }
  }
  console.log('completedLessons cleaned users:', clUsers, '| entries removed:', clPulled);

  // 4. users.courseProgress — drop entries whose courseId is missing/invalid
  let cpUsers = 0, cpPulled = 0;
  const u3 = await db.collection('users').find({ courseProgress: { $exists: true, $not: { $size: 0 } } }, { _id: 1, courseProgress: 1 }).toArray();
  for (const u of u3) {
    const clean = (u.courseProgress || []).filter(e => e && e.courseId && ObjectId.isValid(e.courseId) && validCourseIds.has(e.courseId.toString()));
    if (clean.length !== u.courseProgress.length) {
      await db.collection('users').updateOne({ _id: u._id }, { $set: { courseProgress: clean } });
      cpUsers++; cpPulled += u.courseProgress.length - clean.length;
    }
  }
  console.log('courseProgress cleaned users:', cpUsers, '| entries removed:', cpPulled);

  await mongoose.disconnect();
  console.log('CLEAN_DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
