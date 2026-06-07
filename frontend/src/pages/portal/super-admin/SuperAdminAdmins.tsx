import { useState } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  Shield,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Key,
  Loader2,
  Eye,
  BookOpen,
  Users,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS, GET_ADMIN_DASHBOARD_DATA } from "@/lib/graphql/queries";
import { CREATE_USER, DELETE_USER, UPDATE_USER } from "@/lib/graphql/mutations";
import { toast } from "sonner";

const permissionsList = [
  { key: "users", label: "User Management" },
  { key: "courses", label: "Course Management" },
  { key: "payments", label: "Payment Management" },
  { key: "internships", label: "Internship Management" },
  { key: "analytics", label: "Analytics Access" },
  { key: "students", label: "Student Management" },
];

function AdminPerformanceStats({ adminId }: { adminId: string }) {
  const { data, loading, error } = useQuery(GET_ADMIN_DASHBOARD_DATA, {
    variables: { createdBy: adminId },
    skip: !adminId
  });

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  if (error) return <div className="p-4 text-destructive">Failed to load performance data.</div>;

  const stats = (data as any)?.adminDashboardData?.stats;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-6 h-6 text-accent mb-2" />
            <p className="text-2xl font-bold">{stats?.totalCourses || 0}</p>
            <p className="text-xs text-muted-foreground">Courses Created</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="w-6 h-6 text-accent mb-2" />
            <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-accent/5">
        <CardContent className="p-4">
          <h4 className="font-semibold text-accent mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Internship Tracking
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Total internships managed and tracked by this admin.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>Managed Programs</span>
              <span className="font-bold">{stats?.totalCourses || 0 /* Placeholder if internships not isolated */}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1">
              <span>Active Students</span>
              <span className="font-bold">{stats?.totalStudents || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(data as any)?.adminDashboardData?.coursePerformance && (data as any).adminDashboardData.coursePerformance.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold border-b border-border/50 pb-2">Admin Course & Program Details</h4>
          <div className="grid gap-3">
            {(data as any).adminDashboardData.coursePerformance.map((course: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm leading-tight text-foreground">{course.courseTitle}</h5>
                  <Badge variant="outline" className="text-[10px] uppercase text-accent border-accent/20 bg-accent/10">
                    {course.studentCount} Enrolled
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-1">
                  <div className="flex justify-between">
                    <span>Avg Completion:</span>
                    <span className="font-bold text-foreground">{course.avgCompletion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Generated:</span>
                    <span className="font-bold text-green-500">{course.revenue?.toLocaleString() || 0} RWF</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminAdmins() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
    permissions: [] as string[]
  });
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_USERS);
  const [createUserMutation] = useMutation(CREATE_USER);
  const [deleteUserMutation] = useMutation(DELETE_USER);

  const allAdmins = ((data as any)?.users?.items || []).filter((u: any) => u.role === "admin" || u.role === "super_admin");

  const getInitials = (name: string) => (name || "A").split(" ").map(n => n[0]).join("").toUpperCase();

  const handleCreateAdmin = async () => {
    try {
        await createUserMutation({
            variables: {
                ...formData
            }
        });
        toast.success("Admin created successfully");
        setIsCreateOpen(false);
        refetch();
        setFormData({ username: "", email: "", password: "", role: "admin", permissions: [] });
    } catch (err: any) {
        toast.error(err.message);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await deleteUserMutation({ variables: { id } });
        toast.success("Admin removed");
        refetch();
    } catch (err: any) {
        toast.error(err.message);
    }
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.includes(key) 
            ? prev.permissions.filter(p => p !== key)
            : [...prev.permissions, key]
    }));
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
              Admin Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage admin accounts and their permissions
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Username</label>
                  <Input 
                    placeholder="Enter username" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input 
                    type="email" 
                    placeholder="admin@bootskills.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <PasswordInput 
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {permissionsList.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 bg-background/50 rounded cursor-pointer hover:bg-background">
                        <input 
                            type="checkbox" 
                            className="rounded border-border" 
                            checked={formData.permissions.includes(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                        />
                        <span className="text-sm">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="gold" className="flex-1" onClick={handleCreateAdmin}>
                    Create Admin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Admins Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {loading ? (
              <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
          ) : (
            allAdmins.filter((a: any) => (a.username || "").toLowerCase().includes(searchQuery.toLowerCase())).map((admin: any) => (
                <Card key={admin.id} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-accent/20 text-accent">
                            {getInitials(admin.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-card-foreground">{admin.username}</h4>
                          <p className="text-sm text-card-foreground/60">{admin.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedAdminId(admin.id)}>
                            <Eye className="w-4 h-4 mr-2" /> View Performance Stats
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="w-4 h-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAdmin(admin.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
    
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="capitalize">{admin.role}</Badge>
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    </div>
    
                    <div className="mb-3">
                      <p className="text-xs text-card-foreground/60 mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {(admin.permissions || []).length > 0 ? admin.permissions.map((perm: string) => (
                          <Badge key={perm} variant="outline" className="text-xs capitalize">
                            {perm}
                          </Badge>
                        )) : (
                            <span className="text-xs text-muted-foreground italic">No specific permissions</span>
                        )}
                      </div>
                    </div>
    
                    <p className="text-xs text-card-foreground/50">
                      Member since: Recently
                    </p>
                  </CardContent>
                </Card>
              ))
          )}

          {/* Add Admin Card */}
          {!loading && (
            <Card className="border-border/50 border-dashed">
                <CardContent className="p-5 flex items-center justify-center h-full min-h-[200px]">
                <Button variant="ghost" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Admin
                </Button>
                </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <Sheet open={!!selectedAdminId} onOpenChange={(open) => !open && setSelectedAdminId(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Admin Performance & Tracking</SheetTitle>
          </SheetHeader>
          {selectedAdminId && <AdminPerformanceStats adminId={selectedAdminId} />}
        </SheetContent>
      </Sheet>
    </PortalLayout>
  );
}
