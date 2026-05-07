import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Code, Database, Wifi, Clock, Users, Award, CheckCircle, BookOpen, Target, Briefcase, Calendar, ArrowRight, Brain, Shield, Building2, Stethoscope, GraduationCap, Landmark, ShoppingBag, Factory, BarChart, ChevronRight, User, Tag, ChevronLeft, Share2, Facebook, Twitter, Linkedin, Copy, Check, Eye, XCircle, Filter, Search, LayoutGrid } from "lucide-react";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import aboutImage from "@/assets/about-training.webp";
import aboutImageMobile from "@/assets/about-training-mobile.webp";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSES, MY_COURSE_APPLICATIONS, GET_ME } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { EnrollCourseDialog, ApplyCourseDialog } from "@/components/portal/dialogs";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { useToast } from "@/hooks/use-toast";

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
  id?: string;
  studentsEnrolled?: any[];
  modules?: any[];
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

const Explore = () => {
  const { data, loading: apolloLoading } = useQuery(GET_COURSES);
  const courses = (data as any)?.courses || [];

  const [aiCourses, setAICourses] = useState<AICourse[]>([]);
  const [aiLoading, setAILoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [applyCourse, setApplyCourse] = useState<any>(null);
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: meData } = useQuery(GET_ME, { skip: !isAuthenticated });
  const me = (meData as any)?.me;
  const completedLessons = me?.completedLessons || [];

  const { data: appsData } = useQuery(MY_COURSE_APPLICATIONS, { skip: !isAuthenticated });
  const myApplications = (appsData as any)?.myCourseApplications || [];

  const [enrollMutation, { loading: enrolling }] = useMutation(ENROLL_COURSE, {
    onCompleted: (data: any) => {
      const courseId = data.enrollCourse.id;
      
      // Update global user state
      if (user) {
        const currentEnrolled = user.enrolledCourses || [];
        if (!currentEnrolled.includes(courseId)) {
          updateUser({
            enrolledCourses: [...currentEnrolled, courseId]
          });
        }
      }

      toast({
        title: "Course Unlocked! 🚀",
        description: "Redirecting you to your course...",
      });

      // Redirect immediately
      setTimeout(() => {
        navigate(`/portal/student/courses/${courseId}`);
      }, 1500);
    },
    refetchQueries: [{ query: GET_ME }, { query: GET_COURSES }, { query: MY_COURSE_APPLICATIONS }],
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const handleEnrollClick = (course: any) => {
    if (!user) {
      toast({
        title: "Information",
        description: "Please login to enroll in courses",
      });
      navigate(`/auth?redirect=/explore`);
      return;
    }
    if (course.enrollmentMode === 'application') {
      setApplyCourse(course);
    } else if (course.price === 0) {
      enrollMutation({ variables: { courseId: course.id || course._id } });
    } else {
      setEnrollCourse(course);
    }
  };

  const [activeSchool, setActiveSchool] = useState<string>("ALL");
  const [schoolPage, setSchoolPage] = useState<number>(0);

  const schools = Array.from(new Set(courses?.items?.map((c: any) => c.school).filter(Boolean))) as string[];
  const ITEMS_PER_PAGE = 10;
  const totalSchoolPages = Math.ceil(schools.length / ITEMS_PER_PAGE);
  const paginatedSchools = schools.slice(schoolPage * ITEMS_PER_PAGE, (schoolPage + 1) * ITEMS_PER_PAGE);

  const filteredCourses = (courses?.items || []).filter((course: any) => {
    if (activeSchool === "ALL") return true;
    return course.school === activeSchool;
  });

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
                Explore Programs & Schools
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Discover Industry-Ready Programs from Top Schools
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg mb-8">
                Explore comprehensive programs designed by top schools and industry experts.
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

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Side Panel Filter */}
              <div className="w-full lg:w-64 shrink-0 lg:bg-card lg:p-6 lg:rounded-2xl lg:border lg:border-border/30 lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h3 className="font-heading font-bold text-foreground text-sm lg:text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent" />
                    Schools & Providers
                  </h3>
                  <div className="lg:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-1.5">
                          <Filter className="w-3 h-3" />
                          Filter
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[70vh] rounded-t-[2.5rem] border-t-accent/20 px-6">
                        <SheetHeader className="mb-6 pt-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
                          <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="text-accent" />
                            Select Provider
                          </SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-12 custom-scrollbar">
                          <button
                            onClick={() => { setActiveSchool("ALL"); }}
                            className={`text-left px-4 py-4 rounded-2xl text-xs font-bold transition-all border shadow-sm ${
                              activeSchool === "ALL" 
                                ? "bg-accent text-white border-accent ring-4 ring-accent/10" 
                                : "bg-card border-border/50 text-muted-foreground hover:border-accent/40"
                            }`}
                          >
                            All Providers
                          </button>
                          {schools.map(school => (
                            <button
                              key={school}
                              onClick={() => { setActiveSchool(school); }}
                              className={`text-left px-4 py-4 rounded-2xl text-xs font-bold transition-all border shadow-sm flex flex-col gap-3 ${
                                activeSchool === school 
                                  ? "bg-accent text-white border-accent ring-4 ring-accent/10" 
                                  : "bg-card border-border/50 text-muted-foreground hover:border-accent/40"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeSchool === school ? "bg-white/20" : "bg-accent/10"}`}>
                                <Building2 className={`w-4 h-4 ${activeSchool === school ? "text-white" : "text-accent"}`} />
                              </div>
                              <span className="line-clamp-2 leading-tight">{school}</span>
                            </button>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {!apolloLoading && schools.length > 0 ? (
                  <>
                    <div className="flex flex-row overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                      <button
                        onClick={() => setActiveSchool("ALL")}
                        className={`shrink-0 flex items-center gap-2 text-center lg:text-left px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-xl text-[10px] lg:text-sm font-black lg:font-medium uppercase lg:capitalize tracking-widest lg:tracking-normal transition-all border lg:border-none ${
                          activeSchool === "ALL"
                            ? "bg-accent text-white shadow-lg shadow-accent/20 border-accent"
                            : "bg-muted/10 lg:bg-transparent text-muted-foreground border-border/50 lg:border-none hover:bg-accent/5 hover:text-foreground"
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0 lg:hidden" />
                        All Providers
                      </button>
                      {paginatedSchools.map(school => (
                        <button
                          key={school}
                          onClick={() => setActiveSchool(school)}
                          className={`shrink-0 flex items-center gap-2 text-center lg:text-left px-4 lg:px-3 py-2 lg:py-2.5 rounded-full lg:rounded-xl text-[10px] lg:text-sm font-black lg:font-medium uppercase lg:capitalize tracking-widest lg:tracking-normal transition-all border lg:border-none ${
                            activeSchool === school
                              ? "bg-accent text-white shadow-lg shadow-accent/20 border-accent"
                              : "bg-muted/10 lg:bg-transparent text-muted-foreground border-border/50 lg:border-none hover:bg-accent/5 hover:text-foreground"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0 hidden lg:block" />
                          <span className="line-clamp-1">{school}</span>
                        </button>
                      ))}
                    </div>
                  {totalSchoolPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSchoolPage(p => Math.max(0, p - 1))}
                        disabled={schoolPage === 0}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground font-medium">
                        {schoolPage + 1} / {totalSchoolPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSchoolPage(p => Math.min(totalSchoolPages - 1, p + 1))}
                        disabled={schoolPage >= totalSchoolPages - 1}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading providers...</div>
                )}
              </div>

              {/* Main Grid */}
              <div className="flex-1 w-full">
                {apolloLoading && (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                  </div>
                )}
                
                {!apolloLoading && filteredCourses.length === 0 && (
                  <div className="text-center py-20">
                    <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses available for this provider yet.</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course: any, index: number) => (
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
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="flex items-center gap-1 bg-accent/5 px-2.5 py-1 rounded-full text-accent text-[10px] font-bold uppercase tracking-widest">{course.level}</span>
                      {course.school && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Building2 className="w-3 h-3 text-accent/70" />
                          {course.school}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3 line-clamp-2">
                      {course.title}
                    </h3>
                    <div
                      className="text-muted-foreground text-sm mb-6 line-clamp-3 prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: course.description }}
                    />

                    {(() => {
                      const isEnrolled = (me?.enrolledCourses || user?.enrolledCourses)?.some((c: any) => (c.id || c).toString() === (course.id || course._id).toString()) || course.studentsEnrolled?.some((s: any) => s.id === user?.id);
                      if (!isEnrolled) return null;

                      const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                      const completedCount = completedLessons.filter((l: any) => l.courseId === (course.id || course._id)).length;
                      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                      return (
                        <div className="mb-4 space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-muted-foreground uppercase">Progress</span>
                            <span className="text-accent">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      );
                    })()}

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

                      {(() => {
                        const isEnrolled = (me?.enrolledCourses || user?.enrolledCourses)?.some((c: any) => (c.id || c).toString() === (course.id || course._id).toString()) || course.studentsEnrolled?.some((s: any) => s.id === user?.id);
                        const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
                        const appStatus = application?.status;

                        if (isEnrolled) {
                          return (
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl text-sm font-bold shadow-lg"
                              onClick={() => navigate(`/portal/student/courses/${course.id || course._id}`)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Learning
                            </Button>
                          );
                        }

                        if (appStatus === 'approved') {
                          return (
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl text-sm font-bold shadow-lg"
                              onClick={() => navigate(`/portal/student/courses/${course.id || course._id}`)}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" /> Continue
                            </Button>
                          );
                        }

                        if (appStatus === 'pending') {
                          return (
                            <Button 
                              disabled
                              className="w-full bg-amber-500 h-10 rounded-xl text-sm font-bold"
                            >
                              <Clock className="w-4 h-4 mr-2" /> Applied (Pending)
                            </Button>
                          );
                        }

                        if (appStatus === 'rejected') {
                          return (
                            <Button 
                              disabled
                              className="w-full bg-red-500 h-10 rounded-xl text-sm font-bold"
                            >
                              <XCircle className="w-4 h-4 mr-2" /> Rejected
                            </Button>
                          );
                        }

                        return (
                          <Button 
                            variant="gold" 
                            size="sm" 
                            className="w-full rounded-xl font-bold h-10 shadow-lg shadow-gold/20"
                            onClick={() => handleEnrollClick(course)}
                            disabled={enrolling}
                          >
                            {enrolling ? "Enrolling..." : "Enroll Now"} <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
              </div>
            </div>
            </div>
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

export default Explore;
