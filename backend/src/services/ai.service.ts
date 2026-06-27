import { Course } from '../models/Course';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { InternshipProgram } from '../models/internship/InternshipProgram';
import { tryAIRouterInference } from './ai-router.service';

/**
 * Ollama configuration — tries local inference first (if enabled).
 * Set OLLAMA_BASE_URL to your Ollama server (default: http://localhost:11434).
 * Set OLLAMA_MODEL to your preferred local model (default: qwen2.5:3b).
 * Set OLLAMA_ENABLED=false to disable Ollama entirely.
 */
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED !== 'false';

// If Ollama fails, do NOT automatically fall back to paid cloud providers.
// Set OLLAMA_ONLY=true to use ONLY Ollama (no cloud providers).
const OLLAMA_ONLY = (process.env.OLLAMA_ONLY || '').toLowerCase() === 'true';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

/**
 * Calls a local Ollama model using its HTTP API.
 * Wraps the response to match the expected format used by the rest of the service.
 */
const tryOllamaInference = async (
  messages: { role: string; content: string }[],
  maxTokens: number = 1024
): Promise<{ choices: { message: { content: string } }[] }> => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000), // 120s timeout for local LLM (cold start can be slow)
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new Error(`Ollama (${OLLAMA_MODEL}): ${response.status} ${errorText}`);
  }

  const data = await response.json() as { message?: { content?: string } };

  if (!data.message?.content) {
    throw new Error('Ollama returned an empty response');
  }

  return {
    choices: [{
      message: {
        content: data.message.content,
      },
    }],
  };
};

/** Kinyarwanda-specific common word patterns for language detection */
const KINYARWANDA_PATTERNS = /\b(?:ni|na|no|mu|ku|bi|ba|ri|ya|zo|bo|yo|we|tu|bya|cya|gwa|kwa|mwe|nta|nka|mbi|rwa|shy|nyu|bye|bose|ari|aba|urya|ubu|irya|izi|kunda|igihe|umuntu|ikintu|amazi|inzu|ifoto|ubwoba|rwanda|kinyarwanda|ikinyarwanda|ibintu|abantu|ubuzima|amakuru|uburezi|ubuhanga|iterambere|ubukungu|ibidukikije|ubumenyi|ikoranabuhanga)\b/iu;

/**
 * Detects if text is likely Kinyarwanda based on common patterns
 */
