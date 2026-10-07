import type { SeedCapstone } from '../../types';

export const capstone: SeedCapstone = {
  title: 'Capstone: Professional App in Next.js',
  brief:
    'Plan, build, and deploy a complete professional app in Next.js — for example a small shop, booking site, or blog with accounts. It must use shared state (context or Redux Toolkit), routing with protected pages, server and client components, loading and error states everywhere, and a public deployment link.',
  features: [
    'At least 4 routes with a shared layout and menu',
    'Server components fetching real data with loading and error states',
    'Client islands only where interaction needs them',
    'Global state (cart, session, or theme) without prop drilling',
    'One protected page behind a login guard',
    'Forms with validation and friendly errors',
    'Accessible markup: real buttons, labeled inputs, keyboard usable',
    'Public deployment link plus README with setup steps',
  ],
  acceptanceCriteria: [
    'Public link opens the app with no console errors',
    'Every fetch shows loading, then data or a friendly error',
    'Guests cannot open the protected page; login returns them to it',
    'No invented data: real API or clearly seeded demo data',
    'README explains how to run, test, and deploy the app',
  ],
  selfReviewChecklist: [
    'Can I explain my folder structure in 30 seconds?',
    'Does each page handle loading, error, and empty states?',
    'Did I keep "use client" islands as small as possible?',
    'Can I use the whole app with keyboard only?',
    'Would I proudly show this link to an employer?',
  ],
};

export default capstone;
