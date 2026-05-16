/**
 * API Utility - Handles Notifications API calls
 */

import logger from "./logger";

const BASE_URL = "http://4.224.186.213/evaluation-service/notifications";
const AUTH_URL = "http://4.224.186.213/evaluation-service/auth";

const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

// ─── FILL IN YOUR CREDENTIALS ────────────────────────────────────────────────
const CREDENTIALS = {
  email: "YOUR_EMAIL@college.edu",
  name: "YOUR_NAME",
  rollNo: "YOUR_ROLL_NUMBER",
  accessCode: "YOUR_ACCESS_CODE",
  clientID: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
};
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiry = null;

export async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60000) return cachedToken;
  await logger.info("auth", "Requesting auth token");
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });
  if (!res.ok) {
    await logger.error("auth", `Auth failed: ${res.status}`);
    throw new Error(`Auth error: ${res.status}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  await logger.info("auth", "Auth token obtained");
  return cachedToken;
}

function calculateRecencyFactor(timestamp, maxAgeMinutes = 60) {
  const ageInMinutes = (Date.now() - new Date(timestamp)) / (1000 * 60);
  if (ageInMinutes >= maxAgeMinutes) return 0.01;
  return 1 - ageInMinutes / maxAgeMinutes;
}

export function computePriorityScore(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] ?? 1;
  const recencyFactor = calculateRecencyFactor(notification.Timestamp);
  return typeWeight * recencyFactor;
}

export async function fetchNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", params.limit);
  if (params.page) query.set("page", params.page);
  if (params.notification_type) query.set("notification_type", params.notification_type);

  const url = `${BASE_URL}${query.toString() ? "?" + query.toString() : ""}`;
  await logger.info("api", `Fetching notifications. Params: ${JSON.stringify(params)}`);

  try {
    const token = await getAuthToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      await logger.error("api", `Notifications API failed: ${response.status}`);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    await logger.info("api", `Fetched ${data.notifications?.length ?? 0} notifications`);
    return data.notifications || [];
  } catch (err) {
    await logger.error("api", `fetchNotifications failed: ${err.message}`);
    throw err;
  }
}

export async function fetchPriorityNotifications(n = 10) {
  await logger.info("api", `Fetching priority notifications. TopN=${n}`);
  const notifications = await fetchNotifications();
  const scored = notifications.map((notif) => ({
    ...notif,
    priorityScore: computePriorityScore(notif),
  }));
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  const top = scored.slice(0, n);
  await logger.info("api", `Priority computed. Returning top ${top.length}`);
  return top;
}
