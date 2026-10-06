import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useConnectedAccounts,
  type ConnectedAccount,
} from '@/accounts/use-connected-accounts';

type UseReconnectAccountBannerOptions = {
  enabled?: boolean;
  accounts?: ConnectedAccount[];
  isLoading?: boolean;
};

export const useReconnectAccountBanner = (
  options: UseReconnectAccountBannerOptions | boolean = true,
) => {
  const enabled =
    typeof options === 'boolean' ? options : (options.enabled ?? true);
  const externalAccounts =
    typeof options === 'boolean' ? undefined : options.accounts;
  const externalLoading =
    typeof options === 'boolean' ? undefined : options.isLoading;

  const shouldFetchInternally = enabled && externalAccounts === undefined;
  const connected = useConnectedAccounts(shouldFetchInternally);

  const accounts = externalAccounts ?? connected.accounts;
  const isLoading = externalLoading ?? connected.isLoading;
  const reload = connected.reload;

  const [isDismissed, setIsDismissed] = useState(false);

  const failedAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => Boolean(account.authFailedAt) && !account.archivedAt,
      ),
    [accounts],
  );

  useEffect(() => {
    if (failedAccounts.length === 0) {
      setIsDismissed(false);
    }
  }, [failedAccounts.length]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const shouldShow =
    enabled && !isDismissed && !isLoading && failedAccounts.length > 0;

  return {
    shouldShow,
    failedCount: failedAccounts.length,
    failedAccounts,
    dismiss,
    reload,
  };
};
