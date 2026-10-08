const { getDefaultConfig } = require('expo/metro-config');

// Standalone Expo app (not part of the Twenty yarn workspaces).
const config = getDefaultConfig(__dirname);

module.exports = config;
