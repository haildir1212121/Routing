/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#faf9f8',
        'bg-secondary': '#fff',
        'border': '#e5e7eb',
        'text-primary': '#1a1a1a',
        'text-secondary': '#6b7280',
        'text-tertiary': '#9ca3af',
        'accent': '#D97757',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'tight': ['Inter Tight', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
