import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_BRANDING } from "@/lib/graphql/queries";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

interface Branding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  siteName: string;
  portalTitle: string;
  maintenanceMode: boolean;
}

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
}

const defaultBranding: Branding = {
  primaryColor: "#C9A24D",
  secondaryColor: "#2B2B2D",
  accentColor: "#C9A24D",
  logoUrl: "",
  siteName: "Bootskills",
  portalTitle: "Bootskills",
  maintenanceMode: false,
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
});

export const useBranding = () => useContext(BrandingContext);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { data, loading } = useQuery(GET_BRANDING, {
    fetchPolicy: "cache-and-network",
  });

  const branding = (data as any)?.branding || defaultBranding;

  const hexToHsl = (hex: string) => {
    if (!hex) return "41 47% 50%";
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  useEffect(() => {
    // 1. Handle Primary Color
    const activeColor = user?.themePreference?.primaryColor || branding.primaryColor;
    if (activeColor) {
      const hsl = hexToHsl(activeColor);
      document.documentElement.style.setProperty("--primary", hsl);
      document.documentElement.style.setProperty("--accent", hsl);
      document.documentElement.style.setProperty("--ring", hsl);

      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute("content", activeColor);
      }
    }

    // 2. Handle Background Overrides
    const currentMode = resolvedTheme || theme;
    const customBg = currentMode === 'dark' ? user?.themePreference?.darkBg : user?.themePreference?.lightBg;

    if (customBg) {
      document.documentElement.style.setProperty("--background", hexToHsl(customBg));
      // For a better experience, we can also derive the card background
      // document.documentElement.style.setProperty("--card", hexToHsl(customBg));
    } else {
      document.documentElement.style.removeProperty("--background");
    }

    // 3. Handle Theme Mode - Only sync from backend if user specifically chose 'light' or 'dark'
    // and we don't have a local override yet, or just rely on next-themes for persistence.
    // To satisfy the user request "stored in local storage", we let next-themes manage it.
    // We only force it if there's a strong reason to sync from DB.
    /* 
    if (user?.themePreference?.mode && user.themePreference.mode !== 'system') {
      setTheme(user.themePreference.mode);
    }
    */
  }, [
    branding.primaryColor,
    user?.id,
    user?.themePreference?.primaryColor,
    user?.themePreference?.lightBg,
    user?.themePreference?.darkBg,
    // setTheme removed from dependencies to avoid loop if we were calling it
  ]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}
