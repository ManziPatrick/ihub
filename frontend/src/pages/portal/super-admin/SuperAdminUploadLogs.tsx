import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Trash2,
  Image,
  FileText,
  File,
  Search,
  Loader2,
  AlertTriangle,
  Clock,
  User,
  HardDrive,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useToast } from "@/hooks/use-toast";

const GET_UPLOAD_LOGS = gql`
  query GetUploadLogs($page: Int, $limit: Int, $type: String) {
    uploadLogs(page: $page, limit: $limit, type: $type) {
      items {
        id
        adminId {
          id
          username
          email
          fullName
          avatar
        }
        adminUsername
        fileName
        fileSize
        mimeType
        url
        publicId
        type
        action
        createdAt
      }
      pagination {
        totalCount
        totalPages
        currentPage
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const DELETE_UPLOAD_LOG = gql`
  mutation DeleteUploadLog($id: ID!) {
    deleteUploadLog(id: $id)
  }
`;

const CLEAR_ALL_UPLOAD_LOGS = gql`
  mutation ClearAllUploadLogs {
    clearAllUploadLogs
  }
`;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getTypeIcon(type: string) {
  switch (type) {
    case "image": return <Image className="w-4 h-4" />;
    case "file": return <File className="w-4 h-4" />;
    case "document": return <FileText className="w-4 h-4" />;
    default: return <Upload className="w-4 h-4" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case "image": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "file": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "document": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default: return "bg-accent/10 text-accent border-accent/20";
  }
}

export default function SuperAdminUploadLogs() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  const { data, loading, refetch } = useQuery(GET_UPLOAD_LOGS, {
    variables: { page, limit: 50, type: typeFilter || undefined },
    pollInterval: 30000,
  });

  const [deleteLog, { loading: deleting }] = useMutation(DELETE_UPLOAD_LOG, {
    onCompleted: () => {
      toast({ title: "Log deleted", description: "Upload log has been removed." });
      refetch();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const [clearAllLogs, { loading: clearing }] = useMutation(CLEAR_ALL_UPLOAD_LOGS, {
    onCompleted: (data: any) => {
      if (data.clearAllUploadLogs) {
        toast({ title: "All logs cleared", description: "Upload log history has been cleared." });
        refetch();
      }
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const uploadLogs = (data as any)?.uploadLogs?.items || [];
  const pagination = (data as any)?.uploadLogs?.pagination || {};
  const filteredLogs = searchQuery
    ? uploadLogs.filter((log: any) =>
        log.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.adminUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.mimeType?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : uploadLogs;

  const totalSize = uploadLogs.reduce((acc: number, log: any) => acc + (log.fileSize || 0), 0);
  const imageCount = uploadLogs.filter((l: any) => l.type === "image").length;
  const fileCount = uploadLogs.filter((l: any) => l.type !== "image").length;

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center border border-gold/40 shadow-xl shadow-gold/5">
              <Upload className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Upload Logs
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Monitor all file and image uploads across the platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl gap-2 border-border/50"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              disabled={uploadLogs.length === 0 || clearing}
              className="rounded-xl gap-2"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Clear All
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Uploads", value: pagination.totalCount || 0, icon: Upload, color: "text-gold", bg: "bg-gold/10" },
            { label: "Images", value: imageCount, icon: Image, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Files", value: fileCount, icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Total Size", value: formatFileSize(totalSize), icon: HardDrive, color: "text-green-500", bg: "bg-green-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 right-0 p-3 opacity-20 ${stat.color}`}>
                <stat.icon className="w-12 h-12" />
              </div>
              <CardContent className="p-5">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{stat.label}</p>
                <h3 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h3>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by file name, admin, or type..."
              className="pl-9 h-10 rounded-xl border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["", "image", "file", "document"].map((t) => (
              <Button
                key={t}
                variant={typeFilter === t ? "default" : "outline"}
                size="sm"
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className="rounded-xl text-xs"
              >
                {t || "All"}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 py-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold" />
                Upload History
                {pagination.totalCount > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs font-bold">
                    {pagination.totalCount} total
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-gold" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20">
                  <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No upload logs found.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border/10">
                    {filteredLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/5 transition-colors group"
                      >
                        {/* Type icon */}
                        <div className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getTypeColor(log.type)}`}>
                          {getTypeIcon(log.type)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground truncate max-w-[250px]">
                              {log.fileName}
                            </span>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 py-0 leading-none">
                              {log.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatFileSize(log.fileSize)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.adminUsername}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {log.createdAt ? format(new Date(parseInt(log.createdAt)), "MMM d, HH:mm") : ""}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground/50 truncate max-w-[180px]">
                              {log.mimeType}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={log.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                            title="Open file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(log.id)}
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Upload Log
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this upload log? This action cannot be undone.
              The uploaded file will still exist, but the log entry will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteLog({ variables: { id: deleteId } });
                  setDeleteId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Clear All Upload Logs
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all upload log entries ({pagination.totalCount} total).
              This action cannot be undone. The uploaded files themselves will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllLogs();
                setShowClearDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={clearing}
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
