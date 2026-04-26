import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from './models/Blog';
import BlogCategory from './models/BlogCategory';
import { User } from './models/User';
import connectDB from './config/db';
import slugify from 'slugify';

dotenv.config();

const categoriesData = [
    { name: 'Software Engineering', description: 'Technical articles, best practices, and architecture guides for modern developers.' },
    { name: 'Rwanda Tech', description: 'Deep dives into the growing technology landscape in Kigali and across Rwanda.' },
    { name: 'Future Tech', description: 'Insights into AI, Blockchain, Quantum Computing, and the next frontier of innovation.' },
    { name: 'Business & Growth', description: 'Strategies for startups, entrepreneurship tips, and navigating the African market.' },
    { name: 'Career & Internship', description: 'Practical advice for junior developers, internship experiences, and career roadmaps.' },
    { name: 'AI & Data Science', description: 'Specialized content focusing on Machine Learning and Data-driven decision making.' }
];

const generateExtremeLongContent = (title: string, baseContent: string) => {
    let content = `# ${title}\n\n${baseContent}\n\n`;

    const fillerParagraphs = [
        "In the rapidly evolving landscape of 2026, the intersection of technology and human potential has never been more critical. As we architect solutions for a global market, the nuances of regional implementation—especially within the African context—demand a deep understanding of local infrastructure, cultural dynamics, and economic aspirations.",
        "Scalability is not just a technical requirement; it's a social one. When we build systems that can accommodate millions of users across diverse connectivity profiles, we are essentially democratizing access to information and opportunity. This is the core mission of IHUB: to empower the next generation with the tools to build a better future.",
        "From the bustling streets of Kigali to the silicon valleys of the West, the language of innovation remains universal. However, the application of this language must be purposeful. Whether we're leveraging React 18 for high-performance interfaces or implementing robust Node.js backends, the ultimate goal is to solve real-world problems with elegance and efficiency.",
        "Mentorship and continuous learning are the lifeblood of a thriving technical community. By sharing our experiences—both our successes and our failures—we create a repository of knowledge that benefits everyone. This collaborative spirit is what drives the 'Kigali Tech Renaissance' and positions Rwanda as a leader in the digital economy.",
        "Security and privacy are not afterthoughts; they are the foundation upon which trust is built. In an era of increasing data vulnerability, our commitment to best practices in cybersecurity ensures that our users' information remains protected. This is particularly vital for fintech and agritech solutions that handle sensitive transactional data.",
        "The future of work is decentralized, but the human connection remains paramount. As we embrace remote collaboration, we must also invest in the soft skills that make teamwork possible: empathy, clear communication, and a shared vision. These are the qualities that transform a group of developers into a high-impact engineering team."
    ];

    // Repeat to create "massive" content (aiming for perceived 3000 lines/words)
    for (let i = 0; i < 50; i++) {
        content += `## Section ${i + 1}: Deep Dive into Innovation\n\n`;
        content += fillerParagraphs[i % fillerParagraphs.length] + "\n\n";
        content += "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim anim id est laborum.\n\n";
        content += "Furthermore, as we examine the long-term implications of this technology, we must consider the ethical boundaries and the impact on local communities. IHUB is dedicated to a people-first approach, ensuring that our technical advancements contribute to sustainable growth and social equity.\n\n";
        if (i % 5 === 0) {
            content += "### Practical Key Takeaways\n";
            content += "1. Always prioritize user experience in low-bandwidth environments.\n";
            content += "2. Implement robust error handling to prevent application crashes.\n";
            content += "3. Leverage modern state management for responsive interfaces.\n";
            content += "4. Continuously audit security protocols to protect user data.\n\n";
        }
    }

    return content;
};

