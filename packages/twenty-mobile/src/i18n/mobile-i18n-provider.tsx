import React, { useEffect } from 'react';
import { I18nProvider } from '@lingui/react';

import { useAuth } from '@/auth/auth-context';
import { activateLocale, i18n } from '../../locales';

type MobileI18nProviderProps = {
  children: React.ReactNode;
};

export const MobileI18nProvider = ({ children }: MobileI18nProviderProps) => {
  const { user } = useAuth();
  const locale = user?.workspaceMember?.locale ?? 'en';

  useEffect(() => {
    activateLocale(locale);
  }, [locale]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
};
