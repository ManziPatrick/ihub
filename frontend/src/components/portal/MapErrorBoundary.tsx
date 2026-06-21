import { Component, type ReactNode, type ErrorInfo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("[MapErrorBoundary] Caught map rendering error:", error.message);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-border/50 overflow-hidden">
          <div className="h-[400px] flex items-center justify-center bg-gradient-to-br from-accent/5 via-transparent to-background">
            <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Map unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The map component encountered a rendering issue. This is usually a browser or library compatibility problem.
                </p>
                {this.state.error && (
                  <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                    {this.state.error.message}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={this.handleRetry} className="mt-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
