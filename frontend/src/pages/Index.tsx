import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
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
