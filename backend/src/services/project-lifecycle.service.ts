import crypto from 'crypto';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { ProjectApplication } from '../models/ProjectApplication';
import { ProjectNDA } from '../models/ProjectNDA';
import { ProjectOnboarding } from '../models/ProjectOnboarding';
import { User } from '../models/User';
import { Config } from '../models/Config';
import { sendNotification } from './notification.service';
import Notification from '../models/Notification';
import { sendEmail } from './email.service';
import { generateNDAPDF } from './pdf.service';

export class ProjectLifecycleService {
  /**
   * Submit a new project application proposal
   */
  static async submitApplication(
    clientId: string,
    title: string,
    description: string,
    documents: { overviewUrl?: string; featuresUrl?: string; technicalUrl?: string }
  ): Promise<any> {
    const application = new ProjectApplication({
      clientId,
      title,
      description,
      requiredDocuments: documents,
      status: 'submitted',
      ndaSigned: false,
    });

    const savedApp = await application.save();

    // Notify Admins
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    for (const admin of admins) {
      await sendNotification(admin._id.toString(), {
        type: 'project_application_submitted',
        title: 'New Project Proposal',
        message: `A new project proposal "${title}" has been submitted by client.`,
        link: `/portal/admin/applications`,
      });
    }

    return savedApp;
  }

  /**
   * Review project application and progress to next stage
   */
  static async reviewApplication(
    applicationId: string,
    reviewerId: string,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected',
    notes?: string
  ): Promise<any> {
    const application = await ProjectApplication.findById(applicationId);
    if (!application) throw new Error('Project application not found');

    application.status = status;
    if (notes) application.reviewNotes = notes;

    const savedApp = await application.save();

    const client = await User.findById(application.clientId);

    if (status === 'under_review') {
      if (client) {
        await sendNotification(client._id.toString(), {
          type: 'project_application_update',
          title: 'Application Under Review',
          message: `Your project proposal "${application.title}" is now under review.`,
          link: `/portal/client/applications`,
        });
      }
    } else if (status === 'approved') {
      // Create Pending NDA document record
      const nda = new ProjectNDA({
        projectApplicationId: savedApp._id,
        clientId: application.clientId,
        signerName: client?.fullName || client?.username || 'Client',
        signerEmail: client?.email || '',
        status: 'pending',
      });
      await nda.save();

      if (client) {
        await sendNotification(client._id.toString(), {
          type: 'project_application_update',
          title: 'Proposal Approved & NDA Ready',
          message: `Your proposal "${application.title}" was approved! Please review and sign the NDA to proceed.`,
          link: `/portal/client/applications`,
        });

        // Email warning/notification
        await sendEmail({
          to: client.email,
          subject: `Action Required: Non-Disclosure Agreement for "${application.title}"`,
          html: `<h3>Congratulations!</h3><p>Your project proposal "${application.title}" has been approved. Please log in to sign the NDA so we can onboard developers.</p><p><a href="${process.env.CLIENT_ORIGIN || 'https://bootskills.com'}/portal/client/applications">Sign NDA here</a></p>`,
        });
      }
    } else if (status === 'rejected') {
      if (client) {
        await sendNotification(client._id.toString(), {
          type: 'project_application_update',
          title: 'Proposal Rejected',
          message: `We regret to inform you that your proposal "${application.title}" was not approved. Notes: ${notes || 'None'}`,
          link: `/portal/client/applications`,
        });
      }
    }

    return savedApp;
  }

