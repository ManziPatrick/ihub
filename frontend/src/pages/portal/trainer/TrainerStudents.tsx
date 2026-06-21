import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Filter,
  Mail,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GraduationCap,
  Award,
  Eye,
  Download,
} from "lucide-react";
import { GradeStudentDialog, StudentDetailDialog } from "@/components/portal/dialogs";
import { useQuery, useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { gql } from "@apollo/client";
import { BadgeAwardDialog } from "@/components/portal/BadgeAwardDialog";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import { GET_TRAINER_STUDENTS } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";

const CREATE_BADGE = gql`
  mutation CreateBadge($title: String!, $description: String!, $icon: String, $category: String) {
    createBadge(title: $title, description: $description, icon: $icon, category: $category) {
      id
    }
  }
`;

const students = [
  {
    id: "s1",
    name: "Jean Baptiste",
    email: "jean@example.com",
    course: "Software Development",
    progress: 68,
    lastActive: "2 hours ago",
    status: "on_track",
    completedLessons: 16,
    totalLessons: 24,
    pendingAssignments: 1,
  },
  {
    id: "s2",
    name: "Marie Uwase",
    email: "marie@example.com",
    course: "Software Development",
    progress: 82,
    lastActive: "1 hour ago",
    status: "ahead",
    completedLessons: 20,
    totalLessons: 24,
    pendingAssignments: 0,
  },
  {
    id: "s3",
    name: "Emmanuel K.",
    email: "emmanuel@example.com",
    course: "Software Development",
    progress: 45,
    lastActive: "3 days ago",
    status: "behind",
    completedLessons: 11,
    totalLessons: 24,
    pendingAssignments: 3,
  },
  {
    id: "s4",
    name: "Grace M.",
    email: "grace@example.com",
    course: "Internet of Things",
    progress: 72,
    lastActive: "5 hours ago",
    status: "on_track",
    completedLessons: 14,
    totalLessons: 20,
    pendingAssignments: 1,
  },
  {
    id: "s5",
    name: "Patrick N.",
    email: "patrick@example.com",
    course: "Internet of Things",
    progress: 30,
    lastActive: "1 week ago",
    status: "at_risk",
    completedLessons: 6,
    totalLessons: 20,
    pendingAssignments: 4,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ahead":
      return (
        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          Ahead
        </Badge>
      );
    case "on_track":
      return (
        <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          On Track
        </Badge>
      );
    case "behind":
      return (
        <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-400/30">
          <Clock className="w-3 h-3 mr-1" />
          Behind
        </Badge>
      );
    case "at_risk":
      return (
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-400/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          At Risk
        </Badge>
      );
    default:
      return null;
  }
};



export default function TrainerStudents() {
  const { user: currentUser } = useAuth();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [viewStudentDialogOpen, setViewStudentDialogOpen] = useState(false);
  const [awardBadgeDialogOpen, setAwardBadgeDialogOpen] = useState(false);
  const [studentToView, setStudentToView] = useState<any>(null);

  const { data, loading, refetch } = useQuery(GET_TRAINER_STUDENTS);

  const [createBadge] = useMutation(CREATE_BADGE, {
    onCompleted: () => {
      toast.success("Initial badge created! You can now award it.");
      refetch();
    }
  });

  const handleCreateInitialBadge = () => {
    createBadge({
      variables: {
        title: "Rising Star",
        description: "Excellent progress in the first modules.",
        icon: "Star",
        category: "milestone"
      }
    });
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </PortalLayout>
    );
  }

  const rawStudents = (data as any)?.trainerStudents || [];

  const processedStudents = rawStudents.map((s: any) => {
    // Basic status and progress logic
    const lastActivity = s.activityLog?.[s.activityLog.length - 1];
    const lastActiveText = lastActivity
      ? `Active: ${lastActivity.action.replace('_', ' ')}`
      : "No recent activity";

    // Aggregate progress across ALL enrolled courses
    const courses = s.enrolledCourses || [];
    const completedList = s.completedLessons || [];

    let studentTotalLessonsCount = 0;
    let studentTotalCompletedCount = 0;

    courses.forEach((course: any) => {
      const courseTotal = course.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;
      const courseCompleted = completedList.filter((l: any) => l.courseId === (course.id || course._id)).length;

      studentTotalLessonsCount += courseTotal;
      studentTotalCompletedCount += courseCompleted;
    });

    const progress = studentTotalLessonsCount > 0
      ? Math.round((studentTotalCompletedCount / studentTotalLessonsCount) * 100)
      : 0;

    let status = "on_track";
    if (progress < 20) status = "at_risk";
    else if (progress > 80) status = "ahead";

    const mainCourse = courses[0];

    return {
      id: s.id,
      name: s.username,
      email: s.email,
      course: mainCourse?.title || "No course",
      progress: progress,
      lastActive: lastActiveText,
      status: status,
      completedLessonsCount: studentTotalCompletedCount,
      totalLessons: studentTotalLessonsCount,
      pendingAssignments: 0,
      level: s.level,
      academicStatus: s.academicStatus,
      badges: s.badges?.map((b: any) => b.badge) || [],
      enrolledCourses: s.enrolledCourses,
      completedLessons: completedList, // Pass the original array
    };
  });

  const filteredStudents = processedStudents.filter((student: any) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse === "all" || student.course === filterCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              My Students
            </h1>
            <p className="text-muted-foreground mt-1">
              Track progress and provide support to your students
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </Button>
            <div className="px-3 py-1.5 bg-accent/20 rounded-full">
              <span className="text-foreground font-medium">{processedStudents.length} Students</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">
                {processedStudents.filter((s: any) => s.status === "ahead" || s.status === "on_track").length}
              </p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {processedStudents.filter((s: any) => s.status === "behind").length}
              </p>
              <p className="text-xs text-muted-foreground">Behind</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {processedStudents.filter((s: any) => s.status === "at_risk").length}
              </p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">
                {processedStudents.length > 0 ? Math.round(processedStudents.reduce((acc: number, s: any) => acc + s.progress, 0) / processedStudents.length) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[200px]"
          >
            <option value="all">All Courses</option>
            <option value="Software Development">Software Development</option>
            <option value="Internet of Things">Internet of Things</option>
          </select>
        </motion.div>

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="border-border/50 hover:border-accent/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-accent/20 text-accent">
                          {student.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-card-foreground">
                            {student.name}
                          </h3>
                          {getStatusBadge(student.status)}
                          {student.academicStatus !== 'active' && (
                            <Badge variant="outline" className="text-[10px] bg-gold/10 text-gold border-gold/20 uppercase">
                              {student.academicStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-card-foreground/60">{student.course} • Level {student.level}</p>
                        {student.badges?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {student.badges.filter((b: any) => b).map((b: any, i: number) => (
                              <div key={i} title={b?.title || 'Badge'} className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                                <Award className="w-2.5 h-2.5 text-accent" />
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-card-foreground/50 mt-1">Last active: {student.lastActive}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-full lg:w-48">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-card-foreground/60">Progress</span>
                        <span className="text-xs font-medium text-accent">{student.progress}%</span>
                      </div>
                      <Progress value={student.progress} className="h-2" />
                      <p className="text-xs text-card-foreground/50 mt-1">
                        {student.completedLessonsCount}/{student.totalLessons} lessons
                      </p>
                    </div>

                    {/* Pending */}
                    <div className="w-full lg:w-24 text-left lg:text-center">
                      {student.pendingAssignments > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full">
                          <AlertCircle className="w-3 h-3 text-orange-400" />
                          <span className="text-xs text-orange-400">{student.pendingAssignments} pending</span>
                        </div>
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStudentToView(student);
                          setViewStudentDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setAwardBadgeDialogOpen(true);
                        }}
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setGradeDialogOpen(true);
                        }}
                      >
                        <GraduationCap className="w-4 h-4 mr-1" />
                        Grade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <GradeStudentDialog
        open={gradeDialogOpen}
        onOpenChange={setGradeDialogOpen}
        student={selectedStudent}
      />

      <StudentDetailDialog
        open={viewStudentDialogOpen}
        onOpenChange={setViewStudentDialogOpen}
        student={studentToView}
      />

      <BadgeAwardDialog
        isOpen={awardBadgeDialogOpen}
        onClose={() => setAwardBadgeDialogOpen(false)}
        user={selectedStudent}
      />

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        isTrainer={true}
        userId={currentUser?.id}
        userRole={currentUser?.role}
      />
    </PortalLayout>
  );
}
