import cron from 'node-cron';
import { Internship } from '../models/Internship';
import { Project } from '../models/Project';
import { ProjectTask } from '../models/ProjectTask';
import { Booking } from '../models/Booking';
import { CourseProgress } from '../models/CourseProgress';
import { Certificate } from '../models/Certificate';
import { Course } from '../models/Course';
import { ProjectNDA } from '../models/ProjectNDA';
import { ProjectOnboarding } from '../models/ProjectOnboarding';
import { ProjectApplication } from '../models/ProjectApplication';
import { sendNotification } from '../services/notification.service';
import { User } from '../models/User';
import ScheduledBroadcast from '../models/ScheduledBroadcast';
import { executeBroadcast } from '../graphql/scheduled-broadcast-resolvers';
import { createBackup, getBackupScheduleConfig, getRetentionCount } from '../services/backup.service';

export const initKronos = () => {
    console.log('⏳ Initializing Cron Jobs...');

    // 1. Event Reminders (Daily at 8 AM)
    cron.schedule('0 8 * * *', async () => {
        console.log('Running Event Reminder Job...');
        // Logic to find bookings for tomorrow would go here
    });

    // 2. Deadline Alerts (Daily at 9 AM)
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Deadline Alert Job...');
        try {
            // Alert developers about tasks due in 48 hours
            const activeOnboardings = await ProjectOnboarding.find({ status: 'active' });
            for (const onboarding of activeOnboardings) {
                const project = await Project.findById(onboarding.projectId);
                if (project && project.deadline) {
                    const diffTime = Math.abs(new Date(project.deadline).getTime() - new Date().getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 2) {
                        await sendNotification(onboarding.developerId.toString(), {
                            type: 'project_deadline_near',
                            title: 'Project Deadline Approaching',
                            message: `The project "${project.title}" has a deadline in ${diffDays} day(s).`,
                            link: `/portal/student/projects/${project._id}`
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Error in Deadline Alert Job:', e);
        }
    });

    // 3. Payment Reminders (Weekly on Monday at 10 AM)
    cron.schedule('0 10 * * 1', async () => {
        console.log('Running Payment Reminder Job...');
        // Check internships with status 'enrolled' but payment 'pending'
    });

    // 4. Certificate Auto-Issuance (Hourly)
    // Automatically issues certificates when CourseProgress reaches 100%
    cron.schedule('0 * * * *', async () => {
        try {
            const completedProgress = await CourseProgress.find({
                overallProgress: 100,
                status: { $ne: 'completed' }
            });

            for (const progress of completedProgress) {
                // Check if cert already exists
                const certExists = await Certificate.findOne({
                    userId: progress.userId,
                    courseId: progress.courseId
                });

                if (!certExists) {
                    const course = await Course.findById(progress.courseId);
                    if (course) {
                        await Certificate.create({
                            userId: progress.userId,
                            courseId: progress.courseId,
                            courseTitle: course.title,
                            issueDate: new Date(),
                            status: 'issued',
                            progress: 100,
                            credentialId: `CERT-${Date.now()}-${progress.userId.toString().slice(-4)}`
                        });
                        console.log(`Issued Certificate for User ${progress.userId} in Course ${progress.courseId}`);
                    }
                }

                // Mark progress as formally completed
                progress.status = 'completed';
                progress.completionDate = new Date();
                await progress.save();
            }
        } catch (e) {
            console.error('Error in Certificate Job:', e);
        }
    });

    // 5. PMS Lifecycle Reminders (Daily at 7 AM)
    cron.schedule('0 7 * * *', async () => {
        try {
            console.log('Running PMS Lifecycle Reminders Job...');
            // 5a. Pending NDAs reminders
            const pendingNDAs = await ProjectNDA.find({ status: 'pending' });
            for (const nda of pendingNDAs) {
                await sendNotification(nda.clientId.toString(), {
                    type: 'project_nda_reminder',
                    title: 'Action Required: Pending NDA',
                    message: `Please sign the pending Non-Disclosure Agreement for your project proposal.`,
                    link: `/portal/client/applications`
                });
            }

            // 5b. Document submission/approval reminders
            const submittedApps = await ProjectApplication.find({ status: 'submitted' });
            if (submittedApps.length > 0) {
                // Notify admins that applications are waiting review
                const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
                for (const admin of admins) {
                    await sendNotification(admin._id.toString(), {
                        type: 'project_application_pending_review',
                        title: `${submittedApps.length} Project Application(s) Pending Review`,
                        message: `There are ${submittedApps.length} project application(s) awaiting admin review.`,
                        link: '/portal/admin/project-applications'
                    });
                }
            }
        } catch (err) {
            console.error('Error in PMS Lifecycle Reminders Job:', err);
        }
    });

    // 6. Developer Project Task Due Date Reminders (Daily at 9:00 AM)
    cron.schedule('0 9 * * *', async () => {
        try {
            console.log('Running Developer Project Task Due Date Reminders Job...');
            const now = new Date();
            const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

            const dueTasks = await ProjectTask.find({
                status: { $nin: ['done', 'in_review'] },
                assigneeId: { $exists: true, $ne: null },
                dueDate: { $lte: twoDaysFromNow, $gt: now },
                isDeleted: false
            });

            for (const task of dueTasks) {
                if (task.assigneeId) {
                    await sendNotification(task.assigneeId.toString(), {
                        type: 'project_task_due_near',
                        title: 'Task Due Soon',
                        message: `Your task "${task.title}" is due soon (by ${new Date(task.dueDate!).toLocaleDateString()}).`,
                        link: `/portal/student`
                    });
                }
            }
        } catch (e) {
            console.error('Error in Developer Project Task Due Date Reminders Job:', e);
        }
    });

    // 7. Weekly Database Cleanup (Every Sunday at 2:00 AM)
    cron.schedule('0 2 * * 0', async () => {
        console.log('🧹 Running Weekly Database Cleanup Job...');
        try {
            const courses = await Course.find({ isDeleted: { $ne: true } });
            let totalDups = 0;

            for (const course of courses) {
                let moduleDups = 0, lessonDups = 0, quizDups = 0, assignDups = 0;
                const modules = course.modules || [];
                let updated = false;

                // Dedup modules by title, merging unique lessons into the kept one
                const seenModules = new Map<string, number>();
                const modulesToKeep: any[] = [];
                for (const mod of modules) {
                    const key = mod.title?.toLowerCase().trim() || '';
                    if (seenModules.has(key)) {
                        const keptIdx = seenModules.get(key)!;
                        const keptMod = modulesToKeep[keptIdx];
                        if (mod.lessons) {
                            const existingTitles = new Set((keptMod.lessons || []).map((l: any) => l.title?.toLowerCase().trim()));
                            for (const lesson of mod.lessons) {
                                if (!existingTitles.has(lesson.title?.toLowerCase().trim())) {
                                    keptMod.lessons.push(lesson);
                                }
                            }
                        }
                        moduleDups++;
                        updated = true;
                    } else {
                        seenModules.set(key, modulesToKeep.length);
                        modulesToKeep.push(mod);
                    }
                }

                // Dedup lessons by title, quiz questions, and assignment questions within each module
                const dedupedModules = modulesToKeep.map((mod: any) => {
                    if (!mod.lessons || mod.lessons.length === 0) return mod;
                    const seenLessons = new Set<string>();
                    const uniqueLessons: any[] = [];
                    let modLessonDups = 0;

                    for (const lesson of mod.lessons) {
                        const key = lesson.title?.toLowerCase().trim() || '';
                        if (seenLessons.has(key)) {
                            modLessonDups++;
                        } else {
                            seenLessons.add(key);

                            // Dedup quiz questions within this lesson
                            let lessonQuizDups = 0;
                            if (lesson.quizQuestions?.length) {
                                const seenQuiz = new Set<string>();
                                lesson.quizQuestions = lesson.quizQuestions.filter((q: any) => {
                                    const key = q.questionText?.toLowerCase().trim() || '';
                                    if (seenQuiz.has(key)) { lessonQuizDups++; return false; }
                                    seenQuiz.add(key);
                                    return true;
                                });
                            }

                            // Dedup assignment questions within this lesson
                            let lessonAssignDups = 0;
                            if (lesson.assignmentQuestions?.length) {
                                const seenAssign = new Set<string>();
                                lesson.assignmentQuestions = lesson.assignmentQuestions.filter((q: any) => {
                                    const key = q.questionText?.toLowerCase().trim() || '';
                                    if (seenAssign.has(key)) { lessonAssignDups++; return false; }
                                    seenAssign.add(key);
                                    return true;
                                });
                            }

                            quizDups += lessonQuizDups;
                            assignDups += lessonAssignDups;
                            uniqueLessons.push(lesson);
                        }
                    }

                    lessonDups += modLessonDups;
                    if (modLessonDups > 0 || quizDups > 0 || assignDups > 0) updated = true;
                    return { ...mod, lessons: uniqueLessons };
                });

                if (updated) {
                    await Course.updateOne(
                        { _id: course._id },
                        { $set: { modules: dedupedModules } }
                    );
                    totalDups += moduleDups + lessonDups + quizDups + assignDups;
                }
            }

            if (totalDups > 0) {
                console.log(`  ✅ Weekly cleanup: removed ${totalDups} duplicate(s) across courses`);
            } else {
                console.log('  ✅ Database already clean — no duplicates found');
            }
        } catch (e) {
            console.error('Error in Weekly Cleanup Job:', e);
        }
    });

  // 8. Process Scheduled Broadcasts (Every minute)
  cron.schedule('* * * * *', async () => {
    try {
      const dueBroadcasts = await ScheduledBroadcast.find({
        status: 'pending',
        scheduledAt: { $lte: new Date() },
      });

      for (const broadcast of dueBroadcasts) {
        broadcast.status = 'processing';
        await broadcast.save();

        try {
          const result = await executeBroadcast(broadcast);
          broadcast.status = 'sent';
          broadcast.sentAt = new Date();
          broadcast.result = {
            totalRecipients: result.totalRecipients,
            notificationsSent: result.notificationsSent,
            emailsSent: result.emailsSent,
            errors: result.errors,
          };
          await broadcast.save();
          console.log(`[ScheduledBroadcast] Sent "${broadcast.title}" to ${result.totalRecipients} recipients`);
        } catch (err: any) {
          broadcast.status = 'failed';
          broadcast.result = {
            totalRecipients: 0,
            notificationsSent: 0,
            emailsSent: 0,
            errors: [err.message],
          };
          await broadcast.save();
          console.error(`[ScheduledBroadcast] Failed: ${broadcast.title}`, err.message);
        }
      }

      if (dueBroadcasts.length > 0) {
        console.log(`[ScheduledBroadcast] Processed ${dueBroadcasts.length} due broadcast(s)`);
      }
    } catch (e) {
      console.error('Error in Scheduled Broadcast Job:', e);
    }
  });


  // 10. Automatic Database Backup (Dynamic schedule from config)
  // Default: every 12 hours at 2:00 AM and 2:00 PM ("0 2,14 * * *")
  // Read config each tick to pick up interval/retention changes without restart
  cron.schedule('*/5 * * * *', async () => {
    try {
      const cfg = await getBackupScheduleConfig();

      if (!cfg.enabled) {
        return; // Auto-backup disabled
      }

      // Check if we should run based on the configured interval
      if (!cron.validate(cfg.interval)) {
        console.warn(`[Backup] Invalid cron expression: "${cfg.interval}". Skipping.`);
        return;
      }

      const now = new Date();
      const minute = now.getMinutes();
      const hour = now.getHours();
      const dayOfMonth = now.getDate();
      const month = now.getMonth() + 1;
      const dayOfWeek = now.getDay();

      // Simple cron matcher (handles common patterns)
      const matchCron = (expr: string): boolean => {
        const parts = expr.trim().split(/\s+/);
        if (parts.length !== 5) return false;
        const matchField = (field: string, val: number): boolean => {
          if (field === '*') return true;
          if (field.includes(',')) return field.split(',').some(f => matchField(f.trim(), val));
          if (field.includes('*/')) {
            const step = parseInt(field.split('*/')[1]);
            return step > 0 && val % step === 0;
          }
          if (field.includes('-')) {
            const [lo, hi] = field.split('-').map(Number);
            return val >= lo && val <= hi;
          }
          return parseInt(field) === val;
        };
        return (
          matchField(parts[0], minute) &&
          matchField(parts[1], hour) &&
          matchField(parts[2], dayOfMonth) &&
          matchField(parts[3], month) &&
          matchField(parts[4], dayOfWeek)
        );
      };

      if (!matchCron(cfg.interval)) {
        return; // Not time to run yet
      }

      console.log(`[Backup] Running Automatic Database Backup Job (interval: "${cfg.interval}")...`);
      const record = await createBackup();
      console.log(`[Backup] Auto-backup completed: ${record.backupDbName}, ${record.collections.length} collections`);
    } catch (error: any) {
      console.error('[Backup] Auto-backup failed:', error.message);
    }
  });

};