/**
 * 🔗 Integration Tests — Frontend Error Capture to Backend Submission
 *
 * Tests the complete flow from the frontend's perspective:
 *   1. Errors are captured via reportError() and ErrorCaptureLink
 *   2. The batcher queues and flushes errors as GraphQL mutations
 *   3. The mutation input matches the backend's ReportClientErrorInput schema
 *   4. Context is correctly serialized (JSON.stringify) for the GraphQL String type
 *
 * The batcher deliberately sends reports via plain `fetch` (POST to the GraphQL
 * endpoint) rather than apolloClient.mutate to avoid recursive error reporting
 * through the Apollo link chain. These tests stub global `fetch` and assert on
 * the request body sent to the backend.
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

// ─── Mock env (real env.ts reads window._env_ at module scope in DEV) ────────
vi.mock('@/lib/env', () => ({
  env: {
    API_URL: '',
    WS_URL: '',
    SUPABASE_URL: '',
    SUPABASE_PUBLISHABLE_KEY: '',
    PUSHER_KEY: '',
    PUSHER_CLUSTER: '',
    GOOGLE_CLIENT_ID: '',
    PEXELS_API_KEY: '',
    FREEPIK_API_KEY: '',
  },
  getApiBaseUrl: () => 'http://localhost:4000',
  getGraphqlUrl: () => '/graphql',
}));

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

/** Stub global fetch and return the mock. */
function mockFetch() {
  const mock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** Extract the `input` the batcher POSTs from the fetch call at a given index. */
function flushedInputAt(mock: ReturnType<typeof vi.fn>, index = 0) {
  const [, init] = mock.mock.calls[index];
  return JSON.parse(init.body).variables.input;
}

/** Extract the `input` the batcher POSTs from the first fetch call. */
function flushedInput(mock: ReturnType<typeof vi.fn>) {
  return flushedInputAt(mock, 0);
}

/** Extract the full parsed request body. */
function flushedBody(mock: ReturnType<typeof vi.fn>) {
  const [, init] = mock.mock.calls[0];
  return JSON.parse(init.body);
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
    vi.unstubAllGlobals();
  });

  // ─────────────────────────────────────────────────────────────────────
  // 1. reportError → GraphQL mutation input shape matches backend schema
  // ─────────────────────────────────────────────────────────────────────

  describe('reportError → mutation input matches ReportClientErrorInput schema', () => {
    it('sends a complete mutation with all optional fields filled', () => {
      const fetchMock = mockFetch();

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

      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Verify the request body matches what the backend expects
      const body = flushedBody(fetchMock);
      expect(body.query).toContain('ReportClientErrorInput');
      expect(body.query).toContain('reportClientError(input: $input)');

      const input = body.variables.input;
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
      const fetchMock = mockFetch();

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Field not found on type Query',
      });

      vi.advanceTimersByTime(5000);

      const input = flushedInput(fetchMock);
      expect(input.errorType).toBe('graphql');
      expect(input.message).toBe('Field not found on type Query');
      // Optional fields should be undefined (not serialized in the wire)
      expect(input.stack).toBeUndefined();
      expect(input.componentName).toBeUndefined();
      expect(input.operationName).toBeUndefined();
      expect(input.statusCode).toBeUndefined();
      expect(input.context).toBeUndefined();
    });

    it('supports all ten error types from the backend schema', async () => {
      const fetchMock = mockFetch();

      const errorTypes = [
        'graphql', 'network', 'runtime', 'payment', 'auth',
        'upload', 'meeting', 'render', 'timeout', 'unknown',
      ] as const;

      // The batcher only sends the first queued error per flush, so push and
      // flush one type at a time to verify every type is accepted. flush() is
      // async, so we must let its finally block run (resetting flushInProgress)
      // before pushing the next error — otherwise subsequent flushes early-return.
      for (const errorType of errorTypes) {
        errorCapture.reportError({ errorType, message: `Testing ${errorType}` });
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      }

      expect(fetchMock).toHaveBeenCalledTimes(errorTypes.length);
      for (let i = 0; i < errorTypes.length; i++) {
        const input = flushedInputAt(fetchMock, i);
        expect(input.errorType).toBe(errorTypes[i]);
        expect(input.message).toBe(`Testing ${errorTypes[i]}`);
      }
    });

    it('includes url and userAgent in context for every error type', () => {
      const fetchMock = mockFetch();

      // Use ErrorCaptureLink which automatically adds url + userAgent to context
      const forward = makeForward({
        next: { errors: [{ message: 'GraphQL error', extensions: {} }] },
      });

      const result = errorCapture.ErrorCaptureLink.request(makeOperation({ operationName: 'GetCourse' }), forward);
      result?.subscribe({ next: vi.fn(), error: vi.fn(), complete: vi.fn() });

      vi.advanceTimersByTime(5000);

      expect(fetchMock).toHaveBeenCalled();
      const input = flushedInput(fetchMock);
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
      const fetchMock = mockFetch();

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
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
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
      const fetchMock = mockFetch();

      const networkErr = new Error('Failed to fetch');
      networkErr.stack = 'Error: Failed to fetch\n    at fetch (api.ts:15)';
      (networkErr as any).statusCode = 0;

      const forward = makeForward({ error: networkErr, next: undefined });
      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };

      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.error).toHaveBeenCalledWith(networkErr);

      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
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
    // initErrorCapture registers listeners on the window at the module level.
    // Because beforeEach() re-imports a fresh module (new batcher singleton) while
    // listeners registered by earlier tests persist on window, dispatching an event
    // would fire handlers from MULTIPLE module instances and flush multiple batchers.
    // Capture + remove listeners between tests so events reach only the current module.
    const registeredListeners: Array<[string, EventListenerOrEventListenerObject]> = [];
    const originalAddEventListener = window.addEventListener.bind(window);
    let addEventListenerSpy: any;

    beforeEach(() => {
      addEventListenerSpy = vi
        .spyOn(window, 'addEventListener')
        .mockImplementation(((
          type: string,
          handler: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ) => {
          registeredListeners.push([type, handler]);
          return originalAddEventListener(type, handler, options);
        }) as any);
    });

    afterEach(() => {
      for (const [type, handler] of registeredListeners) {
        window.removeEventListener(type, handler);
      }
      registeredListeners.length = 0;
      addEventListenerSpy.mockRestore();
    });

    it('captures a runtime window error and sends the correct mutation input', () => {
      const fetchMock = mockFetch();
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

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const input = flushedInput(fetchMock);

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
      const fetchMock = mockFetch();
      errorCapture.initErrorCapture();

      // Swallow the rejection — we only test that the dispatched event is captured
      const rejection = Promise.reject(new Error('Network request failed'));
      rejection.catch(() => {});

      // PromiseRejectionEvent may not be available in all environments
      // (JSDOM < 16.7 doesn't support it). Gracefully skip if unavailable.
      if (typeof PromiseRejectionEvent === 'undefined') {
        // Fallback: dispatch a custom event with the rejection data
        const event = new CustomEvent('unhandledrejection', {
          detail: { reason: new Error('Network request failed') },
        });
        (event as any).reason = new Error('Network request failed');
        (event as any).promise = rejection;
        window.dispatchEvent(event);
      } else {
        const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
          reason: new Error('Network request failed'),
          promise: rejection,
        });
        window.dispatchEvent(rejectionEvent);
      }

      vi.advanceTimersByTime(5000);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const input = flushedInput(fetchMock);

      expect(input.errorType).toBe('runtime');
      expect(input.message).toContain('Network request failed');
      expect(input.stack).toContain('Network request failed');
    });

    it('batcher handles the fetch resolving successfully (no crash)', async () => {
      // This tests that the async flush doesn't throw when the fetch resolves
      const fetchMock = mockFetch();

      errorCapture.reportError({ errorType: 'graphql', message: 'Test error' });

      // Push to trigger max queue flush (10 items)
      for (let i = 0; i < 9; i++) {
        errorCapture.reportError({ errorType: 'graphql', message: `Error ${i}` });
      }

      // The flush is async — flush microtasks to let the finally block run
      await Promise.resolve();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      // Verify the batcher continues working after flush resolves
      expect(flushedInput(fetchMock).message).toBe('Test error');
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. Input validation: mutation string matches backend schema fields
  // ─────────────────────────────────────────────────────────────────────

  describe('mutation string matches backend ReportClientErrorInput schema', () => {
    it('sends the correct mutation string that matches backend typeDefs', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({ errorType: 'graphql', message: 'Schema test' });
      vi.advanceTimersByTime(5000);

      const body = flushedBody(fetchMock);
      const mutationString = body.query;

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
      const variables = body.variables;
      expect(variables).toHaveProperty('input');
      expect(Object.keys(variables.input)).toEqual(
        expect.arrayContaining(['errorType', 'message']),
      );
    });

    it('sends statusCode as a number (not string) matching backend Int type', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Server error',
        statusCode: 500,
      });

      vi.advanceTimersByTime(5000);

      const input = flushedInput(fetchMock);
      expect(input.statusCode).toBe(500);
      expect(typeof input.statusCode).toBe('number');
    });
  });
});
