const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const backup = { exportedAt: new Date().toISOString() };
  backup.users = await db.collection('users').find(
    { $or: [
      { enrolledCourses: { $exists: true, $not: { $size: 0 } } },
      { completedLessons: { $exists: true, $not: { $size: 0 } } },
      { courseProgress: { $exists: true, $not: { $size: 0 } } },
    ] },
    { _id: 1, username: 1, email: 1, enrolledCourses: 1, completedLessons: 1, courseProgress: 1 }
  ).toArray();
  backup.courses = await db.collection('courses').find(
    { studentsEnrolled: { $exists: true, $not: { $size: 0 } } },
    { _id: 1, title: 1, studentsEnrolled: 1 }
  ).toArray();
  const f = '/tmp/orphan_backup_' + Date.now() + '.json';
  fs.writeFileSync(f, JSON.stringify(backup, null, 1));
  console.log('BACKUP_SAVED:', f);
  console.log('users backed up:', backup.users.length, '| courses backed up:', backup.courses.length);
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