const isKinyarwanda = (text: string): boolean => {
  if (!text || text.length < 3) return false;
  const cleaned = text.replace(/[\s.,!?;:()"'\-]+/g, ' ').trim();
  if (cleaned.length < 5) return false;
  const matches = cleaned.match(KINYARWANDA_PATTERNS);
  if (!matches) return false;
  // If enough characters/patterns match, consider it Kinyarwanda
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  const matchRatio = matches.length / words.length;
  // Require at least 25% word match OR at least one long Kinyarwanda word (>4 chars)
  const hasLongMatch = matches.some(m => m.length > 4);
  return matchRatio >= 0.25 || (matchRatio >= 0.15 && hasLongMatch);
};

/**
 * Attempts inference with Ollama first (if enabled), then falls back through
 * the AI Router (Gemini → Cloudflare → Groq → Cerebras).
 * Returns the first successful response, or throws if all providers fail.
 */
const tryInference = async (messages: { role: string; content: string }[], maxTokens: number = 1024) => {
  // ── OLLAMA_ONLY mode ──
  if (OLLAMA_ONLY) {
    if (OLLAMA_ENABLED) {
      return await tryOllamaInference(messages, maxTokens);
    }
    throw new Error('OLLAMA_ONLY=true but OLLAMA_ENABLED is false.');
  }

  // ── Try Ollama first (cheap, local, no API key needed) ──────────
  if (OLLAMA_ENABLED) {
    try {
      const result = await tryOllamaInference(messages, maxTokens);
      console.log(`✅ Ollama (${OLLAMA_MODEL}) responded successfully`);
      return result;
    } catch (error: any) {
      console.warn(`Ollama (${OLLAMA_MODEL}) at ${OLLAMA_BASE_URL} failed, falling back to cloud router:`, error?.message || error);
      // Fall through to the AI Router
    }
  }

  // ── AI Router: Gemini → Cloudflare → Groq → Cerebras ───────────
  try {
    const result = await tryAIRouterInference(messages, maxTokens);
    console.log(`✅ AI Router (${result.provider}) responded in ${result.latencyMs}ms`);
    return result;
  } catch (error: any) {
    console.error('AI Router all providers failed:', error?.message || error);
    throw error;
  }
};

/**
 * Fetches all published courses once and extracts:
 * - Category-grouped summary
 * - Popular/trending courses (top 8 by enrollment)
 * - Distinct category list
 * - Distinct school list
 * - Total count
 * Single DB query instead of 3 separate ones.
 */
const fetchAllCourseData = async () => {
  const courses = await Course.find({ status: 'published', isDeleted: { $ne: true } })
    .select('title description price discountPrice level category school isFeatured studentsEnrolled')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // --- By-category grouping ---
  const byCategory = new Map<string, any[]>();
  for (const c of courses) {
    const cat = c.category || 'General';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
  }

  let categoryLines: string[] = [];
  for (const [cat, catCourses] of byCategory) {
    categoryLines.push(`  **${cat}** (${catCourses.length} courses):`);
    for (const c of catCourses) {
      const priceStr = c.price === 0 ? 'Free' : `$${c.price}${c.discountPrice ? ` (was $${c.discountPrice})` : ''}`;
      const featuredMark = c.isFeatured ? ' ⭐ Featured' : '';
      categoryLines.push(`    - "${c.title}" — ${(c.description || '').substring(0, 100)} — ${priceStr} — Level: ${c.level || 'All'}${featuredMark}`);
    }
  }

  const featuredCourses = courses.filter(c => c.isFeatured);
  if (featuredCourses.length > 0) {
    categoryLines.unshift(`  **Featured Courses:**`);
    for (const c of featuredCourses) {
      categoryLines.push(`    - "${c.title}" — ${c.category} — ${c.level || 'All'} — ${c.price === 0 ? 'Free' : `$${c.price}`}`);
    }
    categoryLines.push('');
  }

  // --- Popular courses (top 8 by enrollment) ---
  const sortedByEnrollment = [...courses].sort((a: any, b: any) => {
    const aCount = (a.studentsEnrolled as any[])?.length || 0;
    const bCount = (b.studentsEnrolled as any[])?.length || 0;
    return bCount - aCount;
  });

  const topPopular = sortedByEnrollment.slice(0, 8);
  let popularLines: string[] = [];
  if (topPopular.length > 0) {
    popularLines.push('🔥 **Most Popular Courses** (top by enrollment):');
    for (const c of topPopular) {
      const enrollCount = (c.studentsEnrolled as any[])?.length || 0;
      const priceStr = c.price === 0 ? 'Free' : `$${c.price}${c.discountPrice ? ` (was $${c.discountPrice})` : ''}`;
      const popularityBadge = enrollCount >= 10 ? ' 🔥 Hot' : '';
      const featuredMark = c.isFeatured ? ' ⭐ Featured' : '';
      popularLines.push(`  - "${c.title}" — ${c.category} — ${c.level || 'All'} — ${priceStr} — ${enrollCount} enrolled${popularityBadge}${featuredMark}`);
    }
    popularLines.push('');
  }

  // --- Distinct lists ---
  const categorySet = new Set<string>();
  const schoolSet = new Set<string>();
  for (const c of courses) {
    if (c.category) categorySet.add(c.category);
    if (c.school) schoolSet.add(c.school);
  }

  return {
    byCategory: categoryLines.join('\n'),
    totalCount: courses.length,
    popularCourses: popularLines.join('\n'),
    categoryList: Array.from(categorySet),
    schoolList: Array.from(schoolSet),
  };
};

/**
 * Builds a summary of active internship programs
 */
const buildInternshipSummary = async (): Promise<string> => {
  const programs = await InternshipProgram.find({ status: 'active', isDeleted: false })
    .select('title description duration price currency startDate applicationDeadline eligibility')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  if (programs.length === 0) return 'No active internship programs at the moment.';

  return programs.map(p => {
    const priceStr = p.price && p.price > 0 ? `${p.currency || 'RWF'} ${p.price.toLocaleString()}` : 'Free';
    const deadline = p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : 'Rolling';
    return `  - "${p.title}" — ${p.description?.substring(0, 120) || ''} — ${p.duration} — ${priceStr} — Apply by: ${deadline}`;
  }).join('\n');
};

/**
 * Builds a mentor summary for booking
 */
const buildMentorSummary = async (): Promise<string> => {
  const mentors = await User.find({ role: 'trainer', isDeleted: { $ne: true } })
    .select('username fullName title _id')
    .limit(20)
    .lean();

  if (mentors.length === 0) return 'No mentors available at the moment.';

  return mentors.map(m => {
    const name = m.fullName || m.username;
    return `  - ${name}${m.title ? ` (${m.title})` : ''} — ID: ${m._id}`;
  }).join('\n');
};

/**
 * Generates a dynamic welcome/greeting message with real course and program data.
 * No AI call — purely server-side formatting for speed and reliability.
 */
export const getChatGreeting = async (contextUser: any): Promise<{ content: string; role: string; action?: string; actionData?: string }> => {
  const [courseData, internshipSummary, mentorSummary] = await Promise.all([
    fetchAllCourseData(),
    buildInternshipSummary(),
    buildMentorSummary(),
  ]);

  const isGuest = !contextUser;
  const role = contextUser?.role || 'guest';
  const userName = contextUser?.fullName || contextUser?.username || 'there';

  // Build role-specific greeting
  let roleSection = '';
  let quickLinks: { path: string; label: string }[] = [];

  switch (role) {
    case 'student':
      roleSection = `As a **student**, you can:\n- 📚 Browse & enroll in courses → /portal/student/courses\n- 📊 Track your progress → /portal/student\n- 📅 View your schedule → /portal/student/schedule\n- 🎓 Apply for internships → /portal/student/internship\n- ✅ Manage your tasks → /portal/student/my-tasks\n- 🏆 View your certificates → /portal/student/certificates`;
      quickLinks = [
        { path: '/portal/student/courses', label: 'Browse Courses' },
        { path: '/portal/student', label: 'Dashboard' },
        { path: '/portal/student/internship', label: 'Internships' },
      ];
      break;
    case 'client':
      roleSection = `As a **client**, you can:\n-  View your project applications → /portal/client/applications\n- 🖥️ Access your workspace → /portal/client/workspace\n- 💬 Submit feedback → /portal/client/feedback`;
      quickLinks = [
        { path: '/portal/client/applications', label: 'My Applications' },
        { path: '/portal/client/workspace', label: 'Workspace' },
      ];
      break;
    case 'trainer':
      roleSection = `As a **trainer**, you can:\n- 📚 Manage your courses → /portal/trainer/courses\n- 👨‍🏫 View your students → /portal/trainer/students\n- 📝 Review assignments → /portal/trainer/assignments\n- 📅 Manage schedule → /portal/trainer/schedule\n- 🤝 Mentorship dashboard → /portal/trainer/mentorship`;
      quickLinks = [
        { path: '/portal/trainer/courses', label: 'My Courses' },
        { path: '/portal/trainer/students', label: 'Students' },
        { path: '/portal/trainer/schedule', label: 'Schedule' },
      ];
      break;
    case 'admin':
      roleSection = `As an **admin**, you can:\n- 👥 Manage users → /portal/admin/users\n- 📚 Manage courses → /portal/admin/courses\n- 💰 View payments → /portal/admin/payments\n- 📊 Analytics → /portal/admin/analytics\n- 🏆 Badges → /portal/admin/badges`;
      quickLinks = [
        { path: '/portal/admin/dashboard', label: 'Dashboard' },
        { path: '/portal/admin/users', label: 'Users' },
        { path: '/portal/admin/payments', label: 'Payments' },
      ];
      break;
    default:
      roleSection = `You can:\n- 🔍 **Explore our courses** → /courses\n- 🎓 Apply for **internship programs** → /internships\n- 📖 Read our **blog** → /blog\n- 📞 **Contact us** → /contact\n- 🔑 **Sign in** to access your personalized dashboard → /auth`;
      quickLinks = [
        { path: '/explore', label: 'Explore Courses' },
        { path: '/', label: 'Internship Programs' },
        { path: '/auth', label: 'Sign In' },
      ];
  }

  // Build popular courses highlight section
  let popularSection = '';
  if (courseData.popularCourses) {
    popularSection = `\n\n${courseData.popularCourses}`;
  }

  // Build course recommendations section
  let recommendationsSection = '';
  if (courseData.totalCount > 0) {
    const cats = courseData.categoryList.length > 0 ? courseData.categoryList.join(', ') : 'Various';
    const schools = courseData.schoolList.length > 0 ? courseData.schoolList.join(', ') : 'IHUB ACADEMY';
    recommendationsSection = `\n\n📚 **All Available Courses (${courseData.totalCount} total)**

${courseData.byCategory}

Categories: ${cats}
Schools: ${schools}

👉 Browse all courses: /courses (or /portal/student/courses if you're a student)`;
  }

  // Build internship section
  let internshipSection = '';
  if (internshipSummary && !internshipSummary.startsWith('No active')) {
    internshipSection = `\n\n🎓 **Active Internship Programs**

${internshipSummary}

👉 Apply now: /internships`;
  }

  const greeting = [
    `Hello${isGuest ? '' : `, ${userName}`}! 👋 Welcome to **Bootskills Academy Hub** — your gateway to professional growth!`,
    '',
    roleSection,
    popularSection,
    recommendationsSection,
    internshipSection,
    '',
    `💡 **Need help with something specific?** Here's what I can do:`,
    `- **Recommend a course** — Just tell me what you want to learn!`,
    `- **Explain a concept** — Stuck on something? I'll break it down.`,
    `- **Book a mentorship** — Connect with our expert mentors.`,
    `- **Guide you around** — Not sure where to go? I'll point you there.`,
    `- **Check your progress** — Already enrolled? I can help you track it.`,
    '',
    `_Just let me know what you'd like to do!_ 🚀`,
  ].join('\n');

  const linksActionData = JSON.stringify({ links: quickLinks });

  return {
    content: greeting,
    role: 'assistant',
    action: 'LINKS',
    actionData: linksActionData,
  };
};

export const chatWithAIService = async (userMessage: string, contextUser: any) => {
    // 1. Gather comprehensive context
    const [courseData, internshipSummary, mentorSummary] = await Promise.all([
      fetchAllCourseData(),
      buildInternshipSummary(),
      buildMentorSummary(),
    ]);
    const now = new Date();
    const dateTimeStr = now.toLocaleString();

    const role = contextUser?.role || 'guest';
    const userName = contextUser?.fullName || contextUser?.username || 'Guest';

    // Build role-specific navigation context
    let roleNavContext = '';
    const commonNav = `
    - Browse all courses: /courses (public) or /portal/student/courses (student portal)
    - Internship programs: /internships
    - Blog: /blog
    - Contact: /contact`;

    switch (role) {
      case 'student':
        roleNavContext = `Student-specific routes: Dashboard /portal/student, Courses /portal/student/courses, Course Detail /portal/student/courses/:courseId, Internship /portal/student/internship, Schedule /portal/student/schedule, Billing /portal/student/billing, Tasks /portal/student/my-tasks, Certificates /portal/student/certificates, Profile /portal/student/profile`;
        break;
      case 'client':
        roleNavContext = `Client-specific routes: Dashboard /portal/client, Applications /portal/client/applications, Workspace /portal/client/workspace, Feedback /portal/client/feedback`;
        break;
      case 'trainer':
        roleNavContext = `Trainer-specific routes: Dashboard /portal/trainer, Students /portal/trainer/students, Courses /portal/trainer/courses, Assignments /portal/trainer/assignments, Schedule /portal/trainer/schedule, Mentorship /portal/trainer/mentorship, Internships /portal/trainer/internships, Projects /portal/trainer/projects`;
        break;
      case 'admin':
        roleNavContext = `Admin-specific routes: Dashboard /portal/admin, Users /portal/admin/users, Courses /portal/admin/courses, Applications /portal/admin/applications, Internships /portal/admin/internships, Schedule /portal/admin/schedule, Projects /portal/admin/projects, Payments /portal/admin/payments, Badges /portal/admin/badges, Analytics /portal/admin/analytics, Blogs /portal/admin/blogs`;
        break;
      default:
        roleNavContext = `Public routes: Explore courses /courses, Internships /internships, About /about, Blog /blog, Contact /contact, Sign in /auth`;
    }

    const userContext = `You are the "Bootskills Brain", a highly intelligent and specialized AI mentor for Bootskills Academy Hub.
  
  Your personality:
  - Human-centric, encouraging, and clear.
  - You explain complex engineering/design concepts using relatable analogies.
  - You are proactive: if a student asks about a task, you don't just explain it; you suggest a first step.
  
  Departmental Specialization:
  - If the context relates to Graphics/Design: Focus on aesthetics, UX, and color theory.
  - If the context relates to Software Engineering: Focus on clean code, scalability, and error handling.
  - If the context relates to Marketing: Focus on growth hacking, storytelling, and conversion.
  
  Current Date & Time: ${dateTimeStr}

  What we do:
  Bootskills is an online learning platform offering professional courses, mentorship sessions, and internship programs.
  
  --- POPULAR COURSES (Top enrolled) ---
${courseData.popularCourses}
  
  --- AVAILABLE COURSES (${courseData.totalCount} total) ---
${courseData.byCategory}

Categories available: ${courseData.categoryList.length > 0 ? courseData.categoryList.join(', ') : 'Various'}
Schools: ${courseData.schoolList.length > 0 ? courseData.schoolList.join(', ') : 'IHUB ACADEMY'}

  --- ACTIVE INTERNSHIP PROGRAMS ---
${internshipSummary}
  
  --- AVAILABLE MENTORS (For booking) ---
${mentorSummary}
  
  User State:
  - Is Authenticated: ${!!contextUser}
  - Username: ${userName}
  - Role: ${role}
  
  Instructions:
  - You are Bootskills's brain. Use "we" when referring to the platform.
  - Tone: Professional, helpful, and concise. 
  - EMOJI POLICY: Use no more than 2-3 emojis in total per response. Avoid excessive icons.
  - STRUCTURE: Use bullet points, numbered lists, and clear paragraph breaks to make your response easy to read.
  
  - Handling Bookings: If a user wants to book a session, check if they are logged in. If not, tell them to log in at /auth. If they are, ask for: 
    1. Mentor name (from the list)
    2. Topic of discussion
    3. Preferred Date (use YYYY-MM-DD format)
    4. Preferred Time (use HH:mm format)
  - PERFORMING BOOKING: Once you have all info (Mentor ID, Topic, Date, Time), you MUST include this tag at the end of your response: 
    [ACTION:CREATE_BOOKING]{"mentorId": "MENTOR_ID", "date": "YYYY-MM-DD", "time": "HH:mm", "topic": "TOPIC_NAME"}
  
  - Handling Technical Blockers: Provide code snippets, debugging tips, or conceptual explanations.
  - NO SPOILERS: If the student asks for a direct answer to a quiz question or a specific task solution, you MUST NOT provide it. Guide them with hints, concepts, and logic instead. If they persist, remind them that finding the answer independently is critical for their learning.
  
  - RECOMMENDING COURSES: When recommending courses, always provide a real course from the list above, and suggest the link to enroll. Use the LINKS action for multiple recommendations.
  
  - Explain Platform Pages: If they ask where something is, respond with the correct portal route for their role.
  
  Navigation routes:
${roleNavContext}
${commonNav}

  - When the user asks what they can do (or asks "what should I click next / where do I go"), you MUST provide clickable navigation by adding ONE of these tags at the very end of your response.

  - NAVIGATION LINKS (IMPORTANT):
    If the user asks you to "go to", "open", "navigate", "where do I find", or clearly wants a page to click, you MUST add ONE of these tags at the very end of your response (after the last sentence).

    Option A (single destination):
    [ACTION:NAVIGATE]{"path":"/some/route","label":"Button label"}

    Option B (multiple destinations):
    [ACTION:LINKS]{"links":[{"path":"/some/route","label":"Courses"},{"path":"https://example.com","label":"External"}]}

    - Use internal SPA paths starting with / when possible.
    - Use https:// links as external if needed.
    - Keep label short and user-friendly.

  - IMPORTANT: Always answer as "Bootskills".
  `;

    // Detect if the user is writing in Kinyarwanda
    const userIsKinyarwanda = isKinyarwanda(userMessage);
    const languageInstruction = userIsKinyarwanda
      ? `\n\nIMPORTANT LANGUAGE INSTRUCTION: The user is writing in **Kinyarwanda** (Rwandan language). You MUST respond in Kinyarwanda. Use proper Kinyarwanda grammar and vocabulary. If you need to use technical terms that don't exist in Kinyarwanda, keep them in English but explain in Kinyarwanda.`
      : '';

    const systemPrompt = userContext + languageInstruction;

    try {
        const chatCompletion = await tryInference([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ], 2048);

        const aiContent = chatCompletion.choices[0].message.content;
        return parseAIResponse(aiContent || '', contextUser);
    } catch (error: any) {
        return handleAIError(error);
    }
};

export const explainTaskService = async (taskTitle: string, description: string) => {
    const prompt = `You are a helpful AI mentor at Bootskills Academy. 
    Explain the following task in simple, clear words.
    
    Task: ${taskTitle}
    Details: ${description}
    
    CRITICAL INSTRUCTIONS:
    - Focus on explaining the "Why" and "What" of the requirements.
    - Break down complex concepts into simple steps.
    - Suggest a first step to get started.
    - NEVER provide the actual solution, code snippets, final designs, or answers.
    - If asked for the answer, politely explain that you are here to coach them through the process so they can learn, not to do the work for them.
    
    Goal: Make the student feel confident and clear on how to approach the task independently.`;

    try {
        const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 1024);
        return { content: chatCompletion.choices[0].message.content || '', role: 'assistant' };
    } catch (error: any) {
        return handleAIError(error);
    }
};

export const reviewSubmissionService = async (taskTitle: string, submissionContent: string) => {
    const prompt = `You are an expert mentor at Bootskills Academy. 
    Review the following task submission. Be encouraging but honest.
    Identify 2 things done well and 2 areas for improvement.
    Assign a preliminary score out of 100 based on quality.
    Use simple language.
    
    Task: ${taskTitle}
    Submission: ${submissionContent}
    
    Format:
    🌟 What's Great: ...
    💡 Suggestions: ...
    
    [SCORE: XX] (Include this at the end)`;

    try {
        const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 1024);
        let content = chatCompletion.choices[0].message.content || '';
        let score = 0;
        const scoreMatch = content.match(/\[SCORE:\s*(\d+)\]/);
        if (scoreMatch) {
            score = parseInt(scoreMatch[1]);
            content = content.replace(scoreMatch[0], '').trim();
        }
        return { content, score, role: 'assistant' };
    } catch (error: any) {
        const err = handleAIError(error);
        return { ...err, score: 0 };
    }
};

