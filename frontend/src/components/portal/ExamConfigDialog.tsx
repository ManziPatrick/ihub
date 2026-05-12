import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings2, 
  Clock, 
  ShieldAlert, 
  RotateCcw,
  Target,
  Trophy,
  AlertTriangle,
  Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignmentConfig {
  timeLimit?: number;
  allowRetakes: boolean;
  disableRightClick: boolean;
  mode: 'exam' | 'exercise';
  passingScore?: number;
}

interface ExamConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AssignmentConfig;
  onSave: (config: AssignmentConfig) => void;
  title?: string;
}

export function ExamConfigDialog({
  open,
  onOpenChange,
  config: initialConfig,
  onSave,
  title = "Module Exam Configuration"
}: ExamConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<AssignmentConfig>(initialConfig || {
    timeLimit: 0,
    allowRetakes: false,
    disableRightClick: true,
    mode: 'exam',
    passingScore: 70
  });

  // Sync local state when initialConfig prop changes
  useEffect(() => {
    if (initialConfig) {
      setLocalConfig(initialConfig);
    }
  }, [initialConfig]);

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] sm:max-w-2xl w-full max-h-[100dvh] sm:max-h-[90vh] bg-background border-accent/20 p-0 overflow-hidden rounded-none sm:rounded-lg shadow-2xl">
        <DialogHeader className="p-6 bg-muted/30 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-gold/10">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-foreground/80">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Configure the rules and environment for this module assessment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary Settings */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Target className="w-3 h-3 text-accent" /> Delivery Mode
                </label>
                <Select 
                  value={localConfig.mode} 
                  onValueChange={(val: any) => setLocalConfig({...localConfig, mode: val})}
                >
                  <SelectTrigger className="w-full h-12 bg-muted/20 border-border/40 rounded-xl font-bold">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam">Official Exam (Graded)</SelectItem>
                    <SelectItem value="exercise">Practice Exercise (Self-paced)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  {localConfig.mode === 'exam' 
                    ? "Official exams are strict and impact the course grade." 
                    : "Practice mode allows for learning without pressure."}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-accent" /> Time Limit (Minutes)
                </label>
                <Input 
                  type="number"
                  value={localConfig.timeLimit || ""}
                  onChange={(e) => setLocalConfig({...localConfig, timeLimit: parseInt(e.target.value) || 0})}
                  placeholder="0 for unlimited"
                  className="h-12 bg-muted/20 border-border/40 rounded-xl font-black text-lg"
                />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Students will be auto-submitted when time expires.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-accent" /> Passing Score (%)
                </label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={localConfig.passingScore || 70}
                  onChange={(e) => setLocalConfig({...localConfig, passingScore: parseInt(e.target.value) || 0})}
                  className="h-12 bg-muted/20 border-border/40 rounded-xl font-black text-lg"
                />
              </div>
            </div>

            {/* Integrity & Rules */}
            <div className="space-y-4">
              <Card className="border-border/40 bg-muted/10 shadow-none rounded-2xl overflow-hidden">
                <CardHeader className="p-4 pb-2 bg-muted/30">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Integrity Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Anti-Cheat Mode</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Block right-click & copy</p>
                    </div>
                    <Switch 
                      checked={localConfig.disableRightClick}
                      onCheckedChange={(val) => setLocalConfig({...localConfig, disableRightClick: val})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Allow Retakes</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Unlimited attempts</p>
                    </div>
                    <Switch 
                      checked={localConfig.allowRetakes}
                      onCheckedChange={(val) => setLocalConfig({...localConfig, allowRetakes: val})}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/60 leading-relaxed">
                  Configuring this as an <b>Official Exam</b> will enable AI-proctoring events and detailed performance tracking for trainers.
                </p>
              </div>

              {localConfig.timeLimit && localConfig.timeLimit > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/60 leading-relaxed">
                    Strict timer enabled. Ensure the question count is appropriate for {localConfig.timeLimit} minutes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border/20 flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 h-12 font-black uppercase tracking-widest text-[10px]" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="gold" 
            className="flex-1 h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-gold/20" 
            onClick={handleSave}
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
