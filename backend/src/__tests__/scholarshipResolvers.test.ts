import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockScholarshipFind, mockScholarshipFindById, mockScholarshipCreate, mockUserFindById, mockCourseFindById, mockInternshipFindById, mockSendNotification, mockSendScholarshipApprovedToAdmin, mockSendScholarshipRevokedToAdmin } = vi.hoisted(() => {
  const find = vi.fn();
  const findById = vi.fn();
  const create = vi.fn();
  const userFindById = vi.fn();
  const courseFindById = vi.fn();
  const internshipFindById = vi.fn();
  const sendNotification = vi.fn();
  const sendScholarshipApprovedToAdmin = vi.fn().mockResolvedValue(true);
  const sendScholarshipRevokedToAdmin = vi.fn().mockResolvedValue(true);

  return {
    mockScholarshipFind: find,
    mockScholarshipFindById: findById,
    mockScholarshipCreate: create,
    mockUserFindById: userFindById,
    mockCourseFindById: courseFindById,
    mockInternshipFindById: internshipFindById,
    mockSendNotification: sendNotification,
    mockSendScholarshipApprovedToAdmin: sendScholarshipApprovedToAdmin,
    mockSendScholarshipRevokedToAdmin: sendScholarshipRevokedToAdmin,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("../models/Scholarship", () => ({
  Scholarship: {
    find: (...args: any[]) => {
      const query: any = mockScholarshipFind(...args);
      // Chainable Mongoose-like query
      const chain: any = {
        sort: vi.fn(() => chain),
        skip: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        populate: vi.fn(() => chain),
        then: (resolve: (v: any) => any) => {
          if (query && typeof query.then === "function") return query.then(resolve);
          return Promise.resolve(query).then(resolve);
        },
        catch: (reject: (e: any) => any) => Promise.resolve(query).then(undefined, reject),
      };
      return chain;
    },
    findById: (id: string) => mockScholarshipFindById(id),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: (data: any) => mockScholarshipCreate(data),
    findOne: vi.fn(),
    aggregate: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../models/User", () => ({
  User: {
    findById: (id: string) => mockUserFindById(id),
  },
}));

vi.mock("../models/Course", () => ({
  Course: {
    findById: (id: string) => mockCourseFindById(id),
  },
}));

vi.mock("../models/internship/InternshipProgram", () => ({
  InternshipProgram: {
    findById: (id: string) => mockInternshipFindById(id),
  },
}));

vi.mock("../services/notification.service", () => ({
  sendNotification: (...args: any[]) => mockSendNotification(...args),
}));

vi.mock("../services/audit.service", () => ({
  logActivity: vi.fn(),
}));

vi.mock("../services/email.service", () => ({
  sendScholarshipApprovedToAdmin: mockSendScholarshipApprovedToAdmin,
  sendScholarshipRevokedToAdmin: mockSendScholarshipRevokedToAdmin,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { scholarshipResolvers } from "../graphql/scholarship-resolvers.js";

const _ = {};

function makeContext(overrides: Partial<{ id: string; username: string; role: string }> = {}) {
  return {
    user: {
      id: "admin-1",
      username: "adminuser",
      role: "admin",
      ...overrides,
    },
  };
}

// Utility to create a mock Scholarship.findOne return value
function mockFindOneResult(value: any) {
  return {
    then: (resolve: (v: any) => any) => Promise.resolve(value).then(resolve),
  } as any;
}

// =============================================================================
// getAllScholarships
// =============================================================================
describe("getAllScholarships", () => {
  const getAllScholarships = scholarshipResolvers.Query.getAllScholarships;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 'Not authorized' when no user in context", async () => {
    await expect(getAllScholarships(_, {}, {})).rejects.toThrow("Not authorized");
    await expect(getAllScholarships(_, {}, { user: null })).rejects.toThrow("Not authorized");
  });

  it("throws 'Not authorized' for student role", async () => {
    await expect(getAllScholarships(_, {}, makeContext({ role: "student" }))).rejects.toThrow("Not authorized");
  });

  it("throws 'Not authorized' for trainer role", async () => {
    await expect(getAllScholarships(_, {}, makeContext({ role: "trainer" }))).rejects.toThrow("Not authorized");
  });

  it("returns paginated scholarships for super_admin", async () => {
    const mockItems = [
      { _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course", itemId: "c1", itemTitle: "Course 1", status: "active", reason: "Merit", createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}) },
    ];
    mockScholarshipFind.mockResolvedValue(mockItems);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.countDocuments).mockResolvedValue(1);

    const result = await getAllScholarships(_, { page: 1, limit: 10 }, makeContext({ role: "super_admin" }));

    expect(result.items).toEqual(mockItems);
    expect(result.pagination.totalCount).toBe(1);
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.hasNextPage).toBe(false);
  });

  it("returns paginated scholarships for admin", async () => {
    const mockItems = [
      { _id: "s2", userId: "u1", grantedBy: "admin-1", type: "internship", itemId: "i1", itemTitle: "Internship 1", status: "active", createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}) },
    ];
    mockScholarshipFind.mockResolvedValue(mockItems);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.countDocuments).mockResolvedValue(1);

    const result = await getAllScholarships(_, { page: 1, limit: 10 }, makeContext({ role: "admin" }));

    expect(result.items).toEqual(mockItems);
    expect(result.pagination.totalCount).toBe(1);
  });

  it("filters by status when provided", async () => {
    mockScholarshipFind.mockResolvedValue([]);
    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.countDocuments).mockResolvedValue(0);

    await getAllScholarships(_, { page: 1, limit: 10, status: "active" }, makeContext());

    const findFilter = mockScholarshipFind.mock.calls[0][0];
    expect(findFilter.status).toBe("active");
  });

  it("filters by type when provided", async () => {
    mockScholarshipFind.mockResolvedValue([]);
    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.countDocuments).mockResolvedValue(0);

    await getAllScholarships(_, { page: 1, limit: 10, type: "course" }, makeContext());

    const findFilter = mockScholarshipFind.mock.calls[0][0];
    expect(findFilter.type).toBe("course");
  });
});

