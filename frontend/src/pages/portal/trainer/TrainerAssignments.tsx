import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextEditor } from "@/components/ui/text-editor";
import {
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Link as LinkIcon,
  ListTodo,
  User,
  Calendar as CalendarIcon,
  AlertCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Eye,
  Download,
  ThumbsDown,
  ThumbsUp,
  MessageSquare
} from "lucide-react";
import {
  GET_ALL_PROJECTS,
  GET_COURSES_SUMMARY,
  GET_ALL_STUDENTS
} from "@/lib/graphql/queries";
import {
  UPDATE_PROJECT,
  CREATE_PROJECT
} from "@/lib/graphql/mutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ViewSubmissionDialog, BookCallDialog } from "@/components/portal/dialogs";
import { toast } from "sonner";
import { format } from "date-fns";
import { triggerFileDownload } from "@/lib/download";

const safeFormatDate = (dateString: any, formatStr: string = 'MMM d, HH:mm') => {
  if (!dateString) return 'N/A';
  const timestamp = parseInt(dateString);
  const date = !isNaN(timestamp) ? new Date(timestamp) : new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return format(date, formatStr);
};


export default function TrainerAssignments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState("");
  const [viewSubmission, setViewSubmission] = useState<any | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Queries
  const { data, loading, refetch } = useQuery(GET_ALL_PROJECTS);
  const { data: coursesData } = useQuery(GET_COURSES_SUMMARY, {
    fetchPolicy: "cache-first",
  });
  const { data: studentsData } = useQuery(GET_ALL_STUDENTS);

  const [updateProject] = useMutation(UPDATE_PROJECT);
  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT);

  // Create Assignment State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    userId: "",
    title: "",
    course: "",
    description: "",
    deadline: "",
    tasks: [{ title: "", completed: false }],
    links: [{ title: "", url: "" }]
  });

  const projects = (data as any)?.projects?.items || [];

  // Filter pending and reviewed
  // Assuming a project is "pending" if it has been submitted (submittedAt is set) but not graded (grade is null)
  // And "reviewed" if it has a grade.
  // Note: projects without submittedAt are not submissions yet.

  const pendingSubmissions = projects.filter((p: any) =>
    p.submittedAt && !p.grade &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const reviewedSubmissions = projects.filter((p: any) =>
    p.grade &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedSubmission = projects.find((p: any) => p.id === selectedSubmissionId);

  // Reset form when selection changes
  useEffect(() => {
    if (selectedSubmission) {
      setGrade(selectedSubmission.grade || "");
      setFeedback(selectedSubmission.feedback || "");
    }
  }, [selectedSubmissionId, selectedSubmission]);

  const handleCreateAssignment = async () => {
    if (!newAssignment.userId || !newAssignment.title || !newAssignment.course || !newAssignment.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createProject({
        variables: {
          userId: newAssignment.userId,
          title: newAssignment.title,
          course: newAssignment.course,
          type: 'Individual',
          description: newAssignment.description,
          deadline: newAssignment.deadline || null,
          tasks: newAssignment.tasks.filter(t => t.title.trim() !== ""),
          documentation: {
            links: newAssignment.links.filter(l => l.title.trim() !== "" && l.url.trim() !== "")
          }
        }
      });

      toast.success("Assignment created successfully");
      setIsCreateOpen(false);
      setNewAssignment({
        userId: "",
        title: "",
        course: "",
        description: "",
        deadline: "",
        tasks: [{ title: "", completed: false }],
        links: [{ title: "", url: "" }]
      });
      refetch();
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      toast.error(error.message || "Failed to create assignment");
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmissionId || !grade) {
      toast.error("Please enter a grade");
      return;
    }

    try {
      await updateProject({
        variables: {
          id: selectedSubmissionId,
          grade: grade,
          feedback: feedback,
          status: 'completed'
        }
      });

      toast.success("Grade submitted successfully");
      refetch();
      setSelectedSubmissionId(null);
      setGrade("");
      setFeedback("");
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Failed to submit grade");
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedSubmissionId) return;

    try {
      if (!feedback) {
        toast.error("Please provide feedback for revision");
        return;
      }

      await updateProject({
        variables: {
          id: selectedSubmissionId,
          status: 'revision_requested',
          feedback: feedback
        }
      });

      toast.success("Revision requested");
      refetch();
      setSelectedSubmissionId(null);
      setFeedback("");
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Failed to request revision");
    }
  };

  const handleDownload = () => {
    if (selectedSubmission?.submissionUrl) {
      triggerFileDownload(selectedSubmission.submissionUrl, `${selectedSubmission.title || 'submission'}`);
      toast.success('Download started (or opened in new tab).');
    } else {
      toast.error("No submission file available");
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </PortalLayout>
    );
  }

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
              Project Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Review team and individual projects, milestones, and deliverables
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-accent/20 text-accent border-0">
              <AlertCircle className="w-3 h-3 mr-1" />
              {pendingSubmissions.length} pending reviews
            </Badge>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="gold" className="shadow-lg shadow-gold/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Assign Custom Task</DialogTitle>
                  <DialogDescription>
                    Assign a specific project or task to a student.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Select Student *</Label>
                    <Select
                      value={newAssignment.userId}
                      onValueChange={(val) => setNewAssignment({ ...newAssignment, userId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chose student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(studentsData as any)?.getAllStudents?.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.fullName || s.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Assignment Title *</Label>
                    <Input
                      id="title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="e.g. Advanced React Patterns"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Track / Course *</Label>
                    <Select
                      value={newAssignment.course}
                      onValueChange={(val) => setNewAssignment({ ...newAssignment, course: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course context..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(coursesData as any)?.courses?.items?.map((c: any) => (
                          <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Deadline (Optional)</Label>
                    <Input
                      type="date"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Deliverables / Checklist</Label>
                    <div className="space-y-2">
                      {newAssignment.tasks.map((task, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Deliverable title..."
                            value={task.title}
                            onChange={(e) => {
                              const updated = [...newAssignment.tasks];
                              updated[index].title = e.target.value;
                              setNewAssignment({ ...newAssignment, tasks: updated });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = newAssignment.tasks.filter((_, i) => i !== index);
                              setNewAssignment({ ...newAssignment, tasks: updated.length ? updated : [{ title: "", completed: false }] });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => setNewAssignment({ ...newAssignment, tasks: [...newAssignment.tasks, { title: "", completed: false }] })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Task
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Resource Links</Label>
                    <div className="space-y-2">
                      {newAssignment.links.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Label"
                            className="w-1/3"
                            value={link.title}
                            onChange={(e) => {
                              const updated = [...newAssignment.links];
                              updated[index].title = e.target.value;
                              setNewAssignment({ ...newAssignment, links: updated });
                            }}
                          />
                          <Input
                            placeholder="URL"
                            className="flex-1"
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...newAssignment.links];
                              updated[index].url = e.target.value;
                              setNewAssignment({ ...newAssignment, links: updated });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = newAssignment.links.filter((_, i) => i !== index);
                              setNewAssignment({ ...newAssignment, links: updated.length ? updated : [{ title: "", url: "" }] });
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => setNewAssignment({ ...newAssignment, links: [...newAssignment.links, { title: "", url: "" }] })}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Link
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Instructions</Label>
                    <TextEditor
                      value={newAssignment.description}
                      onChange={(content) => setNewAssignment({ ...newAssignment, description: content })}
                      placeholder="Write detailed instructions..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button variant="gold" onClick={handleCreateAssignment} disabled={creatingProject}>
                    {creatingProject ? "Assigning..." : "Assign Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pending ({pendingSubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed ({reviewedSubmissions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-3">
                {pendingSubmissions.map((submission: any) => (
                  <Card
                    key={submission.id}
                    className={`border-border/50 cursor-pointer transition-all hover:shadow-card-hover ${selectedSubmissionId === submission.id ? "ring-2 ring-accent" : ""
                      }`}
                    onClick={() => setSelectedSubmissionId(submission.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-accent font-medium">
                              {submission.user?.username ? submission.user.username.substring(0, 2).toUpperCase() : '??'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-card-foreground">
                              {submission.user?.username || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-card-foreground/70 mt-0.5">
                              {submission.title}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {submission.type}
                              </Badge>
                              <span className="text-xs text-card-foreground/60">
                                {submission.course}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-card-foreground/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {safeFormatDate(submission.submittedAt)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-card-foreground/40" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingSubmissions.length === 0 && (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="font-heading text-lg font-medium text-foreground mb-2">
                        All caught up!
                      </h3>
                      <p className="text-muted-foreground">
                        No pending submissions to review
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviewed" className="space-y-3">
                {reviewedSubmissions.map((submission: any) => (
                  <Card key={submission.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-card-foreground">
                              {submission.user?.username || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-card-foreground/70 mt-0.5">
                              {submission.title}
                            </p>
                            <p className="text-xs text-card-foreground/60 mt-2 truncate max-w-[300px]">
                              "{submission.feedback || 'No feedback'}"
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-accent text-accent-foreground">
                            {submission.grade}/100
                          </Badge>
                          <p className="text-xs text-card-foreground/60 mt-1">
                            {safeFormatDate(submission.updatedAt, 'MMM d')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {reviewedSubmissions.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No reviewed submissions yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Grading Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg font-heading">Grade Submission</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSubmission ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="font-medium text-card-foreground text-sm">
                        {selectedSubmission.title}
                      </p>
                      <p className="text-xs text-card-foreground/60 mt-1">
                        by {selectedSubmission.user.username}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setViewSubmission(selectedSubmission)}
                      >
                        <Eye className="w-4 h-4 mr-1" /> View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setBookingOpen(true)}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" /> Book Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleDownload}
                        disabled={!selectedSubmission.submissionUrl}
                      >
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Grade (0-100) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="Enter grade..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">
                        Feedback
                      </label>
                      <TextEditor
                        value={feedback}
                        onChange={(content) => setFeedback(content)}
                        placeholder="Provide constructive feedback..."
                      />
                    </div>

                    <div className="flex gap-2">
                      {selectedSubmission.status !== 'graded' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={handleRequestRevision}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" /> Request Revision
                        </Button>
                      )}
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1"
                        onClick={handleGradeSubmit}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" /> {selectedSubmission.grade ? 'Update Grade' : 'Submit Grade'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Select a submission to review and grade
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialogs */}
      <ViewSubmissionDialog
        open={!!viewSubmission}
        onOpenChange={(open) => !open && setViewSubmission(null)}
        submission={viewSubmission ? {
          id: viewSubmission.id,
          student: viewSubmission.user?.username || 'Unknown User',
          assignment: viewSubmission.title,
          course: viewSubmission.course,
          submittedAt: safeFormatDate(viewSubmission.submittedAt),
          type: viewSubmission.type,
          description: viewSubmission.description, // Pass description if available
          submissionUrl: viewSubmission.submissionUrl
        } : null}
      />

      <BookCallDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        mentorId={selectedSubmission?.user?.id}
        purpose="assignment-review"
        mentorName={selectedSubmission?.user?.username}
      />
    </PortalLayout>
  );
}
