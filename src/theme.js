import { createTheme } from "@mui/material/styles";

export const defaultTheme = createTheme();
export const badgeTheme = createTheme({
  ...defaultTheme,
  palette: {
    ...defaultTheme.palette,
    secondary: {
      main: "#666666",
    },
  },
});
