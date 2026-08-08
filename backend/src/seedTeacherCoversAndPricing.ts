/**
 * seedTeacherCoversAndPricing
 * ----------------------------
 * 1. Adds a coverImage to each of the 10 "real teachers" (by username) so their
 *    cards always show an image filling the rounded border.
 * 2. Brings Nigena Umuhire Pacifique's courses to the platform-standard 1000 RWF.
 *
 * Idempotent — safe to re-run.
 */
import dotenv from 'dotenv';
import connectDB from './config/db';
import { User } from './models/User';
import { Course } from './models/Course';

dotenv.config();

const TEACHER_COVERS: Record<string, string> = {
  'nigena.umuhire': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
  'chantal.mukeshimana': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  'eric.nsengiyumva': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
  'josiane.uwera': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80',
  'thierry.mugisha': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'sandrine.ingabire': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
  'aline.uwimana': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
  'marieclaudine.mukandayisenga': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80',
  'patrick.nzabonimpa': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80',
  'olivier.twagirimana': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
};

async function main() {
  await connectDB();

  // 1. Cover images for the real teachers
  let updated = 0;
  for (const [username, coverImage] of Object.entries(TEACHER_COVERS)) {
    const teacher = await User.findOne({ username });
    if (!teacher) {
      console.log(`⚠️  Teacher @${username} not found — skipping cover image`);
      continue;
    }
    let changed = false;
    if (teacher.coverImage !== coverImage) {
      teacher.coverImage = coverImage;
      changed = true;
    }
    if (!teacher.isProfilePublic) {
      teacher.isProfilePublic = true;
      changed = true;
    }
    if (!teacher.isEmailVerified) {
      teacher.isEmailVerified = true;
      changed = true;
    }
    if (changed) {
      await teacher.save();
      console.log(`✅ @${username} — cover image added / profile completed`);
      updated++;
    } else {
      console.log(`✓ @${username} — already complete`);
    }
  }

  // 2. Nigena's courses → 1000 RWF
  const nigena = await User.findOne({ username: 'nigena.umuhire' });
  if (!nigena) {
    console.error('❌ Nigena Umuhire Pacifique not found!');
    process.exit(1);
  }
  const nigenaCourses = await Course.find({ instructor: nigena._id, isDeleted: { $ne: true } });
  let repriced = 0;
  for (const c of nigenaCourses) {
    if (c.price !== 1000 || (c.discountPrice ?? 0) > 0) {
      c.price = 1000;
      c.discountPrice = 0;
      await c.save();
      console.log(`💰 "${c.title}" → 1000 RWF`);
      repriced++;
    } else {
      console.log(`✓ "${c.title}" — already 1000 RWF`);
    }
  }

  console.log(`\n🏁 Done — teachers updated: ${updated}, courses repriced: ${repriced}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
