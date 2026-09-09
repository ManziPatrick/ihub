/**
 * Hide every course NOT present in the source DB (ihub_db) on a target DB.
 *
 * The 17 published ihub_db courses stay exactly as they are (published).
 * Every other course on the target is set to status:'draft' — hidden from the
 * public API, NOT deleted, fully reversible (set back to 'published' anytime).
 *
 * DRY RUN FIRST (recommended):
 *   SRC_URI='mongodb+srv://alain:Password123@alain0.fwqgt9m.mongodb.net/ihub_db?retryWrites=true&w=majority' \
 *   PROD_URI="$(grep '^MONGO_URI=' .env | cut -d= -f2-)" DRY_RUN=1 node scratch/hide-non-source-courses.cjs
 *
 * LIVE:
 *   ...same command without DRY_RUN...
 */
const mongoose = require('../backend/node_modules/mongoose');

const SRC_URI = process.env.SRC_URI;
const PROD_URI = process.env.PROD_URI;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!SRC_URI || !PROD_URI) {
  console.error('Need SRC_URI and PROD_URI env vars.');
  process.exit(1);
}

(async () => {
  // 1. Titles to KEEP published = published courses in the source
  console.log('1. Reading published titles from source (ihub_db)...');
  await mongoose.connect(SRC_URI, { serverSelectionTimeoutMS: 30000 });
  const keepTitles = (
    await mongoose.connection.collection('courses')
      .find({ status: { $ne: 'draft' }, isDeleted: { $ne: true } }, { projection: { title: 1 } })
      .toArray()
  ).map((c) => c.title);
  await mongoose.disconnect();
  console.log(`   keeping ${keepTitles.length} courses published`);

  // 2. On the target: draft everything whose title is not in keepTitles
  console.log(`2. Connecting to target... (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);
  await mongoose.connect(PROD_URI, { serverSelectionTimeoutMS: 30000 });
  const col = mongoose.connection.collection('courses');

  const hideFilter = { title: { $nin: keepTitles }, status: { $ne: 'draft' } };
  const toHide = await col.find(hideFilter, { projection: { title: 1 } }).toArray();
  console.log(`   would hide ${toHide.length} courses (set status:'draft'):`);
  toHide.forEach((c) => console.log('     -', c.title));

  if (DRY_RUN) {
    console.log('\nDRY RUN — nothing written. Re-run without DRY_RUN=1 to apply.');
  } else {
    const res = await col.updateMany(hideFilter, { $set: { status: 'draft' } });
    console.log(`\n✅ Done. ${res.modifiedCount} courses set to draft.`);
    const publishedNow = await col.countDocuments({ status: { $ne: 'draft' }, isDeleted: { $ne: true } });
    console.log(`   Published courses remaining on target: ${publishedNow}`);
  }
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
