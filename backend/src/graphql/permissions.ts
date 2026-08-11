import { GraphQLError } from 'graphql';

/**
 * Admin module permission keys — these match the checkboxes shown when a
 * super admin creates an admin account (SuperAdminAdmins.tsx).
 *
 *  - users       → User Management
 *  - courses     → Course Management
 *  - payments    → Payment Management
 *  - internships → Opportunity Management
 *  - analytics   → Analytics Access
 *  - students    → Student Management
 */
export const ADMIN_PERMISSIONS = [
  'users',
  'courses',
  'payments',
  'internships',
  'analytics',
  'students',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Super admins implicitly hold every permission. Regular admins only hold
 * the modules explicitly granted to them by the super admin.
 */
export function hasPermission(context: any, permission: AdminPermission): boolean {
  if (!context?.user) return false;
  if (context.user.role === 'super_admin') return true;
  if (context.user.role !== 'admin') return false;
  return Array.isArray(context.user.permissions) && context.user.permissions.includes(permission);
}

export function requirePermission(context: any, permission: AdminPermission, message?: string): void {
  if (!hasPermission(context, permission)) {
    throw new GraphQLError(
      message || `You do not have permission to access this module (${permission}).`,
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}
