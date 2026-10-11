import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PublicHero } from "@/components/layout/PublicHero";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Heart, Lightbulb, Users } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";

const values = [
  { icon: Shield, title: "Straight work", line: "We say what we can do, then we do it." },
  { icon: Heart, title: "People first", line: "Learners, partners, and clients — treated like humans." },
  { icon: Lightbulb, title: "Make it real", line: "Projects over slides. Skills you can use Monday." },
  { icon: Users, title: "Open doors", line: "From Kigali to anywhere with an internet connection." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="About"
      description="Bootskills is a small team in Kigali helping people learn by doing — courses, programs, and real projects."
      canonicalUrl="https://bootskills.com/about"
      keywords="about Bootskills, Kigali learning, Africa skills"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            organizationLd,
            webPageLd("About", "Bootskills is a small team in Kigali helping people learn by doing.", "https://bootskills.com/about"),
            breadcrumbListLd([{ name: "Home", item: "/" }, { name: "About", item: "/about" }]),
          ],
        })}
      </script>
    </SEOHead>
    <Header />
    <main className="pt-20">
      <PublicHero
        eyebrow="About"
        title="Learn it. Build it. Use it."
        line="We’re Patrick & Jonathan’s team in Kigali. We close the gap between class and a real job."
        actions={[
          { to: "/explore", label: "See courses", gold: true },
          { to: "/contact?book=1", label: "Book a chat" },
        ]}
      />
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border/40 bg-card p-5">
              <v.icon className="h-5 w-5 text-accent mb-3" />
              <h2 className="font-heading font-semibold">{v.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{v.line}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/team"><Button variant="outline">Meet the people</Button></Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default About;
