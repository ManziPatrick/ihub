import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { CourseSchema } from './types';
import { mapCourseToModel } from './lib/map-to-model';
import { ensureTeam } from './lib/ensure-team';
import { Course } from '../models/Course';
import { User } from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const COURSES_DIR = path.join(__dirname, 'courses');
const DATA_DIR = path.join(__dirname, 'data');

function readVerifiedUrls(): { urls: Set<string>; removedIds: string[] } {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('-verified.json'));
  const urls = new Set<string>();
  let removedIds: string[] = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    for (const t of raw.topics ?? []) {
      for (const v of t.videos ?? []) {
        if (v.youtubeUrl) urls.add(v.youtubeUrl);
      }
    }
    if (Array.isArray(raw.removedBecauseNotFound)) removedIds = removedIds.concat(raw.removedBecauseNotFound);
  }
  return { urls, removedIds };
}

async function run() {
  const onlySlug = process.argv.slice(2).find((a) => a && a !== '--');
  await connectDB();

  // ─── Team: trainers exist, admin is ALWAYS the default instructor ───
  const { admin: instructor } = await ensureTeam();

  const { urls: verifiedUrls, removedIds } = readVerifiedUrls();
  const dirs = fs.readdirSync(COURSES_DIR).filter((d) => {
    const full = path.join(COURSES_DIR, d);
    return fs.statSync(full).isDirectory() && !d.startsWith('_') && (!onlySlug || d === onlySlug);
  });
  if (onlySlug && dirs.length === 0) throw new Error(`No course directory found for slug "${onlySlug}"`);

  let grand = { modules: 0, videosWithUrl: 0, videosWaiting: 0, quiz: 0, exam: 0, challenges: 0, projects: 0, practiceLinks: 0 };

  for (const dir of dirs) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require(path.join(COURSES_DIR, dir)) as unknown;
    const courseData = (loaded as { default?: unknown }).default ?? loaded;
    const parsed = CourseSchema.safeParse(courseData);
    if (!parsed.success) {
      console.error(`❌ Validation failed for course "${dir}":`);
      console.error(JSON.stringify(parsed.error.format(), null, 2).slice(0, 4000));
      process.exitCode = 1;
      continue;
    }
    const course = parsed.data;

    // ---- URL safety: every youtubeUrl must be in the verified set; no removed IDs anywhere
    const usedUrls = course.modules.flatMap((m) => m.videos.map((v) => v.youtubeUrl).filter(Boolean)) as string[];
    const blob = JSON.stringify(course);
    const unknownUrls = usedUrls.filter((u) => !verifiedUrls.has(u as string));
    const leakedRemoved = removedIds.filter((id) => blob.includes(id));
    if (unknownUrls.length > 0) {
      console.error(`❌ Course "${dir}" uses ${unknownUrls.length} UNVERIFIED YouTube URL(s):`);
      unknownUrls.forEach((u) => console.error('   -', u));
      process.exitCode = 1;
      continue;
    }
    if (leakedRemoved.length > 0) {
      console.error(`❌ Course "${dir}" references removed video IDs: ${leakedRemoved.join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    const seen = new Set<string>();
    for (const m of course.modules) {
      for (const u of m.videos.map((v) => v.youtubeUrl).filter(Boolean) as string[]) {
        if (seen.has(`${m.slug}::${u}`)) console.warn(`⚠️  Duplicate video in module ${m.slug}: ${u}`);
        seen.add(`${m.slug}::${u}`);
      }
    }

    // ---- UPSERT by title (Course model has no slug field) — safe to run many times
    const payload = mapCourseToModel(course, instructor._id as mongoose.Types.ObjectId);
    const existing = await Course.findOne({ title: course.title });
    if (existing) {
      existing.set(payload);
      await existing.save();
      console.log(`🔄 Updated "${course.title}" (no duplicates created)`);
    } else {
      await Course.create(payload);
      console.log(`✨ Created "${course.title}"`);
    }

    const stats = {
      modules: course.modules.length,
      videosWithUrl: course.modules.flatMap((m) => m.videos).filter((v) => v.youtubeUrl).length,
      videosWaiting: course.modules.flatMap((m) => m.videos).filter((v) => !v.youtubeUrl).length,
      quiz: course.modules.reduce((n, m) => n + m.quiz.length, 0),
      exam: course.exam.questions.length,
      challenges: course.modules.reduce((n, m) => n + m.logicTraining.challenges.length, 0),
      projects: course.projectsDetail.length,
      practiceLinks: course.modules.reduce((n, m) => n + m.practiceLinks.length, 0),
    };
    for (const k of Object.keys(grand) as (keyof typeof grand)[]) grand[k] += stats[k];
    console.log(`   modules=${stats.modules} videos(url)=${stats.videosWithUrl} waiting=${stats.videosWaiting} quiz=${stats.quiz} exam=${stats.exam} challenges=${stats.challenges} projects=${stats.projects} links=${stats.practiceLinks}`);
  }

  console.log('\n===== TOTAL =====');
  console.log(`modules=${grand.modules} videos(url)=${grand.videosWithUrl} waiting=${grand.videosWaiting} quiz=${grand.quiz} exam=${grand.exam} challenges=${grand.challenges} projects=${grand.projects} links=${grand.practiceLinks}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
