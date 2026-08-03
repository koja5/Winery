import { definePreset } from '@primeng/themes';
import Material from '@primeng/themes/material';

// eVinarija brend paleta (bordo/vinska), na Material bazi (isti oblik/spacing
// PrimeNG komponenti kao eDestilerija — dugmad, tabela, paginacija), ali sa
// vinskom bojom umesto eDestilerija plave/indigo.
export const EvPreset = definePreset(Material, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px'
    }
  },
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
