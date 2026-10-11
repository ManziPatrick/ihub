import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";

type Props = {
  eyebrow?: string;
  title: string;
  line: string;
  compact?: boolean;
  actions?: Array<{ to: string; label: string; gold?: boolean }>;
};

export function PublicHero({ eyebrow, title, line, compact, actions }: Props) {
  return (
    <section className={`bg-card relative overflow-hidden ${compact ? "py-10 lg:py-14" : "py-14 lg:py-20"}`}>
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          {eyebrow && (
            <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full mb-3">
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading text-3xl lg:text-4xl font-medium text-card-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-card-foreground/75 mt-3 text-base">{line}</p>
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {actions.map((a) => (
                <Link key={a.to} to={a.to}>
                  <Button variant={a.gold ? "gold" : "outline"} size="lg">
                    {a.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
