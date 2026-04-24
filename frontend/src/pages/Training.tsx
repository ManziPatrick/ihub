import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { Code, Database, Wifi, Clock, Users, Award, CheckCircle, BookOpen, Target, Briefcase, Calendar, ArrowRight, Brain, Shield, Building2, Stethoscope, GraduationCap, Landmark, ShoppingBag, Factory, BarChart, ChevronRight, User, Tag, ChevronLeft, Share2, Facebook, Twitter, Linkedin, Copy, Check, Eye } from "lucide-react";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import aboutImage from "@/assets/about-training.webp";
import aboutImageMobile from "@/assets/about-training-mobile.webp";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_COURSES } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EnrollCourseDialog, ApplyCourseDialog } from "@/components/portal/dialogs";

interface AICourse {
  _id: string;
  title: string;
  department: string;
  duration: string;
  level: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice: number;
  instructor?: {
    username: string;
  };
  keyModules: string[];
  additionalModulesCount: number;
  slug: string;
  featured: boolean;
  enrollmentLink?: string;
}

const getDepartmentIcon = (dept: string) => {
  switch (dept) {
    case 'HEALTHCARE': return Stethoscope;
    case 'FINANCE': return Landmark;
    case 'EDUCATION': return GraduationCap;
    case 'MARKETING': return ShoppingBag;
    case 'MANUFACTURING': return Factory;
    case 'HR': return Users;
    case 'CYBERSECURITY': return Shield;
    case 'GENERAL': return Brain;
    default: return Brain;
  }
};

const features = [
  { icon: Clock, title: "Flexible Schedules", description: "Evening and weekend classes available for working professionals" },
  { icon: Users, title: "Expert Instructors", description: "Learn from industry practitioners with real-world experience" },
  { icon: Award, title: "Recognized Certification", description: "Earn certificates valued by employers across Africa" },
  { icon: BookOpen, title: "Project-Based Learning", description: "Build a portfolio with real projects, not just theory" },
  { icon: Target, title: "Career Support", description: "Resume review, interview prep, and job placement assistance" },
  { icon: Briefcase, title: "Internship Opportunities", description: "Access to internship placements with partner companies" },
];

const faqs = [
  { q: "Do I need prior experience?", a: "For beginner-level programs, no prior experience is needed. We start from fundamentals. Intermediate programs require basic programming knowledge." },
  { q: "What is the class schedule?", a: "We offer flexible schedules including weekday evenings (6-9 PM) and weekend sessions. Full-time intensive options are also available." },
  { q: "Will I get a certificate?", a: "Yes, all graduates receive an industry-recognized certificate upon successful completion of their program and capstone project." },
  { q: "Is job placement guaranteed?", a: "While we cannot guarantee employment, we have a 95% job placement rate within 6 months of graduation and provide comprehensive career support." },
  { q: "Are AI courses suitable for non-technical staff?", a: "Absolutely! Our department-specific AI courses are designed for professionals at all technical levels, focusing on practical applications rather than coding." },
];

const API_BASE_URL = getApiBaseUrl();

