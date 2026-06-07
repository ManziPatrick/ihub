import { InternshipApplication } from '../models/internship/InternshipApplication';
import { ApplicationPhaseSubmission } from '../models/ApplicationPhaseSubmission';
import { ApplicationPhase } from '../models/ApplicationPhase';
import { sendNotification } from './notification.service';

export class ApplicationWorkflowService {
  /**
   * Submit a deliverable for a phase
   */
  static async submitPhaseDeliverable(
    applicationId: string,
    phaseId: string,
    submissionData: any[]
  ): Promise<any> {
    // Mark any previous submissions as not latest
    await ApplicationPhaseSubmission.updateMany(
      { applicationId, phaseId },
      { isLatestSubmission: false }
    );

    // Get previous submission count
    const previousSubmissions = await ApplicationPhaseSubmission.countDocuments({
      applicationId,
      phaseId,
    });

    const submission = new ApplicationPhaseSubmission({
      applicationId,
      phaseId,
      submissionData,
      submissionNumber: previousSubmissions + 1,
      isLatestSubmission: true,
    });

    const saved = await submission.save();

    // Update application status
    await InternshipApplication.findByIdAndUpdate(
      applicationId,
      { phasedStatus: 'awaiting_review', currentPhaseId: phaseId },
      { new: true }
    );

    return saved;
  }

  /**
   * Get application progress
   */
  static async getApplicationProgress(applicationId: string): Promise<any> {
    const application = await InternshipApplication.findById(applicationId)
      .populate('currentPhaseId')
      .populate('phaseCompletionHistory.phaseId');

    if (!application) return null;

    const phases = await ApplicationPhase.find({
      _id: { $in: application.phaseCompletionHistory?.map(h => h.phaseId) || [] }
    }).sort({ order: 1 });

    const currentPhase = application.currentPhaseId;

    return {
      application,
      currentPhase,
      completedPhases: application.phaseCompletionHistory || [],
      totalPhases: phases.length,
    };
  }

  /**
   * Approve a phase submission and move to next phase
   */
  static async approvePhaseSubmission(
    applicationId: string,
    phaseId: string,
    approvalData: {
      approvedBy: string;
      notes?: string;
      moveToNextPhase?: boolean;
    }
  ): Promise<any> {
    // Update submission status
    await ApplicationPhaseSubmission.updateOne(
      { applicationId, phaseId, isLatestSubmission: true },
      {
        reviewStatus: 'approved',
        reviewedBy: approvalData.approvedBy,
        reviewedAt: new Date(),
        reviewNotes: approvalData.notes,
      }
    );

    // Update application
    const updateData: any = {
      phasedStatus: 'approved_to_next',
    };

    if (approvalData.moveToNextPhase) {
      // Get next phase
      const currentPhase = await ApplicationPhase.findById(phaseId);
      if (currentPhase) {
        const nextPhase = await ApplicationPhase.findOne({
          programId: currentPhase.programId,
          order: { $gt: currentPhase.order },
        }).sort({ order: 1 });

        if (nextPhase) {
          updateData.currentPhaseId = nextPhase._id;
          updateData.phasedStatus = 'in_phase';

          // Add to completion history
          updateData.$push = {
            phaseCompletionHistory: {
              phaseId,
              completedAt: new Date(),
              approvedBy: approvalData.approvedBy,
              notes: approvalData.notes,
            }
          };
        } else {
          // No next phase - application is complete
          updateData.status = 'approved';
        }
      }
    }

    const updated = await InternshipApplication.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true }
    );

    // Send notification to student
    const user = await updated?.populate('userId');
    if (user?.userId) {
      await sendNotification(
        user.userId._id.toString(),
        {
          type: 'phase_approved',
          title: 'Application Phase Approved',
          message: `Your submission for the current phase has been approved. ${approvalData.moveToNextPhase ? 'You can now proceed to the next phase.' : ''}`,
          link: `/portal/student/application/${applicationId}`,
        }
      );
    }

    return updated;
  }

  /**
   * Reject a phase submission
   */
  static async rejectPhaseSubmission(
    applicationId: string,
    phaseId: string,
    rejectData: {
      rejectedBy: string;
      rejectionReason: string;
      allowResubmission?: boolean;
    }
  ): Promise<any> {
    // Update submission status
    await ApplicationPhaseSubmission.updateOne(
      { applicationId, phaseId, isLatestSubmission: true },
      {
        reviewStatus: 'rejected',
        reviewedBy: rejectData.rejectedBy,
        reviewedAt: new Date(),
        rejectionReason: rejectData.rejectionReason,
      }
    );

    const updateData = {
      phasedStatus: 'rejected' as const,
    };

    const updated = await InternshipApplication.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true }
    );

    // Send notification to student
    const user = await updated?.populate('userId');
    if (user?.userId) {
      await sendNotification(
        user.userId._id.toString(),
        {
          type: 'phase_rejected',
          title: 'Application Phase Rejected',
          message: `Your submission has been reviewed. ${rejectData.allowResubmission ? 'You may resubmit.' : 'Unfortunately, you were not selected.'}`,
          link: `/portal/student/application/${applicationId}`,
        }
      );
    }

    return updated;
  }

  /**
   * Move application to a specific phase
   */
  static async moveToPhase(
    applicationId: string,
    phaseId: string,
    movedBy: string,
    notes?: string
  ): Promise<any> {
    const phase = await ApplicationPhase.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const updated = await InternshipApplication.findByIdAndUpdate(
      applicationId,
      {
        currentPhaseId: phaseId,
        phasedStatus: 'in_phase',
      },
      { new: true }
    );

    // Send notification
    const user = await updated?.populate('userId');
    if (user?.userId) {
      await sendNotification(
        user.userId._id.toString(),
        {
          type: 'phase_moved',
          title: `Moved to ${phase.name}`,
          message: `You have been moved to the ${phase.name} phase of the application.`,
          link: `/portal/student/application/${applicationId}`,
        }
      );
    }

    return updated;
  }

  /**
   * Get applicants by phase
   */
  static async getApplicantsByPhase(programId: string, phaseId: string): Promise<any[]> {
    return InternshipApplication.find({
      currentPhaseId: phaseId,
    })
      .populate('userId', 'firstName lastName email')
      .populate('currentPhaseId');
  }

  /**
   * Request revision for a submission
   */
  static async requestRevision(
    applicationId: string,
    phaseId: string,
    revisionData: {
      requestedBy: string;
      revisionNotes: string;
    }
  ): Promise<any> {
    await ApplicationPhaseSubmission.updateOne(
      { applicationId, phaseId, isLatestSubmission: true },
      {
        reviewStatus: 'revision_requested',
        reviewedBy: revisionData.requestedBy,
        reviewedAt: new Date(),
        revisionRequestNotes: revisionData.revisionNotes,
      }
    );

    const updated = await InternshipApplication.findByIdAndUpdate(
      applicationId,
      { phasedStatus: 'awaiting_review' },
      { new: true }
    );

    // Send notification
    const user = await updated?.populate('userId');
    if (user?.userId) {
      await sendNotification(
        user.userId._id.toString(),
        {
          type: 'revision_requested',
          title: 'Revision Requested',
          message: `Your submission requires revision. Please address the feedback and resubmit.`,
          link: `/portal/student/application/${applicationId}`,
        }
      );
    }

    return updated;
  }
}
