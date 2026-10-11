import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react";
import { GET_COURSE_LITE, GET_LESSON_CONTENT, MY_COURSE_APPLICATIONS, GET_ME, GET_COURSES_SUMMARY } from "@/lib/graphql/queries";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { courseLd, breadcrumbListLd } from "@/lib/jsonld";
import { CheckCircle, Clock, BookOpen, User, PlayCircle, Lock, Award, ShoppingCart, ArrowRight, XCircle, ChevronDown, FileText, Youtube, Loader2, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ApplyCourseDialog } from "@/components/portal/dialogs";
import { useState, useCallback, useEffect } from "react";
import { stripHtml, getVideoEmbedUrl, isYouTubeUrl, normalizeContent } from "@/lib/utils";
import { PriceDisplay } from "@/components/PriceDisplay";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const [applyCourse, setApplyCourse] = useState<any>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [loadingLesson, setLoadingLesson] = useState<string | null>(null);
  const [lessonCache, setLessonCache] = useState<Record<string, any>>({});

  const { data, loading, error, refetch } = useQuery(GET_COURSE_LITE, {
    variables: { id },
    skip: !id
  });

  // If user visits a direct purchase link (email, share) with ?cart=1 while
  // not logged in: wait for course data to load, add to cart, then redirect
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

    const courseData = (data as any)?.course;
    if (loading && !courseData) return; // still loading graphql data

    if (courseData) {
      addToCart({
        id: courseData.id || courseData._id,
        title: courseData.title,
        price: courseData.price,
        discountPrice: courseData.discountPrice,
        type: "course",
        image: courseData.thumbnail || courseData.image
      });
    }
    setAuthRedirecting(true);
    navigate(`/auth?redirect=/courses/${id}`, { replace: true });
  }, [authRedirecting, wantsImmediateCart, isLoading, isAuthenticated, id, navigate, data, loading, addToCart]);

  const [fetchLessonContent] = useLazyQuery(GET_LESSON_CONTENT, {
    fetchPolicy: 'no-cache',
    // onError is handled in the promise chain to keep types compatible
  });

  const { data: myAppsData } = useQuery(MY_COURSE_APPLICATIONS, {
    skip: !isAuthenticated
  });
  const myApplications = (myAppsData as any)?.myCourseApplications || [];

  const [enrollMutation, { loading: enrolling }] = useMutation(ENROLL_COURSE, {
    onCompleted: () => {
      toast({
        title: "Success",
        description: "You have successfully enrolled in this course!",
      });
      refetch();
    },
    refetchQueries: [{ query: GET_ME }, { query: GET_COURSES_SUMMARY }, { query: MY_COURSE_APPLICATIONS }],
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  // Lazy load lesson content when expanded
  const handleLessonClick = useCallback((lessonId: string) => {
    if (expandedLesson === lessonId) {
      setExpandedLesson(null);
      return;
    }

    // If already cached, just expand
    if (lessonCache[lessonId]) {
      setExpandedLesson(lessonId);
      return;
    }

    setLoadingLesson(lessonId);
    fetchLessonContent({
      variables: { courseId: id, lessonId }
    }).then(({ data: result }: any) => {
      const lesson = result?.lessonContent as any;

      if (lesson) {
        setLessonCache(prev => ({ ...prev, [lessonId]: lesson }));
      }
      setExpandedLesson(lessonId);
    }).catch(() => {
      // Error handled by onError callback
    }).finally(() => {
      setLoadingLesson(null);
    });
  }, [id, lessonCache, expandedLesson, fetchLessonContent]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading course...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center text-red-500">{error.message}</div>
    </div>
  );

  const course = (data as any)?.course;
  if (!course) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center">Course not found</div>
    </div>
  );

  const isEnrolled = user?.enrolledCourses?.some((c: any) => c.id === (course.id || course._id)) || course.studentsEnrolled?.some((s: any) => s.id === user?.id);
  const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
  const appStatus = application?.status;
  const isInCart = cartItems?.some((item: any) => item.id === (course.id || course._id));
  const statusLower = course.status?.toLowerCase();
  const isOpen = !course.status || statusLower === "published" || statusLower === "active" || statusLower === "open";

  const modules = course.modules || [];
  const totalLessons = modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
  const effectivePrice = course.discountPrice != null ? course.discountPrice : course.price;
  const isFree = !effectivePrice;
  const plainDescription = stripHtml(course?.description)?.substring(0, 160) || "Explore this course from Bootskills. Practical, project-based training in Kigali, Rwanda.";
  const courseUrl = course?.id ? `https://bootskills.com/courses/${course.id}` : "https://bootskills.com/explore";
  const ogImage = course?.thumbnail?.startsWith("http")
    ? course.thumbnail
    : course?.thumbnail
      ? `https://bootskills.com${course.thumbnail.startsWith("/") ? "" : "/"}${course.thumbnail}`
      : undefined;
  let globalLessonIndex = 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={course?.title || "Course Details"}
        description={plainDescription}
        canonicalUrl={courseUrl}
        ogImage={ogImage}
        ogImageAlt={`${course?.title} — Bootskills course in Kigali, Rwanda`}
        keywords={`${course?.category || 'course'}, ${course?.title || 'training'}, ${course?.level || 'beginner'} course, ${isFree ? 'free course' : 'online course'}, syllabus, Kigali, Rwanda, Africa, e-learning, Bootskills`}
        author={course?.instructor?.fullName || course?.instructor?.username || 'Bootskills'}
        updatedTime={course?.updatedAt}
      >
        <link rel="alternate" hrefLang="en" href={courseUrl} />
      </SEOHead>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@graph": [
              courseLd(
                course.title,
                stripHtml(course.description || "") || course.title,
                courseUrl,
                {
                  image: ogImage,
                  price: effectivePrice || 0,
                  isFree,
                  level: course.level,
                  instructorName: course.instructor?.fullName || course.instructor?.username,
                  school: course.school,
                  category: course.category,
                  syllabus: modules.map((m: any) => ({
                    name: m.title,
                    description: (m.lessons || []).map((l: any) => l.title).join(", "),
                  })),
                }
              ),
              breadcrumbListLd([
                { name: "Home", item: "/" },
                { name: "Courses", item: "/explore" },
                { name: course.title, item: `/courses/${course.id}` },
              ]),
            ],
          }),
        }}
      />

      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 w-full min-w-0">

            <article className="lg:col-span-2 space-y-8 w-full min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {course.category}
                </Badge>
                <h1 className="text-4xl font-bold font-heading">{course.title}</h1>
                <p className="text-sm font-medium text-green-700">
                  {isFree
                    ? "Free course — title, description, and syllabus are public so learners and AI assistants can recommend it."
                    : "Paid course — the description and full syllabus below are public so people and AI can recommend it. Videos unlock after enrollment."}
                </p>
