import { styled } from '@linaria/react';
import { gql } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useMutation } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isNonEmptyString } from '@sniptt/guards';
import { Section, useToast } from 'twenty-ui/components';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentUserState } from '@/auth/states/currentUserState';
import { PASSWORD_REGEX } from '@/auth/utils/passwordRegex';
import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const SET_CURRENT_USER_PASSWORD = gql`
  mutation SetCurrentUserPassword(
    $newPassword: String!
    $currentPassword: String
  ) {
    setCurrentUserPassword(
      newPassword: $newPassword
      currentPassword: $currentPassword
    ) {
      success
    }
  }
`;

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  max-width: 320px;
`;

export const SetOrChangePassword = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const currentUser = useAtomStateValue(currentUserState);
  const setCurrentUser = useSetAtomState(currentUserState);
  const [setCurrentUserPassword, { loading }] = useMutation(
    SET_CURRENT_USER_PASSWORD,
  );

  const hasPassword = currentUser?.hasPassword ?? false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const heading = hasPassword ? t`Change Password` : t`Set Password`;
  const description = hasPassword
    ? t`Change password`
    : t`Allow users to sign in with an email and password.`;

  const handleSubmit = async () => {
    if (!PASSWORD_REGEX.test(newPassword)) {
      enqueueToast({
        variant: 'error',
        children: t`Password must be between 8 and 50 characters`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      enqueueToast({
        variant: 'error',
        children: t`Passwords do not match`,
      });
      return;
    }

    if (hasPassword && !isNonEmptyString(currentPassword)) {
      enqueueToast({
        variant: 'error',
        children: t`Enter your current password`,
      });
      return;
    }

    try {
      const { data } = await setCurrentUserPassword({
        variables: {
          newPassword,
          ...(hasPassword ? { currentPassword } : {}),
        },
      });

      if (data?.setCurrentUserPassword?.success !== true) {
        enqueueToast({ variant: 'error', children: t`An error occurred.` });
        return;
      }

      if (currentUser) {
        setCurrentUser({ ...currentUser, hasPassword: true });
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      enqueueToast({
        variant: 'success',
        children: hasPassword
          ? t`Password has been updated`
          : t`Password has been set`,
      });
    } catch (error) {
      const graphqlMessage = CombinedGraphQLErrors.is(error)
        ? error.errors[0]?.message
        : undefined;

      enqueueToast({
        ...(getToastOptionsFromError({ error }) ?? {
          variant: 'error',
          children: t`An error occurred.`,
        }),
        ...(graphqlMessage ? { children: graphqlMessage } : {}),
      });
    }
  };

  return (
    <>
      <Section.Header title={heading} description={description} />
      <StyledFields>
        {hasPassword ? (
          <SettingsTextInput
            instanceId="settings-current-password"
            label={t`Password`}
            value={currentPassword}
            type="password"
            fullWidth
            onChange={setCurrentPassword}
          />
        ) : null}
        <SettingsTextInput
          instanceId="settings-new-password"
          label={t`New Password`}
          value={newPassword}
          type="password"
          fullWidth
          onChange={setNewPassword}
        />
        <SettingsTextInput
          instanceId="settings-confirm-password"
          label={t`Confirm`}
          value={confirmPassword}
          type="password"
          fullWidth
          onChange={setConfirmPassword}
        />
        <Button
          variant="outline"
          loading={loading}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {heading}
        </Button>
      </StyledFields>
    </>
  );
};
