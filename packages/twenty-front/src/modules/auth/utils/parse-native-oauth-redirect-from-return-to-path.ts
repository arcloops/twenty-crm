const NATIVE_OAUTH_RETURN_TO_PATH_PREFIX = '/--native-oauth/';

const isAllowedNativeAuthRedirectUri = (uri: string): boolean => {
  try {
    const url = new URL(uri);

    return (
      url.protocol === 'twenty:' ||
      url.protocol === 'exp:' ||
      url.protocol === 'exps:'
    );
  } catch {
    return false;
  }
};

export const parseNativeOAuthRedirectFromReturnToPath = (
  returnToPath: string | null | undefined,
): string | null => {
  if (
    !returnToPath ||
    !returnToPath.startsWith(NATIVE_OAUTH_RETURN_TO_PATH_PREFIX)
  ) {
    return null;
  }

  const encoded = returnToPath.slice(NATIVE_OAUTH_RETURN_TO_PATH_PREFIX.length);

  try {
    const redirectUri = encoded.includes('%')
      ? decodeURIComponent(encoded)
      : encoded;

    return isAllowedNativeAuthRedirectUri(redirectUri) ? redirectUri : null;
  } catch {
    return null;
  }
};
