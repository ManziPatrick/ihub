import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, GraduationCap, Star, TrendingUp, Loader2, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useMutation, useQuery } from "@apollo/client/react";
import { SUBMIT_GRADE, AWARD_BADGE, PROMOTE_STUDENT } from "@/lib/graphql/mutations";
import { GET_BADGES, GET_TRAINER_STUDENTS } from "@/lib/graphql/queries";

interface GradeStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any | null;
}

export function GradeStudentDialog({ open, onOpenChange, student }: GradeStudentDialogProps) {
  const [activeTab, setActiveTab] = useState("grade");
  const [loading, setLoading] = useState(false);

  // Grade State
  const [gradeData, setGradeData] = useState({
    courseId: "",
    lessonId: "",
    score: 0,
    feedback: "",
  });

  // Badge State
  const [selectedBadgeId, setSelectedBadgeId] = useState("");

  // Promotion State
  const [promoData, setPromoData] = useState({
    academicStatus: student?.academicStatus || "active",
    level: student?.level || 1,
  });

  const { data: badgesData } = useQuery(GET_BADGES);
  const badges = (badgesData as any)?.badges?.items || [];

  const [submitGrade] = useMutation(SUBMIT_GRADE, {
    refetchQueries: [{ query: GET_TRAINER_STUDENTS }],
    onCompleted: () => {
      toast.success("Grade submitted successfully!");
      setGradeData({ courseId: "", lessonId: "", score: 0, feedback: "" });
    },
  });

  const [awardBadge] = useMutation(AWARD_BADGE, {
    refetchQueries: [{ query: GET_TRAINER_STUDENTS }],
    onCompleted: () => {
      toast.success("Badge awarded successfully!");
      setSelectedBadgeId("");
    },
  });

  const [promoteStudent] = useMutation(PROMOTE_STUDENT, {
    refetchQueries: [{ query: GET_TRAINER_STUDENTS }],
    onCompleted: () => {
      toast.success("Student promoted successfully!");
    },
  });

  const handleGrade = async () => {
    if (!gradeData.courseId || gradeData.score === 0) {
      toast.error("Please fill in course and score");
      return;
    }
    setLoading(true);
    try {
      await submitGrade({
        variables: {
          userId: student.id,
          ...gradeData,
          score: parseInt(gradeData.score.toString()),
        },
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAward = async () => {
    if (!selectedBadgeId) {
      toast.error("Please select a badge");
      return;
    }
    setLoading(true);
    try {
      await awardBadge({
        variables: {
          userId: student.id,
          badgeId: selectedBadgeId,
        },
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    setLoading(true);
    try {
      await promoteStudent({
        variables: {
          userId: student.id,
          academicStatus: promoData.academicStatus,
          level: parseInt(promoData.level.toString()),
        },
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            Academic portal: {student.name || student.username}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 pb-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="grade" className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Grade
              </TabsTrigger>
              <TabsTrigger value="badge" className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Badge
              </TabsTrigger>
              <TabsTrigger value="promote" className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Promote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grade" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select onValueChange={(v) => setGradeData({ ...gradeData, courseId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {student.enrolledCourses?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score (0-100)</Label>
                <Input
                  type="number"
                  max={100}
                  min={0}
                  value={gradeData.score}
                  onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Feedback (Optional)</Label>
                <Textarea
                  placeholder="Exellent work on the project..."
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                />
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90" onClick={handleGrade} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Grade"}
              </Button>
            </TabsContent>

            <TabsContent value="badge" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Available Badges</Label>
                <Select onValueChange={setSelectedBadgeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                           <span className="capitalize">{b.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                    {badges.length === 0 && <div className="p-2 text-xs text-muted-foreground">No badges created yet</div>}
                  </SelectContent>
                </Select>
              </div>
              {selectedBadgeId && (
                <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  {badges.find((b: any) => b.id === selectedBadgeId)?.description}
                </div>
              )}
              <Button className="w-full bg-gold hover:bg-gold/90 text-black" onClick={handleAward} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Award Badge"}
              </Button>
            </TabsContent>

            <TabsContent value="promote" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Academic Status</Label>
                <Select
                  value={promoData.academicStatus}
                  onValueChange={(v) => setPromoData({ ...promoData, academicStatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Student</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Academic Level</Label>
                <Input
                  type="number"
                  value={promoData.level}
                  onChange={(e) => setPromoData({ ...promoData, level: parseInt(e.target.value) })}
                />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePromote} disabled={loading}>
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Promotion"}
              </Button>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
