import { useTranslation } from "react-i18next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { CTASection } from "@/components/home/CTASection";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";

const jsonldGraph = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    organizationLd,
    webPageLd(
      "Bootskills - Learn. Build. Grow.",
      "Bootskills is your all-in-one learning hub — offering courses across every field: tech, business, healthcare, finance, education, AI, project management, and more. Learn with real projects and industry internships.",
      "https://bootskills.com"
    ),
  ],
});

const Index = () => {
  const { t } = useTranslation();
  const desc = "Bootskills is your all-in-one learning hub — offering courses across every field: tech, business, healthcare, finance, education, AI, project management, and more. Learn with real projects and industry internships.";
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("home.heroTitle")}
        description={desc}
        canonicalUrl="https://bootskills.com"
        ogImageAlt="Bootskills — Practical Training in Kigali, Rwanda"
        keywords="bootskills, online learning, courses, tech training, internships, Kigali, Rwanda, Africa, software development, AI, data science"
      >
        <script type="application/ld+json">{jsonldGraph}</script>
      </SEOHead>
      <Header />
      <main>
        <FeaturedCourses />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
