import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Internship } from '../models/Internship';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { InternshipApplication } from '../models/internship/InternshipApplication';

// ─── Rich-text → plain-text helpers (markdown + HTML) ────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
};

/**
 * Strip HTML tags (keeping table cells readable) and decode common entities
 * so exported documents never print raw markup.
 */
export function stripHtml(text: string): string {
  if (!text) return '';
  let t = text;
  // Block tags → line breaks; table rows/cells → readable rows
  t = t
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<t[dh][^>]*>/gi, ' ');
  // Remove all remaining tags
  t = t.replace(/<[^>]+>/g, '');
  // Drop trailing table-cell separators left by row conversion
  t = t.replace(/\s*\|\s*(?=\n|$)/g, '');
  // Decode entities
  t = t.replace(/&[a-zA-Z#0-9]+;/g, (m) => HTML_ENTITIES[m.toLowerCase()] || m);
  return t;
}

/**
 * Strip markdown syntax so course content prints as clean plain text.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  let t = text;
  // Images → alt text; links → link text
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // Bold / italic / strike / inline code
  t = t
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
  // Headings → plain text line
  t = t.replace(/^#{1,6}\s*/gm, '');
  // Bullets → • bullets
  t = t.replace(/^\s*[-*+]\s+/gm, '• ');
  // Blockquotes and horizontal rules
  t = t.replace(/^\s*>\s?/gm, '');
  t = t.replace(/^\s*[-=]{3,}\s*$/gm, '');
  // Collapse repeated blank lines
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/** Convert markdown/HTML course content into clean printable text. */
export function cleanRichText(text: string): string {
  return stripMarkdown(stripHtml(text));
}

/** Truncate text at a word boundary — never mid-word. */
export function truncateAtWordBoundary(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…';
}

/**
 * Generate a PDF export of a full course — title, description, all modules & lessons
 */
