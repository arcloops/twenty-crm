import { useCallback, useEffect, useState } from 'react';

import { API_BASE_URL } from '@/config/env';

type AuthProvidersConfig = {
  google: boolean;
  microsoft: boolean;
  password: boolean;
};

type ClientConfigResponse = {
  authProviders?: Partial<AuthProvidersConfig>;
  billing?: {
    isBillingEnabled?: boolean;
  };
};

export const useAuthProvidersConfig = () => {
  const [providers, setProviders] = useState<AuthProvidersConfig>({
    google: true,
    microsoft: true,
    password: true,
  });
  const [isBillingEnabled, setIsBillingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/client-config`);
      if (!response.ok) {
        return;
      }
      const json = (await response.json()) as ClientConfigResponse;
      setProviders({
        google: json.authProviders?.google !== false,
        microsoft: json.authProviders?.microsoft !== false,
        password: json.authProviders?.password !== false,
      });
      setIsBillingEnabled(json.billing?.isBillingEnabled === true);
    } catch {
      // Keep defaults so login still works offline-ish
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { providers, isBillingEnabled, isLoading, reload };
};
