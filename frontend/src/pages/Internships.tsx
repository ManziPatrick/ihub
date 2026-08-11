import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthAwareLink } from "@/components/AuthAwareLink";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import {
  Briefcase,
  Code,
  Database,
  Wifi,
  Award,
  FolderOpen,
  Users,
  Clock,
  Target,
  Globe,
  Search,
  Building2,
  ChevronDown,
  ClockIcon,
  UsersIcon,
  ArrowRightIcon,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import internshipImage from "@/assets/internship-work.webp";
import internshipImageMobile from "@/assets/internship-work-mobile.webp";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAMS, GET_MY_INTERNSHIP_APPLICATIONS, GET_ME } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

const benefits = [
  { icon: FolderOpen, title: "Real Projects", description: "Work on actual client projects and products, not simulated exercises. Your work will have real impact." },
  { icon: Users, title: "Mentorship", description: "One-on-one guidance from experienced professionals who are invested in your growth and success." },
  { icon: Award, title: "Certification", description: "Receive a recognized certificate that validates your experience to future employers." },
  { icon: Clock, title: "Flexible Schedule", description: "Balance your opportunity with other commitments. We offer part-time and flexible arrangements." },
  { icon: Globe, title: "Remote-Friendly", description: "Participate from anywhere with our online and hybrid options." },
  { icon: Target, title: "Career Pathway", description: "Top performers get priority access to full-time positions and advanced opportunities." },
];

const process = [
  { step: "1", title: "Apply Online", description: "Submit your application with resume and a brief statement of interest." },
  { step: "2", title: "Skills Assessment", description: "Complete a short technical assessment relevant to your chosen track." },
  { step: "3", title: "Interview", description: "Meet with the team to discuss your goals and expectations." },
  { step: "4", title: "Onboarding", description: "Get set up with tools, meet your mentor, and start your journey." },
];

const testimonials = [
  {
    name: "Emmanuel R.",
    role: "Former Software Intern",
    current: "Now Junior Developer at TechCorp",
    quote: "The program gave me real project experience that made all the difference in my job interviews. The mentorship was invaluable."
  },
  {
    name: "Grace M.",
    role: "Former Data Science Intern",
    current: "Now Data Analyst at FinanceHub",
    quote: "Working on actual business problems taught me more in 3 months than years of self-study. Highly recommend!"
  },
];

const DEFAULT_ORG = "Bootskills Academy";

const Opportunities = () => {
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("q") || "");
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

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

  const internshipPrograms = (internsData as any)?.internshipPrograms?.items || [];
  const myApplications = (appsData as any)?.myInternshipApplications || [];

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
                Explore Opportunities
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                Discover Opportunities at Companies &amp; Schools
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg">
                Browse open positions grouped by organization — from Google to local universities.
                Open an organization card to see every opportunity they offer and apply in one click.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <AuthAwareLink variant="gold" size="lg" to="/portal/student/internship">Apply for an Opportunity</AuthAwareLink>
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
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Why Join a Program</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground mt-2 mb-4">
                What You'll Gain
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our programs are designed to give you the practical experience employers want to see,
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
                alt="Professionals collaborating on a project"
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

        {/* Open Opportunities grouped by organization */}
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
                Browse Opportunities by Organization
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
                Tap a company or school to see all their open opportunities — then apply directly.
              </p>
            </motion.div>

            {/* Opportunity search — matches titles, organizations, descriptions and more */}
            <div className="relative max-w-md mx-auto mb-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search opportunities, organizations, fields..."
                className="pl-10 rounded-xl bg-background border-border/40"
              />
            </div>

            {internshipPrograms.length === 0 && !internsLoading ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {debouncedSearch.trim()
                    ? `No opportunities match "${debouncedSearch.trim()}". Try a different keyword or organization.`
                    : "No opportunities available at the moment."}
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {organizations.map((org, orgIndex) => {
                  const isExpanded = expandedOrg === org.name;
                  const Icon = Building2;
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
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg shrink-0">
                          <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
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
                What Our Alumni Say
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
                Ready to Find Your Opportunity?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Applications are reviewed on a rolling basis. Apply early to secure your spot
                in our next cohort.
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

export default Opportunities;
