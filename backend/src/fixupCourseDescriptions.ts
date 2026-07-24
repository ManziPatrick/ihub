/**
 * ─────────────────────────────────────────────────────────
 * FIXUP: Course Descriptions — Toolbox Tables, No Emojis, Resources
 * ─────────────────────────────────────────────────────────
 * 1. Updates ALL courses with toolbox-table style descriptions
 * 2. Removes emoji icons from all descriptions
 * 3. Adds resources (videos, links, PDFs) to lessons
 * 4. Applies consistent format across African market, MVP, free courses
 *
 * Usage: npx ts-node src/fixupCourseDescriptions.ts
 * ─────────────────────────────────────────────────────────
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Helper: Remove emojis from a string ─────────────────
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // transport & map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')  // flags
    .replace(/[\u{2700}-\u{27BF}]/gu, '')     // dingbats
    .replace(/[\u{2600}-\u{26FF}]/gu, '')     // misc symbols
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')     // variation selectors
    .replace(/\u{200D}/gu, '')                // zero width joiner
    .replace(/[\u{25AA}-\u{25FE}]/gu, '')     // geometric shapes
    .replace(/\u{2B50}/gu, '')                // star
    .replace(/\u{2934}\u{2935}/gu, '')        // arrows
    .trim();
}

// ─── Toolbox table HTML builder ──────────────────────────
function makeToolboxTable(title: string, rows: { tool: string; purpose: string; cost: string; signup: string }[]): string {
  let html = `<h3>Your ${title} Toolbox</h3>\n<table>\n<thead><tr><th>Tool</th><th>Purpose</th><th>Cost</th><th>Sign Up</th></tr></thead>\n<tbody>\n`;
  for (const row of rows) {
    html += `<tr><td>${row.tool}</td><td>${row.purpose}</td><td>${row.cost}</td><td><a href="${row.signup}" target="_blank" rel="noopener">${row.signup.replace('https://', '')}</a></td></tr>\n`;
  }
  html += `</tbody>\n</table>`;
  return html;
}

// ─── Course descriptions with toolbox tables (no emojis) ──

const FASHION_DESCRIPTION = `African fashion is having a global moment -- and Rwanda is at the center of it. From traditional Kitenge fabrics to modern couture, the fashion industry in Rwanda offers huge opportunities for creative entrepreneurs.

This course teaches you how to start and grow a fashion business in Rwanda -- whether you are a tailor, designer, fabric trader, or someone who wants to launch a clothing brand. Learn to design, produce, market, and sell fashion products locally and internationally.

**What You Will Learn**
- Fashion Design Basics -- Sketching, pattern making, sewing techniques
- Sourcing Fabrics -- Kitenge, cotton, linen -- where to buy in Rwanda and import
- Production -- Tailoring, quality control, scaling production
- Brand Building -- Creating your fashion brand identity
- Marketing -- Selling on Instagram, at markets, to boutiques
- Business Management -- Pricing, customers, finances, growth

${makeToolboxTable('Fashion Business', [
  { tool: 'Canva', purpose: 'Design logos, lookbooks, social media graphics', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'Instagram', purpose: 'Showcase your designs, attract customers', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'WhatsApp Business', purpose: 'Customer orders, inquiries', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
  { tool: 'Etsy', purpose: 'Sell to international customers', cost: '$0.20/listing', signup: 'https://www.etsy.com' },
  { tool: 'Jumia Fashion', purpose: 'Sell clothes online in Rwanda', cost: 'Commission', signup: 'https://www.jumia.co.rw' },
  { tool: 'Sewing Machine', purpose: 'Basic production equipment', cost: '200,000-800,000 RWF', signup: 'Local suppliers' },
  { tool: 'Kimironko Market', purpose: 'Fabric shopping in Kigali', cost: 'Cash', signup: 'Visit in person' },
  { tool: 'PayPal', purpose: 'Receive international payments', cost: '2.9% + $0.30', signup: 'https://www.paypal.com' },
])}`;

const HEALTH_DESCRIPTION = `Rwanda healthcare sector is growing rapidly -- with government investment in universal health coverage, a growing middle class willing to pay for quality care, and increasing demand for wellness services (fitness, nutrition, mental health).

This course teaches you how to start a health or wellness business in Rwanda. Whether you want to open a clinic, start a fitness center, offer nutrition coaching, or launch a health product brand -- this course gives you practical, locally-relevant guidance.

**What You Will Learn**
- Healthcare Business -- Opening a clinic, pharmacy, or diagnostic center
- Fitness & Wellness -- Starting a gym, fitness coaching, yoga studio
- Nutrition Business -- Meal planning, healthy food delivery, supplements
- Mental Health -- Counseling services, wellness coaching
- Health Products -- Natural soaps, essential oils, herbal remedies
- Regulations -- Ministry of Health licensing, Rwanda Medical Council, standards

${makeToolboxTable('Health Business', [
  { tool: 'Ministry of Health', purpose: 'Healthcare facility licensing', cost: 'Free info', signup: 'https://www.moh.gov.rw' },
  { tool: 'Rwanda Medical Council', purpose: 'Professional licensing', cost: 'Varies', signup: 'https://www.rwandamedicalcouncil.rw' },
  { tool: 'RDB', purpose: 'Company registration', cost: '35,000 RWF', signup: 'https://rdb.rw' },
  { tool: 'RSB', purpose: 'Product certification', cost: 'Varies', signup: 'https://www.rsb.gov.rw' },
  { tool: 'WhatsApp Business', purpose: 'Client communication', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
  { tool: 'Instagram', purpose: 'Fitness/wellness marketing', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'MyFitnessPal', purpose: 'Nutrition tracking app', cost: 'Free', signup: 'https://www.myfitnesspal.com' },
  { tool: 'MoMo Merchant', purpose: 'Payment collection', cost: '0.5-1% fee', signup: 'https://www.mtn.co.rw' },
])}`;

const HOSPITALITY_DESCRIPTION = `Rwanda is one of Africa's fastest-growing tourism destinations. From the Volcanoes National Park and gorilla trekking to luxury lakeside resorts and business tourism in Kigali, the hospitality sector offers massive opportunities.

This course teaches you how to start and run a successful hospitality or tourism business in Rwanda. Whether you want to open a lodge, start a tour company, run a restaurant, or offer cultural experiences -- you will learn practical, locally-relevant skills.

**What You Will Learn**
- Tourism Industry -- Understanding Rwanda's tourism ecosystem
- Hospitality Operations -- Running lodges, hotels, restaurants
- Tour Guiding -- Becoming a professional guide or tour operator
- Cultural Tourism -- Community tours, craft villages, cultural experiences
- Marketing -- Reaching tourists locally and internationally
- Business Management -- Pricing, bookings, customer service, growth

${makeToolboxTable('Hospitality & Tourism', [
  { tool: 'RDB', purpose: 'Business registration and tourism license', cost: '35,000 RWF', signup: 'https://rdb.rw' },
  { tool: 'Rwanda Development Board', purpose: 'Tourism marketing and support', cost: 'Free', signup: 'https://www.rdb.rw' },
  { tool: 'Booking.com', purpose: 'List your accommodation globally', cost: '15% commission', signup: 'https://www.booking.com' },
  { tool: 'TripAdvisor', purpose: 'Get reviews and attract tourists', cost: 'Free', signup: 'https://www.tripadvisor.com' },
  { tool: 'Instagram', purpose: 'Showcase your property and destination', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'WhatsApp Business', purpose: 'Booking inquiries and guest communication', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
  { tool: 'SABRE', purpose: 'Global distribution system for travel agents', cost: 'Subscription', signup: 'https://www.sabre.com' },
  { tool: 'MoMo Merchant', purpose: 'Receive deposits and payments', cost: '0.5-1% fee', signup: 'https://www.mtn.co.rw' },
])}`;

const ECOMMERCE_DESCRIPTION = `E-commerce is exploding in Rwanda. With increasing smartphone adoption, mobile money penetration, and a young population eager to shop online, there has never been a better time to start an online store.

This course teaches you how to start and grow an e-commerce business in Rwanda. From choosing what to sell to setting up your online store, processing payments, and delivering products -- you will learn everything you need to succeed.

**What You Will Learn**
- E-Commerce Platforms -- Shopify, WooCommerce, Jumia, social commerce
- Product Sourcing -- Finding products to sell (local and import)
- Store Setup -- Building your online store step by step
- Payments -- Mobile money, credit cards, cash on delivery
- Marketing -- Social media, Google ads, influencer marketing
- Delivery & Logistics -- Shipping within Rwanda and internationally
- Customer Service -- Handling inquiries, returns, and building trust

${makeToolboxTable('E-Commerce', [
  { tool: 'Shopify', purpose: 'Build your online store', cost: '$29/month', signup: 'https://www.shopify.com' },
  { tool: 'WooCommerce', purpose: 'Free WordPress e-commerce plugin', cost: 'Free', signup: 'https://woocommerce.com' },
  { tool: 'Jumia', purpose: 'Sell on Africa\'s largest marketplace', cost: 'Commission', signup: 'https://seller.jumia.co.rw' },
  { tool: 'MoMo Merchant', purpose: 'Mobile money payment collection', cost: '0.5-1% fee', signup: 'https://www.mtn.co.rw' },
  { tool: 'Instagram Shopping', purpose: 'Sell directly on Instagram', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'Canva', purpose: 'Design product images and ads', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'DHL/FedEx', purpose: 'International shipping', cost: 'Varies by weight', signup: 'https://www.dhl.com' },
  { tool: 'SafeBoda/Yego', purpose: 'Local delivery in Kigali', cost: 'Per delivery', signup: 'Download app' },
])}`;

const SOLAR_DESCRIPTION = `Solar energy is transforming Rwanda. With government targets to achieve universal electricity access and ambitious renewable energy goals, the solar industry is booming. From home solar systems to commercial installations, opportunities abound.

This course teaches you how to start and grow a solar energy business in Rwanda. Whether you want to install home solar systems, supply solar equipment, or develop commercial solar projects -- you will gain practical, market-ready skills.

**What You Will Learn**
- Solar Fundamentals -- How solar panels, batteries, and inverters work
- System Design -- Sizing solar systems for homes and businesses
- Installation -- Mounting panels, wiring, safety procedures
- Business Setup -- Registration, licensing, supplier relationships
- Sales & Marketing -- Finding customers, quoting, closing deals
- After-Sales Service -- Maintenance, troubleshooting, customer support

${makeToolboxTable('Solar Energy', [
  { tool: 'RDB', purpose: 'Company registration and business license', cost: '35,000 RWF', signup: 'https://rdb.rw' },
  { tool: 'RURA', purpose: 'Energy sector regulatory compliance', cost: 'Varies', signup: 'https://www.rura.rw' },
  { tool: 'REMA', purpose: 'Environmental compliance and permits', cost: 'Free', signup: 'https://www.rema.gov.rw' },
  { tool: 'Alibaba/AliExpress', purpose: 'Source solar panels and components', cost: 'Market price', signup: 'https://www.alibaba.com' },
  { tool: 'WhatsApp Business', purpose: 'Customer inquiries and quotes', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
  { tool: 'Instagram', purpose: 'Showcase installations and attract customers', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'PVsyst', purpose: 'Solar system design and simulation', cost: 'Free trial', signup: 'https://www.pvsyst.com' },
  { tool: 'Excel/Sheets', purpose: 'Cost calculations and quotes', cost: 'Free', signup: 'https://sheets.google.com' },
])}`;

const MARKETING_DESCRIPTION = `Digital marketing is the most in-demand skill in Rwanda's growing economy. Businesses of all sizes need help reaching customers online through social media, search engines, email, and content marketing.

This course teaches you how to launch and grow a digital marketing career or agency in Rwanda. Learn practical strategies that work for Rwandan businesses -- from Kigali startups to rural cooperatives.

**What You Will Learn**
- Social Media Marketing -- Facebook, Instagram, TikTok, LinkedIn for business
- Search Engine Optimization -- Getting your website found on Google
- Content Marketing -- Creating videos, blogs, and posts that attract customers
- Email Marketing -- Building lists and sending campaigns
- Paid Advertising -- Google Ads and social media ads on a budget
- Analytics -- Measuring what works and improving results

${makeToolboxTable('Digital Marketing', [
  { tool: 'Meta Business Suite', purpose: 'Manage Facebook & Instagram ads', cost: 'Free', signup: 'https://business.facebook.com' },
  { tool: 'Google Analytics', purpose: 'Track website traffic and conversions', cost: 'Free', signup: 'https://analytics.google.com' },
  { tool: 'Canva', purpose: 'Design social media graphics and ads', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'Mailchimp', purpose: 'Email marketing campaigns', cost: 'Free up to 500 contacts', signup: 'https://mailchimp.com' },
  { tool: 'TikTok Business', purpose: 'Short-form video marketing', cost: 'Free', signup: 'https://www.tiktok.com/business' },
  { tool: 'Google Keyword Planner', purpose: 'Find keywords for SEO and ads', cost: 'Free', signup: 'https://ads.google.com' },
  { tool: 'Buffer', purpose: 'Schedule social media posts', cost: 'Free tier', signup: 'https://buffer.com' },
  { tool: 'WhatsApp Business', purpose: 'Client communication and broadcast', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
])}`;

const FREELANCE_DESCRIPTION = `Rwandans are earning in dollars through freelancing. With platforms like Upwork, Fiverr, and Toptal, you can offer your skills to clients worldwide and get paid in foreign currency. This is one of the fastest paths to financial independence.

This course teaches you how to start freelancing from Rwanda. Whether you are a developer, designer, writer, virtual assistant, or marketer -- you will learn exactly how to get your first client and build a sustainable freelance income.

**What You Will Learn**
- Freelance Platforms -- Upwork, Fiverr, Toptal, PeoplePerHour
- Profile Creation -- Building a profile that gets hired
- Finding Clients -- Proposals, bidding, networking
- Pricing -- Setting your rates in dollars for the Rwandan market
- Payments -- PayPal, Payoneer, Wise, bank transfers
- Client Management -- Communication, delivery, getting repeat business

${makeToolboxTable('Freelancing', [
  { tool: 'Upwork', purpose: 'Global freelance marketplace', cost: 'Free (20% fee on first $500)', signup: 'https://www.upwork.com' },
  { tool: 'Fiverr', purpose: 'Sell your services as gigs', cost: 'Free (20% commission)', signup: 'https://www.fiverr.com' },
  { tool: 'Payoneer', purpose: 'Receive international payments', cost: '1% fee', signup: 'https://www.payoneer.com' },
  { tool: 'PayPal', purpose: 'Receive payments from clients', cost: '2.9% + $0.30', signup: 'https://www.paypal.com' },
  { tool: 'Wise', purpose: 'Low-cost currency conversion', cost: '0.41% fee', signup: 'https://wise.com' },
  { tool: 'Grammarly', purpose: 'Professional writing and proofreading', cost: 'Free tier', signup: 'https://grammarly.com' },
  { tool: 'Toggl', purpose: 'Time tracking for hourly projects', cost: 'Free tier', signup: 'https://toggl.com' },
  { tool: 'Google Workspace', purpose: 'Professional email and documents', cost: 'Free', signup: 'https://workspace.google.com' },
])}`;

const BUSINESS_DESCRIPTION = `Rwanda is one of the easiest places in Africa to start a business. With the RDB's online registration system, you can register a company in hours. But starting is just the beginning -- you need a plan, resources, and market knowledge to succeed.

This course takes you from business idea to launch. Whether you want to open a small shop, start a service business, or build a tech startup -- you will learn the practical steps to start and grow in Rwanda.

**What You Will Learn**
- Idea Validation -- Testing if your business idea will work
- Business Registration -- RDB registration, taxes, licenses
- Business Planning -- Simple plan that guides your decisions
- Funding -- Savings, loans, grants, investors in Rwanda
- Operations -- Location, equipment, suppliers, staff
- Marketing & Sales -- Getting your first customers

${makeToolboxTable('Starting a Business', [
  { tool: 'RDB', purpose: 'Company registration and business license', cost: '35,000 RWF', signup: 'https://rdb.rw' },
  { tool: 'RRA', purpose: 'Tax registration and filing', cost: 'Free', signup: 'https://www.rra.gov.rw' },
  { tool: 'BDF', purpose: 'Business Development Fund (loans for SMEs)', cost: 'Interest applies', signup: 'https://www.bdf.rw' },
  { tool: 'MIFOTRA', purpose: 'Labor law compliance and employee registration', cost: 'Free', signup: 'https://www.mifotra.gov.rw' },
  { tool: 'Canva', purpose: 'Design logo, business cards, marketing materials', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'WhatsApp Business', purpose: 'Customer communication and orders', cost: 'Free', signup: 'https://www.whatsapp.com/business' },
  { tool: 'Google My Business', purpose: 'Get found on Google Maps and Search', cost: 'Free', signup: 'https://business.google.com' },
  { tool: 'Wave', purpose: 'Free accounting and invoicing', cost: 'Free', signup: 'https://www.waveapps.com' },
])}`;

const ENGLISH_DESCRIPTION = `Professional English opens doors to better jobs, higher salaries, and international opportunities. In Rwanda's growing economy, English proficiency is a key differentiator for career advancement.

This course helps Rwandan professionals improve their English for the workplace. Focus on business communication, writing professional emails, giving presentations, and speaking confidently in meetings.

**What You Will Learn**
- Business Vocabulary -- Key terms for your industry
- Email Writing -- Professional emails that get results
- Presentations -- Structuring and delivering presentations in English
- Meeting Skills -- Participating confidently in meetings
- CV & Interview -- English for job applications
- Everyday Business English -- Phones, small talk, negotiations

${makeToolboxTable('Professional English', [
  { tool: 'Duolingo', purpose: 'Daily English practice app', cost: 'Free', signup: 'https://www.duolingo.com' },
  { tool: 'Grammarly', purpose: 'Writing assistant for emails and documents', cost: 'Free tier', signup: 'https://grammarly.com' },
  { tool: 'YouTube', purpose: 'Free English lessons and business English content', cost: 'Free', signup: 'https://www.youtube.com' },
  { tool: 'BBC Learning English', purpose: 'Free structured English courses', cost: 'Free', signup: 'https://www.bbc.co.uk/learningenglish' },
  { tool: 'LinkedIn Learning', purpose: 'Professional development courses', cost: 'Free trial', signup: 'https://www.linkedin.com/learning' },
  { tool: 'Google Docs', purpose: 'Practice writing with spell check', cost: 'Free', signup: 'https://docs.google.com' },
  { tool: 'HelloTalk', purpose: 'Practice with native English speakers', cost: 'Free', signup: 'https://www.hellotalk.com' },
  { tool: 'Cambridge Dictionary', purpose: 'Look up words and pronunciation', cost: 'Free', signup: 'https://dictionary.cambridge.org' },
])}`;

const AGRICULTURE_DESCRIPTION = `Agriculture is the backbone of Rwanda's economy, employing over 60% of the population. Modern farming techniques, agri-tech solutions, and access to markets are transforming this sector.

This course teaches you how to start or improve a farming business in Rwanda. From traditional crops to modern greenhouses, from livestock to agri-tech -- learn practical skills for modern agriculture.

**What You Will Learn**
- Modern Farming -- Greenhouses, irrigation, soil management
- Crop Selection -- What to grow for maximum profit in Rwanda
- Livestock -- Cattle, goats, poultry, and pigs
- Agri-Tech -- Using technology to improve farming
- Market Access -- Selling to hotels, supermarkets, exporters
- Business Management -- Farm finances, record keeping, growth

${makeToolboxTable('Smart Farming', [
  { tool: 'MINAGRI', purpose: 'Agricultural policy and support programs', cost: 'Free', signup: 'https://www.minagri.gov.rw' },
  { tool: 'RAB', purpose: 'Rwanda Agriculture Board - research and extension', cost: 'Free', signup: 'https://www.rab.gov.rw' },
  { tool: 'One Acre Fund', purpose: 'Financing, training, and inputs for farmers', cost: 'Loan-based', signup: 'https://oneacrefund.org' },
  { tool: 'Weather Forecast', purpose: 'Plan planting and harvesting', cost: 'Free', signup: 'https://www.meteorwanda.gov.rw' },
  { tool: 'WhatsApp Groups', purpose: 'Connect with other farmers and buyers', cost: 'Free', signup: 'Download app' },
  { tool: 'Excel/Sheets', purpose: 'Track expenses, yields, and profits', cost: 'Free', signup: 'https://sheets.google.com' },
  { tool: 'YouTube', purpose: 'Learn farming techniques from experts', cost: 'Free', signup: 'https://www.youtube.com' },
  { tool: 'Mara Monsha', purpose: 'E-commerce platform for Rwandan farmers', cost: 'Free', signup: 'https://www.maramonsha.rw' },
])}`;

const CONTENT_CREATION_DESCRIPTION = `Content creation is one of the fastest ways for Rwandan youth to earn money online. From YouTube and TikTok to Instagram and podcasting -- you can build an audience and monetize your creativity.

This course teaches you how to become a content creator in Rwanda. Whether you want to make videos, write blogs, record podcasts, or create social media content -- you will learn practical steps to create, grow, and earn.

**What You Will Learn**
- Content Types -- Videos, photos, blogs, podcasts, social media
- Equipment -- Smartphone filming, microphones, lighting on a budget
- Platform Strategy -- YouTube, TikTok, Instagram, Spotify
- Content Planning -- Ideas, scheduling, consistency
- Growing an Audience -- Engagement, hashtags, collaborations
- Monetization -- Ads, sponsorships, products, services

${makeToolboxTable('Content Creation', [
  { tool: 'CapCut', purpose: 'Free video editing for TikTok and Reels', cost: 'Free', signup: 'Download app' },
  { tool: 'Canva', purpose: 'Design thumbnails, banners, and posts', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'YouTube Studio', purpose: 'Upload, manage, and monetize videos', cost: 'Free', signup: 'https://studio.youtube.com' },
  { tool: 'Instagram', purpose: 'Share photos, reels, and stories', cost: 'Free', signup: 'https://www.instagram.com' },
  { tool: 'TikTok', purpose: 'Short-form video creation and growth', cost: 'Free', signup: 'Download app' },
  { tool: 'Anchor/Spotify', purpose: 'Record and distribute podcasts', cost: 'Free', signup: 'https://anchor.fm' },
  { tool: 'Unsplash', purpose: 'Free high-quality images for content', cost: 'Free', signup: 'https://unsplash.com' },
  { tool: 'Buffer', purpose: 'Schedule social media posts', cost: 'Free tier', signup: 'https://buffer.com' },
])}`;

const PROJECT_MGMT_DESCRIPTION = `Project management skills are in high demand across every industry in Rwanda. From construction and IT to events and government projects -- professionals who can deliver projects on time and on budget are invaluable.

This course teaches you project management fundamentals with practical applications for the Rwandan context. Learn industry-standard methodologies and tools that will make you a valuable asset to any organization.

**What You Will Learn**
- Project Management Basics -- What is a project, project lifecycle
- Planning -- Scope, schedule, budget, resources
- Execution -- Leading teams, managing tasks, communication
- Monitoring -- Tracking progress, reporting, quality control
- Risk Management -- Identifying and mitigating risks
- Tools -- Trello, Asana, Microsoft Project, Jira

${makeToolboxTable('Project Management', [
  { tool: 'Trello', purpose: 'Visual task management with boards', cost: 'Free tier', signup: 'https://trello.com' },
  { tool: 'Asana', purpose: 'Project and task tracking for teams', cost: 'Free tier', signup: 'https://asana.com' },
  { tool: 'Google Sheets', purpose: 'Project plans, budgets, and schedules', cost: 'Free', signup: 'https://sheets.google.com' },
  { tool: 'Google Calendar', purpose: 'Schedule meetings and milestones', cost: 'Free', signup: 'https://calendar.google.com' },
  { tool: 'Slack', purpose: 'Team communication and collaboration', cost: 'Free tier', signup: 'https://slack.com' },
  { tool: 'Notion', purpose: 'All-in-one workspace for docs and projects', cost: 'Free tier', signup: 'https://notion.so' },
  { tool: 'ClickUp', purpose: 'Advanced project management with goals', cost: 'Free tier', signup: 'https://clickup.com' },
  { tool: 'Google Meet/Zoom', purpose: 'Virtual meetings with stakeholders', cost: 'Free', signup: 'https://meet.google.com' },
])}`;

const FINANCE_DESCRIPTION = `Financial independence is achievable for every Rwandan. With the right knowledge and discipline, you can build wealth regardless of your current income level.

This course teaches you practical personal finance and investing skills for the Rwandan context. From budgeting and saving to investing in stocks, real estate, and businesses -- learn how to make your money work for you.

**What You Will Learn**
- Personal Finance -- Budgeting, saving, emergency funds
- Investing -- Stocks, bonds, real estate, business
- Banking -- Savings accounts, fixed deposits, SACCOs
- Retirement Planning -- Ejo Heza, pension, long-term savings
- Wealth Building -- Multiple income streams, compound growth
- Risk Management -- Insurance, diversification, emergency planning

${makeToolboxTable('Personal Finance & Investing', [
  { tool: 'Ejo Heza', purpose: 'Rwanda\'s voluntary long-term savings scheme', cost: 'From 500 RWF/month', signup: 'https://www.ejoheza.rw' },
  { tool: 'Bank of Kigali', purpose: 'Savings accounts, fixed deposits, investments', cost: 'Varies', signup: 'https://www.bk.rw' },
  { tool: 'RSE', purpose: 'Rwanda Stock Exchange - buy and sell shares', cost: 'Broker fees apply', signup: 'https://www.rse.rw' },
  { tool: 'SACCO', purpose: 'Cooperative savings and loans', cost: 'Membership fee', signup: 'Local branch' },
  { tool: 'M-Savings', purpose: 'Mobile money savings account', cost: 'Free', signup: 'MTN MoMo app' },
  { tool: 'Excel/Sheets', purpose: 'Personal budget tracker', cost: 'Free', signup: 'https://sheets.google.com' },
  { tool: 'Mint', purpose: 'Personal finance tracking app', cost: 'Free', signup: 'https://mint.intuit.com' },
  { tool: 'Wave', purpose: 'Business accounting and invoicing', cost: 'Free', signup: 'https://www.waveapps.com' },
])}`;

const AI_DESCRIPTION = `Artificial Intelligence is transforming how we work, learn, and do business. From ChatGPT for customer service to AI-powered content creation and automation -- AI tools are creating new opportunities for Rwandans.

This course teaches you how to use AI tools practically. No coding required. Learn to leverage AI to be more productive, creative, and competitive in today's job market.

**What You Will Learn**
- ChatGPT & LLMs -- Writing prompts, getting useful answers
- AI for Content -- Creating articles, images, videos with AI
- AI for Business -- Customer service, data analysis, automation
- AI for Learning -- Using AI as a personal tutor
- AI Tools -- Canva AI, Notion AI, Grammarly, Midjourney
- Ethics & Limitations -- Understanding AI's strengths and weaknesses

${makeToolboxTable('AI & Automation', [
  { tool: 'ChatGPT', purpose: 'AI assistant for writing, research, problem-solving', cost: 'Free tier', signup: 'https://chat.openai.com' },
  { tool: 'Canva AI', purpose: 'AI-powered design and image generation', cost: 'Free tier', signup: 'https://www.canva.com' },
  { tool: 'Grammarly', purpose: 'AI writing assistant', cost: 'Free tier', signup: 'https://grammarly.com' },
  { tool: 'Notion AI', purpose: 'AI-powered notes and documents', cost: 'Free trial', signup: 'https://notion.so' },
  { tool: 'Perplexity AI', purpose: 'AI search engine with sources', cost: 'Free', signup: 'https://perplexity.ai' },
  { tool: 'Google Gemini', purpose: 'Google\'s AI assistant', cost: 'Free', signup: 'https://gemini.google.com' },
  { tool: 'Claude AI', purpose: 'AI assistant for analysis and writing', cost: 'Free tier', signup: 'https://claude.ai' },
  { tool: 'Bing Image Creator', purpose: 'AI image generation from text', cost: 'Free', signup: 'https://www.bing.com/create' },
])}`;

const MOBILEMONEY_DESCRIPTION = `Mobile money is the backbone of Rwanda's digital economy. With over 20 million mobile money accounts in Rwanda, understanding how to use, build with, and profit from mobile money is essential for any entrepreneur.

This course covers everything from basic mobile money usage to advanced fintech business models. Whether you want to use mobile money for your business or build a fintech solution, you will learn practical skills.

**What You Will Learn**
- Mobile Money Basics -- Sending, receiving, saving, borrowing
- Business Payments -- MoMo Merchant, Airtel Money Business
- Fintech Opportunities -- Building on mobile money APIs
- International Remittances -- Receiving money from abroad
- Mobile Money Agents -- Becoming a paid agent
- Security -- Avoiding fraud and keeping money safe

${makeToolboxTable('Mobile Money & Fintech', [
  { tool: 'MTN MoMo', purpose: 'Mobile money for payments, savings, loans', cost: 'Transaction fees apply', signup: 'Dial *182#' },
  { tool: 'Airtel Money', purpose: 'Airtel mobile money services', cost: 'Transaction fees apply', signup: 'Dial *500#' },
  { tool: 'MoMo Merchant', purpose: 'Accept payments from customers', cost: '0.5-1% per transaction', signup: 'https://www.mtn.co.rw' },
  { tool: 'BK MoMo', purpose: 'Bank of Kigali mobile banking', cost: 'Free', signup: 'Download BK App' },
  { tool: 'M-Savings', purpose: 'Earn interest on mobile money savings', cost: 'Free', signup: 'MTN MoMo app' },
  { tool: 'MoMoPesa', purpose: 'Mobile loans and credit', cost: 'Interest applies', signup: 'MTN MoMo app' },
  { tool: 'Wave', purpose: 'International money transfers', cost: 'Low fees', signup: 'https://www.wave.com' },
  { tool: 'WorldRemit', purpose: 'Receive money from abroad', cost: 'Low fees', signup: 'https://www.worldremit.com' },
])}`;

// ─── All course description updates ──────────────────────
interface CourseUpdate {
  title: string;           // Exact title or regex
  description: string;     // New description HTML
  toolboxTable?: string;   // Toolbox table HTML
}

const COURSE_UPDATES: { title: string; description: string }[] = [
  // ─── Fashion (exact match from user) ────────────
  { title: 'Fashion & Textile Business: From Tailor to Brand Owner in Rwanda', description: FASHION_DESCRIPTION },
  // ─── Health & Wellness ──────────────────────────
  { title: 'Health & Wellness Business: Clinics, Fitness & Healing in Rwanda', description: HEALTH_DESCRIPTION },
  // ─── Hospitality & Tourism ──────────────────────
  { title: 'Hospitality & Tourism in Rwanda: From Guide to Business Owner', description: HOSPITALITY_DESCRIPTION },
  // ─── E-Commerce ─────────────────────────────────
  { title: 'E-Commerce & Online Store: Sell Anything from Rwanda', description: ECOMMERCE_DESCRIPTION },
  // ─── Solar Energy ───────────────────────────────
  { title: 'Solar Energy Business: Power Rwanda with Renewable Energy', description: SOLAR_DESCRIPTION },
  // ─── MVP Courses ─────────────────────────────────
  { title: 'Digital Marketing That Works in Rwanda', description: MARKETING_DESCRIPTION },
  { title: 'Mobile Money Mastery: M-Pesa, MoMo & Fintech in Rwanda', description: MOBILEMONEY_DESCRIPTION },
  { title: 'Earn in Dollars: Freelancing & Remote Work from Rwanda', description: FREELANCE_DESCRIPTION },
  { title: 'Start Your Business in Rwanda: From Idea to Launch', description: BUSINESS_DESCRIPTION },
  { title: 'Professional English for Rwandan Professionals', description: ENGLISH_DESCRIPTION },
  { title: 'Smart Farming in Rwanda: AgriTech for Modern Farmers', description: AGRICULTURE_DESCRIPTION },
  { title: 'Create & Earn: Content Creation for Rwandan Youth', description: CONTENT_CREATION_DESCRIPTION },
  { title: 'Project Management for Rwandan Professionals', description: PROJECT_MGMT_DESCRIPTION },
  { title: 'Build Wealth: Personal Finance & Investing in Rwanda', description: FINANCE_DESCRIPTION },
  { title: 'AI for Rwandans: How to Use ChatGPT & Automation', description: AI_DESCRIPTION },
];

// ─── Add resources to each lesson in a course ────────────
function makeDefaultResources(title: string): { title: string; url: string; type: string }[] {
  const topic = title.toLowerCase();
  const resources: { title: string; url: string; type: string }[] = [];
  
  if (topic.includes('computer') || topic.includes('internet')) {
    resources.push({ title: 'Computer Basics PDF Guide', url: 'https://www.computerhope.com/htm/computer-basics.pdf', type: 'pdf' as const });
  }
  if (topic.includes('business') || topic.includes('entrepreneur') || topic.includes('finance')) {
    resources.push({ title: 'RDB Business Registration Guide', url: 'https://rdb.rw', type: 'link' as const });
  }
  if (topic.includes('market') || topic.includes('digital') || topic.includes('social')) {
    resources.push({ title: 'Meta Business Suite Guide', url: 'https://business.facebook.com', type: 'link' as const });
  }
  if (topic.includes('code') || topic.includes('program') || topic.includes('javascript') || topic.includes('python')) {
    resources.push({ title: 'W3Schools Tutorial', url: 'https://www.w3schools.com', type: 'link' as const });
    resources.push({ title: 'FreeCodeCamp Course', url: 'https://www.freecodecamp.org', type: 'link' as const });
  }
  if (topic.includes('english') || topic.includes('language')) {
    resources.push({ title: 'BBC Learning English', url: 'https://www.bbc.co.uk/learningenglish', type: 'link' as const });
  }
  if (topic.includes('agric') || topic.includes('farm')) {
    resources.push({ title: 'RAB Agricultural Guide', url: 'https://www.rab.gov.rw', type: 'link' as const });
  }
  if (topic.includes('health') || topic.includes('wellness') || topic.includes('fitness')) {
    resources.push({ title: 'Ministry of Health Rwanda', url: 'https://www.moh.gov.rw', type: 'link' as const });
  }
  if (topic.includes('fashion') || topic.includes('textile')) {
    resources.push({ title: 'Canva Design Tutorials', url: 'https://www.canva.com/learn', type: 'link' as const });
  }
  if (topic.includes('solar') || topic.includes('energy')) {
    resources.push({ title: 'RURA Energy Guidelines', url: 'https://www.rura.rw', type: 'link' as const });
  }
  if (topic.includes('hospitality') || topic.includes('tourism')) {
    resources.push({ title: 'RDB Tourism Guide', url: 'https://rdb.rw', type: 'link' as const });
  }
  if (topic.includes('freelance') || topic.includes('content') || topic.includes('create')) {
    resources.push({ title: 'Upwork Getting Started Guide', url: 'https://www.upwork.com/resources', type: 'link' as const });
  }
  if (topic.includes('project')) {
    resources.push({ title: 'Trello Project Management Guide', url: 'https://trello.com/guide', type: 'link' as const });
  }
  if (topic.includes('ai') || topic.includes('chatgpt') || topic.includes('automation')) {
    resources.push({ title: 'ChatGPT Guide for Beginners', url: 'https://help.openai.com', type: 'link' as const });
  }
  if (topic.includes('exam') || topic.includes('certif')) {
    resources.push({ title: 'Exam Preparation Tips', url: 'https://www.ets.org/toefl/test-takers', type: 'link' as const });
  }
  
  // Always add a video resource
  resources.push({ title: `Video: ${topic.substring(0, 40)} Tutorial`, url: 'https://www.youtube.com/results?search_query=Rwanda+' + encodeURIComponent(topic.substring(0, 30)), type: 'video' as const });
  
  return resources;
}

// ─── Main fixup ──────────────────────────────────────────
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('MONGO_URI not found'); process.exit(1); }

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log('Connected to MongoDB\n');

  // ═══════════════════════════════════════════════════════
  // STEP 1: Update course descriptions with toolbox tables
  // ═══════════════════════════════════════════════════════
  console.log('STEP 1: Updating course descriptions with toolbox tables');
  console.log('='.repeat(60));

  let updated = 0;
  let notFound: string[] = [];

  for (const c of COURSE_UPDATES) {
    const result = await db.collection('courses').updateOne(
      { title: { $regex: c.title.substring(0, 30), $options: 'i' } },
      { $set: { description: c.description } }
    );
    if (result.modifiedCount > 0 || result.matchedCount > 0) {
      console.log('  ' + c.title.substring(0, 55));
      updated++;
    } else {
      notFound.push(c.title);
      console.log('  NOT FOUND: ' + c.title.substring(0, 40));
    }
  }

  console.log('\nUpdated:', updated, 'courses');
  if (notFound.length > 0) {
    console.log('Not found:', notFound.length);
    notFound.forEach(t => console.log('  - ' + t));
  }

  // ═══════════════════════════════════════════════════════
  // STEP 2: Strip emojis from ALL course descriptions
  // ═══════════════════════════════════════════════════════
  console.log('\nSTEP 2: Removing emoji icons from all descriptions');
  console.log('='.repeat(60));

  const allCourses = await db.collection('courses').find({}).toArray() as any[];
  let emojiFixed = 0;

  for (const course of allCourses) {
    if (!course.description) continue;
    const cleaned = stripEmojis(course.description);
    if (cleaned.length !== course.description.length) {
      await db.collection('courses').updateOne(
        { _id: course._id },
        { $set: { description: cleaned } }
      );
      emojiFixed++;
    }
  }

  console.log('  Cleaned emojis from', emojiFixed, 'course descriptions');

  // ═══════════════════════════════════════════════════════
  // STEP 3: Add resources to ALL lessons across all courses
  // ═══════════════════════════════════════════════════════
  console.log('\nSTEP 3: Adding resources to lessons');
  console.log('='.repeat(60));

  let resourceCount = 0;
  let lessonCount = 0;

  for (const course of allCourses) {
    const title = course.title || '';
    const defaultResources = makeDefaultResources(title);
    
    if (!course.modules || course.modules.length === 0) continue;

    for (let mi = 0; mi < course.modules.length; mi++) {
      const module_ = course.modules[mi];
      if (!module_.lessons || module_.lessons.length === 0) continue;

      for (let li = 0; li < module_.lessons.length; li++) {
        const lesson = module_.lessons[li];
        
        // Skip quiz lessons - they don't need resources
        if (lesson.type === 'quiz') continue;

        // Add resources if missing or empty
        if (!lesson.resources || lesson.resources.length === 0) {
          // Add 2-3 resources per lesson
          const lessonResources = defaultResources.slice(0, 2 + (li % 2));
          
          const setKey = `modules.${mi}.lessons.${li}.resources`;
          await db.collection('courses').updateOne(
            { _id: course._id },
            { $set: { [setKey]: lessonResources } }
          );
          resourceCount += lessonResources.length;
          lessonCount++;
        } else if (lesson.resources.length < 2) {
          // Add more resources to lessons with few resources
          const existingResources = lesson.resources || [];
          const additionalResources = defaultResources.slice(0, Math.max(0, 3 - existingResources.length));
          
          for (const res of additionalResources) {
            const pushKey = `modules.${mi}.lessons.${li}.resources`;
            await db.collection('courses').updateOne(
              { _id: course._id },
              { $push: { [pushKey]: res } } as any
            );
            resourceCount++;
          }
          lessonCount++;
        }
      }
    }
  }

  console.log('  Added resources to', lessonCount, 'lessons');
  console.log('  Total resources added:', resourceCount);

  // ═══════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('  Course descriptions updated:', updated);
  console.log('  Emojis removed from:', emojiFixed, 'courses');
  console.log('  Lessons with resources added:', lessonCount);
  console.log('  Total resources added:', resourceCount);
  console.log('\nFixup complete!\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
