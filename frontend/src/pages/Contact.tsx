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

const contactInfo = [
  { icon: MapPin, label: "Address", value: "Kigali, Rwanda" },
  { icon: Mail, label: "Email", value: "info@bootskills.com" },
  { icon: Phone, label: "Phone", value: "+250 790 706 170" },
  { icon: Clock, label: "Office Hours", value: "Monday - Friday: 8:00 AM - 5:00 PM" },
];

const inquiryTypes = [
  { icon: GraduationCap, title: "Training Programs", description: "Questions about our courses, enrollment, and curriculum" },
  { icon: Briefcase, title: "Internships", description: "Inquire about internship opportunities and applications" },
  { icon: Users, title: "Corporate Solutions", description: "Custom training and technology services for organizations" },
  { icon: MessageSquare, title: "General Inquiry", description: "Any other questions or feedback" },
];

const faqs = [
  { q: "How do I enroll in a training program?", a: "You can apply online through our contact form or visit our office in Kigali. Our admissions team will guide you through the process." },
  { q: "Do you offer online classes?", a: "Yes! Most of our programs are available in online, hybrid, and in-person formats to accommodate different preferences and locations." },
  { q: "What payment options are available?", a: "We offer flexible payment plans, including monthly installments. We also partner with scholarship programs for qualified candidates." },
  { q: "Can companies request custom training?", a: "Absolutely! We design tailored training programs for organizations. Contact us with your requirements for a custom proposal." },
];

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    inquiryType: "",
    message: "",
  });

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

      toast.success("Thank you for reaching out! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", phone: "", subject: "", inquiryType: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
                Get in Touch
              </span>
              <h1 className="font-heading text-3xl lg:text-5xl font-medium text-card-foreground mb-6">
                We'd Love to Hear From You
              </h1>
              <p className="text-card-foreground/80 max-w-2xl mx-auto text-lg">
                Whether you're interested in enrolling, partnering, or just want to learn more about
                what we do, we're here to help. Reach out and let's start a conversation.
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
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card p-5 rounded-xl shadow-card border border-border/30 text-center group hover:shadow-card-hover hover:border-accent/30 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-background flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <type.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading font-semibold text-card-foreground text-sm mb-1">{type.title}</h3>
                  <p className="text-xs text-card-foreground/60">{type.description}</p>
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
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-8">
                  Reach out to us directly or fill out the form. We typically respond within 24 hours.
                </p>

                <div className="space-y-6 mb-8">
                  {contactInfo.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center flex-shrink-0 shadow-card">
                        <item.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
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
                      <p className="text-sm text-card-foreground/70">Kigali, Rwanda</p>
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
                    Send Us a Message
                  </h2>
                  <p className="text-sm text-card-foreground/70 mb-6">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>

                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">Full Name *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="John Doe"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">Email Address *</label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@example.com"
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">Phone Number</label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+250 790 706 170"
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-card-foreground/70 mb-1.5 block">Inquiry Type</label>
                        <select
                          value={formData.inquiryType}
                          onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                          <option value="">Select type...</option>
                          <option value="training">Training Programs</option>
                          <option value="internship">Internships</option>
                          <option value="corporate">Corporate Solutions</option>
                          <option value="partnership">Partnership</option>
                          <option value="general">General Inquiry</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-card-foreground/70 mb-1.5 block">Subject *</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        placeholder="What is your inquiry about?"
                        className="bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-card-foreground/70 mb-1.5 block">Message *</label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={5}
                        placeholder="Tell us more about your inquiry..."
                        className="bg-background"
                      />
                    </div>

                    <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>

                    <p className="text-xs text-card-foreground/50 text-center">
                      By submitting this form, you agree to our privacy policy and terms of service.
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
              <span className="text-accent text-sm font-medium uppercase tracking-wider">Quick Answers</span>
              <h2 className="font-heading text-2xl lg:text-3xl font-medium text-card-foreground mt-2">
                Frequently Asked Questions
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
                  <h4 className="font-heading font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
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
