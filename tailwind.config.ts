import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        brandDark: "#2E0700",
        brandDarker: "#2D0500",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(to right, #2E0700, #2D0500)",
      },
    },
  },
  plugins: [],
}

export default config
