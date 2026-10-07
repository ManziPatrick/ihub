import type { SeedModule } from '../types';

/**
 * EMPTY MODULE TEMPLATE — copy this file to start a new module.
 * Every field is required unless marked optional. See src/seed/README.md
 * for the writing rules (Stage 3) before you fill anything in.
 */
export const templateModule: SeedModule = {
  // Position in the course, starting at 1. Must be unique in the course.
  order: 0,
  // URL-safe id, e.g. "jsx-components-props". Never change after publishing.
  slug: 'module-slug-here',
  // Short human title, e.g. "JSX, Components and Props".
  title: 'Module title here',
  // ONE sentence: what the learner can DO after this module.
  goal: 'One sentence starting with "Build" or "Use" or "Explain"...',
  // Realistic study time for the whole module.
  estimatedMinutes: 90,
  // Slug of the project built here (must exist in projects.ts), or null.
  projectSlug: null,

  // Curated videos. Rules:
  // - youtubeUrl must come from src/seed/data/*-verified.json. NEVER invent one.
  // - youtubeUrl: null + searchQuery means "no good video yet, find one later".
  // - Keep the curator "note" (language warnings etc.) so it stays visible.
  videos: [
    {
      kind: 'short', // "full" | "short" | "short-clip" — ONE idea per Short.
      title: 'Exact video title from YouTube',
      channel: 'Exact channel name from YouTube',
      youtubeUrl: 'https://www.youtube.com/watch?v=...', // or null
      searchQuery: null, // only when youtubeUrl is null
      durationSeconds: null,
      fit: 'strong', // "strong" | "partial" | "weak"
      note: null,
    },
  ],

  // Fallback script for recording your own 60-120 second video.
  // 3-5 scenes. You MUST always write this, even when videos exist.
  scriptFallback: [
    { onScreen: 'What the learner sees, e.g. "Code editor with ..."', voiceover: 'What you say (short sentence).' },
    { onScreen: '...', voiceover: '...' },
    { onScreen: '...', voiceover: '...' },
  ],

  // 3-5 SHORT paragraphs. Very easy English. Short sentences.
  // Paragraph 1: HOW the thing works, with an everyday analogy.
  // Then: define each new term the first time it appears, then show code.
  learn: [
    'Paragraph 1: the analogy. How does this work in everyday life?',
    'Paragraph 2: the React idea, in plain words. Define each new term.',
    'Paragraph 3: a tiny code sketch in words, and what to watch out for.',
  ],

  // Correct, runnable, under 40 lines. Modern React: functions + hooks.
  codeExample: {
    title: 'What this example shows',
    language: 'jsx',
    code: 'function Example() {\n  return <p>Hello</p>;\n}',
    note: null,
  },

  // 2-3 sentences: where is this used in a real app or website?
  realExample: 'Where a real company or app uses this.',

  // THE MOST IMPORTANT PART. Teach thinking, not copying.
  logicTraining: {
    // 4-6 questions to ask BEFORE coding (data? changes? screen states? risks?).
    thinkFirst: [
      'What data do I have?',
      'What changes over time?',
      'What must the screen show in each state?',
      'What can go wrong?',
    ],
    // EXACTLY 2 short snippets with question + answer + one-sentence explanation.
    predictTheOutput: [
      {
        code: '...',
        question: 'What shows on the screen?',
        answer: '...',
        explanation: 'One sentence.',
      },
      {
        code: '...',
        question: '...',
        answer: '...',
        explanation: 'One sentence.',
      },
    ],
    // 1 broken snippet with hint + fixed code + explanation.
    findTheBug: {
      code: '...broken code...',
      hint: 'Gentle nudge toward the bug.',
      fixedCode: '...fixed code...',
      explanation: 'One sentence.',
    },
    // EXACTLY 3 challenges: easy, medium, hard. Steps in words, NOT full code.
    challenges: [
      {
        level: 'easy',
        title: '...',
        brief: 'What to build, in 1-2 sentences.',
        acceptanceCriteria: ['It works when...'],
        hints: ['Gentle hint.', 'Stronger hint.', 'Almost the answer.'],
        solutionOutline: ['Step 1...', 'Step 2...'],
      },
      {
        level: 'medium',
        title: '...',
        brief: '...',
        acceptanceCriteria: ['...'],
        hints: ['...', '...', '...'],
        solutionOutline: ['...'],
      },
      {
        level: 'hard',
        title: '...',
        brief: '...',
        acceptanceCriteria: ['...'],
        hints: ['...', '...', '...'],
        solutionOutline: ['...'],
      },
    ],
  },

  // Only real, well-known docs URLs (react.dev, developer.mozilla.org,
  // redux-toolkit.js.org, nextjs.org/docs, reactrouter.com, javascript.info,
  // vite.dev). Unsure a deep page exists? Link the main docs page instead.
  practiceLinks: [{ label: 'React docs', url: 'https://react.dev/' }],

  // EXACTLY 4 questions. Distractors must be believable.
  // Each explanation is ONE sentence.
  quiz: [
    {
      question: '...',
      options: ['Correct answer', 'Believable wrong 1', 'Believable wrong 2', 'Believable wrong 3'],
      correctIndex: 0,
      explanation: 'One sentence.',
    },
    { question: '...', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'One sentence.' },
    { question: '...', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'One sentence.' },
    { question: '...', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'One sentence.' },
  ],
};
