import mongoose from 'mongoose';
import { User } from '../models/User';
import Notification from '../models/Notification';
import { Resource } from '../models/Resource';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { file as tmpFile } from 'tmp-promise';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '70229201375-gvb1jt3q0q9kjg4ivrahsl25h9n5qo4v.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PaymentTransaction } from '../models/PaymentTransaction';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    console.log('🔥 Initializing Firebase Admin with Service Account');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  } else {
    console.log('🔥 Initializing Firebase Admin with Project ID only');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "bootskills"
    });
  }
}
import { Message } from '../models/Message';
import { DiscountCode } from '../models/DiscountCode';
import { Conversation } from '../models/Conversation';
import { sendEmail, sendLoginOTPEmail, sendSuspiciousLoginAlert } from '../services/email.service';
import { haversineDistance, SUSPICIOUS_LOGIN_THRESHOLD_KM, checkSuspiciousLogin } from '../services/login-security.service';
import { Course } from '../models/Course';
import { ProjectApplication } from '../models/ProjectApplication';
import AICourse from '../models/AICourse';
import { Question } from '../models/Question';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { GraphQLError } from 'graphql';

const pubsub = new PubSub<any>();
import { Booking } from '../models/Booking';
import { Badge } from '../models/Badge';
import { Config } from '../models/Config';
import { AssignmentSubmission } from '../models/AssignmentSubmission';
import { Project, IProject } from '../models/Project';
import { ProjectTask } from '../models/ProjectTask';
import { Certificate } from '../models/Certificate';
import { Internship } from '../models/Internship';
import { Standup } from '../models/Standup';
import { CourseProgress } from '../models/CourseProgress';
import { CourseApplication } from '../models/CourseApplication';
import { Payment } from '../models/Payment';
import { generateUploadSignature } from '../services/upload.service';
import { v2 as cloudinary } from 'cloudinary';

const generateMeetLink = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
};
// @ts-ignore
import { GraphQLUpload } from 'graphql-upload';
import { pusher } from '../lib/pusher';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { InternshipApplication } from '../models/internship/InternshipApplication';
import { InternshipProject } from '../models/internship/InternshipProject';
import { InternshipTeam } from '../models/internship/Team';
import { InternshipTeamMember } from '../models/internship/TeamMember';
import { InternshipMilestone } from '../models/internship/Milestone';
import { InternshipSubmission } from '../models/internship/Submission';
import { InternshipTimeLog } from '../models/internship/TimeLog';
import { InternshipMentorFeedback } from '../models/internship/MentorFeedback';
import { NewsletterSubscription } from '../models/NewsletterSubscription';
import { InternshipActivityLog } from '../models/internship/ActivityLog';
import { InternshipComment } from '../models/internship/Comment';
import { StudentProfile } from '../models/StudentProfile';
import { InternshipPayment } from '../models/internship/Payment';
import { InternshipInvoice } from '../models/internship/Invoice';
import { InternshipCertificate } from '../models/internship/Certificate';
import { InternshipSprint } from '../models/internship/Sprint';
import { InternshipTask } from '../models/internship/Task';
import { InternshipMeeting } from '../models/internship/InternshipMeeting';
import { logActivity } from '../services/audit.service';
import { sendNotification, broadcastToTeam } from '../services/notification.service';
import { createPaymentIntent, createCheckoutSession, confirmPayment, refundPayment } from '../services/stripe.service';
import {
  sendApplicationConfirmation,
  sendApplicationStatusUpdate,
  sendPaymentConfirmation,
  sendCertificateIssued,
  sendFeedbackNotification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAdminNewUserNotification,
  sendMeetingInvitation,
  sendCourseEnrollmentConfirmation
} from '../services/email.service';
import { generateCertificatePDF, generateInvoicePDF } from '../services/pdf.service';
import { autoGenerateCertificate } from '../controllers/CertificateController';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { chatWithAIService, explainTaskService, reviewSubmissionService, batchReviewOpenQuestionsService, generateAIQuizService, hintForQuestionService, generateQuestionExplanationService, getChatGreeting, generateCodeTestsService } from '../services/ai.service';
import { compileCode, preGenerateExerciseTests } from '../services/compiler.service';
import { lookupRequestGeoLocation } from "../services/geoip.service";



import { scholarshipResolvers } from './scholarship-resolvers';

const DEFAULT_WORKFLOW = [
  { id: 'todo', label: 'To Do', color: 'slate', order: 0, type: 'todo' },
  { id: 'in_progress', label: 'In Progress', color: 'blue', order: 1, type: 'progress' },
  { id: 'in_testing', label: 'In Testing', color: 'orange', order: 2, type: 'testing' },
  { id: 'in_review', label: 'In Review', color: 'purple', order: 3, type: 'review' },
  { id: 'done', label: 'Done', color: 'yellow', order: 4, type: 'done' },
  { id: 'staged', label: 'Staged', color: 'cyan', order: 5, type: 'staged' },
  { id: 'completed', label: 'Completed', color: 'green', order: 6, type: 'completed' },
];

const calculateInternshipProgress = async (internship: any) => {
  // 1. Tasks Contribution (Internship-specific tasks)
  const totalTasks = internship.tasks ? internship.tasks.length : 0;
  const completedTasks = internship.tasks ? internship.tasks.filter((t: any) => t.status === 'completed').length : 0;

  // 2. Project Milestones Contribution
  let totalMilestones = 0;
  let completedMilestones = 0;

  // Internal milestones
  if (internship.milestones) {
    totalMilestones += internship.milestones.length;
    completedMilestones += internship.milestones.filter((m: any) => m.completed).length;
  }

  // Linked Project milestones
  if (internship.projects && internship.projects.length > 0) {
    for (const projId of internship.projects) {
      // Check if projId is object or ID
      const pid = (projId && (projId as any)._id) ? (projId as any)._id : projId;
      const project = await Project.findById(pid);
      if (project && (project as any).milestones) {
        totalMilestones += (project as any).milestones.length;
        completedMilestones += (project as any).milestones.filter((m: any) => m.completed || (m as any).status === 'approved').length;
      }
    }
  }

  // Stage Logic integration
  const currentStage = internship.currentStage || 1;
  const totalStages = 6;
  const baseProgress = ((currentStage - 1) / totalStages) * 100;

  const itemsInStage = totalTasks + totalMilestones;
  const completedInStage = completedTasks + completedMilestones;

  let stageContribution = 0;
  // If no items, assume 0 contribution (start of stage)
  if (itemsInStage > 0) {
    stageContribution = (completedInStage / itemsInStage) * (100 / totalStages);
  }

  return Math.min(100, Math.round(baseProgress + stageContribution));
}

const getAdminStudentIds = async (adminId: string) => {
  const [courses, internships, applications] = await Promise.all([
    Course.find({ $or: [{ instructor: adminId }, { createdBy: adminId }] }),
    InternshipProgram.find({ createdBy: adminId }),
    Internship.find({ mentorId: adminId })
  ]);

  const internshipIds = internships.map(i => i._id);
  const approvedApps = await InternshipApplication.find({
    internshipProgramId: { $in: internshipIds },
    status: 'approved'
  });

  const studentIds = new Set();
  courses.forEach((c) => {
    if (c.studentsEnrolled) {
      c.studentsEnrolled.forEach((s) => studentIds.add(s.toString()));
    }
  });
  approvedApps.forEach(app => studentIds.add(app.userId.toString()));
  applications.forEach(intern => studentIds.add(intern.userId.toString()));

  return Array.from(studentIds);
};

import { applicationPhaseResolvers } from './application-phase-resolvers';
import { projectTaskResolvers } from './project-task-resolvers';
import { locationResolvers } from './location-resolvers';
import { commissionResolvers } from './commission-resolvers';
import { disbursementResolvers } from './disbursement-resolvers.fixed';
import { broadcastResolvers } from './broadcast-resolvers';
import { uploadLogResolvers } from './upload-log-resolvers';
import { scheduledBroadcastResolvers } from './scheduled-broadcast-resolvers';
import { userReportResolvers } from './user-report-resolvers';
import { refundResolvers } from './refund-resolvers';
import { meetingAttendanceResolvers } from './meeting-attendance-resolvers';
import { errorReportResolvers } from './error-reporting-resolvers';
import { backupResolvers } from './backup-resolvers';

