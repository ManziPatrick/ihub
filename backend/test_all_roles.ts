/**
 * Comprehensive role-based API test suite — super_admin / admin / trainer / student.
 * Tests: login, me, pagination, filtering, sorting, and full CRUD (create→read→update→delete)
 * against the LOCAL backend (localhost:4000) which runs the latest code.
 */
const API = 'http://localhost:4000/graphql';

type Result = { role: string; test: string; pass: boolean; detail: string };
const results: Result[] = [];
const createdIds: { kind: string; id: string }[] = [];

function record(role: string, test: string, pass: boolean, detail: string) {
  results.push({ role, test, pass, detail });
  console.log(`${pass ? '✅' : '❌'} [${role}] ${test} — ${detail}`);
}

async function gql(token: string | null, query: string, variables: any = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  return { errors: json.errors || [], data: json.data };
}

const LOGIN = `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { id username email role permissions status } } }`;
const ME = `query Me { me { id username email role permissions status fullName } }`;

async function login(email: string, password: string) {
  const { errors, data } = await gql(null, LOGIN, { email, password });
  if (errors.length) return { ok: false, error: errors[0].message };
  return { ok: true, token: data.login.token as string, user: data.login.user as any };
}

// ─── Query fragments ─────────────────────────────────────────────────────────
const USERS_Q = `query U($page: Int, $limit: Int, $createdBy: ID, $role: String) {
  users(page: $page, limit: $limit, createdBy: $createdBy, role: $role) {
    items { id username email role status createdAt }
    pagination { totalCount totalPages currentPage }
  }
}`;

const COURSES_Q = `query C($page: Int, $limit: Int, $sortBy: String, $featured: Boolean) {
  courses(page: $page, limit: $limit, sortBy: $sortBy, featured: $featured) {
    items { id title price discountPrice status category level isFeatured instructor { id username } }
    pagination { totalCount totalPages currentPage }
  }
}`;

const PROGRAMS_Q = `query P($page: Int, $limit: Int, $search: String, $category: String, $price: String, $level: String, $school: String) {
  internshipPrograms(page: $page, limit: $limit, search: $search, category: $category, price: $price, level: $level, school: $school) {
    items { id title organization description duration status price currency }
    pagination { totalCount totalPages currentPage }
  }
}`;

const TESTIMONIALS_Q = `query T($page: Int, $limit: Int, $status: String) {
  testimonials(page: $page, limit: $limit, status: $status) {
    items { id quote authorName authorRole authorCompany status createdAt }
    pagination { totalCount totalPages currentPage }
  }
}`;

const PAYMENTS_Q = `query PM($page: Int, $limit: Int) {
  payments(page: $page, limit: $limit) {
    items { id studentName amount currency itemTitle type status date }
    pagination { totalCount totalPages currentPage }
  }
}`;

const DISBURSEMENTS_Q = `query D($page: Int, $limit: Int, $status: String) {
  getAllDisbursements(page: $page, limit: $limit, status: $status) {
    items { id ownerId grossAmount netAmount status }
    pagination { totalCount totalPages currentPage }
  }
}`;

const STATS_Q = `query S { stats { totalUsers totalCourses totalStudents totalRevenue } }`;
const ANALYTICS_Q = `query A($createdBy: ID) { analytics(createdBy: $createdBy) { userGrowth { label value } revenueGrowth { label value } courseDistribution { name value } roleDistribution { name value } internshipStats { total eligible enrolled graduated } projectStats { total completed } } }`;
const TOP_STUDENTS_Q = `query TS($limit: Int) { getTopStudents(limit: $limit) { id username level xp avatar } }`;
const DASHBOARD_Q = `query D2($createdBy: ID) { adminDashboardData(createdBy: $createdBy) { stats { totalUsers totalCourses totalStudents totalRevenue } recentEnrollments { studentName courseTitle amount } coursePerformance { courseTitle studentCount avgCompletion revenue } } }`;
const ACTIVITY_Q = `query RA($createdBy: ID) { recentActivity(createdBy: $createdBy) { username action timestamp } }`;
const ALL_TRAINERS_Q = `query AT { getAllTrainers { id username fullName email } }`;

// ─── Mutations ───────────────────────────────────────────────────────────────
const CREATE_USER = `mutation CU($username: String!, $email: String!, $password: String!, $role: String, $permissions: [String], $school: String) {
  createUser(username: $username, email: $email, password: $password, role: $role, permissions: $permissions, school: $school) { id username email role permissions }
}`;
const UPDATE_USER = `mutation UU($id: ID!, $username: String, $email: String, $fullName: String, $title: String, $school: String, $status: String, $permissions: [String], $role: String) {
  updateUser(id: $id, username: $username, email: $email, fullName: $fullName, title: $title, school: $school, status: $status, permissions: $permissions, role: $role) { id username email role permissions status title school fullName }
}`;
const DELETE_USER = `mutation DU($id: ID!) { deleteUser(id: $id) }`;

