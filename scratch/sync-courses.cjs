/**
 * Course sync: Atlas ihub_db (source) → production DB (+ optional dev DB).
 *
 * Copies FULL course documents (modules, lessons, everything) from the source
 * database and upserts them into the target(s) MATCHING BY TITLE:
 *   - target course with the same title → update in place (keeps its _id, so
 *     enrollments/references by courseId keep working)
 *   - no match → insert as a new course
 * Never deletes anything from the targets.
 *
 * Usage (run where the target DB is reachable — i.e. on the VPS):
 *   node scratch/sync-courses.cjs
 *
 * Configure via env:
 *   SRC_URI   (required) Atlas source  — mongodb+srv://alain:...@alain0...ihub_db
 *   PROD_URI  (optional) prod target   — mongodb://...bootskillsdb (from backend .env on the VPS)
 *   DEV_URI   (optional) dev target    — api.codemande.com's MONGO_URI
 *   DRY_RUN=1 (optional) show what WOULD happen, write nothing
 */
const mongoose = require('../backend/node_modules/mongoose');

const SRC_URI = process.env.SRC_URI;
const PROD_URI = process.env.PROD_URI;
const DEV_URI = process.env.DEV_URI;
// DRY_RUN=1 previews only. NOTE: DRY_RUN still connects to targets — use it
// only against targets you can reach. Atlas free/shared clusters cap at 500
// collections: if the target has no `courses` collection yet, even a DRY RUN
// fails with "already using 500 collections" when the count is exhausted.
const DRY_RUN = process.env.DRY_RUN === '1';

if (!SRC_URI) {
  console.error('Missing SRC_URI env var.');
  process.exit(1);
}
if (!PROD_URI && !DEV_URI) {
  console.error('Nothing to do: set PROD_URI and/or DEV_URI.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fields that must never be copied across databases verbatim. */
function sanitize(doc) {
  const out = { ...doc };
  delete out._id;            // target generates its own (or keeps existing on update)
  delete out.__v;
  delete out.createdAt;      // let target timestamps reflect this sync
  delete out.updatedAt;
  return out;
}

async function upsertCourses(targetConn, sourceCourses, label) {
  const col = targetConn.collection('courses');
  let updated = 0, inserted = 0, failed = 0;
  for (const src of sourceCourses) {
    try {
      const res = await col.updateOne(
        { title: src.title },
        { $set: sanitize(src) },
        { upsert: true }
      );
      if (res.upsertedCount) {
        inserted++;
        console.log(`   + [${label}] inserted: ${src.title}`);
      } else if (res.modifiedCount) {
        updated++;
        console.log(`   ~ [${label}] updated : ${src.title}`);
      } else {
        console.log(`   = [${label}] identical: ${src.title}`);
      }
    } catch (e) {
      failed++;
      console.log(`   ! [${label}] FAILED  : ${src.title} — ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`   ── [${label}] summary: ${inserted} inserted, ${updated} updated, ${failed} failed`);
  return { inserted, updated, failed };
}

(async () => {
  // ── 1. Read all source courses ──
  console.log('1. Reading source courses from ihub_db...');
  await mongoose.connect(SRC_URI, { serverSelectionTimeoutMS: 30000 });
  const srcCol = mongoose.connection.collection('courses');
  const sourceCourses = await srcCol.find({}).toArray();
  const published = sourceCourses.filter((c) => (c.status || 'published') !== 'draft').length;
  console.log(`   got ${sourceCourses.length} courses (${published} published, ${sourceCourses.length - published} draft)`);
  console.log(`   mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE WRITE'}`);
  await mongoose.disconnect();

  const results = [];

  // ── 2. Sync into each target ──
  for (const [label, uri] of [['PROD', PROD_URI], ['DEV', DEV_URI]]) {
    if (!uri) continue;
    console.log(`\n2. Connecting to ${label} target...`);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
      if (DRY_RUN) {
        const col = mongoose.connection.collection('courses');
        const existing = new Set(
          (await col.find({}, { projection: { title: 1 } }).toArray()).map((c) => c.title)
        );
        const wouldInsert = sourceCourses.filter((c) => !existing.has(c.title)).length;
        const wouldUpdate = sourceCourses.length - wouldInsert;
        console.log(`   [${label}] DRY RUN: would insert ${wouldInsert}, would update ${wouldUpdate} (target has ${existing.size} courses)`);
      } else {
        await upsertCourses(mongoose.connection, sourceCourses, label);
      }
      await mongoose.disconnect();
    } catch (e) {
      console.log(`   ✗ ${label} target unreachable: ${e.message.slice(0, 100)}`);
      try { await mongoose.disconnect(); } catch {}
    }
  }

  console.log('\n✅ Sync run complete.');
  process.exit(0);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
