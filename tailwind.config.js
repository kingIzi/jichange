/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/tw-elements/dist/js/**/*.js",
  ],
  darkMode: "false",
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        //inter: ["Space Grotesk", "sans-serif"],
      },
      theme: "light",
      // colors: {
      //   //darkPurple: "#8196FE",
      //   darkPurple: "#0B6587",
      //   lightPurple: "#F3F5FE",
      //   lightYellow: "#FFFDEA",
      //   shadeGreenYellow: "#ADA334",
      //   jichangeDefault: "#F6F8FC",
      //   linkBlue: "#3E64D1",
      //   buttonBlue: "#2A4A85",
      //   contactDetails: "#2E93C3",
      //   loginRegister: "#E4A834",
      //   darkBlue: "#192356",
      // },
    },
  },
  plugins: [require("daisyui"), require("tw-elements/dist/plugin.cjs")],
  daisyui: {
    //themes: ["light"],
    themes: [
      {
        light: {
          primary: "#0B6587",
          secondary: "#F6F8FC",
          accent: "#00BCD4",
          neutral: "#ffffff",
          "base-100": "#F6F8FC",
          "base-200": "#e1f5fd",
        },
      },
      "coffee",
    ],
    darkTheme: true,
    styled: true,
  },
};
