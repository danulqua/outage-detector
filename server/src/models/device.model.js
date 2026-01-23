import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    state: {
      type: String,
      enum: ["OUTAGE", "ON"],
      required: true,
    },
    stateChangedAt: {
      type: Date,
      required: true,
    },
    lastSeenMs: {
      type: Number,
      default: 0,
    },
    totalOutageDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOnlineDurationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastOutageStartedAt: {
      type: Date,
      default: null,
    },
    lastOnlineStartedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ deviceId: 1 });

export const Device = mongoose.model("Device", deviceSchema);
