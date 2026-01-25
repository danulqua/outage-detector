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

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., "2h 15m", "45s")
 */
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}д`);
  if (hours > 0) parts.push(`${hours}г`);
  if (minutes > 0) parts.push(`${minutes}хв`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}с`);

  return parts.join(' ');
}

/**
 * Record a heartbeat from the device
 * Transitions state from OUTAGE to ON and sends notification
 */
export async function recordHeartbeat() {
  const currentDate = new Date();
  const now = currentDate.getTime();

  try {
    await updateLastSeen(currentDate);
  } catch (error) {
    console.error("Failed to persist lastSeenAt to database:", error);
    // Continue execution
  }
  
  const device = await getOrCreateDevice();

  // Transition OUTAGE -> ON on first heartbeat after outage
  if (device.state === STATE.outage) {

    const outageDuration = now - device.stateChangedAt.getTime();
    const formattedDuration = formatDuration(outageDuration);

    try {
      await incrementOutageDuration(outageDuration, device.stateChangedAt);
      await updateDeviceState(STATE.on, currentDate);
    } catch (error) {
      console.error("Failed to persist state to database:", error);
      // Continue execution - notifications should still work
    }

    await sendTelegram(
      `*🟢 Світло є 🥳*\n` +
      `⏱️ Без світла: \`${formattedDuration}\``
    );
  }
}

/**
 * Get the current state
 * @returns {{state: string, lastSeenAt: Date|null, secondsAgo: number|null}}
 */
export async function getState() {
  const device = await getOrCreateDevice();

  return {
    state: device.state,
    lastSeenAt: device.lastSeenAt,
    secondsAgo: device.lastSeenAt ? Math.round((Date.now() - device.lastSeenAt.getTime()) / 1000) : null,
  };
}

/**
 * Start the watchdog interval
 * Checks periodically if device is still responding
 */
export function startWatchdog() {
  setInterval(async () => {
    const device = await getOrCreateDevice();

    const currentDate = new Date();
    const now = currentDate.getTime();

    if (device.state === STATE.on && device.lastSeenAt && (now - device.lastSeenAt.getTime()) > OUTAGE_THRESHOLD_MS) {
      const uptimeDuration = now - device.stateChangedAt.getTime();
      const formattedUptime = formatDuration(uptimeDuration);

      try {
        await incrementOnlineDuration(uptimeDuration, device.stateChangedAt);
        await updateDeviceState(STATE.outage, currentDate);
      } catch (error) {
        console.error("Failed to persist state to database:", error);
        // Continue execution - notifications should still work
      }

      await sendTelegram(
        `*🔴 Світла немає 😭*\n` +
        `⏱️ Зі світлом: \`${formattedUptime}\``
      );
    }
  }, CHECK_EVERY_MS);

  console.log("Watchdog started");
}
