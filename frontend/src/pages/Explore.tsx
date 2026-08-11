import { useTranslation } from "react-i18next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd, itemListLd } from "@/lib/jsonld";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Code, Database, Wifi, Clock, Users, Award, CheckCircle, BookOpen, Target, Briefcase, Calendar, ArrowRight, Brain, Building2, TrendingUp, ChevronRight, User, Tag, ChevronLeft, Share2, Facebook, Twitter, Linkedin, Copy, Check, Eye, XCircle, Filter, Search, LayoutGrid, Star, MapPin, Navigation, Sparkles, GraduationCap, Globe, Mail, ExternalLink, Loader2 } from "lucide-react";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import aboutImage from "@/assets/about-training.webp";
import aboutImageMobile from "@/assets/about-training-mobile.webp";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSES_SUMMARY, MY_COURSE_APPLICATIONS, GET_ME, GET_TRAINERS_PUBLIC, GET_INTERNSHIP_PROGRAMS } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { EnrollCourseDialog, ApplyCourseDialog } from "@/components/portal/dialogs";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

const Explore = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [applyCourse, setApplyCourse] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<'courses' | 'trainers'>(searchParams.get("tab") === "trainers" ? "trainers" : "courses");
  const [trainerFilter, setTrainerFilter] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>("");
  const COURSES_PAGE_SIZE = 9;

  // Debounce the search term so queries fire only after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data, loading: apolloLoading, fetchMore } = useQuery(GET_COURSES_SUMMARY, {
    variables: {
      page: 1,
      limit: COURSES_PAGE_SIZE,
      sortBy,
      // While searching, drop the Featured / Near-Me toggles so universal results are never silently filtered by invisible state
      featured: debouncedSearch.trim() ? undefined : (showFeaturedOnly || undefined),
      location: debouncedSearch.trim() ? undefined : (locationFilter || undefined),
      search: debouncedSearch || undefined,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-first",
  });
  const coursesResponse = (data as any)?.courses || { items: [], pagination: { hasNextPage: false, currentPage: 1, totalPages: 1, totalCount: 0 } };
  const loadedCourses = coursesResponse.items || [];

  const [trainerPage, setTrainerPage] = useState(1);
  const [trainerLoadingMore, setTrainerLoadingMore] = useState(false);
  const TRAINERS_PAGE_SIZE = 8;

  const { data: trainersData, loading: trainersLoading, fetchMore: fetchMoreTrainers } = useQuery(GET_TRAINERS_PUBLIC, {
    variables: { page: 1, limit: TRAINERS_PAGE_SIZE, search: debouncedSearch || undefined },
    notifyOnNetworkStatusChange: true,
  });

  // Programs & internships matching the search — shown across all tabs
  const { data: internshipSearchData, loading: programsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { search: debouncedSearch.trim() || undefined, limit: 3 },
    skip: !debouncedSearch.trim(),
  });
  const matchedPrograms = (internshipSearchData as any)?.internshipPrograms?.items || [];

  const trainersResponse = (trainersData as any)?.trainers || { items: [], pagination: { hasNextPage: false, currentPage: 1, totalPages: 1, totalCount: 0 } };
  const allTrainers = trainersResponse.items || [];

  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const { data: meData } = useQuery(GET_ME, { skip: !isAuthenticated });
  const me = (meData as any)?.me;

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
    refetchQueries: [{ query: GET_ME }, { query: GET_COURSES_SUMMARY }, { query: MY_COURSE_APPLICATIONS }],
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

  const schools = useMemo(() => Array.from(new Set(loadedCourses.map((c: any) => c.school).filter(Boolean))) as string[], [loadedCourses]);
  const ITEMS_PER_PAGE = 10;
  const totalSchoolPages = Math.ceil(schools.length / ITEMS_PER_PAGE);
  const paginatedSchools = schools.slice(schoolPage * ITEMS_PER_PAGE, (schoolPage + 1) * ITEMS_PER_PAGE);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  // Keep the active tab in sync with the ?tab= URL param (deep links, back/forward)
  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "trainers" ? "trainers" : "courses");
  }, [searchParams]);

  const handleTabChange = (tab: 'courses' | 'trainers') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'trainers') {
      params.set('tab', 'trainers');
    } else {
      params.delete('tab');
    }
    setSearchParams(params, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    // Reset per-trainer chip / Featured / Near-Me filters so a search never leaves a stale filter active
    setTrainerFilter('all');
    if (value.trim()) {
      setShowFeaturedOnly(false);
      setLocationFilter("");
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  // Only ever show published, ready-to-enroll courses on the public Explore page
  // (draft/closed/archived courses are hidden even for admin/trainer sessions).
  const filteredCourses = useMemo(() => {
    return loadedCourses.filter((course: any) => {
      if (!course.thumbnail || course.thumbnail.trim() === '') return false;
      const status = (course.status || 'published').toLowerCase();
      if (['draft', 'closed', 'archived'].includes(status)) return false;
      const matchesSchool = activeSchool === "ALL" || course.school === activeSchool;
      const matchesTrainer = trainerFilter === 'all' || course.instructor?.id === trainerFilter || course.instructor?.username === trainerFilter;
      return matchesSchool && matchesTrainer;
    });
  }, [loadedCourses, activeSchool, trainerFilter]);



  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("explore.heroTitle")}
        description={t("explore.heroDesc")}
        canonicalUrl="https://bootskills.com/explore"
        keywords="courses Rwanda, training programs Kigali, tech courses, online learning Africa, professional development, bootcamp"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd(t("explore.heroTitle"), t("explore.heroDesc"), "https://bootskills.com/explore"),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Explore", item: "/explore" },
              ]),
              ...(activeTab === "trainers" && allTrainers.length > 0
                ? [itemListLd(
                    allTrainers.map((tr: any) => ({
                      name: tr.fullName || tr.username,
                      url: `https://bootskills.com/trainer/${tr.id}`,
                      image: tr.avatar || undefined,
                    })),
                    {
                      name: "Bootskills Trainers & Teachers",
                      description: "Meet the verified trainers, teachers and mentors on Bootskills.",
                    }
                  )]
                : []),
            ]
          })}
        </script>
      </SEOHead>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-8 lg:py-10 bg-card relative overflow-hidden">
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
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-3">
                {t("explore.title")}
              </span>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mb-3">
                {t("explore.heroTitle")}
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-base mb-5">
                {t("explore.heroDesc")}
              </p>

              {/* Tab Switcher */}
              <div className="flex items-center justify-center gap-2 bg-background/50 p-1.5 rounded-2xl w-fit mx-auto mb-5 border border-border/30">
                <button
                  onClick={() => handleTabChange('courses')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'courses'
                      ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Courses
                </button>
                <button
                  onClick={() => { handleTabChange('trainers'); setTrainerFilter('all'); }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'trainers'
                      ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Trainers
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-sm text-card-foreground/70">
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4 text-accent" /> {t("home.flexibleSchedules")}
                </span>
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Users className="w-4 h-4 text-accent" /> {t("home.expertTrainers")}
                </span>
                <span className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
                  <Award className="w-4 h-4 text-accent" /> {t("home.certifiedPrograms")}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== UNIVERSAL SEARCH RESULTS — all types in one view, no tab switching ===== */}
        {debouncedSearch.trim() && (
          <section className="py-10 lg:py-14 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
                      <Search className="w-7 h-7 text-accent" />
                      Results for “{debouncedSearch.trim()}”
                    </h2>
                    <div className="relative mt-3 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        placeholder="Search courses, teachers, skills, programs..."
                        className="pl-10 rounded-xl bg-background border-border/40"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => handleSearchChange("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Clear search"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/explore?q=${encodeURIComponent(debouncedSearch.trim())}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> {loadedCourses.length} Courses
                    </Link>
                    <Link
                      to={`/explore?q=${encodeURIComponent(debouncedSearch.trim())}&tab=trainers`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> {allTrainers.length} Trainers
                    </Link>
                    <Link
                      to={`/opportunities?q=${encodeURIComponent(debouncedSearch.trim())}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" /> {matchedPrograms.length} Opportunities
                    </Link>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Everything matching your search — courses, teachers &amp; trainers, and opportunities — all in one place.
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Courses */}
                <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      Courses
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">{loadedCourses.length}</span>
                    </h3>
                    <Link
                      to={`/explore?q=${encodeURIComponent(debouncedSearch.trim())}`}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {apolloLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-14 h-14 rounded-xl bg-muted/60" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/5 bg-muted/60 rounded" />
                            <div className="h-3 w-2/3 bg-muted/40 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : loadedCourses.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {loadedCourses.slice(0, 4).map((c: any) => (
                        <Link
                          key={c.id}
                          to={`/courses/${c.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors group"
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                            {c.thumbnail ? (
                              <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {c.category}
                              {c.instructor?.username ? ` · ${c.instructor.username}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                            {c.price > 0 ? formatPrice(c.price) : "Free"}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No courses match “{debouncedSearch.trim()}”.</p>
                    </div>
                  )}
                </div>

                {/* Trainers & Teachers */}
                <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      Trainers &amp; Teachers
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">{allTrainers.length}</span>
                    </h3>
                    <Link
                      to={`/explore?q=${encodeURIComponent(debouncedSearch.trim())}&tab=trainers`}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {trainersLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-14 h-14 rounded-full bg-muted/60" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/5 bg-muted/60 rounded" />
                            <div className="h-3 w-2/3 bg-muted/40 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : allTrainers.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {allTrainers.slice(0, 4).map((tr: any) => (
                        <Link
                          key={tr.id}
                          to={`/trainer/${tr.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors group"
                        >
                          <Avatar className="w-12 h-12 rounded-full shrink-0 ring-2 ring-border/30">
                            <AvatarImage src={tr.avatar} className="w-full h-full object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-sm font-bold">
                              {(tr.fullName || tr.username || "T").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                              {tr.fullName || tr.username}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {tr.title || (tr.trainerApplication?.specialties || []).slice(0, 2).join(", ") || tr.bio || ""}
                            </p>
                          </div>
                          {tr.location && (
                            <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                              {tr.location.split(",")[0]}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No trainers match “{debouncedSearch.trim()}”.</p>
                    </div>
                  )}
                </div>

                {/* Opportunities */}
                <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-accent" />
                      Opportunities
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">{matchedPrograms.length}</span>
                    </h3>
                    <Link
                      to={`/opportunities?q=${encodeURIComponent(debouncedSearch.trim())}`}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {programsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-14 h-14 rounded-xl bg-muted/60" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/5 bg-muted/60 rounded" />
                            <div className="h-3 w-2/3 bg-muted/40 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : matchedPrograms.length > 0 ? (
                    <div className="divide-y divide-border/20">
                      {matchedPrograms.map((p: any) => (
                        <Link
                          key={p.id}
                          to={`/opportunity/${p.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors group"
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt=""
                              className="w-14 h-14 rounded-xl object-cover shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                              <Briefcase className="w-5 h-5 text-accent" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                              {p.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {p.description}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{p.duration}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No programs match “{debouncedSearch.trim()}”.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nothing at all found */}
              {!apolloLoading && !trainersLoading && !programsLoading && loadedCourses.length === 0 && allTrainers.length === 0 && matchedPrograms.length === 0 && (
                <div className="text-center py-14 mt-4">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-6 shadow-xl">
                    <Search className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No results found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    Nothing matches “{debouncedSearch.trim()}”. Try a different keyword — course names, teacher skills, subjects or programs.
                  </p>
                  <Button
                    onClick={() => handleSearchChange("")}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl border-accent/20"
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== TRAINERS SECTION ===== */}
        {activeTab === 'trainers' && !debouncedSearch.trim() && (
          <section className="py-10 lg:py-14 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-3">
                  Meet Our Expert Trainers
                </h2>
                <p className="text-muted-foreground max-w-2xl">
                  Learn from industry professionals with real-world experience. Browse our trainers and discover their courses and programs.
                </p>
              </motion.div>

              {/* Trainer search — searches names, subjects, specialties, bio and more */}
              <div className="mb-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Search teachers, skills, courses, programs..."
                    className="pl-10 rounded-xl bg-card border-border/40"
                  />
                </div>
              </div>

              {trainersLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="rounded-2xl border border-border/30 overflow-hidden bg-card animate-pulse">
                      <div className="h-24 bg-gradient-to-br from-accent/10 to-primary/5" />
                      <div className="px-6 pb-6 -mt-12 relative">
                        <div className="w-20 h-20 rounded-2xl bg-muted ring-4 ring-background mx-auto mb-4" />
                        <div className="space-y-3 mt-4">
                          <div className="h-5 w-3/4 bg-muted rounded-lg mx-auto" />
                          <div className="h-3 w-full bg-muted/50 rounded mx-auto" />
                          <div className="flex gap-2 justify-center">
                            <div className="h-5 w-16 bg-muted/40 rounded-full" />
                            <div className="h-5 w-16 bg-muted/40 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : allTrainers.length === 0 && !searchTerm.trim() ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-6 shadow-xl">
                    <Users className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Trainers Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    Trainers haven't joined the platform yet. Check back soon!
                  </p>
                </motion.div>
              ) : allTrainers.length === 0 && searchTerm.trim() ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-6 shadow-xl">
                    <Search className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No Trainers Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                    No trainers match your search. Try a different name, subject or specialty.
                  </p>
                  <Button
                    onClick={() => handleSearchChange("")}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl border-accent/20"
                  >
                    Clear Search
                  </Button>
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allTrainers.map((trainer: any, index: number) => {
                    const initials = trainer.fullName
                      ? trainer.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                      : trainer.username?.slice(0, 2).toUpperCase() || "T";
                    const specialties = trainer.trainerApplication?.specialties || [];

                    return (
                      <motion.div
                        key={trainer.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.4 }}
                        whileHover={{ y: -6 }}
                      >
                        <Link to={`/trainer/${trainer.id}`}>
                          <div className="group relative bg-card rounded-2xl border border-border/30 overflow-hidden hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 h-full">
                            {/* Hover glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

                            <div className="relative z-10 bg-card rounded-2xl overflow-hidden h-full">
                              {/* Gradient top with pattern */}
                              <div className="h-28 bg-gradient-to-br from-accent/25 via-accent/10 to-primary/15 relative overflow-hidden">
                                {/* Cover image always fills the rounded border — falls back to the avatar photo */}
                                {(trainer.coverImage || trainer.avatar) ? (
                                  <img
                                    src={trainer.coverImage || trainer.avatar}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="absolute inset-0 opacity-[0.08]"
                                    style={{
                                      backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                                      backgroundSize: '24px 24px',
                                    }}
                                  />
                                )}
                                {/* Verified badge floating */}
                                {trainer.isTrainerApproved && (
                                  <div className="absolute top-3 right-3">
                                    <Badge className="bg-green-500/80 backdrop-blur-sm text-white border-0 text-[10px] px-2 py-0.5 shadow-lg flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Verified
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <div className="px-5 pb-5 -mt-14 relative">
                                {/* Avatar with glow */}
                                <div className="relative w-fit mx-auto mb-4">
                                  <div className="absolute -inset-1.5 bg-gradient-to-br from-accent/30 via-accent/10 to-transparent rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-background shadow-2xl">
                                    <Avatar className="w-full h-full rounded-2xl">
                                      <AvatarImage src={trainer.avatar} className="w-full h-full object-cover" />
                                      <AvatarFallback className="w-full h-full text-xl font-bold bg-gradient-to-br from-accent to-accent/80 text-white">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>

                                {/* Name & Title */}
                                <div className="text-center">
                                  <h3 className="font-bold text-foreground group-hover:text-accent transition-colors duration-200">
                                    {trainer.fullName || trainer.username}
                                  </h3>
                                  {trainer.title && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {trainer.title}
                                    </p>
                                  )}
                                </div>

                                {/* Experience & Students stats */}
                                <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
                                  {trainer.trainerApplication?.experienceYears && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-accent" />
                                      {trainer.trainerApplication.experienceYears}y exp
                                    </span>
                                  )}
                                  {trainer.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-accent" />
                                      {trainer.location.split(',')[0]}
                                    </span>
                                  )}
                                </div>

                                {/* Bio */}
                                {trainer.bio && (
                                  <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2 leading-relaxed text-center">
                                    {trainer.bio}
                                  </p>
                                )}

                                {/* Specialties */}
                                {specialties.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                                    {specialties.slice(0, 3).map((s: string, i: number) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-bold uppercase tracking-wider hover:bg-accent/20 transition-colors"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                    {specialties.length > 3 && (
                                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[9px] font-bold">
                                        +{specialties.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* View Profile CTA */}
                                <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-center">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:gap-2.5 transition-all duration-200">
                                    View Profile <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Load More Trainers */}
              {trainersResponse.pagination?.hasNextPage && (
                <div className="flex justify-center mt-10">
                  <Button
                    onClick={async () => {
                      if (trainerLoadingMore || !trainersResponse.pagination?.hasNextPage) return;
                      const nextPage = trainerPage + 1;
                      setTrainerLoadingMore(true);
                      try {
                        await fetchMoreTrainers({
                          variables: { page: nextPage, limit: TRAINERS_PAGE_SIZE },
                          updateQuery: (previousResult: any, { fetchMoreResult }: any) => {
                            if (!fetchMoreResult?.trainers?.items?.length) {
                              return previousResult;
                            }
                            return {
                              trainers: {
                                ...fetchMoreResult.trainers,
                                items: [
                                  ...previousResult.trainers.items,
                                  ...fetchMoreResult.trainers.items,
                                ],
                              },
                            };
                          },
                        });
                        setTrainerPage(nextPage);
                      } catch (error) {
                        console.error("Error loading more trainers:", error);
                      } finally {
                        setTrainerLoadingMore(false);
                      }
                    }}
                    disabled={trainerLoadingMore}
                    variant="outline"
                    className="h-11 px-8 rounded-xl border-accent/20 hover:border-accent/50 hover:bg-accent/5 gap-2"
                  >
                    {trainerLoadingMore ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Loading more trainers...</>
                    ) : (
                      <><Users className="w-4 h-4" /> Load More Trainers ({trainersResponse.pagination?.totalCount - allTrainers.length} remaining)</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== COURSES SECTION ===== */}
        {activeTab === 'courses' && !debouncedSearch.trim() && (
        <section className="py-12 lg:py-16 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">{t("explore.ourPrograms")}</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                {t("explore.choosePath")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("explore.choosePathDesc")}
              </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-[minmax(280px,_320px)_minmax(0,1fr)] items-start">
              {/* Side Panel Filter */}
              <div className="w-full lg:bg-card lg:p-6 lg:rounded-2xl lg:border lg:border-border/30 lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <div>                      <h3 className="font-heading font-bold text-foreground text-sm lg:text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent" />
                      {t("explore.schoolsProviders")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{t("explore.sidePanelDesc")}</p>
                  </div>
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

                <div className="mb-6">
                  <div className="relative text-muted-foreground">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => handleSearchChange(event.target.value)}
                      placeholder="Search courses, teachers, skills, programs..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {!apolloLoading && schools.length > 0 ? (
                  <>
                    <div className="flex flex-row overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none w-full">
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

              <div className="flex flex-col gap-6">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
                    <button
                      onClick={() => setSortBy('latest')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === 'latest'
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Latest
                    </button>
                    <button
                      onClick={() => setSortBy('popular')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === 'popular'
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Popular
                    </button>
                    <button
                      onClick={() => setSortBy('trending')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sortBy === 'trending'
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Trending
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowFeaturedOnly(prev => !prev);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      showFeaturedOnly
                        ? "bg-amber-500 text-white border-amber-400 shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:border-amber-300"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${showFeaturedOnly ? 'fill-white' : ''}`} />
                    Featured
                  </button>
                  {/* Near Me — filter by user's location */}
                  <button
                    onClick={() => {
                      if (locationFilter) {
                        setLocationFilter("");
                      } else {
                        const userLocation = me?.location || user?.location || "";
                        if (userLocation) {
                          setLocationFilter(userLocation);
                        } else {
                          toast({
                            title: "Location not set",
                            description: "Set your location in your profile to use this filter.",
                          });
                        }
                      }
                      setCurrentPage(1);
                    }}
                    disabled={!isAuthenticated}
                    title={!isAuthenticated ? "Log in to filter by location" : "Show courses near your location"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      locationFilter
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                        : "bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${locationFilter ? 'fill-white' : ''}`} />
                    {locationFilter ? "Near Me" : "Near Me"}
                  </button>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                </span>
              </div>              {/* Trainer Filter Chips */}
              {allTrainers.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-foreground">Filter by Trainer</span>
                    {trainerFilter !== 'all' && (
                      <button
                        onClick={() => { setTrainerFilter('all'); setCurrentPage(1); }}
                        className="text-[10px] text-accent hover:underline ml-1"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                    <button
                      onClick={() => { setTrainerFilter('all'); setCurrentPage(1); }}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        trainerFilter === 'all'
                          ? 'bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20'
                          : 'bg-card text-muted-foreground border-border/40 hover:border-accent/30 hover:text-foreground hover:bg-accent/5'
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      All
                    </button>
                    {allTrainers.map((t: any) => (
                      <div key={t.id} className="shrink-0 flex items-center gap-0">
                        <button
                          onClick={() => { setTrainerFilter(t.id); setCurrentPage(1); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-full text-xs font-medium transition-all border-r-0 ${
                            trainerFilter === t.id
                              ? 'bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20 ring-1 ring-accent/20'
                              : 'bg-card text-muted-foreground border-border/30 hover:border-accent/30 hover:text-foreground hover:bg-accent/5 hover:shadow-sm'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-muted shrink-0 ring-1 ring-border/30">
                            {t.avatar ? (
                              <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold bg-gradient-to-br from-accent/30 to-accent/10 text-accent">
                                {(t.fullName || t.username || 'T').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="whitespace-nowrap">{t.fullName || t.username}</span>
                        </button>
                        <Link
                          to={`/trainer/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-center px-2 py-1.5 rounded-r-full text-xs font-medium transition-all border ${
                            trainerFilter === t.id
                              ? 'bg-accent/90 text-accent-foreground border-accent hover:bg-accent'
                              : 'bg-card text-muted-foreground border-border/30 hover:border-accent/30 hover:text-accent hover:bg-accent/5'
                          }`}
                          title={`View ${t.fullName || t.username}'s profile`}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Grid */}
              <div className="flex-1 w-full">
                {apolloLoading && (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="rounded-2xl border border-border/30 overflow-hidden bg-card" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="aspect-video bg-muted/60 animate-pulse" />
                        <div className="p-6 space-y-3">
                          <div className="h-5 w-3/4 bg-muted/60 rounded-lg animate-pulse" />
                          <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-muted/40 rounded animate-pulse" />
                          <div className="h-3 w-4/6 bg-muted/40 rounded animate-pulse" />
                          <div className="pt-4 border-t border-border/30 flex justify-between">
                            <div className="h-5 w-20 bg-muted/50 rounded animate-pulse" />
                            <div className="h-9 w-24 bg-muted/50 rounded-xl animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
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
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="group relative bg-card rounded-2xl overflow-hidden shadow-sm border border-border/30 hover:shadow-2xl hover:shadow-accent/5 hover:border-accent/40 transition-all duration-500 h-full flex flex-col cursor-pointer"
                >
                  {/* Hover glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

                  <div className="relative z-10 bg-card rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:bg-card/80 group-hover:backdrop-blur-sm">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={course.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600"}
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600"; }}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm backdrop-blur-sm">{course.category}</Badge>
                        {course.isFeatured && (
                          <Badge className="bg-amber-500 text-white border-0 shadow-lg flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      {/* Trainer badge - clickable to profile */}
                      {course.instructor?.id && (
                        <Link
                          to={`/trainer/${course.instructor.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        >
                          <Badge
                            variant="secondary"
                            className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all hover:scale-105 cursor-pointer"
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden bg-white/20 shrink-0">
                              {course.instructor.avatar ? (
                                <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[6px] font-bold text-white">
                                  {(course.instructor.username || 'T').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="max-w-[80px] truncate">{course.instructor.username || 'Trainer'}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </Badge>
                        </Link>
                      )}
                    </div>

                    {/* Hover overlay info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <div className="flex items-center gap-3 text-white/90 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration || "Self-paced"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {course.studentsEnrolledCount || course.studentsEnrolled?.length || 0} enrolled
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-full text-accent text-[10px] font-bold uppercase tracking-widest group-hover:bg-accent/20 transition-colors">{course.level}</span>
                      {course.school && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Building2 className="w-3 h-3 text-accent/70" />
                          {course.school}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors duration-300">
                      {course.title}
                    </h3>

                    {course.descriptionSnippet && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: course.descriptionSnippet }} />
                    )}

                    {/* Instructor row with avatar */}
                    {course.instructor?.id ? (
                      <Link
                        to={`/trainer/${course.instructor.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 mb-3 group/instructor"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-accent/10 shrink-0 ring-1 ring-border/30 group-hover/instructor:ring-accent/50 transition-all">
                          {course.instructor?.avatar ? (
                            <img src={course.instructor.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-accent bg-accent/10">
                              {(course.instructor?.username || 'E').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground group-hover/instructor:text-accent group-hover:underline transition-colors">
                          {course.instructor?.username || 'Expert Instructor'}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-accent/10 shrink-0 ring-1 ring-border/30">
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-accent bg-accent/10">
                            E
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {course.instructor?.username || 'Expert Instructor'}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-border/20 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase font-medium tracking-wider">Investment</span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            {course.discountPrice > 0 ? (
                              <>
                                <span className="text-lg font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                                  {formatPrice(course.discountPrice)}
                                </span>
                                <span className="text-xs text-muted-foreground/50 line-through">
                                  {formatPrice(course.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-foreground">
                                {course.price > 0 ? formatPrice(course.price) : 'Free'}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link to={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs font-bold border-accent/20 hover:border-accent/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                            Details
                          </Button>
                        </Link>
                      </div>

                      {(() => {
                        const isEnrolled = (me?.enrolledCourses || user?.enrolledCourses)?.some(
                          (c: any) => (c.id || c).toString() === (course.id || course._id).toString()
                        );
                        const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
                        const appStatus = application?.status;

                        if (isEnrolled) {
                          return (
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl text-sm font-bold shadow-lg"
                              onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/courses/${course.id || course._id}`); }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Learning
                            </Button>
                          );
                        }

                        if (appStatus === 'approved') {
                          return (
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl text-sm font-bold shadow-lg"
                              onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/courses/${course.id || course._id}`); }}
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
                              onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => { e.stopPropagation(); handleEnrollClick(course); }}
                            disabled={enrolling}
                          >
                            {enrolling ? "Enrolling..." : course.enrollmentMode === "application" ? "Apply Now" : "Enroll Now"} <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
              </div>

              {!apolloLoading && coursesResponse.pagination?.hasNextPage && (
                <div className="flex justify-center mt-10">
                  <Button
                    onClick={async () => {
                      if (loadingMore || !coursesResponse.pagination?.hasNextPage) return;
                      const nextPage = currentPage + 1;
                      setLoadingMore(true);
                      try {
                        await fetchMore({
                          variables: { page: nextPage, limit: COURSES_PAGE_SIZE },
                          updateQuery: (previousResult: any, { fetchMoreResult }: any) => {
                            if (!fetchMoreResult?.courses?.items?.length) {
                              return previousResult;
                            }
                            return {
                              courses: {
                                ...fetchMoreResult.courses,
                                items: [
                                  ...previousResult.courses.items,
                                  ...fetchMoreResult.courses.items,
                                ],
                              },
                            };
                          },
                        });
                        setCurrentPage(nextPage);
                      } catch (error) {
                        console.error("Error loading more courses:", error);
                      } finally {
                        setLoadingMore(false);
                      }
                    }}
                    disabled={loadingMore}
                    className="h-11 px-8"
                  >
                    {loadingMore ? "Loading more courses..." : "Load more courses"}
                  </Button>
                </div>
              )}
            </div>
          </div>
            </div>
          </div>
        </section>
        )}

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
