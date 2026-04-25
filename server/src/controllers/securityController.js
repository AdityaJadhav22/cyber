import { logAudit } from "../utils/audit.js";

export const fakeSalaryCanary = async (req, res) => {
  await logAudit({
    actor: req.user?._id,
    action: "CANARY_TOKEN_TRIGGERED",
    metadata: { endpoint: "/api/fake-salary" },
    ip: req.ip,
    severity: "critical",
  });

  res.status(403).json({ message: "Alert generated: unauthorized canary endpoint access logged" });
};
