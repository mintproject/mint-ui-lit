import { ApolloClient, createHttpLink, InMemoryCache, HttpLink, split, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const ENDPOINT = "graphql.mint.isi.edu/v1/graphql";
const SECRET = "WmGrIc4MxU";

/* Typescript declarations so window.__APOLLO_CLIENT__ doesn't give an error */
export {}
declare global {
  interface Window {
    __APOLLO_CLIENT__: any;
  }
}

export class GraphQL {
  static client : ApolloClient<NormalizedCacheObject>;
  static userId;

  static instance = (auth) => {

    if(GraphQL.client != null && auth.currentUser?.email == GraphQL.userId)
      return GraphQL.client
    GraphQL.userId = auth.currentUser?.email;

    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      GraphQL.getSubscriptionLink(),
      GraphQL.getHTTPSLink(),
    );

    // Create the Apollo GraphQL Client
    GraphQL.client = new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache()
    });
    window.__APOLLO_CLIENT__ = GraphQL.client;

    return GraphQL.client;
  }

  static getSubscriptionLink() {
    // Subscription Link
    const subscriptionClient = new SubscriptionClient(
      "wss://" + ENDPOINT,
      {
        reconnect: true,
        lazy: true,
        connectionParams: {
          headers: {
            "X-Hasura-Admin-Secret": SECRET,
            "X-Hasura-User-Id": GraphQL.userId,
            "X-Hasura-Role": "user"
          }
        }
      }
    );
    // @ts-ignore
    subscriptionClient.maxConnectTimeGenerator.duration = () => subscriptionClient.maxConnectTimeGenerator.max;    
    return new WebSocketLink(subscriptionClient);
  }

  static getHTTPSLink() {
    // Normal HTTP Link
    return createHttpLink({
      uri: "https://" + ENDPOINT,
      headers: {
        "X-Hasura-Admin-Secret": SECRET,
        "X-Hasura-User-Id": GraphQL.userId,
        "X-Hasura-Role": "user"
      }
    });
  }
}

