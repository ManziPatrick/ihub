import mongoose from 'mongoose';
import { User } from '../models/User';
import { CourseProgress } from '../models/CourseProgress';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { Project } from '../models/Project';
import { Internship } from '../models/Internship';
import { Certificate } from '../models/Certificate';
import { Course } from '../models/Course';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { InternshipApplication } from '../models/internship/InternshipApplication';
import { CourseApplication } from '../models/CourseApplication';
import { Payment } from '../models/Payment';
import { InternshipPayment } from '../models/internship/Payment';
import { reportCache } from '../lib/reportCache';

const notProvided = 'Not provided';


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
      // Important: even if populate fails (missing paths in some environments), we still want base user data.
      let user: any;
  try {
        user = await User.findById(userId)
          // ensure we have course metadata for the report "Courses" section
          .populate('enrolledCourses', 'title level category thumbnail modules')
          // User model stores badge refs under badges.badgeId (badges.badge would
          // throw for users without that path and silently skip the whole populate)
          .populate('badges.badgeId');
      } catch (err: any) {
        console.error(`[UserReport] populate error fetching user ${userId}:`, err?.message || err);
        user = await User.findById(userId);
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

      // ── Fetch submissions (populate course fields used by report printing) ──
      let submissions: any[] = [];
      try {
        submissions = await AssignmentSubmission.find({ userId })
          .populate('courseId', 'title level category thumbnail modules')
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

      // ── Role-specific content ──
      // The report adapts to the user's role:
      //   • admin / trainer → courses & programs they created, their students, revenue
      //   • super_admin     → platform-wide totals (all courses, programs, students, revenue)
      //   • student         → internship + course applications
      const isStaff = ['admin', 'trainer', 'super_admin'].includes(user.role);
      let createdCourses: any[] = [];
      let createdPrograms: any[] = [];
      let managedStudents: any[] = [];
      let revenue = 0;
      let applications: any[] = [];

      // Wrap the role-specific fetches in try/catch (matching the file's
      // defensive pattern) so one failing collection never breaks the report.
      try {
      if (user.role === 'super_admin') {
        // ── Platform-wide overview ──
        const [allCourses, allPrograms, allStudents, paymentsAgg, internshipPaymentsAgg] = await Promise.all([
          Course.find({ isDeleted: { $ne: true } }).populate('instructor', 'username fullName email').sort({ createdAt: -1 }),
          InternshipProgram.find({ isDeleted: false }).sort({ createdAt: -1 }),
          User.find({ role: 'student', isDeleted: { $ne: true } }).select('username fullName email avatar school createdAt').sort({ createdAt: -1 }),
          Payment.aggregate([
            { $match: { status: { $in: ['completed', 'paid', 'successful'] } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
          ]),
          InternshipPayment.aggregate([
            { $match: { status: 'paid', isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
        ]);
        createdCourses = allCourses.map((c: any) => ({
          id: c._id.toString(),
          title: c.title,
          category: c.category,
          level: c.level,
          price: c.price || 0,
          status: c.status,
          thumbnail: c.thumbnail || null,
          studentsEnrolledCount: c.studentsEnrolledCount ?? (c.studentsEnrolled?.length || 0),
          modulesCount: c.modulesCount ?? (c.modules?.length || 0),
          createdAt: c.createdAt?.toISOString?.() || null,
          instructor: c.instructor ? { id: c.instructor._id.toString(), username: c.instructor.username, fullName: c.instructor.fullName } : null,
        }));
        createdPrograms = allPrograms.map((p: any) => ({
          id: p._id.toString(),
          title: p.title,
          organization: p.organization || 'Ihub Academy',
          status: p.status || 'active',
          price: p.price || 0,
          duration: p.duration,
          startDate: p.startDate?.toISOString?.() || null,
          endDate: p.endDate?.toISOString?.() || null,
          createdAt: p.createdAt?.toISOString?.() || null,
        }));
        managedStudents = allStudents.map((s: any) => ({
          id: s._id.toString(),
          username: s.username,
          fullName: s.fullName,
          email: s.email,
          avatar: s.avatar || null,
          school: s.school || null,
          createdAt: s.createdAt?.toISOString?.() || null,
        }));
        revenue = (paymentsAgg[0]?.total || 0) + (internshipPaymentsAgg[0]?.total || 0);
      } else if (user.role === 'admin' || user.role === 'trainer') {
        // ── Staff scope: their own courses, programs, students, revenue ──
        const staffCourses = await Course.find({
          $or: [{ createdBy: userId }, { instructor: userId }],
          isDeleted: { $ne: true },
        }).populate('instructor', 'username fullName email').sort({ createdAt: -1 });
        createdCourses = staffCourses.map((c: any) => ({
          id: c._id.toString(),
          title: c.title,
          category: c.category,
          level: c.level,
          price: c.price || 0,
          status: c.status,
          thumbnail: c.thumbnail || null,
          studentsEnrolledCount: c.studentsEnrolledCount ?? (c.studentsEnrolled?.length || 0),
          modulesCount: c.modulesCount ?? (c.modules?.length || 0),
          createdAt: c.createdAt?.toISOString?.() || null,
          instructor: c.instructor ? { id: c.instructor._id.toString(), username: c.instructor.username, fullName: c.instructor.fullName } : null,
        }));

        const staffCourseIds = staffCourses.map((c: any) => c._id);
        createdPrograms = (await InternshipProgram.find({ createdBy: userId, isDeleted: false }).sort({ createdAt: -1 }))
          .map((p: any) => ({
            id: p._id.toString(),
            title: p.title,
            organization: p.organization || 'Ihub Academy',
            status: p.status || 'active',
            price: p.price || 0,
            duration: p.duration,
            startDate: p.startDate?.toISOString?.() || null,
            endDate: p.endDate?.toISOString?.() || null,
            createdAt: p.createdAt?.toISOString?.() || null,
          }));

        // Students enrolled in their courses + approved into their programs
        const studentIdSet = new Set<string>();
        staffCourses.forEach((c: any) => (c.studentsEnrolled || []).forEach((sid: any) => studentIdSet.add(sid.toString())));
        const staffProgramIds = createdPrograms.map((p: any) => p.id);
        if (staffProgramIds.length > 0) {
          const approved = await InternshipApplication.find({ internshipProgramId: { $in: staffProgramIds }, status: 'approved' });
          approved.forEach((a: any) => studentIdSet.add(a.userId.toString()));
        }
        if (studentIdSet.size > 0) {
          managedStudents = (await User.find({ _id: { $in: Array.from(studentIdSet) }, isDeleted: { $ne: true } })
            .select('username fullName email avatar school createdAt')
            .sort({ createdAt: -1 }))
            .map((s: any) => ({
              id: s._id.toString(),
              username: s.username,
              fullName: s.fullName,
              email: s.email,
              avatar: s.avatar || null,
              school: s.school || null,
              createdAt: s.createdAt?.toISOString?.() || null,
            }));
        }

        // Revenue from their courses (standard payments) + internship fees (their programs)
        // Matches both plural `courseIds` and legacy singular `courseId` payment fields.
        const [standardRev, internshipRev] = await Promise.all([
          staffCourseIds.length > 0
            ? Payment.aggregate([
                { $match: { $or: [{ courseIds: { $in: staffCourseIds } }, { courseId: { $in: staffCourseIds } }], status: { $in: ['completed', 'paid', 'successful'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
              ])
            : Promise.resolve([]),
          staffProgramIds.length > 0
            ? InternshipPayment.aggregate([
                { $match: { internshipProgramId: { $in: staffProgramIds }, status: 'paid', isDeleted: false } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
              ])
            : Promise.resolve([]),
        ]);
        revenue = (standardRev[0]?.total || 0) + (internshipRev[0]?.total || 0);
      }
      } catch (err: any) {
        console.error(`[UserReport] Error fetching role-specific data for ${userId}:`, err?.message || err);
        // Non-blocking — keep empty arrays / zero revenue so the report still renders
      }

      // ── Applications (student view + staff program applications) ──
      if (user.role === 'student') {
        let internshipApps: any[] = [];
        let courseApps: any[] = [];
        try {
          [internshipApps, courseApps] = await Promise.all([
            InternshipApplication.find({ userId }).populate('internshipProgramId', 'title organization').sort({ createdAt: -1 }),
            CourseApplication.find({ userId }).populate('courseId', 'title category').sort({ createdAt: -1 }),
          ]);
        } catch (err: any) {
          console.error(`[UserReport] Error fetching applications for ${userId}:`, err?.message || err);
        }
        applications = [
          ...internshipApps.map((a: any) => ({
            id: a._id.toString(),
            type: 'opportunity',
            title: (a.internshipProgramId as any)?.title || 'Opportunity',
            organization: (a.internshipProgramId as any)?.organization || null,
            status: a.status,
            appliedAt: a.createdAt?.toISOString?.() || null,
          })),
          ...courseApps.map((a: any) => ({
            id: a._id.toString(),
            type: 'course',
            title: (a.courseId as any)?.title || 'Course',
            organization: null,
            status: a.status,
            appliedAt: a.createdAt?.toISOString?.() || null,
          })),
        ];
      }

      // ── Course progress with details (derive from submissions/course documents for reliable printing) ──
      const uniqueCourseIds = Array.from(
        new Set(
          submissions
            .map((s: any) => s.courseId?._id?.toString?.() || s.courseId?.toString?.())
            .filter(Boolean)
        )
      );

      // Load courses so we can compute title/level/category + totalLessons reliably.
      let coursesById: Record<string, any> = {};
      try {
        const loadedCourses = uniqueCourseIds.length
          ? await Course.find({ _id: { $in: uniqueCourseIds } })
              .populate('modules')
          : [];

        coursesById = loadedCourses.reduce((acc: Record<string, any>, c: any) => {
          acc[c._id.toString()] = c;
          return acc;
        }, {});
      } catch (e) {
        // Non-blocking — fallback to enrolledCourses
        coursesById = {};
      }

      const enrolledCourses = (user as any).enrolledCourses || [];
      const courseRefItems = enrolledCourses.length ? enrolledCourses : [];

      const coursesWithProgress = courseRefItems.map((course: any) => {
        const courseId = course?._id?.toString?.() || course?.toString?.();
        const progress = courseProgresses.find(
          (cp: any) => cp.courseId?.toString?.() === courseId
        );
        const courseGrades = allGrades.filter(
          (g: any) => g.courseId?.toString?.() === courseId
        );

        const courseSubmissions = submissions.filter(
          (s: any) => s.courseId?._id?.toString?.() === courseId
        );

        const isCompleted = (user as any).completedCourses?.some(
          (c: any) => c?._id?.toString?.() === courseId
        );

        const avgCourseGrade = courseGrades.length > 0
          ? Math.round(
              courseGrades.reduce((sum: number, g: any) => sum + (g.score || 0), 0) /
                courseGrades.length
            )
          : null;

        const loadedCourse = coursesById[courseId];
        const totalLessons = loadedCourse?.modules?.reduce(
          (acc: number, m: any) => acc + (m.lessons?.length || 0),
          0
        ) || 0;

        return {
          courseId: courseId,
          courseTitle:
            loadedCourse?.title || course.title || course.courseTitle || notProvided,
          courseThumbnail: loadedCourse?.thumbnail || course.thumbnail || null,
          courseLevel: loadedCourse?.level || course.level || null,
          courseCategory: loadedCourse?.category || course.category || null,
          overallProgress: progress?.overallProgress || 0,
          status: isCompleted ? 'completed' : progress?.status || 'active',
          totalTimeSpent: progress?.totalTimeSpent || 0,
          lastAccessed: progress?.lastAccessed?.toISOString?.() || null,
          completedLessons: progress?.lessons?.filter((l: any) => l.completed).length || 0,
          totalLessons,
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
          totalCreatedCourses: createdCourses.length,
          totalCreatedPrograms: createdPrograms.length,
          totalManagedStudents: managedStudents.length,
          totalApplications: applications.length,
          revenue,
        },
        courses: coursesWithProgress,
        submissions: submissions.map((s: any) => ({

          submissionId: s._id.toString(),
          lessonId: s.lessonId,
          status: s.status,
          grade: s.grade,
          totalScore: s.totalScore,
          feedback: s.feedback,
          submittedAt: s.createdAt?.toISOString?.() || null,
          courseId: s.courseId?._id?.toString() || null,
          courseTitle: s.courseId?.title || s.courseId?.courseTitle || 'Not provided',
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
        createdCourses,
        createdPrograms,
        managedStudents,
        applications,
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
