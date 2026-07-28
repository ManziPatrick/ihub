import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_EVENT } from "@/lib/graphql/queries";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stripHtml } from "@/lib/utils";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Monitor,
  Users,
  Tag,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Sparkles,
  User,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  bootcamp: { label: "🔥 Bootcamp", color: "bg-orange-500/10 text-orange-500" },
  workshop: { label: "🔧 Workshop", color: "bg-blue-500/10 text-blue-500" },
  webinar: { label: "🎥 Webinar", color: "bg-purple-500/10 text-purple-500" },
  hackathon: { label: "💻 Hackathon", color: "bg-pink-500/10 text-pink-500" },
  conference: { label: "🎤 Conference", color: "bg-cyan-500/10 text-cyan-500" },
  meetup: { label: "🤝 Meetup", color: "bg-green-500/10 text-green-500" },
  other: { label: "📌 Event", color: "bg-accent/10 text-accent" },
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data, loading, error } = useQuery(GET_EVENT, {
    variables: { id },
    skip: !id,
  });

  const event = (data as any)?.event;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/events/${id}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeStyle = TYPE_BADGES[event?.type] || TYPE_BADGES.other;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Event not found</p>
          <Button variant="outline" onClick={() => navigate("/events")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={event.title + " | Bootskills Events"}
        description={event.shortDescription || stripHtml(event.description)?.substring(0, 160) || "Join this event at Bootskills Academy."}
        canonicalUrl={shareUrl}
        ogImage={event.image || undefined}
        keywords={`${event.type}, ${event.tags?.join(", ") || ""}, bootcamp Rwanda, skills training`}
      >
        <meta property="og:type" content="event" />
        <meta property="event:start_time" content={event.startDate} />
        <meta property="event:end_time" content={event.endDate} />
      </SEOHead>

      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Back & Share */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/events")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl">
                {copied ? (
                  <><Check className="w-4 h-4 mr-1.5 text-green-500" /> Copied!</>
                ) : (
                  <><Share2 className="w-4 h-4 mr-1.5" /> Share</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${typeStyle.color}`}>
                  <span>{typeStyle.label}</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold font-heading">
                  {event.title}
                </h1>
                {event.organizerName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4 text-accent" />
                    <span>Organized by <strong className="text-foreground">{event.organizerName}</strong></span>
                  </div>
                )}
              </motion.div>

              {/* Image */}
              {event.image && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative rounded-2xl overflow-hidden aspect-video lg:aspect-[21/9]"
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
                </motion.div>
              )}

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-xl font-bold font-heading flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                  About This Event
                </h2>
                <div
                  className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.description || "" }}
                />
              </motion.div>

              {/* Organizer */}
              {event.organizerBio && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-muted/10 rounded-2xl border border-border/30 p-6"
                >
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    About the Organizer
                  </h3>
                  <div className="flex items-start gap-4">
                    {event.organizerPhoto && (
                      <img
                        src={event.organizerPhoto}
                        alt={event.organizerName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{event.organizerName}</p>
                      <p className="text-sm text-muted-foreground mt-1">{event.organizerBio}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-lg"
                >
                  {event.image && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-5">
                    {/* Price */}
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {event.price === 0 || event.price == null
                          ? "Free"
                          : `${event.price.toLocaleString()} ${event.currency || "RWF"}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.price === 0 ? "No cost to attend" : "Per person"}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 pt-3 border-t border-border/30">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Event Details
                      </h4>

                      {event.startDate && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Date</p>
                            <p className="text-sm font-semibold">{formatDate(event.startDate)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(event.startDate)}
                              {event.endDate && ` - ${formatTime(event.endDate)}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {event.endDate && event.startDate !== event.endDate && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">End Date</p>
                            <p className="text-sm font-semibold">{formatDate(event.endDate)}</p>
                          </div>
                        </div>
                      )}

                      {event.location && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Location</p>
                            <p className="text-sm font-semibold">{event.location}</p>
                          </div>
                        </div>
                      )}

                      {event.isOnline && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Monitor className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Format</p>
                            <p className="text-sm font-semibold">Online Event</p>
                          </div>
                        </div>
                      )}

                      {event.maxAttendees > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Capacity</p>
                            <p className="text-sm font-semibold">{event.maxAttendees} attendees</p>
                          </div>
                        </div>
                      )}

                      {event.timezone && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">Timezone</p>
                            <p className="text-sm font-semibold">{event.timezone}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meeting Link */}
                    {event.meetingLink && (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button className="w-full rounded-xl" variant="gold">
                          <ExternalLink className="w-4 h-4 mr-2" /> Join Event
                        </Button>
                      </a>
                    )}

                    {/* Tags */}
                    {event.tags?.length > 0 && (
                      <div className="pt-3 border-t border-border/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {event.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-accent/20 text-accent bg-accent/5"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Share Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-muted/10 rounded-2xl border border-border/30 p-5"
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Share This Event
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 text-xs bg-card border border-border/30 rounded-lg px-3 py-2 text-muted-foreground truncate"
                    />
                    <Button size="icon" variant="outline" onClick={copyLink} className="shrink-0 rounded-lg">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
