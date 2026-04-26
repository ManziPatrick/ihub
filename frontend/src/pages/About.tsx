import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Lightbulb, Shield, Award, Users, Heart, CheckCircle, Globe, BookOpen, Zap, Briefcase, GraduationCap, Laptop, Cpu, TrendingUp } from "lucide-react";
import aboutImage from "@/assets/about-training.webp";
import aboutImageMobile from "@/assets/about-training-mobile.webp";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import { Helmet } from "react-helmet-async";

const values = [
  { icon: Shield, title: "Excellence", description: "We deliver the highest quality in all our training programs and technology solutions" },
  { icon: Heart, title: "Integrity", description: "Honest and transparent in all interactions with students, partners, and clients" },
  { icon: Lightbulb, title: "Innovation", description: "Embracing new ideas, technologies, and methodologies to stay ahead" },
  { icon: Award, title: "Practical Learning", description: "Hands-on, industry-focused training that prepares you for real-world challenges" },
  { icon: Users, title: "Community Impact", description: "Creating lasting positive change in communities across Africa" },
  { icon: Globe, title: "Global Standards", description: "International curriculum aligned with global industry requirements" },
];

const achievements = [
  { number: "250+", label: "Successful Interns" },
  { number: "15+", label: "Real-world Projects" },
  { number: "10+", label: "AI Solutions Built" },
  { number: "100%", label: "Practical Focus" },
];

const team = [
  {
    name: "Manzi Alain Patrick Munyeshuri",
    role: "Founder & Lead Strategist",
    bio: "Rwandan technologist and innovator driven by closing the gap between education and employability."
  },
  {
    name: "Bizimana Eric",
    role: "Co-Founder & Operations Lead",
    bio: "Brings operational and technical leadership to scale training programs and software delivery."
  }
];

const services = [
  {
    icon: GraduationCap,
    title: "Training & Courses",
    description: "Practical, market-driven courses in Software Development, AI, Data Science, and Digital Skills.",
  },
  {
    icon: Briefcase,
    title: "Structured Internships",
    description: "Simulated workplace environments working on real projects with professional mentorship.",
  },
  {
    icon: Laptop,
    title: "Software & AI Development",
    description: "Custom web, mobile, and AI-powered solutions for startups and enterprise systems.",
  },
  {
    icon: Cpu,
    title: "Innovation Platform",
    description: "Open ecosystem for trainers, professionals, and companies to collaborate and innovate.",
  }
];

const About = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "IHUB",
    "url": "https://ihub.com",
    "logo": "https://ihub.com/logo.png",
    "founder": [
      {
        "@type": "Person",
        "name": "Manzi Alain Patrick Munyeshuri"
      },
      {
        "@type": "Person",
        "name": "Bizimana Eric"
      }
    ],
    "description": "Meet with iHub",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Us | IHUB - Leaders in Professional Growth</title>
        <meta name="description" content="Meet with iHub" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src={heroImage}
              srcSet={`${heroImageMobile} 600w, ${heroImage} 1280w`}
              sizes="100vw"
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-4 uppercase tracking-wider">
                Who We Are
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Empowering Africa through Practical Skills & Excellence
              </h1>
              <p className="text-card-foreground/80 text-lg leading-relaxed">
                Meet with iHub.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-heading text-2xl lg:text-4xl font-medium text-foreground mb-6">
                  Removing the Barrier of Location
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                  <p>
                    We believe opportunity should not depend on location. IHUB uses online and
                    in-person delivery, remote collaboration, and affordable internet access to serve
                    learners beyond major cities.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="p-6 bg-card rounded-xl border border-border/50">
                      <h3 className="font-heading font-bold text-accent mb-2">Our Vision</h3>
                      <p className="text-sm">To become Africa’s leading practical learning and professional growth platform, starting from Rwanda and expanding globally.</p>
                    </div>
                    <div className="p-6 bg-card rounded-xl border border-border/50">
                      <h3 className="font-heading font-bold text-accent mb-2">Our Mission</h3>
                      <p className="text-sm">To empower individuals and organizations with real skills, real experience, and intelligent digital solutions.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-card group">
                  <img
                    src={aboutImage}
                    srcSet={`${aboutImageMobile} 600w, ${aboutImage} 1280w`}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    alt="IHUB training session"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-lg shadow-card-hover border border-border/30">
                  <p className="text-3xl font-heading font-bold text-accent">Real</p>
                  <p className="text-sm text-card-foreground/70">Projects, Not Theory</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="font-heading text-2xl lg:text-4xl font-medium text-card-foreground mb-6">Our Story</h2>
              <p className="text-card-foreground/80 text-lg leading-relaxed">
                IHUB was founded by <strong>Manzi Alain Patrick Munyeshuri</strong>, a Rwandan technologist driven
                by the need to close the gap between education and employability. He envisioned a platform where
                learning is directly connected to real projects and mentorship.
              </p>
              <p className="text-card-foreground/80 text-lg leading-relaxed mt-4">
                He was later joined by <strong>Bizimana Eric</strong>, Co-Founder, who brought operational and technical
                leadership to help scale training programs, internships, and software delivery.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-accent text-sm font-medium uppercase tracking-wider">What We Do</span>
              <h2 className="font-heading text-2xl lg:text-4xl font-medium text-foreground mt-2">Core Services</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 bg-card rounded-xl border border-border/50 hover:shadow-card-hover transition-all group"
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <service.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-bold text-card-foreground mb-3">{service.title}</h3>
                  <p className="text-card-foreground/70 text-sm leading-relaxed">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Leadership</span>
              <h2 className="font-heading text-2xl lg:text-4xl font-medium text-card-foreground mt-2">Meet the Founders</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-background p-8 rounded-2xl shadow-card border border-border/30 text-center"
                >
                  <div className="w-24 h-24 bg-accent/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground">{member.name}</h3>
                  <p className="text-accent text-sm font-medium mb-4">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-background text-center">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-8">Ready to Build the Future?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/training">
                <Button variant="gold" size="lg" className="px-8 h-12">Start Training</Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="px-8 h-12">Talk to Us</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