export const resolvers = {
  Upload: GraphQLUpload,
  Scholarship: scholarshipResolvers.Scholarship,
  BackupRecord: backupResolvers.BackupRecord,
  RestoreResult: backupResolvers.RestoreResult,
  Query: {
    ...applicationPhaseResolvers.Query,
    ...projectTaskResolvers.Query,    ...locationResolvers.Query,
    ...commissionResolvers.Query,    ...disbursementResolvers.Query,    ...scholarshipResolvers.Query,    ...userReportResolvers.Query,    ...refundResolvers.Query,
    ...meetingAttendanceResolvers.Query,
    ...errorReportResolvers.Query,
    ...backupResolvers.Query,
    // Ensure non-nullability: schema defines [ProjectApplication!]! but missing resolvers can return null.
    // This resolver returns an empty array when the user has no applications.
    myProjectApplications: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Admins and super_admins see all applications; clients see only their own.
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = { status: { $ne: 'deleted' } };
      if (!isAdmin) {
        filter.$or = [
          { clientId: context.user.id },
          { userId: context.user.id },
        ];
      }

      const apps = await ProjectApplication.find(filter).sort({ createdAt: -1 });

      return apps.map((app: any) => {
        const obj = app.toObject();
        return {
          ...obj,
          id: app._id.toString(),
          _id: app._id.toString(),
          clientId: app.clientId?.toString?.() || app.clientId,
          userId: app.userId?.toString?.() || app.userId,
          assignedAdmin: app.assignedAdmin?.toString?.() || app.assignedAdmin || undefined,
        };
      });
    },
    hello: () => 'Hello world from Apollo Server!',

    // Resource Queries
    getResources: async (_: any, { linkedTo, onModel }: any, context: any) => {
      const filter: any = {};
      if (linkedTo) filter.linkedTo = linkedTo;
      if (onModel) filter.onModel = onModel;

      // If student, only show public or interns_only resources
      if (!context.user || context.user.role === 'student') {
        filter.visibility = { $in: ['public', 'interns_only'] };
      }

      return await Resource.find(filter).populate('createdBy').sort({ createdAt: -1 });
    },

    getResource: async (_: any, { id }: any) => {
      return await Resource.findById(id).populate('createdBy');
    },

    getCodeExerciseAnswers: async (_: any, { courseId, lessonId, courseTitle }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const filter: any = { courseId };
      if (lessonId) filter.lessonId = lessonId;

      // For admin (non-super), restrict to their own courses
      if (context.user.role === 'admin') {
        const adminCourses = await Course.find({
          $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
        }).distinct('_id');
        const adminCourseIds = adminCourses.map((id: any) => id.toString());
        if (!adminCourseIds.includes(courseId.toString())) {
          return [];
        }
      }

      // Find submission records that have code exercise answers
      const submissions = await AssignmentSubmission.find(filter)
        .populate('userId', 'username email')
        .populate('courseId', 'title')
        .sort({ updatedAt: -1 });

      const records: any[] = [];

      for (const submission of submissions) {
        const user: any = (submission as any).userId;
        const course: any = (submission as any).courseId;

        if (!user || !course) continue;

        // Parse the JSON content which stores code answers per exercise
        let codeAnswers: Record<string, any> = {};
        try {
          codeAnswers = JSON.parse(submission.content || '{}');
        } catch {
          continue;
        }

        // Find the actual exercise titles from the course
        const lessonFromCourse = (course as any).modules?.flatMap((m: any) => m.lessons || [])
          .find((l: any) => (l._id?.toString() || l.id) === submission.lessonId);

        for (const [exerciseId, answer] of Object.entries(codeAnswers)) {
          const codeData = answer as any;
          // Find exercise title from course
          let exerciseTitle = exerciseId;
          if (lessonFromCourse?.codeExercises) {
            const ex = lessonFromCourse.codeExercises.find((e: any) => 
              (e._id?.toString() || e.id) === exerciseId
            );
            if (ex) exerciseTitle = ex.title || ex._id?.toString() || exerciseId;
          }

          records.push({
            userId: user._id.toString(),
            username: user.username || 'Unknown',
            email: user.email || '',
            courseId: course._id.toString(),
            courseTitle: course.title || courseTitle || '',
            lessonId: submission.lessonId,
            lessonTitle: lessonFromCourse?.title || '',
            exerciseId,
            exerciseTitle,
            code: codeData.code || '',
            submittedAt: codeData.updatedAt || submission.updatedAt?.toISOString() || '',
          });
        }
      }

      return records;
    },

    myCodeExerciseAnswers: async (_: any, { courseId, lessonId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      try {
        const submission = await AssignmentSubmission.findOne({
          userId: context.user.id,
          courseId,
          lessonId,
        }).sort({ updatedAt: -1 });

        if (!submission || !submission.content) {
          return [];
        }

        // Parse the JSON content which stores code answers per exercise
        let codeAnswers: Record<string, any> = {};
        try {
          codeAnswers = JSON.parse(submission.content || '{}');
        } catch {
          return [];
        }

        const records: any[] = [];
        for (const [exerciseId, answer] of Object.entries(codeAnswers)) {
          const codeData = answer as any;
          records.push({
            exerciseId,
            code: codeData.code || '',
            updatedAt: codeData.updatedAt || submission.updatedAt?.toISOString() || '',
          });
        }

        return records;
      } catch (err: any) {
        console.error('Failed to fetch code exercise answers:', err?.message);
        return [];
      }
    },

    getAssignmentSubmissions: async (_: any, { courseId, lessonId, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');

      const filter: any = {};

      // Admin (non-super) scope: only see submissions from courses they created or instruct
      if (context.user.role === 'admin') {
        const adminCourses = await Course.find({
          $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
        }).distinct('_id');
        const adminCourseIds = adminCourses.map((id: any) => id.toString());

        if (courseId) {
          // If a specific courseId is passed, ensure it belongs to this admin
          if (!adminCourseIds.includes(courseId.toString())) {
            // Return empty — admin has no access to this course's submissions
            const totalPages = Math.ceil(0 / limit);
            return {
              items: [],
              pagination: {
                totalCount: 0,
                totalPages,
                currentPage: page,
                pageSize: limit,
                hasNextPage: false,
                hasPreviousPage: false
              }
            };
          }
          filter.courseId = courseId;
        } else {
          filter.courseId = { $in: adminCourseIds };
        }
      } else if (courseId) {
        filter.courseId = courseId;
      }

      if (lessonId) filter.lessonId = lessonId;

      if (context.user.role === 'student') {
        filter.userId = context.user.id;
      }

      const skip = (page - 1) * limit;
      const [submissions, totalCount] = await Promise.all([
        AssignmentSubmission.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId')
          .populate({
            path: 'courseId',
            populate: { path: 'instructor' }
          }),
        AssignmentSubmission.countDocuments(filter)
      ]);

      const items = (submissions as any).map((sub: any) => {
        const doc = sub._doc || sub;
        return {
          ...doc,
          id: sub._id.toString(),
          user: sub.userId,
          userId: (sub.userId?._id || sub.userId)?.toString(),
          course: sub.courseId,
          courseId: (sub.courseId?._id || sub.courseId)?.toString(),
          lessonId: sub.lessonId,
          status: sub.status,
          content: sub.content,
          grade: sub.grade,
          feedback: sub.feedback,
          createdAt: sub.createdAt?.getTime().toString(),
          updatedAt: sub.updatedAt?.getTime().toString()
        };
      });

      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    completedUsers: async (_: any, { page = 1, limit = 10, createdBy, courseId, dateFrom, dateTo }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      // Parse date filters
      let dateFromObj: Date | null = null;
      let dateToObj: Date | null = null;
      if (dateFrom) {
        dateFromObj = new Date(dateFrom);
        if (isNaN(dateFromObj.getTime())) dateFromObj = null;
      }
      if (dateTo) {
        dateToObj = new Date(dateTo);
        if (isNaN(dateToObj.getTime())) dateToObj = null;
        // Set to end of day
        if (dateToObj) dateToObj.setHours(23, 59, 59, 999);
      }

      // Build the query for certificates
      const certFilter: any = {};
      if (courseId) certFilter.courseId = courseId;
      if (dateFromObj || dateToObj) {
        certFilter.createdAt = {};
        if (dateFromObj) certFilter.createdAt.$gte = dateFromObj;
        if (dateToObj) certFilter.createdAt.$lte = dateToObj;
      }

      // Find all certificates (completed users have certificates)
      const certificates = await Certificate.find(certFilter)
        .populate('userId')
        .populate('courseId')
        .sort({ createdAt: -1 });

      // Also find users who completed courses (100% progress) but may not have certificates yet
      const completedProgress = await CourseProgress.find({
        status: 'completed',
        ...(courseId ? { courseId } : {})
      }).populate('userId').populate('courseId').sort({ completionDate: -1 });

      // Also find users who submitted assignment submissions (final exams)
      const submissionFilter: any = {
        'answers.0': { $exists: true }  // Only submissions with at least one answer
      };
      if (courseId) submissionFilter.courseId = courseId;
      if (dateFromObj || dateToObj) {
        submissionFilter.createdAt = {};
        if (dateFromObj) submissionFilter.createdAt.$gte = dateFromObj;
        if (dateToObj) submissionFilter.createdAt.$lte = dateToObj;
      }
      const assignmentSubmissions = await AssignmentSubmission.find(submissionFilter)
        .populate('userId')
        .populate('courseId')
        .sort({ createdAt: -1 });

      // Build a map of user -> completed courses/certificates
      const userMap = new Map<string, any>();

      // Process certificates
      for (const cert of certificates) {
        const user: any = (cert as any).userId;
        if (!user) continue;
        const userId = user._id.toString();
        const course: any = (cert as any).courseId;

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            user,
            completedCourseIds: [],
            completedCourses: [],
            hasCertificate: false,
            certificate: null,
            completedLessonsCount: 0,
            overallProgress: 100,
            completedAt: cert.issueDate || cert.createdAt?.toISOString(),
            status: 'Passed'
          });
        }

        const entry = userMap.get(userId)!;
        entry.hasCertificate = true;
        entry.certificate = entry.certificate || cert;
        if (course) {
          if (!entry.completedCourseIds.includes(course._id.toString())) {
            entry.completedCourseIds.push(course._id.toString());
            entry.completedCourses.push(course);
          }
        }
      }

      // Process completed course progress and assignment submissions — batch-fetch all courses to avoid N+1
      const missingCourseIds = new Set<string>();
      for (const progress of completedProgress) {
        const progressCourse: any = (progress as any).courseId;
        const courseIdStr = progressCourse?._id?.toString() || progressCourse?.toString();
        if (courseIdStr) missingCourseIds.add(courseIdStr);
      }
      for (const sub of assignmentSubmissions) {
        const subCourse: any = (sub as any).courseId;
        const subCourseId = subCourse?._id?.toString() || subCourse?.toString();
        if (subCourseId) missingCourseIds.add(subCourseId);
      }

      const coursesMap = new Map<string, any>();
      if (missingCourseIds.size > 0) {
        const objectIds = Array.from(missingCourseIds)
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        const foundCourses = await Course.find({ _id: { $in: objectIds } }).lean();
        for (const c of foundCourses) {
          coursesMap.set(c._id.toString(), c);
        }
      }

      for (const progress of completedProgress) {
        const user: any = (progress as any).userId;
        if (!user) continue;
        const userId = user._id.toString();
        const progressCourse: any = (progress as any).courseId;
        const courseIdStr = progressCourse?._id?.toString() || progressCourse?.toString();

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            user,
            completedCourseIds: [],
            completedCourses: [],
            hasCertificate: false,
            certificate: null,
            completedLessonsCount: 0,
            overallProgress: 100,
            completedAt: (progress as any).completionDate?.toISOString(),
            status: 'Completed'
          });
        }

        const entry = userMap.get(userId)!;
        if (courseIdStr && !entry.completedCourseIds.includes(courseIdStr)) {
          entry.completedCourseIds.push(courseIdStr);
          const course = coursesMap.get(courseIdStr);
          if (course) entry.completedCourses.push(course);
        }

        const lessonProgress = (progress as any).lessons || [];
        const completedCount = lessonProgress.filter((l: any) => l.completed).length;
        entry.completedLessonsCount = Math.max(entry.completedLessonsCount, completedCount);
      }

      // Process assignment submissions
      for (const sub of assignmentSubmissions) {
        const user: any = (sub as any).userId;
        if (!user) continue;
        const userId = user._id.toString();
        const subCourse: any = (sub as any).courseId;
        const subCourseId = subCourse?._id?.toString() || subCourse?.toString();

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            user,
            completedCourseIds: [],
            completedCourses: [],
            hasCertificate: false,
            certificate: null,
            completedLessonsCount: 0,
            overallProgress: 100,
            completedAt: sub.createdAt?.toISOString(),
            status: (sub as any).status === 'failed' ? 'Failed' : 'Pending Review',
            examScore: (sub as any).grade || (sub as any).totalScore || null
          });
        }

        const entry = userMap.get(userId)!;
        // Update examScore if this submission has a higher/better score
        if ((sub as any).grade || (sub as any).totalScore) {
          const subScore = (sub as any).grade || (sub as any).totalScore;
          if (!entry.examScore || subScore > entry.examScore) {
            entry.examScore = subScore;
          }
        }
        // Update status if this submission indicates failure
        if ((sub as any).status === 'failed' && entry.status !== 'Passed') {
          entry.status = 'Failed';
        } else if (!entry.status) {
          entry.status = 'Pending Review';
        }
        if (subCourseId && !entry.completedCourseIds.includes(subCourseId)) {
          entry.completedCourseIds.push(subCourseId);
          const course = coursesMap.get(subCourseId);
          if (course) entry.completedCourses.push(course);
        }

        // Set completedAt to the earliest submission date if not already set
        if (!entry.completedAt || (sub.createdAt && new Date(sub.createdAt).getTime() < new Date(entry.completedAt).getTime())) {
          entry.completedAt = sub.createdAt?.toISOString();
        }

        // Count answers as completed lessons
        const answerCount = (sub as any).answers?.length || 0;
        if (answerCount > entry.completedLessonsCount) {
          entry.completedLessonsCount = answerCount;
        }
      }

      let items = Array.from(userMap.values());

      // Filter by createdBy if specified
      if (createdBy) {
        // Get courses created by this user
        const adminCourses = await Course.find({ createdBy }).distinct('_id');
        const adminCourseIds = adminCourses.map(id => id.toString());
        items = items.filter(item =>
          item.completedCourseIds.some((cid: string) => adminCourseIds.includes(cid))
        );
      }

      // Sort by completedAt descending
      items.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      const totalCount = items.length;
      const totalPages = Math.ceil(totalCount / limit);
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      return {
        items: paginatedItems,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    myProjects: async (_: any, { status }: { status?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      // Admins and super_admins see all projects; others see only their own.
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      
      if (isAdmin) {
        const filter: any = {};
        if (status) filter.status = status;
        return await Project.find(filter).populate(['userId', 'mentors', 'team.userId']).sort({ updatedAt: -1 });
      }

      // Find projects where user is owner, mentor, or team member
      const directFilter: any = {
        $or: [
          { userId: context.user.id },
          { mentors: context.user.id },
          { 'team.userId': context.user.id }
        ]
      };
      if (status) directFilter.status = status;
      const directProjects = await Project.find(directFilter).populate(['userId', 'mentors', 'team.userId']).lean();

      // Also find projects where user has tasks assigned via ProjectTask
      const assignedTaskProjectIds = await ProjectTask.distinct('projectId', {
        assigneeId: context.user.id,
        isDeleted: false
      });

      if (assignedTaskProjectIds.length === 0) {
        return await Project.find(directFilter).populate(['userId', 'mentors', 'team.userId']).sort({ updatedAt: -1 });
      }

      const directProjectIds = new Set(directProjects.map((p: any) => p._id.toString()));
      const additionalProjectIds = assignedTaskProjectIds.filter(
        (id: any) => !directProjectIds.has(id.toString())
      );

      if (additionalProjectIds.length === 0) {
        return await Project.find(directFilter).populate(['userId', 'mentors', 'team.userId']).sort({ updatedAt: -1 });
      }

      const taskFilter: any = {
        _id: { $in: additionalProjectIds }
      };
      if (status) taskFilter.status = status;
      const taskAssignedProjects = await Project.find(taskFilter).populate(['userId', 'mentors', 'team.userId']).lean();

      // Merge and deduplicate, preserving order: direct first, then task-assigned
      const allProjectMap = new Map<string, any>();
      for (const p of directProjects) {
        allProjectMap.set(p._id.toString(), p);
      }
      for (const p of taskAssignedProjects) {
        const key = p._id.toString();
        if (!allProjectMap.has(key)) {
          allProjectMap.set(key, p);
        }
      }

      return Array.from(allProjectMap.values()).sort(
        (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },

    myInternships: async (_: any, { status }: { status?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = isAdmin ? {} : {
        $or: [
          { mentorId: context.user.id },
          { mentors: context.user.id }
        ]
      };
      if (status) filter.status = status;
      return await Internship.find(filter).populate(['userId', 'mentorId', 'mentors']).sort({ updatedAt: -1 });
    },

    myBookings: async (_: any, { status }: { status?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      let filter: any = {};

      if (isAdmin) {
        // Admins see all bookings (no user filter)
      } else if (context.user.role === 'trainer') {
        const courses = await Course.find({ instructor: context.user.id });
        const studentIds = courses.reduce((acc: any[], course: any) => {
          return [...acc, ...course.studentsEnrolled];
        }, []);

        filter.$or = [
          { userId: context.user.id },
          { mentorId: context.user.id }
        ];

        if (studentIds.length > 0) {
          filter.$or.push({ userId: { $in: studentIds }, mentorId: null });
        }

        filter.$or.push({ mentorId: null, status: 'pending' });
      } else {
        filter.$or = [{ userId: context.user.id }, { mentorId: context.user.id }];
      }

      if (status) filter.status = status;
      filter.isDeleted = { $ne: true };
      return await Booking.find(filter).populate('userId mentorId').sort({ createdAt: -1 });
    },

    getInternshipMeetings: async (_: any, { teamId, programId, status, contextType }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const filter: any = { isDeleted: false };
      if (status) filter.status = status;
      if (teamId) filter.teamIds = teamId;
      if (programId) {
        // Find teams in this program first
        const teams = await InternshipTeam.find({ internshipProgramId: programId });
        const teamIds = teams.map(t => t._id);
        filter.teamIds = { $in: teamIds };
      }

      // Role-based access control — admins see only their own calendar
      if (context.user.role === 'admin') {
        // Admins see:
        // 1. Meetings they host (created)
        // 2. Meetings where they are listed as a mentor
        // 3. General meetings (platform-wide, visible to all)
        // 4. Meetings hosted by their parent (the admin/trainer who created them)
        const userDoc = await User.findById(context.user.id).select('createdBy').lean();
        const parentId = (userDoc as any)?.createdBy?.toString?.();

        const ownershipFilter: any[] = [
          { hostId: context.user.id },
          { mentorIds: context.user.id },
          { contextType: 'general' },
        ];

        if (parentId) {
          ownershipFilter.push({ hostId: parentId });
        }

        if (contextType) {
          filter.$and = [
            { contextType },
            { $or: ownershipFilter },
          ];
        } else {
          filter.$or = ownershipFilter;
        }
      } else if (contextType) {
        filter.contextType = contextType;
      }

      return await InternshipMeeting.find(filter).sort({ startTime: 1 });
    },

    getMeetingAttendance: async (_: any, { meetingId }: { meetingId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const meeting = await InternshipMeeting.findById(meetingId).populate('attendees.userId');
      if (!meeting) throw new Error('Meeting not found');
      return meeting.attendees || [];
    },

    getMyInternshipMeetings: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const filter: any = { isDeleted: false };

      // Role-based access control
      if (context.user.role === 'admin') {
        // Admins see:
        // 1. Meetings they host
        // 2. Meetings where they are a mentor
        // 3. General meetings
        // 4. Meetings hosted by their parent (the admin/trainer who created them)
        const userDoc = await User.findById(context.user.id).select('createdBy').lean();
        const parentId = (userDoc as any)?.createdBy?.toString?.();

        const ownershipFilter: any[] = [
          { hostId: context.user.id },
          { mentorIds: context.user.id },
          { contextType: 'general' },
        ];

        if (parentId) {
          ownershipFilter.push({ hostId: parentId });
        }

        filter.$or = ownershipFilter;
      } else if (context.user.role === 'student') {
        // Students see:
        // - meetings where the user is directly listed in userIds
        // - meetings for courses the student is enrolled in
        // - meetings for teams the student belongs to
        // - meetings where the student is listed as a mentor
        const userDoc = await User.findById(context.user.id).select('enrolledCourses').lean();
        const enrolledCourseIds = (userDoc as any)?.enrolledCourses?.map((c: any) =>
          c?.toString?.() || c
        ) || [];

        const teamMemberships = await InternshipTeamMember.find({ userId: context.user.id, isDeleted: false })
          .select('teamId').lean();
        const teamIds = teamMemberships.map(tm => tm.teamId);

        filter.$or = [
          { userIds: context.user.id },
          { mentorIds: context.user.id },
        ];

        if (enrolledCourseIds.length > 0) {
          filter.$or.push({ courseIds: { $in: enrolledCourseIds } });
        }
        if (teamIds.length > 0) {
          filter.$or.push({ teamIds: { $in: teamIds } });
        }
      }

      return await InternshipMeeting.find(filter).sort({ startTime: 1 });
    },

    getAllStudents: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      return await User.find({ role: 'student', isDeleted: { $ne: true } });
    },
    getAllTrainers: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      return await User.find({ role: { $in: ['trainer', 'admin', 'super_admin'] }, isDeleted: { $ne: true } });
    },

    getAvailableAdmins: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await User.find({ role: { $in: ['admin', 'super_admin'] }, isDeleted: { $ne: true } });
    },

    getRegisteredCompanies: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const companies = await User.distinct('company', { company: { $ne: '', $exists: true } });
      return companies.filter(Boolean).sort();
    },

    getCourseEnrolledStudents: async (_: any, { courseId }: { courseId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const course = await Course.findById(courseId).populate({
        path: 'studentsEnrolled',
        select: 'id username',
      });
      if (!course) throw new Error('Course not found');
      return course.studentsEnrolled || [];
    },

    projectByApplicationId: async (_: any, { applicationId }: { applicationId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findOne({ projectApplicationId: applicationId })
        .populate('userId')
        .populate('mentors')
        .populate('team.userId');
      return project;
    },

    getUploadSignature: (_: any, { folder, resourceType }: { folder?: string, resourceType?: string }, context: any) => {
      // Optional: Check if user is authenticated
      if (!context.user) throw new Error('Not authenticated');
      return generateUploadSignature(folder, resourceType);
    },

    dailyDashboard: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const internship = await Internship.findOne({ userId: context.user.id })
        .populate({
          path: 'projects',
          populate: { path: 'team.userId', model: 'User' } // Deep populate if needed
        })
        .exec();

      if (!internship) return null;

      const dashboardTasks = [];

      // 1. Internship Tasks
      if (internship.tasks) {
        dashboardTasks.push(...internship.tasks
          .filter((t: any) => t.status !== 'completed')
          .map((t: any) => ({
            id: t._id ? t._id.toString() : `task-${Date.now()}`,
            title: t.title,
            priority: t.priority || 'medium',
            status: t.status,
            type: 'Internship Task',
            sourceId: internship._id
          }))
        );
      }

      // 2. Project Tasks & Milestones
      if (internship.projects) {
        for (const proj of internship.projects as any[]) {
          if (proj.status === 'in_progress') {
            // Tasks
            if (proj.tasks) {
              dashboardTasks.push(...proj.tasks
                .filter((t: any) => !t.completed)
                .map((t: any) => ({
                  id: t.id,
                  title: t.title,
                  priority: 'medium',
                  status: 'pending',
                  type: 'Project Task',
                  sourceId: proj._id
                }))
              );
            }
            // Milestones
            if (proj.milestones) {
              dashboardTasks.push(...proj.milestones
                .filter((m: any) => !m.completed)
                .map((m: any) => ({
                  id: m._id ? m._id.toString() : `milestone-${Date.now()}`,
                  title: `Milestone: ${m.title}`,
                  deadline: m.dueDate ? new Date(m.dueDate).toISOString() : null,
                  priority: 'high',
                  status: 'pending',
                  type: 'Project Milestone',
                  sourceId: proj._id
                }))
              );
            }
          }
        }
      }

      // 3. Meetings
      const upcomingMeetings = internship.meetings
        ? internship.meetings.filter((m: any) => {
          // Simple check if time is in future (assuming ISO string)
          return new Date(m.time).getTime() > Date.now();
        })
        : [];

      // 4. AI Suggestion (Mock for now, can use explainTaskService later if dynamic)
      const suggestions = [
        "Focus on your highest priority task: " + (dashboardTasks[0]?.title || "Review your curriculum"),
        "Don't forget to commit your code frequently today!",
        "Reach out to your mentor if you're stuck on the latest milestone."
      ];
      const aiSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

      // 5. Unread Messages
      const userConversations = await Conversation.find({ participants: context.user.id });
      const conversationIds = userConversations.map(c => c._id);
      const unreadCount = await Message.countDocuments({
        conversationId: { $in: conversationIds },
        sender: { $ne: context.user.id },
        read: false
      });

      const resources = await Resource.find({
        $or: [
          { onModel: 'DailyTracker' },
          { linkedTo: internship._id, onModel: 'Internship' }
        ],
        visibility: { $in: ['public', 'interns_only'] }
      }).sort({ createdAt: -1 }).limit(10);

      return {
        tasks: dashboardTasks.slice(0, 10),
        meetings: upcomingMeetings.slice(0, 3),
        unreadMessages: unreadCount,
        aiSuggestion,
        motivationalQuote: "The only way to do great work is to love what you do.",
        resources
      };
    },

    notifications: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await Notification.find({ userId: context.user.id }).sort({ createdAt: -1 }).limit(50);
    },

    unreadNotificationCount: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await Notification.countDocuments({ userId: context.user.id, read: false });
    },

    getCourseQuestions: async (_: any, { courseId }: { courseId: string }) => {
      console.log('--- getCourseQuestions courseId:', courseId);
      if (!courseId || courseId === "" || courseId === "undefined" || courseId === "null" || !mongoose.Types.ObjectId.isValid(courseId)) {
        console.log('--- getCourseQuestions: Invalid courseId, returning empty array');
        return [];
      }
      const questions = await Question.find({ courseId });
      console.log(`--- getCourseQuestions: found ${questions.length} questions`);
      return questions;
    },

    users: async (_: any, { page = 1, limit = 10, createdBy, role }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const query: any = { isDeleted: { $ne: true } };

      if (context.user.role === 'admin' || context.user.role === 'trainer') {
        const courses = await Course.find({
          $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
        });
        const enrolledStudentIds = courses.reduce((acc: any[], course: any) => {
          return [...acc, ...course.studentsEnrolled];
        }, []);

        const schoolFilter = context.user.school ? { school: context.user.school } : {};

        // Collect unique instructor IDs from all courses (trainers assigned to admin's courses)
        const instructorIds = [...new Set(
          courses
            .map(c => c.instructor?.toString())
            .filter(Boolean)
        )];

        // Build role-aware $or conditions
        const orConditions: any[] = [
          { _id: { $in: enrolledStudentIds } },
          { createdBy: context.user.id, role: 'trainer' },
          { ...schoolFilter, role: 'student' }
        ];

        // Also include trainers assigned as instructors on courses this admin created/instructs
        if (instructorIds.length > 0) {
          orConditions.push({ _id: { $in: instructorIds }, role: 'trainer' });
        }

        if (role) {
          // Filter $or conditions to only include the matching role,
          // plus a catch-all for that role to cover admin/super_admin users
          query.$or = [
            ...orConditions.filter((c) => !c.role || c.role === role),
            { role },
          ];
        } else {
          query.$or = orConditions;
        }
      } else if (context.user.role === 'super_admin') {
        // Super admin sees all users regardless of createdBy filter
        if (role) query.role = role;
      } else if (createdBy) {
        query.createdBy = createdBy;
        if (role) query.role = role;
      } else if (role) {
        query.role = role;
      }

      const skip = (page - 1) * limit;

      const [items, totalCount] = await Promise.all([
        User.find(query).populate('createdBy', 'username email fullName').sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    conversations: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Find conversations where user is a participant
      const conversations = await Conversation.find({
        participants: { $in: [context.user.id] }
      })
        .populate('participants')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender' }
        })
        .sort({ updatedAt: -1 });

      return conversations;
    },

    messages: async (_: any, { conversationId }: { conversationId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Gracefully handle missing/invalid conversationId
      if (!conversationId || conversationId === 'new') return [];

      // Verify user is part of this conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return []; // Return empty instead of throwing for graceful UI

      const isParticipant = conversation.participants.some((p: any) => p.toString() === context.user.id);
      if (!isParticipant) return []; // Return empty instead of throwing for graceful UI

      return await Message.find({ conversationId })
        .populate('sender')
        .sort({ createdAt: 1 }); // Oldest first for chat history usually, but depends on UI
    },

    courses: async (_: any, { page = 1, limit = 10, sortBy = 'latest', featured, search, category, price, level, school, location }: any, context: any) => {
      const query: any = { isDeleted: { $ne: true } };

      // Filter for students/guests: Only published courses
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer')) {
        query.status = { $nin: ['DRAFT', 'CLOSED', 'ARCHIVED', 'draft', 'closed', 'archived'] };
      }

      // Optional: Only featured courses
      if (featured === true) {
        query.isFeatured = true;
      }

      // Admin isolation: Admins see courses they created, are instructors for, or belong to their school
      if (context.user && context.user.role === 'admin') {
        query.$or = [
          { createdBy: context.user.id },
          { instructor: context.user.id }
        ];
        if (context.user.school) {
          query.$or.push({ school: context.user.school });
        }
      }

      // Server-side text search across title, category, school, level, descriptionSnippet
      if (search && search.trim()) {
        const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(q, 'i');
        const searchConditions = { $or: [
          { title: searchRegex },
          { category: searchRegex },
          { school: searchRegex },
          { level: searchRegex },
          { description: searchRegex },
        ]};

        if (query.$or) {
          // Combine with existing $or via $and
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [
            { $or: existingOr },
            searchConditions,
          ];
        } else {
          query.$or = searchConditions.$or;
        }
      }

      // Server-side category filter
      if (category && category !== 'All') {
        const catCondition = { category: new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
        if (query.$and) {
          query.$and.push(catCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, catCondition];
        } else {
          query.category = catCondition.category;
        }
      }

      // Server-side price filter
      if (price && price !== 'all') {
        const priceCondition = price === 'free' ? { price: 0 } : { price: { $gt: 0 } };
        if (query.$and) {
          query.$and.push(priceCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, priceCondition];
        } else {
          Object.assign(query, priceCondition);
        }
      }

      // Server-side level filter
      if (level && level !== 'all') {
        const levelCondition = { level: new RegExp('^' + level.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') };
        if (query.$and) {
          query.$and.push(levelCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, levelCondition];
        } else {
          query.level = levelCondition.level;
        }
      }

      // Server-side school filter
      if (school && school !== 'all') {
        const schoolCondition = { school: new RegExp(school.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
        if (query.$and) {
          query.$and.push(schoolCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, schoolCondition];
        } else {
          query.school = schoolCondition.school;
        }
      }

      // Server-side location filter — search for courses relevant to a city/region
      // Matches against school name, title, category, and descriptionSnippet
      if (location && location !== 'all') {
        const escaped = location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Split by common separators to match individual location parts
        // e.g. "Kigali, Rwanda" will match courses that mention "Kigali" or "Rwanda"
        const terms = escaped.split(/[,;\s]+/).filter(Boolean);
        if (terms.length > 0) {
          const locationConditions = terms.map((term: string) => ({
            $or: [
              { school: new RegExp(term, 'i') },
              { title: new RegExp(term, 'i') },
              { category: new RegExp(term, 'i') },
              { descriptionSnippet: new RegExp(term, 'i') },
            ]
          }));

          const locationFilter = terms.length === 1
            ? locationConditions[0]
            : { $and: locationConditions };

          if (query.$and) {
            query.$and.push(locationFilter);
          } else if (query.$or) {
            const existingOr = query.$or;
            delete query.$or;
            query.$and = [{ $or: existingOr }, locationFilter];
          } else {
            Object.assign(query, locationFilter);
          }
        }
      }

      const skip = (page - 1) * limit;

      // Compute trending scores (recent enrollments in last 30 days)
      let trendingScores: Map<string, number> = new Map();
      if (sortBy === 'trending') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentPayments = await Payment.find({
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo },
          $or: [
            { courseId: { $exists: true, $ne: null } },
            { courseIds: { $exists: true, $ne: null, $not: { $size: 0 } } }
          ]
        }).select('courseId courseIds').lean();

        for (const p of recentPayments) {
          const ids: string[] = [];
          if (p.courseId) ids.push(p.courseId.toString());
          if ((p as any).courseIds) {
            (p as any).courseIds.forEach((id: any) => {
              if (id) ids.push(id.toString());
            });
          }
          for (const id of ids) {
            trendingScores.set(id, (trendingScores.get(id) || 0) + 1);
          }
        }
      }

      // Filter out courses without thumbnails for public views
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer')) {
        query.thumbnail = { $exists: true, $nin: [null, ''] };
      }

      const totalCount = await Course.countDocuments(query);

      let items;

      // For popular and trending, fetch all matching courses and sort in-memory
      // Uses studentsEnrolledCount (pre-computed) instead of expensive populate of all students
      if (sortBy === 'popular' || sortBy === 'trending') {
        const allItems = await Course.find(query)
          .populate('instructor')
          .sort({ createdAt: -1 })
          .lean({ virtuals: true });

        if (sortBy === 'popular') {
          allItems.sort((a: any, b: any) => (b.studentsEnrolledCount || 0) - (a.studentsEnrolledCount || 0));
        } else if (sortBy === 'trending') {
          allItems.sort((a: any, b: any) => {
            const scoreA = trendingScores.get((a as any)._id.toString()) || 0;
            const scoreB = trendingScores.get((b as any)._id.toString()) || 0;
            return scoreB - scoreA;
          });
        }

        items = allItems.slice(skip, skip + limit);
      } else {
        // Latest: use DB-level sort with skip/limit (efficient)
        // Only populate instructor — studentsEnrolled is expensive and not needed for list view
        items = await Course.find(query)
          .populate('instructor')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean({ virtuals: true });
      }

      const totalPages = Math.ceil(totalCount / limit);

      // Serialize items for GraphQL
      const serialized = items.map((item: any) => ({
        ...item,
        id: item._id.toString(),
        isFeatured: item.isFeatured || false
      }));

      return {
        items: serialized,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    course: async (_: any, { id, lite }: { id: string; lite?: boolean }, context: any) => {
      const targetId = typeof id === 'object' ? ((id as any).id || (id as any)._id) : id;
      console.log('--- course query targetId:', targetId, 'lite:', lite);

      if (!targetId || targetId === "" || targetId === "undefined" || targetId === "null") {
        console.log('--- course query: Invalid targetId, returning null');
        return null;
      }

      // Try regular Course first — need studentsEnrolled populate for enrollment checks on course detail page
      let course = await Course.findById(targetId).populate('instructor').populate('studentsEnrolled');
      console.log('--- course query: Regular Course found:', !!course);

      // If not found, try AICourse
      if (!course) {
        course = await AICourse.findById(targetId).populate('instructor').populate('studentsEnrolled') as any;
        console.log('--- course query: AICourse found:', !!course);
      }

      if (!course) {
        console.log('--- course query: No course found for ID:', targetId);
        throw new Error(`Course not found for ID: ${targetId}`);
      }

      const courseObj = (course as any).toObject({ virtuals: true });

      // LITE mode: Only return module/lesson structure (no content, quizzes, assignments)
      if (lite) {
        if (courseObj.modules) {
          courseObj.modules = courseObj.modules.map((mod: any) => ({
            ...mod,
            lessons: mod.lessons ? mod.lessons.map((lesson: any) => ({
              id: lesson._id || lesson.id,
              title: lesson.title,
              duration: lesson.duration,
              type: lesson.type,
              order: lesson.order
            })) : []
          }));
        }
        return courseObj;
      }

      // Check enrollment using the pre-computed count + stored IDs
      let isEnrolled = false;
      if (context.user) {
        // Check if user's ID is in the studentsEnrolled array (stored as ObjectId refs)
        isEnrolled = (course.studentsEnrolled as any[] || []).some((s: any) => {
          const sId = s?._id?.toString?.() || s?.toString?.() || s?.id;
          return sId === context.user.id;
        });

        // Grant access to instructor, admin, super_admin
        if ((course.instructor as any)._id.toString() === context.user.id ||
          ['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
          isEnrolled = true;
        }
      }

      // If NOT enrolled: Apply Free Trial Logic (First 2 lessons visible)
      if (!isEnrolled) {
        let lessonCount = 0;
        if (courseObj.modules) {
          courseObj.modules.forEach((mod: any) => {
            if (mod.lessons) {
              mod.lessons.forEach((lesson: any) => {
                // Allow first 2 lessons globally (0 and 1)
                if (lessonCount >= 2) {
                  lesson.content = "🔒 Enrollment Required to view this content.";
                  lesson.videoUrl = null;
                }
                lessonCount++;
              });
            }
          });
        }
      }

      return courseObj;
    },

    lessonContent: async (_: any, { courseId, lessonId }: { courseId: string; lessonId: string }, context: any) => {
      console.log('--- lessonContent query: courseId:', courseId, 'lessonId:', lessonId);

      if (!courseId || !lessonId) {
        throw new Error('courseId and lessonId are required');
      }

      const course = await Course.findById(courseId).populate('instructor');
      if (!course) {
        throw new Error('Course not found');
      }

      // Find the lesson in course modules
      let foundLesson: any = null;
      let lessonIndex = 0;
      if (course.modules) {
        for (const mod of course.modules) {
          if (mod.lessons) {
            for (const lesson of mod.lessons) {
              const lessonDoc = (lesson as any);
              const lid = lessonDoc._id ? lessonDoc._id.toString() : '';
              if (lid === lessonId) {
                foundLesson = lessonDoc;
                break;
              }
              lessonIndex++;
            }
          }
          if (foundLesson) break;
        }
      }

      if (!foundLesson) {
        throw new Error('Lesson not found in course');
      }

      // Check enrollment for content restriction (use stored IDs, no populate needed)
      let isEnrolled = false;
      if (context.user) {
        isEnrolled = (course.studentsEnrolled as any[] || []).some((s: any) => {
          const sId = s?._id?.toString?.() || s?.toString?.() || s?.id;
          return sId === context.user.id;
        });
        if ((course.instructor as any)._id.toString() === context.user.id ||
          ['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
          isEnrolled = true;
        }
      }

      // Free trial: only first 2 lessons visible without enrollment
      if (!isEnrolled && lessonIndex >= 2) {
        return {
          ...foundLesson.toObject(),
          content: "🔒 Enrollment Required to view this content.",
          videoUrl: null,
          fileUrl: null,
          quizQuestions: [],
          assignmentQuestions: [],
          assignmentDescription: null
        };
      }

      const lessonObj = foundLesson.toObject?.() || foundLesson;
      return lessonObj;
    },

    stats: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const isSuperAdmin = context.user.role === 'super_admin';
      const adminFilter = isSuperAdmin ? { isDeleted: false } : {
        $or: [{ instructor: context.user.id }, { createdBy: context.user.id }],
        isDeleted: false
      };

      // For payments, we need to find payments linked to admin's courses
      let adminCourseIds: any[] = [];
      let adminInternshipIds: any[] = [];
      if (!isSuperAdmin) {
        const [adminCourses, adminInternships] = await Promise.all([
          Course.find({
            $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
          }),
          InternshipProgram.find({ createdBy: context.user.id })
        ]);
        adminCourseIds = adminCourses.map(c => c._id);
        adminInternshipIds = adminInternships.map(i => i._id);
      }

      const paymentFilter = isSuperAdmin ? { status: 'completed' } : {
        status: 'completed',
        courseIds: { $in: adminCourseIds }
      };

      const [
        totalUsers,
        standardCoursesCount,
        internshipProgramsCount,
        standardPayments,
        internshipPayments,
        standardCourses,
        internshipApps,
        legacyInternships
      ] = await Promise.all([
        isSuperAdmin ? User.countDocuments({ isDeleted: { $ne: true } }) : User.countDocuments({ _id: { $in: await getAdminStudentIds(context.user.id) }, isDeleted: { $ne: true } }),
        Course.countDocuments(adminFilter),
        InternshipProgram.countDocuments(adminFilter),
        Payment.find(paymentFilter),
        InternshipPayment.find(isSuperAdmin ? { status: 'paid', isDeleted: false } : { status: 'paid', isDeleted: false, internshipProgramId: { $in: adminInternshipIds } }),
        Course.find(adminFilter),
        InternshipApplication.find(isSuperAdmin ? { status: 'approved', isDeleted: false } : { status: 'approved', isDeleted: false, internshipProgramId: { $in: adminInternshipIds } }),
        Internship.find(isSuperAdmin ? { status: { $in: ['enrolled', 'in_progress', 'completed', 'graduated'] } } : { mentorId: context.user.id, status: { $in: ['enrolled', 'in_progress', 'completed', 'graduated'] } })
      ]);

      // Calculate total unique students across all programs
      const studentIds = new Set();
      standardCourses.forEach(c => {
        c.studentsEnrolled.forEach(s => studentIds.add(s.toString()));
      });
      internshipApps.forEach(app => studentIds.add(app.userId.toString()));
      legacyInternships.forEach(intern => studentIds.add(intern.userId.toString()));

      // Calculate total revenue from actual payments
      const standardRevenue = standardPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const internshipRevenue = internshipPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalRevenue = standardRevenue + internshipRevenue;

      return {
        totalUsers,
        totalCourses: standardCoursesCount + internshipProgramsCount,
        totalStudents: studentIds.size,
        totalRevenue
      };
    },
    me: async (_: any, __: any, context: any) => {
      if (!context.user) return null;
      return await User.findById(context.user.id)
        .populate({ path: 'enrolledCourses', select: 'id title thumbnail price discountPrice level category school modulesCount totalLessonsCount status isFeatured' })
        .populate({ path: 'completedCourses', select: 'id title' })
        .populate({ path: 'badges.badgeId', select: 'id title description icon category' });
    },
    categories: async () => {
      const courses = await Course.find();
      const categories = new Set(courses.map(c => c.category).filter(Boolean));
      return Array.from(categories);
    },
    schools: async () => {
      const courses = await Course.find();
      const schools = new Set(courses.map(c => c.school).filter(Boolean));
      return Array.from(schools);
    },
    chatBotGreeting: async (_: any, __: any, context: any) => {
      return await getChatGreeting(context.user);
    },
    trainerStudents: async (_: any, __: any, context: any) => {
      if (!context.user || !['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const query = context.user.role === 'trainer' ? { instructor: context.user.id } : {};
      const courses = await Course.find(query).populate({
        path: 'studentsEnrolled',
        populate: [
          { path: 'enrolledCourses' }
        ]
      });

      const studentsMap = new Map();

      courses.forEach(course => {
        course.studentsEnrolled.forEach((student: any) => {
          studentsMap.set(student.id, student);
        });
      });

      return Array.from(studentsMap.values());
    },
    recentActivity: async (_: any, { createdBy }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) {
        throw new Error('Not authorized');
      }

      let userQuery: any = {};

      if (createdBy) {
        // Filter by specific user if createdBy is provided
        userQuery._id = createdBy;
      } else if (context.user.role === 'admin') {
        // Admin only sees activities from their own students
        const studentIds = await getAdminStudentIds(context.user.id);
        userQuery._id = { $in: studentIds };
      }
      // Super admin sees all users — no filter needed

      const users = await User.find(userQuery).limit(200);
      let activities: any[] = [];

      users.forEach(user => {
        if (user.activityLog) {
          user.activityLog.forEach((log: any) => {
            activities.push({
              username: user.username,
              action: log.action,
              details: log.details,
              timestamp: log.timestamp
            });
          });
        }
      });

      // Sort by timestamp descending
      return activities.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      }).slice(0, 100);
    },
    questions: async (_: any, { courseId, lessonId, moduleNumber, lessonNumber }: any) => {
      console.log('--- questions query: courseId:', courseId, 'lessonId:', lessonId, 'moduleNumber:', moduleNumber, 'lessonNumber:', lessonNumber);

      if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        console.log('--- questions query: Invalid or missing courseId');
        return [];
      }

      const query: any = { courseId };

      if (lessonId !== undefined && lessonId !== null && lessonId !== "") {
        if (mongoose.Types.ObjectId.isValid(lessonId)) {
          query.lessonId = lessonId;
        } else if (lessonId.includes('-')) {
          // If lessonId is a string like "0-0", treat it as module-lesson numbers
          const [m, l] = lessonId.split('-');
          query.moduleNumber = m;
          query.lessonNumber = l;
          console.log(`--- questions query: lessonId "${lessonId}" interpreted as module ${m}, lesson ${l}`);
        } else {
          // Fallback if it's just a non-ObjectId string
          query.lessonNumber = lessonId;
        }
      } else if (moduleNumber !== undefined && moduleNumber !== null && moduleNumber !== "") {
        query.moduleNumber = moduleNumber;
        if (lessonNumber !== undefined && lessonNumber !== null && lessonNumber !== "") {
          query.lessonNumber = lessonNumber;
        }
      } else if (lessonNumber !== undefined && lessonNumber !== null && lessonNumber !== "") {
        // Fallback for when only lessonNumber is provided (possibly still containing module-lesson format)
        if (lessonNumber.includes('-')) {
          const [m, l] = lessonNumber.split('-');
          query.moduleNumber = m;
          query.lessonNumber = l;
        } else {
          query.lessonNumber = lessonNumber;
        }
      } else {
        query.lessonId = null;
        query.moduleNumber = null;
        query.lessonNumber = null;
      }

      const results = await Question.find(query).sort({ createdAt: 1 });
      console.log(`--- questions query: found ${results.length} questions for query:`, JSON.stringify(query));
      return results;
    },
    bookings: async (_: any, { page = 1, limit = 10 }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) {
        throw new Error('Not authorized');
      }

      const query: any = { isDeleted: { $ne: true } };
      if (context.user.role === 'admin') {
        query.mentorId = context.user.id;
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        Booking.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId')
          .populate('mentorId'),
        Booking.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },


    payments: async (_: any, { page = 1, limit = 10, createdBy }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const isSuperAdmin = context.user.role === 'super_admin';
      let adminCourseIds: any[] = [];
      if (!isSuperAdmin) {
        const adminCourses = await Course.find({
          $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
        });
        adminCourseIds = adminCourses.map(c => c._id);
      }

      let filter: any = {};
      if (!isSuperAdmin) {
        filter = {
          $or: [
            { courseIds: { $in: adminCourseIds } },
            { internshipIds: { $in: adminCourseIds } }
          ]
        };
      }
      if (createdBy) {
        filter.createdBy = createdBy;
      }

      const skip = (page - 1) * limit;

      const [standardPayments, internshipPayments] = await Promise.all([
        Payment.find(filter).populate('userId').populate('createdBy', 'username fullName email').sort({ createdAt: -1 }),
        InternshipPayment.find({ ...filter, isDeleted: false }).populate('userId').populate('internshipProgramId').sort({ createdAt: -1 }),
      ]);

      const combined = [
        ...standardPayments.map(p => ({
          id: p.id,
          studentName: (p.userId as any)?.username || 'Unknown',
          type: p.type || 'Course Enrollment',
          itemTitle: p.itemTitle,
          amount: p.amount,
          currency: p.currency,
          date: (p as any).createdAt.toISOString(),
          status: p.status,
          method: p.paymentMethod || 'Mobile Money',
          proofOfPaymentUrl: p.proofOfPaymentUrl,
          adminNotes: p.adminNotes,
          courseIds: p.courseIds,
          internshipIds: p.internshipIds,
          createdBy: (p as any).createdBy || null
        })),
        ...internshipPayments.map(p => ({
          id: p.id,
          studentName: (p.userId as any)?.username || 'Unknown',
          type: 'Internship Fee',
          itemTitle: (p.internshipProgramId as any)?.title || 'Internship Program',
          amount: p.amount,
          currency: p.currency,
          date: (p as any).createdAt.toISOString(),
          status: p.status === 'paid' ? 'completed' : p.status, // Normalize status for UI
          method: p.paymentMethod || 'Mobile Money',
          proofOfPaymentUrl: p.paymentProofUrl,
          adminNotes: p.notes,
          createdBy: null
        }))
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalCount = standardPayments.length + internshipPayments.length;
      const totalPages = Math.ceil(totalCount / limit);
      const items = combined.slice(skip, skip + limit);

      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    myPayments: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const paymentFilter = isAdmin ? {} : { userId: context.user.id };

      const [standardPayments, internshipPayments] = await Promise.all([
        Payment.find(paymentFilter).sort({ createdAt: -1 }).lean(),
        InternshipPayment.find({ ...paymentFilter, isDeleted: false }).populate('internshipProgramId').sort({ createdAt: -1 }).lean()
      ]);

      const allPayments = [
        ...await Promise.all(standardPayments.map(async (p: any) => {
          let courses: any[] = [];
          let internships: any[] = [];

          // Handle Courses — build a deduplicated array of string IDs
          if (p.type === 'Bulk Enrollment' || (p.itemTitle || '').includes('+')) {
            console.log(`🔍 [myPayments] Payment ${p._id} raw courseIds:`, p.courseIds);
          }
          const courseIdStrings: string[] = (p.courseIds || [])
            .filter((id: any) => id && id.toString() !== 'null' && id.toString() !== 'undefined')
            .map((id: any) => id.toString());

          if (p.courseId && !courseIdStrings.includes(p.courseId.toString())) {
            courseIdStrings.push(p.courseId.toString());
          }

          if (courseIdStrings.length > 0) {
            const objectIds = courseIdStrings.map(id => new mongoose.Types.ObjectId(id));
            courses = await Course.find({ _id: { $in: objectIds } }).lean();
          } else {
            console.log(`🔍 [myPayments] No courseIdStrings for payment ${p._id}`);
          }

          // SECONDARY FALLBACK: Check PaymentTransaction if courses still empty
          if (courses.length === 0 && p.transactionId) {
            const rawTx = await PaymentTransaction.findOne({ paypackRef: p.transactionId }).lean() as any;
            if (rawTx && rawTx.courseIds && rawTx.courseIds.length > 0) {
              const txCourseIds = rawTx.courseIds.map((id: any) => id.toString());
              courses = await Course.find({ _id: { $in: txCourseIds } }).lean();

              // If found, auto-patch the Payment record
              if (courses.length > 0) {
                Payment.findByIdAndUpdate(p._id, { $set: { courseIds: rawTx.courseIds } }).exec().catch(() => { });
              }
            }
          }

          // SELF-HEALING FALLBACK: For old Bulk Enrollment records with empty courseIds,
          // try to reconstruct the list from the user's enrolled courses that match the payment context.
          if (courses.length === 0 && (p.type === 'Bulk Enrollment' || (p.itemTitle || '').toLowerCase().includes('cart checkout'))) {
            const user = await User.findById(p.userId).select('enrolledCourses').lean() as any;
            if (user?.enrolledCourses?.length > 0) {
              // Get the courses enrolled around the payment date (within ±24h window)
              const paymentDate = new Date(p.createdAt);
              const dayBefore = new Date(paymentDate.getTime() - 24 * 60 * 60 * 1000);
              const dayAfter = new Date(paymentDate.getTime() + 24 * 60 * 60 * 1000);

              // Find courses whose IDs are in the user's enrolledCourses list
              const enrolledCourses = await Course.find({
                _id: { $in: user.enrolledCourses },
                // Filter to courses that were likely paid for around this time
                // Since we don't have enrollment timestamps per-course, use all enrolled for now
              }).select('_id title price discountPrice').lean() as any[];

              // Try to estimate which courses belong to this payment based on price matching
              if (enrolledCourses.length > 0) {
                // Use price sum to narrow down if possible
                let best: any[] = enrolledCourses;
                const totalPrice = enrolledCourses.reduce((sum: number, c: any) => sum + (c.discountPrice || c.price || 0), 0);
                if (Math.abs(totalPrice - p.amount) > p.amount * 0.1 && enrolledCourses.length > 1) {
                  // Try subsets that add up to the payment amount
                  // For simplicity, just use all enrolled courses as best effort
                  best = enrolledCourses;
                }
                courses = best;

                // Auto-repair the payment document so future calls work instantly
                const repairedIds = courses.map((c: any) => c._id);
                if (repairedIds.length > 0) {
                  Payment.findByIdAndUpdate(p._id, { $set: { courseIds: repairedIds } }).exec().catch(() => { });
                }
              }
            }
          }

          // Handle Internship Programs — build a deduplicated array of string IDs
          const internshipIdStrings: string[] = (p.internshipIds || []).map((id: any) => id.toString());
          if (p.internshipId && !internshipIdStrings.includes(p.internshipId.toString())) {
            internshipIdStrings.push(p.internshipId.toString());
          }
          if (internshipIdStrings.length > 0) {
            const programs = await InternshipProgram.find({ _id: { $in: internshipIdStrings } }).lean();
            internships = programs.map((prog: any) => ({
              id: prog._id.toString(),
              title: prog.title,
              price: prog.price
            }));
          }

          return {
            id: p._id.toString(),
            studentName: context.user.username,
            type: p.type || 'Course Enrollment',
            itemTitle: p.itemTitle,
            amount: p.amount,
            currency: p.currency,
            date: new Date(p.createdAt).toISOString(),
            status: p.status,
            method: p.paymentMethod || 'Mobile Money',
            proofOfPaymentUrl: p.proofOfPaymentUrl,
            adminNotes: p.adminNotes,
            courses: courses.map((c: any) => ({ id: c._id.toString(), title: c.title, price: c.discountPrice || c.price })),
            internships: internships
          };
        })),
        ...internshipPayments.map((p: any) => ({
          id: p._id.toString(),
          studentName: context.user.username,
          type: 'Internship Program',
          itemTitle: p.internshipProgramId?.title || 'Internship Program',
          amount: p.amount,
          currency: p.currency,
          date: new Date(p.createdAt).toISOString(),
          status: p.status,
          method: p.paymentMethod || 'Mobile Money',
          proofOfPaymentUrl: p.proofOfPaymentUrl,
          adminNotes: p.adminNotes,
          courses: [],
          internships: [{
            id: p.internshipProgramId?._id?.toString() || p.internshipProgramId?.id,
            title: p.internshipProgramId?.title,
            price: p.amount
          }]
        }))
      ];

      return allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    configs: async (_: any, __: any, context: any) => {
      return await Config.find();
    },

    badges: async (_: any, { page = 1, limit = 10, createdBy }: any) => {
      const skip = (page - 1) * limit;
      const filter: any = {};
      if (createdBy) filter.createdBy = createdBy;
      const [items, totalCount] = await Promise.all([
        Badge.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Badge.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    trainerStats: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'trainer') throw new Error('Not authorized');

      const activeCourses = await Course.countDocuments({ instructor: context.user.id, status: 'published' });

      const myCourses = await Course.find({ instructor: context.user.id });
      const studentIds = new Set();
      myCourses.forEach(c => c.studentsEnrolled.forEach((s: any) => studentIds.add(s.toString())));

      const myCourseTitles = myCourses.map(c => c.title);
      const pendingProjects = await Project.countDocuments({
        course: { $in: myCourseTitles },
        status: { $in: ['pending_review', 'submitted'] }
      });

      const pendingAssignments = await AssignmentSubmission.countDocuments({
        courseId: { $in: myCourses.map(c => c._id) },
        status: 'pending'
      });

      const pendingReviews = pendingProjects + pendingAssignments;

      // Count unique mentees from bookings
      const explicitMentees = await Booking.distinct('userId', { mentorId: context.user.id });

      return {
        activeCourses,
        totalStudents: studentIds.size,
        pendingReviews,
        mentees: explicitMentees.length
      };
    },
    adminDashboardData: async (_: any, { createdBy }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) throw new Error('Not authorized');

      let targetCreatedBy = context.user.role !== 'super_admin' ? context.user.id : createdBy;
      // Use the same user scope as the `users` resolver for consistency
      // (enrolled students + trainers created by admin + same-school students + trainer instructors)
      const userFilter = targetCreatedBy ? await (async () => {
        const adminCourses = await Course.find({
          $or: [{ instructor: targetCreatedBy }, { createdBy: targetCreatedBy }]
        });
        const enrolledStudentIds = adminCourses.reduce((acc: any[], course: any) => {
          return [...acc, ...course.studentsEnrolled];
        }, []);

        // Collect unique instructor IDs from all courses (trainers assigned to admin's courses)
        const instructorIds = [...new Set(
          adminCourses
            .map(c => c.instructor?.toString())
            .filter(Boolean)
        )];

        const adminUser = await User.findById(targetCreatedBy).select('school').lean();
        const schoolFilter = adminUser?.school ? { school: adminUser.school } : {};

        const orConditions: any[] = [
          { _id: { $in: enrolledStudentIds } },
          { createdBy: targetCreatedBy, role: 'trainer' },
          { ...schoolFilter, role: 'student' }
        ];

        // Also include trainers assigned as instructors on courses
        if (instructorIds.length > 0) {
          orConditions.push({ _id: { $in: instructorIds }, role: 'trainer' });
        }

        return {
          $or: orConditions,
          isDeleted: { $ne: true }
        };
      })() : { isDeleted: { $ne: true } };
      const courseFilter = targetCreatedBy ? { $or: [{ createdBy: targetCreatedBy }, { instructor: targetCreatedBy }], isDeleted: false } : { isDeleted: false };
      const programFilter = targetCreatedBy ? { createdBy: targetCreatedBy, isDeleted: false } : { isDeleted: false };

      const [
        totalUsers,
        standardCoursesCount,
        internshipProgramsCount,
        standardCourses,
        internshipApps,
        legacyInternships,
        adminOwnedCourses,
        adminOwnedPrograms
      ] = await Promise.all([
        User.countDocuments(userFilter),
        Course.countDocuments(courseFilter),
        InternshipProgram.countDocuments(programFilter),
        Course.find(courseFilter).populate('studentsEnrolled'),
        InternshipApplication.find({
          ...(targetCreatedBy ? { internshipProgramId: { $in: await InternshipProgram.find({ createdBy: targetCreatedBy }).distinct('_id') } } : {}),
          status: 'approved',
          isDeleted: false
        }),
        Internship.find({
          ...(targetCreatedBy ? { mentorId: targetCreatedBy } : {}),
          status: { $in: ['enrolled', 'in_progress', 'completed', 'graduated'] }
        }),
        Course.find(courseFilter).distinct('_id'),
        InternshipProgram.find(programFilter).distinct('_id')
      ]);

      const [standardPayments, internshipPayments] = await Promise.all([
        Payment.find({
          status: 'completed',
          ...(targetCreatedBy ? { courseId: { $in: adminOwnedCourses } } : {})
        }),
        InternshipPayment.find({
          status: 'paid',
          isDeleted: false,
          ...(targetCreatedBy ? { internshipProgramId: { $in: adminOwnedPrograms } } : {})
        })
      ]);

      const studentIds = new Set();
      const performanceData = [];

      // Process standard courses
      for (const c of standardCourses) {
        c.studentsEnrolled.forEach((s: any) => studentIds.add(s.toString()));
        const revenue = (c.price || 0) * c.studentsEnrolled.length;

        performanceData.push({
          courseTitle: c.title,
          studentCount: c.studentsEnrolled.length,
          revenue,
          avgCompletion: Math.floor(Math.random() * 40) + 40
        });
      }

      // Add internship students to unique count
      internshipApps.forEach(app => studentIds.add(app.userId.toString()));
      legacyInternships.forEach(intern => studentIds.add(intern.userId.toString()));

      const standardRevenue = standardPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const internshipRevenue = internshipPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      const totalRevenue = standardRevenue + internshipRevenue;

      const [recentStandardPayments, recentInternshipPayments] = await Promise.all([
        Payment.find({
          status: 'completed',
          ...(targetCreatedBy ? { courseId: { $in: adminOwnedCourses } } : {})
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('courseId')
          .populate('userId'),
        InternshipPayment.find({
          status: 'paid',
          isDeleted: false,
          ...(targetCreatedBy ? { internshipProgramId: { $in: adminOwnedPrograms } } : {})
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('internshipProgramId')
          .populate('userId')
      ]);

      const recentEnrollments = [
        ...recentStandardPayments.map(p => ({
          studentName: (p.userId as any)?.username || 'Unknown',
          courseTitle: (p.courseId as any)?.title || 'Unknown Course',
          enrolledAt: new Date((p as any).createdAt).toLocaleDateString(),
          amount: p.amount || 0,
          timestamp: new Date((p as any).createdAt).getTime()
        })),
        ...recentInternshipPayments.map(p => ({
          studentName: (p.userId as any)?.username || 'Unknown',
          courseTitle: (p.internshipProgramId as any)?.title || 'Internship Program',
          enrolledAt: new Date((p as any).createdAt).toLocaleDateString(),
          amount: p.amount || 0,
          timestamp: new Date((p as any).createdAt).getTime()
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

      return {
        stats: {
          totalUsers,
          totalCourses: standardCoursesCount + internshipProgramsCount,
          totalStudents: studentIds.size,
          totalRevenue
        },
        recentEnrollments,
        coursePerformance: performanceData
      };
    },
    allUserGradeReports: async (_: any, __: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const submissions = await AssignmentSubmission.find().populate(['userId', 'courseId']);
      return submissions.map(s => {
        const course = s.courseId as any;
        let lessonTitle = s.lessonId;
        if (course && course.modules) {
          course.modules.forEach((m: any) => {
            const l = m.lessons.find((lesson: any) => lesson.id === s.lessonId);
            if (l) lessonTitle = l.title;
          });
        }
        return {
          id: s._id,
          userId: s.userId?._id || s.userId,
          username: (s.userId as any)?.username,
          email: (s.userId as any)?.email,
          courseTitle: course?.title,
          lessonTitle,
          score: s.totalScore || 0,
          gradedAt: s.updatedAt,
          status: s.status
        };
      });
    },

    analytics: async (_: any, { createdBy }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) throw new Error('Not authorized');

      let targetCreatedBy = context.user.role !== 'super_admin' ? context.user.id : createdBy;
      // Use the same broader user scope as the `users` resolver for consistency
      // (enrolled students + trainers created by admin + same-school students + trainer instructors)
      const userFilter = targetCreatedBy ? await (async () => {
        const adminCourses = await Course.find({
          $or: [{ instructor: targetCreatedBy }, { createdBy: targetCreatedBy }]
        });
        const enrolledStudentIds = adminCourses.reduce((acc: any[], course: any) => {
          return [...acc, ...course.studentsEnrolled];
        }, []);

        const instructorIds = [...new Set(
          adminCourses
            .map(c => c.instructor?.toString())
            .filter(Boolean)
        )];

        const adminUser = await User.findById(targetCreatedBy).select('school').lean();
        const schoolFilter = adminUser?.school ? { school: adminUser.school } : {};

        const orConditions: any[] = [
          { _id: { $in: enrolledStudentIds } },
          { createdBy: targetCreatedBy, role: 'trainer' },
          { ...schoolFilter, role: 'student' }
        ];

        if (instructorIds.length > 0) {
          orConditions.push({ _id: { $in: instructorIds }, role: 'trainer' });
        }

        return {
          $or: orConditions,
          isDeleted: { $ne: true }
        };
      })() : { isDeleted: { $ne: true } };
      const courseFilter = targetCreatedBy ? { $or: [{ createdBy: targetCreatedBy }, { instructor: targetCreatedBy }], isDeleted: false } : { isDeleted: false };

      const adminOwnedCourses = targetCreatedBy ? await Course.find(courseFilter).distinct('_id') : null;

      // 1. User Role Distribution
      const roles = ['student', 'trainer', 'admin', 'super_admin'] as const;
      const roleDistribution = await Promise.all(roles.map(async role => ({
        name: role.charAt(0).toUpperCase() + role.slice(1),
        value: await User.countDocuments({ ...userFilter, role })
      })));

      // 2. Course Distribution (Students per course)
      const courses = await Course.find(courseFilter);
      const courseDistribution = courses.map(c => ({
        name: c.title,
        value: c.studentsEnrolled.length
      }));

      // Generate last 6 months
      const monthsData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthsData.push({
          label: d.toLocaleString('default', { month: 'short' }),
          month: d.getMonth() + 1,
          year: d.getFullYear(),
        });
      }

      // 3. User Growth
      const userGrowth = await Promise.all(monthsData.map(async (m) => {
        const count = await User.countDocuments({
          ...userFilter,
          createdAt: {
            $gte: new Date(m.year, m.month - 1, 1),
            $lt: new Date(m.year, m.month, 1),
          }
        });
        return { label: m.label, value: count };
      }));

      // 4. Revenue Growth
      const revenueGrowth = await Promise.all(monthsData.map(async (m) => {
        const matchStage: any = {
          status: { $in: ["completed", "paid", "successful"] },
          createdAt: {
            $gte: new Date(m.year, m.month - 1, 1),
            $lt: new Date(m.year, m.month, 1),
          }
        };
        if (adminOwnedCourses) {
          matchStage.courseId = { $in: adminOwnedCourses };
        }

        const [standardResult, internshipResult] = await Promise.all([
          Payment.aggregate([
            { $match: matchStage },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
          ]),
          InternshipPayment.aggregate([
            {
              $match: {
                status: 'paid',
                isDeleted: false,
                createdAt: matchStage.createdAt,
                ...(adminOwnedCourses ? { internshipProgramId: { $in: await InternshipProgram.find({ createdBy: targetCreatedBy }).distinct('_id') } } : {})
              }
            },
            { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
          ])
        ]);

        const totalMonthRevenue = (standardResult[0]?.totalAmount || 0) + (internshipResult[0]?.totalAmount || 0);
        return { label: m.label, value: totalMonthRevenue };
      }));

      // 5. Internship Stats
      const internshipFilter = targetCreatedBy ? { mentorId: targetCreatedBy } : {};
      const internshipStats = {
        total: await Internship.countDocuments(internshipFilter),
        eligible: await Internship.countDocuments({ ...internshipFilter, status: 'eligible' }),
        enrolled: await Internship.countDocuments({ ...internshipFilter, status: 'enrolled' }),
        graduated: await Internship.countDocuments({ ...internshipFilter, status: 'graduated' })
      };

      // 6. Project Stats
      const projectFilter = targetCreatedBy ? { mentors: targetCreatedBy } : {};
      const projectStats = {
        total: await Project.countDocuments(projectFilter),
        completed: await Project.countDocuments({ ...projectFilter, status: 'completed' }),
        pendingReview: await Project.countDocuments({ ...projectFilter, status: 'pending_review' }),
        inProgress: await Project.countDocuments({ ...projectFilter, status: 'in_progress' })
      };

      return {
        roleDistribution,
        courseDistribution,
        userGrowth,
        revenueGrowth,
        internshipStats,
        projectStats
      };
    },

    // Projects
    projects: async (_: any, { page = 1, limit = 10, course }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }

      const query: any = {};
      if (course) {
        query.course = { $regex: course, $options: 'i' };
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        Project.find(query)
          .populate('userId')
          .populate('mentors')
          .populate('team.userId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Project.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    project: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findById(id)
        .populate('userId')
        .populate('mentors')
        .populate('team.userId');
      if (!project) throw new Error('Project not found');

      const isTeamMember = project.team?.some(member => member.userId?.toString() === context.user.id);

      // Also check if the user has any tasks assigned in this project
      const hasAssignedTasks = !isTeamMember && (project.userId?.toString() !== context.user.id) ?
        await ProjectTask.exists({ projectId: id, assigneeId: context.user.id, isDeleted: false }) :
        false;

      // Check if user owns the project, is a team member, is assigned tasks, or is staff
      if (project.userId.toString() !== context.user.id &&
        !isTeamMember &&
        !hasAssignedTasks &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }
      return project;
    },

    // Certificates
    certificates: async (_: any, __: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }
      return await Certificate.find().populate('userId courseId').sort({ createdAt: -1 });
    },
    myCertificates: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter = isAdmin ? {} : { userId: context.user.id };
      return await Certificate.find(filter).populate('userId courseId').sort({ createdAt: -1 });
    },
    certificate: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const certificate = await Certificate.findById(id).populate('userId courseId');
      if (!certificate) throw new Error('Certificate not found');

      // Check if user owns the certificate or is admin/trainer
      if (certificate.userId.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }
      return certificate;
    },

    myCourseProgress: async (_: any, { courseId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (!courseId || courseId === "" || courseId === "undefined" || courseId === "null") return null;
      let progress = await CourseProgress.findOne({ userId: context.user.id, courseId });
      return progress;
    },

    // Internships
    internships: async (_: any, { page = 1, limit = 10 }: any, context: any) => {
      if (!context.user || !['super_admin', 'admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const query: any = {};
      if (context.user.role === 'admin' || context.user.role === 'trainer') {
        query.mentorId = context.user.id;
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        Internship.find(query).populate('userId mentorId').sort({ createdAt: -1 }).skip(skip).limit(limit),
        Internship.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },
    getInternshipStandups: async (_: any, { internshipId }: any, context: any) => {
      if (!context.user) throw new Error('Not authorized');
      return await Standup.find({ internshipId }).populate('userId').sort({ date: -1 });
    },
    getMyStandups: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authorized');
      return await Standup.find({ userId: context.user._id }).populate('userId').sort({ date: -1 });
    },
    myInternship: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await Internship.findOne({ userId: context.user.id }).populate('userId mentorId');
    },

    internship: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const internship = await Internship.findById(id).populate('userId mentorId');
      if (!internship) throw new Error('Internship not found');

      // Check if user owns the internship or is admin/trainer/mentor
      if (internship.userId.toString() !== context.user.id &&
        internship.mentorId?.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }
      return internship;
    },
    allInternshipStages: async () => {
      // These can eventually be fetched from Config model if customized
      return [
        {
          id: 1,
          title: "Orientation & Onboarding",
          duration: "1–2 weeks",
          purpose: "Help interns understand the platform, tools, expectations, and career pathways.",
          keyActivities: ["Platform introduction", "Internship rules & ethics", "Digital tools setup", "Baseline skills assessment", "Goal setting"],
          outcome: "Interns are ready, confident, and aligned with the program."
        },
        {
          id: 2,
          title: "Foundation Skills Training",
          duration: "4–6 weeks",
          purpose: "Build strong practical and job-ready skills aligned with market needs.",
          keyActivities: ["Core technical skills", "Soft skills", "Practical exercises & mini-projects", "Continuous assessments"],
          outcome: "Interns gain industry-relevant foundational skills."
        },
        {
          id: 3,
          title: "Guided Practical Projects",
          duration: "6–8 weeks",
          purpose: "Apply learned skills to real-world problems.",
          keyActivities: ["Assigned company projects", "Weekly mentorship sessions", "Code reviews", "Team collaboration"],
          outcome: "Interns build portfolio-ready projects and confidence."
        },
        {
          id: 4,
          title: "Industry Internship / Work Simulation",
          duration: "8–12 weeks",
          purpose: "Expose interns to real working environments, even remotely.",
          keyActivities: ["Task deadlines and reporting", "Time tracking", "Performance monitoring", "Professional communication"],
          outcome: "Interns gain hands-on work experience."
        },
        {
          id: 5,
          title: "Evaluation & Certification",
          duration: "1–2 weeks",
          purpose: "Measure competence and recognize achievement.",
          keyActivities: ["Final project presentation", "Skills evaluation", "Performance review", "Certification issuance"],
          outcome: "Interns receive recognized certificates and feedback."
        },
        {
          id: 6,
          title: "Career Transition & Placement Support",
          duration: "Ongoing",
          purpose: "Support interns to transition into employment or entrepreneurship.",
          keyActivities: ["CV & portfolio support", "Interview preparation", "Job matching", "Freelancing guidance"],
          outcome: "Interns move into jobs or self-employment."
        }
      ];
    },
    myMentees: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (context.user.role !== 'trainer' && context.user.role !== 'admin' && context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }

      // Get all internships where the current user is the mentor
      return await Internship.find({ mentorId: context.user.id })
        .populate('userId mentorId')
        .sort({ createdAt: -1 });
    },
    branding: async () => {
      const config = await Config.findOne({ key: 'branding' });
      const siteName = await Config.findOne({ key: 'siteName' });
      const primaryColor = await Config.findOne({ key: 'primaryColor' });
      const portalTitle = await Config.findOne({ key: 'portalTitle' });
      const maintenanceMode = await Config.findOne({ key: 'maintenanceMode' });

      const defaults = {
        primaryColor: '#D4AF37',
        secondaryColor: '#B08D2A',
        accentColor: '#D4AF37',
        logoUrl: '',
        siteName: 'MultiCourses',
        portalTitle: 'Academy Hub',
        maintenanceMode: false
      };

      const brandingVal = config?.value || {};

      return {
        ...defaults,
        ...brandingVal,
        siteName: siteName?.value || brandingVal.siteName || defaults.siteName,
        primaryColor: primaryColor?.value || brandingVal.primaryColor || defaults.primaryColor,
        portalTitle: portalTitle?.value || brandingVal.portalTitle || defaults.portalTitle,
        maintenanceMode: maintenanceMode ? (maintenanceMode.value === 'true' || maintenanceMode.value === true) : (brandingVal.maintenanceMode || defaults.maintenanceMode)
      };
    },
    // Internship Module Queries
    internshipPrograms: async (_: any, { page = 1, limit = 10, search, category, price, level, school }: any, context: any) => {
      const query: any = { isDeleted: false };
      if (context.user?.role === 'admin') {
        query.createdBy = context.user.id;
      }

      // Server-side text search across title and description
      if (search && search.trim()) {
        const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(q, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
        ];
      }

      // Server-side category filter (search in title as proxy, since internship programs may not have a dedicated category field)
      if (category && category !== 'All') {
        const catRegex = new RegExp(category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { title: catRegex }];
          delete query.$or;
        } else {
          query.title = catRegex;
        }
      }

      // Server-side price filter
      if (price && price !== 'all') {
        const priceCondition = price === 'free' ? { $or: [{ price: 0 }, { price: { $exists: false } }] } : { price: { $gt: 0 } };
        if (query.$and) {
          query.$and.push(priceCondition);
        } else if (query.$or) {
          query.$and = [{ $or: query.$or }, priceCondition];
          delete query.$or;
        } else {
          Object.assign(query, priceCondition);
        }
      }

      // Server-side level filter (searches eligibility string as proxy)
      if (level && level !== 'all') {
        const escaped = level.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const levelCondition = { eligibility: { $regex: new RegExp(escaped, 'i') } };
        if (query.$and) {
          query.$and.push(levelCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, levelCondition];
        } else {
          Object.assign(query, levelCondition);
        }
      }

      // Server-side school filter (searches description as proxy, since InternshipProgram has no dedicated school field)
      if (school && school !== 'all') {
        const schoolCondition = { description: new RegExp(school.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
        if (query.$and) {
          query.$and.push(schoolCondition);
        } else if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [{ $or: existingOr }, schoolCondition];
        } else {
          Object.assign(query, schoolCondition);
        }
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        InternshipProgram.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        InternshipProgram.countDocuments(query)
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },
    internshipProgram: async (_: any, { id }: { id: string }) => await InternshipProgram.findById(id),
    internshipApplications: async (_: any, { programId, status, page = 1, limit = 10 }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');

      const query: any = { isDeleted: false };

      if (context.user.role === 'admin') {
        const myPrograms = await InternshipProgram.find({ createdBy: context.user.id }).distinct('_id');
        if (programId) {
          if (!myPrograms.map(id => id.toString()).includes(programId.toString())) {
            throw new Error('Unauthorized access to this program');
          }
          query.internshipProgramId = programId;
        } else {
          query.internshipProgramId = { $in: myPrograms };
        }
      } else if (programId) {
        query.internshipProgramId = programId;
      }

      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        InternshipApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        InternshipApplication.countDocuments(query)
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },
    myInternshipApplications: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = { isDeleted: false };
      if (!isAdmin) filter.userId = context.user.id;
      return await InternshipApplication.find(filter).sort({ createdAt: -1 });
    },
    internshipProject: async (_: any, { id }: { id: string }) => await InternshipProject.findById(id),
    internshipProjects: async (_: any, { programId, page = 1, limit = 10 }: any, context: any) => {
      const query: any = { isDeleted: false };

      if (context.user && context.user.role === 'admin') {
        const myPrograms = await InternshipProgram.find({ createdBy: context.user.id }).distinct('_id');
        if (programId) {
          if (!myPrograms.map(id => id.toString()).includes(programId.toString())) {
            throw new Error('Unauthorized access to this program');
          }
          query.internshipProgramId = programId;
        } else {
          query.$or = [
            { internshipProgramId: { $in: myPrograms } },
            { trainer: context.user.id } // also allow if they are the trainer
          ];
        }
      } else if (programId) {
        query.internshipProgramId = programId;
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        InternshipProject.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        InternshipProject.countDocuments(query)
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },
    internshipTeams: async (_: any, { programId, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const query: any = { isDeleted: false };
      if (programId) query.internshipProgramId = programId;

      if (!['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      if (context.user.role === 'admin') {
        const myPrograms = await InternshipProgram.find({ createdBy: context.user.id }).distinct('_id');
        if (programId) {
          if (!myPrograms.map(id => id.toString()).includes(programId.toString())) {
            throw new Error('Unauthorized access to this program');
          }
          query.internshipProgramId = programId;
        } else {
          query.internshipProgramId = { $in: myPrograms };
        }
      } else if (context.user.role === 'trainer') {
        query.mentorId = context.user.id;
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        InternshipTeam.find(query).populate('mentorId').skip(skip).limit(limit),
        InternshipTeam.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },
    myInternshipTeam: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const membership = await InternshipTeamMember.findOne({ userId: context.user.id, isDeleted: false });
      if (!membership) return null;
      return await InternshipTeam.findById(membership.teamId).populate('mentorId');
    },
    internshipSubmissions: async (_: any, { teamId }: { teamId?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const filter: any = { isDeleted: false };
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);

      if (teamId) {
        const team = await InternshipTeam.findById(teamId);
        if (!team) throw new Error('Team not found');

        const isMember = await InternshipTeamMember.findOne({ teamId, userId: context.user.id, isDeleted: false });
        const isMentor = team.mentorId?.toString() === context.user.id;

        if (!isMember && !isAdmin && !isMentor) throw new Error('Unauthorized');
        filter.teamId = teamId;
      } else {
        // Global view for trainers (all teams they mentor) or admins (everything)
        if (!isAdmin && context.user.role !== 'trainer') {
          throw new Error('Unauthorized for global submissions view');
        }

        if (context.user.role === 'trainer') {
          const mentoredTeams = await InternshipTeam.find({ mentorId: context.user.id, isDeleted: false });
          const teamIds = mentoredTeams.map(t => t._id);
          filter.teamId = { $in: teamIds };
        }
      }

      return await InternshipSubmission.find(filter)
        .populate('userId')
        .populate('milestoneId')
        .sort({ createdAt: -1 });
    },
    internshipTimeLogs: async (_: any, { teamId, userId }: { teamId?: string, userId?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const query: any = { isDeleted: false };
      if (teamId) query.teamId = teamId;

      if (context.user.role === 'admin') {
        // Admins can only see logs if they own the program associated with the team
        // For simplicity, we'll assume they should only see logs for teams they are mentors of or programs they created
        const myPrograms = await InternshipProgram.find({ createdBy: context.user.id }).distinct('_id');
        // We might need to join with Team model to be perfect, but let's at least enforce basic role checks
      }

      if (userId) query.userId = userId;
      return await InternshipTimeLog.find(query).sort({ date: -1 });
    },
    internshipActivityLogs: async (_: any, { programId, targetType, targetId, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const query: any = { isDeleted: false };

      if (context.user.role === 'admin') {
        const myPrograms = await InternshipProgram.find({ createdBy: context.user.id }).distinct('_id');
        if (programId) {
          if (!myPrograms.map(id => id.toString()).includes(programId.toString())) {
            throw new Error('Unauthorized');
          }
          query.programId = programId;
        } else {
          query.programId = { $in: myPrograms };
        }
      } else if (programId) {
        query.programId = programId;
      }

      if (targetType) query.targetType = targetType;
      if (targetId) query.targetId = targetId;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        InternshipActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        InternshipActivityLog.countDocuments(query)
      ]);
      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    },

    // Sprint & Task Board Queries
    internshipSprints: async (_: any, { projectId, teamId }: { projectId: string; teamId?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const query: any = { projectId, isDeleted: false };
      if (teamId) query.teamId = teamId;
      return await InternshipSprint.find(query).sort({ order: 1, createdAt: 1 });
    },

    internshipTasks: async (_: any, { projectId, sprintId, teamId, assigneeId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const query: any = { isDeleted: false };
      if (projectId) query.projectId = projectId;
      if (sprintId) query.sprintId = sprintId;
      if (teamId) query.teamId = teamId;
      if (assigneeId) query.assigneeId = assigneeId;
      // Students see only their own tasks
      if (context.user.role === 'student') query.assigneeId = context.user.id;
      return await InternshipTask.find(query).sort({ order: 1, createdAt: 1 });
    },

    internshipTask: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await InternshipTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');
      return task;
    },

    // Student Profile Queries
    myStudentProfile: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await StudentProfile.findOne({ userId: context.user.id });
    },
    studentProfile: async (_: any, { userId }: { userId: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      return await StudentProfile.findOne({ userId });
    },
    studentProfiles: async (_: any, __: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      return await StudentProfile.find({});
    },

    studentProjectProgress: async (_: any, __: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const students = await User.find({ role: 'student', isDeleted: { $ne: true } });
      const allProjects = await Project.find({ isArchived: { $ne: true } })
        .populate('userId')
        .sort({ createdAt: -1 });

      // Collect all project IDs to batch-fetch tasks
      const projectIds = allProjects.map(p => p._id);

      // Fetch all ProjectTask documents for these projects in one query
      const allTasks = await ProjectTask.find({
        projectId: { $in: projectIds },
        isDeleted: false,
      }).populate('assigneeId');

      return students.map(student => {
        const studentProjects = (allProjects as any[]).filter(
          p => p.userId && p.userId._id && p.userId._id.toString() === student._id.toString()
        );

        const studentProjectIds = studentProjects.map(p => p._id.toString());

        // Find tasks assigned to this student OR tasks in their projects
        const studentTasks = (allTasks as any[]).filter(
          t => studentProjectIds.includes(t.projectId.toString()) &&
            t.assigneeId && t.assigneeId._id && t.assigneeId._id.toString() === student._id.toString()
        );

        const totalProjects = studentProjects.length;
        const completedProjects = studentProjects.filter(p => p.status === 'completed').length;
        const inProgressProjects = studentProjects.filter(p => p.status === 'in_progress').length;
        const pendingReviewProjects = studentProjects.filter(p => p.status === 'pending_review').length;
        const averageProgress = totalProjects > 0
          ? Math.round(studentProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
          : 0;

        // Task stats
        const totalTasks = studentTasks.length;
        const completedTasks = studentTasks.filter(t => t.status === 'done' || t.approved).length;
        const inProgressTasks = studentTasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = studentTasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;
        const inReviewTasks = studentTasks.filter(t => t.status === 'in_review').length;
        const taskCompletionPercentage = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        return {
          student,
          totalProjects,
          completedProjects,
          inProgressProjects,
          pendingReviewProjects,
          averageProgress,
          projects: studentProjects,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          inReviewTasks,
          taskCompletionPercentage,
        };
      }).filter(s => s.totalProjects > 0);
    },

    // Payment Queries
    internshipPayments: async (_: any, { programId, status }: { programId?: string, status?: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const query: any = { isDeleted: false };
      if (programId) query.internshipProgramId = programId;
      if (status) query.status = status;
      return await InternshipPayment.find(query).sort({ createdAt: -1 });
    },
    myInternshipPayments: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = { isDeleted: false };
      if (!isAdmin) filter.userId = context.user.id;
      return await InternshipPayment.find(filter).sort({ createdAt: -1 });
    },
    internshipPayment: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const payment = await InternshipPayment.findById(id);
      if (!payment) throw new Error('Payment not found');
      // Allow access to own payment or admin
      if (payment.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      return payment;
    },

    // Invoice Queries
    internshipInvoices: async (_: any, { userId }: { userId?: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const query: any = { isDeleted: false };
      if (userId) query.userId = userId;
      return await InternshipInvoice.find(query).sort({ issuedAt: -1 });
    },
    internshipInvoice: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const invoice = await InternshipInvoice.findById(id);
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      return invoice;
    },

    // Certificate Queries
    internshipCertificates: async (_: any, { programId }: { programId?: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const query: any = { isDeleted: false };
      if (programId) query.internshipProgramId = programId;
      return await InternshipCertificate.find(query).sort({ issuedAt: -1 });
    },
    myInternshipCertificates: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = { isDeleted: false, isRevoked: false };
      if (!isAdmin) filter.userId = context.user.id;
      return await InternshipCertificate.find(filter).sort({ issuedAt: -1 });
    },
    internshipCertificate: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const cert = await InternshipCertificate.findById(id);
      if (!cert) throw new Error('Certificate not found');
      if (cert.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      return cert;
    },
    verifyCertificate: async (_: any, { certificateNumber }: { certificateNumber: string }) => {
      const cert = await InternshipCertificate.findOne({ certificateNumber, isDeleted: false });
      if (!cert) throw new Error('Certificate not found');
      if (cert.isRevoked) throw new Error('Certificate has been revoked');
      return cert;
    },

    courseApplications: async (_: any, { courseId, status, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      const query: any = { isDeleted: false };
      if (courseId) query.courseId = courseId;
      if (status) query.status = status;

      // Scope applications: admin sees apps for their courses; trainer sees apps for their courses
      if (context.user.role === 'admin' || context.user.role === 'trainer') {
        const courses = await Course.find({
          $or: [{ instructor: context.user.id }, { createdBy: context.user.id }]
        });
        const courseIds = courses.map(c => c._id);
        if (courseId) {
          // Verify admin has access to this course
          if (!courseIds.map(id => id.toString()).includes(courseId.toString())) {
            throw new Error('Unauthorized access to this course\'s applications');
          }
        } else {
          query.courseId = { $in: courseIds };
        }
      }

      const applications = await CourseApplication.find(query)
        .populate({ path: 'userId', model: 'User' })
        .populate({ path: 'courseId', model: 'Course' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const totalCount = await CourseApplication.countDocuments(query);

      const validApplications = applications.filter(app => app.courseId != null);

      return {
        items: validApplications.map(app => {
          const obj = app.toObject();
          return {
            ...obj,
            id: app._id,
            courseId: ((app.courseId as any)._id || app.courseId).toString(),
            userId: app.userId ? ((app.userId as any)._id || app.userId).toString() : null,
            user: obj.userId,
            course: obj.courseId,
          };
        }),
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      };
    },
    myCourseApplications: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const isAdmin = ['admin', 'super_admin'].includes(context.user.role);
      const filter: any = { isDeleted: false };
      if (!isAdmin) filter.userId = context.user.id;
      const apps = await CourseApplication.find(filter)
        .populate({ path: 'courseId', model: 'Course' })
        .sort({ createdAt: -1 });

      const validApps = apps.filter(app => app.courseId != null);

      return validApps.map(app => {
        const obj = app.toObject();
        return {
          ...obj,
          id: app._id,
          courseId: ((app.courseId as any)._id || app.courseId).toString(),
          userId: app.userId.toString(),
          course: obj.courseId,
        };
      });
    },

    // ─── Discount Code Queries ───────────────────────────────────────────
    discountCodes: async (_: any, { courseId, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      // Super admin sees everything; admin sees only discount codes they created
      const filter: any = {};
      if (courseId) filter.courseId = courseId;
      if (context.user.role === 'admin') {
        filter.createdBy = context.user.id;
      }

      
      const totalCount = await DiscountCode.countDocuments(filter);
      const items = await DiscountCode.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('courseId')
        .populate('createdBy');
      
      // Convert populated courseId back to string ID for GraphQL ID serialization
      const sanitizedItems = items.map((item: any) => {
        const obj: any = item.toObject ? item.toObject({ virtuals: true }) : { ...item, id: (item as any)._id?.toString() };
        if (obj.courseId && typeof obj.courseId === 'object') {
          obj.courseId = obj.courseId._id ? obj.courseId._id.toString() : obj.courseId.toString();
        }
        return obj;
      });
      
      return {
        items: sanitizedItems,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      };
    },
    
    discountCode: async (_: any, { id }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const item = await DiscountCode.findById(id).populate('courseId').populate('createdBy');
      if (!item) return null;
      // Convert populated courseId back to string ID for GraphQL ID serialization
      const obj: any = item.toObject ? item.toObject({ virtuals: true }) : { ...item, id: (item as any)._id?.toString() };
      if (obj.courseId && typeof obj.courseId === 'object') {
        obj.courseId = obj.courseId._id ? obj.courseId._id.toString() : obj.courseId.toString();
      }
      return obj;
    },
    

    getSignedNDA: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const { ProjectNDA } = require('../models/ProjectNDA');

      if (!applicationId) throw new Error('applicationId is required');

      // applicationId can be a string or ObjectId; ensure robust lookup.
      const appIdStr = typeof applicationId === 'string' ? applicationId : applicationId?.toString?.();
      if (!appIdStr) throw new Error('Invalid applicationId');

      // Try direct match first
      let nda = await ProjectNDA.findOne({ projectApplicationId: applicationId }).populate('clientId');

      // Fallback: match by stringified id
      if (!nda) {
        nda = await ProjectNDA.findOne({ projectApplicationId: { $in: [appIdStr] } }).populate('clientId');
      }

      // If still not found, return a clearer error with the id used.
      if (!nda) {
        throw new Error(`Pending NDA not found for this application (${appIdStr})`);
      }

      const obj = nda.toObject();
      return {
        ...obj,
        id: nda._id.toString(),
        applicationId: nda.projectApplicationId.toString(),
        clientId: nda.clientId?._id?.toString() || nda.clientId?.toString(),
        client: nda.clientId,
        pdfUrl: nda.pdfUrl,
      };
    },

    ndaDailyLimitStatus: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const { ProjectNDA } = require('../models/ProjectNDA');
      const { Config } = require('../models/Config');
      
      const DAILY_LIMIT = parseInt(
        process.env.NDA_DAILY_LIMIT ||
          (await Config.findOne({ key: 'ndaDailyLimit' }))?.value?.toString() ||
          '100',
        10
      );
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const used = await ProjectNDA.countDocuments({
        clientId: context.user.id,
        status: 'signed',
        signedAt: { $gte: todayStart, $lte: todayEnd },
      });
      
      return {
        limit: DAILY_LIMIT,
        used,
        remaining: Math.max(0, DAILY_LIMIT - used),
      };
    },

    projectOnboarding: async (_: any, { projectId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const { ProjectOnboarding } = require('../models/ProjectOnboarding');
      // Students can only see their own onboarding; admins can see all
      if (context.user.role === 'student') {
        return await ProjectOnboarding.find({ projectId, developerId: context.user.id }).populate('developerId');
      }
      return await ProjectOnboarding.find({ projectId }).populate('developerId');
    },

    projectApplications: async (_: any, { status }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const query: any = { status: { $ne: 'deleted' } };
      
      // Super admin sees all; admin sees only their assigned or unassigned apps
      if (context.user.role !== 'super_admin') {
        query.$or = [
          { assignedAdmin: context.user.id },
          { assignedAdmin: { $exists: false } },
          { assignedAdmin: null },
        ];
      }
      
      if (status) query.status = status;
      const apps = await ProjectApplication.find(query)
        .populate('clientId')
        .populate('assignedAdmin')
        .sort({ createdAt: -1 });

      return apps.map((app: any) => {
        const obj = app.toObject();
        return {
          ...obj,
          id: app._id.toString(),
          _id: app._id.toString(),
          clientId: app.clientId?._id?.toString() || app.clientId?.toString?.() || app.clientId,
          userId: app.userId?.toString?.() || app.userId,
          assignedAdmin: app.assignedAdmin,
        };
      });
    },
  },
  ProjectTask: {
    ...projectTaskResolvers.ProjectTask,
  },
  DeveloperEvaluation: {
    developer: async (parent: any) => {
      if (!parent.developerId) return null;
      if (typeof parent.developerId === 'object' && (parent.developerId as any).username) {
        return parent.developerId;
      }
      return await User.findById(parent.developerId);
    },
  },
  Mutation: {
    validateDiscountCode: async (_: any, { code, courseId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      
      const discountCode = await DiscountCode.findOne({
        code: code.toUpperCase(),
        courseId,
        isActive: true,
      });
      
      if (!discountCode) {
        return { valid: false, message: 'Invalid or expired discount code' };
      }
      
      // Check expiry
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        return { valid: false, message: 'This discount code has expired' };
      }
      
      // Check usage limit
      if (discountCode.currentUses >= discountCode.maxUses) {
        return { valid: false, message: 'This discount code has reached its maximum uses' };
      }
      
      // Get course price
      const courseDoc = await Course.findById(discountCode.courseId);
      const coursePrice = courseDoc?.price || 0;
      
      let finalPrice = coursePrice;
      if (discountCode.discountType === 'percentage') {
        finalPrice = Math.max(0, coursePrice - (coursePrice * discountCode.discountValue / 100));
      } else if (discountCode.discountType === 'fixed') {
        finalPrice = Math.max(0, coursePrice - discountCode.discountValue);
      }
      
      return {
        valid: true,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        finalPrice,
        originalPrice: coursePrice,
        message: discountCode.discountValue === 0 || finalPrice === 0
          ? 'This code makes the course free!'
          : `Code applied! You save ${discountCode.discountType === 'percentage' ? `${discountCode.discountValue}%` : `${discountCode.discountValue} RWF`}`,
      };
    },
    applyToCourse: async (_: any, { courseId, applicationAnswers, selectedDeliveryMode }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');
      if (course.enrollmentMode !== 'application') throw new Error('Course does not require an application');

      const existingApp = await CourseApplication.findOne({ courseId, userId: context.user.id, isDeleted: false });
      if (existingApp) throw new Error('You have already applied to this course');

      const app = new CourseApplication({
        courseId,
        userId: context.user.id,
        applicationAnswers,
        selectedDeliveryMode,
        status: 'pending'
      });
      await app.save();

      // Send application confirmation email
      try {
        const user = await User.findById(context.user.id).select('email username fullName');
        if (user?.email) {
          await sendApplicationConfirmation(
            user.email,
            user.fullName || user.username || 'Student',
            course.title
          );
        }
      } catch (emailErr) {
        console.error('[ApplyToCourse] Email error:', emailErr);
      }

      return app;
    },

    updateCourseApplicationStatus: async (_: any, { applicationId, status, rejectionReason }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      const app = await CourseApplication.findById(applicationId);
      if (!app) throw new Error('Application not found');

      // Verification if trainer owns course
      if (context.user.role === 'trainer') {
        const course = await Course.findById(app.courseId);
        if (course?.instructor?.toString() !== context.user.id) {
          throw new Error('Not authorized to update this course application');
        }
      }

      app.status = status;
      if (rejectionReason) app.rejectionReason = rejectionReason;
      await app.save();

      if (status === 'approved') {
        // Enroll student in course
        const user = await User.findById(app.userId);
        const course = await Course.findById(app.courseId);
        if (user && course && !user.enrolledCourses.some(id => id.toString() === app.courseId.toString())) {
          user.enrolledCourses.push(app.courseId as any);          if (!course.studentsEnrolled.some(id => id.toString() === app.userId.toString())) {
             course.studentsEnrolled.push(app.userId as any);
             course.studentsEnrolledCount = course.studentsEnrolled.length;
           }
           await course.save();
           await user.save();
        }
      }

      // Send email notification about the status change
      try {
        const user = await User.findById(app.userId).select('email username fullName');
        const course = await Course.findById(app.courseId).select('title');
        if (user?.email && course) {
          await sendApplicationStatusUpdate(
            user.email,
            user.fullName || user.username || 'Student',
            course.title,
            status,
            rejectionReason || undefined
          );

          // If approved, also send course enrollment confirmation
          if (status === 'approved') {
            await sendCourseEnrollmentConfirmation(
              user.email,
              user.fullName || user.username || 'Student',
              course.title
            );
          }
        }
      } catch (emailErr) {
        console.error('[UpdateApplicationStatus] Email error:', emailErr);
      }

      // Re-fetch with populated fields so frontend receives user + course
      const populated = await CourseApplication.findById(app._id)
        .populate({ path: 'userId', model: 'User' })
        .populate({ path: 'courseId', model: 'Course' });
      const obj = populated!.toObject();
      return { ...obj, id: obj._id, user: obj.userId, course: obj.courseId };
    },
    pingInstructor: async (_: any, { submissionId, message }: any, context: any) => {
      const submission = await AssignmentSubmission.findById(submissionId).populate('courseId');
      if (!submission) throw new Error('Submission not found');

      const course = submission.courseId as any;
      if (course && course.instructor) {
        const instructor = await User.findById(course.instructor);
        const link = instructor?.role === 'admin' || instructor?.role === 'super_admin'
          ? '/portal/admin/assignment-reviews'
          : '/portal/trainer/projects';

        await sendNotification(course.instructor.toString(), {
          type: 'ASSIGNMENT_REVIEW_PING',
          title: 'Review Assistance Needed',
          message: `${context.user.fullName || context.user.username} is reviewing a submission for ${course.title}: ${message || 'No additional message'}`,
          link: link
        });
        return true;
      }
      return false;
    },
    singleUpload: async (_: any, { file, folder, resourceType }: { file: any, folder?: string, resourceType?: string }) => {
      const { createReadStream, filename } = await file;
      const stream = createReadStream();

      // Use tmp to buffer the stream to disk for reliable upload_large
      const { path, cleanup } = await tmpFile({
        postfix: filename.substring(filename.lastIndexOf('.'))
      });

      try {
        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(path);
          stream.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Determine effective resource type
        // For PPT/X, we use 'video' only for files > 10MB to bypass the 10MB raw limit.
        // Smaller files use 'raw' to avoid "Unsupported video format" errors.
        let effectiveResourceType = (resourceType || 'auto') as "auto" | "image" | "video" | "raw";
        if (filename.toLowerCase().endsWith('.ppt') || filename.toLowerCase().endsWith('.pptx')) {
          const stats = fs.statSync(path);
          const fileSizeInMB = stats.size / (1024 * 1024);

          if (fileSizeInMB > 10) {
            effectiveResourceType = 'video';
          } else {
            effectiveResourceType = 'raw';
          }
        }

        const extension = filename.substring(filename.lastIndexOf('.'));
        const publicIdBase = filename.substring(0, filename.lastIndexOf('.')).replace(/[^a-zA-Z0-9]/g, '_');

        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(path, {
            folder: folder || 'ihub-academy',
            resource_type: effectiveResourceType,
            public_id: `${publicIdBase}_${Date.now()}${extension}`,
            chunk_size: 6000000, // 6MB chunks
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        }) as any;

        console.log('Cloudinary upload_large resolved result:', JSON.stringify(result, null, 2));

        if (!result || (!result.secure_url && !result.url)) {
          throw new Error('Cloudinary upload failed: No URL returned in response');
        }

        return {
          url: result.secure_url || result.url,
          publicId: result.public_id,
          resourceType: result.resource_type
        };
      } finally {
        await cleanup();
      }
    },
    markNotificationRead: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId: context.user.id },
        { read: true },
        { new: true }
      );
      return notification;
    },
    markAllNotificationsRead: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      await Notification.updateMany(
        { userId: context.user.id, read: false },
        { read: true }
      );
      return true;
    },

    updatePresence: async (_: any, __: any, context: any) => {
      if (!context.user) return false;
      await User.findByIdAndUpdate(context.user.id, {
        isOnline: true,
        lastActive: new Date()
      });
      return true;
    },

    goOffline: async (_: any, __: any, context: any) => {
      if (!context.user) return false;
      await User.findByIdAndUpdate(context.user.id, {
        isOnline: false,
        lastActive: new Date()
      });
      return true;
    },

    // Resource Mutations
    createResource: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const resource = new Resource({
        ...input,
        createdBy: context.user.id
      });

      await resource.save();
      return await resource.populate('createdBy');
    },

    updateResource: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const resource = await Resource.findById(id);
      if (!resource) throw new Error('Resource not found');

      // Only creator or admin can update
      if (resource.createdBy.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      Object.assign(resource, input);
      await resource.save();
      return await resource.populate('createdBy');
    },

    deleteResource: async (_: any, { id }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const resource = await Resource.findById(id);
      if (!resource) throw new Error('Resource not found');

      // Only creator or admin can delete
      if (resource.createdBy.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      await Resource.findByIdAndDelete(id);
      return true;
    },

    submitAssignment: async (_: any, { courseId, lessonId, content }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');

      // Check for existing submission to update or create new
      let submission = await AssignmentSubmission.findOne({
        userId: context.user.id,
        courseId,
        lessonId
      });

      if (submission) {
        submission.content = content;
        submission.status = 'pending';
        // Reset grade/feedback on resubmission? Probably yes.
        submission.grade = undefined;
        submission.feedback = undefined;
        await submission.save();
      } else {
        submission = await AssignmentSubmission.create({
          userId: context.user.id,
          courseId,
          lessonId,
          content,
          status: 'pending'
        });
      }

      // Log activity
      await logActivity(context.user.id, 'SUBMIT_ASSIGNMENT', 'AssignmentSubmission', submission.id, `Submitted assignment for lesson ${lessonId} in course ${courseId}`);

      // Notify Instructor or Admin
      const course = courseId ? await Course.findById(courseId) : null;
      if (course) {
        if (course.instructor) {
          const instructor = await User.findById(course.instructor);
          const link = instructor?.role === 'admin' || instructor?.role === 'super_admin'
            ? '/portal/admin/assignment-reviews'
            : '/portal/trainer/projects';

          sendNotification(course.instructor.toString(), {
            type: 'ASSIGNMENT_SUBMITTED',
            title: 'New Assignment Submission',
            message: `${context.user.fullName || context.user.username} submitted an assignment for ${course.title}.`,
            link: link
          });
        } else {
          // If no instructor, notify all admins
          const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
          for (const admin of admins) {
            sendNotification(admin._id.toString(), {
              type: 'ASSIGNMENT_SUBMITTED',
              title: 'Unassigned Course Submission',
              message: `${context.user.fullName || context.user.username} submitted an assignment for unassigned course ${course.title}.`,
              link: '/portal/admin/assignment-reviews'
            });
          }
        }
      }

      const populated = await submission.populate(['userId', 'courseId']);
      return {
        ...populated.toObject(),
        id: populated._id,
        user: populated.userId,
        userId: populated.userId?._id || populated.userId,
        course: populated.courseId,
        courseId: populated.courseId?._id || populated.courseId
      };
    },
    submitAssignmentExam: async (_: any, { courseId, lessonId, answers, timeTaken }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');

      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');

      let targetLesson: any = null;
      course.modules.forEach((m: any) => {
        const found = m.lessons.find((l: any) => l.id === lessonId);
        if (found) targetLesson = found;
      });
      if (!targetLesson) throw new Error('Lesson not found');

      // ── Batch-grade open questions in a single AI call ──
      const openQuestions = answers.filter((ans: any) => {
        const q = targetLesson.assignmentQuestions.find((q: any) => q._id?.toString() === ans.questionId || q.id === ans.questionId);
        return q && q.type === 'open';
      });

      let batchResults: Array<{ questionId: string; score: number; feedback: string }> = [];
      if (openQuestions.length > 0) {
        const batchInput = openQuestions.map((ans: any) => {
          const q = targetLesson.assignmentQuestions.find((q: any) => q._id?.toString() === ans.questionId || q.id === ans.questionId);
          return {
            questionText: q.questionText,
            answerText: ans.answerText,
            maxScore: q.points || 10
          };
        });

        try {
          const batchScoreResults = await batchReviewOpenQuestionsService(batchInput);
          batchResults = openQuestions.map((ans: any, i: number) => ({
            questionId: ans.questionId,
            score: batchScoreResults[i]?.score || 0,
            feedback: batchScoreResults[i]?.feedback || 'AI grading completed.'
          }));
        } catch (err) {
          console.error('Batch AI grading failed:', err);
          batchResults = openQuestions.map((ans: any) => ({
            questionId: ans.questionId,
            score: 0,
            feedback: 'AI grading unavailable.'
          }));
        }
      }

      let totalScore = 0;
      const gradedAnswers = answers.map((ans: any) => {
        const question = targetLesson.assignmentQuestions.find((q: any) => q._id?.toString() === ans.questionId || q.id === ans.questionId);
        if (!question) return { ...ans, score: 0 };

        if (question.type === 'mcq') {
          const isCorrect = parseInt(ans.answerText) === question.correctOptionIndex;
          const score = isCorrect ? (question.points || 10) : 0;
          totalScore += score;
          return {
            ...ans,
            score,
            aiFeedback: isCorrect ? 'Correct' : `Incorrect. The correct answer was: ${question.options[question.correctOptionIndex]}`
          };
        } else if (question.type === 'open') {
          const batchResult = batchResults.find((r: any) => r.questionId === ans.questionId);
          const score = batchResult?.score || 0;
          totalScore += score;
          return {
            ...ans,
            score,
            aiFeedback: batchResult?.feedback || 'AI grading completed.'
          };
        }
        return ans;
      });

      // Calculate max possible score
      const maxScore = targetLesson.assignmentQuestions.reduce((sum: number, q: any) => sum + (q.points || 10), 0);
      const gradePercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Determine if all answers are auto-gradeable (MCQ only, or AI grading ran for all open questions)
      const hasOpenQuestions = targetLesson.assignmentQuestions.some((q: any) => q.type === 'open');
      const passingThreshold = course.passingScore || 50;
      const autoStatus: 'approved' | 'failed' = gradePercent >= passingThreshold ? 'approved' : 'failed';

      const submissionData = {
        userId: context.user.id,
        courseId,
        lessonId,
        content: `Exam Submission: ${gradedAnswers.length} questions answered`,
        answers: gradedAnswers,
        totalScore,
        timeTaken,
        grade: gradePercent,
        status: autoStatus,
        feedback: hasOpenQuestions
          ? `Auto-graded: ${gradePercent}% (${totalScore}/${maxScore} pts). Open-ended answers reviewed by AI.`
          : `Auto-graded: ${gradePercent}% (${totalScore}/${maxScore} pts).`
      };

      let submission = await AssignmentSubmission.findOne({
        userId: context.user.id,
        courseId,
        lessonId
      });

      if (submission) {
        Object.assign(submission, submissionData);
        await submission.save();
      } else {
        submission = await AssignmentSubmission.create(submissionData);
      }

      // Record grade on the user profile
      const user = await User.findById(context.user.id);
      if (user) {
        const existingGradeIdx = (user as any).grades?.findIndex((g: any) => g.lessonId === lessonId);
        const gradeEntry = { lessonId, score: gradePercent, courseId };
        if (existingGradeIdx >= 0) {
          (user as any).grades[existingGradeIdx] = gradeEntry;
        } else {
          if (!(user as any).grades) (user as any).grades = [];
          (user as any).grades.push(gradeEntry);
        }
        // Add XP reward based on score
        const xpReward = Math.round((gradePercent / 100) * 50); // max 50 XP for exam
        (user as any).xp = ((user as any).xp || 0) + xpReward;
        await user.save();
      }

      // Auto-complete the lesson if passing grade
      if (gradePercent >= passingThreshold) {
        try {
          const userDoc = await User.findById(context.user.id);
          if (userDoc) {
            const alreadyComplete = (userDoc as any).completedLessons?.some(
              (cl: any) => cl.lessonId === lessonId && cl.courseId?.toString() === courseId
            );
            if (!alreadyComplete) {
              if (!(userDoc as any).completedLessons) (userDoc as any).completedLessons = [];
              (userDoc as any).completedLessons.push({ courseId, lessonId, completedAt: new Date() });
              await userDoc.save();
            }
          }
        } catch (e) {
          // Non-critical — lesson completion failure shouldn't block exam result
        }
      }

      await logActivity(context.user.id, 'SUBMIT_ASSIGNMENT_EXAM', 'AssignmentSubmission', submission.id, `Submitted exam for lesson ${lessonId} — Score: ${gradePercent}%`);

      // ── Certificate auto-issuance on exam pass ──
      if (gradePercent >= passingThreshold) {
        try {
          // Update CourseProgress to 100%
          await CourseProgress.findOneAndUpdate(
            { userId: context.user.id, courseId },
            {
              userId: context.user.id,
              courseId,
              overallProgress: 100,
              status: 'completed',
              completionDate: new Date(),
              lastAccessed: new Date()
            },
            { upsert: true, new: true }
          );

          // Generate the certificate
          const cert = await autoGenerateCertificate(context.user.id, courseId, 'course');
          if (cert) {
            console.log(`🎓 Certificate auto-issued for user ${context.user.id} in course ${courseId} (exam pass: ${gradePercent}%)`);

            // Send in-app notification
            await sendNotification(context.user.id, {
              type: 'certificate_issued',
              title: '🎉 Certificate Issued!',
              message: `Congratulations! You've earned a certificate for "${course.title}" with a score of ${gradePercent}%.`,
              link: '/portal/student/certificates'
            });
          }
        } catch (certError) {
          // Non-critical — certificate generation failure shouldn't block exam result
          console.error('Error issuing certificate on exam pass:', certError);
        }
      }

      const populated = await submission.populate(['userId', 'courseId']);
      return {
        ...populated.toObject(),
        id: populated._id,
        user: populated.userId,
        course: populated.courseId
      };
    },

    updateCourseProgress: async (_: any, { courseId, lessonId }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      // Ensure courseProgress is initialized
      if (!user.courseProgress) {
        (user as any).courseProgress = [];
      }

      const existingIdx = (user.courseProgress as any[]).findIndex(p => p.courseId?.toString() === courseId);
      if (existingIdx > -1) {
        user.courseProgress[existingIdx].lessonId = lessonId;
        user.courseProgress[existingIdx].updatedAt = new Date();
      } else {
        user.courseProgress.push({ courseId, lessonId, updatedAt: new Date() });
      }

      await user.save();
      return user;
    },
    updateExamConfig: async (_: any, { courseId, lessonId, config }: any, context: any) => {
      if (!context.user || !['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');

      course.modules.forEach((m: any) => {
        const lesson = m.lessons.find((l: any) => l.id === lessonId);
        if (lesson) {
          lesson.assignmentConfig = {
            ...lesson.assignmentConfig,
            ...config
          };
        }
      });
      await course.save();
      return course;
    },
    updateQuizConfig: async (_: any, { courseId, lessonId, quizConfig }: any, context: any) => {
      if (!context.user || !['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');

      course.modules.forEach((m: any) => {
        const lesson = m.lessons.find((l: any) => l.id === lessonId);
        if (lesson) {
          lesson.quizConfig = {
            ...(lesson.quizConfig || {}),
            ...quizConfig
          };
        }
      });
      await course.save();
      return course;
    },
    aiGradeOpenAnswers: async (_: any, { submissionId }: any, context: any) => {
      if (!context.user || !['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const submission = await AssignmentSubmission.findById(submissionId).populate(['userId', 'courseId']);
      if (!submission) throw new Error('Submission not found');

      const course = await Course.findById(submission.courseId);
      if (!course) throw new Error('Course not found');

      let targetLesson: any = null;
      course.modules.forEach((m: any) => {
        const found = m.lessons.find((l: any) => l.id === submission.lessonId);
        if (found) targetLesson = found;
      });

      if (!targetLesson) throw new Error('Lesson not found');

      // ── Batch-grade all unanswered open questions in a single AI call ──
      const ungradedOpen = submission.answers.filter((ans: any) => {
        if (ans.score > 0 || ans.aiFeedback) return false;
        const q = targetLesson.assignmentQuestions.find((q: any) => q._id?.toString() === ans.questionId);
        return q && q.type === 'open';
      });

      if (ungradedOpen.length > 0) {
        const batchInput = ungradedOpen.map((ans: any) => {
          const q = targetLesson.assignmentQuestions.find((q: any) => q._id?.toString() === ans.questionId);
          return {
            questionText: q.questionText,
            answerText: ans.answerText,
            maxScore: q.points || 10
          };
        });

        try {
          const batchResults = await batchReviewOpenQuestionsService(batchInput);
          const batchMap = new Map<string, { score: number; feedback: string }>();
          ungradedOpen.forEach((ans: any, i: number) => {
            if (batchResults[i]) {
              batchMap.set(ans.questionId, {
                score: batchResults[i].score,
                feedback: batchResults[i].feedback
              });
            }
          });

          let totalScore = submission.totalScore || 0;
          const updatedAnswers = submission.answers.map((ans: any) => {
            const batchResult = batchMap.get(ans.questionId);
            if (batchResult) {
              totalScore += batchResult.score;
              return { ...ans, score: batchResult.score, aiFeedback: batchResult.feedback };
            }
            return ans;
          });

          submission.answers = updatedAnswers;
          submission.totalScore = totalScore;
        } catch (err) {
          console.error('Batch AI grading failed in aiGradeOpenAnswers:', err);
        }
      }

      submission.status = 'reviewed';
      await submission.save();
      return submission;
    },

    gradeAssignment: async (_: any, { submissionId, grade, feedback, questionScores }: any, context: any) => {
      if (!context.user || !['trainer', 'mentor', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const submission = await AssignmentSubmission.findById(submissionId);
      if (!submission) throw new Error('Submission not found');

      // Update per-question scores if provided
      if (questionScores && questionScores.length > 0 && submission.answers && submission.answers.length > 0) {
        for (const qs of questionScores) {
          const answer = submission.answers.find((a: any) => a.questionId === qs.questionId);
          if (answer) {
            (answer as any).score = qs.score;
          }
        }
        // Look up the lesson to get max points per question
        if (submission.courseId && submission.lessonId) {
          try {
            const Course_model = mongoose.model('Course');
            const course = await Course_model.findById(submission.courseId);
            if (course && course.modules) {
              let targetLesson: any = null;
              for (const mod of course.modules) {
                const found = mod.lessons.find((l: any) => l.id === submission.lessonId || l._id?.toString() === submission.lessonId);
                if (found) { targetLesson = found; break; }
              }
              if (targetLesson && targetLesson.assignmentQuestions) {
                const qPoints = new Map<string, number>();
                for (const q of targetLesson.assignmentQuestions) {
                  qPoints.set(q._id?.toString() || q.id, q.points || 10);
                }
                let totalPossible = 0;
                let earnedPoints = 0;
                for (const a of submission.answers) {
                  const maxPts = qPoints.get(a.questionId) || 10;
                  totalPossible += maxPts;
                  earnedPoints += Math.min((a as any).score || 0, maxPts);
                }
                if (totalPossible > 0) {
                  grade = Math.round((earnedPoints / totalPossible) * 100);
                }
              }
            }
          } catch (err) {
            console.error('Error recalculating grade from question scores:', err);
          }
        }
      }

      submission.grade = grade;
      submission.feedback = feedback;
      submission.status = 'reviewed';
      await submission.save();

      // Auto-complete the lesson for the student if grade is passing (e.g. > 70)
      if (grade >= 70) {
        const user = await User.findById(submission.userId);
        const isAlreadyCompleted = user?.completedLessons?.some((l: any) =>
          l.courseId.toString() === submission.courseId && l.lessonId === submission.lessonId
        );

        if (user && !isAlreadyCompleted) {
          user.completedLessons.push({ courseId: submission.courseId, lessonId: submission.lessonId });
          await user.save();

          const progress = await CourseProgress.findOne({ userId: submission.userId, courseId: submission.courseId });
          if (progress) {
            const lIdx = progress.lessons.findIndex((l: any) => l.lessonId === submission.lessonId);
            if (lIdx > -1) {
              progress.lessons[lIdx].completed = true;
            } else {
              progress.lessons.push({
                lessonId: submission.lessonId,
                completed: true,
                timeSpent: 0,
                lastAccessed: new Date(),
                visits: 1
              });
            }

            // Recalculate overall progress and check for certificate
            const course = await Course.findById(submission.courseId);
            if (course) {
              const allLessons = course.modules.flatMap((m: any) => m.lessons);
              const completedCount = progress.lessons.filter((l: any) => l.completed).length;
              progress.overallProgress = Math.round((completedCount / allLessons.length) * 100);

              if (progress.overallProgress === 100 && progress.status !== 'completed') {
                progress.status = 'completed';
                progress.completionDate = new Date();

                // Auto-generate Certificate
                const existingCert = await Certificate.findOne({ userId: submission.userId, courseId: submission.courseId });
                if (!existingCert) {
                  // Calculate average grade
                  const submissions = await AssignmentSubmission.find({ userId: submission.userId, courseId: submission.courseId });
                  const totalGrade = submissions.reduce((acc, s) => acc + (s.grade || 0), 0);
                  const avgGrade = submissions.length > 0 ? Math.round(totalGrade / submissions.length) : 100;

                  await new Certificate({
                    userId: submission.userId,
                    courseId: submission.courseId,
                    courseTitle: course.title,
                    issueDate: new Date(),
                    credentialId: `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    status: 'issued',
                    progress: 100,
                    grade: avgGrade,
                    signerName: course.signerName || 'Academic Director',
                    signerSignature: course.signerSignature,
                    recipientName: (user as any).certificateName || (user as any).fullName || user.username
                  }).save();

                  console.log(`🎓 Certificate issued to ${user.username} for ${course.title} with average grade ${avgGrade}`);
                }
              }
            }
            await progress.save();
          }
        }
      }

      // Notify student
      await sendNotification(submission.userId.toString(), {
        type: 'ASSIGNMENT_GRADED',
        title: 'Assignment Graded',
        message: `Your assignment for course ${submission.courseId} has been graded: ${grade}/100`,
        link: `/portal/student/courses/${submission.courseId}`
      });

      // Notify instructor if graded by someone else
      const course = submission.courseId ? await Course.findById(submission.courseId) : null;
      if (course && course.instructor && course.instructor.toString() !== context.user.id) {
        const instructor = await User.findById(course.instructor);
        const link = instructor?.role === 'admin' || instructor?.role === 'super_admin'
          ? '/portal/admin/assignment-reviews'
          : '/portal/trainer/projects';

        sendNotification(course.instructor.toString(), {
          type: 'ASSIGNMENT_GRADED_BY_OTHERS',
          title: 'Assignment Graded by Team',
          message: `Submission from ${submission.userId} for ${course.title} was graded by ${context.user.fullName || context.user.username}.`,
          link: link
        });
      }

      const populated = await submission.populate(['userId', 'courseId']);
      return {
        ...populated.toObject(),
        id: populated._id,
        user: populated.userId,
        userId: populated.userId?._id || populated.userId,
        course: populated.courseId,
        courseId: populated.courseId?._id || populated.courseId
      };
    },

    chatWithAI: async (_: any, { message }: { message: string }, context: any) => {
      return await chatWithAIService(message, context.user);
    },
    explainTask: async (_: any, { taskTitle, description }: { taskTitle: string, description: string }) => {
      return await explainTaskService(taskTitle, description);
    },
    reviewSubmission: async (_: any, { taskTitle, submissionContent }: { taskTitle: string, submissionContent: string }) => {
      return await reviewSubmissionService(taskTitle, submissionContent);
    },

    // Code Execution
    runCode: async (_: any, { code, language, testCode, exerciseType, setupCode, exerciseTitle, exerciseDescription, expectedOutput, exerciseId, courseId }: any) => {
      const result = await compileCode({
        code,
        language,
        testCode,
        exerciseType,
        setupCode,
        exerciseTitle,
        exerciseDescription,
        expectedOutput,
      });

      // Persist AI-generated tests to DB so they're reused (no token waste)
      if (result.generatedTestCode && exerciseId) {
        try {
          const updateQuery: any = {};
          updateQuery[`modules.$[].lessons.$[].codeExercises.$[ex].testCode`] = result.generatedTestCode;
          await Course.updateOne(
            { "modules.lessons.codeExercises._id": exerciseId },
            { $set: updateQuery },
            { arrayFilters: [{ "ex._id": exerciseId }] }
          );
          console.log(`💾 Saved AI-generated testCode to exercise ${exerciseId}`);
        } catch (dbErr: any) {
          console.warn('Failed to persist generated testCode to DB:', dbErr?.message);
        }
      }

      return result;
    },

    generateExerciseTests: async (_: any, { exerciseId, courseId, title, description, language, initialCode, setupCode, expectedOutput }: any) => {
      
      let testCode = await generateCodeTestsService(
        title,
        description || '',
        language,
        initialCode || '',
        expectedOutput
      );
      
      if (!testCode || !testCode.trim()) {
        throw new Error('AI test generation returned empty result');
      }
      
      // Strip markdown code fences
      testCode = testCode.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Save to DB if exerciseId is provided
      let saved = false;
      if (exerciseId) {
        try {
          const updateQuery: any = {};
          updateQuery[`modules.$[].lessons.$[].codeExercises.$[ex].testCode`] = testCode;
          await Course.updateOne(
            { "modules.lessons.codeExercises._id": exerciseId },
            { $set: updateQuery },
            { arrayFilters: [{ "ex._id": exerciseId }] }
          );
          saved = true;
        } catch (dbErr: any) {
          console.warn('Failed to save generated testCode to DB:', dbErr?.message);
        }
      }
      
      return { testCode, saved };
    },

    saveCodeExerciseAnswer: async (_: any, { courseId, lessonId, exerciseId, code }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      
      try {
        // Upsert assignment submission with code exercise answer
        const existing = await AssignmentSubmission.findOne({
          userId: context.user.id,
          courseId,
          lessonId,
        });
        
        const codeAnswers = existing?.content ? JSON.parse(existing.content) : {};
        codeAnswers[exerciseId] = { code, updatedAt: new Date().toISOString() };
        
        await AssignmentSubmission.findOneAndUpdate(
          { userId: context.user.id, courseId, lessonId },
          { 
            userId: context.user.id,
            courseId,
            lessonId,
            content: JSON.stringify(codeAnswers),
            status: 'completed',
          },
          { upsert: true, new: true }
        );
        
        return true;
      } catch (err: any) {
        console.error('Failed to save code exercise answer:', err?.message);
        return false;
      }
    },

    enroll: async (_: any, { courseId, selectedDeliveryMode, discountCode }: { courseId: string, selectedDeliveryMode?: string, discountCode?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const targetId = typeof courseId === 'object' ? ((courseId as any).id || (courseId as any)._id) : courseId;
      if (!targetId || targetId === "") throw new Error("Invalid Course ID");

      // Try regular Course first
      let course = await Course.findById(targetId);
      let isAICourse = false;

      // If not found, try AICourse
      if (!course) {
        course = await AICourse.findById(targetId) as any;
        isAICourse = true;
      }

      if (!course) throw new Error(`Course not found for ID: ${targetId}`);

      // Check Enrollment Limits (only for regular courses for now, or add to AICourse model if needed)
      if ((course as any).maxStudents && (course as any).studentsEnrolled.length >= (course as any).maxStudents) {
        throw new Error('Course is full.');
      }

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      const isEnrolledInUser = (user as any).enrolledCourses.some((c: any) => c.toString() === targetId);

      // --- Discount Code Validation ---
      let finalPrice = (course as any).price || 0;
      let appliedDiscountCode: string | null = null;

      if (discountCode && !isEnrolledInUser) {
        const dc = await DiscountCode.findOne({
          code: discountCode.toUpperCase(),
          $or: [
            { courseId: targetId },
            { courseId: { $exists: false } },
            { courseId: null },
          ],
          isActive: true,
        });

        if (dc) {
          // Check expiry
          const isExpired = dc.expiresAt && new Date(dc.expiresAt) < new Date();
          // Check usage limit
          const isExhausted = dc.currentUses >= dc.maxUses;

          if (!isExpired && !isExhausted) {
            const coursePrice = (course as any).price || 0;
            if (dc.discountType === 'percentage') {
              finalPrice = Math.max(0, coursePrice - (coursePrice * dc.discountValue / 100));
            } else if (dc.discountType === 'fixed') {
              finalPrice = Math.max(0, coursePrice - dc.discountValue);
            }
            appliedDiscountCode = dc.code;

            // Increment usage counter
            await DiscountCode.findByIdAndUpdate(dc._id, { $inc: { currentUses: 1 } });
          }
        }
      }

      // Atomic updates to prevent race conditions and handle concurrent requests
      const [updatedUser] = await Promise.all([
        User.findByIdAndUpdate(
          user.id,
          { $addToSet: { enrolledCourses: targetId } },
          { new: true }
        ).populate('enrolledCourses'),
        Course.findByIdAndUpdate(
          targetId,
          { $addToSet: { studentsEnrolled: user.id } }
        ),
        // Record payment (0 finalPrice with a discount code = free enrollment)
        !isEnrolledInUser && (finalPrice > 0 || appliedDiscountCode) ? new Payment({
          userId: user.id,
          courseId: course.id,
          amount: finalPrice,
          currency: 'RWF',
          status: 'completed',
          paymentMethod: appliedDiscountCode ? `Discount:${appliedDiscountCode}` : 'Pre-enrolled',
          transactionId: `TXN-ENR-${Math.random().toString(36).substring(7).toUpperCase()}`,
          type: 'Course Enrollment',
          itemTitle: course.title,
        }).save() : Promise.resolve(null)
      ]);

      // Initialize Course Progress (Idempotent)
      await CourseProgress.findOneAndUpdate(
        { userId: user.id, courseId: course.id },
        {
          $setOnInsert: {
            userId: user.id,
            courseId: course.id,
            totalTimeSpent: 0,
            overallProgress: 0,
            status: 'active',
            lessons: [],
            selectedDeliveryMode
          }
        },
        { upsert: true, new: true }
      );

      return await course.populate('instructor studentsEnrolled');
    },

    enrollStudentInCourse: async (_: any, { courseId, userId }: { courseId: string; userId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      if (!courseId || courseId === "") throw new Error("Course ID is required");
      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');

      // Permission Check: Admin, Super Admin, or Course Instructor
      const isAdmin = context.user.role === 'admin' || context.user.role === 'super_admin';
      const isInstructor = course.instructor?.toString() === context.user.id;

      if (!isAdmin && !isInstructor) {
        throw new Error('Not authorized to enroll students in this course');
      }

      const student = await User.findById(userId);
      if (!student) throw new Error('Student not found');

      // Enroll student in Course
      if (!course.studentsEnrolled.some((s: any) => s.toString() === student.id)) {
            course.studentsEnrolled.push(student.id as any);
            course.studentsEnrolledCount = course.studentsEnrolled.length;
            await course.save();
      }

      // Add course to student's enrolledCourses
      if (!student.enrolledCourses.some((c: any) => c.toString() === courseId)) {
        student.enrolledCourses.push(courseId as any);
        await student.save();

        // Optional: Record payment if needed, but for trainer enrollment we mark as 'Admin Enrolled'
        await new Payment({
          userId: student.id,
          courseId: course.id,
          amount: course.price || 0,
          currency: 'RWF',
          status: 'completed',
          paymentMethod: 'Admin/Trainer Enrolled',
          transactionId: `TXN-ADM-${Math.random().toString(36).substring(7).toUpperCase()}`,
          type: 'Course Enrollment',
          itemTitle: course.title
        }).save();
      }

      // Initialize Course Progress (Idempotent)
      await CourseProgress.findOneAndUpdate(
        { userId: student.id, courseId: course.id },
        {
          $setOnInsert: {
            userId: student.id,
            courseId: course.id,
            totalTimeSpent: 0,
            overallProgress: 0,
            status: 'active',
            lessons: []
          }
        },
        { upsert: true, new: true }
      );

      return await course.populate('instructor studentsEnrolled');
    },

    createCourse: async (_: any, { instructorId, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (context.user.role !== 'trainer' && context.user.role !== 'super_admin' && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      // Phone validation: if publishing, instructor must have a valid phone number for commission payouts
      if ((args.status || 'published') === 'published') {
        const instructorIdToCheck = instructorId || context.user.id;
        const instructor = await User.findById(instructorIdToCheck).select('phone').lean();
        if (!instructor || !instructor.phone || instructor.phone.trim() === '') {
          throw new Error('Cannot publish course: Instructor must have a valid phone number registered for commission payouts. Please set a phone number in your profile first.');
        }
      }

      const course = new Course({
        ...args,
        instructor: instructorId || context.user.id,
        createdBy: context.user.id,
        school: args.school || context.user.school
      });
      await course.save();

      // 🤖 Auto-generate AI tests for ALL coding exercises (always, not just on publish)
      try {
        const generatedCount = await Promise.race([
          preGenerateExerciseTests(course),
          new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Test generation timed out')), 15000))
        ]);
        if (generatedCount > 0) {
          console.log(`✅ AI-generated ${generatedCount} test(s) for "${course.title}"`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Could not auto-generate tests for "${course.title}": ${err?.message}`);
        // Don't block the mutation — course is saved regardless
      }

      return await course.populate('instructor');
    },

    updateCourse: async (_: any, { id, instructorId, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      if (!id || id === "") throw new Error("Course ID is required");
      const course = await Course.findById(id);
      if (!course) throw new Error('Course not found');

      const courseInstructorId = course.instructor ? course.instructor.toString() : null;
      const isOwnerInstructor = courseInstructorId === context.user.id;
      const canUpdateCourse = isOwnerInstructor || context.user.role === 'super_admin' || context.user.role === 'admin';
      if (!canUpdateCourse) {
        throw new Error('Not authorized to update this course');
      }

      const updateData: any = { ...args };
      if (instructorId) {
        if (context.user.role === 'admin' || context.user.role === 'super_admin') {
          updateData.instructor = instructorId;
        } else if (isOwnerInstructor) {
          if (instructorId && instructorId !== context.user.id) {
            throw new Error('Trainers cannot reassign courses to other instructors');
          }
          updateData.instructor = context.user.id;
        }
      }

      // Phone validation: if publishing, instructor must have a valid phone number for commission payouts
      if (args.status === 'published') {
        const instructorIdToCheck = updateData.instructor || course.instructor.toString();
        const instructor = await User.findById(instructorIdToCheck).select('phone').lean();
        if (!instructor || !instructor.phone || instructor.phone.trim() === '') {
          throw new Error('Cannot publish course: Instructor must have a valid phone number registered for commission payouts. Please set a phone number in your profile first.');
        }
      }

      // Restrict financial and identity updates to admins/super_admins only
      if (updateData.modules) {
        updateData.modules = updateData.modules.map((m: any) => {
          const mod = { ...m };
          if (mod.id) {
            mod._id = mod.id;
            delete mod.id;
          }
          if (mod.lessons) {
            mod.lessons = mod.lessons.map((l: any) => {
              const les = { ...l };
              if (les.id) {
                les._id = les.id;
                delete les.id;
              }
              if (les.resources) {
                les.resources = les.resources.map((r: any) => {
                  const res = { ...r };
                  if (res.id) {
                    res._id = res.id;
                    delete res.id;
                  }
                  return res;
                });
              }
              if (les.assignmentQuestions) {
                les.assignmentQuestions = les.assignmentQuestions.map((q: any) => {
                  const quest = { ...q };
                  if (quest.id && quest.id.length === 24) {
                    quest._id = quest.id;
                    delete quest.id;
                  } else {
                    delete quest.id; // Let MongoDB generate a new ID for temporary IDs
                  }
                  return quest;
                });
              }
              if (les.quizQuestions) {
                console.log(`[Resolver] Processing ${les.quizQuestions.length} quiz questions for lesson ${les.title || les._id}`);
                les.quizQuestions = les.quizQuestions.map((q: any) => {
                  const quest = { ...q };
                  if (quest.id && quest.id.length === 24) {
                    quest._id = quest.id;
                    delete quest.id;
                  } else {
                    console.log(`[Resolver] Question has no valid ID, let MongoDB generate one: ${quest.id}`);
                    delete quest.id; // Let MongoDB generate a new ID for temporary IDs
                  }
                  return quest;
                });
              }
              return les;
            });
          }
          return mod;
        });
      }

      // Restrict financial and identity updates to admins/super_admins only
      if (context.user.role !== 'super_admin' && context.user.role !== 'admin') {
        const restrictedFields = [
          'price', 'discountPrice', 'title', 'description',
          'thumbnail', 'level', 'category', 'instructor'
        ];
        restrictedFields.forEach(field => {
          delete updateData[field];
        });
      }

      console.log(`[UpdateCourse] SANITIZING AND SAVING VIA NUCLEAR UPDATE for course ${id}`);

      if (updateData.modules) {
        updateData.modules = updateData.modules.map((mod: any) => {
          return {
            ...mod,
            lessons: (mod.lessons || []).map((l: any) => {
              const les = { ...l };

              // Map Quiz Questions with forced isolation
              if (les.quizQuestions && Array.isArray(les.quizQuestions)) {
                // Force a deep copy to break any shared references
                const cleanQuestions = JSON.parse(JSON.stringify(les.quizQuestions));
                les.quizQuestions = cleanQuestions.map((q: any) => {
                  if (q.id && typeof q.id === 'string' && q.id.length !== 24) {
                    delete q.id;
                  }
                  return {
                    id: q.id || q._id,
                    questionText: q.questionText,
                    type: q.type,
                    options: q.options || [],
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    imageUrl: q.imageUrl
                  };
                });
                if (les.quizQuestions.length > 0) {
                  console.log(`[UpdateCourse] ISO-CHECK: Lesson "${les.title}" isolated with ${les.quizQuestions.length} questions.`);
                }
              }

              // Map Assignment Questions with forced isolation
              if (les.assignmentQuestions && Array.isArray(les.assignmentQuestions)) {
                const cleanQuestions = JSON.parse(JSON.stringify(les.assignmentQuestions));
                les.assignmentQuestions = cleanQuestions.map((q: any) => {
                  if (q.id && typeof q.id === 'string' && q.id.length !== 24) {
                    delete q.id;
                  }
                  return {
                    id: q.id || q._id,
                    questionText: q.questionText,
                    type: q.type,
                    options: q.options || [],
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    points: q.points
                  };
                });
              }

              return les;
            })
          };
        });
      }

      const modulesToSave = updateData.modules;
      delete updateData.modules;

      // ─── QUIZ PRESERVATION GUARD ────────────────────────────────────────────
      // Before saving, fetch the existing course from DB and merge quiz/assignment
      // questions. If the incoming lesson has 0 questions but the existing lesson
      // already has questions (matched by _id), we preserve the existing ones.
      // This prevents data loss when the Edit dialog opens before full course data loads.
      if (modulesToSave) {
        const existingCourse = await Course.findById(id).lean() as any;
        if (existingCourse?.modules) {
          // Build a flat lookup map: lessonId -> existing lesson data
          const existingLessonMap = new Map<string, any>();
          existingCourse.modules.forEach((m: any) => {
            (m.lessons || []).forEach((l: any) => {
              const lid = (l._id || l.id)?.toString();
              if (lid) existingLessonMap.set(lid, l);
            });
          });

          modulesToSave.forEach((m: any) => {
            (m.lessons || []).forEach((l: any) => {
              const lid = (l._id || l.id)?.toString();
              const existing = lid ? existingLessonMap.get(lid) : null;

              // Preserve quizQuestions if incoming is empty but DB has them
              if (
                existing &&
                (!l.quizQuestions || l.quizQuestions.length === 0) &&
                existing.quizQuestions?.length > 0
              ) {
                console.log(`[UpdateCourse] PRESERVING ${existing.quizQuestions.length} quiz questions for lesson "${l.title || lid}"`);
                l.quizQuestions = existing.quizQuestions;
              }

              // Preserve assignmentQuestions if incoming is empty but DB has them
              if (
                existing &&
                (!l.assignmentQuestions || l.assignmentQuestions.length === 0) &&
                existing.assignmentQuestions?.length > 0
              ) {
                console.log(`[UpdateCourse] PRESERVING ${existing.assignmentQuestions.length} assignment questions for lesson "${l.title || lid}"`);
                l.assignmentQuestions = existing.assignmentQuestions;
              }

              // Preserve codeExercises if incoming is empty but DB has them
              if (
                existing &&
                (!l.codeExercises || l.codeExercises.length === 0) &&
                existing.codeExercises?.length > 0
              ) {
                console.log(`[UpdateCourse] PRESERVING ${existing.codeExercises.length} code exercises for lesson "${l.title || lid}"`);
                l.codeExercises = existing.codeExercises;
              }
            });
          });
        }
      }
      // ─── END QUIZ PRESERVATION GUARD ────────────────────────────────────────

      const updatedCourse = await Course.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            ...updateData,
            ...(modulesToSave ? { modules: modulesToSave } : {})
          }
        },
        { new: true, runValidators: true }
      ).populate('instructor studentsEnrolled');

      if (!updatedCourse) throw new Error('Course not found');

      console.log(`[UpdateCourse] NUCLEAR UPDATE SUCCESSFUL for ${id}.`);

      // Final verification of what's in the document we just got back
      let totalQs = 0;
      updatedCourse.modules?.forEach((m: any) => {
        m.lessons?.forEach((l: any) => {
          totalQs += (l.quizQuestions?.length || 0);
        });
      });
      console.log(`[UpdateCourse] POST-SAVE VERIFICATION: Total Quiz Questions in DB: ${totalQs}`);

      // 🤖 Auto-generate AI tests for ALL coding exercises (always, not just on publish)
      try {
        const generatedCount = await Promise.race([
          preGenerateExerciseTests(updatedCourse),
          new Promise<number>((_, reject) => setTimeout(() => reject(new Error('Test generation timed out')), 15000))
        ]);
        if (generatedCount > 0) {
          console.log(`✅ AI-generated ${generatedCount} test(s) for "${updatedCourse.title}"`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Could not auto-generate tests for "${updatedCourse.title}": ${err?.message}`);
        // Don't block the mutation — course is saved regardless
      }

      return updatedCourse;
    },

    deleteCourse: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      if (!id || id === "") throw new Error("Course ID is required");
      const course = await Course.findById(id);
      if (!course) throw new Error('Course not found');

      if (course.instructor.toString() !== context.user.id && context.user.role !== 'super_admin' && context.user.role !== 'admin') {
        throw new Error('Not authorized to delete this course');
      }

      // Soft delete
      (course as any).isDeleted = true;
      (course as any).status = 'archived';
      await course.save();
      return true;
    },

    approveLessonProgress: async (_: any, { userId, courseId, lessonId }: any, context: any) => {
      if (!context.user || !['trainer', 'mentor', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const targetCourseId = typeof courseId === 'object' ? ((courseId as any).id || (courseId as any)._id) : courseId;
      const targetLessonId = typeof lessonId === 'object' ? ((lessonId as any).id || (lessonId as any)._id) : lessonId;

      // Add to completedLessons if not already there
      const isAlreadyCompleted = user.completedLessons?.some((l: any) =>
        l.courseId.toString() === targetCourseId.toString() && l.lessonId === targetLessonId.toString()
      );

      if (!isAlreadyCompleted) {
        user.completedLessons.push({ courseId: targetCourseId, lessonId: targetLessonId });
        await user.save();

        // Update CourseProgress
        const progress = await CourseProgress.findOne({ userId, courseId: targetCourseId });
        if (progress) {
          const lIdx = progress.lessons.findIndex((l: any) => l.lessonId === targetLessonId.toString());
          if (lIdx > -1) {
            progress.lessons[lIdx].completed = true;
          } else {
            progress.lessons.push({
              lessonId: targetLessonId.toString(),
              completed: true,
              timeSpent: 0,
              lastAccessed: new Date(),
              visits: 1
            });
          }
          await progress.save();
        }
      }

      return true;
    },

    updateLessonProgress: async (_: any, { courseId, lessonId, timeSpent, completed }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      let progress = await CourseProgress.findOne({ userId: context.user.id, courseId });
      if (!progress) {
        progress = new CourseProgress({ userId: context.user.id, courseId, lessons: [] });
      }

      const lessonIndex = progress.lessons.findIndex((l: any) => l.lessonId === lessonId);
      if (lessonIndex > -1) {
        progress.lessons[lessonIndex].timeSpent += timeSpent;
        if (completed) progress.lessons[lessonIndex].completed = true;
        progress.lessons[lessonIndex].lastAccessed = new Date();
        progress.lessons[lessonIndex].visits = (progress.lessons[lessonIndex].visits || 0) + 1;
      } else {
        progress.lessons.push({
          lessonId,
          completed: completed || false,
          timeSpent: timeSpent,
          lastAccessed: new Date(),
          visits: 1
        });
      }

      progress.lastAccessed = new Date();
      progress.totalTimeSpent = progress.lessons.reduce((acc: number, l: any) => acc + l.timeSpent, 0);

      await progress.save();
      return true;
    },

    completeLesson: async (_: any, { courseId, lessonId }: { courseId: string, lessonId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const targetCourseId = typeof courseId === 'object' ? ((courseId as any).id || (courseId as any)._id) : courseId;
      const targetLessonId = typeof lessonId === 'object' ? ((lessonId as any).id || (lessonId as any)._id) : lessonId;

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      // Check if lesson is an assignment and requires approval
      if (!targetCourseId || targetCourseId === "") return null;
      const course = await Course.findById(targetCourseId);
      if (course) {
        const allLessons = course.modules.flatMap((m: any) => m.lessons);
        const lesson = allLessons.find((l: any) => (l.id || l._id).toString() === targetLessonId);

        const isGlobalAssignmentRequired = course.submissionRequired !== false && (lesson && lesson.type !== 'quiz' && (lesson.type === 'assignment' || lesson.isAssignment));
        const isLessonExplicitlyRequired = lesson && !!lesson.requiredAssignment && lesson.type !== 'quiz';

        if (isGlobalAssignmentRequired || isLessonExplicitlyRequired) {
          const submission = await AssignmentSubmission.findOne({
            userId: context.user.id,
            courseId: targetCourseId,
            lessonId: targetLessonId
          });

          const isAccepted = submission && (submission.status === 'approved' || submission.status === 'reviewed' || submission.status === 'failed');

          if (!submission || !isAccepted) {
            throw new Error('You must submit the assignment and achieve a passing grade before completing this unit.');
          }

          if (submission.grade !== undefined && submission.grade < 70) {
            throw new Error(`Your assignment grade (${submission.grade}/100) is below the 70% passing threshold. Please contact your trainer.`);
          }
        }

        // Prerequisite Gating: Check if any PREVIOUS required units (assignments/quizzes) are approved
        const currentLessonIndex = allLessons.findIndex((l: any) => (l.id || l._id).toString() === targetLessonId);
        if (currentLessonIndex > 0) {
          const previousRequiredLessons = allLessons.slice(0, currentLessonIndex).filter((l: any) =>
            (l.requiredAssignment || l.type === 'assignment') && l.type !== 'quiz'
          );

          for (const prevLesson of previousRequiredLessons) {
            const isPrevCompleted = user.completedLessons?.some((cl: any) =>
              cl.courseId.toString() === targetCourseId.toString() &&
              cl.lessonId === (prevLesson.id || prevLesson._id).toString()
            );

            if (!isPrevCompleted) {
              throw new Error(`Prerequisite Block: You must complete and get approval for "${prevLesson.title}" before starting this unit.`);
            }
          }
        }
      }

      // Check if already completed
      const isAlreadyCompleted = user.completedLessons?.some((l: any) =>
        l.courseId.toString() === targetCourseId && l.lessonId === targetLessonId
      );

      if (!isAlreadyCompleted) {
        user.completedLessons.push({ courseId: targetCourseId as any, lessonId: targetLessonId });

        // Check if course is fully complete
        if (!targetCourseId || targetCourseId === "") return null;
        const course = await Course.findById(targetCourseId);
        if (course) {
          const allLessonIds = course.modules.flatMap((m: any) => m.lessons).map((l: any) => (l.id || l._id).toString());
          const userCompletedForThisCourse = user.completedLessons
            .filter((cl: any) => cl.courseId.toString() === targetCourseId.toString())
            .map((cl: any) => cl.lessonId);

          const isFullCourseComplete = allLessonIds.every(id => userCompletedForThisCourse.includes(id));

          if (isFullCourseComplete && !user.completedCourses.some(id => id.toString() === targetCourseId.toString())) {
            (user as any).completedCourses.push(targetCourseId as any);
            console.log(`🎉 Course ${targetCourseId} marked as completed for user ${user.id}`);
          }
        }

        await user.save();
      }

      // Also update detailed progress
      let progress = await CourseProgress.findOne({ userId: context.user.id, courseId: targetCourseId });
      if (progress) {
        const lIdx = progress.lessons.findIndex((l: any) => l.lessonId === targetLessonId);
        if (lIdx > -1) {
          progress.lessons[lIdx].completed = true;
        } else {
          progress.lessons.push({
            lessonId: targetLessonId,
            completed: true,
            timeSpent: 0,
            lastAccessed: new Date(),
            visits: 1
          });
        }
      } else {
        // Create progress if not exists
        progress = new CourseProgress({
          userId: context.user.id,
          courseId: targetCourseId,
          lessons: [{
            lessonId: targetLessonId,
            completed: true,
            timeSpent: 0,
            lastAccessed: new Date(),
            visits: 1
          }]
        });
      }

      // Calculate overall progress
      if (course) {
        const allLessons = course.modules.flatMap((m: any) => m.lessons);
        const completedCount = progress.lessons.filter((l: any) => l.completed).length;
        progress.overallProgress = Math.round((completedCount / allLessons.length) * 100);

        if (progress.overallProgress === 100 && progress.status !== 'completed') {
          progress.status = 'completed';
          progress.completionDate = new Date();

          // Auto-generate Certificate
          const existingCert = await Certificate.findOne({ userId: context.user.id, courseId: targetCourseId });
          if (!existingCert) {
            await new Certificate({
              userId: context.user.id,
              courseId: targetCourseId,
              courseTitle: course.title,
              issueDate: new Date(),
              credentialId: `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              status: 'issued',
              progress: 100,
              signerName: course.signerName || 'Academic Director',
              signerSignature: course.signerSignature,
              recipientName: (user as any).certificateName || (user as any).fullName || user.username
            }).save();
          }
        }
      }

      await progress.save();

      return await user.populate('enrolledCourses');
    },

    rewardStudent: async (_: any, { xp, streak, courseId, lessonId, score }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      user.xp = (user.xp || 0) + xp;
      if (streak !== undefined) (user as any).streak = streak;

      // Level Up Logic: Every 100 XP is a level
      const newLevel = Math.floor(user.xp / 100) + 1;
      if (newLevel > (user.level || 1)) {
        user.level = newLevel;
      }

      // If score is provided, add it to grades
      if (score !== undefined && courseId && lessonId) {
        (user as any).grades.push({
          courseId,
          lessonId,
          score,
          feedback: "Quiz challenge completed",
          gradedBy: null, // "AI" is handled in the Grade resolver
          gradedAt: new Date()
        });
      }

      await user.save();
      return user;
    },

    generateAIQuiz: async (_: any, { courseId, lessonId, courseTitle, lessonTitle, lessonContent, questionCount, prompt }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      let finalCourseTitle = courseTitle;
      let finalLessonTitle = lessonTitle;
      let finalLessonContent = lessonContent;

      if (courseId && courseId !== "") {
        const course = await Course.findById(courseId);
        if (!course) throw new Error('Course not found');
        finalCourseTitle = course.title;

        if (lessonId) {
          const allLessons = course.modules.flatMap((m: any) => m.lessons);
          const lesson = allLessons.find((l: any) => (l.id || l._id).toString() === lessonId);
          if (lesson) {
            finalLessonTitle = lesson.title;
            finalLessonContent = lesson.content || '';
          }
        }
      }

      if (!finalCourseTitle) throw new Error("Course title or ID is required for AI generation");

      const questions = await generateAIQuizService(
        finalCourseTitle,
        finalLessonTitle || "General Lesson",
        finalLessonContent || '',
        questionCount || 3,
        prompt || ""
      );

      // Return these questions with temporary IDs so the frontend can preview and edit them before saving
      const draftQuestions = questions.map((q: any) => ({
        ...q,
        id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        courseId: courseId || "new",
        lessonId: lessonId || "new"
      }));

      return draftQuestions;
    },

    hintForQuestion: async (_: any, { questionText, options }: { questionText: string, options: string[] }) => {
      return await hintForQuestionService(questionText, options);
    },
    generateQuestionExplanation: async (_: any, { questionText, options, correctOptionIndex }: { questionText: string, options: string[], correctOptionIndex: number }) => {
      return await generateQuestionExplanationService(questionText, options, correctOptionIndex);
    },

    createUser: async (_: any, { password, ...args }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) {
        throw new Error('Not authorized');
      }

      if (context.user.role === 'admin' && (args.role === 'admin' || args.role === 'super_admin')) {
        throw new Error('Admins cannot create admin or super_admin users');
      }

      const existingUser = await User.findOne({ email: args.email });
      if (existingUser) throw new Error('User already exists');

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        ...args,
        password: hashedPassword,
        role: args.role || 'student',
        permissions: args.permissions || [],
        createdBy: context.user.id
      });
      await user.save();

      // Generate password reset token so user can set their own password
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      (user as any).resetPasswordToken = hashedToken;
      (user as any).resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Trigger Emails — include reset token so user can set their own password
      try {
        await sendWelcomeEmail(user.email, user.username, user.role, resetToken);
        if (context.user && context.user.email) {
          await sendAdminNewUserNotification(context.user.email, user.username, user.email, user.role);
        }
      } catch (err) {
        console.error('[CreateUser] Email error:', err);
      }

      return user;
    },

    markTourCompleted: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');
      user.isFirst = false;
      await user.save();
      console.log(`[Tour] Marked tour completed for ${user.username}`);
      return user;
    },

    updateUser: async (_: any, { id, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Check if user is updating themselves OR is an admin
      const isSelf = context.user.id === id;
      const isAdmin = context.user.role === 'super_admin' || context.user.role === 'admin';

      if (!isSelf && !isAdmin) {
        throw new Error('Not authorized');
      }

      const user = await User.findById(id);
      if (!user) throw new Error('User not found');

      if (context.user.role === 'admin') {
        if (user.role === 'super_admin') throw new Error('Admins cannot modify super admin users');
        if (args.role === 'super_admin' || args.role === 'admin') {
          throw new Error('Admins cannot assign admin or super_admin roles');
        }
      }

      // Prevent non-admins from changing roles or sensitive fields
      if (!isAdmin) {
        delete args.role;
        delete args.permissions;
        delete args.isDeleted;
        delete args.status; // status changes usually require admin/system action
      }

      if (args.isFirst !== undefined) {
        console.log(`[UserUpdate] Manually setting isFirst for ${user.username} to ${args.isFirst}`);
      }
      // If password is provided, hash it before saving
      if (args.password) {
        args.password = await bcrypt.hash(args.password, 12);
      }

      Object.assign(user, args);
      await user.save();
      console.log(`[UserUpdate] Post-save isFirst for ${user.username}: ${user.isFirst}`);
      return user;
    },

    deleteUser: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Only super admins can delete users');
      }

      const user = await User.findById(id);
      if (!user) throw new Error('User not found');
      if (user.role === 'super_admin') throw new Error('Cannot delete super admin');
      if (context.user.role === 'admin' && user.role === 'admin') throw new Error('Admins cannot delete other admins');

      // Soft Delete
      (user as any).isDeleted = true;
      (user as any).status = 'deactivated';
      await user.save();
      return true;
    },
    sendMessage: async (_: any, { receiverId, content }: { receiverId: string, content: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const senderId = context.user.id;

      // Check if conversation exists
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId]
        });
      }

      const message = new Message({
        conversationId: conversation.id,
        sender: senderId,
        content
      });

      await message.save();

      // Update conversation last message
      conversation.lastMessage = message._id as any;
      await conversation.save();

      // Populate sender for return
      await message.populate('sender');

      // Emit to receiver's room via Pusher (minimal payload)
      const minimalMessage = {
        id: message._id,
        conversationId: message.conversationId,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: (message.sender as any)._id,
          username: (message.sender as any).username,
        }
      };

      try {
        await pusher.trigger(`user-${receiverId}`, 'receive_message', minimalMessage);
        await pusher.trigger(`user-${senderId}`, 'receive_message', minimalMessage);
      } catch (e) {
        console.error('Pusher message error:', e);
      }

      // Publish to GraphQL Subscriptions
      pubsub.publish('MESSAGE_ADDED', { messageAdded: message });

      return message;
    },
    // ─── Discount Code Mutations ─────────────────────────────────────────
    createDiscountCode: async (_: any, args: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      
      const existing = await DiscountCode.findOne({ code: args.code.toUpperCase(), courseId: args.courseId });
      if (existing) {
        throw new Error('A discount code with this name already exists for this course');
      }
      
      const saved = await new DiscountCode({
        code: args.code.toUpperCase(),
        courseId: args.courseId,
        discountType: args.discountType,
        discountValue: args.discountValue,
        maxUses: args.maxUses || 1,
        expiresAt: args.expiresAt || null,
        description: args.description || '',
        createdBy: context.user.id,
      }).save();
      
      const created = await DiscountCode.findById(saved._id).populate('courseId').populate('createdBy');
      if (!created) return null;
      const createdObj: any = created.toObject ? created.toObject({ virtuals: true }) : { ...created, id: (created as any)._id?.toString() };
      if (createdObj.courseId && typeof createdObj.courseId === 'object') {
        createdObj.courseId = createdObj.courseId._id ? createdObj.courseId._id.toString() : createdObj.courseId.toString();
      }
      return createdObj;
    },
    
    updateDiscountCode: async (_: any, args: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      
      const update: any = {};
      if (args.code !== undefined) update.code = args.code.toUpperCase();
      if (args.discountType !== undefined) update.discountType = args.discountType;
      if (args.discountValue !== undefined) update.discountValue = args.discountValue;
      if (args.maxUses !== undefined) update.maxUses = args.maxUses;
      if (args.isActive !== undefined) update.isActive = args.isActive;
      if (args.expiresAt !== undefined) update.expiresAt = args.expiresAt;
      if (args.description !== undefined) update.description = args.description;
      
      const code = await DiscountCode.findByIdAndUpdate(args.id, { $set: update }, { new: true })
        .populate('courseId')
        .populate('createdBy');
      if (!code) throw new Error('Discount code not found');
      const updatedCodeObj: any = code.toObject ? code.toObject({ virtuals: true }) : { ...code, id: (code as any)._id?.toString() };
      if (updatedCodeObj.courseId && typeof updatedCodeObj.courseId === 'object') {
        updatedCodeObj.courseId = updatedCodeObj.courseId._id ? updatedCodeObj.courseId._id.toString() : updatedCodeObj.courseId.toString();
      }
      return updatedCodeObj;
    },
    
    deleteDiscountCode: async (_: any, { id }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      await DiscountCode.findByIdAndDelete(id);
      return true;
    },

    subscribeToNewsletter: async (_: any, { email }: { email: string }) => {
      try {
        const existing = await NewsletterSubscription.findOne({ email });
        if (existing) return true;

        await NewsletterSubscription.create({ email });
        return true;
      } catch (error) {
        console.error('Newsletter subscription error:', error);
        return false;
      }
    },
    register: async (_: any, { username, email, password, fullName, role }: any) => {
      console.log(`[Register] Attempt for email: ${email}`);
      // Check if user exists (case-insensitive)
      const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        username,
        email,
        password: hashedPassword,
        fullName: fullName || username,
        role: role || 'student',
      });
      await user.save();

      // Log Registration Activity
      const now = new Date().toISOString();
      (user as any).activityLog.push({
        action: 'REGISTER',
        details: 'User created a new account',
        timestamp: now
      });
      await user.save();

      // Trigger Welcome Email
      try {
        await sendWelcomeEmail(user.email, user.username, user.role);
      } catch (err) {
        console.error('[Register] Welcome email error:', err);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: (user as any).role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      return { token, user };
    },
    login: async (_: any, { email, password }: any, context: any) => {
      console.log(`[Login] Attempt for email: ${email}`);
      // Case-insensitive lookup
      const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Check Account Status
      if ((user as any).status === 'suspended') {
        throw new GraphQLError('Account is suspended. Contact support.', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      if ((user as any).status === 'deactivated') {
        throw new GraphQLError('Account is deactivated.', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      if ((user as any).isDeleted) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        throw new GraphQLError('Wrong credentials', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Check for 2FA requirement
      const admin2FAConfig = await Config.findOne({ key: 'admin2FA' });
      const globalAdmin2FA = admin2FAConfig ? (admin2FAConfig.value === true || admin2FAConfig.value === 'true') : false;
      const isAdmin = user.role === 'admin' || user.role === 'super_admin';

      if (user.twoFactorEnabled) {
        return { user, requires2FA: true };
      }

      if (globalAdmin2FA && isAdmin) {
        return { user, requires2FASetup: true };
      }

      // Update Presence & Status
      (user as any).isOnline = true;
      (user as any).lastActive = new Date();
      (user as any).status = 'active'; // Ensure active on login

      // ── IP Geolocation (no browser permission needed) ──
      try {
        const ipLocation = await lookupRequestGeoLocation(context?.req);
        if (ipLocation.latitude != null && ipLocation.longitude != null) {
          const ip =
            context?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            context?.req?.ip || '';

          // Check for suspicious login BEFORE overwriting old coordinates
          await checkSuspiciousLogin(
            user,
            ipLocation.latitude,
            ipLocation.longitude,
            ip,
            'email',
            ipLocation.city,
            ipLocation.country,
            sendSuspiciousLoginAlert
          );

          // Only overwrite if not locationShared
          if (!(user as any).locationShared) {
            (user as any).latitude = ipLocation.latitude;
            (user as any).longitude = ipLocation.longitude;
            (user as any).locationUpdatedAt = new Date();
            (user as any).locationShared = false; // IP-based, not user-confirmed
          }
        }
      } catch (err) {
        console.debug('[Login] IP Geolocation error (non-blocking):', err);
      }

      await user.save();
      console.log(`[Login] Saved isFirst for ${user.username}: ${user.isFirst}`);

      // Log Login Activity
      const now = new Date().toISOString();
      (user as any).activityLog.push({
        action: 'LOGIN',
        details: 'User logged in via email',
        timestamp: now
      });
      await user.save();

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username, role: (user as any).role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      return { token, user };
    },
    googleLogin: async (_: any, { token }: { token: string }, context?: any) => {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const decodedToken = ticket.getPayload();

        if (!decodedToken || !decodedToken.email) {
          throw new Error('Invalid Google token');
        }

        const { email, name, picture } = decodedToken as any;
        let dbUser = await User.findOne({ email });

        if (!dbUser) {
          // Create new student user
          dbUser = new User({
            username: email.split('@')[0] + Math.floor(Math.random() * 1000),
            email,
            password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
            role: 'student',
            fullName: name || email.split('@')[0],
            avatar: picture
          });
          await dbUser.save();

          // Trigger Welcome Email for new Google user
          try {
            await sendWelcomeEmail(dbUser.email, dbUser.username, dbUser.role);
          } catch (err) {
            console.error('[GoogleLogin] Welcome email error:', err);
          }

          // Trigger Welcome Email for new Google user
          try {
            await sendWelcomeEmail(dbUser.email, dbUser.username, dbUser.role);
          } catch (err) {
            console.error('[GoogleLogin] Welcome email error:', err);
          }
        }

        // Check Account Status
        if ((dbUser as any).status === 'suspended') throw new Error('Account is suspended. Contact support.');
        if ((dbUser as any).isDeleted) throw new Error('User not found');

        // Update Presence
        (dbUser as any).isOnline = true;
        (dbUser as any).lastActive = new Date();

        // ── IP Geolocation (no browser permission needed) ──
        try {
          const ipLocation = await lookupRequestGeoLocation(context?.req);
          if (ipLocation.latitude != null && ipLocation.longitude != null) {
            const ip = context?.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || context?.req?.ip || '';
            // Check for suspicious login BEFORE overwriting old coordinates
            await checkSuspiciousLogin(dbUser, ipLocation.latitude, ipLocation.longitude, ip, 'Google', ipLocation.city, ipLocation.country, sendSuspiciousLoginAlert);
            // Only overwrite coordinates from IP if user hasn't confirmed their location
            if (!(dbUser as any).locationShared) {
              (dbUser as any).latitude = ipLocation.latitude;
              (dbUser as any).longitude = ipLocation.longitude;
              (dbUser as any).locationUpdatedAt = new Date();
              (dbUser as any).locationShared = false; // IP-based, not user-confirmed
            }
          }
        } catch (err) {
          console.debug('[GoogleLogin] IP Geolocation error (non-blocking):', err);
        }

        // Log Login Activity
        const now = new Date().toISOString();
        (dbUser as any).activityLog.push({
          action: 'LOGIN',
          details: 'User logged in via Google',
          timestamp: now
        });

        await dbUser.save();

        const jwtToken = jwt.sign(
          { id: dbUser.id, email: dbUser.email, username: dbUser.username, role: (dbUser as any).role },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '30d' }
        );

        return { token: jwtToken, user: dbUser };
      } catch (error: any) {
        console.error('Firebase login error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        throw new Error('Firebase authentication failed: ' + error.message);
      }
    },

    requestPasswordReset: async (_: any, { email }: { email: string }) => {
      const user = await User.findOne({ email, isDeleted: { $ne: true } });
      if (!user) {
        // Return true even if user not found for security (prevent enumeration)
        return true;
      }

      // Generate reset token (random 32 bytes hex)
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token to user
      (user as any).resetPasswordToken = hashedToken;
      (user as any).resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send email with plain token
      try {
        await sendPasswordResetEmail(user.email, resetToken);
      } catch (error) {
        console.error('Email send error:', error);
        (user as any).resetPasswordToken = undefined;
        (user as any).resetPasswordExpires = undefined;
        await user.save();
        return false;
      }

      return true;
    },

    resetPassword: async (_: any, { token, newPassword }: { token: string, newPassword: string }) => {
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
        isDeleted: { $ne: true }
      });

      if (!user) {
        throw new Error('Invalid or expired password reset token');
      }

      // Hash and save the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Notify user or log activity
      await logActivity(user.id, 'PASSWORD_RESET', 'User', user.id, 'Password reset successfully');

      return true;
    },





    trackActivity: async (_: any, { action, details, path }: { action: string, details?: string, path?: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const userId = context.user?.id || context.user?._id || context.user?.sub;
      let user = null;

      if (userId) {
        user = await User.findById(userId);
      }

      if (!user && context.user?.email) {
        user = await User.findOne({ email: context.user.email, isDeleted: { $ne: true } });
      }

      if (!user) throw new Error('User not found');

      const now = new Date();

      // Calculate Time Spent (if lastActive was recent, < 30 mins)
      if ((user as any).lastActive) {
        const diff = (now.getTime() - new Date((user as any).lastActive).getTime()) / 1000; // seconds
        if (diff < 1800 && diff > 0) {
          (user as any).totalTimeSpent = ((user as any).totalTimeSpent || 0) + diff;
        }
      }

      (user as any).lastActive = now;
      if (path) (user as any).lastPath = path;

      (user as any).activityLog.push({ action, details, timestamp: now });

      if ((user as any).activityLog.length > 200) (user as any).activityLog.shift();

      await user.save();

      // Notify relevant trainers/instructors
      if (context.user.role === 'student') {
        try {
          // Import Course inside for scoping if needed, but it should be available in the file
          const enrolledCourses = await Course.find({ studentsEnrolled: context.user.id });
          const instructorIds = Array.from(new Set(enrolledCourses.map((c: any) => c.instructor.toString())));

          instructorIds.forEach(async (id: string) => {
            try {
              await pusher.trigger(`user-${id}`, 'student_activity', {
                studentId: context.user.id,
                studentName: (user as any).fullName || (user as any).username,
                action,
                details,
                timestamp: now
              });
            } catch (e) { console.error(e); }
          });
        } catch (err) {
          console.error("Error emitting student activity:", err);
        }
      }

      return user;
    },
    createQuestion: async (_: any, args: any, context: any) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }

      // Ensure lessonId is null if it's a temporary ID from the frontend
      if (args.lessonId && args.lessonId.includes('-')) {
        const [m, l] = args.lessonId.split('-');
        if (!args.moduleNumber) args.moduleNumber = m;
        if (!args.lessonNumber) args.lessonNumber = l;
        args.lessonId = null;
      }

      const question = new Question({
        ...args
      });
      await question.save();
      return question;
    },

    updateQuestion: async (_: any, { id, ...args }: any, context: any) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }

      // Handle lessonId if it's a temporary ID
      if (args.lessonId && args.lessonId.includes('-')) {
        const [m, l] = args.lessonId.split('-');
        if (!args.moduleNumber) args.moduleNumber = m;
        if (!args.lessonNumber) args.lessonNumber = l;
        args.lessonId = null;
      }

      return await Question.findByIdAndUpdate(id, args, { new: true });
    },
    deleteQuestion: async (_: any, { id }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const question = await Question.findById(id);
      if (!question) throw new Error('Question not found');
      const course = await Course.findById(question.courseId);
      if (course?.instructor.toString() !== context.user.id && context.user.role !== 'super_admin' && context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }
      await Question.findByIdAndDelete(id);
      return true;
    },


    createBadge: async (_: any, args: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) throw new Error('Not authorized');
      const badge = new Badge({ ...args, createdBy: context.user.id });
      await badge.save();
      return badge;
    },
    awardBadge: async (_: any, { userId, badgeId }: any, context: any) => {
      if (!context.user || (context.user.role !== 'trainer' && context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Not authorized');
      }
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const alreadyHas = (user as any).badges.some((b: any) => b.badgeId.toString() === badgeId);
      if (!alreadyHas) {
        (user as any).badges.push({ badgeId });
        await user.save();
      }
      return await user.populate('badges.badgeId enrolledCourses');
    },
    submitGrade: async (_: any, { userId, courseId, lessonId, score, feedback }: any, context: any) => {
      if (!context.user || (context.user.role !== 'trainer' && context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Not authorized');
      }
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      (user as any).grades.push({
        courseId,
        lessonId,
        score,
        feedback,
        gradedBy: context.user.id
      });
      await user.save();
      return await user.populate('enrolledCourses');
    },
    issueCertificate: async (_: any, { id, credentialId }: any, context: any) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Unauthorized');
      }
      return await Certificate.findByIdAndUpdate(
        id,
        { status: 'issued', issueDate: new Date().toISOString(), credentialId },
        { new: true }
      );
    },

    updateCertificateRecipientName: async (_: any, { id, recipientName }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const cert = await Certificate.findById(id);
      if (!cert) throw new Error('Certificate not found');

      // Allow only the owner or an admin to update the name
      if (cert.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      cert.recipientName = recipientName;
      await cert.save();
      return cert;
    },

    promoteStudent: async (_: any, { userId, academicStatus, level }: any, context: any) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Not authorized');
      }
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      if (academicStatus) (user as any).academicStatus = academicStatus;
      if (level) (user as any).level = level;

      await user.save();
      return await user.populate('enrolledCourses badgeId');
    },

    updateBadge: async (_: any, { id, ...args }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) throw new Error('Not authorized');
      const badge = await Badge.findById(id);
      if (!badge) throw new Error('Badge not found');
      Object.assign(badge, args);
      await badge.save();
      return badge;
    },

    deleteBadge: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) throw new Error('Not authorized');
      const badge = await Badge.findById(id);
      if (!badge) throw new Error('Badge not found');
      await Badge.findByIdAndDelete(id);
      return true;
    },
    updateConfig: async (_: any, { key, value, description }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) throw new Error('Not authorized');
      let config = await Config.findOne({ key });
      if (config) {
        config.value = value;
        if (description) config.description = description;
        await config.save();
      } else {
        config = new Config({ key, value, description });
        await config.save();
      }

      // Update branding mega-config if a relevant key is changed
      const brandingKeys = ['siteName', 'primaryColor', 'portalTitle', 'maintenanceMode'];
      if (brandingKeys.includes(key)) {
        let brandingConfig = await Config.findOne({ key: 'branding' });
        if (brandingConfig) {
          brandingConfig.value = { ...brandingConfig.value, [key]: value };
          await brandingConfig.save();
        }
      }

      return config;
    },

    sendTestEmail: async (_: any, { to }: { to: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') throw new Error('Not authorized');

      const success = await sendEmail({
        to,
        subject: 'Test Email from MultiCourses Academy',
        html: `
          <h1>SMTP Configuration Test</h1>
          <p>This is a test email to verify your SMTP settings (Zoho/Gmail/etc.) are working correctly with your App Password.</p>
          <p>If you received this, your configuration is correct!</p>
          <br/>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        `
      });

      if (!success) throw new Error('Failed to send test email. Check your SMTP settings and App Password.');
      return true;
    },

    setup2FA: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      const secret = speakeasy.generateSecret({
        name: `MultiCourses Academy (${user.email})`
      });

      user.twoFactorSecret = secret.base32;
      await user.save();

      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        qrCodeDataUrl,
        secret: secret.base32
      };
    },

    verify2FA: async (_: any, { code }: { code: string }, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: code
      });

      if (!verified) throw new Error('Invalid 2FA code');

      user.twoFactorEnabled = true;
      await user.save();

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET!);

      return {
        token,
        user,
        requires2FA: false
      };
    },

    disable2FA: async (_: any, { code }: { code: string }, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: code
      });

      if (!verified) throw new Error('Invalid 2FA code');

      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      await user.save();

      return true;
    },

    requestEmailOTP: async (_: any, { email }: { email: string }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('User not found');

      // Generate 6 digit numeric code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.loginOTP = otp;
      user.loginOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      await user.save();

      await sendLoginOTPEmail(email, otp);
      return true;
    },

    verifyEmailOTP: async (_: any, { email, code }: { email: string, code: string }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('User not found');

      if (!user.loginOTP || user.loginOTP !== code) {
        throw new Error('Invalid verification code');
      }

      if (user.loginOTPExpires && user.loginOTPExpires < new Date()) {
        throw new Error('Verification code has expired');
      }

      // Clear OTP
      user.loginOTP = undefined;
      user.loginOTPExpires = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET!
      );

      return {
        token,
        user,
        requires2FA: false
      };
    },

    enableEmail2FA: async (_: any, { code }: { code: string }, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      if (!user.loginOTP || user.loginOTP !== code) {
        throw new Error('Invalid verification code');
      }

      if (user.loginOTPExpires && user.loginOTPExpires < new Date()) {
        throw new Error('Verification code has expired');
      }

      // Clear OTP
      user.loginOTP = undefined;
      user.loginOTPExpires = undefined;
      user.twoFactorEnabled = true;
      await user.save();

      return true;
    },

    disableEmail2FA: async (_: any, { code }: { code: string }, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      if (!user.loginOTP || user.loginOTP !== code) {
        throw new Error('Invalid verification code');
      }

      if (user.loginOTPExpires && user.loginOTPExpires < new Date()) {
        throw new Error('Verification code has expired');
      }

      // Clear OTP
      user.loginOTP = undefined;
      user.loginOTPExpires = undefined;
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      await user.save();

      return true;
    },

        ...backupResolvers.Mutation,

