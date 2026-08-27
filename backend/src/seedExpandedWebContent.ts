/**
 * 🌱 SEED EXPANDED: Deep CSS & Deep DOM Manipulation
 * 
 * Updates the two Advanced Web courses with massive expanded content:
 * - 8 new deep CSS lessons
 * - 6 new deep DOM lessons
 * - More quizzes and code exercises
 * 
 * Usage: npx ts-node src/seedExpandedWebContent.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true';

// ═══════════════════════════════════════════════════════════════
// NEW LESSONS — DEEP CSS (to add to Module 3, 4, 5, 6)
// ═══════════════════════════════════════════════════════════════

const DEEP_CSS_LESSONS = {
  // ── Added to Module 3: CSS Fundamentals ──
  displayTypes: {
    title: 'CSS Display — Block, Inline, Inline-Block, None, Flex, Grid',
    type: 'article' as const,
    content: `<h2>🔲 CSS Display Property — The Most Important CSS Property</h2>
<p>The <code>display</code> property determines <strong>how an element appears in the layout</strong>. It controls whether an element is block, inline, or uses a layout system.</p>

<h3>The 6 Display Values You Must Know</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Value</th><th>Behavior</th><th>Respects width/height?</th><th>Line break?</th></tr>
  <tr><td><code>block</code></td><td>Full width, new line</td><td>✅ Yes</td><td>Yes — starts new line</td></tr>
  <tr><td><code>inline</code></td><td>Only needed width</td><td>❌ No (ignored!)</td><td>No — flows in text</td></tr>
  <tr><td><code>inline-block</code></td><td>Inline flow + block sizing</td><td>✅ Yes</td><td>No — flows in text</td></tr>
  <tr><td><code>none</code></td><td>Completely removed</td><td>N/A</td><td>N/A (hidden)</td></tr>
  <tr><td><code>flex</code></td><td>Flex container (1D layout)</td><td>✅ Yes</td><td>Yes — new line</td></tr>
  <tr><td><code>grid</code></td><td>Grid container (2D layout)</td><td>✅ Yes</td><td>Yes — new line</td></tr>
</table>

<h3>Visual Comparison</h3>
<div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
  <h4>Block elements (each on new line):</h4>
  <div style="display:block;background:#bbdefb;padding:8px;margin:4px 0;">Block 1 — full width</div>
  <div style="display:block;background:#c8e6c9;padding:8px;margin:4px 0;">Block 2 — full width</div>
  
  <h4 style="margin-top:16px;">Inline elements (flow in same line):</h4>
  <div style="background:#fff3e0;padding:8px;">
    <span style="background:#ffcc80;padding:4px 8px;">Inline 1</span>
    <span style="background:#ffcc80;padding:4px 8px;">Inline 2</span>
    <span style="background:#ffcc80;padding:4px 8px;">Inline 3</span>
  </div>
  
  <h4 style="margin-top:16px;">Inline-block (inline flow + block sizing):</h4>
  <div style="background:#f3e5f5;padding:8px;">
    <span style="display:inline-block;width:120px;background:#ce93d8;padding:8px;text-align:center;">IB 1</span>
    <span style="display:inline-block;width:120px;background:#ce93d8;padding:8px;text-align:center;">IB 2</span>
    <span style="display:inline-block;width:120px;background:#ce93d8;padding:8px;text-align:center;">IB 3</span>
  </div>
</div>

<h3>⚠️ The Inline Trap</h3>
<pre><code>/* INLINE — width/height are IGNORED! */
span {
  display: inline;
  width: 200px;    /* ❌ IGNORED */
  height: 100px;   /* ❌ IGNORED */
  padding: 20px;   /* ⚠️ Only horizontal padding works */
  margin: 20px;    /* ⚠️ Only horizontal margin works */
}

/* FIX: Change to inline-block */
span {
  display: inline-block;
  width: 200px;    /* ✅ Works now! */
  height: 100px;   /* ✅ Works now! */
  padding: 20px;   /* ✅ All sides work! */
  margin: 20px;    /* ✅ All sides work! */
}</code></pre>

<h3>display: none vs visibility: hidden</h3>
<pre><code>/* None — removes from layout entirely */
.hidden { display: none; }
/* → Element takes up NO space. Other elements fill the gap. */

/* Visibility — hides but keeps space */
.invisible { visibility: hidden; }
/* → Element is invisible but still takes up space. */</code></pre>

<div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;">
  <strong>💡 Pro Tip:</strong> Use <code>display: none</code> for toggling menus/modals.
  Use <code>visibility: hidden</code> when you want to hide something but preserve layout space.
</div>`,
    duration: 25,
    resources: [],
  },

  overflow: {
    title: 'CSS Overflow — Handling Content That Overflows',
    type: 'article' as const,
    content: `<h2>📦 CSS Overflow</h2>
<p>When content is bigger than its container, <code>overflow</code> controls what happens.</p>

<pre><code>.container {
  width: 300px;
  height: 200px;

  overflow: visible;   /* default — content spills out */
  overflow: hidden;    /* cuts off overflow, no scroll */
  overflow: scroll;    /* always shows scrollbars */
  overflow: auto;      /* shows scrollbar only when needed */
  overflow: clip;      /* like hidden but can't scroll at all */
}

/* Overflow per axis */
.container {
  overflow-x: auto;   /* horizontal scroll only */
  overflow-y: hidden; /* vertical overflow hidden */
}

/* Custom scrollbar styling */
.container::-webkit-scrollbar {
  width: 8px;
}
.container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.container::-webkit-scrollbar-thumb:hover {
  background: #555;
}</code></pre>

<h3>Text Overflow — Ellipsis</h3>
<pre><code>/* Truncate long text with "..." */
.truncate {
  white-space: nowrap;      /* prevent wrapping */
  overflow: hidden;         /* hide overflow */
  text-overflow: ellipsis;  /* show "..." */
}

/* Multiline truncation (3 lines max) */
.multiline-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 3;    /* max 3 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}</code></pre>

<h3>Visual Example</h3>
<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;">
  <div style="width:200px;height:80px;overflow:hidden;background:#ffebee;border:1px solid #e53935;border-radius:8px;padding:8px;">
    <strong>overflow: hidden</strong><br>This content overflows but is hidden. No scrollbar visible.
  </div>
  <div style="width:200px;height:80px;overflow:auto;background:#e3f2fd;border:1px solid #1976d2;border-radius:8px;padding:8px;">
    <strong>overflow: auto</strong><br>This content overflows and shows a scrollbar only when needed. Scroll down to see more content below this line.
  </div>
  <div style="width:200px;background:#e8f5e9;border:1px solid #43a047;border-radius:8px;padding:8px;">
    <strong>Truncated text:</strong>
    <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">This is a very long text that gets truncated with ellipsis when it overflows</div>
  </div>
</div>`,
    duration: 20,
    resources: [
      { title: 'MDN Overflow', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/overflow', type: 'link' as const },
    ],
  },

  opacityVisibilityCursors: {
    title: 'CSS Opacity, Visibility, Cursors & User Selection',
    type: 'article' as const,
    content: `<h2>👁️ Opacity, Visibility & Cursors</h2>

<h3>Opacity — Transparency</h3>
<pre><code>.element {
  opacity: 1;       /* fully visible (default) */
  opacity: 0.5;     /* 50% transparent */
  opacity: 0;       /* fully transparent (invisible but still takes space!) */
}

