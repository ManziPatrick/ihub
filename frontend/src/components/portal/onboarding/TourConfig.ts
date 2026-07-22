import type { Step } from "react-joyride";
import type { UserRole } from "@/contexts/AuthContext";
import type { TFunction } from "i18next";

export type StepFactory = (t: TFunction) => Step[];

/**
 * ───────────────────────────────────────────────
 *  STUDENT TOUR STEPS (i18n)
 * ───────────────────────────────────────────────
 */
export const createStudentTourSteps: StepFactory = (t) => [
  {
    target: "body",
    content: t("tour.student.welcome.content"),
    title: t("tour.student.welcome.title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "aside",
    content: t("tour.student.sidebar.content"),
    title: t("tour.student.sidebar.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student"]',
    content: t("tour.student.dashboard.content"),
    title: t("tour.student.dashboard.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/projects"]',
    content: t("tour.student.projects.content"),
    title: t("tour.student.projects.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/courses"]',
    content: t("tour.student.courses.content"),
    title: t("tour.student.courses.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/internship"]',
    content: t("tour.student.internship.content"),
    title: t("tour.student.internship.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/schedule"]',
    content: t("tour.student.schedule.content"),
    title: t("tour.student.schedule.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/billing"]',
    content: t("tour.student.billing.content"),
    title: t("tour.student.billing.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/student/certificates"]',
    content: t("tour.student.certificates.content"),
    title: t("tour.student.certificates.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "header",
    content: t("tour.student.header.content"),
    title: t("tour.student.header.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="notifications"]',
    content: t("tour.student.notifications.content"),
    title: t("tour.student.notifications.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: t("tour.student.userMenu.content"),
    title: t("tour.student.userMenu.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "body",
    content: t("tour.student.ready.content"),
    title: t("tour.student.ready.title"),
    placement: "center",
    disableBeacon: true,
  },
];

/**
 * ───────────────────────────────────────────────
 *  TRAINER TOUR STEPS (i18n)
 * ───────────────────────────────────────────────
 */
export const createTrainerTourSteps: StepFactory = (t) => [
  {
    target: "body",
    content: t("tour.trainer.welcome.content"),
    title: t("tour.trainer.welcome.title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "aside",
    content: t("tour.trainer.sidebar.content"),
    title: t("tour.trainer.sidebar.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer"]',
    content: t("tour.trainer.dashboard.content"),
    title: t("tour.trainer.dashboard.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer/courses"]',
    content: t("tour.trainer.courses.content"),
    title: t("tour.trainer.courses.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer/students"]',
    content: t("tour.trainer.students.content"),
    title: t("tour.trainer.students.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer/mentorship"]',
    content: t("tour.trainer.mentorship.content"),
    title: t("tour.trainer.mentorship.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer/internships"]',
    content: t("tour.trainer.internships.content"),
    title: t("tour.trainer.internships.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/trainer/schedule"]',
    content: t("tour.trainer.schedule.content"),
    title: t("tour.trainer.schedule.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "header",
    content: t("tour.trainer.header.content"),
    title: t("tour.trainer.header.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: t("tour.trainer.userMenu.content"),
    title: t("tour.trainer.userMenu.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "body",
    content: t("tour.trainer.ready.content"),
    title: t("tour.trainer.ready.title"),
    placement: "center",
    disableBeacon: true,
  },
];

/**
 * ───────────────────────────────────────────────
 *  ADMIN TOUR STEPS (i18n)
 * ───────────────────────────────────────────────
 */
export const createAdminTourSteps: StepFactory = (t) => [
  {
    target: "body",
    content: t("tour.admin.welcome.content"),
    title: t("tour.admin.welcome.title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "aside",
    content: t("tour.admin.sidebar.content"),
    title: t("tour.admin.sidebar.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin"]',
    content: t("tour.admin.dashboard.content"),
    title: t("tour.admin.dashboard.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin/users"]',
    content: t("tour.admin.users.content"),
    title: t("tour.admin.users.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin/courses"]',
    content: t("tour.admin.courses.content"),
    title: t("tour.admin.courses.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin/payments"]',
    content: t("tour.admin.payments.content"),
    title: t("tour.admin.payments.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin/internships"]',
    content: t("tour.admin.internships.content"),
    title: t("tour.admin.internships.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/admin/analytics"]',
    content: t("tour.admin.analytics.content"),
    title: t("tour.admin.analytics.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "header",
    content: t("tour.admin.header.content"),
    title: t("tour.admin.header.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: t("tour.admin.userMenu.content"),
    title: t("tour.admin.userMenu.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "body",
    content: t("tour.admin.ready.content"),
    title: t("tour.admin.ready.title"),
    placement: "center",
    disableBeacon: true,
  },
];

/**
 * ───────────────────────────────────────────────
 *  SUPER ADMIN TOUR STEPS (i18n)
 * ───────────────────────────────────────────────
 */
export const createSuperAdminTourSteps: StepFactory = (t) => [
  {
    target: "body",
    content: t("tour.superAdmin.welcome.content"),
    title: t("tour.superAdmin.welcome.title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: "aside",
    content: t("tour.superAdmin.sidebar.content"),
    title: t("tour.superAdmin.sidebar.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin"]',
    content: t("tour.superAdmin.dashboard.content"),
    title: t("tour.superAdmin.dashboard.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/users"]',
    content: t("tour.superAdmin.users.content"),
    title: t("tour.superAdmin.users.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/config"]',
    content: t("tour.superAdmin.config.content"),
    title: t("tour.superAdmin.config.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/commissions"]',
    content: t("tour.superAdmin.commissions.content"),
    title: t("tour.superAdmin.commissions.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/disbursements"]',
    content: t("tour.superAdmin.disbursements.content"),
    title: t("tour.superAdmin.disbursements.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/discount-codes"]',
    content: t("tour.superAdmin.discountCodes.content"),
    title: t("tour.superAdmin.discountCodes.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: '[href="/portal/super-admin/refunds"]',
    content: t("tour.superAdmin.refunds.content"),
    title: t("tour.superAdmin.refunds.title"),
    placement: "right",
    disableBeacon: true,
  },
  {
    target: "header",
    content: t("tour.superAdmin.header.content"),
    title: t("tour.superAdmin.header.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="user-menu"]',
    content: t("tour.superAdmin.userMenu.content"),
    title: t("tour.superAdmin.userMenu.title"),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: "body",
    content: t("tour.superAdmin.ready.content"),
    title: t("tour.superAdmin.ready.title"),
    placement: "center",
    disableBeacon: true,
  },
];

/**
 * ───────────────────────────────────────────────
 *  MAP: ROLE → FACTORY
 * ───────────────────────────────────────────────
 */
export const tourFactoriesByRole: Record<
  UserRole,
  { factory: StepFactory; titleKey: string }
> = {
  student: { factory: createStudentTourSteps, titleKey: "tour.student.title" },
  trainer: { factory: createTrainerTourSteps, titleKey: "tour.trainer.title" },
  mentor: { factory: createTrainerTourSteps, titleKey: "tour.trainer.title" },
  admin: { factory: createAdminTourSteps, titleKey: "tour.admin.title" },
  super_admin: { factory: createSuperAdminTourSteps, titleKey: "tour.superAdmin.title" },
  client: { factory: createAdminTourSteps, titleKey: "tour.admin.title" },
};
