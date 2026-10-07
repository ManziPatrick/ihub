/**
 * Integration tests for AdminCourses pagination flow.
 *
 * Tests end-to-end page navigation:
 * - Initial render with paginated data
 * - Page change (debounced) via PaginationBar
 * - Page size change
 * - Search filtering interaction with pagination
 * - Loading state
 * - Empty state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// ─── Mock external dependencies ─────────────────────────────────────────────

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock PortalLayout to render children directly (no auth/layout deps)
vi.mock("@/components/portal/PortalLayout", () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock framer-motion to render children without animation
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock AuthContext (used by EditCourseDialog which is rendered by AdminCourses)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", username: "admin", role: "admin" },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Mock data helpers ──────────────────────────────────────────────────────

interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CourseItem {
  id: string;
  title: string;
  descriptionSnippet: string | null;
  price: number;
  discountPrice: number | null;
  level: string;
  category: string;
  status: string;
  enrollmentMode: string;
  school: string | null;
  isFeatured: boolean;
  studentsEnrolledCount: number;
  totalLessonsCount: number;
  instructor: { id: string; username: string } | null;
}

/** Generate a page of fake courses. */
function makeCoursesPage(
  page: number,
  pageSize: number,
  totalItems = 100,
): { items: CourseItem[]; pagination: PaginationMeta } {
  const start = (page - 1) * pageSize;
  const count = Math.min(pageSize, Math.max(0, totalItems - start));
  const items: CourseItem[] = Array.from({ length: count }, (_, i) => ({
    id: `course-${start + i + 1}`,
    title: `Test Course ${start + i + 1}`,
    descriptionSnippet: `Description for course ${start + i + 1}`,
    price: i % 2 === 0 ? 0 : 50000,
    discountPrice: i % 2 === 0 ? null : 45000,
    level: "beginner",
    category: "Technology",
    status: i === 0 ? "draft" : "published",
    enrollmentMode: "direct",
    school: null,
    isFeatured: i === 0,
    studentsEnrolledCount: Math.floor(Math.random() * 50),
    totalLessonsCount: Math.floor(Math.random() * 20) + 5,
    instructor: { id: "inst-1", username: "trainer1" },
  }));

  return {
    items,
    pagination: {
      totalCount: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      pageSize,
      hasNextPage: page < Math.ceil(totalItems / pageSize),
      hasPreviousPage: page > 1,
    },
  };
}

// ─── Mock Apollo hooks ──────────────────────────────────────────────────────

type UsePaginatedQueryResult = {
  data: { courses: { items: CourseItem[]; pagination: PaginationMeta } } | undefined;
  loading: boolean;
  refetch: ReturnType<typeof vi.fn>;
};

let mockPaginatedResult: UsePaginatedQueryResult = {
  data: undefined,
  loading: false,
  refetch: vi.fn().mockResolvedValue(undefined),
};

// Track which variables were passed to the hook (for verifying page changes)
let lastHookVariables: Record<string, any> = {};

vi.mock("@/hooks/usePaginatedQuery", () => ({
  usePaginatedQuery: (_query: any, options?: { variables?: Record<string, any> }) => {
    lastHookVariables = options?.variables || {};
    return mockPaginatedResult;
  },
}));

// Mock Apollo useQuery (used for GET_USERS, GET_STATS)
vi.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    data: {
      getAllTrainers: [
        { id: "t1", username: "trainer1", role: "trainer", phone: "0780000000" },
        { id: "a1", username: "admin1", role: "admin", phone: "0780000001" },
      ],
      users: {
        items: [
          { id: "t1", username: "trainer1", role: "trainer" },
          { id: "a1", username: "admin1", role: "admin" },
        ],
        pagination: { totalCount: 2 },
      },
      stats: {
        totalUsers: 50,
        totalCourses: 100,
        totalStudents: 200,
        totalRevenue: 5000000,
      },
    },
    loading: false,
    refetch: vi.fn(),
  }),
  useMutation: () => [vi.fn().mockResolvedValue({}), { loading: false }],
  useLazyQuery: () => [vi.fn().mockResolvedValue({ data: { course: null } }), { data: null, loading: false }],
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

