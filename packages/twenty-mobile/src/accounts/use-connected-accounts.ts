import { useCallback, useEffect, useState } from 'react';

import { openConnectedAccountOAuth } from '@/auth/oauth-session';
import { useAuth } from '@/auth/auth-context';
import {
  DELETE_CONNECTED_ACCOUNT,
  GENERATE_TRANSIENT_TOKEN,
  MY_CONNECTED_ACCOUNTS,
} from '@/accounts/queries';

export type ConnectedAccount = {
  id: string;
  handle: string;
  provider: string;
  authFailedAt?: string | null;
  archivedAt?: string | null;
  scopes?: string[] | null;
  lastSignedInAt?: string | null;
  name?: string | null;
  visibility?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const EMAIL_CALENDAR_PROVIDERS = new Set([
  'GOOGLE',
  'MICROSOFT',
  'IMAP_SMTP_CALDAV',
]);

export const useConnectedAccounts = (enabled = true) => {
  const { apolloClients } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !enabled) {
      setAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apolloClients.metadataClient.query<{
        myConnectedAccounts: ConnectedAccount[];
      }>({
        query: MY_CONNECTED_ACCOUNTS,
        fetchPolicy: 'network-only',
      });

      setAccounts(
        (result.data.myConnectedAccounts ?? []).filter((account) =>
          EMAIL_CALENDAR_PROVIDERS.has(account.provider),
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load accounts',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const connectProvider = useCallback(
    async (provider: 'microsoft' | 'google') => {
      if (!apolloClients) {
        return;
      }

      setIsConnecting(true);
      setError(null);

      try {
        const tokenResult = await apolloClients.metadataClient.mutate<{
          generateTransientToken: {
            transientToken: { token: string };
          };
        }>({
          mutation: GENERATE_TRANSIENT_TOKEN,
        });

        const transientToken =
          tokenResult.data?.generateTransientToken.transientToken.token;

        if (!transientToken) {
          throw new Error('Failed to create connect token');
        }

        const outcome = await openConnectedAccountOAuth({
          provider,
          transientToken,
        });

        if (outcome === 'cancelled') {
          return;
        }

        await reload();
      } catch (connectError) {
        setError(
          connectError instanceof Error
            ? connectError.message
            : 'Failed to connect account',
        );
      } finally {
        setIsConnecting(false);
      }
    },
    [apolloClients, reload],
  );

  const disconnectAccount = useCallback(
    async (accountId: string) => {
      if (!apolloClients) {
        return;
      }

      setError(null);
      try {
        await apolloClients.metadataClient.mutate({
          mutation: DELETE_CONNECTED_ACCOUNT,
          variables: { id: accountId },
        });
        await reload();
      } catch (disconnectError) {
        setError(
          disconnectError instanceof Error
            ? disconnectError.message
            : 'Failed to disconnect',
        );
      }
    },
    [apolloClients, reload],
  );

  return {
    accounts,
    isLoading,
    isConnecting,
    error,
    reload,
    connectProvider,
    disconnectAccount,
  };
};