// =============================================================================
// getUserScholarships
// =============================================================================
describe("getUserScholarships", () => {
  const getUserScholarships = scholarshipResolvers.Query.getUserScholarships;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(getUserScholarships(_, { userId: "u1" }, {})).rejects.toThrow("Not authorized");
  });

  it("throws for student role", async () => {
    await expect(getUserScholarships(_, { userId: "u1" }, makeContext({ role: "student" }))).rejects.toThrow("Not authorized");
  });

  it("returns scholarships for a specific user", async () => {
    const mockItems = [
      { _id: "s1", userId: "u1", type: "course", itemTitle: "Course 1", status: "active" },
    ];
    mockScholarshipFind.mockResolvedValue(mockItems);

    const result = await getUserScholarships(_, { userId: "u1" }, makeContext());

    expect(mockScholarshipFind).toHaveBeenCalledWith({ userId: "u1" });
    expect(result).toEqual(mockItems);
  });
});

// =============================================================================
// getScholarshipStats
// =============================================================================
describe("getScholarshipStats", () => {
  const getScholarshipStats = scholarshipResolvers.Query.getScholarshipStats;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(getScholarshipStats(_, {}, {})).rejects.toThrow("Not authorized");
  });

  it("returns scholarship stats", async () => {
    const { Scholarship } = await import("../models/Scholarship.js");
    // The resolver makes 5 countDocuments calls: total, pending, active, course, internship
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(50);  // total
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(5);   // pending
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(40);  // active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(30);  // course active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(10);  // internship active

    const result = await getScholarshipStats(_, {}, makeContext({ role: "super_admin" }));

    expect(result).toEqual({
      totalScholarships: 50,
      pendingScholarships: 5,
      activeScholarships: 40,
      courseScholarships: 30,
      internshipScholarships: 10,
      perAdmin: [],
    });
  });

  it("includes pendingScholarships count in stats", async () => {
    const { Scholarship } = await import("../models/Scholarship.js");
    // total, pending, active, course_active, internship_active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(100);
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(25); // pending
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(60); // active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(40); // course active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(20); // internship active

    // Mock aggregate for perAdmin
    vi.mocked(Scholarship.aggregate).mockResolvedValueOnce([
      { _id: "admin-1", total: 80, pending: 15, active: 50, revoked: 15 },
    ]);

    const result = await getScholarshipStats(_, {}, makeContext({ role: "super_admin" }));

    expect(result.pendingScholarships).toBe(25);
    expect(result.totalScholarships).toBe(100);
    expect(result.activeScholarships).toBe(60);
    expect(result.courseScholarships).toBe(40);
    expect(result.internshipScholarships).toBe(20);
    expect(result.perAdmin).toHaveLength(1);
    expect(result.perAdmin![0]).toEqual({
      adminId: "admin-1",
      total: 80,
      pending: 15,
      active: 50,
      revoked: 15,
    });
  });

  it("scopes stats by admin when admin role is used", async () => {
    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(10); // total
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(3);  // pending
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(5);  // active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(3);  // course active
    vi.mocked(Scholarship.countDocuments).mockResolvedValueOnce(2);  // internship active

    const result = await getScholarshipStats(_, {}, makeContext({ role: "admin" }));

    expect(result.totalScholarships).toBe(10);
    expect(result.pendingScholarships).toBe(3);
    expect(result.activeScholarships).toBe(5);

    // Admin should not have perAdmin stats (empty array)
    expect(result.perAdmin).toEqual([]);
    // Admin's aggregate should not have been called
    expect(Scholarship.aggregate).not.toHaveBeenCalled();
  });
});

