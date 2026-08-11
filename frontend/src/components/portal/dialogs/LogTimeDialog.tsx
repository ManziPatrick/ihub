import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Loader2, CheckCircle } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { LOG_INTERNSHIP_TIME } from "@/lib/graphql/mutations";
import { toast } from "sonner";

interface LogTimeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
}

export function LogTimeDialog({ open, onOpenChange, teamId }: LogTimeDialogProps) {
    const [minutes, setMinutes] = useState<string>("60");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [logTime, { loading }] = useMutation(LOG_INTERNSHIP_TIME, {
        onCompleted: () => {
            toast.success("Time logged successfully!");
            onOpenChange(false);
            setDescription("");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to log time");
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!minutes || !description || !date) {
            toast.error("Please fill in all fields");
            return;
        }

        await logTime({
            variables: {
                teamId,
                minutes: parseInt(minutes),
                description,
                date
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent" />
                        Log Opportunity Time
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minutes">Duration (Minutes)</Label>
                        <Input
                            id="minutes"
                            type="number"
                            min="1"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            placeholder="e.g. 60"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">What did you work on?</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe your activities..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="gold"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Logging...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Log Time
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
