import type { SeedCourseInput } from '../../types';
import mod01 from './modules/01-how-react-works';
import mod02 from './modules/02-setup-vite';
import mod03 from './modules/03-jsx-components-props';
import mod04 from './modules/04-state-and-events';
import mod05 from './modules/05-lists-and-conditions';
import mod06 from './modules/06-forms';
import mod07 from './modules/07-effects-and-fetching';
import mod08 from './modules/08-more-hooks';
import mod09 from './modules/09-reusable-components-custom-hooks';
import mod10 from './modules/10-context-and-patterns';
import mod11 from './modules/11-redux-toolkit';
import mod12 from './modules/12-react-router';
import mod13 from './modules/13-performance';
import mod14 from './modules/14-nextjs';
import mod15 from './modules/15-professional-practices';
import { projects } from './projects';
import exam from './exam';
import capstone from './capstone';

const course: SeedCourseInput = {
  slug: 'react-complete-path',
  title: 'React Complete Path: Beginner to Advanced',
  subtitle: 'From your first component to deployed Next.js apps with Redux, Router, and pro practices.',
  level: 'Beginner',
  language: 'en',
  estimatedHours: 60,
  description:
    'Become an advanced React developer. Build 12 projects including a professional app. Use Redux Toolkit, React Router and Next.js. Master state management and design patterns. Create reusable components and custom hooks. Optimize performance and understand advanced React features. No React experience needed, only basic JavaScript.',
  whatYouWillLearn: [
    'Become an advanced React developer, starting from zero React experience.',
    'Build 12 projects including a professional deployed app.',
    'Use Redux Toolkit, React Router and Next.js in real projects.',
    'Master state management: useState, useReducer, Context, and Redux.',
    'Create reusable components and custom hooks with design patterns.',
    'Optimize performance and understand advanced React features.',
  ],
  prerequisites: [
    'Basic JavaScript: variables, functions, arrays, and objects.',
    'A computer with Node.js and VS Code installed (module 2 shows how).',
  ],
  projects: projects.map((p) => p.slug),
  published: true,
  modules: [mod01, mod02, mod03, mod04, mod05, mod06, mod07, mod08, mod09, mod10, mod11, mod12, mod13, mod14, mod15],
  projectsDetail: projects,
  exam,
  capstone,
};

export default course;
