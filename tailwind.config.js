/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        darkPurple: "#8196FE",
        lightPurple: "#F3F5FE",
        lightYellow: "#FFFDEA",
        shadeGreenYellow: "#ADA334",
        jichangeDefault: "#F6F8FC",
        linkBlue: "#3E64D1",
        buttonBlue: "#2A4A85",
        contactDetails: "#2E93C3",
        loginRegister: "#E4A834",
        darkBlue: "#192356",
      },
    },
  },
  plugins: [require("daisyui"), require("tw-elements/dist/plugin.cjs")],
  daisyui: {
    themes: ["light"],
  },
};

// require("daisyui")
