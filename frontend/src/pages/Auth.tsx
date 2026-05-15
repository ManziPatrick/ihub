import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { getGraphqlUrl } from "@/lib/env";
import { GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@apollo/client/react";
import { GOOGLE_LOGIN, VERIFY_2FA, SETUP_2FA, REQUEST_EMAIL_OTP, VERIFY_EMAIL_OTP } from "@/lib/graphql/mutations";
import { ProfileCompletionWizard } from "@/components/portal/ProfileCompletionGuard";

type AuthMode = "login" | "signup";

export default function Auth() {
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

  const { login, signup, user, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [googleLoginMutation] = useMutation(GOOGLE_LOGIN);
  const [verify2FAMutation] = useMutation(VERIFY_2FA);
  const [setup2FAMutation] = useMutation(SETUP_2FA);
  const [requestEmailOTPMutation] = useMutation(REQUEST_EMAIL_OTP);
  const [verifyEmailOTPMutation] = useMutation(VERIFY_EMAIL_OTP);

  if (user) {
    const roleRedirects = { student: "/portal/student", trainer: "/portal/trainer", admin: "/portal/admin", super_admin: "/portal/super-admin" };
    navigate(roleRedirects[user.role], { replace: true });
    return null;
  }

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      const token = credentialResponse.credential;
      if (!token) throw new Error("No credential received from Google");
      setIsLoading(true);
      const { data } = await googleLoginMutation({ variables: { token } });
      const { token: backendToken, user: userData } = (data as any).googleLogin;
      
      loginWithToken(backendToken, userData);
      toast.success("Successfully signed in with Google!");
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/portal/student";
      navigate(from, { replace: true });
    } catch (error: any) {
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

        toast.success("Welcome back!");
      } else {
        if (!formData.fullName.trim()) throw new Error("Please enter your full name");
        await signup({ 
          email: formData.email, 
          password: formData.password, 
          fullName: formData.fullName, 
          phone: formData.phone 
        });
        
        toast.success("Account created successfully!");
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/portal/student";
      navigate(from, { replace: true });
    } catch (error) {
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
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/portal/student";
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Absolute Back Button */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl p-8"
      >
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-accent text-3xl font-bold">≪</span>
            <span className="text-2xl font-bold text-foreground tracking-tight">MultiCourses</span>
          </Link>
        </div>

        {isForgotPassword ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
              <p className="text-sm text-muted-foreground">
                {resetSent ? "Check your email for the reset link." : "Enter your email to receive a link."}
              </p>
            </div>
            {resetSent ? (
              <div className="space-y-4">
                <Button variant="outline" className="w-full h-11" onClick={() => { setResetSent(false); setIsForgotPassword(false); setMode("login"); }}>Back to Sign In</Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="h-11" />
                </div>
                <Button type="submit" variant="gold" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              </form>
            )}
          </div>
        ) : requires2FA ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">2-Step Verification</h2>
              <p className="text-sm text-muted-foreground">Enter the 6-digit code from your app or email.</p>
            </div>
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Verification Code</Label>
                <Input type="text" maxLength={6} placeholder="000000" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} required className="h-12 text-center text-2xl tracking-[0.3em] font-mono" autoFocus />
              </div>
              <Button type="submit" variant="gold" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => { setRequires2FA(false); setTotpCode(""); setUseEmailOTP(false); }}>Cancel</Button>
            </form>
            {!useEmailOTP && (
              <Button variant="outline" className="w-full h-11" onClick={handleRequestEmailOTP} disabled={isSendingOTP}>
                {isSendingOTP ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-accent" /> : <Mail className="w-4 h-4 mr-2 text-accent" />}
                Send Code via Email
              </Button>
            )}
          </div>
        ) : requires2FASetup ? (
           <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Setup 2FA</h2>
              <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator.</p>
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
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
              <button onClick={() => setMode("login")} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Sign In</button>
              <button onClick={() => setMode("signup")} className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Sign Up</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input type="text" placeholder="John Doe" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required className="h-11 bg-background/50" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-11 bg-background/50" />
              </div>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label>Phone (Optional)</Label>
                  <Input type="tel" placeholder="+250 700 000 000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 bg-background/50" />
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-accent hover:underline font-medium">Forgot?</button>
                  )}
                </div>
                <PasswordInput placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} className="h-11 bg-background/50" />
              </div>
              
              <Button type="submit" variant="gold" className="w-full h-11 mt-2 text-sm font-bold tracking-wide" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-medium">Or</span></div>
            </div>

            <div className="flex justify-center w-full [&>div]:w-full [&>div]:flex [&>div]:justify-center">
              <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error("Google Login Failed")} useOneTap={false} size="large" theme="outline" width="100%" />
            </div>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our <Link to="/terms" className="text-accent hover:underline">Terms</Link> and <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
