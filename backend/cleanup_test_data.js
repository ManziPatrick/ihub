// Backup-then-delete cleanup of test/seed users on the production DB.
// Backs up EVERY doc it touches to /tmp/bootskills_cleanup_<ts>.json first,
// then hard-deletes test users + related data, cleans dangling references,
// reassigns courses left without an instructor, and verifies the result.
// Field names verified against backend/src/models/*.
const fs = require('fs');
const mongoose = require('mongoose');

const envRaw = fs.readFileSync(__dirname + '/.env', 'utf8');
const env = Object.fromEntries(
  envRaw.split(/\r?\n/).filter(Boolean).filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);

// Users the owner wants to KEEP.
const KEEP_EMAILS = new Set([
  'superadmin@bootskills.com',        // keep one super admin
  'admin@bootskills.com',             // keep one admin
  'jonakarisa@gmail.com',             // owner chose to keep
  'alainmanzi71@gmail.com',           // owner chose to keep (alain_student)
  'nigena.umuhire@bootskills.com',    // only trainer — owns 2 real courses + a program
]);

const isCandidate = (u) => {
  const email = (u.email || '').toLowerCase();
  const uname = (u.username || '').toLowerCase();
  if (KEEP_EMAILS.has(email)) return false;
  if (/@(example|test|student)\.com$/.test(email) || email.endsWith('@test.local')) return true;
  if (/@bootskills\.com$/.test(email)) return true;
  if (/@ihub\.com$/.test(email)) return true;
  if (/^(client_rwanda|client_shine|client_afriq)$/.test(uname)) return true;
  return false;
};

