import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, 
  Award, 
  CheckCircle, 
  Clock, 
  Star,
  FileText,
  ChevronRight,
  TrendingUp,
  Target
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { GET_ME } from "@/lib/graphql/queries";
import { format } from "date-fns";

interface MeData {
  me: {
    id: string;
    enrolledCourses: Array<{
      id: string;
      title: string;
      thumbnail?: string;
      level: string;
    }>;
    grades: Array<{
      courseId: string;
      lessonId: string;
      score: number;
      feedback?: string;
      gradedAt: string;
    }>;
  };
}

export default function StudentGrades() {
  const { data, loading, error } = useQuery<MeData>(GET_ME);
  const me = data?.me;

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="p-8 text-center text-destructive">
          Error loading grades: {error.message}
        </div>
      </PortalLayout>
    );
  }

  const enrolledCourses = me?.enrolledCourses || [];
  const grades = me?.grades || [];

  // Group grades by course
  const courseGrades = enrolledCourses.map((course: any) => {
    const relevantGrades = grades.filter((g: any) => g.courseId === course.id);
    const avgScore = relevantGrades.length > 0 
      ? Math.round(relevantGrades.reduce((acc: number, g: any) => acc + g.score, 0) / relevantGrades.length)
      : null;

    return {
      ...course,
      grades: relevantGrades,
      averageScore: avgScore
    };
  });

  const overallAverage = grades.length > 0
    ? Math.round(grades.reduce((acc: number, g: any) => acc + g.score, 0) / grades.length)
    : 0;

  return (
    <PortalLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-accent" />
              Academic Performance
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your progress and review feedback from your trainers
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-card border border-border/50 p-4 rounded-2xl shadow-sm"
          >
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Average</p>
              <p className="text-2xl font-black text-accent">{overallAverage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </motion.div>
        </div>

        {/* Course Performance Cards */}
        <div className="grid gap-8">
          {courseGrades.map((course: any, idx: number) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-border/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{course.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{course.level} Professional Program</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Course Score</p>
                        {course.averageScore !== null ? (
                          <Badge variant="gold" className="text-lg px-3 py-1 font-black">
                            {course.averageScore}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-3 py-1">
                            Pending Grades
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {course.grades.length === 0 ? (
                    <div className="p-12 text-center">
                      <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No graded assignments yet for this course.</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Complete your lessons to start receiving grades.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {course.grades.map((grade: any, gIdx: number) => (
                        <div key={gIdx} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-accent/5 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-accent" />
                              </div>
                              <h4 className="font-bold text-foreground">Assignment Submission</h4>
                              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
                                {format(new Date(parseInt(grade.gradedAt)), "MMM d, yyyy")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                              "{grade.feedback || 'No feedback provided yet.'}"
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-center min-w-[120px]">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Star className="w-4 h-4 text-gold fill-current" />
                              <span className="text-2xl font-black text-foreground">{grade.score}</span>
                              <span className="text-sm font-bold text-muted-foreground">/ 100</span>
                            </div>
                            <Progress value={grade.score} className="w-24 h-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {courseGrades.length === 0 && (
          <div className="p-20 text-center bg-card rounded-3xl border border-dashed border-border/50">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">No Academic Records</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Once you enroll in courses and complete assignments, your detailed performance reports will appear here.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
