import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "Enroll", description: "Choose a program" },
  { number: "02", title: "Learn", description: "Guided sessions" },
  { number: "03", title: "Practice", description: "Mentorship" },
  { number: "04", title: "Build", description: "Real projects" },
  { number: "05", title: "Experience", description: "Internship" },
  { number: "06", title: "Graduate", description: "Certification" },
];

export function TrainingProcess() {
  return (
    <section className="py-16 lg:py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground text-center">
            How Our Training Works
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground mb-10 text-sm"
        >
          From Learning to Industry — Your journey with Bootskills
        </motion.p>

        {/* Web3 Tree Structure */}
        <div className="relative max-w-4xl mx-auto">
          {/* Central vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent/20 via-accent/60 to-accent/20 -translate-x-1/2 hidden lg:block" />
          
          {/* Mobile vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-accent/20 via-accent/60 to-accent/20 lg:hidden" />

          <div className="space-y-6 lg:space-y-0">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex items-center gap-4 lg:gap-0 ${
                    index > 0 ? "lg:mt-4" : ""
                  }`}
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden flex items-center gap-4">
                    {/* Node */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-card border-2 border-accent/50 flex items-center justify-center shadow-gold-glow">
                      <span className="font-heading text-lg font-bold text-accent">{step.number}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="bg-card rounded-lg p-4 shadow-card border border-border/30 flex-1">
                      <h3 className="font-heading font-semibold text-card-foreground">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>

                  {/* Desktop Tree Layout */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_80px_1fr] lg:items-center lg:w-full">
                    {/* Left Content */}
                    <div className={`${isEven ? "pr-8" : ""}`}>
                      {isEven && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-card rounded-lg p-4 shadow-card border border-border/30 ml-auto max-w-xs text-right group hover:border-accent/50 hover:shadow-gold-glow transition-all duration-300"
                        >
                          <h3 className="font-heading font-semibold text-card-foreground group-hover:text-accent transition-colors">{step.title}</h3>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          
                          {/* Connection line to node */}
                          <div className="absolute right-0 top-1/2 w-8 h-px bg-accent/40 translate-x-full -translate-y-1/2" />
                        </motion.div>
                      )}
                    </div>

                    {/* Center Node */}
                    <div className="flex justify-center relative">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative z-10 w-14 h-14 rounded-full bg-card border-2 border-accent/50 flex items-center justify-center shadow-gold-glow cursor-pointer hover:border-accent transition-all duration-300"
                      >
                        <span className="font-heading text-base font-bold text-accent">{step.number}</span>
                        
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-20" />
                      </motion.div>
                      
                      {/* Connection dots */}
                      {index < steps.length - 1 && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 py-2">
                          <div className="w-1 h-1 rounded-full bg-accent/40" />
                          <div className="w-1 h-1 rounded-full bg-accent/30" />
                          <div className="w-1 h-1 rounded-full bg-accent/20" />
                        </div>
                      )}
                    </div>

                    {/* Right Content */}
                    <div className={`${!isEven ? "pl-8" : ""}`}>
                      {!isEven && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-card rounded-lg p-4 shadow-card border border-border/30 max-w-xs group hover:border-accent/50 hover:shadow-gold-glow transition-all duration-300"
                        >
                          <h3 className="font-heading font-semibold text-card-foreground group-hover:text-accent transition-colors">{step.title}</h3>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          
                          {/* Connection line to node */}
                          <div className="absolute left-0 top-1/2 w-8 h-px bg-accent/40 -translate-x-full -translate-y-1/2" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Decorative circuit patterns */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 400 600">
            <path d="M50,50 L100,50 L120,70 L120,150" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            <path d="M350,100 L300,100 L280,120 L280,200" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            <path d="M50,400 L100,400 L120,420 L120,500" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            <circle cx="120" cy="70" r="3" className="fill-accent" />
            <circle cx="280" cy="120" r="3" className="fill-accent" />
            <circle cx="120" cy="420" r="3" className="fill-accent" />
          </svg>
        </div>
      </div>
    </section>
  );
}
