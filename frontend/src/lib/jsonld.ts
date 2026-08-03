/**
 * Reusable JSON-LD structured data helpers for rich search results.
 *
 * Usage:
 *   import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
 *   <SEOHead ...>
 *     <script type="application/ld+json">
 *       {JSON.stringify({ "@graph": [organizationLd, webPageLd, breadcrumbListLd] })}
 *     </script>
 *   </SEOHead>
 */

const BASE_URL = "https://bootskills.com";

// ─── Organization Schema ────────────────────────────────────────────────

export interface OrganizationLD {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  foundingDate?: string;
  founder?: Array<{ "@type": "Person"; name: string }>;
  address?: { "@type": "PostalAddress"; addressLocality: string; addressCountry: string };
  sameAs?: string[];
  contactPoint?: { "@type": "ContactPoint"; telephone: string; contactType: string; email: string };
}

export const organizationLd: OrganizationLD = {
  "@type": "Organization",
  name: "Bootskills",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  description: "Bootskills is Rwanda's leading practical training platform offering courses, internships, and real-world project experience across technology, business, and creative fields.",
  foundingDate: "2024",
  founder: [
    { "@type": "Person", name: "Manzi Alain Patrick Munyeshuri" },
    { "@type": "Person", name: "KALISA Jonathan" },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kigali",
    addressCountry: "RW",
  },
  sameAs: [
    "https://twitter.com/bootskills",
    "https://linkedin.com/company/bootskills",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+250-790-706-170",
    contactType: "customer support",
    email: "info@bootskills.com",
  },
};

// ─── WebPage Schema ─────────────────────────────────────────────────────

export interface WebPageLD {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  image?: string;
  breadcrumb?: { "@type": "BreadcrumbList"; itemListElement: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> };
  isPartOf?: { "@type": "WebSite"; name: string; url: string };
  about?: string;
  dateModified?: string;
}

export function webPageLd(name: string, description: string, url: string, options?: { image?: string; about?: string }): WebPageLD {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    image: options?.image,
    about: options?.about,
    isPartOf: {
      "@type": "WebSite",
      name: "Bootskills",
      url: BASE_URL,
    },
  };
}

// ─── BreadcrumbList Schema ──────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface BreadcrumbListLD {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{ "@type": "ListItem"; position: number; name: string; item: string }>;
}

export function breadcrumbListLd(items: BreadcrumbItem[]): BreadcrumbListLD {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.item}`,
    })),
  };
}

// ─── Person (Trainer / Teacher / Mentor) Schema ───────────────────────────

export interface PersonLD {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  url: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  knowsAbout?: string[];
  sameAs?: string[];
  address?: { "@type": "PostalAddress"; addressLocality?: string; addressCountry: string };
  worksFor?: { "@type": "Organization"; name: string; sameAs: string };
  award?: string[];
}

export function personLd(
  name: string,
  url: string,
  options: {
    image?: string;
    jobTitle?: string;
    description?: string;
    knowsAbout?: string[];
    sameAs?: string[];
    location?: string;
    worksForName?: string;
    awards?: string[];
  }
): PersonLD {
  const sameAs = (options.sameAs || []).filter(Boolean);
  const person: PersonLD = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    ...(options.image ? { image: options.image } : {}),
    ...(options.jobTitle ? { jobTitle: options.jobTitle } : {}),
    ...(options.description ? { description: options.description.substring(0, 250) } : {}),
    ...(options.knowsAbout?.length ? { knowsAbout: options.knowsAbout } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(options.location
      ? {
          address: {
            "@type": "PostalAddress" as const,
            addressLocality: options.location.split(",")[0].trim(),
            addressCountry: "RW",
          },
        }
      : {}),
    ...(options.worksForName
      ? { worksFor: { "@type": "Organization" as const, name: options.worksForName, sameAs: BASE_URL } }
      : {}),
    ...(options.awards?.length ? { award: options.awards } : {}),
  };
  return person;
}

// ─── ItemList (e.g. trainers/teachers listing) Schema ──────────────────────

export interface ItemListLD {
  "@context": "https://schema.org";
  "@type": "ItemList";
  name?: string;
  description?: string;
  itemListElement: Array<{ "@type": "ListItem"; position: number; name: string; url?: string; image?: string }>;
}

export function itemListLd(
  items: Array<{ name: string; url?: string; image?: string }>,
  options?: { name?: string; description?: string }
): ItemListLD {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options?.name,
    description: options?.description,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      image: item.image,
    })),
  };
}

// ─── Course Schema ───────────────────────────────────────────────────────

export interface CourseLD {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  url: string;
  image?: string;
  provider: { "@type": "Organization"; name: string; sameAs: string };
  offers: { "@type": "Offer"; price: number; priceCurrency: string; availability: string; url: string };
  educationalLevel?: string;
  author?: { "@type": "Person"; name: string };
  inLanguage?: string;
}

export function courseLd(
  name: string,
  description: string,
  url: string,
  options: {
    image?: string;
    providerName?: string;
    price?: number;
    priceCurrency?: string;
    level?: string;
    instructorName?: string;
    school?: string;
  }
): CourseLD {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description: description.substring(0, 300),
    url,
    image: options.image,
    provider: {
      "@type": "Organization",
      name: options.providerName || options.school || "Bootskills Academy",
      sameAs: BASE_URL,
    },
    offers: {
      "@type": "Offer",
      price: options.price ?? 0,
      priceCurrency: options.priceCurrency || "USD",
      availability: options.price === 0 ? "https://schema.org/Free" : "https://schema.org/InStock",
      url,
    },
    educationalLevel: options.level || "Beginner",
    author: {
      "@type": "Person",
      name: options.instructorName || "Bootskills Instructor",
    },
    inLanguage: "en-RW",
  };
}
