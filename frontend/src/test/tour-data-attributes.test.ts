/**
 * ───────────────────────────────────────────────
 *  TOUR DATA-ATTRIBUTE VALIDATION TEST
 *
 *  This test verifies that every CSS selector
 *  used by the onboarding tour steps actually
 *  matches a real element in PortalLayout.
 *
 *  Specifically:
 *    1. [data-tour="..."] selectors exist as
 *       data-tour attributes in PortalLayout.tsx
 *    2. [href="/portal/..."] selectors match
 *       actual nav-item hrefs for that role
 *    3. "body", "aside" and "header" tag
 *       selectors are present (structural tags)
 * ───────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// 1.  Read the tour-config factories so we discover ALL step targets,
//     grouped by role.
// ---------------------------------------------------------------------------
import {
  createStudentTourSteps,
  createTrainerTourSteps,
  createAdminTourSteps,
  createSuperAdminTourSteps,
  tourFactoriesByRole,
} from "@/components/portal/onboarding/TourConfig";
import type { StepFactory } from "@/components/portal/onboarding/TourConfig";

/**
 * Helper: call a step factory with a no-op `t` function so we
 * get the Step objects (content/title will be empty strings, but
 * the `target` property is what we care about).
 */
/**
 * Helper: call a step factory with a no-op `t` function so we
 * get the Step objects. The `t` argument is unused since we only
 * care about the `target` property.
 */
function targets(stepFactory: StepFactory): string[] {
  return stepFactory((() => "") as any).map((s) => String(s.target));
}

// ---------------------------------------------------------------------------
// 2.  Hard-code the known nav-item hrefs for each role, extracted from
//     PortalLayout.tsx.  When a nav item is a group (has children) the
//     group itself does NOT have an href, so we only list leaf hrefs.
// ---------------------------------------------------------------------------
const roleHrefs: Record<string, string[]> = {
  student: [
    "/portal/student",
    "/portal/student/projects",
    "/portal/student/my-tasks",
    "/portal/student/courses",
    "/portal/student/certificates",
    "/portal/student/gradings",
    "/portal/student/internship",
    "/portal/student/schedule",
    "/portal/student/billing",
    "/chat",
    "/portal/student/profile",
  ],
  trainer: [
    "/portal/trainer",
    "/portal/trainer/courses",
    "/portal/trainer/students",
    "/portal/trainer/projects",
    "/portal/trainer/assignments",
    "/portal/trainer/mentorship",
    "/portal/trainer/internships",
    "/portal/admin/project-onboarding",
    "/portal/trainer/schedule",
    "/chat",
  ],
  // mentor reuses trainer nav items
  mentor: [
    "/portal/trainer",
    "/portal/trainer/courses",
    "/portal/trainer/students",
    "/portal/trainer/projects",
    "/portal/trainer/assignments",
    "/portal/trainer/mentorship",
    "/portal/trainer/internships",
    "/portal/admin/project-onboarding",
    "/portal/trainer/schedule",
    "/chat",
  ],
  admin: [
    "/portal/admin",
    "/portal/admin/users",
    "/portal/admin/completed-users",
    "/portal/admin/courses",
    "/portal/admin/course-preview",
    "/portal/admin/applications",
    "/portal/admin/internships",
    "/portal/admin/scholarships",
    "/portal/super-admin/discount-codes",
    "/portal/super-admin/code-answers",
    "/portal/admin/projects",
    "/portal/admin/project-applications",
    "/portal/admin/project-onboarding",
    "/portal/admin/assignment-reviews",
    "/portal/admin/payments",
    "/portal/admin/commissions",
    "/portal/admin/refunds",
    "/portal/admin/analytics",
    "/portal/admin/schedule",
    "/chat",
  ],
  // client reuses admin nav items
  client: [
    "/portal/client",
    "/portal/client/applications",
    "/portal/client/workspace",
    "/portal/client/feedback",
    "/chat",
  ],
  super_admin: [
    "/portal/super-admin",
    "/portal/super-admin/admins",
    "/portal/super-admin/users",
    "/portal/super-admin/completed-users",
    "/portal/super-admin/config",
    "/portal/super-admin/commissions",
    "/portal/super-admin/my-commissions",
    "/portal/super-admin/disbursements",
    "/portal/super-admin/intouch-pay",
    "/portal/super-admin/pawapay",
    "/portal/super-admin/broadcast",
    "/portal/super-admin/undo-metrics",
    "/portal/super-admin/discount-codes",
    "/portal/super-admin/discount-analytics",
    "/portal/super-admin/refunds",
    "/portal/super-admin/scholarships",
    "/portal/super-admin/error-reports",
    "/portal/super-admin/code-answers",
    "/portal/super-admin/backups",
    "/portal/super-admin/social-posts",
    "/portal/admin/branding",
    "/portal/super-admin/analytics",
    "/portal/super-admin/user-map",
    "/portal/admin/schedule",
    "/chat",
  ],
};

// ---------------------------------------------------------------------------
// 3.  Helper: extract [href="…"] selectors from a list of targets
// ---------------------------------------------------------------------------
function hrefTargets(targets: string[]): string[] {
  return targets
    .filter((t) => t.startsWith("[href"))
    .map((t) => {
      // [href="/portal/student"]  →  /portal/student
      const m = t.match(/\[href="([^"]+)"\]/);
      return m ? m[1] : "";
    })
    .filter(Boolean);
}

