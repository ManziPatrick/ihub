import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Download,
  GraduationCap,
  BookOpen,
  Shield,
  Loader2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User,
  Pencil,
  Lock,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS, GET_ANALYTICS, GET_AVAILABLE_ADMINS, GET_ALL_TRAINERS, GET_ALL_STUDENTS } from "@/lib/graphql/queries";

const navigate = (to: string) => {
  window.location.href = to;
};
import { DELETE_USER, UPDATE_USER } from "@/lib/graphql/mutations";
import { ExportDataDialog } from "@/components/portal/ExportDataDialog";
import { toast } from "sonner";

export default function SuperAdminUsers() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pageSize, setPageSize] = useState(10);

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "",
    phone: "",
    location: "",
    title: "",
    bio: "",
    school: "",
  });

  const queryVariables: any = { page: currentPage, limit: pageSize };
  if (roleFilter !== "all") {
    queryVariables.role = roleFilter;
  }
  if (adminFilter !== "all") {
    queryVariables.createdBy = adminFilter;
  }

  const { data, loading, refetch } = useQuery(GET_USERS, {
    variables: queryVariables,
    fetchPolicy: "cache-and-network",
  });
  const { data: analyticsData } = useQuery(GET_ANALYTICS);
  const { data: availableAdminsData } = useQuery(GET_AVAILABLE_ADMINS);
  const { data: allTrainersData } = useQuery(GET_ALL_TRAINERS);
  const { data: allStudentsData } = useQuery(GET_ALL_STUDENTS);
  const { data: clientUsersData } = useQuery(GET_USERS, {
    variables: { page: 1, limit: 1, role: "client" },
  });

  // Get all admin/super_admin users for the admin filter dropdown
  const adminOptions = (availableAdminsData as any)?.getAvailableAdmins || [];
  const [deleteUserMutation] = useMutation(DELETE_USER);
  const [updateUserMutation, { loading: updating }] = useMutation(UPDATE_USER);

  const allUsers = (data as any)?.users?.items || [];
  const pagination = (data as any)?.users?.pagination;
  const analytics = (analyticsData as any)?.analytics;
  const roleDistribution = analytics?.roleDistribution || [];

  const getInitials = (name: string) =>
    (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const filteredUsers = allUsers.filter((user: any) => {
    const matchesSearch =
      (user.username || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUserMutation({ variables: { id } });
      toast.success("User deleted successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditSheet = (user: any) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
      fullName: user.fullName || "",
      role: user.role || "student",
      phone: user.phone || "",
      location: user.location || "",
      title: user.title || "",
      bio: user.bio || "",
      school: user.school || "",
    });
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordSection(false);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (showPasswordSection && newPassword) {
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    try {
      const variables: any = { id: editingUser.id };
      if (editForm.username !== editingUser.username)
        variables.username = editForm.username;
      if (editForm.email !== editingUser.email)
        variables.email = editForm.email;
      if (editForm.fullName !== (editingUser.fullName || ""))
        variables.fullName = editForm.fullName;
      if (editForm.role !== editingUser.role) variables.role = editForm.role;
      if (editForm.phone !== (editingUser.phone || ""))
        variables.phone = editForm.phone;
      if (editForm.location !== (editingUser.location || ""))
        variables.location = editForm.location;
      if (editForm.title !== (editingUser.title || ""))
        variables.title = editForm.title;
      if (editForm.bio !== (editingUser.bio || ""))
        variables.bio = editForm.bio;
      if (editForm.school !== (editingUser.school || ""))
        variables.school = editForm.school;

      if (showPasswordSection && newPassword) {
        variables.password = newPassword;
      }

      await updateUserMutation({ variables });
      toast.success("User updated successfully");
      setEditingUser(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  };

  // Accurate counts from backend, not paginated
  const totalUsers = pagination?.totalCount ?? allUsers.length;
  // Use dedicated API calls for accurate role counts (bypasses analytics.roleDistribution bugs)
  const allTrainers = (allTrainersData as any)?.getAllTrainers || [];
  const allStudents = (allStudentsData as any)?.getAllStudents || [];
  const clientCount = (clientUsersData as any)?.users?.pagination?.totalCount ?? 0;
  const studentCount = allStudents.length || 0;
  const trainerCount = allTrainers.length || 0;
  const adminCount = adminOptions.length || 0;

  const userStats = [
    { label: "Total Users", value: totalUsers.toString(), icon: Users },
    { label: "Clients", value: clientCount.toString(), icon: UserCheck },
    {
      label: "Students",
      value: studentCount.toString(),
      icon: GraduationCap,
    },
    { label: "Trainers", value: trainerCount.toString(), icon: BookOpen },
    { label: "Admins", value: adminCount.toString(), icon: Shield },
  ];

  const roleColors: Record<string, string> = {
    client: "bg-emerald-500/20 text-emerald-400",
    student: "bg-blue-500/20 text-blue-400",
    trainer: "bg-purple-500/20 text-purple-400",
    admin: "bg-accent/20 text-accent",
    super_admin: "bg-red-500/20 text-red-400",
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
              All Users
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all platform users
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {userStats.map((stat) => (
            <Card
              key={stat.label}
              className="border-border/50 transition-all hover:shadow-card-hover"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-card-foreground/60">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="trainer">Trainers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={adminFilter}
            onValueChange={(val) => {
              setAdminFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by creator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {adminOptions.map((admin: any) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.fullName || admin.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Users className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 text-sm font-medium text-card-foreground/70">
                          User
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          Role
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          Courses
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          Status
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          Created By
                        </th>
                        <th className="text-center p-4 text-sm font-medium text-card-foreground/70">
                          Joined
                        </th>
                        <th className="text-right p-4 text-sm font-medium text-card-foreground/70">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: any, idx: number) => (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={`border-b border-border/30 hover:bg-background/50 cursor-pointer transition-colors ${
                            idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-accent/20 text-accent">
                                  {getInitials(user.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-card-foreground">
                                  {user.fullName || user.username}
                                </p>
                                <p className="text-xs text-card-foreground/60">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              className={roleColors[user.role]}
                              variant="outline"
                            >
                              {user.role.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-sm text-card-foreground/80">
                            {user.enrolledCourses?.length || 0}
                          </td>
                          <td className="p-4 text-center">
                            <Badge
                              variant="outline"
                              className={
                                user.isDeleted
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-green-500/20 text-green-400"
                              }
                            >
                              {user.isDeleted ? "deleted" : "active"}
                            </Badge>
                          </td>
                          <td className="p-4 text-center text-sm">
                            {user.createdBy ? (
                              <span className="text-card-foreground/80 font-medium">
                                {user.createdBy.fullName || user.createdBy.username}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 italic">—</span>
                            )}
                          </td>
                          <td className="p-4 text-center text-sm text-card-foreground/70">
                            {user.createdAt
                              ? new Date(
                                  Number(user.createdAt) || user.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" /> View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/portal/super-admin/user-report/${user.id}`);
                                  }}
                                >
                                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Full Report
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditSheet(user);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user.id);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination UI */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-border/50 gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 sm:order-1">
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
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!pagination.hasPreviousPage}
                      className="rounded-xl border-border/50 h-9"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            Math.abs(p - currentPage) <= 1
                        )
                        .map((p, i, arr) => {
                          const showEllipsis = i > 0 && p - arr[i - 1] > 1;
                          return (
                            <div key={p} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-1 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === p ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(p)}
                                className={`h-9 w-9 p-0 rounded-xl border-border/50 ${
                                  currentPage === p
                                    ? "bg-accent text-accent-foreground"
                                    : ""
                                }`}
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
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(pagination.totalPages, prev + 1)
                        )
                      }
                      disabled={!pagination.hasNextPage}
                      className="rounded-xl border-border/50 h-9"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      {/* ── VIEW PROFILE SHEET ── */}
      <Sheet
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-accent/20 text-accent text-xl">
                    {getInitials(selectedUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedUser.fullName || selectedUser.username}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedUser.email}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className={roleColors[selectedUser.role]}>
                      {selectedUser.role.replace("_", " ")}
                    </Badge>
                    {selectedUser.school && (
                      <Badge variant="outline">
                        {selectedUser.school}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-bold">
                      {selectedUser.enrolledCourses?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enrolled Courses
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <UserCheck className="w-6 h-6 text-accent mb-2" />
                    <p className="text-2xl font-bold">
                      {selectedUser.studentProfile?.completionPercentage || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Profile Completion
                    </p>
                  </CardContent>
                </Card>
              </div>

              {(selectedUser.phone ||
                selectedUser.location ||
                selectedUser.title) && (
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold border-b border-border/50 pb-2">
                    Contact & Info
                  </h4>
                  {selectedUser.title && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.title}</span>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.location}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedUser.studentProfile && (
                <div className="space-y-3">
                  <h4 className="font-semibold border-b border-border/50 pb-2">
                    Academic Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">School:</span>{" "}
                      {selectedUser.studentProfile.school || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Education Level:
                      </span>{" "}
                      {selectedUser.studentProfile.educationLevel || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Field:</span>{" "}
                      {selectedUser.studentProfile.fieldOfStudy || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">City:</span>{" "}
                      {selectedUser.studentProfile.city || "N/A"}
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.enrolledCourses &&
                selectedUser.enrolledCourses.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <h4 className="font-semibold border-b border-border/50 pb-2">
                      Course Progress
                    </h4>
                    <div className="grid gap-3">
                      {selectedUser.enrolledCourses.map((course: any) => {
                        const courseLessons =
                          selectedUser.completedLessons?.filter(
                            (l: any) => l.courseId === course.id
                          ) || [];
                        const isCompleted =
                          selectedUser.completedCourses?.some(
                            (c: any) => c.id === course.id
                          );
                        return (
                          <div
                            key={course.id}
                            className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50"
                          >
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-accent/20 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-accent" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h5 className="font-bold text-sm leading-tight">
                                {course.title}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] uppercase"
                                >
                                  {course.level || "Beginner"}
                                </Badge>
                                {isCompleted ? (
                                  <Badge className="text-[10px] bg-green-500/20 text-green-500 hover:bg-green-500/30">
                                    Completed
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">
                                    {courseLessons.length} lessons completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {selectedUser.activityLog &&
                selectedUser.activityLog.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold border-b border-border/50 pb-2">
                      Recent Activity
                    </h4>
                    <div className="space-y-3">
                      {selectedUser.activityLog
                        .slice(0, 5)
                        .map((log: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex flex-col text-sm border-l-2 border-accent/50 pl-3 py-1"
                          >
                            <span className="font-medium">{log.action}</span>
                            <span className="text-xs text-muted-foreground">
                              {log.details}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {new Date(
                                Number(log.timestamp) || log.timestamp
                              ).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="gold"
                  onClick={() => {
                    openEditSheet(selectedUser);
                    setSelectedUser(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Edit This User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── EDIT USER SHEET ── */}
      <AnimatePresence>
        {editingUser && (
          <Sheet
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
          >
            <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-xl">
                  <Pencil className="w-5 h-5 text-accent" />
                  Edit User — {editingUser.fullName || editingUser.username}
                </SheetTitle>
                <SheetDescription>
                  Update user profile details and manage account settings.
                  Changes take effect immediately.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Profile fields */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-accent uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-username">Username</Label>
                      <Input
                        id="edit-username"
                        value={editForm.username}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            username: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-fullname">Full Name</Label>
                      <Input
                        id="edit-fullname"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            fullName: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            email: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(val) =>
                          setEditForm((f) => ({ ...f, role: val }))
                        }
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-school">School</Label>
                      <Input
                        id="edit-school"
                        value={editForm.school}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            school: e.target.value,
                          }))
                        }
                        placeholder="e.g. UR, CMHS"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="edit-phone"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              phone: e.target.value,
                            }))
                          }
                          className="pl-10"
                          placeholder="+250..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="edit-location"
                          value={editForm.location}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              location: e.target.value,
                            }))
                          }
                          className="pl-10"
                          placeholder="Kigali, Rwanda"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title / Headline</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-bio">Bio</Label>
                    <Textarea
                      id="edit-bio"
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          bio: e.target.value,
                        }))
                      }
                      className="min-h-[80px] resize-y"
                      placeholder="Short bio..."
                    />
                  </div>
                </div>

                {/* Password section */}
                <div className="border-t border-border/30 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordSection((p) => !p)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      Change Password
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {showPasswordSection ? "Hide" : "Show"}
                    </span>
                  </Button>

                  {showPasswordSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 mt-4 p-4 bg-muted/20 rounded-xl border border-border/30"
                    >
                      <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Setting a new password will immediately change the
                          user's login credentials. They will be logged out on
                          their next request.
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-password">New Password</Label>
                        <Input
                          id="edit-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-confirm-password">
                          Confirm Password
                        </Label>
                        <Input
                          id="edit-confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                        />
                      </div>
                      {newPassword && confirmPassword && (
                        <div className="flex items-center gap-2 text-xs">
                          {newPassword === confirmPassword &&
                          newPassword.length >= 6 ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="text-green-500">
                                Passwords match
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400">
                                {newPassword.length < 6
                                  ? "Password too short (min. 6 chars)"
                                  : "Passwords do not match"}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Save button */}
                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setEditingUser(null)}
                  >
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button
                    variant="gold"
                    onClick={handleSaveUser}
                    disabled={
                      updating ||
                      (showPasswordSection &&
                        newPassword.length > 0 &&
                        (newPassword.length < 6 ||
                          newPassword !== confirmPassword))
                    }
                    className="min-w-36"
                  >
                    {updating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </PortalLayout>
  );
}
