/**
 * 🌱 SEED: Advanced Web Development — Two Free Courses
 * 
 * Course 1: "Advanced Web Development — HTML, CSS & JavaScript Masterclass" (8 modules)
 * Course 2: "JavaScript Interactivity Mini-Challenge" (4 modules, GitHub Classroom)
 * 
 * Both FREE, assigned to admin@bootskills.com
 * 
 * Usage: npx ts-node src/seedAdvancedWebCourse.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true';

const connectDB = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// ─── Resource URLs (verified working) ─────────────────────────
const RESOURCES = {
  // YouTube videos
  htmlCrashCourse: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
  cssCrashCourse: 'https://www.youtube.com/watch?v=yfoY53QXEnI',
  jsCrashCourse: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
  domManipulation: 'https://www.youtube.com/watch?v=5fb2aPlgoys',
  flexboxTutorial: 'https://www.youtube.com/watch?v=nbsz6muQRT4',
  fetchApiTutorial: 'https://www.youtube.com/watch?v=Oive66jrwBs',
  cssGridTutorial: 'https://www.youtube.com/watch?v=uSRsu19J_Fo',
  responsiveDesign: 'https://www.youtube.com/watch?v=geRlpbhSwqM',
  jsEventsTutorial: 'https://www.youtube.com/watch?v=RqQ1Kqu9iXw',
  asyncAwaitTutorial: 'https://www.youtube.com/watch?v=vn3tmFrquo0',
  
  // Docs & platforms
  mdnHTML: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
  mdnCSS: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  mdnJS: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  mdnDOM: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model',
  freecodecampRWD: 'https://www.freecodecamp.org/learn/responsive-web-design-v9',
  freecodecampJS: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/',
  frontendMentor: 'https://www.frontendmentor.io/challenges',
  githubClassroom: 'https://classroom.github.com/',
  w3schoolsHTML: 'https://www.w3schools.com/html/',
  w3schoolsCSS: 'https://www.w3schools.com/css/',
  w3schoolsJS: 'https://www.w3schools.com/js/',
  flexboxfroggy: 'https://flexboxfroggy.com/',
  cssgridgarden: 'https://cssgridgarden.com/',
  codepen: 'https://codepen.io/',
  
  // Project references
  netflixClone: 'https://github.com/topics/netflix-clone?l=html',
  restaurantWebsite: 'https://github.com/topics/restaurant-website?l=html',
  
  // Images (Unsplash)
  heroWebDev: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=800',
  htmlImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800',
  cssImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
  jsImage: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=800',
  domImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800',
  apiImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
  responsiveImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
  githubImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=800',
  projectImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
  examImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
};

// ═══════════════════════════════════════════════════════════════
// COURSE 1: Advanced Web Development — HTML, CSS & JS Masterclass
// 8 Modules — Complete Beginner to Intermediate
// ═══════════════════════════════════════════════════════════════

const COURSE_1_MODULES = [
  // ═══════════════════════════════════════════════════════════
  // MODULE 1: Welcome, Setup & How the Web Works
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 1: Welcome, Setup & How the Web Works',
    description: 'Set up your development environment, understand how the web works, and learn your first HTML page.',
    learningOutcome: 'Understand the web ecosystem, install VS Code, create your first HTML file, and push code to GitHub.',
    hoursAllocated: 8,
    order: 1,
    lessons: [
      {
        title: 'Welcome to the Course — What You Will Learn',
        type: 'article',
        content: `<h2>🎓 Welcome to Advanced Web Development!</h2>
<p>This course will take you from <strong>zero to building real websites</strong>. By the end, you will be able to:</p>
<ul>
  <li>✅ Build any website using HTML, CSS, and JavaScript</li>
  <li>✅ Make websites look amazing on phones, tablets, and desktops</li>
  <li>✅ Add interactivity — buttons, forms, animations, data fetching</li>
  <li>✅ Use GitHub to manage your code like a professional</li>
  <li>✅ Build real projects: Netflix clone, restaurant site, portfolio</li>
</ul>

<h3>📽️ Watch These First</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/UB1O30fR-EE" title="HTML Crash Course" frameborder="0" allowfullscreen></iframe>
<p><em>Traversy Media — HTML Crash Course For Absolute Beginners (1h 24m)</em></p>

<h3>📸 What is Web Development?</h3>
<img src="${RESOURCES.heroWebDev}" alt="Web Development" style="width:100%;max-width:800px;border-radius:12px;margin:16px 0;">
<p>Web development has <strong>3 core technologies</strong>:</p>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;">
    <th>Technology</th><th>What It Does</th><th>Analogy</th>
  </tr>
  <tr><td><strong>HTML</strong></td><td>Structure & content</td><td>🦴 Skeleton of a body</td></tr>
  <tr><td><strong>CSS</strong></td><td>Style & layout</td><td>👕 Clothes & appearance</td></tr>
  <tr><td><strong>JavaScript</strong></td><td>Behavior & interactivity</td><td>🧠 Brain & movement</td></tr>
</table>

<h3>🔗 Resources</h3>
<ul>
  <li><a href="${RESOURCES.mdnHTML}" target="_blank">MDN HTML Documentation</a></li>
  <li><a href="${RESOURCES.freecodecampRWD}" target="_blank">freeCodeCamp Responsive Web Design (Free Certificate)</a></li>
  <li><a href="${RESOURCES.frontendMentor}" target="_blank">Frontend Mentor — Practice Challenges</a></li>
</ul>`,
        videoUrl: RESOURCES.htmlCrashCourse,
        videoTitle: 'HTML Crash Course For Absolute Beginners',
        duration: 15,
        resources: [
          { title: 'MDN HTML Docs', url: RESOURCES.mdnHTML, type: 'link' },
          { title: 'freeCodeCamp RWD', url: RESOURCES.freecodecampRWD, type: 'link' },
          { title: 'Frontend Mentor Challenges', url: RESOURCES.frontendMentor, type: 'link' },
        ],
      },
      {
        title: 'Installing VS Code & Your First HTML File',
        type: 'article',
        content: `<h2>🛠️ Setting Up Your Tools</h2>

<h3>Step 1: Install Visual Studio Code</h3>
<p>Download VS Code from <a href="https://code.visualstudio.com/" target="_blank">code.visualstudio.com</a>. It's free and the most popular code editor.</p>
<p><strong>Recommended Extensions:</strong></p>
<ul>
  <li><code>Live Server</code> — launches a local server with hot reload</li>
  <li><code>Prettier</code> — auto-formats your code</li>
  <li><code>Emmet</code> — write HTML faster (built into VS Code)</li>
</ul>

<h3>Step 2: Create Your First HTML File</h3>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
  &lt;title&gt;My First Website&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;Hello, World! 🌍&lt;/h1&gt;
  &lt;p&gt;This is my first website.&lt;/p&gt;
  &lt;img src="https://via.placeholder.com/300" alt="My image"&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

<h3>🖥️ How It Looks</h3>
<div style="background:#f4f4f4;padding:20px;border-radius:8px;border:2px solid #ddd;margin:16px 0;">
  <h1 style="margin:0;">Hello, World! 🌍</h1>
  <p>This is my first website.</p>
  <div style="width:300px;height:200px;background:#ddd;display:flex;align-items:center;justify-content:center;border-radius:8px;">Image placeholder</div>
</div>

<h3>Step 3: Open with Live Server</h3>
<p>Right-click your HTML file → "Open with Live Server". Your browser opens at <code>http://127.0.0.1:5500</code></p>

<h3>📁 Project Structure</h3>
<pre><code>my-website/
├── index.html      ← main page
├── css/
│   └── style.css   ← styles
├── js/
│   └── script.js   ← JavaScript
└── images/         ← pictures</code></pre>`,
        duration: 20,
        resources: [
          { title: 'VS Code Download', url: 'https://code.visualstudio.com/', type: 'link' },
        ],
      },
      {
        title: 'How Git & GitHub Work — Version Control Basics',
        type: 'article',
        content: `<h2>🐙 Git & GitHub</h2>
<p><strong>Git</strong> tracks changes to your code. <strong>GitHub</strong> stores your code online.</p>

<h3>Why Git Matters</h3>
<ul>
  <li>🔒 Save snapshots of your code ("commits")</li>
  <li>⏪ Undo mistakes — go back to any version</li>
  <li>🤝 Work with others — merge changes</li>
  <li>💼 Every tech job requires Git knowledge</li>
</ul>

<h3>Essential Git Commands</h3>
<pre><code># Initialize a new repository
git init

# Stage changes
git add .

# Commit (save a snapshot)
git commit -m "Add my first page"

# Connect to GitHub
git remote add origin https://github.com/yourname/repo.git

# Push to GitHub
git push -u origin main

# Clone an existing repo
git clone https://github.com/yourname/repo.git</code></pre>

<h3>Assignment: Push Your First HTML File</h3>
<div style="background:#e8f5e9;padding:16px;border-radius:8px;border-left:4px solid #4caf50;margin:16px 0;">
  <strong>📝 Task:</strong>
  <ol>
    <li>Create a GitHub account at <a href="https://github.com" target="_blank">github.com</a></li>
    <li>Create a new repository called <code>my-first-website</code></li>
    <li>Push your <code>index.html</code> file</li>
    <li>Submit the repo link on Google Classroom</li>
  </ol>
</div>

<h3>🔗 Resources</h3>
<ul>
  <li><a href="https://docs.github.com/en/get-started" target="_blank">GitHub Getting Started Guide</a></li>
  <li><a href="https://github.com/classroom" target="_blank">GitHub Classroom</a> — for submitting assignments</li>
  <li><a href="https://learngitbranching.js.org/" target="_blank">Learn Git Branching (Interactive Game)</a></li>
</ul>

<img src="${RESOURCES.githubImage}" alt="GitHub" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;">`,
        duration: 20,
        resources: [
          { title: 'GitHub Getting Started', url: 'https://docs.github.com/en/get-started', type: 'link' },
          { title: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', type: 'link' },
        ],
      },
      {
        title: 'Module 1 Quiz — Web Basics & Setup',
        type: 'quiz',
        content: '<p>Test your understanding of web basics and setup tools.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'Which technology provides the structure of a webpage?', type: 'multiple_choice', options: ['CSS', 'HTML', 'JavaScript', 'Python'], correctOptionIndex: 1, explanation: 'HTML provides structure and content.' },
          { questionText: 'What does CSS stand for?', type: 'multiple_choice', options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correctOptionIndex: 1, explanation: 'CSS = Cascading Style Sheets.' },
          { questionText: 'What is the purpose of Git?', type: 'multiple_choice', options: ['Design websites', 'Track code changes', 'Run JavaScript', 'Style web pages'], correctOptionIndex: 1, explanation: 'Git is a version control system that tracks changes.' },
          { questionText: 'Which tag creates the largest heading in HTML?', type: 'multiple_choice', options: ['&lt;heading&gt;', '&lt;h6&gt;', '&lt;h1&gt;', '&lt;head&gt;'], correctOptionIndex: 2, explanation: '&lt;h1&gt; is the largest heading tag.' },
          { questionText: 'What extension lets you see live changes in VS Code?', type: 'multiple_choice', options: ['Prettier', 'Live Server', 'Emmet', 'ESLint'], correctOptionIndex: 1, explanation: 'Live Server launches a local server with hot reload.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
      {
        title: 'Assignment 1 — Your First Web Page',
        type: 'challenge',
        isAssignment: true,
        requiredAssignment: true,
        assignmentDescription: `Create a personal "About Me" page using only HTML. Include:\n1. A heading with your name\n2. A paragraph about yourself\n3. An unordered list of your hobbies\n4. A link to your favorite website\n5. An image (use any placeholder)\n\nPush to GitHub and submit the repo link on Google Classroom.`,
        assignmentDeliverables: [
          'GitHub repository with index.html',
          'Valid HTML5 structure (DOCTYPE, head, body)',
          'At least 3 different HTML elements used',
          'Live preview link (GitHub Pages or local)',
        ],
        assignmentConfig: { timeLimit: 120, allowRetakes: false, mode: 'exercise', disableRightClick: false },
        duration: 60,
        resources: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 2: HTML Fundamentals — Deep Dive
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 2: HTML Fundamentals — Deep Dive',
    description: 'Master HTML elements, attributes, semantic tags, forms, tables, and accessibility.',
    learningOutcome: 'Build any HTML structure, create forms, use semantic elements, and understand accessibility.',
    hoursAllocated: 10,
    order: 2,
    lessons: [
      {
        title: 'HTML Elements & Tags — The Building Blocks',
        type: 'article',
        content: `<h2>🧱 HTML Elements</h2>
<p>Every HTML element has an <strong>opening tag</strong>, <strong>content</strong>, and <strong>closing tag</strong>:</p>

<h3>Block vs Inline Elements</h3>
<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;">
  <div style="flex:1;min-width:300px;background:#e3f2fd;padding:16px;border-radius:8px;">
    <h4>📦 Block Elements</h4>
    <p>Take full width, start new line:</p>
    <pre><code>&lt;div&gt;I'm a block&lt;/div&gt;
&lt;p&gt;I'm also a block&lt;/p&gt;
&lt;h1&gt;Me too!&lt;/h1&gt;
&lt;section&gt;And me!&lt;/section&gt;</code></pre>
    <div style="background:#bbdefb;padding:8px;margin:4px 0;border-radius:4px;">div — full width</div>
    <div style="background:#bbdefb;padding:8px;margin:4px 0;border-radius:4px;">p — full width</div>
    <div style="background:#bbdefb;padding:8px;margin:4px 0;border-radius:4px;">h1 — full width</div>
  </div>
  <div style="flex:1;min-width:300px;background:#fce4ec;padding:16px;border-radius:8px;">
    <h4>🏷️ Inline Elements</h4>
    <p>Only take needed width, stay on same line:</p>
    <pre><code>&lt;span&gt;Hello&lt;/span&gt;
&lt;span&gt;World&lt;/span&gt;
&lt;a href="#"&gt;Link&lt;/a&gt;
&lt;strong&gt;Bold&lt;/strong&gt;</code></pre>
    <div style="margin:8px 0;"><span style="background:#f8bbd0;padding:4px 8px;border-radius:4px;">Hello</span> <span style="background:#f8bbd0;padding:4px 8px;border-radius:4px;">World</span> <span style="background:#f8bbd0;padding:4px 8px;border-radius:4px;">Link</span> <span style="background:#f8bbd0;padding:4px 8px;border-radius:4px;">Bold</span></div>
  </div>
</div>

<h3>Essential HTML Tags Cheat Sheet</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Tag</th><th>Purpose</th><th>Example</th></tr>
  <tr><td><code>&lt;h1&gt; to &lt;h6&gt;</code></td><td>Headings</td><td><code>&lt;h1&gt;Main Title&lt;/h1&gt;</code></td></tr>
  <tr><td><code>&lt;p&gt;</code></td><td>Paragraph</td><td><code>&lt;p&gt;Some text&lt;/p&gt;</code></td></tr>
  <tr><td><code>&lt;a&gt;</code></td><td>Link</td><td><code>&lt;a href="url"&gt;Click&lt;/a&gt;</code></td></tr>
  <tr><td><code>&lt;img&gt;</code></td><td>Image</td><td><code>&lt;img src="url" alt="desc"&gt;</code></td></tr>
  <tr><td><code>&lt;ul&gt; &lt;ol&gt;</code></td><td>Lists</td><td><code>&lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</code></td></tr>
  <tr><td><code>&lt;div&gt;</code></td><td>Generic container</td><td><code>&lt;div class="box"&gt;...&lt;/div&gt;</code></td></tr>
  <tr><td><code>&lt;span&gt;</code></td><td>Inline wrapper</td><td><code>&lt;span style="color:red"&gt;Hi&lt;/span&gt;</code></td></tr>
  <tr><td><code>&lt;table&gt;</code></td><td>Table</td><td><code>&lt;table&gt;&lt;tr&gt;&lt;td&gt;Cell&lt;/td&gt;&lt;/tr&gt;&lt;/table&gt;</code></td></tr>
</table>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/UB1O30fR-EE" title="HTML Crash Course" frameborder="0" allowfullscreen></iframe>`,
        videoUrl: RESOURCES.htmlCrashCourse,
        videoTitle: 'HTML Crash Course — Full Tutorial',
        duration: 25,
        resources: [
          { title: 'MDN HTML Elements Reference', url: RESOURCES.mdnHTML, type: 'link' },
          { title: 'W3Schools HTML Tutorial', url: RESOURCES.w3schoolsHTML, type: 'link' },
        ],
      },
      {
        title: 'HTML Forms — Collecting User Data',
        type: 'article',
        content: `<h2>📋 HTML Forms</h2>
<p>Forms let users send data to a server. They're used for login, search, checkout, etc.</p>

<pre><code>&lt;form action="/submit" method="POST"&gt;
  &lt;label for="name"&gt;Your Name:&lt;/label&gt;
  &lt;input type="text" id="name" name="name" placeholder="John" required&gt;

  &lt;label for="email"&gt;Email:&lt;/label&gt;
  &lt;input type="email" id="email" name="email" required&gt;

  &lt;label for="password"&gt;Password:&lt;/label&gt;
  &lt;input type="password" id="password" name="password" minlength="8" required&gt;

  &lt;label for="color"&gt;Favorite Color:&lt;/label&gt;
  &lt;input type="color" id="color" name="color"&gt;

  &lt;label for="date"&gt;Birthday:&lt;/label&gt;
  &lt;input type="date" id="date" name="birthday"&gt;

  &lt;label for="bio"&gt;About You:&lt;/label&gt;
  &lt;textarea id="bio" name="bio" rows="4"&gt;&lt;/textarea&gt;

  &lt;label for="country"&gt;Country:&lt;/label&gt;
  &lt;select id="country" name="country"&gt;
    &lt;option value=""&gt;Select one...&lt;/option&gt;
    &lt;option value="RW"&gt;Rwanda&lt;/option&gt;
    &lt;option value="KE"&gt;Kenya&lt;/option&gt;
    &lt;option value="UG"&gt;Uganda&lt;/option&gt;
  &lt;/select&gt;

  &lt;fieldset&gt;
    &lt;legend&gt;Gender:&lt;/legend&gt;
    &lt;input type="radio" id="male" name="gender" value="male"&gt;
    &lt;label for="male"&gt;Male&lt;/label&gt;
    &lt;input type="radio" id="female" name="gender" value="female"&gt;
    &lt;label for="female"&gt;Female&lt;/label&gt;
  &lt;/fieldset&gt;

  &lt;label&gt;
    &lt;input type="checkbox" name="terms" required&gt; I agree to terms
  &lt;/label&gt;

  &lt;button type="submit"&gt;Submit&lt;/button&gt;
&lt;/form&gt;</code></pre>

<h3>🎨 How It Looks</h3>
<div style="background:#f9f9f9;padding:20px;border-radius:8px;border:1px solid #ddd;margin:16px 0;">
  <form style="display:flex;flex-direction:column;gap:12px;max-width:400px;">
    <label><strong>Your Name:</strong></label>
    <input type="text" placeholder="John" style="padding:8px;border:1px solid #ccc;border-radius:4px;">
    <label><strong>Email:</strong></label>
    <input type="email" placeholder="john@email.com" style="padding:8px;border:1px solid #ccc;border-radius:4px;">
    <label><strong>Country:</strong></label>
    <select style="padding:8px;border:1px solid #ccc;border-radius:4px;"><option>Select one...</option><option>Rwanda</option><option>Kenya</option><option>Uganda</option></select>
    <button style="padding:10px;background:#1a1a2e;color:white;border:none;border-radius:4px;cursor:pointer;">Submit</button>
  </form>
</div>

<h3>Input Types Reference</h3>
<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Type</th><th>What It Shows</th><th>Use Case</th></tr>
  <tr><td>text</td><td>Plain text box</td><td>Names, search</td></tr>
  <tr><td>email</td><td>Email with validation</td><td>Registration</td></tr>
  <tr><td>password</td><td>Hidden characters</td><td>Passwords</td></tr>
  <tr><td>number</td><td>Number spinner</td><td>Age, quantity</td></tr>
  <tr><td>tel</td><td>Phone keypad on mobile</td><td>Phone numbers</td></tr>
  <tr><td>url</td><td>URL validation</td><td>Website links</td></tr>
  <tr><td>date</td><td>Date picker</td><td>Birthday, booking</td></tr>
  <tr><td>time</td><td>Time picker</td><td>Appointment time</td></tr>
  <tr><td>color</td><td>Color picker</td><td>Design tools</td></tr>
  <tr><td>range</td><td>Slider</td><td>Volume, rating</td></tr>
  <tr><td>file</td><td>File upload</td><td>Profile photo</td></tr>
  <tr><td>checkbox</td><td>Toggle on/off</td><td>Preferences</td></tr>
  <tr><td>radio</td><td>Choose one</td><td>Gender, plan</td></tr>
</table>`,
        duration: 25,
        resources: [],
        codeExercises: [
          {
            id: 'web-m2-ex1',
            title: 'Build a Registration Form',
            description: 'Create a registration form with name, email, password, country dropdown, and a submit button.',
            language: 'html',
            type: 'write',
            initialCode: `<!DOCTYPE html>
<html>
<head><title>Registration</title></head>
<body>
  <h1>Register</h1>
  <!-- Create a form with:
    1. Name input (text, required)
    2. Email input (email, required)
    3. Password input (password, minlength=8)
    4. Country select (Rwanda, Kenya, Uganda)
    5. Submit button
  -->
  
</body>
</html>`,
            solutionCode: `<!DOCTYPE html>
<html>
<head><title>Registration</title></head>
<body>
  <h1>Register</h1>
  <form action="/register" method="POST">
    <label for="name">Name:</label><br>
    <input type="text" id="name" name="name" required><br><br>
    <label for="email">Email:</label><br>
    <input type="email" id="email" name="email" required><br><br>
    <label for="password">Password:</label><br>
    <input type="password" id="password" name="password" minlength="8" required><br><br>
    <label for="country">Country:</label><br>
    <select id="country" name="country">
      <option value="RW">Rwanda</option>
      <option value="KE">Kenya</option>
      <option value="UG">Uganda</option>
    </select><br><br>
    <button type="submit">Register</button>
  </form>
</body>
</html>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'Semantic HTML — Writing Meaningful Code',
        type: 'article',
        content: `<h2>🏷️ Semantic HTML</h2>
<p>Semantic elements describe their <strong>meaning</strong>, not just appearance. They help screen readers, SEO, and other developers.</p>

<h3>Bad vs Good HTML</h3>
<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;">
  <div style="flex:1;min-width:300px;background:#ffebee;padding:16px;border-radius:8px;">
    <h4>❌ Bad (Non-semantic)</h4>
    <pre><code>&lt;div class="header"&gt;
  &lt;div class="nav"&gt;
    &lt;div class="logo"&gt;My Site&lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;
&lt;div class="main"&gt;
  &lt;div class="article"&gt;
    &lt;div class="title"&gt;...&lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;
&lt;div class="footer"&gt;...&lt;/div&gt;</code></pre>
  </div>
  <div style="flex:1;min-width:300px;background:#e8f5e9;padding:16px;border-radius:8px;">
    <h4>✅ Good (Semantic)</h4>
    <pre><code>&lt;header&gt;
  &lt;nav&gt;
    &lt;div class="logo"&gt;My Site&lt;/div&gt;
  &lt;/nav&gt;
&lt;/header&gt;
&lt;main&gt;
  &lt;article&gt;
    &lt;h2&gt;Title&lt;/h2&gt;
  &lt;/article&gt;
&lt;/main&gt;
&lt;footer&gt;...&lt;/footer&gt;</code></pre>
  </div>
</div>

<h3>Semantic Elements Cheat Sheet</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Element</th><th>Purpose</th><th>When to Use</th></tr>
  <tr><td><code>&lt;header&gt;</code></td><td>Intro section</td><td>Top of page or section</td></tr>
  <tr><td><code>&lt;nav&gt;</code></td><td>Navigation links</td><td>Main menu, sidebar</td></tr>
  <tr><td><code>&lt;main&gt;</code></td><td>Main content</td><td>One per page</td></tr>
  <tr><td><code>&lt;article&gt;</code></td><td>Independent content</td><td>Blog post, news item</td></tr>
  <tr><td><code>&lt;section&gt;</code></td><td>Thematic grouping</td><td>Chapter, tab content</td></tr>
  <tr><td><code>&lt;aside&gt;</code></td><td>Side content</td><td>Related links, ads</td></tr>
  <tr><td><code>&lt;footer&gt;</code></td><td>Bottom section</td><td>Copyright, links</td></tr>
  <tr><td><code>&lt;figure&gt;</code></td><td>Media wrapper</td><td>Image with caption</td></tr>
  <tr><td><code>&lt;figcaption&gt;</code></td><td>Figure caption</td><td>Image description</td></tr>
  <tr><td><code>&lt;time&gt;</code></td><td>Date/time</td><td>Published date</td></tr>
</table>

<h3>Complete Semantic Page Example</h3>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
  &lt;title&gt;My Blog&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;header&gt;
    &lt;nav&gt;
      &lt;a href="/"&gt;Home&lt;/a&gt;
      &lt;a href="/about"&gt;About&lt;/a&gt;
      &lt;a href="/blog"&gt;Blog&lt;/a&gt;
    &lt;/nav&gt;
  &lt;/header&gt;

  &lt;main&gt;
    &lt;article&gt;
      &lt;h1&gt;My First Blog Post&lt;/h1&gt;
      &lt;time datetime="2026-08-25"&gt;August 25, 2026&lt;/time&gt;
      &lt;p&gt;Today I learned HTML...&lt;/p&gt;
      
      &lt;figure&gt;
        &lt;img src="photo.jpg" alt="Coding"&gt;
        &lt;figcaption&gt;Me coding my first website&lt;/figcaption&gt;
      &lt;/figure&gt;
    &lt;/article&gt;

    &lt;aside&gt;
      &lt;h3&gt;Related Posts&lt;/h3&gt;
      &lt;ul&gt;
        &lt;li&gt;&lt;a href="#"&gt;Learn CSS&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#"&gt;Learn JavaScript&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/aside&gt;
  &lt;/main&gt;

  &lt;footer&gt;
    &lt;p&gt;&amp;copy; 2026 My Blog&lt;/p&gt;
  &lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>`,
        duration: 20,
        resources: [
          { title: 'MDN Semantic HTML Guide', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html', type: 'link' },
        ],
      },
      {
        title: 'Module 2 Quiz — HTML Deep Dive',
        type: 'quiz',
        content: '<p>Test your HTML knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'Which input type is best for an email field?', type: 'multiple_choice', options: ['text', 'email', 'url', 'mail'], correctOptionIndex: 1, explanation: 'type="email" provides built-in validation for email format.' },
          { questionText: 'What does the &lt;label&gt; element do?', type: 'multiple_choice', options: ['Styles text', 'Creates a clickable label linked to an input', 'Hides content', 'Makes text bold'], correctOptionIndex: 1, explanation: '&lt;label&gt; provides accessibility and clicking the label focuses the input.' },
          { questionText: 'Which is a semantic HTML element?', type: 'multiple_choice', options: ['&lt;div&gt;', '&lt;span&gt;', '&lt;article&gt;', '&lt;b&gt;'], correctOptionIndex: 2, explanation: '&lt;article&gt; is semantic — it describes independent content.' },
          { questionText: 'What attribute makes a form field required?', type: 'multiple_choice', options: ['mandatory', 'required', 'validate', 'check'], correctOptionIndex: 1, explanation: 'The required attribute forces the user to fill in the field.' },
          { questionText: 'Which tag creates a numbered list?', type: 'multiple_choice', options: ['&lt;ul&gt;', '&lt;ol&gt;', '&lt;li&gt;', '&lt;list&gt;'], correctOptionIndex: 1, explanation: '&lt;ol&gt; creates an ordered (numbered) list.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 3: CSS Fundamentals — Selectors, Box Model, Colors, Typography
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 3: CSS Fundamentals — Selectors, Box Model, Colors & Typography',
    description: 'Learn CSS from scratch: selectors, the box model, colors, backgrounds, fonts, and text styling.',
    learningOutcome: 'Style any HTML element, understand specificity, and create beautiful typography.',
    hoursAllocated: 12,
    order: 3,
    lessons: [
      {
        title: 'How CSS Works — Selectors & Specificity',
        type: 'article',
        content: `<h2>🎨 CSS — The Style Language</h2>
<p>CSS tells the browser <strong>how to display</strong> HTML elements.</p>

<h3>Three Ways to Add CSS</h3>
<pre><code>/* 1. External (best practice) */
&lt;link rel="stylesheet" href="css/style.css"&gt;

