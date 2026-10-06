import { gql } from '@apollo/client';

import { AUTH_ORIGIN, METADATA_URL } from '@/config/env';
import { tokenStorage, type AuthTokens } from '@/auth/token-storage';

const GET_LOGIN_TOKEN = `
  mutation GetLoginTokenFromCredentials(
    $email: String!
    $password: String!
    $origin: String!
  ) {
    getLoginTokenFromCredentials(
      email: $email
      password: $password
      origin: $origin
    ) {
      loginToken {
        token
        expiresAt
      }
    }
  }
`;

const GET_AUTH_TOKENS = `
  mutation GetAuthTokensFromLoginToken($loginToken: String!, $origin: String!) {
    getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
      tokens {
        accessOrWorkspaceAgnosticToken {
          token
          expiresAt
        }
        refreshToken {
          token
          expiresAt
        }
      }
    }
  }
`;

const RENEW_TOKEN = `
  mutation RenewToken($appToken: String!) {
    renewToken(appToken: $appToken) {
      tokens {
        accessOrWorkspaceAgnosticToken {
          token
          expiresAt
        }
        refreshToken {
          token
          expiresAt
        }
      }
    }
  }
`;

const GET_AUTH_TOKENS_FROM_SSO = `
  mutation getAuthTokensFromSSOExchangeToken($ssoExchangeToken: String!) {
    getAuthTokensFromSSOExchangeToken(ssoExchangeToken: $ssoExchangeToken) {
      tokens {
        accessOrWorkspaceAgnosticToken {
          token
          expiresAt
        }
        refreshToken {
          token
          expiresAt
        }
      }
    }
  }
`;

const GET_AVAILABLE_WORKSPACES = `
  query GetAvailableWorkspacesForMobileAuth {
    currentUser {
      id
      email
      currentWorkspace {
        id
      }
      availableWorkspaces {
        availableWorkspacesForSignIn {
          id
          displayName
          loginToken
          workspaceUrls {
            subdomainUrl
            customUrl
          }
        }
        availableWorkspacesForSignUp {
          id
          displayName
          loginToken
          workspaceUrls {
            subdomainUrl
            customUrl
          }
        }
      }
    }
  }
`;

type GraphQlError = {
  message: string;
};

type GraphQlResponse<TData> = {
  data?: TData | null;
  errors?: GraphQlError[];
};

type AvailableWorkspace = {
  id: string;
  displayName?: string | null;
  loginToken?: string | null;
  workspaceUrls?: {
    subdomainUrl?: string | null;
    customUrl?: string | null;
  } | null;
};

const postMetadata = async <TData>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string,
): Promise<TData> => {
  // credentials:omit — OAuth WebView can leave a session cookie in the shared
  // jar; cookie auth without an allowed Origin trips CSRF_ORIGIN_MISMATCH.
  const response = await fetch(METADATA_URL, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Origin: AUTH_ORIGIN,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const rawBody = await response.text();
  let json: GraphQlResponse<TData>;

  try {
    json = JSON.parse(rawBody) as GraphQlResponse<TData>;
  } catch {
    throw new Error(
      `Auth API returned non-JSON (${response.status}). Check that ${METADATA_URL} routes to twenty-server.`,
    );
  }

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? 'GraphQL error');
  }

  if (!json.data) {
    throw new Error(
      `Empty GraphQL response (${response.status}): ${rawBody.slice(0, 180) || 'no body'}`,
    );
  }

  return json.data;
};

const tokensFromPair = (pair: {
  accessOrWorkspaceAgnosticToken: { token: string };
  refreshToken: { token: string };
}): AuthTokens => ({
  accessToken: pair.accessOrWorkspaceAgnosticToken.token,
  refreshToken: pair.refreshToken.token,
});

const workspaceOriginFromUrls = (
  workspaceUrls?: AvailableWorkspace['workspaceUrls'],
): string | null => {
  const rawUrl = workspaceUrls?.customUrl ?? workspaceUrls?.subdomainUrl;

  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
};

export const loginWithPassword = async ({
  email,
  password,
  origin,
}: {
  email: string;
  password: string;
  origin: string;
}): Promise<AuthTokens> => {
  const loginData = await postMetadata<{
    getLoginTokenFromCredentials: {
      loginToken: { token: string };
    };
  }>(GET_LOGIN_TOKEN, { email, password, origin });

  const loginToken =
    loginData.getLoginTokenFromCredentials.loginToken.token;

  const authData = await postMetadata<{
    getAuthTokensFromLoginToken: {
      tokens: {
        accessOrWorkspaceAgnosticToken: { token: string };
        refreshToken: { token: string };
      };
    };
  }>(GET_AUTH_TOKENS, { loginToken, origin });

  const tokens = tokensFromPair(
    authData.getAuthTokensFromLoginToken.tokens,
  );
  await tokenStorage.setTokens(tokens);
  return tokens;
};

