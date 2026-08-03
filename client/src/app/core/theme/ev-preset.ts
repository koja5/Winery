import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

// eVinarija brand palette, extracted from evinarija.com landing page:
// deep wine burgundy (primary) + sage/olive green (accent).
export const EvPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f7f2f3',
      100: '#ede0e3',
      200: '#dbc0c7',
      300: '#c59aa5',
      400: '#a76776',
      500: '#7d1f36',
      600: '#6b1b2f',
      700: '#591728',
      800: '#4a1422',
      900: '#3a111b',
      950: '#2c0e16'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#7d1f36',
          contrastColor: '#ffffff',
          hoverColor: '#591728',
          activeColor: '#4a1422'
        },
        surface: {
          0: '#ffffff',
          50: '#faf6f0',
          100: '#f3ece6',
          200: '#e2d5c5',
          300: '#c9b6a6',
          400: '#a78d80',
          500: '#7a6a5e',
          600: '#5c4f46',
          700: '#453b34',
          800: '#2a1f1a',
          900: '#1d1512',
          950: '#120d0b'
        }
      },
      dark: {
        primary: {
          color: '#e0899a',
          contrastColor: '#1b1512',
          hoverColor: '#eaa8b5',
          activeColor: '#f2c3cc'
        }
      }
    }
  }
});
