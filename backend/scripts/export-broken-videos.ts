/**
 * Export all broken YouTube videos with lesson context for replacement analysis.
 * Outputs a JSON file with all lessons that have broken/non-working YouTube URLs.
 *
 * Usage: cd backend && npx tsx scripts/export-broken-videos.ts > broken-videos.json
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

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

async function checkYouTubeVideo(videoId: string): Promise<{ exists: boolean; title?: string; error?: string }> {
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
      return { exists: false, error: 'Video not found (404)' };
    } else if (response.status === 400) {
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

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.error('❌ MONGODB_URI not found'); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const coursesCollection = db.collection('courses');

  const courses = await coursesCollection.find({
    status: { $in: ['published', 'active'] },
    'modules.lessons.videoUrl': { $exists: true, $nin: [null, ''] }
  }).project({
    title: 1, category: 1, status: 1,
    'modules.title': 1, 'modules.order': 1,
    'modules.lessons.title': 1, 'modules.lessons.videoUrl': 1,
    'modules.lessons.videoTitle': 1, 'modules.lessons.content': 1, 'modules.lessons.type': 1,
  }).toArray() as any[];

  const brokenVideos: any[] = [];

  for (const course of courses) {
    if (!course.modules) continue;
    for (const mod of course.modules) {
      if (!mod.lessons) continue;
      for (const lesson of mod.lessons) {
        if (!lesson.videoUrl || !lesson.videoUrl.includes('youtube')) continue;
        const videoId = extractVideoId(lesson.videoUrl);
        if (!videoId) continue;

        const result = await checkYouTubeVideo(videoId);
        if (!result.exists) {
          brokenVideos.push({
            courseId: String(course._id),
            courseTitle: course.title,
            courseCategory: course.category || '',
            moduleTitle: mod.title,
            lessonTitle: lesson.title || '',
            lessonType: lesson.type || '',
            lessonContent: (lesson.content || '').slice(0, 300),
            videoUrl: lesson.videoUrl,
            videoId,
            expectedTitle: lesson.videoTitle || '',
            error: result.error,
          });
        }

        await new Promise(r => setTimeout(r, 200));
      }
    }
  }

  console.log(JSON.stringify({ total: brokenVideos.length, videos: brokenVideos }, null, 2));
  await mongoose.disconnect();
}

main().catch(console.error);
