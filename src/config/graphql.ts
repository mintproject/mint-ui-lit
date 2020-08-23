import { ApolloClient, createHttpLink, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const ENDPOINT = "https://graphql.mint.isi.edu/v1/graphql";
const SECRET = "WmGrIc4MxU";

const httpLink = createHttpLink({
  uri: ENDPOINT
});

// Set Authorization
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      "X-Hasura-Admin-Secret": SECRET
    }
  }
});

// Create the Apollo GraphQL Client
export const APOLLO_CLIENT = new ApolloClient({
  link: authLink.concat(httpLink),
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
