import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import topImage from "@/assets/top-hero.webp";

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore${searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : ""}`);
  };

  return (
    <section className="pt-20 pb-8 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div
          className="relative rounded-2xl overflow-hidden py-16 lg:py-24 px-4 shadow-2xl bg-cover bg-center border border-white/10"
          style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.5)), url(${topImage})` }}
        >
          {/* Subtle decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-white/5 opacity-40 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-white/5 opacity-40 pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                Explore
              </h1>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-6">
                Programs for Your Future
              </h1>

              {/* Search bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex items-center gap-2 max-w-xl mx-auto"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    id="hero-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by program, school, or location..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 p-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
                  aria-label="Filter programs"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </motion.form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
