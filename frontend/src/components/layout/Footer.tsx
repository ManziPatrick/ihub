import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-background py-8 border-t border-border/40 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 order-2 md:order-1">
            <LanguageSwitcher />
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm text-muted-foreground font-medium order-1 md:order-2">
            <Link to="/company-profile" className="hover:text-foreground transition-colors">
              {t("footer.about")}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {t("footer.support")}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {t("footer.faq")}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {t("footer.accessibility")}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-muted-foreground/60">
          &copy; {new Date().getFullYear()} Bootskills. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