// =============================================================================
// grantScholarship
// =============================================================================
describe("grantScholarship", () => {
  const grantScholarship = scholarshipResolvers.Mutation.grantScholarship;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Authorization ---

  it("throws 'Not authorized' when no user in context", async () => {
    await expect(grantScholarship(_, { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" }, {})).rejects.toThrow("Not authorized");
  });

  it("throws 'Not authorized' for student role", async () => {
    await expect(grantScholarship(_, { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" }, makeContext({ role: "student" }))).rejects.toThrow("Not authorized");
  });

  // --- Validation ---

  it("throws if student user not found", async () => {
    mockUserFindById.mockResolvedValue(null);

    await expect(grantScholarship(_, { userId: "nonexistent", type: "course", itemId: "c1", itemTitle: "Course 1" }, makeContext())).rejects.toThrow("Student not found");
  });

  it("throws if course not found", async () => {
    mockUserFindById.mockResolvedValue({ _id: "u1", username: "student1", enrolledCourses: [] });
    mockCourseFindById.mockResolvedValue(null);

    await expect(grantScholarship(_, { userId: "u1", type: "course", itemId: "nonexistent", itemTitle: "Course" }, makeContext())).rejects.toThrow("Course not found");
  });

  it("throws if internship program not found", async () => {
    mockUserFindById.mockResolvedValue({ _id: "u1", username: "student1" });
    mockInternshipFindById.mockResolvedValue(null);

    await expect(grantScholarship(_, { userId: "u1", type: "internship", itemId: "nonexistent", itemTitle: "Internship" }, makeContext())).rejects.toThrow("Internship program not found");
  });

  it("throws for invalid scholarship type", async () => {
    mockUserFindById.mockResolvedValue({ _id: "u1", username: "student1" });

    await expect(grantScholarship(_, { userId: "u1", type: "invalid", itemId: "x1", itemTitle: "Test" }, makeContext())).rejects.toThrow('Invalid scholarship type');
  });

  // --- Existing scholarship check ---

  it("throws if student already has an active or pending scholarship for this item", async () => {
    mockUserFindById.mockResolvedValue({ _id: "u1", username: "student1", enrolledCourses: [] });
    mockCourseFindById.mockResolvedValue({ _id: "c1", title: "Course 1" });

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult({ _id: "existing" }));

    await expect(grantScholarship(_, { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" }, makeContext())).rejects.toThrow("already has an active or pending scholarship");
  });

  it("does not throw if student only has a revoked scholarship for this item", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course", itemId: "c1",
      itemTitle: "Course 1", status: "pending", reason: "",
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    // Previous revoked scholarship — still passed to findOne
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" },
      makeContext({ role: "admin" })
    );

    // Should succeed since revoked scholarships don't count as existing
    expect(result).toEqual(createdScholarship);
    expect(mockScholarshipCreate).toHaveBeenCalled();
  });

  // --- Role-based status ---

  it("creates scholarship with 'pending' status when granted by admin", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course", itemId: "c1",
      itemTitle: "Course 1", status: "pending", reason: "", createdAt: new Date(), updatedAt: new Date(),
      toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" },
      makeContext({ role: "admin" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );

    // Admin-granted pending scholarships should NOT enroll the student
    expect(course.studentsEnrolled).not.toContain("u1");
    expect(course.save).not.toHaveBeenCalled();

    // Notification should mention pending approval
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        type: "SCHOLARSHIP_GRANTED",
        title: expect.stringContaining("Pending Approval"),
      })
    );

    expect(result).toEqual(createdScholarship);
  });

  it("creates scholarship with 'active' status when granted by super_admin and enrolls student", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1", userId: "u1", grantedBy: "super-1", type: "course", itemId: "c1",
      itemTitle: "Course 1", status: "active", reason: "Top performer",
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1", reason: "Top performer" },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" })
    );

    // Super_admin grants should enroll immediately
    expect(course.studentsEnrolled).toContain("u1");
    expect(course.save).toHaveBeenCalled();
    expect(student.enrolledCourses).toContain("c1");
    expect(student.save).toHaveBeenCalled();

    // Notification should be immediate grant notification
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        title: expect.stringContaining("Granted"),
      })
    );

    expect(result).toEqual(createdScholarship);
  });

  // --- Location fields ---

  it("stores grantedLatitude and grantedLongitude when provided", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course", itemId: "c1",
      itemTitle: "Course 1", status: "pending", grantedLatitude: -1.9441, grantedLongitude: 30.0619,
      grantedCity: "Kigali", grantedCountry: "Rwanda",
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      {
        userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1",
        grantedLatitude: -1.9441, grantedLongitude: 30.0619,
        grantedCity: "Kigali", grantedCountry: "Rwanda",
      },
      makeContext()
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        grantedLatitude: -1.9441,
        grantedLongitude: 30.0619,
        grantedCity: "Kigali",
        grantedCountry: "Rwanda",
      })
    );

    expect(result.grantedLatitude).toBe(-1.9441);
    expect(result.grantedLongitude).toBe(30.0619);
    expect(result.grantedCity).toBe("Kigali");
    expect(result.grantedCountry).toBe("Rwanda");
  });

  it("omits location fields when not provided", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course", itemId: "c1",
      itemTitle: "Course 1", status: "pending",
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1" },
      makeContext()
    );

    // Location fields should be undefined (not passed)
    const createCall = mockScholarshipCreate.mock.calls[0][0];
    expect(createCall.grantedLatitude).toBeUndefined();
    expect(createCall.grantedLongitude).toBeUndefined();
    expect(createCall.grantedCity).toBeUndefined();
    expect(createCall.grantedCountry).toBeUndefined();
  });

  // --- Successful course scholarship (super_admin -> immediate enrollment) ---

  it("grants a course scholarship as super_admin and enrolls the student", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const createdScholarship = {
      _id: "s1",
      userId: "u1",
      grantedBy: "super-1",
      type: "course",
      itemId: "c1",
      itemTitle: "Course 1",
      status: "active",
      reason: "Merit-based",
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1", reason: "Merit-based" },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        grantedBy: "super-1",
        type: "course",
        itemId: "c1",
        itemTitle: "Course 1",
        reason: "Merit-based",
        status: "active",
      })
    );

    expect(course.studentsEnrolled).toContain("u1");
    expect(course.save).toHaveBeenCalled();
    expect(student.enrolledCourses).toContain("c1");
    expect(student.save).toHaveBeenCalled();
    expect(mockSendNotification).toHaveBeenCalled();
    expect(result).toEqual(createdScholarship);
  });

  it("does not enroll for internship scholarships", async () => {
    const student = { _id: "u1", username: "student1", save: vi.fn() };
    const program = { _id: "i1", title: "Internship 1" };
    const createdScholarship = {
      _id: "s2",
      userId: "u1",
      grantedBy: "super-1",
      type: "internship",
      itemId: "i1",
      itemTitle: "Internship 1",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      toObject: () => ({}),
    };

    mockUserFindById.mockResolvedValue(student);
    mockInternshipFindById.mockResolvedValue(program);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(createdScholarship);

    const result = await grantScholarship(
      _,
      { userId: "u1", type: "internship", itemId: "i1", itemTitle: "Internship 1" },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: "internship", status: "active" })
    );

    expect(mockSendNotification).toHaveBeenCalled();
    expect(result).toEqual(createdScholarship);
  });
});

