import { motion } from "framer-motion";
import { Code, Database, Wifi, Briefcase } from "lucide-react";

const services = [
  {
    icon: Code,
    title: "Software Development",
    description: "Design and build modern web and mobile applications using industry best practices.",
  },
  {
    icon: Database,
    title: "Data Science & AI",
    description: "Learn data analysis, machine learning, model training, and intelligent systems development.",
  },
  {
    icon: Wifi,
    title: "Internet of Things (IoT)",
    description: "Develop smart, connected systems using sensors, devices, and automation.",
  },
  {
    icon: Briefcase,
    title: "Programs & Projects",
    description: "Gain hands-on experience through supervised programs and industry-based projects.",
  },
];

export function ServicesSection() {
  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <h2 className="font-heading text-2xl lg:text-3xl font-medium text-foreground text-center">
            What We Do
          </h2>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-card-hover border border-border/30 transition-all duration-300 h-full flex flex-col">
                {/* Icon area with circuit pattern */}
                <div className="relative h-40 bg-gradient-to-br from-card via-card to-accent/5 flex items-center justify-center overflow-hidden">
                  {/* Circuit decoration */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-30"
                    viewBox="0 0 200 160"
                  >
                    <path
                      d="M0,80 L50,80 L60,60 L100,60 M100,60 L120,80 L150,80 L160,100 L200,100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-accent"
                    />
                    <circle cx="60" cy="60" r="3" className="fill-accent" />
                    <circle cx="120" cy="80" r="3" className="fill-accent" />
                  </svg>

                  <div className="relative w-16 h-16 rounded-full bg-accent/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <service.icon className="w-8 h-8 text-accent" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-heading text-lg font-semibold text-card-foreground mb-3 leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-sm text-card-foreground/70 leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
