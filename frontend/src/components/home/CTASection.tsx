import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AuthAwareLink } from "@/components/AuthAwareLink";

export function CTASection() {
  return (
    <section className="py-16 lg:py-20 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
          <path
            d="M0,200 L100,200 L120,180 L200,180 L220,200 L400,200 L420,180 L500,180 L520,200 L700,200 L720,180 L800,180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-accent"
          />
          <circle cx="120" cy="180" r="4" className="fill-accent" />
          <circle cx="420" cy="180" r="4" className="fill-accent" />
          <circle cx="720" cy="180" r="4" className="fill-accent" />
        </svg>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-heading text-2xl lg:text-3xl xl:text-4xl font-medium text-card-foreground mb-4">
            Join the Future of Technology in Africa
          </h2>
          
          <p className="text-card-foreground/80 mb-6 max-w-xl mx-auto">
            Meet with iHub.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <AuthAwareLink variant="gold" size="lg" className="group">
              View Programs
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </AuthAwareLink>
            <AuthAwareLink 
              variant="heroOutline" 
              size="lg"
              className="bg-transparent text-card-foreground border-card-foreground/30 hover:border-accent hover:text-accent"
            >
              Contact Us
            </AuthAwareLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
