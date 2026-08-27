import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { ModuleAssignment } from '../models/ModuleAssignment';
import { ModuleProgress } from '../models/ModuleProgress';
import { ModuleAccessConfig } from '../models/ModuleAccessConfig';
import { sendNotification } from '../services/notification.service';
import { autoGenerateCertificate } from './CertificateController';

const TRAINER_OR_ADMIN = ['trainer', 'admin', 'super_admin'];

const getModuleIndex = (course: any, moduleId: string): number => {
  return course.modules.findIndex((module: any, index: number) => {
    const id = module._id?.toString();
    const rawOrder = typeof module.orderIndex === 'number' ? module.orderIndex : module.order;
    return id === moduleId || rawOrder === index;
  });
};

const getRequiredLessonIds = (module: any): string[] => {
  return (module.lessons || [])
    .filter((lesson: any) => lesson.requiredAssignment || lesson.isAssignment || lesson.type === 'assignment' || lesson.type === 'quiz')
    .map((lesson: any) => lesson._id.toString());
};

const ensureProgress = async (studentId: string, courseId: string) => {
  let progress = await ModuleProgress.findOne({ studentId, courseId });
  if (!progress) {
    progress = await ModuleProgress.create({
      studentId,
      courseId,
      unlockedModules: [0],
      overrideUnlockedModules: []
    });
  }
  return progress;
};

