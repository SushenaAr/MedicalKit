import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#2e7d6b' },
    secondary: { main: '#5c6bc0' },
    background: { default: '#f4f7f6' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Roboto, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
  },
  components: {
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
})
