import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@apollo/client/react";
import { BECOME_TRAINER } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import {
  Sparkles,
  GraduationCap,
  Star,
  DollarSign,
  Globe,
  Github,
  Linkedin,
  BookOpen,
  Users,
  User,
  Loader2,
  CheckCircle,
  Camera,
  Image as ImageIcon,
  ArrowRight,
  X,
} from "lucide-react";

interface BecomeTrainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeTrainerDialog({ open, onOpenChange }: BecomeTrainerDialogProps) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<"intro" | "media" | "form" | "success">("intro");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [coverImage, setCoverImage] = useState(user?.coverImage || "");

  const [form, setForm] = useState({
    specialties: "",
    experienceYears: "",
    teachingPhilosophy: "",
    qualifications: "",
    rateHourly: "",
    linkedinProfile: "",
    githubProfile: "",
    websiteUrl: "",
  });

  const [becomeTrainer, { loading }] = useMutation(BECOME_TRAINER, {
    onCompleted: (data: any) => {
      if (data?.becomeTrainer) {
        // Update local user state
        updateUser({
          role: "trainer",
          isTrainerApproved: data.becomeTrainer.isTrainerApproved,
          trainerApplication: data.becomeTrainer.trainerApplication,
        } as any);
        setStep("success");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = async () => {
    if (!form.specialties.trim()) {
      toast.error("Please enter at least one specialty");
      return;
    }

    const specialties = form.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await becomeTrainer({
      variables: {
        avatar: avatar || undefined,
        coverImage: coverImage || undefined,
        specialties,
        experienceYears: parseInt(form.experienceYears) || undefined,
        teachingPhilosophy: form.teachingPhilosophy || undefined,
        qualifications: form.qualifications
          ? form.qualifications.split(",").map((q) => q.trim()).filter(Boolean)
          : [],
        rateHourly: parseInt(form.rateHourly) || undefined,
        linkedinProfile: form.linkedinProfile || undefined,
        githubProfile: form.githubProfile || undefined,
        websiteUrl: form.websiteUrl || undefined,
      },
    });
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setStep("intro");
    setAvatar(user?.avatar || "");
    setCoverImage(user?.coverImage || "");
    setForm({
      specialties: "",
      experienceYears: "",
      teachingPhilosophy: "",
      qualifications: "",
      rateHourly: "",
      linkedinProfile: "",
      githubProfile: "",
      websiteUrl: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold">
                  Become a Trainer
                </DialogTitle>
                <DialogDescription className="text-base">
                  Share your knowledge and earn from teaching
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
                    <BookOpen className="w-5 h-5 text-accent mb-2" />
                    <p className="text-sm font-semibold">Create Courses</p>
                    <p className="text-xs text-muted-foreground">
                      Design and publish your own courses
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <Users className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-semibold">Coach Students</p>
                    <p className="text-xs text-muted-foreground">
                      Mentor and guide learners
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <Star className="w-5 h-5 text-green-500 mb-2" />
                    <p className="text-sm font-semibold">Offer Scholarships</p>
                    <p className="text-xs text-muted-foreground">
                      Help students with financial support
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <DollarSign className="w-5 h-5 text-blue-500 mb-2" />
                    <p className="text-sm font-semibold">Earn Income</p>
                    <p className="text-xs text-muted-foreground">
                      Get paid for your expertise
                    </p>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> You'll need to upload a profile picture and cover image to get approved. Make sure you have them ready!
                  </p>
                </div>

                <Button
                  onClick={() => setStep("media")}
                  className="w-full h-12 text-base gap-2"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">Upload Your Photos</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setStep("intro")} className="text-xs">
                    Back
                  </Button>
                </div>
                <DialogDescription>
                  Add a profile picture and cover image to complete your trainer profile
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Profile Picture */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-accent" /> Profile Picture *
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted ring-2 ring-accent/20 flex items-center justify-center">
                        {avatar ? (
                          <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <FileUpload
                        onUploadComplete={(url) => setAvatar(url)}
                        folder="trainer-avatars"
                        accept="image/*"
                        maxSizeMB={5}
                        label={avatar ? "Change Photo" : "Upload Photo"}
                      />
                      {avatar && (
                        <button
                          onClick={() => setAvatar("")}
                          className="text-[10px] text-red-500 hover:text-red-600 mt-1 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-accent" /> Cover Image *
                  </label>
                  <div className="space-y-2">
                    {coverImage && (
                      <div className="relative rounded-lg overflow-hidden h-24 bg-muted">
                        <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setCoverImage("")}
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
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

                <Button
                  onClick={() => setStep("form")}
                  disabled={!avatar || !coverImage}
                  className="w-full h-12 gap-2"
                >
                  Next: Fill in Your Expertise <ArrowRight className="w-4 h-4" />
                </Button>
                {(!avatar || !coverImage) && (
                  <p className="text-xs text-amber-500 text-center">
                    Please upload both a profile picture and a cover image to continue
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">Trainer Application</DialogTitle>
                  <Button variant="ghost" size="sm" onClick={() => setStep("media")} className="text-xs">
                    Back
                  </Button>
                </div>
                <DialogDescription>
                  Tell us about your expertise and teaching experience
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 text-accent" /> Specialties *
                  </label>
                  <Input
                    placeholder="e.g. JavaScript, Python, Data Science"
                    value={form.specialties}
                    onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Separate with commas</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 5"
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" /> Hourly Rate
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={form.rateHourly}
                      onChange={(e) => setForm({ ...form, rateHourly: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Qualifications / Certifications
                  </label>
                  <Input
                    placeholder="e.g. AWS Certified, Google UX, MSc Computer Science"
                    value={form.qualifications}
                    onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Separate with commas</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Teaching Philosophy
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Describe your approach to teaching and mentoring..."
                    value={form.teachingPhilosophy}
                    onChange={(e) => setForm({ ...form, teachingPhilosophy: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Online Presence
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-blue-500 shrink-0" />
                      <Input
                        placeholder="LinkedIn URL"
                        value={form.linkedinProfile}
                        onChange={(e) => setForm({ ...form, linkedinProfile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 shrink-0" />
                      <Input
                        placeholder="GitHub URL"
                        value={form.githubProfile}
                        onChange={(e) => setForm({ ...form, githubProfile: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent shrink-0" />
                      <Input
                        placeholder="Website / Portfolio URL"
                        value={form.websiteUrl}
                        onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !form.specialties.trim()}
                  className="w-full h-12 gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Submit Application</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Welcome, Trainer!</DialogTitle>
                <DialogDescription className="text-base">
                  Your application has been approved — you can start right away!
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-6">
                <div className="bg-accent/5 border border-accent/10 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm font-semibold">You're now a Trainer! 🎉</p>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Start creating courses right away</li>
                    <li>Manage your students and track their progress</li>
                    <li>Schedule meetings and mentorship sessions</li>
                    <li>Offer scholarships to help students grow</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/portal/trainer';
                    }}
                    className="flex-1 h-12 gap-2"
                  >
                    <GraduationCap className="w-4 h-4" /> Go to Trainer Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetAndClose}
                    className="h-12"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}