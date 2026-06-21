import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Internship } from '../models/Internship';
import { InternshipProgram } from '../models/internship/InternshipProgram';

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

      // Description
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#555555')
        .text((course as any).description || '', margin, 175, {
          width: contentWidth,
          align: 'center',
          lineGap: 4,
        });

      // Metadata
      const metaY = 240;
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

        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(`Module ${mIdx + 1}: ${mod.title}`, margin + 16, startY + 8);

        if (mod.description) {
          doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#666666')
            .text(mod.description, margin + 16, startY + 38, {
              width: contentWidth - 32,
              lineGap: 2,
            });
        }

        // Lessons
        const lessons = mod.lessons || [];
        lessons.forEach((lesson: any, lIdx: number) => {
          const ly = doc.y + 12;

          // Check page break
          if (ly > doc.page.height - 80) {
            doc.addPage();
            doc.rect(0, 0, pageWidth, 8).fill('#1a365d');
            doc.fontSize(7).font('Helvetica').fillColor('#ffffff')
              .text((course as any).title, margin, 1, { width: contentWidth, align: 'center' });
          }

          const lessonY = doc.y + 12;

          // Lesson row background
          doc.rect(margin + 6, lessonY, contentWidth - 6, 1).fill('#eeeeee');

          // Type badge
          const typeColors: Record<string, string> = {
            video: '#3b82f6', pdf: '#22c55e', ppt: '#f97316',
            quiz: '#eab308', assignment: '#8b5cf6', book: '#a855f7', article: '#06b6d4',
          };
          const typeColor = typeColors[lesson.type] || '#888888';

          doc.roundedRect(margin + 12, lessonY + 2, 50, 14, 3)
            .fill(typeColor);
          doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(lesson.type?.toUpperCase() || 'VIDEO', margin + 15, lessonY + 4, { width: 44, align: 'center' });

          // Lesson title & duration
          doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#333333')
            .text(lesson.title || 'Untitled Lesson', margin + 70, lessonY + 2);

          doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#999999')
            .text(`${lesson.duration || 0} min`, margin + contentWidth - 70, lessonY + 3, { width: 50, align: 'right' });

          // Content snippet
          if (lesson.content) {
            doc.fontSize(8)
              .font('Helvetica')
              .fillColor('#888888')
              .text(lesson.content.substring(0, 200), margin + 70, lessonY + 16, {
                width: contentWidth - 100,
                lineGap: 1,
              });
            doc.y += 28;
          } else {
            doc.y += 18;
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
    (u.enrolledCourses || []).map((c: any) => c.title).join('; '),
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
