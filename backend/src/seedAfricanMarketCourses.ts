/**
 * 🌱 SEED: 5 Additional African Market Courses
 *
 * Adds 5 more comprehensive courses targeting key African market gaps:
 *   1. Hospitality & Tourism in Rwanda
 *   2. E-Commerce & Online Store Management
 *   3. Solar Energy & Renewable Energy Business
 *   4. Fashion & Textile Business in Africa
 *   5. Health & Wellness Entrepreneurship
 *
 * Each course includes modules with lessons, quizzes, assignments,
 * and high-quality Unsplash images matching the content.
 *
 * Usage: cd backend && npx tsx src/seedAfricanMarketCourses.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Course } from './models/Course';
import { User } from './models/User';
import { getCourseIllustrationUrl } from './services/image-api.service';

dotenv.config();

// ─── Helper Functions ───────────────────────────────────────────────────────

function makeLesson(title: string, content: string, type: string = 'article', order: number = 1, extras: Record<string, any> = {}) {
  const imgUrl = extras.imageUrl;
  const imgMd = imgUrl ? `\n\n![${title}](${imgUrl})` : '';
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
  searchImage: string;
  modules: ReturnType<typeof makeModule>[];
  isFeatured?: boolean;
  school?: string;
}

const COURSES: CourseDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 1: Hospitality & Tourism in Rwanda
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Hospitality & Tourism in Rwanda: From Guide to Business Owner',
    description:
      '🦍 Rwanda is one of Africa fastest-growing tourism destinations — with gorilla trekking, ' +
      'Nyungwe canopy walks, Akagera safaris, and Kigali booming as a conference hub. ' +
      'This course teaches you everything about the hospitality and tourism industry in Rwanda. ' +
      'Whether you want to become a tour guide, start a lodge, run a restaurant, or build a travel agency, ' +
      'this course gives you practical, local knowledge to succeed.\\n\\n' +
      '### 🎯 What You Will Learn\\n' +
      '- **Tourism in Rwanda** — Gorilla trekking, national parks, cultural tourism, conference tourism\\n' +
      '- **Hospitality Operations** — Running hotels, lodges, restaurants, and guesthouses\\n' +
      '- **Tour Guiding** — Becoming a certified tour guide, leading groups, telling Rwanda story\\n' +
      '- **Travel Agency** — Booking tours, flights, accommodation — earning commissions\\n' +
      '- **Marketing Tourism** — Using social media, TripAdvisor, and partnerships to attract visitors\\n' +
      '- **Starting Your Business** — Licensing, RDB registration, partnerships with RDB/Rwanda Parks\\n\\n' +
      '### 🧰 Your Tourism Toolbox\\n' +
      '| Tool | Purpose | Cost | Sign Up |\\n' +
      '|---|---|---|---|\\n' +
      '| RDB Tourism Portal | License and register your tourism business | Free | [rdb.rw](https://rdb.rw) |\\n' +
      '| Visit Rwanda | Official tourism marketing partner | Free | [visitrwanda.com](https://www.visitrwanda.com) |\\n' +
      '| TripAdvisor | List your hotel/tour for global visibility | Free | [tripadvisor.com](https://www.tripadvisor.com) |\\n' +
      '| Booking.com | Global accommodation bookings | 15% commission | [booking.com](https://www.booking.com) |\\n' +
      '| Canva | Create brochures, menus, social media posts | Free tier | [canva.com](https://www.canva.com) |\\n' +
      '| Google My Business | Get found on Google Maps | Free | [google.com/business](https://www.google.com/business) |\\n' +
      '| WhatsApp Business | Chat with guests, share offers | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |\\n' +
      '| Instagram | Showcase rooms, tours, experiences | Free | [instagram.com](https://www.instagram.com) |\\n\\n' +
      '> 🎓 **By the end of this course, you will be able to** work in or start a tourism business in Rwanda, ' +
      'guide tours, manage hospitality operations, and attract visitors from around the world!',
    category: 'Hospitality & Tourism',
    level: 'Beginner',
    price: 1000,
    searchImage: 'gorilla trekking rwanda tourism safari africa',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Understanding Rwanda Tourism Industry',
        'Learn about the tourism ecosystem in Rwanda — national parks, key attractions, and industry players.',
        [
          makeLesson(
            'Rwanda Tourism Overview — The Land of a Thousand Hills',
            'Rwanda tourism has grown enormously since 2000. In 2023, tourism contributed over $600 million to the economy. ' +
            'The country is known for mountain gorillas (Volcanoes National Park), chimpanzees (Nyungwe Forest), ' +
            'the Big Five (Akagera National Park), and the vibrant capital Kigali.\\n\\n' +
            '### Key Tourism Statistics in Rwanda:\\n' +
            '- Gorilla trekking permits cost $1,500 per person (2024) — one of the top tourism earners\\n' +
            '- Rwanda won \"Best Meetings Destination\" in Africa multiple times\\n' +
            '- Over 1 million visitors annually (pre-COVID)\\n' +
            '- Tourism employs over 100,000 Rwandans directly\\n\\n' +
            '### Main Tourism Segments:\\n' +
            '1. **Gorilla Trekking** — Volcanoes National Park, permits via RDB\\n' +
            '2. **Safari** — Akagera National Park, Big Five (lion, leopard, elephant, rhino, buffalo)\\n' +
            '3. **Chimpanzee Tracking** — Nyungwe National Park, canopy walkway\\n' +
            '4. **Conference Tourism** — Kigali Convention Centre, hotels\\n' +
            '5. **Cultural Tourism** — King Palace Museum, Genocide Memorial, Intore dance\\n' +
            '6. **Lake Tourism** — Lake Kivu (Gisenyi, Kibuye, Rusizi) — beaches, boat trips\\n' +
            '7. **Bird Watching** — Over 700 bird species recorded in Rwanda',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=bI7WQe6bxKA', videoTitle: 'Visit Rwanda - Tourism Highlights' },
          ),
          makeLesson(
            'Key Players in Rwanda Tourism',
            'Understanding who is who in Rwanda tourism is essential. The main players include government agencies, ' +
            'hotel chains, tour operators, and community-based tourism initiatives.\\n\\n' +
            '### Government Agencies:\\n' +
            '- **RDB (Rwanda Development Board)** — Issues tourism licenses, permits, promotes investment\\n' +
            '- **Rwanda Parks** — Manages national parks and reserves\\n' +
            '- **RwandAir** — National airline, flies to 25+ destinations\\n\\n' +
            '### Major Hotels & Lodges:\\n' +
            '- **Marriott, Serena, Radisson Blu** — International chains in Kigali\\n' +
            '- **Bisate Lodge, Singita, One&Only** — Luxury safari lodges (gorilla trekking)\\n' +
            '- **Lake Kivu Serena** — Lakeside resort\\n' +
            '- **Local guesthouses** — Affordable options across the country\\n\\n' +
            '### Tour Operators:\\n' +
            '- **Primate Safaris** — Gorilla trekking specialists\\n' +
            '- **Amahoro Tours** — Community-based tours\\n' +
            '- **Red Rocks** — Cultural experiences in Musanze\\n' +
            '- **Local guides associations** — Registered guides at each park',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Becoming a Certified Tour Guide in Rwanda',
            'Becoming a tour guide in Rwanda requires certification from RDB. This lesson covers the process, ' +
            'skills needed, languages to learn, and how to build your reputation.\\n\\n' +
            '### Steps to Become a Tour Guide:\\n' +
            '1. **Education** — Minimum secondary school certificate\\n' +
            '2. **Language skills** — English, French, Kinyarwanda (Swahili is a big plus)\\n' +
            '3. **RDB Training** — Attend RDB-approved tour guide training program\\n' +
            '4. **Examination** — Pass the RDB tour guide exam\\n' +
            '5. **License** — Obtain your tour guide license from RDB\\n' +
            '6. **Specialization** — Choose a focus: gorilla trekking, cultural tours, bird watching\\n\\n' +
            '### Income Potential for Tour Guides:\\n' +
            '- Junior guide: 30,000-50,000 RWF per day\\n' +
            '- Senior guide: 80,000-150,000 RWF per day\\n' +
            '- Specialist guide (gorillas): 100,000-200,000 RWF per day\\n' +
            '- With tips, monthly income can reach 500,000-1,500,000 RWF during peak season (June-September, December-January)',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1576426863848-21f36b40b1b7?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your understanding of Rwanda tourism industry.',
            [
              {
                question: 'Which government agency issues tourism licenses in Rwanda?',
                options: ['RURA', 'RDB', 'RSB', 'BNR'],
                correctIndex: 1,
                explanation: 'RDB (Rwanda Development Board) issues tourism licenses and permits.',
              },
              {
                question: 'How much does a gorilla trekking permit cost in Rwanda (2024)?',
                options: ['$500', '$1,000', '$1,500', '$2,000'],
                correctIndex: 2,
                explanation: 'Gorilla trekking permits cost $1,500 per person in 2024.',
              },
              {
                question: 'Which national park in Rwanda has the Big Five?',
                options: ['Volcanoes National Park', 'Nyungwe National Park', 'Akagera National Park', 'Gishwati Forest'],
                correctIndex: 2,
                explanation: 'Akagera National Park has the Big Five — lion, leopard, elephant, rhino, and buffalo.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: Tourism Industry Research',
            'Research and analyze a segment of Rwanda tourism industry.',
            'Complete the following tasks to demonstrate your understanding of Rwanda tourism.',
            [
              {
                question: 'Research one national park in Rwanda (Volcanoes, Nyungwe, or Akagera). Write a one-page summary including location, key attractions, entry fees, best time to visit, and accommodation options nearby.',
                type: 'open',
                explanation: 'Include practical information a tourist would need to plan their visit.',
                points: 20,
              },
              {
                question: 'Create a 7-day Rwanda itinerary for a tourist interested in gorilla trekking and culture. Include budget estimates for accommodation, transport, food, and activities.',
                type: 'open',
                explanation: 'Show total estimated cost and recommend specific hotels/tour operators.',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Explain the Rwanda tourism ecosystem and identify career opportunities in the industry.',
      ),
      makeModule(
        'Module 2: Running a Hospitality Business',
        'Learn how to start and manage hotels, lodges, restaurants, and guesthouses in Rwanda.',
        [
          makeLesson(
            'Starting a Hotel, Lodge or Guesthouse',
            'Rwanda needs more accommodation options, especially mid-range and budget. This lesson covers ' +
            'the step-by-step process of starting a hospitality business in Rwanda.\\n\\n' +
            '### Steps to Start:\\n' +
            '1. **Market research** — Identify location (Kigali, Musanze, Gisenyi, Kibuye, Rusizi)\\n' +
            '2. **Business plan** — Include room rates, occupancy projections, staffing\\n' +
            '3. **RDB registration** — Register your company and obtain tourism license\\n' +
            '4. **Location & building** — Lease or build, meet RDB standards\\n' +
            '5. **Staffing** — Reception, housekeeping, kitchen, security\\n' +
            '6. **Booking platforms** — List on Booking.com, Expedia, Airbnb\\n' +
            '7. **Marketing** — Google My Business, Instagram, TripAdvisor\\n\\n' +
            '### Startup Budget Estimates (in RWF):\\n' +
            '- Small guesthouse (5 rooms): 15-30 million RWF\\n' +
            '- Mid-range lodge (10 rooms): 50-100 million RWF\\n' +
            '- Restaurant in Kigali: 10-30 million RWF\\n' +
            '- Budget: Start with 2-3 rooms in your own home (Airbnb) — under 5 million RWF!',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=hOq428St_14', videoTitle: 'How to Start a Hotel Business - Quick Guide' },
          ),
          makeLesson(
            'Restaurant & Catering Business in Rwanda',
            'Rwandans love eating out, and Kigali has a booming restaurant scene. From traditional ' +
            'Ubqoyi (buffet) restaurants to modern cafes, this lesson covers how to succeed in food business.\\n\\n' +
            '### Popular Restaurant Concepts in Rwanda:\\n' +
            '1. **Ubqoyi (buffet)** — Traditional Rwandan lunch, 3,000-5,000 RWF\\n' +
            '2. **Cafe/Bakery** — Coffee, pastries, WiFi — popular in Kigali\\n' +
            '3. **Fast food** — Brochettes, chips, samosas\\n' +
            '4. **International cuisine** — Indian, Ethiopian, Chinese, Italian\\n' +
            '5. **Juice bar** — Fresh fruit juices, smoothies\\n\\n' +
            '### Licensing Requirements from RDB:\\n' +
            '- Health inspection certificate from the district\\n' +
            '- Restaurant license from RDB\\n' +
            '- Rwanda Revenue Authority (RRA) tax registration\\n' +
            '- Rwanda Standards Board (RSB) food safety certification\\n' +
            '- Liquor license (if serving alcohol)',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Marketing Your Hospitality Business',
            'How to attract guests to your hotel, restaurant, or tour service. Covers online and offline marketing strategies.\\n\\n' +
            '### Online Marketing:\\n' +
            '- **TripAdvisor** — Respond to every review, positive or negative\\n' +
            '- **Google My Business** — Essential for local search, update photos weekly\\n' +
            '- **Instagram** — Post daily photos of rooms, food, location\\n' +
            '- **Booking.com** — Use competitive pricing and great photos\\n' +
            '- **Airbnb** — List rooms if you have self-contained units\\n\\n' +
            '### Offline Marketing:\\n' +
            '- Partner with tour operators who bring clients\\n' +
            '- Join Rwanda Hotels Association for networking\\n' +
            '- Attend tourism expos and trade shows\\n' +
            '- Offer referral discounts to past guests',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review hospitality business concepts.',
            [
              {
                question: 'What is the minimum startup budget for a small guesthouse in Rwanda?',
                options: ['1-2 million RWF', '15-30 million RWF', '100-200 million RWF', '500 million+ RWF'],
                correctIndex: 1,
                explanation: 'A small guesthouse with 5 rooms typically requires 15-30 million RWF to start.',
              },
              {
                question: 'Which booking platform should you prioritize for listing your hotel?',
                options: ['Only Instagram', 'Booking.com, Expedia, and Airbnb', 'Only a personal website', 'Facebook only'],
                correctIndex: 1,
                explanation: 'Listing on multiple booking platforms maximizes visibility and bookings.',
              },
              {
                question: 'What is an Ubqoyi restaurant in Rwanda?',
                options: ['A fast food chain', 'A traditional buffet restaurant', 'A fine dining restaurant', 'A juice bar'],
                correctIndex: 1,
                explanation: 'Ubqoyi is a traditional Rwandan buffet-style restaurant serving lunch.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Hospitality Business Plan',
            'Create a business plan for a hospitality venture in Rwanda.',
            'Develop a complete business plan for a hotel, restaurant, or tour operation in Rwanda.',
            [
              {
                question: 'Write a business plan for a hospitality business in Rwanda. Include: concept description, target market, location analysis, startup costs, revenue projections, and marketing strategy.',
                type: 'open',
                explanation: 'Be specific about location, pricing, target customers, and how you will attract them.',
                points: 25,
              },
              {
                question: 'Create a sample menu (for a restaurant) OR a 3-day tour package (for a tour operation) with pricing.',
                type: 'open',
                explanation: 'Show itemized pricing that is competitive yet profitable.',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Start and operate a hospitality business in Rwanda, from guesthouses to restaurants.',
      ),
      makeModule(
        'Module 3: Cultural Tourism & Community-Based Tourism',
        'Learn how to create authentic cultural experiences and involve local communities in tourism.',
        [
          makeLesson(
            'Creating Cultural Tourism Experiences',
            'Tourists want authentic experiences, not just sightseeing. Rwandan culture is rich with dance, ' +
            'music, cuisine, crafts, and traditions that can be packaged as tourism products.\\n\\n' +
            '### Cultural Tourism Products:\\n' +
            '1. **Intore dance performances** — Traditional Rwandan dance shows\\n' +
            '2. **Cooking classes** — Teach tourists to cook Isombe, Ugali, Brochettes\\n' +
            '3. **Village walks** — Guided walks through rural communities\\n' +
            '4. **Craft workshops** — Basket weaving (agaseke), pottery, drum making\\n' +
            '5. **Coffee experience** — Tour a coffee farm, from bean to cup\\n' +
            '6. **Storytelling evenings** — Traditional Rwandan stories around a fire\\n\\n' +
            '### How to Package Cultural Experiences:\\n' +
            '- Price per person: 20,000-50,000 RWF for half-day experiences\\n' +
            '- Partner with local hotels to offer to their guests\\n' +
            '- List on Visit Rwanda and community tourism platforms\\n' +
            '- Get certified by RDB as a community tourism initiative',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=mBcDvCc3jiU', videoTitle: 'Rwandan Culture and Traditions' },
          ),
          makeLesson(
            'Community-Based Tourism (CBT) in Rwanda',
            'Community-Based Tourism involves local communities hosting tourists and benefiting directly. ' +
            'Rwanda has successful CBT examples that generate income for villages.\\n\\n' +
            '### Successful CBT Examples in Rwanda:\\n' +
            '- **Red Rocks** — Musanze, cultural campsite and weaving cooperative\\n' +
            '- **Kinunu Guesthouse** — Lake Kivu, community-run accommodation\\n' +
            '- **Nyamirambo Women Center** — Kigali, walking tours with local women\\n' +
            '- **Bisate** — Community-owned eco-lodge near Volcanoes Park\\n\\n' +
            '### Steps to Start a CBT Initiative:\\n' +
            '1. Identify a community with unique culture or location\\n' +
            '2. Form a cooperative (registered with RDB and district)\\n' +
            '3. Develop a tourism product (experience, accommodation, guiding)\\n' +
            '4. Set prices and create marketing materials\\n' +
            '5. Train community members in hospitality and guiding\\n' +
            '6. Partner with tour operators to bring visitors',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1582820264149-4e6e7a8594ee?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test your understanding of cultural and community tourism.',
            [
              {
                question: 'What is agaseke in Rwandan culture?',
                options: ['A traditional dance', 'A woven basket', 'A musical instrument', 'A type of food'],
                correctIndex: 1,
                explanation: 'Agaseke are traditional Rwandan woven baskets, a popular craft product for tourists.',
              },
              {
                question: 'What is the key principle of Community-Based Tourism?',
                options: ['Only government benefits', 'Local communities directly benefit from tourism', 'Tourists stay in luxury hotels', 'Only foreign guides are allowed'],
                correctIndex: 1,
                explanation: 'CBT ensures local communities host tourists and receive direct economic benefits.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Cultural Tourism Project',
            'Design a cultural tourism experience in your community.',
            'Create a detailed plan for a cultural tourism experience.',
            [
              {
                question: 'Design a half-day cultural tourism experience in a Rwandan community. Describe the activities, schedule, pricing per person, what is included, and how the community benefits.',
                type: 'open',
                explanation: 'Include: welcome ceremony, hands-on activity, meal, and farewell. Show how much money goes to the community.',
                points: 25,
              },
              {
                question: 'Create a simple marketing flyer (text description) for your cultural experience, targeting international tourists. Include selling points, price, duration, and contact information.',
                type: 'open',
                explanation: 'Focus on what makes this experience unique and authentic.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Design and operate cultural tourism experiences that benefit local communities.',
      ),

      makeModule(
        'Module 4: Final Project — Launch Your Tourism Business',
        'Bring everything together to launch a real tourism business and earn income.',
        [
          makeLesson(
            'Your Tourism Business Action Plan',
            'Now it is time to take action. This lesson guides you through launching your real tourism business ' +
            'using everything you have learned.\\n\\n' +
            '### Choose Your Path:\\n' +
            '1. **Tour Guide** — Get RDB certified, join a tour operator, start guiding\\n' +
            '2. **Airbnb Host** — List a room or house on Airbnb, start hosting\\n' +
            '3. **Tour Operator** — Register with RDB, design tours, find clients\\n' +
            '4. **Cultural Experience** — Start a community tourism activity\\n' +
            '5. **Restaurant/Cafe** — Open a small food business near tourist areas\\n\\n' +
            '### Quick Start Checklist:\\n' +
            '- [ ] Register your business with RDB (rdb.rw)\\n' +
            '- [ ] Open a bank account (Bank of Kigali, Equity, or I&M)\\n' +
            '- [ ] Get liability insurance (SONARWA or SORAS)\\n' +
            '- [ ] Create Google My Business listing\\n' +
            '- [ ] Set up Instagram and WhatsApp Business\\n' +
            '- [ ] List on Booking.com or Airbnb\\n' +
            '- [ ] Print business cards and brochures\\n' +
            '- [ ] Join Rwanda Tourism Association',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=TJIUnpfIytk', videoTitle: 'How to Start a Tourism Business - 5 Min Guide' },
          ),
          makeLesson(
            'Tourism Business Financial Management',
            'Managing finances in tourism — pricing strategies, seasonal cash flow, tax compliance.\\n\\n' +
            '### Key Financial Tips:\\n' +
            '- Peak seasons: June-September, December-January\\n' +
            '- Save 20% of revenue for low-season months\\n' +
            '- Register for RRA taxes (VAT at 18%, rental tax, PAYE for staff)\\n' +
            '- Use mobile money (MoMo) for deposits and payments\\n' +
            '- Build a referral program — past guests are your best marketers',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 4: Knowledge Check',
            'Test your understanding of launching and managing a tourism business.',
            [
              {
                question: 'What is the peak tourism season in Rwanda?',
                options: ['January-March', 'June-September and December-January', 'April-June', 'October-December'],
                correctIndex: 1,
                explanation: 'Peak seasons are June-September (summer) and December-January (holidays).',
              },
              {
                question: 'Which insurance company in Rwanda offers tourism business insurance?',
                options: ['MTN', 'SONARWA', 'Airtel', 'RURA'],
                correctIndex: 1,
                explanation: 'SONARWA and SORAS are major insurance providers in Rwanda offering liability insurance.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 4: Final Tourism Business Project — Earn 200,000+ RWF!',
            'Your mission: Launch a real tourism service and earn your first income!',
            '**REAL TOURISM PROJECT: Earn Your First 200,000+ RWF in 30 Days**\\n\\nChoose ONE real action to launch your tourism business:\\n\\n**Option A: Become a Local Guide**\\nTake 2-3 tourists on a guided walk in your area (Kigali city tour, village walk, nature walk).\\nCharge 30,000-50,000 RWF per person for a half-day.\\n\\n**Option B: Host on Airbnb**\\nIf you have a spare room, list it on Airbnb.\\nEven renting for 10 nights at 30,000 RWF/night = 300,000 RWF!\\n\\n**Option C: Cultural Cooking Experience**\\nInvite tourists to learn cooking Rwandan food.\\nCharge 25,000 RWF per person for a 3-hour cooking class + meal.\\n\\n**🎯 Quick access links:** [RDB Tourism](https://rdb.rw) | [Visit Rwanda](https://www.visitrwanda.com) | [Airbnb](https://www.airbnb.com) | [Booking.com](https://www.booking.com)\\n\\n**🎯 Target: 200,000+ RWF in 30 days!**\\n\\n![Rwanda tourism](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800&h=500)',
            [
              { question: 'YOUR TOURISM SERVICE: What service did you launch? Local guide, Airbnb hosting, or cultural experience? Describe what you did and how many customers you served.', type: 'open', explanation: 'Describe exactly what service you offered and how you found customers.', points: 20 },
              { question: 'FINANCIALS: How much revenue did you generate? What were your costs? What was your net profit?', type: 'open', explanation: 'Show actual numbers from your tourism business.', points: 20 },
              { question: 'CUSTOMER FEEDBACK: What did your customers say? What did they like most? What would you improve?', type: 'open', explanation: 'Share real feedback from tourists or guests you served.', points: 15 },
              { question: 'GROWTH PLAN: How would you scale this business? More rooms? More tours? More experiences? Revenue target for next 3 months?', type: 'open', explanation: 'Show your growth strategy for scaling your tourism business.', points: 20 },
            ],
            5,
          ),
        ],
        'Launch and operate a real tourism or hospitality business in Rwanda.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 2: E-Commerce & Online Store Management
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'E-Commerce & Online Store: Sell Anything from Rwanda',
    description:
      '🛒 E-commerce is exploding in Africa — and Rwanda is no exception. With MTN MoMo, Airtel Money, ' +
      'and mobile banking, anyone can buy and sell online. This course shows you how to start an online ' +
      'store, source products, accept payments, handle delivery, and grow sales.\\n\\n' +
      'Whether you want to sell on Jumia, start a Shopify store, sell via WhatsApp, or build a niche ' +
      'e-commerce brand — this course has you covered with practical, Rwanda-specific guidance.\\n\\n' +
      '### 🎯 What You Will Learn\\n' +
      '- **E-Commerce Platforms** — Shopify, Jumia, WhatsApp Commerce, Instagram Shopping\\n' +
      '- **Product Sourcing** — Where to find products to sell (local, import, handmade)\\n' +
      '- **Payments** — MTN MoMo, Airtel Money, credit cards, bank transfers\\n' +
      '- **Delivery & Logistics** — SafeBoda, UPS, local couriers, self-delivery\\n' +
      '- **Customer Service** — Handling inquiries, complaints, building trust\\n' +
      '- **Marketing Your Store** — Social media, ads, promotions, SEO\\n\\n' +
      '### 🧰 Your E-Commerce Toolbox\\n' +
      '| Tool | Purpose | Cost | Sign Up |\\n' +
      '|---|---|---|---|\\n' +
      '| Shopify | Build your own online store | $29/month (trial available) | [shopify.com](https://www.shopify.com) |\\n' +
      '| Jumia Marketplace | Sell to millions of African shoppers | Commission-based | [jumia.co.rw](https://www.jumia.co.rw) |\\n' +
      '| WhatsApp Business | Chat with customers, share catalog | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |\\n' +
      '| Instagram Shopping | Tag products in posts | Free | [instagram.com](https://www.instagram.com) |\\n' +
      '| MTN MoMo Merchant | Accept mobile money payments | 0.5-1% per transaction | [mtn.co.rw](https://www.mtn.co.rw) |\\n' +
      '| PayPal | Accept international payments | 2.9% + $0.30 | [paypal.com](https://www.paypal.com) |\\n' +
      '| Canva | Create product images and ads | Free tier | [canva.com](https://www.canva.com) |\\n' +
      '| Google Merchant | List products in Google Shopping | Free | [merchant.google.com](https://merchant.google.com) |',
    category: 'E-Commerce',
    level: 'Beginner',
    price: 1000,
    searchImage: 'ecommerce online shopping africa mobile phone',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: E-Commerce Foundations in Rwanda',
        'Learn the e-commerce landscape in Rwanda — platforms, payments, and logistics.',
        [
          makeLesson(
            'The E-Commerce Opportunity in Rwanda',
            'E-commerce in Rwanda is growing rapidly. Mobile money penetration is over 50%, ' +
            'smartphone adoption is rising, and platforms like Jumia and Vuba Vuba are proving the market. ' +
            'This lesson explores the opportunity and how to position yourself.\\n\\n' +
            '### E-Commerce Statistics in Rwanda:\\n' +
            '- Over 5 million mobile money users in Rwanda\\n' +
            '- Jumia Rwanda processes thousands of orders daily\\n' +
            '- Social commerce (WhatsApp, Instagram) is the fastest-growing segment\\n' +
            '- Cross-border e-commerce within EAC is growing with AfCFTA (African Continental Free Trade Area)\\n\\n' +
            '### Why E-Commerce Works in Rwanda:\\n' +
            '1. **Mobile money** — Everyone can pay, no bank account needed\\n' +
            '2. **Growing middle class** — Increasing disposable income in Kigali\\n' +
            '3. **Internet penetration** — Over 50% of Rwandans have internet access\\n' +
            '4. **Youth population** — 65% under 30, digital-native consumers\\n' +
            '5. **Government support** — Smart Rwanda, cashless economy push',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=2X_HxY5hO0g', videoTitle: 'E-Commerce in Africa - Boom Opportunity' },
          ),
          makeLesson(
            'E-Commerce Platforms Comparison',
            'Choose the right platform for your e-commerce business. Each platform has different strengths, fees, and target audiences.\\n\\n' +
            '### Platform Comparison:\\n' +
            '| Platform | Best For | Monthly Cost | Payment Options | Delivery |\\n' +
            '|---|---|---|---|---|\\n' +
            '| Jumia | Beginners, broad reach | Free to list (15% commission) | MoMo, card, cash | Jumia handles delivery |\\n' +
            '| Shopify | Brand building, custom store | $29/month | MoMo via plugin, card | You arrange |\\n' +
            '| WhatsApp Commerce | Low-cost, personal | Free | MoMo, Airtel Money | You deliver or meet |\\n' +
            '| Instagram Shopping | Fashion, visual products | Free | Link to store | You arrange |\\n' +
            '| Facebook Marketplace | Second-hand, local | Free | Cash, MoMo | Meet in person |\\n' +
            '| Your Own Website | Full control | Hosting: 10,000 RWF/month | Stripe, MoMo | You arrange |\\n\\n' +
            '### Quick Start Recommendation:\\n' +
            'Start with **Jumia** (no upfront cost) OR **WhatsApp Business + Instagram** (free).\\n' +
            'Once you have sales and experience, upgrade to a Shopify store for your brand.',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Setting Up Payments for Your Online Store',
            'Accepting payments is critical. In Rwanda, mobile money is king, but you also need cards and bank transfers.\\n\\n' +
            '### Payment Methods for Rwandan E-Commerce:\\n' +
            '1. **MTN MoMo Merchant** — Apply via MTN, get a merchant code, 0.5-1% fee\\n' +
            '2. **Airtel Money Merchant** — Apply via Airtel, similar fees\\n' +
            '3. **Bank Transfers** — Bank of Kigali, Equity, I&M — free or low cost\\n' +
            '4. **Credit/Debit Cards** — Use Stripe (international) or local processors\\n' +
            '5. **Cash on Delivery** — Still popular, but high risk (25%+ non-delivery)\\n' +
            '6. **PayPal** — For international customers\\n\\n' +
            '### How to Get a MoMo Merchant Account:\\n' +
            '1. Have a registered business with RDB\\n' +
            '2. Visit any MTN service center with your business documents\\n' +
            '3. Fill the MoMo Merchant application form\\n' +
            '4. Receive your merchant code (7 days)\\n' +
            '5. Integrate with your e-commerce platform',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your e-commerce fundamentals.',
            [
              {
                question: 'Which e-commerce platform is best for absolute beginners in Rwanda?',
                options: ['Shopify ($29/month)', 'Jumia (free to list)', 'Custom website', 'Amazon'],
                correctIndex: 1,
                explanation: 'Jumia allows you to list products for free and handles payments and delivery.',
              },
              {
                question: 'What is the most popular payment method for online shopping in Rwanda?',
                options: ['Credit card', 'Mobile money (MoMo)', 'Bitcoin', 'Cheque'],
                correctIndex: 1,
                explanation: 'Mobile money (MTN MoMo, Airtel Money) is the most popular payment method in Rwanda.',
              },
              {
                question: 'Which platform is best for selling handmade or unique products from Rwanda?',
                options: ['Amazon', 'Etsy + Instagram', 'eBay', 'Alibaba'],
                correctIndex: 1,
                explanation: 'Etsy (international) + Instagram (local) are great for handmade Rwandan products.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: E-Commerce Platform Selection',
            'Analyze and choose the best e-commerce platform for your product.',
            'Research e-commerce platforms and select the best one for a specific product category in Rwanda.',
            [
              {
                question: 'Choose a product category (fashion, electronics, food, crafts, etc.). Compare 3 e-commerce platforms for selling this product in Rwanda. Which platform would you choose and why? Include fee analysis.',
                type: 'open',
                explanation: 'Compare costs, reach, payment options, and delivery logistics for each platform.',
                points: 20,
              },
              {
                question: 'List the steps you would take to set up payments for your online store in Rwanda, including which payment methods you would offer and why.',
                type: 'open',
                explanation: 'Include MoMo merchant application process, card processing, and bank transfer setup.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Choose the right e-commerce platform and set up payments for an online store in Rwanda.',
      ),
      makeModule(
        'Module 2: Product Sourcing & Store Setup',
        'Find products to sell, set up your store, and create compelling product listings.',
        [
          makeLesson(
            'Where to Source Products in Rwanda',
            'You do not need to manufacture products — you can source, resell, or use dropshipping.\\n\\n' +
            '### Product Sourcing Options:\\n' +
            '1. **Local markets** — Kimironko Market (produce), Nyabugogo (wholesale), Remera (electronics)\\n' +
            '2. **Local artisans** — Agaseke baskets, Imigongo art, Kitenge fabrics — partner directly\\n' +
            '3. **Import from China** — Alibaba, AliExpress — electronics, fashion, accessories\\n' +
            '4. **Import from Dubai** — Gold, perfumes, textiles — via Dubai Trade\\n' +
            '5. **Dropshipping** — Sell products stored elsewhere, ship directly to customer\\n' +
            '6. **Handmade/Crafted** — Your own products (soap, candles, jewelry, food)\\n\\n' +
            '### How to Source from Kimironko Market (Example):\\n' +
            '1. Visit Kimironko early morning (6-8 AM for best selection)\\n' +
            '2. Buy in bulk (wholesale) for 20-40% discount\\n' +
            '3. Negotiate prices — start at 50% of asking price\\n' +
            '4. Build relationships with regular suppliers\\n' +
            '5. Arrange transport (motorbike 2,000 RWF, taxi 5,000 RWF)',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=4cO-YtVUZMo', videoTitle: 'Product Sourcing for E-Commerce - Guide' },
          ),
          makeLesson(
            'Creating Product Listings That Sell',
            'Your product listing is your salesperson. Great photos, clear descriptions, and competitive pricing are essential.\\n\\n' +
            '### Product Listing Essentials:\\n' +
            '1. **Photos** — 5+ photos from different angles, natural lighting\\n' +
            '2. **Title** — Clear, includes product name and key feature\\n' +
            '3. **Description** — Benefits, specifications, size, material, care instructions\\n' +
            '4. **Price** — Competitive, include delivery fee if applicable\\n' +
            '5. **Reviews** — Encourage customers to leave reviews\\n\\n' +
            '### Smartphone Photography Tips:\\n' +
            '- Clean your lens\\n' +
            '- Use natural light near a window\\n' +
            '- Use a plain background (white wall or sheet)\\n' +
            '- Take photos from multiple angles\\n' +
            '- Edit with Canva or Snapseed (free apps)',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Pricing Your Products Profitably',
            'Set prices that attract customers AND make you money. Learn about cost-plus pricing, competitive pricing, and value-based pricing.\\n\\n' +
            '### Pricing Formula:\\n' +
            'Selling Price = Cost of Goods + Delivery + Platform Fees + Your Profit\\n\\n' +
            '### Example Pricing Breakdown (Women Dress):\\n' +
            '- Product cost: 15,000 RWF\\n' +
            '- Delivery to customer: 3,000 RWF\\n' +
            '- Jumia commission (15%): 3,450 RWF\\n' +
            '- Your desired profit: 8,550 RWF\\n' +
            '= **Selling Price: 30,000 RWF**\\n\\n' +
            '### Pricing Tips:\\n' +
            '- Research competitor prices before setting yours\\n' +
            '- Offer bundle deals (buy 2, get 5% off)\\n' +
            '- Use charm pricing (29,950 instead of 30,000)\\n' +
            '- Run promotions during holidays (Christmas, New Year, Genocide Memorial Week)',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Test your product sourcing and listing knowledge.',
            [
              {
                question: 'What is dropshipping?',
                options: ['Shipping products by boat', 'Selling products stored elsewhere that ship directly to customer', 'Dropping products at a local shop', 'A delivery method'],
                correctIndex: 1,
                explanation: 'Dropshipping means you sell products that are stored and shipped by a third party.',
              },
              {
                question: 'How many photos should you include in a product listing?',
                options: ['1 photo', '5+ photos from different angles', 'Only videos', 'No photos needed'],
                correctIndex: 1,
                explanation: 'Multiple photos from different angles help customers understand the product.',
              },
              {
                question: 'What is charm pricing?',
                options: ['Very high prices', 'Prices ending in 950 or 990 (e.g., 29,950 RWF)', 'Free products', 'Prices set by the government'],
                correctIndex: 1,
                explanation: 'Charm pricing uses prices ending in 950/990 to make products seem cheaper.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Product Listing Project',
            'Create professional product listings for your online store.',
            'Source a product and create complete product listings for 3 different e-commerce platforms.',
            [
              {
                question: 'Choose one product to sell. Source it from a local supplier or market. Create a product listing with title, description (5+ bullet points), and suggested retail price. Show your cost breakdown.',
                type: 'open',
                explanation: 'Include: product cost, delivery cost, platform fees, and your profit margin.',
                points: 20,
              },
              {
                question: 'Write a product description for the same product optimized for Jumia, and another version optimized for Instagram/WhatsApp. Explain the differences.',
                type: 'open',
                explanation: 'Jumia: detailed specifications. Instagram: short, visual, emotional benefits.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Source products and create professional listings for any e-commerce platform.',
      ),
      makeModule(
        'Module 3: Delivery, Customer Service & Growth',
        'Handle delivery logistics, provide excellent customer service, and scale your e-commerce business.',
        [
          makeLesson(
            'Delivery & Logistics in Rwanda',
            'Getting products to customers is often the hardest part of e-commerce. This lesson covers all delivery options in Rwanda.\\n\\n' +
            '### Delivery Options:\\n' +
            '1. **Self-delivery** — You deliver yourself (motorbike, bicycle, on foot)\\n' +
            '2. **SafeBoda/UF** — Motorbike delivery within Kigali, 2,000-5,000 RWF\\n' +
            '3. **Local couriers** — KGL Delivery, DHL, UPS, Swift Logistics\\n' +
            '4. **Bus companies** — Volcano, Horizon, Omega — send products upcountry\\n' +
            '5. **Jumia delivery** — Jumia handles delivery for Jumia sellers\\n\\n' +
            '### Delivery Pricing Guide:\\n' +
            '- Within Kigali: 2,000-5,000 RWF (motorbike)\\n' +
            '- Kigali to Musanze/Gisenyi: 5,000-10,000 RWF (bus)\\n' +
            '- Kigali to Rusizi/Cyangugu: 8,000-15,000 RWF (bus)\\n' +
            '- International: $20-50 (DHL, UPS)',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Customer Service Excellence',
            'Great customer service leads to repeat buyers and referrals. Learn how to handle inquiries, complaints, and build trust.\\n\\n' +
            '### Customer Service Guidelines:\\n' +
            '- Respond to messages within 1 hour during business hours\\n' +
            '- Be polite and professional in every interaction\\n' +
            '- Under-promise and over-deliver on delivery times\\n' +
            '- Handle complaints quickly — offer refund or replacement\\n' +
            '- Ask for reviews after every successful delivery\\n\\n' +
            '### WhatsApp Business Features for Customer Service:\\n' +
            '- Quick replies — Save common responses (pricing, delivery info)\\n' +
            '- Labels — Organize customers (new, paid, delivered, follow-up)\\n' +
            '- Catalog — Show your products within WhatsApp\\n' +
            '- Automated messages — Away message, greeting message',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=2Eanrc4BW44', videoTitle: 'WhatsApp Business for E-Commerce - Full Guide' },
          ),
          makeLesson(
            'Growing Your E-Commerce Business',
            'Once you have sales coming in, it is time to scale. Learn marketing strategies, customer retention, and expansion.\\n\\n' +
            '### Growth Strategies:\\n' +
            '1. **Social media ads** — Facebook & Instagram ads starting from 5,000 RWF/day\\n' +
            '2. **Email marketing** — Collect emails, send promotions (Mailchimp free tier)\\n' +
            '3. **Referral program** — Give 10% discount for every referral\\n' +
            '4. **Loyalty program** — Points for repeat purchases\\n' +
            '5. **Cross-selling** — Suggest related products\\n' +
            '6. **Expand product line** — Add new categories based on customer demand\\n\\n' +
            '### When to Scale:\\n' +
            '- You have consistent sales (20+ orders/month)\\n' +
            '- You have positive reviews and repeat customers\\n' +
            '- You understand your best-selling products\\n' +
            '- You have reliable suppliers and delivery partners',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review delivery, customer service, and growth concepts.',
            [
              {
                question: 'What is the cheapest way to deliver products within Kigali?',
                options: ['DHL', 'Motorbike (SafeBoda/UF)', 'UPS', 'Taxi'],
                correctIndex: 1,
                explanation: 'Motorbike delivery services like SafeBoda and UF cost 2,000-5,000 RWF within Kigali.',
              },
              {
                question: 'What is the most important rule of customer service in e-commerce?',
                options: ['Always be the cheapest', 'Under-promise and over-deliver', 'Never respond to complaints', 'Only use email'],
                correctIndex: 1,
                explanation: 'Under-promising and over-delivering builds trust and leads to repeat business.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Final E-Commerce Project — Earn 150,000+ RWF!',
            'Your mission: Launch a real online store and make real sales!',
            '**REAL E-COMMERCE PROJECT: Earn Your First 150,000+ RWF in 30 Days**\\n\\nChoose ONE path to launch your store:\\n\\n**Path A: WhatsApp Store (easiest, free)**\\n1. Create a WhatsApp Business account\\n2. Take photos of 10 products you can source\\n3. Share your catalog on WhatsApp status and groups\\n4. Start taking orders and delivering\\n\\n**Path B: Jumia Seller**\\n1. Register as a Jumia seller (free)\\n2. List 5 products with good photos\\n3. Price competitively\\n4. Fulfill orders as they come\\n\\n**Path C: Instagram Store**\\n1. Create a business Instagram account\\n2. Post 3 product photos per day\\n3. Use relevant hashtags (#Kigali #Rwanda #ShopRwanda)\\n4. Link to WhatsApp for orders\\n\\n**🎯 Quick access links:** [Jumia Seller](https://seller.jumia.co.rw) | [WhatsApp Business](https://www.whatsapp.com/business) | [MTN MoMo Merchant](https://www.mtn.co.rw/momo) | [Canva](https://www.canva.com)\\n\\n**🎯 Target: 150,000+ RWF in 30 days!**\\n\\n![E-commerce money](https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800&h=500)',
            [
              { question: 'YOUR STORE: What products are you selling? Which platform did you choose (WhatsApp, Jumia, Instagram)? Why?', type: 'open', explanation: 'Describe your product category and platform choice with reasoning.', points: 20 },
              { question: 'SALES RESULTS: How many orders did you receive? Total revenue? Costs? Net profit?', type: 'open', explanation: 'Show actual numbers from your real e-commerce business.', points: 20 },
              { question: 'CUSTOMER FEEDBACK: What did customers say? What was the biggest challenge? Delivery, payments, or something else?', type: 'open', explanation: 'Share challenges and how you overcame them.', points: 15 },
              { question: 'SCALE PLAN: How would you grow this business to 500,000+ RWF/month? More products? Marketing? Partnerships?', type: 'open', explanation: 'Show your growth strategy for scaling your e-commerce business.', points: 20 },
            ],
            5,
          ),
        ],
        'Launch and grow a profitable e-commerce business in Rwanda.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 3: Solar Energy & Renewable Energy Business
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Solar Energy Business: Power Rwanda with Renewable Energy',
    description:
      '☀️ Rwanda has some of the best solar irradiance in Africa — over 2,000 kWh/m² per year. ' +
      'Yet many rural communities still lack reliable electricity. This course teaches you how to ' +
      'start a solar energy business in Rwanda — from installing home solar systems to running ' +
      'a full-scale renewable energy company.\\n\\n' +
      'With government targets of 100% electrification by 2030 and strong support for off-grid solar, ' +
      'the renewable energy sector in Rwanda is one of the biggest business opportunities of the decade.\\n\\n' +
      '### 🎯 What You Will Learn\\n' +
      '- **Solar Basics** — How solar panels work, system components, sizing\\n' +
      '- **Installation** — Installing home solar systems, solar water pumps, street lights\\n' +
      '- **Business Setup** — Registering your solar company, licensing, partnerships\\n' +
      '- **Products to Sell** — Solar home systems, panels, batteries, inverters, water heaters\\n' +
      '- **Financing** — PAYG (Pay-As-You-Go) solar, government subsidies, customer financing\\n' +
      '- **Marketing** — Selling solar to rural communities, schools, businesses\\n\\n' +
      '### 🧰 Your Solar Business Toolbox\\n' +
      '| Tool | Purpose | Cost | Sign Up |\\n' +
      '|---|---|---|---|\\n' +
      '| REG (Rwanda Energy Group) | Licenses, grid connection info | Free | [reg.rw](https://www.reg.rw) |\\n' +
      '| RURA | Energy sector regulation, permits | Free | [rura.rw](https://www.rura.rw) |\\n' +
      '| BNR/Development Bank | Solar business loans | Varies | [brd.rw](https://www.brd.rw) |\\n' +
      '| MASS Design | Solar panel suppliers directory | Free | Online search |\\n' +
      '| PVsyst | Solar system design software | Free trial | [pvsyst.com](https://www.pvsyst.com) |\\n' +
      '| Alibaba | Solar panel suppliers (import) | Free | [alibaba.com](https://www.alibaba.com) |\\n' +
      '| MTN MoMo | Customer payment collection | 0.5-1% fee | [mtn.co.rw](https://www.mtn.co.rw) |\\n' +
      '| WhatsApp Business | Customer communication | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |',
    category: 'Technology',
    level: 'Beginner',
    price: 1000,
    searchImage: 'solar panels renewable energy africa sun',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Solar Energy Fundamentals',
        'Learn how solar energy works, system components, and sizing basics.',
        [
          makeLesson(
            'How Solar Energy Works',
            'Solar energy is the most abundant renewable resource in Rwanda. With over 2,000 kWh/m² of solar irradiation per year, ' +
            'Rwanda has excellent conditions for solar power generation. This lesson covers the basic science behind solar energy.\\n\\n' +
            '### How Solar Panels Work:\\n' +
            '1. **Solar panels (photovoltaic cells)** capture sunlight and convert it to DC electricity\\n' +
            '2. **Charge controller** regulates the electricity to safely charge batteries\\n' +
            '3. **Batteries** store electricity for use at night or cloudy days\\n' +
            '4. **Inverter** converts DC electricity to AC electricity (for home appliances)\\n' +
            '5. **Load** — lights, TV, phone charging, refrigerator, etc.\\n\\n' +
            '### Rwanda Solar Potential:\\n' +
            '- Average solar irradiation: 5.2 kWh/m²/day\\n' +
            '- Over 300 sunny days per year\\n' +
            '- Government target: 100% electrification by 2030\\n' +
            '- Off-grid solar: 30% of rural households targeted for off-grid solutions',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=jq3PvTmt7N8', videoTitle: 'Solar Energy Explained - How Solar Panels Work' },
          ),
          makeLesson(
            'Solar System Components & Sizing',
            'Understanding the components of a solar system and how to size a system for a customers needs.\\n\\n' +
            '### Solar System Components:\\n' +
            '1. **Solar panels** — 100W to 500W per panel, monocrystalline (best) or polycrystalline\\n' +
            '2. **Charge controller** — PWM (cheaper) or MPPT (more efficient, 30% more power)\\n' +
            '3. **Battery** — Lead-acid (cheaper) or lithium-ion (longer life, lighter)\\n' +
            '4. **Inverter** — Pure sine wave (for sensitive electronics) or modified sine wave\\n' +
            '5. **Mounting structure** — Roof mount, ground mount, or pole mount\\n' +
            '6. **Wiring & safety** — Cables, fuses, breakers, surge protection\\n\\n' +
            '### Basic Sizing for a Home System:\\n' +
            '- **Small system (basic)** : 100W panel, charge controller, 100Ah battery — powers 5 LED lights + phone charging (200,000-350,000 RWF)\\n' +
            '- **Medium system (family)** : 300W panels, 200Ah battery, 1000W inverter — lights, TV, radio, fridge (600,000-1,000,000 RWF)\\n' +
            '- **Large system (premium)** : 1000W+ panels, lithium battery, 3000W inverter — full home backup (2,000,000-5,000,000 RWF)',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your solar energy fundamentals.',
            [
              {
                question: 'What component converts DC electricity from solar panels to AC electricity for home use?',
                options: ['Charge controller', 'Inverter', 'Battery', 'Solar panel'],
                correctIndex: 1,
                explanation: 'The inverter converts DC electricity from solar panels/batteries to AC electricity for home appliances.',
              },
              {
                question: 'Which type of charge controller is more efficient?',
                options: ['PWM', 'MPPT', 'Both are the same', 'Neither'],
                correctIndex: 1,
                explanation: 'MPPT charge controllers are more efficient (up to 30% more power) than PWM controllers.',
              },
              {
                question: 'Rwanda government target for electrification by 2030?',
                options: ['50%', '75%', '100%', '25%'],
                correctIndex: 2,
                explanation: 'Rwanda targets 100% electrification by 2030, with both grid and off-grid solutions.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 1: Solar System Design',
            'Design a basic solar system for a typical Rwandan home.',
            'Calculate the solar system requirements for a household and design a system.',
            [
              {
                question: 'Calculate the total daily energy needs for a small Rwandan household with: 5 LED lights (10W each, 5 hours), 1 TV (60W, 4 hours), 1 phone charging (10W, 3 hours), 1 radio (15W, 4 hours). Show your calculations.',
                type: 'open',
                explanation: 'Calculate watt-hours for each device and total daily consumption.',
                points: 20,
              },
              {
                question: 'Based on your calculation, recommend a solar system (panel size, battery capacity, charge controller, inverter) and provide an estimated cost in RWF.',
                type: 'open',
                explanation: 'Show component selection rationale and total system cost.',
                points: 20,
              },
            ],
            4,
          ),
        ],
        'Understand solar energy fundamentals and design basic solar systems.',
      ),
      makeModule(
        'Module 2: Starting Your Solar Business',
        'Learn how to register, license, and set up your solar energy company in Rwanda.',
        [
          makeLesson(
            'Registering Your Solar Company in Rwanda',
            'Starting a solar business in Rwanda requires specific licenses and registrations.\\n\\n' +
            '### Steps to Register:\\n' +
            '1. **Company registration** — Register with RDB (Rwanda Development Board)\\n' +
            '2. **Tax registration** — Get TIN from RRA\\n' +
            '3. **RURA license** — Apply for energy dealer license from RURA\\n' +
            '4. **REG certification** — Register with Rwanda Energy Group as an accredited installer\\n' +
            '5. **Supplier agreements** — Partner with solar equipment suppliers\\n' +
            '6. **Insurance** — Get liability insurance (SONARWA, SORAS)\\n\\n' +
            '### Cost of Registration:\\n' +
            '- RDB company registration: 35,000-100,000 RWF\\n' +
            '- RURA energy dealer license: 50,000-200,000 RWF per year\\n' +
            '- REG certification: Free\\n' +
            '- Insurance: 50,000-100,000 RWF per year\\n' +
            'Total startup cost for licensing: under 500,000 RWF',
            'article',
            1,
            { imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Solar Products & Services to Offer',
            'Diversify your solar business with multiple product lines and services.\\n\\n' +
            '### Products to Sell:\\n' +
            '1. **Solar home systems** — Complete kits (100W, 300W, 500W, 1000W)\\n' +
            '2. **Individual components** — Panels, batteries, inverters, controllers\\n' +
            '3. **Solar water pumps** — For farmers (huge demand in rural areas)\\n' +
            '4. **Solar street lights** — For homes, businesses, compounds\\n' +
            '5. **Solar water heaters** — For hotels, homes, institutions\\n' +
            '6. **Solar fridges** — For vaccines, food preservation in off-grid areas\\n' +
            '7. **Phone charging stations** — Solar-powered phone charging kiosks\\n\\n' +
            '### Services to Offer:\\n' +
            '- Installation — System installation and commissioning\\n' +
            '- Maintenance — Cleaning panels, battery replacement, troubleshooting\\n' +
            '- Repairs — Fix faulty systems, replace components\\n' +
            '- Consulting — Energy audits, system design, feasibility studies\\n' +
            '- PAYG financing — Allow customers to pay in installments via MoMo',
            'video',
            2,
            { videoUrl: 'https://www.youtube.com/watch?v=ptd3kU284rQ', videoTitle: 'Solar Business Opportunities in Africa' },
          ),
          makeLesson(
            'Selling Solar to Rural Communities',
            'Rural Rwanda has the biggest demand for off-grid solar. Learn how to reach and sell to rural customers.\\n\\n' +
            '### Rural Sales Strategy:\\n' +
            '1. **Partner with local leaders** — Village chiefs (Umudugudu leaders) can introduce you\\n' +
            '2. **Demonstrations** — Set up a demo system in the village center\\n' +
            '3. **Referrals** — Offer commission to existing customers who refer neighbors\\n' +
            '4. **PAYG (Pay-As-You-Go)** — Customers pay daily/weekly via MoMo — affordable for rural families\\n' +
            '5. **SACCO partnerships** — Partner with local SACCOs to offer customer financing\\n\\n' +
            '### Sample PAYG Pricing (100W system):\\n' +
            '- Full price: 250,000 RWF\\n' +
            '- Down payment: 25,000 RWF (10%)\\n' +
            '- Daily payment: 500 RWF via MoMo for 12 months\\n' +
            '- Total with interest: ~325,000 RWF (30% margin)',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review solar business setup concepts.',
            [
              {
                question: 'Which regulatory body issues energy dealer licenses in Rwanda?',
                options: ['RDB', 'RURA', 'REG', 'RRA'],
                correctIndex: 1,
                explanation: 'RURA (Rwanda Utilities Regulatory Authority) issues energy dealer licenses.',
              },
              {
                question: 'What does PAYG stand for in the solar industry?',
                options: ['Pay All You Get', 'Pay-As-You-Go', 'Payment Annual Yearly Guide', 'Prepaid Annual Yield Guarantee'],
                correctIndex: 1,
                explanation: 'PAYG (Pay-As-You-Go) allows customers to pay in small daily/weekly installments via mobile money.',
              },
              {
                question: 'Which product has the highest demand in rural Rwanda?',
                options: ['Solar home systems', 'Solar water heaters', 'Large inverters', 'Industrial solar panels'],
                correctIndex: 0,
                explanation: 'Solar home systems are the most in-demand product for rural households without grid access.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Solar Business Plan',
            'Create a complete business plan for your solar energy company.',
            'Develop a solar business plan targeting a specific market segment in Rwanda.',
            [
              {
                question: 'Write a business plan for a solar energy company in Rwanda. Include: target market (rural homes, schools, businesses), products/services, pricing, startup costs, revenue projections, and marketing strategy.',
                type: 'open',
                explanation: 'Be specific about location, target customers, and how you will finance customer purchases.',
                points: 25,
              },
              {
                question: 'Design a PAYG financing plan for a 300W solar home system. Show the full price, down payment, daily/weekly payment, and total revenue over 12 months.',
                type: 'open',
                explanation: 'Show how customers can afford solar through small daily payments via MoMo.',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Register and launch a solar energy business in Rwanda.',
      ),
      makeModule(
        'Module 3: Solar Installation & After-Sales Service',
        'Master solar installation, maintenance, and building customer trust.',
        [
          makeLesson(
            'Basic Solar Installation Guide',
            'Proper installation is critical for safety and performance. This lesson covers installation best practices.\\n\\n' +
            '### Installation Steps:\\n' +
            '1. **Site assessment** — Check roof condition, sun exposure (no shading), cable routing\\n' +
            '2. **Mount panels** — Install mounting structure, tilt at 15-30 degrees facing north\\n' +
            '3. **Install controller & inverter** — Indoor, dry, ventilated location\\n' +
            '4. **Battery installation** — Ventilated area, secure from children, correct cable gauge\\n' +
            '5. **Wiring** — Use proper gauge cables, color coding (red +, black -), secure connections\\n' +
            '6. **Grounding** — Essential for safety, especially during lightning season\\n' +
            '7. **Testing** — Check voltage, current, system performance before customer handover\\n\\n' +
            '### Safety First:\\n' +
            '- Always disconnect battery before working on system\\n' +
            '- Use insulated tools\\n' +
            '- Wear rubber-soled shoes\\n' +
            '- Install fuses and breakers\\n' +
            '- Never work alone on large systems',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=D-14_NwgGL0', videoTitle: 'DIY Solar Installation - Step by Step' },
          ),
          makeLesson(
            'Maintenance & Troubleshooting',
            'Keep your customers happy with proper maintenance and fast troubleshooting.\\n\\n' +
            '### Regular Maintenance:\\n' +
            '- **Monthly**: Clean panels with water and soft cloth (especially in dry season)\\n' +
            '- **Quarterly**: Check battery water levels (for lead-acid batteries)\\n' +
            '- **Biannually**: Tighten all connections, check for corrosion\\n' +
            '- **Annually**: Full system inspection, replace worn components\\n\\n' +
            '### Common Problems & Fixes:\\n' +
            '- System not working: Check battery voltage first\\n' +
            '- Low power: Check for shading on panels, dirty panels\\n' +
            '- Battery not charging: Check charge controller settings\\n' +
            '- Inverter beeping: Low battery or overload — add more panels or reduce load\\n' +
            '- Lights flickering: Loose connection or undersized inverter',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Test installation and maintenance knowledge.',
            [
              {
                question: 'Which direction should solar panels face in Rwanda for maximum energy?',
                options: ['South', 'North', 'East', 'West'],
                correctIndex: 1,
                explanation: 'In the Southern Hemisphere (including Rwanda), solar panels face north for maximum sun exposure.',
              },
              {
                question: 'How often should solar panels be cleaned?',
                options: ['Never', 'Monthly', 'Once a year', 'Every 5 years'],
                correctIndex: 1,
                explanation: 'Solar panels should be cleaned monthly, especially during dry season when dust accumulates.',
              },
              {
                question: 'What is the first thing to check when a solar system stops working?',
                options: ['Solar panel condition', 'Battery voltage', 'Inverter display', 'Charge controller lights'],
                correctIndex: 1,
                explanation: 'Always check battery voltage first — low battery is the most common cause of system failure.',
              },
            ],
            3,
          ),
          makeAssignmentLesson(
            'Module 3: Final Solar Business Project — Earn 200,000+ RWF!',
            'Your mission: Install a real solar system and earn income!',
            '**REAL SOLAR PROJECT: Earn Your First 200,000+ RWF in 30 Days**\\n\\nChoose ONE real action:\\n\\n**Option A: Install a Solar Home System**\\nFind a neighbor or family member who wants solar.\\nSource a 100W system (250,000-350,000 RWF).\\nInstall it and charge 50,000-100,000 RWF for installation.\\n\\n**Option B: Solar Phone Charging Kiosk**\\nSet up a small solar-powered phone charging station in your area.\\nCharge 500 RWF per phone charge.\\n10 customers/day = 5,000 RWF/day = 150,000 RWF/month!\\n\\n**Option C: Solar Maintenance Service**\\nVisit 10 homes/businesses with existing solar systems.\\nOffer cleaning and maintenance for 20,000 RWF each.\\n10 clients = 200,000 RWF!\\n\\n**🎯 Quick access links:** [REG Rwanda](https://www.reg.rw) | [RURA](https://www.rura.rw) | [RDB](https://rdb.rw) | [Solar Supplier Search](https://www.alibaba.com)\\n\\n**🎯 Target: 200,000+ RWF in 30 days!**\\n\\n![Solar business](https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=500)',
            [
              { question: 'YOUR SOLAR SERVICE: What service did you provide? Installation, kiosk, or maintenance? Describe what you did.', type: 'open', explanation: 'Describe the service, the customer, and the outcome.', points: 20 },
              { question: 'FINANCIALS: Revenue? Cost of equipment? Profit? Number of customers?', type: 'open', explanation: 'Show accurate numbers from your solar business.', points: 20 },
              { question: 'CHALLENGES: What was the hardest part? What did you learn?', type: 'open', explanation: 'Share lessons learned for future solar entrepreneurs.', points: 15 },
              { question: 'SCALE: How would you grow to 500,000+ RWF/month? More customers? More products? Employees?', type: 'open', explanation: 'Show your scaling strategy.', points: 20 },
            ],
            5,
          ),
        ],
        'Install, maintain, and grow a profitable solar energy business.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 4: Fashion & Textile Business in Africa
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Fashion & Textile Business: From Tailor to Brand Owner in Rwanda',
    description:
      '👗 African fashion is having a global moment — and Rwanda is at the center of it. ' +
      'From traditional Kitenge fabrics to modern couture, the fashion industry in Rwanda ' +
      'offers huge opportunities for creative entrepreneurs.\\n\\n' +
      'This course teaches you how to start and grow a fashion business in Rwanda — ' +
      'whether you are a tailor, designer, fabric trader, or someone who wants to launch ' +
      'a clothing brand. Learn to design, produce, market, and sell fashion products ' +
      'locally and internationally.\\n\\n' +
      '### 🎯 What You Will Learn\\n' +
      '- **Fashion Design Basics** — Sketching, pattern making, sewing techniques\\n' +
      '- **Sourcing Fabrics** — Kitenge, cotton, linen — where to buy in Rwanda and import\\n' +
      '- **Production** — Tailoring, quality control, scaling production\\n' +
      '- **Brand Building** — Creating your fashion brand identity\\n' +
      '- **Marketing** — Selling on Instagram, at markets, to boutiques\\n' +
      '- **Business Management** — Pricing, customers, finances, growth\\n\\n' +
      '### 🧰 Your Fashion Business Toolbox\\n' +
      '| Tool | Purpose | Cost | Sign Up |\\n' +
      '|---|---|---|---|\\n' +
      '| Canva | Design logos, lookbooks, social media graphics | Free tier | [canva.com](https://www.canva.com) |\\n' +
      '| Instagram | Showcase your designs, attract customers | Free | [instagram.com](https://www.instagram.com) |\\n' +
      '| WhatsApp Business | Customer orders, inquiries | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |\\n' +
      '| Etsy | Sell to international customers | $0.20/listing | [etsy.com](https://www.etsy.com) |\\n' +
      '| Jumia Fashion | Sell clothes online in Rwanda | Commission | [jumia.co.rw](https://www.jumia.co.rw) |\\n' +
      '| Sewing Machine | Basic production equipment | 200,000-800,000 RWF | Local suppliers |\\n' +
      '| Kimironko Market | Fabric shopping in Kigali | Cash | Visit in person |\\n' +
      '| PayPal | Receive international payments | 2.9% + $0.30 | [paypal.com](https://www.paypal.com) |',
    category: 'Fashion & Design',
    level: 'Beginner',
    price: 1000,
    searchImage: 'african fashion textile design kitenge rwanda',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Fashion Industry in Rwanda',
        'Understand the fashion ecosystem in Rwanda — opportunities, challenges, and key players.',
        [
          makeLesson(
            'The Fashion Opportunity in Rwanda',
            'Rwanda fashion industry is growing rapidly. Kigali Fashion Week, Rwanda Fashion Week, ' +
            'and a growing middle class with disposable income are driving demand. Local designers like ' +
            'Malaika By Moni, Uruhair, and Ikirezi are gaining international recognition.\\n\\n' +
            '### Fashion Industry in Rwanda:\\n' +
            '- Over 50,000 tailors and seamstresses in Rwanda\\n' +
            '- Growing demand for ready-to-wear African fashion\\n' +
            '- Government support through Made in Rwanda policy\\n' +
            '- Export potential to EAC, US (AGOA), and Europe\\n' +
            '- Fashion tourism — visitors buying African designs as souvenirs\\n\\n' +
            '### Key Fashion Segments:\\n' +
            '1. **Traditional wear** — Umushanana (women), ingredients (men) — ceremonies, weddings\\n' +
            '2. **Ready-to-wear** — Everyday African fashion for work and social\\n' +
            '3. **Custom/tailoring** — Made-to-measure clothing\\n' +
            '4. **Accessories** — Jewelry, bags, shoes, headwraps\\n' +
            '5. **Fabric trading** — Selling Kitenge, cotton, linen, lace',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=_mhREK2XEGk', videoTitle: 'African Fashion Industry - Opportunities' },
          ),
          makeLesson(
            'Fabrics & Materials Guide',
            'Understanding fabrics is essential for any fashion business. Learn about the most popular fabrics in Rwanda.\\n\\n' +
            '### Popular Fabrics in Rwanda:\\n' +
            '1. **Kitenge** — Colorful African wax print cotton, most popular\\n' +
            '2. **Cotton** — Comfortable, breathable, for casual and formal wear\\n' +
            '3. **Linen** — Lightweight, for warm weather\\n' +
            '4. **Silk** — Luxury, for special occasions\\n' +
            '5. **Lace** — Elegant, for ceremonies and evening wear\\n' +
            '6. **Denim** — Jeans, jackets, durable\\n\\n' +
            '### Where to Buy Fabric in Rwanda:\\n' +
            '- **Kimironko Market** (Kigali) — Largest fabric selection, negotiate prices\\n' +
            '- **Nyabugogo Market** — Wholesale fabrics, cheaper than retail\\n' +
            '- **Remera fabric shops** — Higher quality, imported fabrics\\n' +
            '- **Import from Kenya** — Nairobi has huge fabric markets (20,000-30,000 RWF/meter)\\n' +
            '- **Import from China/India** — Via Alibaba, minimum order 50+ meters',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Fashion Business Models in Rwanda',
            'There are multiple ways to make money in fashion. Choose the business model that fits your skills and capital.\\n\\n' +
            '### Fashion Business Models:\\n' +
            '| Model | Starter Capital | Skills Needed | Monthly Revenue Potential |\\n' +
            '|---|---|---|---|\\n' +
            '| Tailoring (custom orders) | 300,000-500,000 RWF | Sewing, measuring | 200,000-800,000 RWF |\\n' +
            '| Ready-to-wear brand | 1,000,000-3,000,000 RWF | Design, production | 500,000-2,000,000 RWF |\\n' +
            '| Fabric trading | 500,000-2,000,000 RWF | Sourcing, negotiation | 300,000-1,500,000 RWF |\\n' +
            '| Fashion accessories | 200,000-500,000 RWF | Crafting, design | 150,000-600,000 RWF |\\n' +
            '| Fashion blog/media | 100,000-300,000 RWF | Photography, writing | 50,000-300,000 RWF |\\n' +
            '| Fashion rental | 2,000,000-5,000,000 RWF | Inventory management | 500,000-2,000,000 RWF |',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test your fashion industry knowledge.',
            [
              {
                question: 'Which market in Kigali has the largest fabric selection?',
                options: ['Nyabugogo Market', 'Kimironko Market', 'Remera Market', 'Downtown Kigali'],
                correctIndex: 1,
                explanation: 'Kimironko Market has the largest selection of fabrics in Kigali.',
              },
              {
                question: 'What is Kitenge?',
                options: ['A type of sewing machine', 'Colorful African wax print cotton fabric', 'A Rwandan fashion designer', 'A traditional hat'],
                correctIndex: 1,
                explanation: 'Kitenge is a colorful African wax print cotton fabric, the most popular fabric in East Africa.',
              },
              {
                question: 'Which fashion business model requires the least startup capital?',
                options: ['Fashion rental business', 'Fashion blog/media', 'Ready-to-wear brand', 'Fabric trading'],
                correctIndex: 1,
                explanation: 'Fashion blogging/media requires the least startup capital (100,000-300,000 RWF for a phone and basic equipment).',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: Fashion Market Research',
            'Research and analyze the fashion market in Rwanda.',
            'Identify a fashion niche and analyze the competition and opportunity.',
            [
              {
                question: 'Choose one fashion segment in Rwanda (e.g., traditional wear, ready-to-wear, accessories). Research the market size, target customers, competitors, and pricing. Write a one-page market analysis.',
                type: 'open',
                explanation: 'Include: competitor names, price ranges, target demographics, and gaps in the market.',
                points: 20,
              },
              {
                question: 'Identify 3 local fashion brands or tailors in Rwanda. Analyze their styles, pricing, target customers, and social media presence. What can you learn from them?',
                type: 'open',
                explanation: 'Research real Rwandan fashion brands and provide URLs or Instagram handles if possible.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Understand the fashion industry in Rwanda and choose a business model.',
      ),
      makeModule(
        'Module 2: Design, Production & Brand Building',
        'Learn fashion design basics, production processes, and how to build a brand.',
        [
          makeLesson(
            'Fashion Design Basics for Beginners',
            'You do not need formal design training to start! This lesson covers the essentials of fashion design.\\n\\n' +
            '### Design Process:\\n' +
            '1. **Inspiration** — Look at magazines, Instagram, Pinterest, nature, culture\\n' +
            '2. **Sketching** — Draw your ideas (or work with a designer who can sketch)\\n' +
            '3. **Pattern making** — Create templates for cutting fabric (or use existing patterns)\\n' +
            '4. **Fabric selection** — Choose fabric type, color, pattern, texture\\n' +
            '5. **Sampling** — Create a sample garment to test fit and design\\n' +
            '6. **Production** — Cut fabric, sew, finish (buttons, zippers, hems)\\n' +
            '7. **Quality check** — Check stitching, fit, finishing\\n\\n' +
            '### Tools You Need:\\n' +
            '- Sewing machine (industrial: 500,000-800,000 RWF or home: 200,000-400,000 RWF)\\n' +
            '- Measuring tape, scissors, pins, needles, thread\\n' +
            '- Iron and ironing board\\n' +
            '- Dress form/mannequin (50,000-150,000 RWF)\\n' +
            '- Cutting table or large flat surface',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=adkb2iRaTRY', videoTitle: 'Fashion Design for Beginners - Complete Guide' },
          ),
          makeLesson(
            'Building Your Fashion Brand',
            'A fashion brand is more than just clothes — it is an identity. Learn to create a brand that customers love and remember.\\n\\n' +
            '### Brand Elements:\\n' +
            '1. **Brand name** — Unique, memorable, easy to pronounce\\n' +
            '2. **Logo** — Simple, recognizable (design with Canva)\\n' +
            '3. **Brand story** — Your mission, inspiration, what makes you different\\n' +
            '4. **Target customer** — Who are you designing for? Age, style, budget\\n' +
            '5. **Price positioning** — Budget, mid-range, or luxury?\\n' +
            '6. **Visual identity** — Colors, fonts, photography style\\n\\n' +
            '### Brand Story Example:\\n' +
            '\"I design modern African fashion for confident women who want to celebrate their heritage ' +
            'while looking professional. Every piece is handmade in Kigali using ethically sourced Kitenge fabric.\"',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Production & Quality Control',
            'Consistent quality is what separates successful fashion brands from hobbyists.\\n\\n' +
            '### Production Process:\\n' +
            '1. **Order management** — Track orders from customers (use spreadsheet or notebook)\\n' +
            '2. **Fabric cutting** — Cut multiple pieces at once for efficiency\\n' +
            '3. **Assembly line** — Divide tasks among tailors (one cuts, one sews, one finishes)\\n' +
            '4. **Quality checks** — Inspect every piece at each stage\\n' +
            '5. **Packaging** — Fold neatly, tag with size/care instructions, bag\\n' +
            '6. **Delivery** — Arrange delivery or customer pickup\\n\\n' +
            '### Pricing Your Products:\\n' +
            'Simple formula: (Materials + Labor + Overhead) × 2 = Wholesale Price\\n' +
            'Wholesale Price × 2 = Retail Price\\n' +
            'Example: 20,000 (materials) + 10,000 (labor) + 5,000 (overhead) = 35,000 × 2 = 70,000 wholesale, 140,000 retail',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review design, brand, and production concepts.',
            [
              {
                question: 'What is the first step in the fashion design process?',
                options: ['Cutting fabric', 'Inspiration & sketching', 'Sewing', 'Packaging'],
                correctIndex: 1,
                explanation: 'The design process starts with finding inspiration and sketching your ideas.',
              },
              {
                question: 'What is the recommended markup from wholesale to retail price?',
                options: ['1.5x', '2x', '3x', '4x'],
                correctIndex: 1,
                explanation: 'Standard fashion retail pricing is 2x the wholesale price (keystone markup).',
              },
              {
                question: 'Which Canva feature can help build your fashion brand?',
                options: ['Video editing', 'Logo design', 'Spreadsheets', 'Email sending'],
                correctIndex: 1,
                explanation: 'Canva has logo design, social media graphics, and branding templates perfect for fashion brands.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Fashion Brand Development',
            'Create your fashion brand identity.',
            'Develop a complete brand identity for your fashion business.',
            [
              {
                question: 'Define your fashion brand: brand name, brand story (2-3 sentences), target customer (age, style, income), and price positioning (budget/mid-range/luxury).',
                type: 'open',
                explanation: 'Be specific about your target customer and what makes your brand unique.',
                points: 20,
              },
              {
                question: 'Design your first collection. Describe 5 outfits/pieces with fabric choices, colors, estimated costs, and retail prices. Include a sketch description for each.',
                type: 'open',
                explanation: 'Show your design process and pricing strategy for each piece.',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Design, produce, and build a recognizable fashion brand.',
      ),
      makeModule(
        'Module 3: Selling Fashion & Growing Your Business',
        'Learn how to market, sell, and scale your fashion business in Rwanda and beyond.',
        [
          makeLesson(
            'Selling Fashion Online & Offline',
            'Rwandan fashion sells through multiple channels. Learn to use each effectively.\\n\\n' +
            '### Sales Channels:\\n' +
            '1. **Instagram** — Post daily photos and videos of your designs, use hashtags #RwandaFashion #KigaliStyle\\n' +
            '2. **WhatsApp** — Send catalogs to customers, take orders, share new arrivals\\n' +
            '3. **Pop-up markets** — Kigali Fashion Market, Rwanda Fashion Week, local bazaars\\n' +
            '4. **Boutiques** — Consign your designs to established boutiques in Kigali\\n' +
            '5. **Etsy/Fair** — Sell to international customers who love African fashion\\n' +
            '6. **Website/Shopify** — Own online store for direct sales\\n\\n' +
            '### Instagram Growth Tips:\\n' +
            '- Post 2-3 times daily (product photos, behind-the-scenes, customer photos)\\n' +
            '- Use Reels for maximum reach\\n' +
            '- Engage with followers — reply to comments and DMs\\n' +
            '- Collaborate with local influencers and models\\n' +
            '- Use relevant hashtags: #RwandaFashion #MadeInRwanda #AfricanDesigner #Kigali',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=5G9Jqz7P9dI', videoTitle: 'How to Start a Fashion Brand - Marketing Guide' },
          ),
          makeLesson(
            'Managing Customers & Orders',
            'Great customer experience leads to repeat business and referrals.\\n\\n' +
            '### Customer Management System:\\n' +
            '1. **Order form** — Use Google Forms or a notebook to track orders\\n' +
            '2. **Measurement guide** — Send customers clear instructions for measurements\\n' +
            '3. **Deposit** — Ask for 50% deposit before starting production\\n' +
            '4. **Timeline** — Give realistic delivery dates (add 2-3 days buffer)\\n' +
            '5. **Fitting** — Offer one fitting session for custom garments\\n' +
            '6. **Delivery** — Deliver on time or communicate delays early\\n' +
            '7. **Follow-up** — Ask for feedback and photos of them wearing your design\\n\\n' +
            '### Handling Difficult Customers:\\n' +
            '- Listen without interrupting\\n' +
            '- Apologize sincerely for any issues\\n' +
            '- Offer solutions: alteration, exchange, or partial refund\\n' +
            '- Learn from the feedback to improve',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Scaling Your Fashion Business',
            'Once you have a steady stream of customers, it is time to scale.\\n\\n' +
            '### Scaling Strategies:\\n' +
            '1. **Hire tailors** — Train and employ 2-5 tailors to increase production\\n' +
            '2. **Standardize sizes** — Move from custom-only to ready-to-wear (S, M, L, XL)\\n' +
            '3. **Wholesale** — Sell to boutiques and other retailers at wholesale prices\\n' +
            '4. **Export** — Ship to customers in EAC, US (AGOA), and Europe\\n' +
            '5. **Online store** — Launch a Shopify or Etsy store for 24/7 sales\\n' +
            '6. **Fashion shows** — Participate in Kigali Fashion Week for exposure\\n\\n' +
            '### Exporting Fashion from Rwanda:\\n' +
            '- AGOA (African Growth and Opportunity Act): Duty-free exports to US\\n' +
            '- EAC: Free trade within East African Community\\n' +
            '- EPA (Economic Partnership Agreement): Preferential access to EU\\n' +
            '- Contact RDB for export assistance and trade missions',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review fashion selling and growth concepts.',
            [
              {
                question: 'What percentage deposit should you ask for before starting production?',
                options: ['10%', '25%', '50%', '100%'],
                correctIndex: 2,
                explanation: 'Asking for 50% deposit covers your material costs and secures the customer commitment.',
              },
              {
                question: 'Which trade agreement allows duty-free exports from Rwanda to the US?',
                options: ['EAC', 'AGOA', 'EPA', 'WTO'],
                correctIndex: 1,
                explanation: 'AGOA (African Growth and Opportunity Act) allows duty-free exports from eligible African countries to the US.',
              },
              {
                question: 'What is the most effective social media platform for selling fashion in Rwanda?',
                options: ['LinkedIn', 'Instagram', 'Twitter', 'TikTok'],
                correctIndex: 1,
                explanation: 'Instagram is the most effective platform for fashion because it is visual and allows product tagging.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Final Fashion Project — Earn 150,000+ RWF!',
            'Your mission: Create and sell real fashion products!',
            '**REAL FASHION PROJECT: Earn Your First 150,000+ RWF in 30 Days**\\n\\nChoose ONE path:\\n\\n**Path A: Custom Orders**\\nTake orders for 5 custom pieces (shirts, dresses, skirts).\\nCharge 30,000-50,000 RWF each.\\n5 orders × 40,000 = 200,000 RWF!\\n\\n**Path B: Ready-to-Wear**\\nProduce 10 simple dresses or shirts in standard sizes.\\nSell at a market, on Instagram, or to friends.\\nPrice at 25,000-35,000 RWF each.\\n10 items × 30,000 = 300,000 RWF!\\n\\n**Path C: Fashion Accessories**\\nMake 20 bead necklaces, earrings, or headwraps.\\nSell at 5,000-15,000 RWF each.\\n20 items × 10,000 = 200,000 RWF!\\n\\n**🎯 Quick access links:** [Canva](https://www.canva.com) | [Etsy](https://www.etsy.com) | [Instagram](https://www.instagram.com) | [RDB Rwanda](https://rdb.rw)\\n\\n**🎯 Target: 150,000+ RWF in 30 days!**\\n\\n![Fashion business](https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800&h=500)',
            [
              { question: 'YOUR FASHION PRODUCTS: What did you create? Custom orders, ready-to-wear, or accessories? Describe your products and target customers.', type: 'open', explanation: 'Share photos or detailed descriptions of what you made.', points: 20 },
              { question: 'SALES RESULTS: How many items did you sell? Total revenue? Cost of materials? Net profit?', type: 'open', explanation: 'Show real numbers from your fashion business.', points: 20 },
              { question: 'MARKETING: How did you find customers? Instagram? Word of mouth? Market stall? What worked best?', type: 'open', explanation: 'Share your customer acquisition strategy and results.', points: 15 },
              { question: 'NEXT STEPS: How will you grow this into a sustainable fashion brand? Revenue target for next 3 months?', type: 'open', explanation: 'Show your growth strategy for scaling your fashion business.', points: 20 },
            ],
            5,
          ),
        ],
        'Market, sell, and scale a profitable fashion business in Rwanda.',
      ),
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // COURSE 5: Health & Wellness Entrepreneurship
  // ──────────────────────────────────────────────────────────────────────────
  {
    title: 'Health & Wellness Business: Clinics, Fitness & Healing in Rwanda',
    description:
      '🏥 Rwanda healthcare sector is growing rapidly — with government investment in universal health coverage, ' +
      'a growing middle class willing to pay for quality care, and increasing demand for wellness services ' +
      '(fitness, nutrition, mental health).\\n\\n' +
      'This course teaches you how to start a health or wellness business in Rwanda. Whether you want to ' +
      'open a clinic, start a fitness center, offer nutrition coaching, or launch a health product brand — ' +
      'this course gives you practical, locally-relevant guidance.\\n\\n' +
      '### 🎯 What You Will Learn\\n' +
      '- **Healthcare Business** — Opening a clinic, pharmacy, or diagnostic center\\n' +
      '- **Fitness & Wellness** — Starting a gym, fitness coaching, yoga studio\\n' +
      '- **Nutrition Business** — Meal planning, healthy food delivery, supplements\\n' +
      '- **Mental Health** — Counseling services, wellness coaching\\n' +
      '- **Health Products** — Natural soaps, essential oils, herbal remedies\\n' +
      '- **Regulations** — Ministry of Health licensing, Rwanda Medical Council, standards\\n\\n' +
      '### 🧰 Your Health Business Toolbox\\n' +
      '| Tool | Purpose | Cost | Sign Up |\\n' +
      '|---|---|---|---|\\n' +
      '| Ministry of Health | Healthcare facility licensing | Free info | [moh.gov.rw](https://www.moh.gov.rw) |\\n' +
      '| Rwanda Medical Council | Professional licensing | Varies | [rwandamedicalcouncil.rw](https://www.rwandamedicalcouncil.rw) |\\n' +
      '| RDB | Company registration | 35,000 RWF | [rdb.rw](https://rdb.rw) |\\n' +
      '| RSB | Product certification | Varies | [rsb.gov.rw](https://www.rsb.gov.rw) |\\n' +
      '| WhatsApp Business | Client communication | Free | [whatsapp.com/business](https://www.whatsapp.com/business) |\\n' +
      '| Instagram | Fitness/wellness marketing | Free | [instagram.com](https://www.instagram.com) |\\n' +
      '| MyFitnessPal | Nutrition tracking app | Free | [myfitnesspal.com](https://www.myfitnesspal.com) |\\n' +
      '| MoMo Merchant | Payment collection | 0.5-1% fee | [mtn.co.rw](https://www.mtn.co.rw) |',
    category: 'Health & Wellness',
    level: 'Beginner',
    price: 1000,
    searchImage: 'health wellness africa fitness clinic rwanda',
    isFeatured: true,
    modules: [
      makeModule(
        'Module 1: Healthcare Business Opportunities in Rwanda',
        'Explore the healthcare landscape in Rwanda and identify business opportunities.',
        [
          makeLesson(
            'Rwanda Healthcare System Overview',
            'Rwanda has one of the best healthcare systems in Africa — with universal health coverage ' +
            'through Mutuelle de Santé, over 500 health centers, and a growing private sector.\\n\\n' +
            '### Healthcare by Level:\\n' +
            '1. **Health centers** — Basic primary care,遍布 throughout the country\\n' +
            '2. **District hospitals** — 42 district hospitals, referral for health centers\\n' +
            '3. **Referral hospitals** — CHUK, KFH, King Faisal — advanced care\\n' +
            '4. **Private clinics** — Growing rapidly in Kigali and major towns\\n' +
            '5. **Pharmacies** — Over 500 registered pharmacies nationwide\\n\\n' +
            '### Business Opportunities:\\n' +
            '- Private clinic (general practice or specialist)\\n' +
            '- Pharmacy or drug shop\\n' +
            '- Diagnostic lab (blood tests, imaging)\\n' +
            '- Dental clinic\\n' +
            '- Optical shop (eyeglasses, eye exams)\\n' +
            '- Maternity/home care services\\n' +
            '- Medical equipment supply',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=YiVTKOI18vk', videoTitle: 'Rwanda Healthcare System Explained' },
          ),
          makeLesson(
            'Licensing & Regulation for Health Businesses',
            'Health businesses in Rwanda require specific licenses from multiple regulatory bodies.\\n\\n' +
            '### Licenses Needed:\\n' +
            '1. **Company registration** — RDB\\n' +
            '2. **Healthcare facility license** — Ministry of Health/Rwanda Medical Council\\n' +
            '3. **Pharmacy license** — Rwanda Food and Drugs Authority (RFDA)\\n' +
            '4. **Professional license** — For doctors, nurses, midwives\\n' +
            '5. **RSB certification** — For health products (soaps, supplements)\\n' +
            '6. **RRA tax registration** — For all businesses\\n\\n' +
            '### Requirements for a Private Clinic:\\n' +
            '- Registered medical professional (doctor, nurse) as lead\\n' +
            '- Minimum facility standards (consultation room, treatment room, waiting area)\\n' +
            '- Basic medical equipment (weighing scale, thermometer, blood pressure monitor)\\n' +
            '- Infection control measures\\n' +
            '- Medical waste management plan\\n' +
            '- Liability insurance',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Pharmacy & Drug Shop Business',
            'Pharmacies are one of the most profitable health businesses in Rwanda.\\n\\n' +
            '### Types of Pharmacy Licenses:\\n' +
            '1. **Class A pharmacy** — Full pharmacy, can sell all medicines, must have qualified pharmacist\\n' +
            '2. **Class B drug shop** — Sells over-the-counter medicines only, lower licensing requirements\\n' +
            '3. **Hospital pharmacy** — Attached to a healthcare facility\\n\\n' +
            '### Starting a Drug Shop (Class B):\\n' +
            '- Capital needed: 2,000,000-5,000,000 RWF\\n' +
            '- Location: Near a health center or busy market area\\n' +
            '- Staff: Nurse or pharmacy technician\\n' +
            '- Products: Painkillers, antimalarials, antibiotics (limited), first aid supplies\\n' +
            '- Monthly revenue: 300,000-1,000,000 RWF\\n' +
            '- Profit margin: 15-30%\\n\\n' +
            '### Sources of Medicines:\\n' +
            '- **Medical Stores Department (MSD)** — Government wholesaler, competitive prices\\n' +
            '- **Private wholesalers** — Codipharma, Pharmacie Bon Pasteur, others\\n' +
            '- **Import** — From Kenya, India, China (requires RFDA approval)',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 1: Knowledge Check',
            'Test healthcare business knowledge.',
            [
              {
                question: 'Which government agency licenses healthcare facilities in Rwanda?',
                options: ['RDB', 'Ministry of Health', 'RURA', 'RSB'],
                correctIndex: 1,
                explanation: 'The Ministry of Health, through Rwanda Medical Council, licenses healthcare facilities.',
              },
              {
                question: 'What is the minimum startup capital for a Class B drug shop in Rwanda?',
                options: ['200,000 RWF', '2,000,000-5,000,000 RWF', '10,000,000 RWF', '50,000,000 RWF'],
                correctIndex: 1,
                explanation: 'A Class B drug shop typically requires 2-5 million RWF to start with inventory and licensing.',
              },
              {
                question: 'What is Mutuelle de Santé in Rwanda?',
                options: ['A private health insurance', 'Community-based health insurance', 'A pharmacy chain', 'A hospital'],
                correctIndex: 1,
                explanation: 'Mutuelle de Santé is Rwanda community-based health insurance program providing universal coverage.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 1: Healthcare Business Research',
            'Research and analyze a healthcare business opportunity in Rwanda.',
            'Identify a healthcare business opportunity and analyze the market potential.',
            [
              {
                question: 'Choose one healthcare business opportunity (clinic, pharmacy, diagnostic lab, dental). Research the licensing requirements, startup costs, target market, and revenue potential. Write a one-page analysis.',
                type: 'open',
                explanation: 'Include: license fees, location requirements, equipment costs, staffing needs.',
                points: 20,
              },
              {
                question: 'Identify a gap in healthcare services in your community. What service is needed but not available? How would you fill this gap?',
                type: 'open',
                explanation: 'Consider: dental, eye care, maternity, mental health, physiotherapy, or specialized clinics.',
                points: 15,
              },
            ],
            5,
          ),
        ],
        'Identify and evaluate healthcare business opportunities in Rwanda.',
      ),
      makeModule(
        'Module 2: Fitness & Wellness Business',
        'Start a fitness center, coaching business, or wellness studio in Rwanda.',
        [
          makeLesson(
            'Starting a Gym or Fitness Center',
            'Rwandans are increasingly health-conscious. Gyms are popping up across Kigali and major towns. ' +
            'This lesson covers how to start a fitness business.\\n\\n' +
            '### Types of Fitness Businesses:\\n' +
            '1. **Full gym** — Cardio machines, weights, classes — 5,000,000-20,000,000 RWF startup\\n' +
            '2. **Outdoor bootcamp** — Minimal equipment, park-based — 500,000-1,000,000 RWF startup\\n' +
            '3. **Yoga/Pilates studio** — Mats, props, serene space — 2,000,000-5,000,000 RWF\\n' +
            '4. **Personal training** — One-on-one coaching, no facility needed — 100,000 RWF (certification)\\n' +
            '5. **Dance fitness** — Zumba, Afro-dance classes — 200,000-500,000 RWF\\n\\n' +
            '### Equipment for a Basic Gym:\\n' +
            '- Treadmill: 1,500,000-3,000,000 RWF\\n' +
            '- Dumbbell set: 500,000-1,000,000 RWF\\n' +
            '- Bench press: 300,000-600,000 RWF\\n' +
            '- Exercise mats: 20,000-50,000 RWF each\\n' +
            '- Sound system: 200,000-500,000 RWF\\n' +
            '- Mirrors: 100,000-300,000 RWF\\n\\n' +
            '### Pricing (Monthly Memberships):\\n' +
            '- Budget gym: 30,000-50,000 RWF/month\\n' +
            '- Mid-range gym: 50,000-100,000 RWF/month\\n' +
            '- Premium gym: 100,000-200,000 RWF/month\\n' +
            '- Yoga studio: 40,000-80,000 RWF/month\\n' +
            '- Personal training: 10,000-25,000 RWF/session',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=Kq33s-Ef_d8', videoTitle: 'How to Start a Gym Business - Guide' },
          ),
          makeLesson(
            'Nutrition & Meal Planning Business',
            'Healthy eating is a growing trend in Rwanda. From meal prep services to nutrition coaching, ' +
            'this sector has huge potential.\\n\\n' +
            '### Nutrition Business Ideas:\\n' +
            '1. **Healthy meal delivery** — Prepare and deliver nutritious meals to offices and homes\\n' +
            '2. **Nutrition coaching** — One-on-one counseling (requires certification)\\n' +
            '3. **Meal planning** — Custom weekly meal plans for clients\\n' +
            '4. **Healthy snacks** — Produce and sell energy bars, dried fruit, smoothies\\n' +
            '5. **Detox programs** — Juice cleanses, detox plans\\n\\n' +
            '### Starting Meal Delivery:\\n' +
            '- Startup cost: 500,000-1,500,000 RWF (kitchen equipment, packaging)\\n' +
            '- Pricing: 5,000-8,000 RWF per meal (breakfast/lunch/dinner)\\n' +
            '- Target: Office workers in Kigali who want healthy lunch options\\n' +
            '- Average order: 5-10 meals per week per customer\\n' +
            '- Monthly revenue potential: 1,000,000-3,000,000 RWF with 20-30 customers\\n\\n' +
            '### Nutrition Certification in Rwanda:\\n' +
            '- University of Rwanda — Bachelor in Nutrition\\n' +
            '- INES Ruhengeri — Nutrition and Dietetics\\n' +
            '- Online certifications — ISSA, NASM (international, recognized globally)',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeLesson(
            'Mental Health & Wellness Coaching',
            'Mental health awareness is growing in Rwanda. After the 1994 Genocide against the Tutsi, ' +
            'mental health services have become increasingly important.\\n\\n' +
            '### Mental Health Business Opportunities:\\n' +
            '1. **Counseling practice** — Individual and group therapy\\n' +
            '2. **Wellness coaching** — Life coaching, stress management, work-life balance\\n' +
            '3. **Support groups** — Facilitate groups for specific issues (grief, anxiety, parenting)\\n' +
            '4. **Corporate wellness** — Offer mental health services to companies\\n' +
            '5. **Online therapy** — Provide counseling via Zoom or phone\\n\\n' +
            '### Licensing for Mental Health Practice:\\n' +
            '- Psychology degree (Master level recommended)\\n' +
            '- Registration with Rwanda Psychology Council\\n' +
            '- Minimum 2 years supervised practice\\n' +
            '- Continuing education requirements\\n\\n' +
            '### Pricing for Counseling:\\n' +
            '- Individual session: 20,000-50,000 RWF\\n' +
            '- Group session: 10,000-20,000 RWF per person\\n' +
            '- Corporate wellness: 200,000-500,000 RWF/month\\n' +
            '- Online session: 20,000-30,000 RWF',
            'article',
            3,
            { imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 2: Knowledge Check',
            'Review fitness and wellness business concepts.',
            [
              {
                question: 'Which fitness business has the lowest startup cost?',
                options: ['Full gym', 'Outdoor bootcamp', 'Yoga studio', 'Dance fitness studio'],
                correctIndex: 1,
                explanation: 'Outdoor bootcamps require minimal equipment (500,000-1,000,000 RWF) and no facility rental.',
              },
              {
                question: 'What is a good price for a healthy meal delivery in Kigali?',
                options: ['2,000 RWF', '5,000-8,000 RWF per meal', '15,000-20,000 RWF per meal', '500 RWF'],
                correctIndex: 1,
                explanation: '5,000-8,000 RWF per meal is competitive and profitable for meal delivery in Kigali.',
              },
              {
                question: 'Which council regulates mental health professionals in Rwanda?',
                options: ['Rwanda Medical Council', 'Rwanda Psychology Council', 'Rwanda Nursing Council', 'Ministry of Education'],
                correctIndex: 1,
                explanation: 'The Rwanda Psychology Council regulates mental health professionals in Rwanda.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 2: Fitness/Wellness Business Plan',
            'Create a business plan for a fitness or wellness business.',
            'Develop a complete business plan for a fitness, nutrition, or mental health business.',
            [
              {
                question: 'Write a business plan for a fitness or wellness business in Rwanda. Include: concept, target market, pricing, startup costs, revenue projections, and marketing strategy.',
                type: 'open',
                explanation: 'Be specific about location, equipment, pricing, and how you will attract customers.',
                points: 25,
              },
              {
                question: 'Create a sample weekly schedule (for a gym) OR a sample 7-day meal plan (for nutrition) OR a sample counseling intake form (for mental health).',
                type: 'open',
                explanation: 'Show how you will deliver your service to customers on a daily/weekly basis.',
                points: 20,
              },
            ],
            5,
          ),
        ],
        'Start and operate a fitness, nutrition, or wellness business in Rwanda.',
      ),
      makeModule(
        'Module 3: Health Products & Natural Remedies',
        'Create and sell health products — natural soaps, essential oils, herbal remedies, and more.',
        [
          makeLesson(
            'Starting a Natural Soap & Cosmetics Business',
            'Rwandans increasingly prefer natural, locally-made personal care products. This is a low-cost, high-margin business.\\n\\n' +
            '### Popular Natural Products:\\n' +
            '1. **Black soap** — Traditional Rwandan soap, popular for skin care\\n' +
            '2. **Shea butter** — Moisturizer, made from shea nuts\\n' +
            '3. **Essential oils** — Lavender, eucalyptus, tea tree (for aromatherapy)\\n' +
            '4. **Herbal teas** — Ginger, lemon, moringa, hibiscus\\n' +
            '5. **Natural lotions** — Cocoa butter, coconut oil based\\n' +
            '6. **Lip balms** — Beeswax based, flavored\\n\\n' +
            '### Starting Production:\\n' +
            '- Capital: 200,000-500,000 RWF for initial supplies\\n' +
            '- Equipment: Mixing bowls, molds, stove, thermometer, packaging (available locally)\\n' +
            '- Ingredients: Sourcing from local markets or import\\n' +
            '- RSB certification: Required for commercial sale\\n' +
            '- Profit margin: 50-200% (e.g., soap costs 500 RWF to make, sells for 1,500-3,000 RWF)\\n\\n' +
            '### Sales Channels:\\n' +
            '- Instagram and WhatsApp\\n' +
            '- Local markets and bazaars\\n' +
            '- Boutiques and gift shops\\n' +
            '- Hotels (sell to spas and gift shops)\\n' +
            '- Export to EAC countries',
            'video',
            1,
            { videoUrl: 'https://www.youtube.com/watch?v=kT6q5EX3NnA', videoTitle: 'How to Start a Natural Soap Business' },
          ),
          makeLesson(
            'Herbal & Traditional Medicine Business',
            'Rwanda has a rich tradition of herbal medicine. Many Rwandans use traditional remedies ' +
            'alongside modern medicine. This sector is regulated but offers business opportunities.\\n\\n' +
            '### Rules for Herbal Medicine Business:\\n' +
            '- Products must be registered with RFDA (Rwanda Food and Drugs Authority)\\n' +
            '- Cannot make claims about curing specific diseases without clinical evidence\\n' +
            '- Must list all ingredients and their concentrations\\n' +
            '- Must have proper labeling in Kinyarwanda and English\\n' +
            '- Must follow good manufacturing practices\\n\\n' +
            '### Popular Herbal Products in Rwanda:\\n' +
            '- **Umubilizi** — Traditional herb for stomach issues\\n' +
            '- **Ginger (tangawizi)** — Tea for colds, digestion\\n' +
            '- **Moringa** — Powdered leaf, nutritional supplement\\n' +
            '- **Eucalyptus** — Oil for respiratory issues\\n' +
            '- **Aloe vera** — Gel for skin care, burns\\n' +
            '- **Garlic** — Immune support, blood pressure',
            'article',
            2,
            { imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=800&h=500' },
          ),
          makeQuizLesson(
            'Module 3: Knowledge Check',
            'Review health products business concepts.',
            [
              {
                question: 'What regulatory body registers health products in Rwanda?',
                options: ['RDB', 'RFDA', 'RSB', 'RURA'],
                correctIndex: 1,
                explanation: 'RFDA (Rwanda Food and Drugs Authority) registers health products including herbal medicines.',
              },
              {
                question: 'What is a typical profit margin for natural soap?',
                options: ['10-20%', '50-200%', '5-10%', '200-500%'],
                correctIndex: 1,
                explanation: 'Natural soap businesses typically enjoy 50-200% profit margins.',
              },
            ],
            4,
          ),
          makeAssignmentLesson(
            'Module 3: Final Health Business Project — Earn 150,000+ RWF!',
            'Your mission: Launch a real health or wellness product or service!',
            '**REAL HEALTH PROJECT: Earn Your First 150,000+ RWF in 30 Days**\\n\\nChoose ONE path:\\n\\n**Path A: Natural Products**\\nMake and sell 50 natural soaps or lotions.\\nCost: 500 RWF each to make, sell at 2,000 RWF.\\n50 × 2,000 = 100,000 RWF revenue, 75,000 RWF profit.\\n\\n**Path B: Fitness Classes**\\nOffer outdoor bootcamp or yoga classes.\\nCharge 5,000-10,000 RWF per class, attract 20 students.\\n10 classes × 20 students × 5,000 = 1,000,000 RWF!\\n\\n**Path C: Healthy Meal Prep**\\nPrepare and deliver 100 healthy meals to offices.\\nCost: 2,500 RWF per meal, sell at 6,000 RWF.\\n100 × 6,000 = 600,000 RWF revenue!\\n\\n**🎯 Quick access links:** [Ministry of Health](https://www.moh.gov.rw) | [RFDA](https://www.rfda.gov.rw) | [RSB](https://www.rsb.gov.rw) | [RDB](https://rdb.rw)\\n\\n**🎯 Target: 150,000+ RWF in 30 days!**\\n\\n![Health business](https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800&h=500)',
            [
              { question: 'YOUR HEALTH BUSINESS: What product or service did you launch? Describe what you created and who your customers were.', type: 'open', explanation: 'Describe your product or service in detail.', points: 20 },
              { question: 'FINANCIALS: Revenue? Cost of goods? Net profit? Number of customers?', type: 'open', explanation: 'Show real numbers from your health business.', points: 20 },
              { question: 'CHALLENGES: What was the hardest part? Regulatory? Production? Marketing? Sales?', type: 'open', explanation: 'Share lessons learned for future health entrepreneurs.', points: 15 },
              { question: 'SCALE: How would you grow to 500,000+ RWF/month? More products? More customers? Partnerships?', type: 'open', explanation: 'Show your scaling strategy for the health business.', points: 20 },
            ],
            5,
          ),
        ],
        'Create and sell health products, natural remedies, and wellness services.',
      ),
    ],
  },
];

// ─── Main Seeder ─────────────────────────────────────────────────────────────

async function seedAfricanMarketCourses() {
  try {
    await connectDB();
    console.log('📦 Connected to MongoDB\n');

    // Check for admin user to set as instructor
    const admin = await User.findOne({ role: 'super_admin' }).lean() as any;
    const instructorId = admin?._id || new mongoose.Types.ObjectId();

    let createdCount = 0;
    let skippedCount = 0;

    for (const cd of COURSES) {
      // Check if course already exists
      const existing = await Course.findOne({ title: cd.title }).lean() as any;
      if (existing) {
        console.log(`   ⏭️  Skipped (exists): ${cd.title}`);
        skippedCount++;
        continue;
      }

      // Build course document
      const courseDoc: Record<string, any> = {
        title: cd.title,
        description: cd.description,
        category: cd.category,
        level: cd.level,
        price: cd.price,
        currency: 'RWF',
        modules: cd.modules,
        modulesCount: cd.modules.length,
        totalLessonsCount: cd.modules.reduce((sum, m) => sum + m.lessons.length, 0),
        instructor: instructorId,
        createdBy: instructorId,
        status: 'published',
        enrollmentMode: 'direct',
        school: cd.school || 'IHUB ACADEMY',
        isFeatured: cd.isFeatured || false,
        searchImage: cd.searchImage,
        thumbnail: `https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800&h=500`,
        studentsEnrolled: [],
      };

      // Add discount price if set
      if (cd.discountPrice) {
        courseDoc.discountPrice = cd.discountPrice;
      }

      await new Course(courseDoc).save();
      console.log(`   ✅ Created: ${cd.title}`);
      createdCount++;
    }

    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ ${createdCount} courses created`);
    console.log(`   ⏭️  ${skippedCount} courses skipped (already exist)`);
    console.log(`   💰 All priced at: 1000 RWF`);
    console.log(`═`.repeat(55));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding African market courses:', error);
    process.exit(1);
  }
}

seedAfricanMarketCourses();
