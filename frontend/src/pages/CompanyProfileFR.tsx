import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Target, Lightbulb, Shield, Heart, Award, Users, Globe,
  GraduationCap, Briefcase, Laptop, Cpu, Code, Database,
  Wifi, BookOpen, Building2, CheckCircle, ArrowRight,
  Quote, MapPin, TrendingUp, Sparkles, Star, FileText, Scan,
  Rocket, ChevronLeft, ChevronRight, Brain, Zap,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

// ─── Données ────────────────────────────────────────────────────────────────

const values = [
  { icon: Shield, title: "Excellence", description: "Offrir la plus haute qualité dans tous nos programmes de formation et solutions technologiques" },
  { icon: Heart, title: "Intégrité", description: "Être honnête et transparent dans toutes nos interactions avec les étudiants, partenaires et clients" },
  { icon: Brain, title: "Innovation Boostée par l'IA", description: "Une approche IA-first sur toute notre plateforme — des recommandations intelligentes aux assistants d'apprentissage" },
  { icon: Award, title: "Apprentissage Pratique", description: "Une formation pratique et orientée vers l'industrie qui vous prépare aux défis du monde réel" },
  { icon: Users, title: "Impact Communautaire", description: "Créer un changement positif durable dans les communautés à travers l'Afrique" },
  { icon: Globe, title: "Normes Internationales", description: "Un programme aligné sur les normes et exigences mondiales de l'industrie" },
];

const achievements = [
  { number: "250+", label: "Stagiaires Formés", icon: Users },
  { number: "15+", label: "Projets Réalisés", icon: Briefcase },
  { number: "10+", label: "Solutions IA Développées", icon: Cpu },
  { number: "100%", label: "Focus Pratique", icon: Target },
  { number: "1 000+", label: "Apprenants Formés", icon: GraduationCap },
  { number: "20+", label: "Catégories de Cours", icon: BookOpen },
  { number: "5 000+", label: "Certifiés Cyber Sûreté", icon: Shield },
];

const servicesForIndividuals = [
  {
    icon: Code,
    title: "Développement Logiciel",
    description: "Applications web et mobiles, du frontend au backend. Apprenez React, Node.js, Python et bien plus grâce à des projets pratiques.",
    features: ["HTML/CSS, JavaScript, React, Vue.js", "Node.js, Python, PHP, Java", "Mobile : React Native, Flutter", "Git & GitHub, bases DevOps"]
  },
  {
    icon: Database,
    title: "Data Science & IA",
    description: "Maîtrisez l'analyse de données, le machine learning et l'IA. Construisez des modèles qui résolvent de vrais problèmes.",
    features: ["Python pour la Data Science", "Machine Learning & Deep Learning", "NLP & Vision par Ordinateur", "Big Data : Spark, Hadoop"]
  },
  {
    icon: Wifi,
    title: "IoT & Systèmes Intelligents",
    description: "Construisez des appareils connectés et des solutions d'automatisation pour l'agriculture, l'industrie et la maison.",
    features: ["Arduino & Raspberry Pi", "Intégration de capteurs", "Protocoles MQTT & IoT", "Plateformes IoT Cloud"]
  },
  {
    icon: Shield,
    title: "Cyber-Littératie & Sécurité Numérique",
    description: "Formation complète en cyber-littératie — sécurité en ligne, détection des menaces, protection des données et habitudes numériques sûres.",
    features: ["Sécurité en ligne & détection des menaces", "Reconnaissance d'arnaques & phishing", "Protection des données & vie privée", "Navigation sécurisée & réseaux sociaux", "Initiation à la réponse aux incidents", "Contrôles parentaux de sécurité"]
  },
  {
    icon: BookOpen,
    title: "Compétences Numériques & Bureautique",
    description: "Compétences numériques essentielles pour le monde moderne — des outils bureautiques à la productivité avancée.",
    features: ["Suite Microsoft Office", "Google Workspace", "Marketing digital", "Outils de travail collaboratif à distance"]
  },
  {
    icon: Briefcase,
    title: "Stages & Parcours Professionnels",
    description: "Des stages en ligne structurés où vous travaillez sur des projets réels sous un encadrement professionnel.",
    features: ["Mise en relation avec des entreprises", "Apprentissage par projet", "Coaching de carrière", "Préparation CV & portfolio"]
  },
  {
    icon: TrendingUp,
    title: "Commerce & Finance",
    description: "Compétences pratiques en affaires, éducation financière et entrepreneuriat pour les futurs leaders.",
    features: ["Gestion d'entreprise", "Éducation financière", "Entrepreneuriat", "Gestion de projet"]
  },
  {
    icon: Star,
    title: "Programmes Enfants & Juniors",
    description: "Cours adaptés à l'âge pour initier les enfants et adolescents au code, à la littératie numérique, à la sécurité en ligne et aux technologies créatives.",
    features: ["Initiation au code dès 8-16 ans", "Internet sûr & citoyenneté numérique", "Tech créative : animation, game design", "Cyber-littératie junior", "Parcours supervisés par les parents", "Projets STEM amusants & défis"]
  },
];

