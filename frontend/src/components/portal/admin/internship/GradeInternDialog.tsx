import { useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { GRADE_SPRINT_MILESTONE } from '@/lib/graphql/mutations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, GraduationCap, Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradeInternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  internship: any;
  onGraded?: () => void;
}

const gradeColor = (g: number) =>
  g >= 80 ? 'text-green-500 border-green-500/30 bg-green-500/10' :
  g >= 50 ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
  'text-red-500 border-red-500/30 bg-red-500/10';

export function GradeInternDialog({ open, onOpenChange, internship, onGraded }: GradeInternDialogProps) {
  const [score, setScore] = useState('');
  const [week, setWeek] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reviews: any[] = internship?.sprintReviews || [];

  // Suggest the next week number for convenience
  const suggestedWeek = useMemo(() => {
    if (!reviews.length) return 1;
    return Math.max(...reviews.map((r: any) => Number(r.week) || 0)) + 1;
  }, [reviews]);

  const [gradeIntern] = useMutation(GRADE_SPRINT_MILESTONE, {
    onCompleted: () => {
      toast.success(`Grade recorded for ${internship?.user?.fullName || internship?.user?.username || 'intern'}`);
      setScore('');
      setFeedback('');
      setWeek('');
      onGraded?.();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to grade: ' + err.message),
  });

  const handleSubmit = async () => {
    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      toast.error('Please enter a score between 0 and 100');
      return;
    }
    setSubmitting(true);
    try {
      await gradeIntern({
        variables: {
          internshipId: internship?.id,
          week: Number(week) || suggestedWeek,
          grade: numericScore,
          feedback: feedback.trim() || 'No feedback provided',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = internship?.user?.fullName || internship?.user?.username || 'Unknown student';
  const avg = reviews.length
    ? Math.round(reviews.reduce((acc, r) => acc + (Number(r.grade) || 0), 0) / reviews.length)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            Grade Intern
          </DialogTitle>
          <DialogDescription>
            Record an evaluation for this stage of the program.
          </DialogDescription>
        </DialogHeader>

        {/* Intern header */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/10">
          <Avatar className="h-10 w-10">
            {internship?.user?.avatar && <AvatarImage src={internship.user.avatar} />}
            <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">
              {studentName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{studentName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {internship?.stage || `Stage ${internship?.currentStage || 1}`} · {internship?.title || 'Internship Program'}
            </p>
          </div>
          {avg !== null && (
            <Badge variant="outline" className={cn('text-[11px] font-black', gradeColor(avg))}>
              <Star className="w-3 h-3 mr-1" /> Avg {avg}
            </Badge>
          )}
        </div>

        {/* Score + Week */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Score (0-100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 85"
              className="h-10 rounded-xl text-center font-black"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Week / Evaluation #</Label>
            <Input
              type="number"
              min={1}
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder={String(suggestedWeek)}
              className="h-10 rounded-xl text-center font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Feedback</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Strengths, areas to improve, next steps..."
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Past reviews */}
        {reviews.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Past evaluations ({reviews.length})
            </p>
            {reviews.slice().reverse().map((r: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl border border-border/40 bg-muted/10">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={cn('text-[10px] font-black', gradeColor(Number(r.grade) || 0))}>
                    Week {r.week || '?'}: {r.grade}/100
                  </Badge>
                  {r.date && <span className="text-[10px] text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>}
                </div>
                {r.feedback && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{r.feedback}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl bg-accent text-accent-foreground font-bold gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />} Save Grade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