  /**
   * Electronically sign the NDA document
   */
  static async signNDA(
    applicationId: string,
    signerName: string,
    ipAddress: string
  ): Promise<any> {
    const nda = await ProjectNDA.findOne({ projectApplicationId: applicationId, status: 'pending' });
    if (!nda) throw new Error('Pending NDA not found for this application');

    const app = await ProjectApplication.findById(applicationId);
    if (!app) throw new Error('Project application not found');

    // ─── Daily signing limit check (max 10 per day per user) ────────────────
    // Priority: env var > Config model > hardcoded default (10)
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

    const signedToday = await ProjectNDA.countDocuments({
      clientId: nda.clientId,
      status: 'signed',
      signedAt: { $gte: todayStart, $lte: todayEnd },
    });

    if (signedToday >= DAILY_LIMIT) {
      // ─── Notify admins when a user hits the daily limit (once per day) ─
      try {
        const alreadyNotified = await Notification.countDocuments({          type: 'nda_daily_limit_reached',
              clientId: nda.clientId.toString(),
          createdAt: { $gte: todayStart },
        });
        if (alreadyNotified === 0) {
          const clientUser = await User.findById(nda.clientId);
          const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
          for (const admin of admins) {
            await sendNotification(admin._id.toString(), {
              type: 'nda_daily_limit_reached',
              title: 'NDA Daily Limit Reached',
              message: `Client ${clientUser?.fullName || clientUser?.username || 'Unknown'} (${clientUser?.email || 'no email'}) has hit their daily NDA signing limit of ${DAILY_LIMIT}.`,
              link: `/portal/admin/applications`,
              clientId: nda.clientId.toString(),
            });
          }
          // Also send email notification to admins
          const adminEmails = admins.filter(a => a.email).map(a => a.email);
          if (adminEmails.length > 0) {
            for (const email of adminEmails) {
              await sendEmail({
                to: email,
                subject: `⚠️ NDA Limit Reached — ${clientUser?.fullName || clientUser?.username || 'Client'}`,
                html: `<h3>NDA Daily Signing Limit Reached</h3>
<p><strong>Client:</strong> ${clientUser?.fullName || clientUser?.username || 'Unknown'}</p>
<p><strong>Email:</strong> ${clientUser?.email || 'N/A'}</p>
<p><strong>Limit:</strong> ${DAILY_LIMIT} per day</p>
<p>The client attempted to sign an NDA but has reached the daily limit.</p>
<p>You can increase the limit by setting the <code>NDA_DAILY_LIMIT</code> environment variable, or by creating a Config entry with key <code>ndaDailyLimit</code>.</p>
<p><a href="${process.env.CLIENT_ORIGIN || 'https://bootskills.com'}/portal/admin/applications">View Applications →</a></p>`,
              });
            }
          }
        }
      } catch (notifyErr) {
        console.error('Failed to notify admins about NDA limit:', notifyErr);
        // Non-blocking — user still gets the limit error regardless
      }

      throw new Error(
        `Daily NDA signing limit of ${DAILY_LIMIT} reached. Please try again tomorrow.`
      );
    }

    const timestamp = new Date();
    // Cryptographic audit proof signature hash
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${applicationId}-${nda.clientId}-${signerName}-${timestamp.toISOString()}-${ipAddress}`)
      .digest('hex');

    nda.status = 'signed';
    nda.signerName = signerName;
    nda.signedAt = timestamp;
    nda.signerIp = ipAddress;
    nda.signatureHash = signatureHash;

    // Generate and store the NDA PDF
    try {
      const clientUser = await User.findById(app.clientId);
      const pdfUrl = await generateNDAPDF({
        ndaId: nda._id.toString(),
        applicationTitle: app.title,
        clientName: clientUser?.fullName || clientUser?.username || 'Client',
        signerName,
        signerEmail: clientUser?.email || '',
        signedAt: timestamp,
        signatureHash,
        signerIp: ipAddress,
      });
      nda.pdfUrl = pdfUrl;
    } catch (pdfErr) {
      console.error('Failed to generate NDA PDF:', pdfErr);
      // Non-blocking — NDA is still considered signed
    }

    const savedNda = await nda.save();

    app.ndaSigned = true;
    await app.save();

    // Notify Admins
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    for (const admin of admins) {
      await sendNotification(admin._id.toString(), {
        type: 'project_nda_signed',
        title: 'NDA Executed',
        message: `NDA for "${app.title}" has been signed by ${signerName}.`,
        link: `/portal/admin/applications`,
      });
    }

    return savedNda;
  }

  /**
   * Convert approved application to an active execution Project
   */
  static async initializeProjectFromApplication(
    applicationId: string,
    course: string,
    mentorIds: string[]
  ): Promise<any> {
    const app = await ProjectApplication.findById(applicationId);
    if (!app) throw new Error('Application not found');
    if (!app.ndaSigned || app.status !== 'approved') {
      throw new Error('NDA must be signed and proposal approved to start project');
    }

    // Check if project already initialized
    const existing = await Project.findOne({ projectApplicationId: applicationId });
    if (existing) return existing;

    const newProject = new Project({
      userId: app.clientId, // Set client as main owner
      projectApplicationId: app._id,
      title: app.title,
      description: app.description,
      course,
      type: 'Team Project',
      status: 'in_progress',
      progress: 0,
      mentors: mentorIds.map((id) => new mongoose.Types.ObjectId(id)),
      team: [],
      tasks: [],
      milestones: [
        { title: 'Project Kickoff & Requirements', completed: false, deliverables: ['System Features Document'] },
        { title: 'MVP Development', completed: false, deliverables: ['Repository URL', 'Demo Video'] },
        { title: 'Final QA & Handover', completed: false, deliverables: ['Testing Report', 'Production Deployment'] }
      ]
    });

    const savedProject = await newProject.save();

    // Notify Client
    await sendNotification(app.clientId.toString(), {
      type: 'project_initialized',
      title: 'Project Active',
      message: `Your project "${app.title}" is now active and developers are being assigned.`,
      link: `/portal/client/workspace`,
    });

    return savedProject;
  }

  /**
   * Onboard a developer user to a project
   */
  static async assignDeveloperToProject(
    projectId: string,
    developerId: string,
    role: string,
    checklistTasks: string[]
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const devUser = await User.findById(developerId);
    if (!devUser) throw new Error('Developer user not found');

    // Create Onboarding record
    const onboarding = new ProjectOnboarding({
      projectId,
      developerId,
      role,
      status: 'onboarding',
      checklist: checklistTasks.map((task) => ({ task, completed: false })),
    });

    const savedOnboarding = await onboarding.save();

    // Add to project team array
    if (!project.team) project.team = [];
    if (!project.team.some((t) => t.userId?.toString() === developerId)) {
      project.team.push({
        userId: new mongoose.Types.ObjectId(developerId),
        name: devUser.fullName || devUser.username,
        role,
      });
      await project.save();
    }

    // Send notification
    await sendNotification(developerId, {
      type: 'project_assigned',
      title: `Assigned to: ${project.title}`,
      message: `You have been onboarded as a ${role}. Complete your checklist to begin development.`,
      link: `/portal/student/projects/${projectId}`,
    });

    return savedOnboarding;
  }

  /**
   * Update task checklist progress for a developer
   */
  static async updateOnboardingChecklist(
    onboardingId: string,
    taskIndex: number,
    completed: boolean
  ): Promise<any> {
    const onboarding = await ProjectOnboarding.findById(onboardingId);
    if (!onboarding) throw new Error('Onboarding record not found');

    if (taskIndex < 0 || taskIndex >= onboarding.checklist.length) {
      throw new Error('Invalid task index');
    }

    onboarding.checklist[taskIndex].completed = completed;
    onboarding.checklist[taskIndex].completedAt = completed ? new Date() : undefined;

    // Check if onboarding completed
    const allDone = onboarding.checklist.every((c) => c.completed);
    if (allDone) {
      onboarding.status = 'active';
      // Notify client/mentors developer is active
      const project = await Project.findById(onboarding.projectId);
      if (project) {
        await sendNotification(project.userId.toString(), {
          type: 'developer_active',
          title: 'Developer Active',
          message: `Developer ${(await User.findById(onboarding.developerId))?.username} has completed onboarding and is active.`,
          link: `/portal/client/workspace`,
        });
      }
    } else {
      onboarding.status = 'onboarding';
    }

    return onboarding.save();
  }

  /**
   * Submit deliverable with version increments
   */
  static async submitDeliverable(
    projectId: string,
    milestoneIndex: number,
    fileUrl: string,
    fileName: string,
    message: string,
    submittedBy: string
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    if (!project.milestones || milestoneIndex < 0 || milestoneIndex >= project.milestones.length) {
      throw new Error('Invalid milestone index');
    }

    const milestone = project.milestones[milestoneIndex];
    if (!milestone.submissions) milestone.submissions = [];

    // Calculate highest version number
    const versions = milestone.submissions.map((s) => s.version || 1);
    const nextVersion = versions.length > 0 ? Math.max(...versions) + 1 : 1;

    milestone.submissions.push({
      url: fileUrl,
      submittedAt: new Date(),
      message,
      status: 'pending',
      version: nextVersion,
      fileName,
      submittedBy: new mongoose.Types.ObjectId(submittedBy),
    });

    const savedProject = await project.save();

    // Notify Mentors & Client
    const notificationPayload = {
      type: 'deliverable_submitted',
      title: 'Milestone Deliverable Uploaded',
      message: `A new version (v${nextVersion}) of deliverable was submitted for milestone: "${milestone.title}" in project "${project.title}".`,
      link: `/portal/admin/projects`, // For admins/mentors
    };

    for (const mentor of project.mentors) {
      await sendNotification(mentor.toString(), notificationPayload);
    }
    
    // Also notify client if uploaded by developer
    if (submittedBy !== project.userId.toString()) {
      await sendNotification(project.userId.toString(), {
        ...notificationPayload,
        link: `/portal/client/workspace`,
      });
    }

    return savedProject;
  }

  /**
   * Submit client feedback evaluation
   */
  static async submitClientEvaluation(
    projectId: string,
    clientId: string,
    rating: number,
    comment: string
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    if (project.userId.toString() !== clientId) throw new Error('Only the project owner can submit client feedback');

    project.evaluation = {
      ...project.evaluation,
      clientFeedback: {
        rating,
        comment,
        submittedAt: new Date(),
      },
    };

    return await project.save();
  }

  /**
   * Submit developer self/peer evaluation
   */
  static async submitDeveloperEvaluation(
    projectId: string,
    developerId: string,
    rating: number,
    notes: string
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    // Verify developer is part of the team
    const isOnTeam = (project.team || []).some(
      (t) => t.userId?.toString() === developerId
    );
    const isMentor = (project.mentors || []).some(
      (m) => m.toString() === developerId
    );
    if (!isOnTeam && !isMentor) throw new Error('You are not assigned to this project');

    // Copy existing evaluations or start fresh
    const devEvals = [...(project.evaluation?.developerEvaluations ?? [])];

    // Update existing or add new
    const existingIdx = devEvals.findIndex(
      (e) => e.developerId.toString() === developerId
    );
    if (existingIdx >= 0) {
      devEvals[existingIdx] = { ...devEvals[existingIdx], rating, notes };
    } else {
      devEvals.push({
        developerId: new mongoose.Types.ObjectId(developerId),
        rating,
        notes,
      });
    }

    project.evaluation = {
      ...project.evaluation,
      developerEvaluations: devEvals,
    };

    return await project.save();
  }

  /**
   * Update reviewer/admin notes on a project
   */
  static async updateReviewerNotes(
    projectId: string,
    reviewerId: string,
    notes: string
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.evaluation = {
      ...project.evaluation,
      reviewerNotes: notes,
    };

    return await project.save();
  }

  /**
   * Soft-delete a project application — only if still in 'submitted' status
   */
  static async deleteProjectApplication(
    applicationId: string,
    clientId: string
  ): Promise<any> {
    const app = await ProjectApplication.findById(applicationId);
    if (!app) throw new Error('Project application not found');
    if (app.clientId.toString() !== clientId) throw new Error('You can only delete your own applications');
    if (app.status !== 'submitted') throw new Error('Only pending (submitted) applications can be deleted');

    // Soft-delete: mark as deleted instead of removing
    app.status = 'deleted' as any;
    return await app.save();
  }

  /**
   * Restore a soft-deleted project application
   */
  static async restoreProjectApplication(
    applicationId: string,
    clientId: string
  ): Promise<any> {
    const app = await ProjectApplication.findById(applicationId);
    if (!app) throw new Error('Project application not found');
    if (app.clientId.toString() !== clientId) throw new Error('You can only restore your own applications');
    if (app.status !== 'deleted') throw new Error('Application is not in deleted status');

    app.status = 'submitted';
    return await app.save();
  }

  /**
   * Update a project application — only if still in 'submitted' status
   */
  static async updateProjectApplication(
    applicationId: string,
    clientId: string,
    title: string,
    description: string,
    documents: { overviewUrl?: string; featuresUrl?: string; technicalUrl?: string }
  ): Promise<any> {
    const app = await ProjectApplication.findById(applicationId);
    if (!app) throw new Error('Project application not found');
    if (app.clientId.toString() !== clientId) throw new Error('You can only edit your own applications');
    if (app.status !== 'submitted') throw new Error('Only pending (submitted) applications can be edited');

    app.title = title || app.title;
    app.description = description || app.description;
    if (documents) {
      app.requiredDocuments = {
        ...app.requiredDocuments,
        ...documents,
      };
    }

    return await app.save();
  }

  /**
   * Final project closure and archive
   */
  static async archiveProject(
    projectId: string,
    lessonsLearned: string
  ): Promise<any> {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    project.isArchived = true;
    project.archivedAt = new Date();
    project.status = 'completed';
    project.progress = 100;
    
    project.evaluation = {
      ...project.evaluation,
      reviewerNotes: lessonsLearned,
    };

    const savedProject = await project.save();

    // Onboarding status update to completed
    await ProjectOnboarding.updateMany({ projectId }, { status: 'completed' });

    // Notify team & client
    const teamUserIds = (project.team || []).map((m) => m.userId?.toString()).filter(Boolean) as string[];
    const allUsers = [...teamUserIds, project.userId.toString()];

    for (const userId of allUsers) {
      await sendNotification(userId, {
        type: 'project_archived',
        title: 'Project Closed & Archived',
        message: `Project "${project.title}" has been successfully completed and archived. Thank you for your hard work!`,
        link: userId === project.userId.toString() ? `/portal/client/workspace` : `/portal/student/projects/${projectId}`,
      });
    }

    return savedProject;
  }
}
