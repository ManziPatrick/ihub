import { ApolloClient, InMemoryCache, split, from } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import { createClient } from 'graphql-ws';
import { env } from './env';
import { createMonitoringLink, trackTimingGlobally } from './graphql/monitoringLink';
import { globalNavigate } from './navigate';

const httpLink = new UploadHttpLink({
  uri: env.API_URL || 'http://localhost:4000/graphql',
  headers: {
    'apollo-require-preflight': 'true',
  }
});

// Keep a handle on the ws client so we can force a reconnect with a fresh
// token right after login (the connection is established lazily and only reads
// connectionParams at connect time — without this, subscriptions opened with
// the pre-login (no-token) connection keep failing as "not authenticated"
// after login, which the guard below wrongly treated as a session expiry).
const wsClient = createClient({
  url: env.WS_URL || 'ws://localhost:4000/graphql',
  lazy: true,
  connectionParams: () => {
    const token = localStorage.getItem('ihub_token');
    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  },
});
export function resetWsConnection() {
  try {
    (wsClient as any).dispose();
  } catch {
    // ignore — a fresh connection will be created on demand (lazy)
  }
}
const wsLink = new GraphQLWsLink(wsClient);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('ihub_token');
  // Support both 'authorization' and 'Authorization'
  const existingAuth = headers?.authorization || headers?.Authorization;
  return {
    headers: {
      ...headers,
      authorization: existingAuth || (token ? `Bearer ${token}` : ""),
    }
  }
});

// Guard against a storm of parallel queries firing the same redirect
let blockedAccountRedirectInFlight = false;

/**
 * Global guard for blocked accounts.
 *
 * The backend now rejects suspended / deactivated accounts at the middleware
 * level, and the `me` resolver returns a precise error code. When a logged-in
 * session is blocked mid-use, every GET_ME / authed query would otherwise fail
 * with a generic auth error and the user would be stuck. This link detects the
 * specific codes, clears the stale session, and routes the user to the right
 * screen immediately.
 *
 * Fresh login attempts (no token yet) are left to the Auth page, which already
 * redirects with the account email for a nicer message.
 */
const blockedAccountLink = new ErrorLink(({ operation, error }) => {
  if (blockedAccountRedirectInFlight) return;
  // Only hijack sessions that already hold a token (previously logged in).
  if (!localStorage.getItem('ihub_token')) return;

  // Never hijack a fresh login / registration attempt — those are handled
  // by the Auth page so the user can see the actual error (e.g. wrong password).
  const opName = operation?.operationName || '';
  if (opName === 'Login' || opName === 'Register') return;

  // Subscription (WebSocket) errors must NOT trigger a logout: the WS
  // connection can momentarily carry the pre-login (no-token) session and
  // emit transient "not authenticated" errors. We reconnect the WS with a
  // fresh token after login (resetWsConnection), so a stale subscription
  // error here is benign and must not nuke a valid session.
  try {
    const def = getMainDefinition(operation.query);
    if (def?.kind === 'OperationDefinition' && def?.operation === 'subscription') {
      return;
    }
  } catch {
    // fall through — treat as a normal operation
  }

  let codes: string[] = [];
  if (CombinedGraphQLErrors.is(error)) {
    codes = error.errors
      .map((e) => (e as any)?.extensions?.code)
      .filter(Boolean);
  }
  const isSuspended = codes.includes('ACCOUNT_SUSPENDED');
  const isDeactivated =
    codes.includes('ACCOUNT_DEACTIVATED') || codes.includes('ACCOUNT_BLOCKED');

  // Note: generic session expiry (UNAUTHENTICATED) is intentionally NOT
  // handled here — a plain token refresh / transient auth error must never
  // wipe the session or force a redirect to /auth (which can 404 on hosts
  // without an SPA fallback). Only blocked accounts trigger a redirect.
  //
  // HOWEVER: if the error message is literally "Not authenticated" and we
  // have a token in localStorage, the token is expired or revoked. Clear
  // the stale session and redirect to login so the student isn't stuck on
  // a dead-end error page.
  if (!isSuspended && !isDeactivated) return;

  blockedAccountRedirectInFlight = true;
  localStorage.removeItem('ihub_token');
  localStorage.removeItem('ihub_user');

  if (isSuspended) {
    if (window.location.pathname !== '/account-suspended' && window.location.pathname !== '/auth') {
      globalNavigate('/account-suspended');
    }
  } else if (window.location.pathname !== '/auth') {
    globalNavigate('/account-suspended');
  }
});

// Monitoring link — tracks query response times and payload sizes
// Only tracks operations matching tracked patterns
const monitoringLink = createMonitoringLink({
  devLogging: process.env.NODE_ENV !== 'production',
  slowThresholdMs: 500,
  trackOperations: [
    /^GetCourses/,
    /^GetCourse/,
    /^GetMe/,
    /^GetAnalytics/,
    /^GetAdmin/,
    /^GetStats/,
  ],
  onTiming: trackTimingGlobally,
  includeQueryBody: false,
});

// Temporary debug flag: disable automatic error capture reporting to avoid
// recursive error-reporting loops while we debug network storms.
const DEBUG_DISABLE_ERROR_CAPTURE = true;

// Build link chain
const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  blockedAccountLink.concat(monitoringLink.concat(authLink.concat(httpLink))),
);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          messages: {
            merge(existing = [], incoming: any[]) {
              return incoming;
            },
          },
          // Cache course list results separately by sort/filter params
          courses: {
            keyArgs: ["sortBy", "featured", "search", "category", "price", "level", "school"],
          },
        },
      },
      Course: {
        keyFields: ["id"],
      },
    },
  }),
  // Reduce aggressive network usage by deduplicating identical in-flight queries.
  // Default fetch policies never serve stale data while online: watchQuery uses
  // cache-and-network (cached paint + background refresh) and one-off client.query
  // calls use network-only — so logged-in users never keep seeing stale course
  // data from previous sessions. Offline fallback is handled by the app shell.
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all' as any,
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all' as any,
    },
    mutate: {
      errorPolicy: 'all' as any,
    },
  },
});

export default client;
