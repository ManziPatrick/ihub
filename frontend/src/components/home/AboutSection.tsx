import { motion } from "framer-motion";
import { Target, Lightbulb } from "lucide-react";
import { ImageWithSkeleton } from "@/components/ui/image-skeleton";
import aboutImage from "@/assets/about-training.jpg";

export function AboutSection() {
  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground text-center">
            About IHUB
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-heading text-xl lg:text-3xl text-foreground mb-4 leading-tight">
              A Center of Excellence in Professional Growth & Skills Mastery
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
              We combine structured learning, hands-on practice, and real project experience
              to prepare learners for today's digital economy. Training delivered online and
              in person with dedicated mentorship.
            </p>

            {/* Mission & Vision Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-card rounded-xl border border-border/30 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-heading font-semibold text-card-foreground">Our Mission</h4>
                </div>
                <p className="text-sm text-card-foreground/70 leading-relaxed">
                  Empower individuals with practical, industry-ready technology skills through expert mentorship.
                </p>
              </div>

              <div className="p-5 bg-card rounded-xl border border-border/30 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Lightbulb className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-heading font-semibold text-card-foreground">Our Vision</h4>
                </div>
                <p className="text-sm text-card-foreground/70 leading-relaxed">
                  To be Africa's leading center of excellence in professional education and innovation.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-card shadow-card relative border border-border/50">
              <ImageWithSkeleton
                src={aboutImage}
                alt="IHUB training center"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                containerClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Decorative element - Hidden on smaller mobile to avoid overflow */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-2 border-accent/20 rounded-2xl -z-10 hidden sm:block" />
            <div className="absolute -top-4 -left-4 w-16 h-16 border-2 border-accent/10 rounded-2xl -z-10 hidden sm:block" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
