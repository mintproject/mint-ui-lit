import { ApolloClient, createHttpLink, InMemoryCache, split, NormalizedCacheObject } from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { MintPreferences, User } from 'app/reducers';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { KeycloakAdapter } from 'util/keycloak-adapter';

import * as mintConfig from './config.json';

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

  static instance = (auth:User) => {

    if(GraphQL.client != null && auth?.email == GraphQL.userId)
      return GraphQL.client
    GraphQL.userId = auth?.email;

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
    let prefs = mintConfig["default"] as MintPreferences;
    let protocol = prefs.graphql.enable_ssl? "wss://" : "ws://"
    let uri = protocol + prefs.graphql.endpoint
    // Subscription Link
    const subscriptionClient = new SubscriptionClient(
      uri,
      {
        reconnect: true,
        lazy: true,
        connectionParams: {
          headers: KeycloakAdapter.getAccessTokenHeader()
        }
      }
    );
    // @ts-ignore
    subscriptionClient.maxConnectTimeGenerator.duration = () => subscriptionClient.maxConnectTimeGenerator.max;    
    return new WebSocketLink(subscriptionClient);
  }

  static getHTTPSLink() {
    let prefs = mintConfig["default"] as MintPreferences;
    // Normal HTTP Link
    let protocol = prefs.graphql.enable_ssl? "https://" : "http://"
    let uri = protocol + prefs.graphql.endpoint
    return createHttpLink({
      uri: uri,
      headers: KeycloakAdapter.getAccessTokenHeader()
    });
  }
}

