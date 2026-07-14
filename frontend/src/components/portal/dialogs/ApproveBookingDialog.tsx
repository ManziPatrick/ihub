import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

interface ApproveBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onApprove: (meetingLink: string) => void;
    bookingType: string;
    studentName: string;
}

export function ApproveBookingDialog({
    open,
    onOpenChange,
    onApprove,
    bookingType,
    studentName
}: ApproveBookingDialogProps) {
    const [meetingLink, setMeetingLink] = useState("");

    const handleApprove = () => {
        onApprove(meetingLink.trim());
        setMeetingLink("");
        onOpenChange(false);
    };

    // Generate a random link for convenience if needed, or keep empty
    const generateLink = () => {
        setMeetingLink(`https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Approve Session Request</DialogTitle>
                    <DialogDescription>
                        You are approving a <strong>{bookingType}</strong> session with <strong>{studentName}</strong>.
                        Please provide a Google Meet link for this session.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="link">Google Meet Link</Label>
                        <div className="flex gap-2">
                            <Input
                                id="link"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/..."
                                className="col-span-3"
                            />
                            <Button size="icon" variant="outline" onClick={generateLink} title="Generate Link">
                                <Video className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="gold" onClick={handleApprove} disabled={!meetingLink.trim()}>
                        Approve & Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