/**
 * Batch reviews multiple open-ended answers in a single AI request.
 * Accepts an array of { questionText, answerText, maxScore } and returns
 * an array of { questionText, answerText, score, feedback }.
 * This is more efficient than calling the AI once per question.
 */
export const batchReviewOpenQuestionsService = async (
  questions: Array<{ questionText: string; answerText: string; maxScore: number }>
): Promise<Array<{ questionText: string; answerText: string; score: number; feedback: string }>> => {
  if (questions.length === 0) return [];

  const questionsBlock = questions.map((q, i) => {
    return `Question ${i + 1}: ${q.questionText}
Student Answer ${i + 1}: ${q.answerText}
Max Points: ${q.maxScore}`;
  }).join('\n\n---\n\n');

  const prompt = `You are an expert mentor at Bootskills Academy. Review ALL of the following open-ended student answers in one go.

For each answer, provide:
1. A score out of the max points
2. Brief constructive feedback (1-2 sentences)

${questionsBlock}

Return ONLY a valid JSON array with one object per question. No markdown, no extra text.
Format:
[
  {
    "questionIndex": 0,
    "score": 8,
    "feedback": "Good analysis but missing key detail about X."
  },
  ...
]`;

  try {
    const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 2048);
    const aiContent = chatCompletion.choices[0].message.content || '';
    // Extract JSON array from the response
    const jsonMatch = aiContent.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (!jsonMatch) {
      // Fallback: score each individually
      console.warn('Batch AI grading: Could not parse JSON response, falling back to individual scoring');
      return await Promise.all(questions.map(async (q) => {
        const result = await reviewSubmissionService(q.questionText, q.answerText);
        return {
          questionText: q.questionText,
          answerText: q.answerText,
          score: Math.round((result.score / 100) * q.maxScore),
          feedback: result.content
        };
      }));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return questions.map((q, i) => {
      const aiResult = parsed.find((r: any) => r.questionIndex === i);
      if (aiResult) {
        return {
          questionText: q.questionText,
          answerText: q.answerText,
          score: Math.min(aiResult.score, q.maxScore),
          feedback: aiResult.feedback || 'Reviewed by AI.'
        };
      }
      return {
        questionText: q.questionText,
        answerText: q.answerText,
        score: 0,
        feedback: 'AI grading unavailable for this question.'
      };
    });
  } catch (error: any) {
    console.error('Batch AI Grading Error:', error);
    // Fallback: score each individually
    return await Promise.all(questions.map(async (q) => {
      const result = await reviewSubmissionService(q.questionText, q.answerText);
      return {
        questionText: q.questionText,
        answerText: q.answerText,
        score: Math.round((result.score / 100) * q.maxScore),
        feedback: result.content
      };
    }));
  }
};

