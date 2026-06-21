import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@apollo/client/react";
import { UPDATE_USER } from "@/lib/graphql/mutations";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Loader2, Navigation } from "lucide-react";

const RWANDAN_CITIES = [
  "Kigali, Rwanda",
  "Musanze, Rwanda",
  "Butare, Rwanda",
  "Huye, Rwanda",
  "Rwamagana, Rwanda",
  "Rubavu, Rwanda",
  "Kayonza, Rwanda",
  "Rusizi, Rwanda",
  "Nyagatare, Rwanda",
  "Gisenyi, Rwanda",
  "Gitarama, Rwanda",
  "Nyanza, Rwanda",
  "Kibuye, Rwanda",
  "Cyangugu, Rwanda",
  "Kibungo, Rwanda",
];

interface LocationSetupDialogProps {
  onComplete: () => void;
}

export function LocationSetupDialog({ onComplete }: LocationSetupDialogProps) {
  const { user, updateUser } = useAuth();
  const [updateUserMutation] = useMutation(UPDATE_USER);
  const [location, setLocation] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelect = (city: string) => {
    setLocation(city);
    setIsCustom(false);
  };

  const handleSave = async () => {
    const finalLocation = isCustom ? customCity : location;
    if (!finalLocation?.trim()) {
      toast.error("Please enter or select your location");
      return;
    }

    setSaving(true);
    try {
      await updateUserMutation({
        variables: {
          id: user?.id,
          location: finalLocation.trim(),
        },
      });
      updateUser({ location: finalLocation.trim() });
      toast.success("Location saved!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent-glow),transparent_50%)] opacity-20 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
            <p className="text-sm text-muted-foreground">
              Tell us where you're based so we can connect you with local opportunities and events.
            </p>
          </div>

          {/* City Selection */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Select your city
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
              {RWANDAN_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleSelect(city)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    location === city && !isCustom
                      ? "bg-accent text-accent-foreground border-accent shadow-md"
                      : "bg-card border-border/50 hover:border-accent/30 hover:bg-accent/5 text-foreground"
                  }`}
                >
                  {city.replace(", Rwanda", "")}
                </button>
              ))}
            </div>

            {/* Custom Location Input */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            <div className="relative">
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Type your city..."
                value={isCustom ? customCity : ""}
                onChange={(e) => {
                  setIsCustom(true);
                  setCustomCity(e.target.value);
                }}
                onFocus={() => setIsCustom(true)}
                className="h-11 pl-10 bg-background/50 border-accent/10 rounded-xl"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl border-accent/20"
              onClick={onComplete}
              disabled={saving}
            >
              Skip
            </Button>
            <Button
              variant="gold"
              className="flex-[2] h-11 rounded-xl font-bold"
              onClick={handleSave}
              disabled={saving || (!location && !customCity?.trim())}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Location"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
