import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { KeyRound, User, Shield, Info, UserCog } from "lucide-react";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
  onSave?: (user: any) => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSave }: EditUserDialogProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    school: "",
    isFirst: false,
    fullName: "",
    bio: "",
    phone: "",
    location: "",
    title: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "",
        role: user.role || "student",
        school: user.school || "",
        isFirst: user.isFirst ?? true,
        fullName: user.fullName || "",
        bio: user.bio || "",
        phone: user.phone || "",
        location: user.location || "",
        title: user.title || "",
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    
    const updatedUser: any = {
      id: user.id,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      school: formData.school,
      isFirst: formData.isFirst,
      fullName: formData.fullName,
      bio: formData.bio,
      phone: formData.phone,
      location: formData.location,
      title: formData.title,
    };

    // Only include password if it was changed
    if (formData.password) {
      updatedUser.password = formData.password;
    }
    
    onSave?.(updatedUser);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Edit User: {user.username}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="space-y-5 py-4">
            {/* Account Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Account Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Profile Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <Input
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input
                      placeholder="+250 7XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Title</label>
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Location</label>
                  <Input
                    placeholder="e.g. Kigali, Rwanda"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Bio</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Short biography..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions Section */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Role & School
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Role</label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      {currentUser?.role === "super_admin" && (
                        <>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">School</label>
                  <Input
                    placeholder="e.g. University of Rwanda"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input 
                  type="checkbox" 
                  id="isFirst" 
                  checked={formData.isFirst}
                  onChange={(e) => setFormData({ ...formData, isFirst: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="isFirst" className="text-sm font-medium cursor-pointer">
                  Require Onboarding (First Login)
                </label>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" />
                Password
              </h3>
              <div className="relative">
                <label className="text-sm font-medium mb-1.5 block">
                  New Password <span className="text-muted-foreground text-xs font-normal">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <PasswordInput
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Enter a new password only if you want to change it. Must be at least 6 characters.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


