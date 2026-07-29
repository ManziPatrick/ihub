import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Target, Lightbulb, Shield, Heart, Award, Users, Globe,
  GraduationCap, Briefcase, Laptop, Cpu, Code, Database,
  Wifi, BookOpen, Building2, CheckCircle, ArrowRight,
  Quote, MapPin, TrendingUp, Sparkles, Star, FileText, Scan,
  Rocket, ChevronLeft, ChevronRight, Brain, Zap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// ─── Data ──────────────────────────────────────────────────────────────────

const values = [
  { icon: Shield, title: "Excellence", description: "Delivering the highest quality in all our training programs and technology solutions" },
  { icon: Heart, title: "Integrity", description: "Honest and transparent in all interactions with students, partners, and clients" },
  { icon: Brain, title: "AI-Powered Innovation", description: "AI-first approach across our entire platform — from smart course recommendations to intelligent learning assistance" },
  { icon: Award, title: "Practical Learning", description: "Hands-on, industry-focused training that prepares you for real-world challenges" },
  { icon: Users, title: "Community Impact", description: "Creating lasting positive change in communities across Africa" },
  { icon: Globe, title: "Global Standards", description: "International curriculum aligned with global industry requirements" },
];

const achievements = [
  { number: "250+", label: "Successful Graduates", icon: Users },
  { number: "15+", label: "Real Projects Delivered", icon: Briefcase },
  { number: "10+", label: "AI Solutions Built", icon: Cpu },
  { number: "100%", label: "Practical Focus", icon: Target },
  { number: "1,000+", label: "Learners Trained", icon: GraduationCap },
  { number: "20+", label: "Course Categories", icon: BookOpen },
  { number: "5,000+", label: "Digital Safety Certified", icon: Shield },
];

const servicesForIndividuals = [
  {
    icon: Code,
    title: "Software Development",
    description: "Web & mobile apps, frontend to backend. Learn React, Node.js, Python, and more through hands-on projects.",
    features: ["HTML/CSS, JavaScript, React, Vue.js", "Node.js, Python, PHP, Java", "Mobile: React Native, Flutter", "Git & GitHub, DevOps basics"]
  },
  {
    icon: Database,
    title: "Data Science & AI",
    description: "Master data analysis, machine learning, and AI. Build real models that solve real problems.",
    features: ["Python for Data Science", "Machine Learning & Deep Learning", "NLP & Computer Vision", "Big Data tools: Spark, Hadoop"]
  },
  {
    icon: Wifi,
    title: "IoT & Smart Systems",
    description: "Build connected devices and automation solutions for agriculture, industry, and homes.",
    features: ["Arduino & Raspberry Pi", "Sensor integration", "MQTT & IoT protocols", "Cloud IoT platforms"]
  },
  {
    icon: Shield,
    title: "Cyber Literacy & Digital Safety",
    description: "Comprehensive cyber literacy — online safety, threat awareness, data protection, and safe digital habits for individuals, families, and communities.",
    features: ["Online safety & threat awareness", "Phishing & scam detection", "Data privacy & protection", "Safe browsing & social media", "Incident response basics", "Parental digital safety controls"]
  },
  {
    icon: BookOpen,
    title: "Digital Skills & Workplace Literacy",
    description: "Essential digital competencies for the modern workplace — from office tools to advanced productivity.",
    features: ["Microsoft Office Suite", "Google Workspace", "Digital marketing essentials", "Remote work collaboration tools"]
  },
  {
    icon: Briefcase,
    title: "Programs & Career Pathways",
    description: "Structured online programs where you work on real projects under professional mentorship.",
    features: ["Industry program matching", "Project-based learning", "Mentor-led career coaching", "Portfolio & resume prep"]
  },
  {
    icon: TrendingUp,
    title: "Business & Finance",
    description: "Practical business skills, financial literacy, and entrepreneurship training for aspiring leaders.",
    features: ["Business management", "Financial literacy", "Entrepreneurship", "Project management"]
  },
  {
    icon: Star,
    title: "Kids & Junior Programs",
    description: "Age-appropriate courses introducing children and teens to coding, digital literacy, online safety, and creative tech — building future-ready skills from an early age.",
    features: ["Coding fundamentals for ages 8-16", "Safe internet & digital citizenship", "Creative tech: animation, game design", "Junior cyber literacy & awareness", "Parent-guided learning tracks", "Fun STEM projects & challenges"]
  },
];