/* Hover fade effect */
.card {
  opacity: 0.9;
  transition: opacity 0.3s ease;
}
.card:hover {
  opacity: 1;
}

/* Dim an overlay */
.overlay {
  background: rgba(0, 0, 0, 0.6);  /* 60% black overlay */
  position: fixed;
  inset: 0;
}</code></pre>

<h3>Visibility vs Display vs Opacity</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Property</th><th>Visible?</th><th>Takes Space?</th><th>Clickable?</th><th>Transition?</th></tr>
  <tr><td><code>opacity: 0</code></td><td>No</td><td>✅ Yes</td><td>✅ Yes</td><td>✅ Yes</td></tr>
  <tr><td><code>visibility: hidden</code></td><td>No</td><td>✅ Yes</td><td>❌ No</td><td>✅ Yes</td></tr>
  <tr><td><code>display: none</code></td><td>No</td><td>❌ No</td><td>❌ No</td><td>❌ No</td></tr>
</table>

<h3>Cursors — Tell Users What's Clickable</h3>
<pre><code>/* Pointer — hand cursor for clickable things */
a, button, .clickable {
  cursor: pointer;
}

/* Other cursor types */
.loading   { cursor: wait; }        /* hourglass */
.moving    { cursor: move; }        /* 4-way arrow */
.text      { cursor: text; }        /* I-beam */
.not-allowed { cursor: not-allowed; }/*禁止 sign */
.zoom-in   { cursor: zoom-in; }     /* magnifying glass + */
.col-resize { cursor: col-resize; } /* horizontal resize */
.help      { cursor: help; }        /* question mark */
.crosshair { cursor: crosshair; }   /* crosshair */
.progress  { cursor: progress; }    /* spinning */

/* Custom cursor image */
.custom-cursor {
  cursor: url('cursor.png'), auto;
}</code></pre>

<h3>User Selection — Prevent Text Copying</h3>
<pre><code>/* Prevent selection (good for buttons) */
.no-select {
  user-select: none;
  -webkit-user-select: none;
}

/* Allow selection only on specific parts */
.selectable {
  user-select: text;
}

/* Select all text in an element */
.select-all {
  user-select: all;
}</code></pre>

<h3>Pointer Events</h3>
<pre><code>/* Disable all pointer events */
.disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* Only allow clicking on specific child */
.parent { pointer-events: none; }
.parent .clickable { pointer-events: auto; }</code></pre>`,
    duration: 20,
    resources: [
      { title: 'MDN cursor', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/cursor', type: 'link' as const },
    ],
  },

  filtersAndBackdrop: {
    title: 'CSS Filters & Backdrop Filters — Blur, Brightness, Grayscale',
    type: 'article' as const,
    content: `<h2>🎨 CSS Filters — Image Effects</h2>
<p>Filters apply visual effects to elements. Great for images, cards, and overlays.</p>

<pre><code>/* Blur */
.blurred { filter: blur(5px); }

/* Brightness */
.bright { filter: brightness(1.5); }  /* 150% bright */
.dim { filter: brightness(0.5); }     /* 50% bright */

/* Contrast */
.high-contrast { filter: contrast(200%); }
.low-contrast { filter: contrast(50%); }

/* Grayscale */
.grayscale { filter: grayscale(100%); }

/* Sepia (old photo look) */
.sepia { filter: filter: sepia(100%); }

/* Saturate */
.vivid { filter: saturate(200%); }
.muted { filter: saturate(50%); }

/* Hue Rotate */
.color-shift { filter: hue-rotate(90deg); }

/* Invert (negative) */
.inverted { filter: invert(100%); }

/* Drop Shadow (like box-shadow but works on non-rectangular shapes) */
.shadowed { filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.3)); }

/* Combine multiple filters */
.combined {
  filter: brightness(1.2) contrast(1.1) saturate(1.3) blur(0px);
}

/* Animate filters! */
.animated-filter {
  filter: grayscale(100%);
  transition: filter 0.5s ease;
}
.animated-filter:hover {
  filter: grayscale(0%);  /* color appears on hover */
}</code></pre>

<h3>Backdrop Filter — Blur Behind Element</h3>
<pre><code>/* Glassmorphism effect */
.glass-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

/* Frosted glass modal */
.modal-overlay {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

/* Frosted nav bar */
.frosted-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}</code></pre>

<h3>Live Examples</h3>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;">
  <div style="width:150px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:blur(0px);">Normal</div>
  <div style="width:150px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:blur(2px);">Blurred</div>
  <div style="width:150px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:grayscale(100%);">Grayscale</div>
  <div style="width:150px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:brightness(1.5);">Bright</div>
  <div style="width:150px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:invert(100%);">Inverted</div>
</div>

<h3>📷 Grayscale-to-Color Hover Effect</h3>
<div style="width:200px;height:130px;background:linear-gradient(135deg,#e53935,#ff9800);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;filter:grayscale(100%);cursor:pointer;transition:filter 0.5s ease;margin:16px auto;" onmouseover="this.style.filter='grayscale(0%)'" onmouseout="this.style.filter='grayscale(100%)'">👆 Hover Me</div>
<p style="text-align:center;font-size:0.9em;color:#666;">This image goes from grayscale to full color on hover!</p>`,
    duration: 25,
    resources: [
      { title: 'MDN filter', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/filter', type: 'link' as const },
      { title: 'CSS Filter Playground', url: 'https://css-tricks.com/almanac/properties/f/filter/', type: 'link' as const },
    ],
  },

  objectFitClipPath: {
    title: 'CSS object-fit, clip-path & Masking',
    type: 'article' as const,
    content: `<h2>🖼️ object-fit — How Images Fill Their Container</h2>

<pre><code>/* object-fit controls how an image/video fills its box */
img, video {
  width: 300px;
  height: 200px;

  object-fit: cover;      /* fills container, crops excess (like background-size: cover) */
  object-fit: contain;    /* fits inside container, may leave gaps */
  object-fit: fill;       /* stretches to fill (may distort!) */
  object-fit: none;       /* original size, no resizing */
  object-fit: scale-down; /* like contain, but never enlarges */
}

/* Position the crop point */
img {
  object-fit: cover;
  object-position: center top;    /* crop from top center */
  object-position: 25% 75%;       /* custom position */
}

/* Avatar circle — perfect square crop */
.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}</code></pre>

