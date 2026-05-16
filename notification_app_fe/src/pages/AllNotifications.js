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
  Pagination,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationCard from "../components/NotificationCard";
import { fetchNotifications } from "../utils/api";
import { useReadNotifications } from "../hooks/useReadNotifications";
import logger from "../utils/logger";

const PAGE_SIZE = 10;
const NOTIFICATION_TYPES = ["All", "Placement", "Result", "Event"];

function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { isRead, markAsRead, markAllAsRead } = useReadNotifications();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    logger.info("page", `Loading all notifications. Page=${page} Filter=${filterType}`);

    try {
      const params = {
        limit: PAGE_SIZE,
        page,
      };
      if (filterType !== "All") {
        params.notification_type = filterType;
      }

      const data = await fetchNotifications(params);
      setNotifications(data);

      // Estimate total pages (API doesn't return total count, so use fetched count)
      setTotalPages(data.length === PAGE_SIZE ? page + 1 : page);
    } catch (err) {
      logger.error("page", `Failed to load notifications: ${err.message}`);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
    logger.info("page", `Filter changed to: ${e.target.value}`);
  };

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
        <Typography variant="h5" fontWeight={700}>
          All Notifications
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              label="Filter by Type"
              onChange={handleFilterChange}
            >
              {NOTIFICATION_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadNotifications}
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
        <Alert severity="info">No notifications found for this filter.</Alert>
      )}

      {/* Notifications List */}
      {!loading &&
        notifications.map((notif) => (
          <NotificationCard
            key={notif.ID}
            notification={notif}
            isRead={isRead(notif.ID)}
            onRead={markAsRead}
          />
        ))}

      {/* Pagination */}
      {!loading && notifications.length > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => {
              setPage(val);
              logger.info("page", `Page changed to: ${val}`);
            }}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default AllNotifications;