// =============================================================================
// grantBatchScholarships
// =============================================================================
describe("grantBatchScholarships", () => {
  const grantBatch = scholarshipResolvers.Mutation.grantBatchScholarships;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 'Not authorized' when no user in context", async () => {
    await expect(grantBatch(_, { userIds: ["u1"], type: "course", itemIds: ["c1"] }, {})).rejects.toThrow("Not authorized");
  });

  it("throws 'Not authorized' for student role", async () => {
    await expect(grantBatch(_, { userIds: ["u1"], type: "course", itemIds: ["c1"] }, makeContext({ role: "student" }))).rejects.toThrow("Not authorized");
  });

  it("creates scholarships for multiple students and multiple items", async () => {
    const student1 = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const student2 = { _id: "u2", username: "student2", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    mockUserFindById.mockImplementation((id: string) => {
      if (id === "u1") return Promise.resolve(student1);
      if (id === "u2") return Promise.resolve(student2);
      return Promise.resolve(null);
    });
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue({ _id: "s1", toObject: () => ({}) });

    const result = await grantBatch(
      _,
      {
        userIds: ["u1", "u2"],
        type: "course",
        itemIds: ["c1"],
        itemTitles: ["Course 1"],
      },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    // Should create 2 scholarships (2 students × 1 course)
    expect(result).toBe(2);
    expect(mockScholarshipCreate).toHaveBeenCalledTimes(2);
    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", status: "active" })
    );
    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u2", status: "active" })
    );
  });

  it("skips students and items that already have active scholarships", async () => {
    const student1 = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const student2 = { _id: "u2", username: "student2", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    mockUserFindById.mockImplementation((id: string) => {
      if (id === "u1") return Promise.resolve(student1);
      if (id === "u2") return Promise.resolve(student2);
      return Promise.resolve(null);
    });
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    // student1 already has an active scholarship → Scholarship.findOne returns truthy
    vi.mocked(Scholarship.findOne)
      .mockReturnValueOnce(mockFindOneResult({ _id: "existing" })) // u1 x c1 → skip
      .mockReturnValueOnce(mockFindOneResult(null)); // u2 x c1 → create
    mockScholarshipCreate.mockResolvedValue({ _id: "s2", toObject: () => ({}) });

    const result = await grantBatch(
      _,
      {
        userIds: ["u1", "u2"],
        type: "course",
        itemIds: ["c1"],
        itemTitles: ["Course 1"],
      },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(result).toBe(1); // Only u2 x c1 should be created
    expect(mockScholarshipCreate).toHaveBeenCalledTimes(1);
    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u2" })
    );
  });

  it("creates as 'pending' when granted by admin", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue({ _id: "s1", toObject: () => ({}) });

    await grantBatch(
      _,
      { userIds: ["u1"], type: "course", itemIds: ["c1"], itemTitles: ["Course 1"] },
      makeContext({ role: "admin" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );
  });

  it("creates as 'active' when granted by super_admin", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue({ _id: "s1", toObject: () => ({}) });

    await grantBatch(
      _,
      { userIds: ["u1"], type: "course", itemIds: ["c1"], itemTitles: ["Course 1"] },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" })
    );
  });

  it("stores location data in batch grants", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue({ _id: "s1", toObject: () => ({}) });

    await grantBatch(
      _,
      {
        userIds: ["u1"], type: "course", itemIds: ["c1"], itemTitles: ["Course 1"],
        grantedLatitude: -1.9441, grantedLongitude: 30.0619,
        grantedCity: "Kigali", grantedCountry: "Rwanda",
      },
      makeContext()
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        grantedLatitude: -1.9441,
        grantedLongitude: 30.0619,
        grantedCity: "Kigali",
        grantedCountry: "Rwanda",
      })
    );
  });

  it("skips non-existent students silently", async () => {
    mockUserFindById.mockResolvedValue(null); // Student not found
    mockCourseFindById.mockResolvedValue({ _id: "c1", title: "Course 1" });

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));

    const result = await grantBatch(
      _,
      { userIds: ["nonexistent"], type: "course", itemIds: ["c1"], itemTitles: ["Course 1"] },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(result).toBe(0); // No scholarships created
    expect(mockScholarshipCreate).not.toHaveBeenCalled();
  });

  it("skips non-existent items silently", async () => {
    const student = { _id: "u1", username: "student1", save: vi.fn() };
    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(null); // Course not found

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));

    const result = await grantBatch(
      _,
      { userIds: ["u1"], type: "course", itemIds: ["nonexistent"], itemTitles: ["Ghost Course"] },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(result).toBe(0);
    expect(mockScholarshipCreate).not.toHaveBeenCalled();
  });
});

