/**
 * Unit tests for the Error Capture Service (errorCapture.ts)
 *
 * Tests ErrorCaptureLink (Apollo link), initErrorCapture (event listener setup),
 * reportError (manual reporting), and the batcher flush behaviour.
 *
 * NOTE: The batcher deliberately flushes via plain `fetch` (POST to the GraphQL
 * endpoint) rather than apolloClient.mutate to avoid recursive error reporting
 * through the Apollo link chain. These tests stub the global `fetch` and assert
 * on the request body that the batcher sends.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock Apollo Client ─────────────────────────────────────────────────────
// We avoid loading the real @apollo/client (heavy) by mocking it.
// The mock provides minimal ApolloLink and Observable implementations.
vi.mock('@apollo/client', () => {
  class MockObservable {
    private executor: any;
    constructor(executor: any) {
      this.executor = executor;
    }
    subscribe(observer: any) {
      const maybeTeardown = this.executor(observer);
      return {
        unsubscribe:
          typeof maybeTeardown === 'function'
            ? maybeTeardown
            : vi.fn(),
      };
    }
  }

  return {
    ApolloLink: vi.fn().mockImplementation(
      (requestHandler: any) => ({
        request: requestHandler,
      }),
    ),
    Observable: MockObservable,
    FetchResult: {},
  };
});

// ─── Mock env ───────────────────────────────────────────────────────────────
// The real env.ts reads window._env_ at module scope in DEV, which breaks the
// SSR test that removes `window`. Provide a stable mock instead.
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

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════

function makeForward(behaviour: {
  next?: any;
  error?: any;
  complete?: boolean;
}) {
  return vi.fn().mockReturnValue({
    subscribe: (observer: any) => {
      if (behaviour.next) observer.next(behaviour.next);
      if (behaviour.error) observer.error(behaviour.error);
      if (behaviour.complete !== false) observer.complete();
      return { unsubscribe: vi.fn() };
    },
  });
}

function makeOperation(overrides: any = {}) {
  return {
    operationName: 'TestQuery',
    getContext: vi.fn().mockReturnValue({}),
    query: { kind: 'Document', definitions: [] },
    variables: {},
    extensions: {},
    setContext: vi.fn(),
    ...overrides,
  };
}

/** Stub the global fetch and return the mock. */
function mockFetch() {
  const mock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', mock);
  return mock;
}

/** Extract the `input` the batcher would POST from the fetch call. */
function flushedInput(mock: ReturnType<typeof vi.fn>) {
  const [, init] = mock.mock.calls[0];
  return JSON.parse(init.body).variables.input;
}

/** Extract the full parsed request body. */
function flushedBody(mock: ReturnType<typeof vi.fn>) {
  const [, init] = mock.mock.calls[0];
  return JSON.parse(init.body);
}

// ═════════════════════════════════════════════════════════════════════════════
// Suite
// ═════════════════════════════════════════════════════════════════════════════

