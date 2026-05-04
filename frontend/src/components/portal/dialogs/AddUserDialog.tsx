import { useState } from "react";
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
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (user: any) => void;
}

export function AddUserDialog({ open, onOpenChange, onSave }: AddUserDialogProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    school: "",
  });

  const handleSubmit = () => {
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSave?.(formData);
    setFormData({ username: "", email: "", password: "", role: "student", school: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-4 sm:px-6 overflow-y-auto">
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username *</label>
              <Input
                placeholder="Enter username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email *</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password *</label>
              <PasswordInput
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
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
          </div>
        </ScrollArea>
        <div className="flex gap-2 p-4 sm:p-6 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" className="flex-1" onClick={handleSubmit}>
            Add User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
