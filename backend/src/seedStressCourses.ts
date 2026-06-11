import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { Course } from './models/Course';
import { User } from './models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:Jonathan%402026.@109.123.252.110:27018/bootskillsdb?authSource=admin&directConnection=true';

const seedStressCourses = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    let admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!admin) {
      admin = await User.findOneAndUpdate(
        { username: 'admin' },
        { username: 'admin', email: 'admin@bootskills.com', password, role: 'admin', fullName: 'System Administrator' },
        { upsert: true, new: true }
      );
    }
    if (!admin) throw new Error('Failed to find or create admin user.');

    console.log('🗑️ Deleting existing Stress Management and Mental Health courses...');
    await Course.deleteMany({
      title: {
        $in: [
          'Stress Management for Beginners — Calm Your Mind in Minutes',
          'Mental Health & Loneliness — You Are Not Alone'
        ]
      }
    });

    // ─── COURSE 1: Stress Management for Beginners ───────────────────────────
    console.log('🧘 Seeding Stress Management course...');
    const stressExists = await Course.findOne({ title: 'Stress Management for Beginners — Calm Your Mind in Minutes' });
    if (!stressExists) {
      await new Course({
        title: 'Stress Management for Beginners — Calm Your Mind in Minutes',
        description: '<p>Learn practical, science-backed techniques to manage stress, anxiety, and overwhelm — no meditation experience required. Simple exercises you can do in 5 minutes, anywhere, on any device. Covers breathing, sleep, work stress, relationship pressure, and building daily calm habits.</p>',
        thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/stress_management.webp',
        price: 0,
        discountPrice: 0,
        level: 'Beginner',
        category: 'Health & Wellness',
        status: 'published',
        studentsEnrolled: [],
        instructor: admin._id,
        modules: [
          {
            title: 'Module 1: Understanding Stress — What It Is and Why It Happens',
            description: 'Learn what stress actually is in your body and brain, and why modern life triggers it so often.',
            lessons: [
              {
                title: 'Lesson 1: What Is Stress? (And Why Your Body Does It)',
                content: '<p><strong>Stress is not weakness</strong> — it is your body\'s alarm system, designed to protect you from danger.</p><p>When you face a threat (a deadline, an argument, bad news), your brain activates the <strong>fight-or-flight response</strong>:</p><ul><li>Adrenaline and cortisol flood your body</li><li>Your heart beats faster</li><li>Your muscles tense up</li><li>Your digestion slows</li><li>Your thinking narrows to the immediate problem</li></ul><p>This was useful when humans faced lions. But when it happens 50 times a day due to emails, traffic, and social media — the constant stress hormones <strong>damage your health</strong>.</p><p><strong>Short-term stress:</strong> Normal and even helpful for focus and performance.</p><p><strong>Chronic (long-term) stress:</strong> Leads to anxiety, poor sleep, weight gain, weakened immune system, heart problems, and depression.</p><p>🎥 <strong>Watch this video:</strong> \'What happens to your body when you\'re stressed\' (5 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=v-t1Z5-oPtU',
                duration: 5,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the "fight-or-flight" response?', type: 'multiple_choice', options: ['A sleeping disorder', 'Your body\'s stress alarm system', 'A type of anxiety medication', 'A breathing technique'], correctOptionIndex: 1, explanation: 'Fight-or-flight is your body\'s automatic response to perceived threats — it floods your system with adrenaline and cortisol.' },
                ],
              },
              {
                title: 'Lesson 2: Good Stress vs. Bad Stress — Know the Difference',
                content: '<p><strong>Not all stress is bad.</strong></p><p><strong>Good stress (Eustress):</strong> The nervous excitement before a presentation, the drive to finish a project, the thrill of a challenge. This type of stress sharpens focus and motivation. It is short-lived and followed by relief.</p><p><strong>Bad stress (Distress):</strong> The stress that never stops. Constant pressure with no end in sight. Financial worry, a toxic relationship, an overwhelming job, chronic illness. This is the type that damages health.</p><p><strong>Signs your stress has become harmful:</strong></p><ul><li>You can\'t sleep even when tired</li><li>You feel irritable or angry for no clear reason</li><li>You\'re getting sick more often</li><li>You can\'t concentrate or remember things</li><li>You feel hopeless or overwhelmed most days</li><li>You\'ve lost interest in things you used to enjoy</li></ul><p>🎥 <strong>Watch this video:</strong> \'Good stress vs bad stress — explained\' (4 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Oo3S7WNxRwI',
                duration: 4,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Which of these is an example of "good stress"?', type: 'multiple_choice', options: ['Feeling anxious for years about debt', 'Excitement before performing on stage', 'Not sleeping for weeks due to worry', 'Constant anger at work'], correctOptionIndex: 1, explanation: 'Good stress (eustress) is short-lived and motivating — like pre-performance nerves that sharpen your focus.' },
                ],
              },
              {
                title: 'Lesson 3: What Triggers YOUR Stress? (Personal Audit)',
                content: '<p>Everyone has different stress triggers. Identifying yours is the first step to managing them.</p><p><strong>Common stress triggers:</strong></p><ul><li>💼 Work: Deadlines, difficult bosses, too much work, job insecurity</li><li>💰 Money: Bills, debt, not enough income</li><li>❤️ Relationships: Arguments, loneliness, toxic people, breakups</li><li>📱 Technology: Constant notifications, social media comparison</li><li>🏥 Health: Your own illness or a loved one\'s illness</li><li>🏠 Home: Chores, noise, lack of personal space</li><li>📰 News: Negative news, violence, disasters</li></ul><p><strong>Practice Assignment:</strong> Write down your top 3 stress triggers this week. For each one, rate how stressful it is (1-10) and whether it is something you can control, partially control, or cannot control at all.</p><p>💡 <strong>Key insight:</strong> The things you cannot control deserve less mental energy. The things you CAN control deserve your action.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=RcGyVTAoXEU',
                duration: 5,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Write your top 3 stress triggers, rate each 1-10, and label whether you can control it.',
                assignmentDeliverables: ['Written list of 3 stress triggers with ratings'],
                resources: [],
                quizQuestions: [
                  { questionText: 'Why is it important to identify whether you can control a stress trigger?', type: 'multiple_choice', options: ['So you can avoid all stress forever', 'So you know where to focus your energy', 'So you can blame others for your stress', 'So you can ignore all problems'], correctOptionIndex: 1, explanation: 'Focusing your energy on what you CAN control is more productive than worrying about what you cannot.' },
                ],
              },
              {
                title: 'Module 1 Quiz',
                content: '<p>Test your understanding of stress basics.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What does chronic stress do to your body over time?', type: 'multiple_choice', options: ['Makes you stronger', 'Damages your immune system, sleep, and heart health', 'Has no effect', 'Improves your memory'], correctOptionIndex: 1 },
                  { questionText: 'What is "eustress"?', type: 'multiple_choice', options: ['Extreme stress', 'Good, motivating stress', 'Emotional stress', 'Stress from exercise'], correctOptionIndex: 1 },
                  { questionText: 'Which is a sign that stress has become harmful?', type: 'multiple_choice', options: ['Feeling excited before a challenge', 'Not sleeping even when tired', 'Working harder than usual', 'Feeling focused during a deadline'], correctOptionIndex: 1 },
                  { questionText: 'What is the best approach to stress triggers you cannot control?', type: 'multiple_choice', options: ['Focus all your energy on them', 'Accept them and direct energy to what you CAN control', 'Ignore all stress', 'Run away from them'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 2: Breathing & Body Techniques — Instant Calm in 5 Minutes',
            description: 'Practical, science-backed exercises you can do anywhere to stop stress in its tracks.',
            lessons: [
              {
                title: 'Lesson 1: Box Breathing — The Navy SEAL Technique',
                content: '<p>Box breathing (also called square breathing) is used by Navy SEALs, surgeons, and athletes to stay calm under extreme pressure. It works by activating your parasympathetic nervous system — your body\'s "rest and recover" mode.</p><p><strong>How to do it (4 simple steps):</strong></p><ol><li>🔵 Breathe IN slowly for 4 seconds</li><li>🔵 HOLD for 4 seconds</li><li>🔵 Breathe OUT slowly for 4 seconds</li><li>🔵 HOLD for 4 seconds</li><li>Repeat 4–6 times</li></ol><p><strong>When to use it:</strong></p><ul><li>Before a difficult conversation</li><li>When you feel panic or anxiety rising</li><li>Before a presentation or exam</li><li>When you\'re stuck in traffic and getting angry</li><li>Before bed when your mind won\'t stop</li></ul><p>🎥 <strong>Watch this video:</strong> \'Box breathing tutorial — 4 minutes\' (follow along)</p><p><strong>Practice Assignment:</strong> Do box breathing RIGHT NOW for 4 rounds. Notice how your body feels after. Screenshot your breathing app or write down how you felt before and after.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=tEmt1Znux58',
                duration: 6,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Do 4 rounds of box breathing and write down how you felt before and after.',
                assignmentDeliverables: ['Description of before/after box breathing experience'],
                resources: [],
                quizQuestions: [
                  { questionText: 'What does box breathing activate in your nervous system?', type: 'multiple_choice', options: ['Fight-or-flight mode', 'Rest and recover mode (parasympathetic)', 'Your immune system', 'Muscle tension'], correctOptionIndex: 1, explanation: 'Box breathing activates the parasympathetic nervous system, which calms the body down after stress.' },
                ],
              },
              {
                title: 'Lesson 2: The 4-7-8 Breathing Technique',
                content: '<p>The 4-7-8 technique was developed by Dr. Andrew Weil and is particularly effective for anxiety and falling asleep.</p><p><strong>How to do it:</strong></p><ol><li>Place your tongue tip just behind your upper front teeth</li><li>Breathe OUT completely through your mouth (make a "whoosh" sound)</li><li>Close your mouth and breathe IN through your nose for 4 seconds</li><li>HOLD your breath for 7 seconds</li><li>Breathe OUT through your mouth for 8 seconds (whoosh sound)</li><li>That is 1 round. Do 3–4 rounds</li></ol><p>⚠️ <strong>Important:</strong> The ratio matters more than the exact timing. If 4-7-8 is too long, try 2-3.5-4 to start.</p><p><strong>Best for:</strong> Falling asleep, panic attacks, moments of intense anxiety</p><p>🎥 <strong>Watch this video:</strong> \'4-7-8 Breathing Technique with Dr. Weil\' (2 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=PmBYdfv5RSk',
                duration: 5,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'The 4-7-8 technique is particularly effective for:', type: 'multiple_choice', options: ['Building muscle', 'Anxiety and falling asleep', 'Improving memory', 'Curing depression'], correctOptionIndex: 1, explanation: 'The 4-7-8 technique was developed specifically to reduce anxiety and help with sleep.' },
                ],
              },
              {
                title: 'Lesson 3: Progressive Muscle Relaxation (PMR)',
                content: '<p>Progressive Muscle Relaxation is one of the most powerful techniques for releasing physical stress from your body. You tense each muscle group tightly, then release — teaching your body the difference between tension and relaxation.</p><p><strong>Full body scan (15 minutes) — follow in order:</strong></p><ol><li>Feet — curl toes tightly for 5 seconds, then release</li><li>Calves — flex for 5 seconds, release</li><li>Thighs — squeeze for 5 seconds, release</li><li>Stomach — pull in tightly for 5 seconds, release</li><li>Hands — make tight fists for 5 seconds, release</li><li>Arms — flex biceps for 5 seconds, release</li><li>Shoulders — shrug to ears for 5 seconds, release</li><li>Face — scrunch all facial muscles for 5 seconds, release</li></ol><p>After each release, breathe out and feel the relaxation spread through that area for 10–15 seconds before moving on.</p><p>🎥 <strong>Watch this video:</strong> \'Progressive Muscle Relaxation — guided 15 minutes\' (follow along)</p><p><strong>Best time to do PMR:</strong> Before bed, after a stressful day, or whenever you feel physical tension</p>',
                videoUrl: 'https://www.youtube.com/watch?v=1nZEdqcGVzo',
                duration: 8,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What does Progressive Muscle Relaxation teach your body?', type: 'multiple_choice', options: ['How to build muscle', 'The difference between tension and relaxation', 'How to breathe correctly', 'How to fall asleep faster'], correctOptionIndex: 1, explanation: 'PMR teaches your body to recognize and release physical tension by contrasting tight and relaxed muscle states.' },
                ],
              },
              {
                title: 'Lesson 4: Cold Water & Movement — Quick Resets',
                content: '<p>When breathing techniques feel impossible during high stress, physical resets can work faster.</p><p><strong>The Cold Water Reset:</strong></p><ul><li>Splash cold water on your face and wrists for 30 seconds. This activates the "diving reflex" — your heart rate slows immediately, calming your nervous system within seconds.</li><li>If possible, hold ice cubes in your hands for 30–60 seconds. The intense sensation interrupts the anxiety spiral.</li></ul><p><strong>The Movement Reset:</strong></p><ul><li>10 jumping jacks — burns off adrenaline</li><li>A 10-minute brisk walk outside — fresh air + movement = instant mood improvement</li><li>5 minutes of stretching — releases physical tension stored in shoulders, neck, and back</li></ul><p><strong>The 5-Senses Reset (also called "Grounding"):</strong></p><p>When you feel overwhelmed, name out loud or in your mind:</p><ul><li>5 things you can SEE</li><li>4 things you can TOUCH</li><li>3 things you can HEAR</li><li>2 things you can SMELL</li><li>1 thing you can TASTE</li></ul><p>This grounds you back in the present and interrupts anxious thinking about the past or future.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=30VMIEmA114',
                duration: 5,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What does the "5-senses grounding" technique do?', type: 'multiple_choice', options: ['Improves your sense of smell', 'Brings you back to the present moment and stops anxious thinking', 'Teaches meditation', 'Reduces physical pain'], correctOptionIndex: 1, explanation: 'Grounding techniques use your senses to anchor you in the present moment, interrupting anxiety about past or future.' },
                ],
              },
              {
                title: 'Module 2 Quiz',
                content: '<p>Test your knowledge of breathing and body stress-relief techniques.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'Box breathing involves holding your breath for how many seconds (in the standard technique)?', type: 'multiple_choice', options: ['2 seconds', '4 seconds', '8 seconds', '10 seconds'], correctOptionIndex: 1 },
                  { questionText: 'The 4-7-8 technique is best used for:', type: 'multiple_choice', options: ['Exercise recovery', 'Anxiety and sleep', 'Building focus during work', 'Boosting energy'], correctOptionIndex: 1 },
                  { questionText: 'In PMR, what do you do with each muscle group?', type: 'multiple_choice', options: ['Stretch it gently', 'Tense it tightly then release', 'Massage it', 'Ignore it'], correctOptionIndex: 1 },
                  { questionText: 'What does splashing cold water on your face do during stress?', type: 'multiple_choice', options: ['Wakes you up with caffeine', 'Activates the diving reflex to slow your heart rate', 'Cools your skin temperature only', 'Has no proven effect'], correctOptionIndex: 1 },
                  { questionText: 'In the 5-senses grounding exercise, how many things do you name that you can SEE?', type: 'multiple_choice', options: ['1', '3', '4', '5'], correctOptionIndex: 3 },
                ],
              },
            ],
          },
          {
            title: 'Module 3: Work Stress & Digital Overwhelm — Taking Control',
            description: 'Practical strategies for managing job pressure, email overload, and always-on culture.',
            lessons: [
              {
                title: 'Lesson 1: Work Boundaries — How to Stop Work from Consuming Your Life',
                content: '<p>The biggest source of modern stress is blurred boundaries between work and personal life. Without clear limits, work expands to fill every moment of your day — including evenings and weekends.</p><p><strong>The essential boundaries:</strong></p><p><strong>1. Set a clear "end of work" time</strong> — When the clock hits that time, close your laptop. Tell your team your availability hours.</p><p><strong>2. Protect your morning</strong> — Don\'t check emails or messages for the first 30-60 minutes of your day. That first hour sets your mental tone for the day.</p><p><strong>3. Create physical separation</strong> — If you work from home, don\'t work from your bed. Have a dedicated work space, and leave it when done.</p><p><strong>4. Silence notifications after hours</strong> — Use "Do Not Disturb" mode on your phone after your work end time. Most things can wait until morning.</p><p><strong>5. Learn to say no</strong> — Saying yes to everything leads to burnout. "I\'m at capacity right now, can we revisit this next week?" is a complete sentence.</p><p>🎥 <strong>Watch this video:</strong> \'How to set work-life boundaries\' (6 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=r0MKhRmPkts',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the purpose of protecting your morning (not checking email for the first hour)?', type: 'multiple_choice', options: ['To save your phone battery', 'To set a positive mental tone for the day on your own terms', 'To avoid all communication', 'To get more sleep'], correctOptionIndex: 1, explanation: 'The first hour of your day sets your mental state. Checking emails immediately puts others in control of your mood before you\'ve even started.' },
                ],
              },
              {
                title: 'Lesson 2: The Power of Micro-Breaks (50/10 Rule)',
                content: '<p>Your brain is not designed to focus for 8 hours straight. Research shows focus drops dramatically after 45-90 minutes of sustained work. Regular breaks don\'t slow you down — they speed you up.</p><p><strong>The 50/10 Rule:</strong></p><ul><li>Work focused for 50 minutes</li><li>Take a full 10-minute break (not just checking your phone)</li><li>A real break: walk outside, drink water, stretch, lie down</li><li>Repeat through the day</li></ul><p><strong>What to do during breaks (NOT scrolling social media):</strong></p><ul><li>Walk for 5 minutes — best creativity booster</li><li>Look out the window at nature or the sky for 2 minutes — rests your eyes and brain</li><li>Make tea or coffee mindfully, without doing anything else</li><li>Do 10 slow stretches — releases stored muscle tension</li><li>Call a friend for 5 minutes — social connection reduces cortisol</li></ul><p><strong>Apps that help:</strong> Forest, Be Focused (Pomodoro), Time Out (Mac)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=n3kNlFMXslo',
                duration: 5,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Why are regular breaks important during work?', type: 'multiple_choice', options: ['They allow you to check social media', 'They restore focus and prevent burnout', 'They make work days shorter', 'They are required by law'], correctOptionIndex: 1, explanation: 'Your brain loses focus after sustained effort. Short breaks restore mental energy and improve overall productivity.' },
                ],
              },
              {
                title: 'Lesson 3: Digital Detox — Reducing Phone Stress',
                content: '<p>The average person checks their phone 96 times per day. Each notification triggers a tiny stress response. Over hundreds of checks per day, this accumulates into a constant state of low-level anxiety.</p><p><strong>Simple digital detox strategies:</strong></p><p><strong>1. Notification audit:</strong> Go to Settings → Notifications. Turn off ALL notifications except calls and direct messages from real people. Email, social media, and app notifications do not need to interrupt you in real time.</p><p><strong>2. Screen-free meals:</strong> No phones at the dinner table. This one habit dramatically reduces family stress and improves relationship quality.</p><p><strong>3. Phone-free bedroom:</strong> Charge your phone outside your bedroom. Replace it with an alarm clock. Poor sleep caused by phones is one of the biggest contributors to chronic stress.</p><p><strong>4. Social media time limits:</strong> Set daily screen time limits on Instagram, TikTok, and Twitter/X. 30 minutes per day maximum. Most phones have this built into Settings → Screen Time (iPhone) or Digital Wellbeing (Android).</p><p><strong>5. One day per week offline:</strong> Even a "digital Sabbath" for half a day dramatically resets stress levels.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=0BWKO7ewEpY',
                duration: 6,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Why does having your phone in the bedroom hurt your stress levels?', type: 'multiple_choice', options: ['It emits radiation', 'It disrupts sleep, which worsens stress and mood', 'It uses too much electricity', 'It\'s only a problem for children'], correctOptionIndex: 1, explanation: 'Phones in bedrooms interrupt sleep through notifications and blue light. Poor sleep dramatically increases cortisol (stress hormones) the next day.' },
                ],
              },
              {
                title: 'Module 3 Quiz',
                content: '<p>Test your knowledge of work stress and digital stress management.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the 50/10 rule?', type: 'multiple_choice', options: ['Work 50 hours, take 10 days off', 'Work focused for 50 minutes, take a 10-minute real break', '50 deep breaths followed by 10 minutes of rest', 'Work 50% of the time'], correctOptionIndex: 1 },
                  { questionText: 'What should you do with most app notifications to reduce stress?', type: 'multiple_choice', options: ['Check them immediately', 'Turn them off except for direct calls/messages', 'Enable more notifications to stay informed', 'Keep them on but on silent'], correctOptionIndex: 1 },
                  { questionText: 'Why should you not check emails first thing in the morning?', type: 'multiple_choice', options: ['Emails can wait till afternoon', 'It puts others in control of your mental state before your day begins', 'It slows down your email server', 'It is bad for your eyes'], correctOptionIndex: 1 },
                  { questionText: 'What is a healthy screen time daily limit for social media?', type: 'multiple_choice', options: ['5 hours', '3 hours', '30 minutes', 'There is no limit'], correctOptionIndex: 2 },
                ],
              },
            ],
          },
          {
            title: 'Module 4: Sleep, Food & Exercise — The Foundation of Calm',
            description: 'Why lifestyle habits are the most powerful stress management tools available.',
            lessons: [
              {
                title: 'Lesson 1: How Sleep Deprivation Makes Stress 10x Worse',
                content: '<p>Poor sleep and stress form a vicious cycle: stress keeps you awake, and sleep deprivation makes you MORE reactive to stress the next day.</p><p><strong>What happens when you\'re sleep deprived:</strong></p><ul><li>Cortisol (stress hormone) spikes by up to 37%</li><li>Your amygdala (the brain\'s alarm center) becomes 60% MORE reactive to negative stimuli</li><li>Your prefrontal cortex (logical decision-making) shuts down</li><li>You become more anxious, irritable, and emotionally explosive</li></ul><p><strong>The 7 sleep rules that actually work:</strong></p><ol><li>Same bedtime and wake time every day — even weekends</li><li>Dark, cool room (18-20°C / 65-68°F is optimal)</li><li>No screens 30 minutes before bed (phone, TV, laptop)</li><li>No caffeine after 2pm (caffeine has a 6-hour half-life)</li><li>Write tomorrow\'s to-do list before bed — offloads it from your brain</li><li>If you can\'t sleep in 20 minutes, get up and do something calm until sleepy</li><li>Reserve your bed only for sleep and intimacy — don\'t work from bed</li></ol><p>🎥 <strong>Watch this video:</strong> \'Why sleep is your superpower\' by Matthew Walker (20 min TED Talk — life-changing)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=5MuIMqhT8oM',
                duration: 8,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'How does sleep deprivation affect your cortisol (stress hormone)?', type: 'multiple_choice', options: ['It decreases it', 'It spikes it by up to 37%', 'It has no effect', 'It only affects cortisol in older people'], correctOptionIndex: 1, explanation: 'Sleep deprivation significantly raises cortisol levels, making you much more reactive to stress the next day.' },
                ],
              },
              {
                title: 'Lesson 2: Foods That Fight Stress (and Foods That Make It Worse)',
                content: '<p>Your gut produces 90% of your body\'s serotonin (the calm, happy neurotransmitter). What you eat directly affects your stress and mood levels.</p><p><strong>Stress-fighting foods:</strong></p><ul><li>🐟 <strong>Fatty fish (salmon, sardines):</strong> Omega-3s reduce cortisol and adrenaline</li><li>🫐 <strong>Blueberries:</strong> Antioxidants protect the brain from stress-related damage</li><li>🥬 <strong>Dark leafy greens (spinach, kale):</strong> Magnesium deficiency is linked to anxiety — greens are rich in magnesium</li><li>🍫 <strong>Dark chocolate (70%+):</strong> Reduces cortisol and contains anandamide (a natural mood booster)</li><li>🥑 <strong>Avocado:</strong> B vitamins support nervous system function</li><li>🌰 <strong>Nuts (especially almonds and walnuts):</strong> Magnesium + healthy fats for brain health</li><li>🫖 <strong>Green tea:</strong> L-theanine creates calm alertness without the coffee jitters</li></ul><p><strong>Foods that worsen stress:</strong></p><ul><li>☕ <strong>Too much caffeine:</strong> Directly triggers cortisol release. Limit to 1-2 cups before noon.</li><li>🍷 <strong>Alcohol:</strong> Feels calming initially but disrupts sleep and increases anxiety the next day</li><li>🍬 <strong>Sugar and processed food:</strong> Blood sugar spikes and crashes trigger anxiety and mood swings</li><li>⚡ <strong>Energy drinks:</strong> Extreme cortisol spike — avoid entirely during stressful periods</li></ul>',
                videoUrl: 'https://www.youtube.com/watch?v=gZsJGfCuGmE',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Which nutrient found in dark leafy greens helps reduce anxiety?', type: 'multiple_choice', options: ['Vitamin C', 'Magnesium', 'Iron', 'Sodium'], correctOptionIndex: 1, explanation: 'Magnesium deficiency is strongly linked to anxiety and stress. Dark leafy greens like spinach and kale are excellent sources.' },
                ],
              },
              {
                title: 'Lesson 3: Exercise — The Single Best Anti-Stress Medicine',
                content: '<p>Exercise is <strong>clinically proven</strong> to be as effective as antidepressants for mild to moderate depression and anxiety. Here\'s why:</p><ul><li>Burns off adrenaline and cortisol (the stress hormones)</li><li>Releases endorphins (natural painkillers and mood elevators)</li><li>Increases BDNF (brain-derived neurotrophic factor) — a protein that grows new brain cells and improves mood</li><li>Improves sleep quality significantly</li><li>Gives you a sense of control and accomplishment</li></ul><p><strong>You don\'t need a gym. What works:</strong></p><ul><li>🚶 <strong>30-minute brisk walk every day:</strong> The most researched, most accessible anti-stress activity. Outside in nature is best. Even 10 minutes helps.</li><li>💃 <strong>Dancing to music:</strong> The combination of music, movement, and fun is one of the fastest mood boosters</li><li>🏋️ <strong>Strength training 3x/week:</strong> Dramatically improves confidence and resilience</li><li>🧘 <strong>Yoga:</strong> Combines movement, breathing, and mindfulness — triple stress-relief</li><li>🚴 <strong>Cycling:</strong> Rhythmic movement is calming to the nervous system</li></ul><p><strong>The key:</strong> Do something you enjoy. If you hate it, you won\'t do it.</p><p><strong>Starting small:</strong> Commit to just 10 minutes of movement every day for 2 weeks. The habit forms faster than you think.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=aXItOY0sLRY',
                duration: 8,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'For the next 7 days, do at least 10 minutes of movement each day. Track it in a simple log.',
                assignmentDeliverables: ['7-day movement log (even a simple list of what you did each day)'],
                resources: [],
                quizQuestions: [
                  { questionText: 'How does exercise directly reduce stress hormones?', type: 'multiple_choice', options: ['By making you tired', 'By burning off adrenaline and cortisol', 'By increasing serotonin only', 'It doesn\'t affect stress hormones'], correctOptionIndex: 1, explanation: 'Exercise burns off adrenaline and cortisol — the very hormones that cause the physical symptoms of stress.' },
                ],
              },
              {
                title: 'Module 4 Quiz',
                content: '<p>Test your knowledge of the lifestyle foundations of stress management.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the optimal bedroom temperature for good sleep?', type: 'multiple_choice', options: ['25-28°C', '18-20°C', '10-12°C', 'Temperature doesn\'t matter'], correctOptionIndex: 1 },
                  { questionText: 'What does dark chocolate (70%+) contain that helps with stress?', type: 'multiple_choice', options: ['Vitamin D', 'Anandamide (a natural mood booster) and cortisol reducers', 'Caffeine', 'Iron'], correctOptionIndex: 1 },
                  { questionText: 'Why is caffeine restricted to before 2pm?', type: 'multiple_choice', options: ['It dehydrates you', 'Caffeine has a 6-hour half-life and disrupts sleep', 'It contains too much sugar', 'It raises blood pressure only in the afternoon'], correctOptionIndex: 1 },
                  { questionText: 'What is BDNF and why does exercise increase it?', type: 'multiple_choice', options: ['A stress hormone that increases anxiety', 'A protein that grows new brain cells and improves mood', 'A supplement you can buy', 'A type of blood sugar'], correctOptionIndex: 1 },
                  { questionText: 'Why should you write a to-do list before bed?', type: 'multiple_choice', options: ['To plan the next day efficiently', 'To offload worries from your brain so it can relax for sleep', 'To impress your boss', 'It has no effect on sleep'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 5: Building a Daily Calm Practice — Long-Term Resilience',
            description: 'How to create lasting habits that prevent stress from building up.',
            lessons: [
              {
                title: 'Lesson 1: The Morning Routine That Prevents Stress Before It Starts',
                content: '<p>Most people start their day by immediately checking their phone, reading bad news, and rushing. This activates fight-or-flight before you\'ve even left bed. Your morning sets the tone for your entire day.</p><p><strong>The 10-Minute Morning Calm (even if you\'re busy):</strong></p><ol><li>⏰ <strong>Wake up 10 minutes earlier</strong> — just 10 minutes</li><li>💧 <strong>Drink a full glass of water</strong> before anything else</li><li>🧘 <strong>3 minutes of breathing or stretching</strong> — box breathing, cat-cow stretch, anything that moves your body</li><li>📓 <strong>Write 3 things you\'re grateful for</strong> — takes 2 minutes, rewires your brain to scan for positives</li><li>📋 <strong>Write your ONE most important task today</strong> — not a list of 20 things, just the ONE thing</li></ol><p><strong>What NOT to do in the first 30 minutes:</strong></p><ul><li>Check emails or WhatsApp</li><li>Check news or social media</li><li>Rush immediately without intention</li></ul><p>This routine is based on neuroscience showing that how you start your day determines your stress baseline for the next 12 hours.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=H9Ge8pMGGCM',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What does writing 3 things you\'re grateful for each morning do to your brain?', type: 'multiple_choice', options: ['Makes you overconfident', 'Rewires it to scan for positives in your environment', 'Has no scientific basis', 'Only works if you feel truly grateful'], correctOptionIndex: 1, explanation: 'Gratitude practice literally changes neural pathways, making your brain more likely to notice and remember positive experiences.' },
                ],
              },
              {
                title: 'Lesson 2: Mindfulness in 5 Minutes — It\'s Not What You Think',
                content: '<p>Most people think mindfulness means sitting cross-legged for an hour chanting. It doesn\'t. <strong>Mindfulness is simply paying full attention to what you\'re doing right now, without judgment.</strong></p><p><strong>You can be mindful while:</strong></p><ul><li>🍵 Drinking coffee — notice the warmth, smell, taste. Don\'t scroll while drinking.</li><li>🚿 Showering — feel the water, notice the temperature, don\'t mentally plan your day</li><li>🚶 Walking — feel your feet on the ground, notice what you see around you</li><li>🍽️ Eating — put your phone down, chew slowly, taste each bite</li></ul><p><strong>5-minute formal mindfulness practice:</strong></p><ol><li>Sit comfortably and close your eyes</li><li>Breathe normally — don\'t force anything</li><li>Notice your breath going in and out</li><li>When your mind wanders (it WILL wander — that\'s normal), gently bring attention back to your breath</li><li>No judgment. Every time you notice you wandered and return = one mental rep of mindfulness</li></ol><p><strong>Apps that help:</strong> Insight Timer (free), Headspace, Calm, or just set a 5-minute timer on your phone.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
                duration: 6,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is mindfulness in simple terms?', type: 'multiple_choice', options: ['Sitting quietly for an hour', 'Paying full attention to what you\'re doing right now without judgment', 'Religious meditation', 'Thinking about nothing'], correctOptionIndex: 1, explanation: 'Mindfulness is simply present-moment awareness without judgment. It can be practiced during any ordinary activity.' },
                ],
              },
              {
                title: 'Lesson 3: Journaling for Stress — Empty Your Mind on Paper',
                content: '<p>When worries spin in your head, they feel huge and unmanageable. When you put them on paper, they become smaller and more concrete. Writing is one of the most effective (and free) stress tools available.</p><p><strong>3 proven journaling approaches:</strong></p><p><strong>1. Brain Dump (for overwhelm)</strong><br>Set a timer for 5 minutes. Write everything on your mind — worries, to-do items, fears, thoughts. Don\'t edit, don\'t reread. Just dump it all out. Your mind empties, allowing relaxation.</p><p><strong>2. Worry Journal (for anxiety)</strong><br>Write down exactly what you\'re worried about. Then ask yourself: Is this within my control? What\'s the worst realistic outcome? What would I do if that happened? How likely is this to actually happen? Often you\'ll find the fear is far less catastrophic than it felt in your head.</p><p><strong>3. Gratitude Journal (for negativity)</strong><br>Every evening, write 3 specific things that went well today and why. Even on hard days. This trains your brain to balance the negative bias it naturally has.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=wAZn9dF3XTo',
                duration: 6,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Do a 5-minute "brain dump" right now. Write everything on your mind. Then identify the one biggest worry and work through the 4 journaling questions.',
                assignmentDeliverables: ['Photo of your written brain dump or text submission'],
                resources: [],
                quizQuestions: [
                  { questionText: 'What is a "brain dump" journal technique?', type: 'multiple_choice', options: ['Writing a structured essay about your day', 'Writing everything on your mind for 5 minutes without editing', 'Copying positive affirmations', 'Planning tomorrow\'s schedule'], correctOptionIndex: 1, explanation: 'A brain dump empties your mental RAM by putting all thoughts on paper, allowing your mind to relax.' },
                ],
              },
              {
                title: 'Module 5 Quiz — Final Assessment',
                content: '<p>Test your knowledge of building lasting calm habits.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What should you NOT do in the first 30 minutes of your day?', type: 'multiple_choice', options: ['Drink water', 'Write gratitude', 'Check emails and social media', 'Breathe slowly'], correctOptionIndex: 2 },
                  { questionText: 'Can you be mindful while eating or walking?', type: 'multiple_choice', options: ['No — mindfulness requires a meditation cushion', 'Yes — mindfulness is just paying full attention to what you\'re doing', 'Only if you\'re trained', 'Only in silence'], correctOptionIndex: 1 },
                  { questionText: 'What does a "worry journal" help you discover?', type: 'multiple_choice', options: ['That your worries are always valid', 'That most fears are less catastrophic than they seem in your head', 'That writing is therapeutic only for professionals', 'That you should avoid worrying entirely'], correctOptionIndex: 1 },
                  { questionText: 'What is the best way to start a movement habit?', type: 'multiple_choice', options: ['Sign up for a full marathon immediately', 'Commit to just 10 minutes per day and build from there', 'Buy expensive gym equipment first', 'Only exercise when you feel motivated'], correctOptionIndex: 1 },
                  { questionText: 'Which statement about stress management is TRUE?', type: 'multiple_choice', options: ['You need hours per day to manage stress effectively', 'Small consistent practices done daily are more effective than rare big efforts', 'Stress management only works for some people', 'Medication is the only effective stress treatment'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
        ],
      } as any).save();
      console.log('✅ Stress Management course seeded successfully!');
    } else {
      console.log('⚠️  Stress Management course already exists. Skipping.');
    }

    // ─── COURSE 2: Mental Health & Loneliness ────────────────────────────────
    console.log('💙 Seeding Mental Health & Loneliness course...');
    const mentalHealthExists = await Course.findOne({ title: 'Mental Health & Loneliness — You Are Not Alone' });
    if (!mentalHealthExists) {
      await new Course({
        title: 'Mental Health & Loneliness — You Are Not Alone',
        description: '<p>An honest, stigma-free course about loneliness, depression, anxiety, grief, and how to build genuine connection. Includes practical tools for recognizing warning signs, helping yourself, supporting others, and knowing when and how to seek professional help. Designed for anyone who has felt alone, misunderstood, or emotionally overwhelmed.</p>',
        thumbnail: 'https://res.cloudinary.com/dbgvwi4lv/image/upload/v1778491859/courses/mental_health_loneliness.webp',
        price: 0,
        discountPrice: 0,
        level: 'Beginner',
        category: 'Health & Wellness',
        status: 'published',
        studentsEnrolled: [],
        instructor: admin._id,
        modules: [
          {
            title: 'Module 1: Understanding Loneliness — What It Really Is',
            description: 'Breaking down the myths about loneliness and understanding why it\'s a health crisis.',
            lessons: [
              {
                title: 'Lesson 1: The Loneliness Epidemic — You\'re Not the Only One',
                content: '<p>Loneliness is one of the most common and least talked-about human experiences. Research shows that <strong>more than 60% of adults</strong> regularly feel lonely — including people who appear happy and successful on social media.</p><p><strong>Loneliness ≠ being alone.</strong> You can feel deeply lonely in a crowded room, in a marriage, or surrounded by family. Loneliness is the feeling that your emotional needs for genuine connection are not being met.</p><p><strong>The physical health effects of loneliness are severe:</strong></p><ul><li>Increases risk of early death by 26%</li><li>As damaging to health as smoking 15 cigarettes per day</li><li>Raises blood pressure and weakens the immune system</li><li>Significantly increases risk of dementia</li><li>Disrupts sleep</li></ul><p><strong>Why it\'s getting worse:</strong></p><ul><li>More people live alone than ever before in history</li><li>Social media creates surface-level connection without depth</li><li>Physical community structures (churches, community centers, local groups) are declining</li><li>Remote work removes daily human contact</li><li>Constant busyness leaves no time for deep friendships</li></ul><p>🎥 <strong>Watch this video:</strong> \'The Loneliness Epidemic\' (8 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=n3Xv_g3g-mA',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Can you feel lonely even when surrounded by people?', type: 'multiple_choice', options: ['No — loneliness only happens when you\'re physically alone', 'Yes — loneliness is about unmet emotional connection needs, not physical presence', 'Only introverts experience this', 'Only during nighttime'], correctOptionIndex: 1, explanation: 'Loneliness is about emotional disconnection — you can feel it in a crowd, in a marriage, or at a party.' },
                ],
              },
              {
                title: 'Lesson 2: Types of Loneliness — Knowing What You\'re Feeling',
                content: '<p>Not all loneliness is the same. Identifying which type you\'re experiencing helps you address it more effectively.</p><p><strong>1. Social Loneliness:</strong> Not having enough social contacts or activities. Solution: expand your social circle, join groups, attend events.</p><p><strong>2. Emotional Loneliness:</strong> Lacking close, deep relationships — people you can be fully honest with. You may have many acquaintances but no one who really knows you. This is the most painful type.</p><p><strong>3. Existential Loneliness:</strong> Feeling fundamentally alone in your experience of life — a sense that no one truly understands your inner world. Often accompanies major life transitions, grief, or spiritual questioning.</p><p><strong>4. Digital Loneliness:</strong> Having hundreds of online connections but no real-world depth. Feeling more disconnected after scrolling social media.</p><p><strong>5. Situational Loneliness:</strong> Temporary — from moving to a new city, starting a new job, a breakup, or COVID isolation. Usually resolves with time and effort.</p><p>🎥 <strong>Watch this video:</strong> \'Different types of loneliness\' (5 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=4GcA-nEWQKA',
                duration: 6,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is "emotional loneliness"?', type: 'multiple_choice', options: ['Not having enough Facebook friends', 'Lacking deep, honest relationships where you feel truly known', 'Feeling sad after watching a movie', 'Being far from family geographically'], correctOptionIndex: 1, explanation: 'Emotional loneliness is specifically about lacking intimate depth in relationships — not just the quantity of connections.' },
                ],
              },
              {
                title: 'Lesson 3: How Loneliness Feeds Anxiety and Depression',
                content: '<p>Loneliness, anxiety, and depression form a vicious triangle. Each one makes the others worse.</p><p><strong>The cycle:</strong></p><ol><li>Loneliness causes pain → you withdraw to protect yourself from more rejection</li><li>Withdrawal increases isolation → your brain becomes hypervigilant for threats (social anxiety)</li><li>You start interpreting neutral situations as rejection → self-esteem drops</li><li>Depression sets in → social energy decreases → isolation deepens</li><li>Deeper isolation → more loneliness → the cycle continues</li></ol><p><strong>Breaking the cycle requires doing the OPPOSITE of what loneliness tells you to do.</strong> Loneliness tells you to hide. Recovery requires small acts of connection even when it feels hard.</p><p><strong>Warning signs that loneliness has become depression:</strong></p><ul><li>Persistent sadness lasting more than 2 weeks</li><li>Loss of interest in things you used to enjoy</li><li>Sleeping too much or not at all</li><li>Significant appetite changes</li><li>Difficulty concentrating</li><li>Feeling worthless or hopeless</li><li>Thoughts of self-harm or death</li></ul><p>⚠️ <strong>If you have thoughts of self-harm, please reach out for professional help. You deserve support.</strong></p>',
                videoUrl: 'https://www.youtube.com/watch?v=RGmGVpqPHNQ',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What does loneliness tell you to do — and why is this harmful?', type: 'multiple_choice', options: ['To seek help immediately', 'To withdraw — which deepens isolation and worsens the cycle', 'To be more social immediately', 'To focus on self-improvement'], correctOptionIndex: 1, explanation: 'Loneliness triggers withdrawal as self-protection, but withdrawal deepens the loneliness — creating a reinforcing cycle.' },
                ],
              },
              {
                title: 'Module 1 Quiz',
                content: '<p>Test your understanding of loneliness.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What percentage of adults regularly feel lonely?', type: 'multiple_choice', options: ['10%', '25%', '60%', '90%'], correctOptionIndex: 2 },
                  { questionText: 'Loneliness is as harmful to health as:', type: 'multiple_choice', options: ['Eating too much sugar', 'Smoking 15 cigarettes per day', 'Mild dehydration', 'Skipping one night of sleep'], correctOptionIndex: 1 },
                  { questionText: 'Which type of loneliness involves having many contacts but no one who truly knows you?', type: 'multiple_choice', options: ['Social loneliness', 'Emotional loneliness', 'Digital loneliness', 'Existential loneliness'], correctOptionIndex: 1 },
                  { questionText: 'What is the first instinct loneliness creates — and why is it harmful?', type: 'multiple_choice', options: ['The urge to connect — harmful because it makes you needy', 'The urge to withdraw — harmful because it deepens isolation', 'The urge to eat — harmful because of weight gain', 'The urge to work more — harmful because of burnout'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 2: Building Real Connections — Practical Steps',
            description: 'How to create and deepen meaningful friendships as an adult.',
            lessons: [
              {
                title: 'Lesson 1: Why Adult Friendships Are Hard — And How to Change That',
                content: '<p>As children, proximity and repetition created friendships automatically — you were in the same class every day. As adults, that structure disappears. Nobody puts you in a room with the same people 5 days a week anymore.</p><p><strong>The formula for friendship:</strong> Proximity + Repetition + Vulnerability over time = Close friendship.</p><p>All three are required. Most adult attempts at connection miss the "repetition" and "vulnerability" parts.</p><p><strong>Practical ways to create the conditions for friendship:</strong></p><ul><li>🏃 <strong>Join a recurring activity group:</strong> A running club, book club, art class, language exchange, sports team, volunteer group. The key word is "recurring" — same people, week after week.</li><li>🍽️ <strong>The 1+1 rule:</strong> After any social event you enjoy, invite ONE person for a smaller, more personal follow-up (coffee, lunch). This moves acquaintances toward friendship.</li><li>🏠 <strong>Host something small:</strong> A dinner for 4-6 people. You don\'t need a large apartment or fancy food. Hosting creates depth faster than any other activity.</li><li>💬 <strong>Be the one who messages first:</strong> Most lonely people wait to be invited. Send the first message. Most people are delighted when someone reaches out.</li></ul>',
                videoUrl: 'https://www.youtube.com/watch?v=I9ZHa_LDOOI',
                duration: 8,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What are the 3 ingredients needed to form a close friendship?', type: 'multiple_choice', options: ['Money, good looks, and humor', 'Proximity, repetition, and vulnerability over time', 'Shared interests, shared history, and shared goals', 'Physical closeness, gifts, and effort'], correctOptionIndex: 1, explanation: 'Research on friendship formation shows all three elements are necessary: being in the same place, repeatedly, and gradually opening up.' },
                ],
              },
              {
                title: 'Lesson 2: The Art of Being a Good Listener — The Fastest Way to Connect',
                content: '<p>Most people in conversation are thinking about what they\'ll say next, not truly listening. Becoming a genuinely curious listener is one of the most powerful ways to create deep connection — and most people almost never experience it.</p><p><strong>Deep listening techniques:</strong></p><p><strong>1. Listen to understand, not to respond</strong><br>Silence your internal commentary. Actually try to understand their experience, not just hear words.</p><p><strong>2. Ask follow-up questions</strong><br>Don\'t just listen and wait for your turn. "That sounds hard — how did that make you feel?" "What happened after that?" "What do you wish people understood about that?"</p><p><strong>3. Reflect back</strong><br>"So it sounds like you felt really misunderstood in that situation — is that right?" Reflecting shows you actually heard them.</p><p><strong>4. Don\'t immediately offer solutions</strong><br>Often people don\'t want advice. They want to feel heard. Ask: "Do you want me to listen, or are you looking for suggestions?"</p><p><strong>5. Share something vulnerable in return</strong><br>When someone shares something personal with you, reciprocate with something real from your own experience. This is how depth builds.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=saXfavo1OQo',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What do most people want when they share a problem?', type: 'multiple_choice', options: ['Immediate solutions and advice', 'To feel heard and understood', 'To be given better options', 'A list of what they did wrong'], correctOptionIndex: 1, explanation: 'Research consistently shows that feeling heard is more valuable to people than receiving advice — even correct advice.' },
                ],
              },
              {
                title: 'Lesson 3: How to Reconnect With Drifted Friendships',
                content: '<p>Some of your best potential friendships are with people you\'ve lost touch with — old colleagues, former classmates, childhood friends. Most people assume they can\'t reconnect after years of silence. They\'re wrong.</p><p><strong>The simple reconnection message:</strong></p><p>You don\'t need a reason. Just message: "Hey [name], I was thinking about you today and realized we haven\'t spoken in ages. How are you doing?" That\'s it. Most people respond warmly — they were probably thinking of reaching out too.</p><p><strong>The 5-minute connection maintenance habit:</strong></p><p>Once a week, spend 5 minutes sending a short personal message to one person you care about. Not just a meme or a group forward — a real message about them specifically. "I saw this article and thought of you." "I remembered that thing you told me — how did it go?" Over a year, that\'s 52 intentional connection points.</p><p><strong>Quality over quantity:</strong> Research shows that 3-5 close friendships provide the mental health benefits of social connection. You don\'t need 200 friends. You need a handful of people who know the real you.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Ug1zMBaInHg',
                duration: 6,
                type: 'article',
                isAssignment: true,
                assignmentDescription: 'Reach out to one person you\'ve lost touch with. Send a genuine message. Write down who you contacted and what happened.',
                assignmentDeliverables: ['Brief written account of who you messaged and their response'],
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the minimum number of close friendships needed for good mental health?', type: 'multiple_choice', options: ['50+ friends', '20+ friends', '3-5 close friends', '1 friend'], correctOptionIndex: 2, explanation: 'Research shows that 3-5 genuinely close friendships provide most of the mental health benefits of social connection.' },
                ],
              },
              {
                title: 'Module 2 Quiz',
                content: '<p>Test your knowledge of building real connections.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the "1+1 rule" for building friendships?', type: 'multiple_choice', options: ['Invite one friend to every event', 'After a social event, invite one person for a smaller follow-up', 'Make one new friend per month', 'Message one person per day'], correctOptionIndex: 1 },
                  { questionText: 'When someone shares a problem, what should you ask before giving advice?', type: 'multiple_choice', options: ['Whether they\'ve tried therapy', '"Do you want me to listen or are you looking for suggestions?"', 'Why they created the problem', 'What they expect you to do'], correctOptionIndex: 1 },
                  { questionText: 'What is the key word in "join a recurring activity group" for friendship?', type: 'multiple_choice', options: ['Activity', 'Group', 'Recurring', 'Join'], correctOptionIndex: 2 },
                  { questionText: 'Why is it okay to reconnect with someone after years of silence?', type: 'multiple_choice', options: ['It isn\'t — it will be awkward', 'Most people respond warmly because they were probably thinking of reaching out too', 'Only if you have a specific reason', 'Only if they reach out first'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 3: Depression, Grief & Dark Times — Navigating the Hard Seasons',
            description: 'Honest guidance for when life feels genuinely hard.',
            lessons: [
              {
                title: 'Lesson 1: Understanding Depression — It\'s Not Weakness or Sadness',
                content: '<p><strong>Depression is not just feeling sad.</strong> It is a medical condition involving disrupted brain chemistry, physical changes in brain structure, and a real impact on every aspect of life. It is no more a character flaw than diabetes.</p><p><strong>What depression feels like (from inside):</strong></p><ul><li>Everything feels grey and meaningless — even things that used to bring joy feel empty</li><li>Extreme fatigue — basic tasks feel impossible</li><li>A heavy, physical weight on the chest or shoulders</li><li>Self-critical thoughts that feel like absolute truth</li><li>Difficulty imagining the future feeling different</li><li>Feeling disconnected from yourself and others</li></ul><p><strong>What depression is NOT:</strong></p><ul><li>Laziness</li><li>Weakness</li><li>Attention-seeking</li><li>Something you can snap out of with willpower</li><li>Something that only happens to "weak" people</li></ul><p><strong>WHO GETS DEPRESSION:</strong> One in four people will experience clinical depression in their lifetime. It affects presidents, Olympic athletes, CEOs, and monks. It is one of the most common human experiences.</p><p>🎥 <strong>Watch this video:</strong> \'I had a black dog, his name was depression\' (5 min — WHO animation)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=XiCrniLQGYc',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is depression?', type: 'multiple_choice', options: ['A sign of weakness', 'A medical condition affecting brain chemistry and structure', 'Just feeling sad for a while', 'Something people choose to feel'], correctOptionIndex: 1, explanation: 'Depression is a medical condition — as real and physical as diabetes. It involves changes in brain chemistry and structure.' },
                ],
              },
              {
                title: 'Lesson 2: Grief — When Loss Changes Everything',
                content: '<p>Grief is the natural response to loss — not just death, but the end of a relationship, a job, a dream, a life you expected to have. It is one of the most universal and least discussed human experiences.</p><p><strong>The truth about the stages of grief:</strong></p><p>You\'ve probably heard of the "5 stages of grief" (denial, anger, bargaining, depression, acceptance). The important thing to know: <strong>these are not a linear checklist</strong>. People experience them in different orders, skip stages, return to stages, and experience stages simultaneously. There is no "correct" way to grieve.</p><p><strong>Things that help grief:</strong></p><ul><li>Allowing yourself to feel it — suppressed grief doesn\'t go away, it goes underground</li><li>Talking about the person or thing you\'ve lost, not avoiding the topic</li><li>Maintaining basic routines (sleep, food, movement) even when it\'s hard</li><li>Being around people — even passively, without having to talk</li><li>Writing about the person or experience</li><li>Giving yourself time — grief typically takes much longer than our culture acknowledges</li></ul><p><strong>What NOT to do:</strong></p><ul><li>Don\'t let people tell you to "move on" before you\'re ready</li><li>Don\'t numb it entirely with alcohol or other substances</li><li>Don\'t isolate completely for extended periods</li></ul>',
                videoUrl: 'https://www.youtube.com/watch?v=khkXBHCVMgg',
                duration: 8,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is the truth about the "5 stages of grief"?', type: 'multiple_choice', options: ['Everyone goes through them in exact order', 'They are a fixed timeline you must complete', 'They are not a linear checklist — people experience them differently', 'Only adults experience all 5 stages'], correctOptionIndex: 2, explanation: 'The 5 stages of grief are descriptive, not prescriptive. People experience them in different orders and combinations.' },
                ],
              },
              {
                title: 'Lesson 3: How to Support Someone Who Is Struggling',
                content: '<p>Most people don\'t help struggling friends because they\'re afraid of saying the wrong thing. But saying nothing is worse. <strong>Your presence matters more than your words.</strong></p><p><strong>What to say:</strong></p><ul><li>"I\'ve noticed you seem to be going through a hard time. I want you to know I\'m here."</li><li>"You don\'t have to talk about it, but I\'m here if you want to."</li><li>"I can\'t fully understand what you\'re going through, but I care about you."</li><li>"Do you want me to just sit with you? Or would you like to talk?"</li></ul><p><strong>What NOT to say:</strong></p><ul><li>"Things could be worse" — invalidates their pain</li><li>"Just be positive!" — implies it\'s their fault</li><li>"I went through something similar" — can redirect focus away from them</li><li>"Have you tried just exercising more?" — oversimplifies</li></ul><p><strong>Practical help matters more than words:</strong></p><ul><li>Bring food without being asked</li><li>Offer to come over and just watch a show together</li><li>Help with a specific practical task (groceries, a ride)</li><li>Send a text check-in — "thinking of you, no need to reply"</li></ul><p><strong>When to encourage professional help:</strong></p><p>If they show signs of depression lasting more than 2 weeks, are not eating or sleeping, or mention thoughts of self-harm — gently encourage them to speak to a doctor or counselor. Offer to help them find one or accompany them.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=l-Rk3FnMKRU',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is more important when supporting someone struggling?', type: 'multiple_choice', options: ['Saying the perfect words', 'Your genuine presence — being there matters more than perfect words', 'Giving advice quickly', 'Sharing your own experiences'], correctOptionIndex: 1, explanation: 'Research consistently shows that the quality of presence matters far more to struggling people than the perfection of words.' },
                ],
              },
              {
                title: 'Module 3 Quiz',
                content: '<p>Test your understanding of depression, grief, and supporting others.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What fraction of people will experience clinical depression in their lifetime?', type: 'multiple_choice', options: ['1 in 10', '1 in 4', '1 in 2', 'Almost everyone'], correctOptionIndex: 1 },
                  { questionText: 'Depression is a result of:', type: 'multiple_choice', options: ['Personal weakness', 'Changed brain chemistry and structure (a medical condition)', 'Poor lifestyle choices only', 'Not trying hard enough'], correctOptionIndex: 1 },
                  { questionText: 'Which statement about grief is true?', type: 'multiple_choice', options: ['You must complete 5 stages in order', 'Grief can include losing a job, relationship, or dream — not just death', 'Grief should be over in 6 months', 'Strong people don\'t grieve'], correctOptionIndex: 1 },
                  { questionText: 'What is the most helpful thing to say to someone who is struggling?', type: 'multiple_choice', options: ['"Just think positive"', '"I\'m here, and you don\'t have to talk if you don\'t want to"', '"Things could be worse"', '"Have you tried exercising?"'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 4: Professional Help — When and How to Get It',
            description: 'Everything you need to know about therapy, counseling, and mental health support.',
            lessons: [
              {
                title: 'Lesson 1: Therapy Is Not Just for Crisis — It\'s for Everyone',
                content: '<p>The biggest barrier to therapy is the belief that you need to be in serious crisis to justify it. <strong>That\'s wrong.</strong></p><p>Therapy is useful for:</p><ul><li>Feeling consistently stressed or anxious</li><li>Relationship difficulties</li><li>Processing a significant life change (job loss, divorce, grief)</li><li>Feeling stuck or unfulfilled</li><li>Understanding your own patterns</li><li>Building self-esteem and confidence</li><li>Learning communication skills</li><li>Depression, anxiety, trauma — of course</li></ul><p><strong>What therapy is NOT:</strong></p><ul><li>Paying someone to tell you what to do</li><li>Just talking to a stranger</li><li>A sign of weakness</li><li>Only for people with serious disorders</li></ul><p><strong>What therapy actually IS:</strong> A skilled professional helping you understand yourself more deeply, recognize patterns, develop tools, and make meaningful change. It is one of the most powerful investments in your quality of life.</p><p>🎥 <strong>Watch this video:</strong> \'What actually happens in therapy?\' (6 min)</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Z_QSzJHkq0Q',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'When is therapy appropriate?', type: 'multiple_choice', options: ['Only during serious mental health crises', 'Whenever you feel it would be helpful — it\'s not just for crises', 'Only if you have a diagnosed disorder', 'Only as a last resort after medication'], correctOptionIndex: 1, explanation: 'Therapy is useful for anyone wanting to understand themselves better, handle stress, or navigate life challenges — crisis is not required.' },
                ],
              },
              {
                title: 'Lesson 2: Types of Therapy — Finding What Works for You',
                content: '<p>Different types of therapy work better for different problems. Here\'s a practical overview:</p><p><strong>1. CBT (Cognitive Behavioral Therapy)</strong><br>Most researched, most common. Helps you identify negative thought patterns and change them. Excellent for anxiety and depression. Usually 12-20 sessions.</p><p><strong>2. Talk Therapy / Person-Centered Therapy</strong><br>A safe space to explore feelings, experiences, and patterns. The therapist guides you to your own insights rather than directing you. Good for general wellbeing and self-understanding.</p><p><strong>3. EMDR (Eye Movement Desensitization and Reprocessing)</strong><br>Specifically designed for trauma and PTSD. Involves processing traumatic memories while following a therapist\'s hand movements. Highly effective for trauma.</p><p><strong>4. Group Therapy</strong><br>Working through issues with a small group of people facing similar challenges. Often less expensive and provides the added benefit of realizing others share your struggles.</p><p><strong>5. Online Therapy</strong><br>Platforms like BetterHelp, Talkspace, or local online services. More accessible, often more affordable. Works well for many people, though in-person is sometimes preferable for trauma work.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=q0TAkXDLJGY',
                duration: 7,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'Which type of therapy is most effective specifically for trauma?', type: 'multiple_choice', options: ['CBT', 'Group therapy', 'EMDR', 'Online therapy only'], correctOptionIndex: 2, explanation: 'EMDR (Eye Movement Desensitization and Reprocessing) is specifically designed and clinically proven for trauma and PTSD treatment.' },
                ],
              },
              {
                title: 'Module 4 Quiz',
                content: '<p>Test your knowledge of mental health support options.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What is CBT most commonly used for?', type: 'multiple_choice', options: ['Trauma', 'Anxiety and depression', 'Relationship counseling only', 'Career coaching'], correctOptionIndex: 1 },
                  { questionText: 'What is online therapy?', type: 'multiple_choice', options: ['A replacement for all in-person therapy', 'A more accessible form of therapy through platforms like BetterHelp', 'Only useful for minor issues', 'Not effective'], correctOptionIndex: 1 },
                  { questionText: 'What is the biggest misconception about therapy?', type: 'multiple_choice', options: ['That it costs too much', 'That you have to be in crisis to justify going', 'That therapists give you direct advice', 'That it takes years to see results'], correctOptionIndex: 1 },
                  { questionText: 'Group therapy offers what additional benefit beyond individual therapy?', type: 'multiple_choice', options: ['It\'s faster', 'Realizing others share your struggles', 'Better diagnosis', 'Medication management'], correctOptionIndex: 1 },
                ],
              },
            ],
          },
          {
            title: 'Module 5: Daily Mental Health Habits — Building Long-Term Resilience',
            description: 'Simple daily practices that protect and strengthen your mental health.',
            lessons: [
              {
                title: 'Lesson 1: The Five Mental Health Habits That Science Confirms Work',
                content: '<p>Mental health is not just the absence of illness — it is something you actively maintain, like physical health. These 5 habits are backed by strong scientific evidence:</p><p><strong>1. 🏃 Daily movement (30 min, any intensity)</strong><br>Exercise is clinically proven to reduce depression and anxiety as effectively as medication for many people. Walk, dance, swim, anything you enjoy.</p><p><strong>2. 😴 7-9 hours of quality sleep</strong><br>Sleep deprivation is directly linked to depression and anxiety. Protect your sleep like you protect your health — because that\'s exactly what you\'re doing.</p><p><strong>3. 🤝 Meaningful social contact at least 3x per week</strong><br>Real conversation, not scrolling. Text a friend, meet someone for coffee, call your mother. Even brief, genuine interactions measurably improve mood.</p><p><strong>4. 🙏 Gratitude or mindfulness practice (5-10 minutes daily)</strong><br>Gratitude journaling, meditation, or simply noticing good moments. Changes brain wiring toward positivity over 4-8 weeks of consistent practice.</p><p><strong>5. 🎯 Purpose and progress (working toward something that matters to you)</strong><br>People with a clear sense of purpose have significantly better mental health. It doesn\'t need to be grand — learning a skill, growing a plant, helping a neighbor, building a business.</p>',
                videoUrl: 'https://www.youtube.com/watch?v=Elp_F4oGEY4',
                duration: 9,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'How many times per week does science recommend meaningful social contact for mental health?', type: 'multiple_choice', options: ['Once per week', 'Twice per week', 'At least 3 times per week', 'Every day only'], correctOptionIndex: 2, explanation: 'Research shows that meaningful social contact at least 3 times per week significantly improves mood and mental health outcomes.' },
                ],
              },
              {
                title: 'Lesson 2: When to Worry About Yourself — Mental Health First Aid',
                content: '<p>Just as you know the signs of a physical emergency (chest pain = potential heart attack, seek help immediately), knowing the mental health warning signs that require professional attention could save your life or someone else\'s.</p><p><strong>Seek professional help if you experience (for more than 2 weeks):</strong></p><ul><li>Persistent sadness, emptiness, or hopelessness</li><li>Unable to get out of bed or perform basic tasks</li><li>Loss of all interest or pleasure in life</li><li>Significant changes in appetite or weight</li><li>Sleeping too much or not at all</li><li>Feeling worthless or guilty about everything</li><li>Difficulty thinking or concentrating</li><li>Physical symptoms with no medical cause (headaches, stomach pain, chest tightness)</li></ul><p><strong>SEEK EMERGENCY HELP IMMEDIATELY if:</strong></p><ul><li>You are having thoughts of suicide or self-harm</li><li>Someone tells you they are thinking of ending their life</li></ul><p><strong>International crisis resources:</strong></p><ul><li>🌍 International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/</li><li>📱 Crisis Text Line (US/UK/Canada): Text "HELLO" to 741741</li><li>☎️ WHO resources: who.int/health-topics/suicide</li><li>🇷🇼 Rwanda: Accessible mental health support at any district hospital</li></ul><p>⚠️ <strong>If you are in crisis right now, please tell someone — a family member, a friend, or call emergency services. You matter, and help is available.</strong></p>',
                videoUrl: 'https://www.youtube.com/watch?v=1JvCVFIJWBw',
                duration: 8,
                type: 'article',
                resources: [],
                quizQuestions: [
                  { questionText: 'When should you seek professional mental health support?', type: 'multiple_choice', options: ['Only when you\'re considering harming yourself', 'When symptoms last more than 2 weeks and interfere with daily life', 'Only after medication has failed', 'Only if a doctor diagnoses you'], correctOptionIndex: 1, explanation: 'Professional support is appropriate whenever symptoms last more than 2 weeks and significantly impact your ability to function.' },
                ],
              },
              {
                title: 'Final Quiz — Mental Health & Loneliness',
                content: '<p>Final assessment covering the full course on mental health and loneliness.</p>',
                type: 'quiz',
                resources: [],
                quizQuestions: [
                  { questionText: 'What are the 5 daily habits confirmed by science to support mental health?', type: 'multiple_choice', options: ['Vitamins, meditation, cold showers, fasting, therapy', 'Movement, sleep, social contact, gratitude/mindfulness, purpose', 'Reading, writing, talking, traveling, working', 'Medication, therapy, journaling, yoga, diet'], correctOptionIndex: 1 },
                  { questionText: 'What is the difference between loneliness and being alone?', type: 'multiple_choice', options: ['There is no difference', 'Loneliness is an emotional experience of disconnection — you can feel it even in a crowd', 'Being alone always causes loneliness', 'Loneliness is only for people without family'], correctOptionIndex: 1 },
                  { questionText: 'What should you do if someone tells you they\'re having thoughts of ending their life?', type: 'multiple_choice', options: ['Tell them to think positive', 'Help them find emergency or crisis support immediately', 'Change the subject', 'Wait to see if it gets worse'], correctOptionIndex: 1 },
                  { questionText: 'What is CBT therapy used for?', type: 'multiple_choice', options: ['Physical rehabilitation', 'Identifying and changing negative thought patterns (great for anxiety/depression)', 'Career counseling only', 'Relationship advice'], correctOptionIndex: 1 },
                  { questionText: 'How many close friendships does research say you need for mental health benefits?', type: 'multiple_choice', options: ['50+', '20+', '3-5 close friends', 'Just 1 best friend'], correctOptionIndex: 2 },
                ],
              },
            ],
          },
        ],
      } as any).save();
      console.log('✅ Mental Health & Loneliness course seeded successfully!');
    } else {
      console.log('⚠️  Mental Health & Loneliness course already exists. Skipping.');
    }

    console.log('\n🎉 Stress & Mental Health courses seeded successfully!');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedStressCourses();