/* 2. Internal (in &lt;head&gt;) */
&lt;style&gt;
  body { background: #f0f0f0; }
&lt;/style&gt;

/* 3. Inline (avoid) */
&lt;p style="color: red;"&gt;Red text&lt;/p&gt;</code></pre>

<h3>CSS Selectors</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Selector</th><th>Example</th><th>Selects</th></tr>
  <tr><td>Element</td><td><code>p { }</code></td><td>All &lt;p&gt; elements</td></tr>
  <tr><td>Class</td><td><code>.highlight { }</code></td><td>All with class="highlight"</td></tr>
  <tr><td>ID</td><td><code>#header { }</code></td><td>Element with id="header"</td></tr>
  <tr><td>Attribute</td><td><code>input[required] { }</code></td><td>Inputs with required attr</td></tr>
  <tr><td>Child</td><td><code>.parent > .child { }</code></td><td>Direct children only</td></tr>
  <tr><td>Descendant</td><td><code>.parent .child { }</code></td><td>All nested children</td></tr>
  <tr><td>Pseudo-class</td><td><code>a:hover { }</code></td><td>When hovering a link</td></tr>
  <tr><td>Pseudo-element</td><td><code>p::first-line { }</code></td><td>First line of paragraph</td></tr>
  <tr><td>Universal</td><td><code>* { }</code></td><td>Every element</td></tr>
  <tr><td>Grouping</td><td><code>h1, h2, h3 { }</code></td><td>Multiple selectors</td></tr>
</table>

<h3>Specificity (Which rule wins?)</h3>
<div style="background:#fff3e0;padding:16px;border-radius:8px;margin:16px 0;">
  <p><strong>Specificity hierarchy (highest wins):</strong></p>
  <ol>
    <li>🔴 <code>!important</code> — avoid using</li>
    <li>🟠 <code>style=""</code> — inline styles</li>
    <li>🟡 <code>#id</code> — ID selectors (1,0,0)</li>
    <li>🟢 <code>.class</code> — class selectors (0,1,0)</li>
    <li>🔵 <code>element</code> — tag selectors (0,0,1)</li>
  </ol>
  <pre><code>/* Specificity: (0,1,0) */
.highlight { color: blue; }

/* Specificity: (0,0,2) — two elements = (0,0,2) */
p span { color: green; }

/* Specificity: (0,1,0) vs (0,1,0) — LAST ONE WINS */
p.intro { color: blue; }
p.intro { color: red; }  /* This wins! */</code></pre>
</div>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/yfoY53QXEnI" title="CSS Crash Course" frameborder="0" allowfullscreen></iframe>
<p><em>Traversy Media — CSS Crash Course For Absolute Beginners (1h)</em></p>`,
        videoUrl: RESOURCES.cssCrashCourse,
        videoTitle: 'CSS Crash Course For Absolute Beginners',
        duration: 25,
        resources: [
          { title: 'MDN CSS Reference', url: RESOURCES.mdnCSS, type: 'link' },
          { title: 'W3Schools CSS Tutorial', url: RESOURCES.w3schoolsCSS, type: 'link' },
        ],
      },
      {
        title: 'The CSS Box Model — Margins, Borders, Padding, Content',
        type: 'article',
        content: `<h2>📦 The Box Model</h2>
<p><strong>Every HTML element is a box.</strong> Understanding the box model is the #1 CSS concept.</p>

<h3>Visual Diagram</h3>
<div style="display:flex;justify-content:center;margin:20px 0;">
  <div style="width:400px;">
    <div style="background:#fff9c4;border:2px dashed #fbc02d;padding:20px;text-align:center;border-radius:8px;">
      <strong>Margin (yellow)</strong> — space outside the border
      <div style="background:#c8e6c9;border:2px solid #43a047;padding:20px;text-align:center;border-radius:4px;">
        <strong>Border (green)</strong> — visible edge
        <div style="background:#bbdefb;border:2px solid #1976d2;padding:20px;text-align:center;border-radius:4px;">
          <strong>Padding (blue)</strong> — space inside the border
          <div style="background:#ffcdd2;border:1px solid #e53935;padding:15px;text-align:center;border-radius:4px;">
            <strong>Content (red)</strong> — text & images
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<h3>CSS Code for Box Model</h3>
<pre><code>.card {
  /* Content */
  width: 300px;
  height: 200px;

  /* Padding — space INSIDE the border */
  padding: 20px;
  /* Or: padding: 10px 20px; (top/bottom 10, left/right 20) */
  /* Or: padding: 10px 20px 30px 40px; (top right bottom left) */

  /* Border */
  border: 2px solid #333;
  border-radius: 12px;    /* rounded corners */

  /* Margin — space OUTSIDE the border */
  margin: 16px auto;      /* auto = centered horizontally */
  /* Or: margin: 10px 20px; */
}</code></pre>

<h3>⚠️ box-sizing: border-box</h3>
<div style="background:#ffebee;padding:16px;border-radius:8px;margin:16px 0;">
  <p><strong>⚠️ Without border-box:</strong> width + padding + border = total width (confusing!)</p>
  <p><strong>✅ With border-box:</strong> width = total width (easy!)</p>
  <pre><code>/* Use this on every project! */
* {
  box-sizing: border-box;
}</code></pre>
</div>

<h3>Margin Collapse</h3>
<p>When two vertical margins touch, they <strong>merge</strong> into the larger one:</p>
<pre><code>.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }
/* Gap between boxes: 30px (not 50px!) — margins collapsed */</code></pre>

