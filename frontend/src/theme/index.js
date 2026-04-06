import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#5D87FF',
      light: '#ECF2FF',
      dark: '#4570EA',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#49BEFF',
      light: '#E8F7FF',
      dark: '#23afdb',
      contrastText: '#ffffff',
    },
    success: {
      main: '#13DEB9',
      light: '#E6FFFA',
      dark: '#02b3a9',
      contrastText: '#ffffff',
    },
    error: {
      main: '#FA896B',
      light: '#FDEDE8',
      dark: '#f3704d',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#FFAE1F',
      light: '#FEF5E5',
      dark: '#ae8e59',
      contrastText: '#ffffff',
    },
    info: {
      main: '#539BFF',
      light: '#EBF3FE',
      dark: '#1682d4',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f6f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#2A3547',
      secondary: '#5A6A85',
    },
    divider: '#e5eaef',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 7,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.04)',
    '0px 4px 8px rgba(0,0,0,0.06)',
    '0px 6px 12px rgba(0,0,0,0.06)',
    '0px 8px 16px rgba(0,0,0,0.06)',
    '0 9px 17.5px rgb(0,0,0,0.05)',
    '0px 12px 20px rgba(0,0,0,0.06)',
    '0px 14px 24px rgba(0,0,0,0.06)',
    '0px 16px 28px rgba(0,0,0,0.06)',
    '0px 18px 32px rgba(0,0,0,0.06)',
    '0px 20px 36px rgba(0,0,0,0.06)',
    '0px 22px 40px rgba(0,0,0,0.06)',
    '0px 24px 44px rgba(0,0,0,0.06)',
    '0px 26px 48px rgba(0,0,0,0.06)',
    '0px 28px 52px rgba(0,0,0,0.06)',
    '0px 30px 56px rgba(0,0,0,0.06)',
    '0px 32px 60px rgba(0,0,0,0.06)',
    '0px 34px 64px rgba(0,0,0,0.06)',
    '0px 36px 68px rgba(0,0,0,0.06)',
    '0px 38px 72px rgba(0,0,0,0.06)',
    '0px 40px 76px rgba(0,0,0,0.06)',
    '0px 42px 80px rgba(0,0,0,0.06)',
    '0px 44px 84px rgba(0,0,0,0.06)',
    '0px 46px 88px rgba(0,0,0,0.06)',
    '0px 48px 92px rgba(0,0,0,0.06)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          boxShadow: 'none',
          textTransform: 'capitalize',
          fontWeight: 600,
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          boxShadow: '0 9px 17.5px rgb(0,0,0,0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 7,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 7,
            '& fieldset': { borderColor: '#e5eaef' },
            '&:hover fieldset': { borderColor: '#5D87FF' },
            '&.Mui-focused fieldset': { borderColor: '#5D87FF' },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          '& fieldset': { borderColor: '#e5eaef' },
          '&:hover fieldset': { borderColor: '#5D87FF' },
          '&.Mui-focused fieldset': { borderColor: '#5D87FF' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
        colorPrimary: {
          '&.MuiChip-filledPrimary': {
            backgroundColor: '#ECF2FF',
            color: '#5D87FF',
          },
        },
      },
      variants: [
        {
          props: { variant: 'soft', color: 'primary' },
          style: {
            backgroundColor: '#ECF2FF',
            color: '#5D87FF',
          },
        },
        {
          props: { variant: 'soft', color: 'success' },
          style: {
            backgroundColor: '#E6FFFA',
            color: '#13DEB9',
          },
        },
        {
          props: { variant: 'soft', color: 'error' },
          style: {
            backgroundColor: '#FDEDE8',
            color: '#FA896B',
          },
        },
        {
          props: { variant: 'soft', color: 'warning' },
          style: {
            backgroundColor: '#FEF5E5',
            color: '#FFAE1F',
          },
        },
      ],
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 7,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 7px 30px 0 rgba(90,114,123,0.11)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f6f9fc',
          color: '#2A3547',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 7,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
  },
})

export default theme
