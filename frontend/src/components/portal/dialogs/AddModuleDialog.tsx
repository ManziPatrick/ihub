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
import { Layers } from "lucide-react";
import { toast } from "sonner";

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (module: ModuleData) => void;
  courses?: { id: string; title: string }[];
}

interface ModuleData {
  title: string;
  description: string;
  courseId: string;
  order: number;
}

const defaultCourses = [
  { id: "software-dev", title: "Software Development" },
  { id: "iot", title: "Internet of Things" },
  { id: "data-science", title: "Data Science & AI" },
];

export function AddModuleDialog({
  open,
  onOpenChange,
  onAdd,
  courses = defaultCourses,
}: AddModuleDialogProps) {
  const [form, setForm] = useState<ModuleData>({
    title: "",
    description: "",
    courseId: "",
    order: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.courseId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    onAdd?.(form);
    toast.success(`Module "${form.title}" added successfully!`);
    
    // Reset form
    setForm({
      title: "",
      description: "",
      courseId: "",
      order: 1,
    });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-md w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 rounded-none sm:rounded-lg">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            Add New Module
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="space-y-4 py-4">
            {/* Module Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Module Title *
            </label>
            <Input
              placeholder="Enter module title"
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
              placeholder="Brief description of module content..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
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

          {/* Order */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Module Order
            </label>
            <Input
              type="number"
              min={1}
              placeholder="1"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Position in the course curriculum
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
            {isSubmitting ? "Adding..." : "Add Module"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