const Training = () => {
  const { data, loading: apolloLoading } = useQuery(GET_COURSES);
  const courses = (data as any)?.courses || [];

  const [aiCourses, setAICourses] = useState<AICourse[]>([]);
  const [aiLoading, setAILoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [applyCourse, setApplyCourse] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEnrollClick = (course: any) => {
    if (!user) {
      toast.info("Please login to enroll in courses");
      navigate(`/auth?redirect=/training`);
      return;
    }
    if (course.enrollmentMode === 'application') {
      setApplyCourse(course);
    } else {
      setEnrollCourse(course);
    }
  };

  const departments = ["ALL", "GENERAL", "HEALTHCARE", "FINANCE", "EDUCATION", "MARKETING", "MANUFACTURING", "HR", "CYBERSECURITY"];

  useEffect(() => {
    const fetchAICourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-courses`);
        if (response.ok) {
          const data = await response.json();
          setAICourses(data);
        }
      } catch (error) {
        console.error("Error fetching AI courses:", error);
      } finally {
        setAILoading(false);
      }
    };

    fetchAICourses();
  }, []);

  const filteredAICourses = filter === "ALL"
    ? aiCourses
    : aiCourses.filter(course => course.department === filter);

  return (
    <div className="min-h-screen bg-background">
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
                Training Programs
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Industry-Ready Technology Training
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg mb-8">
                Comprehensive programs designed with industry input, delivered by experts,
                and focused on practical skills that employers demand.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-card-foreground/70">
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4 text-accent" /> Flexible schedules
                </span>
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Users className="w-4 h-4 text-accent" /> Expert trainers
                </span>
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Award className="w-4 h-4 text-accent" /> Certified programs
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Programs Grid */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Our Programs</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                Choose Your Learning Path
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Each program includes hands-on projects, mentorship, and career support to ensure
                you're ready for real-world challenges.
              </p>
            </motion.div>

            {apolloLoading && (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(courses?.items || []).map((course: any, index: number) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/30 group hover:shadow-xl transition-all h-full flex flex-col"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm">{course.category}</Badge>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-accent/5 px-2 py-1 rounded-full text-accent font-medium uppercase tracking-wider">{course.level}</span>
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3 line-clamp-2">
                      {course.title}
                    </h3>
                    <div
                      className="text-muted-foreground text-sm mb-6 line-clamp-3 prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />
                    <div className="mt-auto pt-6 border-t border-border/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Investment</span>
                          <div className="flex items-baseline gap-2">
                            {course.discountPrice > 0 ? (
                              <>
                                <span className="text-base font-bold text-accent">RWF {course.discountPrice.toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground line-through">RWF {course.price.toLocaleString()}</span>
                              </>
                            ) : (
                              <span className="text-base font-bold text-accent">
                                {course.price === 0 ? "Scholarship" : `RWF ${course.price.toLocaleString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link to={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs font-bold border-accent/20 hover:border-accent/50">
                            Details
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/10">
                         <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase">Instructor</span>
                          <span className="text-xs font-semibold">{course.instructor?.username || 'Expert'}</span>
                        </div>
                      </div>
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="w-full rounded-xl font-bold h-10 shadow-lg shadow-gold/20"
                        onClick={() => handleEnrollClick(course)}
                      >
                        Enroll Now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Courses Section */}
        <section className="py-16 lg:py-20 bg-gradient-to-br from-background via-background to-accent/5">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">AI Specialization Programs</span>
              <h2 className="font-heading text-2xl lg:text-4xl font-bold text-foreground mt-2 mb-4">
                AI for Every Department
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Master the tools and techniques that are reshaping the professional world.
                Our programs cover both productive AI applications and essential safety safeguards.
              </p>
            </motion.div>

            {/* Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilter(dept)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${filter === dept
                    ? "bg-accent text-white shadow-lg shadow-accent/40 scale-105"
                    : "bg-card/50 text-muted-foreground border border-border/50 hover:border-accent/30 hover:bg-accent/5"
                    }`}
                >
                  {dept === "GENERAL" ? "ALL DEPARTMENTS" : dept}
                </button>
              ))}
            </div>

            {aiLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAICourses.map((course, index) => {
                  const DeptIcon = getDepartmentIcon(course.department);
                  return (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="group h-full"
                    >
                      <div className="relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent via-purple-500/50 to-accent rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-700" />
                        <div className="relative h-full bg-card/90 backdrop-blur-xl rounded-2xl border border-border/30 group-hover:border-accent/50 transition-all duration-500 overflow-hidden flex flex-col">
                          {/* Image Header */}
                          <div className="h-32 relative overflow-hidden">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                            <div className="absolute top-4 left-4">
                              <div className="p-2 rounded-xl bg-accent/20 backdrop-blur-md border border-accent/30">
                                <DeptIcon size={18} className="text-accent" />
                              </div>
                            </div>
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-background/80 text-foreground border-border/50 text-[10px] font-bold">
                                {course.level}
                              </Badge>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                                {course.department === "GENERAL" ? "ALL DEPARTMENTS" : course.department}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                <Clock size={12} className="text-accent" />
                                {course.duration}
                              </div>
                            </div>

                            <h3 className="text-base font-heading font-bold mb-2 group-hover:text-accent transition-colors duration-300 line-clamp-2">
                              {course.title}
                            </h3>

                            <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                              {course.description}
                            </p>

                            <div className="space-y-2 mb-6 flex-grow">
                              <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle size={10} className="text-accent" />
                                Outcomes
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {course.keyModules.slice(0, 3).map((module, i) => (
                                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-accent/5 border border-accent/10 text-muted-foreground">
                                    {module}
                                  </span>
                                ))}
                                {course.keyModules.length > 3 && (
                                  <span className="text-[9px] text-accent/70 font-medium py-0.5">
                                    +{course.keyModules.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">Investment</span>
                                <div className="flex items-baseline gap-2">
                                  {course.discountPrice > 0 ? (
                                    <>
                                      <span className="text-sm font-bold text-accent">RWF {course.discountPrice.toLocaleString()}</span>
                                      <span className="text-[9px] text-muted-foreground line-through">RWF {course.price.toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <span className="text-sm font-bold text-accent">
                                      {course.price === 0 ? "Scholarship" : `RWF ${course.price.toLocaleString()}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link
                                  to={`/courses/${course._id}`}
                                  className="flex items-center justify-center p-2.5 rounded-xl bg-card border border-border/50 text-muted-foreground hover:text-accent hover:border-accent/50 transition-all duration-300"
                                >
                                  <Eye size={18} />
                                </Link>
                                <Button
                                  variant="gold"
                                  size="sm"
                                  className="flex-1 rounded-xl font-bold shadow-lg shadow-gold/20"
                                  onClick={() => handleEnrollClick(course)}
                                >
                                  Enroll Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Corporate Training CTA */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-8 text-center shadow-card border border-accent/30"
            >
              <Brain className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="font-heading text-xl lg:text-2xl font-semibold text-card-foreground mb-2">
                Need Custom AI Training for Your Organization?
              </h3>
              <p className="text-card-foreground/70 max-w-2xl mx-auto mb-6">
                We design tailored AI training programs for enterprises, government agencies, and institutions.
                Cover multiple departments with a unified curriculum that addresses your specific industry challenges.
              </p>
              <Link to="/contact">
                <Button variant="gold" size="lg">
                  Request Corporate Training <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
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
                srcSet={`${aboutImageMobile} 600w, ${aboutImage} 1280w`}
                sizes="(max-width: 1024px) 100vw, 50vw"
                alt="Training session at CODEMANDE"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/90 to-transparent flex items-center">
                <div className="px-8 lg:px-12 max-w-lg">
                  <h3 className="font-heading text-2xl lg:text-3xl font-semibold text-card-foreground mb-3">
                    Hands-On Learning Environment
                  </h3>
                  <p className="text-card-foreground/80">
                    Our training facilities feature modern equipment and collaborative spaces
                    designed for effective learning.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Train With Us */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">The CODEMANDE Difference</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                Why Train With Us?
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-card-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-card-foreground/70">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Got Questions?</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2">
                Frequently Asked Questions
              </h2>
            </motion.div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl shadow-card border border-border/30"
                >
                  <h4 className="font-heading font-semibold text-card-foreground mb-2">{faq.q}</h4>
                  <p className="text-sm text-card-foreground/70">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mb-4">
                Start Your Tech Career Today
              </h2>
              <p className="text-card-foreground/80 mb-6 max-w-xl mx-auto">
                Join our next cohort and take the first step toward a rewarding career in technology.
                Enrollment is now open!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <AuthAwareLink variant="gold" size="lg" to="/training">Apply Now</AuthAwareLink>
                <AuthAwareLink variant="outline" size="lg" to="/internships">Explore Internships</AuthAwareLink>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
        <EnrollCourseDialog 
          open={!!enrollCourse} 
          onOpenChange={(open) => !open && setEnrollCourse(null)} 
          course={enrollCourse} 
        />
        <ApplyCourseDialog
          open={!!applyCourse}
          onOpenChange={(open) => !open && setApplyCourse(null)}
          course={applyCourse}
        />
      <Footer />
    </div>
  );
};

export default Training;
