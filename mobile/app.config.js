// Use app.config.js so EAS Build can supply google-services.json via the
// GOOGLE_SERVICES_JSON file secret (path injected at build time).
// Fallback: ./google-services.json when the file is in the repo (e.g. local dev).
const { expo } = require('./app.json');

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? expo.android?.googleServicesFile ?? './google-services.json',
    },
  },
};