// =============================================================================
// approveScholarship
// =============================================================================
describe("approveScholarship", () => {
  const approveScholarship = scholarshipResolvers.Mutation.approveScholarship;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 'Not authorized' when no user in context", async () => {
    await expect(approveScholarship(_, { id: "s1" }, {})).rejects.toThrow("Only super admins can approve");
  });

  it("throws 'Not authorized' for admin role", async () => {
    await expect(approveScholarship(_, { id: "s1" }, makeContext({ role: "admin" }))).rejects.toThrow("Only super admins can approve");
  });

  it("throws 'Not authorized' for student role", async () => {
    await expect(approveScholarship(_, { id: "s1" }, makeContext({ role: "student" }))).rejects.toThrow("Only super admins can approve");
  });

  it("throws if scholarship not found", async () => {
    mockScholarshipFindById.mockResolvedValue(null);

    await expect(approveScholarship(_, { id: "nonexistent" }, makeContext({ role: "super_admin" }))).rejects.toThrow("Scholarship not found");
  });

  it("throws if scholarship is not in pending status", async () => {
    mockScholarshipFindById.mockResolvedValue({ _id: "s1", status: "active", save: vi.fn() });

    await expect(approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin" }))).rejects.toThrow("not in pending status");
  });

  it("throws if scholarship is already revoked", async () => {
    mockScholarshipFindById.mockResolvedValue({ _id: "s1", status: "revoked", save: vi.fn() });

    await expect(approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin" }))).rejects.toThrow("not in pending status");
  });

  it("approves a course scholarship and enrolls the student", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    const result = await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(scholarship.status).toBe("active");
    expect(scholarship.approvedBy).toBe("super-1");
    expect(scholarship.approvedAt).toBeInstanceOf(Date);
    expect(scholarship.save).toHaveBeenCalled();

    // Should enroll student in course
    expect(course.studentsEnrolled).toHaveLength(1);
    expect(course.studentsEnrolled[0].toString()).toBe("u1");
    expect(course.save).toHaveBeenCalled();
    expect(student.enrolledCourses).toHaveLength(1);
    expect(student.enrolledCourses[0].toString()).toBe("c1");
    expect(student.save).toHaveBeenCalled();

    // Should send approval notification
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        type: "SCHOLARSHIP_APPROVED",
        title: expect.stringContaining("Approved"),
      })
    );

    expect(result).toEqual(scholarship);
  });

  it("approves an internship scholarship (no enrollment needed)", async () => {
    const scholarship = {
      _id: "s1",
      userId: "u1",
      type: "internship",
      itemId: "i1",
      itemTitle: "Internship 1",
      status: "pending",
      approvedAt: undefined,
      approvedBy: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
      userId: { toString: () => "u1" },
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    const result = await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(scholarship.status).toBe("active");
    expect(scholarship.approvedBy).toBe("super-1");
    expect(scholarship.save).toHaveBeenCalled();

    // Should send approval notification
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: "SCHOLARSHIP_APPROVED" })
    );

    expect(result).toEqual(scholarship);
  });

  it("logs approval activity via audit service", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const scholarship: Record<string, any> = {
      _id: "s1",
      id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    const { logActivity } = await import("../services/audit.service.js");
    expect(logActivity).toHaveBeenCalledWith(
      "super-1",
      "APPROVE_SCHOLARSHIP",
      "Scholarship",
      "s1",
      expect.stringContaining("Course 1")
    );
  });

  it("sends approval notification with correct title and link", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        type: "SCHOLARSHIP_APPROVED",
        title: "Scholarship Approved!",
        link: "/portal/student/courses/c1",
      })
    );
  });

  it("does not re-enroll student if already enrolled in course", async () => {
    const course = {
      _id: "c1",
      title: "Course 1",
      studentsEnrolled: ["u1"], // Already enrolled
      save: vi.fn(),
    };
    const student = {
      _id: "u1",
      username: "student1",
      enrolledCourses: ["c1"], // Already has course
      save: vi.fn(),
    };
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    // save should still be called (the scholarship status changed)
    expect(scholarship.save).toHaveBeenCalled();
    // But course and student save should NOT be called (nothing changed)
    expect(course.save).not.toHaveBeenCalled();
    expect(student.save).not.toHaveBeenCalled();
  });

  // --- Admin email notification tests ---

  it("sends approval email to the granting admin with correct details", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", fullName: "Student One", enrolledCourses: [], save: vi.fn() };
    const grantingAdmin = { _id: "admin-1", username: "grantoradmin", fullName: "Grantor Admin", email: "admin@example.com" };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      grantedBy: "admin-1",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    // Resolver calls User.findById 3 times for course + grantedBy:
    // 1) Course enrollment student lookup 2) Email admin lookup 3) Email student lookup
    // Use mockImplementation to route to correct response by ID
    mockUserFindById.mockImplementation((id: any) => {
      if (id === "admin-1") return Promise.resolve(grantingAdmin);
      return Promise.resolve(student);
    });

    await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(mockSendScholarshipApprovedToAdmin).toHaveBeenCalledWith(
      "admin@example.com",
      "Grantor Admin",
      "Student One",
      "Course 1",
      "course"
    );
  });

  it("does not fail when granting admin has no email", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const grantingAdmin = { _id: "admin-1", username: "grantoradmin", fullName: "Grantor Admin", email: null };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      grantedBy: "admin-1",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockImplementation((id: any) => {
      if (id === "admin-1") return Promise.resolve(grantingAdmin);
      return Promise.resolve(student);
    });

    await expect(
      approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }))
    ).resolves.toBeDefined();

    expect(mockSendScholarshipApprovedToAdmin).not.toHaveBeenCalled();
  });

  it("does not fail when scholarship has no granting admin (grantedBy is undefined)", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      // grantedBy intentionally omitted (super_admin granted directly)
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    await expect(
      approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }))
    ).resolves.toBeDefined();

    expect(mockSendScholarshipApprovedToAdmin).not.toHaveBeenCalled();
  });

  it("uses username fallback when admin has no fullName", async () => {
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    // fullName intentionally omitted — should fall back to username
    const grantingAdmin = { _id: "admin-1", username: "grantoradmin", email: "admin@example.com" };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      grantedBy: "admin-1",
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockImplementation((id: any) => {
      if (id === "admin-1") return Promise.resolve(grantingAdmin);
      return Promise.resolve(student);
    });

    await approveScholarship(_, { id: "s1" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(mockSendScholarshipApprovedToAdmin).toHaveBeenCalledWith(
      "admin@example.com",
      "grantoradmin",    // fallback to username
      "student1",        // fallback to student username
      "Course 1",
      "course"
    );
  });
});

