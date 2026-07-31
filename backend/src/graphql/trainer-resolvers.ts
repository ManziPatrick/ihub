import { User } from '../models/User';
import { Course } from '../models/Course';
import { InternshipProgram } from '../models/internship/InternshipProgram';

export const trainerResolvers = {
  Query: {
    trainers: async (_: any, { page = 1, limit = 20, search }: any, context: any) => {
      const query: any = {
        role: { $in: ['trainer', 'mentor'] },
        isDeleted: { $ne: true },
        isProfilePublic: true,
        isTrainerApproved: true,
      };

      if (search && search.trim()) {
        const q = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(q, 'i');
        query.$or = [
          { fullName: searchRegex },
          { username: searchRegex },
          { 'trainerApplication.specialties': searchRegex },
          { title: searchRegex },
          { bio: searchRegex },
        ];
      }

      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
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

    trainerPublicProfile: async (_: any, { id }: any, context: any) => {
      const trainer = await User.findById(id).select('-password');
      if (!trainer || !['trainer', 'mentor'].includes(trainer.role)) {
        throw new Error('Trainer not found');
      }

      // Get courses and programs belonging to this trainer
      const courses = await Course.find({ instructor: id, isDeleted: { $ne: true } })
        .select('title descriptionSnippet thumbnail price discountPrice level category studentsEnrolledCount')
        .sort({ createdAt: -1 })
        .limit(20);

      const programs = await InternshipProgram.find({ createdBy: id, isDeleted: { $ne: true } })
        .select('title description duration price currency image status')
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        ...trainer.toObject(),
        trainerCourses: courses,
        trainerPrograms: programs,
      };
    },
  },

  Mutation: {
    becomeTrainer: async (_: any, args: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const user = await User.findById(context.user.id);
      if (!user) throw new Error('User not found');

      // If already pending, auto-approve (images are now provided via the media step)
      // This must come BEFORE the role check, since role was already changed to 'trainer' on first apply
      if (user.trainerApplication?.status === 'pending') {
        user.isTrainerApproved = true;
        user.trainerApplication.status = 'approved';
        if (args.avatar) user.avatar = args.avatar;
        if (args.coverImage) user.coverImage = args.coverImage;
        await user.save();
        const { password, ...safeUser } = user.toObject();
        return safeUser;
      }

      if (user.role !== 'student') throw new Error('Only students can become trainers');

      // Accept avatar + coverImage from args (uploaded during application)
      if (args.avatar) user.avatar = args.avatar;
      if (args.coverImage) user.coverImage = args.coverImage;

      // Check if user has both avatar AND coverImage → auto-approve; otherwise set pending
      const hasAvatar = !!(user.avatar && user.avatar.trim());
      const hasCoverImage = !!(user.coverImage && user.coverImage.trim());
      const shouldAutoApprove = hasAvatar && hasCoverImage;

      user.role = 'trainer';
      user.isTrainerApproved = shouldAutoApprove;
      user.trainerApplication = {
        specialties: args.specialties || [],
        experienceYears: args.experienceYears,
        teachingPhilosophy: args.teachingPhilosophy,
        qualifications: args.qualifications || [],
        rateHourly: args.rateHourly,
        linkedinProfile: args.linkedinProfile,
        githubProfile: args.githubProfile,
        websiteUrl: args.websiteUrl,
        status: shouldAutoApprove ? 'approved' : 'pending',
        appliedAt: new Date(),
      };

      await user.save();

      const { password, ...safeUser } = user.toObject();
      return safeUser;
    },

    approveTrainer: async (_: any, { userId, approved, reviewNote }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Only super admins can approve trainers');
      }

      const trainer = await User.findById(userId);
      if (!trainer) throw new Error('User not found');
      if (trainer.role !== 'trainer') throw new Error('User is not a trainer');

      trainer.isTrainerApproved = approved;
      if (trainer.trainerApplication) {
        trainer.trainerApplication.status = approved ? 'approved' : 'rejected';
        trainer.trainerApplication.reviewedBy = context.user.id;
        trainer.trainerApplication.reviewNote = reviewNote || '';
      }

      await trainer.save();

      const { password, ...safeUser } = trainer.toObject();
      return safeUser;
    },
  },
};
