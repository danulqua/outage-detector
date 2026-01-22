import { OUTAGE_THRESHOLD_MS, CHECK_EVERY_MS } from "../config/constants.js";
import { STATE } from "../constants.js";
import { sendTelegram } from "./telegram.service.js";

let lastSeenMs = 0;
let state = STATE.outage;

/**
 * Record a heartbeat from the device
 * Transitions state from OUTAGE to ON and sends notification
 */
export async function recordHeartbeat() {
  lastSeenMs = Date.now();

  // Transition OUTAGE -> ON on first heartbeat after outage
  if (state === STATE.outage) {
    state = STATE.on;
    await sendTelegram("✅ Electricity is back online");
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
      state = STATE.outage;
      await sendTelegram("⚠️ Electricity outage detected");
    }
  }, CHECK_EVERY_MS);

  console.log("Watchdog started");
}
