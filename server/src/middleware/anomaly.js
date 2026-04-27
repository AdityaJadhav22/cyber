import { logAudit } from "../utils/audit.js";

const requestWindowMap = new Map();

export const detectRapidRequests = (req, _res, next) => {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const threshold = 120;

  const entry = requestWindowMap.get(key) || { count: 0, firstSeenAt: now };
  if (now - entry.firstSeenAt > windowMs) {
    entry.count = 0;
    entry.firstSeenAt = now;
  }
  entry.count += 1;
  requestWindowMap.set(key, entry);

  // Rule-based anomaly detection: excessive requests from one IP in a short window.
  if (entry.count === threshold + 1) {
    logAudit({
      actor: req.user?._id,
      action: "SUSPICIOUS_RAPID_REQUESTS",
      metadata: { ip: req.ip, requestsInMinute: entry.count, route: req.originalUrl },
      ip: req.ip,
      severity: "warning",
    });
  }

  next();
};
