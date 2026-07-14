/**
 * Error Capture Service
 * 
 * Automatically captures frontend errors (GraphQL errors, runtime errors,
 * unhandled rejections) and reports them to the backend for super admin visibility.
 * 
 * Usage:
 *   import { ErrorCaptureLink, initErrorCapture, setReportClient } from '@/lib/errorCapture';
 *   import client from './apolloClient';
 *   
 *   // In main.tsx, AFTER creating the client:
 *   setReportClient(client);
 *   initErrorCapture();
 *   
 *   // Apollo client link chain (no circular dep because ErrorCaptureLink
 *   // only uses Apollo types, not the client instance):
 *   link: ApolloLink.from([ErrorCaptureLink, ...])
 */

import { ApolloLink, Observable, FetchResult } from '@apollo/client';
import { env } from './env';

// ─── Config ──────────────────────────────────────────────────────────────────

interface ErrorCaptureConfig {
  /** Enable/disable error capture */
  enabled?: boolean;
  /** Report GraphQL errors */
  captureGraphQLErrors?: boolean;
  /** Report unhandled runtime errors */
  captureRuntimeErrors?: boolean;
  /** Report unhandled promise rejections */
  capturePromiseRejections?: boolean;
  /** Report network errors */
  captureNetworkErrors?: boolean;
  /** Debounce interval in ms for batching reports */
  batchInterval?: number;
  /** Max queued errors before flush */
  maxQueueSize?: number;
  /** Sample rate (0-1). 1 = report all errors */
  sampleRate?: number;
}

const DEFAULT_CONFIG: Required<ErrorCaptureConfig> = {
  enabled: true,
  captureGraphQLErrors: true,
  captureRuntimeErrors: true,
  capturePromiseRejections: true,
  captureNetworkErrors: true,
  batchInterval: 5000,
  maxQueueSize: 10,
  sampleRate: 1,
};

// ─── Client Injection (avoids circular dependency) ──────────────────────────

let apolloClient: any = null;

/**
 * Call this AFTER creating the Apollo client to give the error batcher
 * a way to send error reports to the backend. This avoids a circular
 * import between errorCapture.ts and apolloClient.ts.
 */
export function setReportClient(client: any) {
  apolloClient = client;
}

// ─── Batcher ─────────────────────────────────────────────────────────────────

class ErrorBatcher {
  private queue: Array<{
    errorType: string;
    message: string;
    stack?: string;
    componentName?: string;
    operationName?: string;
    statusCode?: number;
    context?: Record<string, any>;
  }> = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<ErrorCaptureConfig>;
  private flushInProgress = false;

  constructor(config: Required<ErrorCaptureConfig>) {
    this.config = config;
  }

  push(error: typeof this.queue[0]) {
    if (!this.config.enabled) return;
    if (Math.random() > this.config.sampleRate) return;

    this.queue.push(error);

    if (this.queue.length >= this.config.maxQueueSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.config.batchInterval);
    }
  }

  private async flush() {
    if (this.flushInProgress || this.queue.length === 0) return;
    this.flushInProgress = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.config.maxQueueSize);

      try {
        // Send only the first error to avoid overwhelming the backend
        const error = batch[0];
        const input = {
          ...error,
          context: error.context ? JSON.stringify(error.context) : undefined,
        };

        // Use plain fetch to avoid passing through Apollo links (and thus avoid
        // potential recursive error reporting if the Apollo link chain fails).
        const apiUrl = (env && env.API_URL) || '/graphql';
        const token = typeof window !== 'undefined' ? localStorage.getItem('ihub_token') : null;

        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            query: `mutation ReportClientError($input: ReportClientErrorInput!) { reportClientError(input: $input) }`,
            variables: { input },
          }),
        });
    } catch {
      // Silently ignore — we don't want error reporting itself to cause errors
    } finally {
      this.flushInProgress = false;
      if (this.queue.length > 0) {
        this.timer = setTimeout(() => this.flush(), 1000);
      }
    }
  }
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

let batcherInstance: ErrorBatcher | null = null;

