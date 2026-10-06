import { gql } from '@apollo/client';

export const UPDATE_WORKSPACE_MEMBER_SETTINGS = gql`
  mutation UpdateWorkspaceMemberSettings(
    $input: UpdateWorkspaceMemberSettingsInput!
  ) {
    updateWorkspaceMemberSettings(input: $input)
  }
`;

export type ColorSchemePreference = 'System' | 'Light' | 'Dark';

export type WorkspaceMemberSettingsUpdate = {
  name?: {
    firstName: string;
    lastName: string;
  };
  colorScheme?: ColorSchemePreference;
  locale?: string;
};

export const MOBILE_LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'es-ES', label: 'Español' },
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'zh-CN', label: '中文' },
  { code: 'nl-NL', label: 'Nederlands' },
] as const;
