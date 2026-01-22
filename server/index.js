import app from "./src/app.js";
import { config } from "./src/config/index.js";

// Start the server
app.listen(config.PORT, () => {
  console.log(`Listening on port ${config.PORT}`);
});
