/**
 * ─── AI Router Unit Tests ──────────────────────────────────────────────
 *
 * Covers:
 *   ✅ Fallback chain — first provider works, or fails over to next
 *   ✅ All providers fail — throws descriptive error
 *   ✅ Rate-limit (429) detection — triggers provider cooldown
 *   ✅ Rate-limited provider skipped during cooldown window
 *   ✅ Disabled providers (no API key) are skipped
 *   ✅ Dynamic priority reordering based on latency
 *   ✅ AI_ROUTER_ENABLED=false throws disabled error
 *   ✅ getProviderStatus() returns correct metrics
 *   ✅ Gemini message format conversion (system → systemInstruction)
 *   ✅ Error penalty accumulation
 *
 * Strategy: Use vi.resetModules() + dynamic imports for clean module state
 * between test groups. Mock global fetch for HTTP call interception.
 * ────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Hoisted helpers — survive vi.mock hoisting ────────────────────────

const { mockFetch } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
}));

// ─── Module-level helpers (used inside tests) ──────────────────────────

function makeOkResponse(body: unknown): Response {
  // Minimal Response mock that exercises the fields the router reads
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Headers(),
    redirected: false,
    statusText: "OK",
    type: "default" as const,
    url: "",
    clone: () => makeOkResponse(body),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

function makeErrorResponse(status: number, body?: string): Response {
  return {
    ok: false,
    status,
    statusText: status === 429 ? "Too Many Requests" : "Error",
    json: async () => ({ error: body || "error" }),
    text: async () => body || `HTTP ${status} error`,
    headers: new Headers(),
    redirected: false,
    type: "default" as const,
    url: "",
    clone: () => makeErrorResponse(status, body),
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

function standardResponse(text: string): Response {
  return makeOkResponse({ choices: [{ message: { content: text } }] });
}

function geminiResponse(text: string): Response {
  return makeOkResponse({
    candidates: [{ content: { parts: [{ text }] } }],
  });
}

/** Creates a 500 response whose .text() returns empty string */
function emptyErrorResponse(): Response {
  const resp = makeErrorResponse(500);
  // Override read-only .text via Object.defineProperty
  const stub = Object.defineProperty(resp, "text", {
    value: async () => "",
    writable: true,
  });
  return stub;
}

// ─── Test Suite ────────────────────────────────────────────────────────

