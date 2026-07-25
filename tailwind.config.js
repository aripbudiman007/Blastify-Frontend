/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',  /* 20px — matches px-5 */
        sm:      '1.5rem',
        lg:      '2rem',
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1180px',   /* landing page width, aligned with max-w-[1180px] */
        '2xl':'1280px',
      },
    },
    extend: {
      fontFamily: {
        // Heading: Plus Jakarta Sans — opinionated, modern, legible at large sizes
        // Body:    Inter variable — industry standard for UI/SaaS legibility
        sans:    ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // sidebar dark palette
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          fg:      'hsl(var(--sidebar-fg))',
          muted:   'hsl(var(--sidebar-muted))',
          border:  'hsl(var(--sidebar-border))',
          active:  'hsl(var(--sidebar-active))',
        },
        // ── Blastify brand palette ────────────────────────────────────────────
        // Primary: Blastify Green #00C853 (Material Green A700)
        // Dark:    Deep Green    #1B5E20
        // Hero bg: Tech Charcoal #1A1A2E
        // Accent:  Electric Teal #00E5CC
        blastify: {
          50:  '#E8F5E9',  // badge/chip background
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#69F0AE',  // Material Green A200
          400: '#00E676',  // Material Green A400
          500: '#00C853',  // ← PRIMARY (Blastify Green)
          600: '#00B248',  // CTA hover / slightly darker
          700: '#007B2E',  // pressed state
          800: '#1B5E20',  // Deep Green — footer, dark surfaces
          900: '#1A1A2E',  // Tech Charcoal — hero bg, dark mode
          950: '#0F0F1A',  // deepest dark
        },
        // Teal accent: Electric Teal #00E5CC — gradient pair, icon hover
        teal: {
          50:  '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#00E5CC',  // ← Electric Teal (brand accent)
          600: '#00BFA5',
          700: '#00897B',
          800: '#00695C',
          900: '#004D40',
        },
        // wa alias → maps to Blastify brand for all existing component references
        wa: {
          50:  '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#69F0AE',
          400: '#00E676',
          500: '#00C853',  // Blastify Green
          600: '#00C853',  // PRIMARY — kept same as 500 for saturation
          700: '#00B248',  // hover/dark
          800: '#1B5E20',  // Deep Green
          900: '#1A1A2E',  // Charcoal
          950: '#0F0F1A',
        },
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.05)',
        'stat': '0 0 0 1px rgb(0 0 0 / 0.05), 0 2px 8px 0 rgb(0 0 0 / 0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'marquee': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.2s ease-out',
        'shimmer':        'shimmer 2s linear infinite',
        'marquee':        'marquee 22s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
