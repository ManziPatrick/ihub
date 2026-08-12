import { useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_TRAINER_PUBLIC_PROFILE } from "@/lib/graphql/queries";
import { UPDATE_USER } from "@/lib/graphql/mutations";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Globe,
  Github,
  Linkedin,
  BookOpen,
  Users,
  Star,
  Clock,
  Award,
  GraduationCap,
  Share2,
  Briefcase,
  Sparkles,
  CheckCircle,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  Trophy,
  HeartHandshake,
  ChevronRight,
  ExternalLink,
  BadgeCheck,
  Zap,
  Pencil,
  Camera,
  X,
  Facebook,
  Twitter,
  Image,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { personLd, breadcrumbListLd } from "@/lib/jsonld";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import html2canvas from "html2canvas";

// ─── Helpers ─────────────────────────────────────────────────────────────

const coverGradients = [
  "from-blue-600/30 via-indigo-500/20 to-purple-600/30",
  "from-emerald-600/30 via-teal-500/20 to-cyan-600/30",
  "from-orange-600/30 via-amber-500/20 to-yellow-600/30",
  "from-rose-600/30 via-pink-500/20 to-fuchsia-600/30",
  "from-sky-600/30 via-blue-500/20 to-indigo-600/30",
];

function getCoverGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return coverGradients[Math.abs(hash) % coverGradients.length];
}

// ─── Social Share Popup ─────────────────────────────────────────────────

function openSharePopup(url: string, title: string, w = 600, h = 500) {
  const left = Math.round(screen.width / 2 - w / 2);
  const top = Math.round(screen.height / 2 - h / 2);
  window.open(
    url,
    title,
    `scrollbars=yes,width=${w},height=${h},top=${top},left=${left}`
  );
}

// ─── Edit Profile Dialog ────────────────────────────────────────────────

