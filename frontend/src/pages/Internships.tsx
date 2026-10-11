import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import {
  Briefcase,
  Code,
  Database,
  Wifi,
  Building2,
  ChevronDown,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
  MapPin,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAMS, GET_MY_INTERNSHIP_APPLICATIONS } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { usePageFetching } from "@/lib/hooks/usePageFetching";

const DEFAULT_ORG = "Bootskills Academy";

const Opportunities = () => {
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("q") || "");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try {
      return localStorage.getItem('ihub-opp-view') === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('ihub-opp-view', mode);
    } catch {
      // storage unavailable — fine, view resets to grid on reload
    }
  };

  // Organization helpers used by both views
  const orgNameFor = (p: any) => p?.organization?.trim() || DEFAULT_ORG;
  const orgInitials = (name: string) =>
    name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  // Debounce the search term so the query fires only after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: internsData, loading: internsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { search: debouncedSearch.trim() || undefined },
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  const { data: appsData } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS, {
    skip: !isAuthenticated
  });

  const internshipPrograms = useMemo(
    () => (internsData as any)?.internshipPrograms?.items || [],
    [internsData]
  );
  const myApplications = (appsData as any)?.myInternshipApplications || [];

  // Fade the existing cards while a search/debounce refetch is in flight
  const { fetchingPage } = usePageFetching(internsLoading, internsData);

  // Group opportunities by organization (company or school)
  const organizations = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const program of internshipPrograms) {
      const org = program.organization?.trim() || DEFAULT_ORG;
      if (!map.has(org)) map.set(org, []);
      map.get(org)!.push(program);
    }
    // Sort by number of opportunities (desc), then alphabetically
    return Array.from(map.entries())
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => (a.title || "").localeCompare(b.title || "")),
      }))
      .sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  }, [internshipPrograms]);

  const getApplicationStatus = (programId: string) => {
    if (!isAuthenticated) return null;
    const app = myApplications.find((a: any) => a.internshipProgram?.id === programId || a.internshipProgramId === programId);
    return app?.status || null;
  };

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
      <SEOHead
        title="Opportunities"
        description="Explore career opportunities at top companies and schools — opportunities, trainee programs and practical work experience in Rwanda and beyond. Apply directly to the organization that fits you."
        canonicalUrl="https://bootskills.com/opportunities"
        keywords="opportunities Rwanda, internships Kigali, company internships, school programs, software internship Africa, data science internship, IoT internship, career development"
        ogImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200&h=630"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd("Opportunities", "Explore career opportunities at top companies and schools — opportunities and practical work experience.", "https://bootskills.com/opportunities"),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Opportunities", item: "/opportunities" },
              ]),
            ]
          })}
        </script>
      </SEOHead>
      <Header />
      <main className="pt-20">
        {/* Compact hero (~25vh) */}
        <section className="h-[25vh] min-h-[180px] max-h-[260px] bg-card relative overflow-hidden">
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
          <div className="container mx-auto px-4 lg:px-8 relative z-10 h-full flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground">
                Open seats
              </h1>
              <p className="text-card-foreground/70 text-sm mt-1">
                Internships and programs. Apply in one tap.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Opportunities list */}
        <section className="py-8 lg:py-10 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Toolbar — search + count + view toggle */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search opportunities, organizations, fields..."
                  aria-label="Search opportunities"
                  className="pl-10 rounded-xl bg-background border-border/40"
                />
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {internshipPrograms.length} open {internshipPrograms.length === 1 ? "opportunity" : "opportunities"}
                </span>
                <div className="inline-flex items-center gap-1 p-1 bg-background border border-border/40 rounded-xl shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('grid')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      viewMode === 'grid' ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <LayoutGrid className="w-4 h-4" /> Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('list')}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      viewMode === 'list' ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-pressed={viewMode === 'list'}
                  >
                    <List className="w-4 h-4" /> List
                  </button>
                </div>
              </div>
            </div>

            {internshipPrograms.length === 0 && internsLoading ? (
              <ListSkeleton count={6} />
            ) : internshipPrograms.length === 0 && !internsLoading ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {debouncedSearch.trim()
                    ? `No opportunities match "${debouncedSearch.trim()}". Try a different keyword or organization.`
                    : "No opportunities available at the moment."}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto transition-opacity duration-300", fetchingPage && "opacity-40")}>
                {internshipPrograms.map((intern: any) => {
                  const orgName = orgNameFor(intern);
                  const logo = intern.organizationLogo || null;
                  const status = getApplicationStatus(intern.id || intern._id);
                  const isFree = intern.price === 0 || intern.price == null;
                  return (
                    <motion.div
                      key={intern.id || intern._id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group bg-background rounded-2xl border border-border/30 shadow-card overflow-hidden hover:shadow-card-hover hover:border-accent/30 hover:-translate-y-1 transition-all flex flex-col"
                    >
                      {/* Banner — program image or organization gradient (clipped by the card's own overflow-hidden) */}
                      <Link
                        to={`/opportunity/${intern.id || intern._id}`}
                        className="relative block aspect-[16/9]"
                      >
                        {intern.image ? (
                          <img
                            src={intern.image}
                            alt={intern.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-accent via-accent/80 to-accent/40 flex items-center justify-center">
                            <span className="font-heading text-4xl font-black text-white/90">{orgInitials(orgName)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                        <span className={cn(
                          "absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full shadow",
                          isFree ? "bg-green-500 text-white" : "bg-gold text-black"
                        )}>
                          {isFree ? "FREE" : formatPrice(intern.price)}
                        </span>
                      </Link>
                      {/* Organization logo badge — overlaps the banner bottom edge */}
                      <div className="relative -mt-5 ml-4 w-12 h-12 rounded-xl bg-card p-1 shadow-lg ring-1 ring-border/40 overflow-hidden z-10">
                        {logo ? (
                          <img src={logo} alt={orgName} className="w-full h-full object-contain rounded-[9px]" />
                        ) : (
                          <div className="w-full h-full rounded-[9px] bg-accent/10 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-accent" />
                          </div>
                        )}
                      </div>
                      {/* Card body */}
                      <div className="flex-1 flex flex-col p-4 pt-2 gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent min-w-0">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{orgName}</span>
                        </div>
                        <Link
                          to={`/opportunity/${intern.id || intern._id}`}
                          className="font-heading font-semibold text-foreground leading-snug line-clamp-2 hover:text-accent transition-colors"
                        >
                          {intern.title}
                        </Link>
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                          {intern.duration && (
                            <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">{intern.duration}</span>
                          )}
                          <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50 capitalize">{intern.type || "Remote"}</span>
                          {intern.maxSpots > 0 && (
                            <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">{intern.maxSpots} spots</span>
                          )}
                        </div>
                        <div className="pt-3">
                          {status === "approved" ? (
                            <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold text-sm h-9" onClick={() => navigate('/portal/student/internship')}>
                              Continue <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                            </Button>
                          ) : status === "pending" ? (
                            <Button disabled className="w-full bg-amber-500 rounded-xl font-bold text-sm h-9">
                              Pending <ClockIcon className="w-4 h-4 ml-1.5" />
                            </Button>
                          ) : status === "rejected" ? (
                            <Button disabled className="w-full bg-red-500 rounded-xl font-bold text-sm h-9">Rejected</Button>
                          ) : (
                            <Button variant="gold" className="w-full rounded-xl h-9" onClick={() => navigate(`/opportunity/${intern.id || intern._id}`)}>
                              Apply Now <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={cn("max-w-4xl mx-auto space-y-6 transition-opacity duration-300", fetchingPage && "opacity-40")}>
                {organizations.map((org, orgIndex) => {
                  const isExpanded = expandedOrg === org.name;
                  const Icon = Building2;
                  const orgLogo = org.items[0]?.organizationLogo || null;
                  return (
                    <motion.div
                      key={org.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: Math.min(orgIndex * 0.05, 0.3) }}
                      className={cn(
                        "bg-background rounded-2xl border shadow-card overflow-hidden transition-all",
                        isExpanded ? "border-accent/40 shadow-card-hover" : "border-border/30 hover:shadow-card-hover"
                      )}
                    >
                      {/* Organization header — click to expand */}
                      <button
                        type="button"
                        onClick={() => setExpandedOrg(isExpanded ? null : org.name)}
                        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/10 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                          {orgLogo ? (
                            <img src={orgLogo} alt={org.name} className="w-full h-full object-contain p-1 bg-white" />
                          ) : (
                            <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading font-semibold text-lg text-foreground">{org.name}</h3>
                            {org.name === DEFAULT_ORG && (
                              <Badge variant="outline" className="text-[10px] border-border/40 text-muted-foreground">In-house</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                            <UsersIcon className="w-3.5 h-3.5 text-accent" />
                            {org.items.length} open {org.items.length === 1 ? "opportunity" : "opportunities"}
                            {org.items[0]?.location && (
                              <span className="inline-flex items-center gap-1 ml-2">
                                <MapPin className="w-3.5 h-3.5 text-accent" /> {org.items[0].location}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-accent">
                            {isExpanded ? "Hide" : "View"}
                          </span>
                          <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180 text-accent")} />
                        </div>
                      </button>

                      {/* Expanded opportunity list */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-border/20 border-t border-border/30">
                              {org.items.map((intern: any) => {
                                const Icon2 = getCategoryIcon(intern.normalizedCategory || intern.category);
                                const status = getApplicationStatus(intern.id || intern._id);
                                return (
                                  <div key={intern.id || intern._id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/10 transition-colors">
                                    <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                                      <Icon2 className="w-5 h-5 text-accent" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        to={`/opportunity/${intern.id || intern._id}`}
                                        className="font-heading font-semibold text-foreground hover:text-accent transition-colors line-clamp-1"
                                      >
                                        {intern.title}
                                      </Link>
                                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                                          {intern.duration}
                                        </span>
                                        {intern.maxSpots > 0 && (
                                          <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50">
                                            {intern.maxSpots} spots
                                          </span>
                                        )}
                                        <span className="text-[10px] bg-card px-2 py-0.5 rounded text-muted-foreground border border-border/50 capitalize">
                                          {intern.type || "Remote"}
                                        </span>
                                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
                                          {intern.price === 0 || intern.price == null ? "Free" : formatPrice(intern.price)}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      {status === "approved" ? (
                                        <Button
                                          className="bg-green-600 hover:bg-green-700 rounded-xl font-bold text-sm h-9"
                                          onClick={() => navigate('/portal/student/internship')}
                                        >
                                          Continue <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                                        </Button>
                                      ) : status === "pending" ? (
                                        <Button disabled className="bg-amber-500 rounded-xl font-bold text-sm h-9">
                                          Pending <ClockIcon className="w-4 h-4 ml-1.5" />
                                        </Button>
                                      ) : status === "rejected" ? (
                                        <Button disabled className="bg-red-500 rounded-xl font-bold text-sm h-9">
                                          Rejected
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="gold"
                                          size="sm"
                                          className="rounded-xl h-9"
                                          onClick={() => navigate(`/opportunity/${intern.id || intern._id}`)}
                                        >
                                          Apply Now <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Opportunities;
