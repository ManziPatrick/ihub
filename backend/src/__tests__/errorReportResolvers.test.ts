import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockFind,
  mockFindById,
  mockFindOne,
  mockFindByIdAndDelete,
  mockCountDocuments,
  mockAggregate,
  mockSave,
  mockPopulate,
  mockLean,
  mockSort,
  mockSkip,
  mockLimit,
  mockLogActivity,
} = vi.hoisted(() => {
  const save = vi.fn().mockResolvedValue(undefined);
  const populateReturn = { lean: vi.fn() };
  const leanReturn = {};
  const chain: any = {
    sort: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    populate: vi.fn(() => populateReturn),
    then: (resolve: (v: any) => any) => Promise.resolve([]).then(resolve),
    catch: (reject: (e: any) => any) => Promise.resolve([]).then(undefined, reject),
  };
  populateReturn.lean = vi.fn(() => leanReturn);

  return {
    mockFind: vi.fn(() => chain),
    mockFindById: vi.fn(),
    mockFindOne: vi.fn(),
    mockFindByIdAndDelete: vi.fn(),
    mockCountDocuments: vi.fn().mockResolvedValue(0),
    mockAggregate: vi.fn().mockResolvedValue([]),
    mockSave: save,
    mockPopulate: vi.fn(() => populateReturn),
    mockLean: vi.fn(() => leanReturn),
    mockSort: vi.fn(() => chain),
    mockSkip: vi.fn(() => chain),
    mockLimit: vi.fn(() => chain),
    mockLogActivity: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
const mockModel: any = vi.hoisted(() => {
  const model: any = vi.fn(function(data?: any) {
    // Return a mock document instance when called as constructor
    const doc: any = { ...data, save: vi.fn().mockResolvedValue(undefined) };
    return doc;
  });
  model.find = (...args: any[]) => (mockFind as any)(...args);
  model.findById = (id: string) => mockFindById(id);
  model.findOne = (filter: any) => mockFindOne(filter);
  model.findByIdAndDelete = (id: string) => mockFindByIdAndDelete(id);
  model.countDocuments = (filter?: any) => mockCountDocuments(filter);
  model.aggregate = (pipeline: any[]) => mockAggregate(pipeline);
  return model;
});

vi.mock("../models/UserErrorReport", () => ({
  default: mockModel,
}));

vi.mock("../services/audit.service", () => ({
  logActivity: (...args: any[]) => mockLogActivity(...args),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { errorReportResolvers } from "../graphql/error-reporting-resolvers";

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

// =============================================================================
// Helper: Test the internal helper functions via their observable outputs
// =============================================================================
describe("internal helpers", () => {
  describe("createFingerprint", () => {
    // We access the function's behavior by calling reportClientError
    // and checking what's saved. But we can also just test the fingerprint
    // logic by observing dedup behavior.

    it("produces the same fingerprint for identical errors", async () => {
      vi.clearAllMocks();

      const input = {
        errorType: "graphql",
        message: "Cannot read property 'foo' of undefined",
        componentName: "UserDashboard",
        operationName: "GetUsers",
        statusCode: 500,
        context: { url: "https://example.com", userAgent: "Mozilla/5.0 Chrome/120" },
      };

      // First call: no existing → creates new
      mockFindOne.mockResolvedValue(null);
      await errorReportResolvers.Mutation.reportClientError(_, { input }, makeContext());

      // Second call: same fingerprint → finds existing → increments count
      const existingDoc = {
        _id: "report-1",
        occurrenceCount: 1,
        severity: "medium",
        save: vi.fn().mockResolvedValue(undefined),
      };
      mockFindOne.mockResolvedValue(existingDoc);
      await errorReportResolvers.Mutation.reportClientError(_, { input }, makeContext());

      expect(existingDoc.occurrenceCount).toBe(2);
      expect(existingDoc.save).toHaveBeenCalled();
    });

    it("treats different messages as different fingerprints", async () => {
      vi.clearAllMocks();

      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "graphql", message: "Error A" } }, makeContext()
      );

      expect(mockFindOne).toHaveBeenCalledTimes(1);

      // The doc should have been created once
      expect(mockModel).toHaveBeenCalledTimes(1);

      // Reset for second call
      vi.mocked(mockModel).mockClear();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "graphql", message: "Error B" } }, makeContext()
      );

      // Should create a new doc (different fingerprint)
      expect(mockModel).toHaveBeenCalledTimes(1);
    });
  });

  describe("inferSeverity", () => {
    it("classifies payment errors as critical", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "payment", message: "Payment failed" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "critical" })
      );
    });

    it("classifies auth errors as critical", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "auth", message: "Login failed" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "critical" })
      );
    });

    it("classifies 500 errors as critical", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "graphql", message: "Internal error", statusCode: 500 } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "critical" })
      );
    });

    it("classifies network errors as high", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "network", message: "Network timeout" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "high" })
      );
    });

    it("classifies runtime errors as high", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "runtime", message: "Cannot read property" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "high" })
      );
    });

    it("classifies graphql errors as medium", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "graphql", message: "Field not found" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "medium" })
      );
    });

    it("classifies 400 errors as medium", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "graphql", message: "Bad request", statusCode: 400 } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "medium" })
      );
    });

    it("classifies unknown errors as low", async () => {
      vi.clearAllMocks();
      mockFindOne.mockResolvedValue(null);

      await errorReportResolvers.Mutation.reportClientError(
        _, { input: { errorType: "unknown", message: "Something happened" } }, makeContext()
      );

      expect(mockModel).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "low" })
      );
    });
  });
});

