import { isNonEmptyString } from '@sniptt/guards';

// Only allow app deep-link schemes — never open-redirect to https
export const isAllowedMobileAuthRedirectUri = (uri: string): boolean => {
  if (!isNonEmptyString(uri)) {
    return false;
  }

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

export const buildMobileAuthRedirectUrl = ({
  mobileRedirectUri,
  ssoExchangeToken,
  loginToken,
}: {
  mobileRedirectUri: string;
  ssoExchangeToken?: string;
  loginToken?: string;
}): string => {
  const url = new URL(mobileRedirectUri);

  if (isNonEmptyString(ssoExchangeToken)) {
    url.hash = `ssoExchangeToken=${ssoExchangeToken}`;
  }

  if (isNonEmptyString(loginToken)) {
    url.searchParams.set('loginToken', loginToken);
  }

  return url.toString();
};
