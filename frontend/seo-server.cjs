/**
 * Production static server with crawler HTML for /courses/:id.
 * Humans still get the SPA. Bots (search, social, AI) get DB-backed
 * title + syllabus so share previews and GEO/SEO work without client JS.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');

const PORT = Number(process.env.PORT || 8080);
const DIST = path.join(__dirname, 'dist');
const API = (process.env.VITE_API_URL || 'https://api.bootskills.com').replace(/\/graphql\/?$/, '');

const BOT_RE =
  /bot|crawl|slurp|spider|facebookexternalhit|facebot|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|applebot|duckduckbot|yandex|baidu|gptbot|chatgpt|claude|anthropic|perplexity|bytespider|ccbot|amazonbot|meta-external|cohere|ia_archiver|preview|embedly|quora link preview|redditbot|skypeuripreview|vkshare|w3c_validator/i;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function proxyApi(req, res, apiPath) {
  const target = `${API}${apiPath}`;
  fetch(target, { headers: { 'user-agent': req.headers['user-agent'] || 'BootskillsSeoServer' } })
    .then(async (upstream) => {
      const buf = Buffer.from(await upstream.arrayBuffer());
      const type = upstream.headers.get('content-type') || 'text/html; charset=utf-8';
      send(res, upstream.status, {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=300',
      }, buf);
    })
    .catch(() => {
      send(res, 502, { 'Content-Type': 'text/plain' }, 'SEO upstream unavailable');
    });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const hashed = /\.[a-f0-9]{8,}\./i.test(path.basename(filePath));
  const cache = hashed
    ? 'public, immutable, max-age=31536000'
    : ext === '.html' || path.basename(filePath) === 'env-config.js' || path.basename(filePath) === 'sw.js'
      ? 'no-cache, must-revalidate'
      : 'public, max-age=86400';
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
  });
  pipeline(stream, res, () => {});
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const ua = req.headers['user-agent'] || '';
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/course-sitemap.xml' || pathname === '/blog-sitemap.xml' || pathname === '/llms.txt') {
    return proxyApi(req, res, pathname);
  }
  if (pathname.startsWith('/api/seo/')) {
    return proxyApi(req, res, pathname);
  }

  const courseMatch = pathname.match(/^\/courses\/([^/]+)\/?$/);
  if (courseMatch && req.method === 'GET' && BOT_RE.test(ua)) {
    return proxyApi(req, res, `/seo/course/${encodeURIComponent(courseMatch[1])}`);
  }

  let safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  if (safe === '/' || safe === '') safe = '/index.html';
  const filePath = path.join(DIST, safe);
  if (filePath.startsWith(DIST) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  const indexPath = path.join(DIST, 'index.html');
  if (fs.existsSync(indexPath)) return serveFile(res, indexPath);
  send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[seo-server] listening on ${PORT}, API=${API}`);
});
