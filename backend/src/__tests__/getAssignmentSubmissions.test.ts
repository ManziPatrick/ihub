import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Build mock factories using vi.hoisted() so they survive the vi.mock hoisting
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Build ALL mock variables inside a single vi.hoisted() block so they are
// available when vi.mock factory functions are hoisted to the top of the file.
// ---------------------------------------------------------------------------
const {
  mockDistinct,
  mockCourseFind,
  mockSubmissionFind,
  mockCountDocuments,
  mockAdminAudit,
} = vi.hoisted(() => {
  const d = vi.fn();
  const cFind = vi.fn(() => ({ distinct: d }));

  /**
   * Build a query-chain mock that supports infinite
   * .sort().skip().limit().populate() chaining.
   * The chain is also thenable so Promise.all can await it, and it resolves
   * to an empty array so the resolver's `.map()` works.
   */
  const makeSubmissionFind = () => {
    const result = Promise.resolve([] as any[]);
    const chain: Record<string, any> = {
      sort: vi.fn(() => chain),
      skip: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      populate: vi.fn(() => chain),
      then: result.then.bind(result),
      catch: result.catch.bind(result),
    };
    return chain;
  };

  const countDocs = vi.fn(() => Promise.resolve(0));

  const audit = {
    logAdminCrossAccess: vi.fn(),
    getAdminAuditLogs: vi.fn(),
  };

  return {
    mockDistinct: d,
    mockCourseFind: cFind,
    mockSubmissionFind: vi.fn(makeSubmissionFind),
    mockCountDocuments: countDocs,
    mockAdminAudit: audit,
  };
});

// ---- Hoisted vi.mock calls -------------------------------------------------
vi.mock("../models/Course", () => ({
  Course: {
    find: mockCourseFind,
  },
}));

vi.mock("../models/AssignmentSubmission", () => ({
  AssignmentSubmission: {
    find: mockSubmissionFind,
    countDocuments: mockCountDocuments,
  },
}));

vi.mock("../services/admin-audit.service", () => mockAdminAudit);

// ---------------------------------------------------------------------------
// Import the resolver AFTER mocks are set up
// ---------------------------------------------------------------------------
import { resolvers } from "../graphql/resolvers";

const getAssignmentSubmissions = resolvers.Query.getAssignmentSubmissions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** First argument of every GraphQL resolver (parent, unused). */
const _ = {};

function makeContext(overrides: Partial<{ id: string; username: string; role: string }> = {}) {
  return {
    user: {
      id: "user-1",
      username: "testuser",
      role: "admin",
      ...overrides,
    },
  };
}

