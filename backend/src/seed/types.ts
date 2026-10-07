import { z } from 'zod';

/**
 * Reusable course-seed shapes for bootskills.com / ihub.
 * Every file in src/seed/courses/<slug>/ is validated against CourseSchema
 * by src/seed/seed-courses.ts before anything touches MongoDB.
 */

// ---------------------------------------------------------------- video ---
export const VideoKindSchema = z.enum(['full', 'short', 'short-clip']);
export type VideoKind = z.infer<typeof VideoKindSchema>;

export const VideoSchema = z.object({
  kind: VideoKindSchema,
  /** Display title. For verified videos this MUST match the JSON source. */
  title: z.string().min(1).nullable().default(null),
  channel: z.string().nullable().default(null),
  /** Real, verified YouTube URL — or null when no video exists yet. */
  youtubeUrl: z.string().url().nullable().default(null),
  /** Used only when youtubeUrl is null: what to search for later. */
  searchQuery: z.string().nullable().default(null),
  durationSeconds: z.number().int().positive().nullable().default(null),
  /** strong = title matches the topic. partial = inside a bigger video. weak = related only. */
  fit: z.enum(['strong', 'partial', 'weak']).nullable().default(null),
  /** Keep the curator note (language warnings, "very long", ...) so it stays visible. */
  note: z.string().nullable().default(null),
});
export type SeedVideo = z.infer<typeof VideoSchema>;

// ---------------------------------------------------------------- logic ---
export const PredictSnippetSchema = z.object({
  code: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  explanation: z.string().min(1),
});

export const FindTheBugSchema = z.object({
  code: z.string().min(1),
  hint: z.string().min(1),
  fixedCode: z.string().min(1),
  explanation: z.string().min(1),
});

export const ChallengeSchema = z.object({
  level: z.enum(['easy', 'medium', 'hard']),
  title: z.string().min(1),
  brief: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string().min(1)).length(3),
  /** Steps in words, NOT full code. */
  solutionOutline: z.array(z.string().min(1)).min(1),
});

export const LogicTrainingSchema = z.object({
  thinkFirst: z.array(z.string().min(1)).min(4).max(6),
  predictTheOutput: z.array(PredictSnippetSchema).length(2),
  findTheBug: FindTheBugSchema,
  challenges: z.array(ChallengeSchema).length(3),
});
export type SeedLogicTraining = z.infer<typeof LogicTrainingSchema>;

// ---------------------------------------------------------------- module --
export const QuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

export const CodeExampleSchema = z.object({
  title: z.string().min(1),
  language: z.string().default('jsx'),
  code: z.string().min(1),
  note: z.string().nullable().default(null),
});

export const PracticeLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const SceneSchema = z.object({
  onScreen: z.string().min(1),
  voiceover: z.string().min(1),
});

export const ModuleSchema = z.object({
  order: z.number().int().positive(),
  slug: z.string().min(1),
  title: z.string().min(1),
  /** One sentence: what the learner can do after this module. */
  goal: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  /** Project slug built in this module, or null. */
  projectSlug: z.string().nullable().default(null),
  videos: z.array(VideoSchema),
  /** 3-5 scenes, 60-120 seconds total, for recording your own fallback video. */
  scriptFallback: z.array(SceneSchema).min(3).max(5),
  /** 3-5 short paragraphs. HOW it works first (everyday analogy), then code. */
  learn: z.array(z.string().min(1)).min(3).max(5),
  codeExample: CodeExampleSchema,
  realExample: z.string().min(1),
  logicTraining: LogicTrainingSchema,
  practiceLinks: z.array(PracticeLinkSchema),
  quiz: z.array(QuizQuestionSchema).length(4),
});
export type SeedModule = z.infer<typeof ModuleSchema>;
/** Use this for authoring module files: fields with defaults may be omitted. */
export type SeedModuleInput = z.input<typeof ModuleSchema>;

// ---------------------------------------------------------------- project -
export const LogicMapSchema = z.object({
  data: z.string().min(1),
  state: z.string().min(1),
  events: z.string().min(1),
  screen: z.string().min(1),
});

export const ProjectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  moduleSlug: z.string().min(1),
  goal: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  stretchGoals: z.array(z.string().min(1)).default([]),
  logicMap: LogicMapSchema,
});
export type SeedProject = z.infer<typeof ProjectSchema>;

// ---------------------------------------------------------------- exam ----
export const ExamQuestionSchema = QuizQuestionSchema.extend({
  moduleSlug: z.string().min(1),
});

export const ExamSchema = z.object({
  title: z.string().min(1),
  passScorePercent: z.number().int().default(70),
  questions: z.array(ExamQuestionSchema).length(25),
});
export type SeedExam = z.infer<typeof ExamSchema>;

// ---------------------------------------------------------------- capstone -
export const CapstoneSchema = z.object({
  title: z.string().min(1),
  brief: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  selfReviewChecklist: z.array(z.string().min(1)).min(1),
});
export type SeedCapstone = z.infer<typeof CapstoneSchema>;

// ---------------------------------------------------------------- course ---
export const CourseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  level: z.string().default('Beginner'),
  language: z.literal('en'),
  estimatedHours: z.number().positive(),
  description: z.string().min(1),
  whatYouWillLearn: z.array(z.string().min(1)).min(1),
  prerequisites: z.array(z.string().min(1)),
  /** Project slugs in build order. */
  projects: z.array(z.string().min(1)),
  /** Always false until the course is reviewed and published by hand. */
  published: z.boolean().default(false),
  modules: z.array(ModuleSchema).min(1),
  projectsDetail: z.array(ProjectSchema),
  exam: ExamSchema,
  capstone: CapstoneSchema,
});
export type SeedCourse = z.infer<typeof CourseSchema>;
/** Use this for authoring course index files: fields with defaults may be omitted. */
export type SeedCourseInput = z.input<typeof CourseSchema>;
