import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, Mail, Phone, Home, LogIn, AlertTriangle, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/components/BrandingProvider";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";

const AccountSuspended = () => {
  const { branding } = useBranding();
  const { t } = useTranslation();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";

  const supportEmail = t("portal.supportEmail") || "support@bootskills.com";
  const supportPhone = t("portal.supportPhone") || "+250 784 086 021";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="max-w-xl w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center">
              <Logo variant="full" imgHeight="h-14" />
            </Link>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center relative z-10 border border-red-500/20">
                <ShieldAlert className="w-12 h-12 text-red-500" />
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-9 h-9 bg-black border border-red-500/30 rounded-lg flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </motion.div>
            </div>
          </div>

          <h1 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t("suspendedAccount.title") || "Your Account Has Been Suspended"}
          </h1>

          <div className="h-1.5 w-24 bg-red-500 mx-auto rounded-full mb-8" />

          <p className="text-xl text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
            {t("suspendedAccount.message") ||
              `We're sorry, but your ${branding.siteName} account has been suspended. You will not be able to sign in until this is resolved.`}
          </p>

          {email && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm text-foreground mb-10">
              <span className="text-muted-foreground">{t("suspendedAccount.accountLabel") || "Account"}:</span>
              <strong>{email}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
            <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl">
              <Headset className="w-6 h-6 text-red-500 mb-3" />
              <h3 className="font-semibold mb-2">{t("suspendedAccount.whatNow") || "What happens now?"}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {t("suspendedAccount.whatNowDesc") ||
                  "Your access has been restricted. If you believe this is a mistake, please contact our support team and we'll review your account."}
              </p>
              <Button asChild variant="destructive" className="w-full">
                <a href={`mailto:${supportEmail}?subject=${encodeURIComponent("Account Suspended - Requesting Review")}&body=${encodeURIComponent(`Hi ${branding.siteName} Support,\n\nMy account (${email}) has been suspended. Please review and help me regain access.\n\nThank you.`)}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  {t("suspendedAccount.contactSupport") || "Contact Support"}
                </a>
              </Button>
            </div>

            <div className="bg-accent/5 border border-border/50 p-6 rounded-xl">
              <Mail className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{t("suspendedAccount.contactInfo") || "Support Team"}</h3>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0 text-primary" />
                  <a href={`mailto:${supportEmail}`} className="hover:text-foreground transition-colors">{supportEmail}</a>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0 text-primary" />
                  <a href={`tel:${supportPhone.replace(/[^+\d]/g, "")}`} className="hover:text-foreground transition-colors">{supportPhone}</a>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <a href="https://wa.me/250784086021" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">WhatsApp {supportPhone}</a>
                </div>
              </div>
              <Button variant="outline" className="w-full border-primary/20" asChild>
                <Link to="/contact">
                  {t("suspendedAccount.contactPage") || "Visit Contact Page"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/auth">
                <LogIn className="w-4 h-4" />
                {t("suspendedAccount.tryAgain") || "Try Signing In Again"}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                {t("suspendedAccount.backHome") || "Back to Home"}
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 {branding.siteName} — Building Africa's Tech Talent.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSuspended;
