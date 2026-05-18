import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentForm } from "@/components/PaymentForm";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { ENROLL_COURSE } from "@/lib/graphql/mutations";
import { useToast } from "@/hooks/use-toast";

export function CartDrawer() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsCartOpen(false);
      navigate("/auth");
    } else if (cartTotal === 0) {
      handleFreeEnrollment();
    } else {
      setIsCheckingOut(true);
    }
  };

  const [enrollMutation, { loading: enrolling }] = useMutation(ENROLL_COURSE, {
    onCompleted: () => {
      toast({
        title: "Success",
        description: "You have successfully enrolled in your free courses!",
      });
      cartItems.forEach(item => removeFromCart(item.id));
      handleClose();
      navigate("/portal/student/courses");
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  const handleFreeEnrollment = async () => {
    try {
      for (const item of cartItems) {
        if (item.type === 'course') {
          await enrollMutation({ variables: { courseId: item.id } });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => setIsCheckingOut(false), 300); // reset after animation
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-foreground text-lg">Your Cart</h3>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs font-bold text-muted-foreground">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isCheckingOut ? (
                <div className="space-y-4">
                  <button 
                    onClick={() => setIsCheckingOut(false)}
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to cart
                  </button>
                  <PaymentForm 
                    amount={cartTotal} 
                    description={cartItems.map(item => item.title).join(", ")}
                    courseIds={cartItems.filter(item => item.type === 'course').map(item => item.id)}
                    internshipIds={cartItems.filter(item => item.type === 'internship').map(item => item.id)}
                    onSuccess={() => {
                      cartItems.forEach(item => removeFromCart(item.id));
                      handleClose();
                      navigate("/portal/student/billing");
                    }}
                  />
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                  <ShoppingCart className="w-16 h-16 text-muted-foreground" />
                  <p className="text-sm font-medium">Your cart is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-background/50 relative group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                        {item.type}
                      </p>
                      <h4 className="text-sm font-semibold text-foreground leading-tight mb-2 line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs font-bold text-accent">
                        {item.discountPrice
                          ? `${item.discountPrice.toLocaleString()} RWF`
                          : item.price === 0
                          ? "Free"
                          : `${item.price.toLocaleString()} RWF`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && !isCheckingOut && (
              <div className="p-5 border-t border-border/50 bg-muted/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    {cartTotal === 0 ? "Free" : `${cartTotal.toLocaleString()} RWF`}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  disabled={enrolling}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl text-sm font-bold tracking-wide"
                >
                  {!isAuthenticated 
                    ? "Log in to Checkout" 
                    : cartTotal === 0 
                      ? (enrolling ? "Enrolling..." : "Enroll Now")
                      : "Proceed to Checkout"
                  }
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
