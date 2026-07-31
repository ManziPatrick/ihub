import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEOHead
        title={t("errors.pageNotFound")}
        description={t("errors.pageNotFound")}
      >
        <meta name="robots" content="noindex" />
      </SEOHead>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("errors.pageNotFound")}</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t("errors.goHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
