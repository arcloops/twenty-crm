type SentryUser = {
  id: string;
  email?: string | null;
};

type SentryModule = {
  init: (options: {
    dsn: string;
    enabled?: boolean;
    tracesSampleRate?: number;
    enableNative?: boolean;
  }) => void;
  setUser: (user: SentryUser | null) => void;
};

const getSentryDsn = (): string | undefined => {
  const fromEnv = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : undefined;
};

const loadSentry = (): SentryModule | null => {
  try {
    // Soft optional — package is only required when DSN is configured for store builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/react-native') as SentryModule;
  } catch {
    return null;
  }
};

let sentry: SentryModule | null = null;
let didInit = false;

const ensureSentry = (): SentryModule | null => {
  if (didInit) {
    return sentry;
  }

  didInit = true;
  const dsn = getSentryDsn();
  if (!dsn) {
    return null;
  }

  sentry = loadSentry();
  if (!sentry) {
    return null;
  }

  sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: 0.1,
  });

  return sentry;
};

export const initSentry = () => {
  ensureSentry();
};

export const setSentryUser = (user: SentryUser | null) => {
  const client = ensureSentry();
  if (!client) {
    return;
  }

  client.setUser(user);
};
