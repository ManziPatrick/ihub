import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, XCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  icon?: LucideIcon;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  icon: Icon = AlertTriangle,
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
  };

  const iconColors = {
    destructive: "text-destructive",
    warning: "text-amber-500",
    default: "text-primary",
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", iconColors[variant])} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variantStyles[variant]}
            disabled={loading}
          >
            {loading ? (
              <><span className="w-4 h-4 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> {confirmText}</>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
