import mongoose from 'mongoose';
import type { SeedCourse, SeedModule } from '../types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const paras = (items: string[]) => items.map((p) => `<p>${esc(p)}</p>`).join('\n');
const bullets = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const codeBlock = (code: string, lang = 'jsx') =>
  `<pre><code class="language-${lang}">${esc(code)}</code></pre>`;
const ytLink = (v: { title?: string | null; channel?: string | null; youtubeUrl?: string | null; kind: string; fit?: string | null; note?: string | null; searchQuery?: string | null }) => {
  const label = esc(v.title ?? v.searchQuery ?? 'Untitled video');
  const meta = [v.kind, v.channel ? `by ${v.channel}` : null, v.fit ? `fit: ${v.fit}` : null]
    .filter(Boolean)
    .join(' · ');
  const note = v.note ? ` — <em>${esc(v.note)}</em>` : '';
  if (v.youtubeUrl) return `<li><a href="${v.youtubeUrl}" target="_blank" rel="noopener">${label}</a> (${esc(meta)})${note}</li>`;
  return `<li>🎬 <strong>Video needed</strong> — search YouTube for: “${esc(v.searchQuery ?? '')}” (${esc(meta)})</li>`;
};

function learnLesson(m: SeedModule) {
  return {
    title: `📖 Learn: ${m.title}`,
    type: 'article',
    duration: Math.max(8, Math.round(m.estimatedMinutes * 0.3)),
    content: [
      `<p><strong>Goal:</strong> ${esc(m.goal)}</p>`,
      paras(m.learn),
      `<h3>🌍 Real example</h3><p>${esc(m.realExample)}</p>`,
      `<h3>🎬 Videos for this module</h3><ul>${m.videos.map(ytLink).join('')}</ul>`,
      `<h3>🎙️ If I record it myself (60–120s)</h3><ol>${m.scriptFallback
        .map((s) => `<li><strong>Screen:</strong> ${esc(s.onScreen)}<br/><strong>Say:</strong> ${esc(s.voiceover)}</li>`)
        .join('')}</ol>`,
      `<h3>🔗 Practice</h3>${bullets(m.practiceLinks.map((p) => `${p.label}: ${p.url}`))}`,
    ].join('\n'),
    resources: m.practiceLinks.map((p) => ({ title: p.label, url: p.url, type: 'link' as const })),
  };
}

function watchLesson(m: SeedModule) {
  const withUrl = m.videos.filter((v) => v.youtubeUrl);
  const shorts = withUrl.filter((v) => v.kind === 'short');
  const fulls = withUrl.filter((v) => v.kind !== 'short');
  const main = fulls[0] ?? withUrl[0];
  const missing = m.videos.filter((v) => !v.youtubeUrl);
  const body = [
    shorts.length ? `<h3>⚡ Short (one idea)</h3><ul>${shorts.map(ytLink).join('')}</ul>` : '',
    fulls.length ? `<h3>🎬 Full explanations</h3><ul>${fulls.map(ytLink).join('')}</ul>` : '',
    missing.length ? `<h3>⏳ Still needed</h3><ul>${missing.map(ytLink).join('')}</ul>` : '',
    `<h3>🎙️ Fallback script (record your own 60–120s)</h3><ol>${m.scriptFallback
      .map((s) => `<li><strong>Screen:</strong> ${esc(s.onScreen)}<br/><strong>Say:</strong> ${esc(s.voiceover)}</li>`)
      .join('')}</ol>`,
  ].join('\n');
  if (main?.youtubeUrl) {
    return {
      title: `🎬 Watch: ${m.title}`,
      type: 'video',
      videoUrl: main.youtubeUrl,
      videoTitle: main.title ?? m.title,
      duration: Math.max(5, Math.round(m.estimatedMinutes * 0.25)),
      content: `<p>Watch on YouTube if the player does not load: <a href="${main.youtubeUrl}" target="_blank" rel="noopener">${esc(main.title ?? 'video')}</a></p>` + body,
    };
  }
  return {
    title: `🎬 Watch: ${m.title} (video coming soon)`,
    type: 'article',
    duration: 5,
    content: `<p><strong>No verified video yet.</strong> Use the script below to record a 60–120 second clip.</p>` + body,
  };
}

