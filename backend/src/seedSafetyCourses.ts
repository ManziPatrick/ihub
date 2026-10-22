import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { SAFETY_COURSES, SafetyLesson } from './seed/data/safety-courses';

dotenv.config();

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function lessonHtml(l: SafetyLesson) {
  const links = l.sources
    .map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></li>`)
    .join('');
  return [
    `<p><strong>${esc(l.hook)}</strong></p>`,
    `<h3>Remember</h3><ul>${l.keyPoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
    `<h3>Why it matters</h3><p>${esc(l.example)}</p>`,
    `<h3>Do this now</h3><ul>${l.actions.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
    `<p><strong>Takeaway:</strong> ${esc(l.takeaway)}</p>`,
    links ? `<h3>Read more</h3><ul>${links}</ul>` : '',
  ].join('\n');
}

function mapLesson(l: SafetyLesson, order: number) {
  const options = [...l.quiz.options];
  if (options.length === 3) options.push('Not sure');
  return {
    title: l.title,
    content: lessonHtml(l),
    duration: 1,
    type: 'quiz',
    order,
    quizQuestions: [
      {
        questionText: l.quiz.question,
        type: 'multiple_choice',
        options,
        correctOptionIndex: l.quiz.answerIndex,
        explanation: l.takeaway,
      },
    ],
    quizConfig: { quizType: 'exercise', questionsPerPage: 1, timeLimit: 0, disableRightClick: false },
    resources: l.sources.map((url) => ({ title: 'Source', url, type: 'link' as const })),
  };
}

export async function ensureSafetyCourses() {
  const instructor =
    (await User.findOne({ role: 'super_admin', isDeleted: { $ne: true } })) ||
    (await User.findOne({ role: 'admin', isDeleted: { $ne: true } }));
  if (!instructor) {
    console.warn('[SafetyCourses] No admin/super_admin user found; skipping.');
    return;
  }

  for (const c of SAFETY_COURSES) {
    const modules = [
      {
        title: c.title,
        description: c.description,
        order: 1,
        hoursAllocated: Math.max(1, Math.round(c.lessons.length / 6)),
        learningOutcome: c.audience,
        lessons: c.lessons.map((l, i) => mapLesson(l, i + 1)),
      },
    ];
    const covers: Record<string, string> = {
      'Kids and Parents: Managing the Internet and AI':
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
      'Everyday People: AI Scams, Money and Privacy':
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
      'Companies: Safe AI at Work':
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      'Tech People: Keys, Patches and Trust':
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    };
    const payload = {
      title: c.title,
      description: c.description,
      thumbnail:
        covers[c.title] ||
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
      instructor: instructor._id,
      createdBy: instructor._id,
      price: 0,
      level: 'Beginner' as const,
      category: c.category,
      status: 'published' as const,
      isDeleted: false,
      isFeatured: c.title.startsWith('Kids and Parents'),
      enrollmentMode: 'direct' as const,
      allowedDeliveryModes: ['online'],
      school: 'Bootskills',
      sequentialLock: true,
      passingScore: 70,
      modules,
      modulesCount: 1,
      totalLessonsCount: c.lessons.length,
    };

    const existing = await Course.findOne({ title: c.title });
    if (existing) {
      await Course.updateOne({ _id: existing._id }, { $set: payload as any });
      console.log(`updated: ${c.title}`);
    } else {
      await Course.create(payload as any);
      console.log(`created: ${c.title}`);
    }
  }
}

async function run() {
  await connectDB();
  await ensureSafetyCourses();
  console.log('Safety courses ready.');
  process.exit(0);
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
