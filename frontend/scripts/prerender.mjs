/**
 * Prerender script — generates static HTML snapshots for social crawlers.
 *
 * Usage:
 *   node scripts/prerender.mjs
 *
 * Requires:
 *   - puppeteer (install via: npm install -D puppeteer)
 *   - The app to be built first (npm run build)
 *   - A local server serving the built app (e.g., npx serve dist -l 3000)
 *
 * What it does:
 *   - Launches headless Chrome
 *   - Visits each route in ROUTES
 *   - Waits for the page to fully render (including Helmet meta tags)
 *   - Saves the resulting HTML into dist/<route>/index.html
 *
 * Social media crawlers that CAN read these prerendered files:
 *   - Facebook / LinkedIn (og: tags)
 *   - Twitter / X (twitter: tags)
 *   - WhatsApp / Telegram / Discord / Slack
 *   - Googlebot
 */

// Dynamic import of puppeteer — gracefully handled if not installed
let puppeteer;
try {
  puppeteer = await import('puppeteer');
} catch {
  console.error('✗ puppeteer is not installed. Run: npm install -D puppeteer');
  process.exit(1);
}

const { launch } = puppeteer;
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const BASE_URL = process.env.PRERENDER_BASE_URL || 'http://localhost:3000';

// ═══ Routes to prerender ═══════════════════════════════════════════════════
// Add all public shareable routes here. Dynamic routes (courses, blog, etc.)
// can be added via a data-driven approach or as representative samples.
const ROUTES = [
  '/',
  '/explore',
  '/blog',
  '/events',
  '/internships',
  '/services',
  '/about',
  '/team',
  '/contact',
  '/partners',
  '/projects',
];

// ═══ Dynamic routes — fetched from the API ════════════════════════════════
// These require the backend to be running at API_BASE_URL.
const API_BASE_URL = process.env.PRERENDER_API_URL || 'https://api.bootskills.com';

async function fetchDynamicRoutes() {
  const dynamicRoutes = [];
  try {
    // Fetch course IDs
    const coursesRes = await fetch(`${API_BASE_URL}/api/courses/slugs`).catch(() => null);
    if (coursesRes?.ok) {
      const slugs = await coursesRes.json();
      for (const slug of slugs) {
        dynamicRoutes.push(`/courses/${slug}`);
      }
    }

    // Fetch blog slugs
    const blogsRes = await fetch(`${API_BASE_URL}/api/blogs`).catch(() => null);
    if (blogsRes?.ok) {
      const data = await blogsRes.json();
      const blogs = data.blogs || data;
      for (const blog of blogs) {
        dynamicRoutes.push(`/blog/${blog.slug}`);
      }
    }

    // Fetch internship program IDs
    // (Uses GraphQL — would need a direct fetch or API endpoint)
    console.log(`  → Found ${dynamicRoutes.length} dynamic routes`);
  } catch (err) {
    console.warn('  ⚠ Could not fetch dynamic routes:', err.message);
  }
  return dynamicRoutes;
}

async function main() {
  console.log('\n═══ Prerender Script ═══\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output:   ${DIST}\n`);

  const allRoutes = [...ROUTES];
  let dynamicRoutes = [];

  try {
    dynamicRoutes = await fetchDynamicRoutes();
    allRoutes.push(...dynamicRoutes);
  } catch {
    console.log('  → Using static routes only');
  }

  console.log(`Total routes to prerender: ${allRoutes.length}\n`);

  const browser = await launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // Set a viewport so social crawlers see the desktop layout
  await page.setViewport({ width: 1200, height: 630 });

  let success = 0;
  let failed = 0;

  for (const route of allRoutes) {
    const url = `${BASE_URL}${route}`;
    const outputPath = join(DIST, route === '/' ? 'index' : route, 'index.html');

    try {
      console.log(`  → ${route}...`);

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Give Helmet time to update the document head
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));

      // Wait for the main app container to render
      await page.waitForSelector('#root', { timeout: 10000 });

      // Get the full rendered HTML
      const html = await page.content();

      // Write to disk
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, html, 'utf-8');

      console.log(`    ✓ Saved to ${outputPath.replace(DIST, 'dist')}`);
      success++;
    } catch (err) {
      console.error(`    ✗ Failed: ${err.message}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\n═══ Done: ${success} succeeded, ${failed} failed ═══\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
