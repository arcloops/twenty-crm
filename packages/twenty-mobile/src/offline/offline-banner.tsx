import React from 'react';

import { BannerStrip } from '@/banners/banner-strip';
import { useMobileT } from '@/i18n/use-mobile-t';
import { useNetworkStatus } from '@/offline/use-network-status';

type OfflineBannerProps = {
  isFromCache?: boolean;
};

export const OfflineBanner = ({ isFromCache = false }: OfflineBannerProps) => {
  const t = useMobileT();
  const { isOffline } = useNetworkStatus();

  if (!isOffline && !isFromCache) {
    return null;
  }

  return <BannerStrip message={t('Offline · showing cached data')} />;
};
