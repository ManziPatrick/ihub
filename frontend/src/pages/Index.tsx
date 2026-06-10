import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { CTASection } from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Bootskills | #1 Tech & Business Training in Kigali, Rwanda — Practical Skills. Real Projects.</title>
        <meta name="description" content="Bootskills is Rwanda's leading practical training platform in Kigali — offering tech, business & financial literacy courses, AI development, and real-world internships. Learn skills that land jobs." />
        <link rel="canonical" href="https://bootskills.com" />
        <meta property="og:title" content="Bootskills | #1 Tech & Business Training in Kigali, Rwanda" />
        <meta property="og:description" content="Rwanda's leading practical training platform. Learn tech, business & financial literacy with real-world projects and internships in Kigali." />
        <meta property="og:url" content="https://bootskills.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Bootskills | #1 Tech & Business Training in Kigali, Rwanda" />
        <meta name="twitter:description" content="Learn practical tech & business skills with real-world projects. Based in Kigali, Rwanda." />
        <meta name="geo.region" content="RW-01" />
        <meta name="geo.placename" content="Kigali" />
        <meta name="geo.position" content="-1.9441;30.0619" />
        <meta name="ICBM" content="-1.9441, 30.0619" />
      </Helmet>
      <Header />
      <main className="flex-1 overflow-x-hidden">
        {/* 1. Integrated Hero search + Programs/Internships filtering */}
        <FeaturedCourses />
        {/* 2. Simple call-to-action */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