export const markLessonComplete = async (req: Request, res: Response) => {
  try {
    const { courseId, moduleId, lessonId } = req.body;
    const studentId = (req as any).user?.id;

    if (!studentId || !courseId || !moduleId || !lessonId) {
      return res.status(400).json({ message: 'courseId, moduleId, and lessonId are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const moduleIndex = getModuleIndex(course, moduleId);
    if (moduleIndex < 0) return res.status(404).json({ message: 'Module not found' });

    const progress = await ensureProgress(studentId, courseId);

    const unlocked = new Set([...(progress.unlockedModules || []), ...(progress.overrideUnlockedModules || [])]);
    if (!unlocked.has(moduleIndex)) {
      return res.status(403).json({ message: 'Complete your assignment to unlock this module.' });
    }

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }
    progress.lessonCompletionDates = {
      ...(progress.lessonCompletionDates || {}),
      [lessonId]: new Date()
    };

    await progress.save();

    return res.json({ message: 'Lesson marked complete', progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { courseId, moduleId, submissionLink, fileUrl } = req.body;
    const studentId = (req as any).user?.id;

    if (!studentId || !courseId || !moduleId || (!submissionLink && !fileUrl)) {
      return res.status(400).json({ message: 'courseId, moduleId and submissionLink/fileUrl are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const moduleIndex = getModuleIndex(course, moduleId);
    if (moduleIndex < 0) return res.status(404).json({ message: 'Module not found' });

    const module = course.modules[moduleIndex];
    const requiredLessons = getRequiredLessonIds(module);
    const progress = await ensureProgress(studentId, courseId);

    const missingRequiredLessons = requiredLessons.filter((lessonId) => !progress.completedLessons.includes(lessonId));
    if (missingRequiredLessons.length > 0) {
      return res.status(403).json({
        message: 'Complete all required lessons before submitting assignment',
        missingRequiredLessons
      });
    }

    const assignment = await ModuleAssignment.findOneAndUpdate(
      { studentId, courseId, moduleId },
      {
        studentId,
        courseId,
        moduleId,
        submissionLink,
        fileUrl,
        status: 'pending',
        feedback: '',
        approvedBy: null,
        approvedAt: null,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    progress.assignmentSubmissionDates = {
      ...(progress.assignmentSubmissionDates || {}),
      [moduleId]: new Date()
    };
    await progress.save();

    return res.json({ message: 'Assignment submitted. Status: Pending Review', assignment, progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const reviewAssignment = async (req: Request, res: Response) => {
  try {
    const reviewer = (req as any).user;
    if (!reviewer || !TRAINER_OR_ADMIN.includes(reviewer.role)) {
      return res.status(403).json({ message: 'Only Admin/Trainer can review assignments' });
    }

    const { assignmentId, status, feedback, score } = req.body;
    if (!assignmentId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'assignmentId and status(approved/rejected) are required' });
    }

    const assignment = await ModuleAssignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.status = status;
    assignment.feedback = feedback;
    assignment.score = typeof score === 'number' ? score : assignment.score;

    if (status === 'approved') {
      assignment.approvedBy = new mongoose.Types.ObjectId(reviewer.id);
      assignment.approvedAt = new Date();
    } else {
      assignment.approvedBy = undefined;
      assignment.approvedAt = undefined;
    }

    await assignment.save();

    const course = await Course.findById(assignment.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found for assignment' });

    const progress = await ensureProgress(assignment.studentId.toString(), assignment.courseId.toString());
    const moduleIndex = getModuleIndex(course, assignment.moduleId.toString());

    const config = await ModuleAccessConfig.findOne({ courseId: assignment.courseId });
    const autoUnlockEnabled = Boolean(config?.autoUnlockEnabled);
    const threshold = config?.autoUnlockScoreThreshold ?? 80;
    const scorePasses = typeof assignment.score === 'number' ? assignment.score >= threshold : false;

    if (status === 'approved') {
      const shouldUnlock = !autoUnlockEnabled || scorePasses;
      if (shouldUnlock) {
        progress.unlockedModules = Array.from(new Set([...(progress.unlockedModules || []), moduleIndex + 1]));
        progress.currentModuleIndex = Math.max(progress.currentModuleIndex || 0, moduleIndex + 1);
      }

      progress.approvalDates = {
        ...(progress.approvalDates || {}),
        [assignment.moduleId.toString()]: new Date()
      };
      progress.approvedByMap = {
        ...(progress.approvedByMap || {}),
        [assignment.moduleId.toString()]: reviewer.id
      };

      // Mark all lessons in this module as complete
      const moduleObj = course.modules[moduleIndex];
      if (moduleObj?.lessons) {
        for (const lesson of moduleObj.lessons) {
          const lessonId = (lesson as any)._id?.toString() || (lesson as any).id?.toString() || lesson.toString();
          if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
          }
          progress.lessonCompletionDates = {
            ...(progress.lessonCompletionDates || {}),
            [lessonId]: new Date()
          };
        }
      }
      await progress.save();

      // Also update User.completedLessons for the main completion check
      const studentUser = await User.findById(assignment.studentId);
      if (studentUser && moduleObj?.lessons) {
        for (const lesson of moduleObj.lessons) {
          const lessonId = (lesson as any)._id?.toString() || (lesson as any).id?.toString() || lesson.toString();
          const alreadyDone = studentUser.completedLessons?.some(
            (cl: any) => cl.courseId.toString() === assignment.courseId.toString() && cl.lessonId === lessonId
          );
          if (!alreadyDone) {
            studentUser.completedLessons.push({ courseId: assignment.courseId, lessonId });
          }
        }
        await studentUser.save();
      }

      // Check for Course Completion
      if (progress.unlockedModules.length >= course.modules.length) {
          // Check if all assignments are approved
          const allAssignments = await ModuleAssignment.find({ 
              studentId: assignment.studentId, 
              courseId: assignment.courseId 
          });
          const allApproved = allAssignments.length === course.modules.length && 
                              allAssignments.every(a => a.status === 'approved');
          
          if (allApproved) {
              await autoGenerateCertificate(assignment.studentId.toString(), assignment.courseId.toString(), 'course');
          }
      }

      await sendNotification(assignment.studentId.toString(), {
        type: 'assignment_approved',
        title: 'Assignment Approved',
        message: shouldUnlock
          ? 'Your assignment has been approved and next module is unlocked.'
          : 'Your assignment has been approved. Module unlock requires score threshold in auto-unlock mode.',
      });
    }

    return res.json({ message: `Assignment ${status}`, assignment, progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const unlockModule = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    if (!actor || !TRAINER_OR_ADMIN.includes(actor.role)) {
      return res.status(403).json({ message: 'Only Admin/Trainer can unlock module' });
    }

    const { studentId, courseId, moduleIndex } = req.body;
    const progress = await ensureProgress(studentId, courseId);
    progress.overrideUnlockedModules = Array.from(new Set([...(progress.overrideUnlockedModules || []), Number(moduleIndex)]));
    progress.unlockedModules = Array.from(new Set([...(progress.unlockedModules || []), Number(moduleIndex)]));
    await progress.save();

    return res.json({ message: 'Module manually unlocked', progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const lockModule = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    if (!actor || !TRAINER_OR_ADMIN.includes(actor.role)) {
      return res.status(403).json({ message: 'Only Admin/Trainer can lock module' });
    }

    const { studentId, courseId, moduleIndex } = req.body;
    const progress = await ensureProgress(studentId, courseId);
    progress.unlockedModules = (progress.unlockedModules || []).filter((index) => index !== Number(moduleIndex));
    progress.overrideUnlockedModules = (progress.overrideUnlockedModules || []).filter((index) => index !== Number(moduleIndex));

    if ((progress.currentModuleIndex || 0) >= Number(moduleIndex)) {
      progress.currentModuleIndex = Math.max(0, Number(moduleIndex) - 1);
    }

    await progress.save();

    return res.json({ message: 'Module locked again', progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const forceProgress = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    if (!actor || !TRAINER_OR_ADMIN.includes(actor.role)) {
      return res.status(403).json({ message: 'Only Admin/Trainer can force progress' });
    }

    const { studentId, courseId, targetModuleIndex } = req.body;
    const progress = await ensureProgress(studentId, courseId);

    const nextUnlocked = Array.from(new Set([
      ...(progress.unlockedModules || []),
      ...Array.from({ length: Number(targetModuleIndex) + 1 }, (_, i) => i)
    ]));

    progress.unlockedModules = nextUnlocked;
    progress.currentModuleIndex = Number(targetModuleIndex);
    await progress.save();

    return res.json({ message: 'Student force-progressed', progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProgress = async (req: Request, res: Response) => {
  try {
    const studentId = String(req.params.studentId);
    const rawCourseId = req.query.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({ message: 'courseId query param is required' });
    }
    const courseIdValue = courseId as string;

    const student = await User.findById(studentId).select('_id name username email role');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const progress = await ensureProgress(studentId, courseIdValue);
    const assignments = await ModuleAssignment.find({ studentId, courseId: courseIdValue }).sort({ createdAt: -1 });

    return res.json({ student, progress, assignments });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPendingAssignments = async (_req: Request, res: Response) => {
  try {
    const pending = await ModuleAssignment.find({ status: 'pending' })
      .populate('studentId', 'username fullName email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    return res.json({ assignments: pending });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAutoUnlockConfig = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user;
    if (!actor || !TRAINER_OR_ADMIN.includes(actor.role)) {
      return res.status(403).json({ message: 'Only Admin/Trainer can update auto unlock settings' });
    }

    const { courseId, autoUnlockEnabled, autoUnlockScoreThreshold } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const config = await ModuleAccessConfig.findOneAndUpdate(
      { courseId },
      { courseId, autoUnlockEnabled: Boolean(autoUnlockEnabled), autoUnlockScoreThreshold: Number(autoUnlockScoreThreshold ?? 80) },
      { upsert: true, new: true }
    );

    return res.json({ message: 'Auto unlock configuration updated', config });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const canAccessModule = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user?.id;
    const rawCourseId = req.query.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;
    const { moduleIndex } = req.query;

    if (!studentId || !courseId || typeof courseId !== 'string') {
      return res.status(400).json({ message: 'courseId is required' });
    }
    const courseIdValue = courseId as string;

    const progress = await ensureProgress(studentId, courseIdValue);
    const requestedIndex = Number(moduleIndex ?? 0);
    const unlocked = new Set([...(progress.unlockedModules || []), ...(progress.overrideUnlockedModules || [])]);

    if (!unlocked.has(requestedIndex)) {
      return res.status(403).json({
        message: 'Complete your assignment to unlock this module.',
        redirectModuleIndex: Math.max(0, (progress.currentModuleIndex || 0) - 1)
      });
    }

    return res.json({ allowed: true, progress });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
