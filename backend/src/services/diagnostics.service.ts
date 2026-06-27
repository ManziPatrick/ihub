import https from 'https';
import net from 'net';
import dns from 'dns';
import fs from 'fs';
import { InferenceClient } from "@huggingface/inference";
import { getProviderStatus } from './ai-router.service';

const HF_TOKEN = process.env.HF_TOKEN || "";
const inferenceClient = new InferenceClient(HF_TOKEN);

/** Timeout for individual connectivity checks (ms) */
const CHECK_TIMEOUT = 10000;

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

export interface CheckResult {
  name: string;
  reachable: boolean;
  statusCode?: number;
  error?: string;
  details?: string;
  latencyMs?: number;
}

export interface DiagnosticsResult {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    envName: string;
    hfTokenConfigured: boolean;
    deepseekKeyConfigured: boolean;
  };
  checks: Record<string, CheckResult>;
  summary: {
    allReachable: boolean;
    unreachable: string[];
    errors: string[];
    warnings: string[];
  };
}

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

/**
 * Performs an HTTPS GET/HEAD request with a timeout.
 * Uses HEAD by default (lighter) but falls back to GET if needed.
 */
const checkEndpoint = (
  url: string,
  name: string,
  method: 'GET' | 'HEAD' = 'HEAD'
): Promise<CheckResult> => {
  return new Promise((resolve) => {
    const start = Date.now();

    const req = https.request(
      url,
      {
        method,
        timeout: CHECK_TIMEOUT,
        headers: { 'User-Agent': 'Bootskills-HealthCheck/1.0' },
      },
      (res) => {
        res.resume(); // consume to free memory
        resolve({
          name,
          reachable: true,
          statusCode: res.statusCode || 0,
          latencyMs: Date.now() - start,
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        reachable: false,
        error: 'Connection timed out',
        latencyMs: CHECK_TIMEOUT,
      });
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      resolve({
        name,
        reachable: false,
        error: err.code || err.message,
      });
    });

    req.end();
  });
};

/**
 * Resolves a hostname via DNS (IPv4 + IPv6).
 */
const checkDns = (hostname: string): Promise<CheckResult> => {
  return new Promise((resolve) => {
    const start = Date.now();
    dns.resolve(hostname, (err, addresses) => {
      const latencyMs = Date.now() - start;
      if (err) {
        resolve({
          name: `dns:${hostname}`,
          reachable: false,
          error: err.code || err.message,
          latencyMs,
        });
      } else {
        resolve({
          name: `dns:${hostname}`,
          reachable: true,
          details: `Resolved to: ${(Array.isArray(addresses) ? addresses : [addresses]).join(', ')}`,
          latencyMs,
        });
      }
    });
  });
};

/**
 * Tests the HF token by making a lightweight inference call.
 * 402 = valid token, just out of credits — still considered "reachable" with a warning.
 */
const checkHfToken = async (): Promise<CheckResult> => {
  if (!HF_TOKEN) {
    return {
      name: 'hf-token',
      reachable: false,
      error: 'No HF_TOKEN configured in environment',
    };
  }

  try {
    const start = Date.now();
    await inferenceClient.chatCompletion({
      model: 'deepseek-ai/DeepSeek-V4-Pro:novita',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1,
    });
    return {
      name: 'hf-token',
      reachable: true,
      statusCode: 200,
      latencyMs: Date.now() - start,
    };
  } catch (error: any) {
    const status = error?.status || error?.statusCode || error?.response?.status;
    const message = error?.message || String(error);

    // 402 = valid token, just out of credits — acceptable
    if (status === 402 || message.includes('402')) {
      return {
        name: 'hf-token',
        reachable: true,
        statusCode: 402,
        details: 'Token valid. Account credits depleted — add credits at https://huggingface.co/settings/billing',
      };
    }

    // Other 4xx = likely invalid token
    if (status && status >= 400 && status < 500) {
      return {
        name: 'hf-token',
        reachable: false,
        statusCode: status,
        error: `HTTP ${status}: Token may be invalid or expired`,
      };
    }

    return {
      name: 'hf-token',
      reachable: false,
      error: message,
    };
  }
};

// ──────────────────────────────────────────
// DNS LOOKUP TOOL — detailed per-hostname inspection
// ──────────────────────────────────────────

