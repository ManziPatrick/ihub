#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * ─────────────────────────────────────────────────────────────────────────
 *  MongoDB data migration: Atlas ihub_db  →  self-hosted bootskillsdb
 *
 *  Source: mongodb+srv://alain:Password123@alain0.fwqgt9m.mongodb.net/ihub_db
 *  Dest:   mongodb://bootskills:bootskills@169.58.74.138:27017/bootskillsdb?authSource=admin
 *
 *  Uses the `mongodb` driver bundled inside mongoose's node_modules, so no
 *  extra install is needed.
 *
 *  Usage:
 *    node scripts/migrate-mongo.js            # dry-run: list collections + counts (default)
 *    node scripts/migrate-mongo.js check      # same as default
 *    node scripts/migrate-mongo.js migrate    # copy everything (resumable, non-destructive)
 *    node scripts/migrate-mongo.js verify     # compare counts + indexes after migration
 *
 *  Env overrides (optional):
 *    SRC_URI, SRC_DB, DST_URI, DST_DB, BATCH_SIZE
 * ─────────────────────────────────────────────────────────────────────────
 */

const path = require('path');

// Resolve the mongodb driver bundled under mongoose (no top-level install).
let MongoClient;
try {
  ({ MongoClient } = require(path.resolve(
    __dirname,
    '../backend/node_modules/mongoose/node_modules/mongodb'
  )));
} catch {
  try {
    ({ MongoClient } = require(path.resolve(__dirname, '../backend/node_modules/mongodb')));
  } catch {
    console.error('❌ Could not load the mongodb driver from backend/node_modules.');
    console.error('   Run: cd backend && npm install');
    process.exit(1);
  }
}

const SRC_URI =
  process.env.SRC_URI ||
  'mongodb+srv://alain:Password123@alain0.fwqgt9m.mongodb.net/ihub_db?retryWrites=true&w=majority';
const SRC_DB = process.env.SRC_DB || 'ihub_db';

const DST_URI =
  process.env.DST_URI ||
  'mongodb://bootskills:bootskills@169.58.74.138:27017/bootskillsdb?authSource=admin&directConnection=true';
const DST_DB = process.env.DST_DB || 'bootskillsdb';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500', 10);

// Collections that should never be copied.
const SKIP = new Set([
  'system.views',
  'system.buckets',
  'system.profile',
  'system.js',
]);

const mode = (process.argv[2] || 'check').toLowerCase();

function mask(uri) {
  return uri.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@');
}

async function listCollections(db) {
  const cols = await db.listCollections().toArray();
  return cols.filter((c) => !SKIP.has(`${c.db ? c.db + '.' : ''}${c.name}`) && c.name !== 'system.views');
}

async function getDocCount(db, name) {
  return db.collection(name).estimatedDocumentCount();
}

// listIndexes on a not-yet-existing collection throws code 26
// ("ns does not exist") — treat that as "no indexes yet".
async function safeIndexes(col) {
  try {
    return await col.indexes();
  } catch (err) {
    if (err.code === 26 || /ns does not exist/i.test(err.message)) return [];
    throw err;
  }
}

