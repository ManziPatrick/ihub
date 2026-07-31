import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@apollo/client/react";
import { APPLY_TO_COURSE } from "@/lib/graphql/mutations";
import { MY_COURSE_APPLICATIONS } from "@/lib/graphql/queries";
import { toast } from "sonner";
import { Loader2, HelpCircle, CheckCircle, Clock, XCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ApplyCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any;
  onSuccess?: () => void;
}

export function ApplyCourseDialog({ open, onOpenChange, course, onSuccess }: ApplyCourseDialogProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: appData, loading: isLoadingApps } = useQuery(MY_COURSE_APPLICATIONS, {
    skip: !open || !course
  });

  const [applyToCourse] = useMutation(APPLY_TO_COURSE, {
    onCompleted: () => {
      onSuccess?.();
    }
  });

  const myApplications = (appData as any)?.myCourseApplications || [];
  const existingApplication = myApplications.find((app: any) => app.courseId === (course?.id || course?._id));

  // Set default delivery mode if only one is available
  useState(() => {
    if (course?.allowedDeliveryModes?.length === 1) {
      setSelectedDeliveryMode(course.allowedDeliveryModes[0]);
    }
  });

  const handleAnswerChange = (label: string, value: string) => {
    setAnswers(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missingFields = course.applicationQuestions
      ?.filter((q: any) => q.required && !answers[q.label])
      .map((q: any) => q.label);

    if (missingFields?.length > 0) {
      toast.error(`Please answer all required questions: ${missingFields.join(", ")}`);
      return;
    }

    if (course?.allowedDeliveryModes?.length > 1 && !selectedDeliveryMode) {
      toast.error("Please select a delivery mode");
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationAnswers = Object.entries(answers).map(([label, answer]) => ({
        questionLabel: label,
        answer: answer
      }));

      await applyToCourse({
        variables: {
          courseId: course.id || course._id,
          applicationAnswers,
          selectedDeliveryMode
        }
      });

      toast.success("Application submitted successfully! We will review it soon.");
      onSuccess?.();
      onOpenChange(false);
      setAnswers({}); // Clear answers
      setSelectedDeliveryMode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-md w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 border-accent/20 shadow-2xl rounded-none sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-accent" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {existingApplication ? "Application Status" : `Apply for ${course.title}`}
          </DialogTitle>
          <DialogDescription>
            {existingApplication 
              ? "Your application for this course is currently being processed." 
              : "This course requires an application. Please provide the details requested below."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingApps ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground font-medium">Checking application status...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-1 py-4 custom-scrollbar max-h-[60vh]">
              {existingApplication && (
                <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                  existingApplication.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 
                  existingApplication.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' : 
                  'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}>
                  <div className="mt-0.5">
                    {existingApplication.status === 'approved' ? <CheckCircle className="w-4 h-4" /> :
                     existingApplication.status === 'rejected' ? <XCircle className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">Application {existingApplication.status}</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {existingApplication.status === 'approved' 
                        ? "Great news! Your application has been approved. You can now start the course."
                        : existingApplication.status === 'rejected'
                        ? `Unfortunately, your application was not accepted. Reason: ${existingApplication.rejectionReason || 'No reason provided.'}`
                        : "Our team is currently reviewing your application. You will be notified once a decision is made."}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {course.applicationQuestions?.map((q: any) => (
                  <div key={q.label} className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </Label>
                    {q.type === 'textarea' ? (
                      <Textarea
                        value={answers[q.label] || ""}
                        onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                        placeholder="Your detailed answer..."
                        className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                        rows={3}
                        disabled={!!existingApplication && existingApplication.status !== 'rejected'}
                      />
                    ) : (
                      <Input
                        value={answers[q.label] || ""}
                        onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                        placeholder="Your answer..."
                        className="h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-xl"
                        disabled={!!existingApplication && existingApplication.status !== 'rejected'}
                      />
                    )}
                  </div>
                ))}

                {course.allowedDeliveryModes?.length > 0 && user?.role === 'student' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Preferred Delivery Mode <span className="text-red-500">*</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {course.allowedDeliveryModes.map((mode: string) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={selectedDeliveryMode === mode ? "gold" : "outline"}
                          size="sm"
                          className="rounded-full capitalize text-[10px] font-bold"
                          onClick={() => setSelectedDeliveryMode(mode)}
                          disabled={!!existingApplication && existingApplication.status !== 'rejected'}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-6 border-t flex items-center justify-between bg-muted/5 mt-auto">
              <Button 
                variant="ghost" 
                className="rounded-xl h-11" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="gold" 
                className="rounded-xl h-11 px-8 shadow-lg shadow-gold/20 font-bold" 
                onClick={handleSubmit}
                disabled={isSubmitting || (!!existingApplication && existingApplication.status !== 'rejected')}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : existingApplication ? "Update Application" : "Submit Application"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
