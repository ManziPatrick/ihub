import ScheduledBroadcast from '../models/ScheduledBroadcast';
import { User } from '../models/User';
import { InternshipTeamMember } from '../models/internship/TeamMember';
import Notification from '../models/Notification';
import { sendBroadcastAnnouncement } from '../services/email.service';
import { sendNotification } from '../services/notification.service';

// Email template moved to email.service.ts - sendBroadcastAnnouncement()

/** Core sending logic — shared between immediate and scheduled sends */
export async function executeBroadcast(record: any): Promise<{
  success: boolean;
  totalRecipients: number;
  notificationsSent: number;
  emailsSent: number;
  errors: string[];
}> {
  const { title, message, link, targetRole, userIds, teamIds, sendEmail: sendEmailFlag, sendNotification: sendNotifFlag } = record;

  const targetUserIds = new Set<string>();

  if (targetRole) {
    const roleUsers = await User.find({ role: targetRole, isDeleted: { $ne: true } }).select('_id');
    roleUsers.forEach((u: any) => targetUserIds.add(u._id.toString()));
  }

  if (userIds && userIds.length > 0) {
    userIds.forEach((id: string) => targetUserIds.add(id));
  }

  if (teamIds && teamIds.length > 0) {
    const teamMembers = await InternshipTeamMember.find({ teamId: { $in: teamIds }, isDeleted: false });
    teamMembers.forEach((m: any) => targetUserIds.add(m.userId.toString()));
  }

  const userIdArray = Array.from(targetUserIds);
  let notificationsSent = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const uid of userIdArray) {
    try {
      if (sendNotifFlag) {
        await sendNotification(uid, {
          type: 'bulk_announcement',
          title,
          message,
          link: link || null,
        });
        notificationsSent++;
      }

      if (sendEmailFlag) {
        const user = await User.findById(uid).select('email fullName username');
        if (user && user.email) {
          const name = (user as any).fullName || (user as any).username || 'there';
          const sent = await sendBroadcastAnnouncement(user.email, name, title, message, link);
          if (sent) emailsSent++;
        }
      }
    } catch (err: any) {
      errors.push(`Failed for user ${uid}: ${err.message}`);
      console.error('[ScheduledBroadcast] Error:', err.message);
    }
  }

  return {
    success: errors.length === 0,
    totalRecipients: userIdArray.length,
    notificationsSent,
    emailsSent,
    errors: errors.length > 0 ? errors : [],
  };
}

export const scheduledBroadcastResolvers = {
  Query: {
    scheduledBroadcasts: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      const { page = 1, limit = 50, status } = args;
      const query: any = {};
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        ScheduledBroadcast.find(query)
          .populate('createdBy', 'username email fullName')
          .sort({ scheduledAt: -1 })
          .skip(skip)
          .limit(limit),
        ScheduledBroadcast.countDocuments(query),
      ]);

      return {
        items,
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
  },

  Mutation: {
    scheduleBroadcast: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      const { title, message, link, targetRole, userIds, teamIds, sendEmail, sendNotification, scheduledAt } = args;

      if (!title || !message) {
        throw new Error('Title and message are required');
      }
      if (!sendEmail && !sendNotification) {
        throw new Error('At least one of sendEmail or sendNotification must be true');
      }
      if (!scheduledAt) {
        throw new Error('Scheduled date/time is required');
      }

      const scheduleDate = new Date(scheduledAt);
      if (isNaN(scheduleDate.getTime())) {
        throw new Error('Invalid scheduled date/time');
      }
      if (scheduleDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const broadcast = await ScheduledBroadcast.create({
        title,
        message,
        link: link || null,
        targetRole: targetRole || null,
        userIds: userIds || [],
        teamIds: teamIds || [],
        sendEmail,
        sendNotification,
        scheduledAt: scheduleDate,
        status: 'pending',
        createdBy: context.user.id,
      });

      return broadcast;
    },

    cancelScheduledBroadcast: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      const broadcast = await ScheduledBroadcast.findById(id);
      if (!broadcast) throw new Error('Scheduled broadcast not found');
      if (broadcast.status !== 'pending') {
        throw new Error('Can only cancel pending broadcasts');
      }

      broadcast.status = 'cancelled';
      await broadcast.save();
      return broadcast;
    },

    updateScheduledBroadcast: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      const { id, title, message, link, targetRole, userIds, teamIds, sendEmail, sendNotification, scheduledAt } = args;

      const broadcast = await ScheduledBroadcast.findById(id);
      if (!broadcast) throw new Error('Scheduled broadcast not found');
      if (broadcast.status !== 'pending') {
        throw new Error('Can only edit pending broadcasts');
      }

      // Build update fields
      const update: any = {};
      if (title !== undefined) update.title = title;
      if (message !== undefined) update.message = message;
      if (link !== undefined) update.link = link || null;
      if (targetRole !== undefined) update.targetRole = targetRole || null;
      if (userIds !== undefined) update.userIds = userIds || [];
      if (teamIds !== undefined) update.teamIds = teamIds || [];
      if (sendEmail !== undefined) update.sendEmail = sendEmail;
      if (sendNotification !== undefined) update.sendNotification = sendNotification;

      if (scheduledAt !== undefined) {
        const scheduleDate = new Date(scheduledAt);
        if (isNaN(scheduleDate.getTime())) {
          throw new Error('Invalid scheduled date/time');
        }
        if (scheduleDate <= new Date()) {
          throw new Error('Scheduled time must be in the future');
        }
        update.scheduledAt = scheduleDate;
      }

      const updated = await ScheduledBroadcast.findByIdAndUpdate(id, { $set: update }, { new: true });
      return updated;
    },

    deleteScheduledBroadcast: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      await ScheduledBroadcast.findByIdAndDelete(id);
      return true;
    },
  },

  ScheduledBroadcast: {
    createdBy: async (parent: any) => {
      if (parent.createdBy && typeof parent.createdBy === 'object') return parent.createdBy;
      return parent.createdBy;
    },
  },
};
