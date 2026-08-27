/**
 * 🌱 SEED: Add YouTube Video URLs to All Lessons
 * 
 * Updates every lesson that is missing a videoUrl with a specific
 * YouTube video matched to the lesson topic.
 * 
 * Usage: npx ts-node src/seedAddVideoUrls.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true';

// Map of lesson title keywords → { videoUrl, videoTitle }
const VIDEO_MAP: Record<string, { videoUrl: string; videoTitle: string }> = {
  // ── Module 1: Welcome & Setup ──
  'Installing VS Code': {
    videoUrl: 'https://www.youtube.com/watch?v=lWEKiak0WVU',
    videoTitle: 'VS Code for Absolute Beginners',
  },
  'How Git & GitHub': {
    videoUrl: 'https://www.youtube.com/watch?v=tRZGeaHPoaw',
    videoTitle: 'Git and GitHub Tutorial for Beginners',
  },

  // ── Module 2: HTML ──
  'HTML Forms': {
    videoUrl: 'https://www.youtube.com/watch?v=frAGrGN00OA',
    videoTitle: 'HTML Forms and Inputs | HTML5 Tutorial for Beginners',
  },
  'Semantic HTML': {
    videoUrl: 'https://www.youtube.com/watch?v=kX3TfdUqpuU',
    videoTitle: 'HTML5 Semantic Elements Tutorial',
  },

  // ── Module 3: CSS Fundamentals ──
  'CSS Box Model': {
    videoUrl: 'https://www.youtube.com/watch?v=4-XCi-rxhjw',
    videoTitle: 'Master the CSS Box Model in 20 Minutes',
  },
  'Colors, Backgrounds & Typography': {
    videoUrl: 'https://www.youtube.com/watch?v=klXyJWlIzuY',
    videoTitle: 'CSS Text and Fonts Tutorial for Beginners - Typography',
  },
  'CSS Display': {
    videoUrl: 'https://www.youtube.com/watch?v=naTAFo2Gyus',
    videoTitle: 'CSS Display Property Tutorial for Beginners | Block, Inline, Inline-Block',
  },
  'CSS Overflow': {
    videoUrl: 'https://www.youtube.com/watch?v=d7cH8geV2dY',
    videoTitle: 'Learn CSS overflow in 3 minutes',
  },
  'CSS Opacity': {
    videoUrl: 'https://www.youtube.com/watch?v=yfoY53QXEnI',
    videoTitle: 'CSS Crash Course — Visibility, Opacity & Cursors',
  },
  'CSS Filters': {
    videoUrl: 'https://www.youtube.com/watch?v=YszONjKpgg4',
    videoTitle: 'CSS Filters, Backdrop Filters & Effects Tutorial',
  },
  'object-fit': {
    videoUrl: 'https://www.youtube.com/watch?v=6yAAV-uP0po',
    videoTitle: 'How to use CSS object-fit to control your images',
  },
  'clip-path': {
    videoUrl: 'https://www.youtube.com/watch?v=rGuB76xdHa0',
    videoTitle: 'CSS Clip Path Tutorial — Create Custom Shapes',
  },
  'Custom Properties': {
    videoUrl: 'https://www.youtube.com/watch?v=PHO6TBq_auI',
    videoTitle: 'CSS Variables — An Introduction to CSS Custom Properties',
  },
  'calc()': {
    videoUrl: 'https://www.youtube.com/watch?v=PHO6TBq_auI',
    videoTitle: 'CSS Variables & calc() — Modern CSS Math',
  },
  'Container Queries': {
    videoUrl: 'https://www.youtube.com/watch?v=2rlWBZ17Wes',
    videoTitle: 'Learn how to use Media Queries & Container Queries',
  },
  'Scroll-Driven': {
    videoUrl: 'https://www.youtube.com/watch?v=GeF4D05Zz2Q',
    videoTitle: 'CSS Scroll-Driven Animations & Scroll Snap Tutorial',
  },

  // ── Module 4: CSS Layout ──
  'CSS Position': {
    videoUrl: 'https://www.youtube.com/watch?v=zqg4A6g9GfA',
    videoTitle: 'CSS Position Property Tutorial | Absolute, Relative, Fixed, Sticky',
  },

  // ── Module 5: CSS Animations ──
  'CSS Transitions': {
    videoUrl: 'https://www.youtube.com/watch?v=YszONjKpgg4',
    videoTitle: 'Learn CSS Animation In 15 Minutes — Transitions & Keyframes',
  },
  'CSS Transforms': {
    videoUrl: 'https://www.youtube.com/watch?v=PH35-BDak0M',
    videoTitle: 'CSS Animation Tutorial #2 — Transforms',
  },

  // ── Module 7: JavaScript ──
  'Functions, Conditions & Loops': {
    videoUrl: 'https://www.youtube.com/watch?v=xKOyDDuQSVY',
    videoTitle: 'Learn All the JavaScript Basics in 20 Minutes',
  },

  // ── Module 8: DOM ──
  'All 10 Ways to Select': {
    videoUrl: 'https://www.youtube.com/watch?v=ZdqO-my7FSA',
    videoTitle: 'Query Selector in JavaScript — DOM Manipulation Tutorial',
  },
  'Modifying the DOM': {
    videoUrl: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
    videoTitle: 'JavaScript DOM Manipulation — Full Course for Beginners',
  },
  'Event Delegation': {
    videoUrl: 'https://www.youtube.com/watch?v=3fFZxnK0cRk',
    videoTitle: 'JavaScript Event Delegation — Dynamic Elements',
  },
  'Event Propagation': {
    videoUrl: 'https://www.youtube.com/watch?v=3fFZxnK0cRk',
    videoTitle: 'JavaScript Event Propagation — Bubbling & Capturing',
  },
  'MutationObserver': {
    videoUrl: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
    videoTitle: 'JavaScript DOM Manipulation — MutationObserver & DOM Changes',
  },
  'createDocumentFragment': {
    videoUrl: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
    videoTitle: 'JavaScript DOM Performance — DocumentFragment & Batch Updates',
  },

  // ── Module 9: Events & Validation ──
  'Form Validation': {
    videoUrl: 'https://www.youtube.com/watch?v=RqQ1Kqu9iXw',
    videoTitle: 'JavaScript Form Validation Tutorial',
  },

  // ── Module 12: Course Review ──
  'Course Review': {
    videoUrl: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
    videoTitle: 'JavaScript Crash Course — Complete Review',
  },
};

const seedVideoUrls = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db!;

    const courses = await db.collection('courses').find({
      title: { $in: [
        'Advanced Web Development — HTML, CSS & JavaScript Masterclass',
        'JavaScript Interactivity Mini-Challenge'
      ]}
    }).toArray();

    let updatedCount = 0;

    for (const course of courses) {
      console.log('📚 ' + course.title);
      let courseChanged = false;

      for (const mod of (course.modules || [])) {
        for (const les of (mod.lessons || [])) {
          // Skip quizzes and assignments
          if (les.type === 'quiz' || les.isAssignment) continue;
          // Skip if already has video
          if (les.videoUrl) continue;

          // Find matching video
          for (const [keyword, video] of Object.entries(VIDEO_MAP)) {
            if (les.title.includes(keyword)) {
              les.videoUrl = video.videoUrl;
              les.videoTitle = video.videoTitle;
              courseChanged = true;
              updatedCount++;
              console.log('   ✅ ' + les.title.substring(0, 55) + ' → ' + video.videoTitle.substring(0, 40));
              break;
            }
          }
        }
      }

      if (courseChanged) {
        await db.collection('courses').updateOne(
          { _id: course._id },
          { $set: { modules: course.modules } }
        );
        console.log('   💾 Saved\n');
      }
    }

    // Final verification
    console.log('═'.repeat(60));
    console.log('📊 VERIFICATION');
    console.log('═'.repeat(60));

    const finalCourses = await db.collection('courses').find({
      title: { $in: [
        'Advanced Web Development — HTML, CSS & JavaScript Masterclass',
        'JavaScript Interactivity Mini-Challenge'
      ]}
    }).toArray();

    for (const c of finalCourses) {
      let withVideo = 0, withoutVideo = 0;
      for (const mod of (c.modules || [])) {
        for (const les of (mod.lessons || [])) {
          if (les.type === 'quiz' || les.isAssignment) continue;
          if (les.videoUrl) withVideo++;
          else withoutVideo++;
        }
      }
      console.log(`📚 ${c.title.substring(0, 55)}`);
      console.log(`   ✅ With video: ${withVideo}`);
      console.log(`   ❌ Without video: ${withoutVideo}`);
    }

    console.log(`\n🎉 Updated ${updatedCount} lessons with video URLs!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedVideoUrls();
