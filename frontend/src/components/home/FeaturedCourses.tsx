import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  SlidersHorizontal,
  Cpu,
  BarChart2,
  Shield,
  TrendingUp,
  Briefcase,
  BookOpen,
  Globe,
  Layers,
  Zap,
  Calendar,
  Clock,
  Users,
  X,
  Filter,
  ShoppingCart,
  CheckCircle,
  ArrowRight,
  XCircle,
  ChevronDown,
  Music,
  Palette,
  Trophy,
  Utensils,
  Ticket,
  Compass,
  Film,
  Mic,
  Presentation,
  Heart,
  Sparkles,
  Languages,
  Building2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import topImage from "@/assets/top.jpg";
import { 
  GET_COURSES_SUMMARY, 
  GET_INTERNSHIP_PROGRAMS, 
  MY_COURSE_APPLICATIONS, 
  GET_MY_INTERNSHIP_APPLICATIONS, 
  GET_ME, 
  GET_MY_INTERNSHIP 
} from "@/lib/graphql/queries";
import { ApplyInternshipDialog, ApplyCourseDialog } from "@/components/portal/dialogs";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@/hooks/use-toast";
import { InterestsOverlay } from "./InterestsOverlay";
import { MoreHorizontal } from "lucide-react";

// ─── Category normalization ────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  Technology: "Technology",
  Backend: "Technology",
  Frontend: "Technology",
  "Full Stack": "Technology",
  "Full-Stack": "Technology",
  Fullstack: "Technology",
  "Web Development": "Technology",
  "Web Dev": "Technology",
  "Software Development": "Technology",
  "Software Engineering": "Technology",
  "Mobile Development": "Technology",
  "Mobile Dev": "Technology",
  DevOps: "Technology",
  "Cloud Computing": "Technology",
  IoT: "Technology",
  "Internet of Things": "Technology",
  Programming: "Technology",
  Coding: "Technology",

  "Data Science": "Data & AI",
  "Data Analysis": "Data & AI",
  "Machine Learning": "Data & AI",
  "Artificial Intelligence": "Data & AI",
  AI: "Data & AI",
  "Deep Learning": "Data & AI",
  "Data Engineering": "Data & AI",
  Analytics: "Data & AI",
  "Business Intelligence": "Data & AI",

  "Business & Economics": "Business",
  Business: "Business",
  Entrepreneurship: "Business",
  Management: "Business",
  Finance: "Business",
  Economics: "Business",
  Marketing: "Business",
  "Digital Marketing": "Business",
  Accounting: "Business",

  Cybersecurity: "Cybersecurity",
  Security: "Cybersecurity",
  "Information Security": "Cybersecurity",
  "Network Security": "Cybersecurity",

  Design: "Design",
  "UI/UX": "Design",
  "UX Design": "Design",
  "UI Design": "Design",
  "Graphic Design": "Design",
  "Product Design": "Design",

  "Natural Science": "Science",
  Science: "Science",

  General: "General",
  Other: "General",
  Vocational: "Vocational",
  Hospitality: "Vocational",

  Music: "Music",
  "Arts & Culture": "Arts & Culture",
  Arts: "Arts & Culture",
  Culture: "Arts & Culture",
  "Sports & Wellness": "Sports & Wellness",
  Sports: "Sports & Wellness",
  Wellness: "Sports & Wellness",
  "Food & Drinks": "Food & Drinks",
  Food: "Food & Drinks",
  Drinks: "Food & Drinks",
  concert: "concert",
  Concert: "concert",
  Adventures: "Adventures",
  Adventure: "Adventures",
  Cinema: "Cinema",
  Movie: "Cinema",
  performance: "performance",
  Performance: "performance",
  Conferences: "Conferences",
  Conference: "Conferences",
  Fundraising: "Fundraising",
  Charity: "Fundraising",
  Family: "Family",
  Spirituality: "Spirituality",
  Faith: "Spirituality",
  Languages: "Languages",
  English: "Languages",
  French: "Languages",
  Kinyarwanda: "Languages",
  Swahili: "Languages",
  "Language Learning": "Languages",
};