/** How long to wait for a single DNS query (ms) */
const DNS_TIMEOUT = 5000;

/**
 * Wraps dns.resolve family in a promise with timeout.
 */
const resolveWithTimeout = <T>(
  resolveFn: (callback: (err: NodeJS.ErrnoException | null, addresses: T) => void) => void
): Promise<{ result: T | null; error?: string; latencyMs: number }> => {
  return new Promise((resolve) => {
    const start = Date.now();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ result: null, error: 'Query timed out', latencyMs: DNS_TIMEOUT });
      }
    }, DNS_TIMEOUT);

    resolveFn((err: NodeJS.ErrnoException | null, addresses: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        resolve({ result: null, error: err.code || err.message, latencyMs: Date.now() - start });
      } else {
        resolve({ result: addresses, latencyMs: Date.now() - start });
      }
    });
  });
};

/**
 * Queries DNS records via Google's DNS-over-HTTPS API.
 * This bypasses the system resolver, helping isolate local DNS issues.
 */
const queryDoh = async (hostname: string, type: 'A' | 'AAAA' | 'MX' | 'NS' | 'CNAME'): Promise<{
  answers: { name: string; type: number; TTL: number; data: string }[];
  error?: string;
  latencyMs: number;
}> => {
  const url = `https://dns.google/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`;
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(
      url,
      {
        timeout: DNS_TIMEOUT,
        headers: { Accept: 'application/dns-json' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const latencyMs = Date.now() - start;
          try {
            const parsed = JSON.parse(body);
            if (parsed.Status !== 0) {
              resolve({ answers: [], error: `DoH returned status ${parsed.Status}`, latencyMs });
            } else {
              resolve({ answers: parsed.Answer || [], latencyMs });
            }
          } catch {
            resolve({ answers: [], error: 'Failed to parse DoH response', latencyMs });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ answers: [], error: 'DoH query timed out', latencyMs: DNS_TIMEOUT });
    });
    req.on('error', (err) => {
      resolve({ answers: [], error: err.message, latencyMs: Date.now() - start });
    });
    req.end();
  });
};

/**
 * Runs a deep DNS investigation on a specific hostname.
 * Uses the system resolver AND Google DNS-over-HTTPS for comparison.
 */
