import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  Zap,
  Trophy,
  Target,
  MoreVertical,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_BADGES } from "@/lib/graphql/queries";
import { CREATE_BADGE, UPDATE_BADGE, DELETE_BADGE, RESTORE_BADGE } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/portal/dialogs/ConfirmDialog";

export default function AdminBadges() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [badgeForm, setBadgeForm] = useState({
    title: "",
    description: "",
    icon: "Award",
    category: "skill",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // 3x4 grid or similar

  const { data, loading: queryLoading, refetch } = useQuery<{ badges: { items: any[], pagination: any } }>(GET_BADGES, {
    variables: { page: currentPage, limit: pageSize }
  });
  const badges = data?.badges?.items || [];
  const pagination = data?.badges?.pagination;

  const [createBadge] = useMutation(CREATE_BADGE, {
    refetchQueries: [{ query: GET_BADGES }],
    onCompleted: () => {
      toast.success("Badge created successfully!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const [updateBadge] = useMutation(UPDATE_BADGE, {
    refetchQueries: [{ query: GET_BADGES }],
    onCompleted: () => {
      toast.success("Badge updated successfully!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const [deleteBadge] = useMutation(DELETE_BADGE, {
    refetchQueries: [{ query: GET_BADGES }]
  });
  const [restoreBadgeMutation] = useMutation(RESTORE_BADGE);

  const [deleteBadgeTarget, setDeleteBadgeTarget] = useState<any>(null);

  const handleOpenDialog = (badge?: any) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeForm({
        title: badge.title,
        description: badge.description,
        icon: badge.icon || "Award",
        category: badge.category || "skill",
      });
    } else {
      setEditingBadge(null);
      setBadgeForm({
        title: "",
        description: "",
        icon: "Award",
        category: "skill",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!badgeForm.title || !badgeForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      if (editingBadge) {
        await updateBadge({
          variables: {
            id: editingBadge.id,
            ...badgeForm,
          },
        });
      } else {
        await createBadge({
          variables: badgeForm,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadgeConfirm = async () => {
    if (!deleteBadgeTarget) return;
    const deletedId = deleteBadgeTarget.id;
    const deletedTitle = deleteBadgeTarget.title;
    try {
      setDeleteBadgeTarget(null);
      await deleteBadge({ variables: { id: deletedId } });
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success(`"${deletedTitle}" deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreBadgeMutation({ variables: { id: deletedId } });
              toast.success("Badge restored");
              refetch();
            } catch (err: any) {
              toast.error("Failed to restore badge: " + err.message);
            }
          }
        },
        duration: 10000,
      });
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredBadges = badges.filter((b: any) =>
    (b.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    const icons: any = {
      Award,
      Star,
      Zap,
      Trophy,
      Target,
    };
    const IconComp = icons[iconName] || Award;
    return <IconComp className="w-5 h-5" />;
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Badge Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage digital rewards for students
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Create New Badge
          </Button>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Card className="md:col-span-1 border-border/50">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Badges</p>
                <p className="text-xl font-bold">{badges.length}</p>
              </div>
              <Award className="w-8 h-8 text-accent opacity-50" />
            </CardContent>
          </Card>
          <Card className="md:col-span-1 border-border/50">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Categories</p>
                <p className="text-xl font-bold">{new Set(badges.map((b: any) => b.category)).size}</p>
              </div>
              <Target className="w-8 h-8 text-gold opacity-50" />
            </CardContent>
          </Card>
        </div>

        {/* Badges Grid */}
        {queryLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.map((badge: any) => (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative"
              >
                <Card className="h-full border-border/50 hover:border-accent/40 bg-card/50 backdrop-blur-sm transition-all overflow-hidden">
                  <div className={`h-1.5 w-full bg-accent opacity-50`} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      {getIcon(badge.icon)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(badge)}
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteBadgeTarget(badge)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-lg group-hover:text-accent transition-colors">
                        {badge.title}
                      </h3>
                      <span className="inline-block px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] uppercase font-semibold text-accent tracking-wider">
                        {badge.category}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-card-foreground/70 line-clamp-2">
                      {badge.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredBadges.length === 0 && (
              <div className="col-span-full py-20 text-center bg-card/30 rounded-xl border border-dashed border-border/50">
                <Award className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No badges found matching your criteria</p>
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenDialog()}>
                  Create your first badge
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination UI */}
        {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-6 border-t border-border/50 mt-8">
                <p className="text-sm text-muted-foreground font-medium">
                    Page <span className="text-foreground font-bold">{pagination.currentPage}</span> of {pagination.totalPages} ({pagination.totalCount} badges)
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPreviousPage}
                        className="rounded-xl px-4"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                        disabled={!pagination.hasNextPage}
                        className="rounded-xl px-4"
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{editingBadge ? "Edit Badge" : "Create New Badge"}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Badge Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Code Master"
                    value={badgeForm.title}
                    onChange={(e) => setBadgeForm({ ...badgeForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={badgeForm.category}
                    onValueChange={(v) => setBadgeForm({ ...badgeForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="participation">Participation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {["Award", "Star", "Zap", "Trophy", "Target"].map((iconName) => (
                      <Button
                        key={iconName}
                        type="button"
                        variant={badgeForm.icon === iconName ? "gold" : "outline"}
                        className="h-10 w-full p-0"
                        onClick={() => setBadgeForm({ ...badgeForm, icon: iconName })}
                      >
                        {getIcon(iconName)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this badge awarded for?"
                    rows={4}
                    value={badgeForm.description}
                    onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 pt-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-accent hover:bg-accent/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingBadge ? "Save Changes" : "Create Badge"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteBadgeTarget}
          onOpenChange={(open: boolean) => !open && setDeleteBadgeTarget(null)}
          onConfirm={handleDeleteBadgeConfirm}
          title="Delete Badge"
          description={`Are you sure you want to delete "${deleteBadgeTarget?.title || ''}"? It can be restored later.`}
          confirmText="Delete"
          variant="destructive"
        />

      </div>
    </PortalLayout>
  );
}
