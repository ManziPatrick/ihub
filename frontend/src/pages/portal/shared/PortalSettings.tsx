import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@apollo/client/react";
import { UPDATE_THEME, UPDATE_USER, UPDATE_BRANDING, UPDATE_STUDENT_PROFILE, REQUEST_EMAIL_OTP, ENABLE_EMAIL_2FA, DISABLE_EMAIL_2FA } from "@/lib/graphql/mutations";
import { GET_ME, GET_BRANDING } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { useBranding } from "@/components/BrandingProvider";
import { getApiBaseUrl } from "@/lib/env";
import {
  User as UserIcon,
  Palette,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Check,
  RotateCcw,
  Layout,
  Globe,
  Briefcase,
  Trophy,
  Award,
  Flame,
  Star,
  Link as LinkIcon,
  GraduationCap as GradIcon,
  BookOpen as BookIcon,
  MapPin as MapIcon,
  Shield,
  ShieldCheck,
  GraduationCap,
  Users,
  DollarSign,
  Linkedin,
  Github,
} from "lucide-react";
import { BecomeTrainerDialog } from "@/components/portal/dialogs/BecomeTrainerDialog";

const colorPresets = [
  { name: "Academic Gold", color: "#BC9229" },
  { name: "Oxford Blue", color: "#002147" },
  { name: "Royal Purple", color: "#6A0DAD" },
  { name: "Forest Green", color: "#013220" },
  { name: "Modern Indigo", color: "#6366F1" },
  { name: "Classic Slate", color: "#475569" },
];

