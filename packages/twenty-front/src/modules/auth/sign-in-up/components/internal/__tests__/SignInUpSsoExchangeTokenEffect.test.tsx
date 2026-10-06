import { render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';

import { SignInUpSsoExchangeTokenEffect } from '@/auth/sign-in-up/components/internal/SignInUpSsoExchangeTokenEffect';

const redeemSsoExchangeTokenMock = jest.fn();

jest.mock('@/auth/hooks/useRedeemSsoExchangeToken', () => ({
  useRedeemSsoExchangeToken: () => ({
    redeemSsoExchangeToken: redeemSsoExchangeTokenMock,
  }),
}));

const SearchParamsProbe = () => {
  const [searchParams] = useSearchParams();

  return <div data-testid="search-params">{searchParams.toString()}</div>;
};

// BrowserRouter because the effect reads and strips window.location, which
// MemoryRouter never touches
const renderEffect = (initialUrl: string) => {
  window.history.replaceState(null, '', initialUrl);

  return render(
    <StrictMode>
      <BrowserRouter>
        <SignInUpSsoExchangeTokenEffect />
        <SearchParamsProbe />
      </BrowserRouter>
    </StrictMode>,
  );
};

const getSearchParams = () => screen.getByTestId('search-params').textContent;

describe('SignInUpSsoExchangeTokenEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('redeems the single use token at most once', async () => {
    renderEffect('/sign-in-up#ssoExchangeToken=sso-exchange-token');

    await waitFor(() => {
      expect(redeemSsoExchangeTokenMock).toHaveBeenCalledWith(
        'sso-exchange-token',
      );
    });
    expect(redeemSsoExchangeTokenMock).toHaveBeenCalledTimes(1);
  });

  it('strips the token from the url while keeping returnToPath', async () => {
    renderEffect(
      '/sign-in-up?returnToPath=%2Fsettings%2Fprofile#ssoExchangeToken=sso-exchange-token',
    );

    await waitFor(() => {
      expect(window.location.hash).toBe('');
    });
    expect(getSearchParams()).toBe('returnToPath=%2Fsettings%2Fprofile');
    expect(redeemSsoExchangeTokenMock).toHaveBeenCalledTimes(1);
  });

  it('deep-links to the native app instead of redeeming on web', async () => {
    const replaceSpy = jest.fn();
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace: replaceSpy,
      },
    });

    const returnToPath = `/--native-oauth/${encodeURIComponent('exp://127.0.0.1:8081/--/oauth')}`;
    const url = new URL('https://crm.arcloops.io/welcome');
    url.searchParams.set('returnToPath', returnToPath);
    url.hash = 'ssoExchangeToken=sso-exchange-token';

    renderEffect(`${url.pathname}${url.search}${url.hash}`);

    await waitFor(() => {
      expect(replaceSpy).toHaveBeenCalled();
    });

    const deepLink = String(replaceSpy.mock.calls[0]?.[0]);
    expect(deepLink).toContain('exp://127.0.0.1:8081/--/oauth');
    expect(deepLink).toContain('ssoExchangeToken=sso-exchange-token');
    expect(redeemSsoExchangeTokenMock).not.toHaveBeenCalled();

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('does nothing when the url carries no token', () => {
    renderEffect('/sign-in-up');

    expect(redeemSsoExchangeTokenMock).not.toHaveBeenCalled();
    expect(getSearchParams()).toBe('');
  });
});
