/**
 * Logging Middleware - Frontend (Browser)
 * Calls the Affordmed Log API: POST /evaluation-service/logs
 * Signature: Log(stack, level, package, message)
 *
 * Frontend packages: api, component, hook, page, state, style, auth, config, middleware, utils
 */

const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";
const AUTH_API_URL = "http://4.224.186.213/evaluation-service/auth";

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

async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60000) return cachedToken;

  try {
    const res = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CREDENTIALS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = now + data.expires_in * 1000;
    return cachedToken;
  } catch {
    return null;
  }
}

/**
 * Core Log function matching required signature.
 * @param {string} stack   - "frontend"
 * @param {string} level   - "debug"|"info"|"warn"|"error"|"fatal"
 * @param {string} pkg     - frontend package name
 * @param {string} message - log message
 */
async function Log(stack, level, pkg, message) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${stack.toUpperCase()}] [${level.toUpperCase()}] [${pkg}] ${message}`;

  // Local browser output
  if (level === "error" || level === "fatal") {
    // eslint-disable-next-line no-console
    console.error(formatted);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(formatted);
  } else {
    // eslint-disable-next-line no-console
    console.info(formatted);
  }

  // Send to Affordmed Log API
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const res = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Frontend convenience wrappers
const logger = {
  debug: (pkg, msg) => Log("frontend", "debug", pkg, msg),
  info:  (pkg, msg) => Log("frontend", "info",  pkg, msg),
  warn:  (pkg, msg) => Log("frontend", "warn",  pkg, msg),
  error: (pkg, msg) => Log("frontend", "error", pkg, msg),
  fatal: (pkg, msg) => Log("frontend", "fatal", pkg, msg),
  Log,
};

export default logger;
export { Log };
