/**
 * Verify all YouTube video URLs in published courses.
 * Checks if each video URL is still accessible via YouTube's oEmbed API.
 *
 * Usage: cd backend && npx tsx scripts/verify-course-videos.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface Lesson {
  _id?: any;
  title?: string;
  videoUrl?: string;
  videoTitle?: string;
  type?: string;
}

interface Module {
  _id?: any;
  title?: string;
  lessons?: Lesson[];
}

interface Course {
  _id?: any;
  title?: string;
  status?: string;
  modules?: Module[];
}

async function checkYouTubeVideo(videoId: string): Promise<{ exists: boolean; title?: string; error?: string }> {
  // url must be declared outside try so catch block can reference it on retry
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BootskillsBot/1.0; +https://bootskills.com)',
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json() as { title?: string };
      return { exists: true, title: data.title };
    } else if (response.status === 404) {
      // Definitively removed or private
      return { exists: false, error: 'Video not found (404)' };
    } else if (response.status === 400) {
      // HTTP 400 could be rate-limiting — retry once
      await new Promise(r => setTimeout(r, 2000));
      const retryResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://bootskills.com/',
        },
      });
      if (retryResponse.ok) {
        const data = await retryResponse.json() as { title?: string };
        return { exists: true, title: data.title };
      }
      return { exists: false, error: `HTTP ${retryResponse.status} (after retry)` };
    } else {
      return { exists: false, error: `HTTP ${response.status}` };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Timeout — retry once
      await new Promise(r => setTimeout(r, 3000));
      try {
        const retryResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        if (retryResponse.ok) {
          const data = await retryResponse.json() as { title?: string };
          return { exists: true, title: data.title };
        }
        return { exists: false, error: `HTTP ${retryResponse.status} (after retry)` };
      } catch {
        return { exists: false, error: 'Request timed out (after retry)' };
      }
    }
    return { exists: false, error: err.message || String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('📡 Connected to MongoDB\n');

  const db = mongoose.connection.db!;
  const coursesCollection = db.collection('courses');

  // Find published courses that have modules with video URLs
  const courses = await coursesCollection.find({
    status: { $in: ['published', 'active'] },
    'modules.lessons.videoUrl': { $exists: true, $ne: null, $ne: '' }
  }).project({
    title: 1,
    status: 1,
    'modules.title': 1,
    'modules.lessons.title': 1,
    'modules.lessons.videoUrl': 1,
    'modules.lessons.videoTitle': 1,
  }).toArray() as unknown as Course[];

  console.log(`📚 Found ${courses.length} published course(s) with video lessons\n`);

  interface VideoEntry {
    courseTitle: string;
    moduleTitle: string;
    lessonTitle: string;
    videoUrl: string;
    videoId: string;
    expectedTitle?: string;
    exists: boolean;
    actualTitle?: string;
    error?: string;
  }

  const allVideos: VideoEntry[] = [];
  const brokenVideos: VideoEntry[] = [];

  // Collect all video URLs
  for (const course of courses) {
    if (!course.modules) continue;
    for (const mod of course.modules) {
      if (!mod.lessons) continue;
      for (const lesson of mod.lessons) {
        if (lesson.videoUrl && lesson.videoUrl.includes('youtube')) {
          const videoId = extractVideoId(lesson.videoUrl);
          if (videoId) {
            allVideos.push({
              courseTitle: course.title || 'Untitled Course',
              moduleTitle: mod.title || 'Untitled Module',
              lessonTitle: lesson.title || 'Untitled Lesson',
              videoUrl: lesson.videoUrl,
              videoId,
              expectedTitle: lesson.videoTitle,
              exists: false,
            });
          }
        }
      }
    }
  }

  console.log(`🎬 Found ${allVideos.length} YouTube video(s) to check\n`);

  // Check each video
  for (let i = 0; i < allVideos.length; i++) {
    const video = allVideos[i];
    process.stdout.write(`  [${i + 1}/${allVideos.length}] Checking ${video.videoId}... `);
    
    const result = await checkYouTubeVideo(video.videoId);
    video.exists = result.exists;
    video.actualTitle = result.title;
    video.error = result.error;
    
    if (result.exists) {
      console.log('✅');
    } else {
      console.log(`❌ (${result.error})`);
      brokenVideos.push(video);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Report
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 VERIFICATION REPORT`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total videos checked: ${allVideos.length}`);
  console.log(`✅ Working: ${allVideos.length - brokenVideos.length}`);
  console.log(`❌ Broken:  ${brokenVideos.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (brokenVideos.length > 0) {
    console.log('BROKEN VIDEO URLs:\n');
    for (const v of brokenVideos) {
      console.log(`  ❌ ${v.courseTitle} / ${v.moduleTitle}`);
      console.log(`     Lesson: "${v.lessonTitle}"`);
      console.log(`     URL: ${v.videoUrl}`);
      console.log(`     Error: ${v.error}`);
      if (v.expectedTitle) {
        console.log(`     Expected: "${v.expectedTitle}"`);
      }
      console.log('');
    }
  } else {
    console.log('🎉 All YouTube videos are accessible!\n');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