export const dnsLookup = async (hostname: string) => {
  const timestamp = new Date().toISOString();

  if (!hostname || hostname.trim().length === 0) {
    throw new Error('hostname query parameter is required');
  }

  const cleaned = hostname.trim().toLowerCase();

  // ── 1. System resolver queries ──
  const [aResult, aaaaResult, mxResult, nsResult, cnameResult] = await Promise.all([
    resolveWithTimeout<string[]>((cb) => dns.resolve4(cleaned, cb)),
    resolveWithTimeout<string[]>((cb) => dns.resolve6(cleaned, cb)),
    resolveWithTimeout<dns.MxRecord[]>((cb) => dns.resolveMx(cleaned, cb)),
    resolveWithTimeout<string[]>((cb) => dns.resolveNs(cleaned, cb)),
    resolveWithTimeout<string[]>((cb) => dns.resolveCname(cleaned, cb)),
  ]);

  // ── 2. DNS-over-HTTPS queries (bypasses system resolver) ──
  const [dohA, dohAaaa, dohMx, dohNs, dohCname] = await Promise.all([
    queryDoh(cleaned, 'A'),
    queryDoh(cleaned, 'AAAA'),
    queryDoh(cleaned, 'MX'),
    queryDoh(cleaned, 'NS'),
    queryDoh(cleaned, 'CNAME'),
  ]);

  // ── 3. Check /etc/hosts ──
  let etcHosts: { found: boolean; entries: string[] } = { found: false, entries: [] };
  try {
    const content = fs.readFileSync('/etc/hosts', 'utf-8');
    const lines = content.split('\n');
    const matching = lines.filter(
      (line) =>
        !line.trim().startsWith('#') &&
        line.toLowerCase().includes(cleaned)
    );
    if (matching.length > 0) {
      etcHosts = { found: true, entries: matching.map((l) => l.trim()) };
    }
  } catch {
    etcHosts = { found: false, entries: ['Could not read /etc/hosts'] };
  }

  // ── 4. System DNS resolver info ──
  let nameservers: string[] = [];
  try {
    const resolvConf = fs.readFileSync('/etc/resolv.conf', 'utf-8');
    nameservers = resolvConf
      .split('\n')
      .filter((l) => l.trim().startsWith('nameserver'))
      .map((l) => l.trim().replace(/^nameserver\s+/, ''));
  } catch {
    nameservers = ['Could not read /etc/resolv.conf'];
  }

  // ── 5. Reverse DNS on resolved IPs (first A record) ──
  let reverseDns: string | null = null;
  let reverseDnsError: string | undefined;
  const firstIp = aResult.result?.[0];
  if (firstIp) {
    try {
      const hostnames = await new Promise<string[]>((resolve) => {
        dns.reverse(firstIp, (err, hosts) => {
          if (err) resolve([]);
          else resolve(hosts);
        });
      });
      reverseDns = hostnames.length > 0 ? hostnames.join(', ') : null;
      if (!reverseDns) reverseDnsError = 'No PTR record found';
    } catch {
      reverseDnsError = 'Reverse lookup failed';
    }
  }

  // ── 6. Raw TCP connectivity test to port 443 on resolved IP ──
  // Uses net.createConnection instead of HTTPS to avoid TLS/SNI mismatch
  // when connecting by raw IP address.
  let tcpTest: { reachable: boolean; error?: string; latencyMs?: number } = {
    reachable: false,
  };
  const testIp = aResult.result?.[0] || dohA.answers[0]?.data;
  if (testIp) {
    tcpTest = await new Promise((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(DNS_TIMEOUT);
      socket.on('connect', () => {
        socket.destroy();
        resolve({ reachable: true, latencyMs: Date.now() - start });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ reachable: false, error: 'TCP connection timed out', latencyMs: DNS_TIMEOUT });
      });
      socket.on('error', (err: Error) => {
        socket.destroy();
        const code = (err as NodeJS.ErrnoException).code || err.message;
        resolve({ reachable: false, error: code, latencyMs: Date.now() - start });
      });
      socket.connect(443, testIp);
    });
  }

  // ── Assemble result ──
  const systemResolverRecords = {
    a: aResult.result || null,
    aaaa: aaaaResult.result || null,
    mx: mxResult.result?.map((r) => `${r.exchange} (priority ${r.priority})`) || null,
    ns: nsResult.result || null,
    cname: cnameResult.result || null,
    errors: [aResult.error, aaaaResult.error, mxResult.error, nsResult.error, cnameResult.error].filter(Boolean),
  };

  const dohRecords = {
    a: dohA.answers.map((a) => a.data),
    aaaa: dohAaaa.answers.map((a) => a.data),
    mx: dohMx.answers.map((a) => a.data),
    ns: dohNs.answers.map((a) => a.data),
    cname: dohCname.answers.map((a) => a.data),
    errors: [dohA.error, dohAaaa.error, dohMx.error, dohNs.error, dohCname.error].filter(Boolean),
  };

  // Determine overall status
  const systemResolved = !!systemResolverRecords.a;
  const dohResolved = dohRecords.a.length > 0;

  const diagnosis: string[] = [];
  if (systemResolved && dohResolved) {
    diagnosis.push('Hostname resolves via both system resolver and DNS-over-HTTPS.');
  } else if (!systemResolved && dohResolved) {
    diagnosis.push('⛔ Hostname does NOT resolve via the system resolver but DOES resolve via DNS-over-HTTPS. This indicates a LOCAL DNS SERVER or NETWORK issue — your DNS resolver (e.g. the corporate DNS) is blocking or failing to resolve this hostname. Try using a public DNS server like 8.8.8.8 or 1.1.1.1.');
  } else if (systemResolved && !dohResolved) {
    diagnosis.push('Hostname resolves via system resolver but NOT via DNS-over-HTTPS. This is unusual — Google DNS may be having a transient issue.');
  } else {
    diagnosis.push('⛔ Hostname does NOT resolve via either resolver. The domain likely does not exist or has no DNS records configured.');
  }

  if (etcHosts.found) {
    diagnosis.push(`ℹ️  /etc/hosts contains entry/entries for this hostname: ${etcHosts.entries.join('; ')}`);
  }

  const resolversSummary = `System nameservers: ${nameservers.join(', ') || 'none found'}`;

  return {
    timestamp,
    hostname: cleaned,
    systemResolver: {
      nameservers,
      records: systemResolverRecords,
      latencies: {
        a: aResult.latencyMs,
        aaaa: aaaaResult.latencyMs,
        mx: mxResult.latencyMs,
        ns: nsResult.latencyMs,
        cname: cnameResult.latencyMs,
      },
    },
    dnsOverHttps: {
      resolver: 'https://dns.google/dns-query',
      records: dohRecords,
      latencies: {
        a: dohA.latencyMs,
        aaaa: dohAaaa.latencyMs,
        mx: dohMx.latencyMs,
        ns: dohNs.latencyMs,
        cname: dohCname.latencyMs,
      },
    },
    etcHosts,
    reverseDns: {
      ip: firstIp,
      hostname: reverseDns,
      error: reverseDnsError,
    },
    tcpConnectivity: tcpTest,
    diagnostics: diagnosis,
    resolversSummary,
  };
};