// =============================================================================
// revokeScholarship — extended tests
// =============================================================================
describe("revokeScholarship", () => {
  const revokeScholarship = scholarshipResolvers.Mutation.revokeScholarship;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 'Not authorized' when no user in context", async () => {
    await expect(revokeScholarship(_, { id: "s1", reason: "Violation" }, {})).rejects.toThrow("Not authorized");
  });

  it("throws 'Not authorized' for student role", async () => {
    await expect(revokeScholarship(_, { id: "s1", reason: "Violation" }, makeContext({ role: "student" }))).rejects.toThrow("Not authorized");
  });

  it("throws if scholarship not found", async () => {
    mockScholarshipFindById.mockResolvedValue(null);

    await expect(revokeScholarship(_, { id: "nonexistent", reason: "Test" }, makeContext())).rejects.toThrow("Scholarship not found");
  });

  it("throws if scholarship is already revoked", async () => {
    mockScholarshipFindById.mockResolvedValue({
      _id: "s1",
      status: "revoked",
      save: vi.fn(),
    });

    await expect(revokeScholarship(_, { id: "s1", reason: "Test" }, makeContext())).rejects.toThrow("is not active or pending");
  });

  it("revokes an active scholarship successfully", async () => {
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1",
      type: "course",
      itemTitle: "Course 1",
      status: "active",
      revokedReason: undefined,
      revokedBy: undefined,
      revokedAt: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    const result = await revokeScholarship(_, { id: "s1", reason: "Policy violation" }, makeContext());

    expect(scholarship.status).toBe("revoked");
    expect(scholarship.revokedReason).toBe("Policy violation");
    expect(scholarship.revokedBy).toBe("admin-1");
    expect(scholarship.save).toHaveBeenCalled();

    // Should send notification
    expect(mockSendNotification).toHaveBeenCalled();

    expect(result).toEqual(scholarship);
  });

  it("revokes a pending scholarship successfully (reject)", async () => {
    const pendingScholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1",
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      revokedReason: undefined,
      revokedBy: undefined,
      revokedAt: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(pendingScholarship);

    const result = await revokeScholarship(_, { id: "s1", reason: "Does not meet eligibility criteria" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(pendingScholarship.status).toBe("revoked");
    expect(pendingScholarship.revokedReason).toBe("Does not meet eligibility criteria");
    expect(pendingScholarship.revokedBy).toBe("super-1");
    expect(pendingScholarship.save).toHaveBeenCalled();

    // Should send notification about revocation
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: "SCHOLARSHIP_REVOKED" })
    );

    expect(result).toEqual(pendingScholarship);
  });

  it("allows both admin and super_admin to revoke", async () => {
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1", type: "course", itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    // Admin can revoke
    await revokeScholarship(_, { id: "s1", reason: "Admin rejected" }, makeContext({ role: "admin" }));
    expect(scholarship.status).toBe("revoked");

    // Reset for next test
    scholarship.status = "pending";

    // Super admin can revoke
    await revokeScholarship(_, { id: "s1", reason: "Super admin rejected" }, makeContext({ role: "super_admin" }));
    expect(scholarship.status).toBe("revoked");
  });

  it("logs revocation activity via audit service", async () => {
    const scholarship: Record<string, any> = {
      _id: "s1",
      id: "s1",
      userId: "u1", type: "course", itemTitle: "Course 1",
      status: "active",
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    await revokeScholarship(_, { id: "s1", reason: "Policy violation" }, makeContext());

    const { logActivity } = await import("../services/audit.service.js");
    expect(logActivity).toHaveBeenCalledWith(
      "admin-1",
      "REVOKE_SCHOLARSHIP",
      "Scholarship",
      "s1",
      expect.stringContaining("Policy violation")
    );
  });

  it("sends revocation notification with correct type for pending scholarships (reject)", async () => {
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1", type: "course", itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    await revokeScholarship(_, { id: "s1", reason: "Does not meet criteria" }, makeContext({ role: "super_admin" }));

    // Notification should be SCHOLARSHIP_REVOKED regardless of previous status
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        type: "SCHOLARSHIP_REVOKED",
        title: "Scholarship Revoked",
        message: expect.stringContaining("Does not meet criteria"),
      })
    );
  });

  it("works with empty reason string", async () => {
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1", type: "course", itemTitle: "Course 1",
      status: "pending",
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    await revokeScholarship(_, { id: "s1", reason: "" }, makeContext({ role: "admin" }));

    expect(scholarship.status).toBe("revoked");
    expect(scholarship.revokedReason).toBe("");
    expect(scholarship.save).toHaveBeenCalled();
  });

  it("stores revocation details correctly (timestamp and admin ID)", async () => {
    const before = Date.now();
    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: "u1", type: "course", itemTitle: "Course 1",
      status: "active",
      revokedAt: undefined,
      revokedBy: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);

    await revokeScholarship(_, { id: "s1", reason: "Policy violation" }, makeContext({ role: "super_admin", id: "super-1" }));

    expect(scholarship.status).toBe("revoked");
    expect(scholarship.revokedBy).toBe("super-1");
    expect(scholarship.revokedAt).toBeInstanceOf(Date);
    expect(scholarship.revokedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(scholarship.revokedReason).toBe("Policy violation");
  });
});

