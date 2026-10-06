import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  Observable,
  from,
  type FetchResult,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

import { renewAccessToken } from '@/auth/auth-service';
import { tokenStorage } from '@/auth/token-storage';
import { AUTH_ORIGIN, GRAPHQL_URL, METADATA_URL } from '@/config/env';

type AuthHandlers = {
  onAuthFailure: () => void;
};

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const resolvePending = (token: string | null) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

const createAuthLink = () =>
  setContext(async (_, { headers }) => {
    const tokens = await tokenStorage.getTokens();

    return {
      headers: {
        ...headers,
        ...(tokens?.accessToken
          ? { Authorization: `Bearer ${tokens.accessToken}` }
          : {}),
      },
    };
  });

const createErrorLink = ({ onAuthFailure }: AuthHandlers) =>
  onError(({ graphQLErrors, networkError, operation, forward }) => {
    const isUnauthenticated =
      graphQLErrors?.some(
        (error) =>
          error.extensions?.code === 'UNAUTHENTICATED' ||
          error.message.toLowerCase().includes('unauthorized') ||
          error.message.toLowerCase().includes('unauthenticated'),
      ) === true ||
      (networkError &&
        'statusCode' in networkError &&
        networkError.statusCode === 401);

    if (!isUnauthenticated) {
      return;
    }

    return new Observable<FetchResult>((observer) => {
      const retry = async () => {
        try {
          let accessToken: string | null = null;

          if (isRefreshing) {
            accessToken = await new Promise<string | null>((resolve) => {
              pendingRequests.push(resolve);
            });
          } else {
            isRefreshing = true;
            const tokens = await tokenStorage.getTokens();

            if (!tokens?.refreshToken) {
              resolvePending(null);
              void tokenStorage.clearTokens();
              onAuthFailure();
              observer.error(new Error('Session expired'));
              return;
            }

            try {
              const renewed = await renewAccessToken(tokens.refreshToken);
              accessToken = renewed.accessToken;
              resolvePending(accessToken);
            } catch (error) {
              resolvePending(null);
              await tokenStorage.clearTokens();
              onAuthFailure();
              observer.error(error);
              return;
            } finally {
              isRefreshing = false;
            }
          }

          if (!accessToken) {
            observer.error(new Error('Session expired'));
            return;
          }

          const oldHeaders = operation.getContext().headers ?? {};
          operation.setContext({
            headers: {
              ...oldHeaders,
              Authorization: `Bearer ${accessToken}`,
            },
          });

          forward(operation).subscribe({
            next: (value) => observer.next(value),
            error: (error) => observer.error(error),
            complete: () => observer.complete(),
          });
        } catch (error) {
          observer.error(error);
        }
      };

      void retry();
    });
  });

const createClient = (uri: string, handlers: AuthHandlers) =>
  new ApolloClient({
    link: from([
      createErrorLink(handlers),
      createAuthLink(),
      new HttpLink({
        uri,
        // Never attach session cookies from the OAuth WebView cookie jar
        credentials: 'omit',
        headers: {
          Origin: AUTH_ORIGIN,
        },
      }),
    ]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });

export type ApolloClients = {
  metadataClient: ApolloClient<unknown>;
  coreClient: ApolloClient<unknown>;
};

export const createApolloClients = (
  handlers: AuthHandlers,
): ApolloClients => ({
  metadataClient: createClient(METADATA_URL, handlers),
  coreClient: createClient(GRAPHQL_URL, handlers),
});
