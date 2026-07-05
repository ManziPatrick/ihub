import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { Loader2, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { getGraphqlUrl } from "@/lib/env";

export default function ResetPassword() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            // Use the GRAPHQL_URL from environment or fallback
            const graphqlUrl = getGraphqlUrl();

            const response = await fetch(graphqlUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
            mutation ResetPassword($token: String!, $newPassword: String!) {
              resetPassword(token: $token, newPassword: $newPassword)
            }
          `,
                    variables: {
                        token,
                        newPassword: password
                    }
                }),
            });

            const data = await response.json();

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            setIsSuccess(true);
            toast.success(t("auth.passwordResetSuccess", "Password reset successfully!"));

            // Redirect after a delay
            setTimeout(() => {
                navigate("/auth");
            }, 3000);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <>
        <SEOHead
          title="Reset Password"
          description="Reset your Bootskills account password securely."
        >
          <meta name="robots" content="noindex, nofollow" />
        </SEOHead>
        {!token ? (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
                    <p className="text-muted-foreground mb-6">This password reset link is invalid or missing.</p>
                    <Link to="/auth">
                        <Button>Go to Login</Button>
                    </Link>
                </div>
            </div>
        ) : isSuccess ? (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-sm border border-border text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Password Reset Complete</h1>
                    <p className="text-muted-foreground mb-8">
                        Your password has been successfully reset. You can now log in with your new password.
                    </p>
                    <Link to="/auth">
                        <Button className="w-full">
                            Proceed to Login
                        </Button>
                    </Link>
                </div>
            </div>
        ) : (
            <div className="min-h-screen bg-background flex items-center justify-center p-4 bg-muted/20">
            <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-sm border border-border">
                <Link
                    to="/auth"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        Enter your new password below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <PasswordInput
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-10"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>
            </div>
        </div>
        )}
      </>
    );
}
