import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  Download,
  ExternalLink,
  Lock,
  CheckCircle,
  Calendar,
  Share2,
} from "lucide-react";
import { ShareCertificateDialog, ViewCertificateDialog } from "@/components/portal/dialogs";
import { toast } from "sonner";
import { useQuery } from "@apollo/client/react";
import { GET_MY_CERTIFICATES } from "@/lib/graphql/queries";

interface MyCertificatesData {
  myCertificates: Certificate[];
}

interface Certificate {
  id: string;
  courseTitle: string;
  issueDate: string | null;
  credentialId?: string;
  recipientName?: string;
  signerName?: string;
  signerSignature?: string;
  status: string;
  grade?: number;
  progress?: number;
  requirements?: Array<{
    title: string;
    completed: boolean;
    current?: number;
    total?: number;
  }>;
}

export default function StudentCertificates() {
  const [shareCertificate, setShareCertificate] = useState<{
    id: string;
    courseName: string;
    completedDate: string;
    credentialId: string;
  } | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  // Fetch certificates from GraphQL
  const { data, loading, error } = useQuery<MyCertificatesData>(GET_MY_CERTIFICATES);
  const certificates: Certificate[] = data?.myCertificates || [];

  const issuedCerts = certificates.filter((c) => c.status === "issued");
  const inProgressCerts = certificates.filter((c) => c.status === "in_progress");

  const handleDownload = (cert: Certificate) => {
    if (cert.issueDate) {
        setSelectedCertificate({
            id: cert.id,
            courseTitle: cert.courseTitle,
            issueDate: cert.issueDate,
            credentialId: cert.credentialId || 'PENDING',
            grade: cert.grade,
            recipientName: cert.recipientName,
            signerName: cert.signerName,
            signerSignature: cert.signerSignature
        });
    } else {
        toast.error("Certificate not yet available for download");
    }
  };

  const handleViewOnline = (cert: Certificate) => {
    window.open(`https://codemande.com/verify/${cert.credentialId}`, "_blank");
    toast.success("Opening certificate verification page...");
  };

  const handleShare = (cert: Certificate) => {
    if (cert.credentialId && cert.issueDate) {
      setShareCertificate({
        id: cert.id,
        courseName: cert.courseTitle,
        completedDate: cert.issueDate,
        credentialId: cert.credentialId,
      });
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-muted rounded-full animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="h-48 bg-muted rounded-xl animate-pulse"></div>
            <div className="h-48 bg-muted rounded-xl animate-pulse"></div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading certificates: {error.message}</p>
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
              My Certificates
            </h1>
            <p className="text-muted-foreground mt-1">
              Earn recognized certifications by completing courses
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">{issuedCerts.length} Earned</span>
            </div>
          </div>
        </motion.div>

        {/* Issued Certificates */}
        {issuedCerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-heading text-lg font-medium text-foreground mb-4">
              Earned Certificates
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {issuedCerts.map((cert) => (
                <Card key={cert.id} className="border-border/50 overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-accent/20 via-accent/10 to-card flex items-center justify-center relative">
                    <Award className="w-16 h-16 text-accent/50" />
                    <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-heading text-lg font-semibold text-card-foreground mb-2">
                      {cert.courseTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-card-foreground/60 mb-4">
                      <Calendar className="w-4 h-4" />
                      Issued on {cert.issueDate && !isNaN(Number(cert.issueDate)) 
                        ? new Date(Number(cert.issueDate)).toLocaleDateString() 
                        : cert.issueDate}
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-card-foreground/50">
                        Credential ID: {cert.credentialId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="gold" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDownload(cert)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShare(cert)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOnline(cert)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* In Progress Certificates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-heading text-lg font-medium text-foreground mb-4">
            Certificates in Progress
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {inProgressCerts.map((cert) => (
              <Card key={cert.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <Lock className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-card-foreground">
                        {cert.courseTitle}
                      </h3>
                      <p className="text-sm text-card-foreground/60">
                        {cert.progress}% complete
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-card-foreground">Requirements:</p>
                    {cert.requirements?.map((req, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle
                          className={`w-5 h-5 ${
                            req.completed ? "text-accent" : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${
                            req.completed ? "text-card-foreground" : "text-card-foreground/70"
                          }`}>
                            {req.title}
                          </span>
                          {req.current !== undefined && (
                            <span className="text-xs text-card-foreground/50 ml-2">
                              ({req.current}/{req.total})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {certificates.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                No Certificates Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Complete courses and projects to earn industry-recognized certificates
              </p>
              <Button variant="gold">Browse Courses</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Share Dialog */}
      <ShareCertificateDialog
        open={!!shareCertificate}
        onOpenChange={(open) => !open && setShareCertificate(null)}
        certificate={shareCertificate}
      />
      <ViewCertificateDialog
        open={!!selectedCertificate}
        onOpenChange={(open) => !open && setSelectedCertificate(null)}
        certificate={selectedCertificate}
      />
    </PortalLayout>
  );
}
