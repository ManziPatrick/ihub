import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  AlertTriangle,
  Loader2,
  Clock,
  User,
  HardDrive,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ListRestart,
  History,
  Info,
  ChevronRight,
  FileJson,
  Layers,
  Wifi,
  WifiOff,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import { gql } from "@apollo/client";
import { useQuery, useMutation } from "@apollo/client/react";
import { useToast } from "@/hooks/use-toast";

// ─── GraphQL Queries & Mutations ──────────────────────────────────────────

const GET_BACKUPS = gql`
  query GetBackups {
    backups {
      id
      backupDbName
      size
      actualSize
      collections
      status
      errorMessage
      triggeredBy {
        id
        username
        fullName
        email
      }
      metadata
      completedAt
      createdAt
    }
    backupClusterStatus {
      connected
      host
      backupCount
      lastBackup
      totalSize
    }
  }
`;

const TRIGGER_BACKUP = gql`
  mutation TriggerBackup {
    triggerBackup {
      id
      backupDbName
      status
      collections
      createdAt
    }
  }
`;

const RESTORE_BACKUP = gql`
  mutation RestoreBackup($backupId: ID!, $collections: [String!]) {
    restoreBackup(backupId: $backupId, collections: $collections) {
      success
      message
      restoredCollections
      totalDocs
    }
  }
`;