// =============================================================================
// Approval Workflow: grant → reject → re-grant → approve
// =============================================================================
describe("approval workflow (grant → reject → re-grant → approve)", () => {
  const grantScholarship = scholarshipResolvers.Mutation.grantScholarship;
  const approveScholarship = scholarshipResolvers.Mutation.approveScholarship;
  const revokeScholarship = scholarshipResolvers.Mutation.revokeScholarship;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes full lifecycle: admin grants (pending) → rejects → re-grants → super admin approves", async () => {
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };

    // ── Phase 1: Admin grants → status 'pending' ──
    const pendingScholarship = {
      _id: "s1", userId: "u1", grantedBy: "admin-1", type: "course",
      itemId: "c1", itemTitle: "Course 1", status: "pending", reason: "Merit",
      approvedAt: undefined, approvedBy: undefined,
      revokedAt: undefined, revokedBy: undefined, revokedReason: undefined,
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockUserFindById.mockResolvedValue(student);
    mockCourseFindById.mockResolvedValue(course);

    const { Scholarship } = await import("../models/Scholarship.js");
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(pendingScholarship);

    // Mock grant
    await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1", reason: "Merit" },
      makeContext({ role: "admin" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );

    // ── Phase 2: Super admin rejects (revokes) the pending scholarship ──
    const revokedPending: Record<string, any> = {
      _id: "s1", userId: "u1", type: "course",
      itemId: "c1", itemTitle: "Course 1", status: "pending",
      revokedAt: undefined, revokedBy: undefined, revokedReason: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s1",
    };

    mockScholarshipFindById.mockResolvedValue(revokedPending);

    await revokeScholarship(
      _,
      { id: "s1", reason: "Does not meet eligibility criteria" },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(revokedPending.status).toBe("revoked");
    expect(revokedPending.revokedBy).toBe("super-1");
    expect(revokedPending.revokedReason).toBe("Does not meet eligibility criteria");

    // ── Phase 3: Admin re-grants (now the revoked scholarship doesn't block) ──
    const reGrantedScholarship = {
      _id: "s2", userId: "u1", grantedBy: "admin-1", type: "course",
      itemId: "c1", itemTitle: "Course 1", status: "pending", reason: "Merit - second attempt",
      approvedAt: undefined, approvedBy: undefined,
      createdAt: new Date(), updatedAt: new Date(), toObject: () => ({}),
      save: vi.fn().mockResolvedValue(undefined),
      toString: () => "s2",
    };

    // Scholarship.findOne should return null again (previous was revoked, not active/pending)
    vi.mocked(Scholarship.findOne).mockReturnValue(mockFindOneResult(null));
    mockScholarshipCreate.mockResolvedValue(reGrantedScholarship);

    await grantScholarship(
      _,
      { userId: "u1", type: "course", itemId: "c1", itemTitle: "Course 1", reason: "Merit - second attempt" },
      makeContext({ role: "admin" })
    );

    expect(mockScholarshipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" })
    );

    // ── Phase 4: Super admin approves ──
    const finalScholarship: Record<string, any> = {
      _id: "s2",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      approvedAt: undefined, approvedBy: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };

    // Course and student have not been enrolled yet since it was always pending
    const freshCourse = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const freshStudent = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };

    mockScholarshipFindById.mockResolvedValue(finalScholarship);
    mockCourseFindById.mockResolvedValue(freshCourse);
    mockUserFindById.mockResolvedValue(freshStudent);

    const result = await approveScholarship(
      _,
      { id: "s2" },
      makeContext({ role: "super_admin", id: "super-2" })
    );

    expect(finalScholarship.status).toBe("active");
    expect(finalScholarship.approvedBy).toBe("super-2");
    expect(finalScholarship.approvedAt).toBeInstanceOf(Date);

    // Verify enrollment happened on approval
    expect(freshCourse.studentsEnrolled).toHaveLength(1);
    expect(freshCourse.studentsEnrolled[0].toString()).toBe("u1");
    expect(freshCourse.save).toHaveBeenCalled();
    expect(freshStudent.enrolledCourses).toHaveLength(1);
    expect(freshStudent.enrolledCourses[0].toString()).toBe("c1");
    expect(freshStudent.save).toHaveBeenCalled();

    // Verify approval notification
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: "SCHOLARSHIP_APPROVED" })
    );

    expect(result).toEqual(finalScholarship);
  });

  it("allows super admin to directly approve a newly granted scholarship without first rejecting", async () => {
    // Simulate: admin grants (pending), super admin approves directly
    const course = { _id: "c1", title: "Course 1", studentsEnrolled: [], save: vi.fn() };
    const student = { _id: "u1", username: "student1", enrolledCourses: [], save: vi.fn() };

    const scholarship: Record<string, any> = {
      _id: "s1",
      userId: { toString: () => "u1", _id: "u1" },
      itemId: { toString: () => "c1", _id: "c1" },
      type: "course",
      itemTitle: "Course 1",
      status: "pending",
      approvedAt: undefined, approvedBy: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockScholarshipFindById.mockResolvedValue(scholarship);
    mockCourseFindById.mockResolvedValue(course);
    mockUserFindById.mockResolvedValue(student);

    const result = await approveScholarship(
      _,
      { id: "s1" },
      makeContext({ role: "super_admin", id: "super-1" })
    );

    expect(scholarship.status).toBe("active");
    expect(scholarship.approvedBy).toBe("super-1");
    expect(course.studentsEnrolled).toHaveLength(1);
    expect(student.enrolledCourses).toHaveLength(1);
    expect(mockSendNotification).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: "SCHOLARSHIP_APPROVED" })
    );
    expect(result).toEqual(scholarship);
  });
});

