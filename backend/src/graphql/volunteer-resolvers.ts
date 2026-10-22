import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { VolunteerApplication } from '../models/VolunteerApplication';
import { User } from '../models/User';
import TeamMember from '../models/TeamMember';
import { sendEmail } from '../services/email.service';
import { hasPermission } from './permissions';

function requireStaff(context: any) {
  if (!context?.user) throw new GraphQLError('Sign in required', { extensions: { code: 'UNAUTHENTICATED' } });
  if (context.user.role === 'super_admin') return;
  if (context.user.role === 'admin' && hasPermission(context, 'users')) return;
  throw new GraphQLError('Only super admins or admins with user access can review volunteers.', {
    extensions: { code: 'FORBIDDEN' },
  });
}

function tempPassword() {
  return `Bs-${crypto.randomBytes(5).toString('hex')}!`;
}

async function uniqueUsername(base: string) {
  const cleaned = base.replace(/[^a-z0-9_]/gi, '').slice(0, 18).toLowerCase() || 'volunteer';
  let name = cleaned;
  let n = 0;
  while (await User.findOne({ username: name })) {
    n += 1;
    name = `${cleaned}${n}`;
  }
  return name;
}

export const volunteerResolvers = {
  VolunteerApplication: {
    id: (p: any) => String(p.id || p._id),
    createdAt: (p: any) => (p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt),
    reviewedAt: (p: any) =>
      p.reviewedAt instanceof Date ? p.reviewedAt.toISOString() : p.reviewedAt || null,
  },
  Query: {
    volunteerApplications: async (_: any, { status, page = 1, limit = 20 }: any, context: any) => {
      requireStaff(context);
      const query: any = {};
      if (status && status !== 'all') query.status = status;
      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        VolunteerApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        VolunteerApplication.countDocuments(query),
      ]);
      return {
        items,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          currentPage: page,
          pageSize: limit,
          hasNextPage: skip + items.length < totalCount,
          hasPreviousPage: page > 1,
        },
      };
    },
  },

  Mutation: {
    reviewVolunteerApplication: async (
      _: any,
      { id, approved, assignedRole, isProfilePublic, reviewNote }: any,
      context: any
    ) => {
      requireStaff(context);
      const app = await VolunteerApplication.findById(id);
      if (!app) throw new GraphQLError('Application not found');
      if (app.status !== 'pending') throw new GraphQLError('This application was already reviewed.');

      app.reviewedBy = context.user.id;
      app.reviewNote = reviewNote || '';
      app.reviewedAt = new Date();

      if (!approved) {
        app.status = 'rejected';
        await app.save();
        return { application: app, loginEmail: null, temporaryPassword: null };
      }

      const role =
        assignedRole === 'admin' ? 'admin' : assignedRole === 'trainer' ? 'trainer' : app.wantedRole === 'admin' ? 'admin' : 'trainer';
      const makePublic = isProfilePublic === true;
      const password = tempPassword();
      const hashed = await bcrypt.hash(password, 10);

      let user = await User.findOne({ email: app.email, isDeleted: { $ne: true } });
      if (!user) {
        user = new User({
          username: await uniqueUsername(app.name.split(' ')[0] || 'volunteer'),
          email: app.email,
          password: hashed,
          fullName: app.name,
          phone: app.phone,
          location: app.city,
          role,
          status: 'active',
          isEmailVerified: true,
          isTrainerApproved: role === 'trainer',
          isProfilePublic: makePublic,
          title: role === 'admin' ? 'Volunteer admin' : 'Volunteer trainer',
          bio: app.about.slice(0, 400),
          permissions: role === 'admin' ? ['users', 'courses', 'students'] : [],
          trainerApplication:
            role === 'trainer'
              ? {
                  specialties: app.skills ? app.skills.split(',').map((s) => s.trim()).filter(Boolean) : ['Volunteer'],
                  teachingPhilosophy: app.about.slice(0, 400),
                  linkedinProfile: app.linkedin,
                  status: 'approved',
                  appliedAt: app.createdAt,
                  reviewedBy: context.user.id,
                  reviewNote: reviewNote || 'Approved from volunteer application',
                }
              : undefined,
        });
        await user.save();
      } else {
        user.role = role;
        user.password = hashed;
        user.status = 'active';
        user.isDeleted = false;
        user.isTrainerApproved = role === 'trainer';
        user.isProfilePublic = makePublic;
        if (role === 'admin' && (!user.permissions || user.permissions.length === 0)) {
          user.permissions = ['users', 'courses', 'students'];
        }
        await user.save();
      }

      if (makePublic) {
        const exists = await TeamMember.findOne({ name: app.name });
        if (!exists) {
          await TeamMember.create({
            name: app.name,
            role: role === 'admin' ? 'Admin (volunteer)' : 'Trainer (volunteer)',
            bio: app.about.slice(0, 280),
            image: user.avatar || '',
            linkedin: app.linkedin || '',
            twitter: '',
            github: '',
          });
        }
      }

      app.status = 'approved';
      app.assignedRole = role;
      app.isProfilePublic = makePublic;
      app.createdUserId = user._id;
      await app.save();

      const site = process.env.FRONTEND_URL || 'https://bootskills.com';
      await sendEmail({
        to: app.email,
        subject: 'Your Bootskills volunteer account is ready',
        html: `<p>Hi ${app.name},</p>
          <p>Your volunteer application was approved. You can sign in as a <strong>${role}</strong>.</p>
          <p>Email: ${app.email}<br/>Temporary password: ${password}</p>
          <p>Sign in: <a href="${site}/auth">${site}/auth</a></p>
          <p>Change this password after you log in. Profile on the public site: ${makePublic ? 'visible' : 'private'}.</p>
          <p>— Bootskills</p>`,
      });

      return {
        application: app,
        loginEmail: app.email,
        temporaryPassword: password,
      };
    },
  },
};
