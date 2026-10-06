import {
  buildMobileAuthRedirectUrl,
  isAllowedMobileAuthRedirectUri,
} from 'src/engine/core-modules/auth/utils/build-mobile-auth-redirect-url.util';

describe('isAllowedMobileAuthRedirectUri', () => {
  it('allows twenty and expo schemes', () => {
    expect(isAllowedMobileAuthRedirectUri('twenty://oauth')).toBe(true);
    expect(
      isAllowedMobileAuthRedirectUri('exp://127.0.0.1:8081/--/oauth'),
    ).toBe(true);
    expect(isAllowedMobileAuthRedirectUri('exps://u.expo.dev/oauth')).toBe(
      true,
    );
  });

  it('rejects https open redirects', () => {
    expect(
      isAllowedMobileAuthRedirectUri('https://evil.example/phish'),
    ).toBe(false);
    expect(isAllowedMobileAuthRedirectUri('')).toBe(false);
  });
});

describe('buildMobileAuthRedirectUrl', () => {
  it('puts sso exchange token in the hash', () => {
    expect(
      buildMobileAuthRedirectUrl({
        mobileRedirectUri: 'twenty://oauth',
        ssoExchangeToken: 'token-1',
      }),
    ).toBe('twenty://oauth#ssoExchangeToken=token-1');
  });

  it('puts login token in the query string', () => {
    expect(
      buildMobileAuthRedirectUrl({
        mobileRedirectUri: 'twenty://oauth',
        loginToken: 'login-1',
      }),
    ).toBe('twenty://oauth?loginToken=login-1');
  });
});
