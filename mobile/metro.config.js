// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Add parent directory to watchFolders so Metro can resolve shared code
config.watchFolders = [workspaceRoot];

// Update resolver to handle shared directory and fix module resolution
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  extraNodeModules: {
    '@shared': path.resolve(workspaceRoot, 'shared'),
  },
};

module.exports = config;
