const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Expo monorepo: watch the workspace, resolve deps from app then root
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Keep NetInfo resolvable when Metro's project root is the monorepo root
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@react-native-community/netinfo': path.resolve(
    projectRoot,
    'node_modules/@react-native-community/netinfo',
  ),
};

module.exports = config;
