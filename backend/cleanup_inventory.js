// READ-ONLY dry run for the test-data cleanup (field names verified against models).
const fs = require('fs');
const mongoose = require('mongoose');
const envRaw = fs.readFileSync(__dirname + '/.env', 'utf8');
const env = Object.fromEntries(
  envRaw.split(/\r?\n/).filter(Boolean).filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);

const KEEP_EMAILS = new Set([
  'superadmin@bootskills.com',
  'admin@bootskills.com',
  'jonakarisa@gmail.com',
  'alainmanzi71@gmail.com',
  'nigena.umuhire@bootskills.com',
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
  const OID = (s) => new mongoose.Types.ObjectId(s);
  const oids = candIds.map(OID);
  const q = { $in: oids };

  console.log('=== CANDIDATES: ' + candIds.length + ' of ' + users.length + ' users ===');
  cands.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(u =>
    console.log('  DEL  ' + (u.username || '').padEnd(24) + (u.email || '').padEnd(34) + String(u.role || '?')));
  console.log('  (kept: superadmin@bootskills.com, admin@bootskills.com, jonakarisa@gmail.com, alainmanzi71@gmail.com, nigena.umuhire@bootskills.com)');

  console.log('\n=== related docs (corrected fields) ===');
  for (const [col, fields] of [
    ['studentprofiles', ['userId']],
    ['notifications', ['userId']],
    ['messages', ['sender']],
    ['bookings', ['userId', 'mentorId']],
    ['certificates', ['userId']],
    ['internshiptimelogs', ['userId']],
    ['internshipinvoices', ['userId']],
    ['internshipactivitylogs', ['userId']],
    ['internshipsubmissions', ['userId']],
    ['internshipapplications', ['userId']],
    ['internships', ['userId']],
    ['courseprogresses', ['userId']],
    ['assignmentsubmissions', ['userId']],
    ['projectonboardings', ['developerId']],
    ['userassignedtasks', ['userId']],
    ['standups', ['userId']],
    ['adminauditlogs', ['accessingAdminId']],
    ['refundrequests', ['userId']],
    ['usererrorreports', ['userId']],
    ['conversations', ['participants']],
  ]) {
    const docs = await db.collection(col).find({ $or: fields.map(f => ({ [f]: q })) }).toArray();
    if (docs.length) console.log('  ' + col.padEnd(30) + docs.length);
  }

  const ownedCourses = await db.collection('courses').find({ $or: [{ createdBy: q }, { instructor: q }] }, { title: 1, createdBy: 1, instructor: 1 }).toArray();
  console.log('\n=== courses createdBy/instructor candidates: ' + ownedCourses.length + ' (expect 0 — nigena kept, others kept admin) ===');
  ownedCourses.forEach(c => console.log('  ' + String(c.title || '').slice(0, 50) + '  by=' + String(c.createdBy || '').slice(0, 24) + '  inst=' + String(c.instructor || '').slice(0, 24)));

  const ownedPrograms = await db.collection('internshipprograms').find({ createdBy: q }, { title: 1 }).toArray();
  console.log('=== internshipprograms createdBy candidates: ' + ownedPrograms.length + ' ===');
  ownedPrograms.forEach(p => console.log('  ' + String(p.title || '').slice(0, 60)));

  const refCourses = await db.collection('courses').find({ studentsEnrolled: { $in: oids } }, { title: 1, studentsEnrolled: 1 }).toArray();
  console.log('=== courses with studentsEnrolled refs to candidates: ' + refCourses.length + ' ===');
  refCourses.forEach(c => {
    const refs = (c.studentsEnrolled || []).filter(x => candSet.has(String(x))).length;
    console.log('  ' + String(c.title || '').slice(0, 50) + '  total=' + (c.studentsEnrolled || []).length + ' cand=' + refs);
  });

  const candProjects = await db.collection('projects').find({ $or: [{ userId: q }, { mentors: q }, { 'team.userId': q }] }, { title: 1, userId: 1, mentors: 1, team: 1 }).toArray();
  console.log('\n=== projects tied to candidates: ' + candProjects.length + ' ===');
  for (const p of candProjects) {
    console.log('  ' + p._id.toString() + '  ' + String(p.title || '').slice(0, 50) + '  userId=' + String(p.userId || '').slice(0, 10) + '  mentors=' + (p.mentors || []).map(m => String(m).slice(0, 8)).join(',') + '  teamUsers=' + (p.team || []).map(t => String(t.userId || '').slice(0, 8)).join(','));
  }

  await mongoose.disconnect();
  console.log('\nDRYRUN_DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
