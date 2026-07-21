import { Helmet } from "react-helmet-async";
import i18n from "@/lib/i18n";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  author?: string;
  children?: React.ReactNode;
}

const DEFAULT_OG_IMAGE = "https://bootskills.com/og-image.png";
const SITE_NAME = "Bootskills";
const BASE_URL = "https://bootskills.com";

// Map internal i18n codes → ISO 639-1 codes (Google-recognized)
const LANG_MAP: Record<string, string> = {
  en: "en",
  fr: "fr",
  kin: "rw",
};

// All supported hreflang codes (ISO 639-1)
const HREFLANG_CODES = ["en", "fr", "rw"];

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  keywords,
  author = "Bootskills",
  children,
}: SEOHeadProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = canonicalUrl || BASE_URL;

  // Resolve current language to ISO 639-1 for <html lang> and og:locale
  const currentLang = i18n.resolvedLanguage || "en";
  const htmlLang = LANG_MAP[currentLang] || "en";

  return (
    <Helmet>
      {/* HTML lang attribute */}
      <html lang={htmlLang} />

      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-snippet:200, max-image-preview:large" />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* ─── Hreflang — Multilingual Alternates ──────────────────── */}
      {/* x-default tells Google this page is the fallback for all languages */}
      <link rel="alternate" hrefLang="x-default" href={url} />
      {HREFLANG_CODES.map((code) => (
        <link key={code} rel="alternate" hrefLang={code} href={url} />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={`${htmlLang}_RW`} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@bootskills" />

      {/* Geo tags for local SEO */}
      <meta name="geo.region" content="RW-01" />
      <meta name="geo.placename" content="Kigali" />
      <meta name="geo.position" content="-1.9441;30.0619" />
      <meta name="ICBM" content="-1.9441, 30.0619" />

      {children}
    </Helmet>
  );
}
