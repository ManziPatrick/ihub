import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — built before vi.mock factories run
// ---------------------------------------------------------------------------
const {
  mockFindById,
  mockSave,
  mockPopulate,
  mockDistinct,
} = vi.hoisted(() => {
  // A chainable document mock that supports .save() and .populate()
  const makeDoc = (overrides: any = {}) => {
    const doc: Record<string, any> = {
      _id: overrides._id ?? "app-1",
      clientId: overrides.clientId ?? "client-1",
      title: overrides.title ?? "Test App",
      description: overrides.description ?? "Description",
      status: overrides.status ?? "submitted",
      ndaSigned: overrides.ndaSigned ?? false,
      assignedAdmin: overrides.assignedAdmin ?? undefined,
      save: vi.fn().mockResolvedValue(undefined),
      toObject: vi.fn().mockReturnValue({ id: "app-1" }),
      ...overrides,
    };
    return doc;
  };

  const findById = vi.fn();
  const distinct = vi.fn();

  return {
    mockFindById: findById,
    mockSave: vi.fn().mockResolvedValue(undefined),
    mockPopulate: vi.fn(),
    mockDistinct: distinct,
  };
});

// ---- Module mocks -----------------------------------------------------------
vi.mock("../models/ProjectApplication", () => ({
  ProjectApplication: {
    findById: (id: string) => {
      // Must return a chainable/thenable object (like a Mongoose Query):
      // - .populate() returns itself for chaining
      // - .then() makes it awaitable, resolving to the mock result
      const result = mockFindById(id);
      const chain: any = {
        populate: vi.fn(() => chain),
        then: (resolve: (v: any) => any) => {
          if (result && typeof result.then === 'function') {
            return result.then(resolve);
          }
          return Promise.resolve(result).then(resolve);
        },
        catch: (reject: (e: any) => any) => Promise.resolve(result).then(undefined, reject),
      };
      return chain;
    },
  },
}));

vi.mock("../models/User", () => ({
  User: {
    distinct: (field: string, filter: any) => mockDistinct(field, filter),
  },
}));

// ---- Import resolver AFTER mocks --------------------------------------------
import { resolvers } from "../graphql/resolvers";

