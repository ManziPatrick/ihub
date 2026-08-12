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

const httpLink = new UploadHttpLink({
  uri: env.API_URL || 'http://localhost:4000/graphql',
  headers: {
    'apollo-require-preflight': 'true',
  }
});

const wsLink = new GraphQLWsLink(createClient({
  url: env.WS_URL || 'ws://localhost:4000/graphql',
  connectionParams: () => {
    const token = localStorage.getItem('ihub_token');
    return {
      authorization: token ? `Bearer ${token}` : "",
    };
  },
}));

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

  let codes: string[] = [];
  let messages: string[] = [];
  if (CombinedGraphQLErrors.is(error)) {
    codes = error.errors
      .map((e) => (e as any)?.extensions?.code)
      .filter(Boolean);
    messages = error.errors.map((e) => e.message).filter(Boolean);
  }
  const isSuspended = codes.includes('ACCOUNT_SUSPENDED');
  const isDeactivated =
    codes.includes('ACCOUNT_DEACTIVATED') || codes.includes('ACCOUNT_BLOCKED');

  // Generic session expiry: the stored token is invalid, expired, or the
  // account no longer resolves (deleted). Previously this surfaced as raw
  // "Not authenticated" errors on every page — now it cleanly logs the user
  // out and sends them to the login screen.
  const isSessionExpired =
    !isSuspended &&
    !isDeactivated &&
    (codes.includes('UNAUTHENTICATED') ||
      messages.some((m) => /not authenticated/i.test(m)));

  if (!isSuspended && !isDeactivated && !isSessionExpired) return;

  blockedAccountRedirectInFlight = true;
  localStorage.removeItem('ihub_token');
  localStorage.removeItem('ihub_user');

  if (isSuspended) {
    if (window.location.pathname !== '/account-suspended' && window.location.pathname !== '/auth') {
      window.location.assign('/account-suspended');
    }
  } else if (window.location.pathname !== '/auth') {
    window.location.assign('/auth?session=expired');
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
