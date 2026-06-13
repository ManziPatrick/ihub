import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, UserPlus, CheckCircle, User } from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS, GET_COURSES_SUMMARY } from "@/lib/graphql/queries";
import { ENROLL_STUDENT_IN_COURSE } from "@/lib/graphql/mutations";

interface EnrollStudentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: any;
}

export function EnrollStudentDialog({ open, onOpenChange, course }: EnrollStudentDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { data: usersData, loading: usersLoading } = useQuery(GET_USERS, { variables: { limit: 200 } });

    const [enrollStudent, { loading: enrolling }] = useMutation(ENROLL_STUDENT_IN_COURSE, {
        refetchQueries: [{ query: GET_COURSES_SUMMARY }],
        onCompleted: (data) => {
            toast.success(`Student enrolled successfully!`);
        },
        onError: (err) => {
            toast.error(err.message || "Failed to enroll student");
        }
    });

    const students = useMemo(() => {
        const allUsers = (usersData as any)?.users?.items || [];
        return allUsers.filter((u: any) => u.role === 'student' || u.role === 'user' || u.role === 'intern');
    }, [usersData]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return [];
        return students.filter((s: any) =>
            s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const isEnrolled = (userId: string) => {
        return course?.studentsEnrolled?.some((s: any) => s.id === userId);
    };

    const handleEnroll = async (userId: string) => {
        try {
            await enrollStudent({
                variables: {
                    courseId: course.id,
                    userId
                }
            });
        } catch (err) {
            // Error handled by mutation onError
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-accent" />
                        Enroll Student in {course?.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-muted/20 border-none"
                        />
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-2">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student: any) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-muted/5 hover:bg-accent/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{student.username}</p>
                                                <p className="text-[10px] text-muted-foreground">{student.email}</p>
                                            </div>
                                        </div>

                                        {isEnrolled(student.id) ? (
                                            <div className="flex items-center gap-1 text-xs text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded-lg">
                                                <CheckCircle className="w-3 h-3" />
                                                Enrolled
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="gold"
                                                className="h-8 text-xs font-bold"
                                                onClick={() => handleEnroll(student.id)}
                                                disabled={enrolling}
                                            >
                                                {enrolling ? "..." : "Enroll"}
                                            </Button>
                                        )}
                                    </div>
                                ))
                            ) : searchTerm ? (
                                <div className="text-center py-10 text-muted-foreground italic text-sm">
                                    No students found matching your search.
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground italic text-sm">
                                    Type to search for students to enroll.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
