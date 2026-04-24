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
import { UPDATE_THEME, UPDATE_USER, UPDATE_BRANDING } from "@/lib/graphql/mutations";
import { GET_ME, GET_BRANDING } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { useBranding } from "@/components/BrandingProvider";
import { getApiBaseUrl } from "@/lib/env";
import {
  User,
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
} from "lucide-react";

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
    certificateName: user?.certificateName || "",
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
        certificateName: user.certificateName || "",
      });

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
      const token = localStorage.getItem('codemande_token');
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

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleBrandingLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('codemande_token');
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
    updateUserMutation({
      variables: {
        id: user?.id,
        ...profileForm
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
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Appearance
            </TabsTrigger>
            {user?.role === 'student' && (
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" /> My Achievements
              </TabsTrigger>
            )}
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Items URL for Avatar"
                          value={profileForm.avatar}
                          onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                          className="h-8 text-xs w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
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
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="pl-9"
                        />
                      </div>
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
            </motion.div>
          </TabsContent>

          {/* === APPEARANCE TAB === */}
          <TabsContent value="preferences">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Theme & Appearance</CardTitle>
                  <CardDescription>Customize your personal workspace view. This only affects what YOU see.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Theme Mode */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Color Mode</h4>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <button
                        onClick={() => setLocalTheme({ ...localTheme, mode: 'light' })}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${localTheme.mode === 'light' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`}
                      >
                        <div className="w-full h-8 bg-white rounded border border-gray-200" />
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => setLocalTheme({ ...localTheme, mode: 'dark' })}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${localTheme.mode === 'dark' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'}`}
                      >
                        <div className="w-full h-8 bg-slate-900 rounded border border-slate-700" />
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Color Override */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <h4 className="font-medium text-sm">Personal Accent Color</h4>
                    <p className="text-sm text-muted-foreground mb-4">Override the default site color for your dashboard.</p>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setLocalTheme({ ...localTheme, primaryColor: preset.color })}
                          className={`group relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${localTheme.primaryColor === preset.color
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:border-border'
                            }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: preset.color }}
                          >
                            {localTheme.primaryColor === preset.color && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={localTheme.primaryColor || globalBranding.primaryColor}
                        onChange={(e) => setLocalTheme({ ...localTheme, primaryColor: e.target.value })}
                        className="h-10 w-20 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{localTheme.primaryColor || "Default"}</span>

                      <Button variant="ghost" size="sm" onClick={() => setLocalTheme({ ...localTheme, primaryColor: globalBranding.primaryColor })}>
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button onClick={handleSaveTheme} disabled={savingTheme} className="min-w-[150px]">
                      {savingTheme ? "Saving..." : "Save My Preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* === GLOBAL BRANDING TAB (SUPER ADMIN ONLY) === */}
          {user?.role === 'super_admin' && (
            <TabsContent value="branding">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-border/50 border-accent/20">
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

        </Tabs>
      </div>
    </PortalLayout>
  );
}