const defaultArgs = { courseId: undefined, lessonId: undefined, page: 1, limit: 10 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getAssignmentSubmissions — scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: admin has no courses
    mockCourseFind.mockReturnValue({ distinct: mockDistinct });
    mockDistinct.mockResolvedValue([]);
  });

  // ---- 1. Unauthenticated ------------------------------------------------

  it("throws 'Unauthorized' when no user in context", async () => {
    await expect(getAssignmentSubmissions(_, defaultArgs, {})).rejects.toThrow("Unauthorized");
    await expect(getAssignmentSubmissions(_, defaultArgs, { user: null })).rejects.toThrow("Unauthorized");
  });

  // ---- 2. Student --------------------------------------------------------

  it("scopes a student to their own userId only", async () => {
    const ctx = makeContext({ id: "student-1", role: "student" });

    await expect(getAssignmentSubmissions(_, defaultArgs, ctx)).resolves.toBeDefined();

    // Course.find should NOT have been called for a student
    expect(mockCourseFind).not.toHaveBeenCalled();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter).toHaveProperty("userId", "student-1");
    // No courseId should be present
    expect(Object.prototype.hasOwnProperty.call(findFilter, "courseId")).toBe(false);
  });

  // ---- 3. Super_admin ----------------------------------------------------

  it("does NOT add a courseId filter for super_admin", async () => {
    const ctx = makeContext({ role: "super_admin" });

    await expect(getAssignmentSubmissions(_, defaultArgs, ctx)).resolves.toBeDefined();

    expect(mockCourseFind).not.toHaveBeenCalled();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(Object.prototype.hasOwnProperty.call(findFilter, "courseId")).toBe(false);
  });

  // ---- 4. Admin with NO courses ------------------------------------------

  it("scopes admin with no courses to { courseId: { $in: [] } }", async () => {
    mockDistinct.mockResolvedValue([]);

    const ctx = makeContext({ role: "admin" });

    await expect(getAssignmentSubmissions(_, defaultArgs, ctx)).resolves.toBeDefined();

    expect(mockCourseFind).toHaveBeenCalled();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter.courseId).toEqual({ $in: [] });
  });

  // ---- 5. Admin with courses (no courseId param) -------------------------

  it("scopes admin with courses to { courseId: { $in: [ownedIds] } }", async () => {
    mockDistinct.mockResolvedValue(["course-a", "course-b"]);

    const ctx = makeContext({ role: "admin" });

    await expect(getAssignmentSubmissions(_, defaultArgs, ctx)).resolves.toBeDefined();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter.courseId).toEqual({ $in: ["course-a", "course-b"] });
  });

  // ---- 6. Admin with owned courseId passed in ----------------------------

  it("passes the exact courseId when admin requests a course they own", async () => {
    mockDistinct.mockResolvedValue(["course-1"]);

    const ctx = makeContext({ role: "admin" });

    await expect(
      getAssignmentSubmissions(_, { ...defaultArgs, courseId: "course-1" }, ctx)
    ).resolves.toBeDefined();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter.courseId).toBe("course-1");
  });

  // ---- 7. Admin with unowned courseId ------------------------------------

  it("throws when admin passes a courseId they do not own", async () => {
    mockDistinct.mockResolvedValue(["course-1", "course-2"]);

    const ctx = makeContext({ role: "admin" });

    await expect(
      getAssignmentSubmissions(_, { ...defaultArgs, courseId: "course-3" }, ctx)
    ).rejects.toThrow("Unauthorized access to this course");
  });

  // ---- 8. Trainer --------------------------------------------------------

  it("scopes a trainer by their courses (same as admin)", async () => {
    mockDistinct.mockResolvedValue(["trainer-course"]);

    const ctx = makeContext({ role: "trainer" });

    await expect(getAssignmentSubmissions(_, defaultArgs, ctx)).resolves.toBeDefined();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter.courseId).toEqual({ $in: ["trainer-course"] });
  });

  // ---- 9. lessonId passthrough -------------------------------------------

  it("preserves lessonId in the filter for all roles", async () => {
    const ctx = makeContext({ role: "super_admin" });

    await expect(
      getAssignmentSubmissions(_, { ...defaultArgs, lessonId: "lesson-42" }, ctx)
    ).resolves.toBeDefined();

    const findFilter = mockSubmissionFind.mock.calls[0][0];
    expect(findFilter.lessonId).toBe("lesson-42");
  });

  // ---- 10. Admin audit logging -------------------------------------------

  it("triggers audit logging when admin accesses without courseId (isCrossAdmin=true)", async () => {
    mockDistinct.mockResolvedValue(["c1", "c2"]);

    const { logAdminCrossAccess } = await import("../services/admin-audit.service");

    const ctx = makeContext({ role: "admin" });

    await getAssignmentSubmissions(_, defaultArgs, ctx);

    expect(logAdminCrossAccess).toHaveBeenCalledWith(
      "user-1",
      "testuser",
      "getAssignmentSubmissions",
      "AssignmentSubmission",
      expect.stringContaining("scoped to their 2 courses"),
      0,
      true // isCrossAdmin === !courseId → true
    );
  });

  it("triggers audit logging with isCrossAdmin=false when a courseId is provided", async () => {
    mockDistinct.mockResolvedValue(["c1"]);

    const { logAdminCrossAccess } = await import("../services/admin-audit.service");

    const ctx = makeContext({ role: "admin" });

    await getAssignmentSubmissions(_, { ...defaultArgs, courseId: "c1" }, ctx);

    expect(logAdminCrossAccess).toHaveBeenCalledWith(
      "user-1",
      "testuser",
      "getAssignmentSubmissions",
      "AssignmentSubmission",
      expect.any(String),
      0,
      false // isCrossAdmin === !courseId → false
    );
  });

  it("does NOT audit log for trainer role", async () => {
    mockDistinct.mockResolvedValue(["c1"]);

    const { logAdminCrossAccess } = await import("../services/admin-audit.service");

    const ctx = makeContext({ role: "trainer" });

    await getAssignmentSubmissions(_, defaultArgs, ctx);

    expect(logAdminCrossAccess).not.toHaveBeenCalled();
  });

  // ---- 11. countDocuments receives the same scoped filter ----------------

  it("passes the same scoped filter to countDocuments", async () => {
    mockDistinct.mockResolvedValue(["c1"]);

    const ctx = makeContext({ role: "admin" });

    await getAssignmentSubmissions(_, defaultArgs, ctx);

    // The resolver passes the SAME `filter` to both .find() and .countDocuments()
    const findFilter = mockSubmissionFind.mock.calls[0][0];
    const countFilter = mockCountDocuments.mock.calls[0][0];
    expect(countFilter).toEqual(findFilter);
  });
});
