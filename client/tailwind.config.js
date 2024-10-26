/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // or 'media' or 'class
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Adding new colors to the existing palette
      colors: {
        "custom-blue": "#635FC7",
        "custom-lightblue": "#A8A4FF",
        "custom-black": "#000112",
        "custom-lightblack": "#20212C",
        "custom-darkgray": "#2B2C37",
        "custom-gray": "#3E3F4E",
        "custom-lightgray": "#828FA3",
        "custom-darkwhite": "#E4EBFA",
        "custom-lightwhite": "#F4F7FD",
        "custom-white": "#FFFFFF",
        "custom-red": "#EA5555",
        "custom-lightred": "#FF9898",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        // Add other custom fonts here if necessary
      },
    },
    // Completely overriding the default color palette
    // This part should be moved outside of `extend` to directly under `theme` if you want to override the entire palette
    colors: {
      blue: "#007bff",
      pink: "#ff49db",
      red: {
        600: "#dc2626", // Ensure this color is defined
      },
    },
  },
  plugins: [],
};
