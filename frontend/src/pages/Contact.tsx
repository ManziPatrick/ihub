import { useTranslation } from "react-i18next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Clock, MessageSquare, Users, Briefcase, GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import heroImage from "@/assets/hero-training.webp";
import heroImageMobile from "@/assets/hero-training-mobile.webp";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    inquiryType: "",
    message: "",
  });

  const contactInfo = [
    { icon: MapPin, labelKey: "contact.address" as const, value: t("contact.kigaliRwanda") },
    { icon: Mail, labelKey: "contact.email" as const, value: "info@bootskills.com" },
    { icon: Phone, labelKey: "contact.phone" as const, value: "+250 790 706 170" },
    { icon: Clock, labelKey: "contact.officeHours" as const, value: t("contact.hours") },
  ];

  const inquiryTypes = [
    { icon: GraduationCap, titleKey: "contact.trainingPrograms" as const, descKey: "contact.trainingProgramsDesc" as const },
    { icon: Briefcase, titleKey: "contact.internships" as const, descKey: "contact.internshipsDesc" as const },
    { icon: Users, titleKey: "contact.corporateSolutions" as const, descKey: "contact.corporateSolutionsDesc" as const },
    { icon: MessageSquare, titleKey: "contact.generalInquiry" as const, descKey: "contact.generalInquiryDesc" as const },
  ];

  const faqs = [
    { qKey: "contact.faq1q" as const, aKey: "contact.faq1a" as const },
    { qKey: "contact.faq2q" as const, aKey: "contact.faq2a" as const },
    { qKey: "contact.faq3q" as const, aKey: "contact.faq3a" as const },
    { qKey: "contact.faq4q" as const, aKey: "contact.faq4a" as const },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("leads").insert({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        interest: formData.inquiryType || null,
        message: `${formData.subject}\n\n${formData.message}`.trim(),
        source_page: "contact",
      });

      if (error) throw error;

      toast.success(t("contact.thanksMessage"));
      setFormData({ name: "", email: "", phone: "", subject: "", inquiryType: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(t("contact.errorMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t("contact.getInTouch")} | Bootskills - Kigali, Rwanda</title>
        <meta name="description" content={t("contact.heroDesc")} />
        <link rel="canonical" href="https://bootskills.com/contact" />
        <meta property="og:title" content={`${t("contact.getInTouch")} | Bootskills - Kigali, Rwanda`} />
        <meta property="og:description" content={t("contact.heroDesc")} />
        <meta property="og:url" content="https://bootskills.com/contact" />
        <meta property="og:type" content="website" />
        <meta name="geo.region" content="RW-01" />
        <meta name="geo.placename" content="Kigali" />
        <meta name="geo.position" content="-1.9441;30.0619" />
      </Helmet>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-card relative overflow-hidden">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-4 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full mb-4">
                {t("contact.getInTouch")}
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                {t("contact.wedLoveToHear")}
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg">
                {t("contact.heroDesc")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Inquiry Types */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {inquiryTypes.map((type, index) => (
                <motion.div
                  key={type.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-5 rounded-xl shadow-card border border-border/30 text-center group hover:shadow-card-hover hover:border-accent/30 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <type.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground text-sm mb-1">{t(type.titleKey)}</h3>
                  <p className="text-xs text-card-foreground/60">{t(type.descKey)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2"
              >
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
                  {t("contact.contactInfo")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("contact.contactInfoDesc")}
                </p>

                <div className="space-y-6 mb-8">
                  {contactInfo.map((item) => (
                    <div key={item.labelKey} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center flex-shrink-0 shadow-card">
                        <item.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t(item.labelKey)}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map placeholder */}
                <div className="aspect-video rounded-xl overflow-hidden bg-card shadow-card border border-border/30">
                  <div className="w-full h-full bg-gradient-to-br from-card to-accent/10 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-10 h-10 text-accent mx-auto mb-2" />
                      <p className="text-sm text-card-foreground/70">{t("contact.kigaliRwanda")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-3"
              >
                <form onSubmit={handleSubmit} className="bg-card p-6 lg:p-8 rounded-xl shadow-card border border-border/30">
                  <h2 className="font-heading text-xl font-semibold text-card-foreground mb-2">
                    {t("contact.sendMessage")}
                  </h2>
                  <p className="text-sm text-card-foreground/70 mb-6">
                    {t("contact.sendMessageDesc")}
                  </p>

                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.fullName")}</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder={t("contact.namePlaceholder")}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.emailAddress")}</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder={t("contact.emailPlaceholder")}
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.phoneNumber")}</label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={t("contact.phonePlaceholder")}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.inquiryType")}</label>
                        <select
                          value={formData.inquiryType}
                          onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                          <option value="">{t("contact.selectType")}</option>
                          <option value="training">{t("contact.optionTraining")}</option>
                          <option value="internship">{t("contact.optionInternship")}</option>
                          <option value="corporate">{t("contact.optionCorporate")}</option>
                          <option value="partnership">{t("contact.optionPartnership")}</option>
                          <option value="general">{t("contact.optionGeneral")}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.subject")}</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        placeholder={t("contact.subjectPlaceholder")}
                        className="bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-card-foreground/70 mb-1.5 block">{t("contact.message")}</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={5}
                        placeholder={t("contact.messagePlaceholder")}
                        className="bg-background"
                      />
                    </div>

                    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("contact.sending")}
                        </>
                      ) : (
                        t("contact.sendMessageBtn")
                      )}
                    </Button>

                    <p className="text-xs text-card-foreground/50 text-center">
                      {t("contact.privacyNotice")}
                    </p>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 lg:py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">{t("contact.quickAnswers")}</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                {t("contact.faqTitle")}
              </h2>
            </motion.div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background p-6 rounded-xl shadow-card border border-border/30"
                >
                  <h4 className="font-heading font-semibold text-foreground mb-2">{t(faq.qKey)}</h4>
                  <p className="text-sm text-muted-foreground">{t(faq.aKey)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
