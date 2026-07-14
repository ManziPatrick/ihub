/**
 * 🔗 Integration Tests — Full Error Reporting Lifecycle
 *
 * Tests the complete flow from a client reporting an error through
 * to a super admin resolving and deleting it. This verifies that
 * all the resolvers work together correctly.
 *
 * Flow under test:
 *   1. Client reports error → reportClientError creates a report
 *   2. Same error repeats → reportClientError increments occurrenceCount
 *   3. Super admin queries → getErrorReports returns paginated list
 *   4. Super admin views single → getErrorReport returns full details
 *   5. Super admin sees stats → getErrorReportStats shows correct counts
 *   6. Super admin resolves → resolveErrorReport marks as resolved
 *   7. Filtered query → getErrorReports(status: "resolved") works
 *   8. Super admin deletes → deleteErrorReport removes + audits
 */

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
  mockLogActivity,
} = vi.hoisted(() => {
  const find = vi.fn();
  const findById = vi.fn();
  const findOne = vi.fn();
  const findByIdAndDelete = vi.fn();
  const countDocuments = vi.fn().mockResolvedValue(0);
  const aggregate = vi.fn().mockResolvedValue([]);
  const logActivity = vi.fn();

  return {
    mockFind: find,
    mockFindById: findById,
    mockFindOne: findOne,
    mockFindByIdAndDelete: findByIdAndDelete,
    mockCountDocuments: countDocuments,
    mockAggregate: aggregate,
    mockLogActivity: logActivity,
  };
});

