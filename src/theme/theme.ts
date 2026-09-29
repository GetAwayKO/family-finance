"use client";
import { createTheme } from "@mui/material/styles";

// Цвета взяты из текущих стилей хедера и сайдбара
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: "#2e7d32" },
    secondary: { main: "#afdd89" },
    background: { default: "#ffffff" },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
  },
});

export default theme;
