import { ApplicationPhaseService } from '../services/application-phase.service';
import { ApplicationWorkflowService } from '../services/application-workflow.service';
import { MeetingBookingService } from '../services/meeting-booking.service';
import { TaskManagementService } from '../services/task-management.service';
import { InternshipApplication } from '../models/internship/InternshipApplication';
import { Internship } from '../models/Internship';

export const applicationPhaseResolvers = {
  Query: {
    // Application Phase Queries
    getApplicationPhases: async (_: any, { programId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await ApplicationPhaseService.getPhasesByProgram(programId);
    },

    getApplicationPhase: async (_: any, { phaseId }: any) => {
      return await ApplicationPhaseService.getPhaseById(phaseId);
    },

    getApplicationPhaseSubmissions: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const { ApplicationPhaseSubmission } = await import('../models/ApplicationPhaseSubmission.js');
      return await ApplicationPhaseSubmission.find({ applicationId }).sort({ submittedAt: -1 });
    },

    getApplicantsByPhase: async (_: any, { programId, phaseId }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationWorkflowService.getApplicantsByPhase(programId, phaseId);
    },

    getApplicationMeetings: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await MeetingBookingService.getMeetingsByApplication(applicationId);
    },

    getPendingMeetings: async (_: any, { adminId }: any, context: any) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await MeetingBookingService.getPendingMeetingsByAdmin(adminId);
    },

    getUserAssignedTasks: async (_: any, { userId, status }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      if (context.user.id !== userId && !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      return await TaskManagementService.getTasksByUser(userId, status);
    },

    getTasksByAssignedBy: async (_: any, { adminId, status }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await TaskManagementService.getTasksByAssignedBy(adminId, status);
    },

    getTaskWithTracking: async (_: any, { taskId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.getTaskWithTracking(taskId);
    },

    getApplicationProgress: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await ApplicationWorkflowService.getApplicationProgress(applicationId);
    },

    getTaskStats: async (_: any, { adminId }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await TaskManagementService.getTaskStats(adminId);
    },
  },

  Mutation: {
    // Application Phase Mutations
    createApplicationPhase: async (
      _: any,
      {
        programId,
        name,
        description,
        order,
        requiredDeliverables,
        estimatedDurationDays,
        enableApproval,
        approvalType,
        notificationOnCompletion,
        isInterviewPhase,
        allowMeetingScheduling,
      }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationPhaseService.createPhase(programId, {
        name,
        description,
        order,
        requiredDeliverables,
        estimatedDurationDays,
        enableApproval,
        approvalType,
        notificationOnCompletion,
        isInterviewPhase,
        allowMeetingScheduling,
      });
    },

    updateApplicationPhase: async (
      _: any,
      {
        phaseId,
        name,
        description,
        order,
        requiredDeliverables,
        estimatedDurationDays,
        enableApproval,
        approvalType,
        isInterviewPhase,
        allowMeetingScheduling,
      }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationPhaseService.updatePhase(phaseId, {
        name,
        description,
        order,
        requiredDeliverables,
        estimatedDurationDays,
        enableApproval,
        approvalType,
        isInterviewPhase,
        allowMeetingScheduling,
      });
    },

    deleteApplicationPhase: async (_: any, { phaseId }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationPhaseService.deletePhase(phaseId);
    },

    reorderApplicationPhases: async (
      _: any,
      { programId, phaseIds }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationPhaseService.reorderPhases(programId, phaseIds);
    },

    // Application Submission Mutations
    submitPhaseDeliverable: async (
      _: any,
      { applicationId, phaseId, submissionData }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await ApplicationWorkflowService.submitPhaseDeliverable(
        applicationId,
        phaseId,
        submissionData
      );
    },

    approvePhaseSubmission: async (
      _: any,
      { applicationId, phaseId, approvedBy, notes, moveToNextPhase }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationWorkflowService.approvePhaseSubmission(
        applicationId,
        phaseId,
        { approvedBy, notes, moveToNextPhase }
      );
    },

    rejectPhaseSubmission: async (
      _: any,
      { applicationId, phaseId, rejectedBy, rejectionReason, allowResubmission }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationWorkflowService.rejectPhaseSubmission(
        applicationId,
        phaseId,
        { rejectedBy, rejectionReason, allowResubmission }
      );
    },

    requestRevision: async (
      _: any,
      { applicationId, phaseId, requestedBy, revisionNotes }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationWorkflowService.requestRevision(
        applicationId,
        phaseId,
        { requestedBy, revisionNotes }
      );
    },

    moveApplicationToPhase: async (
      _: any,
      { applicationId, phaseId, movedBy, notes }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await ApplicationWorkflowService.moveToPhase(
        applicationId,
        phaseId,
        movedBy,
        notes
      );
    },

    // Meeting Mutations
    scheduleApplicationMeeting: async (
      _: any,
      {
        applicationId,
        phaseId,
        scheduledBy,
        scheduledFor,
        meetingType,
        title,
        description,
        scheduledDate,
        scheduledTime,
        duration,
        location,
        meetingLink,
        attendees,
      }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await MeetingBookingService.scheduleApplicationMeeting(
        applicationId,
        phaseId,
        scheduledBy,
        {
          scheduledFor,
          meetingType,
          title,
          description,
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          duration,
          location,
          meetingLink,
          attendees,
        }
      );
    },

    confirmApplicationMeeting: async (
      _: any,
      { meetingId, confirmedBy }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await MeetingBookingService.confirmMeeting(meetingId, confirmedBy);
    },

    cancelApplicationMeeting: async (
      _: any,
      { meetingId, cancelledBy, reason }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await MeetingBookingService.cancelMeeting(meetingId, cancelledBy, reason);
    },

    completeMeeting: async (
      _: any,
      { meetingId, notes, rating, performanceGrade, attendanceData }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await MeetingBookingService.completeMeeting(meetingId, {
        notes,
        rating,
        performanceGrade,
        attendanceData,
      });
    },

    markMeetingAsNoShow: async (_: any, { meetingId }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await MeetingBookingService.markAsNoShow(meetingId);
    },

    // Task Mutations
    assignTask: async (
      _: any,
      {
        userId,
        assignedBy,
        title,
        description,
        priority,
        dueDate,
        relatedApplication,
        relatedPhase,
        attachments,
        checklist,
      }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await TaskManagementService.assignTaskToUser(userId, assignedBy, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        relatedApplication,
        relatedPhase,
        attachments,
        checklist,
      });
    },

    updateTaskStatus: async (
      _: any,
      { taskId, newStatus, updatedBy, notes }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.updateTaskStatus(taskId, newStatus, updatedBy, notes);
    },

    updateTaskProgressPhase: async (
      _: any,
      { taskId, progressPercentage, updatedBy, notes }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.updateTaskProgress(
        taskId,
        progressPercentage,
        updatedBy,
        notes
      );
    },

    logTimeSpent: async (
      _: any,
      { taskId, duration, notes }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.logTimeSpent(taskId, duration, notes);
    },

    completeChecklistItem: async (
      _: any,
      { taskId, itemIndex }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.completeChecklistItem(taskId, itemIndex);
    },

    cancelTask: async (
      _: any,
      { taskId, cancelledBy, reason }: any,
      context: any
    ) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return await TaskManagementService.cancelTask(taskId, cancelledBy, reason);
    },

    // Performance Grading
    setPerformanceGrade: async (
      _: any,
      { applicationId, grade, color, feedbackType, feedbackBy, notes }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await InternshipApplication.findByIdAndUpdate(
        applicationId,
        {
          $push: {
            performanceGrades: {
              grade,
              color,
              feedbackType,
              feedbackDate: new Date(),
              feedbackBy,
              notes,
            },
          },
        },
        { new: true }
      );
    },

    setInternshipPerformanceGrade: async (
      _: any,
      { internshipId, grade, color, feedbackType, feedbackBy, notes }: any,
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }
      return await Internship.findByIdAndUpdate(
        internshipId,
        {
          $push: {
            performanceGrades: {
              grade,
              color,
              feedbackType,
              feedbackDate: new Date(),
              feedbackBy,
              notes,
            },
          },
        },
        { new: true }
      );
    },
  },
};
