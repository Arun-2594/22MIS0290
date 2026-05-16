/**
 * App.js - Main application entry point
 * Handles routing between Priority Inbox and All Notifications pages.
 */

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import AllNotifications from "./pages/AllNotifications";
import PriorityInbox from "./pages/PriorityInbox";
import logger from "./utils/logger";

// MUI Theme
const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" },
    background: { default: "#f0f4f8" },
  },
  typography: {
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    logger.info("component", `Tab changed to: ${newValue === 0 ? "Priority Inbox" : "All Notifications"}`);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="sticky" elevation={2} sx={{ backgroundColor: "#1565c0" }}>
        <Toolbar>
          <NotificationsIcon sx={{ mr: 1 }} />
          <Typography
            variant={isMobile ? "body1" : "h6"}
            fontWeight={700}
            sx={{ flexGrow: 1 }}
          >
            Campus Notifications
          </Typography>
        </Toolbar>

        {/* Navigation Tabs */}
        <Box sx={{ backgroundColor: "#1976d2" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ px: isMobile ? 0 : 2 }}
          >
            <Tab
              icon={<StarIcon fontSize="small" />}
              iconPosition="start"
              label="Priority Inbox"
              sx={{ color: "#fff", fontWeight: 600, fontSize: isMobile ? "0.75rem" : "0.9rem" }}
            />
            <Tab
              icon={<FormatListBulletedIcon fontSize="small" />}
              iconPosition="start"
              label="All Notifications"
              sx={{ color: "#fff", fontWeight: 600, fontSize: isMobile ? "0.75rem" : "0.9rem" }}
            />
          </Tabs>
        </Box>
      </AppBar>

      {/* Main Content */}
      <Container
        maxWidth="md"
        sx={{ py: 3, px: isMobile ? 1.5 : 3, minHeight: "100vh" }}
      >
        {activeTab === 0 && <PriorityInbox />}
        {activeTab === 1 && <AllNotifications />}
      </Container>
    </ThemeProvider>
  );
}

export default App;
