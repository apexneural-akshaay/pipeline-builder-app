/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    fontSize: {
      "2xs": ["0.625rem", { lineHeight: "1.4" }],
      xs:    ["0.6875rem", { lineHeight: "1.45" }],
      sm:    ["0.8125rem", { lineHeight: "1.5" }],
      base:  ["0.875rem", { lineHeight: "1.5" }],
      md:    ["0.9375rem", { lineHeight: "1.5" }],
      lg:    ["1.0625rem", { lineHeight: "1.4" }],
      xl:    ["1.25rem", { lineHeight: "1.35" }],
      "2xl": ["1.5rem", { lineHeight: "1.3" }],
      "3xl": ["1.875rem", { lineHeight: "1.25" }],
    },
    extend: {
      fontFamily: {
        sans:      ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono:      ["JetBrains Mono", "Fira Code", "Cascadia Code", "monospace"],
      },
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          disabled:  "var(--text-disabled)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          muted:   "var(--accent-muted)",
        },
        success: {
          DEFAULT: "var(--success)",
          muted:   "var(--success-muted)",
          border:  "var(--success-border)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          muted:   "var(--warning-muted)",
          border:  "var(--warning-border)",
        },
        error: {
          DEFAULT: "var(--error)",
          muted:   "var(--error-muted)",
          border:  "var(--error-border)",
        },
        info: {
          DEFAULT: "var(--info)",
          muted:   "var(--info-muted)",
          border:  "var(--info-border)",
        },
        stage: {
          dataset:         "var(--stage-dataset)",
          train:           "var(--stage-train)",
          inference:       "var(--stage-inference)",
          "output-review": "var(--stage-output-review)",
          retrain:         "var(--stage-retrain)",
          evaluation:      "var(--stage-evaluation)",
          promotion:       "var(--stage-promotion)",
        },
        border: {
          DEFAULT:  "var(--border-default)",
          subtle:   "var(--border-subtle)",
          emphasis: "var(--border-emphasis)",
          accent:   "var(--border-accent)",
        },
      },
      borderRadius: {
        card:   "var(--radius-card)",
        button: "var(--radius-button)",
        badge:  "var(--radius-badge)",
        input:  "var(--radius-input)",
        modal:  "var(--radius-modal)",
      },
      boxShadow: {
        card:         "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        dropdown:     "var(--shadow-dropdown)",
        modal:        "var(--shadow-modal)",
      },
      animation: {
        "fade-in":        "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "slide-in-up":    "slide-in-up 0.2s ease-out",
        "pulse-subtle":   "pulse-subtle 2s infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to:   { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-up": {
          from: { transform: "translateY(4px)", opacity: "0" },
          to:   { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("tailwindcss-animate"),
  ],
};
