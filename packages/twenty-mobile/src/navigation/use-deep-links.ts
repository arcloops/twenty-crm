import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

import { useAuth } from '@/auth/auth-context';

// twenty://object/:singular/:id and https://host/object/:singular/:id
const OBJECT_PATH_PATTERN =
  /(?:^|\/\/|\/)object\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/;

const parseObjectDeepLink = (
  url: string,
): { singular: string; id: string } | null => {
  const match = OBJECT_PATH_PATTERN.exec(url);
  if (!match) {
    return null;
  }

  return {
    singular: match[1],
    id: match[2],
  };
};

const navigateToObject = (singular: string, id: string) => {
  router.push({
    pathname: '/(app)/object/[singular]/[id]',
    params: { singular, id },
  });
};

export const useDeepLinks = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) {
        return;
      }

      const target = parseObjectDeepLink(url);
      if (!target) {
        return;
      }

      if (!isAuthenticated || isLoading) {
        pendingUrlRef.current = url;
        return;
      }

      navigateToObject(target.singular, target.id);
    };

    void Linking.getInitialURL().then(handleUrl);

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !pendingUrlRef.current) {
      return;
    }

    const target = parseObjectDeepLink(pendingUrlRef.current);
    pendingUrlRef.current = null;
    if (target) {
      navigateToObject(target.singular, target.id);
    }
  }, [isAuthenticated, isLoading]);
};
