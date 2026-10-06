import {
  redeemLoginToken,
  redeemSsoExchangeToken,
  upgradeWorkspaceAgnosticSession,
} from '@/auth/auth-service';
import {
  parseAuthCallbackUrl,
  type ParsedAuthCallback,
} from '@/auth/parse-auth-callback-url';
import type { AuthTokens } from '@/auth/token-storage';
import { API_BASE_URL, AUTH_ORIGIN } from '@/config/env';

export type SocialAuthProvider = 'microsoft' | 'google';

type OpenOAuthBrowser = (
  authUrl: string,
  options?: { shouldComplete?: (url: string) => boolean },
) => Promise<string>;

let openOAuthBrowserImpl: OpenOAuthBrowser | null = null;

export const registerOpenOAuthBrowser = (open: OpenOAuthBrowser | null) => {
  openOAuthBrowserImpl = open;
};

const redeemFromParsedTokens = async (
  parsed: ParsedAuthCallback,
  callbackUrl: string,
): Promise<AuthTokens> => {
  if (parsed.ssoExchangeToken) {
    await redeemSsoExchangeToken(parsed.ssoExchangeToken);
    // Microsoft/Google land on a workspace-agnostic session first
    return upgradeWorkspaceAgnosticSession();
  }

  if (parsed.loginToken) {
    let origin = AUTH_ORIGIN;

    try {
      origin = new URL(callbackUrl).origin || AUTH_ORIGIN;
    } catch {
      origin = AUTH_ORIGIN;
    }

    return redeemLoginToken({ loginToken: parsed.loginToken, origin });
  }

  throw new Error(
    'No auth token in redirect. If you have multiple workspaces, finish selection on the web app first.',
  );
};

export const signInWithSocialProvider = async (
  provider: SocialAuthProvider,
): Promise<AuthTokens> => {
  if (!openOAuthBrowserImpl) {
    throw new Error('OAuth browser is not ready');
  }

  // In-app WebView intercepts Nest→front redirects (loginToken / ssoExchangeToken)
  // before the SPA can turn them into a web session — works against today's API
  // without waiting for a crm-api deploy of mobileRedirectUri.
  const authUrl = new URL(`${API_BASE_URL}/auth/${provider}`);
  authUrl.searchParams.set('action', 'login');

  const callbackUrl = await openOAuthBrowserImpl(authUrl.toString());

  return redeemFromParsedTokens(parseAuthCallbackUrl(callbackUrl), callbackUrl);
};

export const openConnectedAccountOAuth = async ({
  provider,
  transientToken,
}: {
  provider: SocialAuthProvider;
  transientToken: string;
}): Promise<'success' | 'cancelled'> => {
  if (!openOAuthBrowserImpl) {
    throw new Error('OAuth browser is not ready');
  }

  const apiPath = provider === 'microsoft' ? 'microsoft-apis' : 'google-apis';
  const returnPath = '/settings/accounts';
  const authUrl = `${API_BASE_URL}/auth/${apiPath}?transientToken=${encodeURIComponent(transientToken)}&redirectLocation=${encodeURIComponent(returnPath)}`;
  const successPrefix = `${AUTH_ORIGIN.replace(/\/$/, '')}${returnPath}`;

  try {
    await openOAuthBrowserImpl(authUrl, {
      shouldComplete: (callbackUrl) => {
        try {
          const url = new URL(callbackUrl);

          return (
            callbackUrl.startsWith(successPrefix) ||
            url.pathname.includes('/settings/accounts')
          );
        } catch {
          return false;
        }
      },
    });

    return 'success';
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('cancel')
    ) {
      return 'cancelled';
    }

    throw error;
  }
};