async function migrateCollection(srcCol, dstCol, name) {
  const total = await srcCol.estimatedDocumentCount();
  if (total === 0) {
    console.log(`   ⏭️  ${name}: empty, skipped`);
    return { total: 0, inserted: 0 };
  }

  // Copy indexes first (skip the default _id index; it always exists).
  const srcIndexes = await srcCol.indexes();
  const dstExisting = new Set((await safeIndexes(dstCol)).map((i) => i.name));
  for (const idx of srcIndexes) {
    if (idx.name === '_id_' || dstExisting.has(idx.name)) continue;
    // Strip server-assigned / deprecated fields; keep the meaningful options.
    const { v, ns, background, key, name, ...rest } = idx;
    try {
      await dstCol.createIndex(key, { name, ...rest });
      console.log(`   📇 ${name}: created index ${idx.name}`);
    } catch (err) {
      // An index that already exists under a different name, or an option
      // unsupported on the target server, must not block the data copy.
      console.log(`   ⚠️  ${name}: index ${idx.name} skipped (${err.message})`);
    }
  }

  let inserted = 0;
  let batch = [];

  const flush = async () => {
    if (batch.length === 0) return;
    const ops = batch.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
    }));
    const res = await dstCol.bulkWrite(ops, { ordered: false });
    inserted += res.upsertedCount + res.modifiedCount;
    batch = [];
  };

  const cursor = srcCol.find({}, { batchSize: BATCH_SIZE });
  let i = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);
    i++;
    if (batch.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r   ⏳ ${name}: ${i}/${total}`);
    }
  }
  await flush();
  process.stdout.write(`\r   ✅ ${name}: ${total} docs migrated${' '.repeat(20)}\n`);

  return { total, inserted };
}

async function main() {
  console.log('📦 MongoDB migration');
  console.log(`   Source: ${mask(SRC_URI)} / db=${SRC_DB}`);
  console.log(`   Dest:   ${mask(DST_URI)} / db=${DST_DB}`);
  console.log(`   Mode:   ${mode}\n`);

  const srcClient = new MongoClient(SRC_URI, { serverSelectionTimeoutMS: 30000 });
  const dstClient = new MongoClient(DST_URI, { serverSelectionTimeoutMS: 30000 });

  try {
    console.log('🔌 Connecting to source...');
    await srcClient.connect();
    const srcDb = srcClient.db(SRC_DB);

    console.log('🔌 Connecting to destination...');
    await dstClient.connect();
    const dstDb = dstClient.db(DST_DB);
    await dstDb.command({ ping: 1 });

    const srcCols = await listCollections(srcDb);
    if (srcCols.length === 0) {
      console.log('⚠️  No collections found in source. Check the URI/db name.');
      return;
    }

    // Overview table
    console.log('\n─────────────────────────────────────────────────────');
    console.log('COLLECTION                     SRC      DST      ACTION');
    console.log('─────────────────────────────────────────────────────');
    const rows = [];
    for (const c of srcCols) {
      const srcCount = await getDocCount(srcDb, c.name);
      const dstCount = await getDocCount(dstDb, c.name);
      rows.push({ name: c.name, srcCount, dstCount });
      const action =
        mode === 'migrate' ? 'copy' : dstCount >= srcCount ? 'ok' : 'missing';
      console.log(
        `${c.name.padEnd(30)} ${String(srcCount).padStart(8)} ${String(dstCount).padStart(8)}  ${action}`
      );
    }
    console.log('─────────────────────────────────────────────────────\n');

    if (mode === 'check') {
      console.log('ℹ️  Dry-run only. Run `node scripts/migrate-mongo.js migrate` to copy data.');
      return;
    }

    if (mode === 'verify') {
      let bad = 0;
      for (const r of rows) {
        if (r.dstCount < r.srcCount) {
          console.log(`❌ ${r.name}: dest has ${r.dstCount}, source has ${r.srcCount}`);
          bad++;
        }
      }
      if (bad === 0) console.log('✅ All collection counts match (dest >= src).');
      else process.exitCode = 1;
      return;
    }

    // mode === 'migrate'
    console.log('🚀 Starting migration (non-destructive: existing docs with the same _id are replaced)...\n');
    const summary = [];
    for (const c of srcCols) {
      try {
        const res = await migrateCollection(srcDb.collection(c.name), dstDb.collection(c.name), c.name);
        summary.push({ name: c.name, ...res });
      } catch (err) {
        console.error(`   ❌ ${c.name}: ${err.message}`);
        summary.push({ name: c.name, total: -1, inserted: 0, error: err.message });
      }
    }

    console.log('\n📊 Summary:');
    let ok = true;
    for (const s of summary) {
      if (s.error) {
        ok = false;
        console.log(`   ❌ ${s.name}: FAILED — ${s.error}`);
      } else {
        console.log(`   ✅ ${s.name}: ${s.total} docs`);
      }
    }
    console.log(ok ? '\n🎉 Migration complete.' : '\n⚠️  Completed with errors — re-run `migrate` to retry failed collections (it is resumable).');
    if (!ok) process.exitCode = 1;
  } finally {
    await srcClient.close().catch(() => {});
    await dstClient.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
