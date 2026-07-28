import { EventApplication } from '../models/EventApplication';
import { Event } from '../models/Event';
import { logActivity } from '../services/audit.service';
import { sendNotification } from '../services/notification.service';

export const eventApplicationResolvers = {
  EventApplication: {
    event: async (parent: any) => {
      return await Event.findById(parent.eventId);
    },
    user: async (parent: any) => {
      const { User } = require('../models/User');
      return await User.findById(parent.userId);
    },
  },
  Query: {
    eventApplications: async (_: any, { eventId, status, page = 1, limit = 10 }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const query: any = { isDeleted: false };
      if (eventId) query.eventId = eventId;
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        EventApplication.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        EventApplication.countDocuments(query),
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
          hasPreviousPage: page > 1,
        },
      };
    },

    myEventApplications: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      return await EventApplication.find({ userId: context.user.id, isDeleted: false }).sort({ createdAt: -1 });
    },
  },
  Mutation: {
    applyToEvent: async (_: any, { eventId, applicationAnswers, selectedDeliveryMode }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const event = await Event.findById(eventId);
      if (!event) throw new Error('Event not found');

      // Check for duplicate application
      const existing = await EventApplication.findOne({ eventId, userId: context.user.id, isDeleted: false });
      if (existing) throw new Error('You have already applied to this event');

      const application = new EventApplication({
        eventId,
        userId: context.user.id,
        applicationAnswers: applicationAnswers || [],
        selectedDeliveryMode,
        status: 'pending',
      });

      const saved = await application.save();

      await logActivity(context.user.id, 'APPLY', 'EventApplication', saved.id, `Applied to event: ${event.title}`);

      return saved;
    },

    reviewEventApplication: async (_: any, { id, status, rejectionReason }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const application = await EventApplication.findById(id).populate('eventId userId');
      if (!application) throw new Error('Application not found');

      const updateData: any = { status };
      if (rejectionReason) updateData.rejectionReason = rejectionReason;

      const updated = await EventApplication.findByIdAndUpdate(id, updateData, { new: true });

      if (updated) {
        await logActivity(context.user.id, 'REVIEW', 'EventApplication', id, `Reviewed application status to: ${status}`);

        // Notify the applicant
        const user: any = (application as any).userId;
        const event: any = (application as any).eventId;
        if (user) {
          await sendNotification(
            user._id?.toString() || user.toString(),
            {
              type: 'application_status_update',
              title: `Application ${status}`,
              message: `Your application for "${event?.title || 'the event'}" has been ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
              link: `/events/${event}`,
            }
          );
        }
      }

      return updated;
    },

    enrollEventApplicant: async (_: any, { applicationId }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }

      const application = await EventApplication.findById(applicationId);
      if (!application) throw new Error('Application not found');

      // Update status to approved if not already
      if (application.status !== 'approved') {
        application.status = 'approved';
        await application.save();
      }

      // Return the user
      const { User } = require('../models/User');
      return await User.findById(application.userId);
    },
  },
};
