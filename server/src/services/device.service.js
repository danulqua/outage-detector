import { Device } from "../models/device.model.js";
import { STATE } from "../constants.js";

const DEVICE_ID = "default";

/**
 * Get the device document or create it if it doesn't exist
 */
export async function getOrCreateDevice() {
  try {
    let device = await Device.findOne({ deviceId: DEVICE_ID });

    if (!device) {
      // Create initial device document with OUTAGE state
      device = await Device.create({
        deviceId: DEVICE_ID,
        state: STATE.outage,
        stateChangedAt: new Date(),
        lastSeenAt: null,
        totalOutageDurationMs: 0,
        totalOnlineDurationMs: 0,
        lastOutageStartedAt: new Date(),
        lastOnlineStartedAt: null,
      });

      console.log("Created new device document in database");
    }

    return device;
  } catch (error) {
    console.error("Error getting or creating device:", error);
    throw error;
  }
}

/**
 * Update the current state of the device
 */
export async function updateDeviceState(state, stateChangedAt) {
  try {
    const updateData = {
      state,
      stateChangedAt,
    };

    if (state === STATE.outage) {
      updateData.lastOutageStartedAt = stateChangedAt;
    } else if (state === STATE.on) {
      updateData.lastOnlineStartedAt = stateChangedAt;
    }

    await Device.findOneAndUpdate({ deviceId: DEVICE_ID }, updateData, {
      new: true,
    });
  } catch (error) {
    console.error("Error updating device state:", error);
    throw error;
  }
}

/**
 * Increment the total outage duration
 */
export async function incrementOutageDuration(durationMs, startedAt) {
  try {
    await Device.findOneAndUpdate(
      { deviceId: DEVICE_ID },
      {
        $inc: { totalOutageDurationMs: durationMs },
        $set: { lastOutageStartedAt: startedAt },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error incrementing outage duration:", error);
    throw error;
  }
}

/**
 * Increment the total online duration
 */
export async function incrementOnlineDuration(durationMs, startedAt) {
  try {
    await Device.findOneAndUpdate(
      { deviceId: DEVICE_ID },
      {
        $inc: { totalOnlineDurationMs: durationMs },
        $set: { lastOnlineStartedAt: startedAt },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error incrementing online duration:", error);
    throw error;
  }
}

/**
 * Update the last seen timestamp
 */
export async function updateLastSeen(lastSeenAt) {
  try {
    await Device.findOneAndUpdate(
      { deviceId: DEVICE_ID },
      { lastSeenAt },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating last seen:", error);
    throw error;
  }
}
