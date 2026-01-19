# Icon Generation Script

This directory contains scripts for generating app assets.

## Generate App Icons

To generate all required app icons from the source logo:

```bash
npm run generate-icons
```

This script generates the following icons in `mobile/assets/`:

- **icon.png** (1024x1024) - Main app icon for iOS and Android
- **adaptive-icon.png** (1024x1024) - Android adaptive icon with safe zone (80% of size)
- **splash-icon.png** (1024x1024) - Splash screen icon
- **favicon.png** (48x48) - Web favicon

### Source Logo

The script uses `public/assets/logo.png` as the source image. Ensure this file exists before running the script.

### Requirements

- Node.js
- `sharp` package (installed as dev dependency)

### Customization

To modify icon generation settings, edit `scripts/generate-icons.js`:

- **Brand colors**: Modify `BRAND_COLORS` object
- **Icon sizes**: Adjust size parameters in `generateIcon()` calls
- **Safe zone**: Toggle `safeZone` option for adaptive icons (default: 80%)

### Notes

- All icons use black (#000000) background to match app theme
- Android adaptive icons include a safe zone to prevent cropping on different device shapes
- Icons are generated in PNG format with transparency support
