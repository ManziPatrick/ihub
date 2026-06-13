import { ApolloClient, InMemoryCache, split, from } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
// @ts-ignore
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

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([monitoringLink, authLink.concat(httpLink)]),
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
            keyArgs: ["sortBy", "featured"],
          },
        },
      },
      Course: {
        keyFields: ["id"],
      },
    },
  }),
});

export default client;
