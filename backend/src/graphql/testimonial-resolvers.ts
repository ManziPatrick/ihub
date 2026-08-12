import { Testimonial } from '../models/Testimonial';
import { User } from '../models/User';

// Coerce a populated User sub-doc into a safe shape. Legacy/Google accounts can
// have null username/email, but User.username and User.email are non-nullable
// GraphQL fields — so fall back to derived values instead of crashing the query.
const safeUserSub = (u: any) => {
  if (!u) return null;
  const base = u._id ? { ...u, id: u._id.toString() } : u;
  return {
    ...base,
    username: u.username || u.fullName || u.email || 'user',
    email: u.email || `${u.username || 'user'}@bootskills.com`,
    fullName: u.fullName || u.username || '',
  };
};

// A value of 'N/A' / '' means "not provided" — normalize so UIs never render
// a literal "N/A" in the role · company line.
const cleanLabel = (v: any) =>
  typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'n/a' ? v.trim() : '';

const safeUserShape = (t: any) => {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id: (t._id || t.id).toString(),
    _id: (t._id || t.id).toString(),
    author: safeUserSub(obj.author),
    authorName: obj.authorName || obj.author?.fullName || obj.author?.username || '',
    authorRole: cleanLabel(obj.authorRole),
    authorCompany: cleanLabel(obj.authorCompany),
    authorAvatar: obj.authorAvatar || obj.author?.avatar || null,
    submittedBy: safeUserSub(obj.submittedBy),
    status: obj.status || 'pending',
    // Some records (legacy/seed) lack timestamps — fall back to review time.
    createdAt: obj.createdAt || obj.reviewedAt || null,
  };
};

const snapshotAuthor = (author: any) => ({
  authorName: author.fullName || author.username || author.email?.split('@')[0] || 'Student',
  authorRole: author.title || '',
  authorCompany: author.school || '',
  authorAvatar: author.avatar || null,
});

export const testimonialResolvers = {
  Query: {
    // Public site — only approved testimonials, no auth required.
    publicTestimonials: async () => {
      const items = await Testimonial.find({ status: 'approved' })
        .populate('author', 'fullName username email avatar title school')
        .sort({ createdAt: -1 })
        .limit(50);
      return items.map(safeUserShape);
    },

    // A student's own submissions - any authenticated user.
    myTestimonials: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const items = await Testimonial.find({ author: context.user.id })
        .populate('author', 'fullName username email avatar title school')
        .sort({ createdAt: -1 })
        .limit(50);
      return items.map(safeUserShape);
    },

    // Admin / super admin moderation view — all statuses, paginated, filterable.
    testimonials: async (_: any, { page = 1, limit = 12, status }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const query: any = {};
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query.status = status;
      }
      const skip = (page - 1) * limit;
      const [items, totalCount] = await Promise.all([
        Testimonial.find(query)
          .populate('author', 'fullName username email avatar title school')
          .populate('submittedBy', 'fullName username email avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Testimonial.countDocuments(query),
      ]);
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      return {
        items: items.map(safeUserShape),
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
  },

  Mutation: {
    // A student submits their own success story → status pending.
    submitTestimonial: async (_: any, { quote, authorRole, authorCompany, rating }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      if (!quote || !quote.trim()) throw new Error('Quote is required');

      const author = await User.findById(context.user.id);
      if (!author) throw new Error('User not found');

      const snapshot = snapshotAuthor(author);
      const doc = await Testimonial.create({
        quote: quote.trim(),
        author: author._id,
        authorName: snapshot.authorName,
        authorRole: authorRole || snapshot.authorRole,
        authorCompany: authorCompany || snapshot.authorCompany,
        authorAvatar: snapshot.authorAvatar,
        rating: rating || 5,
        status: 'pending',
        submittedBy: author._id,
      });
      const populated = await Testimonial.findById(doc._id).populate('author', 'fullName username email avatar title school');
      return safeUserShape(populated!);
    },

    // Admin submits a testimonial on behalf of a student → status pending.
    adminSubmitTestimonial: async (_: any, { userId, quote, authorRole, authorCompany, rating }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      if (!quote || !quote.trim()) throw new Error('Quote is required');

      const student = await User.findById(userId);
      if (!student) throw new Error('Student not found');

      const snapshot = snapshotAuthor(student);
      const doc = await Testimonial.create({
        quote: quote.trim(),
        author: student._id,
        authorName: snapshot.authorName,
        authorRole: authorRole || snapshot.authorRole,
        authorCompany: authorCompany || snapshot.authorCompany,
        authorAvatar: snapshot.authorAvatar,
        rating: rating || 5,
        status: 'pending',
        submittedBy: context.user.id,
      });
      const populated = await Testimonial.findById(doc._id).populate('author', 'fullName username email avatar title school');
      return safeUserShape(populated!);
    },

    // Super admin only — approve / reject a testimonial. Approved ones appear
    // on the public site via publicTestimonials.
    reviewTestimonial: async (_: any, { id, status, note }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Only a super admin can approve testimonials');
      }
      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Status must be approved or rejected');
      }
      const doc = await Testimonial.findById(id);
      if (!doc) throw new Error('Testimonial not found');

      doc.status = status;
      if (status === 'approved') doc.reviewNote = '';
      if (status === 'rejected' && note) doc.reviewNote = note;
      doc.reviewedBy = context.user.id;
      doc.reviewedAt = new Date();
      await doc.save();

      const populated = await Testimonial.findById(doc._id).populate('author', 'fullName username email avatar title school');
      return safeUserShape(populated!);
    },

    deleteTestimonial: async (_: any, { id }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Only a super admin can delete testimonials');
      }
      const result = await Testimonial.findByIdAndDelete(id);
      return !!result;
    },
  },
};
