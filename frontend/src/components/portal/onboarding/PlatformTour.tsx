import { useState, useEffect, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Joyride,
  type Step,
  type EventData,
  ACTIONS,
  STATUS,
} from "react-joyride";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "@/contexts/AuthContext";
import { MARK_TOUR_COMPLETED } from "@/lib/graphql/mutations";
import { tourFactoriesByRole } from "./TourConfig";
import { mdToHtml } from "@/lib/markdown";

/**
 * Render a string with basic markdown (**bold**, ### headings) as HTML.
 */
function renderMd(content: React.ReactNode): React.ReactNode {
  if (typeof content !== "string") return content;
  return (
    <span
      className="[&_strong]:font-semibold [&_strong]:text-foreground"
      dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
    />
  );
}

/**
 * ───────────────────────────────────────────────
 *  PLATFORM TOUR
 *  Auto-triggers on first login, marks as completed
 *  when the user finishes or skips.
 * ───────────────────────────────────────────────
 */
export function PlatformTour() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [markTourCompletedServer] = useMutation(MARK_TOUR_COMPLETED);

  const [runTour, setRunTour] = useState(false);

  // 🔁 MEMOIZE steps so Joyride doesn't see a new array on every render
  //    (which would cause it to reset to step 0).
  const role = user?.role || "student";
  const tourConfig = tourFactoriesByRole[role];
  const steps: Step[] = useMemo(
    () =>
      (tourConfig?.factory(t) || []).map((step) => ({
        ...step,
        // Render **bold** and ### headings from translation strings as HTML
        content: renderMd(step.content),
        title: step.title ? renderMd(step.title) : step.title,
      })),
    // t from useTranslation() is stable across renders
    [tourConfig, t]
  );

  // ───────────────────────────────────────────────
  //  AUTO-TRIGGER ON FIRST LOGIN
  //  → user.isFirst must be true
  //  → no local-storage flag must exist
  //  → wait 800ms for DOM to settle
  // ───────────────────────────────────────────────
  const isFirstTime = user?.isFirst === true;
  const tourCompleted = user?.id
    ? localStorage.getItem(`tour_completed_${user.id}`)
    : null;

  useEffect(() => {
    if (isFirstTime && !tourCompleted && user) {
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isFirstTime, tourCompleted, user]);

  // ───────────────────────────────────────────────
  //  CONFETTI CELEBRATION
  // ───────────────────────────────────────────────
  const fireConfetti = useCallback(() => {
    console.log("[Tour] 🎉 Firing confetti!");

    let accentColor = "#f59e0b";
    try {
      const style = getComputedStyle(document.documentElement);
      const accentHsl = style.getPropertyValue("--accent").trim();
      if (accentHsl) {
        accentColor = `hsl(${accentHsl})`;
      }
    } catch {}

    // Big initial burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: [accentColor, "#f59e0b", "#3b82f6", "#10b981", "#ec4899"],
    });

    // Sustained dual-sided shower
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors: [accentColor, "#f59e0b", "#3b82f6", "#10b981"],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors: [accentColor, "#f59e0b", "#3b82f6", "#10b981"],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // ───────────────────────────────────────────────
  //  COMPLETION — local + server sync + confetti
  // ───────────────────────────────────────────────
  const markTourCompleted = useCallback(
    (finished: boolean) => {
      if (finished) {
        fireConfetti();
      }

      if (user?.id) {
        localStorage.setItem(`tour_completed_${user.id}`, "true");
        if (user.isFirst) {
          updateUser({ isFirst: false });
          markTourCompletedServer().catch((err) =>
            console.error(
              "[Tour] Failed to sync tour completion to server:",
              err
            )
          );
        }
      }

      setRunTour(false);
    },
    [user, updateUser, markTourCompletedServer, fireConfetti]
  );

  // ───────────────────────────────────────────────
  //  JOYRIDE CALLBACK
  //  We DON'T pass stepIndex so Joyride manages step
  //  progression internally — that prevents the
  //  "only welcome step showing" bug.
  // ───────────────────────────────────────────────
  const handleJoyrideCallback = useCallback(
    (data: EventData) => {
      const { action, status } = data;

      const finished = status === STATUS.FINISHED;

      if (
        action === ACTIONS.CLOSE ||
        action === ACTIONS.SKIP ||
        finished ||
        status === STATUS.SKIPPED
      ) {
        markTourCompleted(finished);
      }
    },
    [markTourCompleted]
  );

  // ───────────────────────────────────────────────
  //  MANUAL RESTART (via window event)
  //  Toggle run false → true so Joyride resets
  //  to step 0 internally.
  // ───────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (user?.id) {
        localStorage.removeItem(`tour_completed_${user.id}`);
      }
      // Stop then restart with a microtask gap so Joyride
      // sees the state transition and resets correctly.
      setRunTour(false);
      setTimeout(() => setRunTour(true), 50);
    };
    window.addEventListener("restart-tour", handler);
    return () => window.removeEventListener("restart-tour", handler);
  }, [user?.id]);

  if (!user) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      floatingOptions={{
        // Keep tooltip inside the viewport
        strategy: "fixed",
      }}
      options={{
        arrowColor: "hsl(var(--card))",
        backgroundColor: "hsl(var(--card))",
        overlayColor: "rgba(0, 0, 0, 0.6)",
        primaryColor: "hsl(var(--accent))",
        textColor: "hsl(var(--card-foreground))",
        zIndex: 1000,
        width: 380,
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
        dismissKeyAction: false,
        overlayClickAction: false,
      }}
      locale={{
        back: t("tour.locale.back"),
        close: t("tour.locale.close"),
        last: t("tour.locale.last"),
        next: t("tour.locale.next"),
        skip: t("tour.locale.skip"),
      }}
      styles={{
        overlay: {
          // Full viewport coverage regardless of scroll (use inset:0 instead
          // of width/height: 100vw/vh to avoid scrollbar width issues)
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "auto",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "1.1rem",
          fontWeight: 700,
          marginBottom: 8,
          fontFamily: "var(--font-heading, inherit)",
        },
        tooltipContent: {
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "hsl(var(--muted-foreground))",
        },
        buttonPrimary: {
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--accent-foreground))",
          borderRadius: 8,
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "0.85rem",
          marginRight: 8,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "0.8rem",
          fontWeight: 500,
        },
        buttonClose: {
          color: "hsl(var(--muted-foreground))",
        },
        beacon: {
          display: "none",
        },
        spotlight: {}, // SVG path styling handled via spotlightRadius in step options
      }}
      onEvent={handleJoyrideCallback}
    />
  );
}

/**
 * Helper to restart the tour programmatically.
 */
export function restartTour() {
  window.dispatchEvent(new CustomEvent("restart-tour"));
}