const DELETE_BACKUP = gql`
  mutation DeleteBackup($backupId: ID!) {
    deleteBackup(backupId: $backupId)
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "in_progress": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "failed": return "bg-red-500/10 text-red-400 border-red-500/20";
    default: return "bg-muted/10 text-muted-foreground border-muted/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case "in_progress": return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SuperAdminBackups() {
  const { toast } = useToast();
  const [restoreTarget, setRestoreTarget] = useState<any>(null);
  const [restoreAllCollections, setRestoreAllCollections] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_BACKUPS, {
    pollInterval: 15000,
    fetchPolicy: "network-only",
  });

  const [triggerBackup, { loading: backingUp }] = useMutation(TRIGGER_BACKUP, {
    onCompleted: (data: any) => {
      toast({
        title: "Backup initiated",
        description: `Backup "${data.triggerBackup.backupDbName}" is now in progress.`,
      });
      setShowBackupDialog(false);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    },
  });

  const [restoreBackup, { loading: restoring }] = useMutation(RESTORE_BACKUP, {
    onCompleted: (data: any) => {
      const result = data.restoreBackup;
      if (result.success) {
        toast({
          title: "Restore completed",
          description: result.message,
        });
      } else {
        toast({
          title: "Restore failed",
          description: result.message,
          variant: "destructive",
        });
      }
      setRestoreTarget(null);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    },
  });

  const [deleteBackup, { loading: deleting }] = useMutation(DELETE_BACKUP, {
    onCompleted: () => {
      toast({ title: "Backup deleted", description: "Backup snapshot has been removed." });
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const backups = (data as any)?.backups || [];
  const clusterStatus = (data as any)?.backupClusterStatus || {};

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
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 shadow-xl shadow-emerald-500/5">
              <Database className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
                Database Backups
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage automatic and manual backup snapshots
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
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBackupDialog(true)}
              disabled={backingUp}
              className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {backingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Manual Backup
            </Button>
          </div>
        </motion.div>

        {/* Cluster Status & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Backup Cluster Connection */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative col-span-1">
            <div className={`absolute top-0 right-0 p-3 opacity-10 ${clusterStatus.connected ? "text-green-500" : "text-red-500"}`}>
              {clusterStatus.connected ? <Wifi className="w-12 h-12" /> : <WifiOff className="w-12 h-12" />}
            </div>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Backup Cluster</p>
              <div className="flex items-center gap-2 mt-1">
                {clusterStatus.connected ? (
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-red-400" />
                )}
                <h3 className={`font-bold ${clusterStatus.connected ? "text-green-400" : "text-red-400"}`}>
                  {clusterStatus.connected ? "Connected" : "Disconnected"}
                </h3>
              </div>
              {clusterStatus.host && (
                <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                  {clusterStatus.host}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Backups */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-gold">
              <History className="w-12 h-12" />
            </div>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Snapshots</p>
              <h3 className="text-2xl font-bold text-gold">{clusterStatus.backupCount || 0}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {backups.filter((b: any) => b.status === "completed").length} completed
              </p>
            </CardContent>
          </Card>

          {/* Total Size */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-blue-500">
              <HardDrive className="w-12 h-12" />
            </div>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Total Size</p>
              <h3 className="text-2xl font-bold text-blue-400">{formatFileSize(clusterStatus.totalSize)}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Across all snapshots</p>
            </CardContent>
          </Card>

          {/* Last Backup */}
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 text-purple-500">
              <Clock className="w-12 h-12" />
            </div>
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Last Backup</p>
              <h3 className="text-lg font-bold text-purple-400">
                {clusterStatus.lastBackup
                  ? formatDistanceToNow(new Date(clusterStatus.lastBackup), { addSuffix: true })
                  : "Never"}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                {clusterStatus.lastBackup
                  ? format(new Date(clusterStatus.lastBackup), "MMM d, yyyy HH:mm")
                  : "No backups yet"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Backups List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/20 py-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                Backup Snapshots
                {backups.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs font-bold">
                    {backups.length} total
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Auto-backups run every 12 hours. Last 5 snapshots are retained.
              </CardDescription>
            </CardHeader>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading backups...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-red-400 font-medium mb-1">Failed to load backups</p>
                <p className="text-xs text-muted-foreground mb-4">{(error as any).message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : backups.length === 0 ? (
              <CardContent className="text-center py-20">
                <Database className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">No backup snapshots yet.</p>
                <p className="text-xs text-muted-foreground/60 mb-4">
                  Auto-backups run every 12 hours, or you can trigger one manually.
                </p>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowBackupDialog(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Backup Now
                </Button>
              </CardContent>
            ) : (
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y divide-border/10">
                    {backups.map((backup: any) => (
                      <div
                        key={backup.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/5 transition-colors group"
                      >
                        {/* Status icon */}
                        <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getStatusColor(backup.status)}`}>
                          {getStatusIcon(backup.status)}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground font-mono">
                              {backup.backupDbName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold px-1.5 py-0 leading-none ${backup.status === "completed" ? "border-green-500/30 text-green-400" : backup.status === "failed" ? "border-red-500/30 text-red-400" : "border-blue-500/30 text-blue-400"}`}
                            >
                              {backup.status === "completed" ? "Completed" : backup.status === "in_progress" ? "In Progress" : "Failed"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {backup.collections?.length || 0} collections
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatFileSize(backup.actualSize || backup.size)}
                            </span>
                            {backup.triggeredBy ? (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {backup.triggeredBy.fullName || backup.triggeredBy.username}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 leading-none text-muted-foreground/60">
                                Auto
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {backup.createdAt
                                ? format(new Date(parseInt(backup.createdAt) || backup.createdAt), "MMM d, yyyy HH:mm")
                                : ""}
                            </span>
                          </div>

                          {/* Error message for failed backups */}
                          {backup.status === "failed" && backup.errorMessage && (
                            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-red-400 bg-red-500/5 rounded-lg p-2">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{backup.errorMessage}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {backup.status === "completed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRestoreTarget(backup);
                                  setRestoreAllCollections(true);
                                  setSelectedCollections([]);
                                }}
                                className="h-8 px-2 text-xs hover:bg-amber-500/10 hover:text-amber-400 text-muted-foreground"
                                title="Restore from this backup"
                              >
                                <ListRestart className="w-3.5 h-3.5 mr-1" />
                                Restore
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(backup)}
                                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
                                title="Delete backup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                How Backups Work
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1.5">
              <p>• <strong>Auto-backups</strong> run every 12 hours at 2:00 AM and 2:00 PM.</p>
              <p>• Each backup creates a <strong>point-in-time snapshot</strong> of all collections in the primary database.</p>
              <p>• Snapshots are stored in a <strong>separate backup MongoDB cluster</strong> configured via <code className="text-[10px] px-1 py-0.5 rounded bg-muted font-mono">BACKUP_MONGO_URI</code>.</p>
              <p>• Only the <strong>5 most recent</strong> completed snapshots are kept (oldest are automatically pruned).</p>
              <p>• <strong>Restore</strong> wipes the primary database and replaces it with data from the selected snapshot.</p>
              <p>• You can restore <strong>all collections</strong> or select <strong>specific collections</strong> to restore.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Manual Backup Dialog ─── */}
      <AlertDialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-500" />
              Create Manual Backup
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will create a full snapshot of the primary database and store it in the backup cluster.
              The process may take a few minutes depending on database size.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Cluster status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-xs">
            {clusterStatus.connected ? (
              <>
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Backup cluster connected</span>
                {clusterStatus.host && (
                  <span className="text-muted-foreground ml-1 font-mono">({clusterStatus.host})</span>
                )}
              </>
            ) : (
              <>
                <ShieldOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Backup cluster not connected</span>
                <span className="text-muted-foreground ml-1">Check BACKUP_MONGO_URI env var</span>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => triggerBackup()}
              disabled={!clusterStatus.connected || backingUp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {backingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Start Backup
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Restore Dialog ─── */}
      <Dialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              Restore from Backup
            </DialogTitle>
            <DialogDescription className="pt-2">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 font-medium mb-1">Warning: Destructive Action</p>
                  <p className="text-xs text-muted-foreground">
                    Restoring will permanently <strong>overwrite existing data</strong> in the primary database
                    with data from this backup snapshot. This action cannot be undone.
                  </p>
                </div>

                <div className="text-sm">
                  <p className="text-foreground font-medium mb-1">
                    Backup: <span className="font-mono text-emerald-400">{restoreTarget?.backupDbName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {restoreTarget?.createdAt ? formatDistanceToNow(new Date(parseInt(restoreTarget.createdAt) || restoreTarget.createdAt), { addSuffix: true }) : ""}
                    {" "}with {restoreTarget?.collections?.length || 0} collections
                    {" "}({formatFileSize(restoreTarget?.actualSize || restoreTarget?.size)})
                  </p>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-medium mb-2 block">Restore Options</Label>
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id="restoreAll"
                      checked={restoreAllCollections}
                      onCheckedChange={(checked) => {
                        setRestoreAllCollections(!!checked);
                        if (checked) setSelectedCollections([]);
                      }}
                    />
                    <Label htmlFor="restoreAll" className="text-sm cursor-pointer">
                      Restore all collections
                    </Label>
                  </div>

                  {!restoreAllCollections && restoreTarget?.collections?.length > 0 && (
                    <div className="ml-6 space-y-1.5">
                      {restoreTarget.collections.map((col: string) => (
                        <div key={col} className="flex items-center gap-2">
                          <Checkbox
                            id={`col-${col}`}
                            checked={selectedCollections.includes(col)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCollections((prev) => [...prev, col]);
                              } else {
                                setSelectedCollections((prev) => prev.filter((c) => c !== col));
                              }
                            }}
                          />
                          <Label htmlFor={`col-${col}`} className="text-xs font-mono cursor-pointer">
                            {col}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {restoring && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Restoring data... This may take a while.
                    </div>
                    <Progress value={45} className="h-1" />
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreTarget(null)}
              disabled={restoring}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const backupId = restoreTarget.id;
                const collections = restoreAllCollections ? undefined : selectedCollections;
                restoreBackup({
                  variables: { backupId, collections: collections?.length ? collections : undefined },
                });
              }}
              disabled={restoring || (!restoreAllCollections && selectedCollections.length === 0)}
              className="rounded-xl gap-2"
            >
              {restoring ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ListRestart className="w-4 h-4" />
              )}
              {restoring ? "Restoring..." : `Restore${!restoreAllCollections && selectedCollections.length > 0 ? ` (${selectedCollections.length} collections)` : " All"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Backup Snapshot
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the backup snapshot{" "}
              <strong className="font-mono text-foreground">{deleteTarget?.backupDbName}</strong>?
              This will permanently remove the backup data from the backup cluster.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteBackup({ variables: { backupId: deleteTarget.id } });
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
      </Dialog>
    </PortalLayout>
  );
}