function codeLogicLesson(m: SeedModule) {
  const lt = m.logicTraining;
  return {
    title: `💻 Code + Think: ${m.title}`,
    type: 'article',
    duration: Math.max(10, Math.round(m.estimatedMinutes * 0.3)),
    content: [
      `<h3>Example: ${esc(m.codeExample.title)}</h3>${codeBlock(m.codeExample.code, m.codeExample.language)}${m.codeExample.note ? `<p><em>${esc(m.codeExample.note)}</em></p>` : ''}`,
      `<h3>🤔 Think first (before you code)</h3>${bullets(lt.thinkFirst)}`,
      `<h3>🔮 Predict the output</h3>${lt.predictTheOutput
        .map(
          (p, i) =>
            `<p><strong>${i + 1}. ${esc(p.question)}</strong></p>${codeBlock(p.code)}<p>✅ Answer: ${esc(p.answer)} — ${esc(p.explanation)}</p>`,
        )
        .join('')}`,
      `<h3>🐞 Find the bug</h3><p><em>Hint: ${esc(lt.findTheBug.hint)}</em></p>${codeBlock(lt.findTheBug.code)}<p>✅ Fix: ${esc(lt.findTheBug.explanation)}</p>${codeBlock(lt.findTheBug.fixedCode)}`,
      `<h3>🏋️ Challenges (steps in words — write the code yourself)</h3>${lt.challenges
        .map(
          (c) =>
            `<p><strong>[${c.level}] ${esc(c.title)}</strong><br/>${esc(c.brief)}</p>${bullets(c.acceptanceCriteria.map((a) => `Done when: ${a}`))}<p>H💡 Hints:</p>${bullets(c.hints)}<p>🧭 Outline:</p>${bullets(c.solutionOutline)}`,
        )
        .join('')}`,
    ].join('\n'),
    codeExercises: [
      {
        id: `${m.slug}-example`,
        title: m.codeExample.title,
        description: `Study and retype this example, then change one thing to prove you understand it.`,
        language: 'javascript' as const,
        type: 'write' as const,
        initialCode: `// ${m.codeExample.title}\n// Retype the example from the lesson, then change one small thing.\n`,
        solutionCode: m.codeExample.code,
        testCode: '',
        expectedOutput: '',
      },
      {
        id: `${m.slug}-find-the-bug`,
        title: `Fix the bug: ${m.title}`,
        description: `${lt.findTheBug.hint}`,
        language: 'javascript' as const,
        type: 'fix' as const,
        initialCode: lt.findTheBug.code,
        solutionCode: lt.findTheBug.fixedCode,
        testCode: '',
        expectedOutput: '',
      },
    ],
  };
}

function quizLesson(m: SeedModule) {
  return {
    title: `✅ Quiz: ${m.title}`,
    type: 'quiz',
    duration: 8,
    content: `<p>4 questions. Read each one twice. Every answer is explained in one sentence.</p>`,
    quizQuestions: m.quiz.map((q) => ({
      questionText: q.question,
      type: 'multiple_choice' as const,
      options: q.options,
      correctOptionIndex: q.correctIndex,
      explanation: q.explanation,
    })),
  };
}