export default function PortalSettings() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { branding: globalBranding } = useBranding();

  // --- Profile State ---
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    title: user?.title || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
    coverImage: user?.coverImage || "",
    certificateName: user?.certificateName || "",
    specialties: user?.trainerApplication?.specialties?.join(", ") || "",
    experienceYears: user?.trainerApplication?.experienceYears || "",
    qualifications: user?.trainerApplication?.qualifications?.join(", ") || "",
    teachingPhilosophy: user?.trainerApplication?.teachingPhilosophy || "",
    linkedinProfile: user?.trainerApplication?.linkedinProfile || "",
    githubProfile: user?.trainerApplication?.githubProfile || "",
    websiteUrl: user?.trainerApplication?.websiteUrl || "",
    rateHourly: user?.trainerApplication?.rateHourly || "",
    isProfilePublic: user?.isProfilePublic !== false,
  });

  const [studentForm, setStudentForm] = useState({
    school: user?.studentProfile?.school || "",
    educationLevel: user?.studentProfile?.educationLevel || "",
    academicYear: user?.studentProfile?.academicYear || "",
    fieldOfStudy: user?.studentProfile?.fieldOfStudy || "",
    city: user?.studentProfile?.city || "",
    sector: user?.studentProfile?.sector || "",
    cell: user?.studentProfile?.cell || "",
    village: user?.studentProfile?.village || "",
    skills: user?.studentProfile?.skills?.join(", ") || "",
    bio: user?.studentProfile?.bio || "",
    linkedinUrl: user?.studentProfile?.linkedinUrl || "",
    githubUrl: user?.studentProfile?.githubUrl || "",
    portfolioUrl: user?.studentProfile?.portfolioUrl || "",
  });

  // --- Theme State ---
  const [localTheme, setLocalTheme] = useState({
    primaryColor: user?.themePreference?.primaryColor || globalBranding.primaryColor,
    mode: theme || "light",
    lightBg: user?.themePreference?.lightBg || "#F8FAFC",
    darkBg: user?.themePreference?.darkBg || "#020617",
  });

  // --- Global Branding State (Super Admin Only) ---
  const [brandingForm, setBrandingForm] = useState({
    siteName: globalBranding.siteName,
    primaryColor: globalBranding.primaryColor,
    secondaryColor: globalBranding.secondaryColor,
    accentColor: globalBranding.accentColor,
    logoUrl: globalBranding.logoUrl,
    portalTitle: globalBranding.portalTitle
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        title: user.title || "",
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        avatar: user.avatar || "",
        coverImage: user.coverImage || "",
        certificateName: user.certificateName || "",
        specialties: user.trainerApplication?.specialties?.join(", ") || "",
        experienceYears: user.trainerApplication?.experienceYears || "",
        qualifications: user.trainerApplication?.qualifications?.join(", ") || "",
        teachingPhilosophy: user.trainerApplication?.teachingPhilosophy || "",
        linkedinProfile: user.trainerApplication?.linkedinProfile || "",
        githubProfile: user.trainerApplication?.githubProfile || "",
        websiteUrl: user.trainerApplication?.websiteUrl || "",
        rateHourly: user.trainerApplication?.rateHourly || "",
        isProfilePublic: user.isProfilePublic !== false,
      });

      if (user.studentProfile) {
        setStudentForm({
          school: user.studentProfile.school || "",
          educationLevel: user.studentProfile.educationLevel || "",
          academicYear: user.studentProfile.academicYear || "",
          fieldOfStudy: user.studentProfile.fieldOfStudy || "",
          city: user.studentProfile.city || "",
          sector: user.studentProfile.sector || "",
          cell: user.studentProfile.cell || "",
          village: user.studentProfile.village || "",
          skills: user.studentProfile.skills?.join(", ") || "",
          bio: user.studentProfile.bio || "",
          linkedinUrl: user.studentProfile.linkedinUrl || "",
          githubUrl: user.studentProfile.githubUrl || "",
          portfolioUrl: user.studentProfile.portfolioUrl || "",
        });
      }

      if (user.themePreference) {
        setLocalTheme(prev => ({
          ...prev,
          primaryColor: user.themePreference?.primaryColor || globalBranding.primaryColor,
          mode: user.themePreference?.mode || theme || "light",
          lightBg: user.themePreference?.lightBg || "#F8FAFC",
          darkBg: user.themePreference?.darkBg || "#020617",
        }));
      }
    }
  }, [user, theme, globalBranding]);

  // --- Mutations ---

  const [updateUserMutation, { loading: savingProfile }] = useMutation(UPDATE_USER, {
    onCompleted: (data: any) => {
      updateUser(data.updateUser);
      toast.success("Profile updated successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const [updateStudentProfile, { loading: savingStudent }] = useMutation(UPDATE_STUDENT_PROFILE, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: () => toast.success("Academic profile updated!"),
    onError: (err) => toast.error(err.message),
  });

  const [updateThemeMutation, { loading: savingTheme }] = useMutation(UPDATE_THEME, {
    refetchQueries: [{ query: GET_ME }],
    onCompleted: (data: any) => {
      if (data.updateTheme?.themePreference) {
        updateUser({ themePreference: data.updateTheme.themePreference });
        toast.success("Theme preferences saved locally");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const [updateBrandingMutation, { loading: savingBranding }] = useMutation(UPDATE_BRANDING, {
    refetchQueries: [{ query: GET_BRANDING }],
    onCompleted: () => toast.success("Global branding updated!"),
    onError: (err) => toast.error(err.message),
  });


  // --- Handlers ---

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Get token from localStorage if available, or rely on cookie if that's how your auth works. 
      // Based on useAuth, we might need to be careful. usually Bearer token is best.
      const token = localStorage.getItem('ihub_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }


      const response = await fetch(`${getApiBaseUrl()}/api/upload/image`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setProfileForm(prev => ({ ...prev, avatar: data.url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // --- Security / 2FA State ---
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isEnabling, setIsEnabling] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const [requestEmailOTPMutation] = useMutation(REQUEST_EMAIL_OTP);
  const [enableEmail2FAMutation] = useMutation(ENABLE_EMAIL_2FA, {
    onCompleted: (data: any) => {
      if (data.enableEmail2FA) {
        updateUser({ twoFactorEnabled: true } as any);
        toast.success("Email 2FA has been enabled!");
        setShowOTPDialog(false);
        setOtpCode("");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const [disableEmail2FAMutation] = useMutation(DISABLE_EMAIL_2FA, {
    onCompleted: (data: any) => {
      if (data.disableEmail2FA) {
        updateUser({ twoFactorEnabled: false } as any);
        toast.success("Email 2FA has been disabled.");
        setShowOTPDialog(false);
        setOtpCode("");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handle2FAToggle = async () => {
    if (!user?.email) {
      toast.error("No email address on file.");
      return;
    }
    setIsSendingOTP(true);
    try {
      await requestEmailOTPMutation({ variables: { email: user.email } });
      setShowOTPDialog(true);
      setIsEnabling(!(user as any).twoFactorEnabled); // If currently disabled, we're enabling; if enabled, we're disabling
      toast.success("OTP sent to your email");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleConfirmOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      toast.error("Please enter the verification code");
      return;
    }
    if (isEnabling) {
      await enableEmail2FAMutation({ variables: { code: otpCode } });
    } else {
      await disableEmail2FAMutation({ variables: { code: otpCode } });
    }
  };

  const [showBecomeTrainer, setShowBecomeTrainer] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleBrandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('ihub_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;


      const response = await fetch(`${getApiBaseUrl()}/api/upload/image`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setBrandingForm(prev => ({ ...prev, logoUrl: data.url }));
      toast.success("Branding logo uploaded!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload branding logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = () => {
    // Trainer-only fields are sent via handleSaveTrainerProfile with the correct
    // GraphQL types (arrays / Int) — exclude them here so the general profile
    // save never sends incompatible values (e.g. comma-joined strings).
    const {
      specialties,
      qualifications,
      experienceYears,
      rateHourly,
      teachingPhilosophy,
      linkedinProfile,
      githubProfile,
      websiteUrl,
      isProfilePublic,
      ...generalProfile
    } = profileForm;
    updateUserMutation({
      variables: {
        id: user?.id,
        ...generalProfile
      }
    });
  };

  const handleSaveTrainerProfile = () => {
    const specialties = (profileForm as any).specialties
      ? (profileForm as any).specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined;
    const qualifications = (profileForm as any).qualifications
      ? (profileForm as any).qualifications.split(',').map((q: string) => q.trim()).filter(Boolean)
      : undefined;

    updateUserMutation({
      variables: {
        id: user?.id,
        specialties,
        qualifications,
        linkedinProfile: (profileForm as any).linkedinProfile || undefined,
        githubProfile: (profileForm as any).githubProfile || undefined,
        websiteUrl: (profileForm as any).websiteUrl || undefined,
        rateHourly: (profileForm as any).rateHourly ? parseInt((profileForm as any).rateHourly) : undefined,
        experienceYears: (profileForm as any).experienceYears ? parseInt((profileForm as any).experienceYears) : undefined,
        teachingPhilosophy: (profileForm as any).teachingPhilosophy || undefined,
      }
    });
  };

  const handleSaveStudentProfile = () => {
    updateStudentProfile({
      variables: {
        ...studentForm,
        skills: studentForm.skills.split(",").map(s => s.trim()).filter(Boolean)
      }
    });
  };

  const handleSaveTheme = async () => {
    await updateThemeMutation({
      variables: {
        primaryColor: localTheme.primaryColor === globalBranding.primaryColor ? undefined : localTheme.primaryColor, // If match global, unset local override
        mode: localTheme.mode,
        lightBg: localTheme.lightBg,
        darkBg: localTheme.darkBg,
      }
    });
    setTheme(localTheme.mode);
  };

  const handleSaveBranding = () => {
    updateBrandingMutation({
      variables: brandingForm
    });
  };

  const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Account Interface
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal profile and workspace appearance
            </p>
          </div>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card border border-border/50 p-1 w-full justify-start overflow-x-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Profile
            </TabsTrigger>

            {user?.role === 'student' && (
              <TabsTrigger value="student" className="flex items-center gap-2 text-accent">
                <GradIcon className="w-4 h-4" /> Academic Profile
              </TabsTrigger>
            )}
            {user?.role === 'student' && (
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" /> My Achievements
              </TabsTrigger>
            )}
            {user?.role === 'student' && (
              <TabsTrigger value="become-trainer" className="flex items-center gap-2 text-accent">
                <GraduationCap className="w-4 h-4" /> Become a Trainer
              </TabsTrigger>
            )}
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>

            {user?.role === 'super_admin' && (
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Global Branding
              </TabsTrigger>
            )}
          </TabsList>

          {/* === PROFILE TAB === */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your public profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Avatar Section */}
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <Avatar className="w-24 h-24 shadow-xl border-4 border-background">
                        <AvatarImage src={profileForm.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                          {getInitials(profileForm.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {uploading ? (
                          <span className="text-white text-xs font-medium">...</span>
                        ) : (
                          <Camera className="text-white w-6 h-6" />
                        )}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-semibold">{profileForm.fullName || "Your Name"}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{user?.email}</p>
                      <div className="flex gap-2">                      <Input
                          placeholder="Avatar URL"
                          value={profileForm.avatar}
                          onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                          className="h-8 text-xs w-64"
                        />
                    </div>
                  </div>

                  {/* Cover Image Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-full max-w-md h-28 rounded-xl border border-border/30 bg-muted/10 overflow-hidden">
                        {profileForm.coverImage ? (
                          <img src={profileForm.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xs">
                            No Cover Image
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Cover Image</p>
                      <Input
                        placeholder="Cover image URL"
                        value={profileForm.coverImage}
                        onChange={(e) => setProfileForm({ ...profileForm, coverImage: e.target.value })}
                        className="h-8 text-xs w-full"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {user?.role === 'trainer' && !user?.isTrainerApproved ? 'Add a cover image to get your trainer application approved automatically!' : 'A banner image for your profile page'}
                      </p>
                    </div>
                  </div>
                  </div>

                  {/* Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Title</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={profileForm.title}
                          placeholder="e.g. Senior Developer"
                          onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={profileForm.phone}
                          placeholder="+2507XXXXXXXX"
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Used for commission payouts and disbursements via IntouchPay.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Certificate Display Name</label>
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-accent" />
                        <Input
                          value={profileForm.certificateName || ""}
                          placeholder="Name as it should appear on certificates"
                          onChange={(e) => setProfileForm({ ...profileForm, certificateName: e.target.value })}
                          className="pl-9 border-accent/20 focus:border-accent"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">If left blank, your Full Name will be used.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Professional Bio</label>
                    <Textarea
                      rows={4}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="resize-none bg-muted/30"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button onClick={handleSaveProfile} disabled={savingProfile} className="min-w-[150px]">
                      {savingProfile ? "Saving..." : "Save Profile Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trainer Profile Section — only for trainers */}
              {user?.role === 'trainer' && (
                <Card className="border-accent/20">
                  <CardHeader className="bg-accent/5">
                    <CardTitle className="flex items-center gap-2 text-accent">
                      <GraduationCap className="w-5 h-5" />
                      Trainer Profile
                    </CardTitle>
                    <CardDescription>Manage your public trainer profile and visibility</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Public Profile Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${user.isProfilePublic !== false ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {user.isProfilePublic !== false ? 'Profile is Public' : 'Profile is Hidden'}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {user.isProfilePublic !== false
                              ? 'Your trainer profile appears in the public listings and search'
                              : 'Your trainer profile is hidden from public listings'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={user?.isProfilePublic !== false}
                          onChange={(e) => {
                            const newVal = e.target.checked;
                            setProfileForm(prev => ({ ...prev, isProfilePublic: newVal } as any));
                            // Also update immediately
                            updateUserMutation({
                              variables: {
                                id: user?.id,
                                isProfilePublic: newVal
                              }
                            });
                          }}
                        />
                        <div className="w-11 h-6 bg-muted-foreground/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>

                    {/* Trainer fields */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold flex items-center gap-2"><Star className="w-4 h-4 text-accent" /> Expertise & Specialties</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specialties</label>
                          <Input
                            value={profileForm.specialties || user?.trainerApplication?.specialties?.join(', ') || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, specialties: e.target.value } as any)}
                            placeholder="e.g. React, Python, Data Science"
                          />
                          <p className="text-[10px] text-muted-foreground">Separate with commas</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Years of Experience</label>
                          <Input
                            type="number"
                            value={profileForm.experienceYears || user?.trainerApplication?.experienceYears || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value } as any)}
                            placeholder="e.g. 5"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qualifications / Certifications</label>
                        <Input
                          value={profileForm.qualifications || user?.trainerApplication?.qualifications?.join(', ') || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value } as any)}
                          placeholder="e.g. AWS Certified, Google UX"
                        />
                        <p className="text-[10px] text-muted-foreground">Separate with commas</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teaching Philosophy</label>
                        <Textarea
                          rows={3}
                          value={profileForm.teachingPhilosophy || user?.trainerApplication?.teachingPhilosophy || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, teachingPhilosophy: e.target.value } as any)}
                          className="resize-none bg-muted/30"
                          placeholder="Describe your approach to teaching..."
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <h4 className="text-sm font-bold flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Online Presence</h4>
                        <div className="space-y-2">
                          <label className="text-xs font-medium flex items-center gap-2">
                            <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn
                          </label>
                          <Input
                            value={profileForm.linkedinProfile || user?.trainerApplication?.linkedinProfile || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, linkedinProfile: e.target.value } as any)}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium flex items-center gap-2">
                            <Github className="w-3.5 h-3.5" /> GitHub
                          </label>
                          <Input
                            value={profileForm.githubProfile || user?.trainerApplication?.githubProfile || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, githubProfile: e.target.value } as any)}
                            placeholder="https://github.com/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-accent" /> Website / Portfolio
                          </label>
                          <Input
                            value={profileForm.websiteUrl || user?.trainerApplication?.websiteUrl || ''}
                            onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value } as any)}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button 
                        onClick={handleSaveTrainerProfile} 
                        disabled={savingProfile}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[150px]"
                      >
                        {savingProfile ? "Saving..." : "Save Trainer Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>



          {/* === STUDENT PROFILE TAB === */}
          {user?.role === 'student' && (
            <TabsContent value="student">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-accent/20">
                  <CardHeader className="bg-accent/5">
                    <CardTitle className="text-accent flex items-center gap-2">
                      <GradIcon className="w-5 h-5" />
                      Academic Profile
                    </CardTitle>
                    <CardDescription>Manage your school information and professional links</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School / University</label>
                        <Input 
                          value={studentForm.school}
                          onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Education Level</label>
                        <Input 
                          value={studentForm.educationLevel}
                          onChange={(e) => setStudentForm({ ...studentForm, educationLevel: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Year</label>
                        <Input 
                          value={studentForm.academicYear}
                          onChange={(e) => setStudentForm({ ...studentForm, academicYear: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Field of Study</label>
                        <Input 
                          value={studentForm.fieldOfStudy}
                          onChange={(e) => setStudentForm({ ...studentForm, fieldOfStudy: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-6">
                      <h4 className="text-sm font-bold flex items-center gap-2"><MapIcon className="w-4 h-4" /> Location Details</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</label>
                          <Input value={studentForm.city} onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sector</label>
                          <Input value={studentForm.sector} onChange={(e) => setStudentForm({ ...studentForm, sector: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-6">
                      <h4 className="text-sm font-bold flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Professional Presence</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LinkedIn URL</label>
                          <Input value={studentForm.linkedinUrl} onChange={(e) => setStudentForm({ ...studentForm, linkedinUrl: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GitHub URL</label>
                          <Input value={studentForm.githubUrl} onChange={(e) => setStudentForm({ ...studentForm, githubUrl: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Skills (Comma separated)</label>
                      <Input value={studentForm.skills} onChange={(e) => setStudentForm({ ...studentForm, skills: e.target.value })} />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button onClick={handleSaveStudentProfile} disabled={savingStudent} className="bg-accent hover:bg-accent/90 text-accent-foreground font-black min-w-[150px]">
                        {savingStudent ? "Saving..." : "Save Academic Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {/* === GLOBAL BRANDING TAB (SUPER ADMIN ONLY) === */}
          {user?.role === 'super_admin' && (
            <TabsContent value="branding">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-accent/20">
                  <CardHeader className="bg-accent/5">
                    <CardTitle className="text-accent flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Global Branding
                    </CardTitle>
                    <CardDescription>
                      Settings here affect the ENTIRE site for ALL users. Use with caution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Site Name</label>
                        <Input
                          value={brandingForm.siteName}
                          onChange={(e) => setBrandingForm({ ...brandingForm, siteName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Portal Title</label>
                        <Input
                          value={brandingForm.portalTitle}
                          onChange={(e) => setBrandingForm({ ...brandingForm, portalTitle: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Logo URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={brandingForm.logoUrl}
                          onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                          placeholder="https://..."
                        />
                        {brandingForm.logoUrl && (
                          <img src={brandingForm.logoUrl} alt="Preview" className="h-10 w-auto object-contain border rounded p-1" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="font-medium">Global Color Palette</h4>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Primary Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} className="h-10 w-16" />
                            <Input value={brandingForm.primaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })} className="font-mono text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Secondary Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} className="h-10 w-16" />
                            <Input value={brandingForm.secondaryColor} onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })} className="font-mono text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Accent Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="h-10 w-16" />
                            <Input value={brandingForm.accentColor} onChange={(e) => setBrandingForm({ ...brandingForm, accentColor: e.target.value })} className="font-mono text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button variant="destructive" onClick={handleSaveBranding} disabled={savingBranding}>
                        {savingBranding ? "Applying..." : "Apply Global Branding"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {/* === SECURITY TAB === */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account by requiring a one-time passcode
                    sent to your email address when logging in.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 2FA Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${user?.twoFactorEnabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {user?.twoFactorEnabled ? (
                          <ShieldCheck className="w-6 h-6" />
                        ) : (
                          <Shield className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">                              {user?.twoFactorEnabled ? 'Email 2FA is Active' : 'Email 2FA is Disabled'}
                        </h4>
                        <p className="text-sm text-muted-foreground">                              {user?.twoFactorEnabled
                            ? 'You will receive a one-time code via email each time you log in.'
                            : 'Enable 2FA to secure your account with email-based verification.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.twoFactorEnabled ? (
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          onClick={handle2FAToggle}
                          disabled={isSendingOTP}
                        >
                          {isSendingOTP ? 'Sending OTP...' : 'Disable 2FA'}
                        </Button>
                      ) : (
                        <Button
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={handle2FAToggle}
                          disabled={isSendingOTP}
                        >
                          {isSendingOTP ? 'Sending OTP...' : 'Enable 2FA'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="bg-muted/20 rounded-lg p-4 border border-border/30">
                    <h5 className="text-sm font-semibold mb-2">How Email 2FA Works</h5>
                    <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Click "Enable 2FA" to request a one-time passcode via email</li>
                      <li>Check your email inbox for the 6-digit verification code</li>
                      <li>Enter the code below to confirm and activate 2FA</li>
                      <li>Future logins will require both your password and an email OTP</li>
                    </ol>
                  </div>

                  {/* OTP Confirmation Dialog */}
                  {showOTPDialog && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 bg-card border-2 border-accent/20 rounded-xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          {isEnabling ? 'Enable Email 2FA' : 'Disable Email 2FA'}
                        </h4>
                        <button
                          onClick={() => {
                            setShowOTPDialog(false);
                            setOtpCode("");
                          }}
                          className="text-muted-foreground hover:text-foreground text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        A verification code has been sent to <strong>{user?.email}</strong>.
                        Please enter it below to {isEnabling ? 'enable' : 'disable'} 2FA.
                      </p>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Verification Code</label>
                          <Input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            className="font-mono text-lg text-center tracking-[0.5em] h-12"
                            maxLength={6}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmOTP();
                            }}
                          />
                        </div>
                        <Button
                          onClick={handleConfirmOTP}
                          disabled={otpCode.length < 4 || (enableEmail2FAMutation as any).loading || (disableEmail2FAMutation as any).loading}
                          className={isEnabling ? "bg-accent hover:bg-accent/90" : "border-red-500/30 text-red-500 hover:bg-red-500/10"}
                          variant={isEnabling ? "default" : "outline"}
                        >
                          {((enableEmail2FAMutation as any).loading || (disableEmail2FAMutation as any).loading) ? 'Verifying...' : 'Confirm'}
                        </Button>
                      </div>
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-200 ${
                              otpCode.length > i
                                ? 'bg-accent scale-110'
                                : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* === ACHIEVEMENTS TAB (STUDENT ONLY) === */}
          {user?.role === 'student' && (
            <TabsContent value="achievements">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-border/50 bg-gold/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-gold">Level {user?.level || 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black text-gold">{user?.xp || 0} XP</div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold">Total Experience Points</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-accent">Current Streak</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black text-accent">{user?.streak || 0} Days</div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold">Learning Consistency</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Badges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black text-card-foreground">{user?.badges?.length || 0}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold">Unlocked Achievements</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Unlocked Badges</CardTitle>
                    <CardDescription>Your collection of achievements and mastery tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                      {(user?.badges || []).length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
                           <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
                           <p>Keep learning to unlock your first badge!</p>
                        </div>
                      ) : (
                        user?.badges?.map((ub: any) => (
                          <motion.div 
                            key={ub.badge.id}
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center gap-3 p-4 bg-muted/10 rounded-3xl border border-border/50"
                          >
                            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-3xl shadow-lg border-2 border-accent/10">
                              {ub.badge.icon || "🏆"}
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black truncate max-w-[100px]">{ub.badge.title}</p>
                              <p className="text-[8px] text-muted-foreground font-bold">{new Date(parseInt(ub.awardedAt)).toLocaleDateString()}</p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {/* === BECOME A TRAINER TAB (STUDENT ONLY) === */}
          {user?.role === 'student' && (
            <TabsContent value="become-trainer">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-accent/20 overflow-hidden">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10" />
                    <CardHeader className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg mb-4">
                        <GraduationCap className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        Become a Trainer & Mentor
                      </CardTitle>
                      <CardDescription className="text-base">
                        Share your knowledge, coach students, and earn from your expertise
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <BookIcon className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Create Courses</p>
                            <p className="text-xs text-muted-foreground">Design and publish courses</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Coach Students</p>
                            <p className="text-xs text-muted-foreground">Mentor and guide learners</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Star className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Offer Scholarships</p>
                            <p className="text-xs text-muted-foreground">Help students financially</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Earn Income</p>
                            <p className="text-xs text-muted-foreground">Get paid for teaching</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        <strong>Note:</strong> Your application will be reviewed by a super admin.
                        Once approved, you'll get access to the trainer dashboard where you can
                        create courses, manage students, schedule meetings, and more.
                      </p>
                    </div>

                    <Button
                      onClick={() => setShowBecomeTrainer(true)}
                      className="w-full h-12 text-base gap-2 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent"
                    >
                      <GraduationCap className="w-5 h-5" />
                      Apply to Become a Trainer
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <BecomeTrainerDialog open={showBecomeTrainer} onOpenChange={setShowBecomeTrainer} />
    </PortalLayout>
  );
}
