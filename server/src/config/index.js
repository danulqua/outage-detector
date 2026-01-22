import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Extract and validate environment variables
const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const DEVICE_SECRET = process.env.DEVICE_SECRET;

// Validate required environment variables
if (!BOT_TOKEN || !CHAT_ID || !DEVICE_SECRET) {
  console.error("Missing BOT_TOKEN, CHAT_ID or DEVICE_SECRET in .env");
  process.exit(1);
}

// Export configuration object
export const config = {
  PORT,
  BOT_TOKEN,
  CHAT_ID,
  DEVICE_SECRET,
};