<h3>🔍 Inspect Any Website</h3>
<p>Right-click any element → <strong>Inspect</strong> in your browser. The blue/green/orange overlay shows the box model!</p>
<img src="${RESOURCES.cssImage}" alt="CSS Box Model" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;">`,
        duration: 25,
        resources: [],
        codeExercises: [
          {
            id: 'web-m3-ex1',
            title: 'Style a Card with Box Model',
            description: 'Create a card with padding, border, border-radius, and margin. The card should be centered and have a shadow.',
            language: 'css',
            type: 'write',
            initialCode: `<style>
/* Style this card:
   - Width: 300px
   - Padding: 20px
   - Border: 2px solid #333
   - Border-radius: 12px
   - Margin: 20px auto
   - Add a box-shadow
*/
.card {
  
}
</style>
<div class="card">
  <h3>My Card</h3>
  <p>This is a styled card component.</p>
</div>`,
            solutionCode: `<style>
* { box-sizing: border-box; }
.card {
  width: 300px;
  padding: 20px;
  border: 2px solid #333;
  border-radius: 12px;
  margin: 20px auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-family: Arial, sans-serif;
}
</style>
<div class="card">
  <h3>My Card</h3>
  <p>This is a styled card component.</p>
</div>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'Colors, Backgrounds & Typography in CSS',
        type: 'article',
        content: `<h2>🎨 Colors & Typography</h2>

<h3>Color Formats</h3>
<pre><code>/* Named colors */
color: red;
color: tomato;

/* Hex (most common) */
color: #ff6347;       /* full hex */
color: #f64;          /* shorthand */

/* RGB */
color: rgb(255, 99, 71);

/* RGBA (with transparency) */
color: rgba(255, 99, 71, 0.5);  /* 50% transparent */

/* HSL (Hue, Saturation, Lightness) */
color: hsl(9, 100%, 64%);</code></pre>

<h3>Backgrounds</h3>
<pre><code>body {
  background-color: #f0f0f0;
  background-image: url('image.jpg');
  background-size: cover;           /* fill entire area */
  background-position: center;      /* centered */
  background-repeat: no-repeat;     /* don't tile */
  background: linear-gradient(135deg, #667eea, #764ba2);
  background: linear-gradient(to right, #ff6b6b, #feca57);
}

/* Gradient examples */
.gradient-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.gradient-2 {
  background: radial-gradient(circle, #ff6b6b, #feca57);
}</code></pre>

<h3>Typography</h3>
<pre><code>body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 16px;           /* base size */
  line-height: 1.6;          /* spacing between lines */
  color: #333;
}

h1 {
  font-size: 2.5rem;         /* relative to parent */
  font-weight: 700;          /* bold */
  letter-spacing: -1px;      /* tighter */
  text-transform: uppercase; /* ALL CAPS */
}

p {
  font-size: 1rem;
  font-weight: 400;          /* normal */
  line-height: 1.8;          /* easy to read */
  color: #555;
}

a {
  text-decoration: none;     /* remove underline */
  color: #667eea;
  transition: color 0.3s ease;
}
a:hover {
  color: #764ba2;
}

.text-shadow-demo {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

/* Google Fonts */
/* Add to &lt;head&gt;: */
/* &lt;link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"&gt; */</code></pre>

<h3>Complete Styled Example</h3>
<div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:40px;border-radius:12px;color:white;text-align:center;margin:16px 0;">
  <h2 style="font-family:Arial;margin:0 0 8px;font-size:2rem;text-shadow:2px 2px 4px rgba(0,0,0,0.3);">Beautiful Typography</h2>
  <p style="font-family:Arial;margin:0;font-size:1.1rem;opacity:0.9;">Gradient background with text shadow</p>
</div>`,
        duration: 25,
        resources: [
          { title: 'MDN CSS Colors', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value', type: 'link' },
          { title: 'Google Fonts', url: 'https://fonts.google.com/', type: 'link' },
          { title: 'Coolors Color Palette Generator', url: 'https://coolors.co/', type: 'link' },
        ],
      },
      {
        title: 'Module 3 Quiz — CSS Fundamentals',
        type: 'quiz',
        content: '<p>Test your CSS fundamentals.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What does box-sizing: border-box do?', type: 'multiple_choice', options: ['Adds a border', 'Includes padding and border in width', 'Removes margins', 'Centers the element'], correctOptionIndex: 1, explanation: 'border-box includes padding and border in the element\'s total width.' },
          { questionText: 'Which selector has the HIGHEST specificity?', type: 'multiple_choice', options: ['p', '.class', '#id', '*'], correctOptionIndex: 2, explanation: 'ID selectors (#id) have higher specificity than class or element selectors.' },
          { questionText: 'What property adds space OUTSIDE an element?', type: 'multiple_choice', options: ['padding', 'border', 'margin', 'spacing'], correctOptionIndex: 2, explanation: 'Margin adds space outside the border.' },
          { questionText: 'Which is the correct CSS syntax?', type: 'multiple_choice', options: ['p {color: red}', 'p {color: red;}', '{p: color: red}', 'p: color = red'], correctOptionIndex: 1, explanation: 'CSS uses selector { property: value; } syntax.' },
          { questionText: 'What does line-height control?', type: 'multiple_choice', options: ['Element width', 'Spacing between lines of text', 'Font size', 'Text color'], correctOptionIndex: 1, explanation: 'line-height controls the vertical space between lines of text.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 4: CSS Layout — Flexbox & Grid
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 4: CSS Layout — Flexbox, Grid & Position',
    description: 'Master modern CSS layouts: Flexbox for 1D, Grid for 2D, and Position for special cases.',
    learningOutcome: 'Build any layout — navbar, card grid, sidebar, hero section — using Flexbox and Grid.',
    hoursAllocated: 12,
    order: 4,
    lessons: [
      {
        title: 'CSS Flexbox — The Complete Guide',
        type: 'article',
        content: `<h2>📐 CSS Flexbox — 1D Layout</h2>
<p>Flexbox arranges items in a <strong>single row or column</strong>. It's the #1 layout tool you'll use every day.</p>

<h3>The Two Key Players</h3>
<div style="display:flex;gap:20px;flex-wrap:wrap;margin:16px 0;">
  <div style="flex:1;min-width:300px;background:#e8eaf6;padding:16px;border-radius:8px;">
    <h4>🏠 Flex Container (parent)</h4>
    <pre><code>.container {
  display: flex;
  /* All properties below go on the PARENT */
}</code></pre>
  </div>
  <div style="flex:1;min-width:300px;background:#e8f5e9;padding:16px;border-radius:8px;">
    <h4>📦 Flex Items (children)</h4>
    <pre><code>.item {
  /* All properties below go on CHILDREN */
}</code></pre>
  </div>
</div>

<h3>Container Properties</h3>
<pre><code>.container {
  display: flex;

  /* MAIN AXIS — where items flow */
  flex-direction: row;           /* → left to right (default) */
  flex-direction: row-reverse;   /* ← right to left */
  flex-direction: column;        /* ↓ top to bottom */
  flex-direction: column-reverse;/* ↑ bottom to top */

  /* WRAPPING — new lines */
  flex-wrap: nowrap;             /* one line (default) */
  flex-wrap: wrap;               /* multiple lines */

  /* ALIGNMENT — across main axis */
  justify-content: flex-start;   /* ← pack to start */
  justify-content: flex-end;     /* → pack to end */
  justify-content: center;       /* ↔ centered */
  justify-content: space-between;/* ← space → */
  justify-content: space-around; /* ← s space s → */

  /* ALIGNMENT — across cross axis */
  align-items: stretch;          /* fill container height */
  align-items: flex-start;       /* top */
  align-items: flex-end;         /* bottom */
  align-items: center;           /* middle */
  align-items: baseline;         /* text baseline */

  /* GAP between items */
  gap: 16px;                     /* uniform gap */
  gap: 16px 24px;                /* row-gap column-gap */
}</code></pre>

<h3>Item Properties</h3>
<pre><code>.item {
  /* Grow to fill space */
  flex-grow: 0;     /* don't grow (default) */
  flex-grow: 1;     /* take available space */

  /* Shrink when space is tight */
  flex-shrink: 1;   /* can shrink (default) */
  flex-shrink: 0;   /* never shrink */

  /* Base size before grow/shrink */
  flex-basis: 200px; /* start at 200px */

  /* Shorthand */
  flex: 1;            /* grow:1 shrink:1 basis:0 */
  flex: 0 0 200px;    /* fixed 200px */

  /* Override container alignment */
  align-self: flex-end;  /* this item goes to bottom */
  align-self: center;    /* this item centers */

  /* Order */
  order: 2;    /* appear 2nd (default is 0) */
}</code></pre>

<h3>Visual Examples</h3>

<h4>1. Navbar (row, space-between, center)</h4>
<div style="display:flex;justify-content:space-between;align-items:center;background:#1a1a2e;color:white;padding:12px 24px;border-radius:8px;margin:8px 0;">
  <div style="font-weight:bold;font-size:1.2rem;">🏠 Logo</div>
  <div style="display:flex;gap:16px;"><span style="cursor:pointer;">Home</span><span style="cursor:pointer;">About</span><span style="cursor:pointer;">Contact</span></div>
</div>
<pre><code>.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #1a1a2e;
  color: white;
}</code></pre>

<h4>2. Card Grid (wrap + gap)</h4>
<div style="display:flex;flex-wrap:wrap;gap:16px;margin:8px 0;">
  <div style="flex:1;min-width:120px;background:#e3f2fd;padding:16px;border-radius:8px;text-align:center;">Card 1</div>
  <div style="flex:1;min-width:120px;background:#e8f5e9;padding:16px;border-radius:8px;text-align:center;">Card 2</div>
  <div style="flex:1;min-width:120px;background:#fff3e0;padding:16px;border-radius:8px;text-align:center;">Card 3</div>
  <div style="flex:1;min-width:120px;background:#fce4ec;padding:16px;border-radius:8px;text-align:center;">Card 4</div>
</div>

<h4>3. Holy Grail Layout</h4>
<pre><code>/* Sidebar + Main + Sidebar */
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar-left  { flex: 0 0 250px; }
.main          { flex: 1; }        /* takes remaining space */
.sidebar-right { flex: 0 0 200px; }</code></pre>

<h3>🎮 Practice with Flexbox Froggy!</h3>
<p><a href="${RESOURCES.flexboxfroggy}" target="_blank">🎮 Play Flexbox Froggy</a> — Learn flexbox by helping frogs reach lilypads!</p>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/nbsz6muQRT4" title="Flexbox Tutorial" frameborder="0" allowfullscreen></iframe>`,
        videoUrl: RESOURCES.flexboxTutorial,
        videoTitle: 'Learn CSS Flexbox in 2 Hours',
        duration: 30,
        resources: [
          { title: 'Flexbox Froggy (Game)', url: RESOURCES.flexboxfroggy, type: 'link' },
          { title: 'CSS-Tricks Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m4-ex1',
            title: 'Build a Navbar with Flexbox',
            description: 'Create a navbar with logo on the left and links on the right using flexbox.',
            language: 'css',
            type: 'write',
            initialCode: `<style>
/* Style the navbar to be:
   - flex display
   - logo on left, links on right
   - centered vertically
   - dark background, white text
   - padding 16px 24px
*/
.navbar {
  
}
.logo { font-weight: bold; font-size: 1.2rem; }
.nav-links { display: flex; gap: 16px; }
</style>
<div class="navbar">
  <div class="logo">🏠 MySite</div>
  <div class="nav-links">
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </div>
</div>`,
            solutionCode: `<style>
* { margin: 0; box-sizing: border-box; }
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1a1a2e;
  color: white;
}
.logo { font-weight: bold; font-size: 1.2rem; }
.nav-links { display: flex; gap: 16px; }
.nav-links a { color: white; text-decoration: none; }
.nav-links a:hover { color: #667eea; }
</style>
<div class="navbar">
  <div class="logo">🏠 MySite</div>
  <div class="nav-links">
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </div>
</div>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'CSS Grid — The Complete Guide',
        type: 'article',
        content: `<h2>🔲 CSS Grid — 2D Layout</h2>
<p>Grid handles <strong>rows AND columns</strong> at once. Perfect for page layouts and card grids.</p>

<h3>Grid vs Flexbox</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Feature</th><th>Flexbox</th><th>Grid</th></tr>
  <tr><td>Dimensions</td><td>1D (row OR column)</td><td>2D (rows AND columns)</td></tr>
  <tr><td>Best for</td><td>Navbars, card rows</td><td>Page layouts, card grids</td></tr>
  <tr><td>Alignment</td><td>Main + cross axis</td><td>Row + column alignment</td></tr>
</table>

<h3>Basic Grid</h3>
<pre><code>.grid-container {
  display: grid;
  
  /* Define columns */
  grid-template-columns: 200px 1fr 200px;  /* sidebar-main-sidebar */
  /* OR auto-size: */
  grid-template-columns: repeat(3, 1fr);   /* 3 equal columns */
  /* OR responsive: */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

  /* Define rows */
  grid-template-rows: 80px 1fr 60px;       /* header-main-footer */

  /* Gap */
  gap: 16px;
}</code></pre>

<h3>Grid Areas — Name Your Layout</h3>
<pre><code>.page {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main   aside"
    "footer footer footer";
  grid-template-columns: 250px 1fr 200px;
  grid-template-rows: 80px 1fr 60px;
  gap: 16px;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }</code></pre>

<h3>Responsive Grid (No Media Queries!)</h3>
<pre><code>/* Cards auto-resize based on container */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

/* This ONE LINE replaces dozens of media queries! */</code></pre>

<h3>Grid Placement</h3>
<pre><code>.item {
  grid-column: 1 / 3;    /* span from column 1 to 3 */
  grid-row: 1 / 2;       /* span from row 1 to 2 */

  /* Shorthand */
  grid-column: span 2;   /* span 2 columns */
  grid-row: span 3;      /* span 3 rows */
}</code></pre>

<h3>🎮 Practice with CSS Grid Garden!</h3>
<p><a href="${RESOURCES.cssgridgarden}" target="_blank">🎮 Play CSS Grid Garden</a> — Learn Grid by growing a garden!</p>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/uSRsu19J_Fo" title="CSS Grid Tutorial" frameborder="0" allowfullscreen></iframe>`,
        videoUrl: RESOURCES.cssGridTutorial,
        videoTitle: 'CSS Grid Tutorial — Full Course',
        duration: 30,
        resources: [
          { title: 'CSS Grid Garden (Game)', url: RESOURCES.cssgridgarden, type: 'link' },
          { title: 'CSS-Tricks Grid Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m4-ex2',
            title: 'Build a Card Grid with CSS Grid',
            description: 'Create a responsive card grid that shows 3 cards per row on desktop and 1 card per row on mobile.',
            language: 'css',
            type: 'write',
            initialCode: `<style>
/* Create a responsive card grid:
   - Use CSS Grid
   - 3 columns on desktop
   - 1 column on mobile
   - Gap: 20px
   - Each card should have padding and border-radius
*/
.card-grid {
  
}
.card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}
</style>
<div class="card-grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
  <div class="card">Card 5</div>
  <div class="card">Card 6</div>
</div>`,
            solutionCode: `<style>
* { box-sizing: border-box; margin: 0; }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}
.card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
}
</style>
<div class="card-grid">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
  <div class="card">Card 4</div>
  <div class="card">Card 5</div>
  <div class="card">Card 6</div>
</div>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'CSS Position — absolute, relative, fixed, sticky',
        type: 'article',
        content: `<h2>📍 CSS Position</h2>
<p>Positioning lets you place elements exactly where you want.</p>

<h3>Position Types</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Value</th><th>Behavior</th><th>Use Case</th></tr>
  <tr><td><code>static</code></td><td>Default — follows normal flow</td><td>Default behavior</td></tr>
  <tr><td><code>relative</code></td><td>Moves relative to its original position</td><td>Offset children, z-index</td></tr>
  <tr><td><code>absolute</code></td><td>Positions relative to nearest positioned ancestor</td><td>Overlays, dropdowns, badges</td></tr>
  <tr><td><code>fixed</code></td><td>Positions relative to viewport (stays when scrolling)</td><td>Sticky navbars, back-to-top</td></tr>
  <tr><td><code>sticky</code></td><td>Acts like relative until threshold, then sticks</td><td>Sticky headers, table of contents</td></tr>
</table>

<h3>Examples</h3>
<pre><code>/* Absolute badge on a card */
.card { position: relative; }
.badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: red;
  color: white;
  padding: 4px 12px;
  border-radius: 50%;
}

/* Fixed navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
body { padding-top: 60px; } /* prevent content hiding */

/* Sticky header */
.section-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 100;
}

/* Center any element */
.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}</code></pre>

<h3>z-index — Stacking Order</h3>
<pre><code>.behind  { z-index: -1; }   /* behind everything */
.normal  { z-index: 1; }    /* default */
.overlay { z-index: 10; }   /* on top */
.modal   { z-index: 1000; } /* on top of everything */

/* z-index only works on positioned elements (not static) */</code></pre>`,
        duration: 25,
        resources: [
          { title: 'MDN Position', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position', type: 'link' },
        ],
      },
      {
        title: 'Module 4 Quiz — CSS Layout',
        type: 'quiz',
        content: '<p>Test your CSS layout knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'Which property makes a flex container?', type: 'multiple_choice', options: ['flex: true', 'display: flexbox', 'display: flex', 'flex: 1'], correctOptionIndex: 2, explanation: 'display: flex creates a flex container.' },
          { questionText: 'What does justify-content do?', type: 'multiple_choice', options: ['Aligns items vertically', 'Aligns items on the main axis', 'Creates gaps', 'Wraps items'], correctOptionIndex: 1, explanation: 'justify-content aligns items along the main axis.' },
          { questionText: 'Which creates a 3-column grid with equal widths?', type: 'multiple_choice', options: ['grid-template-columns: 1fr 1fr 1fr', 'grid-columns: 3', 'grid: 3 columns', 'display: grid(3)'], correctOptionIndex: 0, explanation: 'repeat(3, 1fr) or 1fr 1fr 1fr creates 3 equal columns.' },
          { questionText: 'What position stays fixed when scrolling?', type: 'multiple_choice', options: ['relative', 'absolute', 'fixed', 'sticky'], correctOptionIndex: 2, explanation: 'position: fixed stays in place relative to the viewport.' },
          { questionText: 'What does flex: 1 do?', type: 'multiple_choice', options: ['Sets width to 1px', 'Makes the item grow to fill available space', 'Makes the item shrink', 'Sets order to 1'], correctOptionIndex: 1, explanation: 'flex: 1 is shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 5: CSS Advanced — Animations, Transitions, Transforms
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 5: CSS Advanced — Animations, Transitions & Transforms',
    description: 'Bring your websites to life with smooth transitions, keyframe animations, and 2D/3D transforms.',
    learningOutcome: 'Create hover effects, loading animations, scroll effects, and interactive UI elements.',
    hoursAllocated: 10,
    order: 5,
    lessons: [
      {
        title: 'CSS Transitions — Smooth Property Changes',
        type: 'article',
        content: `<h2>✨ CSS Transitions</h2>
<p>Transitions smoothly animate property changes over time.</p>

<pre><code>/* Syntax */
element {
  transition: property duration timing-function delay;
}

/* Examples */
.button {
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  
  /* Transition on hover */
  transition: all 0.3s ease;
  /* OR be specific: */
  transition: background 0.3s ease, transform 0.2s ease;
}
.button:hover {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* Image zoom on hover */
.card-image {
  transition: transform 0.5s ease;
}
.card:hover .card-image {
  transform: scale(1.05);
}

/* Border animation */
.input {
  border: 2px solid #ddd;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}</code></pre>

<h3>Timing Functions</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Function</th><th>Effect</th><th>Visual</th></tr>
  <tr><td><code>ease</code></td><td>Slow start, fast middle, slow end</td><td>Smooth natural motion</td></tr>
  <tr><td><code>linear</code></td><td>Constant speed</td><td>Mechanical, robotic</td></tr>
  <tr><td><code>ease-in</code></td><td>Slow start, fast end</td><td>Accelerating</td></tr>
  <tr><td><code>ease-out</code></td><td>Fast start, slow end</td><td>Decelerating</td></tr>
  <tr><td><code>ease-in-out</code></td><td>Slow start and end</td><td>Balanced</td></tr>
  <tr><td><code>cubic-bezier()</code></td><td>Custom curve</td><td>Any curve you want</td></tr>
</table>

<h3>Live Demo — Hover Effects</h3>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:16px 32px;border-radius:8px;text-align:center;font-weight:bold;transition:all 0.3s ease;cursor:pointer;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 25px rgba(102,126,234,0.4)'" onmouseout="this.style.transform='';this.style.boxShadow=''">Hover: Lift Up</div>
  <div style="background:#e53935;color:white;padding:16px 32px;border-radius:8px;text-align:center;font-weight:bold;transition:all 0.3s ease;cursor:pointer;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform=''">Hover: Scale</div>
  <div style="background:#43a047;color:white;padding:16px 32px;border-radius:8px;text-align:center;font-weight:bold;transition:all 0.3s ease;cursor:pointer;" onmouseover="this.style.borderRadius='50%';this.style.width='80px';this.style.height='80px';this.style.display='flex';this.style.alignItems='center';this.style.justifyContent='center'" onmouseout="this.style.borderRadius='';this.style.width='';this.style.height='';this.style.display='';this.style.alignItems='';this.style.justifyContent=''">Hover: Circle</div>
</div>`,
        duration: 25,
        resources: [
          { title: 'MDN Transitions', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions', type: 'link' },
          { title: 'CSS Easing Editor', url: 'https://easing.net/', type: 'link' },
        ],
      },
      {
        title: 'CSS Transforms — 2D & 3D',
        type: 'article',
        content: `<h2>🔄 CSS Transforms</h2>
<p>Transforms change an element's shape, position, and size without affecting layout.</p>

<h3>2D Transforms</h3>
<pre><code>.element {
  /* Move */
  transform: translateX(50px);    /* move right */
  transform: translateY(-30px);   /* move up */
  transform: translate(50px, -30px); /* both */

  /* Scale */
  transform: scale(1.5);          /* 150% size */
  transform: scale(0.8);          /* shrink to 80% */
  transform: scaleX(2);           /* double width only */

  /* Rotate */
  transform: rotate(45deg);       /* clockwise */
  transform: rotate(-45deg);      /* counter-clockwise */

  /* Skew */
  transform: skew(10deg);         /* slant */
  transform: skewX(5deg);
}

/* Combine transforms (order matters!) */
.combined {
  transform: translate(50px, 0) rotate(45deg) scale(1.2);
}</code></pre>

<h3>3D Transforms</h3>
<pre><code>.scene {
  perspective: 1000px;   /* enables 3D space */
}

.card-3d {
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}
.card-3d:hover {
  transform: rotateY(180deg);  /* flip card */
}

/* Tilt effect */
.tilt {
  transition: transform 0.3s ease;
}
.tilt:hover {
  transform: perspective(500px) rotateX(10deg) rotateY(-5deg);
}</code></pre>

<h3>Practical: Card Flip Animation</h3>
<div style="perspective:1000px;width:200px;height:120px;margin:16px auto;">
  <div style="width:100%;height:100%;position:relative;transition:transform 0.6s;transform-style:preserve-3d;cursor:pointer;" onmouseover="this.style.transform='rotateY(180deg)'" onmouseout="this.style.transform='rotateY(0deg)'">
    <div style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;align-items:center;justify-content:center;border-radius:12px;font-weight:bold;font-size:1.2rem;">Front</div>
    <div style="position:absolute;width:100%;height:100%;backface-visibility:hidden;background:#e53935;color:white;display:flex;align-items:center;justify-content:center;border-radius:12px;transform:rotateY(180deg);font-weight:bold;font-size:1.2rem;">Back</div>
  </div>
</div>
<p style="text-align:center;"><em>👆 Hover the card above to see the flip!</em></p>`,
        duration: 25,
        resources: [
          { title: 'MDN Transforms', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/transform', type: 'link' },
        ],
      },
      {
        title: 'CSS Keyframe Animations — Beyond Transitions',
        type: 'article',
        content: `<h2>🎬 CSS Keyframe Animations</h2>
<p>Animations run <strong>automatically</strong> (not just on hover). They can loop, delay, and have multiple steps.</p>

<pre><code>/* Define the animation */
@keyframes slideIn {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Apply the animation */
.element {
  animation: slideIn 0.5s ease forwards;

  /* Full syntax */
  animation: name duration timing-function delay iteration-count direction fill-mode;

  /* Example */
  animation: pulse 2s ease-in-out infinite;
  animation: fadeIn 0.8s ease-out 0.2s both;
  animation: spin 1s linear infinite;
}

/* animation-fill-mode */
 forwards  /* stays at end state */
 backwards /* starts at first keyframe state */
 both      /* both of the above */</code></pre>

<h3>Live Demo — Spinner</h3>
<div style="width:40px;height:40px;border:4px solid #ddd;border-top:4px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:16px auto;"></div>
<style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>

<h3>Live Demo — Pulsing Button</h3>
<div style="display:flex;justify-content:center;margin:16px 0;">
  <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:14px 32px;border-radius:8px;font-weight:bold;animation:pulse 2s ease-in-out infinite;cursor:pointer;">Pulsing Button</div>
</div>
<style>@keyframes pulse{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}</style>

<h3>Common Animation Patterns</h3>
<pre><code>/* Loading spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Bounce effect */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Gradient background animation */
.animated-bg {
  background: linear-gradient(270deg, #667eea, #764ba2, #e53935, #43a047);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
}

/* Scroll reveal — combine with JS */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;
}
.reveal.active {
  opacity: 1;
  transform: translateY(0);
}</code></pre>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/YszONjKpgg4" title="CSS Animations" frameborder="0" allowfullscreen></iframe>
<p><em>freeCodeCamp — CSS Animations Tutorial</em></p>`,
        videoUrl: 'https://www.youtube.com/embed/YszONjKpgg4',
        videoTitle: 'CSS Animations Tutorial',
        duration: 30,
        resources: [
          { title: 'MDN Animations', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations', type: 'link' },
          { title: 'Animista (Animation Generator)', url: 'https://animista.net/', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m5-ex1',
            title: 'Create a Loading Spinner with CSS',
            description: 'Build a spinning loader using only CSS animations and border-radius.',
            language: 'css',
            type: 'write',
            initialCode: `<style>
/* Create a loading spinner:
   1. Width/Height: 40px
   2. Border: 4px solid #ddd
   3. Border-top: 4px solid #667eea
   4. Border-radius: 50%
   5. Animation: spin 1s linear infinite
*/

@keyframes spin {
  /* Define the spin keyframe */
}

.spinner {
  
}
</style>
<div class="spinner"></div>`,
            solutionCode: `<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 40px auto;
}
</style>
<div class="spinner"></div>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'Module 5 Quiz — Animations & Transforms',
        type: 'quiz',
        content: '<p>Test your animation knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What is the difference between transition and animation?', type: 'multiple_choice', options: ['No difference', 'Transitions need a trigger, animations run automatically', 'Animations are faster', 'Transitions only work on hover'], correctOptionIndex: 1, explanation: 'Transitions need a state change (hover, class toggle), while animations run on their own.' },
          { questionText: 'What does transform: rotate(90deg) do?', type: 'multiple_choice', options: ['Moves element 90px', 'Rotates element 90 degrees clockwise', 'Scales element by 90%', 'Skews element'], correctOptionIndex: 1, explanation: 'rotate(90deg) rotates the element 90 degrees clockwise.' },
          { questionText: 'What does animation-fill-mode: forwards do?', type: 'multiple_choice', options: ['Loops the animation', 'Plays it backwards', 'Keeps the final state after animation ends', 'Pauses the animation'], correctOptionIndex: 2, explanation: 'forwards keeps the element at the last keyframe state after animation ends.' },
          { questionText: 'How do you make an element spin continuously?', type: 'multiple_choice', options: ['animation: spin 1s forwards', 'animation: spin 1s infinite', 'animation: spin 1s alternate', 'animation: spin 1s backwards'], correctOptionIndex: 1, explanation: 'infinite makes the animation loop forever.' },
          { questionText: 'What enables 3D transforms?', type: 'multiple_choice', options: ['transform-style: 3d', 'perspective', 'transform: 3d', 'display: 3d'], correctOptionIndex: 1, explanation: 'perspective on a parent element enables 3D space for children.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 6: CSS Responsive Design & Media Queries
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 6: Responsive Design & Media Queries',
    description: 'Make websites work perfectly on phones, tablets, and desktops using mobile-first responsive design.',
    learningOutcome: 'Build responsive layouts, use media queries, and apply mobile-first design principles.',
    hoursAllocated: 10,
    order: 6,
    lessons: [
      {
        title: 'Mobile-First Responsive Design',
        type: 'article',
        content: `<h2>📱 Responsive Design</h2>
<p><strong>Responsive</strong> = looks great on ALL screen sizes (phone, tablet, desktop).</p>

<h3>The Mobile-First Approach</h3>
<div style="background:#e8f5e9;padding:16px;border-radius:8px;margin:16px 0;">
  <p><strong>Rule: Design for mobile FIRST, then add desktop styles.</strong></p>
  <pre><code>/* Base styles = mobile (smallest screen) */
.container {
  padding: 16px;
}
.card-grid {
  display: grid;
  grid-template-columns: 1fr;    /* 1 column on mobile */
  gap: 16px;
}

/* Tablet (768px and up) */
@media (min-width: 768px) {
  .container { padding: 24px; }
  .card-grid {
    grid-template-columns: 1fr 1fr;  /* 2 columns */
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .container { padding: 32px; max-width: 1200px; margin: 0 auto; }
  .card-grid {
    grid-template-columns: 1fr 1fr 1fr;  /* 3 columns */
  }
}</code></pre>
</div>

<h3>Viewport Meta Tag (Required!)</h3>
<pre><code>&lt;!-- Without this, mobile browsers won't zoom correctly --&gt;
&lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;</code></pre>

<h3>Common Breakpoints</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Device</th><th>Width</th><th>Breakpoint</th></tr>
  <tr><td>📱 Phone</td><td>0–480px</td><td>Base (no media query)</td></tr>
  <tr><td>📱 Large Phone</td><td>481–768px</td><td><code>@media (min-width: 481px)</code></td></tr>
  <tr><td>📱 Tablet</td><td>769–1024px</td><td><code>@media (min-width: 769px)</code></td></tr>
  <tr><td>💻 Desktop</td><td>1025–1200px</td><td><code>@media (min-width: 1025px)</code></td></tr>
  <tr><td>🖥️ Large Desktop</td><td>1201px+</td><td><code>@media (min-width: 1201px)</code></td></tr>
</table>

<h3>Responsive Techniques</h3>
<pre><code>/* 1. Responsive images */
img {
  max-width: 100%;    /* never wider than container */
  height: auto;       /* maintain aspect ratio */
}

/* 2. Responsive font sizes */
h1 { font-size: clamp(1.5rem, 4vw, 3rem); }
p  { font-size: clamp(0.9rem, 2vw, 1.1rem); }

/* 3. Responsive padding/margins */
.section {
  padding: clamp(1rem, 5vw, 4rem);
}

/* 4. Show/hide elements */
.mobile-menu { display: none; }
@media (max-width: 768px) {
  .mobile-menu { display: block; }
  .desktop-menu { display: none; }
}

/* 5. Responsive flexbox */
.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
@media (max-width: 768px) {
  .nav-links {
    flex-direction: column;  /* stack vertically on mobile */
  }
}</code></pre>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/geRlpbhSwqM" title="Responsive Design" frameborder="0" allowfullscreen></iframe>
<p><em>Build Responsive Layouts — Full Course</em></p>

<img src="${RESOURCES.responsiveImage}" alt="Responsive Design" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;">`,
        videoUrl: RESOURCES.responsiveDesign,
        videoTitle: 'Responsive Layouts with HTML & CSS',
        duration: 30,
        resources: [
          { title: 'MDN Responsive Design', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design', type: 'link' },
          { title: 'Responsinator (Test Your Site)', url: 'http://www.responsinator.com/', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m6-ex1',
            title: 'Make a Page Responsive',
            description: 'Convert a fixed-width layout to a responsive one using media queries and flexbox.',
            language: 'css',
            type: 'write',
            initialCode: `<style>
/* Fix this layout to work on mobile:
   1. Add viewport meta in the head
   2. Make the grid responsive (1 col mobile, 2 col tablet, 3 col desktop)
   3. Make images responsive
   4. Stack nav links vertically on mobile
*/
</style>
<div style="max-width:1200px;margin:0 auto;padding:20px;">
  <nav style="display:flex;gap:20px;padding:16px;background:#1a1a2e;color:white;">
    <a href="#" style="color:white;">Home</a>
    <a href="#" style="color:white;">About</a>
    <a href="#" style="color:white;">Contact</a>
  </nav>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;">
    <div style="background:#f4f4f4;padding:20px;border-radius:8px;">Card 1</div>
    <div style="background:#f4f4f4;padding:20px;border-radius:8px;">Card 2</div>
    <div style="background:#f4f4f4;padding:20px;border-radius:8px;">Card 3</div>
  </div>
</div>`,
            solutionCode: `<style>
* { box-sizing: border-box; margin: 0; }
body { font-family: Arial, sans-serif; }
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
nav { display: flex; gap: 20px; padding: 16px; background: #1a1a2e; }
nav a { color: white; text-decoration: none; }
.card-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 20px; }
.card { background: #f4f4f4; padding: 20px; border-radius: 8px; }
@media (min-width: 768px) {
  .card-grid { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: 1fr 1fr 1fr; }
}
@media (max-width: 768px) {
  nav { flex-direction: column; gap: 8px; }
}
</style>
<div class="container">
  <nav>
    <a href="#">Home</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
  <div class="card-grid">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
  </div>
</div>`,
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'Module 6 Quiz — Responsive Design',
        type: 'quiz',
        content: '<p>Test your responsive design knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What approach should you use for responsive design?', type: 'multiple_choice', options: ['Desktop-first', 'Mobile-first', 'Tablet-first', 'No specific approach'], correctOptionIndex: 1, explanation: 'Mobile-first is the recommended approach — design for small screens first.' },
          { questionText: 'What does the viewport meta tag do?', type: 'multiple_choice', options: ['Adds animation', 'Sets the browser viewport width', 'Changes colors', 'Loads fonts'], correctOptionIndex: 1, explanation: 'The viewport meta tag sets the width to the device width for proper scaling.' },
          { questionText: 'Which media query targets tablets?', type: 'multiple_choice', options: ['@media (max-width: 480px)', '@media (min-width: 768px)', '@media (min-width: 1200px)', '@media (max-width: 100px)'], correctOptionIndex: 1, explanation: '@media (min-width: 768px) targets tablets and larger screens.' },
          { questionText: 'What does img { max-width: 100% } do?', type: 'multiple_choice', options: ['Makes image full screen', 'Prevents image from exceeding container width', 'Centers the image', 'Adds a border'], correctOptionIndex: 1, explanation: 'max-width: 100% ensures the image never overflows its container.' },
          { questionText: 'Which CSS function creates fluid font sizes?', type: 'multiple_choice', options: ['calc()', 'clamp()', 'min()', 'max()'], correctOptionIndex: 1, explanation: 'clamp(min, preferred, max) creates fluid typography between min and max sizes.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// COURSE 2: JavaScript Interactivity Mini-Challenge (4 modules)
// GitHub Classroom + Frontend Mentor style
// ═══════════════════════════════════════════════════════════════

const COURSE_2_MODULES = [
  // ═══════════════════════════════════════════════════════════
  // MODULE 7: JavaScript Fundamentals
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 7: JavaScript Fundamentals',
    description: 'Learn JavaScript basics: variables, functions, loops, conditionals, and arrays.',
    learningOutcome: 'Write JavaScript programs, use functions, loops, and arrays confidently.',
    hoursAllocated: 12,
    order: 7,
    lessons: [
      {
        title: 'JavaScript — Variables, Data Types & Operators',
        type: 'article',
        content: `<h2>🟨 JavaScript — The Language of the Web</h2>
<p>JavaScript makes websites <strong>interactive</strong>. Without JS, websites are just static documents.</p>

<h3>Variables — Storing Data</h3>
<pre><code>// let — value can change
let score = 0;
score = 10;  // ✅ OK

// const — value cannot change
const PI = 3.14159;
PI = 3;  // ❌ Error!

// var — old way, avoid
var old = "don't use";</code></pre>

<h3>Data Types</h3>
<pre><code>let name = "Alice";        // String (text)
let age = 25;              // Number (integers & decimals)
let price = 19.99;         // Number (decimal)
let isLoggedIn = true;     // Boolean (true/false)
let user = null;           // Null (intentional empty)
let something;             // Undefined (not assigned)
let id = Symbol('id');     // Symbol (unique identifier)
let big = 9007199254740991n; // BigInt (huge numbers)

// typeof operator
typeof "hello"    // "string"
typeof 42         // "number"
typeof true       // "boolean"</code></pre>

<h3>Operators</h3>
<pre><code>// Arithmetic
let sum = 5 + 3;       // 8
let diff = 10 - 4;     // 6
let product = 3 * 7;   // 21
let quotient = 15 / 3; // 5
let remainder = 10 % 3; // 1 (modulus)
let power = 2 ** 3;    // 8 (exponent)

// Comparison (returns boolean)
5 === 5      // true  (strict equal — value AND type)
5 !== "5"    // true  (strict not equal)
5 > 3        // true
5 < 3        // false
5 >= 5       // true

// Logical
true && false   // false (AND)
true || false   // true  (OR)
!true           // false (NOT)</code></pre>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/hdI2bqOjy3c" title="JS Crash Course" frameborder="0" allowfullscreen></iframe>
<p><em>Traversy Media — JavaScript Crash Course For Beginners (1h 40m)</em></p>`,
        videoUrl: RESOURCES.jsCrashCourse,
        videoTitle: 'JavaScript Crash Course For Beginners',
        duration: 30,
        resources: [
          { title: 'MDN JavaScript Guide', url: RESOURCES.mdnJS, type: 'link' },
          { title: 'W3Schools JavaScript Tutorial', url: RESOURCES.w3schoolsJS, type: 'link' },
          { title: 'freeCodeCamp JS Algorithms', url: RESOURCES.freecodecampJS, type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m7-ex1',
            title: 'Variable Practice',
            description: 'Create variables for your name, age, and whether you are a student. Log them all.',
            language: 'javascript',
            type: 'write',
            initialCode: '// Create a let variable "name" with your name\n// Create a const variable "age" with your age\n// Create a const variable "isStudent" set to true\n// Log all three to the console',
            solutionCode: 'let name = "Alice";\nconst age = 25;\nconst isStudent = true;\nconsole.log(name);\nconsole.log(age);\nconsole.log(isStudent);',
            testCode: '',
            expectedOutput: 'Alice\n25\ntrue',
          },
        ],
      },
      {
        title: 'Functions, Conditions & Loops',
        type: 'article',
        content: `<h2>🔄 Control Flow & Functions</h2>

<h3>If/Else Statements</h3>
<pre><code>const age = 18;

if (age >= 18) {
  console.log("You can vote!");
} else if (age >= 13) {
  console.log("You're a teenager");
} else {
  console.log("You're a child");
}

// Ternary operator (shorthand)
const message = age >= 18 ? "Adult" : "Minor";</code></pre>

<h3>Functions</h3>
<pre><code>// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Arrow function (modern)
const greet = (name) => "Hello, " + name + "!";

// Function with default parameter
function greet(name = "World") {
  return \`Hello, \${name}!\`;
}

// Using the function
console.log(greet("Alice"));  // "Hello, Alice!"
console.log(greet());         // "Hello, World!"</code></pre>

<h3>Loops</h3>
<pre><code>// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);  // 0, 1, 2, 3, 4
}

// While loop
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// For...of (arrays)
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
  console.log(fruit);
}

// For...in (objects)
const person = { name: "Alice", age: 25 };
for (const key in person) {
  console.log(key + ": " + person[key]);
}</code></pre>

<h3>Arrays</h3>
<pre><code>const numbers = [1, 2, 3, 4, 5];

// Common methods
numbers.push(6);          // add to end
numbers.pop();            // remove from end
numbers.unshift(0);       // add to start
numbers.shift();          // remove from start
numbers.includes(3);      // true
numbers.indexOf(3);       // 2
numbers.slice(1, 3);      // [2, 3]
numbers.splice(1, 1);     // remove 1 at index 1

// Higher-order methods (VERY important!)
const doubled = numbers.map(n => n * 2);      // [2,4,6,8,10]
const evens = numbers.filter(n => n % 2 === 0); // [2,4]
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15
const found = numbers.find(n => n > 3);       // 4</code></pre>`,
        duration: 30,
        resources: [],
        codeExercises: [
          {
            id: 'web-m7-ex2',
            title: 'Write a Grade Calculator',
            description: 'Write a function that takes a score (0-100) and returns the letter grade: A (90+), B (80+), C (70+), D (60+), F (below 60).',
            language: 'javascript',
            type: 'test',
            initialCode: 'function getGrade(score) {\n  // Return "A", "B", "C", "D", or "F"\n  \n}',
            solutionCode: 'function getGrade(score) {\n  if (score >= 90) return "A";\n  if (score >= 80) return "B";\n  if (score >= 70) return "C";\n  if (score >= 60) return "D";\n  return "F";\n}',
            testCode: `\ndescribe("getGrade", function() {
  it("returns A for 95", function() { assert.equals(getGrade(95), "A"); });
  it("returns B for 85", function() { assert.equals(getGrade(85), "B"); });
  it("returns C for 75", function() { assert.equals(getGrade(75), "C"); });
  it("returns D for 65", function() { assert.equals(getGrade(65), "D"); });
  it("returns F for 50", function() { assert.equals(getGrade(50), "F"); });
  it("returns A for 100", function() { assert.equals(getGrade(100), "A"); });
});`,
          },
        ],
      },
      {
        title: 'Module 7 Quiz — JavaScript Basics',
        type: 'quiz',
        content: '<p>Test your JavaScript fundamentals.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'Which keyword creates a constant?', type: 'multiple_choice', options: ['let', 'const', 'var', 'static'], correctOptionIndex: 1, explanation: 'const creates a constant that cannot be reassigned.' },
          { questionText: 'What does arr.map() return?', type: 'multiple_choice', options: ['The original array', 'A new array with transformed values', 'A single value', 'undefined'], correctOptionIndex: 1, explanation: 'map() creates a new array by applying a function to each element.' },
          { questionText: 'What is the output of typeof null?', type: 'multiple_choice', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctOptionIndex: 2, explanation: 'typeof null returns "object" — a historical bug in JavaScript.' },
          { questionText: 'What does === check?', type: 'multiple_choice', options: ['Value only', 'Type only', 'Value AND type', 'Reference'], correctOptionIndex: 2, explanation: '=== checks both value and type (strict equality).' },
          { questionText: 'Which method adds to the end of an array?', type: 'multiple_choice', options: ['shift()', 'unshift()', 'push()', 'pop()'], correctOptionIndex: 2, explanation: 'push() adds elements to the end of an array.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 8: Deep DOM Manipulation
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 8: Deep DOM Manipulation',
    description: 'Master the Document Object Model — select, create, modify, and remove HTML elements with JavaScript.',
    learningOutcome: 'Build interactive UIs by manipulating the DOM: creating elements, updating content, and styling dynamically.',
    hoursAllocated: 12,
    order: 8,
    lessons: [
      {
        title: 'What is the DOM? — Selecting Elements',
        type: 'article',
        content: `<h2>🌳 The Document Object Model (DOM)</h2>
<p>The DOM is a <strong>tree of objects</strong> that represents your HTML page. JavaScript can read and modify every part of it.</p>

<h3>Visual: HTML → DOM Tree</h3>
<pre><code>&lt;html&gt;              →  document (root)
  &lt;head&gt;           →  document.head
    &lt;title&gt;        →  document.title
  &lt;/head&gt;
  &lt;body&gt;           →  document.body
    &lt;h1&gt;Hello&lt;/h1&gt; →  document.querySelector('h1')
    &lt;p&gt;Text&lt;/p&gt;    →  document.querySelector('p')
  &lt;/body&gt;
&lt;/html&gt;</code></pre>

<h3>4 Ways to Select Elements</h3>
<pre><code>// 1. By ID (fastest — returns ONE element)
const header = document.getElementById('header');

// 2. By class name (returns a live HTMLCollection)
const cards = document.getElementsByClassName('card');

// 3. By tag name (returns a live HTMLCollection)
const paragraphs = document.getElementsByTagName('p');

// 4. Query Selector (BEST — uses CSS selectors)
const firstCard = document.querySelector('.card');         // first match
const allCards = document.querySelectorAll('.card');       // all matches (NodeList)

// Modern recommendation: Always use querySelector/querySelectorAll</code></pre>

<h3>What Can You Read?</h3>
<pre><code>const element = document.querySelector('#myElement');

// Content
element.textContent     // "Hello World" (plain text)
element.innerHTML       // "&lt;b&gt;Hello&lt;/b&gt; World" (includes HTML)
element.innerText       // "Hello World" (visible text only)

// Attributes
element.id              // "myElement"
element.className       // "box active"
element.getAttribute('data-id')  // custom attributes
element.dataset.id      // shorthand for data-id

// Styles
element.style.color     // "red" (inline style)
element.style.cssText   // "color: red; font-size: 16px"

// Size & Position
element.offsetWidth     // width including padding & border
element.offsetHeight    // height
element.clientWidth     // width excluding scrollbar
element.getBoundingClientRect()  // {top, left, width, height, ...}</code></pre>

<img src="${RESOURCES.domImage}" alt="DOM Manipulation" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;">`,
        duration: 25,
        resources: [
          { title: 'MDN DOM Introduction', url: RESOURCES.mdnDOM, type: 'link' },
          { title: 'freeCodeCamp DOM Handbook', url: 'https://www.freecodecamp.org/news/the-javascript-dom-manipulation-handbook/', type: 'link' },
        ],
        videoUrl: RESOURCES.domManipulation,
        videoTitle: 'JavaScript DOM Manipulation — Full Course',
      },
      {
        title: 'Modifying the DOM — Creating, Adding, Removing Elements',
        type: 'article',
        content: `<h2>🔧 Modifying the DOM</h2>

<h3>Changing Content</h3>
<pre><code>const el = document.querySelector('#greeting');

el.textContent = 'Hello!';        // plain text
el.innerHTML = '&lt;strong&gt;Hello!&lt;/strong&gt;';  // HTML content
el.innerText = 'Hello!';          // visible text only</code></pre>

<h3>Changing Styles</h3>
<pre><code>el.style.color = 'red';
el.style.backgroundColor = '#f0f0f0';  // camelCase!
el.style.padding = '20px';
el.style.borderRadius = '8px';
el.style.cssText = 'color: red; padding: 20px;';  // set multiple</code></pre>

<h3>Adding/Removing CSS Classes (Preferred!)</h3>
<pre><code>el.classList.add('active');        // add class
el.classList.remove('active');     // remove class
el.classList.toggle('active');     // add or remove (toggle)
el.classList.contains('active');   // check if has class (returns boolean)
el.classList.replace('old', 'new');</code></pre>

<h3>Creating New Elements</h3>
<pre><code>// 1. Create element
const newCard = document.createElement('div');
newCard.className = 'card';
newCard.innerHTML = \`
  &lt;h3&gt;New Card&lt;/h3&gt;
  &lt;p&gt;This was created with JavaScript!&lt;/p&gt;
\`;

// 2. Add to the page
const container = document.querySelector('.card-container');
container.appendChild(newCard);          // add to end
container.prepend(newCard);              // add to start
container.insertBefore(newCard, ref);    // before reference element

// 3. Using insertAdjacentHTML (easier)
container.insertAdjacentHTML('beforeend', '&lt;div class="card"&gt;New&lt;/div&gt;');
// Positions: 'beforebegin', 'afterbegin', 'beforeend', 'afterend'

// 4. Remove elements
newCard.remove();                        // modern way
container.removeChild(newCard);          // older way</code></pre>

<h3>Cloning Elements</h3>
<pre><code>const original = document.querySelector('.card');
const clone = original.cloneNode(true);  // true = deep clone (with children)
container.appendChild(clone);</code></pre>

<h3>Practical: Dynamic List</h3>
<pre><code>function addTodo(text) {
  const li = document.createElement('li');
  li.innerHTML = \`
    &lt;span&gt;\${text}&lt;/span&gt;
    &lt;button class="delete-btn"&gt;✕&lt;/button&gt;
  \`;
  document.querySelector('.todo-list').appendChild(li);
}

// Add event to delete button
li.querySelector('.delete-btn').addEventListener('click', () =&gt; {
  li.remove();
});</code></pre>`,
        duration: 30,
        resources: [
          { title: 'MDN DOM Manipulation', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m8-ex1',
            title: 'Build a Dynamic List',
            description: 'Write a function that creates a list item with text and a delete button, then appends it to the list.',
            language: 'javascript',
            type: 'write',
            initialCode: '// HTML: <ul id="list"></ul>\n\nfunction addListItem(text) {\n  // 1. Create an li element\n  // 2. Set its text content\n  // 3. Append it to the #list\n}\n\n// Test: addListItem("Item 1");',
            solutionCode: 'function addListItem(text) {\n  const li = document.createElement("li");\n  li.textContent = text;\n  document.getElementById("list").appendChild(li);\n}',
            testCode: '',
            expectedOutput: '',
          },
        ],
      },
      {
        title: 'Module 8 Quiz — DOM Manipulation',
        type: 'quiz',
        content: '<p>Test your DOM knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'Which method selects the FIRST matching element?', type: 'multiple_choice', options: ['querySelectorAll()', 'querySelector()', 'getElementById()', 'getElementsByClassName()'], correctOptionIndex: 1, explanation: 'querySelector() returns the first element matching the CSS selector.' },
          { questionText: 'What does element.remove() do?', type: 'multiple_choice', options: ['Clears the content', 'Removes the element from the DOM', 'Hides the element', 'Resets the element'], correctOptionIndex: 1, explanation: 'remove() deletes the element entirely from the DOM.' },
          { questionText: 'How do you add a CSS class to an element?', type: 'multiple_choice', options: ['el.addClass("name")', 'el.classList.add("name")', 'el.className.add("name")', 'el.addCSS("name")'], correctOptionIndex: 1, explanation: 'classList.add() adds a CSS class to the element.' },
          { questionText: 'What does el.innerHTML return?', type: 'multiple_choice', options: ['Plain text only', 'The HTML content inside the element', 'The element\'s styles', 'The element\'s parent'], correctOptionIndex: 1, explanation: 'innerHTML returns the HTML markup inside the element.' },
          { questionText: 'How do you create a new HTML element?', type: 'multiple_choice', options: ['new Element()', 'document.createElement("div")', 'create.html("div")', 'HTML.new("div")'], correctOptionIndex: 1, explanation: 'document.createElement() creates a new element in memory.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 9: JavaScript Events & Form Validation
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 9: JavaScript Events & Form Validation',
    description: 'Make your website interactive with event listeners, form validation, and DOM toggle effects.',
    learningOutcome: 'Handle click, input, submit events. Validate forms. Build toggle menus and interactive UIs.',
    hoursAllocated: 12,
    order: 9,
    lessons: [
      {
        title: 'Event Listeners — Click, Hover, Input',
        type: 'article',
        content: `<h2>🖱️ Events — Making Pages Interactive</h2>

<h3>addEventListener — The Modern Way</h3>
<pre><code>const button = document.querySelector('#myBtn');

// Click event
button.addEventListener('click', (event) => {
  console.log('Button clicked!');
  console.log('Target:', event.target);
});

// Input event (fires on every keystroke)
const input = document.querySelector('#search');
input.addEventListener('input', (event) => {
  console.log('User typed:', event.target.value);
});

// Submit event (form submission)
const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault(); // STOP the form from submitting
  const formData = new FormData(form);
  console.log('Name:', formData.get('name'));
  console.log('Email:', formData.get('email'));
});

// Keyboard events
document.addEventListener('keydown', (event) => {
  console.log('Key pressed:', event.key);
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Mouse events
button.addEventListener('mouseover', () => { /* hover in */ });
button.addEventListener('mouseout', () => { /* hover out */ });

// Scroll event
window.addEventListener('scroll', () => {
  console.log('Scrolled to:', window.scrollY);
});</code></pre>

<h3>Common Event Types</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>Event</th><th>Fires When</th><th>Use Case</th></tr>
  <tr><td>click</td><td>Element clicked</td><td>Buttons, links</td></tr>
  <tr><td>dblclick</td><td>Double-clicked</td><td>Edit mode</td></tr>
  <tr><td>mouseover/mouseout</td><td>Mouse enters/leaves</td><td>Hover effects</td></tr>
  <tr><td>keydown/keyup</td><td>Key pressed/released</td><td>Shortcuts, games</td></tr>
  <tr><td>input</td><td>Value changes</td><td>Live search, validation</td></tr>
  <tr><td>change</td><td>Value committed</td><td>Select dropdowns</td></tr>
  <tr><td>submit</td><td>Form submitted</td><td>Form handling</td></tr>
  <tr><td>focus/blur</td><td>Element gains/loses focus</td><td>Input styling</td></tr>
  <tr><td>scroll</td><td>Page scrolls</td><td>Sticky headers, parallax</td></tr>
  <tr><td>load</td><td>Page fully loaded</td><td>Initialization</td></tr>
</table>`,
        duration: 30,
        resources: [
          { title: 'MDN Events Reference', url: 'https://developer.mozilla.org/en-US/docs/Web/Events', type: 'link' },
        ],
        videoUrl: RESOURCES.jsEventsTutorial,
        videoTitle: 'JavaScript Events Tutorial',
      },
      {
        title: 'Form Validation & DOM Toggle',
        type: 'article',
        content: `<h2>✅ Form Validation & 🎯 DOM Toggle</h2>

<h3>Form Validation Pattern</h3>
<pre><code>const form = document.querySelector('#signupForm');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const errorMsg = document.querySelector('#error');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Clear previous errors
  errorMsg.textContent = '';
  nameInput.classList.remove('error');
  emailInput.classList.remove('error');
  
  // Validate name
  if (nameInput.value.trim().length < 2) {
    errorMsg.textContent = 'Name must be at least 2 characters';
    nameInput.classList.add('error');
    return; // Stop here
  }
  
  // Validate email
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(emailInput.value)) {
    errorMsg.textContent = 'Please enter a valid email';
    emailInput.classList.add('error');
    return;
  }
  
  // If all valid
  alert('Form submitted successfully!');
  form.reset();
});</code></pre>

<h3>Real-time Validation</h3>
<pre><code>emailInput.addEventListener('input', () => {
  const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailInput.value);
  
  if (isValid) {
    emailInput.classList.add('valid');
    emailInput.classList.remove('invalid');
  } else {
    emailInput.classList.add('invalid');
    emailInput.classList.remove('valid');
  }
});</code></pre>

<h3>Toggle Menu (Hamburger Menu)</h3>
<pre><code>const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');   // toggle class
  hamburger.classList.toggle('active');
});

// Close menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
  });
});</code></pre>

<h3>Tab Switching</h3>
<pre><code>const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    // Remove active from all
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    tabContents[index].classList.add('active');
  });
});</code></pre>

<h3>Modal Popup</h3>
<pre><code>const openBtn = document.querySelector('#openModal');
const closeBtn = document.querySelector('#closeModal');
const modal = document.querySelector('#modal');

openBtn.addEventListener('click', () => {
  modal.classList.add('show');
});

closeBtn.addEventListener('click', () => {
  modal.classList.remove('show');
});

// Close on outside click
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('show');
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    modal.classList.remove('show');
  }
});</code></pre>`,
        duration: 30,
        resources: [],
        codeExercises: [
          {
            id: 'web-m9-ex1',
            title: 'Form Validation Challenge',
            description: 'Write a function that validates a signup form: name (min 3 chars), email (valid format), password (min 8 chars). Return an error message or null if valid.',
            language: 'javascript',
            type: 'test',
            initialCode: 'function validateForm(name, email, password) {\n  // Return error message string if invalid\n  // Return null if all valid\n  \n}',
            solutionCode: 'function validateForm(name, email, password) {\n  if (name.trim().length < 3) return "Name must be at least 3 characters";\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  if (!emailRegex.test(email)) return "Invalid email format";\n  if (password.length < 8) return "Password must be at least 8 characters";\n  return null;\n}',
            testCode: `\ndescribe("validateForm", function() {
  it("returns null for valid inputs", function() { assert.equals(validateForm("Alice", "a@b.com", "password123"), null); });
  it("catches short name", function() { assert.equals(validateForm("Al", "a@b.com", "password123"), "Name must be at least 3 characters"); });
  it("catches invalid email", function() { assert.equals(validateForm("Alice", "invalid", "password123"), "Invalid email format"); });
  it("catches short password", function() { assert.equals(validateForm("Alice", "a@b.com", "123"), "Password must be at least 8 characters"); });
});`,
          },
        ],
      },
      {
        title: 'Module 9 Quiz — Events & Validation',
        type: 'quiz',
        content: '<p>Test your events and validation knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What does event.preventDefault() do?', type: 'multiple_choice', options: ['Prevents all events', 'Stops the default browser behavior', 'Removes the event listener', 'Cancels the animation'], correctOptionIndex: 1, explanation: 'preventDefault() stops the browser default action (like form submission or link navigation).' },
          { questionText: 'Which event fires when the user types in an input?', type: 'multiple_choice', options: ['click', 'submit', 'input', 'change'], correctOptionIndex: 2, explanation: 'The input event fires every time the value changes (on each keystroke).' },
          { questionText: 'How do you check if a class exists on an element?', type: 'multiple_choice', options: ['el.hasClass("name")', 'el.classList.contains("name")', 'el.classExists("name")', 'el.hasClass("name")'], correctOptionIndex: 1, explanation: 'classList.contains() returns true if the element has that class.' },
          { questionText: 'What does classList.toggle() do?', type: 'multiple_choice', options: ['Adds the class', 'Removes the class', 'Adds or removes depending on current state', 'Replaces the class'], correctOptionIndex: 2, explanation: 'toggle() adds the class if absent, removes it if present.' },
          { questionText: 'How do you stop a form from submitting?', type: 'multiple_choice', options: ['event.stopPropagation()', 'event.preventDefault()', 'event.cancelSubmit()', 'return false;'], correctOptionIndex: 1, explanation: 'event.preventDefault() in the submit handler stops the form from submitting.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 10: Fetch API & Working with Data
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 10: Fetch API & Working with Data',
    description: 'Learn to fetch data from APIs, use async/await, and display data dynamically on your page.',
    learningOutcome: 'Fetch data from public APIs, handle errors, and display results dynamically.',
    hoursAllocated: 10,
    order: 10,
    lessons: [
      {
        title: 'The Fetch API — Getting Data from the Internet',
        type: 'article',
        content: `<h2>🌐 Fetch API — Real-World Data</h2>
<p>The Fetch API lets your JavaScript <strong>talk to servers</strong> and get data (JSON, images, etc.).</p>

<h3>Basic Fetch (with Promises)</h3>
<pre><code>// GET request
fetch('https://jsonplaceholder.typicode.com/users')
  .then(response => response.json())    // parse JSON
  .then(data => {
    console.log(data);  // array of user objects
  })
  .catch(error => {
    console.error('Error:', error);
  });</code></pre>

<h3>Async/Await (Modern, Cleaner!)</h3>
<pre><code>async function getUsers() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    
    if (!response.ok) {
      throw new Error('HTTP error! Status: ' + response.status);
    }
    
    const users = await response.json();
    console.log(users);
    return users;
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

getUsers();</code></pre>

<h3>Display Data on the Page</h3>
<pre><code>async function displayUsers() {
  const response = await fetch('https://jsonplaceholder.typicode.com/users');
  const users = await response.json();
  
  const container = document.getElementById('user-list');
  
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.innerHTML = \`
      &lt;h3&gt;\${user.name}&lt;/h3&gt;
      &lt;p&gt;📧 \${user.email}&lt;/p&gt;
      &lt;p&gt;📞 \${user.phone}&lt;/p&gt;
      &lt;p&gt;🏢 \${user.company.name}&lt;/p&gt;
    \`;
    container.appendChild(card);
  });
}

// Call when page loads
document.addEventListener('DOMContentLoaded', displayUsers);</code></pre>

<h3>Free APIs to Practice With</h3>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr style="background:#1a1a2e;color:white;"><th>API</th><th>Data</th><th>URL</th></tr>
  <tr><td>JSONPlaceholder</td><td>Users, posts, todos</td><td><code>https://jsonplaceholder.typicode.com/users</code></td></tr>
  <tr><td>PokéAPI</td><td>Pokémon data</td><td><code>https://pokeapi.co/api/v2/pokemon/pikachu</code></td></tr>
  <tr><td>OpenWeatherMap</td><td>Weather data</td><td><code>https://api.openweathermap.org</code></td></tr>
  <tr><td>Dog API</td><td>Dog images</td><td><code>https://dog.ceo/api/breeds/image/random</code></td></tr>
  <tr><td>REST Countries</td><td>Country data</td><td><code>https://restcountries.com/v3.1/all</code></td></tr>
  <tr><td>Quotes API</td><td>Inspirational quotes</td><td><code>https://dummyjson.com/quotes/random</code></td></tr>
</table>

<h3>🎥 Watch Video</h3>
<iframe width="560" height="315" src="https://www.youtube.com/embed/Oive66jrwBs" title="Fetch API Tutorial" frameborder="0" allowfullscreen></iframe>
<p><em>Fetch API — JavaScript Tutorial for Beginners</em></p>

<img src="${RESOURCES.apiImage}" alt="APIs" style="width:100%;max-width:600px;border-radius:12px;margin:16px 0;">`,
        videoUrl: RESOURCES.fetchApiTutorial,
        videoTitle: 'Fetch API — JavaScript Tutorial',
        duration: 30,
        resources: [
          { title: 'MDN Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', type: 'link' },
          { title: 'Free APIs List', url: 'https://github.com/public-apis/public-apis', type: 'link' },
        ],
        codeExercises: [
          {
            id: 'web-m10-ex1',
            title: 'Fetch and Display Users',
            description: 'Write an async function that fetches users from JSONPlaceholder and returns an array of objects with name and email.',
            language: 'javascript',
            type: 'test',
            initialCode: 'async function fetchUsers() {\n  // Fetch from https://jsonplaceholder.typicode.com/users\n  // Return array of { name, email } objects\n  \n}',
            solutionCode: 'async function fetchUsers() {\n  const response = await fetch("https://jsonplaceholder.typicode.com/users");\n  const users = await response.json();\n  return users.map(u => ({ name: u.name, email: u.email }));\n}',
            testCode: `\ndescribe("fetchUsers", function() {
  it("returns an array", async function() {
    const result = await fetchUsers();
    assert.ok(Array.isArray(result), "Should return an array");
  });
  it("each item has name and email", async function() {
    const result = await fetchUsers();
    assert.ok(result[0].name, "Should have name");
    assert.ok(result[0].email, "Should have email");
  });
});`,
          },
        ],
      },
      {
        title: 'Module 10 Quiz — Fetch API',
        type: 'quiz',
        content: '<p>Test your Fetch API knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What does fetch() return?', type: 'multiple_choice', options: ['JSON data', 'A Promise', 'A string', 'An array'], correctOptionIndex: 1, explanation: 'fetch() returns a Promise that resolves to a Response object.' },
          { questionText: 'How do you convert a Response to JSON?', type: 'multiple_choice', options: ['response.toJSON()', 'response.json()', 'JSON.parse(response)', 'response.text()'], correctOptionIndex: 1, explanation: 'response.json() returns a Promise that resolves to the JSON data.' },
          { questionText: 'What does async/await do?', type: 'multiple_choice', options: ['Makes code synchronous', 'Makes asynchronous code look synchronous', 'Speeds up code', 'Disables errors'], correctOptionIndex: 1, explanation: 'async/await makes async code readable like synchronous code.' },
          { questionText: 'What is a free API for practicing?', type: 'multiple_choice', options: ['Google API', 'JSONPlaceholder', 'AWS API', 'Azure API'], correctOptionIndex: 1, explanation: 'JSONPlaceholder is a free fake API for testing and prototyping.' },
          { questionText: 'What does response.ok check?', type: 'multiple_choice', options: ['If the response is JSON', 'If the HTTP status is 200-299', 'If the response is empty', 'If the request succeeded'], correctOptionIndex: 1, explanation: 'response.ok is true when the HTTP status is in the 200-299 range.' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 11: Real Projects — Frontend Mentor & Clones
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 11: Real Projects — Build Like a Pro',
    description: 'Apply everything you learned by building real projects: Netflix clone, restaurant site, portfolio, and Frontend Mentor challenges.',
    learningOutcome: 'Build complete, responsive websites from scratch. Use GitHub for version control. Deploy to GitHub Pages.',
    hoursAllocated: 15,
    order: 11,
    lessons: [
      {
        title: 'Project 1: Netflix Clone Landing Page',
        type: 'challenge',
        isAssignment: true,
        requiredAssignment: true,
        assignmentDescription: `Build a Netflix-inspired landing page using only HTML & CSS.

Requirements:
1. Dark theme with red accent (#e50914)
2. Hero section with large background image, title, subtitle, and email signup form
3. Feature sections (at least 3) showing different device mockups
4. FAQ accordion (at least 4 questions)
5. Footer with links and legal text
6. Fully responsive (mobile-first)
7. Use semantic HTML elements
8. Use CSS Flexbox/Grid for layouts

Submission:
- Push to GitHub repository
- Submit repo link on Google Classroom
- Include a README.md with your name and description`,
        assignmentDeliverables: [
          'GitHub repository with all files',
          'index.html with valid HTML5',
          'style.css with responsive design',
          'README.md with project description',
          'At least 3 responsive breakpoints',
          'No external frameworks (vanilla CSS only)',
        ],
        githubClassroomLink: RESOURCES.githubClassroom,
        assignmentConfig: { timeLimit: 300, allowRetakes: false, mode: 'exercise', disableRightClick: false },
        duration: 120,
        resources: [
          { title: 'Netflix Clone Reference (GitHub)', url: RESOURCES.netflixClone, type: 'link' },
          { title: 'Frontend Mentor — Netflix Challenge', url: 'https://www.frontendmentor.io/challenges', type: 'link' },
        ],
      },
      {
        title: 'Project 2: Restaurant Website',
        type: 'challenge',
        isAssignment: true,
        requiredAssignment: true,
        assignmentDescription: `Build a responsive restaurant website with HTML, CSS, and JavaScript.

Requirements:
1. Navigation bar with logo and menu links
2. Hero section with restaurant name and tagline
3. Menu section with food items (cards with images, names, prices)
4. About section with restaurant story
5. Contact form with validation (name, email, message, date)
6. JavaScript: hamburger menu toggle for mobile
7. JavaScript: form validation with error messages
8. CSS animations on hover for menu cards
9. Fully responsive on all devices
10. Use CSS Grid or Flexbox for layout

Submission:
- Push to GitHub repository
- Submit repo link on Google Classroom`,
        assignmentDeliverables: [
          'GitHub repository with index.html, style.css, script.js',
          'Working hamburger menu toggle',
          'Working form validation',
          'Responsive design (3 breakpoints minimum)',
          'CSS hover animations on cards',
        ],
        githubClassroomLink: RESOURCES.githubClassroom,
        assignmentConfig: { timeLimit: 300, allowRetakes: false, mode: 'exercise', disableRightClick: false },
        duration: 120,
        resources: [
          { title: 'Restaurant Website References (GitHub)', url: RESOURCES.restaurantWebsite, type: 'link' },
          { title: 'HTML CSS Restaurant Project Tutorial', url: 'https://www.youtube.com/watch?v=4y-_3Ayiauw', type: 'link' },
        ],
      },
      {
        title: 'Project 3: Frontend Mentor Challenge',
        type: 'challenge',
        isAssignment: true,
        requiredAssignment: true,
        assignmentDescription: `Complete a Frontend Mentor challenge of your choice.

Steps:
1. Go to https://www.frontendmentor.io/challenges
2. Choose a FREE challenge (Beginner or Easy level)
3. Build it using HTML, CSS, and JavaScript
4. Match the design as closely as possible
5. Make it fully responsive

Recommended challenges for beginners:
- Product preview card component
- QR code component
- Profile card component
- Interactive rating component
- Recipe page

Submission:
- Push to GitHub repository
- Submit repo link on Google Classroom
- Include screenshot of the challenge design vs your result`,
        assignmentDeliverables: [
          'GitHub repository with completed challenge',
          'Pixel-perfect (or close) match to design',
          'Fully responsive',
          'README with challenge name and your approach',
        ],
        githubClassroomLink: RESOURCES.githubClassroom,
        assignmentConfig: { timeLimit: 300, allowRetakes: false, mode: 'exercise', disableRightClick: false },
        duration: 120,
        resources: [
          { title: 'Frontend Mentor Challenges', url: RESOURCES.frontendMentor, type: 'link' },
        ],
      },
      {
        title: 'Module 11 Quiz — Project Architecture',
        type: 'quiz',
        content: '<p>Test your project planning knowledge.</p>',
        duration: 15,
        quizQuestions: [
          { questionText: 'What is the correct file structure for a web project?', type: 'multiple_choice', options: ['All in one HTML file', 'Separate HTML, CSS, JS, images folders', 'Random files anywhere', 'Only CSS files'], correctOptionIndex: 1, explanation: 'Organizing into separate folders (css/, js/, images/) keeps projects maintainable.' },
          { questionText: 'What should you do before starting to code?', type: 'multiple_choice', options: ['Copy someone else\'s code', 'Plan the layout with wireframes', 'Skip HTML and start with CSS', 'Use a framework immediately'], correctOptionIndex: 1, explanation: 'Planning with wireframes helps you understand the structure before coding.' },
          { questionText: 'Why use GitHub for projects?', type: 'multiple_choice', options: ['It makes code run faster', 'Version control and backup', 'It\'s required by law', 'It compiles your code'], correctOptionIndex: 1, explanation: 'GitHub provides version control, backup, and collaboration features.' },
          { questionText: 'What is mobile-first design?', type: 'multiple_choice', options: ['Designing only for phones', 'Designing for mobile first, then scaling up', 'Using mobile apps', 'Ignoring desktop users'], correctOptionIndex: 1, explanation: 'Mobile-first means writing base CSS for small screens, then adding media queries for larger ones.' },
          { questionText: 'What is the benefit of semantic HTML in projects?', type: 'multiple_choice', options: ['Makes code shorter', 'Improves SEO and accessibility', 'Prevents bugs', 'Adds animations'], correctOptionIndex: 1, explanation: 'Semantic HTML improves SEO (search engines understand your content) and accessibility (screen readers).' },
        ],
        quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MODULE 12: Final Exam & Course Review
  // ═══════════════════════════════════════════════════════════
  {
    title: 'Module 12: Final Exam & Course Review',
    description: 'Comprehensive exam covering all topics: HTML, CSS, JavaScript, DOM, Events, Fetch API, and Responsive Design.',
    learningOutcome: 'Demonstrate mastery of all web development fundamentals covered in this course.',
    hoursAllocated: 5,
    order: 12,
    lessons: [
      {
        title: 'Course Review — Everything We Learned',
        type: 'article',
        content: `<h2>📚 Course Review — What You Learned</h2>
<p>Congratulations on making it this far! Here's everything you've mastered:</p>

<h3>HTML (Modules 1-2)</h3>
<ul>
  <li>✅ HTML elements, tags, attributes</li>
  <li>✅ Forms — inputs, selects, textareas, validation</li>
  <li>✅ Semantic HTML — header, nav, main, article, section, footer</li>
  <li>✅ Tables, lists, images, links</li>
  <li>✅ Accessibility basics (labels, alt text)</li>
</ul>

<h3>CSS (Modules 3-6)</h3>
<ul>
  <li>✅ Selectors, specificity, box model</li>
  <li>✅ Colors, backgrounds, typography</li>
  <li>✅ Flexbox — 1D layouts (navbar, card rows)</li>
  <li>✅ CSS Grid — 2D layouts (page layout, card grids)</li>
  <li>✅ Position — relative, absolute, fixed, sticky</li>
  <li>✅ Animations — transitions, transforms, keyframes</li>
  <li>✅ Responsive design — media queries, mobile-first</li>
</ul>

<h3>JavaScript (Modules 7-10)</h3>
<ul>
  <li>✅ Variables, data types, operators</li>
  <li>✅ Functions, conditionals, loops</li>
  <li>✅ Arrays and higher-order methods (map, filter, reduce)</li>
  <li>✅ DOM manipulation — select, create, modify, remove</li>
  <li>✅ Events — click, input, submit, keyboard</li>
  <li>✅ Form validation — regex, error messages</li>
  <li>✅ Fetch API — async/await, error handling</li>
  <li>✅ Displaying API data dynamically</li>
</ul>

<h3>Projects (Module 11)</h3>
<ul>
  <li>✅ Netflix clone landing page</li>
  <li>✅ Restaurant website with JS interactivity</li>
  <li>✅ Frontend Mentor challenge</li>
</ul>

<h3>🔗 Continue Learning</h3>
<ul>
  <li><a href="https://www.freecodecamp.org/" target="_blank">freeCodeCamp</a> — Free certifications</li>
  <li><a href="https://www.frontendmentor.io/" target="_blank">Frontend Mentor</a> — Real-world challenges</li>
  <li><a href="https://javascript.info/" target="_blank">JavaScript.info</a> — Advanced JS</li>
  <li><a href="https://react.dev/" target="_blank">React Documentation</a> — Next step: React</li>
  <li><a href="https://developer.mozilla.org/" target="_blank">MDN Web Docs</a> — The web encyclopedia</li>
</ul>`,
        duration: 20,
        resources: [
          { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org/', type: 'link' },
          { title: 'Frontend Mentor', url: RESOURCES.frontendMentor, type: 'link' },
          { title: 'JavaScript.info', url: 'https://javascript.info/', type: 'link' },
          { title: 'React Documentation', url: 'https://react.dev/', type: 'link' },
        ],
      },
      {
        title: 'Final Exam — Comprehensive Web Development Assessment',
        type: 'assignment',
        isAssignment: true,
        requiredAssignment: true,
        assignmentDescription: `FINAL EXAM: Build a Complete Personal Portfolio Website

This is your final assessment. Build a portfolio website that demonstrates ALL skills from this course.

REQUIREMENTS:

HTML (20 points):
- Valid HTML5 with DOCTYPE, viewport meta
- Semantic elements (header, nav, main, article, section, footer)
- Contact form with at least 5 different input types
- Proper use of headings hierarchy

CSS (40 points):
- CSS Grid or Flexbox layout
- Responsive design with at least 3 breakpoints
- Mobile-first approach
- CSS animations (at least 2 different types)
- Hover effects on interactive elements
- Box model usage (margins, padding, borders)
- Typography with at least 2 fonts

JavaScript (30 points):
- Form validation (name, email, message required)
- Toggle menu for mobile navigation
- Fetch data from a public API and display it (e.g., random quote, weather, or user data)
- Smooth scroll navigation
- At least one dynamic DOM manipulation

Submission:
- Push to GitHub repository
- Submit repo link on Google Classroom
- Include README.md with:
  - Your name
  - Description of your portfolio
  - What you learned
  - Challenges you faced`,
        assignmentDeliverables: [
          'GitHub repository with all files',
          'Responsive portfolio website',
          'Working form validation',
          'Working API fetch and display',
          'Mobile hamburger menu toggle',
          'CSS animations (minimum 2)',
          'README.md with project description',
        ],
        assignmentConfig: { timeLimit: 240, allowRetakes: false, mode: 'exam', disableRightClick: true },
        duration: 240,
        resources: [
          { title: 'Portfolio Inspiration (Frontend Mentor)', url: RESOURCES.frontendMentor, type: 'link' },
          { title: 'CodePen (for inspiration)', url: RESOURCES.codepen, type: 'link' },
        ],
        quizQuestions: [
          { questionText: 'What HTML element should wrap the main content of a page?', type: 'multiple_choice', options: ['&lt;div&gt;', '&lt;section&gt;', '&lt;main&gt;', '&lt;body&gt;'], correctOptionIndex: 2, explanation: '&lt;main&gt; wraps the main content (one per page).' },
          { questionText: 'What CSS property creates a grid layout?', type: 'multiple_choice', options: ['display: grid', 'layout: grid', 'grid: true', 'position: grid'], correctOptionIndex: 0, explanation: 'display: grid creates a grid container.' },
          { questionText: 'What does event.preventDefault() do in a form?', type: 'multiple_choice', options: ['Deletes the form', 'Stops default form submission', 'Clears all inputs', 'Hides the form'], correctOptionIndex: 1, explanation: 'preventDefault() stops the form from submitting to the server.' },
          { questionText: 'How do you make a website responsive?', type: 'multiple_choice', options: ['Use !important', 'Use media queries', 'Use inline styles', 'Use JavaScript only'], correctOptionIndex: 1, explanation: 'Media queries let you apply different styles at different screen widths.' },
          { questionText: 'What is the correct way to fetch data?', type: 'multiple_choice', options: ['fetch(url).json()', 'await fetch(url).json()', 'fetch(url).then(r => r.json())', 'get(url)'], correctOptionIndex: 2, explanation: 'You first fetch, then call .json() on the response to parse it.' },
          { questionText: 'Which CSS layout is best for 2D layouts?', type: 'multiple_choice', options: ['float', 'position', 'Flexbox', 'CSS Grid'], correctOptionIndex: 3, explanation: 'CSS Grid handles both rows and columns (2D) natively.' },
          { questionText: 'What does flex: 1 do?', type: 'multiple_choice', options: ['Sets width to 1px', 'Makes item grow to fill space', 'Sets order to 1', 'Makes item invisible'], correctOptionIndex: 1, explanation: 'flex: 1 is shorthand for flex-grow: 1, making the item grow.' },
          { questionText: 'How do you select an element by ID?', type: 'multiple_choice', options: ['querySelector(".id")', 'querySelector("#id")', 'getElement(".id")', 'select("#id")'], correctOptionIndex: 1, explanation: 'Use # prefix with querySelector to select by ID.' },
          { questionText: 'What is the box-sizing: border-box rule?', type: 'multiple_choice', options: ['Adds borders', 'Includes padding/border in element width', 'Removes padding', 'Centers the element'], correctOptionIndex: 1, explanation: 'border-box includes padding and border in the total width/height.' },
          { questionText: 'What does async/await do?', type: 'multiple_choice', options: ['Makes code run faster', 'Makes async code read like sync code', 'Disables errors', 'Loops forever'], correctOptionIndex: 1, explanation: 'async/await makes asynchronous code easier to read and write.' },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

const seedAdvancedWeb = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding Advanced Web Development Courses...\n');

    const db = mongoose.connection.db!;

    // Find admin user
    const admin = await db.collection('users').findOne({ email: 'admin@bootskills.com' }) as any;
    if (!admin) {
      throw new Error('admin@bootskills.com not found in database!');
    }
    console.log(`👤 Found admin: ${admin.email} (${admin._id})\n`);

    // ─── COURSE 1: Advanced Web Development Masterclass ───
    console.log('═'.repeat(60));
    console.log('📚 COURSE 1: Advanced Web Development — HTML, CSS & JavaScript Masterclass');
    console.log('═'.repeat(60));

    const course1Payload: any = {
      title: 'Advanced Web Development — HTML, CSS & JavaScript Masterclass',
      description: `<p>🎯 <strong>Complete Web Development Course</strong> — from zero to building real websites!</p>
<p>Learn <strong>HTML</strong> (structure), <strong>CSS</strong> (design & animations), and <strong>JavaScript</strong> (interactivity) with hands-on projects and challenges.</p>
<p>📚 <strong>12 modules</strong> | 💻 Code exercises | 📝 Quizzes | 🎯 Real projects (Netflix clone, restaurant site, portfolio)</p>
<p>🌍 Topics: HTML elements, forms, CSS box model, Flexbox, Grid, animations, transitions, responsive design, DOM manipulation, events, form validation, Fetch API, async/await.</p>
<p>🆓 <strong>100% Free</strong> | 📱 Works on all devices | 🏆 Certificate on completion</p>`,
      thumbnail: RESOURCES.heroWebDev,
      instructor: admin._id,
      createdBy: admin._id,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Web Development',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      isFeatured: true,
      passingScore: 70,
      modules: COURSE_1_MODULES,
    };

    const existing1 = await db.collection('courses').findOne({ title: course1Payload.title });
    if (existing1) {
      await db.collection('courses').updateOne(
        { _id: existing1._id },
        { $set: course1Payload }
      );
      console.log('✅ Updated Course 1');
    } else {
      await db.collection('courses').insertOne({
        ...course1Payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        studentsEnrolled: [],
        studentsEnrolledCount: 0,
        modulesCount: COURSE_1_MODULES.length,
        totalLessonsCount: COURSE_1_MODULES.reduce((sum: number, m: any) => sum + m.lessons.length, 0),
      });
      console.log('✅ Created Course 1');
    }

    // ─── COURSE 2: JavaScript Interactivity Mini-Challenge ───
    console.log('\n' + '═'.repeat(60));
    console.log('📚 COURSE 2: JavaScript Interactivity Mini-Challenge');
    console.log('═'.repeat(60));

    const course2Payload: any = {
      title: 'JavaScript Interactivity Mini-Challenge',
      description: `<p>⚡ <strong>JavaScript-focused course</strong> for building interactive web features.</p>
<p>Learn form validation, DOM manipulation, event handling, API fetching, and build real projects with GitHub Classroom.</p>
<p>📝 <strong>4 modules</strong> | 💻 Code exercises | 🎯 GitHub Classroom autograded assignments</p>
<p>🔗 Submit your work via GitHub repos and Google Classroom</p>
<p>🆓 <strong>100% Free</strong></p>`,
      thumbnail: RESOURCES.jsImage,
      instructor: admin._id,
      createdBy: admin._id,
      price: 0,
      discountPrice: 0,
      level: 'Intermediate',
      category: 'Web Development',
      status: 'published',
      submissionRequired: true,
      school: 'Bootskills Academy',
      isFeatured: true,
      passingScore: 70,
      githubClassroom: RESOURCES.githubClassroom,
      modules: COURSE_2_MODULES,
    };

    const existing2 = await db.collection('courses').findOne({ title: course2Payload.title });
    if (existing2) {
      await db.collection('courses').updateOne(
        { _id: existing2._id },
        { $set: course2Payload }
      );
      console.log('✅ Updated Course 2');
    } else {
      await db.collection('courses').insertOne({
        ...course2Payload,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        studentsEnrolled: [],
        studentsEnrolledCount: 0,
        modulesCount: COURSE_2_MODULES.length,
        totalLessonsCount: COURSE_2_MODULES.reduce((sum: number, m: any) => sum + m.lessons.length, 0),
      });
      console.log('✅ Created Course 2');
    }

    // ─── Enroll admin in both courses ───
    console.log('\n' + '═'.repeat(60));
    console.log('👤 Enrolling admin@bootskills.com in both courses');
    console.log('═'.repeat(60));

    const courses = await db.collection('courses').find({
      title: { $in: [course1Payload.title, course2Payload.title] }
    }).toArray();

    for (const course of courses) {
      // Add to course.studentsEnrolled
      const alreadyEnrolled = (course.studentsEnrolled || []).some((id: any) => id.toString() === admin._id.toString());
      if (!alreadyEnrolled) {
        await db.collection('courses').updateOne(
          { _id: course._id },
          { $addToSet: { studentsEnrolled: admin._id } }
        );
      }

      // Add to user.enrolledCourses
      const userAlreadyEnrolled = (admin.enrolledCourses || []).some((id: any) => id.toString() === course._id.toString());
      if (!userAlreadyEnrolled) {
        await db.collection('users').updateOne(
          { _id: admin._id },
          { $addToSet: { enrolledCourses: course._id } }
        );
      }

      // Initialize course progress
      await db.collection('courseprogresses').updateOne(
        { userId: admin._id, courseId: course._id },
        {
          $setOnInsert: {
            userId: admin._id,
            courseId: course._id,
            totalTimeSpent: 0,
            overallProgress: 0,
            status: 'active',
            lessons: [],
            createdAt: new Date(),
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      console.log(`✅ Enrolled admin in: ${course.title}`);
    }

    // ─── Stats ───
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FINAL STATS');
    console.log('═'.repeat(60));

    const finalCourses = await db.collection('courses').find({
      title: { $in: [course1Payload.title, course2Payload.title] }
    }).toArray();

    for (const c of finalCourses) {
      const fullCourse = await db.collection('courses').findOne({ _id: c._id }) as any;
      let totalLessons = 0;
      let totalQuizzes = 0;
      let totalExercises = 0;
      let totalAssignments = 0;
      
      for (const mod of (fullCourse?.modules || [])) {
        for (const les of (mod.lessons || [])) {
          totalLessons++;
          if (les.type === 'quiz') totalQuizzes++;
          if (les.isAssignment) totalAssignments++;
          if (les.codeExercises) totalExercises += les.codeExercises.length;
        }
      }

      console.log(`\n📚 ${fullCourse.title}`);
      console.log(`   💰 Price: ${fullCourse.price} RWF (FREE)`);
      console.log(`   📦 Modules: ${fullCourse.modules?.length || 0}`);
      console.log(`   📖 Lessons: ${totalLessons}`);
      console.log(`   📝 Quizzes: ${totalQuizzes}`);
      console.log(`   💻 Code Exercises: ${totalExercises}`);
      console.log(`   📋 Assignments: ${totalAssignments}`);
      console.log(`   👤 Instructor: admin@bootskills.com`);
    }

    console.log('\n🎉 Advanced Web Development courses seeded successfully!');
    console.log('🏁 Done!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAdvancedWeb();
