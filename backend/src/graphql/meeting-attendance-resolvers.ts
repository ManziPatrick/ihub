import { GraphQLError } from "graphql";
import { InternshipMeeting } from '../models/internship/InternshipMeeting';
import { logActivity } from '../services/audit.service';
import mongoose from 'mongoose';

export const meetingAttendanceResolvers = {
  Query: {
    getMeetingAttendance: async (_: any, { meetingId }: { meetingId: string }, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const meeting = await InternshipMeeting.findById(meetingId).populate('attendees.userId');
      if (!meeting) throw new Error('Meeting not found');
      return meeting.attendees || [];
    },
  },

  Mutation: {
    // Must be a function value nested under the Mutation object
    markAttendance: async (
      _: any,
      { meetingId, userId, attended }: { meetingId: string; userId: string; attended: boolean },
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });

      const meeting = await InternshipMeeting.findById(meetingId);
      if (!meeting) throw new Error('Meeting not found');

      const existingIdx = meeting.attendees.findIndex((a: any) => a.userId.toString() === userId);
      if (existingIdx >= 0) {
        meeting.attendees[existingIdx].attended = attended;
        if (attended) meeting.attendees[existingIdx].attendedAt = new Date();
      } else {
        meeting.attendees.push({
          userId: new mongoose.Types.ObjectId(userId),
          role: 'participant',
          attended,
          attendedAt: attended ? new Date() : undefined,
        } as any);
      }

      await meeting.save();
      await logActivity(
        context.user.id,
        'UPDATE',
        'InternshipMeeting',
        meetingId,
        `${attended ? 'Marked present' : 'Marked absent'}: user ${userId}`
      );

      return meeting;
    },

    batchMarkAttendance: async (
      _: any,
      { meetingId, attendanceData }: {
        meetingId: string;
        attendanceData: Array<{ userId: string; attended: boolean }>;
      },
      context: any
    ) => {
      if (!['admin', 'super_admin', 'trainer'].includes(context.user?.role)) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });

      const meeting = await InternshipMeeting.findById(meetingId);
      if (!meeting) throw new Error('Meeting not found');

      for (const entry of attendanceData) {
        const existingIdx = meeting.attendees.findIndex((a: any) => a.userId.toString() === entry.userId);
        if (existingIdx >= 0) {
          meeting.attendees[existingIdx].attended = entry.attended;
          if (entry.attended) meeting.attendees[existingIdx].attendedAt = new Date();
        } else {
          meeting.attendees.push({
            userId: new mongoose.Types.ObjectId(entry.userId),
            role: 'participant',
            attended: entry.attended,
            attendedAt: entry.attended ? new Date() : undefined,
          } as any);
        }
      }

      await meeting.save();
      await logActivity(
        context.user.id,
        'UPDATE',
        'InternshipMeeting',
        meetingId,
        `Batch attendance marked (${attendanceData.length} entries)`
      );

      return meeting;
    },
  },
};
