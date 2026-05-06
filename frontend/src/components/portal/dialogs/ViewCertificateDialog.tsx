import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Award, ShieldCheck, MapPin, Globe, Mail, Phone, Calendar, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/components/BrandingProvider";
import { useAuth } from "@/contexts/AuthContext";
import { CertificateTemplate } from "../CertificateTemplate";
import { useMutation } from "@apollo/client/react";
import { UPDATE_CERTIFICATE_NAME } from "@/lib/graphql/mutations";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check, Edit2 } from "lucide-react";

interface Certificate {
  id: string;
  courseTitle: string;
  issueDate: string;
  credentialId: string;
  recipientName?: string;
  signerName?: string;
  signerSignature?: string;
  user?: {
      fullName: string;
  };
  course?: {
      school?: string;
  };
}

interface ViewCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
}

export function ViewCertificateDialog({ 
  open, 
  onOpenChange, 
  certificate 
}: ViewCertificateDialogProps) {
  const { branding } = useBranding();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");

  const [updateName, { loading: updating }] = useMutation(UPDATE_CERTIFICATE_NAME);

  useEffect(() => {
    if (certificate) {
        setNewName(certificate.recipientName || certificate.user?.fullName || user?.fullName || "");
    }
  }, [certificate, user]);
  
  if (!certificate) return null;

  const handleUpdateName = async () => {
    try {
        await updateName({
            variables: {
                id: certificate.id,
                recipientName: newName
            }
        });
        toast.success("Certificate name updated successfully");
        setIsEditing(false);
        // We might want to refetch or update local state here
    } catch (error: any) {
        toast.error(error.message);
    }
  };

  const handleDownload = () => {
    const content = document.getElementById('certificate-content');
    if (!content) {
      toast.error("Could not find certificate content");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to download the certificate");
      return;
    }

    // Get all styles from the current document to preserve look
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${certificate.courseTitle}</title>
          <style>
            ${styles}
            @page { size: landscape; margin: 0; }
            body { 
                background: white !important; 
                margin: 0; 
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            #certificate-content { 
                display: block !important; 
                width: 297mm; /* A4 Landscape width */
                height: 210mm; /* A4 Landscape height */
                box-sizing: border-box;
            }
            .print\\:hidden { display: none !important; }
          </style>
        </head>
        <body>
          <div id="certificate-content">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/20 shrink-0 print:hidden">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-accent" />
            Official Certification
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-4 md:p-10 flex flex-col items-center bg-zinc-100 dark:bg-zinc-900/50" id="certificate-view">
            
            {/* Name Editor */}
            <div className="w-full max-w-[1000px] mb-6 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-accent" />
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recipient Name</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                                <Input 
                                    value={newName} 
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-8 w-64 bg-muted/50"
                                    placeholder="Enter full name"
                                />
                                <Button size="icon" variant="gold" className="h-8 w-8" onClick={handleUpdateName} disabled={updating}>
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <p className="font-bold text-foreground flex items-center gap-2">
                                {newName || 'Not set'}
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-accent" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Verification Status</p>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1.5 px-2 py-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Official & Verified
                    </Badge>
                </div>
            </div>

            {/* Design for the Certificate */}
            <div 
              id="certificate-content" 
              ref={certificateRef}
              className="w-full max-w-[1000px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] group"
            >
                <CertificateTemplate 
                    recipientName={newName}
                    courseTitle={certificate.courseTitle}
                    issueDate={certificate.issueDate}
                    credentialId={certificate.credentialId}
                    signerName={certificate.signerName || "Patrick Manzi"}
                    signerSignature={certificate.signerSignature}
                    schoolName={certificate.course?.school}
                />
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-border bg-muted/20 flex gap-4 shrink-0 print:hidden">
          <Button variant="outline" className="flex-1 h-14 gap-3 font-black uppercase tracking-tighter" onClick={handleDownload}>
            <Printer className="w-5 h-5" />
            Print Certificate
          </Button>
          <Button variant="gold" className="flex-1 h-14 gap-3 shadow-xl shadow-gold/30 font-black uppercase tracking-tighter" onClick={handleDownload}>
            <Download className="w-5 h-5" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
