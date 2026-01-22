import { config } from "../config/index.js";

/**
 * Send a message to Telegram
 * @param {string} text - The message text to send
 */
export async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.CHAT_ID,
        text,
        disable_web_page_preview: true,
        parse_mode: "MarkdownV2"
      }),
    });

    if (!res.ok) {
      console.error("Telegram error:", res.status, await res.text());
    }
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
  }
}
