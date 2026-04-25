import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSE, MY_COURSE_APPLICATIONS } from "@/lib/graphql/queries";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, BookOpen, User, PlayCircle, Lock, Award, ShoppingCart, ArrowRight, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ApplyCourseDialog } from "@/components/portal/dialogs";
import { useState } from "react"; export default function CoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const [applyCourse, setApplyCourse] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(GET_COURSE, {
    variables: { id },
    skip: !id
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
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading course...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error.message}</div>;

  const course = (data as any)?.course;
  if (!course) return <div className="min-h-screen flex items-center justify-center">Course not found</div>;

  const isEnrolled = user?.enrolledCourses?.includes(course.id || course._id) || course.studentsEnrolled.some((s: any) => s.id === user?.id);
  const application = myApplications.find((app: any) => app.courseId === (course.id || course._id));
  const appStatus = application?.status;
  const isInCart = cartItems?.some((item: any) => item.id === (course.id || course._id));
  const statusLower = course.status?.toLowerCase();
  const isOpen = !course.status || statusLower === "published" || statusLower === "active" || statusLower === "open";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Rail: Course Info */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {course.category}
                </Badge>
                <h1 className="text-4xl font-bold font-heading">{course.title}</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {course.description}
                </p>

                <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    Instructor: <span className="text-foreground font-medium">{course.instructor.username}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    Level: <span className="text-foreground font-medium">{course.level}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent" />
                    {course.modules.length} Modules
                  </span>
                </div>
              </motion.div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Course Curriculum</h2>
                <div className="space-y-4">
                  {course.modules.map((module: any, idx: number) => (
                    <Card key={module.id} className="border-border/50 shadow-sm overflow-hidden">
                      <CardHeader className="bg-slate-50/50 py-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">{idx + 1}</span>
                          {module.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 max-h-80 overflow-y-auto custom-scrollbar">
                        {module.lessons.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center justify-between p-4 border-t border-border/30 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              {isEnrolled ? (
                                <PlayCircle className="w-4 h-4 text-indigo-500" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-300" />
                              )}
                              <span className={`text-sm ${!isEnrolled && 'text-muted-foreground'}`}>{lesson.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Rail: Enrollment Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <Card className="border-0 shadow-xl bg-card overflow-hidden ring-1 ring-border/50">
                  <div className="aspect-video relative overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    {!isEnrolled && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <Lock className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">${course.price}</p>
                      <p className="text-sm text-muted-foreground line-through">$199.99</p>
                    </div>

                    {isEnrolled ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                        onClick={() => navigate(`/portal/student/courses/${course.id || course._id}`)}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" /> Learning
                      </Button>
                    ) : appStatus === 'approved' ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-bold"
                        onClick={() => navigate(`/portal/student/courses/${course.id || course._id}`)}
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