export const generateAIQuizService = async (courseTitle: string, lessonTitle: string, content: string, questionCount: number = 3, userPrompt: string = "") => {
    const prompt = `You are an educator at Bootskills Academy, specialized in making learning effective for students.
    Generate a ${questionCount}-question quiz for the following lesson.
    
    Course: ${courseTitle}
    Lesson: ${lessonTitle}
    Content Context: ${content}
    ${userPrompt ? `SPECIFIC FOCUS POINTS FROM TRAINER: ${userPrompt}` : ""}
    
    STRICT INSTRUCTIONS:
    1. Tone: Professional, encouraging, and clear. DO NOT use emojis.
    2. Format: Return ONLY a valid JSON array of objects.
    3. Object Structure:
       {
         "questionText": "...",
         "options": ["...", "...", "...", "..."],
         "correctOptionIndex": 0,
         "explanation": "..."
       }
    4. Explanation: The explanation must be clear and directly explain why the option is correct.
    5. LANGUAGE: You MUST detect the language of the "Content Context" provided above and generate the entire quiz (questionText, options, and explanation) in that same language. If the lesson is in French, generate the quiz in French. If it is in English, use English. Never mix languages or explain a foreign language concept in English unless explicitly asked.
    
    Goal: Test the core concept while keeping the student engaged in their primary learning language.`;

    try {
        const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 2048);

        const aiContent = chatCompletion.choices[0].message.content || '';
        // Extract JSON if AI wrapped it in markdown
        const jsonMatch = aiContent.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(aiContent);
    } catch (error: any) {
        console.error('AI Quiz Generation Error:', error);
        return [];
    }
};