// =============================================================================
// getErrorReports
// =============================================================================
describe("getErrorReports", () => {
  const getErrorReports = errorReportResolvers.Query.getErrorReports;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(getErrorReports(_, {}, {})).rejects.toThrow("Unauthorized");
    await expect(getErrorReports(_, {}, { user: null })).rejects.toThrow("Unauthorized");
  });

  it("throws for student role", async () => {
    await expect(getErrorReports(_, {}, makeContext({ role: "student" }))).rejects.toThrow("Unauthorized");
  });

  it("throws for trainer role", async () => {
    await expect(getErrorReports(_, {}, makeContext({ role: "trainer" }))).rejects.toThrow("Unauthorized");
  });

  it("allows admin role", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
      catch: (reject: any) => Promise.resolve([]).then(undefined, reject),
    });
    mockCountDocuments.mockResolvedValue(0);

    const result = await getErrorReports(_, { page: 1, limit: 10 }, makeContext({ role: "admin" }));
    expect(result.items).toEqual([]);
    expect(result.pagination.totalCount).toBe(0);
  });

  it("allows super_admin role", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: "r1", message: "Test" }]),
      then: (resolve: any) => Promise.resolve([{ _id: "r1", message: "Test" }]).then(resolve),
      catch: (reject: any) => Promise.resolve([]).then(undefined, reject),
    });
    mockCountDocuments.mockResolvedValue(1);

    const result = await getErrorReports(_, { page: 1, limit: 10 }, makeContext({ role: "super_admin" }));
    expect(result.items).toHaveLength(1);
  });

  it("returns paginated results", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: "r1" }, { _id: "r2" }]),
      then: (resolve: any) => Promise.resolve([{ _id: "r1" }, { _id: "r2" }]).then(resolve),
      catch: (reject: any) => Promise.resolve([]).then(undefined, reject),
    });
    mockCountDocuments.mockResolvedValue(25);

    const result = await getErrorReports(_, { page: 1, limit: 10 }, makeContext());

    expect(result.items).toHaveLength(2);
    expect(result.pagination.totalCount).toBe(25);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.currentPage).toBe(1);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPreviousPage).toBe(false);
  });

  it("filters by status", async () => {
    await getErrorReports(_, { page: 1, limit: 10, status: "open" }, makeContext());
    expect(mockCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ status: "open" }));
  });

  it("filters by errorType", async () => {
    await getErrorReports(_, { page: 1, limit: 10, errorType: "graphql" }, makeContext());
    expect(mockCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ errorType: "graphql" }));
  });

  it("filters by severity", async () => {
    await getErrorReports(_, { page: 1, limit: 10, severity: "critical" }, makeContext());
    expect(mockCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ severity: "critical" }));
  });

  it("filters by componentName", async () => {
    await getErrorReports(_, { page: 1, limit: 10, componentName: "UserDashboard" }, makeContext());
    expect(mockCountDocuments).toHaveBeenCalledWith(expect.objectContaining({ componentName: "UserDashboard" }));
  });

  it("performs text search across multiple fields", async () => {
    await getErrorReports(_, { page: 1, limit: 10, search: "payment failed" }, makeContext());

    const filter = mockCountDocuments.mock.calls[0][0];
    expect(filter.$or).toBeDefined();
    expect(filter.$or).toHaveLength(4);
    expect(filter.$or[0]).toEqual({ message: { $regex: "payment failed", $options: "i" } });
  });

  it("caps limit at 100", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
      catch: (reject: any) => Promise.resolve([]).then(undefined, reject),
    });
    mockCountDocuments.mockResolvedValue(0);

    await getErrorReports(_, { page: 1, limit: 500 }, makeContext());

    // The resolver should cap at 100
    const chain = mockFind.mock.results[0].value;
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it("defaults to page 1 and limit 50 when not provided", async () => {
    mockFind.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
      then: (resolve: any) => Promise.resolve([]).then(resolve),
      catch: (reject: any) => Promise.resolve([]).then(undefined, reject),
    });
    mockCountDocuments.mockResolvedValue(0);

    await getErrorReports(_, {}, makeContext());

    const chain = mockFind.mock.results[0].value;
    expect(chain.skip).toHaveBeenCalledWith(0); // (1-1) * 50
    expect(chain.limit).toHaveBeenCalledWith(50);
  });
});

