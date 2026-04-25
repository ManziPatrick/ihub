import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  Clock, 
  Star,
  FileText,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  BrainCircuit,
  CheckCircle2,
  AlertCircle
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
      modules: Array<{
        lessons: Array<{
          id: string;
          title: string;
          type: string;
        }>;
      }>;
    }>;
    completedCourses: string[];
    completedLessons: Array<{
      courseId: string;
      lessonId: string;
    }>;
    grades: Array<{
      courseId: string;
      lessonId: string;
      lesson?: {
        title: string;
        type: string;
      };
      score: number;
      feedback?: string;
      gradedAt: string;
    }>;
  };
}

export default function StudentGrades() {
  const { data, loading, error } = useQuery<MeData>(GET_ME);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

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
  const completedCourses = me?.completedCourses || [];

  // Group grades by course
  const courseGrades = enrolledCourses.map((course: any) => {
    const relevantGrades = grades.filter((g: any) => g.courseId === course.id);
    const avgScore = relevantGrades.length > 0 
      ? Math.round(relevantGrades.reduce((acc: number, g: any) => acc + g.score, 0) / relevantGrades.length)
      : null;

    const isCompleted = completedCourses.some(id => id.toString() === course.id.toString());
    
    // Count lessons by type
    const allLessons = course.modules?.flatMap((m: any) => m.lessons) || [];
    const totalLessons = allLessons.length;
    const completedLessons = me?.completedLessons.filter(cl => cl.courseId === course.id).length || 0;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      ...course,
      grades: relevantGrades,
      averageScore: avgScore,
      isCompleted,
      progress,
      totalLessons,
      completedLessonsCount: completedLessons
    };
  });

  const overallAverage = grades.length > 0
    ? Math.round(grades.reduce((acc: number, g: any) => acc + g.score, 0) / grades.length)
    : 0;

  const toggleExpand = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

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
              Academic Records
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Comprehensive report of your quizzes, labs, and overall performance.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-card border border-border/50 p-4 rounded-2xl shadow-sm"
          >
            <div className="text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Global Average</p>
              <p className="text-2xl font-black text-accent">{overallAverage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </motion.div>
        </div>

        {/* Course Performance Cards */}
        <div className="grid gap-6">
          {courseGrades.map((course: any, idx: number) => {
            const isExpanded = expandedCourse === course.id;
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`border-border/40 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-accent/20' : 'hover:border-accent/30'}`}>
                  <div 
                    className="p-6 cursor-pointer select-none bg-card"
                    onClick={() => toggleExpand(course.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border/50 shadow-inner">
                            {course.thumbnail ? (
                              <img src={course.thumbnail} className="w-full h-full object-cover" />
                            ) : (
                              <GraduationCap className="w-8 h-8 text-muted-foreground/40" />
                            )}
                          </div>
                          {course.isCompleted && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-card">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-foreground group-hover:text-accent transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-muted/50">
                              {course.level}
                            </Badge>
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.completedLessonsCount}/{course.totalLessons} Lessons
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block w-32">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Course Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress value={course.progress} className="h-1.5 flex-1" />
                            <span className="text-xs font-bold text-foreground whitespace-nowrap">{course.progress}%</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Performance</p>
                          {course.averageScore !== null ? (
                            <Badge variant="gold" className="text-lg px-4 py-1.5 font-black shadow-lg shadow-gold/20">
                              {course.averageScore}%
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs px-3 py-1 font-bold">
                              IN PROGRESS
                            </Badge>
                          )}
                        </div>

                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-accent/10 transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-accent" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <CardContent className="p-0 border-t border-border/20 bg-muted/5">
                          {course.grades.length === 0 ? (
                            <div className="p-12 text-center">
                              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                              <p className="text-muted-foreground font-bold italic">No specific marks recorded yet.</p>
                              <p className="text-xs text-muted-foreground/60 mt-2">Complete quizzes or submit your practical lab assignments to see your scores here.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-border/10">
                              <div className="px-8 py-4 bg-muted/20 grid grid-cols-12 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <div className="col-span-7">Evaluation Unit</div>
                                <div className="col-span-2 text-center">Date</div>
                                <div className="col-span-3 text-right">Final Score</div>
                              </div>
                              {course.grades.map((grade: any, gIdx: number) => {
                                const isQuiz = grade.lesson?.type === 'quiz' || grade.feedback === "Quiz challenge completed";
                                const isPractical = grade.lesson?.type === 'assignment' || !isQuiz;
                                
                                return (
                                  <div key={gIdx} className="px-8 py-6 grid grid-cols-12 items-center gap-4 hover:bg-accent/5 transition-colors group">
                                    <div className="col-span-7">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                                          isQuiz ? 'bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20' : 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500/20'
                                        }`}>
                                          {isQuiz ? <BrainCircuit className="w-5 h-5 text-purple-500" /> : <FlaskConical className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-foreground text-sm">{grade.lesson?.title || (isQuiz ? "Quiz Assessment" : "Practical Lab Submission")}</h4>
                                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                                            {isQuiz ? "Quiz Assessment" : "Practical Lab / Assignment"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-span-2 text-center">
                                      <span className="text-xs font-bold text-muted-foreground">
                                        {format(new Date(isNaN(Number(grade.gradedAt)) ? grade.gradedAt : parseInt(grade.gradedAt)), "MMM d, yyyy")}
                                      </span>
                                    </div>

                                    <div className="col-span-3">
                                      <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xl font-black ${grade.score >= 70 ? 'text-foreground' : 'text-orange-500'}`}>
                                            {grade.score}
                                          </span>
                                          <span className="text-[10px] font-bold text-muted-foreground uppercase">/ 100</span>
                                        </div>
                                        <Progress value={grade.score} className={`w-24 h-1.5 ${grade.score >= 70 ? 'bg-muted' : 'bg-orange-500/10'}`} />
                                      </div>
                                    </div>

                                    {grade.feedback && !isQuiz && (
                                      <div className="col-span-12 mt-4 p-4 bg-card rounded-xl border border-border/50">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                          <FileText className="w-3 h-3" /> Instructor Feedback
                                        </p>
                                        <p className="text-sm text-foreground italic leading-relaxed">
                                          "{grade.feedback}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {courseGrades.length === 0 && (
          <div className="p-20 text-center bg-card rounded-3xl border border-dashed border-border/50">
            <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase tracking-tighter">No Academic Records Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              Start your first lesson and complete assessments to build your academic profile.
            </p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
