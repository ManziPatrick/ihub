import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, Youtube, Download, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface GraduationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    internship: any;
}

export function GraduationDialog({ open, onOpenChange, internship }: GraduationDialogProps) {

    useEffect(() => {
        if (open) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [open]);

    if (!internship) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-golden bg-card shadow-2xl">
                <div className="relative">
                    {/* Top Banner */}
                    <div className="h-32 bg-gold/10 flex items-center justify-center relative overflow-hidden">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="relative z-10"
                        >
                            <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center shadow-lg ring-8 ring-gold/20">
                                <GraduationCap className="w-10 h-10 text-white" />
                            </div>
                        </motion.div>
                        {/* Background elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gold rounded-full blur-3xl animate-pulse delay-700" />
                        </div>
                    </div>

                    <div className="p-8 text-center space-y-6">
                        <div className="space-y-2">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-3xl font-heading font-bold text-foreground"
                            >
                                Congratulations, {internship.userId?.username || "Scholar"}!
                            </motion.h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                You have successfully completed your {internship.title} internship at IHUB Academy.
                                You've proved your technical competence and professional growth.
                            </p>
                        </div>

                        {/* Video Section */}
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                            <h4 className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
                                <Youtube className="w-4 h-4" />
                                Congratulations Video
                            </h4>
                            <div className="aspect-video rounded-xl bg-black flex items-center justify-center group cursor-pointer relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1523240715639-997813d1bd32?q=80&w=2070&auto=format&fit=crop"
                                    alt="Celebration"
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"
                                />
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-900/40 group-hover:scale-110 transition-transform">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                            <Youtube className="w-6 h-6 fill-current" />
                                        </motion.div>
                                    </div>
                                    <span className="text-xs font-bold text-white uppercase tracking-tighter">Watch Message</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button variant="gold" className="h-12 gap-2 shadow-xl shadow-gold/20">
                                <Download className="w-4 h-4" />
                                Get My Certificate
                            </Button>
                            <Button variant="outline" className="h-12 gap-2">
                                <Share2 className="w-4 h-4" />
                                Add to LinkedIn
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] mb-4">Post-Internship Path</h4>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                    <Award className="w-5 h-5 text-accent" />
                                    <span className="text-[9px] font-bold">Job Portal</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                    <span className="text-[9px] font-bold">Makers Space</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                    <CheckCircle2 className="w-5 h-5 text-accent" />
                                    <span className="text-[9px] font-bold">Mentorship</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
