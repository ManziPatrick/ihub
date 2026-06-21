import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Clock,
  Search,
  Plus,
  Edit,
  Eye,
  Video,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  Layers,
  FileBox,
  LayoutDashboard,
  ExternalLink,
  UserPlus,
  Rocket,
  Download,
} from "lucide-react";
import { EditCourseDialog, ViewCourseDialog, EnrollStudentDialog, CreateProjectDialog, GradeProjectDialog } from "@/components/portal/dialogs";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import { toast } from "sonner";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_COURSES, GET_ME, GET_ALL_PROJECTS } from "@/lib/graphql/queries";
import { UPDATE_COURSE } from "@/lib/graphql/mutations";

export default function TrainerCourses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [viewCourse, setViewCourse] = useState<any | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [assignProjectOpen, setAssignProjectOpen] = useState(false);
  const [gradeProject, setGradeProject] = useState<any>(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: userData, loading: userLoading } = useQuery(GET_ME);
  const { data: coursesData, loading: coursesLoading, refetch } = useQuery(GET_COURSES);
  const { data: projectsData, refetch: refetchProjects } = useQuery(GET_ALL_PROJECTS);
  const [updateCourseMutation] = useMutation(UPDATE_COURSE);

  const me = (userData as any)?.me;

  // Filter courses assigned to this trainer
  const myCourses = useMemo(() => {
    const all = (coursesData as any)?.courses?.items || [];
    if (!me) return [];
    return all.filter((c: any) => c.instructor?.id === me.id);
  }, [coursesData, me]);

  const filteredCourses = myCourses.filter((c: any) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCourse = useMemo(() =>
    myCourses.find((c: any) => c.id === selectedCourseId),
    [myCourses, selectedCourseId]
  );

  const courseProjects = useMemo(() => {
    const all = (projectsData as any)?.projects?.items || [];
    if (!selectedCourse) return [];
    return all.filter((p: any) => p.course === selectedCourse.title);
  }, [projectsData, selectedCourse]);

  const handleUpdateCourse = async (updatedCourseData: any) => {
    try {
      await updateCourseMutation({
        variables: {
          id: updatedCourseData.id,
          title: updatedCourseData.title,
          description: updatedCourseData.description,
          thumbnail: updatedCourseData.thumbnail,
          price: Number(updatedCourseData.price),
          discountPrice: Number(updatedCourseData.discountPrice),
          level: updatedCourseData.level,
          category: updatedCourseData.category,
          instructorId: updatedCourseData.instructorId,
          status: updatedCourseData.status,
          modules: updatedCourseData.modules.map((m: any) => ({
            title: m.title,
            description: m.description,
            lessons: m.lessons.map((l: any) => ({
              title: l.title,
              duration: l.duration,
              videoUrl: l.videoUrl,
              fileUrl: l.fileUrl,
              type: l.type,
              content: l.content
            }))
          }))
        }
      });
      toast.success("Curriculum updated successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update course");
    }
  };

  if (userLoading || coursesLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-accent" />
              Course Orchestration
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Prepare modules, manage resources, and track student success
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search my courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-muted/20 border-none h-11"
              />
            </div>
            <Button variant="outline" className="h-11" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="gold" className="h-11 shadow-lg shadow-gold/20" onClick={() => toast.info("Contact admin to create a new course")}>
              <Plus className="w-4 h-4 mr-2" />
              Request New Course
            </Button>
          </div>
        </motion.div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">My Assigned Tracks</h3>
            <div className="grid gap-4">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className={`border-border/50 cursor-pointer overflow-hidden group transition-all duration-300 ${selectedCourseId === course.id ? "ring-2 ring-accent bg-accent/5 shadow-xl" : "hover:bg-muted/10"
                    }`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <CardContent className="p-0">
                    <div className="h-24 w-full relative overflow-hidden">
                      <img src={course.thumbnail} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                      <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur text-accent border-accent/20">
                        {course.level}
                      </Badge>
                    </div>
                    <div className="p-4 pt-2">
                      <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-accent" />
                          {course.studentsEnrolled?.length || 0} Students
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-accent" />
                          {course.modules?.length || 0} Modules
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCourses.length === 0 && (
                <div className="p-8 text-center bg-muted/5 rounded-xl border border-dashed border-border/50">
                  <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">No courses found matching your criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Course Detail Workspace */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {selectedCourse ? (
                <motion.div
                  key={selectedCourse.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-border/50 bg-muted/5 backdrop-blur shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                          <FileBox className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold">{selectedCourse.title}</CardTitle>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Content Preparation Workspace</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 hover:bg-accent hover:text-white" onClick={() => setViewCourse(selectedCourse)}>
                          <Eye className="w-4 h-4 mr-1.5" /> Quick View
                        </Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => window.open(`/courses/${selectedCourse.id}`, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-1.5" /> Public Preview
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          className="h-9 shadow-lg shadow-gold/20"
                          onClick={() => setEditCourse(selectedCourse)}
                        >
                          <Edit className="w-4 h-4 mr-1.5" /> Edit Curriculum
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Tabs defaultValue="modules" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto bg-muted/20 p-1 rounded-lg h-12 border border-border/30">
                          <TabsTrigger value="modules" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Modules & Lessons</TabsTrigger>
                          <TabsTrigger value="students" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Enrolled Students</TabsTrigger>
                          <TabsTrigger value="teams" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Project Teams</TabsTrigger>
                          <TabsTrigger value="analytics" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Tracking</TabsTrigger>
                        </TabsList>

                        <TabsContent value="modules" className="pt-6">
                          <div className="space-y-6">
                            {selectedCourse.modules?.length > 0 ? (
                              selectedCourse.modules.map((module: any, mIdx: number) => (
                                <div key={mIdx} className="space-y-3">
                                  <div className="flex items-center justify-between px-2">
                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                      <span className="w-6 h-6 rounded bg-accent/20 text-accent flex items-center justify-center text-xs">{mIdx + 1}</span>
                                      {module.title}
                                    </h4>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{module.lessons?.length || 0} Lessons</span>
                                  </div>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground px-2 italic">{module.description}</p>
                                  )}
                                  <div className="grid gap-2">
                                    {module.lessons?.map((lesson: any, lIdx: number) => (
                                      <div key={lIdx} className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/30 hover:border-accent/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lesson.type === 'video' ? 'bg-red-500/10 text-red-500' :
                                            lesson.type === 'pdf' ? 'bg-emerald-500/10 text-emerald-500' :
                                              'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {lesson.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                              {lesson.title}
                                              {lesson.videoUrl && <Badge variant="secondary" className="px-1.5 h-4 text-[8px] bg-accent/5 text-accent border-none">Video</Badge>}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground font-medium uppercase">
                                              <span>{lesson.duration} mins</span>
                                              {lesson.type && <span>• {lesson.type}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                          Manage
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-20 bg-background/20 rounded-2xl border border-dashed border-border/50">
                                <LayoutDashboard className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="font-bold text-lg">Curriculum is Empty</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">Start building your course structure by adding modules and lessons.</p>
                                <Button variant="gold" onClick={() => setEditCourse(selectedCourse)}>
                                  <Plus className="w-4 h-4 mr-2" /> Begin Preparation
                                </Button>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="students" className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold uppercase text-muted-foreground">Course Participants</h4>
                            <Button variant="gold" size="sm" onClick={() => setEnrollDialogOpen(true)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Enroll Student
                            </Button>
                          </div>
                          <div className="grid gap-4">
                            {selectedCourse.studentsEnrolled?.map((student: any) => (
                              <div key={student.id} className="flex items-center justify-between p-4 bg-background/50 rounded-xl border border-border/30">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent">
                                    {(student.username?.[0] || "U").toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground">{student.username || "Anonymous"}</p>
                                    <p className="text-xs text-muted-foreground">Enrolled Member</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">View Progress</Button>
                              </div>
                            ))}
                            {(!selectedCourse.studentsEnrolled || selectedCourse.studentsEnrolled.length === 0) && (
                              <div className="text-center py-20 text-muted-foreground">
                                No students enrolled in this track yet.
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="teams" className="pt-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-sm font-bold uppercase text-muted-foreground">Project & Team Infrastructure</h4>
                              <p className="text-xs text-muted-foreground mt-1">Assign projects and monitor team collaboration</p>
                            </div>
                            <Button variant="gold" size="sm" onClick={() => setAssignProjectOpen(true)}>
                              <Rocket className="w-4 h-4 mr-2" />
                              Assign Project
                            </Button>
                          </div>

                          <div className="grid gap-4">
                            {courseProjects.length > 0 ? (
                              courseProjects.map((project: any) => (
                                <div key={project.id} className="p-4 bg-background/50 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                        <Layers className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-foreground">{project.title}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{project.type}</p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className={
                                      project.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                        'bg-amber-500/10 text-amber-500'
                                    }>
                                      {project.status.replace('_', ' ')}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                      {project.team?.map((m: any, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold overflow-hidden" title={m.name}>
                                          {m.name?.[0] || 'U'}
                                        </div>
                                      ))}
                                      {(!project.team || project.team.length === 0) && (
                                        <p className="text-[10px] text-muted-foreground">Individual</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right mr-3">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Progress</p>
                                        <p className="text-sm font-bold text-accent">{project.progress}%</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="h-8">Details</Button>
                                        {(project.status === 'pending_review' || project.status === 'in_progress') && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-accent text-accent hover:bg-accent hover:text-white"
                                            onClick={() => {
                                              setGradeProject(project);
                                              setGradeOpen(true);
                                            }}
                                          >
                                            Grade
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-20 bg-background/20 rounded-2xl border border-dashed border-border/50">
                                <Rocket className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="font-bold text-lg">No Projects Assigned</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                                  There are no projects or teams established for this course yet.
                                </p>
                                <Button variant="gold" onClick={() => setAssignProjectOpen(true)}>
                                  <Plus className="w-4 h-4 mr-2" /> Assign First Project
                                </Button>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/5 rounded-3xl border border-dashed border-border/50">
                  <div className="w-20 h-20 rounded-full bg-accent/5 flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-accent/20" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground/80 mb-2">Workspace Ready</h3>
                  <p className="text-muted-foreground max-w-md">Select a course from the list on the left to start preparing modules, assigning materials, and tracking student success.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {editCourse && (
        <EditCourseDialog
          open={!!editCourse}
          onOpenChange={(open) => !open && setEditCourse(null)}
          course={editCourse}
          onSave={handleUpdateCourse}
        />
      )}

      <ViewCourseDialog
        open={!!viewCourse}
        onOpenChange={(open) => !open && setViewCourse(null)}
        course={viewCourse}
      />

      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        course={selectedCourse}
      />

      <GradeProjectDialog
        open={gradeOpen}
        onOpenChange={setGradeOpen}
        project={gradeProject}
        refetch={refetchProjects}
      />

      <CreateProjectDialog
        open={assignProjectOpen}
        onOpenChange={setAssignProjectOpen}
        refetch={refetchProjects}
      />

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        isTrainer={true}
        userId={me?.id}
        userRole={me?.role}
      />
    </PortalLayout>
  );
}
