import { ApplicationMeeting, IApplicationMeeting } from '../models/ApplicationMeeting';
import { InternshipApplication } from '../models/internship/InternshipApplication';
import { sendNotification } from './notification.service';

export class MeetingBookingService {
  /**
   * Schedule a meeting for an application
   */
  static async scheduleApplicationMeeting(
    applicationId: string,
    phaseId: string,
    scheduledBy: string,
    meetingData: {
      scheduledFor: string;
      meetingType: string;
      title: string;
      description?: string;
      scheduledDate: Date;
      scheduledTime: string;
      duration?: number;
      location?: string;
      meetingLink?: string;
      attendees?: any[];
    }
  ): Promise<IApplicationMeeting> {
    const meeting = new ApplicationMeeting({
      applicationId,
      phaseId,
      scheduledBy,
      scheduledFor: meetingData.scheduledFor,
      meetingType: meetingData.meetingType,
      title: meetingData.title,
      description: meetingData.description,
      scheduledDate: meetingData.scheduledDate,
      scheduledTime: meetingData.scheduledTime,
      duration: meetingData.duration || 30,
      location: meetingData.location,
      meetingLink: meetingData.meetingLink,
      attendees: meetingData.attendees || [
        { userId: scheduledBy, role: 'interviewer' },
        { userId: meetingData.scheduledFor, role: 'candidate' },
      ],
    });

    const saved = await meeting.save();

    // Send notification to candidate
    await sendNotification(
      meetingData.scheduledFor,
      {
        type: 'meeting_scheduled',
        title: `Interview Scheduled: ${meetingData.title}`,
        message: `Your interview has been scheduled for ${meetingData.scheduledDate.toDateString()} at ${meetingData.scheduledTime}`,
        link: `/portal/student/application/${applicationId}`,
      }
    );

    return saved;
  }

  /**
   * Confirm a meeting
   */
  static async confirmMeeting(
    meetingId: string,
    confirmedBy: string
  ): Promise<IApplicationMeeting | null> {
    const meeting = await ApplicationMeeting.findByIdAndUpdate(
      meetingId,
      {
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy,
      },
      { new: true }
    );

    if (meeting) {
      // Send confirmation notification
      await sendNotification(
        meeting.scheduledFor.toString(),
        {
          type: 'meeting_confirmed',
          title: `Interview Confirmed: ${meeting.title}`,
          message: `Your interview has been confirmed for ${meeting.scheduledDate.toDateString()} at ${meeting.scheduledTime}`,
          link: `/portal/student/application/${meeting.applicationId}`,
        }
      );
    }

    return meeting;
  }

  /**
   * Cancel a meeting
   */
  static async cancelMeeting(
    meetingId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<IApplicationMeeting | null> {
    const meeting = await ApplicationMeeting.findByIdAndUpdate(
      meetingId,
      {
        status: 'cancelled',
      },
      { new: true }
    );

    if (meeting) {
      await sendNotification(
        meeting.scheduledFor.toString(),
        {
          type: 'meeting_cancelled',
          title: `Interview Cancelled: ${meeting.title}`,
          message: `Your interview scheduled for ${meeting.scheduledDate.toDateString()} has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
          link: `/portal/student/application/${meeting.applicationId}`,
        }
      );
    }

    return meeting;
  }

  /**
   * Complete a meeting and record feedback
   */
  static async completeMeeting(
    meetingId: string,
    completionData: {
      notes: string;
      rating?: number;
      performanceGrade?: {
        grade: string;
        color: 'red' | 'yellow' | 'green';
      };
      attendanceData?: Array<{
        userId: string;
        attended: boolean;
      }>;
    }
  ): Promise<IApplicationMeeting | null> {
    const updateData: any = {
      status: 'completed',
      completedAt: new Date(),
      meetingNotes: completionData.notes,
    };

    if (completionData.rating || completionData.performanceGrade) {
      updateData.feedback = {
        rating: completionData.rating,
        comments: completionData.notes,
        performanceGrade: completionData.performanceGrade,
      };
    }

    // Update attendees if provided
    if (completionData.attendanceData) {
      updateData.attendees = completionData.attendanceData.map(a => ({
        ...a,
        attended: a.attended,
      }));
    }

    return ApplicationMeeting.findByIdAndUpdate(meetingId, updateData, { new: true });
  }

  /**
   * Get meetings for an application
   */
  static async getMeetingsByApplication(applicationId: string): Promise<IApplicationMeeting[]> {
    return ApplicationMeeting.find({ applicationId }).sort({ scheduledDate: 1 });
  }

  /**
   * Get pending meetings for an admin
   */
  static async getPendingMeetingsByAdmin(adminId: string): Promise<IApplicationMeeting[]> {
    return ApplicationMeeting.find({
      scheduledBy: adminId,
      status: { $in: ['scheduled', 'confirmed'] },
    })
      .populate('applicationId')
      .populate('scheduledFor', 'firstName lastName email')
      .sort({ scheduledDate: 1 });
  }

  /**
   * Get upcoming meetings for a user (student/admin)
   */
  static async getUpcomingMeetings(
    userId: string,
    daysAhead: number = 30
  ): Promise<IApplicationMeeting[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    return ApplicationMeeting.find({
      $or: [
        { scheduledBy: userId },
        { scheduledFor: userId },
      ],
      status: { $in: ['scheduled', 'confirmed'] },
      scheduledDate: { $gte: startDate, $lte: endDate },
    }).sort({ scheduledDate: 1 });
  }

  /**
   * Mark meeting as no-show
   */
  static async markAsNoShow(meetingId: string): Promise<IApplicationMeeting | null> {
    return ApplicationMeeting.findByIdAndUpdate(
      meetingId,
      { status: 'no_show', completedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Get meeting attendance report for a program
   */
  static async getAttendanceReport(phaseId: string): Promise<any> {
    const meetings = await ApplicationMeeting.find({
      phaseId,
      status: 'completed',
    }).populate('applicationId');

    return {
      total: meetings.length,
      completed: meetings.filter(m => m.status === 'completed').length,
      noShow: meetings.filter(m => m.status === 'no_show').length,
      meetings,
    };
  }
}
