import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { registerOpenOAuthBrowser } from '@/auth/oauth-session';
import { authCallbackUrlHasToken } from '@/auth/parse-auth-callback-url';
import { useTheme } from '@/ui';
import { spacing } from '@/ui/theme';

export type OAuthBrowserOptions = {
  shouldComplete?: (url: string) => boolean;
};

type OAuthBrowserRequest = {
  authUrl: string;
  shouldComplete: (url: string) => boolean;
  resolve: (callbackUrl: string) => void;
  reject: (error: Error) => void;
};

type OAuthBrowserContextValue = {
  openOAuthBrowser: (
    authUrl: string,
    options?: OAuthBrowserOptions,
  ) => Promise<string>;
};

const OAuthBrowserContext = createContext<OAuthBrowserContextValue | null>(
  null,
);

const LOCATION_BRIDGE_JS = `
(function() {
  function post() {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(String(window.location.href));
      }
    } catch (error) {}
  }
  post();
  window.addEventListener('hashchange', post);
  window.addEventListener('popstate', post);
  true;
})();
`;

type OAuthBrowserHostProps = {
  children: React.ReactNode;
};

export const OAuthBrowserHost = ({ children }: OAuthBrowserHostProps) => {
  const theme = useTheme();
  const [request, setRequest] = useState<OAuthBrowserRequest | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const requestRef = useRef<OAuthBrowserRequest | null>(null);
  const settledRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCallbackUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const closeBrowser = useCallback(
    (finish: (activeRequest: OAuthBrowserRequest) => void) => {
      const activeRequest = requestRef.current;

      if (!activeRequest || settledRef.current) {
        return;
      }

      settledRef.current = true;
      requestRef.current = null;
      setIsCompleting(true);

      // Defer unmount — tearing down WKWebView mid-navigation crashes Expo Go
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      closeTimeoutRef.current = setTimeout(() => {
        setRequest(null);
        setIsCompleting(false);
        finish(activeRequest);
      }, 150);
    },
    [],
  );

  const settleSuccess = useCallback(
    (callbackUrl: string) => {
      closeBrowser((activeRequest) => {
        activeRequest.resolve(callbackUrl);
      });
    },
    [closeBrowser],
  );

  const settleCancel = useCallback(() => {
    pendingCallbackUrlRef.current = null;
    closeBrowser((activeRequest) => {
      activeRequest.reject(new Error('Sign-in cancelled'));
    });
  }, [closeBrowser]);

  const handleCandidateUrl = useCallback(
    (candidateUrl: string) => {
      const activeRequest = requestRef.current;

      if (!activeRequest?.shouldComplete(candidateUrl)) {
        return false;
      }

      if (settledRef.current) {
        return true;
      }

      pendingCallbackUrlRef.current = candidateUrl;
      settleSuccess(candidateUrl);
      return true;
    },
    [settleSuccess],
  );

  const openOAuthBrowser = useCallback(
    (authUrl: string, options?: OAuthBrowserOptions) => {
      settledRef.current = false;
      pendingCallbackUrlRef.current = null;
      setIsCompleting(false);

      return new Promise<string>((resolve, reject) => {
        const nextRequest: OAuthBrowserRequest = {
          authUrl,
          shouldComplete: options?.shouldComplete ?? authCallbackUrlHasToken,
          resolve,
          reject,
        };

        requestRef.current = nextRequest;
        setRequest(nextRequest);
      });
    },
    [],
  );

  useEffect(() => {
    registerOpenOAuthBrowser(openOAuthBrowser);

    return () => {
      registerOpenOAuthBrowser(null);
    };
  }, [openOAuthBrowser]);

  const handleShouldStartLoadWithRequest = useCallback(
    (navigation: ShouldStartLoadRequest) => {
      // Block the welcome SPA from loading so it cannot consume the one-time
      // SSO token before the native redeem call.
      if (handleCandidateUrl(navigation.url)) {
        return false;
      }

      return true;
    },
    [handleCandidateUrl],
  );

  const handleNavigationStateChange = useCallback(
    (navigation: WebViewNavigation) => {
      handleCandidateUrl(navigation.url);
    },
    [handleCandidateUrl],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleCandidateUrl(event.nativeEvent.data);
    },
    [handleCandidateUrl],
  );

  const value = useMemo(
    () => ({
      openOAuthBrowser,
    }),
    [openOAuthBrowser],
  );

  return (
    <OAuthBrowserContext.Provider value={value}>
      {children}
      <Modal
        visible={request !== null}
        animationType="slide"
        onRequestClose={settleCancel}
      >
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: theme.background.primary },
          ]}
        >
          <View style={styles.toolbar}>
            <Pressable
              onPress={settleCancel}
              hitSlop={12}
              disabled={isCompleting}
            >
              <Text style={[styles.close, { color: theme.text.primary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
          {request ? (
            <View style={styles.webviewWrap}>
              <WebView
                source={{ uri: request.authUrl }}
                style={[styles.webview, isCompleting && styles.hidden]}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loading}>
                    <ActivityIndicator color={theme.text.secondary} />
                  </View>
                )}
                setSupportMultipleWindows={false}
                // Keep OAuth cookies out of the app fetch jar (CSRF on metadata)
                sharedCookiesEnabled={false}
                thirdPartyCookiesEnabled={false}
                onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                onNavigationStateChange={handleNavigationStateChange}
                onMessage={handleMessage}
                injectedJavaScript={LOCATION_BRIDGE_JS}
              />
              {isCompleting ? (
                <View
                  style={[
                    styles.loading,
                    { backgroundColor: theme.background.primary },
                  ]}
                >
                  <ActivityIndicator color={theme.text.secondary} />
                  <Text
                    style={[styles.signingIn, { color: theme.text.secondary }]}
                  >
                    Signing in…
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </OAuthBrowserContext.Provider>
  );
};

export const useOAuthBrowser = (): OAuthBrowserContextValue => {
  const context = useContext(OAuthBrowserContext);

  if (!context) {
    throw new Error('useOAuthBrowser must be used within OAuthBrowserHost');
  }

  return context;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  close: {
    fontSize: 16,
    fontWeight: '600',
  },
  webviewWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
  },
  signingIn: {
    fontSize: 15,
  },
});
