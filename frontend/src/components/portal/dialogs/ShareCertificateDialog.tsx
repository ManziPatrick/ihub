import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Share2, Copy, Linkedin, Twitter, Facebook, Mail, Check } from "lucide-react";
import { toast } from "sonner";

interface Certificate {
  id: string;
  courseName: string;
  completedDate: string;
  credentialId: string;
}

interface ShareCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
}

export function ShareCertificateDialog({ 
  open, 
  onOpenChange, 
  certificate 
}: ShareCertificateDialogProps) {
  const [copied, setCopied] = useState(false);
  
  if (!certificate) return null;

  const shareUrl = `https://ihub.com/verify/${certificate.credentialId}`;
  const shareText = `I just earned my ${certificate.courseName} certificate from MultiCourses! 🎓`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(`My ${certificate.courseName} Certificate`)}&body=${encodeURIComponent(`${shareText}\n\nVerify here: ${shareUrl}`)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
      toast.success(`Opening ${platform}...`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent" />
            Share Certificate
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6 custom-scrollbar">
          <div className="space-y-4 py-4">
          {/* Certificate Info */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/30 text-center">
            <h3 className="font-heading font-semibold text-card-foreground">
              {certificate.courseName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Completed on {certificate.completedDate}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Credential ID: {certificate.credentialId}
            </p>
          </div>

          {/* Copy Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div>
            <label className="text-sm font-medium mb-3 block">Share on</label>
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="w-5 h-5 text-[#1877F2]" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => handleShare("email")}
              >
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-xs">Email</span>
              </Button>
            </div>
          </div>

          </div>
        </ScrollArea>

        <div className="p-4 sm:p-6 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