const claimProjectApplication = resolvers.Mutation.claimProjectApplication;
const getRegisteredCompanies = resolvers.Query.getRegisteredCompanies;

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
// claimProjectApplication
// =============================================================================
describe("claimProjectApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- 1. Unauthenticated --------------------------------------------------

  it("throws 'Unauthorized' when no user in context", async () => {
    await expect(claimProjectApplication(_, { applicationId: "app-1" }, {})).rejects.toThrow(
      "Unauthorized"
    );
    await expect(
      claimProjectApplication(_, { applicationId: "app-1" }, { user: null })
    ).rejects.toThrow("Unauthorized");
  });

  // ---- 2. Non-admin roles --------------------------------------------------

  it.each(["student", "client", "trainer"])(
    "throws 'Unauthorized' for %s role",
    async (role) => {
      const ctx = makeContext({ role });
      await expect(
        claimProjectApplication(_, { applicationId: "app-1" }, ctx)
      ).rejects.toThrow("Unauthorized");
    }
  );

  // ---- 3. Application not found --------------------------------------------

  it("throws 'Application not found' when app does not exist", async () => {
    mockFindById.mockResolvedValue(null);
    const ctx = makeContext();

    await expect(
      claimProjectApplication(_, { applicationId: "nonexistent" }, ctx)
    ).rejects.toThrow("Application not found");
  });

  // ---- 4. Already assigned to another admin --------------------------------

  it("throws when already assigned to a different admin", async () => {
    const existingApp = {
      _id: "app-1",
      assignedAdmin: { toString: () => "admin-999" },
      save: vi.fn(),
    };
    mockFindById.mockResolvedValue(existingApp);
    const ctx = makeContext({ id: "admin-1" });

    await expect(
      claimProjectApplication(_, { applicationId: "app-1" }, ctx)
    ).rejects.toThrow("This application is already assigned to another admin");
    expect(existingApp.save).not.toHaveBeenCalled();
  });

  // ---- 5. Successfully claim unassigned app --------------------------------

  it("claims an unassigned application successfully", async () => {
    const app = {
      _id: "app-1",
      assignedAdmin: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindById
      .mockResolvedValueOnce(app)        // first findById
      .mockResolvedValueOnce({           // second findById (after save)
        ...app,
        populated: true,
      });

    const ctx = makeContext();

    const result = await claimProjectApplication(_, { applicationId: "app-1" }, ctx);

    expect(app.assignedAdmin).toBe("admin-1");
    expect(app.save).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });

  // ---- 6. Admin can claim app assigned to themselves -----------------------

  it("allows an admin to claim an app they already own", async () => {
    const app = {
      _id: "app-1",
      assignedAdmin: { toString: () => "admin-1" },
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindById
      .mockResolvedValueOnce(app)
      .mockResolvedValueOnce({
        ...app,
        populated: true,
      });

    const ctx = makeContext({ id: "admin-1" });

    const result = await claimProjectApplication(_, { applicationId: "app-1" }, ctx);

    expect(app.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // ---- 7. Super_admin can claim any app ------------------------------------

  it("allows super_admin to claim any application", async () => {
    const app = {
      _id: "app-1",
      assignedAdmin: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockFindById
      .mockResolvedValueOnce(app)
      .mockResolvedValueOnce({
        ...app,
        populated: true,
      });

    const ctx = makeContext({ role: "super_admin" });

    const result = await claimProjectApplication(_, { applicationId: "app-1" }, ctx);

    expect(app.assignedAdmin).toBe("admin-1");
    expect(result).toBeDefined();
  });
});

// =============================================================================
// getRegisteredCompanies
// =============================================================================
describe("getRegisteredCompanies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- 1. Unauthenticated --------------------------------------------------

  it("throws 'Not authenticated' when no user in context", async () => {
    await expect(getRegisteredCompanies(_, {}, {})).rejects.toThrow("Not authenticated");
    await expect(getRegisteredCompanies(_, {}, { user: null })).rejects.toThrow(
      "Not authenticated"
    );
  });

  // ---- 2. Empty list when no companies exist -------------------------------

  it("returns empty array when no users have company set", async () => {
    mockDistinct.mockResolvedValue([]);

    const ctx = makeContext();
    const result = await getRegisteredCompanies(_, {}, ctx);

    expect(result).toEqual([]);
    expect(mockDistinct).toHaveBeenCalledWith("company", {
      company: { $ne: "", $exists: true },
    });
  });

  // ---- 3. Returns sorted distinct companies --------------------------------

  it("returns sorted distinct company names", async () => {
    mockDistinct.mockResolvedValue(["Zenith Corp", "Alpha Inc", "Beta LLC"]);

    const ctx = makeContext();
    const result = await getRegisteredCompanies(_, {}, ctx);

    expect(result).toEqual(["Alpha Inc", "Beta LLC", "Zenith Corp"]);
  });

  // ---- 4. Filters out empty strings and nulls ------------------------------

  it("filters out empty string and null companies", async () => {
    mockDistinct.mockResolvedValue(["Valid Co", "", "Another Ltd", null, "  ", undefined]);

    const ctx = makeContext();
    const result = await getRegisteredCompanies(_, {}, ctx);

    // .filter(Boolean) removes: "", null, undefined
    // "  " (whitespace-only) is truthy, so it would pass through
    expect(result).toEqual(["  ", "Another Ltd", "Valid Co"]);
  });

  // ---- 5. Any authenticated user can call it --------------------------------

  it.each(["student", "client", "trainer", "admin", "super_admin"])(
    "allows %s role to fetch companies",
    async (role) => {
      mockDistinct.mockResolvedValue(["TechCorp"]);

      const ctx = makeContext({ role });
      const result = await getRegisteredCompanies(_, {}, ctx);

      expect(result).toEqual(["TechCorp"]);
    }
  );
});
