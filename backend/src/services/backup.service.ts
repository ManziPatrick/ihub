import mongoose from 'mongoose';
import { BackupRecord } from '../models/BackupRecord';

const MAX_BACKUPS = 5;
const BACKUP_DB_PREFIX = 'ihub_backup_';

/**
 * Lazy-initialized mongoose connection to the backup MongoDB cluster.
 * Created on first use by reading BACKUP_MONGO_URI env var.
 */
let backupConnection: mongoose.Connection | null = null;

function getBackupUri(): string {
  const uri = process.env.BACKUP_MONGO_URI;
  if (!uri) {
    throw new Error('BACKUP_MONGO_URI environment variable is not configured. Set it to the backup MongoDB cluster URI.');
  }
  return uri;
}

function getPrimaryDbName(): string {
  // Extract database name from MONGO_URI
  const uri = process.env.MONGO_URI || '';
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'ihub_db';
}

/**
 * Get (or create) the mongoose connection to the backup MongoDB cluster.
 */
async function getBackupConnection(): Promise<mongoose.Connection> {
  if (backupConnection && backupConnection.readyState === 1) {
    return backupConnection;
  }

  // Close stale connection if it exists
  if (backupConnection) {
    try {
      await backupConnection.close();
    } catch {
      // Ignore close errors on stale connection
    }
    backupConnection = null;
  }

  const uri = getBackupUri();
  console.log(`Connecting to backup MongoDB cluster...`);

  backupConnection = await mongoose.createConnection(uri).asPromise();
  console.log(`Connected to backup MongoDB cluster: ${backupConnection.host}`);

  return backupConnection;
}

/**
 * Lists all collection names in the primary database.
 */
async function listPrimaryCollections(): Promise<string[]> {
  if (!mongoose.connection.db) {
    throw new Error('Primary database connection not established');
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections
    .map(c => c.name)
    .filter(name => !name.startsWith('system.') && !name.startsWith('__'));
}

/**
 * Generate a unique backup database name with timestamp.
 */
function generateBackupDbName(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${BACKUP_DB_PREFIX}${timestamp}`;
}

/**
 * Estimate document size in bytes.
 */
function estimateDocSize(doc: any): number {
  try {
    return Buffer.byteLength(JSON.stringify(doc), 'utf8');
  } catch {
    return 0;
  }
}

/**
 * ─────────────────────────────────────────────────────
 * CREATE A BACKUP
 * ─────────────────────────────────────────────────────
 * Copies all collections from the primary database
 * to a new database on the backup cluster.
 */
export async function createBackup(userId?: string): Promise<BackupRecord> {
  const primaryDb = mongoose.connection.db;
  if (!primaryDb) {
    throw new Error('Primary database not connected');
  }

  const backupConn = await getBackupConnection();
  const backupDbName = generateBackupDbName();

  // Create the BackupRecord in the primary DB
  const record = new BackupRecord({
    backupDbName,
    status: 'in_progress',
    triggeredBy: userId || null,
    collections: [],
    size: 0,
  });
  await record.save();

  try {
    const collections = await listPrimaryCollections();
    let totalSize = 0;
    const backedUpCollections: string[] = [];

    // Use the backup database with the generated name
    const backupDb = backupConn.useDb(backupDbName);
    console.log(`📦 Creating backup: ${backupDbName} with ${collections.length} collections...`);

    for (const collectionName of collections) {
      try {
        const primaryCollection = primaryDb.collection(collectionName);
        const docs = await primaryCollection.find({}).toArray();
        const docCount = docs.length;

        if (docCount === 0) {
          console.log(`  ⏭️  ${collectionName}: empty, skipping`);
          continue;
        }

        // Calculate size
        let colSize = 0;
        for (const doc of docs) {
          colSize += estimateDocSize(doc);
        }

        // Get or create the collection on backup DB
        const backupCollection = backupDb.collection(collectionName);

        // Clear any existing data in this collection (fresh backup)
        await backupCollection.deleteMany({});

        // Batch insert in chunks of 500 to avoid large inserts
        const CHUNK_SIZE = 500;
        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          await backupCollection.insertMany(chunk, { ordered: false });
        }

        totalSize += colSize;
        backedUpCollections.push(collectionName);
        console.log(`  ✅ ${collectionName}: ${docCount} docs (${(colSize / 1024).toFixed(1)} KB)`);
      } catch (colError: any) {
        console.error(`  ❌ ${collectionName}: ${colError.message}`);
        // Continue with other collections
      }
    }

    // Update the BackupRecord with success
    record.status = 'completed';
    record.collections = backedUpCollections;
    record.size = totalSize;
    record.completedAt = new Date();
    await record.save();

    console.log(`✅ Backup ${backupDbName} completed: ${backedUpCollections.length} collections, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Enforce retention: delete old backups beyond MAX_BACKUPS
    await enforceRetention();

    return record;
  } catch (error: any) {
    // Update the BackupRecord with failure
    record.status = 'failed';
    record.errorMessage = error.message || 'Unknown error during backup';
    await record.save();

    console.error(`❌ Backup ${backupDbName} failed:`, error.message);

    // Try to clean up the failed backup database
    try {
      const backupConn = await getBackupConnection();
      const backupDb = backupConn.useDb(backupDbName);
      await backupDb.dropDatabase();
      console.log(`  🗑️  Dropped failed backup database: ${backupDbName}`);
    } catch (dropError) {
      console.error('  ⚠️  Could not drop failed backup database:', dropError);
    }

    throw error;
  }
}

