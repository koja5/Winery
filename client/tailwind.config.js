/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ev-primary': 'var(--ev-primary)',
        'ev-primary-soft': 'var(--ev-primary-soft)',
        'ev-primary-dark': 'var(--ev-primary-dark)',
        'ev-accent-green': 'var(--ev-accent-green)',
        'ev-bg': 'var(--ev-bg)',
        'ev-surface': 'var(--ev-surface)',
        'ev-ink': 'var(--ev-ink)',
        'ev-muted': 'var(--ev-muted)',
        'ev-line': 'var(--ev-line)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
