// CreateInternship — standalone internship program creation wizard
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/FileUpload";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  BookOpen,
  Image as ImageIcon,
  Settings,
  DollarSign,
  Rocket,
  Info,
  Loader2,
  AlertCircle,
  Layout,
  Users,
  Trophy,
  Globe,
  Sparkles,
  Eye,
  Calendar,
  ExternalLink,
  FileText,
  HelpCircle,
  Trash2,
  Plus,
  ChevronUp,
  Upload,
  Clock,
  Briefcase,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { CREATE_INTERNSHIP_PROGRAM } from "@/lib/graphql/mutations";
import { GET_INTERNSHIP_PROGRAMS, GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Identity", description: "Program Identity", icon: Layout },
  { id: 2, title: "Timeline", description: "Dates & Pricing", icon: Calendar },
  { id: 3, title: "Questions", description: "Application Questions", icon: HelpCircle },
  { id: 4, title: "Logistics", description: "Delivery & Certificate", icon: Users },
  { id: 5, title: "Launch", description: "Final Verification", icon: Rocket },
];

type Question = {
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  maxFileSize?: number;
  acceptedFileTypes?: string[];
};

export default function CreateInternship() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "3 Months",
    startDate: "",
    endDate: "",
    applicationDeadline: "",
    price: 0,
    currency: "RWF",
    image: "",
    signerName: "",
    signerSignature: "",
    allowedDeliveryModes: ["online"] as string[],
    eligibility: [] as string[],
    rules: "",
    maxSpots: 0,
    discount: 0,
    applicationQuestions: [] as Question[],
  });

  const [createProgram] = useMutation(CREATE_INTERNSHIP_PROGRAM, {
    refetchQueries: [
      { query: GET_INTERNSHIP_PROGRAMS },
      { query: GET_ADMIN_DASHBOARD_DATA },
    ],
    onCompleted: () => {
      toast.success("Internship program launched successfully!");
      navigate("/portal/admin/internships");
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    },
  });

  const handleNext = () => {
    if (currentStep === 1 && (!formData.title || !formData.description)) {
      toast.error("Identity check failed: Missing title or description.");
      return;
    }
    if (currentStep === 2 && (!formData.startDate || !formData.endDate)) {
      toast.error("Timeline check failed: Missing start or end date.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createProgram({
        variables: {
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          startDate: formData.startDate,
          endDate: formData.endDate,
          applicationDeadline: formData.applicationDeadline,
          price: Number(formData.price) || 0,
          currency: formData.currency,
          image: formData.image || undefined,
          applicationQuestions: formData.applicationQuestions.length > 0 ? formData.applicationQuestions : undefined,
          signerName: formData.signerName || undefined,
          signerSignature: formData.signerSignature || undefined,
          eligibility: formData.eligibility.length > 0 ? formData.eligibility.join('\n') : undefined,
          rules: formData.rules || undefined,
          maxSpots: formData.maxSpots > 0 ? formData.maxSpots : undefined,
          discount: formData.discount > 0 ? formData.discount : undefined,
        },
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      applicationQuestions: [
        ...formData.applicationQuestions,
        { label: "", type: "text", required: true, options: [], maxFileSize: 10, acceptedFileTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"] },
      ],
    });
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    const newQs = [...formData.applicationQuestions];
    newQs[idx] = { ...newQs[idx], ...patch };
    setFormData({ ...formData, applicationQuestions: newQs });
  };

  const removeQuestion = (idx: number) => {
    setFormData({
      ...formData,
      applicationQuestions: formData.applicationQuestions.filter((_, i) => i !== idx),
    });
  };

  return (
    <PortalLayout>
      <div className="min-h-[calc(100vh-100px)] flex gap-6 lg:p-4">
        {/* LEFT SIDEBAR */}
        <aside className="hidden xl:flex w-72 flex-col gap-4">
          <div className="glass-card rounded-[2rem] p-8 flex flex-col gap-8 h-full">
            <div className="space-y-2">
              <h2 className="text-xl font-heading text-gradient-gold font-bold">Launchpad</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">
                Internship Creation Engine
              </p>
            </div>

            <nav className="flex flex-col gap-6">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button
                    key={step.id}
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                    className={cn(
                      "flex items-center gap-4 group transition-all duration-500 text-left",
                      isActive ? "opacity-100" : "opacity-40 hover:opacity-100"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                        isActive
                          ? "bg-accent shadow-gold text-accent-foreground scale-110"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground group-hover:scale-105"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-black uppercase tracking-widest leading-none",
                          isActive ? "text-accent" : "text-foreground"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">{step.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">Creator Pro Tip</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Programs with clear descriptions and well-defined questions attract 3x more qualified applicants.
              </p>
            </div>
          </div>
        </aside>

        {/* CENTER FORM */}
        <main className="flex-1 flex flex-col gap-6">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5 font-black uppercase text-[10px]">
                    Step {currentStep} of {STEPS.length}
                  </Badge>
                  <h1 className="text-4xl lg:text-5xl font-heading font-bold">{STEPS[currentStep - 1].title}</h1>
                  <p className="text-muted-foreground text-lg">{STEPS[currentStep - 1].description}</p>
                </div>

                {/* STEP 1: IDENTITY */}
                {currentStep === 1 && (
                  <div className="grid gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Program Image
                      </label>
                      {formData.image ? (
                        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border-2 border-accent/20 group">
                          <img src={formData.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              onClick={() => setFormData({ ...formData, image: "" })}
                              className="rounded-2xl"
                            >
                              Replace Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <FileUpload
                          folder="internships"
                          label="Upload a compelling program billboard image (1920x1080)"
                          onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Program Title
                      </label>
                      <Input
                        placeholder="e.g. Full-Stack Web Development or Graphic Design Mastery"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="h-16 text-xl font-heading bg-muted/20 border-border/40 transition-all focus:border-accent/60 rounded-2xl px-6"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Detailed Description
                      </label>
                      <Textarea
                        placeholder="Describe what interns will learn, the structure, and what they'll achieve..."
                        rows={8}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="bg-muted/20 border-border/40 focus:border-accent/60 rounded-2xl p-6 text-base leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          Duration
                        </label>
                        <Input
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          placeholder="e.g. 3 Months"
                          className="h-12 bg-muted/20 border-border/40 rounded-xl"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          Max Spots (0 = unlimited)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={formData.maxSpots}
                          onChange={(e) => setFormData({ ...formData, maxSpots: parseInt(e.target.value) || 0 })}
                          className="h-12 bg-muted/20 border-border/40 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: TIMELINE & PRICING */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 space-y-8">
                      <h3 className="text-2xl font-heading font-black flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-accent" />
                        Program Timeline
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Start Date
                          </label>
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            End Date
                          </label>
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Application Deadline
                          </label>
                          <Input
                            type="date"
                            value={formData.applicationDeadline}
                            onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-8">
                      <h3 className="text-2xl font-heading font-black flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-amber-500" />
                        Pricing
                      </h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Price (RWF)
                          </label>
                          <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            placeholder="0 = Free"
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Discount (%)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Currency
                          </label>
                          <Input
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="h-12 bg-muted/20 border-border/40 rounded-xl"
                          />
                        </div>
                      </div>
                      {formData.price > 0 && formData.discount > 0 && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <p className="text-sm font-bold text-amber-500">
                            Discounted Price:{" "}
                            {Math.round(formData.price * (1 - formData.discount / 100)).toLocaleString()} RWF
                            <span className="ml-2 text-xs line-through opacity-60">
                              {formData.price.toLocaleString()} RWF
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: APPLICATION QUESTIONS */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-heading font-black flex items-center gap-2">
                          <HelpCircle className="w-6 h-6 text-accent" />
                          Custom Application Questions
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Collect specific information from applicants. Supports text, file uploads, selectors, and more.
                        </p>
                      </div>
                      <Button
                        onClick={addQuestion}
                        className="h-11 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest bg-accent text-accent-foreground hover:scale-[1.02] shadow-gold transition-transform"
                      >
                        <Plus className="w-4 h-4" /> Add Question
                      </Button>
                    </div>

                    {formData.applicationQuestions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/40 rounded-[2.5rem]">
                        <HelpCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-bold text-muted-foreground">No questions yet</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                          Add application questions to screen applicants effectively.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.applicationQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className="p-6 rounded-[2rem] border border-border/40 bg-muted/20 space-y-4 relative group hover:border-accent/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-black text-sm">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <Input
                                    value={q.label}
                                    onChange={(e) => updateQuestion(idx, { label: e.target.value })}
                                    placeholder="e.g. Years of Experience"
                                    className="h-10 font-bold bg-transparent border-transparent focus:border-border text-base placeholder:text-muted-foreground/30"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className="h-10 px-3 rounded-xl border border-border/40 bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none focus:border-accent/60"
                                  value={q.type}
                                  onChange={(e) => updateQuestion(idx, { type: e.target.value })}
                                >
                                  <option value="text">Text</option>
                                  <option value="textarea">Long Text</option>
                                  <option value="select">Select</option>
                                  <option value="radio">Radio</option>
                                  <option value="checkbox">Checkbox</option>
                                  <option value="file">File</option>
                                  <option value="number">Number</option>
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={() => removeQuestion(idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                                />
                                <span className="text-xs font-bold text-muted-foreground">Required</span>
                              </label>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-black uppercase",
                                  q.type === "file"
                                    ? "border-blue-500/30 text-blue-500"
                                    : q.type === "number"
                                    ? "border-purple-500/30 text-purple-500"
                                    : "border-border/50"
                                )}
                              >
                                {q.type}
                                {q.required ? " • Required" : " • Optional"}
                              </Badge>
                            </div>

                            {/* Options editor for select/radio/checkbox */}
                            {(q.type === "select" || q.type === "radio" || q.type === "checkbox") && (
                              <div className="pl-4 border-l-2 border-accent/30 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  Options
                                </label>
                                {(q.options || []).map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const opts = [...(formData.applicationQuestions[idx].options || [])];
                                        opts[oi] = e.target.value;
                                        updateQuestion(idx, { options: opts });
                                      }}
                                      placeholder={`Option ${oi + 1}`}
                                      className="h-8 text-xs flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => {
                                        const opts = (formData.applicationQuestions[idx].options || []).filter(
                                          (_, i) => i !== oi
                                        );
                                        updateQuestion(idx, { options: opts });
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-[10px]"
                                  onClick={() => {
                                    const opts = [...(formData.applicationQuestions[idx].options || []), ""];
                                    updateQuestion(idx, { options: opts });
                                  }}
                                >
                                  + Add Option
                                </Button>
                              </div>
                            )}

                            {/* File type config */}
                            {q.type === "file" && (
                              <div className="pl-4 border-l-2 border-blue-500/30 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  Max File Size (MB)
                                </label>
                                <Input
                                  type="number"
                                  value={q.maxFileSize || 10}
                                  onChange={(e) => updateQuestion(idx, { maxFileSize: parseInt(e.target.value) || 10 })}
                                  className="h-8 text-xs w-24"
                                  min={1}
                                  max={50}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: LOGISTICS */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                        <h3 className="text-xl font-heading font-black flex items-center gap-2 mb-6">
                          <Globe className="w-5 h-5 text-accent" />
                          Delivery Modes
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {["online", "physical", "hybrid"].map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                const modes = formData.allowedDeliveryModes.includes(mode)
                                  ? formData.allowedDeliveryModes.filter((m) => m !== mode)
                                  : [...formData.allowedDeliveryModes, mode];
                                setFormData({ ...formData, allowedDeliveryModes: modes });
                              }}
                              className={cn(
                                "p-6 rounded-2xl border-2 transition-all duration-300 text-center capitalize font-bold",
                                formData.allowedDeliveryModes.includes(mode)
                                  ? "bg-accent border-accent text-accent-foreground shadow-gold"
                                  : "bg-card border-border/50 hover:border-accent/40 text-muted-foreground"
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-card border border-border/40 space-y-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-border/10">
                        <Trophy className="w-5 h-5 text-accent" />
                        <h4 className="text-lg font-heading font-black">Certificate Configuration</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Signer Full Name
                          </label>
                          <Input
                            placeholder="e.g. Dr. John Smith"
                            value={formData.signerName}
                            onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                            className="h-12 bg-muted/30 border-border/40 rounded-xl focus:border-accent/40"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Signer Signature Image
                          </label>
                          {formData.signerSignature ? (
                            <div className="relative h-24 rounded-2xl overflow-hidden border border-border/40 bg-muted/30 p-2 flex items-center justify-center group/sig">
                              <img src={formData.signerSignature} className="h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/sig:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                  onClick={() => setFormData({ ...formData, signerSignature: "" })}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="h-[120px] rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 hover:border-accent/20 hover:bg-accent/5 transition-all">
                              <FileUpload
                                folder="signatures"
                                label="CLICK TO UPLOAD SIGNATURE"
                                onUploadComplete={(url) => setFormData({ ...formData, signerSignature: url })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-card border border-border/40 space-y-4">
                      <h4 className="text-lg font-heading font-black flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" />
                        Program Rules & Eligibility
                      </h4>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                          Eligibility Requirements (one per line)
                        </label>
                        <Textarea
                          placeholder="e.g. Must be 18+&#10;Basic programming knowledge&#10;Access to a laptop"
                          rows={4}
                          value={(formData.eligibility || []).join("\n")}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              eligibility: e.target.value.split("\n").filter(Boolean),
                            })
                          }
                          className="bg-muted/20 border-border/40 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                          Rules & Guidelines
                        </label>
                        <Textarea
                          placeholder="Any rules participants must follow..."
                          rows={4}
                          value={formData.rules}
                          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                          className="bg-muted/20 border-border/40 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: LAUNCH */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="glass-card rounded-[3rem] p-10 space-y-10 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
                      <div className="space-y-4">
                        <div className="w-20 h-20 rounded-[2rem] bg-accent shadow-gold mx-auto flex items-center justify-center text-accent-foreground">
                          <Rocket className="w-10 h-10 animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-heading font-black">Ready for Launch</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                          Your internship program is fully configured. Review the summary below and launch when ready.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: "Identity", val: formData.title ? "Verified" : "Missing", ok: !!formData.title },
                          { label: "Visuals", val: formData.image ? "Optimized" : "Empty", ok: !!formData.image },
                          { label: "Timeline", val: formData.startDate ? "Set" : "Missing", ok: !!formData.startDate },
                          {
                            label: "Questions",
                            val: formData.applicationQuestions.length > 0 ? `${formData.applicationQuestions.length} added` : "None",
                            ok: true,
                          },
                          { label: "Duration", val: formData.duration, ok: true },
                          {
                            label: "Price",
                            val: formData.price > 0 ? `${formData.price.toLocaleString()} RWF` : "Free",
                            ok: true,
                          },
                        ].map((x) => (
                          <div key={x.label} className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                              {x.label}
                            </p>
                            <p className={cn("text-xs font-bold", x.ok ? "text-green-500" : "text-amber-500")}>{x.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ACTION FOOTER */}
          <footer className="shrink-0 flex items-center justify-between p-8 glass-card rounded-[2.5rem] mt-auto">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="h-14 px-8 rounded-2xl gap-3 font-black uppercase text-[10px] tracking-widest text-muted-foreground hover:bg-muted/50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <div className="flex gap-4">
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  className="h-14 px-10 rounded-2xl gap-3 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest shadow-gold hover:scale-[1.02] transition-transform"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-14 px-14 rounded-2xl gap-3 bg-accent text-accent-foreground font-black uppercase text-[10px] tracking-widest shadow-gold hover:scale-[1.02] transition-transform"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Launch Program
                    </>
                  )}
                </Button>
              )}
            </div>
          </footer>
        </main>

        {/* RIGHT PREVIEW PANEL */}
        <aside className="hidden 2xl:flex w-[400px] flex-col gap-6">
          <div className="glass-card rounded-[2.5rem] flex flex-col h-full overflow-hidden">
            <div className="p-8 border-b border-border/10 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </p>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                <div className="w-2 h-2 rounded-full bg-green-500/40" />
              </div>
            </div>

            <div className="flex-1 p-8 flex flex-col justify-center gap-8 bg-gradient-to-b from-transparent to-accent/5">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Student Portal View
              </p>

              <motion.div
                initial={false}
                animate={{ scale: [0.98, 1], opacity: [0.9, 1] }}
                className="w-full aspect-[4/5] glass-card rounded-[3rem] overflow-hidden flex flex-col shadow-2xl group border-2 border-white/20"
              >
                <div className="relative h-[55%]">
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                        Asset Pending
                      </p>
                    </div>
                  )}
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest">
                      {formData.duration}
                    </div>
                  </div>
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest">
                    {formData.price > 0
                      ? `${formData.price.toLocaleString()} ${formData.currency}`
                      : "FREE"}
                  </div>
                </div>

                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-accent tracking-widest">Internship Program</p>
                    <h3 className="text-2xl font-heading font-black tracking-tight leading-none line-clamp-2 italic">
                      {formData.title || "Untitled Program"}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {formData.startDate
                        ? new Date(formData.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "TBD"}{" "}
                      -{" "}
                      {formData.endDate
                        ? new Date(formData.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "TBD"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border/10">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-accent" />
                      <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                        {formData.applicationQuestions.length} Questions
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-4">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent shadow-gold"
                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                  />
                </div>
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-accent">
                  Completion {((currentStep / STEPS.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PortalLayout>
  );
}
