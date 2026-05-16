/**
 * PriorityInbox Page
 * Displays top N priority notifications, sorted by priority score.
 * User can select N (10, 15, 20).
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationCard from "../components/NotificationCard";
import { fetchPriorityNotifications } from "../utils/api";
import { useReadNotifications } from "../hooks/useReadNotifications";
import logger from "../utils/logger";

const TOP_N_OPTIONS = [10, 15, 20];

function PriorityInbox() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(10);

  const { isRead, markAsRead, markAllAsRead } = useReadNotifications();

  const loadPriorityNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    logger.info("page", `Loading priority inbox. TopN=${topN}`);

    try {
      const data = await fetchPriorityNotifications(topN);
      setNotifications(data);
      logger.info("page", `Priority inbox loaded. Count=${data.length}`);
    } catch (err) {
      logger.error("page", `Failed to load priority notifications: ${err.message}`);
      setError("Failed to load priority notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [topN]);

  useEffect(() => {
    loadPriorityNotifications();
  }, [loadPriorityNotifications]);

  const unreadCount = notifications.filter((n) => !isRead(n.ID)).length;

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <StarIcon sx={{ color: "#f9a825" }} />
          <Typography variant="h5" fontWeight={700}>
            Priority Inbox
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Top N</InputLabel>
            <Select
              value={topN}
              label="Top N"
              onChange={(e) => {
                setTopN(e.target.value);
                logger.info("page", `Top N changed to: ${e.target.value}`);
              }}
            >
              {TOP_N_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  Top {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadPriorityNotifications}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => markAllAsRead(notifications)}
            disabled={loading || notifications.length === 0}
          >
            Mark All Read
          </Button>
        </Stack>
      </Box>

      {/* Priority explanation */}
      <Alert severity="info" sx={{ mb: 2 }}>
        Notifications ranked by: <strong>Type Weight</strong> (Placement &gt; Result &gt; Event) ×{" "}
        <strong>Recency</strong> (more recent = higher priority)
      </Alert>

      <Divider sx={{ mb: 2 }} />

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {/* Priority Notifications List */}
      {!loading &&
        notifications.map((notif, index) => (
          <Box key={notif.ID} display="flex" alignItems="flex-start" gap={1}>
            {/* Rank badge */}
            <Typography
              variant="body2"
              sx={{
                minWidth: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: index < 3 ? "#f9a825" : "#e0e0e0",
                color: index < 3 ? "#fff" : "#555",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                mt: 1,
                fontSize: "0.75rem",
                flexShrink: 0,
              }}
            >
              {index + 1}
            </Typography>

            <Box flex={1}>
              <NotificationCard
                notification={notif}
                isRead={isRead(notif.ID)}
                onRead={markAsRead}
                priorityScore={notif.priorityScore}
              />
            </Box>
          </Box>
        ))}
    </Box>
  );
}

export default PriorityInbox;
