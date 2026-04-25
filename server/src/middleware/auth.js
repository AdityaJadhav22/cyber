import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

export const sessionTimeout = (req, res, next) => {
  const now = Date.now();
  const lastActivity = req.user?.lastActivityAt ? new Date(req.user.lastActivityAt).getTime() : now;
  const maxIdle = Number(process.env.SESSION_TIMEOUT_MS || 900000);

  if (now - lastActivity > maxIdle) {
    return res.status(440).json({ message: "Session expired due to inactivity" });
  }

  req.user.lastActivityAt = new Date(now);
  req.user.save().catch(() => {});
  next();
};