// =============================================================================
// getErrorReport
// =============================================================================
describe("getErrorReport", () => {
  const getErrorReport = errorReportResolvers.Query.getErrorReport;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(getErrorReport(_, { id: "r1" }, {})).rejects.toThrow("Unauthorized");
  });

  it("returns a single error report by ID", async () => {
    const mockReport = { _id: "r1", message: "Test error" };
    const populateResult = { lean: vi.fn().mockResolvedValue(mockReport) };
    mockFindById.mockReturnValue({ populate: vi.fn(() => populateResult) });

    const result = await getErrorReport(_, { id: "r1" }, makeContext());
    expect(mockFindById).toHaveBeenCalledWith("r1");
    expect(result).toEqual(mockReport);
  });
});

// =============================================================================
// getErrorReportStats
// =============================================================================
describe("getErrorReportStats", () => {
  const getErrorReportStats = errorReportResolvers.Query.getErrorReportStats;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(getErrorReportStats(_, {}, {})).rejects.toThrow("Unauthorized");
  });

  it("returns comprehensive stats", async () => {
    // countDocuments mocks: total, open, investigating, resolved, dismissed, critical, high, medium, low
    mockCountDocuments
      .mockResolvedValueOnce(100)   // total
      .mockResolvedValueOnce(40)    // open
      .mockResolvedValueOnce(10)    // investigating
      .mockResolvedValueOnce(30)    // resolved
      .mockResolvedValueOnce(20)    // dismissed
      .mockResolvedValueOnce(5)     // critical
      .mockResolvedValueOnce(15)    // high
      .mockResolvedValueOnce(30)    // medium
      .mockResolvedValueOnce(50);   // low

    // aggregate mocks: byType, byComponent
    mockAggregate
      .mockResolvedValueOnce([
        { _id: "graphql", count: 50 },
        { _id: "network", count: 25 },
        { _id: "runtime", count: 15 },
      ])
      .mockResolvedValueOnce([
        { _id: "UserDashboard", count: 20 },
        { _id: "PaymentForm", count: 10 },
      ]);

    const result = await getErrorReportStats(_, {}, makeContext({ role: "super_admin" }));

    expect(result.total).toBe(100);
    expect(result.open).toBe(40);
    expect(result.investigating).toBe(10);
    expect(result.resolved).toBe(30);
    expect(result.dismissed).toBe(20);
    expect(result.critical).toBe(5);
    expect(result.high).toBe(15);
    expect(result.medium).toBe(30);
    expect(result.low).toBe(50);

    expect(result.byType).toEqual([
      { errorType: "graphql", count: 50 },
      { errorType: "network", count: 25 },
      { errorType: "runtime", count: 15 },
    ]);

    expect(result.byComponent).toEqual([
      { componentName: "UserDashboard", count: 20 },
      { componentName: "PaymentForm", count: 10 },
    ]);
  });

  it("handles empty stats gracefully", async () => {
    mockCountDocuments.mockResolvedValue(0);
    mockAggregate.mockResolvedValue([]);

    const result = await getErrorReportStats(_, {}, makeContext({ role: "super_admin" }));

    expect(result.total).toBe(0);
    expect(result.open).toBe(0);
    expect(result.byType).toEqual([]);
    expect(result.byComponent).toEqual([]);
  });
});

