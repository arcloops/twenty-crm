import { useCallback } from 'react';
import { useLingui } from '@lingui/react';

export const useMobileT = () => {
  const { i18n } = useLingui();

  return useCallback((message: string) => i18n._(message), [i18n]);
};