<h3>clip-path — Cut Shapes with CSS</h3>
<pre><code>/* Circle */
.circle {
  clip-path: circle(50%);
}

/* Ellipse */
.ellipse {
  clip-path: ellipse(50% 30% at 50% 50%);
}

/* Polygon — any shape! */
.polygon {
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); /* diamond */
}

/* Hexagon */
.hexagon {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
}

/* Arrow shape */
.arrow {
  clip-path: polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%);
}

/* Triangle */
.triangle {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

/* Animated clip-path */
.animate-clip {
  clip-path: circle(50%);
  transition: clip-path 0.5s ease;
}
.animate-clip:hover {
  clip-path: circle(70%);
}

/* Slanted section divider */
.slanted {
  clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%);
}

/* Star shape */
.star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}</code></pre>

<h3>Visual Examples</h3>
<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin:16px 0;">
  <div style="width:100px;height:100px;background:linear-gradient(135deg,#667eea,#764ba2);clip-path:circle(50%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">Circle</div>
  <div style="width:100px;height:100px;background:linear-gradient(135deg,#e53935,#ff9800);clip-path:polygon(50% 0%, 0% 100%, 100% 100%);display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;color:white;font-weight:bold;">Triangle</div>
  <div style="width:100px;height:100px;background:linear-gradient(135deg,#43a047,#66bb6a);clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">Diamond</div>
  <div style="width:100px;height:100px;background:linear-gradient(135deg,#1565c0,#42a5f5);clip-path:polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:0.8em;">Hexagon</div>
  <div style="width:100px;height:100px;background:linear-gradient(135deg,#ff6f00,#ffca28);clip-path:polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:0.8em;">Star</div>
</div>`,
    duration: 25,
    resources: [
      { title: 'MDN object-fit', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit', type: 'link' as const },
      { title: 'Clippy — CSS clip-path maker', url: 'https://bennettfeely.com/clippy/', type: 'link' as const },
    ],
  },

  customProperties: {
    title: 'CSS Custom Properties (Variables) & calc()',
    type: 'article' as const,
    content: `<h2>🎛️ CSS Custom Properties (Variables)</h2>
<p>CSS variables let you <strong>reuse values</strong> and change them in one place.</p>

<pre><code>/* Define variables on :root (global) */
:root {
  --primary: #667eea;
  --primary-dark: #764ba2;
  --text: #333;
  --bg: #f5f5f5;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
  --radius: 12px;
  --shadow: 0 4px 12px rgba(0,0,0,0.1);
  --font-main: 'Inter', sans-serif;
}

/* Use variables with var() */
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-main);
}

.card {
  padding: var(--spacing-md);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 2px solid var(--primary);
}

.button {
  background: var(--primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius);
  color: white;
  border: none;
  transition: background 0.3s;
}
.button:hover {
  background: var(--primary-dark);
}

/* Dark mode with variables! */
[data-theme="dark"] {
  --primary: #a78bfa;
  --text: #e2e8f0;
  --bg: #1a1a2e;
}

/* Scoped variables */
.sidebar {
  --sidebar-bg: #1a1a2e;
  --sidebar-text: white;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
}

/* Fallback values */
.element {
  color: var(--custom-color, #333);  /* falls back to #333 if undefined */
}</code></pre>

<h3>calc() — Math in CSS</h3>
<pre><code>/* Basic arithmetic */
.element {
  width: calc(100% - 40px);           /* responsive minus fixed */
  width: calc(50% - 16px);            /* half width minus gap */
  height: calc(100vh - 80px);         /* full viewport minus navbar */
  font-size: calc(14px + 0.5vw);      /* fluid font size */
  margin-left: calc(-50vw + 50%);     /* edge-to-edge container */
}

/* Mix units! */
.sidebar {
  width: calc(100% - 250px);          /* minus sidebar width */
}
.hero-text {
  font-size: clamp(1rem, 5vw, 3rem);  /* responsive font */
}</code></pre>

<h3>min(), max(), clamp() — Modern CSS Math</h3>
<pre><code>/* min() — takes the smaller value */
.title { font-size: min(4rem, 8vw); }        /* never bigger than 4rem */

/* max() — takes the larger value */
.title { font-size: max(1.5rem, 3vw); }      /* never smaller than 1.5rem */

/* clamp() — min + preferred + max (THE BEST for responsive) */
.title { font-size: clamp(1.5rem, 4vw, 3rem); }  /* fluid between 1.5rem and 3rem */
.padding { padding: clamp(1rem, 5vw, 4rem); }
.width { max-width: clamp(300px, 90%, 1200px); }

/* Container width — responsive but bounded */
.container {
  width: clamp(320px, 90vw, 1200px);
  margin: 0 auto;
}</code></pre>

<div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;">
  <strong>💡 Pro Tip:</strong> Replace most media queries with <code>clamp()</code>!
  <pre style="margin:8px 0 0;"><code>/* Before: 3 media queries */
h1 { font-size: 1.5rem; }
@media (min-width: 768px) { h1 { font-size: 2.5rem; } }
@media (min-width: 1024px) { h1 { font-size: 3.5rem; } }

/* After: 1 line with clamp() */
h1 { font-size: clamp(1.5rem, 4vw, 3.5rem); }</code></pre>
</div>`,
    duration: 30,
    resources: [
      { title: 'MDN Custom Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties', type: 'link' as const },
      { title: 'CSS clamp() Guide', url: 'https://css-tricks.com/min-max-clamp/', type: 'link' as const },
    ],
    codeExercises: [
      {
        id: 'web-deep-css-ex1',
        title: 'Build a Theme with CSS Variables',
        description: 'Create a card component that uses CSS custom properties for colors and spacing, and can switch between light and dark themes.',
        language: 'css',
        type: 'write',
        initialCode: `<style>
/* Define CSS variables for a theme system:
   --bg, --text, --card-bg, --accent
   Create a .card that uses these variables
   Create a .dark theme that changes the variables
*/

:root {
  
}

.card {
  
}
</style>
<div class="card">
  <h3>Themed Card</h3>
  <p>This card uses CSS variables.</p>
</div>`,
        solutionCode: `<style>
:root {
  --bg: #f5f5f5;
  --text: #333;
  --card-bg: white;
  --accent: #667eea;
  --shadow: 0 4px 12px rgba(0,0,0,0.1);
}
[data-theme="dark"] {
  --bg: #1a1a2e;
  --text: #e2e8f0;
  --card-bg: #16213e;
  --accent: #a78bfa;
  --shadow: 0 4px 12px rgba(0,0,0,0.3);
}
body { background: var(--bg); color: var(--text); font-family: Arial; }
.card {
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  box-shadow: var(--shadow);
  border-left: 4px solid var(--accent);
  max-width: 400px;
  margin: 20px auto;
}
</style>
<div data-theme="dark" class="card">
  <h3>Themed Card</h3>
  <p>This card uses CSS variables and supports dark mode.</p>
</div>`,
        testCode: '',
        expectedOutput: '',
      },
    ],
  },

  containerQueries: {
    title: 'CSS Container Queries — Responsive to Parent, Not Viewport',
    type: 'article' as const,
    content: `<h2>📱 Container Queries — The Future of Responsive Design</h2>
<p>Media queries respond to the <strong>viewport</strong>. Container queries respond to the <strong>parent element</strong>. This is huge for reusable components!</p>

<pre><code>/* 1. Define a containment context */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 2. Query the container */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;
  }
}

