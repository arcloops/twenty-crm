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

    // Stripping synchronously through window.history rather than the router
    // (whose data-router navigations defer the replace) latches re-invoked and
    // remounted effects out: they re-read window.location and find no token
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );

    void redeemSsoExchangeToken(ssoExchangeToken);
  }, [redeemSsoExchangeToken]);

  return <></>;
};
