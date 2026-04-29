import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CategoryMeta {
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
}

interface InterestsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  getCategoryMeta: (cat: string) => CategoryMeta;
}

export function InterestsOverlay({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onSelectCategory,
  getCategoryMeta,
}: InterestsOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 z-[70] bg-background/80 backdrop-blur-md border border-border text-foreground p-4 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Interests</h2>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat, idx) => {
                if (cat === "All") return null;
                const meta = getCategoryMeta(cat);
                const Icon = meta.icon;
                const isActive = activeCategory === cat;
                
                return (
                  <motion.button
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    onClick={() => {
                      onSelectCategory(cat);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 border ${
                      isActive
                        ? "bg-foreground text-background border-foreground"
                        : `bg-muted/50 text-foreground/80 border-border hover:border-foreground/20 hover:bg-muted`
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? "text-background" : meta.text}`} />
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
