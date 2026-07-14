/**
 * Unit tests for the Error Capture Service (errorCapture.ts)
 *
 * Tests ErrorCaptureLink (Apollo link), initErrorCapture (event listener setup),
 * reportError (manual reporting), and the batcher flush behaviour.
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
  });

  // ─────────────────────────────────────────────────────────────────────
  // ErrorCaptureLink
  // ─────────────────────────────────────────────────────────────────────

  describe('ErrorCaptureLink', () => {
    it('captures GraphQL errors from operation response', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

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
      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              errorType: 'graphql',
              message: 'Cannot query field',
              statusCode: 500,
            }),
          }),
        }),
      );
    });

    it('captures network errors from forward observable', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const networkErr = new Error('Failed to fetch');
      networkErr.stack = 'Error: Failed to fetch\n    at fetch (api.ts:42)';

      const forward = makeForward({ error: networkErr, next: undefined });
      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.error).toHaveBeenCalledWith(networkErr);

      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              errorType: 'network',
              message: 'Failed to fetch',
              stack: expect.stringContaining('api.ts'),
            }),
          }),
        }),
      );
    });

    it('passes through results without errors unchanged', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const cleanResult = { data: { users: [] } };
      const forward = makeForward({ next: cleanResult });
      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.next).toHaveBeenCalledWith(cleanResult);
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('returns null when forward is undefined', () => {
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), undefined);
      expect(result).toBeNull();
    });

    it('includes operation name in context', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const forward = makeForward({
        next: { errors: [{ message: 'Error' }] },
      });

      const operation = makeOperation({ operationName: 'GetUsers' });
      const result = errorCapture.ErrorCaptureLink.request(operation, forward);
      result?.subscribe({ next: vi.fn(), error: vi.fn(), complete: vi.fn() });

      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              operationName: 'GetUsers',
            }),
          }),
        }),
      );
    });

    it('captures stacktrace from error extensions', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

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
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              stack: expect.stringContaining('resolvers.ts:42'),
            }),
          }),
        }),
      );
    });

    it('handles result with empty errors array', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      const forward = makeForward({
        next: { errors: [], data: { ok: true } },
      });

      const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
      const result = errorCapture.ErrorCaptureLink.request(makeOperation(), forward);
      result?.subscribe(observer);

      expect(observer.next).toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(mockMutate).not.toHaveBeenCalled();
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
    it('queues error and flushes to apollo client after batch interval', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'payment',
        message: 'Payment declined',
        statusCode: 402,
        context: { transactionId: 'txn_123' },
      });

      // Should not have flushed yet (debounce timer not advanced)
      expect(mockMutate).not.toHaveBeenCalled();

      // Advance timers to trigger the flush
      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              errorType: 'payment',
              message: 'Payment declined',
              statusCode: 402,
            }),
          }),
        }),
      );
    });

    it('stringifies the context field before sending', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'runtime',
        message: 'Error',
        context: { url: 'https://example.com', userId: 'u1' },
      });

      vi.advanceTimersByTime(5000);
      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(typeof input.context).toBe('string');
      expect(JSON.parse(input.context)).toEqual({
        url: 'https://example.com',
        userId: 'u1',
      });
    });

    it('sets context to undefined when not provided', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({
        errorType: 'graphql',
        message: 'Simple error',
      });

      vi.advanceTimersByTime(5000);
      const input = mockMutate.mock.calls[0][0].variables.input;
      expect(input.context).toBeUndefined();
    });

    it('flushes immediately when queue reaches maxQueueSize (10)', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      // Push 10 errors
      for (let i = 0; i < 10; i++) {
        errorCapture.reportError({
          errorType: 'graphql',
          message: `Error ${i}`,
        });
      }

      // Should flush immediately at 10 items (no need to advance timer)
      expect(mockMutate).toHaveBeenCalledTimes(1);
      // First error should be the one sent
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({
              message: 'Error 0',
            }),
          }),
        }),
      );
    });

    it('batches multiple errors within the same interval', () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      errorCapture.reportError({ errorType: 'graphql', message: 'Error A' });
      errorCapture.reportError({ errorType: 'network', message: 'Error B' });
      errorCapture.reportError({ errorType: 'runtime', message: 'Error C' });

      // Only one flush should happen at the interval
      vi.advanceTimersByTime(5000);
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('flushes remaining errors after a flush completes', async () => {
      const mockMutate = vi.fn().mockResolvedValue({});
      errorCapture.setReportClient({ mutate: mockMutate });

      // Push 11 errors (flush at 10, 1 remains)
      for (let i = 0; i < 11; i++) {
        errorCapture.reportError({
          errorType: 'graphql',
          message: `Error ${i}`,
        });
      }

      // First flush at queue.size >= 10 — mockMutate called synchronously before await
      expect(mockMutate).toHaveBeenCalledTimes(1);

      // The first flush's finally block (which checks remaining queue and sets a
      // 1s retry timer) is pending on the microtask queue behind the await.
      // Flush microtasks to let it run, then advance the fake timer.
      await Promise.resolve();
      vi.advanceTimersByTime(1000);
      expect(mockMutate).toHaveBeenCalledTimes(2);
    });

    it('warns when apollo client is not set', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      errorCapture.reportError({ errorType: 'graphql', message: 'Orphan error' });
      vi.advanceTimersByTime(5000);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Apollo client not yet initialized'),
      );
      warnSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // setReportClient
  // ─────────────────────────────────────────────────────────────────────

  describe('setReportClient', () => {
    it('stores the client reference for batcher usage', () => {
      const mockClient = { mutate: vi.fn().mockResolvedValue({}) };
      errorCapture.setReportClient(mockClient);

      errorCapture.reportError({ errorType: 'graphql', message: 'Test' });
      vi.advanceTimersByTime(5000);

      expect(mockClient.mutate).toHaveBeenCalled();
    });
  });
});
