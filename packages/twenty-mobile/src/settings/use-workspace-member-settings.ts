import { useCallback, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import {
  UPDATE_WORKSPACE_MEMBER_SETTINGS,
  type WorkspaceMemberSettingsUpdate,
} from '@/settings/queries';

export const useWorkspaceMemberSettings = () => {
  const { apolloClients, user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaceMemberId = user?.workspaceMember?.id;

  const updateSettings = useCallback(
    async (update: WorkspaceMemberSettingsUpdate) => {
      if (!apolloClients || !workspaceMemberId) {
        throw new Error('Not signed in');
      }

      setIsSaving(true);
      setError(null);

      try {
        const result = await apolloClients.metadataClient.mutate<{
          updateWorkspaceMemberSettings: boolean;
        }>({
          mutation: UPDATE_WORKSPACE_MEMBER_SETTINGS,
          variables: {
            input: {
              workspaceMemberId,
              update,
            },
          },
        });

        if (result.data?.updateWorkspaceMemberSettings !== true) {
          throw new Error('Failed to save settings');
        }

        await refreshUser();
      } catch (saveError) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : 'Failed to save settings';
        setError(message);
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [apolloClients, refreshUser, workspaceMemberId],
  );

  return {
    isSaving,
    error,
    updateSettings,
  };
};
