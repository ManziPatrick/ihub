import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Settings2, 
  Clock, 
  ShieldAlert, 
  RotateCcw,
  Target
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
}

interface AssignmentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AssignmentConfig;
  onSave: (config: AssignmentConfig) => void;
}

export function AssignmentConfigDialog({
  open,
  onOpenChange,
  config: initialConfig,
  onSave
}: AssignmentConfigDialogProps) {
  const [localConfig, setLocalConfig] = useState<AssignmentConfig>(initialConfig || {
    timeLimit: 0,
    allowRetakes: false,
    disableRightClick: false,
    mode: 'exam'
  });

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-accent/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-accent" />
            Assignment Exam Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target className="w-3 h-3" /> Delivery Mode
            </label>
            <Select 
              value={localConfig.mode} 
              onValueChange={(val: any) => setLocalConfig({...localConfig, mode: val})}
            >
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exam">Official Exam (Graded)</SelectItem>
                <SelectItem value="exercise">Practice Exercise (Self-paced)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Exams are usually timed and count towards the final grade.</p>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" /> Time Limit (Minutes)
            </label>
            <Input 
              type="number"
              value={localConfig.timeLimit || ""}
              onChange={(e) => setLocalConfig({...localConfig, timeLimit: parseInt(e.target.value) || 0})}
              placeholder="0 for unlimited"
              className="h-12"
            />
            <p className="text-[10px] text-muted-foreground">Set to 0 for no time limit.</p>
          </div>

          {/* Anti-Cheat */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold">Anti-Cheat Mode</h4>
              </div>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">Disables right-click and copy/paste during the exam.</p>
            </div>
            <Switch 
              checked={localConfig.disableRightClick}
              onCheckedChange={(val) => setLocalConfig({...localConfig, disableRightClick: val})}
            />
          </div>

          {/* Retakes */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-bold">Allow Retakes</h4>
              </div>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">Students can attempt the assignment multiple times.</p>
            </div>
            <Switch 
              checked={localConfig.allowRetakes}
              onCheckedChange={(val) => setLocalConfig({...localConfig, allowRetakes: val})}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/5">
          <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="gold" className="flex-1 h-11 font-black uppercase tracking-widest" onClick={handleSave}>
            Apply Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