function dataTourSelectors(targets: string[]): string[] {
  return targets
    .filter((t) => t.startsWith("[data-tour"))
    .map((t) => {
      const m = t.match(/\[data-tour="([^"]+)"\]/);
      return m ? m[1] : "";
    })
    .filter(Boolean);
}

function tagSelectors(targets: string[]): string[] {
  return targets.filter((t) => !t.startsWith("["));
}

// ---------------------------------------------------------------------------
// 4.  Known data-tour attributes placed in PortalLayout.tsx
// ---------------------------------------------------------------------------
const knownDataTourAttributes = ["notifications", "user-menu"];

// ---------------------------------------------------------------------------
// 5.  Tests
// ---------------------------------------------------------------------------

describe("Tour data-tour attributes", () => {
  // ─────────── Student ───────────
  describe("Student tour", () => {
    const steps = targets(createStudentTourSteps);

    it("tags 'body', 'aside', 'header' are referenced", () => {
      const tags = tagSelectors(steps);
      expect(tags).toContain("body");
      expect(tags).toContain("aside");
      expect(tags).toContain("header");
    });

    it("every [data-tour='…'] selector matches a known attribute in PortalLayout", () => {
      const dts = dataTourSelectors(steps);
      for (const dt of dts) {
        expect(knownDataTourAttributes, `[data-tour="${dt}"] not found in PortalLayout`).toContain(dt);
      }
    });

    it("every [href='…'] target matches a real student nav-item href", () => {
      const hfs = hrefTargets(steps);
      for (const h of hfs) {
        expect(roleHrefs.student, `href "${h}" not found in student nav items`).toContain(h);
      }
    });
  });

  // ─────────── Trainer ───────────
  describe("Trainer tour", () => {
    const steps = targets(createTrainerTourSteps);

    it("tags 'body', 'aside', 'header' are referenced", () => {
      const tags = tagSelectors(steps);
      expect(tags).toContain("body");
      expect(tags).toContain("aside");
      expect(tags).toContain("header");
    });

    it("every [data-tour='…'] selector matches a known attribute in PortalLayout", () => {
      const dts = dataTourSelectors(steps);
      for (const dt of dts) {
        expect(knownDataTourAttributes, `[data-tour="${dt}"] not found in PortalLayout`).toContain(dt);
      }
    });

    it("every [href='…'] target matches a real trainer nav-item href", () => {
      const hfs = hrefTargets(steps);
      for (const h of hfs) {
        expect(roleHrefs.trainer, `href "${h}" not found in trainer nav items`).toContain(h);
      }
    });
  });

  // ─────────── Admin ───────────
  describe("Admin tour", () => {
    const steps = targets(createAdminTourSteps);

    it("tags 'body', 'aside', 'header' are referenced", () => {
      const tags = tagSelectors(steps);
      expect(tags).toContain("body");
      expect(tags).toContain("aside");
      expect(tags).toContain("header");
    });

    it("every [data-tour='…'] selector matches a known attribute in PortalLayout", () => {
      const dts = dataTourSelectors(steps);
      for (const dt of dts) {
        expect(knownDataTourAttributes, `[data-tour="${dt}"] not found in PortalLayout`).toContain(dt);
      }
    });

    it("every [href='…'] target matches a real admin nav-item href", () => {
      const hfs = hrefTargets(steps);
      for (const h of hfs) {
        expect(roleHrefs.admin, `href "${h}" not found in admin nav items`).toContain(h);
      }
    });
  });

  // ─────────── Super Admin ───────────
  describe("Super Admin tour", () => {
    const steps = targets(createSuperAdminTourSteps);

    it("tags 'body', 'aside', 'header' are referenced", () => {
      const tags = tagSelectors(steps);
      expect(tags).toContain("body");
      expect(tags).toContain("aside");
      expect(tags).toContain("header");
    });

    it("every [data-tour='…'] selector matches a known attribute in PortalLayout", () => {
      const dts = dataTourSelectors(steps);
      for (const dt of dts) {
        expect(knownDataTourAttributes, `[data-tour="${dt}"] not found in PortalLayout`).toContain(dt);
      }
    });

    it("every [href='…'] target matches a real super-admin nav-item href", () => {
      const hfs = hrefTargets(steps);
      for (const h of hfs) {
        expect(roleHrefs.super_admin, `href "${h}" not found in super_admin nav items`).toContain(h);
      }
    });
  });

  // ─────────── Role aliases ───────────
  describe("Role alias coverage", () => {
    it("every role in tourFactoriesByRole has a matching entry in roleHrefs", () => {
      const factoryRoles = Object.keys(tourFactoriesByRole);
      // 'client' and 'mentor' are aliases that reuse trainer/admin factories
      for (const role of factoryRoles) {
        expect(roleHrefs, `role "${role}" missing from roleHrefs`).toHaveProperty(role);
      }
    });

    it("mentor alias uses same href targets as trainer", () => {
      const mentorSteps = targets(tourFactoriesByRole.mentor.factory);
      const trainerSteps = targets(createTrainerTourSteps);
      expect(hrefTargets(mentorSteps)).toEqual(hrefTargets(trainerSteps));
    });

    it("client alias uses same href targets as admin", () => {
      const clientSteps = targets(tourFactoriesByRole.client.factory);
      const adminSteps = targets(createAdminTourSteps);
      expect(hrefTargets(clientSteps)).toEqual(hrefTargets(adminSteps));
    });
  });
});
