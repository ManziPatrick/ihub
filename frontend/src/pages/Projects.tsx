import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import { Code, Database, Wifi, ExternalLink, CheckCircle, Users, Calendar } from "lucide-react";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import internshipImage from "@/assets/internship-work.webp";
import internshipImageMobile from "@/assets/internship-work-mobile.webp";

const projects = [
  {
    icon: Code,
    title: "E-Commerce Platform",
    category: "Software Development",
    description: "Full-stack web application for online retail with payment integration",
    details: "Built a comprehensive e-commerce solution for a local retailer, featuring product catalog, cart functionality, M-Pesa and card payment integration, order management, and admin dashboard.",
    technologies: ["React", "Node.js", "MongoDB", "Stripe", "M-Pesa API"],
    client: "Local Retail Business",
    duration: "4 months"
  },
  {
    icon: Database,
    title: "Business Analytics Dashboard",
    category: "Data Science",
    description: "Real-time business intelligence and data visualization platform",
    details: "Developed an interactive analytics dashboard that aggregates data from multiple sources, providing real-time insights on sales, inventory, and customer behavior with predictive forecasting.",
    technologies: ["Python", "Tableau", "PostgreSQL", "Apache Airflow"],
    client: "Financial Services Company",
    duration: "3 months"
  },
  {
    icon: Wifi,
    title: "Smart Agriculture System",
    category: "IoT",
    description: "Sensor-based farm monitoring and automated irrigation solution",
    details: "Implemented an IoT solution for a commercial farm featuring soil moisture sensors, weather monitoring, automated irrigation control, and a mobile app for remote monitoring and alerts.",
    technologies: ["Arduino", "Raspberry Pi", "MQTT", "React Native", "AWS IoT"],
    client: "Agricultural Cooperative",
    duration: "5 months"
  },
  {
    icon: Code,
    title: "Mobile Banking Application",
    category: "Software Development",
    description: "Secure mobile financial services application with biometric auth",
    details: "Developed a secure mobile banking app enabling account management, fund transfers, bill payments, and mobile money integration with biometric authentication and encryption.",
    technologies: ["React Native", "Node.js", "PostgreSQL", "AWS", "Biometric SDK"],
    client: "Microfinance Institution",
    duration: "6 months"
  },
  {
    icon: Database,
    title: "Predictive Maintenance AI",
    category: "AI/ML",
    description: "Machine learning model for industrial equipment monitoring",
    details: "Built a predictive maintenance system using sensor data and machine learning to predict equipment failures before they occur, reducing downtime and maintenance costs by 40%.",
    technologies: ["Python", "TensorFlow", "Scikit-learn", "IoT Sensors", "Azure ML"],
    client: "Manufacturing Company",
    duration: "4 months"
  },
  {
    icon: Wifi,
    title: "Smart Building Controller",
    category: "IoT",
    description: "Home and office automation with energy management",
    details: "Designed and deployed a smart building system with automated lighting, HVAC control, security monitoring, and energy usage optimization through a centralized control interface.",
    technologies: ["ESP32", "Home Assistant", "MQTT", "Node-RED", "React"],
    client: "Commercial Property Developer",
    duration: "3 months"
  },
];

const stats = [
  { number: "50+", label: "Projects Delivered" },
  { number: "30+", label: "Happy Clients" },
  { number: "95%", label: "Client Satisfaction" },
  { number: "4", label: "Countries Served" },
];

const Projects = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Projects & Portfolio"
        description="Explore real solutions developed by Bootskills teams across software development, data science, AI, and IoT. See our portfolio of projects delivered for clients in Rwanda and East Africa."
        canonicalUrl="https://bootskills.com/projects"
        keywords="Bootskills projects, Rwanda software development, AI solutions Africa, IoT projects, portfolio Kigali"
        ogImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200&h=630"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd("Projects & Portfolio", "Explore real solutions developed by Bootskills teams for clients across software development, data science, AI, and IoT.", "https://bootskills.com/projects"),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Projects", item: "/projects" },
              ]),
            ]
          })}
        </script>
      </SEOHead>
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
                Our work
              </span>
              <h1 className="font-heading text-3xl lg:text-4xl font-medium text-card-foreground mb-3">
                Built with real clients
              </h1>
              <p className="text-card-foreground/80 max-w-lg mx-auto">
                Shops, farms, banks, factories — things people actually use.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl lg:text-4xl font-heading font-bold text-accent mb-1">
                    {stat.number}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Case Studies</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                Featured Projects
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore some of our recent work across different technology domains and industries.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl overflow-hidden shadow-card border border-border/30 group hover:shadow-card-hover transition-all"
                >
                  <div className="h-48 bg-gradient-to-br from-card via-card to-accent/10 flex items-center justify-center relative overflow-hidden">
                    <project.icon className="w-16 h-16 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1} />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-5 h-5 text-accent" />
                    </div>
                    <span className="absolute top-4 left-4 text-xs bg-accent/20 text-accent px-3 py-1 rounded-full">
                      {project.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-semibold text-card-foreground mb-2 group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-card-foreground/70 mb-4">{project.details}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="text-xs bg-background px-2 py-1 rounded text-muted-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-card-foreground/60 pt-4 border-t border-border/30">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {project.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {project.duration}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Image Section */}
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
                alt="Our team at work"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/90 to-card/40 flex items-center">
                <div className="px-8 lg:px-12 max-w-xl">
                  <h3 className="font-heading text-2xl lg:text-3xl font-semibold text-card-foreground mb-3">
                    Building Solutions That Matter
                  </h3>
                  <p className="text-card-foreground/80">
                    Every project is an opportunity to solve real problems and create lasting impact
                    for our clients and their communities.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">How We Work</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                Our Development Process
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { step: "1", title: "Discovery", description: "Understanding your needs, goals, and constraints" },
                { step: "2", title: "Design", description: "Creating solutions architecture and prototypes" },
                { step: "3", title: "Development", description: "Building with agile methodology and regular updates" },
                { step: "4", title: "Delivery", description: "Testing, deployment, and ongoing support" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-heading font-bold text-lg">
                    {item.step}
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
                Have a Project in Mind?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Let's discuss how we can help bring your ideas to life with our technology expertise
                and experienced development team.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <AuthAwareLink variant="gold" size="lg">Start a Project</AuthAwareLink>
                <Link to="/services">
                  <Button variant="outline" size="lg">View Our Services</Button>
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

export default Projects;