@container card (min-width: 600px) {
  .card {
    grid-template-columns: 250px 1fr 150px;
  }
}

/* Use container queries in a sidebar */
.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

@container sidebar (min-width: 300px) {
  .widget {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}</code></pre>

<h3>Why Container Queries Matter</h3>
<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;">
  <div style="flex:1;min-width:250px;background:#ffebee;padding:16px;border-radius:8px;">
    <h4>❌ Media Query (old way)</h4>
    <p>Component changes based on SCREEN size.</p>
    <p>Problem: A card in a sidebar vs main area gets the same styles at the same viewport width.</p>
  </div>
  <div style="flex:1;min-width:250px;background:#e8f5e9;padding:16px;border-radius:8px;">
    <h4>✅ Container Query (new way)</h4>
    <p>Component changes based on PARENT size.</p>
    <p>Same card in sidebar → compact layout. Same card in main → full layout. Different sizes of the SAME component!</p>
  </div>
</div>

<h3>Container Query Sizes</h3>
<pre><code>@container (min-width: 200px) { /* narrow */ }
@container (min-width: 400px) { /* medium */ }
@container (min-width: 600px) { /* wide */ }
@container (min-height: 300px) { /* tall */ }
@container card (orientation: landscape) { /* wide container */ }</code></pre>`,
    duration: 20,
    resources: [
      { title: 'MDN Container Queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries', type: 'link' as const },
    ],
  },

  scrollDrivenAnimations: {
    title: 'CSS Scroll-Driven Animations & Scroll Snap',
    type: 'article' as const,
    content: `<h2>📜 Scroll-Driven Animations & Scroll Snap</h2>

<h3>Scroll Snap — Smooth Snap Points</h3>
<pre><code>/* Horizontal carousel that snaps */
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;   /* mandatory snap */
  gap: 16px;
  padding: 16px;
}
.carousel-item {
  flex: 0 0 300px;
  scroll-snap-align: center;       /* snap to center */
}

/* Vertical full-page scroll snap */
.fullpage {
  scroll-snap-type: y mandatory;
  height: 100vh;
  overflow-y: auto;
}
.section {
  scroll-snap-align: start;        /* snap to top of each section */
  height: 100vh;
}

/* Horizontal full-page */
.horizontal-scroll {
  scroll-snap-type: x mandatory;
  display: flex;
  overflow-x: auto;
}
.horizontal-scroll section {
  flex: 0 0 100vw;
  scroll-snap-align: start;
}</code></pre>

<h3>Scroll-Driven Animations (CSS only!)</h3>
<pre><code>/* Animate elements as you scroll */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-reveal {
  animation: fadeInUp linear both;
  animation-timeline: view();       /* animate based on element visibility */
  animation-range: entry 0% cover 40%;
}

/* Progress bar that fills as you scroll */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: #667eea;
  width: 100%;
  transform-origin: left;
  animation: progress linear;
  animation-timeline: scroll();     /* animate based on page scroll */
}

@keyframes progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Parallax effect */
.parallax-bg {
  animation: parallax linear;
  animation-timeline: scroll();
}
@keyframes parallax {
  from { transform: translateY(0); }
  to { transform: translateY(-100px); }
}</code></pre>

