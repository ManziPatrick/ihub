import { trainers } from '../users/trainers';

/**
 * Default team ensured by the course seeder.
 * - admin@bootskills.com is ALWAYS the default instructor for seeded courses.
 * - Trainers are the SAME people as backend/src/seedTrainers.ts so courses
 *   can later be reassigned to a real human instructor.
 * Find-or-create by email: safe to run many times, never duplicates.
 */
export interface TeamMemberSeed {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'trainer';
  phone: string;
  bio?: string;
  title?: string;
  location?: string;
  avatar?: string;
  permissions?: string[];
  trainerApplication?: Record<string, unknown>;
}

export const ADMIN_EMAIL = 'admin@bootskills.com';

const ALL_PERMISSIONS = ['users', 'courses', 'payments', 'internships', 'analytics', 'students'];

// House convention phones (seedFullUsers/seedComprehensiveDemo use +25078000000x)
const TRAINER_PHONES = [
  '+250780000010',
  '+250780000011',
  '+250780000012',
  '+250780000013',
  '+250780000014',
  '+250780000015',
  '+250780000016',
  '+250780000017',
  '+250780000018',
  '+250780000019',
];

export const team: TeamMemberSeed[] = [
  {
    fullName: 'Bootskills Admin',
    username: 'admin',
    email: ADMIN_EMAIL,
    password: 'Password@123',
    role: 'admin',
    phone: '+250780000001',
    bio: 'Platform administrator and default course instructor.',
    permissions: ALL_PERMISSIONS,
  },
  ...trainers.map((t, i) => ({
    fullName: t.fullName,
    username: t.username,
    email: t.email,
    password: 'Password@123',
    role: 'trainer' as const,
    phone: TRAINER_PHONES[i % TRAINER_PHONES.length],
    bio: t.bio,
    title: t.title,
    location: t.location,
    avatar: t.avatar,
    trainerApplication: t.trainerApplication,
  })),
];
