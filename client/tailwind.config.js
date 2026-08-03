/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',

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
      fontFamily: {
        sans: ['Poppins', 'Nunito Sans', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        custom: '0 0 50px 0 rgba(82, 30, 45, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