<h3>Scroll-Linked Animations</h3>
<pre><code>/* Timeline linked to scroll position */
.reveal {
  animation: slideIn linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* Sticky header animation */
.sticky-header {
  position: sticky;
  top: 0;
  animation: shrinkHeader linear;
  animation-timeline: scroll();
  animation-range: 0px 200px;
}

@keyframes shrinkHeader {
  from { padding: 24px; font-size: 1.5rem; }
  to { padding: 8px; font-size: 1rem; }
}</code></pre>`,
    duration: 25,
    resources: [
      { title: 'MDN Scroll Snap', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type', type: 'link' as const },
      { title: 'Chrome Scroll Animations Demo', url: 'https://developer.chrome.com/docs/css-ui/scroll-driven-animations', type: 'link' as const },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// NEW LESSONS — DEEP DOM MANIPULATION (to add to Module 8)
// ═══════════════════════════════════════════════════════════════

const DEEP_DOM_LESSONS = {
  allSelectors: {
    title: 'All 10 Ways to Select DOM Elements',
    type: 'article' as const,
    content: `<h2>🔍 All DOM Selection Methods — The Complete Guide</h2>
<p>There are <strong>10+ ways</strong> to select elements. Know them all!</p>

<h3>1. By ID</h3>
<pre><code>const el = document.getElementById('header');
// ✅ Fastest — only one element can have an ID
// Returns: single Element or null</code></pre>

<h3>2. By Class Name</h3>
<pre><code>const cards = document.getElementsByClassName('card');
// Returns: live HTMLCollection (updates automatically!)
// ⚠️ NOT an array — use Array.from() to convert

Array.from(cards).forEach(card => {
  card.classList.add('active');
});</code></pre>

<h3>3. By Tag Name</h3>
<pre><code>const paragraphs = document.getElementsByTagName('p');
// Returns: live HTMLCollection
// Useful when you want ALL elements of a type</code></pre>

<h3>4. CSS Selector — First Match</h3>
<pre><code>const el = document.querySelector('.card.active');
const el = document.querySelector('#main > h1');
const el = document.querySelector('nav a[href="/about"]');
// Returns: first matching Element or null</code></pre>

<h3>5. CSS Selector — All Matches</h3>
<pre><code>const cards = document.querySelectorAll('.card');
// Returns: static NodeList (NOT live — snapshot)
// Can use forEach directly!

cards.forEach(card => card.style.border = '2px solid red');

// Convert to array for map/filter
const bigCards = Array.from(cards).filter(c => c.offsetHeight > 200);</code></pre>

<h3>6. Complex Selectors</h3>
<pre><code>// Attribute selectors
document.querySelectorAll('a[target="_blank"]');    // external links
document.querySelectorAll('input[type="email"]');   // email inputs
document.querySelectorAll('[data-role="admin"]');    // custom attributes
document.querySelectorAll('a[href^="https://"]');   // starts with
document.querySelectorAll('a[href$=".pdf"]');       // ends with
document.querySelectorAll('a[href*="blog"]');       // contains

// Pseudo-class selectors
document.querySelectorAll('li:first-child');
document.querySelectorAll('li:last-child');
document.querySelectorAll('li:nth-child(2n)');       // even items
document.querySelectorAll('li:nth-child(2n+1)');     // odd items
document.querySelectorAll('input:focus');
document.querySelectorAll('input:checked');
document.querySelectorAll('input:disabled');
document.querySelectorAll('div:empty');
document.querySelectorAll('a:not(.external)');</code></pre>

<h3>7-10. Traversal (Select Relative to Another Element)</h3>
<pre><code>const item = document.querySelector('.current');

// Parent
item.parentElement                    // direct parent
item.closest('.container')            // nearest ancestor matching selector

// Children
item.children                         // direct children (HTMLCollection)
item.children[0]                      // first child element
item.firstElementChild                // first child element
item.lastElementChild                 // last child element

// Siblings
item.nextElementSibling               // next element sibling
item.previousElementSibling           // previous element sibling

// All ancestors (for debugging)
function getAncestors(el) {
  const ancestors = [];
  while (el.parentElement) {
    ancestors.push(el.parentElement);
    el = el.parentElement;
  }
  return ancestors;
}</code></pre>

<h3>Performance Comparison</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Method</th><th>Speed</th><th>Returns</th><th>Live?</th><th>Best For</th></tr>
  <tr><td>getElementById</td><td>⚡ Fastest</td><td>Element</td><td>N/A</td><td>Unique elements</td></tr>
  <tr><td>querySelector</td><td>⚡ Fast</td><td>Element</td><td>No</td><td>First match</td></tr>
  <tr><td>querySelectorAll</td><td>⚡ Fast</td><td>NodeList</td><td>No</td><td>All matches</td></tr>
  <tr><td>getElementsByClassName</td><td>⚡ Fast</td><td>HTMLCollection</td><td>✅ Yes</td><td>Dynamic lists</td></tr>
  <tr><td>getElementsByTagName</td><td>⚡ Fast</td><td>HTMLCollection</td><td>✅ Yes</td><td>All of a tag</td></tr>
</table>

<div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;">
  <strong>🏆 Recommendation:</strong> Use <code>querySelector</code> and <code>querySelectorAll</code> for most cases. They use CSS selectors you already know!
</div>`,
    duration: 30,
    resources: [
      { title: 'MDN Document.querySelector', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector', type: 'link' as const },
    ],
    codeExercises: [
      {
        id: 'web-dom-deep-ex1',
        title: 'Select Elements Challenge',
        description: 'Select all required email inputs that are not disabled using a single querySelectorAll call.',
        language: 'javascript',
        type: 'test',
        initialCode: '// Select all input[type="email"] that are not disabled\nfunction selectEmailInputs() {\n  // Use querySelectorAll with a complex selector\n  \n}',
        solutionCode: 'function selectEmailInputs() {\n  return document.querySelectorAll(\'input[type="email"]:not(:disabled)\');\n}',
        testCode: `\ndescribe("selectEmailInputs", function() {
  it("returns a NodeList", function() {
    const result = selectEmailInputs();
    assert.ok(result, "Should return a result");
  });
});`,
      },
    ],
  },

  eventDelegation: {
    title: 'Event Delegation — Handle Events on Dynamic Elements',
    type: 'article' as const,
    content: `<h2>🎯 Event Delegation — The #1 DOM Performance Pattern</h2>
<p>Instead of adding event listeners to <strong>every element</strong>, add ONE listener to a parent and use the event's <code>target</code>.</p>

<h3>The Problem</h3>
<pre><code>// ❌ BAD: Adding listener to every item
document.querySelectorAll('.todo-item').forEach(item => {
  item.addEventListener('click', handleClick);  // if you add new items later, they won't have listeners!
});

// ❌ Even worse: listener per element
function addTodo(text) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.textContent = text;
  li.addEventListener('click', () => li.remove());  // creates new function each time
  list.appendChild(li);
}</code></pre>

<h3>The Solution — Event Delegation</h3>
<pre><code>// ✅ GOOD: ONE listener on the parent
const list = document.querySelector('.todo-list');

list.addEventListener('click', (event) => {
  // event.target = the actual element clicked (could be text inside li)
  // event.currentTarget = the element the listener is on (the ul)
  
  const item = event.target.closest('.todo-item');  // find the li
  if (!item) return;  // clicked somewhere else
  
  if (event.target.classList.contains('delete-btn')) {
    item.remove();
  } else if (event.target.classList.contains('edit-btn')) {
    // edit logic
  }
});

