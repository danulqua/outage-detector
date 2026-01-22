import express from "express";
import router from "./routes/index.js";

import { startWatchdog } from "./services/watchdog.service.js";

const app = express();

app.use(router);

startWatchdog();

export default app;
