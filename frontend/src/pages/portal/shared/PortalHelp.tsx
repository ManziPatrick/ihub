import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  MessageSquare,
  Book,
  Video,
  Search,
  Mail,
  Phone,
  Clock,
  Send,
  ExternalLink,
} from "lucide-react";

const faqs = [
  {
    question: "How do I enroll in a course?",
    answer: "Navigate to the 'My Courses' section, browse available courses, and click 'Enroll' on your desired course. Some courses require payment, while others offer free lessons."
  },
  {
    question: "How does the free trial work?",
    answer: "Each paid course offers 2 free lessons so you can preview the content before enrolling. After completing the free lessons, you'll need to pay to access the full course."
  },
  {
    question: "How do I qualify for an internship?",
    answer: "Complete at least 80% of your enrolled course, pass all challenges, and submit your final project. Once eligible, you can apply for internship placement with a 20,000 RWF fee. Upload your payment proof and wait for admin approval before starting."
  },
  {
    question: "How do I get a certificate?",
    answer: "Certificates are automatically generated when you complete all course requirements: 100% of lessons, all challenges passed, and final project approved."
  },
  {
    question: "How do I contact my mentor?",
    answer: "Visit the 'Support' section in your portal to request help, schedule office hours, or book a one-on-one session with your assigned mentor."
  },
];

const resources = [
  { title: "Getting Started Guide", type: "article", icon: Book },
  { title: "Platform Walkthrough", type: "video", icon: Video },
  { title: "Course Completion Tips", type: "article", icon: Book },
  { title: "Internship Preparation", type: "video", icon: Video },
];

export default function PortalHelp() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    console.log("Sending message:", message);
    setMessage("");
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
            {t("portal.helpSupport")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("portal.helpDesc")}
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("portal.searchHelp")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent" />
                    {t("portal.faq")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-card-foreground/70">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    {t("portal.sendMessage")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input placeholder="What do you need help with?" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Describe your issue or question in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button variant="gold" onClick={handleSubmit}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-heading">                    {t("portal.contactInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-card-foreground/60">Email</p>
                      <p className="text-card-foreground">support@bootskills.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-card-foreground/60">Phone / WhatsApp</p>
                      <a href="tel:+250784086021" className="text-card-foreground hover:underline">+250 784 086 021</a>
                      <a href="https://wa.me/250784086021" target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline block">Open WhatsApp</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-card-foreground/60">Support Hours</p>
                      <p className="text-card-foreground">Mon-Fri, 8AM-6PM CAT</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-heading">                    {t("portal.helpfulResources")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resources.map((resource, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <resource.icon className="w-5 h-5 text-accent" />
                        <span className="text-sm text-card-foreground">{resource.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{resource.type}</Badge>
                        <ExternalLink className="w-4 h-4 text-card-foreground/40" />
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