// =============================================================================
// Scholarship Field Resolvers
// =============================================================================
describe("Scholarship field resolvers", () => {
  const fieldResolvers = scholarshipResolvers.Scholarship;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("user", () => {
    it("returns null when userId is missing", async () => {
      const result = await fieldResolvers.user({});
      expect(result).toBeNull();
    });

    it("returns already-populated user object directly", async () => {
      const populatedUser = { _id: "u1", username: "student1", fullName: "Student One" };
      const result = await fieldResolvers.user({ userId: populatedUser });
      expect(result).toEqual(populatedUser);
      expect(mockUserFindById).not.toHaveBeenCalled();
    });

    it("fetches user by ID when userId is a string", async () => {
      const mockUser = { _id: "u1", username: "student1", fullName: "Student One" };
      mockUserFindById.mockResolvedValue(mockUser);

      const result = await fieldResolvers.user({ userId: "u1" });
      expect(mockUserFindById).toHaveBeenCalledWith("u1");
      expect(result).toEqual(mockUser);
    });

    it("returns null when user not found in database", async () => {
      mockUserFindById.mockResolvedValue(null);

      const result = await fieldResolvers.user({ userId: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("grantedByUser", () => {
    it("returns null when grantedBy is missing", async () => {
      const result = await fieldResolvers.grantedByUser({});
      expect(result).toBeNull();
    });

    it("returns already-populated admin object directly", async () => {
      const populatedAdmin = { _id: "admin-1", username: "admin", fullName: "Admin User" };
      const result = await fieldResolvers.grantedByUser({ grantedBy: populatedAdmin });
      expect(result).toEqual(populatedAdmin);
      expect(mockUserFindById).not.toHaveBeenCalled();
    });

    it("fetches admin by ID when grantedBy is a string", async () => {
      const mockAdmin = { _id: "admin-1", username: "admin", fullName: "Admin User" };
      mockUserFindById.mockResolvedValue(mockAdmin);

      const result = await fieldResolvers.grantedByUser({ grantedBy: "admin-1" });
      expect(mockUserFindById).toHaveBeenCalledWith("admin-1");
      expect(result).toEqual(mockAdmin);
    });
  });

  describe("approvedByUser", () => {
    it("returns null when approvedBy is missing", async () => {
      const result = await fieldResolvers.approvedByUser({});
      expect(result).toBeNull();
    });

    it("returns already-populated approver object directly", async () => {
      const populatedApprover = { _id: "super-1", username: "superadmin", fullName: "Super Admin" };
      const result = await fieldResolvers.approvedByUser({ approvedBy: populatedApprover });
      expect(result).toEqual(populatedApprover);
      expect(mockUserFindById).not.toHaveBeenCalled();
    });

    it("fetches approver by ID when approvedBy is a string", async () => {
      const mockApprover = { _id: "super-1", username: "superadmin", fullName: "Super Admin" };
      mockUserFindById.mockResolvedValue(mockApprover);

      const result = await fieldResolvers.approvedByUser({ approvedBy: "super-1" });
      expect(mockUserFindById).toHaveBeenCalledWith("super-1");
      expect(result).toEqual(mockApprover);
    });
  });

  describe("revokedByUser", () => {
    it("returns null when revokedBy is missing", async () => {
      const result = await fieldResolvers.revokedByUser({});
      expect(result).toBeNull();
    });

    it("returns already-populated revoker object directly", async () => {
      const populatedRevoker = { _id: "admin-1", username: "admin", fullName: "Admin User" };
      const result = await fieldResolvers.revokedByUser({ revokedBy: populatedRevoker });
      expect(result).toEqual(populatedRevoker);
      expect(mockUserFindById).not.toHaveBeenCalled();
    });

    it("fetches revoker by ID when revokedBy is a string", async () => {
      const mockRevoker = { _id: "admin-1", username: "admin" };
      mockUserFindById.mockResolvedValue(mockRevoker);

      const result = await fieldResolvers.revokedByUser({ revokedBy: "admin-1" });
      expect(mockUserFindById).toHaveBeenCalledWith("admin-1");
      expect(result).toEqual(mockRevoker);
    });
  });
});
