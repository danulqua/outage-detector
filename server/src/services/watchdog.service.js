import { OUTAGE_THRESHOLD_MS, CHECK_EVERY_MS } from "../config/constants.js";
import { STATE } from "../constants.js";
import { sendTelegram } from "./telegram.service.js";
import {
  getOrCreateDevice,
  updateDeviceState,
  incrementOutageDuration,
  incrementOnlineDuration,
  updateLastSeen,
} from "./device.service.js";

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
 * Restore state from database on server startup
 */
export async function restoreState() {
  try {
    const device = await getOrCreateDevice();

    state = device.state;
    stateChangedAt = device.stateChangedAt.getTime();
    lastSeenMs = device.lastSeenMs || 0;

    console.log(`State restored: ${state} since ${new Date(stateChangedAt)}`);
    console.log(`Last seen: ${lastSeenMs ? new Date(lastSeenMs) : 'never'}`);
  } catch (error) {
    console.error("Failed to restore state from database:", error);
    throw error;
  }
}

/**
 * Record a heartbeat from the device
 * Transitions state from OUTAGE to ON and sends notification
 */
export async function recordHeartbeat() {
  const now = Date.now();
  lastSeenMs = now;

  try {
    await updateLastSeen(now);
  } catch (error) {
    console.error("Failed to persist lastSeenMs to database:", error);
    // Continue execution
  }

  // Transition OUTAGE -> ON on first heartbeat after outage
  if (state === STATE.outage) {
    const outageDuration = now - stateChangedAt;
    const formattedDuration = formatDuration(outageDuration);

    try {
      await incrementOutageDuration(outageDuration, new Date(stateChangedAt));
      await updateDeviceState(STATE.on, new Date(now));
    } catch (error) {
      console.error("Failed to persist state to database:", error);
      // Continue execution - notifications should still work
    }

    state = STATE.on;
    stateChangedAt = now;

    await sendTelegram(
      `*🟢 Power/Internet is back*\n` +
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

      try {
        await incrementOnlineDuration(uptimeDuration, new Date(stateChangedAt));
        await updateDeviceState(STATE.outage, new Date(now));
      } catch (error) {
        console.error("Failed to persist state to database:", error);
        // Continue execution - notifications should still work
      }

      state = STATE.outage;
      stateChangedAt = now;

      await sendTelegram(
        `*🔴 Power/Internet outage*\n` +
        `Was online for: ${formattedUptime}`
      );
    }
  }, CHECK_EVERY_MS);

  console.log("Watchdog started");
}