// ---------------------------------------------------------------------------
// Shared chain helper — used by mockFind, mockFindById, etc.
// ---------------------------------------------------------------------------
function makeLeanChain(resolveValue: any) {
  const populateResult = { lean: vi.fn().mockResolvedValue(resolveValue) };
  const chain: any = {
    sort: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    populate: vi.fn(() => populateResult),
    then: (resolve: (v: any) => any) => Promise.resolve(resolveValue).then(resolve),
    catch: (reject: (e: any) => any) => Promise.resolve(resolveValue).then(undefined, reject),
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
const mockModel: any = vi.hoisted(() => {
  const model: any = vi.fn(function (data?: any) {
    const doc: any = {
      ...data,
      _id: data?._id || `report-${Date.now()}`,
      status: data?.status || 'open',
      occurrenceCount: data?.occurrenceCount || 1,
      severity: data?.severity || 'medium',
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };
    return doc;
  });
  model.find = (...args: any[]) => mockFind(...args);
  model.findById = (id: string) => mockFindById(id);
  model.findOne = (filter: any) => mockFindOne(filter);
  model.findByIdAndDelete = (id: string) => mockFindByIdAndDelete(id);
  model.countDocuments = (filter?: any) => mockCountDocuments(filter);
  model.aggregate = (pipeline: any[]) => mockAggregate(pipeline);
  return model;
});

vi.mock("../models/UserErrorReport", () => ({ default: mockModel }));
vi.mock("../services/audit.service", () => ({
  logActivity: (...args: any[]) => mockLogActivity(...args),
}));

// ---------------------------------------------------------------------------
// Import resolvers AFTER mocks
// ---------------------------------------------------------------------------
import { errorReportResolvers } from "../graphql/error-reporting-resolvers";

const _ = {};
const adminCtx = { user: { id: "super-1", username: "superadmin", role: "super_admin" } };
const studentCtx = { user: { id: "student-1", username: "alice", role: "student" } };

// ===========================================================================
// Full Lifecycle Integration
// ===========================================================================
describe("Error Reporting — Full Lifecycle Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes the entire lifecycle: report → query → resolve → stats → delete", async () => {
    // ── Phase 1: Student encounters a payment error ──
    const paymentInput = {
      errorType: "payment",
      message: "Payment gateway timeout after 30s",
      stack: "Error: Payment gateway timeout\n    at submitPayment (PaymentForm.tsx:142)",
      componentName: "PaymentForm",
      operationName: "SubmitPayment",
      statusCode: 502,
      context: JSON.stringify({
        url: "https://bootskills.com/payment/checkout",
        userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
        transactionId: "txn_abc123",
      }),
    };

    // No existing report with this fingerprint → create new
    mockFindOne.mockResolvedValue(null);

    const reportResult = await errorReportResolvers.Mutation.reportClientError(
      _,
      { input: { ...paymentInput, context: JSON.parse(paymentInput.context) } },
      studentCtx,
    );
    expect(reportResult).toBe(true);

    // Verify a new report document was created with correct fields.
    // `occurrenceCount` and `status` are schema defaults (not in constructor args).
    const createCallArg = mockModel.mock.calls[0][0];
    expect(createCallArg.userId).toBe("student-1");
    expect(createCallArg.username).toBe("alice");
    expect(createCallArg.errorType).toBe("payment");
    expect(createCallArg.severity).toBe("critical");
    expect(createCallArg.message).toBe("Payment gateway timeout after 30s");
    expect(createCallArg.componentName).toBe("PaymentForm");
    expect(createCallArg.operationName).toBe("SubmitPayment");
    expect(createCallArg.statusCode).toBe(502);
    expect(createCallArg.url).toBe("https://bootskills.com/payment/checkout");
    expect(createCallArg.browserInfo.name).toBe("Chrome");
    expect(createCallArg.fingerprint).toEqual(expect.any(String));
    expect(createCallArg.context).toBeDefined();
    expect(createCallArg.context.url).toBe("https://bootskills.com/payment/checkout");
    // occurrenceCount and status are Mongoose schema defaults, set by the model
    // constructor post-processing, not by the resolver's constructor call.
    // The resolver does not pass them explicitly.

    // ── Phase 2: Same error occurs again (dedup) ──
    const existingDoc = {
      _id: "report-1",
      occurrenceCount: 1,
      severity: "critical",  // already critical
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(existingDoc);

    await errorReportResolvers.Mutation.reportClientError(
      _,
      { input: { errorType: "payment", message: "Payment gateway timeout after 30s" } },
      studentCtx,
    );

    expect(existingDoc.occurrenceCount).toBe(2); // incremented
    expect(existingDoc.save).toHaveBeenCalled();
    expect(mockModel).toHaveBeenCalledTimes(1); // no new doc created

    // ── Phase 3: Super admin queries all error reports ──
    const mockReports = [
      {
        _id: "report-1",
        userId: "student-1",
        username: "alice",
        errorType: "payment",
        severity: "critical",
        message: "Payment gateway timeout after 30s",
        status: "open",
        occurrenceCount: 2,
        componentName: "PaymentForm",
        operationName: "SubmitPayment",
        url: "https://bootskills.com/payment/checkout",
        createdAt: new Date(),
      },
    ];

    mockFind.mockReturnValue(makeLeanChain(mockReports));
    mockCountDocuments.mockResolvedValue(1);

    const allReports = await errorReportResolvers.Query.getErrorReports(
      _,
      { page: 1, limit: 10 },
      adminCtx,
    );

    expect(allReports.items).toHaveLength(1);
    expect(allReports.pagination.totalCount).toBe(1);
    expect(allReports.pagination.currentPage).toBe(1);
    expect(allReports.pagination.hasNextPage).toBe(false);
    expect(allReports.pagination.hasPreviousPage).toBe(false);
    expect(allReports.items[0].errorType).toBe("payment");
    expect(allReports.items[0].severity).toBe("critical");
    expect(allReports.items[0].occurrenceCount).toBe(2);

    // Verify the chain was built with correct params
    const findCall = mockFind.mock.calls[0][0];
    expect(findCall).toEqual({}); // no filters

    // ── Phase 4: Super admin views single report ──
    mockFindById.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockReports[0]),
      }),
    });

    const singleReport = await errorReportResolvers.Query.getErrorReport(
      _,
      { id: "report-1" },
      adminCtx,
    );

    expect(singleReport).toBeDefined();
    expect(singleReport._id).toBe("report-1");
    expect(singleReport.message).toContain("Payment gateway timeout");
    expect(mockFindById).toHaveBeenCalledWith("report-1");

    // ── Phase 5: Super admin checks stats ──
    mockCountDocuments
      .mockReset()
      .mockResolvedValueOnce(1)   // total
      .mockResolvedValueOnce(1)   // open
      .mockResolvedValueOnce(0)   // investigating
      .mockResolvedValueOnce(0)   // resolved
      .mockResolvedValueOnce(0)   // dismissed
      .mockResolvedValueOnce(1)   // critical
      .mockResolvedValueOnce(0)   // high
      .mockResolvedValueOnce(0)   // medium
      .mockResolvedValueOnce(0);  // low

    mockAggregate
      .mockReset()
      .mockResolvedValueOnce([{ _id: "payment", count: 1 }])
      .mockResolvedValueOnce([{ _id: "PaymentForm", count: 1 }]);

    const stats = await errorReportResolvers.Query.getErrorReportStats(
      _,
      {},
      adminCtx,
    );

    expect(stats.total).toBe(1);
    expect(stats.open).toBe(1);
    expect(stats.critical).toBe(1);
    expect(stats.byType).toEqual([{ errorType: "payment", count: 1 }]);
    expect(stats.byComponent).toEqual([{ componentName: "PaymentForm", count: 1 }]);

    // ── Phase 6: Super admin resolves the report ──
    const reportToResolve = {
      _id: "report-1",
      status: "open",
      severity: "critical",
      message: "Payment gateway timeout after 30s",
      resolvedBy: undefined,
      resolvedAt: undefined,
      resolution: undefined,
      save: vi.fn().mockResolvedValue(undefined),
      populate: vi.fn().mockReturnThis(),
    };
    mockFindById.mockReset();
    mockFindById.mockResolvedValue(reportToResolve);

    const resolvedReport = await errorReportResolvers.Mutation.resolveErrorReport(
      _,
      { id: "report-1", resolution: "Increased payment gateway timeout to 60s" },
      { user: { id: "super-1", role: "super_admin" } },
    );

    expect(reportToResolve.status).toBe("resolved");
    expect(reportToResolve.resolvedBy).toBe("super-1");
    expect(reportToResolve.resolvedAt).toBeInstanceOf(Date);
    expect(reportToResolve.resolution).toBe("Increased payment gateway timeout to 60s");
    expect(reportToResolve.save).toHaveBeenCalled();

    // Verify audit log was created
    expect(mockLogActivity).toHaveBeenCalledWith(
      "super-1",
      "RESOLVE",
      "UserErrorReport",
      "report-1",
      expect.stringContaining("Resolved error report: Payment gateway timeout"),
    );

    // ── Phase 7: Filtered query for resolved reports ──
    const resolvedReports = [
      {
        _id: "report-1",
        status: "resolved",
        severity: "critical",
        message: "Payment gateway timeout after 30s",
        resolvedBy: { id: "super-1", username: "superadmin", fullName: "Super Admin" },
        resolvedAt: new Date(),
        resolution: "Increased payment gateway timeout to 60s",
        occurrenceCount: 2,
      },
    ];

    mockFind.mockReturnValue(makeLeanChain(resolvedReports));
    mockCountDocuments.mockResolvedValue(1);

    const filteredReports = await errorReportResolvers.Query.getErrorReports(
      _,
      { page: 1, limit: 10, status: "resolved" },
      adminCtx,
    );

    expect(filteredReports.items).toHaveLength(1);
    expect(filteredReports.items[0].status).toBe("resolved");
    expect(filteredReports.items[0].resolution).toBe("Increased payment gateway timeout to 60s");

    // Verify filter was passed to the query (last call, not first)
    const lastFindCall = mockFind.mock.calls[mockFind.mock.calls.length - 1];
    expect(lastFindCall[0]).toEqual({ status: "resolved" });

    // ── Phase 8: Super admin deletes the report ──
    mockFindByIdAndDelete.mockResolvedValue({ _id: "report-1" });

    const deleteResult = await errorReportResolvers.Mutation.deleteErrorReport(
      _,
      { id: "report-1" },
      adminCtx,
    );

    expect(deleteResult).toBe(true);
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith("report-1");

    // Verify deletion was also audited
    expect(mockLogActivity).toHaveBeenCalledWith(
      "super-1",
      "DELETE",
      "UserErrorReport",
      "report-1",
      expect.stringContaining("Deleted error report"),
    );
  });

  // ─── Authorization gating throughout the lifecycle ─────────────────────

  it("rejects non-admin operations throughout the lifecycle", async () => {
    // Student cannot query reports
    await expect(
      errorReportResolvers.Query.getErrorReports(_, {}, studentCtx),
    ).rejects.toThrow("Unauthorized");

    // Student cannot view single report
    await expect(
      errorReportResolvers.Query.getErrorReport(_, { id: "r1" }, studentCtx),
    ).rejects.toThrow("Unauthorized");

    // Student cannot resolve
    await expect(
      errorReportResolvers.Mutation.resolveErrorReport(_, { id: "r1" }, studentCtx),
    ).rejects.toThrow("Unauthorized");

    // Student cannot delete
    await expect(
      errorReportResolvers.Mutation.deleteErrorReport(_, { id: "r1" }, studentCtx),
    ).rejects.toThrow("Unauthorized");

    // Unauthenticated cannot do any of these
    for (const resolver of [
      () => errorReportResolvers.Query.getErrorReports(_, {}, {}),
      () => errorReportResolvers.Query.getErrorReport(_, { id: "r1" }, {}),
      () => errorReportResolvers.Mutation.resolveErrorReport(_, { id: "r1" }, {}),
      () => errorReportResolvers.Mutation.deleteErrorReport(_, { id: "r1" }, {}),
    ]) {
      await expect(resolver()).rejects.toThrow("Unauthorized");
    }

    // BUT: students CAN report errors (open to all, including unauthenticated)
    mockFindOne.mockResolvedValue(null);
    const result = await errorReportResolvers.Mutation.reportClientError(
      _,
      { input: { errorType: "runtime", message: "Student error" } },
      studentCtx,
    );
    expect(result).toBe(true);

    // And unauthenticated users can report too
    await errorReportResolvers.Mutation.reportClientError(
      _,
      { input: { errorType: "graphql", message: "Anonymous error" } },
      {},
    );
    const anonymousCallArg = mockModel.mock.calls[mockModel.mock.calls.length - 1][0];
    expect(anonymousCallArg.username).toBeUndefined();
    expect(anonymousCallArg.userId).toBeUndefined();
  });

  // ─── Multiple reports with different error types ──────────────────────

  it("handles multiple errors of different types in the same query", async () => {
    const multiReports = [
      { _id: "r1", severity: "critical", errorType: "auth", message: "Login failed", status: "open", occurrenceCount: 5, componentName: "LoginForm" },
      { _id: "r2", severity: "high", errorType: "network", message: "API timeout", status: "open", occurrenceCount: 3, componentName: "ApiClient" },
      { _id: "r3", severity: "medium", errorType: "graphql", message: "Field not found", status: "resolved", occurrenceCount: 1, componentName: "UserDashboard" },
    ];

    mockFind.mockReturnValue(makeLeanChain(multiReports));
    mockCountDocuments.mockResolvedValue(3);

    const result = await errorReportResolvers.Query.getErrorReports(
      _,
      { page: 1, limit: 50 },
      adminCtx,
    );

    expect(result.items).toHaveLength(3);
    expect(result.pagination.totalCount).toBe(3);
    expect(result.items[0].errorType).toBe("auth");
    expect(result.items[1].errorType).toBe("network");
    expect(result.items[2].status).toBe("resolved");
  });

  // ─── Text search works ─────────────────────────────────────────────────

  it("supports text search across reports", async () => {
    mockFind.mockReturnValue(makeLeanChain([]));
    mockCountDocuments.mockResolvedValue(0);

    await errorReportResolvers.Query.getErrorReports(
      _,
      { page: 1, limit: 10, search: "payment timeout" },
      adminCtx,
    );

    const filter = mockCountDocuments.mock.calls[0][0];
    expect(filter.$or).toHaveLength(4);
    expect(filter.$or[0]).toEqual({ message: { $regex: "payment timeout", $options: "i" } });
  });
});
