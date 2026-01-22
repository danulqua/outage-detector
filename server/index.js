import app from "./src/app.js";
import { config } from "./src/config/index.js";

app.listen(config.PORT, () => {
  console.log(`Listening on port ${config.PORT}`);
});
