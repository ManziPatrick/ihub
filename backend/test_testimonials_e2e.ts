/* eslint-disable */
// E2E test for the testimonial moderation flow.
// 1) student submits a testimonial → pending
// 2) admin can view testimonials + submit on behalf of student, but CANNOT approve (403)
// 3) super admin approves → public site shows it
// 4) super admin rejects a second one → not public
// 5) delete works (super admin)
const fetch = require('node-fetch');
const m = require('mongoose');
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:4000/graphql';

const call = async (query, token) => {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query }),
  });
  return r.json();
};

const login = async (email, password) => {
  const j = await call(`mutation { login(email: "${email}", password: "${password}") { token } }`);
  const token = j.data?.login?.token;
  if (!token) {
    console.log(`  LOGIN FAILED for ${email}:`, JSON.stringify(j.errors || j).slice(0, 150));
    return null;
  }
  return token;
};

(async () => {
  const results: string[] = [];
  const check = (label: string, ok: boolean, detail = '') => {
    results.push(`${ok ? 'PASS' : 'FAIL'}: ${label}${detail ? ` — ${detail}` : ''}`);
  };

  // Connect to get a student user id
  await m.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/ihub');
  const usersCol = m.connection.collection('users');
  const student = await usersCol.findOne({ role: 'student', isDeleted: { $ne: true } });
  const student2 = await usersCol.findOne({ role: 'student', _id: { $ne: student?._id }, isDeleted: { $ne: true } });
  if (!student || !student2) {
    console.log('Need at least 2 students in DB');
    await m.disconnect();
    process.exit(1);
  }
  const studentId = student._id.toString();
  const student2Id = student2._id.toString();
  console.log(`Using student1: ${studentId} (${student.email})`);
  console.log(`Using student2: ${student2Id} (${student2.email})`);
  await m.disconnect();

  // Logins (admin/super via credentials; student token signed directly since seed passwords vary)
  const superToken = await login('superadmin@bootskills.com', 'Password@123');
  const adminToken = await login('admin@codemande.com', 'password123');
  const secret = process.env.JWT_SECRET || 'secret';
  const studentToken = jwt.sign({ id: studentId, role: 'student' }, secret, { expiresIn: '1h' });

  if (!superToken) { console.log('Cannot continue without super admin login'); process.exit(1); }
  console.log('Logins: super_admin', superToken ? 'OK' : 'FAIL', ', admin', adminToken ? 'OK' : 'FAIL', ', student (signed)', studentToken ? 'OK' : 'FAIL');

  // 1) Public list starts empty (or only approved)
  const pubBefore = await call('query { publicTestimonials { id quote status } }');
  const beforeCount = pubBefore.data?.publicTestimonials?.length || 0;
  console.log(`Public testimonials before: ${beforeCount}`);

  // 2) Student submits own story
  let r = await call(`mutation { submitTestimonial(quote: "This course changed my career completely, I got a job in 3 months.", authorRole: "Developer", authorCompany: "TestCo", rating: 5) { id status authorName } }`, studentToken);
  const studentSub = r.data?.submitTestimonial;
  check('student submits testimonial → pending', studentSub?.status === 'pending' && !!studentSub?.id, JSON.stringify(studentSub));
  const studentSubId = studentSub?.id;
  console.log('  student submission id:', studentSubId);

  // 3) Student sees it in myTestimonials
  r = await call('query { myTestimonials { id status quote } }', studentToken);
  check('student sees own submission via myTestimonials', (r.data?.myTestimonials || []).some((t: any) => t.id === studentSubId), `count=${r.data?.myTestimonials?.length}`);

  // 4) Admin submits on behalf of student2
  r = await call(`mutation { adminSubmitTestimonial(userId: "${student2Id}", quote: "This student graduated and joined our team as a data analyst.", authorRole: "Data Analyst", authorCompany: "FinanceHub", rating: 5) { id status authorName } }`, adminToken);
  const adminSub = r.data?.adminSubmitTestimonial;
  check('admin submits for student2 → pending', adminSub?.status === 'pending' && !!adminSub?.id, JSON.stringify(adminSub));
  const adminSubId = adminSub?.id;

  // 5) Admin CANNOT approve (super admin only)
  r = await call(`mutation { reviewTestimonial(id: "${studentSubId}", status: "approved") { id status } }`, adminToken);
  check('admin blocked from approving', !!r.errors, (r.errors?.[0]?.message || 'allowed!').slice(0, 80));

  // 6) Admin CAN view the moderation list
  r = await call('query { testimonials(page: 1, limit: 20) { items { id status } pagination { totalCount } } }', adminToken);
  check('admin can view all testimonials', Array.isArray(r.data?.testimonials?.items) && (r.data?.testimonials?.items || []).length >= 2, `total=${r.data?.testimonials?.pagination?.totalCount}`);

  // 7) Super admin approves student1's story
  r = await call(`mutation { reviewTestimonial(id: "${studentSubId}", status: "approved") { id status } }`, superToken);
  check('super admin approves → approved', r.data?.reviewTestimonial?.status === 'approved', JSON.stringify(r.data?.reviewTestimonial));

  // 8) Approved one now appears on the public site
  r = await call('query { publicTestimonials { id status authorName } }');
  const pubAfter = r.data?.publicTestimonials || [];
  check('approved story is public', pubAfter.some((t: any) => t.id === studentSubId), `public count=${pubAfter.length}`);
  check('unapproved (admin-submitted) story NOT public', !pubAfter.some((t: any) => t.id === adminSubId));

  // 9) Super admin rejects student2's story
  r = await call(`mutation { reviewTestimonial(id: "${adminSubId}", status: "rejected", note: "Please be more specific") { id status reviewNote } }`, superToken);
  check('super admin rejects → rejected with note', r.data?.reviewTestimonial?.status === 'rejected' && r.data?.reviewTestimonial?.reviewNote === 'Please be more specific');

  // 10) Still not public
  r = await call('query { publicTestimonials { id } }');
  check('rejected story stays off public site', !(r.data?.publicTestimonials || []).some((t: any) => t.id === adminSubId));

  // 11) Student can see rejection note
  r = await call('query { myTestimonials { id status reviewNote } }', student2 ? null : null);
  // student2's token unknown, skip — check via admin view instead
  r = await call('query { testimonials(status: "rejected") { items { id reviewNote } } }', adminToken);
  const rejItem = (r.data?.testimonials?.items || []).find((t: any) => t.id === adminSubId);
  check('admin sees rejection note in list', rejItem?.reviewNote === 'Please be more specific');

  // 12) Admin CANNOT delete (super admin only)
  r = await call(`mutation { deleteTestimonial(id: "${adminSubId}") }`, adminToken);
  check('admin blocked from deleting', !!r.errors, (r.errors?.[0]?.message || 'allowed!').slice(0, 80));

  // 13) Super admin deletes the rejected one
  r = await call(`mutation { deleteTestimonial(id: "${adminSubId}") }`, superToken);
  check('super admin deletes → true', r.data?.deleteTestimonial === true);

  // 14) Deleted gone from admin list
  r = await call('query { testimonials(page: 1, limit: 50) { items { id } } }', adminToken);
  check('deleted testimonial gone from list', !(r.data?.testimonials?.items || []).some((t: any) => t.id === adminSubId));

  // 15) Student can still submit even if not enrolled anywhere (submitTestimonial is open to any authenticated user)
  r = await call(`mutation { submitTestimonial(quote: "Second story from the same student to test limits.", rating: 4) { id status } }`, studentToken);
  check('student can submit a second story', r.data?.submitTestimonial?.status === 'pending');

  console.log('\n===== RESULTS =====');
  let fails = 0;
  results.forEach((res) => {
    console.log(res);
    if (res.startsWith('FAIL')) fails++;
  });
  console.log(`\n${results.length - fails}/${results.length} passed`);
  process.exit(fails > 0 ? 1 : 0);
})().catch((e) => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
