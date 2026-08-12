import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextEditor } from "@/components/ui/text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface AddFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  type: "mentorship" | "internship";
}

export function AddFeedbackDialog({ open, onOpenChange, studentName, type }: AddFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (!feedback) {
      toast.error("Please provide feedback");
      return;
    }

    toast.success(`Feedback added for ${studentName}`);
    setRating(0);
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Add Feedback for {studentName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="space-y-4 py-4">
            <div className="p-3 bg-background/50 rounded-lg text-center">
              <p className="text-sm text-card-foreground/70 mb-2">
                {type === "mentorship" ? "Mentorship Progress" : "Program Performance"}
              </p>
            </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Feedback</label>
            <TextEditor
              value={feedback}
              onChange={(content) => setFeedback(content)}
              placeholder="Write your feedback about the student's progress..."
            />
          </div>

          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleSubmit}>
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
