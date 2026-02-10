const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Enables R8 code shrinking and minification in Android release builds so that:
 * 1. A mapping file is generated for deobfuscation of crash/ANR stack traces.
 * 2. The mapping file is included in the AAB; Play Console receives it on upload.
 * 3. App size can be reduced (R8 shrinks and obfuscates code).
 *
 * See: https://developer.android.com/build/shrink-code
 * See: https://support.google.com/googleplay/android-developer/answer/9848633
 */
function withAndroidR8Deobfuscation(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const setProp = (key, value) => {
      const idx = props.findIndex((p) => p.type === 'property' && p.key === key);
      const entry = { type: 'property', key, value: String(value) };
      if (idx >= 0) {
        props[idx] = entry;
      } else {
        props.push(entry);
      }
    };
    setProp('android.enableMinifyInReleaseBuilds', 'true');
    setProp('android.enableShrinkResourcesInReleaseBuilds', 'true');
    return config;
  });
}

module.exports = withAndroidR8Deobfuscation;
