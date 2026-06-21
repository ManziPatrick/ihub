import { User } from '../models/User';
import { InternshipTeamMember } from '../models/internship/TeamMember';
import Notification from '../models/Notification';
import { sendBroadcastAnnouncement } from '../services/email.service';
import { sendNotification } from '../services/notification.service';
import { pusher } from '../lib/pusher';

// Email template moved to email.service.ts - sendBroadcastAnnouncement()

export const broadcastResolvers = {
  Mutation: {
    sendBulkNotification: async (_: any, args: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized — super_admin only');
      }

      const { title, message, link, targetRole, userIds, teamIds, sendEmail: sendEmailFlag, sendNotification: sendNotifFlag } = args;

      if (!title || !message) {
        throw new Error('Title and message are required');
      }
      if (!sendEmailFlag && !sendNotifFlag) {
        throw new Error('At least one of sendEmail or sendNotification must be true');
      }

      // Resolve target users
      const targetUserIds = new Set<string>();

      // Add by role
      if (targetRole) {
        const roleUsers = await User.find({ role: targetRole, isDeleted: { $ne: true } }).select('_id');
        roleUsers.forEach((u: any) => targetUserIds.add(u._id.toString()));
      }

      // Add by specific IDs
      if (userIds && userIds.length > 0) {
        userIds.forEach((id: string) => targetUserIds.add(id));
      }

      // Add by team IDs
      if (teamIds && teamIds.length > 0) {
        const teamMembers = await InternshipTeamMember.find({ teamId: { $in: teamIds }, isDeleted: false });
        teamMembers.forEach((m: any) => targetUserIds.add(m.userId.toString()));
      }

      if (targetUserIds.size === 0) {
        throw new Error('No recipients found for the given criteria');
      }

      const userIdArray = Array.from(targetUserIds);

      // Deliver
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
          console.error('[BulkNotification] Error:', err.message);
        }
      }

      return {
        success: errors.length === 0,
        totalRecipients: userIdArray.length,
        notificationsSent,
        emailsSent,
        errors: errors.length > 0 ? errors : null,
      };
    },
  },
};