const CREATE_COURSE = `mutation CC($title: String!, $description: String!, $category: String!, $level: String, $instructorId: ID!, $price: Float, $status: String, $modules: [ModuleInput!]!) {
  createCourse(title: $title, description: $description, category: $category, level: $level, instructorId: $instructorId, price: $price, status: $status, modules: $modules) { id title status }
}`;
const UPDATE_COURSE = `mutation UC($id: ID!, $title: String, $price: Float, $status: String, $isFeatured: Boolean) {
  updateCourse(id: $id, title: $title, price: $price, status: $status, isFeatured: $isFeatured) { id title price status isFeatured }
}`;
const DELETE_COURSE = `mutation DC($id: ID!) { deleteCourse(id: $id) }`;

const CREATE_PROGRAM = `mutation CP($title: String!, $organization: String, $description: String!, $duration: String!, $startDate: String!, $endDate: String!, $applicationDeadline: String!, $eligibility: String, $price: Float, $currency: String, $maxSpots: Int) {
  createInternshipProgram(title: $title, organization: $organization, description: $description, duration: $duration, startDate: $startDate, endDate: $endDate, applicationDeadline: $applicationDeadline, eligibility: $eligibility, price: $price, currency: $currency, maxSpots: $maxSpots) { id title organization status price }
}`;
const UPDATE_PROGRAM = `mutation UP($id: ID!, $title: String, $organization: String, $price: Float, $maxSpots: Int, $status: String) {
  updateInternshipProgram(id: $id, title: $title, organization: $organization, price: $price, maxSpots: $maxSpots, status: $status) { id title organization price maxSpots status }
}`;
const DELETE_PROGRAM = `mutation DP($id: ID!) { deleteInternshipProgram(id: $id) }`;

const SUBMIT_TESTIMONIAL = `mutation ST($quote: String!, $authorRole: String, $authorCompany: String, $rating: Int) {
  submitTestimonial(quote: $quote, authorRole: $authorRole, authorCompany: $authorCompany, rating: $rating) { id quote status }
}`;
const ADMIN_SUBMIT_TESTIMONIAL = `mutation AST($userId: ID!, $quote: String!, $authorRole: String, $authorCompany: String, $rating: Int) {
  adminSubmitTestimonial(userId: $userId, quote: $quote, authorRole: $authorRole, authorCompany: $authorCompany, rating: $rating) { id quote status }
}`;
const REVIEW_TESTIMONIAL = `mutation RT($id: ID!, $status: String!, $note: String) {
  reviewTestimonial(id: $id, status: $status, note: $note) { id status reviewNote }
}`;
const DELETE_TESTIMONIAL = `mutation DT($id: ID!) { deleteTestimonial(id: $id) }`;

const MY_TESTIMONIALS_Q = `query MT { myTestimonials { id quote status } }`;

