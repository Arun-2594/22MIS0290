/**
 * NotificationCard Component
 * Displays a single notification with read/unread styling.
 */

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

// Color mapping for notification types
const TYPE_COLORS = {
  Placement: "success",
  Result: "primary",
  Event: "warning",
};

const TYPE_BG = {
  Placement: "#e8f5e9",
  Result: "#e3f2fd",
  Event: "#fff8e1",
};

/**
 * Format ISO timestamp to readable string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * NotificationCard
 * @param {object} notification - Notification object
 * @param {boolean} isRead - Whether this notification has been read
 * @param {function} onRead - Callback when card is clicked
 * @param {number} priorityScore - Optional priority score to display
 */
function NotificationCard({ notification, isRead, onRead, priorityScore }) {
  const { ID, Type, Message, Timestamp } = notification;

  return (
    <Card
      onClick={() => onRead && onRead(ID)}
      sx={{
        mb: 1.5,
        cursor: "pointer",
        border: isRead ? "1px solid #e0e0e0" : "1.5px solid #1976d2",
        backgroundColor: isRead ? "#fafafa" : TYPE_BG[Type] || "#fff",
        boxShadow: isRead ? 1 : 3,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-1px)",
        },
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Unread indicator dot */}
      {!isRead && (
        <CircleIcon
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 12,
            color: "#1976d2",
          }}
        />
      )}

      <CardContent sx={{ pb: "12px !important" }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={0.5}
        >
          <Chip
            label={Type}
            color={TYPE_COLORS[Type] || "default"}
            size="small"
            sx={{ fontWeight: 600, fontSize: "0.72rem" }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(Timestamp)}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            fontWeight: isRead ? 400 : 600,
            color: isRead ? "text.secondary" : "text.primary",
            mt: 0.5,
          }}
        >
          {Message}
        </Typography>

        {/* Show priority score if provided (Priority Inbox) */}
        {priorityScore !== undefined && (
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            Priority Score: {priorityScore.toFixed(3)}
          </Typography>
        )}

        {/* Show read/unread label */}
        <Typography
          variant="caption"
          sx={{ color: isRead ? "#9e9e9e" : "#1976d2", fontStyle: "italic" }}
        >
          {isRead ? "Read" : "New"}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default NotificationCard;