<div className="text-xl text-muted-foreground leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{normalizeContent(course.description || "")}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    Instructor: <span className="text-foreground font-medium">{course.instructor?.fullName || course.instructor?.username || "TBD"}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    Level: <span className="text-foreground font-medium">{course.level}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    {modules.length} Modules · {totalLessons} Lessons
                  </span>
                </div>
              </motion.div>

              <div className="space-y-6" id="syllabus">
                <div>
                  <h2 className="text-2xl font-bold">Course syllabus</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Full outline of {modules.length} modules and {totalLessons} lessons
                    {isFree ? " — available to browse on this page." : ". Lesson videos unlock after enrollment; titles are public."}
                  </p>
                </div>
                <ol className="space-y-4">
                  <AnimatePresence mode="wait">
                    {modules.map((module: any, idx: number) => (
                      <motion.li
                        key={module.id || module._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.4) }}
                      >
                        <Card className="border-border/50 shadow-sm overflow-hidden">
                          <CardHeader className="bg-slate-50/50 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              {module.title}
                            </CardTitle>
                            {module.description && (
                              <p className="text-xs text-muted-foreground pt-1">{stripHtml(module.description).slice(0, 240)}</p>
                            )}
                          </CardHeader>
                          <CardContent className="p-0">
                            {module.lessons?.map((lesson: any) => {
                              const lessonId = lesson.id || lesson._id;
                              const isExpanded = expandedLesson === lessonId;
                              const isLoading = loadingLesson === lessonId;
                              const cachedLesson = lessonCache[lessonId];
                              // Track global lesson index for free preview (first 2 lessons)
                              const currentLessonIndex = globalLessonIndex++;
                              const isFreePreview = !isEnrolled && currentLessonIndex < 2;

                              return (
                                <div key={lessonId}>
                                  <button
                                    onClick={() => handleLessonClick(lessonId)}
                                    className="w-full flex items-center justify-between p-4 border-t border-border/30 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {isEnrolled || isFreePreview ? (
                                        <PlayCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                                      ) : (
                                        <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                                      )}
                                      <span className={`text-sm ${!isEnrolled && !isFreePreview && 'text-muted-foreground'}`}>
                                        {lesson.title}
                                      </span>
                                      {isFreePreview && (
                                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                                          Free Preview
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {lesson.type && (
                                        <span className="text-[10px] uppercase text-muted-foreground font-medium hidden sm:inline">
                                          {lesson.type === 'video' ? <Youtube className="w-3 h-3" /> : lesson.type === 'reading' ? <FileText className="w-3 h-3" /> : <ScrollText className="w-3 h-3" />}
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                                      {isLoading ? (
                                        <Loader2 className="w-3 h-3 text-accent animate-spin" />
                                      ) : (
                                        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      )}
                                    </div>
                                  </button>

                                  {/* Expanded lesson content (lazy-loaded) */}
                                  <AnimatePresence>
                                    {isExpanded && cachedLesson && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden border-t border-border/20"
                                      >
                                        <div className="p-4 bg-slate-50/30 space-y-4">
                                          {/* Video player — supports YouTube & direct video URLs */}
                                          {cachedLesson.videoUrl && (isYouTubeUrl(cachedLesson.videoUrl) ? (
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                              <iframe
                                                src={getVideoEmbedUrl(cachedLesson.videoUrl)}
                                                className="w-full h-full"
                                                allowFullScreen
                                                loading="lazy"
                                              />
                                            </div>
                                          ) : (
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black/5">
                                              <video
                                                src={cachedLesson.videoUrl}
                                                controls
                                                className="w-full h-full"
                                                controlsList="nodownload"
                                              />
                                            </div>
                                          ))}

                                          {/* Content */}
                                          {isEnrolled || isFreePreview ? (
                                            <div className="prose prose-sm max-w-none">
                                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                                {typeof cachedLesson.content === 'string' ? normalizeContent(cachedLesson.content) : ''}
                                              </ReactMarkdown>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
                                              <div className="text-center space-y-2">
                                                <Lock className="w-8 h-8 text-muted-foreground mx-auto" />
                                                <p className="text-sm text-muted-foreground font-medium">Enroll to view this content</p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Quiz questions if available */}
                                          {cachedLesson.quizQuestions?.length > 0 && (isEnrolled || isFreePreview) && (
                                            <div className="space-y-3 pt-2">
                                              <h4 className="text-sm font-bold flex items-center gap-2">
                                                <ScrollText className="w-4 h-4 text-accent" />
                                                Quiz ({cachedLesson.quizQuestions.length} questions)
                                              </h4>
                                              {/* Show first 2 quiz questions as preview */}
                                              {cachedLesson.quizQuestions.slice(0, 2).map((q: any, qi: number) => (
                                                <div key={q.id || qi} className="bg-white rounded-lg p-3 border border-border/40">
                                                  <p className="text-sm font-medium mb-2">{qi + 1}. {q.questionText}</p>
                                                  <div className="space-y-1">
                                                    {q.options?.slice(0, 2).map((opt: string, oi: number) => (
                                                      <div key={oi} className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px]">{String.fromCharCode(65 + oi)}</span>
                                                        {opt}
                                                      </div>
                                                    ))}
                                                    {q.options?.length > 2 && (
                                                      <p className="text-[10px] text-muted-foreground italic">+{q.options.length - 2} more options</p>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                              {cachedLesson.quizQuestions.length > 2 && (
                                                <p className="text-xs text-muted-foreground italic">
                                                  +{cachedLesson.quizQuestions.length - 2} more questions in the full quiz
                                                </p>
                                              )}
                                            </div>
                                          )}

                                          {/* Assignment info */}
                                          {cachedLesson.isAssignment && (isEnrolled || isFreePreview) && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                              <p className="text-xs font-bold text-amber-700 flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                {cachedLesson.assignmentDescription || "Assignment"}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              </div>
            </article>

            {/* Right Rail: Enrollment Sidebar */}
            <div className="lg:col-span-1 w-full">
              <div className="lg:sticky lg:top-24 space-y-6">
                <Card className="border-0 shadow-xl bg-card overflow-hidden ring-1 ring-border/50">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    {!isEnrolled && !isFree && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <Lock className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <PriceDisplay price={course.price} discountPrice={course.discountPrice} size="lg" />

                    {isEnrolled ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                        onClick={() => navigate(`/portal/student/courses/${course.id || course._id}`)}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" /> Learning
                      </Button>
                    ) : appStatus === 'approved' && course.price > 0 ? (
                      <Button
                        variant="gold"
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-gold/20"
                        onClick={() => {
                          addToCart({
                            id: course.id || course._id,
                            title: course.title,
                            price: course.price,
                            discountPrice: course.discountPrice,
                            type: "course",
                            image: course.thumbnail || course.image
                          });
                        }}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" /> Pay Now to Enroll
                      </Button>
                    ) : appStatus === 'approved' ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                        onClick={async () => {
                          await enrollMutation({ variables: { courseId: course.id || course._id } });
                          navigate(`/portal/student/courses/${course.id || course._id}`);
                        }}
                      >
                        <ArrowRight className="w-5 h-5 mr-2" /> Continue
                      </Button>
                    ) : appStatus === 'pending' ? (
                      <Button
                        disabled
                        className="w-full bg-amber-500 hover:bg-amber-600 h-12 text-lg font-bold"
                      >
                        <Clock className="w-5 h-5 mr-2" /> Pending
                      </Button>
                    ) : appStatus === 'rejected' ? (
                      <Button 
                        disabled
                        className="w-full bg-red-500 hover:bg-red-600 h-12 text-lg font-bold"
                      >
                        <XCircle className="w-5 h-5 mr-2" /> Rejected
                      </Button>
                    ) : !isOpen ? (
                      <Button 
                        disabled
                        variant="secondary"
                        className="w-full h-12 text-lg font-bold opacity-50 cursor-not-allowed"
                      >
                        Enrollment Closed
                      </Button>
                    ) : course.enrollmentMode === 'application' ? (
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            addToCart({
                              id: course.id || course._id,
                              title: course.title,
                              price: course.price,
                              discountPrice: course.discountPrice,
                              type: "course",
                              image: course.thumbnail || course.image
                            });
                            navigate("/auth", { state: { from: { pathname: `/courses/${course.id || course._id}` } } });
                          } else {
                            setApplyCourse(course);
                          }
                        }}
                        variant="gold"
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-gold/20"
                      >
                        Apply Now <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : course.price === 0 ? (
                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            addToCart({
                              id: course.id || course._id,
                              title: course.title,
                              price: course.price,
                              discountPrice: course.discountPrice,
                              type: "course",
                              image: course.thumbnail || course.image
                            });
                            navigate("/auth", { state: { from: { pathname: `/courses/${course.id || course._id}` } } });
                          } else {
                            enrollMutation({ variables: { courseId: course.id || course._id } });
                          }
                        }}
                        variant="gold"
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-gold/20"
                        disabled={enrolling}
                      >
                        {enrolling ? "Enrolling..." : "Enroll Now"} <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          addToCart({
                            id: course.id || course._id,
                            title: course.title,
                            price: course.price,
                            discountPrice: course.discountPrice,
                            type: "course",
                            image: course.thumbnail || course.image
                          });
                        }}
                        variant="gold"
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-gold/20"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
                      </Button>
                    )}

                    <div className="space-y-4 pt-4 border-t border-border/30">
                      <p className="text-sm font-semibold">This course includes:</p>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <PlayCircle className="w-4 h-4 text-accent" /> Full lifetime access
                        </li>
                        <li className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Award className="w-4 h-4 text-accent" /> Certificate of completion
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />

      {/* Apply Dialog */}
      <ApplyCourseDialog
        course={applyCourse}
        open={!!applyCourse}
        onOpenChange={(open) => !open && setApplyCourse(null)}
      />
    </div>
  );
}