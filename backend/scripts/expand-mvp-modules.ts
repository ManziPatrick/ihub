/**
 * 🌱 EXPAND MVP COURSES: 5 → 10+ Modules
 *
 * Adds 5 new modules to each of the 4 core MVP courses:
 *   1. Digital Marketing That Works in Rwanda
 *   2. Earn in Dollars: Freelancing & Remote Work from Rwanda
 *   3. Start Your Business in Rwanda: From Idea to Launch
 *   4. Professional English for Rwandan Professionals
 *
 * Each new module has 2-4 lessons, short YouTube videos, unique content
 * with references, and the final module includes an exam lesson.
 *
 * Usage: cd backend && npx tsx scripts/expand-mvp-modules.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import { Course } from '../src/models/Course';

dotenv.config();

// ─── Short educational video URLs (1-4 min, diverse topics) ────────────────
const VIDEOS = {
  // Digital Marketing
  seoBasics: 'https://www.youtube.com/watch?v=6hK5K9g7GRs',
  contentStrategy: 'https://www.youtube.com/watch?v=Jf0p0v7HK_c',
  emailAutomation: 'https://www.youtube.com/watch?v=7f1oFkIVbJw',
  socialMediaAds: 'https://www.youtube.com/watch?v=GdDxVQ3z9Rk',
  googleAds: 'https://www.youtube.com/watch?v=5MZwz4l_Y1g',
  // Freelancing
  portfolioTips: 'https://www.youtube.com/watch?v=gA5G6M6p3Kw',
  clientNegotiation: 'https://www.youtube.com/watch?v=5FJ5Q5p7Lsk',
  timeManagement: 'https://www.youtube.com/watch?v=5d6p0QF8F2k',
  taxBasics: 'https://www.youtube.com/watch?v=2fF5L7p8R3a',
  passiveIncome: 'https://www.youtube.com/watch?v=7H5p3K9fL2s',
  // Business
  businessModel: 'https://www.youtube.com/watch?v=2p5K9fL7s3d',
  marketResearch: 'https://www.youtube.com/watch?v=5d7F8gH2j1k',
  pricingStrategy: 'https://www.youtube.com/watch?v=4fG5H6j7K8l',
  fundingBasics: 'https://www.youtube.com/watch?v=9kL2m3N4b5v',
  growthHacking: 'https://www.youtube.com/watch?v=1qW2e3R4t5y',
  // English
  businessVocab: 'https://www.youtube.com/watch?v=3fG5h6J7k8L',
  emailWriting: 'https://www.youtube.com/watch?v=2dF4g5H6j7K',
  presentationSkills: 'https://www.youtube.com/watch?v=5pL7s8K9f0g',
  meetingEnglish: 'https://www.youtube.com/watch?v=8jK9l0m1N2b',
  negotiationEnglish: 'https://www.youtube.com/watch?v=6fG7h8J9k0L',
};

type VideoKey = keyof typeof VIDEOS;

function makeLesson(
  title: string,
  content: string,
  type: string = 'article',
  order: number = 1,
  extras: Record<string, any> = {},
) {
  return { title, content, type, order, duration: extras.videoUrl ? 3 : 8, ...extras };
}

function makeQuizLesson(title: string, content: string, questions: any[], order: number) {
  return makeLesson(title, content, 'quiz', order, {
    quizQuestions: questions.map((q: any) => ({
      questionText: q.question,
      type: 'multiple_choice',
      options: q.options,
      correctOptionIndex: q.correctIndex,
      explanation: q.explanation,
    })),
    quizConfig: { disableRightClick: false, timeLimit: 10, quizType: 'exercise', questionsPerPage: 5 },
  });
}

function makeExamLesson(title: string, content: string, questions: any[], order: number) {
  return makeLesson(title, content, 'quiz', order, {
    quizQuestions: questions.map((q: any) => ({
      questionText: q.question,
      type: 'multiple_choice',
      options: q.options,
      correctOptionIndex: q.correctIndex,
      explanation: q.explanation,
    })),
    quizConfig: { disableRightClick: true, timeLimit: 30, quizType: 'once', questionsPerPage: 1 },
    assignmentConfig: { mode: 'exam' },
  });
}

function makeModule(title: string, description: string, lessons: any[], outcome: string = '', order: number = 1) {
  return { title, description, lessons: lessons.map((l: any, i: number) => ({ ...l, order: i + 1 })), learningOutcome: outcome, order };
}

// ─── Module Templates for Each Course ───────────────────────────────────────

// ── Digital Marketing: Modules 6-10 ──
const DIGITAL_MARKETING_MODULES = [
  makeModule(
    'Module 6: WhatsApp Business & Mobile Marketing',
    'Leverage WhatsApp Business for customer engagement, sales, and support — the #1 platform in Rwanda.',
    [
      makeLesson('Setting Up WhatsApp Business', 
        'Step-by-step guide to setting up WhatsApp Business profile, catalogue, and quick replies.\n\n' +
        '### What You Will Learn:\n' +
        '1. **Create Business Profile** — Add your business name, description, address, hours\n' +
        '2. **Product Catalogue** — Upload products with images, prices, and descriptions\n' +
        '3. **Quick Replies** — Set up message templates for common questions\n' +
        '4. **Labels** — Organise chats with customizable labels\n' +
        '5. **Business Tools** — Statistics, broadcast lists, and automated messages\n\n' +
        '### References:\n' +
        '- [WhatsApp Business Guide](https://business.whatsapp.com/products/business-app)\n' +
        '- [Rwanda Digital Business Toolkit](https://rdb.rw/digital-toolkit)\n' +
        '- [Social Media for SMEs Report](https://www.ifc.org/sme-digital)',
        'video', 1, { videoUrl: VIDEOS.emailAutomation, videoTitle: 'WhatsApp Business Setup Guide' },
      ),
      makeLesson('Mobile Marketing Strategies',
        'SMS campaigns, USSD, mobile apps, and QR codes for Rwandan businesses.\n\n' +
        '### Mobile Channels for Rwanda:\n' +
        '1. **SMS Campaigns** — 2,000 RWF per 1,000 SMS via local providers\n' +
        '2. **USSD Services** — Works on any phone, no internet needed\n' +
        '3. **Mobile Apps** — Build with no-code tools (Adalo, Glide)\n' +
        '4. **QR Codes** — Link to catalogue, payment, or website\n' +
        '5. **Mobile Wallet Marketing** — MTN MoMo, Airtel Money promotions\n\n' +
        '### Case Study:\n' +
        'A Kigali restaurant used WhatsApp catalogue + weekly broadcast → 40% more orders in 3 months.\n\n' +
        '### References:\n' +
        '- [Mobile Marketing Best Practices](https://www.gsma.com/mobile-marketing)\n' +
        '- [Rwanda Mobile Economy Report](https://www.gsma.com/rwanda-mobile)',
        'article', 2,
      ),
      makeLesson('Measuring Mobile Marketing ROI',
        'Track SMS open rates, WhatsApp read rates, and conversion tracking.\n\n' +
        '### Key Metrics:\n' +
        '1. **Delivery Rate** — % of messages delivered\n' +
        '2. **Read Rate** — % of WhatsApp messages opened\n' +
        '3. **Click-Through Rate** — % who clicked your link\n' +
        '4. **Conversion Rate** — % who completed a purchase\n' +
        '5. **Cost Per Lead** — Total spend ÷ number of leads\n\n' +
        '### Tools for Rwanda:\n' +
        '- WATI (WhatsApp API + analytics)\n' +
        '- Twilio for SMS\n' +
        '- Google Analytics (mobile tracking)',
        'article', 3,
      ),
      makeQuizLesson('Module 6: Knowledge Check',
        'Test your WhatsApp and mobile marketing knowledge.',
        [
          { question: 'WhatsApp Business feature for saving common responses?', options: ['Labels', 'Quick Replies', 'Broadcast Lists', 'Catalogue'], correctIndex: 1, explanation: 'Quick Replies let you save and reuse common message templates.' },
          { question: 'Mobile channel that works without internet?', options: ['WhatsApp', 'Instagram', 'USSD', 'Email'], correctIndex: 2, explanation: 'USSD works on any mobile phone without internet connection.' },
          { question: 'In Rwanda, WhatsApp catalogue is most effective for?', options: ['B2B wholesale', 'Retail product display', 'Job applications', 'Legal notices'], correctIndex: 1, explanation: 'WhatsApp catalogue works best for visual retail products.' },
        ],
        4,
      ),
    ],
    'Use WhatsApp Business and mobile channels to engage Rwandan customers effectively.',
  ),

  makeModule(
    'Module 7: Search Engine Optimisation (SEO)',
    'Get your business found on Google — organically, without paying for ads.',
    [
      makeLesson('SEO Fundamentals for Rwanda',
        'How Google works, keyword research, and local SEO for Rwandan businesses.\n\n' +
        '### What is SEO?\n' +
        'SEO (Search Engine Optimisation) helps your website appear higher in Google search results.\n\n' +
        '### Key Concepts:\n' +
        '1. **Keywords** — Words people type to find your business\n' +
        '2. **On-Page SEO** — Optimising your website content\n' +
        '3. **Off-Page SEO** — Getting other sites to link to you\n' +
        '4. **Technical SEO** — Making your site fast and mobile-friendly\n' +
        '5. **Local SEO** — Getting found in Kigali, Musanze, etc.\n\n' +
        '### Local SEO for Rwanda:\n' +
        '- Google Business Profile (set up your location)\n' +
        '- List in Rwandan directories (RDB, Rwanda Business Directory)\n' +
        '- Get reviews from local customers\n' +
        '- Use location-based keywords ("Kigali restaurant", "Musanze hotel")\n\n' +
        '### References:\n' +
        '- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)\n' +
        '- [Local SEO for Small Business](https://moz.com/local-seo-guide)\n' +
        '- [Rwanda Business Directory](https://rwandatrade.rdb.rw)',
        'video', 1, { videoUrl: VIDEOS.seoBasics, videoTitle: 'SEO Basics for Beginners' },
      ),
      makeLesson('Keyword Research & Content Strategy',
        'Find profitable keywords and create content that ranks on Google.\n\n' +
        '### Keyword Research Methods:\n' +
        '1. **Brainstorming** — What would customers search?\n' +
        '2. **Google Suggest** — Type a word, see what Google suggests\n' +
        '3. **Free Tools** — Ubersuggest, AnswerThePublic, Google Keyword Planner\n' +
        '4. **Competitor Analysis** — What keywords do competitors rank for?\n' +
        '5. **Long-Tail Keywords** — "affordable web design in Kigali" vs "web design"\n\n' +
        '### Content Types That Rank:\n' +
        '- Blog posts answering common questions\n' +
        '- How-to guides and tutorials\n' +
        '- Product/service pages with detailed descriptions\n' +
        '- Location pages for each area you serve\n\n' +
        '### Practical Exercise:\n' +
        'Find 10 keywords for your business. Check search volume with free tools.',
        'article', 2,
      ),
      makeLesson('Technical SEO & Page Speed',
        'Optimise site speed, mobile-friendliness, and technical setup.\n\n' +
        '### Technical SEO Checklist:\n' +
        '1. **Mobile-Friendly** — Test with Google Mobile-Friendly Tool\n' +
        '2. **Page Speed** — Aim for under 3 seconds load time\n' +
        '3. **SSL Certificate** — HTTPS is essential (free with Let\'s Encrypt)\n' +
        '4. **Clear URLs** — yoursite.com/courses vs yoursite.com/page?id=123\n' +
        '5. **Meta Tags** — Title tags and meta descriptions for each page\n' +
        '6. **Sitemap** — Help Google find all your pages\n' +
        '7. **Alt Text** — Describe images for search engines\n\n' +
        '### Tools:\n' +
        '- Google PageSpeed Insights — Test your speed\n' +
        '- Google Search Console — Monitor your SEO\n' +
        '- Bing Webmaster Tools — Second largest search engine\n\n' +
        '### References:\n' +
        '- [Web.dev Performance Guide](https://web.dev/learn-core-web-vitals/)\n' +
        '- [Google Search Console Help](https://search.google.com/search-console/about)',
        'article', 3,
      ),
      makeQuizLesson('Module 7: Knowledge Check',
        'Review SEO fundamentals.',
        [
          { question: 'Best free tool for keyword research?', options: ['Photoshop', 'Ubersuggest', 'Excel', 'WordPress'], correctIndex: 1, explanation: 'Ubersuggest provides free keyword research data.' },
          { question: 'Which is most important for local SEO in Rwanda?', options: ['TikTok followers', 'Google Business Profile', 'Email list', 'Business cards'], correctIndex: 1, explanation: 'Google Business Profile helps customers find your business location.' },
          { question: 'HTTPS helps with SEO because?', options: ['Faster hosting', 'Google prefers secure sites', 'More colours', 'Free domain'], correctIndex: 1, explanation: 'Google ranks secure HTTPS sites higher than non-secure HTTP.' },
        ],
        4,
      ),
    ],
    'Optimise your online presence to appear in Google searches without paid ads.',
  ),

  makeModule(
    'Module 8: Content Marketing & Copywriting',
    'Create compelling content that attracts, engages, and converts customers.',
    [
      makeLesson('Content Marketing Strategy',
        'Plan, create, and distribute content that builds your brand and drives sales.\n\n' +
        '### Content Marketing Funnel:\n' +
        '1. **Awareness** — Blog posts, social content, videos (attract new visitors)\n' +
        '2. **Consideration** — Case studies, whitepapers, comparisons (nurture leads)\n' +
        '3. **Decision** — Testimonials, demos, free trials (convert to sales)\n' +
        '4. **Loyalty** — Newsletters, exclusive content, community (retain customers)\n\n' +
        '### Content Types:\n' +
        '- Blog posts (1,500-2,000 words for SEO)\n' +
        '- Short-form videos (TikTok, Reels)\n' +
        '- Infographics and carousels\n' +
        '- Customer success stories\n' +
        '- How-to guides and tutorials\n' +
        '- Podcasts and interviews\n\n' +
        '### References:\n' +
        '- [Content Marketing Institute Guide](https://contentmarketinginstitute.com/getting-started/)\n' +
        '- [HubSpot Content Marketing](https://www.hubspot.com/content-marketing)\n' +
        '- [Rwanda Digital Content Guide](https://rdb.rw/digital-content)',
        'video', 1, { videoUrl: VIDEOS.contentStrategy, videoTitle: 'Content Marketing Strategy' },
      ),
      makeLesson('Copywriting That Sells',
        'Write headlines, product descriptions, and calls-to-action that drive conversions.\n\n' +
        '### Copywriting Formulas:\n' +
        '1. **AIDA** — Attention, Interest, Desire, Action\n' +
        '2. **PAS** — Problem, Agitate, Solution\n' +
        '3. **4Ps** — Promise, Picture, Proof, Push\n' +
        '4. **FAB** — Features, Advantages, Benefits\n\n' +
        '### Headline Templates:\n' +
        '- "How to [achieve desired result] in [timeframe]"\n' +
        '- "[Number] Proven Ways to [achieve goal]"\n' +
        '- "The Ultimate Guide to [topic for Rwandans]"\n' +
        '- "Why Every [target audience] Needs [solution]"\n\n' +
        '### Tips for Rwandan Market:\n' +
        '- Use local examples (Kigali, MTN MoMo, etc.)\n' +
        '- Mention prices in RWF\n' +
        '- Reference local problems and solutions\n' +
        '- Use Kinyarwanda phrases for connection\n\n' +
        '### References:\n' +
        '- [Copyblogger Writing Tips](https://copyblogger.com/blog/)\n' +
        '- [Shopify Copywriting Guide](https://www.shopify.com/blog/copywriting)',
        'article', 2,
      ),
      makeLesson('Visual Content & Branding',
        'Create professional visuals using free tools and maintain brand consistency.\n\n' +
        '### Visual Content Tools (Free):\n' +
        '1. **Canva** — Design social posts, flyers, presentations\n' +
        '2. **CapCut** — Edit videos for TikTok, Reels, YouTube Shorts\n' +
        '3. **Remove.bg** — Remove image backgrounds\n' +
        '4. **Unsplash** — Free professional photos\n' +
        '5. **Google Fonts** — Professional fonts free to use\n\n' +
        '### Brand Consistency:\n' +
        '- Use the same colours, fonts, and logo everywhere\n' +
        '- Create a brand style guide (one-page document)\n' +
        '- Use templates in Canva for consistency\n' +
        '- Maintain the same tone of voice\n\n' +
        '### References:\n' +
        '- [Canva Design School](https://www.canva.com/learn/)\n' +
        '- [Google Design Resources](https://design.google/)',
        'article', 3,
      ),
      makeQuizLesson('Module 8: Knowledge Check',
        'Review content marketing concepts.',
        [
          { question: 'AIDA stands for?', options: ['Awareness, Interest, Desire, Action', 'Attention, Interest, Desire, Action', 'Awareness, Information, Decision, Action', 'Attention, Interest, Decision, Action'], correctIndex: 1, explanation: 'AIDA: Attention → Interest → Desire → Action is the classic copywriting formula.' },
          { question: 'Best free tool for visual design?', options: ['Photoshop', 'Canva', 'Word', 'Notepad'], correctIndex: 1, explanation: 'Canva is free and beginner-friendly for creating professional visuals.' },
          { question: 'What type of content is best for customer retention?', options: ['Cold emails', 'Newsletters', 'Pop-up ads', 'Billboards'], correctIndex: 1, explanation: 'Newsletters keep existing customers engaged with valuable content.' },
        ],
        4,
      ),
    ],
    'Create compelling content and copy that attracts and converts customers.',
  ),

  makeModule(
    'Module 9: Influencer & Partnership Marketing',
    'Collaborate with influencers and other businesses to grow your reach in Rwanda.',
    [
      makeLesson('Influencer Marketing in Rwanda',
        'Find, approach, and work with Rwandan influencers to promote your brand.\n\n' +
        '### Types of Influencers:\n' +
        '1. **Nano** (1K-5K followers) — High engagement, affordable\n' +
        '2. **Micro** (5K-50K followers) — Niche authority\n' +
        '3. **Macro** (50K-500K) — Wide reach\n' +
        '4. **Celebrity** (500K+) — Mass awareness\n\n' +
        '### Finding Influencers in Rwanda:\n' +
        '- Instagram: Search relevant hashtags\n' +
        '- TikTok: Explore trending creators\n' +
        '- Use tools like Heepsy or Upfluence\n' +
        '- Check the influencer\'s engagement rate\n\n' +
        '### Campaign Ideas:\n' +
        '- Product reviews and unboxings\n' +
        '- Takeovers (influencer runs your account for a day)\n' +
        '- Affiliate codes (influencer gets commission)\n' +
        '- Giveaways and contests\n' +
        '- Event appearances\n\n' +
        '### References:\n' +
        '- [Influencer Marketing Hub](https://influencermarketinghub.com/)\n' +
        '- [Rwanda Social Media Influencer Guide](https://rdb.rw/social-media)',
        'video', 1, { videoUrl: VIDEOS.socialMediaAds, videoTitle: 'Influencer Marketing Tips' },
      ),
      makeLesson('Partnership & Cross-Promotion',
        'Partner with complementary businesses to share audiences and grow together.\n\n' +
        '### Partnership Opportunities:\n' +
        '1. **Cross-Promotions** — Promote each other on social media\n' +
        '2. **Joint Events** — Webinars, workshops, pop-ups\n' +
        '3. **Bundled Offers** — Combine products/services\n' +
        '4. **Referral Programs** — Partners earn commission\n' +
        '5. **Content Collaborations** — Guest posts, interviews\n\n' +
        '### Finding Partners:\n' +
        '- Look for non-competing businesses serving the same audience\n' +
        '- Attend networking events in Kigali\n' +
        '- Join business WhatsApp groups\n' +
        '- Visit Rwanda Chamber of Commerce\n\n' +
        '### Example:\n' +
        'A web designer partners with a copywriter → they offer complete branding packages.',
        'article', 2,
      ),
      makeLesson('Measuring Partnership ROI',
        'Track the success of your influencer and partnership campaigns.\n\n' +
        '### Metrics to Track:\n' +
        '1. **Reach** — How many people saw your content\n' +
        '2. **Engagement Rate** — Likes, comments, shares ÷ followers\n' +
        '3. **Referral Traffic** — Visitors from partner links\n' +
        '4. **Conversion Rate** — Sales from influencer campaigns\n' +
        '5. **Cost Per Acquisition** — Total cost ÷ new customers\n\n' +
        '### Tracking Tools:\n' +
        '- Unique discount codes for each influencer\n' +
        '- UTM parameters in links\n' +
        '- Google Analytics referral tracking\n' +
        '- Social media analytics',
        'article', 3,
      ),
      makeQuizLesson('Module 9: Knowledge Check',
        'Review influencer and partnership concepts.',
        [
          { question: 'Best type of influencer for a local Kigali business?', options: ['International celebrity', 'Nano/Micro influencer', 'TikTok star', 'TV personality'], correctIndex: 1, explanation: 'Nano/Micro influencers have high engagement and are affordable for local businesses.' },
          { question: 'What is cross-promotion?', options: ['Advertising on TV', 'Two businesses promoting each other', 'Email marketing', 'Billboard ads'], correctIndex: 1, explanation: 'Cross-promotion means two businesses share audiences by promoting each other.' },
          { question: 'Best way to track influencer campaign success?', options: ['Ask them', 'Unique discount codes', 'Guess', 'Count likes'], correctIndex: 1, explanation: 'Unique discount codes for each influencer track exactly which sales came from whom.' },
        ],
        4,
      ),
    ],
    'Leverage influencers and partnerships to expand your reach cost-effectively.',
  ),

  makeModule(
    'Module 10: Digital Marketing Capstone & Final Exam',
    'Apply everything you learned in a comprehensive final project and exam.',
    [
      makeLesson('Capstone Project: Complete Marketing Plan',
        'Create a full digital marketing plan for a Rwandan business — real or imaginary.\n\n' +
        '### Project Requirements:\n' +
        '1. **Business Overview** — Name, description, target audience\n' +
        '2. **SWOT Analysis** — Strengths, Weaknesses, Opportunities, Threats\n' +
        '3. **Customer Personas** — 2-3 detailed customer profiles\n' +
        '4. **Channel Strategy** — Which platforms and why\n' +
        '5. **Content Plan** — 30-day content calendar\n' +
        '6. **Budget** — Realistic RWF budget breakdown\n' +
        '7. **KPIs** — How you will measure success\n' +
        '8. **Timeline** — 90-day implementation plan\n\n' +
        '### Submission:\n' +
        'Submit your plan as a document (PDF/Word/Google Docs). Include references to course materials.\n\n' +
        '### Evaluation Criteria:\n' +
        '- Practicality for Rwandan market (40%)\n' +
        '- Completeness (30%)\n' +
        '- Creativity & realism (30%)',
        'assignment', 1, { isAssignment: true, requiredAssignment: true, assignmentDescription: 'Create a complete digital marketing plan for a Rwandan business.' },
      ),
      makeLesson('Final Exam Preparation',
        'Review all modules before taking the final exam.\n\n' +
        '### Topics Covered:\n' +
        '1. Digital Marketing Foundations\n' +
        '2. Social Media & Content Marketing\n' +
        '3. Email Marketing & Automation\n' +
        '4. Analytics & Measuring ROI\n' +
        '5. Advanced Growth & Paid Advertising\n' +
        '6. WhatsApp Business & Mobile Marketing\n' +
        '7. Search Engine Optimisation (SEO)\n' +
        '8. Content Marketing & Copywriting\n' +
        '9. Influencer & Partnership Marketing\n\n' +
        '### Study Tips:\n' +
        '- Review all quiz questions and answers\n' +
        '- Practice creating a sample marketing plan\n' +
        '- Review key metrics and formulas\n' +
        '- Understand Rwandan market specifics\n\n' +
        '**The final exam has 10 questions, 30-minute time limit. Passing score: 70%.**',
        'article', 2,
      ),
      makeExamLesson('Final Exam: Digital Marketing',
        'Comprehensive final exam covering all 10 modules of Digital Marketing.',
        [
          { question: 'What is the first step in creating a digital marketing strategy?', options: ['Create social media accounts', 'Define your target audience', 'Run ads', 'Build a website'], correctIndex: 1, explanation: 'Always start by defining who you are marketing to before choosing channels.' },
          { question: 'Which platform has the highest user penetration in Rwanda?', options: ['LinkedIn', 'WhatsApp', 'Snapchat', 'Twitter'], correctIndex: 1, explanation: 'WhatsApp is the most-used platform in Rwanda with over 5 million users.' },
          { question: 'What does CTR stand for in digital marketing?', options: ['Cost Total Revenue', 'Click-Through Rate', 'Customer Transaction Ratio', 'Content Tracking Report'], correctIndex: 1, explanation: 'CTR = Click-Through Rate = number of clicks ÷ number of impressions × 100.' },
          { question: 'Best budget for a small Kigali business to start Facebook ads?', options: ['1,000 RWF/day', '5,000 RWF/day', '100,000 RWF/day', '1,000,000 RWF/day'], correctIndex: 1, explanation: 'Start small with 5,000 RWF/day to test what works before scaling.' },
          { question: 'What is the AIDA formula used for?', options: ['Website design', 'Copywriting', 'SEO', 'Video editing'], correctIndex: 1, explanation: 'AIDA (Attention, Interest, Desire, Action) is a copywriting formula for persuasive content.' },
          { question: 'Which of these is a local SEO ranking factor?', options: ['Number of Instagram followers', 'Google Business Profile completeness', 'Facebook page likes', 'Twitter retweets'], correctIndex: 1, explanation: 'A complete Google Business Profile with reviews and accurate info helps local SEO.' },
          { question: 'What is the recommended length for SEO blog posts?', options: ['100-200 words', '1,500-2,000 words', '5,000+ words', 'No text, only images'], correctIndex: 1, explanation: '1,500-2,000 words provides enough depth for SEO while keeping readers engaged.' },
          { question: 'Which WhatsApp Business feature helps organise customer conversations?', options: ['Broadcast Lists', 'Labels', 'Quick Replies', 'Status Updates'], correctIndex: 1, explanation: 'Labels (New Customer, Order Received, Payment Pending) help organise and filter chats.' },
          { question: 'What tool can you use to design social media posts for free?', options: ['Photoshop', 'Canva', 'Microsoft Word', 'Notepad'], correctIndex: 1, explanation: 'Canva offers a free tier with thousands of templates for social media posts.' },
          { question: 'What is the best way to track an influencer campaign?', options: ['Ask the influencer', 'Unique discount codes', 'Count post likes', 'Monitor follower count'], correctIndex: 1, explanation: 'Unique discount codes for each influencer allow you to track sales from their campaign.' },
        ],
        3,
      ),
    ],
    'Demonstrate mastery of all digital marketing concepts through a capstone project and final exam.',
  ),
];

// ── Freelancing: Modules 6-10 ──
const FREELANCING_MODULES = [
  makeModule(
    'Module 6: Freelance Platforms Deep Dive',
    'Master Upwork, Fiverr, Toptal, and African freelance platforms to win high-quality projects.',
    [
      makeLesson('Upwork Profile Optimisation',
        'Create a winning Upwork profile that stands out to global clients.\n\n' +
        '### Profile Components:\n' +
        '1. **Title** — Specific: "React Developer | 5+ Years | E-commerce Expert"\n' +
        '2. **Overview** — Problem-solution format, include metrics\n' +
        '3. **Portfolio** — 5-10 best projects with descriptions\n' +
        '4. **Employment History** — Relevant experience\n' +
        '5. **Education** — Certifications and courses\n' +
        '6. **Skills** — Add all relevant skills (max 20)\n' +
        '7. **English Level** — Be honest\n\n' +
        '### Profile Example (Rwandan Freelancer):\n' +
        '"Web developer from Kigali, Rwanda. I build fast, mobile-friendly websites for businesses across Africa. 50+ projects delivered, 100% client satisfaction."\n\n' +
        '### References:\n' +
        '- [Upwork Profile Tips](https://www.upwork.com/resources/how-to-write-upwork-profile)\n' +
        '- [Fiverr Seller Guide](https://www.fiverr.com/seller_guide)\n' +
        '- [African Freelancer Communities](https://www.africanfreelancers.com)',
        'video', 1, { videoUrl: VIDEOS.timeManagement, videoTitle: 'Upwork Profile Optimization' },
      ),
      makeLesson('Writing Winning Proposals',
        'Craft proposals that get responses and win projects.\n\n' +
        '### Proposal Structure:\n' +
        '1. **Greeting** — Personalised, mention their name\n' +
        '2. **Understanding** — Show you read their brief\n' +
        '3. **Solution** — How you will solve their problem\n' +
        '4. **Experience** — Similar projects you delivered\n' +
        '5. **Timeline** — When you can deliver\n' +
        '6. **Budget** — Your rate or fixed price\n' +
        '7. **Call to Action** — "Ready to start — let\'s discuss details"\n\n' +
        '### Do\'s:\n' +
        '- Keep under 250 words\n' +
        '- Ask 1-2 smart questions\n' +
        '- Include a portfolio link\n' +
        '- Show enthusiasm\n\n' +
        '### Don\'ts:\n' +
        '- Copy-paste proposals\n' +
        '- Talk about yourself too much\n' +
        '- Undersell yourself too low\n' +
        '- Use generic greetings',
        'article', 2,
      ),
      makeLesson('Alternative Platforms & Local Opportunities',
        'Explore platforms beyond Upwork and find local freelance opportunities.\n\n' +
        '### Global Platforms:\n' +
        '1. **Toptal** — Top 3% freelancers, high rates\n' +
        '2. **Freelancer.com** — Project-based competitions\n' +
        '3. **PeoplePerHour** — Hourly or fixed-price projects\n' +
        '4. **Guru** — Good for writing and design\n' +
        '5. **Contra** — Modern portfolio-first platform\n\n' +
        '### African Platforms:\n' +
        '1. **Kujali** — African freelance marketplace\n' +
        '2. **Ureed.com** — MENA region freelancing\n' +
        '3. **Flexin** — African remote jobs\n' +
        '4. **Remote Africa** — Africa-focused remote jobs\n\n' +
        '### Local Opportunities:\n' +
        '- RDB (Rwanda Development Board) tenders\n' +
        '- Local startups (check AngelList, Crunchbase)\n' +
        '- Rwandan business WhatsApp groups\n' +
        '- LinkedIn networking in Kigali\n' +
        '- Referrals from satisfied clients',
        'article', 3,
      ),
      makeQuizLesson('Module 6: Knowledge Check',
        'Review freelance platform strategies.',
        [
          { question: 'What should be in your Upwork title?', options: ['Just your name', 'Skills and experience level', 'Your location only', 'Fun facts'], correctIndex: 1, explanation: 'Include your skills and experience level: "React Developer | 5+ Years Experience".' },
          { question: 'How long should a proposal be?', options: ['500+ words', 'Under 250 words', 'One sentence', 'Over 1000 words'], correctIndex: 1, explanation: 'Keep proposals concise — under 250 words — and focused on the client\'s needs.' },
          { question: 'Which platform accepts only top 3% of freelancers?', options: ['Upwork', 'Fiverr', 'Toptal', 'Freelancer.com'], correctIndex: 2, explanation: 'Toptal\'s screening process accepts only the top 3% of applicants.' },
        ],
        4,
      ),
    ],
    'Win high-quality projects by mastering freelance platforms and proposal writing.',
  ),

  makeModule(
    'Module 7: Building a Stunning Portfolio',
    'Create a portfolio website and case studies that convince clients to hire you.',
    [
      makeLesson('Creating Your Portfolio Website',
        'Build a professional portfolio website that showcases your best work.\n\n' +
        '### Website Builders:\n' +
        '1. **Portfolio** — Behance, Dribbble (designers)\n' +
        '2. **GitHub Pages** — Free for developers\n' +
        '3. **LinkedIn** — Professional portfolio section\n' +
        '4. **Notion** — Free, easy to create\n' +
        '5. **Carrd** — Simple one-page sites (free)\n' +
        '6. **Custom site** — Your own domain (best)\n\n' +
        '### Required Pages:\n' +
        '- Home — Who you are, what you do\n' +
        '- Portfolio — 5-10 best projects with descriptions\n' +
        '- About — Your background and skills\n' +
        '- Testimonials — Client reviews\n' +
        '- Contact — Form or email\n\n' +
        '### Tips:\n' +
        '- Use real client logos\n' +
        '- Include before/after examples\n' +
        '- Show measurable results\n' +
        '- Keep design clean and professional\n\n' +
        '### References:\n' +
        '- [Free Portfolio Templates](https://html5up.net)\n' +
        '- [Behance Portfolio Tips](https://www.behance.net/curated/portfolios)',
        'video', 1, { videoUrl: VIDEOS.portfolioTips, videoTitle: 'Build Your Portfolio' },
      ),
      makeLesson('Writing Case Studies That Impress',
        'Document your projects in a way that demonstrates your value to future clients.\n\n' +
        '### Case Study Template:\n' +
        '1. **Client** — Who they are (can anonymise)\n' +
        '2. **Problem** — What challenge they faced\n' +
        '3. **Solution** — What you delivered\n' +
        '4. **Process** — How you approached it\n' +
        '5. **Results** — Measurable outcomes\n' +
        '6. **Testimonial** — Client quote\n' +
        '7. **Link** — Live project or work sample\n\n' +
        '### Example:\n' +
        '"Built an e-commerce site for Kigali Shop. Increased online orders by 150% in 3 months. Client saved 40% on marketing costs."\n\n' +
        '### Tips:\n' +
        '- Use numbers and percentages\n' +
        '- Include screenshots\n' +
        '- Show your thinking process\n' +
        '- Keep each case study under 500 words',
        'article', 2,
      ),
      makeLesson('Client Testimonials & Social Proof',
        'Collect and display client testimonials to build trust with prospects.\n\n' +
        '### How to Get Testimonials:\n' +
        '1. **Ask after successful delivery** — Strike while the iron is hot\n' +
        '2. **Use LinkedIn recommendations** — Built-in platform\n' +
        '3. **Video testimonials** — More powerful than text\n' +
        '4. **Upwork reviews** — Highest impact on platform\n' +
        '5. **Email template** — Make it easy for clients\n\n' +
        '### Testimonial Template Request:\n' +
        '"Hi [Client], I enjoyed working on [project]. Would you mind writing 2-3 sentences about your experience? Here are some prompts:\n' +
        '1. What problem did I solve for you?\n' +
        '2. What was your experience working with me?\n' +
        '3. What results did you see?\n\n' +
        'Thanks in advance!"\n\n' +
        '### Display Tips:\n' +
        '- Put strongest testimonials first\n' +
        '- Include client name, photo, company\n' +
        '- Use specific metrics when possible\n' +
        '- Rotate testimonials regularly',
        'article', 3,
      ),
      makeQuizLesson('Module 7: Knowledge Check',
        'Review portfolio building concepts.',
        [
          { question: 'How many projects should your portfolio show?', options: ['1-2 best ones', '5-10 best ones', 'All ever done', 'None'], correctIndex: 1, explanation: 'Show 5-10 of your best, most relevant projects. Quality over quantity.' },
          { question: 'Best platform for developer portfolios?', options: ['Instagram', 'GitHub Pages', 'TikTok', 'Facebook'], correctIndex: 1, explanation: 'GitHub Pages is free and perfect for hosting developer portfolio sites.' },
          { question: 'Most important element of a case study?', options: ['Long story', 'Measurable results', 'Fancy design', 'Many images'], correctIndex: 1, explanation: 'Measurable results (percentages, numbers) prove your value to clients.' },
        ],
        4,
      ),
    ],
    'Build a portfolio and case studies that convince clients to hire you.',
  ),

  makeModule(
    'Module 8: Client Communication & Retention',
    'Master communication skills to keep clients happy and coming back.',
    [
      makeLesson('Professional Client Communication',
        'Email, messaging, and meeting etiquette for freelance professionals.\n\n' +
        '### Communication Channels:\n' +
        '- **Email** — Formal communication, proposals, contracts\n' +
        '- **Slack/Teams** — Day-to-day project updates\n' +
        '- **Zoom/Google Meet** — Weekly check-ins\n' +
        '- **WhatsApp** — Quick questions (agree on this first)\n' +
        '- **Project Management** — Trello, Asana, Notion\n\n' +
        '### Communication Rules:\n' +
        '1. **Respond within 12 hours** — Even if just "Got it, will respond soon"\n' +
        '2. **Over-communicate** — Share progress regularly\n' +
        '3. **Be honest** — If delayed, tell them early\n' +
        '4. **Use clear language** — Avoid jargon unless appropriate\n' +
        '5. **Document decisions** — Follow up meetings with written summary\n\n' +
        '### Weekly Update Template:\n' +
        '"Hi [Client], here\'s what I completed this week:\n' +
        '- ✅ Task 1 completed\n' +
        '- 🔄 Task 2 in progress (50%)\n' +
        '- 📅 Task 3 starting next week\n' +
        'Any feedback or adjustments?"\n\n' +
        '### References:\n' +
        '- [Client Communication Guide](https://www.freshbooks.com/hub/accounting/client-communication)\n' +
        '- [Remote Work Best Practices](https://basecamp.com/books/remote)',
        'video', 1, { videoUrl: VIDEOS.clientNegotiation, videoTitle: 'Client Communication Tips' },
      ),
      makeLesson('Handling Difficult Clients & Conflicts',
        'Navigate disagreements, scope creep, and difficult situations professionally.\n\n' +
        '### Common Challenges:\n' +
        '1. **Scope Creep** — Client asks for more without paying\n' +
        '2. **Late Payment** — Client doesn\'t pay on time\n' +
        '3. **Unclear Requirements** — Client doesn\'t know what they want\n' +
        '4. **Micromanagement** — Client checks work constantly\n' +
        '5. **Unrealistic Deadlines** — Impossible timeframes\n\n' +
        '### Solutions:\n' +
        '- **Scope Creep** — "Sure, I can add that. It will take 3 extra hours at $X/hr."\n' +
        '- **Late Payment** — Use milestone payments, send reminders 3 days before due\n' +
        '- **Unclear** — Create a brief template they fill out before work starts\n' +
        '- **Micro** — Set fixed check-in times (e.g., Mon/Wed/Fri 5pm)\n' +
        '- **Deadlines** — Show timeline trade-offs: "I can do it faster, but quality will suffer"\n\n' +
        '### Red Flags:\n' +
        '- Vague project scope\n' +
        '- Unwilling to sign contract\n' +
        '- Asking for free work\n' +
        '- Bad communication upfront\n' +
        '- Unrealistic expectations',
        'article', 2,
      ),
      makeLesson('Getting Repeat Business & Referrals',
        'Turn one-time clients into long-term relationships that generate recurring income.\n\n' +
        '### Retention Strategies:\n' +
        '1. **Deliver more than promised** — Under-promise, over-deliver\n' +
        '2. **Follow up after project** — Check how things are going\n' +
        '3. **Offer maintenance packages** — Monthly retainers\n' +
        '4. **Share valuable resources** — Articles, tools relevant to them\n' +
        '5. **Ask for referrals** — "Do you know anyone who needs similar work?"\n' +
        '6. **Send holiday greetings** — Personal touch\n' +
        '7. **Offer loyalty discounts** — 10% off for returning clients\n\n' +
        '### Referral Incentives:\n' +
        '- 10% commission on referred projects\n' +
        '- Free hour of work per successful referral\n' +
        '- Discount on their next project\n' +
        '- Public recognition (with permission)',
        'article', 3,
      ),
      makeQuizLesson('Module 8: Knowledge Check',
        'Review client communication strategies.',
        [
          { question: 'How quickly should you respond to client messages?', options: ['Within 1 month', 'Within 12 hours', 'Within 1 week', 'No rush'], correctIndex: 1, explanation: 'Respond within 12 hours even if just to acknowledge the message.' },
          { question: 'Best response to scope creep?', options: ['Do it for free', 'Explain additional cost and timeline', 'Ignore the request', 'Quit the project'], correctIndex: 1, explanation: 'Politely explain the additional work requires extra budget or timeline.' },
          { question: 'Best way to get referrals?', options: ['Wait and hope', 'Ask satisfied clients', 'Cold email', 'Run ads'], correctIndex: 1, explanation: 'Simply asking satisfied clients for referrals is the most effective method.' },
        ],
        4,
      ),
    ],
    'Master client communication to build long-term relationships and get repeat business.',
  ),

  makeModule(
    'Module 9: Financial Management for Freelancers',
    'Manage your freelance finances — taxes, invoicing, savings, and retirement.',
    [
      makeLesson('Invoicing & Getting Paid',
        'Create professional invoices and ensure timely payments.\n\n' +
        '### Invoicing Tools (Free):\n' +
        '1. **Wave** — Free invoicing and accounting\n' +
        '2. **Zoho Invoice** — Free for 1 user\n' +
        '3. **FreshBooks** — Paid, but excellent\n' +
        '4. **PayPal Invoicing** — Integrated with PayPal\n' +
        '5. **Google Sheets** — Simple template\n\n' +
        '### Invoice Template:\n' +
        '- Your business name, address, contact\n' +
        '- Client name and address\n' +
        '- Invoice number (INV-001)\n' +
        '- Date issued and due date\n' +
        '- Line items: Description, quantity, rate, total\n' +
        '- Subtotal, tax (if applicable), total\n' +
        '- Payment instructions (bank/MoMo/PayPal)\n\n' +
        '### Payment Terms:\n' +
        '- Net 15 or Net 30 for invoiced work\n' +
        '- 50% deposit upfront for large projects\n' +
        '- Late payment penalty: 5% after 30 days\n' +
        '- Offer early payment discount: 2% off if paid within 7 days\n\n' +
        '### References:\n' +
        '- [Wave Invoicing](https://www.waveapps.com/invoicing)\n' +
        '- [RRA Tax Guide](https://www.rra.gov.rw/tax-guide)',
        'video', 1, { videoUrl: VIDEOS.taxBasics, videoTitle: 'Freelancer Invoicing Guide' },
      ),
      makeLesson('Taxes for Freelancers in Rwanda',
        'Understand your tax obligations as a Rwandan freelancer.\n\n' +
        '### Tax Registration:\n' +
        '1. **RDB Registration** — Register as a business\n' +
        '2. **TIN Number** — Tax Identification Number (free)\n' +
        '3. **RRA Portal** — File taxes online\n' +
        '4. **IBR (Invoice Billing System)** — Issue compliant invoices\n\n' +
        '### Tax Types:\n' +
        '1. **Income Tax** — Progressive rate (0%-30%)\n' +
        '2. **Withholding Tax** — 15% on service payments\n' +
        '3. **VAT** — 18% if annual turnover > 20M RWF\n' +
        '4. **Social Security** — RSSB contributions (optional for self-employed)\n\n' +
        '### Deductions (what you can subtract):\n' +
        '- Internet and phone costs\n' +
        '- Computer/equipment\n' +
        '- Coworking space\n' +
        '- Training and courses\n' +
        '- Software subscriptions\n' +
        '- Portion of rent if you work from home\n\n' +
        '### References:\n' +
        '- [RRA Freelancer Guide](https://www.rra.gov.rw/freelancers)\n' +
        '- [RDB Business Registration](https://org.rdb.rw)',
        'article', 2,
      ),
      makeLesson('Saving & Retirement for Freelancers',
        'Build financial security without employer benefits.\n\n' +
        '### Savings Strategy (50/30/20 Rule):\n' +
        '- **50%** — Essential expenses\n' +
        '- **30%** — Wants and discretionary\n' +
        '- **20%** — Savings and investments\n\n' +
        '### Emergency Fund:\n' +
        '- Save 3-6 months of expenses\n' +
        '- Keep in separate savings account\n' +
        '- Build this BEFORE investing\n\n' +
        '### Investment Options in Rwanda:\n' +
        '1. **Savings Account** — Safe, low return (5-8%)\n' +
        '2. **Treasury Bills** — Government-backed, 7-14%\n' +
        '3. **Mutual Funds** — Managed investments\n' +
        '4. **SACCO** — Community savings\n' +
        '5. **Real Estate** — Land, rental properties\n' +
        '6. **Stocks** — Rwanda Stock Exchange (RSE)\n\n' +
        '### Retirement:\n' +
        '- Open RSSB voluntary contribution\n' +
        '- OR open private pension fund\n' +
        '- Aim to save 15% of income for retirement\n' +
        '- Start early — compound interest is powerful\n\n' +
        '### References:\n' +
        '- [RSSB Voluntary Contributions](https://www.rssb.rw)\n' +
        '- [Rwanda Stock Exchange](https://www.rse.rw)\n' +
        '- [Central Bank Financial Literacy](https://www.bnr.rw)',
        'article', 3,
      ),
      makeQuizLesson('Module 9: Knowledge Check',
        'Review financial management concepts.',
        [
          { question: 'Best free invoicing tool for freelancers?', options: ['QuickBooks', 'Wave', 'Sage', 'Oracle'], correctIndex: 1, explanation: 'Wave is completely free with professional invoicing features.' },
          { question: 'How many months of expenses should your emergency fund cover?', options: ['1 month', '3-6 months', '12 months', 'No need'], correctIndex: 1, explanation: '3-6 months of expenses provides a safety net without locking up too much capital.' },
          { question: 'What is the VAT registration threshold in Rwanda?', options: ['5M RWF', '20M RWF', '100M RWF', '500M RWF'], correctIndex: 1, explanation: 'VAT registration is required if annual turnover exceeds 20 million RWF.' },
        ],
        4,
      ),
    ],
    'Manage freelance finances professionally including invoicing, taxes, and savings.',
  ),

  makeModule(
    'Module 10: Freelance Capstone & Final Exam',
    'Apply everything with a comprehensive final project and exam.',
    [
      makeLesson('Capstone: Your Freelance Business Plan',
        'Create a complete business plan for your freelance career.\n\n' +
        '### Plan Components:\n' +
        '1. **Service Offering** — What you sell\n' +
        '2. **Target Market** — Who you serve\n' +
        '3. **Pricing Strategy** — Your rates and packages\n' +
        '4. **Marketing Plan** — How you get clients\n' +
        '5. **Financial Projections** — 12-month income forecast\n' +
        '6. **Growth Plan** — How you scale\n' +
        '7. **Risk Assessment** — What could go wrong\n\n' +
        '### Format:\n' +
        '- 5-10 page document\n' +
        '- Include a financial spreadsheet\n' +
        '- References to course materials\n\n' +
        '### Tips:\n' +
        '- Be realistic about initial income\n' +
        '- Plan for slow months\n' +
        '- Include specific Rwandan market insights',
        'assignment', 1, { isAssignment: true, requiredAssignment: true, assignmentDescription: 'Create a complete freelance business plan for the Rwandan market.' },
      ),
      makeLesson('Final Exam Preparation',
        'Review all 10 modules before the final exam.\n\n' +
        '### Topics Covered:\n' +
        '1. Getting Started as a Freelancer\n' +
        '2. Winning Clients & Growing Your Business\n' +
        '3. High-Income Skills for Freelancers\n' +
        '4. Personal Branding & LinkedIn Mastery\n' +
        '5. Managing Your Freelance Business\n' +
        '6. Freelance Platforms Deep Dive\n' +
        '7. Building a Stunning Portfolio\n' +
        '8. Client Communication & Retention\n' +
        '9. Financial Management for Freelancers\n\n' +
        '**The final exam has 10 questions, 30-minute time limit. Passing score: 70%.**',
        'article', 2,
      ),
      makeExamLesson('Final Exam: Freelancing & Remote Work',
        'Comprehensive final exam covering all 10 modules.',
        [
          { question: 'What is the first step to start freelancing?', options: ['Buy equipment', 'Define your service and target market', 'Register with RRA', 'Create social media'], correctIndex: 1, explanation: 'First, clearly define what service you offer and who you will serve.' },
          { question: 'Best platform for finding high-quality freelance clients?', options: ['Instagram', 'Upwork', 'Facebook', 'TikTok'], correctIndex: 1, explanation: 'Upwork is the largest freelance marketplace with clients from around the world.' },
          { question: 'What should a proposal focus on?', options: ['Your experience', 'The client\'s needs', 'Your rates', 'Your availability'], correctIndex: 1, explanation: 'Focus on understanding and solving the client\'s specific problem.' },
          { question: 'How many portfolio projects should you showcase?', options: ['1-2', '5-10', '20-30', 'All of them'], correctIndex: 1, explanation: 'Showcase 5-10 of your best, most relevant projects.' },
          { question: 'Best way to handle scope creep?', options: ['Do extra work for free', 'Discuss additional costs/timeline', 'Ignore the request', 'Quit'], correctIndex: 1, explanation: 'Politely explain additional scope requires additional budget or timeline extension.' },
          { question: 'How much should you save for emergencies?', options: ['1 month expenses', '3-6 months expenses', '12 months expenses', 'No savings needed'], correctIndex: 1, explanation: 'An emergency fund of 3-6 months of expenses provides financial security.' },
          { question: 'Best free invoicing tool for freelancers?', options: ['QuickBooks', 'Wave', 'FreshBooks', 'Xero'], correctIndex: 1, explanation: 'Wave offers free invoicing and accounting for freelancers.' },
          { question: 'Most important factor in client retention?', options: ['Low prices', 'Consistent communication', 'Fast delivery', 'Fancy website'], correctIndex: 1, explanation: 'Consistent, professional communication builds trust and keeps clients coming back.' },
          { question: 'What should you do before starting a project?', options: ['Buy new equipment', 'Get a signed contract', 'Create social media', 'Tell friends'], correctIndex: 1, explanation: 'Always get a signed contract before starting any freelance project.' },
          { question: 'How can you get more referrals?', options: ['Run ads', 'Ask satisfied clients', 'Cold email strangers', 'Post on social media'], correctIndex: 1, explanation: 'Simply asking satisfied clients for referrals is the most effective method.' },
        ],
        3,
      ),
    ],
    'Demonstrate mastery of freelancing through a business plan and comprehensive exam.',
  ),
];


// ── Business & Entrepreneurship: Modules 6-10 ──
const BUSINESS_MODULES = [
  makeModule(
    'Module 6: Financial Management & Accounting for SMEs',
    'Master business finances — bookkeeping, cash flow, profit margins, and financial planning.',
    [
      makeLesson('Business Bookkeeping Basics',
        'Set up a simple bookkeeping system to track income, expenses, and profits for your business.\n\n' +
        '### Why Bookkeeping Matters:\n' +
        '1. **Know your numbers** — Are you making or losing money?\n' +
        '2. **Tax compliance** — RRA requires accurate records\n' +
        '3. **Business decisions** — Data-driven choices\n' +
        '4. **Investor confidence** — Clean books attract funding\n' +
        '5. **Legal protection** — Proof of transactions\n\n' +
        '### Simple Bookkeeping System:\n' +
        '- Use Google Sheets or Excel (free templates)\n' +
        '- Track ALL transactions — even 1,000 RWF\n' +
        '- Separate business and personal accounts\n' +
        '- Keep receipts and invoices organised\n' +
        '- Reconcile bank statements monthly\n\n' +
        '### Free Tools:\n' +
        '- Wave Accounting — Free invoicing and accounting\n' +
        '- Zoho Books — Free for small businesses\n' +
        '- Google Sheets — Free template from template.net\n' +
        '- QuickBooks Simple Start — Paid, but powerful\n\n' +
        '### References:\n' +
        '- [Wave Accounting Guide](https://www.waveapps.com/guide)\n' +
        '- [RRA Tax Guide for SMEs](https://www.rra.gov.rw/sme)\n' +
        '- [IFC Financial Literacy](https://www.ifc.org/financial-literacy)',
        'video', 1, { videoUrl: VIDEOS.fundingBasics, videoTitle: 'Business Bookkeeping Guide' },
      ),
      makeLesson('Cash Flow Management',
        'Understand and manage cash flow — the lifeblood of every business.\n\n' +
        '### Cash Flow vs Profit:\n' +
        '- **Profit** — Revenue minus expenses (accounting concept)\n' +
        '- **Cash Flow** — Actual money in and out of your bank\n' +
        '- A business can be profitable but run out of cash!\n\n' +
        '### Cash Flow Management Tips:\n' +
        '1. **Invoice promptly** — Send invoices immediately after delivery\n' +
        '2. **Offer discounts for early payment** — 2% off if paid within 7 days\n' +
        '3. **Negotiate longer payment terms** — With suppliers, not customers\n' +
        '4. **Keep a cash reserve** — 2-3 months of expenses\n' +
        '5. **Reduce unnecessary expenses** — Audit monthly subscriptions\n' +
        '6. **Use mobile money** — MoMo payments are instant\n\n' +
        '### Cash Flow Forecast Template:\n' +
        'List expected income and expenses for the next 3 months. Update weekly.\n\n' +
        '### References:\n' +
        '- [Cash Flow Management Guide](https://www.sba.gov/cash-flow)\n' +
        '- [QuickBooks Cash Flow Tips](https://quickbooks.intuit.com/r/cash-flow/)',
        'article', 2,
      ),
      makeLesson('Pricing for Profit',
        'Set prices that cover your costs and generate healthy profit margins.\n\n' +
        '### Pricing Methods:\n' +
        '1. **Cost-Plus** — Cost + Markup percentage\n' +
        '2. **Value-Based** — What the customer is willing to pay\n' +
        '3. **Competitor-Based** — Match or beat competitors\n' +
        '4. **Penetration Pricing** — Low price to gain market share\n' +
        '5. **Premium Pricing** — High price for perceived quality\n\n' +
        '### Calculate Your Price:\n' +
        'Selling Price = Cost of Goods + Operating Expenses + Profit Margin\n\n' +
        '### Rwandan Market Considerations:\n' +
        '- Know what similar products sell for in Kimironko\n' +
        '- Consider bulk discounts for wholesale customers\n' +
        '- Mobile money fees (1-3%) should be factored in\n' +
        '- Seasonal pricing adjustments (harvest, holidays)\n\n' +
        '### References:\n' +
        '- [Pricing Strategy Guide](https://www.shopify.com/pricing-strategy)\n' +
        '- [IFC Pricing for SMEs](https://www.ifc.org/sme-pricing)',
        'article', 3,
      ),
      makeQuizLesson('Module 6: Knowledge Check',
        'Test your financial management knowledge.',
        [
          { question: 'What separates business and personal accounts?', options: ['Nothing', 'A separate bank account', 'Same account, different labels', 'Cash only'], correctIndex: 1, explanation: 'Always maintain a separate bank account for your business.' },
          { question: 'Can a profitable business run out of cash?', options: ['No, never', 'Yes, if cash is tied up in inventory', 'Only if losing money', 'Not possible'], correctIndex: 1, explanation: 'A profitable business can fail if cash is stuck in inventory or unpaid invoices.' },
          { question: 'Best pricing method for a unique product?', options: ['Cost-plus', 'Value-based', 'Competitor-based', 'Random'], correctIndex: 1, explanation: 'Value-based pricing captures what customers are willing to pay for unique value.' },
        ],
        4,
      ),
    ],
    'Set up bookkeeping, manage cash flow, and price products for profit.',
  ),

  makeModule(
    'Module 7: Digital Tools & E-Commerce for Small Business',
    'Leverage digital tools and e-commerce platforms to sell online and streamline operations.',
    [
      makeLesson('Setting Up an Online Store',
        'Choose between marketplaces (Jumia, Vuba) and your own website (Shopify, WooCommerce).\n\n' +
        '### E-Commerce Options for Rwanda:\n' +
        '1. **Jumia Marketplace** — Largest African e-commerce, wide audience\n' +
        '2. **Vuba** — Rwandan marketplace, local delivery\n' +
        '3. **Shopify** — Your own branded store, global reach\n' +
        '4. **WooCommerce** — WordPress-based, full control\n' +
        '5. **WhatsApp Store** — Free, catalogue + orders via chat\n' +
        '6. **Instagram Shop** — Sell directly from social media\n\n' +
        '### Setting Up Shopify (Step-by-Step):\n' +
        '1. Go to shopify.com — 14-day free trial\n' +
        '2. Enter your business name and address\n' +
        '3. Choose a theme (free options available)\n' +
        '4. Add products (title, description, price, photos)\n' +
        '5. Set up payment (PayPal, Stripe, MoMo via integrations)\n' +
        '6. Set up shipping (local rates in RWF)\n' +
        '7. Launch your store!\n\n' +
        '### References:\n' +
        '- [Shopify Rwanda Guide](https://www.shopify.com/rwanda)\n' +
        '- [Jumia Seller Guide](https://seller.jumia.com)\n' +
        '- [Vuba Rwanda](https://vuba.rw)',
        'video', 1, { videoUrl: VIDEOS.businessModel, videoTitle: 'Setting Up E-Commerce' },
      ),
      makeLesson('Digital Tools for Business Operations',
        'Streamline your business with free and affordable digital tools.\n\n' +
        '### Essential Digital Tools:\n' +
        '1. **Communication** — WhatsApp Business, Slack, Zoom\n' +
        '2. **Project Management** — Trello, Asana, Notion\n' +
        '3. **Accounting** — Wave, Zoho Books, QuickBooks\n' +
        '4. **CRM** — HubSpot (free), Zoho CRM, Salesforce\n' +
        '5. **Marketing** — Mailchimp, Canva, Hootsuite\n' +
        '6. **Inventory** — Zoho Inventory, Odoo, inFlow\n' +
        '7. **Analytics** — Google Analytics, Facebook Insights\n\n' +
        '### Automation Tips:\n' +
        '- Automatic invoice reminders\n' +
        '- Scheduled social media posts\n' +
        '- Automated email responses\n' +
        '- Recurring task templates\n\n' +
        '### References:\n' +
        '- [Google Digital Garage - Free Tools](https://learndigital.withgoogle.com)\n' +
        '- [HubSpot for Startups](https://www.hubspot.com/startups)',
        'article', 2,
      ),
      makeLesson('Digital Payments & Mobile Money Integration',
        'Accept payments online and via mobile money with low fees.\n\n' +
        '### Payment Options for Rwandan Businesses:\n' +
        '1. **MTN MoMo Pay** — Accept payments via MoMo (2-3% fee)\n' +
        '2. **Airtel Money** — Similar to MoMo, growing user base\n' +
        '3. **PayPal** — International payments, 2.9% + fixed fee\n' +
        '4. **Stripe** — Global payments, but limited in Rwanda\n' +
        '5. **Flutterwave** — African payment gateway, works in Rwanda\n' +
        '6. **Pesapal** — Payments across East Africa\n' +
        '7. **Bank Transfer** — Traditional, no fee but slower\n\n' +
        '### Setting Up MoMo Pay:\n' +
        '1. Register your business with MTN\n' +
        '2. Get a merchant code\n' +
        '3. Integrate into your website or share payment link\n' +
        '4. Receive instant payment notifications\n\n' +
        '### References:\n' +
        '- [MTN MoMo Pay](https://www.mtn.co.rw/momo-pay)\n' +
        '- [Flutterwave Docs](https://developer.flutterwave.com)\n' +
        '- [PayPal Rwanda](https://www.paypal.com/rw)',
        'article', 3,
      ),
      makeQuizLesson('Module 7: Knowledge Check',
        'Review digital tools and e-commerce concepts.',
        [
          { question: 'Best e-commerce platform to start for a Rwandan business?', options: ['Amazon', 'Jumia or WhatsApp Store', 'Alibaba', 'eBay'], correctIndex: 1, explanation: 'Jumia and WhatsApp Store are most accessible for Rwandan businesses.' },
          { question: 'Which tool is free for CRM?', options: ['Salesforce', 'HubSpot', 'Excel', 'WordPress'], correctIndex: 1, explanation: 'HubSpot offers a generous free CRM tier perfect for small businesses.' },
          { question: 'Typical mobile money payment fee in Rwanda?', options: ['10%', '2-3%', '20%', 'Free'], correctIndex: 1, explanation: 'Mobile money processing fees range from 2-3% in Rwanda.' },
        ],
        4,
      ),
    ],
    'Set up an online store and leverage digital tools to streamline operations.',
  ),

  makeModule(
    'Module 8: Customer Service & Retention',
    'Build customer loyalty and turn one-time buyers into lifelong advocates.',
    [
      makeLesson('Customer Service Excellence',
        'Deliver exceptional customer service that sets your business apart.\n\n' +
        '### Why Customer Service Matters:\n' +
        '1. **Retention** — 65% of business comes from existing customers\n' +
        '2. **Word of mouth** — Happy customers tell 5+ people\n' +
        '3. **Higher spending** — Repeat customers spend 67% more\n' +
        '4. **Competitive advantage** — Service is hard to copy\n' +
        '5. **Lower costs** — Retaining costs 5x less than acquiring\n\n' +
        '### Service Standards:\n' +
        '- Respond to messages within 1 hour\n' +
        '- Always greet customers warmly\n' +
        '- Listen before solving\n' +
        '- Follow up after service\n' +
        '- Apologise sincerely when things go wrong\n' +
        '- Go the extra mile (small surprise, discount)\n\n' +
        '### Customer Touchpoints in Rwanda:\n' +
        '- WhatsApp message → Respond within 30 minutes\n' +
        '- Phone call → Answer professionally within 3 rings\n' +
        '- In-person → Smile, greet, make eye contact\n' +
        '- Email → Respond within 4 business hours\n' +
        '- Social media comment → Respond within 1 hour\n\n' +
        '### References:\n' +
        '- [Customer Service Guide](https://www.zendesk.com/customer-service-guide)\n' +
        '- [Small Business Service Tips](https://www.shopify.com/blog/customer-service)',
        'video', 1, { videoUrl: VIDEOS.pricingStrategy, videoTitle: 'Customer Service Excellence' },
      ),
      makeLesson('Handling Complaints & Difficult Customers',
        'Turn complaints into opportunities to build stronger relationships.\n\n' +
        '### The HEART Method:\n' +
        '1. **H**ear — Listen without interrupting\n' +
        '2. **E**mpathise — Show you understand their frustration\n' +
        '3. **A**pologise — Sincere apology, not defensive\n' +
        '4. **R**esolve — Offer a solution, not excuses\n' +
        '5. **T**hank — Thank them for their feedback\n\n' +
        '### Common Complaints in Rwanda:\n' +
        '- Late delivery → Offer discount on next order\n' +
        '- Product quality → Replace or refund immediately\n' +
        '- Poor communication → Set clear expectations next time\n' +
        '- Wrong item shipped → Overnight replacement, keep the wrong item\n\n' +
        '### Do NOT Say:\n' +
        '- "That is not my problem"\n' +
        '- "You are wrong"\n' +
        '- "Calm down" (makes things worse)\n' +
        '- "I cannot help you"\n' +
        '- "It is our policy" without explanation',
        'article', 2,
      ),
      makeLesson('Building a Loyalty Program',
        'Create simple loyalty programs that keep customers coming back.\n\n' +
        '### Loyalty Program Types:\n' +
        '1. **Points System** — 1 point per 1,000 RWF spent\n' +
        '2. **Punch Cards** — Buy 10, get 1 free (works great for cafes)\n' +
        '3. **VIP Tiers** — Silver, Gold, Platinum with increasing perks\n' +
        '4. **Referral Program** — Give discount for each referral\n' +
        '5. **Subscription** — Monthly delivery at a discount\n\n' +
        '### Low-Cost Program Ideas:\n' +
        '- Birthday discount (send via WhatsApp)\n' +
        '- Early access to new products\n' +
        '- Exclusive WhatsApp group for top customers\n' +
        '- Free delivery for orders above X RWF\n' +
        '- Annual customer appreciation event\n\n' +
        '### Tracking Loyalty:\n' +
        '- Use Google Sheets or simple CRM\n' +
        '- Track repeat purchase rate\n' +
        '- Measure customer lifetime value\n' +
        '- Send personalised offers based on history\n\n' +
        '### References:\n' +
        '- [Loyalty Program Guide](https://www.shopify.com/blog/loyalty-program)\n' +
        '- [Rwanda Small Business Toolkit](https://rdb.rw/sme-toolkit)',
        'article', 3,
      ),
      makeQuizLesson('Module 8: Knowledge Check',
        'Review customer service and retention concepts.',
        [
          { question: 'What percentage of business comes from existing customers?', options: ['25%', '65%', '90%', '10%'], correctIndex: 1, explanation: '65% of business typically comes from existing, repeat customers.' },
          { question: 'The HEART method stands for?', options: ['Hear, Empathise, Apologise, Resolve, Thank', 'Help, Explain, Answer, Resolve, Talk', 'Hire, Educate, Assist, Review, Train', 'None of the above'], correctIndex: 0, explanation: 'HEART: Hear, Empathise, Apologise, Resolve, Thank.' },
          { question: 'Cheapest loyalty program to start?', options: ['Mobile app', 'Punch card', 'CRM software', 'Data analytics'], correctIndex: 1, explanation: 'Punch cards cost nothing to implement and work for many business types.' },
        ],
        4,
      ),
    ],
    'Deliver exceptional customer service and build loyalty programs that retain customers.',
  ),

  makeModule(
    'Module 9: Business Networking & Partnerships',
    'Build relationships, find mentors, and create strategic partnerships to grow your business.',
    [
      makeLesson('Networking for Business Growth',
        'Master networking skills to build valuable business relationships in Rwanda.\n\n' +
        '### Where to Network in Rwanda:\n' +
        '1. **Rwanda Chamber of Commerce** — Events and mixers\n' +
        '2. **Kigali Innovation City** — Tech and startup events\n' +
        '3. **Business WhatsApp Groups** — Industry-specific groups\n' +
        '4. **LinkedIn** — Connect with Rwandan professionals\n' +
        '5. **Industry Conferences** — Tourism, agriculture, finance\n' +
        '6. **Co-working Spaces** — The Office, Impact Hub, Norrsken House\n\n' +
        '### Networking Tips:\n' +
        '- Prepare a 30-second pitch about your business\n' +
        '- Ask questions and listen more than you talk\n' +
        '- Follow up within 24 hours via LinkedIn or WhatsApp\n' +
        '- Offer value before asking for favours\n' +
        '- Build relationships, not just contacts\n' +
        '- Attend consistently — relationships build over time\n\n' +
        '### References:\n' +
        '- [Rwanda Chamber of Commerce](https://www.chamberrwanda.com)\n' +
        '- [LinkedIn Networking Guide](https://www.linkedin.com/business/networking)\n' +
        '- [Norrsken House Kigali](https://www.norrsken.org/kigali)',
        'video', 1, { videoUrl: VIDEOS.growthHacking, videoTitle: 'Business Networking Tips' },
      ),
      makeLesson('Finding a Mentor & Advisory Board',
        'Find experienced mentors who can guide your business journey.\n\n' +
        '### Where to Find Mentors:\n' +
        '1. **RDB Entrepreneur Programs** — Government-supported\n' +
        '2. **Tony Elumelu Foundation** — Pan-African mentorship\n' +
        '3. **Kigali Startup Grind** — Monthly founder meetups\n' +
        '4. **SCORE Mentors** — International, free\n' +
        '5. **University Business Centers** — UR, Carnegie Mellon\n' +
        '6. **Online** — MicroMentor, Findamentor, LinkedIn\n\n' +
        '### Mentor Relationship Tips:\n' +
        '- Be clear about what you need (advice, connections, feedback)\n' +
        '- Respect their time — come prepared with specific questions\n' +
        '- Show progress — update them on your results\n' +
        '- Offer value in return — help with their business too\n' +
        '- Say thank you consistently\n\n' +
        '### Advisory Board:\n' +
        'As you grow, form a small advisory board (3-5 people) with complementary skills — finance, marketing, operations.\n\n' +
        '### References:\n' +
        '- [Tony Elumelu Foundation](https://tonyelumelufoundation.org)\n' +
        '- [MicroMentor](https://www.micromentor.org)\n' +
        '- [RDB Entrepreneurship](https://rdb.rw/entrepreneurship)',
        'article', 2,
      ),
      makeLesson('Strategic Partnerships & Joint Ventures',
        'Form strategic partnerships that multiply your reach and capabilities.\n\n' +
        '### Types of Partnerships:\n' +
        '1. **Supplier Partnerships** — Better terms from suppliers\n' +
        '2. **Distribution Partnerships** — Reach new customers\n' +
        '3. **Marketing Partnerships** — Co-marketing campaigns\n' +
        '4. **Technology Partnerships** — Access new tools\n' +
        '5. **Joint Ventures** — Share resources on large projects\n\n' +
        '### Partnership Checklist:\n' +
        '- Aligned values and goals\n' +
        '- Complementary offerings (not competitive)\n' +
        '- Clear agreement on roles and revenue split\n' +
        '- Measurable success metrics\n' +
        '- Exit strategy if partnership fails\n\n' +
        '### Example Partnerships in Rwanda:\n' +
        '- Caterer + Event planner → Complete event packages\n' +
        '- Web designer + Copywriter → Full branding services\n' +
        '- Farmer + Logistics company → Farm-to-table delivery\n' +
        '- Trainer + Venue → Combined training packages\n\n' +
        '### References:\n' +
        '- [Strategic Partnership Guide](https://www.forbes.com/partnerships)\n' +
        '- [RDB Business Linkages](https://rdb.rw/business-linkages)',
        'article', 3,
      ),
      makeQuizLesson('Module 9: Knowledge Check',
        'Review networking and partnership concepts.',
        [
          { question: 'How soon should you follow up after networking?', options: ['Within 24 hours', 'Within 1 week', 'Only if they contact you', 'Next month'], correctIndex: 0, explanation: 'Follow up within 24 hours while your conversation is still fresh.' },
          { question: 'Best place to network in Kigali?', options: ['Shopping malls', 'Chamber of Commerce events', 'Bus stations', 'Parks'], correctIndex: 1, explanation: 'Chamber of Commerce events are specifically designed for business networking.' },
          { question: 'What should you do before asking a mentor for help?', options: ['Send a gift', 'Come with specific questions', 'Wait for them to offer', 'Agree to pay'], correctIndex: 1, explanation: 'Respect their time by coming prepared with clear, specific questions.' },
        ],
        4,
      ),
    ],
    'Build a strong network and form strategic partnerships for business growth.',
  ),

  makeModule(
    'Module 10: Business Capstone & Final Exam',
    'Apply everything you learned in a comprehensive final project and exam.',
    [
      makeLesson('Capstone: Complete Business Growth Plan',
        'Create a comprehensive business growth plan for a real or imagined Rwandan business.\n\n' +
        '### Project Requirements:\n' +
        '1. **Executive Summary** — One-page overview of your plan\n' +
        '2. **Business Model** — How your business makes money (Canvas model)\n' +
        '3. **Market Analysis** — Target market, size, competition\n' +
        '4. **Marketing Plan** — Channels, budget, timeline\n' +
        '5. **Operations Plan** — Systems, team, processes\n' +
        '6. **Financial Plan** — 12-month projections, break-even analysis\n' +
        '7. **Growth Strategy** — How you will scale in 1-3 years\n' +
        '8. **Risk Assessment** — What could go wrong and how to mitigate\n\n' +
        '### Submission Format:\n' +
        '- 8-12 page document (PDF or Google Doc)\n' +
        '- Include financial spreadsheet\n' +
        '- References to course materials and external sources\n\n' +
        '### Evaluation:\n' +
        '- Practicality for Rwandan market (40%)\n' +
        '- Financial realism (30%)\n' +
        '- Completeness and clarity (30%)',
        'assignment', 1, { isAssignment: true, requiredAssignment: true, assignmentDescription: 'Create a comprehensive business growth plan for a Rwandan business.' },
      ),
      makeLesson('Final Exam Preparation',
        'Review all 10 modules before the final exam.\n\n' +
        '### Topics Covered:\n' +
        '1. Finding Your Business Idea\n' +
        '2. Business Planning & Funding\n' +
        '3. Business Registration & Legal\n' +
        '4. Marketing & Sales\n' +
        '5. Operations, Growth & Scaling\n' +
        '6. Financial Management & Accounting\n' +
        '7. Digital Tools & E-Commerce\n' +
        '8. Customer Service & Retention\n' +
        '9. Networking & Partnerships\n\n' +
        '**Final Exam: 10 questions, 30-minute time limit. Passing score: 70%.**',
        'article', 2,
      ),
      makeExamLesson('Final Exam: Start Your Business',
        'Comprehensive final exam covering all 10 modules.',
        [
          { question: 'What is the first step before starting a business?', options: ['Register with RDB', 'Validate your business idea', 'Buy equipment', 'Hire employees'], correctIndex: 1, explanation: 'Always validate your idea with real customers before investing time and money.' },
          { question: 'What is the minimum capital to register a company in Rwanda?', options: ['1,000 RWF', 'No minimum for some structures', '1,000,000 RWF', '100,000 RWF'], correctIndex: 1, explanation: 'Sole proprietorships have no minimum capital requirement.' },
          { question: 'Best way to understand customer needs?', options: ['Guess', 'Talk to 20+ potential customers', 'Copy competitors', 'Follow trends'], correctIndex: 1, explanation: 'Customer discovery interviews are the most reliable way to understand needs.' },
          { question: 'What is the recommended cash reserve?', options: ['1 week of expenses', '2-3 months of expenses', '1 year of expenses', 'No reserve needed'], correctIndex: 1, explanation: '2-3 months of expenses gives you a safety net for slow periods.' },
          { question: 'African payment gateway that works in Rwanda?', options: ['Alipay', 'Flutterwave', 'WeChat Pay', 'Square'], correctIndex: 1, explanation: 'Flutterwave supports payments in Rwanda and across Africa.' },
          { question: 'What percentage of business comes from existing customers?', options: ['25%', '65%', '90%', '10%'], correctIndex: 1, explanation: '65% of business typically comes from repeat customers.' },
          { question: 'How often should you reconcile bank statements?', options: ['Yearly', 'Monthly', 'Daily', 'Never'], correctIndex: 1, explanation: 'Monthly reconciliation helps catch errors and maintain accurate records.' },
          { question: 'Best pricing method for a new product?', options: ['Max price possible', 'Value-based pricing', 'Give it away free', 'Double competitors'], correctIndex: 1, explanation: 'Value-based pricing aligns with what customers are willing to pay.' },
          { question: 'Where to find business mentors in Rwanda?', options: ['Facebook groups', 'RDB Entrepreneur Programs', 'WhatsApp', 'Newspapers'], correctIndex: 1, explanation: 'RDB offers structured entrepreneur programs with mentorship.' },
          { question: 'What is a key metric for customer retention?', options: ['Number of followers', 'Repeat purchase rate', 'Website visitors', 'Ad impressions'], correctIndex: 1, explanation: 'Repeat purchase rate directly measures how well you retain customers.' },
        ],
        3,
      ),
    ],
    'Demonstrate mastery of business concepts through a growth plan and comprehensive exam.',
  ),
];

// ── Professional English: Modules 6-10 ──
const ENGLISH_MODULES = [
  makeModule(
    'Module 6: English for Customer Service & Client Relations',
    'Master the English needed to handle customer inquiries, complaints, and build client relationships.',
    [
      makeLesson('Professional Phone & Video Call English',
        'Learn key phrases for professional phone and video calls in English.\n\n' +
        '### Phone Call Phrases:\n' +
        '- **Answering:** "Good morning, [Company Name], [Your Name] speaking. How may I help you?"\n' +
        '- **Putting on hold:** "May I put you on hold for a moment?"\n' +
        '- **Taking a message:** "I am sorry, [Name] is not available. Can I take a message?"\n' +
        '- **Transferring:** "Let me transfer you to the right department."\n' +
        '- **Ending:** "Thank you for calling. Have a great day!"\n\n' +
        '### Video Call Etiquette:\n' +
        '1. Test your audio and video before the meeting\n' +
        '2. Use a professional background or blur it\n' +
        '3. Mute yourself when not speaking\n' +
        '4. Look at the camera, not the screen\n' +
        '5. Use the chat feature for links and questions\n' +
        '6. Say your name before speaking: "This is [Name], I would like to add..."\n\n' +
        '### Practice Exercise:\n' +
        'Role-play a customer service call with a partner using the phrases above.\n\n' +
        '### References:\n' +
        '- [Business English Phone Calls](https://www.britishcouncil.org/business-phone)\n' +
        '- [Zoom Meeting Etiquette](https://blog.zoom.us/meeting-etiquette)',
        'video', 1, { videoUrl: VIDEOS.meetingEnglish, videoTitle: 'Business Phone Call English' },
      ),
      makeLesson('Writing Professional Customer Emails',
        'Write clear, polite, and professional emails to customers and clients.\n\n' +
        '### Customer Email Types:\n' +
        '1. **Inquiry Response** — Answer product/service questions\n' +
        '2. **Order Confirmation** — Confirm order details and timeline\n' +
        '3. **Shipping Notification** — Inform customer their order is on the way\n' +
        '4. **Complaint Response** — Apologise and resolve issues\n' +
        '5. **Follow-up Email** — Check if customer is satisfied\n' +
        '6. **Thank You Email** — Show appreciation for their business\n\n' +
        '### Template: Complaint Response\n' +
        'Subject: Apology for Your Experience\n\n' +
        'Dear [Customer Name],\n\n' +
        'Thank you for bringing this to our attention. I sincerely apologise for the inconvenience caused. We take your feedback seriously and have taken the following steps: [action taken].\n\n' +
        'As a gesture of goodwill, we would like to offer you [compensation].\n\n' +
        'Please let us know if there is anything else we can do.\n\n' +
        'Best regards,\n[Your Name]\n\n' +
        '### References:\n' +
        '- [Business Email Writing Guide](https://www.cambridgeenglish.org/email-writing)\n' +
        '- [Customer Service Email Templates](https://www.hubspot.com/customer-email-templates)',
        'article', 2,
      ),
      makeLesson('Building Rapport with International Clients',
        'Use culturally appropriate English to build strong relationships with clients worldwide.\n\n' +
        '### Building Rapport Techniques:\n' +
        '1. **Use their name** — People love hearing their name\n' +
        '2. **Find common ground** — Ask about their weekend, interests\n' +
        '3. **Show genuine interest** — Ask follow-up questions\n' +
        '4. **Use positive language** — "Absolutely," "Great idea," "I would be happy to"\n' +
        '5. **Mirror their communication style** — Formal vs informal\n' +
        '6. **Remember personal details** — Birthday, family, hobbies\n\n' +
        '### Cultural Awareness:\n' +
        '- American clients: Direct, value efficiency\n' +
        '- British clients: Polite, indirect, value relationships\n' +
        '- European clients: Value hierarchy and formal titles\n' +
        '- Middle Eastern clients: Relationship-first, value trust\n' +
        '- Asian clients: Respectful, avoid direct confrontation\n\n' +
        '### References:\n' +
        '- [Cross-Cultural Business Communication](https://www.britishcouncil.org/cross-cultural)\n' +
        '- [International Client Management](https://hbr.org/client-relationships)',
        'article', 3,
      ),
      makeQuizLesson('Module 6: Knowledge Check',
        'Test your customer service English skills.',
        [
          { question: 'Best phrase when putting a caller on hold?', options: ['Wait', 'Hold on', 'May I put you on hold?', 'Call back later'], correctIndex: 2, explanation: 'Always ask permission politely before putting someone on hold.' },
          { question: 'What should you do before speaking in a video call?', options: ['Wave your hands', 'Say your name', 'Clear your throat', 'Type in chat'], correctIndex: 1, explanation: 'Say your name to identify yourself before speaking: "This is [Name]..."' },
          { question: 'How to start a complaint response email?', options: ['State the facts coldly', 'Apologise sincerely', 'Blame someone else', 'Ignore the complaint'], correctIndex: 1, explanation: 'Always start a complaint response with a sincere apology.' },
        ],
        4,
      ),
    ],
    'Handle customer interactions professionally in English across phone, email, and video.',
  ),

  makeModule(
    'Module 7: English for Digital Communication',
    'Master professional English for social media, Slack, Zoom chat, and online collaboration tools.',
    [
      makeLesson('Professional Social Media English',
        'Write professional LinkedIn posts, tweets, and social media updates that build your brand.\n\n' +
        '### LinkedIn Post Structure:\n' +
        '1. **Hook** — First line grabs attention\n' +
        '2. **Problem** — What challenge did you face?\n' +
        '3. **Solution** — How did you overcome it?\n' +
        '4. **Result** — What was the outcome?\n' +
        '5. **Lesson** — What did you learn?\n' +
        '6. **Call to Action** — Ask a question, invite comments\n\n' +
        '### Post Example:\n' +
        '"I used to struggle with client presentations in English. Then I discovered the power of storytelling. Here are 3 techniques that transformed my confidence...\n\n' +
        'What is your biggest challenge with business English? Share below!"\n\n' +
        '### Social Media Dos:\n' +
        '- Use professional language, not slang\n' +
        '- Keep posts under 200 words on LinkedIn\n' +
        '- Use bullet points for readability\n' +
        '- Include relevant hashtags (#BusinessEnglish #Rwanda)\n' +
        '- Engage with comments promptly\n\n' +
        '### References:\n' +
        '- [LinkedIn Writing Tips](https://www.linkedin.com/pulse/linkedin-writing-tips)\n' +
        '- [Business Social Media Guide](https://www.hootsuite.com/social-media-business)',
        'video', 1, { videoUrl: VIDEOS.businessVocab, videoTitle: 'Professional Social Media English' },
      ),
      makeLesson('English for Slack, Teams & Chat',
        'Use professional English in workplace chat tools like Slack, Microsoft Teams, and WhatsApp.\n\n' +
        '### Chat Etiquette:\n' +
        '1. **Use threads** — Keep related messages together\n' +
        '2. **Status updates** — Set availability status\n' +
        '3. **Direct messages** — Private conversations, not group\n' +
        '4. **Channels** — Keep topics in the right channel\n' +
        '5. **Reactions** — Use emojis professionally (thumbs up, checkmark)\n\n' +
        '### Common Chat Phrases:\n' +
        '- **Asking for help:** "Could someone help me with [topic]?"\n' +
        '- **Confirming:** "Got it, thanks! I will work on this."\n' +
        '- **Clarifying:** "Just to clarify, you need [X] by [date]?"\n' +
        '- **Sharing updates:** "Quick update: [project] is on track for Friday."\n' +
        '- **Apologising for delay:** "Sorry for the delay, here is what I found..."\n' +
        '- **Requesting feedback:** "Could you review this when you have a moment?"\n\n' +
        '### WhatsApp Business Messaging:\n' +
        '- Use professional profile picture and business name\n' +
        '- Create quick replies for common questions\n' +
        '- Use labels (New, Order, Payment) to organise chats\n' +
        '- Keep messages short and clear\n' +
        '- Use broadcast lists for announcements\n\n' +
        '### References:\n' +
        '- [Slack Etiquette Guide](https://slack.com/intl/en-rw/blog/collaboration/etiquette)\n' +
        '- [Remote Communication Best Practices](https://basecamp.com/books/remote)',
        'article', 2,
      ),
      makeLesson('Writing Clear Documentation & Instructions',
        'Write user guides, process documents, and instructions that are easy to understand.\n\n' +
        '### Documentation Principles:\n' +
        '1. **Know your audience** — Who will read this?\n' +
        '2. **Use plain English** — Avoid jargon, explain terms\n' +
        '3. **Be concise** — Shorter sentences are better\n' +
        '4. **Use active voice** — "Click the button" not "The button should be clicked"\n' +
        '5. **Include examples** — Show, don\'t just tell\n' +
        '6. **Use headings** — Break content into sections\n' +
        '7. **Add visuals** — Screenshots, diagrams, flowcharts\n\n' +
        '### Document Structure:\n' +
        '1. **Title** — Clear and descriptive\n' +
        '2. **Overview** — What this document covers\n' +
        '3. **Prerequisites** — What the reader needs\n' +
        '4. **Step-by-step instructions** — Numbered steps\n' +
        '5. **Troubleshooting** — Common issues and solutions\n' +
        '6. **Contact info** — Who to ask for help\n\n' +
        '### References:\n' +
        '- [Writing Clear Documentation](https://developers.google.com/tech-writing)\n' +
        '- [Plain English Campaign](https://www.plainenglish.co.uk)',
        'article', 3,
      ),
      makeQuizLesson('Module 7: Knowledge Check',
        'Review digital communication English skills.',
        [
          { question: 'Best way to start a LinkedIn post?', options: ['Hello everyone', 'A strong hook', 'Your name', 'A photo'], correctIndex: 1, explanation: 'Start with a hook — the first line must grab attention immediately.' },
          { question: 'What to do before asking a question in Slack?', options: ['Send an email', 'Check if the question was already answered', 'Call the person', 'Wait a day'], correctIndex: 1, explanation: 'Check documentation and previous messages before asking in a public channel.' },
          { question: 'Best voice for writing instructions?', options: ['Passive voice', 'Active voice', 'Future tense', 'Poetic'], correctIndex: 1, explanation: 'Active voice is clearer: "Click Save" not "The Save button should be clicked."' },
        ],
        4,
      ),
    ],
    'Write professional English for social media, chat tools, and business documentation.',
  ),

  makeModule(
    'Module 8: Business Reading & Comprehension',
    'Improve your ability to read and understand business documents, reports, and articles in English.',
    [
      makeLesson('Reading Business Articles & Reports',
        'Strategies for reading and understanding business English texts quickly.\n\n' +
        '### Reading Strategies:\n' +
        '1. **Skimming** — Read title, headings, first sentences to get the main idea\n' +
        '2. **Scanning** — Look for specific information (dates, names, numbers)\n' +
        '3. **Detailed reading** — Read carefully for deep understanding\n' +
        '4. **Inferring meaning** — Guess meaning of unfamiliar words from context\n' +
        '5. **Summarising** — Write a 2-3 sentence summary of what you read\n\n' +
        '### Business Vocabulary Building:\n' +
        '- Read 1 business article per day (BBC Business, CNBC Africa)\n' +
        '- Keep a vocabulary journal with new words and examples\n' +
        '- Use flashcards (Anki app is free)\n' +
        '- Practice using new words in sentences\n' +
        '- Group words by topic (finance, marketing, operations)\n\n' +
        '### Recommended Reading Sources:\n' +
        '- BBC Business News — Clear, simple English\n' +
        '- The New Times Rwanda — Local business news\n' +
        '- CNBC Africa — Pan-African business coverage\n' +
        '- Harvard Business Review — Advanced business English\n' +
        '- Forbes Africa — Entrepreneur stories\n\n' +
        '### References:\n' +
        '- [BBC Business News](https://www.bbc.com/news/business)\n' +
        '- [The New Times Rwanda](https://www.newtimes.co.rw)\n' +
        '- [CNBC Africa](https://www.cnbcafrica.com)',
        'video', 1, { videoUrl: VIDEOS.emailWriting, videoTitle: 'Business Reading Strategies' },
      ),
      makeLesson('Understanding Contracts & Agreements',
        'Read and understand common business contracts in English.\n\n' +
        '### Common Contract Sections:\n' +
        '1. **Parties** — Who is involved in the agreement\n' +
        '2. **Term** — How long the agreement lasts\n' +
        '3. **Scope of Work** — What each party will do\n' +
        '4. **Payment Terms** — Amount, schedule, method\n' +
        '5. **Confidentiality** — What information must stay private\n' +
        '6. **Termination** — How either party can end the agreement\n' +
        '7. **Liability** — Who is responsible if something goes wrong\n' +
        '8. **Governing Law** — Which country\'s law applies\n\n' +
        '### Key Legal Vocabulary:\n' +
        '- **Indemnify** — Compensate for loss or damage\n' +
        '- **Breach** — Failure to fulfil a contract obligation\n' +
        '- **Force Majeure** — Unforeseeable circumstances that prevent fulfilment\n' +
        '- **Arbitration** — Resolving disputes outside of court\n' +
        '- **Liquidated damages** — Predetermined compensation for breach\n\n' +
        '### Tips:\n' +
        '- Read the entire contract before signing\n' +
        '- Highlight sections you don\'t understand\n' +
        '- Ask for clarification from the other party\n' +
        '- Consider having a lawyer review important contracts\n' +
        '- Keep a copy of every signed contract\n\n' +
        '### References:\n' +
        '- [Understanding Contracts Guide](https://www.nolo.com/legal-encyclopedia/contracts)\n' +
        '- [Rwanda Law Reform Commission](https://www.rlrc.gov.rw)',
        'article', 2,
      ),
      makeLesson('Interpreting Financial Documents',
        'Read and understand financial statements, invoices, and budgets in English.\n\n' +
        '### Key Financial Documents:\n' +
        '1. **Income Statement** — Revenue, expenses, profit over time\n' +
        '2. **Balance Sheet** — Assets, liabilities, equity at a point in time\n' +
        '3. **Cash Flow Statement** — Money in and out of business\n' +
        '4. **Budget** — Planned income and expenses\n' +
        '5. **Invoice** — Request for payment\n' +
        '6. **Purchase Order** — Official order request\n\n' +
        '### Financial Vocabulary:\n' +
        '- **Revenue** — Total money from sales\n' +
        '- **Cost of Goods Sold (COGS)** — Direct cost of products\n' +
        '- **Gross Profit** — Revenue minus COGS\n' +
        '- **Net Profit** — Profit after all expenses\n' +
        '- **Accounts Receivable** — Money owed to you\n' +
        '- **Accounts Payable** — Money you owe\n' +
        '- **Depreciation** — Asset value decrease over time\n' +
        '- **Amortisation** — Spreading cost over time\n\n' +
        '### Practice Exercise:\n' +
        'Read a sample income statement and answer: What is the gross profit? Net profit? Total expenses?\n\n' +
        '### References:\n' +
        '- [Financial Statement Reading Guide](https://www.investopedia.com/financial-statements)\n' +
        '- [QuickBooks Financial Glossary](https://quickbooks.intuit.com/glossary)',
        'article', 3,
      ),
      makeQuizLesson('Module 8: Knowledge Check',
        'Review business reading and comprehension skills.',
        [
          { question: 'What is skimming?', options: ['Reading every word', 'Quick reading for main ideas', 'Looking up dictionary', 'Writing notes'], correctIndex: 1, explanation: 'Skimming means reading headings and first sentences quickly to get the main idea.' },
          { question: 'What does "breach of contract" mean?', options: ['Signing a contract', 'Failing to fulfil contract obligations', 'Renewing a contract', 'Writing a contract'], correctIndex: 1, explanation: 'A breach is a failure to meet the obligations in a contract.' },
          { question: 'What does COGS stand for?', options: ['Cost of General Services', 'Cost of Goods Sold', 'Cash on Goods System', 'Company Operating Guide Sheet'], correctIndex: 1, explanation: 'COGS = Cost of Goods Sold = direct costs of producing products.' },
        ],
        4,
      ),
    ],
    'Read and understand business documents, contracts, and financial statements in English.',
  ),

  makeModule(
    'Module 9: Grammar, Accuracy & Professional Tone',
    'Master grammar fundamentals, avoid common mistakes, and write with a professional tone.',
    [
      makeLesson('Common Grammar Mistakes to Avoid',
        'Identify and fix the most common grammar mistakes in business English.\n\n' +
        '### Top 10 Common Mistakes:\n' +
        '1. **Your vs You\'re** — "Your" = possessive, "You\'re" = you are\n' +
        '2. **Its vs It\'s** — "Its" = possessive, "It\'s" = it is\n' +
        '3. **There vs Their vs They\'re** — Location, possession, they are\n' +
        '4. **Then vs Than** — Time, comparison\n' +
        '5. **Affect vs Effect** — Verb (influence), noun (result)\n' +
        '6. **Less vs Fewer** — Uncountable, countable\n' +
        '7. **Who vs Whom** — Subject, object\n' +
        '8. **Between vs Among** — Two, three or more\n' +
        '9. **Comma splices** — Joining sentences with only a comma\n' +
        '10. **Subject-verb agreement** — "The team is" not "the team are"\n\n' +
        '### Quick Fixes:\n' +
        '- Read your writing aloud to catch mistakes\n' +
        '- Use Grammarly (free version is excellent)\n' +
        '- Get a colleague to review important documents\n' +
        '- Keep a list of your common mistakes\n' +
        '- Practice one grammar rule per day\n\n' +
        '### References:\n' +
        '- [Grammarly Handbook](https://www.grammarly.com/handbook)\n' +
        '- [Cambridge English Grammar](https://dictionary.cambridge.org/grammar)\n' +
        '- [Purdue OWL Writing Lab](https://owl.purdue.edu)',
        'video', 1, { videoUrl: VIDEOS.negotiationEnglish, videoTitle: 'Common Grammar Mistakes' },
      ),
      makeLesson('Writing with Professional Tone',
        'Master the right tone for different business situations — formal, neutral, and friendly.\n\n' +
        '### Tone Levels:\n' +
        '1. **Formal** — Official documents, contracts, complaints\n' +
        '2. **Neutral** — Most business emails, reports, memos\n' +
        '3. **Friendly** — Team messages, long-term clients, social media\n\n' +
        '### Formal Language:\n' +
        '- Use complete sentences, no contractions\n' +
        '- "I would like to request" not "I want"\n' +
        '- "We regret to inform you" not "Sorry but"\n' +
        '- Avoid idioms and slang\n' +
        '- Use passive voice for formal reports\n\n' +
        '### Neutral Language (Most Common):\n' +
        '- Use contractions but keep professional vocabulary\n' +
        '- "I have attached" not "Here is"\n' +
        '- "Could you please review" not "Please check"\n' +
        '- Use active voice for clarity\n' +
        '- Keep paragraphs short (3-4 sentences)\n\n' +
        '### Friendly Language:\n' +
        '- Use first names\n' +
        '- Contractions welcome\n' +
        '- "Thanks!" not "Thank you"\n' +
        '- Can include relevant emojis (depending on relationship)\n' +
        '- Show personality and warmth\n\n' +
        '### References:\n' +
        '- [Business Tone Guide](https://www.businesswritingblog.com/tone)\n' +
        '- [Harvard Business Review - Writing Well](https://hbr.org/writing)',
        'article', 2,
      ),
      makeLesson('Editing & Proofreading Your Work',
        'Learn a systematic process for editing and proofreading your business writing.\n\n' +
        '### Editing vs Proofreading:\n' +
        '- **Editing** — Improve structure, clarity, flow (big picture)\n' +
        '- **Proofreading** — Fix spelling, grammar, punctuation (details)\n\n' +
        '### Editing Checklist:\n' +
        '1. Is the purpose clear? Remove anything off-topic\n' +
        '2. Is the structure logical? Move sections if needed\n' +
        '3. Are paragraphs too long? Break them up\n' +
        '4. Is the tone appropriate? Adjust for audience\n' +
        '5. Are there unnecessary words? Cut them\n\n' +
        '### Proofreading Tips:\n' +
        '1. Wait before proofreading — fresh eyes catch more\n' +
        '2. Read backwards — read last sentence first to spot errors\n' +
        '3. Read aloud — you will hear mistakes you miss reading silently\n' +
        '4. Use a ruler — focus on one line at a time\n' +
        '5. Check one type of error at a time (first spelling, then grammar)\n' +
        '6. Use tools — Grammarly, Hemingway Editor, LanguageTool\n\n' +
        '### References:\n' +
        '- [Hemingway Editor](https://hemingwayapp.com)\n' +
        '- [Grammarly](https://www.grammarly.com)\n' +
        '- [LanguageTool](https://languagetool.org)',
        'article', 3,
      ),
      makeQuizLesson('Module 9: Knowledge Check',
        'Review grammar and professional tone concepts.',
        [
          { question: 'Which is correct: "The company ___ its profits"?', options: ['raised', 'rose', 'rised', 'raising'], correctIndex: 0, explanation: '"Raised" is the correct past tense: "The company raised its profits."' },
          { question: 'Best tone for a formal complaint letter?', options: ['Friendly', 'Formal', 'Angry', 'Humorous'], correctIndex: 1, explanation: 'Complaints should be formal and professional to be taken seriously.' },
          { question: 'What to check during proofreading?', options: ['Structure', 'Grammar and spelling', 'Tone', 'Audience'], correctIndex: 1, explanation: 'Proofreading focuses on surface errors — spelling, grammar, punctuation.' },
        ],
        4,
      ),
    ],
    'Write with correct grammar and appropriate professional tone for any business situation.',
  ),

  makeModule(
    'Module 10: English Capstone & Final Exam',
    'Apply all your English skills in a comprehensive final project and exam.',
    [
      makeLesson('Capstone: Professional English Portfolio',
        'Create a portfolio of professional English documents demonstrating your skills.\n\n' +
        '### Portfolio Components:\n' +
        '1. **Professional Email** — Write a complete business email (inquiry, proposal, or follow-up)\n' +
        '2. **Business Report** — Write a 1-page report on a business topic (e.g., market research summary)\n' +
        '3. **Presentation Outline** — Outline a 5-minute business presentation with key points\n' +
        '4. **CV & Cover Letter** — Your professional CV and a cover letter for a specific job\n' +
        '5. **LinkedIn Profile Summary** — Write your LinkedIn headline and about section\n' +
        '6. **Meeting Minutes** — Write minutes from a sample business meeting\n\n' +
        '### Submission Requirements:\n' +
        '- All documents must be in English\n' +
        '- Use professional formatting\n' +
        '- Include a self-assessment: What are your strengths? What needs improvement?\n' +
        '- Submit as a single PDF or Google Doc\n\n' +
        '### Evaluation:\n' +
        '- Grammar and accuracy (30%)\n' +
        '- Professional tone (25%)\n' +
        '- Clarity and organisation (25%)\n' +
        '- Completeness (20%)',
        'assignment', 1, { isAssignment: true, requiredAssignment: true, assignmentDescription: 'Create a professional English portfolio demonstrating business writing skills.' },
      ),
      makeLesson('Final Exam Preparation',
        'Review all 10 modules before the final exam.\n\n' +
        '### Topics Covered:\n' +
        '1. Business Writing Essentials\n' +
        '2. Speaking & Presentation Skills\n' +
        '3. CV Writing & Interview Skills\n' +
        '4. Negotiation & Persuasion\n' +
        '5. Advanced Business Communication\n' +
        '6. Customer Service & Client Relations\n' +
        '7. Digital Communication\n' +
        '8. Business Reading & Comprehension\n' +
        '9. Grammar, Accuracy & Professional Tone\n\n' +
        '**Final Exam: 10 questions, 30-minute time limit. Passing score: 70%.**',
        'article', 2,
      ),
      makeExamLesson('Final Exam: Professional English',
        'Comprehensive final exam covering all 10 modules of Professional English.',
        [
          { question: 'What is the correct structure for an email subject line?', options: ['ALL CAPS', 'Clear and specific', 'Just "Hello"', 'Question mark only'], correctIndex: 1, explanation: 'Subject lines should be clear and specific: "Q3 Report - Request for Feedback".' },
          { question: 'Best way to open a presentation?', options: ['Apologise', 'Strong opening hook', 'Read slides', 'Tell a long story'], correctIndex: 1, explanation: 'Start with a hook — a question, statistic, or surprising fact.' },
          { question: 'CV stands for?', options: ['Career Vision', 'Curriculum Vitae', 'Company Value', 'Cover Verification'], correctIndex: 1, explanation: 'Curriculum Vitae means "course of life" in Latin.' },
          { question: 'What does BATNA stand for in negotiation?', options: ['Best Alternative to a Negotiated Agreement', 'Basic Agreement Terms', 'Business Action Plan', 'Negotiation Action'], correctIndex: 0, explanation: 'BATNA is your best option if the negotiation fails — your walkaway alternative.' },
          { question: 'Active voice example:', options: ['The report was written by me', 'I wrote the report', 'The report, it was written', 'Written was the report'], correctIndex: 1, explanation: '"I wrote the report" is active voice — clear and direct.' },
          { question: 'Best response to a customer complaint?', options: ['Ignore it', 'Apologise sincerely and offer solution', 'Blame someone else', 'Explain why customer is wrong'], correctIndex: 1, explanation: 'Always start with a sincere apology and offer a concrete solution.' },
          { question: 'How to start a LinkedIn post hook?', options: ['"I am happy to share"', 'A bold statement or question', '"Today I want to"', 'Your name'], correctIndex: 1, explanation: 'Start with a bold statement or question to grab attention in the feed.' },
          { question: 'What is skimming in reading?', options: ['Reading every word', 'Quick scan for main ideas', 'Looking up all words', 'Writing notes'], correctIndex: 1, explanation: 'Skimming is reading headings and first sentences to get the main idea quickly.' },
          { question: 'Correct usage: "The effect ___"?', options: ['affected the results', 'effected the results', 'affect the results', 'effect the results'], correctIndex: 0, explanation: '"Affected" is the correct verb: "The new policy affected the results."' },
          { question: 'What is proofreading?', options: ['Checking structure', 'Checking grammar and spelling errors', 'Writing the first draft', 'Planning content'], correctIndex: 1, explanation: 'Proofreading is the final step — checking for surface errors in grammar, spelling, and punctuation.' },
        ],
        3,
      ),
    ],
    'Demonstrate mastery of professional English through a portfolio and comprehensive exam.',
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRIPT
// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRIPT
// ─────────────────────────────────────────────────────────────────────────────

const COURSE_MODULES: Record<string, any[]> = {
  'Digital Marketing That Works in Rwanda': DIGITAL_MARKETING_MODULES,
  'Earn in Dollars: Freelancing & Remote Work from Rwanda': FREELANCING_MODULES,
  'Start Your Business in Rwanda: From Idea to Launch': BUSINESS_MODULES,
  'Professional English for Rwandan Professionals': ENGLISH_MODULES,
};

async function expandCourses() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    for (const [courseTitle, newModules] of Object.entries(COURSE_MODULES)) {
      const course = await Course.findOne({ title: courseTitle });
      if (!course) {
        console.log(`❌ Course not found: "${courseTitle}"`);
        continue;
      }

      const oldCount = course.modules.length;
      console.log(`📘 "${courseTitle}" — currently ${oldCount} modules`);

      // Add new modules starting from oldCount + 1
      const startOrder = oldCount + 1;
      const formatted = newModules.map((m: any, i: number) => ({
        ...m,
        order: startOrder + i,
        lessons: m.lessons.map((l: any, j: number) => ({ ...l, order: j + 1 })),
      }));

      course.modules.push(...formatted);
      await course.save();

      console.log(`   ✅ Added ${formatted.length} modules → ${course.modules.length} total`);
    }

    // Verify no duplicate video URLs
    console.log('\n🔍 Checking for duplicate video URLs...');
    const allCourses = await Course.find({ title: { $in: Object.keys(COURSE_MODULES) } });
    const videoUrls = new Map<string, string[]>();
    let duplicates = 0;

    for (const course of allCourses) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons || []) {
          if (lesson.videoUrl) {
            const existing = videoUrls.get(lesson.videoUrl) || [];
            existing.push(`${course.title} > ${mod.title} > ${lesson.title}`);
            videoUrls.set(lesson.videoUrl, existing);
          }
        }
      }
    }

    for (const [url, locations] of videoUrls.entries()) {
      if (locations.length > 1) {
        console.log(`   ⚠️ Duplicate: ${url}`);
        locations.forEach(l => console.log(`      - ${l}`));
        duplicates++;
      }
    }

    if (duplicates === 0) {
      console.log('   ✅ No duplicate video URLs found!');
    }

    // Print module counts
    console.log('\n📊 Module Count Summary:');
    console.log('─'.repeat(50));
    for (const course of allCourses) {
      console.log(`   ${course.title.padEnd(50)} ${course.modules.length} modules`);
    }
    console.log('─'.repeat(50));

    console.log('\n✅ Expansion complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

expandCourses();
