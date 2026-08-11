import { useMemo, useState } from "react";
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
    if (apiItems.length > 0) return apiItems;
    return FALLBACK_TESTIMONIALS;
  }, [data]);

  const isLoading = loading && testimonials.length === 0;

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const currentTestimonial = testimonials[currentIndex % testimonials.length];

  return (
    <section className="py-16 lg:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground text-center">
            Success Stories
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Prev Button */}
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Testimonial Content */}
            <div className="flex-1 relative min-h-[200px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-background rounded-xl p-6 lg:p-8 shadow-card"
                  >
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-muted animate-pulse flex-shrink-0" />
                      <div className="flex-1 w-full space-y-3">
                        <div className="h-4 bg-muted animate-pulse rounded w-full" />
                        <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/3 mt-4" />
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
                    className="bg-background rounded-xl p-6 lg:p-8 shadow-card"
                  >
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                      {/* Avatar with hover effect */}
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TestimonialAvatar item={currentTestimonial} className="w-20 h-20 lg:w-24 lg:h-24" />
                      </motion.div>

                      {/* Quote and Info */}
                      <div className="flex-1 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start">
                          <Stars rating={currentTestimonial.rating} />
                        </div>
                        <div className="flex items-start gap-2 mb-4">
                          <Quote className="w-6 h-6 text-accent flex-shrink-0 transform rotate-180 hidden lg:block" />
                          <p className="text-foreground leading-relaxed font-heading italic text-base lg:text-lg">
                            "{currentTestimonial.quote}"
                          </p>
                          <Quote className="w-6 h-6 text-accent flex-shrink-0 self-end hidden lg:block" />
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                          <span className="font-semibold text-foreground">
                            {currentTestimonial.authorName}
                          </span>
                          {currentTestimonial.authorRole && (
                            <>
                              <span className="hidden lg:inline text-accent">•</span>
                              <span className="text-muted-foreground text-sm">
                                {currentTestimonial.authorRole}
                              </span>
                            </>
                          )}
                          {currentTestimonial.authorCompany && (
                            <>
                              <span className="hidden lg:inline text-muted-foreground/50">|</span>
                              <span className="text-accent text-sm">
                                {currentTestimonial.authorCompany}
                              </span>
                            </>
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
              className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                    ? "bg-accent w-8"
                    : "bg-foreground/20 hover:bg-foreground/40 w-2"
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Thumbnail Previews */}
          {!isLoading && (
            <div className="flex items-center justify-center gap-4 mt-8">
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.id}
                  onClick={() => setCurrentIndex(index)}
                  whileHover={{ scale: 1.1, y: -4 }}
                  className={`w-12 h-12 rounded-full overflow-hidden transition-all duration-300 ${index === currentIndex
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                      : "opacity-50 hover:opacity-100"
                    }`}
                >
                  <TestimonialAvatar item={testimonial} className="w-full h-full" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
