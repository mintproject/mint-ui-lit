import { ApolloClient, createHttpLink, InMemoryCache, HttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

const ENDPOINT = "graphql.mint.isi.edu/v1/graphql";
const SECRET = "WmGrIc4MxU";

// Subscription Link
const wsLink = new WebSocketLink({
  uri: "wss://" + ENDPOINT,
  options: {
    reconnect: true,
    connectionParams: {
      headers: {
        "X-Hasura-Admin-Secret": SECRET
      }
    }
  }
});

// Normal HTTP Link
const httpLink = createHttpLink({
  uri: "https://" + ENDPOINT,
  headers: {
    "X-Hasura-Admin-Secret": SECRET
  }
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

// Create the Apollo GraphQL Client
export const APOLLO_CLIENT = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});

/* Typescript declarations so window.__APOLLO_CLIENT__ doesn't give an error */
export {}
declare global {
  interface Window {
    __APOLLO_CLIENT__: any;
  }
}

window.__APOLLO_CLIENT__ = APOLLO_CLIENT;