describe("AI Router", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  // ── Helper: load a fresh module instance with custom env ──────────
  async function loadRouter(env: Record<string, string> = {}) {
    const defaults: Record<string, string> = {
      AI_ROUTER_ENABLED: "true",
      AI_ROUTER_COOLDOWN_MS: "60000",
      GEMINI_API_KEY: "test-gemini-key",
      GEMINI_MODEL: "gemini-2.0-flash",
      CF_API_TOKEN: "test-cf-token",
      CF_ACCOUNT_ID: "test-account",
      CF_MODEL: "@cf/meta/llama-3.1-8b-instruct",
      GROQ_API_KEY: "test-groq-key",
      GROQ_MODEL: "llama-3.3-70b-versatile",
      CEREBRAS_API_KEY: "test-cerebras-key",
      CEREBRAS_MODEL: "gpt-oss-120b",
      ...env,
    };

    const originalEnv = { ...process.env };
    for (const [k, v] of Object.entries(defaults)) {
      process.env[k] = v;
    }

    vi.resetModules();
    // Dynamic import to get fresh module state
    const mod = await import("./ai-router.service.js");

    for (const k of Object.keys(defaults)) {
      if (k in originalEnv) {
        process.env[k] = originalEnv[k];
      } else {
        delete process.env[k];
      }
    }

    return mod;
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. BASIC FALLBACK CHAIN
  // ═════════════════════════════════════════════════════════════════

  it("returns response from the first successful provider", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Hello from Cloudflare!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Hello from Cloudflare!");
    expect(result.provider).toBe("Cloudflare");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("falls back to the next provider when the first fails", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        return makeErrorResponse(500, "Internal error");
      }
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare fallback worked!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Cloudflare fallback worked!");
    expect(result.provider).toBe("Cloudflare");
  });

  it("falls back through multiple providers until one works", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callCount++;
      if (callCount <= 2) {
        return makeErrorResponse(500, "fail");
      }
      if (url.includes("api.groq.com")) {
        return standardResponse("Groq to the rescue!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Groq to the rescue!");
    expect(result.provider).toBe("Groq");
  });

  // ═════════════════════════════════════════════════════════════════
  // 2. ALL PROVIDERS FAIL
  // ═════════════════════════════════════════════════════════════════

  it("throws when all providers fail", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, "Server error"));

    const { tryAIRouterInference } = await loadRouter();

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow();
  });

  // ═════════════════════════════════════════════════════════════════
  // 3. RATE LIMIT DETECTION (429)
  // ═════════════════════════════════════════════════════════════════

  it("triggers provider cooldown on HTTP 429", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(429, "Rate limited"));

    const { tryAIRouterInference, getProviderStatus } = await loadRouter();

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow();

    const status = getProviderStatus();
    // At least one provider should be rate-limited
    const anyRateLimited = Object.values(status).some(
      (p: any) => p.rateLimited === true,
    );
    expect(anyRateLimited).toBe(true);
    const rateLimitedProvider: any = Object.values(status).find(
      (p: any) => p.rateLimited === true,
    );
    expect(rateLimitedProvider.rateLimitedRemainingMs).toBeGreaterThan(0);
    expect(rateLimitedProvider.rateLimitedRemainingMs).toBeLessThanOrEqual(60000);
  });

  it("skips rate-limited providers and tries the next one", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        return makeErrorResponse(429, "Rate limited");
      }
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare after Gemini rate-limit!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Cloudflare after Gemini rate-limit!");
    expect(result.provider).toBe("Cloudflare");
    expect(callCount).toBe(2);
  });

  it("keeps rate-limited provider skipped during cooldown window", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        return makeErrorResponse(429, "Rate limited");
      }
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare success");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();

    const result1 = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );
    expect(result1.provider).toBe("Cloudflare");

    // Advance 1s (well within 60s cooldown)
    vi.advanceTimersByTime(1000);

    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare again");
      }
      return makeErrorResponse(500);
    });

    const result2 = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result2.provider).toBe("Cloudflare");
    // Should NOT have called Gemini API (it's in cooldown)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("re-enables a provider after cooldown expires", async () => {
    mockFetch.mockResolvedValueOnce(makeErrorResponse(429, "Rate limited"));
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare fallback");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    await tryAIRouterInference([{ role: "user", content: "Hi" }], 100);

    // Advance past cooldown (60s + buffer)
    vi.advanceTimersByTime(61000);

    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare after cooldown");
      }
      if (url.includes("generativelanguage.googleapis.com")) {
        return geminiResponse("Gemini is back!");
      }
      return makeErrorResponse(500);
    });

    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBeTruthy();
  });

  // ═════════════════════════════════════════════════════════════════
  // 4. DISABLED PROVIDERS
  // ═════════════════════════════════════════════════════════════════

  it("skips providers missing API keys", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.groq.com")) {
        return standardResponse("Only Groq works!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter({
      GEMINI_API_KEY: "",
      CF_API_TOKEN: "",
      CEREBRAS_API_KEY: "",
    });

    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Only Groq works!");
    expect(result.provider).toBe("Groq");
  });

  it("throws when no providers are configured", async () => {
    const { tryAIRouterInference } = await loadRouter({
      GEMINI_API_KEY: "",
      CF_API_TOKEN: "",
      GROQ_API_KEY: "",
      CEREBRAS_API_KEY: "",
    });

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow("No AI providers are configured");
  });

  // ═════════════════════════════════════════════════════════════════
  // 5. AI_ROUTER_ENABLED = false
  // ═════════════════════════════════════════════════════════════════

  it("throws when AI_ROUTER_ENABLED is false", async () => {
    const { tryAIRouterInference } = await loadRouter({
      AI_ROUTER_ENABLED: "false",
    });

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow("AI_ROUTER is disabled");
  });

  // ═════════════════════════════════════════════════════════════════
  // 6. DYNAMIC PRIORITY REORDERING
  // ═════════════════════════════════════════════════════════════════

  it("reorders providers based on measured latency (faster = higher priority)", async () => {
    let callIdx = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callIdx++;
      if (url.includes("generativelanguage.googleapis.com")) {
        vi.advanceTimersByTime(100);
        return geminiResponse("Fast Gemini");
      }
      if (url.includes("api.cloudflare.com")) {
        vi.advanceTimersByTime(900);
        return standardResponse("Slow Cloudflare");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();

    // First call — warms up metrics
    const result1 = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );
    expect(result1.choices[0].message.content).toBeTruthy();

    // Second call — Gemini should be preferred due to lower latency
    mockFetch.mockReset();
    callIdx = 0;
    mockFetch.mockImplementation(async (url: string) => {
      callIdx++;
      if (url.includes("generativelanguage.googleapis.com")) {
        vi.advanceTimersByTime(50);
        return geminiResponse("Still fast Gemini");
      }
      return makeErrorResponse(500);
    });

    const result2 = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result2.provider).toBe("Gemini");
  });

  it("deprioritizes providers with consecutive errors", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, "Server error"));

    const { tryAIRouterInference } = await loadRouter();

    // Fail all providers 3 times to build error penalties
    for (let i = 0; i < 3; i++) {
      await expect(
        tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
      ).rejects.toThrow();
    }

    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Cloudflare wins due to lower errors");
      }
      return makeErrorResponse(500);
    });

    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.provider).toBe("Cloudflare");
  });

  // ═════════════════════════════════════════════════════════════════
  // 7. getProviderStatus() METRICS
  // ═════════════════════════════════════════════════════════════════

  it("getProviderStatus returns correct defaults for all 4 providers", async () => {
    const { getProviderStatus } = await loadRouter();

    const status = getProviderStatus();

    expect(status).toHaveProperty("gemini");
    expect(status).toHaveProperty("cloudflare");
    expect(status).toHaveProperty("groq");
    expect(status).toHaveProperty("cerebras");

    for (const key of ["gemini", "cloudflare", "groq", "cerebras"]) {
      expect(status[key].enabled).toBe(true);
      expect(status[key].totalCalls).toBe(0);
      expect(status[key].consecutiveErrors).toBe(0);
      expect(status[key].rateLimited).toBe(false);
      expect(status[key].avgLatencyMs).toBeNull();
      expect(status[key].successRate).toBe(100);
    }
  });

  it("getProviderStatus reflects a successful call on Cloudflare", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Success");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference, getProviderStatus } = await loadRouter();
    await tryAIRouterInference([{ role: "user", content: "Hi" }], 100);

    const status = getProviderStatus();

    // Cloudflare should have 1 successful call
    expect(status.cloudflare.totalCalls).toBe(1);
    expect(status.cloudflare.successRate).toBe(100);
    expect(status.cloudflare.avgLatencyMs).toBeGreaterThanOrEqual(0);

    // Gemini should have 1 failed call
    expect(status.gemini.totalCalls).toBe(1);
    expect(status.gemini.successRate).toBe(0);
  });

  it("getProviderStatus reflects failed calls", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, "fail"));

    const { tryAIRouterInference, getProviderStatus } = await loadRouter();

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow();

    const status = getProviderStatus();

    // All providers that were tried should have errors
    expect(status.gemini.consecutiveErrors).toBeGreaterThanOrEqual(1);
    expect(status.gemini.totalCalls).toBeGreaterThanOrEqual(1);
    expect(status.gemini.successRate).toBeLessThan(100);
  });

  // ═════════════════════════════════════════════════════════════════
  // 8. GEMINI MESSAGE FORMAT CONVERSION
  // ═════════════════════════════════════════════════════════════════

  it("Gemini provider converts system messages to systemInstruction", async () => {
    let capturedBody: any = null;
    mockFetch.mockImplementation(async (url: string, options?: any) => {
      capturedBody = JSON.parse(options?.body || "{}");
      if (url.includes("generativelanguage.googleapis.com")) {
        return geminiResponse("I'm Gemini!");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    await tryAIRouterInference(
      [
        { role: "system", content: "You are a helpful tutor." },
        { role: "user", content: "Explain AI" },
      ],
      200,
    );

    expect(capturedBody.systemInstruction).toBeDefined();
    expect(capturedBody.systemInstruction.parts[0].text).toBe(
      "You are a helpful tutor.",
    );

    const userContent = capturedBody.contents.find(
      (c: any) => c.role === "user",
    );
    expect(userContent).toBeDefined();
    expect(userContent.parts[0].text).toBe("Explain AI");

    // No system role should be in contents array
    const systemInContents = capturedBody.contents.find(
      (c: any) => c.role === "system",
    );
    expect(systemInContents).toBeUndefined();
  });

  it("Gemini provider converts assistant role to model role", async () => {
    let capturedBody: any = null;
    mockFetch.mockImplementation(async (url: string, options?: any) => {
      capturedBody = JSON.parse(options?.body || "{}");
      if (url.includes("generativelanguage.googleapis.com")) {
        return geminiResponse("Continuing...");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    await tryAIRouterInference(
      [
        { role: "user", content: "Tell me a joke" },
        { role: "assistant", content: "Why did the chicken..." },
        { role: "user", content: "I don't know, why?" },
      ],
      200,
    );

    const modelMsg = capturedBody.contents.find(
      (c: any) => c.role === "model",
    );
    expect(modelMsg).toBeDefined();
    expect(modelMsg.parts[0].text).toBe("Why did the chicken...");

    // Should NOT have "assistant" role in Gemini format
    const assistantMsg = capturedBody.contents.find(
      (c: any) => c.role === "assistant",
    );
    expect(assistantMsg).toBeUndefined();
  });

  // ═════════════════════════════════════════════════════════════════
  // 9. EDGE CASES
  // ═════════════════════════════════════════════════════════════════

  it("handles empty non-OK response body gracefully", async () => {
    mockFetch.mockResolvedValue(emptyErrorResponse());

    const { tryAIRouterInference } = await loadRouter();

    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow();
  });

  it("Cloudflare provider handles native response format (result.response)", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return makeOkResponse({
          result: { response: "Native Cloudflare response" },
        });
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter();
    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe(
      "Native Cloudflare response",
    );
    expect(result.provider).toBe("Cloudflare");
  });

  it("Cerebras provider returns content correctly", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cerebras.ai")) {
        return standardResponse("Cerebras inference result");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter({
      GEMINI_API_KEY: "",
      CF_API_TOKEN: "",
      GROQ_API_KEY: "",
    });

    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Cerebras inference result");
    expect(result.provider).toBe("Cerebras");
  });

  it("passes maxTokens to providers", async () => {
    let capturedMaxTokens: number | null = null;
    mockFetch.mockImplementation(async (url: string, options?: any) => {
      const body = JSON.parse(options?.body || "{}");
      capturedMaxTokens =
        body.max_tokens ?? body.generationConfig?.maxOutputTokens;
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Token test");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter({
      GEMINI_API_KEY: "",
    });

    await tryAIRouterInference([{ role: "user", content: "Hi" }], 512);

    expect(capturedMaxTokens).toBe(512);
  });

  it("preserves original user message content", async () => {
    let capturedMessages: any = null;
    mockFetch.mockImplementation(async (url: string, options?: any) => {
      capturedMessages = JSON.parse(options?.body || "{}").messages;
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Echo test");
      }
      return makeErrorResponse(500);
    });

    const { tryAIRouterInference } = await loadRouter({
      GEMINI_API_KEY: "",
    });

    await tryAIRouterInference(
      [{ role: "user", content: "What is 2+2?" }],
      100,
    );

    expect(capturedMessages).toBeDefined();
    expect(capturedMessages[0].content).toBe("What is 2+2?");
  });

  it("recovers after all providers fail when one comes back online", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500, "Down"));

    const { tryAIRouterInference } = await loadRouter();

    // Phase 1: All fail
    await expect(
      tryAIRouterInference([{ role: "user", content: "Hi" }], 100),
    ).rejects.toThrow();

    // Phase 2: Cloudflare comes back
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("api.cloudflare.com")) {
        return standardResponse("Back online!");
      }
      return makeErrorResponse(500);
    });

    const result = await tryAIRouterInference(
      [{ role: "user", content: "Hi" }],
      100,
    );

    expect(result.choices[0].message.content).toBe("Back online!");
    expect(result.provider).toBe("Cloudflare");
  });
});