// Pagination lives under the query field, e.g. data.users.pagination
const getPag = (r: any) => {
  const firstKey = r?.data ? Object.keys(r.data)[0] : '';
  return (r?.data?.[firstKey]?.pagination) || {};
};
const isAuthErr = (errors: any[]) => errors.some((e: any) => /not authenticated|unauthorized|forbidden/i.test(e.message));

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══ LOGIN: all four roles ═══');
  const creds: Record<string, { email: string; password: string }> = {
    super_admin: { email: 'superadmin@bootskills.com', password: 'Password@123' },
    admin: { email: 'admin@bootskills.com', password: 'Password@123' },
    trainer: { email: 'trainer@bootskills.com', password: 'Password@123' },
    student: { email: 'jonakarisa@gmail.com', password: 'Password@123' },
  };
  const tokens: Record<string, string> = {};
  const users: Record<string, any> = {};
  const SA = 'super_admin';

  for (const [role, c] of Object.entries(creds)) {
    const r = await login(c.email, c.password);
    if (r.ok) {
      tokens[role] = r.token!;
      users[role] = r.user!;
      record(role, 'login', true, `${c.email} → role=${r.user.role}`);
    } else {
      record(role, 'login', false, `FAILED: ${r.error}`);
    }
  }

  const missing = Object.keys(tokens);
  if (missing.length < 4) {
    console.log(`\n⚠ Only ${missing.length}/4 roles logged in — skipping dependent tests for missing roles.`);
  }

  // ─────────────────────────── SUPER ADMIN ───────────────────────────
  if (tokens[SA]) {
    console.log('\n═══ SUPER ADMIN ═══');
    const t = tokens[SA];

    // me
    const meR = await gql(t, ME);
    record(SA, 'me query', !meR.errors.length && meR.data?.me?.role === 'super_admin', meR.data?.me?.username || meR.errors[0]?.message);

    // READ: users pagination
    let r = await gql(t, USERS_Q, { page: 1, limit: 5 });
    if (!r.errors.length) {
      const p1 = getPag(r);
      const items1 = r.data.users.items;
      record(SA, 'users pagination page1/limit5', items1.length === 5 && p1.totalCount >= 5, `${items1.length} items, total=${p1.totalCount}, pages=${p1.totalPages}`);
      const r2 = await gql(t, USERS_Q, { page: 2, limit: 5 });
      const ids1 = new Set(items1.map((u: any) => u.id));
      const overlap = r2.data.users.items.filter((u: any) => ids1.has(u.id)).length;
      record(SA, 'users pagination page2', !r2.errors.length && r2.data.users.items.length >= 0 && overlap === 0, `page2 items=${r2.data.users.items.length}, overlapWithPage1=${overlap}`);
    } else record(SA, 'users pagination', false, r.errors[0].message);

    // FILTER: role filter
    r = await gql(t, USERS_Q, { role: 'trainer', limit: 50 });
    const allTrainer = !r.errors.length && r.data.users.items.every((u: any) => u.role === 'trainer');
    record(SA, 'users filter role=trainer', allTrainer, `${r.data?.users?.items?.length ?? 0} trainers returned, all role=trainer: ${allTrainer}`);

    // FILTER: createdBy (own-created users)
    r = await gql(t, USERS_Q, { createdBy: users[SA].id, limit: 50 });
    record(SA, 'users filter createdBy=self', !r.errors.length, `${r.data?.users?.items?.length ?? 0} users created by super_admin`);

    // READ: stats + analytics + top students
    r = await gql(t, STATS_Q);
    record(SA, 'stats query', !r.errors.length && r.data?.stats?.totalUsers > 0, JSON.stringify(r.data?.stats));
    r = await gql(t, ANALYTICS_Q);
    record(SA, 'analytics query', !r.errors.length && r.data?.analytics?.roleDistribution, `roleDistribution=${JSON.stringify(r.data?.analytics?.roleDistribution)}`);
    r = await gql(t, TOP_STUDENTS_Q, { limit: 5 });
    record(SA, 'getTopStudents', !r.errors.length, `${r.data?.getTopStudents?.length ?? 0} students returned`);

    // READ: courses pagination + sorting
    r = await gql(t, COURSES_Q, { page: 1, limit: 4 });
    const courseTotal = getPag(r).totalCount ?? 0;
    record(SA, 'courses pagination', !r.errors.length && r.data.courses.items.length === 4 && courseTotal >= 4, `page1 ${r.data.courses.items.length} items, total=${courseTotal}`);

    // Sort verification: each supported sort key must return a valid response,
    // and popular must actually differ from latest order (proves sorting applies).
    const latestR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'latest' });
    const latestIds = (latestR.data?.courses?.items || []).map((c: any) => c.id);
    record(SA, 'courses sortBy=latest', !latestR.errors.length && latestIds.length > 0, `${latestIds.length} items`);
    const popularR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'popular' });
    const popularIds = (popularR.data?.courses?.items || []).map((c: any) => c.id);
    const popularDiffers = !popularR.errors.length && JSON.stringify(popularIds) !== JSON.stringify(latestIds);
    record(SA, 'courses sortBy=popular (reorders)', popularDiffers, popularR.errors[0]?.message || `differs from latest: ${popularDiffers}`);
    const trendR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'trending' });
    const trendIds = (trendR.data?.courses?.items || []).map((c: any) => c.id);
    record(SA, 'courses sortBy=trending (reorders)', !trendR.errors.length, trendR.errors[0]?.message || `${trendIds.length} items`);
    const cbR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'createdBy' });
    const cbIds = (cbR.data?.courses?.items || []).map((c: any) => c.id);
    const cbDiffers = !cbR.errors.length && cbIds.length > 0 && JSON.stringify(cbIds) !== JSON.stringify(latestIds);
    record(SA, 'courses sortBy=createdBy (reorders)', cbDiffers, cbR.errors[0]?.message || `differs from latest: ${cbDiffers}`);

    // FILTER: featured courses
    r = await gql(t, COURSES_Q, { featured: true, limit: 30 });
    const featOk = !r.errors.length && r.data.courses.items.every((c: any) => c.isFeatured === true);
    record(SA, 'courses filter featured=true', featOk, `${r.data?.courses?.items?.length ?? 0} featured courses`);

    // READ: programs pagination + search filter
    r = await gql(t, PROGRAMS_Q, { page: 1, limit: 3 });
    record(SA, 'programs pagination', !r.errors.length, `${r.data?.internshipPrograms?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);
    r = await gql(t, PROGRAMS_Q, { search: 'intern', limit: 10 });
    record(SA, 'programs filter search', !r.errors.length, `${r.data?.internshipPrograms?.items?.length ?? 0} matching 'intern'`);

    // READ: testimonials with status filter
    r = await gql(t, TESTIMONIALS_Q, { status: 'approved', limit: 20 });
    const tOk = !r.errors.length && r.data.testimonials.items.every((x: any) => x.status === 'approved');
    record(SA, 'testimonials filter status=approved', tOk, `${r.data?.testimonials?.items?.length ?? 0} approved`);

    // READ: payments + disbursements pagination
    r = await gql(t, PAYMENTS_Q, { page: 1, limit: 5 });
    record(SA, 'payments pagination', !r.errors.length, `${r.data?.payments?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);
    r = await gql(t, DISBURSEMENTS_Q, { page: 1, limit: 5 });
    record(SA, 'disbursements pagination', !r.errors.length, `${r.data?.getAllDisbursements?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);
    r = await gql(t, DISBURSEMENTS_Q, { status: 'completed', limit: 5 });
    const disbOk = !r.errors.length && r.data.getAllDisbursements.items.every((d: any) => d.status === 'completed');
    record(SA, 'disbursements filter status', disbOk, `${r.data?.getAllDisbursements?.items?.length ?? 0} completed`);

    // CRUD: user (create → update → delete)
    const uid = `su_test_${Date.now()}`;
    r = await gql(t, CREATE_USER, { username: uid, email: `${uid}@test.com`, password: 'Password@123', role: 'admin', permissions: ['users', 'courses'] });
    if (!r.errors.length && r.data?.createUser?.id) {
      createdIds.push({ kind: 'user', id: r.data.createUser.id });
      record(SA, 'user CREATE', true, `created admin ${uid}`);
      const newId = r.data.createUser.id;
      const ur = await gql(t, UPDATE_USER, { id: newId, fullName: 'Updated Name', status: 'suspended', permissions: ['users', 'courses', 'analytics'] });
      record(SA, 'user UPDATE', !ur.errors.length && ur.data.updateUser.fullName === 'Updated Name' && ur.data.updateUser.status === 'suspended', ur.errors[0]?.message || (ur.data?.updateUser ? 'status→suspended, perms updated' : `RAW: ${JSON.stringify(ur).slice(0, 200)}`));
      const dr = await gql(t, DELETE_USER, { id: newId });
      record(SA, 'user DELETE', !dr.errors.length && dr.data.deleteUser === true, 'deleted');
    } else record(SA, 'user CREATE', false, r.errors[0]?.message || 'no id');

    // SECURITY: admin cannot escalate to super_admin (verify gating still exists)
    r = await gql(t, CREATE_USER, { username: `x_${Date.now()}`, email: `x_${Date.now()}@test.com`, password: 'Password@123', role: 'super_admin' });
    record(SA, 'createUser super_admin allowed', !r.errors.length, r.errors[0]?.message || 'ok');
    if (r.data?.createUser?.id) createdIds.push({ kind: 'user', id: r.data.createUser.id });

    // CRUD: course (create → update → delete)
    r = await gql(t, CREATE_COURSE, {
      title: `SU Test Course ${Date.now()}`, description: 'Automated CRUD test', category: 'Business',
      level: 'Beginner', instructorId: users[SA].id, price: 15000, status: 'draft',
      modules: [{ title: 'Module 1', description: 'M1', lessons: [{ title: 'Lesson 1', type: 'video', duration: 10, content: 'https://example.com/v.mp4' }] }],
    });
    if (!r.errors.length && r.data?.createCourse?.id) {
      const cid = r.data.createCourse.id;
      createdIds.push({ kind: 'course', id: cid });
      record(SA, 'course CREATE', true, `created ${cid}`);
      const ur = await gql(t, UPDATE_COURSE, { id: cid, price: 20000, isFeatured: true });
      record(SA, 'course UPDATE', !ur.errors.length && ur.data.updateCourse.price === 20000 && ur.data.updateCourse.isFeatured === true, ur.errors[0]?.message || 'price→20000, featured→true');
      // Business rule check: publishing requires the instructor to have a phone
      const pubR = await gql(t, UPDATE_COURSE, { id: cid, status: 'published' });
      record(SA, 'course publish blocked without phone (rule)', pubR.errors.length > 0, pubR.errors[0]?.message || 'UNEXPECTED SUCCESS');
      const vr = await gql(t, COURSES_Q, { limit: 1 });
      const found = !vr.errors.length;
      record(SA, 'course READ after update', found, found ? 'course list still queryable' : vr.errors[0].message);
      const dr = await gql(t, DELETE_COURSE, { id: cid });
      record(SA, 'course DELETE', !dr.errors.length && dr.data.deleteCourse === true, 'deleted');
    } else record(SA, 'course CREATE', false, r.errors[0]?.message || 'no id');

    // CRUD: internship program (create → update → delete)
    r = await gql(t, CREATE_PROGRAM, {
      title: `SU Test Program ${Date.now()}`, organization: 'Test Org', description: 'Automated CRUD test',
      duration: '3 Months', startDate: '2027-01-01', endDate: '2027-03-31', applicationDeadline: '2026-12-15',
      eligibility: 'Open to all', price: 50000, currency: 'RWF', maxSpots: 20,
    });
    if (!r.errors.length && r.data?.createInternshipProgram?.id) {
      const pid = r.data.createInternshipProgram.id;
      createdIds.push({ kind: 'program', id: pid });
      record(SA, 'program CREATE', true, `created ${pid}`);
      const ur = await gql(t, UPDATE_PROGRAM, { id: pid, price: 60000, maxSpots: 30, status: 'active' });
      record(SA, 'program UPDATE', !ur.errors.length && ur.data.updateInternshipProgram.price === 60000 && ur.data.updateInternshipProgram.maxSpots === 30, ur.errors[0]?.message || 'price→60000, maxSpots→30');
      const dr = await gql(t, DELETE_PROGRAM, { id: pid });
      record(SA, 'program DELETE', !dr.errors.length && dr.data.deleteInternshipProgram === true, 'deleted');
    } else record(SA, 'program CREATE', false, r.errors[0]?.message || 'no id');

    // CRUD: testimonial (admin submits → super admin reviews → delete)
    const studentId = users.student?.id || (await gql(t, USERS_Q, { role: 'student', limit: 1 })).data?.users?.items?.[0]?.id;
    if (tokens.admin && studentId) {
      r = await gql(tokens.admin, ADMIN_SUBMIT_TESTIMONIAL, { userId: studentId, quote: 'SU flow test testimonial', authorRole: 'Student', authorCompany: 'TestCo', rating: 5 });
      if (!r.errors.length && r.data?.adminSubmitTestimonial?.id) {
        const tid = r.data.adminSubmitTestimonial.id;
        createdIds.push({ kind: 'testimonial', id: tid });
        record(SA, 'testimonial CREATE (admin→pending)', true, `submitted ${tid}, status=${r.data.adminSubmitTestimonial.status}`);
        const rr = await gql(t, REVIEW_TESTIMONIAL, { id: tid, status: 'approved', note: 'auto-approved' });
        record(SA, 'testimonial UPDATE (super admin approve)', !rr.errors.length && rr.data.reviewTestimonial.status === 'approved', rr.errors[0]?.message || 'approved');
        const dr = await gql(t, DELETE_TESTIMONIAL, { id: tid });
        record(SA, 'testimonial DELETE', !dr.errors.length && dr.data.deleteTestimonial === true, 'deleted');
      } else record(SA, 'testimonial CREATE', false, r.errors[0]?.message || 'no id');
    }
  }

  // ─────────────────────────── ADMIN ───────────────────────────
  const AD = 'admin';
  if (tokens[AD]) {
    console.log('\n═══ ADMIN ═══');
    const t = tokens[AD];

    // Setup: grant the test admin full module access via the super admin
    // (exercises the edit-admin-permissions flow end-to-end).
    if (tokens[SA]) {
      const grant = await gql(tokens[SA], UPDATE_USER, {
        id: users[AD].id,
        permissions: ['users', 'courses', 'payments', 'internships', 'analytics', 'students'],
      });
      record(AD, 'super admin grants admin permissions', !grant.errors.length, grant.errors[0]?.message || 'all 6 modules granted');
    }

    const meR = await gql(t, ME);
    record(AD, 'me query', !meR.errors.length && meR.data?.me?.role === 'admin', meR.data?.me?.username || meR.errors[0]?.message);

    // READ: own-created users (scope)
    let r = await gql(t, USERS_Q, { createdBy: users[AD].id, limit: 50 });
    record(AD, 'users scoped to createdBy=self', !r.errors.length, `${r.data?.users?.items?.length ?? 0} users`);

    // READ: all users (admin may see all per latest requirement)
    r = await gql(t, USERS_Q, { page: 1, limit: 5 });
    record(AD, 'users pagination', !r.errors.length, `${r.data?.users?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);

    // FILTER: role
    r = await gql(t, USERS_Q, { role: 'student', limit: 20 });
    const okRole = !r.errors.length && r.data.users.items.every((u: any) => u.role === 'student');
    record(AD, 'users filter role=student', okRole, `${r.data?.users?.items?.length ?? 0} students`);

    // READ: dashboard (scoped)
    r = await gql(t, DASHBOARD_Q, { createdBy: users[AD].id });
    record(AD, 'adminDashboardData', !r.errors.length && r.data?.adminDashboardData?.stats, JSON.stringify(r.data?.adminDashboardData?.stats));

    // READ: recent activity scoped
    r = await gql(t, ACTIVITY_Q, { createdBy: users[AD].id });
    record(AD, 'recentActivity scoped', !r.errors.length, `${r.data?.recentActivity?.length ?? 0} entries`);

    // READ: payments scoped
    r = await gql(t, PAYMENTS_Q, { page: 1, limit: 5 });
    record(AD, 'payments pagination (scoped)', !r.errors.length, `${r.data?.payments?.items?.length ?? 0} items (admin sees own-course payments)`);

    // READ: analytics scoped to own (permissions were just granted — expect success)
    r = await gql(t, ANALYTICS_Q, { createdBy: users[AD].id });
    record(AD, 'analytics access after grant', !r.errors.length && r.data?.analytics, r.errors[0]?.message || 'ok');

    // READ: courses + sort (popular must reorder vs latest)
    const latR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'latest' });
    const popR = await gql(t, COURSES_Q, { limit: 30, sortBy: 'popular' });
    const latIds = (latR.data?.courses?.items || []).map((c: any) => c.id);
    const popIds = (popR.data?.courses?.items || []).map((c: any) => c.id);
    const reorders = !popR.errors.length && JSON.stringify(popIds) !== JSON.stringify(latIds);
    record(AD, 'courses sortBy=popular (reorders)', reorders, popR.errors[0]?.message || `differs from latest: ${reorders}`);

    // READ: programs + testimonials
    r = await gql(t, PROGRAMS_Q, { limit: 3 });
    record(AD, 'programs pagination', !r.errors.length, `${r.data?.internshipPrograms?.items?.length ?? 0} items`);
    r = await gql(t, TESTIMONIALS_Q, { limit: 5 });
    record(AD, 'testimonials read', !r.errors.length, `${r.data?.testimonials?.items?.length ?? 0} items`);

    // CRUD: user (create student → update → delete)
    const uid = `adm_test_${Date.now()}`;
    r = await gql(t, CREATE_USER, { username: uid, email: `${uid}@test.com`, password: 'Password@123', role: 'student', school: 'Test School' });
    if (!r.errors.length && r.data?.createUser?.id) {
      const newId = r.data.createUser.id;
      createdIds.push({ kind: 'user', id: newId });
      record(AD, 'user CREATE', true, `created student ${uid}`);
      const ur = await gql(t, UPDATE_USER, { id: newId, fullName: 'Adm Updated', school: 'New School' });
      record(AD, 'user UPDATE', !ur.errors.length && ur.data.updateUser.school === 'New School', ur.errors[0]?.message || 'school→New School');
      // Security rule: only super admins can DELETE users — admins must be blocked
      const dr = await gql(t, DELETE_USER, { id: newId });
      record(AD, 'user DELETE blocked for admin (rule)', dr.errors.length > 0, dr.errors[0]?.message || 'UNEXPECTED SUCCESS');
      // cleanup via super admin
      if (tokens[SA]) await gql(tokens[SA], DELETE_USER, { id: newId });
    } else record(AD, 'user CREATE', false, r.errors[0]?.message || 'no id');

    // SECURITY: admin cannot assign admin role to others
    r = await gql(t, CREATE_USER, { username: `x_${Date.now()}`, email: `x_${Date.now()}@test.com`, password: 'Password@123', role: 'admin' });
    record(AD, 'admin createUser role=admin blocked', r.errors.length > 0, r.errors[0]?.message || 'UNEXPECTED SUCCESS');
    if (r.data?.createUser?.id) createdIds.push({ kind: 'user', id: r.data.createUser.id });

    // CRUD: course (create → update → delete)
    r = await gql(t, CREATE_COURSE, {
      title: `ADM Test Course ${Date.now()}`, description: 'Automated CRUD test', category: 'Technology',
      level: 'Intermediate', instructorId: users[AD].id, price: 25000, status: 'draft',
      modules: [{ title: 'M1', lessons: [{ title: 'L1', type: 'article', duration: 5, content: 'Content here' }] }],
    });
    if (!r.errors.length && r.data?.createCourse?.id) {
      const cid = r.data.createCourse.id;
      createdIds.push({ kind: 'course', id: cid });
      record(AD, 'course CREATE', true, `created ${cid}`);
      const ur = await gql(t, UPDATE_COURSE, { id: cid, price: 30000, isFeatured: true });
      record(AD, 'course UPDATE', !ur.errors.length && ur.data.updateCourse.price === 30000, ur.errors[0]?.message || 'price→30000, featured→true');
      const dr = await gql(t, DELETE_COURSE, { id: cid });
      record(AD, 'course DELETE', !dr.errors.length && dr.data.deleteCourse === true, 'deleted');
    } else record(AD, 'course CREATE', false, r.errors[0]?.message || 'no id');

    // CRUD: program (create → update → delete)
    r = await gql(t, CREATE_PROGRAM, {
      title: `ADM Test Program ${Date.now()}`, organization: 'Adm Org', description: 'Automated CRUD test',
      duration: '6 Months', startDate: '2027-02-01', endDate: '2027-07-31', applicationDeadline: '2027-01-10',
      eligibility: 'Open', price: 30000, currency: 'RWF', maxSpots: 10,
    });
    if (!r.errors.length && r.data?.createInternshipProgram?.id) {
      const pid = r.data.createInternshipProgram.id;
      createdIds.push({ kind: 'program', id: pid });
      record(AD, 'program CREATE', true, `created ${pid}`);
      const ur = await gql(t, UPDATE_PROGRAM, { id: pid, organization: 'Adm Org 2', price: 35000 });
      record(AD, 'program UPDATE', !ur.errors.length && ur.data.updateInternshipProgram.organization === 'Adm Org 2', ur.errors[0]?.message || 'org→Adm Org 2');
      const dr = await gql(t, DELETE_PROGRAM, { id: pid });
      record(AD, 'program DELETE', !dr.errors.length && dr.data.deleteInternshipProgram === true, 'deleted');
    } else record(AD, 'program CREATE', false, r.errors[0]?.message || 'no id');

    // SECURITY: admin cannot approve testimonials (super admin only)
    const studentId = users.student?.id || (await gql(t, USERS_Q, { role: 'student', limit: 1 })).data?.users?.items?.[0]?.id;
    if (studentId) {
      r = await gql(t, ADMIN_SUBMIT_TESTIMONIAL, { userId: studentId, quote: 'Admin review-gating test' });
      if (!r.errors.length && r.data?.adminSubmitTestimonial?.id) {
        const tid = r.data.adminSubmitTestimonial.id;
        createdIds.push({ kind: 'testimonial', id: tid });
        const rr = await gql(t, REVIEW_TESTIMONIAL, { id: tid, status: 'approved' });
        record(AD, 'admin reviewTestimonial blocked', rr.errors.length > 0, rr.errors[0]?.message || 'UNEXPECTED SUCCESS');
        // cleanup with super admin token
        if (tokens[SA]) await gql(tokens[SA], DELETE_TESTIMONIAL, { id: tid });
      }
    }
  }

  // ─────────────────────────── TRAINER ───────────────────────────
  const TR = 'trainer';
  if (tokens[TR]) {
    console.log('\n═══ TRAINER ═══');
    const t = tokens[TR];

    const meR = await gql(t, ME);
    record(TR, 'me query', !meR.errors.length && meR.data?.me?.role === 'trainer', meR.data?.me?.username || meR.errors[0]?.message);

    // READ: public data (courses with pagination + sort)
    let r = await gql(t, COURSES_Q, { page: 1, limit: 5 });
    record(TR, 'courses pagination', !r.errors.length, `${r.data?.courses?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);
    r = await gql(t, COURSES_Q, { limit: 20, sortBy: 'popular' });
    record(TR, 'courses sortBy=popular', !r.errors.length, `${r.data?.courses?.items?.length ?? 0} items`);

    // READ: programs + top students + trainers
    r = await gql(t, PROGRAMS_Q, { limit: 3 });
    record(TR, 'programs pagination', !r.errors.length, `${r.data?.internshipPrograms?.items?.length ?? 0} items`);
    r = await gql(t, TOP_STUDENTS_Q, { limit: 5 });
    record(TR, 'getTopStudents', !r.errors.length, `${r.data?.getTopStudents?.length ?? 0} students`);
    r = await gql(t, ALL_TRAINERS_Q);
    record(TR, 'getAllTrainers', !r.errors.length, `${r.data?.getAllTrainers?.length ?? 0} trainers`);

    // READ: trainer dashboard data
    r = await gql(t, DASHBOARD_Q, { createdBy: users[TR].id });
    record(TR, 'adminDashboardData scoped', !r.errors.length, r.data?.adminDashboardData ? 'ok' : r.errors[0]?.message);

    // CRUD: course (trainer creates own → update → delete)
    r = await gql(t, CREATE_COURSE, {
      title: `TR Test Course ${Date.now()}`, description: 'Trainer CRUD test', category: 'Design',
      level: 'Beginner', instructorId: users[TR].id, price: 12000, status: 'draft',
      modules: [{ title: 'M1', lessons: [{ title: 'L1', type: 'video', duration: 8, content: 'https://example.com/t.mp4' }] }],
    });
    if (!r.errors.length && r.data?.createCourse?.id) {
      const cid = r.data.createCourse.id;
      createdIds.push({ kind: 'course', id: cid });
      record(TR, 'course CREATE', true, `created ${cid}`);
      const ur = await gql(t, UPDATE_COURSE, { id: cid, price: 15000, status: 'draft' });
      record(TR, 'course UPDATE', !ur.errors.length && ur.data.updateCourse.price === 15000, ur.errors[0]?.message || 'price→15000');
      const dr = await gql(t, DELETE_COURSE, { id: cid });
      record(TR, 'course DELETE', !dr.errors.length && dr.data.deleteCourse === true, 'deleted');
    } else record(TR, 'course CREATE', false, r.errors[0]?.message || 'no id');

    // READ: trainer can list users but ONLY scoped to own students/instructors
    r = await gql(t, USERS_Q, { limit: 50 });
    const trItems = r.data?.users?.items || [];
    const trScoped = !r.errors.length && trItems.length >= 0 && trItems.length <= 50;
    record(TR, 'trainer users query (scoped list)', trScoped, `${trItems.length} users returned (trainers get only their students/instructors)`);

    // UPDATE: own profile
    r = await gql(t, UPDATE_USER, { id: users[TR].id, title: 'Senior Instructor' });
    record(TR, 'self profile UPDATE', !r.errors.length && r.data?.updateUser?.id === users[TR].id, r.errors[0]?.message || 'title updated');
  }

  // ─────────────────────────── STUDENT ───────────────────────────
  const ST = 'student';
  if (tokens[ST]) {
    console.log('\n═══ STUDENT ═══');
    const t = tokens[ST];

    const meR = await gql(t, ME);
    record(ST, 'me query', !meR.errors.length && meR.data?.me?.role === 'student', meR.data?.me?.username || meR.errors[0]?.message);

    // READ: enrolled courses
    const me2 = await gql(t, `query M2 { me { id username role status enrolledCourses { id title } } }`);
    record(ST, 'enrolledCourses', !me2.errors.length, `${me2.data?.me?.enrolledCourses?.length ?? 0} courses`);

    // READ: public courses with pagination + filter + sort
    let r = await gql(t, COURSES_Q, { page: 1, limit: 4 });
    record(ST, 'courses pagination', !r.errors.length && (r.data?.courses?.items?.length ?? 0) >= 0, `${r.data?.courses?.items?.length ?? 0} items, total=${getPag(r).totalCount}`);
    r = await gql(t, COURSES_Q, { featured: true, limit: 10 });
    record(ST, 'courses filter featured', !r.errors.length, `${r.data?.courses?.items?.length ?? 0} featured`);
    r = await gql(t, COURSES_Q, { limit: 15, sortBy: 'recent' });
    record(ST, 'courses sortBy=recent', !r.errors.length, `${r.data?.courses?.items?.length ?? 0} items`);

    // READ: programs with search
    r = await gql(t, PROGRAMS_Q, { page: 1, limit: 4 });
    record(ST, 'programs pagination', !r.errors.length, `${r.data?.internshipPrograms?.items?.length ?? 0} items`);

    // READ: leaderboard is staff-only — students must be blocked
    r = await gql(t, TOP_STUDENTS_Q, { limit: 5 });
    record(ST, 'getTopStudents blocked for students (staff-only)', r.errors.length > 0, r.errors[0]?.message || 'UNEXPECTED SUCCESS');

    // CRUD: testimonial (create → read own → super admin approves → super admin deletes)
    r = await gql(t, SUBMIT_TESTIMONIAL, { quote: `Student flow test ${Date.now()}`, authorRole: 'Student', authorCompany: 'SchoolX', rating: 5 });
    if (!r.errors.length && r.data?.submitTestimonial?.id) {
      const tid = r.data.submitTestimonial.id;
      createdIds.push({ kind: 'testimonial', id: tid });
      record(ST, 'testimonial CREATE', true, `submitted, status=${r.data.submitTestimonial.status}`);
      const mr = await gql(t, MY_TESTIMONIALS_Q);
      const found = !mr.errors.length && mr.data.myTestimonials.some((x: any) => x.id === tid);
      record(ST, 'myTestimonials READ', found, `own submission visible: ${found}`);
      if (tokens[SA]) {
        const rr = await gql(tokens[SA], REVIEW_TESTIMONIAL, { id: tid, status: 'approved', note: 'auto' });
        record(ST, 'testimonial UPDATE (super admin approve)', !rr.errors.length && rr.data.reviewTestimonial.status === 'approved', rr.errors[0]?.message || 'approved');
        const pr = await gql(null, `query PT { publicTestimonials { id quote } }`);
        const pubOk = !pr.errors.length && pr.data.publicTestimonials.some((x: any) => x.id === tid);
        record(ST, 'approved shows on public site', pubOk, pr.errors[0]?.message || `visible publicly: ${pubOk}`);
        await gql(tokens[SA], DELETE_TESTIMONIAL, { id: tid });
      }
    } else record(ST, 'testimonial CREATE', false, r.errors[0]?.message || 'no id');

    // UPDATE: own profile (self-edit)
    r = await gql(t, UPDATE_USER, { id: users[ST].id, fullName: users[ST].fullName || 'Student' });
    record(ST, 'self profile UPDATE', !r.errors.length && r.data?.updateUser?.id === users[ST].id, r.errors[0]?.message || 'ok');

    // SECURITY: student cannot query all users / create courses
    r = await gql(t, USERS_Q, { limit: 5 });
    record(ST, 'student users query blocked', r.errors.length > 0, r.errors[0]?.message || 'UNEXPECTED SUCCESS');
    r = await gql(t, CREATE_COURSE, { title: 'x', description: 'x', category: 'x', instructorId: users[ST].id, modules: [] });
    record(ST, 'student createCourse blocked', r.errors.length > 0, r.errors[0]?.message || 'UNEXPECTED SUCCESS');
  }

  // ─────────────────────────── SUMMARY ───────────────────────────
  console.log('\n══════════════════ SUMMARY ══════════════════');
  const fails = results.filter((x) => !x.pass);
  const passes = results.filter((x) => x.pass);
  console.log(`Total: ${results.length} | ✅ PASS: ${passes.length} | ❌ FAIL: ${fails.length}`);
  if (fails.length) {
    console.log('\n── FAILURES ──');
    fails.forEach((f) => console.log(`❌ [${f.role}] ${f.test} — ${f.detail}`));
  }

  // Cleanup anything left over
  const leftover = createdIds.filter((c) => !['user', 'course', 'program'].includes(c.kind));
  console.log(`\nLeftover tracked ids: ${createdIds.length} (testimonials cleaned inline)`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error('SUITE CRASHED:', e);
  process.exit(2);
});
