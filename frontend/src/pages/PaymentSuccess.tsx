import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const { width, height } = useWindowSize();
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Optionally verify session ID with backend here
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
            <Helmet>
                <title>Payment Successful | Bootskills - Kigali, Rwanda</title>
                <meta name="description" content="Your payment was successful. You can now access your enrolled courses and start learning with Bootskills." />
                <meta name="robots" content="noindex" />
            </Helmet>
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2560&auto=format&fit=crop')] bg-cover bg-center opacity-5" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardContent className="p-8 flex flex-col items-center text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </motion.div>

                        <h1 className="text-3xl font-heading font-medium text-foreground mb-2">Payment Successful!</h1>
                        <p className="text-muted-foreground mb-8">
                            Thank you for your purchase. Your enrollment has been confirmed and you can now access your course.
                        </p>

                        <div className="w-full space-y-3">
                            <Link to="/portal/student/dashboard" className="w-full block">
                                <Button className="w-full" variant="gold">
                                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <Link to="/courses" className="w-full block">
                                <Button variant="outline" className="w-full">
                                    Browse More Courses
                                </Button>
                            </Link>
                        </div>

                        {sessionId && (
                            <p className="mt-6 text-xs text-muted-foreground/50 font-mono">
                                Transaction ID: {sessionId.slice(-8)}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
