import { createRequire } from 'node:module';
import { join } from 'node:path';

import { type ConfigContext } from 'expo/config';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
const privacyPolicyUrl =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ||
  'https://twenty.com/legal/privacy';

const mobilePackageJson = join(
  process.cwd().endsWith('twenty-mobile')
    ? process.cwd()
    : join(process.cwd(), 'packages/twenty-mobile'),
  'package.json',
);

const isSentryPackageInstalled = (): boolean => {
  try {
    createRequire(mobilePackageJson).resolve(
      '@sentry/react-native/package.json',
    );
    return true;
  } catch {
    return false;
  }
};

export default ({ config }: ConfigContext) => {
  const plugins: Array<string | [string, Record<string, unknown>]> = [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-document-picker',
    'expo-web-browser',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow Arcloops CRM to access your photos to scan business cards.',
        cameraPermission:
          'Allow Arcloops CRM to use the camera to photograph business cards.',
      },
    ],
  ];

  // Plugin only when DSN is set and the native package is actually installed
  if (sentryDsn && isSentryPackageInstalled()) {
    plugins.push([
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      },
    ]);
  }

  return {
    ...config,
    name: 'Arcloops CRM',
    slug: 'twenty-mobile',
    version: '0.1.0',
    orientation: 'portrait' as const,
    icon: './assets/images/icon.png',
    scheme: 'twenty',
    userInterfaceStyle: 'automatic' as const,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain' as const,
      backgroundColor: '#fcfcfc',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'io.arcloops.crm',
      infoPlist: {
        NSCameraUsageDescription:
          'Photograph front and back of business cards to create People.',
        NSPhotoLibraryUsageDescription:
          'Choose business card photos to create People.',
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['twenty'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
        backgroundColor: '#fcfcfc',
      },
      package: 'io.arcloops.crm',
      permissions: ['CAMERA', 'READ_MEDIA_IMAGES'],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'twenty',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro' as const,
      output: 'static' as const,
      favicon: './assets/images/favicon.png',
    },
    plugins,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      twentyApiUrl:
        process.env.EXPO_PUBLIC_TWENTY_API_URL ??
        'https://crm-api.arcloops.io',
      twentyOrigin:
        process.env.EXPO_PUBLIC_TWENTY_ORIGIN ?? 'https://crm.arcloops.io',
      privacyPolicyUrl,
      eas: {
        projectId: easProjectId || undefined,
      },
    },
  };
};