export async function generateCoursePDF(courseId: string): Promise<{ filepath: string; filename: string }> {
  const course = await Course.findById(courseId)
    .populate('instructor', 'username fullName')
    .lean();

  if (!course) throw new Error('Course not found');

  const exportsDir = path.join(__dirname, '../../uploads/exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const slug = (course as any).title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  const filename = `course_${slug}_${Date.now()}.pdf`;
  const filepath = path.join(exportsDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - 2 * margin;

      // ── Cover Page ──
      // Top accent bar
      doc.rect(0, 0, pageWidth, 12).fill('#1a365d');

      doc.fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#1a365d')
        .text('COURSE OUTLINE', margin, 60, { width: contentWidth, align: 'center' });

      doc.moveTo(margin + 80, 100)
        .lineTo(pageWidth - margin - 80, 100)
        .lineWidth(2)
        .stroke('#667eea');

      // Title
      doc.fontSize(26)
        .font('Helvetica-Bold')
        .fillColor('#333333')
        .text((course as any).title, margin, 130, { width: contentWidth, align: 'center' });

      // Description (cleaned — no markdown/HTML leaks). Capped on the cover
      // so it can never collide with the metadata block below.
      const description = cleanRichText((course as any).description || '');
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#555555')
        .text(description || '', margin, 175, {
          width: contentWidth,
          align: 'center',
          lineGap: 4,
          height: 78,
          ellipsis: true,
        });

      // Metadata — placed after the description so long descriptions never overlap
      const metaY = Math.max(240, doc.y + 24);
      const metaItems = [
        { label: 'Category', value: (course as any).category },
        { label: 'Level', value: (course as any).level },
        { label: 'Instructor', value: (course as any).instructor?.username || 'N/A' },
        { label: 'Modules', value: ((course as any).modules?.length || 0).toString() },
        { label: 'Status', value: (course as any).status },
      ];

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#667eea');
      let my = metaY;
      const col1 = margin + 60;
      const col2 = pageWidth - margin - 60;

      metaItems.forEach((item, i) => {
        const x = i < 3 ? col1 : col2;
        if (i === 3) my = metaY;
        const y = my + (i % 3) * 28;

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#999999')
          .text(item.label.toUpperCase(), x, y);
        doc.fontSize(11).font('Helvetica').fillColor('#333333')
          .text(item.value, x, y + 12);
      });

      // Bottom accent bar
      doc.rect(0, doc.page.height - 12, pageWidth, 12).fill('#1a365d');

      // ── Content Pages: Modules & Lessons ──
      // Full cleaned description (bullets + tables) belongs here, not truncated
      if (description) {
        doc.addPage();
        doc.rect(0, 0, pageWidth, 8).fill('#1a365d');
        doc.fontSize(7).font('Helvetica').fillColor('#ffffff')
          .text((course as any).title, margin, 1, { width: contentWidth, align: 'center' });
        doc.fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text('Course Overview', margin, doc.y + 24);
        doc.fontSize(9.5)
          .font('Helvetica')
          .fillColor('#444444')
          .text(description, margin, doc.y + 8, {
            width: contentWidth,
            lineGap: 3,
          });
        doc.y += 14;
      }

      const modules = (course as any).modules || [];

      modules.forEach((mod: any, mIdx: number) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 120 || mIdx === 0) {
          doc.addPage();
          // Page header
          doc.rect(0, 0, pageWidth, 8).fill('#1a365d');
          doc.fontSize(7).font('Helvetica').fillColor('#ffffff')
            .text((course as any).title, margin, 1, { width: contentWidth, align: 'center' });
        }

        const startY = doc.y + 20;

        // Module header
        doc.rect(margin, startY, contentWidth, 32).fill('#f0f4ff');
        doc.rect(margin, startY, 6, 32).fill('#667eea');

        // Strip a leading "Module N:" from the title so we never print it twice
        const modTitle = (mod.title || '').replace(/^module\s+\d+\s*[:.]?\s*/i, '');
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(`Module ${mIdx + 1}: ${modTitle}`, margin + 16, startY + 8);

        if (mod.description) {
          const modDesc = cleanRichText(mod.description);
          doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#666666')
            .text(modDesc, margin + 16, startY + 38, {
              width: contentWidth - 32,
              lineGap: 2,
            });
        }

        // Lessons
        const lessons = mod.lessons || [];
        lessons.forEach((lesson: any) => {
          // Check page break
          if (doc.y > doc.page.height - 90) {
            doc.addPage();
            doc.rect(0, 0, pageWidth, 8).fill('#1a365d');
            doc.fontSize(7).font('Helvetica').fillColor('#ffffff')
              .text((course as any).title, margin, 1, { width: contentWidth, align: 'center' });
          }

          const lessonY = doc.y + 12;

          // Lesson row separator
          doc.rect(margin + 6, lessonY, contentWidth - 6, 1).fill('#eeeeee');

          // Type badge — width sized to the label so ASSIGNMENT never wraps
          const typeColors: Record<string, string> = {
            video: '#3b82f6', pdf: '#22c55e', ppt: '#f97316',
            quiz: '#eab308', assignment: '#8b5cf6', book: '#a855f7', article: '#06b6d4',
          };
          const typeColor = typeColors[lesson.type] || '#888888';
          const typeLabel = (lesson.type || 'video').toUpperCase();
          const badgeWidth = Math.max(50, typeLabel.length * 5.2 + 18);

          doc.roundedRect(margin + 12, lessonY + 2, badgeWidth, 14, 3).fill(typeColor);
          doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(typeLabel, margin + 15, lessonY + 4, { width: badgeWidth - 6, align: 'center' });

          // Lesson title & duration
          const titleX = margin + badgeWidth + 22;
          const titleWidth = contentWidth - badgeWidth - 92;
          doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#333333')
            .text(cleanRichText(lesson.title) || 'Untitled Lesson', titleX, lessonY + 2, { width: titleWidth });
          // Capture the bottom of the title block BEFORE the duration call
          // (drawing duration at an absolute y resets doc.y back up).
          const titleBottomY = doc.y;

          doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#999999')
            .text(`${lesson.duration || 0} min`, margin + contentWidth - 70, lessonY + 3, { width: 58, align: 'right' });

          // Content snippet — clean text, truncated at a word boundary
          if (lesson.content) {
            const snippet = truncateAtWordBoundary(cleanRichText(lesson.content), 320);
            const snippetY = Math.max(titleBottomY, lessonY + 18);
            doc.fontSize(8)
              .font('Helvetica')
              .fillColor('#888888')
              .text(snippet, titleX, snippetY, {
                width: contentWidth - badgeWidth - 100,
                lineGap: 1,
              });
            doc.y += 6;
          } else {
            doc.y = Math.max(titleBottomY, lessonY + 18);
          }
        });

        doc.y += 10;
      });

      // Footer
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#999999')
        .text(
          `Generated by Bootskills Academy Hub — ${new Date().toLocaleDateString()}`,
          margin, doc.page.height - 40,
          { width: contentWidth, align: 'center' }
        );

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filepath: `/uploads/exports/${filename}`, filename });
      });
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a CSV string of users report
 */
