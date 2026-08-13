/**
 * Runtime Environment Configuration
 * This module provides a unified way to access environment variables
 * that works both in development (import.meta.env) and production (window._env_)
 */

// Type definition for runtime environment variables
declare global {
  interface Window {
    _env_?: {
      VITE_API_URL?: string;
      VITE_WS_URL?: string;
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_PUBLISHABLE_KEY?: string;
      VITE_PUSHER_KEY?: string;
      VITE_PUSHER_CLUSTER?: string;
      VITE_GOOGLE_CLIENT_ID?: string;
      VITE_PEXELS_API_KEY?: string;
      VITE_FREEPIK_API_KEY?: string;
    };
  }
}

/**
 * Get environment variable value
 * Tries runtime config first (window._env_), falls back to build-time (import.meta.env)
 */
function getEnv(key: string): string {
  // Try runtime config first (production)
  if (typeof window !== 'undefined' && window._env_) {
    const value = window._env_[key as keyof typeof window._env_];
    if (value) return value;
  }

  // Fall back to build-time config (development)
  return import.meta.env[key] || '';
}

/**
 * Upgrade ws:// → wss:// when the page is served over https.
 * Browsers block mixed-content WebSockets, so a ws:// value in config (e.g.
 * VITE_WS_URL) silently kills all realtime/subscription connections on an
 * https site. Applies to both runtime (window._env_) and build-time values.
 */
function secureWsUrl(url: string): string {
  if (!url) return url;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws://')) {
    return `wss://${url.slice(5)}`;
  }
  return url;
}

export const env = {
  API_URL: getEnv('VITE_API_URL'),
  WS_URL: secureWsUrl(getEnv('VITE_WS_URL')),
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: getEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  PUSHER_KEY: getEnv('VITE_PUSHER_KEY'),
  PUSHER_CLUSTER: getEnv('VITE_PUSHER_CLUSTER'),
  GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID'),
  PEXELS_API_KEY: getEnv('VITE_PEXELS_API_KEY'),
  FREEPIK_API_KEY: getEnv('VITE_FREEPIK_API_KEY'),
};

/**
 * Get the base API URL (without /graphql) for REST API calls
 */
export const getApiBaseUrl = (): string => {
  return env.API_URL?.replace('/graphql', '') || 'http://localhost:4000';
};

/**
 * Get the GraphQL API URL
 */
export const getGraphqlUrl = (): string => {
  return env.API_URL || 'http://localhost:4000/graphql';
};

// Log environment status in development
if (import.meta.env.DEV) {
  console.log('🔧 Environment configuration loaded:', {
    source: window._env_ ? 'runtime (window._env_)' : 'build-time (import.meta.env)',
    values: Object.entries(env).map(([key, value]) => ({
      key,
      loaded: !!value,
    })),
  });
}
