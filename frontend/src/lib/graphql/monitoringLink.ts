import { ApolloLink, Operation, FetchResult, Observable } from "@apollo/client";
import { print } from "graphql/language/printer";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QueryTiming {
  operationName: string;
  operationType: "query" | "mutation" | "subscription";
  queryName: string;
  responseTimeMs: number;
  payloadSizeBytes: number;
  timestamp: string;
  slow: boolean;
  queryBody?: string;
}

type TimingCallback = (timing: QueryTiming) => void;

// ─── Configuration ─────────────────────────────────────────────────────────

interface MonitoringConfig {
  /** Log to console in development */
  devLogging?: boolean;
  /** Callback for each completed query (for production analytics) */
  onTiming?: TimingCallback;
  /** Slow query threshold in ms */
  slowThresholdMs?: number;
  /** Track only operations whose name matches these patterns */
  trackOperations?: RegExp[];
  /** Include query body in timing data (may contain PII) */
  includeQueryBody?: boolean;
  /** Batch interval for sending to analytics endpoint in ms */
  batchIntervalMs?: number;
  /** Analytics endpoint URL (optional) */
  analyticsEndpoint?: string;
}

const DEFAULT_CONFIG: Required<MonitoringConfig> = {
  devLogging: true,
  onTiming: () => {},
  slowThresholdMs: 1000,
  trackOperations: [/.*/], // track all by default
  includeQueryBody: false,
  batchIntervalMs: 30000,
  analyticsEndpoint: "",
};

// ─── Monitoring Link ───────────────────────────────────────────────────────

export function createMonitoringLink(config?: MonitoringConfig): ApolloLink {
  const cfg: Required<MonitoringConfig> = { ...DEFAULT_CONFIG, ...config };
  const batch: QueryTiming[] = [];
  let batchTimer: ReturnType<typeof setInterval> | null = null;

  // Batch sender
  if (cfg.analyticsEndpoint && typeof window !== "undefined") {
    batchTimer = setInterval(() => {
      if (batch.length === 0) return;
      const payload = [...batch];
      batch.length = 0;
      navigator.sendBeacon(cfg.analyticsEndpoint, JSON.stringify(payload));
    }, cfg.batchIntervalMs);
  }

  return new ApolloLink((operation, forward) => {
    if (!forward) return null;

    const operationName = operation.operationName || "anonymous";
    const operationType = (operation.query.definitions[0] as any)?.operation || "query";

    // Check if this operation should be tracked
    const shouldTrack = cfg.trackOperations.some((re) => re.test(operationName));
    if (!shouldTrack) {
      return forward(operation);
    }

    const startTime = performance.now();

    const observable = forward(operation);
    const originalSubscribe = observable.subscribe.bind(observable);

    // Create a new Observable that wraps the original to capture the response
    return new Observable<FetchResult>((observer) => {
      let responseSize = 0;
      let responseData: any = null;

      const subscription = originalSubscribe({
        next: (result: FetchResult) => {
          responseData = result;
          // Estimate payload size from JSON
          const json = JSON.stringify(result);
          responseSize = new TextEncoder().encode(json).length;
          observer.next?.(result);
        },
        error: (err: any) => {
          const endTime = performance.now();
          const timing = buildTiming(
            operationName,
            operationType,
            endTime - startTime,
            responseSize,
            cfg,
            operation
          );
          recordTiming(timing, cfg, batch);
          observer.error?.(err);
        },
        complete: () => {
          const endTime = performance.now();
          const timing = buildTiming(
            operationName,
            operationType,
            endTime - startTime,
            responseSize,
            cfg,
            operation
          );
          recordTiming(timing, cfg, batch);
          observer.complete?.();
        },
      });

      return () => {
        subscription.unsubscribe();
        if (batchTimer) clearInterval(batchTimer);
      };
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildTiming(
  operationName: string,
  operationType: string,
  responseTimeMs: number,
  payloadSizeBytes: number,
  cfg: Required<MonitoringConfig>,
  operation: Operation
): QueryTiming {
  return {
    operationName,
    operationType: operationType as "query" | "mutation" | "subscription",
    queryName: operationName,
    responseTimeMs: Math.round(responseTimeMs * 100) / 100,
    payloadSizeBytes,
    timestamp: new Date().toISOString(),
    slow: responseTimeMs > cfg.slowThresholdMs,
    ...(cfg.includeQueryBody ? { queryBody: print(operation.query) } : {}),
  };
}

function recordTiming(
  timing: QueryTiming,
  cfg: Required<MonitoringConfig>,
  batch: QueryTiming[]
): void {
  // Dev logging
  if (cfg.devLogging) {
    const icon = timing.slow ? "🐢" : "⚡";
    const color = timing.slow ? "\x1b[31m" : "\x1b[32m";
    const reset = "\x1b[0m";
    const sizeStr =
      timing.payloadSizeBytes > 1024
        ? (timing.payloadSizeBytes / 1024).toFixed(1) + " KB"
        : timing.payloadSizeBytes + " B";

    // Use console.group for structured output
    if (typeof window !== "undefined") {
      // Browser console
      console.log(
        `%c${icon} ${timing.operationName}`,
        `color: ${timing.slow ? "#ef4444" : "#22c55e"}; font-weight: bold`,
        `| ${timing.responseTimeMs}ms | ${sizeStr} | ${timing.operationType}`
      );
    } else {
      // Node/terminal console
      console.log(
        `${color}${icon} ${timing.operationName}${reset} | ${timing.responseTimeMs}ms | ${sizeStr} | ${timing.operationType}`
      );
    }

    // Show slow query warning
    if (timing.slow) {
      if (typeof window !== "undefined") {
        console.warn(`⚠️  Slow query: ${timing.operationName} took ${timing.responseTimeMs}ms`);
      } else {
        console.log(
          `\x1b[33m⚠️  Slow query: ${timing.operationName} took ${timing.responseTimeMs}ms\x1b[0m`
        );
      }
    }
  }

  // Callback
  cfg.onTiming(timing);

  // Batch for analytics endpoint
  batch.push(timing);
}

// ─── Utility: get all tracked timings ──────────────────────────────────────

let globalTimings: QueryTiming[] = [];

export function trackTimingGlobally(timing: QueryTiming): void {
  globalTimings.push(timing);
  // Keep only last 500 entries
  if (globalTimings.length > 500) {
    globalTimings = globalTimings.slice(-500);
  }
}

export function getGlobalTimings(): QueryTiming[] {
  return [...globalTimings];
}

export function clearGlobalTimings(): void {
  globalTimings = [];
}