// ✅ New items automatically work!
function addTodo(text) {
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.innerHTML = \`
    <span>\${text}</span>
    <button class="edit-btn">✏️</button>
    <button class="delete-btn">✕</button>
  \`;
  list.appendChild(li);  // no listener needed on li!
}</code></pre>

<h3>How Event Propagation Works</h3>
<pre><code>// Events bubble UP from child to parent
// &lt;div onclick="console.log('parent')"&gt;
//   &lt;button onclick="console.log('child')"&gt;Click&lt;/button&gt;
// &lt;/div&gt;
// Click button → logs 'child' THEN 'parent' (bubbles up!)

// event.target = deepest element clicked
// event.currentTarget = element with the listener
// event.stopPropagation() = stop bubbling</code></pre>

<h3>Event Delegation Pattern for Dynamic Lists</h3>
<pre><code>// Table rows
document.querySelector('table').addEventListener('click', (e) => {
  const row = e.target.closest('tr');
  if (!row) return;
  console.log('Clicked row:', row.dataset.id);
});

// Navigation
document.querySelector('nav').addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  e.preventDefault();
  navigateTo(link.href);
});

// Tabs
document.querySelector('.tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  const index = [...btn.parentElement.children].indexOf(btn);
  showTab(index);
});</code></pre>

<div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;">
  <strong>💡 Rule of thumb:</strong> If you're creating elements dynamically and need events on them, use event delegation on a static parent.
</div>`,
    duration: 30,
    resources: [
      { title: 'MDN Event Delegation', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Building_blocks/Events', type: 'link' as const },
    ],
    codeExercises: [
      {
        id: 'web-dom-deep-ex2',
        title: 'Event Delegation for a List',
        description: 'Use event delegation to handle clicks on any list item. When a list item is clicked, log its text content.',
        language: 'javascript',
        type: 'write',
        initialCode: '// HTML: <ul id="list"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>\n\n// Add ONE event listener on the ul using event delegation\n// When any li is clicked, log its textContent\n',
        solutionCode: 'document.getElementById("list").addEventListener("click", (e) => {\n  const item = e.target.closest("li");\n  if (item) console.log(item.textContent);\n});',
        testCode: '',
        expectedOutput: '',
      },
    ],
  },

  eventPropagation: {
    title: 'Event Propagation — Bubbling, Capturing & stopPropagation',
    type: 'article' as const,
    content: `<h2>📡 Event Propagation — Bubbling & Capturing</h2>
<p>Events don't just happen on one element — they <strong>travel through the DOM tree</strong>.</p>

<h3>The Three Phases</h3>
<div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0;">
  <pre><code>    DOCUMENT
      │
      │  1️⃣ CAPTURING (going DOWN)
      │  ┌──────────────────┐
      │  │     div.parent    │
      │  │  2️⃣ TARGET PHASE  │
      │  │  ┌────────────┐  │
      │  │  │   button    │ ← you click here
      │  │  └────────────┘  │
      │  │     div.parent    │
      │  └──────────────────┘
      │
      │  3️⃣ BUBBLING (going UP)
      ▼
    DOCUMENT</code></pre>
</div>

<h3>Code: Understanding Phases</h3>
<pre><code>const grandparent = document.querySelector('.grandparent');
const parent = document.querySelector('.parent');
const child = document.querySelector('.child');

// Capturing phase (third argument = true)
grandparent.addEventListener('click', () => {
  console.log('1. Grandparent CAPTURING');
}, true);

// Target phase
child.addEventListener('click', () => {
  console.log('2. Child TARGET');
});

// Bubbling phase (default)
grandparent.addEventListener('click', () => {
  console.log('3. Grandparent BUBBLING');
});

// Click child → logs: 1. Grandparent CAPTURING → 2. Child TARGET → 3. Grandparent BUBBLING</code></pre>

<h3>stopPropagation — Prevent Bubbling</h3>
<pre><code>child.addEventListener('click', (e) => {
  console.log('Clicked!');
  e.stopPropagation();  // stops the event from reaching parents
});

// Now grandparent and parent won't get the click event</code></pre>

<h3>stopImmediatePropagation — Stop ALL Other Listeners</h3>
<pre><code>element.addEventListener('click', (e) => {
  console.log('First handler');
  e.stopImmediatePropagation();  // stops ALL other click handlers on this element
});

element.addEventListener('click', () => {
  console.log('Second handler');  // ❌ NEVER runs!
});</code></pre>

<h3>preventDefault vs stopPropagation</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Method</th><th>What It Does</th><th>Use Case</th></tr>
  <tr><td><code>preventDefault()</code></td><td>Stops browser default action</td><td>Form submit, link navigation</td></tr>
  <tr><td><code>stopPropagation()</code></td><td>Stops event from reaching parent elements</td><td>Modal clicks, dropdown menus</td></tr>
  <tr><td><code>stopImmediatePropagation()</code></td><td>Stops ALL other listeners on same element</td><td>Priority handlers</td></tr>
</table>

<h3>Practical: Modal That Closes on Outside Click</h3>
<pre><code>const modal = document.querySelector('.modal');
const modalContent = document.querySelector('.modal-content');

// Click on modal overlay → close (but NOT on modal content)
modal.addEventListener('click', (e) => {
  if (e.target === modal) {  // clicked the overlay, not the content
    modal.classList.remove('show');
  }
});

// Modal content clicks don't bubble to overlay because we check target</code></pre>`,
    duration: 25,
    resources: [
      { title: 'MDN Event Propagation', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Event/eventPhase', type: 'link' as const },
    ],
  },

  mutationObserver: {
    title: 'MutationObserver — Watch for DOM Changes',
    type: 'article' as const,
    content: `<h2>👀 MutationObserver — React to DOM Changes</h2>
<p>MutationObserver lets you <strong>watch for changes</strong> to the DOM (elements added, removed, or modified).</p>

<pre><code>// Create an observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    console.log('Change type:', mutation.type);
    console.log('Added nodes:', mutation.addedNodes.length);
    console.log('Removed nodes:', mutation.removedNodes.length);
    console.log('Target:', mutation.target);
  });
});

// Start observing
observer.observe(document.body, {
  childList: true,       // watch for added/removed children
  subtree: true,         // watch all descendants (not just direct children)
  attributes: true,      // watch for attribute changes
  characterData: true,   // watch for text content changes
});

// Stop observing
observer.disconnect();</code></pre>

<h3>Practical: Auto-save Form</h3>
<pre><code>const form = document.querySelector('form');

const observer = new MutationObserver(() => {
  // Save form data to localStorage whenever DOM changes
  localStorage.setItem('formDraft', form.innerHTML);
});

observer.observe(form, { childList: true, subtree: true, characterData: true });</code></pre>

<h3>Practical: Lazy-load Images</h3>
<pre><code>const imageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === 'IMG' && node.dataset.src) {
        node.src = node.dataset.src;  // load actual image
        node.removeAttribute('data-src');
      }
    });
  });
});

imageObserver.observe(document.body, { childList: true, subtree: true });</code></pre>

<h3>Practical: Chat Messages Auto-scroll</h3>
<pre><code>const chatContainer = document.querySelector('.chat-messages');

const chatObserver = new MutationObserver((mutations) => {
  // New message added → scroll to bottom
  const lastMessage = chatContainer.lastElementChild;
  if (lastMessage) {
    lastMessage.scrollIntoView({ behavior: 'smooth' });
  }
});

chatObserver.observe(chatContainer, { childList: true });</code></pre>`,
    duration: 20,
    resources: [
      { title: 'MDN MutationObserver', url: 'https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver', type: 'link' as const },
    ],
  },

  createDocumentFragment: {
    title: 'Performance: createDocumentFragment & Batch DOM Updates',
    type: 'article' as const,
    content: `<h2>⚡ DOM Performance — Minimize Repaints</h2>
<p>Each DOM change triggers a <strong>reflow</strong> (recalculate layout). Multiple changes = multiple reflows = SLOW!</p>

<h3>The Problem: Multiple Reflows</h3>
<pre><code>// ❌ SLOW: Each appendChild triggers a reflow!
const list = document.querySelector('.list');
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = 'Item ' + i;
  list.appendChild(li);  // triggers reflow 1000 times!
}</code></pre>

<h3>Solution 1: DocumentFragment</h3>
<pre><code>// ✅ FAST: Build in memory, add all at once
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = 'Item ' + i;
  fragment.appendChild(li);  // no reflow — adding to fragment
}
list.appendChild(fragment);  // ONE reflow!</code></pre>

<h3>Solution 2: innerHTML (simpler but less safe)</h3>
<pre><code>// ✅ Also fast (but be careful with XSS)
const html = [];
for (let i = 0; i < 1000; i++) {
  html.push(\`&lt;li&gt;Item \${i}&lt;/li&gt;\`);
}
list.innerHTML = html.join('');  // ONE reflow</code></pre>

<h3>Solution 3: CSS contain (tell browser to isolate)</h3>
<pre><code>/* Tell browser this element's layout is self-contained */
.card-container {
  contain: layout style paint;
  /* Browser only recalculates this container, not the whole page */
}

/* containment types */
.contain { contain: content; }     /* layout + style + paint */
.contain { contain: layout; }      /* layout only */
.contain { contain: paint; }       /* paint only */
.contain { contain: size; }        /* size only */
.contain { contain: strict; }      /* everything */</code></pre>

<h3>Performance Tips Summary</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Tip</th><th>Why</th></tr>
  <tr><td>Batch DOM reads, then writes</td><td>Reading forces layout recalculation</td></tr>
  <tr><td>Use DocumentFragment for bulk inserts</td><td>Single reflow instead of many</td></tr>
  <tr><td>Use requestAnimationFrame for animations</td><td>Syncs with browser repaint cycle</td></tr>
  <tr><td>Use CSS contain for complex layouts</td><td>Isolates layout recalculation</td></tr>
  <tr><td>Debounce scroll/resize handlers</td><td>Prevents excessive function calls</td></tr>
  <tr><td>Use transform instead of top/left</td><td>Transform doesn't trigger reflow</td></tr>
</table>`,
    duration: 20,
    resources: [
      { title: 'MDN DocumentFragment', url: 'https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment', type: 'link' as const },
      { title: 'Web Performance Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance', type: 'link' as const },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// NEW QUIZ — Deep CSS & DOM (to add to respective modules)
// ═══════════════════════════════════════════════════════════════

const DEEP_CSS_QUIZ = {
  title: 'Deep CSS Quiz — Advanced Concepts',
  type: 'quiz' as const,
  content: '<p>Test your deep CSS knowledge.</p>',
  duration: 20,
  quizQuestions: [
    { questionText: 'What is the difference between display: none and visibility: hidden?', type: 'multiple_choice' as const, options: ['No difference', 'none removes from layout, hidden keeps space', 'hidden removes from layout, none keeps space', 'none is faster'], correctOptionIndex: 1, explanation: 'display: none removes the element entirely. visibility: hidden hides it but it still takes up space.' },
    { questionText: 'Which display value allows width/height on an inline element?', type: 'multiple_choice' as const, options: ['display: inline', 'display: block', 'display: inline-block', 'display: flex'], correctOptionIndex: 2, explanation: 'inline-block gives inline flow but respects width/height.' },
    { questionText: 'What does object-fit: cover do to an image?', type: 'multiple_choice' as const, options: ['Stretches to fill', 'Fills container cropping excess', 'Fits inside without cropping', 'Makes it transparent'], correctOptionIndex: 1, explanation: 'cover fills the container completely, cropping any excess — like background-size: cover.' },
    { questionText: 'Which CSS property creates custom variables?', type: 'multiple_choice' as const, options: ['var()', '--name', 'define()', 'let()'], correctOptionIndex: 1, explanation: 'CSS custom properties are defined with -- prefix and used with var().' },
    { questionText: 'What does clamp(1rem, 5vw, 3rem) do?', type: 'multiple_choice' as const, options: ['Always 1rem', 'Always 3rem', 'Fluid between 1rem and 3rem using 5vw', 'Divides 5vw by 3'], correctOptionIndex: 2, explanation: 'clamp(min, preferred, max) keeps the value between min and max, using preferred as the ideal.' },
    { questionText: 'Which clip-path creates a circle?', type: 'multiple_choice' as const, options: ['clip-path: round(50%)', 'clip-path: circle(50%)', 'clip-path: oval(50%)', 'clip-path: shape(circle)'], correctOptionIndex: 1, explanation: 'clip-path: circle(50%) creates a circular clip.' },
    { questionText: 'What does filter: blur(5px) do?', type: 'multiple_choice' as const, options: ['Makes element transparent', 'Applies a 5px blur effect', 'Removes the element', 'Adds a shadow'], correctOptionIndex: 1, explanation: 'blur() applies a Gaussian blur effect with the specified radius.' },
    { questionText: 'What is backdrop-filter used for?', type: 'multiple_choice' as const, options: ['Filtering the element itself', 'Filtering what is behind the element', 'Adding borders', 'Changing font'], correctOptionIndex: 1, explanation: 'backdrop-filter applies effects to what is BEHIND the element (like glassmorphism).' },
    { questionText: 'Which cursor type shows a hand pointer?', type: 'multiple_choice' as const, options: ['cursor: hand', 'cursor: pointer', 'cursor: click', 'cursor: link'], correctOptionIndex: 1, explanation: 'cursor: pointer shows the hand/pointer cursor for clickable elements.' },
    { questionText: 'What does overflow: auto do differently from overflow: scroll?', type: 'multiple_choice' as const, options: ['No difference', 'auto shows scrollbar only when needed, scroll always shows', 'scroll is faster', 'auto hides overflow'], correctOptionIndex: 1, explanation: 'auto shows scrollbar only when content overflows; scroll always shows scrollbars.' },
  ],
  quizConfig: { timeLimit: 15, quizType: 'exercise' as const, questionsPerPage: 10 },
};

const DEEP_DOM_QUIZ = {
  title: 'Deep DOM Manipulation Quiz',
  type: 'quiz' as const,
  content: '<p>Test your deep DOM knowledge.</p>',
  duration: 20,
  quizQuestions: [
    { questionText: 'What does querySelectorAll return?', type: 'multiple_choice' as const, options: ['HTMLCollection', 'NodeList', 'Array', 'Object'], correctOptionIndex: 1, explanation: 'querySelectorAll returns a static NodeList.' },
    { questionText: 'What is the difference between target and currentTarget?', type: 'multiple_choice' as const, options: ['No difference', 'target = clicked element, currentTarget = element with listener', 'target = parent, currentTarget = child', 'target = CSS, currentTarget = HTML'], correctOptionIndex: 1, explanation: 'event.target is the deepest element clicked. event.currentTarget is the element the listener is attached to.' },
    { questionText: 'What does event.stopPropagation() do?', type: 'multiple_choice' as const, options: ['Stops the event', 'Prevents event from bubbling to parent elements', 'Removes the event listener', 'Prevents default behavior'], correctOptionIndex: 1, explanation: 'stopPropagation prevents the event from reaching parent elements (bubbling).' },
    { questionText: 'Why use event delegation?', type: 'multiple_choice' as const, options: ['It\'s faster to write', 'Works on dynamically created elements', 'Prevents errors', 'Uses less memory'], correctOptionIndex: 1, explanation: 'Event delegation works on elements that don\'t exist yet (dynamically added).' },
    { questionText: 'What does createDocumentFragment do?', type: 'multiple_choice' as const, options: ['Creates a new document', 'Creates an in-memory container to batch DOM insertions', 'Deletes DOM elements', 'Clones elements'], correctOptionIndex: 1, explanation: 'DocumentFragment is an in-memory container that allows batch insertion with a single reflow.' },
    { questionText: 'Which method is fastest for selecting by ID?', type: 'multiple_choice' as const, options: ['querySelector("#id")', 'getElementById("id")', 'querySelectorAll("#id")', 'document.id("id")'], correctOptionIndex: 1, explanation: 'getElementById is the fastest — it uses the browser\'s internal ID index.' },
    { questionText: 'What does closest() do?', type: 'multiple_choice' as const, options: ['Finds the nearest child', 'Finds the nearest ancestor matching a selector', 'Finds the closest sibling', 'Finds the parent element'], correctOptionIndex: 1, explanation: 'closest() traverses UP the DOM tree to find the nearest ancestor matching the selector.' },
    { questionText: 'What does subtree: true mean in MutationObserver?', type: 'multiple_choice' as const, options: ['Watch the whole document', 'Watch all descendants, not just direct children', 'Watch attribute changes only', 'Watch text changes only'], correctOptionIndex: 1, explanation: 'subtree: true makes the observer watch all descendants of the target element.' },
    { questionText: 'Why is innerHTML considered unsafe?', type: 'multiple_choice' as const, options: ['It\'s slow', 'It can execute injected scripts (XSS)', 'It doesn\'t work in all browsers', 'It removes existing elements'], correctOptionIndex: 1, explanation: 'innerHTML can execute scripts if malicious HTML is injected (Cross-Site Scripting).' },
    { questionText: 'What does element.remove() do?', type: 'multiple_choice' as const, options: ['Hides the element', 'Removes the element from the DOM tree', 'Clears its content', 'Resets its styles'], correctOptionIndex: 1, explanation: 'remove() deletes the element entirely from the DOM.' },
  ],
  quizConfig: { timeLimit: 15, quizType: 'exercise' as const, questionsPerPage: 10 },
};

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

const seedExpanded = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db!;

    // ─── Update Course 1: Add deep CSS lessons ───
    console.log('═'.repeat(60));
    console.log('📚 Updating Course 1: Adding Deep CSS Lessons');
    console.log('═'.repeat(60));

    const course1 = await db.collection('courses').findOne({
      title: 'Advanced Web Development — HTML, CSS & JavaScript Masterclass'
    }) as any;

    if (!course1) throw new Error('Course 1 not found!');

    // Add lessons to Module 3 (CSS Fundamentals)
    const mod3 = course1.modules.find((m: any) => m.title.includes('Module 3'));
    if (mod3) {
      mod3.lessons.splice(3, 0, DEEP_CSS_LESSONS.displayTypes);      // after Box Model
      mod3.lessons.splice(5, 0, DEEP_CSS_LESSONS.overflow);           // after Typography
      mod3.lessons.splice(6, 0, DEEP_CSS_LESSONS.opacityVisibilityCursors);
      mod3.lessons.splice(7, 0, DEEP_CSS_LESSONS.filtersAndBackdrop);
      mod3.lessons.splice(8, 0, DEEP_CSS_LESSONS.objectFitClipPath);
      mod3.lessons.splice(9, 0, DEEP_CSS_LESSONS.customProperties);
      mod3.lessons.splice(10, 0, DEEP_CSS_LESSONS.containerQueries);
      mod3.lessons.splice(11, 0, DEEP_CSS_LESSONS.scrollDrivenAnimations);
      // Add deep CSS quiz at end
      mod3.lessons.push(DEEP_CSS_QUIZ);
      console.log('   ✅ Added 8 deep CSS lessons + 1 quiz to Module 3');
      console.log('   📖 Module 3 now has', mod3.lessons.length, 'lessons');
    }

    // Update course counts
    let totalLessons = 0;
    for (const mod of course1.modules) {
      totalLessons += mod.lessons.length;
    }
    course1.modulesCount = course1.modules.length;
    course1.totalLessonsCount = totalLessons;

    await db.collection('courses').updateOne(
      { _id: course1._id },
      { $set: { modules: course1.modules, modulesCount: course1.modules.length, totalLessonsCount: totalLessons } }
    );
    console.log('   ✅ Saved Course 1');

    // ─── Update Course 2: Add deep DOM lessons ───
    console.log('\n' + '═'.repeat(60));
    console.log('📚 Updating Course 2: Adding Deep DOM Lessons');
    console.log('═'.repeat(60));

    const course2 = await db.collection('courses').findOne({
      title: 'JavaScript Interactivity Mini-Challenge'
    }) as any;

    if (!course2) throw new Error('Course 2 not found!');

    // Add lessons to Module 8 (Deep DOM)
    const mod8 = course2.modules.find((m: any) => m.title.includes('Module 8'));
    if (mod8) {
      mod8.lessons.splice(1, 0, DEEP_DOM_LESSONS.allSelectors);        // after DOM intro
      mod8.lessons.splice(3, 0, DEEP_DOM_LESSONS.eventDelegation);
      mod8.lessons.splice(4, 0, DEEP_DOM_LESSONS.eventPropagation);
      mod8.lessons.splice(5, 0, DEEP_DOM_LESSONS.mutationObserver);
      mod8.lessons.splice(6, 0, DEEP_DOM_LESSONS.createDocumentFragment);
      // Add deep DOM quiz at end
      mod8.lessons.push(DEEP_DOM_QUIZ);
      console.log('   ✅ Added 5 deep DOM lessons + 1 quiz to Module 8');
      console.log('   📖 Module 8 now has', mod8.lessons.length, 'lessons');
    }

    // Update course counts
    let totalLessons2 = 0;
    for (const mod of course2.modules) {
      totalLessons2 += mod.lessons.length;
    }
    course2.modulesCount = course2.modules.length;
    course2.totalLessonsCount = totalLessons2;

    await db.collection('courses').updateOne(
      { _id: course2._id },
      { $set: { modules: course2.modules, modulesCount: course2.modules.length, totalLessonsCount: totalLessons2 } }
    );
    console.log('   ✅ Saved Course 2');

    // ─── Final Stats ───
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL STATS');
    console.log('═'.repeat(60));

    const finalC1 = await db.collection('courses').findOne({ _id: course1._id }) as any;
    const finalC2 = await db.collection('courses').findOne({ _id: course2._id }) as any;

    for (const c of [finalC1, finalC2]) {
      let lessons = 0, quizzes = 0, exercises = 0, assignments = 0;
      for (const mod of (c.modules || [])) {
        for (const les of (mod.lessons || [])) {
          lessons++;
          if (les.type === 'quiz') quizzes++;
          if (les.isAssignment) assignments++;
          if (les.codeExercises) exercises += les.codeExercises.length;
        }
      }
      console.log(`\n📚 ${c.title}`);
      console.log(`   📦 Modules: ${c.modules?.length || 0}`);
      console.log(`   📖 Lessons: ${lessons}`);
      console.log(`   📝 Quizzes: ${quizzes}`);
      console.log(`   💻 Code Exercises: ${exercises}`);
      console.log(`   📋 Assignments: ${assignments}`);
    }

    console.log('\n🎉 Expanded content seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedExpanded();
