import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getGraphqlUrl } from "@/lib/env";
import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@apollo/client/react";
import { GOOGLE_LOGIN, VERIFY_2FA, SETUP_2FA, REQUEST_EMAIL_OTP, VERIFY_EMAIL_OTP } from "@/lib/graphql/mutations";
import { LocationSetupDialog } from "@/components/auth/LocationSetupDialog";

type AuthMode = "login" | "signup";

// Detect an "account suspended" rejection from the backend (GraphQL extension code or message)
const isAccountSuspendedError = (error: any): boolean => {
  const gqlErrors = error?.graphQLErrors;
  if (Array.isArray(gqlErrors)) {
    return gqlErrors.some(
      (e: any) =>
        e?.extensions?.code === "ACCOUNT_SUSPENDED" ||
        (typeof e?.message === "string" && e.message.toLowerCase().includes("suspended"))
    );
  }
  return typeof error?.message === "string" && error.message.toLowerCase().includes("suspended");
};

// Best-effort email extraction from a Google ID token payload (for the suspended screen)
const emailFromGoogleToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.email || "";
  } catch {
    return "";
  }
};

export default function Auth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "", phone: "" });

  // Flow State
  const [requires2FA, setRequires2FA] = useState(false);
  const [requires2FASetup, setRequires2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [twoFactorData, setTwoFactorData] = useState<{ qrCodeDataUrl: string, secret: string } | null>(null);
  const [useEmailOTP, setUseEmailOTP] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [onboardingUser, setOnboardingUser] = useState<any>(null);

  // Location setup state
  const [needsLocation, setNeedsLocation] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const { login, signup, user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine where to redirect after login — check location.state first, then ?redirect= query param (for mobile OAuth)
  const redirectParam = new URLSearchParams(location.search).get("redirect");
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectParam || "/portal/student";

  const [googleLoginMutation] = useMutation(GOOGLE_LOGIN);
  const [verify2FAMutation] = useMutation(VERIFY_2FA);
  const [setup2FAMutation] = useMutation(SETUP_2FA);
  const [requestEmailOTPMutation] = useMutation(REQUEST_EMAIL_OTP);
  const [verifyEmailOTPMutation] = useMutation(VERIFY_EMAIL_OTP);

  // If redirected from GoogleOneTap with 2FA required, auto-trigger the 2FA flow
  useEffect(() => {
    const state = location.state as { email?: string; from2FA?: boolean } | null;
    if (state?.from2FA && state.email) {
      setFormData(prev => ({ ...prev, email: state.email! }));
      setRequires2FA(true);
      setUseEmailOTP(true);
      toast.info("Two-Factor Authentication Required — check your email for the verification code");
    }
  }, [location.state]);

  if (user && !needsLocation) {
    // Already logged in and landed on /auth — redirect back (login handlers call their own navigate)
    const roleRedirects: Record<string, string> = { 
      student: "/portal/student", 
      trainer: "/portal/trainer", 
      admin: "/portal/admin", 
      super_admin: "/portal/super-admin" 
    };
    return <Navigate to={from || roleRedirects[user.role] || "/portal/student"} replace />;
  }

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      if (!token) throw new Error("No credential received from Google");
      setIsLoading(true);
      const { data } = await googleLoginMutation({ variables: { token } });
      const result = (data as any)?.googleLogin;

      if (!result) {
        throw new Error("No response from server — please ensure the backend is running");
      }

      // Check if 2FA is required (Email 2FA enabled)
      if (result.requires2FA) {
        setFormData(prev => ({ ...prev, email: result.user.email }));
        setRequires2FA(true);
        toast.info("Two-Factor Authentication Required — check your email for the verification code");
        setIsLoading(false);
        return;
      }

      const { token: backendToken, user: userData } = result;
      loginWithToken(backendToken, userData);

      // Check if user needs to set their location
      if (!userData?.location || userData.location === "" || userData.location === "null") {
        setPendingRedirect(from);
        setNeedsLocation(true);
        setIsLoading(false);
        return;
      }

      toast.success("Successfully signed in with Google!");
      navigate(from, { replace: true });
    } catch (error: any) {
      if (isAccountSuspendedError(error)) {
        navigate("/account-suspended", {
          state: { email: emailFromGoogleToken(credentialResponse?.credential || "") },
          replace: true,
        });
        return;
      }
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Please enter your email address");
    setIsLoading(true);
    try {
      const response = await fetch(getGraphqlUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation RequestPasswordReset($email: String!) { requestPasswordReset(email: $email) }`,
          variables: { email: resetEmail }
        }),
      });
      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0].message);
      setResetSent(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "login") {
        const response = await login(formData.email, formData.password);
        if (response?.requires2FA) {
          setRequires2FA(true);
          toast.info("Two-Factor Authentication Required");
          setIsLoading(false);
          return;
        }
        if (response?.requires2FASetup) {
          setRequires2FASetup(true);
          const { data } = await setup2FAMutation();
          if ((data as any)?.setup2FA) setTwoFactorData((data as any).setup2FA);
          toast.info("Administrator 2FA Setup Required");
          setIsLoading(false);
          return;
        }

        // Check if user needs to set their location
        if (response?.token && (!response.user?.location || response.user.location === "" || response.user.location === "null")) {
          setPendingRedirect(from);
          setNeedsLocation(true);
          setIsLoading(false);
          return;
        }

        toast.success("Welcome back!");
      } else {
        if (!formData.fullName.trim()) throw new Error("Please enter your full name");
        const response = await signup({ 
          email: formData.email, 
          password: formData.password, 
          fullName: formData.fullName, 
          phone: formData.phone 
        });
        
        toast.success("Account created successfully!");

        // Check if user needs to set their location (new users won't have one)
        if (response?.token && (!response.user?.location || response.user.location === "" || response.user.location === "null")) {
          setPendingRedirect(from);
          setNeedsLocation(true);
          setIsLoading(false);
          return;
        }
      }
      navigate(from, { replace: true });
    } catch (error) {
      if (isAccountSuspendedError(error)) {
        navigate("/account-suspended", {
          state: { email: formData.email },
          replace: true,
        });
        return;
      }
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return toast.error("Please enter a valid 6-digit code");
    setIsLoading(true);
    try {
      let response;
      if (useEmailOTP) {
        const { data } = await verifyEmailOTPMutation({ variables: { email: formData.email, code: totpCode } });
        response = (data as any)?.verifyEmailOTP;
      } else {
        const { data } = await verify2FAMutation({ variables: { code: totpCode } });
        response = (data as any)?.verify2FA;
      }
      if (response?.token) {
        loginWithToken(response.token, response.user);
        toast.success("Identity verified successfully!");
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmailOTP = async () => {
    setIsSendingOTP(true);
    try {
      await requestEmailOTPMutation({ variables: { email: formData.email } });
      setUseEmailOTP(true);
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Show location setup dialog after login
  if (needsLocation) {
    return (
      <LocationSetupDialog
        onComplete={() => {
          setNeedsLocation(false);
          navigate(pendingRedirect || "/portal/student", { replace: true });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Absolute Back Button */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t("nav.backToHome")}
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl p-6 sm:p-8"
      >
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center">
            <Logo variant="full" imgHeight="h-16 sm:h-20" />
          </Link>
        </div>

        {isForgotPassword ? (
          <div className="space-y-6">                <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("auth.resetPassword")}</h2>
              <p className="text-sm text-muted-foreground">
                {resetSent ? t("auth.checkEmail") : t("auth.enterEmailReset")}
              </p>
            </div>
            {resetSent ? (
              <div className="space-y-4">
                <Button variant="outline" className="w-full h-11" onClick={() => { setResetSent(false); setIsForgotPassword(false); setMode("login"); }}>{t("auth.backToSignIn")}</Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("auth.email")}</Label>
                  <Input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="h-11" />
                </div>
                <Button type="submit" variant="gold" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.sendResetLink")}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
                </div>
              </form>
            )}
          </div>
        ) : requires2FA ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("auth.twoStepVerification")}</h2>
              <p className="text-sm text-muted-foreground">{t("auth.enterCode")}</p>
            </div>
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("auth.verificationCode")}</Label>
                <Input type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} required className="h-12 text-center text-2xl tracking-[0.3em] font-mono" autoFocus />
              </div>
              <Button type="submit" variant="gold" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.verify")}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setRequires2FA(false); setTotpCode(""); setUseEmailOTP(false); }}>{t("common.cancel")}</Button>
            </form>
            {!useEmailOTP && (
              <Button variant="outline" className="w-full h-11" onClick={handleRequestEmailOTP} disabled={isSendingOTP}>
                {isSendingOTP ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-accent" /> : <Mail className="w-4 h-4 mr-2 text-accent" />}
                {t("auth.sendCodeEmail")}
              </Button>
            )}
          </div>
        ) : requires2FASetup ? (
           <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("auth.setup2FA")}</h2>
              <p className="text-sm text-muted-foreground">{t("auth.scanQR")}</p>
            </div>
            {twoFactorData ? (
              <div className="flex flex-col items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <img src={twoFactorData.qrCodeDataUrl} alt="2FA QR" className="w-40 h-40 rounded bg-white p-2" />
                <code className="text-xs bg-background px-3 py-1.5 rounded text-accent font-mono border">{twoFactorData.secret}</code>
              </div>
            ) : <div className="h-40 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <Input type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} required className="h-12 text-center text-xl tracking-[0.2em] font-mono" />
              <Button type="submit" variant="gold" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.verifyContinue")}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
              <button onClick={() => setMode("login")} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t("auth.signIn")}</button>
              <button onClick={() => setMode("signup")} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{t("auth.signUp")}</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required className="h-11 bg-background/50" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t("auth.email")}</Label>
                <Input type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-11 bg-background/50" />
              </div>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>{t("auth.phoneOptional")}</Label>
                  <Input type="tel" placeholder="+250 700 000 000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 bg-background/50" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{t("auth.password")}</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-accent hover:underline font-medium">{t("auth.forgot")}</button>
                  )}
                </div>
                <PasswordInput placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} className="h-11 bg-background/50" />
              </div>
              
              <Button type="submit" variant="gold" className="w-full h-11 mt-2 text-sm font-bold tracking-wide" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-medium">{t("auth.orContinueWith")}</span></div>
            </div>

            <div className="flex justify-center w-full [&>div]:w-full [&>div]:flex [&>div]:justify-center">
              <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error("Google Login Failed")} useOneTap={false} size="large" theme="outline" width="100%" />
            </div>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              {t("auth.agreedToTerms")}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
