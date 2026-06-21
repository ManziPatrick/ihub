import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  generateCoursePDF,
  generateUsersCSV,
  generateCoursesCSV,
  generateProgramsCSV,
  generateInternsCSV,
  generateEnrollmentsCSV,
} from '../services/course-export.service';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * GET /api/export/course/:id/pdf
 * Export a full course as a downloadable PDF
 */
router.get('/course/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const { filepath, filename } = await generateCoursePDF(req.params.id as string);
    const absolutePath = path.join(__dirname, '../..', filepath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Generated file not found' });
    }

    res.download(absolutePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        // Clean up temp file after download attempt
        fs.unlink(absolutePath, () => {});
      } else {
        // Clean up temp file after successful download
        setTimeout(() => fs.unlink(absolutePath, () => {}), 5000);
      }
    });
  } catch (error: any) {
    console.error('Course PDF export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * GET /api/export/users/csv
 * Export users report as CSV
 * Query params: role, createdBy, enrolledCourseId
 */
router.get('/users/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const csv = await generateUsersCSV({
      role: String(req.query.role || ''),
      createdBy: String(req.query.createdBy || ''),
      enrolledCourseId: String(req.query.enrolledCourseId || ''),
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Users CSV export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * GET /api/export/courses/csv
 * Export courses report as CSV
 */
router.get('/courses/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const csv = await generateCoursesCSV(String(req.query.createdBy || ''));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="courses_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Courses CSV export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * GET /api/export/programs/csv
 * Export internship programs report as CSV
 */
router.get('/programs/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const csv = await generateProgramsCSV(String(req.query.createdBy || ''));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="programs_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Programs CSV export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * GET /api/export/interns/csv
 * Export intern participants report as CSV
 * Query params: stage, mentorId
 */
router.get('/interns/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const csv = await generateInternsCSV(
      String(req.query.stage || ''),
      String(req.query.mentorId || '')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="interns_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Interns CSV export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

/**
 * GET /api/export/enrollments/csv
 * Export course enrollment details as CSV
 */
router.get('/enrollments/csv', requireAuth, async (req: Request, res: Response) => {
  try {
    const csv = await generateEnrollmentsCSV(
      String(req.query.courseId || ''),
      String(req.query.instructorId || '')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="enrollments_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Enrollments CSV export error:', error);
    res.status(500).json({ error: error.message || 'Export failed' });
  }
});

export default router;
