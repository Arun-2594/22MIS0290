const LOG_API_URL = "/evaluation-service/logs";
const AUTH_API_URL = "/evaluation-service/auth";

// ─── FILL IN YOUR CREDENTIALS ────────────────────────────────────────────────
const CREDENTIALS = {
  email: "arun.a2022@vitstudent.ac.in",
  name: "arun a",
  rollNo: "22mis0290",
  accessCode: "SfFuWg",
  clientID: "d4bb321d-4a85-49a2-ac7e-14e54dfe9ea5",
  clientSecret: "pAcphnkhsCnUMdkW",
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

  
  if (level === "error" || level === "fatal") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else {
    console.info(formatted);
  }

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
