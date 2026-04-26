import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_PROJECT } from "@/lib/graphql/mutations";
import { useRef } from "react";
import { getApiBaseUrl } from "@/lib/env";

interface SubmitProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  projectId: string;
}

export function SubmitProjectDialog({ open, onOpenChange, projectTitle, projectId }: SubmitProjectDialogProps) {
  const [files, setFiles] = useState<{ name: string, url: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitProject, { loading: isSubmitting }] = useMutation(SUBMIT_PROJECT);

  const API_BASE_URL = getApiBaseUrl();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      setFiles([...files, { name: file.name, url: data.url }]);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!repoUrl && files.length === 0) {
      toast.error("Please provide a repository URL or upload files");
      return;
    }

    const submissionUrl = repoUrl || (files.length > 0 ? files[0].url : 'No URL');

    try {
      await submitProject({
        variables: {
          id: projectId,
          submissionUrl: submissionUrl
        }
      });

      toast.success("Project submitted successfully!");
      setFiles([]);
      setNotes("");
      setRepoUrl("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting project:", error);
      toast.error(error.message || "Failed to submit project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Submit Project</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="space-y-4 py-4">
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-sm text-card-foreground/60">Submitting:</p>
              <p className="font-medium text-card-foreground">{projectTitle}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Repository URL (Required)</label>
              <Input
                placeholder="https://github.com/username/project"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide a link to your code repository or live demo.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Upload Files</label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div
                className={`border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`w-8 h-8 text-muted-foreground mx-auto mb-2 ${isUploading ? 'animate-bounce' : ''}`} />
                <p className="text-sm text-muted-foreground">
                  {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ZIP, PDF, or document files up to 50MB
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="text-sm text-card-foreground">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="p-1 hover:bg-destructive/20 rounded"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Notes</label>
              <Textarea
                placeholder="Any additional information about your submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Project
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
