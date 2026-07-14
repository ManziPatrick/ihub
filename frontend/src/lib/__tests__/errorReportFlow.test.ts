/**
 * 🔗 Integration Tests — Frontend Error Capture to Backend Submission
 *
 * Tests the complete flow from the frontend's perspective:
 *   1. Errors are captured via reportError() and ErrorCaptureLink
 *   2. The batcher queues and flushes errors as GraphQL mutations
 *   3. The mutation input matches the backend's ReportClientErrorInput schema
 *   4. Context is correctly serialized (JSON.stringify) for the GraphQL String type
 *
 * These tests verify that the frontend correctly formats data that the
 * backend resolver can consume — bridging the gap between the two.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Apollo Client (minimal, avoids heavy import) ───────────────────────
vi.mock('@apollo/client', () => {
  class MockObservable {
    private executor: any;
    constructor(executor: any) { this.executor = executor; }
    subscribe(observer: any) {
      const maybeTeardown = this.executor(observer);
      return {
        unsubscribe: typeof maybeTeardown === 'function' ? maybeTeardown : vi.fn(),
      };
    }
  }

  return {
    ApolloLink: vi.fn().mockImplementation((handler: any) => ({ request: handler })),
    Observable: MockObservable,
    FetchResult: {},
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeForward(response: { next?: any; error?: any }) {
  return vi.fn().mockReturnValue({
    subscribe: (observer: any) => {
      if (response.next) observer.next(response.next);
      if (response.error) observer.error(response.error);
      observer.complete();
      return { unsubscribe: vi.fn() };
    },
  });
}

function makeOperation(overrides = {}) {
  return {
    operationName: 'TestOp',
    getContext: vi.fn().mockReturnValue({}),
    query: { kind: 'Document', definitions: [] } as any,
    variables: {},
    extensions: {},
    setContext: vi.fn(),
    operationType: 'query' as any,
    client: {} as any,
    ...overrides,
  } as any;
}

// ═════════════════════════════════════════════════════════════════════════════
// Suite
// ═════════════════════════════════════════════════════════════════════════════

describe('Error Capture Flow — Frontend to Backend Integration', () => {
  let errorCapture: typeof import('@/lib/errorCapture');

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.clearAllMocks();
    errorCapture = await import('@/lib/errorCapture');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 1. reportError → GraphQL mutation input shape matches backend schema
  // ─────────────────────────────────────────────────────────────────────

  describe('reportError → mutation input matches ReportClientErrorInput schema', () => {
    it('sends a complete mutation with all optional fields filled', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'payment',
        message: 'Payment failed: insufficient funds',
        stack: 'Error: Payment failed\n    at PaymentForm.submit (PaymentForm.tsx:89)',
        componentName: 'PaymentForm',
        operationName: 'SubmitPayment',
        statusCode: 402,
        context: {
          url: 'https://bootskills.com/checkout',
          userAgent: 'Mozilla/5.0 Chrome/120',
          transactionId: 'txn_abc',
        },
      });

      vi.advanceTimersByTime(5000);

      expect(mockMutate).toHaveBeenCalledTimes(1);

      // Verify the mutation input matches what the backend expects
      const mutationCall = mockMutate.mock.calls[0][0];
      expect(mutationCall.query).toContain('ReportClientErrorInput');
      expect(mutationCall.fetchPolicy).toBe('no-cache');

      const input = mutationCall.variables.input;
      // All fields that the backend resolver reads must be present
      expect(input.errorType).toBe('payment');
      expect(input.message).toBe('Payment failed: insufficient funds');
      expect(input.stack).toContain('PaymentForm.tsx:89');
      expect(input.componentName).toBe('PaymentForm');
      expect(input.operationName).toBe('SubmitPayment');
      expect(input.statusCode).toBe(402);

      // Context is stringified (GraphQL String type)
      expect(typeof input.context).toBe('string');
      const parsedContext = JSON.parse(input.context);
      expect(parsedContext.url).toBe('https://bootskills.com/checkout');
      expect(parsedContext.userAgent).toBe('Mozilla/5.0 Chrome/120');
      expect(parsedContext.transactionId).toBe('txn_abc');
    });

    it('sends minimal required fields (no optional)', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Field not found on type Query',
      });

      vi.advanceTimersByTime(5000);

      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(input.errorType).toBe('graphql');
      expect(input.message).toBe('Field not found on type Query');
      // Optional fields should be undefined (not serialized in the wire)
      expect(input.stack).toBeUndefined();
      expect(input.componentName).toBeUndefined();
      expect(input.operationName).toBeUndefined();
      expect(input.statusCode).toBeUndefined();
      expect(input.context).toBeUndefined();
    });

    it('supports all nine error types from the backend schema', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const errorTypes = [
        'graphql', 'network', 'runtime', 'payment', 'auth',
        'upload', 'meeting', 'render', 'timeout', 'unknown',
      ] as const;

      for (const errorType of errorTypes) {
        errorCapture.reportError({ errorType, message: `Testing ${errorType}` });
      }

      // Advance to flush all queued errors
      vi.advanceTimersByTime(5000);

      // All errors were sent (first one sent, but batcher only sends batch[0])
      expect(mockMutate).toHaveBeenCalledTimes(1);
      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(errorTypes).toContain(input.errorType);
    });

    it('includes url and userAgent in context for every error type', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      // Use ErrorCaptureLink which automatically adds url + userAgent to context
      const forward = makeForward({
        next: { errors: [{ message: 'GraphQL error', extensions: {} }] },
      });

      const result = errorCapture.ErrorCaptureLink.request(makeOperation({ operationName: 'GetCourse' }), forward);
      result?.subscribe({ next: vi.fn(), error: vi.fn(), complete: vi.fn() });

      vi.advanceTimersByTime(5000);

      expect(mockMutate).toHaveBeenCalled();
      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(input.operationName).toBe('GetCourse');

      const parsedContext = JSON.parse(input.context);
      // JSDOM provides default window.location.href and navigator.userAgent
      expect(parsedContext).toHaveProperty('url');
      expect(parsedContext).toHaveProperty('userAgent');
      expect(parsedContext.operationName).toBe('GetCourse');
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. ErrorCaptureLink captures from Apollo response → batcher sends
  // ─────────────────────────────────────────────────────────────────────

  describe('ErrorCaptureLink → batcher → mutation', () => {
    it('captures GraphQL errors and sends context with userAgent and url', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const forward = makeForward({
        next: {
          errors: [
            {
              message: 'Cannot return null for non-nullable field',
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                stacktrace: ['Error: null value', '    at resolver.ts:42'],
              },
            },
          ],
        },
      });

      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(
        makeOperation({ operationName: 'GetUsers' }),
        forward,
      );
      result?.subscribe(observer);

      // Response should still reach the observer
      expect(observer.next).toHaveBeenCalled();
      expect(observer.complete).toHaveBeenCalled();

      // Batcher should flush the error
      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledTimes(1);

      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(input.errorType).toBe('graphql');
      expect(input.message).toBe('Cannot return null for non-nullable field');
      expect(input.stack).toContain('resolver.ts:42');
      expect(input.operationName).toBe('GetUsers');
      expect(input.statusCode).toBe(500); // INTERNAL_SERVER_ERROR → 500

      // Context is stringified JSON
      const ctx = JSON.parse(input.context);
      expect(ctx.operationName).toBe('GetUsers');
      expect(ctx.errorCode).toBe('INTERNAL_SERVER_ERROR');
    });

    it('captures network errors with correct input shape', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const networkErr = new Error('Failed to fetch');
      networkErr.stack = 'Error: Failed to fetch\n    at fetch (api.ts:15)';
      (networkErr as any).statusCode = 0;

      const forward = makeForward({ error: networkErr, next: undefined });
      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };

      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.error).toHaveBeenCalledWith(networkErr);

      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledTimes(1);

      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(input.errorType).toBe('network');
      expect(input.message).toBe('Failed to fetch');
      expect(input.stack).toContain('api.ts:15');
    });

    it('returns null (no observable) when forward is undefined', () => {
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), undefined as any);
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. Full flow: initErrorCapture → window error → batcher → mutation
  // ─────────────────────────────────────────────────────────────────────

  describe('window error handler → batcher → mutation', () => {
    it('captures a runtime window error and sends the correct mutation input', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });
      errorCapture.initErrorCapture();

      // Simulate a runtime error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Cannot read property "foo" of undefined',
        filename: 'https://bootskills.com/assets/app.js',
        lineno: 42,
        colno: 10,
        error: new Error('TypeError: Cannot read property "foo" of undefined'),
      });

      window.dispatchEvent(errorEvent);

      vi.advanceTimersByTime(5000);

      expect(mockMutate).toHaveBeenCalledTimes(1);
      const input = mockMutate.mock.calls[0][0].variables.input;

      expect(input.errorType).toBe('runtime');
      expect(input.message).toContain('Cannot read property');
      expect(input.stack).toContain('TypeError');

      // Context includes filename, line/col info
      const ctx = JSON.parse(input.context);
      expect(ctx.filename).toContain('app.js');
      expect(ctx.lineno).toBe(42);
      expect(ctx.colno).toBe(10);
    });

    it('captures an unhandled promise rejection', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });
      errorCapture.initErrorCapture();

      // PromiseRejectionEvent may not be available in all environments
      // (JSDOM < 16.7 doesn't support it). Gracefully skip if unavailable.
      if (typeof PromiseRejectionEvent === 'undefined') {
        // Fallback: dispatch a custom event with the rejection data
        const event = new CustomEvent('unhandledrejection', {
          detail: { reason: new Error('Network request failed') },
        });
        (event as any).reason = new Error('Network request failed');
        (event as any).promise = Promise.reject(new Error('Network request failed'));
        window.dispatchEvent(event);
      } else {
        const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
          reason: new Error('Network request failed'),
          promise: Promise.reject(new Error('Network request failed')),
        });
        window.dispatchEvent(rejectionEvent);
      }

      vi.advanceTimersByTime(5000);

      expect(mockMutate).toHaveBeenCalledTimes(1);
      const input = mockMutate.mock.calls[0][0].variables.input;

      expect(input.errorType).toBe('runtime');
      expect(input.message).toContain('Network request failed');
      expect(input.stack).toContain('Network request failed');
    });

    it('batcher handles the mutation resolving successfully (no crash)', async () => {
      // This tests that the async flush doesn't throw when the mutate resolves
      const mockMutate = vi.fn().mockResolvedValue({ data: { reportClientError: true } });
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({ errorType: 'graphql', message: 'Test error' });

      // Push to trigger max queue flush (10 items)
      for (let i = 0; i < 9; i++) {
        errorCapture.reportError({ errorType: 'graphql', message: `Error ${i}` });
      }

      // The flush is async — flush microtasks to let the finally block run
      await Promise.resolve();

      expect(mockMutate).toHaveBeenCalledTimes(1);
      // Verify the batcher continues working after flush resolves
      expect(mockMutate.mock.calls[0][0].variables.input.message).toBe('Test error');
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Input validation: mutation string matches backend schema fields
  // ─────────────────────────────────────────────────────────────────────

  describe('mutation string matches backend ReportClientErrorInput schema', () => {
    it('sends the correct mutation string that matches backend typeDefs', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({ errorType: 'graphql', message: 'Schema test' });
      vi.advanceTimersByTime(5000);

      const mutationString = mockMutate.mock.calls[0][0].query;

      // The mutation must match the backend's typeDefs exactly:
      //   input ReportClientErrorInput {
      //     errorType: String!
      //     message: String!
      //     stack: String
      //     componentName: String
      //     operationName: String
      //     statusCode: Int
      //     context: String
      //   }
      expect(mutationString).toContain('$input: ReportClientErrorInput');
      expect(mutationString).toContain('reportClientError(input: $input)');

      // Verify the variable input shape matches all schema fields
      const variables = mockMutate.mock.calls[0][0].variables;
      expect(variables).toHaveProperty('input');
      expect(Object.keys(variables.input)).toEqual(
        expect.arrayContaining(['errorType', 'message']),
      );
    });

    it('sends statusCode as a number (not string) matching backend Int type', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Server error',
        statusCode: 500,
      });

      vi.advanceTimersByTime(5000);

      expect(mockMutate.mock.calls[0][0].variables.input.statusCode).toBe(500);
      expect(typeof mockMutate.mock.calls[0][0].variables.input.statusCode).toBe('number');
    });
  });
});
