import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import { useQuery } from "@apollo/client/react";
import { GET_PUBLIC_TESTIMONIALS } from "@/lib/graphql/queries";
import testimonialEmmanuel from "@/assets/testimonial-emmanuel.webp";
import testimonialMarie from "@/assets/testimonial-marie.webp";
import testimonialJean from "@/assets/testimonial-jean.webp";

// Static fallback used while loading or when no approved testimonials exist yet.
const FALLBACK_TESTIMONIALS = [
  {
    id: "static-1",
    quote: "Bootskills helped me transition from learning to real-world development. The mentorship prepared me for industry work.",
    authorName: "Emmanuel R.",
    authorRole: "Software Developer",
    authorCompany: "TechCorp Rwanda",
    authorAvatar: testimonialEmmanuel,
  },
  {
    id: "static-2",
    quote: "The Data Science program gave me practical skills I use every day. Online classes were flexible with world-class instructors.",
    authorName: "Marie Claire M.",
    authorRole: "Data Analyst",
    authorCompany: "FinanceHub Ltd",
    authorAvatar: testimonialMarie,
  },
  {
    id: "static-3",
    quote: "From training to program to full-time employment, Bootskills's network opened doors I never knew existed.",
    authorName: "Jean Paul N.",
    authorRole: "IoT Engineer",
    authorCompany: "SmartFarm Solutions",
    authorAvatar: testimonialJean,
  },
];

type TestimonialItem = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatar?: string | null;
  rating?: number | null;
};

function TestimonialAvatar({ item, className }: { item: TestimonialItem; className: string }) {
  const initial = (item.authorName || "S").charAt(0).toUpperCase();
  if (item.authorAvatar) {
    return (
      <div className={`${className} rounded-full overflow-hidden border-3 border-accent/30 shadow-lg bg-muted`}>
        <ImageWithSkeleton
          src={item.authorAvatar}
          alt={item.authorName}
          className="w-full h-full object-cover"
          containerClassName="w-full h-full"
        />
      </div>
    );
  }
  return (
    <div
      className={`${className} rounded-full border-3 border-accent/30 shadow-lg bg-gradient-to-br from-accent/80 to-accent/40 flex items-center justify-center text-foreground font-heading font-bold`}
    >
      {initial}
    </div>
  );
}

function Stars({ rating }: { rating?: number | null }) {
  const r = rating || 5;
  return (
    <div className="flex items-center gap-0.5 mb-3" aria-label={`${r} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= r ? "text-amber-400" : "text-foreground/15"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.784.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.37 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.287-3.958z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { data, loading } = useQuery(GET_PUBLIC_TESTIMONIALS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const testimonials = useMemo<TestimonialItem[]>(() => {
    const apiItems: TestimonialItem[] = ((data as any)?.publicTestimonials || [])
      .filter((t: any) => t && t.quote)
      .map((t: any) => ({
        id: t.id,
        quote: t.quote,
        authorName: t.authorName || "Student",
        authorRole: t.authorRole || "",
        authorCompany: t.authorCompany || "",
        authorAvatar: t.authorAvatar || null,
        rating: t.rating,
      }));
    // Always keep at least 2 entries so the carousel auto-slides even when few
    // (or zero) approved testimonials exist yet — approved ones come first.
    const merged = [...apiItems];
    if (merged.length < 2) {
      for (const fb of FALLBACK_TESTIMONIALS) {
        if (!merged.some((m) => m.id === fb.id)) merged.push(fb);
        if (merged.length >= 3) break;
      }
    }
    return merged;
  }, [data]);

  const isLoading = loading && testimonials.length === 0;

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const currentTestimonial = testimonials[currentIndex % testimonials.length];

  // Auto-slide every 5s, paused while the user hovers the carousel
  useEffect(() => {
    if (paused || testimonials.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, testimonials.length, currentIndex]);

  return (
    <section className="py-8 bg-transparent">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <h2 className="font-heading text-lg lg:text-xl font-medium text-foreground text-center">
            Success Stories
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        {/* Testimonial Carousel */}
        <div
          className="max-w-2xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center gap-3 lg:gap-5">
            {/* Prev Button */}
            <button
              onClick={prev}
              className="w-8 h-8 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Testimonial Content */}
            <div className="flex-1 relative min-h-[120px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-background rounded-xl p-4 lg:p-5 shadow-sm border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted animate-pulse rounded w-full" />
                        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-2 bg-muted animate-pulse rounded w-1/3" />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={currentTestimonial.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-background rounded-xl p-4 lg:p-5 shadow-sm border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TestimonialAvatar item={currentTestimonial} className="w-12 h-12 lg:w-14 lg:h-14" />
                      </motion.div>

                      {/* Quote and Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <Stars rating={currentTestimonial.rating} />
                          <Quote className="w-4 h-4 text-accent/40 flex-shrink-0" />
                        </div>
                        <p className="text-foreground leading-snug font-heading italic text-sm line-clamp-3">
                          "{currentTestimonial.quote}"
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">
                            {currentTestimonial.authorName}
                          </span>
                          {currentTestimonial.authorRole && (
                            <span className="text-muted-foreground text-xs">
                              {currentTestimonial.authorRole}
                            </span>
                          )}
                          {currentTestimonial.authorCompany && (
                            <span className="text-accent text-xs">
                              · {currentTestimonial.authorCompany}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next Button */}
            <button
              onClick={next}
              className="w-8 h-8 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
              aria-label="Next testimonial"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                    ? "bg-accent w-6"
                    : "bg-foreground/20 hover:bg-foreground/40 w-1.5"
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
