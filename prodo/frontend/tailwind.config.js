/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System v4 — neutral (warm paper tones, overrides Tailwind defaults)
        neutral: {
          50: '#fdfdfc',
          100: '#f4f2ed',
          200: '#d4d2cc',
          300: '#d4d2cc',
          400: '#9CA3AF',
          500: '#6f6f69',
          700: '#374151',
          900: '#111827',
        },
        // Design System v4 — primary (blue accent)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          300: '#6A9EFA',
          500: '#3B82F6',
          600: '#2563EB',
          900: '#1D4ED8',
        },
        // Design System v4 — status (semantic)
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          destructive: '#EF4444',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"Courier New"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        xsmall: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'ai-panel': '0px 4px 8.4px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        card: '8px',
        button: '8px',
        pill: '24px',
      },
      spacing: {
        sidebar: '250px',
        'sidebar-collapsed': '64px',
        'details-panel': '320px',
        taskbar: '48px',
      },
    },
  },
  plugins: [],
};
