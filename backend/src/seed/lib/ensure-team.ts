import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { team, ADMIN_EMAIL, type TeamMemberSeed } from '../data/team';

/**
 * Ensures the default seed team exists (find-or-create by email).
 * Returns the admin user, which is ALWAYS the default instructor
 * for seeded courses. Existing users are topped up with anything
 * a bare user may be missing (phone, permissions, bcrypt password)
 * so login, UI editing and publishing keep working.
 */
export async function ensureTeam() {
  const results: Record<string, any> = {};
  for (const t of team) {
    let user = await User.findOne({ email: t.email });
    if (!user) {
      user = await new User({
        fullName: t.fullName,
        username: t.username,
        email: t.email,
        password: await bcrypt.hash(t.password, 10),
        role: t.role,
        status: 'active',
        academicStatus: 'active',
        phone: t.phone,
        bio: t.bio,
        title: (t as TeamMemberSeed).title,
        location: (t as TeamMemberSeed).location,
        avatar: (t as TeamMemberSeed).avatar,
        permissions: t.permissions ?? [],
        isTrainerApproved: t.role === 'trainer',
        isVerified: true,
        trainerApplication: (t as TeamMemberSeed).trainerApplication,
      }).save();
      console.log(`✅ Created ${t.role}: ${t.email}`);
    } else {
      // Top up anything a bare user may be missing
      const patch: Record<string, unknown> = {};
      if (!(user as any).phone && t.phone) patch.phone = t.phone;
      if (t.permissions?.length && !((user as any).permissions?.length)) patch.permissions = t.permissions;
      if (!String((user as any).password ?? '').startsWith('$2')) {
        patch.password = await bcrypt.hash(t.password, 10);
      }
      if (t.role === 'trainer' && !(user as any).isTrainerApproved) patch.isTrainerApproved = true;
      if (Object.keys(patch).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: patch });
        console.log(`🔧 Topped up ${t.email}: ${Object.keys(patch).join(', ')}`);
      } else {
        console.log(`✅ Using ${t.role}: ${t.email}`);
      }
    }
    results[t.email] = user;
  }
  const admin = await User.findOne({ email: ADMIN_EMAIL });
  return { admin: admin!, all: results };
}