function normalizeCategory(raw: string): string {
  if (!raw) return "General";
  if (CATEGORY_MAP[raw]) return CATEGORY_MAP[raw];
  const lower = raw.toLowerCase();
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (key.toLowerCase() === lower) return CATEGORY_MAP[key];
  }
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return CATEGORY_MAP[key];
    }
  }
  return raw;
}

// ─── Category visual config ────────────────────────────────────────────────
type CategoryMeta = { icon: React.ElementType; bg: string; text: string; border: string };

const CATEGORY_META: Record<string, CategoryMeta> = {
  Technology:    { icon: Cpu,          bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "Data & AI":   { icon: BarChart2,    bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  Business:      { icon: TrendingUp,   bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20"  },
  Cybersecurity: { icon: Shield,       bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20"    },
  Design:        { icon: Layers,       bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/20"   },
  Science:       { icon: Zap,          bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20"  },
  Vocational:    { icon: Briefcase,    bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  General:       { icon: BookOpen,     bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/20"  },
  Music:         { icon: Music,        bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  "Arts & Culture": { icon: Palette,      bg: "bg-pink-500/10",   text: "text-pink-400",   border: "border-pink-500/20"   },
  "Sports & Wellness": { icon: Trophy,    bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "Food & Drinks": { icon: Utensils,    bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  concert:       { icon: Ticket,       bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20"    },
  Adventures:    { icon: Compass,      bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20"  },
  Cinema:        { icon: Film,         bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20"   },
  performance:   { icon: Mic,          bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20" },
  Conferences:   { icon: Presentation, bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/20"   },
  Fundraising:   { icon: Heart,        bg: "bg-rose-500/10",   text: "text-rose-400",   border: "border-rose-500/20"   },
  Family:        { icon: Users,        bg: "bg-sky-500/10",    text: "text-sky-400",    border: "border-sky-500/20"    },
  Spirituality:  { icon: Sparkles,     bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20"  },
  Languages:     { icon: Languages,    bg: "bg-emerald-500/10",text: "text-emerald-400",border: "border-emerald-500/20" },
};

function getCategoryMeta(cat: string): CategoryMeta {
  return (
    CATEGORY_META[cat] ?? {
      icon: Globe,
      bg: "bg-accent/10",
      text: "text-accent",
      border: "border-accent/20",
    }
  );
}

type Section = "programs" | "internships";

export function FeaturedCourses() {
  const [section, setSection] = useState<Section>("programs");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string | null>(null);
  const [applyCourse, setApplyCourse] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<string>('latest');
  
  const { addToCart, cartItems } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollMutation, { loading: enrolling }] = useMutation(ENROLL_COURSE, {
    onCompleted: (data: any) => {
      const courseId = data.enroll.id;
      
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

  // Side Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPrice, setFilterPrice] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSchool, setFilterSchool] = useState<string>("all");

  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Courses — only featured courses with sort
  const { data: courseData, loading: courseLoading } = useQuery(GET_COURSES_SUMMARY, {
    variables: { page: 1, limit: 200, featured: true, sortBy },
    fetchPolicy: "cache-first",
  });

  // Internship programs
  const { data: internData, loading: internLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { page: 1, limit: 100 },
  });

  const { data: meData } = useQuery(GET_ME, {
    skip: !isAuthenticated,
  });

  const { data: myInternData } = useQuery(GET_MY_INTERNSHIP, {
    skip: !isAuthenticated,
  });

  // User course applications
  const { data: appData, refetch: refetchApps } = useQuery(MY_COURSE_APPLICATIONS, {
    skip: !isAuthenticated,
  });

  // User internship applications
  const { data: internAppData, refetch: refetchInternApps } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS, {
    skip: !isAuthenticated,
  });

  const myApplications = useMemo(() => (appData as any)?.myCourseApplications || [], [appData]);
  const me = (meData as any)?.me;
  const myInternship = (myInternData as any)?.myInternship;
  const completedLessons = useMemo(() => me?.completedLessons || [], [me]);
  const myInternApplications = useMemo(() => (internAppData as any)?.myInternshipApplications || [], [internAppData]);

  const rawCourses: any[] = useMemo(
    () => (courseData as any)?.courses?.items || [],
    [courseData]
  );
  const rawInternships: any[] = useMemo(
    () => (internData as any)?.internshipPrograms?.items || [],
    [internData]
  );

  const courses = useMemo(
    () =>
      rawCourses.map((c: any) => ({
        ...c,
        normalizedCategory: normalizeCategory(c.category || "General"),
      })),
    [rawCourses]
  );

  // Since Internships don't have a strict category in DB yet, infer from title
  const internships = useMemo(
    () =>
      rawInternships.map((i: any) => ({
        ...i,
        normalizedCategory: normalizeCategory(i.title || "General"),
      })),
    [rawInternships]
  );

  const courseCategories = useMemo(() => {
    const seen = new Set<string>(["Languages", "Technology"]);
    courses.forEach((c: any) => seen.add(c.normalizedCategory));
    const list = Array.from(seen).sort((a, b) => {
      if (a === "Languages") return -1;
      if (b === "Languages") return 1;
      if (a === "Technology") return -1;
      if (b === "Technology") return 1;
      return a.localeCompare(b);
    });
    return ["All", ...list];
  }, [courses]);

  const courseSchools = useMemo(() => {
    const seen = new Set<string>();
    courses.forEach((c: any) => {
      if (c.school) seen.add(c.school);
    });
    return ["all", ...Array.from(seen).sort()];
  }, [courses]);

  const internshipCategories = useMemo(() => {
    const seen = new Set<string>(["Languages", "Technology"]);
    internships.forEach((i: any) => seen.add(i.normalizedCategory));
    const list = Array.from(seen).sort((a, b) => {
      if (a === "Languages") return -1;
      if (b === "Languages") return 1;
      if (a === "Technology") return -1;
      if (b === "Technology") return 1;
      return a.localeCompare(b);
    });
    return ["All", ...list];
  }, [internships]);

  const currentCategories = section === "programs" ? courseCategories : internshipCategories;

  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => {
      const matchCat = activeCategory === "All" || c.normalizedCategory === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.normalizedCategory?.toLowerCase().includes(q) ||
        c.instructor?.username?.toLowerCase().includes(q);
      
      const matchPrice = filterPrice === "all" ? true : filterPrice === "free" ? c.price === 0 : c.price > 0;
      const matchLevel = filterLevel === "all" ? true : c.level?.toLowerCase() === filterLevel;
      const matchSchool = filterSchool === "all" ? true : c.school === filterSchool;
      const statusLower = c.status?.toLowerCase();
      const isOpen = !c.status || statusLower === "published" || statusLower === "active" || statusLower === "open";

      return matchCat && matchSearch && matchPrice && matchLevel && matchSchool && isOpen;
    });
  }, [courses, activeCategory, searchQuery, filterPrice, filterLevel, filterSchool]);

  const filteredInternships = useMemo(() => {
    return internships.filter((intern: any) => {
      const matchCat = activeCategory === "All" || intern.normalizedCategory === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        intern.title?.toLowerCase().includes(q) ||
        intern.category?.toLowerCase().includes(q) ||
        intern.normalizedCategory?.toLowerCase().includes(q);
        
      const matchPrice = filterPrice === "all" ? true : filterPrice === "free" ? intern.price === 0 : intern.price > 0;
      
      const statusLower = intern.status?.toLowerCase();
      const isOpen = !intern.status || statusLower === "open" || statusLower === "active" || statusLower === "published";

      return matchCat && matchSearch && matchPrice && isOpen;
    });
  }, [internships, activeCategory, searchQuery, filterPrice]);

  const scrollTabs = (dir: "left" | "right") => {
    tabScrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const switchSection = (s: Section) => {
    setSection(s);
    setActiveCategory("All");
    setSearchQuery("");
    setFilterPrice("all");
    setFilterLevel("all");
    setFilterSchool("all");
  };

  // Lock body scroll when filter is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFilterOpen]);

  const loading = section === "programs" ? courseLoading : internLoading;

  return (
    <>
      {/* ── Integrated Hero Banner + Search ── */}
      <section className="pt-20 pb-8 bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative rounded-3xl py-12 lg:py-16 px-4 shadow-2xl group border border-border/10 z-10">
            {/* Background Image with Parallax-like effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-3xl">
              <img 
                src={topImage} 
                alt="Hero Background" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Theme-aware overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-transparent dark:from-black/90 dark:via-black/70" />
              <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
            </div>

            {/* Subtle decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/5 opacity-20 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-white/5 opacity-20 pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  Explore
                </h1>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-6">
                  Programs for Your Future
                </h1>

                <div className="max-w-xl mx-auto w-full relative z-[60]">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsInterestsOpen(true)}
                        placeholder={
                          section === "programs"
                            ? "Search by program, topic, or location..."
                            : "Search internships..."
                        }
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(true)}
                      className="flex-shrink-0 p-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                      aria-label="Filter options"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Interests Overlay (Search Recommendations) */}
                  <InterestsOverlay
                    isOpen={isInterestsOpen}
                    onClose={() => setIsInterestsOpen(false)}
                    categories={currentCategories}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    getCategoryMeta={getCategoryMeta}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Side Filter Drawer ── */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            
            {/* Side Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">Filters</h3>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                {/* Section Toggle inside Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Program Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={section === "programs" ? "default" : "outline"}
                      onClick={() => switchSection("programs")}
                      className="w-full text-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-2" /> Courses
                    </Button>
                    <Button
                      variant={section === "internships" ? "default" : "outline"}
                      onClick={() => switchSection("internships")}
                      className="w-full text-xs"
                    >
                      <Briefcase className="w-3.5 h-3.5 mr-2" /> Internships
                    </Button>
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                    {currentCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          activeCategory === cat
                            ? "bg-accent text-accent-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Price</h4>
                  <div className="flex flex-col gap-2">
                    {["all", "free", "paid"].map((p) => (
                      <label 
                        key={p} 
                        className="flex items-center gap-3 cursor-pointer group p-1"
                      >
                        <input 
                          type="radio" 
                          name="price-filter"
                          value={p}
                          checked={filterPrice === p}
                          onChange={() => setFilterPrice(p)}
                          className="w-4 h-4 text-accent border-muted-foreground/30 focus:ring-accent/30 cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground capitalize">{p === "all" ? "Any Price" : p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Level Filter (Only for Courses) */}
                {section === "programs" && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">Level</h4>
                    <div className="flex flex-col gap-2">
                      {["all", "beginner", "intermediate", "advanced"].map((l) => (
                        <label 
                          key={l} 
                          className="flex items-center gap-3 cursor-pointer group p-1"
                        >
                          <input 
                            type="radio" 
                            name="level-filter"
                            value={l}
                            checked={filterLevel === l}
                            onChange={() => setFilterLevel(l)}
                            className="w-4 h-4 text-accent border-muted-foreground/30 focus:ring-accent/30 cursor-pointer"
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground capitalize">{l === "all" ? "All Levels" : l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* School Filter (Only for Courses) */}
                {section === "programs" && courseSchools.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">School / Provider</h4>
                    <div className="flex flex-col gap-2">
                      {courseSchools.map((s) => (
                        <label 
                          key={s} 
                          className="flex items-center gap-3 cursor-pointer group p-1"
                        >
                          <input 
                            type="radio" 
                            name="school-filter"
                            value={s}
                            checked={filterSchool === s}
                            onChange={() => setFilterSchool(s)}
                            className="w-4 h-4 text-accent border-muted-foreground/30 focus:ring-accent/30 cursor-pointer"
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-foreground capitalize">{s === "all" ? "All Schools" : s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/20 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setActiveCategory("All");
                    setFilterPrice("all");
                    setFilterLevel("all");
                    setFilterSchool("all");
                  }}
                >
                  Reset
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Show Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Featured Programs Listing ── */}
      <section className="pb-12 bg-background" id="featured-programs">
        <div className="container mx-auto px-4 lg:px-8">
          
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Featured Programs</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Top courses and internships handpicked for you.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {section === 'programs' && (
                <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      sortBy === 'latest'
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="w-3 h-3" />
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
                    <Users className="w-3 h-3" />
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
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </button>
                </div>
              )}
              <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
                <button
                  onClick={() => switchSection("programs")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    section === "programs"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Courses
                </button>
                <button
                  onClick={() => switchSection("internships")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    section === "internships"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Internships
                </button>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-8 overflow-hidden"
          >
            <div
              ref={tabScrollRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth flex-1 py-1"
            >
              {currentCategories.slice(0, 5).map((cat) => {
                const meta = getCategoryMeta(cat);
                const Icon = meta.icon;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-black shadow-lg scale-105"
                        : "bg-[#1a1a1a] text-white/70 border border-white/5 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {cat !== "All" && (
                      <Icon className={`w-4 h-4 ${isActive ? "text-black" : meta.text}`} />
                    )}
                    {cat}
                  </button>
                );
              })}
              
              <button
                onClick={() => setIsInterestsOpen(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#1a1a1a] text-white/70 border border-white/5 hover:border-white/20 hover:text-white transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
                More
              </button>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[420px] bg-card rounded-2xl border border-border/50 animate-pulse overflow-hidden">
                  <div className="h-48 bg-muted/50"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-muted/50 rounded-full"></div>
                      <div className="h-5 w-20 bg-muted/50 rounded-full"></div>
                    </div>
                    <div className="h-6 w-3/4 bg-muted/50 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted/50 rounded"></div>
                      <div className="h-4 w-2/3 bg-muted/50 rounded"></div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <div className="h-6 w-20 bg-muted/50 rounded"></div>
                      <div className="h-9 w-28 bg-muted/50 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COURSES listing */}
          {!loading && section === "programs" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + searchQuery + filterPrice + filterLevel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-20">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No programs found{searchQuery ? ` for "${searchQuery}"` : ""}
                      {activeCategory !== "All" ? ` in ${activeCategory}` : ""}.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredCourses.map((course: any, idx: number) => {
                      const meta = getCategoryMeta(course.normalizedCategory);
                      const Icon = meta.icon;
                      const isEnrolled = (me?.enrolledCourses || user?.enrolledCourses)?.some((c: any) => (c.id || c).toString() === (course.id || course._id).toString());
                      const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
                      const appStatus = application?.status;
                      const isInCart = cartItems?.some((item: any) => item.id === (course.id || course._id));

                      return (
                        <motion.div
                          key={course.id || course._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          onClick={() => navigate(`/courses/${course.id || course._id}`)}
                          className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/30 group hover:shadow-xl transition-all h-full flex flex-col cursor-pointer"
                        >
                          <div className="h-36 relative overflow-hidden">
                            <ImageWithSkeleton
                              src={course.thumbnail || `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=300&q=tech,${encodeURIComponent(course.category || 'coding')}`}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm text-[10px] px-2 py-0">{course.normalizedCategory}</Badge>
                            </div>
                            <div className={`absolute top-3 right-3 p-1.5 rounded-md ${meta.bg} border ${meta.border} backdrop-blur-sm opacity-90`}>
                              <Icon className={`w-3 h-3 ${meta.text}`} />
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] bg-accent/5 px-2 py-0.5 rounded-full text-accent font-medium uppercase tracking-wider">
                                {course.level || "All levels"}
                              </span>
                              {course.school && (
                                <span className="flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full text-indigo-400 text-[9px] font-bold uppercase tracking-widest line-clamp-1">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {course.school}
                               </span>
                              )}
                            </div>
                            <h3 className="font-heading text-sm font-bold text-card-foreground mb-1 line-clamp-2 group-hover:text-accent transition-colors">
                              {course.title}
                            </h3>

                            {course.descriptionSnippet && (
                              <p className="text-muted-foreground text-[11px] leading-relaxed mb-2 line-clamp-2">
                                {course.descriptionSnippet}
                              </p>
                            )}

                            {isEnrolled && (
                              <div className="mt-2 mb-2">
                                {(() => {
                                  const enrolledCourse = (me?.enrolledCourses || []).find(
                                    (ec: any) => (ec.id || ec._id)?.toString() === (course.id || course._id)?.toString()
                                  );
                                  const totalLessons = enrolledCourse?.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                                  const completedCount = completedLessons.filter((l: any) => l.courseId === (course.id || course._id)).length;
                                  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[9px] font-bold">
                                        <span className="text-muted-foreground uppercase">Progress</span>
                                        <span className="text-accent">{progress}%</span>
                                      </div>
                                      <Progress value={progress} className="h-1.5" />
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-muted-foreground uppercase font-medium">Investment</span>
                                  <div className="flex items-baseline gap-1">
                                    {course.discountPrice > 0 ? (
                                      <>
                                        <span className="text-xs font-bold text-accent">{course.discountPrice.toLocaleString()} RWF</span>
                                        <span className="text-[9px] text-muted-foreground line-through">{course.price?.toLocaleString()}</span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-bold text-accent">
                                        {course.price === 0 ? "Free" : `${course.price?.toLocaleString()} RWF`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col text-right">
                                  <span className="text-[9px] text-muted-foreground uppercase font-medium">Instructor</span>
                                  <span className="text-[10px] font-semibold line-clamp-1">{course.instructor?.username || 'Expert'}</span>
                                </div>
                              </div>
                              
                              {isEnrolled ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] border-green-500 text-green-500 hover:bg-green-50"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/courses/${course.id || course._id}`); }}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1.5" /> Learning
                                </Button>
                              ) : appStatus === 'approved' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] border-green-500 text-green-500 hover:bg-green-50"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/courses/${course.id || course._id}`); }}
                                >
                                  <ArrowRight className="w-3 h-3 mr-1.5" /> Continue
                                </Button>
                              ) : appStatus === 'pending' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled
                                  className="w-full rounded-xl font-bold h-8 text-[11px] border-amber-500 text-amber-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Clock className="w-3 h-3 mr-1.5" /> Pending
                                </Button>
                              ) : appStatus === 'rejected' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled
                                  className="w-full rounded-xl font-bold h-8 text-[11px] border-red-500 text-red-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <XCircle className="w-3 h-3 mr-1.5" /> Rejected
                                </Button>
                              ) : course.enrollmentMode === 'application' ? (
                                <Button 
                                  variant="gold" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isAuthenticated) {
                                      navigate("/auth", { state: { from: { pathname: "/" } } });
                                    } else {
                                      setApplyCourse(course);
                                    }
                                  }}
                                >
                                  Apply Now <ArrowRight className="w-3 h-3 ml-1.5" />
                                </Button>
                              ) : course.price === 0 ? (
                                <Button 
                                  variant="gold" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20"
                                  disabled={enrolling}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isAuthenticated) {
                                      navigate("/auth", { state: { from: { pathname: "/" } } });
                                    } else {
                                      enrollMutation({ variables: { courseId: course.id || course._id } });
                                    }
                                  }}
                                >
                                  <ArrowRight className="w-3 h-3 mr-1.5" /> Enroll Now
                                </Button>
                              ) : isInCart ? (
                                <Button 
                                  variant="gold" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/portal/student/billing");
                                  }}
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1.5" /> Proceed to Cart
                                </Button>
                              ) : (
                                <Button 
                                  variant="gold" 
                                  size="sm" 
                                  className="w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart({
                                      id: course.id || course._id,
                                      title: course.title,
                                      price: course.price,
                                      discountPrice: course.discountPrice,
                                      type: "course",
                                      image: course.thumbnail || course.image
                                    });
                                  }}
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1.5" /> Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* INTERNSHIPS listing */}
          {!loading && section === "internships" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={"internships" + searchQuery + activeCategory + filterPrice}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {filteredInternships.length === 0 ? (
                  <div className="text-center py-20">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? `No internships found for "${searchQuery}".`
                        : "No internship programs available right now. Check back soon!"}
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredInternships.map((intern: any, idx: number) => {
                      const meta = getCategoryMeta(intern.normalizedCategory);
                      const Icon = meta.icon;
                      // isOpen is already guaranteed to be true here due to the filter above,
                      // but we keep the variable for consistency.
                      const isOpen = true;
                      const deadline = intern.applicationDeadline
                        ? new Date(parseInt(intern.applicationDeadline)).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : null;
                      return (
                        <motion.div
                          key={intern.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                          onClick={() => {
                            if (isOpen) {
                              if (!isAuthenticated) {
                                navigate("/auth", { state: { from: { pathname: "/" } } });
                              } else {
                                setSelectedInternshipId(intern.id);
                              }
                            }
                          }}
                          className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/30 group hover:shadow-xl transition-all h-full flex flex-col cursor-pointer"
                        >
                          <div className="h-36 relative overflow-hidden">
                            <ImageWithSkeleton
                              src={intern.thumbnail || `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=300&q=internship,${encodeURIComponent(intern.title || 'work')}`}
                              alt={intern.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm text-[10px] px-2 py-0">{intern.normalizedCategory} Internship</Badge>
                            </div>
                            <div className={`absolute top-3 right-3 p-1.5 rounded-md ${meta.bg} border ${meta.border} backdrop-blur-sm opacity-90`}>
                              <Icon className={`w-3 h-3 ${meta.text}`} />
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-heading text-sm font-bold text-card-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                              {intern.title}
                            </h3>

                            {(() => {
                              const isEnrolledIntern = myInternship && myInternship.title === intern.title;
                              if (!isEnrolledIntern) return null;

                              const progress = myInternship.progress || 0;
                              
                              return (
                                <div className="mt-2 mb-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold">
                                      <span className="text-muted-foreground uppercase">Progress</span>
                                      <span className="text-accent">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5" />
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="mt-auto pt-3 border-t border-border/30 flex flex-col gap-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex flex-col">
                                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium">Duration</span>
                                  <span className="text-[10px] font-semibold text-foreground/80 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-muted-foreground/60" /> {intern.duration || "Flexible"}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium">Spots</span>
                                  <span className="text-[10px] font-semibold text-foreground/80 flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 text-muted-foreground/60" /> {intern.maxSpots ?? "Open"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-border/10 mb-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-muted-foreground uppercase font-medium">Fee</span>
                                  <span className="text-[10px] font-bold text-foreground">
                                    {intern.price === 0 || intern.price == null ? "Free" : `${intern.price.toLocaleString()} ${intern.currency || "RWF"}`}
                                  </span>
                                </div>
                                {deadline && (
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-muted-foreground uppercase font-medium">Deadline</span>
                                    <span className="text-[10px] font-medium text-foreground/80 flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5" /> {deadline}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {(() => {
                                const application = myInternApplications.find((app: any) => app.internshipProgram?.id === intern.id);
                                const appStatus = application?.status;

                                if (appStatus === 'approved') {
                                  return (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full rounded-xl font-bold h-8 text-[11px] border-green-500 text-green-500 hover:bg-green-50"
                                      onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/internship`); }}
                                    >
                                      <ArrowRight className="w-3 h-3 mr-1.5" /> Continue
                                    </Button>
                                  );
                                } else if (appStatus === 'pending') {
                                  return (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled
                                      className="w-full rounded-xl font-bold h-8 text-[11px] border-amber-500 text-amber-500"
                                    >
                                      <Clock className="w-3 h-3 mr-1.5" /> Pending
                                    </Button>
                                  );
                                } else if (appStatus === 'rejected') {
                                  return (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      disabled
                                      className="w-full rounded-xl font-bold h-8 text-[11px] border-red-500 text-red-500"
                                    >
                                      <XCircle className="w-3 h-3 mr-1.5" /> Rejected
                                    </Button>
                                  );
                                }

                                return (
                                  <Button 
                                    variant="gold" 
                                    size="sm" 
                                    className={`w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20 ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!isOpen}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isOpen) {
                                        if (!isAuthenticated) {
                                          navigate("/auth", { state: { from: { pathname: "/" } } });
                                        } else {
                                          setSelectedInternshipId(intern.id);
                                        }
                                      }
                                    }}
                                  >
                                    {isOpen ? "Apply Now" : "Closed"} <ArrowRight className="w-3 h-3 ml-1.5" />
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
      <ApplyCourseDialog
        open={!!applyCourse}
        onOpenChange={(open) => !open && setApplyCourse(null)}
        course={applyCourse}
        onSuccess={refetchApps}
      />
      <ApplyInternshipDialog
        open={!!selectedInternshipId}
        onOpenChange={(open) => !open && setSelectedInternshipId(null)}
        internshipProgramId={selectedInternshipId || ""}
        onSuccess={refetchInternApps}
      />
    </>
  );
}
