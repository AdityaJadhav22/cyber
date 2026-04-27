import { logAudit } from "../utils/audit.js";
import { fail } from "../utils/response.js";

export const fakeSalaryCanary = async (req, res) => {
  // Canary token endpoint: any access is treated as suspicious reconnaissance.
  await logAudit({
    actor: req.user?._id,
    action: "CANARY_TRIGGERED",
    message: "Unauthorized access to fake endpoint",
    metadata: { endpoint: "/api/fake-salary" },
    ip: req.ip,
    severity: "critical",
  });

  return fail(res, "Forbidden", 403);
};
