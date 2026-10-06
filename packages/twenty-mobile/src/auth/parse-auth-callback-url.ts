export type ParsedAuthCallback = {
  ssoExchangeToken?: string;
  loginToken?: string;
};

export const parseAuthCallbackUrl = (
  callbackUrl: string,
): ParsedAuthCallback => {
  try {
    const url = new URL(callbackUrl);
    const hashParams = new URLSearchParams(
      url.hash.startsWith('#') ? url.hash.slice(1) : url.hash,
    );
    const ssoExchangeToken =
      hashParams.get('ssoExchangeToken') ??
      url.searchParams.get('ssoExchangeToken') ??
      undefined;
    const loginToken =
      url.searchParams.get('loginToken') ??
      hashParams.get('loginToken') ??
      undefined;

    return { ssoExchangeToken, loginToken };
  } catch {
    return {};
  }
};

export const authCallbackUrlHasToken = (callbackUrl: string): boolean => {
  const { ssoExchangeToken, loginToken } = parseAuthCallbackUrl(callbackUrl);

  return Boolean(ssoExchangeToken || loginToken);
};
