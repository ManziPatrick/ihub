/**
 *  SEED: 10 MVP Courses — African Market Gap Courses
 *
 * Creates 10 comprehensive, sellable courses targeting the biggest skill gaps
 * in Rwanda and across Africa. Each course includes:
 *   - High-quality Pexels image (via API)
 *   - 2-3 modules with lessons
 *   - Quizzes & assignments
 *   - Affordable pricing for the African market
 *
 * Usage:
 *    cd backend
 *    npx tsx src/seedMVPCourses.ts
 *
 * Environment variables required:
 *   PEXELS_API_KEY or VITE_PEXELS_API_KEY — for fetching high-quality images
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { getCourseIllustrationUrl, verifyImageUrl } from './services/image-api.service';

const HAS_PEXELS_KEY = !!(process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY);

dotenv.config();

// ─── Helper Functions ───────────────────────────────────────────────────────

function makeLesson(title: string, content: string, type: string = 'article', order: number = 1, extras: Record<string, any> = {}) {
  // Get imageUrl from extras if provided
  const imgUrl = extras.imageUrl;
  const imgMd = imgUrl ? `\n\n![${title}](${imgUrl})` : '';
  // Add phone-friendly practical tips for article/video lessons
  const phoneTips = type === 'article' || type === 'video' ? `\n\n---\n### 📱 Learn Your Way — Choose Your Setup\n\n| Icon | Your Scenario | Best Approach |\n|---|---|---|\n| 📱 | **Using a smartphone?** | All tools mentioned have **free mobile apps**. Open Chrome or your phone browser and follow along step-by-step. No laptop needed! |\n| 💻 | **Using a laptop/PC?** | Open **two browser tabs** — one for this lesson on this page, one to practice what you learn. Download templates from the Resources section to follow along. |\n| 📶 | **Limited data or wifi?** | Connect at a free WiFi hotspot (cafe, library, university campus). **Download this lesson** and practice offline later — no ongoing data needed! |\n| 🔋 | **Battery running low?** | Save a copy of this page or take screenshots of key steps. Study them offline to save battery while practicing. |\n| 🎧 | **Prefer listening?** | Use your phone text-to-speech feature to read lessons aloud while you follow along with exercises. |\n\n> 💡 **Tip:** Most successful learners use their phone for lessons and a notebook for practice. You do not need an expensive setup — just start!` : '';
  return {
    title,
    content: `## ${title}\n\n${content}${imgMd}${phoneTips}`,
    type,
    duration: type === 'video' ? 10 : type === 'quiz' ? 8 : type === 'assignment' ? 15 : 12,
    order,
    ...extras,
  };
}

function makeQuizLesson(title: string, content: string, questions: any[], order: number, timeLimit: number = 8) {
  return makeLesson(title, content, 'quiz', order, {
    quizConfig: {
      disableRightClick: false,
      timeLimit,
      quizType: 'exercise',
      questionsPerPage: 5,
    },
    quizQuestions: questions.map((q, i) => ({
      questionText: q.question,
      type: q.type || 'multiple_choice',
      options: q.options || [],
      correctOptionIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
    })),
  });
}

function makeAssignmentLesson(
  title: string,
  content: string,
  description: string,
  questions: any[],
  order: number,
  timeLimit: number = 15,
) {
  return makeLesson(title, content, 'assignment', order, {
    isAssignment: true,
    requiredAssignment: true,
    assignmentDescription: description,
    assignmentConfig: {
      timeLimit,
      allowRetakes: true,
      disableRightClick: false,
      mode: 'exam',
    },
    assignmentQuestions: questions.map((q, i) => ({
      questionText: q.question,
      type: q.type || 'mcq',
      options: q.options || [],
      correctOptionIndex: q.correctIndex ?? 0,
      explanation: q.explanation || '',
      points: q.points || 10,
    })),
  });
}

function makeModule(title: string, description: string, lessons: any[], outcome: string = '', order: number = 1) {
  return {
    title,
    description,
    lessons,
    learningOutcome: outcome || `Master the concepts covered in ${title}.`,
    actionPlan: outcome ? `Complete this module and its assignment to achieve: ${outcome}` : '',
    order: order ?? 1,
  };
}

// ─── Course Definitions ─────────────────────────────────────────────────────

interface CourseDef {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  discountPrice?: number;
  searchImage: string; // keyword to search on Pexels
  modules: ReturnType<typeof makeModule>[];
  isFeatured?: boolean;
  school?: string;
}

const COURSES: CourseDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 1: Digital Marketing for African SMEs
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Digital Marketing That Works in Rwanda',
    description:
      '🇷🇼 Made for Rwandan businesses — learn digital marketing with local examples you can actually use. ' +
      'From WhatsApp Business for Kigali shops to Instagram for tourism and Facebook Marketplace for farmers, ' +
      'this course shows you exactly how to attract customers without spending a fortune on ads. ' +
      'Real strategies that worked for Rwandan SMEs — not generic advice from abroad.\n\n' +
      '### 🎯 What You Will Learn\n' +
      '- **Social Media Marketing** — Grow your business on WhatsApp, Instagram, Facebook, and TikTok\n' +
      '- **Paid Advertising** — Run Facebook and Google ads with RWF budgets (start from just 5,000 RWF/day)\n' +
      '- **Email Marketing** — Build an email list and create campaigns that convert using free tools\n' +
      '- **Content Creation** — Create professional graphics, videos, and posts using only your smartphone\n' +
      '- **Analytics & ROI** — Track what works and measure your return on investment\n' +
      '- **Local Marketing** — Get found on Google Maps, WhatsApp Business catalogue, and Facebook Marketplace\n\n' +
      '### 🧰 Your Digital Marketing Toolbox\n' +
      '| Tool | Purpose | Cost | Sign Up |\n' +
      '|---|---|---|---|\n' +
      '| Canva | Graphics, social media posts | Free tier | [canva.com](https://www.canva.com) |\n' +
      '| WhatsApp Business | Customer chat, catalogue | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |\n' +
      '| Facebook Business | Ad manager, page insights | Free to start | [business.facebook.com](https://business.facebook.com) |\n' +
      '| Google My Business | Local search, Google Maps | Free | [google.com/business](https://www.google.com/business) |\n' +
      '| Mailchimp | Email newsletters | Free tier (500 contacts) | [mailchimp.com](https://www.mailchimp.com) |\n' +
      '| Brevo | Email + SMS marketing | Free tier (300/day) | [brevo.com](https://www.brevo.com) |\n' +
      '| CapCut | Video editing (app) | Free | [capcut.com](https://www.capcut.com) |\n' +
      '| Canva AI | AI image generation | Free tier | [canva.com](https://www.canva.com) |\n\n' +
      '> 🎓 **By the end of this course, you will be able to** attract more customers, increase sales, ' +
      'and grow any Rwandan business using digital tools — all on a budget of under 50,000 RWF!',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'digital marketing africa social media business',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Foundations of Digital Marketing',
        'Understand the digital landscape in Africa and why digital marketing is essential for SMEs.',
        [
          makeLesson(
            'The African Digital Landscape',
            'Africa has over 500 million internet users and growing. Mobile penetration is driving digital adoption. ' +
            'In this lesson, we explore why digital marketing is critical for African SMEs, the platforms that matter ' +
            '(WhatsApp, Facebook, Instagram, TikTok), and how consumer behaviour differs across the continent.\n\n' +
            '### Why Digital Marketing Matters in Africa\n' +
            '- **Mobile-first**: Most Africans access the internet via smartphones\n' +
            '- **Social media dominant**: WhatsApp has over 2 billion users globally, with huge African adoption\n' +
            '- **Cost-effective**: Digital marketing is much cheaper than traditional media in Africa\n' +
            '- **Targeted reach**: Reach exactly the customers who need your product',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=NlLQH3ZKLDA', videoTitle: 'Digital Marketing in 3 Minutes - Quick Guide' },
          ),
          makeLesson(
            'Building Your Digital Marketing Strategy',
            'A digital marketing strategy is your roadmap. This lesson covers how to define your goals, identify your target ' +
            'audience, choose the right platforms, and create a content plan that drives results.\n\n' +
            '### Key Steps:\n' +
            '1. **Define SMART goals** — Specific, Measurable, Achievable, Relevant, Time-bound\n' +
            '2. **Know your audience** — Create customer personas\n' +
            '3. **Choose platforms** — Where do your customers spend time?\n' +
            '4. **Create content** — What resonates with your audience?\n' +
            '5. **Measure & optimize** — Track what works and do more of it',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Low-Budget Marketing Tactics That Work',
            'You do not need a big budget to succeed at digital marketing in Africa. This lesson covers free and low-cost ' +
            'strategies including WhatsApp Business, organic social media, word-of-mouth marketing, and community building.\n\n' +
            '### Free Digital Marketing Tools Compared\n' +
            '| Tool | Best For | Free Tier Limit | RWF Alternative |\n' +
            '|---|---|---|---|\n' +
            '| Canva | Social media graphics, flyers | 250K+ templates free | [Canva Free](https://www.canva.com) |\n' +
            '| Google My Business | Local search presence | Completely free | [g.co/kms](https://www.google.com/business) |\n' +
            '| WhatsApp Business | Customer chat, catalogue | Free app | [wa.me/business](https://www.whatsapp.com/business) |\n' +
            '| Facebook Marketplace | Sell to local buyers | Free to list | [facebook.com/marketplace](https://www.facebook.com/marketplace) |\n' +
            '| CapCut | Short video editing | Free, no watermark | [capcut.com](https://www.capcut.com) |\n' +
            '| Mailchimp | Email marketing | 500 contacts free | [mailchimp.com](https://www.mailchimp.com) |\n' +
            '| Buffer | Schedule social posts | 3 channels free | [buffer.com](https://www.buffer.com) |\n' +
            '| Google Analytics | Website tracking | Completely free | [analytics.google.com](https://analytics.google.com) |\n\n' +
            '> 💡 **All the tools above are 100% free to start.** You can run a full marketing campaign with just these 8 tools. ' +
            'No need to spend on paid software until you are generating revenue!',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of digital marketing fundamentals.',
            [
              {
                question: 'Which platform is most widely used for business communication in Africa?',
                options: ['WhatsApp', 'Telegram', 'Signal', 'WeChat'],
                correctIndex: 0,
                explanation: 'WhatsApp has the highest penetration in Africa for business communication.',
              },
              {
                question: 'What does SMART stand for in goal setting?',
                options: [
                  'Simple, Measurable, Achievable, Relevant, Timely',
                  'Specific, Measurable, Achievable, Relevant, Time-bound',
                  'Strategic, Managed, Actionable, Realistic, Tested',
                  'None of the above',
                ],
                correctIndex: 1,
                explanation: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.',
              },
              {
                question: 'Which of these is a free digital marketing tool?',
                options: ['Canva', 'Adobe Photoshop', 'Mailchimp Premium', 'Hootsuite Enterprise'],
                correctIndex: 0,
                explanation: 'Canva offers a generous free tier for creating marketing graphics.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: Marketing Strategy Assignment',
            'Apply what you have learned by creating a mini digital marketing strategy.',
            'Create a one-page digital marketing strategy for a small business of your choice. Include goals, target audience, platforms, and content ideas.',
            [
              {
                question: 'What is the primary goal of your digital marketing strategy?',
                type: 'open',
                explanation: 'A good goal is specific and measurable, e.g., "Increase Instagram followers by 20% in 3 months".',
                points: 15,
              },
              {
                question: 'Which two social media platforms would you prioritise for an African SME and why?',
                type: 'open',
                explanation: 'Consider where the target audience spends time. WhatsApp and Instagram are often top choices.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Create a basic digital marketing strategy for an SME.',
      ),
      makeModule(
        'Module 2: Social Media & Content Marketing',
        'Master social media platforms and content creation for business growth.',
        [
          makeLesson(
            'Instagram & Facebook Marketing',
            'Learn how to optimise your Instagram and Facebook profiles for business, create engaging posts, ' +
            'use Stories and Reels, run contests, and build a community around your brand.\n\n' +
            '### Instagram Tips:\n' +
            '- Use **Reels** for maximum reach — short, engaging videos\n' +
            '- Post consistently — at least 3-4 times per week\n' +
            '- Use relevant **hashtags** — mix popular and niche tags\n' +
            '- Engage with your audience — reply to comments and DMs',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=ErN2pvkSXKA', videoTitle: 'Social Media Strategies for Small Business' },
          ),
          makeLesson(
            'Content Creation with Minimal Resources',
            'You do not need expensive equipment to create great content. This lesson covers smartphone photography, ' +
            'basic video recording, using natural light, and simple editing with free apps.\n\n' +
            '### Smartphone Content Tips:\n' +
            '- Clean your lens! A smudged lens ruins photos\n' +
            '- Use natural light — shoot near windows or outdoors\n' +
            '- Hold steady — use both hands or a cheap tripod\n' +
            '- Edit with free apps — CapCut for video, Snapseed for photos',
            'article',
            2,
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review social media and content marketing concepts.',
            [
              {
                question: 'Which Instagram format currently gets the highest organic reach?',
                options: ['Static posts', 'Stories', 'Reels', 'IGTV'],
                correctIndex: 2,
                explanation: 'Instagram Reels are prioritised by the algorithm for maximum reach.',
              },
              {
                question: 'What is the most important equipment for content creation?',
                options: ['Professional camera', 'Smartphone', 'Studio lights', 'Expensive microphone'],
                correctIndex: 1,
                explanation: 'A modern smartphone is sufficient for creating high-quality content.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final Assessment',
            'Demonstrate your digital marketing knowledge in this final assessment.',
            'Answer the following questions to complete the course.',
            [
              {
                question: 'Describe a complete social media campaign for launching a new product in Kigali, Rwanda. Include platform choice, content types, budget, and success metrics.',
                type: 'open',
                explanation: 'A strong answer includes specific platforms, content formats, a realistic budget, and measurable KPIs.',
                points: 25,
              },
              {
                question: 'How would you measure the ROI of a digital marketing campaign for an SME?',
                options: [
                  'Only by sales revenue',
                  'Using a combination of engagement, leads, conversions, and revenue',
                  'By counting likes only',
                  'ROI cannot be measured for digital marketing',
                ],
                correctIndex: 1,
                explanation: 'ROI should be measured holistically — engagement, leads, conversions, and revenue.',
              },
            ],
            4,
          ),
        ],
        'Execute a complete social media marketing campaign.',
      ),


      makeModule(
        'Module 3: Email Marketing & Automation',
        'Build email lists, write compelling newsletters, and automate email campaigns that convert.',
        [
          makeLesson(
            'Building Your Email List from Scratch',
            'Email marketing remains one of the highest-ROI channels. This lesson covers how to build an email list ethically in Rwanda using lead magnets like free guides and discount codes. Learn about compliance (Data Protection Law No. 058/2021), how to use Mailchimp and Brevo for free, and strategies to grow your list.\n\n### List Building Strategies:\n1. Offer a free download related to your business\n2. Collect emails at checkout or point of sale\n3. Run a social media contest requiring email sign-up\n4. Add sign-up forms to your website and social media\n5. Partner with complementary businesses to cross-promote',
            'article',
            1,
          ),
          makeLesson(
            'Writing Emails That Get Opened',
            'Learn to write subject lines that get opened, email copy that engages, and CTAs that drive sales. Covers the AIDA formula (Attention, Interest, Desire, Action) with real examples from Rwandan businesses.\n\n### Email Writing Tips:\n- Subject lines under 50 characters perform best\n- Personalise with the recipient first name\n- Keep paragraphs short (2-3 sentences)\n- Use bullet points for easy scanning\n- Always include one clear call-to-action',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=A7HpMRvqtzM', videoTitle: 'Email Marketing for Beginners - Quick Guide' },
          ),
          makeLesson(
            'Automating Your Email Campaigns',
            'Save time and increase sales by automating email sequences. Learn about welcome sequences, abandoned cart emails, re-engagement campaigns, and nurture sequences. Mailchimp and Brevo offer free tiers.\n\n### Automated Email Types:\n1. Welcome email - Send immediately after sign-up\n2. Nurture sequence - 3-5 educational emails over 2 weeks\n3. Promotional email - Offer discount or new product\n4. Re-engagement email - Win back inactive subscribers\n5. Feedback email - Ask for reviews or referrals',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test your understanding of email marketing.',
            [
              { question: 'What does AIDA stand for?', options: ['Attention, Interest, Desire, Action', 'Assess, Implement, Deploy, Analyse', 'Awareness, Interest, Decision, Action', 'Approach, Integrate, Deliver, Assess'], correctIndex: 0, explanation: 'AIDA stands for Attention, Interest, Desire, Action.' },
              { question: 'Recommended max email subject line length?', options: ['100 chars', '50 chars', '25 chars', '200 chars'], correctIndex: 1, explanation: 'Subject lines under 50 characters have the best open rates.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Email Campaign Project',
            'Create a complete email marketing welcome sequence.',
            'Build a 3-email welcome sequence with subject lines, body copy, and CTAs for each.',
            [
              { question: 'Write a 3-email welcome sequence for a business of your choice. Include subject lines, body, and CTAs.', type: 'open', explanation: 'Email 1: Welcome and set expectations. Email 2: Deliver value. Email 3: Present an offer.', points: 20 },
              { question: 'What lead magnet would you offer to grow your email list and why?', type: 'open', explanation: 'Consider: free guide, discount code, checklist, or template relevant to your audience.', points: 15 },
            ],
            5,
          ),
        ],
        'Build and automate an email marketing campaign that drives sales.',
      ),

      makeModule(
        'Module 4: Analytics & Measuring ROI',
        'Track your marketing performance, measure return on investment, and make data-driven decisions.',
        [
          makeLesson(
            'Introduction to Marketing Analytics',
            'Learn key metrics: impressions, reach, engagement rate, click-through rate, conversion rate, and ROAS. Set up tracking without a big budget.\n\n### Key Metrics:\n- Impressions: How many times content was seen\n- Reach: How many unique people saw it\n- CTR: Percentage of viewers who clicked\n- Conversion Rate: Percentage who took action\n- ROAS: Revenue per dollar spent on ads',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=3L7F7n5JU6U', videoTitle: 'Marketing Analytics for Beginners' },
          ),
          makeLesson(
            'Google Analytics & Facebook Insights',
            'Setup guides for Google Analytics and Facebook Insights. Learn to find actionable insights from your data.\n\n### What to Track:\n1. Traffic sources - Where do visitors come from?\n2. Popular content - What pages do they visit most?\n3. User behaviour - How long do they stay?\n4. Conversions - Are visitors taking desired actions?\n5. Demographics - Who is your audience?',
            'article',
            2,
          ),
          makeLesson(
            'Calculating ROI for Your Marketing Efforts',
            'Calculate ROI for different campaigns and channels.\n\n### ROI by Channel:\n- Social media organic: Track hours invested vs results\n- Social media ads: Track ad spend vs direct sales\n- Email marketing: Track time investment vs conversions\n- WhatsApp Business: Track response time and conversion rate\n- Content marketing: Track traffic growth and engagement',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review analytics and ROI concepts.',
            [
              { question: 'What does CTR stand for?', options: ['Cost to Revenue', 'Click-Through Rate', 'Conversion Tracking Rate', 'Customer Turnover Ratio'], correctIndex: 1, explanation: 'CTR stands for Click-Through Rate.' },
              { question: 'Best tool for tracking website visitors?', options: ['Facebook Insights', 'Google Analytics', 'Twitter Analytics', 'Instagram Insights'], correctIndex: 1, explanation: 'Google Analytics is the industry standard for website tracking.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Analytics Report Project',
            'Create a marketing performance dashboard.',
            'Design a dashboard tracking 5 key metrics with current performance, targets, and improvement actions.',
            [
              { question: 'Create a dashboard template with 5 metrics. For each: what it measures, current value, target, and improvement action.', type: 'open', explanation: 'Metrics: website traffic, email open rate, social engagement, conversion rate, customer acquisition cost.', points: 20 },
              { question: 'Calculate ROI for a Facebook campaign costing 50,000 RWF generating 15 leads and 3 customers spending 25,000 RWF each.', type: 'open', explanation: 'Show: total revenue, total cost, net profit, and ROI percentage.', points: 15 },
            ],
            5,
          ),
        ],
        'Track, measure, and optimise marketing campaigns using data.',
      ),

      makeModule(
        'Module 5: Advanced Growth & Paid Advertising',
        'Scale your business with paid advertising, influencer marketing, and advanced growth strategies.',
        [
          makeLesson(
            'Introduction to Paid Advertising',
            'Covers major ad platforms: Facebook Ads, Instagram Ads, Google Ads, YouTube Ads, and TikTok Ads. Learn targeting, budgeting, and creative best practices.\n\n### Ad Platform Comparison (RWF Budgets)\n| Platform | Best For | Min Daily Budget | Rwanda Reach | Best Content Type |\n|---|---|---|---|---|\n| Facebook Ads | Local businesses, products | 5,000 RWF/day | 3M+ users | Images, offers, events |\n| Instagram Ads | Visual products, tourism | 5,000 RWF/day | 1M+ users | Reels, stories, photos |\n| Google Ads | Active searchers, services | 3,000 RWF/day | 2M+ searches | Text ads, local maps |\n| YouTube Ads | Brand awareness, tutorials | 7,000 RWF/day | 1M+ viewers | Short skippable videos |\n| TikTok Ads | Youth products, trends | 10,000 RWF/day | 500K+ users | Short vertical videos |\n| WhatsApp Ads | Direct customer contact | 3,000 RWF/day | 5M+ users | Click-to-chat messages |\n| LinkedIn Ads | B2B, professional services | 15,000 RWF/day | 200K+ pros | Sponsored content, InMail |\n\n### 💰 Sample RWF Ad Budgets\n| Budget | What You Get | Expected Results |\n|---|---|---|\n| 50,000 RWF/mo | Facebook + Instagram | 10,000-20,000 reach, 100-300 clicks |\n| 100,000 RWF/mo | Facebook + Google | 20,000-50,000 reach, 300-800 clicks |\n| 300,000 RWF/mo | Full platform mix | 100,000+ reach, 1,000+ leads |\n| 1,000,000 RWF/mo | Aggressive scaling | 500,000+ reach, 5,000+ leads |\n\n> 💡 **Start small!** Test with just 10,000 RWF on Facebook to see what works before scaling.',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=qRyBcfjFhKY', videoTitle: 'Facebook Ads for Small Business - Quick Start' },
          ),
          makeLesson(
            'Creating Ads That Convert',
            'Three elements of a great ad: right audience, compelling creative, clear offer. Covers ad formats, copywriting, A/B testing, and retargeting.\n\n### Ad Creative Tips:\n1. Use bright, clear images or short videos\n2. Lead with the benefit, not features\n3. Include social proof (testimonials, reviews)\n4. Create urgency (limited time, low stock)\n5. Test different versions with A/B testing',
            'article',
            2,
          ),
          makeLesson(
            'Influencer & Partnership Marketing',
            'Collaborate with influencers and businesses to accelerate growth. Find influencers in Rwanda, negotiate partnerships, and measure results.\n\n### Finding Influencers:\n- Search relevant hashtags on Instagram/TikTok\n- Check competitor collaborations\n- Focus on engagement, not just follower count\n- Start with micro-influencers (1,000-10,000 followers)\n- Offer free products or small payments',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Test your understanding of paid advertising.',
            [
              { question: 'What is A/B testing?', options: ['Showing different ads to compare performance', 'Testing the budget', 'Asking customer preferences', 'Two platforms at once'], correctIndex: 0, explanation: 'A/B testing runs variations to different segments to compare performance.' },
              { question: 'What is a micro-influencer?', options: ['1M+ followers', '1,000-10,000 followers', 'Only micro-content', 'Brand ambassador'], correctIndex: 1, explanation: 'Micro-influencers have smaller, highly engaged audiences of 1,000-10,000 followers.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Digital Marketing Project — Earn 200,000+ RWF!',
            'Your mission: Find a real client and run a real digital marketing campaign. Make real money!',
            '**REAL CLIENT CHALLENGE: Earn Your First 200,000+ RWF in 30 Days**\n\nYour mission: Find ONE real small business in Rwanda (a boutique, restaurant, salon, or farm) and run a real marketing campaign for them. Charge 100,000-300,000 RWF for 1 month of social media management.\n\n**Week 1: Find Your Client**\nWalk into 10 businesses in Kigali (Kimironko, Remera, Downtown). Offer a "free social media audit" worth 50,000 RWF. Then pitch: "I will manage your social media for 1 month, 4 posts/week — 150,000 RWF. If you do not get 10 new customers, it is free."\n\n**Week 2: Set Up & Content Plan**\nCreate/optimise their Facebook and Instagram. Use [Canva](https://www.canva.com) for 16 posts (4 per week). Set up [WhatsApp Business](https://www.whatsapp.com/business) catalogue if they sell products.\n\n**Week 3: Run a Facebook Ad (50,000 RWF budget)**\nCreate a simple ad via [Facebook Business Suite](https://business.facebook.com) targeting their local area. Budget: 50,000 RWF for 7 days. Track leads via WhatsApp.\n\n**🎯 Quick access links:** [Canva Free](https://www.canva.com) | [WhatsApp Business](https://www.whatsapp.com/business) | [Facebook Ads Manager](https://business.facebook.com) | [Google My Business](https://www.google.com/business)\n\n**Week 4: Report Results & Get Paid**\nShow client: reach, engagement, leads generated, sales. Collect your 150,000 RWF fee.\n\n**🎯 Total: 150,000-300,000 RWF in 30 days!** Do this for 3 clients = 450,000-900,000 RWF/month = iPhone money!\n\n![Digital marketing money](https://images.unsplash.com/photo-1553729459-afe8f2e0e8c5?auto=format&fit=crop&q=80&w=600&h=400)\n\n> **Pro Tip:** Start with a family member or friends business for practice. Once you have 1 success case, finding the next client is 10x easier!',
            [
              { question: 'Which client did you find? What business? What was your pitch and their response?', type: 'open', explanation: 'Describe the business, the owner, your pitch, and the outcome.', points: 20 },
              { question: 'Show your content plan: 16 posts created (4/week) with platform, format, and caption for each.', type: 'open', explanation: 'Share your Canva designs or a content calendar screenshot.', points: 20 },
              { question: 'Facebook Ad results: budget spent, reach, clicks, leads generated, cost per lead.', type: 'open', explanation: 'Show the actual ad dashboard metrics.', points: 20 },
              { question: 'TOTAL EARNINGS: How much did the client pay you? Would they continue? Referrals?', type: 'open', explanation: 'Report your real income from this project!', points: 25 },
            ],
            5,
          ),
        ],
        'Execute paid advertising campaigns and advanced growth strategies to scale a business.',
      ),

/* INSERT_MODULES_1 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 2: Mobile Money & Fintech in Africa
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Mobile Money Mastery: M-Pesa, MoMo & Fintech in Rwanda',
    description:
      ' Rwanda is going cashless — and mobile money is leading the way. This course teaches you everything about ' +
      'M-Pesa, Airtel Money, and the fintech revolution happening right now in East Africa. ' +
      'Learn how mobile payments work, how to start a fintech business, and how digital lending, insurance, ' +
      'and savings products are creating opportunities for Rwandan entrepreneurs and professionals.',
    category: 'Business',
    level: 'Intermediate',
    price: 1000,
    searchImage: 'mobile money payment fintech africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Understanding Mobile Money',
        'Learn the fundamentals of mobile money systems and their impact on African economies.',
        [
          makeLesson(
            'The Mobile Money Revolution in Africa',
            'Mobile money started with M-Pesa in Kenya in 2007 and has since spread across Africa. Today, ' +
            'over 500 million mobile money accounts exist globally, with the majority in Sub-Saharan Africa. ' +
            'This lesson explores the history, growth, and impact of mobile money on financial inclusion.\n\n' +
            '### Key Statistics:\n' +
            '- Sub-Saharan Africa accounts for 70% of global mobile money transactions\n' +
            '- Mobile money has lifted 2% of Kenyan households out of poverty\n' +
            '- Over 200 million active mobile money accounts in Africa',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=xcAC2iU1xvI', videoTitle: 'M-Pesa Explained - Mobile Money in 2 Min', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'How Mobile Money Works',
            'Understand the technical and business model behind mobile money. From USSD codes to smartphone apps, ' +
            'agent networks to transaction switching — this lesson breaks down how money moves in mobile financial services.\n\n' +
            '### Core Components:\n' +
            '1. **Registered agents** — The human ATM network\n' +
            '2. **USSD/SIM toolkit** — Works on any phone\n' +
            '3. **Transaction switching** — The backend that moves money\n' +
            '4. **Regulatory compliance** — Central bank oversight',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of mobile money fundamentals.',
            [
              {
                question: 'Which country pioneered mobile money with M-Pesa?',
                options: ['Nigeria', 'Kenya', 'South Africa', 'Ghana'],
                correctIndex: 1,
                explanation: 'M-Pesa was launched in Kenya by Safaricom in 2007.',
              },
              {
                question: 'What technology do most basic mobile money services use?',
                options: ['4G internet', 'USSD codes', 'Bluetooth', 'NFC'],
                correctIndex: 1,
                explanation: 'USSD codes work on any mobile phone, even without internet access.',
              },
              {
                question: 'What percentage of global mobile money transactions occur in Sub-Saharan Africa?',
                options: ['30%', '50%', '70%', '90%'],
                correctIndex: 2,
                explanation: 'Sub-Saharan Africa accounts for approximately 70% of global mobile money transactions.',
              },
            ],
            3,
          ),
        ],
        'Explain how mobile money systems work in Africa.',
      ),
      makeModule(
        'Module 2: Fintech Innovation & Opportunities',
        'Explore the broader fintech landscape and identify opportunities for innovation.',
        [
          makeLesson(
            'Digital Lending & Credit Scoring',
            'How fintech companies are using alternative data (airtime top-ups, mobile money transactions, social data) ' +
            'to provide credit to the unbanked. Learn about digital lending platforms, risk assessment, and responsible lending.\n\n' +
            '### Alternative Credit Scoring:\n' +
            '- Airtime recharge history\n' +
            '- Mobile money transaction patterns\n' +
            '- Utility bill payment history\n' +
            '- Social network analysis',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Building a Fintech Startup in Africa',
            'What it takes to build a fintech company in Africa — regulatory challenges, partnership models, ' +
            'infrastructure requirements, and go-to-market strategies. Real case studies from successful African fintechs.\n\n' +
            '### Success Factors:\n' +
            '- Partner with mobile network operators (MNOs)\n' +
            '- Navigate central bank regulations early\n' +
            '- Build for the unbanked — simple UI, offline support\n' +
            '- Focus on trust and security',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=c97IXtFAzlI', videoTitle: 'How Mobile Money M-Pesa Works - 2 Min' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review fintech innovation concepts.',
            [
              {
                question: 'What is alternative credit scoring?',
                options: [
                  'Using traditional bank statements',
                  'Using non-traditional data like airtime top-ups to assess creditworthiness',
                  'Using only collateral',
                  'A manual credit assessment process',
                ],
                correctIndex: 1,
                explanation: 'Alternative credit scoring uses non-traditional data to assess creditworthiness for the unbanked.',
              },
              {
                question: 'Who is a critical partner for fintech startups in Africa?',
                options: ['International banks', 'Mobile network operators', 'Global tech companies', 'Real estate firms'],
                correctIndex: 1,
                explanation: 'Mobile network operators provide essential infrastructure and customer access.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Fintech Innovation Project',
            'Design a fintech solution for an African market.',
            'Design a simple fintech product that solves a real problem in your community. Describe the target users, the problem, your solution, and how you would make money.',
            [
              {
                question: 'Describe your fintech product idea. What problem does it solve and who are the target users?',
                type: 'open',
                explanation: 'Focus on a real need — savings groups, agricultural insurance, school fee payments, etc.',
                points: 20,
              },
              {
                question: 'What regulatory considerations would you need to address?',
                type: 'open',
                explanation: 'Consider central bank licensing, data protection, anti-money laundering requirements.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Identify and analyse fintech opportunities in African markets.',
      ),


      makeModule(
        'Module 3: Digital Lending & Alternative Credit',
        'Understand how fintech companies provide credit to the unbanked using alternative data and technology.',
        [
          makeLesson(
            'The Digital Lending Revolution in Africa',
            'Explore how Branch, Tala, M-Shwari, and local lenders use mobile data to assess creditworthiness and disburse loans within minutes.\n\n### Key Players:\n- M-Shwari (Kenya): Savings/loan on M-Pesa\n- Branch: App-based loans via smartphone data\n- Tala: Alternative credit scoring via behaviour\n- Local: Urubuto, AC Group, BK TecHouse',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=yF7wk_p3Q78', videoTitle: 'Digital Lending in Africa' },
          ),
          makeLesson(
            'Alternative Credit Scoring Models',
            'Traditional credit scores exclude most Africans. Learn how mobile money, airtime, social data, and smartphone behaviour assess creditworthiness.\n\n### Alternative Data Sources:\n1. Mobile money transaction history\n2. Airtime recharge patterns\n3. Social media activity\n4. Smartphone usage patterns\n5. Utility bill payments\n6. E-commerce transaction data',
            'article',
            2,
          ),
          makeLesson(
            'Responsible Lending & Regulation',
            'BNR regulations, responsible lending principles, and balancing profitability with customer welfare.\n\n### Principles:\n1. Transparent pricing and terms\n2. Affordable loans based on repayment ability\n3. Fair debt collection practices\n4. Customer data protection\n5. Financial education for borrowers',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review digital lending concepts.',
            [
              { question: 'Which is an alternative credit data source?', options: ['Bank history', 'Mobile money transactions', 'Property ownership', 'Employer reference'], correctIndex: 1, explanation: 'Mobile money transactions are a key alternative data source.' },
              { question: 'Which institution regulates digital lending in Rwanda?', options: ['RDB', 'BNR', 'RURA', 'RSB'], correctIndex: 1, explanation: 'BNR regulates all lending activities including digital lending.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Credit Scoring Model Project',
            'Design an alternative credit scoring model for Rwanda.',
            'Create a credit scoring framework using non-traditional data for a borrower without a bank account.',
            [
              { question: 'Design a credit scoring model using mobile money data. What data points, how would you score, and what loan limits?', type: 'open', explanation: 'Consider: transaction volume, income consistency, savings, airtime, bill payments.', points: 20 },
              { question: 'What safeguards prevent over-indebtedness in your lending product?', type: 'open', explanation: 'Consider: loan limits, cooling-off periods, debt detection, financial education.', points: 15 },
            ],
            5,
          ),
        ],
        'Design alternative credit scoring models and understand digital lending regulation.',
      ),

      makeModule(
        'Module 4: Building a Fintech Startup',
        'Learn practical steps to launch a fintech startup in Africa.',
        [
          makeLesson(
            'The Fintech Regulatory Journey in Rwanda',
            'Step-by-step regulatory guide: RDB registration, BNR compliance, licensing, and sandbox testing.\n\n### Steps:\n1. Register company with RDB\n2. Submit business plan to BNR\n3. Technology and security audit\n4. Obtain licences (payment service provider, digital lender)\n5. Sandbox testing via BNR\n6. Full licence and launch',
            'article',
            1,
          ),
          makeLesson(
            'Building an MVP Fintech Product',
            'Build a simple MVP using USSD, mobile money APIs, and no-code platforms. Test with real users before scaling.\n\n### MVP Approach:\n1. Start with USSD - works on any phone\n2. Use MTN/Airtel Money APIs\n3. Build simple web app with basic features\n4. Test with small group of real users\n5. Iterate based on feedback',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=vaf4v0hW7wI', videoTitle: 'Build a Fintech App - 3 Minute Guide' },
          ),
          makeLesson(
            'Partnerships & Go-To-Market Strategy',
            'Form partnerships with MNOs, banks, SACCOs, and agents. Go-to-market strategies for Rwanda.\n\n### Key Partners:\n1. MNOs (MTN, Airtel) - Mobile money infrastructure\n2. Banks (BK, Equity, I&M) - Licence and trust\n3. SACCOs - Rural distribution\n4. Agent networks - Last-mile acquisition\n5. Government - Regulatory support',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review fintech startup concepts.',
            [
              { question: 'First regulatory step to launch fintech in Rwanda?', options: ['Bank licence', 'Register with RDB', 'Hire 50 people', 'Raise $1M'], correctIndex: 1, explanation: 'Company registration with RDB is the first step.' },
              { question: 'Why start with USSD for fintech?', options: ['More profitable', 'Works on any phone', 'Faster to code', 'Looks professional'], correctIndex: 1, explanation: 'USSD works on any phone, reaching feature phone users who are the majority.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Fintech Startup Plan',
            'Develop a complete fintech launch plan.',
            'Create a plan including problem, solution, target market, regulatory pathway, and revenue model.',
            [
              { question: 'Describe a fintech startup idea for Rwanda with problem, users, solution, revenue, and BNR licence needed.', type: 'open', explanation: 'Consider savings, lending, payments, insurance, or investments for the Rwandan market.', points: 20 },
              { question: 'How would you acquire your first 1,000 users?', type: 'open', explanation: 'Consider: agent networks, SACCOs, universities, WhatsApp, and referral programmes.', points: 15 },
            ],
            5,
          ),
        ],
        'Navigate fintech regulation and launch a fintech startup in Rwanda.',
      ),

      makeModule(
        'Module 5: Future of Fintech & Career Opportunities',
        'Explore emerging trends and careers in African fintech.',
        [
          makeLesson(
            'Blockchain, CBDCs & Open Banking in Africa',
            'Learn about CBDCs, blockchain for financial inclusion, and open banking APIs. Examples from across Africa.\n\n### Trends:\n1. CBDCs - Digital national currencies\n2. Blockchain - DeFi for the unbanked\n3. Open Banking - Third-party access to bank data\n4. Embedded Finance - Financial services in apps\n5. AI in Fintech - Chatbots, fraud detection',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Y1mJgTt6GJk', videoTitle: 'Future of Fintech in Africa' },
          ),
          makeLesson(
            'Fintech Career Paths & Skills',
            'Discover careers in fintech: product management, engineering, compliance, data science, and business development.\n\n### In-Demand Skills:\n1. Product management - Building solutions for users\n2. Mobile dev - Android, iOS, USSD, cross-platform\n3. Data science - Credit scoring, fraud detection\n4. Compliance & AML - Regulatory knowledge\n5. Business development - Partnerships, growth\n6. UX/UI design - Simple financial interfaces',
            'article',
            2,
          ),
          makeLesson(
            'Financial Inclusion & Social Impact',
            'Fintech reaches underserved populations: rural farmers, women, youth, and small businesses.\n\n### Impact Areas:\n1. Rural access - Agent networks in villages\n2. Women inclusion - Products for female entrepreneurs\n3. Youth savings - Digital accounts for young people\n4. Agricultural finance - Insurance and loans\n5. Refugee services - Digital identities for displaced',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review future fintech trends.',
            [
              { question: 'What does CBDC stand for?', options: ['Central Bank Digital Currency', 'Commercial Bank Deposit Certificate', 'Cryptocurrency Blockchain Digital Coin', 'Central Business Data Centre'], correctIndex: 0, explanation: 'CBDC is a digital version of a country official currency.' },
              { question: 'Most in-demand fintech compliance skill?', options: ['Graphic design', 'AML knowledge', 'Video editing', 'Social media'], correctIndex: 1, explanation: 'Anti-Money Laundering knowledge is critical for fintech compliance roles.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Fintech Project — Build & Earn with Mobile Money!',
            'Your mission: Create a real mobile-money-based service and earn your first 50,000+ RWF!',
            '**FINITECH MICRO-PROJECT: Earn 50,000-200,000 RWF Using Mobile Money**\n\nYour mission: Launch a real service that uses MTN MoMo or Airtel Money to solve a problem and make money.\n\n**Business Ideas Using Mobile Money:**\n1. **Mobile Money Agent Assistant** — Help elderly/less-educated people use MoMo via [MTN MoMo](https://www.mtn.co.rw/momo) or [Airtel Money](https://www.airtel.co.rw/airtel-money). Charge 500 RWF per transaction. 100 transactions = 50,000 RWF.\n2. **SACCO Digital Registrar** — Help a local savings group (SACCO/ikibina) digitise their records. Charge 100,000 RWF setup + 20,000 RWF/month.\n3. **MoMo Payment Collection Service** — Collect payments for small businesses via MoMo (school fees, rent, products). Charge 5% fee. Collect 2,000,000 RWF = 100,000 RWF earnings.\n4. **Airtime & Bundle Reseller** — Buy wholesale airtime/data bundles via [MTN Airtime](https://www.mtn.co.rw/bundles) or [Airtel Data](https://www.airtel.co.rw/data), sell retail via WhatsApp. 10-15% profit margin.\n5. **Digital Savings Challenge** — Create a WhatsApp group savings challenge. Members send 5,000 RWF/week via MoMo. You manage the group for 10% of total saved.\n\n**🎯 Quick access links:** [MTN MoMo](https://www.mtn.co.rw/momo) | [Airtel Money](https://www.airtel.co.rw/airtel-money) | [BNR Rwanda](https://www.bnr.rw) | [RDB Registration](https://irembo.gov.rw)\n\n**🎯 Target: 50,000-200,000 RWF in 30 days!** Scale to 500,000+ RWF/month = iPhone money!\n\n![Mobile money](https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600&h=400)\n\n> **Pro Tip:** The most successful fintech in Rwanda started with ONE simple service. M-Pesa started as "send money via SMS." Start simple, then add features!',
            [
              { question: 'YOUR FINITECH SERVICE: What service did you launch? How does it use mobile money? What problem does it solve?', type: 'open', explanation: 'Describe your service, target users, and how MoMo enables it.', points: 20 },
              { question: 'CUSTOMERS: How many customers did you acquire? How did you find them? What was their feedback?', type: 'open', explanation: 'Share your customer acquisition strategy and real feedback.', points: 20 },
              { question: 'FINANCIALS: Total revenue? Total costs (if any)? Net profit? MoMo transaction volume?', type: 'open', explanation: 'Show real numbers from your service.', points: 20 },
              { question: 'SCALE PLAN: How would you scale this to 1,000+ customers? What would you need? Revenue potential?', type: 'open', explanation: 'Your growth strategy based on real experience.', points: 25 },
            ],
            5,
          ),
        ],
        'Identify fintech career opportunities and understand emerging industry trends.',
      ),

/* INSERT_MODULES_2 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 3: Freelancing & Remote Work Mastery
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Earn in Dollars: Freelancing & Remote Work from Rwanda',
    description:
      ' Make money in RWF and earn in USD — no office required. This course shows you how to ' +
      'start freelancing on Upwork and Fiverr, even with zero experience. ' +
      'Learn to build a profile that gets hired, write winning proposals, impress international clients, ' +
      'and receive payments easily. Perfect for Rwandan graduates and professionals ' +
      'who want to earn globally while living in Rwanda.\n\n' +
      '### 🧰 Your Freelance Toolbox\n' +
      '| Platform | Purpose | Fees | Sign Up |\n' +
      '|---|---|---|---|\n' +
      '| Upwork | Client projects, long-term work | 20% first $500, then 5% | [upwork.com](https://www.upwork.com) |\n' +
      '| Fiverr | Micro-gigs, creative services | 20% flat fee | [fiverr.com](https://www.fiverr.com) |\n' +
      '| Payoneer | Receive USD/EUR payments | 1-2% withdrawal | [payoneer.com](https://www.payoneer.com) |\n' +
      '| PayPal | International payments | 2.9% + $0.30 | [paypal.com](https://www.paypal.com) |\n' +
      '| LinkedIn | Professional networking | Free | [linkedin.com](https://www.linkedin.com) |\n' +
      '| Canva | Portfolio design, proposals | Free tier | [canva.com](https://www.canva.com) |\n' +
      '| freeCodeCamp | Learn web dev free | Free | [freecodecamp.org](https://www.freecodecamp.org) |\n' +
      '| Google Skills | Digital marketing cert | Free | [grow.google](https://grow.google) |',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'remote work freelancing laptop africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Getting Started as a Freelancer',
        'Learn how to set up your freelancing business and find your first clients.',
        [
          makeLesson(
            'Why Freelancing is the Future for African Professionals',
            'The global freelance economy is worth over $1.5 trillion. African freelancers have a competitive advantage — ' +
            'competitive rates, English proficiency in many countries, and a growing digital infrastructure. ' +
            'This lesson explores the opportunities and how to position yourself for success.\n\n' +
            '### Benefits:\n' +
            '- Earn in USD, EUR, or GBP while living in Africa\n' +
            '- Flexible working hours\n' +
            '- Build a global portfolio\n' +
            '- No commuting costs',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=k3A4XPtcON0', videoTitle: 'How to Start Freelancing - Complete Guide in 3 Min' },
          ),
          makeLesson(
            'Setting Up Your Freelancing Business',
            'From choosing your niche to registering on platforms — everything you need to get started. ' +
            'Learn about Upwork, Fiverr, Freelancer.com, Toptal, and niche platforms for specific skills.\n\n' +
            '### Platform Comparison\n' +
            '| Platform | Best For | Fee | Min Payout | Rwanda Access |\n' +
            '|---|---|---|---|---|\n' +
            '| Upwork | Long-term projects, $15-50/hr | 20% first $500, then 5% | $100 bank/Payoneer | ✅ Yes |\n' +
            '| Fiverr | Quick gigs, $20-500/project | 20% flat | $20 PayPal/Bank | ✅ Yes |\n' +
            '| Freelancer.com | Contests, hourly work | 10-15% | $30 minimum | ✅ Yes |\n' +
            '| Toptal | Premium dev/design, $60-100/hr | Free to join | Direct bank | ⚠️ Invite only |\n' +
            '| LinkedIn Pro | Consulting, networking | Free basic | Direct payout | ✅ Yes |\n' +
            '| PeoplePerHour | Creative work, UK focus | 20% | £50 min | ✅ Yes |\n\n' +
            '### Getting Started Checklist:\n' +
            '- [ ] Identify your in-demand skill (pick one from Module 3)\n' +
            '- [ ] Create Upwork profile with professional photo\n' +
            '- [ ] Upload 3 portfolio samples\n' +
            '- [ ] Set rate at $15-25/hr to start\n' +
            '- [ ] Write 5 sample proposals\n' +
            '- [ ] Set up Payoneer account to receive payments\n' +
            '- [ ] Add 2-3 skill tags',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your freelancing fundamentals.',
            [
              {
                question: 'What is the largest global freelancing platform?',
                options: ['Fiverr', 'Upwork', 'Freelancer.com', 'Toptal'],
                correctIndex: 1,
                explanation: 'Upwork is the largest freelancing platform by transaction volume.',
              },
              {
                question: 'What is a key advantage of freelancing from Africa?',
                options: ['Lower taxes always', 'Competitive rates + global earning potential', 'Free internet', 'Guaranteed clients'],
                correctIndex: 1,
                explanation: 'African freelancers can earn in strong currencies while enjoying competitive cost advantages.',
              },
            ],
            3,
          ),
        ],
        'Launch a freelancing profile on a global platform.',
      ),
      makeModule(
        'Module 2: Winning Clients & Growing Your Business',
        'Master the skills needed to win clients and scale your freelancing business.',
        [
          makeLesson(
            'Writing Winning Proposals',
            'Your proposal is your first impression. Learn how to write proposals that get responses, ' +
            'stand out from hundreds of applicants, and convert to paying clients.\n\n' +
            '### Proposal Template:\n' +
            '1. **Greeting** — Personalise with their name\n' +
            '2. **Understanding** — Show you understand their project\n' +
            '3. **Your solution** — How you will solve their problem\n' +
            '4. **Experience** — Relevant samples\n' +
            '5. **Call to action** — Invite them to chat',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Client Communication & Relationship Management',
            'How to communicate professionally with clients across different time zones, manage expectations, ' +
            'handle revisions, and build long-term relationships that lead to repeat business and referrals.\n\n' +
            '### Communication Tips:\n' +
            '- Respond within 24 hours\n' +
            '- Over-communicate progress\n' +
            '- Set clear boundaries on revisions\n' +
            '- Always deliver on time',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=y-YxIZhA5IA', videoTitle: 'Freelancing Tips - How to Get Clients Fast' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review client-winning strategies.',
            [
              {
                question: 'What is the most important part of a winning proposal?',
                options: ['A low price', 'Understanding the clients problem', 'A long bio', 'Fancy formatting'],
                correctIndex: 1,
                explanation: 'Clients want to know you understand their specific problem and have a solution.',
              },
              {
                question: 'How quickly should you respond to client messages?',
                options: ['Within 24 hours', 'Within a week', 'Only on weekdays', 'Whenever you feel like it'],
                correctIndex: 0,
                explanation: 'Responding within 24 hours shows professionalism and reliability.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final Freelancing Project',
            'Apply everything you have learned.',
            'Create a complete freelancing profile and write a sample proposal for a real job posting.',
            [
              {
                question: 'Write a proposal for a freelance job posting of your choice. Include the greeting, understanding, solution, experience, and call to action.',
                type: 'open',
                explanation: 'Use the 5-part template from the lesson. Keep it concise and focused on the clients needs.',
                points: 25,
              },
              {
                question: 'What are three strategies to get your first freelance client?',
                type: 'open',
                explanation: 'Consider: bidding competitively, offering a small free sample, leveraging LinkedIn, or asking for referrals.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Win your first freelance client and build a sustainable business.',
      ),


      makeModule(
        'Module 3: High-Income Skills for Freelancers',
        'Learn which freelance skills pay the most and how to develop them from scratch.',
        [
          makeLesson(
            'Top High-Income Freelance Skills',
            'Web development, copywriting, graphic design, video editing, virtual assistance, and digital marketing.\n\n' +
            '### Rates & Earning Potential (in RWF)\n' +
            '| Skill | USD Rate | Rwandan Rate (1 USD ≈ 1,350 RWF) | Monthly Potential |\n' +
            '|---|---|---|---|\n' +
            '| Web Development | $15-50/hr | 20,250-67,500 RWF/hr | 1,620,000-5,400,000 RWF/mo |\n' +
            '| Copywriting | $20-100/project | 27,000-135,000 RWF/project | 810,000-2,700,000 RWF/mo |\n' +
            '| Graphic Design | $15-45/hr | 20,250-60,750 RWF/hr | 1,620,000-4,860,000 RWF/mo |\n' +
            '| Video Editing | $20-60/video | 27,000-81,000 RWF/video | 540,000-1,620,000 RWF/mo |\n' +
            '| Virtual Assistant | $5-15/hr | 6,750-20,250 RWF/hr | 540,000-1,620,000 RWF/mo |\n' +
            '| Digital Marketing | $15-40/hr | 20,250-54,000 RWF/hr | 1,620,000-4,320,000 RWF/mo |\n' +
            '| Data Entry | $3-8/hr | 4,050-10,800 RWF/hr | 324,000-864,000 RWF/mo |\n' +
            '| Translation | $0.05-0.15/word | 68-203 RWF/word | 405,000-1,215,000 RWF/mo |\n\n' +
            '> 💡 **Reality check:** Most freelancers start earning $200-500/mo (270,000-675,000 RWF) in their first year. ' +
            'With experience and reviews, you will scale to $1,000-3,000/mo (1,350,000-4,050,000 RWF).',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Uj7Wz3fY0YM', videoTitle: 'Highest Paying Freelance Skills 2025' },
          ),
          makeLesson(
            'Learn Skills for Free',
            'Free resources: freeCodeCamp, Google Digital Skills for Africa, Canva Design School, HubSpot Academy, YouTube.\n\n### Free Platforms:\n1. freeCodeCamp - Web development (free cert)\n2. Google Skills for Africa - Digital marketing\n3. Canva Design School - Graphic design\n4. HubSpot Academy - Marketing, sales, service\n5. ALX Africa - Professional programmes',
            'article',
            2,
          ),
          makeLesson(
            'Build a Portfolio With No Experience',
            'Overcome the experience paradox: build a portfolio from scratch.\n\n### Strategies:\n1. Volunteer for local NGOs\n2. Create sample projects for imaginary businesses\n3. Redesign existing websites for your portfolio\n4. Document learning on LinkedIn\n5. Offer discounts to first 5 clients for testimonials',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test knowledge of freelance skills.',
            [
              { question: 'Highest-paying freelance skill?', options: ['Data entry', 'Web development', 'Social media', 'Virtual assistance'], correctIndex: 1, explanation: 'Web development pays $15-50/hour.' },
              { question: 'Free platform for web development certification?', options: ['LinkedIn Learning', 'freeCodeCamp', 'Udemy', 'Skillshare'], correctIndex: 1, explanation: 'freeCodeCamp offers free certifications with hands-on projects.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Skill Development Plan',
            'Create a 90-day learning plan.',
            'Choose a skill and create a plan with resources, projects, and milestones.',
            [
              { question: 'Create a 90-day learning plan for a high-income skill with free resources, projects, and weekly milestones.', type: 'open', explanation: 'Include course names, project ideas, and measurable completion criteria.', points: 20 },
              { question: 'Describe 3 portfolio projects you will create to showcase this skill.', type: 'open', explanation: 'Example: redesign a restaurant website, create NGO graphics, write blog posts.', points: 15 },
            ],
            5,
          ),
        ],
        'Develop a high-income freelance skill and build a compelling portfolio.',
      ),

      makeModule(
        'Module 4: Personal Branding & LinkedIn Mastery',
        'Build your professional brand online to attract clients and opportunities.',
        [
          makeLesson(
            'Creating Your Professional Brand',
            'Define your identity, craft your story, and present consistently across platforms.\n\n### Brand Elements:\n1. Define your niche - What problem do you solve?\n2. Craft your story - Why you and why this matters\n3. Consistent visuals - Photo, colours, logo\n4. Your voice - Professional, helpful, authentic\n5. Value proposition - Why choose you?',
            'article',
            1,
          ),
          makeLesson(
            'LinkedIn Optimisation for Freelancers',
            'Optimise your profile: headline, about, featured, experience, and recommendations.\n\n### Checklist:\n1. Professional headshot\n2. Headline: what you do + who you help\n3. About: clear value proposition\n4. Featured: portfolio samples\n5. Recommendations from clients\n6. Post 2-3 times per week',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=b3x3TjG7H2I', videoTitle: 'LinkedIn Profile Optimisation' },
          ),
          makeLesson(
            'Content Marketing to Attract Clients',
            'Make clients come to you with valuable content.\n\n### Content Ideas:\n1. Case studies - Solved problems\n2. Tutorials - Teach your niche skills\n3. Industry insights - Trends and observations\n4. Behind-the-scenes - Your workflow\n5. Client results - Before and after\n6. Personal stories - Lessons learned',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review personal branding concepts.',
            [
              { question: 'Most important on LinkedIn for freelancers?', options: ['Connection count', 'Clear headline stating value', 'Long work history', 'Fancy design'], correctIndex: 1, explanation: 'Your headline should clearly communicate what you do.' },
              { question: 'Best content to attract freelance clients?', options: ['Vacation photos', 'Educational content', 'Funny memes', 'Politics'], correctIndex: 1, explanation: 'Educational content positions you as an authority.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Personal Brand Launch',
            'Create your professional brand package.',
            'Develop bio, LinkedIn headline, value proposition, and content strategy.',
            [
              { question: 'Write your LinkedIn profile: headline (max 220 chars), About (2-3 paragraphs), and Featured plan (3 items).', type: 'open', explanation: 'Headline: skill + who you help + results. Example: Web Developer helping Rwandan businesses build websites.', points: 20 },
              { question: 'Create a 2-week LinkedIn content calendar with 6 posts (topic, format, key message).', type: 'open', explanation: 'Mix: case study, tutorial, insight, story, tip, and CTA.', points: 15 },
            ],
            5,
          ),
        ],
        'Build a professional brand and optimise LinkedIn to attract freelance clients.',
      ),

      makeModule(
        'Module 5: Managing Your Freelance Business',
        'Master pricing, contracts, taxes, and scaling your freelance income.',
        [
          makeLesson(
            'Pricing, Invoicing & Getting Paid',
            'Set rates, create invoices, and get paid via mobile money, PayPal, and Payoneer.\n\n### Pricing Strategies\n' +
            '| Strategy | When to Use | Example | Rwandan Advantage |\n' +
            '|---|---|---|---|\n' +
            '| Hourly | Ongoing work, unclear scope | $20/hr for admin tasks | Competitive $5-15/hr rate |\n' +
            '| Project | Defined scope, one-time | $500 for website | Charge USD, earn RWF |\n' +
            '| Value-based | High-impact projects | $2,000 for e-commerce site | 10x your hourly rate |\n' +
            '| Retainer | Monthly recurring work | $800/mo for social media | Predictable income |\n' +
            '| Package | Bundled services | $300 for logo + brand guide | Easy for clients to say yes |\n\n' +
            '### Payment Method Comparison\n' +
            '| Method | Receive | Withdrawal to Rwanda | Fee | Speed |\n' +
            '|---|---|---|---|---|\n' +
            '| Payoneer | USD from Upwork/Fiverr | MoMo or bank | 1.5% | 1-3 days |\n' +
            '| PayPal | USD/EUR from clients | Bank transfer | 2.9% + $0.30 | 3-5 days |\n' +
            '| Wise (TransferWise) | USD/EUR/GBP | Direct to bank | 0.5-1.5% | 1-2 days |\n' +
            '| Mobile Money (MoMo) | Direct MoMo | Instant in RWF | 0-2% | Instant |\n' +
            '| Bank Wire | Direct from client | Bank account | $15-30 fee | 3-7 days |\n' +
            '| Crypto (USDT) ⚠️ Advanced | Fast but volatile | P2P exchange | 1-3% | 10 min |\n\n' +
            '> 🇷🇼 **Pro Tip:** Most Rwandan freelancers use Payoneer to receive USD from Upwork, ' +
            'then withdraw to their MoMo account. The total fee is about 3% — much cheaper than PayPal!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=4F0lDv3J8Yk', videoTitle: 'Freelance Pricing Guide' },
          ),
          makeLesson(
            'Contracts, Scope Creep & Boundaries',
            'Essential contract elements, preventing scope creep, and setting client boundaries.\n\n### Contract Essentials:\n1. Scope of work\n2. Timeline\n3. Price and payment terms\n4. Revision policy\n5. Termination clause\n6. Confidentiality',
            'article',
            2,
          ),
          makeLesson(
            'Taxes & Financial Planning for Freelancers',
            'RRA registration, TIN, quarterly filings, VAT threshold (20M RWF), and saving for irregular income.\n\n### Obligations:\n1. Register with RRA for TIN\n2. Register for Income Tax\n3. VAT if turnover > 20M RWF\n4. File quarterly returns\n5. Keep income/expense records\n6. Consider hiring an accountant',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review freelance business management.',
            [
              { question: 'What is scope creep?', options: ['Growing too fast', 'Client requesting extra work outside agreement', 'Multiple projects', 'Increasing rates'], correctIndex: 1, explanation: 'Scope creep means additional work beyond the agreed scope.' },
              { question: 'VAT registration threshold in Rwanda?', options: ['10M RWF', '20M RWF', '50M RWF', '100M RWF'], correctIndex: 1, explanation: 'VAT registration is required above 20M RWF annual turnover.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Freelance Project — Earn Your First $200 (265,000 RWF)!',
            'Your mission: Land a REAL freelance client on Upwork or Fiverr and earn real USD!',
            '**LAND YOUR FIRST FREELANCE CLIENT CHALLENGE: Target $200+ (265,000+ RWF)**\n\nYour mission: Get hired by a REAL international client and complete a paid project. No simulations!\n\n**Step 1: Choose Your Skill (Day 1)**\nPick ONE service to offer: logo design (Fiverr), article writing (Upwork), video editing (Fiverr), virtual assistant (Upwork), or social media management.\n\n**Step 2: Create Your Profile (Day 1-2)**\n- Upwork: Professional photo, headline with keywords, portfolio with 3 samples, set rate at $15-25/hour\n- Fiverr: Create 3 gigs starting at $20, $50, $100\n\n**Step 3: Send 20 Proposals (Day 3-7)**\n- Search for jobs with "beginner friendly" or "entry level"\n- Use the 5-part proposal template from Module 2\n- Apply to 20+ jobs minimum\n- Target: 3-5 interview requests\n\n**Step 4: Win Your First Client (Day 8-14)**\n- Respond within 1 hour\n- Offer a small discount or faster delivery\n- Get that first contract!\n\n**Step 5: Deliver & Get Paid (Day 15-30)**\n- Over-deliver on quality\n- Ask for 5-star review\n- Withdraw via Payoneer or PayPal to MoMo\n\n**🎯 Quick access links:** [Create Upwork Account](https://www.upwork.com) | [Create Fiverr Account](https://www.fiverr.com) | [Payoneer Signup](https://www.payoneer.com) | [LinkedIn Profile](https://www.linkedin.com)\n\n**🎯 Target: $200+ = 265,000+ RWF from your first client!** Once you have 1 five-star review, getting clients becomes 5x easier. Next target: $1,000/month = 1,300,000 RWF = iPhone money!\n\n![Freelancing money](https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600&h=400)\n\n> **Pro Tip:** Rwandan freelancers earn $10-30/hour on average. With 5 hours/week = $200-600/month (265,000-800,000 RWF) extra income while studying or working!',
            [
              { question: 'SKILL & PROFILE: Which freelance skill did you choose? Share your Upwork/Fiverr profile link.', type: 'open', explanation: 'Describe your niche, rate, and portfolio samples.', points: 20 },
              { question: 'PROPOSALS: How many proposals did you send? How many responses/interviews? Share one winning proposal.', type: 'open', explanation: 'Include your full proposal text and the clients response.', points: 20 },
              { question: 'FIRST CLIENT: What project did you win? Describe the scope, timeline, and payment amount.', type: 'open', explanation: 'Share the contract details and client requirements.', points: 20 },
              { question: 'TOTAL EARNINGS: How much did you earn in USD? In RWF? Client review received? Next steps?', type: 'open', explanation: 'Report your real income! Screenshot of payment receipt.', points: 25 },
            ],
            5,
          ),
        ],
        'Manage your freelance business professionally with proper contracts and finances.',
      ),

/* INSERT_MODULES_3 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 4: Entrepreneurship & Business Planning
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Start Your Business in Rwanda: From Idea to Launch',
    description:
      ' You have an idea — now make it real. From registering at RDB to writing a business plan that gets funded. ' +
      'This course uses real examples from Rwandan startups (PesaChoice, Yego, HeHe) to show you ' +
      'exactly how to validate your idea, find customers, raise capital, and launch successfully. ' +
      'Includes templates designed for the Rwandan market — financial projections, pitch decks, and more.',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'entrepreneurship business planning africa startup',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Finding Your Business Idea',
        'Learn how to identify business opportunities and validate your ideas.',
        [
          makeLesson(
            'Identifying Business Opportunities & Writing a Plan',
            'Africa is full of untapped business opportunities. From solving everyday problems to leveraging technology, ' +
            'this lesson helps you identify viable business ideas that address real market needs.\n\n' +
            '### Opportunity Sources:\n' +
            '- **Pain points** — What frustrates people daily?\n' +
            '- **Gaps in the market** — What is missing in your community?\n' +
            '- **Trends** — What is growing (mobile money, e-commerce, health tech)?\n' +
            '- **Skills** — What can you do better than others?',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=uZVTKZ8RSnc', videoTitle: 'Business Plan in 3 Minutes - Quick Start' },
          ),
          makeLesson(
            'Validating Your Business Idea',
            'Before you invest time and money, validate that people will actually pay for your solution. ' +
            'Learn customer discovery, surveys, minimum viable products (MVPs), and the lean startup methodology.\n\n' +
            '### Validation Steps:\n' +
            '1. Talk to 20+ potential customers\n' +
            '2. Identify their biggest pain point\n' +
            '3. Build a simple MVP\n' +
            '4. Get feedback and iterate\n' +
            '5. Only then — build and launch',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of business opportunity identification.',
            [
              {
                question: 'What is the first step in validating a business idea?',
                options: ['Register the company', 'Talk to potential customers', 'Build the full product', 'Hire employees'],
                correctIndex: 1,
                explanation: 'Always talk to potential customers first to understand their real needs.',
              },
              {
                question: 'What does MVP stand for in entrepreneurship?',
                options: ['Most Valuable Product', 'Minimum Viable Product', 'Maximum Viable Product', 'Minimum Value Product'],
                correctIndex: 1,
                explanation: 'A Minimum Viable Product is the simplest version that solves the core problem.',
              },
            ],
            3,
          ),
        ],
        'Identify and validate a viable business opportunity.',
      ),
      makeModule(
        'Module 2: Business Planning & Funding',
        'Write a solid business plan and learn how to raise capital.',
        [
          makeLesson(
            'Writing a Business Plan',
            'A business plan is your roadmap. Learn how to write each section: executive summary, company description, ' +
            'market analysis, organisation, product line, marketing, and financial projections.\n\n' +
            '### Business Plan Sections:\n' +
            '1. **Executive Summary** — One-page overview\n' +
            '2. **Company Description** — What you do and why\n' +
            '3. **Market Analysis** — Who are your customers and competitors?\n' +
            '4. **Marketing Strategy** — How will you reach customers?\n' +
            '5. **Financial Projections** — Revenue, costs, profitability',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Raising Capital in Africa',
            'From bootstrapping to venture capital — understand the fundraising landscape in Africa. ' +
            'Learn about angel investors, VC firms, government grants, bank loans, and alternative financing.\n\n' +
            '### Funding Sources in Africa:\n' +
            '- **Bootstrapping** — Self-fund from revenue\n' +
            '- **Angel investors** — High-net-worth individuals\n' +
            '- **Venture capital** — For high-growth startups\n' +
            '- **Government grants** — Youth and women in business programs\n' +
            '- **Microfinance** — Small business loans',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=ZEMbKzy7FD8', videoTitle: 'Entrepreneurship 101 - Business Plan Basics' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review business planning concepts.',
            [
              {
                question: 'Which section of a business plan comes first?',
                options: ['Financial Projections', 'Executive Summary', 'Market Analysis', 'Marketing Strategy'],
                correctIndex: 1,
                explanation: 'The executive summary is the first section and provides an overview of the entire plan.',
              },
              {
                question: 'What is bootstrapping?',
                options: ['Getting a bank loan', 'Self-funding your business from revenue', 'Raising VC money', 'Applying for grants'],
                correctIndex: 1,
                explanation: 'Bootstrapping means funding your business using your own resources and revenue.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Business Plan Project',
            'Create a complete business plan for your business idea.',
            'Write a mini business plan for your chosen business idea. Include the executive summary, market analysis, and financial projections.',
            [
              {
                question: 'Write the executive summary for your business idea (200-300 words).',
                type: 'open',
                explanation: 'Cover: the problem, your solution, target market, business model, and why you will succeed.',
                points: 20,
              },
              {
                question: 'Create simple financial projections for your first year of operation (estimated revenue and costs).',
                type: 'open',
                explanation: 'Include: startup costs, monthly operating costs, projected revenue, and break-even timeline.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Write a complete business plan and identify funding sources.',
      ),


      makeModule(
        'Module 3: Business Registration & Legal Essentials',
        'Navigate legal requirements to register and operate a business in Rwanda.',
        [
          makeLesson(
            'Registering Your Business at RDB',
            'Step-by-step process: choose structure, reserve name, prepare documents, submit via Irembo, pay fees.\n\n### Steps:\n1. Choose structure (sole proprietorship, limited company, cooperative)\n2. Search and reserve company name\n3. Prepare documents (IDs, proof of address)\n4. Submit on RDB Irembo platform\n5. Pay fees (from 30,000 RWF)\n6. Receive certificate (24-72 hours)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=J_rYp0Fr3WI', videoTitle: 'Register a Business in Rwanda' },
          ),
          makeLesson(
            'Business Licences & Tax Registration',
            'Common licences, RRA registration, and sector-specific permits.\n\n### Registrations:\n1. RRA TIN - Required for all businesses\n2. Professional licence - Regulated professions\n3. Sector permit - Hospitality, transport, food\n4. Environmental clearance - Certain activities\n5. RSSB registration - For businesses with employees',
            'article',
            2,
          ),
          makeLesson(
            'Intellectual Property Protection',
            'Trademarks, copyright, patents, and trade secrets through RDB IP department.\n\n### Protection Options:\n1. Trademark - Brand name, logo, slogan\n2. Copyright - Creative works\n3. Patent - Inventions\n4. Trade secret - Confidential information',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test business registration knowledge.',
            [
              { question: 'Which body handles business registration in Rwanda?', options: ['MINECOFIN', 'RDB', 'RRA', 'RURA'], correctIndex: 1, explanation: 'RDB handles all business registration in Rwanda.' },
              { question: 'First step in registering a business?', options: ['Pay fees', 'Choose structure', 'Find office', 'Hire staff'], correctIndex: 1, explanation: 'First decide your business structure.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Business Registration Project',
            'Prepare documents for simulated business registration.',
            'Choose a business idea and prepare all information needed for RDB registration.',
            [
              { question: 'Describe the complete registration process for your business: structure, name, documents, fees, timeline.', type: 'open', explanation: 'Research current fees on Irembo platform.', points: 20 },
              { question: 'What extra licences would your specific business need beyond basic registration?', type: 'open', explanation: 'Consider health permits, transport licences, food handling permits.', points: 15 },
            ],
            5,
          ),
        ],
        'Register a business in Rwanda and understand all legal requirements.',
      ),

      makeModule(
        'Module 4: Marketing & Sales for New Businesses',
        'Attract customers and grow your new business revenue from day one.',
        [
          makeLesson(
            'Defining Your Target Market',
            'Identify your ideal customer and craft a compelling value proposition.\n\n### Market Definition:\n1. Who has the problem you solve?\n2. Demographics (age, income, location)\n3. Behaviours and preferences\n4. Where do they get solutions now?\n5. What would make them switch to you?',
            'article',
            1,
          ),
          makeLesson(
            'Sales Techniques for Rwandan Entrepreneurs',
            'Build relationships, handle objections, and close deals in the Rwandan market.\n\n### Tips:\n1. Build relationships first - Rwandans buy from trusted people\n2. Be patient - decisions take multiple meetings\n3. Provide references - social proof works\n4. Offer samples or trials\n5. Follow up professionally',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=8d7qj3X5vRo', videoTitle: 'Sales for African Entrepreneurs' },
          ),
          makeLesson(
            'Pricing Strategies for Rwanda',
            'Cost-plus, competitor-based, value-based, and psychological pricing.\n\n### Considerations:\n1. Know costs (materials, labour, overhead)\n2. Research competitor prices\n3. Understand customer willingness to pay\n4. Consider payment terms (cash, mobile money)\n5. Plan discounts without hurting margins',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review sales and marketing concepts.',
            [
              { question: 'What is a value proposition?', options: ['Product price', 'Why customers should buy from you', 'Slogan', 'Business summary'], correctIndex: 1, explanation: 'A value proposition explains why customers should choose you.' },
              { question: 'What is competitor-based pricing?', options: ['Pricing by costs', 'Setting prices based on competitors', 'Customer surveys', 'Random'], correctIndex: 1, explanation: 'Using competitor prices as benchmarks for your pricing.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Sales Plan Project',
            'Create a marketing and sales strategy.',
            'Develop a plan including target market, value proposition, pricing, and sales process.',
            [
              { question: 'Create a customer persona: demographics, behaviours, pain points, goals, info sources.', type: 'open', explanation: 'Consider Kigali vs rural, age, income, and digital access in Rwanda.', points: 20 },
              { question: 'Design a 5-step sales process from first contact to closing.', type: 'open', explanation: 'Example: 1-Cold contact, 2-Discovery, 3-Proposal, 4-Follow-up, 5-Close.', points: 15 },
            ],
            5,
          ),
        ],
        'Develop a marketing and sales strategy to acquire customers.',
      ),

      makeModule(
        'Module 5: Operations, Growth & Scaling',
        'Run your business efficiently, hire employees, and plan for growth.',
        [
          makeLesson(
            'Business Operations & Systems',
            'Essential systems: accounting, CRM, inventory, communication, and document management.\n\n### Systems:\n1. Accounting - Track income, expenses, taxes\n2. CRM - Track customers, leads, pipeline\n3. Inventory - Track stock, orders, suppliers\n4. Communication - Internal and external\n5. Document management - Store contracts, invoices',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=K3aN5rJ7mG8', videoTitle: 'Business Operations - Scaling' },
          ),
          makeLesson(
            'Hiring Your First Employees',
            'When to hire, job descriptions, finding candidates, interviewing, and employer obligations.\n\n### Steps:\n1. Define the role\n2. Write a job description\n3. Advertise on channels\n4. Screen and shortlist\n5. Interview (behavioural questions)\n6. Check references\n7. Make an offer\n8. Register with RSSB',
            'article',
            2,
          ),
          makeLesson(
            'Growth Strategies & Expansion',
            'Market penetration, expansion, product development, and diversification.\n\n### Strategies:\n1. Market penetration - Sell more to existing customers\n2. Market expansion - Enter new regions\n3. Product development - New products/services\n4. Diversification - New markets entirely\n5. Digital expansion - Sell online',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review operations and growth concepts.',
            [
              { question: 'CRM stands for?', options: ['Customer Revenue Management', 'Customer Relationship Management', 'Company Resource Management', 'Client Retention Metric'], correctIndex: 1, explanation: 'CRM manages interactions with current and potential customers.' },
              { question: 'Social security institution in Rwanda?', options: ['RRA', 'RSSB', 'RDB', 'MIFOTRA'], correctIndex: 1, explanation: 'RSSB handles social security registration for employees.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Business Project — Launch & Earn 100,000+ RWF!',
            'Your mission: Launch a real micro-business and make your first 100,000+ RWF in revenue!',
            '**LAUNCH A MICRO-BUSINESS CHALLENGE: Earn 100,000+ RWF in 30 Days**\n\nYour mission: Start a REAL tiny business using what you learned. No business plan exercise — real revenue!\n\n**Low-Capital Business Ideas (Start with 10,000-50,000 RWF):**\n1. **Snack delivery service** — Buy wholesale at Kimironko, sell at schools/offices. 50% profit margin.\n2. **Social media management** — Offer to manage 1 local business Instagram for 100,000 RWF/month (you already learned this!).\n3. **Print-on-demand t-shirts** — Print 10 designs (35,000 RWF each), sell for 70,000 RWF each.\n4. **Mobile phone accessories** — Buy phone cases wholesale (5,000 RWF), sell for 15,000 RWF.\n5. **Freelance [Canva](https://www.canva.com) design** — Create social media posts for local businesses. Charge 20,000-50,000 RWF per client.\n\n**🎯 Quick access links:** [Register Business at RDB](https://irembo.gov.rw) | [RRA TIN Registration](https://rra.gov.rw) | [Canva Free](https://www.canva.com) | [MTN MoMo](https://www.mtn.co.rw/momo)\n\n**Your 30-Day Plan:**\n- **Week 1:** Choose business, buy supplies/equipment, set up MoMo payment\n- **Week 2:** Find first 5 customers (friends, family, WhatsApp groups)\n- **Week 3:** Get feedback and improve your offer\n- **Week 4:** Total your revenue. Reinvest 50% of profit.\n\n**🎯 Target: 100,000-300,000 RWF revenue in Month 1!** Scale to 500,000+ RWF/month by Month 3 = iPhone money!\n\n![Business money](https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600&h=400)\n\n> **Pro Tip:** The best business to start is the one you start TODAY. Not next month, not when you have more money. Start small, learn fast, grow big!',
            [
              { question: 'BUSINESS PLAN: What micro-business did you choose? Startup costs? Target customers? Expected profit?', type: 'open', explanation: 'Describe your business model, pricing, and target market.', points: 20 },
              { question: 'LAUNCH REPORT: How did you find your first 5 customers? What marketing worked?', type: 'open', explanation: 'Share what channels you used and what got results.', points: 20 },
              { question: 'FINANCIAL REPORT: Total revenue? Total costs? Net profit? What will you reinvest?', type: 'open', explanation: 'Show your actual income and expenses with receipts/screenshots.', points: 20 },
              { question: 'GROWTH PLAN: How will you scale to 500,000+ RWF/month? New products? More customers? Online?', type: 'open', explanation: 'Your real expansion strategy based on what you learned.', points: 25 },
            ],
            5,
          ),
        ],
        'Implement operational systems, hire employees, and plan for business growth.',
      ),

/* INSERT_MODULES_4 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 5: Professional English Communication
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Professional English for Rwandan Professionals',
    description:
      ' English is the language of business in East Africa. This course helps Rwandan professionals ' +
      'write professional emails, give confident presentations, participate in meetings, ' +
      'and communicate with international partners. With examples from Rwandan workplaces — ' +
      'government, NGOs, tech companies, and tourism — you will speak and write with confidence.',
    category: 'Languages',
    level: 'Beginner',
    price: 1000,
    searchImage: 'english learning education books professional',
    modules: [
      makeModule(
        'Module 1: Business Writing Essentials',
        'Master professional writing for emails, reports, and proposals.',
        [
          makeLesson(
            'Writing Professional Emails',
            'Email is the most common form of business communication. Learn proper email structure, tone, ' +
            'salutations, and common phrases for different situations — requests, follow-ups, complaints, and proposals.\n\n' +
            '### Email Structure:\n' +
            '1. **Subject line** — Clear and specific\n' +
            '2. **Salutation** — Dear [Name],\n' +
            '3. **Body** — Purpose, context, action needed\n' +
            '4. **Closing** — Best regards, Sincerely,\n' +
            '5. **Signature** — Your name, title, contact',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=VjkCp0MkpS4', videoTitle: 'Effective Communication - Quick Tips' },
          ),
          makeLesson(
            'Common Business Vocabulary & Phrases',
            'Build your professional vocabulary with commonly used business terms, phrases for meetings, ' +
            'negotiations, and presentations. Learn the difference between formal and informal language.\n\n' +
            '### Useful Phrases:\n' +
            '- "Following up on our conversation..."\n' +
            '- "I would like to propose..."\n' +
            '- "Could you please clarify..."\n' +
            '- "I appreciate your prompt response"\n' +
            '- "Looking forward to hearing from you"',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your business writing skills.',
            [
              {
                question: 'What should a professional email subject line be?',
                options: ['Funny and creative', 'Clear and specific', 'As short as one word', 'In ALL CAPS'],
                correctIndex: 1,
                explanation: 'A clear, specific subject line helps the recipient understand the emails purpose immediately.',
              },
              {
                question: 'Which is the most appropriate salutation for a formal business email?',
                options: ['Hey!', 'Dear Mr. Musoni,', 'Yo!', 'Hi there,'],
                correctIndex: 1,
                explanation: '"Dear [Title] [Last Name]," is the standard formal business salutation.',
              },
            ],
            3,
          ),
        ],
        'Write clear, professional business emails.',
      ),
      makeModule(
        'Module 2: Speaking & Presentation Skills',
        'Build confidence in spoken English for professional settings.',
        [
          makeLesson(
            'Public Speaking & Presentations',
            'Learn how to structure and deliver confident presentations in English. Covers opening hooks, ' +
            'logical flow, visual aids, handling Q&A, and overcoming nervousness.\n\n' +
            '### Presentation Structure:\n' +
            '1. **Opening** — Hook + introduction\n' +
            '2. **Agenda** — What you will cover\n' +
            '3. **Body** — 3 main points with evidence\n' +
            '4. **Conclusion** — Summary + call to action\n' +
            '5. **Q&A** — Handle questions confidently',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=NYnn2JRiZtg', videoTitle: 'Business English - Never Run Out of Things' },
          ),
          makeLesson(
            'Meeting Etiquette & Participation',
            'Learn how to participate effectively in English-language meetings. How to interrupt politely, ' +
            'ask for clarification, express opinions, agree and disagree professionally, and summarize action items.\n\n' +
            '### Meeting Phrases:\n' +
            '- "If I may add something..."\n' +
            '- "Could you elaborate on that point?"\n' +
            '- "I see your point, however..."\n' +
            '- "Just to clarify, our next steps are..."',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review speaking and presentation skills.',
            [
              {
                question: 'What is the best way to open a professional presentation?',
                options: ['Apologise for being nervous', 'Start with a hook or interesting fact', 'Read directly from slides', 'Start with a joke'],
                correctIndex: 1,
                explanation: 'A strong hook — statistic, question, or story — grabs the audiences attention immediately.',
              },
              {
                question: 'How can you politely ask for clarification in a meeting?',
                options: ['Say "What?"', 'Say "Could you please elaborate on that?"', 'Stay silent', 'Interrupt loudly'],
                correctIndex: 1,
                explanation: '"Could you please elaborate?" is a polite and professional way to ask for clarification.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Final English Assessment',
            'Demonstrate your professional English skills.',
            'Complete the following exercises to demonstrate your business English proficiency.',
            [
              {
                question: 'Write a professional email to a potential client introducing your services. Include a clear subject line, professional salutation, body, and closing.',
                type: 'open',
                explanation: 'Use the email structure from Module 1. Keep it concise and professional.',
                points: 20,
              },
              {
                question: 'Describe a business presentation you would give. What is your topic, your three main points, and how would you conclude?',
                type: 'open',
                explanation: 'Use the presentation structure: hook, agenda, 3 points, conclusion with call to action.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Deliver confident presentations and participate effectively in meetings.',
      ),


      makeModule(
        'Module 3: CV Writing & Interview Skills',
        'Write compelling CVs and cover letters and ace job interviews in English.',
        [
          makeLesson(
            'Writing a CV That Gets Interviews',
            'Structure: personal details, summary, experience, education, skills, achievements.\n\n### CV Structure:\n1. Contact information\n2. Professional summary (2-3 sentences)\n3. Work experience (reverse chronological)\n4. Education and qualifications\n5. Skills (technical and soft)\n6. Achievements and awards\n7. References',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Z7j5vQ0pG1I', videoTitle: 'How to Write a CV' },
          ),
          makeLesson(
            'Writing Cover Letters That Stand Out',
            'Structure and content for compelling cover letters.\n\n### Structure:\n1. Opening - Role and your interest\n2. Body 1 - Relevant experience and achievements\n3. Body 2 - Skills and fit\n4. Closing - Call to action\n5. Professional sign-off',
            'article',
            2,
          ),
          makeLesson(
            'Acing English Job Interviews',
            'Common questions, STAR method, and questions to ask employers.\n\n### Common Questions:\n1. Tell me about yourself (2-minute summary)\n2. Why this job? (research the company)\n3. Strengths and weaknesses?\n4. Where in 5 years? (show ambition)\n5. Tell me about a challenge (use STAR)\n6. Questions for us? (always have 3 ready)',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review CV and interview skills.',
            [
              { question: 'STAR stands for?', options: ['Stop, Think, Act, Review', 'Situation, Task, Action, Result', 'Start, Time, Answer, Respond', 'Structure, Talk, Answer, React'], correctIndex: 1, explanation: 'STAR is for behavioural interview answers.' },
              { question: 'Ideal CV summary length?', options: ['One page', '2-3 sentences', 'Five sentences', 'One word'], correctIndex: 1, explanation: 'A professional summary should be 2-3 concise sentences.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Job Application Project',
            'Create a complete job application package.',
            'Write a CV and cover letter for a specific job posting.',
            [
              { question: 'Write a complete CV for a real or desired job with professional summary, achievements, education, skills.', type: 'open', explanation: 'Use quantifiable achievements: Increased sales 20%, Managed team of 5, Reduced costs 15%.', points: 20 },
              { question: 'Write a cover letter for a specific job posting addressed to the hiring manager.', type: 'open', explanation: 'Research the company. Connect your experience to their needs.', points: 15 },
            ],
            5,
          ),
        ],
        'Write professional CVs and cover letters and succeed in English interviews.',
      ),

      makeModule(
        'Module 4: Negotiation & Persuasion Skills',
        'Develop English skills for negotiation and persuasion in business.',
        [
          makeLesson(
            'Negotiation Skills for Professionals',
            'Preparation, positioning, bargaining, and closing techniques.\n\n### Phases:\n1. Preparation - Know BATNA, target, walkaway point\n2. Opening - State position clearly\n3. Discussion - Explore options\n4. Bargaining - Make and respond to offers\n5. Closing - Summarise agreement',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=8_MetAOZlJ0', videoTitle: 'Business Negotiation Skills' },
          ),
          makeLesson(
            'Persuasive Writing & Speaking',
            'Ethos, pathos, logos and persuasive argument structure.\n\n### Three Pillars:\n1. Ethos - Credibility (Why believe you?)\n2. Pathos - Emotion (How do they feel?)\n3. Logos - Logic (What evidence supports?)\n\n### Structure: Hook, Problem, Solution, Evidence, Call to Action',
            'article',
            2,
          ),
          makeLesson(
            'Handling Difficult Conversations',
            'Framework for bad news, feedback, saying no, and sensitive topics.\n\n### Framework:\n1. Prepare - Know your message\n2. Start with purpose - Why this conversation\n3. Share perspective - Use I statements\n4. Ask their perspective - Listen actively\n5. Problem-solve together\n6. Agree on next steps',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review negotiation concepts.',
            [
              { question: 'BATNA stands for?', options: ['Best Alternative To Negotiated Agreement', 'Basic Agreement Terms Need Analysis', 'Business Negotiation Approach', 'Balanced Approach'], correctIndex: 0, explanation: 'BATNA is your best alternative if negotiation fails.' },
              { question: 'Which appeal uses logic and evidence?', options: ['Ethos', 'Pathos', 'Logos', 'Kairos'], correctIndex: 2, explanation: 'Logos appeals to logic and reason.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Negotiation Simulation',
            'Prepare for a real business negotiation.',
            'Prepare your position, research the other party, and develop arguments.',
            [
              { question: 'Prepare for salary negotiation: target, minimum, achievements, and responses to objections.', type: 'open', explanation: 'Research market rates for your role. Prepare specific achievements and impact.', points: 20 },
              { question: 'Write a persuasive proposal using ethos, pathos, and logos with clear CTA.', type: 'open', explanation: 'Structure: hook, problem, solution, evidence, call to action.', points: 15 },
            ],
            5,
          ),
        ],
        'Negotiate effectively and communicate persuasively in English.',
      ),

      makeModule(
        'Module 5: Advanced Business Communication',
        'Master advanced English for reports, proposals, and cross-cultural communication.',
        [
          makeLesson(
            'Writing Business Reports & Proposals',
            'Structure, executive summaries, data presentation, and compelling proposals.\n\n### Report Structure:\n1. Executive Summary - Key findings\n2. Introduction - Purpose and scope\n3. Methodology - How information was gathered\n4. Findings - What was discovered\n5. Analysis - What findings mean\n6. Recommendations - What to do\n7. Conclusion - Summary and next steps',
            'article',
            1,
          ),
          makeLesson(
            'Cross-Cultural Business Communication',
            'Adapt communication for different cultures.\n\n### Dimensions:\n1. Direct vs indirect communication\n2. Formal vs informal (titles, formality)\n3. Time: Monochronic vs polychronic\n4. Hierarchy: Deference to authority\n5. Relationship vs task focus',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=H0gJ7d8kL2P', videoTitle: 'Cross-Cultural Communication Tips' },
          ),
          makeLesson(
            'Public Speaking & Presentation Mastery',
            'Storytelling, difficult audiences, data visualisation, and confident delivery.\n\n### Techniques:\n1. Storytelling - Make messages memorable\n2. Data visualisation - Numbers into visuals\n3. Audience engagement - Questions, polls\n4. Handling Q&A - Anticipate questions\n5. Powerful closings - Memorable message',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review advanced communication concepts.',
            [
              { question: 'Most important section of a business report?', options: ['Methodology', 'Executive Summary', 'Appendix', 'Bibliography'], correctIndex: 1, explanation: 'Executive summary distills key findings for busy readers.' },
              { question: 'Which culture values punctuality most?', options: ['Polychronic', 'Monochronic', 'Relationship-focused', 'Hierarchical'], correctIndex: 1, explanation: 'Monochronic cultures view time linearly and value punctuality.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Communication Project',
            'Create a business communication portfolio.',
            'Produce a business report, presentation outline, and cross-cultural strategy.',
            [
              { question: 'Write a business report on a topic in your field (min 500 words): executive summary, findings, analysis, recommendations.', type: 'open', explanation: 'Use headings, bullet points, and at least one data point. Follow formal report structure.', points: 25 },
              { question: 'Create a 10-slide presentation outline with key message, visuals, and speaker notes for each slide.', type: 'open', explanation: 'Hook, agenda, 3 key points, conclusion, CTA. Prepare for 3 difficult questions.', points: 20 },
            ],
            5,
          ),
        ],
        'Produce professional reports and deliver compelling presentations.',
      ),

/* INSERT_MODULES_5 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 6: AgriTech & Smart Farming
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Smart Farming in Rwanda: AgriTech for Modern Farmers',
    description:
      ' Agriculture drives Rwanda economy — and technology is making it smarter. This course shows you ' +
      'how to use mobile apps, IoT sensors, drone monitoring, and digital marketplaces ' +
      'to increase yields, reduce waste, and access better markets. Real Rwandan cases: ' +
      'Twigire Muhinzi, Smart Nkunganire, and platforms linking farmers to buyers across Rwanda.',
    category: 'Technology',
    level: 'Beginner',
    price: 1000,
    searchImage: 'agriculture technology farming smart africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Technology in African Agriculture',
        'Understand the current state of agriculture in Africa and how technology is driving change.',
        [
          makeLesson(
            'The State of Agriculture in Africa',
            'Agriculture contributes 35% to Africas GDP and employs the majority of the workforce. Yet, productivity ' +
            'lags behind other regions due to climate change, lack of access to information, and inefficient supply chains. ' +
            'This lesson sets the context for why AgriTech is crucial for Africas future.\n\n' +
            '### Key Challenges:\n' +
            '- Climate change affecting growing seasons\n' +
            '- Limited access to market information\n' +
            '- Post-harvest losses of up to 40%\n' +
            '- Limited access to credit for smallholder farmers',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=4TXPHN9hh9A', videoTitle: 'Smart Farms - Future of Agriculture in 3 Min' },
          ),
          makeLesson(
            'Introduction to AgriTech Solutions',
            'Explore the range of technology solutions transforming agriculture: precision farming, IoT sensors, ' +
            'drone monitoring, blockchain for traceability, mobile marketplaces, and agricultural fintech.\n\n' +
            '### AgriTech Categories:\n' +
            '1. **Farm Management** — IoT sensors, weather data, crop monitoring\n' +
            '2. **Market Access** — Mobile platforms connecting farmers to buyers\n' +
            '3. **Financial Services** — Crop insurance, digital loans for inputs\n' +
            '4. **Supply Chain** — Traceability, cold chain monitoring, logistics',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of AgriTech fundamentals.',
            [
              {
                question: 'What percentage of post-harvest produce is lost in Africa due to supply chain issues?',
                options: ['10%', 'Up to 40%', '5%', '60%'],
                correctIndex: 1,
                explanation: 'Post-harvest losses in Africa can reach up to 40% due to inefficient supply chains.',
              },
              {
                question: 'Which technology is used for crop health monitoring from above?',
                options: ['Blockchain', 'Drones', 'USSD codes', 'Mobile apps only'],
                correctIndex: 1,
                explanation: 'Drones equipped with cameras and sensors can monitor crop health across large areas.',
              },
            ],
            3,
          ),
        ],
        'Explain the role of technology in modern African agriculture.',
      ),
      makeModule(
        'Module 2: Building AgriTech Solutions',
        'Learn how to design and implement AgriTech solutions for real-world problems.',
        [
          makeLesson(
            'Data-Driven Farming',
            'Learn how weather data, soil sensors, satellite imagery, and machine learning are helping farmers ' +
            'make better decisions about planting, irrigation, fertilisation, and harvesting.\n\n' +
            '### Data Sources:\n' +
            '- **Satellite imagery** — Crop health (NDVI), moisture levels\n' +
            '- **Weather stations** — Localised forecasts\n' +
            '- **Soil sensors** — pH, moisture, nutrients\n' +
            '- **Market data** — Real-time prices for better selling decisions',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'AgriFintech: Financial Services for Farmers',
            'Access to finance is the biggest barrier for smallholder farmers. Learn how mobile-based insurance, ' +
            'input financing, and savings groups are being digitised to serve agricultural communities.\n\n' +
            '### AgriFintech Products:\n' +
            '- **Crop insurance** — Weather-indexed insurance via mobile\n' +
            '- **Input financing** — Loans for seeds, fertiliser, equipment\n' +
            '- **Savings groups** — Digital village savings and loan groups\n' +
            '- **Payment platforms** — Mobile money for agricultural transactions',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=XUX3sMYcvoo', videoTitle: 'The Smart Farm of the Future - Quick Explainer' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review AgriTech concepts.',
            [
              {
                question: 'What is weather-indexed crop insurance?',
                options: [
                  'Insurance that pays based on actual crop yield',
                  'Insurance that automatically pays when weather conditions trigger a payout',
                  'Insurance for weather stations',
                  'A type of health insurance for farmers',
                ],
                correctIndex: 1,
                explanation: 'Weather-indexed insurance pays out automatically when specific weather conditions (e.g., drought) are met.',
              },
              {
                question: 'Which of these is NOT an AgriTech solution?',
                options: ['Drone crop monitoring', 'Mobile money for farm payments', 'Social media app', 'IoT soil sensors'],
                correctIndex: 2,
                explanation: 'General social media is not specifically an AgriTech solution, though it may be used for marketing.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: AgriTech Innovation Project',
            'Design a technology solution for an agricultural problem.',
            'Design an AgriTech solution that addresses a real challenge faced by farmers in your region.',
            [
              {
                question: 'Describe an agricultural problem in your community and a technology solution that could solve it.',
                type: 'open',
                explanation: 'Consider: market access, weather information, crop diseases, irrigation, or financing.',
                points: 25,
              },
              {
                question: 'How would your solution reach rural farmers who may not have smartphones?',
                type: 'open',
                explanation: 'Consider USSD, SMS, voice-based systems, or agent networks that work without internet.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Design a basic AgriTech solution for a real agricultural problem.',
      ),


      makeModule(
        'Module 3: Crop Management & Precision Farming',
        'Use technology to optimise crop production and increase yields sustainably.',
        [
          makeLesson(
            'Precision Farming Technologies',
            'GPS mapping, soil sensors, satellite imagery, and drone monitoring.\n\n### Tools:\n1. GPS mapping - Field boundaries and soil variations\n2. Soil sensors - Moisture, pH, nutrients in real-time\n3. Variable rate tech - Apply inputs only where needed\n4. Satellite imagery - NDVI crop health monitoring\n5. Drone monitoring - High-resolution assessment',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=3D_t8nL2kP9', videoTitle: 'Precision Farming Explained' },
          ),
          makeLesson(
            'Irrigation Technology & Water Management',
            'Drip irrigation, sprinklers, solar pumps, and rainwater harvesting for Rwanda.\n\n### Options:\n1. Drip irrigation - Water-efficient for vegetables\n2. Sprinkler systems - Good for larger fields\n3. Solar pumps - Reduce energy costs\n4. Rainwater harvesting - Collect for dry seasons\n5. Moisture sensors - Automate irrigation',
            'article',
            2,
          ),
          makeLesson(
            'Pest & Disease Management Technology',
            'Plantix app, early warning systems, drone spraying, and integrated pest management.\n\n### Solutions:\n1. Plantix app - Identify diseases by photo\n2. Early warning - SMS alerts for pest outbreaks\n3. Drone spraying - Precise pesticide application\n4. Predictive analytics - Weather-based forecasting\n5. IPM - Biological, cultural, chemical controls',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review precision farming concepts.',
            [
              { question: 'NDVI stands for?', options: ['Normalised Difference Vegetation Index', 'National Digital Verification Index', 'Natural Development Indicator', 'Nutrient Distribution Index'], correctIndex: 0, explanation: 'NDVI measures plant health via satellite imagery.' },
              { question: 'Most water-efficient irrigation method?', options: ['Flood', 'Drip', 'Sprinkler', 'Furrow'], correctIndex: 1, explanation: 'Drip irrigation delivers water directly to roots, minimising waste.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Farm Technology Plan',
            'Design a precision farming plan for a Rwandan crop.',
            'Include soil preparation, irrigation, pest management, and monitoring technology.',
            [
              { question: 'Design a precision plan for a Rwandan crop: irrigation, pest management, monitoring, costs, and yield improvement.', type: 'open', explanation: 'Research current yields and costs. Compare traditional vs tech-enhanced approaches.', points: 20 },
              { question: 'How can smallholder farmers share expensive precision technology through cooperatives?', type: 'open', explanation: 'Consider: equipment sharing, pay-per-use drone services, community irrigation.', points: 15 },
            ],
            5,
          ),
        ],
        'Implement precision farming technologies to optimise crop production.',
      ),

      makeModule(
        'Module 4: Market Access & Supply Chain',
        'Connect farmers to markets and reduce post-harvest losses.',
        [
          makeLesson(
            'Digital Marketplaces for Farmers',
            'Platforms: Twigire Muhinzi, Smart Nkunganire, M-Farm, and WhatsApp market links.\n\n### Platforms:\n1. Twigire Muhinzi - Rwandan extension/market platform\n2. Smart Nkunganire - Inputs and market system\n3. M-Farm - Farmer-to-buyer connection\n4. Selina Wamucii - Fresh produce marketplace\n5. WhatsApp groups - Local market connections',
            'article',
            1,
          ),
          makeLesson(
            'Cold Chain & Post-Harvest Management',
            'Reduce 40% losses with solar cold rooms, proper harvesting, and better packaging.\n\n### Solutions:\n1. Harvest at right time\n2. Gentle handling to avoid bruising\n3. Rapid cooling after harvest\n4. Solar-powered cold rooms\n5. Proper packaging for transport\n6. Timely transport with proper conditions',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=5S7gH3jF8kL', videoTitle: 'Cold Chain for African Agriculture' },
          ),
          makeLesson(
            'Traceability & Export Certification',
            'Blockchain, QR codes, organic/fair-trade certification, and RAB standards.\n\n### Systems:\n1. Blockchain - Immutable product record\n2. QR codes - Scan for product origin\n3. Mobile tracking - Smartphone record-keeping\n4. Certifications - Organic, Fair Trade, GlobalGAP\n5. Rwanda specific - RAB certification, coffee traceability',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review market access and supply chain.',
            [
              { question: 'Post-harvest loss rate in Africa?', options: ['10%', 'Up to 40%', '5%', '60%'], correctIndex: 1, explanation: 'Post-harvest losses reach 40% due to inadequate storage and transport.' },
              { question: 'Technology for immutable traceability?', options: ['SMS', 'Blockchain', 'Email', 'Social media'], correctIndex: 1, explanation: 'Blockchain creates an immutable product record from farm to consumer.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Supply Chain Project',
            'Design an efficient agricultural supply chain.',
            'Trace a product from farm to consumer with technology improvements at each step.',
            [
              { question: 'Design a supply chain for a Rwandan product (coffee, maize, tomatoes, potatoes) with technology improvements.', type: 'open', explanation: 'Consider harvesting, storage, transport, market channels, and tech at each step.', points: 20 },
              { question: 'Set up traceability for Rwandan coffee exported to Europe. What information at each step?', type: 'open', explanation: 'Consider farm practices, processing, certification, export docs, and QR codes.', points: 15 },
            ],
            5,
          ),
        ],
        'Design efficient agricultural supply chains and connect farmers to better markets.',
      ),

      makeModule(
        'Module 5: Climate Resilience & Sustainable Agriculture',
        'Adapt to climate change and access carbon markets.',
        [
          makeLesson(
            'Climate-Smart Agriculture in Rwanda',
            'Drought-resistant crops, conservation agriculture, agroforestry, and adaptive techniques.\n\n### Practices:\n1. Drought-resistant varieties\n2. Conservation agriculture (minimum tillage, rotation)\n3. Agroforestry - Trees with crops\n4. Water harvesting and efficient irrigation\n5. Crop diversification for risk spread',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=2fJ4kP7rM9n', videoTitle: 'Climate-Smart Agriculture' },
          ),
          makeLesson(
            'Carbon Credits & Green Financing',
            'Earn income through carbon farming: agroforestry, reduced tillage, composting, biochar.\n\n### Opportunities:\n1. Agroforestry - Trees capture carbon\n2. Reduced tillage - More carbon in soil\n3. Composting - Organic matter improves soil\n4. Cover crops - Capture carbon between seasons\n5. Biochar - Stores carbon for centuries',
            'article',
            2,
          ),
          makeLesson(
            'Regenerative Agriculture Principles',
            'Actively improve soil health, biodiversity, and ecosystem services.\n\n### Principles:\n1. Minimise soil disturbance\n2. Keep soil covered\n3. Maintain living roots year-round\n4. Diversify crops\n5. Integrate livestock\n6. Build soil organic matter',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review climate resilience concepts.',
            [
              { question: 'What is agroforestry?', options: ['Farming with tech', 'Integrating trees with crops', 'Growing without soil', 'Fishing and farming'], correctIndex: 1, explanation: 'Agroforestry integrates trees with crops and/or livestock.' },
              { question: 'How do farmers earn carbon credits?', options: ['More fertiliser', 'Practices that capture carbon', 'More livestock', 'Clearing land'], correctIndex: 1, explanation: 'Farmers earn credits by adopting carbon-capturing practices like agroforestry.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final AgriTech Project',
            'Design a climate-smart farm plan.',
            'Create a plan for a 1-hectare Rwandan farm with sustainable practices and carbon credit potential.',
            [
              { question: 'Design a climate-smart plan for a 1-hectare Rwandan farm with 3+ crops, sustainable practices, and technology.', type: 'open', explanation: 'Consider agro-ecological zone, climate patterns, market demand, and technology.', points: 25 },
              { question: 'How would your farm earn additional income through carbon credits? Estimate annual revenue.', type: 'open', explanation: 'Research carbon credit prices. Consider agroforestry credits or watershed payments.', points: 20 },
            ],
            5,
          ),
        ],
        'Implement climate-smart practices for long-term profitability.',
      ),

/* INSERT_MODULES_6 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 7: Content Creation & Social Media Mastery
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Create & Earn: Content Creation for Rwandan Youth',
    description:
      ' 🎬 Turn your phone into a money-making machine! Rwandan youth are earning real income from content creation. ' +
      'This course shows you exactly how to create scroll-stopping content for TikTok, Instagram, YouTube, and LinkedIn ' +
      'using just your smartphone — no expensive gear needed. Learn smartphone filming techniques, CapCut video editing, ' +
      'storytelling that hooks viewers, audience growth hacks, and how to earn in RWF through brand deals, ' +
      'digital products, and affiliate marketing. Real examples from Rwandan creators included! 🇷🇼',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'content creation social media video production',
    modules: [
      makeModule(
        'Module 1: Foundations of Content Creation',
        'Learn the basics of creating compelling content for social media platforms.',
        [
          makeLesson(
            'Finding Your Content Niche',
            'The most successful creators focus on a specific niche. This lesson helps you identify your ' +
            'passion, expertise, and audience — and how to position yourself as a go-to creator in your field.\n\n' +
            '### Finding Your Niche:\n' +
            '1. What are you passionate about?\n' +
            '2. What knowledge do you have that others need?\n' +
            '3. What content is already popular in your market?\n' +
            '4. Where is there a gap you can fill?',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=GtYhNtRNRls', videoTitle: '5 Easy Content Creation Tips - Short Guide' },
          ),
          makeLesson(
            'Smartphone Content Production',
            'You do not need expensive gear to create great content! In Rwanda, you can get a complete starter kit ' +
            'for under 100,000 RWF. This lesson shows you exactly what to buy, where to find it in Kigali, ' +
            'and how to use your smartphone to create professional-looking content on any budget.\n\n' +
            '### 📱 Your Starter Kit (From 0 - 100,000 RWF)\n' +
            '\n' +
            '**1. Smartphone — You already have it! (0 RWF)**\n' +
            'Your phone is all you need to start. Most modern smartphones shoot 1080p HD video — good enough for YouTube and TikTok!\n' +
            '![Smartphone recording](https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '**2. Tripod — 20,000 - 40,000 RWF**\n' +
            'Essential for steady shots, hands-free filming, and group videos. A cheap tripod beats a shaky hand every time!\n' +
            '**📍 Where to buy:** Kimironko Market electronics section or phone accessory shops in Remera (Diamond/Mobile Zone shops).\n' +
            '![Phone tripod](https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '**3. Lavalier Microphone — 15,000 - 25,000 RWF**\n' +
            'Clips onto your collar for crystal-clear audio. Viewers forgive bad video but NEVER bad audio!\n' +
            '**📍 Where to buy:** Diamond shops in Remera, IKOBE downtown, or [Jumia Rwanda](https://www.jumia.co.rw).\n' +
            '![Lavalier microphone](https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '**4. Ring Light — 25,000 - 40,000 RWF**\n' +
            'Affordable LED ring light with phone holder and adjustable brightness. A total game-changer for indoor filming!\n' +
            '**📍 Where to buy:** Electronics shops in downtown Kigali, CNA stores, or [Jumia Rwanda](https://www.jumia.co.rw).\n' +
            '![Ring light setup](https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '### ☀️ Natural Light — 0 RWF (Best and free!)\n' +
            'In Rwanda, we have tropical sun almost every day! Film near windows during the "golden hour" (6-8 AM or 4-6 PM) ' +
            'for the best lighting. Nothing beats free, natural light for a professional look.\n' +
            '\n' +
            '### 🛍️ Where to Buy Equipment in Kigali:\n' +
            '1. **Kimironko Market** — Bargain for the best prices on tripods and phone accessories\n' +
            '2. **Remera (Diamond/Mobile Zone)** — Quality microphones and ring lights\n' +
            '3. **Downtown Kigali** — CNA, IKOBE, and general electronics stores\n' +
            '4. **Online** — [Jumia Rwanda](https://www.jumia.co.rw) delivers anywhere\n' +
            '\n' +
            '> **Pro Tip:** Start with just your phone and natural light. Add gear one piece at a time as you earn from content!',
            'article',
            2,
          ),
          makeLesson(
            'Choosing Your Content Creation Smartphone',
            'The most important decision you will make as a creator is which phone to use. ' +
            'The good news? You do NOT need an iPhone! Many affordable phones in Rwanda ' +
            'shoot excellent video for TikTok, Instagram, and YouTube.\n\n' +
            'This lesson breaks down exactly what specs matter, which phones to buy at every budget in RWF, ' +
            'and where to find them in Kigali.\n\n' +
            '---\n\n' +
            '### 📱 Key Specs for Content Creation\n' +
            '\n' +
            '**1. Camera — Look for:**\n' +
            '- **Resolution:** 48MP rear camera minimum, 8MP+ front camera for selfie videos\n' +
            '- **Video:** 1080p at 30fps minimum — 4K if your budget allows\n' +
            '- **Stabilisation (OIS/EIS):** Reduces shaky footage — the MOST important feature!\n' +
            '- **Slow motion:** 120fps or higher for engaging TikTok effects\n' +
            '\n' +
            '**2. Storage — Video takes space!**\n' +
            '- **128GB minimum** (1 minute of 1080p video = ~150MB)\n' +
            '- **256GB recommended** if you film often\n' +
            '- **MicroSD card slot** is a huge bonus for expandable storage\n' +
            '\n' +
            '**3. Battery — For all-day shooting**\n' +
            '- **5000mAh or higher** keeps you filming all day\n' +
            '- **Fast charging (18W+)** for quick top-ups between shoots\n' +
            '\n' +
            '**4. Processor — Affects recording & editing**\n' +
            '- MediaTek Helio G-series or Dimensity, or Snapdragon 600+ series\n' +
            '- Better processor = smoother video and faster CapCut editing\n' +
            '\n' +
            '---\n\n' +
            '### 💰 Best Phones by Budget (RWF Prices in Rwanda 2025)\n' +
            '\n' +
            '#### 🟢 Budget: Under 100,000 RWF — Starter Level\n' +
            'Great to begin. Focus on lighting and audio instead of the phone!\n' +
            '| Phone | Price | Camera | Storage |\n' +
            '|---|---|---|---|\n' +
            '| Tecno Spark Go 2024 | ~70,000 RWF | 13MP | 64GB |\n' +
            '| Infinix Smart 9 | ~75,000 RWF | 13MP | 64GB |\n' +
            '| Nokia C22 | ~80,000 RWF | 13MP+2MP | 64GB |\n' +
            '\n' +
            '#### 🟡 Mid-Range: 100,000 \u2013 250,000 RWF — Best Value ⭐\n' +
            'Sweet spot for content creators! Excellent cameras without breaking the bank.\n' +
            '| Phone | Price | Camera | Video | Storage |\n' +
            '|---|---|---|---|---|\n' +
            '| Infinix Hot 40 Pro | ~170,000 RWF | 108MP | 1080p 120fps | 256GB |\n' +
            '| Tecno Spark 20 Pro | ~180,000 RWF | 108MP | 1080p | 256GB |\n' +
            '| Samsung A15 | ~200,000 RWF | 50MP OIS | 1080p 30fps | 128GB |\n' +
            '| Oppo A79 | ~220,000 RWF | 50MP | 1080p | 256GB |\n' +
            '\n' +
            '#### 🔵 Premium: 250,000 \u2013 500,000 RWF — Professional\n' +
            'OIS stabilisation and 4K video for professional-looking content.\n' +
            '| Phone | Price | Camera | Video |\n' +
            '|---|---|---|---|\n' +
            '| Samsung A35 | ~350,000 RWF | 50MP OIS | 4K 30fps ⭐ |\n' +
            '| Tecno Camon 30 Premier | ~380,000 RWF | 50MP Periscope | 4K 60fps ⭐ |\n' +
            '| Google Pixel 6a | ~400,000 RWF | 12MP (best software) | 4K 60fps |\n' +
            '| Tecno Phantom V Flip | ~450,000 RWF | 50MP | 4K 30fps |\n' +
            '\n' +
            '#### 🟣 Flagship: 500,000+ RWF — Pro Level\n' +
            'Only if content creation is your full-time business.\n' +
            '| Phone | Price | Camera | Video |\n' +
            '|---|---|---|---|\n' +
            '| Samsung S24 FE | ~600,000 RWF | 50MP OIS | 8K 24fps ⭐ |\n' +
            '| iPhone 15 | ~900,000 RWF | 48MP OIS | 4K 60fps Dolby ⭐ |\n' +
            '| iPhone 16 Pro | ~1,500,000 RWF | 48MP triple | 4K 120fps ProRes ⭐ |\n' +
            '\n' +
            '---\n\n' +
            '### 🛍️ Where to Buy Phones in Kigali\n' +
            '1. **MTN & Airtel Official Shops** — Warranty, slightly higher prices\n' +
            '2. **Remera (Diamond/Mobile Zone)** — Wide selection, competitive prices\n' +
            '3. **Downtown Kigali** — CNA, IKOBE, Phone City — bargain for best price\n' +
            '4. **Online** — [Jumia Rwanda](https://www.jumia.co.rw), [Kikuu](https://www.kikuu.co.rw) — delivered to your door\n' +
            '5. **Ikaze Showroom** — Authorised Tecno/Infinix/Oppo dealer\n' +
            '\n' +
            '### ✅ Quick Decision Guide\n' +
            '- **Under 100k RWF:** Tecno Spark Go — cheapest option to start\n' +
            '- **150k-200k RWF:** Infinix Hot 40 Pro — best value 108MP camera ⭐\n' +
            '- **200k-350k RWF:** Samsung A35 — best video stabilisation (OIS) ⭐\n' +
            '- **350k-500k RWF:** Tecno Camon 30 Premier — 4K 60fps professional ⭐\n' +
            '- **800k+ RWF:** iPhone 15/16 — best in class stabilisation\n' +
            '\n' +
            '![Smartphones lined up](https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '> **Pro Tip:** Spend more on a phone with OIS (optical stabilisation) rather than just high megapixels. A steady 1080p video looks WAY better than a shaky 4K video!',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your content creation fundamentals, including phone selection.',
            [
              {
                question: 'What is the most important factor in choosing a content niche?',
                options: ['It makes the most money', 'It aligns with your passion and expertise', 'It has the most competition', 'It requires no effort'],
                correctIndex: 1,
                explanation: 'Choosing a niche you are passionate about ensures long-term consistency and authenticity.',
              },
              {
                question: 'What is the minimum equipment needed to start creating content?',
                options: ['Professional camera and studio', 'Just a smartphone', '$10,000 budget', 'A full production team'],
                correctIndex: 1,
                explanation: 'A modern smartphone is sufficient to start creating quality content today.',
              },
              {
                question: 'Which phone feature matters MOST for video quality?',
                options: ['Highest megapixels', 'Optical Image Stabilisation (OIS)', 'Largest screen size', 'Water resistance'],
                correctIndex: 1,
                explanation: 'OIS reduces shaky footage - a steady 1080p looks better than shaky 4K!',
              },
              {
                question: 'The best-value phone range for content creators in Rwanda is:',
                options: ['Under 100,000 RWF', '150,000 - 250,000 RWF', 'Over 1,000,000 RWF', 'Any phone under 50,000 RWF'],
                correctIndex: 1,
                explanation: 'Phones in the 150k-250k RWF range (Infinix Hot 40 Pro, Spark 20 Pro) offer excellent 108MP cameras at great value.',
              },
            ],
            4,
          ),
        ],
        'Identify your content niche and produce basic content with a smartphone.',
      ),
      makeModule(
        'Module 2: Growing & Monetising Your Audience',
        'Learn strategies to grow your audience and turn content into income.',
        [
          makeLesson(
            'Platform-Specific Growth Strategies',
            'Each social media platform has its own algorithm and best practices. This lesson gives you ' +
            'step-by-step guides for TikTok, Instagram, YouTube, and LinkedIn — plus how to repurpose ' +
            'content across all platforms to save time and maximise reach.\n\n' +
            '---\n\n' +
            '## 🎵 TikTok — Step-by-Step Guide\n' +
            '\n' +
            '### Step 1: Download & Setup\n' +
            '1. Download TikTok from Google Play Store (Android) or App Store (iPhone) — free!\n' +
            '2. Sign up with email, phone number, or Google account\n' +
            '3. Set your profile: profile picture, bio (tell people what you create), link to YouTube/Instagram\n' +
            '4. Follow 20-30 creators in your niche to train your feed\n' +
            '\n' +
            '### Step 2: Film Your First Video\n' +
            '1. Tap the **+** button at the bottom\n' +
            '2. Choose **15s** (short) or **60s** (longer) — 15-30 seconds is best for beginners\n' +
            '3. Hold your phone **horizontally or vertically** (vertical is best)\n' +
            '4. Tap the red button to record. Tap again to stop.\n' +
            '5. Use the **Speed** button for slow/fast motion effects\n' +
            '\n' +
            '### Step 3: Add Sounds & Effects\n' +
            '1. Tap **Sounds** at the top to search for trending songs\n' +
            '2. Use trending sounds — they help the algorithm show your video\n' +
            '3. Tap **Effects** to add filters, transitions, and text\n' +
            '4. Add **captions** (text on screen) — most people watch without sound!\n' +
            '\n' +
            '### Step 4: Publish & Hashtags\n' +
            '1. Write a caption with 3-5 **hashtags** (mix popular + niche, e.g., #Rwanda, #Kigali, #TikTokRwanda)\n' +
            '2. Tag your location (Rwanda, Kigali, etc.) for local reach\n' +
            '3. Post at peak times: 6-9 AM or 6-9 PM (Rwandan time)\n' +
            '4. Share to WhatsApp, Instagram, or YouTube for more views\n' +
            '\n' +
            '### Pro Growth Tips:\n' +
            '- **Post 1-2 times per day** — consistency beats perfection\n' +
            '- **Hook in first 2 seconds** — ask a question or show something interesting\n' +
            '- **Use Duet/Stitch** — react to trending videos in your niche\n' +
            '- **Engage back** — reply to comments within the first hour\n' +
            '![TikTok app interface](https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 📸 Instagram — Step-by-Step Guide\n' +
            '\n' +
            '### Step 1: Optimise Your Profile\n' +
            '1. Switch to **Creator Account** (Settings \u2192 Account \u2192 Switch to Creator)\n' +
            '2. Set your bio: who you help + what you create + call to action\n' +
            '3. Add link in bio (Linktree or direct to your YouTube)\n' +
            '\n' +
            '### Step 2: Create Reels (Best for Growth)\n' +
            '1. Tap **+** at bottom \u2192 **Reel**\n' +
            '2. Film or upload video clips\n' +
            '3. Add music from Instagram Music library (search trending songs)\n' +
            '4. Use **Text** tool to add captions — essential for reach\n' +
            '5. Set cover image (pick the best frame)\n' +
            '6. Post with 3-5 hashtags and location tag\n' +
            '\n' +
            '### Step 3: Stories & Engagement\n' +
            '1. Post Stories daily — behind-the-scenes, polls, Q&A\n' +
            '2. Use **Stickers** (poll, question, countdown) to boost engagement\n' +
            '3. Reply to DMs and comments within 24 hours\n' +
            '4. Share others content to your Stories — they will share back!\n' +
            '\n' +
            '### Pro Growth Tips:\n' +
            '- **Post Reels 3-5x per week** — Instagram prioritises Reels\n' +
            '- **Use carousel posts** — swipeable posts get high engagement\n' +
            '- **Post at 7-9 AM or 7-9 PM** (Rwandan time)\n' +
            '- **Collaborate** — tag other creators, do shoutouts\n' +
            '\n' +
            '---\n\n' +
            '## ▶️ YouTube — Step-by-Step Guide\n' +
            '\n' +
            '### Step 1: Start Your Channel\n' +
            '1. Go to YouTube.com \u2192 Sign in with Google\n' +
            '2. Click your profile picture \u2192 **Create a Channel**\n' +
            '3. Name your channel (use your name or niche, e.g., \"Jane in Kigali\" or \"Tech Rwanda\")\n' +
            '4. Add channel art/banner (use Canva — free templates)\n' +
            '5. Write your channel description with keywords\n' +
            '\n' +
            '### Step 2: Film & Upload Your First Video\n' +
            '1. Film with your phone (horizontal/landscape is best for YouTube!)\n' +
            '2. Edit in CapCut (trim, add text, music)\n' +
            '3. Click camera icon \u2192 **Upload Video**\n' +
            '4. Add title with keywords (e.g., \"How to Start Content Creation in Rwanda — Complete Guide\")\n' +
            '5. Write description (250+ words with keywords and timestamps)\n' +
            '6. Add **tags** (relevant search terms)\n' +
            '7. Choose **thumbnail** — make it bright with bold text\n' +
            '8. Add to **playlist** (organise your content)\n' + 
            '\n' +
            '### Step 3: Grow Your Channel\n' +
            '1. Post **weekly** — consistency is key on YouTube\n' +
            '2. Use **Video Chapters** (timestamps in description)\n' +
            '3. End each video with **suggested videos** (cards/screens)\n' +
            '4. Ask viewers to **Like, Comment, Subscribe**\n' +
            '5. Reply to ALL comments — boosts algorithm ranking\n' +
            '6. Use **YouTube Studio** app to track performance\n' +
            '\n' +
            '### Pro Tips:\n' +
            '- **Keyword research:** Use VidIQ extension (free) to find high-volume keywords\n' +
            '- **Thumbnails:** Bright colours, close-up face, 3 words max\n' +
            '- **First 30 seconds:** Hook viewers or they will click away\n' +
            '- **Playlists:** Group similar videos — increases watch time\n' +
            '![YouTube studio setup](https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 💼 LinkedIn — Step-by-Step Guide\n' +
            '\n' +
            '### Step 1: Build Your Creator Profile\n' +
            '1. Complete all sections: photo, headline, about, experience\n' +
            '2. Turn on **Creator Mode** (Settings \u2192 Creator Mode)\n' +
            '3. Add your niche hashtags in bio\n' +
            '\n' +
            '### Step 2: Post Content That Gets Noticed\n' +
            '1. **Educational posts** — share what you know (how-to, tips, insights)\n' +
            '2. **Personal stories** — your content creation journey\n' +
            '3. **Industry insights** — trends in your niche\n' +
            '4. **Video posts** — LinkedIn now prioritises video\n' +
            '\n' +
            '### Step 3: Network & Grow\n' +
            '1. Connect with 10+ people daily in your niche\n' +
            '2. Comment meaningfully on others posts\n' +
            '3. Join relevant LinkedIn Groups\n' +
            '4. Post 3-5x per week for steady growth\n' +
            '\n' +
            '---\n\n' +
            '## 🔄 Cross-Platform Repurposing Strategy\n' +
            'Save time by creating ONE piece of content and sharing it everywhere:\n' +
            '1. **Film a 10-minute YouTube video** (your pillar content)\n' +
            '2. **Extract 3 clips** for TikTok, Reels, and Shorts (15-60 seconds each)\n' +
            '3. **Turn the script** into a LinkedIn post\n' +
            '4. **Share screenshots/key points** as Instagram carousel\n' +
            '5. **Post behind-the-scenes** on Stories\n' +
            '6. **Save the transcript** for a blog post\n' +
            '\n' +
            '**Time savings:** Instead of making 6 separate pieces of content, you make 1 video + 30 minutes of repurposing = all platforms covered!\n' +
            '\n' +
            '![Social media apps on phone screen](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '> **Pro Tip:** Start with ONE platform and master it before adding others. Trying to do all 4 at once can be overwhelming. TikTok and Instagram Reels are the easiest to grow on for beginners!',
            'article',
            1,
          ),
          makeLesson(
            'Monetisation Strategies for African Creators',
            'From YouTube ad revenue and brand sponsorships to digital products and affiliate marketing — ' +
            'learn how African creators can make money from content. This lesson includes real earning examples in RWF, ' +
            'payment platforms that work in Rwanda, and local tax considerations.\n\n' +
            '### 💰 Monetisation Methods (with Real RWF Examples):\n' +
            '\n' +
            '**1. YouTube Ad Revenue**\n' +
            'Join YouTube Partner Programme (1,000 subs + 4,000 watch hours). Rwandan creators earn roughly ' +
            '500,000 - 2,000,000 RWF per million views depending on niche.\n' +
            '**Rwandan creators to follow:** Ruger (music), Diana Wangeci (lifestyle), local vloggers.\n' +
            '\n' +
            '**2. Brand Deals & Sponsorships**\n' +
            'Local brands pay creators 100,000 - 5,000,000 RWF per campaign. Brands like Airtel, MTN, BK, ' +
            'Inyange, and local NGOs regularly sponsor creators.\n' +
            '**Tips:** Build a media kit with your stats and pitch to brands that match your content.\n' +
            '\n' +
            '**3. Digital Products**\n' +
            'Sell e-books, templates, online courses, or presets. Price: 5,000 - 100,000 RWF. ' +
            'Payment via MoMo, Airtel Money, or bank transfer.\n' +
            '**Platforms:** Gumroad, Payhip, or sell directly via WhatsApp.\n' +
            '\n' +
            '**4. Affiliate Marketing**\n' +
            'Earn commission promoting products. Jumia Rwanda offers up to 11% commission on sales. ' +
            'Also: Amazon Associates, local affiliate programmes.\n' +
            '**Example:** Review a smartphone, include your affiliate link, earn 15,000 - 50,000 RWF per sale.\n' +
            '\n' +
            '**5. Crowdfunding & Fan Support**\n' +
            'Platforms: Patreon (international), Buy Me a Coffee, or direct via MoMo.\n' +
            'Rwandan fans can support creators with as little as 1,000 RWF/month via mobile money.\n' +
            '\n' +
            '### 📱 Payment Platforms That Work in Rwanda:\n' +
            '- **MoMo (MTN Mobile Money)** — Most popular, instant payments\n' +
            '- **Airtel Money** — Also widely accepted\n' +
            '- **Bank transfer** — For larger payments\n' +
            '- **PayPal** — International clients\n' +
            '- **WorldRemit/Wise** — Receive from abroad\n' +
            '\n' +
            '### ⚠️ Tax Considerations for Rwandan Creators:\n' +
            '- Register with RRA for a TIN (free)\n' +
            '- Income tax: 0% first 360,000 RWF/month, then 10-30%\n' +
            '- Keep records of all earnings and expenses\n' +
            '- Consider an accountant once you earn over 1,000,000 RWF/month\n' +
            '\n' +
            '> **Reality check:** Most creators start with 50,000 - 200,000 RWF/month. ' +
            'With consistency, top Rwandan creators earn 2,000,000 - 10,000,000+ RWF/month!',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=8ZsQIa-LBIQ', videoTitle: 'Make Short Form Content Go Viral - Quick Tips' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review audience growth and monetisation strategies.',
            [
              {
                question: 'Which platform is best for long-form educational content?',
                options: ['TikTok', 'YouTube', 'Instagram', 'Snapchat'],
                correctIndex: 1,
                explanation: 'YouTube is the best platform for long-form educational content with its search-friendly algorithm.',
              },
              {
                question: 'What is affiliate marketing?',
                options: ['Selling your own products', 'Earning commission by promoting other peoples products', 'Running ads', 'Getting sponsored by brands'],
                correctIndex: 1,
                explanation: 'Affiliate marketing means earning a commission when someone buys through your referral link.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Content Strategy Project',
            'Create a complete content strategy and sample content.',
            'Plan a content strategy for a niche of your choice and create a sample content piece.',
            [
              {
                question: 'Outline a one-month content calendar for your chosen niche. Include 8 content ideas with platform, format, and key message for each.',
                type: 'open',
                explanation: 'Mix content types: educational, entertaining, behind-the-scenes, and promotional.',
                points: 25,
              },
              {
                question: 'Which monetisation strategy would work best for your content and why?',
                type: 'open',
                explanation: 'Consider your audience size, niche, and platform. Multiple streams are ideal.',
                points: 15,
              },
            ],
            4,
          ),
        ],
        'Grow an engaged audience and implement at least one monetisation strategy.',
      ),


      makeModule(
        'Module 3: Advanced Video Production',
        'Take your video content to the next level with professional editing skills.',
        [
          makeLesson(
            'Video Storytelling & Narrative Structure',
            'Hook-retain-payoff for TikTok, educational for YouTube, inspirational for Instagram.\n\n### Framework:\n1. Hook (0-3s) - Question or bold statement\n2. Problem (3-15s) - The audience problem\n3. Solution (15-45s) - Teach or demonstrate\n4. Payoff (45-60s) - Results or key insight\n5. Call to action - What viewers should do',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=K9lP3mR7nJ2', videoTitle: 'Video Storytelling Tips' },
          ),
          makeLesson(
            'Smartphone Video Production Mastery',
            'Now that you have the right phone, let us master how to use it for professional-looking videos. ' +
            'This lesson covers composition, lighting, stabilisation, and audio techniques — all using ' +
            'your smartphone and affordable accessories available in Rwanda.\n\n' +
            '---\n\n' +
            '## 📐 Camera Settings for Your Phone\n' +
            '\n' +
            'Before filming, check these settings:\n' +
            '- **Resolution:** Set to 1080p at 30fps (most phones)\n' +
            '- **Aspect ratio:** 16:9 for YouTube, 9:16 for TikTok/Reels\n' +
            '- **Grid lines:** Turn ON grid lines (Settings \u2192 Camera \u2192 Grid) for composition\n' +
            '- **HDR:** Turn ON for better colours in bright light\n' +
            '- **Stabilisation:** Turn ON video stabilisation if available\n' +
            '- **Flash:** NEVER use flash — use natural light or ring light instead\n' +
            '\n' +
            '![Phone camera settings](https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 🎨 Composition Rules (Make Your Videos Look Professional)\n' +
            '\n' +
            '**1. Rule of Thirds**\n' +
            'Imagine 2 horizontal and 2 vertical lines dividing your screen like a tic-tac-toe grid. ' +
            'Place your subject where the lines intersect (not in the centre). This makes videos look instantly more professional.\n' +
            '\n' +
            '**2. Headroom**\n' +
            'Leave a small space above your head. Too much space = amateur. Too little = cramped.\n' +
            '\n' +
            '**3. Eye Level**\n' +
            'Hold the camera at eye level or slightly above. Filming from below makes you look unprofessional.\n' +
            '\n' +
            '**4. Clean Background**\n' +
            'Remove clutter behind you. A plain wall, bookshelf, or outdoor scenery works best.\n' +
            'In Rwanda, film outside with banana trees, hills, or Kigali city views as your background!\n' +
            '\n' +
            '---\n\n' +
            '## 💡 Lighting — The Secret to Pro-Looking Videos\n' +
            '\n' +
            '### Natural Light (Free!)\n' +
            '- **Golden hour:** 6-8 AM and 4-6 PM in Rwanda — soft, warm light\n' +
            '- Face a window or door for even lighting\n' +
            '- Avoid midday sun (harsh shadows on your face)\n' +
            '- In Rwanda, cloudy days actually give you PERFECT diffused light!\n' +
            '\n' +
            '### Ring Light (25,000 \u2013 40,000 RWF)\n' +
            '- Place the ring light behind your phone, at eye level\n' +
            '- Adjust brightness — not too bright, not too dim\n' +
            '- Available at: Kimironko Market, Remera shops, [Jumia Rwanda](https://www.jumia.co.rw)\n' +
            '\n' +
            '### Three-Point Lighting Setup (Pro)\n' +
            '1. **Key light:** Main light (ring light or window), 45 degrees to your face\n' +
            '2. **Fill light:** Secondary light on the opposite side, less bright\n' +
            '3. **Back light:** Light behind you to separate from background\n' +
            '\n' +
            '![Ring light setup](https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 🎤 Audio — Why Sound Matters More Than Video\n' +
            '\n' +
            'Viewers forgive bad video quality, but they NEVER forgive bad audio.\n' +
            '\n' +
            '**Free Audio Tips:**\n' +
            '- Record in a quiet room with soft surfaces (curtains, carpet absorb echo)\n' +
            '- Speak 15-20cm from the phone microphone\n' +
            '- Avoid filming near roads, fans, or fridges (background noise ruins videos)\n' +
            '\n' +
            '**Affordable Mic Options in Rwanda:**\n' +
            '| Mic Type | Price | Best For | Where to Buy |\n' +
            '|---|---|---|---|\n' +
            '| Lavalier (clip-on) | 15,000 \u2013 25,000 RWF | TikTok, Reels, talking-heads | Remera, Jumia |\n' +
            '| Shotgun (directional) | 40,000 \u2013 80,000 RWF | YouTube, outdoor filming | Jumia, Ikaze |\n' +
            '| USB microphone | 50,000 \u2013 100,000 RWF | Voiceovers, podcasting | CNA, IKOBE |\n' +
            '\n' +
            '![Lavalier microphone](https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 🤳 Stabilisation — No More Shaky Videos\n' +
            '\n' +
            '**Free Methods:**\n' +
            '- Rest your phone on a table, wall, or stack of books\n' +
            '- Hold phone with TWO hands, elbows tucked into your body\n' +
            '- Lean against a wall for support\n' +
            '- Breathe out slowly while recording\n' +
            '\n' +
            '**Affordable Tools:**\n' +
            '- **Phone tripod:** 20,000 \u2013 40,000 RWF (Kimironko, Remera)\n' +
            '- **Gimbal stabiliser:** 80,000 \u2013 150,000 RWF (Jumia, for walking videos)\n' +
            '\n' +
            '![Phone on tripod](https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '---\n\n' +
            '## 📋 Pre-Filming Checklist\n' +
            '\n' +
            'Before you hit record, check these:\n' +
            '- [ ] Phone battery charged (>50%)\n' +
            '- [ ] Storage space available (check Settings \u2192 Storage)\n' +
            '- [ ] Lens cleaned (wipe with a soft cloth!)\n' +
            '- [ ] Airplane mode ON (no interruptions from calls/messages)\n' +
            '- [ ] Ring light positioned at eye level\n' +
            '- [ ] Background clean and uncluttered\n' +
            '- [ ] Microphone clipped and positioned correctly\n' +
            '- [ ] Water nearby (talking makes you thirsty!)\n' +
            '\n' +
            '## 🎬 Rwanda-Specific Content Ideas You Can Film Today\n' +
            '\n' +
            '1. **Kigali city tour** — film at Kigali Convention Centre, BK Arena, or Rwanda Art Museum\n' +
            '2. **Akagera or Nyungwe trip** — nature content performs great globally\n' +
            '3. **Umuganda community work** — authentic Rwandan content\n' +
            '4. **Local food review** — brochettes, isombe, ugali, Rolex\n' +
            '5. **Kigali Genocide Memorial** — educational/historical content\n' +
            '6. **Rwandan fashion** — kitenge, agaseke, traditional wear\n' +
            '7. **Coffee farm tour** — Rwanda is famous for coffee!\n' +
            '8. **Motorbike taxi ride (taxi-moto)** — authentic daily life\n' +
            '9. **Market day at Kimironko** — colourful, engaging content\n' +
            '10. **Dance challenge with traditional Intore dance** — blend old and new\n' +
            '\n' +
            '![Filming outdoors in nature](https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600&h=400)\n' +
            '\n' +
            '> **Pro Tip:** The best content in Rwanda is AUTHENTIC content. Show your real life, your real community, and your real culture. Audiences connect with genuine stories, not fake perfection!',
            'article',
            2,
          ),
          makeLesson(
            'Editing with CapCut & DaVinci Resolve',
            'Both free tools: CapCut for mobile, DaVinci Resolve for professional editing.\n\n### Essentials:\n1. Cutting and trimming - Remove mistakes\n2. Transitions - Simple cuts look professional\n3. Text and titles - Captions, lower thirds\n4. Music - YouTube Audio Library (royalty-free)\n5. Colour correction - Consistent look\n6. Export settings - Optimise per platform',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review video production concepts.',
            [
              { question: 'Most critical element of short-form video?', options: ['Fancy transitions', 'Hook in first 3 seconds', 'Background music', 'Expensive gear'], correctIndex: 1, explanation: 'The first 3 seconds grab attention and prevent scrolling.' },
              { question: 'Free tool for professional colour correction?', options: ['CapCut', 'DaVinci Resolve', 'iMovie', 'Windows Editor'], correctIndex: 1, explanation: 'DaVinci Resolve has professional colour correction tools for free.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Video Production Project',
            'Plan and produce a short-form video.',
            'Create a 45-second video with script, visuals, and editing plan.',
            [
              { question: 'Plan a 45-second video for TikTok/Reels with script: hook, problem, solution, payoff, CTA and visuals.', type: 'open', explanation: 'Follow the storytelling framework. Make it educational or entertaining.', points: 20 },
              { question: 'Describe your editing plan: cuts, transitions, text overlays, music, and colour adjustments.', type: 'open', explanation: 'Be specific about timing, captions, music type, and colour grading.', points: 15 },
            ],
            5,
          ),
        ],
        'Produce professional-quality videos using smartphone and free editing tools.',
      ),

      makeModule(
        'Module 4: Platform-Specific Growth Strategies',
        'Master algorithms and best practices for each major platform.',
        [
          makeLesson(
            'YouTube Growth & SEO Strategy',
            'Keyword research, thumbnails, audience retention, and algorithm strategy.\n\n### Success Factors:\n1. Keyword research - Use VidIQ for high-volume keywords\n2. Compelling titles - Include keyword + curiosity\n3. Custom thumbnails - Bright, bold, text overlay\n4. Strong first 30 seconds - Hook viewers\n5. Audience retention - Pattern interrupts\n6. Call to action - Likes, comments, subscribe',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=R0fQ5mN2jK7', videoTitle: 'YouTube Growth Strategy' },
          ),
          makeLesson(
            'TikTok & Instagram Reels Mastery',
            'Trending sounds, hashtag strategies, posting times, and going viral.\n\n### Success Tips:\n1. Use trending sounds - Check Creative Centre\n2. Hook in first second - Motion or text\n3. Keep it tight - 15-30 seconds\n4. Use captions - Most watch without sound\n5. Post daily - Consistency drives growth\n6. Engage your niche - Comment on similar creators',
            'article',
            2,
          ),
          makeLesson(
            'Multi-Platform Content Strategy',
            'Repurpose content efficiently across platforms.\n\n### Repurposing:\n1. Create pillar content (10-min YouTube)\n2. Extract clips for TikTok, Reels, Shorts\n3. Turn insights into social posts\n4. Create blog from transcript\n5. Design quote graphics for Instagram\n6. Compile videos into a course',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review platform growth strategies.',
            [
              { question: 'Tool for YouTube keyword research?', options: ['Canva', 'VidIQ', 'CapCut', 'Premiere'], correctIndex: 1, explanation: 'VidIQ is a browser extension for YouTube SEO.' },
              { question: 'TikTok posting frequency for growth?', options: ['Weekly', 'At least daily', 'Monthly', 'Hourly'], correctIndex: 1, explanation: 'TikTok rewards consistent daily posting.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Multi-Platform Strategy',
            'Create a 30-day multi-platform content strategy.',
            'Plan 30 pieces of content across 3 platforms with repurposing strategy.',
            [
              { question: 'Create a 30-day calendar for 3 platforms showing how each repurposes from pillar content.', type: 'open', explanation: 'Start with pillar on YouTube/blog, repurpose for TikTok, LinkedIn, X.', points: 25 },
              { question: 'How would you adapt content style per platform while keeping consistent branding?', type: 'open', explanation: 'YouTube favours depth (5-15 min), TikTok quick entertainment (15-60 sec), LinkedIn professional insights.', points: 15 },
            ],
            5,
          ),
        ],
        'Grow on multiple content platforms using platform-specific strategies.',
      ),

      makeModule(
        'Module 5: Building a Creator Business',
        'Turn content creation into a sustainable business with multiple revenue streams.',
        [
          makeLesson(
            'Revenue Streams for African Creators',
            'YouTube ad revenue, sponsorships, affiliate marketing, and digital products.\n\n### Streams:\n1. YouTube Ads - 1,000 subs + 4,000 watch hours\n2. Brand sponsorships - Brands pay for features\n3. Affiliate marketing - Commission on sales\n4. Digital products - E-books, templates, courses\n5. Paid communities - Patreon, Buy Me a Coffee\n6. Consulting/coaching - One-on-one\n7. Merchandise - Branded products',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=T6kD9pQ2mN5', videoTitle: 'How African Creators Make Money' },
          ),
          makeLesson(
            'Brand Deals & Sponsorships',
            'Media kit, pitching brands, negotiating rates, and delivering value.\n\n### Steps:\n1. Build media kit - Stats, engagement, past work\n2. Identify target brands - Align with your content\n3. Create pitch - Show value you deliver\n4. Set rates - Based on reach and engagement\n5. Deliver results - Authentic content\n6. Measure ROI - Show brand the value',
            'article',
            2,
          ),
          makeLesson(
            'Creating & Selling Digital Products',
            'E-books, courses, templates, presets, and printables.\n\n### Ideas:\n1. E-books - Compile expertise into a guide\n2. Online courses - Teach a skill\n3. Templates - Canva, Notion, spreadsheet\n4. Presets - Lightroom, CapCut\n5. Stock content - Photos, videos, music\n6. Printables - Planners, journals',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review creator business concepts.',
            [
              { question: 'YouTube Partner Programme requirements?', options: ['100 subs', '1,000 subs + 4,000 hours', '10,000 subs', '1M views'], correctIndex: 1, explanation: 'Need 1,000 subscribers and 4,000 watch hours in the last 12 months.' },
              { question: 'What is a media kit?', options: ['Camera kit', 'Document showing audience stats and rates', 'Video collection', 'Scheduling tool'], correctIndex: 1, explanation: 'Media kit shows brands your audience, engagement, and sponsorship options.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Creator Project — Earn 500,000 RWF in 30 Days!',
            'Your mission: Earn REAL money from content creation in 30 days. Not a simulation!',
            '🚀 **THE 30-DAY CONTENT CREATOR CHALLENGE** 🚀\n\nYour target: Earn 300,000-500,000 RWF in 30 days using ONLY what you learned in this course. That is enough for an iPhone down payment!\n\n**Week 1: Post 15 videos (Target: 0 RWF, build followers)**\nPick ONE niche, create accounts on TikTok + Instagram, post 2-3 videos/day, reach 500+ followers.\n\n**Week 2: Affiliate Marketing Sprint (Target: 50,000-100,000 RWF)**\nSign up for [Jumia Rwanda Affiliate Programme](https://www.jumia.co.rw/affiliate) (free, 11% commission). Create 10 product review videos. Example: sell 5 phones at 200,000 RWF each = 110,000 RWF commission!\n\n**Week 3: Digital Product Launch (Target: 100,000-200,000 RWF)**\nCreate [Canva templates](https://www.canva.com), [CapCut](https://www.capcut.com) presets, or mini e-book. Price at 5,000-15,000 RWF each. Sell 20 at 10,000 RWF = 200,000 RWF via MoMo payments.\n\n**Week 4: Brand Deal Outreach (Target: 150,000-200,000 RWF)**\nBuild a media kit on Canva. DM 20 local brands (Airtel, MTN, BK, Inyange, restaurants). Offer: 2 TikToks + 1 Insta post + 1 Story for 150,000 RWF.\n\n**🎯 Total Potential: 300,000-500,000 RWF in Month 1!** Enough for a new Infinix Hot 40 Pro (170,000 RWF) + full creator kit (80,000 RWF) + savings toward iPhone!\n\n![Money from content creation](https://images.unsplash.com/photo-1553729459-afe8f2e0e8c5?auto=format&fit=crop&q=80&w=600&h=400)\n\n> **Reality Check:** You will not become a millionaire overnight. But post consistently for 30 days, promote affiliate products, and reach out to brands — you CAN earn 300,000 RWF. Top Rwandan creators earn 5,000,000+ RWF/month!',
            [
              { question: 'WEEK 1 REPORT: Which niche and platform? How many followers after 15 posts? Best performing content?', type: 'open', explanation: 'Be honest. Even 100 followers is progress!', points: 20 },
              { question: 'WEEK 2 REPORT: Which affiliate products promoted? How many clicks/sales? Commission earned?', type: 'open', explanation: 'Share Jumia affiliate dashboard results.', points: 20 },
              { question: 'WEEK 3 REPORT: What digital product created? How many sales? Total revenue?', type: 'open', explanation: 'Describe product, pricing, promotion strategy, and sales.', points: 20 },
              { question: 'WEEK 4 REPORT: Which brands contacted? How many responded? Deals landed? TOTAL EARNINGS?', type: 'open', explanation: 'Share pitch template and results. Rejections are learning!', points: 25 },
            ],
            5,
          ),
        ],
        'Monetise content creation through multiple revenue streams.',
      ),

/* INSERT_MODULES_7 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 8: Project Management Fundamentals
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Project Management for Rwandan Professionals',
    description:
      ' Every organisation in Rwanda needs skilled project managers — from govt to NGOs to startups. ' +
      'Learn to plan, execute, and deliver projects using international standards (PMP, PRINCE2) ' +
      'adapted for the Rwandan context. Master Agile, Scrum, risk management, budgeting, ' +
      'and stakeholder communication. Boost your career with these in-demand skills.',
    category: 'Business',
    level: 'Intermediate',
    price: 1000,
    searchImage: 'project management planning team collaboration',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Project Management Foundations',
        'Understand the core concepts, methodologies, and tools of project management.',
        [
          makeLesson(
            'What is Project Management?',
            'Projects are temporary endeavours to create a unique product, service, or result. Unlike ongoing operations, ' +
            'projects have a defined start and end. This lesson covers the definition of a project, the role of a project ' +
            'manager, and the triple constraint: scope, time, and cost.\n\n' +
            '### Key Concepts:\n' +
            '- **Project** — Temporary, unique, progressive elaboration\n' +
            '- **Operations** — Ongoing, repetitive, maintaining the business\n' +
            '- **Triple Constraint** — Scope, Time, Cost — change one, the others adjust\n' +
            '- **Stakeholders** — Anyone affected by the project',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=ojpTDcdm0vQ', videoTitle: 'Scrum 101 - Agile Fundamentals in 3 Min' },
          ),
          makeLesson(
            'Project Lifecycle & Methodologies',
            'Every project goes through phases: Initiation, Planning, Execution, Monitoring & Control, and Closure. ' +
            'Learn about different methodologies — Waterfall vs Agile — and when to use each.\n\n' +
            '### Methodologies:\n' +
            '- **Waterfall** — Sequential phases, good for well-defined projects\n' +
            '- **Agile** — Iterative cycles, good for evolving requirements\n' +
            '- **Scrum** — Sprints, daily standups, product owner, scrum master\n' +
            '- **Kanban** — Visual workflow, continuous delivery',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your project management fundamentals.',
            [
              {
                question: 'What are the three elements of the triple constraint?',
                options: ['People, Process, Technology', 'Scope, Time, Cost', 'Quality, Risk, Resources', 'Planning, Execution, Closure'],
                correctIndex: 1,
                explanation: 'The triple constraint consists of scope, time, and cost — change one and the others are affected.',
              },
              {
                question: 'Which methodology is best for projects with evolving requirements?',
                options: ['Waterfall', 'Agile', 'Both are equally good', 'Neither'],
                correctIndex: 1,
                explanation: 'Agile is designed for projects where requirements may change during development.',
              },
            ],
            3,
          ),
        ],
        'Define a project and select the appropriate methodology.',
      ),
      makeModule(
        'Module 2: Planning, Execution & Tools',
        'Master project planning, risk management, and popular project management tools.',
        [
          makeLesson(
            'Creating a Project Plan',
            'A project plan is your roadmap. Learn to define scope, create a work breakdown structure (WBS), ' +
            'estimate time and costs, develop a schedule (Gantt chart), and assign resources.\n\n' +
            '### Planning Steps:\n' +
            '1. **Scope statement** — What is included and excluded\n' +
            '2. **WBS** — Break work into manageable pieces\n' +
            '3. **Schedule** — Sequence activities, estimate durations\n' +
            '4. **Budget** — Estimate costs, plan contingencies\n' +
            '5. **Risk register** — Identify, assess, and plan responses',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Risk Management & Communication',
            'Every project has risks. Learn how to identify, assess, and mitigate risks. Also covers stakeholder ' +
            'communication — who needs what information, when, and how.\n\n' +
            '### Risk Management Process:\n' +
            '1. **Identify risks** — What could go wrong?\n' +
            '2. **Assess impact & probability** — How likely? How bad?\n' +
            '3. **Plan responses** — Avoid, mitigate, transfer, accept\n' +
            '4. **Monitor** — Track and update throughout the project',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=o8FCGYJtsMY', videoTitle: 'How to Use Agile and Scrum - Quick Summary' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review planning and risk management concepts.',
            [
              {
                question: 'What does WBS stand for in project management?',
                options: ['Work Breakdown Structure', 'Weekly Business Summary', 'Work Budget Schedule', 'Whole Business System'],
                correctIndex: 0,
                explanation: 'A Work Breakdown Structure breaks a project into smaller, manageable components.',
              },
              {
                question: 'What are the four risk response strategies?',
                options: ['Start, Stop, Continue, Change', 'Avoid, Mitigate, Transfer, Accept', 'Plan, Do, Check, Act', 'High, Medium, Low, None'],
                correctIndex: 1,
                explanation: 'The four risk response strategies are Avoid, Mitigate, Transfer, and Accept.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Project Plan Assignment',
            'Create a complete project plan for a real or hypothetical project.',
            'Develop a project plan including scope, WBS, schedule, budget, and risk register.',
            [
              {
                question: 'Choose a project and create a Work Breakdown Structure with at least 8 tasks across 3 levels.',
                type: 'open',
                explanation: 'Example: Organising a community event — Level 1: Event, Level 2: Venue, Marketing, Logistics, etc.',
                points: 20,
              },
              {
                question: 'Identify three potential risks for your project and describe your response strategy for each.',
                type: 'open',
                explanation: 'Use the four strategies: avoid, mitigate, transfer, or accept for each risk.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Create a complete project plan with scope, schedule, budget, and risk management.',
      ),


      makeModule(
        'Module 3: Agile & Scrum Mastery',
        'Master Agile methodologies and the Scrum framework.',
        [
          makeLesson(
            'Understanding Agile & The Agile Manifesto',
            'Four values of the Agile Manifesto and when to use Agile.\n\n### Values:\n1. Individuals and interactions over processes/tools\n2. Working software over comprehensive docs\n3. Customer collaboration over contract negotiation\n4. Responding to change over following a plan\n\n### When to Use Agile:\n- Requirements likely to change\n- Customer needs not fully understood\n- Innovation or new technology\n- Speed to market is important',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=7jF3kM9pR2n', videoTitle: 'Agile Project Management Guide' },
          ),
          makeLesson(
            'Scrum: Roles, Events & Artifacts',
            'Three roles, five events, and three artifacts of Scrum.\n\n### Roles:\n1. Product Owner - Manages backlog\n2. Scrum Master - Facilitates, removes impediments\n3. Development Team - Self-organising, cross-functional\n\n### Events:\n- Sprint Planning (2-4 hours for 2-week sprint)\n- Daily Scrum (15 min daily)\n- Sprint Review (1-2 hours at sprint end)\n- Sprint Retrospective (1-2 hours)',
            'article',
            2,
          ),
          makeLesson(
            'Agile Estimation & Planning',
            'Story points, planning poker, velocity, and burndown charts.\n\n### Techniques:\n1. Story points - 1,2,3,5,8,13,21\n2. Planning poker - Team consensus estimation\n3. T-shirt sizing - XS, S, M, L, XL\n4. Velocity - Points per sprint\n5. Burndown charts - Track remaining vs time',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review Agile and Scrum concepts.',
            [
              { question: 'Daily Scrum duration?', options: ['30 min', '15 min', '1 hour', '5 min'], correctIndex: 1, explanation: 'Daily Scrum is a 15-minute time-boxed event.' },
              { question: 'Who manages the Product Backlog?', options: ['Scrum Master', 'Product Owner', 'Development Team', 'Sponsor'], correctIndex: 1, explanation: 'Product Owner manages and prioritises the Product Backlog.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Scrum Implementation Plan',
            'Implement Scrum for a project.',
            'Create a Product Backlog, plan first Sprint, and define team roles.',
            [
              { question: 'Create a Product Backlog with 10+ user stories with estimates, priorities, and acceptance criteria for top 3.', type: 'open', explanation: 'Format: As a [user] I want to [goal] so that [benefit]. Use MoSCoW prioritisation.', points: 20 },
              { question: 'Plan the first 2-week Sprint: goal, items, capacity, and ceremony schedule.', type: 'open', explanation: 'Assume 4-5 person team. Calculate capacity based on available person-days.', points: 15 },
            ],
            5,
          ),
        ],
        'Implement Scrum framework for Agile project management.',
      ),

      makeModule(
        'Module 4: Leadership & Stakeholder Management',
        'Develop leadership skills and manage project stakeholders.',
        [
          makeLesson(
            'Project Leadership vs Management',
            'Management is processes; leadership is people and vision.\n\n### Leadership Qualities:\n1. Vision - See the bigger picture\n2. Communication - Clear, frequent, transparent\n3. Empathy - Understand team challenges\n4. Decisiveness - Timely decisions\n5. Adaptability - Adjust based on feedback\n6. Integrity - Model expected behaviour',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=X2pN5jR8mK1', videoTitle: 'Project Leadership Skills' },
          ),
          makeLesson(
            'Stakeholder Identification & Analysis',
            'Power/Interest Grid and engagement strategies.\n\n### Analysis:\n1. Identify all stakeholders\n2. Assess interest (low-high)\n3. Assess influence/power (low-high)\n4. Map on Power/Interest Grid:\n   - High power/interest: Manage closely\n   - High power/low interest: Keep satisfied\n   - Low power/high interest: Keep informed\n   - Low power/low interest: Monitor',
            'article',
            2,
          ),
          makeLesson(
            'Conflict Resolution & Team Motivation',
            'Five conflict resolution styles and team motivation techniques.\n\n### Styles:\n1. Competing - Quick urgency decisions\n2. Collaborating - Win-win for complex issues\n3. Compromising - Both give something\n4. Avoiding - Trivial or cooling off\n5. Accommodating - Preserve harmony\n\n### Motivation:\n1. Recognition and appreciation\n2. Professional development\n3. Clear goals and autonomy\n4. Fair workload\n5. Regular feedback',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review leadership concepts.',
            [
              { question: 'Power/Interest Grid used for?', options: ['Cost estimation', 'Analysing stakeholders', 'Creating schedules', 'Allocating resources'], correctIndex: 1, explanation: 'The Power/Interest Grid categorises stakeholders by influence and interest.' },
              { question: 'Style where both sides make concessions?', options: ['Competing', 'Collaborating', 'Compromising', 'Avoiding'], correctIndex: 2, explanation: 'Compromising involves both parties making concessions.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Stakeholder Management Plan',
            'Create a comprehensive stakeholder plan.',
            'Identify stakeholders, analyse interests, and develop engagement strategies.',
            [
              { question: 'Identify 8+ stakeholders for a project, create Power/Interest Grid, and describe engagement strategies.', type: 'open', explanation: 'Include: government, community, funders, contractors, workers, regulators, patients.', points: 20 },
              { question: 'Describe a project conflict and how you would resolve it using the appropriate style.', type: 'open', explanation: 'Choose from: competing, collaborating, compromising, avoiding, accommodating.', points: 15 },
            ],
            5,
          ),
        ],
        'Lead project teams effectively and manage stakeholder relationships.',
      ),

      makeModule(
        'Module 5: Advanced PM Tools & Career Development',
        'Master professional PM tools and prepare for PMP certification.',
        [
          makeLesson(
            'Project Management Software Overview',
            'MS Project, Jira, Trello, Asana, Monday.com, ClickUp.\n\n### Comparison:\n1. MS Project - Waterfall, detailed scheduling\n2. Jira - Agile/Scrum, software development\n3. Trello - Simple Kanban, small teams\n4. Asana - General team collaboration\n5. Monday.com - Visual management\n6. ClickUp - All-in-one (free tier)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Z9nL4pR2jM7', videoTitle: 'PM Software Overview' },
          ),
          makeLesson(
            'PMP Certification & Career Growth',
            'Requirements, exam structure, and study resources.\n\n### PMP Requirements:\n- Secondary degree: 5 years PM + 35 hours education\n- Four-year degree: 3 years PM + 35 hours education\n\n### Other Certs:\n- CAPM - Entry level\n- PRINCE2 - UK/EU/Africa\n- PMI-ACP - Agile focused\n- CSM/PSM - Scrum Master',
            'article',
            2,
          ),
          makeLesson(
            'Building a PM Career in Rwanda',
            'Industries, salaries, and career positioning.\n\n### Industries:\n1. Construction - VISION 2050 projects\n2. IT - Software, digital transformation\n3. NGOs - USAID, UN, development\n4. Financial services - Bank projects, fintech\n5. Government - MINECOFIN, RDB, districts\n6. Manufacturing - Agri-processing',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review PM tools and career concepts.',
            [
              { question: 'Best tool for Agile/Scrum teams?', options: ['MS Project', 'Jira', 'Excel', 'Word'], correctIndex: 1, explanation: 'Jira is designed for Agile and Scrum with sprints and backlog management.' },
              { question: 'PMP experience with four-year degree?', options: ['5 years', '3 years', '2 years', '1 year'], correctIndex: 1, explanation: 'With a degree, need 3 years (4,500 hours) of PM experience.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final PM Project',
            'Create a complete project management portfolio.',
            'Project charter, WBS, schedule, budget, risk register, and career plan.',
            [
              { question: 'Create a complete project plan: charter, WBS, schedule, budget, risk register (5+ risks).', type: 'open', explanation: 'Use PMBOK framework. Real project like community event, launch, or renovation.', points: 25 },
              { question: 'Create a 12-month PM career plan: skills, certifications, networking, target roles.', type: 'open', explanation: 'Research current PM job openings in Rwanda to understand requirements.', points: 20 },
            ],
            5,
          ),
        ],
        'Use professional PM tools and develop a project management career.',
      ),

/* INSERT_MODULES_8 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 9: Personal Finance & Investment for Africans
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Build Wealth: Personal Finance & Investing in Rwanda',
    description:
      ' Make your money work for you — with Rwandan investment options. Learn to budget, save, ' +
      'and invest using SACCOs, the Rwanda Stock Exchange, treasury bills, mutual funds, ' +
      'and real estate. Designed for Rwandans who want to build wealth and achieve financial freedom. ' +
      'No finance background needed — practical examples from the Rwandan market.',
    category: 'Business',
    level: 'Beginner',
    price: 1000,
    searchImage: 'personal finance investment savings africa',
    modules: [
      makeModule(
        'Module 1: Financial Foundations',
        'Build a strong foundation for managing your personal finances.',
        [
          makeLesson(
            'Understanding Your Money Mindset',
            'Your relationship with money affects every financial decision you make. This lesson explores ' +
            'different money mindsets, how your upbringing and culture shape your financial habits, and how ' +
            'to develop a wealth-building mindset.\n\n' +
            '### Money Mindsets:\n' +
            '- **Scarcity mindset** — Money is limited, fear-based decisions\n' +
            '- **Abundance mindset** — Opportunities exist, strategic decisions\n' +
            '- **Wealth-building mindset** — Focus on assets, long-term thinking',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Iq72X8V64hQ', videoTitle: 'Investing Explained in Under 5 Minutes' },
          ),
          makeLesson(
            'Budgeting & Saving',
            'Learn practical budgeting methods — 50/30/20 rule, zero-based budgeting, envelope system — ' +
            'and saving strategies that work even on a modest income. Includes tools and apps available in Africa.\n\n' +
            '### Budgeting Methods:\n' +
            '- **50/30/20** — 50% needs, 30% wants, 20% savings\n' +
            '- **Zero-based** — Every dollar has a job\n' +
            '- **Envelope system** — Cash for each category\n\n' +
            '### Saving Tools:\n' +
            '- Mobile money savings pockets\n' +
            '- SACCOs (Savings and Credit Cooperatives)\n' +
            '- Automated transfers to savings account',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your financial foundations.',
            [
              {
                question: 'What percentage of income should go to savings according to the 50/30/20 rule?',
                options: ['10%', '20%', '30%', '50%'],
                correctIndex: 1,
                explanation: 'The 50/30/20 rule allocates 20% of income to savings and debt repayment.',
              },
              {
                question: 'What is a SACCO?',
                options: ['A type of bank account', 'A Savings and Credit Cooperative', 'A stock exchange', 'An insurance company'],
                correctIndex: 1,
                explanation: 'A SACCO is a member-owned financial cooperative that provides savings and credit services.',
              },
            ],
            3,
          ),
        ],
        'Create a personal budget and implement a saving strategy.',
      ),
      makeModule(
        'Module 2: Investing for Wealth Building',
        'Learn how to grow your wealth through different investment vehicles available in Africa.',
        [
          makeLesson(
            'Introduction to Investing',
            'Investing is putting your money to work so it grows over time. Learn the difference between ' +
            'saving and investing, understand risk and return, and explore the power of compound interest.\n\n' +
            '### Investment Basics:\n' +
            '- **Risk vs Return** — Higher potential returns come with higher risk\n' +
            '- **Compound interest** — The 8th wonder of the world\n' +
            '- **Diversification** — Do not put all eggs in one basket\n' +
            '- **Time horizon** — Longer time = more risk capacity',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeLesson(
            'Investment Options in Africa',
            'Explore the investment options available to African investors — from treasury bills and bonds ' +
            'to stocks, mutual funds, real estate, and alternative investments like farming or SACCOs.\n\n' +
            '### Investment Options:\n' +
            '1. **Treasury Bills** — Low risk, short term (91-364 days)\n' +
            '2. **Money Market Funds** — Low risk, liquid\n' +
            '3. **Stock Market** — Medium risk, long term (RSE, NSE, USE)\n' +
            '4. **Real Estate** — Medium-high risk, long term\n' +
            '5. **Mutual Funds** — Professionally managed, diversified',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=bfENsVP77VQ', videoTitle: 'Beginner Investing - The Only Guide You Need' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review investment concepts.',
            [
              {
                question: 'What is the relationship between risk and return in investing?',
                options: ['Higher risk = guaranteed losses', 'Higher potential return = higher risk', 'No relationship', 'Lower risk = higher return'],
                correctIndex: 1,
                explanation: 'Higher potential returns are associated with higher risk — there is no free lunch in investing.',
              },
              {
                question: 'Which investment is considered lowest risk?',
                options: ['Stock market', 'Treasury bills', 'Real estate', 'Cryptocurrency'],
                correctIndex: 1,
                explanation: 'Treasury bills are backed by the government and considered the safest investment.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: Personal Financial Plan',
            'Create your personal financial plan.',
            'Develop a complete personal financial plan including budget, savings goal, and investment strategy.',
            [
              {
                question: 'Create a monthly budget using the 50/30/20 rule. List your income, needs (50%), wants (30%), and savings (20%).',
                type: 'open',
                explanation: 'Be realistic about your expenses. The goal is awareness, not perfection.',
                points: 20,
              },
              {
                question: 'Design an investment plan for the next 12 months. How much will you invest, in what vehicles, and what is your goal?',
                type: 'open',
                explanation: 'Consider: emergency fund first, then T-bills or money market for short term, stocks for long term.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Create a personalised investment plan and start building wealth.',
      ),


      makeModule(
        'Module 3: Investing in Rwandan Markets',
        'Learn to invest in Rwandan financial markets and build wealth.',
        [
          makeLesson(
            'Investment Options in Rwanda',
            'SACCOs, treasury bills, Rwanda Stock Exchange, mutual funds, and REITs.\n\n### Options:\n1. SACCOs - 8-15% returns, medium risk\n2. Treasury bills - 6-12%, government-backed\n3. RSE stocks - Variable, higher risk\n4. Mutual funds - Professionally managed\n5. REITs - Real estate without property\n6. Pension schemes - Long-term, tax benefits',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Iq72X8V64hQ', videoTitle: 'Investing Explained' },
          ),
          makeLesson(
            'Building a Diversified Portfolio',
            'Asset allocation by age, rebalancing, and starting small.\n\n### By Age:\n- 20s: 80% growth, 20% safe\n- 30s: 70% growth, 30% safe\n- 40s: 60% growth, 40% safe\n- 50s: 50% growth, 50% safe\n- 60+: 30% growth, 70% safe\n\n### Start: SACCO (5,000 RWF), T-bills (100,000 RWF), Mutual funds (10,000 RWF)',
            'article',
            2,
          ),
          makeLesson(
            'Understanding Risk & Return',
            'Risk assessment and matching investments to goals.\n\n### Risk Levels:\n1. Low: Savings, T-bills (2-12%)\n2. Medium: SACCOs, mutual funds (8-15%)\n3. Higher: Stocks (10-25%+)\n4. High: Crypto, venture capital (volatile)\n\n### Never invest money you cannot afford to lose in high-risk options.',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review investment concepts.',
            [
              { question: 'Minimum for Treasury bills in Rwanda?', options: ['50,000 RWF', '100,000 RWF', '500,000 RWF', '1,000,000 RWF'], correctIndex: 1, explanation: 'Treasury bills from 100,000 RWF through commercial banks.' },
              { question: 'What is asset allocation?', options: ['Buying one asset', 'Dividing across asset types', 'Selling all', 'Paying fees'], correctIndex: 1, explanation: 'Asset allocation means dividing your portfolio among different investment types.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Investment Plan Project',
            'Create a personal investment plan.',
            'Plan based on goals, risk tolerance, and time horizon.',
            [
              { question: 'Create an investment plan: goal, monthly amount, risk tolerance, allocation, and specific investments.', type: 'open', explanation: 'Build emergency fund first (3-6 months), then invest. Be realistic.', points: 20 },
              { question: 'Calculate monthly investment for 10M RWF in 10 years at 8% return. Show contributions vs growth.', type: 'open', explanation: 'Use FV = PMT x ((1+r)^n - 1)/r formula.', points: 15 },
            ],
            5,
          ),
        ],
        'Build a diversified investment portfolio in Rwanda.',
      ),

      makeModule(
        'Module 4: Real Estate & Property Investment',
        'Understand property investment opportunities in Rwanda.',
        [
          makeLesson(
            'Real Estate Investing in Rwanda',
            'Land, rental, flipping, development, and REITs.\n\n### Options:\n1. Land - Buy and hold for appreciation\n2. Rental property - Steady passive income\n3. House flipping - Renovate and sell\n4. Development - Build for sale\n5. REITs - Invest without direct property',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=K2nR5jL8pM3', videoTitle: 'Real Estate Investing for Beginners' },
          ),
          makeLesson(
            'Property Financing & Mortgages',
            'BK, Equity, I&M, SACCO housing loans, and Rwanda Housing Authority.\n\n### Requirements:\n- Down payment: 20-30%\n- Interest: 14-18%\n- Max term: 15-20 years\n- Payment: max 30-40% of income\n\n### Options:\n1. BK: Up to 80% financing, 20 years\n2. Equity: Competitive home loan rates\n3. I&M: Property financing\n4. SACCOs: Housing loans for members',
            'article',
            2,
          ),
          makeLesson(
            'Rental Property Management',
            'Finding tenants, setting rates, and maintaining property.\n\n### Tips:\n1. Location matters - Near transport, schools, markets\n2. Screen tenants - Check references and history\n3. Written lease - Always use an agreement\n4. Market rent - Research comparable properties\n5. Maintenance plan - Prevent expensive repairs\n6. Emergency fund - 10-20% of income for repairs',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review real estate concepts.',
            [
              { question: 'Typical mortgage down payment in Rwanda?', options: ['5-10%', '20-30%', '50%', '100%'], correctIndex: 1, explanation: 'Rwandan banks require 20-30% down payment on mortgages.' },
              { question: 'REIT stands for?', options: ['Real Estate Investment Trust', 'Rental Income Tax', 'Real Estate Insurance Title', 'Residential Equity Tool'], correctIndex: 0, explanation: 'REIT lets you invest in real estate without buying property.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Real Estate Investment Plan',
            'Create a property investment strategy.',
            'Choose property type, location, financing, and projected returns.',
            [
              { question: 'Create a real estate plan: type, location, price, down payment, mortgage, rental income, 5-year ROI.', type: 'open', explanation: 'Research current prices and rents. Consider appreciation and rental yield.', points: 20 },
              { question: 'How would you finance your first property? Savings, financing, timeline.', type: 'open', explanation: 'Consider saving 2-3 years, combining bank and SACCO financing, or partnering.', points: 15 },
            ],
            5,
          ),
        ],
        'Evaluate and execute real estate investment opportunities in Rwanda.',
      ),

      makeModule(
        'Module 5: Multiple Income Streams & Financial Freedom',
        'Create multiple income sources and achieve financial independence.',
        [
          makeLesson(
            'The Multiple Income Streams Strategy',
            'Earned, business, investment, passive, and rental income.\n\n### Types:\n1. Earned - Salary, freelance (time for money)\n2. Business - Profits from your business\n3. Investment - Stocks, real estate returns\n4. Passive - Royalties, digital products\n5. Rental - Property rentals',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Y7nK4pR2jM9', videoTitle: 'Multiple Income Streams' },
          ),
          makeLesson(
            'Side Hustle Ideas for Rwanda',
            'Online selling, freelance, tutoring, food business, and digital services.\n\n### Ideas:\n1. Online selling - Jumia, Kasha, Instagram\n2. Freelance - Writing, design, VA\n3. Tutoring - English, math, computer skills\n4. Food business - Home cooking, baked goods\n5. Digital services - Social media management\n6. Photography - Events, portraits\n7. Dropshipping - No inventory needed',
            'article',
            2,
          ),
          makeLesson(
            'Designing Your Financial Freedom Plan',
            'Calculate your number and create a path to independence.\n\n### Formula:\n1. Monthly expenses (E)\n2. Target passive income: P = E x 1.25\n3. Freedom number: F = P x 12 / 0.04\n4. Example: 500,000 RWF/month expenses\n   - Target: 625,000 RWF/month\n   - Freedom number: 187,500,000 RWF',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review income streams and financial freedom.',
            [
              { question: 'What is passive income?', options: ['Job salary', 'Income needing minimal effort', 'Government benefits', 'Loan proceeds'], correctIndex: 1, explanation: 'Passive income requires little ongoing effort, like royalties.' },
              { question: 'The 4% rule?', options: ['Save 4% of income', 'Withdraw 4% of portfolio annually', 'Inflation is 4%', 'Interest is 4%'], correctIndex: 1, explanation: 'You can safely withdraw 4% of your portfolio annually without running out.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final Financial Freedom Project',
            'Create your complete path to financial freedom.',
            'Calculate your number, plan income streams, and set milestones.',
            [
              { question: 'Create your financial freedom plan: expenses, freedom number, income streams, and 12-month/3-year/10-year milestones.', type: 'open', explanation: 'Be honest and realistic. Include specific actions for each period.', points: 25 },
              { question: 'Describe one side hustle you could start in 3 months: offer, customer, income, and first step.', type: 'open', explanation: 'Choose something you are interested in or skilled at. Calculate startup costs.', points: 20 },
            ],
            5,
          ),
        ],
        'Build multiple income streams and create a path to financial independence.',
      ),

/* INSERT_MODULES_9 */
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 10: AI & Automation for Beginners
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'AI for Rwandans: How to Use ChatGPT & Automation',
    description:
      ' AI is changing how Rwandans work — and you can use it too, no coding needed. This course shows ' +
      'you how to use ChatGPT, AI writing tools, and automation platforms to save hours every week. ' +
      'Learn to write better emails, create content, analyse data, automate repetitive tasks, ' +
      'and boost your productivity. Real examples for Rwandan professionals and entrepreneurs.',
    category: 'Data & AI',
    level: 'Beginner',
    price: 1000,
    searchImage: 'artificial intelligence ai technology future',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Understanding Artificial Intelligence',
        'Learn what AI is, how it works, and why it matters for Africa.',
        [
          makeLesson(
            'What is AI and Why It Matters for Africa',
            'Artificial Intelligence is the ability of machines to perform tasks that normally require human ' +
            'intelligence. From chatbots to self-driving cars, AI is reshaping the world. This lesson explains ' +
            'AI concepts in plain language and explores why Africa must embrace AI for economic transformation.\n\n' +
            '### Why AI Matters for Africa:\n' +
            '- **Leapfrogging** — Skip traditional development stages\n' +
            '- **Productivity** — Automate routine tasks\n' +
            '- **Healthcare** — AI-powered diagnosis where doctors are scarce\n' +
            '- **Agriculture** — Crop disease detection, weather prediction\n' +
            '- **Financial inclusion** — AI credit scoring for the unbanked',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=UdE-W30oOXo', videoTitle: 'AI Explained in 2 Minutes - Simple Guide' },
          ),
          makeLesson(
            'Types of AI: From ChatGPT to Self-Driving Cars',
            'Explore the different types of AI — narrow AI vs general AI, machine learning, deep learning, ' +
            'natural language processing, computer vision, and generative AI. Real-world examples from African contexts.\n\n' +
            '### AI Categories:\n' +
            '1. **Narrow AI** — Designed for specific tasks (ChatGPT, facial recognition)\n' +
            '2. **Generative AI** — Creates new content (text, images, music)\n' +
            '3. **Machine Learning** — Learns from data without explicit programming\n' +
            '4. **Computer Vision** — Sees and interprets images\n' +
            '5. **Natural Language Processing** — Understands and generates human language',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of AI fundamentals.',
            [
              {
                question: 'What is Narrow AI?',
                options: [
                  'AI that is better than humans at everything',
                  'AI designed for specific tasks only',
                  'AI that runs on small devices',
                  'The first version of AI',
                ],
                correctIndex: 1,
                explanation: 'Narrow AI is designed and trained for specific tasks, like ChatGPT for conversation or facial recognition.',
              },
              {
                question: 'Which AI technology enables computers to understand and respond to human language?',
                options: ['Computer Vision', 'Natural Language Processing', 'Robotics', 'Expert Systems'],
                correctIndex: 1,
                explanation: 'Natural Language Processing (NLP) enables computers to understand, interpret, and generate human language.',
              },
            ],
            3,
          ),
        ],
        'Explain what AI is and identify opportunities for AI in African contexts.',
      ),
      makeModule(
        'Module 2: Using AI Tools & Automation',
        'Get hands-on with popular AI tools and learn to automate everyday tasks.',
        [
          makeLesson(
            'Getting Started with ChatGPT & AI Assistants',
            'Learn how to use ChatGPT, Claude, and other AI assistants effectively. Master prompt engineering — ' +
            'the art of asking the right questions to get the best results from AI.\n\n' +
            '### Prompt Engineering Tips:\n' +
            '1. **Be specific** — "Write a professional email" vs "Write an email"\n' +
            '2. **Provide context** — Give background information\n' +
            '3. **Specify format** — "Bullet points", "Table", "3 paragraphs"\n' +
            '4. **Iterate** — Refine your prompts based on results\n' +
            '5. **Role-play** — "Act as a career coach..."',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=rM-Fk2UNfDA', videoTitle: 'What is AI in Simple Words - Quick Short' },
          ),
          makeLesson(
            'Automation: Working Smarter, Not Harder',
            'Learn how automation tools can save you hours every week. Covers email automation, social media ' +
            'scheduling, document generation, data entry automation, and no-code workflow tools.\n\n' +
            '### Automation Tools:\n' +
            '- **Zapier / Make** — Connect apps and automate workflows\n' +
            '- **IFTTT** — Simple if-this-then-that automations\n' +
            '- **Google Apps Script** — Automate Google Workspace\n' +
            '- **ChatGPT plugins** — AI-powered task automation',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review AI tools and automation concepts.',
            [
              {
                question: 'What is prompt engineering?',
                options: [
                  'Building physical AI hardware',
                  'The skill of writing effective prompts to get desired AI outputs',
                  'Engineering software for robots',
                  'Creating AI training data',
                ],
                correctIndex: 1,
                explanation: 'Prompt engineering is the practice of crafting inputs to get the best possible outputs from AI models.',
              },
              {
                question: 'Which tool connects different apps to automate workflows?',
                options: ['ChatGPT', 'Zapier', 'VS Code', 'Figma'],
                correctIndex: 1,
                explanation: 'Zapier (and Make) connect apps together to create automated workflows without coding.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 2: AI in Action Project',
            'Apply AI tools to solve a real problem.',
            'Use an AI tool (like ChatGPT) to complete a real task, then document your process and results.',
            [
              {
                question: 'Describe a task you automated using an AI tool. What was the task, which tool did you use, and what was the result?',
                type: 'open',
                explanation: 'Example: Drafting emails, creating social media posts, summarising articles, or generating ideas.',
                points: 20,
              },
              {
                question: 'What are three ethical considerations when using AI?',
                type: 'open',
                explanation: 'Consider: bias in AI, privacy concerns, job displacement, misinformation, and responsible use.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Use AI tools effectively and automate routine tasks to boost productivity.',
      ),


      makeModule(
        'Module 3: Advanced AI Tools & Applications',
        'Explore advanced AI tools beyond ChatGPT.',
        [
          makeLesson(
            'The AI Tools Landscape',
            'Claude, Gemini, Perplexity, Midjourney, Copilot, and specialised AI tools.\n\n### By Category:\n1. Writing: ChatGPT, Claude, Jasper\n2. Research: Perplexity, Elicit, Consensus\n3. Images: Midjourney, DALL-E, Stable Diffusion\n4. Video: Runway, Pika, HeyGen\n5. Code: GitHub Copilot, Cursor, Tabnine\n6. Music: Suno, Udio\n7. Design: Canva AI, Adobe Firefly',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=S3nJ8pR5mK2', videoTitle: 'Best AI Tools 2025' },
          ),
          makeLesson(
            'Image Generation with AI',
            'Midjourney, DALL-E, and Canva AI for marketing and social media.\n\n### Prompt Structure:\n1. Subject - Main focus\n2. Action - What is happening\n3. Environment - Where and when\n4. Style - Photorealistic, illustration, cinematic\n5. Technical - Resolution, aspect ratio, lighting\n\n### Free Tools:\n- Canva AI - Magic Media (free tier)\n- Bing Image Creator - Free (DALL-E 3)\n- Leonardo AI - Free tier\n- Craiyon - Completely free',
            'article',
            2,
          ),
          makeLesson(
            'AI for Data Analysis',
            'Upload data to ChatGPT/Claude for insights, charts, and recommendations.\n\n### Use Cases:\n1. Analyse sales trends and patterns\n2. Create customer segments\n3. Forecast future sales\n4. Detect anomalies\n5. Generate reports with visualisations\n6. Get data-driven recommendations\n\n### Tools: ChatGPT Advanced Data Analysis, Google Sheets AI, Julius AI',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review advanced AI tools concepts.',
            [
              { question: 'Best AI tool for generating images?', options: ['ChatGPT', 'Midjourney', 'Suno', 'Otter.ai'], correctIndex: 1, explanation: 'Midjourney creates professional-quality images from text.' },
              { question: 'What is prompt engineering?', options: ['Building hardware', 'Crafting inputs for best AI outputs', 'Designing AI software', 'Creating datasets'], correctIndex: 1, explanation: 'Prompt engineering designs text inputs for optimal AI outputs.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: AI Tools Project',
            'Use multiple AI tools for a real-world task.',
            'Generate an image, analyse data, and create content using AI.',
            [
              { question: 'Use AI image generator for a Rwandan business social post. Describe prompt, result, and improvements.', type: 'open', explanation: 'Try 3+ prompts. Use free Canva AI or Bing Image Creator.', points: 20 },
              { question: 'Use ChatGPT/Claude to analyse sales data. What insights and recommendations?', type: 'open', explanation: 'Create 10-20 rows: Month, Revenue, Expenses, Customers. Ask AI for trends.', points: 15 },
            ],
            5,
          ),
        ],
        'Use advanced AI tools for image generation, data analysis, and creative tasks.',
      ),

      makeModule(
        'Module 4: AI for Business & Productivity',
        'Automate business processes, improve customer service, and boost productivity with AI.',
        [
          makeLesson(
            'Automating Business Tasks with AI',
            'Zapier, Make, n8n, and custom GPTs for workflow automation.\n\n### Tools:\n1. Zapier - Connect apps, automate (free tier)\n2. Make - Visual automation builder\n3. n8n - Open-source, self-hosted\n4. ChatGPT workflows - Custom GPTs for tasks\n5. Power Automate - Office 365 users\n\n### Ideas:\n- Auto-respond to customer inquiries\n- Save attachments to cloud\n- Cross-post to multiple platforms\n- Generate weekly reports\n- Send follow-ups after meetings',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=P5sK2jR8nM1', videoTitle: 'AI Automation for Business' },
          ),
          makeLesson(
            'AI-Powered Customer Service',
            'Tidio, ManyChat, WhatsApp Business API, and custom ChatGPT bots.\n\n### Tools:\n1. Tidio - Website chatbot (free)\n2. ManyChat - Facebook/Instagram chatbot\n3. WhatsApp API - Automated AI responses\n4. Custom GPTs - Trained on your business\n5. Zendesk AI - Enterprise platform\n\n### Best Practices:\n1. Always offer human escalation\n2. Train AI on your products\n3. Keep tone friendly and professional\n4. Monitor quality\n5. Improve based on feedback',
            'article',
            2,
          ),
          makeLesson(
            'AI for Content Marketing',
            'Research, outline, draft, edit, optimise, visualise, and repurpose with AI.\n\n### Workflow:\n1. Research - Perplexity or ChatGPT\n2. Outline - AI creates structure\n3. Draft - Generate with AI\n4. Edit - Review, fact-check, add expertise\n5. Optimise - AI for headlines, keywords\n6. Visuals - AI-generated images\n7. Repurpose - One piece to many formats\n\n### Ethical: Always review and add your perspective. AI assists, not replaces.',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Review AI for business concepts.',
            [
              { question: 'Best tool for connecting apps and automating workflows?', options: ['ChatGPT', 'Zapier', 'Midjourney', 'CapCut'], correctIndex: 1, explanation: 'Zapier connects thousands of apps without coding.' },
              { question: 'Most important rule for AI customer service?', options: ['Never use AI', 'Always offer human escalation', 'Only for email', 'No oversight'], correctIndex: 1, explanation: 'Always offer human escalation for complex issues.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: AI Business Project',
            'Design an AI-powered system for a business.',
            'Design automation for a Rwandan business: tasks, tools, workflow, and savings.',
            [
              { question: 'Design an AI system for a Rwandan business (restaurant, farm, shop, tourism). Describe 3 automated tasks, tools, workflow, and savings.', type: 'open', explanation: 'Example: ManyChat for reservations, ChatGPT for menus, Zapier for calendar.', points: 25 },
              { question: 'Create an AI content workflow from research to repurposing with specific prompts.', type: 'open', explanation: 'Show how one blog becomes social posts, emails, scripts, and graphics via AI.', points: 15 },
            ],
            5,
          ),
        ],
        'Implement AI automation for business processes and content marketing.',
      ),

      makeModule(
        'Module 5: Future of AI & Career Opportunities',
        'Understand AI trends and discover careers in the AI industry.',
        [
          makeLesson(
            'The Future of AI: Trends & Implications',
            'AGI, autonomous agents, AI regulation, and Africa role.\n\n### Trends:\n1. AGI - AI for any intellectual task\n2. AI agents - Autonomous multi-step tasks\n3. On-device AI - No internet needed\n4. AI regulation - Government rules\n5. Healthcare AI - Diagnosis, drug discovery\n6. Education AI - Personalised tutoring\n7. African AI - Local models for local languages',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=X3nK8pR5jM2', videoTitle: 'Future of AI' },
          ),
          makeLesson(
            'AI Ethics & Responsible Use',
            'Bias, privacy, misinformation, and Rwanda AI Policy.\n\n### Principles:\n1. Transparency - Know when AI is used\n2. Fairness - No discrimination\n3. Accountability - Someone responsible\n4. Privacy - Respect user data\n5. Safety - Robust and secure systems\n6. Human oversight - Important decisions need humans\n\n### Rwanda: National AI Policy for ethical development.',
            'article',
            2,
          ),
          makeLesson(
            'AI Career Opportunities & Skills',
            'Prompt engineering, AI product management, ethics, and consulting.\n\n### Careers:\n1. Prompt engineer - Craft effective prompts\n2. AI product manager - Lead AI products\n3. AI ethicist - Fair, responsible AI\n4. AI content strategist - Optimise with AI\n5. AI trainer - Teach AI use\n6. ML engineer - Build AI models\n7. AI consultant - Help adopt AI\n\n### Skills: Critical thinking, prompt engineering, data literacy, domain expertise',
            'article',
            3,
          ),
          makeQuizLesson(
            'Module 5: Knowledge Check',
            'Review AI future and career concepts.',
            [
              { question: 'AGI stands for?', options: ['Automated General Intelligence', 'Artificial General Intelligence', 'Advanced Generative Intelligence', 'Applied Graphical Intelligence'], correctIndex: 1, explanation: 'AGI can perform any intellectual task a human can.' },
              { question: 'Which Rwandan policy addresses AI?', options: ['Vision 2050', 'National AI Policy', 'Digital Rwanda', 'ICT Policy'], correctIndex: 1, explanation: 'Rwanda National AI Policy guides ethical AI development.' },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 5: Final AI Project',
            'Create a comprehensive AI adoption strategy.',
            'Personal or business AI plan with tools, skills, ethics, and timeline.',
            [
              { question: 'Create a 12-month AI upskilling plan: 3 AI tools to master, what for, how to learn, and expected benefits.', type: 'open', explanation: 'Be specific: ChatGPT for social media (save 5 hrs/week), Midjourney for images, Zapier for automation.', points: 25 },
              { question: 'As an AI consultant, write a proposal for a Rwandan business with assessment, 3 AI solutions, timeline, budget, and ethics.', type: 'open', explanation: 'Choose specific business (hotel, shop, farm, NGO). Tailor to their needs.', points: 20 },
            ],
            5,
          ),
        ],
        'Anticipate AI trends, use AI ethically, and build a career in the AI economy.',
      ),

/* INSERT_MODULES_10 */
    ],
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seedMVPCourses() {
  try {
    await connectDB();
    console.log(' Connected to MongoDB\n');

    if (!HAS_PEXELS_KEY) {
      console.warn('  No Pexels API key found (PEXELS_API_KEY or VITE_PEXELS_API_KEY)');
      console.warn('   Will use curated Unsplash fallback images instead.');
      console.warn('   For best results, add your Pexels API key to the .env file.\n');
    }

    // ─── Find the admin user ──────────────────────────────────────────────
    const admin = await User.findOne({ email: 'admin@bootskills.com' });
    if (!admin) {
      console.error(' Admin user not found (admin@bootskills.com). Seed users first.');
      process.exit(1);
    }
    console.log(` Found admin: ${admin.fullName} (${admin.email})\n`);

    let created = 0;
    let skipped = 0;
    let imageFailures = 0;

    for (let i = 0; i < COURSES.length; i++) {
      const cd = COURSES[i];
      const num = i + 1;

      console.log(`\n─── Course ${num}/10: "${cd.title}" ───`);

      // Check if already exists
      const existing = await Course.findOne({ title: cd.title });
      if (existing) {
        console.log(`   ⏭  Skipping — already exists (ID: ${existing._id})`);
        skipped++;
        continue;
      }

      // Fetch illustration from API (Pexels illustration search)
      console.log(`    Searching for image: "${cd.searchImage}"...`);
      let thumbnailUrl = '';
      try {
        thumbnailUrl = await getCourseIllustrationUrl(cd.searchImage);
        if (thumbnailUrl) {
          // Verify the image URL
          const valid = await verifyImageUrl(thumbnailUrl);
          if (valid) {
            console.log(`    Image found: ${thumbnailUrl.slice(0, 80)}...`);
          } else {
            console.warn(`     Image URL not accessible, but will use it as fallback`);
            imageFailures++;
          }
        }
      } catch (err: any) {
        console.warn(`     Image fetch failed: ${err.message}`);
        // Use a relevant Unsplash fallback
        const fallbackQueries: Record<string, string> = {
          'digital marketing': 'photo-1557838923-2985c318be48',
          'mobile money': 'photo-1556742049-0cfed4f6a45d',
          'remote work': 'photo-1506126613408-eca07ce68773',
          'entrepreneurship': 'photo-1559136555-9303baea8ebd',
          'english learning': 'photo-1503676260728-1c00da094a0b',
          'agriculture technology': 'photo-1581092335879-cdbe1fc0af53',
          'content creation': 'photo-1492691527719-9d1e07e534b4',
          'project management': 'photo-1512758017271-d7b84c2113f1',
          'personal finance': 'photo-1565514020179-026b5b2be64a',
          'artificial intelligence': 'photo-1485827404703-89b55fcc595e',
        };
        let fallbackId = 'photo-1517248135467-4c7edcad34c4'; // generic education
        for (const [key, id] of Object.entries(fallbackQueries)) {
          if (cd.searchImage.toLowerCase().includes(key)) {
            fallbackId = id;
            break;
          }
        }
        thumbnailUrl = `https://images.unsplash.com/${fallbackId}?auto=format&fit=crop&q=80&w=800`;
        console.log(`    Using curated Unsplash fallback image`);
      }

      // Build the course document
      const courseDoc = {
        title: cd.title,
        description: cd.description,
        category: cd.category,
        level: cd.level,
        price: cd.price,
        discountPrice: cd.discountPrice || 0,
        thumbnail: thumbnailUrl,
        instructor: admin._id,
        createdBy: admin._id,
        status: 'published' as const,
        enrollmentMode: 'direct' as const,
        school: cd.school || 'BootSkills Academy',
        isFeatured: cd.isFeatured || false,
        passingScore: 70,
        modules: cd.modules.map((m) => ({
          ...m,
          // Ensure all nested lessons use proper schema types
          lessons: m.lessons.map((l: any) => ({
            ...l,
            type: l.type || 'article',
          })),
        })),
      };

      // Create the course
      const course = await new Course(courseDoc).save();
      console.log(`    Created course: "${course.title}"`);
      console.log(`      Price: ${course.price.toLocaleString()} RWF${(course.discountPrice ?? 0) > 0 ? ` (was ${(course.discountPrice ?? 0).toLocaleString()} RWF)` : ''}`);
      console.log(`      Category: ${course.category} | Level: ${course.level}`);
      console.log(`      Modules: ${course.modules.length}`);
      const totalLessons = course.modules.reduce(
        (sum: number, m: any) => sum + (m.lessons?.length || 0),
        0,
      );
      console.log(`      Lessons: ${totalLessons}`);
      created++;
    }

    // ─── Summary ──────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log(' MVP COURSES SEED SUMMARY');
    console.log('═'.repeat(60));
    console.log(`    Created:  ${created} new course(s)`);
    console.log(`   ⏭  Skipped:  ${skipped} existing course(s)`);
    console.log(`     Images:   ${imageFailures} image verification warnings`);
    console.log(`   Total:     ${COURSES.length} courses configured`);
    console.log('═'.repeat(60));

    // Print pricing summary
    console.log('\n PRICING SUMMARY:');
    console.log('─'.repeat(50));
    for (const cd of COURSES) {
      const finalPrice = cd.discountPrice || cd.price;
      const originalPrice = cd.price;
      const hasDiscount = (cd.discountPrice ?? 0) > 0 && (cd.discountPrice ?? 0) < cd.price;
      console.log(
        `   ${cd.title.padEnd(45)} ${hasDiscount ? `${originalPrice.toLocaleString()} → ` : ''}${finalPrice.toLocaleString()} RWF`,
      );
    }
    console.log('─'.repeat(50));

    // Print image summary
    console.log('\n  IMAGE SUMMARY:');
    console.log('─'.repeat(50));
    const allCourses = await Course.find({ title: { $in: COURSES.map((c) => c.title) } });
    for (const course of allCourses) {
      const hasImage = !!course.thumbnail;
      console.log(`   ${hasImage ? '' : ''} ${course.title.padEnd(45)} ${course.thumbnail?.slice(0, 60) || 'No image'}`);
    }
    console.log('─'.repeat(50));

    console.log('\n SEED COMPLETE — MVP courses ready for sale!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n Error seeding courses:', error);
    process.exit(1);
  }
}

seedMVPCourses();
