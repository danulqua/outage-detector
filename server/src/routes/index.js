import express from "express";

import { authenticateDevice } from "../middleware/auth.middleware.js";
import { recordHeartbeat, getState } from "../services/watchdog.service.js";

const router = express.Router();

router.get("/hb", authenticateDevice, async (req, res) => {
  await recordHeartbeat();
  res.send("ok");
});

router.get("/status", (req, res) => {
  res.json(getState());
});

export default router;
