module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0077B5", // LinkedIn Blue
        secondary: "#434649", // Slate Gray
        accent: "#86888A", // Cool Gray
        neutral: "#FFFFFF", // White
        lightgray: "#F3F6F8", // Light Gray
        darkblue: "#005587", // Darker hover state for buttons
        bordergray: "#E1E9EE", // Border color for cards and modals
      },
      fontFamily: {
        heading: ["Roboto", "sans-serif"], // Headings
        body: ["Arial", "sans-serif"], // Body Text
      },
      boxShadow: {
        card: "0 4px 10px rgba(0, 0, 0, 0.1)", // Slight shadow for cards and modals
      },
    },
  },
  plugins: [],
};
