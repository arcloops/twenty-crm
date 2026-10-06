import { useRedeemSsoExchangeToken } from '@/auth/hooks/useRedeemSsoExchangeToken';
import { parseNativeOAuthRedirectFromReturnToPath } from '@/auth/utils/parse-native-oauth-redirect-from-return-to-path';
import { useEffect } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const SignInUpSsoExchangeTokenEffect = () => {
  const { redeemSsoExchangeToken } = useRedeemSsoExchangeToken();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const ssoExchangeToken = hashParams.get('ssoExchangeToken');

    if (!isDefined(ssoExchangeToken)) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const nativeRedirectUri = parseNativeOAuthRedirectFromReturnToPath(
      searchParams.get('returnToPath'),
    );

    // Hand the token back to Expo AuthSession instead of starting a web session
    if (isDefined(nativeRedirectUri)) {
      const deepLink = new URL(nativeRedirectUri);
      deepLink.hash = `ssoExchangeToken=${ssoExchangeToken}`;
      window.location.replace(deepLink.toString());
      return;
    }

    // Synchronous strip (the router defers replace) so re-run or remounted effects find no token
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );

    void redeemSsoExchangeToken(ssoExchangeToken);
  }, [redeemSsoExchangeToken]);

  return <></>;
};
