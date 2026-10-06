import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApolloProvider } from '@apollo/client';

import {
  createApolloClients,
  type ApolloClients,
} from '@/api/apollo-clients';
import { GET_CURRENT_USER, loginWithPassword } from '@/auth/auth-service';
import {
  signInWithSocialProvider,
  type SocialAuthProvider,
} from '@/auth/oauth-session';
import { tokenStorage } from '@/auth/token-storage';
import { AUTH_ORIGIN } from '@/config/env';
import { setSentryUser } from '@/monitoring/sentry';

export type WorkspaceMemberSummary = {
  id: string;
  name?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  colorScheme?: string | null;
  locale?: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  currentWorkspace?: {
    id: string;
    displayName?: string | null;
    logo?: string | null;
    inviteHash?: string | null;
    isPublicInviteLinkEnabled?: boolean | null;
    workspaceMembersCount?: number | null;
    currentBillingSubscription?: {
      id?: string | null;
      status?: string | null;
      interval?: string | null;
      currentPeriodEnd?: string | null;
    } | null;
  } | null;
  workspaceMember?: WorkspaceMemberSummary | null;
  workspaceMembers?: WorkspaceMemberSummary[] | null;
  currentUserWorkspace?: {
    id?: string | null;
    permissionFlags?: string[] | null;
  } | null;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: CurrentUser | null;
  apolloClients: ApolloClients | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setOptimisticWorkspaceMember: (
    patch: Partial<WorkspaceMemberSummary>,
  ) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [apolloClients, setApolloClients] = useState<ApolloClients | null>(
    null,
  );

  const tearDownSession = useCallback(async () => {
    setSentryUser(null);
    await tokenStorage.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setApolloClients(null);
  }, []);

  const handleAuthFailure = useCallback(() => {
    void tearDownSession();
  }, [tearDownSession]);

  const bootstrapAfterTokens = useCallback(async () => {
    const clients = createApolloClients({
      onAuthFailure: handleAuthFailure,
    });
    setApolloClients(clients);
    const result = await clients.metadataClient.query<{
      currentUser: CurrentUser;
    }>({
      query: GET_CURRENT_USER,
    });

    if (!result.data.currentUser.currentWorkspace?.id) {
      await tearDownSession();
      throw new Error(
        'Signed in, but no workspace is selected. Finish workspace selection on the web app, then try again.',
      );
    }

    setUser(result.data.currentUser);
    setSentryUser({
      id: result.data.currentUser.id,
      email: result.data.currentUser.email,
    });
    setIsAuthenticated(true);
  }, [handleAuthFailure, tearDownSession]);

  const refreshUser = useCallback(async () => {
    const clients =
      apolloClients ??
      createApolloClients({
        onAuthFailure: handleAuthFailure,
      });

    if (!apolloClients) {
      setApolloClients(clients);
    }

    const result = await clients.metadataClient.query<{
      currentUser: CurrentUser;
    }>({
      query: GET_CURRENT_USER,
    });
    setUser(result.data.currentUser);
    setSentryUser({
      id: result.data.currentUser.id,
      email: result.data.currentUser.email,
    });
    setIsAuthenticated(true);
  }, [apolloClients, handleAuthFailure]);

  const setOptimisticWorkspaceMember = useCallback(
    (patch: Partial<WorkspaceMemberSummary>) => {
      setUser((current) => {
        if (!current?.workspaceMember) {
          return current;
        }

        return {
          ...current,
          workspaceMember: {
            ...current.workspaceMember,
            ...patch,
          },
        };
      });
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await loginWithPassword({
        email: email.trim(),
        password,
        origin: AUTH_ORIGIN,
      });
      await bootstrapAfterTokens();
    },
    [bootstrapAfterTokens],
  );

  const signInWithProvider = useCallback(
    async (provider: SocialAuthProvider) => {
      await signInWithSocialProvider(provider);
      await bootstrapAfterTokens();
    },
    [bootstrapAfterTokens],
  );

  const signInWithMicrosoft = useCallback(
    () => signInWithProvider('microsoft'),
    [signInWithProvider],
  );

  const signInWithGoogle = useCallback(
    () => signInWithProvider('google'),
    [signInWithProvider],
  );

  const signOut = useCallback(async () => {
    await tearDownSession();
  }, [tearDownSession]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const tokens = await tokenStorage.getTokens();
        if (!tokens) {
          setIsAuthenticated(false);
          return;
        }

        await bootstrapAfterTokens();
      } catch {
        await tearDownSession();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [bootstrapAfterTokens, tearDownSession]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      apolloClients,
      signIn,
      signInWithMicrosoft,
      signInWithGoogle,
      signOut,
      refreshUser,
      setOptimisticWorkspaceMember,
    }),
    [
      isLoading,
      isAuthenticated,
      user,
      apolloClients,
      signIn,
      signInWithMicrosoft,
      signInWithGoogle,
      signOut,
      refreshUser,
      setOptimisticWorkspaceMember,
    ],
  );

  if (!apolloClients) {
    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <ApolloProvider client={apolloClients.coreClient}>
        {children}
      </ApolloProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const hasWorkflowsPermission = (user: CurrentUser | null): boolean =>
  user?.currentUserWorkspace?.permissionFlags?.includes('WORKFLOWS') === true;

export const hasWorkspaceMembersPermission = (
  user: CurrentUser | null,
): boolean =>
  user?.currentUserWorkspace?.permissionFlags?.includes('WORKSPACE_MEMBERS') ===
  true;

export const hasWorkspacePermission = (user: CurrentUser | null): boolean =>
  user?.currentUserWorkspace?.permissionFlags?.includes('WORKSPACE') === true;

export const hasApiKeysPermission = (user: CurrentUser | null): boolean =>
  user?.currentUserWorkspace?.permissionFlags?.includes(
    'API_KEYS_AND_WEBHOOKS',
  ) === true;

export const hasRolesPermission = (user: CurrentUser | null): boolean =>
  user?.currentUserWorkspace?.permissionFlags?.includes('ROLES') === true;