// Projects Mutations
    createProject: async (_: any, { userId, mentorIds, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // If userId is provided, ensure the creator is an admin or trainer
      let targetUserId = context.user.id;
      if (userId && (context.user.role === 'admin' || context.user.role === 'super_admin' || context.user.role === 'trainer')) {
        targetUserId = userId;
      }

      const project = new Project({
        ...args,
        userId: targetUserId,
        mentors: mentorIds || [context.user.id],
        status: 'in_progress',
        progress: 0,
      });
      await project.save();

      // Link to Internship if applicable
      if (project.course === 'Internship') {
        await Internship.findOneAndUpdate(
          { userId: project.userId },
          { $addToSet: { projects: project._id } }
        );
      }

      // Notify User
      await sendNotification(targetUserId, {
        type: 'PROJECT_ASSIGNED',
        title: 'New Project Assigned',
        message: `You have been assigned a new project: ${project.title}`,
        link: `/portal/student/projects/${project._id}`
      });

      return await project.populate(['userId', 'mentors', 'team.userId']);
    },
    updateProject: async (_: any, { id, mentorIds, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findById(id);
      if (!project) throw new Error('Project not found');

      // Check ownership or admin/trainer role
      if (project.userId.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      Object.assign(project, args);
      if (mentorIds) project.mentors = mentorIds;
      await project.save();

      // Recalculate Internship Progress
      const internship = await Internship.findOne({ projects: id });
      if (internship) {
        const newProgress = await calculateInternshipProgress(internship);
        internship.progress = newProgress;
        await internship.save();
      }

      return await project.populate(['userId', 'mentors', 'team.userId']);
    },
    deleteProject: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findById(id);
      if (!project) throw new Error('Project not found');

      // Check ownership or admin role
      if (project.userId.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      await Project.findByIdAndDelete(id);
      return true;
    },
    submitProject: async (_: any, { id, submissionUrl }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findById(id);
      if (!project) throw new Error('Project not found');

      const isTeamMember = project.team?.some(member => member.userId?.toString() === context.user.id);

      if (project.userId.toString() !== context.user.id && !isTeamMember &&
        context.user.role !== 'super_admin' && context.user.role !== 'admin' && context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      project.status = 'pending_review';
      project.progress = 100;
      project.submittedAt = new Date();
      (project as any).submissionUrl = submissionUrl;
      await project.save();

      // Notify Mentors
      if (project.mentors && project.mentors.length > 0) {
        await broadcastToTeam(project.mentors.map(m => m.toString()), {
          type: 'PROJECT_SUBMITTED',
          title: 'Project Submitted',
          message: `${context.user.username} submitted project: ${project.title}`,
          link: `/portal/trainer/projects/${project._id}`
        });
      }

      return await project.populate(['userId', 'mentors', 'team.userId']);
    },
    gradeProject: async (_: any, { id, grade, feedback }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Only trainers and admins can grade
      if (context.user.role !== 'trainer' && context.user.role !== 'admin' && context.user.role !== 'super_admin') {
        throw new Error('Not authorized to grade projects');
      }

      const project = await Project.findById(id);
      if (!project) throw new Error('Project not found');

      project.grade = grade;
      project.feedback = feedback;
      project.status = 'completed';
      project.progress = 100;

      await project.save();

      // Notify Student
      await sendNotification(project.userId.toString(), {
        type: 'PROJECT_GRADED',
        title: 'Project Graded',
        message: `Your project "${project.title}" has been graded: ${grade}`,
        link: `/portal/student/projects/${project._id}`
      });

      return await project.populate(['userId', 'mentors', 'team.userId']);
    },

    autoGroupStudents: async (_: any, { courseId, projectTitle, description, deadline }: any, context: any) => {
      if (!context.user || (context.user.role !== 'trainer' && context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Not authorized');
      }

      if (!courseId || courseId === "") throw new Error("Course ID is required");
      const course = await Course.findById(courseId).populate('studentsEnrolled');
      if (!course) throw new Error('Course not found');

      // Get students
      const students = (course.studentsEnrolled as any[]);

      // Shuffle array
      const shuffled = [...students].sort(() => 0.5 - Math.random());

      const projects = [];
      const chunkSize = 3;

      for (let i = 0; i < shuffled.length; i += chunkSize) {
        const group = shuffled.slice(i, i + chunkSize);

        // Create team metadata
        const team = group.map((s: any) => ({
          name: s.username,
          role: 'Member'
        }));

        // Create Project for each member
        for (const student of group) {
          const project = new Project({
            userId: student._id,
            title: projectTitle,
            course: course.title,
            type: 'Team Project',
            description: description,
            deadline: deadline ? new Date(deadline) : null,
            status: 'in_progress',
            progress: 0,
            team: team,
            tasks: []
          });
          await project.save();
          projects.push(project);
        }
      }

      return projects;
    },


    createBooking: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const status = (context.user.role === 'trainer' || context.user.role === 'admin' || context.user.role === 'super_admin')
        ? 'confirmed'
        : 'pending';

      const link = args.meetingLink || ((status === 'confirmed' && ['trainer', 'admin', 'super_admin'].includes(context.user.role)) ? generateMeetLink() : undefined);

      const booking = new Booking({
        userId: context.user.id,
        ...args,
        status,
        meetingLink: link
      });

      await booking.save();

      // Send Email Invitations for confirmed sessions
      if (status === 'confirmed') {
        try {
          const student = await User.findById(booking.userId);
          if (student) {
            await sendMeetingInvitation(student.email, student.username || 'Student', booking.mentorId ? 'Mentor' : 'Host', {
              type: booking.type,
              date: booking.date,
              time: booking.time,
              meetingLink: booking.meetingLink || undefined
            });
          }

          if (booking.mentorId) {
            const mentor = await User.findById(booking.mentorId);
            if (mentor) {
              await sendMeetingInvitation(mentor.email, mentor.username || 'Mentor', student?.username || 'Student', {
                type: booking.type,
                date: booking.date,
                time: booking.time,
                meetingLink: booking.meetingLink || undefined
              });
            }
          }
        } catch (err) {
          console.error('[CreateBooking] Email error:', err);
        }
      }

      return booking;
    },

    updateBookingStatus: async (_: any, { id, status, meetingLink }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const booking = await Booking.findById(id);
      if (!booking) throw new Error('Booking not found');

      // Check auth
      if (context.user.role !== 'admin' && context.user.role !== 'super_admin' && context.user.role !== 'trainer' && booking.mentorId?.toString() !== context.user.id) {
        // Allow user to cancel their own booking
        if (booking.userId.toString() === context.user.id && status === 'cancelled') {
          // allowed
        } else {
          throw new Error('Not authorized');
        }
      }

      booking.status = status;
      if (meetingLink) {
        booking.meetingLink = meetingLink;
      } else if (status === 'confirmed' && !booking.meetingLink) {
        booking.meetingLink = generateMeetLink();
      }

      // If a trainer/admin/super_admin confirms an unassigned booking, they become the mentor/host
      if (!booking.mentorId && status === 'confirmed' && ['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        booking.mentorId = context.user.id;
      }

      await booking.save();

      // Create Notification record for DB
      if (booking.userId.toString() !== context.user.id) {
        await sendNotification(booking.userId.toString(), {
          type: 'BOOKING_UPDATED',
          title: 'Booking Updated',
          message: `Your session request status is now: ${status}`,
          link: '/portal/student/bookings'
        });
      }
      if (booking.mentorId && booking.mentorId.toString() !== context.user.id) {
        await sendNotification(booking.mentorId.toString(), {
          type: 'BOOKING_UPDATED',
          title: 'Booking Updated',
          message: `Session request status updated: ${status}`,
          link: '/portal/trainer/dashboard'
        });
      }

      // Notify relevant parties (minimal payload)
      const minimalBooking = {
        id: booking._id,
        userId: booking.userId,
        mentorId: booking.mentorId,
        status: booking.status,
        meetingLink: booking.meetingLink
      };

      try {
        if (booking.userId.toString() !== context.user.id) {
          await pusher.trigger(`user-${booking.userId.toString()}`, 'booking_updated', minimalBooking);
        }
        if (booking.mentorId && booking.mentorId.toString() !== context.user.id) {
          await pusher.trigger(`user-${booking.mentorId.toString()}`, 'booking_updated', minimalBooking);
        }
      } catch (e) {
        console.error('Pusher booking error:', e);
      }

      // Send Email Invitations if confirmed
      if (status === 'confirmed') {
        try {
          const student = await User.findById(booking.userId);
          const mentor = booking.mentorId ? await User.findById(booking.mentorId) : null;

          if (student) {
            await sendMeetingInvitation(student.email, student.username || 'Student', mentor?.username || 'Mentor', {
              type: booking.type,
              date: booking.date,
              time: booking.time,
              meetingLink: booking.meetingLink || undefined
            });
          }

          if (mentor) {
            await sendMeetingInvitation(mentor.email, mentor.username || 'Mentor', student?.username || 'Student', {
              type: booking.type,
              date: booking.date,
              time: booking.time,
              meetingLink: booking.meetingLink || undefined
            });
          }
        } catch (err) {
          console.error('[UpdateBookingStatus] Email error:', err);
        }
      }

      return booking;
    },

    // Certificates Mutations
    createCertificate: async (_: any, args: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }
      const certificate = new Certificate({
        ...args,
        status: 'in_progress',
        progress: 0,
      });
      await certificate.save();
      return await certificate.populate('userId courseId');
    },
    updateCertificate: async (_: any, { id, ...args }: any, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin' && context.user.role !== 'trainer')) {
        throw new Error('Not authorized');
      }
      const certificate = await Certificate.findById(id);
      if (!certificate) throw new Error('Certificate not found');

      Object.assign(certificate, args);
      await certificate.save();
      return await certificate.populate('userId courseId');
    },
    deleteCertificate: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) {
        throw new Error('Not authorized');
      }
      await Certificate.findByIdAndDelete(id);
      return true;
    },

    // Internships Mutations
    createInternship: async (_: any, { mentorIds, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // If not admin/trainer, check if the student is creating an internship for themselves
      if (!['super_admin', 'admin', 'trainer'].includes(context.user.role)) {
        if (args.userId !== context.user.id) {
          throw new Error('Not authorized to create internship for another user');
        }
      }
      const internship = new Internship({
        ...args,
        organization: args.organization || 'Ihub Academy',
        mentors: mentorIds || (args.mentorId ? [args.mentorId] : []),
        status: 'eligible',
        progress: 0,
      });
      await internship.save();
      return await internship.populate('userId mentorId projects');
    },

    addInternshipTask: async (_: any, { internshipId, title, priority }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');

      const newTask = {
        title,
        priority: priority || 'medium',
        status: 'pending'
      };

      internship.tasks = [...(internship.tasks || []), newTask as any];

      // Recalculate progress
      internship.progress = await calculateInternshipProgress(internship);

      await internship.save();
      return await internship.populate('userId mentorId');
    },

    addBatchTask: async (_: any, { internshipIds, stage, cohort, title, priority }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      let query: any = {};
      if (internshipIds && internshipIds.length > 0) {
        query = { _id: { $in: internshipIds } };
      } else if (stage || cohort) {
        if (stage) query.currentStage = stage;
        if (cohort) query.cohort = cohort;
      } else {
        throw new Error('Please provide internship IDs, stage or cohort');
      }

      const interns = await Internship.find(query);
      for (const intern of interns) {
        const newTask = {
          title,
          priority: priority || 'medium',
          status: 'pending'
        };
        intern.tasks = [...(intern.tasks || []), newTask as any];

        // Recalculate progress
        intern.progress = await calculateInternshipProgress(intern);

        await intern.save();
      }
      return true;
    },

    submitStandup: async (_: any, { internshipId, yesterday, today, blockers, workLink }: any, context: any) => {
      if (!context.user) throw new Error('Not authorized');

      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');
      if (internship.userId.toString() !== context.user.id && internship.userId.toString() !== context.user._id.toString()) {
        throw new Error('Not authorized to submit standup for this internship');
      }

      const standup = new Standup({
        internshipId,
        userId: context.user._id || context.user.id,
        yesterday,
        today,
        blockers,
        workLink,
        attendanceStatus: 'present',
      });
      await standup.save();

      return standup.populate('userId');
    },

    gradeSprintMilestone: async (_: any, { internshipId, week, grade, feedback }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');

      const review = {
        week,
        grade,
        feedback,
        reviewedBy: context.user._id || context.user.id,
        date: new Date()
      };

      internship.sprintReviews = [...(internship.sprintReviews || []), review];
      await internship.save();

      return internship;
    },

    scheduleMeeting: async (_: any, { internshipId, title, time, type, url, attendees }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');

      // Ensure a meeting URL exists (admins/trainers can provide one or we auto-generate)
      const meetingUrl = url || generateMeetLink();
      const meeting = {
        title,
        time,
        type,
        url: meetingUrl,
        attendees: attendees || []
      };

      internship.meetings = [...(internship.meetings || []), meeting as any];
      await internship.save();

      // Notify and email attendees
      try {
        const participantIds = new Set<string>(attendees || []);
        if (internship.userId) participantIds.add(internship.userId.toString());

        const host = await User.findById(context.user.id);
        const hostName = host?.username || host?.fullName || 'Host';

        // Send in-app notifications
        for (const pid of participantIds) {
          if (!pid) continue;
          if (pid === context.user.id) continue; // don't notify the host
          await sendNotification(pid, {
            type: 'meeting',
            title: 'New Internship Meeting Scheduled',
            message: `A new meeting "${title}" has been scheduled.`,
            link: '/portal/internship/meetings'
          });
        }

        // Collect emails and send meeting invitation emails
        const bookingDetails = {
          type,
          date: new Date(time).toISOString().split('T')[0],
          time: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          meetingLink: meetingUrl
        };

        for (const pid of participantIds) {
          if (!pid || pid === context.user.id) continue;
          const user = await User.findById(pid);
          if (!user?.email) continue;
          await sendMeetingInvitation(user.email, user.username || user.fullName || 'Participant', hostName, bookingDetails);
        }
      } catch (err) {
        console.error('[scheduleMeeting] notify/email error:', err);
      }

      return internship;
    },

    updateInternshipTaskLegacy: async (_: any, { internshipId, taskId, status }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');

      const task: any = (internship as any).tasks.id(taskId);
      if (!task) throw new Error('Task not found');

      task.status = status;

      // Recalculate progress
      internship.progress = await calculateInternshipProgress(internship);

      await internship.save();
      return await internship.populate('userId mentorId');
    },

    updateInternship: async (_: any, { id, mentorIds, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const internship = await Internship.findById(id);
      if (!internship) throw new Error('Internship not found');

      // Check ownership or admin/trainer/mentor role
      if (internship.userId.toString() !== context.user.id &&
        internship.mentorId?.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      Object.assign(internship, args);
      if (mentorIds) (internship as any).mentors = mentorIds;

      if (args.status === 'completed') {
        const existingCert = await Certificate.findOne({ userId: internship.userId, courseId: internship.id });
        if (!existingCert) {
          await new Certificate({
            userId: internship.userId,
            courseId: internship.id,
            courseTitle: internship.title,
            issueDate: new Date(),
            credentialId: `CERT-INT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'issued',
            progress: 100,
            signerName: (internship as any).signerName || 'Program Director',
            signerSignature: (internship as any).signerSignature || '',
            recipientName: (internship as any).userId?.fullName || 'Valued Student'
          }).save();
        }
      }

      await internship.save();
      return await internship.populate('userId mentorId projects');
    },
    deleteInternship: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || (context.user.role !== 'super_admin' && context.user.role !== 'admin')) {
        throw new Error('Not authorized');
      }
      await Internship.findByIdAndDelete(id);
      return true;
    },
    applyForInternship: async (_: any, { internshipId }: { internshipId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Check if user already has an internship
      const existing = await Internship.findOne({ userId: context.user.id });
      if (existing) throw new Error('You already have an internship');

      const internship = await Internship.findById(internshipId);
      if (!internship) throw new Error('Internship not found');

      internship.userId = context.user.id as any;
      internship.status = 'enrolled';
      await internship.save();
      return await internship.populate('userId mentorId');
    },
    promoteIntern: async (_: any, { internshipIds, targetStage }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      if (!internshipIds || internshipIds.length === 0) {
        throw new Error('No interns selected');
      }

      const stagesMap: any = {
        1: "Stage 1: Orientation & Onboarding",
        2: "Stage 2: Foundation Skills Training",
        3: "Stage 3: Guided Practical Projects",
        4: "Stage 4: Industry Internship / Work Simulation",
        5: "Stage 5: Evaluation & Certification",
        6: "Stage 6: Career Transition & Placement Support"
      };

      const interns = await Internship.find({ _id: { $in: internshipIds } });

      for (const intern of interns) {
        const oldStageTitle = intern.stage;
        intern.currentStage = targetStage;
        intern.stage = stagesMap[targetStage] || `Stage ${targetStage} `;

        // Calculate progress based on stage baseline
        const totalStages = 6;
        const baseProgress = ((targetStage - 1) / totalStages) * 100;

        intern.progress = Math.min(100, Math.round(baseProgress));

        if (!intern.completedStages.includes(oldStageTitle)) {
          intern.completedStages.push(oldStageTitle);
        }

        // Auto-update status based on stage
        if (targetStage === 5) intern.status = 'completed';
        if (targetStage === 6) {
          intern.status = 'graduated';
          intern.progress = 100;
        }

        await intern.save();
      }

      return true;
    },

    updateInternshipStage: async (_: any, { id, stage, currentStage }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const internship = await Internship.findById(id);
      if (!internship) throw new Error('Internship not found');

      const oldStageTitle = internship.stage;
      internship.currentStage = currentStage;
      internship.stage = stage;

      const totalStages = 6;
      const baseProgress = ((currentStage - 1) / totalStages) * 100;
      internship.progress = Math.min(100, Math.round(baseProgress));

      if (oldStageTitle && !internship.completedStages.includes(oldStageTitle)) {
        internship.completedStages.push(oldStageTitle);
      }

      if (currentStage >= 5 && currentStage < 6) internship.status = 'completed';
      if (currentStage >= 6) {
        internship.status = 'graduated';
        internship.progress = 100;
      }

      await internship.save();

      const user = await User.findById(internship.userId);
      if (user) {
        (user as any).activityLog.push({
          action: 'STAGE_UPDATED',
          details: `Moved to ${stage}`,
          timestamp: new Date()
        });
        await user.save();
      }

      return await internship.populate('userId mentorId projects');
    },

    assignGroupProject: async (_: any, { internshipIds, title, description, repoUrl, deadline, mentorIds }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      if (!internshipIds || internshipIds.length === 0) {
        throw new Error('No interns selected');
      }

      // Fetch interns to get names for the project team
      const interns = await Internship.find({ _id: { $in: internshipIds } }).populate('userId');

      const projectTeam = interns.map((intern: any) => ({
        userId: intern.userId?._id || intern.userId?.id,
        name: intern.userId?.username || 'Unknown',
        role: 'Developer'
      }));

      // Create Group Conversation
      const participantIds = [
        context.user.id,
        ...(mentorIds || []),
        ...interns.map((i: any) => i.userId?._id?.toString() || i.userId?.id?.toString())
      ].filter(Boolean);
      const uniqueParticipants = Array.from(new Set(participantIds));

      const newConversation = new Conversation({
        participants: uniqueParticipants
      });
      await newConversation.save();

      // Create new Project
      const newProject = new Project({
        userId: context.user.id,
        title,
        description,
        course: "Internship Project",
        type: 'Team Project',
        submissionUrl: repoUrl,
        deadline: deadline ? new Date(deadline) : undefined,
        status: 'in_progress',
        team: projectTeam,
        mentors: mentorIds || [context.user.id],
        conversationId: newConversation.id
      });

      await newProject.save();

      // Assign project to all interns
      await Internship.updateMany(
        { _id: { $in: internshipIds } },
        {
          $push: { projects: newProject.id }
        }
      );

      return newProject;
    },

    assignProjectToUsers: async (_: any, { projectId, userIds, type, deadline }: any, context: any) => {
      // Allow admins to assign ANY template (even drafts)
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const sourceProject = await Project.findById(projectId);
      if (!sourceProject) throw new Error('Source project template not found');

      const users = await User.find({ _id: { $in: userIds } });
      if (!users || users.length === 0) throw new Error('No users found');

      const createdProjects = [];

      if (type === 'Individual') {
        for (const user of users) {
          const newProject = new Project({
            userId: user._id,
            title: sourceProject.title,
            description: sourceProject.description,
            course: sourceProject.course,
            type: 'Individual',
            status: 'in_progress', // Direct assignment skips approval
            category: sourceProject.category,
            progress: 0,
            deadline: deadline ? new Date(deadline) : sourceProject.deadline,
            tasks: (sourceProject.tasks || []).map((t: any) => ({ ...t, completed: false, approved: false, feedback: '' })),
            mentors: sourceProject.mentors,
            documentation: sourceProject.documentation,
            milestones: sourceProject.milestones?.map((m: any) => ({
              ...m.toObject(),
              completed: false,
              submissions: []
            })),
          });
          await newProject.save();
          createdProjects.push(newProject);

          // Link to Internship if applicable
          if (newProject.course === 'Internship') {
            await Internship.findOneAndUpdate(
              { userId: user._id },
              { $addToSet: { projects: newProject._id } }
            );
          }

          // Notify User
          await sendNotification(user._id.toString(), {
            type: 'PROJECT_ASSIGNED',
            title: 'New Project Assigned',
            message: `You have been assigned a new project: ${newProject.title}`,
            link: `/portal/student/projects/${newProject._id}`
          });
        }
      } else if (type === 'Team Project') {
        const team = users.map(u => ({
          userId: u._id,
          name: u.username,
          role: 'Member'
        }));

        const newProject = new Project({
          userId: context.user.id, // Or the first student? Usually trainer assigns to themselves as owner or first student?
          // Let's assign to the first student for now, or keep it generic. 
          // Actually, for team projects, usually one student is the 'owner' in the schema, 
          // or we need a specific owner. Let's use the first user in the list as owner.
          title: sourceProject.title,
          description: sourceProject.description,
          course: sourceProject.course,
          type: 'Team Project',
          status: 'in_progress', // Direct assignment skips approval
          category: sourceProject.category,
          progress: 0,
          deadline: deadline ? new Date(deadline) : sourceProject.deadline,
          tasks: (sourceProject.tasks || []).map((t: any) => ({ ...t, completed: false, approved: false, feedback: '' })),
          team: team,
          mentors: sourceProject.mentors,
          documentation: sourceProject.documentation,
          milestones: sourceProject.milestones?.map((m: any) => ({
            ...m.toObject(),
            completed: false,
            submissions: []
          })),
        });
        // Override userId to be the first team member if context.user is admin
        if (users.length > 0) {
          newProject.userId = users[0]._id;
        }

        await newProject.save();
        createdProjects.push(newProject);

        // Link to Internship if applicable
        if (newProject.course === 'Internship') {
          const teamUserIds = users.map(u => u._id);
          await Internship.updateMany(
            { userId: { $in: teamUserIds } },
            { $addToSet: { projects: newProject._id } }
          );
        }

        // Notify Team
        await broadcastToTeam(users.map(u => u._id.toString()), {
          type: 'PROJECT_ASSIGNED',
          title: 'New Team Project Assigned',
          message: `You have been assigned to a new team project: ${newProject.title}`,
          link: `/portal/student/projects/${newProject._id}`
        });
      }

      return await Project.populate(createdProjects, 'userId mentors team.userId');
    },

    requestProjectStart: async (_: any, { templateId, type, teamMembers }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const template = await Project.findById(templateId);
      if (!template) throw new Error('Template not found');
      if (template.visibility !== 'public' && !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('This project is not available for request');
      }

      let team: { userId: string; name: string; role: string }[] = [];
      if (type === 'Team Project' && teamMembers && teamMembers.length > 0) {
        const users = await User.find({ _id: { $in: teamMembers } });
        team = users.map(u => ({
          userId: u._id.toString(),
          name: u.username,
          role: 'Member'
        }));
        // Add self
        team.push({ userId: context.user.id, name: context.user.username, role: 'Leader' });
      }

      const newProject = new Project({
        userId: context.user.id,
        title: template.title,
        description: template.description,
        course: template.course,
        type: type,
        category: template.category,
        status: 'pending_approval', // Needs approval
        progress: 0,
        deadline: template.deadline, // Copy default deadline or leave null
        tasks: (template.tasks || []).map((t: any) => ({ ...t, completed: false, approved: false, feedback: '' })),
        mentors: template.mentors,
        team: team,
        documentation: template.documentation,
        milestones: template.milestones?.map((m: any) => ({
          ...m.toObject(),
          completed: false,
          submissions: []
        })),
        parentProject: template._id // Track origin
      });

      await newProject.save();
      return newProject;
    },

    approveProjectRequest: async (_: any, { projectId, approved, feedback }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');

      if (approved) {
        project.status = 'in_progress';
        project.startDate = new Date();
        // project.feedback = feedback; // Optional initial feedback?
      } else {
        project.status = 'rejected';
        project.feedback = feedback;
      }

      await project.save();
      return project;
    },

    toggleProjectTemplate: async (_: any, { id, visibility }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const project = await Project.findById(id);
      if (!project) throw new Error('Project not found');

      project.isTemplate = !project.isTemplate;
      if (visibility) {
        project.visibility = visibility;
      }
      // Ensure category matches valid enum if needed, or default
      if (!project.category) project.category = 'Other';

      await project.save();
      return project;
    },

    sendMessageToProject: async (_: any, { projectId, content }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');

      let conversationId = (project as any).conversationId;

      if (!conversationId) {
        const teamUserIds = project.team?.map((t: any) => t.userId).filter(Boolean) || [];
        const uniqueParticipants = Array.from(new Set([project.userId.toString(), ...teamUserIds.map((id: any) => id.toString())]));

        const newConversation = new Conversation({
          participants: uniqueParticipants
        });
        await newConversation.save();

        (project as any).conversationId = newConversation.id;
        await project.save();
        conversationId = newConversation.id;
      }

      const newMessage = new Message({
        conversationId,
        sender: context.user.id,
        content,
        read: false
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: newMessage.id,
        updatedAt: new Date()
      });

      return await newMessage.populate('sender');
    },

    updateInternshipPayment: async (_: any, { id, status, paidAt }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const internship = await Internship.findById(id);
      if (!internship) throw new Error('Internship not found');

      // Check ownership or admin role
      if (internship.userId.toString() !== context.user.id &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      const oldStatus = internship.payment.status;
      internship.payment.status = status;
      if (paidAt) internship.payment.paidAt = new Date(paidAt);

      // If newly paid, create a Payment record for tracking
      if ((status === 'paid' || status === 'completed') && oldStatus !== 'paid') {
        const existingPayment = await Payment.findOne({ internshipId: internship.id });
        if (!existingPayment) {
          await new Payment({
            userId: internship.userId,
            internshipId: internship.id,
            amount: internship.payment.amount,
            currency: internship.payment.currency || 'RWF',
            status: 'completed',
            paymentMethod: 'Mobile Money',
            transactionId: `TXN - INT - ${Math.random().toString(36).substring(7).toUpperCase()} `,
            type: 'Internship Fee',
            itemTitle: internship.title
          }).save();
        }

        // Auto-approve registration if payment is successful
        if (internship.status === 'eligible' || internship.status === 'not_eligible') {
          internship.status = 'enrolled';
        }
      }

      // If already enrolled and payment is confirmed, start the journey
      if (status === 'paid' && internship.status === 'enrolled') {
        internship.status = 'in_progress';
      }

      await internship.save();
      return await internship.populate('userId mentorId');
    },

    awardBadgeToBatch: async (_: any, { userIds, badgeId }: any, context: any) => {
      if (!context.user || !['trainer', 'admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const session = await User.startSession();
      try {
        await session.withTransaction(async () => {
          for (const userId of userIds) {
            const user = await User.findById(userId);
            if (user) {
              const alreadyHas = (user as any).badges.some((b: any) => b.badgeId.toString() === badgeId);
              if (!alreadyHas) {
                (user as any).badges.push({ badgeId });
                await user.save({ session });
              }
            }
          }
        });
        return true;
      } catch (err) {
        console.error("Batch award failed:", err);
        return false;
      } finally {
        session.endSession();
      }
    },
    payForCourse: async (_: any, { courseId, amount, paymentMethod }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const targetId = typeof courseId === 'object' ? (courseId.id || courseId._id) : courseId;
      if (!targetId || targetId === "") throw new Error("Course ID is required for payment");
      const course = await Course.findById(targetId);
      if (!course) throw new Error(`Course not found for ID: ${targetId} `);

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      // Check if already enrolled
      const isEnrolled = user.enrolledCourses.some((id: any) => id.toString() === targetId);
      if (isEnrolled) {
        throw new Error('Already enrolled in this course');
      }

      // Check if there is already a pending payment for this course
      const existingPayment = await Payment.findOne({
        userId: user.id,
        courseId: course.id,
        status: 'pending'
      });

      if (existingPayment) {
        return await course.populate('instructor studentsEnrolled');
      }

      // Record Payment as PENDING
      const payment = new Payment({
        userId: user.id,
        courseId: course.id,
        amount,
        currency: 'RWF',
        status: 'pending',
        paymentMethod,
        transactionId: `TXN - ${Math.random().toString(36).substring(7).toUpperCase()} `,
        type: 'Course Enrollment',
        itemTitle: course.title
      });
      await payment.save();

      (user as any).activityLog.push({
        action: 'COURSE_PAYMENT_INITIATED',
        details: `Initiated payment of ${amount} for ${course.title} via ${paymentMethod} `,
        timestamp: new Date()
      });
      await user.save();

      return {
        id: payment.id,
        studentName: user.username,
        type: payment.type,
        itemTitle: payment.itemTitle,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt.toISOString(),
        status: payment.status,
        method: payment.paymentMethod,
        proofOfPaymentUrl: payment.proofOfPaymentUrl,
        adminNotes: payment.adminNotes
      };
    },

    submitPaymentProof: async (_: any, { paymentId, proofUrl }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const payment = await Payment.findById(paymentId);
      if (!payment) throw new Error('Payment record not found');

      if (payment.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      payment.proofOfPaymentUrl = proofUrl;
      await payment.save();

      const user = await User.findById(payment.userId);
      if (user) {
        (user as any).activityLog.push({
          action: 'PAYMENT_PROOF_SUBMITTED',
          details: `Submitted proof for ${payment.itemTitle}`,
          timestamp: new Date()
        });
        await user.save();
      }

      return {
        id: payment.id,
        studentName: user?.username || 'Unknown',
        type: payment.type,
        itemTitle: payment.itemTitle,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt.toISOString(),
        status: payment.status,
        method: payment.paymentMethod,
        proofOfPaymentUrl: payment.proofOfPaymentUrl,
        adminNotes: payment.adminNotes
      };
    },

    approvePayment: async (_: any, { paymentId, adminNotes }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) throw new Error('Payment not found');

      if (payment.status === 'completed') throw new Error('Payment already approved');
      if (!payment.proofOfPaymentUrl) throw new Error('Cannot approve payment without proof of payment');

      payment.status = 'completed';
      if (adminNotes) payment.adminNotes = adminNotes;
      await payment.save();

      // Grant Access
      const user = await User.findById(payment.userId);
      if (!user) throw new Error('User not found');

      if (payment.type === 'Course Enrollment' && payment.courseId) {
        const course = await Course.findById(payment.courseId);
        if (course) {
          // Add to user
          if (!user.enrolledCourses.some((id: any) => id.toString() === course.id)) {
            user.enrolledCourses.push(course.id as any);
          }
          // Add to course
          if (!course.studentsEnrolled.some((id: any) => id.toString() === user.id)) {
            course.studentsEnrolled.push(user.id as any);
            await course.save();
          }

          (user as any).activityLog.push({
            action: 'PAYMENT_APPROVED',
            details: `Admin approved payment for ${course.title}. Access granted.`,
            timestamp: new Date()
          });
          await user.save();

          // Initialize Course Progress
          await CourseProgress.findOneAndUpdate(
            { userId: user.id, courseId: course.id },
            {
              $setOnInsert: {
                userId: user.id,
                courseId: course.id,
                lessons: [],
                status: 'active',
                lastAccessed: new Date()
              }
            },
            { upsert: true }
          );
        }
      } else if (payment.type === 'Internship Fee' && payment.internshipId) {
        const program = await InternshipProgram.findById(payment.internshipId);
        if (program) {
          // Create Internship enrollment record
          const existingInternship = await Internship.findOne({
            userId: user.id,
            title: program.title,
            isDeleted: false
          });

          if (!existingInternship) {
            const newInternship = new Internship({
              userId: user.id,
              title: program.title || 'Internship Program',
              duration: program.duration || '3 Months',
              type: 'Online',
              status: 'enrolled',
              progress: 0,
              payment: {
                amount: payment.amount,
                currency: 'RWF',
                status: 'paid'
              }
            });
            await newInternship.save();
          }

          (user as any).activityLog.push({
            action: 'PAYMENT_APPROVED',
            details: `Admin approved payment for ${program.title} internship. Access granted.`,
            timestamp: new Date()
          });
          await user.save();
        }
      } else if (payment.type === 'Bulk Enrollment') {
        // Handle Multiple Courses
        if (payment.courseIds && payment.courseIds.length > 0) {
          for (const courseId of payment.courseIds) {
            if (!courseId) continue;
            const course = await Course.findById(courseId);
            if (course) {
              if (!user.enrolledCourses.some((id: any) => id.toString() === course.id)) {
                user.enrolledCourses.push(course.id as any);
              }
              if (!course.studentsEnrolled.some((id: any) => id.toString() === user.id)) {
                course.studentsEnrolled.push(user.id as any);
                await course.save();
              }
              // Initialize Course Progress
              await CourseProgress.findOneAndUpdate(
                { userId: user.id, courseId: course.id },
                {
                  $setOnInsert: {
                    userId: user.id,
                    courseId: course.id,
                    lessons: [],
                    status: 'active',
                    lastAccessed: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }
        }

        // Handle Multiple Internships
        if (payment.internshipIds && payment.internshipIds.length > 0) {
          for (const programId of payment.internshipIds) {
            const program = await InternshipProgram.findById(programId);
            if (program) {
              const existingInternship = await Internship.findOne({
                userId: user.id,
                title: program.title,
                isDeleted: false
              });

              if (!existingInternship) {
                const newInternship = new Internship({
                  userId: user.id,
                  title: program.title || 'Internship Program',
                  duration: program.duration || '3 Months',
                  type: 'Online',
                  status: 'enrolled',
                  progress: 0,
                  payment: {
                    amount: payment.amount / payment.internshipIds!.length, // Rough split
                    currency: 'RWF',
                    status: 'paid'
                  }
                });
                await newInternship.save();
              }
            }
          }
        }

        (user as any).activityLog.push({
          action: 'PAYMENT_APPROVED',
          details: `Admin approved bulk payment. Access granted to all items.`,
          timestamp: new Date()
        });
        await user.save();
      }

      return {
        id: payment.id,
        studentName: user?.username || 'Unknown',
        type: payment.type,
        itemTitle: payment.itemTitle,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt.toISOString(),
        status: payment.status,
        method: payment.paymentMethod,
        proofOfPaymentUrl: payment.proofOfPaymentUrl,
        adminNotes: payment.adminNotes
      };
    },

    rejectPayment: async (_: any, { paymentId, adminNotes }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) throw new Error('Payment not found');

      payment.status = 'failed';
      payment.adminNotes = adminNotes;
      await payment.save();

      const user = await User.findById(payment.userId);
      if (user) {
        (user as any).activityLog.push({
          action: 'PAYMENT_REJECTED',
          details: `Admin rejected payment for ${payment.itemTitle}.Reason: ${adminNotes} `,
          timestamp: new Date()
        });
        await user.save();
      }

      return {
        id: payment.id,
        studentName: user?.username || 'Unknown',
        type: payment.type,
        itemTitle: payment.itemTitle,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt.toISOString(),
        status: payment.status,
        method: payment.paymentMethod,
        proofOfPaymentUrl: payment.proofOfPaymentUrl,
        adminNotes: payment.adminNotes
      };
    },

    updateTheme: async (_: any, { primaryColor, mode, lightBg, darkBg }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      (user as any).themePreference = {
        primaryColor: primaryColor === undefined ? user.themePreference?.primaryColor : primaryColor,
        mode: mode === undefined ? user.themePreference?.mode : mode,
        lightBg: lightBg === undefined ? user.themePreference?.lightBg : lightBg,
        darkBg: darkBg === undefined ? user.themePreference?.darkBg : darkBg
      };

      await user.save();
      return user;
    },

    updateBranding: async (_: any, args: any, context: any) => {
      if (!context.user || (context.user.role !== 'admin' && context.user.role !== 'super_admin')) {
        throw new Error('Not authorized. Only administrators can change global branding.');
      }

      let config = await Config.findOne({ key: 'branding' });
      if (!config) {
        config = new Config({
          key: 'branding',
          value: {
            primaryColor: '#D4AF37',
            secondaryColor: '#B08D2A',
            accentColor: '#D4AF37',
            logoUrl: '',
            siteName: 'MultiCourses',
            portalTitle: 'Academy Hub',
            maintenanceMode: false
          }
        });
      }

      config.value = { ...config.value, ...args };
      await config.save();

      // Sync individual keys for consistency with SuperAdminConfig
      const syncKeys = ['siteName', 'primaryColor', 'portalTitle'];
      for (const key of syncKeys) {
        if (args[key]) {
          await Config.findOneAndUpdate(
            { key },
            { value: args[key] },
            { upsert: true }
          );
        }
      }

      if (args.maintenanceMode !== undefined) {
        await Config.findOneAndUpdate(
          { key: 'maintenanceMode' },
          { value: String(args.maintenanceMode) },
          { upsert: true }
        );
      }

      return config.value;
    },

    updateTaskProgress: async (_: any, { projectId, taskId, completed }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');

      const task = project.tasks?.find((t: any) => t.id === taskId || t._id.toString() === taskId);
      if (!task) throw new Error('Task not found');

      const isTeamMember = project.team?.some(member => member.userId?.toString() === context.user.id);

      // Also allow students who have ProjectTask items assigned to them in this project
      const hasAssignedTasks = (!project.userId || project.userId.toString() !== context.user.id) && !isTeamMember ?
        await ProjectTask.exists({ projectId, assigneeId: context.user.id, isDeleted: false }) :
        false;

      if (project.userId.toString() !== context.user.id && !isTeamMember && !hasAssignedTasks &&
        context.user.role !== 'super_admin' &&
        context.user.role !== 'admin' &&
        context.user.role !== 'trainer') {
        throw new Error('Not authorized');
      }

      task.completed = completed;

      // Calculate progress based on completed tasks
      const totalTasks = project.tasks?.length || 0;
      const completedTasks = project.tasks?.filter((t: any) => t.completed).length || 0;
      project.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await project.save();
      return project;
    },


    // --- Internship Module Mutations (Group 1: Programs, Applications, Projects) ---

    createInternshipProgram: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const program = new InternshipProgram({ ...args, createdBy: context.user.id });
      await program.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipProgram', program.id, `Created program: ${program.title}`);
      return program;
    },

    updateInternshipProgram: async (_: any, { id, ...args }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      // Parse date strings to Date objects if provided
      const updateData: any = { ...args };
      if (args.startDate) updateData.startDate = new Date(args.startDate);
      if (args.endDate) updateData.endDate = new Date(args.endDate);
      if (args.applicationDeadline) updateData.applicationDeadline = new Date(args.applicationDeadline);
      if (args.discount !== undefined) updateData.discount = args.discount;
      if (args.maxSpots !== undefined) updateData.maxSpots = args.maxSpots;

      const program = await InternshipProgram.findByIdAndUpdate(id, updateData, { new: true });
      if (!program) throw new Error('Program not found');
      await logActivity(context.user.id, 'UPDATE', 'InternshipProgram', id, `Updated program: ${program.title}`);
      return program;
    },

    deleteInternshipProgram: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const program = await InternshipProgram.findById(id);
      if (!program) throw new Error('Program not found');
      program.isDeleted = true;
      await program.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipProgram', id, `Soft deleted program: ${program.title} `);
      return true;
    },

    applyToInternshipProgram: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const program = await InternshipProgram.findById(args.internshipProgramId);
      if (!program || program.status !== 'active' || program.isDeleted) throw new Error('Internship program is not available for applications');

      const application = new InternshipApplication({
        ...args,
        userId: context.user.id,
        status: 'pending'
      });
      await application.save();

      // If program is paid, create a pending payment record so it can be added to cart
      if (program.price && program.price > 0) {
        const existingPayment = await InternshipPayment.findOne({
          userId: context.user.id,
          internshipProgramId: program.id,
          isDeleted: { $ne: true }
        });

        if (!existingPayment) {
          const payment = new InternshipPayment({
            userId: context.user.id,
            internshipProgramId: program.id,
            amount: program.price,
            currency: program.currency || 'RWF',
            status: 'pending'
          });
          await payment.save();
        }
      }

      await logActivity(context.user.id, 'APPLY', 'InternshipApplication', application.id, `Applied to program: ${program.title}`);

      // Send internship application confirmation email
      try {
        const user = await User.findById(context.user.id).select('email username fullName');
        if (user?.email) {
          await sendApplicationConfirmation(
            user.email,
            user.fullName || user.username || 'Student',
            program.title
          );
        }
      } catch (emailErr) {
        console.error('[ApplyToInternshipProgram] Email error:', emailErr);
      }

      return application;
    },

    reviewInternshipApplication: async (_: any, { id, status, rejectionReason }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const application = await InternshipApplication.findById(id).populate('userId internshipProgramId');
      if (!application) throw new Error('Application not found');

      application.status = status;
      if (rejectionReason) application.rejectionReason = rejectionReason;
      await application.save();

      // On approval: create a pending InternshipPayment (NOT the Internship yet)
      // The Internship record is created AFTER the student pays
      if (status === 'approved') {
        const program = application.internshipProgramId as any;

        // Check if a payment record already exists
        const existingPayment = await InternshipPayment.findOne({
          userId: application.userId,
          internshipProgramId: program?._id || program?.id,
          isDeleted: { $ne: true }
        });

        if (!existingPayment) {
          const payment = new InternshipPayment({
            userId: application.userId,
            internshipProgramId: program?._id || program?.id,
            amount: program?.price || 0,
            currency: program?.currency || 'RWF',
            status: program?.price === 0 ? 'paid' : 'pending',
          });
          await payment.save();

          // If free program, also create the Internship record immediately
          if (program?.price === 0) {
            const existingInternship = await Internship.findOne({
              userId: application.userId,
              title: program?.title,
              isDeleted: false
            });
            if (!existingInternship) {
              const newInternship = new Internship({
                userId: application.userId,
                title: program?.title || 'Internship Program',
                duration: program?.duration || '3 Months',
                type: 'Online',
                status: 'enrolled',
                mentorId: context.user.id,
                mentors: [context.user.id],
                progress: 0,
                payment: { amount: 0, currency: 'RWF', status: 'paid' }
              });
              await newInternship.save();
            }
          }
        }
      }

      await logActivity(context.user.id, 'REVIEW', 'InternshipApplication', id, `Reviewed application status to: ${status}`);

      // Notify via Socket
      sendNotification(application.userId.toString(), {
        type: 'INTERNSHIP_APPLICATION_STATUS',
        title: 'Application Update',
        status,
        applicationId: id,
        message: status === 'approved'
          ? `Your application has been approved! Please log in to complete your enrollment payment.`
          : `Your internship application status has been updated to: ${status}`
      });

      // Notify via Email
      try {
        const user = application.userId as any;
        const program = application.internshipProgramId as any;
        if (user.email) {
          await sendApplicationStatusUpdate(
            user.email,
            user.fullName || user.username || 'Student',
            program.title,
            status as any,
            rejectionReason || undefined
          );
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      return application;
    },

    createInternshipProject: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const { minTeamSize, maxTeamSize, documentation, ...rest } = args;
      const project = new InternshipProject({
        ...rest,
        documentation,
        teamSizeRange: { min: minTeamSize, max: maxTeamSize },
        workflow: DEFAULT_WORKFLOW,
        isTemplate: true
      });
      await project.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipProject', project.id, `Created project: ${project.title} `);
      return project;
    },

    updateProjectWorkflow: async (_: any, { projectId, workflow }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const project = await InternshipProject.findById(projectId);
      if (!project || project.isDeleted) throw new Error('Project not found');

      project.workflow = workflow;
      await project.save();
      await logActivity(context.user.id, 'UPDATE_WORKFLOW', 'InternshipProject', projectId, `Updated workflow for: ${project.title}`);
      return project;
    },

    updateInternshipProject: async (_: any, { id, minTeamSize, maxTeamSize, documentation, ...args }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const updateData: any = { ...args };
      if (minTeamSize !== undefined || maxTeamSize !== undefined) {
        updateData.teamSizeRange = {
          min: minTeamSize,
          max: maxTeamSize
        };
      }
      if (documentation) {
        updateData.documentation = documentation;
      }
      const project = await InternshipProject.findByIdAndUpdate(id, updateData, { new: true });
      if (!project) throw new Error('Project not found');
      await logActivity(context.user.id, 'UPDATE', 'InternshipProject', id, `Updated project: ${project.title} `);
      return project;
    },

    deleteInternshipProject: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const project = await InternshipProject.findById(id);
      if (!project) throw new Error('Project not found');
      project.isDeleted = true;
      await project.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipProject', id, `Soft deleted project: ${project.title} `);
      return true;
    },

    // --- Internship Module Mutations (Group 2: Teams, Milestones) ---

    createInternshipTeam: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const team = new InternshipTeam({
        ...args,
        type: args.type || 'team'
      });
      await team.save();

      // Clone predefined default tickets from the project template as tasks for this independent team
      const project = await InternshipProject.findById(args.internshipProjectId);
      if (project && project.defaultTickets && project.defaultTickets.length > 0) {
        const defaultTasks = project.defaultTickets.map((ticket: any) => ({
          projectId: project.id,
          teamId: team.id,
          title: ticket.title,
          description: ticket.description,
          status: 'todo',
          priority: ticket.priority || 'medium',
          taskType: ticket.taskType || 'task',
          labels: ticket.labels || [],
          order: ticket.order || 0,
        }));
        await InternshipTask.insertMany(defaultTasks);
      }

      await logActivity(context.user.id, 'CREATE', 'InternshipTeam', team.id, `Created ${team.type} assignment: ${team.name}`);
      return team;
    },

    updateInternshipTeam: async (_: any, { id, ...args }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const team = await InternshipTeam.findById(id);
      if (!team) throw new Error('Team not found');

      // Verification for mentors
      if (context.user.role === 'trainer' && team.mentorId?.toString() !== context.user.id) throw new Error('Unauthorized');

      Object.assign(team, args);
      await team.save();
      await logActivity(context.user.id, 'UPDATE', 'InternshipTeam', id, `Updated team: ${team.name} `);
      return team;
    },

    deleteInternshipTeam: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const team = await InternshipTeam.findById(id);
      if (!team) throw new Error('Team not found');
      team.isDeleted = true;
      await team.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipTeam', id, `Soft deleted track: ${team.name}`);
      return true;
    },

    addInternToTeam: async (_: any, { teamId, userId, role }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const membership = new InternshipTeamMember({ teamId, userId, role });
      await membership.save();

      await logActivity(context.user.id, 'ADD_MEMBER', 'InternshipTeam', teamId, `Added intern ${userId} to team`);

      // Notify intern
      sendNotification(userId.toString(), {
        type: 'TEAM_ASSIGNMENT',
        title: 'New Team Assignment',
        teamId,
        message: `You have been assigned to a new internship team.`,
        link: '/portal/student/internship'
      });

      return membership;
    },

    removeInternFromTeam: async (_: any, { teamMemberId }: { teamMemberId: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const membership = await InternshipTeamMember.findById(teamMemberId);
      if (!membership) throw new Error('Membership not found');

      membership.isDeleted = true;
      await membership.save();

      await logActivity(context.user.id, 'REMOVE_MEMBER', 'InternshipTeam', membership.teamId.toString(), `Removed intern ${membership.userId} from team`);
      return true;
    },

    assignInternshipProjectToTeam: async (_: any, { teamId, projectId }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');

      const team = await InternshipTeam.findById(teamId);
      if (!team) throw new Error('Team not found');

      const project = await InternshipProject.findById(projectId);
      if (!project) throw new Error('Project not found');

      team.internshipProjectId = projectId;
      await team.save();

      // Clone blueprint tickets
      if (project.defaultTickets && project.defaultTickets.length > 0) {
        const defaultTasks = project.defaultTickets.map((bt: any) => ({
          projectId: project.id,
          teamId: team.id,
          title: bt.title,
          description: bt.description,
          priority: bt.priority,
          taskType: bt.taskType,
          status: 'todo',
          order: bt.order,
          labels: bt.labels
        }));

        // Remove old unstarted tasks to avoid clutter?
        // For now, let's just insert the new ones.
        await InternshipTask.insertMany(defaultTasks);
      }

      await logActivity(context.user.id, 'UPDATE_TEAM', 'InternshipTeam', teamId, `Assigned project "${project.title}" to team "${team.name}" and cloned ${project.defaultTickets?.length || 0} blueprint tickets.`);

      // Trigger real-time update
      await pusher.trigger(`team-${teamId}`, 'project_assigned', {
        teamId,
        projectId,
        projectTitle: project.title
      });

      return team;
    },

    // --- Meeting Mutations ---
    createInternshipMeeting: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');

      const meetLink = args.meetLink || generateMeetLink();
      const meeting = new InternshipMeeting({
        ...args,
        meetLink,
        hostId: context.user.id
      });
      await meeting.save();

      // Notify all participants and send email invitations
      try {
        const participantIds = new Set<string>();
        const participantEmails = new Set<string>();

        const host = await User.findById(context.user.id);
        const hostName = host?.username || host?.fullName || 'Host';

        // 1. Course Members — get students enrolled in selected courses
        if (args.courseIds && args.courseIds.length > 0) {
          const courses = await Course.find({ _id: { $in: args.courseIds } }).select('studentsEnrolled').lean();
          for (const course of courses) {
            (course as any).studentsEnrolled?.forEach((s: any) => {
              const sid = s?.toString?.() || s;
              if (sid) participantIds.add(sid);
            });
          }
        }

        // 2. Team Members
        if (args.teamIds && args.teamIds.length > 0) {
          for (const teamId of args.teamIds) {
            const members = await InternshipTeamMember.find({ teamId, isDeleted: false });
            members.forEach(m => participantIds.add(m.userId.toString()));
          }
        }

        // 3. Selective Users
        if (args.userIds && args.userIds.length > 0) {
          args.userIds.forEach((id: string) => participantIds.add(id));
        }

        // 4. Selective Mentors
        if (args.mentorIds && args.mentorIds.length > 0) {
          args.mentorIds.forEach((id: string) => participantIds.add(id));
        }

        // 5. Selected client users
        if (args.clientIds && args.clientIds.length > 0) {
          args.clientIds.forEach((id: string) => participantIds.add(id));
        }

        for (const pid of participantIds) {
          if (pid === context.user.id) continue;
          const user = await User.findById(pid);
          if (!user || !user.email) continue;
          participantEmails.add(user.email);
          await sendNotification(pid, {
            type: 'meeting',
            title: 'New Meeting Scheduled',
            message: `A new meeting "${args.title}" has been scheduled.`,
            link: `/portal/internship/meetings`
          });
        }

        const bookingDetails = {
          type: meeting.type,
          date: new Date(meeting.startTime).toISOString().split('T')[0],
          time: new Date(meeting.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          meetingLink: meeting.meetLink
        };

        for (const email of participantEmails) {
          await sendMeetingInvitation(email, email.split('@')[0], hostName, bookingDetails);
        }
      } catch (err) {
        console.error('Error sending meeting notifications/emails:', err);
      }

      await logActivity(context.user.id, 'CREATE', 'InternshipMeeting', meeting.id, `Scheduled meeting: ${meeting.title}`);
      return meeting;
    },

    updateInternshipMeeting: async (_: any, { id, ...args }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const meeting = await InternshipMeeting.findByIdAndUpdate(id, args, { new: true });
      if (!meeting) throw new Error('Meeting not found');
      await logActivity(context.user.id, 'UPDATE', 'InternshipMeeting', id, `Updated meeting: ${meeting.title}`);
      return meeting;
    },

    deleteInternshipMeeting: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const meeting = await InternshipMeeting.findById(id);
      if (!meeting) throw new Error('Meeting not found');
      meeting.isDeleted = true;
      await meeting.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipMeeting', id, `Deleted meeting: ${meeting.title}`);
      return true;
    },

    // --- Sprint Mutations ---
    createInternshipSprint: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const sprintCount = await InternshipSprint.countDocuments({ projectId: args.projectId, isDeleted: false });
      const sprint = new InternshipSprint({ ...args, order: sprintCount + 1 });
      await sprint.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipSprint', sprint.id, `Created sprint: ${sprint.title}`);
      return sprint;
    },

    updateInternshipSprint: async (_: any, { id, ...args }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const sprint = await InternshipSprint.findById(id);
      if (!sprint || sprint.isDeleted) throw new Error('Sprint not found');
      Object.assign(sprint, args);
      await sprint.save();
      await logActivity(context.user.id, 'UPDATE', 'InternshipSprint', id, `Updated sprint: ${sprint.title}`);
      return sprint;
    },

    deleteInternshipSprint: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const sprint = await InternshipSprint.findById(id);
      if (!sprint) throw new Error('Sprint not found');
      sprint.isDeleted = true;
      await sprint.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipSprint', id, `Deleted sprint: ${sprint.title}`);
      return true;
    },

    // --- Task Mutations ---
    createInternshipTask: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const taskCount = await InternshipTask.countDocuments({ projectId: args.projectId, isDeleted: false });
      const task = new InternshipTask({ ...args, status: 'todo', order: taskCount + 1 });
      await task.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipTask', task.id, `Created task: ${task.title}`);

      // Notify assignee if set
      if (args.assigneeId) {
        sendNotification(args.assigneeId, {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          taskId: task.id,
          message: `You have been assigned a new task: "${task.title}"`,
          link: '/portal/student/internship'
        });
      }

      await pusher.trigger(`team-${task.teamId}`, 'task_created', task);
      return task;
    },

    updateInternshipTask: async (_: any, { id, ...args }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await InternshipTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

      const oldAssignee = task.assigneeId?.toString();
      Object.assign(task, args);
      await task.save();

      // Notify new assignee if changed
      if (args.assigneeId && args.assigneeId !== oldAssignee) {
        sendNotification(args.assigneeId, {
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned To You',
          taskId: task.id,
          message: `You have been assigned: "${task.title}"`,
          link: '/portal/student/internship'
        });
      }
      await logActivity(context.user.id, 'UPDATE', 'InternshipTask', id, `Updated task: ${task.title}`);

      await pusher.trigger(`team-${task.teamId}`, 'task_updated', task);
      return task;
    },

    addInternshipComment: async (_: any, { taskId, content, attachments }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');

      const task = await InternshipTask.findById(taskId);
      if (!task) throw new Error('Task not found');

      const comment = new InternshipComment({
        taskId,
        content,
        attachments,
        authorId: context.user.id
      });
      await comment.save();

      await pusher.trigger(`team-${task.teamId}`, 'comment_added', comment);
      return comment;
    },

    deleteInternshipComment: async (_: any, { id }: any, context: any) => {
      if (!context.user) throw new Error('Unauthorized');
      await InternshipComment.findByIdAndDelete(id);
      return true;
    },

    moveInternshipTaskStatus: async (_: any, { id, status }: { id: string; status: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await InternshipTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

      const project = await InternshipProject.findById(task.projectId);
      if (!project) throw new Error('Project not found');

      const workflow = project.workflow?.length ? project.workflow : DEFAULT_WORKFLOW;
      const targetStage = workflow.find(s => s.id === status);
      if (!targetStage) throw new Error('Invalid status for this project');

      // Gate: only trainer/admin can move to types staged or completed
      if (['staged', 'completed'].includes(targetStage.type) && !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error(`Only a trainer or admin can move tasks to ${targetStage.label}`);
      }

      task.status = status as any;
      if (targetStage.type === 'staged') {
        task.approvedBy = context.user.id;
        task.approvedAt = new Date();
      }
      await task.save();

      await logActivity(context.user.id, 'STATUS_CHANGE', 'InternshipTask', id, `Moved task "${task.title}" to ${targetStage.label}`);

      // Notify assignee
      if (task.assigneeId) {
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_STATUS_CHANGED',
          title: 'Task Status Updated',
          taskId: id,
          message: `Your task "${task.title}" was moved to ${targetStage.label}`,
          link: '/portal/student/internship'
        });
      }

      await pusher.trigger(`team-${task.teamId}`, 'task_updated', task);
      return task;
    },

    approveInternshipTask: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const task = await InternshipTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

      const project = await InternshipProject.findById(task.projectId);
      if (!project) throw new Error('Project not found');

      const workflow = project.workflow?.length ? project.workflow : DEFAULT_WORKFLOW;

      // Find the first stage of type 'staged' (deployment/approval gate)
      const stagedStage = workflow.find(s => s.type === 'staged');
      if (!stagedStage) throw new Error('This project has no staged column defined');

      task.status = stagedStage.id as any;
      task.approvedBy = context.user.id;
      task.approvedAt = new Date();
      task.rejectionReason = undefined;
      await task.save();

      await logActivity(context.user.id, 'APPROVE', 'InternshipTask', id, `Approved task: ${task.title}`);

      if (task.assigneeId) {
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_APPROVED',
          title: '✅ Task Approved!',
          taskId: id,
          message: `Great work! "${task.title}" has been approved and moved to ${stagedStage.label}.`
        });
      }
      return task;
    },

    rejectInternshipTask: async (_: any, { id, reason }: { id: string; reason?: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const task = await InternshipTask.findById(id);
      if (!task || task.isDeleted) throw new Error('Task not found');

      const project = await InternshipProject.findById(task.projectId);
      if (!project) throw new Error('Project not found');

      const workflow = project.workflow?.length ? project.workflow : DEFAULT_WORKFLOW;

      // Find the first stage of type 'review' (to send it back)
      const reviewStage = workflow.find(s => s.type === 'review') || workflow.find(s => s.type === 'progress');
      if (!reviewStage) throw new Error('This project has no review or progress column defined');

      task.status = reviewStage.id as any;
      task.rejectionReason = reason;
      await task.save();

      await logActivity(context.user.id, 'REJECT', 'InternshipTask', id, `Rejected task "${task.title}": ${reason}`);

      if (task.assigneeId) {
        sendNotification(task.assigneeId.toString(), {
          type: 'TASK_REJECTED',
          title: '↩️ Task Needs Revision',
          taskId: id,
          message: `Your task "${task.title}" needs changes: ${reason || 'Please make revisions.'}`
        });
      }
      return task;
    },

    addTaskAttachment: async (_: any, { taskId, name, url, type }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await InternshipTask.findById(taskId);
      if (!task || task.isDeleted) throw new Error('Task not found');
      task.attachments = task.attachments || [];
      task.attachments.push({ name, url, type: type || 'link' });
      await task.save();

      await pusher.trigger(`team-${task.teamId}`, 'task_updated', task);
      return task;
    },

    removeTaskAttachment: async (_: any, { taskId, attachmentIndex }: { taskId: string; attachmentIndex: number }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const task = await InternshipTask.findById(taskId);
      if (!task || task.isDeleted) throw new Error('Task not found');
      if (task.attachments) {
        task.attachments.splice(attachmentIndex, 1);
        await task.save();
      }
      return task;
    },

    deleteInternshipTask: async (_: any, { id }: { id: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const task = await InternshipTask.findById(id);
      if (!task) throw new Error('Task not found');
      task.isDeleted = true;
      await task.save();
      await logActivity(context.user.id, 'DELETE', 'InternshipTask', id, `Deleted task: ${task.title}`);
      return true;
    },

    updateInternshipProjectDocument: async (_: any, { projectId, document }: { projectId: string; document: string }, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const project = await InternshipProject.findById(projectId);
      if (!project || project.isDeleted) throw new Error('Project not found');
      project.document = document;
      await project.save();
      await logActivity(context.user.id, 'UPDATE', 'InternshipProject', projectId, `Updated project document for: ${project.title}`);
      return project;
    },

    createInternshipMilestone: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const milestone = new InternshipMilestone(args);
      await milestone.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipMilestone', milestone.id, `Created milestone: ${milestone.title} `);
      return milestone;
    },

    // --- Internship Module Mutations (Group 3: Submissions, Feedback, TimeLogs) ---

    submitInternshipWork: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const submission = new InternshipSubmission({
        ...args,
        userId: context.user.id,
        status: 'pending'
      });
      await submission.save();

      await logActivity(context.user.id, 'SUBMIT_WORK', 'InternshipSubmission', submission.id, `Submitted work for milestone ${args.milestoneId}`);

      // Notify team and mentor
      const team = await InternshipTeam.findById(args.teamId);
      if (team && team.mentorId) {
        sendNotification(team.mentorId.toString(), {
          type: 'NEW_SUBMISSION',
          title: 'New Project Submission',
          teamId: args.teamId,
          submissionId: submission.id,
          message: `New submission from team ${team.name} `
        });
      }

      return submission;
    },

    reviewInternshipSubmission: async (_: any, { id, status, feedback }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');
      const submission = await InternshipSubmission.findById(id);
      if (!submission) throw new Error('Submission not found');

      submission.status = status;
      submission.feedback = feedback;
      await submission.save();

      await logActivity(context.user.id, 'REVIEW_WORK', 'InternshipSubmission', id, `Reviewed submission status to: ${status} `);

      // Notify team member who submitted
      sendNotification(submission.userId.toString(), {
        type: 'SUBMISSION_REVIEWED',
        title: 'Submission Reviewed',
        status,
        submissionId: id,
        message: `Your project submission has been reviewed: ${status} `
      });

      return submission;
    },

    logInternshipTime: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const log = new InternshipTimeLog({
        ...args,
        userId: context.user.id
      });
      await log.save();
      await logActivity(context.user.id, 'LOG_TIME', 'InternshipTimeLog', log.id, `Logged ${args.minutes} minutes for team ${args.teamId}`);
      return log;
    },

    submitMentorFeedback: async (_: any, args: any, context: any) => {
      if (context.user?.role !== 'trainer' && !['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');
      const feedback = new InternshipMentorFeedback({
        ...args,
        mentorId: context.user.id
      });
      await feedback.save();
      await logActivity(context.user.id, 'SUBMIT_FEEDBACK', 'InternshipMentorFeedback', feedback.id, `Submitted feedback for intern ${args.userId}`);

      // Notify student
      sendNotification(args.userId.toString(), {
        type: 'NEW_MENTOR_FEEDBACK',
        title: 'New Mentor Feedback',
        mentorId: context.user.id,
        message: `Your mentor has provided new feedback on your performance.`
      });

      return feedback;
    },

    // ========== STUDENT PROFILE MUTATIONS ==========
    createStudentProfile: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Check if profile already exists
      const existing = await StudentProfile.findOne({ userId: context.user.id });
      if (existing) throw new Error('Profile already exists. Use updateStudentProfile instead.');

      const profile = new StudentProfile({
        userId: context.user.id,
        ...args
      });
      await profile.save();

      // Sync school to User model and mark onboarding as seen
      const user = await User.findById(context.user.id);
      if (user) {
        console.log(`[Onboarding] Marking user ${user.username} as onboarded`);
        user.isFirst = false;
        if (args.school) user.school = args.school;
        await user.save();
      }

      await logActivity(context.user.id, 'CREATE', 'StudentProfile', profile.id, 'Created student profile');
      return profile;
    },

    updateStudentProfile: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const profile = await StudentProfile.findOne({ userId: context.user.id });
      if (!profile) throw new Error('Profile not found. Create one first.');

      Object.assign(profile, args);
      await profile.save();

      // Sync school to User model and mark onboarding as seen
      const user = await User.findById(context.user.id);
      if (user) {
        console.log(`[Onboarding] Marking user ${user.username} as onboarded via update`);
        user.isFirst = false;
        if (args.school) user.school = args.school;
        await user.save();
      }

      await logActivity(context.user.id, 'UPDATE', 'StudentProfile', profile.id, 'Updated student profile');
      return profile;
    },

    validateProfileForInternship: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const profile = await StudentProfile.findOne({ userId: context.user.id });

      const requiredFields = ['school', 'educationLevel', 'fieldOfStudy', 'skills', 'availability'];
      const missingFields: string[] = [];

      if (!profile) {
        return {
          isValid: false,
          missingFields: requiredFields,
          completionPercentage: 0,
          message: 'No profile found. Please create your student profile first.'
        };
      }

      requiredFields.forEach(field => {
        const value = (profile as any)[field];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          missingFields.push(field);
        }
      });

      return {
        isValid: missingFields.length === 0,
        missingFields,
        completionPercentage: profile.completionPercentage,
        message: missingFields.length === 0
          ? 'Profile is complete. You can apply for internships.'
          : `Please complete the following fields: ${missingFields.join(', ')} `
      };
    },

    // Enhanced application with profile validation
    applyToInternshipWithValidation: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');


      // Profile completion check removed - users can fill missing fields in application form
      // const profile = await StudentProfile.findOne({ userId: context.user.id });
      // if (!profile || !profile.isComplete) {
      //   throw new Error('PROFILE_INCOMPLETE: Please complete your student profile before applying. Required: school, education level, field of study, skills, and availability.');
      // }

      // Check if already applied
      const existingApp = await InternshipApplication.findOne({
        userId: context.user.id,
        internshipProgramId: args.internshipProgramId,
        isDeleted: false
      });
      if (existingApp) throw new Error('You have already applied to this program.');

      // Check if program is open for applications
      const program = await InternshipProgram.findById(args.internshipProgramId);
      if (!program || program.isDeleted) throw new Error('Program not found.');
      if (program.status !== 'active') throw new Error('This program is not accepting applications.');
      if (new Date() > new Date(program.applicationDeadline)) throw new Error('Application deadline has passed.');

      // Create application
      const application = new InternshipApplication({
        userId: context.user.id,
        internshipProgramId: args.internshipProgramId,
        skills: args.skills,
        availability: args.availability,
        portfolioUrl: args.portfolioUrl,
        status: 'pending'
      });
      await application.save();

      // If program is paid, create a pending payment record so it can be added to cart
      if (program.price && program.price > 0) {
        const existingPayment = await InternshipPayment.findOne({
          userId: context.user.id,
          internshipProgramId: program.id,
          isDeleted: { $ne: true }
        });

        if (!existingPayment) {
          const payment = new InternshipPayment({
            userId: context.user.id,
            internshipProgramId: program.id,
            amount: program.price,
            currency: program.currency || 'RWF',
            status: 'pending'
          });
          await payment.save();
        }
      }

      await logActivity(context.user.id, 'APPLY', 'InternshipApplication', application.id, `Applied to program: ${program.title} `);

      return application;
    },

    // ========== PAYMENT MUTATIONS ==========
    createInternshipPayment: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Check if payment already exists
      const existing = await InternshipPayment.findOne({
        userId: context.user.id,
        internshipProgramId: args.internshipProgramId,
        isDeleted: false
      });
      if (existing) throw new Error('Payment record already exists for this program.');

      const program = await InternshipProgram.findById(args.internshipProgramId);
      if (!program) throw new Error('Program not found.');

      const payment = new InternshipPayment({
        userId: context.user.id,
        internshipProgramId: args.internshipProgramId,
        amount: args.amount,
        currency: args.currency || 'RWF',
        status: 'pending'
      });
      await payment.save();
      await logActivity(context.user.id, 'CREATE', 'InternshipPayment', payment.id, `Created payment for ${program.title}`);

      return payment;
    },

    processInternshipPayment: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const payment = await (InternshipPayment as any).findById(args.paymentId);
      if (!payment) throw new Error('Payment not found.');
      if (payment.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      if (payment.status !== 'pending') throw new Error(`Payment cannot be processed. Current status: ${payment.status}`);

      payment.paymentMethod = args.paymentMethod;

      if (args.paymentMethod === 'manual_transfer') {
        payment.paymentProofUrl = args.paymentProofUrl;
        // Keep status as pending for admin review — internship created after admin verifies
      } else {
        payment.status = 'paid';
        payment.transactionId = args.transactionId;
        payment.paidAt = new Date();

        // Create Internship enrollment record now that payment is confirmed
        const program = await InternshipProgram.findById(payment.internshipProgramId);
        if (program) {
          const existingInternship = await Internship.findOne({
            userId: payment.userId,
            title: program.title,
            isDeleted: false
          });
          if (!existingInternship) {
            const newInternship = new Internship({
              userId: payment.userId,
              title: program.title || 'Internship Program',
              duration: program.duration || '3 Months',
              type: 'Online',
              status: 'enrolled',
              progress: 0,
              payment: {
                amount: payment.amount,
                currency: payment.currency,
                status: 'paid'
              }
            });
            await newInternship.save();
            await logActivity(context.user.id, 'CREATE', 'Internship', newInternship.id, `Internship enrollment created after payment for: ${program.title}`);
          }
        }
      }

      await payment.save();

      await logActivity(context.user.id, 'UPDATE', 'InternshipPayment', payment.id, `Payment processed via ${args.paymentMethod}: ${args.transactionId || 'Proof submitted'}`);

      // Notify admin
      sendNotification('admin', {
        type: 'PAYMENT_RECEIVED',
        title: args.paymentMethod === 'manual_transfer' ? 'New Payment Proof Submitted' : 'New Payment Received',
        userId: payment.userId.toString(),
        amount: payment.amount,
        currency: payment.currency,
        message: args.paymentMethod === 'manual_transfer'
          ? `A student submitted payment proof for ${payment.amount} ${payment.currency}`
          : `New internship payment received — enrollment confirmed`
      });

      // Notify student about proof submission (manual transfer)
      if (args.paymentMethod === 'manual_transfer') {
        sendNotification(payment.userId.toString(), {
          type: 'PAYMENT_PROOF_SUBMITTED',
          title: 'Payment Proof Submitted',
          message: `Your payment proof has been submitted. Our team will verify it within 24 hours.`
        });
      }

      return payment;
    },

    waiveInternshipPayment: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const payment = await InternshipPayment.findById(args.paymentId);
      if (!payment) throw new Error('Payment not found.');
      if (payment.status !== 'pending') throw new Error(`Cannot waive payment.Current status: ${payment.status} `);

      payment.status = 'waived';
      payment.waivedBy = context.user.id;
      payment.waivedReason = args.reason;
      await payment.save();

      await logActivity(context.user.id, 'WAIVE', 'InternshipPayment', payment.id, `Payment waived: ${args.reason} `);

      // Notify student
      sendNotification(payment.userId.toString(), {
        type: 'PAYMENT_WAIVED',
        title: 'Payment Waived',
        message: `Your internship payment has been waived.You can now proceed with the program.`
      });

      return payment;
    },

    refundInternshipPayment: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const payment = await InternshipPayment.findById(args.paymentId);
      if (!payment) throw new Error('Payment not found.');
      if (payment.status !== 'paid') throw new Error(`Cannot refund.Current status: ${payment.status} `);

      payment.status = 'refunded';
      payment.notes = args.reason;
      await payment.save();

      await logActivity(context.user.id, 'REFUND', 'InternshipPayment', payment.id, `Payment refunded: ${args.reason} `);

      // Notify student
      sendNotification(payment.userId.toString(), {
        type: 'PAYMENT_REFUNDED',
        title: 'Payment Refunded',
        amount: payment.amount,
        currency: payment.currency,
        message: `Your internship payment has been refunded.`
      });

      return payment;
    },

    // ========== INVOICE MUTATIONS ==========
    generateInternshipInvoice: async (_: any, { paymentId }: { paymentId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const payment = await InternshipPayment.findById(paymentId);
      if (!payment) throw new Error('Payment not found.');
      if (payment.userId.toString() !== context.user.id && !['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Unauthorized');
      }

      // Check if invoice already exists
      const existing = await InternshipInvoice.findOne({ paymentId, isDeleted: false });
      if (existing) return existing;

      const program = await InternshipProgram.findById(payment.internshipProgramId);

      const invoice = new InternshipInvoice({
        paymentId,
        userId: payment.userId,
        internshipProgramId: payment.internshipProgramId,
        amount: payment.amount,
        currency: payment.currency,
        issuedAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'issued',
        items: [{
          description: `Internship Program: ${program?.title || 'Unknown'} `,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount
        }]
      });
      await invoice.save();

      // Update payment with invoice reference
      payment.invoiceId = invoice.id as any;
      await payment.save();

      await logActivity(context.user.id, 'CREATE', 'InternshipInvoice', invoice.id, `Generated invoice: ${invoice.invoiceNumber} `);

      return invoice;
    },

    // ========== CERTIFICATE MUTATIONS ==========
    checkCertificateEligibility: async (_: any, { teamId }: { teamId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      // Get team and project info
      const team = await InternshipTeam.findById(teamId);
      if (!team) throw new Error('Team not found.');

      // Check if user is member of team
      const membership = await InternshipTeamMember.findOne({
        teamId,
        userId: context.user.id,
        isDeleted: false
      });
      if (!membership && context.user.role !== 'admin') throw new Error('You are not a member of this team.');

      // 1. Check all milestones completed
      const project = await InternshipProject.findById(team.internshipProjectId);
      const milestones = await InternshipMilestone.find({ internshipProjectId: project?.id, isDeleted: false });
      const submissions = await InternshipSubmission.find({ teamId, userId: context.user.id, status: 'approved', isDeleted: false });
      const completedMilestoneIds = submissions.map((s: any) => s.milestoneId.toString());
      const allMilestonesCompleted = milestones.every((m: any) => completedMilestoneIds.includes(m.id.toString()));

      // 2. Check trainer approval
      const feedback = await InternshipMentorFeedback.findOne({
        userId: context.user.id,
        teamId,
        isDeleted: false
      });
      const trainerApproved = feedback && (feedback as any).score >= 70;

      // 3. Check payment status
      const payment = await InternshipPayment.findOne({
        userId: context.user.id,
        internshipProgramId: team.internshipProgramId,
        isDeleted: false
      });
      const program = await InternshipProgram.findById(team.internshipProgramId) as any; // Cast so we can access price
      const isFreeProgram = !program?.price || program.price === 0;
      const paymentConfirmed = isFreeProgram || (payment && ['paid', 'waived'].includes(payment.status));

      const isEligible = allMilestonesCompleted && trainerApproved && paymentConfirmed;

      let message = isEligible
        ? 'You are eligible for certification!'
        : 'You are not yet eligible for certification.';

      if (!allMilestonesCompleted) message += ' Complete all milestones.';
      if (!trainerApproved) message += ' Obtain trainer approval.';
      if (!paymentConfirmed) message += ' Confirm payment.';

      return {
        isEligible,
        milestonesCompleted: allMilestonesCompleted,
        trainerApproved: !!trainerApproved,
        paymentConfirmed: !!paymentConfirmed,
        message
      };
    },

    generateInternshipCertificate: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new Error('Unauthorized');

      const { userId, teamId, trainerId } = args;

      // Check eligibility first
      const team = await InternshipTeam.findById(teamId);
      if (!team) throw new Error('Team not found.');

      const program = await InternshipProgram.findById(team.internshipProgramId);
      if (!program) throw new Error('Program not found.');

      const trainer = await User.findById(trainerId);
      if (!trainer) throw new Error('Trainer not found.');

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found.');

      // Check if certificate already exists
      const existing = await InternshipCertificate.findOne({
        userId,
        internshipProgramId: team.internshipProgramId,
        isDeleted: false
      });
      if (existing) throw new Error('Certificate already exists for this user and program.');

      // Get completion metadata
      const milestones = await InternshipMilestone.find({ internshipProjectId: team.internshipProjectId, isDeleted: false });
      const submissions = await InternshipSubmission.find({ teamId, userId, status: 'approved', isDeleted: false });
      const feedback = await InternshipMentorFeedback.findOne({ userId, teamId, isDeleted: false });

      const certificate = new InternshipCertificate({
        userId,
        internshipProgramId: team.internshipProgramId,
        teamId,
        trainerId,
        trainerName: (trainer as any).username || 'Unknown Trainer',
        internTitle: `${program.title} Intern`,
        programTitle: program.title,
        duration: program.duration,
        startDate: program.startDate,
        endDate: program.endDate,
        completionDate: new Date(),
        issuedAt: new Date(),
        metadata: {
          milestonesCompleted: submissions.length,
          totalMilestones: milestones.length,
          finalGrade: (feedback as any)?.score ? `${(feedback as any).score}% ` : 'N/A',
          skills: Array.isArray(program.eligibility) ? program.eligibility : (program.eligibility ? [program.eligibility] : [])
        }
      });
      await certificate.save();

      await logActivity(context.user.id, 'CREATE', 'InternshipCertificate', certificate.id, `Generated certificate for ${(user as any).username}`);

      // Notify student
      sendNotification(userId, {
        type: 'CERTIFICATE_READY',
        title: 'Certificate Ready',
        certificateId: certificate.id,
        certificateNumber: certificate.certificateNumber,
        message: `Congratulations! Your certificate for ${program.title} is ready for download.`
      });

      // Send certificate issued email
      try {
        if (user?.email) {
          const baseUrl = process.env.FRONTEND_URL || 'https://ihub.ac.rw';
          await sendCertificateIssued(
            user.email,
            (user as any).fullName || user.username || 'Student',
            program.title,
            certificate.certificateNumber || '',
            `${baseUrl}/verify-certificate?code=${certificate.certificateNumber}`
          );
        }
      } catch (emailErr) {
        console.error('[GenerateInternshipCertificate] Email error:', emailErr);
      }

      return certificate;
    },

    revokeCertificate: async (_: any, args: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const certificate = await InternshipCertificate.findById(args.certificateId);
      if (!certificate) throw new Error('Certificate not found.');
      if (certificate.isRevoked) throw new Error('Certificate is already revoked.');

      certificate.isRevoked = true;
      certificate.revokedAt = new Date();
      certificate.revokedBy = context.user.id;
      certificate.revocationReason = args.reason;
      await certificate.save();

      await logActivity(context.user.id, 'REVOKE', 'InternshipCertificate', certificate.id, `Certificate revoked: ${args.reason} `);

      // Notify student
      sendNotification(certificate.userId.toString(), {
        type: 'CERTIFICATE_REVOKED',
        title: 'Certificate Revoked',
        certificateNumber: certificate.certificateNumber,
        message: `Your certificate ${certificate.certificateNumber} has been revoked.Reason: ${args.reason} `
      });

      return certificate;
    },

    approveMilestone: async (_: any, args: any, context: any) => {
      if (context.user?.role !== 'trainer' && !['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const milestone = await InternshipMilestone.findById(args.milestoneId);
      if (!milestone) throw new Error('Milestone not found.');

      // This would typically update submission status rather than milestone itself
      await logActivity(context.user.id, 'APPROVE', 'InternshipMilestone', milestone.id, `Milestone approved for team ${args.teamId}`);

      return milestone;
    },

    approveInternForCertificate: async (_: any, args: any, context: any) => {
      if (context.user?.role !== 'trainer' && !['admin', 'super_admin'].includes(context.user?.role)) throw new Error('Unauthorized');

      const { userId, teamId, finalGrade } = args;

      // Check if feedback already exists
      let feedback = await InternshipMentorFeedback.findOne({ userId, teamId, mentorId: context.user.id, isDeleted: false });

      if (feedback) {
        (feedback as any).score = parseInt(finalGrade) || 100;
        (feedback as any).comments = 'Approved for certification';
        await feedback.save();
      } else {
        feedback = new InternshipMentorFeedback({
          mentorId: context.user.id,
          userId,
          teamId,
          score: parseInt(finalGrade) || 100,
          comments: 'Approved for certification'
        });
        await feedback.save();
      }

      await logActivity(context.user.id, 'APPROVE', 'InternshipMentorFeedback', (feedback as any).id, `Approved intern ${userId} for certification with grade ${finalGrade} `);

      // Notify student
      sendNotification(userId, {
        type: 'CERTIFICATE_APPROVAL',
        title: 'Certificate Approved',
        message: `Your trainer has approved you for certification with grade: ${finalGrade}% `
      });

      return feedback;
    },

    createStripePaymentIntent: async (_: any, { programId }: { programId: string }, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const program = await InternshipProgram.findById(programId);
      if (!program) throw new Error('Program not found');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      // Check for existing payment
      let payment = await InternshipPayment.findOne({
        userId: user.id,
        internshipProgramId: (program as any).id || (program as any)._id,
        isDeleted: { $ne: true }
      });

      if (payment && payment.status === 'paid') {
        throw new Error('This program has already been paid for.');
      }

      const anyUser = user as any;
      const customerName = anyUser.fullName || anyUser.username || 'Student';

      const result = await createPaymentIntent({
        amount: program.price,
        currency: program.currency || 'RWF',
        userId: user.id,
        programId: (program as any).id || (program as any)._id,
        programTitle: program.title,
        customerEmail: user.email,
        customerName
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment intent');
      }

      // Create or update pending payment record
      if (!payment) {
        payment = new InternshipPayment({
          userId: user.id,
          internshipProgramId: (program as any).id || (program as any)._id,
          amount: program.price,
          currency: program.currency || 'RWF',
          status: 'pending',
          transactionId: result.paymentIntentId
        });
      } else {
        payment.transactionId = result.paymentIntentId;
        payment.amount = program.price;
      }
      await payment.save();

      return {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        paymentId: payment.id
      };
    },
    ...applicationPhaseResolvers.Mutation,
    ...projectTaskResolvers.Mutation,    ...locationResolvers.Mutation,    ...commissionResolvers.Mutation,    ...disbursementResolvers.Mutation,    ...scholarshipResolvers.Mutation,    ...broadcastResolvers.Mutation,    ...uploadLogResolvers.Mutation,    ...scheduledBroadcastResolvers.Mutation,    ...refundResolvers.Mutation,

    assignDeveloperToProject: async (_: any, { projectId, developerId, role, checklistTasks }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const { ProjectOnboarding } = require('../models/ProjectOnboarding');
      const existing = await ProjectOnboarding.findOne({ projectId, developerId });
      if (existing) throw new Error('Developer already assigned to this project');
      const onboarding = new ProjectOnboarding({
        projectId,
        developerId,
        role,
        status: 'onboarding',
        checklist: checklistTasks.map((task: string) => ({ task, completed: false })),
      });
      await onboarding.save();
      return await onboarding.populate('developerId');
    },

    updateOnboardingChecklist: async (_: any, { onboardingId, taskIndex, completed }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const { ProjectOnboarding } = require('../models/ProjectOnboarding');
      const onboarding = await ProjectOnboarding.findById(onboardingId);
      if (!onboarding) throw new Error('Onboarding record not found');
      if (!onboarding.checklist || !onboarding.checklist[taskIndex]) {
        throw new Error('Task not found');
      }
      onboarding.checklist[taskIndex].completed = completed;
      onboarding.checklist[taskIndex].completedAt = completed ? new Date() : undefined;
      const allComplete = onboarding.checklist.every((t: any) => t.completed);
      onboarding.status = allComplete ? 'completed' : 'onboarding';
      await onboarding.save();
      return await onboarding.populate('developerId');
    },

    reviewProjectApplication: async (_: any, { applicationId, status, notes }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const { ProjectLifecycleService } = require('../services/project-lifecycle.service');
      await ProjectLifecycleService.reviewApplication(applicationId, context.user.id, status, notes);
      return await ProjectApplication.findById(applicationId).populate('clientId');
    },

    initializeProjectFromApplication: async (_: any, { applicationId, course, mentorIds }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const app = await ProjectApplication.findById(applicationId).populate('clientId');
      if (!app) throw new Error('Application not found');

      const { Project } = require('../models/Project');
      const project = new Project({
        userId: (app.clientId as any)?._id || app.clientId,
        title: app.title,
        description: app.description,
        course,
        type: 'Individual',
        status: 'in_progress',
        mentors: mentorIds,
        progress: 0,
      });
      await project.save();
      return project;
    },

    submitProjectApplication: async (_: any, { title, description, documents, assignedAdminId }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const app = new ProjectApplication({
        clientId: context.user.id,
        title,
        description,
        assignedAdmin: assignedAdminId || undefined,
        requiredDocuments: {
          overviewUrl: documents?.overviewUrl,
          featuresUrl: documents?.featuresUrl,
          technicalUrl: documents?.technicalUrl,
        },
        status: 'submitted',
      });
      await app.save();
      return await app.populate('clientId');
    },

    claimProjectApplication: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Unauthorized');
      }
      const app = await ProjectApplication.findById(applicationId);
      if (!app) throw new Error('Application not found');
      if (app.assignedAdmin && app.assignedAdmin.toString() !== context.user.id) {
        throw new Error('This application is already assigned to another admin');
      }
      app.assignedAdmin = context.user.id;
      await app.save();
      return await ProjectApplication.findById(applicationId).populate('clientId');
    },

    submitClientEvaluation: async (_: any, { projectId, rating, comment }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const { ProjectLifecycleService } = require('../services/project-lifecycle.service');
      return await ProjectLifecycleService.submitClientEvaluation(projectId, context.user.id, rating, comment);
    },

    signProjectNDA: async (_: any, { applicationId, signerName }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const { ProjectLifecycleService } = require('../services/project-lifecycle.service');
      const ipAddress = context.req?.ip || context.req?.headers?.['x-forwarded-for'] || '127.0.0.1';
      await ProjectLifecycleService.signNDA(applicationId, signerName, ipAddress);
      const app = await ProjectApplication.findById(applicationId).populate('clientId');
      if (!app) throw new Error('Application not found');
      const obj = app.toObject();
      return {
        ...obj,
        id: app._id.toString(),
        clientId: app.clientId?._id?.toString() || app.clientId?.toString(),
        ndaSigned: app.ndaSigned,
        signerName: app.signerName,
        signedAt: app.signedAt?.toISOString(),

      };
    },

    // ─── Project Stage Mutations ────────────────────────────────────────
    addProjectStage: async (_: any, { projectId, name, description, order, dueDate }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');

      if (!project.stages) project.stages = [];
      project.stages.push({
        name,
        description,
        order,
        status: 'pending',
        completed: false,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      await project.save();
      return project;
    },

    updateProjectStage: async (_: any, { projectId, order, name, description, status, assigneeId, dueDate }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');
      if (!project.stages || project.stages.length === 0) throw new Error('No stages found');

      const stage = project.stages.find((s: any) => s.order === order);
      if (!stage) throw new Error("Stage with order " + order + " not found");

      if (name !== undefined) stage.name = name;
      if (description !== undefined) stage.description = description;
      if (status !== undefined) {
        stage.status = status;
        if (status === 'completed') {
          stage.completed = true;
          stage.completedAt = new Date();
        }
      }
      if (assigneeId !== undefined) stage.assigneeId = assigneeId;
      if (dueDate !== undefined) stage.dueDate = new Date(dueDate);

      await project.save();
      return project;
    },

    assignProjectStage: async (_: any, { projectId, order, assigneeId }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');
      if (!project.stages || project.stages.length === 0) throw new Error('No stages found');

      const stage = project.stages.find((s: any) => s.order === order);
      if (!stage) throw new Error("Stage with order " + order + " not found");

      stage.assigneeId = assigneeId;
      await project.save();
      return project;
    },

    completeProjectStage: async (_: any, { projectId, order }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');
      if (!project.stages || project.stages.length === 0) throw new Error('No stages found');

      const stage = project.stages.find((s: any) => s.order === order);
      if (!stage) throw new Error("Stage with order " + order + " not found");

      stage.status = 'completed';
      stage.completed = true;
      stage.completedAt = new Date();
      await project.save();

      // ── Auto Dev Onboarding ──────────────────────────────────────────────
      // After the last stage is completed, flag project and create onboarding
      const allStagesCompleted = project.stages.every((s: any) => s.completed === true);
      if (allStagesCompleted && project.userId) {
        const { ProjectOnboarding } = require('../models/ProjectOnboarding');

        // Set project status to onboarding
        project.status = 'onboarding';
        await project.save();

        // Create onboarding record for the project owner
        const existingOnboarding = await ProjectOnboarding.findOne({ projectId, developerId: project.userId });
        if (!existingOnboarding) {
          const onboarding = new ProjectOnboarding({
            projectId,
            developerId: project.userId,
            role: 'developer',
            status: 'active',
            checklistTasks: [],
          });
          await onboarding.save();
        }

        // Notify all super_admins and the project owner
        const admins = await User.find({ role: 'super_admin' });
        const adminIds = admins.map((a: any) => a._id.toString());
        const uniqueTargets = [...new Set([...adminIds, project.userId.toString()])];

        for (const userId of uniqueTargets) {
          sendNotification(userId, {
            type: 'PROJECT_READY_FOR_ONBOARDING',
            title: 'Project Ready for Developer Onboarding',
            message: `All stages for project "${project.title || 'Untitled'}" are completed. The developer is ready for onboarding.`,
            link: `/portal/admin/project-onboarding?projectId=${projectId}`,
          });
        }

        // ── Auto Create Onboarding Meeting ─────────────────────────────────
        // Schedule a project onboarding meeting for 2 days from now
        const meetingDate = new Date();
        meetingDate.setDate(meetingDate.getDate() + 2);
        const dateStr = meetingDate.toISOString().split('T')[0];
        const timeStr = '10:00';

        // Check for existing booking to avoid duplicates
        const existingBooking = await Booking.findOne({
          userId: project.userId,
          type: 'project_onboarding',
          date: dateStr,
        });
        if (!existingBooking) {
          const booking = new Booking({
            userId: project.userId,
            mentorId: context.user.id,
            type: 'project_onboarding',
            date: dateStr,
            time: timeStr,
            topic: `Project Onboarding - ${project.title || 'Untitled'}`,
            notes: `All project stages completed. Meeting to discuss developer onboarding and next steps for project "${project.title || 'Untitled'}".`,
            status: 'confirmed',
            deliveryMode: 'online',
          });
          await booking.save();
        }

        // Notify the project owner about the scheduled meeting (always send)
        sendNotification(project.userId.toString(), {
          type: 'MEETING_SCHEDULED',
          title: 'Onboarding Meeting Scheduled',
          message: `An onboarding meeting has been scheduled for ${dateStr} at ${timeStr} to discuss the completed project and next steps.`,
          link: `/portal/student/schedule`,
        });

        // Also create bookings for each mentor/trainer assigned to the project
        if (project.mentors && project.mentors.length > 0) {
          for (const mentorId of project.mentors) {
            const mentorExists = await User.findById(mentorId);
            if (mentorExists) {
              // Check for existing mentor booking to avoid duplicates
              const existingMentorBooking = await Booking.findOne({
                userId: project.userId,
                mentorId: mentorId.toString(),
                type: 'project_onboarding',
                date: dateStr,
              });
              if (!existingMentorBooking) {
                const mentorBooking = new Booking({
                  userId: project.userId,
                  mentorId: mentorId.toString(),
                  type: 'project_onboarding',
                  date: dateStr,
                  time: timeStr,
                  topic: `Project Onboarding - ${project.title || 'Untitled'}`,
                  notes: `Onboarding meeting for project "${project.title || 'Untitled'}". Trainer ${mentorExists.fullName || mentorExists.username} is invited.`,
                  status: 'confirmed',
                  deliveryMode: 'online',
                });
                await mentorBooking.save();
              }

              sendNotification(mentorId.toString(), {
                type: 'MEETING_SCHEDULED',
                title: 'Onboarding Meeting Invitation',
                message: `You are invited to an onboarding meeting for project "${project.title || 'Untitled'}" on ${dateStr} at ${timeStr}.`,
                link: `/portal/trainer/projects`,
              });
            }
          }
        }
      }

      return project;
    },

    removeProjectStage: async (_: any, { projectId, order }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin', 'trainer'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');
      if (!project.stages || project.stages.length === 0) throw new Error('No stages found');

      project.stages = project.stages.filter((s: any) => s.order !== order);
      await project.save();
      return project;
    },
    ...errorReportResolvers.Mutation,
    ...meetingAttendanceResolvers.Mutation,
  },
  User: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
    streak: async (parent: any) => {
      if (parent.academicStatus === 'active' || parent.role === 'student') {
        return Math.min((parent.level || 1) * 3 + Math.floor(Math.random() * 3), 100);
      }
      return 0;
    },
    fullName: (parent: any) => parent.fullName || parent.username,
    enrolledCourses: async (parent: any) => {
      if (parent.enrolledCourses && parent.enrolledCourses.length > 0 && (parent.enrolledCourses[0] as any).title) return parent.enrolledCourses;
      const user = await User.findById(parent.id || parent._id).populate('enrolledCourses');
      return user?.enrolledCourses || [];
    },
    completedCourses: async (parent: any) => {
      if (parent.completedCourses && parent.completedCourses.length > 0 && (parent.completedCourses[0] as any).title) return parent.completedCourses;
      const user = await User.findById(parent.id || parent._id).populate('completedCourses');
      return user?.completedCourses || [];
    },
    badges: async (parent: any) => {
      if (parent.badges && parent.badges.length > 0 && (parent.badges[0] as any).badgeId && (parent.badges[0] as any).badgeId.title) return parent.badges;
      const user = await User.findById(parent.id || parent._id).populate('badges.badgeId');
      return user?.badges || [];
    },
    bookings: async (parent: any) => {
      return await Booking.find({ userId: parent.id || parent._id }).populate('mentorId').sort({ createdAt: -1 });
    },
    completedLessons: async (parent: any) => {
      // Fetch progress from CourseProgress model for accuracy
      const progressDocs = await CourseProgress.find({ userId: parent.id || parent._id });

      const completed: any[] = [];
      progressDocs.forEach((doc: any) => {
        if (doc.lessons) {
          doc.lessons.forEach((lesson: any) => {
            if (lesson.completed) {
              completed.push({
                courseId: doc.courseId.toString(),
                lessonId: lesson.lessonId
              });
            }
          });
        }
      });
      // Fallback to User model's completedLessons if CourseProgress is empty but User has data
      if (completed.length === 0 && parent.completedLessons && parent.completedLessons.length > 0) {
        return parent.completedLessons;
      }

      return completed;
    },
    certificates: async (parent: any) => {
      return await Certificate.find({ userId: parent.id || parent._id }).populate('courseId');
    },
    studentProfile: async (parent: any) => await StudentProfile.findOne({ userId: parent.id || parent._id }),
    isExternal: (parent: any, _: any, context: any) => {
      if (!context.user || !context.user.school || !parent.school) return false;
      return parent.school !== context.user.school;
    }
  },
  Booking: {
    user: async (parent: any) => {
      if (parent.userId && (parent.userId as any).username) return parent.userId;
      return await User.findById(parent.userId);
    },
    mentor: async (parent: any) => {
      if (parent.mentorId && (parent.mentorId as any).username) return parent.mentorId;
      if (!parent.mentorId) return null;
      return await User.findById(parent.mentorId);
    }
  },
  Project: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
    stages: async (parent: any, _: any, context: any) => {
      if (!parent.stages || parent.stages.length === 0) return [];
      const populatedStages = await Promise.all(
        parent.stages.map(async (stage: any) => {
          if (stage.assigneeId) {
            const user = await User.findById(stage.assigneeId).select('id username fullName avatar');
            return {
              ...stage.toObject ? stage.toObject() : stage,
              assignee: user,
            };
          }
          return stage.toObject ? stage.toObject() : stage;
        })
      );
      return populatedStages;
    },
    userId: (parent: any) => {
      if (!parent.userId) return null;
      return (parent.userId as any)._id || parent.userId;
    },
    user: async (parent: any) => {
      if (parent.userId && (parent.userId as any).username) return parent.userId;
      return await User.findById(parent.userId);
    },
    mentors: async (parent: any) => {
      if (parent.mentors && parent.mentors.length > 0 && (parent.mentors[0] as any).username) return parent.mentors;
      return await User.find({ _id: { $in: parent.mentors || [] } });
    }
  },
  TeamMember: {
    userId: (parent: any) => {
      if (!parent.userId) return null;
      return (parent.userId as any)._id || parent.userId;
    },
    user: async (parent: any) => {
      if (!parent.userId) return null;
      if ((parent.userId as any).username) return parent.userId;
      return await User.findById(parent.userId);
    }
  },
  Certificate: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
    userId: (parent: any) => {
      if (!parent.userId) return null;
      return (parent.userId as any)._id || parent.userId;
    },
    user: async (parent: any) => {
      if (parent.userId && (parent.userId as any).username) return parent.userId;
      return await User.findById(parent.userId);
    },
    course: async (parent: any) => {
      if (!parent.courseId) return null;
      if ((parent.courseId as any).title) return parent.courseId;
      return await Course.findById(parent.courseId);
    }
  },
  Internship: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
    user: async (parent: any) => {
      if (parent.userId && (parent.userId as any).username) return parent.userId;
      return await User.findById(parent.userId);
    },
    mentor: async (parent: any) => {
      if (parent.mentorId && (parent.mentorId as any).username) return parent.mentorId;
      return await User.findById(parent.mentorId);
    },
    mentors: async (parent: any) => {
      if (parent.mentors && parent.mentors.length > 0 && (parent.mentors[0] as any).username) return parent.mentors;
      return await User.find({ _id: { $in: parent.mentors || [] } });
    },
    projects: async (parent: any) => await Project.find({ _id: { $in: parent.projects } }),
    assignedProject: async (parent: any) => {
      // Find the team member entry for this user
      const membership = await InternshipTeamMember.findOne({ userId: parent.userId, isDeleted: false });
      if (!membership) return null;

      const team = await InternshipTeam.findById(membership.teamId);
      if (!team || !team.internshipProjectId) return null;

      return await InternshipProject.findById(team.internshipProjectId);
    }
  },
  Message: {
    sender: async (parent: any) => {
      if (parent.sender && (parent.sender as any).username) return parent.sender;
      return await User.findById(parent.sender);
    }
  },
  Conversation: {
    participants: async (parent: any) => {
      if (parent.participants && parent.participants.length > 0 && (parent.participants[0] as any).username) return parent.participants;
      return await User.find({ _id: { $in: parent.participants } });
    },
    lastMessage: async (parent: any) => {
      if (parent.lastMessage && (parent.lastMessage as any).content) return parent.lastMessage;
      return await Message.findById(parent.lastMessage);
    }
  },
  Grade: {
    lesson: async (parent: any) => {
      if (!parent.courseId || !parent.lessonId) return null;
      const course = await Course.findById(parent.courseId);
      if (!course) return null;
      const allLessons = course.modules.flatMap((m: any) => m.lessons);
      return allLessons.find((l: any) => (l.id || l._id).toString() === parent.lessonId);
    },
    gradedBy: async (parent: any) => {
      if (!parent.gradedBy) return { username: 'AI Tutor', fullName: 'Ihub AI' };
      return await User.findById(parent.gradedBy);
    }
  },

  AssignmentSubmission: {
    user: async (parent: any) => {
      if (parent.user && parent.user.username) return parent.user;
      if (!parent.userId) return null;
      return await User.findById(parent.userId);
    },
    course: async (parent: any) => {
      if (parent.course && parent.course.title) return parent.course;
      if (!parent.courseId) {
        // Fallback: Try to find a course that contains this lessonId
        if (parent.lessonId) {
          const course = await Course.findOne({ 'modules.lessons._id': parent.lessonId });
          if (course) return course;
        }
        return null;
      }
      return await Course.findById(parent.courseId);
    },
    lesson: async (parent: any) => {
      let course = parent.course && parent.course.modules ? parent.course : null;

      if (!course && parent.courseId) {
        course = await Course.findById(parent.courseId);
      }

      // Secondary fallback if still no course: search all courses for this lessonId
      if (!course && parent.lessonId) {
        course = await Course.findOne({ 'modules.lessons._id': parent.lessonId });
      }

      if (!course || !course.modules) return null;

      for (const mod of course.modules) {
        const lesson = mod.lessons.find((l: any) =>
          l.id?.toString() === parent.lessonId?.toString() ||
          l._id?.toString() === parent.lessonId?.toString() ||
          l.lessonId?.toString() === parent.lessonId?.toString()
        );
        if (lesson) return lesson;
      }
      return null;
    }
  },
  Course: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
    instructor: async (parent: any) => {
      if (!parent.instructor) return null;

      // If already populated
      if (typeof parent.instructor === 'object' && parent.instructor.username) {
        return parent.instructor;
      }

      // If it's an ID (possibly a Buffer)
      const instId = parent.instructor.toString();

      // Special case for the "Global Trainer" sequence mentioned by user
      if (instId.startsWith('6534ab')) {
        return {
          id: instId,
          username: 'globel trainer',
          fullName: 'Global Trainer',
          role: 'trainer',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=global'
        };
      }

      return await User.findById(parent.instructor);
    },
    descriptionSnippet: (parent: any) => {
      if (!parent.description) return null;
      const stripped = parent.description.replace(/<[^>]*>/g, '');
      return stripped.length > 120 ? stripped.slice(0, 120) + '...' : stripped;
    },
    modulesCount: (parent: any) => {
      return parent.modules?.length || 0;
    },
    totalLessonsCount: (parent: any) => {
      if (!parent.modules) return 0;
      return parent.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
    },
    studentsEnrolledCount: (parent: any) => {
      return parent.studentsEnrolled?.length || 0;
    },
  },
  Module: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
  },
  Lesson: {
    id: (parent: any) => parent.id || parent._id || parent.toString(),
  },
  InternshipProgram: {
    id: (parent: any) => parent.id || parent._id,
    stats: async (parent: any) => {
      const [
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        enrolledStudents,
        payments
      ] = await Promise.all([
        InternshipApplication.countDocuments({ internshipProgramId: parent.id, isDeleted: false }),
        InternshipApplication.countDocuments({ internshipProgramId: parent.id, status: 'approved', isDeleted: false }),
        InternshipApplication.countDocuments({ internshipProgramId: parent.id, status: 'rejected', isDeleted: false }),
        InternshipApplication.countDocuments({ internshipProgramId: parent.id, status: 'pending', isDeleted: false }),
        Internship.countDocuments({ internshipProgramId: parent.id, status: { $in: ['enrolled', 'in_progress'] } }),
        InternshipPayment.find({ internshipProgramId: parent.id, status: 'paid', isDeleted: false })
      ]);

      const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

      return {
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        enrolledStudents,
        totalRevenue
      };
    }
  },
  InternshipApplication: {
    id: (parent: any) => parent.id || parent._id,
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    user: async (parent: any) => await User.findById(parent.userId),
    payment: async (parent: any) => await InternshipPayment.findOne({
      userId: parent.userId,
      internshipProgramId: parent.internshipProgramId,
      isDeleted: false
    }),
  },
  InternshipProject: {
    id: (parent: any) => parent.id || parent._id,
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    milestones: async (parent: any) => await InternshipMilestone.find({ internshipProjectId: parent._id, isDeleted: false }).sort({ order: 1 }),
    teamSizeRange: (parent: any) => parent.teamSizeRange || { min: 1, max: 10 },
  },
  InternshipTeam: {
    id: (parent: any) => parent.id || parent._id,
    internshipProject: async (parent: any) => await InternshipProject.findById(parent.internshipProjectId),
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    mentor: async (parent: any) => await User.findById(parent.mentorId),
    members: async (parent: any) => await InternshipTeamMember.find({ teamId: parent._id, isDeleted: false }),
  },
  InternshipTeamMember: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
  },
  InternshipTask: {
    id: (parent: any) => parent.id || parent._id,
    assignee: async (parent: any) => parent.assigneeId ? await User.findById(parent.assigneeId) : null,
    comments: async (parent: any) => await InternshipComment.find({ taskId: parent._id, isDeleted: false }).sort({ createdAt: -1 }),
  },
  InternshipComment: {
    id: (parent: any) => parent.id || parent._id,
    author: async (parent: any) => await User.findById(parent.authorId),
  },
  InternshipSubmission: {
    id: (parent: any) => parent.id || parent._id,
    milestone: async (parent: any) => await InternshipMilestone.findById(parent.milestoneId),
    team: async (parent: any) => await InternshipTeam.findById(parent.teamId),
    user: async (parent: any) => await User.findById(parent.userId),
  },
  InternshipTimeLog: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
  },
  InternshipMentorFeedback: {
    id: (parent: any) => parent.id || parent._id,
    mentor: async (parent: any) => await User.findById(parent.mentorId),
    user: async (parent: any) => await User.findById(parent.userId),
  },
  InternshipActivityLog: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
  },
  // New Type Resolvers
  StudentProfile: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
  },
  InternshipPayment: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    waivedByUser: async (parent: any) => parent.waivedBy ? await User.findById(parent.waivedBy) : null,
  },
  InternshipInvoice: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    payment: async (parent: any) => await InternshipPayment.findById(parent.paymentId),
  },
  InternshipCertificate: {
    id: (parent: any) => parent.id || parent._id,
    user: async (parent: any) => await User.findById(parent.userId),
    internshipProgram: async (parent: any) => await InternshipProgram.findById(parent.internshipProgramId),
    team: async (parent: any) => await InternshipTeam.findById(parent.teamId),
    trainer: async (parent: any) => await User.findById(parent.trainerId),
    revokedByUser: async (parent: any) => parent.revokedBy ? await User.findById(parent.revokedBy) : null,
  },
  DeveloperFeedback: {
    user: async (parent: any) => {
      if (!parent.userId) return null;
      if (parent.userId.username) return parent.userId;
      return await User.findById(parent.userId);
    }
  },

  PaymentTransaction: {
    courses: async (parent: any) => {
      if (!parent.courseIds || parent.courseIds.length === 0) return [];
      return await Course.find({ _id: { $in: parent.courseIds } });
    },
    internships: async (parent: any) => {
      if (!parent.internshipIds || parent.internshipIds.length === 0) return [];
      return await InternshipProgram.find({ _id: { $in: parent.internshipIds } });
    },
  },
  UserBadge: {
    badge: async (parent: any) => {
      // If it's already populated, return it
      if (parent.badgeId && (parent.badgeId.title || (parent.badgeId as any)._id)) {
        return parent.badgeId;
      }
      // If not populated, fetch it
      if (parent.badgeId) {
        return await Badge.findById(parent.badgeId);
      }
      return null;
    }
  },
  Badge: {
    id: (parent: any) => parent.id || parent._id,
  },
  CourseApplication: {
    id: (parent: any) => parent.id || parent._id,
    course: async (parent: any) => await Course.findById(parent.courseId),
    user: async (parent: any) => await User.findById(parent.userId),
  },
  ProjectOnboarding: {
    id: (parent: any) => parent.id || parent._id,
    developerId: (parent: any) => {
      if (!parent.developerId) return null;
      return parent.developerId?._id?.toString() || parent.developerId?.toString();
    },
    developer: async (parent: any) => {
      if (parent.developerId && (parent.developerId as any).username) return parent.developerId;
      return await User.findById(parent.developerId);
    },
  },
  ProjectApplication: {
    id: (parent: any) => (parent.id || parent._id)?.toString(),
    client: async (parent: any) => {
      if (parent.clientId && (parent.clientId as any).username) return parent.clientId;
      return await User.findById(parent.clientId);
    },
    assignedAdmin: async (parent: any) => {
      if (parent.assignedAdmin && (parent.assignedAdmin as any).username) return parent.assignedAdmin;
      if (parent.assignedAdmin) return await User.findById(parent.assignedAdmin);
      return null;
    },
    ndaPdfUrl: async (parent: any) => {
      const { ProjectNDA } = require('../models/ProjectNDA');
      try {
        const nda = await ProjectNDA.findOne({ projectApplicationId: parent._id || parent.id });
        return nda?.pdfUrl || null;
      } catch {
        return null;
      }
    },
  },
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => (pubsub as any).asyncIterator(['MESSAGE_ADDED']),

        (payload, variables) => {
          if (!variables.conversationId || !payload.messageAdded.conversationId) return false;
          return payload.messageAdded.conversationId.toString() === variables.conversationId;
        }
      ),
    },
    notificationAdded: {
      subscribe: withFilter(
        () => (pubsub as any).asyncIterator(['NOTIFICATION_ADDED']),
        (payload, variables) => {
          return payload.notificationAdded.userId.toString() === variables.userId;
        }
      ),
    },
  },
  InternshipMeeting: {
    teams: async (meeting: any) => {
      return await InternshipTeam.find({ _id: { $in: meeting.teamIds } });
    },
    host: async (meeting: any) => {
      return await User.findById(meeting.hostId);
    }
  }
};

