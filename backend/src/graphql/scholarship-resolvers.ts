import { Scholarship } from '../models/Scholarship';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { sendNotification } from '../services/notification.service';
import { logActivity } from '../services/audit.service';

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
          .limit(limit)
          .populate('userId')
          .populate('grantedBy')
          .populate('revokedBy'),
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
        .sort({ createdAt: -1 })
        .populate('userId')
        .populate('grantedBy');
    },

    getScholarshipStats: async (_: any, __: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      const [totalScholarships, activeScholarships, courseScholarships, internshipScholarships] = await Promise.all([
        Scholarship.countDocuments(),
        Scholarship.countDocuments({ status: 'active' }),
        Scholarship.countDocuments({ type: 'course', status: 'active' }),
        Scholarship.countDocuments({ type: 'internship', status: 'active' }),
      ]);

      return {
        totalScholarships,
        activeScholarships,
        courseScholarships,
        internshipScholarships,
      };
    },
  },

  Scholarship: {
    user: async (parent: any) => {
      if (parent.userId) return parent.userId;
      return await User.findById(parent.userId);
    },
    grantedByUser: async (parent: any) => {
      if (parent.grantedBy) return parent.grantedBy;
      return await User.findById(parent.grantedBy);
    },
    revokedByUser: async (parent: any) => {
      if (parent.revokedBy) return parent.revokedBy;
      return await User.findById(parent.revokedBy);
    },
  },

  Mutation: {
    grantScholarship: async (_: any, { userId, type, itemId, itemTitle, reason }: any, context: any) => {
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

      // Check for existing active scholarship
      const existing = await Scholarship.findOne({
        userId,
        type,
        itemId,
        status: 'active'
      });
      if (existing) {
        throw new Error('Student already has an active scholarship for this item');
      }

      // Create the scholarship record
      const scholarship = await Scholarship.create({
        userId,
        grantedBy: context.user.id,
        type,
        itemId,
        itemTitle: itemTitle || (type === 'course' ? (await Course.findById(itemId))?.title : (await InternshipProgram.findById(itemId))?.title) || 'Unknown',
        reason: reason || '',
        status: 'active',
      });

      // If it's a course scholarship, enroll the student in the course for free
      if (type === 'course') {
        const course = await Course.findById(itemId);
        if (course) {
          // Enroll the student
          if (!course.studentsEnrolled.some((s: any) => s.toString() === userId)) {
            course.studentsEnrolled.push(userId as any);
            await course.save();
          }

          // Add course to student's enrolledCourses
          if (!student.enrolledCourses.some((c: any) => c.toString() === itemId)) {
            student.enrolledCourses.push(itemId as any);
            await student.save();
          }
        }
      }

      // Send notification
      try {
        await sendNotification(userId, {
          type: 'SCHOLARSHIP_GRANTED',
          title: `${type === 'course' ? 'Course' : 'Internship'} Scholarship Granted!`,
          message: `You have been granted a scholarship for "${itemTitle}". ${reason ? `Reason: ${reason}` : ''}`,
          link: type === 'course' ? `/portal/student/courses/${itemId}` : `/portal/student/internships`,
        });
      } catch (e) {
        // Non-critical
      }

      await logActivity(context.user.id, 'GRANT_SCHOLARSHIP', 'Scholarship', scholarship.id, `${type} scholarship for ${itemTitle} granted to ${student.username}`);

      return scholarship;
    },

    revokeScholarship: async (_: any, { id, reason }: any, context: any) => {
      if (!['admin', 'super_admin'].includes(context.user?.role)) {
        throw new Error('Not authorized');
      }

      const scholarship = await Scholarship.findById(id);
      if (!scholarship) throw new Error('Scholarship not found');
      if (scholarship.status !== 'active') throw new Error('Scholarship is not active');

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

      await logActivity(context.user.id, 'REVOKE_SCHOLARSHIP', 'Scholarship', scholarship.id, `${scholarship.type} scholarship for ${scholarship.itemTitle} revoked: ${reason}`);

      return scholarship;
    },
  },
};
