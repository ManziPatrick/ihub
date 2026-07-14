import { motion } from "framer-motion";
import { ReactNode } from "react";
import { ErrorCaptureBoundary } from "@/lib/errorCapture";
import { ErrorFallback } from "@/components/ErrorFallback";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.4, 0, 0.2, 1] as const,
  duration: 0.3,
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <ErrorCaptureBoundary
      key={location.pathname}
      componentName="PageTransition"
      fallback={
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
        >
          <ErrorFallback onRetry={() => window.location.reload()} />
        </motion.div>
      }
    >
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </ErrorCaptureBoundary>
  );
}
