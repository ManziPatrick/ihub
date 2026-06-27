import { Request, Response } from 'express';
import { runDiagnostics, dnsLookup, getAIProviderHealth } from '../services/diagnostics.service';

/**
 * GET /api/health/diagnostics
 * Runs a comprehensive API reachability test for all external services.
 * Returns detailed diagnostics including DNS, network, token, and model checks.
 */
export const getDiagnostics = async (_req: Request, res: Response) => {
  try {
    const result = await runDiagnostics();

    const statusCode = result.summary.allReachable ? 200 : 503;

    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('❌ Diagnostics Error:', error?.message || error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: 'Diagnostics runner itself failed',
      message: error?.message || 'Unknown error',
    });
  }
};

/**
 * GET /api/health/ai-providers
 * Returns real-time health metrics for all configured AI providers.
 */
export const getAIProviders = async (_req: Request, res: Response) => {
  try {
    const result = getAIProviderHealth();
    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ AI Provider Health Error:', error?.message || error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: 'Failed to read AI provider status',
      message: error?.message || 'Unknown error',
    });
  }
};

/**
 * GET /api/health/dns?hostname=api-inference.huggingface.co
 * Runs a deep DNS investigation on a specific hostname.
 * Compares system resolver vs DNS-over-HTTPS to isolate DNS issues.
 */
export const getDnsLookup = async (req: Request, res: Response) => {
  try {
    const hostname = req.query.hostname as string;

    if (!hostname || hostname.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing required query parameter: hostname',
        example: '/api/health/dns?hostname=api-inference.huggingface.co',
      });
    }

    const result = await dnsLookup(hostname);
    res.json(result);
  } catch (error: any) {
    console.error('❌ DNS Lookup Error:', error?.message || error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: 'DNS lookup failed',
      message: error?.message || 'Unknown error',
    });
  }
};
