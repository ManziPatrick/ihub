const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ enrolledCourses: { $exists: true, $not: { $size: 0 } } }).toArray();
  let userOrphanTotal = 0, usersAffected = 0, userDeletedCourseRefs = 0;
  const userDetails = [];
  for (const u of users) {
    const ids = (u.enrolledCourses || []).filter(Boolean).map(x => (typeof x === 'string' ? x : x.toString()));
    const oid = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    const existing = oid.length ? await db.collection('courses').find({ _id: { $in: oid } }, { _id: 1, isDeleted: 1 }).toArray() : [];
    const existingIds = new Set(existing.map(c => c._id.toString()));
    const softDeleted = new Set(existing.filter(c => c.isDeleted).map(c => c._id.toString()));
    const orphans = ids.filter(id => !existingIds.has(id));
    const softDeletedRefs = ids.filter(id => softDeleted.has(id));
    if (orphans.length || softDeletedRefs.length) {
      usersAffected++; userOrphanTotal += orphans.length; userDeletedCourseRefs += softDeletedRefs.length;
      userDetails.push({ user: u.username || u.email, refs: ids.length, orphans: orphans.length, softDel: softDeletedRefs.length });
    }
  }
  console.log('=== users.enrolledCourses ===');
  console.log('users with refs:', users.length, '| affected:', usersAffected, '| orphaned (course missing):', userOrphanTotal, '| refs to soft-deleted:', userDeletedCourseRefs);
  userDetails.slice(0, 15).forEach(d => console.log(' -', d.user, '| refs:', d.refs, '| orphan:', d.orphans, '| softDel:', d.softDel));

  const courses = await db.collection('courses').find({ studentsEnrolled: { $exists: true, $not: { $size: 0 } } }).toArray();
  let courseOrphanTotal = 0, coursesAffected = 0;
  const courseDetails = [];
  for (const c of courses) {
    const ids = (c.studentsEnrolled || []).filter(Boolean).map(x => (typeof x === 'string' ? x : x.toString()));
    const oid = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    const existing = oid.length ? await db.collection('users').find({ _id: { $in: oid } }, { _id: 1, isDeleted: 1 }).toArray() : [];
    const existingIds = new Set(existing.map(u => u._id.toString()));
    const deletedIds = new Set(existing.filter(u => u.isDeleted).map(u => u._id.toString()));
    const orphans = ids.filter(id => !existingIds.has(id));
    const deletedRefs = ids.filter(id => deletedIds.has(id));
    if (orphans.length || deletedRefs.length) {
      coursesAffected++; courseOrphanTotal += orphans.length + deletedRefs.length;
      courseDetails.push({ title: (c.title || '').slice(0, 40), refs: ids.length, missing: orphans.length, deleted: deletedRefs.length });
    }
  }
  console.log('\n=== courses.studentsEnrolled ===');
  console.log('courses with enrollments:', courses.length, '| affected:', coursesAffected, '| orphan/deleted user refs:', courseOrphanTotal);
  courseDetails.slice(0, 10).forEach(d => console.log(' -', d.title, '| refs:', d.refs, '| missing users:', d.missing, '| deleted users:', d.deleted));

  const cl = await db.collection('users').find({ completedLessons: { $exists: true, $not: { $size: 0 } } }, { username: 1, completedLessons: 1 }).toArray();
  let clOrphan = 0, clAffected = 0;
  for (const u of cl) {
    const entries = (u.completedLessons || []).filter(Boolean);
    const courseIds = entries.map(e => e.courseId).filter(id => id && ObjectId.isValid(id)).map(id => new ObjectId(id));
    const existing = courseIds.length ? new Set((await db.collection('courses').find({ _id: { $in: courseIds } }, { _id: 1 }).toArray()).map(c => c._id.toString())) : new Set();
    const bad = entries.filter(e => !e.courseId || !ObjectId.isValid(e.courseId) || !existing.has(e.courseId.toString()));
    if (bad.length) { clAffected++; clOrphan += bad.length; }
  }
  console.log('\n=== users.completedLessons ===');
  console.log('users:', cl.length, '| affected:', clAffected, '| orphaned entries:', clOrphan);

  const cp = await db.collection('users').find({ courseProgress: { $exists: true, $not: { $size: 0 } } }, { username: 1, courseProgress: 1 }).toArray();
  let cpOrphan = 0, cpAffected = 0;
  for (const u of cp) {
    const entries = (u.courseProgress || []).filter(Boolean);
    const courseIds = entries.map(e => e.courseId).filter(id => id && ObjectId.isValid(id)).map(id => new ObjectId(id));
    const existing = courseIds.length ? new Set((await db.collection('courses').find({ _id: { $in: courseIds } }, { _id: 1 }).toArray()).map(c => c._id.toString())) : new Set();
    const bad = entries.filter(e => !e.courseId || !ObjectId.isValid(e.courseId) || !existing.has(e.courseId.toString()));
    if (bad.length) { cpAffected++; cpOrphan += bad.length; }
  }
  console.log('\n=== users.courseProgress ===');
  console.log('users:', cp.length, '| affected:', cpAffected, '| orphaned entries:', cpOrphan);

  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