/**
 * ─────────────────────────────────────────────────────
 * LIST ALL BACKUPS
 * ─────────────────────────────────────────────────────
 * Returns backup records sorted newest first,
 * with actual size from the backup cluster if available.
 */
export async function listBackups(): Promise<BackupRecord[]> {
  const records = await BackupRecord.find()
    .sort({ createdAt: -1 })
    .populate('triggeredBy', 'username fullName email')
    .lean();

  // Try to get real sizes from the backup cluster
  try {
    const backupConn = await getBackupConnection();
    const adminDb = backupConn.db.admin();

    for (const record of records) {
      try {
        const dbInfo = await adminDb
          // @ts-ignore - getDbStats is available on Db
          .serverStatus()
          .catch(() => null);

        // Get actual DB stats from backup cluster
        const backupDb = backupConn.useDb(record.backupDbName);
        const stats = await backupDb.stats().catch(() => null);
        if (stats && stats.dataSize) {
          (record as any).actualSize = stats.dataSize;
        }
      } catch {
        // Ignore errors getting size per backup
      }
    }
  } catch {
    // If backup cluster is unreachable, return records with estimated sizes only
  }

  return records as any;
}

/**
 * ─────────────────────────────────────────────────────
 * RESTORE FROM BACKUP
 * ─────────────────────────────────────────────────────
 * Wipes the primary database and replaces it with
 * data from the specified backup snapshot.
 * If collections array is provided, only restore those.
 */
export async function restoreBackup(
  backupId: string,
  collections?: string[]
): Promise<{ restoredCollections: string[]; totalDocs: number }> {
  const record = await BackupRecord.findById(backupId);
  if (!record) {
    throw new Error('Backup record not found');
  }

  if (record.status !== 'completed') {
    throw new Error(`Cannot restore from backup with status "${record.status}". Only completed backups can be restored.`);
  }

  const primaryDb = mongoose.connection.db;
  if (!primaryDb) {
    throw new Error('Primary database not connected');
  }

  const backupConn = await getBackupConnection();
  const backupDb = backupConn.useDb(record.backupDbName);

  // Determine which collections to restore
  let collectionsToRestore = record.collections;
  if (collections && collections.length > 0) {
    collectionsToRestore = collections.filter(c => record.collections.includes(c));
    if (collectionsToRestore.length === 0) {
      throw new Error('None of the specified collections exist in this backup.');
    }
  }

  console.log(`🔄 Restoring from backup: ${record.backupDbName}`);
  console.log(`  Collections to restore: ${collectionsToRestore.length}`);

  let totalDocs = 0;
  const restoredCollections: string[] = [];

  for (const collectionName of collectionsToRestore) {
    try {
      const sourceCollection = backupDb.collection(collectionName);
      const docs = await sourceCollection.find({}).toArray();
      const docCount = docs.length;

      // Wipe the existing collection in the primary DB
      const targetCollection = primaryDb.collection(collectionName);
      await targetCollection.deleteMany({});

      if (docCount === 0) {
        console.log(`  ⏭️  ${collectionName}: empty, skipping`);
        continue;
      }

      // Batch insert in chunks of 500
      const CHUNK_SIZE = 500;
      for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
        const chunk = docs.slice(i, i + CHUNK_SIZE);
        await targetCollection.insertMany(chunk, { ordered: false });
      }

      totalDocs += docCount;
      restoredCollections.push(collectionName);
      console.log(`  ✅ ${collectionName}: ${docCount} docs restored`);
    } catch (colError: any) {
      console.error(`  ❌ ${collectionName}: ${colError.message}`);
      // Continue with other collections
    }
  }

  console.log(`✅ Restore complete: ${restoredCollections.length} collections, ${totalDocs} total documents`);

  return {
    restoredCollections,
    totalDocs,
  };
}

