import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { Helmet } from "react-helmet-async";
import testimonialEmmanuel from "@/assets/testimonial-emmanuel.webp";
import testimonialMarie from "@/assets/testimonial-marie.webp";
import testimonialJean from "@/assets/testimonial-jean.webp";
import testimonialSarah from "@/assets/testimonial-sarah.webp";
import { Briefcase, Code, Database, Wifi, Award, FolderOpen, Users, Clock, CheckCircle, ArrowRight, Target, Calendar, Globe } from "lucide-react";
import internshipImage from "@/assets/internship-work.webp";
import internshipImageMobile from "@/assets/internship-work-mobile.webp";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAMS, GET_MY_INTERNSHIP_APPLICATIONS, GET_ME } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock as ClockIcon, Users as UsersIcon, Calendar as CalendarIcon, CheckCircle as CheckCircleIcon, ArrowRight as ArrowRightIcon } from "lucide-react";


const benefits = [
  { icon: FolderOpen, title: "Real Projects", description: "Work on actual client projects and products, not simulated exercises. Your work will have real impact." },
  { icon: Users, title: "Mentorship", description: "One-on-one guidance from experienced professionals who are invested in your growth and success." },
  { icon: Award, title: "Certification", description: "Receive a recognized internship certificate that validates your experience to future employers." },
  { icon: Clock, title: "Flexible Schedule", description: "Balance your internship with other commitments. We offer part-time and flexible arrangements." },
  { icon: Globe, title: "Remote-Friendly", description: "Participate from anywhere with our online and hybrid internship options." },
  { icon: Target, title: "Career Pathway", description: "Top performers get priority access to full-time positions and advanced opportunities." },
];

const process = [
  { step: "1", title: "Apply Online", description: "Submit your application with resume and a brief statement of interest." },
  { step: "2", title: "Skills Assessment", description: "Complete a short technical assessment relevant to your chosen track." },
  { step: "3", title: "Interview", description: "Meet with our team to discuss your goals and expectations." },
  { step: "4", title: "Onboarding", description: "Get set up with tools, meet your mentor, and start your internship journey." },
];

const testimonials = [
  {
    name: "Emmanuel R.",
    role: "Former Software Intern",
    current: "Now Junior Developer at TechCorp",
    quote: "The internship gave me real project experience that made all the difference in my job interviews. The mentorship was invaluable."
  },
  {
    name: "Grace M.",
    role: "Former Data Science Intern",
    current: "Now Data Analyst at FinanceHub",
    quote: "Working on actual business problems taught me more in 3 months than years of self-study. Highly recommend!"
  },
];

