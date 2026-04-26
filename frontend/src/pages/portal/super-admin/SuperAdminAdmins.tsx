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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS } from "@/lib/graphql/queries";
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
                    placeholder="admin@ihub.com" 
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
    </PortalLayout>
  );
}
