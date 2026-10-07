# Seed system — reusable course seeder

Location: `backend/src/seed/` (inside the backend package so `ts-node` and
`tsc` both work; the backend uses Mongoose, so there are no SQL migrations).

## Layout

```
src/seed/
  types.ts              Zod schemas + TS types (Course, Module, Project, Exam, Capstone)
  seed-courses.ts       Runner: loads every course dir, validates, UPSERTS (safe to re-run)
  lib/map-to-model.ts   Maps rich seed content → Course-model lessons the portal UI renders
  data/                 Verified video JSON files (copy verbatim, never edit URLs)
  courses/_template.ts  Empty module showing every field with comments (ignored by runner)
  courses/<slug>/       One course: index.ts + modules/*.ts + projects.ts + exam.ts + capstone.ts
```

## Add a new course

1. Copy `courses/_template.ts` shape into `courses/<new-slug>/modules/01-....ts` files.
2. Save verified videos into `data/<course>-videos-verified.json` (same shape as
   `react-videos-verified.json`: `topics[]` with `moduleSlug`, `videos[]`, `searchQueryIfMissing`).
3. Only use `youtubeUrl`s from that file. Missing video? Use
   `{ kind: "short", youtubeUrl: null, searchQuery: "..." }` and always write `scriptFallback`.
4. Add `projects.ts`, `exam.ts` (25 questions, `passScorePercent: 70`), `capstone.ts`,
   and `index.ts` that imports them all.
5. Run `npm run seed:course -- <new-slug>`. Fix validation errors. Run twice to
   prove no duplicates. Keep `published: false` until reviewed.

## Writing rules (apply to ALL content)

- Original content only. Very easy English. Short sentences. No walls of text.
- Every module explains HOW it works first (everyday analogy), then shows code.
- Define each new term the first time it appears. One idea per Short.
- Code: correct, runnable, under 40 lines, modern React (functions + hooks).
- Quiz distractors believable; each explanation one sentence.
- Never invent URLs, versions, statistics, or video IDs. If unsure, leave it out.
- `practiceLinks`: only react.dev, developer.mozilla.org, redux-toolkit.js.org,
  nextjs.org/docs, reactrouter.com, javascript.info, vite.dev (main docs page if unsure).

## Run

```bash
cd backend
npm run seed:courses              # seed every course in courses/
npm run seed:course -- <slug>     # seed one course, e.g. react-complete-path
```

Upsert key is the course **title** (the Course model has no slug field), so
re-running updates in place and never duplicates. `published: false` seeds as
`status: 'draft'` — never production-visible until published by hand.
