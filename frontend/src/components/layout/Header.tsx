import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Bell, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@apollo/client/react";
import { GET_UNREAD_NOTIFICATIONS } from "@/lib/graphql/queries";
import { useBranding } from "@/components/BrandingProvider";

// Reference image nav: Home + Applications only shown in desktop
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
];

// Full mobile menu links
const mobileLinks = [
  { name: "Home", href: "/" },
  { name: "Explore", href: "/explore" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const { branding } = useBranding();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notificationData } = useQuery<{ unreadNotificationCount: number }>(
    GET_UNREAD_NOTIFICATIONS,
    { skip: !isAuthenticated, pollInterval: isAuthenticated ? 30000 : 0 }
  );
  const unreadCount = notificationData?.unreadNotificationCount || 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const portalHref =
    user?.role === "trainer"
      ? "/portal/trainer"
      : user?.role === "admin" || user?.role === "super_admin"
      ? "/portal/admin"
      : "/portal/student";

  const handleHeaderSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/explore?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/explore");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm"
          : "bg-background border-b border-border/40"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.siteName}
                className="h-7 sm:h-8 w-auto"
              />
            ) : (
              <>
                {/* <span className="text-accent text-2xl font-bold leading-none">BS</span> */}
                <span className="font-semibold text-base lg:text-lg text-foreground tracking-wide">
                  {branding.siteName}
                </span>
              </>
            )}
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 border border-border/30 rounded-full px-3 py-1 bg-background">
              <Search size={16} className="text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleHeaderSearch();
                }}
                placeholder="Search courses"
                className="h-9 w-48 rounded-full border-0 bg-transparent focus:ring-0"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex h-9 px-3 rounded-full"
              onClick={handleHeaderSearch}
            >
              Search
            </Button>
            <ThemeToggle />

            {/* Notification bell */}
            {isAuthenticated && (
              <Link to={portalHref}>
                <button
                  id="header-notifications"
                  className="relative p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </Link>
            )}

            {/* Cart icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              id="header-cart"
              className="relative p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#1a3d3d] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            </button>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link to={portalHref}>
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-1.5 h-9 px-4 rounded-lg text-sm font-medium"
                    >
                      <User size={14} />
                      {user?.role === "trainer"
                        ? "Trainer"
                        : user?.role === "admin" || user?.role === "super_admin"
                        ? "Admin"
                        : "Portal"}
                    </Button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <Link to="/auth">
                  <Button
                    id="header-login"
                    variant="outline"
                    size="sm"
                    className="h-9 px-5 rounded-lg text-sm font-medium border-border hover:border-foreground/40 gap-1.5"
                  >
                    <User size={14} />
                    Log in
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors ml-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden bg-background border-t border-border/50 overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {mobileLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to={portalHref}>
                      <Button variant="gold" size="sm" className="w-full gap-2">
                        <User size={14} />
                        {user?.role === "trainer"
                          ? "Trainer Portal"
                          : user?.role === "admin" || user?.role === "super_admin"
                          ? "Admin Portal"
                          : "Student Portal"}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <User size={14} />
                      Log in / Sign up
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
