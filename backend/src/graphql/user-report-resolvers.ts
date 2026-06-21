import mongoose from 'mongoose';
import { User } from '../models/User';
import { CourseProgress } from '../models/CourseProgress';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certificate } from '../models/Certificate';
import { reportCache } from '../lib/reportCache';

export const userReportResolvers = {
  Query: {
    getUserFullReport: async (_: any, { userId }: { userId: string }, context: any) => {
      // ── Auth check ──
      if (!context.user) {
        throw new Error('Authentication required. Please log in.');
      }
      if (!['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Access denied. Only administrators can view user reports.');
      }

      // ── Validate userId ──
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID provided.');
      }

      // ── Check cache ──
      const cacheKey = `report:${userId}`;
      const cached = reportCache.get(cacheKey);
      if (cached) {
        console.log(`[UserReport Cache] HIT for user ${userId}`);
        return cached;
      }
      console.log(`[UserReport Cache] MISS for user ${userId}`);

      // ── Fetch user ──
      let user: any;
      try {
        user = await User.findById(userId)
          .populate('enrolledCourses')
          .populate('completedCourses')
          .populate('badges.badge');
      } catch (err: any) {
        console.error(`[UserReport] DB error fetching user ${userId}:`, err.message);
        throw new Error('Database error while fetching user data.');
      }

      if (!user) {
        throw new Error(`User not found with ID: ${userId}`);
      }

      // ── Fetch course progress ──
      let courseProgresses: any[] = [];
      try {
        courseProgresses = await CourseProgress.find({ userId });
      } catch (err: any) {
        console.error(`[UserReport] Error fetching course progress for ${userId}:`, err.message);
        // Non-blocking — continue with empty progress
      }

      // ── Fetch submissions ──
      let submissions: any[] = [];
      try {
        submissions = await AssignmentSubmission.find({ userId })
          .populate('courseId')
          .sort({ createdAt: -1 });
      } catch (err: any) {
        console.error(`[UserReport] Error fetching submissions for ${userId}:`, err.message);
      }

      // ── Fetch projects ──
      let projects: any[] = [];
      try {
        projects = await Project.find({ userId }).sort({ createdAt: -1 });
      } catch (err: any) {
        console.error(`[UserReport] Error fetching projects for ${userId}:`, err.message);
      }

      // ── Fetch internships ──
      let internships: any[] = [];
      try {
        internships = await Internship.find({ userId })
          .populate('mentorId', 'username fullName email')
          .populate('mentors', 'username fullName')
          .sort({ createdAt: -1 });
      } catch (err: any) {
        console.error(`[UserReport] Error fetching internships for ${userId}:`, err.message);
      }

      // ── Fetch certificates ──
      let certificates: any[] = [];
      try {
        const certs = await Certificate.find({ userId }).sort({ createdAt: -1 });
        certificates = certs.map((c: any) => ({
          id: c._id.toString(),
          courseTitle: c.courseTitle,
          status: c.status,
          grade: c.grade,
          progress: c.progress,
          issueDate: c.issueDate?.toISOString?.() || null,
          credentialId: c.credentialId,
          requirements: (c.requirements || []).map((r: any) => ({
            title: r.title,
            completed: r.completed,
            current: r.current,
            total: r.total,
          })),
        }));
      } catch (err: any) {
        console.error(`[UserReport] Error fetching certificates for ${userId}:`, err.message);
        // Non-blocking — certificate model may not exist yet
      }

      // ── Grades aggregation ──
      const allGrades: any[] = (user as any).grades || [];

      // ── Course progress with details ──
      const coursesWithProgress = ((user as any).enrolledCourses || []).map((course: any) => {
        const progress = courseProgresses.find(
          (cp: any) => cp.courseId.toString() === course._id.toString()
        );
        const courseGrades = allGrades.filter(
          (g: any) => g.courseId?.toString?.() === course._id.toString()
        );
        const courseSubmissions = submissions.filter(
          (s: any) => s.courseId?._id?.toString() === course._id.toString()
        );
        const isCompleted = (user as any).completedCourses?.some(
          (c: any) => c._id.toString() === course._id.toString()
        );
        const avgCourseGrade = courseGrades.length > 0
          ? Math.round(courseGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / courseGrades.length)
          : null;

        return {
          courseId: course._id.toString(),
          courseTitle: course.title || 'Unknown Course',
          courseThumbnail: course.thumbnail || null,
          courseLevel: course.level || null,
          courseCategory: course.category || null,
          overallProgress: progress?.overallProgress || 0,
          status: isCompleted ? 'completed' : progress?.status || 'active',
          totalTimeSpent: progress?.totalTimeSpent || 0,
          lastAccessed: progress?.lastAccessed?.toISOString?.() || null,
          completedLessons: progress?.lessons?.filter((l: any) => l.completed).length || 0,
          totalLessons: course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0,
          averageGrade: avgCourseGrade,
          gradesCount: courseGrades.length,
          submissionsCount: courseSubmissions.length,
          submissions: courseSubmissions.map((s: any) => ({
            submissionId: s._id.toString(),
            lessonId: s.lessonId,
            status: s.status,
            grade: s.grade,
            totalScore: s.totalScore,
            feedback: s.feedback,
            submittedAt: s.createdAt?.toISOString?.() || null,
          })),
        };
      });

      // ── Stats summary ──
      const totalLessonsCompleted = (user as any).completedLessons?.length || 0;
      const totalCourses = (user as any).enrolledCourses?.length || 0;
      const totalCoursesCompleted = (user as any).completedCourses?.length || 0;
      const totalProjects = projects.length;
      const completedProjects = projects.filter((p: any) => p.status === 'completed').length;
      const totalInternships = internships.length;
      const activeInternships = internships.filter(
        (i: any) => i.status === 'active' || i.status === 'in_progress'
      ).length;
      const avgGrade = allGrades.length > 0
        ? Math.round(allGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) / allGrades.length)
        : null;

      // ── Build report object ──
      const reportData = {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          avatar: user.avatar,
          phone: user.phone,
          location: user.location,
          title: user.title,
          bio: user.bio,
          school: (user as any).school || null,
          level: (user as any).level || null,
          xp: (user as any).xp || null,
          streak: (user as any).streak || null,
          createdAt: user.createdAt?.toISOString?.() || null,
        },
        stats: {
          totalCourses,
          totalCoursesCompleted,
          courseCompletionRate: totalCourses > 0 ? Math.round((totalCoursesCompleted / totalCourses) * 100) : 0,
          totalLessonsCompleted,
          averageGrade: avgGrade,
          totalGrades: allGrades.length,
          totalProjects,
          completedProjects,
          projectCompletionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
          totalInternships,
          activeInternships,
          totalSubmissions: submissions.length,
          passedSubmissions: submissions.filter(
            (s: any) => s.status === 'approved' || (s.grade && s.grade >= 70)
          ).length,
        },
        courses: coursesWithProgress,
        submissions: submissions.map((s: any) => ({
          submissionId: s._id.toString(),
          courseId: s.courseId?._id?.toString() || null,
          courseTitle: s.courseId?.title || 'Unknown Course',
          lessonId: s.lessonId,
          status: s.status,
          grade: s.grade,
          totalScore: s.totalScore,
          feedback: s.feedback,
          submittedAt: s.createdAt?.toISOString?.() || null,
        })),
        grades: allGrades.map((g: any) => ({
          courseId: g.courseId?.toString() || null,
          lessonId: g.lessonId?.toString() || null,
          lessonTitle: g.lesson?.title || null,
          score: g.score || 0,
          feedback: g.feedback || null,
          gradedAt: g.gradedAt?.toISOString?.() || g.gradedAt || null,
        })),
        projects: projects.map((p: any) => ({
          id: p._id.toString(),
          title: p.title,
          course: p.course,
          type: p.type,
          status: p.status,
          progress: p.progress || 0,
          grade: p.grade,
          feedback: p.feedback,
          deadline: p.deadline?.toISOString?.() || null,
          submittedAt: p.submittedAt?.toISOString?.() || null,
          createdAt: p.createdAt?.toISOString?.() || null,
          tasks: (p.tasks || []).map((t: any) => ({
            title: t.title,
            completed: t.completed,
            approved: t.approved,
          })),
        })),
        internships: internships.map((internship: any) => {
          const mentorData = internship.mentorId
            ? { id: internship.mentorId._id.toString(), username: internship.mentorId.username, fullName: internship.mentorId.fullName }
            : null;

          return {
            id: internship._id.toString(),
            title: internship.title,
            organization: internship.organization,
            cohort: internship.cohort,
            status: internship.status,
            stage: internship.stage,
            currentStage: internship.currentStage,
            progress: internship.progress || 0,
            startDate: internship.startDate?.toISOString?.() || internship.startDate || null,
            endDate: internship.endDate?.toISOString?.() || internship.endDate || null,
            mentor: mentorData,
            sprintReviews: (internship.sprintReviews || []).map((sr: any) => ({
              week: sr.week,
              grade: sr.grade,
              feedback: sr.feedback,
              date: sr.date?.toISOString?.() || sr.date?.toISOString?.() || null,
            })),
            milestones: (internship.milestones || []).map((m: any) => ({
              title: m.title,
              completed: m.completed,
              date: m.date?.toISOString?.() || m.date || null,
            })),
            tasks: (internship.tasks || []).map((t: any) => ({
              title: t.title,
              status: t.status,
              priority: t.priority,
            })),
            meetings: (internship.meetings || []).map((m: any) => ({
              title: m.title,
              time: m.time,
              type: m.type,
            })),
          };
        }),
        certificates,
      };

      // ── Store in cache (2 min TTL) ──
      reportCache.set(cacheKey, reportData);
      return reportData;
    },
  },

  Mutation: {
    /** Invalidate cached report for a specific user (e.g., after grade update). */
    invalidateReportCache: async (_: any, { userId }: { userId: string }, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const key = `report:${userId}`;
      reportCache.invalidate(key);
      console.log(`[UserReport Cache] INVALIDATED for user ${userId}`);
      return true;
    },

    /** Clear the entire report cache (maintenance). */
    clearReportCache: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      reportCache.clear();
      console.log('[UserReport Cache] FULL CLEAR');
      return true;
    },
  },
};