/**
 * ─────────────────────────────────────────────────────
 * DELETE A BACKUP
 * ─────────────────────────────────────────────────────
 * Drops the backup database and removes the record.
 */
export async function deleteBackup(backupId: string): Promise<boolean> {
  const record = await BackupRecord.findById(backupId);
  if (!record) {
    throw new Error('Backup record not found');
  }

  // Drop the backup database on the backup cluster
  try {
    const backupConn = await getBackupConnection();
    const backupDb = backupConn.useDb(record.backupDbName);
    await backupDb.dropDatabase();
    console.log(`🗑️  Dropped backup database: ${record.backupDbName}`);
  } catch (error: any) {
    console.error(`⚠️  Could not drop backup database ${record.backupDbName}:`, error.message);
    // Still delete the record even if we can't drop the remote DB
  }

  // Delete the record
  await BackupRecord.findByIdAndDelete(backupId);
  return true;
}

/**
 * ─────────────────────────────────────────────────────
 * ENFORCE RETENTION
 * ─────────────────────────────────────────────────────
 * Keeps only the most recent MAX_BACKUPS backup snapshots.
 * Deletes older ones automatically.
 */
async function enforceRetention(): Promise<void> {
  const records = await BackupRecord.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  if (records.length <= MAX_BACKUPS) {
    return; // Within limit, nothing to delete
  }

  const toDelete = records.slice(MAX_BACKUPS);
  console.log(`🧹 Retention: ${records.length} backups exist, keeping ${MAX_BACKUPS}, removing ${toDelete.length} old ones...`);

  for (const record of toDelete) {
    try {
      // Drop the backup database
      const backupConn = await getBackupConnection();
      const backupDb = backupConn.useDb(record.backupDbName);
      await backupDb.dropDatabase();
    } catch (error: any) {
      console.warn(`  ⚠️  Could not drop backup database ${record.backupDbName}: ${error.message}`);
    }

    // Delete the record
    await BackupRecord.findByIdAndDelete(record._id);
    console.log(`  🗑️  Deleted old backup: ${record.backupDbName}`);
  }

  console.log(`✅ Retention enforced: keeping ${MAX_BACKUPS} most recent backups`);
}

/**
 * Get the status of the backup cluster connection.
 */
export async function getBackupClusterStatus(): Promise<{
  connected: boolean;
  host: string | null;
  backupCount: number;
  lastBackup: string | null;
  totalSize: number;
}> {
  let connected = false;
  let host: string | null = null;
  let backupCount = 0;
  let lastBackup: string | null = null;

  try {
    const conn = await getBackupConnection();
    connected = conn.readyState === 1;
    host = conn.host;
  } catch {
    connected = false;
  }

  // Get backup stats from the database records
  const records = await BackupRecord.find({ status: 'completed' })
    .sort({ createdAt: -1 })
    .lean();

  backupCount = records.length;
  lastBackup = records[0]?.createdAt?.toISOString() || null;
  const totalSize = records.reduce((sum, r) => sum + (r.size || 0), 0);

  return {
    connected,
    host,
    backupCount,
    lastBackup,
    totalSize,
  };
}