export async function generateUsersCSV(
  filter: { role?: string; createdBy?: string; enrolledCourseId?: string }
): Promise<string> {
  const query: any = { isDeleted: { $ne: true } };
  if (filter.role) query.role = filter.role;
  if (filter.createdBy) query.createdBy = filter.createdBy;

  let users = await User.find(query)
    .populate('enrolledCourses', 'title')
    .lean();

  // If filtering by enrolled course
  if (filter.enrolledCourseId) {
    users = users.filter((u: any) =>
      u.enrolledCourses?.some((c: any) =>
        c._id?.toString() === filter.enrolledCourseId || c.id === filter.enrolledCourseId
      )
    );
  }

  const headers = [
    'Username', 'Email', 'Role', 'Full Name', 'Phone', 'School',
    'Enrolled Courses', 'XP', 'Level', 'Academic Status',
    'Last Active', 'Created At'
  ];

  const rows = users.map((u: any) => [
    u.username || '',
    u.email || '',
    u.role || '',
    u.fullName || '',
    u.phone || '',
    u.school || '',
    (u.enrolledCourses || []).map((c: any) => (c ? c.title : '')).join('; '),
    u.xp || 0,
    u.level || 1,
    u.academicStatus || 'active',
    u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '',
    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Generate a CSV string of courses report
 */
export async function generateCoursesCSV(createdBy?: string): Promise<string> {
  const query: any = { isDeleted: { $ne: true } };
  if (createdBy) {
    query.$or = [{ instructor: createdBy }, { createdBy }];
  }

  const courses = await Course.find(query)
    .populate('instructor', 'username')
    .populate('studentsEnrolled', 'username')
    .lean();

  const headers = [
    'Title', 'Category', 'Level', 'Status', 'Price', 'Discount Price',
    'Instructor', 'Modules', 'Total Lessons', 'Students Enrolled',
    'Enrollment Mode', 'School', 'Featured', 'Created At'
  ];

  const rows = courses.map((c: any) => [
    c.title || '',
    c.category || '',
    c.level || '',
    c.status || '',
    c.price || 0,
    c.discountPrice || 0,
    c.instructor?.username || '',
    c.modules?.length || 0,
    (c.modules || []).reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0),
    c.studentsEnrolled?.length || 0,
    c.enrollmentMode || 'direct',
    c.school || '',
    c.isFeatured ? 'Yes' : 'No',
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Generate a CSV string of internship programs report
 */
export async function generateProgramsCSV(createdBy?: string): Promise<string> {
  const query: any = { isDeleted: false };
  if (createdBy) query.createdBy = createdBy;

  const programs = await InternshipProgram.find(query).lean();

  const headers = [
    'Title', 'Status', 'Duration', 'Price', 'Currency',
    'Max Spots', 'Start Date', 'End Date', 'Application Deadline',
    'Created At'
  ];

  const rows = programs.map((p: any) => [
    p.title || '',
    p.status || '',
    p.duration || '',
    p.price || 0,
    p.currency || 'RWF',
    p.maxSpots || 0,
    p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
    p.endDate ? new Date(p.endDate).toLocaleDateString() : '',
    p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : '',
    p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Generate a CSV of internship applications with clean data (no HTML tags/descriptions)
 */
export async function generateApplicationsCSV(
  filter?: { programId?: string; status?: string }
): Promise<string> {
  const query: any = { isDeleted: false };
  if (filter?.programId) query.internshipProgramId = filter.programId;
  if (filter?.status) query.status = filter.status;

  const applications = await InternshipApplication.find(query)
    .populate('userId', 'username email fullName phone')
    .populate('internshipProgramId', 'title')
    .lean();

  // Collect all unique question labels for headers
  const allQuestionLabels = new Set<string>();
  applications.forEach((app: any) => {
    (app.applicationAnswers || []).forEach((a: any) => {
      if (a.questionLabel) allQuestionLabels.add(a.questionLabel);
    });
  });
  const questionLabels = Array.from(allQuestionLabels);

  const headers = [
    'Applicant Name', 'Email', 'Phone', 'Program',
    'Status', 'Skills', 'Availability', 'Applied Date',
    ...questionLabels,
  ];

  const stripHtml = (html: string): string => {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  const rows = applications.map((app: any) => {
    const answerMap: Record<string, string> = {};
    (app.applicationAnswers || []).forEach((a: any) => {
      answerMap[a.questionLabel] = stripHtml(a.answer || '');
    });

    return [
      app.userId?.fullName || app.userId?.username || '',
      app.userId?.email || '',
      app.userId?.phone || '',
      app.internshipProgramId?.title || '',
      app.status || '',
      (app.skills || []).join('; '),
      app.availability || '',
      app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '',
      ...questionLabels.map(label => answerMap[label] || ''),
    ];
  });

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Generate a CSV of internship participants by stage
 */
export async function generateInternsCSV(stage?: string, mentorId?: string): Promise<string> {
  const query: any = {};
  if (stage) query.stage = stage;
  if (mentorId) query.mentorId = mentorId;

  const interns = await Internship.find(query)
    .populate('userId', 'username email fullName phone')
    .populate('mentorId', 'username')
    .lean();

  const headers = [
    'Intern Name', 'Email', 'Phone', 'Program Title',
    'Stage', 'Status', 'Progress %', 'Mentor',
    'Start Date', 'End Date', 'Duration', 'Created At'
  ];

  const rows = interns.map((i: any) => [
    i.userId?.fullName || i.userId?.username || '',
    i.userId?.email || '',
    i.userId?.phone || '',
    i.title || '',
    i.stage || '',
    i.status || '',
    i.progress || 0,
    i.mentorId?.username || '',
    i.startDate ? new Date(i.startDate).toLocaleDateString() : '',
    i.endDate ? new Date(i.endDate).toLocaleDateString() : '',
    i.duration || '',
    i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '',
  ]);

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Generate a CSV string of enrollments for a course
 */
export async function generateEnrollmentsCSV(courseId?: string, instructorId?: string): Promise<string> {
  const query: any = { isDeleted: { $ne: true } };
  if (instructorId) {
    query.$or = [{ instructor: instructorId }, { createdBy: instructorId }];
  }

  let courses = await Course.find(query)
    .populate('studentsEnrolled', 'username email fullName phone school')
    .lean();

  if (courseId) {
    courses = courses.filter((c: any) => c._id.toString() === courseId);
  }

  const headers = [
    'Course Title', 'Student Name', 'Student Email', 'Student Phone',
    'Student School', 'Enrolled Date'
  ];

  const rows: string[][] = [];
  courses.forEach((c: any) => {
    (c.studentsEnrolled || []).forEach((s: any) => {
      // Populate can yield null for orphaned refs (student no longer exists) — skip them.
      if (!s) return;
      rows.push([
        c.title || '',
        s.fullName || s.username || '',
        s.email || '',
        s.phone || '',
        s.school || '',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      ]);
    });
  });

  return [headers.join(','), ...rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
}
