/**
 * Stage 1 - Priority Inbox
 * Fetches notifications from the API and returns top N by priority score.
 * Priority Score = type_weight × recency_factor
 */

const logger = require("../logging_middleware/logger");

const API_URL = "http://4.224.186.213/evaluation-service/notifications";
const AUTH_URL = "http://4.224.186.213/evaluation-service/auth";

const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

// ─── FILL IN YOUR CREDENTIALS (same as logging_middleware/logger.js) ─────────
const CREDENTIALS = {
  email: "YOUR_EMAIL@college.edu",
  name: "YOUR_NAME",
  rollNo: "YOUR_ROLL_NUMBER",
  accessCode: "YOUR_ACCESS_CODE",
  clientID: "YOUR_CLIENT_ID",
  clientSecret: "YOUR_CLIENT_SECRET",
};
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthToken() {
  await logger.info("auth", "Requesting auth token for notifications API");
  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });
  if (!response.ok) {
    await logger.error("auth", `Auth failed: ${response.status}`);
    throw new Error(`Auth failed: ${response.status}`);
  }
  const data = await response.json();
  await logger.info("auth", "Auth token obtained successfully");
  return data.access_token;
}

async function fetchNotifications(token) {
  await logger.info("service", `Fetching notifications from: ${API_URL}`);
  const response = await fetch(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await logger.error("service", `Notifications API failed: ${response.status}`);
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  await logger.info("service", `Fetched ${data.notifications?.length ?? 0} notifications`);
  return data.notifications || [];
}

function calculateRecencyFactor(timestamp, maxAgeMinutes = 60) {
  const ageInMinutes = (Date.now() - new Date(timestamp)) / (1000 * 60);
  if (ageInMinutes >= maxAgeMinutes) return 0.01;
  return 1 - ageInMinutes / maxAgeMinutes;
}

function computePriorityScore(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type] ?? 1;
  const recencyFactor = calculateRecencyFactor(notification.Timestamp);
  return typeWeight * recencyFactor;
}

async function getTopPriorityNotifications(token, n = 10) {
  await logger.info("domain", `Computing priority inbox. TopN=${n}`);
  const notifications = await fetchNotifications(token);
  const scored = notifications.map((n) => ({ ...n, priorityScore: computePriorityScore(n) }));
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  const top = scored.slice(0, n);
  await logger.info("domain", `Priority computed. Total=${notifications.length}, Returning=${top.length}`);
  return top;
}

// --- Main Execution ---
(async () => {
  try {
    const N = parseInt(process.argv[2]) || 10;
    await logger.info("handler", `Stage 1 starting. N=${N}`);
    const token = await getAuthToken();
    const topNotifications = await getTopPriorityNotifications(token, N);

    process.stdout.write("\n=== TOP PRIORITY NOTIFICATIONS ===\n");
    for (let i = 0; i < topNotifications.length; i++) {
      const n = topNotifications[i];
      await logger.info(
        "handler",
        `#${i + 1} | Type:${n.Type} | Score:${n.priorityScore.toFixed(4)} | Msg:${n.Message} | Time:${n.Timestamp}`
      );
    }
    await logger.info("handler", "Stage 1 complete");
  } catch (err) {
    await logger.error("handler", `Stage 1 failed: ${err.message}`);
    process.exit(1);
  }
})();

module.exports = { getTopPriorityNotifications, computePriorityScore };
