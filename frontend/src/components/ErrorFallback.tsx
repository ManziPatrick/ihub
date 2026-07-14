import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ErrorFallbackProps {
  error?: Error | null;
  componentName?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ error, componentName, onRetry }: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {componentName
              ? `The ${componentName} page encountered an unexpected error.`
              : "This page encountered an unexpected error."}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Our team has been automatically notified. Please try refreshing.
          </p>
        </div>

        {/* Error message */}
        {error?.message && (
          <div className="w-full">
            <details className="group">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Error details
              </summary>
              <pre className="mt-2 text-[10px] font-mono bg-muted/30 p-3 rounded-lg text-left text-muted-foreground whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onRetry && (
            <Button variant="default" onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          <Button variant="outline" asChild className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
