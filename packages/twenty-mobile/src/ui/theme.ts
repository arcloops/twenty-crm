export type ThemeColors = {
  name: 'light' | 'dark';
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverted: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverted: string;
    danger: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  accent: {
    primary: string;
    soft: string;
  };
  danger: string;
};

export const spacing = (multiplicator: number) => multiplicator * 4;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
};

export const THEME_LIGHT: ThemeColors = {
  name: 'light',
  background: {
    primary: '#fcfcfc',
    secondary: '#f9f9f9',
    tertiary: '#f0f0f0',
    inverted: '#1c1c1c',
  },
  text: {
    primary: '#1c1c1c',
    secondary: '#636363',
    tertiary: '#8f8f8f',
    inverted: '#fcfcfc',
    danger: '#e5484d',
  },
  border: {
    primary: '#e8e8e8',
    secondary: '#d9d9d9',
  },
  accent: {
    primary: '#3e63dd',
    soft: '#edf2fe',
  },
  danger: '#e5484d',
};

export const THEME_DARK: ThemeColors = {
  name: 'dark',
  background: {
    primary: '#111111',
    secondary: '#191919',
    tertiary: '#222222',
    inverted: '#eeeeee',
  },
  text: {
    primary: '#eeeeee',
    secondary: '#a0a0a0',
    tertiary: '#7b7b7b',
    inverted: '#111111',
    danger: '#ff6369',
  },
  border: {
    primary: '#2e2e2e',
    secondary: '#3e3e3e',
  },
  accent: {
    primary: '#849dff',
    soft: '#1c2438',
  },
  danger: '#ff6369',
};
