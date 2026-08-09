import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Bell, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@apollo/client/react";
import { GET_UNREAD_NOTIFICATIONS } from "@/lib/graphql/queries";
import { useBranding } from "@/components/BrandingProvider";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { GlobalSearchDialog } from "@/components/search/GlobalSearchDialog";

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
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, setIsCartOpen } = useCart();
  const { branding } = useBranding();
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl/Cmd + K opens the global site search (ignored while typing in inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data: notificationData } = useQuery<{ unreadNotificationCount: number }>(
    GET_UNREAD_NOTIFICATIONS,
    { skip: !isAuthenticated, pollInterval: isAuthenticated ? 60000 : 0, fetchPolicy: 'cache-first' }
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
          <Link to="/" className="flex items-center shrink-0 max-w-[280px] pr-2">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.siteName}
                className="h-10 sm:h-12 w-auto object-contain"
              />
            ) : (
              <div className="w-full">
                <Logo variant="with-text" />
              </div>
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
                  {link.name === "Home" ? t("nav.home") : t("nav.explore")}
                </Link>
              );
            })}
          </nav>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2">
            {/* Desktop search — opens global site search (courses, trainers, programs) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 border border-border/30 rounded-full px-3 py-1 bg-background hover:border-accent/40 hover:bg-muted/30 transition-colors"
              aria-label={t("common.search")}
            >
              <Search size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground max-w-[200px] truncate">{t("nav.searchCourses")}</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile search icon — opens global site search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={t("common.search")}
            >
              <Search size={18} />
            </button>
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
                        ? t("nav.trainerPortal")
                        : user?.role === "admin" || user?.role === "super_admin"
                        ? t("nav.adminPortal")
                        : t("nav.portal")}
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
                    {t("nav.login")}
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

      {/* ── Global site search (⌘K / Ctrl+K) ── */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

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
                    {link.name === "Home" ? t("nav.home") : t("nav.explore")}
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
                          ? t("nav.trainerPortal")
                          : user?.role === "admin" || user?.role === "super_admin"
                          ? t("nav.adminPortal")
                          : t("nav.studentPortal")}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <User size={14} />
                      {t("nav.loginSignup")}
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
