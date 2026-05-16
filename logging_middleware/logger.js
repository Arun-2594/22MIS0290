/**
 * Logging Middleware
 * Calls the Affordmed Log API: POST /evaluation-service/logs
 * Signature: Log(stack, level, package, message)
 *
 * Stack values:   "backend" | "frontend"
 * Level values:   "debug" | "info" | "warn" | "error" | "fatal"
 * Package (backend): cache, controller, cron_job, db, domain, handler, repository, route, service
 * Package (frontend): api, component, hook, page, state, style
 * Package (both):  auth, config, middleware, utils
 */

const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";
const AUTH_API_URL = "http://4.224.186.213/evaluation-service/auth";

// ─── FILL IN YOUR CREDENTIALS AFTER REGISTRATION ────────────────────────────
const CREDENTIALS = {
  email: "YOUR_EMAIL@college.edu",      // ← replace with your college email
  name: "YOUR_NAME",                    // ← replace with your name
  rollNo: "YOUR_ROLL_NUMBER",           // ← replace with your roll number
  accessCode: "YOUR_ACCESS_CODE",       // ← replace with code from your email
  clientID: "YOUR_CLIENT_ID",           // ← replace with registration response value
  clientSecret: "YOUR_CLIENT_SECRET",   // ← replace with registration response value
};
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiry = null;

/**
 * Get a valid Bearer token, fetching a new one if expired or missing.
 */
async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CREDENTIALS),
    });

    if (!response.ok) {
      process.stderr.write(`[LOGGER] Auth failed: ${response.status}\n`);
      return null;
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;
    process.stdout.write("[LOGGER] Auth token obtained\n");
    return cachedToken;
  } catch (err) {
    process.stderr.write(`[LOGGER] Auth error: ${err.message}\n`);
    return null;
  }
}

/**
 * Core Log function — matches the required Affordmed signature.
 * @param {string} stack   - "backend" | "frontend"
 * @param {string} level   - "debug" | "info" | "warn" | "error" | "fatal"
 * @param {string} pkg     - package name (see allowed values in docs)
 * @param {string} message - descriptive log message
 */
async function Log(stack, level, pkg, message) {
  const timestamp = new Date().toISOString();
  const localLine = `[${timestamp}] [${stack.toUpperCase()}] [${level.toUpperCase()}] [${pkg}] ${message}`;

  // Local output
  if (level === "error" || level === "fatal") {
    process.stderr.write(localLine + "\n");
  } else {
    process.stdout.write(localLine + "\n");
  }

  // Send to Affordmed Log API
  try {
    const token = await getAuthToken();
    if (!token) {
      process.stderr.write("[LOGGER] Skipping remote log — no auth token\n");
      return null;
    }

    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });

    if (!response.ok) {
      process.stderr.write(`[LOGGER] Log API error: ${response.status}\n`);
      return null;
    }

    return await response.json(); // { logID, message: "log created successfully" }
  } catch (err) {
    process.stderr.write(`[LOGGER] Failed to send log: ${err.message}\n`);
    return null;
  }
}

// Convenience wrappers
const logger = {
  // Backend
  debug:  (pkg, msg) => Log("backend",  "debug", pkg, msg),
  info:   (pkg, msg) => Log("backend",  "info",  pkg, msg),
  warn:   (pkg, msg) => Log("backend",  "warn",  pkg, msg),
  error:  (pkg, msg) => Log("backend",  "error", pkg, msg),
  fatal:  (pkg, msg) => Log("backend",  "fatal", pkg, msg),

  // Frontend
  feDebug: (pkg, msg) => Log("frontend", "debug", pkg, msg),
  feInfo:  (pkg, msg) => Log("frontend", "info",  pkg, msg),
  feWarn:  (pkg, msg) => Log("frontend", "warn",  pkg, msg),
  feError: (pkg, msg) => Log("frontend", "error", pkg, msg),
  feFatal: (pkg, msg) => Log("frontend", "fatal", pkg, msg),

  // Raw
  Log,
};

module.exports = logger;
module.exports.Log = Log;