// =============================================================================
// reportClientError
// =============================================================================
describe("reportClientError", () => {
  const reportClientError = errorReportResolvers.Mutation.reportClientError;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows unauthenticated users to report errors", async () => {
    mockFindOne.mockResolvedValue(null);

    const result = await reportClientError(
      _, { input: { errorType: "graphql", message: "Test error" } }, {}
    );

    expect(result).toBe(true);
    expect(mockModel).toHaveBeenCalled();
  });

  it("creates a new error report with correct fields", async () => {
    mockFindOne.mockResolvedValue(null);

    const input = {
      errorType: "graphql",
      message: "Cannot query field 'foo' on type 'Bar'",
      stack: "Error: ...\n    at Query.getFoo (resolvers.ts:123)",
      componentName: "UserDashboard",
      operationName: "GetUsers",
      statusCode: 400,
      context: {
        url: "https://example.com/users",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
      },
    };

    await reportClientError(_, { input }, makeContext({ id: "user-1", username: "testuser", role: "student" }));

    expect(mockModel).toHaveBeenCalledWith({
      userId: "user-1",
      username: "testuser",
      errorType: "graphql",
      severity: "medium",
      message: "Cannot query field 'foo' on type 'Bar'",
      stack: "Error: ...\n    at Query.getFoo (resolvers.ts:123)",
      componentName: "UserDashboard",
      operationName: "GetUsers",
      statusCode: 400,
      url: "https://example.com/users",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
      browserInfo: { name: "Chrome", version: "120.0.0.0", os: "macOS", mobile: false },
      context: input.context,
      fingerprint: expect.any(String),
    });
  });

  it("stores mobile browser info correctly", async () => {
    mockFindOne.mockResolvedValue(null);

    await reportClientError(
      _,
      {
        input: {
          errorType: "network",
          message: "Failed to fetch",
          context: {
            userAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
          },
        },
      },
      makeContext()
    );

    expect(mockModel).toHaveBeenCalledWith(
      expect.objectContaining({
        browserInfo: expect.objectContaining({
          name: "Chrome",
          os: "Android",
          mobile: true,
        }),
      })
    );
  });

  it("detects Firefox user agent", async () => {
    mockFindOne.mockResolvedValue(null);

    await reportClientError(
      _,
      {
        input: {
          errorType: "runtime",
          message: "Firefox error",
          context: {
            userAgent: "Mozilla/5.0 (Windows NT 10.0; rv:120.0) Gecko/20100101 Firefox/120.0",
          },
        },
      },
      makeContext()
    );

    expect(mockModel).toHaveBeenCalledWith(
      expect.objectContaining({
        browserInfo: expect.objectContaining({ name: "Firefox", os: "Windows", mobile: false }),
      })
    );
  });

  it("maps context.userAgent to userAgent and browserInfo", async () => {
    mockFindOne.mockResolvedValue(null);

    await reportClientError(
      _,
      {
        input: {
          errorType: "graphql",
          message: "Test",
          context: { userAgent: "Mozilla/5.0 Chrome/120", url: "https://example.com" },
        },
      },
      {}
    );

    expect(mockModel).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: "Mozilla/5.0 Chrome/120",
        browserInfo: expect.objectContaining({ name: "Chrome" }),
        url: "https://example.com",
      })
    );
  });

  it("truncates long messages to 2000 chars", async () => {
    mockFindOne.mockResolvedValue(null);
    const longMessage = "x".repeat(3000);

    await reportClientError(
      _, { input: { errorType: "graphql", message: longMessage } }, {}
    );

    expect(mockModel).toHaveBeenCalledWith(
      expect.objectContaining({
        message: longMessage.substring(0, 2000),
      })
    );
  });

  it("truncates long stack traces to 5000 chars", async () => {
    mockFindOne.mockResolvedValue(null);
    const longStack = "x".repeat(6000);

    await reportClientError(
      _, { input: { errorType: "runtime", message: "Error", stack: longStack } }, {}
    );

    expect(mockModel).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: longStack.substring(0, 5000),
      })
    );
  });

  it("handles duplicate errors within 1 hour by incrementing count", async () => {
    const existingDoc = {
      _id: "report-1",
      occurrenceCount: 3,
      severity: "medium",
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(existingDoc);

    const result = await reportClientError(
      _, { input: { errorType: "graphql", message: "Same error" } }, {}
    );

    expect(result).toBe(true);
    expect(existingDoc.occurrenceCount).toBe(4);
    expect(existingDoc.save).toHaveBeenCalled();
    expect(mockModel).not.toHaveBeenCalled(); // No new document created
  });

  it("upgrades severity on duplicate if higher", async () => {
    const existingDoc = {
      _id: "report-1",
      occurrenceCount: 1,
      severity: "low",
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(existingDoc);

    await reportClientError(
      _, { input: { errorType: "runtime", message: "Same runtime error" } }, {}
    );

    // runtime = high severity, existing was low
    // Should upgrade to high
    expect(existingDoc.severity).toBe("high");
  });

  it("does not downgrade severity on duplicate", async () => {
    const existingDoc = {
      _id: "report-1",
      occurrenceCount: 1,
      severity: "critical",
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(existingDoc);

    await reportClientError(
      _, { input: { errorType: "graphql", message: "Same error" } }, {}
    );

    // graphql = medium severity, existing was critical
    // Should NOT downgrade
    expect(existingDoc.severity).toBe("critical");
  });

  it("creates new report when fingerprint is different even if old one exists", async () => {
    mockFindOne.mockResolvedValue(null); // No existing with this fingerprint

    await reportClientError(
      _, { input: { errorType: "graphql", message: "Brand new error" } }, {}
    );

    expect(mockModel).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// resolveErrorReport
// =============================================================================
describe("resolveErrorReport", () => {
  const resolveErrorReport = errorReportResolvers.Mutation.resolveErrorReport;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(resolveErrorReport(_, { id: "r1" }, {})).rejects.toThrow("Unauthorized");
  });

  it("throws for student role", async () => {
    await expect(resolveErrorReport(_, { id: "r1" }, makeContext({ role: "student" }))).rejects.toThrow("Unauthorized");
  });

  it("throws if report not found", async () => {
    mockFindById.mockResolvedValue(null);

    await expect(resolveErrorReport(_, { id: "nonexistent" }, makeContext())).rejects.toThrow("Error report not found");
  });

  it("marks report as resolved with resolution note", async () => {
    const report = {
      _id: "r1",
      status: "open",
      severity: "high",
      message: "Payment gateway timeout",
      resolvedBy: undefined,
      resolvedAt: undefined,
      resolution: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };
    mockFindById.mockResolvedValue(report);

    const result = await resolveErrorReport(
      _, { id: "r1", resolution: "Fixed payment gateway timeout" }, makeContext({ id: "admin-1", role: "admin" })
    );

    expect(report.status).toBe("resolved");
    expect(report.resolvedBy).toBe("admin-1");
    expect(report.resolvedAt).toBeInstanceOf(Date);
    expect(report.resolution).toBe("Fixed payment gateway timeout");
    expect(report.save).toHaveBeenCalled();
    expect(mockLogActivity).toHaveBeenCalledWith(
      "admin-1", "RESOLVE", "UserErrorReport", "r1",
      expect.stringContaining("Resolved error report: Payment gateway timeout")
    );
    expect(result).toEqual(report);
  });

  it("works without a resolution note", async () => {
    const report = {
      _id: "r1",
      status: "open",
      message: "Something",
      resolvedBy: undefined,
      resolvedAt: undefined,
      resolution: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };
    mockFindById.mockResolvedValue(report);

    await resolveErrorReport(_, { id: "r1" }, makeContext());

    expect(report.status).toBe("resolved");
    expect(report.resolution).toBeUndefined();
  });

  it("allows super_admin to resolve", async () => {
    const report = {
      _id: "r1",
      status: "open",
      message: "Test",
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };
    mockFindById.mockResolvedValue(report);

    await resolveErrorReport(_, { id: "r1" }, makeContext({ role: "super_admin" }));
    expect(report.status).toBe("resolved");
  });
});

// =============================================================================
// deleteErrorReport
// =============================================================================
describe("deleteErrorReport", () => {
  const deleteErrorReport = errorReportResolvers.Mutation.deleteErrorReport;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws for unauthenticated users", async () => {
    await expect(deleteErrorReport(_, { id: "r1" }, {})).rejects.toThrow("Unauthorized");
  });

  it("throws for student role", async () => {
    await expect(deleteErrorReport(_, { id: "r1" }, makeContext({ role: "student" }))).rejects.toThrow("Unauthorized");
  });

  it("throws if report not found", async () => {
    mockFindByIdAndDelete.mockResolvedValue(null);

    await expect(deleteErrorReport(_, { id: "nonexistent" }, makeContext())).rejects.toThrow("Error report not found");
  });

  it("deletes report and logs activity", async () => {
    mockFindByIdAndDelete.mockResolvedValue({ _id: "r1" });

    const result = await deleteErrorReport(_, { id: "r1" }, makeContext({ id: "admin-1", role: "super_admin" }));

    expect(result).toBe(true);
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("r1");
    expect(mockLogActivity).toHaveBeenCalledWith(
      "admin-1", "DELETE", "UserErrorReport", "r1", "Deleted error report"
    );
  });

  it("allows admin role to delete", async () => {
    mockFindByIdAndDelete.mockResolvedValue({ _id: "r1" });

    await deleteErrorReport(_, { id: "r1" }, makeContext({ role: "admin" }));
    expect(mockFindByIdAndDelete).toHaveBeenCalled();
  });
});
