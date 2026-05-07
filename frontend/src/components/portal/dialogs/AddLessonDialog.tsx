import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextEditor } from "@/components/ui/text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, FileText, Clock, Upload } from "lucide-react";
import { toast } from "sonner";

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (lesson: LessonData) => void;
  courses?: { id: string; title: string }[];
  modules?: { id: number; title: string }[];
}

interface LessonData {
  title: string;
  description: string;
  courseId: string;
  moduleId: string;
  type: string;
  duration: string;
}

const defaultCourses = [
  { id: "software-dev", title: "Software Development" },
  { id: "iot", title: "Internet of Things" },
  { id: "data-science", title: "Data Science & AI" },
];

const defaultModules = [
  { id: 1, title: "Introduction to React" },
  { id: 2, title: "React Hooks & State" },
  { id: 3, title: "Advanced Patterns" },
  { id: 4, title: "Testing & Deployment" },
];

export function AddLessonDialog({
  open,
  onOpenChange,
  onAdd,
  courses = defaultCourses,
  modules = defaultModules,
}: AddLessonDialogProps) {
  const [form, setForm] = useState<LessonData>({
    title: "",
    description: "",
    courseId: "",
    moduleId: "",
    type: "video",
    duration: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.courseId || !form.moduleId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    onAdd?.(form);
    toast.success(`Lesson "${form.title}" created successfully!`);
    
    // Reset form
    setForm({
      title: "",
      description: "",
      courseId: "",
      moduleId: "",
      type: "video",
      duration: "",
    });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-lg w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Create New Lesson</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="space-y-4 py-4">
          {/* Lesson Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Lesson Title *
            </label>
            <Input
              placeholder="Enter lesson title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description
            </label>
            <TextEditor
              placeholder="Detailed lesson content, instructions, and materials..."
              value={form.description}
              onChange={(content) => setForm({ ...form, description: content })}
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

          {/* Module Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Module *
            </label>
            <Select
              value={form.moduleId}
              onValueChange={(value) => setForm({ ...form, moduleId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id.toString()}>
                    {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Type & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lesson Type
              </label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" /> Video
                    </div>
                  </SelectItem>
                  <SelectItem value="article">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Article
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Quiz
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., 15 min"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Upload Hint */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              You can upload content after creating the lesson
            </p>
          </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
          Cancel
          </Button>
          <Button
            variant="gold"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Lesson"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
