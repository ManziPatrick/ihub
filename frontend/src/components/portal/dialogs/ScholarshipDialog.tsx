import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Loader2, Search, User, Award } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_ALL_STUDENTS, GET_COURSES_SUMMARY, GET_INTERNSHIP_PROGRAMS, GET_ALL_SCHOLARSHIPS, GET_SCHOLARSHIP_STATS } from "@/lib/graphql/queries";
import { GRANT_SCHOLARSHIP } from "@/lib/graphql/mutations";

interface ScholarshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScholarshipDialog({ open, onOpenChange }: ScholarshipDialogProps) {
  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [scholarshipType, setScholarshipType] = useState<"course" | "internship">("course");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: studentsData, loading: studentsLoading } = useQuery(GET_ALL_STUDENTS);
  const { data: coursesData, loading: coursesLoading } = useQuery(GET_COURSES_SUMMARY, {
    variables: { limit: 200 },
    skip: scholarshipType !== "course",
  });
  const { data: programsData, loading: programsLoading } = useQuery(GET_INTERNSHIP_PROGRAMS, {
    variables: { limit: 200 },
    skip: scholarshipType !== "internship",
  });

  const [grantScholarship, { loading: granting }] = useMutation(GRANT_SCHOLARSHIP, {
    refetchQueries: [
      { query: GET_ALL_SCHOLARSHIPS },
      { query: GET_SCHOLARSHIP_STATS },
    ],
    onCompleted: () => {
      toast.success(`Scholarship granted successfully!`);
      handleClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to grant scholarship");
    },
  });

  const students = (studentsData as any)?.getAllStudents || [];
  const courses = (coursesData as any)?.courses?.items || [];
  const programs = (programsData as any)?.internshipPrograms?.items || [];

  const filteredStudents = students.filter((s: any) =>
    !searchTerm ||
    s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const items = scholarshipType === "course" ? courses : programs;

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setStep("details");
  };

  const handleGrant = async () => {
    if (!selectedStudent || !selectedItem) {
      toast.error("Please select a student and a course/program");
      return;
    }

    await grantScholarship({
      variables: {
        userId: selectedStudent.id,
        type: scholarshipType,
        itemId: selectedItem.id,
        itemTitle: selectedItem.title,
        reason: reason || undefined,
      },
    });
  };

  const handleClose = () => {
    setStep("select");
    setSelectedStudent(null);
    setScholarshipType("course");
    setSelectedItem(null);
    setReason("");
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            {step === "select" ? "Grant Scholarship" : "Confirm Scholarship"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Select a student to grant a scholarship"
              : `Grant ${scholarshipType} scholarship to ${selectedStudent?.fullName || selectedStudent?.username}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 py-2 overflow-y-auto">
          {step === "select" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted/20 border-none"
                />
              </div>

              {/* Students list */}
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-2">
                  {studentsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground italic text-sm">
                      {searchTerm ? "No students found" : "No students available"}
                    </div>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-muted/5 hover:bg-accent/5 hover:border-accent/30 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">
                            {student.fullName || student.username}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </p>
                        </div>
                        <Award className="w-4 h-4 text-accent/50 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-5 py-2">
              {/* Selected student badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold">{selectedStudent?.fullName || selectedStudent?.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudent?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={() => setStep("select")}
                >
                  Change
                </Button>
              </div>

              {/* Scholarship Type */}
              <div className="space-y-2">
                <Label>Scholarship Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setScholarshipType("course"); setSelectedItem(null); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      scholarshipType === "course"
                        ? "border-accent bg-accent/10"
                        : "border-border/30 hover:border-border/60"
                    }`}
                  >
                    <BookOpen className={`w-5 h-5 ${scholarshipType === "course" ? "text-accent" : "text-muted-foreground"}`} />
                    <div className="text-left">
                      <p className="text-sm font-bold">Course</p>
                      <p className="text-[10px] text-muted-foreground">Full free access</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setScholarshipType("internship"); setSelectedItem(null); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      scholarshipType === "internship"
                        ? "border-accent bg-accent/10"
                        : "border-border/30 hover:border-border/60"
                    }`}
                  >
                    <GraduationCap className={`w-5 h-5 ${scholarshipType === "internship" ? "text-accent" : "text-muted-foreground"}`} />
                    <div className="text-left">
                      <p className="text-sm font-bold">Internship</p>
                      <p className="text-[10px] text-muted-foreground">Free or partial</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Item selector */}
              <div className="space-y-2">
                <Label>{scholarshipType === "course" ? "Select Course" : "Select Internship Program"}</Label>
                <ScrollArea className="h-[200px] pr-2 border border-border/20 rounded-xl p-2">
                  <div className="space-y-1">
                    {(scholarshipType === "course" ? coursesLoading : programsLoading) ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      </div>
                    ) : items.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-sm italic">
                        No {scholarshipType === "course" ? "courses" : "programs"} available
                      </p>
                    ) : (
                      items.map((item: any) => {
                        const isSelected = selectedItem?.id === item.id;
                        const price = scholarshipType === "course" ? (item.discountPrice || item.price) : (item.price || 0);
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                              isSelected
                                ? "bg-accent/10 border border-accent/30"
                                : "hover:bg-muted/20 border border-transparent"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {price > 0 ? `${price.toLocaleString()} RWF` : "Free"}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Merit-based academic scholarship, Financial aid..."
                  className="min-h-[60px] resize-none bg-muted/10 border-border/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/30 bg-muted/10 flex items-center justify-between">
          <Button variant="ghost" onClick={handleClose} disabled={granting}>
            Cancel
          </Button>
          {step === "details" && (
            <Button
              variant="gold"
              onClick={handleGrant}
              disabled={!selectedItem || granting}
              className="min-w-[160px]"
            >
              {granting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Granting...</>
              ) : (
                <><Award className="w-4 h-4 mr-2" /> Grant Scholarship</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
