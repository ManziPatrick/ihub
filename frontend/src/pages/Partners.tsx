import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import testimonialEmmanuel from "@/assets/testimonial-emmanuel.webp";
import testimonialMarie from "@/assets/testimonial-marie.webp";
import testimonialJean from "@/assets/testimonial-jean.webp";
import testimonialSarah from "@/assets/testimonial-sarah.webp";
import { Button } from "@/components/ui/button";
import { Building2, GraduationCap, Landmark, Heart, CheckCircle, Handshake, Users, Globe, Award, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-training.webp";
import aboutImage from "@/assets/about-training.webp";

const partnerTypes = [
  {
    icon: Building2,
    title: "Businesses & Startups",
    description: "Technology solutions, custom software, and corporate training programs",
    benefits: [
      "Custom software development",
      "Staff upskilling programs",
      "Technology consultancy",
      "Intern pipeline access"
    ]
  },
  {
    icon: GraduationCap,
    title: "Educational Institutions",
    description: "Academic partnerships, curriculum development, and guest lectures",
    benefits: [
      "Joint certification programs",
      "Guest industry speakers",
      "Student internship placements",
      "Lab & resource sharing"
    ]
  },
  {
    icon: Landmark,
    title: "Government Agencies",
    description: "Digital transformation initiatives and public sector training",
    benefits: [
      "Digital skills programs",
      "E-government solutions",
      "Youth employment initiatives",
      "Technology advisory"
    ]
  },
  {
    icon: Heart,
    title: "NGOs & Development Orgs",
    description: "Skills development programs and technology for social impact",
    benefits: [
      "Sponsored training cohorts",
      "Tech for good projects",
      "Community outreach programs",
      "Impact measurement tools"
    ]
  },
];

const partnershipBenefits = [
  { icon: Users, title: "Talent Pipeline", description: "Access to a pool of trained, job-ready tech professionals" },
  { icon: Award, title: "Quality Assurance", description: "Industry-aligned training ensures graduates meet your standards" },
  { icon: Globe, title: "Regional Reach", description: "Expand your impact across Rwanda and East Africa" },
  { icon: Handshake, title: "Collaborative Approach", description: "We work closely with you to meet your specific needs" },
];

const currentPartners = [
  { name: "Rwanda ICT Chamber", type: "Industry Association" },
  { name: "University of Rwanda", type: "Academic Partner" },
  { name: "Ministry of ICT", type: "Government" },
  { name: "GIZ Digital Transformation", type: "Development Partner" },
  { name: "TechStartups Rwanda", type: "Startup Ecosystem" },
  { name: "African Development Bank", type: "Development Finance" },
];

const testimonials = [
  {
    quote: "MultiCourses's training programs have been instrumental in building our technical team. The graduates are well-prepared and hit the ground running.",
    name: "Jean Paul M.",
    role: "CTO",
    company: "TechCorp Rwanda"
  },
  {
    quote: "Our partnership has enabled us to upskill over 100 employees in data analytics. The customized curriculum was exactly what we needed.",
    name: "Marie C.",
    role: "HR Director",
    company: "Financial Services Group"
  },
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-4">
                Partnerships
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Partners & Clients
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg">
                Collaboration for impact. We work with institutions, businesses, and organizations
                to deliver quality training and technology solutions that drive Africa's digital transformation.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Link to="/contact">
                  <Button variant="gold" size="lg">Become a Partner</Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg">View Our Services</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Partnership Benefits */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {partnershipBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-card flex items-center justify-center shadow-card">
                    <benefit.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner Types */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Who We Work With</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2 mb-4">
                Partnership Opportunities
              </h2>
              <p className="text-card-foreground/80 max-w-2xl mx-auto">
                We collaborate with diverse organizations to create tailored solutions that address
                specific needs and maximize impact.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {partnerTypes.map((partner, index) => (
                <motion.div
                  key={partner.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-6 rounded-xl shadow-card border border-border/30 group hover:shadow-card-hover transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                      <partner.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-1">{partner.title}</h3>
                      <p className="text-sm text-muted-foreground">{partner.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 pl-4">
                    {partner.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
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
                src={aboutImage}
                alt="Partnership meeting"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/90 to-card/40 flex items-center">
                <div className="px-8 lg:px-12 max-w-xl">
                  <h3 className="font-heading text-2xl lg:text-3xl font-semibold text-card-foreground mb-3">
                    Collaboration Drives Innovation
                  </h3>
                  <p className="text-card-foreground/80">
                    We believe in the power of partnerships to create solutions that neither
                    party could achieve alone.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Current Partners */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Our Network</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2">
                Current Partners
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {currentPartners.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-5 rounded-xl shadow-card border border-border/30 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-card-foreground text-sm">{partner.name}</p>
                    <p className="text-xs text-card-foreground/60">{partner.type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Success Stories</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                What Our Partners Say
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-6 rounded-xl shadow-card border border-border/30"
                >
                  <p className="text-muted-foreground italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-heading font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                  </div>
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
              className="max-w-2xl mx-auto"
            >
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mb-4">
                Ready to Partner With Us?
              </h2>
              <p className="text-muted-foreground mb-6">
                Join us in building Africa's digital future. Whether you're looking for talent,
                training, or technology solutions, we'd love to explore how we can work together.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/contact">
                  <Button variant="gold" size="lg">
                    Start a Conversation <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/projects">
                  <Button variant="outline" size="lg">View Our Work</Button>
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

export default Partners;
