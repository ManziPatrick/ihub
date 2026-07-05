import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Users, 
  Briefcase, 
  Monitor, 
  Target, 
  Wrench,
  CheckCircle
} from "lucide-react";

export function WhyChooseSection() {
  const { t } = useTranslation();

  const reasons = [
    { icon: GraduationCap, titleKey: "home.expertTrainersTitle" as const, descKey: "home.expertTrainersDesc" as const },
    { icon: Users, titleKey: "home.dedicatedMentorshipTitle" as const, descKey: "home.dedicatedMentorshipDesc" as const },
    { icon: Briefcase, titleKey: "home.realWorldProjectsTitle" as const, descKey: "home.realWorldProjectsDesc" as const },
    { icon: Monitor, titleKey: "home.flexibleLearningTitle" as const, descKey: "home.flexibleLearningDesc" as const },
    { icon: Target, titleKey: "home.careerOrientedTitle" as const, descKey: "home.careerOrientedDesc" as const },
    { icon: Wrench, titleKey: "home.practicalFocusTitle" as const, descKey: "home.practicalFocusDesc" as const },
  ];

  const checkItems = [
    "home.checkExpertTrainers",
    "home.checkDedicatedMentorship",
    "home.checkRealWorldProjects",
    "home.checkOnlinePhysical",
    "home.checkCareerOriented",
    "home.checkPracticalSkills",
  ];

  return (
    <section className="py-16 lg:py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mb-2">
              {t("home.whyChoose")}
            </h2>
            <p className="text-card-foreground/70 text-sm">
              {t("home.learningRealImpact")}
            </p>
          </motion.div>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-background/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                <reason.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading font-semibold text-card-foreground text-sm mb-1">
                {t(reason.titleKey)}
              </h3>
              <p className="text-xs text-card-foreground/60">
                {t(reason.descKey)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Detailed List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {checkItems.map((itemKey, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" strokeWidth={1.5} />
                <span className="text-card-foreground/80 text-sm">{t(itemKey)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