describe('errorCapture', () => {
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
  // ErrorCaptureLink
  // ─────────────────────────────────────────────────────────────────────

  describe('ErrorCaptureLink', () => {
    it('captures GraphQL errors from operation response', () => {
      const fetchMock = mockFetch();

      const forward = makeForward({
        next: {
          errors: [
            { message: 'Cannot query field', extensions: { code: 'INTERNAL_SERVER_ERROR' } },
          ],
        },
      });

      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      // Response should be forwarded to observer
      expect(observer.next).toHaveBeenCalled();
      expect(observer.complete).toHaveBeenCalled();

      // Batcher should have queued the error — advance timer to flush
      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
      expect(input.errorType).toBe('graphql');
      expect(input.message).toBe('Cannot query field');
      expect(input.statusCode).toBe(500);
    });

    it('captures network errors from forward observable', () => {
      const fetchMock = mockFetch();

      const networkErr = new Error('Failed to fetch');
      networkErr.stack = 'Error: Failed to fetch\n    at fetch (api.ts:42)';

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
      expect(input.stack).toContain('api.ts');
    });

    it('passes through results without errors unchanged', () => {
      const fetchMock = mockFetch();

      const cleanResult = { data: { users: [] } };
      const forward = makeForward({ next: cleanResult });
      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.next).toHaveBeenCalledWith(cleanResult);
      vi.advanceTimersByTime(5000);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns null when forward is undefined', () => {
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), undefined);
      expect(result).toBeNull();
    });

    it('includes operation name in context', () => {
      const fetchMock = mockFetch();

      const forward = makeForward({
        next: { errors: [{ message: 'Error' }] },
      });

      const operation = makeOperation({ operationName: 'GetUsers' });
      const result = errorCapture.ErrorCaptureLink.request(operation, forward);
      result?.subscribe({ next: vi.fn(), error: vi.fn(), complete: vi.fn() });

      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
      expect(input.operationName).toBe('GetUsers');
      expect(JSON.parse(input.context).operationName).toBe('GetUsers');
    });

    it('captures stacktrace from error extensions', () => {
      const fetchMock = mockFetch();

      const forward = makeForward({
        next: {
          errors: [
            {
              message: 'Internal error',
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                stacktrace: ['Error: Internal error', '    at resolver (resolvers.ts:42)'],
              },
            },
          ],
        },
      });

      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe({ next: vi.fn(), error: vi.fn(), complete: vi.fn() });

      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
      expect(input.stack).toContain('resolvers.ts:42');
    });

    it('handles result with empty errors array', () => {
      const fetchMock = mockFetch();

      const forward = makeForward({
        next: { errors: [], data: { ok: true } },
      });

      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.next).toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // initErrorCapture
  // ─────────────────────────────────────────────────────────────────────

  describe('initErrorCapture', () => {
    let addEventListenerSpy: any;

    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    });

    afterEach(() => {
      addEventListenerSpy.mockRestore();
    });

    it('registers window error and unhandledrejection listeners by default', () => {
      errorCapture.initErrorCapture();
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      );
    });

    it('does not register listeners when enabled is false', () => {
      errorCapture.initErrorCapture({ enabled: false });
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });

    it('respects captureRuntimeErrors: false', () => {
      errorCapture.initErrorCapture({ captureRuntimeErrors: false });
      expect(addEventListenerSpy).not.toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      );
    });

    it('respects capturePromiseRejections: false', () => {
      errorCapture.initErrorCapture({ capturePromiseRejections: false });
      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      );
    });

    it('does nothing when window is undefined (SSR safe)', async () => {
      // Simulate SSR: temporarily remove window
      const origWindow = (globalThis as any).window;
      delete (globalThis as any).window;
      try {
        // Need a fresh module because initErrorCapture checks at call time
        vi.resetModules();
        const mod = await import('@/lib/errorCapture');
        // Should not throw
        expect(() => mod.initErrorCapture()).not.toThrow();
      } finally {
        (globalThis as any).window = origWindow;
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // reportError (manual reporting)
  // ─────────────────────────────────────────────────────────────────────

  describe('reportError', () => {
    it('queues error and flushes to the backend after batch interval', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({
        errorType: 'payment',
        message: 'Payment declined',
        statusCode: 402,
        context: { transactionId: 'txn_123' },
      });

      // Should not have flushed yet (debounce timer not advanced)
      expect(fetchMock).not.toHaveBeenCalled();

      // Advance timers to trigger the flush
      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const input = flushedInput(fetchMock);
      expect(input.errorType).toBe('payment');
      expect(input.message).toBe('Payment declined');
      expect(input.statusCode).toBe(402);
    });

    it('stringifies the context field before sending', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({
        errorType: 'runtime',
        message: 'Error',
        context: { url: 'https://example.com', userId: 'u1' },
      });

      vi.advanceTimersByTime(5000);
      const input = flushedInput(fetchMock);
      expect(typeof input.context).toBe('string');
      expect(JSON.parse(input.context)).toEqual({
        url: 'https://example.com',
        userId: 'u1',
      });
    });

    it('sets context to undefined when not provided', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Simple error',
      });

      vi.advanceTimersByTime(5000);
      const input = flushedInput(fetchMock);
      expect(input.context).toBeUndefined();
    });

    it('flushes immediately when queue reaches maxQueueSize (10)', () => {
      const fetchMock = mockFetch();

      // Push 10 errors
      for (let i = 0; i < 10; i++) {
        errorCapture.reportError({
          errorType: 'graphql',
          message: `Error ${i}`,
        });
      }

      // Should flush immediately at 10 items (no need to advance timer)
      expect(fetchMock).toHaveBeenCalledTimes(1);
      // First error should be the one sent
      const input = flushedInput(fetchMock);
      expect(input.message).toBe('Error 0');
    });

    it('batches multiple errors within the same interval', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({ errorType: 'graphql', message: 'Error A' });
      errorCapture.reportError({ errorType: 'network', message: 'Error B' });
      errorCapture.reportError({ errorType: 'runtime', message: 'Error C' });

      // Only one flush should happen at the interval
      vi.advanceTimersByTime(5000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('flushes remaining errors after a flush completes', async () => {
      const fetchMock = mockFetch();

      // Push 11 errors (flush at 10, 1 remains)
      for (let i = 0; i < 11; i++) {
        errorCapture.reportError({
          errorType: 'graphql',
          message: `Error ${i}`,
        });
      }

      // First flush at queue.size >= 10 — fetch called synchronously before await
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // The first flush's finally block (which checks remaining queue and sets a
      // 1s retry timer) is pending on the microtask queue behind the await.
      // Flush microtasks to let it run, then advance the fake timer.
      await Promise.resolve();
      vi.advanceTimersByTime(1000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('flushes to the default /graphql endpoint when no API URL is configured', () => {
      const fetchMock = mockFetch();

      errorCapture.reportError({ errorType: 'graphql', message: 'Orphan error' });
      vi.advanceTimersByTime(5000);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/graphql');
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // setReportClient
  // ─────────────────────────────────────────────────────────────────────

  describe('setReportClient', () => {
    it('accepts a client reference without affecting fetch-based reporting', () => {
      const fetchMock = mockFetch();
      const mockClient = { mutate: vi.fn().mockResolvedValue({}) };
      errorCapture.setReportClient(mockClient);

      errorCapture.reportError({ errorType: 'graphql', message: 'Test' });
      vi.advanceTimersByTime(5000);

      // The batcher flushes via fetch, not client.mutate
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockClient.mutate).not.toHaveBeenCalled();

      const body = flushedBody(fetchMock);
      expect(body.query).toContain('ReportClientError');
      expect(body.variables.input.message).toBe('Test');
    });
  });
});
