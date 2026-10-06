import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import {
  THEME_DARK,
  THEME_LIGHT,
  type ThemeColors,
} from '@/ui/theme';

const ThemeContext = createContext<ThemeColors>(THEME_LIGHT);

type ThemeProviderProps = {
  children: React.ReactNode;
};

const InnerThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemScheme = useColorScheme();
  const { user } = useAuth();
  const preference = user?.workspaceMember?.colorScheme ?? 'System';

  const theme = useMemo(() => {
    if (preference === 'Light') {
      return THEME_LIGHT;
    }
    if (preference === 'Dark') {
      return THEME_DARK;
    }
    return systemScheme === 'dark' ? THEME_DARK : THEME_LIGHT;
  }, [preference, systemScheme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// AuthProvider wraps this in root; when outside auth, fall back to system
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return <InnerThemeProvider>{children}</InnerThemeProvider>;
};

export const useTheme = () => useContext(ThemeContext);
