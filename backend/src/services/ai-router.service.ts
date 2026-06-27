/**
 * ─── AI Provider Router ─────────────────────────────────────────────────
 * Multi-provider AI gateway with automatic fallback, rate-limit detection,
 * latency-based prioritization, and seamless failover.
 *
 * Providers (in dynamic priority order):
 *   1. Google Gemini 2.0 Flash  — fastest, lowest token cost
 *   2. Cloudflare Workers AI    — primary cloud provider
 *   3. Groq (Llama 3.3 70B)    — high throughput, low latency
 *   4. Cerebras (GPT-OSS 120B) — high quality, competitive speed
 *
 * The router tracks per-provider latency and error rates, and dynamically
 * re-orders or temporarily skips providers that are rate-limited or slow.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ─── Environment Config ─────────────────────────────────────────────────

// Cloudflare
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_MODEL = process.env.CF_MODEL || '@cf/meta/llama-3.1-8b-instruct';
const CF_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1/chat/completions`;

// Cerebras
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';
const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1/chat/completions';

// Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Google Gemini (using the simpler API key auth directly, not an SDK)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Master toggle — set AI_ROUTER_ENABLED=false to fall back to the old system
const AI_ROUTER_ENABLED = (process.env.AI_ROUTER_ENABLED || 'true').toLowerCase() === 'true';

// Rate-limit cooldown in milliseconds (default 60s)
const RATE_LIMIT_COOLDOWN_MS = parseInt(process.env.AI_ROUTER_COOLDOWN_MS || '60000', 10);

// How many recent latencies to keep per provider for averaging
const LATENCY_WINDOW = 5;

// ─── Types ──────────────────────────────────────────────────────────────

export interface AIProviderResult {
  choices: { message: { content: string } }[];
  provider: string;
  latencyMs: number;
}

interface ProviderMetrics {
  name: string;
  enabled: boolean;
  latencies: number[];        // sliding window of recent latencies
  consecutiveErrors: number;
  rateLimitedUntil: number;   // timestamp (ms) when cooldown expires
  totalCalls: number;
  successfulCalls: number;
}

interface ProviderImpl {
  name: string;
  call: (messages: { role: string; content: string }[], maxTokens: number, signal?: AbortSignal) => Promise<string>;
}

// ─── Provider Metrics Registry ──────────────────────────────────────────

const metrics: Record<string, ProviderMetrics> = {
  gemini:    { name: 'Gemini',    enabled: !!GEMINI_API_KEY,    latencies: [], consecutiveErrors: 0, rateLimitedUntil: 0, totalCalls: 0, successfulCalls: 0 },
  cloudflare:{ name: 'Cloudflare',enabled: !!(CF_API_TOKEN && CF_ACCOUNT_ID), latencies: [], consecutiveErrors: 0, rateLimitedUntil: 0, totalCalls: 0, successfulCalls: 0 },
  groq:      { name: 'Groq',      enabled: !!GROQ_API_KEY,     latencies: [], consecutiveErrors: 0, rateLimitedUntil: 0, totalCalls: 0, successfulCalls: 0 },
  cerebras:  { name: 'Cerebras',  enabled: !!CEREBRAS_API_KEY, latencies: [], consecutiveErrors: 0, rateLimitedUntil: 0, totalCalls: 0, successfulCalls: 0 },
};

// ─── HTTP Helper ────────────────────────────────────────────────────────

async function postJSON(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(30000),
  });
}

// ─── Provider Implementations ───────────────────────────────────────────

/** Google Gemini — uses its own API format, transformed to standard output */
const geminiProvider: ProviderImpl = {
  name: 'gemini',
  call: async (messages, maxTokens, signal) => {
    // Convert OpenAI-style messages to Gemini format
    // Gemini uses { contents: [{ role, parts: [{ text }] }] }
    // System messages are separate in Gemini
    let systemInstruction: string | null = null;
    const contents: { role: string; parts: { text: string }[] }[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await postJSON(
      `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`,
      {},
      body,
      signal,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      if (response.status === 429) throw new RateLimitError('Gemini rate limited');
      throw new Error(`Gemini: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini returned empty response');
    }

    return data.candidates[0].content.parts[0].text;
  },
};

/** Cloudflare Workers AI — OpenAI-compatible endpoint */
const cloudflareProvider: ProviderImpl = {
  name: 'cloudflare',
  call: async (messages, maxTokens, signal) => {
    const response = await postJSON(
      CF_BASE_URL,
      { Authorization: `Bearer ${CF_API_TOKEN}` },
      { model: CF_MODEL, messages, max_tokens: maxTokens, temperature: 0.7 },
      signal,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      if (response.status === 429) throw new RateLimitError('Cloudflare rate limited');
      throw new Error(`Cloudflare: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      result?: { response?: string };
      choices?: { message?: { content?: string } }[];
    };

    // Cloudflare OpenAI-compatible returns choices array
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // Fallback for the native Cloudflare response format
    if (data.result?.response) {
      return data.result.response;
    }

    throw new Error('Cloudflare returned empty response');
  },
};

/** Groq — OpenAI-compatible */
const groqProvider: ProviderImpl = {
  name: 'groq',
  call: async (messages, maxTokens, signal) => {
    const response = await postJSON(
      GROQ_BASE_URL,
      { Authorization: `Bearer ${GROQ_API_KEY}` },
      { model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: 0.7 },
      signal,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      if (response.status === 429) throw new RateLimitError('Groq rate limited');
      throw new Error(`Groq: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Groq returned empty response');
    }

    return data.choices[0].message.content;
  },
};

/** Cerebras — OpenAI-compatible */
const cerebrasProvider: ProviderImpl = {
  name: 'cerebras',
  call: async (messages, maxTokens, signal) => {
    const response = await postJSON(
      CEREBRAS_BASE_URL,
      { Authorization: `Bearer ${CEREBRAS_API_KEY}` },
      { model: CEREBRAS_MODEL, messages, max_tokens: maxTokens, temperature: 0.7 },
      signal,
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      if (response.status === 429) throw new RateLimitError('Cerebras rate limited');
      throw new Error(`Cerebras: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Cerebras returned empty response');
    }

    return data.choices[0].message.content;
  },
};

// Map of provider implementations
const providers: Record<string, ProviderImpl> = {
  gemini: geminiProvider,
  cloudflare: cloudflareProvider,
  groq: groqProvider,
  cerebras: cerebrasProvider,
};

// ─── Rate Limit Error ───────────────────────────────────────────────────

class RateLimitError extends Error {
  constructor(provider: string) {
    super(`${provider} rate limited`);
    this.name = 'RateLimitError';
  }
}

// ─── Metrics & Scoring ──────────────────────────────────────────────────

/**
 * Record latency and success/failure for a provider.
 */
function recordSuccess(providerKey: string, latencyMs: number): void {
  const m = metrics[providerKey];
  if (!m) return;
  m.latencies.push(latencyMs);
  if (m.latencies.length > LATENCY_WINDOW) m.latencies.shift();
  m.consecutiveErrors = 0;
  m.totalCalls++;
  m.successfulCalls++;
}

function recordError(providerKey: string, err: Error): void {
  const m = metrics[providerKey];
  if (!m) return;
  m.consecutiveErrors++;
  m.totalCalls++;

  if (err instanceof RateLimitError) {
    // Put the provider in cooldown
    m.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
    console.warn(`⏸️ AI Router: ${m.name} rate-limited, cooling down for ${RATE_LIMIT_COOLDOWN_MS / 1000}s`);
  }
}

/**
 * Compute a composite score for a provider (lower = better priority).
 * Factors: average latency, consecutive errors, rate-limit status.
 */
function providerScore(providerKey: string): number {
  const m = metrics[providerKey];
  if (!m) return Infinity;

  // Disabled or missing API key
  if (!m.enabled) return Infinity;

  // Rate-limited: high score (low priority)
  if (m.rateLimitedUntil > Date.now()) {
    return 100000 + (m.rateLimitedUntil - Date.now());
  }

  // High consecutive errors: add penalty
  const errorPenalty = m.consecutiveErrors * 5000;

  // Average latency (default to 1000ms if no data)
  const avgLatency = m.latencies.length > 0
    ? m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length
    : 500; // optimistic initial estimate

  return avgLatency + errorPenalty;
}

/**
 * Get providers sorted by priority (best first).
 */
function getPriorityList(): string[] {
  return Object.keys(providers)
    .map(key => ({ key, score: providerScore(key) }))
    .filter(p => p.score < Infinity)
    .sort((a, b) => a.score - b.score)
    .map(p => p.key);
}

// ─── Main Inference Function ────────────────────────────────────────────

/**
 * Try inference across all enabled AI providers with automatic fallback.
 *
 * Provider order is dynamic — based on measured latency, error rates,
 * and rate-limit status. The fastest / healthiest provider is tried first.
 *
 * Falls back through the list until one succeeds.
 *
 * @returns Standardised response compatible with the existing service format
 * @throws If ALL providers fail
 */
export async function tryAIRouterInference(
  messages: { role: string; content: string }[],
  maxTokens: number = 1024,
): Promise<AIProviderResult> {
  if (!AI_ROUTER_ENABLED) {
    throw new Error('AI_ROUTER is disabled');
  }

  const priorityList = getPriorityList();

  if (priorityList.length === 0) {
    throw new Error('No AI providers are configured. Set at least one of: GEMINI_API_KEY, CF_API_TOKEN, GROQ_API_KEY, CEREBRAS_API_KEY');
  }

  let lastError: Error | null = null;

  for (const providerKey of priorityList) {
    const impl = providers[providerKey];
    const m = metrics[providerKey];
    if (!impl || !m?.enabled) continue;

    const start = Date.now();

    try {
      console.log(`🤖 AI Router: trying ${m.name}...`);

      const content = await impl.call(messages, maxTokens);
      const latencyMs = Date.now() - start;

      recordSuccess(providerKey, latencyMs);

      console.log(`✅ AI Router: ${m.name} responded in ${latencyMs}ms`);

      return {
        choices: [{ message: { content } }],
        provider: m.name,
        latencyMs,
      };
    } catch (err: any) {
      const elapsed = Date.now() - start;
      recordError(providerKey, err);

      const isRateLimit = err instanceof RateLimitError;
      const status = isRateLimit ? 'rate-limited' : 'failed';

      console.warn(`⚠️ AI Router: ${m.name} ${status} after ${elapsed}ms: ${err.message}`);
      lastError = err;
      // Continue to next provider
    }
  }

  throw lastError || new Error('All AI providers failed');
}

// ─── Diagnostics ────────────────────────────────────────────────────────

/**
 * Get current provider status for diagnostics / health check.
 */
export function getProviderStatus(): Record<string, {
  name: string;
  enabled: boolean;
  avgLatencyMs: number | null;
  consecutiveErrors: number;
  rateLimited: boolean;
  rateLimitedRemainingMs: number;
  totalCalls: number;
  successRate: number;
}> {
  const result: Record<string, any> = {};

  for (const [key, m] of Object.entries(metrics)) {
    result[key] = {
      name: m.name,
      enabled: m.enabled,
      avgLatencyMs: m.latencies.length > 0
        ? Math.round(m.latencies.reduce((a, b) => a + b, 0) / m.latencies.length)
        : null,
      consecutiveErrors: m.consecutiveErrors,
      rateLimited: m.rateLimitedUntil > Date.now(),
      rateLimitedRemainingMs: Math.max(0, m.rateLimitedUntil - Date.now()),
      totalCalls: m.totalCalls,
      successRate: m.totalCalls > 0
        ? Math.round((m.successfulCalls / m.totalCalls) * 100)
        : 100,
    };
  }

  return result;
}
