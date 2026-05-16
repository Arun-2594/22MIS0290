/**
 * useReadNotifications hook
 * Tracks which notification IDs have been read using localStorage.
 */

import { useState, useCallback } from "react";
import logger from "../utils/logger";

const STORAGE_KEY = "read_notification_ids";

function getReadIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (err) {
    logger.warn("hook", `Failed to save read IDs to localStorage: ${err.message}`);
  }
}

export function useReadNotifications() {
  const [readIds, setReadIds] = useState(() => getReadIds());

  const markAsRead = useCallback((id) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const updated = new Set(prev);
      updated.add(id);
      saveReadIds(updated);
      logger.debug("hook", `Notification marked as read. ID=${id}`);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback((notifications) => {
    setReadIds((prev) => {
      const updated = new Set(prev);
      notifications.forEach((n) => updated.add(n.ID));
      saveReadIds(updated);
      logger.info("hook", `All notifications marked as read. Count=${notifications.length}`);
      return updated;
    });
  }, []);

  const isRead = useCallback((id) => readIds.has(id), [readIds]);

  return { isRead, markAsRead, markAllAsRead };
}
