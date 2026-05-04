/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — warm taupe neutrals (do not replace with cool greys)
        neutral: {
          50:  '#F6F4F4',
          100: '#E9E5E4',
          200: '#D5CFCE',
          300: '#C1B9B8',
          400: '#ADA2A1',
          500: '#938A89',
          600: '#7E7675',
          700: '#686160',
          800: '#524C4B',
          900: '#3D3837',
          950: '#1A1716',
        },
        primary: {
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },

        // ── Color System v1 — status tokens ──
        ok:   { bg: '#DCFCE7', fg: '#166534', solid: '#22C55E' },
        info: { bg: '#DBEAFE', fg: '#1E40AF', solid: '#3B82F6' },
        warn: { bg: '#FEF3C7', fg: '#92400E', solid: '#F59E0B' },
        hot:  { bg: '#FFEDD5', fg: '#9A3412', solid: '#EA580C' },
        bad:  { bg: '#FEE2E2', fg: '#991B1B', solid: '#EF4444' },

        // ── Color System v1 — chart series ──
        series: {
          1: '#6366F1',
          2: '#14B8A6',
          3: '#EC4899',
          4: '#8B5CF6',
          5: '#F59E0B',
          planned: '#9CA3AF',
        },

        // ── Color System v1 — foundation aliases ──
        surface:  '#FFFFFF',
        canvas:   '#F6F4F4',
        subtle:   '#FBFAFA',
      },
      fontFamily: {
        sans:  ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono:  ['"Geist Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['9px',  { lineHeight: '12px' }],
        'xs':  ['10px', { lineHeight: '14px' }],
        'sm':  ['11px', { lineHeight: '16px' }],
        'md':  ['12px', { lineHeight: '16px' }],
        'base':['14px', { lineHeight: '20px' }],
        'lg':  ['16px', { lineHeight: '22px' }],
        'xl':  ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
      },
      borderRadius: {
        sm:   '3px',
        md:   '5px',
        lg:   '8px',
        xl:   '12px',
        full: '9999px',
        card: '8px',
      },
      boxShadow: {
        xsmall: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
