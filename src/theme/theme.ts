"use client";
import { createTheme } from "@mui/material/styles";

// Спокойная изумрудная гамма с тёплым золотым акцентом.
// Остальные стили (шапка, меню, футер) берут цвета отсюда через CSS-переменные --mui-*.
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#15805f",
      light: "#e5f3ed",
      dark: "#0c5c44",
      contrastText: "#ffffff",
    },
    secondary: { main: "#e2a336", contrastText: "#2a1d05" },
    success: { main: "#2f8f5b" },
    error: { main: "#d14a4a" },
    warning: { main: "#e09b2d" },
    info: { main: "#3b7dd8" },
    background: { default: "#f4f6f3", paper: "#ffffff" },
    text: { primary: "#1c2723", secondary: "#5e6b65" },
    divider: "#e2e7e3",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-app), Arial, Helvetica, sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { textTransform: "none", fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: "0.08em" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          variants: [
            {
              // Карточки на страницах: мягкая тень и тонкая рамка вместо «парящей» тени
              props: { variant: "elevation", elevation: 1 },
              style: {
                border: "1px solid #e2e7e3",
                boxShadow:
                  "0 1px 2px rgba(16, 40, 30, 0.04), 0 4px 16px rgba(16, 40, 30, 0.05)",
              },
            },
          ],
        },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});

export default theme;
