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
    role: "student",
    school: "",
    isFirst: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "student",
        school: user.school || "",
        isFirst: user.isFirst ?? true,
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      username: formData.username,
      email: formData.email,
      role: formData.role,
      school: formData.school,
      isFirst: formData.isFirst,
    };
    
    onSave?.(updatedUser);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
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
                {currentUser?.role === "super_admin" && (
                  <>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {currentUser?.role === "super_admin" && (
            <div>
              <label className="text-sm font-medium mb-2 block">School (Optional)</label>
              <Input
                placeholder="e.g. University of Rwanda"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Assigning a school restricts an Admin's visibility to that institution.
              </p>
            </div>
          )}
            
            <div className="flex items-center gap-2 pt-2">
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
