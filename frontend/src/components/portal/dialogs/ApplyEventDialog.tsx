import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { APPLY_TO_EVENT } from "@/lib/graphql/mutations";
import { GET_EVENT, GET_MY_EVENT_APPLICATIONS } from "@/lib/graphql/queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  Loader2,
  ArrowRight,
  Info,
  ChevronRight,
  ShoppingCart,
  MapPin,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ApplyEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess?: () => void;
}

export function ApplyEventDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: ApplyEventDialogProps) {
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [submitted, setSubmitted] = useState(false);

  // Fetch event details
  const { data: eventData, loading: isLoadingEvent } = useQuery(GET_EVENT, {
    variables: { id: eventId },
    skip: !eventId || !open,
  });

  const event = (eventData as any)?.event;

  const [applyMutation, { loading: isSubmitting }] = useMutation(APPLY_TO_EVENT, {
    onCompleted: () => {
      setSubmitted(true);
      localStorage.removeItem(`event_draft_${eventId}`);
      toast.success("Registration submitted successfully!");

      // If the event has a price, add to cart
      if (event?.price > 0) {
        addToCart({
          id: eventId,
          title: `Registration: ${event?.title}`,
          price: event?.price || 0,
          type: "event",
        });
      }

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      if (error.message.includes("11000") || error.message.includes("duplicate key")) {
        toast.error("You have already registered for this event.");
      } else {
        toast.error(error.message);
      }
    },
    refetchQueries: [{ query: GET_MY_EVENT_APPLICATIONS }],
  });

  const handleApply = async () => {
    await applyMutation({
      variables: {
        eventId,
        applicationAnswers: [],
        selectedDeliveryMode: event?.isOnline ? "online" : "physical",
      },
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/50 rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/5 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <span>Register for Event</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {event?.title || "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {isLoadingEvent ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Loading event details...</p>
          </div>
        ) : submitted ? (
          /* ── Success State ── */
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2 px-2">
              <h3 className="text-2xl font-black">Registered! 🎉</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {event?.price > 0
                  ? `Your registration for "${event?.title}" has been added to your cart for checkout.`
                  : `You're registered for "${event?.title}". We look forward to seeing you there!`}
              </p>
            </div>
            <Button
              variant="gold"
              className="w-full h-12 rounded-xl text-sm font-bold"
              onClick={() => {
                handleClose();
                if (event?.price > 0) {
                  setIsCartOpen(true);
                }
              }}
            >
              {event?.price > 0 ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart & Checkout
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "Done"
              )}
            </Button>
          </div>
        ) : (
          /* ── Info State ── */
          <div className="p-6 space-y-6">
            {/* Event summary */}
            <div className="bg-muted/10 rounded-2xl p-4 space-y-3 border border-border/30">
              {event?.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-xl"
                />
              )}
              <div className="space-y-2">
                <h4 className="font-bold text-sm">{event?.title}</h4>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {event?.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {formatDate(event.startDate)}
                    </span>
                  )}
                  {event?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      {event.location}
                    </span>
                  )}
                  {event?.isOnline && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-accent" />
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
              <span className="text-sm font-medium">Registration Fee</span>
              <span className="text-xl font-black">
                {event?.price > 0
                  ? `${event?.price?.toLocaleString()} ${event?.currency || "RWF"}`
                  : "Free"}
              </span>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {event?.price > 0
                    ? "Payment Required"
                    : "Free Registration"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {event?.price > 0
                    ? `Complete your registration now, then proceed to payment. Your spot is reserved after payment confirmation.`
                    : `No payment needed. Just confirm your attendance below.`}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                className="text-muted-foreground font-bold rounded-xl h-12 px-6"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="px-10 h-12 rounded-xl gap-2 shadow-premium hover:-translate-y-0.5 transition-all text-sm font-bold min-w-[180px]"
                onClick={handleApply}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {event?.price > 0 ? "Register & Pay" : "Confirm Registration"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
