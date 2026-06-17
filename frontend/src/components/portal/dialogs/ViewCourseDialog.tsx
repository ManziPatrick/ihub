import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Users, Clock, DollarSign, Star, PlayCircle, FileText } from "lucide-react";
import { PPTViewer } from "../PPTViewer";
import { useState } from "react";

interface ViewCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: any | null;
}

export function ViewCourseDialog({ open, onOpenChange, course }: ViewCourseDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!course) return null;

  const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            {course.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6 overflow-y-auto">
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: course.description }} />

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-card-foreground/60 text-xs mb-1">
                  <Users className="w-4 h-4" />
                  Students
                </div>
                <p className="font-semibold text-card-foreground">{course.studentsEnrolled?.length || 0}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-card-foreground/60 text-xs mb-1">
                  <BookOpen className="w-4 h-4" />
                  Lessons
                </div>
                <p className="font-semibold text-card-foreground">{totalLessons}</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-card-foreground/60 text-xs mb-1">
                  <DollarSign className="w-4 h-4" />
                  Price
                </div>
                <p className="font-semibold text-card-foreground">
                  {course.price === 0 ? "Free" : `$${course.price}`}
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-card-foreground/60 text-xs mb-1">
                  <Star className="w-4 h-4" />
                  Level
                </div>
                <p className="font-semibold text-card-foreground">{course.level}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-card-foreground/70">Category</span>
                <span className="text-sm font-medium text-accent">{course.category}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <div>
                <p className="text-sm text-card-foreground/60">Instructor</p>
                <p className="font-medium text-card-foreground">{course.instructor?.username}</p>
              </div>
              <Badge variant="default">
                Active
              </Badge>
              {course.submissionRequired !== false && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  Submission Required
                </Badge>
              )}
            </div>

            {/* Curriculum Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Course Curriculum</h3>
              <div className="space-y-4">
                {course.modules?.map((module: any, mIdx: number) => (
                  <div key={mIdx} className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-bold flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-accent border-accent/30">M{mIdx + 1}</Badge>
                      {module.title}
                    </h4>
                    {module.description && (
                      <p className="text-xs text-muted-foreground mb-3 italic">{module.description}</p>
                    )}
                    <div className="space-y-2 ml-4">
                      {module.lessons?.map((lesson: any, lIdx: number) => (
                        <div key={lIdx} className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-background/40 rounded-md text-sm group">
                            <div className="p-1 rounded bg-accent/10 text-accent">
                              {lesson.type === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            </div>
                            <span className="flex-1 truncate">{lesson.title}</span>
                            <div className="flex items-center gap-2">
                              {lesson.fileUrl && (lesson.fileUrl.endsWith('.ppt') || lesson.fileUrl.endsWith('.pptx')) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setPreviewUrl(previewUrl === lesson.fileUrl ? null : lesson.fileUrl)}
                                >
                                  <PlayCircle className="w-3 h-3 text-accent" />
                                </Button>
                              )}
                              <span className="text-[10px] text-muted-foreground">{lesson.duration}m</span>
                            </div>
                          </div>
                          {previewUrl === lesson.fileUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-accent/20 shadow-lg">
                              <PPTViewer url={lesson.fileUrl} title={lesson.title} className="h-48" />
                            </div>
                          )}
                        </div>
                      ))}
                      {(!module.lessons || module.lessons.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">No lessons in this module.</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!course.modules || course.modules.length === 0) && (
                  <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">No curriculum available for this course yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