function EditProfileDialog({
  trainer,
  open,
  onOpenChange,
  onSaved,
}: {
  trainer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(trainer.fullName || "");
  const [title, setTitle] = useState(trainer.title || "");
  const [bio, setBio] = useState(trainer.bio || "");
  const [location, setLocation] = useState(trainer.location || "");
  const [avatar, setAvatar] = useState(trainer.avatar || "");
  const [coverImage, setCoverImage] = useState(trainer.coverImage || "");
  const [phone, setPhone] = useState(trainer.phone || "");
  const [saving, setSaving] = useState(false);

  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      toast.success("Profile updated successfully!");
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
      setSaving(false);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser({
        variables: {
          id: trainer.id,
          fullName: fullName || undefined,
          title: title || undefined,
          bio: bio || undefined,
          location: location || undefined,
          avatar: avatar || undefined,
          coverImage: coverImage || undefined,
          phone: phone || undefined,
        },
      });
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pencil className="w-5 h-5 text-accent" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your public trainer profile. Changes are visible to everyone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-accent/20">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={avatar} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-accent to-accent/80 text-white">
                      {fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex-1">
                <FileUpload
                  onUploadComplete={(url) => setAvatar(url)}
                  folder="trainer-avatars"
                  accept="image/*"
                  maxSizeMB={5}
                  label="Upload Photo"
                />
              </div>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Cover Image</Label>
            <div className="space-y-2">
              {coverImage && (
                <div className="relative rounded-lg overflow-hidden h-24 bg-muted">
                  <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <FileUpload
                onUploadComplete={(url) => setCoverImage(url)}
                folder="trainer-covers"
                accept="image/*"
                maxSizeMB={10}
                label={coverImage ? "Change Cover Image" : "Upload Cover Image"}
              />
            </div>
          </div>

          <div className="border-t border-border/20" />

          {/* Basic Info Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Developer & Cloud Architect"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kigali, Rwanda"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional phone number"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90 gap-2">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-4 h-4" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function TrainerProfile() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("about");
  const [editOpen, setEditOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const { user } = useAuth();
  const isOwnProfile = user?.id === id;
  const { formatPrice } = useCurrency();

  const { data, loading, error, refetch } = useQuery(GET_TRAINER_PUBLIC_PROFILE, {
    variables: { id },
    skip: !id,
  });

  const trainer = (data as any)?.trainerPublicProfile;

  const profileUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Check out ${trainer?.fullName || trainer?.username || "this trainer"} on Bootskills!`;

  const handleShareProfile = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareLinkedIn = () => {
    openSharePopup(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
      "Share on LinkedIn"
    );
  };

  const handleShareTwitter = () => {
    openSharePopup(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
      "Share on X"
    );
  };

  const handleShareFacebook = () => {
    openSharePopup(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      "Share on Facebook"
    );
  };

  const handleDownloadImage = useCallback(async () => {
    if (!profileRef.current) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(profileRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#FDFCFB",
        x: 0,
        y: 0,
        width: profileRef.current.scrollWidth,
        height: profileRef.current.scrollHeight,
      });
      const link = document.createElement("a");
      link.download = `${trainer?.fullName || trainer?.username || "trainer"}-profile.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Profile image downloaded! Ready to share.");
    } catch (err) {
      toast.error("Failed to capture profile. Try screenshot instead.");
    } finally {
      setCapturing(false);
    }
  }, [trainer]);

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error || !trainer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/20">
              <Users className="w-12 h-12 text-muted-foreground/60" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2"
          >
            <h2 className="text-2xl font-bold">Trainer Not Found</h2>
            <p className="text-muted-foreground max-w-sm">
              This trainer profile doesn't exist or has been removed.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link to="/explore">
              <Button variant="outline" className="gap-2 rounded-xl h-11 px-6 border-border/40 hover:border-accent/40">
                <ArrowLeft className="w-4 h-4" /> Browse Trainers
              </Button>
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Derived Data ───────────────────────────────────────────────────

  const initials = trainer.fullName
    ? trainer.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "T";

  const specialties = trainer.trainerApplication?.specialties || [];
  const qualifications = trainer.trainerApplication?.qualifications || [];
  const courses = trainer.trainerCourses || [];
  const programs = trainer.trainerPrograms || [];
  const totalStudents = courses.reduce((s: number, c: any) => s + (c.studentsEnrolledCount || 0), 0);
  const coverGrad = getCoverGradient(trainer.fullName || trainer.username);
  const coverImage = trainer.coverImage;
  const coverSrc = trainer.coverImage || trainer.avatar;

  // ─── Profile Completion Check ───────────────────────────────────
  const missingFields = [
    { key: 'avatar', label: 'Profile picture', missing: !trainer.avatar },
    { key: 'coverImage', label: 'Cover image', missing: !trainer.coverImage },
    { key: 'fullName', label: 'Full name', missing: !trainer.fullName },
    { key: 'title', label: 'Professional title', missing: !trainer.title },
    { key: 'bio', label: 'Bio', missing: !trainer.bio },
    { key: 'location', label: 'Location', missing: !trainer.location },
  ].filter(f => f.missing);

  const isMissingInfo = missingFields.length > 0;

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F3F2F0] dark:bg-background">
      {/* LinkedIn-style background: subtle warm gray */}
      <SEOHead
        title={`${trainer.fullName || trainer.username}${trainer.title ? ` — ${trainer.title}` : ""}`}
        description={
          trainer.bio?.slice(0, 160) ||
          `Learn from ${trainer.fullName || trainer.username}, a verified ${trainer.title || "trainer"} on Bootskills specializing in ${specialties.slice(0, 3).join(", ")}.`
        }
        canonicalUrl={`https://bootskills.com/trainer/${trainer.id}`}
        ogImage={trainer.avatar || trainer.coverImage || undefined}
        ogImageAlt={`${trainer.fullName || trainer.username} profile photo`}
        ogType="profile"
        keywords={[...specialties, ...qualifications].slice(0, 12).join(", ")}
        twitterCard="summary"
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              personLd(trainer.fullName || trainer.username, `https://bootskills.com/trainer/${trainer.id}`, {
                image: trainer.avatar || undefined,
                jobTitle: trainer.title || undefined,
                description: trainer.bio || undefined,
                knowsAbout: specialties.length ? specialties : undefined,
                sameAs: [
                  trainer.trainerApplication?.linkedinProfile,
                  trainer.trainerApplication?.githubProfile,
                  trainer.trainerApplication?.websiteUrl,
                ].filter(Boolean),
                location: trainer.location || undefined,
                worksForName: "Bootskills",
                awards: qualifications.length ? qualifications : undefined,
              }),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Trainers", item: "/explore" },
                { name: trainer.fullName || trainer.username, item: `/trainer/${trainer.id}` },
              ]),
            ],
          })}
        </script>
      </SEOHead>

      <Header />

      {/* ===== EDIT PROFILE DIALOG ===== */}
      <EditProfileDialog
        trainer={trainer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => refetch()}
      />

      {/* ===== WRAPPER for screenshot capture ===== */}
      <div ref={profileRef} className="bg-[#F3F2F0] dark:bg-background">
        {/* ===== COVER SECTION (LinkedIn style) ===== */}
        <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden bg-gradient-to-r from-accent/5 to-primary/5">
          {coverSrc ? (
            <>
              <img
                src={coverSrc}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Subtle overlay — keeps the cover photo prominent */}
              <div className={`absolute inset-0 bg-gradient-to-r ${coverGrad} opacity-40`} />
            </>
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${coverGrad}`} />
          )}

          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 z-20 bg-background/80 backdrop-blur-sm hover:bg-card rounded-full p-2 border border-border/20 transition-all hover:scale-105"
              title="Edit profile"
            >
              <Camera className="w-4 h-4 text-foreground" />
            </button>
          )}

          {/* Subtle bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F3F2F0] dark:from-background to-transparent" />
        </div>

        {/* ===== PROFILE HEADER (LinkedIn style card — NO shadow) ===== */}
        <div className="max-w-6xl mx-auto px-4 -mt-10 md:-mt-16 relative z-10">
          <div className="bg-card rounded-lg border border-border">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Avatar — LinkedIn style */}
                <div className="relative shrink-0 self-center md:self-start -mt-14 md:-mt-20">
<div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-background dark:ring-card">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={trainer.avatar} className="object-cover" />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-accent to-accent/80 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditOpen(true)}
                        className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                  {trainer.isTrainerApproved !== false && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-green-600 rounded-full p-1 border-[2.5px] border-card dark:border-card">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {trainer.isTrainerApproved === false && trainer.trainerApplication?.status === 'pending' && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-1 border-[2.5px] border-card dark:border-card">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0 text-center md:text-left pt-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-0.5">
                    <h1 className="text-xl md:text-2xl font-bold text-card-foreground truncate leading-tight">
                      {trainer.fullName || trainer.username}
                    </h1>
                    {trainer.isTrainerApproved !== false ? (
                      <Badge className="bg-green-600 dark:bg-green-700 text-white border-0 text-[11px] px-2.5 py-0.5 rounded-full w-fit mx-auto md:mx-0 font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : trainer.trainerApplication?.status === 'pending' ? (
                      <Badge className="bg-amber-500 text-white border-0 text-[11px] px-2.5 py-0.5 rounded-full w-fit mx-auto md:mx-0 font-medium">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    ) : null}
                  </div>

                  {trainer.title && (
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      {trainer.title}
                    </p>
                  )}

                  {/* Meta row — inline, compact */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                    {trainer.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground/60" />
                        {trainer.location}
                      </span>
                    )}
                    {trainer.trainerApplication?.experienceYears && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        {trainer.trainerApplication.experienceYears}+ years
                      </span>
                    )}
                    {totalStudents > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground/60" />
                        {totalStudents}+ students
                      </span>
                    )}
                    {courses.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-muted-foreground/60" />
                        {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                      </span>
                    )}
                    {programs.length > 0 && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-muted-foreground/60" />
                        {programs.length} {programs.length === 1 ? 'program' : 'programs'}
                      </span>
                    )}
                  </div>

                  {/* Connections / followers stat */}
                  {trainer.xp > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-semibold text-card-foreground">{trainer.xp}</span> XP earned
                    </p>
                  )}

                  {/* Action Buttons — LinkedIn style */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {isOwnProfile && (
                      <Button
                        onClick={() => setEditOpen(true)}
                        className="gap-1.5 rounded-full h-8 px-4 bg-accent hover:bg-accent/90 text-xs font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit Profile
                      </Button>
                    )}

                    {/* Share dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="gap-1.5 rounded-full h-8 px-4 border-border text-xs font-semibold text-foreground/80 hover:bg-muted/50 dark:hover:bg-muted/30"
                        >
                          {copied ? (
                            <><Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Copied</>
                          ) : (
                            <><Share2 className="w-3.5 h-3.5" /> Share</>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 p-1.5 border-border">
                        <DropdownMenuItem onClick={handleShareProfile} className="rounded-md text-sm gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                            <Share2 className="w-4 h-4 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">Copy Link</p>
                            <p className="text-[11px] text-muted-foreground">Share profile URL</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleShareLinkedIn} className="rounded-md text-sm gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">LinkedIn</p>
                            <p className="text-[11px] text-muted-foreground">Share on LinkedIn</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShareTwitter} className="rounded-md text-sm gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                            <Twitter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">X (Twitter)</p>
                            <p className="text-[11px] text-muted-foreground">Share on X</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShareFacebook} className="rounded-md text-sm gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Facebook className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">Facebook</p>
                            <p className="text-[11px] text-muted-foreground">Share on Facebook</p>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDownloadImage} disabled={capturing} className="rounded-md text-sm gap-3 cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            {capturing ? (
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">Download Image</p>
                            <p className="text-[11px] text-muted-foreground">Save as PNG for ads</p>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Social Icons */}
                    <div className="flex items-center gap-0.5 ml-1">
                      {trainer.trainerApplication?.websiteUrl && (
                        <a href={trainer.trainerApplication.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-accent/10">
                            <Globe className="w-4 h-4 text-muted-foreground/70 hover:text-accent" />
                          </Button>
                        </a>
                      )}
                      {trainer.trainerApplication?.linkedinProfile && (
                        <a href={trainer.trainerApplication.linkedinProfile} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-blue-500/10">
                            <Linkedin className="w-4 h-4 text-muted-foreground/70 hover:text-blue-500" />
                          </Button>
                        </a>
                      )}
                      {trainer.trainerApplication?.githubProfile && (
                        <a href={trainer.trainerApplication.githubProfile} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-muted">
                            <Github className="w-4 h-4 text-muted-foreground/70 hover:text-foreground" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Section Tabs */}
            <div className="border-t border-border px-4 md:px-6">
              <div className="flex gap-6 overflow-x-auto scrollbar-none -mb-px">
                <button
                  onClick={() => setActiveSection("about")}
                  className={`py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === "about"
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-card-foreground hover:border-border"
                  }`}
                >
                  About
                </button>
                {programs.length > 0 && (
                  <button
                    onClick={() => setActiveSection("programs")}
                    className={`py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeSection === "programs"
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground hover:text-card-foreground hover:border-border"
                    }`}
                  >
                    Programs ({programs.length})
                  </button>
                )}
                {courses.length > 0 && (
                  <button
                    onClick={() => setActiveSection("courses")}
                    className={`py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeSection === "courses"
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground hover:text-card-foreground hover:border-border"
                    }`}
                  >
                    Courses ({courses.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TAB CONTENT (only active tab shown — avoids scroll on mobile) ===== */}
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="grid md:grid-cols-3 gap-3 md:gap-4 items-start">
            {/* RIGHT SIDEBAR — visible on desktop */}
            <div className="hidden md:block md:col-span-1 space-y-3">
              {/* Credentials card */}
              {qualifications.length > 0 && (
                <Card className="border border-border bg-card rounded-lg">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-card-foreground text-sm mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-accent" /> Credentials
                    </h3>
                    <div className="space-y-2">
                      {qualifications.map((q: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle className="w-3 h-3 text-accent" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">{q}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Specialties card */}
              {specialties.length > 0 && (
                <Card className="border border-border bg-card rounded-lg">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-card-foreground text-sm mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" /> Specialties
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {specialties.map((s: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/15 text-[11px] font-medium hover:bg-accent/20 transition-colors rounded-full">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* LEFT MAIN CONTENT — only active tab shown */}
            <div className="md:col-span-2 space-y-3">
              {activeSection === "about" && (
                <>
                  {/* ===== PROFILE COMPLETION CARD (own profile only) ===== */}
                  {isOwnProfile && isMissingInfo && (
                    <Card className="border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-amber-700 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Complete Your Profile
                        </h3>
                        <p className="text-xs text-amber-600 dark:text-amber-300 mb-3">
                          Fill in the missing fields below to get approved as a trainer. Click the Edit Profile button to update them.
                        </p>
                        <div className="space-y-2">
                          {missingFields.map((field) => (
                            <div key={field.key} className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                              <div className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span>{field.label}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => setEditOpen(true)}
                          size="sm"
                          className="mt-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Complete Profile
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border border-border bg-card rounded-lg">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-card-foreground text-sm mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-accent" /> About {trainer.fullName || trainer.username}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{trainer.bio || "No bio available."}</p>
                      {trainer.trainerApplication?.teachingPhilosophy && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <HeartHandshake className="w-3 h-3 text-accent" /> Teaching Philosophy
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            "{trainer.trainerApplication.teachingPhilosophy}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Courses preview — puts courses front and centre on landing */}
                  {courses.length > 0 && (
                    <Card className="border border-border bg-card rounded-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-card-foreground text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-accent" /> Courses
                          </h3>
                          <button
                            onClick={() => setActiveSection("courses")}
                            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                          >
                            View all ({courses.length}) <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {courses.slice(0, 2).map((course: any) => (
                            <Link
                              key={course.id}
                              to={`/courses/${course.id}`}
                              className="group flex items-center gap-3 rounded-lg border border-border/60 hover:border-accent/40 hover:bg-accent/5 transition-all p-2"
                            >
                              <div className="w-16 h-12 rounded-md overflow-hidden bg-gradient-to-br from-accent/10 to-primary/10 shrink-0">
                                {course.thumbnail ? (
                                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-muted-foreground/40" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold line-clamp-1 group-hover:text-accent transition-colors">{course.title}</p>
                                <p className="text-[10px] font-bold text-accent mt-0.5">
                                  {course.price > 0 ? formatPrice(course.price) : "Free"}
                                </p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Credentials (mobile only — sidebar handles desktop) */}
                  {qualifications.length > 0 && (
                    <Card className="border border-border bg-card rounded-lg md:hidden">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-card-foreground text-sm mb-3 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-accent" /> Credentials
                        </h3>
                        <div className="space-y-2">
                          {qualifications.map((q: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle className="w-3 h-3 text-accent" />
                              </div>
                              <p className="text-xs text-muted-foreground leading-snug">{q}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Specialties (mobile only — sidebar handles desktop) */}
                  {specialties.length > 0 && (
                    <Card className="border border-border bg-card rounded-lg md:hidden">
                      <CardContent className="p-4">
                        <h3 className="font-bold text-card-foreground text-sm mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" /> Specialties
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {specialties.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/15 text-[11px] font-medium hover:bg-accent/20 transition-colors rounded-full">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {activeSection === "courses" && courses.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-card-foreground flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-accent" /> Courses ({courses.length})
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {courses.map((course: any, i: number) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link to={`/courses/${course.id}`} className="block group">
                          <Card className="h-full overflow-hidden border border-border bg-card rounded-lg hover:border-accent/40 transition-all duration-200">
                            <div className="aspect-[16/9] bg-gradient-to-br from-accent/5 to-primary/5 relative overflow-hidden">
                              {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                                {course.level && (
                                  <Badge variant="secondary" className="bg-background/90 text-card-foreground text-[10px] border-0 rounded">{course.level}</Badge>
                                )}
                              </div>
                            </div>
                            <CardContent className="p-3">
                              <h4 className="font-semibold text-xs line-clamp-2 group-hover:text-accent transition-colors mb-1">{course.title}</h4>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{course.studentsEnrolledCount || 0}</span>
                                <span className="capitalize">{course.category}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                <span className="text-xs font-bold text-accent">
                                  {course.discountPrice > 0 ? (
                                    <>
                                      {formatPrice(course.discountPrice)}{" "}
                                      <span className="line-through text-muted-foreground/50 font-medium">{formatPrice(course.price)}</span>
                                    </>
                                  ) : course.price > 0 ? (
                                    formatPrice(course.price)
                                  ) : (
                                    "Free"
                                  )}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-accent transition-colors">
                                  View course <ChevronRight className="w-3 h-3 inline" />
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "courses" && courses.length === 0 && (
                <Card className="border border-border bg-card rounded-lg">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No courses published yet.</p>
                  </CardContent>
                </Card>
              )}

              {activeSection === "programs" && programs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-card-foreground flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-accent" /> Programs ({programs.length})
                  </h2>
                  <div className="space-y-2">
                    {programs.map((program: any, i: number) => (
                      <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link to={`/opportunity/${program.id}`} className="block group">
                          <Card className="border border-border bg-card rounded-lg hover:border-accent/40 transition-all duration-200 group-hover:border-accent/40 cursor-pointer">
                            <CardContent className="p-3.5 flex items-start gap-3">
                              {program.image ? (
                                <img
                                  src={program.image}
                                  alt={program.title}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center shrink-0">
                                  <GraduationCap className="w-5 h-5 text-accent" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h4 className="font-semibold text-sm group-hover:text-accent transition-colors">{program.title}</h4>
                                  {program.status && (
                                    <Badge variant="outline" className="text-[10px] capitalize border-border text-muted-foreground">{program.status}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{program.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-accent" />{program.duration}</span>
                                  {program.price > 0 && (
                                    <span className="font-bold text-accent">{formatPrice(program.price)}</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all self-center shrink-0" />
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "programs" && programs.length === 0 && (
                <Card className="border border-border bg-card rounded-lg">
                  <CardContent className="p-6 text-center">
                    <GraduationCap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No programs available yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