const blogTopics = [
    {
        title: "Kigali Tech Renaissance: Architecting Africa’s Digital Future by 2030",
        content: `## Introduction: The Landlocked Reality vs. The Digital Opportunity

Rwanda has long been defined by its geography. A beautiful, mountainous, landlocked nation in the heart of East Africa, its traditional economic pathways were limited by borders and logistics. However, over the last two decades, a new vision has emerged—one that renders physical borders irrelevant. This is the vision of a digital Rwanda, a "Silicon Valley" for Africa, where the primary export isn't minerals or coffee, but lines of code and innovative intellectual property.

The problem is clear: for many African nations, the transition from an agrarian economy to a digital one is fraught with "digital divide" challenges—lack of high-speed internet, expensive hardware, and a severe shortage of high-level technical talent. But where others see problems, Rwanda sees an unprecedented opportunity. By 2030, Kigali aims to be the undisputed leading tech hub of the continent.

This isn't just about buildling shiny buildings in the Kigali Innovation City. It’s about building a sustainable ecosystem. At IHUB, we believe that for this renaissance to be real, it must be architected from the ground up, starting with the most valuable resource: human capital.

## The Infrastructure Pillar: Beyond Fiber Optics

To understand the future of tech in Rwanda, we must first look at the foundation. The Rwandan government’s "Vision 2030" isn't just a document; it’s a living blueprint. The rollout of 4G (and now 5G) LTE across nearly 100% of the country was the first major milestone. But infrastructure is more than just wires and frequencies.

### The Rise of Kigali Innovation City (KIC)
KIC is more than just a real estate project. It is a cluster of universities (like Carnegie Mellon Africa), tech companies, and incubators. The goal is to create a "collision space" where academic research meets commercial feasibility. For a professional software engineer, this means having access to a world-class environment without ever having to leave the continent.

## Human Capital: The Real Source Code of Innovation

You can buy hardware and rent cloud space, but you cannot "download" an experienced engineering team. The global shortage of senior developers is well-known, but in Africa, the challenge is compounded by the "Junior Gap." We have many young people interested in tech, but few have been through the rigorous, project-based training required to build enterprise-grade software.

### The IHUB Approach: Bridge the Gap
This is why IHUB’s Internship Programs are designed the way they are. We don't just teach syntax; we teach "Architecture." We believe a senior software writer isn't someone who knows a library, but someone who knows how to solve a business problem using technology.`,
        cat: 'Rwanda Tech',
        img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab"
    },
    {
        title: "Introduction to React 18 and Concurrent Mode",
        content: "React 18 introduced a powerful new concept called Concurrent Mode. This allows React to interrupt a long-running render to handle a high-priority event, like a user click or an animation. Understanding transitions (useTransition) and deferred values (useDeferredValue) is crucial for building butter-smooth interfaces in 2026. At IHUB, we use these features to ensure our academy's platform remains responsive even with complex data visualizations.",
        cat: 'Software Engineering',
        img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee"
    },
    {
        title: "Advanced TypeScript Patterns: Generics and Mapped Types",
        content: "TypeScript is more than just adding types to JavaScript. Advanced features like Mapped Types, Conditional Types, and Template Literal Types allow us to create highly dynamic and type-safe libraries. Learn how to use 'infer' to extract types and create utility types that make your codebase self-documenting and virtually bug-free under proper linting.",
        cat: 'Software Engineering',
        img: "https://images.unsplash.com/photo-1516116216624-53e697fedbea"
    },
    {
        title: "Building Scalable Backend with Node.js and NestJS",
        content: "Scaling a Node.js application requires a structured approach. NestJS provides a modular architecture influenced by Angular, making it easy to build microservices. We explore dependency injection, interceptors, and guards to build a robust security layer for our enterprise clients in Rwanda.",
        cat: 'Software Engineering',
        img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
    }
];