(async () => {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();
  const cands = users.filter(isCandidate);
  const candIds = cands.map(u => u._id.toString());
  const candSet = new Set(candIds);
  const oids = candIds.map(id => new mongoose.Types.ObjectId(id));
  const q = { $in: oids };

  console.log('=== CLEANUP: ' + candIds.length + ' test users to delete ===');
  cands.forEach(u => console.log('  - ' + (u.username || '') + ' <' + u.email + '> [' + u.role + ']'));

  // KEPT admin id (courses left without instructor are reassigned here)
  const keptAdmin = await db.collection('users').findOne({ email: 'admin@bootskills.com' }, { _id: 1 });

  // ── 1. BACKUP everything we will touch ─────────────────────────────
  const backup = { exportedAt: new Date().toISOString(), deletedUsers: cands.map(u => ({ ...u })) };
  const grab = async (col, query) => { try { return await db.collection(col).find(query).toArray(); } catch (e) { return []; } };

  const relatedQueries = [
    ['studentprofiles', { userId: q }],
    ['notifications', { userId: q }],
    ['messages', { sender: q }],
    ['bookings', { $or: [{ userId: q }, { mentorId: q }] }],
    ['certificates', { userId: q }],
    ['internshiptimelogs', { userId: q }],
    ['internshipinvoices', { userId: q }],
    ['internshipactivitylogs', { userId: q }],
    ['internshipsubmissions', { userId: q }],
    ['internshipapplications', { userId: q }],
    ['internships', { userId: q }],
    ['courseprogresses', { userId: q }],
    ['assignmentsubmissions', { userId: q }],
    ['projectonboardings', { $or: [{ developerId: q }, { userId: q }] }],
    ['userassignedtasks', { userId: q }],
    ['standups', { userId: q }],
    ['adminauditlogs', { accessingAdminId: q }],
    ['refundrequests', { $or: [{ userId: q }, { requestedBy: q }, { approvedBy: q }] }],
    ['usererrorreports', { userId: q }],
  ];
  const candEmails = cands.map(u => u.email).filter(Boolean);
  for (const [col, query] of relatedQueries) backup[col] = await grab(col, query);
  backup.newslettersubscriptions = await grab('newslettersubscriptions', { email: { $in: candEmails } });
  backup.conversations = await grab('conversations', { participants: { $in: oids } });

  // projects to DELETE (owned by candidates) + the one to keep-but-clean
  const candProjects = await grab('projects', { $or: [{ userId: q }, { mentors: q }, { 'team.userId': q }] });
  const projectsToDelete = candProjects.filter(p => candSet.has(String(p.userId)));
  const projectsToClean = candProjects.filter(p => !candSet.has(String(p.userId)));
  backup.projectsToDelete = projectsToDelete;
  backup.projectsToClean = projectsToClean;
  const projIds = projectsToDelete.map(p => p._id);
  if (projIds.length) {
    const pq = { $in: projIds };
    for (const [col, fields] of [
      ['projecttasks', ['project', 'projectId']],
      ['projectapplications', ['project', 'projectId']],
      ['projectonboardings', ['project', 'projectId']],
      ['projectndas', ['project', 'projectId']],
      ['applicationphases', ['project', 'projectId']],
      ['applicationphasesubmissions', ['phaseId']],
    ]) backup[col] = await grab(col, { $or: fields.map(f => ({ [f]: pq })) });
  }

  // courses: instructor reassignment + studentsEnrolled refs (before state)
  const instCourses = await grab('courses', { instructor: { $in: oids } });
  const refCourses = await grab('courses', { studentsEnrolled: { $in: oids } });
  backup.coursesInstructorReassign = instCourses.map(c => ({ _id: c._id, title: c.title, instructor: c.instructor }));
  backup.coursesStudentsEnrolled = refCourses.map(c => ({ _id: c._id, title: c.title, studentsEnrolled: c.studentsEnrolled, studentsEnrolledCount: c.studentsEnrolledCount }));

  const ts = Date.now();
  const backupFile = '/tmp/bootskills_cleanup_' + ts + '.json';
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
  console.log('✓ BACKUP saved: ' + backupFile);
  for (const [k, v] of Object.entries(backup)) if (Array.isArray(v) && k !== 'deletedUsers') console.log('   ' + k + ': ' + v.length);

  // ── 2. DELETE / UPDATE ─────────────────────────────────────────────
  let delCount = 0;
  const del = async (col, query, label) => {
    const r = await db.collection(col).deleteMany(query);
    if (r.deletedCount) { delCount += r.deletedCount; console.log('✓ deleted ' + (label || col) + ': ' + r.deletedCount); }
  };
  const upd = async (col, query, update, label) => {
    const r = await db.collection(col).updateMany(query, update);
    if (r.modifiedCount) console.log('✓ updated ' + (label || col) + ': ' + r.modifiedCount);
  };

  for (const [col, query] of relatedQueries) await del(col, query, col);
  await del('newslettersubscriptions', { email: { $in: candEmails } });

  // projects owned by candidates + their related docs
  if (projIds.length) {
    const pq = { $in: projIds };
    await del('projects', { _id: pq }, 'projects (candidate-owned)');
    for (const [col, fields] of [
      ['projecttasks', ['project', 'projectId']],
      ['projectapplications', ['project', 'projectId']],
      ['projectonboardings', ['project', 'projectId']],
      ['projectndas', ['project', 'projectId']],
      ['applicationphases', ['project', 'projectId']],
      ['applicationphasesubmissions', ['phaseId']],
    ]) await del(col, { $or: fields.map(f => ({ [f]: pq })) }, col + ' (for deleted projects)');
  }
  // projects kept but with candidate mentors → remove the candidate mentor
  for (const p of projectsToClean) {
    const keep = (p.mentors || []).filter(m => !candSet.has(String(m)));
    if (keep.length !== (p.mentors || []).length) {
      await upd('projects', { _id: p._id }, { $set: { mentors: keep } }, 'project mentors (removed candidates)');
    }
  }

  // conversations: remove candidate participants; drop if none remain
  const convos = backup.conversations;
  for (const cv of convos) {
    const remaining = (cv.participants || []).filter(p => !candSet.has(String(p)));
    if (remaining.length === 0) {
      await del('conversations', { _id: cv._id }, 'conversations (no participants left)');
    } else {
      await upd('conversations', { _id: cv._id }, { $set: { participants: remaining } }, 'conversations (removed candidates)');
    }
  }

  // courses: pull candidate refs from studentsEnrolled + resync count
  for (const c of refCourses) {
    const clean = (c.studentsEnrolled || []).filter(x => !candSet.has(String(x)));
    await upd('courses', { _id: c._id }, { $set: { studentsEnrolled: clean, studentsEnrolledCount: clean.length } }, 'courses studentsEnrolled');
  }
  // courses left without an instructor → reassign to the kept admin
  if (keptAdmin) {
    await upd('courses', { instructor: { $in: oids } }, { $set: { instructor: keptAdmin._id } }, 'courses instructor (reassigned)');
  }

  // other users referencing candidates (createdBy / assignedAdmin) → null
  await upd('users', { createdBy: { $in: oids } }, { $set: { createdBy: null } }, 'users.createdBy');
  await upd('users', { assignedAdmin: { $in: oids } }, { $set: { assignedAdmin: null } }, 'users.assignedAdmin');

  // the users themselves
  await del('users', { _id: { $in: oids } }, 'users (test accounts)');

  console.log('\nTotal docs deleted: ' + delCount);

  // ── 3. VERIFY ──────────────────────────────────────────────────────
  const remaining = await db.collection('users').countDocuments({});
  const remainingCand = await db.collection('users').countDocuments({ email: { $in: candEmails } });
  const adminsLeft = await db.collection('users').find({ role: { $in: ['admin', 'super_admin'] } }, { username: 1, email: 1 }).toArray();
  console.log('\n=== VERIFY ===');
  console.log('users before: ' + users.length + ' → after: ' + remaining + ' (' + (users.length - remaining) + ' removed)');
  console.log('candidate emails still present: ' + remainingCand);
  console.log('admins remaining: ' + adminsLeft.length);
  adminsLeft.forEach(a => console.log('   ' + (a.username || '') + ' <' + a.email + '> [' + a.role + ']'));
  console.log('courses still referencing deleted users (studentsEnrolled): ' + (await db.collection('courses').countDocuments({ studentsEnrolled: { $in: oids } })));
  console.log('courses with dangling instructor refs: ' + (await db.collection('courses').countDocuments({ instructor: { $in: oids } })));
  console.log('projects still referencing deleted users: ' + (await db.collection('projects').countDocuments({ $or: [{ userId: { $in: oids } }, { mentors: { $in: oids } }] })));

  await mongoose.disconnect();
  console.log('\nCLEANUP_DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
