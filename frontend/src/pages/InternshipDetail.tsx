import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { GET_INTERNSHIP_PROGRAM, GET_MY_INTERNSHIP_APPLICATIONS } from "@/lib/graphql/queries";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { organizationLd, webPageLd, breadcrumbListLd } from "@/lib/jsonld";
import { ApplyInternshipDialog } from "@/components/portal/dialogs";
import { useState, useEffect } from "react";
import { stripHtml } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/contexts/CartContext";
import {
  Briefcase,
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  MapPin,
  Award,
  FileText,
  DollarSign,
  Sparkles,
  ShoppingCart,
} from "lucide-react";

export default function InternshipDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const { data, loading, error } = useQuery(GET_INTERNSHIP_PROGRAM, {
    variables: { id },
    skip: !id,
  });

  const { data: appsData } = useQuery(GET_MY_INTERNSHIP_APPLICATIONS, {
    skip: !isAuthenticated,
  });

  // If user visits a direct purchase link (email, share) with ?cart=1 while
  // not logged in: wait for program data to load, add to cart, then redirect
  // to auth. Plain browsing without that flag shows the single page freely —
  // the on-page buttons handle add-to-cart and gate login at checkout only.
  const [authRedirecting, setAuthRedirecting] = useState(false);
  const wantsImmediateCart = new URLSearchParams(window.location.search).get("cart") === "1";
  useEffect(() => {
    if (authRedirecting) return;
    if (!wantsImmediateCart) return;
    if (isLoading) return; // auth still loading
    if (isAuthenticated) return; // already logged in
    if (!id) return;

    const programData = (data as any)?.internshipProgram;
    if (loading && !programData) return; // still loading graphql data

    if (programData) {
      addToCart({
        id: programData.id || id,
        title: programData.title || "Opportunity Program",
        price: programData.price || 0,
        discountPrice: programData.discount > 0 ? programData.discount : undefined,
        type: "internship",
        image: programData.image || ""
      });
    }
    setAuthRedirecting(true);
    navigate(`/auth?redirect=/opportunity/${id}`, { replace: true });
  }, [authRedirecting, wantsImmediateCart, isLoading, isAuthenticated, id, navigate, data, loading, addToCart]);

  const program = (data as any)?.internshipProgram;
  const myApplications = (appsData as any)?.myInternshipApplications || [];
  const existingApplication = myApplications.find(
    (app: any) => app.internshipProgram?.id === id
  );
  const appStatus = existingApplication?.status;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center text-red-500">
          {error.message}
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Program not found</p>
          <Button variant="outline" onClick={() => navigate("/opportunities")}>
            Browse Opportunities
          </Button>
        </div>
      </div>
    );
  }

  const isOpen = program.status === "open" || program.status === "active" || program.status === "published";
  const deadline = program.applicationDeadline
    ? new Date(parseInt(program.applicationDeadline)).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const startDate = program.startDate
    ? new Date(parseInt(program.startDate)).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const endDate = program.endDate
    ? new Date(parseInt(program.endDate)).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleApply = () => {
    if (!isAuthenticated) {
      if (program) {
        addToCart({
          id: program.id || id || "",
          title: program.title || "Opportunity Program",
          price: program.price || 0,
          discountPrice: program.discount > 0 ? program.discount : undefined,
          type: "internship",
          image: program.image || ""
        });
      }
      navigate("/auth", { state: { from: { pathname: `/opportunity/${id}` } } });
    } else {
      setShowApplyDialog(true);
    }
  };

  const handleSuccess = () => {
    setShowApplyDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={program.title || "Opportunity Program"}
        description={stripHtml(program.description)?.substring(0, 160) || "Apply for this program at Bootskills."}
        canonicalUrl={program.id ? `https://bootskills.com/opportunity/${program.id}` : "https://bootskills.com/opportunities"}
        ogImage={program.image || undefined}
        keywords={`${program.category || 'internship'}, ${program.title || 'program'}, internship Rwanda, Kigali training, practical experience, career development`}
      >
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              organizationLd,
              webPageLd(program.title || "Program", stripHtml(program.description)?.substring(0, 160) || "Program at Bootskills.", `https://bootskills.com/opportunity/${program.id}`),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Opportunities", item: "/opportunities" },
                { name: program.title || "Opportunity", item: `/opportunity/${program.id}` },
              ]),
            ]
          })}
        </script>
      </SEOHead>

      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Rail: Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  <Briefcase className="w-3 h-3 mr-1" /> Opportunity
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-bold font-heading">
                  {program.title}
                </h1>

                {/* Key Stats Bar */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {program.duration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">{program.duration}</span>
                    </div>
                  )}
                  {program.maxSpots && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">{program.maxSpots} spots</span>
                    </div>
                  )}
                  {program.price !== null && program.price !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">
                        {program.price === 0
                          ? "Free"
                          : formatPrice(program.price)}
                        {program.discount > 0 && (
                          <span className="ml-1.5 text-xs line-through text-muted-foreground/60">
                            {formatPrice(program.discount)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Thumbnail / Image */}
              {program.image && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative rounded-2xl overflow-hidden aspect-video lg:aspect-[21/9]"
                >
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
                </motion.div>
              )}

              {/* Full Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  About This Program
                </h2>
                <div
                  className="text-muted-foreground leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: program.description || "" }}
                />
              </motion.div>

              {/* Eligibility */}
              {program.eligibility?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Eligibility
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(typeof program.eligibility === 'string'
                      ? program.eligibility.split('\n')
                      : Array.isArray(program.eligibility)
                        ? program.eligibility
                        : []
                    ).map((item: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-muted/10 rounded-xl border border-border/30"
                      >
                        <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground/80">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Rules */}
              {program.rules && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3"
                >
                  <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    Program Rules
                  </h2>
                  <div
                    className="text-sm text-muted-foreground leading-relaxed p-4 bg-muted/10 rounded-xl border border-border/30 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: program.rules }}
                  />
                </motion.div>
              )}

              {/* Application Questions Preview */}
              {program.applicationQuestions?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  <h2 className="text-xl font-bold font-heading flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Application Questions
                  </h2>
                  <div className="space-y-2">
                    {program.applicationQuestions.map((q: any, i: number) => (
                      <div
                        key={q.label || i}
                        className="flex items-start gap-3 p-3 bg-muted/10 rounded-xl border border-border/30"
                      >
                        <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {q.label}
                            {q.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {q.type === "textarea"
                              ? "Written response"
                              : `${q.type}${q.options?.length ? ` · ${q.options.length} options` : ""}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Rail: Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Apply Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-lg"
                >
                  {program.image && (
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-5">
                    {/* Price */}
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {program.price === 0 || program.price == null
                          ? "Free"
                          : formatPrice(program.price)}
                      </p>
                      {program.discount > 0 && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(program.discount)}
                        </p>
                      )}
                    </div>

                    {/* Apply Button */}
                    {appStatus === "approved" && program.price > 0 ? (
                      <Button
                        variant="gold"
                        className="w-full h-12 text-sm font-bold shadow-lg shadow-gold/20"
                        onClick={() => {
                          addToCart({
                            id: program.id || id || "",
                            title: program.title || "Opportunity Program",
                            price: program.price || 0,
                            discountPrice: program.discount > 0 ? program.discount : undefined,
                            type: "internship",
                            image: program.image || ""
                          });
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Pay Now to Enroll
                      </Button>
                    ) : appStatus === "approved" ? (
                      <Button
                        className="w-full h-12 text-sm font-bold bg-green-600 hover:bg-green-700"
                        onClick={() => navigate("/portal/student/internship")}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" /> Continue
                      </Button>
                    ) : appStatus === "pending" ? (
                      <Button
                        disabled
                        className="w-full h-12 text-sm font-bold bg-amber-500"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pending
                      </Button>
                    ) : appStatus === "rejected" ? (
                      <Button
                        disabled
                        className="w-full h-12 text-sm font-bold bg-red-500"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" /> Rejected
                      </Button>
                    ) : !isOpen ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full h-12 text-sm font-bold opacity-50 cursor-not-allowed"
                      >
                        Applications Closed
                      </Button>
                    ) : (
                      <Button
                        variant="gold"
                        className="w-full h-12 text-sm font-bold shadow-lg shadow-gold/20"
                        onClick={handleApply}
                      >
                        Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}

                    {/* Program Details */}
                    <div className="space-y-3 pt-3 border-t border-border/30">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Program Details
                      </h4>
                      <div className="space-y-3">
                        {program.duration && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                                Duration
                              </p>
                              <p className="text-sm font-semibold">{program.duration}</p>
                            </div>
                          </div>
                        )}
                        {startDate && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                                Start Date
                              </p>
                              <p className="text-sm font-semibold">{startDate}</p>
                            </div>
                          </div>
                        )}
                        {endDate && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                                End Date
                              </p>
                              <p className="text-sm font-semibold">{endDate}</p>
                            </div>
                          </div>
                        )}
                        {deadline && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                                Application Deadline
                              </p>
                              <p className="text-sm font-semibold text-red-500">{deadline}</p>
                            </div>
                          </div>
                        )}
                        {program.maxSpots && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Users className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-medium">
                                Available Spots
                              </p>
                              <p className="text-sm font-semibold">{program.maxSpots}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Modes */}
                    {program.allowedDeliveryModes?.length > 0 && (
                      <div className="pt-3 border-t border-border/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Delivery Options
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {program.allowedDeliveryModes.map((mode: string) => (
                            <Badge
                              key={mode}
                              variant="outline"
                              className="border-accent/20 text-accent bg-accent/5 capitalize"
                            >
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signer Info */}
                    {(program.signerName || program.signerSignature) && (
                      <div className="pt-3 border-t border-border/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Certificate Signatory
                        </h4>
                        {program.signerName && (
                          <p className="text-sm font-medium">{program.signerName}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Why Apply */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-muted/10 rounded-2xl border border-border/30 p-5 space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Why Apply?
                  </h4>
                  <div className="space-y-3">
                    {[
                      "Gain real-world experience on live projects",
                      "Work under professional mentorship",
                      "Build a portfolio that stands out",
                      "Earn a recognized certificate",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Award className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Apply Dialog */}
      <ApplyInternshipDialog
        open={showApplyDialog}
        onOpenChange={(open) => !open && setShowApplyDialog(false)}
        internshipProgramId={id || ""}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