function getBatcher(config?: Partial<ErrorCaptureConfig>): ErrorBatcher {
  if (!batcherInstance) {
    const cfg: Required<ErrorCaptureConfig> = { ...DEFAULT_CONFIG, ...config };
    batcherInstance = new ErrorBatcher(cfg);
  }
  return batcherInstance;
}

// ─── Apollo Link for GraphQL Error Capture ───────────────────────────────────

export const ErrorCaptureLink = new ApolloLink((operation, forward) => {
  if (!forward) return null;

  return new Observable<FetchResult>((observer) => {
    const subscription = forward(operation).subscribe({
      next: (result) => {
        if (result.errors && result.errors.length > 0) {
          const error = result.errors[0];
          const batcher = getBatcher();
          batcher.push({
            errorType: 'graphql',
            message: error.message || 'Unknown GraphQL error',
            stack: (error.extensions?.stacktrace as string[])?.join('\n') || undefined,
            operationName: operation.operationName || undefined,
            statusCode: error.extensions?.code === 'INTERNAL_SERVER_ERROR' ? 500 : 400,
            context: {
              url: typeof window !== 'undefined' ? window.location.href : '',
              operationName: operation.operationName,
              errorCode: error.extensions?.code,
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            },
          });
        }
        observer.next?.(result);
      },
      error: (err) => {
        const batcher = getBatcher();
        batcher.push({
          errorType: 'network',
          message: err.message || 'Network error',
          stack: err.stack,
          operationName: operation.operationName || undefined,
          statusCode: err.statusCode || 0,
          context: {
            url: typeof window !== 'undefined' ? window.location.href : '',
            operationName: operation.operationName,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          },
        });
        observer.error?.(err);
      },
      complete: () => {
        observer.complete?.();
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  });
});

// ─── Runtime Error Handler ───────────────────────────────────────────────────

function handleRuntimeError(event: ErrorEvent) {
  const batcher = getBatcher();
  batcher.push({
    errorType: 'runtime',
    message: event.message || 'Unknown runtime error',
    stack: event.error?.stack,
    statusCode: 0,
    context: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
  });
}

// ─── Unhandled Promise Rejection Handler ────────────────────────────────────

function handlePromiseRejection(event: PromiseRejectionEvent) {
  const batcher = getBatcher();
  const reason = event.reason;
  batcher.push({
    errorType: 'runtime',
    message: reason?.message || reason?.toString() || 'Unhandled promise rejection',
    stack: reason?.stack,
    statusCode: 0,
    context: {
      url: typeof window !== 'undefined' ? window.location.href : '',
      type: 'unhandledrejection',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
  });
}

// ─── Init Function ───────────────────────────────────────────────────────────

export function initErrorCapture(config?: Partial<ErrorCaptureConfig>) {
  if (typeof window === 'undefined') return;

  const cfg: Required<ErrorCaptureConfig> = { ...DEFAULT_CONFIG, ...config };
  if (!cfg.enabled) return;

  getBatcher(cfg);

  if (cfg.captureRuntimeErrors) {
    window.addEventListener('error', handleRuntimeError);
  }

  if (cfg.capturePromiseRejections) {
    window.addEventListener('unhandledrejection', handlePromiseRejection);
  }
}

// ─── React Error Boundary for Component Errors ──────────────────────────────

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorCaptureBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const batcher = getBatcher();
    batcher.push({
      errorType: 'runtime',
      message: error.message || 'React component error',
      stack: error.stack,
      componentName: this.props.componentName,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        componentStack: errorInfo.componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// ─── Manual Error Reporting ──────────────────────────────────────────────────

export function reportError(error: {
  errorType: 'graphql' | 'network' | 'runtime' | 'payment' | 'auth' | 'upload' | 'meeting' | 'render' | 'timeout' | 'unknown';
  message: string;
  stack?: string;
  componentName?: string;
  operationName?: string;
  statusCode?: number;
  context?: Record<string, any>;
}) {
  const batcher = getBatcher();
  batcher.push(error);
}