export type DnsLookupResult = Awaited<ReturnType<typeof dnsLookup>>;

// ──────────────────────────────────────────
// AI PROVIDER STATUS — from the multi-provider router
// ──────────────────────────────────────────

/**
 * Returns real-time health and performance metrics for all configured
 * AI providers (Gemini, Cloudflare, Groq, Cerebras).
 * This is a lightweight, non-blocking read of in-memory metrics —
 * no API calls are made.
 */
export const getAIProviderHealth = () => {
  const status = getProviderStatus();

  // Count healthy vs degraded providers
  const providers = Object.values(status);
  const healthy = providers.filter(p => p.enabled && !p.rateLimited && p.successRate >= 50);
  const degraded = providers.filter(p => p.enabled && (p.rateLimited || p.successRate < 50));
  const disabled = providers.filter(p => !p.enabled);

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalConfigured: providers.length,
      healthy: healthy.length,
      degraded: degraded.length,
      disabled: disabled.length,
      allHealthy: degraded.length === 0 && disabled.length < providers.length,
    },
    providers: status,
  };
};

// ──────────────────────────────────────────
// MAIN DIAGNOSTIC RUNNER
// ──────────────────────────────────────────

export const runDiagnostics = async (): Promise<DiagnosticsResult> => {
  const timestamp = new Date().toISOString();

  const deepseekKey = process.env.DEEPSEEK_API_KEY || '';

  // Run ALL checks in parallel — DNS, endpoints, and token
  const allChecks = await Promise.all([
    // DNS resolution
    checkDns('huggingface.co'),
    checkDns('router.huggingface.co'),
    checkDns('api-inference.huggingface.co'),
    checkDns('google.com'),

    // Network endpoints (HEAD requests)
    checkEndpoint('https://huggingface.co', 'huggingface-main'),
    checkEndpoint('https://router.huggingface.co', 'hf-router'),
    checkEndpoint('https://api-inference.huggingface.co', 'hf-inference-api'),
    checkEndpoint('https://google.com', 'google'),

    // DeepSeek API (only if configured)
    ...(deepseekKey
      ? [checkEndpoint('https://api.deepseek.com', 'deepseek-api')]
      : []),

    // Token validity (SDK call)
    checkHfToken(),
  ] as Promise<CheckResult>[]);

  // Build named checks map
  const checks: Record<string, CheckResult> = {};
  for (const c of allChecks) {
    checks[c.name] = c;
  }

  // Compute summary
  const unreachable = allChecks
    .filter((c) => !c.reachable)
    .map((c) => c.name);

  const errors = allChecks
    .filter((c) => c.error && !c.reachable)
    .map((c) => `${c.name}: ${c.error}`);

  const warnings: string[] = [];
  for (const c of allChecks) {
    if (c.reachable && c.statusCode && c.statusCode >= 300 && c.statusCode !== 402) {
      warnings.push(`${c.name}: returned HTTP ${c.statusCode}`);
    }
    if (c.statusCode === 402) {
      warnings.push(`${c.name}: Token valid but account needs credits (HTTP 402)`);
    }

  }

  return {
    timestamp,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      envName: process.env.NODE_ENV || 'development',
      hfTokenConfigured: !!HF_TOKEN,
      deepseekKeyConfigured: !!deepseekKey,
    },
    checks,
    summary: {
      allReachable: unreachable.length === 0,
      unreachable,
      errors,
      warnings,
    },
  };
};
