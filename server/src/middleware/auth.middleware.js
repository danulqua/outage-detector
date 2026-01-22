import { config } from "../config/index.js";

/**
 * Middleware to authenticate device using secret query parameter
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export function authenticateDevice(req, res, next) {
  const secret = String(req.query.secret || "");

  if (secret !== config.DEVICE_SECRET) {
    return res.status(403).send("Forbidden");
  }

  next();
}