const servicesForOrganizations = [
  {
    icon: Laptop,
    title: "Software & AI Development",
    description: "Custom web, mobile, and AI-powered solutions for startups and enterprise systems.",
    offerings: ["Web & mobile app development", "AI chatbots & virtual assistants", "Predictive analytics", "API development & integration"]
  },
  {
    icon: Cpu,
    title: "IoT & Automation",
    description: "Smart connected systems for industry, agriculture, and smart buildings.",
    offerings: ["Smart farming solutions", "Industrial automation", "Asset tracking & monitoring", "Smart building solutions"]
  },
  {
    icon: FileText,
    title: "Project Management & Contract Oversight",
    description: "Full project lifecycle management with digital contract creation, scanning, and secure document storage.",
    offerings: ["Project lifecycle management", "Digital contract creation & scanning", "Secure document archive", "Client progress dashboards"]
  },
  {
    icon: Building2,
    title: "IT Consultancy & Training",
    description: "Strategic technology advisory and corporate training programs for teams and organizations.",
    offerings: ["Digital transformation strategy", "Corporate training programs", "Technology stack assessment", "Cloud migration services"]
  },
];const testimonials = [
  {
    quote: "Bootskills helped me transition from learning to real-world development. The mentorship prepared me for industry work.",
    author: "Emmanuel R.",
    role: "Software Developer",
    company: "TechCorp Rwanda"
  },
  {
    quote: "The Data Science program gave me practical skills I use every day. Online classes were flexible with world-class instructors.",
    author: "Marie Claire M.",
    role: "Data Analyst",
    company: "FinanceHub Ltd"
  },
  {
    quote: "From training to internship to full-time employment — Bootskills opened doors I never knew existed.",
    author: "Jean Paul N.",
    role: "IoT Engineer",
    company: "SmartFarm Solutions"
  },
];

const audiences = [
  { icon: GraduationCap, title: "Students & Graduates", description: "Building foundational skills for career launch" },
  { icon: Briefcase, title: "Working Professionals", description: "Upskilling for career advancement" },
  { icon: Building2, title: "Institutions & Schools", description: "Partnership programs for students" },
  { icon: Heart, title: "NGOs & Organizations", description: "Development & training initiatives" },
  { icon: Rocket, title: "Startups & Businesses", description: "Tech solutions & team training" },
  { icon: Globe, title: "Rural & Remote Learners", description: "Accessible online education anywhere" },
  { icon: Shield, title: "Families & Parents", description: "Digital safety & kids education" },
];

const whyChooseUs = [
  { icon: Brain, title: "AI-Powered Platform", description: "Entire system powered by AI — smart course matching, AI tutor assistance, automated grading, and intelligent career guidance" },
  { icon: Award, title: "Industry-Aligned Curriculum", description: "Programs shaped by employers and local market needs" },
  { icon: Users, title: "Expert Instructors", description: "Learn from professionals with real-world experience" },
  { icon: Briefcase, title: "Practical Projects", description: "Build a portfolio with hands-on, real-world projects" },
  { icon: Globe, title: "Accessible Anywhere", description: "Online delivery reaches rural villages and urban centers" },
  { icon: Star, title: "Career Support", description: "Job placement assistance for all graduates" },
  { icon: Sparkles, title: "AI-Enhanced Learning", description: "Smart recommendations, AI tutor, automated code review, and personalized learning paths" },
  { icon: Award, title: "Certified Programs", description: "Industry-recognized certificates of completion" },
  { icon: Shield, title: "Cyber Safe Guarantee", description: "Every learner trained in digital safety, threat awareness, and personal data protection" },
];