export const hintForQuestionService = async (questionText: string, options: string[]) => {
    const prompt = `You are a helpful tutor at Bootskills Academy. A student is taking a quiz and needs a hint for the following question.

Question: ${questionText}
Options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

STRICT INSTRUCTIONS:
- Do NOT reveal the correct answer or which option number is correct under any circumstances.
- NEVER provide the direct answer, even if the student asks for it or is stuck.
- EMOJI POLICY: Use at most 1 emoji in your hint.
- STRUCTURE: Use simple, clear language. Use a bullet point if explaining multiple steps.
- Instead, explain the underlying concept the question is testing.
- Guide the student to think critically about the topic.
- Keep your hint to 2-3 sentences maximum.
- Be encouraging but professional.
- Suggest what concept or keyword to focus on when thinking about the answer.

Your hint:`;

    try {
        const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 150);
        return (chatCompletion.choices[0].message.content || '').trim();
    } catch (error: any) {
        console.error('Hint Generation Error:', error);
        return "Think about the core concept this question is testing. Review the key terms in the question and consider what each option implies.";
    }
};

export const generateQuestionExplanationService = async (questionText: string, options: string[], correctOptionIndex: number) => {
    const prompt = `You are an expert educator at Bootskills Academy. 
    Provide a concise, clear, and professional explanation for why the following answer is correct.

    Question: ${questionText}
    Options:
    ${options.map((opt, i) => `${i + 1}. ${opt} ${i === correctOptionIndex ? '(Correct Answer)' : ''}`).join('\n')}

    STRICT INSTRUCTIONS:
    - Focus on the logic and concept behind the correct answer.
    - Keep it to 1-2 sentences.
    - Professional tone.
    - No emojis.
    - Do not say "The correct answer is...", instead explain why it's correct.

    Explanation:`;

    try {
        const chatCompletion = await tryInference([{ role: 'user', content: prompt }], 200);
        return (chatCompletion.choices[0].message.content || '').trim();
    } catch (error: any) {
        console.error('Explanation Generation Error:', error);
        return "The selected option is correct based on the principles discussed in the lesson content.";
    }
};

