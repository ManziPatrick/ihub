import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// ── New SVG imports (black for light mode, white for dark mode) ──
import logoSvgLight from "@/assets/visibilities/bootskills logo black.svg";
import logoSvgDark from "@/assets/visibilities/bootskills logo white .svg";
import logoWithTextSvgLight from "@/assets/visibilities/bootskills log black with text.svg";
import logoWithTextSvgDark from "@/assets/visibilities/bootskills log white with text.svg";

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

const variantMap: Record<
  LogoVariant,
  { srcLight: string; srcDark: string; defaultHeight: string; alt: string }
> = {
  icon: {
    srcLight: logoSvgLight,
    srcDark: logoSvgDark,
    defaultHeight: "h-12 sm:h-14",
    alt: "Bootskills",
  },
  full: {
    srcLight: logoWithTextSvgLight,
    srcDark: logoWithTextSvgDark,
    defaultHeight: "h-14 sm:h-16",
    alt: "Bootskills",
  },
  "with-text": {
    srcLight: logoWithTextSvgLight,
    srcDark: logoWithTextSvgDark,
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

  // Light mode image (black logo)
  const lightImg = (
    <img
      src={config.srcLight}
      alt={alt || config.alt}
      className={cn(height, "w-auto object-contain block dark:hidden", className)}
      loading="eager"
    />
  );

  // Dark mode image (white logo)
  const darkImg = (
    <img
      src={config.srcDark}
      alt=""
      aria-hidden="true"
      className={cn(height, "w-auto object-contain hidden dark:block", className)}
      loading="eager"
    />
  );

  const content = (
    <>
      {lightImg}
      {darkImg}
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
