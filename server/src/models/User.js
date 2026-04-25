import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ["Admin", "HR Manager", "Employee", "Auditor"],
      default: "Employee",
    },
    department: { type: String, trim: true, maxlength: 80, default: "" },
    salary: { type: Number, min: 0, default: 0 },
    address: { type: String, trim: true, maxlength: 255, default: "" },
    mfaEnabled: { type: Boolean, default: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    lastActivityAt: { type: Date, default: Date.now },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