export const renewAccessToken = async (
  refreshToken: string,
): Promise<AuthTokens> => {
  const data = await postMetadata<{
    renewToken: {
      tokens: {
        accessOrWorkspaceAgnosticToken: { token: string };
        refreshToken: { token: string };
      };
    };
  }>(RENEW_TOKEN, { appToken: refreshToken });

  const tokens = tokensFromPair(data.renewToken.tokens);
  await tokenStorage.setTokens(tokens);
  return tokens;
};

export const redeemSsoExchangeToken = async (
  ssoExchangeToken: string,
): Promise<AuthTokens> => {
  const data = await postMetadata<{
    getAuthTokensFromSSOExchangeToken: {
      tokens: {
        accessOrWorkspaceAgnosticToken: { token: string };
        refreshToken: { token: string };
      };
    };
  }>(GET_AUTH_TOKENS_FROM_SSO, { ssoExchangeToken });

  const tokens = tokensFromPair(
    data.getAuthTokensFromSSOExchangeToken.tokens,
  );
  await tokenStorage.setTokens(tokens);
  return tokens;
};

export const redeemLoginToken = async ({
  loginToken,
  origin,
}: {
  loginToken: string;
  origin: string;
}): Promise<AuthTokens> => {
  const authData = await postMetadata<{
    getAuthTokensFromLoginToken: {
      tokens: {
        accessOrWorkspaceAgnosticToken: { token: string };
        refreshToken: { token: string };
      };
    };
  }>(GET_AUTH_TOKENS, { loginToken, origin });

  const tokens = tokensFromPair(
    authData.getAuthTokensFromLoginToken.tokens,
  );
  await tokenStorage.setTokens(tokens);
  return tokens;
};

// SSO leaves a workspace-agnostic session; pick the first workspace loginToken
export const upgradeWorkspaceAgnosticSession = async (): Promise<AuthTokens> => {
  const existingTokens = await tokenStorage.getTokens();

  if (!existingTokens?.accessToken) {
    throw new Error('Missing session after SSO');
  }

  const data = await postMetadata<{
    currentUser: {
      id: string;
      currentWorkspace?: { id: string } | null;
      availableWorkspaces?: {
        availableWorkspacesForSignIn: AvailableWorkspace[];
        availableWorkspacesForSignUp: AvailableWorkspace[];
      } | null;
    };
  }>(GET_AVAILABLE_WORKSPACES, {}, existingTokens.accessToken);

  if (data.currentUser.currentWorkspace?.id) {
    return existingTokens;
  }

  const candidates = [
    ...(data.currentUser.availableWorkspaces?.availableWorkspacesForSignIn ??
      []),
    ...(data.currentUser.availableWorkspaces?.availableWorkspacesForSignUp ??
      []),
  ];

  const workspaceWithLoginToken = candidates.find(
    (workspace) =>
      typeof workspace.loginToken === 'string' &&
      workspace.loginToken.length > 0,
  );

  if (!workspaceWithLoginToken?.loginToken) {
    throw new Error(
      'Signed in, but no workspace is available yet. Open the web app once to finish workspace setup, then try again.',
    );
  }

  const origin = workspaceOriginFromUrls(workspaceWithLoginToken.workspaceUrls);

  if (!origin) {
    throw new Error(
      'Workspace URL missing from auth response. Try again or sign in with email.',
    );
  }

  return redeemLoginToken({
    loginToken: workspaceWithLoginToken.loginToken,
    origin,
  });
};

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      id
      email
      firstName
      lastName
      canImpersonate
      canAccessFullAdminPanel
      supportUserHash
      workspaceMember {
        id
        name {
          firstName
          lastName
        }
        colorScheme
        locale
        userEmail
      }
      workspaceMembers {
        id
        name {
          firstName
          lastName
        }
        userEmail
        avatarUrl
      }
      currentWorkspace {
        id
        displayName
        logo
        inviteHash
        isPublicInviteLinkEnabled
        workspaceMembersCount
        currentBillingSubscription {
          id
          status
          interval
          currentPeriodEnd
        }
      }
      currentUserWorkspace {
        id
        permissionFlags
      }
    }
  }
`;