// ─── Section Header Component ──────────────────────────────────────────────

function SectionHeader({ label, title, description }: { label?: string; title: string; description?: string }) {
  return (
    <div className="text-center mb-12 lg:mb-16">
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-4 uppercase tracking-wider"
        >
          {label}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="font-heading text-2xl lg:text-4xl font-medium text-foreground mb-4"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-base leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// ─── Fade-In Section Wrapper ───────────────────────────────────────────────

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const CompanyProfile = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const currentTestimonial = testimonials[testimonialIndex];

  const nextTestimonial = () => setTestimonialIndex(prev => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bootskills",
    "url": "https://bootskills.com",
    "logo": "https://bootskills.com/logo.svg",
    "description": "Your all-in-one learning hub — courses across every field. Projects. Internships.",
    "foundingDate": "2023",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    },
    "sameAs": ["https://bootskills.com"]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Bootskills | Company Profile — All-in-One Learning Hub</title>
        <meta name="description" content="Bootskills is your all-in-one learning hub serving Africa — offering courses across every field, online internships, client project management, and digital contract solutions. Learn from anywhere." />
        <meta property="og:title" content="Bootskills | Company Profile — All-in-One Learning Hub" />
        <meta property="og:description" content="Courses across every field. Online internships. Client project management. Serving urban and rural learners across Africa." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bootskills.com/company-profile" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />

      <main className="pt-14">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-card via-background to-background overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full border border-accent/5" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full border border-accent/5" />
            <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-accent/20 rounded-full" />
            <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-accent/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent/10 rounded-full" />
            {/* Circuit lines */}
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.03]" viewBox="0 0 800 128">
              <path d="M0,64 L100,64 L120,44 L200,44 L220,64 L400,64 L420,44 L500,44 L520,64 L700,64 L720,44 L800,44" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            </svg>
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8"
              >
                <Cpu className="w-4 h-4 text-accent" />
                <span className="text-accent text-xs font-semibold uppercase tracking-wider">AI-Powered Company Profile</span>
              </motion.div>

              {/* Headline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4 text-accent text-xs font-semibold"
              >
                <Zap className="w-3.5 h-3.5" />
                AI-POWERED LEARNING PLATFORM
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6"
              >
                Your All-in-One
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">AI-Powered Learning Hub</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
              >
                AI-powered courses across every field. Online internships. Client project management.
                <br />
                <span className="text-foreground/80 font-medium">Serving learners in villages, rural areas, and cities — wherever there's internet.</span>
                <br />
                <span className="text-accent/80 text-base">Cyber literacy &amp; digital safety for all. Dedicated kids &amp; junior programs. Financial literacy for every stage of life.</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link to="/explore">
                  <Button variant="gold" size="xl" className="group text-base">
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="xl" className="text-base border-foreground/20 text-foreground hover:border-accent hover:text-accent">
                    Partner With Us
                  </Button>
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground"
              >
                {["Registered in Rwanda", "Serving All of Africa", "100% Practical Focus", "AI-Powered Platform"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* QUICK STATS STRIP */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-8 bg-card border-y border-border/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="font-heading text-xl lg:text-2xl font-bold text-card-foreground">
                    {item.number}
                  </div>
                  <div className="text-xs text-card-foreground/60 mt-0.5">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ABOUT / OUR STORY */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="About Us"
              title="Our Story"
              description="How Bootskills came to be — and the problem we're solving."
            />

            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <FadeInSection>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p className="text-base lg:text-lg">
                    Bootskills was founded by <strong className="text-foreground">Manzi Alain Patrick Munyeshuri</strong>,
                    a Rwandan technologist driven by a pressing challenge: the gap between education and employability.
                  </p>
                  <p className="text-base lg:text-lg">
                    He envisioned a platform where learning is directly connected to real projects, mentorship, and career
                    opportunities — accessible to anyone with an internet connection, whether in Kigali or a remote village.
                  </p>
                  <p className="text-base lg:text-lg">
                    He was later joined by <strong className="text-foreground">KALISA Jonathan</strong>, Co-Founder,
                    who brought operational and technical leadership to scale training programs, internships, and software
                    delivery across East Africa.
                  </p>
                  <div className="pt-4 flex items-center gap-3 text-accent font-medium">
                    <MapPin className="w-5 h-5" />
                    <span>Based in Kigali, Rwanda — Serving All of Africa</span>
                  </div>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                {/* Mission & Vision Cards */}
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl p-8 border border-border/30 hover:border-accent/30 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                      <Target className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3">Our Mission</h3>
                    <p className="text-card-foreground/70 leading-relaxed">
                      To empower individuals and organizations — whether in villages, rural areas, or urban centers — 
                      with real skills, real experience, and intelligent digital solutions. We remove the barrier of 
                      location so that anyone with internet access can learn, grow, and access career opportunities.
                    </p>
                  </div>

                  <div className="bg-card rounded-2xl p-8 border border-border/30 hover:border-accent/30 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                      <Lightbulb className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3">Our Vision</h3>
                    <p className="text-card-foreground/70 leading-relaxed">
                      To become Africa's leading practical learning and professional growth platform, starting from 
                      Rwanda and expanding globally. A future where every African — regardless of location — has 
                      access to world-class education, real projects, and meaningful career pathways.
                    </p>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CORE VALUES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Our Values"
              title="What We Stand For"
              description="Six core principles that guide everything we do."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <FadeInSection key={value.title} delay={index * 0.08}>
                  <div className="bg-background rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <value.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHAT WE DO — OVERVIEW */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="What We Do"
              title="Our Four Pillars"
              description="We operate across four key areas to serve both individuals and organizations."
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { icon: GraduationCap, title: "Training & Courses", description: "Practical, market-driven courses across every field — from tech and business to healthcare and creative arts.", color: "from-blue-500/20 to-blue-600/10" },
                { icon: Briefcase, title: "Programs & Careers", description: "Structured online and in-person internships with real projects, mentorship, and career coaching.", color: "from-emerald-500/20 to-emerald-600/10" },
                { icon: Laptop, title: "Tech & AI Solutions", description: "Custom software, AI, and IoT solutions for startups, enterprises, and government organizations.", color: "from-purple-500/20 to-purple-600/10" },
                { icon: FileText, title: "Project & Contract Management", description: "End-to-end project lifecycle management with digital contract scanning and secure document storage.", color: "from-amber-500/20 to-amber-600/10" },
              ].map((pillar, index) => (
                <FadeInSection key={pillar.title} delay={index * 0.1}>
                  <div className="bg-card rounded-2xl overflow-hidden border border-border/30 group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 h-full">
                    <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
                    <div className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                        <pillar.icon className="w-7 h-7 text-accent" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-card-foreground mb-3">{pillar.title}</h3>
                      <p className="text-card-foreground/70 text-sm leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FOR INDIVIDUALS — TRAINING & INTERNSHIPS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="For Individuals"
              title="Training Programs & Careers"
              description="Learn from anywhere — village, town, or city. All you need is an internet connection."
            />

            {/* Accessibility banner */}
            <FadeInSection>
              <div className="max-w-4xl mx-auto mb-12 bg-background rounded-2xl p-6 border border-accent/20 shadow-gold-glow/5">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-lg mb-1">Accessible to Everyone, Everywhere</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      All our programs are available online. Whether you're in a rural village with basic internet or 
                      in downtown Kigali, you can access the same quality training, mentorship, and career 
                      opportunities. No location barriers. No excuses.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {            servicesForIndividuals.map((service, index) => (
                <FadeInSection key={service.title} delay={index * 0.06}>
                  <div className="bg-background rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                        <service.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-foreground text-sm leading-tight">{service.title}</h3>
                          {service.title === "Data Science & AI" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-full uppercase tracking-wider">
                              <Zap className="w-2.5 h-2.5" />
                              AI Core
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                    <ul className="space-y-1.5">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground/80">
                          <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection delay={0.3}>
              <div className="text-center mt-10">
                <Link to="/explore">
                  <Button variant="gold" size="lg" className="group">
                    Browse All Programs
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FOR ORGANIZATIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="For Organizations"
              title="Tech Solutions, Project Management & Contract Services"
              description="From software development to contract scanning — we help organizations manage projects end-to-end."
            />

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {servicesForOrganizations.map((service, index) => (
                <FadeInSection key={service.title} delay={index * 0.1}>
                  <div className="bg-card rounded-xl p-8 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                        <service.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-card-foreground">{service.title}</h3>
                        <p className="text-card-foreground/70 text-sm">{service.description}</p>
                      </div>
                    </div>
                    <ul className="grid grid-cols-2 gap-3">
                      {service.offerings.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-card-foreground/80">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Contract & Project Management Highlight */}
            <FadeInSection delay={0.3}>
              <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl p-8 border border-accent/20">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                      Full Project Lifecycle — From Proposal to Delivery
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Clients can submit project proposals, track progress through a dedicated dashboard, 
                      sign and scan contracts digitally, and manage deliverables — all in one place. 
                      Our platform handles contract creation, secure document storage, milestone tracking, 
                      and transparent communication between your team and ours.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Digital contract scanning
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Secure document archive
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Real-time progress tracking
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.4}>
              <div className="text-center mt-10">
                <Link to="/contact">
                  <Button variant="gold" size="lg" className="group">
                    Request a Consultation
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHO WE SERVE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Our Audience"
              title="Who We Serve"
              description="From rural learners to enterprise organizations — we serve everyone."
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {audiences.map((audience, index) => (
                <FadeInSection key={audience.title} delay={index * 0.08}>
                  <div className="bg-background rounded-xl p-5 text-center h-full border border-border/30 group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <audience.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm mb-1 line-clamp-2">
                      {audience.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70 leading-tight">
                      {audience.description}
                    </p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* WHY CHOOSE US */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Why Bootskills"
              title="The Bootskills Advantage"
              description="What makes us different — and why learners and organizations choose us."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {whyChooseUs.map((item, index) => (
                <FadeInSection key={item.title} delay={index * 0.08}>
                  <div className="bg-card rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <item.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-heading font-bold text-card-foreground mb-2">{item.title}</h3>
                    <p className="text-card-foreground/70 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>



        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TESTIMONIALS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Testimonials"
              title="Success Stories"
              description="Hear from learners who transformed their careers through Bootskills."
            />

            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 lg:gap-8">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex-1 relative min-h-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={testimonialIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="bg-card rounded-xl p-6 lg:p-8 shadow-card border border-border/30"
                    >
                    <div className="flex flex-col items-center text-center">
                      <Quote className="w-10 h-10 text-accent/30 mb-4" />
                      <p className="text-foreground text-lg lg:text-xl leading-relaxed font-heading italic mb-6">
                        "{currentTestimonial.quote}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground text-sm">{currentTestimonial.author}</p>
                          <p className="text-muted-foreground text-xs">
                            {currentTestimonial.role} — {currentTestimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  </AnimatePresence>
                </div>

                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTestimonialIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === testimonialIndex
                        ? "bg-accent w-8"
                        : "bg-foreground/20 hover:bg-foreground/40 w-2"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CTA */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
              <path d="M0,200 L100,200 L120,180 L200,180 L220,200 L400,200 L420,180 L500,180 L520,200 L700,200 L720,180 L800,180" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            </svg>
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <FadeInSection>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading text-3xl lg:text-5xl font-bold text-card-foreground mb-6">
                  Ready to Build the Future?
                </h2>
                <p className="text-card-foreground/80 text-lg lg:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
                  Whether you're a learner looking to upskill, an organization seeking tech solutions, 
                  or a partner wanting to make an impact — let's work together.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/explore">
                    <Button variant="gold" size="xl" className="group text-base">
                      Explore Programs
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="xl" className="text-base border-card-foreground/30 text-card-foreground hover:border-accent hover:text-accent">
                      Contact Us Today
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CompanyProfile;
