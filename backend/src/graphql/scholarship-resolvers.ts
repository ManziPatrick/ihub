import { Scholarship } from '../models/Scholarship';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { sendNotification } from '../services/notification.service';
import { logActivity } from '../services/audit.service';
import { lookupRequestGeoLocation } from '../services/geoip.service';
import { sendScholarshipRevokedToAdmin, sendScholarshipApprovedToAdmin } from '../services/email.service';

export const scholarshipResolvers = {
  Query: {
    getAllScholarships: async (_: any, { page = 1, limit = 10, status, type }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        Scholarship.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Scholarship.countDocuments(filter)
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
          hasPreviousPage: page > 1
        }
      };
    },

    getUserScholarships: async (_: any, { userId }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      return await Scholarship.find({ userId })
        .sort({ createdAt: -1 });
    },

    getScholarshipStats: async (_: any, __: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      // If super_admin, return all stats. If admin, scope to their own granted scholarships
      const adminFilter: any = {};
      if (context.user.role === 'admin') {
        adminFilter.grantedBy = context.user.id;
      }

      const [totalScholarships, pendingScholarships, activeScholarships, courseScholarships, internshipScholarships, perAdminStats] = await Promise.all([
        Scholarship.countDocuments(adminFilter),
        Scholarship.countDocuments({ ...adminFilter, status: 'pending' }),
        Scholarship.countDocuments({ ...adminFilter, status: 'active' }),
        Scholarship.countDocuments({ ...adminFilter, type: 'course', status: 'active' }),
        Scholarship.countDocuments({ ...adminFilter, type: 'internship', status: 'active' }),
        // Per-admin breakdown (super_admin can see all admins' stats)
        context.user.role === 'super_admin'
          ? (await Scholarship.aggregate([
              { $group: {
                _id: '$grantedBy',
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                revoked: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
              }},
              { $sort: { total: -1 } },
              { $limit: 50 },
            ])).map((stat: any) => ({
              adminId: stat._id,
              total: stat.total,
              pending: stat.pending,
              active: stat.active,
              revoked: stat.revoked,
            }))
          : Promise.resolve([]),
      ]);

      return {
        totalScholarships,
        pendingScholarships,
        activeScholarships,
        courseScholarships,
        internshipScholarships,
        perAdmin: perAdminStats,
      };
    },
  },

  Scholarship: {
    user: async (parent: any) => {
      if (!parent.userId) return null;
      // Check if already populated (has user-specific fields)
      if (typeof parent.userId === 'object' && (parent.userId as any).username) {
        return parent.userId;
      }
      return await User.findById(parent.userId);
    },
    grantedByUser: async (parent: any) => {
      if (!parent.grantedBy) return null;
      if (typeof parent.grantedBy === 'object' && (parent.grantedBy as any).username) {
        return parent.grantedBy;
      }
      return await User.findById(parent.grantedBy);
    },
    revokedByUser: async (parent: any) => {
      if (!parent.revokedBy) return null;
      if (typeof parent.revokedBy === 'object' && (parent.revokedBy as any).username) {
        return parent.revokedBy;
      }
      return await User.findById(parent.revokedBy);
    },
    approvedByUser: async (parent: any) => {
      if (!parent.approvedBy) return null;
      if (typeof parent.approvedBy === 'object' && (parent.approvedBy as any).username) {
        return parent.approvedBy;
      }
      return await User.findById(parent.approvedBy);
    },
  },

  Mutation: {
    grantScholarship: async (_: any, { userId, type, itemId, itemTitle, reason, grantedLatitude, grantedLongitude, grantedCity, grantedCountry }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      // Check user exists
      const student = await User.findById(userId);
      if (!student) throw new Error('Student not found');

      // Validate item exists
      if (type === 'course') {
        const course = await Course.findById(itemId);
        if (!course) throw new Error('Course not found');
      } else if (type === 'internship') {
        const program = await InternshipProgram.findById(itemId);
        if (!program) throw new Error('Internship program not found');
      } else {
        throw new Error('Invalid scholarship type. Must be "course" or "internship"');
      }

      // Determine status based on role: super_admin → active, admin → pending
      const isSuperAdmin = context.user.role === 'super_admin';
      const initialStatus = isSuperAdmin ? 'active' : 'pending';

      // Check for existing active or pending scholarship
      const existing = await Scholarship.findOne({
        userId,
        type,
        itemId,
        status: { $in: ['active', 'pending'] }
      });
      if (existing) {
        throw new Error('Student already has an active or pending scholarship for this item');
      }

      // Resolve location from params or IP fallback
      let resolvedLat = grantedLatitude;
      let resolvedLng = grantedLongitude;
      let resolvedCity = grantedCity;
      let resolvedCountry = grantedCountry;
      if (!resolvedLat && !resolvedLng && context.req) {
        try {
          const geo = await lookupRequestGeoLocation(context.req);
          if (geo.latitude) resolvedLat = geo.latitude;
          if (geo.longitude) resolvedLng = geo.longitude;
          if (geo.city) resolvedCity = geo.city;
          if (geo.country) resolvedCountry = geo.country;
        } catch (e) {}
      }

      // Create the scholarship record
      const scholarship = await Scholarship.create({
        userId,
        grantedBy: context.user.id,
        type,
        itemId,
        itemTitle: itemTitle || (type === 'course' ? (await Course.findById(itemId))?.title : (await InternshipProgram.findById(itemId))?.title) || 'Unknown',
        reason: reason || '',
        status: initialStatus,
        grantedLatitude: resolvedLat ?? undefined,
        grantedLongitude: resolvedLng ?? undefined,
        grantedCity: resolvedCity ?? undefined,
        grantedCountry: resolvedCountry ?? undefined,
      });

      // Only enroll if immediately active (super_admin granted)
      if (initialStatus === 'active' && type === 'course') {
        const course = await Course.findById(itemId);
        if (course) {
          if (!course.studentsEnrolled.some((s: any) => s.toString() === userId)) {
            course.studentsEnrolled.push(userId as any);
            await course.save();
          }
          if (!student.enrolledCourses.some((c: any) => c.toString() === itemId)) {
            student.enrolledCourses.push(itemId as any);
            await student.save();
          }
        }
      }

      // Notify student
      const notificationTitle = initialStatus === 'active'
        ? `${type === 'course' ? 'Course' : 'Internship'} Scholarship Granted!`
        : `${type === 'course' ? 'Course' : 'Internship'} Scholarship Pending Approval`;
      const notificationMessage = initialStatus === 'active'
        ? `You have been granted a scholarship for "${itemTitle}". ${reason ? `Reason: ${reason}` : ''}`
        : `A scholarship for "${itemTitle}" has been requested for you and is pending super admin approval.`;

      try {
        await sendNotification(userId, {
          type: 'SCHOLARSHIP_GRANTED',
          title: notificationTitle,
          message: notificationMessage,
          link: type === 'course' ? `/portal/student/courses/${itemId}` : `/portal/student/internships`,
        });
      } catch (e) {
        // Non-critical
      }

      await logActivity(context.user.id, 'GRANT_SCHOLARSHIP', 'Scholarship', scholarship.id, `${type} scholarship for ${itemTitle} granted to ${student.username} [status: ${initialStatus}]`);

      return scholarship;
    },

    grantBatchScholarships: async (_: any, { userIds, type, itemIds, itemTitles, reason, grantedLatitude, grantedLongitude, grantedCity, grantedCountry }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      const isSuperAdmin = context.user.role === 'super_admin';
      const initialStatus = isSuperAdmin ? 'active' : 'pending';
      let granted = 0;

      // Try to get admin location from IP if browser geolocation not provided
      let resolvedLat = grantedLatitude;
      let resolvedLng = grantedLongitude;
      let resolvedCity = grantedCity;
      let resolvedCountry = grantedCountry;

      if (!resolvedLat && !resolvedLng && context.req) {
        try {
          const geo = await lookupRequestGeoLocation(context.req);
          if (geo.latitude) resolvedLat = geo.latitude;
          if (geo.longitude) resolvedLng = geo.longitude;
          if (geo.city) resolvedCity = geo.city;
          if (geo.country) resolvedCountry = geo.country;
        } catch (e) {
          // Non-critical
        }
      }

      for (const userId of userIds) {
        const student = await User.findById(userId);
        if (!student) continue;

        for (let idx = 0; idx < itemIds.length; idx++) {
          const itemId = itemIds[idx];
          const itemTitle = itemTitles?.[idx] || '';

          if (type === 'course') {
            const course = await Course.findById(itemId);
            if (!course) continue;
          } else if (type === 'internship') {
            const program = await InternshipProgram.findById(itemId);
            if (!program) continue;
          } else {
            continue;
          }

          // Check for existing active or pending scholarship
          const existing = await Scholarship.findOne({
            userId,
            type,
            itemId,
            status: { $in: ['active', 'pending'] }
          });
          if (existing) continue;

          const resolvedTitle = itemTitle || (type === 'course'
            ? (await Course.findById(itemId))?.title
            : (await InternshipProgram.findById(itemId))?.title) || 'Unknown';

          const scholarship = await Scholarship.create({
            userId,
            grantedBy: context.user.id,
            type,
            itemId,
            itemTitle: resolvedTitle,
            reason: reason || '',
            status: initialStatus,
            grantedLatitude: resolvedLat ?? undefined,
            grantedLongitude: resolvedLng ?? undefined,
            grantedCity: resolvedCity ?? undefined,
            grantedCountry: resolvedCountry ?? undefined,
          });

          // Only enroll if immediately active (super_admin granted)
          if (initialStatus === 'active' && type === 'course') {
            const course = await Course.findById(itemId);
            if (course) {
              if (!course.studentsEnrolled.some((s: any) => s.toString() === userId)) {
                course.studentsEnrolled.push(userId as any);
                await course.save();
              }
              if (student && !student.enrolledCourses.some((c: any) => c.toString() === itemId)) {
                student.enrolledCourses.push(itemId as any);
                await student.save();
              }
            }
          }

          const notificationTitle = initialStatus === 'active'
            ? `${type === 'course' ? 'Course' : 'Internship'} Scholarship Granted!`
            : `${type === 'course' ? 'Course' : 'Internship'} Scholarship Pending Approval`;
          const notificationMessage = initialStatus === 'active'
            ? `You have been granted a scholarship for "${resolvedTitle}". ${reason ? `Reason: ${reason}` : ''}`
            : `A scholarship for "${resolvedTitle}" has been requested for you and is pending super admin approval.`;

          try {
            await sendNotification(userId, {
              type: 'SCHOLARSHIP_GRANTED',
              title: notificationTitle,
              message: notificationMessage,
              link: type === 'course' ? `/portal/student/courses/${itemId}` : `/portal/student/internships`,
            });
          } catch (e) {}

          await logActivity(
            context.user.id,
            'GRANT_SCHOLARSHIP',
            'Scholarship',
            scholarship.id,
            `${type} scholarship for ${resolvedTitle} granted to ${student?.username || userId} [status: ${initialStatus}]`
          );

          granted++;
        }
      }

      return granted;
    },

    approveScholarship: async (_: any, { id }: any, context: any) => {
      if (context.user?.role !== 'super_admin') {
        throw new Error('Only super admins can approve scholarships');
      }

      const scholarship = await Scholarship.findById(id);
      if (!scholarship) throw new Error('Scholarship not found');
      if (scholarship.status !== 'pending') throw new Error('Scholarship is not in pending status');

      scholarship.status = 'active';
      scholarship.approvedBy = context.user.id;
      scholarship.approvedAt = new Date();
      await scholarship.save();

      // If it's a course scholarship, enroll the student
      if (scholarship.type === 'course') {
        const course = await Course.findById(scholarship.itemId);
        const student = await User.findById(scholarship.userId);
        if (course) {
          if (!course.studentsEnrolled.some((s: any) => s.toString() === scholarship.userId.toString())) {
            course.studentsEnrolled.push(scholarship.userId as any);
            await course.save();
          }
          if (student && !student.enrolledCourses.some((c: any) => c.toString() === scholarship.itemId.toString())) {
            student.enrolledCourses.push(scholarship.itemId as any);
            await student.save();
          }
        }
      }

      try {
        await sendNotification(scholarship.userId.toString(), {
          type: 'SCHOLARSHIP_APPROVED',
          title: 'Scholarship Approved!',
          message: `Your ${scholarship.type} scholarship for "${scholarship.itemTitle}" has been approved! You now have full access.`,
          link: scholarship.type === 'course' ? `/portal/student/courses/${scholarship.itemId}` : `/portal/student/internships`,
        });
      } catch (e) {}

      // Notify the granting admin that their scholarship was approved
      try {
        const [grantingAdmin, student] = await Promise.all([
          scholarship.grantedBy ? User.findById(scholarship.grantedBy) : Promise.resolve(null),
          User.findById(scholarship.userId),
        ]);
        if (grantingAdmin && grantingAdmin.email) {
          const studentName = student?.fullName || student?.username || scholarship.userId.toString();
          await sendScholarshipApprovedToAdmin(
            grantingAdmin.email,
            grantingAdmin.fullName || grantingAdmin.username || 'Admin',
            studentName,
            scholarship.itemTitle,
            scholarship.type
          );
        }
      } catch (e) {
        // Non-critical — don't block the approval
      }

      await logActivity(context.user.id, 'APPROVE_SCHOLARSHIP', 'Scholarship', scholarship.id, `${scholarship.type} scholarship for ${scholarship.itemTitle} approved`);

      return scholarship;
    },

    revokeScholarship: async (_: any, { id, reason }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      const scholarship = await Scholarship.findById(id);
      if (!scholarship) throw new Error('Scholarship not found');
      if (!['active', 'pending'].includes(scholarship.status)) throw new Error('Scholarship is not active or pending');

      // Capture previous status before overwriting it
      const previousStatus = scholarship.status;

      scholarship.status = 'revoked';
      scholarship.revokedAt = new Date();
      scholarship.revokedBy = context.user.id;
      scholarship.revokedReason = reason;
      await scholarship.save();

      // Notify the student
      try {
        await sendNotification(scholarship.userId.toString(), {
          type: 'SCHOLARSHIP_REVOKED',
          title: 'Scholarship Revoked',
          message: `Your ${scholarship.type} scholarship for "${scholarship.itemTitle}" has been revoked. Reason: ${reason}`,
        });
      } catch (e) {
        // Non-critical
      }

      // Notify the granting admin that their scholarship was denied
      try {
        const [grantingAdmin, student] = await Promise.all([
          scholarship.grantedBy ? User.findById(scholarship.grantedBy) : Promise.resolve(null),
          User.findById(scholarship.userId),
        ]);
        if (grantingAdmin && grantingAdmin.email) {
          const studentName = student?.fullName || student?.username || scholarship.userId.toString();
          await sendScholarshipRevokedToAdmin(
            grantingAdmin.email,
            grantingAdmin.fullName || grantingAdmin.username || 'Admin',
            studentName,
            scholarship.itemTitle,
            scholarship.type,
            previousStatus,
            reason || ''
          );
        }
      } catch (e) {
        // Non-critical — don't block the revocation
      }

      await logActivity(context.user.id, 'REVOKE_SCHOLARSHIP', 'Scholarship', scholarship.id, `${scholarship.type} scholarship for ${scholarship.itemTitle} revoked: ${reason}`);

      return scholarship;
    },
  },
};