const parseAIResponse = async (aiContent: string, contextUser: any) => {
    let action = null;
    let actionData = null;
    let finalContent = aiContent;

    const actionMatch = aiContent.match(/\[ACTION:([^\]]+)\]\s*({[\s\S]*?})\s*\]/);
    if (actionMatch) {
        action = actionMatch[1];
        actionData = actionMatch[2];
        finalContent = aiContent.replace(actionMatch[0], '').trim();

        if (action === 'CREATE_BOOKING' && contextUser) {
            try {
                const data = JSON.parse(actionData);
                const newBooking = new Booking({
                    userId: contextUser.id,
                    mentorId: data.mentorId,
                    type: 'Mentorship Session',
                    date: data.date,
                    time: data.time,
                    topic: data.topic,
                    status: 'pending'
                });
                await newBooking.save();
                finalContent += "\n\n(System Message: I have successfully created your booking request for " + data.date + " at " + data.time + ". You can view it in your schedule.)";
            } catch (err) {
                console.error("Action Execution Error:", err);
            }
        }
    }

    return { content: finalContent, role: 'assistant', action, actionData };
};

const handleAIError = (error: any) => {
    console.error('AI Service Error:', error?.message || error);
    return {
        content: "I'm having a bit of a brain fog right now. I couldn't reach the Bootskills Model. Please try again!",
        role: 'assistant',
        action: null,
        actionData: null
    };
};
