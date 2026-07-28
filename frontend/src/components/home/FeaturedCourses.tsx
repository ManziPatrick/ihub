import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
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
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import topImage from "@/assets/top.webp";
import { 
  GET_COURSES_SUMMARY, 
  GET_INTERNSHIP_PROGRAMS, 
  MY_COURSE_APPLICATIONS, 
  GET_MY_INTERNSHIP_APPLICATIONS, 
  GET_ME, 
  GET_MY_INTERNSHIP, 
  GET_CATEGORIES, 
  GET_SCHOOLS 
} from "@/lib/graphql/queries";
import { ApplyCourseDialog } from "@/components/portal/dialogs";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { useMutation } from "@apollo/client/react";
import { useToast } from "@/hooks/use-toast";
import { InterestsOverlay } from "./InterestsOverlay";
import { MoreHorizontal } from "lucide-react";
import { PaginationBar } from "@/components/ui/pagination-bar";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageSize, setPageSize] = useState(() => {
    const val = searchParams.get("perPage");
    return val ? parseInt(val, 10) : 12;
  });

  const [section, setSection] = useState<Section>("programs");
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return searchParams.get("category") || "All";
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => {
    return searchParams.get("q") || "";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const val = searchParams.get("page");
    return val ? parseInt(val, 10) : 1;
  });

  // Debounce search input: update debouncedSearchQuery 300ms after user stops typing
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);
  // ── Search cache: avoid re-fetching previously searched queries ──
  interface SearchCacheEntry {
    courses: any[];
    internships: any[];
  }
  const searchCacheRef = useRef<Map<string, SearchCacheEntry>>(new Map());
  const MAX_CACHE_ENTRIES = 80;
  const CACHE_STORAGE_KEY = 'ihub_search_cache';

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [isInterestsOpen, setIsInterestsOpen] = useState(false);
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
    // Avoid refetching large summaries on every enroll; rely on cache updates or explicit small updates.
    refetchQueries: [{ query: GET_ME }, { query: MY_COURSE_APPLICATIONS }],
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

  // Fetch all categories and schools separately for filter dropdowns (not affected by pagination)
  const { data: catData } = useQuery(GET_CATEGORIES, {
    fetchPolicy: "cache-first",
  });
  const { data: schData } = useQuery(GET_SCHOOLS, {
    fetchPolicy: "cache-first",
  });


  const allCategories: string[] = useMemo(() => {
    const cats: string[] = (catData as any)?.categories || [];
    // Use raw category names from DB so server-side filtering matches correctly
    const seen = new Set<string>();
    cats.forEach((c: string) => { if (c) seen.add(c); });
    const list = Array.from(seen).sort((a, b) => a.localeCompare(b));
    return ["All", ...list];
  }, [catData]);

  const allSchools: string[] = useMemo(() => {
    const schools: string[] = (schData as any)?.schools || [];
    return ["all", ...schools.slice().sort()];
  }, [schData]);

  // Courses — all courses with server-side pagination, search, and filters
  const queryVariables = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    sortBy,
    search: debouncedSearchQuery.trim() || undefined,
    category: activeCategory === "All" ? undefined : activeCategory,
    price: filterPrice === "all" ? undefined : filterPrice,
    level: filterLevel === "all" ? undefined : filterLevel,
    school: filterSchool === "all" ? undefined : filterSchool,
  }), [currentPage, pageSize, sortBy, debouncedSearchQuery, activeCategory, filterPrice, filterLevel, filterSchool]);

  const { data: courseData, loading: courseLoading, previousData: prevCourseData } = usePaginatedQuery(GET_COURSES_SUMMARY, {
    variables: queryVariables,
  });

  // Internship programs — with server-side pagination, search, and filters
  const [internshipPage, setInternshipPage] = useState(() => {
    const val = searchParams.get("internPage");
    return val ? parseInt(val, 10) : 1;
  });
  const internshipQueryVariables = useMemo(() => ({
    page: internshipPage,
    limit: pageSize,
    search: debouncedSearchQuery.trim() || undefined,
    category: activeCategory === "All" ? undefined : activeCategory,
    price: filterPrice === "all" ? undefined : filterPrice,
    level: filterLevel === "all" ? undefined : filterLevel,
    school: filterSchool === "all" ? undefined : filterSchool,
  }), [internshipPage, pageSize, debouncedSearchQuery, activeCategory, filterPrice, filterLevel, filterSchool]);

  const { data: internData, loading: internLoading, previousData: prevInternData } = usePaginatedQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: internshipQueryVariables,
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
  const { data: internAppData } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS, {
    skip: !isAuthenticated,
  });

  const myApplications = useMemo(() => (appData as any)?.myCourseApplications || [], [appData]);
  const me = (meData as any)?.me;
  const myInternship = (myInternData as any)?.myInternship;
  const completedLessons = useMemo(() => me?.completedLessons || [], [me]);
  const myInternApplications = useMemo(() => (internAppData as any)?.myInternshipApplications || [], [internAppData]);

  const rawCourses: any[] = useMemo(
    () => (courseData as any)?.courses?.items || (prevCourseData as any)?.courses?.items || [],
    [courseData, prevCourseData]
  );
  const rawInternships: any[] = useMemo(
    () => (internData as any)?.internshipPrograms?.items || (prevInternData as any)?.internshipPrograms?.items || [],
    [internData, prevInternData]
  );

  const internshipPagination = useMemo(() => {
    const resp = (internData as any)?.internshipPrograms?.pagination || (prevInternData as any)?.internshipPrograms?.pagination;

    return resp || { totalCount: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPreviousPage: false };
  }, [internData, prevInternData]);

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

  // ── Restore search cache from localStorage on mount ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const restored = new Map<string, SearchCacheEntry>(parsed);
          searchCacheRef.current = restored;
        }
      }
    } catch {
      // Corrupted cache — silently ignore
      localStorage.removeItem(CACHE_STORAGE_KEY);
    }
  }, []);

  // ── Persist search cache to localStorage whenever it changes ──
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        const entries = Array.from(searchCacheRef.current.entries());
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
      } catch {
        // localStorage full or unavailable — ignore
      }
    }, 2000); // debounced 2s so we don't write on every keystroke
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      // Flush latest cache on unmount so refresh doesn't lose pending entries
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(Array.from(searchCacheRef.current.entries())));
      } catch { /* ignore */ }
    };
  }, [debouncedSearchQuery, section, rawCourses, rawInternships]);

  // ── Populate search cache whenever fresh data arrives ──
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) return;
    const key = `${section}:${debouncedSearchQuery.trim().toLowerCase()}`;
    const cache = searchCacheRef.current;
    if (!cache.has(key) && (rawCourses.length > 0 || rawInternships.length > 0)) {
      // Evict oldest entries if over limit
      if (cache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }
      cache.set(key, {
        courses: rawCourses,
        internships: rawInternships,
      });
    }
  }, [debouncedSearchQuery, section, rawCourses, rawInternships]);

  // ── Derive autocomplete suggestions from cache + current loaded data ──
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const seen = new Set<string>();
    const results: { label: string; type: 'course' | 'internship'; id: string; category?: string; fromCache: boolean }[] = [];

    // Helper to add items from an array
    const addItems = (items: any[], type: 'course' | 'internship', fromCache: boolean) => {
      for (const item of items) {
        const title = item.title;
        if (!title || seen.has(title)) continue;
        const lower = title.toLowerCase();
        if (lower.includes(q)) {
          seen.add(title);
          results.push({
            label: title,
            type,
            id: item.id || item._id,
            category: item.normalizedCategory || item.category,
            fromCache,
          });
        }
      }
    };

    // 1. Current loaded items (fresh, not from cache)
    addItems(courses, 'course', false);
    addItems(internships, 'internship', false);

    // 2. Cached items from previous searches (only if not already added fresh)
    const cache = searchCacheRef.current;
    for (const entry of cache.values()) {
      addItems(entry.courses, 'course', true);
      addItems(entry.internships, 'internship', true);
    }

    return results.slice(0, 10); // max 10 suggestions
  }, [searchQuery, courses, internships]);

  // ── Close suggestions on click outside ──
  useEffect(() => {
    if (!showSuggestions) return;
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSuggestions]);

  const handleSuggestionSelect = useCallback((item: { type: string; id: string }) => {
    setShowSuggestions(false);
    setSelectedSuggestionIdx(-1);
    if (item.type === 'course') {
      navigate(`/courses/${item.id}`);
    } else if (item.type === 'internship') {
      navigate(`/internship/${item.id}`);
    }
  }, [navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedSuggestionIdx >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedSuggestionIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIdx(-1);
    }
  }, [showSuggestions, suggestions, selectedSuggestionIdx, handleSuggestionSelect]);

  const currentCategories = allCategories;

  // Sync search/page/perPage to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (currentPage > 1) params.set("page", String(currentPage));
    if (internshipPage > 1) params.set("internPage", String(internshipPage));
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (pageSize !== 12) params.set("perPage", String(pageSize));

    // Only update if search params actually changed to prevent infinite rendering loops
    params.sort();
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.sort();
    if (params.toString() !== currentParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, currentPage, internshipPage, activeCategory, pageSize, searchParams, setSearchParams]);

  const filteredCourses = useMemo(() => {
    // All filtering (search, category, price, level, school) is now server-side.
    // Just filter out non-published status as an extra safety net.
    return courses.filter((c: any) => {
      const statusLower = c.status?.toLowerCase();
      const isOpen = !c.status || statusLower === "published" || statusLower === "active" || statusLower === "open";
      return isOpen;
    });
  }, [courses]);

  // Get pagination info from server
  const pagination = useMemo(() => {
    const resp = (courseData as any)?.courses?.pagination || (prevCourseData as any)?.courses?.pagination;
    return resp || { totalCount: 0, totalPages: 1, currentPage: 1, hasNextPage: false, hasPreviousPage: false };
  }, [courseData, prevCourseData]);

  const filteredInternships = useMemo(() => {
    // All filtering (search, category, price) is now server-side.
    // Just filter out non-open status as an extra safety net.
    return internships.filter((intern: any) => {
      const statusLower = intern.status?.toLowerCase();
      const isOpen = !intern.status || statusLower === "open" || statusLower === "active" || statusLower === "published";
      return isOpen;
    });
  }, [internships]);

  const scrollTabs = (dir: "left" | "right") => {
    tabScrollRef.current?.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const switchSection = (s: Section) => {
    setSection(s);
    setActiveCategory("All");
    setSearchQuery("");
    setCurrentPage(1);
    setInternshipPage(1);
    setFilterPrice("all");
    setFilterLevel("all");
    setFilterSchool("all");
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset courses page on new search
    setInternshipPage(1); // Reset internships page on new search
  };

  // Whether any filter is active (show a reset button)
  const hasActiveFilters = useMemo(() =>
    searchQuery.trim() !== "" ||
    activeCategory !== "All" ||
    filterPrice !== "all" ||
    filterLevel !== "all" ||
    filterSchool !== "all",
  [searchQuery, activeCategory, filterPrice, filterLevel, filterSchool]);

  const filterCount = useMemo(() =>
    [searchQuery.trim() !== "", activeCategory !== "All", filterPrice !== "all", filterLevel !== "all", filterSchool !== "all"].filter(Boolean).length,
  [searchQuery, activeCategory, filterPrice, filterLevel, filterSchool]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("All");
    setFilterPrice("all");
    setFilterLevel("all");
    setFilterSchool("all");
    setCurrentPage(1);
    setInternshipPage(1);
    setShowSuggestions(false);
    setIsInterestsOpen(false);
    setIsFilterOpen(false);
  }, []);

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
                        onChange={(e) => {
                          handleSearchChange(e.target.value);
                          if (e.target.value.trim()) {
                            setShowSuggestions(true);
                            setIsInterestsOpen(false);
                          } else {
                            setShowSuggestions(false);
                            setIsInterestsOpen(true);
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.trim()) {
                            setShowSuggestions(true);
                          } else {
                            setIsInterestsOpen(true);
                          }
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={
                          section === "programs"
                            ? "Search by program, topic, or location..."
                            : "Search internships..."
                        }
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                      />
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="flex-shrink-0 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all group relative"
                        aria-label="Reset all filters"
                        title="Reset all filters"
                      >
                        <X className="w-4 h-4" />
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          Reset filters
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsFilterOpen(true);
                        setIsInterestsOpen(false);
                        setShowSuggestions(false);
                      }}
                      className={`flex-shrink-0 p-2.5 rounded-xl border transition-all ${
                        hasActiveFilters
                          ? 'bg-accent/20 border-accent/30 text-accent hover:bg-accent/30'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      }`}
                      aria-label="Filter options"
                    >
                      <div className="relative">
                        <SlidersHorizontal className="w-4 h-4" />
                        {filterCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                            {filterCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* ── Autocomplete Suggestions ── */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionRef}
                      className="absolute left-0 right-0 top-full mt-1 bg-card border border-border/40 rounded-xl shadow-2xl overflow-hidden z-[70]"
                    >
                      <div className="max-h-72 overflow-y-auto py-1">
                        {suggestions.map((item, idx) => (
                          <button
                            key={`${item.type}-${item.id}`}
                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(item); }}
                            onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                              idx === selectedSuggestionIdx
                                ? 'bg-accent/10 text-foreground'
                                : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold uppercase ${
                              item.type === 'course'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {item.type === 'course' ? 'C' : 'I'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs truncate flex items-center gap-2">
                                {item.label}
                              </div>
                              {item.category && (
                                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{item.category}</div>
                              )}
                            </div>
                            {item.type === 'course' ? (
                              <BookOpen className="w-3 h-3 flex-shrink-0 opacity-40" />
                            ) : (
                              <Briefcase className="w-3 h-3 flex-shrink-0 opacity-40" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-1.5 border-t border-border/20 bg-muted/20 text-[10px] text-muted-foreground/50 flex items-center justify-between">
                        <span>Type to search · ↑↓ navigate · Enter to open</span>
                        <span className="text-accent/60 font-medium">{suggestions.length} result{suggestions.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}

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

                {/* Level Filter */}
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

                {/* School Filter */}
                {allSchools.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3">School / Provider</h4>
                    <div className="flex flex-col gap-2">
                      {allSchools.map((s) => (
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
              <h2 className="text-2xl font-semibold text-foreground">
                {searchQuery.trim() ? `Results for "${searchQuery.trim()}"` : "All Programs"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery.trim()
                  ? `${pagination.totalCount} course${pagination.totalCount !== 1 ? 's' : ''} found`
                  : `Browse all available courses and programs — page ${currentPage} of ${pagination.totalPages}`}
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
                    onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
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
                onClick={() => { setIsInterestsOpen(true); setCurrentPage(1); }}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#1a1a1a] text-white/70 border border-white/5 hover:border-white/20 hover:text-white transition-all"
              >
                <MoreHorizontal className="w-4 h-4" />
                More
              </button>
            </div>
          </motion.div>

          {/* Loading — animated skeleton grid, only when there's truly no data to display */}
          {loading && rawCourses.length === 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: pageSize > 12 ? 12 : pageSize }, (_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-border/30 overflow-hidden">
                  {/* Thumbnail skeleton — matches h-36 on real card */}
                  <div className="h-36 bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40 bg-[length:400%_100%] animate-shimmer" />
                  <div className="p-4 space-y-3">
                    {/* Badge + level pills */}
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-16 rounded-full bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                      <div className="h-4 w-20 rounded-full bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                    </div>
                    {/* Title skeleton */}
                    <div className="h-5 w-full rounded bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                    <div className="h-5 w-3/4 rounded bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                    {/* Description skeletons */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-full rounded bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 bg-[length:400%_100%] animate-shimmer" />
                      <div className="h-3 w-5/6 rounded bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 bg-[length:400%_100%] animate-shimmer" />
                    </div>
                    {/* Footer area */}
                    <div className="pt-3 border-t border-border/30 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="h-2.5 w-14 rounded bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 bg-[length:400%_100%] animate-shimmer" />
                        <div className="h-4 w-20 rounded bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                      </div>
                      <div className="h-8 w-24 rounded-xl bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 bg-[length:400%_100%] animate-shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COURSES listing — visible during loading if any data exists (current, previous, or cached) */}
          {(!loading || rawCourses.length > 0) && section === "programs" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + debouncedSearchQuery + filterPrice + filterLevel}
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
                              <p className="text-muted-foreground text-[11px] leading-relaxed mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: course.descriptionSnippet }} />
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

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={setCurrentPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                  hasNextPage={pagination.hasNextPage}
                  pageSize={pageSize}
                  onPageSizeChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                  pageSizeOptions={[12, 24, 48, 96, 120]}
                  isLoading={courseLoading}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* INTERNSHIPS listing — visible during loading if any data exists */}
          {(!loading || rawInternships.length > 0) && section === "internships" && (
            <AnimatePresence mode="wait">
              <motion.div
                key={"internships" + activeCategory + filterPrice + debouncedSearchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {filteredInternships.length === 0 ? (
                  <div className="text-center py-20">
                    <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {debouncedSearchQuery
                        ? `No internships found for "${debouncedSearchQuery}".`
                        : "No programs available right now. Check back soon!"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredInternships.map((intern: any, idx: number) => {
                        const meta = getCategoryMeta(intern.normalizedCategory);
                        const Icon = meta.icon;
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
                              navigate(`/internship/${intern.id}`);
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
                                <Badge className="bg-white/90 text-black hover:bg-white border-0 shadow-sm text-[10px] px-2 py-0">{intern.normalizedCategory} Program</Badge>
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
                                      <Button variant="outline" size="sm" className="w-full rounded-xl font-bold h-8 text-[11px] border-green-500 text-green-500 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); navigate(`/portal/student/internship`); }}>
                                        <ArrowRight className="w-3 h-3 mr-1.5" /> Continue
                                      </Button>
                                    );
                                  } else if (appStatus === 'pending') {
                                    return (
                                      <Button variant="outline" size="sm" disabled className="w-full rounded-xl font-bold h-8 text-[11px] border-amber-500 text-amber-500">
                                        <Clock className="w-3 h-3 mr-1.5" /> Pending
                                      </Button>
                                    );
                                  } else if (appStatus === 'rejected') {
                                    return (
                                      <Button variant="outline" size="sm" disabled className="w-full rounded-xl font-bold h-8 text-[11px] border-red-500 text-red-500">
                                        <XCircle className="w-3 h-3 mr-1.5" /> Rejected
                                      </Button>
                                    );
                                  }
                                  return (
                                    <Button variant="gold" size="sm" className={`w-full rounded-xl font-bold h-8 text-[11px] shadow-md shadow-gold/20 ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!isOpen} onClick={(e) => { e.stopPropagation(); if (isOpen) { navigate(`/internship/${intern.id}`); } }}>
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

                    <PaginationBar
                      currentPage={internshipPage}
                      totalPages={internshipPagination.totalPages}
                      totalCount={internshipPagination.totalCount}
                      onPageChange={setInternshipPage}
                      hasPreviousPage={internshipPagination.hasPreviousPage}
                      hasNextPage={internshipPagination.hasNextPage}
                      isLoading={internLoading}
                      showRange={false}
                    />
                  </>
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

    </>
  );
}
