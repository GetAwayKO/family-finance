"use client";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

interface PageProps {
  title: string;
  /** Кнопки справа от заголовка. */
  actions?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

/** Заголовок, действия и содержимое закрытой страницы. */
export default function Page({ title, actions, error, children }: PageProps) {
  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" component="h2" sx={{ mb: 0 }}>
          {title}
        </Typography>
        {actions}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {children}
    </Box>
  );
}
