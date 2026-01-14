/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Luxury color palette matching web app
        gold: {
          DEFAULT: "#F4C464",
          light: "#F5D085",
          dark: "#D4A854",
        },
        "rainy-grey": "#A4A4A4",
        "steel-wool": "#777674",
        "dark-green": "#14241F",
        nero: "#262625",
        "cursed-black": "#000000",
        // Dark theme colors
        background: "#000000",
        foreground: "#FFFFFF",
        card: "#262625",
        "card-foreground": "#FFFFFF",
        border: "#777674",
        input: "#777674",
        primary: "#F4C464",
        "primary-foreground": "#000000",
        secondary: "#777674",
        "secondary-foreground": "#FFFFFF",
        muted: "#777674",
        "muted-foreground": "#A4A4A4",
        accent: "#262625",
        "accent-foreground": "#F4C464",
        destructive: "#FF0000",
        "destructive-foreground": "#FFFFFF",
      },
    },
  },
  plugins: [],
};