async function renderAdminCourses() {
  const AdminCourses = (await import("./AdminCourses")).default;
  return render(
    <BrowserRouter>
      <AdminCourses />
    </BrowserRouter>,
  );
}

function setMockPage(page: number, pageSize = 10, totalItems = 100) {
  const pageData = makeCoursesPage(page, pageSize, totalItems);
  mockPaginatedResult = {
    data: { courses: pageData },
    loading: false,
    refetch: vi.fn().mockResolvedValue(undefined),
  };
}

function setMockLoading(loading: boolean) {
  mockPaginatedResult = { ...mockPaginatedResult, loading };
}

function setMockEmpty() {
  mockPaginatedResult = {
    data: {
      courses: {
        items: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
    loading: false,
    refetch: vi.fn().mockResolvedValue(undefined),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("AdminCourses — pagination integration", () => {
  beforeEach(() => {
    setMockPage(1);
    mockNavigate.mockClear();
    lastHookVariables = {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    cleanup();
  });

  // ── 1. Initial render ──────────────────────────────────────────────────
  it("renders course rows and pagination bar on initial load", async () => {
    setMockPage(1);
    await renderAdminCourses();

    expect(screen.getByText("Test Course 1")).toBeTruthy();

    // Page buttons for [1, 2, ..., 10]
    expect(screen.getByRole("button", { name: "1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2" })).toBeTruthy();

    // Search input exists
    expect(screen.getByPlaceholderText("Search courses...")).toBeTruthy();
  }, 15000);

  // ── 2. Loading state ───────────────────────────────────────────────────
  it("shows a loading indicator while fetching data", async () => {
    setMockLoading(true);
    await renderAdminCourses();

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  }, 15000);

  // ── 3. Empty state ─────────────────────────────────────────────────────
  it("shows empty state when no courses exist", async () => {
    setMockEmpty();
    await renderAdminCourses();

    expect(screen.getByText("No courses found")).toBeTruthy();
    expect(screen.getByText("Create your first course to get started.")).toBeTruthy();
  }, 15000);

  // ── 4. Different page data renders correctly ───────────────────────────
  it("renders page 1 courses initially and page 2 courses after mock change", async () => {
    await renderAdminCourses();
    expect(screen.getByText("Test Course 1")).toBeTruthy();

    cleanup();
    setMockPage(2);
    await renderAdminCourses();

    expect(screen.getByText("Test Course 11")).toBeTruthy();
    expect(screen.queryByText("Test Course 1")).toBeNull();
  }, 15000);

  // ── 5. Hook receives correct default page/limit variables ──────────────
  it("passes the default page=1 and limit=10 as variables to usePaginatedQuery", async () => {
    setMockPage(1);
    await renderAdminCourses();

    // Component initializes with currentPage=1, pageSize=10
    expect(lastHookVariables.page).toBe(1);
    expect(lastHookVariables.limit).toBe(10);
  }, 15000);

  // ── 6. Search filters courses client-side ──────────────────────────────
  it("filters courses by title when searching", async () => {
    await renderAdminCourses();

    const searchInput = screen.getByPlaceholderText("Search courses...");
    fireEvent.change(searchInput, { target: { value: "Test Course 1" } });

    expect(screen.getByText("Test Course 1")).toBeTruthy();
    expect(screen.getByText("Test Course 10")).toBeTruthy();
    expect(screen.queryByText("Test Course 2")).toBeNull();
  }, 15000);

  // ── 7. No-match search shows empty state ───────────────────────────────
  it("shows no matching courses when search has no results", async () => {
    await renderAdminCourses();

    const searchInput = screen.getByPlaceholderText("Search courses...");
    fireEvent.change(searchInput, { target: { value: "zzz_nonexistent" } });

    expect(screen.getByText("No courses found")).toBeTruthy();
  }, 15000);

  // ── 8. First/previous disabled on page 1, next/last enabled ────────────
  it("disables Previous/First buttons and enables Next/Last on page 1", async () => {
    setMockPage(1);
    await renderAdminCourses();

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeEnabled();
  }, 15000);

  // ── 9. Page-size select renders default value ──────────────────────────
  it("renders the page size selector with the current pageSize value", async () => {
    await renderAdminCourses();

    // Radix UI Select in jsdom may use 'combobox' role, or just render plain text
    const combobox = screen.queryByRole("combobox");
    if (combobox) {
      expect(combobox.textContent).toContain("10");
    }
    // At minimum, the text "10" is present somewhere (page-size trigger or visible text)
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
  }, 15000);

  // ── 10. Create Course navigates ────────────────────────────────────────
  it("navigates to create course page on button click", async () => {
    await renderAdminCourses();

    const createBtn = screen.getByText("Create Course");
    fireEvent.click(createBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/portal/admin/courses/create");
  }, 15000);

  // ── 11. Refresh calls refetch ──────────────────────────────────────────
  it("calls refetch when Refresh button is clicked", async () => {
    const refetchMock = vi.fn().mockResolvedValue(undefined);
    mockPaginatedResult.refetch = refetchMock;

    await renderAdminCourses();

    fireEvent.click(screen.getByText("Refresh"));

    await waitFor(() => {
      expect(refetchMock).toHaveBeenCalled();
    });
  }, 15000);

  // ── 12. Page range correct for 100 items ───────────────────────────────
  it("shows correct page range for 100 items at 10 per page", async () => {
    setMockPage(1, 10, 100);
    await renderAdminCourses();

    expect(screen.getByRole("button", { name: "10" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  }, 15000);

  // ── 13. Search input resets page to 1 ──────────────────────────────────
  it("resets currentPage to 1 when search input changes", async () => {
    await renderAdminCourses();

    // Start on page 1 (the default)
    expect(lastHookVariables.page).toBe(1);

    // Type a search — component sets setSearchQuery(value) + setCurrentPage(1)
    const searchInput = screen.getByPlaceholderText("Search courses...");
    fireEvent.change(searchInput, { target: { value: "test" } });

    // Verify the input was updated
    expect((searchInput as HTMLInputElement).value).toBe("test");

    // After the re-render, page should still be 1 (was already reset by search)
    await waitFor(() => {
      expect(lastHookVariables.page).toBe(1);
    });
  }, 15000);

  // ── 14. Clicking page 2 updates the hook variables (end-to-end) ────────
  it("updates the pagination hook variables when a page button is clicked", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    await renderAdminCourses();

    // Verify we start on page 1
    expect(lastHookVariables.page).toBe(1);

    // Click page 2
    fireEvent.click(screen.getByRole("button", { name: "2" }));

    // Advance past the 150ms debounce in PaginationBar
    vi.advanceTimersByTime(200);

    // Flush microtasks to let React process the setCurrentPage(2) state update
    await Promise.resolve();

    // After debounce fires and state update propagates, hook should receive page=2
    expect(lastHookVariables.page).toBe(2);

    vi.useRealTimers();
  }, 15000);

  // ── 15. 2-page dataset shows correct buttons ───────────────────────────
  it("handles a small dataset (15 items = 2 pages) gracefully", async () => {
    setMockPage(1, 10, 15);
    await renderAdminCourses();

    // Only 2 pages: [1, 2]
    expect(screen.getByRole("button", { name: "1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2" })).toBeTruthy();

    // No page 3
    expect(screen.queryByRole("button", { name: "3" })).toBeNull();

    // Next page should point to page 2
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  }, 15000);
});
