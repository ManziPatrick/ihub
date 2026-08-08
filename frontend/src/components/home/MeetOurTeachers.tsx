import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  ArrowRight,
  Linkedin,
  GraduationCap,
  MapPin,
  Clock,
  Users,
  Sparkles,
  CheckCircle,
  Star,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { itemListLd } from "@/lib/jsonld";
import { GET_TRAINERS_PUBLIC } from "@/lib/graphql/queries";

const TEACHERS_PAGE_SIZE = 12;

function initialsOf(name?: string, username?: string) {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    return parts
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return (username || "T").slice(0, 2).toUpperCase();
}

export function MeetOurTeachers() {
  const { data, loading } = useQuery(GET_TRAINERS_PUBLIC, {
    variables: { page: 1, limit: TEACHERS_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
  });

  const teachers = useMemo(() => (data as any)?.trainers?.items || [], [data]);

  return (
    <section id="meet-our-teachers" className="relative py-16 lg:py-24 bg-background overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.08),transparent_70%)]" />
        <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Structured data — ItemList of teachers for rich search results */}
      {teachers.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(
            itemListLd(
              teachers.map((t: any) => ({
                name: t.fullName || t.username,
                url: `https://bootskills.com/trainer/${t.id}`,
                image: t.avatar || undefined,
              })),
              {
                name: "Bootskills Teachers",
                description: "Meet our verified teachers, trainers and mentors on Bootskills.",
              }
            )
          )}
        </script>
      )}

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/25 backdrop-blur-sm mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-sm font-semibold text-accent">Our Teachers</span>
          </motion.div>

          <h2 className="font-heading text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Meet Our Teachers
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
            Learn from passionate, fully-qualified educators — from primary classrooms to national exam
            coaching and vocational training. Every teacher is verified, experienced, and ready to guide you.
          </p>
        </motion.div>

        {/* ── Loading Skeletons ── */}
        {loading && teachers.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border/30 overflow-hidden bg-card animate-pulse">
                <div className="h-24 bg-gradient-to-br from-accent/10 to-primary/5" />
                <div className="px-5 pb-6 -mt-12 relative">
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
        )}

        {/* ── Empty State ── */}
        {!loading && teachers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center mb-5">
              <Users className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold mb-1">Our teachers are on their way</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Teacher profiles will appear here soon. Check back shortly!
            </p>
          </motion.div>
        )}

        {/* ── Teachers Grid ── */}
        {teachers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {teachers.map((trainer: any, index: number) => {
              const specialties = trainer.trainerApplication?.specialties || [];
              const qualifications = trainer.trainerApplication?.qualifications || [];
              const linkedin = trainer.trainerApplication?.linkedinProfile;
              const initials = initialsOf(trainer.fullName, trainer.username);

              return (
                <motion.div
                  key={trainer.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.45 }}
                  whileHover={{ y: -6 }}
                  className="group relative h-full"
                >
                  {/* LinkedIn icon rendered as a sibling of the Link to avoid a nested <a> inside <a> */}
                  {linkedin && (
                    <a
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${trainer.fullName || trainer.username} on LinkedIn`}
                      className="absolute top-3 left-3 z-30 w-8 h-8 rounded-lg bg-gradient-to-br from-[#0077B5] to-[#005885] flex items-center justify-center text-white shadow-lg shadow-[#0077B5]/40 hover:scale-110 hover:shadow-[#0077B5]/60 transition-all"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  <Link to={`/trainer/${trainer.id}`} className="block h-full">
                    <div className="relative h-full bg-card rounded-2xl border border-border/30 overflow-hidden hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500">
                      {/* Hover glow */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/10 to-accent/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />

                      {/* Top gradient band — cover image fills the rounded border (avatar as fallback) */}
                      <div className="h-28 bg-gradient-to-br from-accent/25 via-accent/10 to-primary/15 relative overflow-hidden">
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
                          <div className="absolute inset-0 opacity-[0.08]"
                            style={{
                              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                              backgroundSize: "24px 24px",
                            }}
                          />
                        )}
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
                        {/* Avatar */}
                        <div className="relative w-fit mx-auto mb-4">
                          <div className="absolute -inset-1.5 bg-gradient-to-br from-accent/40 via-accent/10 to-transparent rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-background shadow-2xl">
                            <Avatar className="w-full h-full">
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
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 min-h-[2rem]">
                              {trainer.title}
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          {trainer.trainerApplication?.experienceYears ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-accent" />
                              {trainer.trainerApplication.experienceYears}y exp
                            </span>
                          ) : null}
                          {trainer.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-accent" />
                              {trainer.location.split(",")[0]}
                            </span>
                          )}
                        </div>

                        {/* Qualifications */}
                        {qualifications.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {qualifications.slice(0, 2).map((q: string, i: number) => (
                              <p
                                key={i}
                                className="flex items-start gap-1.5 text-[10px] text-muted-foreground/80 leading-snug"
                              >
                                <GraduationCap className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{q}</span>
                              </p>
                            ))}
                            {qualifications.length > 2 && (
                              <p className="text-[10px] text-accent/70 font-medium pl-[18px]">
                                +{qualifications.length - 2} more qualification{qualifications.length - 2 > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Bio */}
                        {trainer.bio && (
                          <p className="text-xs text-muted-foreground/70 mt-3 line-clamp-3 leading-relaxed text-center">
                            {trainer.bio}
                          </p>
                        )}

                        {/* Specialties */}
                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                            {specialties.slice(0, 3).map((s: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-bold uppercase tracking-wider"
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

                        {/* CTA */}
                        <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                            View Profile
                            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </span>
                          {trainer.trainerApplication?.rateHourly ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-foreground">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {trainer.trainerApplication.rateHourly}RWF/hr
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── View All CTA ── */}
        {teachers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Button
              asChild
              variant="gold"
              className="h-12 px-8 rounded-full font-bold shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all"
            >
              <Link to="/explore">
                Meet All Our Teachers <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
