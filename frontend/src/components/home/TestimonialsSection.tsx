import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import testimonialEmmanuel from "@/assets/testimonial-emmanuel.webp";
import testimonialMarie from "@/assets/testimonial-marie.webp";
import testimonialJean from "@/assets/testimonial-jean.webp";

const testimonials = [
  {
    id: 1,
    quote: "IHUB helped me transition from learning to real-world development. The mentorship prepared me for industry work.",
    author: "Emmanuel R.",
    role: "Software Developer",
    company: "TechCorp Rwanda",
    image: testimonialEmmanuel,
  },
  {
    id: 2,
    quote: "The Data Science program gave me practical skills I use every day. Online classes were flexible with world-class instructors.",
    author: "Marie Claire M.",
    role: "Data Analyst",
    company: "FinanceHub Ltd",
    image: testimonialMarie,
  },
  {
    id: 3,
    quote: "From training to internship to full-time employment, IHUB's network opened doors I never knew existed.",
    author: "Jean Paul N.",
    role: "IoT Engineer",
    company: "SmartFarm Solutions",
    image: testimonialJean,
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

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
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-3 border-accent/30 shadow-lg group">
                        <ImageWithSkeleton
                          src={currentTestimonial.image}
                          alt={currentTestimonial.author}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          containerClassName="w-full h-full"
                        />
                      </div>
                    </motion.div>

                    {/* Quote and Info */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="flex items-start gap-2 mb-4">
                        <Quote className="w-6 h-6 text-accent flex-shrink-0 transform rotate-180 hidden lg:block" />
                        <p className="text-foreground leading-relaxed font-heading italic text-base lg:text-lg">
                          {currentTestimonial.quote}
                        </p>
                        <Quote className="w-6 h-6 text-accent flex-shrink-0 self-end hidden lg:block" />
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
                        <span className="font-semibold text-foreground">
                          {currentTestimonial.author}
                        </span>
                        <span className="hidden lg:inline text-accent">•</span>
                        <span className="text-muted-foreground text-sm">
                          {currentTestimonial.role}
                        </span>
                        <span className="hidden lg:inline text-muted-foreground/50">|</span>
                        <span className="text-accent text-sm">
                          {currentTestimonial.company}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
