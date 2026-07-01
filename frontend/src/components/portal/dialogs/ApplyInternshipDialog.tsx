import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { APPLY_TO_INTERNSHIP_PROGRAM } from "@/lib/graphql/mutations";
import { GET_INTERNSHIP_PROGRAM, GET_INTERNSHIP_PROGRAMS, GET_MY_INTERNSHIP_APPLICATIONS, GET_ME, GET_MY_INTERNSHIP } from "@/lib/graphql/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { 
  Briefcase, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  History,
  Target,
  Sparkles,
  Info,
  ChevronRight,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

type Step = "info" | "success";

interface ApplyInternshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internshipProgramId: string;
  onSuccess?: () => void;
}

export function ApplyInternshipDialog({
  open,
  onOpenChange,
  internshipProgramId,
  onSuccess
}: ApplyInternshipDialogProps) {
  const [step, setStep] = useState<Step>("info");
  const [isRestored, setIsRestored] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const { addToCart } = useCart();

  // Form State
  const [skills, setSkills] = useState<string>("");
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [availability, setAvailability] = useState<string>("");
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Fetch program details (no auth required)
  const { data: programData, loading: isLoadingProgram } = useQuery(GET_INTERNSHIP_PROGRAM, {
    variables: { id: internshipProgramId },
    skip: !internshipProgramId || !open,
  });

  // Read myApplications from the already-cached programs query
  const { data: catalogData } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    skip: !open,
    fetchPolicy: 'cache-first',
  });

  const program = (programData as any)?.internshipProgram;
  const myApplications = (catalogData as any)?.myInternshipApplications || [];
  const hasAlreadyApplied = myApplications.some((app: any) => app.internshipProgramId === internshipProgramId);

  // Persistence (Memo) Logic
  useEffect(() => {
    if (open && internshipProgramId) {
      const saved = localStorage.getItem(`internship_draft_${internshipProgramId}`);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setSkills(draft.skills || "");
          setPortfolioUrl(draft.portfolioUrl || "");
          setResumeUrl(draft.resumeUrl || "");
          setAvailability(draft.availability || "");
          setSelectedDeliveryMode(draft.selectedDeliveryMode || "");
          setAnswers(draft.answers || {});
          setIsRestored(true);
          setTimeout(() => setIsRestored(false), 3000);
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      }
    }
  }, [open, internshipProgramId]);

  useEffect(() => {
    if (open && internshipProgramId && step === "info") {
      const draft = {
        skills,
        portfolioUrl,
        resumeUrl,
        availability,
        selectedDeliveryMode,
        answers,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`internship_draft_${internshipProgramId}`, JSON.stringify(draft));
    }
  }, [skills, portfolioUrl, resumeUrl, availability, selectedDeliveryMode, answers, open, internshipProgramId, step]);

  const [applyMutation, { loading: isSubmitting }] = useMutation(APPLY_TO_INTERNSHIP_PROGRAM, {
    onCompleted: (data) => {
      const application = (data as any)?.applyToInternshipProgram;
      setStep("success");
      localStorage.removeItem(`internship_draft_${internshipProgramId}`);
      toast.success("Application submitted successfully!");
      if (onSuccess) onSuccess();
      
      // If program requires payment, prepare it
      if (application?.payment && application.payment.status !== 'paid') {
          addToCart({
            id: internshipProgramId,
            title: `Application: ${program.title}`,
            price: application.payment.amount,
            type: "internship"
          });
      }
    },
    onError: (error) => {
        if (error.message.includes("11000") || error.message.includes("duplicate key")) {
            toast.error("You have already applied for this program.");
        } else {
            toast.error(error.message);
        }
    },
    refetchQueries: [
      { query: GET_INTERNSHIP_PROGRAMS },
      { query: GET_MY_INTERNSHIP_APPLICATIONS },
      { query: GET_ME },
      { query: GET_MY_INTERNSHIP },
    ]
  });

  const handleApply = async () => {
    if (!skills || !availability) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and validation.");
      return;
    }

    const applicationAnswers = Object.entries(answers).map(([label, answer]) => ({
      questionLabel: label,
      answer: String(answer),
    }));

    await applyMutation({
      variables: {
        internshipProgramId,
        skills: skills.split(",").map((s) => s.trim()),
        portfolioUrl,
        resumeUrl,
        availability,
        selectedDeliveryMode,
        applicationAnswers,
      },
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAnswerChange = (label: string, value: string) => {
    setAnswers(prev => ({ ...prev, [label]: value }));
  };

  const handleCheckboxChange = (label: string, option: string, checked: boolean) => {
    const current = (answers[label] || "").split(", ").filter(i => i.length > 0);
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter(i => i !== option);
    }
    handleAnswerChange(label, updated.join(", "));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-border/50 rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                <span>Apply for Internship</span>
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                {program?.title || "Loading..."}
              </DialogDescription>
            </div>
            {isRestored && (
              <div className="flex items-center gap-1.5 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 animate-in fade-in slide-in-from-top-1">
                <History className="w-3 h-3" />
                Draft Restored
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoadingProgram ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground font-medium">Initializing application tracker...</p>
          </div>
                ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {hasAlreadyApplied && (
                  <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Application Submitted</p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                        You have already submitted an application for this internship program. 
                        You can view your submitted details below, but editing is disabled while pending.
                      </p>
                    </div>
                  </div>
                )}
                {step === "info" ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Candidate Profile */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                            <Target className="w-4 h-4 text-accent" />
                            <h5 className="text-xs font-bold uppercase tracking-widest text-foreground/70">Candidate Profile</h5>
                        </div>
                        
                        <div className="grid gap-6">
                            <div className="space-y-2.5">
                                <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 leading-relaxed">
                                    Relevant Technical Skills <span className="text-red-500 font-black">•</span>
                                </Label>
                                <Input 
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    placeholder="React, TypeScript, UI Design, etc."
                                    className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                                    disabled={hasAlreadyApplied}
                                />
                                <p className="text-[10px] text-muted-foreground pl-1">List major skills separated by commas</p>
                            </div>

                            <div className="space-y-2.5">
                                <Label className="text-xs font-bold text-foreground/80">Availability Status <span className="text-red-500 font-black">•</span></Label>
                                <Select value={availability} onValueChange={setAvailability} disabled={hasAlreadyApplied}>
                                    <SelectTrigger className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl">
                                        <SelectValue placeholder="How much time can you commit?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time (40+ hrs/week)</SelectItem>
                                        <SelectItem value="Part-time">Part-time (20+ hrs/week)</SelectItem>
                                        <SelectItem value="Flexible">Flexible / Weekend</SelectItem>
                                        <SelectItem value="Trainee">Trainee (During studies)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {program?.allowedDeliveryModes?.length > 0 && (
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 leading-relaxed">
                                        Preferred Delivery Mode <span className="text-red-500 font-black">•</span>
                                    </Label>
                                    <Select value={selectedDeliveryMode} onValueChange={setSelectedDeliveryMode} disabled={hasAlreadyApplied}>
                                        <SelectTrigger className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl">
                                            <SelectValue placeholder="How do you want to attend?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {program.allowedDeliveryModes.map((mode: string) => (
                                                <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-foreground/80">Portfolio URL (Optional)</Label>
                                    <Input 
                                        value={portfolioUrl}
                                        onChange={(e) => setPortfolioUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-xs font-bold text-foreground/80">Resume Link (Optional)</Label>
                                    <Input 
                                        value={resumeUrl}
                                        onChange={(e) => setResumeUrl(e.target.value)}
                                        placeholder="Google Drive, Dropbox, etc."
                                        className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Program Custom Questions */}
                    {program?.applicationQuestions?.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <h5 className="text-xs font-bold uppercase tracking-widest text-foreground/70">Program-Specific Questions</h5>
                            </div>
                            
                            <div className="grid gap-6">
                                {program.applicationQuestions.map((q: any) => (
                                <div key={q.label} className="space-y-3">
                                    <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 leading-relaxed">
                                    {q.label} {q.required && <span className="text-red-500 font-black">•</span>}
                                    </Label>
                                    
                                    {q.type === 'textarea' ? (
                                        <Textarea
                                            value={answers[q.label] || ""}
                                            onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                                            placeholder="Write your response here..."
                                            rows={4}
                                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-2xl resize-none"
                                        />
                                    ) : q.type === 'select' ? (
                                        <Select 
                                            value={answers[q.label] || ""} 
                                            onValueChange={(val) => handleAnswerChange(q.label, val)}
                                        >
                                            <SelectTrigger className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl">
                                            <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {q.options?.map((opt: string) => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                    ) : q.type === 'radio' ? (
                                        <RadioGroup 
                                            value={answers[q.label] || ""}
                                            onValueChange={(val) => handleAnswerChange(q.label, val)}
                                            className="flex flex-col gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50"
                                        >
                                            {q.options?.map((opt: string) => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`${q.label}-${opt}`} />
                                                    <Label htmlFor={`${q.label}-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    ) : q.type === 'checkbox' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                            {q.options?.map((opt: string) => (
                                                <div key={opt} className="flex items-center gap-2">
                                                    <Checkbox 
                                                        id={`${q.label}-${opt}`}
                                                        checked={(answers[q.label] || "").split(", ").includes(opt)}
                                                        onCheckedChange={(checked) => handleCheckboxChange(q.label, opt, checked as boolean)}
                                                    />
                                                    <Label htmlFor={`${q.label}-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : q.type === 'file' ? (
                                        <div className="space-y-2">
                                            {answers[q.label] ? (
                                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-2xl border border-border/30">
                                                    <FileText className="w-5 h-5 text-accent" />
                                                    <span className="text-xs text-muted-foreground flex-1 truncate">
                                                        File uploaded
                                                    </span>
                                                    <a 
                                                        href={answers[q.label]} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-accent hover:underline flex items-center gap-1"
                                                    >
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleAnswerChange(q.label, '')}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <FileUpload
                                                    folder="internship-applications"
                                                    accept={q.acceptedFileTypes?.join(',') || '.pdf,.doc,.docx,.jpg,.png'}
                                                    maxSizeMB={q.maxFileSize || 10}
                                                    label={q.required ? 'Upload Required Document' : 'Upload File (Optional)'}
                                                    onUploadComplete={(url) => handleAnswerChange(q.label, url)}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <Input
                                            type={q.type === 'number' ? 'number' : 'text'}
                                            value={answers[q.label] || ""}
                                            onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                                            placeholder="Your answer..."
                                            className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                                        />
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-accent/5 p-6 rounded-3xl flex items-start gap-4 border border-accent/20 transition-all hover:bg-accent/10">
                        <Checkbox 
                            id="terms" 
                            checked={agreeToTerms} 
                            onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                            className="mt-1"
                        />
                        <div className="space-y-1.5">
                            <Label htmlFor="terms" className="text-sm font-bold leading-none cursor-pointer text-foreground">
                                Professional Commitment
                            </Label>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                I confirm my availability for the selected duration and agree that my application will be reviewed based on the current track requirements.
                            </p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="space-y-2 px-2">
                        <h3 className="text-2xl font-black">Application Received!</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your application for <strong>{program?.title}</strong> was submitted successfully. 
                            {program?.price > 0 
                                ? " It has been added to your cart for checkout." 
                                : " Our team will review your profile and get back to you within 3-5 business days."}
                        </p>
                    </div>
                    <Button 
                        variant="gold" 
                        className="w-full h-12 rounded-xl text-sm font-bold shadow-premium flex items-center gap-2 group" 
                        onClick={() => {
                            handleClose();
                        }}
                    >
                        {program?.price > 0 ? (
                            <>
                                View Cart & Checkout
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        ) : "Close"}
                    </Button>
                  </div>
                )}
              </div>

              {/* ACTION FOOTER */}
              {step === "info" && (
                  <div className="px-6 py-5 border-t bg-muted/5 flex items-center justify-between gap-3 flex-shrink-0">
                      <Button variant="ghost" className="text-muted-foreground font-bold hover:bg-muted/10 rounded-xl h-12 px-6" onClick={handleClose}>
                          Cancel
                      </Button>
                      <Button
                          variant="gold"
                          className="px-10 h-12 rounded-xl gap-2 shadow-premium hover:-translate-y-0.5 transition-all text-sm font-bold flex items-center justify-center min-w-[180px]"
                          onClick={handleApply}
                          disabled={isSubmitting}
                      >
                          {isSubmitting ? (
                              <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                              </>
                          ) : (
                              <>
                                  {program?.price > 0 ? "Submit & Pay" : "Submit Application"}
                                  <ArrowRight className="w-4 h-4" />
                              </>
                          )}
                      </Button>
                  </div>
              )}
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
