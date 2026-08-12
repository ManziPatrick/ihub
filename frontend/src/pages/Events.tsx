import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_UNIFIED_EVENTS } from "@/lib/graphql/queries";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
import {
  Calendar,
  MapPin,
  Globe,
  Search,
  Loader2,
  ArrowRight,
  Users,
  Monitor,
  Sparkles,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPES = [
  { value: "", label: "All" },
  { value: "bootcamp", label: "Bootcamps" },
  { value: "workshop", label: "Workshops" },
  { value: "webinar", label: "Webinars" },
  { value: "hackathon", label: "Hackathons" },
  { value: "conference", label: "Conferences" },
  { value: "internship", label: "Programs" },
];

const TYPE_ICONS: Record<string, string> = {
  bootcamp: "🔥",
  workshop: "🔧",
  webinar: "🎥",
  hackathon: "💻",
  conference: "🎤",
  meetup: "🤝",
  internship: "💼",
  other: "📌",
};

export default function Events() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showUpcoming, setShowUpcoming] = useState(false);

  const { data, loading } = useQuery(GET_UNIFIED_EVENTS, {
    variables: {
      page,
      limit: 20,
      type: typeFilter || undefined,
      search: search || undefined,
      upcoming: showUpcoming || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const items = (data as any)?.unifiedEventsAndInternships || [];

  const { formatPrice } = useCurrency();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatItemPrice = (item: any) => {
    if (item.price === 0 || item.price == null) return "Free";
    return formatPrice(item.price);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Events & Programs"
        description="Discover bootcamps, workshops, hackathons, webinars, and programs at Bootskills Academy."
        canonicalUrl="https://bootskills.com/events"
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-b from-accent/5 to-background pb-12">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="secondary" className="bg-accent/10 text-accent border-0 mb-4">
                <Sparkles className="w-3 h-3 mr-1" /> Events & Programs
              </Badge>
              <h1 className="text-3xl lg:text-5xl font-bold font-heading mb-4">
                Events & Programs
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
                Browse bootcamps, workshops, hackathons, and programs. 
                Find the perfect opportunity to grow your skills and career.
              </p>

              {/* Search & Filters */}
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search events, bootcamps, programs..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-12 h-12 text-base rounded-xl bg-card border-border/50"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => { setTypeFilter(t.value); setPage(1); }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        typeFilter === t.value
                          ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                          : "bg-card text-muted-foreground hover:text-foreground border border-border/30"
                      }`}
                    >
                      {TYPE_ICONS[t.value] && <span className="mr-1.5">{TYPE_ICONS[t.value]}</span>}
                      {t.label}
                    </button>
                  ))}
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUpcoming}
                    onChange={(e) => { setShowUpcoming(e.target.checked); setPage(1); }}
                    className="rounded border-border/50 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-muted-foreground">Show only upcoming</span>
                </label>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="container mx-auto px-4 lg:px-8">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground text-sm">
                {search || typeFilter || showUpcoming
                  ? "Try adjusting your filters or search terms."
                  : "No events or programs are currently available."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item: any, index: number) => (
                  <motion.div
                    key={`${item.source}-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 9) * 0.05 }}
                    className="group bg-card rounded-2xl border border-border/40 overflow-hidden hover:shadow-xl hover:shadow-accent/5 hover:border-accent/20 transition-all duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted/20">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {TYPE_ICONS[item.type] || "📌"}
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-accent/90 text-accent-foreground border-0 text-[10px] uppercase tracking-wider">
                          {item.source === "event" ? item.type : "Program"}
                        </Badge>
                        {item.price === 0 && (
                          <Badge variant="secondary" className="bg-green-500/90 text-white border-0 text-[10px]">
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {item.shortDescription || item.description?.replace(/<[^>]*>/g, "").substring(0, 150)}
                      </p>

                      {/* Meta */}
                      <div className="space-y-2 mb-4">
                        {item.startDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>
                              {formatDate(item.startDate)}
                              {item.endDate && ` - ${formatDate(item.endDate)}`}
                            </span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                        {item.isOnline && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Monitor className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>Online</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {formatItemPrice(item)}
                          </span>
                          {item.tags?.length > 0 && (
                            <div className="flex gap-1">
                              {item.tags.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-[10px] bg-accent/5 text-accent px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant={item.source === "internship" ? "gold" : "default"}
                        className="w-full rounded-xl group/btn"
                        onClick={() => {
                          if (item.source === "event") navigate(`/events/${item.id}`);
                          else navigate(`/opportunity/${item.id}`);
                        }}
                      >
                        {item.source === "event" ? "View Event" : "View Program"}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {items.length >= 20 && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
