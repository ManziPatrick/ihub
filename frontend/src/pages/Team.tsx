import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Linkedin, Mail, Github, Twitter } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getApiBaseUrl } from "@/lib/env";
import { Helmet } from "react-helmet-async";

interface TeamMember {
    _id: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    socialLinks: {
        linkedin?: string;
        twitter?: string;
        github?: string;
        email?: string;
    };
}

const API_BASE_URL = getApiBaseUrl();

export default function Team() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/team`);
                if (response.ok) {
                    const data = await response.json();
                    setTeamMembers(data);
                }
            } catch (error) {
                console.error("Error fetching team:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeam();
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-background">
                <Helmet>
                    <title>Our Team | Bootskills - Meet the Innovators in Kigali, Rwanda</title>
                    <meta name="description" content="Meet the passionate professionals building the future of tech education in Africa. Our team at Bootskills is led by founder Manzi Alain Patrick Munyeshuri and co-founder Bizimana Eric." />
                    <link rel="canonical" href="https://bootskills.com/team" />
                    <meta property="og:title" content="Our Team | Bootskills - Meet the Innovators" />
                    <meta property="og:description" content="Meet the passionate professionals building the future of tech education in Africa at Bootskills." />
                    <meta property="og:url" content="https://bootskills.com/team" />
                    <meta property="og:type" content="website" />
                    <meta name="geo.region" content="RW-01" />
                    <meta name="geo.placename" content="Kigali" />
                    <meta name="geo.position" content="-1.9441;30.0619" />
                </Helmet>
                <Header />
                <main className="pt-20">
                    <div className="bg-gradient-to-br from-background via-background to-accent/5">
                        {/* Hero Section */}
                        <section className="relative py-16 lg:py-24 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />

                            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="text-center max-w-3xl mx-auto"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="inline-block mb-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/30 backdrop-blur-sm"
                                    >
                                        <span className="text-sm font-medium bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                                            Our Amazing Team
                                        </span>
                                    </motion.div>

                                    <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                        Meet the Innovators
                                    </h1>
                                    <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                                        Passionate professionals building the future of tech education in Africa
                                    </p>
                                </motion.div>
                            </div>
                        </section>

                        {/* Team Grid */}
                        <section className="pb-20 lg:pb-28">
                            <div className="container mx-auto px-4 lg:px-8">
                                {loading ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
                                        <p className="mt-4 text-muted-foreground">Loading team members...</p>
                                    </div>
                                ) : teamMembers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground">No team members found. Check back soon!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {teamMembers.map((member, index) => (
                                            <motion.div
                                                key={member._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                                className="group"
                                            >
                                                <div className="relative h-full">
                                                    {/* Neon glow effect */}
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent via-purple-500 to-accent rounded-2xl opacity-0 group-hover:opacity-75 blur-sm transition-all duration-500" />

                                                    {/* Card */}
                                                    <div className="relative h-full bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/30 group-hover:border-accent/50 transition-all duration-500">
                                                        {/* Holographic overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                        {/* Animated gradient orb */}
                                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-accent/30 to-purple-500/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />

                                                        {/* Image */}
                                                        <div className="relative aspect-square overflow-hidden">
                                                            {/* Gradient mesh overlay */}
                                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] z-10" />

                                                            <img
                                                                src={member.image || "https://via.placeholder.com/200"}
                                                                alt={member.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />

                                                            {/* Dark gradient bottom */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-20" />

                                                            {/* Social icons overlay - appears on hover */}
                                                            <div className="absolute inset-0 z-30 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/60 backdrop-blur-sm">
                                                                {member.socialLinks?.linkedin && (
                                                                    <motion.a
                                                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        href={member.socialLinks.linkedin}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0077B5] to-[#005885] flex items-center justify-center text-white shadow-lg shadow-[#0077B5]/50 hover:shadow-[#0077B5]/70 transition-all"
                                                                        aria-label="LinkedIn"
                                                                    >
                                                                        <Linkedin size={14} />
                                                                    </motion.a>
                                                                )}
                                                                {member.socialLinks?.twitter && (
                                                                    <motion.a
                                                                        whileHover={{ scale: 1.15, rotate: -5 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        href={member.socialLinks.twitter}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1DA1F2] to-[#0d8bd9] flex items-center justify-center text-white shadow-lg shadow-[#1DA1F2]/50 hover:shadow-[#1DA1F2]/70 transition-all"
                                                                        aria-label="Twitter"
                                                                    >
                                                                        <Twitter size={14} />
                                                                    </motion.a>
                                                                )}
                                                                {member.socialLinks?.github && (
                                                                    <motion.a
                                                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        href={member.socialLinks.github}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#333] to-[#181717] flex items-center justify-center text-white shadow-lg shadow-gray-500/50 hover:shadow-gray-500/70 transition-all"
                                                                        aria-label="GitHub"
                                                                    >
                                                                        <Github size={14} />
                                                                    </motion.a>
                                                                )}
                                                                {member.socialLinks?.email && (
                                                                    <motion.a
                                                                        whileHover={{ scale: 1.15, rotate: -5 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        href={`mailto:${member.socialLinks.email}`}
                                                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white shadow-lg shadow-accent/50 hover:shadow-accent/70 transition-all"
                                                                        aria-label="Email"
                                                                    >
                                                                        <Mail size={14} />
                                                                    </motion.a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Compact Content */}
                                                        <div className="relative p-4 space-y-1.5">
                                                            <h3 className="text-sm font-heading font-bold text-card-foreground group-hover:text-accent transition-colors duration-300 truncate">
                                                                {member.name}
                                                            </h3>
                                                            <p className="text-[10px] font-semibold text-accent/80 uppercase tracking-wide truncate">
                                                                {member.role}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 min-h-[3rem]">
                                                                {member.bio}
                                                            </p>
                                                        </div>

                                                        {/* Bottom accent line */}
                                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
                <Footer />
            </div>
        </PageTransition>
    );
}
