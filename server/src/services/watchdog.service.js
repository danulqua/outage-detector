import { OUTAGE_THRESHOLD_MS, CHECK_EVERY_MS } from "../config/constants.js";
import { STATE } from "../constants.js";
import { sendTelegram } from "./telegram.service.js";

let lastSeenMs = 0;
let state = STATE.outage;
let stateChangedAt = Date.now(); // Track when state last changed

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 15m", "45s")
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Record a heartbeat from the device
 * Transitions state from OUTAGE to ON and sends notification
 */
export async function recordHeartbeat() {
  const now = Date.now();
  lastSeenMs = now;

  // Transition OUTAGE -> ON on first heartbeat after outage
  if (state === STATE.outage) {
    const outageDuration = now - stateChangedAt;
    const formattedDuration = formatDuration(outageDuration);

    state = STATE.on;
    stateChangedAt = now;

    await sendTelegram(
      `✅ Power/Internet is back online\n` +
      `Outage duration: ${formattedDuration}`
    );
  }
}

/**
 * Get the current state
 * @returns {{state: string, lastSeenMs: number, secondsAgo: number|null}}
 */
export function getState() {
  return {
    state,
    lastSeenMs,
    secondsAgo: lastSeenMs ? Math.round((Date.now() - lastSeenMs) / 1000) : null,
  };
}

/**
 * Start the watchdog interval
 * Checks periodically if device is still responding
 */
export function startWatchdog() {
  setInterval(async () => {
    const now = Date.now();

    if (state === STATE.on && lastSeenMs && (now - lastSeenMs) > OUTAGE_THRESHOLD_MS) {
      const uptimeDuration = now - stateChangedAt;
      const formattedUptime = formatDuration(uptimeDuration);

      state = STATE.outage;
      stateChangedAt = now;

      await sendTelegram(
        `⚠️ Power/Internet outage detected\n` +
        `Was online for: ${formattedUptime}`
      );
    }
  }, CHECK_EVERY_MS);

  console.log("Watchdog started");
}
