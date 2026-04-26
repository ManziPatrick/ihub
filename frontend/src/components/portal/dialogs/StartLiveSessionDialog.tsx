import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Users, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface StartLiveSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart?: (session: SessionData) => void;
}

interface SessionData {
  title: string;
  description: string;
  courseId: string;
  meetingLink: string;
}

const courses = [
  { id: "software-dev", title: "Software Development" },
  { id: "iot", title: "Internet of Things" },
  { id: "data-science", title: "Data Science & AI" },
  { id: "all", title: "All Courses (Office Hours)" },
];

export function StartLiveSessionDialog({
  open,
  onOpenChange,
  onStart,
}: StartLiveSessionDialogProps) {
  const [step, setStep] = useState<"setup" | "ready">("setup");
  const [form, setForm] = useState<SessionData>({
    title: "",
    description: "",
    courseId: "",
    meetingLink: "",
  });
  const [copied, setCopied] = useState(false);

  const generateMeetingLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const segment = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
  };

  const handleStartSession = async () => {
    if (!form.title || !form.courseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const meetingLink = form.meetingLink || generateMeetingLink();
    setForm({ ...form, meetingLink });
    setStep("ready");

    onStart?.({ ...form, meetingLink });
    toast.success("Live session is ready!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(form.meetingLink);
    setCopied(true);
    toast.success("Meeting link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSession = () => {
    window.open(form.meetingLink, "_blank");
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep("setup");
    setForm({ title: "", description: "", courseId: "", meetingLink: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-accent" />
            {step === "setup" ? "Start Live Session" : "Session Ready"}
          </DialogTitle>
        </DialogHeader>

        {step === "setup" ? (
          <>
            <ScrollArea className="flex-1 px-4 sm:px-6 overflow-y-auto">
              <div className="space-y-4 py-4">
                {/* Session Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Session Title *
                  </label>
                  <Input
                    placeholder="e.g., React Hooks Deep Dive"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="What will you cover in this session?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Course *
                  </label>
                  <Select
                    value={form.courseId}
                    onValueChange={(value) => setForm({ ...form, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Meeting Link (Optional)
                  </label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={form.meetingLink}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste your Google Meet link here, or leave empty to generate a IHub Meet link.
                  </p>
                </div>

                {/* Info */}
                <div className="p-3 bg-accent/10 rounded-lg flex items-start gap-2">
                  <Users className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Notify Students</p>
                    <p className="text-xs text-muted-foreground">
                      Enrolled students will receive an instant notification
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleStartSession}
              >
                <Video className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4 p-4 sm:p-6">
            {/* Success State */}
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-medium text-card-foreground mb-1">
                {form.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Your live session is ready to start
              </p>
            </div>

            {/* Meeting Link */}
            <div className="p-4 bg-background/50 rounded-lg">
              <label className="text-sm font-medium mb-2 block">
                Meeting Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.meetingLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleJoinSession}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Join Session
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
