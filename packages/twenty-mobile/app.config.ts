import { createRequire } from 'node:module';
import { join } from 'node:path';

import { type ConfigContext } from 'expo/config';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
// Public Expo project id — hardcoded so `eas` can link without writing dynamic config
const EAS_PROJECT_ID = '5821493b-0911-4b52-9f15-b8e241e40f8f';
const easProjectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || EAS_PROJECT_ID;
const privacyPolicyUrl =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ||
  'https://www.arcloops.ai/privacy';

const isSentryPackageInstalled = (): boolean => {
  try {
    // Always run Expo / EAS from this package directory
    createRequire(join(process.cwd(), 'package.json')).resolve(
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
    version: '1.0.0',
    orientation: 'portrait' as const,
    icon: './assets/images/icon.png',
    scheme: 'twenty',
    userInterfaceStyle: 'automatic' as const,
    primaryColor: '#38393B',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain' as const,
      backgroundColor: '#38393B',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'io.arcloops.crm',
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        CADisableMinimumFrameDurationOnPhone: true,
        ITSAppUsesNonExemptEncryption: false,
        UISupportedInterfaceOrientations: [
          'UIInterfaceOrientationPortrait',
        ],
        'UISupportedInterfaceOrientations~ipad': [
          'UIInterfaceOrientationPortrait',
          'UIInterfaceOrientationPortraitUpsideDown',
        ],
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
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
        backgroundColor: '#38393B',
      },
      package: 'io.arcloops.crm',
      permissions: ['CAMERA', 'READ_MEDIA_IMAGES'],
      blockedPermissions: [
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
      ],
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
        projectId: easProjectId,
      },
    },
  };
};
