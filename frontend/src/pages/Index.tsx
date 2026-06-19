import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { CTASection } from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Bootskills | Your All-in-One Learning Hub — Courses Across Every Field. Projects. Internships.</title>
        <meta name="description" content="Bootskills is your all-in-one learning hub — offering courses across every field: tech, business, healthcare, finance, education, AI, project management, and more. Learn with real projects and industry internships." />
        <link rel="canonical" href="https://bootskills.com" />
        <meta property="og:title" content="Bootskills | Your All-in-One Learning Hub — Courses Across Every Field" />
        <meta property="og:description" content="Your all-in-one learning hub. Courses across every field — real projects, industry internships, and career support." />
        <meta property="og:url" content="https://bootskills.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Bootskills | Your All-in-One Learning Hub — Courses Across Every Field" />
        <meta name="twitter:description" content="Courses across every field with real projects and industry internships." />
        <meta name="geo.region" content="RW-01" />
        <meta name="geo.placename" content="Kigali" />
        <meta name="geo.position" content="-1.9441;30.0619" />
        <meta name="ICBM" content="-1.9441, 30.0619" />
      </Helmet>
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
