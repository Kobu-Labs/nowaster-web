/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./stories/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--pink-muted))",
        input:
          "linear-gradient(135deg, hsl(var(--pink-subtle)) 0%, hsl(var(--purple-subtle)) 100%)",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-gradient": "var(--background-gradient)",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pink: {
          primary: "hsl(var(--pink-primary))",
          muted: "hsl(var(--pink-muted))",
          subtle: "hsl(var(--pink-subtle))",
        },
        purple: {
          primary: "hsl(var(--purple-primary))",
          muted: "hsl(var(--purple-muted))",
          subtle: "hsl(var(--purple-subtle))",
        },
        gradient: {
          primary: "var(--gradient-primary)",
          secondary: "var(--gradient-secondary)",
          muted: "var(--gradient-muted)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
      },
      boxShadow: {
        "neon-pink":
          "0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        blink: {
          "0%, 100%": {
            opacity: 1,
          },
          "50%": {
            opacity: 0,
          },
        },
        "accordion-down": {
          from: {
            height: 0,
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: 0,
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "0.7",
            transform: "scale(0.98)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.03)",
          },
        },
        "border-pulse": {
          "0%, 100%": {
            borderColor: "hsl(var(--destructive) / 0.5)",
          },
          "50%": {
            borderColor: "hsl(var(--destructive))",
            boxShadow: "0 0 0 1px hsl(var(--destructive) / 0.3)",
          },
        },
      },
      animation: {
        blink: "blink 1s infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities, addComponents }) {
      const newUtilities = {
        ".text-shadow-neon-pink": {
          textShadow:
            "0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff",
        },
      };

      const newComponents = {
        ".gradient-card": {
          background: "var(--gradient-secondary)",
          borderColor: "hsl(var(--pink-muted))",
        },
        ".gradient-card-muted": {
          background: "var(--gradient-muted)",
          borderColor: "hsl(var(--pink-subtle))",
        },
        ".gradient-card-solid": {
          background: "var(--gradient-secondary-solid)",
          borderColor: "hsl(var(--pink-subtle))",
        },
        ".gradient-accent-bar": {
          background:
            "linear-gradient(180deg, hsl(var(--pink-primary)) 0%, hsl(var(--purple-primary)) 100%)",
        },
        ".gradient-text-hover": {
          transition: "all 0.3s ease",
          "&:hover": {
            background:
              "linear-gradient(135deg, hsl(var(--pink-primary)) 0%, hsl(var(--purple-primary)) 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          },
        },
        ".gradient-container": {
          background:
            "linear-gradient(135deg, hsl(var(--pink-muted)) 0%, hsl(var(--purple-muted)) 100%)",
        },
        ".gradient-container-subtle": {
          background:
            "linear-gradient(135deg, hsl(var(--pink-subtle)) 0%, hsl(var(--purple-subtle)) 100%)",
        },
        ".gradient-button": {
          background:
            "linear-gradient(135deg, hsl(var(--pink-primary)) 0%, hsl(var(--purple-primary)) 100%)",
          color: "white",
          border: "none",
          transition: "opacity 0.3s ease",
          "&:hover": {
            opacity: "0.9",
          },
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
      addComponents(newComponents);
    },
  ],
};
