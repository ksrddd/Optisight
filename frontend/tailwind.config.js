/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        // Ground: deep neutral zinc. Nothing here is tinted toward a hue —
        // colour in this console is reserved for severity alone.
        surface: {
          base: '#09090b',
          raised: '#0e0e11',
          panel: '#121216',
          overlay: '#17171c',
          input: '#1a1a1f',
          hover: '#1f1f25'
        },
        line: {
          faint: '#1c1c1f',
          DEFAULT: '#27272a',
          strong: '#3f3f46'
        },
        ink: {
          primary: '#fafafa',
          secondary: '#a1a1aa', // 7.75:1 on base
          muted: '#8a8a93', //  5.82:1 on base
          faint: '#5c5c66' // decorative / disabled only, never body copy
        },
        sev: {
          critical: '#ef4444', // 5.29:1 on base
          high: '#f59e0b', // 9.26:1
          medium: '#eab308', // 10.4:1
          low: '#10b981', // 7.10:1
          info: '#8a8a93'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      fontSize: {
        // A console needs steps below Tailwind's floor. Line-heights are fixed
        // pixel values so virtualised rows can rely on an exact row height.
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '22px' }],
        xl: ['20px', { lineHeight: '26px', letterSpacing: '-0.02em' }],
        '2xl': ['26px', { lineHeight: '30px', letterSpacing: '-0.025em' }],
        '3xl': ['32px', { lineHeight: '36px', letterSpacing: '-0.03em' }]
      },
      transitionDuration: {
        DEFAULT: '120ms',
        fast: '80ms'
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      spacing: {
        sidebar: '216px',
        rail: '320px',
        // Sized so a 16-byte hexdump line (offset + hex + ASCII = 75 mono
        // characters) fits without horizontal scrolling.
        drawer: '540px',
        row: '32px'
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '5px',
        lg: '6px'
      }
    }
  },
  plugins: []
}
