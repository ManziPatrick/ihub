import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { Code, Database, Wifi, Briefcase, BookOpen, Building2, CheckCircle, Users, Award, Zap, ArrowRight, Globe, Cpu, BarChart3 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import internshipImage from "@/assets/internship-work.webp";
import internshipImageMobile from "@/assets/internship-work-mobile.webp";

const trainingServices = [
  {
    icon: Code,
    title: "Software & Product Training",
    description: "Comprehensive web, mobile and product development programs",
    details: [
      "Frontend: HTML, CSS, JavaScript, React, Vue.js",
      "Backend: Node.js, Python, PHP, Java",
      "Mobile: React Native, Flutter, Android/iOS",
      "Version control with Git & GitHub",
      "Product thinking, planning and delivery"
    ],
    duration: "3-6 months",
    level: "Beginner to Advanced"
  },
  {
    icon: Database,
    title: "Data Science & AI Training",
    description: "Master data analysis and machine learning fundamentals",
    details: [
      "Python for Data Science",
      "Statistical analysis & visualization",
      "Machine Learning algorithms",
      "Deep Learning & Neural Networks",
      "Big Data tools: Spark, Hadoop"
    ],
    duration: "4-6 months",
    level: "Intermediate to Advanced"
  },
  {
    icon: Wifi,
    title: "IoT & Smart Systems Training",
    description: "Build connected devices and automation solutions",
    details: [
      "Arduino & Raspberry Pi programming",
      "Sensor integration & data collection",
      "MQTT & IoT protocols",
      "Cloud IoT platforms (AWS IoT, Azure)",
      "Smart agriculture & home automation projects"
    ],
    duration: "3-4 months",
    level: "Beginner to Intermediate"
  },
  {
    icon: BookOpen,
    title: "Digital Skills & Literacy",
    description: "Essential digital competencies for the modern workplace",
    details: [
      "Microsoft Office Suite mastery",
      "Google Workspace & productivity tools",
      "Digital marketing fundamentals",
      "Basic cybersecurity awareness",
      "Remote work & collaboration tools"
    ],
    duration: "1-2 months",
    level: "Beginner"
  },
  {
    icon: Briefcase,
    title: "Career Pathways & Internships",
    description: "Real internship placements and project guidance for learners ready to move from training to work.",
    details: [
      "Industry internship matching",
      "Project-based learning support",
      "Mentor-led career coaching",
      "Portfolio and resume preparation",
      "Employer-ready soft skills"
    ],
    duration: "2-4 months",
    level: "Beginner to Intermediate"
  },
];

const techServices = [
  {
    icon: Code,
    title: "Project Delivery & Product Support",
    description: "Support for real client projects, product launches and digital transformation initiatives.",
    offerings: [
      "Web application development",
      "Mobile app development (iOS & Android)",
      "Enterprise software solutions",
      "API development & integration",
      "E-commerce platforms",
      "CRM & ERP systems"
    ]
  },
  {
    icon: Database,
    title: "Data & AI Solutions",
    description: "Transform your data into actionable insights",
    offerings: [
      "Business intelligence dashboards",
      "Predictive analytics models",
      "Data pipeline development",
      "Natural Language Processing (NLP)",
      "Computer vision applications",
      "AI chatbots & virtual assistants"
    ]
  },
  {
    icon: Wifi,
    title: "IoT Solutions",
    description: "Smart connected systems for industry and agriculture",
    offerings: [
      "Smart farming solutions",
      "Industrial automation systems",
      "Asset tracking & monitoring",
      "Environmental sensing systems",
      "Smart building solutions",
      "Fleet management systems"
    ]
  },
  {
    icon: Building2,
    title: "IT Consultancy",
    description: "Strategic technology advisory for digital transformation",
    offerings: [
      "Digital transformation strategy",
      "Technology stack assessment",
      "IT infrastructure planning",
      "Cybersecurity consulting",
      "Cloud migration services",
      "Process automation consulting"
    ]
  },
];

const corporateServices = [
  {
    icon: Users,
    title: "Corporate Training Programs",
    description: "Upskill your workforce with customized training solutions tailored to your organization's needs.",
  },
  {
    icon: Award,
    title: "Certification Programs",
    description: "Industry-recognized certifications that validate your team's expertise and boost credibility.",
  },
  {
    icon: Zap,
    title: "Innovation Workshops",
    description: "Hands-on workshops focused on emerging technologies and innovation methodologies.",
  },
];

const whyChooseUs = [
  { icon: Award, title: "Industry-Aligned Curriculum", description: "Programs shaped by employers, local market needs, and regional career opportunities" },
  { icon: Users, title: "Expert Instructors", description: "Learn from professionals with real-world industry experience" },
  { icon: Briefcase, title: "Practical Projects", description: "Build a portfolio with hands-on, real-world projects and internship deliverables" },
  { icon: Globe, title: "Career Support", description: "Job placement assistance and career guidance for all graduates" },
];

const Services = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Services | Bootskills - Courses, Internships & Projects in Rwanda</title>
        <meta name="description" content="Bootskills provides practical courses, internships, and project-based learning across tech, business, creative and leadership fields from Kigali, Rwanda to East Africa." />
      </Helmet>
      <Header />
      <main className="pt-20">
        {/* Hero */}
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
          <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-4">
                Our Services
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Practical Courses, Internships & Project-Based Learning
              </h1>
              <p className="text-card-foreground/80 max-w-3xl mx-auto text-lg leading-relaxed">
                Bootskills offers career-focused training across tech, business, creative, and leadership areas with internships,
                real client projects, and local delivery from Kigali, Rwanda to East Africa.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link to="/explore">
                  <Button variant="gold" size="lg">View Training Programs</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">Request Consultation</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Training Services */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">For Individuals</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                Training, Internships & Project Pathways
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Practical learning designed to make learners industry-ready through hands-on courses,
                internship placements, and live project experience across multiple sectors.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8">
              {trainingServices.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 lg:p-8 rounded-xl shadow-card border border-border/30 group hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                      <service.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-card-foreground">{service.title}</h3>
                      <p className="text-sm text-card-foreground/70">{service.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {service.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-card-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border/30">
                    <span className="text-xs text-card-foreground/60 flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {service.duration}
                    </span>
                    <span className="text-xs text-card-foreground/60 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> {service.level}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/explore">
                <Button variant="gold">
                  View All Training Programs <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Image Banner */}
        <section className="py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="relative h-64 lg:h-80 rounded-xl overflow-hidden group"
            >
              <img
                src={internshipImage}
                srcSet={`${internshipImageMobile} 600w, ${internshipImage} 1280w`}
                sizes="(max-width: 1024px) 100vw, 80vw"
                alt="Students in training"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/90 to-card/40 flex items-center">
                <div className="px-8 lg:px-12 max-w-xl">
                  <h3 className="font-heading text-2xl lg:text-3xl font-semibold text-card-foreground mb-3">
                    Learn by Doing
                  </h3>
                  <p className="text-card-foreground/80">
                    Our hands-on approach ensures you build real projects and gain practical experience
                    that employers value.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Technology Services */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">For Organizations</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2 mb-4">
                Business Training, Project Support & Talent Development
              </h2>
              <p className="text-card-foreground/80 max-w-2xl mx-auto">
                Practical services for teams, projects and local businesses that need training, internships, and operational support.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-6">
              {techServices.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-6 lg:p-8 rounded-xl shadow-card border border-border/30 group hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <service.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {service.offerings.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Corporate Training */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Enterprise Solutions</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2">
                Corporate Training & Upskilling
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {corporateServices.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl shadow-card border border-border/30 text-center group hover:shadow-card-hover transition-all"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <service.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-2">{service.title}</h3>
                  <p className="text-sm text-card-foreground/70 leading-relaxed">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">The Bootskills Advantage</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                Why Choose bootskills??
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {whyChooseUs.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <item.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-card-foreground/70">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Whether you're an individual looking to upskill or an organization seeking technology solutions,
                we're here to help you succeed.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <AuthAwareLink variant="gold" size="lg">Explore Training</AuthAwareLink>
                <Link to="/contact">
                  <Button variant="outline" size="lg">Request Quote</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
