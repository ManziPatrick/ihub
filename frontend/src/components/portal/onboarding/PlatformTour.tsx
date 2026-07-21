import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Joyride,
  type Step,
  type CallBackProps,
  ACTIONS,
  EVENTS,
  STATUS,
} from "react-joyride";
import { useTranslation } from "react-i18next";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "@/contexts/AuthContext";
import { MARK_TOUR_COMPLETED } from "@/lib/graphql/mutations";
import { tourFactoriesByRole } from "./TourConfig";

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
  const [stepIndex, setStepIndex] = useState(0);
  const wasFinished = useRef(false);

  // Build steps dynamically using i18n
  const role = user?.role || "student";
  const tourConfig = tourFactoriesByRole[role];
  const steps: Step[] = tourConfig?.factory(t) || [];

  // Determine if the tour should auto-start
  const isFirstTime = user?.isFirst === true;
  const tourCompleted = localStorage.getItem(
    `tour_completed_${user?.id}`
  );
  const shouldAutoStart =
    isFirstTime && !tourCompleted && !!user;

  useEffect(() => {
    if (shouldAutoStart) {
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoStart]);

  // Fire confetti celebration
  const fireConfetti = useCallback(() => {
    console.log("[Tour] 🎉 Firing confetti!");

    // Resolve the accent color from CSS variable (canvas can't read var() )
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

  // Mark tour as completed (local + server sync)
  const markTourCompleted = useCallback(() => {
    // Fire confetti only if user actually completed the full tour
    if (wasFinished.current) {
      fireConfetti();
    }

    if (user?.id) {
      localStorage.setItem(`tour_completed_${user.id}`, "true");
      if (user.isFirst) {
        updateUser({ isFirst: false });
        // Sync to server so completion persists across devices
        markTourCompletedServer().catch((err) =>
          console.error("[Tour] Failed to sync tour completion to server:", err)
        );
      }
    }
    setRunTour(false);
    setStepIndex(0);
    wasFinished.current = false;
  }, [user, updateUser, markTourCompletedServer, fireConfetti]);

  // Handle joyride callback
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, status, index, type } = data;

      // Track if user actually reached the end (vs skipped/closed)
      if (status === STATUS.FINISHED) {
        wasFinished.current = true;
      }

      if (
        action === ACTIONS.CLOSE ||
        action === ACTIONS.SKIP ||
        status === STATUS.FINISHED ||
        status === STATUS.SKIPPED
      ) {
        markTourCompleted();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        setStepIndex((prev) =>
          action === ACTIONS.PREV ? prev - 1 : prev + 1
        );
      }
    },
    [markTourCompleted]
  );

  // Listen for manual restart
  useEffect(() => {
    const handler = () => {
      if (user?.id) {
        localStorage.removeItem(`tour_completed_${user.id}`);
      }
      setStepIndex(0);
      setRunTour(true);
    };
    window.addEventListener("restart-tour", handler);
    return () =>
      window.removeEventListener("restart-tour", handler);
  }, [user?.id]);

  if (!user) return null;

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      disableCloseOnEsc
      disableOverlayClose
      hideBackButton={false}
      locale={{
        back: t("tour.locale.back"),
        close: t("tour.locale.close"),
        last: t("tour.locale.last"),
        next: t("tour.locale.next"),
        skip: t("tour.locale.skip"),
      }}
      styles={{
        options: {
          arrowColor: "hsl(var(--card))",
          backgroundColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          primaryColor: "hsl(var(--accent))",
          textColor: "hsl(var(--card-foreground))",
          zIndex: 1000,
          width: 380,
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
        buttonNext: {
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
        spotlight: {
          borderRadius: 12,
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}

/**
 * Helper to restart the tour programmatically.
 */
export function restartTour() {
  window.dispatchEvent(new CustomEvent("restart-tour"));
}
