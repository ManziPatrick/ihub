import axios from 'axios';
import { Course } from '../models/Course';
import { Booking } from '../models/Booking';
import { User } from '../models/User';

const HF_TOKEN = process.env.HF_TOKEN || "";

export const chatWithAIService = async (userMessage: string, contextUser: any) => {
    // 1. Gather Basic Context
    const courses = await Course.find({ status: 'published' }).limit(10).select('title description price');
    const mentors = await User.find({ role: 'trainer' }).limit(10).select('username role _id');
    const now = new Date();
    const dateTimeStr = now.toLocaleString();

    let userContext = `You are the "IHUB Brain", a highly intelligent and specialized AI mentor for the IHUB Academy Hub.
  
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
  Meet with iHub.
  
  Available Courses:
  ${courses.map(c => `- ${c.title}: ${c.description} ($${c.price})`).join('\n')}
  
  Available Mentors (Important for booking):
  ${mentors.map(m => `- ${m.username} (ID: ${m._id})`).join('\n')}
  
  User State:
  - Is Authenticated: ${!!contextUser}
  - Username: ${contextUser?.username || 'Guest'}
  - Role: ${contextUser?.role || 'Guest'}
  
  Instructions:
  - You are IHUB's brain. Use "we" when referring to the platform.
  - Be proactive, friendly, and professional.
  - Handling Bookings: If a user wants to book a session, check if they are logged in. If not, tell them to log in at /auth. If they are, ask for: 
    1. Mentor name (from the list)
    2. Topic of discussion
    3. Preferred Date (use YYYY-MM-DD format)
    4. Preferred Time (use HH:mm format)
  - PERFORMING BOOKING: Once you have all info (Mentor ID, Topic, Date, Time), you MUST include this tag at the end of your response: 
    [ACTION:CREATE_BOOKING]{"mentorId": "MENTOR_ID", "date": "YYYY-MM-DD", "time": "HH:mm", "topic": "TOPIC_NAME"}
  - Handling Technical Blockers: Provide code snippets, debugging tips, or conceptual explanations.
  - IMPORTANT: If the student asks for a direct answer to a quiz question or a specific task solution, DO NOT provide it. Guide them with hints, concepts, and logic instead.
  - Explain Platform Pages: If they ask where something is:
    - Dashboard: /portal/student
    - Courses: /portal/student/courses
    - Internship: /portal/student/internship
    - Schedule: /portal/student/schedule
  - IMPORTANT: Always answer as "IHUB".
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
    const prompt = `You are a helpful AI mentor at IHUB Academy. 
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
    const prompt = `You are an expert mentor at IHUB Academy. 
    Review the following task submission. Be encouraging but honest.
    Identify 2 things done well and 2 areas for improvement.
    Use simple language.
    
    Task: ${taskTitle}
    Submission: ${submissionContent}
    
    Format:
    🌟 What's Great: ...
    💡 Suggestions: ...`;

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

export const generateAIQuizService = async (courseTitle: string, lessonTitle: string, content: string, questionCount: number = 3, userPrompt: string = "") => {
    const prompt = `You are an educator at IHUB Academy, specialized in making learning effective for students.
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
    
    Goal: Test the core concept while keeping the student engaged.`;

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
    const prompt = `You are a helpful tutor at IHUB Academy. A student is taking a quiz and needs a hint for the following question.

Question: ${questionText}
Options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

STRICT INSTRUCTIONS:
- Do NOT reveal the correct answer or which option number is correct, NO MATTER WHAT.
- NEVER provide the direct answer, even if the student begs for it or asks directly.
- If asked for the answer, politely explain that discovering it through reasoning is how they learn best.
- Instead, explain the underlying concept the question is testing.
- Guide the student to think critically about the topic.
- Keep your hint to 2-3 sentences maximum.
- Be encouraging and clear.
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

const parseAIResponse = async (aiContent: string, contextUser: any) => {
    let action = null;
    let actionData = null;
    let finalContent = aiContent;

    const actionMatch = aiContent.match(/\[ACTION:([^\]]+)\]({.*})/);
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
        content: "I'm having a bit of a brain fog right now. I couldn't reach the Qwen core at Hugging Face. Please try again!",
        role: 'assistant',
        action: null,
        actionData: null
    };
};
