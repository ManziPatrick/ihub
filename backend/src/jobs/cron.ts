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
};