// Add more topics to reach 35
const additionalTopics = [
    { title: "Mastering MongoDB Aggregation Framework", cat: 'AI & Data Science', img: "https://images.unsplash.com/photo-1542744094-3a31f272c490" },
    { title: "State Management in 2026: React Query vs. Redux", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97" },
    { title: "The Future of Web Development: AI-Powered Coding", cat: 'Future Tech', img: "https://images.unsplash.com/photo-1531297484001-80022131f5a1" },
    { title: "Clean Architecture in JavaScript Projects", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8" },
    { title: "DevOps for Frontend Developers: GitHub Actions", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1618401471353-b98aadebc248" },
    { title: "Building Accessible Web Applications (WCAG 2.2)", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71" },
    { title: "UI/UX Trends for 2026: Micro-interactions", cat: 'Business & Growth', img: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c" },
    { title: "Career in Tech: From Junior to Senior Developer", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f" },
    { title: "How to Ace Technical Interviews in Rwanda", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3" },
    { title: "Understanding Blockchain: Beyond Cryptocurrencies", cat: 'Future Tech', img: "https://images.unsplash.com/photo-1639322537228-f710d846310a" },
    { title: "Cybersecurity Best Practices for Startups", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b" },
    { title: "Data Science with Python: A Beginner's Guide", cat: 'AI & Data Science', img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2" },
    { title: "Machine Learning in Production: MLOps", cat: 'AI & Data Science', img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e" },
    { title: "Cloud Native Applications with Docker", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1605792657660-596af9009e82" },
    { title: "Serverless Computing: When to Use It?", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa" },
    { title: "Performance Optimization Checklist 2026", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f" },
    { title: "The Importance of Soft Skills for Engineers", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e" },
    { title: "Agile Project Management: Scrum vs. Kanban", cat: 'Business & Growth', img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12" },
    { title: "Remote Work in Tech: How to Stay Productive", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1588702547919-26089e690922" },
    { title: "Building a Portfolio that Gets You Hired", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8" },
    { title: "Open Source Contribution Guide", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1542831371-29b0f74f9713" },
    { title: "Testing in React: Jest and RTL", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97" },
    { title: "GraphQL vs. REST: Choosing the Right API", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc48" },
    { title: "Mobile App Development: React Native vs. Flutter", cat: 'Software Engineering', img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c" },
    { title: "Progressive Web Apps (PWAs): The Future", cat: 'Future Tech', img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6" },
    { title: "E-commerce Development: Best Practices", cat: 'Business & Growth', img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3" },
    { title: "Fintech in Africa: Opportunities and Challenges", cat: 'Business & Growth', img: "https://images.unsplash.com/photo-1563986768609-322da13575f3" },
    { title: "Agritech: Transforming Agriculture in Rwanda", cat: 'Rwanda Tech', img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef" },
    { title: "EdTech: The Future of Learning", cat: 'Rwanda Tech', img: "https://images.unsplash.com/photo-1501504905252-473c47e087f8" },
    { title: "HealthTech: Innovation in Healthcare", cat: 'Rwanda Tech', img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528" },
    { title: "The Role of Mentorship in Tech Careers", cat: 'Career & Internship', img: "https://images.unsplash.com/photo-1515169067868-5387ec356754" },
    { title: "Entrepreneurship 101: Starting Your Tech Company", cat: 'Business & Growth', img: "https://images.unsplash.com/photo-1497366216548-37526070297c" }
];

const seedBlogs = async () => {
    try {
        await connectDB();
        const admin: any = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found. Please seed users first.');
            process.exit(1);
        }

        await Blog.deleteMany({});
        await BlogCategory.deleteMany({});

        const createdCategories = await BlogCategory.insertMany(categoriesData.map(cat => ({
            ...cat,
            slug: slugify(cat.name, { lower: true, strict: true })
        })));
        console.log(`✅ Seeded ${createdCategories.length} categories`);

        const categoryMap = new Map();
        createdCategories.forEach(cat => categoryMap.set(cat.name, cat._id));

        const allTopics = [...blogTopics, ...additionalTopics];
        const blogs = allTopics.map((topic: any) => ({
            title: topic.title,
            slug: slugify(topic.title, { lower: true, strict: true }),
            content: generateExtremeLongContent(topic.title, topic.content || `A deep exploration of ${topic.title} and its impact on the modern digital ecosystem.`),
            category: categoryMap.get(topic.cat),
            author: admin._id,
            authorName: "Manzi Alain Patrick",
            tags: [topic.cat.split(' ')[0], "Tech", "Learning", "2026"],
            image: topic.img + "?auto=format&fit=crop&q=80&w=1200",
            likes: [],
            comments: []
        }));

        await Blog.insertMany(blogs);
        console.log(`✅ Seeded ${blogs.length} professional educational blogs with massive content`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding:', error);
        process.exit(1);
    }
};

seedBlogs();
