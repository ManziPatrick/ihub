import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background py-8 border-t border-border/40 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-end gap-8 text-sm text-muted-foreground font-medium">
          <Link to="/contact" className="hover:text-foreground transition-colors">Support</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">FAQ</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Accessibility Options</Link>
        </div>
      </div>
    </footer>
  );
}
