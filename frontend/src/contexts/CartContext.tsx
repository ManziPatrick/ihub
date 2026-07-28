import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  type: "course" | "internship" | "event";
  image?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ihub_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("ihub_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const { user } = useAuth();

  const addToCart = (item: CartItem) => {
    // Check if user is already enrolled in this course
    if (user?.enrolledCourses?.includes(item.id)) {
      toast.info("You are already enrolled in this course! 🎉");
      return;
    }

    // Normalize prices to numbers — API can return strings, null, or undefined
    const normalized = {
      ...item,
      price: Number(item.price) || 0,
      discountPrice: item.discountPrice != null ? Number(item.discountPrice) || 0 : undefined,
    };

    setCartItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        toast.info("Item is already in the cart.");
        setIsCartOpen(true); // Open even if already there so they can see it
        return prev;
      }
      toast.success(`${item.title} added to cart!`);
      setIsCartOpen(true);
      return [...prev, normalized];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const effectivePrice =
      item.discountPrice != null && Number(item.discountPrice) > 0
        ? Number(item.discountPrice)
        : Number(item.price) || 0;
    return total + effectivePrice;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
