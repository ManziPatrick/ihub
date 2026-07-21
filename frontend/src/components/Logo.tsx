import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// ── Image imports ──
import coloredLogoSrc from "@/assets/visibilities/bootskills colored logo.png";
import singleColorLogoSrc from "@/assets/visibilities/bootskill single color logo.png";
import logoWithTextSrc from "@/assets/visibilities/bootskills logo with text.png";

type LogoVariant = "icon" | "full" | "with-text";

interface LogoProps {
  /** Which visual variant to show */
  variant?: LogoVariant;
  /** Additional class names on the wrapper */
  className?: string;
  /** Image height (applied via h-* class). Default varies by variant */
  imgHeight?: string;
  /** Whether to wrap in a Link to "/" */
  linkTo?: string;
  /** Alt text for the image */
  alt?: string;
}

const variantMap: Record<LogoVariant, { src: string; defaultHeight: string; alt: string }> = {
  icon: {
    src: singleColorLogoSrc,
    defaultHeight: "h-12 sm:h-14",
    alt: "Bootskills",
  },
  full: {
    src: coloredLogoSrc,
    defaultHeight: "h-14 sm:h-16",
    alt: "Bootskills",
  },
  "with-text": {
    src: logoWithTextSrc,
    defaultHeight: "h-10 sm:h-12",
    alt: "Bootskills",
  },
};

export function Logo({
  variant = "with-text",
  className,
  imgHeight,
  linkTo,
  alt,
}: LogoProps) {
  const config = variantMap[variant];
  const height = imgHeight || config.defaultHeight;

  const img = (
    <img
      src={config.src}
      alt={alt || config.alt}
      className={cn(height, "w-auto object-contain", className)}
      loading="eager"
    />
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
