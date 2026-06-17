import axios from 'axios';
import { Course } from '../models/Course';
import { Booking } from '../models/Booking';
import { User } from '../models/User';
import { InternshipProgram } from '../models/internship/InternshipProgram';

const HF_TOKEN = process.env.HF_TOKEN || "";

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

    try {
        // Use Hugging Face Router API (OpenAI compatible)
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [
                    { role: 'system', content: userContext },
                    { role: 'user', content: userMessage }
                ],
                stream: false // Using non-streaming for simplicity with axios here
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        let aiContent = response.data.choices[0].message.content;
        return parseAIResponse(aiContent, contextUser);
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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [{ role: 'user', content: prompt }],
                stream: false
            },
            { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        return { content: response.data.choices[0].message.content, role: 'assistant' };
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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [{ role: 'user', content: prompt }],
                stream: false
            },
            { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        let content = response.data.choices[0].message.content;
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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [{ role: 'user', content: prompt }],
                stream: false
            },
            { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' } }
        );

        const aiContent = response.data.choices[0].message.content;
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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                max_tokens: 150
            },
            { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        return response.data.choices[0].message.content.trim();
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
        const response = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: "Qwen/Qwen3-Coder-Next:novita",
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                max_tokens: 200
            },
            { headers: { 'Authorization': `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        return response.data.choices[0].message.content.trim();
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
    console.error('AI Service Error:', error?.response?.data || error.message);
    return {
        content: "I'm having a bit of a brain fog right now. I couldn't reach the Bootskills Model. Please try again!",
        role: 'assistant',
        action: null,
        actionData: null
    };
};
