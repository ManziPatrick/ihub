import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

const MONGO_URI = 'mongodb+srv://alain:Password123@alain0.fwqgt9m.mongodb.net/ihub_db?retryWrites=true&w=majority';

const seedPublicSpeakingCourse = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if course already exists
    const existing = await Course.findOne({ title: 'Complete Public Speaking Mastery' });
    if (existing) {
      console.log('⚠️  Course already exists. Skipping insert.');
      process.exit(0);
    }

    // Find a trainer or admin to be the instructor
    let instructor = await User.findOne({ role: { $in: ['trainer', 'admin', 'super_admin'] } });
    if (!instructor) {
      console.error('❌ No trainer/admin user found in the database.');
      process.exit(1);
    }

    const courseData = {
      title: 'Complete Public Speaking Mastery',
      description: '<p>Master the art of public speaking from foundation to advanced delivery. Learn to structure powerful speeches, manage nervousness, use your voice and body effectively, handle Q&A sessions, and present with confidence in any setting — meetings, conferences, or virtual calls.</p>',
      thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/public_speaking_mastery.webp',
      instructor: instructor._id,
      createdBy: instructor._id,
      price: 0,
      discountPrice: 0,
      level: 'Beginner',
      category: 'Communication',
      status: 'published',
      enrollmentMode: 'direct',
      studentsEnrolled: [],
      modules: [
        // ─────────────────────────────────────────────────────
        // MODULE 1
        // ─────────────────────────────────────────────────────
        {
          title: 'Module 1: Foundation of Public Speaking',
          description: 'Understand what public speaking really is, why it matters, and how to analyze your audience before you say a word.',
          lessons: [
            {
              title: 'What is Public Speaking?',
              content: '<p><strong>Public speaking</strong> is any time you speak to a group of people with a clear purpose. It includes team meetings, project updates, client presentations, conference talks, and even speaking up in a group discussion. Many people fear public speaking more than death — but with the right techniques, anyone can become a confident speaker.</p><p>📸 <strong>Screenshot to include:</strong> A professional speaker on stage with an engaged audience — labeled \'Good posture, eye contact, open gestures\'.</p><p>🎥 <strong>Watch this video:</strong> \'The surprising secret to speaking with confidence\' (11 minutes)</p><p><strong>Key takeaway:</strong> Nervousness is normal. Even world-class speakers feel it. The difference is they have learned to channel that energy into their presentation rather than letting it control them.</p>',
              videoUrl: 'https://www.youtube.com/watch?v=8IhwQmBpE7k',
              duration: 15,
              type: 'video',
              resources: [
                { title: "TED's Official Public Speaking Guide (Free PDF)", url: 'https://www.ted.com/about/programs-initiatives/ted-masterclass', type: 'link' },
                { title: 'Download: Speaking Confidence Self-Assessment', url: 'https://example.com/confidence-assessment.pdf', type: 'pdf' }
              ],
              isAssignment: false,
              quizQuestions: [
                { questionText: 'Which of these counts as public speaking?', type: 'multiple_choice', options: ['Giving a presentation to 5 colleagues', 'Speaking at a conference', 'Updating your team in a meeting', 'All of the above'], correctOptionIndex: 3, explanation: 'Public speaking includes any situation where you speak to a group with purpose — from small meetings to large conferences.' },
                { questionText: 'Do professional speakers ever feel nervous?', type: 'multiple_choice', options: ['Never — they are born confident', 'Only in their first year', 'Yes, almost all speakers feel some nervousness', 'Only if the audience is large'], correctOptionIndex: 2, explanation: 'Even the most experienced speakers feel nervous. They have learned to manage it, not eliminate it.' },
                { questionText: 'What is the most common fear reported in surveys?', type: 'multiple_choice', options: ['Heights', 'Spiders', 'Public speaking', 'Flying'], correctOptionIndex: 2, explanation: 'Many studies show public speaking is the #1 fear — even ahead of death in some surveys.' }
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 3 }
            },
            {
              title: 'Understanding Your Audience',
              content: '<p>Before you prepare a single word, ask yourself three critical questions about your audience:</p><ul><li><strong>Who is listening?</strong> (Managers? Colleagues? Clients? The public?)</li><li><strong>What do they already know?</strong> (Are they experts or beginners?)</li><li><strong>What do they need from me?</strong> (Information? Decision? Inspiration? Action?)</li></ul><p>A message for your CEO is different from a message for your team. A technical presentation for engineers is different from an update for non-technical stakeholders. Tailor your content, language, and examples to the people in front of you.</p><p>📸 <strong>Screenshot to include:</strong> An audience analysis worksheet filled out for a quarterly business review meeting.</p><p>🎥 <strong>Watch this video:</strong> \'How to analyze any audience in 3 minutes\' (8 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=ll5iLQFVfg0',
              duration: 12,
              type: 'video',
              resources: [
                { title: 'Audience Analysis Template (Google Docs)', url: 'https://docs.google.com/document/d/1example', type: 'link' },
                { title: 'Download: Printable Audience Worksheet', url: 'https://example.com/audience-worksheet.pdf', type: 'pdf' }
              ],
              isAssignment: true,
              requiredAssignment: true,
              assignmentDescription: 'Complete an audience analysis for a real upcoming presentation or meeting. Identify who, what they know, and what they need.',
              assignmentDeliverables: ['Audience analysis document (Word, PDF, or Google Doc link)'],
              quizQuestions: [
                { questionText: 'What is the first question you should ask before preparing a speech?', type: 'multiple_choice', options: ['What slides should I use?', 'Who is my audience and what do they need?', 'How long should I speak?', 'What color shirt should I wear?'], correctOptionIndex: 1, explanation: 'Understanding your audience comes before everything else.' },
                { questionText: 'Why should you tailor your speech to your audience?', type: 'multiple_choice', options: ['Because different audiences have different knowledge and needs', 'Because all audiences are the same', 'Because it takes less time', 'Because it\'s required by law'], correctOptionIndex: 0, explanation: 'A CEO needs high-level strategy. A technical team needs details. Tailoring ensures your message lands.' }
              ]
            },
            {
              title: 'Choosing a Single Core Message',
              content: '<p>Great speakers focus on <strong>one main idea</strong> per speech. If your audience remembers only one thing after you finish speaking, what should it be? Write that as a single sentence. Then build your entire talk around that sentence. Every story, statistic, and example should support your core message. When you try to say too many things, you say nothing clearly.</p><p>📸 <strong>Screenshot to include:</strong> A diagram showing a central circle labeled \'Core Message\' with three supporting branches labeled \'Point 1\', \'Point 2\', \'Point 3\'.</p><p>🎥 <strong>Watch this video:</strong> \'Find your core message in 5 minutes\' (7 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=WQHOgR8ILkw',
              duration: 10,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'How many main ideas should one speech have?', type: 'multiple_choice', options: ['As many as possible', 'One clear core message', 'At least seven', 'It doesn\'t matter'], correctOptionIndex: 1, explanation: 'One clear core message is memorable. Multiple messages confuse the audience.' }
              ]
            },
            {
              title: 'Module 1 Quiz',
              content: '<p>Test your understanding of public speaking foundations.</p>',
              type: 'quiz',
              duration: 10,
              quizQuestions: [
                { questionText: 'What is the first step before preparing any speech?', type: 'multiple_choice', options: ['Write a script', 'Design slides', 'Understand your audience', 'Practice for 10 hours'], correctOptionIndex: 2 },
                { questionText: 'Do professional speakers feel nervous?', type: 'multiple_choice', options: ['Never', 'Only beginners', 'Yes, almost all do', 'Only on television'], correctOptionIndex: 2 },
                { questionText: 'What is a \'core message\'?', type: 'multiple_choice', options: ['The title of your speech', 'The one thing you want audience to remember', 'Your opening sentence', 'Your conclusion'], correctOptionIndex: 1 },
                { questionText: 'Why is audience analysis important?', type: 'multiple_choice', options: ['It helps you choose better fonts', 'It ensures your content matches their knowledge and needs', 'It makes you look professional', 'It is required by most companies'], correctOptionIndex: 1 },
                { questionText: 'What should you do if your audience already knows your topic well?', type: 'multiple_choice', options: ['Explain basics anyway', 'Skip to advanced insights and new information', 'Cancel the speech', 'Make it longer'], correctOptionIndex: 1 }
              ],
              quizConfig: { timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 }
            }
          ]
        },
        // ─────────────────────────────────────────────────────
        // MODULE 2
        // ─────────────────────────────────────────────────────
        {
          title: 'Module 2: Managing Nervousness and Building Confidence',
          description: 'Learn why we get nervous and proven techniques to calm your body and mind before and during a presentation.',
          lessons: [
            {
              title: 'The Science of Stage Fright',
              content: '<p>Nervousness is not weakness — it is your body preparing for a challenge. When you face an audience, your brain activates the \'fight or flight\' response. Your heart beats faster. You breathe quicker. Adrenaline flows. This is normal. In fact, it is helpful. The goal is not to remove the feeling — it is to <strong>manage</strong> it so you can speak clearly despite it.</p><p>📸 <strong>Screenshot to include:</strong> A diagram showing the fight-or-flight response: brain → adrenaline → heart rate up → breathing quickens → energy ready.</p><p>🎥 <strong>Watch this video:</strong> \'The science of stage fright (and how to overcome it)\' (5 minutes)</p><p><strong>Key insight:</strong> Your body cannot tell the difference between nervousness and excitement. So instead of saying \'I am nervous\', say \'I am excited.\' This simple reframing changes how your brain processes the feeling.</p>',
              videoUrl: 'https://www.youtube.com/watch?v=HcYrAQv9Bxs',
              duration: 12,
              type: 'video',
              resources: [{ title: 'Article: Why We Fear Public Speaking (Psychology Today)', url: 'https://www.psychologytoday.com/us/basics/public-speaking', type: 'link' }],
              quizQuestions: [
                { questionText: 'What is happening in your body when you feel stage fright?', type: 'multiple_choice', options: ['You are having a medical emergency', 'Your fight-or-flight response is activating', 'You are not qualified to speak', 'You forgot your speech'], correctOptionIndex: 1, explanation: 'Stage fright is your body\'s natural preparation for a perceived challenge. It is not a sign of weakness.' },
                { questionText: 'What should you tell yourself instead of \'I am nervous\'?', type: 'multiple_choice', options: ['I am scared', 'I am excited', 'I am tired', 'I am quitting'], correctOptionIndex: 1, explanation: 'Your body feels excitement and nervousness the same way. Choose the positive label.' }
              ]
            },
            {
              title: 'Breathing Techniques for Calm',
              content: '<p>The fastest way to calm your nervous system is through your breath. <strong>Box breathing</strong> (also called tactical breathing) is used by Navy SEALs, first responders, and professional speakers.</p><p><strong>How to do box breathing:</strong></p><ul><li>Inhale slowly for 4 seconds</li><li>Hold your breath for 4 seconds</li><li>Exhale slowly for 4 seconds</li><li>Hold empty for 4 seconds</li><li>Repeat 5–10 times</li></ul><p>Do this right before you speak, or even during your speech during a natural pause (like when you change slides).</p><p>📸 <strong>Screenshot to include:</strong> A visual guide of box breathing with a square diagram showing Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s).</p><p>🎥 <strong>Watch this video:</strong> \'Guided box breathing for anxiety relief\' (5 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=YFdZXwE6fRE',
              duration: 8,
              type: 'video',
              resources: [{ title: 'Download: Box Breathing Wallpaper for Phone', url: 'https://example.com/box-breathing-wallpaper.png', type: 'image' }],
              isAssignment: true,
              assignmentDescription: 'Practice box breathing for 2 minutes twice daily for 3 days. Log your calmness score before and after each session.',
              assignmentDeliverables: ['Breathing practice log (3 days of scores)'],
              quizQuestions: [
                { questionText: 'How many seconds do you inhale in box breathing?', type: 'multiple_choice', options: ['2 seconds', '4 seconds', '6 seconds', '8 seconds'], correctOptionIndex: 1, explanation: 'Box breathing uses a 4-4-4-4 pattern: inhale 4, hold 4, exhale 4, hold 4.' },
                { questionText: 'Who uses box breathing?', type: 'multiple_choice', options: ['Only yoga teachers', 'Navy SEALs and professional speakers', 'Only medical patients', 'Nobody — it\'s not proven'], correctOptionIndex: 1, explanation: 'Box breathing is used by military, first responders, and speakers to stay calm under pressure.' }
              ]
            },
            {
              title: 'Grounding Techniques',
              content: '<p>Grounding brings your attention to the present moment, away from anxious thoughts about the future (\'What if I forget? What if they laugh?\').</p><p><strong>Simple grounding techniques before speaking:</strong></p><ul><li>Feel your feet flat on the floor. Press them down gently.</li><li>Notice the texture of your chair or the podium.</li><li>Look at three objects in the room and name them silently (\'blue clock, white wall, green plant\').</li><li>Take one slow breath while focusing on the sensation of air entering your nose.</li></ul><p>📸 <strong>Screenshot to include:</strong> A person standing with feet flat, hands relaxed, looking calmly at the audience — with arrows showing \'feet grounded\', \'shoulders relaxed\', \'hands open\'.</p><p>🎥 <strong>Watch this video:</strong> \'5-4-3-2-1 grounding technique for anxiety\' (6 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=30VMIE6aQrg',
              duration: 9,
              type: 'video',
              resources: [{ title: 'Download: Grounding Techniques Card', url: 'https://example.com/grounding-card.pdf', type: 'pdf' }],
              quizQuestions: [
                { questionText: 'What is a grounding technique?', type: 'multiple_choice', options: ['Holding your breath until you calm down', 'Focusing on physical sensations to bring yourself to the present moment', 'Closing your eyes tightly', 'Speaking as fast as possible'], correctOptionIndex: 1, explanation: 'Grounding uses your senses to pull your attention away from anxious thoughts and into the present.' },
                { questionText: 'Which of these is an example of grounding?', type: 'multiple_choice', options: ['Thinking about what could go wrong', 'Feeling your feet on the floor', 'Memorizing your speech', 'Looking at the exit door'], correctOptionIndex: 1, explanation: 'Physical sensations like feeling your feet on the floor bring you to the present moment.' }
              ]
            },
            {
              title: 'Visualization and Mental Rehearsal',
              content: '<p>Athletes use visualization to improve performance. Speakers can too. Close your eyes and imagine yourself speaking confidently. See the audience nodding. Hear your own calm voice. Feel yourself handling questions easily. Do this for 2–3 minutes before every presentation. Your brain cannot fully distinguish between a real event and a vividly imagined one — so mental rehearsal builds real confidence.</p><p>📸 <strong>Screenshot to include:</strong> A person sitting calmly with eyes closed, thought bubble showing themselves on stage speaking confidently.</p><p>🎥 <strong>Watch this video:</strong> \'Visualization for public speaking confidence\' (7 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=Jmxvn63JGiA',
              duration: 10,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'What is visualization in public speaking?', type: 'multiple_choice', options: ['Drawing pictures of your audience', 'Imagining yourself speaking successfully before you do it', 'Looking at yourself in a mirror', 'Watching videos of other speakers'], correctOptionIndex: 1, explanation: 'Visualization is mental rehearsal — imagining a successful performance to build real confidence.' }
              ]
            },
            {
              title: 'Module 2 Quiz',
              content: '<p>Test your understanding of managing nervousness and building confidence.</p>',
              type: 'quiz',
              duration: 10,
              quizQuestions: [
                { questionText: 'What is box breathing?', type: 'multiple_choice', options: ['A breathing pattern of 4-4-4-4 seconds', 'Holding your breath for 1 minute', 'Breathing only through your mouth', 'A type of exercise equipment'], correctOptionIndex: 0 },
                { questionText: 'What happens in your body during stage fright?', type: 'multiple_choice', options: ['Your heart slows down', 'Your fight-or-flight response activates', 'You lose all energy', 'Your memory improves'], correctOptionIndex: 1 },
                { questionText: 'What is visualization?', type: 'multiple_choice', options: ['Drawing your speech', 'Imagining yourself speaking successfully', 'Watching other speakers', 'Writing down your fears'], correctOptionIndex: 1 },
                { questionText: 'How many rounds of box breathing are recommended?', type: 'multiple_choice', options: ['1 round', '3-10 rounds', '30 rounds', 'None — it doesn\'t work'], correctOptionIndex: 1 },
                { questionText: 'What should you feel during grounding?', type: 'multiple_choice', options: ['Your heart racing', 'Your feet on the floor', 'Your mind wandering', 'Your hands shaking'], correctOptionIndex: 1 }
              ]
            }
          ]
        },
        // ─────────────────────────────────────────────────────
        // MODULE 3
        // ─────────────────────────────────────────────────────
        {
          title: 'Module 3: Structuring Your Speech',
          description: 'Learn the proven three-part structure that every great speaker uses: opening, body, and conclusion.',
          lessons: [
            {
              title: 'The Opening — Grab Attention in 10 Seconds',
              content: '<p>You have approximately <strong>10 seconds</strong> to grab your audience\'s attention. If you waste those seconds with a weak opening, many listeners will mentally check out. Strong openings include:</p><ul><li><strong>A surprising fact or statistic:</strong> \'Every minute, 500 hours of video are uploaded to YouTube.\'</li><li><strong>A rhetorical question:</strong> \'What if you could double your productivity starting tomorrow?\'</li><li><strong>A short story:</strong> \'Three years ago, I almost quit this job...\'</li><li><strong>A bold statement:</strong> \'Everything you know about email is wrong.\'</li><li><strong>A quote:</strong> \'As Maya Angelou said, people will forget what you said but never how you made them feel.\'</li></ul><p>❌ <strong>Weak opening to avoid:</strong> \'Hello, my name is John Smith and today I am going to talk about...\'</p><p>🎥 <strong>Watch this video:</strong> \'How to start a speech with power\' (9 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=eIho2S0ZahI',
              duration: 14,
              type: 'video',
              resources: [{ title: 'Download: 50 Powerful Opening Lines', url: 'https://example.com/50-openings.pdf', type: 'pdf' }],
              quizQuestions: [
                { questionText: 'How many seconds do you have to grab attention?', type: 'multiple_choice', options: ['30 seconds', '10 seconds', '1 minute', '5 seconds'], correctOptionIndex: 1, explanation: 'Research shows you have about 10 seconds to capture attention before minds start wandering.' },
                { questionText: 'Which is an example of a strong opening?', type: 'multiple_choice', options: ['Hello my name is...', 'What if you could save 5 hours every week?', 'Today I will talk about...', 'First, I want to thank everyone for coming'], correctOptionIndex: 1, explanation: 'A rhetorical question engages the audience immediately and makes them think.' }
              ]
            },
            {
              title: 'The Body — Three Main Points',
              content: '<p>People remember information best when it is organized into <strong>three parts</strong>. This is called the \'rule of three.\' For each main point, follow this structure:</p><ol><li><strong>State the point clearly</strong> — one sentence</li><li><strong>Explain the point</strong> — add detail or context</li><li><strong>Give an example</strong> — make it concrete and relatable</li></ol><p>Example of a point delivered well:<br>\'First, regular breaks improve focus. When you work continuously for hours, your brain gets tired. For example, a study found that people who took a 5-minute break every hour were 23% more productive than those who didn\'t.\'</p><p>🎥 <strong>Watch this video:</strong> \'How to organize your speech in 3 points\' (10 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=J1pZ6EWQnoI',
              duration: 13,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'How many main points work best for most speeches?', type: 'multiple_choice', options: ['One', 'Three', 'Seven', 'As many as you want'], correctOptionIndex: 1, explanation: 'The \'rule of three\' is a proven pattern that audiences remember easily.' },
                { questionText: 'What three things should you do for each main point?', type: 'multiple_choice', options: ['State, explain, example', 'Repeat, shout, pause', 'Write, erase, rewrite', 'Open, close, rest'], correctOptionIndex: 0, explanation: 'State the point clearly, explain it, then give a concrete example.' }
              ]
            },
            {
              title: 'Transitions — Moving Smoothly Between Points',
              content: '<p>Transitions are the bridges between your main points. They tell the audience \'I am moving to the next idea.\' Without transitions, your speech feels choppy and disjointed.</p><p><strong>Examples of transition phrases:</strong></p><ul><li>\'Now that we\'ve discussed the problem, let\'s look at the solution...\'</li><li>\'That covers the first reason. The second reason is...\'</li><li>\'So far we\'ve talked about X and Y. Finally, let\'s consider Z...\'</li><li>\'In contrast to what we just saw...\'</li><li>\'Building on that idea...\'</li></ul><p>🎥 <strong>Watch this video:</strong> \'How to use transitions in speeches\' (8 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=UEYcUJGtkHw',
              duration: 10,
              type: 'video',
              resources: [{ title: 'Download: 100 Transition Phrases for Speeches', url: 'https://example.com/transitions.pdf', type: 'pdf' }],
              quizQuestions: [
                { questionText: 'What is the purpose of a transition?', type: 'multiple_choice', options: ['To end the speech', 'To move smoothly between points', 'To introduce yourself', 'To ask questions'], correctOptionIndex: 1, explanation: 'Transitions help the audience follow your logic as you move from one point to the next.' }
              ]
            },
            {
              title: 'The Conclusion — Summarize and Call to Action',
              content: '<p>A strong conclusion has two essential parts:</p><ol><li><strong>Summarize your core message</strong> — restate what you want them to remember</li><li><strong>Call to action (CTA)</strong> — tell them exactly what to do next</li></ol><p>Example of a strong conclusion:<br>\'To summarize, taking regular breaks makes you more productive, not less. Tomorrow, I challenge you to try a 5-minute break every hour. Just try it for one day. You will feel the difference. Thank you.\'</p><p>❌ <strong>Weak conclusion to avoid:</strong> \'Well, that\'s all I have. Any questions?\'</p><p>🎥 <strong>Watch this video:</strong> \'How to end a speech memorably\' (8 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=GRxS2FgAyiA',
              duration: 11,
              type: 'video',
              resources: [{ title: 'Speech Outline Template (Fillable PDF)', url: 'https://example.com/speech-outline-template.pdf', type: 'pdf' }],
              isAssignment: true,
              assignmentDescription: 'Write a complete speech outline (2 minutes) with opening, three points with examples, transitions, and conclusion with call to action.',
              assignmentDeliverables: ['Speech outline document'],
              quizQuestions: [
                { questionText: 'What two things should every conclusion include?', type: 'multiple_choice', options: ['A joke and a wave', 'Summary and call to action', 'An apology and a thanks', 'New information and a question'], correctOptionIndex: 1, explanation: 'Summarize your main message, then tell the audience what to do next.' },
                { questionText: 'What is a \'call to action\'?', type: 'multiple_choice', options: ['Asking the audience to clap', 'Telling the audience exactly what to do next', 'Ending with a question', 'Thanking the organizers'], correctOptionIndex: 1, explanation: 'A call to action is specific instruction — \'Send me an email\', \'Try this tomorrow\', \'Approve the budget\'.' }
              ]
            },
            {
              title: 'Module 3 Quiz',
              content: '<p>Test your understanding of speech structure.</p>',
              type: 'quiz',
              duration: 10,
              quizQuestions: [
                { questionText: 'Which is a strong opening?', type: 'multiple_choice', options: ['Hello my name is...', 'What if you could save 5 hours every week?', 'Today I will talk about...', 'Thank you for having me'], correctOptionIndex: 1 },
                { questionText: 'How many main points work best?', type: 'multiple_choice', options: ['1', '3', '5', '10'], correctOptionIndex: 1 },
                { questionText: 'What is a transition?', type: 'multiple_choice', options: ['The end of your speech', 'A bridge between points', 'Your opening sentence', 'A visual slide'], correctOptionIndex: 1 },
                { questionText: 'What should your conclusion include?', type: 'multiple_choice', options: ['New information', 'Summary and call to action', 'A long story', 'An apology'], correctOptionIndex: 1 },
                { questionText: 'What is the \'rule of three\'?', type: 'multiple_choice', options: ['Speak for 3 minutes only', 'Use three main points', 'Take three breaths', 'Look at three people'], correctOptionIndex: 1 }
              ]
            }
          ]
        },
        // ─────────────────────────────────────────────────────
        // MODULE 4
        // ─────────────────────────────────────────────────────
        {
          title: 'Module 4: Delivery Skills — Voice, Body, and Eye Contact',
          description: 'Master the physical skills of speaking: vocal variety, body language, eye contact, and gestures.',
          lessons: [
            {
              title: 'Using Your Voice — Volume, Pace, Pitch, and Pause',
              content: '<p>Your voice is an instrument. You can change four things to make your speech more engaging:</p><ul><li><strong>Volume:</strong> Speak louder for emphasis, softer for intimacy</li><li><strong>Pace:</strong> Slow down for important points, speed up for excitement</li><li><strong>Pitch:</strong> Vary your tone — don\'t speak in a monotone</li><li><strong>Pause:</strong> Silence before or after a key word adds power</li></ul><p><strong>Vocal warm-up before any speech:</strong> Hum gently, say tongue twisters (\'red leather, yellow leather\'), yawn to relax your jaw.</p><p>🎥 <strong>Watch this video:</strong> \'Vocal exercises to sound more confident\' (12 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=Y7JqM1Z2gRw',
              duration: 15,
              type: 'video',
              resources: [{ title: 'Download: Vocal Warm-Up Audio (MP3)', url: 'https://example.com/vocal-warmup.mp3', type: 'link' }],
              isAssignment: true,
              assignmentDescription: 'Record yourself speaking a paragraph. Listen and identify one improvement. Record again. Submit both recordings.',
              assignmentDeliverables: ['First recording link', 'Second recording link', 'Reflection on what you improved'],
              quizQuestions: [
                { questionText: 'What are the four elements of vocal variety?', type: 'multiple_choice', options: ['Volume, pace, pitch, pause', 'Speed, color, height, width', 'Loud, quiet, high, low', 'Fast, slow, stop, go'], correctOptionIndex: 0, explanation: 'Volume (loud/soft), Pace (fast/slow), Pitch (high/low), Pause (silence) — these four create vocal interest.' },
                { questionText: 'What does a pause before a key word do?', type: 'multiple_choice', options: ['Makes you look confused', 'Adds emphasis and drama', 'Wastes time', 'Shows you forgot the word'], correctOptionIndex: 1, explanation: 'A well-placed pause builds anticipation and signals importance.' }
              ]
            },
            {
              title: 'Body Language — Posture and Movement',
              content: '<p>Your body sends messages even before you speak. Good body language makes you look confident. Bad body language undermines your message.</p><p><strong>Do this:</strong></p><ul><li>Stand straight but relaxed — shoulders back, head up</li><li>Keep your hands visible and open — not in pockets or crossed</li><li>Use the space — move purposefully, don\'t pace nervously</li><li>Face the audience — don\'t turn your back to read slides</li></ul><p><strong>Avoid this:</strong></p><ul><li>Slouching or leaning on the podium</li><li>Fidgeting with pens, jewelry, or clothing</li><li>Rocking back and forth or swaying</li><li>Crossing your arms (looks defensive)</li></ul><p>🎥 <strong>Watch this video:</strong> \'Body language for presentations\' (10 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=ZZZ7k8cM-2g',
              duration: 13,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'What is a sign of confident body language?', type: 'multiple_choice', options: ['Slouching', 'Standing straight with open hands', 'Crossed arms', 'Looking at the floor'], correctOptionIndex: 1, explanation: 'Straight posture and open hands signal confidence and openness.' },
                { questionText: 'What should you avoid doing with your hands?', type: 'multiple_choice', options: ['Using gestures', 'Putting them in your pockets', 'Keeping them visible', 'Opening them toward the audience'], correctOptionIndex: 1, explanation: 'Pockets hide your hands and can make you look nervous or disengaged.' }
              ]
            },
            {
              title: 'Eye Contact — Connecting with Your Audience',
              content: '<p>Eye contact is the most powerful way to connect with your audience. It says \'I am talking to you, not at you.\'</p><p><strong>Techniques for good eye contact:</strong></p><ul><li>Look at one person for 3–5 seconds (one complete thought)</li><li>Then move to another person in a different part of the room</li><li>Cover the whole room — left, center, right, front, back</li><li>If eye contact feels too intense, look at foreheads or noses — they cannot tell the difference</li></ul><p><strong>Never:</strong> Read from slides, look at the floor, stare at the ceiling, or look at only one person.</p><p>🎥 <strong>Watch this video:</strong> \'How to make eye contact without being weird\' (8 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=7OYVC-2zW4c',
              duration: 10,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'How long should you hold eye contact with one person?', type: 'multiple_choice', options: ['1 second', '3-5 seconds (one complete thought)', '10 seconds', 'The whole speech'], correctOptionIndex: 1, explanation: '3-5 seconds is natural and feels like genuine connection without staring.' },
                { questionText: 'What can you do if eye contact feels too hard?', type: 'multiple_choice', options: ['Look at the floor', 'Look at foreheads instead of eyes', 'Close your eyes', 'Look at your notes the whole time'], correctOptionIndex: 1, explanation: 'Looking at foreheads or the bridge of the nose looks like eye contact to the audience.' }
              ]
            },
            {
              title: 'Gestures — Using Your Hands Effectively',
              content: '<p>Gestures make your speech more visual and engaging. They also release nervous energy in a productive way.</p><p><strong>Types of gestures:</strong></p><ul><li><strong>Descriptive gestures:</strong> Show size, shape, or direction (\'The product was THIS big\')</li><li><strong>Emphatic gestures:</strong> Punch your hand for important words (\'This is CRITICAL\')</li><li><strong>Counting gestures:</strong> Use fingers for lists (\'First... Second... Third...\')</li><li><strong>Open palm gestures:</strong> Show honesty and invitation (\'I want to share with you\')</li></ul><p><strong>Avoid:</strong> Pointing at people (aggressive), hands in pockets (nervous), fidgeting (distracting), or no gestures at all (stiff).</p><p>🎥 <strong>Watch this video:</strong> \'Hand gestures for powerful speeches\' (9 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=K0pxn73vGtM',
              duration: 11,
              type: 'video',
              resources: [],
              quizQuestions: [
                { questionText: 'What is an \'open palm\' gesture used for?', type: 'multiple_choice', options: ['Showing anger', 'Showing honesty and invitation', 'Counting numbers', 'Pointing at someone'], correctOptionIndex: 1, explanation: 'Open palms signal honesty, warmth, and invitation — \'I have nothing to hide.\'' },
                { questionText: 'Which gesture should you avoid?', type: 'multiple_choice', options: ['Counting on fingers', 'Open palms', 'Pointing at audience members', 'Descriptive gestures of size'], correctOptionIndex: 2, explanation: 'Pointing can feel aggressive or accusatory. Use open hand gestures instead.' }
              ]
            },
            {
              title: 'Module 4 Quiz',
              content: '<p>Test your understanding of delivery skills.</p>',
              type: 'quiz',
              duration: 10,
              quizQuestions: [
                { questionText: 'What are the four elements of vocal variety?', type: 'multiple_choice', options: ['Volume, pace, pitch, pause', 'Speed, volume, tone, length', 'High, low, loud, soft', 'Fast, slow, stop, go'], correctOptionIndex: 0 },
                { questionText: 'Where should you look during a presentation?', type: 'multiple_choice', options: ['At the floor', 'At different people around the room', 'At your notes only', 'At the ceiling'], correctOptionIndex: 1 },
                { questionText: 'What is a sign of confident body language?', type: 'multiple_choice', options: ['Slouching', 'Crossed arms', 'Standing straight with hands visible', 'Hands in pockets'], correctOptionIndex: 2 },
                { questionText: 'What does a pause before a key word do?', type: 'multiple_choice', options: ['Shows you forgot', 'Adds emphasis', 'Wastes time', 'Confuses the audience'], correctOptionIndex: 1 },
                { questionText: 'If eye contact feels hard, what can you do?', type: 'multiple_choice', options: ['Look at foreheads', 'Look at the floor', 'Close your eyes', 'Look behind the audience'], correctOptionIndex: 0 }
              ]
            }
          ]
        },
        // ─────────────────────────────────────────────────────
        // MODULE 5
        // ─────────────────────────────────────────────────────
        {
          title: 'Module 5: Advanced Topics — Q&A, Virtual Speaking, and Handling Mistakes',
          description: 'Master question-and-answer sessions, virtual presentations, and recovering from mistakes gracefully.',
          lessons: [
            {
              title: 'Handling Q&A Sessions',
              content: '<p>Many speakers fear the Q&A more than the speech itself. But with a simple structure, you can handle any question.</p><p><strong>The LISTEN method:</strong></p><ul><li><strong>L</strong>isten fully — do not interrupt</li><li><strong>I</strong>dentify the real question (restate if unclear)</li><li><strong>S</strong>ilence — pause 2 seconds before answering</li><li><strong>T</strong>hanks — \'Thank you for that question\'</li><li><strong>E</strong>xplain your answer — be brief and clear</li><li><strong>N</strong>ext — signal you are ready for the next question</li></ul><p><strong>What to do if you don\'t know the answer:</strong> \'That\'s an excellent question. I don\'t have that information right now, but I will find out and follow up with you by email.\' Honesty builds more trust than faking an answer.</p><p>🎥 <strong>Watch this video:</strong> \'How to handle tough Q&A questions\' (11 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=Z9N9RaIkHb4',
              duration: 14,
              type: 'video',
              resources: [{ title: 'Download: Q&A Cheat Sheet', url: 'https://example.com/qa-cheatsheet.pdf', type: 'pdf' }],
              quizQuestions: [
                { questionText: 'What should you do if you don\'t know the answer to a question?', type: 'multiple_choice', options: ['Make up an answer', 'Say \'I don\'t know but I will find out\'', 'Ignore the question', 'Get angry'], correctOptionIndex: 1, explanation: 'Admitting you don\'t know and promising to follow up builds trust and credibility.' },
                { questionText: 'What is the first step in the LISTEN method?', type: 'multiple_choice', options: ['Thank them', 'Listen fully without interrupting', 'Answer immediately', 'Ask them to repeat'], correctOptionIndex: 1, explanation: 'Listen first. Interrupting makes you look defensive and can miss the real question.' }
              ]
            },
            {
              title: 'Virtual and Hybrid Speaking',
              content: '<p>More speaking happens on screens than on stages. Virtual speaking requires different techniques.</p><p><strong>For video calls (Zoom, Teams, Meet):</strong></p><ul><li>Look at the camera, not at your own face on screen</li><li>Sit close to the camera — fill about 70% of the frame</li><li>Use natural light from a window in front of you</li><li>Speak slightly slower than normal (audio lags)</li><li>Use a headset or earbuds for better audio quality</li><li>Ask questions frequently — remote audiences drift easily</li></ul><p><strong>For hybrid (some in room, some remote):</strong></p><ul><li>Repeat questions from the room so remote people can hear</li><li>Look at the camera when addressing remote participants</li><li>Use chat features for remote input</li></ul><p>🎥 <strong>Watch this video:</strong> \'How to present on Zoom like a pro\' (12 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=O9nU6bLRhBw',
              duration: 15,
              type: 'video',
              resources: [{ title: 'Checklist: Virtual Presentation Setup', url: 'https://example.com/virtual-setup-checklist.pdf', type: 'pdf' }],
              isAssignment: true,
              assignmentDescription: 'Record a 1-minute video speaking to camera. Submit video link and self-reflection.',
              assignmentDeliverables: ['Video link', 'Written reflection (1 strength, 1 improvement)'],
              quizQuestions: [
                { questionText: 'Where should you look during a video call?', type: 'multiple_choice', options: ['At yourself on screen', 'At the camera lens', 'At your notes', 'Out the window'], correctOptionIndex: 1, explanation: 'Looking at the camera creates eye contact with remote viewers. Looking at yourself breaks that connection.' },
                { questionText: 'Why should you speak slower on video calls?', type: 'multiple_choice', options: ['Because you have less time', 'Because audio can have slight delays', 'Because remote people are bored', 'Because it sounds more professional'], correctOptionIndex: 1, explanation: 'Digital audio has tiny delays. Speaking a bit slower ensures you won\'t be cut off or sound rushed.' }
              ]
            },
            {
              title: 'Recovering from Mistakes',
              content: '<p>Every speaker makes mistakes. The best speakers know how to recover gracefully.</p><p><strong>Common mistakes and how to handle them:</strong></p><ul><li><strong>You forget your next point:</strong> Pause calmly. Look at your notes (it\'s okay). Say \'Let me check my notes for a moment.\' The audience will wait.</li><li><strong>You stumble over words:</strong> Pause. Say the word again correctly. Move on. Do not apologize repeatedly.</li><li><strong>Technology fails:</strong> Have a backup plan. \'It seems the slides aren\'t working. Let me continue without them.\' Never panic visibly.</li><li><strong>You get an aggressive question:</strong> Stay calm. Take a breath. Thank them. \'That\'s a challenging question. Let me think about that for a moment.\'</li></ul><p><strong>The golden rule:</strong> The audience is almost always on your side. They want you to succeed. Most mistakes are far less noticeable to the audience than they are to you.</p><p>📸 <strong>Screenshot to include:</strong> A speaker at a podium with a calm expression despite a technical issue visible on screen behind them — labeled \'Stay calm. Adapt. Continue.\'</p><p>🎥 <strong>Watch this video:</strong> \'How to recover from speech mistakes\' (7 minutes)</p>',
              videoUrl: 'https://www.youtube.com/watch?v=9IhwQmBpE8z',
              duration: 10,
              type: 'video',
              resources: [{ title: 'Download: Recovery Phrases Cheat Sheet', url: 'https://example.com/recovery-phrases.pdf', type: 'pdf' }],
              quizQuestions: [
                { questionText: 'What should you do if you forget your next point mid-speech?', type: 'multiple_choice', options: ['Run off stage', 'Pause calmly and check your notes', 'Apologize and start over', 'Make something up'], correctOptionIndex: 1, explanation: 'A calm pause looks professional. The audience expects human moments — and they respect composure.' },
                { questionText: 'What is the golden rule about mistakes?', type: 'multiple_choice', options: ['Mistakes always end presentations', 'The audience notices everything', 'Most mistakes are less noticeable to the audience than to you', 'You should always apologize'], correctOptionIndex: 2, explanation: 'Audiences are generous and forgiving. They rarely notice small mistakes you make.' }
              ]
            },
            {
              title: 'Module 5 Quiz',
              content: '<p>Test your understanding of advanced speaking topics.</p>',
              type: 'quiz',
              duration: 10,
              quizQuestions: [
                { questionText: 'What does the \'L\' in the LISTEN method stand for?', type: 'multiple_choice', options: ['Loud', 'Listen fully without interrupting', 'Look away', 'Leave the stage'], correctOptionIndex: 1 },
                { questionText: 'Where should you look on a video call?', type: 'multiple_choice', options: ['At your own image on screen', 'At the camera lens', 'At the ceiling', 'At your notes'], correctOptionIndex: 1 },
                { questionText: 'What should you do if you stumble over words?', type: 'multiple_choice', options: ['Stop the presentation', 'Apologize 5 times', 'Pause, say it correctly, move on', 'Whisper the rest'], correctOptionIndex: 2 },
                { questionText: 'If technology fails during your presentation, you should:', type: 'multiple_choice', options: ['Panic visibly', 'Continue without the slides calmly', 'Cancel the presentation', 'Blame the AV team'], correctOptionIndex: 1 },
                { questionText: 'What is true about the audience when you make a mistake?', type: 'multiple_choice', options: ['They always laugh', 'They are usually on your side and want you to succeed', 'They stop listening immediately', 'They walk out'], correctOptionIndex: 1 }
              ]
            }
          ]
        }
      ]
    };

    const course = await new Course(courseData as any).save();
    console.log(`\n✅ Successfully seeded: "${course.title}"`);
    console.log(`   ID: ${course._id}`);
    console.log(`   Modules: ${course.modules.length}`);
    course.modules.forEach((m: any, i: number) => {
      console.log(`   Module ${i + 1}: "${m.title}" (${m.lessons.length} lessons)`);
    });

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding course:', error);
    process.exit(1);
  }
};

seedPublicSpeakingCourse();
