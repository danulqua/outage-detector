import express from "express";

import { startWatchdog, restoreState } from "./services/watchdog.service.js";
import { connectDatabase } from "./config/database.js";
import router from "./routes/index.js";

const app = express();

app.use(router);

(async () => {
  try {
    await connectDatabase();
    await restoreState();
    startWatchdog();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
})();

export default app;
