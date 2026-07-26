import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  GraduationCap,
  UserCog,
  Shield,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Eye,
  Award,
  Download,
  Trophy,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BadgeAwardDialog } from "@/components/portal/BadgeAwardDialog";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import {
  AddUserDialog,
  EditUserDialog,
  UserDetailsSheet,
  SendEmailDialog,
  DeleteConfirmDialog
} from "@/components/portal/dialogs";
import { toast } from "sonner";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import { FileSpreadsheet } from "lucide-react";
import { GET_USERS, GET_TOP_STUDENTS, GET_ANALYTICS_EXPORT } from "@/lib/graphql/queries";
import { CREATE_USER, UPDATE_USER, DELETE_USER, RESTORE_USER } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";

const getRoleBadge = (role: string) => {    const styles: Record<string, string> = {
    student: "bg-blue-500/20 text-blue-400 border-blue-400/30",
    trainer: "bg-accent/20 text-accent border-accent/30",
    client: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
    admin: "bg-purple-500/20 text-purple-400 border-purple-400/30",
    super_admin: "bg-red-500/20 text-red-400 border-red-400/30",
  };
  const icons: Record<string, React.ReactNode> = {
    student: <GraduationCap className="w-3 h-3 mr-1" />,
    trainer: <UserCog className="w-3 h-3 mr-1" />,
    client: <UserCog className="w-3 h-3 mr-1" />,
    admin: <Shield className="w-3 h-3 mr-1" />,
    super_admin: <Shield className="w-3 h-3 mr-1" />,
  };
  return (
    <Badge variant="outline" className={styles[role]}>
      {(icons as any)[role]}
      {role?.charAt(0).toUpperCase() + role?.slice(1).replace("_", " ")}
    </Badge>
  );
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isRefreshing, setIsRefreshing] = useState(false);
  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [emailUser, setEmailUser] = useState<any | null>(null);
  const [awardUser, setAwardUser] = useState<any | null>(null);

  // Queries & Mutations
  const client = useApolloClient();
  const queryVariables: any = { page: currentPage, limit: pageSize };
  if (currentUser?.role !== "super_admin") {
    queryVariables.createdBy = currentUser?.id;
  }
  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: queryVariables,
  });
  
  const { data: topStudentsData } = useQuery(GET_TOP_STUDENTS, {
    variables: { limit: 5 },
    skip: currentUser?.role !== "admin" && currentUser?.role !== "super_admin"
  });
  const [createUserMutation] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }]
  });
  const [updateUserMutation] = useMutation(UPDATE_USER, {
    refetchQueries: [{ query: GET_USERS }]
  });
  const [deleteUserMutation] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: GET_USERS }]
  });
  const [restoreUserMutation] = useMutation(RESTORE_USER);

  const users = (data as any)?.users?.items || [];
  const pagination = (data as any)?.users?.pagination;

  const filteredUsers = users.filter((u: any) => {
    if (currentUser?.role !== "super_admin" && u.role === "super_admin") {
      return false;
    }
    const matchesSearch = (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (newUser: any) => {
    try {
      await createUserMutation({
        variables: {
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          school: newUser.school
        }
      });
      toast.success("User created successfully!");
      refetch();
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveUser = async (updatedUser: any) => {
    try {
      const variables: any = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        school: updatedUser.school,
        fullName: updatedUser.fullName,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        location: updatedUser.location,
        title: updatedUser.title,
        isFirst: updatedUser.isFirst,
      };
      // Only include password if it's provided
      if (updatedUser.password) {
        variables.password = updatedUser.password;
      }
      await updateUserMutation({ variables });
      toast.success("User updated successfully!");
      refetch();
      setEditUser(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    const deletedId = deleteUser.id;
    const deletedName = deleteUser.username;
    try {
      await deleteUserMutation({ variables: { id: deletedId } });
      window.dispatchEvent(new CustomEvent('bell-ring'));
      toast.success(`"${deletedName}" deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreUserMutation({ variables: { id: deletedId } });
              toast.success("User restored");
              refetch();
            } catch (err: any) {
              toast.error("Failed to restore user: " + err.message);
            }
          }
        },
        duration: 10000,
      });
      refetch();
      setDeleteUser(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await client.query({
        query: GET_ANALYTICS_EXPORT,
        fetchPolicy: 'network-only'
      });
      const csvContent = (data as any)?.getAnalyticsExport;
      if (!csvContent) {
        toast.error("No data available to export.");
        return;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `student_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Analytics exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export data");
    }
  };

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
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage platform users, roles, and permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refetch();
                  toast.success('Users refreshed!');
                } catch {
                  toast.error('Failed to refresh users');
                } finally {
                  setIsRefreshing(false);
                }
              }} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="gold" onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </motion.div>

        {/* Analytics & Export Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Top Students Leaderboard */}
          <div className="md:col-span-2">
            <Card className="border-accent/20 bg-accent/5 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4 text-accent">
                  <Trophy className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Top 5 Students (XP Leaderboard)</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {((topStudentsData as any)?.getTopStudents || []).map((student: any, idx: number) => (
                    <div key={student.id} className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border/50 flex-1 min-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-black flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{student.username}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{student.xp || 0} XP • Lvl {student.level || 1}</p>
                      </div>
                    </div>
                  ))}
                  {(!(topStudentsData as any)?.getTopStudents || (topStudentsData as any).getTopStudents.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No student data available yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <Card className="border-border/50 h-full flex flex-col justify-center">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Analytics & Reports</h3>
                </div>
                <Button 
                  onClick={handleExportCSV}
                  className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 h-12 rounded-xl flex items-center gap-2 font-bold"
                  variant="outline"
                >
                  <Download className="w-4 h-4" />
                  Export CSV Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["all", "student", "trainer", "client", "admin", "super_admin"]
              .filter(role => currentUser?.role === "super_admin" || role !== "super_admin")
              .map((role) => (
              <Button
                key={role}
                variant={filterRole === role ? "gold" : "outline"}
                size="sm"
                onClick={() => setFilterRole(role)}
                className="capitalize whitespace-nowrap"
              >
                {role.replace("_", " ")}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 text-sm font-medium text-card-foreground/70">User</th>
                      <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Role</th>
                      <th className="text-center p-4 text-sm font-medium text-card-foreground/70">Courses</th>
                      <th className="text-left p-4 text-sm font-medium text-card-foreground/70">Joined</th>
                      <th className="text-right p-4 text-sm font-medium text-card-foreground/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user: any) => (
                      <tr 
                        key={user.id} 
                        className="group border-b border-border/50 hover:bg-accent/10 transition-all duration-300 cursor-pointer"
                        onClick={() => setViewUser(user)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/50 group-hover:border-white/30 transition-colors">
                              <AvatarFallback className="bg-accent/10 text-accent group-hover:bg-accent/20 dark:group-hover:bg-white/20 group-hover:text-foreground dark:group-hover:text-white transition-colors">
                                {user.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-card-foreground group-hover:text-foreground dark:group-hover:text-white transition-colors">{user.username}</p>
                              <p className="text-xs text-card-foreground/60 group-hover:text-muted-foreground dark:group-hover:text-white/60 transition-colors">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 group-hover:opacity-80 transition-opacity">
                            {getRoleBadge(user.role)}
                            {user.isExternal && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]">
                                External
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-sm font-bold text-card-foreground group-hover:text-foreground dark:group-hover:text-white transition-colors">
                            {user.enrolledCourses?.length || 0}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-card-foreground/70 group-hover:text-muted-foreground dark:group-hover:text-white/70 transition-colors">
                          {new Date(parseInt(user.createdAt || Date.now().toString())).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="group-hover:text-foreground dark:group-hover:text-white transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setAwardUser(user)}>
                                <Award className="w-4 h-4 mr-2" /> Award Badge
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/portal/admin/user-report/${user.id}`)}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Full Report
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setViewUser(user)}>
                                <Eye className="w-4 h-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditUser(user)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEmailUser(user)}>
                                <Mail className="w-4 h-4 mr-2" /> Send Email
                              </DropdownMenuItem>
                              {currentUser?.role === 'super_admin' && (
                                <>
                                  <div className="h-px bg-border/50 my-1" />
                                  <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => setDeleteUser(user)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-border/50 rounded-md px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>
                  Showing <span className="font-semibold text-foreground">{((currentPage - 1) * pageSize) + 1}</span>
                  -
                  <span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, pagination.totalCount)}</span>
                  of <span className="font-semibold text-foreground">{pagination.totalCount}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => {
                      const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                      return (
                        <div key={p} className="flex items-center">
                          {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                          <Button
                            variant={currentPage === p ? "gold" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(p)}
                            className="w-8 h-8 p-0"
                          >
                            {p}
                          </Button>
                        </div>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <BadgeAwardDialog
        isOpen={!!awardUser}
        onClose={() => setAwardUser(null)}
        user={awardUser}
      />

      <AddUserDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSave={handleAddUser}
      />

      <EditUserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        onSave={handleSaveUser}
      />

      <UserDetailsSheet
        open={!!viewUser}
        onOpenChange={(open) => !open && setViewUser(null)}
        user={viewUser}
      />

      <SendEmailDialog
        open={!!emailUser}
        onOpenChange={(open) => !open && setEmailUser(null)}
        recipientName={emailUser?.username || ""}
        recipientEmail={emailUser?.email || ""}
      />

      <DeleteConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteUser?.username}? This action cannot be undone.`}
      />

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

    </PortalLayout>
  );
}
