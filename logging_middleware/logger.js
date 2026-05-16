const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";
const AUTH_API_URL = "http://4.224.186.213/evaluation-service/auth";

const CREDENTIALS = {
  email: "arun.a2022@vitstudent.ac.in",
  name: "arun a",
  rollNo: "22mis0290",
  accessCode: "SfFuWg",
  clientID: "d4bb321d-4a85-49a2-ac7e-14e54dfe9ea5",
  clientSecret: "pAcphnkhsCnUMdkW",
};

let cachedToken = null;
let tokenExpiry = null;

async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry - 60000) return cachedToken;
  const response = await fetch(AUTH_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });
  if (!response.ok) { process.stderr.write(`[LOGGER] Auth failed: ${response.status}\n`); return null; }
  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  process.stdout.write("[LOGGER] Auth token obtained\n");
  return cachedToken;
}

async function Log(stack, level, pkg, message) {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] [${stack.toUpperCase()}] [${level.toUpperCase()}] [${pkg}] ${message}\n`);

  const token = await getAuthToken();
  if (!token) return null;

  const payload = {};
  payload["stack"] = stack;
  payload["level"] = level;
  payload["package"] = pkg;
  payload["message"] = String(message).substring(0, 48).trim();

  process.stdout.write(`[LOGGER DEBUG] Sending: ${JSON.stringify(payload)}\n`);

  const response = await fetch(LOG_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    process.stderr.write(`[LOGGER] Log API error: ${response.status} | BODY: ${responseText}\n`);
    return null;
  }
  process.stdout.write(`[LOGGER] Log sent OK: ${responseText}\n`);
  return JSON.parse(responseText);
}

const logger = {
  debug: (pkg, msg) => Log("backend", "debug", pkg, msg),
  info:  (pkg, msg) => Log("backend", "info",  pkg, msg),
  warn:  (pkg, msg) => Log("backend", "warn",  pkg, msg),
  error: (pkg, msg) => Log("backend", "error", pkg, msg),
  fatal: (pkg, msg) => Log("backend", "fatal", pkg, msg),
  Log,
};

module.exports = logger;
module.exports.Log = Log;