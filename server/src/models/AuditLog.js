import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