const servicesForOrganizations = [
  {
    icon: Laptop,
    title: "Développement Logiciel & IA",
    description: "Solutions web, mobiles et IA sur mesure pour startups et systèmes d'entreprise.",
    offerings: ["Développement web & mobile", "Chatbots & assistants IA", "Analytique prédictive", "Développement & intégration d'API"]
  },
  {
    icon: Cpu,
    title: "IoT & Automatisation",
    description: "Systèmes connectés intelligents pour l'industrie, l'agriculture et les bâtiments intelligents.",
    offerings: ["Solutions agricoles intelligentes", "Automatisation industrielle", "Suivi & surveillance d'actifs", "Solutions pour bâtiments intelligents"]
  },
  {
    icon: FileText,
    title: "Gestion de Projet & Contrats",
    description: "Gestion complète du cycle de vie des projets avec création, numérisation et stockage sécurisé des contrats.",
    offerings: ["Gestion du cycle de vie des projets", "Création & numérisation de contrats", "Archive documentaire sécurisée", "Tableaux de bord clients"]
  },
  {
    icon: Building2,
    title: "Conseil IT & Formation",
    description: "Conseil stratégique en technologie et programmes de formation pour équipes et organisations.",
    offerings: ["Stratégie de transformation digitale", "Programmes de formation en entreprise", "Évaluation de la stack technologique", "Services de migration cloud"]
  },
];const testimonials = [
  {
    quote: "Bootskills m'a aidé à passer de l'apprentissage au développement réel. Le mentorat m'a préparé au monde professionnel.",
    author: "Emmanuel R.",
    role: "Développeur Logiciel",
    company: "TechCorp Rwanda"
  },
  {
    quote: "Le programme Data Science m'a donné des compétences pratiques que j'utilise chaque jour. Les cours en ligne étaient flexibles avec des instructeurs de classe mondiale.",
    author: "Marie Claire M.",
    role: "Analyste de Données",
    company: "FinanceHub Ltd"
  },
  {
    quote: "De la formation au stage jusqu'à l'emploi à temps plein — Bootskills m'a ouvert des portes que je ne savais même pas exister.",
    author: "Jean Paul N.",
    role: "Ingénieur IoT",
    company: "SmartFarm Solutions"
  },
];

const audiences = [
  { icon: GraduationCap, title: "Étudiants & Diplômés", description: "Acquérir les compétences de base pour démarrer une carrière" },
  { icon: Briefcase, title: "Professionnels en Act.", description: "Se perfectionner pour évoluer professionnellement" },
  { icon: Building2, title: "Institutions & Écoles", description: "Programmes de partenariat pour les étudiants" },
  { icon: Heart, title: "ONG & Organisations", description: "Initiatives de développement & formation" },
  { icon: Rocket, title: "Startups & Entreprises", description: "Solutions tech & formation d'équipe" },
  { icon: Globe, title: "Apprenants Ruraux", description: "Éducation en ligne accessible partout" },
  { icon: Shield, title: "Familles & Parents", description: "Sécurité numérique & éducation enfants" },
];

