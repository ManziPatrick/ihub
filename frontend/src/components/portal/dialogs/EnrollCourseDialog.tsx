import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Clock, Star, CheckCircle, CreditCard, Smartphone, Check, FileText, XCircle } from "lucide-react";


import { useMutation } from "@apollo/client/react";
import { ENROLL_COURSE, PAY_FOR_COURSE, SUBMIT_PAYMENT_PROOF } from "@/lib/graphql/mutations";
import { GET_ME, GET_COURSES } from "@/lib/graphql/queries";
import { FileUpload } from "@/components/FileUpload";
import { PaymentForm } from "@/components/PaymentForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";


export function EnrollCourseDialog({ open, onOpenChange, course }: any) {
  const [step, setStep] = useState(1); // 1: Info, 3: Proof Upload, 4: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"paypack" | "manual">("paypack");


  const [enrollMutation] = useMutation(ENROLL_COURSE, {
    refetchQueries: [{ query: GET_ME }, { query: GET_COURSES }]
  });

  const [payForCourseMutation] = useMutation(PAY_FOR_COURSE);
  const [submitProofMutation] = useMutation(SUBMIT_PAYMENT_PROOF, {
    refetchQueries: [{ query: GET_ME }, { query: GET_COURSES }]
  });


  if (!course) return null;

  const finalPrice = course.discountPrice > 0 ? course.discountPrice : course.price;
  const isFree = finalPrice === 0;

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleEnroll = async () => {
    // Check if user is already enrolled
    const isEnrolled = user?.enrolledCourses?.includes(course.id || course._id);
    if (isEnrolled) {
      toast.info("You are already enrolled in this course!");
      // We still allow them to see the info, so we don't close it
      return;
    }

    setIsProcessing(true);
    try {
      if (isFree) {
        const targetCourseId = course.id || course._id;
        if (!targetCourseId) throw new Error("Course ID missing");

        await enrollMutation({
          variables: { courseId: targetCourseId, selectedDeliveryMode }
        });
        // Sync global user state immediately
        if (user) {
          const currentEnrolled = user.enrolledCourses || [];
          if (!currentEnrolled.includes(targetCourseId)) {
            updateUser({ enrolledCourses: [...currentEnrolled, targetCourseId] });
          }
        }
        toast.success(`Course Unlocked! Redirecting...`);
        onOpenChange(false);
        setTimeout(() => navigate(`/portal/student/courses/${targetCourseId}`), 800);
      } else {
        if (paymentMethod === "manual") {
          const targetCourseId = course.id || course._id;
          if (!targetCourseId) throw new Error("Course ID missing");

          const { data } = await payForCourseMutation({
            variables: {
              courseId: targetCourseId,
              amount: finalPrice,
              paymentMethod: 'Manual Payment (MoMo/PayPal)',
              selectedDeliveryMode
            }
          });

          if ((data as any)?.payForCourse?.id) {
            setPaymentId((data as any).payForCourse.id);
            setStep(3); // Go to proof upload
          } else {
            throw new Error("Failed to initiate payment");
          }
        } else {
          setStep(3); // Go to Paypack payment
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to proceed with enrollment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaypackSuccess = async () => {
    setIsProcessing(true);
    
    try {
      const targetCourseId = course.id || course._id;
      if (!targetCourseId) throw new Error("Course ID missing");

      console.log('Payment successful, confirming enrollment in background...');
      
      // The backend should have already enrolled the user via the webhook/poll responder
      // Mutation is used here to ensure we refetch all relevant data for the UI
      await enrollMutation({
        variables: { courseId: targetCourseId }
      });
      // Sync global user state immediately
      if (user) {
        const currentEnrolled = user.enrolledCourses || [];
        if (!currentEnrolled.includes(targetCourseId)) {
          updateUser({ enrolledCourses: [...currentEnrolled, targetCourseId] });
        }
      }

      setStep(4);
      toast.success(`Welcome to the course: ${course.title}!`);
    } catch (err: any) {
      console.error('Refetch/Enrollment confirmation error:', err);
      // Even if mutation fails (maybe already enrolled), we show success if payment was confirmed
      setStep(4);
      toast.info("Enrolled! Please refresh if the course doesn't appear in your dashboard.");
    } finally {
      setIsProcessing(false);
    }
  };




  const handleSubmitProof = async () => {
    if (!proofUrl) {
      toast.error("Please upload your proof of payment first");
      return;
    }

    setIsProcessing(true);
    try {
      await submitProofMutation({
        variables: {
          paymentId,
          proofUrl
        }
      });
      setStep(4);
      toast.success("Proof submitted! Awaiting admin verification.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proof");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setTimeout(() => {
          setStep(1);
          setPaymentMethod("paypack");
          setPaymentId(null);
          setProofUrl(null);
        }, 300);
      }

    }}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden border-2 border-accent/20 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold">
            {step === 1 && "Course Enrollment"}
            {step === 3 && (paymentMethod === "manual" ? "Submit Proof of Payment" : "Mobile Money Payment")}
            {step === 4 && (paymentMethod === "manual" ? "Enrollment Pending" : "Enrollment Complete")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-6 py-2 overflow-y-auto custom-scrollbar">
          <div className="py-2">
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <BookOpen className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-sm font-medium">{totalLessons} Lessons</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-sm font-medium">{course.level}</p>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg text-center">
                    <Star className="w-5 h-5 fill-accent text-accent mx-auto mb-1" />
                    <p className="text-sm font-medium">4.8 Rating</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">Instructor</span>
                    <span className="font-medium">{course.instructor?.username || 'Trainer'}</span>
                  </div>

                  <div className="p-4 border border-accent/20 rounded-xl bg-accent/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Investment</span>
                      <div className="text-right">
                        {course.discountPrice > 0 ? (
                          <>
                            <span className="text-xs text-muted-foreground line-through mr-2">{course.price.toLocaleString()} RWF</span>
                            <span className="text-xl font-bold text-accent">{course.discountPrice.toLocaleString()} RWF</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-accent">{course.price.toLocaleString()} RWF</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Lifetime access + Certificate of completion</p>
                  </div>
                  </div>
                
                {course.allowedDeliveryModes?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Preferred Delivery Mode</p>
                    <div className="grid grid-cols-2 gap-3">
                      {course.allowedDeliveryModes.map((mode: string) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={selectedDeliveryMode === mode ? "gold" : "outline"}
                          onClick={() => setSelectedDeliveryMode(mode)}
                          className={selectedDeliveryMode === mode ? "bg-accent text-accent-foreground border-none capitalize" : "capitalize"}
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!isFree && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Choose payment method</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={paymentMethod === "paypack" ? "gold" : "outline"}
                        onClick={() => setPaymentMethod("paypack")}
                        className={paymentMethod === "paypack" ? "bg-[#ffcc00] text-black hover:bg-[#e6b800] border-none" : ""}
                      >
                        Mobile Money
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMethod === "manual" ? "gold" : "outline"}
                        onClick={() => setPaymentMethod("manual")}
                      >
                        Manual Payment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}


            {step === 3 && paymentMethod === "manual" && (
              <div className="space-y-6">
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <p className="text-sm font-bold text-accent mb-3 text-center uppercase tracking-wider">Manual Payment Instructions</p>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-accent" />
                        <span className="font-medium">MTN MoMo</span>
                      </div>
                      <span className="font-mono font-bold select-all">250790706170</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border/50">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-accent" />
                        <span className="font-medium">PayPal</span>
                      </div>
                      <span className="font-mono font-bold select-all">munyeshurimanzi@gmail.com</span>
                    </div>

                    <div className="p-3 bg-muted/20 rounded-lg space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        1. Send <span className="text-accent font-bold">{finalPrice.toLocaleString()} RWF</span> using either method above.
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        2. Keep your transaction confirmation message or take a screenshot.
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        3. Upload the confirmation proof below for verification.
                      </p>
                    </div>
                  </div>
                </div>


                <FileUpload
                  onUploadComplete={(url) => setProofUrl(url)}
                  label="Upload Confirmation Screenshot/PDF"
                  folder="payment-proofs"
                />

                {proofUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-500 text-xs font-semibold justify-center">
                      <CheckCircle className="w-4 h-4" /> Proof uploaded successfully
                    </div>

                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-black/5 flex items-center justify-center">
                      {proofUrl.toLowerCase().endsWith('.pdf') ? (
                        <div className="flex flex-col items-center p-4">
                          <FileText className="w-8 h-8 text-accent mb-2" />
                          <span className="text-xs font-medium">PDF Document</span>
                        </div>
                      ) : (
                        <img src={proofUrl} alt="Payment Proof" className="w-full h-full object-contain" />
                      )}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                        onClick={() => setProofUrl(null)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && paymentMethod === "paypack" && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">MTN / Airtel Mobile Money</p>
                  <p className="text-xs text-yellow-800">
                    Pay securely using your mobile wallet. You will receive an automated USSD prompt on your phone.
                  </p>
                </div>
                <PaymentForm
                  amount={finalPrice}
                  description={`Course enrollment - ${course.title}`}
                  courseId={course.id || course._id}
                  selectedDeliveryMode={selectedDeliveryMode}
                  onSuccess={handlePaypackSuccess}
                />
              </div>
            )}


            {step === 4 && (
              <div className="py-10 text-center space-y-4">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  {paymentMethod === "manual" ? (
                    <Clock className="w-10 h-10 text-accent animate-pulse" />
                  ) : (
                    <Check className="w-10 h-10 text-accent" />
                  )}
                </div>
                {paymentMethod === "manual" ? (
                  <>
                    <h2 className="text-2xl font-bold">Verification Pending</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      We've received your proof of payment for <span className="text-foreground font-semibold">{course.title}</span>.
                      Our team will verify it within 24 hours. You'll receive a notification once approved.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Your MoMo payment for <span className="text-foreground font-semibold">{course.title}</span> was successful. You now have full access!
                    </p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted/5">
          {step === 1 && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Maybe Later
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleEnroll} disabled={isProcessing || !!user?.enrolledCourses?.includes(course.id || course._id)}>
                {isProcessing ? "Processing..." : user?.enrolledCourses?.includes(course.id || course._id) ? "Already Enrolled" : isFree ? "Enroll Free" : "Next: Payment"}
              </Button>
            </div>
          )}



          {step === 3 && paymentMethod === "manual" && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isProcessing}>
                Back
              </Button>
              <Button variant="gold" className="flex-1" onClick={handleSubmitProof} disabled={isProcessing || !proofUrl}>
                {isProcessing ? "Processing..." : "Complete Enrollment"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <Button variant="gold" className="w-full" onClick={() => {
              onOpenChange(false);
              if (paymentMethod !== "manual") {
                navigate(`/portal/student/courses/${course.id || course._id}`);
              }
            }}>
              {paymentMethod === "manual" ? "Got it" : "Start Learning"}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
