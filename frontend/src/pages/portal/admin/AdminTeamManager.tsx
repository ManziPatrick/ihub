import { useState, useEffect } from "react";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Plus, Search, Edit2, Trash2, Loader2, User, Github, Linkedin, Twitter, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { getApiBaseUrl } from "@/lib/env";

interface ITeamMember {
    _id: string;
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    createdAt: string;
}

const API_BASE_URL = getApiBaseUrl();

const AdminTeamManager = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState<ITeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentMember, setCurrentMember] = useState<Partial<ITeamMember> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const limit = 10;

    useEffect(() => {
        fetchMembers();
    }, [page]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/team?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
                }
            });
            const data = await response.json();
            setMembers(data.members || []);
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching team members:", error);
            toast.error("Failed to load team members");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = currentMember?._id ? 'PUT' : 'POST';
            const url = currentMember?._id
                ? `${API_BASE_URL}/api/team/${currentMember._id}`
                : `${API_BASE_URL}/api/team`;

            const token = localStorage.getItem('ihub_token');

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentMember)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to save team member");
            }

            toast.success(currentMember?._id ? "Member updated" : "Member added");
            setIsDialogOpen(false);
            setCurrentMember(null);
            fetchMembers();
        } catch (error) {
            console.error("Error saving team member:", error);
            toast.error("Error saving team member");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this team member?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/team/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('ihub_token')}`
                }
            });

            if (!response.ok) throw new Error("Failed to delete");

            toast.success("Member deleted successfully");
            fetchMembers();
        } catch (error) {
            console.error("Error deleting member:", error);
            toast.error("Error deleting member");
        }
    };

    const filteredMembers = members.filter(m =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.role?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <PortalLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold font-heading">Team Management</h2>
                        <p className="text-muted-foreground text-sm">Manage your team members and staff.</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gold" onClick={() => setCurrentMember({})}>
                                <Plus className="w-4 h-4 mr-2" /> Add Team Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{currentMember?._id ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateOrUpdate} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input
                                            value={currentMember?.name || ""}
                                            onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })}
                                            placeholder="e.g. John Doe"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Role / Position</label>
                                        <Input
                                            value={currentMember?.role || ""}
                                            onChange={e => setCurrentMember({ ...currentMember, role: e.target.value })}
                                            placeholder="e.g. Senior Instructor"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Bio</label>
                                        <Textarea
                                            value={currentMember?.bio || ""}
                                            onChange={e => setCurrentMember({ ...currentMember, bio: e.target.value })}
                                            placeholder="Short biography..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Photo</label>
                                        {currentMember?.image ? (
                                            <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                                <img src={currentMember.image} alt="Member photo" className="w-full h-full object-cover" />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6"
                                                    onClick={() => setCurrentMember({ ...currentMember, image: "" })}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <FileUpload
                                                onUploadComplete={(url) => setCurrentMember({ ...currentMember, image: url })}
                                                folder="team"
                                                label="Upload Photo"
                                                accept="image/*"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">LinkedIn URL</label>
                                        <div className="relative">
                                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={currentMember?.linkedin || ""}
                                                onChange={e => setCurrentMember({ ...currentMember, linkedin: e.target.value })}
                                                placeholder="https://linkedin.com/in/..."
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Twitter URL</label>
                                        <div className="relative">
                                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={currentMember?.twitter || ""}
                                                onChange={e => setCurrentMember({ ...currentMember, twitter: e.target.value })}
                                                placeholder="https://twitter.com/..."
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">GitHub URL</label>
                                        <div className="relative">
                                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={currentMember?.github || ""}
                                                onChange={e => setCurrentMember({ ...currentMember, github: e.target.value })}
                                                placeholder="https://github.com/..."
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="gold" disabled={submitting}>
                                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {currentMember?._id ? "Update Member" : "Add Member"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search members..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Socials</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMembers.map((member) => (
                                    <TableRow key={member._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                                                    {member.image ? (
                                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-full h-full p-2 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{member.bio}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                                {member.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 text-muted-foreground">
                                                {member.linkedin && <Linkedin className="w-4 h-4 text-blue-600" />}
                                                {member.twitter && <Twitter className="w-4 h-4 text-sky-500" />}
                                                {member.github && <Github className="w-4 h-4" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setCurrentMember(member);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(member._id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No team members found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}

                    <PaginationBar
                      currentPage={page}
                      totalPages={pagination?.totalPages || 0}
                      onPageChange={setPage}
                      hasPreviousPage={pagination?.hasPreviousPage}
                      hasNextPage={pagination?.hasNextPage}
                      showRange={false}
                      showFirstLast={false}
                    />
                </div>
            </div>
        </PortalLayout>
    );
};

export default AdminTeamManager;
