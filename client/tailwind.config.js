export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "sans-serif"]
      },
      colors: {
        ink: "#0d1117",
        panel: "#f4f6fb",
        line: "#e2e8f0",
        accent: "#5b6af9",
        "accent-hover": "#4757f5",
        surface: "#ffffff",
        muted: "#64748b"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(13, 17, 23, 0.08), 0 6px 16px rgba(13, 17, 23, 0.04)",
        sm: "0 1px 3px rgba(13, 17, 23, 0.06), 0 1px 2px rgba(13, 17, 23, 0.04)",
        md: "0 4px 16px rgba(13, 17, 23, 0.07), 0 2px 6px rgba(13, 17, 23, 0.04)",
        accent: "0 4px 20px rgba(91, 106, 249, 0.28)",
        "accent-lg": "0 8px 32px rgba(91, 106, 249, 0.36)"
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "24px"
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out forwards",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite"
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
};