const Internships = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: internsData, loading: internsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS);
  const { data: appsData } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS, {
    skip: !isAuthenticated
  });

  const internshipPrograms = (internsData as any)?.internshipPrograms?.items || [];
  const myApplications = (appsData as any)?.myInternshipApplications || [];

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'software': return Code;
      case 'data': return Database;
      case 'iot': return Wifi;
      default: return Briefcase;
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Internships | Bootskills - Real-World Experience in Kigali, Rwanda</title>
        <meta name="description" content="Gain real-world experience with Bootskills internships in Kigali, Rwanda. Work on real projects, get mentored by experts, and build a portfolio that stands out." />
        <link rel="canonical" href="https://bootskills.com/internships" />
        <meta property="og:title" content="Internships | Bootskills - Real-World Experience in Kigali, Rwanda" />
        <meta property="og:description" content="Bridge the gap between learning and employment with structured internship programs. Work on real projects, get mentored by experts." />
        <meta property="og:url" content="https://bootskills.com/internships" />
        <meta property="og:type" content="website" />
        <meta name="geo.region" content="RW-01" />
        <meta name="geo.placename" content="Kigali" />
        <meta name="geo.position" content="-1.9441;30.0619" />
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
                Internship Programs
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Gain Real-World Experience That Matters
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg">
                Bridge the gap between learning and employment with our structured internship programs.
                Work on real projects, get mentored by experts, and build a portfolio that stands out.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <AuthAwareLink variant="gold" size="lg" to="/portal/student/internship">Apply for Internship</AuthAwareLink>
                <Link to="/explore">
                  <Button variant="outline" size="lg">View Training First</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Why Intern With Us</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                What You'll Gain
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our internships are designed to give you the practical experience employers want to see,
                combined with the support you need to succeed.
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl shadow-card border border-border/30 group hover:shadow-card-hover transition-all"
                >
                  <div className="w-12 h-12 mb-4 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-card-foreground/70 leading-relaxed">{benefit.description}</p>
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
              className="relative h-64 lg:h-96 rounded-xl overflow-hidden group"
            >
              <img
                src={internshipImage}
                srcSet={`${internshipImageMobile} 600w, ${internshipImage} 1280w`}
                sizes="(max-width: 1024px) 100vw, 80vw"
                alt="Interns collaborating on a project"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent flex items-end">
                <div className="p-8 lg:p-12 max-w-2xl">
                  <h3 className="font-heading text-2xl lg:text-3xl font-semibold text-card-foreground mb-3">
                    Collaborate. Create. Grow.
                  </h3>
                  <p className="text-card-foreground/80">
                    Join a community of driven individuals working together to build real solutions
                    while developing skills that will define your career.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Available Internships */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Open Positions</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                Available Internships
              </h2>
            </motion.div>
            <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {internshipPrograms.length === 0 && !internsLoading ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No internship programs available at the moment.</p>
                </div>
              ) : (
                internshipPrograms.map((intern: any, index: number) => {
                  const Icon = getCategoryIcon(intern.normalizedCategory);
                  const application = myApplications.find((app: any) => app.internshipProgram?.id === (intern.id || intern._id));
                  const appStatus = application?.status;

                  return (
                    <motion.div
                      key={intern.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-background p-6 rounded-xl shadow-card border border-border/30 group hover:shadow-card-hover transition-all flex flex-col"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <Icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-foreground">{intern.title}</h3>
                          <p className="text-xs text-muted-foreground">{intern.duration} • {intern.type || 'Remote'}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{intern.description}</p>

                      <div className="mb-6">
                        <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                          <Target className="w-3 h-3 text-accent" /> Highlights:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                            {intern.normalizedCategory}
                          </span>
                          <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                            {intern.maxSpots} Spots
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        {(() => {
                          if (appStatus === 'approved') {
                            return (
                              <Button 
                                className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold"
                                onClick={() => navigate('/portal/student/internship')}
                              >
                                Continue <ArrowRightIcon className="w-4 h-4 ml-2" />
                              </Button>
                            );
                          }

                          if (appStatus === 'pending') {
                            return (
                              <Button 
                                disabled
                                className="w-full bg-amber-500 rounded-xl font-bold"
                              >
                                Pending <ClockIcon className="w-4 h-4 ml-2" />
                              </Button>
                            );
                          }

                          if (appStatus === 'rejected') {
                            return (
                              <Button 
                                disabled
                                className="w-full bg-red-500 rounded-xl font-bold"
                              >
                                Rejected <CheckCircleIcon className="w-4 h-4 ml-2" />
                              </Button>
                            );
                          }

                          return (
                            <AuthAwareLink 
                              variant="gold" 
                              size="sm" 
                              className="w-full" 
                              to="/portal/student/internship"
                            >
                              Apply Now <ArrowRightIcon className="w-4 h-4 ml-2" />
                            </AuthAwareLink>
                          );
                        })()}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">How to Apply</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2">
                Application Process
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {process.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-heading font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
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
                What Our Interns Say
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-foreground text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-accent">{testimonial.current}</p>
                    </div>
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
            >
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mb-4">
                Ready to Start Your Internship?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Applications are reviewed on a rolling basis. Apply early to secure your spot
                in our next cohort of interns.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <AuthAwareLink variant="gold" size="lg" to="/portal/student/internship">Apply Now</AuthAwareLink>
                <Link to="/explore">
                  <Button variant="outline" size="lg">Explore Training First</Button>
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

export default Internships;