function projectLesson(course: SeedCourse, projectSlug: string) {
  const p = course.projectsDetail.find((x) => x.slug === projectSlug);
  if (!p) throw new Error(`Unknown projectSlug "${projectSlug}" — add it to projects.ts`);
  return {
    title: `🛠️ Project: ${p.title}`,
    type: 'project',
    duration: 120,
    content: [
      `<p><strong>Goal:</strong> ${esc(p.goal)}</p>`,
      `<h3>Build these features</h3>${bullets(p.features)}`,
      `<h3>Done when</h3>${bullets(p.acceptanceCriteria)}`,
      p.stretchGoals.length ? `<h3>Stretch goals</h3>${bullets(p.stretchGoals)}` : '',
      `<h3>🧠 Logic map: data → state → events → screen</h3><ul><li><strong>Data:</strong> ${esc(p.logicMap.data)}</li><li><strong>State:</strong> ${esc(p.logicMap.state)}</li><li><strong>Events:</strong> ${esc(p.logicMap.events)}</li><li><strong>Screen:</strong> ${esc(p.logicMap.screen)}</li></ul>`,
    ].join('\n'),
  };
}

/** Maps one rich seed module → the 4-5 lessons the portal UI already renders. */
export function mapModuleToLessons(course: SeedCourse, m: SeedModule) {
  const lessons: unknown[] = [learnLesson(m), watchLesson(m), codeLogicLesson(m), quizLesson(m)];
  if (m.projectSlug) lessons.push(projectLesson(course, m.projectSlug));
  return lessons;
}

/** Full SeedCourse → Course-model payload (instructor filled in by the runner). */
export function mapCourseToModel(course: SeedCourse, instructorId: mongoose.Types.ObjectId) {
  const modules = course.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      title: `Module ${m.order}: ${m.title}`,
      description: m.goal,
      learningOutcome: m.goal,
      hoursAllocated: Math.round((m.estimatedMinutes / 60) * 10) / 10,
      order: m.order,
      lessons: mapModuleToLessons(course, m),
    }));

  modules.push({
    title: `Module ${modules.length + 1}: ${course.exam.title}`,
    description: `Final exam. You need ${course.exam.passScorePercent}% to pass.`,
    learningOutcome: `Pass the final exam with ${course.exam.passScorePercent}% or more.`,
    hoursAllocated: 1,
    order: modules.length + 1,
    lessons: [
      {
        title: `📝 ${course.exam.title}`,
        type: 'quiz',
        duration: 45,
        content: `<p>25 questions from all modules. Pass score: ${course.exam.passScorePercent}%.</p>`,
        quizQuestions: course.exam.questions.map((q) => ({
          questionText: `[${q.moduleSlug}] ${q.question}`,
          type: 'multiple_choice' as const,
          options: q.options,
          correctOptionIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      },
    ],
  });

  modules.push({
    title: `Module ${modules.length + 1}: ${course.capstone.title}`,
    description: course.capstone.brief,
    learningOutcome: course.capstone.brief,
    hoursAllocated: 8,
    order: modules.length + 1,
    lessons: [
      {
        title: `🏆 ${course.capstone.title}`,
        type: 'project',
        duration: 480,
        content: [
          `<p>${esc(course.capstone.brief)}</p>`,
          `<h3>Build these features</h3>${bullets(course.capstone.features)}`,
          `<h3>Done when</h3>${bullets(course.capstone.acceptanceCriteria)}`,
          `<h3>Self-review checklist</h3>${bullets(course.capstone.selfReviewChecklist)}`,
        ].join('\n'),
      },
    ],
  });

  return {
    title: course.title,
    description: [
      `<p>${esc(course.description)}</p>`,
      `<p><strong>${esc(course.subtitle)}</strong></p>`,
      `<h3>What you will learn</h3>${bullets(course.whatYouWillLearn)}`,
      course.prerequisites.length ? `<h3>Prerequisites</h3>${bullets(course.prerequisites)}` : '',
      `<p>Course code: <code>${esc(course.slug)}</code> · Language: English · About ${course.estimatedHours} hours.</p>`,
    ].join('\n'),
    thumbnail:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner' as const, // entry requirement is basic JS; model enum allows one value
    category: 'Programming',
    price: 1000,
    discountPrice: 0,
    status: course.published ? ('published' as const) : ('draft' as const),
    passingScore: course.exam.passScorePercent,
    submissionRequired: true,
    instructor: instructorId,
    modules,
  };
}