const whyChooseUs = [
  { icon: Brain, title: "Plateforme Boostée par l'IA", description: "Tout le système est propulsé par l'IA — orientation intelligente, tutorat IA, correction automatisée et conseil de carrière" },
  { icon: Award, title: "Programme Aligné sur l'Industrie", description: "Programmes conçus avec les employeurs et les besoins du marché local" },
  { icon: Users, title: "Formateurs Experts", description: "Apprenez auprès de professionnels avec une expérience réelle" },
  { icon: Briefcase, title: "Projets Pratiques", description: "Construisez un portfolio avec des projets concrets" },
  { icon: Globe, title: "Accessible Partout", description: "Formation en ligne accessible dans les villages et les centres urbains" },
  { icon: Star, title: "Accompagnement Emploi", description: "Aide au placement professionnel pour tous les diplômés" },
  { icon: Sparkles, title: "Apprentissage Amélioré par l'IA", description: "Recommandations intelligentes, tuteur IA, revue de code automatisée et parcours personnalisés" },
  { icon: Award, title: "Programmes Certifiés", description: "Certificats de fin de formation reconnus par l'industrie" },
  { icon: Shield, title: "Garantie Cyber Sûreté", description: "Chaque apprenant formé à la sécurité numérique, à la détection des menaces et à la protection des données personnelles" },
];

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ label, title, description }: { label?: string; title: string; description?: string }) {
  return (
    <div className="text-center mb-12 lg:mb-16">
      {label && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full mb-4 uppercase tracking-wider"
        >
          {label}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="font-heading text-2xl lg:text-4xl font-medium text-foreground mb-4"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-sm lg:text-base leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// ─── Fade-In Section Wrapper ───────────────────────────────────────────────

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page Principale ───────────────────────────────────────────────────────

const CompanyProfileFR = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const currentTestimonial = testimonials[testimonialIndex];

  const nextTestimonial = () => setTestimonialIndex(prev => (prev + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bootskills",
    "url": "https://bootskills.com",
    "logo": "https://bootskills.com/logo.svg",
    "description": "Plateforme d'apprentissage tout-en-un — cours dans tous les domaines. Projets. Stages.",
    "foundingDate": "2023",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    },
    "sameAs": ["https://bootskills.com"]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Bootskills | Profil de l'Entreprise — Plateforme d'Apprentissage Tout-en-Un</title>
        <meta name="description" content="Bootskills est votre plateforme d'apprentissage tout-en-un au service de l'Afrique — cours dans tous les domaines, stages en ligne, gestion de projet client et solutions de contrats numériques. Apprenez de n'importe où." />
        <meta property="og:title" content="Bootskills | Profil de l'Entreprise — Plateforme d'Apprentissage Tout-en-Un" />
        <meta property="og:description" content="Cours dans tous les domaines. Stages en ligne. Gestion de projet client. Au service des apprenants urbains et ruraux à travers l'Afrique." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bootskills.com/profil-entreprise" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />

      <main className="pt-14">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECTION HERO */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[85vh] flex items-center bg-gradient-to-b from-card via-background to-background overflow-hidden">
          {/* Fond décoratif */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full border border-accent/5" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full border border-accent/5" />
            <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-accent/20 rounded-full" />
            <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-accent/20 rounded-full" />
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent/10 rounded-full" />
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-[0.03]" viewBox="0 0 800 128">
              <path d="M0,64 L100,64 L120,44 L200,44 L220,64 L400,64 L420,44 L500,44 L520,64 L700,64 L720,44 L800,44" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            </svg>
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10 py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-8"
              >
                <Cpu className="w-4 h-4 text-accent" />
                <span className="text-accent text-xs font-semibold uppercase tracking-wider">Profil d'Entreprise — Propulsé par l'IA</span>
              </motion.div>

              {/* Badge plateforme IA */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4 text-accent text-xs font-semibold"
              >
                <Zap className="w-3.5 h-3.5" />
                PLATEFORME D'APPRENTISSAGE BOOSTÉE PAR L'IA
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6"
              >
                Votre Plateforme
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">d'Apprentissage Tout-en-Un</span>
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto mb-8 leading-relaxed"
              >
                Des cours boostés par l'IA dans tous les domaines. Stages en ligne. Gestion de projet client.
                <br />
                <span className="text-foreground/80 font-medium">Au service des apprenants dans les villages, les zones rurales et les villes — partout où il y a internet.</span>
                <br />
                <span className="text-accent/80 text-base">Cyber-littératie &amp; sécurité numérique pour tous. Programmes dédiés aux enfants &amp; juniors. Éducation financière à chaque étape de la vie.</span>
              </motion.p>

              {/* Boutons CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link to="/explore">
                  <Button variant="gold" size="xl" className="group text-base">
                    Commencer Gratuitement
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="xl" className="text-base border-foreground/20 text-foreground hover:border-accent hover:text-accent">
                    Devenir Partenaire
                  </Button>
                </Link>
              </motion.div>

              {/* Indicateurs de confiance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground"
              >
                {["Enregistré au Rwanda", "Au Service de l'Afrique", "100% Pratique", "Propulsé par l'IA"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STATISTIQUES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-8 bg-card border-y border-border/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {achievements.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="text-center"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="font-heading text-xl lg:text-2xl font-bold text-card-foreground">
                    {item.number}
                  </div>
                  <div className="text-xs text-card-foreground/60 mt-0.5">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NOTRE HISTOIRE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="À Propos"
              title="Notre Histoire"
              description="Comment Bootskills est né — et le problème que nous résolvons."
            />

            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <FadeInSection>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p className="text-base lg:text-lg">
                    Bootskills a été fondé par <strong className="text-foreground">Manzi Alain Patrick Munyeshuri</strong>,
                    un technologue rwandais animé par un défi pressant : le fossé entre l'éducation et l'employabilité.
                  </p>
                  <p className="text-base lg:text-lg">
                    Il a imaginé une plateforme où l'apprentissage est directement connecté à des projets réels, du mentorat
                    et des opportunités de carrière — accessible à toute personne disposant d'une connexion internet, que ce soit
                    à Kigali ou dans un village reculé.
                  </p>
                  <p className="text-base lg:text-lg">
                    Il a ensuite été rejoint par <strong className="text-foreground">KALISA Jonathan</strong>, Co-Fondateur,
                    qui a apporté un leadership opérationnel et technique pour déployer les programmes de formation, les stages
                    et les solutions logicielles à travers l'Afrique de l'Est.
                  </p>
                  <div className="pt-4 flex items-center gap-3 text-accent font-medium">
                    <MapPin className="w-5 h-5" />
                    <span>Basé à Kigali, Rwanda — Au Service de Toute l'Afrique</span>
                  </div>
                </div>
              </FadeInSection>

              <FadeInSection delay={0.2}>
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl p-8 border border-border/30 hover:border-accent/30 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                      <Target className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3">Notre Mission</h3>
                    <p className="text-card-foreground/70 leading-relaxed">
                      Autonomiser les individus et les organisations — que ce soit dans les villages, les zones rurales ou
                      les centres urbains — avec des compétences réelles, une expérience concrète et des solutions numériques
                      intelligentes. Nous éliminons la barrière de la localisation pour que toute personne ayant accès à
                      internet puisse apprendre, grandir et accéder à des opportunités de carrière.
                    </p>
                  </div>

                  <div className="bg-card rounded-2xl p-8 border border-border/30 hover:border-accent/30 transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                      <Lightbulb className="w-7 h-7 text-accent" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-card-foreground mb-3">Notre Vision</h3>
                    <p className="text-card-foreground/70 leading-relaxed">
                      Devenir la principale plateforme africaine d'apprentissage pratique et de croissance professionnelle,
                      à partir du Rwanda avec une expansion mondiale. Un avenir où chaque Africain — indépendamment de sa
                      localisation — a accès à une éducation de classe mondiale, à des projets réels et à des parcours
                      professionnels significatifs.
                    </p>
                  </div>
                </div>
              </FadeInSection>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VALEURS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Nos Valeurs"
              title="Ce Que Nous Défendons"
              description="Six principes fondamentaux qui guident tout ce que nous faisons."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <FadeInSection key={value.title} delay={index * 0.08}>
                  <div className="bg-background rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <value.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* NOS SERVICES — APERÇU */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Nos Services"
              title="Nos Quatre Piliers"
              description="Nous opérons dans quatre domaines clés pour servir à la fois les particuliers et les organisations."
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { icon: GraduationCap, title: "Formation & Cours", description: "Des cours pratiques et adaptés au marché dans tous les domaines — de la tech et des affaires à la santé et aux arts créatifs.", color: "from-blue-500/20 to-blue-600/10" },
                { icon: Briefcase, title: "Stages & Carrières", description: "Des stages en ligne et en présentiel structurés avec des projets réels, du mentorat et du coaching de carrière.", color: "from-emerald-500/20 to-emerald-600/10" },
                { icon: Laptop, title: "Solutions Tech & IA", description: "Des solutions logicielles, IA et IoT sur mesure pour startups, entreprises et organisations gouvernementales.", color: "from-purple-500/20 to-purple-600/10" },
                { icon: FileText, title: "Gestion de Projet & Contrats", description: "Gestion de cycle de vie des projets avec numérisation de contrats et stockage sécurisé de documents.", color: "from-amber-500/20 to-amber-600/10" },
              ].map((pillar, index) => (
                <FadeInSection key={pillar.title} delay={index * 0.1}>
                  <div className="bg-card rounded-2xl overflow-hidden border border-border/30 group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 h-full">
                    <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
                    <div className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                        <pillar.icon className="w-7 h-7 text-accent" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-card-foreground mb-3">{pillar.title}</h3>
                      <p className="text-card-foreground/70 text-sm leading-relaxed">{pillar.description}</p>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* POUR LES PARTICULIERS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Pour les Particuliers"
              title="Formations & Stages"
              description="Apprenez de n'importe où — village, ville ou campagne. Tout ce dont vous avez besoin, c'est d'une connexion internet."
            />

            {/* Bannière d'accessibilité */}
            <FadeInSection>
              <div className="max-w-4xl mx-auto mb-12 bg-background rounded-2xl p-6 border border-accent/20 shadow-gold-glow/5">
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-lg mb-1">Accessible à Tous, Partout</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Tous nos programmes sont disponibles en ligne. Que vous soyez dans un village rural avec une connexion
                      basique ou au centre-ville de Kigali, vous avez accès à la même qualité de formation, de mentorat et
                      d'opportunités de stage. Aucune barrière géographique. Aucune excuse.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {servicesForIndividuals.map((service, index) => (
                <FadeInSection key={service.title} delay={index * 0.06}>
                  <div className="bg-background rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                        <service.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-semibold text-foreground text-sm leading-tight">{service.title}</h3>
                          {service.title === "Data Science & IA" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-full uppercase tracking-wider">
                              <Zap className="w-2.5 h-2.5" />
                              Cœur IA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                    <ul className="space-y-1.5">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground/80">
                          <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection delay={0.3}>
              <div className="text-center mt-10">
                <Link to="/explore">
                  <Button variant="gold" size="lg" className="group">
                    Voir Tous les Programmes
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* POUR LES ORGANISATIONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Pour les Organisations"
              title="Solutions Tech, Gestion de Projet & Contrats"
              description="Du développement logiciel à la numérisation de contrats — nous aidons les organisations à gérer leurs projets de bout en bout."
            />

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {servicesForOrganizations.map((service, index) => (
                <FadeInSection key={service.title} delay={index * 0.1}>
                  <div className="bg-card rounded-xl p-8 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                        <service.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-card-foreground">{service.title}</h3>
                        <p className="text-card-foreground/70 text-sm">{service.description}</p>
                      </div>
                    </div>
                    <ul className="grid grid-cols-2 gap-3">
                      {service.offerings.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-card-foreground/80">
                          <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInSection>
              ))}
            </div>

            {/* Mise en avant — Gestion de projet & contrats */}
            <FadeInSection delay={0.3}>
              <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl p-8 border border-accent/20">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                      Cycle de Vie Complet — De la Proposition à la Livraison
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Les clients peuvent soumettre des propositions de projet, suivre l'avancement via un tableau de bord
                      dédié, signer et numériser des contrats, et gérer les livrables — le tout en un seul endroit.
                      Notre plateforme gère la création de contrats, le stockage sécurisé des documents, le suivi des jalons
                      et la communication transparente entre votre équipe et la nôtre.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Numérisation de contrats
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Archives sécurisées
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        Suivi en temps réel
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.4}>
              <div className="text-center mt-10">
                <Link to="/contact">
                  <Button variant="gold" size="lg" className="group">
                    Demander une Consultation
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeInSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* QUI NOUS SERVONS */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Notre Public"
              title="Qui Nous Servons"
              description="Des apprenants ruraux aux grandes organisations — nous servons tout le monde."
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
              {audiences.map((audience, index) => (
                <FadeInSection key={audience.title} delay={index * 0.08}>
                  <div className="bg-background rounded-xl p-5 text-center h-full border border-border/30 group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 group-hover:-translate-y-1">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <audience.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-heading font-semibold text-foreground text-xs sm:text-sm mb-1 line-clamp-2">
                      {audience.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground/70 leading-tight">
                      {audience.description}
                    </p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* POURQUOI NOUS CHOISIR */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Pourquoi Bootskills"
              title="L'Avantage Bootskills"
              description="Ce qui nous rend différents — et pourquoi les apprenants et les organisations nous choisissent."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {whyChooseUs.map((item, index) => (
                <FadeInSection key={item.title} delay={index * 0.08}>
                  <div className="bg-card rounded-xl p-6 border border-border/30 h-full group hover:border-accent/30 hover:shadow-card-hover transition-all duration-300 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <item.icon className="w-7 h-7 text-accent" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-heading font-bold text-card-foreground mb-2">{item.title}</h3>
                    <p className="text-card-foreground/70 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>



        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TÉMOIGNAGES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <SectionHeader
              label="Témoignages"
              title="Histoires de Réussite"
              description="Écoutez les apprenants qui ont transformé leur carrière grâce à Bootskills."
            />

            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 lg:gap-8">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
                  aria-label="Témoignage précédent"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex-1 relative min-h-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={testimonialIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4 }}
                      className="bg-card rounded-xl p-6 lg:p-8 shadow-card border border-border/30"
                    >
                    <div className="flex flex-col items-center text-center">
                      <Quote className="w-10 h-10 text-accent/30 mb-4" />
                      <p className="text-foreground text-lg lg:text-xl leading-relaxed font-heading italic mb-6">
                        "{currentTestimonial.quote}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground text-sm">{currentTestimonial.author}</p>
                          <p className="text-muted-foreground text-xs">
                            {currentTestimonial.role} — {currentTestimonial.company}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  </AnimatePresence>
                </div>

                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-all duration-300 flex-shrink-0"
                  aria-label="Témoignage suivant"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Points */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTestimonialIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === testimonialIndex
                        ? "bg-accent w-8"
                        : "bg-foreground/20 hover:bg-foreground/40 w-2"
                    }`}
                    aria-label={`Aller au témoignage ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CTA */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-20 lg:py-28 bg-card relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
              <path d="M0,200 L100,200 L120,180 L200,180 L220,200 L400,200 L420,180 L500,180 L520,200 L700,200 L720,180 L800,180" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" />
            </svg>
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <FadeInSection>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-heading text-3xl lg:text-5xl font-bold text-card-foreground mb-6">
                  Prêt à Construire l'Avenir ?
                </h2>
                <p className="text-card-foreground/80 text-lg lg:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
                  Que vous soyez un apprenant souhaitant monter en compétences, une organisation à la recherche de
                  solutions tech, ou un partenaire désireux d'avoir un impact — travaillons ensemble.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/explore">
                    <Button variant="gold" size="xl" className="group text-base">
                      Explorer les Programmes
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="xl" className="text-base border-card-foreground/30 text-card-foreground hover:border-accent hover:text-accent">
                      Contactez-Nous
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CompanyProfileFR;
